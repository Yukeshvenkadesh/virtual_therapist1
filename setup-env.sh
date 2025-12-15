#!/bin/bash

set -e

# Virtual Therapist Environment Setup Script
echo "🔧 Setting up Virtual Therapist environment..."

# Create .env file if it doesn't exist
if [ -f ".env" ]; then
    echo "✅ .env file already exists. Remove it if you want to regenerate."
else
    echo "📝 Creating .env file..."
    read -p "Enter your MongoDB Atlas connection string (mongodb+srv://...): " atlas_uri

    if [ -z "$atlas_uri" ]; then
        echo "⚠️  No connection string entered. Using placeholder values."
        atlas_uri="mongodb+srv://<username>:<password>@<cluster-url>/virtual_therapist?retryWrites=true&w=majority"
    fi

    cat > .env << EOF
# Virtual Therapist Environment Variables
MONGODB_URI=$atlas_uri
MONGODB_DB=virtual_therapist
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
AUTH_API_URL=http://localhost:4000/api
ANALYSIS_API_URL=http://localhost:5001
ANALYSIS_SERVICE_URL=http://localhost:5001
FRONTEND_ORIGIN=http://localhost:3000
HYBRID_PYTORCH_PATH=./model_service/model/distilbert_bilstm_hybrid.pth
HYBRID_XGB_PATH=./model_service/model/xgboost_classifier.json
FRONTEND_PORT=3000
BACKEND_PORT=4000
MODEL_SERVICE_PORT=5001
EOF
    echo "✅ .env file created"
    echo "   Update MONGODB_URI with your actual Atlas credentials if you used the placeholder."
fi

# Create model directory if it doesn't exist
mkdir -p model_service/model
echo "✅ Model directory ensured at model_service/model"

echo ""
echo "🚀 Environment setup complete!"
echo "Next steps:"
echo "1. Update .env with real Atlas credentials (if needed)."
echo "2. Place your model files in model_service/model/."
echo "3. Run: ./run-services.sh"

