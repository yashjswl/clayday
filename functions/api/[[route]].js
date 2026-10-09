/* clayday API · Cloudflare Pages Function + D1
 *   POST   /api/login     {email,password}
 *   POST   /api/logout
 *   GET    /api/me
 *   GET    /api/data
 *   PUT    /api/data      {data}
 *   POST   /api/password  {current,next}
 *   DELETE /api/account   {password}
 *   --- admin only (there is no public signup) ---
 *   GET    /api/admin/users
 *   POST   /api/admin/users              {name,email,password}
 *   POST   /api/admin/users/:id/password {password}
 *   DELETE /api/admin/users/:id
 */
const COOKIE = 'clayday_session';
const SESSION_DAYS = 30;
const PBKDF2_ITER = 100000;          // Workers' maximum for PBKDF2
const MAX_FAILS = 5, LOCK_SECS = 300;
const MAX_DATA_BYTES = 900 * 1024;   // D1 row limit is 2 MB; stay well under

const enc = new TextEncoder();
const now = () => Math.floor(Date.now() / 1000);

/* ---------- small helpers ---------- */
const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
const fail = (status, error, extra = {}) => json({ error, ...extra }, status);

const b64 = (buf) => { let s = ''; for (const b of new Uint8Array(buf)) s += String.fromCharCode(b); return btoa(s); };
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const sha256 = async (s) => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

