"""Application service: merge Supabase project metadata with on-chain escrow data."""

from __future__ import annotations

import logging
from typing import TypeVar

from cachetools import TTLCache
from web3 import Web3

from ..chain.web3_client import ChainService
from ..config import Settings
from ..db.supabase import SupabaseRepository
from ..errors import ChainUnavailable, CompanyNotFound, ProjectNotFound, SupabaseUnavailable
from ..models import CompanyProjects, EscrowInfo, ProjectDetails

logger = logging.getLogger(__name__)

T = TypeVar("T")


class TrustLanceService:
    def __init__(
        self,
        repository: SupabaseRepository,
        chain: ChainService,
        settings: Settings,
    ) -> None:
        self._repository = repository
        self._chain = chain
        self._settings = settings
        self._project_cache: TTLCache[str, ProjectDetails] = TTLCache(
            maxsize=256,
            ttl=settings.cache_ttl_seconds,
        )
        self._company_cache: TTLCache[str, CompanyProjects] = TTLCache(
            maxsize=128,
            ttl=settings.cache_ttl_seconds,
        )

    # ------------------------------------------------------------------
    # Project ID lookup
    # ------------------------------------------------------------------

    async def get_project_details(self, project_id: str) -> ProjectDetails:
        normalized = project_id.strip().lower()
        cached = self._project_cache.get(normalized)
        if cached is not None:
            return cached

        project = await self._repository.get_project(normalized)
        if project is None:
            raise ProjectNotFound

        warnings: list[str] = []
        escrow: EscrowInfo | None = None

        if project.escrow_address:
            try:
                escrow = await self._chain.get_escrow(project.escrow_address)
            except ChainUnavailable:
                logger.warning("escrow read failed", extra={"escrow": project.escrow_address})
                warnings.append(
                    "On-chain escrow details are unavailable right now. "
                    "Project information is still shown below."
                )
        # The formatter already explains the missing escrow; no warning needed here.

        details = ProjectDetails(project=project, escrow=escrow, warnings=tuple(warnings))
        self._project_cache[normalized] = details
        return details

    # ------------------------------------------------------------------
    # Company wallet lookup
    # ------------------------------------------------------------------

    async def get_company_projects(self, wallet_address: str) -> CompanyProjects:
        checksum = Web3.to_checksum_address(wallet_address)
        cached = self._company_cache.get(checksum)
        if cached is not None:
            return cached

        warnings: list[str] = []
        company = None
        projects = []

        try:
            company = await self._repository.get_company_by_wallet(checksum)
            if company is not None:
                projects = await self._repository.get_company_projects(company.profile_id)
        except SupabaseUnavailable:
            logger.warning("company lookup unavailable", extra={"wallet": checksum})
            warnings.append(
                "The project database is unavailable right now. Showing on-chain "
                "escrows created by this wallet instead."
            )

        chain_escrows: list[str] = []
        try:
            chain_escrows = await self._chain.get_client_escrows(checksum)
        except ChainUnavailable:
            logger.info("chain escrow lookup unavailable", extra={"wallet": checksum})
            if company is not None:
                warnings.append("On-chain escrow data is unavailable right now.")

        linked = {project.escrow_address.lower() for project in projects if project.escrow_address}
        unlinked_escrows = [address for address in chain_escrows if address.lower() not in linked]

        if company is None and not chain_escrows:
            raise CompanyNotFound

        result = CompanyProjects(
            wallet_address=checksum,
            company=company,
            projects=tuple(projects),
            chain_escrows=tuple(unlinked_escrows),
            warning=" ".join(warnings) if warnings else None,
        )
        self._company_cache[checksum] = result
        return result

    # ------------------------------------------------------------------
    # Raw escrow lookup (used by fallback buttons)
    # ------------------------------------------------------------------

    async def get_escrow_details(self, address: str) -> EscrowInfo:
        return await self._chain.get_escrow(Web3.to_checksum_address(address))
