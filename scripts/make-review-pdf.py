#!/usr/bin/env python3
"""
─────────────────────────────────────────────────────────────────────────────
 VAARAM MAGAZINE — DESIGN & BUILD REVIEW (PDF)

 Renders an honest, graded design/UX/front-end critique of the website into
 VAARAM-DESIGN-REVIEW.pdf.

 Run:  python3 scripts/make-review-pdf.py
─────────────────────────────────────────────────────────────────────────────
"""
import pathlib

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, CondPageBreak, Frame,
                                KeepTogether, NextPageTemplate, PageBreak,
                                PageTemplate, Paragraph, Spacer, Table,
                                TableStyle)

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "VAARAM-DESIGN-REVIEW.pdf"

# ── Fonts ────────────────────────────────────────────────────────────────
# A heavy grotesque for display (echoing the site's own new heading face),
# a warm serif for reading, and a mono for labels and figures.
def _register():
    try:
        pdfmetrics.registerFont(TTFont("Display", "/System/Library/Fonts/Avenir Next.ttc", subfontIndex=8))
        pdfmetrics.registerFont(TTFont("DisplayMd", "/System/Library/Fonts/Avenir Next.ttc", subfontIndex=2))
        disp, dispmd = "Display", "DisplayMd"
    except Exception:
        disp, dispmd = "Helvetica-Bold", "Helvetica-Bold"
    try:
        SUP = "/System/Library/Fonts/Supplemental/"
        pdfmetrics.registerFont(TTFont("Body", SUP + "Georgia.ttf"))
        pdfmetrics.registerFont(TTFont("Body-Bold", SUP + "Georgia Bold.ttf"))
        pdfmetrics.registerFont(TTFont("Body-Italic", SUP + "Georgia Italic.ttf"))
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


DISPLAY, DISPLAY_MD, BODY, BODY_B, MONO = _register()

# ── Palette, taken from the site it reviews ──────────────────────────────
WINE = colors.HexColor("#8A1332")
WINE_DEEP = colors.HexColor("#5E0C22")
ROSE = colors.HexColor("#B07A5C")
ROSE_PALE = colors.HexColor("#E0B29B")
INK = colors.HexColor("#1A1418")
MUTED = colors.HexColor("#5C5158")
FAINT = colors.HexColor("#8B8188")
LINE = colors.HexColor("#E0D9D4")
PAPER = colors.HexColor("#FAF8F4")
TINT = colors.HexColor("#F3EEE9")
# Grades stay off-brand on purpose, so "good" never reads as "branded".
GREEN = colors.HexColor("#2F6B4F")
AMBER = colors.HexColor("#8A6410")
RED = colors.HexColor("#9E3524")

PW, PH = A4
ML, MR = 19 * mm, 19 * mm
CONTENT_W = PW - ML - MR

# ── Styles ───────────────────────────────────────────────────────────────
S = {
    "h2": ParagraphStyle("h2", fontName=DISPLAY, fontSize=17, leading=20.5,
                         textColor=INK, spaceBefore=0, spaceAfter=7),
    "h3": ParagraphStyle("h3", fontName=DISPLAY_MD, fontSize=11.5, leading=15,
                         textColor=INK, spaceBefore=11, spaceAfter=4),
    "eyebrow": ParagraphStyle("eyebrow", fontName=MONO, fontSize=7.2, leading=10,
                              textColor=ROSE, spaceAfter=4),
    "body": ParagraphStyle("body", fontName=BODY, fontSize=9.3, leading=14.4,
                           textColor=MUTED, spaceAfter=7),
    "body_ink": ParagraphStyle("body_ink", fontName=BODY, fontSize=9.3, leading=14.4,
                               textColor=INK, spaceAfter=7),
    "lede": ParagraphStyle("lede", fontName=BODY, fontSize=10.4, leading=16,
                           textColor=INK, spaceAfter=9),
    "small": ParagraphStyle("small", fontName=BODY, fontSize=8.4, leading=12.6,
                            textColor=MUTED, spaceAfter=4),
    "label": ParagraphStyle("label", fontName=MONO, fontSize=6.8, leading=9,
                            textColor=FAINT, spaceAfter=2),
    "bullet": ParagraphStyle("bullet", fontName=BODY, fontSize=9, leading=13.6,
                             textColor=MUTED, leftIndent=9, bulletIndent=1,
                             spaceAfter=3.5),
    "th": ParagraphStyle("th", fontName=MONO, fontSize=6.8, leading=9, textColor=FAINT),
    "td": ParagraphStyle("td", fontName=BODY, fontSize=8.6, leading=12.4, textColor=INK),
    "td_muted": ParagraphStyle("td_muted", fontName=BODY, fontSize=8.4, leading=12.2,
                               textColor=MUTED),
    "score_name": ParagraphStyle("score_name", fontName=DISPLAY_MD, fontSize=10,
                                 leading=13, textColor=INK),
    "verdict": ParagraphStyle("verdict", fontName=BODY, fontSize=8.6, leading=12.4,
                              textColor=MUTED),
}


def grade_colour(score):
    if score >= 8.5:
        return GREEN
    if score >= 7:
        return colors.HexColor("#4A6B2F")
    if score >= 6:
        return AMBER
    return RED


