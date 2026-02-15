# backend/ai_engine/views.py
"""
Production Views with Background Download Support
"""
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import time
from .ai_models import AI_MODULES, get_module_by_id
from .model_manager import model_manager


@require_http_methods(["GET"])
def list_modules(request):
    """Return list of all available AI modules"""
    # Clean up finished downloads first
    model_manager.cleanup_finished_downloads()
    
    modules_with_status = []
    for module in AI_MODULES:
        module_copy = module.copy()
        module_copy["downloaded"] = model_manager.is_model_downloaded(module["id"])
        
        # Get download status
        download_status = model_manager.get_download_status(module["id"])
        module_copy["download_status"] = download_status
        
        # is_downloading flag
        module_copy["is_downloading"] = download_status.get("status") in ["downloading", "retrying"]
        
        modules_with_status.append(module_copy)
    
    return JsonResponse({
        "modules": modules_with_status,
        "timestamp": time.time()
    })


@require_http_methods(["GET"])
def list_downloaded_modules(request):
    """Return list of downloaded modules"""
    downloaded = model_manager.get_downloaded_models()
    
    modules_info = []
    for download in downloaded:
        module = get_module_by_id(download["id"])
        if module:
            module_copy = module.copy()
            module_copy["downloaded"] = True
            module_copy["local_path"] = download["path"]
            modules_info.append(module_copy)
    
    return JsonResponse({"modules": modules_info})


@csrf_exempt
@require_http_methods(["POST"])
def download_module(request):
    """Start background download"""
    try:
        data = json.loads(request.body)
        module_id = data.get("module_id")
        
        module = get_module_by_id(module_id)
        if not module:
            return JsonResponse({"error": "Module not found"}, status=404)
        
        # Check if already downloaded
        if model_manager.is_model_downloaded(module_id):
            return JsonResponse({
                "status": "already_downloaded",
                "message": f"{module['display_name']} is already downloaded",
                "module_id": module_id
            })
        
        # Check if already downloading
        current_status = model_manager.get_download_status(module_id)
        if current_status.get("status") in ["downloading", "retrying"]:
            return JsonResponse({
                "status": "already_downloading",
                "message": f"{module['display_name']} is already being downloaded",
                "module_id": module_id,
                "progress": current_status.get("progress", 0)
            })
        
        # Start download in background PROCESS
        success = model_manager.download_model_async(module)
        
        if success:
            return JsonResponse({
                "status": "downloading",
                "message": f"Download started in background for {module['display_name']}",
                "module_id": module_id,
                "module": module
            })
        else:
            return JsonResponse({
                "status": "failed",
                "error": "Failed to start download (already in progress or locked)",
                "module_id": module_id
            }, status=500)
        
    except Exception as e:
        import traceback
        print(f"Error in download_module: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def cancel_download(request):
    """Cancel an ongoing download"""
    try:
        data = json.loads(request.body)
        module_id = data.get("module_id")
        
        module = get_module_by_id(module_id)
        if not module:
            return JsonResponse({"error": "Module not found"}, status=404)
        
        success = model_manager.cancel_download(module_id)
        
        if success:
            return JsonResponse({
                "status": "cancelled",
                "message": f"Download cancelled for {module['display_name']}",
                "module_id": module_id
            })
        else:
            return JsonResponse({
                "status": "not_downloading",
                "message": f"{module['display_name']} is not downloading",
                "module_id": module_id
            }, status=404)
            
    except Exception as e:
        import traceback
        print(f"Error in cancel_download: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)


@require_http_methods(["GET"])
def download_status(request, module_id):
    """Get download status for specific module"""
    module = get_module_by_id(module_id)
    if not module:
        return JsonResponse({"error": "Module not found"}, status=404)
    
    status = model_manager.get_download_status(module_id)
    status["module_id"] = module_id
    status["module"] = module
    
    return JsonResponse(status)


@csrf_exempt
@require_http_methods(["POST"])
def delete_module(request):
    """Delete a downloaded model"""
    try:
        data = json.loads(request.body)
        module_id = data.get("module_id")
        
        module = get_module_by_id(module_id)
        if not module:
            return JsonResponse({"error": "Module not found"}, status=404)
        
        success = model_manager.delete_model(module_id)
        
        if success:
            return JsonResponse({
                "status": "success",
                "message": f"{module['display_name']} deleted successfully",
                "module_id": module_id
            })
        else:
            return JsonResponse({
                "status": "not_found",
                "message": f"{module['display_name']} was not found",
                "module_id": module_id
            }, status=404)
            
    except Exception as e:
        import traceback
        print(f"Error in delete_module: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def load_module(request):
    """Load a model into memory"""
    try:
        data = json.loads(request.body)
        module_id = data.get("module_id")
        
        module = get_module_by_id(module_id)
        if not module:
            return JsonResponse({"error": "Module not found"}, status=404)
        
        if not model_manager.is_model_downloaded(module_id):
            return JsonResponse({
                "error": "Model not downloaded. Please download it first.",
                "module_id": module_id
            }, status=400)
        
        model_manager.load_model(module_id, module)
        
        return JsonResponse({
            "status": "success",
            "message": f"{module['display_name']} loaded successfully",
            "module_id": module_id,
            "module": module
        })
        
    except Exception as e:
        import traceback
        print(f"Error in load_module: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def chat(request):
    """Send a message to the AI"""
    try:
        data = json.loads(request.body)
        module_id = data.get("module_id")
        message = data.get("message")
        conversation_history = data.get("history", [])
        
        if not message:
            return JsonResponse({"error": "Message is required"}, status=400)
        
        module = get_module_by_id(module_id)
        if not module:
            return JsonResponse({"error": "Module not found"}, status=404)
        
        if model_manager.current_model_id != module_id:
            if not model_manager.is_model_downloaded(module_id):
                return JsonResponse({
                    "error": "Model not downloaded. Please download it first.",
                    "module_id": module_id
                }, status=400)
            
            model_manager.load_model(module_id, module)
        
        messages = []
        messages.append({
            "role": "system",
            "content": "You are Freddie AI, a helpful and intelligent assistant."
        })
        
        for msg in conversation_history[-10:]:
            messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })
        
        messages.append({
            "role": "user",
            "content": message
        })
        
        response_text = model_manager.chat_completion(
            messages=messages,
            max_tokens=512,
            temperature=0.7
        )
        
        return JsonResponse({
            "response": response_text,
            "module_name": module["display_name"],
            "module_id": module_id
        })
        
    except Exception as e:
        import traceback
        print(f"Error in chat: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)


@require_http_methods(["GET"])
def model_status(request):
    """Get current loaded model status"""
    if model_manager.current_model_id:
        module = get_module_by_id(model_manager.current_model_id)
        return JsonResponse({
            "loaded": True,
            "model_id": model_manager.current_model_id,
            "module": module
        })
    else:
        return JsonResponse({
            "loaded": False,
            "model_id": None,
            "module": None
        })


@require_http_methods(["GET"])
def all_downloads_status(request):
    """Lightweight endpoint - only active downloads"""
    downloads = {}
    
    for module in AI_MODULES:
        status = model_manager.get_download_status(module["id"])
        if status.get("status") in ["downloading", "retrying"]:
            downloads[module["id"]] = {
                "progress": status.get("progress", 0),
                "speed": status.get("speed", 0),
                "eta": status.get("eta", 0),
                "status": status.get("status"),
                "retries": status.get("retries", 0)
            }
    
    return JsonResponse({
        "downloads": downloads,
        "count": len(downloads)
    })