import sqlite3
import json
from pathlib import Path

DB_PATH = Path(__file__).parent / "runs.db"
OUT_PATH = Path(__file__).parent / "runs.json"

conn = sqlite3.connect(DB_PATH)
rows = conn.execute("SELECT id, status, prompt, result, created_at, steps FROM agent_runs").fetchall()
conn.close()

# html = """
# <html>
# <head>
# <meta charset="utf-8">
# <style>
#   body { font-family: Arial; padding: 20px; background: #f5f5f5; }
#   table { border-collapse: collapse; width: 100%; background: white; }
#   th { background: #333; color: white; padding: 10px; text-align: left; }
#   td { padding: 8px 10px; border-bottom: 1px solid #ddd; vertical-align: top; max-width: 300px; word-wrap: break-word; }
#   .done { color: green; font-weight: bold; }
#   .error { color: red; font-weight: bold; }
#   .steps { font-size: 12px; color: #555; }
# </style>
# </head>
# <body>
# <h2>Agent Runs</h2>
# <table>
# <tr><th>ID</th><th>Status</th><th>Prompt</th><th>Result</th><th>Created</th><th>Steps</th></tr>
# """
#
# for row in rows:
#     id_, status, prompt, result, created_at, steps_json = row
#     steps = json.loads(steps_json)
#     status_class = "done" if status == "done" else "error"
#     steps_html = "<br>".join(f"[{s.get('type')}] {s.get('tool', s.get('content', ''))[:80]}" for s in steps)
#     html += f"""
# <tr>
#   <td>{id_}</td>
#   <td class="{status_class}">{status}</td>
#   <td>{prompt.strip()[:100]}</td>
#   <td>{str(result)[:200]}</td>
#   <td>{created_at}</td>
#   <td class="steps">{steps_html}</td>
# </tr>"""
#
# html += "</table></body></html>"
#
# out = Path(__file__).parent / "runs_view.html"
# out.write_text(html, encoding="utf-8")
data = []

for row in rows:
    id_, status, prompt, result, created_at, steps_json = row

    try:
        steps = json.loads(steps_json) if steps_json else []
    except json.JSONDecodeError:
        steps = []

    data.append({
        "id": id_,
        "status": status,
        "prompt": prompt,
        "result": result,
        "created_at": created_at,
        "steps": steps,
    })

OUT_PATH.write_text(
    json.dumps(data, ensure_ascii=False, indent=2),
    encoding="utf-8"
)

print(f"Відкрийте: {OUT_PATH}")