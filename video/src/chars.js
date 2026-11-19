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

const SKIN = '#f4cfa5', JEANS = '#34405e';
let HOOD = '#e47b2f', HOOD2 = '#c9641f', HAIR = '#6a4327';

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
    P(g, g => { g.moveTo(72, 300); g.bezierCurveTo(46, 36, 466, 36, 440, 300); g.lineTo(424, 236); g.lineTo(392, 258); g.lineTo(360, 214); g.lineTo(322, 246); g.lineTo(290, 208); g.lineTo(250, 240); g.lineTo(214, 206); g.lineTo(180, 244); g.lineTo(146, 214); g.lineTo(114, 252); g.lineTo(90, 236); g.closePath(); }, HAIR, 11, 0.1);
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 8; g.beginPath(); g.arc(256, 260, 150, -2.5, -1.9); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 5; for (const x of [200, 256, 312]) { g.beginPath(); g.moveTo(x, 112); g.quadraticCurveTo(x + (x - 256) * 0.3, 160, x + (x - 256) * 0.2, 205); g.stroke(); }
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
  P(g, g => { g.moveTo(72, 390); g.bezierCurveTo(46, 126, 466, 126, 440, 390); g.lineTo(424, 326); g.lineTo(392, 348); g.lineTo(360, 304); g.lineTo(322, 336); g.lineTo(290, 298); g.lineTo(250, 330); g.lineTo(214, 296); g.lineTo(180, 334); g.lineTo(146, 304); g.lineTo(114, 342); g.lineTo(90, 326); g.closePath(); }, HAIR, 11, 0.1);
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

