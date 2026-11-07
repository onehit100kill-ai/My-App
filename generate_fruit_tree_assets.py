"""
Generator for 15 Fruit Tree Pixel Art Assets (3 stages for 5 trees: Apple, Orange, Peach, Pear, Cherry)
Pixel-art Stardew Valley aesthetic, 64x64 RGBA.
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
    print(f"Saved {name}")

# Palettes
C_TRUNK_DARK = (78, 46, 26, 255)
C_TRUNK = (118, 72, 42, 255)
C_TRUNK_LIGHT = (156, 102, 62, 255)

C_LEAF_DARK = (42, 92, 34, 255)
C_LEAF = (68, 142, 48, 255)
C_LEAF_LIGHT = (110, 186, 72, 255)

FRUITS = {
    'apple': {'fruit': (220, 42, 50, 255), 'fruit_light': (255, 90, 95, 255)},
    'orange': {'fruit': (245, 130, 28, 255), 'fruit_light': (255, 175, 75, 255)},
    'peach': {'fruit': (248, 142, 160, 255), 'fruit_light': (255, 185, 200, 255)},
    'pear': {'fruit': (185, 205, 45, 255), 'fruit_light': (220, 235, 95, 255)},
    'cherry': {'fruit': (175, 22, 55, 255), 'fruit_light': (235, 65, 100, 255)}
}

def create_tree(fruit_key, stage):
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    f_col = FRUITS[fruit_key]['fruit']
    f_lit = FRUITS[fruit_key]['fruit_light']

    if stage == 1:
        # Stage 1: Young sapling with small stem and leafy clump
        # Trunk
        draw.rectangle([30, 40, 33, 56], fill=C_TRUNK)
        draw.rectangle([30, 40, 31, 56], fill=C_TRUNK_DARK)
        # Leaves clump
        draw.ellipse([22, 22, 41, 42], fill=C_LEAF_DARK)
        draw.ellipse([24, 24, 39, 40], fill=C_LEAF)
        draw.ellipse([26, 25, 36, 34], fill=C_LEAF_LIGHT)
        # 1-2 tiny buds
        draw.rectangle([25, 28, 27, 30], fill=f_lit)
        draw.rectangle([35, 32, 37, 34], fill=f_lit)

    elif stage == 2:
        # Stage 2: Medium tree, wider trunk, bushy crown
        # Trunk
        draw.rectangle([28, 36, 35, 58], fill=C_TRUNK)
        draw.rectangle([28, 36, 30, 58], fill=C_TRUNK_DARK)
        draw.rectangle([33, 38, 35, 58], fill=C_TRUNK_LIGHT)
        # Branches
        draw.line([(30, 38), (22, 30)], fill=C_TRUNK, width=2)
        draw.line([(33, 38), (42, 30)], fill=C_TRUNK, width=2)
        # Bushy leafy crown
        draw.ellipse([14, 12, 49, 44], fill=C_LEAF_DARK)
        draw.ellipse([17, 14, 46, 41], fill=C_LEAF)
        draw.ellipse([20, 16, 42, 32], fill=C_LEAF_LIGHT)
        # Small unripened/forming fruits
        spots = [(20, 24), (28, 18), (38, 22), (25, 32), (40, 30)]
        for sx, sy in spots:
            draw.rectangle([sx, sy, sx+3, sy+3], fill=f_col)
            draw.point((sx+1, sy+1), fill=f_lit)

    elif stage == 3:
        # Stage 3: Full mature fruiting tree
        # Thick trunk
        draw.rectangle([27, 34, 36, 58], fill=C_TRUNK)
        draw.rectangle([27, 34, 29, 58], fill=C_TRUNK_DARK)
        draw.rectangle([34, 36, 36, 58], fill=C_TRUNK_LIGHT)
        # Root flares
        draw.line([(27, 56), (23, 60)], fill=C_TRUNK_DARK, width=2)
        draw.line([(36, 56), (40, 60)], fill=C_TRUNK_LIGHT, width=2)
        # Large lush crown
        draw.ellipse([10, 6, 53, 44], fill=C_LEAF_DARK)
        draw.ellipse([13, 8, 50, 41], fill=C_LEAF)
        draw.ellipse([17, 10, 45, 28], fill=C_LEAF_LIGHT)
        # Plentiful ripe fruits with highlights
        fruit_coords = [
            (16, 20), (22, 14), (32, 12), (42, 16),
            (26, 22), (36, 24), (18, 30), (29, 32), (43, 28)
        ]
        for fx, fy in fruit_coords:
            # 5x5 round-ish fruit
            draw.rectangle([fx, fy+1, fx+4, fy+3], fill=f_col)
            draw.rectangle([fx+1, fy, fx+3, fy+4], fill=f_col)
            draw.point((fx+1, fy+1), fill=f_lit)
            draw.point((fx+2, fy+1), fill=f_lit)

    return img

for fruit in ['apple', 'orange', 'peach', 'pear', 'cherry']:
    for st in [1, 2, 3]:
        name = f"crop-{fruit}-{st}.png"
        img = create_tree(fruit, st)
        save_img(img, name)

print("All 15 fruit tree assets generated successfully!")

