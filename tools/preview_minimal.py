#!/usr/bin/env python3
"""Shared assets for the Aryadi browser preview and webOS package."""
from pathlib import Path
import hashlib

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'previews' / 'minimal'
OUT = ROOT / 'out' / 'webos' / 'minimal'


def files():
    app = {name: (SOURCE / name).read_bytes() for name in
           ('index.html', 'style.css', 'app.js', 'theme-schedule.js', 'tv-apps.js')}
    app['tv.js'] = (ROOT / 'web' / 'tv.js').read_bytes()
    html = app['index.html'].decode('utf-8')
    for name in ('style.css', 'app.js', 'theme-schedule.js', 'tv-apps.js', 'tv.js'):
        digest = hashlib.sha256(app[name]).hexdigest()[:12]
        html = html.replace('"' + name + '"', '"' + name + '?v=' + digest + '"')
    app['index.html'] = html.encode('utf-8')
    for name in ('senja.png', 'blocks.png', 'garden.png', 'aryadi.svg'):
        app['assets/' + name] = (SOURCE / 'assets' / name).read_bytes()
    for name in ('netflix.svg', 'youtube.png', 'prime.png', 'max.svg'):
        data = (ROOT / 'web' / 'icons' / name).read_bytes()
        app['assets/' + name] = data
        app['icons/' + name] = data
    for name in ('hdmi.png', 'sparkles.png', 'settings.png'):
        app['assets/' + name] = (ROOT / 'app' / 'assets' / 'symbols' / name).read_bytes()
    for name in ('InterVariable.ttf', 'OFL.txt'):
        app['assets/' + name] = (ROOT / 'app' / 'assets' / 'fonts' / name).read_bytes()
    for name in ('LICENSE', 'CREDITS.md', 'THIRD_PARTY_NOTICES.md'):
        app[name] = (ROOT / name).read_bytes()
    app['licenses/Hearth-MIT.txt'] = (ROOT / 'licenses' / 'Hearth-MIT.txt').read_bytes()
    app['licenses/Material-Symbols-Apache-2.0.txt'] = (ROOT / 'app' / 'assets' / 'symbols' / 'LICENSE-material-symbols.txt').read_bytes()
    return app


def build():
    for name, data in files().items():
        target = OUT / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    print('Preview ready: out/webos/minimal/index.html')


if __name__ == '__main__':
    build()