// ------------------------------------------------------------- Folge 2: Ben, Junge im Bett, Mothman
export function ben(view = 'front', expr = 'neutral') {
  const o = [HOOD, HOOD2, HAIR]; HOOD = '#3f7d4e'; HOOD2 = '#2f6340'; HAIR = '#d9ad52';
  const c = boy(view, expr); [HOOD, HOOD2, HAIR] = o; return c;
}
export function boyBed() {
  const c = cv2(1024, 512), g = c.getContext('2d');
  P(g, rr(30, 300, 964, 190, 30), '#6b4a30', 10, 0.1);
  P(g, rr(40, 250, 940, 120, 30), '#ecebe6', 10, 0.05);
  P(g, rr(60, 200, 250, 110, 50), '#f6f4ef', 10, 0.05);
  P(g, circ(205, 205, 112), SKIN, 10);
  P(g, g => { g.moveTo(92, 215); g.bezierCurveTo(70, 30, 340, 30, 320, 205); g.lineTo(300, 160); g.lineTo(270, 175); g.lineTo(240, 140); g.lineTo(205, 168); g.lineTo(170, 138); g.lineTo(140, 170); g.lineTo(110, 150); g.closePath(); }, HAIR, 9, 0.1);
  for (const s of [-1, 1]) { P(g, circ(205 + s * 36, 218, 20), '#fff', 5, 0); P(g, circ(205 + s * 34, 222, 7), OL, 0, 0); }
  line(g, [[150, 180], [186, 170]], 6); line(g, [[224, 170], [260, 180]], 6);
  P(g, ell(205, 280, 10, 13), '#5a2a1e', 4, 0);
  P(g, rr(250, 240, 740, 170, 40), '#3b4f86', 10, 0.12);
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 8; for (let x = 300; x < 980; x += 80) { g.beginPath(); g.moveTo(x, 250); g.lineTo(x, 400); g.stroke(); }
  P(g, ell(255, 300, 46, 34), SKIN, 8, 0);
  return c;
}
function mothEyes(g, pts, r) {
  for (const [x, y] of pts) {
    const gr = g.createRadialGradient(x, y, 1, x, y, r * 3.2); gr.addColorStop(0, 'rgba(255,240,230,1)'); gr.addColorStop(0.18, 'rgba(255,60,40,1)'); gr.addColorStop(0.5, 'rgba(220,0,0,.45)'); gr.addColorStop(1, 'rgba(200,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 3.2, 0, 7); g.fill();
    g.fillStyle = '#ff2a1a'; g.beginPath(); g.ellipse(x, y, r, r * 0.8, 0, 0, 7); g.fill();
    g.fillStyle = '#fff3ea'; g.beginPath(); g.ellipse(x - r * 0.25, y - r * 0.2, r * 0.35, r * 0.28, 0, 0, 7); g.fill();
  }
}
function mothWing(g, s) { // s = -1 links, 1 rechts; Ursprung Schulter (512, 360)
  const X = x => 512 + s * x;
  P(g, g => { g.moveTo(X(40), 340); g.bezierCurveTo(X(200), 120, X(420), 60, X(470), 150); g.bezierCurveTo(X(500), 260, X(430), 430, X(250), 500); g.quadraticCurveTo(X(120), 520, X(40), 470); g.closePath(); }, '#43352f', 10, 0.1);
  P(g, g => { g.moveTo(X(40), 460); g.bezierCurveTo(X(160), 470, X(330), 520, X(330), 640); g.bezierCurveTo(X(320), 760, X(170), 760, X(60), 620); g.closePath(); }, '#3a2d29', 10, 0.1);
  g.save(); g.beginPath(); g.moveTo(X(40), 340); g.bezierCurveTo(X(200), 120, X(420), 60, X(470), 150); g.bezierCurveTo(X(500), 260, X(430), 430, X(250), 500); g.quadraticCurveTo(X(120), 520, X(40), 470); g.closePath(); g.clip();
  g.strokeStyle = '#6a574c'; g.lineWidth = 34; g.beginPath(); g.moveTo(X(200), 130); g.bezierCurveTo(X(420), 70, X(500), 250, X(250), 500); g.stroke();
  g.strokeStyle = 'rgba(20,12,10,.55)'; g.lineWidth = 6; for (const [a, b] of [[160, 170], [280, 120], [380, 140], [440, 260], [380, 380]]) { g.beginPath(); g.moveTo(X(60), 380); g.quadraticCurveTo(X(a * 0.6), (b + 380) / 2 - 20, X(a), b); g.stroke(); }
  g.restore();
  P(g, circ(X(300), 280, 52), '#b8842e', 8, 0); P(g, circ(X(300), 280, 30), '#2a1c18', 0, 0); P(g, circ(X(290), 270, 9), '#e9d3a0', 0, 0);
  P(g, circ(X(200), 620, 30), '#8a6332', 6, 0); P(g, circ(X(200), 620, 14), '#1d1412', 0, 0);
}
export function mothman(pose = 'open') {
  const c = cv2(1024, 1024), g = c.getContext('2d'), B = '#1d1718';
  if (pose === 'open') { mothWing(g, -1); mothWing(g, 1); }
  P(g, rr(468, 690, 30, 320, 12), B, 8, 0); P(g, rr(526, 690, 30, 320, 12), B, 8, 0);
  P(g, ell(458, 1010, 40, 12), B, 6, 0); P(g, ell(566, 1010, 40, 12), B, 6, 0);
  if (pose === 'folded') {
    P(g, g => { g.moveTo(512, 210); g.bezierCurveTo(330, 230, 300, 520, 360, 860); g.lineTo(664, 860); g.bezierCurveTo(724, 520, 694, 230, 512, 210); g.closePath(); }, '#3a2d29', 10, 0.12);
    g.strokeStyle = 'rgba(15,8,8,.5)'; g.lineWidth = 7; for (const x of [420, 470, 554, 604]) { g.beginPath(); g.moveTo(512, 300); g.quadraticCurveTo(x, 560, x + (x - 512) * 0.3, 850); g.stroke(); }
  }
  P(g, g => { g.moveTo(512, 250); g.bezierCurveTo(420, 260, 410, 420, 430, 560); g.quadraticCurveTo(440, 720, 512, 730); g.quadraticCurveTo(584, 720, 594, 560); g.bezierCurveTo(614, 420, 604, 260, 512, 250); g.closePath(); }, B, 10, 0.08);
  g.strokeStyle = 'rgba(90,70,60,.5)'; g.lineWidth = 5; for (let y = 470; y < 700; y += 34) { g.beginPath(); g.moveTo(450, y); g.quadraticCurveTo(512, y + 14, 574, y); g.stroke(); }
  for (const s of [-1, 1]) { line(g, [[512 + s * 70, 320], [512 + s * 110, 520], [512 + s * 96, 700]], 18, B); for (let k = -1; k <= 1; k++) line(g, [[512 + s * 96, 700], [512 + s * (96 + k * 14), 760]], 7, '#2a2020'); }
  g.fillStyle = 'rgba(70,55,50,.9)'; for (let i = 0; i < 26; i++) { const a = Math.PI * (0.15 + 0.7 * i / 25); g.beginPath(); g.moveTo(512 + Math.cos(a) * 92, 300 - Math.sin(a) * 40); g.lineTo(512 + Math.cos(a) * 112, 290 - Math.sin(a) * 58); g.lineTo(512 + Math.cos(a + 0.05) * 92, 300 - Math.sin(a + 0.05) * 40); g.fill(); }
  mothEyes(g, [[474, 330], [550, 330]], 22);
  return c;
}

// ------------------------------------------------------------- Folge 3: Mia (Schwester, lange Haare, Camcorder)
export function mia(view = 'front', expr = 'neutral', cam = false, pal = null) {
  const o = [HOOD, HOOD2, HAIR]; [HOOD, HOOD2, HAIR] = pal || ['#8a4fb0', '#6c3a8c', '#7a3b22'];
  const base = boy(view, expr); const c = cv2(512, 1024), g = c.getContext('2d');
  const longHair = g => { g.moveTo(84, 250); g.bezierCurveTo(40, 420, 70, 560, 110, 600); g.lineTo(402, 600); g.bezierCurveTo(442, 560, 472, 420, 428, 250); g.closePath(); };
  P(g, longHair, HAIR, 11, 0.1);
  g.drawImage(base, 0, 0, 512, 1024);
  if (view === 'back') { P(g, g => { g.moveTo(80, 300); g.bezierCurveTo(70, 80, 442, 80, 432, 300); g.bezierCurveTo(440, 470, 420, 590, 400, 610); g.lineTo(112, 610); g.bezierCurveTo(92, 590, 72, 470, 80, 300); g.closePath(); }, HAIR, 11, 0.1);
    g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 6; for (const x of [180, 256, 330]) { g.beginPath(); g.moveTo(x, 200); g.quadraticCurveTo(x + 10, 420, x - 6, 600); g.stroke(); } }
  else {
    // voller Haaransatz oben (kein Hautstreifen mehr ueber dem Pony)
    P(g, g => { g.moveTo(76, 300); g.bezierCurveTo(46, 40, 466, 40, 436, 300); g.lineTo(424, 236); g.lineTo(392, 258); g.lineTo(360, 214); g.lineTo(322, 246); g.lineTo(290, 208); g.lineTo(250, 240); g.lineTo(214, 206); g.lineTo(180, 244); g.lineTo(146, 214); g.lineTo(114, 252); g.lineTo(90, 236); g.closePath(); }, HAIR, 11, 0.1);
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 8; g.beginPath(); g.arc(256, 260, 150, -2.5, -1.9); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 5; for (const x of [200, 256, 312]) { g.beginPath(); g.moveTo(x, 110); g.quadraticCurveTo(x + (x - 256) * 0.3, 160, x + (x - 256) * 0.2, 210); g.stroke(); }
    for (const s of [-1, 1]) P(g, g => { g.moveTo(256 + s * 170, 280); g.bezierCurveTo(256 + s * 200, 420, 256 + s * 170, 560, 256 + s * 150, 620); g.lineTo(256 + s * 118, 600); g.bezierCurveTo(256 + s * 140, 500, 256 + s * 150, 400, 256 + s * 140, 300); g.closePath(); }, HAIR, 9, 0.1);
    P(g, circ(372, 228, 14), '#f2c84b', 5, 0); }
  if (cam && view === 'front') {
    P(g, rr(170, 640, 150, 90, 14), '#222428', 8, 0); P(g, circ(200, 685, 30), '#0e0f12', 6, 0); P(g, circ(200, 685, 14), '#3a5a8a', 0, 0);
    P(g, rr(300, 630, 90, 70, 8), '#1a1c20', 6, 0); g.fillStyle = '#9fd4ff'; g.fillRect(310, 640, 70, 50); P(g, circ(305, 650, 6), '#ff2a20', 0, 0);
    P(g, circ(160, 700, 30), SKIN, 8, 0); P(g, circ(350, 710, 30), SKIN, 8, 0);
  }
  [HOOD, HOOD2, HAIR] = o; return c;
}

export const colleague = (view = 'front', expr = 'neutral') => mia(view, expr, false, ['#c0392b', '#962d22', '#2b1d16']);

// ------------------------------------------------------------- Folge 5: Papa, Skinwalker
const PSK = '#efc49a', PHAIR = '#3b2a1f', SHIRT = '#2f5d8a', SHIRT2 = '#244a70';
function papaHead(g, cx, cy, expr) {
  P(g, circ(cx - 168, cy + 10, 32), PSK, 9, 0); P(g, circ(cx + 168, cy + 10, 32), PSK, 9, 0);
  P(g, circ(cx, cy, 172), PSK, 11);
  // Bartschatten
  g.save(); g.beginPath(); g.arc(cx, cy, 166, 0, 7); g.clip(); g.fillStyle = 'rgba(70,45,30,.28)'; g.beginPath(); g.ellipse(cx, cy + 150, 150, 90, 0, 0, 7); g.fill(); g.restore();
  // kurze Haare, voller Ansatz
  P(g, g => { g.moveTo(cx - 176, cy + 10); g.bezierCurveTo(cx - 200, cy - 230, cx + 200, cy - 230, cx + 176, cy + 10); g.lineTo(cx + 150, cy - 60); g.quadraticCurveTo(cx + 40, cy - 110, cx - 30, cy - 80); g.quadraticCurveTo(cx - 110, cy - 100, cx - 150, cy - 60); g.closePath(); }, PHAIR, 11, 0.1);
  line(g, [[cx - 92, cy - 18], [cx - 34, cy - 24]], 12, PHAIR); line(g, [[cx + 34, cy - 24], [cx + 92, cy - 18]], 12, PHAIR);
  if (expr === 'eyeshine') {
    for (const s of [-1, 1]) { const x = cx + s * 60, y = cy + 30, gr = g.createRadialGradient(x, y, 1, x, y, 46); gr.addColorStop(0, '#fff'); gr.addColorStop(0.35, 'rgba(255,230,140,1)'); gr.addColorStop(1, 'rgba(255,190,60,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 46, 0, 7); g.fill(); }
  } else if (expr === 'scared') {
    for (const s of [-1, 1]) { P(g, circ(cx + s * 60, cy + 30, 26), '#fff', 6, 0); P(g, circ(cx + s * 58, cy + 32, 9), OL, 0, 0); }
  } else for (const s of [-1, 1]) P(g, ell(cx + s * 60, cy + 30, 12, 15), OL, 0, 0);
  if (expr === 'wide' || expr === 'eyeshine') {
    const mouth = g => { g.moveTo(cx - 118, cy + 78); g.bezierCurveTo(cx - 60, cy + 100, cx + 60, cy + 100, cx + 118, cy + 78); g.bezierCurveTo(cx + 92, cy + 168, cx - 92, cy + 168, cx - 118, cy + 78); g.closePath(); };
    g.save(); g.beginPath(); mouth(g); g.fillStyle = '#5a1f1a'; g.fill(); g.clip();
    g.fillStyle = '#fbf7ee'; g.beginPath(); g.moveTo(cx - 130, cy + 70); g.bezierCurveTo(cx - 60, cy + 92, cx + 60, cy + 92, cx + 130, cy + 70); g.lineTo(cx + 130, cy + 122); g.bezierCurveTo(cx + 60, cy + 136, cx - 60, cy + 136, cx - 130, cy + 122); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(28,21,18,.45)'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 130, cy + 110); g.bezierCurveTo(cx - 60, cy + 122, cx + 60, cy + 122, cx + 130, cy + 110); g.stroke();
    for (let i = -4; i <= 4; i++) { if (!i) continue; g.beginPath(); g.moveTo(cx + i * 24, cy + 80); g.lineTo(cx + i * 24, cy + 140); g.stroke(); }
    g.restore();
    g.beginPath(); mouth(g); g.lineWidth = 7; g.strokeStyle = OL; g.lineJoin = 'round'; g.stroke();
    for (const k of [-1, 1]) curve(g, [cx + k * 112, cy + 70], [cx + k * 128, cy + 80], [cx + k * 124, cy + 96], 5);
    if (expr === 'wide') for (const k of [-1, 1]) curve(g, [cx + k * 84, cy + 50], [cx + k * 60, cy + 58], [cx + k * 36, cy + 50], 5); // gespannte Wangen
  } else if (expr === 'scared') { line(g, [[cx - 30, cy + 112], [cx + 30, cy + 112]], 8); }
  else curve(g, [cx - 30, cy + 108], [cx, cy + 118], [cx + 30, cy + 108], 8);
}
export function papa(view = 'front', expr = 'neutral') {
  const c = cv2(512, 1024), g = c.getContext('2d');
  P(g, ell(214, 988, 44, 20), '#2a211d', 8, 0); P(g, ell(298, 988, 44, 20), '#2a211d', 8, 0);
  P(g, rr(184, 716, 62, 266, 18), '#3b3f4a'); P(g, rr(266, 716, 62, 266, 18), '#3b3f4a');
  P(g, rr(128, 462, 256, 300, 60), SHIRT);
  g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 10; for (let x = 150; x < 380; x += 40) { g.beginPath(); g.moveTo(x, 470); g.lineTo(x, 755); g.stroke(); }
  g.strokeStyle = 'rgba(0,0,0,.18)'; for (let y = 490; y < 755; y += 40) { g.beginPath(); g.moveTo(132, y); g.lineTo(380, y); g.stroke(); }
  if (view === 'front') { P(g, g => { g.moveTo(206, 466); g.lineTo(256, 540); g.lineTo(306, 466); g.closePath(); }, PSK, 6, 0); line(g, [[256, 540], [256, 750]], 5); }
  P(g, rr(82, 482, 64, 236, 30), SHIRT2); P(g, rr(366, 482, 64, 236, 30), SHIRT2);
  P(g, circ(114, 728, 31), PSK, 8, 0); P(g, circ(398, 728, 31), PSK, 8, 0);
  if (view === 'front') papaHead(g, 256, 290, expr);
  else { P(g, circ(88, 300, 32), PSK, 9, 0); P(g, circ(424, 300, 32), PSK, 9, 0); P(g, circ(256, 290, 172), PHAIR, 11, 0.1); }
  return c;
}
// Junge, dem Papa von der Seite den Mund zuhaelt
export function boyHushed() {
  const c = cv2(512, 1024), g = c.getContext('2d');
  g.drawImage(boy('front', 'scared_sweat'), 0, 0, 512, 1024);
  P(g, rr(330, 520, 200, 70, 34), SHIRT2, 9);                               // Arm von rechts
  P(g, g => g.roundRect(196, 372, 170, 96, 44), PSK, 9);                      // Hand ueber dem Mund
  for (let i = 0; i < 3; i++) line(g, [[220 + i * 34, 392], [220 + i * 34, 450]], 5, 'rgba(28,21,18,.5)');
  return c;
}
const SKF = '#6f6257', SKF2 = '#4c4038', BONE = '#e3d8c2';
function skinHead(g, cx, cy, s = 1, eyes = true) {
  // Kojoten-Fell mit Ohren, knochige Schnauze
  P(g, g => { g.moveTo(cx - 70 * s, cy + 40 * s); g.lineTo(cx - 92 * s, cy - 110 * s); g.lineTo(cx - 30 * s, cy - 50 * s); g.lineTo(cx + 30 * s, cy - 50 * s); g.lineTo(cx + 92 * s, cy - 110 * s); g.lineTo(cx + 70 * s, cy + 40 * s); g.quadraticCurveTo(cx, cy + 90 * s, cx - 70 * s, cy + 40 * s); }, SKF2, 9 * s, 0.1);
  P(g, g => { g.moveTo(cx - 46 * s, cy - 10 * s); g.quadraticCurveTo(cx, cy - 30 * s, cx + 46 * s, cy - 10 * s); g.lineTo(cx + 22 * s, cy + 110 * s); g.quadraticCurveTo(cx, cy + 124 * s, cx - 22 * s, cy + 110 * s); g.closePath(); }, BONE, 8 * s, 0.12);
  P(g, ell(cx, cy + 104 * s, 12 * s, 9 * s), OL, 0, 0);
  if (eyes) glowEyes(g, [[cx - 26 * s, cy + 22 * s], [cx + 26 * s, cy + 22 * s]], 9 * s, '255,225,140');
  else for (const k of [-1, 1]) P(g, ell(cx + k * 26 * s, cy + 22 * s, 12 * s, 9 * s), '#120c0a', 0, 0);
}
export function skinStand(run = false) {
  const c = cv2(512, 1024), g = c.getContext('2d');
  // Beine (lang, Kniegelenke nach hinten)
  if (run) { line(g, [[236, 600], [170, 780], [200, 1000]], 30, SKF); line(g, [[276, 600], [350, 760], [400, 960]], 30, SKF); }
  else { line(g, [[230, 600], [214, 800], [222, 1000]], 30, SKF); line(g, [[282, 600], [298, 800], [290, 1000]], 30, SKF); }
  // Rumpf, abgemagert
  P(g, g => { g.moveTo(196, 300); g.quadraticCurveTo(256, 280, 316, 300); g.lineTo(300, 620); g.quadraticCurveTo(256, 640, 212, 620); g.closePath(); }, SKF, 10, 0.12);
  g.strokeStyle = 'rgba(30,20,14,.55)'; g.lineWidth = 6; for (let y = 360; y < 520; y += 28) { g.beginPath(); g.moveTo(214, y); g.quadraticCurveTo(256, y + 16, 298, y); g.stroke(); }
  // Fell ueber den Schultern
  P(g, g => { g.moveTo(170, 300); g.quadraticCurveTo(256, 230, 342, 300); g.lineTo(330, 420); g.lineTo(306, 380); g.lineTo(286, 430); g.lineTo(256, 386); g.lineTo(226, 430); g.lineTo(206, 380); g.lineTo(182, 420); g.closePath(); }, SKF2, 9, 0.1);
  // Arme, viel zu lang, Krallen
  const arm = (pts) => { line(g, pts, 24, SKF); const [x, y] = pts[pts.length - 1]; for (const d of [-14, 0, 14]) line(g, [[x, y], [x + d, y + 46]], 6, BONE); };
  if (run) { arm([[186, 320], [110, 520], [160, 700]]); arm([[326, 320], [420, 480], [460, 640]]); }
  else { arm([[186, 320], [150, 560], [140, 840]]); arm([[326, 320], [362, 560], [372, 840]]); }
  skinHead(g, 256, 190);
  return c;
}
function skinHeadSide(g, x, y, s = 1) { // Kojotenschaedel im Profil, Schnauze nach rechts, Ursprung = Genick
  g.save(); g.translate(x, y); g.scale(s, s);
  P(g, g => { g.moveTo(-40, 40); g.quadraticCurveTo(-60, -10, -30, -40); g.lineTo(-62, -120); g.lineTo(0, -62); g.lineTo(20, -110); g.lineTo(46, -56); g.quadraticCurveTo(90, -48, 120, -26); g.lineTo(60, 10); g.quadraticCurveTo(20, 52, -40, 40); }, SKF2, 9, 0.1);
  P(g, g => { g.moveTo(20, -34); g.quadraticCurveTo(70, -40, 120, -26); g.quadraticCurveTo(160, -16, 182, 0); g.quadraticCurveTo(186, 10, 176, 14); g.lineTo(80, 22); g.quadraticCurveTo(30, 26, 20, -34); }, BONE, 8, 0.12);
  P(g, g => { g.moveTo(80, 24); g.lineTo(166, 18); g.quadraticCurveTo(150, 40, 96, 44); g.quadraticCurveTo(70, 42, 80, 24); }, '#cbbfa6', 7, 0);
  g.strokeStyle = OL; g.lineWidth = 3; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(100 + i * 14, 21); g.lineTo(104 + i * 14, 30); g.stroke(); }
  P(g, ell(178, 4, 8, 6), OL, 0, 0);
  P(g, ell(58, -12, 20, 13, -0.2), '#120c0a', 0, 0); glowEyes(g, [[60, -12]], 8, '255,225,140');
  g.restore();
}
function ikLeg(H, F, L1, L2, bend) { let dx = F[0] - H[0], dy = F[1] - H[1], d = Math.hypot(dx, dy); const m = L1 + L2 - 2; if (d > m) { F = [H[0] + dx / d * m, H[1] + dy / d * m]; d = m; }
  const a = Math.atan2(dy, dx), k = Math.acos(clampN((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))) * bend; return [[H[0] + Math.cos(a + k) * L1, H[1] + Math.sin(a + k) * L1], F]; }
function limb(g, pts, w, col) { line(g, pts, w + 8, OL); line(g, pts, w, col); }
export function skinRun(ph = 0) { // Galopp auf allen vieren, Blick nach rechts, Boden bei y = 500
  const c = cv2(1024, 512), g = c.getContext('2d'), TAU = Math.PI * 2;
  const bob = Math.sin(ph * TAU * 2) * 10, flex = Math.cos(ph * TAU) * 26;
  const hip = [330 - flex * 0.5, 236 + bob], sho = [680 + flex * 0.5, 222 + bob * 0.6];
  const leg = (H, off, len, bend, col, w) => { const q = (ph + off) % 1, ang = q * TAU, sw = Math.cos(ang) * 120, lift = Math.max(0, Math.sin(ang)) * 80;
    const [K, F] = ikLeg(H, [H[0] + sw, 498 - lift], len, len, bend); limb(g, [H, K, F], w, col);
    for (const d of [-10, 4, 18]) line(g, [F, [F[0] + d + 16, F[1] + 6]], 5, BONE); };
  leg([hip[0] + 20, hip[1] + 40], 0.58, 128, -1, SKF2, 22); leg([sho[0] - 14, sho[1] + 70], 0.08, 118, 1, SKF2, 22);
  line(g, [[hip[0] - 30, hip[1] + 10], [hip[0] - 100, hip[1] - 10 + bob], [hip[0] - 160, hip[1] + 20 - bob]], 14, OL); line(g, [[hip[0] - 30, hip[1] + 10], [hip[0] - 100, hip[1] - 10 + bob], [hip[0] - 160, hip[1] + 20 - bob]], 8, SKF2);
  // Rumpf: tiefer Brustkorb, eingefallener Bauch, Buckel
  const mid = (hip[0] + sho[0]) / 2;
  P(g, g => { g.moveTo(hip[0] - 40, hip[1] + 20); g.quadraticCurveTo(hip[0] - 20, hip[1] - 30, hip[0] + 60, hip[1] - 34); g.quadraticCurveTo(mid, hip[1] - 70 + bob * 0.3, sho[0] - 20, sho[1] - 40);
    g.quadraticCurveTo(sho[0] + 70, sho[1] - 30, sho[0] + 60, sho[1] + 50); g.quadraticCurveTo(sho[0] + 30, sho[1] + 120, sho[0] - 60, sho[1] + 118);
    g.quadraticCurveTo(mid - 40, sho[1] + 70, hip[0] + 50, hip[1] + 70); g.quadraticCurveTo(hip[0] - 40, hip[1] + 76, hip[0] - 40, hip[1] + 20); }, SKF, 10, 0.12);
  g.strokeStyle = 'rgba(30,20,14,.55)'; g.lineWidth = 6; for (let i = 0; i < 6; i++) { const x = sho[0] - 10 - i * 34; g.beginPath(); g.moveTo(x, sho[1] - 10); g.quadraticCurveTo(x + 14, sho[1] + 40, x - 4, sho[1] + 96 - i * 8); g.stroke(); }
  g.fillStyle = SKF2; for (let i = 0; i < 7; i++) { const x = hip[0] + 60 + i * 40; g.beginPath(); g.arc(x, hip[1] - 38 - Math.sin(i / 6 * Math.PI) * 26 + (sho[1] - hip[1]) * i / 6, 8, 0, 7); g.fill(); } // Wirbelsaeule
  P(g, g => { g.moveTo(sho[0] - 160, sho[1] - 30); g.quadraticCurveTo(sho[0] - 20, sho[1] - 90, sho[0] + 70, sho[1] - 24); g.lineTo(sho[0] + 46, sho[1] + 46); g.lineTo(sho[0] + 16, sho[1] + 14); g.lineTo(sho[0] - 16, sho[1] + 50); g.lineTo(sho[0] - 56, sho[1] + 12); g.lineTo(sho[0] - 100, sho[1] + 34); g.lineTo(sho[0] - 130, sho[1] + 4); g.closePath(); }, SKF2, 9, 0.1);
  leg([hip[0], hip[1] + 46], 0.5, 132, -1, SKF, 26); leg([sho[0], sho[1] + 76], 0.0, 120, 1, SKF, 26);
  skinHeadSide(g, sho[0] + 60, sho[1] - 6 + Math.sin(ph * TAU * 2 + 1) * 8, 0.95);
  return c;
}
export function skinRunUp(ph = 0) { // aufrecht rennend, seitlich, Blick nach rechts, Boden bei y = 1000
  const c = cv2(512, 1024), g = c.getContext('2d'), TAU = Math.PI * 2;
  const bob = -Math.abs(Math.sin(ph * TAU)) * 22;
  const hip = [220, 540 + bob], sho = [280, 300 + bob];
  const leg = (off, col, w) => { const a = (ph + off) * TAU, F = [hip[0] + Math.cos(a) * 150, 996 - Math.max(0, Math.sin(a)) * 130];
    const [K, F2] = ikLeg(hip, F, 235, 235, -1); limb(g, [hip, K, F2], w, col); for (const d of [-8, 6, 20]) line(g, [F2, [F2[0] + d + 14, F2[1] + 4]], 5, BONE); };
  const arm = (off, col, w) => { let a = Math.sin((ph + off) * TAU) * 0.8; if (a > 0) a *= 0.55; const E = [sho[0] + Math.sin(a) * 165, sho[1] + Math.cos(a) * 165];
    const fa = a + 0.25 + Math.max(0, Math.sin((ph + off) * TAU)) * 0.45, Hd = [E[0] + Math.sin(fa) * 185, E[1] + Math.cos(fa) * 185];
    limb(g, [sho, E, Hd], w, col); for (const d of [-12, 0, 12]) line(g, [Hd, [Hd[0] + Math.sin(fa) * 40 + d, Hd[1] + Math.cos(fa) * 40]], 5, BONE); };
  arm(0.5, SKF2, 18); leg(0.5, SKF2, 24);
  P(g, g => { g.moveTo(hip[0] - 50, hip[1] + 20); g.quadraticCurveTo(hip[0] - 60, hip[1] - 120, sho[0] - 60, sho[1] - 20); g.quadraticCurveTo(sho[0] + 10, sho[1] - 50, sho[0] + 60, sho[1] + 10);
    g.quadraticCurveTo(sho[0] + 60, sho[1] + 120, hip[0] + 40, hip[1] - 60); g.quadraticCurveTo(hip[0] + 40, hip[1] + 20, hip[0] - 50, hip[1] + 20); }, SKF, 10, 0.12);
  g.strokeStyle = 'rgba(30,20,14,.55)'; g.lineWidth = 6; for (let i = 0; i < 5; i++) { const y = sho[1] + 30 + i * 32; g.beginPath(); g.moveTo(sho[0] - 50 - i * 6, y); g.quadraticCurveTo(sho[0] + 10 - i * 8, y + 14, sho[0] + 40 - i * 12, y - 4); g.stroke(); }
  P(g, g => { g.moveTo(sho[0] - 90, sho[1] + 60); g.quadraticCurveTo(sho[0] - 70, sho[1] - 60, sho[0] + 40, sho[1] - 40); g.lineTo(sho[0] + 50, sho[1] + 40); g.lineTo(sho[0] + 20, sho[1] + 10); g.lineTo(sho[0] - 10, sho[1] + 60); g.lineTo(sho[0] - 40, sho[1] + 24); g.lineTo(sho[0] - 70, sho[1] + 80); g.closePath(); }, SKF2, 9, 0.1);
  leg(0, SKF, 28); arm(0, SKF, 22);
  skinHeadSide(g, sho[0] + 20, sho[1] - 40, 0.9);
  return c;
}
const clampN = v => Math.max(-1, Math.min(1, v));
MONSTERS['SKINWALKER'] = () => { const c = cv2(512, 1024), g = c.getContext('2d'); g.drawImage(skinStand(false), 0, 0, 512, 1024); return c; };

// ------------------------------------------------------------- Folge 6: Verity (KI-Begleiterin), kleine Schwester
const VHAIR = '#7b5cff', VHAIR2 = '#5b3fd9', VSK = '#f6dcc8', VCY = '#39e4ff';
const VY = '#ffd21f', VY2 = '#e8a90c';
function smileyHead(g, cx, cy, r, mood) {
  P(g, circ(cx, cy, r), VY, r * 0.06, 0.12);
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(cx - r * 0.38, cy - r * 0.5, r * 0.28, r * 0.14, -0.5, 0, 7); g.fill();
  const ey = cy - r * 0.22, ex = r * 0.36;
  for (const s of [-1, 1]) {
    const x = cx + s * ex;
    if (mood === 'laugh') { curve(g, [x - r * 0.15, ey + r * 0.05], [x, ey - r * 0.16], [x + r * 0.15, ey + r * 0.05], r * 0.06); continue; }
    if (mood === 'close') { P(g, ell(x, ey, r * 0.17, r * 0.22), '#0a0a0c', 0, 0); P(g, circ(x + s * r * 0.02, ey + r * 0.02, r * 0.035), '#fff', 0, 0); continue; }
    if (mood === 'stare') { P(g, ell(x, ey, r * 0.08, r * 0.15), '#0a0a0c', 0, 0); continue; }
    P(g, ell(x, ey, r * 0.1, r * 0.17), '#1a1206', 0, 0); P(g, circ(x - r * 0.03, ey - r * 0.07, r * 0.035), '#fff', 0, 0);
  }
  if (mood === 'happy' || mood === 'laugh') {
    const m = g => { g.moveTo(cx - r * 0.52, cy + r * 0.12); g.quadraticCurveTo(cx, cy + r * (mood === 'laugh' ? 0.95 : 0.8), cx + r * 0.52, cy + r * 0.12); g.quadraticCurveTo(cx, cy + r * 0.32, cx - r * 0.52, cy + r * 0.12); g.closePath(); };
    g.save(); g.beginPath(); m(g); g.fillStyle = '#7a1f1a'; g.fill(); g.clip(); g.fillStyle = '#ff7a7a'; g.beginPath(); g.ellipse(cx, cy + r * 0.72, r * 0.25, r * 0.16, 0, 0, 7); g.fill(); g.restore();
    g.beginPath(); m(g); g.lineWidth = r * 0.05; g.strokeStyle = OL; g.lineJoin = 'round'; g.stroke();
  } else { // breites Zahngrinsen
    const w = mood === 'close' ? 0.82 : 0.74, d = mood === 'close' ? 1.35 : 1.15, m = g => { g.moveTo(cx - r * w, cy - r * 0.02); g.quadraticCurveTo(cx, cy + r * 0.34, cx + r * w, cy - r * 0.02); g.quadraticCurveTo(cx, cy + r * d, cx - r * w, cy - r * 0.02); g.closePath(); };
    g.save(); g.beginPath(); m(g); g.fillStyle = '#2a0a08'; g.fill(); g.clip();
    g.fillStyle = '#fbf7ee'; g.beginPath(); g.moveTo(cx - r, cy - r * 0.1); g.quadraticCurveTo(cx, cy + r * 0.34, cx + r, cy - r * 0.1); g.lineTo(cx + r, cy + r * 0.32); g.quadraticCurveTo(cx, cy + r * 0.64, cx - r, cy + r * 0.32); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(cx - r, cy + r * 0.3); g.quadraticCurveTo(cx, cy + r * 0.78, cx + r, cy + r * 0.3); g.lineTo(cx + r, cy + r); g.lineTo(cx - r, cy + r); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(28,21,18,.55)'; g.lineWidth = r * 0.02; for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(cx + i * r * 0.11, cy - r * 0.1); g.lineTo(cx + i * r * 0.11, cy + r); g.stroke(); }
    g.restore(); g.beginPath(); m(g); g.lineWidth = r * 0.05; g.strokeStyle = OL; g.stroke();
  }
}
export function verityFace(mood = 'happy', size = 512) { // Smiley-Avatar
  const c = cv(size, size), g = c.getContext('2d'); g.scale(size / 512, size / 512);
  smileyHead(g, 256, 256, 200, mood); return c;
}
export function verityMonster() { // duerre gelbe Gestalt mit Smiley-Kopf
  const c = cv2(512, 1024), g = c.getContext('2d');
  const limb = (pts, w) => { line(g, pts, w + 9, OL); line(g, pts, w, VY2); };
  limb([[226, 600], [212, 800], [218, 990]], 26); limb([[286, 600], [300, 800], [294, 990]], 26);
  for (const x of [218, 294]) P(g, ell(x, 995, 30, 12), VY2, 7, 0);
  P(g, g => { g.moveTo(206, 330); g.quadraticCurveTo(256, 312, 306, 330); g.lineTo(296, 620); g.quadraticCurveTo(256, 636, 216, 620); g.closePath(); }, VY, 9, 0.15);
  g.strokeStyle = 'rgba(120,70,0,.6)'; g.lineWidth = 6; for (let y = 370; y < 540; y += 30) { g.beginPath(); g.moveTo(220, y); g.quadraticCurveTo(256, y + 14, 292, y); g.stroke(); }
  line(g, [[256, 360], [256, 580]], 5, 'rgba(120,70,0,.5)');
  limb([[210, 345], [166, 560], [150, 790]], 22); limb([[302, 345], [346, 560], [362, 790]], 22);
  for (const [x, y] of [[150, 790], [362, 790]]) for (const d of [-12, 0, 12]) line(g, [[x, y], [x + d, y + 44]], 7, VY2);
  P(g, rr(240, 290, 32, 50, 10), VY2, 7, 0);
  smileyHead(g, 256, 175, 130, 'stare');
  return c;
}
MONSTERS['VERITY'] = verityMonster;
export function sister(expr = 'neutral') {
  const o = [HOOD, HOOD2, HAIR]; HOOD = '#f2c230'; HOOD2 = '#d9a81c'; HAIR = '#c98a3a';
  const base = boy('front', expr); const c = cv2(512, 1024), g = c.getContext('2d');
  for (const s of [-1, 1]) { P(g, circ(256 + s * 200, 180, 58), HAIR, 10, 0.1); P(g, circ(256 + s * 160, 200, 18), '#e0475a', 6, 0); }
  g.drawImage(base, 0, 0, 512, 1024);
  P(g, g => { g.moveTo(76, 300); g.bezierCurveTo(46, 40, 466, 40, 436, 300); g.quadraticCurveTo(400, 160, 256, 150); g.quadraticCurveTo(112, 160, 76, 300); g.closePath(); }, HAIR, 11, 0.1);
  [HOOD, HOOD2, HAIR] = o; return c;
}

// ------------------------------------------------------------- Folge 6b: Momo (eigene Zeichnung)
const MSK = '#d9d2c8', MHAIR = '#0d0b0c';
function momoHead(g, cx, cy, r, mood = 'photo', hl = 1.9) {
  // lange, strähnige schwarze Haare hinter dem Kopf, unten in Spitzen auslaufend
  const hair = g => { g.moveTo(cx - r * 1.05, cy + r * hl * 0.92); g.bezierCurveTo(cx - r * 1.35, cy - r * 0.2, cx - r * 1.0, cy - r * 1.25, cx, cy - r * 1.25); g.bezierCurveTo(cx + r * 1.0, cy - r * 1.25, cx + r * 1.35, cy - r * 0.2, cx + r * 1.05, cy + r * hl * 0.92);
    for (let i = 10; i >= 0; i--) { const x = cx - r * 1.05 + i * r * 0.21; g.lineTo(x + r * 0.1, cy + r * hl * (0.86 + (i % 2) * 0.04)); g.lineTo(x, cy + r * hl * (1.0 + ((i * 7) % 3) * 0.05)); } g.closePath(); };
  g.beginPath(); hair(g); g.fillStyle = MHAIR; g.fill();
  g.save(); g.beginPath(); hair(g); g.clip();
  g.strokeStyle = '#2a2628'; g.lineWidth = r * 0.03; g.lineCap = 'round';
  for (let i = -5; i <= 5; i++) { const u = i / 5; g.beginPath(); g.moveTo(cx + u * r * 0.08, cy - r * 1.4); // vom Scheitel aus, ueber den Kopf, bis in die Spitzen
    g.bezierCurveTo(cx + u * r * 1.25, cy - r * 1.05, cx + u * r * 1.2, cy + r * 0.4, cx + u * r * 1.0 + Math.sin(i) * r * 0.06, cy + r * hl * 1.1); g.stroke(); }
  g.restore();
  g.beginPath(); hair(g); g.lineWidth = r * 0.04; g.strokeStyle = OL; g.lineJoin = 'round'; g.stroke();
  // Gesicht: oben breit, unten spitz
  P(g, g => { g.moveTo(cx - r * 0.78, cy - r * 0.2); g.bezierCurveTo(cx - r * 0.85, cy - r * 1.0, cx + r * 0.85, cy - r * 1.0, cx + r * 0.78, cy - r * 0.2); g.bezierCurveTo(cx + r * 0.75, cy + r * 0.55, cx + r * 0.3, cy + r * 1.0, cx, cy + r * 1.02); g.bezierCurveTo(cx - r * 0.3, cy + r * 1.0, cx - r * 0.75, cy + r * 0.55, cx - r * 0.78, cy - r * 0.2); }, MSK, r * 0.045, 0.12);
  // Mittelscheitel
  P(g, g => { g.moveTo(cx - r * 0.82, cy - r * 0.1); g.bezierCurveTo(cx - r * 0.8, cy - r * 0.95, cx - r * 0.2, cy - r * 1.05, cx, cy - r * 0.9); g.bezierCurveTo(cx - r * 0.3, cy - r * 0.7, cx - r * 0.6, cy - r * 0.4, cx - r * 0.82, cy - r * 0.1); }, MHAIR, 0, 0);
  P(g, g => { g.moveTo(cx + r * 0.82, cy - r * 0.1); g.bezierCurveTo(cx + r * 0.8, cy - r * 0.95, cx + r * 0.2, cy - r * 1.05, cx, cy - r * 0.9); g.bezierCurveTo(cx + r * 0.3, cy - r * 0.7, cx + r * 0.6, cy - r * 0.4, cx + r * 0.82, cy - r * 0.1); }, MHAIR, 0, 0);
  // riesige, vorstehende Augen
  const er = r * (mood === 'close' ? 0.34 : 0.3), ey = cy - r * 0.12;
  for (const s of [-1, 1]) { const ex = cx + s * r * 0.4;
    g.fillStyle = 'rgba(60,40,40,.35)'; g.beginPath(); g.arc(ex, ey + er * 0.15, er * 1.18, 0, 7); g.fill();
    P(g, circ(ex, ey, er), '#f6f1ea', r * 0.035, 0.1);
    g.strokeStyle = 'rgba(200,30,30,.75)'; g.lineWidth = r * 0.012; for (let a = 0; a < 9; a++) { const an = a * 0.7 + s; g.beginPath(); g.moveTo(ex + Math.cos(an) * er * 0.95, ey + Math.sin(an) * er * 0.95); g.quadraticCurveTo(ex + Math.cos(an + 0.2) * er * 0.7, ey + Math.sin(an + 0.2) * er * 0.7, ex + Math.cos(an) * er * 0.45, ey + Math.sin(an) * er * 0.45); g.stroke(); }
    P(g, circ(ex - s * er * 0.12, ey + er * 0.05, er * (mood === 'close' ? 0.22 : 0.16)), '#0a0808', 0, 0);
    if (mood === 'close') { const gr = g.createRadialGradient(ex, ey, 1, ex, ey, er * 1.4); gr.addColorStop(0, 'rgba(255,255,255,.0)'); gr.addColorStop(0.7, 'rgba(255,255,255,.0)'); gr.addColorStop(1, 'rgba(255,220,220,0)'); g.fillStyle = gr; } }
  // kleine, schnabelartige Nase
  P(g, g => { g.moveTo(cx - r * 0.06, cy + r * 0.2); g.lineTo(cx, cy + r * 0.34); g.lineTo(cx + r * 0.06, cy + r * 0.2); g.closePath(); }, '#b9afa4', r * 0.02, 0);
  // Mund: extrem breit, bis zu den "Ohren"
  P(g, g => { g.moveTo(cx - r * 0.72, cy + r * 0.38); g.quadraticCurveTo(cx, cy + r * 0.78, cx + r * 0.72, cy + r * 0.38); g.quadraticCurveTo(cx, cy + r * 0.62, cx - r * 0.72, cy + r * 0.38); g.closePath(); }, '#3a1012', r * 0.03, 0);
}
export function momoFace(mood = 'photo', size = 512) { const c = cv(size, size), g = c.getContext('2d'); g.scale(size / 512, size / 512); g.fillStyle = '#1a1414'; g.fillRect(0, 0, 512, 512); momoHead(g, 256, 230, 190, mood); return c; }
export function momoFaceT(mood = 'close', size = 512) { const c = cv(size, size), g = c.getContext('2d'); g.scale(size / 512, size / 512); momoHead(g, 256, 230, 190, mood); return c; }
MONSTERS['MOMO'] = () => sil(g => { // Frauenkopf auf Vogelkoerper mit Krallenfuessen
  for (const x of [222, 290]) { line(g, [[x, 740], [x, 960]], 14, '#c79a2a'); for (const d of [-30, 0, 30]) line(g, [[x, 960], [x + d, 1000]], 9, '#c79a2a'); line(g, [[x, 960], [x - 8, 930]], 8, '#c79a2a'); }
  // Fluegel hinter dem Koerper
  for (const s of [-1, 1]) P(g, g => { g.moveTo(256 + s * 70, 430); g.quadraticCurveTo(256 + s * 240, 500, 256 + s * 215, 770); g.lineTo(256 + s * 190, 720); g.lineTo(256 + s * 175, 770); g.lineTo(256 + s * 150, 715); g.quadraticCurveTo(256 + s * 120, 600, 256 + s * 90, 540); g.closePath(); }, '#0e0b0c', 8, 0);
  // Rumpf mit Hals, direkt unter dem Kinn
  P(g, g => { g.moveTo(232, 360); g.lineTo(280, 360); g.quadraticCurveTo(300, 420, 330, 440); g.bezierCurveTo(400, 480, 410, 650, 350, 750); g.quadraticCurveTo(256, 795, 162, 750); g.bezierCurveTo(102, 650, 112, 480, 182, 440); g.quadraticCurveTo(212, 420, 232, 360); }, '#16121a', 10, 0.08);
  // Federn-Schuppen
  g.strokeStyle = '#2e262c'; g.lineWidth = 5; for (let row = 0; row < 7; row++) for (let k = 0; k < 6; k++) { const x = 175 + k * 33 + (row % 2) * 16, y = 470 + row * 40; if (Math.abs(x - 256) > 95 - row * 2) continue; g.beginPath(); g.arc(x, y, 16, 0.2, Math.PI - 0.2); g.stroke(); }
  momoHead(g, 256, 250, 140, 'photo', 1.75);
});

// ------------------------------------------------------------- Folge 7: Kuchisake-onna, Gastmutter
const KSK = '#f1d6c0', KHAIR = '#121014', COAT = '#c9b48e', COAT2 = '#a8936e';
function kuchiHead(g, cx, cy, mask = true, eyes = 'calm', hairLong = true) {
  if (hairLong) P(g, g => { g.moveTo(cx - 150, cy + 330); g.bezierCurveTo(cx - 190, cy - 40, cx - 150, cy - 190, cx, cy - 190); g.bezierCurveTo(cx + 150, cy - 190, cx + 190, cy - 40, cx + 150, cy + 330); g.closePath(); }, KHAIR, 10, 0);
  else P(g, g => { g.moveTo(cx - 160, cy + 90); g.bezierCurveTo(cx - 190, cy - 120, cx - 120, cy - 190, cx, cy - 190); g.bezierCurveTo(cx + 120, cy - 190, cx + 190, cy - 120, cx + 160, cy + 90); g.closePath(); }, KHAIR, 10, 0);
  P(g, ell(cx, cy + 10, 130, 158), KSK, 10, 0.1);
  P(g, g => { g.moveTo(cx - 142, cy + 10); g.bezierCurveTo(cx - 160, cy - 210, cx + 160, cy - 210, cx + 142, cy + 10); g.quadraticCurveTo(cx + 70, cy - 80, cx, cy - 66); g.quadraticCurveTo(cx - 70, cy - 80, cx - 142, cy + 10); }, KHAIR, 9, 0);
  for (const s of [-1, 1]) { const x = cx + s * 52, y = cy + 2;
    if (eyes === 'smile') { curve(g, [x - 26, y + 6], [x, y - 18], [x + 26, y + 6], 7); }
    else if (eyes === 'wide') { P(g, ell(x, y, 26, 22), '#fff', 6, 0); P(g, circ(x, y + 2, 9), OL, 0, 0); }
    else { P(g, g => { g.moveTo(x - 30, y); g.quadraticCurveTo(x, y - 20, x + 30, y); g.quadraticCurveTo(x, y + 12, x - 30, y); }, '#fff', 6, 0); P(g, circ(x, y - 2, 8), OL, 0, 0); }
    line(g, [[x - 26, y - 34], [x + 24, y - 38]], 6); }
  if (mask === 'normal') { curve(g, [cx - 30, cy + 92], [cx, cy + 106], [cx + 30, cy + 92], 7); g.fillStyle = 'rgba(230,120,120,.3)'; g.beginPath(); g.ellipse(cx - 80, cy + 64, 22, 11, 0, 0, 7); g.ellipse(cx + 80, cy + 64, 22, 11, 0, 0, 7); g.fill(); }
  else if (mask) {
    P(g, g => { g.moveTo(cx - 118, cy + 40); g.quadraticCurveTo(cx, cy + 20, cx + 118, cy + 40); g.quadraticCurveTo(cx + 110, cy + 150, cx, cy + 172); g.quadraticCurveTo(cx - 110, cy + 150, cx - 118, cy + 40); }, '#f4f6f8', 8, 0.08);
    g.strokeStyle = 'rgba(120,130,140,.5)'; g.lineWidth = 4; for (const y of [70, 100, 130]) { g.beginPath(); g.moveTo(cx - 100, cy + y); g.quadraticCurveTo(cx, cy + y + 12, cx + 100, cy + y); g.stroke(); }
    line(g, [[cx - 118, cy + 44], [cx - 132, cy + 10]], 4, '#e8eaee'); line(g, [[cx + 118, cy + 44], [cx + 132, cy + 10]], 4, '#e8eaee');
  } else { // Mund bis zu den Ohren (Cartoon, ohne Blut)
    const m = g => { g.moveTo(cx - 128, cy + 40); g.quadraticCurveTo(cx, cy + 110, cx + 128, cy + 40); g.quadraticCurveTo(cx, cy + 190, cx - 128, cy + 40); g.closePath(); };
    g.save(); g.beginPath(); m(g); g.fillStyle = '#3a0a0c'; g.fill(); g.clip(); g.fillStyle = '#f7f2e8';
    g.beginPath(); g.moveTo(cx - 140, cy + 30); g.quadraticCurveTo(cx, cy + 104, cx + 140, cy + 30); g.lineTo(cx + 140, cy + 80); g.quadraticCurveTo(cx, cy + 140, cx - 140, cy + 80); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(cx - 140, cy + 120); g.quadraticCurveTo(cx, cy + 186, cx + 140, cy + 120); g.lineTo(cx + 140, cy + 200); g.lineTo(cx - 140, cy + 200); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(30,20,20,.5)'; g.lineWidth = 3; for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(cx + i * 20, cy + 40); g.lineTo(cx + i * 20, cy + 200); g.stroke(); } g.restore();
    g.beginPath(); m(g); g.lineWidth = 7; g.strokeStyle = OL; g.stroke();
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) line(g, [[cx + s * (96 + k * 12), cy + 34 + k * 8], [cx + s * (104 + k * 12), cy + 58 + k * 8]], 4, '#5a1a1c'); // Narben-Naehte
  }
}
export function kuchisake(mask = true, scissors = false, eyes = 'calm') {
  const c = cv2(512, 1024), g = c.getContext('2d');
  P(g, g => { g.moveTo(256 - 150, 560); g.bezierCurveTo(256 - 190, 190, 256 - 150, 40, 256, 40); g.bezierCurveTo(256 + 150, 40, 256 + 190, 190, 256 + 150, 560); g.closePath(); }, KHAIR, 10, 0); // Haare hinten
  P(g, ell(222, 1000, 30, 14), '#1a1416', 7, 0); P(g, ell(290, 1000, 30, 14), '#1a1416', 7, 0);
  P(g, rr(206, 880, 30, 120, 10), KSK, 7, 0); P(g, rr(276, 880, 30, 120, 10), KSK, 7, 0);
  // langer Trenchcoat
  P(g, g => { g.moveTo(170, 380); g.lineTo(342, 380); g.lineTo(372, 900); g.lineTo(140, 900); g.closePath(); }, COAT, 10, 0.12);
  line(g, [[256, 400], [262, 900]], 5, COAT2); for (const y of [520, 600, 680]) { P(g, circ(236, y, 8), '#6a5a40', 4, 0); P(g, circ(290, y, 8), '#6a5a40', 4, 0); }
  P(g, rr(150, 600, 212, 26, 8), COAT2, 6, 0);
  P(g, g => { g.moveTo(200, 380); g.lineTo(256, 470); g.lineTo(312, 380); }, COAT2, 7, 0);
  P(g, rr(116, 400, 52, 380, 24), COAT, 8, 0.1); P(g, rr(344, 400, 52, 380, 24), COAT, 8, 0.1);
  P(g, circ(142, 790, 24), KSK, 7, 0); P(g, circ(370, 790, 24), KSK, 7, 0);
  if (scissors) { g.save(); g.translate(380, 800); g.rotate(0.3); P(g, rr(-10, 0, 20, 150, 6), '#c9ced6', 6, 0); P(g, rr(4, 0, 18, 150, 6), '#aeb4bd', 6, 0); P(g, circ(-6, -14, 20), '#2a2a2e', 6, 0); P(g, circ(24, -14, 20), '#2a2a2e', 6, 0); g.restore(); }
  kuchiHead(g, 256, 230, mask, eyes, false);
  for (const sd of [-1, 1]) P(g, g => { g.moveTo(256 + sd * 150, 300); g.quadraticCurveTo(256 + sd * 160, 420, 256 + sd * 130, 520); g.lineTo(256 + sd * 108, 500); g.quadraticCurveTo(256 + sd * 128, 400, 256 + sd * 124, 300); g.closePath(); }, KHAIR, 7, 0); // Straehnen vorne
  return c;
}
export function hostmom(mask = true, eyes = 'calm') {
  const c = cv2(512, 1024), g = c.getContext('2d');
  P(g, rr(206, 760, 40, 220, 14), '#3a3f52'); P(g, rr(266, 760, 40, 220, 14), '#3a3f52');
  P(g, rr(150, 420, 212, 360, 60), '#7a9a8a', 10, 0.12);
  P(g, g => { g.moveTo(206, 424); g.lineTo(256, 520); g.lineTo(306, 424); }, '#f2efe6', 7, 0);
  P(g, rr(108, 440, 56, 300, 26), '#7a9a8a', 8, 0.1); P(g, rr(348, 440, 56, 300, 26), '#7a9a8a', 8, 0.1);
  P(g, circ(136, 748, 26), KSK, 7, 0); P(g, circ(376, 748, 26), KSK, 7, 0);
  kuchiHead(g, 256, 250, mask, eyes, false);
  return c;
}
MONSTERS['KUCHISAKE-ONNA'] = () => kuchisake(true, true);

// ------------------------------------------------------------- Folge 8: Teke Teke · Folge 9: The Rake
const TSK = '#e9e2dc', THAIR = '#0e0c10', UNI = '#1f2a44', UNI2 = '#f2f2ee';
function tekeHead(g, cx, cy, r, look = 'down') {
  P(g, g => { g.moveTo(cx - r * 1.05, cy + r * 1.35); g.bezierCurveTo(cx - r * 1.35, cy - r * 0.2, cx - r * 1.0, cy - r * 1.2, cx, cy - r * 1.2); g.bezierCurveTo(cx + r * 1.0, cy - r * 1.2, cx + r * 1.35, cy - r * 0.2, cx + r * 1.05, cy + r * 1.35); for (let i = 8; i >= 0; i--) { const x = cx - r * 1.05 + i * r * 0.2625; g.lineTo(x + r * 0.12, cy + r * 1.25); g.lineTo(x, cy + r * (1.5 + (i % 3) * 0.12)); } g.closePath(); }, THAIR, r * 0.05, 0);
  P(g, ell(cx, cy + r * 0.1, r * 0.78, r * 0.95), TSK, r * 0.05, 0.12);
  // Haare haengen ins Gesicht, nur ein Auge sichtbar
  P(g, g => { g.moveTo(cx - r * 0.85, cy + r * 1.3); g.bezierCurveTo(cx - r * 0.95, cy - r * 0.8, cx - r * 0.1, cy - r * 1.1, cx + r * 0.25, cy - r * 0.9); g.bezierCurveTo(cx + r * 0.05, cy - r * 0.2, cx - r * 0.05, cy + r * 0.6, cx - r * 0.2, cy + r * 1.4); g.closePath(); }, THAIR, 0, 0);
  const ex = cx + r * 0.3, ey = cy - (look === 'up' ? 0.05 : -0.05) * r;
  P(g, ell(ex, ey, r * 0.2, r * 0.17), '#fff', r * 0.03, 0); P(g, circ(ex, ey + r * 0.02, r * 0.06), '#0a0808', 0, 0);
  g.strokeStyle = 'rgba(200,40,40,.6)'; g.lineWidth = r * 0.012; for (let a = 0; a < 5; a++) { g.beginPath(); g.moveTo(ex + Math.cos(a * 1.2) * r * 0.19, ey + Math.sin(a * 1.2) * r * 0.15); g.lineTo(ex + Math.cos(a * 1.2) * r * 0.1, ey + Math.sin(a * 1.2) * r * 0.08); g.stroke(); }
  line(g, [[cx + r * 0.05, cy + r * 0.62], [cx + r * 0.45, cy + r * 0.58]], r * 0.035);
}
export function tekeFront(ph = 0) { // kriecht auf die Kamera zu, Oberkoerper + Arme auf den Ellbogen
  const c = cv2(512, 512), g = c.getContext('2d'), a = Math.sin(ph * Math.PI * 2);
  for (const s of [-1, 1]) { const lift = Math.max(0, s * a) * 30; line(g, [[256 + s * 90, 300], [256 + s * 190, 380 - lift], [256 + s * 170, 470 - lift * 0.4]], 34, OL); line(g, [[256 + s * 90, 300], [256 + s * 190, 380 - lift], [256 + s * 170, 470 - lift * 0.4]], 26, UNI); P(g, ell(256 + s * 172, 478 - lift * 0.4, 30, 18), TSK, 7, 0); }
  P(g, g => { g.moveTo(150, 280); g.quadraticCurveTo(256, 240, 362, 280); g.lineTo(340, 470); g.quadraticCurveTo(256, 500, 172, 470); g.closePath(); }, UNI, 10, 0.1);
  P(g, g => { g.moveTo(186, 268); g.lineTo(256, 350); g.lineTo(326, 268); g.lineTo(300, 262); g.lineTo(256, 318); g.lineTo(212, 262); g.closePath(); }, UNI2, 6, 0); P(g, g => { g.moveTo(240, 330); g.lineTo(272, 330); g.lineTo(256, 370); g.closePath(); }, '#c0302a', 5, 0);
  tekeHead(g, 256, 190 + a * 6, 90, 'up');
  return c;
}
export function tekeSide(ph = 0) { // seitlich, zieht sich nach rechts
  const c = cv2(1024, 512), g = c.getContext('2d'), a = Math.sin(ph * Math.PI * 2);
  const sx = 560 + a * 20; line(g, [[sx, 330], [sx + 140 + a * 60, 380], [sx + 230 + a * 80, 470]], 34, OL); line(g, [[sx, 330], [sx + 140 + a * 60, 380], [sx + 230 + a * 80, 470]], 26, UNI);
  P(g, g => { g.moveTo(330, 470); g.quadraticCurveTo(360, 300, sx + 20, 300); g.quadraticCurveTo(sx + 60, 420, sx - 10, 470); g.closePath(); }, UNI, 10, 0.1);
  P(g, g => { g.moveTo(340, 470); g.lineTo(330, 500); g.lineTo(560, 500); g.lineTo(555, 470); g.closePath(); }, '#141016', 0, 0); // Schatten, kein Unterkoerper
  P(g, g => { g.moveTo(sx - 60, 300); g.lineTo(sx + 20, 300); g.lineTo(sx - 30, 360); g.closePath(); }, UNI2, 6, 0);
  line(g, [[sx - 40, 330], [sx + 60 - a * 50, 400], [sx + 150 - a * 70, 470]], 34, OL); line(g, [[sx - 40, 330], [sx + 60 - a * 50, 400], [sx + 150 - a * 70, 470]], 26, UNI);
  tekeHead(g, sx + 60, 250 + a * 6, 72, 'down');
  return c;
}
MONSTERS['TEKE TEKE'] = () => { const c = cv2(512, 1024), g = c.getContext('2d'); g.drawImage(tekeFront(0.25), 0, 430, 512, 512); return c; };

const RSK = '#d6d2cb', RSK2 = '#a9a39a', RSKD = '#6f6a64';
// Glied mit Umriss und Schattenkante
function rlimb(g, pts, w) { line(g, pts, w + 9, OL); line(g, pts, w, RSK); g.save(); g.globalAlpha = 0.35; line(g, pts.map(([x, y]) => [x + w * 0.22, y + w * 0.12]), w * 0.4, RSK2); g.restore(); }
// lange Hand: Handflaeche + 4 Finger mit je 2 Gelenken + dunkle Krallen
function rhand(g, x, y, ang, len = 1, curl = 0, spread = 0.18) {
  g.save(); g.translate(x, y); g.rotate(ang);
  P(g, ell(0, 0, 26 * len, 20 * len), RSK, 7, 0.12);
  for (let i = 0; i < 4; i++) { const a = (i - 1.5) * spread, l1 = (62 + (i === 1 || i === 2 ? 16 : 0)) * len, l2 = 58 * len;
    const p1 = [Math.cos(a) * 18 * len, Math.sin(a) * 18 * len], p2 = [p1[0] + Math.cos(a) * l1, p1[1] + Math.sin(a) * l1], a2 = a + curl * 0.9, p3 = [p2[0] + Math.cos(a2) * l2, p2[1] + Math.sin(a2) * l2];
    line(g, [p1, p2, p3], 15 * len, OL); line(g, [p1, p2, p3], 9 * len, RSK); P(g, circ(p2[0], p2[1], 6 * len), RSK2, 3, 0);
    const a3 = a2 + 0.5 + curl * 0.6; P(g, g => { g.moveTo(p3[0] - 4 * len, p3[1] - 4 * len); g.lineTo(p3[0] + Math.cos(a3) * 30 * len, p3[1] + Math.sin(a3) * 30 * len); g.lineTo(p3[0] + 4 * len, p3[1] + 4 * len); g.closePath(); }, '#1d1916', 3, 0); }
  g.restore();
}
function rakeFace(g, cx, cy, r, mood = 'stare') { // ausgemergelt, eingefallene Augen, schiefes Gebiss
  P(g, g => { g.moveTo(cx, cy - r); g.bezierCurveTo(cx + r * 0.95, cy - r, cx + r * 0.85, cy + r * 0.45, cx + r * 0.35, cy + r * 0.95); g.quadraticCurveTo(cx, cy + r * 1.08, cx - r * 0.35, cy + r * 0.95); g.bezierCurveTo(cx - r * 0.85, cy + r * 0.45, cx - r * 0.95, cy - r, cx, cy - r); }, RSK, r * 0.05, 0.16);
  g.fillStyle = 'rgba(90,80,75,.28)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * r * 0.48, cy + r * 0.35, r * 0.16, r * 0.3, s * 0.3, 0, 7); g.fill(); } // eingefallene Wangen
  g.strokeStyle = 'rgba(80,70,65,.35)'; g.lineWidth = r * 0.018; for (const y of [-0.62, -0.52, -0.43]) { g.beginPath(); g.moveTo(cx - r * 0.42, cy + y * r); g.quadraticCurveTo(cx, cy + (y - 0.05) * r, cx + r * 0.42, cy + y * r); g.stroke(); }
  for (const s of [-1, 1]) { const ex = cx + s * r * 0.34, ey = cy - r * 0.12;
    g.fillStyle = 'rgba(40,30,30,.55)'; g.beginPath(); g.ellipse(ex, ey, r * 0.3, r * 0.33, s * 0.3, 0, 7); g.fill();
    P(g, ell(ex, ey + r * 0.02, r * 0.2, r * 0.25, s * 0.3), '#030202', 0, 0);
    if (mood !== 'blind') { const gr = g.createRadialGradient(ex - s * r * 0.03, ey - r * 0.04, 1, ex - s * r * 0.03, ey - r * 0.04, r * 0.09); gr.addColorStop(0, 'rgba(245,240,230,1)'); gr.addColorStop(1, 'rgba(245,240,230,0)'); g.fillStyle = gr; g.beginPath(); g.arc(ex - s * r * 0.03, ey - r * 0.04, r * 0.09, 0, 7); g.fill(); } }
  P(g, g => { g.moveTo(cx - r * 0.07, cy + r * 0.28); g.lineTo(cx, cy + r * 0.2); g.lineTo(cx + r * 0.07, cy + r * 0.28); g.closePath(); }, '#2a2220', 0, 0); // Nasenloecher-Schlitz
  const m = g => { g.moveTo(cx - r * 0.38, cy + r * 0.52); g.quadraticCurveTo(cx, cy + r * (mood === 'open' ? 0.44 : 0.5), cx + r * 0.38, cy + r * 0.52); g.quadraticCurveTo(cx, cy + r * (mood === 'open' ? 1.0 : 0.76), cx - r * 0.38, cy + r * 0.52); g.closePath(); };
  g.save(); g.beginPath(); m(g); g.fillStyle = '#120606'; g.fill(); g.clip(); g.fillStyle = '#d9cfb8';
  for (let i = -5; i <= 5; i++) { const h = (0.1 + ((i * 7 + 11) % 5) * 0.025) * r, x = cx + i * r * 0.068; g.beginPath(); g.moveTo(x - r * 0.026, cy + r * 0.5); g.lineTo(x + ((i % 2) ? r * 0.01 : -r * 0.008), cy + r * 0.5 + h); g.lineTo(x + r * 0.026, cy + r * 0.5); g.fill();
    g.beginPath(); g.moveTo(x - r * 0.024, cy + r * (mood === 'open' ? 0.98 : 0.75)); g.lineTo(x, cy + r * (mood === 'open' ? 0.98 : 0.75) - h * 0.8); g.lineTo(x + r * 0.024, cy + r * (mood === 'open' ? 0.98 : 0.75)); g.fill(); }
  g.restore(); g.beginPath(); m(g); g.lineWidth = r * 0.03; g.strokeStyle = OL; g.stroke();
}
// Hockt auf dem Fussende: ganzer Koerper sichtbar, Zehen umklammern das Brett, Haende haengen mit langen Fingern herab
export function rakeCrouch(tilt = 0, curl = 0, dark = false) {
  const c = cv2(768, 768), g = c.getContext('2d'), cx = 384;
  // Fuesse auf dem Brett (Brett-Kante bei y = 640)
  for (const s of [-1, 1]) { const fx = cx + s * 120; rlimb(g, [[cx + s * 70, 470], [cx + s * 175, 300], [fx, 600]], 30);
    rhand(g, fx, 600, Math.PI / 2 + s * 0.25, 0.85, 0.9, 0.24); }
  // Rumpf: gebueckt, Rippen, Wirbel
  P(g, g => { g.moveTo(cx - 70, 500); g.quadraticCurveTo(cx - 120, 360, cx - 80, 250); g.quadraticCurveTo(cx, 200, cx + 80, 250); g.quadraticCurveTo(cx + 120, 360, cx + 70, 500); g.quadraticCurveTo(cx, 530, cx - 70, 500); }, RSK, 9, 0.16);
  g.strokeStyle = 'rgba(90,80,75,.55)'; g.lineWidth = 6; for (let i = 0; i < 6; i++) { const y = 290 + i * 28; g.beginPath(); g.moveTo(cx - 78 + i * 4, y); g.quadraticCurveTo(cx, y + 18, cx + 78 - i * 4, y); g.stroke(); }
  P(g, ell(cx, 470, 40, 14), 'rgba(80,70,65,.35)', 0, 0);
  // Knie vorne drueber (zweite Schicht, damit sie vor dem Rumpf liegen)
  for (const s of [-1, 1]) { P(g, ell(cx + s * 165, 305, 34, 30), RSK, 8, 0.14); }
  // Arme haengen zwischen den Knien herab, Haende ueber der Brettkante
  for (const s of [-1, 1]) { const sx = cx + s * 78, hx = cx + s * 46; rlimb(g, [[sx, 265], [cx + s * 118, 420], [hx, 560]], 22);
    rhand(g, hx, 575, Math.PI / 2 + s * 0.12, 0.95, curl + (s > 0 ? 0.15 : 0), 0.2); }
  // Kopf tief zwischen den Schultern, geneigt
  g.save(); g.translate(cx, 205); g.rotate(tilt); line(g, [[0, 30], [0, -10]], 30, OL); line(g, [[0, 30], [0, -10]], 22, RSK); rakeFace(g, 0, -70, 82, 'stare'); g.restore();
  if (dark) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(5,6,12,.5)'; g.fillRect(0, 0, 768, 768); g.globalCompositeOperation = 'source-over'; }
  return c;
}
export function rakeFaceBig(mood = 'stare') { const c = cv(512, 512), g = c.getContext('2d'); rakeFace(g, 256, 236, 200, mood); return c; }
// Nahaufnahme Hand mit langen Fingern (fuer die Finger-Szene)
export function rakeHandBig(curl = 0) { const c = cv2(512, 512), g = c.getContext('2d'); rlimb(g, [[-40, 60], [140, 150]], 46); rhand(g, 170, 170, 0.75, 2.1, curl, 0.22); return c; }
// stehend, stark gebueckt, Arme bis zu den Knien
MONSTERS['THE RAKE'] = () => { const c = cv2(512, 1024), g = c.getContext('2d');
  for (const s of [-1, 1]) { rlimb(g, [[256 + s * 36, 600], [256 + s * 80, 780], [256 + s * 54, 960]], 26); P(g, ell(256 + s * 66, 975, 40, 16), RSK, 7, 0.12); }
  P(g, g => { g.moveTo(200, 610); g.quadraticCurveTo(150, 460, 210, 340); g.quadraticCurveTo(256, 300, 320, 330); g.quadraticCurveTo(350, 470, 312, 610); g.quadraticCurveTo(256, 640, 200, 610); }, RSK, 9, 0.16);
  g.strokeStyle = 'rgba(90,80,75,.55)'; g.lineWidth = 6; for (let i = 0; i < 6; i++) { const y = 380 + i * 30; g.beginPath(); g.moveTo(206, y); g.quadraticCurveTo(256, y + 16, 316, y); g.stroke(); }
  for (const s of [-1, 1]) { rlimb(g, [[256 + s * 64, 350], [256 + s * 120, 560], [256 + s * 112, 760]], 20); rhand(g, 256 + s * 110, 770, Math.PI / 2 - s * 0.15, 0.95, 0.25, 0.2); }
  g.save(); g.translate(270, 300); g.rotate(0.18); line(g, [[0, 30], [0, -20]], 30, OL); line(g, [[0, 30], [0, -20]], 22, RSK); rakeFace(g, 0, -90, 88, 'stare'); g.restore(); return c; };
