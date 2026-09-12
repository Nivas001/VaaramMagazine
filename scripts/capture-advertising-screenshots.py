#!/usr/bin/env python3
"""
─────────────────────────────────────────────────────────────────────────────
 VAARAM MAGAZINE — SCREENSHOTS FOR THE ADVERTISING GUIDE

 Drives the real, live website and the real admin dashboard and photographs
 both, so every picture in the advertising guide is the actual product rather
 than a mock-up.

 Two halves:

   PUBLIC  — the side rail, the wide strips, the footer grid and the empty
             "book this slot" panels, on a desktop and on a phone.

   ADMIN   — signing in, the Banners screen, and a genuine end-to-end booking
             of one new advertiser, photographed at every step, including the
             artwork actually being attached and uploaded.

 Output: documents/ad-screenshots/*.png

 Run: python scripts/capture-advertising-screenshots.py
─────────────────────────────────────────────────────────────────────────────
"""
import pathlib
import sys
import time

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "documents" / "ad-screenshots"
OUT.mkdir(parents=True, exist_ok=True)

BASE = "https://vaaram-magazine.vercel.app"
EMAIL = "contact@vaaram.ca"
PASSWORD = "Vaaram27#"

# The advertiser booked live, on camera, for the worked example.
EXAMPLE = {
    "art": ROOT / "public" / "demo-ads" / "card-14-kandan-electronics.jpg",
    "client": "Kandan Electronics",
    "url": "https://vaaram-magazine.vercel.app/contact?ref=vaaram-demo",
    "position": "80",
    "expires": "2027-03-31",
}

DESKTOP = {"width": 1440, "height": 1000}
PHONE = {"width": 414, "height": 896}

shots = []


def shot(page, name, clip=None, full=False):
    path = OUT / f"{name}.png"
    page.screenshot(path=str(path), clip=clip, full_page=full)
    size = path.stat().st_size
    shots.append(name)
    print(f"  {name:<34} {size // 1024:>5} KB")
    return path


def settle(page, ms=1600):
    """Let fonts, lazy artwork and the reveal animations finish."""
    try:
        page.wait_for_load_state("networkidle", timeout=12000)
    except Exception:
        pass
    page.wait_for_timeout(ms)


def stop_motion(page):
    """Freeze animation so a capture never lands mid-transition, and make sure
    every reveal-on-scroll block has actually revealed itself."""
    page.add_style_tag(content="""
        *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
        }
    """)


def scroll_through(page):
    """Walk the page top to bottom so lazily-loaded banner artwork is fetched
    and every reveal has fired before anything is photographed."""
    page.evaluate("""async () => {
        const step = window.innerHeight * 0.7;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
            window.scrollTo(0, y);
            await new Promise(r => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
        await new Promise(r => setTimeout(r, 400));
    }""")
    page.wait_for_timeout(700)


def box_of(page, selector, pad=16, index=0):
    """A clip rectangle around one element, padded, clamped to the viewport."""
    el = page.locator(selector).nth(index)
    if el.count() == 0:
        return None
    try:
        el.scroll_into_view_if_needed(timeout=5000)
    except Exception:
        return None
    page.wait_for_timeout(500)
    b = el.bounding_box()
    if not b:
        return None
    vw = page.viewport_size["width"]
    x = max(0, b["x"] - pad)
    y = max(0, b["y"] - pad)
    return {
        "x": x,
        "y": y,
        "width": min(b["width"] + pad * 2, vw - x),
        "height": b["height"] + pad * 2,
    }


