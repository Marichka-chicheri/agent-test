"""Human-in-the-loop approval gate for agent tool execution."""

from __future__ import annotations

import os
import threading
import uuid
from dataclasses import dataclass
from typing import Any, Dict, Optional

APPROVAL_NOTE = "Requires human approval before execution."
AUTO_APPROVE_TOOLS = os.getenv("AUTO_APPROVE_TOOLS", "false").lower() in ("1", "true", "yes")
DEFAULT_APPROVAL_TIMEOUT_SEC = float(os.getenv("APPROVAL_TIMEOUT_SEC", "300"))


@dataclass(frozen=True)
class PendingApproval:
    """A tool call waiting for human approval."""

    id: str
    run_id: int
    tool_name: str
    args: Dict[str, Any]


class ApprovalManager:
    """Tracks pending tool approvals and resolves them via approve/deny."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._events: Dict[str, threading.Event] = {}
        self._decisions: Dict[str, bool] = {}
        self._pending: Dict[str, PendingApproval] = {}

    def request(
        self,
        run_id: int,
        tool_name: str,
        args: Dict[str, Any],
    ) -> PendingApproval:
        approval_id = str(uuid.uuid4())
        pending = PendingApproval(
            id=approval_id,
            run_id=run_id,
            tool_name=tool_name,
            args=dict(args),
        )
        with self._lock:
            self._pending[approval_id] = pending
            self._events[approval_id] = threading.Event()
        return pending

    def wait(self, approval_id: str, timeout: Optional[float] = None) -> bool:
        if AUTO_APPROVE_TOOLS:
            return True

        with self._lock:
            event = self._events.get(approval_id)
        if event is None:
            return False

        resolved = event.wait(timeout=timeout)
        if not resolved:
            return False

        with self._lock:
            return self._decisions.get(approval_id, False)

    def approve(self, approval_id: str) -> bool:
        return self._resolve(approval_id, approved=True)

    def deny(self, approval_id: str) -> bool:
        return self._resolve(approval_id, approved=False)

    def get_pending(self, approval_id: str) -> Optional[PendingApproval]:
        with self._lock:
            return self._pending.get(approval_id)

    def _resolve(self, approval_id: str, *, approved: bool) -> bool:
        with self._lock:
            event = self._events.get(approval_id)
            if event is None:
                return False
            self._decisions[approval_id] = approved
            event.set()
            self._pending.pop(approval_id, None)
        return True


approval_manager = ApprovalManager()
