"""
Generate all stage sprites for Crops in VocabMaster Farm Game
Ensures each growth stage (0 to ripe) has a distinct, beautiful pixel art sprite.
"""
import os, math
from PIL import Image, ImageDraw

OUT_DIRS = [
    os.path.abspath('public/assets/farm'),
    os.path.abspath('assets/farm')
]

for d in OUT_DIRS:
    os.makedirs(d, exist_ok=True)

def save_img(img, name):
    for d in OUT_DIRS:
        p = os.path.join(d, name)
        img.save(p, "PNG")
    print(f"Saved {name} ({img.size[0]}x{img.size[1]})")

# Palette constants
C_TRANS = (0, 0, 0, 0)
C_BLACK = (20, 20, 25, 255)
C_DARK_BROWN = (60, 36, 21, 255)
C_DIRT = (109, 68, 38, 255)
C_DIRT_LIGHT = (148, 99, 58, 255)
C_DIRT_SHADOW = (48, 27, 14, 255)

C_LEAF = (72, 158, 50, 255)
C_LEAF_LIGHT = (112, 196, 74, 255)
C_LEAF_DARK = (45, 110, 32, 255)

C_RADISH_RED = (220, 48, 72, 255)
C_RADISH_LIGHT = (248, 92, 116, 255)
C_RADISH_WHITE = (245, 240, 230, 255)

C_STRAWBERRY_RED = (230, 35, 45, 255)
C_STRAWBERRY_LIGHT = (255, 80, 80, 255)
C_SEED_YELLOW = (255, 230, 110, 255)

C_GOLD_BASE = (245, 180, 30, 255)
C_GOLD_LIGHT = (255, 220, 80, 255)
C_GOLD_DARK = (195, 130, 15, 255)

def draw_soil_base(d):
    d.ellipse([26, 88, 102, 116], fill=C_DIRT, outline=C_DIRT_SHADOW, width=3)
    d.line([38, 98, 90, 98], fill=C_DIRT_LIGHT, width=3)
    d.line([42, 104, 86, 104], fill=C_DIRT_SHADOW, width=2)

# ==========================================
# 1. RADISH (3 STAGES: 0 -> 1 -> 2)
# ==========================================
def gen_radish_0():
    img = Image.new("RGBA", (128, 128), C_TRANS)
    d = ImageDraw.Draw(img)
    draw_soil_base(d)
    # Mound of fresh soil
    d.ellipse([52, 82, 76, 96], fill=C_DIRT_LIGHT, outline=C_DIRT_SHADOW, width=2)
    # Tiny seedling sprout emerging
    d.polygon([(63, 86), (60, 76), (63, 72), (66, 78)], fill=C_LEAF, outline=C_LEAF_DARK)
    d.polygon([(65, 86), (69, 75), (73, 78)], fill=C_LEAF_LIGHT, outline=C_LEAF_DARK)
    save_img(img, "crop-radish-0.png")

def gen_radish_1():
    img = Image.new("RGBA", (128, 128), C_TRANS)
    d = ImageDraw.Draw(img)
    draw_soil_base(d)
    # Radish top starting to peek
    d.ellipse([54, 78, 74, 98], fill=C_RADISH_RED, outline=C_BLACK, width=2)
    d.ellipse([57, 80, 67, 88], fill=C_RADISH_LIGHT)
    # Leaves growing upwards
    d.polygon([(64, 76), (40, 50), (44, 40), (58, 52), (64, 74)], fill=C_LEAF, outline=C_LEAF_DARK)
    d.polygon([(64, 76), (88, 50), (84, 40), (70, 52), (64, 74)], fill=C_LEAF, outline=C_LEAF_DARK)
    d.polygon([(62, 74), (58, 34), (66, 30), (70, 42), (65, 72)], fill=C_LEAF_LIGHT, outline=C_LEAF_DARK)
    save_img(img, "crop-radish-1.png")

def gen_radish_2():
    # Ripe plump red radish
    img = Image.new("RGBA", (128, 128), C_TRANS)
    d = ImageDraw.Draw(img)
    draw_soil_base(d)
    d.ellipse([42, 60, 86, 104], fill=C_RADISH_RED, outline=C_BLACK, width=3)
    d.chord([48, 82, 80, 102], 0, 180, fill=C_RADISH_WHITE, outline=C_BLACK, width=2)
    d.ellipse([50, 66, 62, 78], fill=C_RADISH_LIGHT)
    d.polygon([(56, 62), (24, 30), (32, 18), (52, 38), (60, 60)], fill=C_LEAF, outline=C_LEAF_DARK)
    d.polygon([(72, 62), (104, 30), (96, 18), (76, 38), (68, 60)], fill=C_LEAF, outline=C_LEAF_DARK)
    d.polygon([(58, 60), (46, 16), (62, 10), (74, 18), (68, 60)], fill=C_LEAF_LIGHT, outline=C_LEAF_DARK)
    d.rectangle([92, 54, 96, 58], fill=C_GOLD_LIGHT)
    d.rectangle([30, 68, 34, 72], fill=C_GOLD_LIGHT)
    save_img(img, "crop-radish-2.png")

