import type { APIRoute } from 'astro';
import { verifySession } from '../../../../lib/auth';
import { getDB } from '../../../../lib/db';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const db = getDB(context);
  const id = context.params.id;

  const { results } = await db.prepare(
    "SELECT * FROM gallery_photos WHERE album_id = ? ORDER BY sort_order"
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
  const albumId = context.params.id;
  const body = await context.request.json();

  const last = await db.prepare(
    "SELECT MAX(sort_order) as max_sort FROM gallery_photos WHERE album_id = ?"
  ).bind(albumId).first<{ max_sort: number | null }>();
  const sortOrder = body.sort_order ?? ((last?.max_sort ?? 0) + 1);

  const result = await db.prepare(
    "INSERT INTO gallery_photos (album_id, url, caption, sort_order) VALUES (?, ?, ?, ?)"
  ).bind(
    albumId,
    body.url,
    body.caption || '',
    sortOrder,
  ).run();

  const id = result.meta?.last_row_id;

  return new Response(JSON.stringify({ success: true, id }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async (context) => {
  const isAuth = await verifySession(context);
  if (!isAuth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = getDB(context);
  const body = await context.request.json();

  if (!body.photos || !Array.isArray(body.photos)) {
    return new Response(JSON.stringify({ error: 'photos array required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stmts = body.photos.map((photo: any) =>
    db.prepare(
      "UPDATE gallery_photos SET caption = ?, sort_order = ? WHERE id = ?"
    ).bind(photo.caption || '', photo.sort_order ?? 0, photo.id)
  );

  if (stmts.length > 0) {
    await db.batch(stmts);
  }

  return new Response(JSON.stringify({ success: true }), {
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
    return new Response(JSON.stringify({ error: 'photoId query param required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await db.prepare("DELETE FROM gallery_photos WHERE id = ?").bind(photoId).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
