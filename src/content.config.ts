import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().default(''),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

/* 精神食粮影音架：剧 / 电影 / 书 / 音乐 / 游戏，正文即碎碎念 */
const shelf = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/shelf' }),
  schema: z.object({
    title: z.string(),
    alt: z.string().default(''),          // 又名 / 原名
    kind: z.enum(['韩剧', '美剧', '电影', '书', '音乐', '游戏', '旅行']),
    status: z.enum(['在看', '看过', '想看', '想读', '读过', '在听', '想玩', '在玩', '玩过', '想去', '去过']),
    link: z.string().default(''),         // seeduck / 豆瓣等外链
    seeduck: z.string().default(''),      // seeduck 资源页（电影等）
    quotes: z.array(z.string()).default([]), // 金句摘抄（详情页完整展示）
    excerptQuotes: z.array(z.string()).default([]), // 列表页精选金句；为空时使用 quotes
    rating: z.number().min(0).max(10).default(0),
    hours: z.number().min(0).default(0),     // 游戏时长（小时）
    date: z.coerce.date(),
    images: z.array(z.string()).default([]),
  }),
});

/* 资料库 Markdown 正文：文件与索引由 scripts/build-library.mjs 同步 */
const library = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/library' }),
});

export const collections = { notes, shelf, library };
