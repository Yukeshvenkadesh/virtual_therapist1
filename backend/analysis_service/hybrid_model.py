"""
Custom Hybrid DistilBERT-BiLSTM-XGBoost Model for Virtual Therapist
This module contains the model architecture and inference logic for the hybrid model.
"""

import torch
import torch.nn as nn
import numpy as np
import xgboost as xgb
from transformers import DistilBertModel, DistilBertTokenizer
import os
from typing import Dict, List, Tuple, Optional
import joblib

class DistilBERT_BiLSTM_Hybrid(nn.Module):
    """
    Hybrid model combining DistilBERT, BiLSTM, and XGBoost for mental health classification.
    """
    
    def __init__(self, num_labels: int = 3, hidden_dim: int = 256, lstm_layers: int = 1, dropout_prob: float = 0.3):
        super(DistilBERT_BiLSTM_Hybrid, self).__init__()
        self.distilbert = DistilBertModel.from_pretrained('distilbert-base-uncased')
        self.hidden_dim = hidden_dim
        self.num_labels = num_labels

        self.lstm = nn.LSTM(
            input_size=self.distilbert.config.dim,
            hidden_size=hidden_dim,
            num_layers=lstm_layers,
            bidirectional=True,
            batch_first=True,
            dropout=dropout_prob if lstm_layers > 1 else 0
        )
        
        self.classifier = nn.Sequential(
            nn.Dropout(dropout_prob),
            nn.Linear(hidden_dim * 2, num_labels)
        )

    def forward(self, input_ids, attention_mask):
        """
        Forward pass through DistilBERT and BiLSTM layers.
        Returns both features (for XGBoost) and logits (for direct classification).
        """
        distilbert_output = self.distilbert(input_ids=input_ids, attention_mask=attention_mask)
        sequence_output = distilbert_output.last_hidden_state

        lstm_output, (h_n, c_n) = self.lstm(sequence_output)
        final_state = torch.cat((h_n[-2, :, :], h_n[-1, :, :]), dim=1)

        return final_state, self.classifier(final_state)

class HybridModelInference:
    """
    Inference class for the hybrid DistilBERT-BiLSTM-XGBoost model.
    """
    
    def __init__(self, model_path: str, xgb_path: str, tokenizer_path: Optional[str] = None):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model_path = model_path
        self.xgb_path = xgb_path
        
        print(f"[HybridModel] Initializing with device: {self.device}")
        
        # Load tokenizer
        try:
            if tokenizer_path and os.path.exists(tokenizer_path):
                self.tokenizer = DistilBertTokenizer.from_pretrained(tokenizer_path)
            else:
                self.tokenizer = DistilBertTokenizer.from_pretrained('distilbert-base-uncased')
            print("[HybridModel] ✅ Tokenizer loaded successfully")
        except Exception as e:
            print(f"[HybridModel] ❌ Error loading tokenizer: {e}")
            raise
        
        # Initialize model
        try:
            self.model = DistilBERT_BiLSTM_Hybrid(
                num_labels=3,  # Based on your notebook: Anxiety, Bipolar, Depression
                hidden_dim=256,
                lstm_layers=1,
                dropout_prob=0.3
            )
            print("[HybridModel] ✅ Model initialized successfully")
        except Exception as e:
            print(f"[HybridModel] ❌ Error initializing model: {e}")
            raise
        
        # Load PyTorch model weights
        self._load_pytorch_model()
        
        # Load XGBoost model
        self._load_xgboost_model()
        
        # Set model to evaluation mode
        self.model.eval()
        
        # Label mapping (based on your notebook)
        self.label_map = {0: 'Anxiety', 1: 'Bipolar', 2: 'Depression'}
        self.labels = ['Anxiety', 'Bipolar', 'Depression']
    
    def _load_pytorch_model(self):
        """Load the PyTorch model weights."""
        try:
            if os.path.exists(self.model_path):
                state_dict = torch.load(self.model_path, map_location=self.device)
                self.model.load_state_dict(state_dict)
                print(f"✅ Loaded PyTorch model from {self.model_path}")
            else:
                print(f"⚠️ PyTorch model not found at {self.model_path}")
        except Exception as e:
            print(f"❌ Error loading PyTorch model: {e}")
            raise
    
    def _load_xgboost_model(self):
        """Load the XGBoost model."""
        try:
            if os.path.exists(self.xgb_path):
                self.xgb_model = xgb.XGBClassifier()
                self.xgb_model.load_model(self.xgb_path)
                print(f"✅ Loaded XGBoost model from {self.xgb_path}")
            else:
                print(f"⚠️ XGBoost model not found at {self.xgb_path}")
                self.xgb_model = None
        except Exception as e:
            print(f"❌ Error loading XGBoost model: {e}")
            self.xgb_model = None
    
    def preprocess_text(self, text: str, max_length: int = 256) -> Dict[str, torch.Tensor]:
        """Preprocess text for model input."""
        encoding = self.tokenizer.encode_plus(
            text,
            add_special_tokens=True,
            max_length=max_length,
            return_token_type_ids=False,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            return_tensors='pt'
        )
        
        return {
            'input_ids': encoding['input_ids'].to(self.device),
            'attention_mask': encoding['attention_mask'].to(self.device)
        }
    
    def predict(self, text: str) -> Dict[str, any]:
        """
        Make prediction using the hybrid model.
        Returns prediction results in the format expected by the API.
        """
        try:
            print(f"[HybridModel] Making prediction for text: {text[:50]}...")
            
            # Preprocess text
            inputs = self.preprocess_text(text)
            print("[HybridModel] Text preprocessed successfully")
            
            # Get features from DistilBERT-BiLSTM
            with torch.no_grad():
                print("[HybridModel] Running model forward pass...")
                features, logits = self.model(**inputs)
                print("[HybridModel] Model forward pass completed")
                
                # Convert to numpy safely
                features_np = features.cpu().numpy()
                print("[HybridModel] Features converted to numpy")
            
            # Use XGBoost for final prediction if available
            if self.xgb_model is not None:
                print("[HybridModel] Using XGBoost for prediction...")
                # Get XGBoost predictions
                xgb_pred = self.xgb_model.predict(features_np)[0]
                xgb_proba = self.xgb_model.predict_proba(features_np)[0]
                print("[HybridModel] XGBoost prediction completed")
                
                # Map to labels
                predicted_label = self.label_map[xgb_pred]
                
                # Create confidence scores
                confidence_scores = []
                for i, label in enumerate(self.labels):
                    confidence_scores.append({
                        "label": label,
                        "score": float(xgb_proba[i])
                    })
                
                # Sort by confidence
                confidence_scores.sort(key=lambda x: x["score"], reverse=True)
                
            else:
                print("[HybridModel] Using PyTorch model only...")
                # Fallback to PyTorch model only
                probs = torch.softmax(logits, dim=-1).cpu().numpy()[0]
                predicted_idx = np.argmax(probs)
                predicted_label = self.label_map[predicted_idx]
                
                # Create confidence scores
                confidence_scores = []
                for i, label in enumerate(self.labels):
                    confidence_scores.append({
                        "label": label,
                        "score": float(probs[i])
                    })
                
                # Sort by confidence
                confidence_scores.sort(key=lambda x: x["score"], reverse=True)
            
            print(f"[HybridModel] Prediction completed: {predicted_label}")
            return {
                "topPattern": predicted_label,
                "confidenceScores": confidence_scores
            }
            
        except Exception as e:
            print(f"❌ Error during prediction: {e}")
            import traceback
            traceback.print_exc()
            # Return fallback prediction
            return {
                "topPattern": "Anxiety",
                "confidenceScores": [
                    {"label": "Anxiety", "score": 0.4},
                    {"label": "Bipolar", "score": 0.3},
                    {"label": "Depression", "score": 0.3}
                ]
            }
    
    def get_model_info(self) -> Dict[str, any]:
        """Get information about the loaded model."""
        return {
            "model_type": "DistilBERT-BiLSTM-XGBoost Hybrid",
            "pytorch_model_loaded": os.path.exists(self.model_path),
            "xgboost_model_loaded": self.xgb_model is not None,
            "labels": self.labels,
            "device": str(self.device)
        }


