// Layouts, panel content and the caption. cover.js owns the whole render:
// panels (drawn art or the user's photos) -> grade -> frame -> caption.
//
// A panel slot is one of the user's three photos. A photo fills its panel
// with a cover fit, a zoom and a pan; drawn art fills every panel that has
// no photo, so a cover with zero uploads is already character art.

import { drawScene } from './art.js';
import { gradeFilter, gradeWash } from './grades.js';

export const LAYOUTS = ['vice', 'nine', 'full', 'tilted'];
export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

// Which illustrated scene each panel slot shows when it has no photo.
// Vice Grid has three panels: the duo big on top, car and skyline below.
const ART_FOR_SLOT = {
  vice: ['duo', 'car', 'skyline'],
  nine: ['duo', 'car', 'skyline', 'sun', 'duo', 'car', 'skyline', 'sun', 'duo'],
  full: ['duo'],
  tilted: ['duo', 'car', 'skyline'],
};

/** Panel rectangles for a layout, in fractions of the cover (x, y, w, h, tilt). */
export function panelRects(layout, W, H) {
  const gap = 0.014 * Math.min(W, H);
  if (layout === 'nine') {
    const cells = [];
    const cw = (W - gap * 4) / 3;
    const ch = (H - gap * 4) / 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        cells.push({ x: gap + c * (cw + gap), y: gap + r * (ch + gap), w: cw, h: ch, rot: 0 });
      }
    }
    return cells;
  }
  if (layout === 'full') {
    return [{ x: 0, y: 0, w: W, h: H, rot: 0 }];
  }
  if (layout === 'tilted') {
    const pw = W * 0.52;
    const ph = H * 0.62;
    return [
      { x: W * 0.06, y: H * 0.16, w: pw, h: ph, rot: -0.10 },
      { x: W * 0.24, y: H * 0.10, w: pw, h: ph, rot: 0.03 },
      { x: W * 0.43, y: H * 0.20, w: pw, h: ph, rot: 0.09 },
    ];
  }
  // vice: a 2 x 2 grid, the duo big on top
  const half = (W - gap * 3) / 2;
  const topH = H * 0.56;
  const botH = H - topH - gap * 2;
  return [
    { x: gap, y: gap, w: W - gap * 2, h: topH, rot: 0 },
    { x: gap, y: gap * 2 + topH, w: half, h: botH, rot: 0 },
    { x: gap * 2 + half, y: gap * 2 + topH, w: half, h: botH, rot: 0 },
  ];
}

/** How many photo slots a layout shows (the rest are drawn art). */
export function slotCount(layout) {
  return ART_FOR_SLOT[layout].length;
}

function drawPhoto(ctx, photo, rect) {
  const img = photo.img;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const base = Math.max(rect.w / iw, rect.h / ih);
  const scale = base * (photo.zoom || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (rect.w - dw) / 2 + (photo.ox || 0) * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + (photo.oy || 0) * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function drawArt(ctx, scene, rect) {
  const off = document.createElement('canvas');
  const scale = Math.max(1, Math.round(Math.min(rect.w, rect.h) / 500));
  off.width = Math.max(2, Math.round(rect.w / scale));
  off.height = Math.max(2, Math.round(rect.h / scale));
  drawScene(off.getContext('2d'), off.width, off.height, scene);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(off, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function panelBorder(ctx, rect, selected) {
  ctx.save();
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.rotate(rect.rot || 0);
  ctx.translate(-rect.w / 2, -rect.h / 2);
  ctx.lineWidth = selected ? Math.max(3, rect.w * 0.012) : Math.max(2, rect.w * 0.006);
  ctx.strokeStyle = selected ? '#ffd166' : '#ffffff';
  ctx.strokeRect(0, 0, rect.w, rect.h);
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  ctx.font = `${size}px ${family}`;
  while (size > 14 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px ${family}`;
  }
  return size;
}

function paintCaption(ctx, W, H, caption, subtitle) {
  const head = (caption || '').trim().toUpperCase();
  const sub = (subtitle || '').trim();
  const pad = W * 0.045;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  if (sub) {
    const subSize = fitFont(ctx, sub, W * 0.62, H * 0.038, '"Pacifico", cursive');
    ctx.font = `${subSize}px "Pacifico", cursive`;
    ctx.fillStyle = '#ffd166';
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = subSize * 0.25;
    ctx.shadowOffsetY = subSize * 0.06;
    ctx.fillText(sub, pad, H - H * 0.155);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  if (head) {
    const size = fitFont(ctx, head, W - pad * 2, H * 0.105, '"Anton", sans-serif');
    ctx.font = `${size}px "Anton", sans-serif`;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#22102b';
    ctx.lineWidth = size * 0.14;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#e5486f';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = size * 0.07;
    ctx.shadowOffsetY = size * 0.07;
    const y = H - H * 0.045;
    ctx.strokeText(head, pad, y);
    ctx.fillText(head, pad, y);
  }
  ctx.restore();
}

/**
 * Renders the whole cover for `state` onto `canvas` at its own pixel size.
 * `state` = { layout, grade, caption, subtitle, photos[3], selected }.
 * Photos are { img, zoom, ox, oy } or null; a null slot shows drawn art.
 */
export function renderCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const rects = panelRects(state.layout, W, H);
  const scenes = ART_FOR_SLOT[state.layout];

  // 1. panels, drawn to an offscreen canvas so the grade can filter them
  const scene = document.createElement('canvas');
  scene.width = W;
  scene.height = H;
  const sctx = scene.getContext('2d');
  sctx.fillStyle = '#150a1e';
  sctx.fillRect(0, 0, W, H);
  if (state.layout === 'tilted') {
    // dark backing card behind the overlapping snaps
    const g = sctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#2a1152');
    g.addColorStop(1, '#12081c');
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, W, H);
  }
  rects.forEach((rect, i) => {
    const photo = state.photos[i] || null;
    sctx.save();
    if (rect.rot) {
      sctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      sctx.rotate(rect.rot);
      sctx.translate(-rect.w / 2, -rect.h / 2);
      const flat = { x: 0, y: 0, w: rect.w, h: rect.h };
      if (photo) drawPhoto(sctx, photo, flat);
      else drawArt(sctx, scenes[i], flat);
      // polaroid-style white edge around each snap
      sctx.lineWidth = Math.max(3, rect.w * 0.014);
      sctx.strokeStyle = '#ffffff';
      sctx.strokeRect(0, 0, rect.w, rect.h);
      sctx.restore();
    } else if (photo) {
      drawPhoto(sctx, photo, rect);
      sctx.restore();
    } else {
      drawArt(sctx, scenes[i], rect);
      sctx.restore();
    }
  });

  // 2. grade: filter the panels, then colour washes and vignette
  ctx.save();
  ctx.filter = gradeFilter(state.grade);
  ctx.drawImage(scene, 0, 0);
  ctx.restore();
  gradeWash(ctx, W, H, state.grade);

  // 3. panel seams + selection ring, drawn over the grade so they stay crisp.
  // The ring only shows in the editor (showSelection); exports stay clean.
  ctx.save();
  if (state.layout !== 'tilted') {
    rects.forEach((rect, i) => panelBorder(ctx, rect, state.showSelection && i === state.selected));
  }
  ctx.restore();

  // 4. caption on top, ungraded so the lettering stays clean white
  paintCaption(ctx, W, H, state.caption, state.subtitle);
}
