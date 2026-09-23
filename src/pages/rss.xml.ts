import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../site.config';

const xml = (value: string) => value.replace(/[<>&"']/g, (char) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
})[char]!);

export const GET: APIRoute = async () => {
  const notes = (await getCollection('notes', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  const items = notes.map((note) => {
    const link = new URL(`/notes/${note.id}/`, SITE.url).href;
    return `<item><title>${xml(note.data.title)}</title><link>${xml(link)}</link><guid>${xml(link)}</guid><pubDate>${note.data.date.toUTCString()}</pubDate><description>${xml(note.data.description)}</description></item>`;
  }).join('');
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${xml(SITE.title)}</title><link>${xml(SITE.url)}</link><description>${xml(SITE.description)}</description><language>zh-CN</language>${items}</channel></rss>`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
