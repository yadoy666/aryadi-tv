#!/bin/sh
set -eu
BASE=/var/lib/aryadi-launcher
PID=/tmp/aryadi-launcher.pid
running() {
    [ -f "$PID" ] || return 1
    pid=$(cat "$PID")
    case "$pid" in ''|*[!0-9]*) return 1;; esac
    [ -r "/proc/$pid/cmdline" ] || return 1
    tr '\000' ' ' < "/proc/$pid/cmdline" | grep -q '/var/lib/aryadi-launcher/launcher.js'
}
start() {
    [ -f "$BASE/enabled" ] || return 0
    if ! running; then
        nohup setsid "$BASE/run.sh" </dev/null >/tmp/aryadi-launcher.stderr 2>&1 &
        # Let nohup/setsid take effect before the SSH terminal can close.
        sleep 1
    fi
    if [ -f "$BASE/native-home-enabled" ]; then
        nohup setsid "$BASE/inject-home.sh" </dev/null >/tmp/aryadi-native.stderr 2>&1 &
    fi
}
case "${1:-status}" in
    enable)
        touch "$BASE/enabled"
        if [ -f "$BASE/native-home-enabled" ]; then node "$BASE/keymap.js" enable; fi
        start
        echo '{"enabled":true}'
        ;;
    disable)
        rm -f "$BASE/enabled"
        if running; then kill -TERM "$pid"; fi
        if [ -f "$BASE/native-home-enabled" ]; then node "$BASE/keymap.js" disable; fi
        echo '{"enabled":false}'
        ;;
    start) start;;
    status)
        enabled=false; live=false
        [ ! -f "$BASE/enabled" ] || enabled=true
        if running; then live=true; fi
        printf '{"enabled":%s,"running":%s}\n' "$enabled" "$live"
        ;;
    *) echo 'Use enable, disable, start, or status' >&2; exit 2;;
esac
