from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, schemas, database
from database import engine, get_db
from typing import List

# 데이터베이스 테이블 생성
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="TreeMap Backend API")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 실제 운영환경에서는 특정 도메인만 허용하도록 권장
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to TreeMap Backend API"}

@app.post("/api/measurements", response_model=schemas.TreeMeasurement)
def create_measurement(measurement: schemas.TreeMeasurementCreate, db: Session = Depends(get_db)):
    db_measurement = models.TreeMeasurement(
        dbh=measurement.dbh,
        height=measurement.height,
        species=measurement.species,
        health_score=measurement.healthScore,
        latitude=measurement.latitude,
        longitude=measurement.longitude
    )
    db.add(db_measurement)
    db.commit()
    db.refresh(db_measurement)
    return db_measurement

@app.get("/api/measurements", response_model=List[schemas.TreeMeasurement])
def read_measurements(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    measurements = db.query(models.TreeMeasurement).offset(skip).limit(limit).all()
    return measurements
