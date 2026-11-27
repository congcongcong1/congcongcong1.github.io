# NVC / 码率控制方向论文写作上手指南

> 面向方向：神经视频压缩（NVC/LVC）及其码率控制（Rate Control）。
> 本指南结合你文件夹里 11 篇范文（DVC、DCVC-RT、Neural Rate Control (ICLR'24)、Reinforced RC (AAAI'26)、PID 反馈码控、UI2C (CVPR'26)、GLVC 等）的实际写法总结，配套文件：`论文分析汇总.md`、`plot_rd_curve_template.py`。

---

## 0. 你手里这些论文的"定位图"

先建立坐标系，知道每篇论文在领域里的位置，后面所有建议都能对号入座：

| 论文 | Venue | 角色 |
|---|---|---|
| DVC (1812.00101) | CVPR 2019（PDF 未注明，公开记录） | 开山之作，端到端视频压缩框架 |
| MAE 可变码率 (1912.05526) | JSTSP 2021（未确认） | 单模型可变码率（图像） |
| Neural Rate Control (2596) | **ICLR 2024** | 码控范文：率分配网络 + 率实现网络 |
| Reinforced RC (2601.19293) | **AAAI 2026** | 码控范文：RL/CMDP 序贯决策 |
| Feedback-Driven RC (2604.20104) | arXiv（ACM 模板） | 码控范文：经典 PI/PID 控制 + GRU |
| DCVC-RT | CVPR 2025（用户笔记，PDF 未注明） | 实时 NVC 范文：Module-Bank 码控 |
| UI2C (Ne8OLj) | **CVPR 2026** | 实时 NVC 范文：统一 I/P 帧 |
| GLVC (2510.09987) | Preprint | 生成式/感知方向 |
| LVC 综述 (2504.21445) | arXiv 综述 | 写 Related Work 的地图 |
| PID 质量控制 (1710.09980) | arXiv，传统 HEVC | 经典码控思想源头之一 |

**关键观察**：码控论文的方法章高度同构——"**码率分配（序列→miniGoP→帧 多级）+ 码率→编码参数映射（R→λ/QP）**"两段式。写论文前先理解这个骨架。

---

## 1. 工具链：LaTeX 怎么搭

### 1.1 用什么写

- **Overleaf**（推荐起步）：浏览器在线 LaTeX，免装环境，内置各会议官方模板，支持多人协作和批注。导师改稿、合著者并行都靠它。
- **本地**：TeX Live（MacTeX）+ VS Code（LaTeX Workshop 插件）或 TeXShop。适合大项目、配合 Git 管理版本。
- 建议：Overleaf 项目 + Git 同步（Overleaf 支持 git pull/push），两不误。

### 1.2 模板从哪拿（千万不要自己排版）

每个 venue 都有官方 author kit，**用错模板 / 超页是 desk reject 的常见原因**：

| Venue | 模板 | 页数（正文，不含参考文献） |
|---|---|---|
| CVPR / ICCV / WACV | `cvpr.sty`（IEEE 双栏，CVF 版） | 通常 8 页 + 不限参考文献 + 补充材料 |
| ECCV | Springer LNCS（`llncs.cls`） | 14 页含参考文献 |
| NeurIPS / ICLR / ICML | 各自官方 style（`neurips_2025.sty` / `iclr2025` / `icml2025`） | 9–10 页 |
| AAAI | `aaai` 双栏 | 7 页 + 2 页参考文献 |
| ACM MM | `acmart`（`sigconf` 选项） | 8 页 + 2 页参考文献 |
| DCC / ICIP / ICME / VCIP | IEEE 会议双栏 | 4–6 页（短文会议） |
| IEEE 期刊（TIP/TCSVT/TMM） | `IEEEtran`（transaction 选项） | 一般 10–14 页，超页收费 |

模板一律从**官网 Call for Papers / Author Kit 页面**或 Overleaf 模板库下载，不要用往届论文里扒出来的旧版（格式每年微调）。

### 1.3 最小骨架示例（CVPR 风格）

```latex
\documentclass[10pt,twocolumn,letterpaper]{article}
\usepackage[review]{cvpr}        % 投稿用 review（带行号），camera-ready 换 \usepackage{cvpr}
\usepackage{times,graphicx,amsmath,amssymb,booktabs,multirow}
\usepackage[pagebackref]{hyperref}

\def\cvprPaperID{0000}
\title{Your Title: Concise and Informative}
\author{Anonymous CVPR submission}

\begin{document}
\maketitle
\begin{abstract} 150 词左右，背景一句 + 问题一句 + 方法两句 + 结果一句（带数字）\end{abstract}

\section{Introduction}
\section{Related Work}
\section{Method}          % 或 Approach / Proposed Method
\subsection{Overview}
\subsection{Rate Allocation Network}
\subsection{Rate Implementation Network}
\section{Experiments}
\subsection{Experimental Setup}
\subsection{Comparison with State of the Art}
\subsection{Ablation Study}
\section{Conclusion}

{\small\bibliographystyle{ieeenat_fullname}\bibliography{ref}}
\end{document}
```

### 1.4 参考文献管理

- 用 `.bib` 文件；条目从 **DBLP**（dblp.org，最规范）或 Google Scholar 导出 BibTeX。
- 视频压缩论文的作者名、会议名缩写多，DBLP 能避免 90% 的格式错误。
- 命名习惯：`lu2019dvc`、`li2024neural`，全文统一风格。

---

## 2. 论文板块结构与每节写法

### 2.1 标准五段式（你的范文全部符合）

```
Abstract → 1. Introduction → 2. Related Work → 3. Method → 4. Experiments → 5. Conclusion (+ Appendix / Supplementary)
```

**Abstract**（150–250 词）：背景 1 句 → 痛点 1–2 句 → 方法 2–3 句 → 数字结果 1–2 句。
> 例（Neural Rate Control, ICLR'24 的套路）："Rate control is critical for practical video compression. However, existing NVCs lack effective rate control. We propose a neural rate control scheme consisting of a rate allocation network and a rate implementation network... achieves average rate error of only 2.03%..."

**Introduction**（1–1.5 页）四段式：
1. 大背景（视频流量占比、压缩的重要性）；
2. 具体问题与你的切入点（NVC 已强，但**码率控制缺失/不准**阻碍实际部署）；
3. 现有方法为什么不行（传统 R-λ 模型误差大 7.7–8.4%；逐 λ 训多模型成本高）——**这里必须引数字**；
4. 本文方法概述 + **贡献列表**（3–4 条 bullet，每条一句话，最后一条通常是"SOTA 数字"）。

**Related Work**（0.5–1 页）：通常 2–3 小节。
- 2.1 Learned Video/Image Compression（追溯 DVC → FVC → DCVC 系列 → DCVC-DC/FM/RT，承认 backbone 已成熟）；
- 2.2 Rate Control（**单独成节**，追溯传统编解码器的 R-Q → R-ρ → R-λ 模型，再讲 NVC 上的可变码率与码控工作，指出空白）；
- 技巧：用 LVC 综述（2504.21445）的第 3.3/3.4 节当地图，但引原文不引综述。

**Method**（2–3 页）：先总后分。
- 3.1 Overview / Framework：一段话 + 一张总览图（Fig.1），给出问题形式化（目标：min ΣD s.t. ΣR ≤ R_budget）；
- 3.2+ 各模块一节：**符号先定义、公式编号连续、每个模块说清输入/输出/损失函数**；
- 码控论文惯例两段式：分配（Budget/Allocation）+ 映射（R→λ 实现）；
- 训练策略单独一小节（数据集、loss、λ 采样范围、学习率、GPU）。

**Experiments**（2–3 页，决定生死的一章）：
- Setup：数据集、测试条件、实现细节、anchor 配置（见第 4 节 checklist）；
- Main results：大表 + RD 曲线，与 SOTA 比 BD-rate / ΔR；
- Ablation：每个创新点一组实验，**每个模块都要有"去掉它掉多少点"**；
- 可视化：逐帧 bpp 跟踪曲线、主观质量 crop 对比。

**Conclusion**：3–5 句，复述问题+方法+最强数字，可带一句 limitation/future work（审稿人喜欢诚实的 limitation）。

**Supplementary**：码控论文常放——更多序列的逐帧曲线、完整 RD 数据、anchor 详细配置、码率跟踪误差分布。正文放不下的实验全放这里，能挡审稿人的"请补充实验"。

### 2.2 投稿前自查

- [ ] 每张图/表都在正文被引用且就近放置
- [ ] 所有符号第一次出现有定义，全文一致（R、D、λ、QP 别混用）
- [ ] 数字全文一致（abstract 的 2.03% 和正文表格要一样）
- [ ] 匿名要求：review 版不出现作者/单位/致谢，引用自己工作用第三人称
- [ ] 页数、行号、字体合规（用官方模板的 preflight 检查）

---

## 3. 投哪里 + 截止时间哪里查

### 3.1 会议（按梯度）

| 档位 | 会议 | 常见截稿窗（每年微调，以官网为准） | 说明 |
|---|---|---|---|
| 顶会（CV） | **CVPR** | 11 月中 | NVC/码控最主要阵地（DVC、DCVC-RT、UI2C 都在这里） |
| 顶会（CV） | **ICCV** | 3 月（奇数年） | 同上 |
| 顶会（CV） | **ECCV** | 3 月（偶数年） | LNCS 模板 |
| 顶会（ML） | **NeurIPS / ICLR / ICML** | 5 月 / 9 月底 / 1 月底 | Neural Rate Control 即 ICLR'24；ML 会喜欢"方法新颖性+理论" |
| 顶会 | **AAAI** | 8 月（两阶段：摘要+全文） | Reinforced RC 即 AAAI'26 |
| 顶会 | **ACM MM** | 4 月 | 多媒体方向对口，GLVC 一类可投 |
| 压缩领域专会 | **DCC**（Data Compression Conference） | 11 月 | 压缩社区最纯正，4–6 页短文，业内认可度高 |
| 领域会 | **ICME / ICIP / VCIP / PCS** | 12 月 / 1–2 月 / 秋 / 秋 | 适中难度，练手+刷 track record 的好地方 |

### 3.2 期刊

| 期刊 | 特点 |
|---|---|
| **IEEE TCSVT**（Trans. on Circuits and Systems for Video Technology） | **本方向最对口**，DCVC 系列多篇在此；审稿相对快 |
| **IEEE TIP**（Trans. on Image Processing） | 档次更高，图像/视频压缩顶刊 |
| **IEEE TPAMI** | 最高难度，需要非常强的故事 |
| **IEEE TMM** | 多媒体综合期刊，适中 |
| **IEEE JSTSP** | 专刊制，MAE 可变码率那篇即在此 |
| **IEEE TBC**（Broadcasting）/ **SPL**（Signal Processing Letters，短文 4–5 页） | SPL 适合小创新快速发表 |
| Elsevier SPIC（Signal Processing: Image Communication） | 传统压缩社区期刊 |

期刊**没有统一截稿日**（常年收稿），但 JSTSP 等专刊有 deadline。期刊看重完整性和实验充分度，会议看重时效和新颖性。常见路线：**会议版 → 扩展 30%+ 新内容 → 期刊版**。

### 3.3 截止时间查询网站（收藏这 4 个）

1. **CCFDDL**（ccfddl.github.io）——中文界面，按 CCF 分级筛选，有倒计时，国内学生最常用；
2. **AI Conference Deadlines**（aideadlin.es）——英文，简洁，可订阅日历；
3. **PaperCopilot**（papercopilot.com）——除 deadline 外还有历年录取率、审稿时间统计，选会很有用；
4. **WikiCFP**（wikicfp.com）——覆盖面最广（含小会议、workshop、期刊专刊 CFP）。

习惯：**确定目标会后仍以官网 CFP 为准**（聚合站偶尔滞后），并注意摘要注册（abstract registration）往往比全文早一周，错过等于错过会议。

---

## 4. 数据集与测试条件（直接照抄行业惯例）

### 4.1 训练集

| 用途 | 数据集 | 备注 |
|---|---|---|
| Codec 主体 | **Vimeo-90k**（~91k 个 7 帧 clip） | 全领域默认；实时论文再做**长序列微调**（防误差累积） |
| 码控/分配网络 | **BVI-DVC**（800 序列×64 帧）或 Vimeo 混合 | 惯例：**冻结 codec backbone，单独训码控模块** |
| 更大规模 | Kinetics-400/700、YouTube-NT、自建过滤集 | 刷极限性能时用（GLVC 用 1M 自建集） |

### 4.2 测试集"三件套"（2021 年后标配）

- **HEVC Class B / C / D / E**（JCT-VC 标准序列：B=1080p 5 条、C=WVGA 4 条、D=WQVGA 4 条、E=720p 3 条）；
- **UVG**（7 条 1080p，高细节，几乎每篇必测）；
- **MCL-JCV**（30 条 1080p）；
- 图像压缩则用 Kodak（24 张）、CLIC、Tecnick。

### 4.3 测试条件 checklist（Setup 里必须写清，缺一条就可能被审稿人抓）

1. **帧数**：性能派写"前 96 帧"；实时派（DCVC-RT/UI2C）用**全部帧**；早期 DVC 用 100 帧；
2. **GOP / intra-period**：性能派 GOP=32 或 100（random access）；实时派 **intra-period=-1（全 P，只首帧 I）+ low-delay**；
3. **色域与格式**：YUV420（实时派）/ RGB / YUV444，以及 PSNR 在哪个域算（RGB-PSNR vs Y-PSNR 不可混比）；
4. **Anchor 配置**：写明 **HM-16.20 / VTM-17.0(或 23.0)** 版本号 + 用哪个 cfg（`encoder_randomaccess_main.cfg` / `encoder_lowdelay_P_main.cfg`）+ QPs；软件编码器写 preset（x265 `veryslow`、`--tune ssim` 等）；
5. **码率来源**：实际 BPP（熵编码后）还是估计熵——必须声明；
6. **硬件**：测速报 GPU 型号（A100 1080p xx fps）。

### 4.4 指标

- **重建质量**：PSNR（主）、MS-SSIM（辅）；感知方向用 LPIPS / DISTS / VMAF / user study；
- **RD 性能**：**BD-rate**（负值=节省，必写相对哪个 anchor），BJM 插值实现，社区有标准脚本；
- **码控专属**：
  - **码率精度 ΔR = |目标−实际|/目标**（平均水平：ICLR'24 约 2%、AAAI'26 约 1.2%、PI+GRU 约 2.1%；>8% 会被认为不准）；
  - **逐帧码率/质量跟踪曲线**（必画图，见下节）；
  - 公平对比惯例：以 baseline 4 个 λ 点的实际码率作为目标码率；
- **复杂度（实时论文）**：编码/解码 fps、kMACs/pixel、参数量。

### 4.5 码控论文的对比基线（约定俗成）

- 固定 λ 基线（无码控）；
- 经典 R-D 模型法：Li et al. 2022（双曲 R-λ 模型）；
- 神经码控：Zhang et al.（ICLR'24，即你文件夹里 2596 那篇）；
- 若 backbone 非原生可变码率，先说明改造方式（Lin et al. λ 调制 / STF 增益单元 / DCVC-RT 模块库），这本身是 Setup 的一部分。

---

## 5. 图片绘制（审稿人第一印象的来源）

### 5.1 三类图，三种工具

| 图类型 | 工具 | 规范 |
|---|---|---|
| **架构/框架图**（Fig.1 总览、模块图） | draw.io（免费）或 PowerPoint/Keynote → 导出 **PDF/SVG 矢量** | 色块区分"仅编码端/仅解码端/共有"（DVC Fig.2 的惯例）；配色 3–5 种，全文一致；箭头区分前向/梯度 |
| **数据图**（RD 曲线、逐帧跟踪、消融柱状图） | **Python matplotlib** → 保存 **PDF 矢量** | 见 5.2 规范与模板脚本 |
| **主观对比图**（crop patch） | 自写脚本裁块 + 拼接 | 标注 bpp/PSNR；加红框放大块； caption 写 "Zoom in for better view" |

**铁律**：一律矢量（PDF），禁止截图贴位图；图中字号 ≥ 正文小字号（编译后约 7–9pt），双栏图先按栏宽（~3.3 in）定 figsize 再画。

### 5.2 matplotlib 论文图规范（模板已生成）

配套脚本 `plot_rd_curve_template.py`（已在本目录，可直接运行）演示了全部惯例：

- **RD 曲线**：横轴 bpp、纵轴 PSNR (dB)；按数据集 **2×3 六宫格分面**（HEVC B/C/D/E + UVG + MCL-JCV）；每方法一个**固定颜色+marker**（VTM 黑方块、HM 灰三角、DCVC 系蓝系、Ours 红五角星/圆点）；Ours 线宽加粗置顶；
- **逐帧码率跟踪图**：横轴 frame index、纵轴 bpp（或 ΔR）；画一条**红色水平目标线**；标注场景切换点/refresh 点（UI2C Fig.1 的范式）；
- **字体**：Times/Times New Roman（与正文一致），`pdf.fonttype=42` 保证嵌入（IEEE eXpress 检查会查）；
- **网格**：浅灰虚线，alpha 低；图例放最空的面板；
- **保存**：`fig.savefig('x.pdf', bbox_inches='tight')`，LaTeX 里 `\includegraphics[width=\columnwidth]`。

运行方式（本机受管 Python 自带 matplotlib）：

```bash
cd /Users/kaisar/Resources/码率控制论文
python plot_rd_curve_template.py
# 输出：rd_curve_example.pdf / .png（六宫格 RD 曲线示例）
#      bitrate_tracking_example.pdf / .png（逐帧码率跟踪示例）
```

脚本里用的是**示意数据**，换成你实验的真实 (bpp, psnr) 数组即可直接用于论文。

### 5.3 表格规范

- 用 `booktabs`（`\toprule \midrule \bottomrule`），禁用竖线；
- **最优加粗、次优下划线**；BD-rate 表 anchor 为 0 并注明；
- 码控大表惯例：ΔR 与 BD-rate 成对列出（见 AAAI'26 Table 1）；
- "BD-rate + 速度 + 参数量"一体表（DCVC-RT/UI2C 的惯例）。

---

## 6. 从零到第一篇的路线图

**阶段 1：跑通代码（2–4 周）**
- 图像压缩入门：**CompressAI**（官方 PyTorch 库，含 Ballé 系列、cheng2020，文档好）；
- 视频压缩主线：**DCVC 官方仓库家族**（MSRA/USTC 开源：DCVC → DCVC-HEM/TCM/DC/FM → DCVC-RT），README 完善，先复现 DCVC-TCM 或 DCVC-RT 的 UVG 结果；
- 跑通：训练（或下载 checkpoint）→ 编码 UVG → 算 RD 曲线 → 和论文数字对上。

**阶段 2：选题切入（码控方向的三个低门槛入口）**
1. **单模型可变码率**：把固定 λ 的 backbone 改成 λ 条件调制（Lin et al.）/ QP 随机训练（DCVC-RT 模块库）——工程性强，是所有码控工作的地基；
2. **码率分配**：miniGoP 滑窗 + 学习式分配网络（ICLR'24 路线）或 RL 序贯决策（AAAI'26 路线）；
3. **码率映射/反馈**：R→λ 回归网络，或经典 PI/PID 闭环 + 学习校正（2604.20104 路线）——传统控制理论 × 学习的交叉点，故事好讲。
评估切入点：能否在 DCVC-RT 这类强 backbone 上做、算力是否够（冻结 backbone 只训小网络 ≈ 单卡可玩）。

**阶段 3：实验（4–8 周）**
- 按第 4 节 checklist 做全套实验；**每做一个模块就同步画好对应的图**（RD 曲线、跟踪曲线、消融表）；
- 保留所有 anchor 的原始输出日志（审稿可能要求补数据）。

**阶段 4：写作与投稿（3–4 周）**
- 先画"图+表"再写文字：Experiments 章的图表定了，Method 和 Intro 围绕它讲；
- 选会：按完成时间倒推（如 4 月做完 → AAAI(8月)/ACM MM(4月太紧) → CVPR(11月)）；
- 投稿前找导师/同学按"审稿人清单"过一遍：动机是否清楚、baseline 是否公平、消融是否完整、图是否清晰。

**持续习惯**
- 订阅 arXiv `eess.IV` 每日推送 + 关注 GitHub 仓库 `Awesome-Deep-Learning-Based-Video-Compression`（你那份 rate_control_survey 的数据来源）；
- 每读一篇论文就按你 `dcvc-rt论文阅读笔记.md` 的格式记笔记（问题→方法要点→测试条件→可借鉴点），写 Related Work 时直接翻笔记。

---

## 7. 常用资源速查

- 代码：CompressAI（github.com/InterDigitalInc/CompressAI）、DCVC 家族（github.com/microsoft/DCVC）、OpenDVC
- 标准测试序列：JCT-VC 序列库、UVG（ultravideo.fi）、MCL-JCV（mcl.korea.ac.kr）
- BD-rate 计算：BJM 插值脚本（社区标准实现，各 DCVC repo 附带）
- 传统编码器：HM（HEVC 参考软件）、VTM（VVC 参考软件）、x264/x265
- Deadline：CCFDDL / aideadlin.es / PaperCopilot / WikiCFP
- 文献：DBLP、Semantic Scholar、Google Scholar 提醒
- LaTeX：Overleaf 模板库、Tables Generator（表格生成器）、Mathpix（截图转公式）
