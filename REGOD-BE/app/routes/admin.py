from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, Role, Permission, TeacherAssignment, TeacherCode, StudentTeacherAccess
from app.schemas import RoleResponse, PermissionResponse, TeacherAssignmentResponse, UserResponse, TeacherCodeResponse
from app.auth import get_current_user
from app.rbac import require_permission, require_role

router = APIRouter()

@router.get("/users", response_model=List[UserResponse])
@require_permission("admin:users:manage")
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/roles", response_model=List[RoleResponse])
@require_permission("admin:users:manage")
async def get_all_roles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all roles (admin only)"""
    roles = db.query(Role).all()
    return roles

@router.get("/permissions", response_model=List[PermissionResponse])
@require_permission("admin:users:manage")
async def get_all_permissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all permissions (admin only)"""
    permissions = db.query(Permission).all()
    return permissions

@router.post("/users/{user_id}/roles/{role_id}")
@require_permission("admin:users:manage")
async def assign_role_to_user(
    user_id: int,
    role_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Assign a role to a user (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role not in user.roles:
        user.roles.append(role)
        db.commit()
    
    return {"message": f"Role '{role.name}' assigned to user '{user.name}'"}

@router.delete("/users/{user_id}/roles/{role_id}")
@require_permission("admin:users:manage")
async def remove_role_from_user(
    user_id: int,
    role_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a role from a user (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role in user.roles:
        user.roles.remove(role)
        db.commit()
    
    return {"message": f"Role '{role.name}' removed from user '{user.name}'"}

@router.get("/teacher-assignments", response_model=List[TeacherAssignmentResponse])
@require_permission("admin:users:manage")
async def get_all_teacher_assignments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all teacher assignments (admin only)"""
    assignments = db.query(TeacherAssignment).all()
    return assignments

@router.post("/teacher-assignments")
@require_permission("admin:users:manage")
async def create_teacher_assignment(
    assignment_data: TeacherAssignmentResponse,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a teacher assignment (admin only)"""
    # Check if teacher exists and has teacher role
    teacher = db.query(User).filter(User.id == assignment_data.teacher_id).first()
    if not teacher or not teacher.has_role("teacher"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid teacher ID"
        )
    
    # Check if student exists
    student = db.query(User).filter(User.id == assignment_data.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if assignment already exists
    existing_assignment = db.query(TeacherAssignment).filter(
        TeacherAssignment.teacher_id == assignment_data.teacher_id,
        TeacherAssignment.student_id == assignment_data.student_id
    ).first()
    
    if existing_assignment:
        if not existing_assignment.active:
            existing_assignment.active = True
            existing_assignment.assigned_by = current_user.id
            db.commit()
            return {"message": "Teacher assignment reactivated"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Teacher assignment already exists"
            )
    
    # Create new assignment
    assignment = TeacherAssignment(
        teacher_id=assignment_data.teacher_id,
        student_id=assignment_data.student_id,
        assigned_by=current_user.id
    )
    
    db.add(assignment)
    db.commit()
    
    return {"message": "Teacher assignment created successfully"}

@router.delete("/teacher-assignments/{assignment_id}")
@require_permission("admin:users:manage")
async def delete_teacher_assignment(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a teacher assignment (admin only)"""
    assignment = db.query(TeacherAssignment).filter(TeacherAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    db.delete(assignment)
    db.commit()
    
    return {"message": "Teacher assignment deleted successfully"}

@router.get("/teacher-codes", response_model=List[TeacherCodeResponse])
@require_permission("admin:users:manage")
async def get_all_teacher_codes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all teacher codes (admin only)"""
    teacher_codes = db.query(TeacherCode).all()
    
    response = []
    for code in teacher_codes:
        teacher = db.query(User).filter(User.id == code.teacher_id).first()
        response.append(TeacherCodeResponse(
            id=code.id,
            code=code.code,
            teacher_id=code.teacher_id,
            teacher_name=teacher.name if teacher else "Unknown Teacher",
            created_at=code.created_at,
            max_uses=code.max_uses,
            expires_at=code.expires_at,
            use_count=code.use_count,
            is_active=code.is_active
        ))
    
    return response