# ═════════════════════════════════════════════════════════════════════════════
#  PART ONE — the public website with the demonstration bookings running
# ═════════════════════════════════════════════════════════════════════════════
def capture_public(browser):
    print("\nPUBLIC WEBSITE")
    ctx = browser.new_context(viewport=DESKTOP, device_scale_factor=2)
    page = ctx.new_page()

    # ── Home ────────────────────────────────────────────────────────────────
    page.goto(BASE, wait_until="domcontentloaded")
    settle(page)
    stop_motion(page)
    scroll_through(page)

    # The side rail beside the content — the placement the publisher asked
    # about, photographed with enough of the content column beside it to show
    # the relationship.
    rail = page.locator("[data-ad-rail]").first
    rail.scroll_into_view_if_needed()
    page.wait_for_timeout(600)
    b = rail.bounding_box()
    if b:
        shot(page, "public-01-side-rail", clip={
            "x": max(0, b["x"] - 24), "y": max(0, b["y"] - 40),
            "width": min(DESKTOP["width"] - max(0, b["x"] - 24), 1180),
            "height": min(b["height"] + 80, 980),
        })

    # The whole home page, small, so the rail can be seen in its place.
    page.evaluate("window.scrollTo(0,0)")
    page.wait_for_timeout(500)
    shot(page, "public-02-home-top")

    # The leaderboard strip under the hero.
    clip = box_of(page, "[data-ad-placement='home_hero']", pad=22)
    if clip:
        shot(page, "public-03-strip-home-hero", clip=clip)

    # The rotating strip — two advertisers in one slot, with its dots.
    clip = box_of(page, "[data-ad-placement='home_mid']", pad=22)
    if clip:
        shot(page, "public-04-strip-rotating", clip=clip)

    # An unsold slot, still selling itself.
    clip = box_of(page, "[data-ad-house]", pad=22)
    if clip:
        shot(page, "public-05-empty-slot", clip=clip)

    # The footer grid.
    clip = box_of(page, "[data-ad-placement='footer']", pad=24)
    if clip:
        shot(page, "public-06-footer-grid", clip=clip)

    # ── Archive ─────────────────────────────────────────────────────────────
    page.goto(f"{BASE}/archives", wait_until="domcontentloaded")
    settle(page)
    stop_motion(page)
    scroll_through(page)
    shot(page, "public-07-archive-top")

    # ── Inside an edition ───────────────────────────────────────────────────
    page.goto(f"{BASE}/archives", wait_until="domcontentloaded")
    settle(page)
    link = page.locator("a[href^='/archives/']").first
    if link.count():
        href = link.get_attribute("href")
        page.goto(f"{BASE}{href}", wait_until="domcontentloaded")
        settle(page, 3000)
        stop_motion(page)
        scroll_through(page)
        shot(page, "public-08-reader-top")

        r = page.locator("[data-ad-rail]").first
        if r.count():
            try:
                r.scroll_into_view_if_needed(timeout=5000)
                page.wait_for_timeout(600)
                shot(page, "public-09-reader-rail")
            except Exception:
                pass

    ctx.close()

    # ── The same page on a phone ────────────────────────────────────────────
    ctx = browser.new_context(viewport=PHONE, device_scale_factor=2, is_mobile=True,
                              has_touch=True)
    page = ctx.new_page()
    page.goto(BASE, wait_until="domcontentloaded")
    settle(page)
    stop_motion(page)
    scroll_through(page)

    group = page.locator("[data-ad-rail-group]").first
    if group.count():
        try:
            group.scroll_into_view_if_needed(timeout=5000)
            page.wait_for_timeout(600)
            shot(page, "public-10-phone-threaded")
        except Exception:
            shot(page, "public-10-phone-threaded")
    else:
        shot(page, "public-10-phone-threaded")
    ctx.close()


