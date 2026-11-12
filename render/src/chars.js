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
function brush(c, x, y, a = 0) { c.save(); c.translate(x, y); c.rotate(a); rrect(c, -46, -16, 92, 32, 10); fillStroke(c, '#b07a40', 7); for (let i = -36; i <= 36; i += 12) line(c, [[i, 16], [i, 34]], 5, '#e8dcc0'); c.restore(); }
function foam(c, x, y, n = 9) { for (let i = 0; i < n; i++) { const a = i * 2.4, r = 18 + (i % 3) * 10; circ(c, x + Math.cos(a) * (30 + i * 4), y + Math.sin(a) * 18 - i * 3, r, '#ffffff', 5); } }
function baby(c, x, y) { c.beginPath(); c.ellipse(x, y, 70, 46, -0.2, 0, Math.PI * 2); fillStroke(c, '#f6f1e4', 8); circ(c, x - 34, y - 18, 30, '#ffffff', 7); c.beginPath(); c.arc(x - 40, y - 16, 6, 0.1, 3); stroke(c, 4); c.beginPath(); c.arc(x - 26, y - 16, 6, 0.1, 3); stroke(c, 4); c.beginPath(); c.ellipse(x - 34, y - 46, 40, 16, 0, Math.PI, 0); fillStroke(c, '#f6c6d0', 6); }
function notebook(c, x, y) { rrect(c, x - 40, y - 52, 80, 104, 6); fillStroke(c, '#5a3a22', 7); c.fillStyle = '#f3ead2'; c.fillRect(x - 30, y - 42, 60, 84); for (let i = 0; i < 5; i++) line(c, [[x - 22, y - 30 + i * 16], [x + 20, y - 30 + i * 16]], 3, '#8a8a8a'); }
function handset(c, x, y, a = -0.5) { c.save(); c.translate(x, y); c.rotate(a); rrect(c, -16, -70, 32, 140, 14); fillStroke(c, s_phoneCol, 7); rrect(c, -26, -86, 52, 34, 14); fillStroke(c, s_phoneCol, 7); rrect(c, -26, 52, 52, 34, 14); fillStroke(c, s_phoneCol, 7); c.restore(); }
let s_phoneCol = '#1e1e22';
function papers(c, x, y) { for (let i = 0; i < 6; i++) { c.save(); c.translate(x + (i % 2) * 6 - 3, y - i * 14); c.rotate((i % 3 - 1) * 0.05); rrect(c, -70, -10, 140, 22, 3); fillStroke(c, i % 2 ? '#f6f2e6' : '#ece6d2', 5); c.restore(); } }
function hammer(c, x, y, a = 0) { c.save(); c.translate(x, y); c.rotate(a); line(c, [[0, 0], [0, -150]], 14); line(c, [[0, 0], [0, -150]], 7, '#9a6a3a'); rrect(c, -40, -180, 80, 40, 8); fillStroke(c, '#8a8e96', 7); c.restore(); }
function copperPlate(c, x, y, a = 0) { c.save(); c.translate(x, y); c.rotate(a); rrect(c, -60, -40, 120, 80, 6); fillStroke(c, '#d88a3a', 7); c.fillStyle = 'rgba(255,240,200,0.6)'; c.fillRect(-50, -32, 40, 10); for (const [px, py] of [[-48, -28], [48, -28], [-48, 28], [48, 28]]) dot(c, px, py, 5, '#8a4a1a'); c.restore(); }
function mug(c, x, y) { rrect(c, x - 26, y - 34, 52, 68, 8); fillStroke(c, '#c88a4a', 8); }

