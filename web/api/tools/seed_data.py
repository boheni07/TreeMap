import requests
import json

def seed_data():
    url = "http://127.0.0.1:8000/api/measurements"
    headers = {"Content-Type": "application/json; charset=utf-8"}
    
    trees = [
        {
            "dbh": 28.5, "height": 10.2, "species": "은행나무", "healthScore": 85.0,
            "deviceLatitude": 37.5660, "deviceLongitude": 126.9775,
            "treeLatitude": 37.5663, "treeLongitude": 126.9778,
            "devicePitch": 5.5, "ambientLight": 800.0, "deviceModel": "iPhone 15 Pro",
            "accelerometerX": 0.12, "accelerometerY": 9.81, "accelerometerZ": 0.05,
            "gyroscopeX": 0.001, "gyroscopeY": -0.002, "gyroscopeZ": 0.0,
            "magnetometerX": 25.4, "magnetometerY": -15.2, "magnetometerZ": 42.1
        },
        {
            "dbh": 35.2, "height": 12.5, "species": "소나무", "healthScore": 92.0,
            "deviceLatitude": 37.5670, "deviceLongitude": 126.9784,
            "treeLatitude": 37.5673, "treeLongitude": 126.9787,
            "devicePitch": 4.8, "ambientLight": 950.0, "deviceModel": "Samsung Galaxy S24",
            "accelerometerX": -0.05, "accelerometerY": 9.78, "accelerometerZ": 0.12,
            "gyroscopeX": -0.005, "gyroscopeY": 0.003, "gyroscopeZ": 0.001,
            "magnetometerX": 22.1, "magnetometerY": -18.5, "magnetometerZ": 38.4
        },
        {
            "dbh": 22.8, "height": 8.5, "species": "단풍나무", "healthScore": 88.0,
            "deviceLatitude": 37.5665, "deviceLongitude": 126.9780,
            "treeLatitude": 37.5668, "treeLongitude": 126.9783,
            "devicePitch": 6.2, "ambientLight": 1100.0, "deviceModel": "Google Pixel 8",
            "accelerometerX": 0.08, "accelerometerY": 9.82, "accelerometerZ": -0.02
        },
        {
            "dbh": 45.7, "height": 18.2, "species": "느티나무", "healthScore": 94.0,
            "deviceLatitude": 37.5662, "deviceLongitude": 126.9772,
            "treeLatitude": 37.5665, "treeLongitude": 126.9775,
            "devicePitch": 5.0, "ambientLight": 1250.0, "deviceModel": "iPhone 14 Pro",
            "accelerometerX": 0.15, "accelerometerY": 9.76, "accelerometerZ": 0.08,
            "magnetometerX": 28.2, "magnetometerY": -12.1, "magnetometerZ": 48.5
        },
        {
            "dbh": 31.4, "height": 11.8, "species": "벚나무", "healthScore": 80.0,
            "deviceLatitude": 37.5675, "deviceLongitude": 126.9790,
            "treeLatitude": 37.5678, "treeLongitude": 126.9793,
            "devicePitch": 4.5, "ambientLight": 880.0, "deviceModel": "Samsung Galaxy S23",
            "accelerometerX": -0.02, "accelerometerY": 9.80, "accelerometerZ": 0.10
        }
    ]
    
    print("샘플 데이터 등록 시작...")
    for tree in trees:
        try:
            response = requests.post(url, data=json.dumps(tree, ensure_ascii=False).encode('utf-8'), headers=headers)
            if response.status_code == 200:
                print(f"등록 성공: {tree['species']}")
            else:
                print(f"등록 실패: {tree['species']} ({response.status_code})")
                print(response.text)
        except Exception as e:
            print(f"에러 발생: {e}")

if __name__ == "__main__":
    seed_data()