# ==========================================
# 2. STRAWBERRY (4 STAGES: 0 -> 1 -> 2 -> 3)
# ==========================================
def gen_strawberry_0():
    img = Image.new("RGBA", (128, 128), C_TRANS)
    d = ImageDraw.Draw(img)
    draw_soil_base(d)
    # Mound of fresh soil
    d.ellipse([50, 82, 78, 98], fill=C_DIRT_LIGHT, outline=C_DIRT_SHADOW, width=2)
    # Seedling cotyledon
    d.polygon([(63, 86), (58, 76), (62, 72), (66, 80)], fill=C_LEAF, outline=C_LEAF_DARK)
    d.polygon([(65, 86), (70, 75), (74, 78)], fill=C_LEAF_LIGHT, outline=C_LEAF_DARK)
    save_img(img, "crop-strawberry-0.png")

def gen_strawberry_1():
    img = Image.new("RGBA", (128, 128), C_TRANS)
    d = ImageDraw.Draw(img)
    draw_soil_base(d)
    d.rectangle([62, 74, 66, 94], fill=C_LEAF_DARK)
    d.polygon([(64, 76), (42, 64), (46, 54), (58, 60)], fill=C_LEAF, outline=C_LEAF_DARK)
    d.polygon([(64, 76), (86, 64), (82, 54), (70, 60)], fill=C_LEAF, outline=C_LEAF_DARK)
    d.polygon([(62, 74), (58, 48), (68, 46), (68, 70)], fill=C_LEAF_LIGHT, outline=C_LEAF_DARK)
    save_img(img, "crop-strawberry-1.png")

def gen_strawberry_2():
    # Bush with blossoms & green berries
    img = Image.new("RGBA", (128, 128), C_TRANS)
    d = ImageDraw.Draw(img)
    draw_soil_base(d)
    d.ellipse([34, 52, 94, 94], fill=C_LEAF, outline=C_LEAF_DARK, width=3)
    d.ellipse([46, 44, 82, 76], fill=C_LEAF_LIGHT)
    # White blossoms with yellow centers
    for fx, fy in [(46, 56), (78, 62)]:
        d.ellipse([fx-8, fy-8, fx+8, fy+8], fill=(255, 255, 255, 255), outline=C_BLACK, width=2)
        d.ellipse([fx-3, fy-3, fx+3, fy+3], fill=C_SEED_YELLOW)
    # Small pale green unripe berry
    d.polygon([(62, 74), (68, 74), (65, 82)], fill=(160, 210, 110, 255), outline=C_LEAF_DARK)
    save_img(img, "crop-strawberry-2.png")

def gen_strawberry_3():
    # Bush with big juicy red ripe strawberries
    img = Image.new("RGBA", (128, 128), C_TRANS)
    d = ImageDraw.Draw(img)
    draw_soil_base(d)
    d.ellipse([30, 42, 98, 92], fill=C_LEAF, outline=C_LEAF_DARK, width=3)
    d.ellipse([42, 34, 86, 70], fill=C_LEAF_LIGHT)
    for sx, sy in [(48, 70), (78, 74)]:
        d.polygon([(sx-12, sy-4), (sx+12, sy-4), (sx+6, sy+16), (sx, sy+20), (sx-6, sy+16)], fill=C_STRAWBERRY_RED, outline=C_BLACK, width=2)
        d.ellipse([sx-8, sy, sx-2, sy+6], fill=C_STRAWBERRY_LIGHT)
        for px, py in [(sx-4, sy+4), (sx+4, sy+4), (sx, sy+10), (sx+4, sy+12)]:
            d.rectangle([px, py, px+1, py+2], fill=C_SEED_YELLOW)
        d.polygon([(sx-10, sy-4), (sx+10, sy-4), (sx, sy-8)], fill=C_LEAF_LIGHT, outline=C_LEAF_DARK)
    # Shimmer sparkles
    d.rectangle([88, 48, 92, 52], fill=C_GOLD_LIGHT)
    save_img(img, "crop-strawberry-3.png")

# ==========================================
# 3. SUNFLOWER (5 STAGES: 0 -> 1 -> 2 -> 3 -> 4)
# ==========================================
def gen_sunflower_0():
    img = Image.new("RGBA", (128, 128), C_TRANS)
    d = ImageDraw.Draw(img)
    draw_soil_base(d)
    # Fresh soil mound
    d.ellipse([50, 80, 78, 96], fill=C_DIRT_LIGHT, outline=C_DIRT_SHADOW, width=2)
    # Tiny sunflower seedling tip
    d.polygon([(63, 86), (58, 75), (63, 71), (67, 78)], fill=C_LEAF, outline=C_LEAF_DARK)
    d.polygon([(65, 86), (71, 74), (74, 78)], fill=C_LEAF_LIGHT, outline=C_LEAF_DARK)
    save_img(img, "crop-sunflower-0.png")

