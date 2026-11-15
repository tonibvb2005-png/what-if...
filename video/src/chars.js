// Flache 2D-Cartoonfiguren (Canvas), die in die 3D-Welt als Sprites gesetzt werden.
export const OL = '#1c1512';
export function cv(w, h, res = 1) { const c = document.createElement('canvas'); c.width = w * res; c.height = h * res; if (res !== 1) c.getContext('2d').scale(res, res); return c; }
const cv2 = (w, h) => cv(w, h, 2); // Figuren in doppelter Aufloesung

function P(g, fn, fill, lw = 10, shadeAmt = 0.13) {
  g.beginPath(); fn(g); g.fillStyle = fill; g.fill();
  if (shadeAmt) { // toon-schatten: sichel rechts unten
    g.save(); g.beginPath(); fn(g); g.clip();
    g.fillStyle = `rgba(40,10,0,${shadeAmt * 1.6})`; g.fillRect(-5000, -5000, 10000, 10000);
    g.translate(-22, -10); g.beginPath(); fn(g); g.fillStyle = fill; g.fill(); g.restore();
  }
  if (lw) { g.beginPath(); fn(g); g.lineWidth = lw; g.strokeStyle = OL; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
}
const rr = (x, y, w, h, r) => g => g.roundRect(x, y, w, h, r);
const circ = (x, y, r) => g => g.arc(x, y, r, 0, Math.PI * 2);
const ell = (x, y, rx, ry, rot = 0) => g => g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
function line(g, pts, lw = 8, col = OL) { g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.lineWidth = lw; g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); }
function curve(g, a, c, b, lw = 8, col = OL) { g.beginPath(); g.moveTo(...a); g.quadraticCurveTo(...c, ...b); g.lineWidth = lw; g.strokeStyle = col; g.lineCap = 'round'; g.stroke(); }

const SKIN = '#f4cfa5', HOOD = '#e47b2f', HOOD2 = '#c9641f', JEANS = '#34405e', HAIR = '#6a4327';

function sweat(g, x, y, s = 1) {
  P(g, g => { g.moveTo(x, y - 34 * s); g.quadraticCurveTo(x + 22 * s, y + 4 * s, x, y + 14 * s); g.quadraticCurveTo(x - 22 * s, y + 4 * s, x, y - 34 * s); }, '#86cdf2', 6, 0);
  g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(x - 5 * s, y, 4 * s, 7 * s, 0, 0, 7); g.fill();
}

function face(g, cx, cy, kind) {
  if (kind === 'neutral') {
    P(g, ell(cx - 51, cy + 40, 13, 16), OL, 0, 0); P(g, ell(cx + 51, cy + 40, 13, 16), OL, 0, 0);
    line(g, [[cx - 78, cy - 5], [cx - 28, cy - 10]]); line(g, [[cx + 28, cy - 10], [cx + 78, cy - 5]]);
    curve(g, [cx - 20, cy + 108], [cx, cy + 116], [cx + 20, cy + 108], 7);
  } else if (kind === 'scared' || kind === 'scared_sweat') {
    for (const s of [-1, 1]) { P(g, circ(cx + s * 52, cy + 40, 30), '#fff', 6, 0); P(g, circ(cx + s * 50, cy + 44, 10), OL, 0, 0); }
    line(g, [[cx - 82, cy - 12], [cx - 30, cy - 26]]); line(g, [[cx + 30, cy - 26], [cx + 82, cy - 12]]);
    P(g, ell(cx, cy + 118, 17, 24), '#5a2a1e', 6, 0);
    if (kind === 'scared_sweat') sweat(g, cx + 140, cy - 60);
  } else if (kind === 'closed') {
    curve(g, [cx - 78, cy + 40], [cx - 52, cy + 56], [cx - 26, cy + 40], 8);
    curve(g, [cx + 26, cy + 40], [cx + 52, cy + 56], [cx + 78, cy + 40], 8);
    line(g, [[cx - 80, cy - 4], [cx - 30, cy - 18]]); line(g, [[cx + 30, cy - 18], [cx + 80, cy - 4]]);
    line(g, [[cx - 22, cy + 112], [cx + 22, cy + 112]], 7);
    sweat(g, cx + 140, cy - 60);
  }
}

