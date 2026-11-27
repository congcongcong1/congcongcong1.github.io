# 基于强化学习的低码率 NVENC 视频编码前处理系统设计报告

## 1. 项目概述 (Project Overview)

本项目旨在复现并改进论文 *M9322_v2* 中提出的 **RAPNet (Rate-Distortion-Aware Video Pre-Processing Network)**。我们将原论文中的软件编码器（x265/VVenC）替换为 **NVIDIA NVENC 硬件编码器**，专注于低码率场景（200/400/800 kbps）下的画质优化。系统采用 **Actor-Critic** 强化学习框架，通过前处理网络（Actor）与价值网络（Critic）的协同训练，实现端到端的率失真（RD）性能提升。

------

## 2. 环境定义 (Environment Setup)

### 2.1 真实编码环境

**结论：是的，环境就是真实的 NVENC 编码环境。**

在强化学习中，环境（Environment）被定义为一个“黑盒”。在本涵盖中，由于 NVENC 闭源且不可微，我们通过 Python 的 `subprocess` 调用系统级 FFmpeg 指令来构建环境。

### 2.2 环境创建与定义 (`NvencClipEnvQP`)

环境通过继承或模拟 `gym.Env` 的接口进行构建，核心交互流程 (`step` 函数) 如下：

1. **输入动作**：接收 RAPNet 输出的预处理视频帧（YUV 格式）。
2. **物理执行**：
   - **写入**：将 Tensor 数据转换为二进制 `.yuv` 文件写入硬盘（或内存盘）。
   - **编码**：调用 `ffmpeg -c:v hevc_nvenc` 进行硬件编码，生成比特流文件（Bitstream）。
   - **解码**：调用 `ffmpeg` 将比特流解码为重建视频（Reconstructed YUV）。
3. **计算反馈**：
   - **码率 ($R_{cur}$)**：读取比特流文件大小计算实际码率。
   - **质量 ($V_{cur}$)**：对比“重建视频”与“原始未处理视频”，计算 **VMAF** (或 LPIPS) 分数。
4. **奖励计算**：基于当前 $(R_{cur}, V_{cur})$ 与 Baseline 曲线的差异计算 Reward。

------

## 3. 状态空间 (State Space)

**定义：** 状态 $S$ 是**原始视频帧序列 (Raw Video Frames)**。

- **输入内容**：根据论文方法，RAPNet (Actor) 直接接收未经处理的原始视频帧。
- **数据格式**：为了适配网络结构（Figure 3），我们将视频帧转换为 **YCbCr 4:2:0** 格式。
- **张量形状**：
  - 论文中为逐帧处理，但为了利用时序信息及显存效率，我们将 $T$ 帧作为一个 Batch 输入。
  - 输入 Tensor 形状为 $(B \times T, 3, H, W)$。
  - *注：色度分量 (Cb, Cr) 需先通过双线性插值上采样至与亮度 (Y) 相同的分辨率，然后拼接作为输入。*

------

## 4. 动作空间 (Action Space)

**定义：** 动作 $A$ 是 **连续的、像素级的预处理视频帧**。

- **类型**：**连续动作空间 (Continuous Action Space)**。
- **生成方式**：
  - 不同于 PPO 的随机高斯采样，本项目采用 **确定性策略 (Deterministic Policy)**。
  - RAPNet 输出的是一张确定的图像（或残差图），即 $A(S) = \text{RAPNet}(S)$。
- **物理含义**：动作 $A$ 本身就是一张图像。为了训练稳定性，RAPNet 输出的是**残差 (Residual)** $\Delta$，最终动作是 $\text{Clamp}(S + \Delta, 0, 1)$。
- **与环境交互**：这个生成的帧 $A$ 直接被送入 NVENC 编码器，代替原图进行编码。

------

## 5. 奖励函数 (Reward Function)

**定义：** 基于参考率失真（RD）曲线引导的奖励建模。

根据论文公式，奖励并非简单的线性加权，而是相对于 Baseline (未处理时的编码效果) 的**增益比例**。

1. **Baseline 构建 (离线阶段)**：

   - 在训练前，使用 NVENC 在 `constqp` 模式下（QP = 22, 27, 32, 37, 42）对所有训练视频进行编码。
   - 记录基准码率 $R_{ref}$ 和基准质量 $V_{ref}$ (VMAF)。

