import type { APIRoute } from 'astro';
import { verifySession } from '../../../lib/auth';
import { getDB } from '../../../lib/db';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const db = getDB(context);
  const { results } = await db.prepare(
    "SELECT * FROM news ORDER BY sort_order, created_at DESC"
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

  // Get next sort_order
  const last = await db.prepare("SELECT MAX(sort_order) as max_sort FROM news").first<{ max_sort: number | null }>();
  const sortOrder = (last?.max_sort ?? 0) + 1;

  const result = await db.prepare(
    "INSERT INTO news (title, content, image_url, visible, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))"
  ).bind(
    body.title,
    body.content || '',
    body.image_url || null,
    body.visible ? 1 : 0,
    sortOrder,
  ).run();

  const id = result.meta?.last_row_id;

  return new Response(JSON.stringify({ success: true, id }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
