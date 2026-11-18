// 2D-Ebene: Einblendungen, Untertitel, Nachbearbeitung, reine 2D-Szenen
import * as C from './chars.js';
export const W = 1080, H = 1920;
const RED = '#ff2b2b', HRED = '#d8202a';
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const L = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const back = t => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

// ------------------------------------------------------------------ Nachbearbeitung
const grains = [];
export function initPost() {
  for (let k = 0; k < 6; k++) {
    const c = C.cv(540, 960), g = c.getContext('2d'), d = g.createImageData(540, 960);
    for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    g.putImageData(d, 0, 0); grains.push(c);
  }
}
export function post(g, t, { vig = 0.55, tint = 0, flash = 0 } = {}) {
  if (tint > 0) {
    g.save(); g.globalCompositeOperation = 'multiply'; const k = clamp(tint);
    g.fillStyle = `rgb(255,${Math.round(255 - 205 * k)},${Math.round(255 - 210 * k)})`; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'screen'; g.fillStyle = `rgba(120,0,0,${0.25 * k})`; g.fillRect(0, 0, W, H); g.restore();
  }
  const vg = g.createRadialGradient(W / 2, H * 0.48, H * 0.22, W / 2, H * 0.5, H * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${vig})`); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = 0.07; g.globalCompositeOperation = 'overlay'; g.drawImage(grains[Math.floor(t * 30) % grains.length], 0, 0, W, H); g.restore();
  if (flash > 0) { g.fillStyle = `rgba(255,235,225,${flash * 0.8})`; g.fillRect(0, 0, W, H); }
}

// ------------------------------------------------------------------ Bausteine
function pill(g, text, cx, cy, { font = '800 19px Montserrat', bg = HRED, fg = '#fff', padX = 18, h = 34, border = null, dot = null } = {}) {
  g.font = font; const tw = g.measureText(text).width, dw = dot ? 20 : 0, w = tw + padX * 2 + dw;
  g.beginPath(); g.roundRect(cx - w / 2, cy - h / 2, w, h, h / 2); g.fillStyle = bg; g.fill();
  if (border) { g.lineWidth = 2.5; g.strokeStyle = border; g.stroke(); }
  if (dot) { g.fillStyle = dot; g.beginPath(); g.arc(cx - w / 2 + padX + 5, cy, 6, 0, 7); g.fill(); }
  g.fillStyle = fg; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(text, cx - w / 2 + padX + dw, cy + 1);
  return w;
}
export function header(g, monster, clock) {
  g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 10;
  pill(g, `HORROR ROULETTE  •  ${monster}`, W / 2, 58, { font: '800 19px Montserrat', h: 36 });
  if (clock) pill(g, clock, W / 2, 98, { font: '800 18px Montserrat', bg: 'rgba(18,18,22,.88)', h: 32, padX: 14, dot: '#ff3030' });
  g.restore();
}
function words(g, ws, cx, cy, size, maxW) {
  g.font = `${size}px Anton`; const sp = size * 0.25;
  let tw = ws.reduce((a, w) => a + g.measureText(w.w).width, 0) + sp * (ws.length - 1);
  if (tw > maxW) { size *= maxW / tw; g.font = `${size}px Anton`; tw = maxW; }
  let x = cx - tw / 2; g.textBaseline = 'middle'; g.textAlign = 'left';
  for (const w of ws) {
    g.lineWidth = size * 0.1; g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineJoin = 'round'; g.strokeText(w.w, x, cy);
    g.fillStyle = w.red ? RED : '#fff'; g.fillText(w.w, x, cy); x += g.measureText(w.w).width + sp;
  }
}
let CH = null;
export function subtitles(g, t, TL) {
  if (!CH) { CH = []; for (const s of TL.shots) for (const sg of s.segs) for (const c of sg.chunks) CH.push({ ...c, segE: sg.e }); CH.sort((a, b) => a.s - b.s);
    CH.forEach((c, i) => c.until = Math.min(CH[i + 1] ? CH[i + 1].s : 1e9, c.segE + 0.45)); }
  const c = CH.find(c => t >= c.s && t < c.until); if (!c) return;
  const k = clamp((t - c.s) / 0.09), sc = L(1.12, 1, easeOut(k));
  g.save(); g.translate(W / 2, H * 0.815); g.scale(sc, sc); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 14; g.shadowOffsetY = 4;
  words(g, c.words, 0, 0, 74, W * 0.84); g.restore();
}
export function card(g, t, cd, shot) {
  if (!cd || t < cd.t) return;
  const k = easeOut(clamp((t - cd.t) / 0.25));
  let v = cd.v;
  if (v === 'countdown') { const rem = Math.max(0, 299 - Math.floor(t - shot.s)); v = `0${Math.floor(rem / 60)}:${String(rem % 60).padStart(2, '0')}`; }
  g.save(); g.globalAlpha = k; g.translate(0, (1 - k) * -20);
  if (cd.k === 'STIMMEN-MATCH') { pill(g, `${cd.k}  ·  ${v}`, W / 2, 190, { font: '400 30px Anton', bg: 'rgba(14,14,18,.85)', border: 'rgba(255,255,255,.7)', h: 50, padX: 24 }); g.restore(); return; }
  const x = cd.k === 'SONNENAUFGANG IN' ? 60 : W - 380, y = 160, w = 320, h = 118;
  g.beginPath(); g.roundRect(x, y, w, h, 16); g.fillStyle = 'rgba(14,14,18,.86)'; g.fill(); g.lineWidth = 3; g.strokeStyle = cd.k === 'SONNENAUFGANG IN' ? '#e9b949' : 'rgba(255,255,255,.75)'; g.stroke();
  g.fillStyle = '#e9b949'; g.font = '800 17px Montserrat'; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(cd.k, x + 22, y + 18);
  g.fillStyle = '#fff'; g.font = '400 54px Anton'; g.fillText(v, x + 22, y + 44);
  g.restore();
}
export function rule(g, t, r) {
  if (!r || t < r.t) return;
  const k = clamp((t - r.t) / 0.35), s = back(k);
  g.save(); g.translate(W / 2, H * 0.31); g.rotate(-0.045); g.scale(s, s); g.globalAlpha = clamp(k * 3);
  g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 24; g.shadowOffsetY = 8;
  g.font = '400 50px Anton'; const w = Math.max(520, g.measureText(r.text).width + 80);
  g.beginPath(); g.roundRect(-w / 2, -70, w, 150, 12); g.fillStyle = '#f7f3ea'; g.fill(); g.shadowColor = 'transparent';
  g.beginPath(); g.roundRect(-w / 2, -70, w, 56, [12, 12, 0, 0]); g.fillStyle = HRED; g.fill();
  g.fillStyle = '#fff'; g.font = '400 34px Anton'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(r.title, 0, -41);
  g.fillStyle = '#16120f'; g.font = '400 50px Anton'; g.fillText(r.text, 0, 34);
  g.lineWidth = 3; g.strokeStyle = '#16120f'; g.beginPath(); g.roundRect(-w / 2, -70, w, 150, 12); g.stroke();
  g.restore();
}
export function measure(g, a, b, label, k) {
  if (!a || k <= 0) return;
  const y2 = L(a.y, b.y, k);
  g.save(); g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 5; g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 8;
  g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, y2); g.stroke();
  for (const y of [a.y, y2]) { g.beginPath(); g.moveTo(a.x - 22, y); g.lineTo(a.x + 22, y); g.stroke(); }
  if (k > 0.9) { pill(g, label, a.x - 105, (a.y + y2) / 2, { font: '400 40px Anton', bg: 'rgba(14,14,18,.88)', h: 60, padX: 20, border: 'rgba(255,255,255,.8)' }); }
  g.restore();
}

// ------------------------------------------------------------------ 2D-Szenen
const ROSTER = ['SKINWALKER', 'MOTHMAN', 'SLENDER MAN', 'SIREN HEAD', 'WENDIGO', 'THE SMILER', 'HACHISHAKUSAMA', 'MOMO'];
const RING = ['#a35cff', '#3fe08a', '#43d4ff', '#ff5ca8', '#3fe08a', '#a35cff', '#ff5ca8', '#43d4ff'];
let MON = null;
export function roulette(g, t, tEnd, monster = 'HACHISHAKUSAMA') {
  // Neue Monster (z. B. Zuschauerwuensche) ersetzen den letzten Platz im Band
  if (!ROSTER.includes(monster) && C.MONSTERS[monster]) { ROSTER[7] = monster; MON = null; }
  if (!MON) MON = ROSTER.map(n => C.MONSTERS[n]());
  const SP = 480, TARGET = Math.max(0, ROSTER.indexOf(monster)) + 16, tLand = tEnd - 0.35;
  const off = SP * TARGET * easeOut(clamp(t / tLand)) ** 1.0;
  const locked = t >= tLand, lk = clamp((t - tLand) / 0.4);
  g.fillStyle = '#101116'; g.fillRect(0, 0, W, H);
  const top = g.createLinearGradient(0, 0, 0, 420); top.addColorStop(0, '#2a0b0d'); top.addColorStop(1, '#121318'); g.fillStyle = top; g.fillRect(0, 0, W, 420);
  const i0 = Math.floor((off - W / 2) / SP) - 1;
  for (let i = i0; i < i0 + 5; i++) {
    const x = W / 2 + i * SP - off, idx = ((i % 8) + 8) % 8, sel = locked && i === TARGET;
    g.fillStyle = '#1b1d23'; g.fillRect(x - 220, 420, 440, 1060);
    g.fillStyle = '#23262e'; g.fillRect(x - 130, 560, 260, 880); g.strokeStyle = '#0c0d10'; g.lineWidth = 6; g.strokeRect(x - 130, 560, 260, 880);
    g.fillStyle = '#0c0d10'; g.fillRect(x - 55, 600, 110, 80); g.fillStyle = '#3a3e48'; for (let b = -40; b <= 40; b += 20) g.fillRect(x + b - 3, 600, 6, 80);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.font = '800 26px Montserrat'; g.textAlign = 'center'; g.fillText(`ZELLE 0${40 + idx * 7}`, x, 730);
    g.fillStyle = '#08090b'; g.fillRect(x + 220, 420, 40, 1060);
    if (i % 2 === 0) { g.fillStyle = '#4a0c10'; g.fillRect(x + 140, 470, 200, 64); g.fillStyle = '#ff3b3b'; g.font = '800 22px Montserrat'; g.fillText('AUSBRUCH', x + 240, 512); }
    g.save(); g.globalCompositeOperation = 'lighter';
    const cg = g.createLinearGradient(0, 420, 0, 1440); cg.addColorStop(0, sel ? 'rgba(255,90,80,.36)' : 'rgba(255,250,235,.30)'); cg.addColorStop(1, 'rgba(255,250,235,.02)');
    g.fillStyle = cg; g.beginPath(); g.moveTo(x - 34, 430); g.lineTo(x + 34, 430); g.lineTo(x + 200, 1440); g.lineTo(x - 200, 1440); g.fill(); g.restore();
    g.fillStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = 30; g.beginPath(); g.roundRect(x - 36, 418, 72, 16, 8); g.fill(); g.shadowBlur = 0;
    g.fillStyle = '#17181d'; g.beginPath(); g.ellipse(x, 1440, 175, 38, 0, 0, 7); g.fill();
    g.save(); g.shadowColor = sel ? '#ff2020' : RING[idx]; g.shadowBlur = 24; g.strokeStyle = sel ? '#ff3030' : RING[idx]; g.lineWidth = 6; g.beginPath(); g.ellipse(x, 1440, 165, 32, 0, 0, 7); g.stroke(); g.restore();
    const mh = 900; g.drawImage(MON[idx], x - mh / 4, 1452 - mh, mh / 2, mh);
    g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 10; pill(g, ROSTER[idx], x, 520, { font: '800 22px Montserrat', bg: '#16171c', border: sel ? '#ff3030' : RING[idx], h: 42 }); g.restore();
  }
  const fl = g.createLinearGradient(0, 1480, 0, H); fl.addColorStop(0, '#16171c'); fl.addColorStop(1, '#060608'); g.fillStyle = fl; g.fillRect(0, 1480, W, H - 1480);
  g.save(); g.beginPath(); g.rect(0, 1520, W, 30); g.clip(); g.fillStyle = '#e8b923'; g.fillRect(0, 1520, W, 30); g.fillStyle = '#111';
  for (let x = -60 - (off % 60); x < W + 60; x += 60) { g.beginPath(); g.moveTo(x, 1550); g.lineTo(x + 30, 1520); g.lineTo(x + 60, 1520); g.lineTo(x + 30, 1550); g.fill(); } g.restore();
  // Alarmlichter
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const [x0, ph] of [[210, 0], [870, 1.7]]) {
    const a = t * 3.2 + ph, al = locked ? 0.22 + 0.2 * lk : 0.16;
    g.save(); g.translate(x0, 20); g.rotate(Math.sin(a) * 0.9);
    const bg = g.createLinearGradient(0, 0, 0, 1300); bg.addColorStop(0, `rgba(255,30,30,${al})`); bg.addColorStop(1, 'rgba(255,30,30,0)');
    g.fillStyle = bg; g.beginPath(); g.moveTo(-14, 0); g.lineTo(14, 0); g.lineTo(260, 1300); g.lineTo(-260, 1300); g.fill(); g.restore();
    g.fillStyle = '#ff2a2a'; g.shadowColor = '#f00'; g.shadowBlur = 40; g.beginPath(); g.arc(x0, 18, 16, 0, 7); g.fill(); g.shadowBlur = 0;
  }
  g.restore();
  // Titel
  g.save(); g.font = '800 82px Montserrat'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 16;
  const w1 = g.measureText('Horror ').width, w2 = g.measureText('ROULETTE').width, x = W / 2 - (w1 + w2) / 2;
  g.fillStyle = '#fff'; g.fillText('Horror ', x, 300); g.fillStyle = '#e3262b'; g.fillText('ROULETTE', x + w1, 300); g.restore();
  // Zeiger
  g.save(); g.fillStyle = g.strokeStyle = '#f5c518'; g.lineWidth = 5; g.shadowColor = '#f5c518'; g.shadowBlur = 12;
  g.beginPath(); g.moveTo(W / 2, 470); g.lineTo(W / 2, 1560); g.stroke();
  for (const [y, d] of [[462, 1], [1568, -1]]) { g.beginPath(); g.moveTo(W / 2 - 16, y); g.lineTo(W / 2 + 16, y); g.lineTo(W / 2, y + 26 * d); g.fill(); }
  g.restore();
  if (locked) { g.fillStyle = `rgba(255,20,20,${0.25 * (0.5 + 0.5 * Math.sin((t - tLand) * 18)) * (1 - lk * 0.5)})`; g.fillRect(0, 0, W, H); }
}

function redSky(g, t) {
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#3d0608'); sky.addColorStop(0.55, '#a8211b'); sky.addColorStop(0.8, '#d5442c'); sky.addColorStop(1, '#2a0405');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { const a = -0.5 + i * 0.25 + Math.sin(t * 0.3 + i) * 0.03;
    g.save(); g.translate(W / 2, -200); g.rotate(a); const rg = g.createLinearGradient(0, 0, 0, 2200); rg.addColorStop(0, 'rgba(255,120,90,.10)'); rg.addColorStop(1, 'rgba(255,120,90,0)'); g.fillStyle = rg; g.fillRect(-50, 0, 100, 2200); g.restore(); }
  g.restore();
}
let HT = null, HG = null, BOYB = null;
export function redTall(g, p, t) {
  if (!HT) { HT = C.hachi('smile'); BOYB = C.boy('back'); }
  redSky(g, t);
  const e = ease(p), hh = 2350, top = L(-hh + 1700, 110, e);
  g.fillStyle = '#4a0709'; for (let i = 0; i < 14; i++) { const x = i * 90 - 30, h = 260 + ((i * 53) % 140), yb = top + hh - 30 + 150; g.beginPath(); g.moveTo(x - 80, yb); g.lineTo(x, yb - h); g.lineTo(x + 80, yb); g.fill(); }
  g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 40; g.drawImage(HT, W / 2 - hh / 6, top, hh / 3, hh); g.restore();
  const bh = hh * 1.35 / 2.5; g.drawImage(BOYB, W / 2 + 160, top + hh - bh, bh / 2, bh);
  g.fillStyle = 'rgba(30,0,0,.9)'; g.fillRect(0, top + hh - 8, W, H);
}
export function redFace(g, p, t) {
  if (!HG) HG = C.hachi('glow');
  redSky(g, t);
  const s = L(1.0, 1.18, ease(p)), jx = Math.sin(t * 37) * 2, jy = Math.cos(t * 29) * 2;
  g.save(); g.translate(W / 2 + jx, H * 0.44 + jy); g.scale(s, s);
  const sw = 1500, sh = sw * 1536 / 512 * (1); g.drawImage(HG, -sw / 2, -sh * 0.215, sw, sh); g.restore();
}
let CONF = null;
export function cta(g, p, t, tl) {
  if (!CONF) { CONF = []; let s = 3; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 90; i++) CONF.push({ x: r() * W, y: r() * H, v: 120 + r() * 200, c: ['#ff3b5c', '#3fe0d0', '#f5c518', '#fff'][i % 4], a: r() * 6, w: 8 + r() * 10 }); }
  g.fillStyle = '#12131a'; g.fillRect(0, 0, W, H);
  g.save(); g.globalCompositeOperation = 'lighter'; const cg = g.createLinearGradient(0, 0, 0, H); cg.addColorStop(0, 'rgba(255,255,255,.14)'); cg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = cg; g.beginPath(); g.moveTo(W / 2 - 90, 0); g.lineTo(W / 2 + 90, 0); g.lineTo(W / 2 + 460, H); g.lineTo(W / 2 - 460, H); g.fill(); g.restore();
  for (const c of CONF) { const y = (c.y + c.v * t) % H; g.save(); g.translate(c.x + Math.sin(t * 2 + c.a) * 20, y); g.rotate(c.a + t * 3); g.fillStyle = c.c; g.fillRect(-c.w / 2, -3, c.w, 6); g.restore(); }
  g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 5;
  for (const [x, y, dx, dy] of [[40, 40, 1, 1], [W - 40, 40, -1, 1], [40, H - 40, 1, -1], [W - 40, H - 40, -1, -1]]) { g.beginPath(); g.moveTo(x, y + dy * 70); g.lineTo(x, y); g.lineTo(x + dx * 70, y); g.stroke(); }
  g.fillStyle = '#ff3030'; g.beginPath(); g.arc(90, 96, 9, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '800 26px Montserrat'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('LIVE', 108, 97);
  const k = easeOut(clamp(p / 0.15));
  g.save(); g.globalAlpha = k; g.font = '400 118px Anton'; g.textAlign = 'left'; const a = 'WER IST ALS ', b = 'NÄCHSTES?', wa = g.measureText(a).width, wb = g.measureText(b).width;
  let s = Math.min(1, (W * 0.9) / (wa + wb)); g.translate(W / 2, 520); g.scale(s, s); g.fillStyle = '#fff'; g.fillText(a, -(wa + wb) / 2, 0); g.fillStyle = '#ff2b4a'; g.fillText(b, -(wa + wb) / 2 + wa, 0); g.restore();
  g.save(); g.translate(W / 2, 900); const pr = 1 + Math.sin(t * 5) * 0.02; g.scale(pr, pr);
  g.shadowColor = '#ff2b4a'; g.shadowBlur = 50; g.lineWidth = 16; g.strokeStyle = '#ff2b4a'; g.beginPath(); g.arc(0, 0, 220, 0, 7); g.stroke(); g.shadowBlur = 0;
  g.beginPath(); g.arc(0, 0, 205, 0, 7); g.fillStyle = '#1b1c24'; g.fill(); g.clip();
  g.fillStyle = '#0a0a0e'; g.beginPath(); g.ellipse(0, 250, 150, 230, 0, 0, 7); g.fill(); g.beginPath(); g.arc(0, -10, 95, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.font = '400 170px Anton'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 0, 0);
  g.restore();
  const fol = p > 0.55, bk = fol ? back(clamp((p - 0.55) / 0.2)) : 1;
  g.save(); g.translate(W / 2, 1250); g.scale(bk, bk); g.beginPath(); g.roundRect(-210, -52, 420, 104, 52); g.fillStyle = fol ? '#ff2b4a' : '#ff2b4a'; g.shadowColor = '#ff2b4a'; g.shadowBlur = 30; g.fill(); g.shadowBlur = 0;
  g.fillStyle = '#fff'; g.font = '900 44px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(fol ? 'GEFOLGT  ✓' : 'FOLGEN  +', 0, 2); g.restore();
}
export function endcard(g, p) {
  g.fillStyle = '#161722'; g.fillRect(0, 0, W, H);
  const k = easeOut(clamp(p / 0.3));
  g.save(); g.globalAlpha = k; g.font = '800 74px Montserrat'; g.textBaseline = 'middle'; g.textAlign = 'left';
  const w1 = g.measureText('Horror ').width, w2 = g.measureText('ROULETTE').width, x = W / 2 - (w1 + w2) / 2;
  g.fillStyle = '#fff'; g.fillText('Horror ', x, 820); g.fillStyle = '#e3262b'; g.fillText('ROULETTE', x + w1, 820);
  for (const [dx, col] of [[-5, '#25f4ee'], [5, '#fe2c55'], [0, '#fff']]) { g.beginPath(); g.roundRect(W / 2 - 300 + dx, 960, 600, 92, 14); g.lineWidth = 6; g.strokeStyle = col; g.stroke(); }
  g.fillStyle = '#fff'; g.beginPath(); g.roundRect(W / 2 - 297, 963, 594, 86, 12); g.fill();
  g.strokeStyle = '#161722'; g.lineWidth = 6; g.beginPath(); g.arc(W / 2 - 240, 1000, 18, 0, 7); g.stroke(); g.beginPath(); g.moveTo(W / 2 - 227, 1013); g.lineTo(W / 2 - 212, 1028); g.stroke();
  g.fillStyle = '#161722'; g.font = '700 40px Montserrat'; g.textAlign = 'center'; g.fillText('@interestingstuff', W / 2 + 10, 1008);
  g.restore();
}
