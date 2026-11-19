// Every illustrated element on the poster, drawn in code: gradient skies, a
// striped retro sun, a skyline, palm silhouettes, a low sports car, a neon
// perspective grid and halftone dots. No image assets are used anywhere.

/** Vertical sky gradient across the whole rect. */
export function drawSky(ctx, x, y, w, h, top, bottom) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

/** Retro sun: a soft glow, then a filled disc with the lower half cut into
 *  horizontal stripes. */
export function drawSun(ctx, cx, cy, r, color, stripeColor) {
  ctx.save();
  // Halo so the disc reads against a bright sky.
  const halo = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 1.9);
  halo.addColorStop(0, color + '44');
  halo.addColorStop(1, color + '00');
  ctx.fillStyle = halo;
  ctx.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Stripe the bottom half away so the disc reads as a setting sun.
  ctx.fillStyle = stripeColor;
  let band = cy + r * 0.08;
  let gap = r * 0.07;
  while (band < cy + r) {
    ctx.fillRect(cx - r - 2, band, r * 2 + 4, gap);
    band += gap * 2.4;
    gap *= 1.35;
  }
  ctx.restore();
}

/** A row of flat-roofed towers with lit windows, sitting on a baseline. */
export function drawSkyline(ctx, x, baseY, w, h, color, windowColor, seed = 7) {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  ctx.fillStyle = color;
  let cursor = x;
  while (cursor < x + w) {
    const bw = w * (0.05 + rand() * 0.08);
    const bh = h * (0.35 + rand() * 0.65);
    ctx.fillRect(cursor, baseY - bh, bw, bh);
    // A couple of lit windows on the taller towers.
    if (bh > h * 0.55) {
      ctx.fillStyle = windowColor;
      const rows = Math.floor(bh / (h * 0.16));
      for (let i = 0; i < rows; i++) {
        if (rand() > 0.45) ctx.fillRect(cursor + bw * 0.22, baseY - bh + h * 0.08 + i * h * 0.16, bw * 0.18, h * 0.07);
        if (rand() > 0.55) ctx.fillRect(cursor + bw * 0.6, baseY - bh + h * 0.08 + i * h * 0.16, bw * 0.18, h * 0.07);
      }
      ctx.fillStyle = color;
    }
    cursor += bw + w * 0.012;
  }
}

/** One palm silhouette: curved trunk plus five drooping fronds. */
export function drawPalm(ctx, x, y, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size * 0.07;
  ctx.lineCap = 'round';
  // Trunk, leaning gently to the right.
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + size * 0.12, y - size * 0.55, x + size * 0.3, y - size * 0.95);
  ctx.stroke();
  const topX = x + size * 0.3;
  const topY = y - size * 0.95;
  // Fronds fan out from the crown, each a tapered curve.
  const fronds = [
    [-0.95, -0.25, -1.25, 0.35], [-0.55, -0.55, -0.9, 0.15], [-0.1, -0.7, -0.35, 0.05],
    [0.4, -0.6, 0.55, 0.1], [0.85, -0.35, 1.05, 0.3],
  ];
  for (const [dx, dy, ex, ey] of fronds) {
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + size * dx * 0.55, topY + size * dy * 0.55, topX + size * ex, topY + size * ey + size * 0.28);
    ctx.quadraticCurveTo(topX + size * dx * 0.5, topY + size * dy * 0.5 + size * 0.12, topX, topY);
    ctx.fill();
  }
  ctx.restore();
}

/** A low wedge sports car in side profile, with wheels, glass and a tail fin. */
export function drawCar(ctx, x, y, w, color, glass = '#bfe9ff', glow = '#ff2e88') {
  const h = w * 0.26;
  ctx.save();
  ctx.translate(x, y);
  // Ground glow under the car.
  const glowGrad = ctx.createRadialGradient(w * 0.5, h * 0.92, 4, w * 0.5, h * 0.92, w * 0.55);
  glowGrad.addColorStop(0, glow + '55');
  glowGrad.addColorStop(1, glow + '00');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, h * 0.55, w, h * 0.45);
  // Body: a long wedge with a sloped nose and a raised tail.
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.78);
  ctx.lineTo(w * 0.08, h * 0.62);
  ctx.lineTo(w * 0.34, h * 0.52);
  ctx.lineTo(w * 0.44, h * 0.22);
  ctx.lineTo(w * 0.62, h * 0.2);
  ctx.lineTo(w * 0.78, h * 0.5);
  ctx.lineTo(w * 0.96, h * 0.58);
  ctx.lineTo(w, h * 0.72);
  ctx.lineTo(w * 0.97, h * 0.82);
  ctx.lineTo(0, h * 0.82);
  ctx.closePath();
  ctx.fill();
  // Glasshouse.
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.moveTo(w * 0.46, h * 0.28);
  ctx.lineTo(w * 0.6, h * 0.26);
  ctx.lineTo(w * 0.72, h * 0.5);
  ctx.lineTo(w * 0.4, h * 0.5);
  ctx.closePath();
  ctx.fill();
  // Side stripe and headlight.
  ctx.fillStyle = glow;
  ctx.fillRect(w * 0.06, h * 0.66, w * 0.86, h * 0.045);
  ctx.fillStyle = '#fff7c0';
  ctx.fillRect(w * 0.9, h * 0.6, w * 0.07, h * 0.07);
  // Wheels.
  for (const wx of [w * 0.22, w * 0.8]) {
    ctx.fillStyle = '#0c0c12';
    ctx.beginPath();
    ctx.arc(wx, h * 0.82, h * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d8d8e0';
    ctx.beginPath();
    ctx.arc(wx, h * 0.82, h * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Perspective grid floor: horizontal lines receding toward a vanishing point. */
export function drawNeonGrid(ctx, x, y, w, h, color, alpha = 0.55) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, w * 0.0016);
  const horizon = y + h * 0.18;
  const vanishX = x + w * 0.5;
  // Receding verticals fanning out from the vanishing point.
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(vanishX + i * w * 0.02, horizon);
    ctx.lineTo(vanishX + i * w * 0.11, y + h);
    ctx.stroke();
  }
  // Horizontals, packed tighter near the horizon.
  for (let i = 0; i < 7; i++) {
    const t = (i / 6) ** 1.8;
    const yy = horizon + (y + h - horizon) * t;
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x + w, yy);
    ctx.stroke();
  }
  ctx.restore();
}

/** Rows of halftone dots, fading out across the rect. */
export function drawHalftone(ctx, x, y, w, h, color, alpha = 0.35, step = null) {
  const s = step ?? Math.max(10, w * 0.014);
  ctx.save();
  ctx.fillStyle = color;
  for (let yy = y; yy < y + h; yy += s) {
    for (let xx = x; xx < x + w; xx += s) {
      const fade = 1 - (xx - x) / w;
      const r = (s * 0.32) * Math.max(0.15, fade);
      ctx.globalAlpha = alpha * fade;
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
