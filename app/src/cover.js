// Draws the cover for a state: up to three photos with per panel zoom and pan, one of
// four layouts, one of five grades, and a title plus subtitle. Everything is drawn in
// fractions of the canvas size, so the same code paints the preview and every export.
import { grade } from './grades.js';
import { drawArt, drawGrid } from './art.js';

const ART_KINDS = ['sun', 'skyline', 'palms', 'car', 'grid', 'halftone'];

// The panel rectangles each layout offers, in canvas pixels. main.js uses these to
// work out which panel a click landed on.
export function panelRects(state, w, h) {
  const band = captionBandHeight(state.layout, h);
  const top = h - band;
  const gap = Math.round(w * 0.012);
  if (state.layout === 'nine-panel') {
    const cw = (w - gap * 4) / 3;
    const ch = (top - gap * 4) / 3;
    const rects = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        rects.push({ slot: r * 3 + c, x: gap + c * (cw + gap), y: gap + r * (ch + gap), w: cw, h: ch });
      }
    }
    return rects;
  }
  if (state.layout === 'full-bleed') {
    return [{ slot: 0, x: 0, y: 0, w, h: top }];
  }
  if (state.layout === 'tilted-snaps') {
    const cw = w * 0.3;
    const ch = cw * 1.22;
    const y0 = h * 0.3;
    return [
      { slot: 0, x: w * 0.04, y: y0, w: cw, h: ch, tilt: -0.1 },
      { slot: 1, x: w * 0.35, y: y0 + h * 0.02, w: cw, h: ch, tilt: 0.03 },
      { slot: 2, x: w * 0.66, y: y0 - h * 0.01, w: cw, h: ch, tilt: 0.09 },
    ];
  }
  const cw = (w - gap * 3) / 2;
  const ch = (top - gap * 3) / 2;
  return [
    { slot: 0, x: gap, y: gap, w: cw, h: ch },
    { slot: 1, x: gap * 2 + cw, y: gap, w: cw, h: ch },
    { slot: 2, x: gap, y: gap * 2 + ch, w: cw, h: ch },
    { slot: 3, x: gap * 2 + cw, y: gap * 2 + ch, w: cw, h: ch },
  ];
}

function captionBandHeight(layout, h) {
  if (layout === 'full-bleed') return Math.round(h * 0.3);
  if (layout === 'tilted-snaps') return 0;
  return Math.round(h * 0.17);
}

// Keeps a photo covering its panel: the zoomed image is centred on the panel centre
// plus the pan, and the pan is clamped so no edge of the panel ever shows background.
function clampPan(pan, img, pw, ph) {
  const base = Math.max(pw / img.naturalWidth, ph / img.naturalHeight);
  const sw = img.naturalWidth * base * pan.zoom;
  const sh = img.naturalHeight * base * pan.zoom;
  const maxDx = Math.max(0, (sw - pw) / 2);
  const maxDy = Math.max(0, (sh - ph) / 2);
  return {
    zoom: pan.zoom,
    dx: Math.max(-maxDx, Math.min(maxDx, pan.dx)),
    dy: Math.max(-maxDy, Math.min(maxDy, pan.dy)),
  };
}

function paintPhoto(ctx, img, pan, x, y, w, h) {
  const p = clampPan(pan, img, w, h);
  const base = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = img.naturalWidth * base * p.zoom;
  const sh = img.naturalHeight * base * p.zoom;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, x + (w - sw) / 2 + p.dx, y + (h - sh) / 2 + p.dy, sw, sh);
  ctx.restore();
}

function paintPanel(ctx, img, pan, slot, x, y, w, h, g) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (img) {
    paintPhoto(ctx, img, pan, x, y, w, h);
    const shade = ctx.createLinearGradient(0, y + h * 0.55, 0, y + h);
    shade.addColorStop(0, 'rgba(20, 8, 31, 0)');
    shade.addColorStop(1, 'rgba(20, 8, 31, 0.28)');
    ctx.fillStyle = shade;
    ctx.fillRect(x, y, w, h);
  } else {
    drawArt(ctx, ART_KINDS[slot % ART_KINDS.length], x, y, w, h, g);
  }
  ctx.restore();
  ctx.strokeStyle = g.frame;
  ctx.lineWidth = Math.max(1, w * 0.004);
  ctx.strokeRect(x, y, w, h);
}

