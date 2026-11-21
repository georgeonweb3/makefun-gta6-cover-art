// Cover rendering for Neon Coast Cover Studio.
// A cover is drawn on a canvas: a grade sky, panels holding either a
// photo (zoomed and panned, clamped so it always covers its panel) or
// code-drawn art, and bold caption lettering. The same renderer draws
// the editor preview and the exported PNGs.

import { drawPanelArt, ART_KINDS } from './art.js';

export const LAYOUTS = [
  { id: 'vice', name: 'Vice Grid' },
  { id: 'nine', name: 'Nine Panel' },
  { id: 'bleed', name: 'Full Bleed' },
  { id: 'tilted', name: 'Tilted Snaps' },
];

export const EXPORT_SIZES = [
  { id: 'square', label: '1080 x 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: '1080 x 1350', w: 1080, h: 1350 },
  { id: 'wide', label: '1920 x 1080', w: 1920, h: 1080 },
];

const GAP = 10;

// Panel rectangles for a layout inside a W x H cover. Returns the title
// band (or null) and the panels, each with an art kind for empty panels.
export function layoutPanels(layoutId, W, H) {
  const g = Math.round(Math.min(W, H) * 0.012) || 8;
  if (layoutId === 'nine') {
    const titleH = Math.round(H * 0.15);
    const top = titleH + g;
    const cw = (W - g * 4) / 3;
    const ch = (H - top - g * 4) / 3;
    const panels = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        panels.push({
          x: g + c * (cw + g),
          y: top + g + r * (ch + g),
          w: cw,
          h: ch,
          art: ART_KINDS[(r * 3 + c) % ART_KINDS.length],
        });
      }
    }
    return { title: { x: 0, y: 0, w: W, h: titleH }, panels };
  }
  if (layoutId === 'bleed') {
    return { title: null, panels: [{ x: 0, y: 0, w: W, h: H, art: 'sun' }] };
  }
  if (layoutId === 'tilted') {
    const titleH = Math.round(H * 0.16);
    const top = titleH + g * 2;
    const pw = W * 0.3;
    const ph = (H - top) * 0.82;
    const arts = ['palms', 'car', 'sun'];
    const panels = [0, 1, 2].map((i) => ({
      x: W * 0.05 + i * (W * 0.32),
      y: top + (i === 1 ? 0 : H * 0.05),
      w: pw,
      h: ph,
      art: arts[i],
      tilt: [-6, 0, 6][i],
    }));
    return { title: { x: 0, y: 0, w: W, h: titleH }, panels };
  }
  // Vice Grid: 2 x 2 panels under a title band.
  const titleH = Math.round(H * 0.2);
  const top = titleH + g;
  const cw = (W - g * 3) / 2;
  const ch = (H - top - g * 3) / 2;
  const arts = ['sun', 'skyline', 'palms', 'car'];
  const panels = [];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      panels.push({
        x: g + c * (cw + g),
        y: top + g + r * (ch + g),
        w: cw,
        h: ch,
        art: arts[r * 2 + c],
      });
    }
  }
  return { title: { x: 0, y: 0, w: W, h: titleH }, panels };
}

// Draw a photo into a panel rect at a zoom, panned by (px, py) fractions
// of the slack. The pan is clamped so the photo always covers the panel.
export function drawPhoto(ctx, img, rect, zoom, pan) {
  if (!img) return;
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const s = base * zoom;
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  const slackX = Math.max(0, (dw - rect.w) / 2);
  const slackY = Math.max(0, (dh - rect.h) / 2);
  const px = Math.max(-1, Math.min(1, pan.x)) * slackX;
  const py = Math.max(-1, Math.min(1, pan.y)) * slackY;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, rect.x + (rect.w - dw) / 2 + px, rect.y + (rect.h - dh) / 2 + py, dw, dh);
  ctx.restore();
}

