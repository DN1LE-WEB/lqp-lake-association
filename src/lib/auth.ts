import { getDB } from './db';

// Hash a password using SHA-256
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate a random session token
export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify password against stored hash
export async function verifyPassword(password: string, context: any): Promise<boolean> {
  const db = getDB(context);
  const row = await db.prepare("SELECT value FROM settings WHERE key = 'admin_password_hash'").first() as { value: string } | null;
  if (!row) return false;

  // If password is still 'changeme' (initial setup), accept any password and hash it
  if (row.value === 'changeme') {
    const hash = await hashPassword(password);
    await db.prepare("UPDATE settings SET value = ? WHERE key = 'admin_password_hash'").bind(hash).run();
    return true;
  }

  const inputHash = await hashPassword(password);
  return inputHash === row.value;
}

// Create a session and return the token
export async function createSession(context: any): Promise<string> {
  const db = getDB(context);
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
  await db.prepare("INSERT INTO sessions (token, expires_at) VALUES (?, ?)").bind(token, expiresAt).run();
  return token;
}

// Verify a session token from cookie
export async function verifySession(context: any): Promise<boolean> {
  const cookie = context.request.headers.get('cookie') || '';
  const match = cookie.match(/admin_session=([a-f0-9]+)/);
  if (!match) return false;

  const token = match[1];
  const db = getDB(context);
  const row = await db.prepare("SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')").bind(token).first();
  return !!row;
}

// Delete a session
export async function deleteSession(context: any): Promise<void> {
  const cookie = context.request.headers.get('cookie') || '';
  const match = cookie.match(/admin_session=([a-f0-9]+)/);
  if (match) {
    const db = getDB(context);
    await db.prepare("DELETE FROM sessions WHERE token = ?").bind(match[1]).run();
  }
}
