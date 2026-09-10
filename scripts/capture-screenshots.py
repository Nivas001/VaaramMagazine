#!/usr/bin/env python3
"""
Captures high-resolution screenshots of the Vaaram Magazine public site
and authenticated admin portal via Chrome DevTools Protocol (CDP).
"""
import base64
import json
import os
import pathlib
import subprocess
import time
import urllib.request
import websocket

CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE_URL = "https://vaaram-magazine.vercel.app"
OUT_DIR = pathlib.Path(__file__).resolve().parent.parent / "documents" / "screenshots"
OUT_DIR.mkdir(parents=True, exist_ok=True)

msg_id = 0


def cdp(ws, method, params=None):
    global msg_id
    msg_id += 1
    req = {"id": msg_id, "method": method, "params": params or {}}
    ws.send(json.dumps(req))
    while True:
        res = json.loads(ws.recv())
        if res.get("id") == msg_id:
            return res.get("result", {})


def eval_js(ws, expr):
    res = cdp(ws, "Runtime.evaluate", {"expression": expr, "returnByValue": True, "awaitPromise": True})
    return res.get("result", {}).get("value")


def screenshot(ws, filepath):
    res = cdp(ws, "Page.captureScreenshot", {"format": "png"})
    data = base64.b64decode(res["data"])
    with open(filepath, "wb") as f:
        f.write(data)
    print(f"Captured: {filepath} ({len(data)} bytes)")


def wait_loaded(ws, timeout=8):
    start = time.time()
    while time.time() - start < timeout:
        state = eval_js(ws, "document.readyState")
        if state == "complete":
            time.sleep(1.0)
            return True
        time.sleep(0.3)
    return False


def main():
    chrome_proc = subprocess.Popen(
        [
            CHROME_BIN,
            "--headless=new",
            "--remote-debugging-port=9222",
            "--remote-allow-origins=*",
            "--user-data-dir=/tmp/vaaram-chrome-profile",
            "--window-size=1280,840",
            "--disable-gpu",
            "--no-sandbox",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(2.0)

    try:
        # Get websocket URL
        with urllib.request.urlopen("http://127.0.0.1:9222/json") as r:
            targets = json.loads(r.read().decode("utf-8"))
            ws_url = targets[0]["webSocketDebuggerUrl"]

        ws = websocket.create_connection(ws_url, timeout=30)
        cdp(ws, "Page.enable")
        cdp(ws, "Runtime.enable")

        # 1. Public Homepage
        print("Capturing Public Homepage...")
        cdp(ws, "Page.navigate", {"url": f"{BASE_URL}/"})
        wait_loaded(ws)
        time.sleep(2.0)
        screenshot(ws, OUT_DIR / "01-public-home.png")

        # 2. Public Archives
        print("Capturing Public Archives...")
        cdp(ws, "Page.navigate", {"url": f"{BASE_URL}/archives"})
        wait_loaded(ws)
        time.sleep(1.5)
        screenshot(ws, OUT_DIR / "02-public-archives.png")

        # 3. Public Reader
        print("Capturing Public Reader...")
        cdp(ws, "Page.navigate", {"url": f"{BASE_URL}/archives/2026-09-10-weekly-testing-advertisement"})
        wait_loaded(ws)
        time.sleep(3.0)  # wait for pdf canvas
        screenshot(ws, OUT_DIR / "03-public-reader.png")

        # 4. Public Contact
        print("Capturing Public Contact...")
        cdp(ws, "Page.navigate", {"url": f"{BASE_URL}/contact"})
        wait_loaded(ws)
        time.sleep(1.5)
        screenshot(ws, OUT_DIR / "04-public-contact.png")

        # 5. Admin Login Page
        print("Capturing Admin Login...")
        cdp(ws, "Page.navigate", {"url": f"{BASE_URL}/admin/login"})
        wait_loaded(ws)
        time.sleep(1.0)
        screenshot(ws, OUT_DIR / "05-admin-login.png")

        # 6. Perform Admin Login
        print("Performing Admin Login...")
        eval_js(ws, """
            const emailInput = document.querySelector('input[type="email"]');
            const passInput = document.querySelector('input[type="password"]');
            if (emailInput && passInput) {
                emailInput.value = 'contact@vaaram.ca';
                emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                passInput.value = 'Vaaram27#';
                passInput.dispatchEvent(new Event('input', { bubbles: true }));
                const form = emailInput.closest('form');
                if (form) form.requestSubmit();
            }
        """)
        time.sleep(4.0)

        # 7. Admin Dashboard Overview
        print("Capturing Admin Overview...")
        cdp(ws, "Page.navigate", {"url": f"{BASE_URL}/admin"})
        wait_loaded(ws)
        time.sleep(2.0)
        screenshot(ws, OUT_DIR / "06-admin-dashboard.png")

        # 8. Admin Issues List
        print("Capturing Admin Issues...")
        cdp(ws, "Page.navigate", {"url": f"{BASE_URL}/admin/issues"})
        wait_loaded(ws)
        time.sleep(2.0)
        screenshot(ws, OUT_DIR / "07-admin-issues.png")

        # 9. Admin New Issue Publishing Form
        print("Capturing Admin New Issue Form...")
        cdp(ws, "Page.navigate", {"url": f"{BASE_URL}/admin/issues/new"})
        wait_loaded(ws)
        time.sleep(2.0)
        screenshot(ws, OUT_DIR / "08-admin-new-issue.png")

        # 10. Admin Issue Edit Form
        print("Capturing Admin Issue Edit Form...")
        cdp(ws, "Page.navigate", {"url": f"{BASE_URL}/admin/issues/8fe40bb7-23df-4d66-842c-a1b6a472b4f6/edit"})
        wait_loaded(ws)
        time.sleep(2.0)
        screenshot(ws, OUT_DIR / "09-admin-edit-issue.png")

        # 11. Admin Banners
        print("Capturing Admin Banners...")
        cdp(ws, "Page.navigate", {"url": f"{BASE_URL}/admin/banners"})
        wait_loaded(ws)
        time.sleep(2.0)
        screenshot(ws, OUT_DIR / "10-admin-banners.png")

        # 12. Admin Enquiries Inbox
        print("Capturing Admin Enquiries...")
        cdp(ws, "Page.navigate", {"url": f"{BASE_URL}/admin/enquiries"})
        wait_loaded(ws)
        time.sleep(2.0)
        screenshot(ws, OUT_DIR / "11-admin-enquiries.png")

        # 13. Admin Subscribers
        print("Capturing Admin Subscribers...")
        cdp(ws, "Page.navigate", {"url": f"{BASE_URL}/admin/subscribers"})
        wait_loaded(ws)
        time.sleep(2.0)
        screenshot(ws, OUT_DIR / "12-admin-subscribers.png")

        ws.close()
        print("All screenshots successfully captured!")

    finally:
        chrome_proc.terminate()
        chrome_proc.wait()


if __name__ == "__main__":
    main()
