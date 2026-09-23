// 「小聪」月度访客对话报告 —— 阿里云 FC 定时函数（custom runtime：所有触发器都以 HTTP POST 送达）
// 每月 15 号 09:00（北京时间，cron UTC 01:00）统计上个月的问答记录：
//   1. 从 OSS 拉取 qa/YYYY-MM/** 全部对话 JSON
//   2. 聚合统计 + 渲染 HTML 报表
//   3. 存一份到 OSS digest/YYYY-MM.html 备份
//   4. 配了 SMTP_USER/SMTP_PASS（QQ 邮箱授权码）就发邮件，否则只写 OSS
// 零依赖：只用 Node 内置模块。
//
// 手动测试：aliyun fc POST /2023-03-30/functions/xiaocong-monthly/invocations --body '{"month":"2026-09"}'

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const tls = require('tls');

/* ================= OSS（签名 V1，纯 REST） ================= */
const OSS_ID = process.env.OSS_AK_ID || '';
const OSS_KEY = process.env.OSS_AK_SECRET || '';
const OSS_BUCKET = process.env.OSS_BUCKET || 'xiaocong-log';
const OSS_HOST = process.env.OSS_ENDPOINT || 'oss-cn-hangzhou.aliyuncs.com';

function bjNow() { return new Date(Date.now() + 8 * 3600e3); }

function ossSign(method, resource, contentType, md5) {
  const date = new Date().toUTCString();
  const strToSign = [method, md5 || '', contentType || '', date, resource].join('\n');
  const sig = crypto.createHmac('sha1', OSS_KEY).update(strToSign).digest('base64');
  return { date, auth: `OSS ${OSS_ID}:${sig}` };
}

