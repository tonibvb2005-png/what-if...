// Folge 5 – Skinwalker: Wuestenstrasse in New Mexico bei Nacht/Morgen, Auto mit Innenraum + 2D-Szenen
import * as THREE from 'three';
import * as C from '../chars.js';
import { tex, lam, box, sprite, setTex, glow, gradTex, V, L, clamp, sm, lerpV, look, billboard, shake, rnd, ease } from '../world.js';
import { W as CW, H as CH } from '../overlay.js';

const easeOut = t => 1 - Math.pow(1 - t, 3);
function fov(cam, f) { if (cam.fov !== f) { cam.fov = f; cam.updateProjectionMatrix(); } }

// ------------------------------------------------------------------ Auto mit Innenraum
function makeCar() {
  const G = new THREE.Group();
  const paint = lam(0x8a3b2c), chrome = lam(0xd8dde2), dark = lam(0x15161a), seat = lam(0x4a3a30), tire = lam(0x18181a);
  const glass = new THREE.MeshLambertMaterial({ color: 0x6d86a8, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });
  G.add(box(1.9, 0.62, 4.9, paint, 0, 0.62, 0), box(1.92, 0.08, 4.95, chrome, 0, 0.88, 0));
  G.add(box(1.95, 0.16, 0.18, chrome, 0, 0.45, 2.5), box(1.95, 0.16, 0.18, chrome, 0, 0.45, -2.5));
  G.add(box(1.7, 0.07, 2.2, paint, 0, 1.5, -0.25));
  for (const [x, z] of [[0.82, 0.85], [-0.82, 0.85], [0.82, -1.35], [-0.82, -1.35], [0.82, -0.25], [-0.82, -0.25]]) G.add(box(0.07, 0.6, 0.07, paint, x, 1.2, z));
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.64, 0.62), glass); ws.position.set(0, 1.2, 0.86); G.add(ws);
  const rw = new THREE.Mesh(new THREE.PlaneGeometry(1.64, 0.6), glass); rw.position.set(0, 1.2, -1.36); G.add(rw);
  for (const x of [0.83, -0.83]) { const sw = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.58), glass); sw.rotation.y = Math.PI / 2; sw.position.set(x, 1.2, -0.25); G.add(sw); }
  G.add(box(1.6, 0.3, 0.45, dark, 0, 1.0, 1.05));
  const gauge = new THREE.MeshBasicMaterial({ color: 0x9fe0a0 }); const gauges = [];
  for (const x of [0.25, 0.45]) { const gm = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), gauge); gm.position.set(x, 1.08, 0.82); gm.rotation.y = Math.PI; G.add(gm); gauges.push(gm); }
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.022, 8, 24), dark); wheel.position.set(0.4, 1.1, 0.72); wheel.rotation.x = -0.35; G.add(wheel);
  G.add(box(1.55, 0.22, 0.55, seat, 0, 0.62, 0.0), box(1.55, 0.42, 0.14, seat, 0, 0.88, -0.3));
  G.add(box(1.55, 0.22, 0.55, seat, 0, 0.62, -1.0), box(1.55, 0.62, 0.14, seat, 0, 0.98, -1.28));
  G.add(box(1.7, 0.05, 2.2, lam(0x3a2c28), 0, 1.46, -0.25));
  for (const [x, z] of [[0.86, 1.55], [-0.86, 1.55], [0.86, -1.55], [-0.86, -1.55]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.24, 18), tire); w.rotation.z = Math.PI / 2; w.position.set(x, 0.36, z); G.add(w); }
  const hl = new THREE.MeshBasicMaterial({ color: 0xfff3d0 }), tl = new THREE.MeshBasicMaterial({ color: 0xff2a1a }); const lights = [];
  for (const x of [0.62, -0.62]) {
    const h = new THREE.Mesh(new THREE.CircleGeometry(0.13, 16), hl); h.position.set(x, 0.7, 2.47); G.add(h);
    const gl = glow(1.6, [255, 240, 200]); gl.position.set(x, 0.7, 2.6); G.add(gl); lights.push(gl);
    G.add(box(0.3, 0.12, 0.05, tl, x, 0.75, -2.47));
    const tg = glow(0.9, [255, 40, 30]); tg.position.set(x, 0.75, -2.6); G.add(tg); lights.push(tg);
  }
  const dashL = new THREE.PointLight(0xb8d8ff, 2.2, 3.5, 1.2); dashL.position.set(0, 1.35, 0.4); G.add(dashL);
  const beam = new THREE.SpotLight(0xfff0d0, 60, 70, 0.5, 0.5, 1.2); beam.position.set(0, 0.8, 2.4); beam.target.position.set(0, 0, 25); G.add(beam, beam.target);
  // Figuren: Papa faehrt (x +0.42), Junge Beifahrer (x -0.42); Beifahrerfenster bei x = -0.83
  const T = { papaF: C.papa('front', 'neutral'), papaS: C.papa('front', 'scared'), papaW: C.papa('front', 'wide'), papaB: C.papa('back'),
    boyF: C.boy('front', 'neutral'), boyS: C.boy('front', 'scared_sweat'), boyB: C.boy('back'), hush: C.boyHushed() };
  const papa = sprite(T.papaF, 1.4), kid = sprite(T.boyF, 1.35);
  for (const s of [papa, kid]) { s.userData.noBB = true; s.children[0].visible = false; G.add(s); }
  return { G, beam, lights, dashL, gauge, papa, kid, T };
}
function seats(car, mode, papaTex, kidTex, duck = 0) {
  const { papa, kid, T } = car; papa.visible = kid.visible = !!mode; if (!mode) return;
  const back = mode === 'back';
  setTex(papa, back ? T.papaB : (papaTex || T.papaF)); setTex(kid, back ? T.boyB : (kidTex || T.boyF));
  papa.position.set(0.42, 0.2 - duck * 0.4, -0.05); kid.position.set(-0.42, 0.24 - duck * 0.4, -0.05);
  papa.rotation.y = kid.rotation.y = back ? Math.PI : 0;
}

