"""Entry point."""

from __future__ import annotations

import logging

from telegram import Update

from .bot import build_application
from .config import get_settings


def _configure_logging(level: str) -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
    )
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("web3").setLevel(logging.WARNING)
    logging.getLogger("telegram").setLevel(logging.WARNING)


def main() -> None:
    settings = get_settings()
    _configure_logging(settings.log_level)

    application = build_application(settings)
    application.run_polling(
        allowed_updates=Update.ALL_TYPES,
        drop_pending_updates=True,
    )


if __name__ == "__main__":
    main()