function ratTail(c, x, y, a = 0, len = 120) { c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(30, len * 0.3, -30, len * 0.6, 10, len); c.lineWidth = 11; c.strokeStyle = INK; c.lineCap = 'round'; c.stroke(); c.lineWidth = 5; c.strokeStyle = '#e8a0a8'; c.stroke(); c.restore(); }
function goldCoin(c, x, y, r = 30) { circ(c, x, y, r, '#f2c23a', 7); circ(c, x, y, r * 0.66, null, 4); c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.ellipse(x - r * 0.35, y - r * 0.35, r * 0.22, r * 0.12, -0.7, 0, 7); c.fill(); c.fillStyle = '#b8861a'; c.font = `900 ${r}px Montserrat, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('G', x, y + 2); }
function scroll(c, x, y, text) { rrect(c, x - 110, y - 70, 220, 150, 6); fillStroke(c, '#f4e6c0', 7); for (let i = 0; i < 5; i++) line(c, [[x - 80, y - 40 + i * 24], [x + 70 - (i % 2) * 30, y - 40 + i * 24]], 4, '#8a6a42'); for (const sy of [-70, 80]) { rrect(c, x - 124, y + sy - 14, 248, 28, 14); fillStroke(c, '#e2cfa0', 7); } dot(c, x + 60, y + 52, 14, '#b8262b'); }
function broom(c, x, y, a = 0) { c.save(); c.translate(x, y); c.rotate(a); line(c, [[0, -230], [0, 120]], 14); line(c, [[0, -230], [0, 120]], 7, '#a8783a'); c.beginPath(); c.moveTo(-14, 110); c.lineTo(-56, 230); c.lineTo(56, 230); c.lineTo(14, 110); c.closePath(); fillStroke(c, '#d8b45a', 8); for (let i = -40; i <= 40; i += 16) line(c, [[i * 0.3, 120], [i, 226]], 3, '#8a6a2a'); line(c, [[-22, 140], [22, 140]], 8, '#8a3a2a'); c.restore(); }
function cage(c, x, y, rat = true) { rrect(c, x - 80, y - 70, 160, 130, 8); fillStroke(c, 'rgba(60,40,20,0.15)', 8); for (let i = -60; i <= 60; i += 20) line(c, [[x + i, y - 66], [x + i, y + 56]], 4); line(c, [[x - 80, y - 70], [x + 80, y - 70]], 10); c.beginPath(); c.arc(x, y - 72, 26, Math.PI, 0); stroke(c, 7); if (rat) { c.beginPath(); c.ellipse(x - 6, y + 30, 40, 24, 0, 0, 7); fillStroke(c, '#8a8a94', 6); circ(c, x + 30, y + 18, 18, '#8a8a94', 6); dot(c, x + 36, y + 14, 4); } }
function cheeseWedge(c, x, y, a = 0) { c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.moveTo(-50, 30); c.lineTo(50, 30); c.lineTo(50, -10); c.lineTo(-50, -40); c.closePath(); fillStroke(c, '#f6c63a', 7); c.beginPath(); c.moveTo(-50, -40); c.lineTo(50, -10); c.lineTo(66, -24); c.lineTo(-30, -52); c.closePath(); fillStroke(c, '#ffe07a', 7); for (const [hx, hy, r] of [[-20, 6, 9], [20, 14, 7], [0, -12, 6]]) dot(c, hx, hy, r, '#d89a1a'); c.restore(); }

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
  frock(c, s) {
    c.beginPath(); c.moveTo(BX - 80, BB - 120); c.lineTo(BX - 104, BB + 70); c.lineTo(BX - 20, BB + 50); c.lineTo(BX + 20, BB + 50); c.lineTo(BX + 104, BB + 70); c.lineTo(BX + 80, BB - 120); c.closePath(); fillStroke(c, s.coat || '#23232b', 9);
    bodyPath(c); c.fillStyle = s.coat || '#23232b'; c.fill();
    c.save(); bodyPath(c); c.clip();
    c.fillStyle = '#f7f5ef'; c.beginPath(); c.moveTo(BX - 44, BT); c.lineTo(BX, BT + 150); c.lineTo(BX + 44, BT); c.fill();
    c.fillStyle = s.vest || '#e9e2cf'; c.beginPath(); c.moveTo(BX - 40, BT + 70); c.lineTo(BX, BT + 210); c.lineTo(BX + 40, BT + 70); c.lineTo(BX + 30, BT + 60); c.lineTo(BX, BT + 150); c.lineTo(BX - 30, BT + 60); c.fill();
    line(c, [[BX - 44, BT], [BX, BT + 150], [BX + 44, BT]], 6);
    c.fillStyle = 'rgba(255,255,255,0.10)'; c.beginPath(); c.moveTo(BX - 44, BT); c.lineTo(BX - 64, BT + 60); c.lineTo(BX - 24, BT + 110); c.fill(); c.beginPath(); c.moveTo(BX + 44, BT); c.lineTo(BX + 64, BT + 60); c.lineTo(BX + 24, BT + 110); c.fill();
    for (let i = 0; i < 3; i++) { dot(c, BX - 34, BT + 140 + i * 34, 6, '#c8a24a'); dot(c, BX + 34, BT + 140 + i * 34, 6, '#c8a24a'); }
    if (s.apron) { c.fillStyle = '#f2efe6'; c.fillRect(BX - 70, BT + 160, 140, 200); if (s.stained) { c.fillStyle = 'rgba(140,70,50,0.45)'; for (let i = 0; i < 7; i++) { c.beginPath(); c.ellipse(BX - 40 + (i * 37) % 90, BT + 190 + (i * 29) % 120, 9 + i % 3 * 4, 6, i, 0, 7); c.fill(); } } line(c, [[BX - 70, BT + 160], [BX + 70, BT + 160]], 5); }
    shade(c); c.restore();
    bodyPath(c); stroke(c);
    c.beginPath(); c.moveTo(BX - 26, BT + 6); c.lineTo(BX + 26, BT + 6); c.lineTo(BX + 8, BT + 30); c.lineTo(BX + 16, BT + 70); c.lineTo(BX, BT + 80); c.lineTo(BX - 16, BT + 70); c.lineTo(BX - 8, BT + 30); c.closePath(); fillStroke(c, s.cravat || '#2a2a6a', 6);
  },
  professor(c, s) {
    c.beginPath(); c.moveTo(BX - 92, BB - 120); c.lineTo(BX - 116, BB + 70); c.lineTo(BX + 116, BB + 70); c.lineTo(BX + 92, BB - 120); c.closePath(); fillStroke(c, '#2a2430', 9);
    const w = 214; rrect(c, BX - w / 2, BT, w, BB - BT, w / 2); c.fillStyle = '#2a2430'; c.fill();
    c.save(); rrect(c, BX - w / 2, BT, w, BB - BT, w / 2); c.clip();
    c.fillStyle = '#7a2a2a'; c.beginPath(); c.ellipse(BX, BT + 170, 74, 140, 0, 0, 7); c.fill();
    for (let i = 0; i < 5; i++) dot(c, BX, BT + 90 + i * 34, 6, '#e8c24a');
    c.beginPath(); c.moveTo(BX - 50, BT + 150); c.quadraticCurveTo(BX - 10, BT + 200, BX + 40, BT + 160); c.lineWidth = 6; c.strokeStyle = '#f0c24a'; c.stroke();
    circ(c, BX + 44, BT + 162, 12, '#f0c24a', 5);
    c.fillStyle = '#f7f5ef'; c.beginPath(); c.moveTo(BX - 40, BT); c.lineTo(BX, BT + 60); c.lineTo(BX + 40, BT); c.fill();
    shade(c, w); c.restore();
    rrect(c, BX - w / 2, BT, w, BB - BT, w / 2); stroke(c);
    c.beginPath(); c.moveTo(BX - 30, BT + 4); c.lineTo(BX + 30, BT + 4); c.lineTo(BX, BT + 40); c.closePath(); fillStroke(c, '#1a1a1a', 6);
  },
  nurse(c, s) {
    c.beginPath(); c.moveTo(BX - 84, BT + 150); c.lineTo(BX - 120, FEET - 10); c.lineTo(BX + 120, FEET - 10); c.lineTo(BX + 84, BT + 150); c.closePath(); fillStroke(c, s.dress || '#3f5f9a', 9);
    bodyPath(c); c.fillStyle = s.dress || '#3f5f9a'; c.fill();
    c.save(); bodyPath(c); c.clip(); c.fillStyle = '#ffffff'; c.fillRect(BX - 60, BT + 70, 120, 260); line(c, [[BX - 60, BT + 70], [BX + 60, BT + 70]], 5); shade(c); c.restore(); bodyPath(c); stroke(c);
    c.beginPath(); c.moveTo(BX - 62, BT + 140); c.lineTo(BX - 96, FEET - 16); c.lineTo(BX + 96, FEET - 16); c.lineTo(BX + 62, BT + 140); c.closePath(); fillStroke(c, '#ffffff', 7);
    c.beginPath(); c.ellipse(BX, BT + 8, 64, 22, 0, 0, 7); fillStroke(c, '#ffffff', 6);
  },
  dress(c, s) {
    c.beginPath(); c.moveTo(BX - 80, BT + 170); c.quadraticCurveTo(BX - 150, FEET - 30, BX - 140, FEET - 6); c.lineTo(BX + 140, FEET - 6); c.quadraticCurveTo(BX + 150, FEET - 30, BX + 80, BT + 170); c.closePath(); fillStroke(c, s.dress || '#b85a7a', 9);
    for (let i = -2; i <= 2; i++) line(c, [[BX + i * 30, BT + 200], [BX + i * 50, FEET - 10]], 4, 'rgba(0,0,0,0.18)');
    bodyPath(c); c.fillStyle = s.dress || '#b85a7a'; c.fill(); c.save(); bodyPath(c); c.clip(); c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.ellipse(BX, BT + 10, 70, 30, 0, 0, 7); c.fill(); shade(c); c.restore(); bodyPath(c); stroke(c);
    for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(BX + sd * 78, BT + 44, 34, 40, 0, 0, 7); fillStroke(c, s.dress || '#b85a7a', 7); }
    line(c, [[BX - 80, BT + 170], [BX + 80, BT + 170]], 8, '#f3e6c8');
  },
  patient(c, s) {
    bodyPath(c); c.fillStyle = '#f6f3ea'; c.fill(); c.save(); bodyPath(c); c.clip();
    for (let y = BT + 60; y < BB; y += 40) line(c, [[BX - 100, y], [BX + 100, y]], 3, 'rgba(120,140,170,0.35)');
    c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(BX, BT + 8, 80, 34, 0, 0, 7); c.fill(); shade(c); c.restore(); bodyPath(c); stroke(c);
    for (let i = -3; i <= 3; i++) circ(c, BX + i * 22, BT + 28 + Math.abs(i) * 4, 9, '#ffffff', 4);
  },
  scrubs(c, s) {
    bodyPath(c); c.fillStyle = '#3aa58f'; c.fill(); c.save(); bodyPath(c); c.clip();
    c.fillStyle = '#2f8c79'; c.beginPath(); c.moveTo(BX - 40, BT); c.lineTo(BX, BT + 70); c.lineTo(BX + 40, BT); c.fill();
    line(c, [[BX - 40, BT + 2], [BX, BT + 70], [BX + 40, BT + 2]], 6);
    rrect(c, BX + 24, BT + 110, 50, 44, 5); fillStroke(c, '#3aa58f', 5); rrect(c, BX - 74, BT + 110, 44, 30, 5); fillStroke(c, '#ffffff', 4);
    c.fillStyle = '#2f8c79'; c.fillRect(BX - 100, BB - 80, 200, 90); shade(c); c.restore(); bodyPath(c); stroke(c);
  },
  soviet(c, s) {
    const w = s.general ? 214 : BW; const olive = s.olive || '#66703f';
    rrect(c, BX - w / 2, BT, w, BB - BT, w / 2); c.fillStyle = olive; c.fill();
    c.save(); rrect(c, BX - w / 2, BT, w, BB - BT, w / 2); c.clip();
    c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(BX - 3, BT + 40, 6, 260);
    for (let i = 0; i < 4; i++) dot(c, BX, BT + 70 + i * 52, 7, '#d8b44a');
    for (const sd of [-1, 1]) { rrect(c, BX + sd * 50 - 28, BT + 70, 56, 46, 6); fillStroke(c, olive, 5); rrect(c, BX + sd * 50 - 30, BT + 64, 60, 16, 4); fillStroke(c, olive, 5); rrect(c, BX + sd * 54 - 30, BT + 190, 60, 50, 6); fillStroke(c, olive, 5); }
    const ribbons = ['#c83a2a', '#e8c24a', '#3a6ab0', '#2a8a4a', '#e8e8e8', '#8a2a6a'];
    const rows = s.general ? 4 : 2;
    for (let r = 0; r < rows; r++) for (let k = 0; k < 3; k++) { c.fillStyle = ribbons[(r * 3 + k) % 6]; c.fillRect(BX - 92 + k * 22, BT + 40 - r * 14 + (s.general ? 30 : 0), 20, 12); }
    if (s.general) for (let k = 0; k < 4; k++) { c.fillStyle = '#f0c24a'; c.beginPath(); for (let j = 0; j < 10; j++) { const a = j * Math.PI / 5 - Math.PI / 2, rr = j % 2 ? 7 : 16; c.lineTo(BX + 50 + (k % 2) * 34 + Math.cos(a) * rr, BT + 150 + Math.floor(k / 2) * 40 + Math.sin(a) * rr); } c.fill(); }
    c.fillStyle = '#6a3a1a'; c.fillRect(BX - w / 2, BB - 116, w, 22); rrect(c, BX - 20, BB - 120, 40, 30, 4); fillStroke(c, '#d8b44a', 5);
    shade(c, w); c.restore();
    rrect(c, BX - w / 2, BT, w, BB - BT, w / 2); stroke(c);
    // collar + shoulder boards
    c.beginPath(); c.moveTo(BX - 50, BT + 4); c.lineTo(BX, BT + 40); c.lineTo(BX + 50, BT + 4); stroke(c, 7);
    for (const sd of [-1, 1]) { rrect(c, BX + sd * 22 - 12, BT + 8, 24, 16, 3); fillStroke(c, '#b8262b', 4);
      c.save(); c.translate(BX + sd * 76, BT + 34); c.rotate(sd * 0.35); rrect(c, -34, -12, 68, 24, 6); fillStroke(c, s.general ? '#e8c24a' : '#b8262b', 6); if (!s.general) { line(c, [[-30, 0], [30, 0]], 4, '#e8c24a'); dot(c, -8, 0, 5, '#f0d060'); dot(c, 10, 0, 5, '#f0d060'); } else { for (let k = 0; k < 3; k++) dot(c, -16 + k * 16, 0, 6, '#b8262b'); } c.restore(); }
  },
  navyofficer(c, s) {
    bodyPath(c); c.fillStyle = '#1c2030'; c.fill();
    c.save(); bodyPath(c); c.clip();
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(BX - 40, BT); c.lineTo(BX, BT + 70); c.lineTo(BX + 40, BT); c.fill();
    c.save(); c.beginPath(); c.moveTo(BX - 40, BT); c.lineTo(BX, BT + 70); c.lineTo(BX + 40, BT); c.clip(); for (let y = BT; y < BT + 80; y += 14) { c.fillStyle = '#1a3a8a'; c.fillRect(BX - 50, y, 100, 7); } c.restore();
    line(c, [[BX - 40, BT + 2], [BX, BT + 70], [BX + 40, BT + 2]], 6);
    for (let i = 0; i < 4; i++) { dot(c, BX - 30, BT + 110 + i * 40, 7, '#e8c24a'); dot(c, BX + 30, BT + 110 + i * 40, 7, '#e8c24a'); }
    for (let k = 0; k < 3; k++) { c.fillStyle = ['#c83a2a', '#e8c24a', '#3a6ab0'][k]; c.fillRect(BX - 92 + k * 20, BT + 90, 18, 10); }
    if (s.wetShirt) { c.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(BX - 50 + i * 26, BT + 130 + (i % 2) * 40, 18, 30, 0, 0, 7); c.fill(); } }
    shade(c); c.restore(); bodyPath(c); stroke(c);
    for (const sd of [-1, 1]) { c.save(); c.translate(BX + sd * 76, BT + 34); c.rotate(sd * 0.35); rrect(c, -34, -12, 68, 24, 6); fillStroke(c, '#1a1a22', 6); line(c, [[-30, -4], [30, -4]], 4, '#e8c24a'); line(c, [[-30, 4], [30, 4]], 4, '#e8c24a'); dot(c, 0, 0, 6, '#f0d060'); c.restore(); }
  },
  sailor(c, s) {
    bodyPath(c); c.fillStyle = '#ffffff'; c.fill();
    c.save(); bodyPath(c); c.clip();
    for (let y = BT; y < BB; y += 22) { c.fillStyle = '#1a3a8a'; c.fillRect(BX - 100, y, 200, 11); }
    if (s.vein) { c.save(); c.translate(x + 74, y - 74); for (const a of [0, 1, 2, 3]) { c.save(); c.rotate(a * Math.PI / 2); c.beginPath(); c.moveTo(6, 6); c.quadraticCurveTo(10, 24, 26, 22); stroke(c, 13); c.beginPath(); c.moveTo(6, 6); c.quadraticCurveTo(10, 24, 26, 22); c.lineWidth = 6; c.strokeStyle = '#e8202a'; c.stroke(); c.restore(); } c.restore(); }
  if (s.cheeks) { c.fillStyle = 'rgba(250,110,120,0.5)'; c.beginPath(); c.ellipse(L[0] - 22, L[1] + 42, 26, 15, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(R[0] + 22, R[1] + 42, 26, 15, 0, 0, 7); c.fill(); }
  if (s.sweat) { c.fillStyle = 'rgba(0,0,0,0.18)'; c.beginPath(); c.ellipse(BX, BT + 120, 60, 80, 0, 0, 7); c.fill(); }
    c.fillStyle = '#1c2030'; c.fillRect(BX - 100, BB - 90, 200, 100); line(c, [[BX - 100, BB - 90], [BX + 100, BB - 90]], 5);
    c.fillStyle = '#3a2a1a'; c.fillRect(BX - 100, BB - 100, 200, 14); rrect(c, BX - 16, BB - 104, 32, 22, 3); fillStroke(c, '#e8c24a', 4);
    shade(c); c.restore(); bodyPath(c); stroke(c);
  },
  ussailor(c, s) {
    bodyPath(c); c.fillStyle = '#f4f6f8'; c.fill(); c.save(); bodyPath(c); c.clip();
    c.fillStyle = '#1c2a5a'; c.beginPath(); c.moveTo(BX - 70, BT); c.lineTo(BX, BT + 80); c.lineTo(BX + 70, BT); c.fill();
    line(c, [[BX - 60, BT + 4], [BX, BT + 70], [BX + 60, BT + 4]], 4, '#ffffff');
    c.fillStyle = '#1c1c22'; c.beginPath(); c.moveTo(BX - 20, BT + 70); c.lineTo(BX + 20, BT + 70); c.lineTo(BX, BT + 110); c.fill();
    shade(c); c.restore(); bodyPath(c); stroke(c);
  },
  shipwright(c, s) {
    bodyPath(c); c.fillStyle = '#f4efe2'; c.fill(); c.save(); bodyPath(c); c.clip();
    for (let y = BT + 40; y < BB; y += 36) line(c, [[BX - 100, y], [BX + 100, y + 6]], 3, 'rgba(0,0,0,0.08)');
    c.fillStyle = '#8a5a2a'; c.beginPath(); c.moveTo(BX - 70, BT + 90); c.lineTo(BX + 70, BT + 90); c.lineTo(BX + 80, BB + 10); c.lineTo(BX - 80, BB + 10); c.fill();
    line(c, [[BX - 70, BT + 90], [BX + 70, BT + 90]], 5); line(c, [[BX - 70, BT + 92], [BX - 96, BT + 10]], 7, '#6a4020'); line(c, [[BX + 70, BT + 92], [BX + 96, BT + 10]], 7, '#6a4020');
    rrect(c, BX - 40, BT + 180, 80, 50, 6); fillStroke(c, '#7a4a22', 5); c.fillStyle = '#5a3a1a'; c.fillRect(BX - 100, BB - 120, 200, 14);
    shade(c); c.restore(); bodyPath(c); stroke(c);
    c.beginPath(); c.moveTo(BX - 50, BT + 6); c.lineTo(BX + 50, BT + 6); c.lineTo(BX + 20, BT + 50); c.lineTo(BX - 20, BT + 50); c.closePath(); fillStroke(c, '#c83a2a', 6);
  },
  tar(c, s) {
    bodyPath(c); c.fillStyle = '#ffffff'; c.fill(); c.save(); bodyPath(c); c.clip();
    for (let y = BT; y < BB; y += 26) { c.fillStyle = s.stripe || '#c83a2a'; c.fillRect(BX - 100, y, 200, 12); }
    c.fillStyle = '#e8dcc0'; c.fillRect(BX - 100, BB - 90, 200, 100); line(c, [[BX - 100, BB - 90], [BX + 100, BB - 90]], 5);
    c.fillStyle = '#3a2a1a'; c.fillRect(BX - 100, BB - 100, 200, 14);
    shade(c); c.restore(); bodyPath(c); stroke(c);
    c.beginPath(); c.moveTo(BX - 46, BT + 4); c.lineTo(BX + 46, BT + 4); c.lineTo(BX, BT + 56); c.closePath(); fillStroke(c, s.kerchief || '#1a3a8a', 6);
  },
  rncaptain(c, s) {
    c.beginPath(); c.moveTo(BX - 84, BB - 110); c.lineTo(BX - 108, BB + 70); c.lineTo(BX + 108, BB + 70); c.lineTo(BX + 84, BB - 110); c.closePath(); fillStroke(c, '#1c2a5a', 9);
    bodyPath(c); c.fillStyle = '#1c2a5a'; c.fill(); c.save(); bodyPath(c); c.clip();
    c.fillStyle = '#f4f0e6'; c.fillRect(BX - 46, BT, 92, 300);
    c.fillStyle = '#f8f8f8'; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(BX + sd * 46, BT); c.lineTo(BX + sd * 80, BT + 20); c.lineTo(BX + sd * 66, BT + 200); c.lineTo(BX + sd * 46, BT + 200); c.fill(); }
    for (let i = 0; i < 5; i++) { dot(c, BX + 58, BT + 30 + i * 36, 6, '#e8c24a'); dot(c, BX - 58, BT + 30 + i * 36, 6, '#e8c24a'); }
    shade(c); c.restore(); bodyPath(c); stroke(c);
    for (let i = 0; i < 4; i++) circ(c, BX, BT + 16 + i * 8, 10, '#ffffff', 3);
    for (const sd of [-1, 1]) { c.save(); c.translate(BX + sd * 80, BT + 30); rrect(c, -30, -12, 60, 24, 8); fillStroke(c, '#e8c24a', 5); for (let k = 0; k < 6; k++) line(c, [[-26 + k * 10, 12], [-26 + k * 10, 40]], 4, '#e8c24a'); c.restore(); }
  },
  tailor(c, s) {
    bodyPath(c); c.fillStyle = '#f6f2e8'; c.fill(); c.save(); bodyPath(c); c.clip();
    c.fillStyle = '#7a4a2a'; c.beginPath(); c.moveTo(BX - 100, BT + 40); c.lineTo(BX - 30, BT + 40); c.lineTo(BX, BT + 150); c.lineTo(BX + 30, BT + 40); c.lineTo(BX + 100, BT + 40); c.lineTo(BX + 100, BB); c.lineTo(BX - 100, BB); c.fill();
    for (let i = 0; i < 4; i++) dot(c, BX, BT + 170 + i * 30, 6, '#e8c24a');
    rrect(c, BX + 36, BT + 150, 36, 26, 4); fillStroke(c, '#6a3a1a', 4); line(c, [[BX + 54, BT + 150], [BX + 20, BT + 190]], 3, '#e8c24a');
    c.fillStyle = '#3a4a6a'; c.fillRect(BX - 100, BB - 70, 200, 80);
    shade(c); c.restore(); bodyPath(c); stroke(c);
    // tape measure around the neck
    line(c, [[BX - 40, BT + 4], [BX - 50, BT + 200]], 14, '#e8d23a'); line(c, [[BX + 40, BT + 4], [BX + 50, BT + 200]], 14, '#e8d23a');
    for (let k = 0; k < 9; k++) { line(c, [[BX - 46, BT + 20 + k * 20], [BX - 38, BT + 20 + k * 20]], 3); line(c, [[BX + 46, BT + 20 + k * 20], [BX + 38, BT + 20 + k * 20]], 3); }
    c.beginPath(); c.moveTo(BX - 30, BT + 4); c.lineTo(BX + 30, BT + 4); c.lineTo(BX, BT + 34); c.closePath(); fillStroke(c, '#1a1a1a', 5);
  },
  miner(c, s) {
    bodyPath(c); c.fillStyle = '#b8302a'; c.fill(); c.save(); bodyPath(c); c.clip();
    for (let x = BX - 100; x < BX + 100; x += 30) { c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(x, BT, 10, 300); }
    for (let y = BT; y < BB; y += 30) { c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(BX - 100, y, 200, 10); }
    c.fillStyle = s.pants || '#3a5a8a'; c.fillRect(BX - 100, BB - 110, 200, 120);
    if (s.ripped) { c.fillStyle = '#2a1a10'; c.beginPath(); c.moveTo(BX + 20, BB - 90); c.lineTo(BX + 70, BB - 96); c.lineTo(BX + 60, BB - 40); c.lineTo(BX + 44, BB - 60); c.lineTo(BX + 30, BB - 30); c.closePath(); c.fill(); }
    if (s.rivets) for (const [px, py] of [[BX - 70, BB - 96], [BX - 20, BB - 96], [BX + 20, BB - 96], [BX + 70, BB - 96]]) { circ(c, px, py, 7, '#d88a3a', 3); }
    c.fillStyle = 'rgba(90,60,30,0.3)'; for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(BX - 70 + i * 20, BT + 60 + (i * 37) % 160, 8, 0, 7); c.fill(); }
    shade(c); c.restore(); bodyPath(c); stroke(c);
    line(c, [[BX - 46, BT + 6], [BX - 52, BB - 108]], 12, '#4a2a1a'); line(c, [[BX + 46, BT + 6], [BX + 52, BB - 108]], 12, '#4a2a1a');
  },
  cowboy(c, s) {
    bodyPath(c); c.fillStyle = s.shirt || '#d8c8a0'; c.fill(); c.save(); bodyPath(c); c.clip();
    c.fillStyle = s.vestCol || '#6a3a1a'; c.fillRect(BX - 100, BT + 20, 66, 300); c.fillRect(BX + 34, BT + 20, 66, 300);
    for (let i = 0; i < 6; i++) { dot(c, BX - 60, BT + 70 + i * 26, 3, '#e8d8b0'); dot(c, BX + 60, BT + 70 + i * 26, 3, '#e8d8b0'); }
    c.fillStyle = '#3a2a1a'; c.fillRect(BX - 100, BB - 112, 200, 18); rrect(c, BX - 22, BB - 118, 44, 30, 6); fillStroke(c, '#c8c8c8', 4);
    c.fillStyle = s.pants || '#6a4a2a'; c.fillRect(BX - 100, BB - 94, 200, 110);
    shade(c); c.restore(); bodyPath(c); stroke(c);
    c.beginPath(); c.moveTo(BX - 50, BT + 2); c.lineTo(BX + 50, BT + 2); c.lineTo(BX + 10, BT + 66); c.lineTo(BX - 10, BT + 66); c.closePath(); fillStroke(c, s.bandana || '#c83a2a', 6);
    for (let i = 0; i < 5; i++) dot(c, BX - 30 + i * 15, BT + 18 + (i % 2) * 14, 4, '#ffffff');
    for (const sd of [-1, 1]) { c.fillStyle = '#8a5a2a'; c.beginPath(); c.moveTo(BX + sd * 20, BB - 10); c.lineTo(BX + sd * 96, BB - 10); c.lineTo(BX + sd * 70, BB + 70); c.lineTo(BX + sd * 30, BB + 70); c.closePath(); fillStroke(c, '#8a5a2a', 6); for (let k = 0; k < 5; k++) line(c, [[BX + sd * (80 - k * 2), BB + k * 14], [BX + sd * 100, BB + k * 14 + 4]], 4, '#6a3a1a'); }
  },
  longjohns(c, s) {
    bodyPath(c); c.fillStyle = '#d83a3a'; c.fill(); c.save(); bodyPath(c); c.clip();
    for (let i = 0; i < 5; i++) dot(c, BX, BT + 40 + i * 34, 7, '#f4f4f4');
    rrect(c, BX - 60, BB - 70, 120, 60, 10); fillStroke(c, '#c83030', 5);
    shade(c); c.restore(); bodyPath(c); stroke(c);
  },
  king(c, s) {
    c.beginPath(); c.moveTo(BX - 96, BT + 30); c.quadraticCurveTo(BX - 150, BB, BX - 140, FEET - 8); c.lineTo(BX + 140, FEET - 8); c.quadraticCurveTo(BX + 150, BB, BX + 96, BT + 30); c.closePath(); fillStroke(c, s.robe || '#b8202a', 9);
    c.save(); c.clip(); c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(BX + 40, BT, 120, 500); c.restore();
    c.beginPath(); c.moveTo(BX - 140, FEET - 8); c.lineTo(BX + 140, FEET - 8); c.lineTo(BX + 144, FEET - 40); c.lineTo(BX - 144, FEET - 40); c.closePath(); fillStroke(c, '#f8f4ec', 6);
    for (let i = -120; i <= 120; i += 40) line(c, [[BX + i, FEET - 32], [BX + i, FEET - 18]], 6);
    const w = 214; rrect(c, BX - w / 2, BT, w, BB - BT, w / 2); c.fillStyle = '#e8c24a'; c.fill();
    c.save(); rrect(c, BX - w / 2, BT, w, BB - BT, w / 2); c.clip();
    c.fillStyle = s.robe || '#b8202a'; c.fillRect(BX - 110, BT, 60, 300); c.fillRect(BX + 50, BT, 60, 300);
    c.fillStyle = '#7a1a5a'; c.fillRect(BX - 50, BT + 40, 100, 260); for (let i = 0; i < 5; i++) dot(c, BX, BT + 90 + i * 40, 7, '#f2c23a');
    c.fillStyle = '#6a3a1a'; c.fillRect(BX - 110, BB - 100, 220, 22); rrect(c, BX - 22, BB - 104, 44, 30, 6); fillStroke(c, '#f2c23a', 5);
    shade(c, w); c.restore(); rrect(c, BX - w / 2, BT, w, BB - BT, w / 2); stroke(c);
    // ermine collar
    c.beginPath(); c.ellipse(BX, BT + 22, 120, 44, 0, 0, Math.PI * 2); fillStroke(c, '#f8f4ec', 8);
    for (let i = 0; i < 9; i++) line(c, [[BX - 96 + i * 24, BT + 10 + (i % 2) * 18], [BX - 96 + i * 24, BT + 26 + (i % 2) * 18]], 6);
    // chain
    c.beginPath(); c.arc(BX, BT + 40, 70, 0.2 * Math.PI, 0.8 * Math.PI); c.lineWidth = 9; c.strokeStyle = '#f2c23a'; c.stroke(); circ(c, BX, BT + 112, 18, '#f2c23a', 6);
  },
  ratcatcher(c, s) {
    bodyPath(c); c.fillStyle = s.tunic || '#6a7a3a'; c.fill(); c.save(); bodyPath(c); c.clip();
    c.fillStyle = 'rgba(0,0,0,0.14)'; for (let y = BT; y < BB; y += 34) c.fillRect(BX - 100, y, 200, 6);
    rrect(c, BX - 66, BT + 90, 46, 40, 4); fillStroke(c, '#9a6a3a', 4); line(c, [[BX - 60, BT + 96], [BX - 26, BT + 124]], 3);
    rrect(c, BX + 24, BT + 170, 50, 44, 4); fillStroke(c, '#5a4a7a', 4);
    c.fillStyle = '#5a3a1a'; c.fillRect(BX - 100, BB - 110, 200, 22); rrect(c, BX - 18, BB - 114, 36, 30, 4); fillStroke(c, '#b8b8b8', 4);
    c.fillStyle = '#4a3a2a'; c.fillRect(BX - 100, BB - 88, 200, 100);
    shade(c); c.restore(); bodyPath(c); stroke(c);
    // rope over the shoulder
    line(c, [[BX - 70, BT + 20], [BX + 80, BB - 120]], 12, '#c8a46a'); for (let k = 0; k < 8; k++) line(c, [[BX - 60 + k * 18, BT + 34 + k * 20], [BX - 50 + k * 18, BT + 26 + k * 20]], 3, '#8a6a32');
    // dangling tails on the belt
    if (s.tails !== false) for (let k = 0; k < 4; k++) ratTail(c, BX - 70 + k * 18, BB - 96, 0.2 - k * 0.1, 90);
    rrect(c, BX + 40, BB - 100, 54, 60, 10); fillStroke(c, '#7a4a22', 6);
  },
  herald(c, s) {
    bodyPath(c); c.fillStyle = '#e8d8b0'; c.fill(); c.save(); bodyPath(c); c.clip();
    c.fillStyle = '#c8302a'; c.fillRect(BX - 100, BT, 100, 150); c.fillRect(BX, BT + 150, 100, 200);
    c.fillStyle = '#f2c23a'; c.fillRect(BX, BT, 100, 150); c.fillRect(BX - 100, BT + 150, 100, 200);
    line(c, [[BX, BT], [BX, BB]], 5); line(c, [[BX - 100, BT + 150], [BX + 100, BT + 150]], 5);
    c.fillStyle = '#4a3a6a'; c.fillRect(BX - 100, BB - 70, 200, 80);
    shade(c); c.restore(); bodyPath(c); stroke(c);
    c.beginPath(); c.moveTo(BX - 40, BT + 4); c.lineTo(BX + 40, BT + 4); c.lineTo(BX, BT + 44); c.closePath(); fillStroke(c, '#f8f4ec', 6);
  },
  treasurer(c, s) {
    c.beginPath(); c.moveTo(BX - 80, BT + 120); c.lineTo(BX - 120, FEET - 8); c.lineTo(BX + 120, FEET - 8); c.lineTo(BX + 80, BT + 120); c.closePath(); fillStroke(c, s.robe || '#3a2a6a', 9);
    line(c, [[BX - 118, FEET - 20], [BX + 118, FEET - 20]], 8, '#e8c24a');
    bodyPath(c); c.fillStyle = s.robe || '#3a2a6a'; c.fill(); c.save(); bodyPath(c); c.clip();
    line(c, [[BX - 40, BT], [BX - 40, BB]], 8, '#e8c24a'); line(c, [[BX + 40, BT], [BX + 40, BB]], 8, '#e8c24a');
    c.fillStyle = '#5a3a1a'; c.fillRect(BX - 100, BB - 120, 200, 20);
    shade(c); c.restore(); bodyPath(c); stroke(c);
    // keys + empty purse
    c.beginPath(); c.arc(BX - 54, BB - 80, 16, 0, 7); stroke(c, 6); for (let k = 0; k < 3; k++) { line(c, [[BX - 60 + k * 8, BB - 66], [BX - 64 + k * 10, BB - 20]], 6, '#c8a24a'); }
    c.beginPath(); c.ellipse(BX + 56, BB - 60, 30, 40, 0, 0, 7); fillStroke(c, '#8a5a2a', 6); line(c, [[BX + 40, BB - 96], [BX + 72, BB - 96]], 6);
  },
  salaryman(c, s) {
    const suit = s.suit || '#23304a';
    bodyPath(c); c.fillStyle = suit; c.fill(); c.save(); bodyPath(c); c.clip();
    c.fillStyle = s.shirt || '#ffffff'; c.beginPath(); c.moveTo(BX - 44, BT); c.lineTo(BX, BT + 130); c.lineTo(BX + 44, BT); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.12)'; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(BX + sd * 44, BT); c.lineTo(BX + sd * 70, BT + 70); c.lineTo(BX + sd * 12, BT + 140); c.fill(); }
    line(c, [[BX - 44, BT], [BX, BT + 130], [BX + 44, BT]], 6);
    for (let i = 0; i < 2; i++) dot(c, BX + 6, BT + 160 + i * 40, 6, '#111');
    rrect(c, BX + 40, BT + 40, 34, 10, 3); c.fillStyle = '#ffffff'; c.fill();
    if (s.wrinkled) { for (let i = 0; i < 6; i++) line(c, [[BX - 80 + i * 30, BT + 150 + (i % 2) * 40], [BX - 60 + i * 30, BT + 190 + (i % 2) * 30]], 3, 'rgba(0,0,0,0.35)'); }
    c.fillStyle = s.pants || suit; c.fillRect(BX - 100, BB - 70, 200, 80);
    shade(c); c.restore(); bodyPath(c); stroke(c);
    c.beginPath(); c.moveTo(BX - 12, BT + 6); c.lineTo(BX + 12, BT + 6); c.lineTo(BX + 8, BT + 24); c.lineTo(BX + 16, BT + 110); c.lineTo(BX, BT + 128); c.lineTo(BX - 16, BT + 110); c.lineTo(BX - 8, BT + 24); c.closePath(); fillStroke(c, s.tie || '#c8202a', 5);
    if (s.tieStripe !== false) for (let i = 0; i < 3; i++) line(c, [[BX - 10, BT + 50 + i * 22], [BX + 10, BT + 40 + i * 22]], 3, 'rgba(255,255,255,0.5)');
  },
  pusher(c, s) {
    bodyPath(c); c.fillStyle = '#1e2a5a'; c.fill(); c.save(); bodyPath(c); c.clip();
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(BX - 36, BT); c.lineTo(BX, BT + 60); c.lineTo(BX + 36, BT); c.fill();
    line(c, [[BX - 36, BT], [BX, BT + 60], [BX + 36, BT]], 6);
    for (let i = 0; i < 4; i++) dot(c, BX, BT + 90 + i * 40, 7, '#f2c23a');
    rrect(c, BX - 84, BT + 70, 60, 34, 4); fillStroke(c, '#f2d23a', 5); c.fillStyle = '#c8202a'; c.font = '900 20px sans-serif'; c.textAlign = 'center'; c.fillText('駅', BX - 54, BT + 95);
    c.fillStyle = '#141a3a'; c.fillRect(BX - 100, BB - 110, 200, 16); rrect(c, BX - 16, BB - 114, 32, 24, 4); fillStroke(c, '#f2c23a', 4);
    c.fillStyle = '#1a2450'; c.fillRect(BX - 100, BB - 94, 200, 110);
    shade(c); c.restore(); bodyPath(c); stroke(c);
    c.beginPath(); c.moveTo(BX - 12, BT + 6); c.lineTo(BX + 12, BT + 6); c.lineTo(BX + 6, BT + 56); c.lineTo(BX - 6, BT + 56); c.closePath(); fillStroke(c, '#2a3a8a', 4);
  },
  schoolgirl(c, s) {
    c.beginPath(); c.moveTo(BX - 92, BB - 110); c.lineTo(BX - 118, BB + 40); c.lineTo(BX + 118, BB + 40); c.lineTo(BX + 92, BB - 110); c.closePath(); fillStroke(c, '#1e2a5a', 9);
    for (let i = -3; i <= 3; i++) line(c, [[BX + i * 24, BB - 100], [BX + i * 34, BB + 36]], 4, 'rgba(255,255,255,0.18)');
    bodyPath(c); c.fillStyle = '#f8f8f4'; c.fill(); c.save(); bodyPath(c); c.clip();
    c.fillStyle = '#1e2a5a'; c.beginPath(); c.moveTo(BX - 100, BT); c.lineTo(BX - 100, BT + 80); c.lineTo(BX, BT + 130); c.lineTo(BX + 100, BT + 80); c.lineTo(BX + 100, BT); c.fill();
    line(c, [[BX - 90, BT + 70], [BX, BT + 118], [BX + 90, BT + 70]], 4, '#ffffff');
    c.fillStyle = '#1e2a5a'; c.fillRect(BX - 100, BB - 110, 200, 120);
    shade(c); c.restore(); bodyPath(c); stroke(c);
    c.beginPath(); c.moveTo(BX - 30, BT + 120); c.lineTo(BX + 30, BT + 120); c.lineTo(BX + 44, BT + 190); c.lineTo(BX, BT + 150); c.lineTo(BX - 44, BT + 190); c.closePath(); fillStroke(c, '#d8202a', 6);
  },
  gakuran(c, s) {
    bodyPath(c); c.fillStyle = '#16161c'; c.fill(); c.save(); bodyPath(c); c.clip();
    for (let i = 0; i < 5; i++) dot(c, BX, BT + 40 + i * 44, 8, '#e8c24a');
    c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(BX - 100, BT, 40, 300);
    shade(c); c.restore(); bodyPath(c); stroke(c);
    rrect(c, BX - 60, BT - 6, 120, 30, 10); fillStroke(c, '#16161c', 6);
  },
  officelady(c, s) {
    c.beginPath(); c.moveTo(BX - 86, BB - 110); c.lineTo(BX - 96, BB + 60); c.lineTo(BX + 96, BB + 60); c.lineTo(BX + 86, BB - 110); c.closePath(); fillStroke(c, s.skirt || '#5a5a6a', 9);
    bodyPath(c); c.fillStyle = s.blouse || '#f6c8d0'; c.fill(); c.save(); bodyPath(c); c.clip();
    c.fillStyle = s.jacket || '#5a5a6a'; c.fillRect(BX - 100, BT, 56, 300); c.fillRect(BX + 44, BT, 56, 300);
    c.fillStyle = s.skirt || '#5a5a6a'; c.fillRect(BX - 100, BB - 110, 200, 120);
    shade(c); c.restore(); bodyPath(c); stroke(c);
    for (let i = 0; i < 3; i++) dot(c, BX, BT + 40 + i * 40, 5, '#ffffff');
  },
  longcoat(c, s) {
    const col = s.coat || '#2a2a3a';
    c.beginPath(); c.moveTo(BX - 84, BT + 120); c.lineTo(BX - 112, FEET - 30); c.lineTo(BX + 112, FEET - 30); c.lineTo(BX + 84, BT + 120); c.closePath(); fillStroke(c, col, 9);
    line(c, [[BX, BT + 200], [BX, FEET - 34]], 5, 'rgba(0,0,0,0.35)');
    bodyPath(c); c.fillStyle = col; c.fill(); c.save(); bodyPath(c); c.clip();
    for (let i = 0; i < 5; i++) dot(c, BX + 16, BT + 70 + i * 44, 7, '#8a7a5a');
    c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(BX - 100, BT, 40, 300);
    shade(c); c.restore(); bodyPath(c); stroke(c);
    // knitted scarf
    c.beginPath(); c.ellipse(BX, BT + 14, 78, 30, 0, 0, Math.PI * 2); fillStroke(c, s.scarf || '#c8302a', 8);
    rrect(c, BX + 20, BT + 20, 34, 120, 10); fillStroke(c, s.scarf || '#c8302a', 7); for (let k = 0; k < 4; k++) line(c, [[BX + 24, BT + 40 + k * 26], [BX + 50, BT + 40 + k * 26]], 3, 'rgba(255,255,255,0.5)');
    rrect(c, BX - 70, BB - 70, 44, 50, 6); fillStroke(c, 'rgba(0,0,0,0.25)', 4);
  },
  nightgown(c, s) {
    const col = s.gown || '#f4ecdc';
    c.beginPath(); c.moveTo(BX - 84, BT + 160); c.lineTo(BX - 104, FEET - 20); c.lineTo(BX + 104, FEET - 20); c.lineTo(BX + 84, BT + 160); c.closePath(); fillStroke(c, col, 9);
    bodyPath(c); c.fillStyle = col; c.fill(); c.save(); bodyPath(c); c.clip();
    for (let x = BX - 100; x < BX + 100; x += 24) line(c, [[x, BT], [x, BB]], 6, s.stripe || 'rgba(90,120,200,0.35)');
    shade(c); c.restore(); bodyPath(c); stroke(c);
    for (let i = 0; i < 3; i++) dot(c, BX, BT + 40 + i * 30, 6, '#ffffff');
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
    if (s.hair === 'long' || s.hair === 'bun') {
      const col = s.hairColor || '#6a3a1a';
      if (s.hair === 'long') { c.beginPath(); c.moveTo(x - r - 14, y - 10); c.quadraticCurveTo(x - r - 30, y + 150, x - r + 10, y + 190); c.lineTo(x + r - 10, y + 190); c.quadraticCurveTo(x + r + 30, y + 150, x + r + 14, y - 10); c.arc(x, y - 10, r + 14, 0, Math.PI, true); c.closePath(); fillStroke(c, col, 9); }
      else circ(c, x, y - r - 30, 46, col, 9);
    }
    if (h === 'hood') { const col = s.hatColor || '#5a7a3a'; c.beginPath(); c.moveTo(x - r - 30, y + 110); c.quadraticCurveTo(x - r - 50, y - r - 20, x + 10, y - r - 34); c.quadraticCurveTo(x + r + 70, y - r - 40, x + r + 110, y - r + 20); c.quadraticCurveTo(x + r + 30, y - 40, x + r + 30, y + 110); c.closePath(); fillStroke(c, col, 10); c.save(); c.clip(); c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(x + 40, y - r - 60, 300, 400); c.restore(); }
    if (h === 'bonnet') { c.beginPath(); c.arc(x, y - 4, r + 40, Math.PI * 0.85, Math.PI * 2.15); c.closePath(); fillStroke(c, s.hatColor || '#f2e2b8', 10); }
    if (h === 'nursecap') { c.beginPath(); c.moveTo(x - r - 20, y - 40); c.lineTo(x - r + 6, y + 120); c.lineTo(x + r - 6, y + 120); c.lineTo(x + r + 20, y - 40); c.closePath(); fillStroke(c, '#ffffff', 9); }
    return;
  }
  if (s.hair === 'curly') {
    const col = s.hairColor || '#3a2616';
    c.save(); c.beginPath(); c.arc(x, y, r + 30, 0, Math.PI * 2); c.clip();
    for (let i = 0; i <= 10; i++) { const a = Math.PI * (1.02 + i * 0.096); circ(c, x + Math.cos(a) * (r - 6), y + Math.sin(a) * (r - 6) + 4, 30, col, 8); }
    c.restore();
    c.beginPath(); c.moveTo(x - r + 8, y - 30); c.quadraticCurveTo(x, y - 96, x + r - 8, y - 30); c.lineTo(x + r - 2, y - 60); c.quadraticCurveTo(x, y - r - 20, x - r + 2, y - 60); c.closePath(); c.fillStyle = col; c.fill();
    for (const sd of [-1, 1]) { rrect(c, x + sd * (r - 22) - 14, y - 40, 28, 70, 12); fillStroke(c, col, 7); }
  } else if (s.hair === 'wig') {
    for (const sd of [-1, 1]) for (let k = 0; k < 2; k++) { c.beginPath(); c.ellipse(x + sd * (r - 10), y - 20 + k * 44, 30, 22, 0, 0, Math.PI * 2); fillStroke(c, '#f2f0ea', 7); }
    c.beginPath(); c.arc(x, y - 10, r + 4, Math.PI * 1.08, Math.PI * 1.92); c.lineWidth = 34; c.strokeStyle = INK; c.stroke(); c.lineWidth = 22; c.strokeStyle = '#f2f0ea'; c.stroke();
  } else if (s.hair === 'beard') {
    const col = s.hairColor || '#5a3a1a';
    c.beginPath(); c.moveTo(x - r + 8, y + 10); c.quadraticCurveTo(x - r + 10, y + r + 30, x, y + r + 40); c.quadraticCurveTo(x + r - 10, y + r + 30, x + r - 8, y + 10); c.quadraticCurveTo(x + 40, y + 90, x, y + 92); c.quadraticCurveTo(x - 40, y + 90, x - r + 8, y + 10); fillStroke(c, col, 8);
  } else if (s.hair === 'receding') {
    const col = s.hairColor || '#4a2e1a';
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(x + sd * (r - 2), y - 70); c.quadraticCurveTo(x + sd * (r + 16), y - 10, x + sd * (r - 8), y + 60); c.lineTo(x + sd * (r - 36), y + 50); c.quadraticCurveTo(x + sd * (r - 26), y - 20, x + sd * (r - 40), y - 66); c.closePath(); fillStroke(c, col, 7); }
    c.beginPath(); c.moveTo(x - 30, y - r + 6); c.quadraticCurveTo(x, y - r - 8, x + 30, y - r + 6); stroke(c, 6);
  } else if (s.hair === 'muttonchops') {
    const col = s.hairColor || '#b8b8c0';
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(x + sd * (r - 4), y - 60); c.quadraticCurveTo(x + sd * (r + 24), y + 40, x + sd * (r - 30), y + 110); c.quadraticCurveTo(x + sd * (r - 70), y + 90, x + sd * (r - 54), y + 20); c.quadraticCurveTo(x + sd * (r - 40), y - 30, x + sd * (r - 40), y - 60); c.closePath(); fillStroke(c, col, 7); }
  } else if (s.hair === 'long' || s.hair === 'bun') {
    const col = s.hairColor || '#6a3a1a';
    c.beginPath(); c.moveTo(x - r + 4, y - 20); c.quadraticCurveTo(x - r + 6, y - r - 18, x, y - r - 10); c.quadraticCurveTo(x + r - 6, y - r - 18, x + r - 4, y - 20); c.quadraticCurveTo(x + 50, y - 90, x + 4, y - 96); c.quadraticCurveTo(x - 50, y - 90, x - r + 4, y - 20); fillStroke(c, col, 8);
    line(c, [[x + 2, y - r - 8], [x + 4, y - 94]], 4);
  } else if (s.hair === 'bob') {
    const col = s.hairColor || '#1a1418';
    c.beginPath(); c.moveTo(x - r - 14, y + 70); c.quadraticCurveTo(x - r - 24, y - r - 20, x, y - r - 14); c.quadraticCurveTo(x + r + 24, y - r - 20, x + r + 14, y + 70); c.lineTo(x + r - 30, y + 70); c.quadraticCurveTo(x + r - 20, y - 40, x + 30, y - 60); c.quadraticCurveTo(x - 40, y - 54, x - r + 30, y - 10); c.lineTo(x - r + 30, y + 70); c.closePath(); fillStroke(c, col, 9);
    c.fillStyle = 'rgba(255,255,255,0.22)'; c.beginPath(); c.ellipse(x - 50, y - r + 10, 30, 10, -0.4, 0, 7); c.fill();
  } else if (s.hair === 'parted' || s.hair === 'spiky') {
    const col = s.hairColor || '#1a1418';
    c.beginPath(); c.moveTo(x - r + 2, y - 10); c.quadraticCurveTo(x - r - 4, y - r - 26, x - 10, y - r - 18);
    if (s.hair === 'spiky') { for (let k = 0; k < 6; k++) { c.lineTo(x - 10 + k * 22, y - r - 44 + (k % 2) * 20); } c.lineTo(x + r - 4, y - r + 10); }
    else c.quadraticCurveTo(x + r + 10, y - r - 20, x + r - 2, y - 20);
    c.quadraticCurveTo(x + r - 20, y - 60, x + 30, y - 66); c.quadraticCurveTo(x - 40, y - 90, x - r + 20, y - 40); c.closePath(); fillStroke(c, col, 9);
    c.fillStyle = 'rgba(255,255,255,0.22)'; c.beginPath(); c.ellipse(x - 30, y - r - 4, 34, 9, -0.2, 0, 7); c.fill();
    if (s.hair === 'parted') line(c, [[x - 40, y - r - 14], [x - 20, y - 74]], 4, 'rgba(255,255,255,0.35)');
  } else if (s.hair === 'short') {
    const col = s.hairColor || '#3a2616';
    c.beginPath(); c.moveTo(x - r + 2, y - 30); c.quadraticCurveTo(x - r + 10, y - r - 20, x, y - r - 12); c.quadraticCurveTo(x + r - 10, y - r - 20, x + r - 2, y - 30); c.quadraticCurveTo(x + 40, y - 84, x - 20, y - 70); c.quadraticCurveTo(x - 70, y - 64, x - r + 2, y - 30); fillStroke(c, col, 9);
  }
    if (h === 'hood') {
    const col = s.hatColor || '#5a7a3a';
    c.beginPath(); c.arc(x, y + 6, r + 4, Math.PI * 0.82, Math.PI * 2.18); c.lineWidth = 46; c.strokeStyle = INK; c.stroke(); c.lineWidth = 32; c.strokeStyle = col; c.stroke();
    c.beginPath(); c.moveTo(x - r - 10, y + 70); c.quadraticCurveTo(x, y + r + 60, x + r + 10, y + 70); c.lineTo(x + r + 30, y + 118); c.quadraticCurveTo(x, y + r + 96, x - r - 30, y + 118); c.closePath(); fillStroke(c, col, 9);
  } else if (h === 'crown') {
    const cy = y - r + 40; c.save(); c.translate(x, cy); c.scale(1, 0.86); c.translate(-x, -cy);
    c.beginPath(); c.moveTo(x - 92, cy); c.lineTo(x - 104, cy - 96); c.lineTo(x - 56, cy - 50); c.lineTo(x - 26, cy - 118); c.lineTo(x, cy - 60); c.lineTo(x + 26, cy - 118); c.lineTo(x + 56, cy - 50); c.lineTo(x + 104, cy - 96); c.lineTo(x + 92, cy); c.closePath(); fillStroke(c, '#f2c23a', 9);
    c.save(); c.clip(); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(x - 90, cy - 120, 30, 120); c.restore();
    rrect(c, x - 100, cy - 18, 200, 34, 8); fillStroke(c, '#e8b02a', 8);
    for (const [gx, col] of [[-56, '#c8202a'], [0, '#2a6ad8'], [56, '#2a9a4a']]) circ(c, x + gx, cy - 1, 10, col, 4);
    for (const gx of [-104, -26, 26, 104]) circ(c, x + gx, cy - (Math.abs(gx) > 60 ? 98 : 120), 9, '#ffffff', 4);
    c.restore();
  } else if (h === 'feathercap') {
    c.beginPath(); c.moveTo(x - r + 6, y - 40); c.quadraticCurveTo(x - r + 10, y - r - 30, x + 10, y - r - 22); c.quadraticCurveTo(x + r, y - r - 10, x + r - 6, y - 40); c.closePath(); fillStroke(c, s.hatColor || '#c8302a');
    line(c, [[x - r + 8, y - 44], [x + r - 8, y - 44]], 12, '#f2c23a');
    c.beginPath(); c.moveTo(x + 40, y - r - 10); c.quadraticCurveTo(x + 160, y - r - 120, x + 200, y - r - 40); c.quadraticCurveTo(x + 120, y - r - 50, x + 40, y - r - 10); fillStroke(c, '#f8f4ec', 6);
  } else if (h === 'nightcap') {
    const col = s.hatColor || '#4a7ad8';
    c.beginPath(); c.moveTo(x - r + 4, y - 40); c.quadraticCurveTo(x - r + 10, y - r - 40, x + 20, y - r - 30); c.quadraticCurveTo(x + r + 60, y - r - 10, x + r + 90, y + 30); c.quadraticCurveTo(x + r + 20, y - r + 10, x + r - 4, y - 40); c.closePath(); fillStroke(c, col);
    for (let k = 0; k < 4; k++) line(c, [[x - r + 30 + k * 50, y - 50 - k * 8], [x - r + 40 + k * 50, y - r - 20 + k * 6]], 8, 'rgba(255,255,255,0.45)');
    circ(c, x + r + 92, y + 34, 22, '#ffffff', 7);
    rrect(c, x - r + 2, y - 56, 2 * r - 4, 26, 12); fillStroke(c, '#ffffff', 7);
  } else if (h === 'cloche' || h === 'flatcap') {
    const col = s.hatColor || (h === 'cloche' ? '#2a2420' : '#5a5048');
    if (h === 'cloche') { c.beginPath(); c.ellipse(x, y - r + 46, r + 26, 24, 0, 0, Math.PI * 2); fillStroke(c, col); c.beginPath(); c.moveTo(x - r + 6, y - r + 46); c.quadraticCurveTo(x - r + 4, y - r - 36, x, y - r - 34); c.quadraticCurveTo(x + r - 4, y - r - 36, x + r - 6, y - r + 46); c.closePath(); fillStroke(c, col); line(c, [[x - r + 10, y - r + 26], [x + r - 10, y - r + 26]], 12, s.hatBand || '#8a3a5a'); circ(c, x + r - 30, y - r + 22, 16, '#e8c24a', 6); }
    else { c.beginPath(); c.moveTo(x - r + 2, y - 30); c.quadraticCurveTo(x - r + 6, y - r - 26, x + 10, y - r - 20); c.quadraticCurveTo(x + r + 4, y - r - 10, x + r + 10, y - 40); c.lineTo(x + r + 70, y - 36); c.quadraticCurveTo(x + r + 40, y - 20, x + r - 10, y - 24); c.closePath(); fillStroke(c, col); for (let k = 0; k < 5; k++) line(c, [[x - r + 20 + k * 40, y - r - 4], [x - r + 30 + k * 40, y - 36]], 3, 'rgba(255,255,255,0.18)'); }
  } else if (h === 'stationcap' || h === 'gakucap') {
    const col = h === 'stationcap' ? '#1e2a5a' : '#16161c';
    c.beginPath(); c.moveTo(x - r + 8, y - r + 46); c.lineTo(x - r - 2, y - r - 14); c.quadraticCurveTo(x, y - r - 40, x + r + 2, y - r - 14); c.lineTo(x + r - 8, y - r + 46); c.closePath(); fillStroke(c, col);
    if (h === 'stationcap') { rrect(c, x - r + 6, y - r + 20, 2 * r - 12, 18, 4); fillStroke(c, '#f2c23a', 5); }
    c.beginPath(); c.ellipse(x, y - r + 52, r - 4, 20, 0, 0, Math.PI); fillStroke(c, '#101018');
    circ(c, x, y - r + 4, 14, '#f2c23a', 5);
  } else if (h === 'galea' || h === 'crest') {
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
  } else if (h === 'pilotka') {
    c.beginPath(); c.moveTo(x - r + 6, y - r + 40); c.lineTo(x - 30, y - r - 24); c.lineTo(x + 50, y - r - 20); c.lineTo(x + r - 6, y - r + 40); c.closePath(); fillStroke(c, '#1c2030');
    line(c, [[x - r + 10, y - r + 30], [x + r - 10, y - r + 30]], 6, '#e8c24a');
  } else if (h === 'dixie') {
    c.beginPath(); c.ellipse(x, y - r + 20, r - 6, 30, 0, 0, Math.PI * 2); fillStroke(c, '#ffffff');
    c.beginPath(); c.moveTo(x - r + 26, y - r + 20); c.quadraticCurveTo(x - r + 30, y - r - 46, x, y - r - 50); c.quadraticCurveTo(x + r - 30, y - r - 46, x + r - 26, y - r + 20); c.closePath(); fillStroke(c, '#ffffff');
  } else if (h === 'tricorn') {
    c.save(); c.translate(0, 40); c.scale(1, 0.85);
    c.beginPath(); c.moveTo(x - r - 50, y - r + 30); c.quadraticCurveTo(x, y - r - 60, x + r + 50, y - r + 30); c.quadraticCurveTo(x, y - r - 10, x - r - 50, y - r + 30); fillStroke(c, '#18181e');
    c.beginPath(); c.moveTo(x - r - 50, y - r + 30); c.quadraticCurveTo(x, y - r - 60, x + r + 50, y - r + 30); c.lineWidth = 8; c.strokeStyle = s.trim || '#e8c24a'; c.stroke();
    c.beginPath(); c.moveTo(x - 60, y - r - 6); c.quadraticCurveTo(x, y - r - 90, x + 60, y - r - 6); c.closePath(); fillStroke(c, '#18181e');
    circ(c, x + 50, y - r - 6, 12, '#1a1a1a', 4);
    c.restore();
  } else if (h === 'tarhat') {
    c.beginPath(); c.ellipse(x, y - r + 22, r + 10, 26, 0, 0, Math.PI * 2); fillStroke(c, '#2a2a2a');
    rrect(c, x - r + 30, y - r - 30, 2 * r - 60, 56, 20); fillStroke(c, '#2a2a2a'); line(c, [[x - r + 32, y - r + 10], [x + r - 32, y - r + 10]], 6, '#c8c8c8');
  } else if (h === 'cowboyhat') {
    c.save(); c.translate(0, 18);
    c.beginPath(); c.moveTo(x - r - 70, y - r + 34); c.quadraticCurveTo(x - r - 40, y - r + 70, x, y - r + 58); c.quadraticCurveTo(x + r + 40, y - r + 70, x + r + 70, y - r + 34); c.quadraticCurveTo(x, y - r + 20, x - r - 70, y - r + 34); fillStroke(c, s.hatColor || '#8a5a2a');
    c.beginPath(); c.moveTo(x - r + 20, y - r + 34); c.quadraticCurveTo(x - r + 10, y - r - 70, x - 30, y - r - 60); c.quadraticCurveTo(x, y - r - 40, x + 30, y - r - 60); c.quadraticCurveTo(x + r - 10, y - r - 70, x + r - 20, y - r + 34); c.closePath(); fillStroke(c, s.hatColor || '#8a5a2a');
    c.fillStyle = '#3a2a1a'; c.fillRect(x - r + 22, y - r + 6, 2 * r - 44, 18);
    c.restore();
  } else if (h === 'slouch') {
    c.save(); c.translate(0, 14);
    c.beginPath(); c.ellipse(x, y - r + 36, r + 50, 34, 0.05, 0, Math.PI * 2); fillStroke(c, '#5a4a3a');
    c.beginPath(); c.moveTo(x - r + 20, y - r + 40); c.quadraticCurveTo(x - r + 20, y - r - 50, x, y - r - 46); c.quadraticCurveTo(x + r - 20, y - r - 50, x + r - 20, y - r + 40); c.closePath(); fillStroke(c, '#6a5a48');
    c.restore();
  } else if (h === 'bowler') {
    c.beginPath(); c.ellipse(x, y - r + 30, r + 26, 22, 0, 0, Math.PI * 2); fillStroke(c, s.hatColor || '#1d1d24');
    c.beginPath(); c.arc(x, y - r + 28, r - 26, Math.PI, 0); c.closePath(); fillStroke(c, s.hatColor || '#1d1d24');
    c.fillStyle = '#5a1a2a'; c.fillRect(x - r + 28, y - r + 12, 2 * r - 56, 14);
  } else if (h === 'tophat') {
    rrect(c, x - r - 30, y - r + 14, 2 * r + 60, 30, 14); fillStroke(c, s.hatColor || '#1d1d24');
    c.beginPath(); c.moveTo(x - r + 26, y - r + 20); c.lineTo(x - r + 18, y - r - 54); c.lineTo(x + r - 18, y - r - 54); c.lineTo(x + r - 26, y - r + 20); c.closePath(); fillStroke(c, s.hatColor || '#1d1d24');
    c.fillStyle = s.hatBand || '#5a1a2a'; c.fillRect(x - r + 24, y - r - 8, 2 * r - 48, 22); line(c, [[x - r + 24, y - r - 8], [x + r - 24, y - r - 8]], 5);
  } else if (h === 'bonnet') {
    c.beginPath(); c.arc(x, y - 4, r + 40, Math.PI * 1.02, Math.PI * 1.98); stroke(c, 10);
    c.beginPath(); c.moveTo(x - r - 10, y + 40); c.quadraticCurveTo(x - 30, y + 140, x - 10, y + 150); stroke(c, 7); c.beginPath(); c.moveTo(x + r + 10, y + 40); c.quadraticCurveTo(x + 30, y + 140, x + 10, y + 150); stroke(c, 7);
    for (const sd of [-1, 1]) circ(c, x + sd * (r + 4), y - 60, 22, s.flower || '#e8608a', 6);
  } else if (h === 'nursecap') {
    c.beginPath(); c.moveTo(x - r + 4, y - 50); c.quadraticCurveTo(x - r + 10, y - r - 34, x, y - r - 26); c.quadraticCurveTo(x + r - 10, y - r - 34, x + r - 4, y - 50); c.quadraticCurveTo(x, y - 80, x - r + 4, y - 50); fillStroke(c, '#ffffff');
    line(c, [[x - 20, y - r - 10], [x + 20, y - r - 10]], 6, '#d84a4a'); line(c, [[x, y - r - 30], [x, y - r + 10]], 6, '#d84a4a');
  } else if (h === 'surgcap') {
    c.beginPath(); c.moveTo(x - r + 2, y - 36); c.quadraticCurveTo(x - r + 6, y - r - 30, x, y - r - 22); c.quadraticCurveTo(x + r - 6, y - r - 30, x + r - 2, y - 36); c.quadraticCurveTo(x, y - 62, x - r + 2, y - 36); fillStroke(c, '#3aa58f');
    for (let i = 0; i < 7; i++) dot(c, x - 80 + i * 26, y - 96 + (i % 2) * 14, 5, '#2f8c79');
  } else if (h === 'peakcap') {
    const big = s.general ? 1.18 : 1;
    c.beginPath(); c.ellipse(x, y - r + 6, (r + 34) * big, 46 * big, 0, 0, Math.PI * 2); fillStroke(c, s.navy ? '#f4f4f0' : (s.olive || '#66703f'));
    rrect(c, x - r + 14, y - r + 10, 2 * r - 28, 40, 10); fillStroke(c, s.navy ? '#1a1a22' : '#b8262b');
    c.beginPath(); c.ellipse(x, y - r + 54, r - 6, 22, 0, 0, Math.PI); fillStroke(c, '#18181c');
    c.fillStyle = '#e8c24a'; c.beginPath(); for (let j = 0; j < 10; j++) { const a = j * Math.PI / 5 - Math.PI / 2, rr = j % 2 ? 9 : 22; c.lineTo(x + Math.cos(a) * rr, y - r + 28 + Math.sin(a) * rr); } c.closePath(); c.fill(); stroke(c, 3);
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
    case 'sleep': for (const p of [L, R]) { c.beginPath(); c.arc(p[0], p[1] + 2, 17, Math.PI * 0.1, Math.PI * 0.9); stroke(c, 8); } c.beginPath(); c.ellipse(x + 8, y + 64, 16, 12, 0, 0, 7); fillStroke(c, '#7a1f1f', 6);
      c.beginPath(); c.moveTo(x + 20, y + 72); c.quadraticCurveTo(x + 30, y + 100, x + 22, y + 116); stroke(c, 0); c.fillStyle = '#9ad8ff'; c.beginPath(); c.ellipse(x + 26, y + 96, 7, 14, 0, 0, 7); c.fill(); break;
    case 'yawn': for (const p of [L, R]) line(c, [[p[0] - 18, p[1] + 2], [p[0] + 18, p[1] + 2]], 8); brows(14);
      c.beginPath(); c.ellipse(x, y + 70, 30, 44, 0, 0, 7); fillStroke(c, '#7a1f1f', 8); c.beginPath(); c.ellipse(x, y + 96, 18, 12, 0, 0, 7); c.fillStyle = '#e0605a'; c.fill(); break;
    case 'jolt': for (const p of [L, R]) { circ(c, p[0], p[1] - 6, 32, '#fff', 7); dot(c, p[0], p[1] - 6, 6); } brows(40, -4);
      c.beginPath(); c.moveTo(x - 40, y + 56); for (let k = 1; k <= 8; k++) c.lineTo(x - 40 + k * 10, y + 56 + (k % 2 ? -10 : 10)); stroke(c, 7); break;
    case 'blow': for (const p of [L, R]) { c.beginPath(); c.arc(p[0], p[1] + 6, 15, Math.PI * 1.15, Math.PI * 1.85); stroke(c, 8); } brows(4, 6);
      c.fillStyle = 'rgba(250,110,120,0.55)'; for (const p of [L, R]) { c.beginPath(); c.arc(p[0] + (p === L ? -14 : 14), y + 46, 30, 0, 7); c.fill(); } circ(c, x + 26, y + 56, 13, '#7a1f1f', 7); break;
    case 'panic': for (const p of [L, R]) { circ(c, p[0] + (s.lookX || 0) * 4, p[1] - 4, 30, '#fff', 7); circ(c, p[0] + (s.lookX || 0) * 8, p[1] - 2, 14, null, 5); dot(c, p[0] + (s.lookX || 0) * 8, p[1] - 2, 6); } brows(30, -6);
      c.beginPath(); c.ellipse(x, y + 74, 30, 38, 0, 0, 7); fillStroke(c, '#7a1f1f', 8); c.beginPath(); c.ellipse(x, y + 96, 16, 9, 0, 0, 7); c.fillStyle = '#e0605a'; c.fill(); c.fillStyle = '#fff'; c.fillRect(x - 18, y + 42, 36, 8); break;
    case 'ring': for (const p of [L, R]) { circ(c, p[0], p[1] - 2, 24, '#fff', 7); circ(c, p[0] + (s.lookX || 0) * 7, p[1] - 1, 11, null, 5); dot(c, p[0] + (s.lookX || 0) * 7, p[1] - 1, 5); } line(c, [[x - 14, y + 62], [x + 14, y + 62]], 7); break;
    case 'nervous': for (const p of [L, R]) { circ(c, p[0], p[1] - 2, 24, '#fff', 7); dot(c, p[0] + (s.lookX || 0) * 7, p[1], 7); } brows(16, -8);
      c.beginPath(); c.moveTo(x - 30, y + 62); for (let k = 1; k <= 6; k++) c.lineTo(x - 30 + k * 10, y + 62 + (k % 2 ? -7 : 7)); stroke(c, 6); break;
    case 'squish': line(c, [[L[0] - 20, L[1] - 14], [L[0] + 14, L[1]], [L[0] - 20, L[1] + 14]], 9); line(c, [[R[0] + 20, R[1] - 14], [R[0] - 14, R[1]], [R[0] + 20, R[1] + 14]], 9);
      c.beginPath(); c.ellipse(x, y + 66, 40, 16, 0, 0, 7); fillStroke(c, '#7a1f1f', 7); c.fillStyle = '#fff'; c.fillRect(x - 30, y + 58, 60, 7); break;
    case 'grin': happy(L); happy(R); brows(6); grit(96, 40, y + 58); break;
    case 'cry': for (const p of [L, R]) { c.beginPath(); c.arc(p[0], p[1] + 2, 18, Math.PI * 0.1, Math.PI * 0.9, true); stroke(c, 9); c.beginPath(); c.moveTo(p[0] - 6, p[1] + 14); c.quadraticCurveTo(p[0] - 14, p[1] + 70, p[0] - 4, p[1] + 110); c.lineTo(p[0] + 10, p[1] + 110); c.quadraticCurveTo(p[0] + 6, p[1] + 60, p[0] + 8, p[1] + 14); c.closePath(); fillStroke(c, '#7fd0ff', 5); } brows(14, -10);
      c.beginPath(); c.moveTo(x - 34, y + 78); c.quadraticCurveTo(x, y + 40, x + 34, y + 78); c.quadraticCurveTo(x, y + 66, x - 34, y + 78); fillStroke(c, '#7a1f1f', 7); break;
    case 'furious': angry(); circ(c, L[0], L[1] + 2, 15, '#fff', 6); dot(c, L[0] + 3, L[1] + 4, 6); circ(c, R[0], R[1] + 2, 15, '#fff', 6); dot(c, R[0] - 3, R[1] + 4, 6);
      c.beginPath(); c.moveTo(x - 46, y + 46); c.lineTo(x + 46, y + 46); c.quadraticCurveTo(x + 40, y + 106, x, y + 106); c.quadraticCurveTo(x - 40, y + 106, x - 46, y + 46); fillStroke(c, '#7a1f1f', 8); c.fillStyle = '#fff'; c.fillRect(x - 40, y + 50, 80, 12); c.fillRect(x - 26, y + 92, 52, 8); break;
    case 'polite': for (const p of [L, R]) { c.beginPath(); c.arc(p[0], p[1] + 8, 16, Math.PI * 1.15, Math.PI * 1.85); stroke(c, 8); } c.beginPath(); c.arc(x, y + 44, 18, 0.2 * Math.PI, 0.8 * Math.PI); stroke(c, 7); break;
    default: dot(c, L[0], L[1], 12); dot(c, R[0], R[1], 12); line(c, [[x - 18, y + 60], [x + 18, y + 60]], 8);
  }
  if (s.mustache) { c.beginPath(); c.moveTo(x, y + 34); c.bezierCurveTo(x - 20, y + 20, x - 56, y + 28, x - 62, y + 50); c.bezierCurveTo(x - 36, y + 42, x - 14, y + 50, x, y + 44); c.bezierCurveTo(x + 14, y + 50, x + 36, y + 42, x + 62, y + 50); c.bezierCurveTo(x + 56, y + 28, x + 20, y + 20, x, y + 34); c.fillStyle = s.hairColor || INK; c.fill(); }
  if (s.stubble) { c.fillStyle = 'rgba(40,30,30,0.35)'; for (let i = 0; i < 26; i++) { const a = Math.PI * (0.15 + 0.7 * ((i * 37) % 26) / 26); const rr = 96 + ((i * 13) % 20); c.beginPath(); c.arc(x + Math.cos(a) * rr * 0.9, y - 6 + Math.sin(a) * rr * 0.75, 3, 0, 7); c.fill(); } }
  if (s.blush) { c.fillStyle = 'rgba(240,120,130,0.35)'; c.beginPath(); c.ellipse(L[0] - 18, L[1] + 40, 22, 13, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(R[0] + 18, R[1] + 40, 22, 13, 0, 0, 7); c.fill(); }
  if (s.monocle) { circ(c, R[0], R[1] + 2, 30, null, 6); line(c, [[R[0] + 26, R[1] + 16], [R[0] + 70, R[1] + 120]], 3, '#c8a24a'); }
  if (s.cigar) { rrect(c, x + 10, y + 52, 70, 16, 6); fillStroke(c, '#8a5a2a', 5); circ(c, x + 82, y + 60, 7, '#ff8a3a', 3); for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x + 92 + i * 10, y + 30 - i * 26, 12 + i * 4, 0, 7); c.fillStyle = 'rgba(220,220,220,0.75)'; c.fill(); } }
  if (s.mask) { rrect(c, x - 80, y + 26, 160, 80, 24); fillStroke(c, '#9fd8d0', 6); line(c, [[x - 70, y + 50], [x + 70, y + 50]], 3, '#6aa8a0'); line(c, [[x - 70, y + 74], [x + 70, y + 74]], 3, '#6aa8a0'); }
  if (s.headset) { c.beginPath(); c.arc(x, y - 10, HR + 12, Math.PI * 1.05, Math.PI * 1.95); stroke(c, 14); c.beginPath(); c.arc(x, y - 10, HR + 12, Math.PI * 1.05, Math.PI * 1.95); c.lineWidth = 7; c.strokeStyle = '#3a3a40'; c.stroke(); for (const sd of [-1, 1]) { rrect(c, x + sd * (HR + 2) - 22, y - 30, 44, 70, 16); fillStroke(c, '#2a2a30', 7); } line(c, [[x - HR + 4, y + 30], [x - 40, y + 70]], 7); circ(c, x - 34, y + 72, 10, '#2a2a30', 5); }
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
  let lean = { bow: 0.3, stumble: 0.24, march1: 0.04, march2: 0.04, carry: 0, stuck: 0 }[pose] || 0;
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
  const hand = (x, y) => { if (s.gloves) { circ(c, x, y, 19, '#ffffff', 7); line(c, [[x - 14, y + 12], [x + 14, y + 12]], 5); } else circ(c, x, y, 13, '#fff', 7); };
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
    case 'scrub': post = () => { arm([SL, [170, 470], [236, 488]]); arm([SR, [342, 470], [276, 488]]); brush(c, 262, 470, s.scrubT ? Math.sin(s.scrubT) * 0.3 : 0.1); hand(236, 492); hand(280, 492); if (s.foam) foam(c, 256, 440, 9); }; break;
    case 'shake': arm([SL, [150, 500], [192, 548]]); arm([SR, [420, 460], [494, 452]]); hand(494, 452); break;
    case 'baby': post = () => { arm([SL, [170, 470], [196, 470]]); arm([SR, [342, 470], [330, 470]]); baby(c, 262, 470); }; break;
    case 'note': arm([SL, [160, 470], [220, 450]]); arm([SR, [352, 470], [300, 440]]); notebook(c, 256, 440); break;
    case 'sit': arm([SL, [150, 470], [210, 530]]); arm([SR, [362, 470], [302, 530]]); break;
    case 'phone': post = () => { arm([SR, [400, 360], [372, 250]]); handset(c, 378, 214, -0.25); hand(372, 250); }; arm([SL, [150, 500], [196, 548]]); break;
    case 'papers': post = () => { arm([SL, [160, 470], [178, 430]]); arm([SR, [352, 470], [334, 430]]); papers(c, 256, 440); }; break;
    case 'hammer': post = () => { const up = s.swing ? -1.2 : -0.3; hammer(c, 404, 330, up + 0.6); arm([SR, [380, 380], [404, 330]]); hand(404, 330); }; arm([SL, [150, 500], [196, 548]]); break;
    case 'plate': post = () => { arm([SL, [160, 470], [200, 440]]); arm([SR, [352, 470], [312, 440]]); copperPlate(c, 256, 430, -0.1); }; break;
    case 'scroll': post = () => { arm([SL, [150, 460], [150, 420]]); arm([SR, [362, 460], [362, 420]]); scroll(c, 256, 440); hand(140, 420); hand(372, 420); }; break;
    case 'broom': post = () => { const a = s.swing ? 0.75 : 0.3; broom(c, 330, 420, a); arm([SL, [200, 470], [300, 430]]); arm([SR, [380, 420], [350, 370]]); hand(300, 430); hand(350, 370); }; break;
    case 'coin': post = () => { arm([SR, [420, 330], [440, 250]]); goldCoin(c, 446, 210, 40); hand(440, 254); }; arm([SL, [150, 500], [196, 548]]); break;
    case 'cage': post = () => { arm([SL, [170, 470], [196, 420]]); arm([SR, [342, 470], [316, 420]]); cage(c, 256, 470, s.rat !== false); hand(196, 404); hand(316, 404); }; break;
    case 'toss': post = () => { arm([SR, [420, 330], [450, 230]]); hand(450, 230); }; arm([SL, [150, 500], [196, 548]]); break;
    case 'tails': post = () => { arm([SR, [420, 340], [430, 250]]); for (let k = 0; k < 5; k++) ratTail(c, 430, 250, -0.5 + k * 0.25, 110); hand(430, 248); }; arm([SL, [150, 500], [196, 548]]); break;
    case 'throne': arm([SL, [140, 470], [130, 540]]); arm([SR, [372, 470], [382, 540]]); hand(130, 540); hand(382, 540); break;
    case 'blow': post = () => { c.save(); c.translate(HX + 30, HY + 70); c.rotate(-0.3 + (s.aim || 0)); rrect(c, 0, -13, 190, 26, 12); fillStroke(c, '#c8a46a', 7); line(c, [[20, -4], [180, -4]], 4, 'rgba(255,255,255,0.5)'); c.restore(); arm([SL, [250, 400], [330, 250]]); arm([SR, [420, 380], [420, 250]]); hand(330, 252); hand(420, 240); }; break;
    case 'reload': post = () => { arm([SR, [400, 400], [330, 300]]); hand(330, 300); for (let k = 0; k < 4; k++) circ(c, 316 + k * 10, 290 - (k % 2) * 10, 9, '#8ac84a', 4); }; arm([SL, [150, 500], [196, 548]]); break;
    case 'push': post = () => { arm([SL, [300, 410], [470, 400]]); arm([SR, [420, 380], [488, 350]]); hand(474, 400); hand(490, 350); }; break;
    case 'pinned': arm([SL, [150, 300], [196, 210]]); arm([SR, [362, 300], [316, 210]]); hand(196, 210); hand(316, 210); break;
    case 'briefcase': post = () => { arm([SR, [380, 470], [396, 560]]); rrect(c, 340, 560, 120, 86, 10); fillStroke(c, s.caseCol || '#5a3418', 8); rrect(c, 378, 544, 44, 20, 6); stroke(c, 6); hand(396, 560); }; arm([SL, [150, 500], [196, 548]]); break;
    case 'strap': post = () => { line(c, [[400, -20], [400, 120]], 8, '#c8c8c8'); circ(c, 400, 150, 28, null, 8); arm([SR, [400, 300], [400, 172]]); hand(400, 176); }; arm([SL, [150, 500], [196, 548]]); break;
    case 'bow': arm([SL, [190, 480], [214, 560]]); arm([SR, [322, 480], [298, 560]]); hand(214, 560); hand(298, 560); break;
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
  if (s.zzz) { const x = HX, y = HY; c.save(); c.fillStyle = '#ffffff'; c.strokeStyle = INK; c.lineWidth = 8; c.font = '900 64px Montserrat, sans-serif'; c.lineJoin = 'round'; [[x + 150, y - 40, 1], [x + 196, y - 100, 0.75], [x + 226, y - 150, 0.55]].forEach(([zx, zy, k]) => { c.save(); c.translate(zx, zy); c.scale(k, k); c.strokeText('Z', 0, 0); c.fillText('Z', 0, 0); c.restore(); }); c.restore(); }
  c.restore();
  if (s.mud) {
    c.save(); c.globalCompositeOperation = 'source-atop';
    const y0 = FEET - s.mud * 470;
    const g = c.createLinearGradient(0, y0 - 50, 0, y0 + 30); g.addColorStop(0, 'rgba(84,56,28,0)'); g.addColorStop(1, 'rgba(84,56,28,0.93)');
    c.fillStyle = g; c.fillRect(0, y0 - 50, CW, FEET - y0 + 80);
    for (let i = 0; i < 16; i++) { const x = 80 + ((i * 97) % 360), y = y0 - 20 - ((i * 53) % 140) * s.mud; c.fillStyle = 'rgba(84,56,28,0.85)'; c.beginPath(); c.ellipse(x, y, 10 + (i % 4) * 5, 7 + (i % 3) * 4, i, 0, 7); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,0.18)'; for (let i = 0; i < 8; i++) { c.beginPath(); c.ellipse(100 + i * 44, y0 + 30 + (i % 3) * 30, 12, 4, 0, 0, 7); c.fill(); }
    c.restore();
  }
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
  worldPoint(px, py) {
    const w = this.h * CW / CH;
    const v = new THREE.Vector3((px / CW - 0.5) * w, (FEET - py) / CH * this.h, 0.01);
    this.mesh.updateMatrixWorld(true); return this.mesh.localToWorld(v);
  }
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
export { drawChar };
