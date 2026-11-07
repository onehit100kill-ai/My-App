"""
Pixel Art Asset Generator for VocabMaster Farm Game
Generates all 21 pixel art PNG assets with RGBA transparency, Stardew Valley warm palette.
"""
import os
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

# Palette constants (Stardew Valley warm inspired)
C_TRANS = (0, 0, 0, 0)
C_BLACK = (20, 20, 25, 255)
C_DARK_BROWN = (60, 36, 21, 255)
C_DIRT = (109, 68, 38, 255)
C_DIRT_LIGHT = (148, 99, 58, 255)
C_DIRT_SHADOW = (48, 27, 14, 255)

C_GRASS_BASE = (92, 148, 56, 255)
C_GRASS_LIGHT = (124, 178, 66, 255)
C_GRASS_DARK = (68, 114, 40, 255)
C_GRASS_ACCENT = (145, 198, 78, 255)

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

# 1. grass-tile.png (64x64, tileable)
def gen_grass_tile():
    img = Image.new("RGBA", (64, 64), C_GRASS_BASE)
    d = ImageDraw.Draw(img)
    # Add subtle tileable dapples
    for y in range(0, 64, 4):
        for x in range(0, 64, 4):
            pattern = ((x * 17) ^ (y * 23)) % 7
            if pattern == 0:
                d.rectangle([x, y, x+1, y+1], fill=C_GRASS_LIGHT)
            elif pattern == 1:
                d.rectangle([x, y, x+2, y+1], fill=C_GRASS_DARK)
            elif pattern == 2 and ((x+y)%8 == 0):
                d.rectangle([x, y, x+1, y+2], fill=C_GRASS_ACCENT)
    save_img(img, "grass-tile.png")

# 2. soil-empty.png (128x128)
def gen_soil_empty():
    img = Image.new("RGBA", (128, 128), C_TRANS)
    d = ImageDraw.Draw(img)
    # Tilled patch mound
    d.rounded_rectangle([12, 18, 116, 112], radius=18, fill=C_DIRT, outline=C_DIRT_SHADOW, width=4)
    # Furrows / tilled ridges
    for row_y in [36, 54, 72, 90]:
        d.line([22, row_y, 106, row_y], fill=C_DIRT_LIGHT, width=4)
        d.line([22, row_y + 4, 106, row_y + 4], fill=C_DIRT_SHADOW, width=3)
    # Soil texture specks
    for px, py in [(30, 44), (55, 48), (80, 42), (40, 62), (70, 64), (95, 60), (35, 82), (65, 80), (85, 84)]:
        d.rectangle([px, py, px+3, py+2], fill=C_DIRT_LIGHT)
        d.rectangle([px+2, py+1, px+4, py+3], fill=C_DIRT_SHADOW)
    save_img(img, "soil-empty.png")

# Helper to draw soil mound under crops
def draw_soil_base(d):
    d.ellipse([26, 88, 102, 116], fill=C_DIRT, outline=C_DIRT_SHADOW, width=3)
    d.line([38, 98, 90, 98], fill=C_DIRT_LIGHT, width=3)
    d.line([42, 104, 86, 104], fill=C_DIRT_SHADOW, width=2)

# 3. crop-radish-1.png (128x128) - 2 small green leaves sprout
def gen_radish_1():
    img = Image.new("RGBA", (128, 128), C_TRANS)
    d = ImageDraw.Draw(img)
    draw_soil_base(d)
    # Tiny stem
    d.rectangle([61, 72, 66, 92], fill=C_LEAF_DARK)
    # Left leaf
    d.polygon([(62, 76), (42, 62), (40, 52), (54, 56), (62, 72)], fill=C_LEAF, outline=C_LEAF_DARK)
    d.polygon([(46, 56), (44, 54), (52, 57)], fill=C_LEAF_LIGHT)
    # Right leaf
    d.polygon([(65, 76), (85, 62), (88, 52), (74, 56), (65, 72)], fill=C_LEAF, outline=C_LEAF_DARK)
    d.polygon([(82, 56), (84, 54), (76, 57)], fill=C_LEAF_LIGHT)
    save_img(img, "crop-radish-1.png")

