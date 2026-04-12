from fastapi import APIRouter
from pydantic import BaseModel, EmailStr

from services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    mobile: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class OTPRequest(BaseModel):
    email: EmailStr
    otp: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


class ResendOTPRequest(BaseModel):
    email: EmailStr


# @router.post("/register", status_code=201)
# async def register(body: RegisterRequest):
#     user = await auth_service.register(body.name, body.email, body.password, body.mobile)
#     return {"message": "Registration successful. OTP sent to your email.", "user_id": str(user.inserted_id)}

# For the deployment, we will skip OTP verification for registration to simplify the user experience.
@router.post("/register", status_code=201)
async def register(body: RegisterRequest):
    return await auth_service.register(
        body.name, body.email, body.password, body.mobile
    )

@router.post("/verify-otp")
def verify_otp(body: OTPRequest):
    return auth_service.verify_otp(body.email, body.otp)


@router.post("/login")
def login(body: LoginRequest):
    return auth_service.login(body.email, body.password)


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    return await auth_service.forgot_password(body.email)


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest):
    return auth_service.reset_password(body.email, body.otp, body.new_password)


@router.post("/resend-otp")
async def resend_otp(body: ResendOTPRequest):
    return await auth_service.resend_otp(body.email)


@router.get("/test-smtp/{email}")
async def test_smtp(email: str):
    """Test SMTP connection - sends a test OTP email"""
    from services.auth_service import send_otp_email
    from utils.helpers import generate_otp
    
    test_otp = generate_otp()
    success = await send_otp_email(email, test_otp)
    
    if success:
        return {
            "status": "success",
            "message": f"Test email sent to {email}",
            "test_otp": test_otp
        }
    else:
        return {
            "status": "failed",
            "message": f"Failed to send test email to {email}. Check backend logs for details."
        }