# ═════════════════════════════════════════════════════════════════════════════
#  PART TWO — the admin dashboard, and one real booking made on camera
# ═════════════════════════════════════════════════════════════════════════════
def capture_admin(browser):
    print("\nADMIN DASHBOARD")
    ctx = browser.new_context(viewport={"width": 1440, "height": 1150},
                              device_scale_factor=2)
    page = ctx.new_page()

    # ── Signing in ──────────────────────────────────────────────────────────
    page.goto(f"{BASE}/admin/login", wait_until="domcontentloaded")
    settle(page)
    stop_motion(page)

    page.fill("input[type='email']", EMAIL)
    page.fill("input[type='password']", PASSWORD)
    page.wait_for_timeout(400)
    shot(page, "admin-01-login")

    page.click("button[type='submit']")
    page.wait_for_url("**/admin**", timeout=45000)
    settle(page, 2500)
    stop_motion(page)
    shot(page, "admin-02-dashboard")

    # ── The Banners screen as it stands ─────────────────────────────────────
    page.goto(f"{BASE}/admin/banners", wait_until="domcontentloaded")
    settle(page, 2500)
    stop_motion(page)
    scroll_through(page)
    shot(page, "admin-03-banners-overview")

    # The form on its own, empty and ready.
    form = page.locator("form").first
    clip = box_of(page, "form", pad=18)
    if clip:
        clip["height"] = min(clip["height"], 1100)
        shot(page, "admin-04-form-empty", clip=clip)

    # The placement list, which is the whole catalogue of what can be sold.
    select = page.locator("select#placement")
    options = page.evaluate("""() => {
        const s = document.querySelector('#placement');
        if (!s) return [];
        return [...s.querySelectorAll('optgroup')].map(g => ({
            group: g.label,
            options: [...g.querySelectorAll('option')].map(o => ({ value: o.value, label: o.textContent }))
        }));
    }""")
    print("\n  Placements offered by the form:")
    for g in options:
        print(f"    {g['group']}")
        for o in g["options"]:
            print(f"      - {o['label']}  [{o['value']}]")
    print()

    # ── STEP 1: choose the placement ────────────────────────────────────────
    select.select_option("site_rail")
    page.wait_for_timeout(700)
    clip = box_of(page, "form", pad=18)
    if clip:
        clip["height"] = min(clip["height"], 620)
        shot(page, "admin-05-step1-placement", clip=clip)

    # ── STEP 2: attach the artwork, for real ────────────────────────────────
    page.set_input_files("input[type='file']", str(EXAMPLE["art"]))
    page.wait_for_timeout(1200)
    clip = box_of(page, "form", pad=18)
    if clip:
        clip["height"] = min(clip["height"], 700)
        shot(page, "admin-06-step2-artwork", clip=clip)

    # ── STEP 3: the advertiser's details ────────────────────────────────────
    page.fill("#clientName", EXAMPLE["client"])
    page.fill("#targetUrl", EXAMPLE["url"])
    page.fill("#sortOrder", EXAMPLE["position"])
    page.fill("#expiresAt", EXAMPLE["expires"])
    page.wait_for_timeout(600)
    clip = box_of(page, "form", pad=18)
    if clip:
        clip["height"] = min(clip["height"], 1180)
        shot(page, "admin-07-step3-filled", clip=clip)

    # ── STEP 4: save it ─────────────────────────────────────────────────────
    print("  submitting the booking…")
    page.click("form button[type='submit']")

    # Catch the upload progress bar if it is on screen long enough.
    try:
        page.wait_for_selector("text=/Uploading|Preparing|Saving/", timeout=4000)
        page.wait_for_timeout(300)
        clip = box_of(page, "form", pad=18)
        if clip:
            clip["height"] = min(clip["height"], 1180)
            shot(page, "admin-08-step4-uploading", clip=clip)
    except Exception:
        print("  (upload finished too quickly to photograph the progress bar)")

    # Wait for the form to clear, which is how it reports success.
    for _ in range(40):
        page.wait_for_timeout(1000)
        if (page.input_value("#clientName") or "") == "":
            break
    settle(page, 2500)
    stop_motion(page)
    scroll_through(page)
    shot(page, "admin-09-step5-saved")

    # ── The row this created, with its counters and controls ────────────────
    row = page.locator(f"text={EXAMPLE['client']}").first
    if row.count():
        try:
            row.scroll_into_view_if_needed(timeout=5000)
            page.wait_for_timeout(700)
            b = row.bounding_box()
            if b:
                shot(page, "admin-10-banner-row", clip={
                    "x": max(0, b["x"] - 340), "y": max(0, b["y"] - 70),
                    "width": min(860, 1440 - max(0, b["x"] - 340)),
                    "height": 280,
                })
        except Exception:
            pass

    # A whole placement group, so ordering and the Hidden row can both be seen.
    heading = page.locator("h2:has-text('Side rail — every page')").first
    if heading.count():
        try:
            heading.scroll_into_view_if_needed(timeout=5000)
            page.wait_for_timeout(700)
            b = heading.bounding_box()
            if b:
                shot(page, "admin-11-rail-group", clip={
                    "x": max(0, b["x"] - 20), "y": max(0, b["y"] - 24),
                    "width": min(900, 1440 - max(0, b["x"] - 20)),
                    "height": 1050,
                })
        except Exception:
            pass

    # ── The edit screen ─────────────────────────────────────────────────────
    edit = page.locator("a[href*='/admin/banners/'][href$='/edit']").first
    if edit.count():
        href = edit.get_attribute("href")
        page.goto(f"{BASE}{href}", wait_until="domcontentloaded")
        settle(page, 2200)
        stop_motion(page)
        shot(page, "admin-12-edit-banner")

    ctx.close()


def capture_result(browser):
    """The advertiser just booked, now live on the website."""
    print("\nTHE BOOKING, LIVE")
    ctx = browser.new_context(viewport=DESKTOP, device_scale_factor=2)
    page = ctx.new_page()

    # The public pages revalidate every 60 seconds; the booking is also
    # explicitly revalidated on save, but give it a moment either way.
    time.sleep(8)
    page.goto(f"{BASE}?t={int(time.time())}", wait_until="domcontentloaded")
    settle(page, 2500)
    stop_motion(page)
    scroll_through(page)

    found = page.locator(f"img[alt*='{EXAMPLE['client']}']").first
    if found.count():
        try:
            found.scroll_into_view_if_needed(timeout=5000)
            page.wait_for_timeout(700)
            b = found.bounding_box()
            if b:
                shot(page, "public-11-example-live", clip={
                    "x": max(0, b["x"] - 26), "y": max(0, b["y"] - 58),
                    "width": min(b["width"] + 52, DESKTOP["width"]),
                    "height": b["height"] + 92,
                })
        except Exception:
            pass
    else:
        print("  (the new booking has not appeared on the home page yet)")

    ctx.close()


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--force-color-profile=srgb"])
        try:
            capture_public(browser)
            capture_admin(browser)
            capture_result(browser)
        finally:
            browser.close()

    print(f"\n{len(shots)} screenshots -> {OUT}")


if __name__ == "__main__":
    sys.exit(main())
