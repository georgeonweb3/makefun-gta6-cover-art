// fonts.js — loads the bundled OFL display fonts (Anton for the big caption,
// Pacifico for the neon script subtitle) before the first draw, so the cover
// always letters the same way, offline, with no network request.
const FONTS = [
  { family: 'Anton', url: './fonts/anton/Anton-Regular.ttf' },
  { family: 'Pacifico', url: './fonts/pacifico/Pacifico-Regular.ttf' },
];

/** Loads every bundled font; resolves true when all are ready (or timed out). */
export async function loadCoverFonts(timeoutMs = 4000) {
  const loads = FONTS.map(async ({ family, url }) => {
    try {
      const face = new FontFace(family, `url(${url})`);
      const loaded = await face.load();
      document.fonts.add(loaded);
      return true;
    } catch {
      return false;
    }
  });
  const timer = new Promise((resolve) => setTimeout(() => resolve(false), timeoutMs));
  await Promise.race([Promise.all(loads), timer]);
  try {
    await document.fonts.ready;
  } catch {
    // Fonts are best-effort; the cover still draws with fallbacks.
  }
  return true;
}
