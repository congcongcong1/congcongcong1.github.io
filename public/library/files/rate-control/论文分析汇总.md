# NVC / 码率控制论文分析汇总（基于 PDF 实际提取内容）

目录共 14 个 PDF，去重后为 11 篇独立文献：
- `Ne8OLj-...CVPR_2026_paper.pdf` 与 `wtYXSX-...` 内容完全相同（同一篇）
- `2596_Neural_Rate_Control_for_L.pdf` 与 `yPUVIk-ICLR-2024-...` 内容完全相同（同一篇）
- 注意：`1812.00101v3` 实际是 **DVC**（深度视频压缩），`1912.05526v2` 是 **MAE 可变码率图像压缩**，与文件名的预判相反。

---

## 1. 1812.00101v3 — DVC: An End-to-end Deep Video Compression Framework（Lu 等，SJTU 等）

- **Venue**：PDF 未注明（arXiv v3, 2019-04）；公开记录为 CVPR 2019（未在 PDF 内确认）
- **章节结构**：1 Introduction；2 Related Work（2.1 Image / 2.2 Video / 2.3 Motion Estimation）；3 Proposed Method（3.1 传统视频压缩简介、3.2 方法总览、3.3 MV 编解码网络、3.4 运动补偿网络、3.5 残差编解码网络、3.6 训练策略）；4 Experiments（4.1 Setup / 4.2 Results / 4.3 Ablation）；5 Conclusion；附录 A–D（BDBR 结果、HEVC C/D 结果、Kinetics 训练、FFmpeg 命令行、网络结构）
- **训练集**：Vimeo-90k；附录另有用 Kinetics 训练的变体
- **测试集与条件**：UVG、HEVC Class B / E（正文），Class C / D（附录）；HEVC 序列测 N=100 帧；GOP=12（UVG）、GOP=10（HEVC）；H.264/H.265 用 FFmpeg veryfast + zerolatency（低延迟设定），CRF Q=15/19/23/27
- **指标与 anchor**：PSNR、MS-SSIM（附录有 BDBR/BD-PSNR）；anchor 为 x264（H.264）、x265（H.265）、Wu et al. 2018
- **图表风格**：Fig.1 重建帧视觉对比（标注 bpp/MS-SSIM）；Fig.2 传统 vs 提出的框架对比方块流程图（蓝色=仅编码端模块）；Fig.5 RD 曲线按数据集分面（PSNR vs bpp）；Fig.4 比特分配饼图/柱状（运动 vs 残差比特占比）

## 2. 1912.05526v2 — Variable Rate Deep Image Compression with Modulated Autoencoder（Yang 等，UAB CVC）

- **Venue**：PDF 为 "JOURNAL OF LATEX CLASS FILES" 模板占位，具体期刊未确认（arXiv v2, 2020-07）
- **章节结构**：I Intro；II Background；III Multi-Rate DIC with MAE（A 问题定义 / B Bottleneck scaling / C MAE / D 调制网络）；IV Experiments（A Setup / B Results）；V Conclusion
- **训练集**：CLIC 2019 Professional（585 训练图），240×240 随机裁剪
- **测试集与条件**：CLIC 2019 Professional 测试集（226 张）+ Kodak；图像压缩，无 GOP/帧数概念
- **指标与 anchor**：PSNR、MS-SSIM(dB)；anchor：JPEG、JPEG2000、BPG，及 Independent models（上界）与 Bottleneck scaling（Theis et al.）两个基线
- **码控相关**：核心思路一句话——用一个小型调制网络以 λ 为条件对共享自编码器多层特征做通道级缩放，实现单模型连续可变码率；无码率精度指标（只比 RD 与参数量，7 个 λ 点/4 个 λ 点）；**单模型可变码率：是**
- **图表风格**：Fig.1 三种机制的对比示意图（JPEG/bottleneck scaling/MAE 三栏）；Fig.3/4 RD 曲线（CLIC、Kodak）；Fig.5 特征图可视化（两个通道 + ratio map）；Table I 参数量对比

## 3. 2504.21445v1 — Emerging Advances in Learned Video Compression: Models, Systems and Beyond（Jia 等，北大/鹏城/MPAI，综述）

