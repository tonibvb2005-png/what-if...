// Folge 12 – Wendigo: verschneiter Wald in Kanada, Zelt, Lagerfeuer mit Lichtkreis, Holzstapel im Dunkeln + 2D-Szenen
import * as THREE from 'three';
import * as C from '../chars.js';
import { tex, lam, box, sprite, setTex, glow, gradTex, V, L, clamp, sm, lerpV, look, billboard, shake, rnd, ease } from '../world.js';
import { W as CW, H as CH } from '../overlay.js';

const easeOut = t => 1 - Math.pow(1 - t, 3);
function fov(cam, f) { if (cam.fov !== f) { cam.fov = f; cam.updateProjectionMatrix(); } }

function buildForest() {
  const S = new THREE.Scene(); const BG = { night: gradTex([[0, '#010208'], [1, '#0a1226']]), day: gradTex([[0, '#a8bfe0'], [1, '#eef2f8']]) }; S.background = BG.night; S.fog = new THREE.Fog(0x060a16, 6, 40);
  const hemi = new THREE.HemisphereLight(0x6a7aa8, 0x1a1418, 0.18); S.add(hemi);
  const moon = new THREE.DirectionalLight(0x9fb0e0, 0.25); moon.position.set(-10, 14, 6); S.add(moon);
  const sg = new THREE.PlaneGeometry(120, 120, 50, 50); sg.rotateX(-Math.PI / 2); const P = sg.attributes.position; for (let i = 0; i < P.count; i++) P.setY(i, rnd() * 0.12); sg.computeVertexNormals();
  S.add(new THREE.Mesh(sg, new THREE.MeshLambertMaterial({ color: 0xe8eef6, flatShading: true })));
  // Baeume (Nadelbaeume + kahle Staemme), Lichtung um (0,0) frei
  const N = 420, cone = new THREE.InstancedMesh(new THREE.ConeGeometry(1.4, 4.5, 7), lam(0x1a2a24), N), trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.22, 7, 6), lam(0x2a201a), N), M = new THREE.Matrix4(), Q = new THREE.Quaternion();
  for (let i = 0; i < N; i++) { let x, z; do { x = (rnd() - 0.5) * 80; z = (rnd() - 0.5) * 80; } while (Math.hypot(x, z) < 6.5); const s = 0.8 + rnd() * 0.8;
    M.compose(V(x, 3.5 * s, z), Q, V(s, s, s)); trunk.setMatrixAt(i, M); M.compose(V(x, 4.2 * s + 1.5, z), Q, V(s, s, s)); cone.setMatrixAt(i, M); }
  S.add(trunk, cone);
  // Zelt
  const tent = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.9, 4), lam(0xc0662a)); tent.rotation.y = Math.PI / 4; tent.position.set(-1.6, 0.95, -2.2); S.add(tent);
  const tentDoor = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.0), new THREE.MeshBasicMaterial({ color: 0x120a06 })); tentDoor.position.set(-1.6, 0.5, -1.18); S.add(tentDoor);
  // Feuer
  const fireG = new THREE.Group(); S.add(fireG);
  for (let i = 0; i < 4; i++) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.8, 6), lam(0x3a2818)); lg.rotation.z = Math.PI / 2; lg.rotation.y = i * Math.PI / 4; lg.position.y = 0.08; fireG.add(lg); }
  for (let i = 0; i < 8; i++) { const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12), lam(0x5a5a5e)); st.position.set(Math.cos(i / 8 * 6.28) * 0.5, 0.06, Math.sin(i / 8 * 6.28) * 0.5); fireG.add(st); }
  const flames = [glow(1.2, [255, 150, 50]), glow(0.8, [255, 210, 120]), glow(0.5, [255, 240, 200])]; flames.forEach((f, i) => { f.position.y = 0.3 + i * 0.12; fireG.add(f); });
  const fireL = new THREE.PointLight(0xff9a40, 18, 9, 1.3); fireL.position.set(0, 0.9, 0); S.add(fireL);
  // Sitzbaumstamm + Holzstapel im Dunkeln
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.6, 10), lam(0x4a3220)); seat.rotation.z = Math.PI / 2; seat.position.set(1.4, 0.22, 0.6); seat.rotation.y = 0.5; S.add(seat);
  const pile = new THREE.Group(); pile.position.set(4.5, 0, -6.5); S.add(pile); for (let i = 0; i < 9; i++) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 6), lam(0x4a3220)); lg.rotation.z = Math.PI / 2; lg.position.set(0, 0.1 + Math.floor(i / 3) * 0.2, (i % 3) * 0.22 - 0.22); pile.add(lg); }
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.03, 18), lam(0xe8e8e2)); plate.position.set(1.0, 0.46, 0.5); S.add(plate);
  const food = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 6), lam(0xd9a050)); food.position.set(1.0, 0.5, 0.5); S.add(food);
  // Figuren
  const T = { papaF: C.papa('front', 'neutral'), papaS: C.papa('front', 'stare'), papaE: C.papa('front', 'eyeshine'), papaB: C.papa('back'), boyF: C.boy('front', 'neutral'), boyS: C.boy('front', 'scared_sweat'), boyB: C.boy('back') };
  const papa = sprite(T.papaF, 1.55); papa.userData.noBB = true; papa.children[0].visible = false; S.add(papa);
  const boy = sprite(T.boyF, 1.3); boy.userData.noBB = true; boy.children[0].visible = false; S.add(boy);
  const TILTS = [-0.55, -0.25, 0, 0.3, 0.6], WT = TILTS.map(tl => [-1, 0, 1].map(st => C.wendigo(tl, st, st * 0.6)));
  const wen = sprite(WT[2][1], 3.4, 0.1); wen.userData.noBB = true; wen.children[0].visible = false; S.add(wen);
  const eyes = [0, 1].map(() => { const e = glow(0.18, [240, 240, 230]); e.material.fog = false; S.add(e); return e; });
  return { S, BG, hemi, moon, flames, fireL, fireG, pile, plate, food, papa, boy, wen, WT, eyes, T, cam: new THREE.PerspectiveCamera(50, 9 / 16, 0.05, 300) };
}
export function build() { return { F: buildForest() }; }

