## 2026-02-19 - LocalStorage Data Corruption Handling
**Vulnerability:** Application crash (DoS) when `localStorage` data is corrupted or malformed.
**Learning:** `JSON.parse` throws `SyntaxError` on invalid JSON, which halts execution if not caught.
**Prevention:** Always wrap `JSON.parse` of `localStorage` data in `try...catch` blocks and provide fallback values or clear corrupted data.