// Caption lettering: Anton title, Pacifico subtitle, dark outline and a
// coloured drop shadow so the words read over any photo.
export function drawCaption(ctx, rect, title, subtitle, grade, W) {
  if (!rect) return;
  const cx = rect.x + rect.w / 2;
  // Title, slightly tilted for energy. Shrink it until it fits the band.
  let titleSize = Math.max(28, Math.round(rect.h * 0.52));
  ctx.font = `${titleSize}px Anton, sans-serif`;
  const maxTitleW = rect.w * 0.94;
  const titleText = title.toUpperCase();
  while (titleSize > 20 && ctx.measureText(titleText).width > maxTitleW) {
    titleSize = Math.round(titleSize * 0.92);
    ctx.font = `${titleSize}px Anton, sans-serif`;
  }
  const subSize = Math.max(16, Math.round(rect.h * 0.24));
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  // Title, slightly tilted for energy.
  ctx.translate(cx, rect.y + rect.h * 0.42);
  ctx.rotate(-0.02);
  ctx.font = `${titleSize}px Anton, sans-serif`;
  ctx.shadowColor = grade.accent;
  ctx.shadowBlur = titleSize * 0.25;
  ctx.shadowOffsetY = titleSize * 0.06;
  ctx.strokeStyle = grade.outline;
  ctx.lineWidth = Math.max(3, titleSize * 0.12);
  ctx.strokeText(titleText, 0, 0);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = grade.title;
  ctx.fillText(titleText, 0, 0);
  ctx.restore();
  // Subtitle in script, under the title.
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${subSize}px Pacifico, cursive`;
  ctx.shadowColor = grade.outline;
  ctx.shadowBlur = subSize * 0.3;
  ctx.fillStyle = grade.subtitle;
  ctx.fillText(subtitle, cx, rect.y + rect.h * 0.84);
  ctx.restore();
}

// A thin neon frame around a panel.
function framePanel(ctx, rect, grade) {
  ctx.save();
  ctx.strokeStyle = grade.title;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = Math.max(2, rect.w * 0.008);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

// Render the whole cover on ctx at W x H from the editor state.
export function renderCover(ctx, W, H, state) {
  const grade = state.grade;
  const { title, panels } = layoutPanels(state.layout, W, H);
  // Sky background.
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // Panels.
  panels.forEach((p, i) => {
    const slot = state.photos.length ? i % state.photos.length : 0;
    const photo = state.photos[slot] || null;
    const hasPhoto = !!photo;
    ctx.save();
    if (p.tilt) {
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate((p.tilt * Math.PI) / 180);
      ctx.translate(-p.w / 2, -p.h / 2);
      p = { ...p, x: 0, y: 0 };
    }
    if (hasPhoto) {
      drawPhoto(ctx, photo, p, state.zooms[slot] || 1, state.pans[slot] || { x: 0, y: 0 });
      // Grade tint unifies photos with the art.
      ctx.fillStyle = grade.tint;
      ctx.fillRect(p.x, p.y, p.w, p.h);
    } else {
      drawPanelArt(ctx, p, p.art, grade, 11 + i * 7);
    }
    framePanel(ctx, p, grade);
    ctx.restore();
  });
  // Caption.
  if (title) {
    drawCaption(ctx, title, state.title, state.subtitle, grade, W);
  } else {
    // Full Bleed: title over a scrim at the bottom.
    const scrim = ctx.createLinearGradient(0, H * 0.6, 0, H);
    scrim.addColorStop(0, 'rgba(10, 4, 24, 0)');
    scrim.addColorStop(1, 'rgba(10, 4, 24, 0.82)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, H * 0.6, W, H * 0.4);
    drawCaption(
      ctx,
      { x: 0, y: H * 0.68, w: W, h: H * 0.28 },
      state.title,
      state.subtitle,
      grade,
      W,
    );
  }
}

// Render an export-size cover to a fresh canvas and return it.
export function exportCanvas(size, state) {
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  renderCover(ctx, size.w, size.h, state);
  return canvas;
}
