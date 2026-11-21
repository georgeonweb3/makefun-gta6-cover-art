// Code-drawn illustration for Neon Coast Cover Studio.
// Every panel that has no photo gets art drawn from code: a striped retro
// sun, a lit skyline, palm trees, a sports car over a neon grid, a
// perspective grid, or halftone dots. Nothing here is a borrowed image.
// All drawing is clipped to the panel rectangle and deterministic: the
// same seed always draws the same art.

// Tiny deterministic random so a panel's art never changes between renders.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function skyFill(ctx, x, y, w, h, grade) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, grade.sky[0]);
  g.addColorStop(0.55, grade.sky[1]);
  g.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

// Retro sun: a glowing disc with horizontal stripe gaps cut across its
// lower half, the classic synthwave sun.
export function drawSun(ctx, cx, cy, r, grade) {
  ctx.save();
  ctx.shadowColor = grade.sunRing;
  ctx.shadowBlur = r * 0.35;
  const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  g.addColorStop(0, grade.sun);
  g.addColorStop(1, grade.sunRing);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Stripe gaps: bars of the sky's middle colour across the lower half.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = grade.sky[1];
  let barY = cy + r * 0.05;
  let barH = Math.max(2, r * 0.045);
  while (barY < cy + r) {
    ctx.fillRect(cx - r, barY, r * 2, barH);
    barY += barH * 2.4;
    barH *= 1.35;
  }
  ctx.restore();
}

// Lit skyline: dark towers with a few glowing windows.
export function drawSkyline(ctx, x, y, w, h, grade, seed) {
  const rnd = mulberry32(seed);
  const base = y + h;
  ctx.fillStyle = grade.ground;
  ctx.fillRect(x, base - h * 0.12, w, h * 0.12);
  let bx = x;
  while (bx < x + w) {
    const bw = w * (0.09 + rnd() * 0.12);
    const bh = h * (0.25 + rnd() * 0.5);
    ctx.fillStyle = '#0d0618';
    ctx.fillRect(bx, base - bh, bw, bh);
    // Antenna on the tallest towers.
    if (bh > h * 0.6) {
      ctx.fillRect(bx + bw / 2 - 1, base - bh - h * 0.08, 2, h * 0.08);
      ctx.fillStyle = grade.accent;
      ctx.beginPath();
      ctx.arc(bx + bw / 2, base - bh - h * 0.08, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0d0618';
    }
    // Lit windows.
    ctx.fillStyle = grade.sun;
    const cols = Math.max(1, Math.floor(bw / 12));
    const rows = Math.max(1, Math.floor(bh / 14));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (rnd() < 0.28) {
          ctx.fillRect(bx + 4 + c * 12, base - bh + 5 + r * 14, 5, 7);
        }
      }
    }
    ctx.fillStyle = '#0d0618';
    bx += bw + 2;
  }
}

