# LVC/NVC 神经视频码率控制论文写作入门指南

> 适用方向：Learned/Neural Video Compression（LVC/NVC）、variable-rate coding、target-bitrate rate control、frame-level rate allocation、buffer-aware control、quality control。  
> 整理日期：2026-07-21。会议日期会变化，本文中的历史日期只用于理解投稿节奏，提交前必须以当届官网为准。

## 0. 先给结论：你该怎样开始

不要从“先写论文”开始，而要从“建立一个可复现、可比较的实验系统”开始。对这个方向，第一篇论文最稳妥的路线通常是：

1. 选一个开源 NVC backbone，例如 DCVC/DCVC-TCM/DCVC-RT，并完整复现它在 1–2 个公开测试集上的结果。
2. 固定 backbone，先做一个不改主编解码器的码率控制模块；这样训练成本低、因果关系清楚、消融也好做。
3. 明确你解决的是“可变码率”还是“目标码率控制”。只有覆盖多个质量点，不等于码率控制。
4. 在实际 bitstream 上测试目标码率误差，而不是只用熵模型估算的 rate。
5. 同时证明两件事：`码率确实准`，而且 `相同实际码率下画质更好`。
6. 实验稳定后再套目标会议/期刊的官方 LaTeX 模板写作。

一个合格的码率控制故事应能压缩为一句话：

> 现有方法在【具体场景】下因【明确机制】产生【可测量问题】；我们基于【核心洞察】设计【方法】，在【统一协议】下同时降低【码率误差】和【BD-rate/质量波动/控制开销】。

## 1. 先分清四个概念

### 1.1 Variable-rate coding

一个模型能通过 `QP`、质量索引、量化步长、缩放因子或拉格朗日乘子 `λ` 覆盖多个 RD 工作点。它回答：

> 给我一个编码参数，模型能否产生不同码率？

它不保证给定目标码率后一次就能命中。

### 1.2 Rate control

给定目标码率、目标 bpp 或总比特预算，控制器自动选择编码参数，使实际输出接近目标，并尽量提高画质。它回答：

> 给我目标码率，系统能否准确、低开销地达到它？

### 1.3 Rate allocation

把序列/GOP 的总预算分给各帧、各 latent、运动与残差分支或不同空间区域。它回答：

> 有限比特应该花在哪里？

### 1.4 Rate implementation

把某帧的目标比特映射为可执行的 `QP/λ/quality index/module-bank index`。它回答：

> 分到的预算怎样变成编码器参数？

论文里应明确自己覆盖了其中哪几层。把“遍历多个 λ 画 RD 曲线”称作 rate control，审稿人通常不会接受。

## 2. 这个目录里的论文应该怎样读

### 2.1 建议阅读顺序

| 顺序 | 论文 | 学习重点 |
|---|---|---|
| 1 | [DVC](./1812.00101v3.pdf) | 端到端 NVC 的基本率失真目标、运动/残差编码框架、Vimeo-90K 训练和经典测试协议 |
| 2 | [Variable Rate Deep Image Compression](./1912.05526v2.pdf) | 特征调制如何让单模型覆盖多个 RD 点；区分 variable rate 与 target-rate control |
| 3 | [Neural Rate Control for Learned Video Compression](./2596_Neural_Rate_Control_for_L.pdf) | 码率分配网络 + rate-parameter mapping 的完整论文结构；这是最适合模仿写法的一篇 |
| 4 | [DCVC-RT](./dcvc-rt.pdf) | 工程型论文如何同时讲压缩效率、速度、跨设备一致性与 module-bank rate control |
| 5 | [Reinforced Rate Control](./2601.19293v2.pdf) | 把帧级控制建模为序列决策；状态、动作、奖励、长时依赖及跨 backbone 验证 |
| 6 | [Feedback-Driven Rate Control](./2604.20104v1.pdf) | PI/PID 闭环反馈、预算约束与 GRU 调整器；学习如何写控制稳定性与在线误差修正 |
| 7 | [PID-based Quality Control](./zJoKGs-1710.09980v1.pdf) | 传统控制理论的建模方式；质量控制、误差和波动的定义 |
| 8 | [Learned Video Compression Survey](./2504.21445v1.pdf) | 建立 LVC 全景、找相关工作分组和实验基准 |
| 9 | [UIIC / CVPR 2026](./wtYXSX-Xiang_Real-Time_Neural_Video_Compression_with_Unified_Intra_and_Inter_Coding_CVPR_2026_paper.pdf) | 新 codec 架构论文的叙事、场景切换、逐帧码率/质量稳定性及实时性实验 |

