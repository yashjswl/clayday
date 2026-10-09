# clayday

A claymorphic personal day planner. Static front-end in `public/`, accounts and storage via a
Cloudflare Pages Function (`functions/api/[[route]].js`) backed by D1.

## Deploy to Cloudflare

```bash
npm install
npx wrangler login

# 1. create the database, then paste the printed database_id into wrangler.toml
npx wrangler d1 create clayday

# 2. create the tables
npm run db:remote

# 3. create the admin account (yashasvi.jaiswal.2006@gmail.com); you'll be asked for a password
npm run admin:remote

# 4. create the Pages project and deploy
npx wrangler pages project create clayday --production-branch main
npm run deploy
```

If you deploy through the dashboard/Git integration instead: Pages project → Settings →
Bindings → add a **D1 database** binding named `DB` pointing at `clayday`, and set the build
output directory to `public`. Run `npm run db:remote` once to create the tables.

## Local development

```bash
npm install
npm run db:local   # once
npm run admin:local   # once, creates the admin login locally
npm run dev        # http://localhost:8788
```

## How auth works

- **There is no public signup.** The only way in is an account the admin created. The admin
  (`yashasvi.jaiswal.2006@gmail.com`) is created from the command line (`npm run admin:remote`,
  rerun it any time to reset that password). Once logged in, **Account → Manage users** lets the admin add
  users, reset their passwords (which signs them out everywhere) and delete them.
- Passwords are hashed with PBKDF2-SHA256 (100k iterations, random 16-byte salt) via WebCrypto.
- Login creates a random 256-bit session token; only its SHA-256 is stored in D1.
  The cookie is `HttpOnly; SameSite=Lax` (+ `Secure` on https), valid 30 days.
- 5 wrong passwords lock the account for 5 minutes. Unknown emails take the same time as wrong passwords.
- State-changing requests are rejected if the `Origin` header isn't your own host.
- Changing your password signs out your other devices. Accounts can be deleted from the account menu.
- Each user's dashboard data is a single JSON document (`user_data`), saved ~0.7 s after each change.
  Last write wins if you edit on two devices at once; the app re-syncs when you return to a tab.

For extra protection against bot signups, add a Cloudflare rate-limiting rule on `/api/login` and `/api/signup`.
