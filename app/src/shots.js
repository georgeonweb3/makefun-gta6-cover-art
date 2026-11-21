// Deterministic screenshot scenes for Neon Coast Cover Studio.
// A ?shot= URL sets the whole app state so a screenshot is reproducible:
//   ?shot=cover&photo=pier&caption=Sunset%20Heist&layout=vice&grade=sunset
//   ?shot=editor&photo=boulevard&caption=Boulevard%20Queen&layout=nine&grade=sunset
// mode cover hides the editor chrome and fills the viewport with the
// cover; mode editor shows the editor with a photo loaded. The page
// signals it is ready by setting document.title to SHOT-READY (or
// SHOT-ERROR with a message when something failed).

export function getShot() {
  const q = new URLSearchParams(window.location.search);
  const mode = q.get('shot');
  if (!mode) return null;
  return {
    mode,
    photo: q.get('photo') || '',
    caption: q.get('caption') || 'Sunset Heist',
    subtitle: q.get('subtitle') || 'Neon Coast',
    layout: q.get('layout') || 'vice',
    grade: q.get('grade') || 'sunset',
    w: Number(q.get('w') || 0) || null,
    h: Number(q.get('h') || 0) || null,
  };
}

// Load a kit sample photo (free to use, made for make.fun) by name.
export function loadSample(name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('sample photo not found: ' + name));
    img.src = `samples/${name}.jpg`;
  });
}

// Wait until the bundled fonts are usable on canvas, then run fn.
export async function whenFontsReady(fn) {
  try {
    await Promise.all([
      document.fonts.load('40px Anton'),
      document.fonts.load('20px Pacifico'),
      document.fonts.ready,
    ]);
  } catch (err) {
    // Fonts failing still leaves a readable cover in fallback fonts.
    console.warn('font load failed', err);
  }
  return fn();
}
