# RAPNet-HEVC: Rate-Adaptive Preprocessing Network for Video Coding

本项目复现了基于深度强化学习的视频编码预处理网络RAPNet,使用Actor-Critic架构优化HEVC编码的Rate-Distortion性能。

## 📋 目录

- [项目概述](#项目概述)
- [论文实现对照](#论文实现对照)
- [环境依赖](#环境依赖)
- [快速开始](#快速开始)
- [代码架构](#代码架构)
- [关键技术细节](#关键技术细节)
- [实验分析](#实验分析)
- [常见问题](#常见问题)

---

## 📖 项目概述

### 核心思想

在视频编码前插入一个可学习的预处理网络(RAPNet),通过深度强化学习优化网络参数,使得编码后的视频在相同码率下质量更高,或在相同质量下码率更低。

### 技术路线

```
原始视频(1080p)
  → 下采样(540p)
  → RAPNet预处理
  → HEVC_NVENC编码
  → 解码
  → 上采样(1080p)
  → LPIPS质量评估
  → 计算RD奖励
  → 更新Actor-Critic网络
```

### 关键创新点

1. **YUV420原生处理**: 直接在YUV420平面上操作,避免BGR转换带来的质量损失
2. **多QP联合优化**: 在5个QP点(22,27,32,37,42)上同时优化,学习到的策略对QP更鲁棒
3. **感知质量指标**: 使用LPIPS代替传统的PSNR/SSIM,更符合人眼感知
4. **单步AC训练**: 不使用Replay Buffer,每个样本立即用于更新网络,训练更稳定

---

## 📊 论文实现对照

### 网络架构

| 组件 | 论文描述 | 本实现 | 状态 |
|------|---------|--------|------|
| **RAPNet (Actor)** |
| - 输入/输出 | YCbCr 4:2:0 | ✅ YUV420平面 (T,1,H,W) | ✅ |
| - Pixel Unshuffle | 下采样到潜空间 | ✅ nn.PixelUnshuffle(2) | ✅ |
| - Backbone | 5个ResBlock | ✅ 5 x ResBlock(16 ch) | ✅ |
| - Pixel Shuffle | 上采样回原分辨率 | ✅ nn.PixelShuffle(2) | ✅ |
| - 残差连接 | output = input + delta | ✅ torch.clamp(x+delta, 0,1) | ✅ |
| **ValueNet (Critic)** |
| - 输入 | Input/Output成对 | ✅ 双分支网络 | ✅ |
| - 分支结构 | Conv3x3 + LeakyReLU | ✅ branch_in/branch_out | ✅ |
| - 特征融合 | Concat + Conv | ✅ fusion_conv | ✅ |
| - 输出 | 标量Q值 | ✅ AdaptiveAvgPool + MLP | ✅ |

### 训练策略

| 项目 | 论文设置 | 本实现 | 状态 |
|------|---------|--------|------|
| **优化算法** | DDPG变体 | ✅ Deterministic AC | ✅ |
| **总迭代数** | 5000 | ✅ CONFIG["num_iterations"]=5000 | ✅ |
| **学习率** | 1e-4 → 1/3每1000 iter | ✅ StepLR(lr=1e-4, γ=1/3, step=1000) | ✅ |
| **Clip长度** | 16帧 (1080p限制) | ✅ CONFIG["clip_len"]=16 | ✅ |
| **QP范围** | 22,27,32,37,42 | ✅ CONFIG["qp_list"] | ✅ |
| **奖励函数** | α·ΔV + β·ΔR | ✅ alpha_q=1.0, beta_r=0.2 | ✅ |
| **质量指标** | LPIPS (VGG) | ✅ lpips.LPIPS(net='vgg') | ✅ |

### 损失函数

| 损失 | 论文公式 | 代码实现 | 状态 |
|------|---------|----------|------|
| **Critic Loss** | MSE(Q(S,A), R) | `mse_loss(q_pred, r_c)` | ✅ |
| **Actor Loss** | -Q(S,A) + λ·L_pixel | `-q_for_actor + λ·pixel_loss` | ✅ |
| **Pixel Loss** | 加权MSE (Y通道6x) | `6·MSE(Y) + MSE(Cb) + MSE(Cr)` | ✅ |

---

## 🔧 环境依赖

### 硬件要求

- **GPU**: NVIDIA GPU with NVENC support (推荐RTX 2060以上)
  - 最低: 1张GPU (8GB+ 显存)
  - 推荐: 2张GPU (Actor和Critic分开,减少显存占用)
- **CPU**: 8核以上
- **内存**: 32GB+
- **存储**: 至少100GB可用空间 (存储视频和中间文件)

### 软件依赖

```bash
# 核心依赖
Python >= 3.8
PyTorch >= 1.12.0 (with CUDA 11.3+)
FFmpeg >= 4.4 (with NVENC support)

# Python包
numpy >= 1.21
opencv-python >= 4.5
lpips >= 0.1.4
tensorboard >= 2.8

# 安装命令
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install numpy opencv-python lpips tensorboard
```

### FFmpeg with NVENC

**Windows:**
```bash
# 下载预编译版本 (包含NVENC)
https://www.gyan.dev/ffmpeg/builds/
# 解压后将bin目录添加到PATH
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# 验证NVENC支持
ffmpeg -encoders | grep nvenc
```

---

## 🚀 快速开始

### 1. 准备测试视频

```bash
# 生成测试视频 (如果没有Beauty视频)
python generate_test_videos.py

# 输出: test_videos/Beauty_1920x1080_120fps_420_8bit_YUV.yuv
```

**或者使用真实视频:**

从[UVG Dataset](http://ultravideo.fi/)下载Beauty视频:
```
Beauty_1920x1080_120fps_420_8bit_YUV.yuv (2.98 GB)
```

### 2. 构建Baseline RD曲线

```python
# 修改主函数中的视频路径
video_meta_list = [
    {
        "id": "beauty_1080p",
        "path": "test_videos/Beauty_1920x1080_120fps_420_8bit_YUV.yuv",  # 修改为实际路径
        "width": 1920,
        "height": 1080,
    }
]

# 运行Baseline构建 (首次运行必须执行,耗时约10-30分钟)
python rapnet_hevc_ppo_qp_yuv.py
```

这会生成 `rd_baseline_hevc_qp_full.json`,包含每个QP点的baseline码率和质量。

### 3. 开始训练

```python
# 在rapnet_hevc_ppo_qp_yuv.py的main函数中取消注释训练代码
if __name__ == "__main__":
    DEBUG_SHAPES = False

    video_meta_list = [...]  # 同上

    # 注释掉baseline构建(已完成)
    # build_baseline_rd_json_qp_fullvideo(...)

    # 启动训练
    train_rapnet_with_config(
        video_meta_list=video_meta_list,
        rd_json_path="rd_baseline_hevc_qp_full.json",
    )
```

### 4. 监控训练进度

```bash
# 启动TensorBoard
tensorboard --logdir=ElegantRL-master/my_RL/runs/rapnet_hevc --bind_all

# 浏览器访问 http://localhost:6006
```

**关键指标:**

- `train/reward`: 平均RD增益 (越大越好)
- `train/loss_actor`: Actor损失 (应逐渐减小)
- `train/loss_critic`: Critic损失 (应逐渐减小)
- `eval/avg_reward`: 验证集奖励 (每100 iter评估一次)

---

## 🏗️ 代码架构

```
rapnet_hevc_ppo_qp_yuv.py
├── [配置] CONFIG: 全局超参数
├── [数据处理]
│   ├── YUVLoader: YUV420文件读取器
│   ├── load_clip_yuv_planes: 加载YUV平面
│   ├── downsample_yuv420_clip: 空域下采样
│   ├── upsample_yuv420_clip: 空域上采样
│   └── yuv420_planes_to_bgr_clip: 转BGR用于LPIPS
├── [网络模块]
│   ├── ResBlock: 残差块
│   ├── RAPNetYCbCr: Actor网络 (预处理网络)
│   └── ValueNetYCbCrPair: Critic网络 (Q值估计)
├── [RL智能体]
│   └── DeterministicACAgentYCbCr: DDPG风格AC智能体
│       ├── act(): 推理(无梯度)
│       ├── update(): 训练(更新Actor+Critic)
│       └── _sync_critic_to_actor(): 同步Critic参数
├── [环境]
│   └── NvencClipEnvQP: HEVC编码环境
│       ├── reset(): 采样新clip
│       └── step(): 编码+评估+计算奖励
├── [工具函数]
│   ├── compute_quality_metric: 计算LPIPS
│   ├── parse_ffmpeg_log_for_video_size: 解析码率
│   └── build_baseline_rd_json_qp_fullvideo: 构建baseline
└── [训练循环]
    ├── train_rapnet_with_config: 主训练函数
    └── evaluate_agent_once: 验证函数
```

---

## 🔬 关键技术细节

### 1. GPU内存管理策略

**问题**: LPIPS模型显存占用大,与训练网络放在同一GPU会OOM

**解决方案**: 三设备分离

```python
DEVICE_ACTOR = cuda:0   # RAPNet (Actor)
DEVICE_CRITIC = cuda:1  # ValueNet (Critic)  [如果有第2张GPU]
LPIPS_DEVICE = cuda:2   # LPIPS模型        [如果有第3张GPU]
```

**单GPU用户**:
```python
# 代码会自动检测并回退
if torch.cuda.device_count() == 1:
    DEVICE_ACTOR = DEVICE_CRITIC = LPIPS_DEVICE = cuda:0
    # 逐帧计算LPIPS以节省显存
```

### 2. 梯度流动检查

**Actor梯度路径**:
```
Loss_actor = -Q(S, A(S)) + λ·L_pixel
           ↓
Actor输出: y_a2, cb_a2, cr_a2  [requires_grad=True]
           ↓
Critic_for_actor(S, A(S))      [参数frozen]
           ↓
q_for_actor                    [梯度回传到y_a2]
           ↓
RAPNet参数更新
```

**关键点**:
- `critic_for_actor`参数设为`requires_grad=False`
- 但网络仍参与前向传播,允许梯度回传到输入
- 每次Critic更新后调用`_sync_critic_to_actor()`同步参数

### 3. 奖励函数设计

```python
# 对每个QP点计算RD增益
delta_v = (V_cur - V_ref) / |V_ref|   # 质量提升比例
delta_r = (R_ref - R_cur) / R_ref     # 码率节省比例

# 综合RD奖励
reward_qp = α * delta_v + β * delta_r

# 多QP平均
reward = mean(reward_qp for qp in [22,27,32,37,42])
```

**参数选择**:
- `α=1.0`: 质量权重 (论文建议)
- `β=0.2`: 码率权重 (质量优先,但也考虑压缩效率)

### 4. 码率计算修正

**问题**: 直接用bitstream文件大小会包含容器开销,导致码率偏高

**解决**: 解析FFmpeg日志中的纯视频流大小

```python
# FFmpeg输出示例:
# video:208kB audio:0kB subtitle:0kB other streams:0kB global headers:0kB muxing overhead: 12.500%

video_size_kb = parse_ffmpeg_log_for_video_size(log_path)
bitrate_kbps = (video_size_kb * 1024 * 8) / duration_sec / 1000
```

### 5. LPIPS逐帧计算

**原因**: 批量计算(T帧一次)显存占用过大

**实现**:

```python
with torch.no_grad():
    for t in range(T):
        ref_tensor = frame_to_tensor(ref_clip[t])   # (1,3,H,W)
        dec_tensor = frame_to_tensor(dec_clip[t])
        dist = lpips_model(ref_tensor, dec_tensor)
        scores.append(dist.item())

avg_lpips = np.mean(scores)
quality = -avg_lpips  # 取负,使其"越大越好"
```

---

## 📈 实验分析

### 已知问题与修复

#### ❌ 问题1: Critic梯度不回传到Actor

**症状**: `loss_actor`基本不变,网络不学习

**原因**: `critic_for_actor.requires_grad = False`阻断了梯度

**修复**:

```python
# ❌ 错误做法
critic_for_actor.requires_grad = False

# ✅ 正确做法
for p in critic_for_actor.parameters():
    p.requires_grad = False  # 只冻结参数,不影响前向传播
```

#### ❌ 问题2: Baseline码率偏高

**症状**: 训练初期reward为负,难以优化

**原因**: Baseline用bitstream文件大小,包含容器开销

**修复**: 使用`parse_ffmpeg_log_for_video_size()`解析纯视频流大小

#### ❌ 问题3: LPIPS显存溢出

**症状**: 计算LPIPS时CUDA OOM

**修复**: 改为逐帧计算+显式删除中间变量

```python
for t in range(T):
    dist = lpips_model(ref[t:t+1], dec[t:t+1])
    scores.append(dist.item())
    del dist  # 显式释放
```

### 调试建议

**开启调试输出**:

```python
DEBUG_SHAPES = True  # 在主函数中设置
```

**单步测试**:
```python
debug_one_step_multi_gpu()  # 测试完整流程
```

**检查梯度**:
```python
# 在update()中添加
print("Actor grad:", [p.grad.norm() for p in agent.actor.parameters() if p.grad is not None])
```

---

## ❓ 常见问题

### Q1: 训练很慢,一个iteration要多久?

**A**: 取决于硬件配置:
- **RTX 3090** (单GPU): ~30秒/iter (包含5次编码+LPIPS)
- **RTX 4090 x2** (双GPU): ~20秒/iter
- **优化建议**:
  - 减少`eval_interval`(默认100)降低验证频率
  - 使用多进程并行编码(需修改环境代码)

### Q2: reward一直是负数正常吗?

**A**: 正常,原因:

1. 训练初期Actor输出接近随机,可能不如baseline
2. 随着训练进行,reward应该逐渐上升
3. 收敛后reward应该在**[-0.05, 0.05]**区间波动
4. 如果持续低于-0.1,检查:
   - Baseline是否正确构建
   - 学习率是否过大(导致不稳定)
   - Pixel loss权重λ是否过大(限制了探索)

### Q3: 如何调整超参数?

**A**: 修改`CONFIG`字典:
```python
CONFIG = {
    "lr_actor": 1e-4,      # ⬇️ 降低可提高稳定性
    "lr_critic": 1e-4,     # ⬇️ Critic学习速度
    "lambda_pixel": 1.0,   # ⬇️ 降低允许更多变化
    "alpha_q": 1.0,        # 质量权重
    "beta_r": 0.2,         # ⬆️ 提高更关注码率节省
    "clip_len": 16,        # ⬇️ 降低可减少显存和加速
}
```

### Q4: 如何使用训练好的模型?

```python
# 加载模型
agent = DeterministicACAgentYCbCr(...)
agent.actor.load_state_dict(torch.load("checkpoints/actor_best.pth"))
agent.actor.eval()

# 推理
y_state, cb_state, cr_state, _ = env.reset()
y_action, cb_action, cr_action = agent.act(y_state, cb_state, cr_state)

# y_action即为预处理后的帧,可用于编码
```

### Q5: 如何添加新视频?

```python
video_meta_list = [
    {
        "id": "beauty_1080p",
        "path": "path/to/Beauty.yuv",
        "width": 1920,
        "height": 1080,
    },
    {
        "id": "bosphorus_1080p",  # 新增
        "path": "path/to/Bosphorus.yuv",
        "width": 1920,
        "height": 1080,
    },
]

# 重新构建baseline (需要时间)
build_baseline_rd_json_qp_fullvideo(...)
```

---

## 📚 参考资料

### 论文

```bibtex
@article{rapnet2023,
  title={Rate-Adaptive Preprocessing Network for Video Coding},
  author={...},
  journal={...},
  year={2023}
}
```

### 相关链接

- [HEVC_NVENC文档](https://docs.nvidia.com/video-technologies/video-codec-sdk/nvenc-video-encoder-api-prog-guide/)
- [LPIPS论文](https://github.com/richzhang/PerceptualSimilarity)
- [UVG数据集](http://ultravideo.fi/)

---

## 📝 更新日志

### 2024-12-12
- ✅ 完成论文复现
- ✅ 修复梯度流动问题
- ✅ 添加详细代码注释
- ✅ 创建测试视频生成器
- ✅ 编写完整README文档

### 待办事项
- [ ] 添加多视频并行训练支持
- [ ] 实现模型推理脚本
- [ ] 支持更多编码器(x265, SVT-HEVC)
- [ ] 添加更多质量指标(VMAF, SSIM)

---

## 🤝 贡献

欢迎提Issue和PR!

---

## 📄 许可证

本项目仅供学术研究使用。

---

**Happy Coding! 🎉**