def gen_sunflower_1():
    # Stalk with 2 cotyledon leaves
    img = Image.new("RGBA", (128, 128), C_TRANS)
    d = ImageDraw.Draw(img)
    draw_soil_base(d)
    d.rectangle([61, 60, 67, 96], fill=C_LEAF_DARK)
    d.ellipse([36, 52, 62, 70], fill=C_LEAF, outline=C_LEAF_DARK, width=2)
    d.ellipse([66, 52, 92, 70], fill=C_LEAF, outline=C_LEAF_DARK, width=2)
    save_img(img, "crop-sunflower-1.png")

def gen_sunflower_2():
    # Taller robust stalk with multi-level green foliage
    img = Image.new("RGBA", (128, 128), C_TRANS)
    d = ImageDraw.Draw(img)
    draw_soil_base(d)
    d.rectangle([60, 44, 68, 96], fill=C_LEAF_DARK)
    # Lower leaves
    d.polygon([(60, 72), (28, 64), (32, 78), (60, 82)], fill=C_LEAF, outline=C_LEAF_DARK)
    d.polygon([(68, 68), (100, 60), (96, 74), (68, 78)], fill=C_LEAF, outline=C_LEAF_DARK)
    # Upper leaves
    d.polygon([(60, 52), (34, 42), (40, 56), (60, 60)], fill=C_LEAF_LIGHT, outline=C_LEAF_DARK)
    d.polygon([(68, 48), (94, 38), (88, 52), (68, 56)], fill=C_LEAF_LIGHT, outline=C_LEAF_DARK)
    # Young crown
    d.ellipse([54, 36, 74, 52], fill=C_LEAF_LIGHT, outline=C_LEAF_DARK, width=2)
    save_img(img, "crop-sunflower-2.png")

def gen_sunflower_3():
    # Tall stem with large swollen green/golden flower bud preparing to bloom
    img = Image.new("RGBA", (128, 128), C_TRANS)
    d = ImageDraw.Draw(img)
    draw_soil_base(d)
    d.rectangle([60, 38, 68, 96], fill=C_LEAF_DARK)
    # Broad leaves
    d.polygon([(60, 66), (26, 58), (32, 74), (60, 78)], fill=C_LEAF, outline=C_LEAF_DARK)
    d.polygon([(68, 58), (102, 50), (96, 66), (68, 70)], fill=C_LEAF, outline=C_LEAF_DARK)
    # Large flower bud with yellow petals just starting to poke out
    for i in range(8):
        angle = i * (2 * math.pi / 8)
        px = 64 + int(18 * math.cos(angle))
        py = 34 + int(18 * math.sin(angle))
        d.ellipse([px-6, py-6, px+6, py+6], fill=C_GOLD_BASE, outline=C_BLACK, width=1)
    # Green calyx wrapping bud
    d.ellipse([48, 18, 80, 50], fill=C_LEAF_LIGHT, outline=C_LEAF_DARK, width=3)
    d.ellipse([56, 26, 72, 42], fill=C_GOLD_BASE)
    save_img(img, "crop-sunflower-3.png")

def gen_sunflower_4():
    # Grand blooming golden sunflower in full glory
    img = Image.new("RGBA", (128, 128), C_TRANS)
    d = ImageDraw.Draw(img)
    draw_soil_base(d)
    d.rectangle([60, 48, 68, 96], fill=C_LEAF_DARK)
    d.polygon([(60, 70), (30, 62), (36, 78), (60, 82)], fill=C_LEAF, outline=C_LEAF_DARK)
    d.polygon([(68, 60), (98, 52), (94, 68), (68, 72)], fill=C_LEAF, outline=C_LEAF_DARK)
    cx, cy = 64, 40
    # 12 golden petals
    for i in range(12):
        angle = i * (2 * math.pi / 12)
        px = cx + int(26 * math.cos(angle))
        py = cy + int(26 * math.sin(angle))
        d.ellipse([px-10, py-10, px+10, py+10], fill=C_GOLD_LIGHT, outline=C_BLACK, width=2)
    # Center seed disk
    d.ellipse([cx-18, cy-18, cx+18, cy+18], fill=C_DARK_BROWN, outline=C_BLACK, width=3)
    for sx in range(cx-10, cx+11, 6):
        for sy in range(cy-10, cy+11, 6):
            if (sx-cx)**2 + (sy-cy)**2 <= 14**2:
                d.rectangle([sx, sy, sx+2, sy+2], fill=C_DIRT_LIGHT)
    # Sparkle effects for ready to harvest
    d.rectangle([98, 16, 102, 20], fill=C_GOLD_LIGHT)
    d.rectangle([24, 20, 28, 24], fill=C_GOLD_LIGHT)
    save_img(img, "crop-sunflower-4.png")

if __name__ == "__main__":
    gen_radish_0()
    gen_radish_1()
    gen_radish_2()

    gen_strawberry_0()
    gen_strawberry_1()
    gen_strawberry_2()
    gen_strawberry_3()

    gen_sunflower_0()
    gen_sunflower_1()
    gen_sunflower_2()
    gen_sunflower_3()
    gen_sunflower_4()
    print("All crop stage sprites generated successfully!")
