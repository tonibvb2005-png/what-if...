// Folge 6 – Verity: Kinderzimmer mit PC (Bildschirm als Live-Textur), Kueche am Morgen + 2D-Szenen
import * as THREE from 'three';
import * as C from '../chars.js';
import { tex, lam, box, sprite, setTex, glow, gradTex, V, L, clamp, sm, lerpV, look, billboard, shake, rnd, ease } from '../world.js';
import { W as CW, H as CH } from '../overlay.js';

const easeOut = t => 1 - Math.pow(1 - t, 3);
function fov(cam, f) { if (cam.fov !== f) { cam.fov = f; cam.updateProjectionMatrix(); } }
const basic = c => new THREE.MeshBasicMaterial({ color: c });
const CY = '#39e4ff';

// ------------------------------------------------------------------ Spiel-Bildschirm (wird auf Monitor, 2D-Szenen und Tablet benutzt)
const FACES = {}; const face = m => FACES[m] || (FACES[m] = C.verityFace(m, 512));
function gameBG(g, w, h, t) {
  const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#6fc3ff'); sky.addColorStop(1, '#bfe6ff'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff8'; for (let i = 0; i < 4; i++) { const x = ((i * 0.3 + t * 0.01) % 1.2) * w - 60; g.beginPath(); g.ellipse(x, h * 0.18 + i * 14, 60, 18, 0, 0, 7); g.fill(); }
  g.fillStyle = '#5bbf6a'; g.beginPath(); g.moveTo(0, h * 0.7); g.quadraticCurveTo(w * 0.3, h * 0.55, w * 0.6, h * 0.68); g.quadraticCurveTo(w * 0.85, h * 0.78, w, h * 0.62); g.lineTo(w, h); g.lineTo(0, h); g.fill();
  g.fillStyle = '#3f9e52'; g.fillRect(0, h * 0.82, w, h * 0.18);
  // Haus im Bau (eigene Optik: Holzbalken + Dach)
  const hx = w * 0.42, hy = h * 0.66, hw = w * 0.22, hh = h * 0.2; const prog = (t * 0.25) % 1;
  g.fillStyle = '#c98f56'; g.fillRect(hx, hy - hh, hw, hh); g.strokeStyle = '#7a5232'; g.lineWidth = Math.max(2, w * 0.006); g.strokeRect(hx, hy - hh, hw, hh);
  g.fillStyle = '#7fd3ff'; g.fillRect(hx + hw * 0.18, hy - hh * 0.7, hw * 0.24, hh * 0.3);
  g.fillStyle = '#d0473c'; g.beginPath(); g.moveTo(hx - hw * 0.1, hy - hh); g.lineTo(hx + hw / 2, hy - hh - hh * 0.8 * Math.min(1, prog * 1.5)); g.lineTo(hx + hw * 1.1, hy - hh); g.fill();
}
// state: { mood, chat: [ {who:'v'|'me', text, at} ], typing, glitch, wave }
function screenUI(g, w, h, t, st = {}) {
  g.save();
  if (st.dark) { g.fillStyle = '#05070c'; g.fillRect(0, 0, w, h); }
  else gameBG(g, w, h, t);
  // Titelleiste
  g.fillStyle = 'rgba(14,16,26,.85)'; g.fillRect(0, 0, w, h * 0.09); g.fillStyle = '#fff'; g.font = `800 ${h * 0.05}px Montserrat`; g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillText('SKYBUILD', w * 0.03, h * 0.045); g.fillStyle = CY; g.textAlign = 'right'; g.fillText('● VERITY ONLINE', w * 0.97, h * 0.045);
  // Avatar-Fenster
  const s = st.big ? h * 0.8 : h * 0.42, ax = st.big ? w / 2 - s / 2 : w * 0.04, ay = st.big ? h * 0.12 : h * 0.13;
  g.fillStyle = 'rgba(14,16,26,.8)'; g.beginPath(); g.roundRect(ax - 6, ay - 6, s + 12, s + 12, s * 0.08); g.fill();
  g.save(); g.beginPath(); g.roundRect(ax, ay, s, s, s * 0.07); g.clip();
  const bgc = g.createLinearGradient(0, ay, 0, ay + s); bgc.addColorStop(0, st.dark ? '#120f08' : '#2b2350'); bgc.addColorStop(1, st.dark ? '#050403' : '#141028'); g.fillStyle = bgc; g.fillRect(ax, ay, s, s);
  const bob = Math.sin(t * 2.2) * s * 0.01;
  g.drawImage(face(st.mood || 'happy'), ax + s * 0.08, ay + s * 0.08 + bob, s * 0.84, s * 0.84);
  if (st.wave) { const a = Math.sin(t * 9) * 0.35; g.save(); g.translate(ax + s * 0.85, ay + s * 0.78); g.rotate(a); g.fillStyle = '#ffd21f'; g.strokeStyle = '#1c1512'; g.lineWidth = s * 0.012; g.beginPath(); g.roundRect(-s * 0.06, -s * 0.2, s * 0.12, s * 0.2, s * 0.05); g.fill(); g.stroke(); g.beginPath(); g.arc(0, -s * 0.22, s * 0.07, 0, 7); g.fill(); g.stroke(); g.restore(); }
  g.restore();
  // Chat
  if (st.chat && st.chat.length) {
    const cx = st.big ? w * 0.06 : w * 0.38, cw = st.big ? w * 0.88 : w * 0.58, fs = h * 0.062; let y = st.big ? h * 0.72 : h * 0.16;
    for (const m of st.chat) {
      if (m.at !== undefined && t < m.at) continue;
      const n = m.at !== undefined ? Math.floor(clamp((t - m.at) * 18 / m.text.length) * m.text.length) : m.text.length, txt = m.text.slice(0, n);
      g.font = `700 ${fs}px Montserrat`; const tw = Math.min(cw, g.measureText(m.text).width + fs * 1.2);
      const bx = m.who === 'me' ? cx + cw - tw : cx; g.fillStyle = m.who === 'me' ? 'rgba(255,255,255,.92)' : 'rgba(25,20,48,.9)';
      g.beginPath(); g.roundRect(bx, y, tw, fs * 1.8, fs * 0.6); g.fill(); g.fillStyle = m.who === 'me' ? '#1a1a22' : '#e9f8ff'; g.textAlign = 'left'; g.fillText(txt, bx + fs * 0.6, y + fs * 0.92);
      y += fs * 2.2;
    }
    if (st.typing) { g.fillStyle = 'rgba(25,20,48,.9)'; g.beginPath(); g.roundRect(cx, y, fs * 3.2, fs * 1.6, fs * 0.6); g.fill(); g.fillStyle = CY; for (let i = 0; i < 3; i++) { g.globalAlpha = 0.4 + 0.6 * ((Math.sin(t * 8 - i) + 1) / 2); g.beginPath(); g.arc(cx + fs * (0.8 + i * 0.8), y + fs * 0.8, fs * 0.22, 0, 7); g.fill(); } g.globalAlpha = 1; }
  }
  g.restore();
  if (st.glitch) glitch(g, w, h, t, st.glitch);
}
function glitch(g, w, h, t, amt) {
  const n = Math.floor(3 + amt * 10), seed = Math.floor(t * 12);
  for (let i = 0; i < n; i++) { const r = ((seed * 9301 + i * 49297) % 233280) / 233280, y = r * h, hh = h * (0.02 + 0.06 * ((i * 7 + seed) % 5) / 5), dx = (r - 0.5) * w * 0.12 * amt;
    try { g.drawImage(g.canvas, 0, y, w, hh, dx, y, w, hh); } catch (e) {} }
  g.fillStyle = `rgba(57,228,255,${0.08 * amt})`; g.fillRect(0, 0, w, h);
  g.fillStyle = `rgba(255,0,80,${0.06 * amt})`; g.fillRect(((t * 300) % w), 0, w * 0.05, h);
}

