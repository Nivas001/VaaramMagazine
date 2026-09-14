#!/usr/bin/env python3
"""
─────────────────────────────────────────────────────────────────────────────
 VAARAM MAGAZINE — WEBSITE ADS: THE ADMINISTRATOR'S MANUAL

 How to put an advertisement on vaaram.ca, where each one lands, and how to
 look after it afterwards. Written for whoever sits at the desk — not for a
 developer.

 Set in Inter throughout, on the website's own palette.

 Screenshots come from scripts/capture-ad-admin-screenshots.py.
 Output: documents/VAARAM-WEBSITE-ADS-MANUAL.pdf
─────────────────────────────────────────────────────────────────────────────
"""
import pathlib

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = pathlib.Path(__file__).resolve().parent.parent
DOCS = ROOT / "documents"
SHOTS = DOCS / "ad-admin-screenshots"
FONTS = DOCS / "fonts"
CACHE = DOCS / "_print-cache"
OUT = DOCS / "VAARAM-WEBSITE-ADS-MANUAL.pdf"
DOCS.mkdir(parents=True, exist_ok=True)

VERSION = "Version 1.0  ·  September 2026"


# ── Fonts — Inter, as asked for, with a Helvetica fallback ──────────────────
def _register_fonts():
    def reg(name, file, fallback):
        try:
            pdfmetrics.registerFont(TTFont(name, str(FONTS / file)))
            return name
        except Exception:
            return fallback

    disp = reg("Disp", "InterDisplay-ExtraBold.ttf", "Helvetica-Bold")
    disp_b = reg("DispB", "InterDisplay-Bold.ttf", "Helvetica-Bold")
    disp_s = reg("DispS", "InterDisplay-SemiBold.ttf", "Helvetica-Bold")
    body = reg("Inter", "Inter-Regular.ttf", "Helvetica")
    med = reg("InterM", "Inter-Medium.ttf", "Helvetica")
    semi = reg("InterS", "Inter-SemiBold.ttf", "Helvetica-Bold")
    bold = reg("InterB", "Inter-Bold.ttf", "Helvetica-Bold")
    ital = reg("InterI", "Inter-Italic.ttf", "Helvetica-Oblique")
    try:
        pdfmetrics.registerFontFamily(body, normal=body, bold=bold, italic=ital)
    except Exception:
        pass
    return disp, disp_b, disp_s, body, med, semi, bold


DISP, DISP_B, DISP_S, BODY, MED, SEMI, BOLD = _register_fonts()

# ── The website's own palette, lifted from app/globals.css ──────────────────
WINE = colors.HexColor("#8A1332")
WINE_DEEP = colors.HexColor("#4A0A1B")
WINE_SOFT = colors.HexColor("#B0334F")
GOLD = colors.HexColor("#B07A5C")
GOLD_PALE = colors.HexColor("#F0D7C8")
INK = colors.HexColor("#141215")
MUTED = colors.HexColor("#5C544B")
FAINT = colors.HexColor("#7B7267")
LINE = colors.HexColor("#E6E0D6")
PAPER = colors.HexColor("#FAF8F4")
TINT = colors.HexColor("#F3EFE8")
WHITE = colors.white

GREEN = colors.HexColor("#1E6B42")
GREEN_BG = colors.HexColor("#EAF4EE")
AMBER = colors.HexColor("#8A5A06")
AMBER_BG = colors.HexColor("#FCF5E6")
RED = colors.HexColor("#A62B22")
RED_BG = colors.HexColor("#FBEFEC")
BLUE = colors.HexColor("#1A568C")
BLUE_BG = colors.HexColor("#EDF4FA")

PW, PH = A4
ML, MR = 18 * mm, 18 * mm
MT, MB = 20 * mm, 18 * mm
CONTENT_W = PW - ML - MR

HAIR = " "
NBSP = " "


def spaced(text):
    """Letter-spacing for a label drawn straight onto the canvas.

    Inter is a text face, not a label face, and ReportLab's ParagraphStyle has
    no letter-spacing of its own — so the tracking that makes a small uppercase
    eyebrow readable is inserted by hand, one hair space at a time.
    """
    return HAIR.join(text)


def tracked(text):
    """The same idea, but safe inside a Paragraph.

    A Paragraph treats every kind of space as a word separator and collapses
    runs of them, which silently eats the gaps *between words* and leaves
    "THE ADMINISTRATOR'S MANUAL" set as one long word. Non-breaking spaces are
    not separators, so they survive: one between letters, three across a word
    gap so it still reads as one.
    """
    return NBSP.join(NBSP if ch == " " else ch for ch in text)


S = {
    "cover_eyebrow": ParagraphStyle("ce", fontName=SEMI, fontSize=7.6, leading=11,
                                    textColor=GOLD_PALE, spaceAfter=10),
    "cover_title": ParagraphStyle("ct", fontName=DISP, fontSize=38, leading=40,
                                  textColor=WHITE, spaceAfter=6),
    "cover_sub": ParagraphStyle("cs", fontName=DISP_S, fontSize=15, leading=21,
                                textColor=GOLD_PALE, spaceAfter=14),
    "cover_body": ParagraphStyle("cb", fontName=BODY, fontSize=10, leading=16,
                                 textColor=colors.HexColor("#E8DAD5")),
    "cover_meta": ParagraphStyle("cm", fontName=MED, fontSize=8, leading=12,
                                 textColor=colors.HexColor("#C9AFA9")),

    "h1": ParagraphStyle("h1", fontName=DISP, fontSize=20, leading=23.5,
                         textColor=INK, spaceBefore=2, spaceAfter=4),
    "h2": ParagraphStyle("h2", fontName=DISP_B, fontSize=12.5, leading=16,
                         textColor=INK, spaceBefore=9, spaceAfter=3),
    "h3": ParagraphStyle("h3", fontName=DISP_S, fontSize=10, leading=13.5,
                         textColor=INK, spaceBefore=6, spaceAfter=2),
    "eyebrow": ParagraphStyle("eb", fontName=SEMI, fontSize=6.8, leading=9,
                              textColor=WINE, spaceAfter=3),
    "lede": ParagraphStyle("ld", fontName=BODY, fontSize=10, leading=15.5,
                           textColor=INK, spaceAfter=7),
    "body": ParagraphStyle("bd", fontName=BODY, fontSize=8.9, leading=13.6,
                           textColor=MUTED, spaceAfter=5.5),
    "body_ink": ParagraphStyle("bi", fontName=BODY, fontSize=8.9, leading=13.6,
                               textColor=INK, spaceAfter=5.5),
    "bullet": ParagraphStyle("bu", fontName=BODY, fontSize=8.8, leading=13.4,
                             textColor=MUTED, leftIndent=11, spaceAfter=3),
    "th": ParagraphStyle("th", fontName=SEMI, fontSize=6.5, leading=8.6, textColor=FAINT),
    "td": ParagraphStyle("td", fontName=BODY, fontSize=8.1, leading=11.6, textColor=INK),
    "td_m": ParagraphStyle("tm", fontName=BODY, fontSize=7.9, leading=11.2, textColor=MUTED),
    "td_s": ParagraphStyle("ts", fontName=SEMI, fontSize=8.1, leading=11.6, textColor=INK),
    "td_wine": ParagraphStyle("tw", fontName=SEMI, fontSize=7.6, leading=10.6, textColor=WINE),
    "cap": ParagraphStyle("cp", fontName=MED, fontSize=6.9, leading=9.6,
                          textColor=FAINT, alignment=TA_CENTER),
    "step_n": ParagraphStyle("sn", fontName=DISP, fontSize=19, leading=21, textColor=WINE),
    "step_t": ParagraphStyle("st", fontName=DISP_B, fontSize=10.5, leading=14,
                             textColor=INK, spaceAfter=2),
    "step_b": ParagraphStyle("sb", fontName=BODY, fontSize=8.6, leading=13,
                             textColor=MUTED, spaceAfter=3),
    "toc_n": ParagraphStyle("tn", fontName=DISP_B, fontSize=9.5, leading=13, textColor=WINE),
    "toc_t": ParagraphStyle("tt", fontName=DISP_S, fontSize=10, leading=13.5, textColor=INK),
    "toc_d": ParagraphStyle("tdd", fontName=BODY, fontSize=8.2, leading=12, textColor=MUTED),
    "toc_p": ParagraphStyle("tp", fontName=MED, fontSize=8.5, leading=13,
                            textColor=FAINT, alignment=TA_RIGHT),
    "shape_t": ParagraphStyle("sht", fontName=DISP_B, fontSize=10, leading=13,
                              textColor=INK, alignment=TA_CENTER, spaceAfter=1),
    "shape_s": ParagraphStyle("shs", fontName=SEMI, fontSize=7.4, leading=10,
                              textColor=WINE, alignment=TA_CENTER, spaceAfter=3),
    "shape_b": ParagraphStyle("shb", fontName=BODY, fontSize=7.6, leading=11,
                              textColor=MUTED, alignment=TA_CENTER),
}


