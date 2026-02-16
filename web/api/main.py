from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, schemas, database
from database import engine, get_db
from typing import List
import logging

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 데이터베이스 테이블 생성
try:
    models.Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
except Exception as e:
    logger.error(f"Failed to create database tables: {e}")
    raise

app = FastAPI(
    title="TreeMap Backend API",
    description="AI 기반 수목 측정 데이터 관리 API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 실제 운영환경에서는 특정 도메인만 허용하도록 권장
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Health"])
def read_root():
    """API 상태 확인"""
    return {"message": "Welcome to TreeMap Backend API", "status": "healthy"}

@app.post("/api/measurements", response_model=schemas.TreeMeasurement, tags=["Measurements"])
def create_measurement(measurement: schemas.TreeMeasurementCreate, db: Session = Depends(get_db)):
    """
    새로운 수목 측정 데이터 생성
    
    - **dbh**: 흉고직경 (cm)
    - **height**: 수고 (m)
    - **species**: 수종
    - **healthScore**: 건강도 점수 (0-100)
    - **latitude**: 위도 (선택)
    - **longitude**: 경도 (선택)
    - **센서 데이터**: IMU, 환경 센서, 카메라 메타데이터, 시스템 정보 (모두 선택)
    """
    try:
        db_measurement = models.TreeMeasurement(
            # 기본 측정 데이터
            dbh=measurement.dbh,
            height=measurement.height,
            species=measurement.species,
            health_score=measurement.health_score,
            # 위치 정보
            device_latitude=measurement.device_latitude,
            device_longitude=measurement.device_longitude,
            tree_latitude=measurement.tree_latitude,
            tree_longitude=measurement.tree_longitude,
            # IMU 데이터
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
            # 환경 센서 데이터
            ambient_light=measurement.ambient_light,
            pressure=measurement.pressure,
            altitude=measurement.altitude,
            temperature=measurement.temperature,
            # 카메라 메타데이터
            image_width=measurement.image_width,
            image_height=measurement.image_height,
            focal_length=measurement.focal_length,
            camera_distance=measurement.camera_distance,
            # 시스템 정보
            device_model=measurement.device_model,
            os_version=measurement.os_version,
            app_version=measurement.app_version
        )
        db.add(db_measurement)
        db.commit()
        db.refresh(db_measurement)
        logger.info(f"Created measurement with ID: {db_measurement.id}")
        return db_measurement
    except Exception as e:
        logger.error(f"Failed to create measurement: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create measurement: {str(e)}")

@app.get("/api/measurements", response_model=List[schemas.TreeMeasurement], tags=["Measurements"])
def read_measurements(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    수목 측정 데이터 목록 조회
    
    - **skip**: 건너뛸 레코드 수
    - **limit**: 조회할 최대 레코드 수 (최대 100)
    """
    try:
        if limit > 100:
            limit = 100
        measurements = db.query(models.TreeMeasurement).offset(skip).limit(limit).all()
        logger.info(f"Retrieved {len(measurements)} measurements")
        return measurements
    except Exception as e:
        logger.error(f"Failed to retrieve measurements: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve measurements: {str(e)}")

