#!/usr/bin/env python3
"""
Retakes and additions for the advertising guide.

Separate from capture-advertising-screenshots.py because that script books a
real advertiser as it runs, and must not be re-run to fix a framing problem.
"""
import pathlib

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "documents" / "ad-screenshots"
OUT.mkdir(parents=True, exist_ok=True)

BASE = "https://vaaram-magazine.vercel.app"
EMAIL = "contact@vaaram.ca"
PASSWORD = "Vaaram27#"
DESKTOP = {"width": 1440, "height": 1000}


def shot(page, name, clip=None, full=False):
    path = OUT / f"{name}.png"
    page.screenshot(path=str(path), clip=clip, full_page=full)
    print(f"  {name:<34} {path.stat().st_size // 1024:>5} KB")


def settle(page, ms=1600):
    try:
        page.wait_for_load_state("networkidle", timeout=12000)
    except Exception:
        pass
    page.wait_for_timeout(ms)


def stop_motion(page):
    page.add_style_tag(content="*,*::before,*::after{animation-duration:0s!important;"
                               "animation-delay:0s!important;transition-duration:0s!important;"
                               "transition-delay:0s!important}")


def scroll_through(page):
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


def hide_sticky(page):
    """The sticky navigation floats over whatever is photographed underneath
    it, which in a cropped figure reads as a rendering fault rather than as
    the header it is."""
    page.evaluate("""() => {
        document.querySelectorAll('header, [class*="sticky"], [class*="fixed"]').forEach(el => {
            const pos = getComputedStyle(el).position;
            if (pos === 'sticky' || pos === 'fixed') el.style.visibility = 'hidden';
        });
    }""")
    page.wait_for_timeout(300)


def sign_in(page):
    """The login screen deliberately empties the email box shortly after it
    mounts, so a value typed too early is wiped. Type, check, and retype."""
    page.goto(f"{BASE}/admin/login", wait_until="domcontentloaded")
    settle(page, 2500)

    for attempt in range(6):
        page.fill("input[type='email']", EMAIL)
        page.fill("input[type='password']", PASSWORD)
        page.wait_for_timeout(900)
        if page.input_value("input[type='email']") == EMAIL:
            break
        print(f"    email box cleared itself, retyping ({attempt + 1})")
    else:
        raise RuntimeError("Could not keep the email in the login form.")

    page.click("button[type='submit']")
    # The dashboard's navigation is the only reliable proof of a session; the
    # URL alone matches the login page too.
    page.wait_for_selector("a[href='/admin/banners']", timeout=45000)
    settle(page, 2000)
    print("    signed in")


def public(browser):
    print("\nPUBLIC RETAKES")
    ctx = browser.new_context(viewport=DESKTOP, device_scale_factor=2)
    page = ctx.new_page()

    page.goto(BASE, wait_until="domcontentloaded")
    settle(page)
    stop_motion(page)
    scroll_through(page)

    # ── The side rail beside the content, framed from the page edge ─────────
    rail = page.locator("[data-ad-rail]").first
    rail.scroll_into_view_if_needed()
    page.wait_for_timeout(500)
    # Put the rail's top 70px down the viewport, clear of the header.
    page.evaluate("""() => {
        const r = document.querySelector('[data-ad-rail]');
        window.scrollTo(0, window.scrollY + r.getBoundingClientRect().top - 70);
    }""")
    page.wait_for_timeout(800)
    hide_sticky(page)
    shot(page, "public-01-side-rail", clip={"x": 0, "y": 40, "width": 1440, "height": 960})

    # ── The whole home page, top to bottom, as a map of where slots sit ─────
    page.reload(wait_until="domcontentloaded")
    settle(page)
    stop_motion(page)
    scroll_through(page)
    shot(page, "public-12-home-full", full=True)

    # ── An unsold slot, with enough page around it to be recognisable ───────
    page.evaluate("window.scrollTo(0,0)")
    page.wait_for_timeout(400)
    house = page.locator("[data-ad-house]").first
    if house.count():
        house.scroll_into_view_if_needed()
        page.wait_for_timeout(500)
        page.evaluate("""() => {
            const h = document.querySelector('[data-ad-house]');
            window.scrollTo(0, window.scrollY + h.getBoundingClientRect().top - 120);
        }""")
        page.wait_for_timeout(700)
        hide_sticky(page)
        shot(page, "public-05-empty-slot", clip={"x": 0, "y": 40, "width": 1440, "height": 430})

    ctx.close()


def admin(browser):
    print("\nADMIN RETAKES")
    ctx = browser.new_context(viewport={"width": 1440, "height": 1150},
                              device_scale_factor=2)
    page = ctx.new_page()

    sign_in(page)

    # The dashboard, which is where the publisher lands and where Banners is
    # reached from.
    page.goto(f"{BASE}/admin", wait_until="domcontentloaded")
    settle(page, 2500)
    stop_motion(page)
    shot(page, "admin-02-dashboard")

    page.goto(f"{BASE}/admin/banners", wait_until="domcontentloaded")
    settle(page, 2500)
    stop_motion(page)
    scroll_through(page)

    # The screen as it now stands, with the worked example in place.
    shot(page, "admin-03-banners-overview")

    # The hidden booking: saved, listed, and not on the website.
    row = page.locator("text=Silverline Auto Glass").first
    if row.count():
        row.scroll_into_view_if_needed()
        page.wait_for_timeout(600)
        b = row.bounding_box()
        if b:
            shot(page, "admin-13-hidden-row", clip={
                "x": max(0, b["x"] - 340), "y": max(0, b["y"] - 70),
                "width": min(880, 1440 - max(0, b["x"] - 340)), "height": 270,
            })

    # The footer group — four cards in a placement that wraps into a grid.
    head = page.locator("h2:has-text('Every page — above the footer')").first
    if head.count():
        head.scroll_into_view_if_needed()
        page.wait_for_timeout(600)
        b = head.bounding_box()
        if b:
            shot(page, "admin-14-footer-group", clip={
                "x": max(0, b["x"] - 20), "y": max(0, b["y"] - 26),
                "width": min(900, 1440 - max(0, b["x"] - 20)), "height": 780,
            })

    # The strip groups, where two advertisers share one rotating slot.
    head = page.locator("h2:has-text('Home — mid page')").first
    if head.count():
        head.scroll_into_view_if_needed()
        page.wait_for_timeout(600)
        b = head.bounding_box()
        if b:
            shot(page, "admin-15-strip-group", clip={
                "x": max(0, b["x"] - 20), "y": max(0, b["y"] - 26),
                "width": min(900, 1440 - max(0, b["x"] - 20)), "height": 470,
            })

    ctx.close()


def main():
    import sys
    only = sys.argv[1] if len(sys.argv) > 1 else "all"
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--force-color-profile=srgb"])
        try:
            if only in ("all", "public"):
                public(browser)
            if only in ("all", "admin"):
                admin(browser)
        finally:
            browser.close()
    print("\nretakes done")


if __name__ == "__main__":
    main()
