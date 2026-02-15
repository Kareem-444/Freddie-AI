# backend/ai_engine/model_manager.py
"""
Production-Grade Model Manager with Background Workers
- Separate download process (no GIL contention)
- Retry + Resume downloads
- Thread-safe status tracking
- No polling congestion
"""
import os
import threading
import multiprocessing
from pathlib import Path
from huggingface_hub import hf_hub_download
from llama_cpp import Llama
import time
import json
import hashlib
from filelock import FileLock
import requests


class DownloadWorker:
    """Separate process for downloading models (avoids GIL)"""
    
    @staticmethod
    def download_with_resume(module, status_file, lock_file):
        """Download model in separate process with retry and resume"""
        model_id = module["id"]
        
        try:
            print(f"🚀 [Worker Process] Starting download for {module['display_name']}")
            
            # Acquire lock to prevent duplicate downloads
            lock = FileLock(lock_file, timeout=1)
            
            try:
                with lock.acquire(timeout=1):
                    print(f"🔒 [Worker] Lock acquired for {model_id}")
                    
                    # Initialize status
                    DownloadWorker._update_status(status_file, {
                        "status": "downloading",
                        "progress": 0,
                        "downloaded_bytes": 0,
                        "total_bytes": module.get("size_bytes", 0),
                        "speed": 0,
                        "eta": 0,
                        "error": None,
                        "retries": 0
                    })
                    
                    # Download with automatic resume
                    max_retries = 3
                    for attempt in range(max_retries):
                        try:
                            print(f"📥 [Worker] Download attempt {attempt + 1}/{max_retries}")
                            
                            # Start monitoring in background thread
                            monitor_thread = threading.Thread(
                                target=DownloadWorker._monitor_file_size,
                                args=(module, status_file),
                                daemon=True
                            )
                            monitor_thread.start()
                            
                            # Download (will resume if interrupted)
                            local_path = hf_hub_download(
                                repo_id=module["hf_repo"],
                                filename=module["hf_filename"],
                                local_dir=str(Path("models")),
                                local_dir_use_symlinks=False,
                                resume_download=True,  # CRITICAL: Resume support
                                force_download=False,
                            )
                            
                            print(f"✅ [Worker] Download completed: {local_path}")
                            
                            # Mark as completed
                            DownloadWorker._update_status(status_file, {
                                "status": "completed",
                                "progress": 100,
                                "downloaded_bytes": module.get("size_bytes", 0),
                                "total_bytes": module.get("size_bytes", 0),
                                "speed": 0,
                                "eta": 0,
                                "error": None,
                                "retries": attempt
                            })
                            
                            return  # Success!
                            
                        except Exception as e:
                            print(f"⚠️ [Worker] Attempt {attempt + 1} failed: {str(e)}")
                            
                            if attempt < max_retries - 1:
                                wait_time = 2 ** attempt  # Exponential backoff
                                print(f"⏳ [Worker] Retrying in {wait_time}s...")
                                
                                DownloadWorker._update_status(status_file, {
                                    "status": "retrying",
                                    "progress": 0,
                                    "error": f"Retry {attempt + 1}/{max_retries}: {str(e)}",
                                    "retries": attempt + 1
                                })
                                
                                time.sleep(wait_time)
                            else:
                                raise  # Final attempt failed
                    
            except Exception as lock_error:
                if "Timeout" in str(lock_error):
                    print(f"⚠️ [Worker] Download already in progress for {model_id}")
                    DownloadWorker._update_status(status_file, {
                        "status": "failed",
                        "error": "Download already in progress"
                    })
                else:
                    raise
                    
        except Exception as e:
            import traceback
            error_msg = str(e)
            print(f"❌ [Worker] Download failed: {error_msg}")
            print(traceback.format_exc())
            
            DownloadWorker._update_status(status_file, {
                "status": "failed",
                "progress": 0,
                "downloaded_bytes": 0,
                "total_bytes": module.get("size_bytes", 0),
                "speed": 0,
                "eta": 0,
                "error": error_msg
            })
    
    @staticmethod
    def _monitor_file_size(module, status_file):
        """Monitor download progress by file size"""
        model_id = module["id"]
        filename = module["hf_filename"]
        total_size = module.get("size_bytes", 0)
        models_dir = Path("models")
        
        last_size = 0
        last_update = time.time()
        start_time = time.time()
        
        while True:
            try:
                # Check if download completed or failed
                status = DownloadWorker._read_status(status_file)
                if status.get("status") in ["completed", "failed"]:
                    break
                
                # Find downloading file
                current_size = 0
                for pattern in [filename, f"{filename}.incomplete", f"*.{filename}*"]:
                    for file in models_dir.glob(pattern):
                        if file.is_file():
                            current_size = file.stat().st_size
                            break
                    if current_size > 0:
                        break
                
                if current_size > 0:
                    now = time.time()
                    elapsed = now - last_update
                    
                    if elapsed >= 2.0:  # Update every 2 seconds (not 1!)
                        progress_percent = int((current_size / total_size) * 100) if total_size > 0 else 0
                        
                        # Calculate speed
                        bytes_diff = current_size - last_size
                        speed = bytes_diff / elapsed if elapsed > 0 else 0
                        
                        # Calculate ETA
                        remaining_bytes = total_size - current_size
                        eta = remaining_bytes / speed if speed > 0 else 0
                        
                        DownloadWorker._update_status(status_file, {
                            "status": "downloading",
                            "progress": progress_percent,
                            "downloaded_bytes": current_size,
                            "total_bytes": total_size,
                            "speed": speed,
                            "eta": eta,
                            "error": None
                        })
                        
                        last_size = current_size
                        last_update = now
                
                time.sleep(2)  # Check every 2 seconds
                
            except Exception as e:
                print(f"⚠️ [Monitor] Error: {str(e)}")
                time.sleep(2)
    
    @staticmethod
    def _update_status(status_file, status_dict):
        """Thread-safe status update"""
        lock_path = f"{status_file}.lock"
        lock = FileLock(lock_path, timeout=5)
        
        try:
            with lock:
                # Read existing status
                existing = {}
                if os.path.exists(status_file):
                    with open(status_file, 'r') as f:
                        existing = json.load(f)
                
                # Merge with new status
                existing.update(status_dict)
                existing["last_update"] = time.time()
                
                # Write atomically
                temp_file = f"{status_file}.tmp"
                with open(temp_file, 'w') as f:
                    json.dump(existing, f)
                os.replace(temp_file, status_file)
                
        except Exception as e:
            print(f"⚠️ Error updating status: {str(e)}")
    
    @staticmethod
    def _read_status(status_file):
        """Thread-safe status read"""
        if not os.path.exists(status_file):
            return {"status": "idle"}
        
        try:
            with open(status_file, 'r') as f:
                return json.load(f)
        except:
            return {"status": "idle"}


