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
    P(g, g => { g.moveTo(cx - 128, cy + 82); g.quadraticCurveTo(cx, cy + 190, cx + 128, cy + 82); g.quadraticCurveTo(cx, cy + 128, cx - 128, cy + 82); }, '#fbf7ee', 7, 0);
    g.strokeStyle = OL; g.lineWidth = 4; for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(cx + i * 25, cy + 100 - Math.abs(i) * 2); g.lineTo(cx + i * 25, cy + 134 - Math.abs(i) * 6); g.stroke(); }
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
export function skinRun(ph = 0) { // ph 0..1: Galopp-Phase, Blick nach rechts, Boden bei y = 500
  const c = cv2(1024, 512), g = c.getContext('2d'), TAU = Math.PI * 2;
  const bob = Math.sin(ph * TAU * 2) * 10, flex = Math.cos(ph * TAU) * 22;
  const hip = [330 - flex * 0.5, 268 + bob], sho = [690 + flex * 0.5, 262 + bob * 0.6];
  const ik = (H, F, L1, L2, bend) => { let dx = F[0] - H[0], dy = F[1] - H[1], d = Math.hypot(dx, dy); const m = L1 + L2 - 2; if (d > m) { F = [H[0] + dx / d * m, H[1] + dy / d * m]; d = m; }
    const a = Math.atan2(dy, dx), k = Math.acos(clampN((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))) * bend; return [[H[0] + Math.cos(a + k) * L1, H[1] + Math.sin(a + k) * L1], F]; };
  const leg = (H, off, len, bend, col, w) => { const q = (ph + off) % 1, ang = q * TAU, sw = Math.cos(ang) * 120, lift = Math.max(0, Math.sin(ang)) * 90;
    const F = [H[0] + sw, 498 - lift]; const [K, F2] = ik(H, F, len, len, bend);
    line(g, [H, K, F2], w + 8, OL); line(g, [H, K, F2], w, col);
    for (const d of [-10, 4, 18]) line(g, [F2, [F2[0] + d + 16, F2[1] + 6]], 5, BONE); };
  // hintere (ferne) Beine
  leg([hip[0] + 18, hip[1] + 20], 0.58, 126, -1, SKF2, 22); leg([sho[0] - 12, sho[1] + 28], 0.08, 120, 1, SKF2, 22);
  // Schwanz
  line(g, [[hip[0] - 20, hip[1] - 4], [hip[0] - 90, hip[1] - 20 + bob], [hip[0] - 150, hip[1] + 10 - bob]], 12, SKF2);
  // Rumpf (abgemagert, Rippen)
  P(g, g => { g.moveTo(hip[0] - 30, hip[1] - 10); g.quadraticCurveTo((hip[0] + sho[0]) / 2, hip[1] - 50 + bob * 0.3, sho[0] + 40, sho[1] - 20); g.quadraticCurveTo(sho[0] + 60, sho[1] + 50, sho[0] - 10, sho[1] + 62);
    g.quadraticCurveTo((hip[0] + sho[0]) / 2, sho[1] + 40, hip[0] + 10, hip[1] + 52); g.quadraticCurveTo(hip[0] - 50, hip[1] + 40, hip[0] - 30, hip[1] - 10); }, SKF, 10, 0.12);
  g.strokeStyle = 'rgba(30,20,14,.55)'; g.lineWidth = 6; for (let i = 0; i < 6; i++) { const x = sho[0] - 40 - i * 30; g.beginPath(); g.moveTo(x, sho[1] - 6); g.quadraticCurveTo(x + 10, sho[1] + 22, x, sho[1] + 50); g.stroke(); }
  // Fell ueber dem Ruecken
  P(g, g => { g.moveTo(sho[0] - 150, sho[1] - 24); g.quadraticCurveTo(sho[0] - 20, sho[1] - 70, sho[0] + 80, sho[1] - 24); g.lineTo(sho[0] + 50, sho[1] + 34); g.lineTo(sho[0] + 20, sho[1] + 4); g.lineTo(sho[0] - 10, sho[1] + 36); g.lineTo(sho[0] - 50, sho[1] + 2); g.lineTo(sho[0] - 90, sho[1] + 26); g.closePath(); }, SKF2, 9, 0.1);
  // vordere (nahe) Beine
  leg([hip[0], hip[1] + 26], 0.5, 130, -1, SKF, 26); leg([sho[0], sho[1] + 34], 0.0, 124, 1, SKF, 26);
  g.save(); g.translate(sho[0] + 130, sho[1] - 12 + Math.sin(ph * TAU * 2 + 1) * 8); g.rotate(-Math.PI / 2 + 0.3); skinHead(g, 0, 0, 0.9); g.restore();
  return c;
}
const clampN = v => Math.max(-1, Math.min(1, v));
MONSTERS['SKINWALKER'] = () => { const c = cv2(512, 1024), g = c.getContext('2d'); g.drawImage(skinStand(false), 0, 0, 512, 1024); return c; };
