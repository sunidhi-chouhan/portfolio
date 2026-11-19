"""Builds public/midnight/flow.png, the motion map the hero shader reads.

Channels (all in plate UV space, so one map serves every plate size):
  R  willow / grass sway weight (how far a pixel may be pushed by the wind)
  G  water (ripples, shimmer, reflections)
  B  hair (lighter, faster flutter)
  A  depth for pointer parallax, stored as 0.3 + 0.7 * depth so it never
     reaches 0 (browsers lose RGB precision on near-transparent pixels)

Run: python3 scripts/build-flow-map.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'public/midnight/plate.jpg'
OUT = ROOT / 'public/midnight/flow.png'
W, H = 640, 360


def shore_y(x: float) -> float:
    """Approximate y (0..1) of the grassy bank edge at x (0..1)."""
    points = [(0.0, 1.2), (0.44, 1.02), (0.53, 0.88), (0.66, 0.83), (0.8, 0.79), (0.9, 0.75), (1.0, 0.71)]
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        if x0 <= x <= x1:
            t = (x - x0) / (x1 - x0)
            return y0 + (y1 - y0) * t
    return points[-1][1]


def main() -> None:
    plate = Image.open(SRC).convert('RGB').resize((W, H), Image.LANCZOS)
    px = plate.load()

    sway = Image.new('L', (W, H))
    water = Image.new('L', (W, H))
    hair = Image.new('L', (W, H))
    depth = Image.new('L', (W, H))
    sp, wp, hp, dp = sway.load(), water.load(), hair.load(), depth.load()

    # The girl's silhouette keeps her body still and brings her forward in depth.
    gpoly = Image.new('L', (W, H))
    ImageDraw.Draw(gpoly).polygon(
        [(x * W, y * H) for x, y in [(0.745, 0.49), (0.79, 0.485), (0.84, 0.6), (0.875, 0.83), (0.66, 0.85), (0.7, 0.75), (0.735, 0.6)]],
        fill=255,
    )
    gp = gpoly.load()

    for y in range(H):
        v = y / H
        for x in range(W):
            u = x / W
            r, g, b = px[x, y]
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            bank = shore_y(u)
            on_bank = v > bank

            # Willow fronds: greener than the blue night sky behind them. The
            # g/b ratio separates even the dark teal fronds from the sky.
            ratio = g / (b + 1)
            canopy = u > 0.29 and not on_bank and (v < 0.64 or (u < 0.56 and v < 0.8))
            # Bark (trunk and branches) is grey-brown: red keeps up with green.
            trunk = lum < 70 and r >= b * 0.85 and g - r < 14
            # Down in the mist the fronds must be clearly greener than the fog.
            need = 0.74 + 0.21 * min(1.0, max(0.0, (v - 0.38) / 0.18))
            frond = 0.0
            if canopy and not trunk and ratio > need and g > 22:
                frond = min(1.0, (ratio - need) / 0.3) * min(1.0, (g - 22) / 30)
                # Fronds hang: the tips (lower) swing further than the roots.
                hang = min(1.0, max(0.0, (v - 0.02) / 0.5))
                frond *= 0.3 + 0.7 * hang
            # Grass on the bank sways a touch.
            green = g - max(r, b) * 0.92
            if on_bank and green > 4 and gp[x, y] == 0:
                frond = max(frond, 0.22 * min(1.0, (green - 4) / 20))
            sp[x, y] = int(255 * frond)

            # Water: below the mist line and above the bank, blue-dominant.
            lake = 0.64 < v and not on_bank and gp[x, y] == 0
            wv = 0.0
            if lake and b >= g * 0.9:
                wv = min(1.0, (v - 0.64) / 0.05)
            wp[x, y] = int(255 * wv)

            # Hair: very dark pixels in the girl's head/hair box.
            hv = 0.0
            if 0.74 < u < 0.86 and 0.48 < v < 0.72 and lum < 34:
                hv = 1.0
                # The free ends (right/lower) move most; the crown stays put.
                hv *= min(1.0, max(0.15, (u - 0.75) / 0.08)) * min(1.0, max(0.3, (v - 0.48) / 0.12))
            hp[x, y] = int(255 * hv)

            # Depth: sky far, far trees and lake mid, willow + bank + girl near.
            d = 0.0
            if v > 0.52:
                d = 0.25 + 0.35 * min(1.0, (v - 0.52) / 0.48)
            if frond > 0.05 and not on_bank:
                d = max(d, 0.55 + 0.3 * frond)
            if on_bank:
                d = max(d, 0.8)
            if gp[x, y]:
                d = 1.0
            if u > 0.86 and v > 0.1 and lum < 70:
                d = max(d, 0.85)
            dp[x, y] = int(255 * (0.3 + 0.7 * d))

    sway = sway.filter(ImageFilter.GaussianBlur(2.2))
    water = water.filter(ImageFilter.GaussianBlur(3))
    hair = hair.filter(ImageFilter.GaussianBlur(2.5))
    depth = depth.filter(ImageFilter.GaussianBlur(6))

    Image.merge('RGBA', (sway, water, hair, depth)).save(OUT, optimize=True)
    print('wrote', OUT.relative_to(ROOT), OUT.stat().st_size, 'bytes')


if __name__ == '__main__':
    main()