- **Venue**：PDF 未注明（arXiv v1, 2025-04-30）
- **章节结构**：1 Intro；2 Overview of LVC（2.1 单向预测 / 2.2 双向预测，含 Table 1/2 模型总结）；3 Optimization Techniques（3.1 编码端在线学习 / 3.2 解码端内容自适应 / **3.3 Variable Bitrate Encoding** / **3.4 Rate Control Models and Methods** / 3.5 感知质量优化 / 3.6 模型量化）；4 LVC System Design（4.1 边缘 / 4.2 移动 / 4.3 语义通信）；5 Experiments of LVC Models；6 Conclusion
- **训练集**：综述不适用（其评测部分复现/引用各模型结果）
- **测试集与条件**：JCT-VC 测试序列（HEVC Classes）、UVG、MCL-JCV；**每条序列前 96 帧**；传统编码器用 random access 配置：HM-16.20（encoder_randomaccess_main_rext，intra-period=32，GOP=16）、VTM-23.0（encoder_randomaccess_vtm，intra-period=32，GOP=32）；RGB 转 YUV444 编码再转回 RGB 算失真；LVC 模型 intra-period=GOP=32；对比 DCVC-DC、DCVC-FM、EEV-0.5（双向）
- **指标与 anchor**：PSNR、MS-SSIM、BD-rate；anchor：HM-16.20、VTM-23.0
- **码控相关**：3.4 节专述码率控制模型（R-λ 类方法、学习式方法），作为优化技术分类之一
- **图表风格**：Fig.1 三类架构对比（传统/单向/双向）；大量文献总结表格（按模块打勾/叉的对比表）

## 4. 2596 / yPUVIk — Neural Rate Control for Learned Video Compression（Zhang 等，SJTU+华为）

- **Venue**：**ICLR 2024**（PDF 页眉明确 "Published as a conference paper at ICLR 2024"）
- **章节结构**：1 Intro；2 Related Works（2.1 Video Compression / 2.2 Rate Control）；3 Methodology（3.1 System Framework / 3.2 Rate Allocation Network / 3.3 Rate Implementation Network）；4 Experiments（4.1 Setup / 4.2 Results / 4.3 Ablation）；5 Conclusion；附录
- **训练集**：率实现网络用 Vimeo-90k（89,800 clips）；率分配网络用 BVI-DVC（800 序列×64 帧，256×256 裁剪）
- **测试集与条件**：HEVC Class B/C/D/E（16 个序列）、UVG、MCL-JCV；**GOP=100**；基线用 4 个 λ 点 {256,512,1024,2048} 编码的实际码率作为目标码率做公平对比
- **指标与 anchor**：PSNR-bpp RD 曲线、BD-rate、相对码率误差 ΔR=|Rs−R̂s|/Rs；结果：平均 ΔR 1.64%–2.24%（随 backbone 而异），BD-rate 平均省 6%–14%；backbone/anchor：DVC、FVC、DCVC、AlphaVC（均叠加 Lin et al. 2021 可变码率方案），并与 Li et al. 2022b 传统双曲 R-λ 模型对比（对方 ΔR 7.72%/8.43%）
- **码控核心**：两级码率分配（miniGoP 级均匀+滑窗、帧级用权重估计网络按时空特征分配）+ 率实现网络做内容自适应的 R→λ 映射回归；**码率精度：平均约 2%（最低 0.21% 单序列）**；**单模型可变码率：是（借助 Lin et al. 2021 把固定 λ backbone 改造为可变码率单模型）**
- **图表风格**：Fig.1 框架总览 + 两级分配示意（(a)/(b) 并排）；Fig.2 两个网络结构图（Conv/MLP 标注尺寸）；Fig.3 六个数据集 RD 曲线分面（图例 DVC / DVC+RC 等成对）；Fig.4 逐帧 bpp 曲线 + 红色目标码率线；Fig.5 逐帧 ΔR 对比（与传统双曲模型）；Fig.6/7 消融（去 RA 模块、逐帧 PSNR/bpp 变化）

## 5. 2601.19293v2 — Reinforced Rate Control for NVC via Inter-Frame Rate-Distortion Awareness（Cong 等，南大+三星）

