from django.urls import path

from .views import APIKeyView

urlpatterns = [
    path("api-key/", APIKeyView.as_view(), name="api-key"),
]
