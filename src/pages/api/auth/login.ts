import type { APIRoute } from 'astro';
import { verifyPassword, createSession } from '../../../lib/auth';

export const POST: APIRoute = async (context) => {
  const formData = await context.request.formData();
  const password = formData.get('password') as string;

  if (!password) {
    return context.redirect('/admin/login?error=1');
  }

  const valid = await verifyPassword(password, context);
  if (!valid) {
    return context.redirect('/admin/login?error=1');
  }

  const token = await createSession(context);

  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/admin',
      'Set-Cookie': `admin_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
    },
  });
};

export const prerender = false;