// ------------------------------------------------------------------ Welt: Wueste
function buildDesert() {
  const S = new THREE.Scene();
  const BG = { night: gradTex([[0, '#02040c'], [0.55, '#0a1430'], [0.85, '#1e2a4a'], [1, '#2a2a3a']]), dawn: gradTex([[0, '#3d4f80'], [0.5, '#c98a78'], [0.8, '#f2b27a'], [1, '#f7d39a']]) };
  S.background = BG.night; S.fog = new THREE.Fog(0x1a2240, 25, 260);
  const hemi = new THREE.HemisphereLight(0x7088c8, 0x2a1e18, 0.9); S.add(hemi);
  const moon = new THREE.DirectionalLight(0xa9bdff, 0.9); moon.position.set(-30, 40, 20); S.add(moon);
  // Boden: Sand mit Huegeln
  const gg = new THREE.PlaneGeometry(800, 2400, 80, 240); gg.rotateX(-Math.PI / 2); const col = [], P = gg.attributes.position;
  for (let i = 0; i < P.count; i++) { const k = 0.85 + rnd() * 0.25; col.push(0.42 * k, 0.3 * k, 0.21 * k); const x = Math.abs(P.getX(i)); if (x > 14) P.setY(i, rnd() * 0.25 + Math.max(0, x - 40) * 0.02 * rnd()); }
  gg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); gg.computeVertexNormals();
  S.add(new THREE.Mesh(gg, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })));
  S.add(makeRoad());
  // Tafelberge am Horizont
  for (let i = 0; i < 16; i++) { const side = i % 2 ? 1 : -1, x = side * (160 + rnd() * 160), z = -900 + i * 120 + rnd() * 60, w = 60 + rnd() * 90, h = 25 + rnd() * 35;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.8, w, h, 7), lam(0x4a2e24)); m.position.set(x, h / 2, z); S.add(m); }
  // Kakteen + Straeucher (instanziert)
  const N = 900, cact = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.26, 2.6, 6), lam(0x2f4a2c), N), arm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.16, 1.1, 6), lam(0x2f4a2c), N);
  const bush = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.6, 0), lam(0x5a5a36), N), M = new THREE.Matrix4(), Q = new THREE.Quaternion();
  for (let i = 0; i < N; i++) { const side = rnd() > .5 ? 1 : -1, x = side * (14 + rnd() * 90), z = -1200 + rnd() * 2400, s = 0.7 + rnd() * 0.9;
    M.compose(V(x, 1.3 * s, z), Q, V(s, s, s)); cact.setMatrixAt(i, M); M.compose(V(x + 0.45 * s, 1.7 * s, z), Q, V(s, s, s)); arm.setMatrixAt(i, M);
    M.compose(V(-side * (5 + rnd() * 60), 0.2, -1200 + rnd() * 2400), Q, V(s, 0.6 * s, s)); bush.setMatrixAt(i, M); }
  S.add(cact, arm, bush);
  // Sterne + Mond + Sonne
  const sg = new THREE.BufferGeometry(), sp = []; for (let i = 0; i < 1500; i++) { const a = rnd() * Math.PI * 2, e = 0.08 + rnd() * 1.3; sp.push(Math.cos(a) * Math.cos(e) * 600, Math.sin(e) * 600, Math.sin(a) * Math.cos(e) * 600); }
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false })); S.add(stars);
  const moonS = glow(40, [200, 215, 255]); moonS.material.fog = false; moonS.position.set(-150, 140, 380); S.add(moonS);
  const sun = glow(160, [255, 200, 120]); sun.material.fog = false; sun.position.set(-60, 12, 500); S.add(sun);
  const car = makeCar(); S.add(car.G);
  // Skinwalker: laufend (Vierbeiner), aufrecht, Papa-Gestalt am Fenster
  const runT = Array.from({ length: 12 }, (_, k) => C.skinRun(k / 12));
  const run = sprite(runT[0], 1.25, 0.2); run.userData.noBB = true; run.children[0].visible = false; S.add(run);
  const upT = Array.from({ length: 12 }, (_, k) => C.skinRunUp(k / 12));
  const stand = sprite(upT[0], 2.7, 0.2); stand.userData.noBB = true; stand.children[0].visible = false; S.add(stand);
  const shapeC = C.cv(1024, 2048), sx = shapeC.getContext('2d'); sx.filter = 'brightness(0.32) saturate(0.4)'; sx.drawImage(C.papa('front', 'neutral'), 0, 0, 1024, 2048); sx.filter = 'none';
  for (const x of [392, 632]) { const gr = sx.createRadialGradient(x, 640, 2, x, 640, 60); gr.addColorStop(0, '#fff'); gr.addColorStop(0.3, 'rgba(255,225,140,1)'); gr.addColorStop(1, 'rgba(255,200,80,0)'); sx.fillStyle = gr; sx.beginPath(); sx.arc(x, 640, 60, 0, 7); sx.fill(); }
  const shape = sprite(shapeC, 1.75, 0.0); shape.userData.noBB = true; shape.children[0].visible = false; S.add(shape);
  const hand = sprite(handTex(), 0.32, 0.1); hand.userData.noBB = true; hand.children[0].visible = false; S.add(hand);
  return { S, BG, hemi, moon, stars, moonS, sun, car, run, runT, upT, stand, shape, hand, cam: new THREE.PerspectiveCamera(50, 9 / 16, 0.08, 1500) };
}
function handTex() { // Knoechel von aussen am Glas
  const c = C.cv(256, 256), g = c.getContext('2d'); g.fillStyle = '#3a3029'; g.strokeStyle = '#120c0a'; g.lineWidth = 8;
  g.beginPath(); g.roundRect(40, 70, 170, 130, 50); g.fill(); g.stroke();
  for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(70 + i * 38, 80, 22, 0, 7); g.fill(); g.stroke(); }
  return c;
}

