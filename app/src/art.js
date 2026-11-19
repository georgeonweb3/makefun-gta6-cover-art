// All illustration in this app is drawn here, in code, on canvas.
// The world is a small Vice City of our own invention: a striped retro sun,
// a dark skyline, palm silhouettes, a neon grid and a low convertible —
// and two original characters, Marisol and Dee, leaning on the car.
// Nobody here is a Rockstar character and nothing is traced from artwork.

const INK = '#22102b'; // thick comic outline colour

function rr(ctx, x, y, w, h, r) {
  const q = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + q, y);
  ctx.arcTo(x + w, y, x + w, y + h, q);
  ctx.arcTo(x + w, y + h, x, y + h, q);
  ctx.arcTo(x, y + h, x, y, q);
  ctx.arcTo(x, y, x + w, y, q);
  ctx.closePath();
}

function sky(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#2a1152');
  g.addColorStop(0.42, '#8b2d7e');
  g.addColorStop(0.68, '#ff5e7a');
  g.addColorStop(1, '#ffb347');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function sun(ctx, w, h, cx, cy, r) {
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, '#ffe259');
  g.addColorStop(0.55, '#ff9a3d');
  g.addColorStop(1, '#ff4d6d');
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  // horizontal slits across the lower half, widening toward the bottom,
  // painted with the same sky gradient so the sky shows through the sun
  const skyG = ctx.createLinearGradient(0, 0, 0, h);
  skyG.addColorStop(0, '#2a1152');
  skyG.addColorStop(0.42, '#8b2d7e');
  skyG.addColorStop(0.68, '#ff5e7a');
  skyG.addColorStop(1, '#ffb347');
  ctx.fillStyle = skyG;
  let y = cy + r * 0.08;
  let thick = r * 0.045;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, thick);
    y += thick + r * 0.16;
    thick *= 1.45;
  }
  ctx.restore();
  ctx.lineWidth = Math.max(2, r * 0.02);
  ctx.strokeStyle = 'rgba(255, 210, 120, 0.85)';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

function skyline(ctx, w, h, baseY, colour, lit) {
  ctx.fillStyle = colour;
  let x = -w * 0.02;
  let seed = 7;
  const next = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  while (x < w * 1.02) {
    const bw = w * (0.05 + next() * 0.075);
    const bh = h * (0.09 + next() * 0.16);
    const top = baseY - bh;
    ctx.fillRect(x, top, bw, bh + 2);
    if (next() > 0.55) { // rooftop antenna
      ctx.fillRect(x + bw * 0.45, top - h * 0.035, w * 0.006, h * 0.035);
    }
    if (lit) {
      ctx.fillStyle = '#ffd166';
      for (let wy = top + h * 0.02; wy < baseY - h * 0.015; wy += h * 0.035) {
        for (let wx = x + bw * 0.14; wx < x + bw * 0.86; wx += bw * 0.28) {
          if (next() > 0.62) ctx.fillRect(wx, wy, w * 0.012, h * 0.014);
        }
      }
      ctx.fillStyle = colour;
    }
    x += bw + w * 0.008;
  }
}

function palm(ctx, x, y, s, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(s, s);
  ctx.lineWidth = 11;
  ctx.strokeStyle = INK;
  ctx.lineCap = 'round';
  ctx.beginPath(); // curved trunk
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(14, -90, 34, -168);
  ctx.stroke();
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#2c1233';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(14, -90, 34, -168);
  ctx.stroke();
  // fronds fanning out of the crown
  ctx.fillStyle = INK;
  const crownX = 34, crownY = -168;
  for (let i = -4; i <= 4; i++) {
    const a = (-Math.PI / 2) + i * 0.32;
    const len = 125 - Math.abs(i) * 11;
    const tipX = crownX + Math.cos(a) * len;
    const tipY = crownY + Math.sin(a) * len * 0.55 + 26;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(
      crownX + Math.cos(a) * len * 0.55, crownY + Math.sin(a) * len * 0.5 - 12,
      tipX, tipY,
    );
    ctx.quadraticCurveTo(
      crownX + Math.cos(a) * len * 0.5, crownY + Math.sin(a) * len * 0.5 + 22,
      crownX, crownY,
    );
    ctx.fill();
  }
  ctx.restore();
}

