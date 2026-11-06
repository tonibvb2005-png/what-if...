// 2D cartoon characters (canvas) used as billboards in the 3D world.
// Tall pill bodies with detailed role costumes, thin line limbs, big round heads.
import * as THREE from 'three';

export const CW = 512, CH = 768;
const FEET = 748;
const INK = '#151012';
const LW = 10;
const HX = 256, HY = 196, HR = 134;
const BX = 256, BT = 318, BB = 600, BW = 176; // body pill
const cache = new Map();

// ---------- primitives ----------
function stroke(c, lw = LW) { c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
function fillStroke(c, fill, lw = LW) { if (fill) { c.fillStyle = fill; c.fill(); } stroke(c, lw); }
function line(c, pts, lw = LW, col = INK) { c.beginPath(); c.moveTo(...pts[0]); for (const p of pts.slice(1)) c.lineTo(...p); c.lineWidth = lw; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); }
function circ(c, x, y, r, fill, lw = LW) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); fillStroke(c, fill, lw); }
function dot(c, x, y, r, col = INK) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = col; c.fill(); }
function rrect(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function pill() { const c = this; }
function bodyPath(c, w = BW) { rrect(c, BX - w / 2, BT, w, BB - BT, w / 2); }
function shade(c, w = BW) { // soft side shading inside the body
  const g = c.createLinearGradient(BX - w / 2, 0, BX + w / 2, 0);
  g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(0.55, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.16)');
  c.fillStyle = g; c.fillRect(BX - w / 2, BT, w, BB - BT);
}

// ---------- items ----------
function shield(c, x, y, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  rrect(c, -62, -105, 124, 210, 16); fillStroke(c, '#b8262b', 9);
  rrect(c, -50, -93, 100, 186, 10); c.lineWidth = 6; c.strokeStyle = '#e8b63c'; c.stroke();
  circ(c, 0, 0, 22, '#e8b63c', 7);
  for (const s2 of [-1, 1]) { line(c, [[s2 * 14, -14], [s2 * 40, -60]], 7, '#e8b63c'); line(c, [[s2 * 14, 14], [s2 * 40, 60]], 7, '#e8b63c'); }
  c.restore();
}
function pilum(c, x, y0, y1) { line(c, [[x, y0], [x, y1]], 13); line(c, [[x, y0], [x, y1]], 6, '#9a6a3a'); line(c, [[x, y0 - 50], [x, y0]], 8, '#9aa4b0'); c.beginPath(); c.moveTo(x - 9, y0 - 46); c.lineTo(x, y0 - 70); c.lineTo(x + 9, y0 - 46); fillStroke(c, '#c8d0da', 5); }
function vitis(c, x, y, a = 0) { c.save(); c.translate(x, y); c.rotate(a); line(c, [[0, -150], [0, 120]], 15); line(c, [[0, -150], [0, 120]], 8, '#7a4a22'); for (let i = -120; i < 110; i += 46) dot(c, 0, i, 5, '#4f2e12'); c.restore(); }
function tablet(c, x, y, a = -0.15) { c.save(); c.translate(x, y); c.rotate(a); rrect(c, -46, -60, 92, 120, 8); fillStroke(c, '#a5713e', 8); c.fillStyle = '#4a3a2a'; c.fillRect(-34, -48, 68, 96); for (let i = 0; i < 5; i++) line(c, [[-26, -36 + i * 18], [10 + (i % 2) * 12, -36 + i * 18]], 3, '#d8c8a0'); c.restore(); }
function template(c, x, y) { // curved wooden road template (arc board)
  c.save(); c.translate(x, y);
  c.beginPath(); c.moveTo(-120, 20); c.quadraticCurveTo(0, -46, 120, 20); c.lineTo(120, 44); c.lineTo(-120, 44); c.closePath(); fillStroke(c, '#c88a4a', 9);
  for (let i = -90; i <= 90; i += 45) line(c, [[i, 6 - Math.cos(i / 120) * 14], [i, 40]], 3, '#8a5a2a');
  c.restore();
}
function pick(c, x, y, a) { c.save(); c.translate(x, y); c.rotate(a); line(c, [[0, 0], [0, -190]], 14); line(c, [[0, 0], [0, -190]], 7, '#9a6a3a'); c.beginPath(); c.moveTo(-70, -170); c.quadraticCurveTo(0, -214, 70, -170); c.lineTo(66, -160); c.quadraticCurveTo(0, -196, -66, -160); c.closePath(); fillStroke(c, '#9aa4b0', 7); c.restore(); }
function stoneBlock(c, x, y) { rrect(c, x - 80, y - 52, 160, 104, 12); fillStroke(c, '#8d8f96', 9); line(c, [[x - 50, y - 20], [x - 10, y - 30]], 5, '#6a6c73'); line(c, [[x + 20, y + 20], [x + 55, y + 8]], 5, '#6a6c73'); }
function basket(c, x, y) { c.beginPath(); c.moveTo(x - 70, y - 30); c.lineTo(x + 70, y - 30); c.lineTo(x + 54, y + 50); c.lineTo(x - 54, y + 50); c.closePath(); fillStroke(c, '#c49a52', 8); for (let i = -2; i <= 2; i++) line(c, [[x + i * 24, y - 26], [x + i * 20, y + 46]], 3, '#8a6a32'); c.beginPath(); c.ellipse(x, y - 32, 66, 18, 0, Math.PI, 0); fillStroke(c, '#9a9a96', 6); }
function camera(c, x, y) { rrect(c, x - 46, y - 30, 92, 60, 10); fillStroke(c, '#2b2b33', 8); circ(c, x + 6, y, 18, '#5a7ab0', 6); }
function mug(c, x, y) { rrect(c, x - 26, y - 34, 52, 68, 8); fillStroke(c, '#c88a4a', 8); }

// ---------- outfits ----------
const OUT = {
  engineer(c, s) {
    bodyPath(c); c.fillStyle = '#6f9fc8'; c.fill();
    c.save(); bodyPath(c); c.clip();
    c.fillStyle = '#eef3f7'; c.beginPath(); c.moveTo(BX - 46, BT); c.lineTo(BX, BT + 70); c.lineTo(BX + 46, BT); c.fill();
    line(c, [[BX - 46, BT + 4], [BX, BT + 70], [BX + 46, BT + 4]], 7);
    c.fillStyle = '#e8b63c'; c.fillRect(BX - 100, BB - 46, 200, 12);
    c.save(); c.translate(BX, (BT + BB) / 2); c.rotate(-0.72); c.fillStyle = '#7a4a22'; c.fillRect(-170, -12, 340, 24); c.restore();
    c.fillStyle = '#7a4a22'; c.fillRect(BX - 100, BB - 120, 200, 22);
    rrect(c, BX - 18, BB - 124, 36, 30, 6); fillStroke(c, '#e8b63c', 5);
    shade(c); c.restore();
    bodyPath(c); stroke(c);
    // satchel
    rrect(c, BX + 58, BB - 110, 72, 64, 12); fillStroke(c, '#8a5428', 8); line(c, [[BX + 58, BB - 84], [BX + 130, BB - 84]], 5);
    // scroll
    c.save(); c.translate(BX + 96, BB - 128); c.rotate(-0.5); rrect(c, -10, -40, 20, 70, 8); fillStroke(c, '#f2e6c4', 6); c.restore();
  },
  legionary(c, s) {
    bodyPath(c); c.fillStyle = '#c0302f'; c.fill();
    c.save(); bodyPath(c); c.clip();
    // segmented plate armour
    for (let i = 0; i < 7; i++) {
      const y = BT + 18 + i * 28;
      c.fillStyle = i % 2 ? '#aab3bf' : '#c3cbd5'; c.fillRect(BX - 100, y, 200, 28);
      line(c, [[BX - 100, y], [BX + 100, y]], 4);
      for (const x of [-56, 0, 56]) dot(c, BX + x, y + 14, 4, '#e8b63c');
    }
    line(c, [[BX - 100, BT + 214], [BX + 100, BT + 214]], 6);
    // scarf
    c.fillStyle = '#f2ece0'; c.beginPath(); c.ellipse(BX, BT + 6, 70, 26, 0, 0, Math.PI * 2); c.fill(); stroke(c, 6);
    // belt + apron
    c.fillStyle = '#6a3a1a'; c.fillRect(BX - 100, BB - 98, 200, 20);
    for (const x of [-60, -20, 20, 60]) dot(c, BX + x, BB - 88, 5, '#e8b63c');
    shade(c); c.restore();
    bodyPath(c); stroke(c);
    for (let i = -2; i <= 2; i++) { rrect(c, BX + i * 18 - 6, BB - 80, 12, 92, 4); fillStroke(c, '#6a3a1a', 4); dot(c, BX + i * 18, BB - 40, 4, '#e8b63c'); dot(c, BX + i * 18, BB - 6, 4, '#e8b63c'); }
    // shoulder guards
    for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(BX + sd * 70, BT + 50, 46, 30, sd * 0.5, 0, Math.PI * 2); fillStroke(c, '#c3cbd5', 7); line(c, [[BX + sd * 46, BT + 52], [BX + sd * 98, BT + 40]], 4); }
  },
  centurion(c, s) {
    // cape behind
    c.beginPath(); c.moveTo(BX - 92, BT + 40); c.lineTo(BX - 132, BB + 40); c.lineTo(BX + 132, BB + 40); c.lineTo(BX + 92, BT + 40); c.closePath(); fillStroke(c, '#a3202a', 9);
    bodyPath(c); c.fillStyle = '#9aa3ae'; c.fill();
    c.save(); bodyPath(c); c.clip();
    c.fillStyle = 'rgba(40,50,60,0.35)';
    for (let y = BT; y < BB; y += 12) for (let x = BX - 100 + ((y / 12) % 2) * 6; x < BX + 100; x += 12) { c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); }
    // harness + phalerae
    line(c, [[BX - 60, BT + 40], [BX - 60, BB - 110]], 9, '#6a3a1a'); line(c, [[BX + 60, BT + 40], [BX + 60, BB - 110]], 9, '#6a3a1a');
    line(c, [[BX - 60, BT + 110], [BX + 60, BT + 110]], 9, '#6a3a1a'); line(c, [[BX - 60, BT + 180], [BX + 60, BT + 180]], 9, '#6a3a1a');
    for (const [x, y] of [[-60, 75], [0, 75], [60, 75], [-60, 145], [0, 145], [60, 145], [-30, 215], [30, 215]]) circ(c, BX + x, BT + y, 17, '#f0c24a', 5);
    c.fillStyle = '#6a3a1a'; c.fillRect(BX - 100, BB - 96, 200, 20); dot(c, BX, BB - 86, 7, '#f0c24a');
    c.fillStyle = '#c0302f'; c.fillRect(BX - 100, BB - 76, 200, 80);
    shade(c); c.restore();
    bodyPath(c); stroke(c);
  },
  worker(c, s) {
    const col = s.tunic || '#a9774a';
    bodyPath(c); c.fillStyle = col; c.fill();
    c.save(); bodyPath(c); c.clip();
    c.fillStyle = 'rgba(0,0,0,0.14)'; c.beginPath(); c.moveTo(BX - 40, BT); c.lineTo(BX, BT + 46); c.lineTo(BX + 40, BT); c.fill();
    line(c, [[BX - 40, BT + 2], [BX, BT + 46], [BX + 40, BT + 2]], 6);
    c.fillStyle = '#d8c08a'; c.fillRect(BX - 100, BB - 112, 200, 12);
    line(c, [[BX - 100, BB - 106], [BX + 100, BB - 106]], 3, '#8a6a32');
    rrect(c, BX + 20, BT + 120, 44, 40, 4); fillStroke(c, s.patch || '#7a5a3a', 4);
    line(c, [[BX + 26, BT + 128], [BX + 58, BT + 152]], 3, '#2a2010');
    line(c, [[BX - 100, BB - 30], [BX + 100, BB - 30]], 5, 'rgba(0,0,0,0.25)');
    shade(c); c.restore();
    bodyPath(c); stroke(c);
    line(c, [[BX - 30, BB - 106], [BX - 40, BB - 50]], 5, '#d8c08a'); line(c, [[BX - 22, BB - 106], [BX - 26, BB - 56]], 5, '#d8c08a');
  },
  tourist(c, s) {
    bodyPath(c); c.fillStyle = s.shirt || '#f2d24a'; c.fill();
    c.save(); bodyPath(c); c.clip();
    c.fillStyle = '#d9c39a'; c.fillRect(BX - 100, BB - 86, 200, 100);
    line(c, [[BX - 100, BB - 86], [BX + 100, BB - 86]], 6);
    c.fillStyle = INK; c.font = '900 34px Montserrat, sans-serif'; c.textAlign = 'center'; c.fillText('I', BX - 44, BT + 150); c.fillText('ROMA', BX + 4, BT + 196);
    c.fillStyle = '#e04646'; c.font = '900 40px sans-serif'; c.fillText('♥', BX + 4, BT + 152);
    line(c, [[BX - 56, BT], [BX - 64, BB - 120]], 12, '#3a5a8a'); line(c, [[BX + 56, BT], [BX + 64, BB - 120]], 12, '#3a5a8a');
    shade(c); c.restore(); bodyPath(c); stroke(c);
  },
};

