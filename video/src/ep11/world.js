// Folge 10 – Aka Manto: Schultoilette mit Kabinenreihe, Schulflur, Klassenzimmer + 2D-Szenen
import * as THREE from 'three';
import * as C from '../chars.js';
import { tex, lam, box, sprite, setTex, glow, gradTex, V, L, clamp, sm, lerpV, look, billboard, shake, rnd, ease } from '../world.js';
import { W as CW, H as CH } from '../overlay.js';

const easeOut = t => 1 - Math.pow(1 - t, 3);
function fov(cam, f) { if (cam.fov !== f) { cam.fov = f; cam.updateProjectionMatrix(); } }
const basic = c => new THREE.MeshBasicMaterial({ color: c });
function tileTex(c1 = '#dfe6e0', c2 = '#c3ccc6', n = 8) { const c = C.cv(256, 256), g = c.getContext('2d'); g.fillStyle = c1; g.fillRect(0, 0, 256, 256); g.strokeStyle = c2; g.lineWidth = 3;
  for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * 256 / n, 0); g.lineTo(i * 256 / n, 256); g.stroke(); g.beginPath(); g.moveTo(0, i * 256 / n); g.lineTo(256, i * 256 / n); g.stroke(); } const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }

function buildSchool() {
  const S = new THREE.Scene(); S.background = new THREE.Color(0x0a0c10);
  const hemi = new THREE.HemisphereLight(0xdfe8f0, 0x2a2a2a, 0.5); S.add(hemi);
  // ---------------- Toilette: x -3..3, z -10..2, Kabinen links (x -3..-1.4)
  const wt = tileTex(); wt.repeat.set(6, 2); const ft = tileTex('#9aa4a0', '#7a8480', 6); ft.repeat.set(6, 12);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(6, 12), new THREE.MeshLambertMaterial({ map: ft })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0, -4); S.add(fl);
  const wm = new THREE.MeshLambertMaterial({ map: wt });
  S.add(box(0.1, 3, 12, wm, -3, 1.5, -4), box(0.1, 3, 12, wm, 3, 1.5, -4), box(6, 3, 0.1, wm, 0, 1.5, -10), box(6, 0.1, 12, lam(0xcfd4d0), 0, 3, -4));
  const stalls = [], doors = [], inds = []; const SW = 1.5;
  for (let i = 0; i < 5; i++) { const z = -1 - i * SW;
    S.add(box(1.6, 1.9, 0.05, lam(0x6aa08a), -2.2, 1.12, z + SW / 2)); // Trennwand (mit Luecke unten)
    const d = new THREE.Group(); d.position.set(-1.4, 0, z + SW / 2 - 0.05); S.add(d); d.add(box(0.05, 1.8, SW - 0.12, lam(0x7ab09a), 0, 1.1, -(SW - 0.12) / 2)); doors.push(d);
    const ind = box(0.02, 0.05, 0.12, basic(i < 4 ? 0xd02020 : 0x20c040), -1.37, 1.0, z + SW / 2 - 0.35); S.add(ind); inds.push(ind); }
  S.add(box(1.6, 1.9, 0.05, lam(0x6aa08a), -2.2, 1.12, -1 - 5 * SW + SW / 2));
  // Waschbecken + Spiegel rechts
  for (let i = 0; i < 3; i++) { const z = -2 - i * 2; S.add(box(0.5, 0.15, 0.6, lam(0xf2f2ee), 2.7, 0.85, z), box(0.04, 0.8, 0.7, basic(0x6a7a8a), 2.93, 1.6, z)); }
  const neons = []; for (let z = 0; z > -10; z -= 3) { const n = box(1.4, 0.05, 0.12, basic(0xeef4ff), 0, 2.95, z); S.add(n); neons.push(n); }
  const tl = new THREE.PointLight(0xeef4ff, 10, 14, 1.3); tl.position.set(0, 2.6, -4); S.add(tl);
  // Klo in der letzten Kabine + leere Rolle
  const lastZ = -1 - 4 * SW; S.add(box(0.45, 0.45, 0.6, lam(0xf2f2ee), -2.6, 0.22, lastZ), box(0.06, 0.12, 0.12, lam(0x8a8a8a), -2.94, 0.75, lastZ + 0.45));
  // roter Umhang-Stoff (unter Trennwand / Tuer)
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), new THREE.MeshLambertMaterial({ map: tex(C.redCloth()), transparent: true, alphaTest: 0.05, side: THREE.DoubleSide })); cloth.rotation.x = -Math.PI / 2; cloth.position.set(-2.2, 0.01, lastZ - 0.6); S.add(cloth);
  // ---------------- Flur bei x = 30
  const Fl = new THREE.Group(); Fl.position.set(30, 0, 0); S.add(Fl);
  const ff = new THREE.Mesh(new THREE.PlaneGeometry(4, 40), lam(0xa8a090)); ff.rotation.x = -Math.PI / 2; ff.position.z = -15; Fl.add(ff);
  Fl.add(box(0.1, 3, 40, lam(0xe0d8c4), -2, 1.5, -15), box(0.1, 3, 40, lam(0xe0d8c4), 2, 1.5, -15), box(4, 0.1, 40, lam(0xd0ccc0), 0, 3, -15));
  for (let z = 2; z > -34; z -= 0.8) Fl.add(box(0.4, 1.8, 0.75, lam([0x3a6ab0, 0x3a7ab8][Math.floor(-z) % 2]), 1.78, 0.9, z));
  for (let z = 0; z > -34; z -= 4) Fl.add(box(1, 0.05, 0.15, basic(0xf4f8ff), 0, 2.95, z));
  const fll = new THREE.PointLight(0xf4f0e0, 6, 30, 1.0); fll.position.set(30, 2.5, -8); S.add(fll);
  // ---------------- Klassenzimmer bei x = 60
  const K = new THREE.Group(); K.position.set(60, 0, 0); S.add(K);
  const kf = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), lam(0x9a7a5a)); kf.rotation.x = -Math.PI / 2; K.add(kf);
  K.add(box(10, 3, 0.1, lam(0xe8e0cc), 0, 1.5, -5), box(0.1, 3, 10, lam(0xe8e0cc), -5, 1.5, 0), box(0.1, 3, 10, lam(0xe8e0cc), 5, 1.5, 0));
  K.add(box(4, 1.3, 0.05, lam(0x2a4a3a), 0, 1.7, -4.95)); const kw = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.4), basic(0xcfe2f0)); kw.position.set(-4.94, 1.8, 0); kw.rotation.y = Math.PI / 2; K.add(kw);
  const chairs = []; for (const [x, z] of [[-1, -1], [0.3, -1], [-1, 0.6], [0.3, 0.6], [1.6, -1], [1.6, 0.6]]) { K.add(box(1.0, 0.05, 0.6, lam(0xc8a070), x, 0.72, z), box(0.05, 0.7, 0.05, lam(0x666666), x - 0.45, 0.36, z), box(0.05, 0.7, 0.05, lam(0x666666), x + 0.45, 0.36, z));
    const ch = new THREE.Group(); ch.position.set(x, 0, z + 0.55); ch.add(box(0.42, 0.04, 0.4, lam(0x3a5a8a), 0, 0.45, 0), box(0.42, 0.4, 0.04, lam(0x3a5a8a), 0, 0.68, 0.2), box(0.04, 0.45, 0.04, lam(0x555555), 0, 0.22, 0)); K.add(ch); chairs.push(ch); }
  const cloak = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.85), new THREE.MeshLambertMaterial({ map: tex(C.redCloth()), transparent: true, alphaTest: 0.05, side: THREE.DoubleSide })); cloak.position.set(60.3, 0.55, -0.22); S.add(cloak);
  const kl = new THREE.PointLight(0xfff4e0, 5, 14, 1.1); kl.position.set(60, 2.6, 0); S.add(kl);
  // Figuren
  const T = { boyB: C.boy('back'), boyS: C.boy('front', 'scared_sweat'), boyC: C.boy('front', 'closed'), boyF: C.boy('front', 'neutral'), benF: C.ben('front', 'neutral'), benS: C.ben('front', 'scared_sweat'), benB: C.ben('back') };
  const boy = sprite(T.boyS, 1.35); boy.userData.noBB = true; boy.children[0].visible = false; S.add(boy);
  const ben = sprite(T.benF, 1.35); ben.userData.noBB = true; ben.children[0].visible = false; S.add(ben);
  const aka = sprite(C.akaManto('hands'), 2.05, 0.15); aka.userData.noBB = true; aka.children[0].visible = false; S.add(aka);
  return { S, hemi, neons, tl, doors, inds, cloth, lastZ, boy, ben, aka, T, cloak, chairs, cam: new THREE.PerspectiveCamera(50, 9 / 16, 0.05, 300) };
}
export function build() { return { Sc: buildSchool() }; }

