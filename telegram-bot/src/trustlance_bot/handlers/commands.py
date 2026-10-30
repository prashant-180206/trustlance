"""Telegram command and message handlers."""

from __future__ import annotations

import logging
from typing import cast

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Message, Update
from telegram.constants import ChatAction, ParseMode
from telegram.ext import ContextTypes

from ..config import Settings
from ..errors import BotError
from ..formatting import (
    chunk_html,
    format_company_projects,
    format_escrow_details,
    format_project_details,
)
from ..models import CompanyProjects, ProjectDetails
from ..services.trustlance import TrustLanceService
from ..ui.keyboards import (
    classify_input,
    company_keyboard,
    extract_address,
    extract_project_id,
    project_keyboard,
)

logger = logging.getLogger(__name__)

WELCOME = (
    "👋 <b>Welcome to TrustLance</b>\n\n"
    "I can explain a project in plain language — no wallet or block explorer needed.\n\n"
    "<b>Send me one of these:</b>\n"
    "• A <b>project ID</b> (the UUID from the project page or link)\n"
    "• A <b>company wallet address</b> (<code>0x…</code>) to see its open projects\n\n"
    "For example:\n"
    "<code>3f0c2a9e-8b1d-4c7a-9e2f-1a2b3c4d5e6f</code>\n"
    "<code>0x5FbDB2315678afecb367f032d93F642f64180aa3</code>\n\n"
    "Anything that needs a signature (funding, approving, disputing) opens in the web app."
)

HELP = (
    "<b>What can I do?</b>\n\n"
    "🔎 <b>Project details</b>\n"
    "Send a project ID or paste a project link. I will show the project, its escrow, "
    "every milestone, deadlines, disputes, and recent on-chain activity.\n\n"
    "🏢 <b>Company projects</b>\n"
    "Send a company wallet address. I will list the company's open projects and link "
    "each one to its full details.\n\n"
    "You can also use:\n"
    "/project &lt;id&gt;\n"
    "/company &lt;wallet&gt;\n"
    "/help"
)

INVALID_INPUT = (
    "🤔 I could not recognise that.\n\n"
    "Send a <b>project ID</b> like "
    "<code>3f0c2a9e-8b1d-4c7a-9e2f-1a2b3c4d5e6f</code>, "
    "or a <b>company wallet address</b> like "
    "<code>0x5FbDB2315678afecb367f032d93F642f64180aa3</code>.\n\n"
    "You can paste the whole project link too."
)


def _settings(context: ContextTypes.DEFAULT_TYPE) -> Settings:
    return cast(Settings, context.application.bot_data["settings"])


def _service(context: ContextTypes.DEFAULT_TYPE) -> TrustLanceService:
    return cast(TrustLanceService, context.application.bot_data["services"])


async def _typing(message: Message, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        await context.bot.send_chat_action(
            chat_id=message.chat_id,
            action=ChatAction.TYPING,
        )
    except Exception:
        logger.debug("could not send typing action", exc_info=True)


async def _reply_long(
    message: Message,
    text: str,
    *,
    reply_markup: InlineKeyboardMarkup | None = None,
) -> None:
    chunks = chunk_html(text)
    for index, chunk in enumerate(chunks):
        is_last = index == len(chunks) - 1
        await message.reply_text(
            chunk,
            parse_mode=ParseMode.HTML,
            reply_markup=reply_markup if is_last else None,
            do_quote=False,
        )


async def _send_project(
    message: Message,
    context: ContextTypes.DEFAULT_TYPE,
    project_id: str,
) -> None:
    service = _service(context)
    settings = _settings(context)
    await _typing(message, context)

    try:
        details: ProjectDetails = await service.get_project_details(project_id)
    except BotError as exc:
        await message.reply_text(f"⚠️ {exc.user_message}")
        return

    await _reply_long(
        message,
        format_project_details(details, settings),
        reply_markup=project_keyboard(details, settings),
    )


async def _send_company(
    message: Message,
    context: ContextTypes.DEFAULT_TYPE,
    wallet_address: str,
) -> None:
    service = _service(context)
    settings = _settings(context)
    await _typing(message, context)

    try:
        result: CompanyProjects = await service.get_company_projects(wallet_address)
    except BotError as exc:
        await message.reply_text(f"⚠️ {exc.user_message}")
        return

    await _reply_long(
        message,
        format_company_projects(result, settings),
        reply_markup=company_keyboard(result, settings),
    )


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if message is None:
        return

    keyboard = None
    settings = _settings(context)
    if settings.web_app_url.startswith(("http://", "https://")):
        keyboard = InlineKeyboardMarkup(
            [
                [
                    InlineKeyboardButton(
                        "🌐 Open TrustLance",
                        url=settings.web_app_url,
                    )
                ]
            ]
        )

    await message.reply_text(
        WELCOME,
        parse_mode=ParseMode.HTML,
        reply_markup=keyboard,
        do_quote=False,
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if message is None:
        return
    await message.reply_text(HELP, parse_mode=ParseMode.HTML, do_quote=False)


async def project_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if message is None:
        return

    raw = " ".join(context.args or [])
    project_id = extract_project_id(raw) if raw else None
    if not project_id:
        await message.reply_text(
            "Send a project ID like <code>3f0c2a9e-8b1d-4c7a-9e2f-1a2b3c4d5e6f</code>.",
            parse_mode=ParseMode.HTML,
        )
        return

    await _send_project(message, context, project_id)


async def company_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if message is None:
        return

    raw = " ".join(context.args or [])
    address = extract_address(raw) if raw else None
    if not address:
        await message.reply_text(
            "Send a company wallet address like "
            "<code>0x5FbDB2315678afecb367f032d93F642f64180aa3</code>.",
            parse_mode=ParseMode.HTML,
        )
        return

    await _send_company(message, context, address)


async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if message is None or not message.text:
        return

    kind, value = classify_input(message.text)
    if kind == "project" and value:
        await _send_project(message, context, value)
        return
    if kind == "company" and value:
        await _send_company(message, context, value)
        return

    await message.reply_text(INVALID_INPUT, parse_mode=ParseMode.HTML)


async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if query is None:
        return

    data = query.data or ""
    await query.answer()

    message = query.message
    if not isinstance(message, Message):
        return

    if data.startswith("project:"):
        project_id = data.split(":", 1)[1]
        await _send_project(message, context, project_id)
        return

    if data.startswith("escrow:"):
        address = data.split(":", 1)[1]
        await _typing(message, context)
        try:
            escrow = await _service(context).get_escrow_details(address)
        except BotError as exc:
            await message.reply_text(f"⚠️ {exc.user_message}")
            return
        await _reply_long(message, format_escrow_details(escrow, _settings(context)))


async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    logger.error("unhandled telegram update error", exc_info=context.error)

    if isinstance(update, Update) and update.effective_message is not None:
        try:
            await update.effective_message.reply_text(
                "⚠️ Something went wrong while handling that. Please try again.",
            )
        except Exception:
            logger.debug("could not send error message", exc_info=True)
