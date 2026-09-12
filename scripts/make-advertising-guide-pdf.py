#!/usr/bin/env python3
"""
─────────────────────────────────────────────────────────────────────────────
 VAARAM MAGAZINE — THE ADVERTISING GUIDE

 A client-facing manual for one job only: selling, posting and managing
 advertisements on the website itself.

   · What the website sells, and how it differs from space inside the PDF
   · The two artwork shapes, and the eleven places an advertisement can go
   · The side rail — the long column of advertisements — in full
   · A worked example: one advertiser booked from start to finish, on camera
   · Managing a booking afterwards: order, hide, edit, expire, delete
   · The demonstration advertisements now running on the live site

 Styled to match VAARAM PRODUCT & ADMINISTRATOR DOCUMENTATION v1.0.

 Output: documents/VAARAM-ADVERTISING-GUIDE.pdf
─────────────────────────────────────────────────────────────────────────────
"""
import pathlib

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
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
SHOTS = DOCS / "ad-screenshots"
ART = ROOT / "public" / "demo-ads"
OUT = DOCS / "VAARAM-ADVERTISING-GUIDE.pdf"
DOCS.mkdir(parents=True, exist_ok=True)


# ── Fonts ────────────────────────────────────────────────────────────────────
def _register_fonts():
    win = "C:/Windows/Fonts/"

    def reg(name, file, fallback):
        try:
            pdfmetrics.registerFont(TTFont(name, win + file))
            return name
        except Exception:
            return fallback

    disp = reg("Display", "segoeuib.ttf", "Helvetica-Bold")
    dispmd = reg("DisplayMd", "segoeui.ttf", "Helvetica")
    body = reg("Body", "georgia.ttf", "Times-Roman")
    bodyb = reg("Body-Bold", "georgiab.ttf", "Times-Bold")
    bodyi = reg("Body-Italic", "georgiai.ttf", "Times-Italic")
    mono = reg("Mono", "consola.ttf", "Courier")
    monob = reg("Mono-Bold", "consolab.ttf", "Courier-Bold")
    try:
        pdfmetrics.registerFontFamily("Body", normal=body, bold=bodyb, italic=bodyi)
        pdfmetrics.registerFontFamily("Mono", normal=mono, bold=monob)
    except Exception:
        pass
    return disp, dispmd, body, bodyb, mono


DISPLAY, DISPLAY_MD, BODY, BODY_B, MONO = _register_fonts()

# ── Colours — the same palette as the product documentation ─────────────────
WINE = colors.HexColor("#8A1332")
WINE_DEEP = colors.HexColor("#4A0A1B")
ROSE = colors.HexColor("#B07A5C")
INK = colors.HexColor("#1A1418")
MUTED = colors.HexColor("#5C5158")
FAINT = colors.HexColor("#8B8188")
LINE = colors.HexColor("#E2DDD8")
PAPER = colors.HexColor("#FAF8F5")
TINT = colors.HexColor("#F4EFEA")

GREEN = colors.HexColor("#1E6B42")
GREEN_BG = colors.HexColor("#EBF5EE")
AMBER = colors.HexColor("#9E6007")
AMBER_BG = colors.HexColor("#FEF8E7")
RED = colors.HexColor("#B3261E")
RED_BG = colors.HexColor("#FDF0ED")
BLUE = colors.HexColor("#1A568C")
BLUE_BG = colors.HexColor("#EDF4FA")
GOLD = colors.HexColor("#9A7B22")

# Georgia carries no arrow glyphs, so every arrow in body text is set in the
# mono face, which does.
ARROW = "<font name='Mono'>→</font>"
UPDN = "<font name='Mono'>↑ ↓</font>"

PW, PH = A4
ML, MR = 18 * mm, 18 * mm
CONTENT_W = PW - ML - MR

S = {
    "cover_tag": ParagraphStyle("cover_tag", fontName=MONO, fontSize=8, leading=10, textColor=ROSE, spaceAfter=8),
    "cover_title": ParagraphStyle("cover_title", fontName=DISPLAY, fontSize=25, leading=29, textColor=colors.white, spaceAfter=10),
    "cover_sub": ParagraphStyle("cover_sub", fontName=BODY, fontSize=10.5, leading=15.5, textColor=colors.HexColor("#EADBD7"), spaceAfter=12),
    "h1": ParagraphStyle("h1", fontName=DISPLAY, fontSize=16, leading=20, textColor=INK, spaceBefore=8, spaceAfter=4),
    "h2": ParagraphStyle("h2", fontName=DISPLAY, fontSize=11.5, leading=14.5, textColor=INK, spaceBefore=8, spaceAfter=3),
    "h3": ParagraphStyle("h3", fontName=DISPLAY_MD, fontSize=9.8, leading=13, textColor=INK, spaceBefore=6, spaceAfter=2),
    "eyebrow": ParagraphStyle("eyebrow", fontName=MONO, fontSize=7, leading=9, textColor=ROSE, spaceAfter=2),
    "body": ParagraphStyle("body", fontName=BODY, fontSize=8.6, leading=13, textColor=MUTED, spaceAfter=5),
    "body_ink": ParagraphStyle("body_ink", fontName=BODY, fontSize=8.6, leading=13, textColor=INK, spaceAfter=5),
    "lede": ParagraphStyle("lede", fontName=BODY, fontSize=9.3, leading=14.2, textColor=INK, spaceAfter=6),
    "bullet": ParagraphStyle("bullet", fontName=BODY, fontSize=8.5, leading=12.8, textColor=MUTED, leftIndent=10, spaceAfter=2.5),
    "th": ParagraphStyle("th", fontName=MONO, fontSize=6.4, leading=8.4, textColor=FAINT),
    "td": ParagraphStyle("td", fontName=BODY, fontSize=8, leading=11.2, textColor=INK),
    "td_muted": ParagraphStyle("td_muted", fontName=BODY, fontSize=7.8, leading=10.8, textColor=MUTED),
    "td_mono": ParagraphStyle("td_mono", fontName=MONO, fontSize=6.8, leading=9.5, textColor=WINE),
    "cap": ParagraphStyle("cap", fontName=MONO, fontSize=6.4, leading=8.6, textColor=FAINT, alignment=TA_CENTER),
    "step_n": ParagraphStyle("step_n", fontName=DISPLAY, fontSize=17, leading=19, textColor=WINE),
    "step_t": ParagraphStyle("step_t", fontName=DISPLAY, fontSize=10.5, leading=13.5, textColor=INK, spaceAfter=2),
}


# ── Building blocks ──────────────────────────────────────────────────────────
def rule(color=LINE, thickness=0.5, before=1.5 * mm, after=2.5 * mm):
    t = Table([[""]], colWidths=[CONTENT_W], rowHeights=[thickness])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), color),
                           ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                           ("TOPPADDING", (0, 0), (-1, -1), 0),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    return [Spacer(1, before), t, Spacer(1, after)]


def section_header(eyebrow, title, lede=None):
    out = [Paragraph(eyebrow.upper(), S["eyebrow"]), Paragraph(title, S["h1"])]
    if lede:
        out.append(Paragraph(lede, S["lede"]))
    out.extend(rule(LINE, 0.6, 1 * mm, 2.5 * mm))
    return out


def callout(title, text, kind="neutral"):
    border, bg, tc = WINE, TINT, INK
    if kind == "amber":
        border, bg, tc = AMBER, AMBER_BG, colors.HexColor("#613800")
    elif kind == "red":
        border, bg, tc = RED, RED_BG, colors.HexColor("#72120C")
    elif kind == "green":
        border, bg, tc = GREEN, GREEN_BG, colors.HexColor("#0D4425")
    elif kind == "blue":
        border, bg, tc = BLUE, BLUE_BG, colors.HexColor("#0C365C")

    inner = [Paragraph(title, ParagraphStyle("ct", fontName=DISPLAY, fontSize=9, leading=12,
                                             textColor=tc, spaceAfter=2)),
             Paragraph(text, ParagraphStyle("cb", fontName=BODY, fontSize=8.3, leading=12.2,
                                            textColor=INK))]
    t = Table([[inner]], colWidths=[CONTENT_W])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), bg),
                           ("LINEBEFORE", (0, 0), (0, -1), 2.2, border),
                           ("LEFTPADDING", (0, 0), (-1, -1), 4.5 * mm),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 4.5 * mm),
                           ("TOPPADDING", (0, 0), (-1, -1), 3.5 * mm),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5 * mm)]))
    return [Spacer(1, 1 * mm), t, Spacer(1, 2 * mm)]


CACHE = DOCS / "_print-cache"
PRINT_DPI = 190


