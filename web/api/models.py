from sqlalchemy import Column, Integer, Float, String, DateTime
from database import Base
import datetime

class TreeMeasurement(Base):
    __tablename__ = "measurements"

    id = Column(Integer, primary_key=True, index=True)
    dbh = Column(Float)
    height = Column(Float)
    species = Column(String)
    health_score = Column(Float)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    measured_at = Column(DateTime, default=datetime.datetime.utcnow)
