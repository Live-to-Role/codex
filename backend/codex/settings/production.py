"""
Production settings for Railway deployment.
"""

import dj_database_url
from decouple import config

DEBUG = False

ALLOWED_HOSTS = config(
    "ALLOWED_HOSTS",
    default=".railway.app,api.codex.livetorole.com",
    cast=lambda v: [s.strip() for s in v.split(",")],
)

DATABASES = {
    "default": dj_database_url.config(
        default=config("DATABASE_URL", default=""),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

CSRF_TRUSTED_ORIGINS = config(
    "CSRF_TRUSTED_ORIGINS",
    default="https://*.railway.app,https://codex.livetorole.com,https://api.codex.livetorole.com",
    cast=lambda v: [s.strip() for s in v.split(",")],
)

CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="https://codex.livetorole.com",
    cast=lambda v: [s.strip() for s in v.split(",")],
)

SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Email configuration (Resend)
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.resend.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = "resend"
EMAIL_HOST_PASSWORD = config("RESEND_API_KEY", default="")
EMAIL_TIMEOUT = 10  # Timeout in seconds to prevent hanging
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="Codex <noreply@livetorole.com>")

# Email verification - mandatory before login
ACCOUNT_EMAIL_VERIFICATION = "mandatory"
ACCOUNT_LOGIN_ON_EMAIL_CONFIRMATION = False
ACCOUNT_EMAIL_CONFIRMATION_EXPIRE_DAYS = 3
ACCOUNT_CONFIRM_EMAIL_ON_GET = True
