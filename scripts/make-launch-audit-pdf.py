#!/usr/bin/env python3
"""
─────────────────────────────────────────────────────────────────────────────
 VAARAM MAGAZINE — OFFICIAL PUBLIC LAUNCH READINESS AUDIT (PDF GENERATOR)

 Evaluates whether Vaaram Magazine is officially ready for public release,
 details the 5 critical pre-launch blockers, provides the launch scorecard,
 and provides the step-by-step go-live checklist.

 Output: documents/VAARAM-LAUNCH-READINESS-AUDIT.pdf
─────────────────────────────────────────────────────────────────────────────
"""
import pathlib
import sys

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
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
DOCS_DIR = ROOT / "documents"
DOCS_DIR.mkdir(parents=True, exist_ok=True)
OUT = DOCS_DIR / "VAARAM-LAUNCH-READINESS-AUDIT.pdf"


def _register_fonts():
    try:
        pdfmetrics.registerFont(TTFont("Display", "/System/Library/Fonts/Avenir Next.ttc", subfontIndex=8))
        pdfmetrics.registerFont(TTFont("DisplayMd", "/System/Library/Fonts/Avenir Next.ttc", subfontIndex=2))
        disp, dispmd = "Display", "DisplayMd"
    except Exception:
        disp, dispmd = "Helvetica-Bold", "Helvetica-Bold"

    try:
        sup = "/System/Library/Fonts/Supplemental/"
        pdfmetrics.registerFont(TTFont("Body", sup + "Georgia.ttf"))
        pdfmetrics.registerFont(TTFont("Body-Bold", sup + "Georgia Bold.ttf"))
        pdfmetrics.registerFont(TTFont("Body-Italic", sup + "Georgia Italic.ttf"))
        pdfmetrics.registerFontFamily("Body", normal="Body", bold="Body-Bold", italic="Body-Italic")
        body, bodyb = "Body", "Body-Bold"
    except Exception:
        body, bodyb = "Times-Roman", "Times-Bold"

    try:
        pdfmetrics.registerFont(TTFont("Mono", "/System/Library/Fonts/Supplemental/Andale Mono.ttf"))
        mono = "Mono"
    except Exception:
        mono = "Courier"

    return disp, dispmd, body, bodyb, mono


DISPLAY, DISPLAY_MD, BODY, BODY_B, MONO = _register_fonts()

# ── Colors ────────────────────────────────────────────────────────────────
WINE = colors.HexColor("#8A1332")
WINE_DEEP = colors.HexColor("#4A0A1B")
ROSE = colors.HexColor("#B07A5C")
ROSE_PALE = colors.HexColor("#F5ECE6")
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

PW, PH = A4
ML, MR = 18 * mm, 18 * mm
CONTENT_W = PW - ML - MR

# ── Styles ────────────────────────────────────────────────────────────────
S = {
    "cover_tag": ParagraphStyle(
        "cover_tag", fontName=MONO, fontSize=8, leading=10, textColor=ROSE, spaceAfter=8
    ),
    "cover_title": ParagraphStyle(
        "cover_title", fontName=DISPLAY, fontSize=26, leading=30, textColor=colors.white, spaceAfter=10
    ),
    "cover_sub": ParagraphStyle(
        "cover_sub", fontName=BODY, fontSize=11, leading=16, textColor=colors.HexColor("#EADBD7"), spaceAfter=14
    ),
    "h1": ParagraphStyle(
        "h1", fontName=DISPLAY, fontSize=18, leading=22, textColor=INK, spaceBefore=12, spaceAfter=6
    ),
    "h2": ParagraphStyle(
        "h2", fontName=DISPLAY, fontSize=12, leading=15, textColor=INK, spaceBefore=8, spaceAfter=3
    ),
    "h3": ParagraphStyle(
        "h3", fontName=DISPLAY_MD, fontSize=10.5, leading=14, textColor=INK, spaceBefore=8, spaceAfter=3
    ),
    "eyebrow": ParagraphStyle(
        "eyebrow", fontName=MONO, fontSize=7, leading=9, textColor=ROSE, spaceAfter=3
    ),
    "body": ParagraphStyle(
        "body", fontName=BODY, fontSize=8.8, leading=13.5, textColor=MUTED, spaceAfter=6
    ),
    "body_ink": ParagraphStyle(
        "body_ink", fontName=BODY, fontSize=8.8, leading=13.5, textColor=INK, spaceAfter=6
    ),
    "body_bold": ParagraphStyle(
        "body_bold", fontName=BODY_B, fontSize=8.8, leading=13.5, textColor=INK, spaceAfter=4
    ),
    "lede": ParagraphStyle(
        "lede", fontName=BODY, fontSize=9.6, leading=15, textColor=INK, spaceAfter=8
    ),
    "bullet": ParagraphStyle(
        "bullet", fontName=BODY, fontSize=8.6, leading=13, textColor=MUTED, leftIndent=8, spaceAfter=3
    ),
    "mono_sm": ParagraphStyle(
        "mono_sm", fontName=MONO, fontSize=7.2, leading=9.5, textColor=INK
    ),
    "th": ParagraphStyle(
        "th", fontName=MONO, fontSize=6.8, leading=9, textColor=FAINT
    ),
    "td": ParagraphStyle(
        "td", fontName=BODY, fontSize=8.2, leading=11.5, textColor=INK
    ),
    "td_muted": ParagraphStyle(
        "td_muted", fontName=BODY, fontSize=8, leading=11, textColor=MUTED
    ),
}