function grid(ctx, w, h, topY) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 92, 168, 0.75)';
  ctx.lineWidth = Math.max(1.5, w * 0.002);
  // lines rushing to the horizon
  for (let i = -10; i <= 10; i++) {
    ctx.beginPath();
    ctx.moveTo(w / 2 + i * w * 0.055, topY);
    ctx.lineTo(w / 2 + i * w * 0.22, h);
    ctx.stroke();
  }
  // horizontal lines, closer together near the horizon
  let y = topY;
  let gap = h * 0.018;
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
  while (y < h) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    y += gap;
    gap *= 1.55;
  }
  ctx.restore();
}

function convertible(ctx, w, h) {
  const u = ((w + h) / 2) / 1000;
  const base = h * 0.86;
  ctx.save();
  ctx.translate(w * 0.08, 0);
  ctx.scale(w * 0.84 / 1000, 1);
  // body: one long low shape, hot pink with a dark outline
  ctx.lineWidth = 7 * u;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#ff2e88';
  ctx.beginPath();
  ctx.moveTo(20 * u, base);
  ctx.lineTo(30 * u, base - 62 * u);
  ctx.quadraticCurveTo(120 * u, base - 78 * u, 260 * u, base - 74 * u);
  ctx.quadraticCurveTo(430 * u, base - 88 * u, 560 * u, base - 70 * u);
  ctx.lineTo(880 * u, base - 58 * u);
  ctx.quadraticCurveTo(960 * u, base - 52 * u, 975 * u, base - 18 * u);
  ctx.lineTo(975 * u, base);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // windshield
  ctx.fillStyle = 'rgba(190, 240, 255, 0.9)';
  ctx.beginPath();
  ctx.moveTo(430 * u, base - 84 * u);
  ctx.lineTo(470 * u, base - 158 * u);
  ctx.lineTo(640 * u, base - 158 * u);
  ctx.lineTo(660 * u, base - 78 * u);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // chrome side stripe and door cut
  ctx.lineWidth = 4 * u;
  ctx.strokeStyle = '#ffd166';
  ctx.beginPath();
  ctx.moveTo(60 * u, base - 34 * u);
  ctx.lineTo(940 * u, base - 30 * u);
  ctx.stroke();
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.moveTo(560 * u, base - 72 * u);
  ctx.lineTo(560 * u, base - 8 * u);
  ctx.stroke();
  // headlight glow + lamp
  ctx.fillStyle = '#fff3b0';
  ctx.beginPath();
  ctx.ellipse(935 * u, base - 40 * u, 26 * u, 10 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  // wheels
  for (const wx of [215 * u, 790 * u]) {
    ctx.fillStyle = '#14081c';
    ctx.beginPath();
    ctx.arc(wx, base, 52 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 5 * u;
    ctx.stroke();
    ctx.fillStyle = '#e8e8f2';
    ctx.beginPath();
    ctx.arc(wx, base, 24 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff2e88';
    ctx.beginPath();
    ctx.arc(wx, base, 8 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// --- the duo ------------------------------------------------------------
// Marisol: bob haircut, big sunglasses, coral top, gold hoops.
// Dee: short hair, sunglasses, open teal shirt over a white tee.
// Both are our own characters, drawn from nothing but these paths.

function sunglasses(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#120a18';
  rr(ctx, -46, -12, 40, 26, 9);
  ctx.fill();
  rr(ctx, 6, -12, 40, 26, 9);
  ctx.fill();
  ctx.fillRect(-7, -4, 14, 5);
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-46, 0);
  ctx.lineTo(-58, -6);
  ctx.moveTo(46, 0);
  ctx.lineTo(58, -6);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-38, 8);
  ctx.lineTo(-24, -6);
  ctx.moveTo(14, 8);
  ctx.lineTo(28, -6);
  ctx.stroke();
  ctx.restore();
}

function marisol(ctx, w, h) {
  // Character size follows the average of the panel's sides, so the duo
  // keeps its proportions in wide panels instead of ballooning with the width
  // or shrinking to a postage stamp with the height.
  const u = ((w + h) / 2) / 1000;
  const cx = w * 0.30;
  const headY = h * 0.31;
  ctx.save();
  ctx.lineWidth = 6 * u;
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // shoulders + coral top — torso ends where the car begins, so the pair
  // reads as leaning on the convertible instead of hiding it
  ctx.fillStyle = '#ff5e7a';
  ctx.beginPath();
  ctx.moveTo(cx - 135 * u, h * 0.80);
  ctx.quadraticCurveTo(cx - 133 * u, headY + 118 * u, cx - 82 * u, headY + 96 * u);
  ctx.lineTo(cx - 52 * u, headY + 78 * u);
  ctx.lineTo(cx + 52 * u, headY + 78 * u);
  ctx.lineTo(cx + 82 * u, headY + 96 * u);
  ctx.quadraticCurveTo(cx + 133 * u, headY + 118 * u, cx + 135 * u, h * 0.80);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // neckline
  ctx.beginPath();
  ctx.moveTo(cx - 52 * u, headY + 78 * u);
  ctx.quadraticCurveTo(cx, headY + 128 * u, cx + 52 * u, headY + 78 * u);
  ctx.stroke();
  // neck + face
  ctx.fillStyle = '#d9a06b';
  ctx.fillRect(cx - 20 * u, headY + 52 * u, 40 * u, 34 * u);
  ctx.strokeRect(cx - 20 * u, headY + 52 * u, 40 * u, 34 * u);
  ctx.beginPath();
  ctx.ellipse(cx, headY, 62 * u, 74 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // bob haircut: dark cap with a straight cut at jaw level, longer at the sides
  ctx.fillStyle = '#1c1020';
  ctx.beginPath();
  ctx.moveTo(cx - 66 * u, headY + 58 * u);
  ctx.quadraticCurveTo(cx - 84 * u, headY - 30 * u, cx - 40 * u, headY - 82 * u);
  ctx.quadraticCurveTo(cx, headY - 96 * u, cx + 40 * u, headY - 82 * u);
  ctx.quadraticCurveTo(cx + 84 * u, headY - 30 * u, cx + 66 * u, headY + 58 * u);
  ctx.lineTo(cx + 46 * u, headY + 52 * u);
  ctx.quadraticCurveTo(cx + 58 * u, headY - 34 * u, cx + 30 * u, headY - 58 * u);
  ctx.quadraticCurveTo(cx, headY - 72 * u, cx - 30 * u, headY - 58 * u);
  ctx.quadraticCurveTo(cx - 58 * u, headY - 34 * u, cx - 46 * u, headY + 52 * u);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // gold hoop earrings — one path per hoop, or the stroke joins them
  // with a line straight across the face
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 5 * u;
  ctx.beginPath();
  ctx.arc(cx - 64 * u, headY + 34 * u, 12 * u, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 64 * u, headY + 34 * u, 12 * u, 0, Math.PI * 2);
  ctx.stroke();
  // sunglasses, lips, blush
  sunglasses(ctx, cx, headY - 6 * u, u * 0.92);
  ctx.fillStyle = '#e5486f';
  ctx.beginPath();
  ctx.ellipse(cx, headY + 46 * u, 16 * u, 6 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 94, 122, 0.35)';
  ctx.beginPath();
  ctx.ellipse(cx - 42 * u, headY + 26 * u, 12 * u, 7 * u, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 42 * u, headY + 26 * u, 12 * u, 7 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  // left arm resting down toward the car: dark outline first, then the
  // slightly thinner skin stroke on top so the arm reads as a shape.
  // It starts inside the torso edge so it looks attached, and ends in a hand.
  ctx.strokeStyle = INK;
  ctx.lineWidth = 32 * u;
  ctx.beginPath();
  ctx.moveTo(cx - 108 * u, headY + 130 * u);
  ctx.quadraticCurveTo(cx - 152 * u, headY + 240 * u, cx - 128 * u, h * 0.76);
  ctx.stroke();
  ctx.strokeStyle = '#d9a06b';
  ctx.lineWidth = 24 * u;
  ctx.beginPath();
  ctx.moveTo(cx - 108 * u, headY + 130 * u);
  ctx.quadraticCurveTo(cx - 152 * u, headY + 240 * u, cx - 128 * u, h * 0.76);
  ctx.stroke();
  ctx.fillStyle = '#d9a06b';
  ctx.beginPath();
  ctx.arc(cx - 128 * u, h * 0.76, 15 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5 * u;
  ctx.stroke();
  ctx.restore();
}

function dee(ctx, w, h) {
  const u = ((w + h) / 2) / 1000;
  const cx = w * 0.72;
  const headY = h * 0.30;
  ctx.save();
  ctx.lineWidth = 6 * u;
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // open teal shirt over a white tee — torso ends at the car line
  ctx.fillStyle = '#12b5a5';
  ctx.beginPath();
  ctx.moveTo(cx - 148 * u, h * 0.80);
  ctx.quadraticCurveTo(cx - 145 * u, headY + 118 * u, cx - 90 * u, headY + 94 * u);
  ctx.lineTo(cx - 58 * u, headY + 76 * u);
  ctx.lineTo(cx + 58 * u, headY + 76 * u);
  ctx.lineTo(cx + 90 * u, headY + 94 * u);
  ctx.quadraticCurveTo(cx + 145 * u, headY + 118 * u, cx + 148 * u, h * 0.80);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f6f2ea';
  ctx.beginPath();
  ctx.moveTo(cx - 46 * u, headY + 80 * u);
  ctx.lineTo(cx + 46 * u, headY + 80 * u);
  ctx.lineTo(cx + 30 * u, h * 0.80);
  ctx.lineTo(cx - 30 * u, h * 0.80);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // shirt collar, kept low and flat so it reads as a collar, not spikes
  ctx.fillStyle = '#ff5e7a';
  ctx.beginPath();
  ctx.moveTo(cx - 58 * u, headY + 76 * u);
  ctx.lineTo(cx - 30 * u, headY + 100 * u);
  ctx.lineTo(cx - 52 * u, headY + 106 * u);
  ctx.closePath();
  ctx.moveTo(cx + 58 * u, headY + 76 * u);
  ctx.lineTo(cx + 30 * u, headY + 100 * u);
  ctx.lineTo(cx + 52 * u, headY + 106 * u);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  for (const [dx, dy] of [[-110, 190], [118, 220], [-88, 280], [96, 300]]) {
    ctx.beginPath();
    ctx.arc(cx + dx * u, headY + dy * u, 7 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  // neck + face
  ctx.fillStyle = '#b97a4e';
  ctx.fillRect(cx - 20 * u, headY + 50 * u, 40 * u, 34 * u);
  ctx.strokeRect(cx - 20 * u, headY + 50 * u, 40 * u, 34 * u);
  ctx.beginPath();
  ctx.ellipse(cx, headY, 60 * u, 72 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // short dark hair, slightly spiked at the front
  ctx.fillStyle = '#14100e';
  ctx.beginPath();
  ctx.moveTo(cx - 62 * u, headY - 6 * u);
  ctx.quadraticCurveTo(cx - 66 * u, headY - 84 * u, cx, headY - 88 * u);
  ctx.quadraticCurveTo(cx + 66 * u, headY - 84 * u, cx + 62 * u, headY - 6 * u);
  ctx.lineTo(cx + 44 * u, headY - 34 * u);
  ctx.quadraticCurveTo(cx + 20 * u, headY - 62 * u, cx, headY - 58 * u);
  ctx.quadraticCurveTo(cx - 20 * u, headY - 62 * u, cx - 44 * u, headY - 34 * u);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // sunglasses + smile
  sunglasses(ctx, cx, headY - 4 * u, u * 0.95);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4 * u;
  ctx.beginPath();
  ctx.arc(cx, headY + 32 * u, 18 * u, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // right arm folded onto the car roof line: outline first, skin on top,
  // starting inside the torso edge and ending in a hand on the car
  ctx.strokeStyle = INK;
  ctx.lineWidth = 33 * u;
  ctx.beginPath();
  ctx.moveTo(cx + 112 * u, headY + 140 * u);
  ctx.quadraticCurveTo(cx + 156 * u, headY + 240 * u, cx + 136 * u, h * 0.76);
  ctx.stroke();
  ctx.strokeStyle = '#b97a4e';
  ctx.lineWidth = 25 * u;
  ctx.beginPath();
  ctx.moveTo(cx + 112 * u, headY + 140 * u);
  ctx.quadraticCurveTo(cx + 156 * u, headY + 240 * u, cx + 136 * u, h * 0.76);
  ctx.stroke();
  ctx.fillStyle = '#b97a4e';
  ctx.beginPath();
  ctx.arc(cx + 136 * u, h * 0.76, 15 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5 * u;
  ctx.stroke();
  ctx.restore();
}

function halftone(ctx, w, h) {
  ctx.save();
  ctx.fillStyle = 'rgba(34, 16, 43, 0.35)';
  const step = Math.max(14, w * 0.016);
  for (let y = h * 0.06; y < h * 0.30; y += step) {
    for (let x = w * 0.03; x < w * 0.97; x += step) {
      const d = Math.hypot(x - w / 2, y - h * 0.18) / (w * 0.5);
      const r = Math.max(0.6, (1 - d) * step * 0.22);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** The four illustrated scenes. `scene` is one of duo | car | skyline | sun. */
export function drawScene(ctx, w, h, scene) {
  ctx.save();
  sky(ctx, w, h);
  if (scene === 'sun') {
    sun(ctx, w, h, w * 0.5, h * 0.42, w * 0.34);
    skyline(ctx, w, h, h * 0.78, '#1c0b2a', false);
    grid(ctx, w, h, h * 0.78);
    palm(ctx, w * 0.06, h * 0.98, Math.min(w, h) / 1000 * 1.6, 0.16);
    palm(ctx, w * 0.96, h * 0.98, Math.min(w, h) / 1000 * 1.45, -0.2);
    halftone(ctx, w, h);
  } else if (scene === 'skyline') {
    sun(ctx, w, h, w * 0.68, h * 0.34, w * 0.24);
    skyline(ctx, w, h, h * 0.72, '#241031', true);
    skyline(ctx, w, h, h * 0.82, '#160a20', false);
    palm(ctx, w * 0.1, h * 0.99, Math.min(w, h) / 1000 * 1.55, 0.14);
    palm(ctx, w * 0.9, h * 0.99, Math.min(w, h) / 1000 * 1.7, -0.12);
    grid(ctx, w, h, h * 0.82);
  } else if (scene === 'car') {
    sun(ctx, w, h, w * 0.5, h * 0.30, w * 0.26);
    skyline(ctx, w, h, h * 0.66, '#1c0b2a', true);
    grid(ctx, w, h, h * 0.66);
    palm(ctx, w * 0.05, h * 0.97, Math.min(w, h) / 1000 * 1.5, 0.18);
    convertible(ctx, w, h);
  } else { // duo — the full poster scene
    sun(ctx, w, h, w * 0.5, h * 0.33, Math.min(w * 0.30, h * 0.52));
    skyline(ctx, w, h, h * 0.70, '#241031', true);
    palm(ctx, w * 0.03, h * 0.99, Math.min(w, h) / 1000 * 1.65, 0.15);
    palm(ctx, w * 0.99, h * 0.99, Math.min(w, h) / 1000 * 1.55, -0.18);
    grid(ctx, w, h, h * 0.70);
    convertible(ctx, w, h);
    marisol(ctx, w, h);
    dee(ctx, w, h);
    halftone(ctx, w, h);
  }
  ctx.restore();
}