[Neural Rate Control 的另一份 PDF](./yPUVIk-ICLR-2024-neural-rate-control-for-learned-video-compression-Paper-Conference.pdf)与表中 ICLR 论文内容相同；两份 UIIC 文件也是同一篇论文的不同副本，不必重复精读。

### 2.2 对现有材料的使用边界

[rate_control_survey.pdf](./rate_control_survey.pdf)页面中明确带有“Kimi.ai 生成”标记，可以把它当作找关键词和找论文的线索，但不要把它当作可引用的学术来源。任何数字、分类和结论都应回到原论文或标准文档核实。

### 2.3 每篇论文只做一张阅读卡

建议固定记录以下字段：

```text
论文：
任务定义：variable-rate / rate control / allocation / quality control
backbone 与是否冻结：
输入状态：
输出动作/参数：
控制粒度：sequence / GOP / frame / block / latent
是否因果、是否 one-pass：
训练集 / 验证集 / 测试集：
色彩空间、GOP、intra period、编码帧数：
指标：ΔR、BD-rate、PSNR、MS-SSIM、波动、速度
最强 baseline：
核心假设：
最可能失效的场景：
我能复现的最小实验：
```

这样读完 10 篇后，Related Work 和实验对比表的骨架已经基本形成。

## 3. 一篇此类论文通常分成哪些板块

不同 venue 的页数不同，但逻辑结构高度稳定。

### 3.1 Title

标题尽量包含“做什么 + 关键机制/优势”，不要堆形容词。例如：

```text
Feedback-Driven Rate Control for Learned Video Compression
Buffer-Aware One-Pass Rate Control for Neural Video Codecs
Cross-Codec Rate Control via Inter-Frame RD Modeling
```

### 3.2 Abstract：五句话结构

1. 背景与重要性：NVC 已有较强 RD 性能，但部署需要准确码率控制。
2. 缺口：现有方法依赖搜索、忽略帧间依赖、不能在线修正或跨内容泛化差。
3. 总方法：提出什么框架，核心输入和输出是什么。
4. 两个最关键技术点：不要把所有模块都列一遍。
5. 量化结果：平均相对码率误差、BD-rate、速度/开销，注明数据集或 backbone 范围。

摘要里不要写公式、引用和未解释缩写；结果必须与正文表格完全一致。

### 3.3 Introduction：推荐五段

1. **场景与任务**：直播、视频会议、带宽波动、存储预算为何需要 rate control。
2. **技术背景**：NVC 用固定 λ/QP 优化 RD，variable-rate 使单模型覆盖多个点。
3. **现有缺陷**：精确指出搜索开销、模型误差、时序耦合、buffer 风险或跨 codec 泛化问题。
4. **核心洞察与方法**：先说 why，再说 how；配一张 overview 图最好。
5. **贡献列表**：通常 3 条，每条都应在实验中有对应证据。

贡献不要写成“我们进行了大量实验”。更好的写法是：

```text
• We formulate ... under ... constraints.
• We introduce ... that enables ... without ...
• Across ... backbones and ... datasets, the method reduces ... while ...
```

### 3.4 Related Work：按问题分组

适合本方向的分组是：

1. Learned video compression：DVC、FVC、DCVC 系列、实时/生成式 NVC。
2. Variable-rate neural compression：λ/QP 条件化、gain units、feature modulation、module bank。
3. Rate control and allocation：传统 R-λ/R-Q 模型、神经预测、优化式、RL、反馈控制。
4. 若确有需要，再单独写 reinforcement learning、control theory 或 perceptual compression。