function base(A, t, o = {}) { const day = !!o.day; A.papa.visible = A.boy.visible = A.wen.visible = false; A.eyes.forEach(e => e.visible = false); A.plate.visible = A.food.visible = !!o.plate;
  A.S.background = day ? A.BG.day : A.BG.night; A.S.fog.color.set(day ? 0xdfe6f0 : 0x060a16); A.S.fog.near = day ? 6 : 3; A.S.fog.far = day ? 90 : 26; A.hemi.intensity = day ? 0.9 : 0.07; A.moon.intensity = day ? 1.0 : 0.12;
  const size = o.fire ?? 1, fl = 0.85 + Math.sin(t * 11) * 0.08 + Math.sin(t * 27) * 0.06; A.fireL.intensity = day ? 0 : 13 * size * fl; A.fireL.distance = 3 + 5 * size;
  A.flames.forEach((f, i) => { f.visible = !day && size > 0.05; f.scale.setScalar((1.2 - i * 0.35) * Math.max(0.2, size) * fl); }); }
// ruckartige, unnatuerliche Bewegung: Kopf schnappt in neue Neigung, Schritte stocken
function hsh(n) { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); }
function wenPose(A, t, walk = 0) { const k = Math.floor(t / 0.55), snap = hsh(k), ti = Math.floor(snap * 5), ph = Math.floor(t * 2.2) % 4;
  const si = walk ? [0, 1, 2, 1][ph] : 1; setTex(A.wen, A.WT[ti][si]); }
const ppl = (A, who, tx, x, z) => { const s = A[who]; s.visible = true; setTex(s, A.T[tx]); s.position.set(x, 0, z); };

