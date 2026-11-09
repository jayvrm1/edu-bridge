"""
Email dispatch service for password reset and notifications.
Provides a configurable interface: Console/Logger (default for dev/testing) and extensible SMTP/Cloud providers.
"""

from abc import ABC, abstractmethod
from typing import Optional
from app.core.logging import logger
from app.core.config import settings


class BaseEmailService(ABC):
    @abstractmethod
    async def send_password_reset_email(self, to_email: str, reset_token: str) -> bool:
        """Sends a password reset link with token to the specified user."""
        pass


class ConsoleEmailService(BaseEmailService):
    """Development and testing email service that logs delivery safely."""

    def __init__(self):
        self.last_sent_token: Optional[str] = None
        self.last_recipient: Optional[str] = None

    async def send_password_reset_email(self, to_email: str, reset_token: str) -> bool:
        self.last_sent_token = reset_token
        self.last_recipient = to_email
        logger.info(
            f"[EmailService] Password reset token generated for recipient '{to_email}'. "
            f"Token valid for {settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} minutes."
        )
        return True


# Default instance
email_service: BaseEmailService = ConsoleEmailService()


def get_email_service() -> BaseEmailService:
    return email_service

