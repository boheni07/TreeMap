from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import logging
from typing import List

# 임포트 오류를 방지하기 위해 sys.path 추가 (필요시)
import sys
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

# Vercel 및 로컬 환경 호환 임포트 (전역 초기화 방식)
try:
    import models, schemas, database
    from database import engine, get_db
except ImportError as e:
    logger = logging.getLogger(__name__)
    logger.error(f"Import error at start: {e}")
    # 재시도 (패키지 형태)
    from . import models, schemas, database
    from .database import engine, get_db

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from contextlib import asynccontextmanager

# [중요] 자동 시딩을 위한 샘플 데이터 정의
SAMPLE_TREES = [
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
        "os_version": "iOS 17.4",
        "device_pitch": 89.2,
        "device_roll": 0.5,
        "ambient_light": 6500.0,
        "pressure": 1012.5,
        "altitude": 42.1,
        "temperature": 22.4,
        "focal_length": 4.25,
        "camera_distance": 5.4,
        "accelerometer_x": 0.02,
        "accelerometer_y": -9.81,
        "accelerometer_z": 0.15
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
        "os_version": "Android 14",
        "device_pitch": 90.5,
        "device_roll": -0.2,
        "ambient_light": 7200.0,
        "pressure": 1013.1,
        "altitude": 43.5,
        "temperature": 23.1,
        "focal_length": 5.4,
        "camera_distance": 7.2
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
        "os_version": "Android 14",
        "device_pitch": 88.7,
        "device_roll": 1.1,
        "ambient_light": 5800.0,
        "pressure": 1012.8,
        "altitude": 41.8,
        "focal_length": 4.5
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
        "os_version": "iOS 16.6",
        "device_pitch": 91.2,
        "ambient_light": 4500.0,
        "focal_length": 3.99
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
        "os_version": "iOS 17.5",
        "device_pitch": 90.0,
        "device_roll": 0.0,
        "ambient_light": 8500.0,
        "pressure": 1014.0,
        "altitude": 45.0,
        "temperature": 21.8,
        "camera_distance": 10.5
    }
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # [DB 초기화 및 시딩 로직]
    try:
        models.Base.metadata.create_all(bind=engine)
        db = next(get_db())
        count = db.query(models.TreeMeasurement).count()
        if count == 0:
            logger.info("No data found. Auto-seeding 5 sample trees...")
            for tree_data in SAMPLE_TREES:
                db_tree = models.TreeMeasurement(**tree_data)
                db.add(db_tree)
            db.commit()
            logger.info("Auto-seeding completed.")
        else:
            logger.info(f"Database already has {count} entries. Skipping seeding.")
    except Exception as e:
        logger.error(f"Lifespan setup error: {e}")
    yield

app = FastAPI(
    title="TreeMap Backend API",
    version="1.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Health"])
def read_root():
    return {"message": "Welcome to TreeMap API", "env": "vercel" if os.environ.get('VERCEL') else "local"}

@app.post("/api/measurements", response_model=schemas.TreeMeasurement, tags=["Measurements"])
def create_measurement(measurement: schemas.TreeMeasurementCreate, db: Session = Depends(get_db)):
    try:
        db_measurement = models.TreeMeasurement(
            dbh=measurement.dbh,
            height=measurement.height,
            species=measurement.species,
            health_score=measurement.health_score,
            device_latitude=measurement.device_latitude,
            device_longitude=measurement.device_longitude,
            tree_latitude=measurement.tree_latitude,
            tree_longitude=measurement.tree_longitude,
            accelerometer_x=measurement.accelerometer_x,
            accelerometer_y=measurement.accelerometer_y,
            accelerometer_z=measurement.accelerometer_z,
            gyroscope_x=measurement.gyroscope_x,
            gyroscope_y=measurement.gyroscope_y,
            gyroscope_z=measurement.gyroscope_z,
            magnetometer_x=measurement.magnetometer_x,
            magnetometer_y=measurement.magnetometer_y,
            magnetometer_z=measurement.magnetometer_z,
            device_pitch=measurement.device_pitch,
            device_roll=measurement.device_roll,
            device_azimuth=measurement.device_azimuth,
            ambient_light=measurement.ambient_light,
            pressure=measurement.pressure,
            altitude=measurement.altitude,
            temperature=measurement.temperature,
            image_width=measurement.image_width,
            image_height=measurement.image_height,
            focal_length=measurement.focal_length,
            camera_distance=measurement.camera_distance,
            device_model=measurement.device_model,
            os_version=measurement.os_version,
            app_version=measurement.app_version,
            image_data=measurement.image_data
        )
        db.add(db_measurement)
        db.commit()
        db.refresh(db_measurement)
        return db_measurement
    except Exception as e:
        logger.error(f"Runtime Error: {e}")
        db.rollback()
        # 에러 내용을 구체적으로 반환하여 디버깅 지원
        raise HTTPException(status_code=500, detail=f"Database or Logic Error: {str(e)}")

@app.get("/api/measurements", response_model=List[schemas.TreeMeasurement], tags=["Measurements"])
def read_measurements(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        return db.query(models.TreeMeasurement).offset(skip).limit(limit).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
