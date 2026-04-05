import type { APIRoute } from 'astro';
import { verifySession } from '../../../../lib/auth';
import { getDB } from '../../../../lib/db';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const db = getDB(context);
  const id = context.params.id;

  const { results } = await db.prepare(
    "SELECT * FROM league_photos WHERE league_id = ? ORDER BY sort_order ASC"
  ).bind(id).all();

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
  const id = context.params.id;
  const body = await context.request.json();

  // Get the next sort_order
  const maxSort = await db.prepare(
    "SELECT MAX(sort_order) as max_sort FROM league_photos WHERE league_id = ?"
  ).bind(id).first() as any;
  const nextSort = (maxSort?.max_sort ?? -1) + 1;

  const result = await db.prepare(
    "INSERT INTO league_photos (league_id, week_id, url, caption, sort_order) VALUES (?, ?, ?, ?, ?)"
  ).bind(
    id,
    body.week_id || null,
    body.url,
    body.caption || '',
    nextSort,
  ).run();

  const photoId = result.meta?.last_row_id;

  return new Response(JSON.stringify({ success: true, id: photoId }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async (context) => {
  const isAuth = await verifySession(context);
  if (!isAuth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = getDB(context);
  const url = new URL(context.request.url);
  const photoId = url.searchParams.get('photoId');

  if (!photoId) {
    return new Response(JSON.stringify({ error: 'photoId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await db.prepare("DELETE FROM league_photos WHERE id = ?").bind(photoId).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
