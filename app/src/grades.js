// The five colour grades. A grade is a canvas filter applied to the finished
// panels plus one or two translucent colour washes, then a vignette that
// darkens the corners so the caption sits on a clean patch of picture.

export const GRADES = [
  { id: 'sunset', name: 'Vice Sunset' },
  { id: 'neon', name: 'Neon Night' },
  { id: 'teal', name: 'Teal / Orange' },
  { id: 'noir', name: 'Noir' },
  { id: 'faded', name: 'Faded Film' },
];

export function gradeFilter(id) {
  switch (id) {
    case 'neon': return 'saturate(1.4) contrast(1.08) brightness(0.96)';
    case 'teal': return 'saturate(1.25) contrast(1.1)';
    case 'noir': return 'grayscale(1) contrast(1.18) brightness(1.04)';
    case 'faded': return 'saturate(0.72) contrast(0.92) brightness(1.07)';
    default: return 'saturate(1.12) contrast(1.03)'; // sunset
  }
}

function wash(ctx, w, h, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, colour] of stops) g.addColorStop(at, colour);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Paints the grade's colour washes and vignette over a finished cover. */
export function gradeWash(ctx, w, h, id) {
  ctx.save();
  if (id === 'neon') {
    wash(ctx, w, h, [[0, 'rgba(80, 20, 180, 0.28)'], [0.6, 'rgba(20, 10, 60, 0.10)'], [1, 'rgba(255, 40, 140, 0.22)']]);
  } else if (id === 'teal') {
    wash(ctx, w, h, [[0, 'rgba(0, 140, 150, 0.20)'], [0.55, 'rgba(0, 0, 0, 0)'], [1, 'rgba(255, 130, 40, 0.20)']]);
  } else if (id === 'noir') {
    wash(ctx, w, h, [[0, 'rgba(255, 255, 255, 0.05)'], [1, 'rgba(0, 0, 0, 0.14)']]);
  } else if (id === 'faded') {
    wash(ctx, w, h, [[0, 'rgba(255, 220, 170, 0.16)'], [1, 'rgba(255, 200, 140, 0.10)']]);
  } else { // sunset
    wash(ctx, w, h, [[0, 'rgba(255, 120, 60, 0.10)'], [0.7, 'rgba(255, 60, 120, 0.06)'], [1, 'rgba(160, 20, 90, 0.16)']]);
  }
  // vignette: soft dark corners, clear middle
  const v = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.78,
  );
  v.addColorStop(0, 'rgba(0, 0, 0, 0)');
  v.addColorStop(1, 'rgba(10, 2, 16, 0.42)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
