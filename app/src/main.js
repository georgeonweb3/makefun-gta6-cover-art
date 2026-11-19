// Wires the editor: layout / grade / size pickers, caption fields, the three
// photo slots (upload, kit sample, or drawn art), drag-to-pan and wheel zoom
// on the preview, and the one-click PNG export. A `?shot=` query sets up a
// fixed scene for a screenshot instead (see shots.js).
import { renderCover, panelRects, SIZES, LAYOUTS } from './cover.js';
import { GRADES } from './grades.js';
import { loadFonts } from './fonts.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const statusEl = document.getElementById('status');
const exportBtn = document.getElementById('export');
const slotsEl = document.getElementById('slots');

const SAMPLES = ['boulevard', 'pier'];

const state = {
  layout: 'vice',
  grade: 'sunset',
  size: '1080x1080',
  caption: 'VICE SUNSET',
  subtitle: 'a vice city story',
  photos: [null, null, null], // { img, zoom, ox, oy } or null = drawn art
  selected: 0,
  showSelection: true,
};

function redraw() {
  const [w, h] = SIZES[state.size];
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  renderCover(canvas, state);
}

function note(text) {
  statusEl.textContent = text;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

async function putPhoto(slot, img, label) {
  state.photos[slot] = { img, zoom: 1, ox: 0, oy: 0 };
  state.selected = slot;
  buildSlots();
  redraw();
  note(label);
}

function clearSlot(slot) {
  state.photos[slot] = null;
  state.selected = slot;
  buildSlots();
  redraw();
  note(`Panel ${slot + 1}: back to drawn art.`);
}

function buildSlots() {
  slotsEl.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const box = document.createElement('div');
    box.className = 'slot' + (state.selected === i ? ' sel' : '');
    const label = photo
      ? (photo.sample ? `Sample: ${photo.sample}` : 'Your photo')
      : 'Drawn art';
    box.innerHTML = `
      <div class="row">
        <span class="name">Panel ${i + 1}</span>
        <span class="state">${label}</span>
      </div>
      <div class="row" style="margin-top:6px">
        <button type="button" data-act="upload">Upload</button>
        <input type="file" accept="image/*" data-file="${i}">
        <button type="button" data-act="sample-boulevard">Boulevard</button>
        <button type="button" data-act="sample-pier">Pier</button>
        <button type="button" data-act="art">Drawn art</button>
        <button type="button" data-act="reset">Reset</button>
      </div>
      ${photo ? `<label style="display:block;margin-top:7px;font-size:12px;color:#b39ec0">Zoom
        <input type="range" min="1" max="3" step="0.05" value="${photo.zoom}">
      </label>` : ''}`;
    box.addEventListener('click', (e) => {
      if (e.target.closest('button, input')) return;
      state.selected = i;
      buildSlots();
      redraw();
    });
    box.querySelector('[data-act="upload"]').addEventListener('click', () => {
      box.querySelector(`[data-file="${i}"]`).click();
    });
    box.querySelector(`[data-file="${i}"]`).addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const img = await loadImage(URL.createObjectURL(file));
        await putPhoto(i, img, `Panel ${i + 1}: your photo loaded. Drag it to position, scroll to zoom.`);
      } catch {
        note('That file could not be read as a photo.');
      }
    });
    box.querySelector('[data-act="sample-boulevard"]').addEventListener('click', async () => {
      const img = await loadImage(`samples/boulevard.jpg`);
      state.photos[i] = { img, zoom: 1, ox: 0, oy: 0, sample: 'boulevard' };
      state.selected = i;
      buildSlots();
      redraw();
      note(`Panel ${i + 1}: boulevard sample loaded.`);
    });
    box.querySelector('[data-act="sample-pier"]').addEventListener('click', async () => {
      const img = await loadImage(`samples/pier.jpg`);
      state.photos[i] = { img, zoom: 1, ox: 0, oy: 0, sample: 'pier' };
      state.selected = i;
      buildSlots();
      redraw();
      note(`Panel ${i + 1}: pier sample loaded.`);
    });
    box.querySelector('[data-act="art"]').addEventListener('click', () => clearSlot(i));
    box.querySelector('[data-act="reset"]').addEventListener('click', () => {
      if (state.photos[i]) {
        state.photos[i].zoom = 1;
        state.photos[i].ox = 0;
        state.photos[i].oy = 0;
        buildSlots();
        redraw();
        note(`Panel ${i + 1}: crop reset.`);
      }
    });
    const zoomInput = box.querySelector('input[type="range"]');
    if (zoomInput) zoomInput.addEventListener('input', (e) => {
      if (state.photos[i]) {
        state.photos[i].zoom = Number(e.target.value);
        redraw();
      }
    });
    slotsEl.appendChild(box);
  });
}

