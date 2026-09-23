# 「小聪」对话代理（Kimi API 密钥的保险柜）

网站是 GitHub Pages 纯静态托管，**API 密钥绝对不能出现在仓库里**——任何人打开 DevTools 就能扒走你的 key 拿去反代刷额度。
所以架构是：前端 → 本 Worker（密钥只存在它的环境变量里）→ Kimi API。

## 当前部署状态（2026-09-23）

- 已部署：`https://xiaocong-chat.zicongluo45.workers.dev`（Cloudflare 账号 zicongluo45@gmail.com）
- 密钥：`wrangler secret put KIMI_API_KEY`（Kimi Code 订阅 key，sk-kimi- 前缀）
- 模型：`kimi-k2.8-preview`（用户指定），`max_tokens` 8192
- **已知问题：workers.dev 在大陆被 DNS 污染，大陆访客连不上**（前端会自动降级到本地人格）。
  后续可能迁到阿里云函数计算等国内服务，届时只换 `aiEndpoint`，前端无需改。

## Kimi Code key 的调用要点（踩坑记录）

| 项 | 值 |
|---|---|
| 端点 | `https://api.kimi.com/coding/v1/chat/completions`（**不是** api.moonshot.cn，会 401） |
| 模型 | `kimi-k2.8-preview` |
| temperature | **只能为 1**，其他值报 400 |
| 识图 | **只认 base64 dataURL**（`data:image/png;base64,...`），不支持 http 图片链接 |
| 流式 | 标准 SSE；思考模型的 `reasoning_content` 也会出现在流里，客户端只取 `delta.content` 即可 |

## 密钥为什么不泄露

| 防护层 | 说明 |
|---|---|
| Secret 存储 | `KIMI_API_KEY` 用 `wrangler secret put` 写入，只存在于 Cloudflare 服务端，git、前端、构建产物里都没有 |
| Origin 白名单 | 只响应 `zicongluo.cn` 和本地 dev 的跨站请求，别人站点引你的 Worker 会被 403 |
| 每 IP 限流 | 默认 12 次/分钟/IP，超限 429（`RATE_LIMIT_PER_MIN` 可调） |
| 入参清洗 | 最多带 12 条历史、单条文本 ≤2000 字、图片只放行 http(s) 或 image base64 dataURL 且 ≤4 张、前端塞的 `system` 消息全部丢弃 |
| 输出封顶 | `max_tokens` 默认 8192（`MAX_TOKENS` 可调） |
| 系统提示词 | 只在 Worker 服务端拼接，前端拿不到、改不了 |

> 想更严可以加 Cloudflare Turnstile（人机验证），小网站一般用不上。

## 常用命令

```bash
cd worker
npx wrangler deploy                     # 部署（改完代码后）
printf 'key' | npx wrangler secret put KIMI_API_KEY   # 换密钥
npx wrangler dev --port 8787            # 本地联调（密钥读 .dev.vars）
```

## 注意

- **本项目的 wrangler 配置是 `wrangler.jsonc` 不是 toml**：wrangler 4.136.3 在 Node 24 下解析 TOML 必报错，JSONC 正常。
- `.dev.vars`（本地密钥）已 gitignore，永远不要往里放真 key 再提交。
- Worker 免费档每天 10 万次请求，个人网站聊天绰绰有余；Kimi Code 侧按会员订阅的频控走。
- 本地联调：把 `site.config.ts` 的 `aiEndpoint` 临时指到 `http://localhost:8787`（白名单已含 localhost:7100），测完改回线上地址。

