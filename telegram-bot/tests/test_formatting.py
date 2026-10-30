from __future__ import annotations

from dataclasses import replace
from datetime import UTC, datetime
from decimal import Decimal

from trustlance_bot.config import Settings
from trustlance_bot.formatting import (
    chunk_html,
    format_amount,
    format_company_projects,
    format_eth,
    format_project_details,
)
from trustlance_bot.models import (
    Company,
    CompanyProjects,
    EscrowInfo,
    Milestone,
    MilestoneStatus,
    Project,
    ProjectDetails,
)
from trustlance_bot.ui.keyboards import company_keyboard, project_keyboard


def make_settings() -> Settings:
    return Settings(  # type: ignore[call-arg]
        telegram_bot_token="123:test",  # type: ignore[arg-type]
        web_app_url="http://localhost:5173",
    )


def make_project() -> Project:
    return Project(
        id="3f0c2a9e-8b1d-4c7a-9e2f-1a2b3c4d5e6f",
        title="Website redesign",
        description="A complete redesign of the marketing site.",
        status="open",
        budget=Decimal("2.5"),
        deadline=datetime(2026, 11, 12, tzinfo=UTC),
        created_at=datetime(2026, 10, 1, tzinfo=UTC),
        escrow_address="0x5FbDB2315678afecb367f032d93F642f64180aa3",
        company_name="Acme Studios",
    )


def make_escrow() -> EscrowInfo:
    return EscrowInfo(
        address="0x5FbDB2315678afecb367f032d93F642f64180aa3",
        client="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        freelancer="0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        funded=True,
        cancelled=False,
        total_escrowed_wei=15 * 10**17,
        balance_wei=10**18,
        client_cancellation_requested=False,
        freelancer_cancellation_requested=False,
        milestone_count=2,
        milestones=(
            Milestone(
                index=0,
                description="Wireframes",
                amount_wei=5 * 10**17,
                status=MilestoneStatus.PAID,
                deliverable_cid="bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
                submitted_at=1_760_000_000,
                review_deadline=1_760_600_000,
            ),
            Milestone(
                index=1,
                description="Final build",
                amount_wei=10**18,
                status=MilestoneStatus.DISPUTED,
                submitted_at=1_760_700_000,
                review_deadline=1_761_300_000,
                dispute_deadline=1_762_000_000,
            ),
        ),
    )


def test_amount_formatting() -> None:
    assert format_eth(10**18) == "1"
    assert format_eth(15 * 10**17) == "1.5"
    assert format_eth(0) == "0"
    assert format_amount(Decimal("0.123456789")) == "0.123457"
    assert format_amount(None) == "—"


def test_project_details_include_milestones_disputes_and_activity() -> None:
    details = ProjectDetails(project=make_project(), escrow=make_escrow())
    text = format_project_details(details, make_settings())

    assert "Website redesign" in text
    assert "Acme Studios" in text
    assert "2.5 ETH" in text
    assert "Milestones (2)" in text
    assert "#1 Wireframes" in text
    assert "#2 Final build" in text
    assert "In dispute" in text
    assert "decision window" in text
    assert "No open disputes" not in text
    assert "Dispute deadline" in text


def test_html_is_escaped() -> None:
    project = replace(make_project(), title="<script>alert(1)</script>")
    text = format_project_details(ProjectDetails(project=project), make_settings())

    assert "<script>" not in text
    assert "&lt;script&gt;" in text


def test_project_without_escrow_shows_explanation() -> None:
    project = Project(
        id="3f0c2a9e-8b1d-4c7a-9e2f-1a2b3c4d5e6f",
        title="Draft project",
        description="",
        status="draft",
        escrow_address=None,
    )
    text = format_project_details(ProjectDetails(project=project), make_settings())

    assert "does not have an escrow contract linked" in text
    assert "has not funded it on-chain" in text


def test_company_message_and_buttons() -> None:
    company = Company(
        profile_id="profile-1",
        wallet_address="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        company_name="Acme Studios",
        description="We build things.",
    )
    result = CompanyProjects(
        wallet_address=company.wallet_address,
        company=company,
        projects=(make_project(),),
    )
    settings = make_settings()
    text = format_company_projects(result, settings)

    assert "Acme Studios" in text
    assert "Available projects (1)" in text
    assert "Website redesign" in text

    keyboard = company_keyboard(result, settings)
    assert keyboard is not None
    callback = keyboard.inline_keyboard[0][0].callback_data
    assert callback is not None
    assert len(callback.encode()) <= 64
    assert callback.startswith("project:")


def test_project_keyboard_links_to_web_app() -> None:
    keyboard = project_keyboard(
        ProjectDetails(project=make_project()),
        make_settings(),
    )
    assert keyboard is not None
    assert keyboard.inline_keyboard[0][0].url == (
        "http://localhost:5173/project/3f0c2a9e-8b1d-4c7a-9e2f-1a2b3c4d5e6f"
    )


def test_chunk_html_splits_on_lines_without_losing_content() -> None:
    text = "\n".join(f"line {i} " + "x" * 100 for i in range(100))
    chunks = chunk_html(text, limit=1000)

    assert len(chunks) > 1
    assert all(len(chunk) <= 1000 for chunk in chunks)
    assert "\n".join(chunks).replace("\n", "") == text.replace("\n", "")
