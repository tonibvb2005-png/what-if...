// 2D cartoon characters drawn on canvas, used as billboards in the 3D world.
import * as THREE from 'three';

export const CW = 512, CH = 768;
const FEET = 745;
const INK = '#141010';
const LW = 11;

const cache = new Map();

function strokeFill(ctx, fill, lw = LW) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke();
}
function line(ctx, pts, lw = LW) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
}
function circle(ctx, x, y, r, fill, lw = LW) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); strokeFill(ctx, fill, lw); }
function dot(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill(); }

export function drawJug(ctx, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  // handle
  ctx.beginPath(); ctx.ellipse(-48, -10, 22, 34, 0, 0, Math.PI * 2); ctx.lineWidth = 14; ctx.strokeStyle = INK; ctx.stroke();
  ctx.lineWidth = 6; ctx.strokeStyle = '#b4572c'; ctx.stroke();
  // body
  ctx.beginPath(); ctx.ellipse(0, 10, 52, 62, 0, 0, Math.PI * 2); strokeFill(ctx, '#cf6d3b');
  // band
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, 10, 52, 62, 0, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = '#8f3d1c'; ctx.fillRect(-60, -8, 120, 16);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(-18, -12, 12, 26, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.beginPath(); ctx.ellipse(0, 10, 52, 62, 0, 0, Math.PI * 2); ctx.lineWidth = LW; ctx.strokeStyle = INK; ctx.stroke();
  // neck
  ctx.beginPath(); ctx.rect(-20, -78, 40, 34); strokeFill(ctx, '#cf6d3b');
  ctx.beginPath(); ctx.ellipse(0, -80, 30, 10, 0, 0, Math.PI * 2); strokeFill(ctx, '#7a3418');
  ctx.restore();
}

function drawStaff(ctx, x, y) {
  line(ctx, [[x, y - 190], [x, y + 260]], 16);
  ctx.beginPath(); ctx.moveTo(x, y - 190); ctx.lineTo(x, y + 260); ctx.lineWidth = 7; ctx.strokeStyle = '#a0662e'; ctx.stroke();
  circle(ctx, x, y - 200, 20, '#e8b63c', 9);
}

function cloud(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const puffs = [[0, 0, 26], [-26, 8, 20], [26, 8, 20], [-12, -14, 18], [14, -14, 18]];
  ctx.beginPath(); for (const [px, py, r] of puffs) { ctx.moveTo(px + r, py); ctx.arc(px, py, r, 0, Math.PI * 2); }
  ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.restore();
}

function body(ctx, spec, bx, by) {
  const rx = spec.belly ? 112 : 92, ry = spec.belly ? 112 : 102;
  const path = () => { ctx.beginPath(); ctx.ellipse(bx, by, rx, ry, 0, 0, Math.PI * 2); };
  path(); ctx.fillStyle = spec.skin || '#b9774a'; ctx.fill();
  ctx.save(); path(); ctx.clip();
  const o = spec.outfit || 'kilt';
  if (o === 'kilt') {
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(bx - 130, by + 18, 260, 200);
    ctx.fillStyle = '#d9cfb8'; for (let i = -4; i <= 4; i++) ctx.fillRect(bx + i * 24, by + 30, 5, 120);
    ctx.fillStyle = spec.belt || '#e4b442'; ctx.fillRect(bx - 130, by + 10, 260, 16);
  } else if (o === 'robe') {
    ctx.fillStyle = '#f7f3e8'; ctx.fillRect(bx - 140, by - 140, 280, 300);
    ctx.save(); ctx.translate(bx, by); ctx.rotate(-0.55); ctx.fillStyle = '#e4b442'; ctx.fillRect(-160, -18, 320, 34); ctx.fillStyle = '#2a4fa0'; ctx.fillRect(-160, -4, 320, 7); ctx.restore();
  } else if (o === 'khaki') {
    ctx.fillStyle = '#cdb27a'; ctx.fillRect(bx - 140, by - 140, 280, 300);
    ctx.fillStyle = '#b39660'; ctx.fillRect(bx - 4, by - 120, 8, 230);
    ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.strokeRect(bx - 66, by - 30, 40, 34); ctx.strokeRect(bx + 26, by - 30, 40, 34);
    ctx.fillStyle = '#8a6a3c'; ctx.fillRect(bx - 130, by + 48, 260, 18);
  } else if (o === 'labcoat') {
    ctx.fillStyle = '#4f7fd0'; ctx.fillRect(bx - 140, by - 140, 280, 300);
    ctx.fillStyle = '#fbfbfb';
    ctx.beginPath(); ctx.moveTo(bx - 140, by - 140); ctx.lineTo(bx - 10, by - 140); ctx.lineTo(bx - 10, by + 20); ctx.lineTo(bx - 40, by + 160); ctx.lineTo(bx - 140, by + 160); ctx.fill();
    ctx.beginPath(); ctx.moveTo(bx + 140, by - 140); ctx.lineTo(bx + 10, by - 140); ctx.lineTo(bx + 10, by + 20); ctx.lineTo(bx + 40, by + 160); ctx.lineTo(bx + 140, by + 160); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.strokeRect(bx + 40, by - 50, 34, 28);
    ctx.fillStyle = '#e04646'; ctx.fillRect(bx + 50, by - 62, 6, 20);
  }
  if (spec.collar) {
    ctx.lineWidth = 16; ctx.strokeStyle = '#1fb3a6'; ctx.beginPath(); ctx.arc(bx, by - 112, 70, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    ctx.lineWidth = 7; ctx.strokeStyle = '#e8b63c'; ctx.beginPath(); ctx.arc(bx, by - 112, 88, 0.22 * Math.PI, 0.78 * Math.PI); ctx.stroke();
  }
  ctx.restore();
  path(); ctx.lineWidth = LW; ctx.strokeStyle = INK; ctx.stroke();
}

function face(ctx, spec, hx, hy) {
  const e = spec.expr || 'neutral';
  const L = [hx - 48, hy + 4], R = [hx + 48, hy + 4];
  const brows = (tilt, lift = 0) => {
    line(ctx, [[L[0] - 26, L[1] - 40 - lift + tilt], [L[0] + 22, L[1] - 40 - lift - tilt]], 10);
    line(ctx, [[R[0] - 22, R[1] - 40 - lift - tilt], [R[0] + 26, R[1] - 40 - lift + tilt]], 10);
  };
  const angryBrows = () => {
    line(ctx, [[L[0] - 30, L[1] - 52], [L[0] + 26, L[1] - 26]], 13);
    line(ctx, [[R[0] - 26, R[1] - 26], [R[0] + 30, R[1] - 52]], 13);
  };
  const lidEye = ([x, y]) => {
    dot(ctx, x, y + 6, 13);
    ctx.fillStyle = spec.faceColor || '#ffffff'; ctx.fillRect(x - 20, y - 14, 40, 18);
    line(ctx, [[x - 22, y + 3], [x + 22, y + 1]], 9);
  };
  const happyEye = ([x, y]) => { ctx.beginPath(); ctx.arc(x, y + 10, 20, Math.PI * 1.1, Math.PI * 1.9); ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke(); };
  const squeeze = ([x, y], dir) => line(ctx, [[x - 18 * dir, y - 14], [x + 14 * dir, y], [x - 18 * dir, y + 14]], 10);
  const grit = (w = 70, h = 34, y = hy + 64) => {
    ctx.beginPath(); ctx.roundRect(hx - w / 2, y - h / 2, w, h, 10); strokeFill(ctx, '#ffffff', 9);
    for (let i = 1; i < 4; i++) line(ctx, [[hx - w / 2 + i * w / 4, y - h / 2 + 3], [hx - w / 2 + i * w / 4, y + h / 2 - 3]], 5);
    line(ctx, [[hx - w / 2 + 4, y], [hx + w / 2 - 4, y]], 5);
  };
  switch (e) {
    case 'bored':
      lidEye(L); lidEye(R);
      line(ctx, [[L[0] - 24, L[1] - 34], [L[0] + 20, L[1] - 36]], 9);
      line(ctx, [[R[0] - 20, R[1] - 44], [R[0] + 24, R[1] - 48]], 9);
      line(ctx, [[hx - 22, hy + 66], [hx + 24, hy + 62]], 9);
      break;
    case 'smirk':
      lidEye(L); lidEye(R);
      line(ctx, [[L[0] - 24, L[1] - 34], [L[0] + 20, L[1] - 36]], 9);
      line(ctx, [[R[0] - 20, R[1] - 46], [R[0] + 24, R[1] - 50]], 9);
      ctx.beginPath(); ctx.moveTo(hx - 26, hy + 64); ctx.quadraticCurveTo(hx + 8, hy + 72, hx + 32, hy + 50); ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke();
      break;
    case 'laugh':
      happyEye(L); happyEye(R); brows(0, 8);
      ctx.beginPath(); ctx.moveTo(hx - 46, hy + 44); ctx.quadraticCurveTo(hx, hy + 44, hx + 46, hy + 44); ctx.quadraticCurveTo(hx + 40, hy + 112, hx, hy + 112); ctx.quadraticCurveTo(hx - 40, hy + 112, hx - 46, hy + 44);
      strokeFill(ctx, '#7a1f1f', 9);
      ctx.beginPath(); ctx.ellipse(hx, hy + 96, 22, 11, 0, 0, Math.PI * 2); ctx.fillStyle = '#e0605a'; ctx.fill();
      break;
    case 'happy':
      happyEye(L); happyEye(R);
      ctx.beginPath(); ctx.arc(hx, hy + 44, 30, 0.15 * Math.PI, 0.85 * Math.PI); ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.stroke();
      break;
    case 'angry':
      angryBrows(); dot(ctx, L[0], L[1] + 4, 11); dot(ctx, R[0], R[1] + 4, 11); grit();
      break;
    case 'shout':
      angryBrows(); dot(ctx, L[0], L[1] + 4, 11); dot(ctx, R[0], R[1] + 4, 11);
      ctx.beginPath(); ctx.ellipse(hx, hy + 76, 38, 34, 0, 0, Math.PI * 2); strokeFill(ctx, '#7a1f1f', 9);
      ctx.beginPath(); ctx.ellipse(hx, hy + 94, 20, 10, 0, 0, Math.PI * 2); ctx.fillStyle = '#e0605a'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(hx - 22, hy + 46, 44, 10);
      break;
    case 'shock':
      for (const p of [L, R]) { circle(ctx, p[0], p[1] - 2, 28, '#ffffff', 8); dot(ctx, p[0], p[1] + 2, 8); }
      brows(0, 26);
      circle(ctx, hx, hy + 76, 14, '#7a1f1f', 8);
      break;
    case 'strain':
      squeeze(L, -1); squeeze(R, 1); grit(64, 30, hy + 66);
      break;
    case 'wink':
      dot(ctx, L[0], L[1] + 2, 12); happyEye(R);
      line(ctx, [[L[0] - 24, L[1] - 36], [L[0] + 20, L[1] - 38]], 9);
      ctx.beginPath(); ctx.moveTo(hx - 30, hy + 58); ctx.quadraticCurveTo(hx + 4, hy + 84, hx + 36, hy + 52); ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke();
      break;
    case 'aha':
      for (const p of [L, R]) { circle(ctx, p[0], p[1] - 2, 24, '#ffffff', 8); dot(ctx, p[0] + 4, p[1], 8); }
      brows(0, 22);
      ctx.beginPath(); ctx.arc(hx, hy + 50, 30, 0.1 * Math.PI, 0.9 * Math.PI); ctx.closePath(); strokeFill(ctx, '#7a1f1f', 8);
      break;
    default:
      dot(ctx, L[0], L[1], 12); dot(ctx, R[0], R[1], 12);
      line(ctx, [[hx - 18, hy + 64], [hx + 18, hy + 64]], 9);
  }
  if (spec.glasses) {
    ctx.lineWidth = 7; ctx.strokeStyle = INK;
    for (const p of [L, R]) { ctx.beginPath(); ctx.arc(p[0], p[1] + 2, 32, 0, Math.PI * 2); ctx.stroke(); }
    line(ctx, [[L[0] + 32, L[1]], [R[0] - 32, R[1]]], 7);
  }
  if (spec.mustache) {
    ctx.beginPath(); ctx.moveTo(hx, hy + 40);
    ctx.bezierCurveTo(hx - 20, hy + 26, hx - 54, hy + 34, hx - 60, hy + 54); ctx.bezierCurveTo(hx - 36, hy + 46, hx - 14, hy + 54, hx, hy + 48);
    ctx.bezierCurveTo(hx + 14, hy + 54, hx + 36, hy + 46, hx + 60, hy + 54); ctx.bezierCurveTo(hx + 54, hy + 34, hx + 20, hy + 26, hx, hy + 40);
    ctx.fillStyle = INK; ctx.fill();
  }
}

function headwear(ctx, spec, hx, hy, r, phase) {
  const h = spec.hat;
  if (!h) return;
  if (h === 'nemes' && phase === 'back') {
    // lappets behind/at sides, drawn before head
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(hx + s * 112, hy - 30); ctx.lineTo(hx + s * 150, hy + 40); ctx.lineTo(hx + s * 132, hy + 230); ctx.lineTo(hx + s * 88, hy + 230); ctx.lineTo(hx + s * 80, hy + 60); ctx.closePath();
      ctx.save(); ctx.clip();
      for (let i = 0; i < 14; i++) { ctx.fillStyle = i % 2 ? '#2a4fa0' : '#e8b63c'; ctx.fillRect(hx - 200, hy - 40 + i * 20, 400, 20); }
      ctx.restore();
      ctx.lineWidth = LW; ctx.strokeStyle = INK; ctx.stroke();
    }
    return;
  }
  if (phase !== 'front') return;
  if (h === 'headband') {
    ctx.save(); ctx.beginPath(); ctx.arc(hx, hy, r, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = spec.hatColor || '#1fb3a6'; ctx.fillRect(hx - r, hy - 104, 2 * r, 30);
    ctx.fillStyle = '#e8b63c'; ctx.fillRect(hx - r, hy - 92, 2 * r, 6);
    ctx.restore();
    line(ctx, [[hx - r + 6, hy - 104], [hx + r - 6, hy - 104]], 7); line(ctx, [[hx - r + 4, hy - 74], [hx + r - 4, hy - 74]], 7);
    ctx.beginPath(); ctx.moveTo(hx + r - 8, hy - 92); ctx.lineTo(hx + r + 40, hy - 70); ctx.lineTo(hx + r + 28, hy - 56); ctx.closePath(); strokeFill(ctx, spec.hatColor || '#1fb3a6', 7);
    ctx.beginPath(); ctx.moveTo(hx + r - 8, hy - 88); ctx.lineTo(hx + r + 30, hy - 40); ctx.lineTo(hx + r + 14, hy - 32); ctx.closePath(); strokeFill(ctx, spec.hatColor || '#1fb3a6', 7);
  } else if (h === 'nemes') {
    ctx.save(); ctx.beginPath(); ctx.moveTo(hx - r - 20, hy - 10); ctx.quadraticCurveTo(hx - r, hy - r - 50, hx, hy - r - 26); ctx.quadraticCurveTo(hx + r, hy - r - 50, hx + r + 20, hy - 10); ctx.lineTo(hx + r - 26, hy - 64); ctx.quadraticCurveTo(hx, hy - 90, hx - r + 26, hy - 64); ctx.closePath();
    ctx.clip();
    for (let i = -10; i < 10; i++) { ctx.fillStyle = i % 2 ? '#2a4fa0' : '#e8b63c'; ctx.fillRect(hx + i * 26, hy - 260, 26, 300); }
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(hx - r - 20, hy - 10); ctx.quadraticCurveTo(hx - r, hy - r - 50, hx, hy - r - 26); ctx.quadraticCurveTo(hx + r, hy - r - 50, hx + r + 20, hy - 10); ctx.lineTo(hx + r - 26, hy - 64); ctx.quadraticCurveTo(hx, hy - 90, hx - r + 26, hy - 64); ctx.closePath();
    ctx.lineWidth = LW; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx - r + 26, hy - 64); ctx.quadraticCurveTo(hx, hy - 90, hx + r - 26, hy - 64); ctx.lineWidth = 14; ctx.strokeStyle = '#e8b63c'; ctx.stroke();
  } else if (h === 'khat') {
    const c = spec.hatColor || '#f1ead8';
    ctx.beginPath(); ctx.moveTo(hx - r - 8, hy + 10); ctx.quadraticCurveTo(hx - r - 10, hy - r - 30, hx, hy - r - 14); ctx.quadraticCurveTo(hx + r + 10, hy - r - 30, hx + r + 8, hy + 10); ctx.lineTo(hx + r - 34, hy - 50); ctx.quadraticCurveTo(hx, hy - 76, hx - r + 34, hy - 50); ctx.closePath();
    strokeFill(ctx, c);
    if (spec.hatStripe) { ctx.save(); ctx.clip(); ctx.restore(); line(ctx, [[hx - r + 34, hy - 58], [hx + r - 34, hy - 58]], 6); }
  } else if (h === 'pith') {
    ctx.beginPath(); ctx.ellipse(hx, hy - 96, r + 34, 22, 0, 0, Math.PI * 2); strokeFill(ctx, '#d9c48f');
    ctx.beginPath(); ctx.moveTo(hx - r + 10, hy - 98); ctx.quadraticCurveTo(hx - r + 4, hy - r - 70, hx, hy - r - 72); ctx.quadraticCurveTo(hx + r - 4, hy - r - 70, hx + r - 10, hy - 98); ctx.closePath(); strokeFill(ctx, '#e6d39f');
    ctx.fillStyle = '#8a6a3c'; ctx.fillRect(hx - r + 14, hy - 120, 2 * r - 28, 14);
  }
}

// Draw a full character. Returns metadata (e.g. spout position) in canvas px.
function drawChar(ctx, spec) {
  const meta = {};
  const pose = spec.pose || 'stand';
  ctx.save();
  if (pose === 'fallen') {
    ctx.translate(CW / 2, FEET - 125); ctx.scale(0.6, 0.6); ctx.rotate(Math.PI / 2); ctx.translate(-256, -400);
  }
  let lean = 0;
  if (pose === 'pull') lean = -0.16; if (pose === 'stumble') lean = 0.26; if (pose === 'strain') lean = -0.22;
  if (lean) { ctx.translate(256 - lean * 330, FEET); ctx.scale(0.9, 0.9); ctx.rotate(lean); ctx.translate(-256, -FEET); }
  const hx = 256, hy = 210, r = 150, bx = 256, by = 470;
  // legs
  let legs = [[[230, 555], [214, FEET]], [[282, 555], [298, FEET]]];
  if (pose === 'walk1' || pose === 'pull' || pose === 'strain') legs = [[[230, 555], [170, FEET]], [[282, 555], [340, FEET]]];
  if (pose === 'walk2') legs = [[[230, 555], [250, FEET]], [[282, 555], [262, FEET]]];
  if (pose === 'stumble') legs = [[[230, 555], [150, FEET - 10]], [[282, 555], [310, FEET]]];
  for (const [a, b] of legs) { line(ctx, [a, b], 12); line(ctx, [b, [b[0] + 22, b[1]]], 12); }
  // back arm items
  if (spec.staff) drawStaff(ctx, 380, 470);
  headwear(ctx, spec, hx, hy, r, 'back');
  body(ctx, spec, bx, by);
  // arms
  const SL = [176, 420], SR = [336, 420];
  switch (pose) {
    case 'pull': case 'strain':
      line(ctx, [SL, [300, 470], [470, 452]], 12); line(ctx, [SR, [400, 470], [478, 470]], 12);
      circle(ctx, 476, 460, 14, '#ffffff', 8); break;
    case 'pour': {
      line(ctx, [SL, [150, 520], [196, 560]], 12);
      line(ctx, [SR, [396, 430], [404, 392]], 12);
      drawJug(ctx, 400, 380, 0.95, 2.0);
      const a = 2.0, s = 0.95; meta.spout = [400 + (0 * Math.cos(a) - (-86) * Math.sin(a)) * s, 380 + (0 * Math.sin(a) + (-86) * Math.cos(a)) * s];
      break; }
    case 'hold':
      line(ctx, [SL, [150, 520], [196, 560]], 12);
      line(ctx, [SR, [380, 500], [390, 470]], 12);
      drawJug(ctx, 410, 470, 0.95, 0.1); break;
    case 'shrug':
      line(ctx, [SL, [100, 440], [86, 360]], 12); line(ctx, [SR, [412, 440], [426, 360]], 12);
      line(ctx, [[66, 350], [106, 350]], 10); line(ctx, [[406, 350], [446, 350]], 10);
      drawJug(ctx, 440, 470, 0.8, 0.15); break;
    case 'point':
      line(ctx, [SL, [150, 520], [190, 560]], 12);
      line(ctx, [SR, [420, 360], [490, 300]], 12); circle(ctx, 492, 298, 12, '#ffffff', 7); break;
    case 'stumble':
      line(ctx, [SL, [110, 360], [60, 320]], 12); line(ctx, [SR, [420, 380], [480, 330]], 12); break;
    case 'fist':
      line(ctx, [SL, [140, 500], [200, 540]], 12); line(ctx, [SR, [410, 400], [400, 310]], 12); circle(ctx, 400, 300, 22, '#ffffff', 9); break;
    case 'chin':
      line(ctx, [SL, [150, 520], [196, 560]], 12); line(ctx, [SR, [330, 520], [300, 360]], 12); circle(ctx, 300, 352, 16, '#ffffff', 8); break;
    case 'staff':
      line(ctx, [SL, [140, 500], [200, 540]], 12); line(ctx, [SR, [380, 480], [380, 470]], 12); circle(ctx, 380, 470, 16, '#ffffff', 8); break;
    default:
      line(ctx, [SL, [150, 520], [196, 560]], 12); line(ctx, [SR, [362, 520], [316, 560]], 12);
  }
  // head
  circle(ctx, hx, hy, r, spec.faceColor || '#ffffff', 12);
  if (spec.faceColor && spec.faceColor !== '#ffffff') {
    ctx.save(); ctx.beginPath(); ctx.arc(hx, hy, r - 6, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.arc(hx + 40, hy + 50, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    circle(ctx, hx, hy, r, null, 12);
  }
  headwear(ctx, spec, hx, hy, r, 'front');
  face(ctx, spec, hx, hy);
  if (spec.sweat) {
    ctx.beginPath(); ctx.moveTo(hx + 128, hy - 92); ctx.quadraticCurveTo(hx + 150, hy - 50, hx + 128, hy - 40); ctx.quadraticCurveTo(hx + 106, hy - 50, hx + 128, hy - 92); strokeFill(ctx, '#7fd0ff', 7);
  }
  ctx.restore();
  if (spec.steam) { cloud(ctx, 90, 70, 1.25); cloud(ctx, 420, 60, 1.35); cloud(ctx, 256, 22, 0.9); }
  return meta;
}

export function charTex(spec) {
  const key = JSON.stringify(spec);
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas'); c.width = CW; c.height = CH;
  const ctx = c.getContext('2d');
  const meta = drawChar(ctx, spec);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.generateMipmaps = true;
  const v = { tex, meta };
  cache.set(key, v);
  return v;
}

// A billboard character: plane always turning to the camera around Y.
const geoCache = new Map();
export class Char {
  constructor(spec, height = 1.9) {
    this.spec = { ...spec };
    this.h = height;
    if (!geoCache.has(height)) {
      const w = height * CW / CH;
      const g = new THREE.PlaneGeometry(w, height);
      g.translate(0, height / 2 - height * (CH - FEET) / CH, 0);
      geoCache.set(height, g);
    }
    this.mat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, fog: true });
    this.mesh = new THREE.Mesh(geoCache.get(height), this.mat);
    this.flip = false;
    this.set({});
  }
  set(changes) {
    Object.assign(this.spec, changes);
    const { tex, meta } = charTex(this.spec);
    if (this.mat.map !== tex) { this.mat.map = tex; this.mat.needsUpdate = true; }
    this.meta = meta;
  }
  face(camera, flip = false) {
    const p = new THREE.Vector3(); this.mesh.getWorldPosition(p);
    const c = camera.position;
    let yaw = Math.atan2(c.x - p.x, c.z - p.z);
    const parent = this.mesh.parent;
    if (parent) { const q = new THREE.Quaternion(); parent.getWorldQuaternion(q); const e = new THREE.Euler().setFromQuaternion(q, 'YXZ'); yaw -= e.y; }
    this.mesh.rotation.set(0, yaw, 0);
    this.mesh.scale.x = flip ? -1 : 1;
    this.flip = flip;
  }
  // canvas px -> world position
  worldPoint(px, py) {
    const w = this.h * CW / CH;
    const v = new THREE.Vector3((px / CW - 0.5) * w, (FEET - py) / CH * this.h, 0.01);
    this.mesh.updateMatrixWorld(true);
    return this.mesh.localToWorld(v);
  }
}
