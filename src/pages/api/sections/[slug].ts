import type { APIRoute } from 'astro';
import { verifySession } from '../../../lib/auth';
import { getDB } from '../../../lib/db';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const db = getDB(context);
  const slug = context.params.slug;
  const section = await db.prepare("SELECT * FROM sections WHERE slug = ?").bind(slug).first();

  if (!section) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(section), {
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
  const slug = context.params.slug;
  const body = await context.request.json();

  await db.prepare(
    "UPDATE sections SET title = ?, content = ?, visible = ?, updated_at = datetime('now') WHERE slug = ?"
  ).bind(body.title, body.content, body.visible ? 1 : 0, slug).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
