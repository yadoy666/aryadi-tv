# Credits

## Foundation

- **[Free My TV](https://github.com/simbasjungles/free-my-tv)** — simbasjungles and contributors, MIT. Aryadi is a customization of this repository, not an independently created TV platform. It uses the existing webOS bridge, shared assets, and packaging/install infrastructure. Based on upstream commit `57ea460` with the original history and copyright preserved.
- **[FreeMyTvWebOS](https://github.com/danielthejoker18/FreeMyTvWebOS)** — danielthejoker18, MIT; acknowledged by Free My TV for its webOS Developer Mode and Luna app-launching work.

## Rooted-TV setup and research

These are separately obtained tools or implementation references. Their source trees, exploit payloads, private configuration, and native binaries are not included in this repository or Aryadi's IPK.

| Project | Contribution to this setup | License / revision reviewed |
| --- | --- | --- |
| [webOS Homebrew Channel](https://github.com/webosbrew/webos-homebrew-channel) | Root service execution and boot hooks; version 0.7.3 used on the tested TV | MIT; source `92fcf9fef7ce08dbeae3b0616df8d0c75c11f0b3` |
| [SlopBro](https://github.com/throwaway96/slopbro) by throwaway96 | Initial rooting of the owner's TV | AGPL-3.0-or-later; `21023d56ca424607bb03d2939609cc658c655fc7` |
| [lginputhook](https://github.com/Simon34545/lginputhook) by Simon34545 | Release 1.5.1 supplied the native input-hook components used for direct Home remapping | BSD-3-Clause for that project; `a607900118e088208f83f0f0c7a5a5b922092594`; embedded components have separate licenses |
| [inputhookpp](https://github.com/sundermann/inputhookpp) by sundermann | Native input-hook implementation inspected during the setup | GPL-3.0; `2e808c1ca4fbe036f1ed7eac942c08245c283256` |
| [ezinject](https://github.com/smx-smx/ezinject) by smx-smx | Native injector used by lginputhook | See the upstream license and bundled component notices |
| [Hearth](https://github.com/rudra-avatar/Hearth) by rudra-avatar | Reference for a calm webOS launcher, lifecycle behavior, and rooted Home integration | MIT; `42afa1c07e673aec4f57a59b7ce42bcaf0dca20a` |
| [webos-launcher](https://github.com/partridgeworks/webos-launcher) by partridgeworks | The original launcher project credited by Hearth | MIT, as credited by Hearth |

Thanks also to the [webOS Homebrew documentation](https://www.webosbrew.org/) and [LG webOS TV developer documentation](https://webostv.developer.lge.com/) for the platform references used during development.

## Visual assets

- **Inter** by the Inter Project Authors / Rasmus Andersson: [rsms/inter](https://github.com/rsms/inter), SIL Open Font License 1.1. The font and [license](app/assets/fonts/OFL.txt) are inherited from Free My TV.
- **Material Symbols** by Google: [google/material-design-icons](https://github.com/google/material-design-icons), Apache 2.0. The symbol images and [license](app/assets/symbols/LICENSE-material-symbols.txt) are inherited from Free My TV.
- Streaming-service icons are inherited from Free My TV's `web/icons/` assets. Upstream credits [Simple Icons](https://github.com/simple-icons/simple-icons) under CC0 for its app logos. Brand names and marks remain the property of their respective owners.
- The original upstream sources also contain [cryptocurrency-icons](https://github.com/spothq/cryptocurrency-icons) assets, credited under CC0. Aryadi's family screen does not use the cryptocurrency feature.
- The **Dunia Blok**, **Taman Pagi**, and **Senja** wallpapers were generated with OpenAI's image-generation tool for this customization. Prompts are retained beside the assets. Dunia Blok is inspired by block-building games and is not an official Roblox asset.
- The `aryadi` wordmark and simple `a.` SVG logo were created for this customization.

## Other inherited upstream integrations

The retained Free My TV sources credit [TizenBrew Installer](https://github.com/reisxd/TizenBrewInstaller), TMDB, Watchmode, Open-Meteo, and Binance. See [the original credits](README.upstream.md#credits). These are not requirements for Aryadi's wallpaper-and-favorites screen.

Aryadi customization and integration: **Suharyadi**, with assistance from OpenAI Codex. Free My TV's original acknowledgement of Claude Code is retained in its upstream README.
