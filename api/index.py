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

# [중요] DB 초기화: Vercel 서버리스 런타임 호환성을 위해 모듈 로드 시점에 수행
try:
    models.Base.metadata.create_all(bind=engine)
    logger.info("Database initialized at module level")
except Exception as e:
    logger.error(f"DB Init Error: {e}")

app = FastAPI(
    title="TreeMap Backend API",
    version="1.1.0"
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
            app_version=measurement.app_version
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