function pickChoice(containerId, key, value) {
  const group = document.getElementById(containerId);
  group.querySelectorAll('button').forEach((b) => {
    b.classList.toggle('picked', b.dataset[key] === value);
  });
}

function setLayout(layout) {
  if (!LAYOUTS.includes(layout)) return;
  state.layout = layout;
  pickChoice('layoutChoices', 'layout', layout);
  redraw();
}

function setGrade(grade) {
  if (!GRADES.some((g) => g.id === grade)) return;
  state.grade = grade;
  pickChoice('gradeChoices', 'grade', grade);
  redraw();
}

function setSize(size) {
  if (!SIZES[size]) return;
  state.size = size;
  pickChoice('sizeChoices', 'size', size);
  redraw();
}

document.getElementById('layoutChoices').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-layout]');
  if (b) setLayout(b.dataset.layout);
});
document.getElementById('gradeChoices').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-grade]');
  if (b) setGrade(b.dataset.grade);
});
document.getElementById('sizeChoices').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-size]');
  if (b) setSize(b.dataset.size);
});
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });

// --- drag to pan, wheel to zoom, on the selected panel ------------------
function panelAt(clientX, clientY) {
  const box = canvas.getBoundingClientRect();
  const px = ((clientX - box.left) / box.width) * canvas.width;
  const py = ((clientY - box.top) / box.height) * canvas.height;
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}

let dragging = null;
canvas.addEventListener('pointerdown', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0 || i > 2) return;
  state.selected = i;
  buildSlots();
  redraw();
  const photo = state.photos[i];
  if (!photo) return;
  dragging = { slot: i, x: e.clientX, y: e.clientY, ox: photo.ox, oy: photo.oy };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const box = canvas.getBoundingClientRect();
  const photo = state.photos[dragging.slot];
  if (!photo) return;
  // Movement in css px, converted to a fraction of the panel's own size.
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  const r = rects[dragging.slot];
  photo.ox = dragging.ox + ((e.clientX - dragging.x) / box.width) * (canvas.width / r.w);
  photo.oy = dragging.oy + ((e.clientY - dragging.y) / box.height) * (canvas.height / r.h);
  photo.ox = Math.max(-0.6, Math.min(0.6, photo.ox));
  photo.oy = Math.max(-0.6, Math.min(0.6, photo.oy));
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });
canvas.addEventListener('pointercancel', () => { dragging = null; });
canvas.addEventListener('wheel', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0 || i > 2) return;
  const photo = state.photos[i];
  if (!photo) return;
  e.preventDefault();
  photo.zoom = Math.max(1, Math.min(3, photo.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  state.selected = i;
  buildSlots();
  redraw();
}, { passive: false });

// --- export --------------------------------------------------------------
async function exportPNG() {
  const [w, h] = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  renderCover(off, { ...state, showSelection: false });
  const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
  return { blob, width: w, height: h };
}

exportBtn.addEventListener('click', async () => {
  exportBtn.disabled = true;
  note('Exporting…');
  try {
    const { blob, width, height } = await exportPNG();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-sunset-cover-${width}x${height}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    note(`Saved vice-sunset-cover-${width}x${height}.png (${Math.round(blob.size / 1024)} KiB).`);
  } catch {
    note('Export failed — try again.');
  }
  exportBtn.disabled = false;
});

// --- small test hook: the verification driver drives the app through this --
window.__app = {
  state,
  setLayout,
  setGrade,
  setSize,
  redraw,
  async loadSample(slot, name) {
    const img = await loadImage(`samples/${name}.jpg`);
    state.photos[slot] = { img, zoom: 1, ox: 0, oy: 0, sample: name };
    state.selected = slot;
    buildSlots();
    redraw();
  },
  clearSlot,
  async exportDataURL() {
    const { blob, width, height } = await exportPNG();
    const url = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
    return { dataUrl: url, bytes: blob.size, width, height };
  },
  panelKinds() {
    return panelRects(state.layout, canvas.width, canvas.height)
      .map((_, i) => (state.photos[i] ? 'photo' : 'art'));
  },
};

// --- boot ------------------------------------------------------------------
buildSlots();
loadFonts().then(redraw);
redraw();

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), async (opts) => {
    if (opts.layout) setLayout(opts.layout);
    if (opts.grade) setGrade(opts.grade);
    if (opts.size) setSize(opts.size);
    if (opts.caption !== undefined) { captionInput.value = opts.caption; state.caption = opts.caption; }
    if (opts.subtitle !== undefined) { subtitleInput.value = opts.subtitle; state.subtitle = opts.subtitle; }
    if (opts.photo) await window.__app.loadSample(0, opts.photo);
    state.showSelection = false;
    redraw();
  });
}
