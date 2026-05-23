"""Runtime metrics for agent tool calls and iterations."""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class ToolCallMetric:
    tool: str
    duration_ms: float
    success: bool
    error: Optional[str] = None


@dataclass
class RunMetrics:
    run_id: int
    iterations: int = 0
    tool_calls: List[ToolCallMetric] = field(default_factory=list)
    started_at: float = field(default_factory=time.perf_counter)

    def snapshot(self) -> Dict[str, Any]:
        total_ms = sum(m.duration_ms for m in self.tool_calls)
        failures = sum(1 for m in self.tool_calls if not m.success)
        return {
            "run_id": self.run_id,
            "iterations": self.iterations,
            "tool_call_count": len(self.tool_calls),
            "tool_failures": failures,
            "total_tool_duration_ms": round(total_ms, 2),
            "elapsed_ms": round((time.perf_counter() - self.started_at) * 1000, 2),
        }


class AgentMetrics:
    """Thread-safe per-run metrics collector."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._runs: Dict[int, RunMetrics] = {}

    def start_run(self, run_id: int) -> RunMetrics:
        with self._lock:
            metrics = RunMetrics(run_id=run_id)
            self._runs[run_id] = metrics
            return metrics

    def record_iteration(self, run_id: int) -> None:
        with self._lock:
            run = self._runs.get(run_id)
            if run is not None:
                run.iterations += 1

    def record_tool_call(
        self,
        run_id: int,
        tool: str,
        duration_ms: float,
        *,
        success: bool,
        error: Optional[str] = None,
    ) -> None:
        with self._lock:
            run = self._runs.get(run_id)
            if run is None:
                return
            run.tool_calls.append(
                ToolCallMetric(
                    tool=tool,
                    duration_ms=round(duration_ms, 2),
                    success=success,
                    error=error,
                )
            )

    def snapshot(self, run_id: int) -> Dict[str, Any]:
        with self._lock:
            run = self._runs.get(run_id)
            if run is None:
                return {}
            return run.snapshot()

    def finish_run(self, run_id: int) -> Dict[str, Any]:
        snapshot = self.snapshot(run_id)
        with self._lock:
            self._runs.pop(run_id, None)
        return snapshot


agent_metrics = AgentMetrics()
