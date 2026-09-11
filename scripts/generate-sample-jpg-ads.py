#!/usr/bin/env python3
"""
Generates 10 realistic, professional Canadian community advertisement flyers/cards
specifically formatted at 1200 x 600 px JPG (2:1 aspect ratio) for Vaaram Magazine
and its new Eelamurasu-style ad rail and banner slots.

Outputs:
  - public/sample-ads/ad-01-sri-balaji-motors.jpg
  - public/sample-ads/ad-02-selvi-jewellers.jpg
  - public/sample-ads/ad-03-ilango-law.jpg
  - public/sample-ads/ad-04-thinusha-catering.jpg
  - public/sample-ads/ad-05-apex-mortgages.jpg
  - public/sample-ads/ad-06-anbu-driving.jpg
  - public/sample-ads/ad-07-uthayan-realty.jpg
  - public/sample-ads/ad-08-maple-dental.jpg
  - public/sample-ads/ad-09-bala-cpa.jpg
  - public/sample-ads/ad-10-quality-movers.jpg
"""
import os
import pathlib
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUB_DIR = ROOT / "public" / "sample-ads"
DOC_DIR = ROOT / "documents" / "sample-ads"

PUB_DIR.mkdir(parents=True, exist_ok=True)
DOC_DIR.mkdir(parents=True, exist_ok=True)

W, H = 1200, 600

# Fonts
FONT_DIR = "/System/Library/Fonts/"
SUPP_DIR = "/System/Library/Fonts/Supplemental/"

def get_font(size, bold=True):
    try:
        if bold:
            return ImageFont.truetype(FONT_DIR + "Avenir Next.ttc", size, index=8) # Heavy
        return ImageFont.truetype(FONT_DIR + "Avenir Next.ttc", size, index=2) # Medium
    except Exception:
        try:
            name = "Arial Bold.ttf" if bold else "Arial.ttf"
            return ImageFont.truetype(SUPP_DIR + name, size)
        except Exception:
            return ImageFont.load_default()

def get_serif(size, bold=True):
    try:
        name = "Georgia Bold.ttf" if bold else "Georgia.ttf"
        return ImageFont.truetype(SUPP_DIR + name, size)
    except Exception:
        return get_font(size, bold)