不要按年份逐篇介绍。每一组最后要落到“这些方法为什么没有解决本文问题”。

### 3.5 Method

建议顺序：

1. **Problem Formulation**：符号、目标码率、总预算、可用信息、因果性和优化目标。
2. **Overall Framework**：一张图说明数据流和训练/推理差异。
3. **核心模块 A**：例如 allocation/state modeling。
4. **核心模块 B**：例如 rate implementation/controller。
5. **Loss / Reward / Optimization**。
6. **Training and Inference Algorithm**：最好给伪代码；说明是否需要多次编码。

一个通用的问题表述是：给定视频帧 \(x_{1:T}\)、目标总预算 \(B\) 或目标平均码率 \(R^*\)，选择每帧编码参数 \(q_t\)，使

\[
\min_{q_{1:T}} \sum_{t=1}^{T} D(x_t, \hat{x}_t)
\quad \text{s.t.}\quad
\sum_{t=1}^{T} R_t(q_t) \le B.
\]

实际学习式控制器常把约束写入损失：

\[
\mathcal{L}=\sum_t D_t
+\alpha\left|\frac{\sum_t R_t-B}{B}\right|
+\beta\,\mathrm{Var}(Q_1,\ldots,Q_T)
+\gamma\,C_{\mathrm{ctrl}},
\]

其中最后两项可分别表示质量波动与控制开销。论文必须解释每一项的尺度、权重和训练稳定性，不能只给公式。

### 3.6 Experiments

推荐小节结构：

1. Experimental Setup
2. Comparison with State of the Art
3. Rate-Control Accuracy and Temporal Behavior
4. Generalization / Robustness
5. Ablation Study
6. Complexity and Runtime
7. Qualitative Results（需要时）

### 3.7 Conclusion

一段概括贡献，一段诚实说明限制与未来工作。不要引入正文没出现的新结果。

## 4. LaTeX 怎样上手

### 4.1 最重要的原则

先定目标 venue，再从官网下**当届官方模板**。不要用旧论文反向扒模板，也不要自己改页边距、字号、行距或标题间距。

