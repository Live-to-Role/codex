"""Custom authentication classes for Codex."""

from rest_framework import authentication, exceptions

from .models import HashedAPIToken


class HashedTokenAuthentication(authentication.BaseAuthentication):
    """
    Token authentication using hashed storage.
    
    Clients should authenticate by passing the token in the Authorization header:
        Authorization: Token <token>
    """
    
    keyword = "Token"
    
    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request)
        
        if not auth_header:
            return None
        
        try:
            auth_parts = auth_header.decode().split()
        except UnicodeDecodeError:
            raise exceptions.AuthenticationFailed("Invalid token header encoding.")
        
        if len(auth_parts) != 2:
            return None
        
        if auth_parts[0].lower() != self.keyword.lower():
            return None
        
        token = auth_parts[1]
        return self.authenticate_credentials(token)
    
    def authenticate_credentials(self, key):
        user = HashedAPIToken.validate_key(key)
        
        if user is None:
            raise exceptions.AuthenticationFailed("Invalid token.")
        
        if not user.is_active:
            raise exceptions.AuthenticationFailed("User inactive or deleted.")
        
        return (user, key)
    
    def authenticate_header(self, request):
        return self.keyword
