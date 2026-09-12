#!/usr/bin/env python3
"""Renders a PDF to PNG pages so the layout can be reviewed. Proofing aid."""
import pathlib
import sys

import fitz

SRC = pathlib.Path(sys.argv[1] if len(sys.argv) > 1
                   else "documents/VAARAM-ADVERTISING-GUIDE.pdf")
OUT = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else "documents/_proof")
OUT.mkdir(parents=True, exist_ok=True)

for f in OUT.glob("*.png"):
    f.unlink()

doc = fitz.open(SRC)
print(f"{SRC.name}: {doc.page_count} pages")
for i, page in enumerate(doc):
    page.get_pixmap(dpi=96).save(OUT / f"p{i + 1:02d}.png")
print(f"rendered -> {OUT}")
