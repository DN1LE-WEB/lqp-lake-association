import type { APIRoute } from 'astro';
import { verifySession } from '../../../lib/auth';
import { getDB } from '../../../lib/db';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const db = getDB(context);
  const { results } = await db.prepare(
    "SELECT * FROM fishing_league ORDER BY year DESC"
  ).all();

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' },
  });
};

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

  const result = await db.prepare(
    "INSERT INTO fishing_league (title, year, results_url, content, visible, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))"
  ).bind(
    body.title,
    body.year,
    body.results_url || null,
    body.content || '',
    body.visible ? 1 : 0,
  ).run();

  const id = result.meta?.last_row_id;

  return new Response(JSON.stringify({ success: true, id }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
