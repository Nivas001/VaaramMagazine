#!/usr/bin/env python3
"""Tiles rendered PDF pages into contact sheets so the whole document can be
reviewed for layout faults at a glance."""
import pathlib
import sys

from PIL import Image, ImageDraw, ImageFont

SRC = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "documents/_proof")
PER_SHEET = int(sys.argv[2]) if len(sys.argv) > 2 else 12
COLS = 4
TW, TH = 300, 424

pages = sorted(SRC.glob("p*.png"))
font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 15)

for start in range(0, len(pages), PER_SHEET):
    chunk = pages[start:start + PER_SHEET]
    rows = (len(chunk) + COLS - 1) // COLS
    sheet = Image.new("RGB", (COLS * TW, rows * (TH + 22)), "#cccccc")
    draw = ImageDraw.Draw(sheet)
    for i, p in enumerate(chunk):
        im = Image.open(p)
        im.thumbnail((TW - 10, TH - 10))
        x, y = (i % COLS) * TW, (i // COLS) * (TH + 22)
        sheet.paste(im, (x + 5, y + 22))
        draw.text((x + 6, y + 3), p.stem, font=font, fill="black")
    out = SRC / f"_sheet-{start // PER_SHEET + 1}.jpg"
    sheet.save(out, quality=82)
    print(out)
