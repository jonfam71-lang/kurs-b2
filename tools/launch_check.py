"""Открывает приложение через ярлык на рабочем столе и проверяет, что новая версия отвечает."""
import ctypes
import json
import os
import time
import urllib.request
from ctypes import wintypes
from pathlib import Path

buf = ctypes.create_unicode_buffer(wintypes.MAX_PATH)
ctypes.windll.shell32.SHGetFolderPathW(None, 0x0000, None, 0, buf)  # рабочий стол
link = Path(buf.value) / "Курс на B2.lnk"
print("shortcut exists:", link.is_file())
t0 = time.time()
os.startfile(link)


def get(path, headers=None):
    req = urllib.request.Request("http://127.0.0.1:8765" + path, headers=headers or {})
    with urllib.request.urlopen(req, timeout=2) as r:
        return r.status, r.read()


ok = None
while time.time() - t0 < 20 and ok is None:
    try:
        ok = json.loads(get("/api/ping")[1])
    except OSError:
        time.sleep(0.2)
print("ping:", ok, "after %.1f s" % (time.time() - t0))
for path in ("/", "/static/core.js", "/static/lesson.js", "/static/content/lessons-2.js", "/static/app.css", "/static/img/hero.jpg"):
    status, body = get(path)
    print(path, status, len(body), "bytes")
state = json.loads(get("/api/state", {"X-Kurs": "1"})[1])
s = state["state"] or {}
print("progress: start", s.get("start"), "| cards", len(s.get("cards", {})), "| new-format lessons", list((s.get("lp") or {}).keys()), "| ai configured:", bool(state["ai"]))