def _for_print(path, width_pt):
    """A copy of the screenshot at print resolution and no more.

    The captures are taken at twice desktop scale so that text in them stays
    crisp, which makes them far larger than any page can use. Embedding them
    untouched produced a 13 MB file that was slow to open and impossible to
    email. Redrawing each one to the width it is actually printed at, at 190
    dpi, is visually identical on paper and about a fifth of the size.
    """
    CACHE.mkdir(parents=True, exist_ok=True)
    target_px = int(round(width_pt / 72.0 * PRINT_DPI))
    out = CACHE / f"{path.stem}@{target_px}.jpg"

    if not out.exists() or out.stat().st_mtime < path.stat().st_mtime:
        with PILImage.open(path) as im:
            im = im.convert("RGB")
            if im.width > target_px:
                h = round(im.height * target_px / im.width)
                im = im.resize((target_px, h), PILImage.LANCZOS)
            im.save(out, "JPEG", quality=82, optimize=True, subsampling=1)
    return out


def _sized(path, width, max_height):
    """An image at `width`, in its own proportion, shrunk if it would be taller
    than `max_height`. Never stretched — a distorted screenshot of a layout is
    worse than no screenshot."""
    with PILImage.open(path) as im:
        iw, ih = im.size
    h = width * ih / iw
    if h > max_height:
        width = max_height * iw / ih
        h = max_height
    return Image(str(_for_print(path, width)), width=width, height=h)


def figure(name, caption, width=CONTENT_W, max_height=105 * mm, frame=True):
    path = SHOTS / f"{name}.png"
    if not path.exists():
        return [Paragraph(f"[missing figure: {name}]", S["body"])]

    img = _sized(path, width, max_height)
    cap = Paragraph(caption, S["cap"])
    t = Table([[img], [cap]], colWidths=[width])
    style = [("ALIGN", (0, 0), (-1, -1), "CENTER"),
             ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
             ("LEFTPADDING", (0, 0), (-1, -1), 0),
             ("RIGHTPADDING", (0, 0), (-1, -1), 0),
             ("TOPPADDING", (0, 0), (-1, -1), 2),
             ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]
    if frame:
        style.append(("BOX", (0, 0), (0, 0), 0.5, LINE))
    t.setStyle(TableStyle(style))
    return [KeepTogether([Spacer(1, 1.5 * mm), t, Spacer(1, 2.5 * mm)])]


def figure_pair(n1, c1, n2, c2, max_height=62 * mm):
    w = (CONTENT_W - 5 * mm) / 2.0

    def cell(name, cap):
        p = SHOTS / f"{name}.png"
        if not p.exists():
            return [Paragraph(f"[missing: {name}]", S["body"])]
        return [_sized(p, w, max_height), Spacer(1, 1.2 * mm), Paragraph(cap, S["cap"])]

    t = Table([[cell(n1, c1), cell(n2, c2)]], colWidths=[w, w])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                           ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                           ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                           ("TOPPADDING", (0, 0), (-1, -1), 1),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 1)]))
    return [KeepTogether([Spacer(1, 1.5 * mm), t, Spacer(1, 2.5 * mm)])]


def table(headers, rows, widths, zebra=True, header_bg=TINT, align_top=True):
    data = [[Paragraph(h.upper(), S["th"]) for h in headers]]
    for r in rows:
        data.append([c if not isinstance(c, str) else Paragraph(c, S["td"]) for c in r])

    t = Table(data, colWidths=widths, repeatRows=1)
    style = [("BACKGROUND", (0, 0), (-1, 0), header_bg),
             ("VALIGN", (0, 0), (-1, -1), "TOP" if align_top else "MIDDLE"),
             ("LINEBELOW", (0, 0), (-1, 0), 0.6, LINE),
             ("LINEBELOW", (0, 1), (-1, -2), 0.3, LINE),
             ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
             ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
             ("TOPPADDING", (0, 0), (-1, -1), 2.2 * mm),
             ("BOTTOMPADDING", (0, 0), (-1, -1), 2.2 * mm)]
    if zebra:
        for i in range(1, len(data)):
            if i % 2 == 0:
                style.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#FCFAF8")))
    t.setStyle(TableStyle(style))
    return [Spacer(1, 1 * mm), t, Spacer(1, 2.5 * mm)]


def step(number, title, body, tint=TINT):
    """A numbered instruction block."""
    left = Paragraph(f"{number:02d}", S["step_n"])
    right = [Paragraph(title, S["step_t"]),
             Paragraph(body, ParagraphStyle("sb", fontName=BODY, fontSize=8.4,
                                            leading=12.4, textColor=MUTED))]
    # 18mm, not 13: at 17pt the two digits of "02" wrap onto separate lines in
    # a narrower column, which reads as a fault rather than as a step number.
    t = Table([[left, right]], colWidths=[18 * mm, CONTENT_W - 18 * mm])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                           ("BACKGROUND", (0, 0), (-1, -1), tint),
                           ("LINEBEFORE", (0, 0), (0, -1), 2.2, WINE),
                           ("ALIGN", (0, 0), (0, -1), "CENTER"),
                           ("LEFTPADDING", (0, 0), (0, -1), 3 * mm),
                           ("LEFTPADDING", (1, 0), (1, -1), 0),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
                           ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm)]))
    return [Spacer(1, 1.5 * mm), t, Spacer(1, 1 * mm)]


def bullets(items, style="bullet"):
    return [Paragraph(f"<font color='#8A1332'>•</font>&nbsp;&nbsp;{i}", S[style]) for i in items]


def art_row(files, caption, height=26 * mm):
    """A row of the demonstration artwork itself, printed at size."""
    cells = []
    w = (CONTENT_W - (len(files) - 1) * 3 * mm) / len(files)
    for f in files:
        p = ART / f
        cells.append(_sized(p, w, height) if p.exists() else Paragraph("—", S["td"]))
    t = Table([cells], colWidths=[w] * len(files))
    t.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER"),
                           ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                           ("LEFTPADDING", (0, 0), (-1, -1), 1.5 * mm),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 1.5 * mm),
                           ("TOPPADDING", (0, 0), (-1, -1), 0),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    return [Spacer(1, 1 * mm), t, Spacer(1, 1.5 * mm),
            Paragraph(caption, S["cap"]), Spacer(1, 2.5 * mm)]


# ── Page furniture ───────────────────────────────────────────────────────────
def cover_canvas(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, PW, PH, stroke=0, fill=1)
    canvas.setFillColor(WINE_DEEP)
    canvas.rect(0, PH - 96 * mm, PW, 96 * mm, stroke=0, fill=1)
    canvas.setFillColor(WINE)
    canvas.rect(0, PH - 98.5 * mm, PW, 2.5 * mm, stroke=0, fill=1)

    canvas.setFont(DISPLAY, 11)
    canvas.setFillColor(colors.Color(1, 1, 1, alpha=0.22))
    canvas.drawString(ML, PH - 18 * mm, "VAARAM MAGAZINE  ·  DISCOVER. CONNECT. EVERY WEEK.")

    canvas.setFont(MONO, 6.5)
    canvas.setFillColor(FAINT)
    canvas.drawString(ML, 10 * mm, "ADVERTISING GUIDE  ·  CLIENT REFERENCE  ·  CONFIDENTIAL")
    canvas.drawRightString(PW - MR, 10 * mm, "PAGE 01")
    canvas.restoreState()


def body_canvas(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, PW, PH, stroke=0, fill=1)

    canvas.setFont(MONO, 6.8)
    canvas.setFillColor(FAINT)
    canvas.drawString(ML, PH - 12 * mm, "VAARAM MAGAZINE  /  ADVERTISING GUIDE — POSTING & MANAGING BANNERS")
    canvas.drawRightString(PW - MR, PH - 12 * mm, f"PAGE {doc.page:02d}")
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(ML, PH - 14 * mm, PW - MR, PH - 14 * mm)

    canvas.setFont(MONO, 6.4)
    canvas.drawString(ML, 10 * mm, "WEEKLY ADVERTISING & CLASSIFIEDS PUBLICATION  ·  CANADA")
    canvas.drawRightString(PW - MR, 10 * mm, "vaaram.ca/admin → BANNERS")
    canvas.line(ML, 13 * mm, PW - MR, 13 * mm)
    canvas.restoreState()