export const SHOTS = {
  forest_open(W, p, t, sh) { const A = W.F; base(A, t); const dt = t - sh.s; const off = dt > 1.5 && dt < 1.62; base(A, t, { fire: off ? 0.25 : 1 });
    A.wen.visible = dt < 1.5; A.wen.position.set(-2.2, L(-2.6, 0, easeOut(clamp((dt - 0.2) / 1.2))), -9.5); wenPose(A, t * 1.4); A.wen.material.emissiveIntensity = 0.12;
    look(A.cam, lerpV(V(1.6, 1.3, 3.2), V(1.3, 1.35, 2.6), ease(p)), V(-1.5, 2.2, -8)); fov(A.cam, 50); return { world: A, vig: 0.85, shake: dt < 0.35 ? 0.004 : 0 }; },
  camp(W, p, t) { const A = W.F; base(A, t); ppl(A, 'papa', 'papaF', 0.95, -0.6); ppl(A, 'boy', 'boyF', -0.6, -0.4);
    look(A.cam, lerpV(V(0.6, 1.6, 4.4), V(0.4, 1.5, 3.6), ease(p)), V(0.0, 0.9, -0.8)); return { world: A, vig: 0.6 }; },
  quiet(W, p, t) { const A = W.F; base(A, t); look(A.cam, V(0.2, 1.6, 1.0), lerpV(V(-6, 2.0, -8), V(6, 2.0, -8), ease(p))); fov(A.cam, 55); return { world: A, vig: 0.8 }; },
  silhouette(W, p, t) { const A = W.F; base(A, t); A.wen.visible = true; A.wen.material.emissiveIntensity = 0.05; const q = Math.floor(p * 9) / 9 + (p * 9 % 1 > 0.7 ? (p * 9 % 1 - 0.7) / 0.3 / 9 : 0); A.wen.position.set(L(-5, -1, q), Math.sin(t * 5) * 0.03, -12); wenPose(A, t, 1);
    look(A.cam, V(0.3, 1.6, 1.2), V(L(-4, -1, p) * 0.8, 2.2, -12)); fov(A.cam, 40); return { world: A, vig: 0.88 }; },
  boy_rule(W, p, t) { const A = W.F; base(A, t); ppl(A, 'boy', 'boyS', 0.6, 0.6); look(A.cam, V(0.62, 1.02, L(1.45, 1.35, ease(p))), V(0.6, 0.95, 0.6)); fov(A.cam, 58); return { world: A, vig: 0.75 }; },
  low_fire(W, p, t) { const A = W.F; base(A, t, { fire: 0.3 }); ppl(A, 'boy', 'boyS', 0.6, 0.6); look(A.cam, lerpV(V(-0.6, 1.8, 3.2), V(-0.4, 1.6, 2.6), ease(p)), V(2.6, 0.5, -4.5)); return { world: A, vig: 0.85 }; },
  papa_goes(W, p, t, sh) { const A = W.F; base(A, t, { fire: 0.3 }); const s1 = sh.segs[1] ? sh.segs[1].s : sh.s, k = clamp((t - s1 - 0.6) / ((sh.e - s1) - 0.6));
    ppl(A, 'papa', k > 0 ? 'papaB' : 'papaF', L(0.9, 4.2, k), L(-0.5, -6.0, k)); A.papa.rotation.y = k > 0 ? Math.PI : 0; ppl(A, 'boy', 'boyB', 0.2, 1.4); A.boy.rotation.y = Math.PI;
    look(A.cam, V(-0.3, 1.5, 3.4), V(L(1.0, 3.6, k), 0.9, L(-0.8, -5.5, k))); return { world: A, vig: 0.8 }; },
  alone(W, p, t) { const A = W.F; base(A, t, { fire: 0.2 }); ppl(A, 'boy', 'boyS', 0.6, 0.6); A.eyes.forEach((e, i) => { e.visible = p > 0.35; e.position.set(3.6 + i * 0.22, 2.6, -7); });
    look(A.cam, lerpV(V(0.8, 1.1, 2.2), V(0.7, 1.05, 1.8), ease(p)), V(1.2, 1.2, -2)); return { world: A, vig: 0.9 }; },
  papa_back(W, p, t) { const A = W.F; const k = ease(sm(0.15, 0.7, p)); base(A, t, { fire: L(0.2, 1.2, sm(0.6, 1, p)) }); ppl(A, 'papa', 'papaF', L(3.8, 1.1, k), L(-5.0, -0.7, k));
    ppl(A, 'boy', 'boyB', 0.2, 1.4); A.boy.rotation.y = Math.PI; look(A.cam, V(-0.3, 1.5, 3.4), V(L(3.0, 1.0, k), 0.95, L(-4.5, -0.8, k))); return { world: A, vig: 0.75 }; },
  breakfast(W, p, t) { const A = W.F; base(A, t, { day: true, plate: true }); ppl(A, 'papa', 'papaS', 1.0, 0.1);
    look(A.cam, lerpV(V(-0.4, 1.4, 2.6), V(-0.1, 1.3, 2.1), ease(p)), V(0.9, 0.8, 0.2)); return { world: A, vig: 0.4 }; },
  papa_stare(W, p, t, sh) { const A = W.F; base(A, t, { day: true, plate: true }); const st = sh.sfx.find(f => f.n === 'stinger'), after = st ? t - st.t : -1;
    ppl(A, 'papa', after > 0 ? 'papaE' : 'papaS', 1.0, 0.1); A.wen.visible = after > 0 && after < 0.5; A.wen.position.set(1.6, 0, -2.2); A.wen.material.emissiveIntensity = 0.1; wenPose(A, t * 3);
    const k = ease(p); look(A.cam, V(1.0, L(1.25, 1.27, k), L(1.2, 0.85, k)), V(1.0, 1.25, 0.1)); fov(A.cam, after > 0 ? 62 : 50);
    return { world: A, vig: 0.6, tint: after > 0 ? 0.35 : 0, flash: after > 0 && after < 0.12 ? 1 - after / 0.12 : 0, shake: after > 0 && after < 0.5 ? 0.01 * (1 - after / 0.5) : 0 }; },
};
for (const k of Object.keys(SHOTS)) { const f = SHOTS[k]; SHOTS[k] = (W, ...a) => { fov(W.F.cam, 50); W.F.papa.rotation.y = 0; W.F.boy.rotation.y = 0; W.F.wen.material.emissiveIntensity = 0.09; return f(W, ...a); }; }
SHOTS._billboard = billboard; SHOTS._shake = shake;

