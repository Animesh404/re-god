from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, UserFavorite, Module
from app.schemas import FavoriteResponse
from app.auth import get_current_user
from app.rbac import require_permission

router = APIRouter()

@router.post("/favourites/{lesson_id}", response_model=dict)
async def toggle_favorite(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle favorite status for a lesson"""
    # Check if lesson exists
    lesson = db.query(Module).filter(Module.id == lesson_id).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Check if user has access to the course
    from app.models import StudentTeacherAccess, Course
    if current_user.has_role("student"):
        course = db.query(Course).filter(Course.id == lesson.course_id).first()
        if course:
            has_access = db.query(StudentTeacherAccess).filter(
                StudentTeacherAccess.student_id == current_user.id,
                StudentTeacherAccess.teacher_id == course.created_by,
                StudentTeacherAccess.is_active == True
            ).first()
            
            if not has_access:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have access to this lesson"
                )
    
    # Check if already favorited
    existing_favorite = db.query(UserFavorite).filter(
        UserFavorite.user_id == current_user.id,
        UserFavorite.lesson_id == lesson_id
    ).first()
    
    if existing_favorite:
        # Remove from favorites
        db.delete(existing_favorite)
        db.commit()
        return {"action": "removed", "lesson_id": lesson_id}
    else:
        # Add to favorites
        new_favorite = UserFavorite(
            user_id=current_user.id,
            lesson_id=lesson_id
        )
        db.add(new_favorite)
        db.commit()
        db.refresh(new_favorite)
        return {"action": "added", "lesson_id": lesson_id}

@router.get("/favourites", response_model=List[FavoriteResponse])
async def get_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = 1,
    limit: int = 20
):
    """Get user's favorite lessons"""
    # Calculate offset
    offset = (page - 1) * limit
    
    # Get user's favorites
    favorites = db.query(UserFavorite).filter(
        UserFavorite.user_id == current_user.id
    ).offset(offset).limit(limit).all()
    
    # Prepare response
    response = []
    for fav in favorites:
        response.append(FavoriteResponse(
            id=fav.id,
            user_id=fav.user_id,
            lesson_id=fav.lesson_id,
            created_at=fav.created_at,
            lesson_title=fav.lesson.title,
            course_title=fav.lesson.course.title,
            thumbnail_url=fav.lesson.course.thumbnail_url
        ))
    
    return response

@router.delete("/favourites/{favorite_id}")
async def delete_favorite(
    favorite_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a favorite by ID"""
    favorite = db.query(UserFavorite).filter(
        UserFavorite.id == favorite_id,
        UserFavorite.user_id == current_user.id
    ).first()
    
    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found"
        )
    
    db.delete(favorite)
    db.commit()
    
    return {"message": "Favorite removed successfully"}