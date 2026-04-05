import type { APIRoute } from 'astro';
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
