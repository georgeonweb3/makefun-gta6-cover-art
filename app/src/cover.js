// Renders the poster onto any canvas: panels, code-drawn artwork, the colour
// grade and the caption. The preview canvas and the PNG export share this one
// function, so what you see is exactly what you save.

import { drawSky, drawSun, drawSkyline, drawPalm, drawCar, drawNeonGrid, drawHalftone } from './art.js';
import { gradeById } from './grades.js';

export const LAYOUTS = [
  { id: 'vice-grid', name: 'Vice Grid', blurb: 'Hero photo with two stacked panels' },
  { id: 'nine-panel', name: 'Nine Panel', blurb: 'A 3 by 3 grid with a title block' },
  { id: 'full-bleed', name: 'Full Bleed', blurb: 'One photo, edge to edge' },
  { id: 'tilted-snaps', name: 'Tilted Snaps', blurb: 'Three snapshots over a sunset skyline' },
];

export const SIZES = [
  { id: 'square', name: 'Square', w: 1080, h: 1080, label: '1080 × 1080' },
  { id: 'portrait', name: 'Portrait', w: 1080, h: 1350, label: '1080 × 1350' },
  { id: 'wide', name: 'Landscape', w: 1920, h: 1080, label: '1920 × 1080' },
];

/** Panels for a layout, in fractions of the poster. `photo` is a photo-slot
 *  index, or -1 for a drawn-art cell. `tilt` is radians, `frame` adds a
 *  white snapshot border. */
export function panelsFor(layoutId) {
  if (layoutId === 'nine-panel') {
    const g = 0.014;
    const cell = (1 - g * 4) / 3;
    const photos = [0, 1, 2, 0, -1, 1, 2, 0, 1];
    const panels = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        panels.push({
          x: g + col * (cell + g), y: g + row * (cell + g), w: cell, h: cell,
          photo: photos[row * 3 + col], tilt: 0, frame: 'none',
        });
      }
    }
    return panels;
  }
  if (layoutId === 'full-bleed') {
    return [{ x: 0, y: 0, w: 1, h: 1, photo: 0, tilt: 0, frame: 'none' }];
  }
  if (layoutId === 'tilted-snaps') {
    return [
      { x: 0.04, y: 0.3, w: 0.4, h: 0.52, photo: 0, tilt: -0.12, frame: 'snap' },
      { x: 0.31, y: 0.24, w: 0.4, h: 0.52, photo: 1, tilt: 0.03, frame: 'snap' },
      { x: 0.58, y: 0.32, w: 0.4, h: 0.52, photo: 2, tilt: 0.1, frame: 'snap' },
    ];
  }
  // vice-grid
  const g = 0.018;
  return [
    { x: 0, y: 0, w: 0.64, h: 1, photo: 0, tilt: 0, frame: 'none' },
    { x: 0.64 + g, y: 0, w: 1 - 0.64 - g, h: 0.5 - g / 2, photo: 1, tilt: 0, frame: 'none' },
    { x: 0.64 + g, y: 0.5 + g / 2, w: 1 - 0.64 - g, h: 0.5 - g / 2, photo: 2, tilt: 0, frame: 'none' },
  ];
}

/** Draws one photo cover-fitting its rect, honouring zoom and pan offsets. */
function drawPhotoInto(ctx, img, rx, ry, rw, rh, zoom, ox, oy) {
  const base = Math.max(rw / img.naturalWidth, rh / img.naturalHeight);
  const scale = base * Math.max(1, zoom);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const maxOx = Math.max(0, (dw - rw) / 2) / rw;
  const maxOy = Math.max(0, (dh - rh) / 2) / rh;
  const cx = Math.max(-maxOx, Math.min(maxOx, ox || 0));
  const cy = Math.max(-maxOy, Math.min(maxOy, oy || 0));
  ctx.drawImage(img, rx + (rw - dw) / 2 + cx * rw, ry + (rh - dh) / 2 + cy * rh, dw, dh);
}

