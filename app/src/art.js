// Code drawn art for the cover panels. Every picture here is drawn from paths and
// gradients, no photo and no borrowed artwork. The drawing is deterministic: the
// little random choices come from a seeded generator, so two runs paint the same bytes.
export function seeded(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function sky(ctx, x, y, w, h, g) {
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, g.skyTop);
  grad.addColorStop(0.55, g.skyMid);
  grad.addColorStop(1, g.skyBot);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
}

// A retro sun: a disc cut by horizontal bars that grow wider toward its foot.
export function drawSun(ctx, x, y, w, h, g) {
  sky(ctx, x, y, w, h, g);
  const cx = x + w / 2;
  const cy = y + h * 0.42;
  const r = Math.min(w, h) * 0.3;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const sunGrad = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  sunGrad.addColorStop(0, g.sunCore);
  sunGrad.addColorStop(1, g.sun);
  ctx.fillStyle = sunGrad;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = g.skyMid;
  let band = cy - r * 0.1;
  let gap = r * 0.03;
  while (band < cy + r) {
    ctx.fillRect(cx - r, band, r * 2, gap);
    band += gap + r * 0.11;
    gap *= 1.55;
  }
  ctx.restore();
  const glow = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 1.7);
  glow.addColorStop(0, g.sun + '55');
  glow.addColorStop(1, g.sun + '00');
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);
  ground(ctx, x, y, w, h, g);
}

function ground(ctx, x, y, w, h, g) {
  const gy = y + h * 0.78;
  ctx.fillStyle = g.frame;
  ctx.fillRect(x, gy, w, h - (gy - y));
  ctx.strokeStyle = g.neon;
  ctx.lineWidth = Math.max(1, h * 0.004);
  ctx.beginPath();
  ctx.moveTo(x, gy);
  ctx.lineTo(x + w, gy);
  ctx.stroke();
}

// A city skyline at dusk, windows lit in the grade's neon.
export function drawSkyline(ctx, x, y, w, h, g) {
  sky(ctx, x, y, w, h, g);
  const rand = seeded(7);
  const base = y + h * 0.8;
  ctx.fillStyle = g.frame;
  ctx.fillRect(x, base, w, h - (base - y));
  let bx = x;
  while (bx < x + w) {
    const bw = w * (0.09 + rand() * 0.1);
    const bh = h * (0.22 + rand() * 0.42);
    ctx.fillStyle = '#12041f';
    ctx.fillRect(bx, base - bh, bw, bh);
    if (rand() > 0.6) {
      ctx.fillRect(bx + bw * 0.3, base - bh - h * 0.07, bw * 0.4, h * 0.07);
    }
    ctx.fillStyle = g.neon2;
    const rows = Math.floor(bh / (h * 0.09));
    const cols = Math.floor(bw / (w * 0.05));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rand() > 0.55) {
          ctx.fillRect(bx + w * 0.015 + c * w * 0.05, base - bh + h * 0.03 + r * h * 0.09, w * 0.022, h * 0.035);
        }
      }
    }
    bx += bw + w * 0.015;
  }
  ctx.fillStyle = g.sun;
  ctx.beginPath();
  ctx.arc(x + w * 0.78, y + h * 0.2, Math.min(w, h) * 0.09, 0, Math.PI * 2);
  ctx.fill();
}

// Two palm silhouettes leaning over a neon horizon.
export function drawPalms(ctx, x, y, w, h, g) {
  sky(ctx, x, y, w, h, g);
  const horizon = y + h * 0.72;
  ctx.fillStyle = g.frame;
  ctx.fillRect(x, horizon, w, h - (horizon - y));
  ctx.strokeStyle = g.neon;
  ctx.lineWidth = Math.max(1, h * 0.005);
  ctx.beginPath();
  ctx.moveTo(x, horizon);
  ctx.lineTo(x + w, horizon);
  ctx.stroke();
  palm(ctx, x + w * 0.24, horizon, h * 0.62, -0.22, g);
  palm(ctx, x + w * 0.74, horizon, h * 0.5, 0.18, g);
}

function palm(ctx, baseX, baseY, size, lean, g) {
  const topX = baseX + size * lean;
  const topY = baseY - size;
  ctx.strokeStyle = '#0d0218';
  ctx.lineWidth = size * 0.045;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + size * lean * 0.4, baseY - size * 0.55, topX, topY);
  ctx.stroke();
  ctx.lineWidth = size * 0.032;
  for (let i = 0; i < 7; i++) {
    const a = (-0.08 - i * 0.14) * Math.PI;
    const len = size * (0.36 - Math.abs(i - 3) * 0.035);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(a) * len * 0.55, topY + Math.sin(a) * len * 0.5,
      topX + Math.cos(a) * len, topY + Math.sin(a) * len * 0.35 + len * 0.42,
    );
    ctx.stroke();
  }
}