// ------------------------------------------------------------- Junge
export function boy(view = 'front', expr = 'neutral') {
  const c = cv2(512, 1024), g = c.getContext('2d');
  P(g, ell(218, 985, 42, 22), '#3a2a22', 8, 0); P(g, ell(294, 985, 42, 22), '#3a2a22', 8, 0);
  P(g, rr(188, 715, 58, 262, 18), JEANS); P(g, rr(266, 715, 58, 262, 18), JEANS);
  P(g, rr(140, 468, 232, 292, 64), HOOD);
  if (view === 'front') {
    P(g, rr(190, 642, 132, 62, 22), HOOD2, 6, 0);
    line(g, [[228, 492], [222, 566]], 6, '#fff'); line(g, [[284, 492], [290, 566]], 6, '#fff');
  } else P(g, ell(256, 520, 118, 62), HOOD2, 8, 0);
  P(g, rr(94, 490, 62, 228, 30), HOOD); P(g, rr(356, 490, 62, 228, 30), HOOD);
  P(g, circ(126, 728, 30), SKIN, 8, 0); P(g, circ(386, 728, 30), SKIN, 8, 0);
  if (view === 'front') P(g, ell(256, 476, 108, 32), HOOD2, 8, 0);
  P(g, circ(80, 300, 32), SKIN, 9, 0); P(g, circ(432, 300, 32), SKIN, 9, 0);
  if (view === 'front') {
    P(g, circ(256, 290, 178), SKIN, 11);
    P(g, g => { g.moveTo(72, 300); g.bezierCurveTo(52, 70, 460, 70, 440, 300); g.lineTo(424, 236); g.lineTo(392, 258); g.lineTo(360, 214); g.lineTo(322, 246); g.lineTo(290, 208); g.lineTo(250, 240); g.lineTo(214, 206); g.lineTo(180, 244); g.lineTo(146, 214); g.lineTo(114, 252); g.lineTo(90, 236); g.closePath(); }, HAIR, 11, 0.1);
    face(g, 256, 290, expr);
  } else {
    P(g, circ(256, 290, 178), HAIR, 11, 0.1);
    g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 7; for (const a of [-0.5, 0, 0.5]) { g.beginPath(); g.arc(256, 600, 330, -Math.PI / 2 + a * 0.3 - 0.12, -Math.PI / 2 + a * 0.3 + 0.12); g.stroke(); }
  }
  return c;
}

export function boySit(expr = 'scared_sweat') {
  const c = cv2(512, 1024), g = c.getContext('2d');
  P(g, ell(196, 990, 44, 22), '#3a2a22', 8, 0); P(g, ell(316, 990, 44, 22), '#3a2a22', 8, 0);
  P(g, rr(160, 560, 192, 300, 60), HOOD);
  P(g, rr(168, 790, 70, 190, 26), JEANS); P(g, rr(274, 790, 70, 190, 26), JEANS);
  P(g, rr(150, 690, 212, 150, 70), JEANS);
  P(g, rr(118, 712, 276, 74, 37), HOOD); P(g, circ(138, 748, 30), SKIN, 8, 0); P(g, circ(374, 748, 30), SKIN, 8, 0);
  P(g, circ(80, 390, 32), SKIN, 9, 0); P(g, circ(432, 390, 32), SKIN, 9, 0);
  P(g, circ(256, 380, 178), SKIN, 11);
  P(g, g => { g.moveTo(72, 390); g.bezierCurveTo(52, 160, 460, 160, 440, 390); g.lineTo(424, 326); g.lineTo(392, 348); g.lineTo(360, 304); g.lineTo(322, 336); g.lineTo(290, 298); g.lineTo(250, 330); g.lineTo(214, 296); g.lineTo(180, 334); g.lineTo(146, 304); g.lineTo(114, 342); g.lineTo(90, 326); g.closePath(); }, HAIR, 11, 0.1);
  face(g, 256, 380, expr);
  return c;
}

