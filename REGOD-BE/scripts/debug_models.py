#!/usr/bin/env python3
"""
Debug script to check SQLAlchemy models
"""
import os
import sys

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

try:
    print("1. Importing database...")
    from app.database import Base, engine
    print("   ✓ Database imported successfully")
    
    print("2. Testing database connection...")
    with engine.connect() as conn:
        print("   ✓ Database connection successful")
    
    print("3. Importing models...")
    from app.models import *
    print("   ✓ Models imported successfully")
    
    print("4. Checking Base.metadata...")
    print(f"   Found {len(Base.metadata.tables)} tables in metadata:")
    for table_name in Base.metadata.tables:
        print(f"     - {table_name}")
    
    print("5. Attempting to create tables...")
    Base.metadata.create_all(bind=engine)
    print("   ✓ Tables created successfully")
    
    print("6. Verifying tables in database...")
    from sqlalchemy import text
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename;
        """))
        tables = result.fetchall()
        
        if tables:
            print(f"   Found {len(tables)} tables in database:")
            for table in tables:
                print(f"     - {table[0]}")
        else:
            print("   ❌ No tables found in database!")
            
except ImportError as e:
    print(f"❌ Import error: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()