// ---------- headwear (back = before head, front = after head) ----------
function headwear(c, s, phase) {
  const h = s.hat, x = HX, y = HY, r = HR;
  if (phase === 'back') {
    if (h === 'galea' || h === 'crest') { // neck guard flares behind head
      c.beginPath(); c.moveTo(x - r - 26, y - 6); c.lineTo(x - r - 36, y + 40); c.lineTo(x + r + 36, y + 40); c.lineTo(x + r + 26, y - 6); c.closePath(); fillStroke(c, '#aeb6c2', 9);
    }
    if (s.hair === 'curly' || s.hair === 'short') {
      const col = s.hairColor || '#3a2616';
      c.beginPath(); c.arc(x, y - 6, r + 12, Math.PI * 0.95, Math.PI * 2.05); c.fillStyle = col; c.fill(); stroke(c, 9);
    }
    return;
  }
  if (s.hair === 'curly') {
    const col = s.hairColor || '#3a2616';
    c.save(); c.beginPath(); c.arc(x, y, r + 30, 0, Math.PI * 2); c.clip();
    for (let i = 0; i <= 10; i++) { const a = Math.PI * (1.02 + i * 0.096); circ(c, x + Math.cos(a) * (r - 6), y + Math.sin(a) * (r - 6) + 4, 30, col, 8); }
    c.restore();
    c.beginPath(); c.moveTo(x - r + 8, y - 30); c.quadraticCurveTo(x, y - 96, x + r - 8, y - 30); c.lineTo(x + r - 2, y - 60); c.quadraticCurveTo(x, y - r - 20, x - r + 2, y - 60); c.closePath(); c.fillStyle = col; c.fill();
    for (const sd of [-1, 1]) { rrect(c, x + sd * (r - 22) - 14, y - 40, 28, 70, 12); fillStroke(c, col, 7); }
  } else if (s.hair === 'short') {
    const col = s.hairColor || '#3a2616';
    c.beginPath(); c.moveTo(x - r + 2, y - 30); c.quadraticCurveTo(x - r + 10, y - r - 20, x, y - r - 12); c.quadraticCurveTo(x + r - 10, y - r - 20, x + r - 2, y - 30); c.quadraticCurveTo(x + 40, y - 84, x - 20, y - 70); c.quadraticCurveTo(x - 70, y - 64, x - r + 2, y - 30); fillStroke(c, col, 9);
  }
  if (h === 'galea' || h === 'crest') {
    // bowl
    c.beginPath(); c.moveTo(x - r - 14, y - 22); c.quadraticCurveTo(x - r - 10, y - r - 44, x, y - r - 36); c.quadraticCurveTo(x + r + 10, y - r - 44, x + r + 14, y - 22); c.closePath(); fillStroke(c, '#c3cbd5', 10);
    c.save(); c.clip(); c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(x - 50, y - 110, 30, 18, -0.4, 0, 7); c.fill(); c.restore();
    // brow ridge
    rrect(c, x - r - 18, y - 40, 2 * r + 36, 24, 10); fillStroke(c, '#d9a54a', 8);
    // cheek guards
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(x + sd * (r - 4), y - 22); c.quadraticCurveTo(x + sd * (r + 18), y + 40, x + sd * (r - 22), y + 92); c.quadraticCurveTo(x + sd * (r - 56), y + 50, x + sd * (r - 44), y - 18); c.closePath(); fillStroke(c, '#c3cbd5', 8); dot(c, x + sd * (r - 20), y + 34, 6, '#d9a54a'); }
    if (h === 'crest') {
      c.beginPath(); c.moveTo(x - r - 40, y - r + 6); c.quadraticCurveTo(x, y - r - 150, x + r + 40, y - r + 6); c.quadraticCurveTo(x, y - r - 46, x - r - 40, y - r + 6); fillStroke(c, '#d1262f', 9);
      for (let i = -6; i <= 6; i++) line(c, [[x + i * 22, y - r - 30 - (36 - i * i) * 1.6], [x + i * 26, y - r - 70 - (36 - i * i) * 1.9]], 4, '#8a1520');
    } else { circ(c, x, y - r - 40, 14, '#d9a54a', 7); }
  } else if (h === 'straw') {
    c.beginPath(); c.ellipse(x, y - 78, r + 60, 30, 0, 0, Math.PI * 2); fillStroke(c, '#e2c070');
    c.beginPath(); c.moveTo(x - 80, y - 82); c.quadraticCurveTo(x, y - r - 90, x + 80, y - 82); c.closePath(); fillStroke(c, '#e8ca7c');
    line(c, [[x - 78, y - 92], [x + 78, y - 92]], 12, '#8a5a2a');
  } else if (h === 'bandana') {
    c.beginPath(); c.moveTo(x - r + 2, y - 26); c.quadraticCurveTo(x - r + 10, y - r - 20, x, y - r - 10); c.quadraticCurveTo(x + r - 10, y - r - 20, x + r - 2, y - 26); c.quadraticCurveTo(x, y - 74, x - r + 2, y - 26); fillStroke(c, s.hatColor || '#c94a3a');
    for (let i = 0; i < 6; i++) dot(c, x - 70 + i * 28, y - 100 + (i % 2) * 20, 6, '#f6ead0');
    c.beginPath(); c.moveTo(x + r - 10, y - 50); c.lineTo(x + r + 36, y - 30); c.lineTo(x + r + 18, y - 8); c.closePath(); fillStroke(c, s.hatColor || '#c94a3a', 7);
  } else if (h === 'cap') {
    c.beginPath(); c.moveTo(x - r + 4, y - 40); c.quadraticCurveTo(x - r + 6, y - r - 24, x, y - r - 16); c.quadraticCurveTo(x + r - 6, y - r - 24, x + r - 4, y - 40); c.closePath(); fillStroke(c, s.hatColor || '#2f63c0');
    c.beginPath(); c.ellipse(x - 40, y - 42, 130, 22, -0.08, 0, Math.PI * 2); fillStroke(c, s.hatColor || '#2f63c0', 8);
    circ(c, x, y - r - 14, 8, '#fff', 5);
  }
}

