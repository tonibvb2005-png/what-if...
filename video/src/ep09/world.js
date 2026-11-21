// Folge 8 – Teke Teke: U-Bahnhof um Mitternacht (Bahnsteig, Gleise, Tunnel, Neon), einfahrender Zug, leerer Waggon + 2D-Szenen
import * as THREE from 'three';
import * as C from '../chars.js';
import { tex, lam, box, sprite, setTex, glow, gradTex, V, L, clamp, sm, lerpV, look, billboard, shake, rnd, ease } from '../world.js';
import { W as CW, H as CH } from '../overlay.js';

const easeOut = t => 1 - Math.pow(1 - t, 3);
function fov(cam, f) { if (cam.fov !== f) { cam.fov = f; cam.updateProjectionMatrix(); } }
const basic = c => new THREE.MeshBasicMaterial({ color: c });

function textTex(lines, w = 512, h = 160, bg = '#0a0c10', fg = '#ffb020') { const c = C.cv(w, h), g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = '800 34px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((l, i) => g.fillText(l, w / 2, h / (lines.length + 1) * (i + 1))); return tex(c); }

function buildStation() {
  const S = new THREE.Scene(); S.background = new THREE.Color(0x05060a); S.fog = new THREE.Fog(0x080a10, 6, 60);
  const hemi = new THREE.HemisphereLight(0x7a86a0, 0x15121a, 0.35); S.add(hemi);
  // Bahnsteig (x 0..5), Gleisbett (x -4..0), Tunnelportal bei z = -34
  S.add(box(5, 1.0, 80, lam(0x8a8a86), 2.5, 0.5, -10), box(0.3, 0.02, 80, lam(0xe8c040), 0.25, 1.01, -10));
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(4, 80), lam(0x3a3430)); bed.rotation.x = -Math.PI / 2; bed.position.set(-2, 0.01, -10); S.add(bed);
  for (const x of [-2.75, -1.25]) S.add(box(0.08, 0.12, 80, lam(0x9a9aa0), x, 0.08, -10));
  for (let z = 28; z > -48; z -= 0.9) S.add(box(2.4, 0.06, 0.25, lam(0x4a3a2c), -2, 0.04, z));
  S.add(box(0.3, 6, 80, lam(0x6a7068), -4.2, 3, -10), box(0.3, 6, 80, lam(0x7a8a82), 5.2, 3, -10), box(10, 0.3, 80, lam(0x50544c), 0.5, 5.6, -10));
  for (let z = 26; z > -32; z -= 4) S.add(box(4.9, 0.02, 0.05, lam(0x9aa8a0), 2.5, 4.0, z)); // Fliesenfugen-Andeutung
  S.add(box(10, 6, 0.4, lam(0x3a3c38), 0.5, 3, -34.2)); const hole = box(3.6, 3.8, 0.5, basic(0x000000), -2, 1.9, -34.1); S.add(hole);
  // Neonroehren
  const neons = []; for (let z = 24; z > -32; z -= 6) { const n = box(0.12, 0.06, 1.6, basic(0xe8f2ff), 2.5, 5.35, z); S.add(n); neons.push(n); }
  const nl = []; for (let z = 18; z > -30; z -= 12) { const l = new THREE.PointLight(0xdfe9ff, 6, 14, 1.4); l.position.set(2.5, 4.8, z); S.add(l); nl.push(l); }
  // Bank, Anzeigetafel, Saeulen
  S.add(box(1.8, 0.08, 0.5, lam(0x6a4a30), 3.6, 1.45, -4), box(1.8, 0.5, 0.08, lam(0x6a4a30), 3.6, 1.7, -4.22)); for (const x of [2.9, 4.3]) S.add(box(0.08, 0.45, 0.4, lam(0x333333), x, 1.22, -4));
  for (let z = 20; z > -32; z -= 10) S.add(box(0.5, 4.6, 0.5, lam(0x8a948e), 3.2, 3.3, z));
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.7), new THREE.MeshBasicMaterial({ map: textTex(['LETZTER ZUG 23:58  ✕', 'KEINE WEITEREN ZÜGE']) })); board.position.set(2.2, 3.6, -6); S.add(board); S.add(box(2.3, 0.8, 0.1, lam(0x15161a), 2.2, 3.6, -6.06));
  // Zug
  const train = new THREE.Group(); S.add(train); const tb = lam(0xd8dcd8);
  train.add(box(2.8, 3.0, 40, tb, -2, 1.75, -20), box(2.82, 0.4, 40.1, lam(0x2a6ab0), -2, 1.0, -20));
  for (let z = -2; z > -40; z -= 3) train.add(box(0.05, 0.9, 1.8, basic(0xf6f2d8), -0.58, 2.2, z));
  const hl = [glow(1.6, [255, 250, 220]), glow(1.6, [255, 250, 220])]; hl[0].position.set(-2.8, 1.2, 0.2); hl[1].position.set(-1.2, 1.2, 0.2); train.add(...hl);
  const trainL = new THREE.PointLight(0xfff2d0, 0, 30, 1.2); trainL.position.set(-2, 1.4, 1); train.add(trainL);
  // Kriechende Figur
  const sideT = [0, 1, 2, 3, 4, 5].map(k => C.tekeSide(k / 6)), frontT = [0, 1, 2, 3, 4, 5].map(k => C.tekeFront(k / 6));
  const teke = sprite(frontT[0], 0.9, 0.15); teke.userData.noBB = true; teke.children[0].visible = false; S.add(teke);
  const T = { boyB: C.boy('back'), boyS: C.boy('front', 'scared_sweat'), boyC: C.boy('front', 'closed'), sit: C.boySit('scared_sweat') };
  const boy = sprite(T.boyS, 1.35); boy.userData.noBB = true; boy.children[0].visible = false; S.add(boy);
  // Waggon innen (bei x = 60)
  const Wg = new THREE.Group(); Wg.position.set(60, 0, 0); S.add(Wg);
  Wg.add(box(3, 0.1, 16, lam(0x5a5a62), 0, 0, -4), box(3, 0.1, 16, lam(0xdedad2), 0, 2.4, -4), box(0.1, 2.4, 16, lam(0xcfd4d0), -1.5, 1.2, -4), box(0.1, 2.4, 16, lam(0xcfd4d0), 1.5, 1.2, -4), box(3, 2.4, 0.1, lam(0xcfd4d0), 0, 1.2, -12));
  for (const s of [-1, 1]) { Wg.add(box(0.6, 0.12, 14, lam(0x3a6ab0), s * 1.15, 0.5, -4), box(0.12, 0.5, 14, lam(0x3a6ab0), s * 1.42, 0.8, -4), box(0.6, 0.45, 14, lam(0x111114), s * 1.15, 0.22, -4));
    for (let z = 2; z > -11; z -= 2.2) Wg.add(box(0.03, 0.8, 1.6, basic(0x05060a), s * 1.44, 1.55, z)); }
  for (let z = 2; z > -11; z -= 3) { Wg.add(box(0.05, 2.3, 0.05, lam(0xd0d0d0), -0.4, 1.2, z)); Wg.add(box(0.1, 0.04, 1.5, basic(0xf4f8ff), 0, 2.33, z)); }
  const wl = new THREE.PointLight(0xf4f8ff, 4, 14, 1.2); wl.position.set(60, 2.1, -3); S.add(wl);
  const under = sprite(frontT[2], 0.5, 0.1); under.userData.noBB = true; under.children[0].visible = false; under.position.set(61.1, 0.0, -1.0); under.rotation.y = -Math.PI / 2; S.add(under);
  return { S, hemi, neons, nl, board, train, hl, trainL, teke, sideT, frontT, boy, T, under, wl, cam: new THREE.PerspectiveCamera(50, 9 / 16, 0.05, 300) };
}
export function build() { return { St: buildStation() }; }