// ------------------------------------------------------------- Oma
export function oma(expr = 'neutral') {
  const c = cv2(512, 1024), g = c.getContext('2d'), SK = '#f1cba4';
  P(g, ell(224, 992, 36, 18), '#2d2522', 8, 0); P(g, ell(290, 992, 36, 18), '#2d2522', 8, 0);
  P(g, rr(204, 860, 36, 126, 14), '#d9b79a'); P(g, rr(272, 860, 36, 126, 14), '#d9b79a');
  P(g, g => { g.moveTo(150, 700); g.lineTo(362, 700); g.lineTo(386, 886); g.lineTo(126, 886); g.closePath(); }, '#55476a');
  P(g, rr(138, 478, 236, 262, 70), '#8e6aa6');
  for (const y of [540, 600, 660]) P(g, circ(256, y, 9), '#e8d7a8', 5, 0);
  line(g, [[256, 500], [256, 730]], 6);
  if (expr === 'shocked') {
    P(g, g => { g.moveTo(150, 520); g.lineTo(96, 430); g.lineTo(124, 410); g.lineTo(186, 500); g.closePath(); }, '#8e6aa6', 9);
    P(g, g => { g.moveTo(362, 520); g.lineTo(416, 430); g.lineTo(388, 410); g.lineTo(326, 500); g.closePath(); }, '#8e6aa6', 9);
  } else { P(g, rr(96, 498, 58, 220, 28), '#8e6aa6'); P(g, rr(358, 498, 58, 220, 28), '#8e6aa6'); P(g, circ(125, 726, 27), SK, 8, 0); P(g, circ(387, 726, 27), SK, 8, 0); }
  P(g, circ(256, 110, 62), '#d8d3cd', 10, 0);
  P(g, circ(256, 300, 162), SK, 11);
  P(g, g => { g.moveTo(96, 310); g.bezierCurveTo(80, 100, 432, 100, 416, 310); g.quadraticCurveTo(380, 200, 256, 196); g.quadraticCurveTo(132, 200, 96, 310); g.closePath(); }, '#d8d3cd', 11, 0.08);
  if (expr === 'shocked') { P(g, circ(110, 400, 30), SK, 8, 0); P(g, circ(402, 400, 30), SK, 8, 0); }
  for (const s of [-1, 1]) { g.beginPath(); g.arc(256 + s * 52, 322, 36, 0, 7); g.lineWidth = 6; g.strokeStyle = OL; g.stroke(); }
  line(g, [[240, 320], [272, 320]], 6);
  if (expr === 'shocked') { for (const s of [-1, 1]) { P(g, circ(256 + s * 52, 322, 14), '#fff', 4, 0); P(g, circ(256 + s * 52, 324, 6), OL, 0, 0); } P(g, ell(256, 410, 16, 22), '#5a2a1e', 6, 0); }
  else { for (const s of [-1, 1]) P(g, circ(256 + s * 52, 324, 9), OL, 0, 0); curve(g, [226, 398], [256, 418], [286, 398], 7); }
  g.fillStyle = 'rgba(230,120,120,.35)'; g.beginPath(); g.ellipse(176, 380, 24, 12, 0, 0, 7); g.ellipse(336, 380, 24, 12, 0, 0, 7); g.fill();
  return c;
}

export function omaSleep() {
  const c = cv2(1024, 512), g = c.getContext('2d');
  P(g, rr(40, 250, 940, 200, 40), '#e9e4d8', 10, 0.06);
  P(g, rr(330, 210, 640, 230, 60), '#3f5f8f', 10, 0.1);
  g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 6; for (let x = 380; x < 950; x += 70) { g.beginPath(); g.moveTo(x, 230); g.lineTo(x + 30, 420); g.stroke(); }
  P(g, rr(60, 190, 260, 120, 50), '#f6f2ea', 10, 0.05);
  P(g, circ(110, 150, 50), '#d8d3cd', 9, 0);
  P(g, circ(200, 200, 120), '#f1cba4', 10);
  P(g, g => { g.moveTo(84, 230); g.bezierCurveTo(70, 70, 330, 70, 318, 210); g.quadraticCurveTo(250, 120, 160, 140); g.quadraticCurveTo(110, 160, 84, 230); g.closePath(); }, '#d8d3cd', 10, 0.06);
  curve(g, [150, 220], [168, 234], [186, 220], 6); curve(g, [214, 220], [232, 234], [250, 220], 6);
  P(g, ell(200, 268, 14, 10), '#5a2a1e', 5, 0);
  return c;
}