/** A panel with no photo yet: stripes, a small sun and the slot number. */
function drawEmptyPanel(ctx, rx, ry, rw, rh, slot) {
  const g = ctx.createLinearGradient(rx, ry, rx + rw, ry + rh);
  g.addColorStop(0, '#3b1a5e');
  g.addColorStop(1, '#1c0b30');
  ctx.fillStyle = g;
  ctx.fillRect(rx, ry, rw, rh);
  drawSun(ctx, rx + rw * 0.5, ry + rh * 0.38, Math.min(rw, rh) * 0.16, '#ff9e57', '#3b1a5e');
  ctx.fillStyle = '#f4eef7';
  ctx.font = `${Math.max(14, rh * 0.06)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(`PHOTO ${slot + 1}`, rx + rw / 2, ry + rh * 0.72);
  ctx.font = `${Math.max(11, rh * 0.035)}px system-ui, sans-serif`;
  ctx.fillStyle = '#b9a8c4';
  ctx.fillText('tap a slot to add one', rx + rw / 2, ry + rh * 0.82);
}

/** Word-wraps text to a max width at a given font, returning fitted lines. */
function wrapLines(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) line = test;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

/** Big condensed caption with a hard outline and a neon drop shadow. */
function drawCaptionBlock(ctx, text, sub, box, W, H, accent) {
  const clean = (text || '').trim().toUpperCase();
  if (!clean && !(sub || '').trim()) return;
  const maxW = box.w * W;
  let size = box.size * H;
  ctx.textAlign = box.align;
  const anchorX = box.x * W;
  const setFont = (s) => { ctx.font = `${s}px Anton, sans-serif`; };
  setFont(size);
  while (size > 16 && ctx.measureText(clean).width > maxW) { size *= 0.92; setFont(size); }
  const lines = wrapLines(ctx, clean, maxW);
  const lineH = size * 1.04;
  // box.y is the TOP of the text block: the first baseline sits one size down.
  let y = box.y * H + size;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.textBaseline = 'alphabetic';
  for (const lineText of lines) {
    // Neon shadow copy, then a dark outline, then the white face.
    ctx.fillStyle = accent;
    ctx.fillText(lineText, anchorX + size * 0.05, y + size * 0.05);
    ctx.strokeStyle = 'rgba(20, 4, 32, 0.9)';
    ctx.lineWidth = Math.max(2, size * 0.1);
    ctx.strokeText(lineText, anchorX, y);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(lineText, anchorX, y);
    y += lineH;
  }
  ctx.restore();
  const subText = (sub || '').trim();
  if (subText) {
    const subSize = Math.max(14, size * 0.34);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.textAlign = box.align;
    // Dark outline first so the script stays readable over bright art.
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(20, 4, 32, 0.85)';
    ctx.lineWidth = Math.max(2, subSize * 0.12);
    ctx.strokeText(subText, anchorX, y + subSize * 0.5);
    ctx.fillStyle = '#ffc857';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = subSize * 0.25;
    ctx.fillText(subText, anchorX, y + subSize * 0.5);
    ctx.shadowBlur = 0;
  }
}

/** Where the caption sits for each layout (fractions of the poster, box.y is
 *  the top of the text block). */
function captionBoxFor(layoutId) {
  if (layoutId === 'nine-panel') return { x: 0.5, y: 0.4, w: 0.3, size: 0.055, align: 'center' };
  if (layoutId === 'full-bleed') return { x: 0.045, y: 0.8, w: 0.62, size: 0.085, align: 'left' };
  if (layoutId === 'tilted-snaps') return { x: 0.5, y: 0.045, w: 0.86, size: 0.075, align: 'center' };
  return { x: 0.035, y: 0.78, w: 0.58, size: 0.085, align: 'left' };
}

/** Draws the whole poster onto `canvas` from `state`. */
export function drawPoster(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = gradeById(state.grade);
  const layout = state.layout;

  // --- Backdrop ---
  if (layout === 'tilted-snaps') {
    drawSky(ctx, 0, 0, W, H, grade.skyTop, grade.skyBottom);
    // Sun tucked into the top-right corner, clear of the centred caption.
    drawSun(ctx, W * 0.86, H * 0.16, H * 0.1, grade.sun, grade.skyBottom);
    drawSkyline(ctx, 0, H * 0.62, W, H * 0.2, '#1c0b30', '#ffd166', 11);
    drawNeonGrid(ctx, 0, H * 0.62, W, H * 0.38, '#ff2e88', 0.5);
    drawPalm(ctx, W * 0.05, H * 0.66, H * 0.2, '#14081f');
    drawPalm(ctx, W * 0.93, H * 0.68, H * 0.16, '#14081f');
  } else {
    ctx.fillStyle = '#170a24';
    ctx.fillRect(0, 0, W, H);
  }

  // --- Panels ---
  const panels = panelsFor(layout);
  panels.forEach((p, index) => {
    const rx = p.x * W, ry = p.y * H, rw = p.w * W, rh = p.h * H;
    ctx.save();
    // Move into the panel's own frame so every draw below is panel-local.
    ctx.translate(rx + rw / 2, ry + rh / 2);
    if (p.tilt) ctx.rotate(p.tilt);
    ctx.translate(-rw / 2, -rh / 2);
    if (p.tilt) {
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = W * 0.02;
      ctx.shadowOffsetY = H * 0.012;
    }
    if (p.frame === 'snap') {
      const pad = Math.max(6, W * 0.008);
      ctx.fillStyle = '#fdf8ef';
      ctx.fillRect(-pad, -pad, rw + pad * 2, rh + pad * 2);
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    }
    ctx.beginPath();
    ctx.rect(0, 0, rw, rh);
    ctx.clip();
    const slot = state.photos[p.photo];
    if (p.photo === -1) {
      // Title cell: sky, sun, skyline and halftone, caption drawn later.
      drawSky(ctx, 0, 0, rw, rh, grade.skyTop, grade.skyBottom);
      drawSun(ctx, rw * 0.5, rh * 0.36, Math.min(rw, rh) * 0.22, grade.sun, grade.skyBottom);
      drawSkyline(ctx, 0, rh * 0.92, rw, rh * 0.3, '#1c0b30', '#ffd166', 4);
      drawHalftone(ctx, 0, 0, rw, rh * 0.3, '#ffffff', 0.25);
    } else if (slot && slot.img) {
      drawPhotoInto(ctx, slot.img, 0, 0, rw, rh, slot.zoom, slot.ox, slot.oy);
    } else {
      drawEmptyPanel(ctx, 0, 0, rw, rh, p.photo);
    }
    ctx.restore();
    // Thin neon gutter around grid panels, and the selected-panel outline.
    if (p.frame === 'none' && layout !== 'full-bleed') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = Math.max(1, W * 0.0015);
      ctx.strokeRect(rx, ry, rw, rh);
    }
    if (state.selected === index) {
      ctx.save();
      ctx.strokeStyle = '#2de2ff';
      ctx.lineWidth = Math.max(3, W * 0.004);
      ctx.setLineDash([W * 0.02, W * 0.012]);
      ctx.strokeRect(rx - 2, ry - 2, rw + 4, rh + 4);
      ctx.restore();
    }
  });

  // --- Full-bleed title band: skyline, car and a dark strip for the words ---
  if (layout === 'full-bleed') {
    const bandH = H * 0.24;
    const bandY = H - bandH;
    ctx.fillStyle = 'rgba(12, 4, 22, 0.72)';
    ctx.fillRect(0, bandY, W, bandH);
    drawSkyline(ctx, 0, bandY + bandH * 0.42, W, bandH * 0.4, '#0d0518', '#ffd166', 23);
    const carW = Math.min(W * 0.34, bandH * 2.4);
    drawCar(ctx, W - carW - W * 0.04, bandY + bandH * 0.42, carW, '#ff2e88');
  }

  // --- Grade over photos and art, caption stays crisp on top ---
  grade.apply(ctx, W, H);
  drawHalftone(ctx, W * 0.82, H * 0.02, W * 0.16, H * 0.1, '#ffffff', 0.16);
  drawCaptionBlock(ctx, state.caption, state.subtitle, captionBoxFor(layout), W, H, '#ff2e88');
}

/** Renders the poster to a fresh offscreen canvas at the given size. */
export function renderPoster(state, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawPoster(canvas, state);
  return canvas;
}