# 4. crop-radish-2.png (128x128) - plant growing, radish peeking
def gen_radish_2():
    img = Image.new("RGBA", (128, 128), C_TRANS)
    d = ImageDraw.Draw(img)
    draw_soil_base(d)
    # Radish top peeking
    d.ellipse([50, 76, 78, 100], fill=C_RADISH_RED, outline=C_BLACK, width=2)
    d.ellipse([55, 78, 68, 86], fill=C_RADISH_LIGHT)
    # Leaves growing upwards & outwards
    d.polygon([(64, 76), (36, 44), (42, 34), (58, 48), (64, 72)], fill=C_LEAF, outline=C_LEAF_DARK)
    d.polygon([(64, 76), (92, 44), (86, 34), (70, 48), (64, 72)], fill=C_LEAF, outline=C_LEAF_DARK)
    d.polygon([(62, 74), (56, 26), (66, 22), (72, 36), (65, 72)], fill=C_LEAF_LIGHT, outline=C_LEAF_DARK)
    save_img(img, "crop-radish-2.png")

# 5. crop-radish-3.png (128x128) - ripe plump red radish
def gen_radish_3():
    img = Image.new("RGBA", (128, 128), C_TRANS)
    d = ImageDraw.Draw(img)
    draw_soil_base(d)
    # Plump radish bulb
    d.ellipse([42, 60, 86, 104], fill=C_RADISH_RED, outline=C_BLACK, width=3)
    # Radish bottom white tip
    d.chord([48, 82, 80, 102], 0, 180, fill=C_RADISH_WHITE, outline=C_BLACK, width=2)
    # Highlight
    d.ellipse([50, 66, 62, 78], fill=C_RADISH_LIGHT)
    # Lush top leaves
    d.polygon([(56, 62), (24, 30), (32, 18), (52, 38), (60, 60)], fill=C_LEAF, outline=C_LEAF_DARK)
    d.polygon([(72, 62), (104, 30), (96, 18), (76, 38), (68, 60)], fill=C_LEAF, outline=C_LEAF_DARK)
    d.polygon([(58, 60), (46, 16), (62, 10), (74, 18), (68, 60)], fill=C_LEAF_LIGHT, outline=C_LEAF_DARK)
    # Little sparkles
    d.rectangle([92, 54, 96, 58], fill=C_GOLD_LIGHT)
    d.rectangle([30, 68, 34, 72], fill=C_GOLD_LIGHT)
    save_img(img, "crop-radish-3.png")

# 6. crop-strawberry-1.png (128x128)
def gen_strawberry_1():
    img = Image.new("RGBA", (128, 128), C_TRANS)
    d = ImageDraw.Draw(img)
    draw_soil_base(d)
    # Sprout with 3 leaflets
    d.rectangle([62, 74, 66, 94], fill=C_LEAF_DARK)
    d.polygon([(64, 76), (42, 64), (46, 54), (58, 60)], fill=C_LEAF, outline=C_LEAF_DARK)
    d.polygon([(64, 76), (86, 64), (82, 54), (70, 60)], fill=C_LEAF, outline=C_LEAF_DARK)
    d.polygon([(62, 74), (58, 48), (68, 46), (68, 70)], fill=C_LEAF_LIGHT, outline=C_LEAF_DARK)
    save_img(img, "crop-strawberry-1.png")

# 7. crop-strawberry-2.png (128x128) - bush with white blossoms
def gen_strawberry_2():
    img = Image.new("RGBA", (128, 128), C_TRANS)
    d = ImageDraw.Draw(img)
    draw_soil_base(d)
    # Foliage bush
    d.ellipse([34, 52, 94, 94], fill=C_LEAF, outline=C_LEAF_DARK, width=3)
    d.ellipse([46, 44, 82, 76], fill=C_LEAF_LIGHT)
    # White flower blossoms
    for fx, fy in [(46, 56), (78, 62)]:
        d.ellipse([fx-8, fy-8, fx+8, fy+8], fill=(255, 255, 255, 255), outline=C_BLACK, width=2)
        d.ellipse([fx-3, fy-3, fx+3, fy+3], fill=C_SEED_YELLOW)
    save_img(img, "crop-strawberry-2.png")

