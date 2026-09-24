import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../site.config';

const xml = (value: string) => value.replace(/[<>&"']/g, (char) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
})[char]!);

export const GET: APIRoute = async () => {
  const notes = (await getCollection('notes', ({ data }) => !data.draft))
    .map((note) => ({
      title: note.data.title,
      date: note.data.date,
      link: new URL(`/notes/${note.id}/`, SITE.url).href,
      desc: note.data.description,
      category: '笔记',
    }));
  const shelf = (await getCollection('shelf'))
    .map((entry) => ({
      title: `【拾光·${entry.data.kind}】${entry.data.title}`,
      date: entry.data.date,
      link: new URL(`/shelf/${entry.id}/`, SITE.url).href,
      // 拾光没有 description 字段：优先金句，其次正文前几行
      desc: entry.data.quotes.slice(0, 2).join(' / ') ||
        entry.body.replace(/[#>*`\-[\]()\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120),
      category: `拾光·${entry.data.kind}`,
    }));
  const items = [...notes, ...shelf]
    .sort((a, b) => b.date.valueOf() - a.date.valueOf())
    .slice(0, 40)
    .map((item) =>
      `<item><title>${xml(item.title)}</title><link>${xml(item.link)}</link><guid>${xml(item.link)}</guid><pubDate>${item.date.toUTCString()}</pubDate><category>${xml(item.category)}</category><description>${xml(item.desc)}</description></item>`
    ).join('');
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${xml(SITE.title)}</title><link>${xml(SITE.url)}</link><description>${xml(SITE.description)}</description><language>zh-CN</language>${items}</channel></rss>`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
