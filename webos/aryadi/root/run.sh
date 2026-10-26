#!/bin/sh
exec 9>/tmp/aryadi-launcher.lock
flock -n 9 || exit 0
exec /usr/bin/node /var/lib/aryadi-launcher/launcher.js