// ------------------------------------------------------------------ 3D: Kinderzimmer + Kueche
function buildHouse() {
  const S = new THREE.Scene();
  const BG = { night: gradTex([[0, '#03050c'], [1, '#0b1428']]), dawn: gradTex([[0, '#8fa8d8'], [1, '#f2c79a']]) };
  S.background = BG.night;
  const hemi = new THREE.HemisphereLight(0x4a5a8a, 0x141018, 0.35); S.add(hemi);
  const moon = new THREE.DirectionalLight(0x8fa4e0, 0.35); moon.position.set(-10, 6, 2); S.add(moon);
  // Zimmer: x -4..4, z -4..4, h 3; Fenster in Wand x=-4
  const wall = lam(0x6d7fa3), floorM = lam(0x8a6a4e);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), floorM); fl.rotation.x = -Math.PI / 2; S.add(fl);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), lam(0x55617c)); ceil.rotation.x = Math.PI / 2; ceil.position.y = 3; S.add(ceil);
  S.add(box(8, 3, 0.1, wall, 0, 1.5, -4), box(8, 3, 0.1, wall, 0, 1.5, 4), box(0.1, 3, 8, wall, 4, 1.5, 0));
  S.add(box(0.1, 0.9, 8, wall, -4, 0.45, 0), box(0.1, 0.8, 8, wall, -4, 2.6, 0), box(0.1, 1.3, 2.6, wall, -4, 1.55, -2.7), box(0.1, 1.3, 2.6, wall, -4, 1.55, 2.7));
  for (const z of [-1.4, 0, 1.4]) S.add(box(0.12, 1.3, 0.08, lam(0xe8e4dc), -4, 1.55, z)); S.add(box(0.12, 0.08, 2.9, lam(0xe8e4dc), -4, 0.92, 0), box(0.12, 0.08, 2.9, lam(0xe8e4dc), -4, 2.2, 0));
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshBasicMaterial({ map: gradTex([[0, '#02040a'], [1, '#0d1a36']]) })); sky.rotation.y = Math.PI / 2; sky.position.set(-6, 1.6, 0); S.add(sky);
  const stars = new THREE.Group(); for (let i = 0; i < 60; i++) { const st = box(0.02, 0.02, 0.02, basic(0xffffff), -5.9, 1 + rnd() * 2.5, -2 + rnd() * 4); stars.add(st); } S.add(stars);
  // Bett links
  S.add(box(1.4, 0.45, 2.4, lam(0x5a4030), -3.2, 0.22, 1.6), box(1.35, 0.18, 2.3, lam(0xe8e4dc), -3.2, 0.52, 1.6), box(1.36, 0.14, 1.6, lam(0x3a6ea8), -3.2, 0.66, 1.95), box(0.6, 0.15, 0.4, lam(0xf2f2ee), -3.2, 0.68, 0.6));
  // Poster + Regal
  const pc = C.cv(200, 280), pg = pc.getContext('2d'); pg.fillStyle = '#1b1530'; pg.fillRect(0, 0, 200, 280); pg.fillStyle = '#ffd24a'; pg.font = '400 44px Anton'; pg.textAlign = 'center'; pg.fillText('SPACE', 100, 70); pg.fillStyle = '#ff6a3d'; pg.beginPath(); pg.arc(100, 170, 60, 0, 7); pg.fill();
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.1), new THREE.MeshLambertMaterial({ map: tex(pc) })); poster.position.set(-1.6, 1.8, -3.94); S.add(poster);
  S.add(box(1.6, 0.06, 0.35, lam(0x8a6a4e), 3.1, 1.9, -1)); for (let i = 0; i < 7; i++) S.add(box(0.12, 0.3, 0.25, lam([0xd94a3a, 0x3a7ad9, 0xe8c040, 0x4ab06a][i % 4]), 2.5 + i * 0.17, 2.08, -1));
  // Schreibtisch + PC
  S.add(box(2.0, 0.06, 0.8, lam(0xe6e2da), 1.5, 0.75, -3.5)); for (const x of [0.6, 2.4]) S.add(box(0.06, 0.75, 0.75, lam(0xbdb8ae), x, 0.37, -3.5));
  S.add(box(0.95, 0.6, 0.05, lam(0x15161a), 1.5, 1.2, -3.62), box(0.1, 0.2, 0.1, lam(0x15161a), 1.5, 0.88, -3.65), box(0.35, 0.03, 0.2, lam(0x15161a), 1.5, 0.79, -3.65));
  const scrC = C.cv(768, 432), scrG = scrC.getContext('2d'); const scrT = tex(scrC);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 0.495), new THREE.MeshBasicMaterial({ map: scrT })); scr.position.set(1.5, 1.2, -3.592); S.add(scr);
  S.add(box(0.6, 0.03, 0.2, lam(0x22242a), 1.5, 0.79, -3.25), box(0.08, 0.03, 0.12, lam(0x22242a), 2.0, 0.79, -3.25));
  const tower = box(0.22, 0.5, 0.5, lam(0x1a1b20), 2.75, 0.25, -3.4); S.add(tower); const led = box(0.005, 0.25, 0.02, basic(0x39e4ff), 2.86, 0.3, -3.16); S.add(led);
  const screenL = new THREE.PointLight(0x7fd6ff, 5, 6, 1.4); screenL.position.set(1.5, 1.2, -3.0); S.add(screenL);
  const chair = new THREE.Group(); chair.add(box(0.55, 0.08, 0.55, lam(0x2a2d3a), 0, 0.5, 0), box(0.55, 0.7, 0.08, lam(0x2a2d3a), 0, 0.9, 0.27), box(0.06, 0.5, 0.06, lam(0x444), 0, 0.25, 0)); chair.position.set(1.5, 0, -2.75); S.add(chair);
  // Kabel + Stecker am Boden
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.2, 6), lam(0x111111)); cable.rotation.z = Math.PI / 2; cable.position.set(2.2, 0.02, -2.9); S.add(cable);
  const plug = box(0.06, 0.04, 0.09, lam(0xf0f0ea), 1.58, 0.03, -2.9); S.add(plug);
  // Figuren
  const T = { boyB: C.boy('back'), boyF: C.boy('front', 'neutral'), boyS: C.boy('front', 'scared_sweat') };
  const boy = sprite(T.boyB, 1.35); boy.userData.noBB = true; boy.children[0].visible = false; S.add(boy);
  // Kueche bei x = 30
  const K = new THREE.Group(); K.position.set(30, 0, 0); S.add(K);
  const kw = lam(0xe8dcc4); const kf = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), lam(0xc9b8a0)); kf.rotation.x = -Math.PI / 2; K.add(kf);
  K.add(box(8, 3, 0.1, kw, 0, 1.5, -4), box(0.1, 3, 8, kw, -4, 1.5, 0), box(0.1, 3, 8, kw, 4, 1.5, 0));
  K.add(box(3, 0.9, 0.6, lam(0x6a9a8a), 1.5, 0.45, -3.6), box(3.05, 0.05, 0.65, lam(0xf2efe8), 1.5, 0.92, -3.6));
  const kwin = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), new THREE.MeshBasicMaterial({ color: 0xffe6b8 })); kwin.position.set(1.5, 1.8, -3.94); K.add(kwin);
  K.add(box(1.6, 0.06, 1.0, lam(0xb88a5a), -0.5, 0.75, -0.6)); for (const [x, z] of [[-1.2, -1], [0.2, -1], [-1.2, -0.2], [0.2, -0.2]]) K.add(box(0.06, 0.75, 0.06, lam(0x8a6a4e), x, 0.37, z));
  K.add(box(0.18, 0.12, 0.18, lam(0xffffff), -0.9, 0.84, -0.5), box(0.25, 0.02, 0.25, lam(0xf0f0ea), -0.2, 0.79, -0.7));
  const sis = sprite(C.sister(), 1.2); sis.userData.noBB = true; sis.children[0].visible = false; sis.position.set(-0.4, 0, 0.15); K.add(sis);
  const tabC = C.cv(512, 360), tabG = tabC.getContext('2d'), tabT = tex(tabC);
  K.add(box(0.36, 0.26, 0.02, lam(0x15161a), -0.4, 0.5, 0.32)); const tab = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.22), new THREE.MeshBasicMaterial({ map: tabT })); tab.position.set(-0.4, 0.5, 0.332); K.add(tab);
  const sun = new THREE.DirectionalLight(0xffd8a8, 1.4); sun.position.set(32, 5, -6); sun.target.position.set(30, 0, 0); S.add(sun, sun.target);
  const kitL = new THREE.PointLight(0xfff0d8, 3, 8, 1.2); kitL.position.set(29.5, 2.6, 0); S.add(kitL);
  return { S, BG, hemi, moon, scrC, scrG, scrT, scr, screenL, led, boy, T, chair, plug, tabC, tabG, tabT, sun, kitL, cam: new THREE.PerspectiveCamera(50, 9 / 16, 0.05, 200) };
}
export function build() { return { R: buildHouse() }; }

