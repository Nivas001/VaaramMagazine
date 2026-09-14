#!/usr/bin/env python3
"""
─────────────────────────────────────────────────────────────────────────────
 Captures the advertisement desk for VAARAM-WEBSITE-ADS-MANUAL.pdf.

 Shoots the real, signed-in admin screens. There is deliberately no
 unauthenticated back door into /admin for this: a route that reads the
 database without a session is exactly the kind of thing that should not
 exist in the repository, however convenient it would be for screenshots.

 Instead the session is borrowed from a browser you sign into once, by hand,
 and kept in a local file that is never committed.

   1.  Start the site:      npm run dev
   2.  Sign in once:        python scripts/capture-ad-admin-screenshots.py 3000 --sign-in
                            A browser opens on the login page. Sign in, then
                            press Enter in the terminal. The session is saved
                            to documents/.admin-session.json.
   3.  Capture:             python scripts/capture-ad-admin-screenshots.py 3000

 Step 2 only has to be repeated when the saved session expires.

 Output: documents/ad-admin-screenshots/*.png
─────────────────────────────────────────────────────────────────────────────
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

PORT = next((a for a in sys.argv[1:] if a.isdigit()), "3000")
SIGN_IN = "--sign-in" in sys.argv
BASE = f"http://localhost:{PORT}"

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "documents" / "ad-admin-screenshots"
SESSION = ROOT / "documents" / ".admin-session.json"
OUT.mkdir(parents=True, exist_ok=True)

# Wide enough that the two-column layouts are in their desktop arrangement,
# which is what an administrator on a laptop actually sees.
VIEWPORT = {"width": 1440, "height": 1000}

# Next's development badge floats over the bottom-left corner of every page
# and has no business in a printed manual.
HIDE_DEV_CHROME = """
  nextjs-portal, [data-nextjs-toast], #__next-build-watcher { display: none !important; }
"""


def sign_in():
    """Opens a real browser, waits for a human, and keeps the session."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        ctx = browser.new_context(viewport=VIEWPORT)
        page = ctx.new_page()
        page.goto(f"{BASE}/admin/login", wait_until="domcontentloaded", timeout=120000)
        print("\nA browser has opened on the Vaaram admin login page.")
        print("Sign in there, wait until the dashboard appears, then come back here.")
        input("Press Enter once you are signed in... ")
        ctx.storage_state(path=str(SESSION))
        browser.close()
    print(f"Session saved to {SESSION}. Run the script again without --sign-in to capture.")


def shot(page, name, clip=None, full=False):
    page.screenshot(path=str(OUT / f"{name}.png"), clip=clip, full_page=full)
    print(f"  - {name}.png")


def settle(page, ms=2500):
    """Let images, fonts and the wireframe finish before the shutter."""
    try:
        page.wait_for_load_state("networkidle", timeout=20000)
    except Exception:
        pass
    try:
        page.add_style_tag(content=HIDE_DEV_CHROME)
    except Exception:
        pass
    page.wait_for_timeout(ms)


def clip_of(el, pad=10, max_height=1600):
    b = el.bounding_box() if el else None
    if not b:
        return None
    return {
        "x": max(0, b["x"] - pad),
        "y": max(0, b["y"] - pad),
        "width": min(VIEWPORT["width"] - max(0, b["x"] - pad), b["width"] + pad * 2),
        "height": min(b["height"] + pad * 2, max_height),
    }


def section_shot(page, heading, name, max_height=1600):
    sec = page.query_selector(f"main section:has(h2:text('{heading}'))")
    if not sec:
        return
    sec.scroll_into_view_if_needed()
    page.wait_for_timeout(1600)
    clip = clip_of(sec, max_height=max_height)
    if clip:
        shot(page, name, clip=clip)