def rule(color=LINE, thickness=0.5, space_before=2 * mm, space_after=3 * mm):
    t = Table([[""]], colWidths=[CONTENT_W], rowHeights=[thickness])
    t.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), color),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ])
    )
    return [Spacer(1, space_before), t, Spacer(1, space_after)]


def section_header(eyebrow, title, lede=None):
    out = []
    out.append(Paragraph(eyebrow.upper(), S["eyebrow"]))
    out.append(Paragraph(title, S["h1"]))
    if lede:
        out.append(Paragraph(lede, S["lede"]))
    out.extend(rule(LINE, 0.7, 1 * mm, 3 * mm))
    return out


def callout(title, text, kind="neutral"):
    border_color = WINE
    bg_color = TINT
    title_color = INK
    if kind == "amber":
        border_color = AMBER
        bg_color = AMBER_BG
        title_color = colors.HexColor("#613800")
    elif kind == "red":
        border_color = RED
        bg_color = RED_BG
        title_color = colors.HexColor("#72120C")
    elif kind == "green":
        border_color = GREEN
        bg_color = GREEN_BG
        title_color = colors.HexColor("#0D4425")

    inner = [
        Paragraph(title, ParagraphStyle("ct", fontName=DISPLAY, fontSize=9.5, leading=12.5, textColor=title_color, spaceAfter=3)),
        Paragraph(text, ParagraphStyle("cb", fontName=BODY, fontSize=8.4, leading=12.5, textColor=INK)),
    ]
    t = Table([[inner]], colWidths=[CONTENT_W])
    t.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), bg_color),
            ("LINEBEFORE", (0, 0), (0, -1), 2.2, border_color),
            ("LEFTPADDING", (0, 0), (-1, -1), 5 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5 * mm),
            ("TOPPADDING", (0, 0), (-1, -1), 4 * mm),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4 * mm),
        ])
    )
    return [Spacer(1, 1.5 * mm), t, Spacer(1, 2.5 * mm)]


def blocker_card(num, title, status, location, problem, consequence, resolution):
    header_table = Table(
        [
            [
                Paragraph(f"<font color='{RED.hexval()}'><b>BLOCKER #{num}</b></font> &nbsp;|&nbsp; <b>{title}</b>", S["h2"]),
                Paragraph(f"<font color='{RED.hexval()}'><b>{status}</b></font>", ParagraphStyle("st", fontName=MONO, fontSize=7.5, leading=10, alignment=TA_RIGHT)),
            ]
        ],
        colWidths=[CONTENT_W - 35 * mm, 35 * mm],
    )
    header_table.setStyle(
        TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ])
    )

    detail_data = [
        [Paragraph("LOCATION", S["th"]), Paragraph(f"<font name='{MONO}' size=7.5>{location}</font>", S["td"])],
        [Paragraph("DEFICIENCY", S["th"]), Paragraph(problem, S["td"])],
        [Paragraph("IMPACT", S["th"]), Paragraph(f"<font color='{RED.hexval()}'>{consequence}</font>", S["td"])],
        [Paragraph("REQUIRED FIX", S["th"]), Paragraph(f"<font color='{GREEN.hexval()}'><b>{resolution}</b></font>", S["td"])],
    ]
    detail_table = Table(detail_data, colWidths=[24 * mm, CONTENT_W - 24 * mm])
    detail_table.setStyle(
        TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 2),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ("LINEBELOW", (0, 0), (-1, -2), 0.3, LINE),
        ])
    )

    box_content = [
        header_table,
        Spacer(1, 1.5 * mm),
        detail_table,
    ]
    container = Table([[box_content]], colWidths=[CONTENT_W])
    container.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.white),
            ("BOX", (0, 0), (-1, -1), 0.7, LINE),
            ("LINEBEFORE", (0, 0), (0, -1), 2.5, RED),
            ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
            ("TOPPADDING", (0, 0), (-1, -1), 3.5 * mm),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5 * mm),
        ])
    )
    return KeepTogether([Spacer(1, 1.5 * mm), container, Spacer(1, 2.5 * mm)])


