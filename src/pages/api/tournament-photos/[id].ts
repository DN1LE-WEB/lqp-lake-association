import type { APIRoute } from 'astro';
import { verifySession } from '../../../lib/auth';
import { getDB } from '../../../lib/db';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const db = getDB(context);
  const tournamentId = context.params.id;

  const { results: photos } = await db.prepare(
    "SELECT * FROM tournament_photos WHERE tournament_id = ? ORDER BY sort_order"
  ).bind(tournamentId).all();

  return new Response(JSON.stringify(photos), {
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
  const tournamentId = context.params.id;
  const body = await context.request.json();

  if (!body.url) {
    return new Response(JSON.stringify({ error: 'url required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const maxOrder = await db.prepare(
    "SELECT MAX(sort_order) as max_order FROM tournament_photos WHERE tournament_id = ?"
  ).bind(tournamentId).first();
  const nextOrder = ((maxOrder?.max_order as number) || 0) + 1;

  const result = await db.prepare(
    "INSERT INTO tournament_photos (tournament_id, url, caption, sort_order) VALUES (?, ?, ?, ?)"
  ).bind(
    tournamentId,
    body.url,
    body.caption || '',
    body.sort_order ?? nextOrder,
  ).run();

  return new Response(JSON.stringify({ success: true, id: result.meta?.last_row_id }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PATCH: APIRoute = async (context) => {
  const isAuth = await verifySession(context);
  if (!isAuth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = getDB(context);
  const tournamentId = context.params.id;
  const body = await context.request.json();

  if (Array.isArray(body.order)) {
    const stmts = body.order.map((photoId: number, idx: number) =>
      db.prepare(
        "UPDATE tournament_photos SET sort_order = ? WHERE id = ? AND tournament_id = ?"
      ).bind(idx + 1, photoId, tournamentId)
    );
    if (stmts.length > 0) {
      await db.batch(stmts);
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (body.id) {
    await db.prepare(
      "UPDATE tournament_photos SET caption = ? WHERE id = ? AND tournament_id = ?"
    ).bind(body.caption ?? '', body.id, tournamentId).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'order array or id required' }), {
    status: 400,
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
  const tournamentId = context.params.id;
  const url = new URL(context.request.url);
  const photoId = url.searchParams.get('photoId');

  if (!photoId) {
    return new Response(JSON.stringify({ error: 'photoId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await db.prepare(
    "DELETE FROM tournament_photos WHERE id = ? AND tournament_id = ?"
  ).bind(photoId, tournamentId).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
