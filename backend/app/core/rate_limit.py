"""
In-memory rate limiter for authentication endpoints.
Protects against brute-force attacks and credential stuffing without external Redis requirements.
"""

import time
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import Request, status
from app.core.exceptions import AppException
from app.core.logging import logger


class InMemoryRateLimiter:
    """Sliding window rate limiter storing timestamps per client IP / key."""

    def __init__(self, requests_per_minute: int = 15):
        self.requests_per_minute = requests_per_minute
        self.history: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, key: str) -> bool:
        now = time.time()
        window_start = now - 60.0

        # Prune older timestamps
        self.history[key] = [t for t in self.history[key] if t > window_start]

        if len(self.history[key]) >= self.requests_per_minute:
            return False

        self.history[key].append(now)
        return True

    def check(self, request: Request, key_prefix: str = "auth"):
        client_ip = request.client.host if request.client else "unknown"
        rate_key = f"{key_prefix}:{client_ip}"
        if not self.is_allowed(rate_key):
            logger.warning(f"Rate limit exceeded for client: {client_ip} on {request.url.path}")
            raise AppException(
                message="Too many requests. Please try again after 60 seconds.",
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                code="RATE_LIMIT_EXCEEDED",
                details={"retry_after_seconds": 60}
            )


auth_rate_limiter = InMemoryRateLimiter(requests_per_minute=20)