2. **在线计算 (训练阶段)**：

   - 在每个 Step，环境计算当前的码率 $R_{cur}$ 和质量 $V_{cur}$。

   - Reward 公式：

     

     $$Reward = \alpha \cdot \frac{V_{cur} - V_{ref}}{|V_{ref}|} - \beta \cdot \frac{R_{cur} - R_{ref}}{R_{ref}}$$

   - *解释*：我们希望质量增益 ($\Delta V$) 越大越好，同时码率增量 ($\Delta R$) 越小越好（由负号控制）。

------

## 6. 网络损失函数建模 (Network Loss)

本项目采用 **Actor-Critic (DDPG style)** 架构，损失函数严格对应论文 **3. 训练方法** 及 **Figure 3**。

![image-20251210221038949](C:\Users\13290\AppData\Roaming\Typora\typora-user-images\image-20251210221038949.png)

![image-20251210221101428](C:\Users\13290\AppData\Roaming\Typora\typora-user-images\image-20251210221101428.png)

### 6.1 Critic 网络 (ValueNet)

- **目标**：准确预测当前状态 $S$ 和动作 $A$ 能带来的预期奖励 $Q$。

- **输入**：拼接后的 $(S, A)$ 对。

- Loss 函数：最小化预测 Q 值与真实 Reward 的均方误差 (MSE)。

  

  $$\mathcal{L}_{ValueNet} = \text{MSE}(Q(S, A), Reward)$$

  

  注：由于是单步交互（处理一段视频即结束），这里的 Target 就是当前的 Reward。

### 6.2 Actor 网络 (RAPNet)

- **目标**：生成能让 Critic 打出高分的图像，同时保持图像内容不崩坏。

- **Loss 函数**：由两部分组成。

  1. Action Loss (策略梯度)：最大化 Critic 的评分 $Q$。

     

     $$\mathcal{L}_{action} = -\mathbb{E}[Q(S, A)]$$

  2. Pixel Loss (内容约束)：强制预处理后的帧 $A$ 与原图 $S$ 在像素上保持接近，防止产生伪影或颜色失真。

     

     $$\mathcal{L}_{pixel} = \lambda \cdot [6 \times \text{MSE}(A_Y, S_Y) + \text{MSE}(A_{Cb}, S_{Cb}) + \text{MSE}(A_{Cr}, S_{Cr})]$$

- 总 Loss：

  

  $$\mathcal{L}_{RAPNet} = \mathcal{L}_{action} + \mathcal{L}_{pixel}$$

------

## 7. 网络架构设计细节 (对照 Figure 修正)
![image-20251210221101428](C:\Users\13290\AppData\Roaming\Typora\typora-user-images\image-20251210221101428.png)
基于代码复现过程中的仔细核对，模型结构如下：

### 7.1 RAPNet (Actor)

- **结构特点**：包含 **Pixel Unshuffle** 和 **Pixel Shuffle** 操作。
- **流程**：
  1. 输入拼接 (Y + Upsampled CbCr) -> **Pixel Unshuffle** (下采样空间，扩充通道)。
  2. Conv + LeakyReLU -> **5个 ResBlock** (残差学习)。
  3. Conv + LeakyReLU -> **Pixel Shuffle** (恢复空间分辨率)。
  4. 输出残差叠加 -> 下采样回 YCbCr 4:2:0。

### 7.2 ValueNet (Critic)

- **结构特点**：**无 ResBlock**，纯卷积融合网络。
- **流程**：
  1. **双分支提取**：输入分支 (Raw) 和 输出分支 (Processed) 分别通过 `Conv -> LeakyReLU -> Conv` 提取特征。
  2. **特征融合**：Concat 两个分支特征。
  3. **回归预测**：`Conv 3x3` -> `AvgPool` (全局池化) -> `MLP` (Linear -> ReLU -> Linear) 输出标量 Q 值。

------

## 8. 训练设置 (Training Strategy)

- **Batch Size**: 设置为 **1** (即每次 Update 使用一段连续的视频 Clip)。
- **Input Batching**: 虽然 Batch Size 为 1，但在网络内部，我们将 Clip 中的 $T$ 帧（例如 16 帧）在 batch 维度合并输入，以并行处理。
- **优化器**: Adam，学习率 $1e-4$，每 1000 次迭代衰减为原来的 $1/3$。
- **多 QP 训练**: 在每个 Step 中，对同一段视频分别在 QP=22, 27, 32, 37, 42 下编码，取平均奖励，以确保网络适应不同的码率场景。





