#!/bin/sh
# Only called by the Home key binding. The original launcher remains the fallback.
APP=com.webos.app.home
if [ -f /var/lib/aryadi-launcher/enabled ] && [ -f /media/developer/apps/usr/palm/applications/io.aryadi.home/appinfo.json ]; then
    APP=io.aryadi.home
fi
exec /usr/bin/luna-send -n 1 -w 5000 luna://com.webos.applicationManager/launch "{\"id\":\"$APP\"}"
