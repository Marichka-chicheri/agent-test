"""Fernet encryption for user API keys at rest."""

import base64
import hashlib

from cryptography.fernet import Fernet
from django.conf import settings


def _fernet() -> Fernet:
    digest = hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()
    key = base64.urlsafe_b64encode(digest)
    return Fernet(key)


def encrypt_value(plain_text: str) -> str:
    if not plain_text:
        return ""
    return _fernet().encrypt(plain_text.encode("utf-8")).decode("utf-8")


def decrypt_value(cipher_text: str) -> str:
    if not cipher_text:
        return ""
    return _fernet().decrypt(cipher_text.encode("utf-8")).decode("utf-8")
