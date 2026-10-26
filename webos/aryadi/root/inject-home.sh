#!/bin/sh
# Optional native input component from Simon34545/lginputhook (see recovery notes).
# No disk image patches. The library disappears from processes on a reboot.
set -eu
BASE=/var/lib/aryadi-launcher
[ -f "$BASE/native-home-enabled" ] || exit 0
[ -f "$BASE/enabled" ] || exit 0
# A firmware update can change native input code. Keep the ordinary Home watcher
# available, but require a fresh compatibility check before injecting again.
if ! sha256sum -c "$BASE/firmware.sha256" >/dev/null 2>&1; then
    echo 'Firmware differs from the tested version; native Home remap skipped.' >>/tmp/aryadi-inject.log
    exit 0
fi
exec 8>/tmp/aryadi-native-home.lock
flock -n 8 || exit 0
for proc in /proc/[0-9]*; do
    name=$(cat "$proc/comm" 2>/dev/null) || continue
    case "$name" in lginput2|micomservice) ;; *) continue;; esac
    grep -q '/var/lib/aryadi-launcher/libinputhookpp.so' "$proc/maps" && continue
    pid=${proc##*/}
    # Do not retain keypress logs during normal operation.
    if timeout -t 1 true 2>/dev/null; then
        timeout -t 20 "$BASE/ezinject" -l /dev/null "$pid" "$BASE/libinputhookpp.so" >>/tmp/aryadi-inject.log 2>&1
    else
        timeout 20 "$BASE/ezinject" -l /dev/null "$pid" "$BASE/libinputhookpp.so" >>/tmp/aryadi-inject.log 2>&1
    fi
done