def band(score):
    if score >= 9:
        return "Exceptional"
    if score >= 8:
        return "Strong"
    if score >= 7:
        return "Good"
    if score >= 6:
        return "Adequate"
    if score >= 4:
        return "Weak"
    return "Unfit"


# ── Reusable blocks ──────────────────────────────────────────────────────
def rule(colour=LINE, thickness=0.6, space_before=0, space_after=0, width=None):
    t = Table([[""]], colWidths=[width or CONTENT_W], rowHeights=[thickness])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colour),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    out = []
    if space_before:
        out.append(Spacer(1, space_before))
    out.append(t)
    if space_after:
        out.append(Spacer(1, space_after))
    return out


def section(number, title, lede=None):
    """A numbered section head: mono index, heavy title, optional standfirst."""
    head = Table(
        [[Paragraph(number, ParagraphStyle("n", fontName=MONO, fontSize=7.2,
                                           leading=9, textColor=WINE)),
          Paragraph(title, S["h2"])]],
        colWidths=[13 * mm, CONTENT_W - 13 * mm])
    head.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (0, 0), 4),
        ("TOPPADDING", (1, 0), (1, 0), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    out = [Spacer(1, 3 * mm), *rule(INK, 1.1, space_after=3.2 * mm), head]
    if lede:
        out.append(Spacer(1, 1.5 * mm))
        out.append(Paragraph(lede, S["lede"]))
    return out


def bar(score, width=34 * mm):
    """A filled proportion bar. Off-brand colour so it reads as a measure."""
    filled = max(0.06, score / 10.0) * width
    t = Table([[""], ], colWidths=[filled], rowHeights=[2.6])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), grade_colour(score)),
                           ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                           ("TOPPADDING", (0, 0), (-1, -1), 0),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    track = Table([[t]], colWidths=[width], rowHeights=[2.6])
    track.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), TINT),
                               ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                               ("LEFTPADDING", (0, 0), (-1, -1), 0),
                               ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                               ("TOPPADDING", (0, 0), (-1, -1), 0),
                               ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    return track


def review(name, score, works, weak, lift):
    """One graded item: title + mark, then what works, what doesn't, and the lift."""
    mark = Paragraph(
        f"{score:g}<font size=8 color='#8B8188'>/10</font>",
        ParagraphStyle("mark", fontName=DISPLAY, fontSize=17, leading=18,
                       textColor=grade_colour(score), alignment=TA_RIGHT))
    head = Table(
        [[Paragraph(name, S["score_name"]), mark],
         [bar(score), Paragraph(band(score).upper(),
                                ParagraphStyle("bd", fontName=MONO, fontSize=6.6,
                                               leading=9, textColor=FAINT,
                                               alignment=TA_RIGHT))]],
        colWidths=[CONTENT_W - 26 * mm, 26 * mm])
    head.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, 0), "TOP"),
        ("VALIGN", (0, 1), (-1, 1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, 0), 0),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 2),
        ("TOPPADDING", (0, 1), (-1, 1), 1),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 0),
    ]))

    rows = [
        [Paragraph("WORKS", S["label"]), Paragraph(works, S["verdict"])],
        [Paragraph("DOESN'T", S["label"]), Paragraph(weak, S["verdict"])],
        [Paragraph("TO LIFT IT", S["label"]),
         Paragraph(f"<font color='#8A1332'>{lift}</font>", S["verdict"])],
    ]
    detail = Table(rows, colWidths=[18 * mm, CONTENT_W - 18 * mm])
    detail.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 2.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
    ]))

    return KeepTogether([
        Spacer(1, 3.4 * mm),
        *rule(LINE, 0.6, space_after=2.2 * mm),
        head,
        Spacer(1, 1.4 * mm),
        detail,
    ])


def bullets(items, style="bullet"):
    return [Paragraph(f"<bullet>&bull;</bullet>{t}", S[style]) for t in items]


def callout(title, text):
    inner = [
        Paragraph(title, ParagraphStyle("ct", fontName=DISPLAY_MD, fontSize=9.2,
                                        leading=12.5, textColor=INK, spaceAfter=3)),
        Paragraph(text, ParagraphStyle("cb", fontName=BODY, fontSize=8.7,
                                       leading=13, textColor=MUTED)),
    ]
    t = Table([[inner]], colWidths=[CONTENT_W])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), TINT),
        ("LINEBEFORE", (0, 0), (0, -1), 1.6, WINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 7 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 5 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5 * mm),
    ]))
    return [Spacer(1, 2.5 * mm), t, Spacer(1, 2.5 * mm)]


def summary_table(rows, first_col="Item"):
    data = [[Paragraph(first_col.upper(), S["th"]),
             Paragraph("MARK", S["th"]),
             Paragraph("BAND", S["th"]),
             Paragraph("ONE-LINE VERDICT", S["th"])]]
    for name, score, verdict in rows:
        data.append([
            Paragraph(name, S["td"]),
            Paragraph(f"<font name='{MONO}' color='{grade_colour(score).hexval()[2:]}'>"
                      f"{score:g}</font>".replace("color='", "color='#"),
                      ParagraphStyle("m", fontName=MONO, fontSize=9, leading=12,
                                     textColor=grade_colour(score))),
            Paragraph(band(score), S["td_muted"]),
            Paragraph(verdict, S["td_muted"]),
        ])
    t = Table(data, colWidths=[42 * mm, 12 * mm, 20 * mm, CONTENT_W - 74 * mm],
              repeatRows=1)
    style = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, 0), 0.9, INK),
        ("LINEBELOW", (0, 1), (-1, -1), 0.5, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4.2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4.2),
    ]
    t.setStyle(TableStyle(style))
    return t