// ---------- face ----------
function face(c, s) {
  const e = s.expr || 'neutral', x = HX, y = HY + 10;
  const L = [x - 46, y], R = [x + 46, y];
  const skinCol = s.faceColor || '#ffffff';
  const brows = (lift = 0, tilt = 0) => { line(c, [[L[0] - 24, L[1] - 40 - lift + tilt], [L[0] + 20, L[1] - 42 - lift - tilt]], 9); line(c, [[R[0] - 20, R[1] - 42 - lift - tilt], [R[0] + 24, R[1] - 40 - lift + tilt]], 9); };
  const angry = () => { line(c, [[L[0] - 28, L[1] - 50], [L[0] + 24, L[1] - 26]], 12); line(c, [[R[0] - 24, R[1] - 26], [R[0] + 28, R[1] - 50]], 12); };
  const lid = ([px, py]) => { dot(c, px, py + 6, 12); c.fillStyle = skinCol; c.fillRect(px - 19, py - 14, 38, 18); line(c, [[px - 21, py + 3], [px + 21, py + 1]], 8); };
  const happy = ([px, py]) => { c.beginPath(); c.arc(px, py + 10, 19, Math.PI * 1.1, Math.PI * 1.9); stroke(c, 9); };
  const grit = (w = 66, h = 32, yy = y + 58) => { rrect(c, x - w / 2, yy - h / 2, w, h, 9); fillStroke(c, '#fff', 8); for (let i = 1; i < 4; i++) line(c, [[x - w / 2 + i * w / 4, yy - h / 2 + 3], [x - w / 2 + i * w / 4, yy + h / 2 - 3]], 4); line(c, [[x - w / 2 + 4, yy], [x + w / 2 - 4, yy]], 4); };
  const curve = (x0, y0, cx0, cy0, x1, y1, lw = 8) => { c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx0, cy0, x1, y1); stroke(c, lw); };
  switch (e) {
    case 'bored': lid(L); lid(R); line(c, [[L[0] - 22, L[1] - 32], [L[0] + 18, L[1] - 34]], 8); line(c, [[R[0] - 18, R[1] - 42], [R[0] + 22, R[1] - 46]], 8); line(c, [[x - 20, y + 60], [x + 22, y + 56]], 8); break;
    case 'smirk': lid(L); lid(R); line(c, [[L[0] - 22, L[1] - 32], [L[0] + 18, L[1] - 34]], 8); line(c, [[R[0] - 18, R[1] - 44], [R[0] + 22, R[1] - 48]], 8); curve(x - 24, y + 58, x + 8, y + 66, x + 30, y + 44); break;
    case 'laugh': happy(L); happy(R); brows(8);
      c.beginPath(); c.moveTo(x - 44, y + 38); c.quadraticCurveTo(x, y + 38, x + 44, y + 38); c.quadraticCurveTo(x + 38, y + 104, x, y + 104); c.quadraticCurveTo(x - 38, y + 104, x - 44, y + 38); fillStroke(c, '#7a1f1f', 8);
      c.beginPath(); c.ellipse(x, y + 88, 20, 10, 0, 0, 7); c.fillStyle = '#e0605a'; c.fill(); break;
    case 'happy': happy(L); happy(R); c.beginPath(); c.arc(x, y + 38, 28, 0.15 * Math.PI, 0.85 * Math.PI); stroke(c, 8); break;
    case 'angry': angry(); dot(c, L[0], L[1] + 4, 11); dot(c, R[0], R[1] + 4, 11); grit(); break;
    case 'shout': angry(); dot(c, L[0], L[1] + 4, 11); dot(c, R[0], R[1] + 4, 11);
      c.beginPath(); c.ellipse(x, y + 70, 36, 32, 0, 0, 7); fillStroke(c, '#7a1f1f', 8); c.fillStyle = '#fff'; c.fillRect(x - 20, y + 42, 40, 9);
      c.beginPath(); c.ellipse(x, y + 86, 18, 9, 0, 0, 7); c.fillStyle = '#e0605a'; c.fill(); break;
    case 'shock': for (const p of [L, R]) { circ(c, p[0], p[1] - 2, 27, '#fff', 7); dot(c, p[0], p[1] + 2, 8); } brows(26); circ(c, x, y + 68, 13, '#7a1f1f', 7); break;
    case 'strain': line(c, [[L[0] + 16, L[1] - 14], [L[0] - 14, L[1]], [L[0] + 16, L[1] + 14]], 9); line(c, [[R[0] - 16, R[1] - 14], [R[0] + 14, R[1]], [R[0] - 16, R[1] + 14]], 9); grit(60, 28, y + 62); break;
    case 'wink': dot(c, L[0], L[1] + 2, 12); happy(R); line(c, [[L[0] - 22, L[1] - 34], [L[0] + 18, L[1] - 36]], 8); curve(x - 30, y + 52, x + 4, y + 78, x + 36, y + 46); break;
    case 'aha': for (const p of [L, R]) { circ(c, p[0], p[1] - 2, 23, '#fff', 7); dot(c, p[0] + 4, p[1], 8); } brows(22); c.beginPath(); c.arc(x, y + 44, 28, 0.1 * Math.PI, 0.9 * Math.PI); c.closePath(); fillStroke(c, '#7a1f1f', 7); break;
    case 'determined': line(c, [[L[0] - 26, L[1] - 40], [L[0] + 22, L[1] - 30]], 10); line(c, [[R[0] - 22, R[1] - 30], [R[0] + 26, R[1] - 40]], 10); dot(c, L[0], L[1] + 4, 11); dot(c, R[0], R[1] + 4, 11); curve(x - 22, y + 62, x, y + 56, x + 22, y + 62); break;
    case 'sad': dot(c, L[0], L[1] + 4, 11); dot(c, R[0], R[1] + 4, 11); line(c, [[L[0] - 22, L[1] - 26], [L[0] + 20, L[1] - 40]], 9); line(c, [[R[0] - 20, R[1] - 40], [R[0] + 22, R[1] - 26]], 9); curve(x - 26, y + 70, x, y + 50, x + 26, y + 70); break;
    default: dot(c, L[0], L[1], 12); dot(c, R[0], R[1], 12); line(c, [[x - 18, y + 60], [x + 18, y + 60]], 8);
  }
  if (s.mustache) { c.beginPath(); c.moveTo(x, y + 34); c.bezierCurveTo(x - 20, y + 20, x - 56, y + 28, x - 62, y + 50); c.bezierCurveTo(x - 36, y + 42, x - 14, y + 50, x, y + 44); c.bezierCurveTo(x + 14, y + 50, x + 36, y + 42, x + 62, y + 50); c.bezierCurveTo(x + 56, y + 28, x + 20, y + 20, x, y + 34); c.fillStyle = s.hairColor || INK; c.fill(); }
  if (s.stubble) { c.fillStyle = 'rgba(40,30,30,0.35)'; for (let i = 0; i < 26; i++) { const a = Math.PI * (0.15 + 0.7 * ((i * 37) % 26) / 26); const rr = 96 + ((i * 13) % 20); c.beginPath(); c.arc(x + Math.cos(a) * rr * 0.9, y - 6 + Math.sin(a) * rr * 0.75, 3, 0, 7); c.fill(); } }
  if (s.sunglasses) { rrect(c, L[0] - 30, L[1] - 18, 60, 36, 12); fillStroke(c, '#222', 6); rrect(c, R[0] - 30, R[1] - 18, 60, 36, 12); fillStroke(c, '#222', 6); line(c, [[L[0] + 30, L[1] - 6], [R[0] - 30, R[1] - 6]], 6); }
  if (s.sweat) { c.beginPath(); c.moveTo(x + 120, y - 96); c.quadraticCurveTo(x + 142, y - 54, x + 120, y - 44); c.quadraticCurveTo(x + 98, y - 54, x + 120, y - 96); fillStroke(c, '#7fd0ff', 6); }
  if (s.wet) { for (const [dx, dy] of [[-90, -60], [70, -90], [100, 20], [-110, 30]]) { c.beginPath(); c.moveTo(x + dx, y + dy - 18); c.quadraticCurveTo(x + dx + 10, y + dy, x + dx, y + dy + 8); c.quadraticCurveTo(x + dx - 10, y + dy, x + dx, y + dy - 18); fillStroke(c, '#7fd0ff', 5); } }
}

