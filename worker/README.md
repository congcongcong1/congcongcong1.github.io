# 「小聪」对话代理（Kimi API 密钥的保险柜）

网站是 GitHub Pages 纯静态托管，**API 密钥绝对不能出现在仓库里**——任何人打开 DevTools 就能扒走你的 key 拿去反代刷额度。
所以架构是：前端 → 对话代理（密钥只存在服务端环境变量里）→ Kimi API。

## 当前部署状态（2026-09-23）

- 当前站点配置指向阿里云函数计算代理（`worker/fc/index.js`）；Cloudflare Worker（`worker/src/index.js`）保留为备用实现。
- 两个代理都从服务端环境变量读取 `KIMI_API_KEY`，不要把密钥写入仓库。
- 模型：`kimi-k2.8-preview`（用户指定），`max_tokens` 8192
- 前端请求失败时会降级为本地站内内容检索；备用 Worker 的地区可达性需要单独验证。

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
| Origin 白名单 | 仅接受允许的浏览器来源；无 Origin 请求也返回 403。Origin 可由非浏览器客户端伪造，不能当身份认证 |
| 限流 | 默认每 IP 12 次/分钟、每实例总计 60 次/分钟；两者均可用环境变量调整，超限 429。实例内存限流不能替代平台级配额或 WAF |
| 入参清洗 | 最多带 12 条历史、单条文本 ≤2000 字、图片只放行 http(s) 或 image base64 dataURL 且 ≤4 张、前端塞的 `system` 消息全部丢弃 |
| 输出封顶 | `max_tokens` 默认 8192（`MAX_TOKENS` 可调） |
| 系统提示词 | 只在 Worker 服务端拼接，前端拿不到、改不了 |

站点构建生成 `/site-index.json`，搜索页和小聪共享该索引。浏览器只发送最多三段相关摘录给代理，代理裁剪字段后交给模型；摘录属于客户端数据，不能当作服务端已验证的事实来源。回答中的“相关内容”链接由站点索引生成。文章页可限定当前文章提问；访客可在聊天面板清空本机保存的记录。阿里云代理若配置 OSS，还会记录问答、IP 和来源页；清空本机记录不会删除服务端日志。

对公开入口应另设平台级调用配额或 WAF 限流；当前实例内存限流无法保证跨实例总额度。

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
- 平台和上游模型的额度分别配置与监控，不能用 Worker 的请求上限推断模型调用额度。
- 本地联调：把 `site.config.ts` 的 `aiEndpoint` 临时指到 `http://localhost:8787`（白名单已含 localhost:7100），测完改回线上地址。
