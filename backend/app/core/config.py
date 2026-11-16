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
    # 소셜 로그인 (구글 · 카카오) — app/api/v1/endpoints/oauth.py
    BACKEND_URL: str = ""            # 이 서버 주소. 비우면 Render 주소 → http://localhost:8000 순으로 잡는다
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    KAKAO_REST_API_KEY: str = ""
    KAKAO_CLIENT_SECRET: str = ""    # 카카오 콘솔에서 Client Secret 을 '사용'으로 켰을 때만
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()   
