import os
import requests
import logging
from dotenv import load_dotenv
os.environ["OMP_NUM_THREADS"] = "1"
from flask import Flask, request, jsonify
from flask_cors import CORS
from hybrid_model import HybridMentalHealthModel

app = Flask(__name__)
CORS(app)

# Absolute path configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# Load .env files (backend/.env and root/.env)
load_dotenv(os.path.join(BASE_DIR, "..", ".env"))
load_dotenv(os.path.join(BASE_DIR, "..", "..", ".env"))

# Configuration
CONFIDENCE_HIGH = 0.7
CONFIDENCE_LOW = 0.4
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def call_groq_api(system_prompt: str, user_input: str) -> str:
    """
    Calls Groq API (Llama3-70b-8192) for text generation.
    Returns None if API key is missing or call fails.
    """
    if not GROQ_API_KEY:
        logger.warning("GROQ_API_KEY not found. Skipping external AI call.")
        return None

    try:
        url = "https://api.groq.com/openai/v1/chat/completions"
        
        payload = {
            "model": "llama3-70b-8192",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input}
            ],
            "temperature": 0.7,
            "max_tokens": 300
        }
        
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=5)
        response.raise_for_status()
        
        data = response.json()
        if "choices" in data and data["choices"]:
            return data["choices"][0]["message"]["content"]
            
    except Exception as e:
        logger.error(f"External AI API (Groq) call failed: {e}")
        return None
    
    return None

model = HybridMentalHealthModel(
    transformer_model_path=os.path.join(MODELS_DIR, "hybrid_model.pth"),
    xgboost_model_path=os.path.join(MODELS_DIR, "xgboost_classifier.json")
)

@app.route("/api/analyze", methods=["POST"])
def analyze():
    data = request.json or {}
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "Text required"}), 400

    try:
        result = model.predict(text)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/", methods=["GET"])
def home():
    return "Analysis Service Running", 200

if __name__ == "__main__":
    port = int(os.environ.get("MODEL_SERVICE_PORT", 5001))
    app.run(host="0.0.0.0", port=port)
