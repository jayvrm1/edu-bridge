"""
Structured logging configuration.
Provides formatted output while redacting sensitive tokens and credentials.
"""

import logging
import sys
import re
from typing import Any, Dict


SENSITIVE_PATTERNS = [
    re.compile(r"(password['\"]?\s*[:=]\s*['\"])([^'\"]+)(['\"])", re.IGNORECASE),
    re.compile(r"(api[_-]?key['\"]?\s*[:=]\s*['\"])([^'\"]+)(['\"])", re.IGNORECASE),
    re.compile(r"(secret['\"]?\s*[:=]\s*['\"])([^'\"]+)(['\"])", re.IGNORECASE),
    re.compile(r"(bearer\s+)([A-Za-z0-9\-._~+/]+=*)", re.IGNORECASE),
]


class RedactingFormatter(logging.Formatter):
    """Custom formatter that scrubs sensitive credentials from log records."""

    def format(self, record: logging.LogRecord) -> str:
        orig = super().format(record)
        redacted = orig
        for pattern in SENSITIVE_PATTERNS:
            redacted = pattern.sub(r"\1***REDACTED***\3", redacted)
        return redacted


def setup_logging(log_level: str = "INFO") -> logging.Logger:
    logger = logging.getLogger("edubridge")
    logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))

    # Avoid duplicate handlers
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = RedactingFormatter(
            fmt="%(asctime)s | %(levelname)-7s | [%(name)s] %(filename)s:%(lineno)d | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger


logger = setup_logging()

