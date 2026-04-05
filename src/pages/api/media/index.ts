import type { APIRoute } from 'astro';
import { verifySession } from '../../../lib/auth';
import { getUploads } from '../../../lib/db';

export const GET: APIRoute = async (context) => {
  const isAuth = await verifySession(context);
  if (!isAuth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const uploads = getUploads(context);
  const listed = await uploads.list({ prefix: 'uploads/' });

  const files = listed.objects.map((obj: any) => ({
    key: obj.key,
    url: `/api/media/${obj.key}`,
    size: obj.size,
    uploaded: obj.uploaded.toISOString(),
  }));

  return new Response(JSON.stringify(files), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const prerender = false;
