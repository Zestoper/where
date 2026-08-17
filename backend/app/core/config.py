from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str          # .env의 DATABASE_URL이 문자열이니까 타입은?

    model_config = SettingsConfigDict(env_file=".env")   # .env 파일 경로/이름

settings = Settings()   # 다른 파일에서 import해서 쓸 수 있게 인스턴스 하나 만들어둠
