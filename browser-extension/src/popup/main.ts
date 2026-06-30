import { getStatus, signOut, WEB_APP_URL } from '../lib/auth';

const dot = document.getElementById('dot')!;
const statusEl = document.getElementById('status')!;
const action = document.getElementById('action') as HTMLButtonElement;

async function render(): Promise<void> {
  const { signedIn } = await getStatus();
  dot.className = signedIn ? 'dot on' : 'dot off';
  statusEl.textContent = signedIn ? 'Signed in' : 'Not signed in';
  action.textContent = signedIn ? 'Sign out' : 'Sign in';
  action.dataset.signedIn = String(signedIn);
}

action.addEventListener('click', async () => {
  if (action.dataset.signedIn === 'true') {
    await signOut();
  } else {
    // Open the web app; the codevault content script captures the JWT after sign-in.
    chrome.tabs.create({ url: `${WEB_APP_URL}/login` });
  }
  await render();
});

void render();
