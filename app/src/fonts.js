// Loads the two bundled display fonts (Anton for the caption, Pacifico for the
// subtitle) from app/fonts/ so the poster lettering works fully offline.
const FONTS = [
  { family: 'Anton', url: './fonts/anton/Anton-Regular.ttf' },
  { family: 'Pacifico', url: './fonts/pacifico/Pacifico-Regular.ttf' },
];

let loaded = null;

/** Loads both fonts once and resolves when they are usable on canvas. A slow
 *  or missing font file never blocks the first paint: after 3 seconds the
 *  app goes ahead with system fonts. */
export function loadPosterFonts() {
  if (loaded) return loaded;
  loaded = (async () => {
    const timeout = new Promise((resolve) => setTimeout(resolve, 3000));
    await Promise.race([
      (async () => {
        for (const { family, url } of FONTS) {
          const face = new FontFace(family, `url(${url})`, { style: 'normal', weight: '400' });
          const ready = await face.load();
          document.fonts.add(ready);
        }
        await document.fonts.ready;
      })(),
      timeout,
    ]);
  })();
  return loaded;
}

/** True once loadPosterFonts has resolved. */
export function fontsReady() {
  return loaded !== null;
}
