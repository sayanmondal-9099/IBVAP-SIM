import urllib.request
import urllib.error
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

def request(method, url, data=None):
    req = urllib.request.Request(url, method=method)
    if data:
        req.add_header('Content-Type', 'application/json')
        jsondata = json.dumps(data)
        jsondataasbytes = jsondata.encode('utf-8')
        req.add_header('Content-Length', len(jsondataasbytes))
        try:
            with urllib.request.urlopen(req, jsondataasbytes) as response:
                return response.status, json.loads(response.read().decode())
        except urllib.error.URLError as e:
            if hasattr(e, 'read'):
                print("Error Data:", e.read().decode())
            return getattr(e, 'code', 500), None
    else:
        try:
            with urllib.request.urlopen(req) as response:
                return response.status, json.loads(response.read().decode())
        except urllib.error.URLError as e:
            if hasattr(e, 'read'):
                print("Error Data:", e.read().decode())
            return getattr(e, 'code', 500), None

def verify_protocol(scenario_name, speed=1, anomaly=False):
    print(f"\n--- Testing {scenario_name} (Speed: {speed}, Anomaly: {anomaly}) ---")
    status, _ = request("POST", f"{BASE_URL}/simulation/start", data={
        "scenario": scenario_name,
        "speed_multiplier": speed,
        "anomaly_detection_enabled": anomaly
    })
    print(f"Start Response: {status}")
    if status != 200:
        print("Skipping further checks due to failure.")
        return

    time.sleep(2)
    
    status, data = request("GET", f"{BASE_URL}/simulation/tracks")
    if status == 200 and data is not None:
        obs = data
        print(f"Tracks: {len(obs)}")
        
        time.sleep(1)
        status, data2 = request("GET", f"{BASE_URL}/simulation/tracks")
        if status == 200 and data2 is not None:
            obs2 = data2
            if obs and obs2:
                o1 = obs[0]
                o2 = next((o for o in obs2 if o['id'] == o1['id']), None)
                if o2:
                    moved = (o1['x'] != o2['x'] or o1['y'] != o2['y'])
                    print(f"Object {o1['id']} moved: {moved}")
                else:
                    print(f"Object {o1['id']} disappeared.")
    else:
        print("Failed to get tracks.")
        
    # Check Environment for events or sensors
    status, data = request("GET", f"{BASE_URL}/simulation/environment")
    if status == 200 and data:
        print(f"Events: {len(data.get('events', []))}, Sensors: {len(data.get('sensors', []))}")
        
    request("POST", f"{BASE_URL}/simulation/stop")

def run_tests():
    protocols = [
        "PROTOCOL-NORMAL",
        "PROTOCOL-DRONE",
        "PROTOCOL-VEHICLE",
        "PROTOCOL-MULTI-THREAT",
        "PROTOCOL-EMERGENCY",
        "PROTOCOL-SENSOR-DEGRADED"
    ]
    for p in protocols:
        verify_protocol(p)
        
if __name__ == "__main__":
    run_tests()