- **Venue**：AAAI 2026（页脚 "Copyright © 2026, AAAI"；arXiv v2, 2026-02）
- **章节结构**：1 Intro；2 Related Work（2.1 NVC and Rate Control / 2.2 RL）；3 Rate Control for NVC（3.1 问题建模 / 3.2 帧间依赖影响分析）；4 Reinforced Rate Control Framework（4.1 State Modeling / 4.2 Action Decision / 4.3 Reward Shaping）；5 Experiments（5.1 Setup / 5.2 Results / 5.3 Ablation）；6 Conclusion；附录（状态特征清单等）
- **训练集**：BVI-DVC + Vimeo 混合集训练码控模块（codec 参数冻结）；验证集 USTC-TD
- **测试集与条件**：UVG、MCL-JCV、HEVC Class B–E；**编码全部帧，GOP=32 和 GOP=100 两种，LDP（low-delay P）配置**
- **指标与 anchor**：相对码率误差 ΔR（平均 1.20%）+ BD-rate（典型 GOP 下最高省 13.45%）；backbone：DVC、DCVC（用 Duan et al. 2023 改造为可变码率）、DCVC-DC、DCVC-RT（原生可变码率）；对比码控方法：Zhang et al. 2023（即 ICLR 2024 神经码控）、Chen et al. 2023（R–λ–m / D–λ–m 双曲模型）；λ 区间：DVC/DCVC [256,2048]、DCVC-DC [85,840]、DCVC-RT [1,768]，另有 m∈[0.5,1.0]（分辨率因子）
- **码控核心**：把码率控制建模为约束马尔可夫决策过程（CMDP），用改进 Actor-Critic（SAC 系）按帧序贯决策，状态含参考信息/内容/带宽，一步联合决定码率分配与编码参数，不依赖 GOP 结构；**码率精度：平均 1.20%（DCVC-RT 上 0.98–1.15%）**；**单模型可变码率：是（backbone 均为可变码率单模型）**
- **图表风格**：Fig.1 概念图（(a) 码控=分配+参数映射，(b) 序贯性能曲线）；Table 1 大表（GOP×codec×数据集，ΔR/BD-rate 成对列出，最优加粗）；Fig.4 逐帧码率控制曲线（BasketballDrive，统一目标 0.10006 BPP）

## 6. 2604.20104v1 — Feedback-Driven Rate Control for Learned Video Compression（Xu 等，中南大学+马栏山实验室）

- **Venue**：PDF 未注明（arXiv v1, 2026-04，ACM 排版模板）
- **章节结构**：1 Intro；2 Related Work（2.1 LVC / 2.2 Variable-Rate and Rate Control / 2.3 Classical Feedback Control）；3 Method（3.1 Overview / 3.2 λ-Modulated DCVC / 3.3 对数域 PI/PID 闭环 / 3.4 预算约束 RD 优化调整控制器 / 3.5 训练与推理策略）；4 Experiments（4.1 Settings / 4.2 Main Results / 4.3 分析）；5 Conclusion
- **训练集**：Vimeo-90k
- **测试集与条件**：UVG、HEVC Class B/C/D/E；**每条序列前 96 帧，GOP=32**；I 帧固定编码，只对 P 帧做在线码控与统计（P-frame-only 评测协议）；mini-GOP=4，滑窗 SW=40
- **指标与 anchor**：PSNR-bpp 曲线、BD-rate、平均相对码率误差 ΔR=|r̂−r*|/r*；backbone：DCVC、DCVC-TCM（均按 Lin et al. 改造为 λ 调制单模型 DCVC-λ）；对比：固定 λ、Li2022（R-D-λ 模型）、PI、PI+DualGRU；结果：PI 平均 ΔR 2.88%/2.95%（DCVC/DCVC-TCM），加调整控制器后 ΔR 2.13%/2.24%，BD-rate 省 5.69%/4.49%
- **码控核心**：对数域 PI 闭环反馈（以熵模型估计码率为反馈信号在线调 λ）+ 双分支 GRU 在预算约束下预测有界残差 Δlogλ 优化帧间比特分配；**码率精度：平均约 2.1–3.0%**；**单模型可变码率：是（λ-conditioned 调制单模型，λ∈[32,4096] 连续可调）**
- **图表风格**：Fig.1 整体框架图（编码流程+控制回路）；Fig.4/6 多数据集 RD 曲线；Fig.7 mini-GOP 预算对齐柱状图（蓝=预算、橙=实际消耗）；Fig.8 主观对比图（BQTerrace crop，标注 bpp/psnr）

## 7. OCUSQH-2510.09987v1 — GLVC: Generative Latent Video Compression（Guo/Jia 等，MSRA）

