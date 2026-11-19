// Fixed scenes for screenshots: ?shot=cover shows the poster alone, ?shot=editor
// shows the editor with photos loaded, ?shot=export renders the export-size PNG
// and stores it as window.__pngDataUrl for verification.
// Params: layout, grade, size (square|portrait|wide), photo (comma list of
// sample names, one per slot), caption, subtitle. window.__shotReady is set
// once the scene has painted.
import { renderPoster } from './cover.js';

const SAMPLE_FILES = { pier: 'pier.jpg', boulevard: 'boulevard.jpg' };

export async function runShot(shot, query, state, api) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  state.layout = query.get('layout') ?? 'vice-grid';
  state.grade = query.get('grade') ?? 'sunset';
  state.size = query.get('size') ?? 'square';
  state.caption = query.get('caption') ?? 'Vice Nights';
  state.subtitle = query.get('subtitle') ?? 'a neon coast story';
  const captionInput = document.getElementById('caption');
  const subtitleInput = document.getElementById('subtitle');
  if (captionInput) captionInput.value = state.caption;
  if (subtitleInput) subtitleInput.value = state.subtitle;

  const wanted = (query.get('photo') ?? 'pier,boulevard,pier').split(',');
  for (let i = 0; i < 3; i++) {
    const key = (wanted[i] ?? wanted[0] ?? 'pier').trim();
    // 'none' leaves the slot empty, for testing the empty-panel art.
    if (key === 'none') continue;
    const file = SAMPLE_FILES[key] ?? 'pier.jpg';
    state.photos[i].img = await api.loadImage(`./samples/${file}`);
    state.photos[i].name = file;
    state.photos[i].zoom = 1;
    state.photos[i].ox = 0;
    state.photos[i].oy = 0;
  }
  api.buildSlots();
  api.syncCropTools();
  api.redraw();

  if (shot === 'export') {
    const size = { square: [1080, 1080], portrait: [1080, 1350], wide: [1920, 1080] }[state.size] ?? [1080, 1080];
    const out = renderPoster(state, size[0], size[1]);
    window.__pngDataUrl = out.toDataURL('image/png');
    window.__pngSize = `${size[0]}x${size[1]}`;
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