function base(A, t) { A.teke.visible = A.boy.visible = A.under.visible = false; A.train.position.set(0, 0, -90); A.trainL.intensity = 0; A.teke.material.emissiveIntensity = 0.15;
  const fl = Math.sin(t * 23) * Math.sin(t * 5.1) > 0.6; A.neons.forEach((n, i) => n.material.color.set(i === 3 && fl ? 0x202428 : 0xe8f2ff)); A.nl.forEach((l, i) => l.intensity = i === 1 && fl ? 0.5 : 6); }
function crawl(A, t, x, z, front = true, rotY = 0) { const k = Math.floor(t * 7) % 6; A.teke.visible = true; setTex(A.teke, front ? A.frontT[k] : A.sideT[k]); A.teke.position.set(x, 0.1, z); A.teke.rotation.y = rotY;
  A.teke.scale.setScalar(1); if (!front) A.teke.scale.set(1, 1, 1); }

export const SHOTS = {
  st_open(W, p, t, sh) { const A = W.St; base(A, t); const dt = t - sh.s; const z = L(-31, -24, clamp(dt / 2.5)); crawl(A, t, -2, z, true);
    const fl = dt < 0.35 || (dt > 0.9 && dt < 1.05); A.nl.forEach(l => l.intensity = fl ? 0.3 : 6); A.neons.forEach(n => n.material.color.set(fl ? 0x202428 : 0xe8f2ff));
    look(A.cam, V(0.8, 1.7, 6), V(-1.8, 0.8, -30)); fov(A.cam, L(40, 32, ease(p))); return { world: A, vig: 0.85, shake: dt < 0.4 ? 0.004 : 0.0008 }; },
  st_bench(W, p, t) { const A = W.St; base(A, t); A.boy.visible = true; setTex(A.boy, A.T.boyS); A.boy.position.set(3.4, 1.0, -3.45); A.boy.scale.set(1, 1, 1);
    look(A.cam, lerpV(V(2.0, 2.3, -0.2), V(2.4, 2.2, -1.2), ease(p)), V(3.4, 2.0, -4.4)); return { world: A, vig: 0.65 }; },
  st_tunnel(W, p, t) { const A = W.St; base(A, t); look(A.cam, lerpV(V(0.3, 2.0, -10), V(-0.6, 1.8, -20), ease(p)), V(-2, 1.6, -34)); return { world: A, vig: 0.9 }; },
  st_crawl(W, p, t) { const A = W.St; base(A, t); const z = L(-18, -9, p); crawl(A, t, -2, z, true);
    look(A.cam, V(-2, 0.45, -5.5), V(-2, 0.35, -14)); fov(A.cam, 46); return { world: A, vig: 0.85 }; },
  st_hands(W, p, t) { const A = W.St; base(A, t); const z = L(-8.5, -7.6, p); crawl(A, t, -2, z, true);
    look(A.cam, V(-2.1, 0.32, -6.5), V(-2, 0.3, z)); fov(A.cam, 50); return { world: A, vig: 0.85 }; },
  st_rule(W, p, t) { const A = W.St; base(A, t); A.boy.visible = true; setTex(A.boy, A.T.boyS); A.boy.position.set(1.4, 1.0, -3); A.boy.scale.set(1, 1, 1);
    look(A.cam, V(1.45, 2.1, L(-1.95, -2.05, ease(p))), V(1.4, 2.02, -3)); fov(A.cam, 58); return { world: A, vig: 0.8 }; },
  st_behind(W, p, t, sh) { const A = W.St; base(A, t); A.boy.visible = true; setTex(A.boy, A.T.boyS); A.boy.position.set(1.4, 1.0, -3); A.boy.scale.set(1, 1, 1);
    const rise = ease(sm(0.1, 0.65, p)); A.teke.visible = true; setTex(A.teke, A.frontT[Math.floor(t * 5) % 6]); A.teke.position.set(-0.3, L(0.25, 0.62, rise), -3.7); A.teke.rotation.y = 0.5; // zieht sich von den Gleisen ueber die Bahnsteigkante
    look(A.cam, V(2.2, 1.95, L(0.2, -0.1, ease(p))), V(0.6, 1.55, -3.5)); fov(A.cam, 55); return { world: A, vig: 0.85, shake: rise > 0.9 ? 0.0012 : 0 }; },
  st_closed(W, p, t) { const A = W.St; base(A, t); A.boy.visible = true; setTex(A.boy, A.T.boyC); A.boy.position.set(1.4, 1.0, -3);
    look(A.cam, V(1.42, 2.08, L(-2.15, -2.3, ease(p))), V(1.4, 2.02, -3)); fov(A.cam, 54); return { world: A, vig: 0.85 }; },
  st_train(W, p, t, sh) { const A = W.St; base(A, t); const dt = t - sh.s, dur = sh.e - sh.s; const arrive = sm(0.35, 1, dt / dur);
    A.train.position.set(0, 0, L(-75, -1, easeOut(arrive))); A.trainL.intensity = arrive > 0 ? 30 : 0;
    look(A.cam, V(1.2, 1.9, 3), V(-1.6, 1.4, -26)); fov(A.cam, 44); return { world: A, vig: 0.7, shake: arrive > 0.2 && arrive < 0.95 ? 0.0015 : 0 }; },
  wagon(W, p, t) { const A = W.St; base(A, t); look(A.cam, lerpV(V(60, 1.5, 3), V(60, 1.45, 1.8), ease(p)), V(60, 1.1, -10)); fov(A.cam, 58); return { world: A, vig: 0.6, shake: 0.0008 }; },
  wagon_under(W, p, t, sh) { const A = W.St; base(A, t); const s1 = sh.segs[1] ? sh.segs[1].s : 1e9; const st = sh.sfx.find(f => f.n === 'stinger'), after = st ? t - st.t : -1;
    A.under.visible = true; A.under.position.set(61.15, 0.0, L(-1.4, -1.05, sm(0, 1, p))); setTex(A.under, A.frontT[Math.floor(t * 6) % 6]);
    const k = ease(sm(0, 0.6, p)); look(A.cam, lerpV(V(60.2, 1.45, 0.4), V(60.4, 0.9, -0.2), k), lerpV(V(61, 0.6, -1.2), V(61.15, 0.25, -1.05), k)); fov(A.cam, L(55, 38, k));
    if (after > 0) { look(A.cam, V(60.8, 0.28, -0.9), V(61.15, 0.3, -1.05)); fov(A.cam, 50); }
    return { world: A, vig: 0.9, tint: after > 0 ? 0.35 : 0, flash: after > 0 && after < 0.12 ? 1 - after / 0.12 : 0, shake: after > 0 && after < 0.5 ? 0.012 * (1 - after / 0.5) : (t > s1 ? 0.0015 : 0) }; },
};
for (const k of Object.keys(SHOTS)) { const f = SHOTS[k]; SHOTS[k] = (W, ...a) => { fov(W.St.cam, 50); W.St.boy.scale.set(1, 1, 1); return f(W, ...a); }; }
SHOTS._billboard = billboard; SHOTS._shake = shake;

