"""Configuration loaded from environment variables / .env."""

from __future__ import annotations

from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_FACTORY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"


class Settings(BaseSettings):
    """Bot configuration.

    All values come from the process environment or a local ``.env`` file.
    Secrets are wrapped in :class:`SecretStr` so they never appear in logs.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Telegram
    telegram_bot_token: SecretStr

    # Chain (Anvil by default)
    rpc_url: str = "http://127.0.0.1:8545"
    chain_id: int = 31337
    factory_address: str = DEFAULT_FACTORY_ADDRESS
    deployment_block: int = 0

    # Supabase (read-only). The bot prefers the service key when present.
    supabase_url: str | None = None
    supabase_anon_key: SecretStr | None = None
    supabase_service_role_key: SecretStr | None = None

    # Links shown to users
    web_app_url: str = "http://localhost:5173"
    ipfs_gateway: str = "https://ipfs.io/ipfs/"

    # Runtime
    log_level: str = "INFO"
    cache_ttl_seconds: int = 30
    request_timeout_seconds: float = 10.0
    max_projects_per_page: int = 10
    max_milestones: int = 25
    max_activity_events: int = 10

    @property
    def supabase_key(self) -> str | None:
        """Return the strongest configured Supabase key, if any."""
        if self.supabase_service_role_key is not None:
            return self.supabase_service_role_key.get_secret_value()
        if self.supabase_anon_key is not None:
            return self.supabase_anon_key.get_secret_value()
        return None

    @property
    def supabase_enabled(self) -> bool:
        return bool(self.supabase_url and self.supabase_key)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the process-wide settings singleton."""
    return Settings()  # type: ignore[call-arg]
