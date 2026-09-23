# 「小聪」对话代理（Kimi API 密钥的保险柜）

网站是 GitHub Pages 纯静态托管，**API 密钥绝对不能出现在仓库里**——任何人打开 DevTools 就能扒走你的 key 拿去反代刷额度。
所以架构是：前端 → 本 Worker（密钥只存在它的环境变量里）→ Kimi API。

## 密钥为什么不泄露

| 防护层 | 说明 |
|---|---|
| Secret 存储 | `KIMI_API_KEY` 用 `wrangler secret put` 写入，只存在于 Cloudflare 服务端，git、前端、构建产物里都没有 |
| Origin 白名单 | 只响应 `zicongluo.cn` 和本地 dev 的跨站请求，别人站点引你的 Worker 会被 403 |
| 每 IP 限流 | 默认 12 次/分钟/ IP，超限 429（`RATE_LIMIT_PER_MIN` 可调） |
| 入参清洗 | 最多带 12 条历史、单条文本 ≤2000 字、图片链接只放行 http(s) 且 ≤4 张、前端塞的 `system` 消息全部丢弃 |
| 输出封顶 | `max_tokens` 默认 4096（`MAX_TOKENS` 可调），多轮思考不被截断，成本仍可控 |
| 系统提示词 | 只在 Worker 服务端拼接，前端拿不到、改不了 |

> 想更严可以加 Cloudflare Turnstile（人机验证），小网站一般用不上。

## 部署步骤（拿到 Kimi API key 后）

```bash
cd worker
npm i -g wrangler        # 或 npx wrangler
wrangler login           # 登录 Cloudflare（没有账号先注册，免费档够用）

# 写入密钥（只会存在 Cloudflare，不会写进任何本地文件被 git 跟踪）
wrangler secret put KIMI_API_KEY
# 粘贴 key 回车

wrangler deploy          # 部署，输出 https://xiaocong-chat.<你的子域>.workers.dev
```

## 接通网站

把部署得到的 Worker 地址填进 `src/site.config.ts`：

```ts
aiEndpoint: 'https://xiaocong-chat.xxx.workers.dev',
```

填了就走 Kimi 真身（SSE 流式），留空则保持本地离线人格模式。

## 本地联调

```bash
cd worker
wrangler dev --port 8787
# 临时把 site.config.ts 的 aiEndpoint 指到 http://localhost:8787 即可
#（wrangler.toml 的 ALLOWED_ORIGINS 已带 localhost:7100）
```

## 注意

- `.dev.vars`（本地测试用的密钥文件）已被 `.gitignore` 忽略，永远不要往里放真 key 再提交。
- Worker 免费档每天 10 万次请求，个人网站聊天绰绰有余；Kimi 那边的 token 费用按你账号实际调用计。
- 换 key：`wrangler secret put KIMI_API_KEY` 覆盖即可，立刻生效。