async function derive(password, salt, iter) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256));
}
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${PBKDF2_ITER}$${b64(salt)}$${b64(await derive(password, salt, PBKDF2_ITER))}`;
}
async function verifyPassword(password, stored) {
  const [alg, iter, salt, hash] = stored.split('$');
  if (alg !== 'pbkdf2') return false;
  return safeEqual(await derive(password, unb64(salt), +iter), unb64(hash));
}
// Burns the same CPU as a real check so "unknown email" isn't distinguishable by timing.
const DUMMY = 'pbkdf2$100000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

function getCookie(request, name) {
  const m = (request.headers.get('cookie') || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? m[1] : null;
}
function cookieHeader(request, value, maxAge) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

async function readJson(request, limit = 4096) {
  const text = await request.text();
  if (text.length > limit) throw new HttpError(413, 'Request too large');
  try { return JSON.parse(text || '{}'); } catch { throw new HttpError(400, 'Invalid JSON'); }
}
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

/* ---------- sessions ---------- */
async function createSession(env, request, userId) {
  const token = b64(crypto.getRandomValues(new Uint8Array(32))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const t = now();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO sessions (id,user_id,expires_at,created_at) VALUES (?,?,?,?)')
      .bind(await sha256(token), userId, t + SESSION_DAYS * 86400, t),
    env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(t),
  ]);
  return cookieHeader(request, token, SESSION_DAYS * 86400);
}
async function currentUser(env, request) {
  const token = getCookie(request, COOKIE);
  if (!token) return null;
  return env.DB.prepare(
    `SELECT u.id,u.name,u.email,u.role,s.id AS sid FROM sessions s JOIN users u ON u.id=s.user_id
     WHERE s.id=? AND s.expires_at>?`
  ).bind(await sha256(token), now()).first();
}

/* ---------- validation ---------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function validPassword(pw) {
  if (typeof pw !== 'string' || pw.length < 8) return 'Password must be at least 8 characters';
  if (pw.length > 128) return 'Password is too long (max 128)';
  return null;
}

/* ---------- handlers ---------- */
/* ---------- admin: user management (no public signup) ---------- */
async function adminListUsers(env) {
  const { results } = await env.DB.prepare('SELECT id,name,email,role,created_at FROM users ORDER BY created_at').all();
  return json({ users: results });
}
async function adminAddUser(env, request) {
  const b = await readJson(request);
  const name = String(b.name || '').trim().slice(0, 40);
  const email = String(b.email || '').trim().toLowerCase();
  if (!name) return fail(400, 'Enter a name');
  if (!EMAIL_RE.test(email) || email.length > 254) return fail(400, 'That email doesn’t look right');
  const pwErr = validPassword(b.password);
  if (pwErr) return fail(400, pwErr);
  const id = crypto.randomUUID(), created = now();
  try {
    await env.DB.prepare('INSERT INTO users (id,email,name,role,pw_hash,created_at) VALUES (?,?,?,?,?,?)')
      .bind(id, email, name, 'user', await hashPassword(b.password), created).run();
  } catch (e) {
    if (/UNIQUE/i.test(String(e))) return fail(409, 'A user with this email already exists');
    throw e;
  }
  return json({ user: { id, name, email, role: 'user', created_at: created } }, 201);
}
async function adminResetPassword(env, request, id) {
  const b = await readJson(request);
  const pwErr = validPassword(b.password);
  if (pwErr) return fail(400, pwErr);
  const u = await env.DB.prepare('SELECT id FROM users WHERE id=?').bind(id).first();
  if (!u) return fail(404, 'User not found');
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET pw_hash=?, failed_count=0, locked_until=0 WHERE id=?').bind(await hashPassword(b.password), id),
    env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(id),
  ]);
  return json({ ok: true });
}
async function adminDeleteUser(env, admin, id) {
  if (id === admin.id) return fail(400, 'You can’t delete your own admin account');
  const u = await env.DB.prepare('SELECT id FROM users WHERE id=?').bind(id).first();
  if (!u) return fail(404, 'User not found');
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(id),
    env.DB.prepare('DELETE FROM user_data WHERE user_id=?').bind(id),
    env.DB.prepare('DELETE FROM users WHERE id=?').bind(id),
  ]);
  return json({ ok: true });
}

async function login(env, request) {
  const b = await readJson(request);
  const email = String(b.email || '').trim().toLowerCase();
  const password = String(b.password || '');
  if (!email || !password || password.length > 128) return fail(400, 'Enter your email and password');

  const u = await env.DB.prepare('SELECT * FROM users WHERE email=?').bind(email).first();
  if (u && u.locked_until > now()) {
    const mins = Math.ceil((u.locked_until - now()) / 60);
    return fail(429, `Too many attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`);
  }
  const ok = await verifyPassword(password, u ? u.pw_hash : DUMMY);
  if (!u || !ok) {
    if (u) {
      const fails = u.failed_count + 1;
      if (fails >= MAX_FAILS) {
        await env.DB.prepare('UPDATE users SET failed_count=0, locked_until=? WHERE id=?').bind(now() + LOCK_SECS, u.id).run();
      } else {
        await env.DB.prepare('UPDATE users SET failed_count=? WHERE id=?').bind(fails, u.id).run();
      }
    }
    return fail(401, 'Incorrect email or password');
  }
  if (u.failed_count || u.locked_until) {
    await env.DB.prepare('UPDATE users SET failed_count=0, locked_until=0 WHERE id=?').bind(u.id).run();
  }
  const cookie = await createSession(env, request, u.id);
  return json({ user: { id: u.id, name: u.name, email: u.email, role: u.role } }, 200, { 'set-cookie': cookie });
}

async function logout(env, request) {
  const token = getCookie(request, COOKIE);
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE id=?').bind(await sha256(token)).run();
  return json({ ok: true }, 200, { 'set-cookie': cookieHeader(request, '', 0) });
}

async function getData(env, user) {
  const row = await env.DB.prepare('SELECT json,rev FROM user_data WHERE user_id=?').bind(user.id).first();
  return json(row ? { data: JSON.parse(row.json), rev: row.rev } : { data: null, rev: 0 });
}
async function putData(env, request, user) {
  const b = await readJson(request, MAX_DATA_BYTES + 1024);
  if (!b.data || typeof b.data !== 'object' || Array.isArray(b.data)) return fail(400, 'Invalid data');
  const text = JSON.stringify(b.data);
  if (enc.encode(text).length > MAX_DATA_BYTES) return fail(413, 'Your data is too large to save');
  const t = now();
  await env.DB.prepare(
    `INSERT INTO user_data (user_id,json,rev,updated_at) VALUES (?,?,1,?)
     ON CONFLICT(user_id) DO UPDATE SET json=excluded.json, rev=rev+1, updated_at=excluded.updated_at`
  ).bind(user.id, text, t).run();
  const row = await env.DB.prepare('SELECT rev FROM user_data WHERE user_id=?').bind(user.id).first();
  return json({ ok: true, rev: row.rev });
}

async function changePassword(env, request, user) {
  const b = await readJson(request);
  const u = await env.DB.prepare('SELECT pw_hash FROM users WHERE id=?').bind(user.id).first();
  if (!(await verifyPassword(String(b.current || ''), u.pw_hash))) return fail(403, 'Current password is incorrect');
  const pwErr = validPassword(b.next);
  if (pwErr) return fail(400, pwErr);
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET pw_hash=? WHERE id=?').bind(await hashPassword(b.next), user.id),
    // sign out every other device
    env.DB.prepare('DELETE FROM sessions WHERE user_id=? AND id<>?').bind(user.id, user.sid),
  ]);
  return json({ ok: true });
}

async function deleteAccount(env, request, user) {
  if (user.role === 'admin') return fail(400, 'The admin account can’t be deleted');
  const b = await readJson(request);
  const u = await env.DB.prepare('SELECT pw_hash FROM users WHERE id=?').bind(user.id).first();
  if (!(await verifyPassword(String(b.password || ''), u.pw_hash))) return fail(403, 'Password is incorrect');
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(user.id),
    env.DB.prepare('DELETE FROM user_data WHERE user_id=?').bind(user.id),
    env.DB.prepare('DELETE FROM users WHERE id=?').bind(user.id),
  ]);
  return json({ ok: true }, 200, { 'set-cookie': cookieHeader(request, '', 0) });
}

/* ---------- router ---------- */
export async function onRequest({ request, env, params }) {
  try {
    if (!env.DB) return fail(500, 'Database not configured. Bind a D1 database named DB.');
    const route = [].concat(params.route || []).join('/');
    const method = request.method;

    // CSRF: state-changing requests must come from our own origin.
    if (method !== 'GET' && method !== 'HEAD') {
      const origin = request.headers.get('origin');
      if (origin && new URL(origin).host !== new URL(request.url).host) return fail(403, 'Bad origin');
    }

    if (route === 'login' && method === 'POST') return await login(env, request);
    if (route === 'logout' && method === 'POST') return await logout(env, request);

    const user = await currentUser(env, request);
    if (!user) return fail(401, 'Not signed in');

    if (route === 'me' && method === 'GET') return json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    if (route === 'data' && method === 'GET') return await getData(env, user);
    if (route === 'data' && method === 'PUT') return await putData(env, request, user);
    if (route === 'password' && method === 'POST') return await changePassword(env, request, user);
    if (route === 'account' && method === 'DELETE') return await deleteAccount(env, request, user);

    if (route.startsWith('admin/')) {
      if (user.role !== 'admin') return fail(403, 'Admins only');
      const [, res, id, sub] = route.split('/');
      if (res === 'users' && !id && method === 'GET') return await adminListUsers(env);
      if (res === 'users' && !id && method === 'POST') return await adminAddUser(env, request);
      if (res === 'users' && id && sub === 'password' && method === 'POST') return await adminResetPassword(env, request, id);
      if (res === 'users' && id && !sub && method === 'DELETE') return await adminDeleteUser(env, user, id);
    }

    return fail(404, 'Not found');
  } catch (e) {
    if (e instanceof HttpError) return fail(e.status, e.message);
    console.error(e);
    return fail(500, 'Something went wrong on our side');
  }
}
