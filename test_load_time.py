import torch
import time
import os
import sys

# Add directory to path to import hybrid_model
sys.path.append(os.path.join(os.getcwd(), "backend", "analysis_service"))

try:
    from hybrid_model import DistilBERT_BiLSTM_Hybrid
except ImportError:
    print("Could not import hybrid_model. Check path.")
    sys.exit(1)

path = "backend/analysis_service/models/hybrid_model.pth"

print(f"Testing full load of {path}...")
start = time.time()

try:
    print("Initializing architecture...")
    model = DistilBERT_BiLSTM_Hybrid(
        num_labels=3,
        hidden_dim=256,
        lstm_layers=1,
        dropout_prob=0.3
    )
    print("Architecture initialized.")
    
    print("Loading state dict...")
    state_dict = torch.load(path, map_location="cpu")
    print(f"State dict loaded. Keys: {len(state_dict)}")
    
    print("Loading into model...")
    model.load_state_dict(state_dict)
    print("✅ Full PyTorch load success!")
    
    print("Testing XGBoost load...")
    xgb_path = "backend/analysis_service/models/xgboost_classifier.json"
    if os.path.exists(xgb_path):
        import xgboost as xgb
        xgb_model = xgb.XGBClassifier()
        xgb_model.load_model(xgb_path)
        print("✅ XGBoost load success!")
    else:
        print("❌ XGBoost file missing!")

    print(f"Time taken: {time.time() - start:.2f}s")

except Exception as e:
    print(f"Error: {e}")
    # print keys mismatch if any
    try:
        keys_model = set(model.state_dict().keys())
        keys_loaded = set(state_dict.keys())
        print(f"\nMissing keys: {keys_model - keys_loaded}")
        print(f"\nUnexpected keys: {keys_loaded - keys_model}")
    except:
        pass
    sys.exit(1)
