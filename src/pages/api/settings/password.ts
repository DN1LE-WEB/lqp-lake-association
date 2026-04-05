import type { APIRoute } from 'astro';
import { verifySession, hashPassword } from '../../../lib/auth';
import { getDB } from '../../../lib/db';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const isAuth = await verifySession(context);
  if (!isAuth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = getDB(context);
  const body = await context.request.json();
  const { current_password, new_password } = body;

  if (!current_password || !new_password) {
    return new Response(JSON.stringify({ error: 'Current password and new password are required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (new_password.length < 8) {
    return new Response(JSON.stringify({ error: 'New password must be at least 8 characters.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get the stored hash
  const row = await db.prepare(
    "SELECT value FROM settings WHERE key = 'admin_password_hash'"
  ).first() as { value: string } | null;

  if (!row) {
    return new Response(JSON.stringify({ error: 'Password not configured.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify current password
  const currentHash = await hashPassword(current_password);
  if (currentHash !== row.value) {
    return new Response(JSON.stringify({ error: 'Current password is incorrect.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Hash and save new password
  const newHash = await hashPassword(new_password);
  await db.prepare(
    "UPDATE settings SET value = ? WHERE key = 'admin_password_hash'"
  ).bind(newHash).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
