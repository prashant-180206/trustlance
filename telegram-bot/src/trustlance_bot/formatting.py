"""Plain-language Telegram message rendering.

All dynamic text is HTML-escaped before it is embedded in a message. The bot
never sends raw tracebacks, wei values, or unlabelled hex to users.
"""

from __future__ import annotations

import html
from datetime import UTC, datetime
from decimal import Decimal
from urllib.parse import quote, urlparse

from .config import Settings
from .models import (
    CompanyProjects,
    EscrowInfo,
    Milestone,
    MilestoneStatus,
    Project,
    ProjectDetails,
)

WEI_PER_ETH = Decimal(10**18)
MILESTONE_STATUS_LABEL = {
    "draft": "⚪ Draft",
    "open": "🟢 Open for proposals",
    "in_progress": "🔵 In progress",
    "completed": "✅ Completed",
    "cancelled": "⛔ Cancelled",
}


def _escape(value: object) -> str:
    return html.escape(str(value), quote=False)


def _truncate(value: str, limit: int) -> str:
    value = " ".join(value.split())
    if len(value) <= limit:
        return value
    return value[: limit - 1].rstrip() + "…"


def format_amount(value: Decimal | int | float | None) -> str:
    """Format an ETH amount without trailing zeros, capped at 6 decimals."""
    if value is None:
        return "—"

    amount = Decimal(str(value))
    if amount == 0:
        return "0"
    if 0 < amount < Decimal("0.000001"):
        return "< 0.000001"

    text = f"{amount:.6f}".rstrip("0").rstrip(".")
    return text or "0"


def format_eth(wei: int | None) -> str:
    """Convert a wei integer to a readable ETH amount."""
    if wei is None:
        return "—"
    return format_amount(Decimal(int(wei)) / WEI_PER_ETH)


def format_datetime(value: datetime | None) -> str:
    if value is None:
        return "not set"
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.astimezone(UTC).strftime("%d %b %Y")


def format_timestamp(value: int | float | None) -> str:
    timestamp = int(value or 0)
    if timestamp <= 0:
        return "not set"
    return datetime.fromtimestamp(timestamp, UTC).strftime("%d %b %Y %H:%M UTC")


def short_address(address: str | None) -> str:
    if not address:
        return "not set"
    if len(address) <= 12:
        return address
    return f"{address[:6]}…{address[-4:]}"


def _ipfs_url(cid: str, settings: Settings) -> str | None:
    if not cid or not cid.replace("-", "").isalnum():
        return None
    gateway = settings.ipfs_gateway.rstrip("/") + "/"
    return gateway + quote(cid, safe="")


def _project_status_label(status: str) -> str:
    return MILESTONE_STATUS_LABEL.get(status, f"❔ {status.replace('_', ' ').title()}")


def _format_deadlines(milestone: Milestone) -> list[str]:
    lines: list[str] = []
    if milestone.submitted_at:
        lines.append(f"   Submitted: {format_timestamp(milestone.submitted_at)}")
    if milestone.review_deadline:
        lines.append(f"   Review deadline: {format_timestamp(milestone.review_deadline)}")
    if milestone.dispute_deadline:
        lines.append(f"   Dispute deadline: {format_timestamp(milestone.dispute_deadline)}")
    return lines


def _format_milestones(escrow: EscrowInfo, settings: Settings) -> list[str]:
    lines = [f"<b>Milestones ({escrow.milestone_count})</b>"]
    if not escrow.milestones:
        lines.append("No milestones have been created yet.")
        return lines

    for milestone in escrow.milestones:
        number = milestone.index + 1
        description = _truncate(milestone.description, 120) or "Untitled milestone"
        lines.append(
            f"\n{milestone.status.emoji} <b>#{number} {_escape(description)}</b>\n"
            f"   Amount: {format_eth(milestone.amount_wei)} ETH\n"
            f"   Status: {milestone.status.label}"
        )
        lines.extend(_format_deadlines(milestone))

        if milestone.deliverable_cid:
            cid = _truncate(milestone.deliverable_cid, 32)
            url = _ipfs_url(milestone.deliverable_cid, settings)
            if url:
                lines.append(f'   Deliverable: <a href="{_escape(url)}">{_escape(cid)}</a>')
            else:
                lines.append(f"   Deliverable: <code>{_escape(cid)}</code>")

    if escrow.milestone_count > len(escrow.milestones):
        hidden = escrow.milestone_count - len(escrow.milestones)
        lines.append(f"\n…and {hidden} more milestone(s).")

    return lines


def _format_disputes(escrow: EscrowInfo) -> list[str]:
    disputed = [m for m in escrow.milestones if m.status is MilestoneStatus.DISPUTED]
    rejected = [m for m in escrow.milestones if m.status is MilestoneStatus.REJECTED]

    lines = ["<b>Disputes</b>"]
    if not disputed and not rejected:
        lines.append("✅ No open disputes.")
        return lines

    for milestone in disputed:
        number = milestone.index + 1
        if milestone.dispute_deadline:
            lines.append(
                f"🟠 Milestone #{number} is in dispute. The decision window ends on "
                f"{format_timestamp(milestone.dispute_deadline)}. If nobody acts by then, "
                "the freelancer is paid automatically."
            )
        else:
            lines.append(f"🟠 Milestone #{number} is in dispute.")

    for milestone in rejected:
        number = milestone.index + 1
        lines.append(
            f"🔴 Milestone #{number} was rejected. The freelancer can still open a dispute."
        )

    return lines


