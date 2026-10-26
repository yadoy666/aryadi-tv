#!/usr/bin/env python3
"""Build Aryadi-webos.ipk, with the family UI and the real webOS bridge. No API keys."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
import preview_minimal
from build import package

IPK = ROOT / 'Aryadi-webos.ipk'


def build():
    app = preview_minimal.files()
    for name in ('appinfo.json', 'icon.png', 'largeIcon.png'):
        app[name] = (ROOT / 'webos' / 'aryadi' / name).read_bytes()
    info = json.loads(app['appinfo.json'])
    data = package(app, info, IPK)
    print('Built %s (%s %s, %d KB)' % (IPK.name, info['id'], info['version'], len(data) // 1024))
    return IPK


if __name__ == '__main__':
    build()