def strip_artwork():
    """A stand-in advertisement, drawn at the wide strip's exact proportion."""
    from io import BytesIO

    from PIL import Image, ImageDraw

    img = Image.new("RGB", (1650, 300), (22, 38, 66))
    d = ImageDraw.Draw(img)
    d.rectangle([40, 40, 1610, 260], outline=(212, 175, 122), width=3)
    d.text((90, 120), "SUNRISE MOTORS", fill=(245, 238, 228))
    d.text((90, 170), "Servicing  -  Repairs  -  Tyres  -  (905) 555 0182", fill=(212, 175, 122))
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def capture():
    if not SESSION.exists():
        sys.exit(
            f"No saved session at {SESSION}.\n"
            f"Run:  python {pathlib.Path(__file__).name} {PORT} --sign-in"
        )

    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport=VIEWPORT, device_scale_factor=2,
                                  storage_state=str(SESSION))
        page = ctx.new_page()

        page.goto(f"{BASE}/admin/banners", wait_until="domcontentloaded", timeout=120000)
        settle(page, 4000)
        if "/admin/login" in page.url:
            sys.exit("The saved session has expired. Run again with --sign-in.")

        # ── 1. The desk, as it opens ────────────────────────────────────────
        print("Where ads appear")
        shot(page, "01-desk-top")
        clip = clip_of(page.query_selector("main > div:nth-of-type(1)"), pad=14)
        if clip:
            shot(page, "02-figures", clip=clip)

        section_shot(page, "Home page", "03-map-home")
        section_shot(page, "Archive", "04-map-archive", max_height=1400)
        section_shot(page, "Edition reader", "05-map-reader", max_height=1400)
        section_shot(page, "Every page", "06-map-everywhere", max_height=1400)

        # ── 2. A slot opened, empty and full ────────────────────────────────
        print("Slot detail")
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(600)
        for label, name in (("Home — feature block", "07-slot-detail"),
                            ("Side rail — every page", "08-slot-detail-full")):
            btn = page.query_selector(f"main button:has-text('{label}')")
            if not btn:
                continue
            btn.click()
            settle(page, 2500)
            shot(page, name)
            page.keyboard.press("Escape")
            page.wait_for_timeout(800)

        # ── 3. All bookings ─────────────────────────────────────────────────
        print("All bookings")
        page.click("button:has-text('All bookings')")
        settle(page, 2500)
        shot(page, "09-list")

        clip = clip_of(page.query_selector("main section div.rounded-lg.border"), pad=8)
        if clip:
            shot(page, "10-booking-row", clip=clip)

        bar = page.query_selector("main input[type=search]")
        if bar:
            b = bar.bounding_box()
            if b:
                shot(page, "11-filters", clip={
                    "x": 40, "y": max(0, b["y"] - 14),
                    "width": VIEWPORT["width"] - 80, "height": b["height"] + 28,
                })

        # ── 4. A booking previewed in position ──────────────────────────────
        print("Preview in position")
        prev = page.query_selector("main button:has-text('Preview')")
        if prev:
            prev.click()
            settle(page, 3000)
            shot(page, "12-preview-in-position")
            page.keyboard.press("Escape")
            page.wait_for_timeout(800)

        # ── 5. Schedule ─────────────────────────────────────────────────────
        print("Schedule")
        page.click("button:has-text('Schedule')")
        settle(page, 2500)
        shot(page, "13-schedule")

        # ── 6. Booking an ad ────────────────────────────────────────────────
        print("Booking form")
        page.goto(f"{BASE}/admin/banners/new?placement=home_feature",
                  wait_until="domcontentloaded", timeout=120000)
        settle(page, 4000)
        shot(page, "14-book-step1")

        # Artwork is put through the form so the live preview has something in
        # it. Nothing is submitted: no booking is created by this script.
        page.set_input_files("form input[type=file]", {
            "name": "sunrise-motors.png", "mimeType": "image/png", "buffer": strip_artwork(),
        })
        page.wait_for_timeout(1200)
        page.fill("#clientName", "Sunrise Motors")
        page.fill("#targetUrl", "https://sunrisemotors.example.com")
        page.wait_for_timeout(1500)

        for heading, name in (("The artwork", "15-book-artwork"),
                              ("When does it run", "16-book-dates")):
            sec = page.query_selector(f"form section:has(h2:text('{heading}'))")
            if not sec:
                continue
            sec.scroll_into_view_if_needed()
            page.wait_for_timeout(1400)
            shot(page, name)

        aside = page.query_selector("form aside > div")
        if aside:
            page.evaluate("window.scrollTo(0, 0)")
            page.wait_for_timeout(1200)
            clip = clip_of(aside, pad=8, max_height=1500)
            if clip:
                shot(page, "17-book-preview", clip=clip)

        # ── 7. Editing ──────────────────────────────────────────────────────
        print("Edit form")
        page.goto(f"{BASE}/admin/banners", wait_until="domcontentloaded", timeout=120000)
        settle(page, 3000)
        page.click("button:has-text('All bookings')")
        settle(page, 2000)
        edit = page.query_selector("main a:has-text('Edit')")
        if edit:
            edit.click()
            settle(page, 4500)
            shot(page, "18-edit")

        ctx.close()
        browser.close()

    print(f"\nSaved to {OUT}")


if __name__ == "__main__":
    sign_in() if SIGN_IN else capture()
