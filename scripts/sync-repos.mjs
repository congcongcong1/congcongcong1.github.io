// 从 GitHub API 刷新仓库元数据（语言 / 许可证 / 最近更新时间 / 仓库总数），
// 写入 src/data/repo-meta.json，构建时由 projects.ts 合并。
// 手动资料（简介、亮点、解读文档）永远以 projects.ts 为准，脚本不碰。
// 用法：node scripts/sync-repos.mjs   （CI 里有 GITHUB_TOKEN；本地可不带，匿名限流 60 次/小时也够）

import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const USER = 'congcongcong1';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outPath = join(root, 'src/data/repo-meta.json');

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'zicongluo-site-repo-sync',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

const repoName = (url) => url.replace(/\/+$/, '').split('/').pop();

try {
  const res = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const all = await res.json();
  const repos = all.filter((r) => !r.fork);
  const byName = new Map(repos.map((r) => [r.name, r]));

  // 用 projects.ts 里的 url 字段匹配 slug，而不是按名字猜
  const src = readFileSync(join(root, 'src/data/projects.ts'), 'utf8');
  const slugs = [...src.matchAll(/slug: '([^']+)'[\s\S]*?url: 'https:\/\/github\.com\/[^']+'/g)]
    .map((m) => ({ slug: m[1], url: m[0].match(/url: '(https:\/\/github\.com\/[^']+)'/)?.[1] ?? '' }));

  const meta = { generatedAt: new Date().toISOString().slice(0, 10), repoTotal: repos.length, repos: {} };
  const unmatched = [];
  for (const { slug, url } of slugs) {
    const r = byName.get(repoName(url));
    if (!r) { unmatched.push(slug); continue; }
    meta.repos[slug] = {
      language: r.language ?? '—',
      license: r.license?.spdx_id && r.license.spdx_id !== 'NOASSERTION' ? r.license.spdx_id : null,
      updated: (r.pushed_at ?? r.updated_at).slice(0, 7),
    };
  }

  writeFileSync(outPath, JSON.stringify(meta, null, 2) + '\n');
  console.log(`repo-meta.json 已更新：${Object.keys(meta.repos).length} 个精选项目，GitHub 非 fork 仓库共 ${meta.repoTotal} 个`);
  const known = new Set(slugs.map((s) => repoName(s.url)));
  const fresh = repos.filter((r) => !known.has(r.name)).map((r) => r.name);
  if (fresh.length) console.log(`提示：GitHub 上还有 ${fresh.length} 个未精选的仓库：${fresh.join(', ')}`);
  if (unmatched.length) console.warn(`警告：这些 slug 没匹配到仓库（保留 projects.ts 手写值）：${unmatched.join(', ')}`);
} catch (err) {
  // 拉取失败（限流/断网）时保留旧文件，绝不让构建挂掉
  if (existsSync(outPath)) console.warn(`同步失败（${err.message}），沿用现有 repo-meta.json`);
  else { console.error(`同步失败（${err.message}）且没有旧文件可沿用`); process.exit(1); }
}
