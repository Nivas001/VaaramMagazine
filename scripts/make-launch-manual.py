#!/usr/bin/env python3
"""
─────────────────────────────────────────────────────────────────────────────
 VAARAM MAGAZINE — LAUNCH MANUAL (PDF)

 Everything the publisher has to do to take the site live, written for someone
 who is not a developer. Supabase is the storage provider throughout.

 Run:  python3 scripts/make-launch-manual.py
─────────────────────────────────────────────────────────────────────────────
"""
import pathlib

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, CondPageBreak, Frame,
                                KeepTogether, NextPageTemplate, PageBreak,
                                PageTemplate, Spacer, Table, TableStyle)
from reportlab.platypus import Paragraph as _Paragraph

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "VAARAM-LAUNCH-MANUAL.pdf"


def _fonts():
    try:
        pdfmetrics.registerFont(TTFont("Display", "/System/Library/Fonts/Avenir Next.ttc", subfontIndex=8))
        pdfmetrics.registerFont(TTFont("DisplayMd", "/System/Library/Fonts/Avenir Next.ttc", subfontIndex=2))
        d, dm = "Display", "DisplayMd"
    except Exception:
        d, dm = "Helvetica-Bold", "Helvetica-Bold"
    try:
        SUP = "/System/Library/Fonts/Supplemental/"
        pdfmetrics.registerFont(TTFont("Body", SUP + "Georgia.ttf"))
        pdfmetrics.registerFont(TTFont("Body-Bold", SUP + "Georgia Bold.ttf"))
        pdfmetrics.registerFont(TTFont("Body-Italic", SUP + "Georgia Italic.ttf"))
        pdfmetrics.registerFontFamily("Body", normal="Body", bold="Body-Bold", italic="Body-Italic")
        b = "Body"
    except Exception:
        b = "Times-Roman"
    try:
        pdfmetrics.registerFont(TTFont("Mono", "/System/Library/Fonts/Supplemental/Andale Mono.ttf"))
        m = "Mono"
    except Exception:
        m = "Courier"
    return d, dm, b, m


DISPLAY, DISPLAY_MD, BODY, MONO = _fonts()


def Paragraph(text, style, **kw):
    """
    Paragraph, with one substitution.

    Georgia has no U+2192, so a bare "->" arrow in body copy renders as a
    hollow box. Every arrow is therefore set in the mono face, which does carry
    the glyph — and which is also where a "Menu -> Item" path belongs anyway.
    """
    if isinstance(text, str) and "\u2192" in text:
        text = text.replace("\u2192", f'<font name="{MONO}">\u2192</font>')
    return _Paragraph(text, style, **kw)

WINE = colors.HexColor("#8A1332")
ROSE = colors.HexColor("#B07A5C")
ROSE_PALE = colors.HexColor("#E0B29B")
INK = colors.HexColor("#1A1418")
MUTED = colors.HexColor("#5C5158")
FAINT = colors.HexColor("#8B8188")
LINE = colors.HexColor("#E0D9D4")
PAPER = colors.HexColor("#FAF8F4")
TINT = colors.HexColor("#F3EEE9")
GREEN = colors.HexColor("#2F6B4F")
AMBER = colors.HexColor("#8A6410")
RED = colors.HexColor("#9E3524")
CODE_BG = colors.HexColor("#EFEAE6")

PW, PH = A4
ML, MR = 19 * mm, 19 * mm
CW = PW - ML - MR

S = {
    "h2": ParagraphStyle("h2", fontName=DISPLAY, fontSize=17, leading=20.5, textColor=INK, spaceAfter=7),
    "h3": ParagraphStyle("h3", fontName=DISPLAY_MD, fontSize=11.5, leading=15, textColor=INK,
                         spaceBefore=12, spaceAfter=4),
    "body": ParagraphStyle("body", fontName=BODY, fontSize=9.4, leading=14.6, textColor=MUTED, spaceAfter=7),
    "lede": ParagraphStyle("lede", fontName=BODY, fontSize=10.4, leading=16, textColor=INK, spaceAfter=9),
    "step": ParagraphStyle("step", fontName=BODY, fontSize=9.4, leading=14.6, textColor=MUTED, spaceAfter=5),
    "label": ParagraphStyle("label", fontName=MONO, fontSize=6.8, leading=9, textColor=FAINT, spaceAfter=2),
    "th": ParagraphStyle("th", fontName=MONO, fontSize=6.8, leading=9, textColor=FAINT),
    "td": ParagraphStyle("td", fontName=BODY, fontSize=8.6, leading=12.4, textColor=INK),
    "tdm": ParagraphStyle("tdm", fontName=BODY, fontSize=8.4, leading=12.2, textColor=MUTED),
    "tdmono": ParagraphStyle("tdmono", fontName=MONO, fontSize=7.8, leading=11.4, textColor=INK),
    "bullet": ParagraphStyle("bullet", fontName=BODY, fontSize=9.2, leading=14, textColor=MUTED,
                             leftIndent=10, bulletIndent=1, spaceAfter=4),
}


def code(text):
    """Inline monospace, tinted so a value to copy is unmistakable."""
    return f'<font name="{MONO}" size="8.4" backColor="#EFEAE6">&nbsp;{text}&nbsp;</font>'