// Strasse als Textur (Mipmaps -> kein Flimmern): Asphalt, weisse Randlinien, gelbe Mittellinie, Bankett
function makeRoad() {
  const c = C.cv(512, 1024), g = c.getContext('2d');
  g.fillStyle = '#34322f'; g.fillRect(0, 0, 512, 1024);
  for (let i = 0; i < 9000; i++) { const v = 40 + Math.floor(rnd() * 30); g.fillStyle = `rgba(${v},${v - 2},${v - 4},.6)`; g.fillRect(rnd() * 512, rnd() * 1024, 2, 2); }
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(120, 0, 70, 1024); g.fillRect(322, 0, 70, 1024);   // Fahrspuren
  g.fillStyle = '#e8e6df'; g.fillRect(34, 0, 14, 1024); g.fillRect(464, 0, 14, 1024);          // Randlinien
  g.fillStyle = '#e0b53c'; g.fillRect(250, 0, 12, 400);                                          // Mittelstrich
  const t = tex(c); t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 240); t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  const G = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ map: t, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 2400), mat); road.rotation.x = -Math.PI / 2; road.position.y = 0.06; G.add(road);
  const shoulder = new THREE.MeshLambertMaterial({ color: 0x7a6650, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  for (const x of [-4.6, 4.6]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2400), shoulder); s.rotation.x = -Math.PI / 2; s.position.set(x, 0.04, 0); G.add(s); }
  return G;
}
export function build() { return { D: buildDesert() }; }

