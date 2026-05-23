"""Background agent execution for Django AgentRun records."""

import json
import logging
import sys
from pathlib import Path

from django.conf import settings
from django.db import close_old_connections
from django.utils import timezone

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SRC_ROOT = PROJECT_ROOT / "src"
for path in (str(SRC_ROOT), str(PROJECT_ROOT)):
    if path not in sys.path:
        sys.path.insert(0, path)


def map_step_to_frontend(step: dict) -> dict:
    step_type = step.get("type")

    if step_type == "thought":
        return {"type": "thought", "content": step.get("content", "")}

    if step_type == "tool_call":
        args = step.get("args") or step.get("input") or {}
        if isinstance(args, dict):
            input_text = json.dumps(args, ensure_ascii=False)
        else:
            input_text = str(args)
        return {
            "type": "tool_call",
            "tool": step.get("tool", ""),
            "input": input_text,
        }

    if step_type == "observation":
        result = step.get("result", "")
        if isinstance(result, (dict, list)):
            result = json.dumps(result, ensure_ascii=False)
        return {
            "type": "tool_result",
            "tool": step.get("tool", ""),
            "result": str(result),
        }

    if step_type == "final":
        return {"type": "final_answer", "content": step.get("content", "")}

    if step_type == "error":
        return {
            "type": "error",
            "content": step.get("message", step.get("content", "Unknown error")),
        }

    if step_type == "max_steps_reached":
        return {"type": "max_steps_reached", "content": step.get("content", "Max steps reached")}

    if step_type == "approval_pending":
        return {
            "type": "approval_pending",
            "tool": step.get("tool", ""),
            "approval_id": step.get("approval_id", ""),
            "input": json.dumps(step.get("args") or {}, ensure_ascii=False),
        }

    if step_type == "metrics":
        return {
            "type": "metrics",
            "content": json.dumps(step.get("metrics") or {}, ensure_ascii=False),
        }

    return {"type": step_type or "thought", "content": str(step)}


def _append_step(run, frontend_event: dict):
    steps = list(run.steps or [])
    steps.append(frontend_event)
    run.steps = steps
    run.updated_at = timezone.now()
    run.save(update_fields=["steps", "updated_at"])


def _get_user_gemini_key(owner) -> str:
    from .models import UserAPIKey

    try:
        record = owner.api_keys
    except UserAPIKey.DoesNotExist:
        return ""

    return record.get_gemini_key()


def execute_agent_run(run_id: int):
    from .models import AgentRun

    close_old_connections()

    run = AgentRun.objects.select_related("agent", "owner").get(pk=run_id)
    agent = run.agent
    owner = run.owner
    system_prompt = agent.build_system_prompt()
    prompt = run.message
    api_key = _get_user_gemini_key(owner)
    gemini_model = getattr(settings, "GEMINI_MODEL", "gemini-2.0-flash")

    def on_raw_step(raw_step: dict):
        close_old_connections()
        run.refresh_from_db()
        _append_step(run, map_step_to_frontend(raw_step))

    try:
        from agent_runner import can_run_live_agent, run_agent

        if not can_run_live_agent(api_key):
            raise ValueError(
                "Gemini API key is missing. Add your key in Settings before running agents."
            )

        max_iter = max(1, min(20, agent.max_iterations or 10))

        result = run_agent(
            prompt,
            system_prompt=system_prompt,
            on_step=on_raw_step,
            max_iter=max_iter,
            api_key=api_key,
            model=gemini_model,
        )

        run.refresh_from_db()
        run.status = AgentRun.STATUS_DONE
        run.result = result or ""
        run.updated_at = timezone.now()
        run.save(update_fields=["status", "result", "updated_at"])

    except Exception as exc:
        logger.exception("Agent run %s failed", run_id)
        close_old_connections()
        run.refresh_from_db()
        _append_step(run, {"type": "error", "content": str(exc)})
        run.status = AgentRun.STATUS_ERROR
        run.error = str(exc)
        run.updated_at = timezone.now()
        run.save(update_fields=["status", "error", "steps", "updated_at"])
