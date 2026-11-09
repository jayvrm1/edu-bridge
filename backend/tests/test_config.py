"""
Tests for application settings and configuration loaders.
"""

from app.core.config import Settings


def test_settings_defaults():
    """Verify settings loads expected defaults."""
    cfg = Settings()
    assert cfg.PROJECT_NAME == "EduBridge AI Backend"
    assert cfg.API_V1_PREFIX == "/api/v1"
    assert cfg.SIGN_LANGUAGE_DEFAULT == "ISL"
    assert cfg.SIGN_CONFIDENCE_THRESHOLD >= 0.5
    assert len(cfg.CORS_ORIGINS) > 0


def test_cors_origins_parsing():
    """Verify string list parsing for CORS origins."""
    cfg = Settings(CORS_ORIGINS="http://example.com, https://test.edu")
    assert "http://example.com" in cfg.CORS_ORIGINS
    assert "https://test.edu" in cfg.CORS_ORIGINS

