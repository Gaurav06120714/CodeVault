import type { SetTokenMessage } from '../types';

// Runs on the CodeVault web app origin. The web app stores the user's JWT in
// localStorage('token') after sign-in; this script reads it (same-origin) and hands it to
// the background worker so the extension authenticates as the SAME user — no separate login.
// (A future PKCE flow via web-backend /auth/extension/* can replace this; see EXTENSION_PLAN.)
function syncToken(): void {
  // After the extension is reloaded/updated, this old content script's context is gone and
  // `chrome.runtime.sendMessage` throws "Extension context invalidated" synchronously.
  // `chrome.runtime.id` is undefined once invalidated — bail out quietly (the page re-injects
  // a fresh script on its next load).
  try {
    if (!chrome.runtime?.id) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const msg: SetTokenMessage = { type: 'setToken', token };
    chrome.runtime.sendMessage(msg).catch(() => undefined);
  } catch {
    /* extension context invalidated — ignore; a page reload re-injects the script */
  }
}

// On load and whenever the tab regains focus (covers fresh logins).
syncToken();
window.addEventListener('focus', syncToken);
window.addEventListener('storage', (e) => {
  if (e.key === 'token') syncToken();
});
