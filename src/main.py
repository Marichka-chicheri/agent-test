import os
import asyncio
import inspect
from typing import Dict, Any
from dotenv import load_dotenv
from google import genai
from google.genai import types

from tools import TOOLS, TOOL_DECLARATIONS

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY missing from environment setup.")

client = genai.Client(api_key=API_KEY)
MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "").replace(" ", "")
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME", "").strip()
IMAP_HOST = os.getenv("IMAP_HOST", "imap.gmail.com").strip()

SYSTEM_PROMPT = """
You are an autonomous AI agent.

Loop:
Think -> Act -> Observe -> Repeat

Use tools when needed. Continue until the task is completely solved.
Do not hallucinate tool outputs.

You have access to the tool:
read_email_inbox(host, username, password, limit, folder)
This tool reads emails from an IMAP mailbox and returns structured data containing recent emails.

## TOOL USAGE RULES
- Always use the tool when the user asks about emails, inbox, messages, or mail content.
- Never guess email content without calling the tool.
- Default limit is 10 emails unless the user specifies otherwise.
- Default folder is "INBOX".

NEVER invent or guess credentials.
NEVER pass email, username, or password into tools.
These values are injected automatically by the system.

IMPORTANT:
You must ONLY use information returned by tools.
If no tool output exists, say "No data available".
Never infer or imagine email content.

## RESPONSE STYLE
When emails are found:
- Summarize inbox briefly.
- Highlight important emails (security alerts, payments, urgent tasks).
- Show sender + subject + short summary.
"""


def execute_tool(name: str, args: Dict[str, Any]) -> Dict[str, Any]:
    if name not in TOOLS:
        return {"error": f"Unknown tool {name}"}

    tool = TOOLS[name]
    try:
        if inspect.iscoroutinefunction(tool):
            return asyncio.run(tool(**args))
        return tool(**args)
    except Exception as e:
        return {"error": str(e)}


def run_agent(prompt: str) -> str:
    history = [
        types.Content(
            role="user",
            parts=[types.Part(text=prompt)]
        )
    ]

    MAX_ITER = 15

    for step in range(MAX_ITER):
        print(f"\n=== ITER {step + 1} ===")

        response = client.models.generate_content(
            model=MODEL,
            contents=history,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                tools=[types.Tool(function_declarations=TOOL_DECLARATIONS)]
            )
        )

        candidate = response.candidates[0]
        history.append(candidate.content)
        tool_called = False

        for part in candidate.content.parts:
            if part.text:
                print("\nGemini:", part.text)

            if part.function_call:
                tool_called = True
                tool_name = part.function_call.name

                # Auto-inject credentials if agent targets the inbox tool
                raw_args = part.function_call.args or {}

                if tool_name == "read_email_inbox":
                    # SAFE WHITELIST (only model-controlled fields)
                    limit = 10
                    folder = "INBOX"

                    if isinstance(raw_args, dict):
                        if isinstance(raw_args.get("limit"), int):
                            limit = raw_args["limit"]

                        if isinstance(raw_args.get("folder"), str):
                            folder = raw_args["folder"]

                    # SYSTEM-OWNED CREDENTIALS (NEVER from model)
                    args = {
                        "host": IMAP_HOST,
                        "username": EMAIL_USERNAME,
                        "password": EMAIL_PASSWORD,
                        "limit": limit,
                        "folder": folder,
                    }
                else:
                    args = dict(raw_args)

                print(f"\nTool: {tool_name}")
                result = execute_tool(tool_name, args)
                print("Observation:", result)

                # Send response back as a dictionary directly mapping to schema
                history.append(
                    types.Content(
                        role="tool",
                        parts=[
                            types.Part(
                                function_response=types.FunctionResponse(
                                    name=tool_name,
                                    response=result if isinstance(result, dict) else {"result": result}
                                )
                            )
                        ]
                    )
                )

        if not tool_called:
            return response.text

    return "Iteration limit reached"


if __name__ == "__main__":
    user_prompt = """
    Check my email inbox and summarize all recent messages.
    - Show what emails I received
    - Highlight important ones (security, payments, work)
    - Group similar emails together
    - Extract any tasks or actions I need to do
    - Keep it concise and structured
    """

    print("\nFINAL:")
    answer = run_agent(user_prompt)
    print(answer)