// ------------------------------------------------------------------ 2D
function redSky(g) { const s = g.createLinearGradient(0, 0, 0, CH); s.addColorStop(0, '#3a0507'); s.addColorStop(0.55, '#a51f1a'); s.addColorStop(0.8, '#d24a2c'); s.addColorStop(1, '#260304'); g.fillStyle = s; g.fillRect(0, 0, CW, CH); }
function redTrees(g) { g.fillStyle = '#4a0709'; for (let i = 0; i < 9; i++) { const x = i * 130 - 20, h = 500 + (i * 97) % 300; g.beginPath(); g.moveTo(x - 90, 1650); g.lineTo(x, 1650 - h); g.lineTo(x + 90, 1650); g.fill(); } g.fillRect(0, 1640, CW, CH - 1640); }
let WGF = null;
function wgFrame(t) { if (!WGF) WGF = [-0.55, -0.25, 0, 0.3, 0.6].map(tl => C.wendigo(tl, 0, 0.15)); const k = Math.floor(t / 0.5), x = Math.sin(k * 127.1) * 43758.5453; return WGF[Math.floor((x - Math.floor(x)) * 5)]; }
function redWendigo(g, p, t) { redSky(g); redTrees(g); const hh = 2500, top = L(-hh + 1900, 100, ease(p));
  g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 40; g.drawImage(wgFrame(t), CW / 2 - hh / 4 + Math.sin(t * 3) * 6, top, hh / 2, hh); g.restore(); return { vig: 0.85, tint: 0.15 }; }
function redHunger(g, p, t) { redSky(g); redTrees(g); // Close-Up: duerrer Oberkoerper + Schaedel
  const hh = L(3900, 4300, ease(p)), w = hh / 2, br = 1 + Math.sin(t * 2.4) * 0.012; g.save(); g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 50;
  g.translate(CW / 2, 0); g.scale(br, 1); g.drawImage(wgFrame(t * 0.8), -w / 2, -hh * 0.07, w, hh); g.restore();
  const v = g.createLinearGradient(0, 1300, 0, CH); v.addColorStop(0, 'rgba(38,3,4,0)'); v.addColorStop(1, 'rgba(38,3,4,.95)'); g.fillStyle = v; g.fillRect(0, 1300, CW, CH - 1300);
  return { vig: 0.85, tint: 0.15 }; }
export const TWO = { red_wendigo: redWendigo, red_hunger: redHunger };
