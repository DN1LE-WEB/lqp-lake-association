import type { APIRoute } from 'astro';
import { verifySession } from '../../../lib/auth';
import { getUploads } from '../../../lib/db';

export const GET: APIRoute = async (context) => {
  const uploads = getUploads(context);
  const key = context.params.key;

  if (!key) {
    return new Response('Not found', { status: 404 });
  }

  const object = await uploads.get(key);
  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  return new Response(object.body, { headers });
};

export const DELETE: APIRoute = async (context) => {
  const isAuth = await verifySession(context);
  if (!isAuth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const uploads = getUploads(context);
  const key = context.params.key;

  if (!key) {
    return new Response('Not found', { status: 404 });
  }

  await uploads.delete(key);
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const prerender = false;