- **Venue**：PDF 标 "Preprint"（arXiv v1, 2025-10-11）
- **章节结构**：1 Intro；2 Background and Motivation（2.1 感知质量 / 2.2 R-D-P 权衡 / 2.3 语义压缩与感知解耦）；3 GLVC（3.1 Framework / 3.2 Latent Video Compression Module / 3.3 Training Strategy）；4 Related Work；5 Experiments（5.1 Settings / 5.2 Results / 5.3 Discussions 含消融）；6 Conclusion；附录（user study 等）
- **训练集**：latent codec 用 Vimeo；外环重建头微调用自建 1M 高质量视频 clip（经 Wang et al. 2025 方法过滤）；tokenizer 用预训练 Wan tokenizer（RGB 空间）
- **测试集与条件**：JVET/HEVC Class B/C/D/E、UVG、MCL-JCV；**每条序列前 96 帧**；RGB 域训练与评测；可变码率 QP∈[0,31] 随机采样训练；分阶段增加训练帧数（1 帧→129 帧）
- **指标与 anchor**：主指标 **LPIPS、DISTS**（感知），兼报 PSNR；BD-rate（DISTS 口径相对 DCVC-RT 省 94.7%）；user study（参照 Mentzer et al. 2022a 设置）；anchor：DCVC-RT、DCVC、DVC、PLVC、GLC-video，传统 HM、VTM、ECM
- **图表风格**：Fig.1 内嵌可播放视频示例（提示用 Adobe Reader 点击播放）；Fig.2 概念示意图（语义/感知两段 regime）；Fig.4 DISTS/LPIPS 口径 RD 曲线；Fig.5 整帧视觉对比（非 crop patch，提示 zoom in）；Fig.6 user study 柱状结果

## 8. Ne8OLj / wtYXSX — Real-Time Neural Video Compression with Unified Intra and Inter Coding（Xiang 等，USTC+腾讯 Shannon Lab）

- **Venue**：**CVPR 2026**（文件名 + PDF 内 "This CVPR paper is the Open Access version..." 水印确认）
- **章节结构**：1 Intro；2 Related Work；3 方法（3.1 统一框架 / …/ 3.4 双帧量化质量控制 / 3.5 混合参考训练策略）；4 Experiments（4.1 Setting / 4.2 Comparison / 消融）；附录（VTM 参数等）
- **训练集**：Vimeo-90k（7 帧序列训练），再用 Vimeo 原始长视频裁长序列微调（follow DCVC-RT）
- **测试集与条件**：HEVC Class B–E、UVG、MCL-JCV；**YUV420 色域、全部帧编码、intra-period=-1（即除首帧外全 P 帧）、low-delay 配置**；码率用估计熵；1080p 测速（RTX 3090）
- **指标与 anchor**：BD-rate（以 DCVC-RT 为 anchor，平均省 12.1%；相对 VTM 平均省 35.7%）、编解码 fps、kMACs/pixel；anchor：VTM-17.0、DCVC-DC、DCVC-FM、DCVC-RT；训练时多码率：QP∈[0,63] 随机，8 帧组 QP bias=[0,8,0,4,0,4,0,4] 分层质量
- **图表风格**：Fig.1 逐帧 PSNR/BPP 波动曲线（Kimono1，标注场景切换点/refresh 点，x 轴 Frame Index）；Fig.2 框架图（时间轴展开式）；Table 1 BD-rate+速度一体表（以 DCVC-RT 为 0 anchor）；Fig.4 RD 曲线（YUV420-PSNR，HEVC E/B 各含全段/低码率段/高码率段三张）

## 9. dcvc-rt — DCVC-RT: Towards Practical Real-Time Neural Video Compression（Jia 等，USTC+MSRA）

