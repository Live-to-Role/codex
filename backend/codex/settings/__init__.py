from .base import *

try:
    from .local import *
except ImportError:
    pass

from decouple import config

if config("RAILWAY_ENVIRONMENT", default=None):
    from .production import *
