#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NVC 论文作图模板（可直接用于论文的矢量 PDF 输出）

演示两类码控论文必备图：
  1) 2x3 六宫格 RD 曲线（HEVC Class B/C/D/E + UVG + MCL-JCV）
  2) 逐帧码率跟踪曲线（目标码率红线 + 实际码率 + 场景切换标注）

用法：
  python plot_rd_curve_template.py
把示例数据换成你的实验数据（bpp/psnr 数组）即可。
输出为 PDF（论文用，矢量）+ PNG（预览用）。
"""

from pathlib import Path
import sys

# 受管 Python 环境下加载绘图规范（Agg 后端 + 字体配置）
sys.path.insert(0, str(Path(sys.executable).parent.parent.parent))
from daimon_runtime import setup_plot  # noqa: E402

import numpy as np  # noqa: E402
import matplotlib.pyplot as plt  # noqa: E402

setup_plot()

# ---------------------------------------------------------------------------
# 论文图全局规范：Times 字体、嵌入字体（IEEE eXpress 检查要求 type 42）
# ---------------------------------------------------------------------------
plt.rcParams.update({
    "font.family": "serif",
    "font.serif": ["Times New Roman", "Nimbus Roman", "DejaVu Serif"],
    "mathtext.fontset": "stix",
    "font.size": 8,
    "axes.labelsize": 8.5,
    "axes.titlesize": 9,
    "legend.fontsize": 7,
    "xtick.labelsize": 7.5,
    "ytick.labelsize": 7.5,
    "lines.linewidth": 1.4,
    "lines.markersize": 4.5,
    "pdf.fonttype": 42,          # TrueType 嵌入，避免 Type 3 字体
    "ps.fonttype": 42,
})

# 方法配色/marker 约定（全文保持一致）：
# 传统 anchor 用黑灰，其他 NVC 用冷色，Ours 用红色加粗置顶
STYLE = {
    "VTM-17.0 (RA)":  dict(color="black",     marker="s", ls="-",  lw=1.4, zorder=3),
    "HM-16.20 (RA)":  dict(color="dimgray",   marker="^", ls="--", lw=1.2, zorder=3),
    "DCVC-DC":        dict(color="#1f77b4",   marker="o", ls="-",  lw=1.2, zorder=4),
    "DCVC-RT":        dict(color="#2ca02c",   marker="D", ls="-",  lw=1.2, zorder=4),
    "Zhang et al. (ICLR'24)": dict(color="#9467bd", marker="v", ls="-.", lw=1.2, zorder=4),
    "Ours":           dict(color="#d62728",   marker="*", ls="-",  lw=2.0, zorder=10),
}


def fake_rd(bpp_base, quality_shift):
    """示意数据生成：真实使用时替换为实验测得的 (bpp, psnr)。"""
    bpp = np.array(bpp_base)
    psnr = 30.0 + 9.5 * np.log10(bpp * 8 + 0.05) + quality_shift
    return bpp, psnr


def plot_rd_curves(out_dir: Path):
    """2x3 六宫格 RD 曲线：横轴 bpp，纵轴 PSNR (dB)。"""
    datasets = ["HEVC Class B", "HEVC Class C", "HEVC Class D",
                "HEVC Class E", "UVG", "MCL-JCV"]
    # 各数据集大致码率区间（示意）
    bpp_ranges = {
        "HEVC Class B": [0.03, 0.06, 0.12, 0.25, 0.50],
        "HEVC Class C": [0.04, 0.08, 0.15, 0.30, 0.60],
        "HEVC Class D": [0.06, 0.10, 0.20, 0.40, 0.80],
        "HEVC Class E": [0.05, 0.09, 0.18, 0.35, 0.70],
        "UVG":          [0.04, 0.08, 0.16, 0.35, 0.70],
        "MCL-JCV":      [0.04, 0.07, 0.14, 0.28, 0.55],
    }
    shifts = {  # 各方法相对质量偏移（示意）
        "VTM-17.0 (RA)": 0.0, "HM-16.20 (RA)": -1.6,
        "DCVC-DC": 0.6, "DCVC-RT": 0.45,
        "Zhang et al. (ICLR'24)": 0.55, "Ours": 1.0,
    }

    # 双栏通栏图宽约 7.16 in；单栏图用 3.3 in
    fig, axes = plt.subplots(2, 3, figsize=(7.16, 4.3))
    rng = np.random.default_rng(0)
    for ax, name in zip(axes.flat, datasets):
        for method, st in STYLE.items():
            bpp, psnr = fake_rd(bpp_ranges[name], shifts[method])
            psnr = psnr + rng.normal(0, 0.05, size=len(psnr))  # 模拟实测抖动
            ax.plot(bpp, psnr, label=method, **st)
        ax.set_title(name)
        ax.set_xlabel("bpp")
        ax.set_ylabel("PSNR (dB)")
        ax.grid(True, ls="--", lw=0.5, color="gray", alpha=0.35)
    # 图例统一放最下面，横排
    handles, labels = axes.flat[0].get_legend_handles_labels()
    fig.legend(handles, labels, loc="lower center", ncol=3,
               frameon=False, bbox_to_anchor=(0.5, -0.02))
    fig.tight_layout(rect=(0, 0.05, 1, 1))
    fig.savefig(out_dir / "rd_curve_example.pdf", bbox_inches="tight")
    fig.savefig(out_dir / "rd_curve_example.png", dpi=300, bbox_inches="tight")
    plt.close(fig)


def plot_bitrate_tracking(out_dir: Path):
    """逐帧码率跟踪：红色目标线 + 实际码率曲线 + 场景切换标注。"""
    n = 96  # 前 96 帧惯例
    frames = np.arange(n)
    target = 0.20  # 目标 bpp（示意）
    rng = np.random.default_rng(7)
    actual = target + rng.normal(0, 0.012, n)
    actual[32:48] += 0.03   # 模拟一段剧烈运动导致码率抬升
    scene_cuts = [0, 32, 64]

    fig, ax = plt.subplots(figsize=(3.3, 2.2))  # 单栏图
    ax.axhline(target, color="red", ls="--", lw=1.2, label="Target bpp")
    ax.plot(frames, actual, color="#1f77b4", lw=1.4, label="Actual bpp (Ours)")
    for sc in scene_cuts[1:]:
        ax.axvline(sc, color="gray", ls=":", lw=0.9)
    ax.annotate("scene cut", xy=(32, target + 0.045), fontsize=7,
                ha="center", color="dimgray")
    ax.set_xlabel("Frame Index")
    ax.set_ylabel("bpp")
    ax.set_xlim(0, n - 1)
    ax.grid(True, ls="--", lw=0.5, color="gray", alpha=0.35)
    ax.legend(frameon=False, loc="upper right")
    fig.tight_layout()
    fig.savefig(out_dir / "bitrate_tracking_example.pdf", bbox_inches="tight")
    fig.savefig(out_dir / "bitrate_tracking_example.png", dpi=300, bbox_inches="tight")
    plt.close(fig)


if __name__ == "__main__":
    out = Path(__file__).resolve().parent
    plot_rd_curves(out)
    plot_bitrate_tracking(out)
    print("saved:")
    for f in ["rd_curve_example.pdf", "rd_curve_example.png",
              "bitrate_tracking_example.pdf", "bitrate_tracking_example.png"]:
        print(" -", out / f)