- **Venue**：PDF 未注明（arXiv 2502.20762v2, 2025-03）；目录内用户笔记标注 CVPR 2025（未在 PDF 内确认）
- **章节结构**：1 Intro；2 Related Work；3 方法（3.x 含 4.4 Module-Bank-Based Rate Control 等效率设计）；4 设计与消融（隐式时域建模、单低分辨率 latent、整数化、模块库码控）；5 Experiments（5.1 Settings / 5.2 Comparison）
- **训练集**：Vimeo-90k（7 帧序列），Vimeo 原始视频裁长序列微调
- **测试集与条件**：HEVC Class B–E、UVG、MCL-JCV；**YUV420、全部帧、intra-period=-1（低延迟全 P）**；1080p 测速（A100 125.2/112.8 fps）；实际 BPP（非估计）
- **指标与 anchor**：BD-rate（vs VTM 平均 -21.0%，vs ECM 相当）、fps、MACs、参数量；anchor：VTM-17.0、HM-16.25、ECM-11.0、x265、DCVC-DC、DCVC-FM、ELF-VC、MobileNVC、DHVC-2.0、C3
- **码控相关**：核心思路——**Module-Bank-Based Rate Control**：学一组超先验模块库建模不同 qp 下 z 的分布（z 占比超 10%），配合 qe/qd/qf/qr 向量库自适应缩放 latent，qp∈[0,63] 单模型覆盖 64 个离散码率点（模块间插值可扩到 128 点），分层质量 8 帧组 qp offset [0,8,0,4,0,4,0,4]；码率跟踪结果在补充材料；模块库约省 3.4% 比特（UVG）
- **图表风格**：Fig.1 全局对比图（速度/BD-rate/设备/功能多维）；Fig.2 范式对比图（(a) 运动式 NVC vs (b) 本文）；Fig.5 三联消融图（latent 分辨率/模块库概率估计/整数化跨设备）；Table 2 BD-rate+速度一体表；Fig.6 UVG RD 曲线

## 10. rate_control_survey — 《深度学习视频压缩中的码率控制方法综述》

- **性质**：**不是学术论文**，是 Kimi.ai 生成的中文调研报告（基于 GitHub 仓库 Awesome-Deep-Learning-Based-Video-Compression），重点解析 DCVC-RT
- **结构**：1 DCVC-RT 深度解析（架构创新、Module-Bank 码控、性能表）；2 码控方法六大技术路线分类（动态神经网络 / 特征调制 / R-D 模型 / 强化学习 / 感知优化 / 任务感知）+ 代表工作；3 其他可借鉴技术（生成式、INR、低复杂度）；4 方法对比表+雷达图；5 借鉴建议（对 DCVC-RT 的 5 条改进建议 + 分层最佳实践框架）；6 总结展望
- **数据**：引用了 ICLR 2024 神经码控（2% 误差/10% 节省）、ECCV 2024 动态路由（1.66% 误差/14.8% BD-rate 降低）等公开数字（二手转述，非原始实验）
- **图表**：中文路线图、时间线、雷达图、对比表格

## 11. zJoKGs-1710.09980v1 — Watching Videos with Certain and Constant Quality: PID-based Quality Control Method（Song/Xu/Li，北航）

- **Venue**：PDF 未注明（arXiv v1, 2017-10）
- **性质**：**传统编码器（HEVC/HM）的质量控制论文**，非 NVC，但方法论（PID 反馈控制 QP）被 2604.20104 一脉相承
- **章节结构**：1 Intro；2 PID 控制器概述；3 PID-based 质量控制方法（3.1 问题建模 / 3.2 QP–误差关系建模 / 3.3 PID 求解）；4 Experimental results（4.1 参数设置 / 4.2 性能对比）
- **测试集与条件**：JCT-VC 标准测试库全部 16 条序列；HM 16.0 平台；**low-delay IPPP 结构（encoder_lowdelay_P_main.cfg）**；QP=32 和 37 两档；以默认 HM 编码得到的 Y-PSNR 设为目标质量
- **指标与 anchor**：控制误差、质量波动（逐帧 Y-PSNR 曲线）、R-D 性能；anchor：默认 HM 16.0、文献[15]（Laplace 混合模型质量控制方法）
- **图表风格**：Fig.1 概念图（HM 质量波动 vs 本文平滑曲线，逐帧 Y-PSNR）；Fig.2/3 Ψ(QP) 关系分析散点/拟合曲线；Fig.4 逐帧 Y-PSNR 波动对比曲线；Table 1 大表（16 序列逐条列控制误差与波动）

---

## 跨论文共性总结（NVC/码控论文的 common practice）

**训练数据集**
- 视频 codec 主体几乎一律用 **Vimeo-90k** 训练（7 帧短序列起步，再用 Vimeo 原始长视频裁长序列微调——DCVC-RT/UI2C/GLVC 均如此）
- 码控模块的训练集更讲究：BVI-DVC（800×64 帧，ICLR 2024 与 AAAI 2026 都用）、Vimeo 混合；码控网络训练时**冻结 codec backbone**（2604.20104、2601.19293 明确如此）