function ossRequest(method, object, subresources) {
  return new Promise((resolve, reject) => {
    let qs = '';
    let resource = `/${OSS_BUCKET}${object}`;
    if (subresources) {
      const sorted = Object.keys(subresources).sort().map((k) => `${k}=${subresources[k]}`).join('&');
      qs = '?' + sorted;
      resource += '?' + sorted;
    }
    const { date, auth } = ossSign(method, resource);
    const req = https.request({
      host: `${OSS_BUCKET}.${OSS_HOST}`, path: object + qs, method,
      headers: { Date: date, Authorization: auth },
      timeout: 15000,
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function ossGetJson(key) {
  const r = await ossRequest('GET', '/' + key);
  if (r.status !== 200) return null;
  try { return JSON.parse(r.body.toString('utf8')); } catch (e) { return null; }
}

async function ossList(prefix) {
  const keys = [];
  let marker = '';
  for (let page = 0; page < 30; page++) { // 最多 3000 条
    const params = { prefix, 'max-keys': 100 };
    if (marker) params.marker = marker;
    const r = await ossRequest('GET', '/', params);
    if (r.status !== 200) break;
    const xml = r.body.toString('utf8');
    for (const m of xml.matchAll(/<Key>([^<]+)<\/Key>/g)) keys.push(m[1]);
    const trunc = /<IsTruncated>true<\/IsTruncated>/.test(xml);
    const nm = xml.match(/<NextMarker>([^<]+)<\/NextMarker>/);
    if (!trunc || !nm) break;
    marker = nm[1];
  }
  return keys;
}

async function ossPut(object, body) {
  const md5 = crypto.createHash('md5').update(body).digest('base64');
  const date = new Date().toUTCString();
  const strToSign = ['PUT', md5, 'application/octet-stream', date, `/${OSS_BUCKET}${object}`].join('\n');
  const sig = crypto.createHmac('sha1', OSS_KEY).update(strToSign).digest('base64');
  return new Promise((resolve) => {
    const req = https.request({
      host: `${OSS_BUCKET}.${OSS_HOST}`, path: object, method: 'PUT', timeout: 15000,
      headers: {
        Date: date, Authorization: `OSS ${OSS_ID}:${sig}`,
        'Content-Type': 'application/octet-stream', 'Content-MD5': md5,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => { res.resume(); res.on('end', () => resolve(res.statusCode)); });
    req.on('error', () => resolve(0));
    req.write(body); req.end();
  });
}

/* ================= SMTP（最小客户端，QQ 邮箱 SSL 465） ================= */
function sendMail({ host, port, user, pass, to, subject, html }) {
  return new Promise((resolve, reject) => {
    const b64 = (s) => Buffer.from(s, 'utf8').toString('base64');
    const body = [
      `From: =?UTF-8?B?${b64('小聪 · 站点助手')}?= <${user}>`,
      `To: <${to}>`,
      `Subject: =?UTF-8?B?${b64(subject)}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: base64',
      '',
      b64(html),
    ].map((l) => (l.startsWith('.') ? '.' + l : l)).join('\r\n');
    const message = body + '\r\n.\r\n'; // DATA 终止行不能点填充，必须单独追加

    const sock = tls.connect(port || 465, host, { servername: host, timeout: 30000 });
    let buf = '';
    let step = 0;
    let dead = false;
    const fail = (why) => { if (!dead) { dead = true; try { sock.end(); } catch (e) {} reject(new Error(why)); } };
    sock.on('timeout', () => fail('smtp timeout'));
    sock.on('error', (e) => fail('smtp ' + e.message));

    const cmds = [
      'EHLO zicongluo.cn',
      'AUTH LOGIN',
      b64(user),
      b64(pass),
      `MAIL FROM:<${user}>`,
      `RCPT TO:<${to}>`,
      'DATA',
    ];

    sock.on('secureConnect', () => {});
    sock.on('data', (d) => {
      buf += d.toString('utf8');
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx).replace(/\r$/, '');
        buf = buf.slice(idx + 1);
        if (/^\d{3}-/.test(line)) continue; // 多行回复的中间行
        const code = line.slice(0, 3);
        if (step < cmds.length) {
          if (step === 0 && code === '220') { sock.write(cmds[0] + '\r\n'); step++; continue; } // 问候语后直接发 EHLO
          if (code !== '250' && code !== '334' && code !== '235') return fail('smtp step' + step + ': ' + line);
          sock.write(cmds[step] + '\r\n');
          step++;
        } else if (step === cmds.length) {
          if (code !== '354') return fail('smtp no 354: ' + line);
          sock.write(message);
          step++;
        } else if (step === cmds.length + 1) {
          if (code !== '250') return fail('smtp send fail: ' + line);
          sock.write('QUIT\r\n');
          step++;
        } else {
          if (!dead) { dead = true; try { sock.end(); } catch (e) {} resolve(true); }
        }
      }
    });
  });
}

/* ================= 统计 + 报表 ================= */
function esc(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function monthShift(y, m, delta) { // m: 1-12
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 };
}

function renderHtml(records, year, month, capped) {
  const ok = records.filter((r) => r.ok);
  const days = {};
  const qCount = {};
  let totalMs = 0, msN = 0;
  for (const r of ok) {
    const day = (r.ts || '').slice(5, 10);
    if (day) days[day] = (days[day] || 0) + 1;
    const q = (r.q || '').trim();
    if (q) qCount[q] = (qCount[q] || 0) + 1;
    if (r.ms > 0) { totalMs += r.ms; msN++; }
  }
  const dayRows = Object.keys(days).sort().map((d) => ({ d, n: days[d] }));
  const top = Object.entries(qCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const avgMs = msN ? Math.round(totalMs / msN) : 0;
  const maxDay = dayRows.reduce((a, b) => (b.n > (a?.n || 0) ? b : a), null);

  const bar = (n, max) => {
    const w = max ? Math.max(4, Math.round((n / max) * 120)) : 4;
    return `<span style="display:inline-block;width:${w}px;height:10px;background:#eebe7a;border-radius:5px;vertical-align:middle"></span>`;
  };
  const maxN = Math.max(1, ...dayRows.map((r) => r.n));

  const qaList = ok.slice(0, 200).map((r) => `
    <div style="padding:10px 0;border-bottom:1px dashed #e5ddcf">
      <div style="font-size:12px;color:#9a8f80">${esc((r.ts || '').replace('T', ' ').slice(5, 16))}${r.ref ? ` · 来自 ${esc(r.ref.replace(/^https?:\/\//, '').slice(0, 40))}` : ''} · 耗时 ${r.ms > 0 ? Math.round(r.ms / 100) / 10 + 's' : '—'}</div>
      <div style="margin:4px 0"><b style="color:#2a160d">问：</b>${esc((r.q || '').slice(0, 300))}</div>
      <div style="color:#5a4a3a">${esc((r.a || '').slice(0, 300))}${(r.a || '').length > 300 ? '…' : ''}</div>
    </div>`).join('');

  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:16px;background:#f7f5fb;font-family:-apple-system,'PingFang SC','Hiragino Sans GB',sans-serif;color:#3a2f23">
<div style="max-width:640px;margin:0 auto;background:#fcfcf8;border:1px solid #e8e0d2;border-radius:16px;overflow:hidden">
  <div style="background:#2a160d;color:#fcfcf8;padding:20px 24px">
    <div style="font-size:12px;opacity:.7;letter-spacing:2px">XIAOCONG MONTHLY REPORT</div>
    <div style="font-size:22px;font-weight:700;margin-top:4px">小聪 · ${year} 年 ${month} 月访客对话报告</div>
  </div>
  <div style="padding:20px 24px">
    <div style="display:flex;flex-wrap:wrap;gap:10px">
      ${[['总对话', records.length], ['成功回复', ok.length], ['活跃天数', dayRows.length], ['平均耗时', avgMs ? (avgMs / 1000).toFixed(1) + 's' : '—']].map(([k, v]) => `
      <div style="flex:1;min-width:110px;background:#f3edff;border-radius:12px;padding:12px;text-align:center">
        <div style="font-size:24px;font-weight:700;color:#2a160d">${v}</div>
        <div style="font-size:12px;color:#8a7f70;margin-top:2px">${k}</div>
      </div>`).join('')}
    </div>

    ${dayRows.length ? `
    <h3 style="margin:22px 0 8px;font-size:15px;color:#2a160d">📈 每日分布 ${maxDay ? `（最忙是 ${maxDay.d}，${maxDay.n} 次）` : ''}</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      ${dayRows.map((r) => `<tr>
        <td style="padding:3px 8px 3px 0;color:#8a7f70;white-space:nowrap;width:50px">${r.d}</td>
        <td style="padding:3px 0">${bar(r.n, maxN)}</td>
        <td style="padding:3px 0 3px 8px;width:30px;text-align:right">${r.n}</td>
      </tr>`).join('')}
    </table>` : ''}

    ${top.length ? `
    <h3 style="margin:22px 0 8px;font-size:15px;color:#2a160d">🔥 热门问题 TOP ${top.length}</h3>
    <ol style="margin:0;padding-left:22px;font-size:13px;line-height:1.9">
      ${top.map(([q, n]) => `<li>${esc(q.slice(0, 60))}${q.length > 60 ? '…' : ''} <span style="color:#b09a7a">×${n}</span></li>`).join('')}
    </ol>` : ''}

    <h3 style="margin:22px 0 8px;font-size:15px;color:#2a160d">💬 全部问答（${ok.length}${capped ? '+' : ''} 条）</h3>
    <div style="font-size:13px;line-height:1.7">${qaList || '<p style="color:#9a8f80">这个月还没有访客来找小聪聊天。</p>'}</div>
    ${ok.length > 200 ? `<p style="font-size:12px;color:#9a8f80">仅展示前 200 条，完整记录在 OSS（${OSS_BUCKET}/qa/${year}-${String(month).padStart(2, '0')}/）。</p>` : ''}

    <p style="margin:24px 0 0;padding-top:14px;border-top:1px solid #ece4d6;font-size:12px;color:#b0a696">
      由小聪自动统计生成 · <a href="https://zicongluo.cn" style="color:#b0a696">zicongluo.cn</a><br>
      记录字段：时间 / 来源页面 / IP / 问答内容。如不想再收此邮件，去 FC 控制台删掉 xiaocong-monthly 的定时触发器即可。
    </p>
  </div>
</div>
</body></html>`;
}

/* ================= 入口：custom runtime 把定时事件以 HTTP POST 送达 ================= */
let running = false;

async function runDigest(bodyObj) {
  const now = bjNow();
  let target;
  if (bodyObj && /^\d{4}-\d{2}$/.test(bodyObj.month || '')) {
    const [y, m] = bodyObj.month.split('-').map(Number);
    target = { y, m };
  } else {
    target = monthShift(now.getUTCFullYear(), now.getUTCMonth() + 1, -1); // 默认上个月
  }
  const ym = `${target.y}-${String(target.m).padStart(2, '0')}`;
  console.log(`[monthly] 统计月份 ${ym}`);

  if (!OSS_ID || !OSS_KEY) {
    console.log('[monthly] 未配置 OSS，无法读取记录');
    return { month: ym, sent: false, reason: 'no-oss' };
  }

  const keys = await ossList(`qa/${ym}/`);
  console.log(`[monthly] 记录对象数 ${keys.length}`);
  const records = [];
  for (const k of keys) {
    const rec = await ossGetJson(k);
    if (rec) records.push(rec);
  }
  records.sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
  const html = renderHtml(records, target.y, target.m, keys.length > records.length);

  const digestKey = `/digest/${ym}.html`;
  const putStatus = await ossPut(digestKey, html);
  console.log(`[monthly] 报表已备份 oss://${OSS_BUCKET}${digestKey} status=${putStatus}`);

  const { SMTP_HOST, SMTP_USER, SMTP_PASS, MAIL_TO } = process.env;
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    const to = MAIL_TO || SMTP_USER;
    try {
      await sendMail({
        host: SMTP_HOST, port: Number(process.env.SMTP_PORT || 465),
        user: SMTP_USER, pass: SMTP_PASS, to,
        subject: `小聪月报 · ${target.y}年${target.m}月：${records.length} 次访客对话`,
        html,
      });
      console.log(`[monthly] 邮件已发送至 ${to}`);
      return { month: ym, total: records.length, sent: true };
    } catch (e) {
      console.log('[monthly] 邮件发送失败：', e.message);
      return { month: ym, total: records.length, sent: false, reason: e.message };
    }
  }
  console.log('[monthly] 未配置 SMTP，仅写 OSS 备份（填 SMTP_USER/SMTP_PASS 后自动发邮件）');
  return { month: ym, total: records.length, sent: false, reason: 'no-smtp' };
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, service: 'xiaocong-monthly', running }));
  }
  if (req.method !== 'POST') {
    res.writeHead(405); return res.end();
  }
  if (running) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: false, reason: 'already running' }));
  }
  running = true;
  let body = '';
  req.on('data', (c) => { body += c; if (body.length > 1e5) req.destroy(); });
  req.on('end', async () => {
    let obj = null;
    try { obj = JSON.parse(body); } catch (e) {}
    try {
      const result = await runDigest(obj);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, ...result }));
    } catch (e) {
      console.log('[monthly] fatal:', e.stack);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    } finally {
      running = false;
    }
  });
});

const PORT = Number(process.env.PORT || 9000);
server.listen(PORT, '0.0.0.0', () => console.log(`xiaocong-monthly listening on ${PORT}`));
