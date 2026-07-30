# Deployment Guide

This guide covers deploying SoroStream outside of Vercel — including Docker,
bare-metal (Node.js), and fronting the app with an nginx reverse proxy.

---

## Table of Contents

1. [Environment Variables](#1-environment-variables)
2. [Docker Deployment](#2-docker-deployment)
3. [Bare-Metal Deployment](#3-bare-metal-deployment)
4. [Reverse Proxy — nginx](#4-reverse-proxy--nginx)
5. [Other Platforms](#5-other-platforms)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Environment Variables

Copy `.env.example` to set up your configuration:

```bash
cp .env.example .env.local   # local dev
cp .env.example .env         # production (Docker / bare-metal)
```

### Required

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_STELLAR_NETWORK` | Stellar network — `testnet` or `mainnet` |
| `NEXT_PUBLIC_CONTRACT_ID` | Address of the deployed SoroStream contract |

### Optional

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_RPC_URL` | `https://soroban-testnet.stellar.org` | Soroban JSON-RPC endpoint. Override for mainnet or a private node |

### Rebuild vs runtime

All three variables carry the `NEXT_PUBLIC_` prefix, which means Next.js
**inlines them into the browser bundle at build time**. Any change requires
a full `next build` — you cannot update them by restarting the container or
process alone.

> **Mainnet RPC example**
> ```
> NEXT_PUBLIC_STELLAR_NETWORK=mainnet
> NEXT_PUBLIC_RPC_URL=https://mainnet.stellar.validationcloud.io/v1/<API_KEY>
> ```

---

## 2. Docker Deployment

### Prerequisites

- Docker ≥ 24
- Docker Compose v2 (bundled with Docker Desktop; `docker compose` not `docker-compose`)

### Standalone output

The Dockerfile uses Next.js's
[standalone output](https://nextjs.org/docs/pages/api-reference/next-config-js/output)
mode to produce a self-contained `server.js`. Enable it in `next.config.js`
if it is not already set:

```js
// next.config.js
const nextConfig = {
  output: 'standalone',
  // ...existing config
};
```

### Build and run with Docker Compose

```bash
# 1. Set required build-time variables
export NEXT_PUBLIC_CONTRACT_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN
export NEXT_PUBLIC_STELLAR_NETWORK=testnet      # or mainnet

# 2. Build the image and start the container
docker compose up --build -d

# 3. Verify it is running
docker compose ps
docker compose logs -f app
```

The app is now available at `http://localhost:3000`.

### Build without Compose (plain Docker)

```bash
docker build \
  --build-arg NEXT_PUBLIC_STELLAR_NETWORK=testnet \
  --build-arg NEXT_PUBLIC_CONTRACT_ID=<your-contract-id> \
  --build-arg NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org \
  -t sorostream-app:latest .

docker run -d \
  --name sorostream-app \
  --restart unless-stopped \
  -p 3000:3000 \
  sorostream-app:latest
```

### Updating

```bash
# Pull latest code, rebuild, and restart with zero-downtime swap
docker compose build app
docker compose up -d app
```

---

## 3. Bare-Metal Deployment

Use this approach when running directly on a Linux server (Debian/Ubuntu,
RHEL/Amazon Linux, etc.) without containers.

### Prerequisites

- Node.js 20 LTS (`node -v` to check)
- npm 10+

### Steps

```bash
# 1. Install dependencies (production only for the build step)
npm ci

# 2. Export build-time variables
export NEXT_PUBLIC_STELLAR_NETWORK=testnet
export NEXT_PUBLIC_CONTRACT_ID=<your-contract-id>
export NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org

# 3. Build
npm run build

# 4. Start
NODE_ENV=production node .next/standalone/server.js
```

#### Running as a systemd service

Create `/etc/systemd/system/sorostream.service`:

```ini
[Unit]
Description=SoroStream Next.js App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/sorostream-app
ExecStart=/usr/bin/node .next/standalone/server.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now sorostream
sudo systemctl status sorostream
```

#### Using PM2

```bash
npm install -g pm2
pm2 start .next/standalone/server.js --name sorostream
pm2 save
pm2 startup   # follow the printed command to register on boot
```

---

## 4. Reverse Proxy — nginx

Putting nginx in front of the Node.js server gives you TLS termination,
HTTP → HTTPS redirection, and gzip compression.

### nginx configuration

Save as `/etc/nginx/sites-available/sorostream` (or inside a Docker volume):

```nginx
# HTTP → HTTPS redirect
server {
    listen 80;
    server_name sorostream.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sorostream.example.com;

    # TLS — replace with your certificate paths (e.g. from Let's Encrypt)
    ssl_certificate     /etc/letsencrypt/live/sorostream.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sorostream.example.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options       "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff"   always;
    add_header Referrer-Policy       "strict-origin-when-cross-origin" always;

    # Proxy to Next.js
    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade    $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host       $host;
        proxy_set_header   X-Real-IP  $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache Next.js static assets aggressively
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires    365d;
        add_header Cache-Control "public, immutable";
    }

    # Public folder
    location /public/ {
        proxy_pass http://127.0.0.1:3000;
        expires    30d;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/sorostream /etc/nginx/sites-enabled/
sudo nginx -t          # verify config
sudo systemctl reload nginx
```

#### Free TLS with Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d sorostream.example.com
# Certbot auto-patches the nginx config and sets up renewal
```

### nginx inside Docker Compose

Uncomment the `nginx` service block in `docker-compose.yml`, then place your
config at `./nginx/nginx.conf`. Mount your certificates at `./nginx/certs/`.

---

## 5. Other Platforms

### Railway / Render / Fly.io

These platforms build from the `Dockerfile` automatically. Set the three
`NEXT_PUBLIC_*` variables as **build-time** environment variables in the
platform dashboard (not runtime env vars — Next.js inlines them during the
build).

| Platform | Where to set build args |
|---|---|
| Railway | Project → Variables → "Available at build time" toggle |
| Render | Service → Environment → "Available during build" checkbox |
| Fly.io | `fly secrets set` does **not** work for build args — use `[build.args]` in `fly.toml` |

### Coolify / Dokku

Pass `--build-arg` values through the platform's build config or the
`Dockerfile`'s `ARG` defaults.

---

## 6. Troubleshooting

### App crashes with "Missing required environment variables"

`src/lib/env.ts` validates `NEXT_PUBLIC_CONTRACT_ID` and
`NEXT_PUBLIC_STELLAR_NETWORK` at startup. One or both are empty.

**Fix:** ensure both are set as build args before running `next build` or
`docker build`. Restarting the container without rebuilding is not enough.

---

### `Error: Cannot find module 'sodium-native'`

This native addon is listed as an external in `next.config.js`. If it appears
at runtime it means the `node_modules` folder was not copied into the
standalone output.

**Fix:** the `Dockerfile` copies `node_modules` explicitly into the runner
stage. If you built manually, copy the folder alongside `server.js`:

```bash
cp -r node_modules .next/standalone/node_modules
```

---

### Blank page or 500 after deploy — `NEXT_PUBLIC_*` variables are empty

The browser bundle shows `undefined` for network/contract values.

**Cause:** the variables were set as runtime env vars (e.g. `docker run -e`)
after the build, instead of as build args.

**Fix:** always pass them as `--build-arg` to `docker build` or as build-time
environment variables on your hosting platform, then rebuild.

---

### `getaddrinfo ENOTFOUND soroban-testnet.stellar.org`

The container cannot reach the Stellar RPC endpoint.

**Fix:** check outbound internet access from the container:

```bash
docker exec sorostream-app wget -qO- https://soroban-testnet.stellar.org
```

If behind a corporate proxy, set `HTTP_PROXY` / `HTTPS_PROXY` in the
container environment.

---

### nginx returns 502 Bad Gateway

Next.js is not listening yet or crashed.

```bash
# Check if the app is up
curl -s http://127.0.0.1:3000/  | head -5

# Check logs
docker compose logs app        # Docker
sudo journalctl -u sorostream  # systemd
pm2 logs sorostream            # PM2
```

---

### Port 3000 already in use

```bash
# Find and kill the conflicting process
lsof -i :3000
kill -9 <PID>

# Or change the port
PORT=3001 node .next/standalone/server.js
```

Update the nginx `proxy_pass` to match if you change the port.