# 8. crop-strawberry-3.png (128x128) - ripe red strawberries
def gen_strawberry_3():
    img = Image.new("RGBA", (128, 128), C_TRANS)
    d = ImageDraw.Draw(img)
    draw_soil_base(d)
    # Foliage bush
    d.ellipse([30, 42, 98, 92], fill=C_LEAF, outline=C_LEAF_DARK, width=3)
    d.ellipse([42, 34, 86, 70], fill=C_LEAF_LIGHT)
    # Big ripe strawberries hanging
    for sx, sy in [(48, 70), (78, 74)]:
        # Heart shaped berry
        d.polygon([(sx-12, sy-4), (sx+12, sy-4), (sx+6, sy+16), (sx, sy+20), (sx-6, sy+16)], fill=C_STRAWBERRY_RED, outline=C_BLACK, width=2)
        d.ellipse([sx-8, sy, sx-2, sy+6], fill=C_STRAWBERRY_LIGHT)
        # Yellow seeds
        for px, py in [(sx-4, sy+4), (sx+4, sy+4), (sx, sy+10), (sx+4, sy+12)]:
            d.rectangle([px, py, px+1, py+2], fill=C_SEED_YELLOW)
        # Green cap
        d.polygon([(sx-10, sy-4), (sx+10, sy-4), (sx, sy-8)], fill=C_LEAF_LIGHT, outline=C_LEAF_DARK)
    save_img(img, "crop-strawberry-3.png")

# 9. crop-sunflower-1.png (128x128)
def gen_sunflower_1():
    img = Image.new("RGBA", (128, 128), C_TRANS)
    d = ImageDraw.Draw(img)
    draw_soil_base(d)
    # Sturdy stalk
    d.rectangle([61, 60, 67, 96], fill=C_LEAF_DARK)
    # 2 rounded cotyledon leaves
    d.ellipse([36, 52, 62, 70], fill=C_LEAF, outline=C_LEAF_DARK, width=2)
    d.ellipse([66, 52, 92, 70], fill=C_LEAF, outline=C_LEAF_DARK, width=2)
    save_img(img, "crop-sunflower-1.png")

# 10. crop-sunflower-2.png (128x128) - tall stem with bud
def gen_sunflower_2():
    img = Image.new("RGBA", (128, 128), C_TRANS)
    d = ImageDraw.Draw(img)
    draw_soil_base(d)
    # Tall stalk
    d.rectangle([60, 40, 68, 96], fill=C_LEAF_DARK)
    # Side leaves
    d.polygon([(60, 64), (32, 56), (36, 72), (60, 76)], fill=C_LEAF, outline=C_LEAF_DARK)
    d.polygon([(68, 54), (96, 46), (92, 62), (68, 66)], fill=C_LEAF, outline=C_LEAF_DARK)
    # Round green flower bud
    d.ellipse([50, 24, 78, 52], fill=C_LEAF_LIGHT, outline=C_LEAF_DARK, width=3)
    d.ellipse([58, 32, 70, 44], fill=C_GOLD_BASE)
    save_img(img, "crop-sunflower-2.png")

# 11. crop-sunflower-3.png (128x128) - blooming sunflower
def gen_sunflower_3():
    img = Image.new("RGBA", (128, 128), C_TRANS)
    d = ImageDraw.Draw(img)
    draw_soil_base(d)
    # Tall stalk
    d.rectangle([60, 48, 68, 96], fill=C_LEAF_DARK)
    d.polygon([(60, 70), (30, 62), (36, 78), (60, 82)], fill=C_LEAF, outline=C_LEAF_DARK)
    d.polygon([(68, 60), (98, 52), (94, 68), (68, 72)], fill=C_LEAF, outline=C_LEAF_DARK)
    # Golden Petals (Outer star / circle)
    import math
    cx, cy = 64, 40
    for i in range(12):
        angle = i * (2 * math.pi / 12)
        px = cx + int(26 * math.cos(angle))
        py = cy + int(26 * math.sin(angle))
        d.ellipse([px-10, py-10, px+10, py+10], fill=C_GOLD_LIGHT, outline=C_BLACK, width=2)
    # Brown center disk
    d.ellipse([cx-18, cy-18, cx+18, cy+18], fill=C_DARK_BROWN, outline=C_BLACK, width=3)
    # Seed texture in center
    for sx in range(cx-10, cx+11, 6):
        for sy in range(cy-10, cy+11, 6):
            if (sx-cx)**2 + (sy-cy)**2 <= 14**2:
                d.rectangle([sx, sy, sx+2, sy+2], fill=C_DIRT_LIGHT)
    save_img(img, "crop-sunflower-3.png")

