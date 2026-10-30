"""Domain models shared by the repository, chain client, and formatters."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from enum import IntEnum


class MilestoneStatus(IntEnum):
    """Mirror of ``TrustLanceEscrow.MilestoneStatus``."""

    PENDING = 0
    SUBMITTED = 1
    APPROVED = 2
    REJECTED = 3
    DISPUTED = 4
    PAID = 5
    REFUNDED = 6

    @property
    def label(self) -> str:
        return _MILESTONE_LABELS[self]

    @property
    def emoji(self) -> str:
        return _MILESTONE_EMOJI[self]

    @classmethod
    def from_chain(cls, value: int) -> MilestoneStatus:
        try:
            return cls(int(value))
        except (TypeError, ValueError):
            return cls.PENDING


_MILESTONE_LABELS: dict[MilestoneStatus, str] = {
    MilestoneStatus.PENDING: "Pending",
    MilestoneStatus.SUBMITTED: "Submitted — waiting for client review",
    MilestoneStatus.APPROVED: "Approved",
    MilestoneStatus.REJECTED: "Rejected",
    MilestoneStatus.DISPUTED: "In dispute",
    MilestoneStatus.PAID: "Paid",
    MilestoneStatus.REFUNDED: "Refunded to client",
}

_MILESTONE_EMOJI: dict[MilestoneStatus, str] = {
    MilestoneStatus.PENDING: "⚪",
    MilestoneStatus.SUBMITTED: "🟡",
    MilestoneStatus.APPROVED: "🟢",
    MilestoneStatus.REJECTED: "🔴",
    MilestoneStatus.DISPUTED: "🟠",
    MilestoneStatus.PAID: "✅",
    MilestoneStatus.REFUNDED: "↩️",
}


@dataclass(frozen=True, slots=True)
class Milestone:
    index: int
    description: str
    amount_wei: int
    status: MilestoneStatus
    deliverable_cid: str = ""
    submitted_at: int = 0
    review_deadline: int = 0
    dispute_deadline: int = 0


@dataclass(frozen=True, slots=True)
class ActivityEvent:
    name: str
    summary: str
    block_number: int


@dataclass(frozen=True, slots=True)
class EscrowInfo:
    address: str
    client: str
    freelancer: str | None
    funded: bool
    cancelled: bool
    total_escrowed_wei: int
    balance_wei: int
    client_cancellation_requested: bool
    freelancer_cancellation_requested: bool
    milestone_count: int = 0
    milestones: tuple[Milestone, ...] = ()
    activity: tuple[ActivityEvent, ...] = ()


@dataclass(frozen=True, slots=True)
class Project:
    id: str
    title: str
    description: str
    status: str
    budget: Decimal | None = None
    deadline: datetime | None = None
    created_at: datetime | None = None
    escrow_address: str | None = None
    company_name: str | None = None


@dataclass(frozen=True, slots=True)
class Company:
    profile_id: str
    wallet_address: str
    company_name: str
    display_name: str | None = None
    description: str | None = None
    industry: str | None = None
    website: str | None = None


@dataclass(frozen=True, slots=True)
class CompanyProjects:
    wallet_address: str
    company: Company | None
    projects: tuple[Project, ...] = ()
    chain_escrows: tuple[str, ...] = ()
    warning: str | None = None


@dataclass(frozen=True, slots=True)
class ProjectDetails:
    project: Project
    escrow: EscrowInfo | None = None
    warnings: tuple[str, ...] = field(default_factory=tuple)
