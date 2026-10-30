"""User-facing errors.

Every error carries a message that is safe to show in Telegram. Internal details
are logged separately and never rendered to the user.
"""

from __future__ import annotations


class BotError(Exception):
    """Base class for expected failures."""

    user_message = "Something went wrong. Please try again."

    def __init__(self, user_message: str | None = None) -> None:
        if user_message:
            self.user_message = user_message
        super().__init__(self.user_message)


class InvalidInput(BotError):
    user_message = "That does not look like a project ID or a wallet address."


class ProjectNotFound(BotError):
    user_message = "I could not find a project with that ID."


class CompanyNotFound(BotError):
    user_message = "I could not find a company linked to that wallet address."


class SupabaseUnavailable(BotError):
    user_message = "Project data is temporarily unavailable. Please try again later."


class ChainUnavailable(BotError):
    user_message = "On-chain data is temporarily unavailable. Please try again later."


class ExplorerUnavailable(BotError):
    user_message = "I could not read that wallet's projects right now."