// Fits one line of text into a width by shrinking the size, never below the floor.
function fitSize(ctx, text, family, start, maxWidth, floor) {
  let size = start;
  ctx.font = `${size}px ${family}`;
  while (size > floor && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px ${family}`;
  }
  return size;
}

// The caption band: title on its own line, an underline the width of the title only,
// then the subtitle on its own line below. The three never overlap.
function drawCaptionBand(ctx, state, g, x, y, w, h) {
  ctx.fillStyle = g.frame;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = g.neon;
  ctx.fillRect(x, y, w, Math.max(2, h * 0.02));
  const pad = w * 0.05;
  const maxW = w - pad * 2;
  const title = (state.caption || 'Untitled').trim().toUpperCase();
  const titleSize = fitSize(ctx, title, 'Anton, sans-serif', h * 0.52, maxW, 14);
  ctx.font = `${titleSize}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const titleY = y + h * 0.46;
  ctx.fillStyle = g.title;
  ctx.fillText(title, x + w / 2, titleY);
  const titleW = ctx.measureText(title).width;
  ctx.fillStyle = g.neon;
  ctx.fillRect(x + (w - titleW) / 2, y + h * 0.52, titleW, Math.max(2, h * 0.025));
  const sub = (state.subtitle || '').trim();
  if (sub) {
    const subSize = fitSize(ctx, sub, 'Pacifico, cursive', h * 0.3, maxW, 12);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = g.subtitle;
    ctx.fillText(sub, x + w / 2, y + h * 0.88);
  }
}

function drawGridCover(ctx, state, g, w, h, nine) {
  const band = captionBandHeight(state.layout, h);
  const top = h - band;
  ctx.fillStyle = g.panel;
  ctx.fillRect(0, 0, w, top);
  const rects = panelRects(state, w, h);
  const photoSlots = nine ? [0, 4, 8] : [0, 1, 2];
  for (const r of rects) {
    const slot = photoSlots.includes(r.slot) ? photoSlots.indexOf(r.slot) : -1;
    if (slot >= 0) {
      paintPanel(ctx, state.photos[slot], state.pans[slot], r.slot, r.x, r.y, r.w, r.h, g);
    } else {
      paintPanel(ctx, null, state.pans[0], r.slot, r.x, r.y, r.w, r.h, g);
    }
  }
  drawCaptionBand(ctx, state, g, 0, top, w, band);
}

function drawFullBleed(ctx, state, g, w, h) {
  const img = state.photos[0];
  if (img) {
    paintPhoto(ctx, img, state.pans[0], 0, 0, w, h);
  } else {
    drawArt(ctx, 'sun', 0, 0, w, h, g);
    drawArt(ctx, 'skyline', 0, h * 0.45, w, h * 0.55, g);
  }
  const scrim = ctx.createLinearGradient(0, h * 0.5, 0, h);
  scrim.addColorStop(0, 'rgba(10, 4, 18, 0)');
  scrim.addColorStop(1, 'rgba(10, 4, 18, 0.82)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, w, h);
  const pad = w * 0.05;
  const maxW = w - pad * 2;
  const title = (state.caption || 'Untitled').trim().toUpperCase();
  const titleSize = fitSize(ctx, title, 'Anton, sans-serif', h * 0.13, maxW, 14);
  ctx.font = `${titleSize}px Anton, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const titleY = h * 0.86;
  ctx.fillStyle = g.title;
  ctx.fillText(title, pad, titleY);
  const titleW = ctx.measureText(title).width;
  ctx.fillStyle = g.neon;
  ctx.fillRect(pad, titleY + h * 0.015, Math.min(titleW, maxW), Math.max(2, h * 0.006));
  const sub = (state.subtitle || '').trim();
  if (sub) {
    const subSize = fitSize(ctx, sub, 'Pacifico, cursive', h * 0.05, maxW, 12);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = g.subtitle;
    ctx.fillText(sub, pad, h * 0.95);
  }
}

function drawTiltedSnaps(ctx, state, g, w, h) {
  drawGrid(ctx, 0, 0, w, h, g, false);
  const pad = w * 0.05;
  const maxW = w - pad * 2;
  const title = (state.caption || 'Untitled').trim().toUpperCase();
  const titleSize = fitSize(ctx, title, 'Anton, sans-serif', h * 0.09, maxW, 14);
  ctx.font = `${titleSize}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = g.title;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = titleSize * 0.15;
  ctx.fillText(title, w / 2, h * 0.12);
  ctx.shadowBlur = 0;
  const sub = (state.subtitle || '').trim();
  if (sub) {
    const subSize = fitSize(ctx, sub, 'Pacifico, cursive', h * 0.045, maxW, 12);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = g.subtitle;
    ctx.fillText(sub, w / 2, h * 0.185);
  }
  const rects = panelRects(state, w, h);
  for (const r of rects) {
    const frame = Math.round(r.w * 0.07);
    ctx.save();
    ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
    ctx.rotate(r.tilt || 0);
    ctx.fillStyle = '#fdf8f2';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = r.w * 0.06;
    ctx.shadowOffsetY = r.w * 0.03;
    ctx.fillRect(-r.w / 2 - frame, -r.h / 2 - frame, r.w + frame * 2, r.h + frame * 2);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    const inner = { x: -r.w / 2, y: -r.h / 2, w: r.w, h: r.h };
    ctx.save();
    ctx.beginPath();
    ctx.rect(inner.x, inner.y, inner.w, inner.h);
    ctx.clip();
    const img = state.photos[r.slot];
    if (img) {
      const p = clampPan(state.pans[r.slot], img, inner.w, inner.h);
      const base = Math.max(inner.w / img.naturalWidth, inner.h / img.naturalHeight);
      const sw = img.naturalWidth * base * p.zoom;
      const sh = img.naturalHeight * base * p.zoom;
      ctx.drawImage(img, inner.x + (inner.w - sw) / 2 + p.dx, inner.y + (inner.h - sh) / 2 + p.dy, sw, sh);
    } else {
      drawArt(ctx, ART_KINDS[(r.slot + 1) % ART_KINDS.length], inner.x, inner.y, inner.w, inner.h, g);
    }
    ctx.restore();
    ctx.fillStyle = '#fdf8f2';
    ctx.fillRect(-r.w / 2 - frame, r.h / 2, r.w + frame * 2, frame * 1.6);
    ctx.restore();
  }
}

export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const g = grade(state.grade);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (state.layout === 'nine-panel') drawGridCover(ctx, state, g, w, h, true);
  else if (state.layout === 'full-bleed') drawFullBleed(ctx, state, g, w, h);
  else if (state.layout === 'tilted-snaps') drawTiltedSnaps(ctx, state, g, w, h);
  else drawGridCover(ctx, state, g, w, h, false);
}
