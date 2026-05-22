"""CLI entry point for local agent runs."""

from agent_runner import run_agent

if __name__ == "__main__":
    user_prompt = """
Analyze the file "resource.pdf".

Instructions:
1. Read the document using available tools.
2. Identify what the document is about.
3. Provide a concise summary in 3–7 sentences.
4. Mention the document type (report, manual, article, invoice, presentation, etc.) if recognizable.
5. Mention key topics, entities, or important sections found in the document.
6. Do not quote large parts of the document.
7. If the document cannot be read, explain why.

Return only the final summary.
    """

    print("\nFINAL:")
    answer = run_agent(user_prompt)
    print(answer)
