"""Execute Python snippets in a worker thread (non-blocking for the event loop)."""

from __future__ import annotations

import asyncio
import subprocess
from typing import Any, Dict


def _run_python_sync(code: str) -> Dict[str, Any]:
    try:
        result = subprocess.run(
            ["python", "-c", code],
            capture_output=True,
            text=True,
            timeout=10,
        )
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "exit_code": result.returncode,
        }
    except Exception as exc:
        return {"error": str(exc)}


async def run_python(code: str) -> Dict[str, Any]:
    """Execute Python code and return stdout, stderr, and exit code."""
    return await asyncio.to_thread(_run_python_sync, code)