const carAt = (car, x, z, ry = 0) => { car.G.position.set(x, 0, z); car.G.rotation.y = ry; car.G.updateMatrixWorld(); };
const inCar = (car, lx, ly, lz) => car.G.localToWorld(V(lx, ly, lz));
function base(D, mode = 'night', lights = true) {
  const c = D.car; c.beam.intensity = lights ? 60 : 0; c.lights.forEach(l => l.visible = lights); c.dashL.intensity = lights ? 2.2 : 0.15; c.gauge.color.set(lights ? 0x9fe0a0 : 0x1a221a);
  D.run.visible = D.stand.visible = D.shape.visible = D.hand.visible = false; seats(c, null);
  if (mode === 'night') { D.S.background = D.BG.night; D.S.fog.color.set(0x1a2240); D.S.fog.near = 25; D.S.fog.far = 260; D.hemi.color.set(0x7088c8); D.hemi.intensity = 0.9; D.moon.intensity = 0.9; D.stars.visible = D.moonS.visible = true; D.sun.visible = false; }
  else { D.S.background = D.BG.dawn; D.S.fog.color.set(0xe0a88a); D.S.fog.near = 40; D.S.fog.far = 420; D.hemi.color.set(0xffe2c4); D.hemi.intensity = 1.6; D.moon.color.set(0xffc890); D.moon.intensity = 1.4; D.stars.visible = D.moonS.visible = false; D.sun.visible = true; }
  if (mode === 'night') D.moon.color.set(0xa9bdff);
}
// Skinwalker neben dem Auto (Beifahrerseite = -x), laeuft mit
function runner(D, t, z, dx = -3.2, upright = 0) {
  const k = Math.floor(t * 2.4 * 12) % 12; setTex(D.run, D.runT[k]); D.run.visible = upright < 0.5; D.stand.visible = upright >= 0.5;
  const bob = Math.abs(Math.sin(t * 2.4 * Math.PI * 2)) * 0.1;
  D.run.position.set(dx, 0, z); D.run.rotation.y = -Math.PI / 2; // Gesicht in Fahrtrichtung (+z)
  setTex(D.stand, D.upT[Math.floor(t * 2.0 * 12) % 12]); D.stand.position.set(dx, 0, z); D.stand.rotation.y = -Math.PI / 2;
}