// ------------------------------------------------------------- Opa
function opaHead(g, cx, cy, expr) {
  const SK = '#efc59c';
  P(g, circ(cx - 160, cy + 10, 30), SK, 9, 0); P(g, circ(cx + 160, cy + 10, 30), SK, 9, 0);
  P(g, circ(cx, cy, 168), SK, 11);
  P(g, ell(cx - 140, cy + 5, 44, 80, 0.2), '#cfcac4', 9, 0); P(g, ell(cx + 140, cy + 5, 44, 80, -0.2), '#cfcac4', 9, 0);
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 12; g.beginPath(); g.arc(cx - 40, cy - 70, 80, -2.4, -1.7); g.stroke();
  P(g, rr(cx - 100, cy - 38, 70, 22, 11), '#cfcac4', 6, 0); P(g, rr(cx + 30, cy - 38, 70, 22, 11), '#cfcac4', 6, 0);
  if (expr === 'glow') {
    for (const s of [-1, 1]) {
      const gr = g.createRadialGradient(cx + s * 55, cy + 22, 2, cx + s * 55, cy + 22, 60);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,240,230,.9)'); gr.addColorStop(1, 'rgba(255,60,40,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(cx + s * 55, cy + 22, 60, 0, 7); g.fill();
      P(g, circ(cx + s * 55, cy + 22, 16), '#fff', 5, 0);
    }
  } else if (expr === 'creepy') {
    for (const s of [-1, 1]) { P(g, circ(cx + s * 55, cy + 22, 22), '#fff', 6, 0); P(g, circ(cx + s * 55, cy + 22, 6), OL, 0, 0); }
  } else { for (const s of [-1, 1]) P(g, ell(cx + s * 55, cy + 24, 11, 14), OL, 0, 0); }
  if (expr === 'creepy' || expr === 'glow') {
    P(g, g => { g.moveTo(cx - 118, cy + 80); g.quadraticCurveTo(cx, cy + 190, cx + 118, cy + 80); g.quadraticCurveTo(cx, cy + 130, cx - 118, cy + 80); }, '#fbf7ee', 7, 0);
    g.strokeStyle = OL; g.lineWidth = 4; for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(cx + i * 24, cy + 98 + Math.abs(i) * -3); g.lineTo(cx + i * 24, cy + 130 - Math.abs(i) * 6); g.stroke(); }
  } else {
    P(g, g => { g.moveTo(cx - 70, cy + 92); g.quadraticCurveTo(cx - 30, cy + 60, cx, cy + 82); g.quadraticCurveTo(cx + 30, cy + 60, cx + 70, cy + 92); g.quadraticCurveTo(cx, cy + 112, cx - 70, cy + 92); }, '#d6d1cb', 7, 0);
    curve(g, [cx - 26, cy + 122], [cx, cy + 136], [cx + 26, cy + 122], 7);
  }
}

