#run once to regenerate all the different door sprites
import _setup
import cv2
import numpy as np
import urcv

from maptroid.icons import get_icons

caps = get_icons('door_caps')
blue_caps = get_icons('blue_caps')
blue_doors = get_icons('blue_doors')
opening = cv2.imread('static/sm/door_opening.png', cv2.IMREAD_UNCHANGED)

def get_sorted_colors(image):
    out = []
    colors, counts = urcv.count_colors(image)
    colors = sorted(colors, key=lambda c: np.sum(c))
    excludes = [[0, 0, 0], [255, 255, 255]]
    for color in colors:
        b, g, r, a = color
        if [b, g, r] in excludes:
            continue
        out.append(color.tolist())
    return out

blue_colors = get_sorted_colors(caps['cap_blue'])
blue_colors.append(blue_colors[-1])
blue_colors.append(blue_colors[-1])



replacements = []
for name, icon in caps.items():
    replacements.append(get_sorted_colors(icon)[:3])

results = []
# normalize blue caps
for world, cap in blue_caps.items():
    world_caps = []
    cap_colors = get_sorted_colors(cap)
    for ir, weapon_colors in enumerate(replacements):
        recolored_icon = blue_doors[world].copy()
        if world == 'ypr' and ir == 4:
            # ypr caps look dark blue in smile_export
            pass
        else:
            for i_color, weapon_color in enumerate(weapon_colors):
                urcv.replace_color(recolored_icon, cap_colors[i_color], weapon_color)
        world_caps.append(recolored_icon)
    world_caps = np.vstack(world_caps)
    results.append(world_caps)
    cv2.imwrite(f'static/sm/world_doors/{world}.png', world_caps)

# color anmiations
animations = []
opening_colors = get_sorted_colors(opening)
for ir, weapon_colors in enumerate(replacements):
    recolored = opening.copy()
    for i_color, weapon_color in enumerate(weapon_colors):
        urcv.replace_color(recolored, opening_colors[i_color], weapon_color)
    animations.append(recolored)

cv2.imwrite('.media/trash/rainbow_caps.png', np.hstack(results))
cv2.imwrite('static/sm/rainbow_opening.png', np.vstack(animations))
