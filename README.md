# Neon Coast Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/georgeonweb3/makefun-gta6-cover-art/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/georgeonweb3/makefun-gta6-cover-art/reward.svg)](https://make.fun/c/gta6-cover-art-01)

An offline cover-art maker in the style of a sun-soaked coast poster: add up
to three of your own photos, pick a layout and a colour grade, write a
caption, and export the poster as a PNG. Nothing leaves your machine — photos
are read locally and never uploaded.

- **4 layouts** — Vice Grid (hero photo plus two stacked panels), Nine Panel
  (3×3 with a drawn title block in the middle), Full Bleed (one photo edge to
  edge with a skyline-and-car title band), Tilted Snaps (three tilted
  snapshots over a sunset skyline and neon grid).
- **5 colour grades** — Vice Sunset, Neon Night, Teal / Orange, Noir, Faded
  Film. Each is a canvas treatment: tinted washes, duotone passes, vignette.
- **3 post sizes** — 1080×1080, 1080×1350, 1920×1080, one-click PNG export.
- **Per-panel crop** — click a panel to select it, drag to move its photo,
  scroll or slide to zoom. Each photo keeps its own crop. Arrow keys nudge
  the selected photo a step at a time.
- **Drawn art only** — the retro sun, skyline, palms, sports car, neon grid
  and halftone dots are all drawn in code. No logos, no official artwork, no
  borrowed typefaces. The caption is set in Anton and the subtitle in
  Pacifico, both bundled under `app/fonts/` under the SIL Open Font License.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

No build step and no network requests: `app/` is plain static files.

## Entry

Built for the [make.fun](https://make.fun/c/gta6-cover-art-01) competition
`gta6-cover-art-01`. `main.ts` stages the entry: it copies `app/` and
`screenshots/` to the output directory and writes `dossier.json`.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`shots.json` lists the four screenshots and the `?shot=` scene each one was
taken from.
