import os
os.environ["OMP_NUM_THREADS"] = "1"
from flask import Flask, request, jsonify
from flask_cors import CORS
from hybrid_model import HybridMentalHealthModel

app = Flask(__name__)
CORS(app)

# Absolute path configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

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
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)
