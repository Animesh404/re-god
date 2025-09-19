#!/usr/bin/env python3
"""
Complete database reset script
"""
import os
import sys
from sqlalchemy import create_engine, text

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.database import Base, engine, SessionLocal
from app.models import *

def clean_reset():
    """Drop all tables and recreate with current models"""
    print("Starting complete database reset...")
    
    try:
        # Drop all existing tables
        print("1. Dropping all existing tables...")
        with engine.connect() as conn:
            # Get all table names
            result = conn.execute(text("""
                SELECT tablename 
                FROM pg_tables 
                WHERE schemaname = 'public'
            """))
            tables = [row[0] for row in result.fetchall()]
            
            if tables:
                print(f"   Found {len(tables)} existing tables: {', '.join(tables)}")
                # Drop each table with CASCADE
                for table in tables:
                    conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
                conn.commit()
                print("   ✓ All tables dropped")
            else:
                print("   No existing tables found")
        
        # Create all tables according to current models
        print("2. Creating tables from models...")
        Base.metadata.create_all(bind=engine)
        print("   ✓ Tables created successfully")
        
        # Verify tables were created
        print("3. Verifying table creation...")
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT tablename 
                FROM pg_tables 
                WHERE schemaname = 'public' 
                ORDER BY tablename
            """))
            new_tables = [row[0] for row in result.fetchall()]
            
            print(f"   Created {len(new_tables)} tables:")
            for table in new_tables:
                print(f"     - {table}")
        
        # Initialize RBAC
        print("4. Initializing RBAC system...")
        init_rbac()
        
        print("\n✅ Database reset completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during reset: {e}")
        import traceback
        traceback.print_exc()

def init_rbac():
    """Initialize RBAC system with default roles and permissions"""
    db = SessionLocal()
    try:
        # Create default permissions
        permissions_data = [
            ("user:read", "Read user data"),
            ("user:write", "Write user data"),
            ("user:delete", "Delete user data"),
            ("course:read", "Read course data"),
            ("course:write", "Write course data"),
            ("course:delete", "Delete course data"),
            ("module:read", "Read module data"),
            ("module:write", "Write module data"),
            ("module:delete", "Delete module data"),
            ("admin:all", "Full administrative access"),
            ("teacher:manage", "Manage teacher functions"),
            ("student:access", "Student access rights"),
        ]
        
        permissions = []
        for name, description in permissions_data:
            permission = Permission(name=name, description=description)
            permissions.append(permission)
            db.add(permission)
        
        # Create default roles
        admin_role = Role(
            name="admin", 
            description="Administrator with full access",
            is_default=False
        )
        
        teacher_role = Role(
            name="teacher", 
            description="Teacher with course and student management access",
            is_default=False
        )
        
        user_role = Role(
            name="user", 
            description="Regular user with basic access",
            is_default=True
        )
        
        db.add(admin_role)
        db.add(teacher_role)
        db.add(user_role)
        
        # Commit to get the IDs
        db.commit()
        
        # Assign permissions to roles
        admin_role.permissions = permissions
        
        teacher_permissions = [p for p in permissions if p.name in [
            "user:read", "course:read", "course:write", "module:read", 
            "module:write", "teacher:manage", "student:access"
        ]]
        teacher_role.permissions = teacher_permissions
        
        user_permissions = [p for p in permissions if p.name in [
            "course:read", "module:read", "student:access"
        ]]
        user_role.permissions = user_permissions
        
        db.commit()
        print("   ✓ RBAC initialized with 3 roles and 12 permissions")
        
    except Exception as e:
        print(f"   ❌ Error initializing RBAC: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    clean_reset()