# 12. crop-withered.png (128x128) - drooping dead gray crop
def gen_withered():
    img = Image.new("RGBA", (128, 128), C_TRANS)
    d = ImageDraw.Draw(img)
    draw_soil_base(d)
    C_DEAD_STEM = (90, 80, 70, 255)
    C_DEAD_LEAF = (130, 115, 95, 255)
    # Crooked bent stalk
    d.line([(64, 96), (62, 80), (52, 70), (40, 78)], fill=C_DEAD_STEM, width=5)
    # Drooping dead leaves
    d.polygon([(52, 70), (32, 82), (28, 92), (42, 88)], fill=C_DEAD_LEAF, outline=C_BLACK, width=2)
    d.polygon([(62, 80), (78, 86), (82, 96), (70, 92)], fill=C_DEAD_LEAF, outline=C_BLACK, width=2)
    # Wilted flower/head dangling down
    d.ellipse([30, 74, 48, 92], fill=(100, 90, 80, 255), outline=C_BLACK, width=2)
    save_img(img, "crop-withered.png")

# 13. worm.png (64x64) - cute green inchworm
def gen_worm():
    img = Image.new("RGBA", (64, 64), C_TRANS)
    d = ImageDraw.Draw(img)
    C_WORM = (135, 215, 65, 255)
    C_WORM_DARK = (90, 165, 40, 255)
    # Segmented body arched
    segments = [(16, 44, 26, 54), (24, 34, 34, 44), (32, 30, 42, 40), (40, 36, 50, 46), (46, 26, 58, 38)]
    for x1, y1, x2, y2 in segments:
        d.ellipse([x1, y1, x2, y2], fill=C_WORM, outline=C_BLACK, width=2)
    # Head details (last segment is head)
    # Eye
    d.rectangle([52, 28, 55, 32], fill=C_BLACK)
    d.rectangle([53, 29, 54, 30], fill=(255, 255, 255, 255))
    # Rosy cheek
    d.rectangle([48, 33, 51, 35], fill=(255, 130, 150, 255))
    save_img(img, "worm.png")

# 14. seed-radish.png (64x64)
def gen_seed_radish():
    img = Image.new("RGBA", (64, 64), C_TRANS)
    d = ImageDraw.Draw(img)
    C_PAPER = (225, 195, 150, 255)
    d.rectangle([14, 10, 50, 54], fill=C_PAPER, outline=C_BLACK, width=2)
    d.polygon([(14, 10), (32, 24), (50, 10)], fill=(205, 175, 130, 255), outline=C_BLACK, width=2)
    # Tiny radish symbol
    d.ellipse([26, 32, 38, 44], fill=C_RADISH_RED)
    d.polygon([(30, 32), (32, 24), (34, 32)], fill=C_LEAF)
    save_img(img, "seed-radish.png")

# 15. seed-strawberry.png (64x64)
def gen_seed_strawberry():
    img = Image.new("RGBA", (64, 64), C_TRANS)
    d = ImageDraw.Draw(img)
    C_PAPER = (225, 195, 150, 255)
    d.rectangle([14, 10, 50, 54], fill=C_PAPER, outline=C_BLACK, width=2)
    d.polygon([(14, 10), (32, 24), (50, 10)], fill=(205, 175, 130, 255), outline=C_BLACK, width=2)
    # Tiny strawberry symbol
    d.polygon([(26, 32), (38, 32), (32, 44)], fill=C_STRAWBERRY_RED)
    d.polygon([(28, 32), (32, 26), (36, 32)], fill=C_LEAF)
    save_img(img, "seed-strawberry.png")

# 16. seed-sunflower.png (64x64)
def gen_seed_sunflower():
    img = Image.new("RGBA", (64, 64), C_TRANS)
    d = ImageDraw.Draw(img)
    C_PAPER = (225, 195, 150, 255)
    d.rectangle([14, 10, 50, 54], fill=C_PAPER, outline=C_BLACK, width=2)
    d.polygon([(14, 10), (32, 24), (50, 10)], fill=(205, 175, 130, 255), outline=C_BLACK, width=2)
    # Tiny sunflower symbol
    d.ellipse([24, 28, 40, 44], fill=C_GOLD_BASE)
    d.ellipse([29, 33, 35, 39], fill=C_DARK_BROWN)
    save_img(img, "seed-sunflower.png")

# 17. fertilizer-bag.png (64x64)
def gen_fertilizer_bag():
    img = Image.new("RGBA", (64, 64), C_TRANS)
    d = ImageDraw.Draw(img)
    C_SACK = (185, 140, 95, 255)
    C_SACK_DARK = (145, 105, 65, 255)
    # Sack pouch
    d.rounded_rectangle([14, 20, 50, 56], radius=8, fill=C_SACK, outline=C_BLACK, width=2)
    # Tied neck
    d.polygon([(24, 20), (32, 12), (40, 20)], fill=C_SACK_DARK, outline=C_BLACK, width=2)
    d.line([22, 21, 42, 21], fill=C_BLACK, width=3)
    # Green plant leaf emblem
    d.ellipse([27, 30, 37, 44], fill=C_LEAF_LIGHT, outline=C_LEAF_DARK, width=2)
    save_img(img, "fertilizer-bag.png")

