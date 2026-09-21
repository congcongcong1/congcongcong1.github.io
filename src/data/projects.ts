// 项目展示数据：把这里换成你自己的 GitHub 仓库
export interface Project {
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  license: string;
  url: string;
}

export const projects: Project[] = [
  {
    name: 'paper-lens',
    description: '论文检索、去重与摘要的自动化小工具。',
    language: 'Python',
    stars: 12,
    forks: 3,
    license: 'MIT',
    url: 'https://github.com/your-name/paper-lens',
  },
  {
    name: 'this-site',
    description: '当前个人站的源码，Astro 构建。',
    language: 'Astro',
    stars: 0,
    forks: 0,
    license: 'MIT',
    url: 'https://github.com/your-name/this-site',
  },
  {
    name: 'tiny-rag',
    description: '从零实现一个极简 RAG 检索链，用于理解向量召回。',
    language: 'TypeScript',
    stars: 5,
    forks: 1,
    license: 'Apache-2.0',
    url: 'https://github.com/your-name/tiny-rag',
  },
];
