import type { APIRoute } from 'astro';
import { buildSiteIndex } from '../lib/site-index';

export const GET: APIRoute = async () => new Response(JSON.stringify(await buildSiteIndex()), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
});
