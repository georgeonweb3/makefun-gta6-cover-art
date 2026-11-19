// The five colour grades. Each grade is a recipe of canvas treatments applied
// over the finished panels and artwork, before the caption is drawn so the
// lettering stays crisp: tinted gradient washes, a duotone pass, a vignette,
// and an optional grain of halftone dots.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Vice Sunset',
    swatch: '#ff7a3d',
    skyTop: '#2b1055', skyBottom: '#ff7a3d',
    sun: '#ffd166', sunCore: '#fff3b0',
    apply(ctx, w, h) {
      wash(ctx, w, h, 'rgba(255, 122, 61, 0.20)', 'soft-light');
      wash(ctx, w, h, 'rgba(255, 45, 120, 0.16)', 'overlay', true);
      vignette(ctx, w, h, 0.34);
    },
  },
  {
    id: 'neon',
    name: 'Neon Night',
    swatch: '#ff2e88',
    skyTop: '#0a0618', skyBottom: '#3b0f66',
    sun: '#ff2e88', sunCore: '#ff8ac2',
    apply(ctx, w, h) {
      wash(ctx, w, h, 'rgba(255, 46, 136, 0.22)', 'screen', true);
      wash(ctx, w, h, 'rgba(45, 226, 255, 0.18)', 'screen');
      vignette(ctx, w, h, 0.5);
      halftoneCorners(ctx, w, h, '#2de2ff', 0.3);
    },
  },
  {
    id: 'teal-orange',
    name: 'Teal / Orange',
    swatch: '#2ec4b6',
    skyTop: '#0d2b33', skyBottom: '#e07b39',
    sun: '#ffb347', sunCore: '#ffe9a8',
    apply(ctx, w, h) {
      wash(ctx, w, h, 'rgba(20, 120, 130, 0.26)', 'multiply', true);
      wash(ctx, w, h, 'rgba(255, 150, 60, 0.22)', 'soft-light');
      vignette(ctx, w, h, 0.38);
    },
  },
  {
    id: 'noir',
    name: 'Noir',
    swatch: '#8a8a8a',
    skyTop: '#2a2a33', skyBottom: '#5c5c68',
    sun: '#e8e8e8', sunCore: '#ffffff',
    apply(ctx, w, h) {
      // A grey fill in 'saturation' mode strips the colour out of everything below.
      ctx.save();
      ctx.globalCompositeOperation = 'saturation';
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
      wash(ctx, w, h, 'rgba(0, 0, 0, 0.22)', 'multiply', true);
      wash(ctx, w, h, 'rgba(255, 255, 255, 0.10)', 'screen');
      vignette(ctx, w, h, 0.55);
    },
  },
  {
    id: 'faded',
    name: 'Faded Film',
    swatch: '#e8c39e',
    skyTop: '#5c4a6e', skyBottom: '#e8a06a',
    sun: '#f2c879', sunCore: '#fdf0c0',
    apply(ctx, w, h) {
      wash(ctx, w, h, 'rgba(232, 195, 158, 0.30)', 'soft-light');
      wash(ctx, w, h, 'rgba(120, 90, 60, 0.12)', 'multiply', true);
      wash(ctx, w, h, 'rgba(255, 244, 220, 0.10)', 'screen');
      vignette(ctx, w, h, 0.22);
    },
  },
];

/** A full-canvas vertical wash. `flip` runs the gradient bottom-to-top. */
function wash(ctx, w, h, color, mode, flip = false) {
  const g = ctx.createLinearGradient(0, flip ? h : 0, 0, flip ? 0 : h);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.save();
  ctx.globalCompositeOperation = mode;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Darkens the edges so the middle of the poster pops. */
function vignette(ctx, w, h, strength) {
  const r = Math.hypot(w, h) / 2;
  const g = ctx.createRadialGradient(w / 2, h / 2, r * 0.45, w / 2, h / 2, r);
  g.addColorStop(0, 'rgba(0, 0, 0, 0)');
  g.addColorStop(1, `rgba(0, 0, 0, ${strength})`);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** A spray of halftone dots in the top-right corner, for the neon grade. */
function halftoneCorners(ctx, w, h, color, alpha) {
  const step = Math.max(12, w * 0.016);
  ctx.save();
  ctx.fillStyle = color;
  for (let yy = h * 0.02; yy < h * 0.22; yy += step) {
    for (let xx = w * 0.78; xx < w * 0.98; xx += step) {
      ctx.globalAlpha = alpha * (1 - (yy - h * 0.02) / (h * 0.2));
      ctx.beginPath();
      ctx.arc(xx, yy, step * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Looks a grade up by id, falling back to the first grade. */
export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}
