import type { APIRoute } from 'astro';
import { verifySession } from '../../../lib/auth';
import { getDB } from '../../../lib/db';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const db = getDB(context);
  const tournamentId = context.params.id;

  const { results: documents } = await db.prepare(
    "SELECT * FROM tournament_documents WHERE tournament_id = ? ORDER BY sort_order"
  ).bind(tournamentId).all();

  return new Response(JSON.stringify(documents), {
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

  const maxOrder = await db.prepare(
    "SELECT MAX(sort_order) as max_order FROM tournament_documents WHERE tournament_id = ?"
  ).bind(tournamentId).first();
  const nextOrder = ((maxOrder?.max_order as number) || 0) + 1;

  const result = await db.prepare(
    "INSERT INTO tournament_documents (tournament_id, title, url, file_type, sort_order) VALUES (?, ?, ?, ?, ?)"
  ).bind(
    tournamentId,
    body.title,
    body.url,
    body.file_type || 'pdf',
    body.sort_order ?? nextOrder,
  ).run();

  return new Response(JSON.stringify({ success: true, id: result.meta?.last_row_id }), {
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
  const docId = url.searchParams.get('docId');

  if (!docId) {
    return new Response(JSON.stringify({ error: 'docId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await db.prepare("DELETE FROM tournament_documents WHERE id = ?").bind(docId).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
