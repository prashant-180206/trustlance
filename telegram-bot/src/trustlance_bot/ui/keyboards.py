"""Inline keyboards and input classification."""

from __future__ import annotations

import re
from typing import Literal

from telegram import InlineKeyboardButton, InlineKeyboardMarkup

from ..config import Settings
from ..models import CompanyProjects, ProjectDetails

UUID_PATTERN = re.compile(
    r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
)
ADDRESS_PATTERN = re.compile(r"0x[a-fA-F0-9]{40}")

InputKind = Literal["project", "company", "invalid"]


def extract_project_id(text: str) -> str | None:
    match = UUID_PATTERN.search(text)
    return match.group(0) if match else None


def extract_address(text: str) -> str | None:
    match = ADDRESS_PATTERN.search(text)
    return match.group(0) if match else None


def classify_input(text: str) -> tuple[InputKind, str | None]:
    """Classify a free-text message as a project ID, wallet address, or invalid."""
    project_id = extract_project_id(text)
    if project_id:
        return "project", project_id

    address = extract_address(text)
    if address:
        return "company", address

    return "invalid", None


def _project_url(project_id: str, settings: Settings) -> str | None:
    base = (settings.web_app_url or "").rstrip("/")
    if not base.startswith(("http://", "https://")):
        return None
    return f"{base}/project/{project_id}"


def project_keyboard(
    details: ProjectDetails,
    settings: Settings,
) -> InlineKeyboardMarkup | None:
    url = _project_url(details.project.id, settings)
    if not url:
        return None
    return InlineKeyboardMarkup([[InlineKeyboardButton("🌐 Open in web app", url=url)]])


def company_keyboard(
    result: CompanyProjects,
    settings: Settings,
) -> InlineKeyboardMarkup | None:
    rows: list[list[InlineKeyboardButton]] = []

    for project in result.projects[:10]:
        title = project.title
        if len(title) > 40:
            title = title[:39].rstrip() + "…"
        rows.append(
            [
                InlineKeyboardButton(
                    f"📄 {title}",
                    callback_data=f"project:{project.id}",
                )
            ]
        )

    for address in result.chain_escrows[:5]:
        rows.append(
            [
                InlineKeyboardButton(
                    f"🔐 Escrow {address[:6]}…{address[-4:]}",
                    callback_data=f"escrow:{address}",
                )
            ]
        )

    return InlineKeyboardMarkup(rows) if rows else None
