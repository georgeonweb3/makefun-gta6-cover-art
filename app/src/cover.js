// cover.js — the cover engine. Draws a GTA-style multi-panel poster cover
// onto a canvas: diagonal panel grid, bold Anton caption, neon-script subtitle,
// sunset / neon colour grades, grain and vignette. All art is original and
// drawn from code (see art.js); photos come from the user's own machine.
//
// A cover is described by a `state` object:
//   photos:  [Image|null, Image|null, Image|null]   (up to three)
//   panels:  [{photo, zoom, dx, dy}] per panel      (crop + position)
//   layout:  'vice-grid' | 'nine-panel' | 'full-bleed' | 'tilted'
//   grade:   'sunset' | 'neon' | 'vice' | 'heat' | 'noir'
//   caption, subtitle: strings
//   sizeKey: 'square' | 'portrait' | 'wide'
// drawCover(canvas, state) renders it at the canvas's own pixel size.

import {
  seededRandom,
  drawRetroSun,
  drawSkyline,
  drawPalm,
  drawCar,
  drawNeonGrid,
  drawHalftone,
} from './art.js';

export const SIZES = {
  square: { w: 1080, h: 1080, label: 'Square 1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080 x 1350' },
  wide: { w: 1920, h: 1080, label: 'Wide 1920 x 1080' },
};

export const LAYOUTS = {
  'vice-grid': 'Vice Grid',
  'nine-panel': 'Nine Panel',
  'full-bleed': 'Full Bleed',
  tilted: 'Tilted Snaps',
};

export const GRADES = {
  sunset: 'Sunset',
  neon: 'Neon Nights',
  vice: 'Vice Pink',
  heat: 'Heat Haze',
  noir: 'Noir',
};

const GRADE_TINTS = {
  sunset: { top: 'rgba(255, 122, 26, 0.28)', bottom: 'rgba(214, 32, 122, 0.42)', glow: '#ff7a1a' },
  neon: { top: 'rgba(0, 229, 255, 0.20)', bottom: 'rgba(255, 46, 136, 0.45)', glow: '#00e5ff' },
  vice: { top: 'rgba(255, 92, 168, 0.26)', bottom: 'rgba(124, 30, 190, 0.48)', glow: '#ff5ca8' },
  heat: { top: 'rgba(255, 80, 20, 0.34)', bottom: 'rgba(160, 10, 10, 0.45)', glow: '#ff5014' },
  noir: { top: 'rgba(120, 140, 180, 0.16)', bottom: 'rgba(5, 5, 16, 0.55)', glow: '#8fa3c8' },
};

const GRADE_FILTERS = {
  sunset: 'saturate(1.35) contrast(1.12)',
  neon: 'saturate(1.5) contrast(1.15) hue-rotate(-8deg)',
  vice: 'saturate(1.45) contrast(1.1)',
  heat: 'saturate(1.4) contrast(1.18)',
  noir: 'saturate(0.25) contrast(1.15) brightness(1.02)',
};

export function defaultState() {
  return {
    photos: [null, null, null],
    panels: [],
    layout: 'vice-grid',
    grade: 'sunset',
    caption: 'NEON HEAT',
    subtitle: 'Neon Coast nights',
    sizeKey: 'wide',
  };
}

/** Panel rectangles for a layout, in canvas pixels. */
export function layoutPanels(layout, w, h) {
  const isWide = w > h;
  if (layout === 'nine-panel') {
    const panels = [];
    const g = 0.012; // gutter
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        panels.push({
          x: (c / 3 + g / 2) * w,
          y: (r / 3 + g / 2) * h,
          w: (w / 3) * (1 - g),
          h: (h / 3) * (1 - g),
          kind: r === 1 && c === 1 ? 'title' : 'photo',
        });
      }
    }
    return panels;
  }
  if (layout === 'full-bleed') {
    return [{ x: 0, y: 0, w, h: h * 0.72, kind: 'photo' }];
  }
  if (layout === 'tilted') {
    const pw = w * 0.34;
    const ph = h * 0.52;
    return [
      { x: w * 0.06, y: h * 0.10, w: pw, h: ph, kind: 'photo', tilt: -0.07 },
      { x: w * 0.33, y: h * 0.07, w: pw, h: ph, kind: 'photo', tilt: 0.03 },
      { x: w * 0.60, y: h * 0.10, w: pw, h: ph, kind: 'photo', tilt: 0.08 },
    ];
  }
  // vice-grid: hero panel left, two stacked panels right, diagonal white bands.
  const split = isWide ? 0.56 : 0.58;
  return [
    { x: 0, y: 0, w: w * split, h, kind: 'photo' },
    { x: w * split, y: 0, w: w * (1 - split), h: h * 0.5, kind: 'photo' },
    { x: w * split, y: h * 0.5, w: w * (1 - split), h: h * 0.5, kind: 'photo' },
  ];
}