# ═════════════════════════════════════════════════════════════════════════════
#  Diagrams
# ═════════════════════════════════════════════════════════════════════════════
def slot_map():
    """Where every sellable placement sits, page by page.

    Wine  = booked in the demonstration.  Outline = deliberately left open.
    """
    def band(label, num, booked, tall=False):
        p = ParagraphStyle("bandp", fontName=DISPLAY, fontSize=6.6, leading=8.4,
                           textColor=colors.white if booked else MUTED, alignment=TA_CENTER)
        return Paragraph(f"{num} · {label}", p)

    def content(label):
        return Paragraph(label, ParagraphStyle("cnt", fontName=BODY, fontSize=6.6,
                                               leading=8.4, textColor=FAINT, alignment=TA_CENTER))

    col_w = (CONTENT_W - 8 * mm) / 3.0

    home = [
        ("content", "hero — this week's edition"),
        ("slot", "1", "home_hero", True),
        ("content", "the current edition in full"),
        ("slot", "2", "home_mid", True),
        ("content", "how it works"),
        ("slot", "3", "home_feature", False),
        ("content", "previous editions"),
        ("slot", "4", "home_closing", False),
        ("content", "sign-up band"),
        ("slot", "11", "footer", True),
    ]
    archive = [
        ("content", "search and view switch"),
        ("slot", "5", "listing_top", True),
        ("content", "edition covers"),
        ("slot", "6", "listing_inline", False),
        ("content", "more editions"),
        ("slot", "11", "footer", True),
    ]
    reader = [
        ("content", "title · download · share"),
        ("slot", "7", "reader_top", True),
        ("content", "the pages of the edition"),
        ("slot", "9", "reader_below", False),
        ("content", "more from the archive"),
        ("slot", "11", "footer", True),
    ]

    def column(rows, rail_num, rail_key, rail_booked, rail_label):
        data, style, i = [], [], 0
        for row in rows:
            if row[0] == "content":
                data.append([content(row[1])])
                style += [("BACKGROUND", (0, i), (0, i), colors.HexColor("#F1ECE6")),
                          ("BOX", (0, i), (0, i), 0.3, LINE)]
            else:
                _, num, key, booked = row
                data.append([band(key, num, booked)])
                if booked:
                    bg = GOLD if key == "footer" else WINE
                    style += [("BACKGROUND", (0, i), (0, i), bg)]
                else:
                    style += [("BOX", (0, i), (0, i), 0.8, WINE),
                              ("BACKGROUND", (0, i), (0, i), colors.white)]
            i += 1

        inner = Table(data, colWidths=[col_w - 20 * mm])
        inner.setStyle(TableStyle(style + [
            ("LEFTPADDING", (0, 0), (-1, -1), 1.5 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 1.5 * mm),
            ("TOPPADDING", (0, 0), (-1, -1), 1.6 * mm),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 1.6 * mm),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ]))

        rail = Paragraph(
            f"{rail_num} · {rail_key}<br/><br/>{rail_label}",
            ParagraphStyle("rail", fontName=DISPLAY, fontSize=6.4, leading=8.2,
                           textColor=colors.white if rail_booked else MUTED,
                           alignment=TA_CENTER))
        pair = Table([[rail, inner]], colWidths=[18 * mm, col_w - 20 * mm])
        pair_style = [("VALIGN", (0, 0), (-1, -1), "TOP"),
                      ("LEFTPADDING", (0, 0), (-1, -1), 0),
                      ("RIGHTPADDING", (0, 0), (0, -1), 2 * mm),
                      ("RIGHTPADDING", (1, 0), (1, -1), 0),
                      ("TOPPADDING", (0, 0), (-1, -1), 0),
                      ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]
        if rail_booked:
            pair_style += [("BACKGROUND", (0, 0), (0, -1), WINE),
                           ("TOPPADDING", (0, 0), (0, -1), 3 * mm)]
        else:
            pair_style += [("BOX", (0, 0), (0, -1), 0.8, WINE),
                           ("TOPPADDING", (0, 0), (0, -1), 3 * mm)]
        pair.setStyle(TableStyle(pair_style))
        return pair

    heads = [Paragraph(h, ParagraphStyle("mh", fontName=MONO, fontSize=6.6, leading=8.6,
                                         textColor=ROSE, alignment=TA_CENTER))
             for h in ("HOME PAGE", "ARCHIVE", "AN EDITION")]

    cols = [column(home, "10", "site_rail", True, "the side rail"),
            column(archive, "10", "site_rail", True, "the side rail"),
            column(reader, "8", "reader_rail", True, "the reader rail")]

    grid = Table([heads, cols], colWidths=[col_w] * 3)
    grid.setStyle(TableStyle([("VALIGN", (0, 1), (-1, 1), "TOP"),
                              ("LEFTPADDING", (0, 0), (-1, -1), 2 * mm),
                              ("RIGHTPADDING", (0, 0), (-1, -1), 2 * mm),
                              ("TOPPADDING", (0, 0), (-1, 0), 0),
                              ("BOTTOMPADDING", (0, 0), (-1, 0), 2.5 * mm),
                              ("TOPPADDING", (0, 1), (-1, 1), 0)]))

    # The legend's swatches are drawn as cells rather than written as ■ / □:
    # the body serif carries neither glyph, and both come out as empty boxes.
    swatch_style = ParagraphStyle("kt", fontName=BODY, fontSize=7, leading=9.5,
                                  textColor=MUTED)

    def swatch(fill, outline, label):
        box = Table([[""]], colWidths=[3 * mm], rowHeights=[3 * mm])
        box.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), fill),
                                 ("BOX", (0, 0), (-1, -1), 0.6, outline)]))
        return box, Paragraph(label, swatch_style)

    a1, a2 = swatch(WINE, WINE, "booked in the demonstration")
    b1, b2 = swatch(GOLD, GOLD, "the footer grid, on every page")
    c1, c2 = swatch(colors.white, WINE, "left open — showing the &ldquo;book this slot&rdquo; panel")

    key = Table([[a1, a2, b1, b2, c1, c2]],
                colWidths=[4 * mm, 42 * mm, 4 * mm, 44 * mm, 4 * mm, 60 * mm])
    key.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                             ("LEFTPADDING", (0, 0), (-1, -1), 0),
                             ("RIGHTPADDING", (0, 0), (-1, -1), 2 * mm),
                             ("TOPPADDING", (0, 0), (-1, -1), 0),
                             ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))

    return [Spacer(1, 1.5 * mm), grid, Spacer(1, 3 * mm), key, Spacer(1, 2 * mm)]


def shape_diagram():
    """The two proportions the whole site sells, drawn to scale against
    each other."""
    def shape(w_mm, h_mm, fill, label, size, note):
        box = Table([[""]], colWidths=[w_mm * mm], rowHeights=[h_mm * mm])
        box.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), fill),
                                 ("BOX", (0, 0), (-1, -1), 0.6, WINE)]))
        return [box, Spacer(1, 2 * mm),
                Paragraph(label, ParagraphStyle("sl", fontName=DISPLAY, fontSize=9,
                                                leading=11.5, textColor=INK)),
                Paragraph(size, ParagraphStyle("ss", fontName=MONO, fontSize=7.4,
                                               leading=10, textColor=WINE)),
                Spacer(1, 1 * mm),
                Paragraph(note, ParagraphStyle("sn", fontName=BODY, fontSize=7.8,
                                               leading=11, textColor=MUTED))]

    left = shape(40, 20, colors.HexColor("#EFE3E7"), "Card — 2:1", "1200 × 600 px",
                 "Every side-rail advertisement and every footer advertisement. "
                 "This is the shape the side deck is built from.")
    right = shape(77, 14, colors.HexColor("#E9EEF4"), "Wide strip — 11:2", "1650 × 300 px",
                  "The wide billboard slots across the page. On a phone this is only "
                  "about 64 px tall, so a logo and four words — never a phone number.")

    t = Table([[left, right]], colWidths=[CONTENT_W * 0.36, CONTENT_W * 0.64])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                           ("LEFTPADDING", (0, 0), (0, -1), 0),
                           ("LEFTPADDING", (1, 0), (1, -1), 5 * mm),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                           ("TOPPADDING", (0, 0), (-1, -1), 0),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    return [Spacer(1, 2 * mm), t, Spacer(1, 3 * mm)]


