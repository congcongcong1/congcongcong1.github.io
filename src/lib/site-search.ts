import type { SiteEntry, SiteSection } from './site-index';

export interface SearchHit {
  entry: SiteEntry;
  section: SiteSection;
  score: number;
}

function termsFor(query: string): string[] {
  const normalized = query.toLowerCase();
  const terms = normalized.match(/[a-z0-9]+|[\p{Script=Han}]+/gu) || [];
  const expanded = terms.flatMap((term) => {
    if (!/[\p{Script=Han}]/u.test(term) || term.length <= 2) return [term];
    return Array.from({ length: term.length - 1 }, (_, i) => term.slice(i, i + 2));
  });
  if (/歌|音乐|听/.test(query)) expanded.push('音乐', '歌曲');
  if (/游戏|玩/.test(query)) expanded.push('游戏');
  if (/电影|看片/.test(query)) expanded.push('电影');
  if (/书|阅读/.test(query)) expanded.push('书');
  if (/强化学习|\brl\b/i.test(query)) expanded.push('强化学习', 'rl');
  return [...new Set(expanded.filter((term) => term.length > 1 && !['这个', '什么', '怎么', '推荐', '一下', '关于', '最近', '文章', '项目'].includes(term)))];
}

export function searchIndex(entries: SiteEntry[], query: string, limit = 8, scopeId?: string): SearchHit[] {
  const terms = termsFor(query);
  if (!terms.length && !scopeId) return [];
  const hits: SearchHit[] = [];
  for (const entry of entries) {
    if (scopeId && entry.id !== scopeId) continue;
    const title = entry.title.toLowerCase();
    const metadata = `${entry.description} ${entry.tags.join(' ')}`.toLowerCase();
    const sections = entry.sections.length ? entry.sections : [{ title: entry.title, url: entry.url, text: entry.description }];
    for (const section of sections) {
      const body = section.text.toLowerCase();
      const heading = section.title.toLowerCase();
      const score = terms.reduce((sum, term) => sum +
        (title.includes(term) ? 10 : 0) +
        (metadata.includes(term) ? 6 : 0) +
        (heading.includes(term) ? 4 : 0) +
        (body.includes(term) ? 1 : 0), 0);
      if (score > 0 || scopeId) hits.push({ entry, section, score });
    }
  }
  hits.sort((a, b) => b.score - a.score);
  const counts = new Map<string, number>();
  return hits.filter((hit) => {
    const count = counts.get(hit.entry.id) || 0;
    if (count >= (scopeId ? limit : 2)) return false;
    counts.set(hit.entry.id, count + 1);
    return true;
  }).slice(0, limit);
}
