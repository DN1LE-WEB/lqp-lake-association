import type { APIRoute } from 'astro';
import { getDB } from '../../../lib/db';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const db = getDB(context);
  const { results } = await db.prepare(
    "SELECT * FROM sections ORDER BY sort_order"
  ).all();

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' },
  });
};
