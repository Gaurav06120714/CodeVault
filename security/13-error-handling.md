# 13. Proper Error Handling

## What it is
Return safe, generic error messages to clients; never leak stack traces, SQL, internal paths, or
secrets. Log the details server-side instead.

## Applied to CodeVault
- **Central error middleware** on both services (`error.middleware.ts`) plus a structured logger
  (`pino`) — errors are logged server-side, not dumped to the client.
- The **rate limiter** returns a clean `429` with a generic message.
- **Gap to tighten:** some controllers currently surface `error.message` directly in the JSON
  response (e.g. auth flows return `error.message || 'Internal server error'`). These should be
  mapped to **generic client messages** so upstream/internal details never reach the browser,
  while the full error stays in the server log.

## Implementation checklist
- [x] Central error middleware + structured server-side logging (pino)
- [x] Rate-limit / auth failures return generic messages
- [ ] Audit all controllers to stop returning raw `error.message` to clients
- [ ] Ensure `NODE_ENV=production` disables verbose/stack output

**Status: 🟠 Partial — framework in place; scrub raw error messages before launch.**
