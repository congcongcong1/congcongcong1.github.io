// OG 分享卡片：构建时把 SVG 设计稿栅格化成 1200×630 PNG。
// 社交平台（微信/Twitter/QQ）不认 SVG 的 og:image，必须出 PNG。
// 配色取自站点夜间模式：深暖墨夜空 + 奶油墨 + 琥珀标记。

export interface OgCard {
  kicker: string;   // 顶部小字分类，如 NOTE — 学习笔记
  title: string;    // 主标题（超长自动缩字号）
  sub?: string;     // 副标题（描述，截断到一行）
  foot?: string;    // 底部信息，如日期 / 站点名
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 确定性伪随机星点（同一卡片每次构建一致，避免 diff 抖动）
function stars(seed: number, count: number): string {
  let x = seed;
  const rnd = () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
  let out = '';
  for (let i = 0; i < count; i++) {
    const cx = rnd() * 1200;
    const cy = rnd() * 630;
    const r = 0.8 + rnd() * 1.6;
    const o = 0.25 + rnd() * 0.55;
    out += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(2)}" fill="#f2ead9" opacity="${o.toFixed(2)}"/>`;
    if (rnd() > 0.82) {
      // 少数星星带十字光芒
      const l = r * 4;
      out += `<path d="M ${(cx - l).toFixed(1)} ${cy.toFixed(1)} H ${(cx + l).toFixed(1)} M ${cx.toFixed(1)} ${(cy - l).toFixed(1)} V ${(cy + l).toFixed(1)}" stroke="#eebe7a" stroke-width="1" opacity="${(o * 0.8).toFixed(2)}"/>`;
    }
  }
  return out;
}

const seedOf = (s: string) => {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 2147483647;
  return h || 7;
};

const SERIF = `Georgia, 'Songti SC', 'Noto Serif CJK SC', 'Noto Serif SC', serif`;
const MONO = `ui-monospace, 'SF Mono', Menlo, Consolas, 'Noto Sans Mono CJK SC', monospace`;

export function ogCardSvg({ kicker, title, sub, foot }: OgCard): string {
  // 标题字号随长度收缩，最长两行；断行按「视觉宽度」贪心填充，
  // CJK 每字 1 单位、拉丁字符 0.55 单位，拉丁单词整体不拆散
  const tLen = title.length;
  const titleSize = tLen <= 12 ? 92 : tLen <= 18 ? 78 : tLen <= 28 ? 64 : 52;
  const units = (s: string) => {
    let u = 0;
    for (const ch of s) u += /[\u2E80-\u303F\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/.test(ch) ? 1 : 0.55;
    return u;
  };
  const tokens = title.match(/[a-zA-Z0-9]+(?:['-][a-zA-Z0-9]+)*|\s+|./gu) ?? [title];
  const maxUnits = 20 * (92 / titleSize) * 0.62;
  const lines: string[] = [''];
  for (const tok of tokens) {
    if (lines.length >= 2) { lines[1] += tok; continue; }
    const cur = lines[lines.length - 1];
    const joiner = tok.startsWith(' ') ? '' : ' ';
    const next = cur ? cur + joiner + tok.trimStart() : tok.trimStart();
    if (cur && units(next) > maxUnits) {
      lines.push(tok.trimStart());
    } else {
      lines[lines.length - 1] = next;
    }
  }
  lines[0] = lines[0].trim();
  if (lines[1] !== undefined) lines[1] = lines[1].trim();
  const shown = lines.join('');
  const ellipsis = shown.length < title.length ? '…' : '';
  const titleRows = lines
    .map((l, i) => {
      const last = i === lines.length - 1;
      return `<tspan x="90" dy="${i === 0 ? 0 : titleSize * 1.24}">${esc(l + (last ? ellipsis : ''))}</tspan>`;
    })
    .join('');
  const titleBlockH = lines.length * titleSize * 1.24;
  const subText = (sub || '').replace(/\s+/g, ' ').trim();
  const subRows = subText
    ? (() => {
        const per = 42;
        const rows: string[] = [];
        for (let i = 0; i < subText.length && rows.length < 2; i += per) {
          rows.push(subText.slice(i, i + per));
        }
        const joined = rows.join('');
        const tail = joined.length < subText.length ? '…' : '';
        return rows
          .map((l, i) => {
            const last = i === rows.length - 1;
            return `<tspan x="90" dy="${i === 0 ? 0 : 40}">${esc(l + (last ? tail : ''))}</tspan>`;
          })
          .join('');
      })()
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="85%" cy="12%" r="80%">
      <stop offset="0%" stop-color="#3d2a1c"/>
      <stop offset="55%" stop-color="#2a1c12"/>
      <stop offset="100%" stop-color="#241812"/>
    </radialGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f2ead9" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#f2ead9" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#glow)"/>
  ${stars(seedOf(title + kicker), 64)}
  <rect x="0" y="0" width="1200" height="180" fill="url(#fade)"/>
  <!-- 顶部品牌行 -->
  <text x="90" y="86" font-family="${MONO}" font-size="24" letter-spacing="6" fill="#eebe7a">KAISER · 个人网站</text>
  <text x="1110" y="86" text-anchor="end" font-family="${MONO}" font-size="22" fill="#f2ead9" opacity="0.55">${esc(kicker)}</text>
  <!-- 标题 -->
  <text x="90" y="${250 + titleSize * 0.35}" font-family="${SERIF}" font-size="${titleSize}" fill="#f2ead9">${titleRows}</text>
  <!-- 琥珀标记短线 -->
  <rect x="90" y="${250 + titleSize * 0.35 + titleBlockH - titleSize * 0.2}" width="120" height="6" rx="3" fill="#eebe7a" opacity="0.9"/>
  <!-- 副标题 -->
  ${subRows ? `<text x="90" y="${250 + titleSize * 0.35 + titleBlockH + 62}" font-family="${SERIF}" font-size="30" fill="#f2ead9" opacity="0.72">${subRows}</text>` : ''}
  <!-- 底部 -->
  <text x="90" y="566" font-family="${MONO}" font-size="22" fill="#f2ead9" opacity="0.6">zicongluo.cn</text>
  ${foot ? `<text x="1110" y="566" text-anchor="end" font-family="${MONO}" font-size="22" fill="#f2ead9" opacity="0.6">${esc(foot)}</text>` : ''}
</svg>`;
}
