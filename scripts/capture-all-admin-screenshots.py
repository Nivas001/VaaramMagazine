#!/usr/bin/env python3
"""
Captures all authenticated admin portal screenshots for client documentation.
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


def send(ws, method, params=None):
    global msg_id
    msg_id += 1
    ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
    while True:
        r = json.loads(ws.recv())
        if r.get("id") == msg_id:
            return r.get("result", {})


def capture(ws, filepath):
    res = send(ws, "Page.captureScreenshot", {"format": "png"})
    data = base64.b64decode(res["data"])
    with open(filepath, "wb") as f:
        f.write(data)
    print(f"Captured: {filepath} ({len(data)} bytes)")


def wait_page(ws, seconds=2.0):
    time.sleep(seconds)


def main():
    chrome = subprocess.Popen(
        [
            CHROME_BIN,
            "--headless=new",
            "--remote-debugging-port=9222",
            "--remote-allow-origins=*",
            "--user-data-dir=/tmp/vaaram-admin-screens",
            "--window-size=1280,860",
            "--disable-gpu",
            "--no-sandbox",
            f"{BASE_URL}/admin/login",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(2.5)

    try:
        with urllib.request.urlopen("http://127.0.0.1:9222/json") as r:
            targets = json.loads(r.read().decode("utf-8"))
            page = [t for t in targets if t.get("type") == "page"][0]
            ws_url = page["webSocketDebuggerUrl"]

        ws = websocket.create_connection(ws_url, timeout=15)
        send(ws, "Runtime.enable")
        send(ws, "Page.enable")

        print("Logging into Admin Portal...")
        login_js = """
            (() => {
                const setVal = (el, val) => {
                    const proto = Object.getPrototypeOf(el);
                    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
                    setter.call(el, val);
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                };
                const email = document.querySelector('input[type="email"]');
                const pass = document.querySelector('input[type="password"]');
                setVal(email, 'contact@vaaram.ca');
                setVal(pass, 'Vaaram27#');
                const submitBtn = document.querySelector('button[type="submit"]');
                submitBtn.click();
            })();
        """
        send(ws, "Runtime.evaluate", {"expression": login_js})
        time.sleep(4.5)

        # 1. Dashboard Overview
        print("Capturing 06-admin-dashboard...")
        capture(ws, OUT_DIR / "06-admin-dashboard.png")

        # 2. Issues List
        print("Capturing 07-admin-issues...")
        send(ws, "Page.navigate", {"url": f"{BASE_URL}/admin/issues"})
        wait_page(ws, 3.0)
        capture(ws, OUT_DIR / "07-admin-issues.png")

        # 3. New Issue Form
        print("Capturing 08-admin-new-issue...")
        send(ws, "Page.navigate", {"url": f"{BASE_URL}/admin/issues/new"})
        wait_page(ws, 3.0)
        capture(ws, OUT_DIR / "08-admin-new-issue.png")

        # 4. Edit Issue Form
        print("Capturing 09-admin-edit-issue...")
        send(ws, "Page.navigate", {"url": f"{BASE_URL}/admin/issues/8fe40bb7-23df-4d66-842c-a1b6a472b4f6/edit"})
        wait_page(ws, 3.0)
        capture(ws, OUT_DIR / "09-admin-edit-issue.png")

        # 5. Banners Manager
        print("Capturing 10-admin-banners...")
        send(ws, "Page.navigate", {"url": f"{BASE_URL}/admin/banners"})
        wait_page(ws, 3.0)
        capture(ws, OUT_DIR / "10-admin-banners.png")

        # 6. Enquiries Inbox
        print("Capturing 11-admin-enquiries...")
        send(ws, "Page.navigate", {"url": f"{BASE_URL}/admin/enquiries"})
        wait_page(ws, 3.0)
        capture(ws, OUT_DIR / "11-admin-enquiries.png")

        # 7. Subscribers List
        print("Capturing 12-admin-subscribers...")
        send(ws, "Page.navigate", {"url": f"{BASE_URL}/admin/subscribers"})
        wait_page(ws, 3.0)
        capture(ws, OUT_DIR / "12-admin-subscribers.png")

        ws.close()
        print("Done capturing all admin screenshots!")
    finally:
        chrome.terminate()
        chrome.wait()


if __name__ == "__main__":
    main()
