from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import json

def format_timestamp(dt: datetime) -> str:
    """Format datetime to ISO string"""
    return dt.isoformat() if dt else None

def parse_timestamp(ts: str) -> Optional[datetime]:
    """Parse ISO string to datetime"""
    try:
        return datetime.fromisoformat(ts.replace('Z', '+00:00'))
    except (ValueError, TypeError):
        return None

def filter_none_values(data: Dict[str, Any]) -> Dict[str, Any]:
    """Remove None values from a dictionary"""
    return {k: v for k, v in data.items() if v is not None}

def paginate_query(query, page: int, page_size: int):
    """Paginate a SQLAlchemy query"""
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 10
    if page_size > 100:
        page_size = 100
        
    return query.offset((page - 1) * page_size).limit(page_size)

def calculate_pagination_metadata(total_items: int, page: int, page_size: int):
    """Calculate pagination metadata"""
    total_pages = (total_items + page_size - 1) // page_size
    return {
        "page": page,
        "page_size": page_size,
        "total_items": total_items,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1
    }

def safe_json_loads(json_str: str, default=None):
    """Safely parse JSON string"""
    try:
        return json.loads(json_str)
    except (json.JSONDecodeError, TypeError):
        return default

def validate_email(email: str) -> bool:
    """Simple email validation"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))