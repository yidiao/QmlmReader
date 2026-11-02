# -*- coding: utf-8 -*-
"""用 PIL 光栅化绘制全站 favicon 的 .ico 兼容回退（根目录 favicon.ico）。

与 favicon.svg 同构：红底圆角方块 + 奶白火炬（金星切口）。
先在 256px 画布上矢量近似绘制，再缩到 16/32/48 三档写入 ico。
"""
from PIL import Image, ImageDraw
import math

RED = (164, 38, 44, 255)      # #a4262c
CREAM = (247, 239, 227, 255)  # #f7efe3
S = 256  # 工作画布

img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# 红底圆角方块
d.rounded_rectangle([0, 0, S - 1, S - 1], radius=56, fill=RED)


def star_points(cx, cy, r_out, r_in, rot=-math.pi / 2):
    pts = []
    for i in range(10):
        r = r_out if i % 2 == 0 else r_in
        a = rot + i * math.pi / 5
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


# 火炬：火滴形（顶点三角形 + 圆底并集）
tip = (128, 20)
flame_cy, flame_r = 86, 42
half = 42
d.polygon([tip, (128 - half, flame_cy), (128 + half, flame_cy)], fill=CREAM)
d.ellipse([128 - flame_r, flame_cy - flame_r, 128 + flame_r, flame_cy + flame_r], fill=CREAM)
# 金星切口（用底色红画星）
d.polygon(star_points(128, 78, 30, 12), fill=RED)

# 火炬托（梯形）
d.polygon([(86, 108), (170, 108), (159, 134), (97, 134)], fill=CREAM)

# 手柄（上宽下窄的圆头棒）
d.polygon([(104, 138), (152, 138), (146, 222), (110, 222)], fill=CREAM)
d.rounded_rectangle([110, 210, 146, 230], radius=8, fill=CREAM)

out = img.resize((256, 256), Image.LANCZOS)
out.save(
    r"D:\AI Pj\myProject\Qmlmreader\favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48)],
)
print("favicon.ico written")
