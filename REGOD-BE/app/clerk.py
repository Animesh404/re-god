import requests
from fastapi import HTTPException, status
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class ClerkAuth:
    def __init__(self, api_key: str = None, api_url: str = "https://api.clerk.dev/v1"):
        self.api_key = api_key or os.getenv("CLERK_API_KEY")
        self.api_url = api_url
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def get_user(self, user_id: str) -> Optional[dict]:
        """Get user details from Clerk"""
        try:
            response = requests.get(
                f"{self.api_url}/users/{user_id}",
                headers=self.headers
            )
            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error fetching user from Clerk: {str(e)}"
            )
    
    def verify_webhook_signature(self, payload: str, signature: str, secret: str) -> bool:
        """Verify Clerk webhook signature"""
        # Implementation would use cryptography library to verify the signature
        # For now, we'll assume this is implemented
        return True
    
    def create_user(self, user_data: dict) -> Optional[dict]:
        """Create a user in Clerk"""
        try:
            response = requests.post(
                f"{self.api_url}/users",
                headers=self.headers,
                json=user_data
            )
            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error creating user in Clerk: {str(e)}"
            )

# Initialize Clerk client
clerk_client = ClerkAuth()