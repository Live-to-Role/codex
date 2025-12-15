from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class APIKeyView(APIView):
    """Manage API keys for Grimoire integration."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get current API key (masked) or indicate none exists."""
        try:
            token = Token.objects.get(user=request.user)
            # Return masked token for display
            key = token.key
            masked = f"{key[:8]}...{key[-4:]}"
            return Response({
                "has_key": True,
                "key_preview": masked,
                "created": token.created,
            })
        except Token.DoesNotExist:
            return Response({
                "has_key": False,
                "key_preview": None,
                "created": None,
            })

    def post(self, request):
        """Generate a new API key (replaces existing if any)."""
        # Delete existing token if any
        Token.objects.filter(user=request.user).delete()
        # Create new token
        token = Token.objects.create(user=request.user)
        return Response({
            "key": token.key,
            "message": "API key generated. Copy it now - it won't be shown again.",
            "created": token.created,
        }, status=status.HTTP_201_CREATED)

    def delete(self, request):
        """Revoke the current API key."""
        deleted, _ = Token.objects.filter(user=request.user).delete()
        if deleted:
            return Response({
                "message": "API key revoked successfully.",
            })
        return Response({
            "message": "No API key to revoke.",
        }, status=status.HTTP_404_NOT_FOUND)