/** Ensures state.panels has one crop entry per panel of the current layout.
 * Default crops vary slightly per panel (dx/dy are fractions of panel size),
 * so the same photo reads as a different shot in each panel, and photos sit
 * a touch low, which favours faces near the top of the frame. */
export function syncPanels(state) {
  const rects = layoutPanels(state.layout, 1000, 1000);
  while (state.panels.length < rects.length) {
    const i = state.panels.length;
    state.panels.push({
      photo: i % 3,
      zoom: 1 + (i % 2) * 0.06,
      dx: ((i * 37) % 5 - 2) * 0.05,
      // Full Bleed's strip is far wider than a photo, so anchor its photo
      // toward the top (faces live there; positive dy moves the photo down,
      // showing its top); other layouts sit a touch low.
      dy: state.layout === 'full-bleed' ? 0.6 : 0.04,
    });
  }
  state.panels.length = rects.length;
}

/** Draws one photo (or a procedural scene when empty) into a panel rect. */
function drawPanelPhoto(ctx, rect, crop, photos, grade, seed) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const img = photos[crop.photo] ?? null;
  if (img) {
    ctx.filter = GRADE_FILTERS[grade];
    const base = Math.max(w / img.naturalWidth, h / img.naturalHeight) * crop.zoom;
    const pw = img.naturalWidth * base;
    const ph = img.naturalHeight * base;
    // Clamp the pan so the photo always covers the panel: no slack, no pan.
    const maxDx = Math.max(0, (pw - w) / 2);
    const maxDy = Math.max(0, (ph - h) / 2);
    const ox = Math.max(-maxDx, Math.min(maxDx, crop.dx * w));
    const oy = Math.max(-maxDy, Math.min(maxDy, crop.dy * h));
    ctx.drawImage(img, x + (w - pw) / 2 + ox, y + (h - ph) / 2 + oy, pw, ph);
    ctx.filter = 'none';
  } else {
    drawProceduralScene(ctx, x, y, w, h, seed);
  }
  // Grade tint over the panel.
  const tint = GRADE_TINTS[grade];
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, tint.top);
  g.addColorStop(1, tint.bottom);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** A procedural Vice-Coast scene used when a panel has no photo yet. */
function drawProceduralScene(ctx, x, y, w, h, seed) {
  const rnd = seededRandom(seed);
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, '#2b1055');
  sky.addColorStop(0.45, '#7597de');
  sky.addColorStop(0.7, '#ff7a5c');
  sky.addColorStop(1, '#ff2e88');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  drawRetroSun(ctx, x + w * (0.3 + rnd() * 0.4), y + h * 0.42, Math.min(w, h) * 0.2, '#ffd319', '#ff2975');
  drawSkyline(ctx, x, y + h * 0.78, w, h * 0.24, '#160a2e', seed + 7);
  drawNeonGrid(ctx, x, y + h * 0.78, w, h * 0.22, y + h * 0.78, 'rgba(0, 229, 255, 0.8)');
  drawPalm(ctx, x + w * 0.12, y + h * 0.8, Math.min(w, h) / 340, -0.12, '#0d0518');
  drawPalm(ctx, x + w * 0.88, y + h * 0.82, Math.min(w, h) / 380, 0.14, '#0d0518');
}

