import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import sharp from 'sharp';
import { projects } from '../../data/projects';
import { ogCardSvg } from '../../lib/og-card';

// 构建时为每篇笔记 / 拾光条目 / 项目生成 1200×630 的分享卡片 PNG。
// 路由：/og/default.png、/og/note-<id>.png、/og/shelf-<id>.png、/og/project-<slug>.png

const KIND_LABEL: Record<string, string> = {
  '韩剧': '韩剧', '电影': '电影', '书': '书', '音乐': '音乐', '游戏': '游戏', '旅行': '旅行',
};

const fmtDate = (d: Date) => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;

export const GET: APIRoute = async ({ props }) => {
  const { svg } = props as { svg: string };
  const png = await sharp(Buffer.from(svg), { density: 96 }).png({ compressionLevel: 9 }).toBuffer();
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};

export const getStaticPaths = (async () => {
  const notes = await getCollection('notes', ({ data }) => !data.draft);
  const shelf = await getCollection('shelf');

  const paths = [
    {
      params: { key: 'default' },
      props: {
        svg: ogCardSvg({
          kicker: 'PERSONAL SITE',
          title: '学点新东西，写点笔记',
          sub: '也捣鼓点小项目 —— 懒大王的个人角落',
          foot: 'EST. 2026',
        }),
      },
    },
    ...notes.map((n) => ({
      params: { key: `note-${n.id}` },
      props: {
        svg: ogCardSvg({
          kicker: 'NOTE — 笔记',
          title: n.data.title,
          sub: n.data.description,
          foot: fmtDate(n.data.date),
        }),
      },
    })),
    ...shelf.map((e) => ({
      params: { key: `shelf-${e.id}` },
      props: {
        svg: ogCardSvg({
          kicker: `拾光 — ${KIND_LABEL[e.data.kind] ?? e.data.kind}`,
          title: e.data.alt && e.data.kind === '旅行' ? `${e.data.title} · ${e.data.alt}` : e.data.title,
          sub: e.data.quotes[0] ?? '',
          foot: e.data.rating > 0 ? `${e.data.rating}/10 · ${fmtDate(e.data.date)}` : fmtDate(e.data.date),
        }),
      },
    })),
    ...projects.map((p) => ({
      params: { key: `project-${p.slug}` },
      props: {
        svg: ogCardSvg({
          kicker: 'PROJECT — 项目',
          title: p.name,
          sub: p.description,
          foot: `updated ${p.updated}`,
        }),
      },
    })),
  ];
  return paths;
}) satisfies GetStaticPaths;
