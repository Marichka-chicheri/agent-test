"""Agent execution loop using Gemini API only."""

from __future__ import annotations

import asyncio
import inspect
import os
import time
from typing import Any, Callable, Dict, List, Optional, Union

from dotenv import load_dotenv
from google import genai
from google.genai import types

from agent_metrics import agent_metrics
from approval_manager import (
    DEFAULT_APPROVAL_TIMEOUT_SEC,
    approval_manager,
)
from logger import add_step, create_run, finish_run, init_db
from tools import TOOLS
from tools.registry import declarations_for_tools, resolve_allowed_tools

load_dotenv()
init_db()

DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
MAX_ITER = int(os.getenv("MAX_ITER", "20"))
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "").replace(" ", "")
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME", "").strip()
IMAP_HOST = os.getenv("IMAP_HOST", "imap.gmail.com").strip()

_clients: Dict[str, genai.Client] = {}
ToolResult = Union[str, Dict[str, Any]]


def _resolve_api_key(api_key: Optional[str]) -> str:
    key = (api_key or os.getenv("GEMINI_API_KEY") or "").strip()
    if not key:
        raise ValueError("Gemini API key is required")
    return key


def _get_client(api_key: Optional[str] = None) -> genai.Client:
    key = _resolve_api_key(api_key)
    if key not in _clients:
        _clients[key] = genai.Client(api_key=key)
    return _clients[key]


async def execute_tool_async(name: str, args: Dict[str, Any]) -> ToolResult:
    if name not in TOOLS:
        return {"error": f"Unknown tool {name}"}

    tool = TOOLS[name]
    try:
        if inspect.iscoroutinefunction(tool):
            return await tool(**args)
        return await asyncio.to_thread(tool, **args)
    except Exception as exc:
        return {"error": str(exc)}


def execute_tool(name: str, args: Dict[str, Any]) -> ToolResult:
    return asyncio.run(execute_tool_async(name, args))


def prepare_tool_args(tool_name: str, raw_args: Dict[str, Any]) -> Dict[str, Any]:
    if tool_name == "read_email_inbox":
        limit = 50
        folder = "INBOX"

        if isinstance(raw_args, dict):
            if isinstance(raw_args.get("limit"), int):
                limit = raw_args["limit"]
            if isinstance(raw_args.get("folder"), str):
                folder = raw_args["folder"]

        return {
            "host": IMAP_HOST,
            "username": EMAIL_USERNAME,
            "password": EMAIL_PASSWORD,
            "limit": limit,
            "folder": folder,
        }

    return dict(raw_args or {})


def _tool_succeeded(result: ToolResult) -> bool:
    if isinstance(result, dict):
        if result.get("error"):
            return False
        if result.get("success") is False:
            return False
    return True


def _record_step(
    run_id: int,
    step: dict,
    on_step: Optional[Callable[[dict], None]],
) -> None:
    add_step(run_id, step)
    if on_step:
        on_step(step)


def _execute_with_approval(
    run_id: int,
    tool_name: str,
    raw_args: Dict[str, Any],
    args: Dict[str, Any],
    on_step: Optional[Callable[[dict], None]],
) -> ToolResult:
    pending = approval_manager.request(run_id, tool_name, raw_args)
    _record_step(
        run_id,
        {
            "type": "approval_pending",
            "approval_id": pending.id,
            "tool": tool_name,
            "args": raw_args,
        },
        on_step,
    )

    approved = approval_manager.wait(
        pending.id,
        timeout=DEFAULT_APPROVAL_TIMEOUT_SEC,
    )
    if not approved:
        return {
            "error": (
                "Tool execution was denied or timed out waiting for human approval."
            )
        }

    started = time.perf_counter()
    result = execute_tool(tool_name, args)
    duration_ms = (time.perf_counter() - started) * 1000
    success = _tool_succeeded(result)
    error_msg: Optional[str] = None
    if isinstance(result, dict):
        error_msg = result.get("error")
    agent_metrics.record_tool_call(
        run_id,
        tool_name,
        duration_ms,
        success=success,
        error=str(error_msg) if error_msg else None,
    )
    return result