// Palm trees: curved trunks with fronds that arc downward. Fronds are
// drawn as quadratic curves from the crown, never as straight rays, so
// they read as palms instead of starbursts.
export function drawPalms(ctx, x, y, w, h, grade, seed) {
  const rnd = mulberry32(seed);
  const count = 2;
  for (let i = 0; i < count; i++) {
    const baseX = x + w * (0.25 + i * 0.5 + (rnd() - 0.5) * 0.12);
    const baseY = y + h;
    const topX = baseX + (rnd() - 0.5) * w * 0.2;
    const topY = y + h * (0.28 + rnd() * 0.12);
    ctx.strokeStyle = '#14092b';
    ctx.lineWidth = Math.max(3, w * 0.02);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.quadraticCurveTo(baseX + (topX - baseX) * 0.3, baseY - h * 0.4, topX, topY);
    ctx.stroke();
    // Seven fronds arcing down from the crown.
    ctx.strokeStyle = '#1c4d2e';
    ctx.lineWidth = Math.max(2, w * 0.012);
    for (let f = 0; f < 7; f++) {
      const ang = (-Math.PI * 0.15) - (f * Math.PI) / 7.2;
      const len = w * (0.16 + rnd() * 0.08);
      const endX = topX + Math.cos(ang) * len;
      const endY = topY + Math.abs(Math.sin(ang)) * len * 0.75 + len * 0.15;
      const midX = topX + Math.cos(ang) * len * 0.55;
      const midY = topY - len * 0.28;
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.quadraticCurveTo(midX, midY, endX, endY);
      ctx.stroke();
    }
    // Coconuts at the crown.
    ctx.fillStyle = '#3a2410';
    ctx.beginPath();
    ctx.arc(topX - 4, topY + 5, 4, 0, Math.PI * 2);
    ctx.arc(topX + 5, topY + 6, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Sports car in side profile over a neon grid floor, with an underglow.
export function drawCar(ctx, x, y, w, h, grade) {
  const gy = y + h * 0.78;
  // Neon grid floor.
  ctx.strokeStyle = grade.grid;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, gy);
  ctx.lineTo(x + w, gy);
  ctx.stroke();
  for (let i = 0; i <= 6; i++) {
    const gx = x + (w * i) / 6;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(x + w / 2 + (gx - (x + w / 2)) * 2.2, y + h);
    ctx.stroke();
  }
  for (let i = 1; i <= 3; i++) {
    const hy = gy + ((y + h - gy) * i) / 3.4;
    ctx.beginPath();
    ctx.moveTo(x, hy);
    ctx.lineTo(x + w, hy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Underglow.
  ctx.save();
  ctx.shadowColor = grade.accent;
  ctx.shadowBlur = 18;
  ctx.fillStyle = grade.accent;
  ctx.fillRect(x + w * 0.2, gy + 2, w * 0.6, 3);
  ctx.restore();
  // Body: low wedge with a cabin.
  const bx = x + w * 0.14;
  const bw = w * 0.72;
  const by = gy - h * 0.2;
  ctx.fillStyle = '#12061f';
  ctx.beginPath();
  ctx.moveTo(bx, by + h * 0.14);
  ctx.lineTo(bx + bw * 0.12, by + h * 0.02);
  ctx.lineTo(bx + bw * 0.38, by);
  ctx.lineTo(bx + bw * 0.62, by + h * 0.02);
  ctx.lineTo(bx + bw * 0.94, by + h * 0.06);
  ctx.lineTo(bx + bw, by + h * 0.14);
  ctx.lineTo(bx + bw * 0.96, by + h * 0.2);
  ctx.lineTo(bx + bw * 0.04, by + h * 0.2);
  ctx.closePath();
  ctx.fill();
  // Cabin glass.
  ctx.fillStyle = grade.grid;
  ctx.beginPath();
  ctx.moveTo(bx + bw * 0.4, by + h * 0.015);
  ctx.lineTo(bx + bw * 0.6, by + h * 0.03);
  ctx.lineTo(bx + bw * 0.58, by + h * 0.09);
  ctx.lineTo(bx + bw * 0.42, by + h * 0.09);
  ctx.closePath();
  ctx.fill();
  // Wheels.
  for (const wx of [bx + bw * 0.22, bx + bw * 0.78]) {
    ctx.fillStyle = '#05030a';
    ctx.beginPath();
    ctx.arc(wx, gy + 2, h * 0.075, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = grade.sun;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(wx, gy + 2, h * 0.04, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Headlight beam.
  ctx.strokeStyle = grade.sun;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx + bw * 0.97, by + h * 0.1);
  ctx.lineTo(bx + bw * 1.25, by + h * 0.02);
  ctx.stroke();
}

// Perspective neon grid, horizon at the upper third.
export function drawGrid(ctx, x, y, w, h, grade) {
  const hy = y + h * 0.34;
  ctx.strokeStyle = grade.grid;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(x, hy);
  ctx.lineTo(x + w, hy);
  ctx.stroke();
  for (let i = 0; i <= 8; i++) {
    const gx = x + (w * i) / 8;
    ctx.beginPath();
    ctx.moveTo(gx, hy);
    ctx.lineTo(x + w / 2 + (gx - (x + w / 2)) * 2.4, y + h);
    ctx.stroke();
  }
  let rowY = hy;
  let step = (h - (hy - y)) * 0.06;
  while (rowY < y + h) {
    ctx.beginPath();
    ctx.moveTo(x, rowY);
    ctx.lineTo(x + w, rowY);
    ctx.stroke();
    rowY += step;
    step *= 1.6;
  }
  ctx.globalAlpha = 1;
}

// Halftone dots, denser toward the bottom.
export function drawHalftone(ctx, x, y, w, h, grade) {
  ctx.fillStyle = grade.accent;
  const gap = Math.max(9, w * 0.045);
  for (let row = 0; row * gap < h; row++) {
    const r = Math.max(1, (row / (h / gap)) * gap * 0.22);
    for (let col = 0; col * gap < w; col++) {
      ctx.globalAlpha = 0.35 + 0.5 * (row / (h / gap));
      ctx.beginPath();
      ctx.arc(x + col * gap + gap / 2, y + row * gap + gap / 2, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// Draw one art panel: sky gradient, then the named art, clipped to rect.
export function drawPanelArt(ctx, rect, kind, grade, seed) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  skyFill(ctx, rect.x, rect.y, rect.w, rect.h, grade);
  if (kind === 'sun') {
    drawSun(ctx, rect.x + rect.w / 2, rect.y + rect.h * 0.42, Math.min(rect.w, rect.h) * 0.3, grade);
    drawSkyline(ctx, rect.x, rect.y, rect.w, rect.h, grade, seed + 3);
  } else if (kind === 'skyline') {
    drawSun(ctx, rect.x + rect.w * 0.72, rect.y + rect.h * 0.3, Math.min(rect.w, rect.h) * 0.2, grade);
    drawSkyline(ctx, rect.x, rect.y, rect.w, rect.h, grade, seed + 5);
  } else if (kind === 'palms') {
    drawSun(ctx, rect.x + rect.w * 0.5, rect.y + rect.h * 0.3, Math.min(rect.w, rect.h) * 0.22, grade);
    drawPalms(ctx, rect.x, rect.y, rect.w, rect.h, grade, seed + 7);
  } else if (kind === 'car') {
    drawCar(ctx, rect.x, rect.y, rect.w, rect.h, grade);
  } else if (kind === 'grid') {
    drawSun(ctx, rect.x + rect.w * 0.5, rect.y + rect.h * 0.22, Math.min(rect.w, rect.h) * 0.16, grade);
    drawGrid(ctx, rect.x, rect.y, rect.w, rect.h, grade);
  } else {
    drawHalftone(ctx, rect.x, rect.y, rect.w, rect.h, grade);
  }
  ctx.restore();
}

export const ART_KINDS = ['sun', 'skyline', 'palms', 'car', 'grid', 'halftone'];
