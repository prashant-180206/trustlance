"""Read-only Supabase access."""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from decimal import Decimal, InvalidOperation
from typing import Any, cast

from supabase import AsyncClient

from ..errors import SupabaseUnavailable
from ..models import Company, Project

logger = logging.getLogger(__name__)

PROJECT_COLUMNS = (
    "id,title,description,budget,deadline,status,created_at,escrow_address,"
    "company_profiles(company_name)"
)


def _parse_datetime(value: Any) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=UTC)
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)


def _parse_decimal(value: Any) -> Decimal | None:
    if value is None or value == "":
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None


def _first_related(value: Any) -> dict[str, Any] | None:
    """Normalise a PostgREST embedded relationship to a single dict."""
    if isinstance(value, list):
        return value[0] if value else None
    if isinstance(value, dict):
        return value
    return None


def parse_project(row: dict[str, Any]) -> Project:
    company = _first_related(row.get("company_profiles"))
    return Project(
        id=str(row["id"]),
        title=str(row.get("title") or "Untitled project"),
        description=str(row.get("description") or ""),
        status=str(row.get("status") or "unknown"),
        budget=_parse_decimal(row.get("budget")),
        deadline=_parse_datetime(row.get("deadline")),
        created_at=_parse_datetime(row.get("created_at")),
        escrow_address=(str(row["escrow_address"]) if row.get("escrow_address") else None),
        company_name=(
            str(company["company_name"]) if company and company.get("company_name") else None
        ),
    )


class SupabaseRepository:
    """Thin wrapper around the Supabase REST client.

    The bot is read-only. It prefers the service-role key (server-side only) so it
    can read projects regardless of RLS, but falls back to the anon key when only
    that is configured.
    """

    def __init__(self, client: AsyncClient | None) -> None:
        self._client = client

    @property
    def enabled(self) -> bool:
        return self._client is not None

    def _require_client(self) -> AsyncClient:
        if self._client is None:
            raise SupabaseUnavailable("Project data is not configured on this bot.")
        return self._client

    async def get_project(self, project_id: str) -> Project | None:
        client = self._require_client()
        try:
            response = (
                await client.table("projects")
                .select(PROJECT_COLUMNS)
                .eq("id", project_id)
                .limit(1)
                .execute()
            )
        except Exception as exc:
            logger.warning("supabase project lookup failed", exc_info=exc)
            raise SupabaseUnavailable from exc

        rows = [row for row in cast(list[Any], response.data or []) if isinstance(row, dict)]
        if not rows:
            return None
        return parse_project(rows[0])

    async def get_company_by_wallet(self, wallet_address: str) -> Company | None:
        """Find a company profile from a wallet address.

        ``wallet_address`` is stored as text and may use any casing, so use a
        case-insensitive equality filter.
        """
        client = self._require_client()
        try:
            response = (
                await client.table("profiles")
                .select(
                    "id,display_name,wallet_address,"
                    "company_profiles(company_name,description,industry,website)"
                )
                .ilike("wallet_address", wallet_address)
                .limit(1)
                .execute()
            )
        except Exception as exc:
            logger.warning("supabase company lookup failed", exc_info=exc)
            raise SupabaseUnavailable from exc

        rows = [row for row in cast(list[Any], response.data or []) if isinstance(row, dict)]
        if not rows:
            return None

        profile = rows[0]
        company = _first_related(profile.get("company_profiles"))
        if not company:
            return None

        return Company(
            profile_id=str(profile["id"]),
            wallet_address=str(profile.get("wallet_address") or wallet_address),
            company_name=str(company.get("company_name") or "Unnamed company"),
            display_name=(str(profile["display_name"]) if profile.get("display_name") else None),
            description=(str(company["description"]) if company.get("description") else None),
            industry=(str(company["industry"]) if company.get("industry") else None),
            website=(str(company["website"]) if company.get("website") else None),
        )

    async def get_company_projects(
        self,
        company_id: str,
        *,
        status: str = "open",
    ) -> list[Project]:
        client = self._require_client()
        try:
            response = (
                await client.table("projects")
                .select(PROJECT_COLUMNS)
                .eq("company_id", company_id)
                .eq("status", status)
                .order("created_at", desc=True)
                .execute()
            )
        except Exception as exc:
            logger.warning("supabase company projects lookup failed", exc_info=exc)
            raise SupabaseUnavailable from exc

        rows = [row for row in cast(list[Any], response.data or []) if isinstance(row, dict)]
        return [parse_project(row) for row in rows]
