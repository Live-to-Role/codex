from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.throttling import APIKeyRateThrottle

from .models import HashedAPIToken


class APIKeyView(APIView):
    """Manage API keys for Grimoire integration."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [APIKeyRateThrottle]

    def get(self, request):
        """Get current API key info (masked) or indicate none exists."""
        try:
            token = HashedAPIToken.objects.get(user=request.user)
            return Response({
                "has_key": True,
                "key_preview": f"{token.key_prefix}...",
                "created": token.created_at,
                "last_used": token.last_used_at,
            })
        except HashedAPIToken.DoesNotExist:
            return Response({
                "has_key": False,
                "key_preview": None,
                "created": None,
                "last_used": None,
            })

    def post(self, request):
        """Generate a new API key (replaces existing if any)."""
        token, plain_key = HashedAPIToken.create_token(request.user)
        return Response({
            "key": plain_key,
            "message": "API key generated. Copy it now - it won't be shown again.",
            "created": token.created_at,
        }, status=status.HTTP_201_CREATED)

    def delete(self, request):
        """Revoke the current API key."""
        deleted, _ = HashedAPIToken.objects.filter(user=request.user).delete()
        if deleted:
            return Response({"message": "API key revoked successfully."})
        return Response(
            {"message": "No API key to revoke."},
            status=status.HTTP_404_NOT_FOUND
        )
