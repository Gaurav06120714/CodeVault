# 📱 CodeVault Mobile

The CodeVault mobile app — **Expo SDK 54 + expo-router**, running on a phone via **Expo Go**. It
mirrors the web app's features against the same backends, so the data is identical.

Full documentation: [`../docs/MOBILE_APP.md`](../docs/MOBILE_APP.md).

## Quick start

The phone can't reach the laptop's `localhost` — point the app at your machine's **LAN IP** (same
Wi-Fi). Find it with `ipconfig getifaddr en0` (macOS).

```bash
cd mobile
npm install
cp .env.example .env          # set EXPO_PUBLIC_WEB_API / EXPO_PUBLIC_GIT_API to your LAN IP
npx expo start --lan          # scan the QR with the Expo Go app
```

Requires **web-backend (:4000)** and **git-service (:5050)** running and reachable on the LAN.
Your Expo Go app must be on **SDK 54**.

## Login

Email magic-link — enter the email on your account, then paste the token into the verify screen.
Without SMTP configured, the token prints to the web-backend console, or:

```bash
docker exec codevault-postgres psql -U codevault -d codevault -tAc \
  'select token from verification_tokens order by "createdAt" desc limit 1;'
```

Email login lands on the same account a GitHub login would (matched by email), so you see your real
data.

## Layout

- `src/app` — expo-router routes (auth, tabs, chat, profile, connect, notifications).
- `src/api` — axios clients + endpoint functions.
- `src/auth` — auth context (login, profile hydration, persistence).
- `src/components` — UI kit + SVG chart kit.
- `src/lib` — config (API base URLs), theme, storage, stats normalization.

## Scripts

- `npx expo start --lan` — dev server for Expo Go.
- `npx expo start --lan -c` — same, clearing the Metro cache (use after dependency changes).
- `npx tsc --noEmit` — type-check.
- `npx expo export -p ios` — validate the production bundle compiles.
