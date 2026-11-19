// Wires the studio: photo slots, layout/grade/size pickers, caption fields,
// per-panel crop (click to select, drag to pan, scroll to zoom) and PNG export.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawPoster, renderPoster, panelsFor, LAYOUTS, SIZES } from './cover.js';
import { GRADES } from './grades.js';
import { loadPosterFonts } from './fonts.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const statusEl = document.getElementById('status');
const sizeLabel = document.getElementById('size-label');
const zoomInput = document.getElementById('zoom');
const selectedLabel = document.getElementById('selected-label');

/** One uploaded photo plus its crop: zoom >= 1, ox/oy are pan fractions. */
function emptySlot() {
  return { img: null, zoom: 1, ox: 0, oy: 0, name: '' };
}

const state = {
  photos: [emptySlot(), emptySlot(), emptySlot()],
  layout: 'vice-grid',
  grade: 'sunset',
  size: 'square',
  caption: captionInput.value,
  subtitle: subtitleInput.value,
  selected: -1,
};

const SAMPLES = ['pier.jpg', 'boulevard.jpg'];

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function currentSize() {
  return SIZES.find((s) => s.id === state.size) ?? SIZES[0];
}

function redraw() {
  const size = currentSize();
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  drawPoster(canvas, state);
  sizeLabel.textContent = `${size.name} · ${size.label}`;
}

/** Builds the three photo-slot rows (upload, sample, remove). */
function buildSlots() {
  const wrap = document.getElementById('slots');
  wrap.innerHTML = '';
  state.photos.forEach((slot, i) => {
    const row = document.createElement('div');
    row.className = `slot${slot.img ? ' filled' : ''}`;
    const thumb = document.createElement('img');
    thumb.className = 'thumb';
    thumb.alt = '';
    if (slot.img) thumb.src = slot.img.src;
    const meta = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'slot-name';
    name.textContent = `Photo ${i + 1}`;
    const st = document.createElement('div');
    st.className = 'slot-state';
    st.textContent = slot.img ? slot.name : 'Empty — your photo stays on your machine';
    meta.append(name, st);
    const btns = document.createElement('div');
    btns.className = 'slot-btns';
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'image/*';
    file.addEventListener('change', async () => {
      const f = file.files[0];
      if (!f) return;
      try {
        slot.img = await loadImage(URL.createObjectURL(f));
        slot.name = f.name;
        slot.zoom = 1; slot.ox = 0; slot.oy = 0;
        buildSlots();
        redraw();
      } catch {
        statusEl.textContent = 'That file could not be read as a photo.';
      }
    });
    const uploadBtn = document.createElement('button');
    uploadBtn.type = 'button';
    uploadBtn.textContent = slot.img ? 'Change' : 'Upload';
    uploadBtn.addEventListener('click', () => file.click());
    const sampleBtn = document.createElement('button');
    sampleBtn.type = 'button';
    sampleBtn.textContent = 'Sample';
    sampleBtn.addEventListener('click', async () => {
      slot.img = await loadImage(`./samples/${SAMPLES[i % SAMPLES.length]}`);
      slot.name = SAMPLES[i % SAMPLES.length];
      slot.zoom = 1; slot.ox = 0; slot.oy = 0;
      buildSlots();
      redraw();
    });
    btns.append(uploadBtn, sampleBtn);
    if (slot.img) {
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.textContent = 'Remove';
      rm.addEventListener('click', () => {
        state.photos[i] = emptySlot();
        buildSlots();
        redraw();
      });
      btns.append(rm);
    }
    row.append(thumb, meta, btns, file);
    wrap.append(row);
  });
}

/** Builds a toggle group of buttons from a list of {id, name, swatch?}. */
function buildPicker(elId, items, current, onPick) {
  const wrap = document.getElementById(elId);
  wrap.innerHTML = '';
  for (const item of items) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pick';
    btn.setAttribute('aria-pressed', String(item.id === current()));
    btn.dataset.id = item.id;
    if (item.swatch) {
      const dot = document.createElement('span');
      dot.className = 'swatch';
      dot.style.background = item.swatch;
      btn.append(dot, document.createTextNode(item.name));
    } else {
      btn.textContent = `${item.name} · ${item.label ?? ''}`.trim();
    }
    btn.addEventListener('click', () => {
      onPick(item.id);
      wrap.querySelectorAll('.pick').forEach((b) => {
        b.setAttribute('aria-pressed', String(b.dataset.id === item.id));
      });
      redraw();
    });
    wrap.append(btn);
  }
}

