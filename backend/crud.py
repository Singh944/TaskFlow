from sqlalchemy.orm import Session
import models, schemas
from auth import get_password_hash

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=hashed_password,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_users(db: Session):
    return db.query(models.User).all()

def get_projects_for_user(db: Session, user: models.User):
    if user.role == models.RoleEnum.ADMIN:
        return db.query(models.Project).all()
    # Members see projects they are added to
    return db.query(models.Project).join(models.ProjectMember).filter(models.ProjectMember.user_id == user.id).all()

def create_project(db: Session, project: schemas.ProjectCreate, user_id: int):
    db_project = models.Project(**project.model_dump(), owner_id=user_id)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    # Add owner as a member
    db_member = models.ProjectMember(project_id=db_project.id, user_id=user_id)
    db.add(db_member)
    db.commit()
    return db_project

def get_project(db: Session, project_id: int):
    return db.query(models.Project).filter(models.Project.id == project_id).first()

def add_user_to_project(db: Session, project_id: int, user_id: int):
    # Check if already a member
    existing = db.query(models.ProjectMember).filter_by(project_id=project_id, user_id=user_id).first()
    if existing:
        return existing
    db_member = models.ProjectMember(project_id=project_id, user_id=user_id)
    db.add(db_member)
    db.commit()
    return db_member

def get_tasks_for_user(db: Session, user: models.User, project_id: int = None, status: str = None, priority: str = None, search: str = None, assignee_id: int = None):
    query = db.query(models.Task)
    if user.role != models.RoleEnum.ADMIN:
        # STRICT REQUIREMENT: Members can ONLY view assigned tasks
        query = query.filter(models.Task.assigned_to_id == user.id)
    elif assignee_id is not None:
        # Allow admins to filter by assignee (e.g. for "My Tasks" view)
        query = query.filter(models.Task.assigned_to_id == assignee_id)
        
    if project_id:
        query = query.filter(models.Task.project_id == project_id)
    if status:
        query = query.filter(models.Task.status == status)
    if priority:
        query = query.filter(models.Task.priority == priority)
    if search:
        query = query.filter(models.Task.title.ilike(f"%{search}%"))
        
    return query.order_by(models.Task.created_at.desc()).all()

def create_task(db: Session, task: schemas.TaskCreate):
    db_task = models.Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def get_task(db: Session, task_id: int):
    return db.query(models.Task).filter(models.Task.id == task_id).first()

def update_task_status(db: Session, task_id: int, status: schemas.TaskStatusEnum):
    db_task = get_task(db, task_id)
    if db_task:
        db_task.status = status
        db.commit()
        db.refresh(db_task)
    return db_task

def update_task(db: Session, task_id: int, task_update: schemas.TaskUpdate):
    db_task = get_task(db, task_id)
    if db_task:
        update_data = task_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_task, key, value)
        db.commit()
        db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int):
    db_task = get_task(db, task_id)
    if db_task:
        db.delete(db_task)
        db.commit()
    return db_task

def update_project(db: Session, project_id: int, project_update: schemas.ProjectCreate):
    db_project = get_project(db, project_id)
    if db_project:
        db_project.name = project_update.name
        db_project.description = project_update.description
        if hasattr(project_update, "deadline"):
            db_project.deadline = project_update.deadline
        db.commit()
        db.refresh(db_project)
    return db_project

def delete_project(db: Session, project_id: int):
    db_project = get_project(db, project_id)
    if db_project:
        db.delete(db_project)
        db.commit()
    return db_project

def remove_user_from_project(db: Session, project_id: int, user_id: int):
    db_member = db.query(models.ProjectMember).filter_by(project_id=project_id, user_id=user_id).first()
    if db_member:
        db.delete(db_member)
        db.commit()
    return db_member