export const SHOTS = {
  desert_wide(W, p, t, sh) { const D = W.D; base(D); const z = (t - sh.s) * 14; carAt(D.car, 1.6, z);
    look(D.cam, lerpV(V(-9, 3.2, z + 22), V(-7, 2.2, z + 14), ease(p)), V(1.6, 1.0, z)); return { world: D, vig: 0.6 }; },
  car_front(W, p, t, sh) { const D = W.D; base(D); const z = 100 + (t - sh.s) * 25; carAt(D.car, 1.6, z); seats(D.car, 'front');
    fov(D.cam, 58); look(D.cam, inCar(D.car, 0, 1.42 + Math.sin(t * 9) * 0.004, L(2.7, 2.4, ease(p))), inCar(D.car, 0, 1.18, -0.05)); return { world: D, vig: 0.6 }; },
  side_run(W, p, t, sh) { const D = W.D; base(D); const z = 200 + (t - sh.s) * 27; carAt(D.car, 1.6, z); seats(D.car, null);
    const appear = sm(0.05, 0.4, p); runner(D, t, z + L(-6, 0.4, appear), -2.8);
    fov(D.cam, 62); look(D.cam, inCar(D.car, -0.3, 1.2, 0.25), inCar(D.car, -6, 0.7, 0.5)); return { world: D, vig: 0.72, shake: 0.0015 }; },
  chase_wide(W, p, t, sh) { const D = W.D; base(D); const z = 300 + (t - sh.s) * 27; carAt(D.car, 1.6, z); runner(D, t, z + 0.6, -2.4);
    look(D.cam, lerpV(V(-5.2, 1.0, z + 6.5), V(-4.6, 0.9, z + 5.5), ease(p)), V(-0.6, 0.8, z)); return { world: D, vig: 0.65, shake: 0.002 }; },
  side_upright(W, p, t, sh) { const D = W.D; base(D); const z = 400 + (t - sh.s) * 27; carAt(D.car, 1.6, z);
    const up = sm(0.15, 0.4, p); runner(D, t, z + 0.3, -2.9, up);
    fov(D.cam, 62); look(D.cam, inCar(D.car, -0.3, 1.2, 0.25), inCar(D.car, -6, L(0.8, 1.9, up), 0.4)); return { world: D, vig: 0.75, shake: up > 0.5 ? 0.003 : 0.0015 }; },
  car_stall(W, p, t, sh) { const D = W.D; const s1 = sh.segs[0].s + 0.6, off = t > s1; base(D, 'night', !off || Math.floor(t * 14) % 3 === 0 && t < s1 + 0.5);
    const v = off ? Math.max(0, 25 * (1 - (t - s1) / 2.5)) : 25; const z = 500 + (t - sh.s) * 25 - (off ? (t - s1) * (25 - v) / 2 : 0); carAt(D.car, 1.6, z); seats(D.car, 'back');
    fov(D.cam, 68); look(D.cam, inCar(D.car, 0, 1.38 + Math.sin(t * 9) * (v / 25) * 0.004, -1.3), inCar(D.car, 0, 1.05, 6)); return { world: D, vig: 0.7 }; },
  car_rule(W, p, t) { const D = W.D; base(D, 'night', false); carAt(D.car, 1.6, 560); seats(D.car, 'front', D.car.T.papaS, D.car.T.boyS);
    fov(D.cam, 58); look(D.cam, inCar(D.car, -0.2, 1.36, L(2.4, 2.15, ease(p))), inCar(D.car, -0.3, 1.15, -0.05)); return { world: D, vig: 0.7 }; },
  car_duck(W, p, t) { const D = W.D; base(D, 'night', false); carAt(D.car, 1.6, 560); seats(D.car, 'front', D.car.T.papaS, D.car.T.boyS, ease(sm(0.45, 0.8, p)));
    fov(D.cam, 58); look(D.cam, inCar(D.car, 0, 1.4, 2.5), inCar(D.car, 0, L(1.1, 0.85, ease(sm(0.45, 0.8, p))), -0.05)); return { world: D, vig: 0.75 }; },
  window_knock(W, p, t, sh) { const D = W.D; base(D, 'night', false); carAt(D.car, 1.6, 560);
    const kn = sh.sfx.find(f => f.n === 'carknock'); const dt = kn ? t - kn.t : -1; const voiceOn = sh.segs[1] && t > sh.segs[1].s - 0.3;
    D.hand.visible = dt > -0.1 && !voiceOn; D.hand.position.copy(inCar(D.car, -0.92, 1.02 + (dt > 0 && dt < 1.2 && (dt * 4.5) % 1 < 0.3 ? 0.0 : 0.02), -0.2)); D.hand.rotation.y = Math.PI / 2;
    D.shape.visible = voiceOn; D.shape.position.copy(inCar(D.car, L(-1.5, -1.2, sm(0, 1, p)), 0.08, -0.2)); D.shape.rotation.y = Math.PI / 2; D.moon.intensity = 1.6;
    fov(D.cam, 64); look(D.cam, inCar(D.car, 0.25, 0.95, -0.25), inCar(D.car, -1.2, 1.15, -0.2)); return { world: D, vig: 0.8, shake: voiceOn ? 0.0012 : 0 }; },
  kid_face(W, p) { const D = W.D; base(D, 'night', false); carAt(D.car, 1.6, 560); seats(D.car, 'front', D.car.T.papaS, D.car.T.boyS, 0.2);
    fov(D.cam, 50); look(D.cam, inCar(D.car, -0.42, 1.2, L(0.9, 0.72, ease(p))), inCar(D.car, -0.42, 1.12, -0.05)); return { world: D, vig: 0.85 }; },
  hushed(W, p, t, sh) { const D = W.D; base(D, 'night', false); carAt(D.car, 1.6, 560); const pa = L(sh.segs[0].s, sh.segs[0].e, 0.5), two = t > pa;
    seats(D.car, 'front', D.car.T.papaS, two ? D.car.T.hush : D.car.T.boyS, 0.2);
    D.shape.visible = true; D.shape.position.copy(inCar(D.car, -1.5, 0.08, -0.4)); D.shape.rotation.y = 0.2; D.moon.intensity = 1.6;
    fov(D.cam, 62); look(D.cam, inCar(D.car, -0.05, 1.2, L(0.85, 0.72, ease(p))), inCar(D.car, -0.25, 1.1, -0.05)); return { world: D, vig: 0.8 }; },
  dawn_wide(W, p, t, sh) { const D = W.D; base(D, 'dawn'); const on = t > sh.segs[0].e - 1.2; const z = 560 + (on ? (t - sh.segs[0].e + 1.2) ** 2 * 1.5 : 0); carAt(D.car, 1.6, z);
    D.car.lights.forEach(l => l.visible = on); D.car.beam.intensity = 0;
    look(D.cam, lerpV(V(-9, 2.2, 572), V(-8, 1.8, 568), ease(p)), V(1.6, 1.4, z + 4)); return { world: D, vig: 0.4 }; },
  papa_smile(W, p, t, sh) { const D = W.D; base(D, 'dawn'); const z = 700 + (t - sh.s) * 20; carAt(D.car, 1.6, z); D.car.dashL.intensity = 0.5;
    seats(D.car, 'front', D.car.T.papaW, D.car.T.boyF); D.car.kid.visible = false;
    fov(D.cam, 46); look(D.cam, inCar(D.car, -0.15, 1.2 + Math.sin(t * 9) * 0.003, L(0.75, 0.6, ease(p))), inCar(D.car, 0.42, 1.13, -0.05)); return { world: D, vig: 0.55 }; },
};
for (const k of Object.keys(SHOTS)) { const f = SHOTS[k]; SHOTS[k] = (W, ...a) => { fov(W.D.cam, 50); return f(W, ...a); }; }
SHOTS._billboard = billboard; SHOTS._shake = shake;

