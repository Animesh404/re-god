from fastapi import APIRouter, Request, HTTPException, status, Depends, Header
from sqlalchemy.orm import Session
from jose import jwt
import requests
from app.database import get_db
from app.models import User
from app.clerk import clerk_client
import os
import hmac
import hashlib
import json

# Clerk settings
CLERK_JWKS_URL = "https://api.clerk.com/v1/jwks"  # Clerk’s JWKS endpoint
CLERK_ISSUER = "https://clerk.your-domain.com"    # Replace with your Clerk issuer

# Cache Clerk public keys
_jwks_cache = None

CLERK_WEBHOOK_SECRET = os.getenv("CLERK_WEBHOOK_SECRET")

router = APIRouter()

def get_jwks():
    global _jwks_cache
    if not _jwks_cache:
        resp = requests.get(CLERK_JWKS_URL)
        if resp.status_code != 200:
            raise HTTPException(
                status_code=500,
                detail="Unable to fetch Clerk JWKS"
            )
        _jwks_cache = resp.json()
    return _jwks_cache

def verify_clerk_token(token: str):
    try:
        jwks = get_jwks()
        # Decode + verify Clerk JWT
        decoded = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            options={"verify_aud": False},  # adjust if you use audience
            issuer=CLERK_ISSUER
        )
        return decoded
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Clerk token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(
    db: Session = Depends(get_db),
    authorization: str = Header(None)
) -> User:
    """Validate Clerk JWT and return local DB user (create if not exists)."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ")[1]
    decoded = verify_clerk_token(token)
    clerk_user_id = decoded.get("sub")

    if not clerk_user_id:
        raise HTTPException(status_code=401, detail="Invalid Clerk token (no subject)")

    # Fetch Clerk user profile
    clerk_user = clerk_client.users.get_user(clerk_user_id)
    if not clerk_user:
        raise HTTPException(status_code=401, detail="User not found in Clerk")

    # Extract email
    user_email = clerk_user.email_addresses[0].email_address if clerk_user.email_addresses else None
    if not user_email:
        raise HTTPException(status_code=401, detail="User email not found")

    # Sync with local DB
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        user = User(
            email=user_email,
            name=f"{clerk_user.first_name or ''} {clerk_user.last_name or ''}".strip() or "User",
            clerk_user_id=clerk_user_id,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def verify_webhook_signature(request: Request, body: bytes):
    """Verify Clerk webhook using secret."""
    signature = request.headers.get("svix-signature")
    if not signature:
        raise HTTPException(status_code=401, detail="Missing signature header")

    # Verify signature (Clerk uses Svix for webhooks)
    expected_signature = hmac.new(
        CLERK_WEBHOOK_SECRET.encode(),
        body,
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

@router.post("/webhooks/clerk")
async def clerk_webhook(request: Request, db: Session = Depends(get_db)):
    """Webhook endpoint for Clerk user events."""
    body = await request.body()
    
    try:
        verify_webhook_signature(request, body)
    except HTTPException as e:
        raise e
    
    event = json.loads(body)
    event_type = event.get("type")
    data = event.get("data", {})

    if event_type == "user.created":
        email = data["email_addresses"][0]["email_address"] if data.get("email_addresses") else None
        if email:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    name=f"{data.get('first_name', '')} {data.get('last_name', '')}".strip() or "User",
                    clerk_user_id=data.get("id"),
                    is_verified=True,
                )
                db.add(user)
                db.commit()
                db.refresh(user)

    elif event_type == "user.updated":
        user = db.query(User).filter(User.clerk_user_id == data.get("id")).first()
        if user:
            user.name = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip() or user.name
            db.commit()

    elif event_type == "user.deleted":
        user = db.query(User).filter(User.clerk_user_id == data.get("id")).first()
        if user:
            db.delete(user)
            db.commit()

    return {"status": "success"}