**测试数据集（事实上的标准组合）**
- **HEVC Class B/C/D/E（JCT-VC 16 条）+ UVG + MCL-JCV** 是 2021 年后 NVC 论文的标配三件套；早期 DVC 只测 UVG+Class B/E（C/D 放附录）
- 图像压缩则用 Kodak + CLIC

**测试条件**
- 帧数：新近论文（2504 综述、GLVC、2604.20104）明确写 **前 96 帧**；早期 DVC 用 100 帧（HEVC）；实时系（DCVC-RT、UI2C）用**全部帧**
- GOP/intra period 分两派：① 实时/低延迟派：intra-period=-1（全 P 帧链）+ low-delay，YUV420 色域（DCVC-RT、UI2C）；② 性能派：GOP=intra-period=32、random access（2504 综述），或 GOP=32/100（码控论文，2601.19293 两种都测）；ICLR 2024 用 GOP=100
- 传统 anchor 配置要写明：HM/VTM 版本号、randomaccess/lowdelay cfg、x264/x265 用 veryfast+zerolatency（DVC 附录甚至给出完整 FFmpeg 命令行）
- 色域与像素格式要声明：YUV420（实时）vs RGB/YUV444（性能）；码率来源要声明（实际 BPP vs 估计熵，UI2C 明确用估计熵并声明数字可能因此与原文有出入）

**评价指标**
- 客观质量：PSNR(-bpp) 为主、MS-SSIM 为辅；感知论文用 LPIPS/DISTS + user study
- 综合性能：**BD-rate**，且必须写明 anchor（新近论文常以 VTM 为 anchor，或以同族前作 DCVC-RT 为 0 点）
- 码控论文专属指标：**相对码率误差 ΔR=|目标−实际|/目标**（序列级平均，好结果在 1–3%）；常配逐帧 bpp 跟踪曲线与 mini-GOP 预算对齐图
- 实时论文还要报：编解码 fps（指定 GPU 与 1080p）、kMACs/pixel、参数量

**章节结构模板**
- 标准五段式：Intro → Related Work → Method（按模块分子节）→ Experiments（Setup/Results/Ablation）→ Conclusion
- 码控论文的 Method 子节高度同构：**问题建模 → 码率分配（GOP/miniGoP/帧 多级）→ 码率-参数映射（R→λ 或 R→QP）→ 训练策略**；"分配+映射"两段式是码控论文的事实框架（ICLR 2024、2604.20104 都明确按此组织）
- 相关工作里码控单独设一小节，追溯 R-Q/R-ρ/R-λ 传统模型是标准写法

**码控方法设计惯例**
- 前提：先把 backbone 改造为**单模型可变码率**（λ 条件调制/Lin et al. 方案/模块库/量化参数随机采样训练），码控模块输出 λ（或 QP/m）
- 多级预算：序列级→miniGoP 级→帧级，配滑窗平滑（SW=40 被两篇沿用）
- 分层质量结构：8 帧组 QP offset [0,8,0,4,0,4,0,4]（DCVC-RT 与 UI2C 一致）
- 对比对象必须含：固定 λ 基线、Li et al. 2022b 式 R-D-λ 数学模型、Zhang et al. 2023 神经码控

**图表风格惯例**
- RD 曲线：横轴 bpp、纵轴 PSNR（dB），按数据集分面（6 宫格：HEVC B/C/D/E+UVG+MCL-JCV），每方法一条带 marker 曲线，图例成对出现（baseline vs +RC）
- 码控特色图：①逐帧 bpp/PSNR 波动曲线（x 轴 Frame Index，画红色目标码率水平线，标注场景切换/refresh 点）；②逐帧 ΔR 误差对比；③mini-GOP 预算 vs 实际消耗柱状图
- 架构图：方块流程图，常用颜色区分"仅编码端"模块（DVC 蓝色约定），时间轴展开式画多帧参考关系
- 视觉对比：crop patch 或整帧对比，角标注明 bpp/PSNR；表格爱用"BD-rate+速度"一体表、最优值加粗

**不确定项备注**
- 1812.00101（DVC）与 1912.05526（MAE）的正式发表 venue 未在 PDF 内注明（分别为 CVPR 2019 / IEEE JSTSP 2021 的公开记录，未确认）
- dcvc-rt 的 PDF 为 arXiv 版，CVPR 2025 身份未在 PDF 内确认
- 2604.20104、GLVC、2504 综述、1710.09980 均只有 arXiv/Preprint 标识
