#!/usr/bin/env python3
"""
─────────────────────────────────────────────────────────────────────────────
 VAARAM MAGAZINE — DEMONSTRATION BANNER ARTWORK

 Draws the artwork used to fill roughly 60% of the website's advertising
 slots so the client can see a real, populated site rather than an empty one.

 Two shapes only, because the site sells exactly two:

   · card  — 1200 x 600 px (2:1).  Side rails and the footer grid.
   · strip — 1650 x 300 px (11:2). The wide billboard slots.

 Everything is drawn with fonts that exist on Windows and with characters
 those fonts actually carry, so nothing lands as a missing-glyph box.

 Output: public/demo-ads/*.jpg
─────────────────────────────────────────────────────────────────────────────
"""
import pathlib

from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "demo-ads"
OUT_DIR.mkdir(parents=True, exist_ok=True)

FONTS = "C:/Windows/Fonts/"
CARD_W, CARD_H = 1200, 600
STRIP_W, STRIP_H = 1650, 300


def sans(size, weight="bold"):
    name = {"bold": "segoeuib.ttf", "regular": "segoeui.ttf", "light": "segoeuisl.ttf"}[weight]
    return ImageFont.truetype(FONTS + name, size)


def serif(size, bold=False):
    return ImageFont.truetype(FONTS + ("georgiab.ttf" if bold else "georgia.ttf"), size)


def width(draw, text, font):
    return draw.textbbox((0, 0), text, font=font)[2]


def centred(draw, y, text, font, fill, box_w):
    draw.text(((box_w - width(draw, text, font)) / 2, y), text, font=font, fill=fill)


