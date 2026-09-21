# Kaisar · 个人网站

Astro 构建的静态个人站：主站导航 + Markdown 笔记区。

## 快速开始

```bash
npm install      # 安装依赖
npm run dev      # 本地开发，默认 http://localhost:7100
npm run build    # 构建到 dist/
```

## 日常写作

在 `src/content/notes/` 下新建一个 `.md` 文件：

```md
---
title: 笔记标题
date: 2026-09-21
description: 一句话简介（会显示在列表页）
tags: [标签]
---

正文用 Markdown 写。
```

保存即生效：首页「最近更新」、笔记列表页、文章页全部自动生成。
把 frontmatter 里加 `draft: true` 可隐藏未完成的笔记。

## 改成你自己的信息

只需改两个文件：

- `src/site.config.ts` —— 名字、邮箱、GitHub、首页展示条数
- `src/data/projects.ts` —— 首页「项目展示」的仓库列表

## 部署到 GitHub Pages（免费）

1. **推代码**:在 GitHub 新建一个公开仓库（如 `my-site`)，然后：

   ```bash
   git init && git add -A && git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/你的用户名/my-site.git
   git push -u origin main
   ```

2. **开 Actions 部署**：仓库 → `Settings` → `Pages` → `Source` 选 **GitHub Actions**。
   项目里已带 `.github/workflows/deploy.yml`，推送后自动构建并发布，
   几分钟后访问 `https://你的用户名.github.io/my-site/`。

3. **绑定自己的域名**（可选）：买一个域名（阿里云/腾讯云，约 ¥50/年），在 DNS 里加一条
   `CNAME` 记录指向 `你的用户名.github.io`，然后在仓库 `Settings` → `Pages`
   → `Custom domain` 填入你的域名并勾选 `Enforce HTTPS`。

## 上线前记得改

- `astro.config.mjs` 里的 `site` 改成你的真实域名（影响 sitemap/canonical)
- `public/favicon.svg` 可替换为自己的图标

## 路线图

- [ ] RSS 订阅（`@astrojs/rss`)
- [ ] sitemap(`@astrojs/sitemap`)
- [ ] 笔记标签页 / 分页
- [ ] Lab 分区
