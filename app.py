"""Курс на B2: настольное приложение.

Запускает маленький локальный сервер (доступен только с этого компьютера), открывает окно
приложения и хранит прогресс в папке data рядом с этим файлом. Сторонние пакеты не нужны.
"""
import json
import os
import shutil
import subprocess
import sys
import threading
import time
import urllib.request
import webbrowser
from datetime import date
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
APP_ID = "kurs-b2"
PORTS = range(8765, 8775)
IDLE_SECONDS = 300   # окно не подаёт признаков жизни столько секунд: сервер выключается
BYE_SECONDS = 8      # окно закрыли: выключаемся, если оно не вернулось (при обновлении страницы вернётся)
KEEP_BACKUPS = 30
MAX_BODY = 8 * 1024 * 1024
STATIC = {
    "/": ("index.html", "text/html; charset=utf-8"),
    "/index.html": ("index.html", "text/html; charset=utf-8"),
    "/icon.png": ("icon.png", "image/png"),
}
STATIC_DIR = ROOT / "static"  # стили, скрипты, уроки и картинки
MIME = {
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
}


class Store:
    """Файлы с прогрессом и настройками ИИ."""

    def __init__(self, folder: Path):
        self.folder = folder
        self.state_file = folder / "progress.json"
        self.ai_file = folder / "ai.json"
        self.backups = folder / "backups"
        self.lock = threading.Lock()

    @staticmethod
    def read(path: Path):
        try:
            with open(path, encoding="utf-8") as f:
                return json.load(f)
        except (OSError, ValueError):
            return None

    def _write(self, path: Path, obj):
        self.folder.mkdir(parents=True, exist_ok=True)
        tmp = path.with_suffix(".tmp")
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(obj, f, ensure_ascii=False)
        os.replace(tmp, path)

    def save_state(self, obj):
        with self.lock:
            self._write(self.state_file, obj)
            # одна копия на каждый день: если сегодня что-то сломается, вчерашняя останется
            self.backups.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(self.state_file, self.backups / f"progress-{date.today().isoformat()}.json")
            for old in sorted(self.backups.glob("progress-*.json"))[:-KEEP_BACKUPS]:
                old.unlink(missing_ok=True)

    def save_ai(self, obj):
        with self.lock:
            self._write(self.ai_file, obj)


class Life:
    last_seen = time.monotonic()
    bye_at = None


class Handler(BaseHTTPRequestHandler):
    server_version = "KursB2"
    store: Store = None

    def log_message(self, *args):  # под pythonw консоли нет
        pass

    def _allowed(self):
        """Отвечаем только собственному окну: чужой сайт в браузере не должен читать прогресс и ключ."""
        port = self.server.server_address[1]
        if self.headers.get("Host") not in (f"127.0.0.1:{port}", f"localhost:{port}"):
            return False
        origin = self.headers.get("Origin")
        return origin is None or origin in (f"http://127.0.0.1:{port}", f"http://localhost:{port}")

    def _send(self, code, body, ctype="application/json; charset=utf-8"):
        if isinstance(body, (dict, list)):
            body = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if not self._allowed():
            return self._send(403, {"error": "forbidden"})
        path = self.path.split("?", 1)[0]
        if path in STATIC:
            name, ctype = STATIC[path]
            try:
                return self._send(200, (ROOT / name).read_bytes(), ctype)
            except OSError:
                return self._send(404, {"error": "not found"})
        if path.startswith("/static/"):
            target = (ROOT / path.lstrip("/")).resolve()
            ctype = MIME.get(target.suffix.lower())
            if ctype and STATIC_DIR in target.parents and target.is_file():
                return self._send(200, target.read_bytes(), ctype)
            return self._send(404, {"error": "not found"})
        if path == "/api/ping":
            Life.last_seen, Life.bye_at = time.monotonic(), None
            return self._send(200, {"ok": True, "app": APP_ID})
        if path == "/api/state":
            if self.headers.get("X-Kurs") != "1":
                return self._send(403, {"error": "forbidden"})
            Life.last_seen, Life.bye_at = time.monotonic(), None
            return self._send(200, {"state": Store.read(self.store.state_file), "ai": Store.read(self.store.ai_file)})
        return self._send(404, {"error": "not found"})

    def do_POST(self):
        if not self._allowed():
            return self._send(403, {"error": "forbidden"})
        path = self.path.split("?", 1)[0]
        if path == "/api/bye":
            Life.bye_at = time.monotonic() + BYE_SECONDS
            return self._send(200, {"ok": True})
        if self.headers.get("X-Kurs") != "1":
            return self._send(403, {"error": "forbidden"})
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_BODY:
            return self._send(413, {"error": "bad size"})
        try:
            data = json.loads(self.rfile.read(length).decode("utf-8"))
        except ValueError:
            return self._send(400, {"error": "bad json"})
        if not isinstance(data, dict):
            return self._send(400, {"error": "bad json"})
        Life.last_seen = time.monotonic()
        try:
            if path == "/api/state":
                if data.get("v") != 1 or not isinstance(data.get("cards"), dict) or not isinstance(data.get("days"), dict):
                    return self._send(400, {"error": "not a progress object"})
                self.store.save_state(data)
                return self._send(200, {"ok": True})
            if path == "/api/ai":
                self.store.save_ai(data)
                return self._send(200, {"ok": True})
        except OSError as e:
            return self._send(500, {"error": str(e)})
        return self._send(404, {"error": "not found"})