def run_agent(
    prompt: str,
    system_prompt: str,
    on_step: Optional[Callable[[dict], None]] = None,
    max_iter: Optional[int] = None,
    api_key: Optional[str] = None,
    model: Optional[str] = None,
    allowed_tools: Optional[List[str]] = None,
) -> str:
    """Run the Gemini agent loop; invoke on_step for each persisted step."""
    client = _get_client(api_key)
    instruction = (system_prompt or "").strip()
    if not instruction:
        raise ValueError("System prompt is required")

    gemini_model = (model or DEFAULT_GEMINI_MODEL).strip()
    limit = max_iter if max_iter is not None else MAX_ITER
    allowed_set = resolve_allowed_tools(allowed_tools)
    tool_declarations = declarations_for_tools(allowed_set)

    def _tool_allowed(tool_name: str) -> bool:
        return allowed_set is None or tool_name in allowed_set

    run_id = create_run(prompt)
    agent_metrics.start_run(run_id)
    history = [types.Content(role="user", parts=[types.Part(text=prompt)])]

    try:
        for _ in range(limit):
            agent_metrics.record_iteration(run_id)

            response = client.models.generate_content(
                model=gemini_model,
                contents=history,
                config=types.GenerateContentConfig(
                    system_instruction=instruction,
                    tools=[types.Tool(function_declarations=tool_declarations)],
                ),
            )

            candidate = response.candidates[0]
            history.append(candidate.content)

            tool_called = False

            for part in candidate.content.parts:
                if part.text:
                    step_data = {"type": "thought", "content": part.text}
                    _record_step(run_id, step_data, on_step)

                if part.function_call:
                    tool_called = True
                    tool_name = part.function_call.name
                    raw_args = dict(part.function_call.args or {})
                    args = prepare_tool_args(tool_name, raw_args)

                    _record_step(
                        run_id,
                        {"type": "tool_call", "tool": tool_name, "args": raw_args},
                        on_step,
                    )

                    if not _tool_allowed(tool_name):
                        result = {
                            "error": (
                                f"Tool '{tool_name}' is not enabled for this agent."
                            )
                        }
                    else:
                        result = _execute_with_approval(
                            run_id,
                            tool_name,
                            raw_args,
                            args,
                            on_step,
                        )

                    _record_step(
                        run_id,
                        {"type": "observation", "tool": tool_name, "result": result},
                        on_step,
                    )

                    history.append(
                        types.Content(
                            role="tool",
                            parts=[
                                types.Part(
                                    function_response=types.FunctionResponse(
                                        name=tool_name,
                                        response=result
                                        if isinstance(result, dict)
                                        else {"result": result},
                                    )
                                )
                            ],
                        )
                    )

            if not tool_called:
                final_text = response.text or ""
                finish_run(run_id, final_text, "done")
                _record_step(
                    run_id,
                    {"type": "final", "content": final_text},
                    on_step,
                )
                metrics_snapshot = agent_metrics.finish_run(run_id)
                _record_step(
                    run_id,
                    {"type": "metrics", "metrics": metrics_snapshot},
                    on_step,
                )
                return final_text

        message = "Iteration limit reached"
        finish_run(run_id, message, "error")
        _record_step(run_id, {"type": "error", "message": message}, on_step)
        agent_metrics.finish_run(run_id)
        return message

    except Exception as exc:
        finish_run(run_id, str(exc), "error")
        _record_step(run_id, {"type": "error", "message": str(exc)}, on_step)
        agent_metrics.finish_run(run_id)
        raise


def can_run_live_agent(api_key: Optional[str] = None) -> bool:
    try:
        _resolve_api_key(api_key)
        return True
    except ValueError:
        return False