从这次的 `debug_one_step_multi_gpu` 输出来看，整条链路是 **正确且按你设计的方式在跑** 的，而且已经实现了：

- Actor 在 `cuda:0` 上训练；
- Critic 在 `cuda:1` 上训练；
- LPIPS 一样在 `cuda:0` 上跑；
- 维度、YUV→NVENC→LPIPS→Reward→Actor/Critic 更新 全流程是闭合的。

我按链路顺序帮你把“哪里正确、为什么正确”拆开说明一下。



## 代码解构



------

## 1. 多 GPU 放置是否正确？

日志开头：

```
[CUDA] available=True, device_count=6
[MODEL] actor param device       : cuda:0
[MODEL] critic param device      : cuda:1
[MODEL] critic_for_actor device : cuda:0
```

代表：

- `actor` 的所有参数都在 `cuda:0`；
- `critic`（训练用 ValueNet）在 `cuda:1`；
- `critic_for_actor`（Actor 侧用于前向、不更新参数的副本）在 `cuda:0`。

更新结束后的显存：

```
[CUDA-MEM] device cuda:0 allocated ~ 74.5 MB
[CUDA-MEM] device cuda:1 allocated ~ 17.2 MB
...
```

说明：

- `cuda:0`：RAPNet + critic_for_actor + LPIPS 都在这张卡上，显存占用明显；
- `cuda:1`：只有训练用 Critic 网络，显存也被部分占用；
- 其它卡是 0，说明没有误放到其他卡。

并且训练过程中没有任何 `RuntimeError: Expected all tensors to be on the same device` 之类的错误，说明你在 `update()` 里：

- 把 critic 相关的张量 `.to(device_critic)`；
- 把 actor 相关的张量 `.to(device_actor)`；
- 同时通过 `_sync_critic_to_actor()` 把 Critic 的参数拷贝到副本上；

这套逻辑是自洽且没有跨 device 的 autograd 断链问题的。

------

## 2. Env.reset：YUV 读取与下采样是否正确？

日志：

```
[RESET] video_id: debug_video
  y_1080: (1, 1, 180, 320) cb_1080: (1, 1, 90, 160) cr_1080: (1, 1, 90, 160)
  y_ds: (1, 1, 90, 160) cb_ds: (1, 1, 45, 80) cr_ds: (1, 1, 45, 80)
  y_ds range: 0.0 1.0
```

从这几行可以确认：

1. 你这次 debug 用的是伪造 YUV，分辨率设成 `width=320, height=180, clip_len=1`：
   - Y: `(T=1, C=1, H=180, W=320)`；
   - Cb/Cr: `H/2=90, W/2=160`，典型 `yuv420p` 的布局。
2. `downscale=2` 之后：
   - Y: `(1, 1, 90, 160)`；
   - Cb/Cr 再缩小一半：`(1, 1, 45, 80)`；
      这完全符合 YUV420 + 2x 下采样的关系。
3. `y_ds range: 0.0 1.0`：说明你已经在下采样后做了 `np.clip` 到 `[0,1]`，避免了插值 overshoot（之前出现过 -0.29 / 1.28 的情况，现在已修正）。

Env.reset 返回的 `(y_ds, cb_ds, cr_ds)` 就是后续 RL 状态的 Y/Cb/Cr 分量，非常合理。

------

## 3. Agent.act：RAPNet 的输入维度和数值是否正确？

日志：

```
[DEBUG] Agent.act() ...
[ACT] state shapes: Y (1, 1, 90, 160) Cb (1, 1, 45, 80) Cr (1, 1, 45, 80)
[RAPNet] input shapes: y torch.Size([1, 1, 1, 90, 160]) cb torch.Size([1, 1, 1, 45, 80]) cr torch.Size([1, 1, 1, 45, 80])
         input range y: 0.0 1.0
[DEBUG] Action shapes: Y (1, 1, 90, 160), Cb (1, 1, 45, 80), Cr (1, 1, 45, 80)
```

可以确认：

