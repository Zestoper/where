from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    SEOUL_API_KEY: str
    NAVER_CLIENT_ID: str
    NAVER_CLIENT_SECRET: str
    NAVER_SEARCH_CLIENT_ID: str
    NAVER_SEARCH_CLIENT_SECRET: str
    ADMIN_KEY: str
    JWT_SECRET: str
    FRONTEND_URL: str = "http://localhost:5173"
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()   
