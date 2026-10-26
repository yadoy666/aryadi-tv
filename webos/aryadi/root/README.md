# Aryadi on the rooted LG TV

TV tested: LG 50UQ7500PSF, firmware 04.60.91, webOS 7.6.0.

Verified on 2026-10-25: direct Home from YouTube, other remote keys, switching
Aryadi/LG in the settings UI, standby wake into Aryadi, and a full reboot with root
and native Home remapping preserved. After the tuner fix, the owner confirmed a
silent Aryadi screen after reboot, normal YouTube audio, and direct Home return.
The 17 behavior tests for themes, app mapping, launcher safety, and rollback pass.

The normal Aryadi IPK is still a web app. These additional files provide the Home
button, startup, and standby-wake behavior on the rooted TV. They are deployed to
`/var/lib/aryadi-launcher`; the boot entry is
`/var/lib/webosbrew/init.d/90-aryadi-launcher`. Neither the LG Home application nor
the system partitions are replaced.

## Return to LG

On the TV: **aryadi → Pengaturan → Beranda utama → LG Launcher**.
To enable it again, open aryadi from LG's app list and choose **Aktifkan aryadi**.
Disabling restores the previous Home key mapping and stops startup/wake redirects.
Root and Homebrew Channel remain installed.

If the interface cannot be opened, from this repository on the owner's Mac:

```sh
python3 tools/aryadi_tv.py 192.0.2.5 '/var/lib/aryadi-launcher/control.sh disable'
```

Then press Home. The helper also stops redirecting after repeated launch loops,
and the native Home action falls back to LG if Aryadi is missing or disabled.

`192.0.2.5` is a documentation example; substitute your TV IP and matching key filename.

## Maintenance

```sh
python3 tools/aryadi_tv.py 192.0.2.5 '/var/lib/aryadi-launcher/control.sh status'
python3 webos/build_aryadi.py
python3 webos/install_aryadi.py 192.0.2.5 --root
```

The private SSH key is `~/.ssh/aryadi_webos_root_192_0_2_5`; the pinned host key
is in `~/.ssh/aryadi_webos_root_known_hosts`. They survive cleaning build output.
`out/tv-recovery/192.0.2.5/` additionally contains a key copy, the earlier Aryadi
package, and migration records, **not a full TV backup**. Do not share or commit
the recovery directory. Normal SSH uses port 22 and public-key
authentication. Telnet is disabled. LG Developer Mode was removed as required by
the rooting method; do not reinstall it while using this rooted configuration.

LG updates are not blocked by this setup. An official update may remove root or
change compatibility. Native input injection checks the recorded firmware checksum
and skips itself if the firmware changed, pending a new compatibility check.

## Components and provenance

* SlopBro used for initial rooting: `throwaway96/slopbro`, commit
  `21023d56ca424607bb03d2939609cc658c655fc7` (AGPL-3.0-or-later).
* Homebrew Channel 0.7.3 provides root service and boot hooks.
* The native input binaries come from `Simon34545/lginputhook`, commit
  `a607900118e088208f83f0f0c7a5a5b922092594` (release 1.5.1).
  Only its input components are used; its HTTP control service is not installed.
* Native hook implementation: `sundermann/inputhookpp` (GPL-3.0), with ezinject
  by smx-smx. Upstream source and license files are retained in `out/rooting/`.
  The binaries are not included in Aryadi's IPK or committed into this repository.

SHA-256 of the exact deployed input binaries:

```text
d2def5b3f68a415cf5a4a747ab70115e70a82f721bafbcc0d9c5a7bd5c161160  ezinject
de2c155a598827e7b31b2fa2cfe80e1cc7ad9347ccdd16f1c2aeb9bc0db1b49d  libinputhookpp.so
```

`keymap.js` modifies only Home key 773 and saves its original binding. The native
hook applies to `lginput2` and `micomservice` in memory and vanishes at reboot;
the optional startup script reapplies it when enabled. Other remote keys pass
through unchanged. `launcher.js` subscribes to foreground/power events for
startup, wake, and a fallback when LG Home is opened by another route. It does not
poll or interrupt streaming apps during normal use. When Aryadi becomes visible,
it closes background Live TV playback to prevent tuner audio after wake. Choosing
Live TV from the input menu still opens it normally; global mute/volume is unchanged.
Logs are in `/tmp/aryadi-*`;
normal startup does not retain per-key input logs.

## Opening performance (1.0.5)

The helper now launches on the first Active power report, without the previous
3-second startup or 1.2-second wake delay. Repeated Active reports do not reopen
Aryadi over another app. The IPK lets webOS activate it automatically on relaunch
(`handlesRelaunch: false`) and disables its launch splash/spinner. The page loads
only the selected wallpaper and uses `font-display: swap` so text need not wait
for the custom font. App discovery after relaunch is deferred by 250 ms.

On this TV, a YouTube-to-Aryadi service launch measured 3987 ms before changes,
3886 ms with 1.0.4, and 3993 ms with 1.0.5. These are single request-to-foreground
measurements, not button-to-complete-paint timings: they do not establish a
meaningful warm-launch speedup. A concurrent-install measurement was discarded.
The owner subsequently reported that opening felt much faster after being asked
to test Home and standby wake, without separate numerical timings. The helper
remained enabled/running, and the wake log confirmed automatic opening and tuner
closure. That wake still took about 11.3 seconds from launch request to foreground
notification, so do not equate that notification with complete visual readiness
or claim a measured wake speedup. Do not promise instant startup or pin apps in
memory based on these results.

Metadata references: [LG appinfo](https://webostv.developer.lge.com/develop/references/appinfo-json)
and [webOSbrew launch indicators](https://www.webosbrew.org/pages/appinfojson).

Run behavior checks with:

```sh
node --test webos/aryadi/root/launcher.test.cjs previews/minimal/*.test.cjs
```
