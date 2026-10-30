"""Blockchain reads for the TrustLance factory and escrow contracts."""

from __future__ import annotations

import asyncio
import json
import logging
from collections.abc import Awaitable, Callable
from importlib.resources import files
from typing import Any, TypeVar

from tenacity import AsyncRetrying, stop_after_attempt, wait_exponential
from web3 import AsyncWeb3, Web3
from web3.contract.async_contract import AsyncContract
from web3.providers.rpc import AsyncHTTPProvider

from ..config import Settings
from ..errors import ChainUnavailable
from ..models import ActivityEvent, EscrowInfo, Milestone, MilestoneStatus

logger = logging.getLogger(__name__)

T = TypeVar("T")


def _load_abi(name: str) -> list[dict[str, Any]]:
    path = files("trustlance_bot").joinpath("abis").joinpath(f"{name}.json")
    return json.loads(path.read_text(encoding="utf-8"))


def _as_int(value: Any) -> int:
    return int(value or 0)


class ChainService:
    """Async, read-only client for the factory and escrow contracts."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._w3 = AsyncWeb3(
            AsyncHTTPProvider(
                settings.rpc_url,
                request_kwargs={"timeout": settings.request_timeout_seconds},
            )
        )
        self._factory_abi = _load_abi("factory")
        self._escrow_abi = _load_abi("escrow")
        self._factory: AsyncContract | None = None
        self._escrow_topics: dict[str, str] = {}
        self._ready = False

    # ------------------------------------------------------------------
    # Setup
    # ------------------------------------------------------------------

    async def _ensure_ready(self) -> None:
        if self._ready:
            return

        try:
            connected = await asyncio.wait_for(
                self._w3.is_connected(),
                timeout=self._settings.request_timeout_seconds,
            )
        except Exception as exc:
            raise ChainUnavailable from exc

        if not connected:
            raise ChainUnavailable

        try:
            chain_id = await self._w3.eth.chain_id
        except Exception as exc:
            raise ChainUnavailable from exc

        if chain_id != self._settings.chain_id:
            logger.error(
                "unexpected chain id",
                extra={"expected": self._settings.chain_id, "actual": chain_id},
            )
            raise ChainUnavailable(
                f"The bot is configured for chain {self._settings.chain_id}, "
                f"but the node reports {chain_id}."
            )

        self._factory = self._w3.eth.contract(
            address=Web3.to_checksum_address(self._settings.factory_address),
            abi=self._factory_abi,
        )

        # topic0 -> event name, used to decode the escrow activity feed.
        for item in self._escrow_abi:
            if item.get("type") != "event":
                continue
            signature = f"{item['name']}({','.join(i['type'] for i in item.get('inputs', []))})"
            self._escrow_topics[Web3.keccak(text=signature).hex()] = str(item["name"])

        self._ready = True

    async def _call(self, operation: Callable[[], Awaitable[T]]) -> T:
        """Run one RPC call with a timeout and a small retry budget."""
        await self._ensure_ready()
        try:
            async for attempt in AsyncRetrying(
                stop=stop_after_attempt(3),
                wait=wait_exponential(multiplier=0.25, max=2),
                reraise=True,
            ):
                with attempt:
                    return await asyncio.wait_for(
                        operation(),
                        timeout=self._settings.request_timeout_seconds,
                    )
        except Exception as exc:
            logger.warning("rpc call failed", exc_info=exc)
            raise ChainUnavailable from exc

        raise ChainUnavailable  # pragma: no cover - tenacity always returns/raises

    # ------------------------------------------------------------------
    # Factory reads
    # ------------------------------------------------------------------

    async def get_client_escrows(self, wallet_address: str) -> list[str]:
        await self._ensure_ready()
        factory = self._factory
        if factory is None:
            raise ChainUnavailable
        checksum = Web3.to_checksum_address(wallet_address)
        result = await self._call(lambda: factory.functions.getClientEscrows(checksum).call())
        return [str(address) for address in result]

    async def is_escrow(self, address: str) -> bool:
        await self._ensure_ready()
        factory = self._factory
        if factory is None:
            raise ChainUnavailable
        checksum = Web3.to_checksum_address(address)
        result = await self._call(lambda: factory.functions.isEscrow(checksum).call())
        return bool(result)

    # ------------------------------------------------------------------
    # Escrow reads
    # ------------------------------------------------------------------

    def _escrow_contract(self, address: str) -> AsyncContract:
        return self._w3.eth.contract(
            address=Web3.to_checksum_address(address),
            abi=self._escrow_abi,
        )

    async def get_escrow(self, address: str) -> EscrowInfo:
        await self._ensure_ready()
        escrow = self._escrow_contract(address)

        def read(function_name: str) -> Callable[[], Awaitable[Any]]:
            return lambda: escrow.functions[function_name]().call()

        values = await asyncio.gather(
            self._call(read("client")),
            self._call(read("freelancer")),
            self._call(read("funded")),
            self._call(read("cancelled")),
            self._call(read("totalEscrowed")),
            self._call(read("getEscrowBalance")),
            self._call(read("clientCancellationRequested")),
            self._call(read("freelancerCancellationRequested")),
            self._call(read("getMilestoneCount")),
        )

        (
            client,
            freelancer,
            funded,
            cancelled,
            total_escrowed,
            balance,
            client_cancellation,
            freelancer_cancellation,
            milestone_count,
        ) = values

        count = _as_int(milestone_count)
        capped_count = min(count, self._settings.max_milestones)
        milestones = await self._get_milestones(escrow, capped_count)
        activity = await self._get_activity(address, escrow)

        zero_address = "0x0000000000000000000000000000000000000000"
        freelancer_str = str(freelancer)
        if freelancer_str.lower() == zero_address:
            freelancer_str = ""

        return EscrowInfo(
            address=str(Web3.to_checksum_address(address)),
            client=str(client),
            freelancer=freelancer_str or None,
            funded=bool(funded),
            cancelled=bool(cancelled),
            total_escrowed_wei=_as_int(total_escrowed),
            balance_wei=_as_int(balance),
            client_cancellation_requested=bool(client_cancellation),
            freelancer_cancellation_requested=bool(freelancer_cancellation),
            milestone_count=count,
            milestones=milestones,
            activity=activity,
        )

    async def _get_milestones(
        self,
        escrow: AsyncContract,
        count: int,
    ) -> tuple[Milestone, ...]:
        if count <= 0:
            return ()

        async def read_one(index: int) -> Milestone:
            raw = await self._call(lambda: escrow.functions.getMilestone(index).call())
            (
                description,
                amount,
                status,
                deliverable_cid,
                submitted_at,
                review_deadline,
                dispute_deadline,
            ) = raw
            return Milestone(
                index=index,
                description=str(description),
                amount_wei=_as_int(amount),
                status=MilestoneStatus.from_chain(status),
                deliverable_cid=str(deliverable_cid),
                submitted_at=_as_int(submitted_at),
                review_deadline=_as_int(review_deadline),
                dispute_deadline=_as_int(dispute_deadline),
            )

        return tuple(await asyncio.gather(*(read_one(i) for i in range(count))))

    # ------------------------------------------------------------------
    # Activity (escrow events)
    # ------------------------------------------------------------------

    async def _get_activity(
        self,
        address: str,
        escrow: AsyncContract,
    ) -> tuple[ActivityEvent, ...]:
        """Decode recent escrow events. Failure is non-fatal."""
        try:
            logs = await self._call(
                lambda: self._w3.eth.get_logs(
                    {
                        "address": Web3.to_checksum_address(address),
                        "fromBlock": self._settings.deployment_block,
                        "toBlock": "latest",
                    }
                )
            )
        except ChainUnavailable:
            logger.info("activity logs unavailable for %s", address)
            return ()

        events: list[tuple[int, int, ActivityEvent]] = []
        for log in logs:
            topics = log.get("topics") or []
            if not topics:
                continue
            topic = topics[0].hex() if hasattr(topics[0], "hex") else str(topics[0])
            name = self._escrow_topics.get(topic)
            if not name:
                continue
            try:
                event_class = getattr(escrow.events, name)
                decoded = event_class().process_log(log)
                summary = _describe_event(name, dict(decoded["args"]))
            except Exception:
                logger.debug("could not decode %s log", name, exc_info=True)
                continue

            block_number = _as_int(log.get("blockNumber"))
            log_index = _as_int(log.get("logIndex"))
            events.append(
                (
                    block_number,
                    log_index,
                    ActivityEvent(name=name, summary=summary, block_number=block_number),
                )
            )

        events.sort(key=lambda item: (item[0], item[1]))
        recent = events[-self._settings.max_activity_events :]
        return tuple(event for _, _, event in reversed(recent))


def _describe_event(name: str, args: dict[str, Any]) -> str:
    """Turn raw event arguments into a plain-language sentence."""
    from ..formatting import format_eth, format_timestamp, short_address

    if name == "ProjectFunded":
        return f"Escrow funded with {format_eth(args.get('amount', 0))} ETH."
    if name == "FreelancerAwarded":
        return f"Freelancer assigned: {short_address(str(args.get('freelancer', '')))}."
    if name == "MilestoneSubmitted":
        milestone = _as_int(args.get("index")) + 1
        deadline = format_timestamp(args.get("reviewDeadline", 0))
        return f"Milestone #{milestone} submitted (review by {deadline})."
    if name == "MilestoneApproved":
        milestone = _as_int(args.get("index")) + 1
        amount = format_eth(args.get("amount", 0))
        return f"Milestone #{milestone} approved — {amount} ETH released."
    if name == "MilestoneRejected":
        return f"Milestone #{_as_int(args.get('index')) + 1} rejected by the client."
    if name == "MilestoneAutoApproved":
        milestone = _as_int(args.get("index")) + 1
        amount = format_eth(args.get("amount", 0))
        return f"Milestone #{milestone} auto-approved — {amount} ETH released."
    if name == "DisputeRaised":
        milestone = _as_int(args.get("index")) + 1
        deadline = format_timestamp(args.get("disputeDeadline", 0))
        return f"Dispute opened for milestone #{milestone} (decision by {deadline})."
    if name == "DisputeResolvedForFreelancer":
        milestone = _as_int(args.get("index")) + 1
        return f"Dispute resolved for the freelancer on milestone #{milestone}."
    if name == "DisputeResolvedForClient":
        milestone = _as_int(args.get("index")) + 1
        return f"Dispute resolved for the client on milestone #{milestone}."
    if name == "ProjectCancellationRequested":
        return f"Cancellation requested by {short_address(str(args.get('requestedBy', '')))}."
    if name == "ProjectCancelled":
        return f"Project cancelled — {format_eth(args.get('refundedAmount', 0))} ETH refunded."
    if name == "PaymentReleased":
        milestone = _as_int(args.get("index")) + 1
        return (
            f"Payment for milestone #{milestone} sent to {short_address(str(args.get('to', '')))}."
        )
    return name.replace("_", " ")
