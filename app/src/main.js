// Editor wiring for Neon Coast Cover Studio.
// Photos come from the user's machine (file inputs, read locally, never
// uploaded) or from the kit's free sample photos. The preview canvas
// always draws at the selected export size, so what you see is what the
// PNG will be. Drag a photo panel to pan it; the zoom sliders zoom it.

import { GRADES, gradeById } from './grades.js';
import { LAYOUTS, EXPORT_SIZES, layoutPanels, renderCover, exportCanvas } from './cover.js';
import { getShot, loadSample, whenFontsReady } from './shots.js';

const $ = (id) => document.getElementById(id);

const state = {
  layout: 'vice',
  grade: gradeById('sunset'),
  title: 'Sunset Heist',
  subtitle: 'Neon Coast',
  photos: [null, null, null],
  zooms: [1, 1, 1],
  pans: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
  exportSize: EXPORT_SIZES[0],
};

const canvas = $('cover');
const ctx = canvas.getContext('2d');
let shot = null;

function fitCanvas() {
  canvas.width = state.exportSize.w;
  canvas.height = state.exportSize.h;
}

function render() {
  fitCanvas();
  renderCover(ctx, canvas.width, canvas.height, state);
}

// ---- photo loading ----
function setPhoto(slot, img) {
  state.photos[slot] = img;
  state.zooms[slot] = 1;
  state.pans[slot] = { x: 0, y: 0 };
  const label = $('photo-label-' + slot);
  if (label) label.textContent = img ? 'Photo ' + (slot + 1) + ' loaded' : 'Photo ' + (slot + 1) + ': none yet';
  render();
}

function readFileAsImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('could not read that image'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('could not read that file'));
    reader.readAsDataURL(file);
  });
}

for (let slot = 0; slot < 3; slot++) {
  const input = $('photo-' + slot);
  if (input) {
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      try {
        setPhoto(slot, await readFileAsImage(file));
      } catch (err) {
        console.warn(err);
      }
    });
  }
  const sampleBtn = $('sample-' + slot);
  if (sampleBtn) {
    sampleBtn.addEventListener('click', async () => {
      const name = slot === 1 ? 'boulevard' : 'pier';
      try {
        setPhoto(slot, await loadSample(name));
      } catch (err) {
        console.warn(err);
      }
    });
  }
  const zoom = $('zoom-' + slot);
  if (zoom) {
    zoom.addEventListener('input', () => {
      state.zooms[slot] = Number(zoom.value);
      render();
    });
  }
}

// ---- layout, grade, caption ----
function buildButtons(containerId, items, current, onPick) {
  const box = $(containerId);
  if (!box) return;
  box.innerHTML = '';
  items.forEach((item) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = item.name || item.label;
    b.dataset.id = item.id;
    if (item.id === current) b.classList.add('active');
    b.addEventListener('click', () => {
      box.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      onPick(item);
    });
    box.appendChild(b);
  });
}

buildButtons('layouts', LAYOUTS, state.layout, (item) => {
  state.layout = item.id;
  render();
});
buildButtons('grades', GRADES, state.grade.id, (item) => {
  state.grade = item;
  render();
});
buildButtons('sizes', EXPORT_SIZES, state.exportSize.id, (item) => {
  state.exportSize = item;
  render();
});

const titleInput = $('caption-title');
const subInput = $('caption-sub');
if (titleInput) {
  titleInput.value = state.title;
  titleInput.addEventListener('input', () => {
    state.title = titleInput.value || 'Sunset Heist';
    render();
  });
}
if (subInput) {
  subInput.value = state.subtitle;
  subInput.addEventListener('input', () => {
    state.subtitle = subInput.value || 'Neon Coast';
    render();
  });
}

// ---- export ----
const exportBtn = $('export-png');
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    const out = exportCanvas(state.exportSize, state);
    out.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `neon-coast-${state.exportSize.w}x${state.exportSize.h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }, 'image/png');
  });
}

// ---- drag to pan a photo panel ----
let drag = null;
function panelAt(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const x = ((clientX - r.left) / r.width) * canvas.width;
  const y = ((clientY - r.top) / r.height) * canvas.height;
  const { panels } = layoutPanels(state.layout, canvas.width, canvas.height);
  for (let i = 0; i < panels.length; i++) {
    const p = panels[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) {
      return { index: i, slot: state.photos.length ? i % state.photos.length : 0, x, y };
    }
  }
  return null;
}
canvas.addEventListener('pointerdown', (e) => {
  const hit = panelAt(e.clientX, e.clientY);
  if (hit && state.photos[hit.slot]) {
    drag = { ...hit, lastX: e.clientX, lastY: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const r = canvas.getBoundingClientRect();
  const dx = ((e.clientX - drag.lastX) / r.width) * canvas.width;
  const dy = ((e.clientY - drag.lastY) / r.height) * canvas.height;
  const pan = state.pans[drag.slot];
  // Pan is a fraction of the slack; scale the drag by panel size.
  pan.x = Math.max(-1, Math.min(1, pan.x + dx / (canvas.width * 0.25)));
  pan.y = Math.max(-1, Math.min(1, pan.y + dy / (canvas.height * 0.25)));
  drag.lastX = e.clientX;
  drag.lastY = e.clientY;
  render();
});
canvas.addEventListener('pointerup', () => {
  drag = null;
});

// ---- screenshot mode ----
window.addEventListener('error', (e) => {
  if (shot) document.title = 'SHOT-ERROR: ' + (e.message || 'unknown error');
});

async function runShot(s) {
  document.body.classList.add('shot-' + s.mode);
  state.layout = LAYOUTS.some((l) => l.id === s.layout) ? s.layout : 'vice';
  state.grade = gradeById(s.grade);
  state.title = s.caption;
  state.subtitle = s.subtitle;
  if (s.w && s.h) {
    state.exportSize = { id: 'shot', label: s.w + ' x ' + s.h, w: s.w, h: s.h };
  } else if (s.mode === 'editor') {
    state.exportSize = { id: 'shot', label: '1280 x 720', w: 1280, h: 720 };
  }
  if (s.photo) {
    setPhoto(0, await loadSample(s.photo));
    if (s.mode === 'editor' && s.photo === 'boulevard') {
      // A second sample photo shows the multi-photo fill in the editor.
      try {
        setPhoto(1, await loadSample('pier'));
      } catch (err) {
        console.warn(err);
      }
    }
  }
  await whenFontsReady(() => render());
  document.title = 'SHOT-READY';
}

shot = getShot();
if (shot) {
  runShot(shot).catch((err) => {
    console.warn(err);
    document.title = 'SHOT-ERROR: ' + err.message;
  });
} else {
  whenFontsReady(() => render());
}