/** The sunset backdrop behind the tilted layout and the title band. */
function drawBackdrop(ctx, w, h, grade) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  if (grade === 'noir') {
    sky.addColorStop(0, '#0b0e1a');
    sky.addColorStop(0.55, '#232a44');
    sky.addColorStop(1, '#05060d');
  } else if (grade === 'neon') {
    sky.addColorStop(0, '#12033b');
    sky.addColorStop(0.5, '#3b0f66');
    sky.addColorStop(0.8, '#c9184a');
    sky.addColorStop(1, '#ff6d00');
  } else {
    sky.addColorStop(0, '#1b0f3b');
    sky.addColorStop(0.45, '#7b2d8b');
    sky.addColorStop(0.75, '#ff5e62');
    sky.addColorStop(1, '#ff9a3d');
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  drawRetroSun(ctx, w * 0.72, h * 0.34, Math.min(w, h) * 0.26, '#ffd319', '#ff2975');
  drawSkyline(ctx, 0, h * 0.86, w, h * 0.16, '#12061f', 42);
  drawNeonGrid(ctx, 0, h * 0.86, w, h * 0.14, h * 0.86, 'rgba(0, 229, 255, 0.75)');
  drawPalm(ctx, w * 0.05, h * 0.88, Math.min(w, h) / 300, -0.1, '#0a0414');
  drawPalm(ctx, w * 0.95, h * 0.9, Math.min(w, h) / 330, 0.12, '#0a0414');
}

/** The big caption + neon subtitle + badge, drawn in the title zone.
 * Everything is clipped to the zone and every line is fitted to its width,
 * so long words never spill onto the neighbouring panels. */
function drawTitleBlock(ctx, w, h, zone, caption, subtitle, grade) {
  const { x, y, w: zw, h: zh } = zone;
  const tint = GRADE_TINTS[grade];
  ctx.save();
  // Halftone corner + dark band behind the lettering.
  ctx.fillStyle = 'rgba(8, 4, 18, 0.55)';
  ctx.fillRect(x, y, zw, zh);
  drawHalftone(ctx, x + zw * 0.72, y + zh * 0.08, zw * 0.26, zh * 0.84, 'rgba(255, 255, 255, 0.16)', Math.max(2, zh * 0.02));
  ctx.beginPath();
  ctx.rect(x, y, zw, zh);
  ctx.clip();
  // Caption, fitted to the zone width.
  const text = (caption.trim() || 'NEON HEAT').toUpperCase();
  let size = zh * 0.52;
  ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  while (ctx.measureText(text).width > zw * 0.92 && size > 10) {
    size -= 2;
    ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  }
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  // Black offset + white face, GTA-poster style.
  ctx.fillStyle = '#0a0512';
  ctx.fillText(text, x + zw * 0.05 + size * 0.045, y + zh * 0.38 + size * 0.045);
  const face = ctx.createLinearGradient(0, y, 0, y + zh);
  face.addColorStop(0, '#ffffff');
  face.addColorStop(1, '#ffe9a8');
  ctx.fillStyle = face;
  ctx.fillText(text, x + zw * 0.05, y + zh * 0.38);
  // Pink underline bar, just under the caption, clear of the subtitle.
  ctx.fillStyle = tint.glow;
  ctx.fillRect(x + zw * 0.05, y + zh * 0.38 + size * 0.55, Math.min(zw * 0.3, ctx.measureText(text).width), Math.max(4, zh * 0.045));
  // Neon script subtitle, shrunk until it fits the zone.
  if (subtitle.trim()) {
    let subSize = Math.max(14, zh * 0.15);
    ctx.font = `${subSize}px Pacifico, cursive`;
    while (ctx.measureText(subtitle.trim()).width > zw * 0.9 && subSize > 10) {
      subSize -= 1;
      ctx.font = `${subSize}px Pacifico, cursive`;
    }
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = tint.glow;
    ctx.shadowBlur = subSize * 0.55;
    ctx.fillText(subtitle.trim(), x + zw * 0.05, y + zh * 0.80);
    ctx.shadowBlur = 0;
  }
  // Badge ribbon, top-right of the zone, shrunk until it fits.
  const badge = '★ NEON COAST ★';
  let badgeSize = Math.max(11, zh * 0.11);
  ctx.font = `bold ${badgeSize}px Anton, sans-serif`;
  let bw = ctx.measureText(badge).width + zh * 0.22;
  while (bw > zw * 0.96 && badgeSize > 8) {
    badgeSize -= 1;
    ctx.font = `bold ${badgeSize}px Anton, sans-serif`;
    bw = ctx.measureText(badge).width + zh * 0.22;
  }
  const bx = x + zw - bw - zw * 0.02;
  const by = y + zh * 0.06;
  const bh = zh * 0.2;
  ctx.fillStyle = '#ffd319';
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + bw, by);
  ctx.lineTo(bx + bw - bh * 0.5, by + bh);
  ctx.lineTo(bx, by + bh);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#14061f';
  ctx.textAlign = 'center';
  ctx.fillText(badge, bx + bw / 2, by + bh / 2);
  ctx.restore();
}

