"""
Production settings — uses PostgreSQL, DEBUG=False.
"""
import dj_database_url

from .base import *  # noqa: F401, F403

DEBUG = False

# Fail loudly if SECRET_KEY is not changed
if SECRET_KEY == "change-me-in-production":  # noqa: F405
    raise ValueError("SECRET_KEY must be changed in production!")

# PostgreSQL via DATABASE_URL environment variable
DATABASES = {
    "default": dj_database_url.config(
        env="DATABASE_URL",
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Security headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