# ── Page furniture ───────────────────────────────────────────────────────
def cover_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, PW, PH, stroke=0, fill=1)
    # Wine field across the upper two-thirds.
    canvas.setFillColor(colors.HexColor("#15090F"))
    canvas.rect(0, PH - 176 * mm, PW, 176 * mm, stroke=0, fill=1)
    canvas.setFillColor(WINE)
    canvas.rect(0, PH - 176 * mm, PW, 3.2 * mm, stroke=0, fill=1)
    # Fine column rules, the way a page is ruled before anything is set.
    canvas.setStrokeColor(colors.Color(1, 1, 1, alpha=0.07))
    canvas.setLineWidth(0.5)
    for i in range(1, 6):
        x = PW * i / 6
        canvas.line(x, PH - 176 * mm, x, PH)
    canvas.restoreState()


def body_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, PW, PH, stroke=0, fill=1)
    # Running head
    canvas.setFont(MONO, 6.8)
    canvas.setFillColor(FAINT)
    canvas.drawString(ML, PH - 13 * mm, "VAARAM MAGAZINE  /  DESIGN & BUILD REVIEW")
    canvas.drawRightString(PW - MR, PH - 13 * mm, f"{doc.page:02d}")
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.6)
    canvas.line(ML, PH - 15.4 * mm, PW - MR, PH - 15.4 * mm)
    # Foot
    canvas.setFont(MONO, 6.4)
    canvas.setFillColor(colors.HexColor("#A9A0A6"))
    canvas.drawString(ML, 11 * mm, "9 SEPTEMBER 2026")
    canvas.drawRightString(PW - MR, 11 * mm, "HONEST MARKS — NOT A SALES DOCUMENT")
    canvas.restoreState()


