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
  {
    slug: 'course-works',
    title: '课程作品',
    english: 'Course Works',
    description: '课程汇报、论文解读与项目答辩，保留最终展示版本。',
  },
  {
    slug: 'learning-resources',
    title: '学习资源',
    english: 'Learning Resources',
    description: '通识阅读、算法整理与可长期回查的学习工具。',
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
  'rl-quick-start.md': {
    title: 'A Quick Start to RL｜强化学习入门',
    description: '强化学习基本概念，以及 PPO、SAC、REINFORCE 的入门实践。',
    tags: ['强化学习', '入门', 'PPO'],
  },
  '1707.06347v2.pdf': {
    title: 'Proximal Policy Optimization Algorithms',
    description: 'Schulman 等，2017；PPO 原始论文，与《A Quick Start to RL》配套阅读。',
    tags: ['PPO', '强化学习', '原始论文'],
  },
  'graduation-defense.pdf': {
    title: '毕业论文答辩｜基于视频编码的协处理方案',
    kind: 'slides',
    description: '16 页毕业设计答辩课件：视频编码协处理、NVENC 与 RAPNet。',
    tags: ['毕业设计', 'NVENC', 'RAPNet'],
  },
  'olive-quantization-slides.pdf': {
    title: 'OliVe：离群值配对量化课堂汇报',
    kind: 'slides',
    description: '20 页并行计算课程汇报，梳理 OliVe 量化方法与硬件协同设计。',
    tags: ['OliVe', '量化', '并行计算'],
  },
  'olive-paper-review.pdf': {
    title: 'OliVe 离群值配对量化与并行硬件设计解读',
    format: '报告',
    action: '阅读报告',
    description: 'OliVe 论文中文解读：离群值配对量化、并行架构与实验结果。',
    tags: ['OliVe', '论文解读', '量化'],
  },
  'proxunroll-course-slides.pdf': {
    title: '单像素成像｜ProxUnroll 中文课堂汇报',
    kind: 'slides',
    description: '31 页图解课堂汇报，从压缩感知讲到近端展开重建网络。',
    tags: ['ProxUnroll', '单像素成像', '课堂汇报'],
  },
  'proxunroll-technical-report.pdf': {
    title: 'Single-Pixel Reconstruction: Controlled HQS Fine-Tuning and Training Ablations',
    format: '报告',
    action: '阅读报告',
    description: '受控 HQS 微调、训练消融与可复现实验技术报告。',
    tags: ['ProxUnroll', '技术报告', '消融实验'],
  },
  'proxunroll-literature-review.pdf': {
    title: 'Single-Pixel Imaging: A Comparative Reading',
    format: '报告',
    action: '阅读报告',
    description: '单像素成像中压缩采样与近端展开方法的对比阅读。',
    tags: ['单像素成像', '文献综述', '近端展开'],
  },
  'motion-hdr-course-defense.pdf': {
    title: '运动 HDR｜AFUNet 与 LuckyHDR 课程答辩',
    kind: 'slides',
    description: '41 页计算摄像学小组项目答辩：运动 HDR、AFUNet 与 LuckyHDR。',
    tags: ['运动 HDR', 'AFUNet', 'LuckyHDR'],
  },
  'motion-hdr-project-summary.pdf': {
    title: '运动 HDR 项目说明',
    format: '报告',
    action: '阅读报告',
    description: '计算摄像学运动 HDR 项目说明与实现概要。',
    tags: ['运动 HDR', '计算摄像学', '项目说明'],
  },
  'HowToLiveBetter.pdf': {
    title: 'HowToLiveBetter',
    kind: 'note',
    description: '开源生活工具书，33 节、344 页，按真实生活场景提供可检索的行动清单。',
    tags: ['生活工具书', '通识阅读', '行动清单'],
  },
  'leetcode-hot100.pdf': {
    title: '力扣 Hot 100 总结',
    kind: 'note',
    description: '力扣 Hot 100 高频算法题的分类整理与解题总结。',
    tags: ['算法', 'LeetCode', '题解'],
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
    const override = overrides[fileName] || {};
    const kind = override.kind || kindByExtension[extension] || 'other';
    const format = override.format || formatByKind[kind];
    const id = `${collection.slug}-${String(index + 1).padStart(3, '0')}`;
    const relativePath = relative(sourceRoot, path).split('/').map(encodeURIComponent).join('/');
    const url = `/library/files/${relativePath}`;
    const readerUrl = extension === '.md' ? `/library/${id}/` : undefined;
    const bytes = statSync(path).size;
    const pdfAction = kind === 'slides' ? '打开课件' : kind === 'note' ? '阅读笔记' : '打开论文';
    documents.push({
      id,
      collection: collection.slug,
      collectionTitle: collection.title,
      title: override.title || cleanTitle(fileName),
      fileName,
      extension: extension.slice(1).toUpperCase() || 'FILE',
      kind,
      format,
      description: override.description || `${collection.title} · ${format}资料`,
      tags: override.tags || [collection.title, format],
      bytes,
      size: formatSize(bytes),
      url,
      readerUrl,
      action: override.action || (extension === '.md' ? '站内阅读' : extension === '.pdf' ? pdfAction : '查看文件'),
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
