import os
import json
import subprocess
import asyncio
import inspect
from typing import Dict
from tools import TOOLS, TOOL_DECLARATIONS
from dotenv import load_dotenv
from google import genai
from google.genai import types



load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError(
        "GEMINI_API_KEY missing"
    )

client = genai.Client(
    api_key=API_KEY
)

MODEL = os.getenv("GEMINI_MODEL")


SYSTEM_PROMPT = """
You are an autonomous AI agent.

Loop:

Think
Act
Observe
Repeat

Use tools when needed.

Continue until task solved.

Do not hallucinate tool outputs.
"""


# --- ТИМЧАСОВИЙ БУТСТРАП ДЛЯ ЛОКАЛЬНОГО ТЕСТУ ---
def local_bootstrap_tokens():
    import os
    from google_auth_oauthlib.flow import InstalledAppFlow
    SCOPES = ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.readonly']

    if os.path.exists('token.json'):
        import json
        with open('token.json', 'r') as f:
            return json.load(f)

    # Якщо токена немає, запускаємо локальний сервер для авторизації твого особистого акаунту
    flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
    creds = flow.run_local_server(port=0)

    with open('token.json', 'w') as token_file:
        token_file.write(creds.to_json())

    import json
    with open('token.json', 'r') as f:
        return json.load(f)


# Перехоплюємо твої токени
try:
    TEST_USER_TOKENS = local_bootstrap_tokens()
except Exception as e:
    print(f"Помилка ініціалізації OAuth: {e}")
    TEST_USER_TOKENS = {}


def execute_tool(
    name: str,
    args: Dict
):

    if name not in TOOLS:

        return {
            "error": f"Unknown tool {name}"
        }

    tool = TOOLS[name]

    try:

        if inspect.iscoroutinefunction(tool):

            return asyncio.run(
                tool(**args)
            )

        return tool(**args)

    except Exception as e:

        return {
            "error": str(e)
        }


def run_agent(prompt):

    history = [

        types.Content(
            role="user",
            parts=[
                types.Part(
                    text=prompt
                )
            ]
        )

    ]

    MAX_ITER = 15

    for step in range(MAX_ITER):

        print(
            f"\n=== ITER {step+1} ==="
        )

        response = client.models.generate_content(

            model=MODEL,

            contents=history,

            config=types.GenerateContentConfig(

                system_instruction=SYSTEM_PROMPT,

                tools=[
                    types.Tool(
                        function_declarations=
                        TOOL_DECLARATIONS
                    )
                ]

            )

        )

        candidate = response.candidates[0]

        history.append(
            candidate.content
        )

        tool_called = False

        for part in candidate.content.parts:

            if part.text:

                print(
                    "\nGemini:"
                )

                print(
                    part.text
                )

            if part.function_call:

                tool_called = True

                tool_name = (
                    part.function_call.name
                )

                args = dict(
                    part.function_call.args
                )

                print(
                    f"\nTool: {tool_name}"
                )

                result = execute_tool(
                    tool_name,
                    args
                )

                print(
                    "Observation:"
                )

                print(result)

                history.append(

                    types.Content(

                        role="tool",

                        parts=[

                            types.Part(
                                function_response=
                                types.FunctionResponse(

                                    name=tool_name,

                                    response={"data": result}
                                )
                            )

                        ]

                    )

                )

        if not tool_called:

            return response.text

    return (
        "Iteration limit reached"
    )


answer = run_agent("""

Find current AI trends.

Calculate 25*84.

Summarize findings.

""")

print(
    "\nFINAL:"
)

print(answer)