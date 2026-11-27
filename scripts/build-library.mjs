import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourceRoot = join(root, 'public/library/files');
const contentRoot = join(root, 'src/content/library');
const outputFile = join(root, 'src/data/library-files.json');

const collections = [
  {
    slug: 'rate-control',
    title: '码率控制',
    english: 'Rate Control',
    description: '学习式视频压缩、码率分配与反馈控制，配套阅读汇总和写作指南。',
  },
  {
    slug: 'video-post-training',
    title: '视频后训练',
    english: 'Video Post-training',
    description: '视频生成模型的后训练研究，从综述开始建立可追溯的阅读路径。',
  },
  {
    slug: 'reinforcement-learning',
    title: '强化学习',
    english: 'Reinforcement Learning',
    description: 'RAPNet-HEVC 项目说明、Actor-Critic 训练记录与实验排障笔记。',
  },
  {
    slug: 'edge-deployment',
    title: '端侧部署',
    english: 'Edge Deployment',
    description: '端侧模型部署项目的阶段进展、平台验证与实验记录。',
  },
];

const overrides = {
  'RK3588验证报告.pdf': {
    title: 'RK3588 验证报告',
    description: 'RK3588 端侧部署项目的阶段进展与验证记录，原文 PDF。',
    tags: ['RK3588', '端侧部署', '验证报告'],
  },
  'rate_control_survey.pdf': {
    title: '深度学习视频压缩中的码率控制方法综述',
    description: '中文调研报告：梳理学习式视频压缩中的码率控制技术路线。',
    tags: ['综述', 'NVC'],
  },
  'PID.pdf': {
    title: 'PID-based Quality Control Method',
    description: '以 PID 反馈调节 QP，让视频质量保持平稳。',
    tags: ['反馈控制', 'HEVC'],
  },
  'NEURAL RATE CONTROL.pdf': {
    title: 'Neural Rate Control for Learned Video Compression',
    description: 'ICLR 2024｜两级码率分配与内容自适应的码率实现网络。',
    tags: ['ICLR 2024', '神经码控'],
  },
  'Reinforced Rate Control.pdf': {
    title: 'Reinforced Rate Control for NVC',
    description: 'AAAI 2026｜基于帧间率失真感知的强化学习码率控制。',
    tags: ['AAAI 2026', '强化学习'],
  },
  'Feedback-Driven Rate Control.pdf': {
    title: 'Feedback-Driven Rate Control for Learned Video Compression',
    description: '对数域 PI 闭环与预算约束下的帧间比特分配。',
    tags: ['反馈控制', 'PI'],
  },
  'dcvc-rt.pdf': {
    title: 'DCVC-RT: Towards Practical Real-Time Neural Video Compression',
    description: '实时神经视频压缩与 Module-Bank 码率控制。',
    tags: ['实时编码', 'DCVC'],
  },
  'dcvc-rt论文阅读笔记.md': {
    description: 'DCVC-RT 论文阅读笔记，与原论文配合查阅。',
    tags: ['阅读笔记', 'DCVC'],
  },
  '论文分析汇总.md': {
    title: 'NVC / 码率控制论文分析汇总',
    description: '11 篇独立文献的训练集、评测协议、码控方法与图表风格对照。',
    tags: ['阅读笔记', '横向对比'],
  },
  'LVC_NVC码率控制论文写作入门指南.md': {
    description: '从问题建模到实验写作，整理码率控制论文的结构与常见规范。',
    tags: ['写作指南', 'LVC'],
  },
  'NVC码率控制论文写作上手指南.md': {
    description: 'NVC 码率控制研究的论文写作上手参考。',
    tags: ['写作指南', 'NVC'],
  },
  'Video_Generation_Post_Training_Survey.pdf': {
    title: 'Video Generation Post-Training Survey',
    description: '视频生成后训练研究综述，原文 PDF。',
    tags: ['综述', '视频生成'],
  },
  'README.md': {
    title: 'RAPNet-HEVC 项目说明',
    description: '基于 Actor-Critic 的视频编码预处理网络：架构、训练、实验与排障。',
    tags: ['RAPNet', 'Actor-Critic'],
  },
  'TensorBoard 指标监控指南 (Actor-Critic for Video Encoding).md': {
    description: '视频编码 Actor-Critic 训练的 TensorBoard 指标监控指南。',
    tags: ['TensorBoard', '实验监控'],
  },
};

const kindByExtension = {
  '.pdf': 'paper', '.md': 'note', '.ppt': 'slides', '.pptx': 'slides',
  '.py': 'code', '.png': 'image', '.jpg': 'image', '.jpeg': 'image', '.webp': 'image',
  '.json': 'data', '.csv': 'data', '.txt': 'note',
};
const formatByKind = {
  paper: '论文', note: '笔记', slides: '课件', code: '代码', image: '图像', data: '数据', other: '附件',
};
const kindRank = { paper: 0, note: 1, slides: 2, code: 3, image: 4, data: 5, other: 6 };

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

function cleanTitle(fileName) {
  return basename(fileName, extname(fileName)).replace(/_/g, ' ').trim();
}

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.') || entry.name.startsWith('Icon')) return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

mkdirSync(contentRoot, { recursive: true });
for (const oldFile of readdirSync(contentRoot)) {
  if (oldFile.endsWith('.md')) rmSync(join(contentRoot, oldFile));
}

const documents = [];
for (const collection of collections) {
  const directory = join(sourceRoot, collection.slug);
  const files = walk(directory).sort((a, b) => basename(a).localeCompare(basename(b), 'en'));
  files.forEach((path, index) => {
    const fileName = basename(path);
    const extension = extname(fileName).toLowerCase();
    const kind = kindByExtension[extension] || 'other';
    const id = `${collection.slug}-${String(index + 1).padStart(3, '0')}`;
    const override = overrides[fileName] || {};
    const relativePath = relative(sourceRoot, path).split('/').map(encodeURIComponent).join('/');
    const url = `/library/files/${relativePath}`;
    const readerUrl = extension === '.md' ? `/library/${id}/` : undefined;
    const bytes = statSync(path).size;
    documents.push({
      id,
      collection: collection.slug,
      collectionTitle: collection.title,
      title: override.title || cleanTitle(fileName),
      fileName,
      extension: extension.slice(1).toUpperCase() || 'FILE',
      kind,
      format: formatByKind[kind],
      description: override.description || `${collection.title} · ${formatByKind[kind]}资料`,
      tags: override.tags || [collection.title, formatByKind[kind]],
      bytes,
      size: formatSize(bytes),
      url,
      readerUrl,
      action: extension === '.md' ? '站内阅读' : extension === '.pdf' ? '打开论文' : '查看文件',
    });
    if (extension === '.md') cpSync(path, join(contentRoot, `${id}.md`));
  });
}

documents.sort((a, b) => {
  const collectionDelta = collections.findIndex((item) => item.slug === a.collection) - collections.findIndex((item) => item.slug === b.collection);
  return collectionDelta || kindRank[a.kind] - kindRank[b.kind] || a.title.localeCompare(b.title, 'zh-CN');
});

const payload = {
  generatedAt: new Date().toISOString(),
  collections: collections.map((collection) => ({
    ...collection,
    count: documents.filter((document) => document.collection === collection.slug).length,
  })),
  documents,
};
writeFileSync(outputFile, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`资料库索引已更新：${documents.length} 份资料，${documents.filter((document) => document.readerUrl).length} 篇站内笔记。`);
