<div align="center">

# 🚀 CodeVault — Deploy free & always-on (Oracle Cloud "Always Free")

</div>

> $0 forever, runs with your Mac off, real HTTPS link to share. Oracle asks for a card to
> **verify** your identity but does **not** charge for Always-Free resources. You run the whole
> stack (frontend + 2 backends + Postgres + Redis + Caddy for HTTPS) on one small VM with a single
> `docker compose` command.

## The shape
```
your-name.duckdns.org ─▶ Caddy (HTTPS) ─▶ web-frontend ──/api──▶ web-backend
   (free subdomain)                                      └/gitapi─▶ git-service
                                                          + postgres + redis (internal)
```
Everything is same-origin behind Caddy, so cookies + CSRF just work.

---

## 1. Oracle Cloud account + a free VM
1. Sign up at **cloud.oracle.com** (choose your home region, e.g. Mumbai). Add a card to verify — Always-Free stays $0.
2. Console → **Compute → Instances → Create instance**:
   - Image: **Ubuntu 22.04**.
   - Shape: **Ampere (Arm) VM.Standard.A1.Flex** — set 1–2 OCPU / 6–12 GB (all Always-Free). If Arm is out of capacity, use **VM.Standard.E2.1.Micro** (AMD, also free).
   - Add your SSH key (or let it generate one — download it).
   - Create. Note the **public IP**.
3. Open the web ports: Instance → its **subnet → Security List → Add Ingress Rules**: source `0.0.0.0/0`, TCP ports **80** and **443**. (Also do `sudo iptables` open or `netfilter-persistent` if Ubuntu blocks them — see step 3.)

## 2. Free domain (needed for HTTPS)
1. Go to **duckdns.org**, sign in, create a subdomain e.g. **`codevault`** → `codevault.duckdns.org`.
2. Set its IP to your VM's public IP.

## 3. SSH in + install Docker
```bash
ssh ubuntu@<VM_PUBLIC_IP>
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git
sudo usermod -aG docker $USER && newgrp docker
# open the firewall on the VM itself (Oracle Ubuntu images block 80/443 by default):
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

## 4. Get the code + secrets
```bash
git clone https://github.com/Gaurav06120714/CodeVault.git && cd CodeVault
nano .env      # create it with the values below
```
`.env` (next to `docker-compose.prod.yml`):
```
DOMAIN=codevault.duckdns.org
DB_PASSWORD=<pick any strong password>
JWT_SECRET=<openssl rand -hex 32>
ENCRYPTION_KEY=<openssl rand -hex 32>
GITHUB_CLIENT_ID=Ov23liaSjAYFgsFp9WzL
GITHUB_CLIENT_SECRET=<your github secret>
GOOGLE_CLIENT_ID=625546308328-....apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your google secret>
```

## 5. Launch everything
```bash
docker compose -f docker-compose.prod.yml up -d --build
# first time: create the DB schema
docker compose -f docker-compose.prod.yml exec web-backend npx prisma db push
```
Caddy gets the HTTPS cert automatically (give it ~30s). Your link:
**`https://codevault.duckdns.org`** 🎉

## 6. Point OAuth at the live URL
- **GitHub** OAuth App → callback URL: `https://codevault.duckdns.org/login/callback`
- **Google** OAuth client → authorized redirect URI: `https://codevault.duckdns.org/login/callback/google` (and set the JS origin to `https://codevault.duckdns.org`).

## 7. Extension for the live backend
On your Mac, rebuild it pointed at the deployed URL, then load `dist/` unpacked:
```bash
cd browser-extension
VITE_API_URL="https://codevault.duckdns.org/api" \
VITE_GIT_SERVICE_URL="https://codevault.duckdns.org/gitapi" \
VITE_WEB_APP_URL="https://codevault.duckdns.org" \
npm run build
```
(Also update the background worker's hardcoded `http://localhost:3000` origin check to the live URL.)

---

## Updating later
SSH in → `cd CodeVault && git pull && docker compose -f docker-compose.prod.yml up -d --build`.

## Cost
Always-Free VM + your own Postgres/Redis in containers = **$0/month**, always-on. No sleeping.