# ═══ Building blocks ════════════════════════════════════════════════════════
def rule(color=LINE, thickness=0.6, before=1.5 * mm, after=3 * mm, width=None):
    t = Table([[""]], colWidths=[width or CONTENT_W], rowHeights=[thickness])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), color),
                           ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                           ("TOPPADDING", (0, 0), (-1, -1), 0),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    return [Spacer(1, before), t, Spacer(1, after)]


def chapter(number, title, lede=None):
    out = [Paragraph(tracked(f"SECTION {number:02d}"), S["eyebrow"]),
           Paragraph(title, S["h1"])]
    if lede:
        out.append(Paragraph(lede, S["lede"]))
    out.extend(rule(LINE, 0.7, 0.5 * mm, 3 * mm))
    return out


def h2(text):
    return [Paragraph(text, S["h2"])]


def p(text, style="body"):
    return [Paragraph(text, S[style])]


def bullets(items):
    return [Paragraph(f"<font color='#8A1332'>•</font>&nbsp;&nbsp;{i}", S["bullet"])
            for i in items]


def callout(title, text, kind="neutral"):
    border, bg, tc = WINE, TINT, INK
    if kind == "amber":
        border, bg, tc = AMBER, AMBER_BG, colors.HexColor("#5E3D02")
    elif kind == "red":
        border, bg, tc = RED, RED_BG, colors.HexColor("#6E1A14")
    elif kind == "green":
        border, bg, tc = GREEN, GREEN_BG, colors.HexColor("#0E4527")
    elif kind == "blue":
        border, bg, tc = BLUE, BLUE_BG, colors.HexColor("#0C365C")

    inner = [Paragraph(title, ParagraphStyle("cot", fontName=DISP_B, fontSize=9.2,
                                             leading=12.5, textColor=tc, spaceAfter=2.5)),
             Paragraph(text, ParagraphStyle("cob", fontName=BODY, fontSize=8.5,
                                            leading=12.8, textColor=INK))]
    t = Table([[inner]], colWidths=[CONTENT_W])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), bg),
                           ("LINEBEFORE", (0, 0), (0, -1), 2.4, border),
                           ("LEFTPADDING", (0, 0), (-1, -1), 4.5 * mm),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 4.5 * mm),
                           ("TOPPADDING", (0, 0), (-1, -1), 3.5 * mm),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5 * mm)]))
    return [Spacer(1, 1.5 * mm), t, Spacer(1, 3 * mm)]


PRINT_DPI = 190


def _for_print(path, width_pt):
    """A copy of a capture at the size it is actually printed, and no bigger.

    Shots are taken at twice desktop scale so their type stays sharp, which
    makes them far larger than any page can use. Redrawing each to its printed
    width at 190 dpi is identical on paper and a fraction of the file.
    """
    CACHE.mkdir(parents=True, exist_ok=True)
    target_px = int(round(width_pt / 72.0 * PRINT_DPI))
    out = CACHE / f"ads-{path.stem}@{target_px}.jpg"
    if not out.exists() or out.stat().st_mtime < path.stat().st_mtime:
        with PILImage.open(path) as im:
            im = im.convert("RGB")
            if im.width > target_px:
                h = round(im.height * target_px / im.width)
                im = im.resize((target_px, h), PILImage.LANCZOS)
            im.save(out, "JPEG", quality=84, optimize=True, subsampling=1)
    return out


def _sized(path, width, max_height):
    with PILImage.open(path) as im:
        iw, ih = im.size
    h = width * ih / iw
    if h > max_height:
        width = max_height * iw / ih
        h = max_height
    return Image(str(_for_print(path, width)), width=width, height=h)


def figure(name, caption, width=CONTENT_W, max_height=112 * mm, frame=True):
    path = SHOTS / f"{name}.png"
    if not path.exists():
        return [Paragraph(f"[missing figure: {name}]", S["body"])]

    img = _sized(path, width, max_height)
    t = Table([[img], [Paragraph(caption, S["cap"])]], colWidths=[width])
    style = [("ALIGN", (0, 0), (-1, -1), "CENTER"),
             ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
             ("LEFTPADDING", (0, 0), (-1, -1), 0),
             ("RIGHTPADDING", (0, 0), (-1, -1), 0),
             ("TOPPADDING", (0, 0), (-1, -1), 2),
             ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]
    if frame:
        style.append(("BOX", (0, 0), (0, 0), 0.6, LINE))
    t.setStyle(TableStyle(style))
    return [KeepTogether([Spacer(1, 2 * mm), t, Spacer(1, 3 * mm)])]


def figure_pair(n1, c1, n2, c2, max_height=70 * mm):
    w = (CONTENT_W - 5 * mm) / 2.0

    def cell(name, cap):
        path = SHOTS / f"{name}.png"
        if not path.exists():
            return [Paragraph(f"[missing: {name}]", S["body"])]
        return [_sized(path, w, max_height), Spacer(1, 1.4 * mm), Paragraph(cap, S["cap"])]

    t = Table([[cell(n1, c1), cell(n2, c2)]], colWidths=[w, w])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                           ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                           ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                           ("TOPPADDING", (0, 0), (-1, -1), 1),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 1)]))
    return [KeepTogether([Spacer(1, 2 * mm), t, Spacer(1, 3 * mm)])]


def figure_beside(name, blocks, image_share=0.46, max_height=95 * mm):
    """A capture on the left, the words that explain it on the right."""
    path = SHOTS / f"{name}.png"
    iw = CONTENT_W * image_share
    tw = CONTENT_W - iw - 5 * mm
    left = [_sized(path, iw, max_height)] if path.exists() else [Paragraph("—", S["body"])]
    t = Table([[left, blocks]], colWidths=[iw, tw + 5 * mm])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                           ("BOX", (0, 0), (0, 0), 0.6, LINE),
                           ("LEFTPADDING", (0, 0), (0, -1), 0),
                           ("LEFTPADDING", (1, 0), (1, -1), 5 * mm),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                           ("TOPPADDING", (0, 0), (-1, -1), 0),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    return [KeepTogether([Spacer(1, 2 * mm), t, Spacer(1, 3 * mm)])]


def table(headers, rows, widths, zebra=True, header_bg=TINT):
    """A plain table. `headers=None` leaves the header band off entirely —
    an empty grey bar above a row of figures reads as a rendering fault."""
    data = []
    if headers:
        data.append([Paragraph(tracked(h.upper()), S["th"]) for h in headers])
    for r in rows:
        data.append([c if not isinstance(c, str) else Paragraph(c, S["td"]) for c in r])

    head = 1 if headers else 0
    t = Table(data, colWidths=widths, repeatRows=head)
    style = [("VALIGN", (0, 0), (-1, -1), "TOP"),
             ("LINEBELOW", (0, head), (-1, -2), 0.35, LINE),
             ("LEFTPADDING", (0, 0), (-1, -1), 2.8 * mm),
             ("RIGHTPADDING", (0, 0), (-1, -1), 2.8 * mm),
             ("TOPPADDING", (0, 0), (-1, -1), 2.2 * mm),
             ("BOTTOMPADDING", (0, 0), (-1, -1), 2.2 * mm)]
    if headers:
        style += [("BACKGROUND", (0, 0), (-1, 0), header_bg),
                  ("LINEBELOW", (0, 0), (-1, 0), 0.7, LINE)]
    if zebra:
        for i in range(head, len(data)):
            if (i - head) % 2 == 1:
                style.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#FCFAF6")))
    t.setStyle(TableStyle(style))
    return [Spacer(1, 1.5 * mm), t, Spacer(1, 3 * mm)]