def rule(colour=LINE, thickness=0.6, after=0, before=0):
    t = Table([[""]], colWidths=[CW], rowHeights=[thickness])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colour),
                           ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                           ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    out = []
    if before:
        out.append(Spacer(1, before))
    out.append(t)
    if after:
        out.append(Spacer(1, after))
    return out


def section(num, title, lede=None):
    head = Table([[Paragraph(num, ParagraphStyle("n", fontName=MONO, fontSize=7.2, leading=9, textColor=WINE)),
                   Paragraph(title, S["h2"])]],
                 colWidths=[13 * mm, CW - 13 * mm])
    head.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                              ("TOPPADDING", (0, 0), (0, 0), 4), ("TOPPADDING", (1, 0), (1, 0), 0),
                              ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                              ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
    out = [Spacer(1, 3 * mm), *rule(INK, 1.1, after=3.2 * mm), head]
    if lede:
        out.append(Spacer(1, 1.5 * mm))
        out.append(Paragraph(lede, S["lede"]))
    return out


def checkbox():
    """An empty square the reader can tick with a pen."""
    b = Table([[""]], colWidths=[3.4 * mm], rowHeights=[3.4 * mm])
    b.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.9, colors.HexColor("#9C9298")),
                           ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                           ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    return b


def step(n, title, body, where=None, minutes=None):
    """One numbered instruction with a tick box and a 'where' line."""
    meta = " · ".join(x for x in [where, f"{minutes} min" if minutes else None] if x)
    right = [Paragraph(title, ParagraphStyle("st", fontName=DISPLAY_MD, fontSize=10.4,
                                             leading=13.6, textColor=INK, spaceAfter=2))]
    if meta:
        right.append(Paragraph(meta, ParagraphStyle("sm", fontName=MONO, fontSize=6.8,
                                                    leading=10, textColor=ROSE, spaceAfter=3)))
    right.append(Paragraph(body, S["step"]))

    t = Table([[checkbox(), Paragraph(f"{n:02d}", ParagraphStyle("sn", fontName=MONO, fontSize=8,
                                                                 leading=11, textColor=WINE)), right]],
              colWidths=[7 * mm, 8 * mm, CW - 15 * mm])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                           ("TOPPADDING", (0, 0), (0, 0), 3.2), ("TOPPADDING", (1, 0), (-1, 0), 1),
                           ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                           ("LINEABOVE", (0, 0), (-1, 0), 0.5, LINE)]))
    return KeepTogether([t])


def sql_block(lines):
    """A copyable block of SQL or shell, set in mono on a tint."""
    body = "<br/>".join(l.replace(" ", "&nbsp;") for l in lines)
    p = Paragraph(body, ParagraphStyle("sql", fontName=MONO, fontSize=7.6, leading=11.4, textColor=INK))
    t = Table([[p]], colWidths=[CW])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), CODE_BG),
                           ("LINEBEFORE", (0, 0), (0, -1), 1.6, WINE),
                           ("LEFTPADDING", (0, 0), (-1, -1), 6 * mm), ("RIGHTPADDING", (0, 0), (-1, -1), 5 * mm),
                           ("TOPPADDING", (0, 0), (-1, -1), 4.5 * mm), ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5 * mm)]))
    return [Spacer(1, 2 * mm), t, Spacer(1, 3 * mm)]


def callout(title, text, tone="info"):
    edge = {"info": WINE, "warn": AMBER, "good": GREEN}[tone]
    bg = {"info": TINT, "warn": colors.HexColor("#FBF3E4"), "good": colors.HexColor("#EDF4EF")}[tone]
    inner = [Paragraph(title, ParagraphStyle("ct", fontName=DISPLAY_MD, fontSize=9.2, leading=12.5,
                                             textColor=INK, spaceAfter=3)),
             Paragraph(text, ParagraphStyle("cb", fontName=BODY, fontSize=8.8, leading=13.2, textColor=MUTED))]
    t = Table([[inner]], colWidths=[CW])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), bg),
                           ("LINEBEFORE", (0, 0), (0, -1), 1.8, edge),
                           ("LEFTPADDING", (0, 0), (-1, -1), 6.5 * mm), ("RIGHTPADDING", (0, 0), (-1, -1), 5.5 * mm),
                           ("TOPPADDING", (0, 0), (-1, -1), 4.5 * mm), ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5 * mm)]))
    return [Spacer(1, 2.5 * mm), t, Spacer(1, 2.5 * mm)]


def table(headers, rows, widths, mono_cols=()):
    data = [[Paragraph(h.upper(), S["th"]) for h in headers]]
    for r in rows:
        data.append([
            Paragraph(str(c), S["tdmono"] if i in mono_cols else (S["td"] if i == 0 else S["tdm"]))
            for i, c in enumerate(r)
        ])
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                           ("LINEBELOW", (0, 0), (-1, 0), 0.9, INK),
                           ("LINEBELOW", (0, 1), (-1, -1), 0.5, LINE),
                           ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                           ("TOPPADDING", (0, 0), (-1, -1), 4.2), ("BOTTOMPADDING", (0, 0), (-1, -1), 4.2)]))
    return t


def bullets(items):
    return [Paragraph(f"<bullet>&bull;</bullet>{t}", S["bullet"]) for t in items]