- Env 输出是 `(T=1, C=1, H, W)`；
- Agent.act 里做了 `unsqueeze(0)`，变成 `(B=1, T=1, C=1, H, W)`，符合你设计的 5D 输入 `(B, T, C, H, W)`；
- RAPNet 输入 range `[0,1]`，没有再出现负值；
- RAPNet 输出的动作 `y_a, cb_a, cr_a` 维度与输入完全一致 `(1,1,90,160)` / `(1,1,45,80)`，说明：
  - PixelUnshuffle / PixelShuffle / 残差结构的维度都没出错；
  - 最后一层没有改变空间分辨率；
  - 你对 Y/Cb/Cr 三支路的上采样、拼接等都处理正确。

这一步确认的是：**Actor（RAPNet）结构在 YUV 通道拆分和 5D 序列维度上是正确的，没有维度不匹配的隐藏 bug。**

------

## 4. Env.step：NVENC + 解码 + LPIPS + Reward 是否正确？

日志：

```
[DEBUG] Env.step() (NVENC + LPIPS) ...
[STEP] action shapes: Y (1, 1, 90, 160) Cb (1, 1, 45, 80) Cr (1, 1, 45, 80)
       action range Y: 0.0 1.0
[*] Initializing LPIPS on cuda:0...
...
    [QP 32] bitrate=2374.6 kbps, V_cur=-0.4998
[DEBUG] Step done, reward = -1.773912385410873
```

这说明：

1. 传入 Env.step 的动作维度与 Env.reset 的状态保持一致，不存在维度错位。
2. NVENC 部分能正确执行：
   - 会先把 `(T,1,H,W)` / `(T,1,H/2,W/2)` 写成一条 `yuv420p`（这里是 160x90 的 downsampled clip）；
   - 用 `ffmpeg -c:v hevc_nvenc -rc constqp -qp 32 ...` 成功编码；
   - 然后再解码为 YUV420，读回 `(T,1,90,160) / (T,1,45,80)`。
      没有 `CalledProcessError` 或 ffmpeg stderr 报错，这在之前多次踩坑后非常关键。
3. LPIPS 部分：
   - 第一次调用会看到：`[*] Initializing LPIPS on cuda:0...`；
   - 用 VGG 后端，说明你现在直接用 PyTorch LPIPS 为质量指标；
   - `V_cur=-0.4998` 正常（我们定义 `V = -LPIPS`，LPIPS 范围约 [0,1]，所以 V 是一个接近 0 的负数）。
4. Reward 部分：
   - `reward = -1.77...`：
      当前是用伪造 RD baseline（`R_ref=1000, V_ref=-0.2`）和这个 clip 的 `(R_cur, V_cur)` 做了参考率失真引导的 reward；
      虽然数值本身没有物理意义（假 baseline），但至少能确定：
     - RD 曲线查表是通的；
     - 你的 reward 公式在数值上是 finite 的，没有出现 NaN / inf；
     - 传给 Agent.update 的 `reward` 是一个标量 float，这一点在后面 Update 日志里也印证了。

简而言之：**编码 / 解码 / LPIPS / RD-based reward 整条链路已经在多 GPU 修改后保持完好**。

------

## 5. Agent.update：Critic 在 GPU1、Actor 在 GPU0，是否正确更新？

日志：

```
[DEBUG] Agent.update() ...
[ValueNet] y_in: torch.Size([1, 1, 1, 90, 160]) y_out: torch.Size([1, 1, 1, 90, 160])
[RAPNet] input shapes: y torch.Size([1, 1, 1, 90, 160]) cb torch.Size([1, 1, 1, 45, 80]) cr torch.Size([1, 1, 1, 45, 80])
         input range y: 0.0 1.0
[ValueNet] y_in: torch.Size([1, 1, 1, 90, 160]) y_out: torch.Size([1, 1, 1, 90, 160])
[UPDATE] reward: -1.7739 Q_pred: -0.0116 pixel_loss_y: 0.0218
[DEBUG] Loss: Actor=0.1762, Critic=3.1057
```

结合我们前面对 `update()` 的设计，可以解读为：

