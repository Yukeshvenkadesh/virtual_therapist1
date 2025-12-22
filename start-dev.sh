#!/bin/bash

# Virtual Therapist Development Startup Script
echo "🚀 Starting Virtual Therapist Development Environment..."

# Ensure .env exists (Atlas connection string lives here)
if [ ! -f ".env" ]; then
    echo "❌ Missing .env file. Run ./setup-env.sh to create one with your MongoDB Atlas credentials."
    exit 1
fi

# Warn if placeholder Atlas URI is still present
if grep -q "<username>" .env; then
    echo "⚠️  The MongoDB Atlas URI in .env still contains placeholder values."
    echo "    Update MONGODB_URI before continuing to avoid connection failures."
fi

# Function to cleanup processes on exit
cleanup() {
    echo "Stopping services..."
    if [ ! -z "$BACKEND_PID" ]; then kill $BACKEND_PID 2>/dev/null; fi
    if [ ! -z "$MODEL_PID" ]; then kill $MODEL_PID 2>/dev/null; fi
    if [ ! -z "$FRONTEND_PID" ]; then kill $FRONTEND_PID 2>/dev/null; fi
    exit
}

# Set trap for cleanup
trap cleanup INT TERM

# Install dependencies
echo "📦 Installing dependencies..."

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend && npm install && cd ..

# Install model service dependencies
echo "Installing model service dependencies..."
cd backend/analysis_service && pip install -r requirements.txt && cd ../..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo "✅ All dependencies installed!"
echo ""

# Start backend
echo "Starting backend service..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start model service
echo "Starting model service..."
cd backend/analysis_service
python app.py &
MODEL_PID=$!
cd ../..

# Wait a moment for model service to start
sleep 3

# Start frontend
echo "Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "🚀 All services started!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:4000"
echo "Model Service: http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
wait