def step(number, title, body, extra=None):
    left = Paragraph(f"{number:02d}", S["step_n"])
    right = [Paragraph(title, S["step_t"]), Paragraph(body, S["step_b"])]
    if extra:
        right.extend(extra)
    t = Table([[left, right]], colWidths=[17 * mm, CONTENT_W - 17 * mm])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                           ("BACKGROUND", (0, 0), (-1, -1), TINT),
                           ("LINEBEFORE", (0, 0), (0, -1), 2.4, WINE),
                           ("ALIGN", (0, 0), (0, -1), "CENTER"),
                           ("LEFTPADDING", (0, 0), (0, -1), 3 * mm),
                           ("LEFTPADDING", (1, 0), (1, -1), 0),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
                           ("TOPPADDING", (0, 0), (-1, -1), 3.2 * mm),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 3.2 * mm)]))
    return [Spacer(1, 2 * mm), t, Spacer(1, 1 * mm)]


# ═══ Diagrams drawn on the page itself ══════════════════════════════════════
def shape_card(title, px, ratio, w, h, body, box_w):
    """One artwork shape, drawn at its true proportion."""
    frame = Table([[""]], colWidths=[w], rowHeights=[h])
    frame.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 1.1, WINE),
                               ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F7E9EC"))]))
    inner = [frame, Spacer(1, 3 * mm),
             Paragraph(title, S["shape_t"]),
             Paragraph(f"{px}&nbsp;&nbsp;·&nbsp;&nbsp;{ratio}", S["shape_s"]),
             Paragraph(body, S["shape_b"])]
    t = Table([[inner]], colWidths=[box_w])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                           ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                           ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                           ("BACKGROUND", (0, 0), (-1, -1), WHITE),
                           ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
                           ("TOPPADDING", (0, 0), (-1, -1), 5 * mm),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 5 * mm)]))
    return t


def shapes_diagram():
    """The three proportions the whole website sells, side by side, true to size."""
    box_w = (CONTENT_W - 8 * mm) / 3.0
    inner_w = box_w - 8 * mm

    cards = [
        shape_card("Card", "1200 × 600 px", "2 : 1", inner_w, inner_w / 2,
                   "Side rails and the footer. The workhorse — most bookings are this.",
                   box_w),
        shape_card("Wide strip", "1650 × 300 px", "11 : 2", inner_w, inner_w * 2 / 11,
                   "Every wide band across a page. On a phone it is only ~64px tall: "
                   "a logo and four words, never a phone number.", box_w),
        shape_card("Tall tower", "600 × 1200 px", "1 : 2", inner_w / 2.2, inner_w / 1.1,
                   "Stands beside the top of the home page. Set it like a shop window: "
                   "name, one line, a number.", box_w),
    ]
    t = Table([cards], colWidths=[box_w] * 3)
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                           ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("RIGHTPADDING", (0, 0), (0, -1), 4 * mm),
                           ("RIGHTPADDING", (1, 0), (1, -1), 4 * mm),
                           ("RIGHTPADDING", (2, 0), (2, -1), 0),
                           ("TOPPADDING", (0, 0), (-1, -1), 0),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    return [Spacer(1, 2 * mm), t, Spacer(1, 3 * mm)]


def state_key():
    """The four states a booking can be in, as the desk colours them."""
    def chip(label, fg, bg):
        pstyle = ParagraphStyle("chp", fontName=SEMI, fontSize=7.4, leading=10,
                                textColor=fg, alignment=TA_CENTER)
        t = Table([[Paragraph(tracked(label.upper()), pstyle)]], colWidths=[24 * mm])
        t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), bg),
                               ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                               ("TOPPADDING", (0, 0), (-1, -1), 1.8 * mm),
                               ("BOTTOMPADDING", (0, 0), (-1, -1), 1.8 * mm),
                               ("LEFTPADDING", (0, 0), (-1, -1), 1 * mm),
                               ("RIGHTPADDING", (0, 0), (-1, -1), 1 * mm)]))
        return t

    rows = [
        [chip("Live", GREEN, GREEN_BG),
         "On the website right now. A reader can see it."],
        [chip("Scheduled", BLUE, BLUE_BG),
         "Booked and paid for, but its start date has not arrived. It appears by itself on the day."],
        [chip("Paused", AMBER, AMBER_BG),
         "Switched off by hand. Nothing to do with dates — it stays in the list, keeps its "
         "figures, and goes back up the moment you press Show."],
        [chip("Finished", FAINT, TINT),
         "Its end date has passed. Give it a new one to run it again, or delete it."],
    ]
    data = [[r[0], Paragraph(r[1], S["td_m"])] for r in rows]
    t = Table(data, colWidths=[28 * mm, CONTENT_W - 28 * mm])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                           ("LINEBELOW", (0, 0), (-1, -2), 0.35, LINE),
                           ("LEFTPADDING", (0, 0), (0, -1), 0),
                           ("LEFTPADDING", (1, 0), (1, -1), 4 * mm),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                           ("TOPPADDING", (0, 0), (-1, -1), 2.4 * mm),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 2.4 * mm)]))
    return [Spacer(1, 1.5 * mm), t, Spacer(1, 3 * mm)]


def flow_diagram():
    """The whole job, as seven boxes."""
    steps = ["Advertiser\npays", "Open\nWebsite ads", "Pick a free\nspace", "Upload the\nartwork",
             "Check the\npreview", "Book it", "It is live\non vaaram.ca"]
    n = len(steps)
    gap = 2.2 * mm
    w = (CONTENT_W - (n - 1) * gap) / n

    cells = []
    for i, s in enumerate(steps):
        last = i == n - 1
        st = ParagraphStyle("fd", fontName=SEMI if last else MED, fontSize=6.9, leading=9.4,
                            textColor=WHITE if last else INK, alignment=TA_CENTER)
        cell = Table([[Paragraph(s.replace("\n", "<br/>"), st)]], colWidths=[w], rowHeights=[15 * mm])
        cell.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), WINE if last else TINT),
            ("BOX", (0, 0), (-1, -1), 0.6, WINE if last else LINE),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 1.5 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 1.5 * mm)]))
        cells.append(cell)

    t = Table([cells], colWidths=[w] * n)
    style = [("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
             ("LEFTPADDING", (0, 0), (-1, -1), 0),
             ("RIGHTPADDING", (0, 0), (-1, -1), gap),
             ("RIGHTPADDING", (n - 1, 0), (n - 1, -1), 0),
             ("TOPPADDING", (0, 0), (-1, -1), 0),
             ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]
    t.setStyle(TableStyle(style))
    return [Spacer(1, 2 * mm), t, Spacer(1, 1.5 * mm),
            Paragraph("The whole job, start to finish. Nothing else is required — no developer, "
                      "no deployment, no waiting.", S["cap"]), Spacer(1, 3 * mm)]


# ═══ Page furniture ═════════════════════════════════════════════════════════
def cover_canvas(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, PW, PH, stroke=0, fill=1)
    canvas.setFillColor(WINE_DEEP)
    canvas.rect(0, PH - 150 * mm, PW, 150 * mm, stroke=0, fill=1)
    canvas.setFillColor(WINE)
    canvas.rect(0, PH - 153 * mm, PW, 3 * mm, stroke=0, fill=1)

    canvas.setFont(SEMI, 8)
    canvas.setFillColor(colors.Color(1, 1, 1, alpha=0.30))
    canvas.drawString(ML, PH - 20 * mm, spaced("VAARAM MAGAZINE  ·  DISCOVER. CONNECT. EVERY WEEK."))

    canvas.setFont(MED, 7)
    canvas.setFillColor(FAINT)
    canvas.drawString(ML, 12 * mm, spaced("ADMINISTRATOR'S MANUAL  ·  INTERNAL"))
    canvas.drawRightString(PW - MR, 12 * mm, spaced("PAGE 01"))
    canvas.restoreState()


def body_canvas(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, PW, PH, stroke=0, fill=1)

    canvas.setFont(MED, 6.9)
    canvas.setFillColor(FAINT)
    canvas.drawString(ML, PH - 13 * mm, spaced("VAARAM MAGAZINE  /  WEBSITE ADS — THE ADMINISTRATOR'S MANUAL"))
    canvas.drawRightString(PW - MR, PH - 13 * mm, spaced(f"PAGE {doc.page:02d}"))
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.6)
    canvas.line(ML, PH - 15 * mm, PW - MR, PH - 15 * mm)

    canvas.setFont(MED, 6.6)
    canvas.drawString(ML, 11 * mm, spaced("WEEKLY ADVERTISING & CLASSIFIEDS PUBLICATION  ·  CANADA"))
    canvas.drawRightString(PW - MR, 11 * mm, spaced("ADMIN → WEBSITE ADS"))
    canvas.line(ML, 14 * mm, PW - MR, 14 * mm)
    canvas.restoreState()


