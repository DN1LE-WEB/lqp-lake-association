import type { APIRoute } from 'astro';
import { verifySession } from '../../../lib/auth';
import { getDB } from '../../../lib/db';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const db = getDB(context);
  const id = context.params.id;

  const album = await db.prepare("SELECT * FROM gallery_albums WHERE id = ?").bind(id).first();
  if (!album) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { results: photos } = await db.prepare(
    "SELECT * FROM gallery_photos WHERE album_id = ? ORDER BY sort_order"
  ).bind(id).all();

  return new Response(JSON.stringify({ ...album, photos }), {
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
  const id = context.params.id;
  const body = await context.request.json();

  await db.prepare(
    "UPDATE gallery_albums SET title = ?, description = ?, visible = ? WHERE id = ?"
  ).bind(
    body.title,
    body.description || '',
    body.visible ? 1 : 0,
    id,
  ).run();

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
  const id = context.params.id;

  await db.prepare("DELETE FROM gallery_photos WHERE album_id = ?").bind(id).run();
  await db.prepare("DELETE FROM gallery_albums WHERE id = ?").bind(id).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