// ------------------------------------------------------------------ 2D-Szenen
let SKS = null, SKR = null, PAPA = null, PAPAE = null;
function redSky(g) { const s = g.createLinearGradient(0, 0, 0, CH); s.addColorStop(0, '#3a0507'); s.addColorStop(0.55, '#a51f1a'); s.addColorStop(0.8, '#d24a2c'); s.addColorStop(1, '#260304'); g.fillStyle = s; g.fillRect(0, 0, CW, CH); }
function mesas(g, base) { g.fillStyle = '#4a0709'; g.beginPath(); g.moveTo(0, CH); g.lineTo(0, base - 120); g.lineTo(220, base - 140); g.lineTo(260, base - 40); g.lineTo(560, base - 60); g.lineTo(620, base - 230); g.lineTo(880, base - 240); g.lineTo(920, base - 80); g.lineTo(CW, base - 90); g.lineTo(CW, CH); g.fill(); }
function redSkin(g, p, t) {
  if (!SKS) SKS = C.skinStand(false); redSky(g); mesas(g, 1500);
  const hh = 2600, top = L(-hh + 1700, 120, ease(p));
  g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 40; g.drawImage(SKS, CW / 2 - hh / 4, top, hh / 2, hh); g.restore();
  return { vig: 0.75, tint: 0.15 };
}
function redShift(g, p, t) {
  if (!SKS) SKS = C.skinStand(false); if (!SKR) SKR = C.skinRun(0.8); if (!PAPA) PAPA = C.papa('front', 'neutral');
  redSky(g); mesas(g, 1560);
  const forms = [[SKS, 600, 1200], [PAPA, 600, 1200]], u = p * 2, i = Math.min(1, Math.floor(u)), f = u - i;
  const draw = (k, a) => { const [im, w, h] = forms[k]; g.globalAlpha = a; g.save(); g.filter = 'brightness(0.15)'; g.drawImage(im, CW / 2 - w / 2, 1450 - h, w, h); g.restore(); };
  const fade = sm(0.6, 1, f); draw(i, i < 1 ? 1 - fade : 1); if (i < 1) draw(i + 1, fade); g.globalAlpha = 1; g.filter = 'none';
  const ex = CW / 2, ey = 1450 - 1200 + L(270, 360, i === 0 ? fade : 1); const pulse = 0.7 + 0.3 * Math.sin(t * 7);
  g.save(); g.globalCompositeOperation = 'lighter'; for (const dx of [-38, 38]) { const gr = g.createRadialGradient(ex + dx, ey, 1, ex + dx, ey, 50); gr.addColorStop(0, `rgba(255,230,150,${pulse})`); gr.addColorStop(1, 'rgba(255,160,40,0)'); g.fillStyle = gr; g.beginPath(); g.arc(ex + dx, ey, 50, 0, 7); g.fill(); } g.restore();
  g.fillStyle = 'rgba(255,230,210,.85)'; g.font = '400 50px Anton'; g.textAlign = 'center';
  ['„PAPA?“', '„MACH AUF“', '„ICH BIN\'S“'].forEach((s2, k) => { const v = (t * 0.6 + k / 3) % 1; g.globalAlpha = Math.sin(v * Math.PI) * sm(0.3, 0.6, p); g.fillText(s2, CW / 2 + (k - 1) * 320, 420 - v * 160); }); g.globalAlpha = 1;
  return { vig: 0.75, tint: 0.15 };
}
function dashClock(g, p, t) {
  g.fillStyle = '#07080b'; g.fillRect(0, 0, CW, CH);
  const sky = g.createLinearGradient(0, 0, 0, 760); sky.addColorStop(0, '#02040c'); sky.addColorStop(1, '#141c33'); g.fillStyle = sky; g.fillRect(0, 0, CW, 760);
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + (i * 37 % 10) / 15})`; g.fillRect((i * 151) % CW, (i * 97) % 700, 3, 3); }
  // Kratzspuren am Dachhimmel
  const sc = sm(0.2, 0.9, p); g.strokeStyle = `rgba(30,22,18,${0.9 * sc})`; g.lineWidth = 9; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(260 + k * 40, 60); g.lineTo(380 + k * 40, 60 + 260 * sc); g.stroke(); }
  const dg = g.createLinearGradient(0, 760, 0, CH); dg.addColorStop(0, '#24262b'); dg.addColorStop(1, '#0c0d10'); g.fillStyle = dg; g.beginPath(); g.moveTo(0, 820); g.quadraticCurveTo(CW / 2, 700, CW, 820); g.lineTo(CW, CH); g.lineTo(0, CH); g.fill();
  const mins = L(3 * 60 + 10, 5 * 60 + 50, ease(p)), hh = Math.floor(mins / 60), mm = Math.floor(mins % 60);
  const x = CW / 2 - 330, y = 980; g.fillStyle = '#050607'; g.beginPath(); g.roundRect(x - 30, y - 30, 720, 300, 30); g.fill();
  g.save(); g.shadowColor = 'rgba(80,255,140,.8)'; g.shadowBlur = 40; g.fillStyle = '#7dffa8'; g.font = '400 230px Anton'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(`0${hh}${Math.floor(t * 2) % 2 ? ':' : ' '}${String(mm).padStart(2, '0')}`, CW / 2, y + 125); g.restore();
  return { vig: 0.6, shake: 0 };
}
function sandShoes(g, p, t) {
  const fl = g.createLinearGradient(0, 0, 0, CH); fl.addColorStop(0, '#2a2420'); fl.addColorStop(1, '#14100e'); g.fillStyle = fl; g.fillRect(0, 0, CW, CH);
  g.fillStyle = '#1b1715'; g.beginPath(); g.roundRect(90, 520, CW - 180, 1100, 50); g.fill(); // Fussmatte
  g.strokeStyle = 'rgba(255,255,255,.04)'; g.lineWidth = 6; for (let y = 560; y < 1600; y += 40) { g.beginPath(); g.moveTo(120, y); g.lineTo(CW - 120, y); g.stroke(); }
  const s = L(1, 1.12, ease(p)); g.save(); g.translate(CW / 2, 1050); g.scale(s, s);
  for (let i = 0; i < 260; i++) { const a = (i * 2.399) % 6.28, r = 60 + (i * 53) % 420; g.fillStyle = `rgba(${200 + i % 30},${150 + i % 25},${100 + i % 20},.9)`; g.beginPath(); g.ellipse(Math.cos(a) * r, Math.sin(a) * r * 0.7 + 120, 14 + i % 9, 8 + i % 5, a, 0, 7); g.fill(); }
  for (const sx of [-170, 170]) { g.save(); g.translate(sx, 0); g.rotate(sx * 0.0006);
    g.fillStyle = '#2b211b'; g.strokeStyle = '#0b0807'; g.lineWidth = 10; g.beginPath(); g.ellipse(0, 40, 120, 250, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#3a2d24'; g.beginPath(); g.ellipse(0, -110, 85, 90, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(214,170,112,.95)'; g.beginPath(); g.ellipse(0, 150, 116, 120, 0, 0, Math.PI); g.fill();
    for (let k = 0; k < 40; k++) { g.beginPath(); g.ellipse(((k * 37) % 200) - 100, ((k * 61) % 260) - 80, 10, 6, k, 0, 7); g.fill(); }
    g.strokeStyle = '#c99a62'; g.lineWidth = 7; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-50 + k * 30, -30); g.lineTo(-20 + k * 30, 90); g.stroke(); }
    g.restore(); }
  g.restore();
  return { vig: 0.7 };
}
function mirrorEyes(g, p, t, shot) {
  if (!PAPAE) PAPAE = C.papa('front', 'eyeshine');
  const st = shot.sfx.find(f => f.n === 'stinger'), after = st ? t - st.t : -1;
  const sky = g.createLinearGradient(0, 0, 0, CH); sky.addColorStop(0, '#6a7fa8'); sky.addColorStop(0.6, '#e2a37e'); sky.addColorStop(1, '#3a2a22'); g.fillStyle = sky; g.fillRect(0, 0, CW, CH);
  g.fillStyle = '#2a1e18'; g.fillRect(0, 1300, CW, CH - 1300); // Armaturenbrett
  const mx = CW / 2, my = 760, mw = 900, mh = 330, zoom = L(1, 1.35, ease(p));
  g.save(); g.translate(mx, my); g.scale(zoom, zoom);
  g.fillStyle = '#111'; g.fillRect(-12, -mh / 2 - 400, 24, 400);
  g.fillStyle = '#16171a'; g.beginPath(); g.roundRect(-mw / 2 - 26, -mh / 2 - 26, mw + 52, mh + 52, 60); g.fill();
  g.save(); g.beginPath(); g.roundRect(-mw / 2, -mh / 2, mw, mh, 46); g.clip();
  g.fillStyle = '#8a6a58'; g.fillRect(-mw / 2, -mh / 2, mw, mh);
  const iw = 1300, ih = 2600; g.drawImage(PAPAE, -iw / 2 + 120, -ih * 0.235, iw, ih); // Augenpartie im Spiegel
  g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.moveTo(-mw / 2, -mh / 2); g.lineTo(-mw / 2 + 300, -mh / 2); g.lineTo(-mw / 2 + 120, mh / 2); g.lineTo(-mw / 2 - 180, mh / 2); g.fill();
  g.restore(); g.restore();
  if (after > 0) { g.fillStyle = `rgba(160,0,0,${Math.min(0.35, after)})`; g.fillRect(0, 0, CW, CH); }
  return { vig: 0.75, tint: after > 0 ? 0.4 : 0.1, shake: 0, flash: after > 0 && after < 0.12 ? 1 - after / 0.12 : 0 };
}
export const TWO = { red_skin: redSkin, red_shift: redShift, dash_clock: dashClock, sand_shoes: sandShoes, mirror_eyes: mirrorEyes };
