// main.js — wires the Neon Coast Cover Studio page: pick up to three photos,
// type a caption and subtitle, pick a layout, grade and post size, click a
// panel to select it, drag to position it, zoom with the wheel or the slider,
// and export the cover as a PNG. A `?shot=` query sets up a fixed scene for
// a screenshot instead (./shots.js). Photos are read on the machine only.

import { drawCover, defaultState, layoutPanels, syncPanels, SIZES, LAYOUTS, GRADES } from './cover.js';
import { runShot } from './shots.js';
import { loadCoverFonts } from './fonts.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const status = document.getElementById('status');
const zoomSlider = document.getElementById('zoom');
const panelLabel = document.getElementById('panel-label');

const state = defaultState();
let selectedPanel = 0;
let fontsReady = false;

function currentSize() {
  return SIZES[state.sizeKey];
}

function resizeCanvas() {
  const { w, h } = currentSize();
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
}

function redraw() {
  if (!fontsReady) return;
  resizeCanvas();
  syncPanels(state);
  drawCover(canvas, state);
  updatePanelUI();
}

function updatePanelUI() {
  const rects = layoutPanels(state.layout, canvas.width, canvas.height);
  const photoPanels = rects.filter((r) => r.kind === 'photo');
  const crop = state.panels[selectedPanel];
  panelLabel.textContent = photoPanels.length
    ? `Panel ${selectedPanel + 1} of ${photoPanels.length} — drag to move, scroll to zoom`
    : 'No photo panels in this layout';
  if (crop) zoomSlider.value = String(Math.round(crop.zoom * 100));
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function photoFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      loadImage(reader.result).then(resolve, reject);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Photo slots: each file input fills one of the three photos.
for (let slot = 0; slot < 3; slot++) {
  const input = document.getElementById(`photo-${slot}`);
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      state.photos[slot] = await photoFromFile(file);
      status.textContent = `Photo ${slot + 1} loaded — ${file.name}`;
    } catch {
      status.textContent = `Could not read photo ${slot + 1}. Try a JPG or PNG.`;
    }
    redraw();
  });
}

document.getElementById('use-samples').addEventListener('click', async () => {
  try {
    state.photos[0] = await loadImage('samples/pier.jpg');
    state.photos[1] = await loadImage('samples/boulevard.jpg');
    state.photos[2] = await loadImage('samples/pier.jpg');
    status.textContent = 'Sample photos loaded.';
  } catch {
    status.textContent = 'Sample photos could not be loaded.';
  }
  redraw();
});

captionInput.addEventListener('input', () => {
  state.caption = captionInput.value;
  redraw();
});
subtitleInput.addEventListener('input', () => {
  state.subtitle = subtitleInput.value;
  redraw();
});

// Layout / grade / size pickers: one button group each, buttons carry data-*.
function wirePicker(groupId, apply) {
  const group = document.getElementById(groupId);
  group.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-value]');
    if (!btn) return;
    group.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    apply(btn.dataset.value);
    selectedPanel = 0;
    redraw();
  });
}

wirePicker('layout-picker', (v) => { state.layout = v; });
wirePicker('grade-picker', (v) => { state.grade = v; });
wirePicker('size-picker', (v) => { state.sizeKey = v; });

// Selected panel: zoom slider + reset.
zoomSlider.addEventListener('input', () => {
  const crop = state.panels[selectedPanel];
  if (!crop) return;
  crop.zoom = Number(zoomSlider.value) / 100;
  redraw();
});
document.getElementById('reset-crop').addEventListener('click', () => {
  const crop = state.panels[selectedPanel];
  if (!crop) return;
  crop.zoom = 1;
  crop.dx = 0;
  crop.dy = 0;
  redraw();
});

// Panel picking + dragging on the canvas.
function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * canvas.width,
    y: ((e.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function panelAt(x, y) {
  const rects = layoutPanels(state.layout, canvas.width, canvas.height);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (r.kind !== 'photo') continue;
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}

let dragging = null;
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const hit = panelAt(p.x, p.y);
  if (hit < 0) return;
  selectedPanel = hit;
  dragging = { x: p.x, y: p.y };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const p = canvasPoint(e);
  const crop = state.panels[selectedPanel];
  if (crop) {
    crop.dx += p.x - dragging.x;
    crop.dy += p.y - dragging.y;
  }
  dragging = { x: p.x, y: p.y };
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = canvasPoint(e);
  const hit = panelAt(p.x, p.y);
  if (hit < 0) return;
  selectedPanel = hit;
  const crop = state.panels[selectedPanel];
  if (!crop) return;
  crop.zoom = Math.min(4, Math.max(1, crop.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
  redraw();
}, { passive: false });

// Export: the canvas already renders at the export size, so toBlob is the PNG.
document.getElementById('export').addEventListener('click', () => {
  const { w, h } = currentSize();
  canvas.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-cover-${w}x${h}.png`;
    a.click();
    status.textContent = `Saved neon-coast-cover-${w}x${h}.png`;
  }, 'image/png');
});

// Boot: load fonts, then either a screenshot scene or the live editor.
const query = new URLSearchParams(location.search);
const shot = query.get('shot');
loadCoverFonts().then(() => {
  fontsReady = true;
  if (shot) {
    runShot(shot, query, state, async (slot, url) => {
      state.photos[slot] = await loadImage(url);
    }).then(() => {
      captionInput.value = state.caption;
      subtitleInput.value = state.subtitle;
      syncPickers();
      redraw();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__shotReady = true;
      }));
    });
  } else {
    redraw();
  }
});

function syncPickers() {
  const setActive = (groupId, value) => {
    const group = document.getElementById(groupId);
    group.querySelectorAll('button').forEach((b) => {
      b.classList.toggle('active', b.dataset.value === value);
    });
  };
  setActive('layout-picker', state.layout);
  setActive('grade-picker', state.grade);
  setActive('size-picker', state.sizeKey);
}
