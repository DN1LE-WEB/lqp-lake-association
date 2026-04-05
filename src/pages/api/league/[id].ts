import type { APIRoute } from 'astro';
import { verifySession } from '../../../lib/auth';
import { getDB } from '../../../lib/db';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const db = getDB(context);
  const id = context.params.id;
  const item = await db.prepare("SELECT * FROM fishing_league WHERE id = ?").bind(id).first();

  if (!item) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { results: weeks } = await db.prepare(
    "SELECT * FROM league_weeks WHERE league_id = ? ORDER BY week_number ASC"
  ).bind(id).all();

  const { results: photos } = await db.prepare(
    "SELECT * FROM league_photos WHERE league_id = ? ORDER BY sort_order ASC"
  ).bind(id).all();

  return new Response(JSON.stringify({ ...item, weeks, photos }), {
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
    "UPDATE fishing_league SET title = ?, year = ?, results_url = ?, content = ?, visible = ?, roster = ?, show_gallery = ?, end_of_year_results = ? WHERE id = ?"
  ).bind(
    body.title,
    body.year,
    body.results_url || null,
    body.content || '',
    body.visible ? 1 : 0,
    body.roster || '',
    body.show_gallery ? 1 : 0,
    body.end_of_year_results || '',
    id,
  ).run();

  // Delete existing weeks and re-insert
  await db.prepare("DELETE FROM league_weeks WHERE league_id = ?").bind(id).run();

  if (body.weeks && Array.isArray(body.weeks)) {
    for (let i = 0; i < body.weeks.length; i++) {
      const week = body.weeks[i];
      await db.prepare(
        "INSERT INTO league_weeks (league_id, week_number, title, date, content, sort_order) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(
        id,
        week.week_number || (i + 1),
        week.title || `Week ${i + 1}`,
        week.date || '',
        week.content || '',
        i,
      ).run();
    }
  }

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

  await db.prepare("DELETE FROM league_weeks WHERE league_id = ?").bind(id).run();
  await db.prepare("DELETE FROM league_photos WHERE league_id = ?").bind(id).run();
  await db.prepare("DELETE FROM fishing_league WHERE id = ?").bind(id).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
