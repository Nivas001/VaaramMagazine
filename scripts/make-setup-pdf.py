"""Renders SETUP-GUIDE.md into a styled SETUP-GUIDE.pdf."""
import re, html, pathlib
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, Frame, PageTemplate, Paragraph,
                                Spacer, Table, TableStyle, PageBreak, HRFlowable)

# ── Fonts ────────────────────────────────────────────────────────────────
SUP = "/System/Library/Fonts/Supplemental/"
try:
    pdfmetrics.registerFont(TTFont("Body", SUP + "Verdana.ttf"))
    pdfmetrics.registerFont(TTFont("Body-Bold", SUP + "Verdana Bold.ttf"))
    pdfmetrics.registerFont(TTFont("Body-Italic", SUP + "Verdana Italic.ttf"))
    pdfmetrics.registerFontFamily("Body", normal="Body", bold="Body-Bold", italic="Body-Italic")
    BODY, BOLD = "Body", "Body-Bold"
except Exception:
    BODY, BOLD = "Helvetica", "Helvetica-Bold"
MONO = "Courier"

VIOLET = colors.HexColor("#7C3AED")
INDIGO = colors.HexColor("#4F46E5")
FUCHSIA = colors.HexColor("#D946EF")
INK = colors.HexColor("#171429")
MUTED = colors.HexColor("#67618D")
LINE = colors.HexColor("#E2E0EF")
TINT = colors.HexColor("#F7F5FF")
AMBER_BG = colors.HexColor("#FEF6E7")
AMBER_LINE = colors.HexColor("#F0A93B")

# ── Styles ───────────────────────────────────────────────────────────────
ss = getSampleStyleSheet()
S = {
 "h1": ParagraphStyle("h1", parent=ss["Title"], fontName=BOLD, fontSize=26, leading=31,
                      textColor=INK, alignment=TA_LEFT, spaceAfter=4),
 "h2": ParagraphStyle("h2", fontName=BOLD, fontSize=15.5, leading=20, textColor=VIOLET,
                      spaceBefore=20, spaceAfter=7),
 "h3": ParagraphStyle("h3", fontName=BOLD, fontSize=11.5, leading=15, textColor=INK,
                      spaceBefore=13, spaceAfter=4),
 "p":  ParagraphStyle("p", fontName=BODY, fontSize=9.3, leading=14.6, textColor=INK, spaceAfter=7),
 "li": ParagraphStyle("li", fontName=BODY, fontSize=9.3, leading=14.6, textColor=INK,
                      leftIndent=13, spaceAfter=3.5),
 "quote": ParagraphStyle("quote", fontName=BODY, fontSize=8.9, leading=14, textColor=INK,
                         leftIndent=9, rightIndent=7, spaceBefore=3, spaceAfter=3),
 "code": ParagraphStyle("code", fontName=MONO, fontSize=8.0, leading=11.6,
                        textColor=colors.HexColor("#2B2840"), leftIndent=8, rightIndent=6,
                        spaceBefore=3, spaceAfter=3),
 "th": ParagraphStyle("th", fontName=BOLD, fontSize=8.3, leading=11.6, textColor=colors.white),
 "td": ParagraphStyle("td", fontName=BODY, fontSize=8.3, leading=11.8, textColor=INK),
 "cover_sub": ParagraphStyle("cs", fontName=BODY, fontSize=11, leading=17, textColor=MUTED,
                             spaceAfter=6),
}

REPLACE = {"₹": "Rs.", "⚠️": "", "⚠": "", "→": "->", "←": "<-", "✓": "-", "⋯": "...",
           "•": "-", " ": " ", "’": "'", "‘": "'", "“": '"', "”": '"'}

def clean(t: str) -> str:
    for a, b in REPLACE.items():
        t = t.replace(a, b)
    return t

def inline(t: str) -> str:
    """Markdown inline -> reportlab markup."""
    t = clean(t)
    t = html.escape(t)
    t = re.sub(r"`([^`]+)`",
               rf'<font face="{MONO}" size="8" color="#4338CA">\1</font>', t)
    t = re.sub(r"\*\*([^*]+)\*\*", rf'<font face="{BOLD}">\1</font>', t)
    t = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<link href="\2" color="#4F46E5">\1</link>', t)
    return t

# ── Parse the markdown ───────────────────────────────────────────────────
md = pathlib.Path("SETUP-GUIDE.md").read_text().split("\n")
# Skip the markdown's own title block; the PDF cover already covers it.
for _start, _line in enumerate(md):
    if _line.strip() == "---":
        md = md[_start + 1:]
        break
flow, i = [], 0

def code_block(lines):
    rows = [[Paragraph(html.escape(clean(l)).replace(" ", "&nbsp;") or "&nbsp;", S["code"])]
            for l in lines]
    t = Table(rows, colWidths=[158 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), TINT),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 1.2), ("BOTTOMPADDING", (0, 0), (-1, -1), 1.2),
        ("TOPPADDING", (0, 0), (-1, 0), 8), ("BOTTOMPADDING", (0, -1), (-1, -1), 8),
    ]))
    return t

def make_table(rows):
    header, body = rows[0], rows[1:]
    n = len(header)
    # First column gets more room; the rest share what's left.
    if n == 2:
        widths = [58 * mm, 100 * mm]
    elif n == 3:
        widths = [40 * mm, 66 * mm, 52 * mm]
    else:
        widths = [158 * mm / n] * n
    data = [[Paragraph(inline(c), S["th"]) for c in header]]
    for r in body:
        data.append([Paragraph(inline(c), S["td"]) for c in r])
    t = Table(data, colWidths=widths, repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), INDIGO),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, LINE),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]
    for r in range(1, len(data)):
        if r % 2 == 0:
            style.append(("BACKGROUND", (0, r), (-1, r), TINT))
    t.setStyle(TableStyle(style))
    return t