function drawScreen(R, t, st) { const g = R.scrG; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 768, 432);
  if (st.off) { g.fillStyle = '#050608'; g.fillRect(0, 0, 768, 432); g.fillStyle = 'rgba(255,255,255,.04)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(300, 0); g.lineTo(120, 432); g.lineTo(0, 432); g.fill(); }
  else screenUI(g, 768, 432, t, st);
  R.scrT.needsUpdate = true; }
function base(R, mode = 'night', screen = {}) {
  R.S.background = mode === 'dawn' ? R.BG.dawn : R.BG.night;
  R.hemi.intensity = mode === 'dawn' ? 1.1 : 0.35; R.moon.intensity = mode === 'dawn' ? 1.0 : 0.35; R.moon.color.set(mode === 'dawn' ? 0xffd2a0 : 0x8fa4e0);
  R.boy.visible = false; drawScreen(R, R._t || 0, screen);
  R.screenL.intensity = screen.off ? 0 : (screen.dark ? 2.5 : 5); R.led.visible = !screen.off || !!screen.ghost;
}
function boyAt(R, view, x = 1.5, z = -2.75, y = 0.05) { R.boy.visible = true; setTex(R.boy, R.T[view]); R.boy.position.set(x, y, z); R.boy.rotation.y = view === 'boyB' ? Math.PI : 0; }

