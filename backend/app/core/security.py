from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from app.core.config import settings

security = HTTPBearer()

class UserPayload(BaseModel):
    id: str
    email: str

def verify_supabase_jwt(token: str) -> UserPayload:
    """
    Decodes and verifies a Supabase JWT.
    In Supabase, access tokens are signed with the project's JWT secret (using HS256).
    The 'sub' claim corresponds to the user's ID, and the 'email' claim contains their email.
    """
    try:
        # Decode the token using the Supabase JWT secret
        # In a production context, you could also fetch the JWKS if using RS256,
        # but Supabase default JWT is signed with the project JWT Secret (HS256).
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience=settings.SUPABASE_AUDIENCE
        )
        
        user_id = payload.get("sub")
        email = payload.get("email")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject claim"
            )
            
        # Fallback if email is structured differently in some payloads (e.g. user_metadata)
        if not email:
            email = payload.get("user_metadata", {}).get("email", "")
            
        return UserPayload(id=user_id, email=email)
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}"
        )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> UserPayload:
    """
    FastAPI dependency that extracts the Bearer token and returns the verified user info.
    """
    return verify_supabase_jwt(credentials.credentials)
