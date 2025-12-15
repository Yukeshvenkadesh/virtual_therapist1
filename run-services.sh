#!/bin/bash

# Virtual Therapist Services Runner
echo "🚀 Starting Virtual Therapist Services..."

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

# Start backend
echo "Starting backend service..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start model service
echo "Starting analysis service..."
cd backend/analysis_service
# Check if venv exists and activate
if [ -d "venv" ]; then
    source venv/bin/activate
fi
python3 app.py &
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

