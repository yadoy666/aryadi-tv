# aryadi TV

A family home screen for LG webOS, customized from **[Free My TV](https://github.com/simbasjungles/free-my-tv)** by simbasjungles and its contributors. The upstream MIT license and Git history are preserved. See [Credits](CREDITS.md) for all projects and asset sources used.

## Features

- Wallpaper, clock, and a bottom row of favorite applications, without TMDB recommendations.
- **Taman Pagi** from 07:00 to 15:00 and **Dunia Blok** for the rest of the day, using the TV's local time.
- Manual theme selection until the next scheduled boundary.
- Favorites and an all-apps menu, using the applications actually installed on the TV.
- Shortcuts to TV settings, LG Content Store, and inputs.
- Optional rooted-TV helper for the Home button, startup, and standby wake, with a switch back to **LG Launcher**.

Tested on LG **50UQ7500PSF**, webOS **7.6.0**, firmware **04.60.91**. Compatibility with other models or firmware has not been established. Installing the IPK alone adds an app; it does not replace LG Home. Root and the separate helper are required for the tested Home/startup behavior.

## Preview locally

Requires Python 3. Run from the repository root:

```sh
python3 tools/preview_minimal.py
python3 -m http.server 8765 --bind 127.0.0.1 --directory out/webos
```

Open [localhost:8765/minimal/](http://127.0.0.1:8765/minimal/). Application launches and TV controls are simulated in a desktop browser.

## Build

```sh
python3 webos/build_aryadi.py
```

Output: `Aryadi-webos.ipk` (app ID `io.aryadi.home`). No TMDB/API key is needed. Source files are in `previews/minimal/`; the webOS package metadata and rooted-TV helper are in `webos/aryadi/`.

For an unrooted TV already configured with LG Developer Mode:

```sh
python3 webos/install_aryadi.py <TV_IP>
```

For the already configured rooted setup, see [maintenance and recovery](webos/aryadi/root/README.md). `--root` updates the app; it does not root a TV or provision the native Home hook. Root exploits and native injection binaries are not bundled. Do not enable/reinstall Developer Mode on that rooted setup.

## Checks

```sh
node --test webos/aryadi/root/launcher.test.cjs previews/minimal/*.test.cjs
python3 webos/build_aryadi.py
tools/check.sh web
```

The original Android and Samsung sources remain available; their documentation is in [the upstream README](README.upstream.md). Aryadi's family UI targets webOS. Automated checks do not replace testing on a real TV.

## Credits and license

**Free My TV is the foundation of this project**, including the TV bridge, packaging/install tooling, and shared assets. Additional acknowledgements, pinned source revisions, and asset licenses are in [CREDITS.md](CREDITS.md). The original upstream credits are preserved in [README.upstream.md](README.upstream.md#credits).

Code in this repository is under the [MIT License](LICENSE), except assets or third-party components with their own notices. External root/input-hook tools retain their own licenses; the MIT license here does not relicense them. See [third-party notices](THIRD_PARTY_NOTICES.md).

Aryadi is not affiliated with LG, Roblox, Amazon, or the streaming services shown in its interface. Names and logos belong to their respective owners.
