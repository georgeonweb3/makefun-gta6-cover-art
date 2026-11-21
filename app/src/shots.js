// Fixed scenes for screenshots: ?shot=cover shows the cover alone at full size, and
// ?shot=editor shows the page with a sample photo loaded. The query also picks the
// layout, grade, sample photo and words. window.__shotReady is set once the fonts
// are in and the scene is painted, and the page title becomes SHOT-READY.
export async function runShot(shot, query, api) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photo = query.get('photo') ?? 'pier';
  const caption = query.get('caption') ?? 'Sunset Heist';
  const subtitle = query.get('subtitle') ?? 'Neon Coast';
  const layout = query.get('layout') ?? 'vice-grid';
  const grade = query.get('grade') ?? 'vice-sunset';
  const slot = Number(query.get('slot') ?? '0');
  await api.applyShot({ photo, caption, subtitle, layout, grade, slot });
  await document.fonts.ready;
  api.draw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
  document.title = window.__shotErrors.length
    ? 'SHOT-ERRORS: ' + window.__shotErrors.join(' | ')
    : 'SHOT-READY';
}