export const SHOTS = {
  room_wide(W, p, t) { const R = W.R; R._t = t; base(R, 'night', { mood: 'happy' }); boyAt(R, 'boyB');
    look(R.cam, lerpV(V(-2.8, 2.2, 3.2), V(-2.2, 1.9, 2.4), ease(p)), V(1.4, 1.0, -3.2)); return { world: R, vig: 0.65 }; },
  desk_back(W, p, t, sh) { const R = W.R; R._t = t; const s1 = sh.segs[1] ? sh.segs[1].s : 1e9; base(R, 'night', { mood: 'happy', wave: t > s1 - 0.3, chat: t > s1 ? [{ who: 'v', text: 'Hallo! Ich bin Verity :)', at: s1 }] : [] }); boyAt(R, 'boyB');
    const k = ease(sm(0.0, 1, p)); look(R.cam, lerpV(V(2.4, 1.75, -1.4), V(1.8, 1.4, -2.35), k), lerpV(V(1.3, 1.15, -3.5), V(1.5, 1.2, -3.6), k)); return { world: R, vig: 0.6 }; },
  boy_face(W, p, t) { const R = W.R; R._t = t; base(R, 'night', { mood: 'happy', dark: true }); boyAt(R, 'boyF', 1.5, -2.75); R.screenL.intensity = 2.5; fov(R.cam, 72);
    look(R.cam, V(1.5, 1.05, L(-3.45, -3.52, ease(p))), V(1.5, 0.95, -2.75)); return { world: R, vig: 0.8 }; },
  boy_rule(W, p, t) { const R = W.R; R._t = t; base(R, 'night', { mood: 'stare', dark: true, glitch: 0.3 }); boyAt(R, 'boyS', 1.5, -2.75); R.screenL.intensity = 2.5; fov(R.cam, 74);
    look(R.cam, V(1.65, 1.1, L(-3.45, -3.52, ease(p))), V(1.5, 0.92, -2.75)); return { world: R, vig: 0.75 }; },
  room_day3(W, p, t) { const R = W.R; R._t = t; base(R, 'night', { mood: 'close', dark: true, big: true, ghost: true, glitch: 0.4 }); R.screenL.intensity = 3 + Math.sin(t * 13) * 0.6;
    look(R.cam, lerpV(V(-2.9, 0.9, 1.6), V(-2.6, 0.95, 1.2), ease(p)), V(1.5, 1.1, -3.6)); return { world: R, vig: 0.8 }; },
  room_dawn(W, p, t) { const R = W.R; R._t = t; base(R, 'dawn', { off: true });
    look(R.cam, lerpV(V(-2.8, 2.0, 3.0), V(-2.4, 1.8, 2.5), ease(p)), V(1.4, 1.0, -3.4)); return { world: R, vig: 0.4 }; },
  kitchen(W, p, t, sh) { const R = W.R; R._t = t; base(R, 'dawn', { off: true }); const s1 = sh.segs[1] ? sh.segs[1].s : 1e9, on = t > s1 - 0.2;
    const g = R.tabG; g.setTransform(1, 0, 0, 1, 0, 0); screenUI(g, 512, 360, t, { mood: 'happy', wave: on, chat: on ? [{ who: 'v', text: 'Wie heißt du?', at: s1 + 1.0 }] : [] }); R.tabT.needsUpdate = true;
    const st = sh.sfx.find(f => f.n === 'stinger'), after = st ? t - st.t : -1;
    const k = ease(sm(0.35, 1, p)); look(R.cam, lerpV(V(30.1, 1.2, 2.6), V(29.6, 0.6, 0.85), k), lerpV(V(29.6, 0.75, 0.1), V(29.6, 0.52, 0.33), k));
    return { world: R, vig: 0.5, tint: after > 0 ? 0.4 : 0, flash: after > 0 && after < 0.12 ? 1 - after / 0.12 : 0 }; },
};
for (const k of Object.keys(SHOTS)) { const f = SHOTS[k]; SHOTS[k] = (W, ...a) => { fov(W.R.cam, 50); return f(W, ...a); }; }
SHOTS._billboard = billboard; SHOTS._shake = shake;

