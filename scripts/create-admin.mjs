#!/usr/bin/env node
/* Creates (or resets) the admin account directly in D1, so no public signup endpoint is needed.
 *   node scripts/create-admin.mjs <local|remote> ["Display Name"]
 * Prompts for the password (hidden; or set ADMIN_PASSWORD for non-interactive use), hashes it exactly like the API does, and runs wrangler d1 execute. */
import { pbkdf2Sync, randomBytes, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';

const ADMIN_EMAIL = 'yashasvi.jaiswal.2006@gmail.com';
const target = process.argv[2];
const name = (process.argv[3] || 'Yashasvi').replace(/'/g, "''");
if (!['local', 'remote'].includes(target)) {
  console.error('Usage: node scripts/create-admin.mjs <local|remote> ["Display Name"]');
  process.exit(1);
}

function askHidden(q) {
  return new Promise((res) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(q)) process.stdout.write(s); };
    rl.question(q, (a) => { rl.close(); process.stdout.write('\n'); res(a); });
  });
}

const pw = process.env.ADMIN_PASSWORD ?? await askHidden(`Password for ${ADMIN_EMAIL} (min 8 chars): `);
if (pw.length < 8 || pw.length > 128) { console.error('Password must be 8–128 characters.'); process.exit(1); }
const again = process.env.ADMIN_PASSWORD ?? await askHidden('Repeat password: ');
if (pw !== again) { console.error('Passwords do not match.'); process.exit(1); }

const salt = randomBytes(16);
const hash = pbkdf2Sync(pw, salt, 100000, 32, 'sha256');
const stored = `pbkdf2$100000$${salt.toString('base64')}$${hash.toString('base64')}`;
const now = Math.floor(Date.now() / 1000);
const sql =
  `INSERT INTO users (id,email,name,role,pw_hash,created_at) VALUES ('${randomUUID()}','${ADMIN_EMAIL}','${name}','admin','${stored}',${now}) ` +
  `ON CONFLICT(email) DO UPDATE SET pw_hash=excluded.pw_hash, role='admin', failed_count=0, locked_until=0;` +
  ` DELETE FROM sessions WHERE user_id=(SELECT id FROM users WHERE email='${ADMIN_EMAIL}');`;

const r = spawnSync('npx', ['wrangler', 'd1', 'execute', 'clayday', `--${target}`, '--command', sql], { stdio: 'inherit' });
process.exit(r.status ?? 1);
