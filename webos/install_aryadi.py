#!/usr/bin/env python3
"""Install Aryadi: python3 webos/install_aryadi.py <TV-IP> [--root] [--uninstall]."""
import json
import sys
from pathlib import Path
import install
import build_aryadi
import re

ROOT = Path(__file__).resolve().parent.parent


def rooted(ip):
    sys.path.insert(0, str(ROOT / 'tools'))
    from aryadi_tv import ssh, luna
    status = ssh(ip, '/var/lib/aryadi-launcher/control.sh status')
    try:
        enabled = json.loads(status.stdout.decode().strip())['enabled']
    except (ValueError, KeyError):
        sys.exit('Could not read the Home helper state; no changes made.')
    stopped = ssh(ip, '/var/lib/aryadi-launcher/control.sh disable')
    if stopped.returncode:
        sys.exit('Could not pause the Home helper; no app changes made.')
    if '--uninstall' in sys.argv:
        response = luna(ip, 'luna://com.webos.appInstallService/dev/remove',
                        {'id': 'io.aryadi.home', 'subscribe': True}, replies=40, wait=20)
        print(response.stdout.decode())
        luna(ip, 'luna://com.webos.applicationManager/launch', {'id': 'com.webos.app.home'})
        return
    try:
        copied = ssh(ip, 'cat > /tmp/aryadi-update.ipk', data=build_aryadi.IPK.read_bytes(), tty=False)
        if copied.returncode:
            raise RuntimeError('Upload failed: ' + copied.stderr.decode())
        response = luna(ip, 'luna://com.webos.appInstallService/dev/install',
                        {'id': 'io.aryadi.home', 'ipkUrl': '/tmp/aryadi-update.ipk', 'subscribe': True},
                        replies=40, wait=30)
        if not re.search(r'"state"\s*:\s*"installed"', response.stdout.decode()):
            raise RuntimeError('Installation not confirmed: ' + response.stdout.decode())
        ssh(ip, 'rm -f /tmp/aryadi-update.ipk')
    finally:
        if enabled:
            restored = ssh(ip, '/var/lib/aryadi-launcher/control.sh enable')
            if restored.returncode:
                print('Home helper needs recovery: ' + restored.stderr.decode())
    launched = luna(ip, 'luna://com.webos.applicationManager/launch', {'id': 'io.aryadi.home'})
    if not re.search(r'"returnValue"\s*:\s*true', launched.stdout.decode()):
        sys.exit('Installed, but launch was not confirmed. Open aryadi from LG Home.')
    print('Aryadi installed and opened through root SSH.')


def main():
    install.IPK = str(build_aryadi.IPK)
    install.APP_ID = json.loads((ROOT / 'webos' / 'aryadi' / 'appinfo.json').read_text())['id']
    install.APP_NAME = 'aryadi'
    install.TEMP = '/media/developer/temp/aryadi.ipk'
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    if '--uninstall' not in sys.argv and not build_aryadi.IPK.exists():
        build_aryadi.build()
    if '--root' in sys.argv:
        rooted(sys.argv[1])
        return
    install.main()


if __name__ == '__main__':
    main()