def flow_five():
    """The booking, in five moves."""
    steps = [("1", "Open Banners", "vaaram.ca/admin " + ARROW + " Banners"),
             ("2", "Pick the slot", "Where it appears"),
             ("3", "Attach artwork", "One JPG, PNG or WebP"),
             ("4", "Name & link", "Advertiser and their website"),
             ("5", "Add banner", "Live in about a minute")]
    w = (CONTENT_W - 4 * 2 * mm) / 5.0
    cells = []
    for n, t, s in steps:
        cells.append([Paragraph(n, ParagraphStyle("fn", fontName=DISPLAY, fontSize=13,
                                                  leading=15, textColor=colors.white,
                                                  alignment=TA_CENTER)),
                      Spacer(1, 1.2 * mm),
                      Paragraph(t, ParagraphStyle("ft", fontName=DISPLAY, fontSize=7.6,
                                                  leading=9.6, textColor=colors.white,
                                                  alignment=TA_CENTER)),
                      Paragraph(s, ParagraphStyle("fs", fontName=BODY, fontSize=6.6,
                                                  leading=8.6,
                                                  textColor=colors.HexColor("#E3CDD4"),
                                                  alignment=TA_CENTER))])
    t = Table([cells], colWidths=[w] * 5)
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), WINE_DEEP),
                           ("VALIGN", (0, 0), (-1, -1), "TOP"),
                           ("LEFTPADDING", (0, 0), (-1, -1), 2.5 * mm),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 2.5 * mm),
                           ("TOPPADDING", (0, 0), (-1, -1), 3.5 * mm),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5 * mm),
                           ("LINEAFTER", (0, 0), (-2, -1), 0.6, colors.HexColor("#6B1428"))]))
    return [Spacer(1, 1.5 * mm), t, Spacer(1, 3 * mm)]


