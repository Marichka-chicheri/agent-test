"""Async email tools (IMAP). Blocking I/O runs in a worker thread."""

from __future__ import annotations

import asyncio
import email
import imaplib
from email.header import decode_header
from typing import Any, Dict, List

from google.genai import types

from approval_manager import APPROVAL_NOTE


def _decode_mime_words(value: str) -> str:
    if not value:
        return ""
    decoded_parts = decode_header(value)
    result = ""
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            result += part.decode(encoding or "utf-8", errors="ignore")
        else:
            result += str(part)
    return result


def _extract_body(msg: email.message.Message) -> str:
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            disposition = str(part.get("Content-Disposition"))
            if content_type == "text/plain" and "attachment" not in disposition:
                try:
                    payload = part.get_payload(decode=True)
                    if payload is None:
                        continue
                    body = payload.decode(
                        part.get_content_charset() or "utf-8",
                        errors="ignore",
                    )
                    break
                except (UnicodeDecodeError, AttributeError):
                    continue
    else:
        try:
            payload = msg.get_payload(decode=True)
            if payload is not None:
                body = payload.decode(
                    msg.get_content_charset() or "utf-8",
                    errors="ignore",
                )
        except (UnicodeDecodeError, AttributeError):
            body = ""
    return body


def _sync_read_inbox(
    host: str,
    username: str,
    password: str,
    limit: int,
    folder: str,
) -> Dict[str, Any]:
    try:
        mail = imaplib.IMAP4_SSL(host, 993)
        mail.login(username, password)
        mail.select(folder)

        status, messages = mail.search(None, "ALL")
        if status != "OK":
            return {"success": False, "error": "Failed to fetch emails"}

        email_ids = messages[0].split()
        email_ids = email_ids[-limit:]

        emails: List[Dict[str, Any]] = []
        for eid in reversed(email_ids):
            status, msg_data = mail.fetch(eid, "(RFC822)")
            if status != "OK" or not msg_data or not msg_data[0]:
                continue

            raw_email = msg_data[0][1]
            if not isinstance(raw_email, bytes):
                continue
            msg = email.message_from_bytes(raw_email)
            emails.append(
                {
                    "id": eid.decode(),
                    "from": _decode_mime_words(msg.get("From", "")),
                    "to": _decode_mime_words(msg.get("To", "")),
                    "subject": _decode_mime_words(msg.get("Subject", "")),
                    "date": str(msg.get("Date", "")),
                    "body": _extract_body(msg)[:2000],
                }
            )

        mail.logout()
        return {"success": True, "count": len(emails), "emails": emails}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


async def read_email_inbox(
    host: str,
    username: str,
    password: str,
    limit: int = 10,
    folder: str = "INBOX",
) -> Dict[str, Any]:
    """Read emails from an IMAP inbox and return structured messages."""
    return await asyncio.to_thread(
        _sync_read_inbox,
        host,
        username,
        password,
        limit,
        folder,
    )


EMAIL_TOOL_DECLARATIONS: List[types.FunctionDeclaration] = [
    types.FunctionDeclaration(
        name="read_email_inbox",
        description=(
            "Read emails from IMAP inbox and return recent messages. "
            f"{APPROVAL_NOTE}"
        ),
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "host": types.Schema(
                    type=types.Type.STRING,
                    description="IMAP host (injected by system when omitted).",
                ),
                "username": types.Schema(
                    type=types.Type.STRING,
                    description="IGNORED. Automatically injected by system.",
                ),
                "password": types.Schema(
                    type=types.Type.STRING,
                    description="IGNORED. Automatically injected by system.",
                ),
                "limit": types.Schema(
                    type=types.Type.INTEGER,
                    description="Max emails to pull",
                ),
                "folder": types.Schema(
                    type=types.Type.STRING,
                    description="Mail folder source",
                ),
            },
            required=["host", "username", "password"],
        ),
    ),
]