# 18. watering-can.png (64x64)
def gen_watering_can():
    img = Image.new("RGBA", (64, 64), C_TRANS)
    d = ImageDraw.Draw(img)
    C_CAN = (55, 145, 215, 255)
    C_CAN_LIGHT = (95, 185, 245, 255)
    # Body
    d.rounded_rectangle([18, 26, 44, 52], radius=6, fill=C_CAN, outline=C_BLACK, width=2)
    d.line([22, 32, 40, 32], fill=C_CAN_LIGHT, width=2)
    # Handle arch
    d.arc([10, 24, 26, 50], 90, 270, fill=C_BLACK, width=3)
    # Spout
    d.line([42, 40, 54, 28], fill=C_BLACK, width=4)
    d.line([42, 40, 54, 28], fill=C_CAN, width=2)
    # Rose sprinkler head
    d.ellipse([52, 22, 60, 32], fill=(240, 240, 240, 255), outline=C_BLACK, width=2)
    # Water droplets
    d.rectangle([58, 36, 60, 39], fill=(120, 200, 255, 255))
    save_img(img, "watering-can.png")

# 19. coin.png (32x32)
def gen_coin():
    img = Image.new("RGBA", (32, 32), C_TRANS)
    d = ImageDraw.Draw(img)
    # Outer gold rim
    d.ellipse([3, 3, 28, 28], fill=C_GOLD_DARK, outline=C_BLACK, width=2)
    # Inner bright face
    d.ellipse([6, 6, 25, 25], fill=C_GOLD_BASE)
    # Star / highlight
    d.ellipse([9, 9, 22, 22], fill=C_GOLD_LIGHT)
    d.rectangle([14, 10, 17, 21], fill=C_GOLD_DARK)
    d.rectangle([10, 14, 21, 17], fill=C_GOLD_DARK)
    save_img(img, "coin.png")

# 20. heart.png (32x32)
def gen_heart():
    img = Image.new("RGBA", (32, 32), C_TRANS)
    d = ImageDraw.Draw(img)
    # Pixel heart polygon
    coords = [
        (15, 28), (5, 17), (4, 11), (7, 6), (12, 6), (15, 10), (16, 10),
        (19, 6), (24, 6), (27, 11), (26, 17)
    ]
    d.polygon(coords, fill=(235, 40, 60, 255), outline=C_BLACK, width=2)
    # White highlight shine
    d.rectangle([8, 9, 11, 12], fill=(255, 255, 255, 255))
    save_img(img, "heart.png")

# 21. basket.png (64x64)
def gen_basket():
    img = Image.new("RGBA", (64, 64), C_TRANS)
    d = ImageDraw.Draw(img)
    C_WICKER = (195, 135, 75, 255)
    C_WICKER_DARK = (145, 95, 45, 255)
    C_WICKER_LIGHT = (230, 175, 115, 255)
    # Basket body
    d.polygon([(14, 28), (50, 28), (44, 54), (20, 54)], fill=C_WICKER, outline=C_BLACK, width=2)
    # Weave lines
    for ly in [34, 40, 46]:
        d.line([16, ly, 48, ly], fill=C_WICKER_DARK, width=2)
    for lx in [22, 28, 34, 40]:
        d.line([lx, 28, lx, 52], fill=C_WICKER_LIGHT, width=2)
    # Handle
    d.arc([18, 10, 46, 36], 180, 360, fill=C_BLACK, width=4)
    d.arc([20, 12, 44, 34], 180, 360, fill=C_WICKER_LIGHT, width=2)
    save_img(img, "basket.png")

if __name__ == "__main__":
    gen_grass_tile()
    gen_soil_empty()
    gen_radish_1()
    gen_radish_2()
    gen_radish_3()
    gen_strawberry_1()
    gen_strawberry_2()
    gen_strawberry_3()
    gen_sunflower_1()
    gen_sunflower_2()
    gen_sunflower_3()
    gen_withered()
    gen_worm()
    gen_seed_radish()
    gen_seed_strawberry()
    gen_seed_sunflower()
    gen_fertilizer_bag()
    gen_watering_can()
    gen_coin()
    gen_heart()
    gen_basket()
    print("ALL 21 ASSETS GENERATED SUCCESSFULLY!")
