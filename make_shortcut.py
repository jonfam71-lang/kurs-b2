"""Создаёт на рабочем столе ярлык «Курс на B2».

Запусти этот файл заново, если перенёс папку приложения в другое место.
"""
import base64
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
NAME = "Курс на B2.lnk"


def quote(value):
    return "'" + str(value).replace("'", "''") + "'"


def main():
    pythonw = Path(sys.executable).with_name("pythonw.exe")
    if not pythonw.is_file():
        pythonw = Path(sys.executable)
    script = f"""
$desktop = [Environment]::GetFolderPath('Desktop')
$link = Join-Path $desktop {quote(NAME)}
$s = (New-Object -ComObject WScript.Shell).CreateShortcut($link)
$s.TargetPath = {quote(pythonw)}
$s.Arguments = {quote('"' + str(ROOT / 'KursB2.pyw') + '"')}
$s.WorkingDirectory = {quote(ROOT)}
$s.IconLocation = {quote(str(ROOT / 'icon.ico') + ',0')}
$s.Description = 'Английский с нуля до B2'
$s.Save()
if (Test-Path -LiteralPath $link) {{ 'OK' }} else {{ 'FAILED' }}
"""
    # -EncodedCommand переносит кириллицу в имени ярлыка без искажений
    encoded = base64.b64encode(script.encode("utf-16-le")).decode("ascii")
    result = subprocess.run(["powershell", "-NoProfile", "-EncodedCommand", encoded], capture_output=True, text=True)
    ok = result.returncode == 0 and "OK" in result.stdout
    print("Ярлык создан на рабочем столе." if ok else "Не удалось создать ярлык: " + (result.stderr or result.stdout).strip())
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
