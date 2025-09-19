from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.models import User, Course, UserCourseProgress, StudentTeacherAccess, Module
from app.schemas import DashboardResponse, UserCourseProgressBase, CourseResponse, ModuleResponse
from app.auth import get_current_user
from app.rbac import require_permission

router = APIRouter()

@router.get("/user/dashboard", response_model=DashboardResponse)
async def get_user_dashboard(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Get user dashboard with access control based on teacher relationships"""
    # For teachers, show all courses they created
    if current_user.has_role("teacher"):
        # Get teacher's courses
        teacher_courses = db.query(Course).filter(
            Course.created_by == current_user.id
        ).all()
        
        # Get user's course progress
        user_courses = db.query(UserCourseProgress).filter(
            UserCourseProgress.user_id == current_user.id
        ).all()
        
        # Find last visited course
        last_visited_course = None
        if user_courses:
            user_courses.sort(key=lambda x: x.last_visited_at, reverse=True)
            last_visited = user_courses[0]
            
            last_visited_course = {
                "course_id": last_visited.course_id,
                "course_title": last_visited.course.title,
                "thumbnail_url": last_visited.course.thumbnail_url,
                "last_visited_module_id": last_visited.last_visited_module_id,
                "last_visited_module_title": last_visited.last_visited_module.title if last_visited.last_visited_module else None,
                "overall_progress_percentage": last_visited.progress_percentage,
                "continue_url": f"/learn/{last_visited.course_id}/{last_visited.last_visited_module_id}" if last_visited.last_visited_module_id else f"/learn/{last_visited.course_id}"
            }
        
        # Prepare available courses
        available_courses = []
        for course in teacher_courses:
            # Find progress if exists
            progress = next((uc for uc in user_courses if uc.course_id == course.id), None)
            
            available_courses.append({
                "course_id": course.id,
                "course_title": course.title,
                "description": course.description,
                "thumbnail_url": course.thumbnail_url,
                "category": course.category,
                "difficulty": course.difficulty,
                "progress_percentage": progress.progress_percentage if progress else 0,
                "is_new": progress is None,
                "is_continue_available": progress is not None and progress.progress_percentage > 0
            })
    
    # For students, show only courses from teachers they have access to
    elif current_user.has_role("student"):
        # Get teachers the student has access to
        access_records = db.query(StudentTeacherAccess).filter(
            StudentTeacherAccess.student_id == current_user.id,
            StudentTeacherAccess.is_active == True
        ).all()
        
        teacher_ids = [access.teacher_id for access in access_records]
        
        # Get courses from these teachers
        teacher_courses = db.query(Course).filter(
            Course.created_by.in_(teacher_ids)
        ).all() if teacher_ids else []
        
        # Get user's course progress
        user_courses = db.query(UserCourseProgress).filter(
            UserCourseProgress.user_id == current_user.id
        ).all()
        
        # Find last visited course
        last_visited_course = None
        if user_courses:
            user_courses.sort(key=lambda x: x.last_visited_at, reverse=True)
            last_visited = user_courses[0]
            
            last_visited_course = {
                "course_id": last_visited.course_id,
                "course_title": last_visited.course.title,
                "thumbnail_url": last_visited.course.thumbnail_url,
                "last_visited_module_id": last_visited.last_visited_module_id,
                "last_visited_module_title": last_visited.last_visited_module.title if last_visited.last_visited_module else None,
                "overall_progress_percentage": last_visited.progress_percentage,
                "continue_url": f"/learn/{last_visited.course_id}/{last_visited.last_visited_module_id}" if last_visited.last_visited_module_id else f"/learn/{last_visited.course_id}"
            }
        
        # Prepare available courses
        available_courses = []
        for course in teacher_courses:
            # Find progress if exists
            progress = next((uc for uc in user_courses if uc.course_id == course.id), None)
            
            available_courses.append({
                "course_id": course.id,
                "course_title": course.title,
                "description": course.description,
                "thumbnail_url": course.thumbnail_url,
                "category": course.category,
                "difficulty": course.difficulty,
                "progress_percentage": progress.progress_percentage if progress else 0,
                "is_new": progress is None,
                "is_continue_available": progress is not None and progress.progress_percentage > 0
            })
    
    # For admins, show all courses
    else:
        # Get all courses
        all_courses = db.query(Course).filter(Course.is_active == True).all()
        
        # Get user's course progress
        user_courses = db.query(UserCourseProgress).filter(
            UserCourseProgress.user_id == current_user.id
        ).all()
        
        # Find last visited course
        last_visited_course = None
        if user_courses:
            user_courses.sort(key=lambda x: x.last_visited_at, reverse=True)
            last_visited = user_courses[0]
            
            last_visited_course = {
                "course_id": last_visited.course_id,
                "course_title": last_visited.course.title,
                "thumbnail_url": last_visited.course.thumbnail_url,
                "last_visited_module_id": last_visited.last_visited_module_id,
                "last_visited_module_title": last_visited.last_visited_module.title if last_visited.last_visited_module else None,
                "overall_progress_percentage": last_visited.progress_percentage,
                "continue_url": f"/learn/{last_visited.course_id}/{last_visited.last_visited_module_id}" if last_visited.last_visited_module_id else f"/learn/{last_visited.course_id}"
            }
        
        # Prepare available courses
        available_courses = []
        for course in all_courses:
            # Find progress if exists
            progress = next((uc for uc in user_courses if uc.course_id == course.id), None)
            
            available_courses.append({
                "course_id": course.id,
                "course_title": course.title,
                "description": course.description,
                "thumbnail_url": course.thumbnail_url,
                "category": course.category,
                "difficulty": course.difficulty,
                "progress_percentage": progress.progress_percentage if progress else 0,
                "is_new": progress is None,
                "is_continue_available": progress is not None and progress.progress_percentage > 0
            })
    
    return DashboardResponse(
        user=current_user,
        last_visited_course=last_visited_course,
        available_courses=available_courses
    )

@router.post("/learn/progress")
async def update_course_progress(
    progress_data: UserCourseProgressBase,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update course progress with access control"""
    # Check if user has access to this course
    course = db.query(Course).filter(Course.id == progress_data.course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # For students, check if they have access to the teacher who created the course
    if current_user.has_role("student"):
        has_access = db.query(StudentTeacherAccess).filter(
            StudentTeacherAccess.student_id == current_user.id,
            StudentTeacherAccess.teacher_id == course.created_by,
            StudentTeacherAccess.is_active == True
        ).first()
        
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this course"
            )
    
    # Find or create user course progress
    user_progress = db.query(UserCourseProgress).filter(
        UserCourseProgress.user_id == current_user.id,
        UserCourseProgress.course_id == progress_data.course_id
    ).first()
    
    if not user_progress:
        user_progress = UserCourseProgress(
            user_id=current_user.id,
            course_id=progress_data.course_id,
            progress_percentage=progress_data.progress_percentage,
            last_visited_module_id=progress_data.last_visited_module_id
        )
        db.add(user_progress)
    else:
        user_progress.progress_percentage = progress_data.progress_percentage
        if progress_data.last_visited_module_id:
            user_progress.last_visited_module_id = progress_data.last_visited_module_id
    
    db.commit()
    db.refresh(user_progress)
    
    return {
        "success": True, 
        "updated_progress_percentage": user_progress.progress_percentage
    }

@router.get("/courses", response_model=List[CourseResponse])
async def get_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all courses with access control"""
    if current_user.has_role("admin"):
        # Admins can see all courses
        courses = db.query(Course).filter(Course.is_active == True).all()
    elif current_user.has_role("teacher"):
        # Teachers can see their own courses
        courses = db.query(Course).filter(
            Course.created_by == current_user.id,
            Course.is_active == True
        ).all()
    else:
        # Students can only see courses from teachers they have access to
        access_records = db.query(StudentTeacherAccess).filter(
            StudentTeacherAccess.student_id == current_user.id,
            StudentTeacherAccess.is_active == True
        ).all()
        
        teacher_ids = [access.teacher_id for access in access_records]
        
        if not teacher_ids:
            return []
            
        courses = db.query(Course).filter(
            Course.created_by.in_(teacher_ids),
            Course.is_active == True
        ).all()
    
    return courses

@router.get("/courses/{course_id}/modules", response_model=List[ModuleResponse])
async def get_course_modules(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get modules for a specific course with access control"""
    # Check if user has access to this course
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check access for students
    if current_user.has_role("student"):
        has_access = db.query(StudentTeacherAccess).filter(
            StudentTeacherAccess.student_id == current_user.id,
            StudentTeacherAccess.teacher_id == course.created_by,
            StudentTeacherAccess.is_active == True
        ).first()
        
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this course"
            )
    
    # Get modules for the course
    modules = db.query(Module).filter(
        Module.course_id == course_id,
        Module.is_active == True
    ).order_by(Module.order).all()
    
    return modules