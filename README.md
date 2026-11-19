# Neon Coast Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/georgeonweb3/makefun-gta6-cover-art/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/georgeonweb3/makefun-gta6-cover-art/reward.svg)](https://make.fun/c/gta6-cover-art-01)

A GTA-style cover art maker that runs entirely offline in your browser: drop in
up to three of your own photos, type a caption, and export a multi-panel poster
cover as a PNG to share.

- **4 layouts** — Vice Grid (hero + two stacked panels), Nine Panel (3×3 with a
  title block), Full Bleed (one photo + title band + sports car), Tilted Snaps
  (three tilted snapshots over a sunset skyline).
- **5 colour grades** — Sunset, Neon Nights, Vice Pink, Heat Haze, Noir.
- **3 post sizes** — 1080×1080, 1080×1350, 1920×1080, one-click PNG export.
- **Per-panel crop** — click a panel to select it, drag to position its photo,
  scroll or slide to zoom. Fill several panels with one photo or several.
- **Original art only** — the sun, skyline, palm trees, car, neon grid and
  halftone dots are all drawn from code. No Rockstar logos, artwork or fonts.
  Lettering is Anton + Pacifico, bundled under `app/fonts/` under the SIL Open
  Font License. Photos are read on your machine and never uploaded.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network request: `app/` is plain static files.

## Entry

Built for the [make.fun](https://make.fun/c/gta6-cover-art-01) competition
`gta6-cover-art-01`. `main.ts` hands the app in: it copies `app/` and
`screenshots/` to `/output` and writes `/output/dossier.json`.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
