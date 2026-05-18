from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "OpenSarthi"
    wake_words: list[str] = ["hey sarthi", "hello sarthi"]
    local_model: str = "qwen2.5-coder:3b"
    cloud_model: str = "kimi-k2.5:cloud"
    openrouter_api_key: str | None = None
    gemini_api_key: str | None = None
    
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()

def save_settings_to_env(local_model: str, cloud_model: str, gemini_api_key: str | None):
    import os
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    with open(env_path, "w") as f:
        f.write(f"LOCAL_MODEL={local_model}\n")
        f.write(f"CLOUD_MODEL={cloud_model}\n")
        if gemini_api_key:
            f.write(f"GEMINI_API_KEY={gemini_api_key}\n")