function cloud(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); c.beginPath(); for (const [px, py, r] of [[0, 0, 26], [-26, 8, 20], [26, 8, 20], [-12, -14, 18], [14, -14, 18]]) { c.moveTo(px + r, py); c.arc(px, py, r, 0, Math.PI * 2); } c.lineWidth = 10; c.strokeStyle = INK; c.stroke(); c.fillStyle = '#fff'; c.fill(); c.restore(); }

// ---------- full character ----------
function drawChar(c, s) {
  const pose = s.pose || 'stand';
  const meta = {};
  c.save();
  let lean = { stumble: 0.24, march1: 0.04, march2: 0.04, carry: 0, stuck: 0 }[pose] || 0;
  if (lean) { c.translate(HX - lean * 300, FEET); c.rotate(lean); c.translate(-HX, -FEET); }
  // legs
  let legs = [[[228, 585], [214, FEET]], [[284, 585], [298, FEET]]];
  if (pose === 'walk1' || pose === 'march1') legs = [[[228, 585], [176, FEET]], [[284, 585], [334, FEET]]];
  if (pose === 'walk2' || pose === 'march2') legs = [[[228, 585], [248, FEET]], [[284, 585], [264, FEET]]];
  if (pose === 'kneel') legs = [[[228, 585], [180, 660], [210, FEET]], [[284, 585], [350, 640], [360, FEET]]];
  if (pose === 'stumble') legs = [[[228, 585], [150, FEET - 6]], [[284, 585], [312, FEET]]];
  for (const lg of legs) { line(c, lg, 12); const f = lg[lg.length - 1]; line(c, [f, [f[0] + 22, f[1]]], 12); }
  if (s.greaves) for (const lg of legs) { const a = lg[0], b = lg[lg.length - 1]; const m = [a[0] + (b[0] - a[0]) * 0.55, a[1] + (b[1] - a[1]) * 0.55]; line(c, [m, [a[0] + (b[0] - a[0]) * 0.85, a[1] + (b[1] - a[1]) * 0.85]], 20, INK); line(c, [m, [a[0] + (b[0] - a[0]) * 0.85, a[1] + (b[1] - a[1]) * 0.85]], 11, '#e0b040'); }
  // items behind the body
  if (s.item === 'pilum') pilum(c, 404, 250, 740);
  if (s.item === 'vitis' && pose !== 'fist') vitis(c, 392, 520, 0.08);
  headwear(c, s, 'back');
  (OUT[s.outfit] || OUT.worker)(c, s);
  // arms
  const SL = [176, 392], SR = [336, 392];
  const arm = (pts) => line(c, pts, 12);
  const hand = (x, y) => circ(c, x, y, 13, '#fff', 7);
  let post = null;
  switch (pose) {
    case 'point': arm([SL, [150, 500], [192, 540]]); arm([SR, [420, 330], [486, 268]]); hand(488, 266); break;
    case 'shrug': arm([SL, [100, 420], [88, 340]]); arm([SR, [412, 420], [424, 340]]); line(c, [[66, 330], [108, 330]], 10); line(c, [[404, 330], [446, 330]], 10); break;
    case 'fist': arm([SL, [150, 500], [196, 540]]); arm([SR, [420, 370], [404, 286]]); circ(c, 404, 276, 22, '#fff', 8); if (s.item === 'vitis') vitis(c, 404, 240, 0.5); break;
    case 'laughbelly': arm([SL, [150, 470], [226, 520]]); arm([SR, [362, 470], [286, 520]]); hand(226, 520); hand(286, 520); break;
    case 'carry': post = () => { arm([SL, [120, 300], [170, 110]]); arm([SR, [392, 300], [342, 110]]); stoneBlock(c, 256, 52); hand(172, 96); hand(340, 96); }; break;
    case 'hold': arm([SL, [160, 470], [168, 450]]); arm([SR, [352, 470], [344, 450]]);
      if (s.item === 'template') template(c, 256, 440); else if (s.item === 'tablet') tablet(c, 300, 450); else if (s.item === 'camera') camera(c, 256, 430); else if (s.item === 'basket') basket(c, 256, 430); break;
    case 'pick': post = () => { pick(c, 440, 560, 0.22); arm([SL, [250, 470], [420, 500]]); arm([SR, [400, 420], [436, 446]]); hand(424, 500); hand(436, 446); }; break;
    case 'stumble': arm([SL, [110, 340], [60, 300]]); arm([SR, [420, 360], [480, 310]]); break;
    case 'stuck': arm([SL, [120, 300], [100, 200]]); arm([SR, [392, 300], [412, 200]]); hand(100, 200); hand(412, 200); break;
    case 'photo': arm([SL, [190, 330], [220, 270]]); arm([SR, [322, 330], [292, 270]]); camera(c, 256, 262); break;
    case 'march1': case 'march2': case 'stand_shield':
      arm([SL, [150, 490], [170, 520]]); arm([SR, [380, 470], [404, 440]]);
      break;
    default:
      if (s.item === 'tablet') { arm([SL, [150, 500], [196, 540]]); arm([SR, [372, 470], [320, 450]]); tablet(c, 312, 440); }
      else { arm([SL, [150, 500], [196, 548]]); arm([SR, [362, 500], [316, 548]]); }
  }
  if (s.shield) shield(c, 150, 500, 0.95);
  // head
  circ(c, HX, HY, HR, s.faceColor || '#fff', 12);
  if (s.faceColor && s.faceColor !== '#fff' && s.faceColor !== '#ffffff') {
    c.save(); c.beginPath(); c.arc(HX, HY, HR - 6, 0, 7); c.clip(); c.fillStyle = 'rgba(0,0,0,0.12)'; c.beginPath(); c.arc(HX + 40, HY + 50, HR, 0, 7); c.fill(); c.restore(); circ(c, HX, HY, HR, null, 12);
  }
  face(c, s);
  headwear(c, s, 'front');
  if (post) post();
  c.restore();
  if (s.steam) { cloud(c, 84, 70, 1.25); cloud(c, 428, 58, 1.35); cloud(c, 256, 24, 0.9); }
  return meta;
}