def callout(paras):
    rows = [[Paragraph(inline(p), S["quote"])] for p in paras]
    t = Table(rows, colWidths=[158 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), AMBER_BG),
        ("LINEBEFORE", (0, 0), (0, -1), 2.6, AMBER_LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 11), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, 0), 9), ("BOTTOMPADDING", (0, -1), (-1, -1), 9),
    ]))
    return t

while i < len(md):
    line = md[i]

    if line.startswith("```"):
        i += 1; buf = []
        while i < len(md) and not md[i].startswith("```"):
            buf.append(md[i]); i += 1
        i += 1
        flow += [Spacer(1, 4), code_block(buf), Spacer(1, 8)]
        continue

    if line.startswith("|"):
        rows = []
        while i < len(md) and md[i].startswith("|"):
            cells = [c.strip() for c in md[i].strip().strip("|").split("|")]
            if not all(re.fullmatch(r":?-{2,}:?", c) for c in cells):
                rows.append(cells)
            i += 1
        if rows:
            flow += [Spacer(1, 5), make_table(rows), Spacer(1, 10)]
        continue

    if line.startswith(">"):
        # Gather the whole blockquote, treating a bare ">" as a paragraph break
        # and joining wrapped lines back together.
        paras, cur = [], []
        while i < len(md) and md[i].startswith(">"):
            txt = md[i].lstrip(">").strip()
            if txt:
                cur.append(txt)
            elif cur:
                paras.append(" ".join(cur)); cur = []
            i += 1
        if cur:
            paras.append(" ".join(cur))
        if paras:
            flow += [Spacer(1, 4), callout(paras), Spacer(1, 10)]
        continue

    if line.startswith("---") and line.strip() == "---":
        flow += [Spacer(1, 6), HRFlowable(width="100%", thickness=0.7, color=LINE), Spacer(1, 4)]
        i += 1; continue

    m = re.match(r"^(#{1,3})\s+(.*)", line)
    if m:
        level, text = len(m.group(1)), m.group(2)
        flow.append(Paragraph(inline(text), S[f"h{level}"]))
        if level == 2:
            flow.append(HRFlowable(width="34%", thickness=2.4, color=FUCHSIA, spaceAfter=9,
                                   hAlign="LEFT"))
        i += 1; continue

    m = re.match(r"^(\d+)\.\s+(.*)", line)
    if m:
        flow.append(Paragraph(f'<font face="{BOLD}" color="#7C3AED">{m.group(1)}.</font>  '
                              + inline(m.group(2)), S["li"]))
        i += 1; continue

    m = re.match(r"^\s*[-*]\s+(.*)", line)
    if m:
        indent = 13 + (len(line) - len(line.lstrip())) * 4
        st = ParagraphStyle("x", parent=S["li"], leftIndent=indent)
        flow.append(Paragraph(f'<font color="#D946EF">&bull;</font>  ' + inline(m.group(1)), st))
        i += 1; continue

    if line.strip():
        flow.append(Paragraph(inline(line.strip()), S["p"]))
    i += 1

# ── Cover ────────────────────────────────────────────────────────────────
cover = [
    Spacer(1, 46 * mm),
    Paragraph('<font color="#7C3AED" size="10">ADEXPRESS CLASSIFIEDS WEEKLY</font>',
              ParagraphStyle("k", fontName=BOLD, fontSize=10, leading=14, textColor=VIOLET)),
    Spacer(1, 8),
    Paragraph("Website Setup Guide", ParagraphStyle("ct", fontName=BOLD, fontSize=34,
                                                    leading=40, textColor=INK)),
    Spacer(1, 6),
    HRFlowable(width="26%", thickness=3.5, color=FUCHSIA, hAlign="LEFT"),
    Spacer(1, 16),
    Paragraph("Everything you need to take this website live, step by step. "
              "No prior technical experience assumed.", S["cover_sub"]),
    Paragraph("Follow the parts in order. Nothing in this guide costs money &mdash; "
              "the only recurring bill is your domain name.", S["cover_sub"]),
]
flow = cover + [PageBreak()] + flow

# ── Page furniture ───────────────────────────────────────────────────────
def decorate(canvas, doc):
    canvas.saveState()
    w, h = A4
    if doc.page == 1:
        canvas.setFillColor(VIOLET); canvas.rect(0, h - 13 * mm, w, 13 * mm, stroke=0, fill=1)
        canvas.setFillColor(FUCHSIA); canvas.rect(0, h - 13 * mm, w * 0.42, 13 * mm, stroke=0, fill=1)
    else:
        canvas.setFillColor(LINE); canvas.rect(0, h - 18 * mm, w, 0.6, stroke=0, fill=1)
        canvas.setFont(BODY, 7.6); canvas.setFillColor(MUTED)
        canvas.drawString(26 * mm, h - 15.5 * mm, "AdExpress - Website Setup Guide")
    canvas.setFont(BODY, 7.6); canvas.setFillColor(MUTED)
    canvas.drawRightString(w - 26 * mm, 13 * mm, str(doc.page))
    canvas.restoreState()

doc = BaseDocTemplate("SETUP-GUIDE.pdf", pagesize=A4,
                      leftMargin=26 * mm, rightMargin=26 * mm,
                      topMargin=24 * mm, bottomMargin=20 * mm,
                      title="AdExpress - Website Setup Guide", author="AdExpress")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
doc.addPageTemplates([PageTemplate(id="all", frames=[frame], onPage=decorate)])
doc.build(flow)
print("SETUP-GUIDE.pdf written")