function base(A, t) { A.boy.visible = A.ben.visible = A.aka.visible = false; A.cloak.visible = false; A.doors.forEach(d => d.rotation.y = 0); A.cloth.visible = false;
  A.tl.intensity = 10; A.neons.forEach(n => n.material.color.set(0xeef4ff)); }
function flick(A, on) { A.tl.intensity = on ? 10 : 1.2; A.neons.forEach(n => n.material.color.set(on ? 0xeef4ff : 0x30343a)); }
const ben = (A, tx, x, z, ry = 0) => { A.ben.visible = true; setTex(A.ben, A.T[tx]); A.ben.position.set(x, 0, z); A.ben.rotation.y = ry; };

export const SHOTS = {
  wc_open(W, p, t, sh) { const A = W.Sc; base(A, t); const dt = t - sh.s; flick(A, !((dt > 0.2 && dt < 0.35) || (dt > 1.0 && dt < 1.15) || Math.sin(t * 29) > 0.93));
    A.doors[4].rotation.y = -1.1 * easeOut(clamp((dt - 0.3) / 1.5)); // letzte Tuer schwingt auf
    A.cloth.visible = dt < 2.2; A.cloth.position.set(L(-1.2, -2.4, clamp((dt - 0.4) / 1.6)), 0.012, A.lastZ - 0.2);
    look(A.cam, lerpV(V(1.2, 1.65, 1.6), V(0.8, 1.55, 0.4), ease(p)), V(-1.6, 0.9, -7.4)); fov(A.cam, 46); return { world: A, vig: 0.8, shake: dt < 0.3 ? 0.003 : 0 }; },
  hall(W, p, t, sh) { const A = W.Sc; base(A, t); A.boy.visible = true; setTex(A.boy, A.T.boyB); const z = -2 - (t - sh.s) * 1.6; A.boy.position.set(30.2, 0, z); A.boy.rotation.y = Math.PI;
    look(A.cam, V(30.2, 1.6, z + 3.6), V(30.1, 1.2, z - 10)); return { world: A, vig: 0.6 }; },
  stalls(W, p, t) { const A = W.Sc; base(A, t); look(A.cam, lerpV(V(0.4, 1.4, -0.5), V(0.1, 1.3, -2.0), ease(p)), V(-1.4, 1.0, -8)); fov(A.cam, 48); return { world: A, vig: 0.65 }; },
  under(W, p, t, sh) { const A = W.Sc; base(A, t); const s1 = sh.segs[1] ? sh.segs[1].s : 1e9; A.cloth.visible = true; A.cloth.position.set(-2.2 + Math.sin(t * 1.3) * 0.05, 0.012, A.lastZ + SWn(-0.95));
    flick(A, !(Math.sin(t * 17) > 0.9));
    look(A.cam, lerpV(V(-2.2, 0.75, A.lastZ + 0.25), V(-2.25, 0.45, A.lastZ + 0.1), ease(p)), V(-2.2, 0.1, A.lastZ - 0.8)); fov(A.cam, 55); return { world: A, vig: 0.85, shake: t > s1 ? 0.0012 : 0 }; },
  stall_rule(W, p, t) { const A = W.Sc; base(A, t); A.boy.visible = true; setTex(A.boy, A.T.boyS); A.boy.position.set(-2.25, 0, A.lastZ - 0.1); A.doors[4].rotation.y = 0;
    look(A.cam, V(-2.2, 1.1, L(A.lastZ + 0.65, A.lastZ + 0.55, ease(p))), V(-2.25, 1.0, A.lastZ - 0.1)); fov(A.cam, 58); return { world: A, vig: 0.8 }; },
  stall_answer(W, p, t) { const A = W.Sc; base(A, t); A.boy.visible = true; setTex(A.boy, A.T.boyC); A.boy.position.set(-2.25 + Math.sin(t * 40) * 0.004, 0, A.lastZ - 0.1);
    look(A.cam, V(-2.22, 1.05, L(A.lastZ + 0.45, A.lastZ + 0.35, ease(p))), V(-2.25, 1.02, A.lastZ - 0.1)); fov(A.cam, 55); return { world: A, vig: 0.85 }; },
  retreat(W, p, t) { const A = W.Sc; base(A, t); A.cloth.visible = p < 0.8; A.cloth.position.set(L(-1.5, -0.4, ease(sm(0.05, 0.8, p))), 0.012, A.lastZ - 0.15); A.cloth.rotation.z = 0;
    flick(A, p > 0.6 || Math.sin(t * 21) < 0.6);
    look(A.cam, V(-2.0, 0.3, A.lastZ - 0.1), V(-1.2, 0.05, A.lastZ - 0.15)); fov(A.cam, 55); return { world: A, vig: 0.85 }; },
  classroom(W, p, t, sh) { const A = W.Sc; base(A, t); const k = sm(0.35, 1, p); ben(A, k > 0.05 ? 'benB' : 'benF', L(60.3, 63.5, k), L(-0.4, 1.8, k), k > 0.05 ? Math.PI : 0);
    A.boy.visible = true; setTex(A.boy, A.T.boyB); A.boy.position.set(59.0, 0.05, -0.35); A.boy.rotation.y = Math.PI;
    look(A.cam, V(58.2, 1.6, 2.8), V(L(60.4, 62.2, k), 1.0, L(-1.0, 0.9, k))); return { world: A, vig: 0.5 }; },
  ben_pale(W, p, t) { const A = W.Sc; base(A, t); ben(A, 'benS', 60.3, -0.4); A.ben.material.emissiveIntensity = 0.55; A.ben.material.color.setRGB(0.85, 0.9, 0.92);
    look(A.cam, V(60.32, 1.1, L(0.55, 0.42, ease(p))), V(60.3, 1.02, -0.4)); fov(A.cam, 50); return { world: A, vig: 0.65 }; },
  empty_seat(W, p, t, sh) { const A = W.Sc; base(A, t); A.cloak.visible = true; const st = sh.sfx.find(f => f.n === 'stinger'), after = st ? t - st.t : -1;
    A.aka.visible = after > 0 && after < 0.6; A.aka.position.set(60.0, 0, -4.4);
    const k = ease(p); look(A.cam, lerpV(V(61.4, 1.45, 1.6), V(60.8, 1.1, 0.7), k), lerpV(V(60.3, 0.6, -0.3), V(60.3, 0.7, -1.2), after > 0 ? 1 : 0));
    return { world: A, vig: 0.6, tint: after > 0 ? 0.35 : 0, flash: after > 0 && after < 0.12 ? 1 - after / 0.12 : 0, shake: after > 0 && after < 0.5 ? 0.01 * (1 - after / 0.5) : 0 }; },
};
function SWn(v) { return v; }
for (const k of Object.keys(SHOTS)) { const f = SHOTS[k]; SHOTS[k] = (W, ...a) => { fov(W.Sc.cam, 50); W.Sc.ben.material.emissiveIntensity = 0.38; W.Sc.ben.material.color.setRGB(1, 1, 1); return f(W, ...a); }; }
SHOTS._billboard = billboard; SHOTS._shake = shake;

