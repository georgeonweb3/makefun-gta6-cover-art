// Fixed scenes for screenshots: ?shot=cover draws the exported cover alone
// at the chosen layout / grade / size, ?shot=editor shows the editor with
// the drawn characters loaded (and optionally a sample photo in slot 0).
// window.__shotReady is set once the fonts are in and the cover is painted.
import { loadFonts } from './fonts.js';

export async function runShot(shot, query, setup) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  window.__shotName = shot;
  const photo = query.get('photo');
  await setup({
    layout: query.get('layout') || undefined,
    grade: query.get('grade') || undefined,
    size: query.get('size') || undefined,
    caption: query.get('caption') || undefined,
    subtitle: query.get('subtitle') || undefined,
    photo: photo || undefined,
  });
  await loadFonts();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