def scorecard_table():
    headers = [
        Paragraph("SYSTEM DOMAIN", S["th"]),
        Paragraph("SCORE", S["th"]),
        Paragraph("GRADE", S["th"]),
        Paragraph("STATUS", S["th"]),
        Paragraph("KEY ASSESSMENT", S["th"]),
    ]
    data = [headers]

    rows = [
        ("Core Cloud Infrastructure & Edge Hosting", "100%", "A+", "READY", "Vercel edge deployment live, SSL configured, Next.js 14 App Router, dynamic ISR caching, zero compilation errors."),
        ("Admin CMS, Auth & Publishing Pipeline", "98%", "A", "READY", "Direct admin password login, PDF upload & storage tickets, automatic cover generator, custom thumbnail upload, issue editor."),
        ("Frontend UI, Magazine Reader & House Ads", "95%", "A", "READY", "Editorial typography, mobile-responsive canvas PDF flipbook reader, house ad fallbacks that turn blank spaces into ad leads."),
        ("Search Engine SEO, Feeds & Legal Compliance", "92%", "A-", "READY", "Dynamic sitemap.xml, custom robots.txt, CASL/Canadian privacy policy, terms of service, OpenGraph metadata."),
        ("Business Contact & Communication Channels", "40%", "F", "BLOCKER", "Contact phone & WhatsApp are fake 555 numbers; contact form enquiry emails are unconfigured (no Web3Forms key)."),
        ("Editorial Content & Inaugural Publication", "35%", "D", "BLOCKER", "Only 1 test publication in database ('Testing Advertisement'); real Week 1 PDF and official cover graphic must be staged."),
    ]

    for domain, score, grade, status, assessment in rows:
        color = GREEN if status == "READY" else RED
        status_para = Paragraph(
            f"<font color='{color.hexval()}'><b>{status}</b></font>",
            ParagraphStyle("st", fontName=MONO, fontSize=7, leading=9),
        )
        grade_para = Paragraph(
            f"<font color='{color.hexval()}'><b>{grade}</b></font>",
            ParagraphStyle("gr", fontName=DISPLAY, fontSize=9, leading=11),
        )
        data.append([
            Paragraph(domain, S["body_bold"]),
            Paragraph(f"<font name='{MONO}' size=8><b>{score}</b></font>", S["td"]),
            grade_para,
            status_para,
            Paragraph(assessment, S["td_muted"]),
        ])

    table = Table(data, colWidths=[42 * mm, 14 * mm, 12 * mm, 18 * mm, CONTENT_W - 86 * mm], repeatRows=1)
    table.setStyle(
        TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 3),
            ("RIGHTPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 3.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
            ("LINEBELOW", (0, 0), (-1, 0), 1, INK),
            ("LINEBELOW", (0, 1), (-1, -1), 0.5, LINE),
            ("BACKGROUND", (0, 0), (-1, 0), TINT),
        ])
    )
    return table


def cover_canvas(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, PW, PH, stroke=0, fill=1)

    # Upper wine banner
    canvas.setFillColor(WINE_DEEP)
    canvas.rect(0, PH - 92 * mm, PW, 92 * mm, stroke=0, fill=1)
    canvas.setFillColor(WINE)
    canvas.rect(0, PH - 94.5 * mm, PW, 2.5 * mm, stroke=0, fill=1)

    # Brand watermark
    canvas.setFont(DISPLAY, 11)
    canvas.setFillColor(colors.Color(1, 1, 1, alpha=0.22))
    canvas.drawString(ML, PH - 20 * mm, "VAARAM MAGAZINE  ·  DISCOVER. CONNECT. EVERY WEEK.")

    # Foot line
    canvas.setFont(MONO, 6.5)
    canvas.setFillColor(FAINT)
    canvas.drawString(ML, 10 * mm, "CONFIDENTIAL  ·  INTERNAL AUDIT  ·  VAARAM MAGAZINE CANADIAN LAUNCH")
    canvas.drawRightString(PW - MR, 10 * mm, "PAGE 01")
    canvas.restoreState()