class HybridMentalHealthModel(HybridModelInference):
    """
    Convenience wrapper that ensures model paths are resolved relative to this file.
    """

    def __init__(
        self,
        transformer_model_path: str = "model/mental_health_model.pth",
        xgboost_model_path: str = "model/xgboost_classifier.json",
        tokenizer_path: Optional[str] = None,
    ):
        base_dir = os.path.dirname(os.path.abspath(__file__))

        def resolve_path(path: str) -> str:
            if os.path.isabs(path):
                return path
            return os.path.join(base_dir, path)

        super().__init__(
            model_path=resolve_path(transformer_model_path),
            xgb_path=resolve_path(xgboost_model_path),
            tokenizer_path=tokenizer_path if (tokenizer_path and os.path.isabs(tokenizer_path)) else (
                os.path.join(base_dir, tokenizer_path) if tokenizer_path else None
            ),
        )

def create_model_save_script():
    """
    Create a script to help save your trained model in the correct format.
    """
    script_content = '''
# Script to save your hybrid model for Virtual Therapist
# Run this in your Colab notebook after training

import torch
import xgboost as xgb
import os

# Save PyTorch model
pytorch_path = "backend/analysis_service/model/mental_health_model.pth"
torch.save(model.state_dict(), pytorch_path)
print(f"PyTorch model saved to: {pytorch_path}")

# Save XGBoost model
xgb_path = "backend/analysis_service/model/xgboost_classifier.json"
xgb_model.save_model(xgb_path)
print(f"XGBoost model saved to: {xgb_path}")

# Create a combined model info file
model_info = {
    "pytorch_path": pytorch_path,
    "xgb_path": xgb_path,
    "labels": ["Anxiety", "Bipolar", "Depression"],
    "model_type": "DistilBERT-BiLSTM-XGBoost Hybrid"
}

import json
info_path = "backend/analysis_service/model/model_info.json"
with open(info_path, 'w') as f:
    json.dump(model_info, f, indent=2)
print(f"Model info saved to: {info_path}")
'''
    
    with open("/Users/adithyan/Desktop/RND/basepapers/virtual-therapist/backend/analysis_service/save_hybrid_model.py", "w") as f:
        f.write(script_content)
    
    print("✅ Created model saving script: save_hybrid_model.py")



