// A low sports car side profile over a neon grid floor.
export function drawCar(ctx, x, y, w, h, g) {
  sky(ctx, x, y, w, h, g);
  const horizon = y + h * 0.58;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, horizon, w, h - (horizon - y));
  ctx.clip();
  ctx.strokeStyle = g.neon + 'aa';
  ctx.lineWidth = Math.max(1, h * 0.003);
  for (let i = 0; i <= 10; i++) {
    const px = x + w / 2 + (i - 5) * w * 0.16;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, horizon);
    ctx.lineTo(px, y + h);
    ctx.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const yy = horizon + (h - (horizon - y)) * (i / 5) * (i / 5);
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x + w, yy);
    ctx.stroke();
  }
  ctx.restore();
  const cw = w * 0.72;
  const ch = h * 0.2;
  const cx = x + w * 0.14;
  const cy = horizon - ch * 0.55;
  ctx.fillStyle = g.neon + '33';
  ctx.beginPath();
  ctx.ellipse(cx + cw / 2, horizon + h * 0.03, cw * 0.55, h * 0.03, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0d0218';
  ctx.beginPath();
  ctx.moveTo(cx, cy + ch * 0.9);
  ctx.lineTo(cx + cw * 0.06, cy + ch * 0.55);
  ctx.lineTo(cx + cw * 0.3, cy + ch * 0.42);
  ctx.quadraticCurveTo(cx + cw * 0.42, cy, cx + cw * 0.58, cy + ch * 0.1);
  ctx.lineTo(cx + cw * 0.78, cy + ch * 0.32);
  ctx.quadraticCurveTo(cx + cw * 0.95, cy + ch * 0.4, cx + cw, cy + ch * 0.62);
  ctx.lineTo(cx + cw, cy + ch * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = g.neon2;
  ctx.beginPath();
  ctx.moveTo(cx + cw * 0.34, cy + ch * 0.44);
  ctx.quadraticCurveTo(cx + cw * 0.44, cy + ch * 0.14, cx + cw * 0.56, cy + ch * 0.2);
  ctx.lineTo(cx + cw * 0.72, cy + ch * 0.36);
  ctx.closePath();
  ctx.fill();
  wheel(ctx, cx + cw * 0.24, cy + ch * 0.9, ch * 0.26, g);
  wheel(ctx, cx + cw * 0.78, cy + ch * 0.9, ch * 0.26, g);
  ctx.fillStyle = g.neon;
  ctx.fillRect(cx + cw * 0.94, cy + ch * 0.5, cw * 0.05, ch * 0.08);
}

function wheel(ctx, wx, wy, r, g) {
  ctx.fillStyle = '#05010a';
  ctx.beginPath();
  ctx.arc(wx, wy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = g.neon;
  ctx.lineWidth = Math.max(1, r * 0.1);
  ctx.beginPath();
  ctx.arc(wx, wy, r * 0.55, 0, Math.PI * 2);
  ctx.stroke();
}

// A perspective neon grid, the floor of the Vice City look. withSun false leaves the
// sky clear, for layouts that put their own title over it.
export function drawGrid(ctx, x, y, w, h, g, withSun = true) {
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, g.skyTop);
  grad.addColorStop(1, g.panel);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  const horizon = y + h * 0.42;
  ctx.strokeStyle = g.neon;
  ctx.lineWidth = Math.max(1, h * 0.004);
  for (let i = -6; i <= 6; i++) {
    ctx.beginPath();
    ctx.moveTo(x + w / 2, horizon);
    ctx.lineTo(x + w / 2 + i * w * 0.24, y + h);
    ctx.stroke();
  }
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const yy = horizon + (h - (horizon - y)) * t * t;
    ctx.globalAlpha = 0.35 + t * 0.65;
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x + w, yy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  if (withSun) {
    ctx.fillStyle = g.sun;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.2, Math.min(w, h) * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Halftone dots that grow toward the corner, a print poster texture.
export function drawHalftone(ctx, x, y, w, h, g) {
  ctx.fillStyle = g.panel;
  ctx.fillRect(x, y, w, h);
  const step = Math.max(10, w * 0.045);
  for (let ry = 0; ry * step < h; ry++) {
    for (let cx = 0; cx * step < w; cx++) {
      const px = x + cx * step + step / 2;
      const py = y + ry * step + step / 2;
      const d = Math.hypot(px - (x + w), py - (y + h)) / Math.hypot(w, h);
      const r = step * 0.42 * (1 - d) + step * 0.06;
      ctx.fillStyle = (cx + ry) % 2 === 0 ? g.neon : g.neon2;
      ctx.globalAlpha = 0.5 + (1 - d) * 0.5;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

export function drawArt(ctx, kind, x, y, w, h, g) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (kind === 'sun') drawSun(ctx, x, y, w, h, g);
  else if (kind === 'skyline') drawSkyline(ctx, x, y, w, h, g);
  else if (kind === 'palms') drawPalms(ctx, x, y, w, h, g);
  else if (kind === 'car') drawCar(ctx, x, y, w, h, g);
  else if (kind === 'grid') drawGrid(ctx, x, y, w, h, g);
  else drawHalftone(ctx, x, y, w, h, g);
  ctx.restore();
}