# ── Page furniture ───────────────────────────────────────────────────────
def cover(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, PW, PH, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#15090F"))
    canvas.rect(0, PH - 168 * mm, PW, 168 * mm, stroke=0, fill=1)
    canvas.setFillColor(WINE)
    canvas.rect(0, PH - 168 * mm, PW, 3.2 * mm, stroke=0, fill=1)
    canvas.setStrokeColor(colors.Color(1, 1, 1, alpha=0.07))
    canvas.setLineWidth(0.5)
    for i in range(1, 6):
        canvas.line(PW * i / 6, PH - 168 * mm, PW * i / 6, PH)
    canvas.restoreState()


def body_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, PW, PH, stroke=0, fill=1)
    canvas.setFont(MONO, 6.8)
    canvas.setFillColor(FAINT)
    canvas.drawString(ML, PH - 13 * mm, "VAARAM MAGAZINE  /  LAUNCH MANUAL")
    canvas.drawRightString(PW - MR, PH - 13 * mm, f"{doc.page:02d}")
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.6)
    canvas.line(ML, PH - 15.4 * mm, PW - MR, PH - 15.4 * mm)
    canvas.setFont(MONO, 6.4)
    canvas.setFillColor(colors.HexColor("#A9A0A6"))
    canvas.drawString(ML, 11 * mm, "STORAGE: SUPABASE")
    canvas.drawRightString(PW - MR, 11 * mm, "9 SEPTEMBER 2026")
    canvas.restoreState()


# ═════════════════════════════════════════════════════════════════════════
BANNER_SIZES = [
    ("Home — under the hero", "home_hero", "1600 × 200", "1200 × 250", "800 × 400"),
    ("Home — mid page", "home_mid", "1200 × 250", "1200 × 300", "800 × 500"),
    ("Home — feature block", "home_feature", "1200 × 200", "1200 × 250", "800 × 400"),
    ("Home — above closing call", "home_closing", "1200 × 200", "1200 × 250", "800 × 400"),
    ("Archive — above editions", "listing_top", "1600 × 200", "1200 × 250", "800 × 400"),
    ("Archive — between editions", "listing_inline", "1200 × 200", "1200 × 250", "800 × 400"),
    ("Reader — above the pages", "reader_top", "1600 × 200", "1200 × 250", "800 × 400"),
    ("Reader — beside the pages", "reader_sidebar", "600 × 500", "1000 × 600", "1000 × 600"),
    ("Reader — under the pages", "reader_below", "1200 × 250", "1200 × 300", "800 × 500"),
    ("Every page — above footer", "footer", "1200 × 200", "1200 × 250", "800 × 400"),
]

ENV_VARS = [
    ("NEXT_PUBLIC_SITE_URL", "Yes", "Your live address, no trailing slash. https://www.vaaram.ca"),
    ("NEXT_PUBLIC_SUPABASE_URL", "Yes", "Supabase → Project Settings → Data API"),
    ("NEXT_PUBLIC_SUPABASE_ANON_KEY", "Yes*", "The public key. *Or the PUBLISHABLE one — whichever pair your dashboard shows."),
    ("SUPABASE_SERVICE_ROLE_KEY", "Yes*", "The secret key. Never prefix with NEXT_PUBLIC_. *Or SUPABASE_SECRET_KEY."),
    ("WEB3FORMS_ACCESS_KEY", "No", "Emails you a copy of each enquiry. Enquiries save either way."),
    ("R2_* and NEXT_PUBLIC_R2_PUBLIC_URL", "No", "Leave every one blank. That is what keeps storage on Supabase."),
]