/** Deterministic film grain + vignette over the whole cover. */
function finishCover(ctx, w, h) {
  const rnd = seededRandom(1337);
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ffffff';
  const dots = Math.floor((w * h) / 900);
  for (let i = 0; i < dots; i++) {
    const s = 1 + rnd() * 2;
    ctx.fillRect(rnd() * w, rnd() * h, s, s);
  }
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#000000';
  for (let i = 0; i < dots; i++) {
    const s = 1 + rnd() * 2;
    ctx.fillRect(rnd() * w, rnd() * h, s, s);
  }
  ctx.restore();
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vg.addColorStop(1, 'rgba(5, 2, 12, 0.38)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
}

/** White frame + diagonal divider bands for the panel layouts. */
function drawPanelFrames(ctx, rects, w, h) {
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(3, w * 0.004);
  for (const r of rects) {
    if (r.kind !== 'photo') continue;
    if (r.tilt) {
      ctx.save();
      ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
      ctx.rotate(r.tilt);
      ctx.strokeRect(-r.w / 2, -r.h / 2, r.w, r.h);
      ctx.restore();
    } else {
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    }
  }
  // Outer white border, poster style.
  ctx.lineWidth = Math.max(6, w * 0.008);
  ctx.strokeRect(0, 0, w, h);
  ctx.restore();
}

/**
 * Draws the whole cover for `state` onto `canvas` at its own pixel size.
 * Deterministic: same state, same pixels.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  syncPanels(state);
  const rects = layoutPanels(state.layout, w, h);
  ctx.clearRect(0, 0, w, h);

  if (state.layout === 'tilted') {
    drawBackdrop(ctx, w, h, state.grade);
  } else if (state.layout === 'full-bleed') {
    ctx.fillStyle = '#160a2e';
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.fillStyle = '#0d0618';
    ctx.fillRect(0, 0, w, h);
  }

  // Photo panels (tilted ones rotate around their centre).
  rects.forEach((rect, i) => {
    if (rect.kind !== 'photo') return;
    const crop = state.panels[i];
    if (rect.tilt) {
      ctx.save();
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.tilt);
      ctx.translate(-(rect.x + rect.w / 2), -(rect.y + rect.h / 2));
      drawPanelPhoto(ctx, rect, crop, state.photos, state.grade, 100 + i * 31);
      ctx.restore();
    } else {
      drawPanelPhoto(ctx, rect, crop, state.photos, state.grade, 100 + i * 31);
    }
  });

  // Title zone per layout.
  if (state.layout === 'nine-panel') {
    const title = rects.find((r) => r.kind === 'title');
    drawTitleBlock(ctx, w, h, title, state.caption, state.subtitle, state.grade);
  } else if (state.layout === 'full-bleed') {
    drawTitleBlock(ctx, w, h, { x: 0, y: h * 0.72, w, h: h * 0.28 }, state.caption, state.subtitle, state.grade);
    // Sports car parked across the bottom of the photo.
    drawCar(ctx, w * 0.68, h * 0.685, Math.min(w, h) / 650, '#ff2e88', '#9be8ff');
  } else if (state.layout === 'tilted') {
    drawTitleBlock(ctx, w, h, { x: w * 0.05, y: h * 0.66, w: w * 0.9, h: h * 0.28 }, state.caption, state.subtitle, state.grade);
  } else {
    // vice-grid: title band across the bottom of the hero panel.
    drawTitleBlock(ctx, w, h, { x: 0, y: h * 0.78, w: w * 0.56, h: h * 0.22 }, state.caption, state.subtitle, state.grade);
  }

  drawPanelFrames(ctx, rects, w, h);
  finishCover(ctx, w, h);
}
