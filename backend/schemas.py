from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class RoleEnum(str, Enum):
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"

class TaskStatusEnum(str, Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"

class PriorityEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    role: RoleEnum = RoleEnum.MEMBER

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        import re
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[\W_]', v):
            raise ValueError('Password must contain at least one special character')
        return v

class User(UserBase):
    id: int
    role: RoleEnum
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TokenData(BaseModel):
    email: Optional[str] = None

# --- TASK SCHEMAS ---
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[PriorityEnum] = PriorityEnum.MEDIUM
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    project_id: int
    assigned_to_id: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[TaskStatusEnum] = None
    priority: Optional[PriorityEnum] = None
    assigned_to_id: Optional[int] = None

class TaskStatusUpdate(BaseModel):
    status: TaskStatusEnum

class ProjectCompact(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class Task(TaskBase):
    id: int
    status: TaskStatusEnum
    project_id: int
    assigned_to_id: Optional[int] = None
    created_at: datetime
    assignee: Optional[User] = None
    project: Optional[ProjectCompact] = None

    class Config:
        from_attributes = True

# --- PROJECT SCHEMAS ---
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    owner_id: int
    created_at: datetime
    # We will exclude members and tasks from the base project view to keep it lightweight,
    # or include them conditionally in specific endpoints.

    class Config:
        from_attributes = True

class ProjectMemberResponse(BaseModel):
    user_id: int
    user: Optional[User] = None
    
    class Config:
        from_attributes = True

class ProjectDetail(Project):
    tasks: List[Task] = []
    members: List[ProjectMemberResponse] = []

class ProjectMemberAdd(BaseModel):
    user_id: int
