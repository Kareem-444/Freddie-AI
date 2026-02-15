# backend/ai_engine/ai_models.py
"""
AI Models Configuration - 12 Models from Tiny to Massive
Models are downloaded from HuggingFace as GGUF files
"""

AI_MODULES = [
    # ==================== CODING MODELS ====================
    
    # Tiny - Ultra Fast
    {
        "id": "qwen2.5-coder-1.5b",
        "display_name": "Qwen2.5 Coder 1.5B",
        "description": "Fast and lightweight coding assistant - Perfect for quick tasks",
        "category": "coding",
        "size": "986 MB",
        "size_bytes": 986000000,
        "parameters": "1.5B",
        "context_length": 4096,
        "n_threads": 4,
        "hf_repo": "Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF",
        "hf_filename": "qwen2.5-coder-1.5b-instruct-q4_k_m.gguf",
        "recommended": True,
        "bundled": True,
        "speed": "⚡⚡⚡",
        "quality": "⭐⭐⭐"
    },
    
    # Small - Balanced
    {
        "id": "qwen2.5-coder-7b",
        "display_name": "Qwen2.5 Coder 7B",
        "description": "Advanced coding assistant - Best balance of speed and quality",
        "category": "coding",
        "size": "4.7 GB",
        "size_bytes": 4700000000,
        "parameters": "7B",
        "context_length": 8192,
        "n_threads": 6,
        "hf_repo": "Qwen/Qwen2.5-Coder-7B-Instruct-GGUF",
        "hf_filename": "qwen2.5-coder-7b-instruct-q4_k_m.gguf",
        "recommended": True,
        "bundled": False,
        "speed": "⚡⚡",
        "quality": "⭐⭐⭐⭐"
    },
    
    # Advanced Coding
    {
        "id": "deepseek-coder-6.7b",
        "display_name": "DeepSeek Coder 6.7B",
        "description": "Specialized coding model - Excellent for complex programming",
        "category": "coding",
        "size": "4.1 GB",
        "size_bytes": 4100000000,
        "parameters": "6.7B",
        "context_length": 16384,
        "n_threads": 6,
        "hf_repo": "TheBloke/deepseek-coder-6.7B-instruct-GGUF",
        "hf_filename": "deepseek-coder-6.7b-instruct.Q4_K_M.gguf",
        "recommended": False,
        "bundled": False,
        "speed": "⚡⚡",
        "quality": "⭐⭐⭐⭐⭐"
    },
    
    # Large Coding Model
    {
        "id": "codellama-13b",
        "display_name": "CodeLlama 13B",
        "description": "Meta's powerful code generation model",
        "category": "coding",
        "size": "7.4 GB",
        "size_bytes": 7400000000,
        "parameters": "13B",
        "context_length": 16384,
        "n_threads": 8,
        "hf_repo": "TheBloke/CodeLlama-13B-Instruct-GGUF",
        "hf_filename": "codellama-13b-instruct.Q4_K_M.gguf",
        "recommended": False,
        "bundled": False,
        "speed": "⚡",
        "quality": "⭐⭐⭐⭐⭐"
    },
    
    # ==================== GENERAL PURPOSE MODELS ====================
    
    # Tiny General
    {
        "id": "tinyllama-1.1b",
        "display_name": "TinyLlama 1.1B",
        "description": "Ultra-fast tiny model - For quick responses on any device",
        "category": "general",
        "size": "669 MB",
        "size_bytes": 669000000,
        "parameters": "1.1B",
        "context_length": 2048,
        "n_threads": 2,
        "hf_repo": "TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF",
        "hf_filename": "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf",
        "recommended": False,
        "bundled": False,
        "speed": "⚡⚡⚡",
        "quality": "⭐⭐"
    },
    
    # Small General
    {
        "id": "llama-3.2-3b",
        "display_name": "Llama 3.2 3B",
        "description": "General purpose AI assistant - Good for conversations",
        "category": "general",
        "size": "2.0 GB",
        "size_bytes": 2000000000,
        "parameters": "3B",
        "context_length": 4096,
        "n_threads": 4,
        "hf_repo": "bartowski/Llama-3.2-3B-Instruct-GGUF",
        "hf_filename": "Llama-3.2-3B-Instruct-Q4_K_M.gguf",
        "recommended": True,
        "bundled": False,
        "speed": "⚡⚡⚡",
        "quality": "⭐⭐⭐⭐"
    },
    
    # Medium General
    {
        "id": "llama-3.1-8b",
        "display_name": "Llama 3.1 8B",
        "description": "Meta's flagship model - Excellent reasoning and creativity",
        "category": "general",
        "size": "4.9 GB",
        "size_bytes": 4900000000,
        "parameters": "8B",
        "context_length": 8192,
        "n_threads": 6,
        "hf_repo": "bartowski/Meta-Llama-3.1-8B-Instruct-GGUF",
        "hf_filename": "Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf",
        "recommended": True,
        "bundled": False,
        "speed": "⚡⚡",
        "quality": "⭐⭐⭐⭐⭐"
    },
    
    # Large General - POWERFUL
    {
        "id": "llama-3.1-70b",
        "display_name": "Llama 3.1 70B",
        "description": "Massive model - GPT-4 class performance (Requires 32GB+ RAM)",
        "category": "general",
        "size": "40 GB",
        "size_bytes": 40000000000,
        "parameters": "70B",
        "context_length": 8192,
        "n_threads": 8,
        "hf_repo": "bartowski/Meta-Llama-3.1-70B-Instruct-GGUF",
        "hf_filename": "Meta-Llama-3.1-70B-Instruct-Q4_K_M.gguf",
        "recommended": False,
        "bundled": False,
        "speed": "⚡",
        "quality": "⭐⭐⭐⭐⭐",
        "requires_ram": "32GB+"
    },
    
    # ==================== CREATIVE MODELS ====================
    
    {
        "id": "mistral-7b",
        "display_name": "Mistral 7B",
        "description": "Creative writing and storytelling specialist",
        "category": "creative",
        "size": "4.4 GB",
        "size_bytes": 4400000000,
        "parameters": "7B",
        "context_length": 8192,
        "n_threads": 6,
        "hf_repo": "TheBloke/Mistral-7B-Instruct-v0.2-GGUF",
        "hf_filename": "mistral-7b-instruct-v0.2.Q4_K_M.gguf",
        "recommended": False,
        "bundled": False,
        "speed": "⚡⚡",
        "quality": "⭐⭐⭐⭐"
    },
    
    {
        "id": "mixtral-8x7b",
        "display_name": "Mixtral 8x7B",
        "description": "Mixture of Experts - Extremely creative and intelligent",
        "category": "creative",
        "size": "26 GB",
        "size_bytes": 26000000000,
        "parameters": "47B",
        "context_length": 32768,
        "n_threads": 8,
        "hf_repo": "TheBloke/Mixtral-8x7B-Instruct-v0.1-GGUF",
        "hf_filename": "mixtral-8x7b-instruct-v0.1.Q4_K_M.gguf",
        "recommended": False,
        "bundled": False,
        "speed": "⚡",
        "quality": "⭐⭐⭐⭐⭐",
        "requires_ram": "16GB+"
    },
    
    # ==================== MULTILINGUAL MODELS ====================
    
    {
        "id": "qwen2.5-14b",
        "display_name": "Qwen2.5 14B",
        "description": "Multilingual powerhouse - Excellent for multiple languages",
        "category": "multilingual",
        "size": "8.9 GB",
        "size_bytes": 8900000000,
        "parameters": "14B",
        "context_length": 32768,
        "n_threads": 8,
        "hf_repo": "Qwen/Qwen2.5-14B-Instruct-GGUF",
        "hf_filename": "qwen2.5-14b-instruct-q4_k_m.gguf",
        "recommended": False,
        "bundled": False,
        "speed": "⚡",
        "quality": "⭐⭐⭐⭐⭐"
    },
    
    {
        "id": "qwen2.5-32b",
        "display_name": "Qwen2.5 32B",
        "description": "Most advanced Qwen model - Top-tier multilingual AI",
        "category": "multilingual",
        "size": "18 GB",
        "size_bytes": 18000000000,
        "parameters": "32B",
        "context_length": 32768,
        "n_threads": 8,
        "hf_repo": "Qwen/Qwen2.5-32B-Instruct-GGUF",
        "hf_filename": "qwen2.5-32b-instruct-q4_k_m.gguf",
        "recommended": False,
        "bundled": False,
        "speed": "⚡",
        "quality": "⭐⭐⭐⭐⭐",
        "requires_ram": "16GB+"
    },
]


def get_module_by_id(module_id):
    """Get module configuration by ID"""
    return next((m for m in AI_MODULES if m["id"] == module_id), None)


def get_bundled_modules():
    """Get modules that should be bundled with installer"""
    return [m for m in AI_MODULES if m.get("bundled", False)]


def get_recommended_modules():
    """Get recommended modules for users"""
    return [m for m in AI_MODULES if m.get("recommended", False)]


def get_modules_by_category(category):
    """Get modules by category"""
    return [m for m in AI_MODULES if m.get("category") == category]


def get_all_modules():
    """Get all available modules"""
    return AI_MODULES


def get_categories():
    """Get all unique categories"""
    return list(set(m.get("category", "general") for m in AI_MODULES))