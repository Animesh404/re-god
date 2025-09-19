from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Auth Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    identifier: str  # Can be email or phone
    password: str

class UserResponse(UserBase):
    id: int
    is_verified: bool
    onboarding_completed: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    roles: List[str] = []
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str

class TokenData(BaseModel):
    user_id: Optional[int] = None
    roles: List[str] = []
    permissions: List[str] = []

# Clerk Authentication Schemas
class ClerkWebhookEvent(BaseModel):
    type: str
    data: dict
    object: str = "event"

class ClerkUserCreated(BaseModel):
    id: str
    email_addresses: List[dict]
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    created_at: int
    updated_at: int

# RBAC Schemas
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleResponse(RoleBase):
    id: int
    is_default: bool
    created_at: datetime
    permissions: List[str] = []
    
    class Config:
        from_attributes = True

class PermissionBase(BaseModel):
    name: str
    description: Optional[str] = None

class PermissionResponse(PermissionBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserRoleAssignmentBase(BaseModel):
    user_id: int
    role_id: int

class UserRoleAssignmentResponse(UserRoleAssignmentBase):
    id: int
    assigned_by: int
    assigned_at: datetime
    
    class Config:
        from_attributes = True

class TeacherAssignmentBase(BaseModel):
    teacher_id: int
    student_id: int

class TeacherAssignmentResponse(TeacherAssignmentBase):
    id: int
    assigned_by: Optional[int] = None
    assigned_at: datetime
    active: bool
    
    class Config:
        from_attributes = True

# Teacher Code Schemas
class TeacherCodeBase(BaseModel):
    max_uses: Optional[int] = 1
    expires_at: Optional[datetime] = None

class TeacherCodeCreate(TeacherCodeBase):
    teacher_id: int

class TeacherCodeResponse(TeacherCodeBase):
    id: int
    code: str
    teacher_id: int
    teacher_name: str
    created_at: datetime
    use_count: int
    is_active: bool
    
    class Config:
        from_attributes = True

class TeacherCodeUseRequest(BaseModel):
    code: str

class TeacherCodeUseResponse(BaseModel):
    success: bool
    message: str
    teacher_name: Optional[str] = None

class StudentAccessResponse(BaseModel):
    student_id: int
    student_name: str
    teacher_id: int
    teacher_name: str
    granted_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

# Course Schemas
class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None

class CourseResponse(CourseBase):
    id: int
    total_modules: int
    created_by: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ModuleBase(BaseModel):
    title: str
    description: Optional[str] = None
    order: int

class ModuleResponse(ModuleBase):
    id: int
    course_id: int
    
    class Config:
        from_attributes = True

class UserCourseProgressBase(BaseModel):
    course_id: int
    last_visited_module_id: Optional[int] = None
    progress_percentage: float

class UserCourseProgressResponse(UserCourseProgressBase):
    id: int
    user_id: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    last_visited_at: datetime
    is_favorite: bool
    
    class Config:
        from_attributes = True

# Dashboard Schemas
class DashboardResponse(BaseModel):
    user: UserResponse
    last_visited_course: Optional[dict] = None
    available_courses: List[dict]
    recommended_courses: List[dict] = []

# Favorites Schemas
class FavoriteBase(BaseModel):
    lesson_id: int

class FavoriteResponse(FavoriteBase):
    id: int
    user_id: int
    created_at: datetime
    lesson_title: str
    course_title: str
    thumbnail_url: Optional[str] = None
    
    class Config:
        from_attributes = True

# Chat Schemas
class MessageBase(BaseModel):
    content: str
    message_type: Optional[str] = "text"

class MessageResponse(MessageBase):
    id: int
    thread_id: int
    sender_id: int
    sender_name: str
    sender_type: str
    timestamp: datetime
    read_status: bool
    
    class Config:
        from_attributes = True

class ThreadResponse(BaseModel):
    id: int
    user_id: int
    assigned_teacher_id: Optional[int] = None
    recipient_name: Optional[str] = None
    recipient_avatar: Optional[str] = None
    is_online: bool = False
    unread_count: int = 0
    created_at: datetime
    
    class Config:
        from_attributes = True

# Profile Schemas
class NoteBase(BaseModel):
    course_id: int
    lesson_id: int
    note_content: str

class NoteResponse(NoteBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    course_title: str
    lesson_title: str
    
    class Config:
        from_attributes = True

class ShareCourseResponse(BaseModel):
    shareable_link: str
    message: str = "Course shared successfully."