# ═══ The inventory, exactly as lib/types.ts declares it ═════════════════════
INVENTORY = [
    ("Home — leaderboard, above everything", "Home", "Wide strip", "1", "Premium",
     "A wide strip across the very top of the home page, above the headline and above the "
     "week's cover. The first advertisement anyone sees."),
    ("Home — tower, left of the headline", "Home", "Tall tower", "2", "Premium",
     "Two tall upright towers running down the left of the opening screen, beside the headline."),
    ("Home — cards, right of the headline", "Home", "Card", "4", "Premium",
     "Four cards stacked down the right of the opening screen, beside the week's cover."),
    ("Home — under the hero", "Home", "Wide strip", "1", "Strong",
     "A wide strip directly under the opening screen — the first slot a reader meets after "
     "scrolling."),
    ("Home — mid page", "Home", "Wide strip", "1", "Strong",
     "Halfway down the home page, just after the section explaining what Vaaram is. "
     "The same booking also runs on the About page."),
    ("Home — feature block", "Home", "Wide strip", "1", "Strong",
     "In the feature block between the two halves of the home page. The most room a single "
     "advertiser gets on the site."),
    ("Home — above the closing call", "Home", "Wide strip", "1", "Standard",
     "The last wide strip on the home page, just above the closing panel."),
    ("Archive — above the editions", "Archive", "Wide strip", "1", "Standard",
     "Above the archive browser, before the first cover."),
    ("Archive — between editions", "Archive", "Wide strip", "1", "Standard",
     "Dealt into the archive's cover grid, after the eighth edition."),
    ("Reader — above the pages", "Edition reader", "Wide strip", "1", "Premium",
     "Directly above the pages of an edition — the last thing a reader passes before they "
     "start reading."),
    ("Side rail — beside the reader", "Edition reader", "Card", "Unlimited", "Premium",
     "A standing column of cards beside the pages of an edition — on screen for as long as "
     "somebody is reading."),
    ("Reader — under the pages", "Edition reader", "Wide strip", "1", "Standard",
     "Directly under the edition, seen by someone who has just finished reading it."),
    ("Side rail — every page", "Every page", "Card", "Unlimited", "Strong",
     "The main rail — a standing column of cards down the left of the home page and the "
     "archive. It also tops up the reader's own rail when that one is short."),
    ("Every page — above the footer", "Every page", "Card", "Unlimited", "Standard",
     "A wrapping grid of cards above the footer on every single page — home, archive, about, "
     "contact and every edition."),
]


