"""Read local documents; blocking parsers run in a worker thread."""

from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any, Dict

import fitz
import pandas as pd
from docx import Document


def read_pdf(path: str) -> str:
    doc = fitz.open(path)
    return "\n".join(page.get_text() for page in doc)


def read_docx(path: str) -> str:
    doc = Document(path)
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


def read_excel(path: str) -> str:
    xls = pd.ExcelFile(path)
    out: list[str] = []
    for sheet in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name=sheet)
        out.append(f"\n# Sheet: {sheet}\n")
        out.append(df.to_csv(index=False))
    return "\n".join(out)


def _read_document_sync(path: str, max_chars: int) -> Dict[str, Any]:
    file_path = Path(path)
    if not file_path.exists():
        return {"success": False, "error": f"File not found: {path}"}

    ext = file_path.suffix.lower()
    try:
        if ext == ".pdf":
            text = read_pdf(path)
        elif ext == ".docx":
            text = read_docx(path)
        elif ext in (".xlsx", ".xls"):
            text = read_excel(path)
        elif ext in (".txt", ".md"):
            text = file_path.read_text(encoding="utf-8")
        else:
            return {"success": False, "error": f"Unsupported format: {ext}"}

        text = text or ""
        return {
            "success": True,
            "file": file_path.name,
            "extension": ext,
            "chars": len(text),
            "content": text[:max_chars],
            "truncated": len(text) > max_chars,
        }
    except Exception as exc:
        return {
            "success": False,
            "error": str(exc),
            "file": file_path.name,
        }


async def read_document(path: str, max_chars: int = 50000) -> Dict[str, Any]:
    """Read PDF, DOCX, XLSX, TXT, or Markdown files from disk."""
    return await asyncio.to_thread(_read_document_sync, path, max_chars)