export function opa(expr = 'neutral') {
  const c = cv2(512, 1024), g = c.getContext('2d');
  P(g, ell(218, 988, 42, 20), '#2a211d', 8, 0); P(g, ell(294, 988, 42, 20), '#2a211d', 8, 0);
  P(g, rr(188, 718, 58, 262, 18), '#46423f'); P(g, rr(266, 718, 58, 262, 18), '#46423f');
  P(g, rr(140, 470, 232, 290, 60), '#e6d7b8');
  P(g, g => { g.moveTo(150, 520); g.lineTo(236, 520); g.lineTo(246, 760); g.lineTo(150, 760); g.closePath(); }, '#7a5434', 8);
  P(g, g => { g.moveTo(362, 520); g.lineTo(276, 520); g.lineTo(266, 760); g.lineTo(362, 760); g.closePath(); }, '#7a5434', 8);
  P(g, rr(96, 490, 60, 226, 28), '#e6d7b8'); P(g, rr(356, 490, 60, 226, 28), '#e6d7b8');
  P(g, circ(126, 726, 28), '#efc59c', 8, 0); P(g, circ(386, 726, 28), '#efc59c', 8, 0);
  opaHead(g, 256, 295, expr);
  return c;
}

export function opaTall(expr = 'glow') {
  const c = cv2(512, 2048), g = c.getContext('2d');
  P(g, ell(226, 2025, 34, 16), '#2a211d', 7, 0); P(g, ell(290, 2025, 34, 16), '#2a211d', 7, 0);
  P(g, rr(212, 1280, 34, 745, 16), '#46423f'); P(g, rr(266, 1280, 34, 745, 16), '#46423f');
  P(g, rr(236, 430, 40, 160, 14), '#efc59c');
  P(g, rr(180, 560, 152, 760, 50), '#e6d7b8');
  P(g, g => { g.moveTo(186, 600); g.lineTo(248, 600); g.lineTo(252, 1320); g.lineTo(186, 1320); g.closePath(); }, '#7a5434', 8);
  P(g, g => { g.moveTo(326, 600); g.lineTo(264, 600); g.lineTo(260, 1320); g.lineTo(326, 1320); g.closePath(); }, '#7a5434', 8);
  P(g, rr(138, 580, 40, 900, 20), '#e6d7b8'); P(g, rr(334, 580, 40, 900, 20), '#e6d7b8');
  for (const x of [158, 354]) { P(g, ell(x, 1510, 24, 44), '#efc59c', 7, 0); for (let k = -1; k <= 1; k++) line(g, [[x + k * 12, 1540], [x + k * 14, 1610]], 8, '#c9a07a'); }
  opaHead(g, 256, 280, expr);
  return c;
}

