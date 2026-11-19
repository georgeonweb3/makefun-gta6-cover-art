// art.js — original vector illustration for the cover: a retro sun, a neon-coast
// skyline, palm trees, a low sports car, a synthwave grid and halftone dots.
// Everything here is drawn from code (no images, no game art). All randomness
// comes from a seeded generator so the same cover always renders the same way.

/** mulberry32: a tiny deterministic random generator. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A retro striped sun: gradient disc with horizontal slices cut out. */
export function drawRetroSun(ctx, cx, cy, r, topColor, bottomColor) {
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, topColor);
  g.addColorStop(1, bottomColor);
  ctx.save();
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Slice the lower half with widening gaps, synthwave style.
  ctx.globalCompositeOperation = 'destination-out';
  let y = cy + r * 0.05;
  let gap = r * 0.03;
  while (y < cy + r) {
    ctx.fillRect(cx - r - 2, y, r * 2 + 4, gap);
    y += gap + r * 0.16;
    gap *= 1.5;
  }
  ctx.restore();
}

/** A city skyline silhouette with a few lit windows, seeded so it is stable. */
export function drawSkyline(ctx, x, y, w, h, color, seed) {
  const rnd = seededRandom(seed);
  ctx.save();
  ctx.fillStyle = color;
  let bx = x;
  while (bx < x + w) {
    const bw = w * (0.05 + rnd() * 0.07);
    const bh = h * (0.35 + rnd() * 0.65);
    ctx.fillRect(bx, y - bh, bw, bh);
    // Antenna on some towers.
    if (rnd() > 0.7) {
      ctx.fillRect(bx + bw / 2 - 1, y - bh - h * 0.12, 2, h * 0.12);
      ctx.beginPath();
      ctx.arc(bx + bw / 2, y - bh - h * 0.12, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Lit windows.
    ctx.save();
    ctx.fillStyle = 'rgba(255, 214, 120, 0.85)';
    const cols = Math.max(1, Math.floor(bw / 12));
    const rows = Math.max(1, Math.floor(bh / 16));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (rnd() > 0.62) ctx.fillRect(bx + 4 + c * 12, y - bh + 6 + r * 16, 5, 7);
      }
    }
    ctx.restore();
    bx += bw + 2;
  }
  ctx.restore();
}

/** One palm tree: curved trunk, drooping fronds, a few coconuts. */
export function drawPalm(ctx, x, y, s, lean, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  // Trunk, slightly curved.
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(6, -55, 2, -105);
  ctx.stroke();
  // Fronds.
  ctx.lineWidth = 5;
  const topX = 2;
  const topY = -105;
  for (let i = 0; i < 7; i++) {
    const ang = (-Math.PI / 2) + (i - 3) * 0.42;
    const len = 52 - Math.abs(i - 3) * 6;
    const ex = topX + Math.cos(ang) * len;
    const ey = topY + Math.sin(ang) * len * 0.55 + 18;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(ang) * len * 0.5,
      topY + Math.sin(ang) * len * 0.5 - 14,
      ex,
      ey,
    );
    ctx.stroke();
  }
  // Coconuts.
  ctx.beginPath();
  ctx.arc(topX - 5, topY + 4, 4, 0, Math.PI * 2);
  ctx.arc(topX + 6, topY + 5, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A low sports-car silhouette, side view, drawn as one filled path. */
export function drawCar(ctx, x, y, s, bodyColor, glassColor) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(-95, 0);
  ctx.lineTo(-88, -16);
  ctx.quadraticCurveTo(-70, -20, -52, -22);
  ctx.quadraticCurveTo(-30, -44, 8, -44);
  ctx.quadraticCurveTo(38, -44, 58, -24);
  ctx.quadraticCurveTo(82, -20, 92, -12);
  ctx.lineTo(95, 0);
  ctx.lineTo(88, 2);
  ctx.lineTo(-88, 2);
  ctx.closePath();
  ctx.fill();
  // Glass.
  ctx.fillStyle = glassColor;
  ctx.beginPath();
  ctx.moveTo(-46, -24);
  ctx.quadraticCurveTo(-28, -40, 4, -40);
  ctx.quadraticCurveTo(30, -40, 48, -24);
  ctx.closePath();
  ctx.fill();
  // Wheels.
  ctx.fillStyle = '#0d0b12';
  for (const wx of [-58, 58]) {
    ctx.beginPath();
    ctx.arc(wx, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cfd2da';
    ctx.beginPath();
    ctx.arc(wx, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0d0b12';
  }
  // Neon underglow.
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#ff2e88';
  ctx.filter = 'blur(6px)';
  ctx.fillRect(-92, 2, 184, 5);
  ctx.restore();
  ctx.restore();
}

/** Perspective synthwave grid fading toward a horizon line. */
export function drawNeonGrid(ctx, x, y, w, h, horizonY, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 1.5;
  const cx = x + w / 2;
  // Verticals fanning from the centre.
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * (w / 16), horizonY);
    ctx.lineTo(cx + i * (w / 4), y + h);
    ctx.stroke();
  }
  // Horizontals, spacing growing toward the viewer.
  let hy = horizonY;
  let step = 4;
  while (hy < y + h) {
    ctx.globalAlpha = 0.25 + 0.55 * ((hy - horizonY) / h);
    ctx.beginPath();
    ctx.moveTo(x, hy);
    ctx.lineTo(x + w, hy);
    ctx.stroke();
    hy += step;
    step *= 1.45;
  }
  ctx.restore();
}

/** Halftone dot field, dots shrinking toward one corner. */
export function drawHalftone(ctx, x, y, w, h, color, maxR) {
  ctx.save();
  ctx.fillStyle = color;
  const step = maxR * 2 + 7;
  for (let px = x; px < x + w; px += step) {
    for (let py = y; py < y + h; py += step) {
      const t = ((px - x) / w) * 0.6 + ((py - y) / h) * 0.4;
      const r = Math.max(0.6, maxR * (1 - t));
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
