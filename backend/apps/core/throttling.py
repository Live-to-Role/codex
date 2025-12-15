"""
Custom throttling classes for security-sensitive endpoints.
"""

from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """
    Strict rate limiting for login attempts to prevent brute-force attacks.
    Limits: 5 attempts per minute per IP.
    """
    rate = "5/minute"
    scope = "login"


class RegistrationRateThrottle(AnonRateThrottle):
    """
    Rate limiting for registration to prevent spam accounts.
    Limits: 3 registrations per hour per IP.
    """
    rate = "3/hour"
    scope = "registration"


class PasswordResetRateThrottle(AnonRateThrottle):
    """
    Rate limiting for password reset requests to prevent enumeration.
    Limits: 3 requests per hour per IP.
    """
    rate = "3/hour"
    scope = "password_reset"


class APIKeyRateThrottle(UserRateThrottle):
    """
    Rate limiting for API key generation.
    Limits: 5 key generations per day per user.
    """
    rate = "5/day"
    scope = "api_key"


class SearchRateThrottle(AnonRateThrottle):
    """
    Rate limiting for search to prevent DoS via expensive fuzzy matching.
    Limits: 30 searches per minute per IP.
    """
    rate = "30/minute"
    scope = "search"


class IdentifyRateThrottle(AnonRateThrottle):
    """
    Rate limiting for the identify endpoint (Grimoire integration).
    Limits: 60 requests per minute per IP.
    """
    rate = "60/minute"
    scope = "identify"


class NoteCreateRateThrottle(UserRateThrottle):
    """
    Rate limiting for community note creation to prevent spam.
    Limits: 10 notes per hour per user.
    """
    rate = "10/hour"
    scope = "note_create"


class NoteVoteRateThrottle(UserRateThrottle):
    """
    Rate limiting for voting on community notes.
    Limits: 100 votes per hour per user.
    """
    rate = "100/hour"
    scope = "note_vote"


class NoteFlagRateThrottle(UserRateThrottle):
    """
    Rate limiting for flagging community notes.
    Limits: 20 flags per hour per user.
    """
    rate = "20/hour"
    scope = "note_flag"
