import requests
import json
import time

PYTHON_URL = "http://127.0.0.1:5001/api/analyze"
NODE_URL = "http://127.0.0.1:4000/api/analyze"

payload = {"text": "I feel very anxious and worried about everything lately."}

def test_service(name, url, check_cors=False):
    print(f"\n--- Testing {name} ({url}) ---")
    try:
        start = time.time()
        # Initial OPTIONS check for CORS if checking Node
        if check_cors:
            print(f"Sending OPTIONS request to check CORS...")
            opts = requests.options(
                url, 
                headers={
                    "Origin": "http://localhost:5173",
                    "Access-Control-Request-Method": "POST"
                }
            )
            print(f"OPTIONS Status: {opts.status_code}")
            print(f"CORS Headers: {opts.headers.get('Access-Control-Allow-Origin')}")
            
        print(f"Sending POST request...")
        resp = requests.post(url, json=payload, headers={"Origin": "http://localhost:5173"})
        duration = time.time() - start
        
        print(f"Status: {resp.status_code}")
        print(f"Time: {duration:.2f}s")
        
        if resp.status_code == 200:
            data = resp.json()
            print("Response:", json.dumps(data, indent=2))
            if "topPattern" in data:
                print("✅ Prediction VALID")
            else:
                print("❌ Prediction INVALID (missing topPattern)")
                
            if check_cors:
                acao = resp.headers.get("Access-Control-Allow-Origin")
                print(f"CORS Allow Origin: {acao}")
                if acao == "http://localhost:5173" or acao == "*":
                    print("✅ CORS Configured Correctly")
                else:
                    print(f"❌ CORS Misconfigured: Got '{acao}'")
        else:
            print(f"❌ Failed: {resp.text}")

    except Exception as e:
        print(f"❌ Connection Error: {e}")

print("=== STARTING FULL STACK VERIFICATION ===")
test_service("Python Analysis Service", PYTHON_URL)
test_service("Node Backend Proxy", NODE_URL, check_cors=True)
print("\n=== VERIFICATION COMPLETE ===")