# ═════════════════════════════════════════════════════════════════════════
#  CONTENT
# ═════════════════════════════════════════════════════════════════════════
PAGE_MARKS = [
    ("Home", 8.5,
     "The hero finally reads as a masthead rather than a landing page: ruled issue line, live badge, the tagline set as the headline, and the week's cover standing in front of the two before it — which says “weekly” without a sentence claiming it. Rhythm between bands is consistent and the contents index is the right structure for a publication.",
     "It is a tall page. The hero alone is <i>min-height 900px</i> with a masthead rule, badge, headline, paragraph, two buttons, a spec strip and a contents rail inside it — on a 1440×800 laptop the cover and the contents rail never share the screen. Four advertisement slots plus the footer unit means five paid positions on one page; until they are booked, that is five near-identical “this space could be yours” panels in a row.",
     "Trim two elements out of the hero (the spec strip belongs with the edition record below it), and cap unbooked house panels at two per page — let the rest collapse."),

    ("Archives", 8.0,
     "Three genuinely different ways in — covers, a scannable list, a calendar — and the header counts editions, years and pages from the rows that exist rather than asserting a number. Search is instant because it never leaves the browser.",
     "That last strength is also the ceiling: every edition is shipped to the client and filtered there. At 18 editions it is instant; at 500 it is a slow page and a large payload. The calendar is charming at one year and unusable at five — there is no year-at-a-glance layer above it.",
     "Move search server-side past ~150 editions, and give the calendar a year index before the archive outgrows it."),

    ("Edition reader", 6.5,
     "The engineering underneath is the best on the site: canvas rasterisation rather than an iframe (the only way this looks right on mobile Safari), the worker self-hosted so a blocked CDN cannot break reading, one page rendered at a time with the next prefetched, and a proper large paging bar for phones.",
     "The navigation is thin for a magazine. There is no way to jump to a page — the counter is text, not an input — no thumbnail rail, no continuous scroll, and no search inside the PDF. Reaching page 40 of a 60-page edition means forty presses. This is the page a reader spends nearly all their time on, and it is the weakest thing on the public site.",
     "Add a page-number input, a thumbnail strip, and text search. That alone moves this to 8.5 and lifts the whole product."),

    ("About", 8.0,
     "The argument is well made and honestly written — “a magazine made entirely of advertisements, on purpose” is the right framing and the five-step process is concrete. The three drawings under the opening statement carry real information rather than decorating it.",
     "The two 3D scenes are the heaviest thing on the site and only desktop visitors above 900px ever see them; below that a static fallback does the same job at a fraction of the cost, which rather makes the case that the 3D is optional. The scenes also have no described alternative for a screen reader.",
     "Either commit to the 3D and describe it properly for assistive tech, or retire it and keep the fallback everywhere."),

    ("Contact", 8.5,
     "The best-converting page here. Direct details first, form second, FAQ third — exactly the order a nervous first-time advertiser needs. The form asks for the minimum, validates natively then again on the server, and the FAQ is published as structured data so search engines can quote it.",
     "There is no indication of price anywhere, and the FAQ says so deliberately — defensible, but it means every enquiry starts with a quote request. No file upload either, so an advertiser with artwork ready still has to wait for a reply before sending it.",
     "Add a starting-from price band and an optional artwork upload; both remove a round trip from every single enquiry."),

    ("Privacy & Terms", 7.5,
     "Written in plain English by someone who understood the obligation rather than pasted from a generator, and updated honestly when the email list was added — including the unusual and correct detail that an unsubscribed address is kept switched-off rather than deleted, so an import cannot resurrect it.",
     "Visually the weakest pages — a single column of headings and paragraphs with no structure to scan. A reader looking for one specific answer has to read the whole thing.",
     "Give them the same section-index treatment the About page uses; legal pages are read by search, not by cover-to-cover reading."),

    ("404, error & loading", 8.0,
     "The 404 does the rare useful thing: it names the three places a lost visitor probably wanted and links them, rather than apologising. The error boundary never shows the raw error and offers a real next step. The loading state deliberately avoids a wrong-shaped skeleton.",
     "The error page's reference digest is shown to a reader who has nowhere to send it — there is no support address next to it.",
     "Put the contact email beside the digest, or drop the digest from the visible page."),

    ("Admin — dashboard", 7.0,
     "Answers the only five questions a publisher has, above the fold, and the quick actions go where the work actually is. The setup warning about storage is genuinely helpful rather than nagging.",
     "Counters are lifetime totals, so “1,240 views” cannot be turned into “your banner got 300 views last week” — which is precisely what an advertiser renewing a booking will ask. Not verified running, because sign-in needs a real emailed code.",
     "A daily events table and a 30-day sparkline per edition and banner."),

    ("Admin — publish an edition", 7.5,
     "The right architecture: the PDF never passes through the server, it streams straight to storage from a signed URL, which is what keeps a 40MB print file working on a serverless host. Cover and page count are derived automatically, and there is a draft state.",
     "One long form with no save-and-return, so a half-finished edition is lost on a refresh. Unverified live for the same sign-in reason.",
     "Persist the form to local storage while it is being filled."),

    ("Admin — banners", 6.5,
     "Placement, scheduling and the click-through rate all sit in one place, and each placement names the artwork size it wants, which prevents most of the mistakes an advertiser can make.",
     "It is create-and-delete only. A banner cannot be edited — a typo in a target URL means re-uploading the artwork — and there is no way to reorder banners inside a placement, despite a sort_order column existing in the table for exactly that. No preview of how the artwork will actually crop in its slot.",
     "Add edit, drag-to-reorder, and a live slot preview. This is the screen the business will touch most often."),

    ("Admin — readers", 6.0,
     "Honest about what it is: the list is owned, it can be exported, and unsubscribing sets a flag rather than deleting so an address that asked to be left alone stays that way.",
     "“Copy 240 addresses to the clipboard” is a stopgap, not a feature — it puts the publication one careless paste into the To field away from leaking its whole list. Nothing sends, so the loop the home page promises (“we will send you the link each week”) is not closed.",
     "Wire a sending provider with a real unsubscribe link, and replace copy-to-clipboard with a CSV export."),

    ("Admin — settings", 8.0,
     "Refreshingly read-only. It explains what is connected and what is missing instead of pretending a browser form should edit secrets, and the new schema check names any missing table by name — which turns the single most likely setup failure into a sentence the publisher can act on.",
     "It cannot do anything. Every fix it describes happens somewhere else, in a file or a dashboard the publisher may not have open.",
     "Link straight out to the Supabase SQL editor and the host's environment settings."),

    ("Admin — sign-in", 8.0,
     "A one-time emailed code with sign-ups disabled at the project level is the right choice — no password to leak, no reset flow to get wrong, and nothing client-side that can be bypassed. The screen states its purpose plainly.",
     "No indication of what to do if the code never arrives, and no rate-limit feedback beyond a generic message.",
     "Add a “check spam / contact the desk” line under the resend timer."),
]