// ------------------------------------------------------------- Hachishakusama
export function hachi(expr = 'smile', withHat = true) {
  const c = cv2(512, 1536), g = c.getContext('2d'), PALE = '#efe7dc';
  P(g, g => { g.moveTo(130, 330); g.bezierCurveTo(70, 600, 80, 820, 120, 960); g.lineTo(392, 960); g.bezierCurveTo(432, 820, 442, 600, 382, 330); g.closePath(); }, '#0f0d10', 8, 0);
  P(g, ell(222, 1508, 26, 12), PALE, 6, 0); P(g, ell(290, 1508, 26, 12), PALE, 6, 0);
  P(g, rr(210, 1420, 22, 90, 10), PALE, 6, 0); P(g, rr(280, 1420, 22, 90, 10), PALE, 6, 0);
  P(g, g => { g.moveTo(196, 540); g.lineTo(316, 540); g.bezierCurveTo(350, 900, 380, 1200, 402, 1450); g.quadraticCurveTo(330, 1475, 256, 1450); g.quadraticCurveTo(180, 1475, 110, 1450); g.bezierCurveTo(132, 1200, 162, 900, 196, 540); g.closePath(); }, '#f3f0e6', 9, 0.14);
  g.strokeStyle = 'rgba(120,110,100,.35)'; g.lineWidth = 5; for (const x of [210, 256, 300]) { g.beginPath(); g.moveTo(x, 760); g.quadraticCurveTo(x + (x - 256) * 0.3, 1100, x + (x - 256) * 0.6, 1440); g.stroke(); }
  for (const s of [-1, 1]) {
    P(g, g => { g.moveTo(256 + s * 66, 550); g.quadraticCurveTo(256 + s * 120, 900, 256 + s * 116, 1200); g.lineTo(256 + s * 96, 1200); g.quadraticCurveTo(256 + s * 100, 900, 256 + s * 50, 590); g.closePath(); }, PALE, 7, 0);
    for (let k = 0; k < 4; k++) line(g, [[256 + s * (100 + k * 6), 1195], [256 + s * (96 + k * 9), 1290]], 6, '#d9cfc2');
  }
  P(g, rr(234, 420, 44, 130, 12), PALE, 7, 0);
  P(g, circ(256, 340, 104), PALE, 9, 0);
  const sh = g.createLinearGradient(0, 230, 0, 380); sh.addColorStop(0, 'rgba(10,6,8,1)'); sh.addColorStop(0.75, 'rgba(10,6,8,.9)'); sh.addColorStop(1, 'rgba(10,6,8,0)');
  g.save(); g.beginPath(); g.arc(256, 340, 100, 0, 7); g.clip(); g.fillStyle = sh; g.fillRect(140, 220, 240, 170); g.restore();
  if (expr === 'glow') {
    for (const s of [-1, 1]) { const gr = g.createRadialGradient(256 + s * 36, 322, 1, 256 + s * 36, 322, 34); gr.addColorStop(0, '#fff'); gr.addColorStop(0.35, 'rgba(255,230,220,.9)'); gr.addColorStop(1, 'rgba(255,40,40,0)'); g.fillStyle = gr; g.beginPath(); g.arc(256 + s * 36, 322, 34, 0, 7); g.fill(); }
  }
  P(g, g => { g.moveTo(186, 392); g.quadraticCurveTo(256, 456, 326, 392); g.quadraticCurveTo(256, 420, 186, 392); }, '#3a0d10', 5, 0);
  for (const s of [-1, 1]) P(g, g => { g.moveTo(256 + s * 96, 300); g.bezierCurveTo(256 + s * 120, 420, 256 + s * 70, 560, 256 + s * 92, 720); g.lineTo(256 + s * 60, 700); g.bezierCurveTo(256 + s * 46, 560, 256 + s * 84, 430, 256 + s * 66, 300); g.closePath(); }, '#0f0d10', 6, 0);
  if (withHat) {
    P(g, rr(160, 112, 192, 150, 46), '#fbfaf5', 10, 0.1);
    P(g, rr(160, 214, 192, 30, 6), '#1b1718', 0, 0);
    P(g, ell(256, 262, 238, 50), '#fbfaf5', 10, 0.08);
    g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 8; g.beginPath(); g.ellipse(256, 262, 200, 34, 0, 0.2, Math.PI - 0.2); g.stroke();
  }
  return c;
}

// ------------------------------------------------------------- Ofuda (Papier-Talisman)
export function ofuda(seed = 1) {
  const c = cv2(160, 440), g = c.getContext('2d');
  let s = seed * 9301; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  g.fillStyle = '#f1e7cc'; g.fillRect(0, 0, 160, 440);
  g.strokeStyle = '#b8231e'; g.lineWidth = 6; g.strokeRect(12, 12, 136, 416);
  g.fillStyle = '#1a1412';
  for (let y = 50; y < 330; y += 46) { for (let k = 0; k < 3; k++) { g.save(); g.translate(80 + (r() - .5) * 40, y + (r() - .5) * 18); g.rotate((r() - .5) * 1.4); g.fillRect(-18 - r() * 10, -4, 40 + r() * 16, 8); g.restore(); } }
  g.fillStyle = '#c42a22'; g.fillRect(52, 350, 56, 56); g.fillStyle = '#f1e7cc'; g.fillRect(62, 360, 14, 36); g.fillRect(84, 360, 14, 14);
  return c;
}

