from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from datetime import datetime
from typing import Optional

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

Base = declarative_base()

class User(Base):
    __tablename__ = 'user'
    
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=True)
    name = Column(String, nullable=True)
    image = Column(String, default="https://replicable-assets-prod.s3.eu-north-1.amazonaws.com/avatar/65c2a3c592d8df9a8ece8672b0dc59a7625c416b4a04f945268e20d5c5fb7604.webp")
    customer = Column(String, unique=True, nullable=True)
    # 角色 / 级别
    role = Column(Integer, default=10)
    level = Column(Integer, default=10)
    
    # 积分相关字段
    subscription_credits = Column(Float, default=0)
    subscription_purchased_credits = Column(Float, default=0)
    extra_credits = Column(Float, default=50)


engine = create_engine(os.getenv("USERS_POSTGRES_URI"))
Session = sessionmaker(bind=engine)

# Create tables
Base.metadata.create_all(engine)

def get_user_by_email(email: str) -> Optional[User]:
    session = Session()
    try:
        return session.query(User).filter(User.email == email).first()
    finally:
        session.close()