def gradient(size, top, bottom):
    """A vertical wash. Cheap, and it stops a flat block looking like a bug."""
    w, h = size
    img = Image.new("RGB", (1, h))
    px = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        px[0, y] = tuple(round(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
    return img.resize((w, h))


# ─────────────────────────────────────────────────────────────────────────────
#  The advertisers. Invented businesses, plausible Canadian detail — these are
#  demonstration bookings and the documentation says so in as many words.
# ─────────────────────────────────────────────────────────────────────────────
CARDS = [
    {
        "file": "card-01-sri-balaji-motors.jpg",
        "ink": (11, 20, 40), "ink2": (20, 34, 66),
        "accent": (214, 176, 74), "badge": (201, 46, 62),
        "eyebrow": "CERTIFIED SAFETY INSPECTION STATION",
        "name": "SRI BALAJI MOTORS",
        "tagline": "Complete auto repair & certified pre-owned sales",
        "points": ["Safety Standards Certificates", "Brakes, suspension & transmission",
                   "Tyre sales, balancing & winter storage"],
        "offer": "15% OFF A COMPLETE BRAKE SERVICE",
        "phone": "(416) 291-8844",
        "place": "1450 Midland Ave, Unit 12, Scarborough ON",
        "web": "sribalajimotors.ca",
    },
    {
        "file": "card-02-selvi-jewellers.jpg",
        "ink": (58, 12, 28), "ink2": (96, 22, 46),
        "accent": (230, 196, 122), "badge": (168, 30, 56),
        "eyebrow": "22K GOLD  ·  ESTABLISHED 1998",
        "name": "SELVI JEWELLERS",
        "tagline": "Bridal sets, temple jewellery and daily wear",
        "points": ["22K & 18K hallmarked gold", "Custom bridal commissions",
                   "Free cleaning & valuation for customers"],
        "offer": "NO MAKING CHARGES ON BRIDAL SETS THIS MONTH",
        "phone": "(905) 471-2200",
        "place": "3852 Finch Ave E, Scarborough ON",
        "web": "selvijewellers.ca",
    },
    {
        "file": "card-03-ilango-law.jpg",
        "ink": (17, 32, 46), "ink2": (28, 52, 74),
        "accent": (176, 198, 222), "badge": (37, 92, 140),
        "eyebrow": "BARRISTERS & SOLICITORS  ·  LSO LICENSED",
        "name": "ILANGO LAW",
        "tagline": "Immigration, real estate and family law",
        "points": ["Permanent residence & sponsorship", "Home purchases, sales & refinancing",
                   "Wills, estates and notarisation"],
        "offer": "FIRST CONSULTATION AT NO CHARGE",
        "phone": "(416) 555-0142",
        "place": "2100 Ellesmere Rd, Suite 340, Toronto ON",
        "web": "ilangolaw.ca",
    },
    {
        "file": "card-04-thinusha-catering.jpg",
        "ink": (48, 20, 10), "ink2": (86, 38, 18),
        "accent": (243, 176, 80), "badge": (198, 66, 34),
        "eyebrow": "WEDDINGS  ·  RECEPTIONS  ·  HOME FUNCTIONS",
        "name": "THINUSHA CATERING",
        "tagline": "South Indian and Sri Lankan cooking, any scale",
        "points": ["50 to 1,500 guests", "Vegetarian and halal menus",
                   "Serving staff, chafing and delivery"],
        "offer": "BOOK A 2027 WEDDING AT THIS YEAR'S RATE",
        "phone": "(647) 555-0188",
        "place": "Serving the GTA, Durham and Peel",
        "web": "thinushacatering.ca",
    },
    {
        "file": "card-05-apex-mortgages.jpg",
        "ink": (10, 40, 34), "ink2": (18, 70, 58),
        "accent": (140, 220, 178), "badge": (22, 122, 92),
        "eyebrow": "FSRA LICENSED MORTGAGE BROKERAGE",
        "name": "APEX MORTGAGES",
        "tagline": "First homes, renewals and refinancing",
        "points": ["Access to 40+ lenders", "Self-employed and new-to-Canada",
                   "Pre-approval held for 120 days"],
        "offer": "RATE HOLD AND PRE-APPROVAL AT NO COST",
        "phone": "(905) 555-0164",
        "place": "80 Corporate Dr, Suite 210, Scarborough ON",
        "web": "apexmortgages.ca",
    },
    {
        "file": "card-06-anbu-driving.jpg",
        "ink": (26, 26, 30), "ink2": (48, 48, 56),
        "accent": (252, 210, 72), "badge": (222, 88, 40),
        "eyebrow": "MTO APPROVED BEGINNER DRIVER EDUCATION",
        "name": "ANBU DRIVING SCHOOL",
        "tagline": "G2 and G road test preparation",
        "points": ["20 hours in-class, 10 hours in-car", "Insurance discount certificate",
                   "Tamil, English and Sinhala instructors"],
        "offer": "FREE PICK-UP AND DROP-OFF ACROSS SCARBOROUGH",
        "phone": "(416) 555-0119",
        "place": "Markham Rd & Lawrence Ave E, Toronto ON",
        "web": "anbudriving.ca",
    },
    {
        "file": "card-07-uthayan-realty.jpg",
        "ink": (16, 26, 54), "ink2": (34, 48, 88),
        "accent": (198, 168, 106), "badge": (62, 92, 168),
        "eyebrow": "RESIDENTIAL  ·  COMMERCIAL  ·  PRE-CONSTRUCTION",
        "name": "UTHAYAN REALTY",
        "tagline": "Buying, selling and leasing across the GTA",
        "points": ["Free home evaluation", "Pre-construction platinum access",
                   "Investment and rental portfolios"],
        "offer": "NO EVALUATION FEE AND NO OBLIGATION TO LIST",
        "phone": "(647) 555-0137",
        "place": "5799 Yonge St, Suite 1100, Toronto ON",
        "web": "uthayanrealty.ca",
    },
    {
        "file": "card-08-maple-dental.jpg",
        "ink": (12, 44, 58), "ink2": (22, 76, 96),
        "accent": (150, 214, 232), "badge": (30, 138, 170),
        "eyebrow": "ACCEPTING NEW PATIENTS  ·  EVENING HOURS",
        "name": "MAPLE LEAF DENTAL",
        "tagline": "Family, cosmetic and emergency dentistry",
        "points": ["Direct insurance billing", "Invisalign and whitening",
                   "Saturday and evening appointments"],
        "offer": "NEW PATIENT EXAM, X-RAY AND CLEANING BUNDLE",
        "phone": "(905) 555-0176",
        "place": "1200 Brimley Rd, Unit 5, Scarborough ON",
        "web": "mapleleafdental.ca",
    },
    {
        "file": "card-09-bala-cpa.jpg",
        "ink": (30, 22, 46), "ink2": (54, 40, 80),
        "accent": (206, 178, 244), "badge": (112, 78, 178),
        "eyebrow": "CHARTERED PROFESSIONAL ACCOUNTANTS",
        "name": "BALA & ASSOCIATES CPA",
        "tagline": "Personal tax, corporate books and payroll",
        "points": ["T1, T2 and HST filing", "Incorporation and bookkeeping",
                   "CRA audit representation"],
        "offer": "PERSONAL RETURNS FROM $59 BEFORE 31 MARCH",
        "phone": "(416) 555-0155",
        "place": "4438 Sheppard Ave E, Suite 210, Toronto ON",
        "web": "balacpa.ca",
    },
    {
        "file": "card-10-quality-movers.jpg",
        "ink": (44, 16, 16), "ink2": (78, 30, 28),
        "accent": (250, 186, 128), "badge": (206, 74, 44),
        "eyebrow": "LOCAL  ·  LONG DISTANCE  ·  STORAGE",
        "name": "QUALITY MOVERS",
        "tagline": "Homes, apartments and offices moved carefully",
        "points": ["Fully insured, no hidden fees", "Packing materials supplied",
                   "Short and long term storage"],
        "offer": "FREE IN-HOME QUOTE, SEVEN DAYS A WEEK",
        "phone": "(647) 555-0193",
        "place": "Serving Ontario and Quebec",
        "web": "qualitymovers.ca",
    },
    {
        "file": "card-11-nila-grocers.jpg",
        "ink": (16, 42, 22), "ink2": (28, 74, 38),
        "accent": (196, 230, 146), "badge": (72, 150, 58),
        "eyebrow": "OPEN DAILY  ·  7 AM TO 10 PM",
        "name": "NILA FRESH GROCERS",
        "tagline": "South Asian produce, spices and fresh fish",
        "points": ["Fish and meat counter", "Weekly flyer specials",
                   "Free delivery over $75"],
        "offer": "THIS WEEK: BASMATI 10 KG AT $18.99",
        "phone": "(416) 555-0126",
        "place": "2555 Victoria Park Ave, Toronto ON",
        "web": "nilagrocers.ca",
    },
    {
        "file": "card-12-kalai-tutoring.jpg",
        "ink": (36, 20, 56), "ink2": (64, 36, 96),
        "accent": (236, 190, 248), "badge": (148, 72, 186),
        "eyebrow": "GRADES 4 TO 12  ·  IN PERSON AND ONLINE",
        "name": "KALAI LEARNING CENTRE",
        "tagline": "Mathematics, science and English tutoring",
        "points": ["Small groups, four students maximum", "Ontario curriculum specialists",
                   "University admission essay help"],
        "offer": "FIRST ASSESSMENT LESSON AT NO CHARGE",
        "phone": "(905) 555-0181",
        "place": "8500 Kennedy Rd, Unit 22, Markham ON",
        "web": "kalailearning.ca",
    },
    {
        # Booked but switched off, so the Banners list has a "Hidden" row to
        # point at. It never reaches the website.
        "file": "card-13-silverline-autoglass.jpg",
        "ink": (18, 34, 44), "ink2": (32, 60, 76),
        "accent": (162, 216, 234), "badge": (40, 128, 158),
        "eyebrow": "MOBILE SERVICE  ·  ALL INSURERS BILLED DIRECT",
        "name": "SILVERLINE AUTO GLASS",
        "tagline": "Windshield replacement and stone chip repair",
        "points": ["Same day mobile fitting", "Direct insurance billing",
                   "Lifetime workmanship warranty"],
        "offer": "CHIP REPAIRS FREE WITH MOST COMPREHENSIVE POLICIES",
        "phone": "(416) 555-0108",
        "place": "Mobile across Toronto, Markham and Pickering",
        "web": "silverlineautoglass.ca",
    },
    {
        # The advertiser used for the step-by-step worked example in the
        # advertising guide. It is added through the admin form itself.
        "file": "card-14-kandan-electronics.jpg",
        "ink": (20, 18, 52), "ink2": (38, 34, 92),
        "accent": (250, 206, 110), "badge": (98, 84, 216),
        "eyebrow": "SALES  ·  REPAIRS  ·  TRADE-IN  ·  SINCE 2004",
        "name": "KANDAN ELECTRONICS",
        "tagline": "Televisions, appliances and phone repair",
        "points": ["Same day screen and battery repair", "Free delivery and wall mounting",
                   "Twelve months interest free"],
        "offer": "TRADE IN ANY OLD TV AGAINST A NEW 65 INCH",
        "phone": "(416) 555-0131",
        "place": "3300 Kennedy Rd, Unit 8, Scarborough ON",
        "web": "kandanelectronics.ca",
    },
]

STRIPS = [
    {
        "file": "strip-01-vasantham-supermarket.jpg",
        "ink": (12, 40, 24), "ink2": (24, 74, 42),
        "accent": (206, 236, 156), "badge": (86, 162, 66),
        "name": "VASANTHAM SUPERMARKET",
        "line": "Fresh produce, spices and fish  ·  Open daily until 10 PM",
        "cta": "vasantham.ca",
    },
    {
        "file": "strip-02-northline-insurance.jpg",
        "ink": (12, 28, 52), "ink2": (26, 52, 92),
        "accent": (170, 206, 250), "badge": (48, 104, 186),
        "name": "NORTHLINE INSURANCE",
        "line": "Auto, home and commercial cover  ·  Compare eleven insurers",
        "cta": "(416) 555-0147",
    },
    {
        "file": "strip-03-tamil-arts-academy.jpg",
        "ink": (54, 14, 32), "ink2": (94, 26, 52),
        "accent": (240, 198, 138), "badge": (184, 42, 70),
        "name": "TAMIL ARTS ACADEMY",
        "line": "Bharatanatyam, veena and vocal classes  ·  Autumn term open",
        "cta": "tamilartsacademy.ca",
    },
    {
        "file": "strip-04-harbour-travel.jpg",
        "ink": (10, 44, 50), "ink2": (20, 78, 88),
        "accent": (154, 224, 224), "badge": (32, 142, 152),
        "name": "HARBOUR TRAVEL",
        "line": "Colombo, Chennai and Dubai fares  ·  TICO registered",
        "cta": "(647) 555-0172",
    },
    {
        "file": "strip-05-lakeview-banquet.jpg",
        "ink": (40, 18, 48), "ink2": (72, 34, 86),
        "accent": (232, 194, 246), "badge": (138, 70, 170),
        "name": "LAKEVIEW BANQUET HALL",
        "line": "Weddings and receptions to 600 guests  ·  Free parking",
        "cta": "lakeviewbanquet.ca",
    },
]


def draw_card(spec):
    img = gradient((CARD_W, CARD_H), spec["ink"], spec["ink2"])
    d = ImageDraw.Draw(img)
    acc, badge = spec["accent"], spec["badge"]
    white, muted = (255, 255, 255), (196, 206, 224)

    # A double keyline. It reads as "a printed advertisement" at a glance,
    # which is exactly what this slot is selling.
    d.rectangle([8, 8, CARD_W - 9, CARD_H - 9], outline=acc, width=3)
    d.rectangle([20, 20, CARD_W - 21, CARD_H - 21], outline=(*acc, 90), width=1)

    # Eyebrow pill
    f_eye = sans(21, "bold")
    ew = width(d, spec["eyebrow"], f_eye)
    px, py = (CARD_W - ew) / 2 - 26, 44
    d.rounded_rectangle([px, py, px + ew + 52, py + 44], radius=22, fill=badge)
    d.text((px + 26, py + 9), spec["eyebrow"], font=f_eye, fill=white)

    # Name
    f_name = sans(64, "bold")
    if width(d, spec["name"], f_name) > CARD_W - 110:
        f_name = sans(52, "bold")
    centred(d, 116, spec["name"], f_name, acc, CARD_W)

    # Tagline
    f_tag = serif(27)
    centred(d, 196, spec["tagline"], f_tag, white, CARD_W)

    # Divider with a centre diamond
    d.line([(120, 246), (CARD_W - 120, 246)], fill=acc, width=2)
    d.polygon([(CARD_W / 2, 238), (CARD_W / 2 + 9, 246), (CARD_W / 2, 254),
               (CARD_W / 2 - 9, 246)], fill=acc)

    # Service points
    f_pt = sans(25, "regular")
    y = 276
    for point in spec["points"]:
        d.ellipse([110, y + 8, 122, y + 20], fill=acc)
        d.text((140, y), point, font=f_pt, fill=white)
        y += 40

    # Offer bar
    f_off = sans(24, "bold")
    d.rectangle([90, 404, CARD_W - 90, 456], outline=acc, width=2)
    centred(d, 418, spec["offer"], f_off, acc, CARD_W)

    # Footer rule, then the details that make the advertisement work
    d.line([(40, 486), (CARD_W - 40, 486)], fill=acc, width=2)
    d.text((66, 500), "CALL", font=sans(17, "bold"), fill=acc)
    d.text((66, 522), spec["phone"], font=sans(40, "bold"), fill=white)
    d.text((640, 500), "FIND US", font=sans(17, "bold"), fill=acc)
    d.text((640, 524), spec["place"], font=sans(20, "regular"), fill=muted)
    d.text((640, 550), spec["web"], font=sans(21, "bold"), fill=acc)

    img.save(OUT_DIR / spec["file"], "JPEG", quality=88, optimize=True)
    return spec["file"]


def draw_strip(spec):
    """A billboard is read in a second and is 64px tall on a phone, so it
    carries a name, one line and one way to respond. Nothing else fits."""
    img = gradient((STRIP_W, STRIP_H), spec["ink"], spec["ink2"])
    d = ImageDraw.Draw(img)
    acc, white, muted = spec["accent"], (255, 255, 255), (200, 212, 228)

    d.rectangle([6, 6, STRIP_W - 7, STRIP_H - 7], outline=acc, width=3)
    d.rectangle([0, 0, 14, STRIP_H], fill=spec["badge"])

    f_name = sans(62, "bold")
    if width(d, spec["name"], f_name) > 980:
        f_name = sans(50, "bold")
    d.text((72, 86), spec["name"], font=f_name, fill=acc)
    d.text((76, 166), spec["line"], font=serif(26), fill=muted)

    # The response block, kept hard right so it never collides with the name.
    f_cta = sans(30, "bold")
    cw = width(d, spec["cta"], f_cta)
    bx = STRIP_W - cw - 130
    d.rounded_rectangle([bx, 108, STRIP_W - 60, 190], radius=41, fill=spec["badge"])
    d.text((bx + 35, 130), spec["cta"], font=f_cta, fill=white)

    img.save(OUT_DIR / spec["file"], "JPEG", quality=88, optimize=True)
    return spec["file"]


if __name__ == "__main__":
    for spec in CARDS:
        print("card  ", draw_card(spec))
    for spec in STRIPS:
        print("strip ", draw_strip(spec))
    print(f"\n{len(CARDS)} cards + {len(STRIPS)} strips -> {OUT_DIR}")
