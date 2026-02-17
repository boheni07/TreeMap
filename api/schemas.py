from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

class TreeMeasurementBase(BaseModel):
    # Pydantic v2 설정
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # 기본 측정 데이터
    dbh: float
    height: float
    crown_width: Optional[float] = Field(None, alias='crownWidth')
    ground_clearance: Optional[float] = Field(None, alias='groundClearance')
    species: str
    health_score: float = Field(..., alias='healthScore')
    
    # GPS 위치 정보 (3종 데이터 매핑)
    device_latitude: float = Field(..., alias='deviceLatitude')
    device_longitude: float = Field(..., alias='deviceLongitude')
    tree_latitude: float = Field(..., alias='treeLatitude')
    tree_longitude: float = Field(..., alias='treeLongitude')
    adjusted_tree_latitude: Optional[float] = Field(None, alias='adjustedTreeLatitude')
    adjusted_tree_longitude: Optional[float] = Field(None, alias='adjustedTreeLongitude')
    
    # IMU 데이터 (관성 측정 장치)
    accelerometer_x: Optional[float] = Field(None, alias='accelerometerX')
    accelerometer_y: Optional[float] = Field(None, alias='accelerometerY')
    accelerometer_z: Optional[float] = Field(None, alias='accelerometerZ')
    gyroscope_x: Optional[float] = Field(None, alias='gyroscopeX')
    gyroscope_y: Optional[float] = Field(None, alias='gyroscopeY')
    gyroscope_z: Optional[float] = Field(None, alias='gyroscopeZ')
    magnetometer_x: Optional[float] = Field(None, alias='magnetometerX')
    magnetometer_y: Optional[float] = Field(None, alias='magnetometerY')
    magnetometer_z: Optional[float] = Field(None, alias='magnetometerZ')
    device_pitch: Optional[float] = Field(None, alias='devicePitch')
    device_roll: Optional[float] = Field(None, alias='deviceRoll')
    device_azimuth: Optional[float] = Field(None, alias='deviceAzimuth')
    
    # 환경 센서 데이터
    ambient_light: Optional[float] = Field(None, alias='ambientLight')
    pressure: Optional[float] = None
    altitude: Optional[float] = None
    temperature: Optional[float] = None
    
    # 카메라 메타데이터
    image_width: Optional[int] = Field(None, alias='imageWidth')
    image_height: Optional[int] = Field(None, alias='imageHeight')
    focal_length: Optional[float] = Field(None, alias='focalLength')
    camera_distance: Optional[float] = Field(None, alias='cameraDistance')
    
    # 시스템 정보
    device_model: Optional[str] = Field(None, alias='deviceModel')
    os_version: Optional[str] = Field(None, alias='osVersion')
    app_version: Optional[str] = Field(None, alias='appVersion')

    # 사진 데이터 (Base64)
    image_data: Optional[str] = Field(None, alias='imageData')

class TreeMeasurementCreate(TreeMeasurementBase):
    pass

class TreeMeasurement(TreeMeasurementBase):
    id: int
    measured_at: datetime