ADS_DATA = [
    {
        "filename": "ad-01-sri-balaji-motors.jpg",
        "name": "Sri Balaji Motors",
        "bg_top": (10, 18, 36),
        "bg_bot": (18, 30, 60),
        "accent": (212, 175, 55),      # Gold
        "accent_badge": (230, 57, 70),  # Crimson
        "text_white": (255, 255, 255),
        "text_muted": (180, 195, 220),
        "badge": "★ CERTIFIED SAFETY INSPECTION STATION ★",
        "title": "SRI BALAJI MOTORS",
        "tagline": "Complete Auto Repair & Certified Pre-Owned Sales",
        "services": [
            "Safety Certificates (Safety Standards Certificate)",
            "Complete Brake Service & Suspension Overhaul",
            "Transmission & Engine Computer Diagnostics",
            "Tire Sales, Balancing & Seasonal Wheel Storage",
        ],
        "highlight": "SPECIAL OFFER: 15% OFF COMPLETE BRAKE SERVICE WITH THIS AD",
        "cta": "CALL FOR ESTIMATE",
        "phone": "(416) 291-8844",
        "address": "1450 Midland Ave, Unit 12, Scarborough, ON",
        "web": "sribalajimotors.ca",
    },
    {
        "filename": "ad-02-selvi-jewellers.jpg",
        "name": "Selvi Jewellers",
        "bg_top": (65, 8, 22),
        "bg_bot": (95, 12, 34),
        "accent": (255, 215, 0),       # Bright Gold
        "accent_badge": (195, 140, 20),
        "text_white": (255, 248, 235),
        "text_muted": (240, 205, 190),
        "badge": "TRUSTED CANADIAN JEWELLER SINCE 1998",
        "title": "SELVI JEWELLERS",
        "tagline": "Traditional & Modern 22K 916 Hallmark Gold & Diamonds",
        "services": [
            "Exclusive Bridal & Wedding Jewellery Collections",
            "Custom Handcrafted Bangles, Chains & Thali Sets",
            "Certified 24K Pure Gold Bars & Investment Coins",
            "Certified Natural Diamond Rings & Custom Design",
        ],
        "highlight": "GUARANTEED HIGHEST EXCHANGE CASH VALUE FOR YOUR OLD GOLD",
        "cta": "VISIT SHOWROOM",
        "phone": "(416) 289-9160",
        "address": "2500 Eglinton Ave E, Scarborough, ON",
        "web": "selvijewellers.ca",
    },
    {
        "filename": "ad-03-ilango-law.jpg",
        "name": "Ilango & Partners Law Office",
        "bg_top": (17, 24, 39),
        "bg_bot": (30, 41, 59),
        "accent": (56, 189, 248),      # Cyan
        "accent_badge": (245, 158, 11), # Amber
        "text_white": (248, 250, 252),
        "text_muted": (180, 200, 220),
        "badge": "BARRISTERS · SOLICITORS · NOTARY PUBLIC",
        "title": "ILANGO & PARTNERS",
        "tagline": "Canadian Immigration & Refugee Law Specialists",
        "services": [
            "Spousal, Parent & Grandparent Sponsorship Applications",
            "Express Entry, Provincial Nominees (OINP) & PR Renewals",
            "Student Visas, Post-Graduate & LMIA Work Permits",
            "Immigration Appeals, Judicial Review & Citizenship",
        ],
        "highlight": "COMPREHENSIVE CONSULTATION · TRANSPARENT FLAT FEES",
        "cta": "BOOK CONSULTATION",
        "phone": "(647) 556-3200",
        "address": "5635 Finch Ave E, Suite 204, Toronto, ON",
        "web": "ilangolaw.ca",
    },
    {
        "filename": "ad-04-thinusha-catering.jpg",
        "name": "Thinusha Catering & Take-Out",
        "bg_top": (44, 14, 7),
        "bg_bot": (75, 24, 12),
        "accent": (245, 158, 11),      # Saffron
        "accent_badge": (194, 65, 12), # Deep Orange
        "text_white": (255, 251, 235),
        "text_muted": (250, 215, 175),
        "badge": "AUTHENTIC JAFFNA & SOUTH INDIAN CUISINE",
        "title": "THINUSHA CATERING",
        "tagline": "Full-Service Catering & Delicious Daily Take-Out",
        "services": [
            "Authentic Fresh Idiyappam, Sothi, Pittu & Vadai",
            "Signature Jaffna Crab Curry, Mutton & Seafood Feasts",
            "Catering for Weddings, Receptions & House Parties",
            "100% Pure Vegetarian Feasts & Banana Leaf Service",
        ],
        "highlight": "SPECIAL WEEKEND PARTY TRAYS AVAILABLE · RESERVE IN ADVANCE",
        "cta": "ORDER CATERING",
        "phone": "(905) 454-4224",
        "address": "107 Kennedy Rd S, Brampton, ON",
        "web": "thinushacatering.com",
    },
    {
        "filename": "ad-05-apex-mortgages.jpg",
        "name": "Apex Canadian Mortgages",
        "bg_top": (6, 44, 32),
        "bg_bot": (12, 70, 52),
        "accent": (52, 211, 153),      # Emerald Mint
        "accent_badge": (251, 191, 36), # Gold
        "text_white": (236, 253, 245),
        "text_muted": (180, 230, 210),
        "badge": "FSRA LICENSED MORTGAGE BROKERAGE #12450",
        "title": "APEX MORTGAGES",
        "tagline": "Jey Rasathurai — Helping Families Own Homes for 15+ Years",
        "services": [
            "1st & 2nd Residential Mortgages at Institutional Rates",
            "Home Equity Line of Credit (HELOC) & Debt Consolidation",
            "Self-Employed, New to Canada & Credit Rebuilding Programs",
            "Private Lending & Commercial Property Financing",
        ],
        "highlight": "FREE RATE CONSULTATION · FAST APPROVALS WITHIN 24 HOURS",
        "cta": "GET PRE-APPROVED",
        "phone": "(647) 713-6049",
        "address": "Markham & Scarborough Office Locations",
        "web": "apexmortgages.ca",
    },
    {
        "filename": "ad-06-anbu-driving.jpg",
        "name": "Anbu Driving School",
        "bg_top": (20, 20, 24),
        "bg_bot": (35, 35, 45),
        "accent": (250, 204, 21),      # High-Vis Amber
        "accent_badge": (217, 119, 6),
        "text_white": (255, 255, 255),
        "text_muted": (220, 220, 220),
        "badge": "MTO APPROVED BEGINNER DRIVER EDUCATION (BDE)",
        "title": "ANBU DRIVING SCHOOL",
        "tagline": "Pass Your G2 & G Road Test On Your Very First Attempt!",
        "services": [
            "Ministry Approved Certificate (Reduces Insurance Premiums)",
            "Dual-Brake Safety Vehicles & Patient Bilingual Instructors",
            "Car Rental Available for DriveTest Centres (Metro East, Downsview)",
            "Parallel Parking, 3-Point Turns & Highway Training",
        ],
        "highlight": "FREE DOOR-TO-DOOR PICK-UP ACROSS SCARBOROUGH & MARKHAM",
        "cta": "REGISTER TODAY",
        "phone": "(416) 822-4411",
        "address": "Serving Scarborough, Markham, Richmond Hill & North York",
        "web": "anbudrivingschool.ca",
    },
    {
        "filename": "ad-07-uthayan-realty.jpg",
        "name": "Uthayan Real Estate",
        "bg_top": (24, 30, 48),
        "bg_bot": (40, 50, 80),
        "accent": (225, 29, 72),       # Rose Red
        "accent_badge": (56, 189, 248),# Sky Cyan
        "text_white": (255, 255, 255),
        "text_muted": (195, 210, 235),
        "badge": "HOMELIFE / CHAMPIONS REALTY INC. · TOP PRODUCER",
        "title": "UTHAYAN REAL ESTATE",
        "tagline": "Uthayan Ponnuthurai, Broker — Selling GTA Homes Since 1988",
        "services": [
            "Exclusive Pre-Construction VIP Allocations in GTA & Calgary",
            "Top Dollar Sale Strategy for Detached Homes & Townhouses",
            "Commercial Units, Retail Plazas & Industrial Leasing",
            "First-Time Buyer Rebates & Strategic Investment Guidance",
        ],
        "highlight": "COMPLIMENTARY HOME MARKET VALUATION · STAGING INCLUDED",
        "cta": "CALL FOR EVALUATION",
        "phone": "(416) 551-2120",
        "address": "300 Milner Ave, Suite 300, Toronto, ON M1S 3B9",
        "web": "uthayanrealty.com",
    },
    {
        "filename": "ad-08-maple-dental.jpg",
        "name": "Maple Dental Care",
        "bg_top": (12, 32, 54),
        "bg_bot": (20, 50, 85),
        "accent": (6, 182, 212),       # Teal Cyan
        "accent_badge": (16, 185, 129),# Emerald
        "text_white": (248, 250, 252),
        "text_muted": (190, 220, 240),
        "badge": "★ COMPREHENSIVE FAMILY & COSMETIC DENTISTRY ★",
        "title": "MAPLE DENTAL CARE",
        "tagline": "Gentle, Professional Dental Care for Adults and Children",
        "services": [
            "Complete Dental Checkups, Cleanings & Digital X-Rays",
            "Root Canal Therapy, Wisdom Teeth Extractions & Fillings",
            "Professional Laser Teeth Whitening & Porcelain Veneers",
            "Direct Insurance Billing & Flexible Student/Senior Discounts",
        ],
        "highlight": "EMERGENCY APPOINTMENTS WELCOME · EVENING & WEEKEND HOURS",
        "cta": "BOOK APPOINTMENT",
        "phone": "(416) 293-1122",
        "address": "3443 Finch Ave E, Unit 301, Scarborough, ON",
        "web": "mapledentalcare.ca",
    },
    {
        "filename": "ad-09-bala-cpa.jpg",
        "name": "Bala & Associates CPA",
        "bg_top": (25, 20, 60),
        "bg_bot": (45, 35, 100),
        "accent": (192, 132, 252),     # Purple Accent
        "accent_badge": (56, 189, 248),# Cyan
        "text_white": (245, 243, 255),
        "text_muted": (210, 200, 240),
        "badge": "CHARTERED PROFESSIONAL ACCOUNTANTS (CPA, CGA)",
        "title": "BALA & ASSOCIATES",
        "tagline": "Corporate Tax, Accounting & Business Advisory Services",
        "services": [
            "Corporate Tax Returns (T2), Financial Statements & Notice to Reader",
            "Personal Income Tax (T1), Rental Properties & Capital Gains",
            "CRA Audit Defence, Voluntary Disclosures & Penalty Disputes",
            "Monthly Bookkeeping, HST Returns & Full Payroll Solutions",
        ],
        "highlight": "MAXIMIZE TAX DEDUCTIONS LEGALLY · YEAR-ROUND SUPPORT",
        "cta": "SCHEDULE TAX REVIEW",
        "phone": "(647) 345-9988",
        "address": "1200 Markham Rd, Suite 410, Scarborough, ON",
        "web": "balacpa.ca",
    },
    {
        "filename": "ad-10-quality-movers.jpg",
        "name": "Quality Express Movers",
        "bg_top": (28, 25, 23),
        "bg_bot": (45, 40, 38),
        "accent": (234, 88, 12),       # Vibrant Moving Orange
        "accent_badge": (245, 158, 11),
        "text_white": (250, 250, 249),
        "text_muted": (215, 210, 205),
        "badge": "BONDED, LICENSED & INSURED MOVING SPECIALISTS",
        "title": "QUALITY EXPRESS MOVERS",
        "tagline": "Safe, Reliable Residential & Commercial Relocations",
        "services": [
            "GTA Local Moves: Apartments, Condos, Houses & Townhomes",
            "Long Distance Moves Across Ontario, Montreal & Calgary",
            "Piano, Heavy Safe & Fragile Antique Specialty Handling",
            "Free Mattress Covers, Wardrobe Boxes & Disassembly Service",
        ],
        "highlight": "NO HIDDEN FEES · FLAT RATE ESTIMATES · SENIORS DISCOUNT",
        "cta": "GET FREE ESTIMATE",
        "phone": "(416) 427-8263",
        "address": "Serving Toronto, Scarborough, Markham, Mississauga & Brampton",
        "web": "qualityexpressmovers.ca",
    },
]


