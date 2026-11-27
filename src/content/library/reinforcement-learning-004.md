# TensorBoard 指标监控指南 (Actor-Critic for Video Encoding)

## 1. 核心训练指标 (Train)

### 奖励函数 (Reward)

- 公式:

  

  $$Reward =  = \alpha \cdot \Delta V + \beta \cdot \Delta R$$

  - **参数说明**:
    - $R_{cur}, R_{ref}$: 码率 (Bitrate)
    - $V_{cur}, V_{ref}$: LPIPS 质量分数 (注意：此处 V 为负值，越接近 0 越好)
    - $\alpha , \beta$: 超参数
  - **含义**: 总奖励，平衡了画质增益 ($\Delta V$) 和码率节省 ($\Delta R$)。

### 损失函数 (Loss)

1. **loss-Actor (Actor 损失)**
   - **公式**: $Loss_{actor} = -Q(s, a) + \lambda \cdot L_{pixel}$
   - **趋势**: 形状不固定。
   - **含义**: 最大化 Critic 评分 ($Q$) 同时约束像素变化 ($L_{pixel}$)。
2. **loss-Critic (Critic 损失)**
   - **公式**: $Loss_{critic} = MSE(Q, Reward)$
   - **趋势**: 一直下降直到平稳 (be stable)。
   - **含义**: 评估网络预测的准确性。

### 学习率 (Learning Rate)

- **策略**: 每 1000 步下降 $\frac{1}{3}$。

### 训练可视化指标 (Train Metrics)

1. **R_cur_qp[qp]**: 当前处理后视频在特定 QP 下的码率。
   - **趋势**: 应该下降，表示 Actor 在学习如何压缩。
2. **V_cur_qp[qp]**: RAPNet 处理后视频的 LPIPS (负值)。
   - **趋势**: 从 -1 $\to$ 0，越接近 0 越好。
3. **V_ref_qp / R_ref_qp**: 原视频 Baseline 的质量和码率。
4. **delta_v_qp ($\Delta V$)**: 质量增益。
   - **目标**: $>0$ 表示比 Baseline 好。
5. **delta_R_qp ($\Delta R$)**: 码率节省。
   - **目标**: $>0$ 表示节省了码率。
6. **delta_v_mean & delta_r_mean**: 平均增益。
   - **理想目标**: $\Delta R > 0$ 且 $\Delta V > 0$。

------

## 2. Q 值与约束相关 (Q-Value & Constraints)

### Q 值预测相关

1. **Q_pred (预测 Q 值)**: Critic 觉得当前动作的分数。
   - **趋势**: 走势应与 Reward 一致，最终趋于重合。
2. **Q_actor (Actor 得到的 Q 值)**:
   - **趋势**: 应当缓慢上升。
3. **td_error_abs**: $|Q_{pred} - Reward|$。
   - **含义**: 与 `loss_critic` 类似，表示预测误差。

### 像素级约束 (Pixel Constraints)

1. **pixel_loss_total**: 处理图和原图的像素级 MSE。
   - **理想状态**: 维持在一个小的正数。如果接近 0，说明完全没更新（没动作）。
2. **pixel_loss_y/cb/cr**: Y, Cb, Cr 通道的损失。
   - **注意**: 人眼对 Y (亮度) 最敏感。
3. **q_over_pixel**: Q 值与像素损失的比值。
   - **公式背景**: $Loss = -Q + \lambda \cdot pixelLoss$
   - **判断**:
     - 极大: Q 值主导优化。
     - 极小: Pixel Loss 主导优化（Actor 不敢动）。
     - **理想状态**: 在中间范围波动。

------

## 3. 梯度相关 (Gradient / Grad)

*监控梯度的健康状况，防止梯度消失或爆炸。*

1. **grad-l2**: 梯度的 L2 范数。
   - $\to 0$: 梯度消失。
   - $\to 1000$: 梯度爆炸。
2. **grad-max_abs**: 最大梯度绝对值 (查看是否有坏点)。
3. **grad-has_grad_ratio**: 有梯度的参数比例。
   - **要求**: 必须为 1 (所有参数都应有梯度)。
4. **grad-zero_param_cnt**: 零梯度统计计数。
   - **要求**: 越少越好。
5. **grad-nan_param_cnt**: NaN 梯度参数计数。
   - **要求**: 必须为 0。
6. **grad-trainable_params**: 可训练参数数量。
   - **要求**: Critic 更新时必须 $>0$，否则视为梯度错误流向 Critic。
7. **grad-total_params**: 网络参数总量，不为 0 即可。

------

## 4. Actor 参数统计 (Actor Statistics)

*分析 Actor 输出的动作分布特性。*

1. **act/Y/mean (通道均值)**
   - **范围**: 0.0 - 1.0。
2. **act/Y/std (通道标准差)**
   - **含义**: 反映滤镜对比度，体现纹理细节。
   - **正常范围**: 一般在 **0.1 - 0.3**。
   - **异常**: 为 0 或 1 说明纹理丢失或饱和。
3. **act/Y/delta_mean**: Action - State 的均值差。
   - **作用**: 看模型倾向于把图像“提亮”还是“变暗”。
4. **act/Y/delta_L2**: 改图幅度 (L2 距离)。
   - **含义**: 反映修改的强烈程度。
   - **趋势**: 上升表示 Actor 开始尝试修改。
5. **act/Y/sat0,sat1**: 饱和比例。
   - **含义**: 多少比例被 Clip 到 0.0 (全黑) 或 1.0 (全白)。
   - **理想状态**: 接近 0。

------

## 5. 新增调试指标 (Debug Metrics)

*用于深入分析模型是在调整亮度、纹理还是边缘。*

1. **delta_y_mean_abs (亮度变化绝对值)**
   - **判断**:
     - $> 10^{-3}$: 还在大幅修改亮度。
     - $< 3 \times 10^{-4}$: 均值行为已无明显变化。
     - $< 10^{-4}$: 可以认为 Actor 正在专注于**纹理 (Texture)** 处理。
2. **HighFreqRatio (高频能量占比)**
   - **公式**: Actor 改动的“高频能量” / 改动的“总能量”。
   - **判断**:
     - $< 0.2$: 主要在改均值/低频信息。
     - **0.3 - 0.6**: 开始动纹理 (**理想状态**)。
     - $> 0.8$: 可能在制造噪点/伪影。
3. **EdgeWeightedDelta (边缘加权变化)**
   - **含义**: 是否在人眼敏感的边缘区域去修改。
   - **判断**:
     - $\approx 0.3$: 主要在平坦区域改动。
     - **0.4 - 0.7**: 开始贴着边缘改 (**理想状态**)。
     - $> 0.7$: 可能过拟合边缘 (Overfitting Edges)。