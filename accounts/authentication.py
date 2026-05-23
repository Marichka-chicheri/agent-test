"""DRF authentication for per-user REST API keys."""

from __future__ import annotations

from typing import Optional, Tuple

from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request

from django.contrib.auth.models import User

from .models import RestAPIKey
from .rest_api_key_utils import hash_rest_api_key


class RestAPIKeyAuthentication(BaseAuthentication):
    """
    Authenticate via:
      - Authorization: Api-Key <key>
      - X-API-Key: <key>
    """

    keyword = "Api-Key"

    def authenticate(self, request: Request) -> Optional[Tuple[User, RestAPIKey]]:
        raw_key = self._extract_key(request)
        if not raw_key:
            return None

        key_hash = hash_rest_api_key(raw_key)
        try:
            record = RestAPIKey.objects.select_related("user").get(
                key_hash=key_hash,
                is_active=True,
            )
        except RestAPIKey.DoesNotExist as exc:
            raise AuthenticationFailed("Invalid API key.") from exc

        RestAPIKey.objects.filter(pk=record.pk).update(last_used_at=timezone.now())
        return record.user, record

    def authenticate_header(self, request: Request) -> str:
        return self.keyword

    def _extract_key(self, request: Request) -> str:
        header = request.META.get("HTTP_AUTHORIZATION", "").strip()
        if header:
            parts = header.split(None, 1)
            if len(parts) == 2 and parts[0].lower() == self.keyword.lower():
                return parts[1].strip()

        return (request.META.get("HTTP_X_API_KEY") or "").strip()