1. **先在 `cuda:1` 上更新 Critic**：
   - 把 `(y_state, cb_state, cr_state, y_action, cb_action, cr_action)` 拷到 `device_critic`；
   - `q_pred = critic(y_s_c, cb_s_c, cr_s_c, y_a_c, cb_a_c, cr_a_c)` 得到标量 Q 值；
   - 使用 `MSELoss(q_pred, reward)` 回传梯度 → `optimizer_critic.step()`；
   - 这部分的前向/反向都在 `cuda:1` 上执行，所以 `cuda:1` 占了大约 17MB 显存。
2. **同步 Critic 参数到 Actor 卡上的副本**：
   - `_sync_critic_to_actor()` 把 `critic.state_dict()` 拷贝给 `critic_for_actor`（在 `cuda:0` 上）；
   - `critic_for_actor.parameters().requires_grad=False`，确保后面不会更新它的参数，只用来给 Actor 提供 Q 值。
3. **再在 `cuda:0` 上更新 Actor**：
   - 把 `y_state, cb_state, cr_state` 拷到 `device_actor`；
   - `y_a2, cb_a2, cr_a2 = actor(y_s_a, cb_s_a, cr_s_a)`；
   - 用 `critic_for_actor` 计算 `Q(S, A(S))`，梯度从 Q 传播到动作，再沿着 Actor 网络反向；
   - Pixel loss：
     - `pixel_loss_y = MSE(y_a2, y_s_a)`
     - `pixel_loss_cb / pixel_loss_cr` 同理
     - 总体 `pixel_loss = 2 * L_y + L_cb + L_cr`（你现在是 2.0 权重，之前你也试过 6.0，这个属于设计选择）
   - Actor 损失：
      `loss_actor = -Q + lambda_pixel * pixel_loss`
   - `loss_actor.backward()` + `optim_actor.step()` 完成 Actor 的更新。
4. 数值方面：
   - `Q_pred ≈ -0.0116`，`reward ≈ -1.77`，在伪造 baseline 下差异较大很正常；
   - `pixel_loss_y ≈ 0.02`，代表预处理前后 Y 通道 MSE 很小（符合“轻微预处理”的直觉）；
   - `loss_actor ≈ 0.17，loss_critic ≈ 3.10`，都是 finite 标量，说明梯度流和优化器都正常工作。

再看显存统计：

```
[CUDA-MEM] device cuda:0 allocated ~ 74.5 MB
[CUDA-MEM] device cuda:1 allocated ~ 17.2 MB
```

- 0 号卡：Actor + critic_for_actor + LPIPS + 中间梯度图；
- 1 号卡：Critic + 中间梯度图；

未出现任何显存碎片 / OOM / device mismatch 报错，说明多 GPU 策略在单步训练里已经完全跑通。

------

## 6. 总结：为什么可以认为“整体链路是正确的”

结合这次 debug 的输出，我们可以说：

1. **YUV 数据流正确**：
   - 伪造 YUV → 读取成 YUV420 planes → 下采样 → 状态给到 Actor；
   - 动作再写回 YUV420 → hevc_nvenc 编码 → 解码 → 上采样 → 再用于 LPIPS/Reward。
2. **网络输入输出维度正确**：
   - 所有 Y/Cb/Cr 分支都遵守 `(T,1,H,W)` / `(B,T,1,H,W)` 的约定；
   - RAPNet / ValueNet 在多次 forward 中输出形状始终一致；
   - 没有出现前面担心的 Channel/T 维度混淆问题。
3. **奖励计算链路正确**：
   - LPIPS 按帧或按 clip 计算，输出 `V_cur`；
   - 与 baseline RD JSON（这里是假的，但结构正确）结合，得到单步 Reward；
   - Reward 传进 Critic MSE 回归、Actor 的 -Q 部分，完全符合你设计的 DDPG-style objective。
4. **多 GPU 训练正确**：
   - Actor 在 `cuda:0`，Critic 在 `cuda:1`，两边的显存都有实际占用；
   - 通过 Critic 副本 `critic_for_actor` 实现“Critic 在 1 号卡训练、Actor 在 0 号卡更新”；
   - 整个 pipe 没有 device mismatch 或跨设备 autograd 问题。
5. **单步 debug 完整跑通**：
   - 从 Env.reset → Agent.act → Env.step → Agent.update 一次完整 roll-out；
   - 所有中间量可视化，loss 和 reward 都是有限值；
   - 最后 clean 掉假 YUV / 假 RD JSON，环境复原