# ═══ The document ═══════════════════════════════════════════════════════════
def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=ML, rightMargin=MR, topMargin=MT, bottomMargin=MB,
        title="Vaaram Magazine — Website Ads: The Administrator's Manual",
        author="Vaaram Magazine",
        subject="How to add, preview and manage advertisements on vaaram.ca",
    )
    cover_frame = Frame(ML, MB, CONTENT_W, PH - MB - 20 * mm, id="cover",
                        leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    body_frame = Frame(ML, MB + 4 * mm, CONTENT_W, PH - MT - MB - 6 * mm, id="body",
                       leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([
        PageTemplate(id="Cover", frames=[cover_frame], onPage=cover_canvas),
        PageTemplate(id="Body", frames=[body_frame], onPage=body_canvas),
    ])

    F = []

    # ── Cover ───────────────────────────────────────────────────────────────
    F += [Spacer(1, 42 * mm),
          Paragraph(tracked("THE ADMINISTRATOR'S MANUAL"), S["cover_eyebrow"]),
          Paragraph("Website Ads", S["cover_title"]),
          Paragraph("Putting an advertisement on vaaram.ca —<br/>and looking after it afterwards.",
                    S["cover_sub"]),
          Spacer(1, 4 * mm),
          Paragraph(
              "Everything the desk does, in order: what the website sells, where each space "
              "lands on the page, how to book one in five steps, how to see it in position "
              "before anybody else does, and how to pause, reorder, renew or remove it later.",
              S["cover_body"]),
          Spacer(1, 52 * mm),
          Paragraph(f"{VERSION}<br/>Admin → Website ads  ·  vaaram.ca", S["cover_meta"])]

    F.append(NextPageTemplate("Body"))
    F.append(PageBreak())

    # ── Contents ────────────────────────────────────────────────────────────
    F += [Paragraph(tracked("CONTENTS"), S["eyebrow"]),
          Paragraph("What is in this manual", S["h1"])]
    F += rule(LINE, 0.7, 1 * mm, 4 * mm)

    toc = [
        ("01", "Before you start", "The two kinds of Vaaram advertising, and which one this is.", "03"),
        ("02", "The desk at a glance", "Five figures, three views, and what each one answers.", "04"),
        ("03", "The three artwork shapes", "Card, wide strip, tall tower — and what fits in each.", "07"),
        ("04", "Every space the website sells", "All fourteen, with what a reader sees.", "08"),
        ("05", "The map, page by page", "The picture of the site, and how to read its colours.", "10"),
        ("06", "Booking an ad", "The five steps, in order, with nothing hidden.", "13"),
        ("07", "Seeing it in position first", "The preview: desktop, phone, and the real page.", "17"),
        ("08", "Managing what is running", "Order, pause, edit, delete — and which to use when.", "19"),
        ("09", "Dates, expiry and renewals", "Start, stop, the fourteen-day warning, and the schedule.", "21"),
        ("10", "What is free to sell", "Reading occupancy, and the panel an empty slot shows.", "23"),
        ("11", "Artwork that works", "What to send an advertiser, and what to refuse.", "24"),
        ("12", "When something looks wrong", "The short list of things that actually go wrong.", "25"),
        ("13", "Quick reference", "One page to keep beside the desk.", "26"),
    ]
    rows = []
    for n, t, d, pg in toc:
        rows.append([Paragraph(n, S["toc_n"]),
                     [Paragraph(t, S["toc_t"]), Paragraph(d, S["toc_d"])],
                     Paragraph(pg, S["toc_p"])])
    tt = Table(rows, colWidths=[12 * mm, CONTENT_W - 30 * mm, 18 * mm])
    tt.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                            ("LINEBELOW", (0, 0), (-1, -2), 0.35, LINE),
                            ("LEFTPADDING", (0, 0), (-1, -1), 0),
                            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                            ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm)]))
    F += [tt, Spacer(1, 6 * mm)]
    F += flow_diagram()
    F.append(PageBreak())

    # ── 01 Before you start ─────────────────────────────────────────────────
    F += chapter(1, "Before you start",
                 "Vaaram sells two different things, and mixing them up is the one mistake "
                 "that costs money. This manual is about the second.")

    F += table(
        ["", "Inside the weekly PDF", "On the website itself"],
        [[Paragraph("What it is", S["td_s"]),
          Paragraph("Space on a page of the printed edition — a classified line, a quarter "
                    "page, a full page.", S["td_m"]),
          Paragraph("A banner in one of fourteen fixed spaces on vaaram.ca.", S["td_m"])],
         [Paragraph("Who lays it out", S["td_s"]),
          Paragraph("Vaaram. The advertiser sends words and pictures; we set it and send a "
                    "proof.", S["td_m"]),
          Paragraph("The advertiser supplies finished artwork at one of three exact sizes.",
                    S["td_m"])],
         [Paragraph("How long it runs", S["td_s"]),
          Paragraph("One edition — one week — then it stays in the archive forever.", S["td_m"]),
          Paragraph("As long as you set. A week, three months, or until you stop it.", S["td_m"])],
         [Paragraph("Where it is managed", S["td_s"]),
          Paragraph("Admin → Publish, as part of the edition's PDF.", S["td_m"]),
          Paragraph("<b>Admin → Website ads.</b> This manual.", S["td_m"])]],
        [26 * mm, (CONTENT_W - 26 * mm) / 2, (CONTENT_W - 26 * mm) / 2])

    F += callout(
        "They are sold separately, and they can be sold together",
        "An advertiser can buy a half page inside this week's edition and a side-rail banner on "
        "the website, and most of the ones worth having will take both. Nothing in the admin "
        "links them — two separate jobs, two separate screens.")

    F += h2("Getting to the desk")
    F += p("Sign in at <b>vaaram.ca/admin</b> and choose <b>Website ads</b> from the row of "
           "sections along the top. Everything in this manual happens on that screen and the "
           "two it leads to.")
    F += bullets([
        "<b>Website ads</b> — the desk. What is running, what is free, where it all lands.",
        "<b>Book an ad</b> — the five-step form for a new booking.",
        "<b>Edit</b> — one booking, with the same picture of the website beside it.",
    ])

    F += callout(
        "Nothing you do here needs a developer",
        "Booking, pausing, reordering, renewing and removing all take effect on the live "
        "website within a minute. There is no deployment step and no code change. If you can "
        "see it on the desk, you can change it.", "green")

    F.append(PageBreak())

    # ── 02 The desk at a glance ─────────────────────────────────────────────
    F += chapter(2, "The desk at a glance",
                 "One screen, five figures across the top and three views underneath. "
                 "Between them they answer every question the job asks.")

    F += figure("01-desk-top",
                "Admin → Website ads. The five figures, the three views, and the beginning of "
                "the map underneath.", max_height=118 * mm)

    F += h2("The five figures")
    F += table(
        ["Figure", "What it counts", "What to do about it"],
        [["<b>Live on the site</b>",
          Paragraph("Bookings a reader can see right now.", S["td_m"]),
          Paragraph("Nothing. This is the number you are paid for.", S["td_m"])],
         ["<b>Ending within 14 days</b>",
          Paragraph("Live bookings whose end date is close.", S["td_m"]),
          Paragraph("Ring the advertiser. Renew from the Edit screen with one button.", S["td_m"])],
         ["<b>Scheduled</b>",
          Paragraph("Booked, but the start date has not arrived.", S["td_m"]),
          Paragraph("Nothing. They appear by themselves on the day.", S["td_m"])],
         ["<b>Paused</b>",
          Paragraph("Switched off by hand — not by a date.", S["td_m"]),
          Paragraph("Check none of these should be running. A paused ad earns nothing.",
                    S["td_m"])],
         ["<b>Free frames to sell</b>",
          Paragraph("Empty space across the whole website.", S["td_m"]),
          Paragraph("This is the sales list. Every free frame is showing Vaaram's own "
                    "panel instead of a paying advertisement.", S["td_m"])]],
        [34 * mm, 56 * mm, CONTENT_W - 90 * mm])

    F += callout(
        "If you read one number, read the last one",
        "“Free frames to sell” is the only figure on the desk that is about money you are not "
        "yet making. Four empty slots means four places where a reader is being shown "
        "“this space could be your advertisement” instead of a client's.", "amber")

    F.append(PageBreak())

    F += h2("The three views")
    F += p("The tabs under the figures are three ways of looking at the same bookings. Each one "
           "exists to answer a different question, and nothing is duplicated between them.")

    F += table(
        ["View", "The question it answers", "Use it when"],
        [["<b>Where ads appear</b>",
          Paragraph("What have we sold, and what is still free?", S["td_m"]),
          Paragraph("Somebody rings up wanting to advertise, and you need to know what you "
                    "can offer them.", S["td_m"])],
         ["<b>All bookings</b>",
          Paragraph("Where is this particular advertiser?", S["td_m"]),
          Paragraph("You need to find, change, reorder, pause or remove one booking out of "
                    "thirty.", S["td_m"])],
         ["<b>Schedule</b>",
          Paragraph("What runs out, and when?", S["td_m"]),
          Paragraph("Monday morning. It is the renewals list.", S["td_m"])]],
        [32 * mm, 58 * mm, CONTENT_W - 90 * mm])

    F += h2("The four states a booking can be in")
    F += p("Every booking carries one of these four words, in the same colour, everywhere it "
           "appears on the desk.")
    F += state_key()

    F += callout(
        "Paused is not the same as finished, and neither is the same as deleted",
        "<b>Paused</b> you did on purpose and can undo in one click. <b>Finished</b> happened "
        "on its own, because a date passed. <b>Deleted</b> cannot be undone: the row, the "
        "artwork and the view and click counts all go. When in doubt, pause.", "red")

    F.append(PageBreak())

    # ── 03 The three shapes ─────────────────────────────────────────────────
    F += chapter(3, "The three artwork shapes",
                 "The whole website sells exactly three proportions. An advertiser supplies "
                 "one file per shape, and the same file is used on phones, tablets and "
                 "desktops — only the space around it changes.")

    F += shapes_diagram()

    F += callout(
        "The proportion never changes between devices — and that is the point",
        "Every space holds its shape at every screen size; only its width changes. That is why "
        "an advertiser sends one image rather than three. The desk tells you which shape a "
        "space takes before you upload anything, and the upload zone prints the exact pixel "
        "size beside it.")

    F += h2("What happens to a file after you choose it")
    F += p("You do not need to resize anything by hand. The moment a file is chosen, and before "
           "it is uploaded anywhere, the admin redraws it to the exact pixel size of the space "
           "and re-encodes it. A 2 MB export usually lands under 100 KB.")
    F += bullets([
        "<b>It is fitted, never cropped.</b> The whole artwork is kept and any spare room is "
        "filled with white. An advertiser paid for that image, and losing a phone number off "
        "the edge of it is a worse outcome than a white margin.",
        "<b>It is re-encoded to WebP.</b> Advertisement files are served straight to readers "
        "without going through an optimiser, so every byte uploaded is a byte every visitor "
        "downloads.",
        "<b>Accepted:</b> JPG, PNG and WebP, under 2 MB. Nothing else — a PDF or an "
        "Illustrator file cannot be shown on a web page.",
    ])

    F += h2("Booking one advertiser into two different shapes")
    F += p("If the same advertiser is going into, say, the side rail (a card) and the home "
           "leaderboard (a wide strip), the booking form asks for <b>one image per shape</b> — "
           "not one photo stretched into both. A picture composed for a 2:1 card leaves an 11:2 "
           "strip almost entirely empty either side, which looks like a fault rather than an "
           "advertisement.")

    F.append(PageBreak())

    # ── 04 Every space ──────────────────────────────────────────────────────
    F += chapter(4, "Every space the website sells",
                 "Fourteen spaces, in the order a reader meets them. “Frames” is how many "
                 "advertisements are on screen at once — book more than that and they take "
                 "turns.")

    F += table(
        ["The space", "Page", "Shape", "Frames", "Tier"],
        [[Paragraph(name, S["td_s"]), Paragraph(page, S["td_m"]),
          Paragraph(shape, S["td_m"]), Paragraph(frames, S["td_m"]),
          Paragraph(tier, S["td_wine"])]
         for name, page, shape, frames, tier, _ in INVENTORY],
        [CONTENT_W - 98 * mm, 27 * mm, 22 * mm, 23 * mm, 26 * mm])

    F += callout(
        "“Unlimited” means the page simply grows",
        "The two side rails and the footer grid hold any number of advertisements — every "
        "booking is on the page at once, one under another, in the order you set. The other "
        "eleven spaces have a fixed number of frames, and anything booked beyond that takes "
        "turns in them.")

    F.append(PageBreak())

    F += h2("What a reader actually sees, space by space")
    F += table(
        ["The space", "What a reader is looking at when they meet it"],
        [[Paragraph(name, S["td_s"]), Paragraph(desc, S["td_m"])]
         for name, _, _, _, _, desc in INVENTORY],
        [62 * mm, CONTENT_W - 62 * mm])

    F += callout(
        "On a phone, the side rails are threaded through the page",
        "There is no room for a standing column on a phone, so the same cards are dealt into "
        "the page a couple at a time as the reader scrolls. Every booking still appears, in the "
        "same order, at full width — and because a view is only counted once a card has been on "
        "screen for a full second, threading them through means more of them are genuinely "
        "seen, not fewer.", "blue")

    F.append(PageBreak())

    # ── 05 The map ──────────────────────────────────────────────────────────
    F += chapter(5, "The map, page by page",
                 "The first view on the desk draws each page of the website small, with the "
                 "advertisement spaces as real blocks among the headline, the cover and the "
                 "text. Every block is a button.")

    F += figure("03-map-home",
                "The home page. Left: the page drawn small, every advertisement space in "
                "position. Right: the same spaces as a list, each saying how full it is.",
                max_height=140 * mm)

    F += h2("Reading the colours")
    F += table(
        ["Colour", "Meaning"],
        [[Paragraph("<b>Solid wine</b>", S["td_s"]),
          Paragraph("Booked and running. The number on the first frame says how many bookings "
                    "share that space.", S["td_m"])],
         [Paragraph("<b>Amber</b>", S["td_s"]),
          Paragraph("Booked, but something in it finishes within fourteen days.", S["td_m"])],
         [Paragraph("<b>Dashed outline, “FREE”</b>", S["td_s"]),
          Paragraph("Nothing booked. The website is showing Vaaram's own “this space could be "
                    "your advertisement” panel there instead.", S["td_m"])]],
        [34 * mm, CONTENT_W - 34 * mm])

    F += p("Click any block — or any row in the list beside it — to open that space: a full "
           "preview of the page it sits on, everything already booked into it, and a button to "
           "book it.")

    F.append(PageBreak())

    # Full width, one under the other. Side by side these two came out at half
    # the width and nothing inside them could be read, which defeats the point
    # of printing a map at all.
    F += figure("04-map-archive",
                "The archive. The side rail runs down the left; two wide strips sit above the "
                "cover grid and inside it, after the eighth edition.", max_height=104 * mm)

    F += figure("05-map-reader",
                "The edition reader, where readers stay longest — which is what makes its rail "
                "and its top strip the most valuable space on the site.", max_height=104 * mm)

    F.append(PageBreak())

    F += figure("06-map-everywhere",
                "“Every page”: the two spaces that are not tied to one page — the main side rail "
                "and the footer grid, which is on home, archive, about, contact and every "
                "edition without exception.", max_height=76 * mm)

    F += h2("Using the map to sell")
    F += bullets([
        "<b>Start from the empty blocks.</b> Every dashed “FREE” block is a space currently "
        "showing Vaaram's own panel instead of a paying advertiser.",
        "<b>Match the shape to what they already have.</b> A business with a landscape logo "
        "belongs in a card or a strip, not a tower — the map tells you which spaces take which.",
        "<b>Quote the position, not the name.</b> “The wide strip directly above this week's "
        "edition” sells; “home_hero” does not. Every row on the map is written in the first "
        "form for exactly that reason.",
    ])

    F.append(PageBreak())

    # ── 06 Booking ──────────────────────────────────────────────────────────
    F += chapter(6, "Booking an ad",
                 "Five steps down one page, with a picture of the website beside them that "
                 "updates as you fill the form in. Nothing is hidden behind a “next” button: "
                 "check it top to bottom, once, the way you would check a paper order form.")

    F += p("Start it either from <b>Book an ad</b> at the top of the desk, or from "
           "<b>Book this slot</b> inside a space you have just opened on the map — which "
           "arrives with that space already chosen for you.")

    F += step(1, "Choose where it appears",
              "The spaces are grouped by page and each card tells you three things: where it is, "
              "what shape the artwork must be, and how full it is right now. A space with room "
              "says so in wine. Tick <b>Put it in several places</b> to book one advertiser into "
              "more than one space at once.")

    F += step(2, "Add the artwork",
              "One image, at the size printed beside the upload zone. Drop the file on the zone "
              "or press Choose image. It is resized and re-encoded for you. If the spaces you "
              "ticked in step 1 use more than one shape, this step asks for one image per shape "
              "and says why.")

    F += step(3, "Say who it is for",
              "The advertiser's name is only ever shown to you — it is how you will find this "
              "booking again in six weeks. The link is optional: leave it blank and the "
              "advertisement still shows, it just is not clickable. Clicks are counted either "
              "way.")

    F += step(4, "Set when it runs",
              "One month, three, six, or no end date — the four buttons set both dates for you. "
              "An end date is what puts the booking on the schedule and what triggers the "
              "fourteen-day warning, so set one whenever the advertiser has paid for a fixed "
              "run. It runs to the <b>end</b> of the day you choose.")

    F += step(5, "Put it on the website",
              "Leave “Show it on the website straight away” ticked and it is live within a "
              "minute. Untick it to save the booking paused — useful when the artwork is "
              "approved but the invoice is not paid yet.")

    F.append(PageBreak())

    F += figure("14-book-step1",
                "Step 1. Every space on the site, grouped by page, each showing its shape, its "
                "size in pixels and how full it is. The picture on the right follows whatever "
                "is selected.", max_height=125 * mm)

    F.append(PageBreak())

    F += figure("15-book-artwork",
                "Steps 2 and 3, with the artwork chosen. The moment a file is picked it appears "
                "in the preview on the right, in position on the real page.",
                max_height=125 * mm)

    F.append(PageBreak())

    F += figure("16-book-dates",
                "Step 4. The four run-length buttons fill both dates. “Finer control” holds the "
                "running order, the edition filter and the seconds-on-screen setting — all "
                "optional, and all changeable afterwards.", max_height=125 * mm)

    F += callout(
        "Nothing here is permanent",
        "Every field on this form — including the artwork and the space itself — can be changed "
        "afterwards from the Edit screen. Book it, look at it on the live site, adjust if it "
        "needs it.", "green")

    F.append(PageBreak())

    # ── 07 Preview ──────────────────────────────────────────────────────────
    F += chapter(7, "Seeing it in position first",
                 "The panel beside the booking form, and the Preview button on every row, both "
                 "draw the same thing: the actual page of the website, with this advertisement "
                 "in its actual place, surrounded by whatever else is really booked.")

    F += figure_beside(
        "17-book-preview",
        [Paragraph("What the preview shows", S["h2"]),
         Paragraph("The whole page, drawn small, with every advertisement currently booked into "
                   "it rendered in its own frame — and the one you are working on ringed in "
                   "wine so you cannot lose it.", S["body"]),
         Paragraph("This is not a guess or a mock-up. The spaces, their proportions and their "
                   "order are the same ones the website itself uses, and the artwork shown in "
                   "the other frames is the artwork really running there.", S["body"]),
         Paragraph("Desktop and Phone", S["h2"]),
         Paragraph("The toggle at the top switches between the two arrangements. They are "
                   "genuinely different: on a phone the side rails are threaded through the "
                   "page and the hero's towers and cards leave the sides to gather under the "
                   "headline. An advertiser being sold “the left rail” is mostly buying that "
                   "behaviour, so it is worth looking at both before you quote.", S["body"]),
         Paragraph("Open the real page", S["h2"]),
         Paragraph("The link under the preview opens the live page in a new tab, so you can "
                   "check the finished thing the way a reader will see it.", S["body"])],
        image_share=0.40, max_height=125 * mm)

    F += callout(
        "Why a drawing rather than the real page in a little window",
        "A shrunken copy of the live site would be honest and useless — nothing in it could be "
        "read, it would cost a full page load every time, and it could not show an <i>empty</i> "
        "space at all, which is the thing you most need to see.")

    F.append(PageBreak())

    F += figure("12-preview-in-position",
                "The same preview reached from a booking that is already live: press Preview on "
                "any row. The artwork itself is printed beside the page, along with where a "
                "click sends the reader.", max_height=125 * mm)

    F += h2("Check both before you quote")
    F += p("Two thirds of Vaaram's readers are on a phone. An advertisement that reads "
           "beautifully on a desktop rail and turns into an unreadable sliver on a phone is a "
           "complaint waiting to happen — and the preview will have shown you, before you "
           "took the money.")

    F.append(PageBreak())

    # ── 08 Managing ─────────────────────────────────────────────────────────
    F += chapter(8, "Managing what is running",
                 "The <b>All bookings</b> view is the working list: every booking, grouped by "
                 "the space it sits in, in the order a reader meets them.")

    F += figure("09-list",
                "All bookings. Search by advertiser or space, filter by state, and act on any "
                "row without leaving the page.", max_height=120 * mm)

    F += h2("Finding one booking")
    F += p("The search box matches the advertiser's name, the space and the link. The filter "
           "chips beside it carry their own counts, so <b>Ending soon 3</b> tells you there are "
           "three to chase before you have clicked anything.")

    F.append(PageBreak())

    F += figure("10-booking-row",
                "One row. Thumbnail, advertiser, state, the run, the figures, and every control "
                "that applies to it.", max_height=42 * mm)

    F += h2("What each control does")
    F += table(
        ["Control", "What it does", "Can it be undone?"],
        [[Paragraph("<b>↑ ↓ arrows</b>", S["td_s"]),
          Paragraph("Moves the booking one place up or down inside its own space. The number "
                    "on the left is its position in the running order a reader sees.", S["td_m"]),
          Paragraph("Yes — press the other arrow.", S["td_m"])],
         [Paragraph("<b>Preview</b>", S["td_s"]),
          Paragraph("Draws the page with this advertisement in position. Changes nothing.",
                    S["td_m"]),
          Paragraph("Nothing to undo.", S["td_m"])],
         [Paragraph("<b>Edit</b>", S["td_s"]),
          Paragraph("Opens the full booking: artwork, space, dates, link, order, everything.",
                    S["td_m"]),
          Paragraph("Yes — nothing saves until you press Save changes.", S["td_m"])],
         [Paragraph("<b>Hide / Show</b>", S["td_s"]),
          Paragraph("Takes the advertisement off the website, or puts it back. The booking "
                    "stays in the list and keeps its figures.", S["td_m"]),
          Paragraph("Yes, instantly.", S["td_m"])],
         [Paragraph("<b>Delete</b>", S["td_s"]),
          Paragraph("Removes the booking, throws the artwork away and loses its view and click "
                    "counts. Asks once first.", S["td_m"]),
          Paragraph("<b>No.</b>", S["td_m"])]],
        [26 * mm, CONTENT_W - 26 * mm - 38 * mm, 38 * mm])

    F += callout(
        "Hide, not Delete, when an advertiser is between runs",
        "Hiding keeps the row, the artwork and the figures — so when they come back you press "
        "Show and set new dates, with nothing to re-upload and the history intact. Delete is "
        "for bookings that will never return.", "amber")

    F += h2("Changing the running order")
    F += p("Where several advertisements share a space, the number beside each one is its "
           "position. Use the arrows for a single step. To move something a long way — from "
           "twelfth to second in a long rail — open Edit and type a number in "
           "<b>Position in the running order</b> instead: positions step in tens, so typing 15 "
           "drops a booking between the ones at 10 and 20 without renumbering anything.")

    F.append(PageBreak())

    # ── 09 Dates ────────────────────────────────────────────────────────────
    F += chapter(9, "Dates, expiry and renewals",
                 "A booking with an end date looks after itself: it goes up on its start date, "
                 "comes down at the end of its last day, and warns you a fortnight before it "
                 "does.")

    F += figure("13-schedule",
                "The Schedule view. Everything running or about to, soonest to finish first. "
                "The vertical line is today; a bar that fades out to the right has no end date.",
                max_height=118 * mm)

    F += h2("How the two dates behave")
    F += bullets([
        "<b>Start showing on</b> — blank means straight away. Set it and the booking sits as "
        "<i>Scheduled</i> until that morning, then appears by itself.",
        "<b>Stop showing after</b> — the advertisement runs to the <b>end</b> of the day you "
        "choose, not the beginning of it. Blank means it never stops.",
        "<b>Fourteen days out</b>, a live booking with an end date starts counting down on the "
        "desk, turns amber on the map, and is listed in the warning strip at the top.",
    ])

    F += h2("Renewing")
    F += p("Open the booking and use <b>+1 month</b>, <b>+3 months</b> or <b>+6 months</b> beside "
           "the dates. They extend from whichever is later — today or the current end date — so "
           "renewing early never shortens a run the advertiser has already paid for. "
           "<b>Remove end date</b> turns it into an open-ended booking.")

    F.append(PageBreak())

    F += figure("18-edit",
                "The Edit screen. The same picture of the website as the booking form, and it "
                "follows every change — swap the artwork or move it to another space and you "
                "see the result before you save.", max_height=125 * mm)

    F += callout(
        "Moving a booking to a differently-shaped space",
        "If you change the space to one with a different proportion, the desk will not let you "
        "save until you upload artwork drawn for the new shape. The old file would either be "
        "cropped or sit in a band of empty background — neither is what the advertiser paid "
        "for.", "amber")

    F.append(PageBreak())

    # ── 10 Free inventory ───────────────────────────────────────────────────
    F += chapter(10, "What is free to sell",
                 "Click any space on the map — booked or empty — and it opens with the whole "
                 "page drawn around it.")

    F += figure_pair(
        "07-slot-detail", "An empty space. The website is showing Vaaram's own panel here until "
                          "something is booked. “Book this slot” starts the form with this "
                          "space already chosen.",
        "08-slot-detail-full", "A full one. Everything booked into it, in running order, each "
                               "with its state and a way straight into it.",
        max_height=96 * mm)

    F += h2("How occupancy is described")
    F += table(
        ["What it says", "What it means"],
        [[Paragraph("<b>Empty — 1 frame free</b>", S["td_s"]),
          Paragraph("Nothing booked. Available to sell immediately.", S["td_m"])],
         [Paragraph("<b>2 of 4 frames taken · 2 free</b>", S["td_s"]),
          Paragraph("Room for more without anything having to take turns.", S["td_m"])],
         [Paragraph("<b>Full — 1 of 1 frame taken</b>", S["td_s"]),
          Paragraph("Sold. Anything further booked here would share the frame.", S["td_m"])],
         [Paragraph("<b>6 sharing 4 frames</b>", S["td_s"]),
          Paragraph("Over-subscribed on purpose: six bookings taking turns in four frames. "
                    "Still sellable, but each one is on screen less often.", S["td_m"])],
         [Paragraph("<b>8 running · room for any number more</b>", S["td_s"]),
          Paragraph("A rail or the footer grid. There is no ceiling — the page grows.",
                    S["td_m"])]],
        [56 * mm, CONTENT_W - 56 * mm])

    F += callout(
        "An empty space is never an empty box",
        "The website never shows a blank rectangle. Anywhere nothing is booked, it shows "
        "Vaaram's own quiet “this space could be your advertisement” panel, which links to the "
        "contact page. It keeps the page looking right and it sells the slot to the businesses "
        "reading the site.", "green")

    F.append(PageBreak())

    # ── 11 Artwork that works ───────────────────────────────────────────────
    F += chapter(11, "Artwork that works",
                 "What to ask an advertiser for, and what to send back.")

    F += table(
        ["Shape", "Ask for", "Refuse"],
        [[Paragraph("<b>Card</b><br/>1200 × 600", S["td_s"]),
          Paragraph("A name, one line of what they do, and a way to reach them. It is printed "
                    "about the size of a business card on a phone.", S["td_m"]),
          Paragraph("Paragraphs. Price lists. Anything set smaller than the name.", S["td_m"])],
         [Paragraph("<b>Wide strip</b><br/>1650 × 300", S["td_s"]),
          Paragraph("A logo and three or four words. On a phone this is roughly 64 pixels "
                    "tall.", S["td_m"]),
          Paragraph("A phone number — it will not be legible on a phone. Put it in the link "
                    "instead.", S["td_m"])],
         [Paragraph("<b>Tall tower</b><br/>600 × 1200", S["td_s"]),
          Paragraph("Set it like a shop window: name at the top, one line, a number at the "
                    "bottom.", S["td_m"]),
          Paragraph("A landscape photograph. It will sit in a white band with most of the "
                    "tower empty.", S["td_m"])]],
        [28 * mm, (CONTENT_W - 28 * mm) * 0.55, (CONTENT_W - 28 * mm) * 0.45])

    F += h2("The rules the admin enforces for you")
    F += bullets([
        "JPG, PNG or WebP only, under 2 MB. Anything else is refused with a sentence saying why.",
        "Every file is redrawn to the exact size of its space and re-encoded before upload.",
        "Artwork is fitted inside the frame, never cropped — nothing is lost off the edge.",
        "Every advertisement on the site carries an “Advertisement” label, and every clickable "
        "one is marked as a paid link. Both are required of paid placement in Canada and "
        "neither is optional.",
    ])

    F += h2("Seconds on screen")
    F += p("Where advertisements take turns, each one holds its frame for seven seconds unless "
           "you say otherwise. Give a busy advertisement carrying an address or a phone number "
           "longer — anything from 3 to 60 seconds — and a plain logo less. It is under "
           "<b>Finer control</b> on the booking form and on the Edit screen.")

    F.append(PageBreak())

    # ── 12 Troubleshooting ──────────────────────────────────────────────────
    F += chapter(12, "When something looks wrong",
                 "The short list of things that actually happen, and what each one means.")

    F += table(
        ["What you see", "What it means", "What to do"],
        [[Paragraph("<b>The ad is not on the website</b>", S["td_s"]),
          Paragraph("It is Paused, Scheduled, or Finished — the desk will say which.", S["td_m"]),
          Paragraph("Find it in All bookings and read its state chip. Press Show, or fix the "
                    "dates.", S["td_m"])],
         [Paragraph("<b>“This space could be your advertisement”</b>", S["td_s"]),
          Paragraph("Nothing live is booked in that space. This is Vaaram's own panel, not a "
                    "fault.", S["td_m"]),
          Paragraph("Book it, or check whether the booking you expected is paused or "
                    "finished.", S["td_m"])],
         [Paragraph("<b>A white band beside the artwork</b>", S["td_s"]),
          Paragraph("The supplied file was not the shape of the space, so it was fitted rather "
                    "than cropped.", S["td_m"]),
          Paragraph("Ask the advertiser for artwork at the exact size printed on the upload "
                    "zone.", S["td_m"])],
         [Paragraph("<b>“Artwork must be under 2 MB”</b>", S["td_s"]),
          Paragraph("The file is too heavy to serve to every reader.", S["td_m"]),
          Paragraph("Ask for it exported again at a lower quality, or as a JPG.", S["td_m"])],
         [Paragraph("<b>The ad shows but clicks go nowhere</b>", S["td_s"]),
          Paragraph("No link was set, or the one set was not a valid web address.", S["td_m"]),
          Paragraph("Open Edit and put a full address in, starting with https://", S["td_m"])],
         [Paragraph("<b>The order on the site is not what you set</b>", S["td_s"]),
          Paragraph("Paused and finished bookings keep their position in the list but are not "
                    "on the page.", S["td_m"]),
          Paragraph("Filter to Live and check the order of those.", S["td_m"])],
         [Paragraph("<b>Views are not going up</b>", S["td_s"]),
          Paragraph("A view is only counted once a card has been at least half on screen for a "
                    "full second. Readers who scroll straight past are not counted.", S["td_m"]),
          Paragraph("Nothing. This is deliberate — it is what makes the figures defensible when "
                    "a client asks.", S["td_m"])]],
        [42 * mm, (CONTENT_W - 42 * mm) * 0.5, (CONTENT_W - 42 * mm) * 0.5])

    F.append(PageBreak())

    # ── 13 Quick reference ──────────────────────────────────────────────────
    F += chapter(13, "Quick reference",
                 "One page to keep beside the desk.")

    F += h2("Booking an advertisement")
    F += table(
        ["Step", "Do this"],
        [[Paragraph("<b>1</b>", S["td_wine"]),
          Paragraph("Admin → <b>Website ads</b> → <b>Where ads appear</b>. Find a space with "
                    "room.", S["td_m"])],
         [Paragraph("<b>2</b>", S["td_wine"]),
          Paragraph("Click it → <b>Book this slot</b>.", S["td_m"])],
         [Paragraph("<b>3</b>", S["td_wine"]),
          Paragraph("Drop in the artwork at the size printed on the upload zone.", S["td_m"])],
         [Paragraph("<b>4</b>", S["td_wine"]),
          Paragraph("Advertiser's name, and the link if they have one.", S["td_m"])],
         [Paragraph("<b>5</b>", S["td_wine"]),
          Paragraph("Press a run length — one, three or six months.", S["td_m"])],
         [Paragraph("<b>6</b>", S["td_wine"]),
          Paragraph("Look at the picture on the right. Desktop, then Phone.", S["td_m"])],
         [Paragraph("<b>7</b>", S["td_wine"]),
          Paragraph("<b>Book this ad</b>. It is live within a minute.", S["td_m"])]],
        [10 * mm, CONTENT_W - 10 * mm], zebra=False)

    F += h2("The numbers to know")
    F += table(
        None,
        [[Paragraph("<b>1200 × 600</b><br/><font size=7 color='#5C544B'>Card</font>", S["td"]),
          Paragraph("<b>1650 × 300</b><br/><font size=7 color='#5C544B'>Wide strip</font>", S["td"]),
          Paragraph("<b>600 × 1200</b><br/><font size=7 color='#5C544B'>Tall tower</font>", S["td"]),
          Paragraph("<b>2 MB</b><br/><font size=7 color='#5C544B'>Largest file</font>", S["td"])],
         [Paragraph("<b>14 days</b><br/><font size=7 color='#5C544B'>Expiry warning</font>", S["td"]),
          Paragraph("<b>7 seconds</b><br/><font size=7 color='#5C544B'>Default turn</font>", S["td"]),
          Paragraph("<b>3–60 s</b><br/><font size=7 color='#5C544B'>Turn range</font>", S["td"]),
          Paragraph("<b>14</b><br/><font size=7 color='#5C544B'>Spaces on the site</font>", S["td"])]],
        [CONTENT_W / 4] * 4, zebra=False)

    F += h2("Which button, when")
    F += table(
        ["If you want to…", "Use"],
        [[Paragraph("Take an ad down for now and put it back later", S["td_m"]),
          Paragraph("<b>Hide</b>", S["td_s"])],
         [Paragraph("Give an advertiser another three months", S["td_m"]),
          Paragraph("<b>Edit → +3 months → Save</b>", S["td_s"])],
         [Paragraph("Move one ad up its rail by one place", S["td_m"]),
          Paragraph("<b>↑ on the row</b>", S["td_s"])],
         [Paragraph("Move one ad a long way up its rail", S["td_m"]),
          Paragraph("<b>Edit → Position</b>", S["td_s"])],
         [Paragraph("Put the same artwork in another space of the same shape", S["td_m"]),
          Paragraph("<b>Edit → Put this same artwork in other spaces too</b>", S["td_s"])],
         [Paragraph("Swap the artwork for a new design", S["td_m"]),
          Paragraph("<b>Edit → Upload new artwork</b>", S["td_s"])],
         [Paragraph("See what is still available to sell", S["td_m"]),
          Paragraph("<b>Where ads appear</b>", S["td_s"])],
         [Paragraph("See what runs out this month", S["td_m"]),
          Paragraph("<b>Schedule</b>", S["td_s"])],
         [Paragraph("Remove an advertiser for good", S["td_m"]),
          Paragraph("<b>Delete</b> — it cannot be undone", S["td_s"])]],
        [CONTENT_W - 66 * mm, 66 * mm])

    F += callout(
        "One habit worth keeping",
        "Before you quote a price, open the space on the map and look at the preview on a "
        "phone. Half of what an advertiser is buying is how their artwork behaves on the screen "
        "most readers actually use.")

    doc.build(F)
    size = OUT.stat().st_size / (1024 * 1024)
    print(f"Written {OUT}  ({size:.1f} MB)")


if __name__ == "__main__":
    build()
