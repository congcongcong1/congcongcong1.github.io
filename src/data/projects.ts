// 项目展示数据：精选自 github.com/congcongcong1，按最近更新排序
// 想刷新数据时重新运行抓取脚本，或直接手动改这里
export interface Project {
  slug: string;
  name: string;
  description: string;
  overview: string;
  topics: string[];
  highlights?: string[];
  doc?: { label: string; url: string }; // 主要解读说明文档
  language: string;
  url: string;
  license: string | null;
  updated: string; // YYYY-MM
}

export const repoTotal = 12; // GitHub 上非 fork 仓库总数

export const projects: Project[] = [
  {
    slug: 'personal-site',
    name: 'congcongcong1.github.io',
    description: '当前这个个人站的源码，Astro 构建，GitHub Actions 自动部署。',
    overview: '把学习笔记、开源项目和生活记录放在同一个可长期维护的网站中。页面由 Astro 静态生成，内容存放在 Markdown 集合中，并通过 GitHub Actions 发布。',
    topics: ['个人网站', '静态站点'],
    highlights: ['Astro 内容集合管理笔记与拾光条目', '响应式页面与 Three.js 点阵地球', '站内搜索、RSS 与小聪对话入口'],
    language: 'Astro',
    url: 'https://github.com/congcongcong1/congcongcong1.github.io',
    license: null,
    updated: '2026-09',
  },
  {
    slug: 'proxunroll',
    name: 'ProxUnroll-main',
    description: '近端展开（Proximal Unrolling）方法的课程实践，Python 实现。',
    overview: '围绕 Proximal Unrolling 方法组织的课程实践代码。实现与实验资料以仓库中的说明和代码为准。',
    topics: ['课程实践', '机器学习'],
    language: 'Python',
    url: 'https://github.com/congcongcong1/ProxUnroll-main',
    license: 'Apache-2.0',
    updated: '2026-09',
  },
  {
    slug: 'git-stats',
    name: 'git-stats',
    description: '快速查看仓库统计信息的小工具。',
    overview: '用于查看 Git 仓库统计信息的 Shell 工具。具体用法和输出示例可在源代码仓库查看。',
    topics: ['开发工具', 'Git'],
    language: 'Shell',
    url: 'https://github.com/congcongcong1/git-stats',
    license: null,
    updated: '2026-05',
  },
  {
    slug: 'graduation-thesis',
    name: 'Graduation-thesis',
    description: '本科毕业论文的 LaTeX 源码。',
    overview: '本科毕业论文的 LaTeX 源文件与相关写作材料。论文内容与编译方式以仓库为准。',
    topics: ['论文', 'LaTeX'],
    language: 'TeX',
    url: 'https://github.com/congcongcong1/Graduation-thesis',
    license: 'LPPL-1.3c',
    updated: '2026-05',
  },
  {
    slug: 'leetcode-exercise',
    name: 'leetcode_exercise',
    description: 'LeetCode 刷题记录。',
    overview: '按仓库记录的 LeetCode 题目练习与 Python 解法，可按 hot_100 目录查看高频题目的思路与代码。配套有一份《力扣 hot 100 总结》PDF，逐题梳理考点与解法，是这份仓库的主要解读说明。',
    topics: ['算法练习', 'Python'],
    doc: { label: '📕 力扣 hot 100 总结（主要解读说明）', url: '/projects-assets/leetcode-hot100.pdf' },
    language: 'Python',
    url: 'https://github.com/congcongcong1/leetcode_exercise',
    license: null,
    updated: '2026-09',
  },
  {
    slug: 'yq-qt-mvs',
    name: 'YQ_QT_MVS',
    description: '亚启科技 MVS 工业相机的 Qt 上位机项目。',
    overview: '面向 MVS 工业相机的 Qt 上位机项目。界面、相机连接和实现细节请以公开仓库中的代码为准。',
    topics: ['Qt', '工业相机'],
    language: 'C++',
    url: 'https://github.com/congcongcong1/YQ_QT_MVS',
    license: null,
    updated: '2026-01',
  },
];
