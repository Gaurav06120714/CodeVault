#!/bin/bash
set -e

# api utils
/usr/bin/git pull --rebase --autostash origin main
/usr/bin/git push origin main

/usr/bin/git add web-frontend/src/utils/api.ts
/usr/bin/git commit -m "feat: attach CSRF token to mutating requests in apiFetch"
/usr/bin/git pull --rebase --autostash origin main
/usr/bin/git push origin main

# frontend files
for file in web-frontend/src/app/\(app\)/connect/page.tsx \
  web-frontend/src/app/\(app\)/layout.tsx \
  web-frontend/src/app/\(app\)/messages/page.tsx \
  web-frontend/src/app/\(app\)/repositories/page.tsx \
  web-frontend/src/app/\(app\)/settings/page.tsx \
  web-frontend/src/app/\(app\)/sync-status/page.tsx \
  web-frontend/src/app/login/callback/email/page.tsx \
  web-frontend/src/app/login/callback/page.tsx \
  web-frontend/src/app/login/page.tsx \
  web-frontend/src/app/u/\[username\]/page.tsx \
  web-frontend/src/components/NotificationBell.tsx; do
    
    filename=$(basename "$file")
    /usr/bin/git add "$file"
    /usr/bin/git commit -m "refactor: use apiFetch in $filename for CSRF compatibility"
    /usr/bin/git pull --rebase --autostash origin main
    /usr/bin/git push origin main
done