// ------------------------------------------------------------- Roulette-Monster
function sil(fn) { const c = cv2(512, 1024), g = c.getContext('2d'); fn(g); return c; }
function glowEyes(g, pts, r = 16, col = '255,40,30') {
  for (const [x, y] of pts) { const gr = g.createRadialGradient(x, y, 1, x, y, r * 2.6); gr.addColorStop(0, '#fff'); gr.addColorStop(0.3, `rgba(${col},1)`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 2.6, 0, 7); g.fill(); }
}
export const MONSTERS = {
  'SKINWALKER': () => sil(g => {
    const F = '#7c5737';
    P(g, rr(200, 640, 40, 360, 16), F); P(g, rr(272, 640, 40, 360, 16), F);
    P(g, rr(176, 330, 160, 340, 60), F);
    g.strokeStyle = 'rgba(40,20,10,.5)'; g.lineWidth = 6; for (let y = 400; y < 560; y += 30) { g.beginPath(); g.moveTo(206, y); g.quadraticCurveTo(256, y + 14, 306, y); g.stroke(); }
    P(g, rr(140, 350, 40, 420, 20), F); P(g, rr(332, 350, 40, 420, 20), F);
    P(g, g => { g.moveTo(186, 200); g.lineTo(176, 70); g.lineTo(236, 160); g.lineTo(276, 160); g.lineTo(336, 70); g.lineTo(326, 200); g.quadraticCurveTo(330, 330, 256, 350); g.quadraticCurveTo(182, 330, 186, 200); }, '#8d6a4a', 10);
    P(g, ell(256, 300, 36, 30), '#d9cdb6', 7, 0);
    glowEyes(g, [[222, 230], [290, 230]], 10, '255,170,60');
  }),
  'MOTHMAN': () => sil(g => {
    for (const s of [-1, 1]) {
      P(g, g => { g.moveTo(256, 380); g.bezierCurveTo(256 + s * 300, 200, 256 + s * 330, 560, 256 + s * 120, 640); g.closePath(); }, '#6e5444', 10, 0.05);
      P(g, circ(256 + s * 170, 430, 34), '#d9a63c', 7, 0); P(g, circ(256 + s * 170, 430, 14), OL, 0, 0);
    }
    P(g, rr(232, 640, 20, 360, 8), '#231c1d', 7, 0); P(g, rr(262, 640, 20, 360, 8), '#231c1d', 7, 0);
    P(g, ell(256, 480, 64, 200), '#2a2224', 10, 0);
    P(g, ell(256, 280, 56, 66), '#2a2224', 10, 0);
    glowEyes(g, [[234, 276], [278, 276]], 12);
  }),
  'SLENDER MAN': () => sil(g => {
    P(g, rr(214, 640, 38, 370, 12), '#16161a', 8, 0); P(g, rr(262, 640, 38, 370, 12), '#16161a', 8, 0);
    P(g, rr(190, 300, 134, 380, 30), '#16161a', 8, 0);
    P(g, g => { g.moveTo(236, 300); g.lineTo(276, 300); g.lineTo(256, 420); g.closePath(); }, '#f0f0f0', 0, 0);
    P(g, g => { g.moveTo(250, 314); g.lineTo(262, 314); g.lineTo(264, 400); g.lineTo(256, 412); g.lineTo(248, 400); g.closePath(); }, '#7a0e14', 0, 0);
    P(g, rr(156, 310, 34, 470, 16), '#16161a', 8, 0); P(g, rr(324, 310, 34, 470, 16), '#16161a', 8, 0);
    for (const x of [173, 341]) for (let k = -1; k <= 1; k++) line(g, [[x + k * 8, 780], [x + k * 14, 880]], 6, '#e8e8e8');
    P(g, rr(250, 250, 14, 60, 6), '#f0f0f0', 6, 0);
    P(g, ell(256, 190, 56, 76), '#f2f2f2', 9, 0.06);
  }),
  'SIREN HEAD': () => sil(g => {
    const F = '#8a5a3a';
    P(g, rr(222, 620, 26, 390, 10), F, 7, 0); P(g, rr(266, 620, 26, 390, 10), F, 7, 0);
    P(g, rr(206, 330, 102, 320, 34), F, 9);
    P(g, rr(168, 340, 24, 420, 12), F, 7, 0); P(g, rr(322, 340, 24, 420, 12), F, 7, 0);
    P(g, rr(248, 150, 18, 190, 6), '#6c6460', 7, 0);
    P(g, rr(140, 140, 234, 18, 6), '#6c6460', 7, 0);
    for (const s of [-1, 1]) P(g, g => { g.moveTo(256 + s * 110, 132); g.lineTo(256 + s * 200, 96); g.lineTo(256 + s * 200, 206); g.lineTo(256 + s * 110, 168); g.closePath(); }, '#9a928b', 8, 0.1);
  }),
  'WENDIGO': () => sil(g => {
    const F = '#4a3426';
    P(g, rr(214, 620, 30, 390, 12), F, 7, 0); P(g, rr(268, 620, 30, 390, 12), F, 7, 0);
    P(g, rr(196, 330, 120, 320, 40), F, 9);
    P(g, rr(160, 340, 30, 460, 14), F, 7, 0); P(g, rr(322, 340, 30, 460, 14), F, 7, 0);
    for (const s of [-1, 1]) { line(g, [[256 + s * 30, 200], [256 + s * 110, 80], [256 + s * 170, 60]], 12, '#e8dfcc'); line(g, [[256 + s * 82, 120], [256 + s * 120, 150]], 10, '#e8dfcc'); line(g, [[256 + s * 130, 70], [256 + s * 150, 20]], 10, '#e8dfcc'); }
    P(g, g => { g.moveTo(206, 190); g.quadraticCurveTo(256, 160, 306, 190); g.lineTo(286, 320); g.quadraticCurveTo(256, 340, 226, 320); g.closePath(); }, '#ece4d2', 9);
    P(g, ell(232, 236, 16, 20), OL, 0, 0); P(g, ell(280, 236, 16, 20), OL, 0, 0);
  }),
  'THE SMILER': () => sil(g => {
    for (let i = 0; i < 9; i++) line(g, [[160 + i * 24, 820], [150 + i * 26, 1000]], 10, '#0b0b0d');
    P(g, ell(256, 690, 190, 190), '#0b0b0d', 0, 0);
    glowEyes(g, [[196, 620], [316, 620]], 20, '255,255,255');
    P(g, g => { g.moveTo(130, 700); g.quadraticCurveTo(256, 860, 382, 700); g.quadraticCurveTo(256, 760, 130, 700); }, '#f4f1ea', 0, 0);
    g.strokeStyle = '#0b0b0d'; g.lineWidth = 5; for (let x = 150; x < 370; x += 22) { g.beginPath(); g.moveTo(x, 690); g.lineTo(x, 800); g.stroke(); }
  }),
  'MOMO': () => sil(g => {
    for (const x of [226, 286]) { line(g, [[x, 760], [x, 980]], 12, '#c79a2a'); line(g, [[x, 980], [x - 26, 1000]], 8, '#c79a2a'); line(g, [[x, 980], [x + 26, 1000]], 8, '#c79a2a'); }
    P(g, ell(256, 680, 90, 110), '#1a1414', 9, 0);
    P(g, g => { g.moveTo(110, 380); g.bezierCurveTo(70, 200, 440, 200, 402, 380); g.lineTo(420, 720); g.lineTo(92, 720); g.closePath(); }, '#0f0d0e', 9, 0);
    P(g, ell(256, 420, 110, 150), '#d8d0c6', 9, 0.1);
    for (const s of [-1, 1]) { P(g, circ(256 + s * 52, 380, 44), '#fff', 7, 0); g.strokeStyle = '#d33'; g.lineWidth = 3; for (let a = 0; a < 6; a++) { g.beginPath(); g.moveTo(256 + s * 52 + Math.cos(a) * 44, 380 + Math.sin(a) * 44); g.lineTo(256 + s * 52 + Math.cos(a) * 26, 380 + Math.sin(a) * 26); g.stroke(); } P(g, circ(256 + s * 50, 384, 10), OL, 0, 0); }
    P(g, g => { g.moveTo(170, 500); g.quadraticCurveTo(256, 560, 342, 500); g.quadraticCurveTo(256, 520, 170, 500); }, '#3a0d10', 6, 0);
  }),
  'HACHISHAKUSAMA': () => { const c = cv2(512, 1024), g = c.getContext('2d'); g.drawImage(hachi('glow'), 85, 0, 341, 1024); return c; },
};