CRAFT_MARKS = [
    ("Design system & tokens", 9.0,
     "Every colour, radius, shadow and type step is declared once and consumed through variables; light and dark are both defined explicitly rather than one being derived from the other. The <i>on-wine</i> utility that flips an entire band's tokens in one class is a genuinely elegant piece of system design.",
     "A few components still reach for raw Tailwind palette values (amber, emerald, rose) for status colours that the system never formally defines.",
     "Promote the status colours into named tokens so the system owns all of its colour."),

    ("Layout & spacing rhythm", 8.5,
     "One Section component owns every gutter and max-width on the site, so the horizontal rhythm cannot drift. Vertical rhythm between bands is consistent, and full-width tinted bands are used to separate movements rather than boxes-inside-boxes.",
     "Several sections override the shared padding with <i>!py-9</i> and <i>!pt-4</i> escape hatches — each defensible alone, but together they are the beginning of the drift the Section component exists to prevent.",
     "Give Section named density variants instead of per-use important overrides."),

    ("Typography", 7.5,
     "A clear three-role system — display, interface, Tamil — with a fluid clamped scale so no headline needs a breakpoint override, and uppercase reserved strictly for small labels so it keeps meaning. The new grotesque gives the headlines real presence.",
     "The swap left a loose end: elements that borrow the display face for a number or a word without being a heading tag — stat figures, the specimen mockup, the mobile drawer links — still render at regular weight, which read as deliberate restraint in a serif and reads closer to undesigned in a grotesque. The Tamil wordmark is also decorative-only and very small for a publication whose name is Tamil.",
     "Set an explicit weight on every display-face usage, and reconsider how much the Tamil is subordinated."),

    ("Colour & contrast", 9.0,
     "The palette is taken from the logotype rather than invented next to it, and every pair was measured rather than eyeballed — two real failures were found and fixed. Splitting the accent into a fill token and a text token, because no single wine can carry white button text and also be readable as text on a dark ground, is the correct call and one most teams never make.",
     "Nothing significant. The rose-gold label on paper sits at 5.3:1 — compliant, but the tightest pair on the site.",
     "Nothing needed."),

    ("Responsiveness", 9.0,
     "Verified rather than assumed: zero horizontal overflow at fourteen widths from 320px to 1920px across every public route, with the interactive states — open drawer, view toggles, reader toolbar — checked individually. Mobile-first throughout, with sensible stacking rather than shrinking.",
     "All of it emulated. No real device has touched this, so iOS Safari's address-bar collapse against the sticky header and an Android keyboard over the contact form remain unknowns.",
     "One hour on a real phone."),

    ("Accessibility", 7.5,
     "Semantic landmarks, a working skip link, visible focus rings site-wide, labelled form fields, a native disclosure element for the FAQ, and reduced-motion honoured everywhere including the ticker.",
     "No screen-reader pass has been run. The 3D scenes have no text alternative, the reader's icon buttons are 36px against a 44px touch guideline, and the archive's live result count updates politely but the view toggle does not announce that the content beneath it changed.",
     "One pass with VoiceOver, and bump the reader's touch targets."),

    ("Motion", 8.5,
     "Restrained and reasoned. The hero entrance is CSS rather than JavaScript specifically because a script-driven entrance leaves the most important thing on the site invisible until the script runs — and because frame loops pause in background tabs. Everything else reveals once on scroll.",
     "Reveal-on-scroll is applied broadly enough that on a fast scroll a reader can outrun it and briefly meet blank space.",
     "Shorten the trigger margin, or drop the reveal below the second screen."),

    ("Iconography & illustration", 7.5,
     "Eight custom drawings on a shared 120×96 field with one stroke weight and a single accent rule, so they read as one family. They describe what Vaaram actually does — a spread, a proof, a phone — rather than floating abstractly.",
     "The style is competent but generic — thin-line outline illustration is the default of the last decade, and none of these would be recognisable as Vaaram's if the accent colour were removed. They also do no work the adjacent headline is not already doing.",
     "Push them toward the printed-page language the rest of the site uses — halftone, registration marks, trimmed edges."),

    ("Brand & logo", 5.0,
     "The palette, the mark's construction and the lockup discipline are all sound, and taking the web address out of the header — the one part of a printed logo nobody on the site can act on — was the right editorial call.",
     "The site does not use your logo. The image supplied could not be extracted from the conversation as a file, so what ships is a vector redrawn from it — same maroon, same rose gold, same bird in flight, but not your artwork. Every favicon, share card and header on the site is currently an approximation of the brand rather than the brand. No amount of craft in the redraw changes that.",
     "Drop the real file in and re-run the generator. This single change moves this line from 5 to 9."),

    ("Content & copywriting", 9.0,
     "The strongest non-visual thing here. Nothing is invented: no fabricated testimonials, no made-up reader numbers, statistics computed from rows that actually exist, and a specimen page that names no business because inventing a plausible advertiser would read as a fake endorsement. Advertisements are labelled because Canadian standards require it and because it is honest. The voice is consistent and unusually free of filler.",
     "Some section standfirsts are longer than a scanning reader will take.",
     "Trim the longest standfirsts by a third."),

    ("Information architecture", 8.5,
     "Four top-level destinations, no submenus, and every page one click from every other. The archive is the product and it is one click from anywhere. Redirects preserve the old /editions URLs.",
     "“Advertise” is a primary business goal reachable only through Contact, and the nav does not name it at all.",
     "Consider promoting Advertise to its own destination."),
]