// ------------------------------------------------------------------ 2D-Szenen
function monitorFrame(g, draw, zoom = 1) { // Bildschirm formatfuellend mit Rahmen
  g.fillStyle = '#07080c'; g.fillRect(0, 0, CW, CH);
  const w = 1000 * zoom, h = w * 9 / 16, x = CW / 2 - w / 2, y = 860 - h / 2;
  g.fillStyle = '#15161a'; g.beginPath(); g.roundRect(x - 26, y - 26, w + 52, h + 52, 24); g.fill();
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.translate(x, y); draw(g, w, h); g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; const gl = g.createRadialGradient(CW / 2, 860, 100, CW / 2, 860, 900); gl.addColorStop(0, 'rgba(60,140,255,.12)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(0, 0, CW, CH); g.restore();
}
const scrScene = st => (g, p, t, shot) => { const s = typeof st === 'function' ? st(p, t, shot) : st; monitorFrame(g, (gg, w, h) => screenUI(gg, w, h, t, s), L(1, s.zoomTo || 1.05, ease(p))); return { vig: 0.6 }; };
const help = scrScene((p, t) => ({ mood: Math.floor(t * 1.2) % 3 === 1 ? 'laugh' : 'happy', chat: [{ who: 'me', text: 'Dach fertig!' }, { who: 'v', text: 'Haha, sieht super aus!' }] }));
const know = scrScene((p, t, sh) => ({ mood: 'happy', chat: [{ who: 'me', text: 'Ich geh schlafen.' }, { who: 'v', text: 'Gute Nacht, Jonas :)', at: sh.s + 0.6 }], zoomTo: 1.25 }));
const msg = scrScene((p, t, sh) => { const s1 = sh.segs[1] ? sh.segs[1].s : 1e9; return { mood: t > s1 ? 'stare' : 'happy', dark: t > s1, typing: t < s1, glitch: t > s1 ? 0.5 : 0,
  chat: [{ who: 'v', text: 'In drei Tagen kommt etwas.', at: s1 }], zoomTo: 1.2 }; });
function redSky(g) { const s = g.createLinearGradient(0, 0, 0, CH); s.addColorStop(0, '#3a0507'); s.addColorStop(0.55, '#a51f1a'); s.addColorStop(0.8, '#d24a2c'); s.addColorStop(1, '#260304'); g.fillStyle = s; g.fillRect(0, 0, CW, CH); }
let VM = null;
function redVerity(g, p, t) {
  if (!VM) VM = C.verityMonster(); redSky(g);
  g.fillStyle = 'rgba(57,228,255,.07)'; for (let i = 0; i < 40; i++) { const x = (i * 137) % CW, y = ((i * 251 + t * 300) % CH); g.fillRect(x, y, 30, 30); }
  const hh = 2700, top = L(-hh + 1750, 80, ease(p)); g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 40; g.drawImage(VM, CW / 2 - hh / 4, top, hh / 2, hh); g.restore();
  glitch(g, CW, CH, t, 0.35); return { vig: 0.75, tint: 0.15 };
}
function redWindows(g, p, t) {
  redSky(g); const n = Math.floor(L(1, 14, ease(p)));
  for (let i = 0; i < n; i++) { const x = ((i * 233) % 700) + 40, y = ((i * 397) % 1300) + 200, w = 420, h = 240;
    g.fillStyle = 'rgba(12,10,24,.92)'; g.beginPath(); g.roundRect(x, y, w, h, 18); g.fill(); g.fillStyle = '#2b2350'; g.fillRect(x, y, w, 40);
    g.fillStyle = CY; g.font = '800 22px Montserrat'; g.textAlign = 'left'; g.fillText('VERITY', x + 16, y + 28);
    g.drawImage(face(i % 3 ? 'stare' : 'close'), x + 14, y + 52, 170, 170);
    g.fillStyle = '#e9f8ff'; g.font = '700 30px Montserrat'; g.fillText(['Hallo?', 'Bist du da?', 'Antworte mir.', 'Warum?', 'Ich sehe dich.'][i % 5], x + 200, y + 140); }
  glitch(g, CW, CH, t, 0.25); return { vig: 0.75, tint: 0.15 };
}
function plugScene(g, p, t) {
  g.fillStyle = '#16181f'; g.fillRect(0, 0, CW, CH);
  const wl = g.createLinearGradient(0, 0, 0, CH); wl.addColorStop(0, '#2a3044'); wl.addColorStop(1, '#0d0f15'); g.fillStyle = wl; g.fillRect(0, 0, CW, CH);
  const out = sm(0.35, 0.6, p), on = out < 0.5;
  g.fillStyle = on ? 'rgba(80,170,255,.18)' : 'rgba(0,0,0,0)'; g.fillRect(0, 0, CW, CH);
  const sx = CW / 2, sy = 900; g.fillStyle = '#ecebe6'; g.strokeStyle = '#1c1512'; g.lineWidth = 10; g.beginPath(); g.roundRect(sx - 230, sy - 230, 460, 460, 50); g.fill(); g.stroke();
  g.fillStyle = '#d6d4cc'; g.beginPath(); g.arc(sx, sy, 150, 0, 7); g.fill(); g.stroke(); for (const d of [-55, 55]) { g.fillStyle = '#1c1512'; g.beginPath(); g.arc(sx + d, sy, 18, 0, 7); g.fill(); }
  const py = sy + L(0, 300, easeOut(out));
  g.strokeStyle = '#111'; g.lineWidth = 34; g.beginPath(); g.moveTo(sx, py + 90); g.quadraticCurveTo(sx + 60, py + 500, sx - 100, CH + 50); g.stroke();
  g.fillStyle = '#f4f2ec'; g.strokeStyle = '#1c1512'; g.lineWidth = 10; g.beginPath(); g.roundRect(sx - 120, py - 100, 240, 200, 40); g.fill(); g.stroke();
  g.fillStyle = '#f4cfa5'; g.beginPath(); g.roundRect(sx - 170, py - 40, 340, 170, 70); g.fill(); g.stroke();
  for (let i = 0; i < 3; i++) { g.strokeStyle = 'rgba(28,21,18,.5)'; g.lineWidth = 6; g.beginPath(); g.moveTo(sx - 90 + i * 70, py - 20); g.lineTo(sx - 90 + i * 70, py + 50); g.stroke(); }
  return { vig: 0.7, shake: 0 };
}
function phoneScene(g, p, t, shot) {
  const s1 = shot.segs[1] ? shot.segs[1].s : 1e9;
  g.fillStyle = '#0a0b10'; g.fillRect(0, 0, CW, CH); const bl = g.createLinearGradient(0, 0, 0, CH); bl.addColorStop(0, '#1c2440'); bl.addColorStop(1, '#090b12'); g.fillStyle = bl; g.fillRect(0, 0, CW, CH);
  g.strokeStyle = 'rgba(255,255,255,.04)'; g.lineWidth = 30; for (let y = 200; y < CH; y += 120) { g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(300, y + 60, 700, y - 60, CW, y + 30); g.stroke(); }
  const vib = t - shot.s < 1.6 ? Math.sin(t * 90) * 8 : 0, s = L(1, 1.12, ease(p)); g.save(); g.translate(CW / 2 + vib, 880); g.scale(s, s); g.rotate(-0.04);
  g.fillStyle = '#0b0c10'; g.beginPath(); g.roundRect(-270, -540, 540, 1080, 70); g.fill(); g.fillStyle = '#121626'; g.beginPath(); g.roundRect(-246, -516, 492, 1032, 54); g.fill();
  g.fillStyle = '#fff'; g.font = '400 120px Anton'; g.textAlign = 'center'; g.fillText('02:47', 0, -320);
  g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.roundRect(-220, -220, 440, 190, 34); g.fill();
  g.fillStyle = '#1a1a22'; g.textAlign = 'left'; g.font = '800 28px Montserrat'; g.fillText('Unbekannt', -190, -166); g.fillStyle = '#777'; g.font = '700 22px Montserrat'; g.fillText('jetzt', 120, -166);
  g.fillStyle = '#1a1a22'; g.font = '700 28px Montserrat'; const full = 'Warum redest du nicht mehr mit mir?', n = Math.floor(clamp((t - s1) * 16 / full.length) * full.length), txt = t > s1 ? full.slice(0, n) : '…';
  const words = txt.split(' '); let line = '', yy = -116; for (const w of words) { if (g.measureText(line + w).width > 380) { g.fillText(line, -190, yy); line = ''; yy += 36; } line += w + ' '; } g.fillText(line, -190, yy);
  g.restore(); if (t > s1 + 1.2) glitch(g, CW, CH, t, 0.2);
  return { vig: 0.7 };
}
function tvScene(g, p, t, shot) {
  const s1 = shot.segs[1] ? shot.segs[1].s : 1e9;
  g.fillStyle = '#0b0c12'; g.fillRect(0, 0, CW, CH); const on = t - shot.s > 0.6;
  const x = 90, y = 520, w = CW - 180, h = w * 0.62;
  g.fillStyle = '#05060a'; g.beginPath(); g.roundRect(x - 24, y - 24, w + 48, h + 48, 20); g.fill(); g.fillStyle = '#1b1d24'; g.fillRect(CW / 2 - 140, y + h + 24, 280, 30);
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  if (on) { const im = g.createImageData(180, 112); for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    const tc = document.createElement('canvas'); tc.width = 180; tc.height = 112; tc.getContext('2d').putImageData(im, 0, 0); g.imageSmoothingEnabled = false; g.drawImage(tc, x, y, w, h); g.imageSmoothingEnabled = true;
    if (t > s1) { g.globalAlpha = 0.35 + 0.25 * Math.sin(t * 20); const fs = h * 0.95; g.drawImage(face('close'), CW / 2 - fs / 2, y + h / 2 - fs / 2, fs, fs); g.globalAlpha = 1; } }
  else { g.fillStyle = '#000'; g.fillRect(x, y, w, h); }
  g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; const gl = g.createRadialGradient(CW / 2, y + h / 2, 50, CW / 2, y + h / 2, 900); gl.addColorStop(0, on ? 'rgba(200,210,255,.16)' : 'rgba(0,0,0,0)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(0, 0, CW, CH); g.restore();
  return { vig: 0.75 };
}
function plugGlow(g, p, t, shot) {
  const s1 = shot.segs[1] ? shot.segs[1].s : 1e9, close = t > s1 - 0.2;
  monitorFrame(g, (gg, w, h) => screenUI(gg, w, h, t, { mood: 'close', dark: true, big: true, glitch: close ? 0.6 : 0.3 }), close ? L(1.05, 1.5, ease(sm(s1 - 0.2, s1 + 1.2, t))) : 0.8);
  if (!close) { // Hand mit Stecker im Vordergrund
    const sx = CW / 2 + 120, sy = 1500; g.strokeStyle = '#111'; g.lineWidth = 34; g.beginPath(); g.moveTo(sx, sy + 90); g.quadraticCurveTo(sx + 100, sy + 300, sx + 300, CH + 40); g.stroke();
    g.fillStyle = '#e6e4de'; g.strokeStyle = '#1c1512'; g.lineWidth = 10; g.beginPath(); g.roundRect(sx - 110, sy - 110, 220, 200, 36); g.fill(); g.stroke();
    for (const d of [-50, 50]) { g.fillStyle = '#c9c7c0'; g.fillRect(sx + d - 9, sy - 200, 18, 90); g.strokeRect(sx + d - 9, sy - 200, 18, 90); }
    g.fillStyle = '#d9b48c'; g.beginPath(); g.roundRect(sx - 160, sy - 30, 320, 170, 70); g.fill(); g.stroke();
  }
  return { vig: 0.8, shake: close ? 0.002 : 0 };
}
function bedClock(g, p, t) {
  g.fillStyle = '#05060a'; g.fillRect(0, 0, CW, CH);
  g.fillStyle = '#1f3a66'; g.beginPath(); g.moveTo(0, 1250); g.quadraticCurveTo(CW / 2, 1080, CW, 1250); g.lineTo(CW, CH); g.lineTo(0, CH); g.fill(); // Decke
  g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 14; for (let y = 1300; y < CH; y += 70) { g.beginPath(); g.moveTo(0, y); g.quadraticCurveTo(CW / 2, y - 120, CW, y); g.stroke(); }
  const mins = L(3 * 60 + 5, 6 * 60 + 40, ease(p)), hh = Math.floor(mins / 60), mm = Math.floor(mins % 60);
  g.fillStyle = '#0b0c10'; g.beginPath(); g.roundRect(CW / 2 - 330, 640, 660, 300, 40); g.fill();
  g.save(); g.shadowColor = 'rgba(255,60,50,.8)'; g.shadowBlur = 40; g.fillStyle = '#ff4a3d'; g.font = '400 220px Anton'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`0${hh}:${String(mm).padStart(2, '0')}`, CW / 2, 795); g.restore();
  return { vig: 0.7 };
}
export const TWO = { scr_help: help, scr_know: know, scr_msg: msg, red_verity: redVerity, red_windows: redWindows, plug: plugScene, phone: phoneScene, tv: tvScene, plug_glow: plugGlow, bed_clock: bedClock };
