// @ts-check
import { defineConfig } from 'astro/config';
import rehypeSlug from 'rehype-slug';
import sitemap from '@astrojs/sitemap';

// 站点地址：绑定自定义域名后改这里（用于 sitemap 和 canonical 链接）
export default defineConfig({
  site: 'https://zicongluo.cn',
  integrations: [sitemap({
    // OG 分享卡片与搜索索引是资源端点，不是内容页，不进 sitemap
    filter: (page) => !page.includes('/og/') && !page.includes('/site-index.json'),
  })],
  markdown: {
    rehypePlugins: [rehypeSlug],
  },
});
