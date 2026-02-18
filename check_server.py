import requests

try:
    print("Checking GET http://localhost:8000/...")
    r = requests.get("http://localhost:8000/")
    print(f"Status: {r.status_code}")
    print(f"Body: {r.text}")
except Exception as e:
    print(f"Error checking root: {e}")

try:
    print("\nChecking POST http://localhost:8000/api/measurements...")
    # Send an empty body or minimal valid body to see if it's 404 or 422 (Validation Error)
    r = requests.post("http://localhost:8000/api/measurements", json={})
    print(f"Status: {r.status_code}")
    print(f"Body: {r.text}")
except Exception as e:
    print(f"Error checking measurements: {e}")
