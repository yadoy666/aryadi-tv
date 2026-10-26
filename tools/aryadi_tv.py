#!/usr/bin/env python3
"""Maintenance transport for the owner's rooted TV; keys stay in ~/.ssh or the ignored recovery directory."""
import argparse
import json
import pathlib
import shlex
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent


def ssh(ip, command, data=None, tty=True, timeout=30):
    recovery = ROOT / 'out' / 'tv-recovery' / ip
    key = pathlib.Path.home() / '.ssh' / ('aryadi_webos_root_' + ip.replace('.', '_'))
    hosts = pathlib.Path.home() / '.ssh' / 'aryadi_webos_root_known_hosts'
    if not key.exists():
        key, hosts = recovery / 'aryadi_root', recovery / 'known_hosts'
    args = ['ssh', '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes',
            '-o', 'UserKnownHostsFile=' + str(hosts),
            '-o', 'IdentitiesOnly=yes', '-o', 'ConnectTimeout=5',
            '-i', str(key)]
    if tty:
        args.append('-tt')
    return subprocess.run(args + ['root@' + ip, command], input=data,
                          capture_output=True, timeout=timeout)


def luna(ip, uri, payload, replies=1, wait=15):
    command = 'luna-send -w %d -n %d %s %s' % (
        wait * 1000, replies, shlex.quote(uri), shlex.quote(json.dumps(payload)))
    return ssh(ip, command, timeout=wait + 10)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('ip')
    parser.add_argument('command')
    options = parser.parse_args()
    result = ssh(options.ip, options.command)
    print(result.stdout.decode(), end='')
    print(result.stderr.decode(), end='')
    raise SystemExit(result.returncode)