BUILD_MARKS = [
    ("Code quality & structure", 8.5,
     "Genuinely well organised, and the comments explain <i>why</i> rather than restating the code — the note about why uploads bypass the server, or why the hero animates in CSS, would save a future developer real time. Server and client boundaries are respected; the shared aspect map was moved out of a server module specifically so a client component would not drag server code into the bundle.",
     "A few components have grown long enough to split — the PDF reader is close to 400 lines holding loading, rendering, paging, zoom, rotation, fullscreen and touch in one file.",
     "Split the reader's document handling out of its interface."),

    ("Performance", 7.0,
     "103KB of shared JavaScript is lean for a React site, the 3D bundle is dynamically imported and gated so phones never download it, fonts are self-hosted and subset, and the reader renders one page at a time so a 60-page edition opens as fast as a 4-page one.",
     "Image optimisation is switched off globally. Covers and banners are served exactly as uploaded — so the first advertiser who hands over a 4MB JPEG will ship 4MB to every visitor on every page it appears, and nothing in the admin stops them. That is the clearest performance liability on the site and it is a business risk, not just a technical one.",
     "Either re-enable the image pipeline or enforce a size and dimension cap at upload time. This is the highest-value single fix in this table."),

    ("Data model & security", 8.5,
     "Row-Level Security on every table means a bad query cannot leak an unpublished edition or a subscriber's address — the rule is enforced in the database, not hoped for in the application. Counters are atomic and single-purpose. No IP, cookie or visitor identity is stored anywhere, which is why the site legitimately needs no cookie banner. Banner scheduling is enforced by the read policy itself.",
     "Rate limiting is per-instance and in-memory, so the real allowance multiplies by however many serverless instances are warm and resets whenever one recycles. Correct for a contact form; it would be wrong for anything else, and nothing else uses it.",
     "Nothing urgent. Move to a shared store only if abuse actually appears."),

    ("Advertising system", 8.5,
     "Ten placements, rotation with impression and click counting, per-edition targeting, scheduling, and the house fallback that keeps an unbooked slot from becoming a hole in the layout while quietly selling itself. Outbound links carry rel=sponsored, which is what search engines expect of paid placement.",
     "No advertiser-facing reporting at all, and no concept of a booking or an invoice — a banner exists or it does not.",
     "A simple per-banner report the publisher can send a client."),

    ("SEO & metadata", 9.0,
     "Structured data describes Vaaram as a Periodical rather than a news organisation — accurate, and most sites would have got that wrong. Each issue is marked up as a PublicationIssue, the FAQ as an FAQPage, with a generated share card, a sitemap that includes every edition, and canonical URLs throughout.",
     "The share card is generic — every edition shares the same image rather than its own cover.",
     "Generate the share card per edition from its cover."),

    ("Analytics", 5.5,
     "Privacy-respecting by construction and the four counters that exist are accurate and atomic.",
     "Lifetime totals only. There is no way to answer “how did last week compare” for an edition or a banner, which is the question the business will be asked by every advertiser at renewal. For an advertising publication this is closer to a missing feature than a missing nicety.",
     "A dated events table — modest work, disproportionate business value."),

    ("Testing", 2.0,
     "The type checker and a passing production build are real and both are green.",
     "That is the entire safety net. No unit tests, no end-to-end test, no visual regression. The publish flow — signed upload, storage write, database insert, cache revalidation — is the one path where a silent regression would be expensive, and nothing watches it. Every check in this review was made by hand and none of it survives the next change on its own.",
     "One end-to-end test over publishing an edition would carry most of the value."),

    ("Production readiness", 6.0,
     "It genuinely runs. Every page loads, the reader opens a PDF, an enquiry saves, a banner can be uploaded and appears, and it does all of this without a Cloudflare account.",
     "It is not correct yet. The phone number is a reserved 555 number that can never connect, the email and address are placeholders, eighteen demo editions are standing in for real ones, and nothing is deployed. The subscribers table still needs one SQL run before the sign-up box works.",
     "Four short jobs, all needing your accounts rather than more code."),
]

TOP_FIXES = [
    ("Put the real logo in", "Brand 5 → 9",
     "Everything else about the identity is already built around it. Drop the file in and re-run the generator; the favicon, share card, header, footer and admin all update together."),
    ("Rebuild the reader's navigation", "Reader 6.5 → 8.5",
     "A page-number input, a thumbnail rail and text search. This is where readers spend their entire session and it is the weakest public page — the highest-value design work left."),
    ("Cap or optimise uploaded images", "Performance 7 → 8.5",
     "Image optimisation is off site-wide. One advertiser's oversized JPEG becomes every visitor's download on every page it appears. Enforce a cap at upload, or turn the pipeline back on."),
    ("Close the email loop", "Readers 6 → 8",
     "The home page promises a weekly email and the list is filling up with addresses nobody can yet write to. A sending provider with a working unsubscribe link finishes a promise already made in public."),
    ("Write one end-to-end test", "Testing 2 → 6",
     "Over the publish flow only. It is the path where a silent break costs the most, and a single test covers most of the exposure."),
]

GOOD_THINGS = [
    "<b>Nothing on the site is invented.</b> No fabricated testimonials, no invented reader numbers, no plausible-looking fake advertiser in the specimen page. Statistics are counted from rows that exist. This is rarer in commercial work than it should be, and it is the thing that would survive closest scrutiny from a client.",
    "<b>The house advertisement.</b> An unbooked slot renders Vaaram's own panel — labelled as Vaaram's, styled unlike any paid banner, linking to Contact. It keeps the layout honest before the first client signs and sells the slot at the same time.",
    "<b>The two-token accent.</b> Recognising that one wine cannot both carry white button text and be readable as text on a dark ground, and splitting the token rather than compromising one of the two, is a level of colour discipline most projects skip.",
    "<b>The CSS hero entrance.</b> Refusing to animate the most important element on the site with JavaScript, because that leaves it invisible until a script runs and pauses in background tabs, is the kind of decision that only shows up when it is wrong elsewhere.",
    "<b>Security enforced in the database.</b> Row-Level Security means an application bug cannot leak an unpublished edition or a subscriber's address. The safe thing is the default rather than the careful thing.",
    "<b>It works without Cloudflare.</b> The storage layer falls through to Supabase automatically, so the site is launchable today on one account instead of three.",
]