def draw_gradient(draw, w, h, c1, c2):
    for y in range(h):
        r = int(c1[0] + (c2[0] - c1[0]) * (y / h))
        g = int(c1[1] + (c2[1] - c1[1]) * (y / h))
        b = int(c1[2] + (c2[2] - c1[2]) * (y / h))
        draw.line([(0, y), (w, y)], fill=(r, g, b))


def generate_ad(data):
    img = Image.new("RGB", (W, H), color=data["bg_top"])
    draw = ImageDraw.Draw(img)

    # 1. Gradient Background
    draw_gradient(draw, W, H, data["bg_top"], data["bg_bot"])

    # 2. Border Decor
    pad = 14
    draw.rectangle(
        [(pad, pad), (W - pad, H - pad)],
        outline=data["accent"],
        width=3,
    )
    # Inner hairline
    draw.rectangle(
        [(pad + 6, pad + 6), (W - pad - 6, H - pad - 6)],
        outline=(data["accent"][0], data["accent"][1], data["accent"][2]),
        width=1,
    )

    # Corner blocks
    corner_size = 28
    for (cx, cy) in [(pad, pad), (W - pad, pad), (pad, H - pad), (W - pad, H - pad)]:
        draw.rectangle([(cx - 4, cy - 4), (cx + 4, cy + 4)], fill=data["accent"])

    # 3. Top Eyebrow Badge
    badge_text = data["badge"]
    f_badge = get_font(18, bold=True)
    bbox_badge = f_badge.getbbox(badge_text)
    bw = bbox_badge[2] - bbox_badge[0] + 32
    bh = 34
    bx = (W - bw) // 2
    by = 32

    # Draw Badge Capsule
    draw.rounded_rectangle([(bx, by), (bx + bw, by + bh)], radius=17, fill=data["accent_badge"])
    draw.text((bx + 16, by + 6), badge_text, fill=(255, 255, 255), font=f_badge)

    # 4. Main Title
    title = data["title"]
    f_title = get_font(52, bold=True)
    bbox_title = f_title.getbbox(title)
    tw = bbox_title[2] - bbox_title[0]
    tx = (W - tw) // 2
    ty = 82
    draw.text((tx, ty), title, fill=data["accent"], font=f_title)

    # 5. Tagline
    tag = data["tagline"]
    f_tag = get_serif(22, bold=False)
    bbox_tag = f_tag.getbbox(tag)
    tag_w = bbox_tag[2] - bbox_tag[0]
    draw.text(((W - tag_w) // 2, 146), tag, fill=data["text_white"], font=f_tag)

    # Horizontal Divider with diamond
    div_y = 186
    draw.line([(80, div_y), (W - 80, div_y)], fill=(data["accent"][0], data["accent"][1], data["accent"][2]), width=1)
    draw.polygon([(W//2 - 6, div_y), (W//2, div_y - 6), (W//2 + 6, div_y), (W//2, div_y + 6)], fill=data["accent"])

    # 6. Service Columns (2x2 Grid)
    services = data["services"]
    f_srv = get_font(21, bold=True)
    f_check = get_font(22, bold=True)

    col1_x = 90
    col2_x = 620
    row1_y = 212
    row2_y = 262

    positions = [(col1_x, row1_y), (col1_x, row2_y), (col2_x, row1_y), (col2_x, row2_y)]
    for i, s in enumerate(services[:4]):
        sx, sy = positions[i]
        # Checkmark icon
        draw.text((sx, sy), "✓", fill=data["accent"], font=f_check)
        draw.text((sx + 30, sy + 1), s, fill=data["text_white"], font=f_srv)

    # 7. Highlight Box (Special Offer / Guarantee)
    hl_y = 324
    hl_h = 58
    draw.rounded_rectangle(
        [(80, hl_y), (W - 80, hl_y + hl_h)],
        radius=8,
        fill=(0, 0, 0),
        outline=data["accent"],
        width=2,
    )
    f_hl = get_font(21, bold=True)
    bbox_hl = f_hl.getbbox(data["highlight"])
    hl_w = bbox_hl[2] - bbox_hl[0]
    draw.text(((W - hl_w) // 2, hl_y + 16), data["highlight"], fill=data["accent"], font=f_hl)

    # 8. Bottom Action & Contact Bar
    bar_y = 405
    bar_h = 160
    draw.rectangle([(pad + 7, bar_y), (W - pad - 7, H - pad - 7)], fill=(0, 0, 0, 80))
    draw.line([(pad + 7, bar_y), (W - pad - 7, bar_y)], fill=data["accent"], width=2)

    # Phone Button Box (Left / Centre)
    f_cta_lbl = get_font(15, bold=True)
    f_phone = get_font(38, bold=True)

    draw.text((80, bar_y + 20), data["cta"] + ":", fill=data["accent"], font=f_cta_lbl)
    draw.text((80, bar_y + 44), data["phone"], fill=(255, 255, 255), font=f_phone)

    # Address & Web on the Right
    f_addr_lbl = get_font(15, bold=True)
    f_addr_txt = get_font(20, bold=False)
    f_web_txt = get_font(22, bold=True)

    draw.text((600, bar_y + 20), "LOCATION & SERVICE AREA:", fill=data["accent"], font=f_addr_lbl)
    draw.text((600, bar_y + 44), data["address"], fill=data["text_white"], font=f_addr_txt)
    draw.text((600, bar_y + 80), "🌐  " + data["web"], fill=data["accent"], font=f_web_txt)

    # Footer micro disclaimer
    f_micro = get_font(13, bold=False)
    draw.text(
        (80, bar_y + 115),
        "Proud Sponsor of Vaaram Magazine · Connecting Local Canadian Businesses Every Week",
        fill=data["text_muted"],
        font=f_micro,
    )

    return img


def main():
    print(f"Generating 10 sample ads at {W}x{H} (2:1 aspect ratio)...")
    for ad in ADS_DATA:
        img = generate_ad(ad)
        pub_path = PUB_DIR / ad["filename"]
        doc_path = DOC_DIR / ad["filename"]

        img.save(pub_path, format="JPEG", quality=95)
        img.save(doc_path, format="JPEG", quality=95)
        size_kb = os.path.getsize(pub_path) / 1024.0
        print(f"  ✓ {ad['filename']} ({size_kb:.1f} KB)")

    print(f"\nAll 10 sample ads created successfully in:")
    print(f"  1. {PUB_DIR}")
    print(f"  2. {DOC_DIR}")


if __name__ == "__main__":
    main()