- LaTeX 零基础可先完成 [Overleaf 30 分钟教程](https://www.overleaf.com/learn/latex/Learn_LaTeX_in_30_minutes_)。
- CVPR/ICCV/3DV 有维护中的[官方 author kit](https://github.com/cvpr-org/author-kit)，但仍应从当届 Author Guidelines 进入。
- IEEE 期刊使用 [IEEE Template Selector](https://journals.ieeeauthorcenter.ieee.org/create-your-ieee-journal-article/authoring-tools-and-templates/tools-for-ieee-authors/ieee-article-templates/)；IEEE 还提供 LaTeX/PDF/reference 检查工具。
- ICLR 这类会议要逐年核对匿名、页数和 appendix 规则。例如 [ICLR 2026 Author Guide](https://iclr.cc/Conferences/2026/AuthorGuide)规定投稿主文最多 9 页、双盲，references 不计入主文页数；下一届可能改变。

### 4.2 推荐项目结构

```text
paper/
├── main.tex
├── refs.bib
├── sections/
│   ├── abstract.tex
│   ├── intro.tex
│   ├── related.tex
│   ├── method.tex
│   ├── experiments.tex
│   └── conclusion.tex
├── figures/
│   ├── overview.pdf
│   ├── rd_curve.pdf
│   └── rate_trace.pdf
├── tables/
│   └── main_results.tex
└── supplementary.tex
```

`main.tex` 只负责模板、宏和章节组织：

```latex
\input{sections/intro}
\input{sections/related}
\input{sections/method}
\input{sections/experiments}
\input{sections/conclusion}
```

### 4.3 你最先需要会的 LaTeX

```latex
As shown in Fig.~\ref{fig:overview}, ...
The objective is
\begin{equation}
  \mathcal{L}=R+\lambda D.
  \label{eq:rd_loss}
\end{equation}

\begin{figure}[t]
  \centering
  \includegraphics[width=\linewidth]{figures/overview.pdf}
  \caption{Overview of the proposed rate-control framework.}
  \label{fig:overview}
\end{figure}

\cite{lu2019dvc}              % 具体命令以模板使用的 bibliography 包为准
```

常用规则：

- `Fig.~\ref{}`、`Table~\ref{}`、`Eq.~\eqref{}`统一交叉引用，不手写编号。
- 标签使用统一前缀：`fig:`、`tab:`、`eq:`、`sec:`。
- BibTeX 条目优先从 DOI、DBLP、出版社或 arXiv 原页导出，再人工统一作者名和会议名。
- 图表和正文分开维护，避免一个 `main.tex` 数千行。
- 投稿时打开匿名选项，删除作者、单位、致谢和可追踪的补充材料元数据；具体以 venue 政策为准。
- 本地可用 `latexmk -pdf main.tex` 编译；提交前必须在干净环境重新编译一次。

### 4.4 写作顺序

最省返工的顺序通常是：

1. 先做主结果表和关键三张图。
2. 写 Method 与 Experimental Setup。
3. 写结果分析和消融。
4. 写 Introduction/Related Work。
5. 最后写 Abstract、Title、Conclusion。

因为摘要和引言应该描述已经被实验验证的故事，而不是最初的设想。

## 5. 数据集怎样选

### 5.1 本目录论文呈现出的主流组合

| 用途 | 常见数据集 | 作用与注意事项 |
|---|---|---|
| codec / rate implementation 训练 | Vimeo-90K septuplet | 7 帧短序列、容易训练；分辨率与长时依赖有限 |
| allocation/controller 训练 | BVI-DVC | 800 个多分辨率视频，适合学习跨帧 RD 分配 |
| validation | 单独的 Vimeo/BVI split、USTC-TD 等 | 调超参数；绝不能用测试集选最佳 checkpoint |
| 标准测试 | UVG | 7 个高分辨率序列，NVC 论文极常见 |
| 标准测试 | MCL-JCV | 内容更多样，适合检查泛化 |
| 标准测试 | HEVC/JCT-VC Class B–E | 多分辨率标准序列，便于对 HM/VTM 和其他论文 |

本地 ICLR 2024 rate-control 论文使用 Vimeo-90K 训练 rate implementation、BVI-DVC 训练 allocation，并在 UVG、MCL-JCV、HEVC 类别上测试；较新的 reinforced rate-control 论文使用 BVI-DVC + Vimeo 混合训练、USTC-TD 验证。这是一个很好的起步参照，但不是唯一合法配置。

### 5.2 推荐的第一版实验矩阵

如果算力有限：

```text
训练：Vimeo-90K（实现网络）+ BVI-DVC 子集（分配/控制器）
验证：与训练严格分离的一小组序列
测试：UVG + HEVC B/C/D/E
backbone：1 个主 backbone + 1 个跨模型泛化 backbone
target rates：每个序列至少 4 个，覆盖可比较的质量/码率区间
```

有更多算力后再加入 MCL-JCV、带宽突变、场景切换、超长序列和不同 GOP。

### 5.3 数据泄漏与训练说明

必须披露：

- 原始数据集版本、下载链接和许可证。
- 训练/验证划分、裁剪尺寸、帧数、增强方式。
- 是否从测试视频或相邻片段微调。
- 是否使用预训练 codec，哪些参数冻结。
- optimizer、learning rate、schedule、batch size、step/epoch、GPU、训练时间和随机种子。

Vimeo-90K 的短、低分辨率片段可能导致长视频和 1080p 泛化不足；若你使用长序列微调，这本身就必须写清数据来源与去重方式。

## 6. 测试条件怎样统一

这是视频压缩论文最容易被质疑的部分。建议先写一份 `evaluation_protocol.md`，所有实验只调用同一套脚本。

### 6.1 必须固定并披露的条件

| 条件 | 需要写清的内容 |
|---|---|
| 输入 | 原始分辨率、帧率、位深、RGB/YUV420、是否裁剪到 64 的倍数 |
| 序列 | 编码多少帧，是否编码全部帧，是否包含第一帧 |
| GOP | GOP size、intra period、预测结构、是否 low-delay/causal |
| I 帧 | 使用哪个 image codec、质量点怎样选、I 帧 bits 是否计入 |
| 传统 anchor | HM/VTM/ECM/x265 的版本、配置文件、QP、完整命令 |
| 神经 anchor | commit/checkpoint、quality index、是否真实熵编码 |
| rate | 实际 bitstream bytes 还是 entropy estimate；主结果建议用前者 |
| distortion | RGB-PSNR、Y-PSNR、YUV-PSNR、MS-SSIM/LPIPS/DISTS 的准确实现 |
| hardware | GPU/CPU、精度、batch、warm-up、同步方式、编码/解码分别计时 |

### 6.2 不要混用颜色空间

`RGB PSNR`、`Y-PSNR` 和 `YUV420 weighted PSNR`不是一回事；不同结果不能放进同一张 BD-rate 表直接比较。DCVC-RT 类论文常在 YUV420 下与 VTM 比较，而较早论文常报告 RGB PSNR/bpp。必须在表头、图注和正文三处写明。

### 6.3 GOP / intra period

本目录中能看到多种设置：早期 DVC 的 GOP 10/12、rate-control 论文的 GOP 100、综述比较中的 intra period 32、DCVC-RT 的 `intra-period = -1`（序列仅初始 I 帧）。这些结果不能脱离设置横向比较。

建议至少报告：

- 一个与 prior work 对齐的标准设置；
- 一个长 GOP/单 I 帧的压力测试；
- 若面向实时通信，再报告 causal low-delay 设置和端到端时延。

### 6.4 传统 codec 公平性

不要只写“与 VTM 比较”。需要给出：软件版本、配置（Low-Delay P/Random Access/All Intra）、QP 列表、色彩空间、帧数、intra period 和命令行。最好把命令放进 supplementary 或仓库。

### 6.5 码率点与 BD-rate

- 一般至少使用 4 个可比较的 RD 点。
- 曲线应在相互重叠的质量区间计算 BD-rate，避免远距离外插。
- 负 BD-rate 通常表示相对 anchor 节省码率，表头要标 `↓` 并写清 anchor。
- 曲线非单调时先检查实际码流、frame padding、指标实现和 checkpoint，不要直接拟合。

## 7. 码率控制论文必须报告哪些指标

### 7.1 码率准确性

单序列相对误差可定义为：

\[
\Delta R = \frac{|R_{\mathrm{actual}}-R_{\mathrm{target}}|}
{R_{\mathrm{target}}}\times100\%.
\]

论文应说明最终表格是按序列平均、按 target 平均，还是先汇总 bits 后计算。建议同时给 mean、median、95th percentile 和 worst case，避免平均数掩盖失败案例。

### 7.2 RD 性能

- PSNR–bpp / MS-SSIM–bpp 曲线。
- BD-rate 相对 fixed-λ、search-based baseline、prior RC 和传统 codec。
- 目标码率处的 PSNR gap，比只给整条曲线更直观。

### 7.3 时序与缓冲行为

- per-frame actual bpp 与 target/allocation trace。
- per-frame PSNR/MS-SSIM 及其标准差或相邻帧变化。
- buffer occupancy、overflow/underflow 次数、恢复时间。
- 场景切换、快速运动、纹理突变和带宽阶跃响应。

### 7.4 实用性

- 是否 one-pass；需要几次编码/搜索。
- controller 参数量、MACs/KMACs per pixel、额外显存。
- 编码/解码 fps 与端到端延迟。
- 是否需要未来帧；是否改变 decoder；是否 bitstream-compatible。
- 跨 codec、跨分辨率、跨 GOP、跨 target range 的泛化。

### 7.5 最少 baseline 集合

1. backbone 的 fixed-λ/fixed-QP 原始结果。
2. 最简单的均匀分配或固定 offset。
3. binary/grid search，可作为高开销强 baseline 或近似 oracle。
4. 与你的方法最接近的 prior neural RC。
5. 若声称通用性，至少换一个 backbone 测试。

## 8. 图怎样画

### 8.1 一篇完整稿件的图表清单

1. **Overview 图**：目标码率、状态、控制器、codec、实际 bits、反馈回路。
2. **模块细节图**：只展开真正的新模块。
3. **RD 曲线**：每个主测试集一张或做成子图。
4. **码率跟踪图**：target 水平线 + actual rate，展示动态变化。
5. **逐帧 allocation/quality 图**：解释为什么 RD 更好。
6. **主结果表**：`ΔR / BD-rate`，按 dataset 与 backbone 分列。
7. **消融表**：每个创新模块都要能被移除。
8. **复杂度表**：params、MACs、fps、passes、memory。
9. 可选的**可视化重建图**：同实际码率、同 crop、标出局部纹理。

### 8.2 绘图工具分工

- 网络结构/overview：Figma、draw.io、PowerPoint、Illustrator 或 TikZ。
- RD 曲线/trace/bar chart：Python Matplotlib。
- 表格：LaTeX 原生表格，数字由脚本生成，避免手抄。
- 导出：线图优先 PDF/SVG 矢量；照片/重建图用 PNG，通常至少 300 dpi。

不要用截图形式的曲线和表格，不要用 JPEG 保存文字图。

### 8.3 Matplotlib 起始模板

```python
import matplotlib.pyplot as plt

plt.rcParams.update({
    "font.family": "serif",
    "font.size": 8,
    "axes.labelsize": 8,
    "legend.fontsize": 7,
    "lines.linewidth": 1.5,
    "lines.markersize": 4,
    "pdf.fonttype": 42,
    "ps.fonttype": 42,
})

fig, ax = plt.subplots(figsize=(3.35, 2.35))  # 约等于双栏论文的单栏宽度
ax.plot(bpp_ours, psnr_ours, "o-", label="Ours")
ax.plot(bpp_base, psnr_base, "s--", label="Baseline")
ax.set_xlabel("Bits per pixel (bpp)")
ax.set_ylabel("PSNR (dB)")
ax.grid(True, alpha=0.25)
ax.legend(frameon=False)
fig.tight_layout(pad=0.3)
fig.savefig("figures/rd_curve.pdf", bbox_inches="tight")
fig.savefig("figures/rd_curve.png", dpi=300, bbox_inches="tight")
```

### 8.4 图注应能独立阅读

一条好图注应说明 dataset、metric/color space、GOP/intra period、anchor、箭头方向以及越高/越低越好。不要只写“Comparison results”。

## 9. 可以投哪些会议和期刊

### 9.1 会议：按论文贡献选，不按名气硬套

| 类别 | 典型 venue | 适合什么稿件 |
|---|---|---|
| 视觉顶会 | CVPR、ICCV、ECCV | 新 codec 架构、明显 SOTA RD/速度突破、视觉质量与部署价值；需要强实验和清晰视觉叙事 |
| 机器学习顶会 | ICLR、NeurIPS、ICML | 新学习/优化/控制方法，能跨 backbone 或超出视频编码单一应用；只做工程调参通常不够 |
| AI 综合 | AAAI、IJCAI | RL、序列决策、通用控制/优化贡献明确时可考虑 |
| 多媒体 | ACM Multimedia、IEEE ICME | 多媒体系统、传输、QoE、部署、码率控制；注意 ACM MM 2026 明确更偏好多媒体/多模态贡献，纯单模态视频压缩存在 scope 风险，需看当届 CFP |
| 图像/信号处理 | IEEE ICIP、ICASSP | 编码算法、率失真建模、轻量控制器；篇幅通常更短，很适合作为首篇完整工作 |
| 专门编码会议 | DCC、PCS、IEEE MMSP、BMSB | 压缩/编码社区非常对口，审稿人更关注 CTC、公平比较和编码机制 |

CVPR 2026 的官方 CFP 显示其投稿截止为 2025-11-13 AoE；ICIP 2026 主论文在 2026 年 2 月截止；ACM MM 2026 主轨在 2026-04-01 截止；NeurIPS 2026 在 2026-05-06 截止。它们只能作为年度节奏参考，不能推断下一届的准确日期。

### 9.2 期刊：一般没有年度统一截止

普通期刊稿通常全年滚动投稿；只有 Special Issue/Section 才有固定 deadline。

| 期刊 | 匹配度与侧重点 |
|---|---|
| IEEE TCSVT | 本方向最直接的主阵地之一；官方 scope 明确包含 video compression、transmission、software/hardware implementation |
| IEEE Transactions on Image Processing (TIP) | 强调新理论、算法、架构与严格实验；官方 scope 包含 image/video coding |
| IEEE Transactions on Multimedia (TMM) | 适合 codec + system/network/QoE/应用结合；官方说明初投稿 Regular Paper 通常有页数约束，须核对当期规则 |
| IEEE Transactions on Broadcasting | 适合广播、流媒体传输、ABR、QoE、标准/部署场景，而不只是离线 RD |
| IEEE Open Journal of Signal Processing | 全 OA、信号处理范围广；官方要求学习式方法重视模型/代码可验证性，并有 APC |
| ACM TOMM | 多媒体计算、通信和应用方向，适合系统与应用更强的稿件 |

官方 scope 入口：

- [IEEE TCSVT](https://ieee-cas.org/publication/tcsvt)
- [IEEE TIP](https://signalprocessingsociety.org/publications-resources/ieee-transactions-image-processing/about-transactions-image-processing)
- [IEEE TMM](https://signalprocessingsociety.org/publications-resources/ieee-transactions-multimedia)
- [IEEE OJSP](https://signalprocessingsociety.org/publications-resources/ieee-open-journal-signal-processing/information-authors-ojsp)

会议短稿扩展为期刊时，必须引用原会议版本并明确新增理论、算法或大量实验；不能只把文字拉长。具体扩展政策以目标期刊为准。

## 10. 截止日期去哪里查

### 10.1 汇总网站

- [CCFDDL](https://ccfddl.com/)：中文友好，可按 CCF/方向筛选并显示倒计时；网站自己也声明数据是人工收集、仅供参考。
- [AI Deadlines](https://aideadlin.es/)：适合 CV/ML/AI 会议倒计时。
- [WikiCFP](https://www.wikicfp.com/)：覆盖范围很广，适合发现小会、workshop 和 special issue，但误报/过期信息更多。
- [IEEE Conference Search](https://events.ieee.org/search-ieee-conferences/)：查 IEEE 主办/赞助会议。

正确流程是：汇总站发现日期 → 打开当届官网 → 找 `Call for Papers / Important Dates / Author Guidelines` → 检查时区、abstract deadline、paper deadline、supplementary deadline 是否分开。

### 10.2 2026-07-21 时点的提醒

- [AAAI-27 官方页面](https://aaai.org/conference/aaai/aaai-27/)列出的 abstract deadline 正好是 2026-07-21 AoE，full paper 是 2026-07-28 AoE。除非实验和初稿已经完成，否则不建议为了赶这次日期仓促投稿。
- ICLR 2027、CVPR 2027 等应等待当届官方 CFP；不要把上一年的日期简单加一年。
- 期刊 regular paper 通常不需要等 deadline；Special Issue 要看期刊官网 CFP。

### 10.3 建立自己的日历

对每个候选 venue 记录：

```text
Venue / track：
官网：
abstract deadline：
full paper deadline：
supplementary/code deadline：
时区：AoE / UTC / 本地时区
页数与参考文献规则：
匿名规则：
OpenReview/CMT 账号要求：
rebuttal：
双投/arXiv/代码政策：
```

很多会议要求所有作者提前完善 OpenReview profile；例如 CVPR 2026 官方 CFP 提醒，无机构邮箱的新账号审核可能需要约两周。

## 11. 怎样设计你的第一篇工作

### 11.1 低风险起点

先冻结预训练 NVC，把研究范围限制为 encoder-side controller：

```text
输入：目标 bpp、已编码帧 bits、剩余 budget、当前/参考帧低成本特征
输出：当前帧 QP / λ / quality index
backbone：不变
decoder：不变
目标：one-pass、causal、低 ΔR、低 BD-rate、低 overhead
```

这种设计有三个优点：训练便宜、容易接不同 backbone、能清楚证明增益来自控制器。

### 11.2 可做的研究问题

1. **闭环反馈**：预测误差如何在线纠正，遇到场景切换多久恢复？
2. **buffer-aware control**：硬 budget/缓冲约束下怎样避免 overflow/underflow？
3. **跨 codec 泛化**：同一控制策略能否适配多个 NVC backbone？
4. **低开销 one-pass**：能否替代多次搜索并保持 RD 性能？
5. **长时依赖**：短 GOP 训练的控制器能否在长 GOP 或单 I 帧条件稳定？
6. **多目标控制**：rate、quality fluctuation、latency、energy 怎样联合优化？
7. **content/bandwidth shift**：未见分辨率、帧率、带宽阶跃下是否稳健？

不要一开始就同时做新 codec、新 entropy model、新 controller 和新 loss；失败后很难定位原因。

### 11.3 八周可执行路线（已有基本代码能力时）

| 周 | 交付物 |
|---|---|
| 1 | 跑通 backbone 官方 checkpoint；复现 1 个数据集 4 个 RD 点 |
| 2 | 固化 evaluation pipeline；实际 bitstream、PSNR、BD-rate、fps 全部自动生成 |
| 3 | 实现 uniform/fixed offset/search baseline，画第一张 rate trace |
| 4 | 实现最小控制器，先在固定 GOP 和 1 个 target range 上工作 |
| 5 | UVG + HEVC 全测试；做失败案例分析，不急着堆模块 |
| 6 | 消融、跨 target/GOP/分辨率泛化、复杂度测试 |
| 7 | 写 Method/Experiments，冻结主表和图 |
| 8 | 写 Intro/Related/Abstract，内部审稿，复现检查并选择 venue |

若第 3 周还不能稳定复现 baseline，就不应进入“发明新模块”阶段。

## 12. 投稿前检查清单

### 科学问题

- [ ] 一句话能区分 variable rate 与真正 rate control。
- [ ] 明确 target、budget、因果信息和控制粒度。
- [ ] 贡献不是“换一个 backbone/网络层数”。
- [ ] 最强 prior baseline 已实现或公平引用。

### 实验

- [ ] 使用实际码流计算主结果。
- [ ] 至少 4 个可比 RD 点，质量区间有重叠。
- [ ] 色彩空间、GOP、I 帧和帧数完全一致。
- [ ] 同时报 `ΔR` 与 BD-rate/画质，且报告控制开销。
- [ ] 有逐帧 trace、场景切换或带宽变化等动态实验。
- [ ] 有消融、泛化和失败案例。
- [ ] 命令、版本、checkpoint、随机种子可追溯。

### 写作与 LaTeX

- [ ] 使用当届官方模板，未改 margin/font/spacing。
- [ ] 匿名与页数规则已逐项核对。
- [ ] 每个贡献在实验中有对应证据。
- [ ] 每张图在单栏宽度下仍可读，图注可独立理解。
- [ ] 表头注明 metric、color space、anchor 和箭头方向。
- [ ] 摘要数字与表格一致，引用均已核对原文。
- [ ] 主 PDF、supplementary、代码链接不泄露匿名信息。

## 13. 最后的学习方法

不要试图先把所有压缩理论学完。以一个可复现实验为主线，遇到问题再补知识：

```text
复现 RD 曲线
→ 学 rate–distortion、entropy model、bpp/PSNR/BD-rate
→ 实现 target-rate baseline
→ 学 R–λ / R–Q、PID、allocation
→ 发现长时依赖问题
→ 学 RL/RNN/state modeling
→ 做统一协议与消融
→ 写论文
```

真正让你“会写这类论文”的不是记住章节名称，而是能够把每个 claim 绑定到一个公平、可复现、能排除替代解释的实验。
