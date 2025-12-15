#!/usr/bin/env python3
"""
Quick test script to verify model loading works correctly.
"""
import os
import sys

# Add model_service to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'model_service'))

def test_model_files():
    """Test that all model files exist."""
    print("=== Testing Model Files ===")
    model_dir = "model_service/model"
    files = {
        "Hybrid PyTorch": "distilbert_bilstm_hybrid.pth",
        "Standard Model": "mental_health_model.pth",
        "XGBoost": "xgboost_classifier.json"
    }
    
    all_exist = True
    for name, filename in files.items():
        path = os.path.join(model_dir, filename)
        exists = os.path.exists(path)
        if exists:
            size = os.path.getsize(path) / (1024 * 1024)  # MB
            print(f"✅ {name}: {filename} ({size:.1f} MB)")
        else:
            print(f"❌ {name}: {filename} - NOT FOUND")
            all_exist = False
    
    return all_exist

def test_imports():
    """Test that required modules can be imported."""
    print("\n=== Testing Imports ===")
    try:
        import torch
        print(f"✅ PyTorch: {torch.__version__}")
    except ImportError as e:
        print(f"❌ PyTorch: {e}")
        return False
    
    try:
        import transformers
        print(f"✅ Transformers: {transformers.__version__}")
    except ImportError as e:
        print(f"❌ Transformers: {e}")
        return False
    
    try:
        import xgboost
        print(f"✅ XGBoost: {xgboost.__version__}")
    except ImportError as e:
        print(f"❌ XGBoost: {e}")
        return False
    
    try:
        from flask import Flask
        print("✅ Flask")
    except ImportError as e:
        print(f"❌ Flask: {e}")
        return False
    
    return True

def test_hybrid_model_import():
    """Test that hybrid_model can be imported."""
    print("\n=== Testing Hybrid Model Import ===")
    try:
        from hybrid_model import HybridModelInference
        print("✅ HybridModelInference imported successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to import HybridModelInference: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Model Setup\n")
    
    files_ok = test_model_files()
    imports_ok = test_imports()
    model_import_ok = test_hybrid_model_import()
    
    print("\n=== Summary ===")
    if files_ok and imports_ok and model_import_ok:
        print("✅ All tests passed! Model setup looks good.")
        print("\nNext: Update .env with MongoDB credentials and start services.")
    else:
        print("❌ Some tests failed. Please check the errors above.")
        sys.exit(1)