class ModelManager:
    def __init__(self):
        self.models_dir = Path("models")
        self.models_dir.mkdir(exist_ok=True)
        
        self.status_dir = Path("models/.status")
        self.status_dir.mkdir(exist_ok=True)
        
        self.locks_dir = Path("models/.locks")
        self.locks_dir.mkdir(exist_ok=True)
        
        self.current_model = None
        self.current_model_id = None
        
        # Track download processes (not threads!)
        self.download_processes = {}
    
    def _get_status_file(self, model_id):
        """Get status file path for model"""
        return self.status_dir / f"{model_id}.json"
    
    def _get_lock_file(self, model_id):
        """Get lock file path for model"""
        return self.locks_dir / f"{model_id}.lock"
    
    def is_model_downloaded(self, model_id):
        """Check if a model is already downloaded"""
        for file in self.models_dir.glob("*.gguf"):
            if model_id in file.name.lower():
                return True
        return False
    
    def get_downloaded_models(self):
        """Get list of downloaded models"""
        downloaded = []
        for file in self.models_dir.glob("*.gguf"):
            model_id = file.stem.rsplit('-', 1)[0] if '-' in file.stem else file.stem
            downloaded.append({
                "id": model_id,
                "path": str(file),
                "size": file.stat().st_size
            })
        return downloaded
    
    def download_model_async(self, module):
        """Start model download in SEPARATE PROCESS (not thread!)"""
        model_id = module["id"]
        
        # Check if already downloading
        if model_id in self.download_processes:
            process = self.download_processes[model_id]
            if process.is_alive():
                print(f"⚠️ Download already in progress for {model_id}")
                return False
            else:
                # Process finished, clean up
                del self.download_processes[model_id]
        
        # Check lock file
        lock_file = self._get_lock_file(model_id)
        if lock_file.exists():
            # Try to acquire lock
            lock = FileLock(lock_file, timeout=0.1)
            try:
                with lock.acquire(timeout=0.1):
                    pass  # Lock acquired, we can proceed
            except:
                print(f"⚠️ Download locked for {model_id}")
                return False
        
        status_file = self._get_status_file(model_id)
        
        # Clean old status
        if status_file.exists():
            status_file.unlink()
        
        print(f"🚀 Starting download PROCESS for {module['display_name']}")
        
        # Start download in SEPARATE PROCESS (avoids GIL!)
        process = multiprocessing.Process(
            target=DownloadWorker.download_with_resume,
            args=(module, str(status_file), str(lock_file)),
            daemon=False,  # Not daemon - we want it to finish
            name=f"Download-{model_id}"
        )
        process.start()
        self.download_processes[model_id] = process
        
        print(f"✅ Download process started: PID {process.pid}")
        return True
    
    def get_download_status(self, model_id):
        """Get current download status for a model"""
        status_file = self._get_status_file(model_id)
        
        if not status_file.exists():
            return {
                "status": "idle",
                "progress": 0,
                "downloaded_bytes": 0,
                "total_bytes": 0,
                "speed": 0,
                "eta": 0,
                "error": None
            }
        
        try:
            with open(status_file, 'r') as f:
                status = json.load(f)
            
            # Check if process is still alive
            if model_id in self.download_processes:
                process = self.download_processes[model_id]
                status["process_alive"] = process.is_alive()
                status["process_pid"] = process.pid if process.is_alive() else None
            
            return status
            
        except Exception as e:
            print(f"⚠️ Error reading status for {model_id}: {str(e)}")
            return {
                "status": "idle",
                "progress": 0,
                "error": str(e)
            }
    
    def cancel_download(self, model_id):
        """Cancel an ongoing download"""
        if model_id in self.download_processes:
            process = self.download_processes[model_id]
            if process.is_alive():
                print(f"🛑 Terminating download process for {model_id}")
                process.terminate()
                process.join(timeout=5)
                
                if process.is_alive():
                    print(f"⚠️ Force killing process for {model_id}")
                    process.kill()
                
                del self.download_processes[model_id]
                
                # Update status
                status_file = self._get_status_file(model_id)
                DownloadWorker._update_status(str(status_file), {
                    "status": "cancelled",
                    "error": "Download cancelled by user"
                })
                
                return True
        return False
    
    def cleanup_finished_downloads(self):
        """Clean up finished download processes"""
        to_remove = []
        for model_id, process in self.download_processes.items():
            if not process.is_alive():
                process.join(timeout=1)
                to_remove.append(model_id)
        
        for model_id in to_remove:
            del self.download_processes[model_id]
            print(f"🧹 Cleaned up finished process for {model_id}")
    
    def delete_model(self, model_id):
        """Delete a downloaded model"""
        try:
            # Cancel download if running
            self.cancel_download(model_id)
            
            # Delete model file
            for file in self.models_dir.glob("*.gguf"):
                if model_id in file.name.lower():
                    file.unlink()
                    print(f"🗑️ Deleted model: {file.name}")
                    
                    # Clear status
                    status_file = self._get_status_file(model_id)
                    if status_file.exists():
                        status_file.unlink()
                    
                    return True
            return False
        except Exception as e:
            print(f"❌ Error deleting model {model_id}: {str(e)}")
            return False
    
    def load_model(self, model_id, module):
        """Load a model into memory"""
        try:
            # Unload current model
            if self.current_model is not None:
                print(f"🔄 Unloading current model: {self.current_model_id}")
                del self.current_model
                self.current_model = None
                self.current_model_id = None
            
            # Find model file
            model_file = None
            for file in self.models_dir.glob("*.gguf"):
                if model_id in file.name.lower():
                    model_file = file
                    break
            
            if not model_file:
                raise FileNotFoundError(f"Model file not found for {model_id}")
            
            print(f"🔄 Loading model: {module['display_name']} from {model_file}")
            
            # Load model
            self.current_model = Llama(
                model_path=str(model_file),
                n_ctx=module.get("context_length", 2048),
                n_threads=module.get("n_threads", 4),
                n_gpu_layers=0,
                verbose=False
            )
            
            self.current_model_id = model_id
            print(f"✅ Model loaded successfully: {module['display_name']}")
            
        except Exception as e:
            print(f"❌ Error loading model {model_id}: {str(e)}")
            raise
    
    def chat_completion(self, messages, max_tokens=512, temperature=0.7):
        """Generate a chat completion"""
        if self.current_model is None:
            raise RuntimeError("No model loaded. Please load a model first.")
        
        try:
            prompt = self._format_messages(messages)
            
            response = self.current_model(
                prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                stop=["</s>", "User:", "Assistant:"],
                echo=False
            )
            
            return response["choices"][0]["text"].strip()
            
        except Exception as e:
            print(f"❌ Error in chat completion: {str(e)}")
            raise
    
    def _format_messages(self, messages):
        """Format messages for the model"""
        prompt = ""
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            
            if role == "system":
                prompt += f"System: {content}\n\n"
            elif role == "user":
                prompt += f"User: {content}\n\n"
            elif role == "assistant":
                prompt += f"Assistant: {content}\n\n"
        
        prompt += "Assistant: "
        return prompt


# Global model manager instance
model_manager = ModelManager()