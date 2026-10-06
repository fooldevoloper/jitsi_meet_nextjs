# Multi-Meeting App (Next.js & Self-Hosted Jitsi)

A zero-backend, zero-database, cryptographically private video conferencing web application built with **Next.js App Router (TypeScript)** and **Jitsi Meet**.

Users enter a meeting password; the password deterministically maps to a private Jitsi conference room via standard Web Crypto PBKDF2 key derivation. Different passwords map to different isolated rooms without maintaining any server-side database.

The conference is embedded directly inside your application via `@jitsi/react-sdk` (`JitsiMeeting`) on your own domain (**`meet.balkrishnapokharel.com.np`**). Participants are never redirected away to external third-party servers.

---

## Table of Contents
- [Admin Access & Security](#admin-access--security)
- [How It Works](#how-it-works)
- [Security Model & Honest Limitations](#security-model--honest-limitations)
- [Environment Configuration](#environment-configuration)
- [Local Development](#local-development)
- [Deploying to Vercel](#deploying-to-vercel)
- [Self-Hosting Your Jitsi Instance](#self-hosting-your-jitsi-instance)

---

## Admin Access & Security

### Restricting Meeting Creation
To prevent arbitrary visitors from creating meetings, the `/admin` screen is locked behind a **Special Administrator Password**:
1. When navigating to `/admin` (`Host Portal`), visitors must enter your configured administrator password.
2. Only after entering the correct administrator password does the interface unlock the meeting generator and shareable link creator.
3. The password check compares against the SHA-256 hash defined in `NEXT_PUBLIC_ADMIN_PASSWORD_HASH`.

### Setting Your Special Admin Password
To set or change your administrator password:
1. Choose your secret passphrase (e.g. `MySuperSecretAdminPass!2024`).
2. Generate its SHA-256 hash:
   ```bash
   echo -n "MySuperSecretAdminPass!2024" | shasum -a 256
   ```
3. Set the output in your environment variables:
   ```env
   NEXT_PUBLIC_ADMIN_PASSWORD_HASH=6df...your_sha256_hash_here...
   ```
*(By default, the demo fallback password is `admin-secret-passphrase` until you customize this variable).*

---

## How It Works

### Deterministic Password-to-Room Mapping
1. When a user enters a meeting password (minimum 10 characters), the client trims whitespace and normalizes it using Unicode NFKC (`password.trim().normalize('NFKC')`).
2. The normalized password is passed to the Web Cryptography API PBKDF2 function:
   - **Algorithm:** PBKDF2-SHA256
   - **Salt:** `NEXT_PUBLIC_ROOM_SALT`
   - **Iterations:** 200,000
   - **Key Length:** 128 bits (16 bytes)
3. The derived 16 bytes are hex-encoded (32 hex characters) and prefixed with `m-`, forming the room name:
   ```
   roomName = "m-" + hex(PBKDF2-SHA256(password, salt, 200000 iterations, 128 bits))
   ```
4. Participants with identical passwords derive the exact same room name and join each other's conference.
5. The derived room name and password are never stored in `localStorage`, `sessionStorage`, or cookies, and are never logged or exposed in the UI.

### In-App Video Conferencing (No External Script Dependencies & No Redirects)
- The Jitsi Meet External API is bundled directly inside this repository (`public/external_api.js`), meaning **no external scripts or CDNs are loaded from third-party servers**.
- The video conference runs inside an embedded 100dvh iframe rendered directly inside your Next.js application on your own domain (`meet.balkrishnapokharel.com.np`).
- Users remain on your domain at all times; they are **never redirected** to `meet.jit.si` or any external website.

### Shareable Join Links
- On `/admin`, the authenticated admin can generate random 80-bit base32 meeting keys or specify a custom meeting password.
- Shareable links use URL fragments: `${origin}/join#${password}`.
- Because URL fragments (`#...`) are never transmitted in HTTP requests to web servers or CDN proxies, the password remains private to the client.
- When `/join` loads, it extracts the fragment, prefills/auto-submits the form, and immediately scrubs the fragment using `window.history.replaceState` so it is not retained in browser history or the address bar.

---

## Security Model & Honest Limitations

1. **Weak Passwords are Guessable:**
   - Security depends directly on meeting password entropy. Short or common words can be brute-forced offline. Always use the generated 16-character keys (`xxxx-xxxx-xxxx-xxxx`) or passphrases with 10+ characters.
2. **Wrong Password = Empty Room:**
   - There is no central password database or meeting registry. Entering an incorrect password derives a different room name, placing the user into an empty room.
3. **Open Admission with Knowledge of Password:**
   - Anyone who possesses the password can derive the room name and join.
4. **Moderator Role Assignment:**
   - In community Jitsi instances without JWT tokens, the first participant to join the room receives moderator status.
5. **No Password Persistence:**
   - Passwords and room names reside purely in browser memory during an active session and are wiped when the user leaves or closes the tab. Only the user's Display Name is persisted in `localStorage` for convenience.
6. **Defense-in-Depth Room Lock:**
   - When enabled (`ENABLE_ROOM_LOCK = true`), the client derives a secondary `lockKey` via a separate salt suffix (`:lock`) and issues a room lock command if the local user is first to join, automatically unlocking it when invited participants connect.

---

## Environment Configuration

Configure these environment variables in your deployment environment or `.env.local`:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_JITSI_DOMAIN` | Domain of your self-hosted Jitsi Meet server (must allow iframe embedding) | `meet.balkrishnapokharel.com.np` |
| `NEXT_PUBLIC_ROOM_SALT` | Random salt string for PBKDF2 derivation. **Changing this invalidates all past passwords and rooms.** | Long secret string |
| `NEXT_PUBLIC_ADMIN_PASSWORD_HASH` | SHA-256 hash (in hex) of your administrator password to unlock `/admin`. | SHA-256 of `admin-secret-passphrase` |

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local

# 3. Start development server
npm run dev

# 4. Run tests and type checks
npm run build
npm run lint
```

---

## Deploying to Vercel

1. Commit and push your code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Revamp to multi-meeting app with admin lock and custom domain"
   git push origin main
   ```
2. In the [Vercel Dashboard](https://vercel.com/):
   - Select your project.
   - Go to **Settings &rarr; Environment Variables**.
   - Add:
     - `NEXT_PUBLIC_JITSI_DOMAIN`: `meet.balkrishnapokharel.com.np`
     - `NEXT_PUBLIC_ROOM_SALT`: (Generate a secure random string)
     - `NEXT_PUBLIC_ADMIN_PASSWORD_HASH`: (SHA-256 hash of your chosen admin password)
3. Deploy or trigger a redeploy. Your site will build and serve instantly.

---

## Self-Hosting Your Jitsi Instance

If hosting Jitsi Meet via Docker (`docker-jitsi-meet`) on `meet.balkrishnapokharel.com.np`:

### 1. Allow Iframe Embedding
Ensure your Jitsi Meet configuration permits iframe embedding from your Vercel deployment:
- In Jitsi's `web` container configuration (`config.js`):
  ```javascript
  // Disable CSP frame-ancestors block or allow your Next.js domain:
  // e.g. "frame-ancestors 'self' https://your-vercel-domain.vercel.app https://meet.balkrishnapokharel.com.np"
  ```
- In your reverse proxy (Nginx / Caddy / Cloudflare), ensure `X-Frame-Options` is set to `ALLOWALL` or matches your frontend domain, or remove any `SAMEORIGIN` restrictions that prevent your Next.js site from embedding the iframe.
