"""
Development settings — uses SQLite, DEBUG=True.
"""
from .base import *  # noqa: F401, F403

DEBUG = True

# SQLite for local development — no setup required
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",  # noqa: F405
    }
}

# Relax security for local dev
CORS_ALLOW_ALL_ORIGINS = True

# Email backend (console output — no SMTP needed)
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Disable password strength check in dev so seed data is easier
AUTH_PASSWORD_VALIDATORS = []
