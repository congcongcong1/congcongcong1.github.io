# -*- coding: utf-8 -*-
"""生成「拍照构图六式」六宫格示意图"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle, Polygon, Arc
from matplotlib.lines import Line2D
import numpy as np

# 中文字体
plt.rcParams["font.sans-serif"] = ["PingFang SC", "Hiragino Sans GB", "STHeiti", "Arial Unicode MS"]
plt.rcParams["axes.unicode_minus"] = False

BG = "#141821"        # 面板外背景
FRAME = "#1d2230"     # 画面底
SKY_TOP = "#ff9a3c"   # 夕阳橙
SKY_BOT = "#c2452d"
GRID = "#ffffff"      # 九宫格虚线
ZONE = "#ff4d4f"      # 红框
TEXT = "#f2f2f2"
SUB = "#b8bec9"


def draw_person(ax, x, y, h, color="#20242e"):
    """简单人物剪影：头 + 身体"""
    r = h * 0.14
    ax.add_patch(Circle((x, y + h - r), r, color=color, zorder=6))
    ax.add_patch(FancyBboxPatch((x - h * 0.16, y), h * 0.32, h * 0.78,
                                boxstyle="round,pad=0,rounding_size=%f" % (h * 0.12),
                                color=color, zorder=6))


def draw_grid(ax):
    """九宫格虚线"""
    for f in (1 / 3, 2 / 3):
        ax.add_line(Line2D([f, f], [0.02, 0.98], color=GRID, lw=0.9, ls=(0, (4, 3)), alpha=0.75, zorder=5))
        ax.add_line(Line2D([0.02, 0.98], [f, f], color=GRID, lw=0.9, ls=(0, (4, 3)), alpha=0.75, zorder=5))


def zone_rect(ax, x, y, w, h, label=None, lx=None, ly=None):
    ax.add_patch(Rectangle((x, y), w, h, fill=False, ec=ZONE, lw=2.2, zorder=7))
    if label:
        ax.text(lx if lx is not None else x + w / 2, ly if ly is not None else y + h + 0.035,
                label, color=ZONE, fontsize=9.5, fontweight="bold", ha="center", zorder=8)


def sunset_sky(ax, y0=0.0, y1=1.0):
    """竖向夕阳渐变"""
    grad = np.linspace(0, 1, 128).reshape(-1, 1)
    from matplotlib.colors import LinearSegmentedColormap
    cmap = LinearSegmentedColormap.from_list("sunset", ["#5a1d2b", SKY_BOT, SKY_TOP, "#ffd9a0"])
    ax.imshow(grad, extent=[0, 1, y0, y1], aspect="auto", cmap=cmap, zorder=0)


def new_panel(fig, pos, title):
    ax = fig.add_axes(pos)
    ax.set_xlim(0, 1); ax.set_ylim(0, 1)
    ax.axis("off")
    ax.add_patch(Rectangle((0, 0), 1, 1, color=FRAME, zorder=-1))
    return ax


def panel_frame(fig, pos, title, subtitle):
    """面板 = 画面框 + 标题"""
    x, y, w, h = pos
    ax = new_panel(fig, pos, title)
    fig.text(x + w / 2, y + h + 0.024, title, ha="center", va="bottom",
             color=TEXT, fontsize=13, fontweight="bold")
    fig.text(x + w / 2, y + h + 0.007, subtitle, ha="center", va="bottom",
             color=SUB, fontsize=9)
    return ax


fig = plt.figure(figsize=(13.5, 11.2), dpi=200)
fig.patch.set_facecolor(BG)

PW, PH = 0.283, 0.283 * 13.5 / 11.2 * 0.92  # 面板宽、高（保持画面接近 4:3）
GAP_X, GAP_Y = 0.055, 0.145
X0, Y0 = 0.055, 0.075

titles = [
    ("① 地标建筑 · 左右错开", "建筑：左/右三分线偏上　人：另一侧三分线偏下"),
    ("② 氛围背景 · 上满下人", "氛围铺满上半部（1/2~2/3）　人站中间偏下"),
    ("③ 对称场景 · 人站中线", "门洞 / 长廊 / 倒影，人站画面正中央"),
    ("④ 引导线 · 人站汇聚点", "人站线条汇聚的消失点附近"),
    ("⑤ 大景小人 · 大面积留白", "景占 2/3 以上，人靠边偏下，可只占 1/10"),
    ("⑥ 框景 · 借框套人", "窗 / 门洞 / 拱廊做前景框，人放框内偏中下"),
]

axes = []
for i in range(6):
    r, c = divmod(i, 3)
    x = X0 + c * (PW + GAP_X)
    y = Y0 + (1 - r) * (PH + GAP_Y) if False else Y0 + (1 - r) * (PH + GAP_Y)
    y = Y0 + (1 - r) * (PH + GAP_Y)
    pos = (x, y, PW, PH)
    axes.append(panel_frame(fig, pos, *titles[i]))

# ---------- ① 地标建筑 ----------
ax = axes[0]
sunset_sky(ax, 0.30, 1.0)
# 海面
ax.add_patch(Rectangle((0, 0), 1, 0.32, color="#3d1620", zorder=1))
for i in range(6):  # 海面反光
    ax.add_line(Line2D([0.08 + 0.02 * i, 0.5 - 0.03 * i], [0.05 + 0.045 * i] * 2,
                       color="#ff9a3c", lw=1.2, alpha=0.55 - i * 0.07, zorder=2))
# 太阳
ax.add_patch(Circle((0.30, 0.42), 0.055, color="#ffe6b0", zorder=3))
# 桥/塔剪影：左三分线偏上
bx = 1 / 3 - 0.085
ax.add_patch(Rectangle((bx, 0.32), 0.10, 0.20, color="#241a20", zorder=4))          # 塔身
ax.add_patch(Polygon([(bx - 0.045, 0.32), (bx + 0.05, 0.52), (bx + 0.145, 0.32)], color="#241a20", zorder=4))
ax.add_line(Line2D([bx + 0.05, bx + 0.05], [0.52, 0.60], color="#241a20", lw=2.4, zorder=4))  # 塔尖
zone_rect(ax, 1/3 - 0.10, 0.32, 0.20, 0.30, "建筑", lx=1/3, ly=0.655)
# 人：右三分线偏下
px = 2 / 3 + 0.02
draw_person(ax, px, 0.10, 0.24)
zone_rect(ax, 2/3 - 0.065, 0.06, 0.17, 0.30, "人", lx=2/3 + 0.02, ly=0.385)
draw_grid(ax)

# ---------- ② 氛围背景 ----------
ax = axes[1]
sunset_sky(ax, 0.28, 1.0)   # 氛围填满上半部
ax.add_patch(Rectangle((0, 0), 1, 0.28, color="#2a1420", zorder=1))
ax.add_patch(Circle((0.5, 0.62), 0.09, color="#ffe6b0", zorder=2))
# 云
for cx, cy, cw in [(0.25, 0.80, 0.30), (0.68, 0.88, 0.34), (0.45, 0.72, 0.22)]:
    ax.add_patch(Arc((cx, cy), cw, 0.05, theta1=0, theta2=180, color="#ffcf9e", lw=1.6, alpha=0.8, zorder=2))
draw_person(ax, 0.5, 0.10, 0.20)  # 中间偏下
zone_rect(ax, 0.335, 0.05, 0.33, 0.27, "人：中间偏下", ly=0.345)
draw_grid(ax)

# ---------- ③ 对称场景 ----------
ax = axes[2]
# 长廊透视：两侧墙 + 顶部
ax.add_patch(Polygon([(0, 0), (0.32, 0.30), (0.32, 0.72), (0, 1)], color="#2c2f3a", zorder=1))
ax.add_patch(Polygon([(1, 0), (0.68, 0.30), (0.68, 0.72), (1, 1)], color="#2c2f3a", zorder=1))
ax.add_patch(Polygon([(0, 1), (0.32, 0.72), (0.68, 0.72), (1, 1)], color="#22252e", zorder=1))
ax.add_patch(Rectangle((0.32, 0), 0.36, 0.30, color="#4a3a2e", zorder=1))  # 地面
# 尽头亮门洞
ax.add_patch(Rectangle((0.44, 0.30), 0.12, 0.42, color="#ffce8a", zorder=2))
# 人站中线
draw_person(ax, 0.5, 0.315, 0.30)
zone_rect(ax, 0.41, 0.28, 0.18, 0.46, "人：正中央", ly=0.775)
draw_grid(ax)

# ---------- ④ 引导线 ----------
ax = axes[3]
sunset_sky(ax, 0.35, 1.0)
ax.add_patch(Rectangle((0, 0), 1, 0.35, color="#33161f", zorder=1))
# 公路：汇聚向消失点 (0.36, 0.42)
vx, vy = 0.36, 0.42
road_color = "#241f28"
ax.add_patch(Polygon([(vx, vy), (-0.35, -0.05), (1.45, -0.05)], color=road_color, zorder=2))
# 分道线
for t in np.linspace(0.12, 0.9, 9):
    x1 = vx + t * (-0.35 - vx); y1 = vy + t * (-0.05 - vy)
    x2 = vx + t * (1.45 - vx)
    ax.add_line(Line2D([x1, x2], [y1, -0.05 + t * (-0.05 - -0.05) * 0 - 0.05 * t + (y1 - (-0.05)) * 0 + (-0.05) * t], visible=False))
# 用汇聚的边线代替
ax.add_line(Line2D([vx, -0.35], [vy, -0.05], color="#ffce8a", lw=1.6, alpha=0.9, zorder=3))
ax.add_line(Line2D([vx, 1.45], [vy, -0.05], color="#ffce8a", lw=1.6, alpha=0.9, zorder=3))
# 虚线车道线（透视缩短）
for t in np.linspace(0.1, 0.85, 8):
    xa = vx + t * (0.55 - vx); ya = vy + t * (-0.05 - vy)
    xb = vx + (t + 0.045) * (0.55 - vx); yb = vy + (t + 0.045) * (-0.05 - vy)
    ax.add_line(Line2D([xa, xb], [ya, yb], color="#ffffff", lw=1.8, alpha=0.85, zorder=3))
# 护栏线
ax.add_line(Line2D([vx, -0.1], [vy + 0.06, 0.05], color="#b8bec9", lw=1.1, alpha=0.7, zorder=3))
ax.add_line(Line2D([vx, 1.1], [vy + 0.06, 0.02], color="#b8bec9", lw=1.1, alpha=0.7, zorder=3))
# 人站消失点附近
draw_person(ax, vx + 0.03, 0.36, 0.14)
ax.add_patch(Circle((vx, vy), 0.016, color=ZONE, zorder=6))
zone_rect(ax, vx - 0.09, 0.33, 0.19, 0.20, "人：消失点附近", lx=vx + 0.005, ly=0.555)
draw_grid(ax)

# ---------- ⑤ 大景小人 ----------
ax = axes[4]
sunset_sky(ax, 0.45, 1.0)
# 远山两层
ax.add_patch(Polygon([(0, 0.42), (0.22, 0.72), (0.42, 0.50), (0.62, 0.78), (0.85, 0.52), (1, 0.66), (1, 0.42)],
                     color="#4a2436", zorder=1))
ax.add_patch(Polygon([(0, 0.42), (0.15, 0.58), (0.38, 0.42), (0.60, 0.60), (0.80, 0.44), (1, 0.55), (1, 0.38), (0, 0.38)],
                     color="#2e1a28", zorder=2))
ax.add_patch(Rectangle((0, 0), 1, 0.38, color="#241722", zorder=3))
ax.add_patch(Circle((0.72, 0.86), 0.05, color="#ffe6b0", zorder=2))
# 小人：右下，仅占约 1/10 高度
draw_person(ax, 0.76, 0.06, 0.075)
zone_rect(ax, 0.70, 0.04, 0.16, 0.11, "人：靠边偏下", lx=0.78, ly=0.175)
draw_grid(ax)

# ---------- ⑥ 框景 ----------
ax = axes[5]
sunset_sky(ax, 0, 1.0)
ax.add_patch(Circle((0.62, 0.70), 0.075, color="#ffe6b0", zorder=1))
# 前景暗框（窗 / 门洞）
frame_c = "#101319"
ax.add_patch(Rectangle((0, 0.78), 1, 0.22, color=frame_c, zorder=4))   # 上
ax.add_patch(Rectangle((0, 0), 1, 0.14, color=frame_c, zorder=4))      # 下
ax.add_patch(Rectangle((0, 0), 0.16, 1, color=frame_c, zorder=4))      # 左
ax.add_patch(Rectangle((0.84, 0), 0.16, 1, color=frame_c, zorder=4))   # 右
# 框内人偏中下
draw_person(ax, 0.48, 0.20, 0.34)
zone_rect(ax, 0.33, 0.16, 0.32, 0.40, "人：框内偏中下", ly=0.585)
draw_grid(ax)

# ---------- 底部说明 ----------
fig.text(0.5, 0.028,
         "红框 = 主体该放的区域　·　虚线 = 九宫格参考线（手机设置里搜「网格」开启）　·　口诀：有地标对角放，纯氛围上满下人，对称景站中间，有线条守终点，景够大人要小，见框就钻框里偏下",
         ha="center", va="center", color=SUB, fontsize=10.5)
fig.text(0.5, 0.958, "拍 照 构 图 六 式", ha="center", va="center",
         color=TEXT, fontsize=21, fontweight="bold")

out = "public/notes-assets/photography-composition/composition-diagram.png"
import os
os.makedirs(os.path.dirname(out), exist_ok=True)
fig.savefig(out, facecolor=BG, bbox_inches="tight", pad_inches=0.25)
print("saved:", out)
