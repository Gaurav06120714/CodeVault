import { getStatus, signOut, WEB_APP_URL } from '../lib/auth';

const statusEl = document.getElementById('status')!;
const statusText = document.getElementById('statusText')!;
const signedOut = document.getElementById('signedOut')!;
const signedIn = document.getElementById('signedIn')!;

async function render(): Promise<void> {
  const { signedIn: yes } = await getStatus();
  statusEl.className = `status ${yes ? 'on' : 'off'}`;
  statusText.textContent = yes ? 'Signed in' : 'Not signed in';
  signedIn.hidden = !yes;
  signedOut.hidden = yes;
}

// Sign in: open the web-app login, and remember the tab so the background can auto-close it
// once the JWT is captured (so the user drops straight back to their coding tab).
document.getElementById('signIn')?.addEventListener('click', async () => {
  const tab = await chrome.tabs.create({ url: `${WEB_APP_URL}/login` });
  if (tab.id != null) await chrome.storage.local.set({ cvLoginTabId: tab.id });
  window.close();
});

document.getElementById('signOut')?.addEventListener('click', async () => {
  await signOut();
  await render();
});

// Quick actions — open the relevant CodeVault page.
document.querySelectorAll<HTMLButtonElement>('.actions button[data-open]').forEach((btn) => {
  btn.addEventListener('click', () => {
    chrome.tabs.create({ url: `${WEB_APP_URL}${btn.dataset.open}` });
    window.close();
  });
});

void render();