# ═════════════════════════════════════════════════════════════════════════════
#  The document
# ═════════════════════════════════════════════════════════════════════════════
def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=ML, rightMargin=MR,
                          topMargin=18 * mm, bottomMargin=18 * mm,
                          title="Vaaram Magazine — Advertising Guide",
                          author="Vaaram Magazine")

    doc.addPageTemplates([
        PageTemplate(id="Cover",
                     frames=[Frame(ML, 15 * mm, CONTENT_W, PH - 32 * mm, id="cf",
                                   topPadding=0, bottomPadding=0, leftPadding=0, rightPadding=0)],
                     onPage=cover_canvas),
        PageTemplate(id="Body",
                     frames=[Frame(ML, 15 * mm, CONTENT_W, PH - 30 * mm, id="bf",
                                   topPadding=0, bottomPadding=0, leftPadding=0, rightPadding=0)],
                     onPage=body_canvas),
    ])

    s = []

    # ═══════════════════════════════════════════════════════ COVER ══════════
    s.append(Spacer(1, 16 * mm))
    s.append(Paragraph("ADVERTISING GUIDE  ·  HOW A BANNER IS SOLD, POSTED AND MANAGED", S["cover_tag"]))
    s.append(Paragraph("Advertising on the<br/>Vaaram website.", S["cover_title"]))
    s.append(Paragraph(
        "The website sells advertising space of its own, separate from the space inside the weekly PDF. "
        "This guide covers that product only: the eleven places an advertisement can appear, the two "
        "artwork sizes, and exactly how one is posted from the admin dashboard and what happens on the "
        "website when it is. One advertiser is booked from start to finish, photographed at every step.",
        S["cover_sub"]))

    s.append(Spacer(1, 20 * mm))

    s.extend(callout(
        "WHAT IS ON THE LIVE WEBSITE RIGHT NOW",
        "Nineteen demonstration advertisements have been booked onto "
        "<font name='Mono' color='#8A1332'>vaaram-magazine.vercel.app</font> so that the site can be "
        "seen doing this job rather than described doing it.<br/><br/>"
        "They fill <b>seven of the eleven sellable placements — roughly 60%</b>. The remaining four are "
        "deliberately left empty so you can see, in the same visit, exactly what an unsold slot looks "
        "like: it shows Vaaram's own <i>&ldquo;This space could be your advertisement&rdquo;</i> panel "
        "rather than a blank box.<br/><br/>"
        "Every one of them is an invented business. <b>Part 5 explains how to clear them all in a "
        "single step</b> before the first real advertiser goes on.",
        kind="green"))

    s.append(Spacer(1, 3 * mm))

    meta = Table([
        [Paragraph("PREPARED FOR", S["th"]), Paragraph("PRODUCT", S["th"]), Paragraph("VERSION", S["th"])],
        [Paragraph("Vaaram Magazine", S["td"]),
         Paragraph("vaaram.ca — website banner advertising", S["td"]),
         Paragraph("1.0", S["td"])],
    ], colWidths=[CONTENT_W * 0.3, CONTENT_W * 0.48, CONTENT_W * 0.22])
    meta.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, 0), 0.5, LINE),
                              ("LEFTPADDING", (0, 0), (-1, -1), 0),
                              ("TOPPADDING", (0, 0), (-1, -1), 2 * mm),
                              ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm)]))
    s.append(meta)

    s.append(NextPageTemplate("Body"))
    s.append(PageBreak())

    # ═══════════════════════════════════════════════════ CONTENTS ═══════════
    s.extend(section_header("Contents", "What is in this guide",
                            "Part 2 is the one to keep open the first few times you post an "
                            "advertisement. Everything else can be read once."))

    s.extend(table(
        ["Part", "What it covers"],
        [["<b>1 — What the website sells</b>",
          "The difference between an advertisement in the magazine and one on the website · the two "
          "artwork shapes · a map of all eleven placements · <b>the side rail in full</b> · what an "
          "unsold slot does"],
         ["<b>2 — Posting an advertisement</b>",
          "Signing in · finding the Banners screen · the five steps, each photographed · what happens "
          "the moment you press <i>Add banner</i> · seeing it live on the website"],
         ["<b>3 — After it is live</b>",
          "Changing the running order · hiding and showing · editing · stop dates · deleting · what "
          "views, clicks and click rate actually count"],
         ["<b>4 — What is on the site today</b>",
          "Every demonstration booking, where it sits, and what was deliberately left empty"],
         ["<b>5 — Reference</b>",
          "Every field and its rules · artwork rules · the messages you may see · what to ask an "
          "advertiser for · clearing the demonstration bookings"]],
        [CONTENT_W * 0.26, CONTENT_W * 0.74]))

    s.extend(callout(
        "THIS GUIDE REPLACES SECTIONS 3.8 AND 3.9 OF THE PRODUCT DOCUMENTATION",
        "The banner system has been rebuilt since <i>Product &amp; Administrator Documentation v1.0</i> "
        "was written. Three things in that document are now out of date, and this guide is the correct "
        "one on all three:<br/><br/>"
        "<b>1.</b> There are now <b>eleven</b> sellable placements, not ten — the two side rails are new, "
        "and the old <i>Reader — beside the pages</i> slot has been retired.<br/>"
        "<b>2.</b> A banner now takes <b>one image, not three</b>. The old form asked for separate "
        "desktop, tablet and phone artwork at six different sizes.<br/>"
        "<b>3.</b> There are now only <b>two artwork sizes</b> in total — 1200 × 600 and 1650 × 300 — "
        "and the website resizes what you upload to fit.",
        kind="amber"))

    s.append(PageBreak())

    # ═════════════════════════════════════════ PART 1 ═══════════════════════
    s.extend(section_header(
        "Part 1", "What the website sells",
        "Two products share the word &ldquo;advertisement&rdquo; and are bought, priced and delivered "
        "quite differently. Getting the distinction straight is most of the job."))

    s.extend(table(
        ["", "In the weekly PDF", "On the website"],
        [["What it is",
          "A printed advertisement on a page of the edition — full page down to a few classified lines.",
          "A picture on the website itself, in one of eleven fixed places, which can be clicked."],
         ["Who makes it",
          "You lay it out and send the advertiser a proof.",
          "The advertiser supplies one image, or you make one for them."],
         ["Where it is managed",
          "Nowhere on the website. It is simply part of the PDF you upload.",
          "<b>Admin " + ARROW + " Banners.</b> The whole of this guide."],
         ["How long it runs",
          "One edition — then it stays in the archive forever.",
          "Until you hide it, or until its stop date. You choose."],
         ["What can be measured",
          "Edition views and downloads, for the whole edition.",
          "<b>Views, clicks and click rate, per advertiser.</b> The numbers you can quote back."]],
        [CONTENT_W * 0.17, CONTENT_W * 0.41, CONTENT_W * 0.42]))

    s.extend(callout(
        "THE ONE SENTENCE TO GIVE AN ADVERTISER",
        "&ldquo;Space in the magazine puts you in front of everyone who reads this week's edition. "
        "A banner on the website puts you in front of everyone who visits the site at all — this week, "
        "next week, and every week after that, until you stop it. Most businesses take both.&rdquo;",
        kind="blue"))

    s.append(Spacer(1, 2 * mm))
    s.append(Paragraph("1.1  The two artwork shapes — and only two", S["h2"]))
    s.append(Paragraph(
        "Whatever slot is booked, the artwork is one of exactly two shapes. This is the single most "
        "useful thing to know when talking to an advertiser, because it is the whole of what you need "
        "to ask them for.",
        S["body"]))

    s.extend(shape_diagram())

    s.extend(callout(
        "ONE IMAGE IS ENOUGH — THE WEBSITE DOES THE REST",
        "You upload <b>one</b> picture per advertisement. Before it is saved, the website redraws it to "
        "the exact size of the slot and re-encodes it, so a 2 MB export from a design tool usually lands "
        "near 60 KB on the site. The same picture is then used on phones, tablets and desktops — the "
        "shape never changes, only the width of the column around it.<br/><br/>"
        "The artwork is fitted inside the frame rather than cropped to fill it. If an advertiser sends a "
        "square logo it will show with a white margin at each side, and nothing will be cut off — losing "
        "a phone number off the edge of a paid advertisement is the worse failure of the two.",
        kind="green"))

    s.append(PageBreak())

    # ── The eleven placements ───────────────────────────────────────────────
    s.append(Paragraph("1.2  The eleven placements, and where each one sits", S["h2"]))
    s.append(Paragraph(
        "Every sellable position on the website is below. The map shows them in place on the three "
        "pages that carry them; the table underneath gives the exact name each one has in the "
        "<i>Where it appears</i> dropdown.",
        S["body"]))

    s.extend(slot_map())

    s.extend(table(
        ["#", "As it appears in the dropdown", "Shape", "Holds", "Where it lands"],
        [["1", "Home — under the hero", "Strip", "One at a time",
          "The first advertisement a reader meets. The most asked-for slot."],
         ["2", "Home — mid page", "Strip", "One at a time",
          "Between the current edition and &ldquo;how it works&rdquo;. Also used on the About page."],
         ["3", "Home — feature block", "Strip", "One at a time",
          "The full-width panel halfway down the home page."],
         ["4", "Home — above the closing call", "Strip", "One at a time",
          "The last thing before &ldquo;Get your business discovered&rdquo;."],
         ["5", "Archive — above the editions", "Strip", "One at a time",
          "The top of the archive, above the covers."],
         ["6", "Archive — between editions", "Strip", "One at a time",
          "Inside the cover grid, after the eighth edition."],
         ["7", "Reader — above the pages", "Strip", "One at a time",
          "Directly above the magazine pages. Seen by everyone who actually reads."],
         ["8", "<b>Side rail — beside the reader</b>", "<b>Card</b>", "<b>Any number</b>",
          "<b>The column beside the pages of an edition, where readers stay longest. Tops itself up "
          "from the every-page rail when it is short.</b>"],
         ["9", "Reader — under the pages", "Strip", "One at a time",
          "Below the last page, before &ldquo;more from the archive&rdquo;."],
         ["10", "<b>Side rail — every page</b>", "<b>Card</b>", "<b>Any number</b>",
          "<b>The main rail. The long column of advertisements down the side of the home page and the "
          "archive. This is the side deck.</b>"],
         ["11", "Every page — above the footer", "Card", "Any number",
          "A wrapping grid at the foot of every page of the site. The highest view count available."]],
        # 11mm on the index column: "11" wraps to two lines in anything less.
        [11 * mm, CONTENT_W * 0.27, 14 * mm, 20 * mm, CONTENT_W * 0.38]))

    s.extend(callout(
        "&ldquo;ONE AT A TIME&rdquo; VERSUS &ldquo;ANY NUMBER&rdquo; — THE MOST IMPORTANT LINE IN THE TABLE",
        "<b>One at a time.</b> Book two advertisers into the same strip and they take turns, changing "
        "every seven seconds, with small dots showing how many are sharing it. Both are counted "
        "properly. But only one is on screen at any moment, so a strip should not be sold to more than "
        "three or four advertisers at once.<br/><br/>"
        "<b>Any number.</b> The two side rails and the footer grid show <i>every</i> advertisement booked "
        "into them, one under another, in the order you set. There is no limit and no rotation. "
        "<b>This is why the side rail is the placement to sell hardest</b> — it is the only one where "
        "signing a tenth advertiser does not take screen time away from the other nine.",
        kind="amber"))

    # ── The side rail in full ───────────────────────────────────────────────
    s.append(Spacer(1, 2 * mm))
    s.extend(section_header(
        "1.3", "The side rail — the side deck, in full",
        "The long column of advertisements beside the content. It is the placement most often asked "
        "about, it behaves unlike any other slot on the site, and it is worth understanding properly "
        "before it is sold."))

    s.extend(figure("public-01-side-rail",
                    "FIGURE 1.1 — The side rail on the live home page. Five advertisers running down the "
                    "left, the magazine's own content on the right. The rail grows as long as the "
                    "bookings make it; the page simply gets taller.",
                    max_height=118 * mm))

    s.append(Paragraph("What makes it different from every other slot", S["h3"]))

    s.extend(table(
        ["Behaviour", "What it means for you"],
        [["It has no limit",
          "Book one advertiser or thirty. Every one of them shows. Nothing rotates, nothing is hidden "
          "behind a &ldquo;next&rdquo; arrow, and no advertiser loses screen time because you signed another."],
         ["You set the order",
          "Each booking has a position. The advertiser at the top of the rail is seen first and by the "
          "most people, which makes the top of the rail the premium position — and something you can "
          "legitimately charge more for."],
         ["It appears on two pages",
          "<i>Side rail — every page</i> runs down both the home page and the archive. One booking, "
          "both pages."],
         ["It has a second rail beside the reader",
          "<i>Side rail — beside the reader</i> runs beside the pages of an edition, which is where "
          "readers spend by far the longest. If that rail is short, it tops itself up from the "
          "every-page rail automatically, so it is never left looking half-sold."],
         ["It never ends on dead air",
          "Below the last paid advertisement the rail closes with Vaaram's own &ldquo;book this "
          "slot&rdquo; panel. The bottom of the rail is always selling the rail."],
         ["On a phone it is threaded, not stacked",
          "See below. This is the part worth understanding before an advertiser asks."]],
        [CONTENT_W * 0.24, CONTENT_W * 0.76]))

    s.append(Spacer(1, 2 * mm))
    s.append(Paragraph("1.4  What the side rail does on a phone", S["h2"]))
    s.append(Paragraph(
        "A phone has no room for two columns. Stacking the whole rail above the content would put "
        "thousands of pixels of advertising in front of a reader before they reached a single word, and "
        "most of them would leave. So on a phone the <b>same</b> advertisements are dealt into the "
        "content instead, a couple at a time, in the same order, each at full width.",
        S["body"]))

    s.extend(callout(
        "THIS IS BETTER FOR THE ADVERTISER, NOT A COMPROMISE",
        "A view is only counted once an advertisement has genuinely been on screen. Threading the rail "
        "through the page means a reader scrolls past every advertisement in it on the way down, so "
        "<b>more</b> of them are actually seen — and actually counted — than if they were all stacked at "
        "the top where most readers never reach. The desktop rail and the phone arrangement show "
        "exactly the same bookings; neither double-counts the other.",
        kind="green"))

    s.extend(figure_pair(
        "public-10-phone-threaded",
        "FIGURE 1.2 — On a phone: the same rail advertisements dealt into the page as the reader scrolls.",
        "public-06-footer-grid",
        "FIGURE 1.3 — The footer grid: four cards wrapping across, on every page of the site.",
        max_height=88 * mm))

    s.append(Spacer(1, 1 * mm))
    s.append(Paragraph("1.5  What an unsold slot does", S["h2"]))
    s.append(Paragraph(
        "A slot with nothing booked into it <b>never</b> shows a blank box or an empty grey rectangle. "
        "It shows Vaaram's own panel instead, labelled as Vaaram's own advertising and linked to your "
        "contact page. Four placements are in this state on the live site today, on purpose, so that "
        "you can see it.",
        S["body"]))

    s.extend(figure("public-05-empty-slot",
                    "FIGURE 1.4 — An unsold slot on the live home page. It keeps the shape of the page "
                    "intact, it is honest about being Vaaram's own, and it sells the slot to every "
                    "business reading the site.",
                    max_height=62 * mm))

    s.append(PageBreak())

    # ═════════════════════════════════════════ PART 2 ═══════════════════════
    s.extend(section_header(
        "Part 2", "Posting an advertisement",
        "One advertiser — Kandan Electronics — booked into the side rail from start to finish. Every "
        "picture in this part was taken while it was actually being done, and the advertisement is on "
        "the live website now."))

    s.extend(flow_five())

    s.append(Paragraph("2.1  Signing in", S["h2"]))
    s.append(Paragraph(
        "Go to <font name='Mono' color='#8A1332'>vaaram-magazine.vercel.app/admin</font> — or, once the "
        "domain is connected, <font name='Mono' color='#8A1332'>vaaram.ca/admin</font>. Enter the "
        "administrator email and password. If the password is ever unavailable, "
        "<i>Sign in with email verification code instead</i> sends a one-time code to the same mailbox.",
        S["body"]))

    s.extend(figure_pair(
        "admin-01-login",
        "FIGURE 2.1 — The sign-in screen, with the administrator credentials entered.",
        "admin-02-dashboard",
        "FIGURE 2.2 — The dashboard. BANNERS RUNNING counts every advertisement currently live.",
        max_height=68 * mm))

    s.extend(callout(
        "YOUR ADMINISTRATOR CREDENTIALS",
        "<b>Address</b> &nbsp; <font name='Mono' color='#8A1332'>vaaram-magazine.vercel.app/admin</font><br/>"
        "<b>Email</b> &nbsp;&nbsp;&nbsp; <font name='Mono'>contact@vaaram.ca</font><br/>"
        "<b>Password</b> <font name='Mono'>Vaaram27#</font><br/><br/>"
        "Treat this page as you would online banking. Anyone with these details can publish an edition "
        "and change every advertisement on the site.",
        kind="red"))

    s.append(Spacer(1, 1 * mm))
    s.append(Paragraph("2.2  The Banners screen", S["h2"]))
    s.append(Paragraph(
        "Click <b>Banners</b> in the row along the top. The screen has the same two halves every time: "
        "the form you post from on the left, and everything already running on the right, grouped by "
        "placement. The form stays in view as you scroll the list.",
        S["body"]))

    s.extend(figure("admin-03-banners-overview",
                    "FIGURE 2.3 — Admin " + ARROW + " Banners. The form on the left; the side rail's bookings on the "
                    "right, each with its artwork, its position number, its counters and its controls.",
                    max_height=146 * mm))

    s.append(PageBreak())

    s.extend(table(
        ["On this screen", "What it is"],
        [["<b>Add a banner</b> (left)",
          "Where every new booking is made. It does not move as you scroll."],
         ["<b>Where it appears</b>",
          "Pick this <b>first</b>. The artwork size asked for underneath changes to match the slot you "
          "chose, so choosing it last means being told the wrong size."],
         ["The groups on the right",
          "One heading per placement, in the order a reader meets them: the rails, then the strips, "
          "then the footer. A placement with nothing booked does not appear here at all."],
         ["<b>&ldquo;6 of 7 showing&rdquo;</b>",
          "Beside each heading. How many bookings in that placement are live, out of how many exist. "
          "A gap between the two numbers means something is hidden or expired."],
         ["<b>&ldquo;in this order&rdquo;</b>",
          "Appears only on placements that show every booking. It is your reminder that the numbers "
          "down the left are the running order on the website."],
         ["Views · clicks · click rate",
          "Under each advertiser, with the controls beneath. See Part 3."]],
        [CONTENT_W * 0.26, CONTENT_W * 0.74]))

    s.append(Spacer(1, 2 * mm))
    s.extend(section_header("2.3", "The five steps, one at a time"))

    # ── Step 1 ──
    s.extend(step(1, "Choose where it appears — before anything else",
                  "Open the <b>Where it appears</b> dropdown. It is grouped into <i>Side rails</i>, "
                  "<i>Wide strips</i> and <i>Footer</i>. Pick the slot the advertiser has bought.<br/><br/>"
                  "The moment you choose, two things change underneath: the size the form asks for, and "
                  "a line of explanation about that slot. For the side rail it says in wine text that "
                  "the slot shows every banner booked into it, <i>so you can add as many as you like</i>. "
                  "In this example the advertiser bought the every-page side rail."))

    s.extend(figure("admin-05-step1-placement",
                    "FIGURE 2.4 — Step 1. <i>Side rail — every page</i> chosen. Note the wine sentence "
                    "confirming the slot has no limit, and that the artwork below is now asked for at "
                    "1200 × 600 px.",
                    max_height=76 * mm))

    s.append(PageBreak())

    # ── Step 2 ──
    s.extend(step(2, "Attach the artwork",
                  "Press <b>Choose image</b> and pick the file. JPG, PNG or WebP; under 2 MB. As soon "
                  "as it is chosen you see a small preview of it, its filename and its size, with an "
                  "<b>×</b> to swap it for another.<br/><br/>"
                  "Nothing has been uploaded yet — this is only the file being held, ready. If the file "
                  "is the wrong type or too large you are told immediately, before anything is sent."))

    s.extend(figure("admin-06-step2-artwork",
                    "FIGURE 2.5 — Step 2. The artwork attached: <i>card-14-kandan-electronics.jpg</i>, "
                    "100.4 KB, with its preview and the × to change it.",
                    max_height=88 * mm))

    # ── Step 3 ──
    s.extend(step(3, "Fill in the advertiser's details",
                  "<b>Advertiser name</b> is the only one that is required. It is how <i>you</i> will "
                  "recognise this booking in the list later — readers never see it.<br/><br/>"
                  "<b>Link when clicked</b> is the advertiser's own website. It must begin with "
                  "<font name='Mono'>http://</font> or <font name='Mono'>https://</font>; anything else "
                  "is refused and saved as no link at all, which is a deliberate safety rule. Leave it "
                  "empty and the advertisement simply is not clickable.<br/><br/>"
                  "<b>Position</b>, <b>Only in one edition</b>, <b>Start</b> and <b>Stop showing on</b> "
                  "are all optional. Every one of them is explained in the table in Part 5."))

    s.append(PageBreak())

    s.extend(figure("admin-07-step3-filled",
                    "FIGURE 2.6 — Step 3. The completed form. Advertiser <i>Kandan Electronics</i>, a "
                    "link, position 80 — which puts it at the foot of the rail — and a stop date of "
                    "31 March 2027. <i>Show it on the website straight away</i> is ticked, which is the "
                    "normal case.",
                    max_height=205 * mm))

    s.append(PageBreak())

    # ── Step 4 ──
    s.extend(step(4, "Press Add banner",
                  "Three things then happen in order, and the progress bar names each one as it goes:<br/><br/>"
                  "<b>Preparing artwork</b> — the image is redrawn to exactly 1200 × 600 and re-encoded, "
                  "so that every visitor to the site downloads a small file rather than the original.<br/>"
                  "<b>Uploading artwork</b> — it goes from your computer straight into storage.<br/>"
                  "<b>Saving</b> — the booking itself is written down.<br/><br/>"
                  "For a normal advertisement this takes two or three seconds. Do not close the tab "
                  "while the bar is moving."))

    s.extend(figure("admin-08-step4-uploading",
                    "FIGURE 2.7 — Step 4. The upload in progress, with the stage named underneath the bar.",
                    max_height=112 * mm))

    s.append(PageBreak())

    # ── Step 5 ──
    s.extend(step(5, "It is saved",
                  "The form empties itself and returns to its starting state — that is how it tells you "
                  "it worked. The new booking appears in the list on the right straight away, in its "
                  "placement group, at the position you gave it, with <b>0 views · 0 clicks · 0.0% click "
                  "rate</b> and its stop date printed underneath.<br/><br/>"
                  "If anything had gone wrong you would instead see a red message above the button, and "
                  "everything you typed would still be there to correct."))

    s.extend(figure("admin-10-banner-row",
                    "FIGURE 2.8 — Step 5. <i>Kandan Electronics</i> saved as number 8 in the side rail: "
                    "its artwork, &ldquo;From now until March 31, 2027&rdquo;, its three counters, and "
                    "the five controls — move up, move down, Edit, Hide and Delete.",
                    max_height=52 * mm))

    s.append(Spacer(1, 1 * mm))
    s.append(Paragraph("2.4  And on the website", S["h2"]))
    s.append(Paragraph(
        "That is the whole job. The advertisement is on the public site within about a minute — no "
        "publishing step, no approval, nothing else to press. The picture below was taken on the live "
        "home page immediately afterwards.",
        S["body"]))

    s.extend(figure("public-11-example-live",
                    "FIGURE 2.9 — The same booking, live on the public home page, at the foot of the "
                    "side rail — exactly where position 80 put it.",
                    max_height=84 * mm))

    s.append(PageBreak())

    # ═════════════════════════════════════════ PART 3 ═══════════════════════
    s.extend(section_header(
        "Part 3", "After it is live",
        "Everything you will need to do to a booking once it exists — and what the three numbers "
        "underneath it actually mean when an advertiser asks whether their advertisement is working."))

    s.append(Paragraph("3.1  The five controls under every booking", S["h2"]))

    s.extend(table(
        ["Control", "What it does", "Can it be undone?"],
        [["<b>" + UPDN + "</b><br/><b>Move up / down</b>",
          "Changes the running order on the website, immediately. Only appears on the placements that "
          "show every booking — the two side rails and the footer. The top of a rail is the most "
          "valuable position in it.",
          "Yes — move it back."],
         ["<b>Edit</b>",
          "Opens the booking on its own screen. You can change the advertiser's name, the link, the "
          "placement, the dates, the position — and replace the artwork. Leave the artwork alone and "
          "the existing picture is kept untouched.",
          "Yes — edit again."],
         ["<b>Hide</b>",
          "Takes it off the website at once but keeps everything, counters included. The button then "
          "reads <b>Show</b>. This is what to use when an advertiser pauses, or has not paid yet.",
          "Yes — press Show."],
         ["<b>Delete</b>",
          "Removes the booking and its counters for good. It asks you to confirm first.",
          "<b>No.</b> Use Hide unless you are certain."]],
        [CONTENT_W * 0.22, CONTENT_W * 0.58, CONTENT_W * 0.20]))

    s.extend(figure("admin-13-hidden-row",
                    "FIGURE 3.1 — A hidden booking. <i>Silverline Auto Glass</i> is saved, keeps its "
                    "position and its counters, is tagged HIDDEN, and its button now reads <b>Show</b>. "
                    "It is not on the website.",
                    max_height=46 * mm))

    s.append(Spacer(1, 1 * mm))
    s.append(Paragraph("3.2  Start and stop dates", S["h2"]))

    s.extend(table(
        ["Field", "What happens"],
        [["<b>Start showing on</b>",
          "The booking is saved now but stays off the website until that morning. Use it to set up a "
          "campaign in advance — for a seasonal advertiser, for instance — and then forget about it. "
          "Leave it empty and it starts immediately."],
         ["<b>Stop showing on</b>",
          "On the morning after this date the advertisement simply stops appearing. It stays in your "
          "list, tagged, with its final numbers intact, so you can quote them when you ring the "
          "advertiser about renewing. Leave it empty and it runs until you hide it."],
         ["<b>Only in one edition?</b>",
          "Almost always leave this on <i>Show in all editions</i>. The alternative ties the "
          "advertisement to one edition type, which only matters if Vaaram ever publishes more than "
          "the weekly."]],
        [CONTENT_W * 0.24, CONTENT_W * 0.76]))

    s.append(Spacer(1, 1 * mm))
    s.append(Paragraph("3.3  Views, clicks and click rate — what they really count", S["h2"]))
    s.append(Paragraph(
        "These are the numbers you will quote to an advertiser, so it matters that they mean exactly "
        "what they claim. They are deliberately conservative.",
        S["body"]))

    s.extend(table(
        ["Number", "Counted when", "Not counted when"],
        [["<b>Views</b>",
          "The advertisement has actually been on the reader's screen — properly in view, for about a "
          "second.",
          "It is further down a page nobody scrolled to; the browser tab is in the background; a "
          "rotating strip turned over while off screen."],
         ["<b>Clicks</b>",
          "A reader clicks through to the advertiser's link, which opens in a new tab so they do not "
          "lose the magazine.",
          "There is no link on the booking."],
         ["<b>Click rate</b>",
          "Worked out for you: clicks ÷ views. This is the number to quote when an advertiser asks "
          "whether it is working.",
          "—"]],
        [CONTENT_W * 0.16, CONTENT_W * 0.42, CONTENT_W * 0.42]))

    s.extend(callout(
        "WHAT IS NOT COLLECTED, AND WHY IT MATTERS",
        "No cookie is set and no IP address is stored. These are plain running totals and nothing else — "
        "the site cannot tell you <i>who</i> saw an advertisement, only <i>how many times</i> it was "
        "seen. That is an honest number to put in front of an advertiser, and it is also the reason "
        "the website needs no cookie banner.",
        kind="blue"))

    s.append(Spacer(1, 2 * mm))
    s.append(Paragraph("3.4  Two advertisers sharing one strip", S["h2"]))
    s.append(Paragraph(
        "When more than one booking sits in the same wide strip, they take turns automatically — about "
        "seven seconds each — and small dots appear showing how many are sharing it. Hovering pauses "
        "the rotation. Each one records its own views and clicks, and a turn that happens while the "
        "strip is off screen is not counted.",
        S["body"]))

    s.extend(figure_pair(
        "admin-15-strip-group",
        "FIGURE 3.2 — In the dashboard: two advertisers booked into <i>Home — mid page</i>. There are no "
        "move arrows here, because a rotating slot has no running order.",
        "public-04-strip-rotating",
        "FIGURE 3.3 — On the website: one of the two showing, with the dots at the corner marking the "
        "other.",
        max_height=58 * mm))

    s.append(Spacer(1, 1 * mm))
    s.append(Paragraph("3.5  Editing a booking", S["h2"]))
    s.append(Paragraph(
        "<b>Edit</b> opens the booking on its own screen, showing the artwork currently running at the "
        "top. Every field can be changed — including moving an advertisement from one placement to "
        "another, which is how you upgrade an advertiser from the footer to the side rail without "
        "re-typing anything.",
        S["body"]))

    s.extend(callout(
        "IF YOU CHANGE THE PLACEMENT, CHECK THE SHAPE",
        "The two shapes are not interchangeable. Moving a booking from a <b>strip</b> slot to a "
        "<b>card</b> slot — or the other way — leaves the old artwork in place at the wrong proportion, "
        "so it will show with wide bands of background beside it. When you change placement across the "
        "two shapes, upload replacement artwork at the new size in the same edit.",
        kind="amber"))

    s.extend(figure("admin-12-edit-banner",
                    "FIGURE 3.4 — The edit screen. The artwork currently running is shown at the top; "
                    "upload a replacement only if you actually want to change it.",
                    max_height=155 * mm))

    s.append(PageBreak())

    # ═════════════════════════════════════════ PART 4 ═══════════════════════
    s.extend(section_header(
        "Part 4", "What is on the live site today",
        "Nineteen demonstration bookings are running on the live website now. This is the complete "
        "list of what was booked, where, and — just as deliberately — what was left empty."))

    s.append(Paragraph("4.1  The seven placements that were filled", S["h2"]))

    s.extend(table(
        ["Placement", "Bookings", "Who", "What it demonstrates"],
        [["<b>Side rail — every page</b>", "7",
          "Sri Balaji Motors · Selvi Jewellers · Ilango Law · Thinusha Catering · Apex Mortgages · "
          "Anbu Driving School · Kandan Electronics",
          "A full side deck running down the home page and the archive. Also carries the one "
          "<b>hidden</b> booking (Silverline Auto Glass) and one with a <b>stop date</b> (Anbu)."],
         ["<b>Side rail — beside the reader</b>", "2",
          "Uthayan Realty · Maple Leaf Dental",
          "A shorter rail that tops itself up from the every-page rail."],
         ["Every page — above the footer", "4",
          "Bala &amp; Associates CPA · Quality Movers · Nila Fresh Grocers · Kalai Learning Centre",
          "The wrapping grid at the foot of every page."],
         ["Home — under the hero", "1",
          "Vasantham Supermarket",
          "A single advertiser with a wide strip to themselves — no rotation, no dots."],
         ["Home — mid page", "2",
          "Northline Insurance · Tamil Arts Academy",
          "<b>Two advertisers sharing one strip</b>, rotating, with the dots."],
         ["Archive — above the editions", "1", "Lakeview Banquet Hall",
          "A strip on a page other than the home page."],
         ["Reader — above the pages", "1", "Harbour Travel",
          "A strip inside an edition, where readers actually are."]],
        [CONTENT_W * 0.20, 14 * mm, CONTENT_W * 0.30, CONTENT_W * 0.38]))

    s.append(Paragraph("4.2  The four placements left open — on purpose", S["h2"]))
    s.append(Paragraph(
        "These were left unsold so that the &ldquo;This space could be your advertisement&rdquo; panel "
        "can be seen in its real setting, on the real site, alongside genuinely booked slots.",
        S["body"]))

    s.extend(table(
        ["Placement", "Where to look for it"],
        [["Home — feature block", "The home page, between the two halves, below &ldquo;how it works&rdquo;."],
         ["Home — above the closing call", "The home page, just before &ldquo;Get your business discovered&rdquo;."],
         ["Archive — between editions", "The archive, inside the grid of covers."],
         ["Reader — under the pages", "Inside an edition, below the last page."]],
        [CONTENT_W * 0.33, CONTENT_W * 0.67]))

    s.extend(figure("public-02-home-top",
                    "FIGURE 4.1 — The live home page as a visitor now finds it, with the demonstration "
                    "bookings running.",
                    max_height=126 * mm))

    s.append(PageBreak())

    s.extend(figure_pair(
        "public-07-archive-top",
        "FIGURE 4.2 — The archive: the Lakeview Banquet Hall strip above the covers, with the side rail "
        "running down beside them.",
        "public-08-reader-top",
        "FIGURE 4.3 — Inside an edition: the Harbour Travel strip directly above the pages.",
        max_height=84 * mm))

    s.extend(figure("public-09-reader-rail",
                    "FIGURE 4.4 — The reader rail beside the pages of an edition — where readers stay "
                    "longest, and therefore the placement worth the most per booking.",
                    max_height=104 * mm))

    s.extend(callout(
        "CLEARING THE DEMONSTRATION BOOKINGS BEFORE YOU GO LIVE",
        "Every one of these nineteen is an invented business, and none of them should be on the site "
        "when the first real advertiser is. There are two ways to remove them:<br/><br/>"
        "<b>By hand</b> — Admin " + ARROW + " Banners, press <b>Delete</b> on each and confirm. Nineteen presses, "
        "about two minutes, and you get to see the site empty out as you go.<br/><br/>"
        "<b>All at once</b> — ask us to run <font name='Mono' color='#8A1332'>node "
        "scripts/seed-demo-banners.mjs --clear</font>, which removes exactly these nineteen and nothing "
        "you have added yourself. Each demonstration booking is tagged, which is how it knows the "
        "difference.",
        kind="amber"))

    s.append(PageBreak())

    # ═════════════════════════════════════════ PART 5 ═══════════════════════
    s.extend(section_header(
        "Part 5", "Reference",
        "Every field, every limit, every message — and the short list to read down the phone to an "
        "advertiser who asks what to send you."))

    s.append(Paragraph("5.1  Every field on the Add a banner form", S["h2"]))

    s.extend(table(
        ["Field", "Required", "Rules, and what happens if you leave it"],
        [["<b>Where it appears</b>", "Yes",
          "One of the eleven placements. Choose it first — it decides the artwork size asked for "
          "below. Defaults to <i>Side rail — every page</i>."],
         ["<b>Artwork</b>", "Yes",
          "One JPG, PNG or WebP, under 2 MB. Resized to the slot's exact size on upload. A PDF, SVG "
          "or HEIC file is refused."],
         ["<b>Advertiser name</b>", "Yes",
          "Up to 160 characters. For your eyes only — it is how you find this booking again. Readers "
          "never see it."],
         ["Link when clicked", "No",
          "Must start with <font name='Mono'>http://</font> or <font name='Mono'>https://</font>. "
          "Anything else is discarded and stored as no link. Empty means the advertisement is not "
          "clickable, and its click count will stay at zero."],
         ["Only in one edition?", "No",
          "<i>Show in all editions</i> is the normal answer, and the default."],
         ["Position", "No",
          "A number. Lower numbers sit higher up. Leave it empty and the booking is added to the end. "
          "Counting in tens — 10, 20, 30 — leaves room to slot something in between later. Ignored by "
          "the rotating strip slots."],
         ["Start showing on", "No",
          "A date. Empty means it starts now."],
         ["Stop showing on", "No",
          "A date. Empty means it runs until you hide it."],
         ["<b>Show it on the website<br/>straight away</b>", "—",
          "Ticked by default. Untick it to save the booking without putting it on the site — useful "
          "when the artwork is approved but the invoice is not paid."]],
        [CONTENT_W * 0.20, 17 * mm, CONTENT_W * 0.63]))

    s.append(PageBreak())

    s.append(Paragraph("5.2  Artwork rules", S["h2"]))

    s.extend(table(
        ["Rule", "Detail"],
        [["Two sizes only",
          "<b>1200 × 600 px</b> for a card — the two side rails and the footer. "
          "<b>1650 × 300 px</b> for a wide strip — every other slot."],
         ["One file per advertisement",
          "The same picture is used on phones, tablets and desktops. You do not need separate versions."],
         ["Under 2 MB",
          "The form refuses anything larger. Aim well below it — the website compresses what you "
          "upload, but a smaller start is always a smaller finish."],
         ["JPG, PNG or WebP",
          "JPG for photographs, PNG for flat colour and text, WebP if the design tool offers it."],
         ["Nothing is ever cropped",
          "A wrongly-shaped image is fitted inside the frame with white at the sides rather than "
          "trimmed, so no phone number is ever cut off."],
         ["Strips are tiny on a phone",
          "A 1650 × 300 strip is about 64 px tall on a phone. A logo and three or four words. Never "
          "put a phone number or an address on a strip — put it on a card."]],
        [CONTENT_W * 0.24, CONTENT_W * 0.76]))

    s.extend(callout(
        "WHAT TO ASK AN ADVERTISER FOR — READ THIS DOWN THE PHONE",
        "&ldquo;Send me one image, 1200 pixels wide by 600 tall, as a JPG or PNG under 2 MB. Put your "
        "business name, one line about what you do, your phone number and your address on it — big "
        "enough to read on a phone. And send me the web address you want people taken to when they "
        "click it.&rdquo;<br/><br/>"
        "If they have nothing, the fourteen demonstration advertisements now on the site were each made "
        "from a name, three services, a phone number and an address — that is genuinely all it takes.",
        kind="green"))

    s.append(Spacer(1, 1 * mm))
    s.append(Paragraph("Examples of the two shapes, at the sizes the site asks for", S["h3"]))

    s.extend(art_row(["card-01-sri-balaji-motors.jpg", "card-05-apex-mortgages.jpg",
                      "card-08-maple-dental.jpg"],
                     "Three of the demonstration cards — 1200 × 600 px. This is the shape the side rail "
                     "and the footer use.", height=24 * mm))

    s.extend(art_row(["strip-01-vasantham-supermarket.jpg"],
                     "A demonstration wide strip — 1650 × 300 px. Note how little it can carry.",
                     height=17 * mm))

    s.append(PageBreak())

    s.append(Paragraph("5.3  Messages you may see", S["h2"]))

    s.extend(table(
        ["Message", "What it means, and what to do"],
        [["&ldquo;Banner images must be JPG, PNG or WebP.&rdquo;",
          "A PDF, SVG or HEIC file was chosen — HEIC is what an iPhone produces by default. Export it "
          "as JPG and try again."],
         ["&ldquo;… is 3.4 MB. Banner artwork must be under 2 MB.&rdquo;",
          "Export it smaller, or save it as a JPG at about 80% quality."],
         ["&ldquo;Choose the artwork for this advertisement.&rdquo;",
          "You pressed <i>Add banner</i> before attaching an image."],
         ["&ldquo;Enter the advertiser's name…&rdquo;",
          "The advertiser name is blank. It is the one text field that is required."],
         ["The advertisement is saved but not on the site",
          "Three possibilities, in the order worth checking: <i>Show it on the website straight away</i> "
          "was unticked (the row will be tagged HIDDEN); a <i>start</i> date in the future was set; or "
          "its <i>stop</i> date has already passed."],
         ["The advertisement looks stretched or has bands at the sides",
          "The artwork is not the shape the slot renders at — usually a card image in a strip slot, or "
          "the reverse. Edit the booking and upload artwork at the size in 5.2."],
         ["You cannot see it on the site immediately",
          "The public pages refresh about once a minute. Wait a moment and reload."]],
        [CONTENT_W * 0.34, CONTENT_W * 0.66]))

    s.append(Spacer(1, 2 * mm))
    s.append(Paragraph("5.4  A weekly rhythm that works", S["h2"]))

    s.extend(table(
        ["When", "What to do"],
        [["When an advertiser says yes",
          "Post the banner the same day. It does not have to wait for the edition — the website and the "
          "magazine are on separate clocks."],
         ["Every Sunday, with the edition",
          "Open Banners and read down the groups. Anything tagged as stopped is a renewal conversation "
          "waiting to happen, and its final numbers are right there to quote."],
         ["When an advertiser asks if it is working",
          "Read them the three numbers under their booking. Views, clicks, click rate. Nothing else "
          "needs saying."],
         ["When one pauses or does not pay",
          "<b>Hide</b>, never Delete. Hide keeps the artwork, the position and every number, so "
          "restarting them later is one press."],
         ["When the rail gets long",
          "That is the system working as intended — there is no limit. But consider charging more for "
          "the top three positions, because they genuinely are worth more."]],
        [CONTENT_W * 0.28, CONTENT_W * 0.72]))

    s.extend(callout(
        "IN ONE PARAGRAPH",
        "Admin " + ARROW + " Banners. Choose the slot, attach one image, type the advertiser's name and their web "
        "address, press <i>Add banner</i>. It is on the website in about a minute. To change the order, "
        "use the arrows. To pause an advertiser, use <b>Hide</b>, never <b>Delete</b>. The three numbers "
        "under each booking are what you quote when they ask whether it is working. The side rail has no "
        "limit — sell it as hard as you can.",
        kind="blue"))

    doc.build(s)
    print(f"Built {OUT}  ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    build()
