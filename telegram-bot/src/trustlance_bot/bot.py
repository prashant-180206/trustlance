"""Application wiring: config, clients, handlers, polling."""

from __future__ import annotations

import logging

from supabase import AsyncClient, acreate_client
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    MessageHandler,
    filters,
)

from .chain.web3_client import ChainService
from .config import Settings
from .db.supabase import SupabaseRepository
from .handlers import commands
from .services.trustlance import TrustLanceService

logger = logging.getLogger(__name__)


async def _post_init(application: Application) -> None:
    if application.bot_data.get("services") is not None:
        return

    settings: Settings = application.bot_data["settings"]

    client: AsyncClient | None = None
    if settings.supabase_enabled:
        try:
            assert settings.supabase_url is not None
            assert settings.supabase_key is not None
            client = await acreate_client(settings.supabase_url, settings.supabase_key)
        except Exception:
            logger.exception("could not create Supabase client")

    repository = SupabaseRepository(client)
    chain = ChainService(settings)
    application.bot_data["services"] = TrustLanceService(repository, chain, settings)

    logger.info(
        "bot ready (supabase=%s, rpc=%s, chain_id=%s)",
        repository.enabled,
        settings.rpc_url,
        settings.chain_id,
    )


async def _post_shutdown(application: Application) -> None:
    logger.info("bot stopped")


def build_application(
    settings: Settings,
    service: TrustLanceService | None = None,
) -> Application:
    application = (
        Application.builder()
        .token(settings.telegram_bot_token.get_secret_value())
        .post_init(_post_init)
        .post_shutdown(_post_shutdown)
        .build()
    )

    application.bot_data["settings"] = settings
    if service is not None:
        application.bot_data["services"] = service

    application.add_handler(CommandHandler("start", commands.start))
    application.add_handler(CommandHandler("help", commands.help_command))
    application.add_handler(CommandHandler("project", commands.project_command))
    application.add_handler(CommandHandler("company", commands.company_command))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, commands.handle_text))
    application.add_handler(CallbackQueryHandler(commands.handle_callback))
    application.add_error_handler(commands.error_handler)

    return application