buildSlots();
buildPicker('layout-picker', LAYOUTS, () => state.layout, (id) => { state.layout = id; state.selected = -1; syncCropTools(); });
buildPicker('grade-picker', GRADES, () => state.grade, (id) => { state.grade = id; });
buildPicker('size-picker', SIZES, () => state.size, (id) => { state.size = id; });

captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });

// --- Panel selection and cropping on the preview canvas ---
function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const fx = (clientX - rect.left) / rect.width;
  const fy = (clientY - rect.top) / rect.height;
  const panels = panelsFor(state.layout);
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (fx >= p.x && fx <= p.x + p.w && fy >= p.y && fy <= p.y + p.h) return i;
  }
  return -1;
}

function selectedSlot() {
  if (state.selected < 0) return null;
  const panel = panelsFor(state.layout)[state.selected];
  if (!panel || panel.photo < 0) return null;
  return state.photos[panel.photo];
}

function syncCropTools() {
  const slot = selectedSlot();
  zoomInput.value = slot ? String(slot.zoom) : '1';
  zoomInput.disabled = !slot;
  const panel = state.selected >= 0 ? panelsFor(state.layout)[state.selected] : null;
  selectedLabel.textContent = panel
    ? panel.photo < 0
      ? 'Title block selected — it is drawn art, not a photo.'
      : slot && slot.img
        ? `Panel ${state.selected + 1} · Photo ${panel.photo + 1} selected. Drag to move, scroll to zoom.`
        : `Panel ${state.selected + 1} · Photo ${panel.photo + 1} is empty — add a photo in step 1.`
    : 'No panel selected yet. Click any panel in the preview.';
}

let dragging = false;
let lastX = 0;
let lastY = 0;

canvas.addEventListener('pointerdown', (e) => {
  const hit = panelAt(e.clientX, e.clientY);
  state.selected = hit;
  syncCropTools();
  redraw();
  const slot = selectedSlot();
  if (hit >= 0 && slot && slot.img) {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.classList.add('dragging');
    canvas.setPointerCapture(e.pointerId);
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const slot = selectedSlot();
  if (!slot) return;
  const rect = canvas.getBoundingClientRect();
  const panel = panelsFor(state.layout)[state.selected];
  slot.ox += (e.clientX - lastX) / rect.width / panel.w;
  slot.oy += (e.clientY - lastY) / rect.height / panel.h;
  lastX = e.clientX;
  lastY = e.clientY;
  redraw();
});

function endDrag() {
  dragging = false;
  canvas.classList.remove('dragging');
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

canvas.addEventListener('wheel', (e) => {
  const slot = selectedSlot();
  if (!slot || !slot.img) return;
  e.preventDefault();
  slot.zoom = Math.max(1, Math.min(3, slot.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  zoomInput.value = String(slot.zoom);
  redraw();
}, { passive: false });

zoomInput.addEventListener('input', () => {
  const slot = selectedSlot();
  if (!slot) return;
  slot.zoom = Number(zoomInput.value);
  redraw();
});

// Arrow keys nudge the selected photo inside its panel.
canvas.tabIndex = 0;
canvas.addEventListener('keydown', (e) => {
  const slot = selectedSlot();
  if (!slot || !slot.img) return;
  const step = 0.03;
  const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
  const move = moves[e.key];
  if (!move) return;
  e.preventDefault();
  slot.ox += move[0];
  slot.oy += move[1];
  redraw();
});

document.getElementById('reset-crop').addEventListener('click', () => {
  const slot = selectedSlot();
  if (!slot) return;
  slot.zoom = 1; slot.ox = 0; slot.oy = 0;
  syncCropTools();
  redraw();
});

document.getElementById('clear-photo').addEventListener('click', () => {
  const panel = state.selected >= 0 ? panelsFor(state.layout)[state.selected] : null;
  if (!panel || panel.photo < 0) return;
  state.photos[panel.photo] = emptySlot();
  buildSlots();
  syncCropTools();
  redraw();
});

// --- Export ---
document.getElementById('export').addEventListener('click', () => {
  const size = currentSize();
  const out = renderPoster(state, size.w, size.h);
  out.toBlob((blob) => {
    if (!blob) { statusEl.textContent = 'Export failed — please try again.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-${state.layout}-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    statusEl.textContent = `Saved ${a.download}`;
  }, 'image/png');
});

// --- Boot: fonts first so the first paint already has the right lettering ---
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
loadPosterFonts().catch(() => { /* fall back to system fonts */ }).finally(() => {
  if (shot) {
    runShot(shot, params, state, { loadImage, buildSlots, redraw, syncCropTools });
  } else {
    redraw();
  }
});
