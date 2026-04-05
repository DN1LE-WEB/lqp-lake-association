import type { APIRoute } from 'astro';
import { verifySession } from '../../lib/auth';
import { getUploads } from '../../lib/db';

export const POST: APIRoute = async (context) => {
  // Verify admin session
  const isAuth = await verifySession(context);
  if (!isAuth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const uploads = getUploads(context);
  const formData = await context.request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowedTypes.includes(file.type)) {
    return new Response(JSON.stringify({ error: 'File type not allowed' }), { status: 400 });
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return new Response(JSON.stringify({ error: 'File too large (max 10MB)' }), { status: 400 });
  }

  // Generate unique key
  const ext = file.name.split('.').pop() || 'bin';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const key = `uploads/${timestamp}-${random}.${ext}`;

  // Upload to R2
  const arrayBuffer = await file.arrayBuffer();
  await uploads.put(key, arrayBuffer, {
    httpMetadata: { contentType: file.type },
    customMetadata: { originalName: file.name },
  });

  // Return the public URL
  // For R2, we'll serve via a custom endpoint since R2 public access needs setup
  const url = `/api/media/${key}`;

  return new Response(JSON.stringify({ url, key, name: file.name, size: file.size }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const prerender = false;
