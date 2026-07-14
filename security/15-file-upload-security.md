# 15. File Upload Security

## What it is
User-uploaded files are a classic attack vector (malware, oversized payloads, script execution).
Enforce strict type allow-lists, size caps, and store/serve uploads safely.

## Applied to CodeVault
- **CodeVault has no user file-upload surface by design** — it's a "no-upload default" product
  (see [FILE_UPLOAD_SECURITY.md](FILE_UPLOAD_SECURITY.md)). Users never upload files to the app.
- The only "writes" are **captured source code + problem statements** pushed to the user's **own
  GitHub repo** via the GitHub API — text content, length-capped at capture, not arbitrary binary
  uploads to CodeVault infrastructure.
- If an upload feature is ever added (e.g. avatars), enforce MIME allow-list + magic-byte check +
  size cap + off-domain storage.

## Implementation checklist
- [x] No user file-upload endpoints (no attack surface)
- [x] Captured content is text, length-capped, written only to the user's GitHub repo
- [ ] (If uploads added later) MIME allow-list + size cap + content scanning

**Status: ✅ N/A by design — no upload surface. Blueprint ready if one is added.**
