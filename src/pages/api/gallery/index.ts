import type { APIRoute } from 'astro';
import { verifySession } from '../../../lib/auth';
import { getDB } from '../../../lib/db';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const db = getDB(context);
  const { results } = await db.prepare(
    `SELECT a.*, COUNT(p.id) as photo_count
     FROM gallery_albums a
     LEFT JOIN gallery_photos p ON p.album_id = a.id
     GROUP BY a.id
     ORDER BY a.sort_order`
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

  const last = await db.prepare("SELECT MAX(sort_order) as max_sort FROM gallery_albums").first<{ max_sort: number | null }>();
  const sortOrder = (last?.max_sort ?? 0) + 1;

  const result = await db.prepare(
    "INSERT INTO gallery_albums (title, description, visible, sort_order) VALUES (?, ?, ?, ?)"
  ).bind(
    body.title,
    body.description || '',
    body.visible ? 1 : 0,
    sortOrder,
  ).run();

  const id = result.meta?.last_row_id;

  return new Response(JSON.stringify({ success: true, id }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