// ------------------------------------------------------------------ 2D
function redSky(g) { const s = g.createLinearGradient(0, 0, 0, CH); s.addColorStop(0, '#3a0507'); s.addColorStop(0.55, '#a51f1a'); s.addColorStop(0.8, '#d24a2c'); s.addColorStop(1, '#260304'); g.fillStyle = s; g.fillRect(0, 0, CW, CH); }
function rails(g, y0) { g.fillStyle = '#4a0709'; g.fillRect(0, y0, CW, CH - y0); g.strokeStyle = '#6a0b0e'; g.lineWidth = 16; for (const x of [-0.25, 0.25]) { g.beginPath(); g.moveTo(CW / 2 + x * 300, y0); g.lineTo(CW / 2 + x * 2400, CH); g.stroke(); }
  g.lineWidth = 12; for (let i = 0; i < 10; i++) { const u = i / 10, y = y0 + (CH - y0) * u * u; g.beginPath(); g.moveTo(CW / 2 - 100 - u * 700, y); g.lineTo(CW / 2 + 100 + u * 700, y); g.stroke(); } }
let TF = null, TS = null;
function redTeke(g, p, t) { if (!TF) TF = [0, 1, 2, 3, 4, 5].map(k => C.tekeFront(k / 6)); redSky(g); rails(g, 1250);
  const s = L(900, 1300, ease(p)); g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 40; g.drawImage(TF[Math.floor(t * 7) % 6], CW / 2 - s / 2, 1500 - s * 0.95, s, s); g.restore(); return { vig: 0.8, tint: 0.15 }; }
function redFast(g, p, t) { if (!TS) TS = [0, 1, 2, 3, 4, 5].map(k => C.tekeSide(k / 6)); redSky(g);
  g.fillStyle = '#4a0709'; g.fillRect(0, 1250, CW, CH - 1250); g.strokeStyle = 'rgba(255,200,180,.25)'; g.lineWidth = 6; for (let i = 0; i < 18; i++) { const y = 300 + i * 70, x = ((t * 2600 + i * 337) % (CW + 600)) - 300; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 260, y); g.stroke(); }
  const x = L(-700, CW - 300, ease(p)); g.save(); g.filter = 'blur(2px)'; g.globalAlpha = 0.35; g.drawImage(TS[Math.floor(t * 9) % 6], x - 160, 820, 1000, 500); g.restore(); g.drawImage(TS[Math.floor(t * 9) % 6], x, 820, 1000, 500);
  return { vig: 0.8, tint: 0.15, shake: 0.002 }; }
export const TWO = { red_teke: redTeke, red_fast: redFast };
