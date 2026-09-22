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
    kind: z.enum(['韩剧', '电影', '书', '音乐', '游戏', '旅行']),
    status: z.enum(['在看', '看过', '想看', '想读', '读过', '在听', '想玩', '在玩', '玩过', '想去', '去过']),
    link: z.string().default(''),         // seeduck / 豆瓣等外链
    rating: z.number().min(0).max(10).default(0),
    date: z.coerce.date(),
    images: z.array(z.string()).default([]),
  }),
});

export const collections = { notes, shelf };