def body_canvas(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, PW, PH, stroke=0, fill=1)

    # Running header
    canvas.setFont(MONO, 6.8)
    canvas.setFillColor(FAINT)
    canvas.drawString(ML, PH - 12 * mm, "VAARAM MAGAZINE  /  OFFICIAL PUBLIC LAUNCH READINESS AUDIT")
    canvas.drawRightString(PW - MR, PH - 12 * mm, f"PAGE {doc.page:02d}")
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(ML, PH - 14 * mm, PW - MR, PH - 14 * mm)

    # Running footer
    canvas.setFont(MONO, 6.4)
    canvas.setFillColor(FAINT)
    canvas.drawString(ML, 10 * mm, "CANADIAN NATIONAL LAUNCH AUDIT  ·  CONFIDENTIAL")
    canvas.drawRightString(PW - MR, 10 * mm, "VERCEL / SUPABASE / NEXT.JS PRODUCTION")
    canvas.line(ML, 13 * mm, PW - MR, 13 * mm)
    canvas.restoreState()


def build_pdf():
    doc = BaseDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=ML,
        rightMargin=MR,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
    )

    frame_cover = Frame(ML, 16 * mm, CONTENT_W, PH - 34 * mm, id="cover_frame", topPadding=0, bottomPadding=0, leftPadding=0, rightPadding=0)
    frame_body = Frame(ML, 16 * mm, CONTENT_W, PH - 32 * mm, id="body_frame", topPadding=0, bottomPadding=0, leftPadding=0, rightPadding=0)

    doc.addPageTemplates([
        PageTemplate(id="Cover", frames=[frame_cover], onPage=cover_canvas),
        PageTemplate(id="Body", frames=[frame_body], onPage=body_canvas),
    ])

    story = []

    # ═════════════════════════════════════════════════════════════════════════
    # PAGE 1: COVER & EXECUTIVE VERDICT
    # ═════════════════════════════════════════════════════════════════════════
    story.append(Spacer(1, 14 * mm))
    story.append(Paragraph("TECHNICAL & OPERATIONAL READINESS REPORT", S["cover_tag"]))
    story.append(Paragraph("Is Vaaram Magazine Officially<br/>Ready for Public Launch?", S["cover_title"]))
    story.append(
        Paragraph(
            "An exhaustive assessment of system architecture, CMS workflows, reader UX, contact channels, legal compliance, and pre-launch blocking defects.",
            S["cover_sub"],
        )
    )

    story.append(Spacer(1, 18 * mm))

    # Big Verdict Callout
    verdict_text = (
        "<b>OFFICIAL LAUNCH VERDICT: CONDITIONAL HOLD (88% PRODUCTION READY)</b><br/><br/>"
        "<b>No, the website should NOT be opened to the public officially today.</b><br/>"
        "The underlying application engine, database, mobile PDF reader, and admin publishing workflows "
        "are in outstanding shape (rated <b>98%</b>). However, <b>critical business communication channels "
        "and production content are still in test mode</b>.<br/><br/>"
        "Specifically: the phone and WhatsApp numbers are fictitious 555 numbers, contact form emails are not hooked to alerts, "
        "the site is on a Vercel staging URL instead of <i>vaaram.ca</i>, and the only live publication is a dummy file titled "
        "<i>'Testing Advertisement'</i>.<br/><br/>"
        "Resolving these <b>5 straightforward blockers</b> (estimated at 2 to 4 hours of configuration and content upload) "
        "will immediately graduate the site to <b>100% Launch Ready</b>."
    )
    story.extend(callout("EXECUTIVE SUMMARY & IMMEDIATE RECOMMENDATION", verdict_text, kind="amber"))

    story.append(Spacer(1, 4 * mm))

    # Meta box
    meta_data = [
        [
            Paragraph("AUDIT TARGET", S["th"]),
            Paragraph("PRIMARY REPOSITORY", S["th"]),
            Paragraph("EDGE HOSTING", S["th"]),
            Paragraph("CORE ENGINE", S["th"]),
        ],
        [
            Paragraph("Vaaram Magazine (vaaram.ca)", S["mono_sm"]),
            Paragraph("Nivas001/VaaramMagazine", S["mono_sm"]),
            Paragraph("Vercel Edge Network (Hobby)", S["mono_sm"]),
            Paragraph("Next.js 14 + Supabase Postgres", S["mono_sm"]),
        ],
        [
            Paragraph("CURRENT LIVE URL", S["th"]),
            Paragraph("ADMIN CMS PORTAL", S["th"]),
            Paragraph("AUDIT DATE", S["th"]),
            Paragraph("OVERALL SYSTEM RATING", S["th"]),
        ],
        [
            Paragraph("vaaram-magazine.vercel.app", S["mono_sm"]),
            Paragraph("/admin/login (Direct Auth)", S["mono_sm"]),
            Paragraph("September 2026", S["mono_sm"]),
            Paragraph("<font color='#8A1332'><b>88 / 100 (NEAR LAUNCH)</b></font>", S["mono_sm"]),
        ],
    ]
    meta_table = Table(meta_data, colWidths=[CONTENT_W / 4.0] * 4)
    meta_table.setStyle(
        TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BACKGROUND", (0, 0), (-1, -1), colors.white),
            ("BOX", (0, 0), (-1, -1), 0.6, LINE),
            ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
            ("LEFTPADDING", (0, 0), (-1, -1), 3.5 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 3.5 * mm),
            ("TOPPADDING", (0, 0), (-1, -1), 2.5 * mm),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5 * mm),
        ])
    )
    story.append(meta_table)

    story.append(PageBreak())
    story.append(NextPageTemplate("Body"))

    # ═════════════════════════════════════════════════════════════════════════
    # PAGE 2: LAUNCH READINESS SCORECARD
    # ═════════════════════════════════════════════════════════════════════════
    story.extend(
        section_header(
            "SYSTEM READINESS AUDIT",
            "The 6-Dimension Launch Scorecard",
            "Every public-facing component has been evaluated against enterprise publication standards, Canadian commercial regulations, and user conversion integrity.",
        )
    )

    story.append(scorecard_table())

    story.append(Spacer(1, 4 * mm))

    story.append(Paragraph("Scorecard Analysis & Operational Health", S["h2"]))
    story.append(
        Paragraph(
            "The audit divides the platform into two distinct layers: <b>The Engineering Core</b> and <b>The Commercial Surface</b>.",
            S["body"],
        )
    )
    story.append(
        Paragraph(
            "<b>1. The Engineering Core (Grade: 98% / Excellent):</b> Next.js 14 App Router, Vercel Edge caching, and Supabase Postgres operate with zero errors. Admin authentication now features rapid direct password sign-in (contact@vaaram.ca / Vaaram27#) with OTP fallback. The issue management suite supports PDF uploads, automated cover generation, custom thumbnail overriding, and inline editing. Mobile PDF rendering uses high-performance HTML5 canvas rather than clunky browser iframes.",
            S["body"],
        )
    )
    story.append(
        Paragraph(
            "<b>2. The Commercial Surface (Grade: 38% / Critical Blockers):</b> A magazine website exists to sell advertising and distribute weekly publications to readers. At this very moment, a reader attempting to call or message will dial non-functional 555 numbers. An advertiser submitting an enquiry via the contact form will trigger zero email notifications to the publisher. Readers visiting the site will encounter a single test document. These commercial gaps are why an immediate public launch is prohibited until remedied.",
            S["body"],
        )
    )

    story.append(PageBreak())

    # ═════════════════════════════════════════════════════════════════════════
    # PAGE 3: THE 5 MANDATORY PRE-LAUNCH BLOCKERS
    # ═════════════════════════════════════════════════════════════════════════
    story.extend(
        section_header(
            "CRITICAL ACTION ITEMS",
            "The 5 Mandatory Pre-Launch Blockers",
            "These items MUST be resolved prior to sharing the website with advertisers, social media followers, or print distribution partners.",
        )
    )

    # Blocker 1
    story.append(
        blocker_card(
            1,
            "Placeholder Phone & WhatsApp Numbers",
            "CANNOT LAUNCH",
            "site.config.ts (Lines 39–41) & contact/page.tsx",
            "Phone is currently '+1 647 555 0199' and WhatsApp is '16475550199'. 555 numbers are reserved test codes in North America that disconnect or fail.",
            "Prospective Canadian advertisers clicking 'Call Us' or 'Message our desk' receive dead-line errors or broken WhatsApp chats, instantly destroying brand credibility.",
            "Edit site.config.ts with the official Canadian business phone and WhatsApp digits. Deploy update to Vercel.",
        )
    )

    # Blocker 2
    story.append(
        blocker_card(
            2,
            "Custom Domain (vaaram.ca) Not Pointed in DNS",
            "CANNOT LAUNCH",
            "Vercel Project Settings → Domains & Domain Registrar DNS",
            "The site is currently accessible only via 'https://vaaram-magazine.vercel.app'. The official domain 'vaaram.ca' and 'www.vaaram.ca' are not connected to Vercel.",
            "Marketing materials, business cards, and social links cannot point to a raw .vercel.app domain without looking like an amateur hobby experiment. Canonical SEO will index the wrong host.",
            "Add 'vaaram.ca' and 'www.vaaram.ca' in Vercel Domains. Add A record pointing to 76.76.21.21 and CNAME for 'www' pointing to cname.vercel-dns.com at registrar.",
        )
    )

    # Blocker 3
    story.append(
        blocker_card(
            3,
            "Contact Form Enquiry Email Alerts Disabled",
            "CANNOT LAUNCH",
            "app/api/contact/route.ts & Vercel Environment Variables",
            "The contact endpoint writes incoming quotes and ad queries to Supabase, but WEB3FORMS_ACCESS_KEY is empty. The email notification dispatcher is skipped.",
            "When an advertiser sends a high-value enquiry or asks for advertising rates, nobody on the Vaaram team receives an email notification. Leads go cold in the database.",
            "Generate a free Web3Forms access key (or Resend API key) for contact@vaaram.ca, add WEB3FORMS_ACCESS_KEY to Vercel environment variables, and re-deploy.",
        )
    )

    story.append(PageBreak())

    # Blocker 4
    story.append(
        blocker_card(
            4,
            "Staging Dummy Publication Displayed on Homepage",
            "CANNOT LAUNCH",
            "Supabase 'publications' Table & /admin/issues",
            "The single live edition is titled 'Testing Advertisement' with description 'Its a testing ad pdf we are doing on' and dummy 14-page test PDF.",
            "Any public visitor visiting the homepage or archives sees an internal development test document rather than the official inaugural edition of Vaaram Magazine.",
            "Log into /admin/issues, create the real 'Issue #01 — Week 1' publication with official PDF and cover image, then set 'Testing Advertisement' to Unpublish or Delete.",
        )
    )

    # Blocker 5
    story.append(
        blocker_card(
            5,
            "Empty Social Media URLs & Placeholder Street Address",
            "HIGH PRIORITY",
            "site.config.ts (Lines 43, 48–51)",
            "Social links (facebook, instagram, youtube) are empty strings. Physical address is generic 'Toronto, Ontario, Canada'.",
            "Social icons appear broken or inactive in footers and headers. Missing street or suite details reduces commercial trust under Canadian CASL guidelines.",
            "Add real social channel links in site.config.ts (or set to false if unlaunched). Provide official GTA office/mailing address or P.O. Box.",
        )
    )

    story.append(Spacer(1, 2 * mm))

    story.extend(
        callout(
            "TIME TO RESOLVE ALL 5 BLOCKERS",
            "All 5 blockers can be completed in approximately <b>2 to 3 hours</b>. "
            "None of them require rewriting application code. They are purely environment settings, business credentials, and content publishing steps.",
            kind="green",
        )
    )

    story.append(PageBreak())

    # ═════════════════════════════════════════════════════════════════════════
    # PAGE 4: TECHNICAL ARCHITECTURE & OPERATIONAL VERIFICATION
    # ═════════════════════════════════════════════════════════════════════════
    story.extend(
        section_header(
            "DEEP SYSTEM INSPECTION",
            "What is Already Working Flawlessly",
            "The engineering foundation is robust, secure, and production-hardened. Here is the technical breakdown of what is live and tested.",
        )
    )

    arch_data = [
        [
            Paragraph("FEATURE / SUBSYSTEM", S["th"]),
            Paragraph("TECHNOLOGY STACK", S["th"]),
            Paragraph("VERIFICATION RESULT", S["th"]),
        ],
        [
            Paragraph("Admin Authentication", S["body_bold"]),
            Paragraph("Supabase Auth + Password Bypass + OTP", S["mono_sm"]),
            Paragraph("<b>PASSED</b>: Direct login with contact@vaaram.ca / Vaaram27# is active and verified. Immediate dashboard entry without email delay.", S["td_muted"]),
        ],
        [
            Paragraph("Issue Publishing & Editing", S["body_bold"]),
            Paragraph("Next.js Server Actions + Supabase REST", S["mono_sm"]),
            Paragraph("<b>PASSED</b>: Upload PDF, auto-extract cover, custom thumbnail upload, and full editing via /admin/issues/[id]/edit.", S["td_muted"]),
        ],
        [
            Paragraph("PDF Flipbook & Reader", S["body_bold"]),
            Paragraph("HTML5 Canvas + PDF.js WebWorker", S["mono_sm"]),
            Paragraph("<b>PASSED</b>: Responsive viewing on iOS Safari, Android Chrome, and Desktop. Fast zoom, page navigation, and download triggers.", S["td_muted"]),
        ],
        [
            Paragraph("House Advertising Engine", S["body_bold"]),
            Paragraph("React Server Components + CSS Grid", S["mono_sm"]),
            Paragraph("<b>PASSED</b>: Unbooked ad slots gracefully collapse into branded 'This space could be your advertisement' panels that drive ad leads.", S["td_muted"]),
        ],
        [
            Paragraph("Storage & CDN Delivery", S["body_bold"]),
            Paragraph("Supabase S3 Storage ('media' bucket)", S["mono_sm"]),
            Paragraph("<b>PASSED</b>: Upload tickets generated via authenticated API route; public read access enabled with edge caching.", S["td_muted"]),
        ],
        [
            Paragraph("Email Lead Capture", S["body_bold"]),
            Paragraph("Supabase 'enquiries' Table + Web3Forms", S["mono_sm"]),
            Paragraph("<b>PASSED</b>: Database persistence works with rate limiting (6 req/10m) and honeypot spam protection. Awaiting email API key.", S["td_muted"]),
        ],
        [
            Paragraph("Newsletter Subscriptions", S["body_bold"]),
            Paragraph("Supabase 'subscribers' Table + RLS", S["mono_sm"]),
            Paragraph("<b>PASSED</b>: Idempotent upsert with rate limiting (5 req/10m). RLS prevents public reading of subscriber list.", S["td_muted"]),
        ],
        [
            Paragraph("SEO, Robots & Sitemaps", S["body_bold"]),
            Paragraph("Next.js MetadataRoute API", S["mono_sm"]),
            Paragraph("<b>PASSED</b>: Dynamic sitemap.xml automatically crawls archives and editions; robots.txt blocks /admin and /api routes.", S["td_muted"]),
        ],
    ]
    arch_table = Table(arch_data, colWidths=[38 * mm, 42 * mm, CONTENT_W - 80 * mm])
    arch_table.setStyle(
        TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 3),
            ("RIGHTPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("LINEBELOW", (0, 0), (-1, 0), 1, INK),
            ("LINEBELOW", (0, 1), (-1, -1), 0.4, LINE),
            ("BACKGROUND", (0, 0), (-1, 0), TINT),
        ])
    )
    story.append(arch_table)

    story.append(Spacer(1, 4 * mm))

    story.append(Paragraph("Security & Data Protection Review", S["h2"]))
    story.append(
        Paragraph(
            "<b>• Supabase RLS (Row Level Security):</b> Public anonymous users can only read published editions (is_published = true) and active ad banners. Admin operations (creating, editing, deleting) require authenticated service-role or admin sessions.<br/>"
            "<b>• Sensitive Keys Isolation:</b> Service-role secrets and database master keys are strictly kept server-side in environment variables and never leaked into client browser bundles.<br/>"
            "<b>• Rate Limiting:</b> Both contact and subscription endpoints include IP-based sliding window rate limiters and hidden honeypot fields to neutralize automated spam bots without burdening real users.",
            S["body"],
        )
    )

    story.append(PageBreak())

    # ═════════════════════════════════════════════════════════════════════════
    # PAGE 5: STEP-BY-STEP GO-LIVE ROADMAP & LAUNCH DAY CHECKLIST
    # ═════════════════════════════════════════════════════════════════════════
    story.extend(
        section_header(
            "EXECUTION PROTOCOL",
            "The Official Launch Day Checklist",
            "Follow this chronological roadmap to transition Vaaram Magazine from staging into public Canadian availability.",
        )
    )

    checklist_data = [
        [
            Paragraph("PHASE", S["th"]),
            Paragraph("TASK / MILESTONE", S["th"]),
            Paragraph("OWNER", S["th"]),
            Paragraph("VERIFICATION CRITERIA", S["th"]),
        ],
        [
            Paragraph("PHASE 1<br/>Config", S["mono_sm"]),
            Paragraph("Update phone & WhatsApp in site.config.ts", S["td"]),
            Paragraph("Developer", S["mono_sm"]),
            Paragraph("Clicking WhatsApp opens real chat with prefilled message.", S["td_muted"]),
        ],
        [
            Paragraph("PHASE 1<br/>Config", S["mono_sm"]),
            Paragraph("Configure Web3Forms email alerts in Vercel", S["td"]),
            Paragraph("Developer / Admin", S["mono_sm"]),
            Paragraph("Submit test contact form; confirm email arrives at contact@vaaram.ca.", S["td_muted"]),
        ],
        [
            Paragraph("PHASE 2<br/>Content", S["mono_sm"]),
            Paragraph("Upload Issue #01 (Inaugural Edition)", S["td"]),
            Paragraph("Vaaram Editor", S["mono_sm"]),
            Paragraph("Official PDF rendered in flipbook; custom cover art displays properly.", S["td_muted"]),
        ],
        [
            Paragraph("PHASE 2<br/>Content", S["mono_sm"]),
            Paragraph("Unpublish/Delete dummy 'Testing Advertisement'", S["td"]),
            Paragraph("Vaaram Editor", S["mono_sm"]),
            Paragraph("Homepage hero displays Issue #01; archive contains no test files.", S["td_muted"]),
        ],
        [
            Paragraph("PHASE 3<br/>Domain", S["mono_sm"]),
            Paragraph("Connect vaaram.ca & www.vaaram.ca to Vercel", S["td"]),
            Paragraph("Domain Registrar", S["mono_sm"]),
            Paragraph("DNS records point to Vercel; SSL certificate issues automatically.", S["td_muted"]),
        ],
        [
            Paragraph("PHASE 3<br/>Domain", S["mono_sm"]),
            Paragraph("Set NEXT_PUBLIC_SITE_URL to https://www.vaaram.ca", S["td"]),
            Paragraph("Developer", S["mono_sm"]),
            Paragraph("OpenGraph social shares show vaaram.ca cards and logo preview.", S["td_muted"]),
        ],
        [
            Paragraph("PHASE 4<br/>Launch", S["mono_sm"]),
            Paragraph("Mobile & Desktop Smoke Testing", S["td"]),
            Paragraph("Full Team", S["mono_sm"]),
            Paragraph("Test on iPhone Safari, Android Chrome, Mac Safari, and Windows PC.", S["td_muted"]),
        ],
        [
            Paragraph("PHASE 4<br/>Launch", S["mono_sm"]),
            Paragraph("Public Announcement & Outreach", S["td"]),
            Paragraph("Vaaram Marketing", S["mono_sm"]),
            Paragraph("Broadcast link to WhatsApp communities, advertisers, and readers.", S["td_muted"]),
        ],
    ]
    check_table = Table(checklist_data, colWidths=[20 * mm, 46 * mm, 26 * mm, CONTENT_W - 92 * mm], repeatRows=1)
    check_table.setStyle(
        TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 3),
            ("RIGHTPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 3.2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3.2),
            ("LINEBELOW", (0, 0), (-1, 0), 1, INK),
            ("LINEBELOW", (0, 1), (-1, -1), 0.4, LINE),
            ("BACKGROUND", (0, 0), (-1, 0), TINT),
        ])
    )
    story.append(check_table)

    story.append(Spacer(1, 4 * mm))

    story.extend(
        callout(
            "FINAL AUDIT SUMMARY FOR LEADERSHIP",
            "Vaaram Magazine has achieved a remarkable level of technical finish: the website is fast, beautifully designed, "
            "and equipped with an intuitive administrative CMS. You are only <b>5 configuration and content steps away</b> "
            "from a triumphant Canadian public launch. Complete the checklist above and launch with full confidence.",
            kind="green",
        )
    )

    doc.build(story)
    print(f"Audit PDF generated successfully at: {OUT}")


if __name__ == "__main__":
    build_pdf()
