import subprocess
import time
import requests
import sys
import os

print("Starting Analysis Service...")
# Start server
env = os.environ.copy()
env["PORT"] = "5001"
# Ensure we are in project root
project_root = "/Users/adithyan/Desktop/RND/basepapers/virtual_therapist"
os.chdir(project_root)

process = subprocess.Popen(
    [sys.executable, "-u", "backend/analysis_service/app.py"], 
    stdout=subprocess.PIPE, 
    stderr=subprocess.PIPE, 
    text=True,
    env=env
)

try:
    print("Waiting for server to start (60s)...")
    # Read stdout in non-blocking way or just wait
    time.sleep(60)
    
    # Check if process is still running
    if process.poll() is not None:
        print("❌ Server crashed immediately!")
        stdout, stderr = process.communicate()
        print("STDOUT:", stdout)
        print("STDERR:", stderr)
        sys.exit(1)
        
    print("Server appears running. Testing prediction...")
    test_text = "I feel very anxious and worried about everything lately. I can't sleep."
    print(f"Input text: {test_text}")
    
    try:
        response = requests.post(
            "http://localhost:5001/api/analyze",
            json={"text": test_text},
            timeout=10
        )
        print(f"Status Code: {response.status_code}")
        try:
            data = response.json()
            print("Prediction Output:", data)
            if response.status_code == 200 and "topPattern" in data:
                print(f"✅ Label: {data.get('topPattern')}")
                print("✅ Prediction SUCCESS")
            else:
                print("❌ Prediction Failed (Bad Response)")
        except:
             print("❌ Failed to parse JSON response:", response.text)

    except Exception as e:
        print(f"❌ Connection Error: {e}")
        
finally:
    print("Stopping server...")
    process.terminate()
    try:
        stdout, stderr = process.communicate(timeout=5)
        if stdout: print("Server STDOUT:", stdout)
        if stderr: print("Server STDERR:", stderr)
    except:
        process.kill()