// ------------------------------------------------------------------ 2D
function redSky(g) { const s = g.createLinearGradient(0, 0, 0, CH); s.addColorStop(0, '#3a0507'); s.addColorStop(0.55, '#a51f1a'); s.addColorStop(0.8, '#d24a2c'); s.addColorStop(1, '#260304'); g.fillStyle = s; g.fillRect(0, 0, CW, CH); }
let AK = null;
function redAka(g, p, t) { if (!AK) AK = C.akaManto('hands'); redSky(g); g.fillStyle = '#4a0709'; for (let x = 0; x < CW; x += 120) g.fillRect(x, 1500, 110, 420);
  const hh = 2400, top = L(-hh + 1850, 140, ease(p)); g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 40; g.drawImage(AK, CW / 2 - hh / 4, top, hh / 2, hh); g.restore(); return { vig: 0.8, tint: 0.15 }; }
function roll(g, x, y, col, burn) { const h = 300 * (1 - burn * 0.85); g.save(); g.translate(x, y);
  g.fillStyle = col; g.strokeStyle = '#1c1512'; g.lineWidth = 10; g.beginPath(); g.roundRect(-110, -h, 220, h, 30); g.fill(); g.stroke();
  g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0, -h, 110, 34, 0, 0, 7); g.fill(); g.fillStyle = '#e8dcc8'; g.beginPath(); g.ellipse(0, -h, 36, 12, 0, 0, 7); g.fill();
  if (burn > 0) { for (let i = 0; i < 14; i++) { const a = i * 0.9 + burn * 8, r = 40 + (i * 37) % 120; g.fillStyle = `rgba(255,${120 + (i * 13) % 100},40,${0.8 - burn * 0.5})`; g.beginPath(); g.arc(Math.cos(a) * r * 0.8, -h - 30 - (i * 23 + burn * 300) % 260, 8, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(30,20,20,.8)'; g.beginPath(); g.ellipse(0, 0, 140, 30, 0, 0, 7); g.fill(); }
  g.restore(); }
function redRolls(g, p, t, shot) { redSky(g); const s = shot.segs[0], mid = s.s + (s.e - s.s) * 0.5;
  g.fillStyle = '#e9e2dc'; g.font = '400 90px Anton'; g.textAlign = 'center'; g.fillText('ROT', CW * 0.3, 620); g.fillText('BLAU', CW * 0.7, 620);
  roll(g, CW * 0.3, 1150, '#c41a1a', clamp((t - s.s - 0.6) / 1.4)); roll(g, CW * 0.7, 1150, '#2a5ad0', clamp((t - mid) / 1.4));
  g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 22; g.lineCap = 'round'; for (const [x, tt] of [[CW * 0.3, s.s + 1.6], [CW * 0.7, mid + 1.2]]) if (t > tt) { const k = clamp((t - tt) / 0.25); g.beginPath(); g.moveTo(x - 150, 560); g.lineTo(x - 150 + 300 * k, 560 + 100 * k); g.stroke(); }
  return { vig: 0.8, tint: 0.15 }; }
function emptyRoll(g, p, t) { const tc = C.cv(64, 64), tg = tc.getContext('2d'); g.fillStyle = '#dfe6e0'; g.fillRect(0, 0, CW, CH); g.strokeStyle = '#c3ccc6'; g.lineWidth = 6; for (let x = 0; x < CW; x += 135) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, CH); g.stroke(); } for (let y = 0; y < CH; y += 135) { g.beginPath(); g.moveTo(0, y); g.lineTo(CW, y); g.stroke(); }
  const s = L(1, 1.15, ease(p)); g.save(); g.translate(CW / 2, 860); g.scale(s, s);
  g.fillStyle = '#8a8a8a'; g.strokeStyle = '#1c1512'; g.lineWidth = 10; g.beginPath(); g.roundRect(-300, -60, 600, 50, 20); g.fill(); g.stroke();
  g.fillStyle = '#b89a70'; g.beginPath(); g.roundRect(-160, -10, 320, 150, 20); g.fill(); g.stroke(); g.fillStyle = '#7a6040'; g.beginPath(); g.ellipse(-160, 65, 26, 75, 0, 0, 7); g.fill(); g.stroke();
  g.restore(); const sh = g.createLinearGradient(0, 0, 0, CH); sh.addColorStop(0, 'rgba(0,0,0,.25)'); sh.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = sh; g.fillRect(0, 0, CW, CH); return { vig: 0.7 }; }
export const TWO = { red_aka: redAka, red_rolls: redRolls, empty_roll: emptyRoll };
