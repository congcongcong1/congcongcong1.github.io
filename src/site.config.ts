// 站点全局配置：改名字、邮箱、社交链接只动这一个文件
export const SITE = {
  name: 'kaiser',
  url: 'https://zicongluo.cn',
  title: 'kaiser · 个人网站',
  description: '学点新东西，写点笔记，也捣鼓点小项目。',
  email: 'zicongluo@smail.nju.edu.cn',
  github: 'https://github.com/congcongcong1',
  since: '2026',
  // 最近更新、笔记列表在首页展示的数量
  recentCount: 4,
  // 「小聪」AI 分身的对话代理地址（Cloudflare Worker，密钥只存在 Worker 环境变量里）。
  // 留空 = 本地离线人格模式（不联网也能聊）；接入 Kimi 后填 Worker 地址即可。
  aiEndpoint: 'https://xiaocong-chat.zicongluo45.workers.dev',
};
