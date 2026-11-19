// shots.js — fixed scenes for screenshots. `?shot=editor` shows the page with
// sample photos loaded; `?shot=cover` shows the cover alone, at the post size
// the `size` query picks (wide | portrait | square). `layout`, `grade`,
// `caption` and `subtitle` queries pick the scene's look. The caller sets
// window.__shotReady once the scene has painted.
export async function runShot(shot, query, state, loadSlot) {
  const size = query.get('size') ?? 'wide';
  if (size === 'portrait' || size === 'square' || size === 'wide') state.sizeKey = size;
  state.layout = query.get('layout') ?? 'vice-grid';
  state.grade = query.get('grade') ?? 'sunset';
  state.caption = query.get('caption') ?? 'NEON HEAT';
  state.subtitle = query.get('subtitle') ?? 'Neon Coast nights';

  // Sample photos (made with an image model for make.fun, free to use):
  // slot 0 = pier, slot 1 = boulevard, slot 2 = pier again.
  await loadSlot(0, 'samples/pier.jpg');
  await loadSlot(1, 'samples/boulevard.jpg');
  await loadSlot(2, 'samples/pier.jpg');

  if (shot === 'cover') document.body.classList.add('shot-cover');
}