export function charTex(spec) {
  const key = JSON.stringify(spec);
  if (cache.has(key)) return cache.get(key);
  const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
  const meta = drawChar(cv.getContext('2d'), spec);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const v = { tex, meta, canvas: cv }; cache.set(key, v); return v;
}

const geoCache = new Map();
export const allChars = [];
export function tintChars(col) { for (const c of allChars) c.mat.color.copy(col); }
export class Char {
  constructor(spec, height = 1.9) {
    this.spec = { ...spec }; this.h = height;
    if (!geoCache.has(height)) { const w = height * CW / CH; const g = new THREE.PlaneGeometry(w, height); g.translate(0, height / 2 - height * (CH - FEET) / CH, 0); geoCache.set(height, g); }
    this.mat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geoCache.get(height), this.mat);
    this.depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaTest: 0.5 });
    this.mesh.customDepthMaterial = this.depth; this.mesh.castShadow = true;
    allChars.push(this);
    this.set({});
  }
  set(ch) { Object.assign(this.spec, ch); const { tex, meta } = charTex(this.spec); if (this.mat.map !== tex) { this.mat.map = tex; this.mat.needsUpdate = true; this.depth.map = tex; this.depth.needsUpdate = true; } this.meta = meta; }
  face(camera, flip = false) {
    const p = new THREE.Vector3(); this.mesh.getWorldPosition(p);
    let yaw = Math.atan2(camera.position.x - p.x, camera.position.z - p.z);
    if (this.mesh.parent) { const q = new THREE.Quaternion(); this.mesh.parent.getWorldQuaternion(q); yaw -= new THREE.Euler().setFromQuaternion(q, 'YXZ').y; }
    this.mesh.rotation.set(0, yaw, 0); this.mesh.scale.x = flip ? -1 : 1;
  }
}

// debug: draw a sheet of specs onto a canvas
export function sheet(specs, cols = 8) {
  const cv = document.createElement('canvas'); cv.width = cols * 256; cv.height = Math.ceil(specs.length / cols) * 384;
  const x = cv.getContext('2d'); x.fillStyle = '#9cd3f0'; x.fillRect(0, 0, cv.width, cv.height);
  specs.forEach((s, i) => x.drawImage(charTex(s).canvas, (i % cols) * 256, Math.floor(i / cols) * 384, 256, 384));
  return cv;
}
