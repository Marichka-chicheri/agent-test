"""Build Gemini system prompts from agent persona fields."""


def build_system_prompt(role: str, backstory: str, additional_context: str = "") -> str:
    role = (role or "").strip() or "AI Assistant"
    backstory = (backstory or "").strip()
    additional_context = (additional_context or "").strip()

    lines = [
        f"You are a {role}.",
        "",
        "Background:",
        backstory or "No backstory provided.",
    ]

    if additional_context:
        lines.extend(
            [
                "",
                "Follow these behavioral guidelines:",
                additional_context,
            ]
        )

    return "\n".join(lines)
