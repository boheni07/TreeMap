import os
import sys
from sqlalchemy.orm import Session
from datetime import datetime

# 프로젝트 루트를 sys.path에 추가하여 api 패키지 인식
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

try:
    from api import models, database
except ImportError:
    # 경로가 꼬일 경우를 대비한 대체 임포트
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from api import models, database

def create_samples():
    db = database.SessionLocal()
    try:
        # 기존 샘플 데이터가 있는지 확인 (선택 사항)
        
        samples = [
            {
                "species": "소나무 (Pinus densiflora)",
                "dbh": 35.5,
                "height": 12.4,
                "health_score": 92.0,
                "tree_latitude": 37.5451,
                "tree_longitude": 127.0423,
                "device_latitude": 37.5450,
                "device_longitude": 127.0422,
                "device_model": "iPhone 15 Pro",
                "os_version": "iOS 17.4"
            },
            {
                "species": "느티나무 (Zelkova serrata)",
                "dbh": 48.2,
                "height": 15.6,
                "health_score": 88.0,
                "tree_latitude": 37.5448,
                "tree_longitude": 127.0431,
                "device_latitude": 37.5447,
                "device_longitude": 127.0430,
                "device_model": "Samsung Galaxy S24",
                "os_version": "Android 14"
            },
            {
                "species": "은행나무 (Ginkgo biloba)",
                "dbh": 42.0,
                "height": 18.2,
                "health_score": 95.0,
                "tree_latitude": 37.5455,
                "tree_longitude": 127.0435,
                "device_latitude": 37.5454,
                "device_longitude": 127.0434,
                "device_model": "Google Pixel 8",
                "os_version": "Android 14"
            },
            {
                "species": "벚나무 (Prunus serrulata)",
                "dbh": 28.4,
                "height": 8.5,
                "health_score": 85.0,
                "tree_latitude": 37.5442,
                "tree_longitude": 127.0428,
                "device_latitude": 37.5441,
                "device_longitude": 127.0427,
                "device_model": "iPhone 14",
                "os_version": "iOS 16.6"
            },
            {
                "species": "메타세쿼이아 (Metasequoia)",
                "dbh": 55.0,
                "height": 22.0,
                "health_score": 90.0,
                "tree_latitude": 37.5445,
                "tree_longitude": 127.0440,
                "device_latitude": 37.5444,
                "device_longitude": 127.0439,
                "device_model": "iPhone 15 Pro Max",
                "os_version": "iOS 17.5"
            }
        ]

        print(f"Creating 5 sample tree measurements in {database.SQLALCHEMY_DATABASE_URL}...")
        
        for s in samples:
            db_sample = models.TreeMeasurement(**s)
            db.add(db_sample)
        
        db.commit()
        print("Successfully created 5 sample data points!")
        
    except Exception as e:
        print(f"Error creating samples: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_samples()
