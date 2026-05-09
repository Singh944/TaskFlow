import database, models
from auth import get_password_hash

db = database.SessionLocal()

admin = db.query(models.User).filter_by(email="admin@ethara.com").first()
if not admin:
    admin = models.User(name="Super Admin", email="admin@ethara.com", password_hash=get_password_hash("Admin@123!"), role=models.RoleEnum.ADMIN)
    db.add(admin)

member = db.query(models.User).filter_by(email="member@ethara.com").first()
if not member:
    member = models.User(name="Test Member", email="member@ethara.com", password_hash=get_password_hash("Member@123!"), role=models.RoleEnum.MEMBER)
    db.add(member)

db.commit()
db.close()
print("Populated test users.")
