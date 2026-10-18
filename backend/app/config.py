from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_env: str = "development"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    brevo_api_key: str = ""
    brevo_api_url: str = "https://api.brevo.com/v3/smtp/email"
    brevo_sender_name: str = "Syntrixa360 Website"
    brevo_sender_email: str = ""
    demo_notification_to: str = "support@syntrixa360.com"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
