from pydantic import BaseModel, EmailStr, Field, field_validator
import re

class DemoRequestIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    company: str = Field(min_length=2, max_length=160)
    phone: str = Field(min_length=7, max_length=30)
    industry: str = Field(min_length=1, max_length=80)
    team_size: str = Field(min_length=1, max_length=30)
    message: str = Field(default="", max_length=2000)

    @field_validator("name", "company", "phone", "industry", "team_size")
    @classmethod
    def trim_nonempty(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty")
        return value

    @field_validator("phone")
    @classmethod
    def phone_chars(cls, value: str) -> str:
        if not re.fullmatch(r"[+0-9() .-]{7,30}", value):
            raise ValueError("Enter a valid phone number")
        return value

    @field_validator("message")
    @classmethod
    def trim_message(cls, value: str) -> str:
        return value.strip()

class DemoRequestOut(BaseModel):
    request_id: str
    status: str
    message: str
