from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from typing import List, Optional

import models, schemas, crud, auth
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

import os

app = FastAPI(title="TeamPilot API")

origins = [
    "http://localhost:5173", 
    "http://127.0.0.1:5173", 
    "http://localhost:5174",
    "http://localhost:3000"
]

frontend_url = os.environ.get("FRONTEND_URL")
if frontend_url:
    frontend_url = frontend_url.rstrip("/")
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTH ROUTES ---
@app.post("/api/auth/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.post("/api/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@app.get("/api/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.get("/api/users", response_model=List[schemas.User])
def get_users(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.get_users(db)

# --- DASHBOARD STATS ---
@app.get("/api/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    from datetime import datetime
    stats = {}
    if current_user.role == models.RoleEnum.ADMIN:
        stats["total_projects"] = db.query(models.Project).count()
        stats["total_members"] = db.query(models.User).filter(models.User.role == models.RoleEnum.MEMBER).count()
        stats["total_admins"] = db.query(models.User).filter(models.User.role == models.RoleEnum.ADMIN).count()
        tasks = db.query(models.Task).all()
    else:
        tasks = db.query(models.Task).filter(models.Task.assigned_to_id == current_user.id).all()
        
    stats["total_tasks"] = len(tasks)
    stats["completed_tasks"] = sum(1 for t in tasks if t.status == models.TaskStatusEnum.DONE)
    stats["pending_tasks"] = sum(1 for t in tasks if t.status != models.TaskStatusEnum.DONE)
    
    now = datetime.utcnow()
    stats["overdue_tasks"] = sum(1 for t in tasks if t.status != models.TaskStatusEnum.DONE and t.due_date and t.due_date < now)
    
    return stats

# --- PROJECT ROUTES ---
@app.post("/api/projects", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    return crud.create_project(db=db, project=project, user_id=current_user.id)

@app.get("/api/projects", response_model=List[schemas.Project])
def read_projects(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.get_projects_for_user(db=db, user=current_user)

@app.get("/api/projects/{project_id}", response_model=schemas.ProjectDetail)
def read_project(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_project = crud.get_project(db, project_id=project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    # Check access
    if current_user.role != models.RoleEnum.ADMIN:
        is_member = any(member.user_id == current_user.id for member in db_project.members)
        if not is_member:
             raise HTTPException(status_code=403, detail="Not a member of this project")
    return db_project

@app.put("/api/projects/{project_id}", response_model=schemas.Project)
def update_project(project_id: int, project_update: schemas.ProjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_project = crud.update_project(db, project_id, project_update)
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

@app.delete("/api/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_project = crud.delete_project(db, project_id)
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"detail": "Project deleted successfully"}

@app.post("/api/projects/{project_id}/members", response_model=schemas.User)
def add_project_member(project_id: int, member: schemas.ProjectMemberAdd, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_project = crud.get_project(db, project_id=project_id)
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    crud.add_user_to_project(db, project_id=project_id, user_id=member.user_id)
    user = db.query(models.User).filter(models.User.id == member.user_id).first()
    if not user:
         raise HTTPException(status_code=404, detail="User not found")
    return user

@app.delete("/api/projects/{project_id}/members/{user_id}")
def remove_project_member(project_id: int, user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    member = crud.remove_user_from_project(db, project_id, user_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in project")
    return {"detail": "Member removed"}

# --- TASK ROUTES ---
@app.get("/api/tasks", response_model=List[schemas.Task])
def read_tasks(project_id: Optional[int] = None, status: Optional[str] = None, priority: Optional[str] = None, search: Optional[str] = None, assignee_id: Optional[int] = None, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.get_tasks_for_user(db=db, user=current_user, project_id=project_id, status=status, priority=priority, search=search, assignee_id=assignee_id)

@app.post("/api/tasks", response_model=schemas.Task)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_project = crud.get_project(db, project_id=task.project_id)
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if task.assigned_to_id:
        is_member = any(member.user_id == task.assigned_to_id for member in db_project.members)
        if not is_member:
            raise HTTPException(status_code=400, detail="Assigned user must be a member of the project")
            
    return crud.create_task(db=db, task=task)

@app.put("/api/tasks/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, task_update: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_task = crud.get_task(db, task_id=task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if current_user.role != models.RoleEnum.ADMIN:
        # Strict Member Rules
        if db_task.assigned_to_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not assigned to this task")
            
        current_status = db_task.status
        new_status = task_update.status
        if new_status:
            valid_flow = False
            if current_status == models.TaskStatusEnum.TODO and new_status == models.TaskStatusEnum.IN_PROGRESS:
                valid_flow = True
            elif current_status == models.TaskStatusEnum.IN_PROGRESS and new_status == models.TaskStatusEnum.DONE:
                valid_flow = True
            elif current_status == new_status:
                valid_flow = True
                
            if not valid_flow:
                raise HTTPException(status_code=400, detail="Invalid status transition. Flow must be Todo -> In Progress -> Done")
        
        allowed_update = schemas.TaskUpdate(status=task_update.status)
        return crud.update_task(db=db, task_id=task_id, task_update=allowed_update)
        
    # Admin logic
    if task_update.assigned_to_id:
        db_project = crud.get_project(db, project_id=db_task.project_id)
        is_member = any(member.user_id == task_update.assigned_to_id for member in db_project.members)
        if not is_member:
            raise HTTPException(status_code=400, detail="Assigned user must be a member of the project")
            
    return crud.update_task(db=db, task_id=task_id, task_update=task_update)

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_task = crud.delete_task(db, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"detail": "Task deleted successfully"}