def _format_escrow(escrow: EscrowInfo, settings: Settings) -> list[str]:
    if escrow.cancelled:
        state = "⛔ Cancelled"
    elif escrow.funded:
        state = "✅ Funded"
    else:
        state = "⚪ Not funded yet"

    lines = [
        "<b>Escrow</b>",
        f"Contract: <code>{_escape(escrow.address)}</code>",
        f"State: {state}",
        f"Locked in escrow: {format_eth(escrow.total_escrowed_wei)} ETH",
        f"Contract balance: {format_eth(escrow.balance_wei)} ETH",
        f"Client: <code>{_escape(escrow.client)}</code>",
        f"Freelancer: <code>{_escape(escrow.freelancer or 'not assigned yet')}</code>",
    ]

    if escrow.client_cancellation_requested and escrow.freelancer_cancellation_requested:
        lines.append("Cancellation: both parties agreed — the project is cancelled.")
    elif escrow.client_cancellation_requested:
        lines.append("Cancellation: requested by the client, waiting for the freelancer.")
    elif escrow.freelancer_cancellation_requested:
        lines.append("Cancellation: requested by the freelancer, waiting for the client.")

    lines.append("")
    lines.extend(_format_milestones(escrow, settings))
    lines.append("")
    lines.extend(_format_disputes(escrow))

    if escrow.activity:
        lines.append("")
        lines.append("<b>Recent on-chain activity</b>")
        lines.extend(f"• {_escape(event.summary)}" for event in escrow.activity)

    return lines


def format_project_details(details: ProjectDetails, settings: Settings) -> str:
    project = details.project

    lines: list[str] = [
        f"🏷 <b>{_escape(project.title)}</b>",
        f"🆔 <code>{_escape(project.id)}</code>",
    ]

    if project.description:
        lines.extend(["", _escape(_truncate(project.description, 800))])

    lines.append("")
    if project.company_name:
        lines.append(f"🏢 Company: {_escape(project.company_name)}")
    lines.append(f"📌 Status: {_project_status_label(project.status)}")
    if project.budget is not None:
        lines.append(f"💰 Budget: {format_amount(project.budget)} ETH")
    if project.deadline:
        lines.append(f"📅 Deadline: {format_datetime(project.deadline)}")
    if project.created_at:
        lines.append(f"🗓 Created: {format_datetime(project.created_at)}")

    lines.append("")
    if details.escrow is not None:
        lines.extend(_format_escrow(details.escrow, settings))
    else:
        lines.append("<b>Escrow</b>")
        if project.escrow_address:
            lines.append(f"Contract: <code>{_escape(project.escrow_address)}</code>")
            lines.append("On-chain details are unavailable right now.")
        else:
            lines.append(
                "This project does not have an escrow contract linked yet. "
                "The client has not funded it on-chain."
            )

    if details.warnings:
        lines.append("")
        lines.extend(f"ℹ️ {_escape(warning)}" for warning in details.warnings)

    return "\n".join(lines)


def format_escrow_details(escrow: EscrowInfo, settings: Settings) -> str:
    lines = [
        "🔐 <b>Escrow contract</b>",
        f"<code>{_escape(escrow.address)}</code>",
        "",
    ]
    lines.extend(_format_escrow(escrow, settings))
    return "\n".join(lines)


def _format_project_row(index: int, project: Project) -> list[str]:
    lines = [f"{index}. <b>{_escape(project.title)}</b>"]
    meta: list[str] = []
    if project.budget is not None:
        meta.append(f"💰 {format_amount(project.budget)} ETH")
    if project.deadline:
        meta.append(f"📅 {format_datetime(project.deadline)}")
    if project.escrow_address:
        meta.append("🔐 escrow linked")
    if meta:
        lines.append("   " + " · ".join(meta))
    if project.description:
        lines.append(f"   {_escape(_truncate(project.description, 180))}")
    return lines


def format_company_projects(result: CompanyProjects, settings: Settings) -> str:
    lines = [
        f"🏢 <b>{_escape(result.company.company_name if result.company else 'Company wallet')}</b>",
        f"💼 Wallet: <code>{_escape(result.wallet_address)}</code>",
    ]

    if result.company:
        if result.company.industry:
            lines.append(f"🏭 Industry: {_escape(result.company.industry)}")
        if result.company.website:
            parsed = urlparse(result.company.website)
            if parsed.scheme in {"http", "https"}:
                lines.append(f'🌐 Website: <a href="{_escape(result.company.website)}">website</a>')
        if result.company.description:
            lines.extend(["", _escape(_truncate(result.company.description, 300))])

    lines.append("")
    if result.projects:
        lines.append(f"<b>Available projects ({len(result.projects)})</b>")
        for index, project in enumerate(result.projects, start=1):
            lines.extend([""])
            lines.extend(_format_project_row(index, project))
        lines.extend(
            [
                "",
                "Tap a project button below to see its milestones, escrow, disputes, "
                "and full details.",
            ]
        )
    elif result.company:
        lines.append("No open projects right now.")

    if result.chain_escrows:
        lines.extend(["", f"<b>Escrows created by this wallet ({len(result.chain_escrows)})</b>"])
        lines.append(
            "This wallet has escrow contracts on-chain but they are not linked to a "
            "company profile in the database."
        )
        for address in result.chain_escrows:
            lines.append(f"• <code>{_escape(address)}</code>")

    if result.warning:
        lines.extend(["", f"ℹ️ {_escape(result.warning)}"])

    return "\n".join(lines)


def chunk_html(text: str, limit: int = 3900) -> list[str]:
    """Split a message on line boundaries so HTML tags are never cut in half."""
    if len(text) <= limit:
        return [text]

    chunks: list[str] = []
    current: list[str] = []
    current_length = 0

    for line in text.splitlines(keepends=True):
        if current and current_length + len(line) > limit:
            chunks.append("".join(current).rstrip())
            current = []
            current_length = 0
        current.append(line)
        current_length += len(line)

    if current:
        chunks.append("".join(current).rstrip())

    return chunks or [text[:limit]]