def build():
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=ML, rightMargin=MR, topMargin=21 * mm, bottomMargin=18 * mm,
        title="Vaaram Magazine — Design & Build Review",
        author="Design & front-end review",
        subject="An honest graded critique of the Vaaram Magazine website",
    )
    frame_cover = Frame(ML, 18 * mm, CONTENT_W, PH - 36 * mm, id="cover",
                        leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    frame_body = Frame(ML, 18 * mm, CONTENT_W, PH - 39 * mm, id="body",
                       leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[frame_cover], onPage=cover_page),
        PageTemplate(id="body", frames=[frame_body], onPage=body_page),
    ])

    F = []  # flowables

    # ── COVER ────────────────────────────────────────────────────────────
    F.append(Spacer(1, 14 * mm))
    F.append(Paragraph("VAARAM MAGAZINE&nbsp;&nbsp;/&nbsp;&nbsp;WWW.VAARAM.CA",
                       ParagraphStyle("ck", fontName=MONO, fontSize=7.4, leading=10,
                                      textColor=ROSE_PALE)))
    F.append(Spacer(1, 8 * mm))
    F.append(Paragraph("Design &amp;<br/>build review",
                       ParagraphStyle("ct", fontName=DISPLAY, fontSize=44, leading=44,
                                      textColor=colors.HexColor("#FAF8F4"))))
    F.append(Spacer(1, 7 * mm))
    F.append(Paragraph(
        "An honest, graded critique of the website — page by page, and across "
        "the craft and the engineering. Written the way it would be written for "
        "a client who is paying for the truth rather than for reassurance.",
        ParagraphStyle("cs", fontName=BODY, fontSize=10.6, leading=16.5,
                       textColor=colors.HexColor("#C9BDC2"))))

    F.append(Spacer(1, 22 * mm))

    # Big overall grade, reversed out of the wine field.
    grade_block = Table([[
        Paragraph("7.6<font size=15 color='#9A8A90'>/10</font>",
                  ParagraphStyle("g", fontName=DISPLAY, fontSize=52, leading=50,
                                 textColor=colors.HexColor("#FAF8F4"))),
        Paragraph(
            "<font name='%s' size=7 color='#E0B29B'>OVERALL</font><br/>"
            "<font name='%s' size=9.5 color='#C9BDC2'>A strong, carefully made front "
            "end sitting on a business setup that is not finished. The craft is "
            "ahead of the readiness — and both are fixable in days, not weeks.</font>"
            % (MONO, BODY),
            ParagraphStyle("gs", fontName=BODY, fontSize=9.5, leading=14)),
    ]], colWidths=[52 * mm, CONTENT_W - 52 * mm])
    grade_block.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    F.append(grade_block)

    F.append(Spacer(1, 30 * mm))
    F.append(Paragraph(
        "13 pages graded&nbsp;&nbsp;·&nbsp;&nbsp;19 craft and engineering lines graded"
        "&nbsp;&nbsp;·&nbsp;&nbsp;9 September 2026",
        ParagraphStyle("cm", fontName=MONO, fontSize=7.2, leading=10, textColor=FAINT)))

    F.append(NextPageTemplate("body"))
    F.append(PageBreak())

    # ── 01 HOW THIS IS GRADED ────────────────────────────────────────────
    F.append(Paragraph("", ParagraphStyle("spacer0", fontSize=1, leading=1)))
    F += section("01", "How this is graded",
                 "Marks below are calibrated against commercial work, not against "
                 "an ideal. A 7 is a good, professional result with a named "
                 "weakness; an 8 is work a client would be pleased with; a 9 is "
                 "better than most of what ships. Two lines score below 6 and both "
                 "are said plainly, because a review where everything scores well "
                 "is a sales document, not a review.")

    scale = Table([
        [Paragraph("9 – 10", S["td"]), Paragraph("Exceptional", S["td"]),
         Paragraph("Ships as-is; ahead of most commercial work in this category.", S["td_muted"])],
        [Paragraph("8 – 8.9", S["td"]), Paragraph("Strong", S["td"]),
         Paragraph("Professional. Minor polish left, nothing a visitor would call a fault.", S["td_muted"])],
        [Paragraph("7 – 7.9", S["td"]), Paragraph("Good", S["td"]),
         Paragraph("Solid, with one named weakness worth scheduling.", S["td_muted"])],
        [Paragraph("6 – 6.9", S["td"]), Paragraph("Adequate", S["td"]),
         Paragraph("Works, but with a gap a real user or the business will feel.", S["td_muted"])],
        [Paragraph("4 – 5.9", S["td"]), Paragraph("Weak", S["td"]),
         Paragraph("Needs work before this goes in front of a paying client.", S["td_muted"])],
        [Paragraph("0 – 3.9", S["td"]), Paragraph("Unfit", S["td"]),
         Paragraph("Effectively absent.", S["td_muted"])],
    ], colWidths=[20 * mm, 26 * mm, CONTENT_W - 46 * mm])
    scale.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, LINE),
        ("LINEABOVE", (0, 0), (-1, 0), 0.9, INK),
        ("LINEBELOW", (0, -1), (-1, -1), 0.9, INK),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4.4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4.4),
    ]))
    F.append(scale)

    F += callout(
        "How the overall 7.6 was reached",
        "Pages average 7.5, craft averages 8.1, engineering and business average 6.9. "
        "Weighted toward what a visitor actually touches — pages 40%, craft 35%, "
        "engineering 25% — that is 7.57. The gap between craft (8.1) and "
        "engineering-and-business (6.9) is the honest shape of this project: it has "
        "been designed further than it has been operationalised.")

    F.append(PageBreak())

    # ── 02 PAGE BY PAGE ──────────────────────────────────────────────────
    F += section("02", "Page by page",
                 "Every screen on the site, public and administrative. The four "
                 "admin screens behind sign-in were reviewed as code rather than "
                 "driven live, because signing in would send a real code to your inbox.")
    for name, score, works, weak, lift in PAGE_MARKS:
        F.append(review(name, score, works, weak, lift))

    F.append(PageBreak())

    # ── 03 CRAFT ─────────────────────────────────────────────────────────
    F += section("03", "The craft",
                 "The design work itself, judged as a system rather than page by page.")
    for name, score, works, weak, lift in CRAFT_MARKS:
        F.append(review(name, score, works, weak, lift))

    F.append(PageBreak())

    # ── 04 BUILD ─────────────────────────────────────────────────────────
    F += section("04", "The build and the business",
                 "What sits underneath, and what the publication will actually "
                 "need to run on this once real money is attached to it.")
    for name, score, works, weak, lift in BUILD_MARKS:
        F.append(review(name, score, works, weak, lift))

    F.append(PageBreak())

    # ── 05 WHAT WOULD MOVE THE NEEDLE ────────────────────────────────────
    F += section("05", "The five that move the needle",
                 "Ordered by grade movement per unit of effort. Doing all five "
                 "takes this from 7.6 to roughly 8.6 — and only the second one "
                 "is real design work.")
    for i, (title, delta, text) in enumerate(TOP_FIXES, 1):
        row = Table([[
            Paragraph(f"{i:02d}", ParagraphStyle("fn", fontName=MONO, fontSize=8,
                                                 leading=11, textColor=WINE)),
            [Paragraph(title, ParagraphStyle("ft", fontName=DISPLAY_MD, fontSize=10.4,
                                             leading=13.5, textColor=INK, spaceAfter=2)),
             Paragraph(text, S["verdict"])],
            Paragraph(delta, ParagraphStyle("fd", fontName=MONO, fontSize=7.4,
                                            leading=11, textColor=GREEN,
                                            alignment=TA_RIGHT)),
        ]], colWidths=[10 * mm, CONTENT_W - 42 * mm, 32 * mm])
        row.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LINEABOVE", (0, 0), (-1, 0), 0.5, LINE),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        F.append(row)

    # ── 06 WHAT IS GENUINELY GOOD ────────────────────────────────────────
    F += section("06", "What is genuinely good",
                 "A review that only lists faults is as useless as one that lists "
                 "none. These are the things worth protecting through whatever "
                 "gets changed next.")
    F += bullets(GOOD_THINGS)

    F.append(CondPageBreak(70 * mm))

    # ── 07 SUMMARY TABLE ─────────────────────────────────────────────────
    F += section("07", "Every mark, in one table")
    F.append(Spacer(1, 3 * mm))

    F.append(Paragraph("PAGES", ParagraphStyle("gh", fontName=MONO, fontSize=7,
                                               leading=11, textColor=WINE,
                                               spaceBefore=2, spaceAfter=4)))
    F.append(summary_table(
        [(n, s, v) for n, s, _, _, v in
         [(n, s, w, d, l) for n, s, w, d, l in PAGE_MARKS]],
        first_col="Page"))

    F.append(Spacer(1, 6 * mm))
    F.append(Paragraph("CRAFT", ParagraphStyle("gh2", fontName=MONO, fontSize=7,
                                               leading=11, textColor=WINE,
                                               spaceBefore=2, spaceAfter=4)))
    F.append(summary_table([(n, s, v) for n, s, _, _, v in CRAFT_MARKS],
                           first_col="Discipline"))

    F.append(Spacer(1, 6 * mm))
    F.append(Paragraph("BUILD & BUSINESS", ParagraphStyle("gh3", fontName=MONO,
                                                          fontSize=7, leading=11,
                                                          textColor=WINE,
                                                          spaceBefore=2, spaceAfter=4)))
    F.append(summary_table([(n, s, v) for n, s, _, _, v in BUILD_MARKS],
                           first_col="Area"))

    # ── CLOSING ──────────────────────────────────────────────────────────
    F += callout(
        "The verdict, in one paragraph",
        "This is good work with two honest holes in it. The design system, the "
        "colour discipline, the responsiveness and the refusal to invent content "
        "are all better than the commercial average, and the front end would "
        "stand up in a portfolio. What lets it down is not craft: it is that the "
        "site still wears a redrawn logo instead of yours, that the page readers "
        "spend all their time on has the thinnest navigation on the site, and "
        "that nothing automated protects any of it from the next change. None of "
        "those are hard. Fix the logo, the reader and one test, and this is an "
        "8.5 product with a launch date.")

    doc.build(F)
    return OUT


if __name__ == "__main__":
    path = build()
    print("wrote", path.relative_to(ROOT), f"({path.stat().st_size/1024:.0f} KB)")