def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=ML, rightMargin=MR,
                          topMargin=21 * mm, bottomMargin=18 * mm,
                          title="Vaaram Magazine — Launch Manual",
                          subject="Everything to do to take the site live, using Supabase for storage")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[Frame(ML, 18 * mm, CW, PH - 36 * mm, id="c",
                                               leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)],
                     onPage=cover),
        PageTemplate(id="body", frames=[Frame(ML, 18 * mm, CW, PH - 39 * mm, id="b",
                                              leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)],
                     onPage=body_page),
    ])

    F = []

    # ── COVER ────────────────────────────────────────────────────────────
    F.append(Spacer(1, 16 * mm))
    F.append(Paragraph("VAARAM MAGAZINE&nbsp;&nbsp;/&nbsp;&nbsp;WWW.VAARAM.CA",
                       ParagraphStyle("ck", fontName=MONO, fontSize=7.4, leading=10, textColor=ROSE_PALE)))
    F.append(Spacer(1, 8 * mm))
    F.append(Paragraph("Launch<br/>manual",
                       ParagraphStyle("ct", fontName=DISPLAY, fontSize=46, leading=46,
                                      textColor=colors.HexColor("#FAF8F4"))))
    F.append(Spacer(1, 7 * mm))
    F.append(Paragraph(
        "Everything left to do, in the order to do it. Written for someone who "
        "is not a developer. Storage stays on Supabase throughout — no "
        "Cloudflare account is needed, now or later.",
        ParagraphStyle("cs", fontName=BODY, fontSize=10.6, leading=16.5,
                       textColor=colors.HexColor("#C9BDC2"))))
    F.append(Spacer(1, 26 * mm))

    g = Table([[
        Paragraph("8", ParagraphStyle("g", fontName=DISPLAY, fontSize=54, leading=52,
                                      textColor=colors.HexColor("#FAF8F4"))),
        Paragraph(
            f'<font name="{MONO}" size=7 color="#E0B29B">STEPS TO LIVE</font><br/>'
            f'<font name="{BODY}" size=9.5 color="#C9BDC2">None of them need code. Two are '
            f'copy-and-paste, four are typing your own details, and two are clicking '
            f'through a dashboard. Budget an afternoon.</font>',
            ParagraphStyle("gs", fontName=BODY, fontSize=9.5, leading=14)),
    ]], colWidths=[26 * mm, CW - 26 * mm])
    g.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                           ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                           ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    F.append(g)

    F.append(Spacer(1, 26 * mm))
    F.append(Paragraph("Print this and tick the boxes as you go.",
                       ParagraphStyle("cm", fontName=MONO, fontSize=7.2, leading=10, textColor=FAINT)))

    F.append(NextPageTemplate("body"))
    F.append(PageBreak())

    # ── 01 THE WHOLE THING AT A GLANCE ───────────────────────────────────
    F += section("01", "The whole launch, on one page",
                 "Do these in order. Steps 1 and 2 must happen before anything "
                 "else works; the rest can be done in any order but all of them "
                 "must be done before you show this to a client.")

    F.append(step(1, "Run the database script",
                  "Creates the reader list and the new per-device banner columns. Until this is done, "
                  "the email sign-up box on the site returns an error. Full instructions in section 02.",
                  where="Supabase → SQL Editor", minutes=2))
    F.append(step(2, "Check the storage bucket",
                  "A public bucket named " + code("media") + " holding your PDFs and artwork. It already "
                  "exists and has been given a 50 MB ceiling and a file-type allow-list. Section 03 tells "
                  "you how to confirm.",
                  where="Supabase → Storage", minutes=2))
    F.append(step(3, "Replace the placeholder contact details",
                  "The phone number on the site is a reserved 555 number that can never connect, and the "
                  "email and address are invented. This is the one thing that would embarrass a live site. "
                  "Section 04.",
                  where="site.config.ts", minutes=10))
    F.append(step(4, "Put your real logo in",
                  "The bird mark on the site was redrawn from the image you sent, because the file itself "
                  "could not be recovered from the chat. Section 05.",
                  where="public/brand/", minutes=10))
    F.append(step(5, "Invite yourself as an administrator",
                  "Sign-ups are disabled on purpose, so the only way in is an invitation you send from the "
                  "Supabase dashboard. Section 06.",
                  where="Supabase → Authentication", minutes=3))
    F.append(step(6, "Deploy and point the domain",
                  "Push the code to a host, paste the environment variables in, and point vaaram.ca at it. "
                  "Section 07.",
                  where="Your host", minutes=45))
    F.append(step(7, "Publish the first real edition",
                  "The eighteen demo editions vanish by themselves the moment one real issue exists. "
                  "Nothing needs deleting. Section 08.",
                  where="Admin → Publish", minutes=10))
    F.append(step(8, "Walk the launch checklist",
                  "Ten checks that take five minutes and catch everything that commonly goes wrong on the "
                  "first day. Section 11.",
                  where="Your live site", minutes=5))

    F += callout("What is already done",
                 "The database tables, the security rules, the storage bucket and its limits, all ten "
                 "advertising slots, the responsive banner system, the security headers and the whole "
                 "front end are built and tested. The list above is only the part that needs your "
                 "accounts and your details — none of it needs a developer.", tone="good")

    F.append(PageBreak())

    # ── 02 DATABASE ──────────────────────────────────────────────────────
    F += section("02", "Step 1 — Run the database script",
                 "Two minutes, and nothing else works until it is done.")

    F.append(Paragraph(
        "Open your Supabase project, click <b>SQL Editor</b> in the left sidebar, then "
        "<b>New query</b>. Open the file " + code("supabase/schema.sql") + " from the project, copy "
        "<b>all</b> of it, paste it into the editor and press <b>Run</b>.", S["body"]))
    F.append(Paragraph(
        "It is written to be safe to run as many times as you like — running it twice changes nothing. "
        "You should see " + code("Success. No rows returned") + " when it finishes.", S["body"]))

    F.append(Paragraph("What it creates", S["h3"]))
    F.append(table(
        ["Table", "What it holds"],
        [["publications", "One row per weekly edition — title, date, the PDF, page count, view and download counts."],
         ["ad_banners", "Every booked advertisement, including the new per-device artwork columns."],
         ["enquiries", "Messages from the contact form."],
         ["subscribers", "Readers who asked to be emailed when an edition goes live. This is the new one."]],
        [34 * mm, CW - 34 * mm], mono_cols=(0,)))

    F += callout("How to know it worked",
                 "Sign in to the site's own admin at " + code("/admin/settings") + ". If any table is "
                 "still missing it is named there in an amber warning. No warning means the database is "
                 "correct. You can also try the email sign-up box on the home page — it will save "
                 "silently instead of returning an error.", tone="info")

    F.append(Paragraph("If you would rather paste just the new part", S["h3"]))
    F.append(Paragraph(
        "Running the whole file is safer and is what we recommend. But if you have already run an older "
        "version of the script and only want what changed, this is it:", S["body"]))
    F += sql_block([
        "-- Per-device banner artwork (optional; falls back to desktop)",
        "alter table public.ad_banners add column if not exists image_url_tablet text;",
        "alter table public.ad_banners add column if not exists image_key_tablet text;",
        "alter table public.ad_banners add column if not exists image_url_mobile text;",
        "alter table public.ad_banners add column if not exists image_key_mobile text;",
        "",
        "-- The reader email list",
        "create table if not exists public.subscribers (",
        "  id              uuid primary key default gen_random_uuid(),",
        "  created_at      timestamptz not null default now(),",
        "  email           varchar(190) not null unique,",
        "  source          varchar(40)  not null default 'home',",
        "  is_active       boolean      not null default true,",
        "  unsubscribed_at timestamptz",
        ");",
        "alter table public.subscribers enable row level security;",
        "create policy \"admins manage subscribers\" on public.subscribers",
        "  for all to authenticated using (true) with check (true);",
    ])

    F.append(PageBreak())

    # ── 03 STORAGE ───────────────────────────────────────────────────────
    F += section("03", "Step 2 — Storage, on Supabase",
                 "Your PDFs and every piece of banner artwork live in a Supabase "
                 "bucket. It is already set up. This section is how to check it, "
                 "and what its limits mean for you.")

    F.append(Paragraph(
        "In Supabase, click <b>Storage</b>. You should see one bucket named " + code("media") +
        " marked <b>Public</b>. Public is correct and necessary: a reader's browser has to be able to "
        "fetch an edition PDF and a banner image without signing in. Nothing private is ever put in it — "
        "enquiries and subscriber addresses live in the database, which is not public.", S["body"]))

    F.append(Paragraph("The limits already applied", S["h3"]))
    F.append(table(
        ["Setting", "Value", "Why"],
        [["File size ceiling", "50 MB", "The maximum your Supabase plan allows. The site refuses anything larger before the upload starts, so you never watch a long upload fail."],
         ["Allowed types", "PDF, JPG, PNG, WebP, SVG", "Storage refuses anything else even if something tried to send it."],
         ["Banner artwork cap", "2 MB", "Enforced by the site. Artwork is served exactly as uploaded, so one oversized image would become every visitor's download."]],
        [30 * mm, 26 * mm, CW - 56 * mm]))

    F += callout("The one number to watch",
                 "The free Supabase plan includes roughly 5 GB of downloads a month. A 10 MB edition read "
                 "500 times is 5 GB. If the magazine gets popular you will see this in the Supabase usage "
                 "page before anything breaks — and the fix is a paid plan or moving files to Cloudflare "
                 "R2, which the site already supports by filling in five environment variables. Nothing "
                 "needs re-uploading when you switch: new files go to the new home and every existing "
                 "link keeps working.", tone="warn")

    F.append(Paragraph("Keeping editions small", S["h3"]))
    F += bullets([
        "Export the PDF at <b>150 dpi</b> rather than 300 for the web copy. A 40-page edition should land between 3 MB and 10 MB.",
        "In Acrobat: <b>File → Save As Other → Reduced Size PDF</b>. In Preview on a Mac: <b>File → Export → Quartz Filter → Reduce File Size</b>.",
        "Keep the print-ready original elsewhere. What you upload here is the reading copy.",
    ])

    F.append(PageBreak())

    # ── 04 CONTENT ───────────────────────────────────────────────────────
    F += section("04", "Step 3 — Your real details",
                 "Everything a visitor reads that is not an edition comes from a "
                 "single file. Open " + code("site.config.ts") + " in the project "
                 "root and work down it.")

    F.append(table(
        ["Line", "Currently", "Change it to"],
        [["contact.email", "contact@vaaram.ca", "The inbox you actually read."],
         ["contact.phone", "+1 647 555 0199", "Your real number. 555 numbers are reserved and can never connect — this is the most important one."],
         ["contact.whatsapp", "16475550199", "Digits only, with country code, no plus sign. Leave empty to hide WhatsApp everywhere."],
         ["contact.address", "Toronto, Ontario, Canada", "Your street address, or the city if you would rather not publish one."],
         ["contact.hours", "Mon – Sat, 9–6 ET", "When someone can expect an answer."],
         ["social.*", "empty", "Facebook, Instagram and YouTube addresses. Anything left empty simply does not appear."]],
        [30 * mm, 38 * mm, CW - 68 * mm], mono_cols=(0,)))

    F.append(Paragraph("Also worth a read while you are in there", S["h3"]))
    F += bullets([
        "<b>ticker</b> — the scrolling lines at the very top of every page.",
        "<b>categories</b> — the six sections shown as what is inside an edition. Change these if your magazine carries different ones; they appear on the home page and the About page.",
        "<b>faq</b> — the six questions on the Contact page. These are also published as structured data, so a search engine may quote them word for word. Keep every answer true.",
        "<b>publishDay</b> and <b>publishDayLabel</b> — currently Sunday. Change both together if you publish on a different day.",
    ])

    F += callout("Anything marked PLACEHOLDER",
                 "Search the file for the word " + code("PLACEHOLDER") + ". Every one of them is a "
                 "deliberately fake value that must be replaced before launch. When the search returns "
                 "nothing, this step is done.", tone="warn")

    F.append(PageBreak())

    # ── 05 LOGO ──────────────────────────────────────────────────────────
    F += section("05", "Step 4 — Your real logo",
                 "The bird mark on the site today is a vector redrawn from the "
                 "image you sent, because the image itself could not be pulled "
                 "out of the chat as a file. Same maroon, same rose gold, same "
                 "bird — but not your artwork.")

    F.append(Paragraph(
        "Ask your designer for the mark as an <b>SVG</b>, without the wordmark and without the web "
        "address beside it — just the bird, trimmed tight, on a transparent background. Then:", S["body"]))

    F += bullets([
        "Save it over " + code("public/brand/vaaram-mark.svg") + ".",
        "Open " + code("components/site/VaaramMark.tsx") + " and replace the drawing inside the "
        "<font name='" + MONO + "' size=8>&lt;svg&gt;</font> with the contents of your file, keeping the "
        "surrounding component exactly as it is.",
        "If your designer can only supply a PNG, that works for the favicon but not for the header — ask "
        "for the SVG, it is the same file they used to make the PNG.",
    ])

    F += callout("Why two files",
                 "One is the flat artwork used for the browser-tab icon and the picture that appears when "
                 "someone shares a link. The other is the version used in the header, footer and admin, "
                 "which recolours itself for light mode, dark mode and the deep wine bands. Replacing "
                 "both keeps them identical.", tone="info")

    F.append(Paragraph("The rest of the identity is already set", S["h3"]))
    F.append(Paragraph(
        "The site's colours were taken from your logotype: the maroon of the wordmark is the accent "
        "throughout, and the rose gold of the mark's feathers carries the small labels. The headline "
        "typeface matches the one you asked for. None of that changes when you swap the mark.", S["body"]))

    F.append(PageBreak())

    # ── 06 ADMIN ACCESS ──────────────────────────────────────────────────
    F += section("06", "Step 5 — Getting into the admin",
                 "There is no password and no sign-up form. You invite yourself "
                 "once from Supabase, and after that you sign in with a six-digit "
                 "code emailed to you.")

    F.append(Paragraph("Invite yourself", S["h3"]))
    F += bullets([
        "Supabase → <b>Authentication</b> → <b>Users</b> → <b>Add user</b> → <b>Send invitation</b>.",
        "Enter the email address you want to publish from. You will get an invitation email — accept it.",
        "Supabase → <b>Authentication</b> → <b>Providers</b> → <b>Email</b>: make sure <b>Enable sign-ups</b> is <b>off</b>. This is what stops anyone else requesting a code.",
    ])

    F.append(Paragraph("Signing in from then on", S["h3"]))
    F.append(Paragraph(
        "Go to " + code("/admin") + ", type your address, and a six-digit code arrives by email. It is "
        "valid for a few minutes and can only be used once. There is no password to forget, lose or "
        "leak.", S["body"]))

    F += callout("Adding a second person later",
                 "Repeat the invitation step with their address. Everyone invited has the same full "
                 "access — there are no separate roles — so only invite people you would trust to "
                 "delete an edition.", tone="warn")

    F.append(Paragraph("What the admin can do", S["h3"]))
    F.append(table(
        ["Screen", "What it is for"],
        [["Dashboard", "Live counts of editions, views, waiting enquiries, running banners and readers on the list."],
         ["Publish", "Upload the week's PDF. The cover picture and page count are worked out for you."],
         ["Issues", "Every edition. Hide one, show it again, or delete it."],
         ["Enquiries", "Everything sent through the contact form. Mark each one contacted or closed."],
         ["Banners", "Book, schedule and retire advertisements. Views and click rate per banner."],
         ["Readers", "The email list. Export it, or unsubscribe someone by hand."],
         ["Settings", "What is connected, what is missing, and a warning if the database is out of date."]],
        [26 * mm, CW - 26 * mm]))

    F.append(PageBreak())

    # ── 07 DEPLOY ────────────────────────────────────────────────────────
    F += section("07", "Step 6 — Going live",
                 "Any host that runs Next.js will do. Vercel is the least work "
                 "and has a free tier that fits this site.")

    F += bullets([
        "Push the project to a GitHub repository.",
        "At your host, create a new project from that repository. Next.js is detected automatically — accept the defaults.",
        "Before the first deploy, paste in the environment variables from the table below.",
        "Deploy. When it succeeds, add your domain in the host's settings and follow its instructions for pointing " + code("vaaram.ca") + " at it.",
        "Set " + code("NEXT_PUBLIC_SITE_URL") + " to the final address and deploy once more — the sitemap, the share card and every canonical link read that value.",
    ])

    F.append(Paragraph("Environment variables", S["h3"]))
    F.append(table(
        ["Variable", "Needed", "Where it comes from"],
        [[v, n, d] for v, n, d in ENV_VARS],
        [58 * mm, 16 * mm, CW - 74 * mm], mono_cols=(0,)))

    F += callout("Keep the R2 lines empty",
                 "The five Cloudflare R2 variables are what switch storage away from Supabase. Leaving "
                 "them blank is a supported, tested configuration and is what this manual assumes "
                 "throughout. Fill them in only when download volume makes it worthwhile.", tone="info")

    F += callout("The secret key really is secret",
                 code("SUPABASE_SERVICE_ROLE_KEY") + " bypasses every permission rule in the database. It "
                 "must only ever be set on the server, never prefixed with " + code("NEXT_PUBLIC_") +
                 ", and never committed to the repository. If it is ever exposed, rotate it in Supabase "
                 "immediately — Project Settings → API → Reset.", tone="warn")

    F.append(PageBreak())

    # ── 08 PUBLISHING ────────────────────────────────────────────────────
    F += section("08", "Step 7 — Publishing an edition",
                 "The weekly job, and the one you will do most often. It takes "
                 "about a minute once the PDF is ready.")

    F += bullets([
        "Admin → <b>Publish</b>.",
        "Drag the week's PDF onto the upload area. The page count and the cover picture are read out of the file automatically.",
        "Give it a title — " + code("Issue 205") + " or " + code("Week of 14 September") + ", whichever you prefer, but stay consistent.",
        "Set the edition date. This is what the archive sorts and groups by, so it matters more than the title.",
        "Write a sentence or two describing what is in this week's issue. It appears on the edition card and in search results.",
        "<b>Publish now</b> puts it live immediately. <b>Save as draft</b> keeps it hidden until you are ready.",
    ])

    F += callout("The demo editions",
                 "Until you publish a real edition the site shows eighteen generated examples so nothing "
                 "looks empty. They disappear on their own the moment one real issue exists — there is "
                 "nothing to delete and no setting to change.", tone="good")

    F.append(Paragraph("Where a published edition appears", S["h3"]))
    F.append(Paragraph(
        "Immediately, and everywhere: the home page hero, the edition record below it, the archive in "
        "all three views, the sitemap search engines read, and its own page with the reader. This was "
        "verified end to end — a row written to the database appeared on the home page and the archive "
        "on the next request, with no cache to clear by hand.", S["body"]))

    F.append(PageBreak())

    # ── 09 BANNERS ───────────────────────────────────────────────────────
    F += section("09", "Advertising banners, and the new per-device artwork",
                 "Ten sellable positions across the site. Each one can now carry "
                 "different artwork for phones, tablets and desktops — because a "
                 "wide desktop strip is unreadable when squeezed onto a phone.")

    F.append(Paragraph("How it works", S["h3"]))
    F.append(Paragraph(
        "When you add a banner you choose the placement first, and the form then shows you three upload "
        "boxes with the exact pixel size each one wants. <b>Desktop is required.</b> Tablet and phone are "
        "optional — anything you leave empty quietly falls back to the desktop artwork, so a single image "
        "still works everywhere.", S["body"]))
    F.append(Paragraph(
        "A visitor's browser then downloads only the artwork for its own screen. A phone never pays for "
        "the desktop file.", S["body"]))

    F.append(Paragraph("What to ask an advertiser for", S["h3"]))
    F.append(table(
        ["Placement", "Key", "Desktop", "Tablet", "Phone"],
        [[a, b, c, d, e] for a, b, c, d, e in BANNER_SIZES],
        [44 * mm, 26 * mm, 22 * mm, 22 * mm, CW - 114 * mm], mono_cols=(1, 2, 3, 4)))

    F.append(Paragraph("Adding one", S["h3"]))
    F += bullets([
        "Admin → <b>Banners</b>. Choose <b>where it appears</b> first — the sizes below it change to match.",
        "Upload the desktop artwork. Add tablet and phone artwork too if the advertiser supplied them.",
        "Enter the advertiser's name — this is only for you, so you can find the banner later.",
        "Add the link it should open when clicked. Only ordinary web addresses are accepted; anything else is refused.",
        "Optionally set an end date, and optionally restrict it to one edition.",
    ])

    F += callout("Artwork must be under 2 MB",
                 "Every visitor downloads banner artwork exactly as you upload it. A 4 MB photograph "
                 "would be a 4 MB download on every page it appears. The form refuses anything larger and "
                 "tells you the size — export as JPG at around 80% quality, or WebP if your designer can "
                 "supply it.", tone="warn")

    F.append(Paragraph("Reading the list", S["h3"]))
    F.append(Paragraph(
        "Each banner shows three small tags — Desktop, Tablet and Phone. A green tag means the advertiser "
        "supplied artwork drawn for that size; a grey one with an arrow means it falls back to the desktop "
        "image. Neither is wrong; the tags simply let you see at a glance which bookings are fully "
        "dressed. Underneath, views, clicks and the click rate.", S["body"]))

    F += callout("Empty slots are never holes",
                 "A placement with nothing booked shows Vaaram's own quiet panel — labelled as Vaaram "
                 "advertising, styled unlike any paid banner, linking to your contact page. It keeps the "
                 "layout intact before your first client signs, and sells the slot while it waits.",
                 tone="good")

    F.append(PageBreak())

    # ── 10 SECURITY ──────────────────────────────────────────────────────
    F += section("10", "Security — what was done, and what to keep doing",
                 "Five issues were found and fixed while preparing this. None had "
                 "reached the public site, because the site has not been public. "
                 "They are listed so you know what was checked.")

    F.append(table(
        ["Issue", "Status", "What it was"],
        [["Structured-data injection", "Fixed",
          "An edition title containing markup could have broken out of the hidden data block search engines read. Every one of those blocks is now escaped."],
         ["Unsafe banner links", "Fixed",
          "A banner link is now filtered to ordinary web addresses only, both when saved and again before the page is built, so an older row cannot slip through."],
         ["No upload size limit", "Fixed",
          "Editions are capped at 50 MB, artwork at 2 MB, and Supabase Storage now enforces both independently of the site."],
         ["Open counter endpoint", "Fixed",
          "The address that records banner views was rate-limited. Advertisers are shown these numbers, so inflating them was an integrity problem."],
         ["Missing security headers", "Fixed",
          "A content security policy, strict transport security and a frame ban were added. The site can no longer be embedded in someone else's page."]],
        [36 * mm, 16 * mm, CW - 52 * mm]))

    F.append(Paragraph("What was already right", S["h3"]))
    F += bullets([
        "<b>The database enforces its own rules.</b> A visitor can read published editions and running banners and nothing else. Enquiries and subscriber addresses are unreadable to the public no matter what the website asks for.",
        "<b>No password to steal.</b> Admin access is an emailed one-time code with sign-ups disabled.",
        "<b>No tracking.</b> No cookie, no IP address, no visitor identity is stored — which is why the site legitimately needs no cookie banner.",
        "<b>Forms are rate-limited</b> and carry a honeypot, so automated submissions are turned away without a captcha.",
        "<b>Uploads never pass through the server</b> — the browser is handed a short-lived signed link and sends the file straight to storage.",
    ])

    F.append(Paragraph("Your ongoing part", S["h3"]))
    F += bullets([
        "Never share the secret key, and never paste it anywhere with " + code("NEXT_PUBLIC_") + " in front of it.",
        "Keep sign-ups disabled in Supabase. Check it after any Supabase update.",
        "Only invite administrators you would trust to delete an edition.",
        "If someone leaves, remove their user in Supabase → Authentication → Users.",
    ])

    F += callout("One known limitation, stated plainly",
                 "The content security policy still allows inline scripts, because the framework needs "
                 "them and removing that safely requires a change to how every page is served. It is a "
                 "hardening improvement, not an open door — everything else the policy covers is locked "
                 "down. Worth doing later; not worth delaying launch for.", tone="info")

    F.append(PageBreak())

    # ── 11 CHECKLIST ─────────────────────────────────────────────────────
    F += section("11", "Step 8 — The launch-day checklist",
                 "Five minutes on the live site. Every one of these has caught a "
                 "real problem on a real launch at some point.")

    checks = [
        "The home page loads at your real domain, with a padlock in the address bar.",
        "The phone number in the footer is yours, and dialling it rings you.",
        "The email address in the footer is yours, and a message to it arrives.",
        "This week's edition opens in the reader and the pages turn.",
        "The download button gives you the PDF.",
        "Send yourself an enquiry through the contact form, then find it in Admin → Enquiries.",
        "Put your own address into the email sign-up box, then find it in Admin → Readers.",
        "Open the site on your phone. Check the hero, the menu, and an edition.",
        "Admin → Settings shows no amber warnings.",
        "Search for your business name on Google in a week — the sitemap is submitted automatically, but indexing takes days.",
    ]
    for i, c in enumerate(checks, 1):
        row = Table([[checkbox(), Paragraph(c, S["step"])]], colWidths=[8 * mm, CW - 8 * mm])
        row.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                                 ("TOPPADDING", (0, 0), (0, 0), 3), ("TOPPADDING", (1, 0), (1, 0), 0),
                                 ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                                 ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                                 ("LINEABOVE", (0, 0), (-1, 0), 0.5, LINE)]))
        F.append(row)

    F.append(Spacer(1, 4 * mm))
    F += section("12", "If something looks wrong")

    F.append(table(
        ["What you see", "What it means", "What to do"],
        [["The sign-up box says it could not save",
          "The subscribers table does not exist.",
          "Run the database script — section 02."],
         ["Amber warning in Admin → Settings",
          "The database is behind the code.",
          "Run the database script again. It is safe to repeat."],
         ["An upload fails part way",
          "Usually the file is over the ceiling.",
          "Editions must be under 50 MB, artwork under 2 MB. Export smaller."],
         ["A banner does not appear",
          "It is hidden, expired, or set to a different edition.",
          "Check it in Admin → Banners: the tags show hidden and expired."],
         ["A new edition is not on the home page",
          "It was saved as a draft.",
          "Admin → Issues, then Show."],
         ["Demo editions still showing",
          "No real edition is published yet.",
          "Publish one. They vanish by themselves."],
         ["Cannot sign in",
          "The address was never invited, or sign-ups are off and it is not on the list.",
          "Invite it in Supabase → Authentication → Users."]],
        [40 * mm, 44 * mm, CW - 84 * mm]))

    F += callout("Verified before this manual was written",
                 "A real edition was written to the live database and appeared on the home page, the "
                 "archive and its own reader page. A real banner was booked and rendered in its slot with "
                 "the correct artwork chosen at desktop, tablet and phone widths. A real enquiry was "
                 "submitted through the form and arrived in the database. Every admin address was "
                 "confirmed to bounce a signed-out visitor to the sign-in page. All test data was then "
                 "removed. The only thing that could not be tested is the reader email list, because its "
                 "table does not exist until you run step 1.", tone="good")

    doc.build(F)
    return OUT


if __name__ == "__main__":
    p = build()
    print("wrote", p.relative_to(ROOT), f"({p.stat().st_size/1024:.0f} KB)")
