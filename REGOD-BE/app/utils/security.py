import secrets
import string
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def generate_random_string(length=16):
    """Generate a random string of specified length"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def generate_secure_token(length=32):
    """Generate a cryptographically secure token"""
    return secrets.token_urlsafe(length)

def verify_password(plain_password, hashed_password):
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Hash a password"""
    return pwd_context.hash(password)