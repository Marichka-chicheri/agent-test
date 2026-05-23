/**
 * Offline fallback when GET /api/tools/ is unavailable (e.g. backend not deployed yet).
 * Keep in sync with accounts/tool_utils.py _FALLBACK_TOOLS.
 */
export const FALLBACK_TOOL_CATALOG = [
  { id: "web_search", name: "web_search", label: "Web search", desc: "Search the web for up-to-date information" },
  { id: "http_request", name: "http_request", label: "HTTP request", desc: "Send HTTP GET or POST requests to external URLs" },
  { id: "run_python", name: "run_python", label: "Run Python", desc: "Execute Python code and return stdout, stderr, and exit code" },
  { id: "read_email_inbox", name: "read_email_inbox", label: "Read email inbox", desc: "Read messages from an IMAP inbox" },
  { id: "read_document", name: "read_document", label: "Read document", desc: "Read PDF, DOCX, XLSX, TXT, and Markdown from disk" },
  { id: "github_list_issues", name: "github_list_issues", label: "GitHub: list issues", desc: "List GitHub issues for a repository" },
  { id: "github_create_issue", name: "github_create_issue", label: "GitHub: create issue", desc: "Create a new GitHub issue in a repository" },
]
