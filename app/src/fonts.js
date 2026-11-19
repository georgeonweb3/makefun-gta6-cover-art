// Loads the two bundled display fonts (Anton for the headline, Pacifico for
// the subtitle) from app/fonts/ and registers them with the document so both
// the page and the canvas can use them. Nothing is fetched from the network:
// both files live under app/ and ship under the SIL Open Font License.

const FONTS = [
  { family: 'Anton', file: './fonts/anton/Anton-Regular.ttf' },
  { family: 'Pacifico', file: './fonts/pacifico/Pacifico-Regular.ttf' },
];

let loaded = null;

/** Loads both fonts once; resolves true when they are ready to draw with. */
export function loadFonts() {
  if (loaded) return loaded;
  loaded = (async () => {
    let ok = true;
    for (const { family, file } of FONTS) {
      try {
        const face = new FontFace(family, `url(${file})`, { weight: '400' });
        const ready = await face.load();
        document.fonts.add(ready);
      } catch {
        ok = false; // the canvas falls back to system sans-serif
      }
    }
    try { await document.fonts.ready; } catch { /* fonts are best-effort */ }
    return ok;
  })();
  return loaded;
}

/** True once Anton is usable for canvas lettering. */
export function antonReady() {
  return document.fonts.check('16px Anton');
}

/** True once a load has at least been attempted (fonts may still be pending). */
export function fontsStarted() {
  return loaded !== null;
}
