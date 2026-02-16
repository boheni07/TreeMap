from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TreeMeasurementBase(BaseModel):
    dbh: float
    height: float
    species: str
    healthScore: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class TreeMeasurementCreate(TreeMeasurementBase):
    pass

class TreeMeasurement(TreeMeasurementBase):
    id: int
    measured_at: datetime

    class Config:
        from_attributes = True
