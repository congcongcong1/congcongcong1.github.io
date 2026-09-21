// 项目展示数据：精选自 github.com/congcongcong1，按最近更新排序
// 想刷新数据时重新运行抓取脚本，或直接手动改这里
export interface Project {
  name: string;
  description: string;
  language: string;
  url: string;
  license: string | null;
  updated: string; // YYYY-MM
}

export const repoTotal = 12; // GitHub 上非 fork 仓库总数

export const projects: Project[] = [
  {
    name: 'congcongcong1.github.io',
    description: '当前这个个人站的源码，Astro 构建，GitHub Actions 自动部署。',
    language: 'Astro',
    url: 'https://github.com/congcongcong1/congcongcong1.github.io',
    license: null,
    updated: '2026-09',
  },
  {
    name: 'ProxUnroll-main',
    description: '近端展开（Proximal Unrolling）方法的课程实践，Python 实现。',
    language: 'Python',
    url: 'https://github.com/congcongcong1/ProxUnroll-main',
    license: 'Apache-2.0',
    updated: '2026-09',
  },
  {
    name: 'git-stats',
    description: '快速查看仓库统计信息的小工具。',
    language: 'Shell',
    url: 'https://github.com/congcongcong1/git-stats',
    license: null,
    updated: '2026-05',
  },
  {
    name: 'Graduation-thesis',
    description: '本科毕业论文的 LaTeX 源码。',
    language: 'TeX',
    url: 'https://github.com/congcongcong1/Graduation-thesis',
    license: 'LPPL-1.3c',
    updated: '2026-05',
  },
  {
    name: 'leetcode_exercise',
    description: 'LeetCode 刷题记录。',
    language: 'Python',
    url: 'https://github.com/congcongcong1/leetcode_exercise',
    license: null,
    updated: '2026-03',
  },
  {
    name: 'YQ_QT_MVS',
    description: '亚启科技 MVS 工业相机的 Qt 上位机项目。',
    language: 'C++',
    url: 'https://github.com/congcongcong1/YQ_QT_MVS',
    license: null,
    updated: '2026-01',
  },
];
