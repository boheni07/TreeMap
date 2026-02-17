from sqlalchemy import Column, Integer, Float, String, DateTime
from database import Base
import datetime

class TreeMeasurement(Base):
    __tablename__ = "measurements"

    # 기본 정보
    id = Column(Integer, primary_key=True, index=True)
    dbh = Column(Float)
    height = Column(Float)
    crown_width = Column(Float, nullable=True)  # 수관폭 (m)
    ground_clearance = Column(Float, nullable=True)  # 지하고 (m)
    species = Column(String)
    health_score = Column(Float)
    
    # 위치 정보
    device_latitude = Column(Float, nullable=True)  # 기기 위치 (스마트폰 GPS)
    device_longitude = Column(Float, nullable=True)
    tree_latitude = Column(Float, nullable=True)  # 나무 위치 (계산된 피사체 위치)
    tree_longitude = Column(Float, nullable=True)
    
    measured_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # IMU 데이터 (관성 측정 장치)
    accelerometer_x = Column(Float, nullable=True)
    accelerometer_y = Column(Float, nullable=True)
    accelerometer_z = Column(Float, nullable=True)
    gyroscope_x = Column(Float, nullable=True)
    gyroscope_y = Column(Float, nullable=True)
    gyroscope_z = Column(Float, nullable=True)
    magnetometer_x = Column(Float, nullable=True)
    magnetometer_y = Column(Float, nullable=True)
    magnetometer_z = Column(Float, nullable=True)
    device_pitch = Column(Float, nullable=True)  # 기기 피치 각도 (도)
    device_roll = Column(Float, nullable=True)   # 기기 롤 각도 (도)
    device_azimuth = Column(Float, nullable=True)  # 방위각 (도)
    
    # 환경 센서 데이터
    ambient_light = Column(Float, nullable=True)  # 주변 조도 (lux)
    pressure = Column(Float, nullable=True)  # 대기압 (hPa)
    altitude = Column(Float, nullable=True)  # 고도 (m)
    temperature = Column(Float, nullable=True)  # 온도 (°C)
    
    # 카메라 메타데이터
    image_width = Column(Integer, nullable=True)  # 이미지 너비 (px)
    image_height = Column(Integer, nullable=True)  # 이미지 높이 (px)
    focal_length = Column(Float, nullable=True)  # 초점 거리 (mm)
    camera_distance = Column(Float, nullable=True)  # 카메라-수목 거리 (m)
    
    # 시스템 정보
    device_model = Column(String, nullable=True)  # 기기 모델명
    os_version = Column(String, nullable=True)  # OS 버전
    app_version = Column(String, nullable=True)  # 앱 버전
    
    # 사진 데이터 (Base64 형식)
    image_data = Column(String, nullable=True)
