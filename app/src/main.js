// Wires the page: photos, layout, grade, words, panel pan and zoom, and export.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, panelRects } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const status = document.getElementById('status');
const panelName = document.getElementById('panelName');
const zoomInput = document.getElementById('zoom');
const panXInput = document.getElementById('panX');
const panYInput = document.getElementById('panY');

const state = {
  photos: [null, null, null],
  pans: [
    { zoom: 1, dx: 0, dy: 0 },
    { zoom: 1, dx: 0, dy: 0 },
    { zoom: 1, dx: 0, dy: 0 },
  ],
  layout: 'vice-grid',
  grade: 'vice-sunset',
  caption: 'Sunset Heist',
  subtitle: 'Neon Coast',
  selected: 0,
};

window.__shotErrors = [];
window.addEventListener('error', (e) => window.__shotErrors.push(String(e.message || e.error)));
window.addEventListener('unhandledrejection', (e) => window.__shotErrors.push(String(e.reason)));

function redraw() {
  state.caption = captionInput.value;
  state.subtitle = subtitleInput.value;
  drawCover(canvas, state);
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load ' + url));
    img.src = url;
  });
}

function syncPanelControls() {
  const pan = state.pans[state.selected];
  panelName.textContent = String(state.selected + 1);
  zoomInput.value = String(Math.round(pan.zoom * 100));
  panXInput.value = String(Math.round(pan.dx));
  panYInput.value = String(Math.round(pan.dy));
}

document.querySelectorAll('input[data-photo]').forEach((input) => {
  input.addEventListener('change', async (e) => {
    const slot = Number(e.target.dataset.photo);
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      state.photos[slot] = await loadImage(URL.createObjectURL(file));
      state.selected = slot;
      syncPanelControls();
      redraw();
    } catch {
      status.textContent = 'That photo could not be read.';
    }
  });
});

document.querySelectorAll('button[data-sample]').forEach((button) => {
  button.addEventListener('click', async () => {
    const slot = Number(button.dataset.sample);
    try {
      state.photos[slot] = await loadImage(`samples/${button.dataset.name}.jpg`);
      state.selected = slot;
      syncPanelControls();
      redraw();
    } catch {
      status.textContent = 'The sample photo could not be loaded.';
    }
  });
});

document.querySelectorAll('button[data-clear]').forEach((button) => {
  button.addEventListener('click', () => {
    state.photos[Number(button.dataset.clear)] = null;
    state.pans[Number(button.dataset.clear)] = { zoom: 1, dx: 0, dy: 0 };
    syncPanelControls();
    redraw();
  });
});

document.querySelectorAll('input[name="layout"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    state.layout = radio.value;
    redraw();
  });
});

document.querySelectorAll('button[data-grade]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('button[data-grade]').forEach((b) => b.classList.remove('on'));
    button.classList.add('on');
    state.grade = button.dataset.grade;
    redraw();
  });
});

captionInput.addEventListener('input', redraw);
subtitleInput.addEventListener('input', redraw);

zoomInput.addEventListener('input', () => {
  state.pans[state.selected].zoom = Number(zoomInput.value) / 100;
  redraw();
});
panXInput.addEventListener('input', () => {
  state.pans[state.selected].dx = Number(panXInput.value);
  redraw();
});
panYInput.addEventListener('input', () => {
  state.pans[state.selected].dy = Number(panYInput.value);
  redraw();
});
document.getElementById('resetPan').addEventListener('click', () => {
  state.pans[state.selected] = { zoom: 1, dx: 0, dy: 0 };
  syncPanelControls();
  redraw();
});

// Click a panel to select it; drag a photo panel to move the photo inside it.
let drag = null;
function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
    scale: canvas.width / rect.width,
  };
}
function panelAt(x, y) {
  const rects = panelRects(state, canvas.width, canvas.height);
  for (const r of rects) {
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r.slot;
  }
  return null;
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const slot = panelAt(p.x, p.y);
  if (slot === null) return;
  state.selected = slot;
  syncPanelControls();
  canvas.setPointerCapture(e.pointerId);
  drag = { slot, x: p.x, y: p.y, dx: state.pans[slot].dx, dy: state.pans[slot].dy, scale: p.scale };
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const pan = state.pans[drag.slot];
  pan.dx = drag.dx + (p.x - drag.x);
  pan.dy = drag.dy + (p.y - drag.y);
  syncPanelControls();
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('pointercancel', () => { drag = null; });

document.querySelectorAll('button[data-export]').forEach((button) => {
  button.addEventListener('click', () => {
    const [w, h] = button.dataset.export.split('x').map(Number);
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    drawCover(off, state);
    off.toBlob((blob) => {
      if (!blob) {
        status.textContent = 'Export failed.';
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `neon-coast-${w}x${h}.png`;
      a.click();
      status.textContent = `Saved neon-coast-${w}x${h}.png`;
    }, 'image/png');
  });
});

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, {
    async applyShot(scene) {
      const img = await loadImage(`samples/${scene.photo}.jpg`);
      state.photos[scene.slot] = img;
      state.selected = scene.slot;
      state.caption = scene.caption;
      state.subtitle = scene.subtitle;
      state.layout = scene.layout;
      state.grade = scene.grade;
      captionInput.value = scene.caption;
      subtitleInput.value = scene.subtitle;
      const radio = document.querySelector(`input[name="layout"][value="${scene.layout}"]`);
      if (radio) radio.checked = true;
      document.querySelectorAll('button[data-grade]').forEach((b) => {
        b.classList.toggle('on', b.dataset.grade === scene.grade);
      });
      syncPanelControls();
    },
    draw: redraw,
  }).catch((err) => {
    window.__shotErrors.push(String(err && err.message ? err.message : err));
  });
} else {
  redraw();
  document.fonts.ready.then(redraw);
}
