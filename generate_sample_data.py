import requests
import random
import json
import time

# API Endpoint
API_URL = "http://localhost:8001/api/measurements"

# Sample Data Config
NUM_SAMPLES = 15
CENTER_LAT = 37.5445
CENTER_LON = 127.0435
SPECIES_LIST = [
    "소나무 (Pinus densiflora)",
    "느티나무 (Zelkova serrata)",
    "은행나무 (Ginkgo biloba)",
    "벚나무 (Prunus serrulata)",
    "단풍나무 (Acer palmatum)",
    "양버즘나무 (Platanus occidentalis)"
]

DEVICE_MODELS = ["iPhone 14 Pro", "Samsung Galaxy S23", "Pixel 7", "iPhone 13"]

# 1x1 Red Dot Base64
SAMPLE_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

def generate_random_tree():
    species = random.choice(SPECIES_LIST)
    dbh = round(random.uniform(10.0, 60.0), 1)
    height = round(random.uniform(3.0, 20.0), 1)
    
    # Generate location with small offsets
    lat_offset = random.uniform(-0.002, 0.002)
    lon_offset = random.uniform(-0.002, 0.002)
    
    tree_lat = CENTER_LAT + lat_offset
    tree_lon = CENTER_LON + lon_offset
    
    # Device location slightly different from tree
    dev_lat = tree_lat - random.uniform(0.00005, 0.0001)
    dev_lon = tree_lon - random.uniform(0.00005, 0.0001)

    return {
        "species": species,
        "dbh": dbh,
        "height": height,
        "crownWidth": round(dbh * random.uniform(0.15, 0.25), 1),
        "groundClearance": round(height * random.uniform(0.1, 0.3), 1),
        "healthScore": round(random.uniform(70, 100), 1),
        
        "deviceLatitude": dev_lat,
        "deviceLongitude": dev_lon,
        "treeLatitude": tree_lat,
        "treeLongitude": tree_lon,
        "adjustedTreeLatitude": tree_lat if random.random() > 0.7 else None,
        "adjustedTreeLongitude": tree_lon if random.random() > 0.7 else None,
        
        "deviceModel": random.choice(DEVICE_MODELS),
        "osVersion": "17.0",
        "devicePitch": round(random.uniform(85, 95), 1),
        "deviceRoll": round(random.uniform(-2, 2), 1),
        "deviceAzimuth": round(random.uniform(0, 360), 1),
        
        "ambientLight": random.randint(3000, 10000),
        "pressure": 1013.0,
        "altitude": random.randint(30, 60),
        "temperature": random.randint(15, 30),
        
        "imageWidth": 1920,
        "imageHeight": 1080,
        "focalLength": 24.0,
        "cameraDistance": round(random.uniform(3, 10), 1),
        
        "imageData": SAMPLE_IMAGE
    }

def main():
    print(f"Generating {NUM_SAMPLES} sample trees...")
    
    success_count = 0
    for i in range(NUM_SAMPLES):
        data = generate_random_tree()
        try:
            # Pydantic alias matching: Convert keys if necessary, but schema allows population by name (alias)
            # requests.post sends json, which FastAPI parses. 
            # Our keys match the aliases defined in schema (e.g., crownWidth).
            
            response = requests.post(API_URL, json=data)
            
            if response.status_code == 200:
                print(f"[{i+1}/{NUM_SAMPLES}] Success: {data['species']}")
                success_count += 1
            else:
                print(f"[{i+1}/{NUM_SAMPLES}] Failed: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"[{i+1}/{NUM_SAMPLES}] Error: {e}")
            
    print(f"\nCompleted. Successfully added {success_count} trees.")

if __name__ == "__main__":
    main()