class Server(ThreadingHTTPServer):
    allow_reuse_address = False  # иначе Windows позволит второй копии занять тот же порт
    daemon_threads = True


def watchdog(server):
    while True:
        time.sleep(1)
        now = time.monotonic()
        if (Life.bye_at is not None and now >= Life.bye_at) or now - Life.last_seen > IDLE_SECONDS:
            server.shutdown()
            return


def is_ours(port):
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/ping", timeout=1) as r:
            return json.load(r).get("app") == APP_ID
    except (OSError, ValueError):
        return False


def find_browser():
    roots = [os.environ.get(k) for k in ("ProgramFiles(x86)", "ProgramFiles", "LocalAppData")]
    for rel in (r"Microsoft\Edge\Application\msedge.exe", r"Google\Chrome\Application\chrome.exe"):
        for root in roots:
            if root and (Path(root) / rel).is_file():
                return str(Path(root) / rel)
    return None


def open_window(url):
    exe = find_browser()
    if exe:
        try:
            subprocess.Popen([exe, f"--app={url}", "--window-size=1320,920"])
            return
        except OSError:
            pass
    webbrowser.open(url)


def fatal(message):
    try:
        import ctypes
        ctypes.windll.user32.MessageBoxW(None, message, "Курс на B2", 0x10)
    except Exception:
        print(message, file=sys.stderr)


def main(argv=None):
    argv = list(sys.argv[1:] if argv is None else argv)
    no_window = "--no-window" in argv
    data = Path(argv[argv.index("--data") + 1]) if "--data" in argv else ROOT / "data"
    if not (ROOT / "index.html").is_file():
        return fatal("Не найден файл index.html рядом с app.py.")

    # --port нужен только для проверок: отдельный порт не пересекается с открытым приложением
    ports = [int(argv[argv.index("--port") + 1])] if "--port" in argv else PORTS
    server = None
    for port in ports:
        try:
            server = Server(("127.0.0.1", port), Handler)
            break
        except OSError:
            if is_ours(port):  # приложение уже запущено: просто открываем ещё одно окно
                if not no_window:
                    open_window(f"http://127.0.0.1:{port}/")
                return
    if server is None:
        return fatal("Не удалось запустить приложение: порты 8765–8774 заняты другими программами.")

    Handler.store = Store(data)
    Life.last_seen = time.monotonic()
    threading.Thread(target=watchdog, args=(server,), daemon=True).start()
    if not no_window:
        open_window(f"http://127.0.0.1:{server.server_address[1]}/")
    try:
        server.serve_forever()
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
