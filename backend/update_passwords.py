import os
import sys

# Add backend directory to path so it can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import User
from auth import get_password_hash

db = SessionLocal()

admin = db.query(User).filter(User.email == "admin@ethara.com").first()
if admin:
    admin.hashed_password = get_password_hash("Admin@123!")
    
member = db.query(User).filter(User.email == "member@ethara.com").first()
if member:
    member.hashed_password = get_password_hash("Member@123!")

db.commit()
print("Passwords updated!")
