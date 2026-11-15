// Folge 2 – Mothman: Welten (Nacht-Strasse, Bruecke in der Daemmerung, Kinderzimmer) + 2D-Szenen
import * as THREE from 'three';
import * as C from '../chars.js';
import { tex, lam, box, sprite, setTex, glow, gradTex, V, L, clamp, sm, lerpV, look, onlyShow, billboard, shake, rnd, ease } from '../world.js';
import { W as CW, H as CH } from '../overlay.js';

const easeOut = t => 1 - Math.pow(1 - t, 3);

// ------------------------------------------------------------------ Auto (60er-Jahre-Limousine) mit Innenraum
function makeCar(color = 0x7fb3ad, withSprites = false) {
  const G = new THREE.Group();
  const paint = lam(color), chrome = lam(0xd8dde2), dark = lam(0x15161a), seat = lam(0x6a3b2e), tire = lam(0x18181a);
  const glass = new THREE.MeshLambertMaterial({ color: 0x6d86a8, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide });
  G.add(box(1.9, 0.62, 4.9, paint, 0, 0.62, 0));                     // Karosserie
  G.add(box(1.92, 0.08, 4.95, chrome, 0, 0.88, 0));                  // Zierleiste
  G.add(box(1.95, 0.16, 0.18, chrome, 0, 0.45, 2.5), box(1.95, 0.16, 0.18, chrome, 0, 0.45, -2.5));
  G.add(box(1.7, 0.07, 2.2, paint, 0, 1.5, -0.25));                   // Dach
  for (const [x, z, rz] of [[0.82, 0.85, 0], [-0.82, 0.85, 0], [0.82, -1.35, 0], [-0.82, -1.35, 0], [0.82, -0.25, 0], [-0.82, -0.25, 0]]) G.add(box(0.07, 0.6, 0.07, paint, x, 1.2, z));
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.64, 0.62), glass); ws.position.set(0, 1.2, 0.86); G.add(ws);
  const rw = new THREE.Mesh(new THREE.PlaneGeometry(1.64, 0.6), glass); rw.position.set(0, 1.2, -1.36); G.add(rw);
  for (const x of [0.83, -0.83]) { const sw = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.58), glass); sw.rotation.y = Math.PI / 2; sw.position.set(x, 1.2, -0.25); G.add(sw); }
  // Innenraum
  G.add(box(1.6, 0.3, 0.45, dark, 0, 1.0, 1.05));                    // Armaturenbrett
  const gauge = new THREE.MeshBasicMaterial({ color: 0x9fe0a0 });
  for (const x of [0.25, 0.45]) { const gm = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), gauge); gm.position.set(x, 1.08, 0.82); gm.rotation.y = Math.PI; G.add(gm); }
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.022, 8, 24), dark); wheel.position.set(0.4, 1.1, 0.72); wheel.rotation.x = -0.35; G.add(wheel);
  G.add(box(1.55, 0.22, 0.55, seat, 0, 0.62, 0.0), box(1.55, 0.42, 0.14, seat, 0, 0.88, -0.3));   // Sitzbank vorne
  G.add(box(1.55, 0.22, 0.55, seat, 0, 0.62, -1.0), box(1.55, 0.62, 0.14, seat, 0, 0.98, -1.28));
  G.add(box(1.7, 0.05, 2.2, lam(0x3a2c28), 0, 1.46, -0.25));         // Himmel innen
  for (const [x, z] of [[0.86, 1.55], [-0.86, 1.55], [0.86, -1.55], [-0.86, -1.55]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.24, 18), tire); w.rotation.z = Math.PI / 2; w.position.set(x, 0.36, z); G.add(w); }
  // Lichter
  const hl = new THREE.MeshBasicMaterial({ color: 0xfff3d0 }), tl = new THREE.MeshBasicMaterial({ color: 0xff2a1a });
  const lights = [];
  for (const x of [0.62, -0.62]) {
    const h = new THREE.Mesh(new THREE.CircleGeometry(0.13, 16), hl); h.position.set(x, 0.7, 2.47); G.add(h);
    const gl = glow(1.6, [255, 240, 200]); gl.position.set(x, 0.7, 2.6); G.add(gl); lights.push(gl);
    const t = box(0.3, 0.12, 0.05, tl, x, 0.75, -2.47); G.add(t);
    const tg = glow(0.9, [255, 40, 30]); tg.position.set(x, 0.75, -2.6); G.add(tg); lights.push(tg);
  }
  const dashL = new THREE.PointLight(0xb8d8ff, 2.2, 3.5, 1.2); dashL.position.set(0, 1.35, 0.4); G.add(dashL);
  const beam = new THREE.SpotLight(0xfff0d0, 60, 70, 0.5, 0.5, 1.2); beam.position.set(0, 0.8, 2.4); beam.target.position.set(0, 0, 25); G.add(beam, beam.target);
  const S = {};
  if (withSprites) {
    S.boyB = sprite(C.boy('back'), 1.35); S.benB = sprite(C.ben('back'), 1.35);
    S.boyF = sprite(C.boy('front', 'scared_sweat'), 1.35); S.benF = sprite(C.ben('front', 'neutral'), 1.35); S.benS = sprite(C.ben('front', 'scared_sweat'), 1.35);
    for (const k in S) { const s = S[k]; s.userData.noBB = true; s.children[0].visible = false; G.add(s); }
  }
  return { G, beam, S, lights };
}
function seatSprites(car, mode) { // mode: 'back' (Kamera hinten) | 'front' (Kamera vorne) | 'ben' | null
  const S = car.S; for (const k in S) S[k].visible = false; if (!mode) return;
  if (mode === 'back') { for (const [s, x] of [[S.benB, 0.42], [S.boyB, -0.42]]) { s.visible = true; s.position.set(x, 0.24, -0.05); s.rotation.y = Math.PI; } }
  if (mode === 'front') { for (const [s, x] of [[S.benF, 0.42], [S.boyF, -0.42]]) { s.visible = true; s.position.set(x, 0.24, -0.05); s.rotation.y = 0; } }
  if (mode === 'ben') { S.benS.visible = true; S.benS.position.set(0.42, 0.24, -0.05); S.benS.rotation.y = -0.75; }
}

// ------------------------------------------------------------------ Mothman (Sprite + leuchtende Augen)
function makeMoth(h = 2.95) {
  const G = new THREE.Group();
  const s = sprite(C.mothman('folded'), h, 0.3); s.children[0].visible = false; G.add(s);
  const eyes = [];
  for (const x of [-0.037, 0.037]) { const e = glow(0.55, [255, 40, 25]); e.material.fog = false; e.position.set(x * h, h * (1 - 330 / 1024), 0.05); G.add(e); eyes.push(e); }
  const T = { folded: C.mothman('folded'), open: C.mothman('open') };
  return { G, s, eyes, T, h, pose: 'folded' };
}
function mothPose(m, pose) { if (m.pose !== pose) { setTex(m.s, m.T[pose]); m.pose = pose; } }
function mothEyes(m, size, op = 1) { for (const e of m.eyes) { e.scale.setScalar(size); e.material.opacity = op; } }

// ------------------------------------------------------------------ NACHT: Waldstrasse + Bunker
function buildNight() {
  const S = new THREE.Scene();
  S.background = gradTex([[0, '#03060f'], [0.55, '#0b1630'], [0.8, '#172748'], [1, '#0b1428']]);
  S.fog = new THREE.Fog(0x13213f, 12, 110);
  S.add(new THREE.HemisphereLight(0x7088c8, 0x141824, 1.0));
  const moon = new THREE.DirectionalLight(0xa9bdff, 1.2); moon.position.set(-20, 30, 15); S.add(moon);
  const gg = new THREE.PlaneGeometry(400, 1200, 60, 160); gg.rotateX(-Math.PI / 2);
  const col = []; const P = gg.attributes.position; for (let i = 0; i < P.count; i++) { const k = 0.8 + rnd() * 0.3; col.push(0.08 * k, 0.13 * k, 0.1 * k); if (Math.abs(P.getX(i)) > 8) P.setY(i, rnd() * 0.4); }
  gg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); gg.computeVertexNormals();
  S.add(new THREE.Mesh(gg, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })));
  const road = new THREE.Mesh(new THREE.PlaneGeometry(7, 1200), lam(0x2a2c31)); road.rotation.x = -Math.PI / 2; road.position.y = 0.02; S.add(road);
  const dash = lam(0xd9b24a); for (let z = -600; z < 600; z += 8) S.add(box(0.14, 0.01, 3, dash, 0, 0.03, z));
  // Baeume (instanziert)
  const N = 1400, cone = new THREE.ConeGeometry(1.6, 5, 6), trunk = new THREE.CylinderGeometry(0.15, 0.2, 1.4, 5);
  const im = new THREE.InstancedMesh(cone, lam(0x1b3a30), N), it = new THREE.InstancedMesh(trunk, lam(0x2b1d16), N), M = new THREE.Matrix4();
  for (let i = 0; i < N; i++) {
    const side = rnd() > .5 ? 1 : -1, x = side * (7 + rnd() * 70), z = -600 + rnd() * 1200, s = 0.8 + rnd() * 1.4;
    if (x < -10 && x > -26 && z > 30 && z < 160) { M.makeScale(0, 0, 0); im.setMatrixAt(i, M); it.setMatrixAt(i, M); continue; }
    M.compose(V(x, 3.2 * s, z), new THREE.Quaternion(), V(s, s, s)); im.setMatrixAt(i, M);
    M.compose(V(x, 0.7 * s, z), new THREE.Quaternion(), V(s, s, s)); it.setMatrixAt(i, M);
  }
  S.add(im, it);
  // Bunker (Erdhuegel mit Betonfront)
  for (let k = 0; k < 7; k++) {
    const z = 40 + k * 17, x = -18;
    const mound = new THREE.Mesh(new THREE.SphereGeometry(5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), lam(0x2d4a36)); mound.scale.set(1, 0.6, 1.2); mound.position.set(x, 0, z); S.add(mound);
    S.add(box(0.6, 2.6, 4.2, lam(0x9a9ca0), x + 4.6, 1.3, z), box(0.1, 1.9, 1.6, lam(0x2d2f33), x + 4.95, 0.95, z));
  }
  const car = makeCar(0x7fb3ad, true); S.add(car.G);
  const moth = makeMoth(); S.add(moth.G);
  const moonS = glow(30, [190, 210, 255]); moonS.position.set(-120, 90, 300); moonS.material.fog = false; S.add(moonS);
  return { S, car, moth, cam: new THREE.PerspectiveCamera(50, 9 / 16, 0.05, 900) };
}

// ------------------------------------------------------------------ DAEMMERUNG: Fluss + Silver Bridge
function buildDusk() {
  const S = new THREE.Scene();
  S.background = gradTex([[0, '#2a1d4d'], [0.45, '#8c3f6e'], [0.68, '#e07d5a'], [0.8, '#f6b26b'], [1, '#6b3a52']]);
  S.fog = new THREE.Fog(0xb0667a, 60, 520);
  S.add(new THREE.HemisphereLight(0xffb48a, 0x3a2340, 0.9));
  const sun = new THREE.DirectionalLight(0xffa36a, 1.6); sun.position.set(-30, 25, 200); S.add(sun);
  const sunS = glow(90, [255, 190, 120]); sunS.position.set(-60, 30, 480); sunS.material.fog = false; S.add(sunS);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(2000, 140), new THREE.MeshLambertMaterial({ color: 0x4a3b6e, emissive: 0x24193a })); water.rotation.x = -Math.PI / 2; water.position.set(0, -0.3, 105); S.add(water);
  for (const [z0, z1] of [[-600, 40], [170, 700]]) { const g = new THREE.Mesh(new THREE.PlaneGeometry(2000, z1 - z0), lam(0x4b4a3a)); g.rotation.x = -Math.PI / 2; g.position.set(0, 0, (z0 + z1) / 2); S.add(g); }
  const road = new THREE.Mesh(new THREE.PlaneGeometry(8, 640), lam(0x34343a)); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.02, -280); S.add(road);
  const ramp = box(8, 0.5, 32, lam(0x4a4a50), 0, 5, 24); ramp.rotation.x = -Math.atan2(10, 32); S.add(ramp);
  // Huegel & Baeume
  for (let i = 0; i < 26; i++) { const a = rnd() * Math.PI * 2, d = 260 + rnd() * 160; const m = new THREE.Mesh(new THREE.ConeGeometry(50 + rnd() * 50, 50 + rnd() * 50, 6), lam([0x5b3d63, 0x6b4a6c, 0x4d3858][i % 3])); m.position.set(Math.cos(a) * d, 0, Math.sin(a) * d + 100); S.add(m); }
  const N = 500, im = new THREE.InstancedMesh(new THREE.ConeGeometry(1.8, 6, 6), lam(0x3b3a2c), N), M = new THREE.Matrix4();
  for (let i = 0; i < N; i++) { let x = (rnd() - .5) * 400, z = rnd() > .5 ? -40 - rnd() * 300 : 190 + rnd() * 250; if (Math.abs(x) < 9) x += 20 * Math.sign(x || 1); const s = 0.8 + rnd(); M.compose(V(x, 3 * s, z), new THREE.Quaternion(), V(s, s, s)); im.setMatrixAt(i, M); }
  S.add(im);
  // Bruecke (Kettenbruecke, silbern)
  const silver = lam(0xc9ced6), deckM = lam(0x6a6c72);
  const segs = [];
  for (let k = 0; k < 10; k++) {
    const g = new THREE.Group(); const z = 40 + 13 * k + 6.5; g.position.set(0, 10, z); S.add(g);
    g.add(box(8, 0.6, 13, deckM, 0, 0, 0)); g.add(box(0.2, 0.9, 13, silver, 3.9, 0.6, 0), box(0.2, 0.9, 13, silver, -3.9, 0.6, 0));
    for (let c = 0; c < 2; c++) for (const lane of [-1.8, 1.8]) {   // Autos im Stau
      const cz = -4 + c * 6.5 + (rnd() - .5); const cc = [0xa33a2e, 0x2f5f8f, 0xd9c48a, 0x3d6e4e, 0x8a8f96][Math.floor(rnd() * 5)];
      g.add(box(1.7, 0.6, 3.8, lam(cc), lane, 0.65, cz), box(1.4, 0.45, 1.8, lam(cc), lane, 1.15, cz - 0.3));
      const tl = new THREE.MeshBasicMaterial({ color: 0xff3020 }); g.add(box(0.25, 0.1, 0.05, tl, lane + 0.55, 0.7, cz - 1.92), box(0.25, 0.1, 0.05, tl, lane - 0.55, 0.7, cz - 1.92));
    }
    g.userData = { z0: z, k }; segs.push(g);
  }
  const towers = [];
  for (const z of [70, 140]) {
    const t = new THREE.Group(); t.position.set(0, -1, z); S.add(t);
    for (const x of [-4.6, 4.6]) t.add(box(0.9, 28, 0.9, silver, x, 14, 0));
    for (const y of [12, 22, 27.5]) t.add(box(10, 0.6, 0.7, silver, 0, y, 0));
    t.userData.z = z; towers.push(t);
  }
  const cables = new THREE.Group(); S.add(cables);
  const cat = z => { if (z < 70) return L(10.6, 26.5, (z - 40) / 30); if (z > 140) return L(26.5, 10.6, (z - 140) / 30); const u = (z - 105) / 35; return 13 + 13.5 * u * u; };
  for (const x of [-4.6, 4.6]) {
    const pts = []; for (let z = 40; z <= 170; z += 2.5) pts.push(V(x, cat(z), z));
    cables.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.28, 6), silver));
    for (let z = 45; z < 168; z += 5) { const h = cat(z) - 10.3; if (h > 0.3) cables.add(box(0.06, h, 0.06, silver, x, 10.3 + h / 2, z)); }
  }
  const splash = []; for (let i = 0; i < 6; i++) { const sp = glow(16, [255, 250, 245]); sp.material.blending = THREE.NormalBlending; sp.position.set((rnd() - .5) * 8, 0, 60 + i * 17); sp.visible = false; S.add(sp); splash.push(sp); }
  // eigenes Auto + Stau davor auf der Rampe
  const car = makeCar(0x7fb3ad, true); S.add(car.G);
  const queue = []; for (let i = 0; i < 4; i++) { const q = makeCar([0xa33a2e, 0x2f5f8f, 0xd9c48a, 0x3d6e4e][i]); q.beam.intensity = 0; q.G.position.set(i % 2 ? -1.8 : 1.8, 0, [-5.5, -3, 1.5, 4][i]); S.add(q.G); queue.push(q); }
  const moth = makeMoth(2.6); moth.G.position.set(-4.6, 26.8 - 1, 70); S.add(moth.G);
  return { S, car, queue, moth, segs, towers, cables, splash, cam: new THREE.PerspectiveCamera(50, 9 / 16, 0.05, 1500) };
}
function collapse(D, c) {
  for (const g of D.segs) {
    const d = clamp((c - (9 - g.userData.k) * 0.045) / 0.55), f = d * d;
    g.position.y = L(10, -1.5, f); g.rotation.x = f * ((g.userData.k % 2 ? 1 : -1) * 0.5); g.rotation.z = f * 0.25 * (g.userData.k % 3 - 1);
  }
  D.towers.forEach((t, i) => { const d = clamp((c - 0.15 - i * 0.1) / 0.6); t.rotation.x = d * d * (i ? 0.9 : -0.8); });
  D.cables.position.y = -14 * clamp(c * 1.4) ** 2; D.cables.rotation.x = -0.05 * clamp(c * 2);
  D.splash.forEach((s, i) => { const d = clamp((c - 0.3 - (5 - i) * 0.04) / 0.5); s.visible = d > 0 && d < 1; s.scale.set(10 + 20 * d, 4 + 22 * Math.sin(d * Math.PI), 1); s.position.y = 4 * Math.sin(d * Math.PI); s.material.opacity = 0.85 * (1 - d); });
  D.moth.G.visible = c < 0.02;
}

// ------------------------------------------------------------------ KINDERZIMMER
function claws() { const c = C.cv(512, 512), g = c.getContext('2d'); g.filter = 'blur(6px)'; g.fillStyle = '#000';
  for (let i = 0; i < 4; i++) { g.save(); g.translate(150 + i * 70, 470); g.rotate(-0.15 + i * 0.1); g.beginPath(); g.moveTo(-12, 0); g.quadraticCurveTo(-20, -260, 4, -420); g.quadraticCurveTo(14, -260, 12, 0); g.fill(); g.restore(); }
  return tex(c); }
function buildRoom() {
  const S = new THREE.Scene(); S.background = new THREE.Color(0x05070d);
  const amb = new THREE.AmbientLight(0x5a6fae, 0.8); S.add(amb);
  const moonL = new THREE.DirectionalLight(0x9fb4ff, 1.5); moonL.position.set(0.5, 3, -8); moonL.target.position.set(0, 0, 2); S.add(moonL, moonL.target);
  const wall = lam(0x7c86a0), floorM = lam(0x6b4b33);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), floorM); fl.rotation.x = -Math.PI / 2; S.add(fl);
  S.add(box(5, 0.08, 5, lam(0x9aa2b6), 0, 2.6, 0), box(0.1, 2.6, 5, wall, -2.5, 1.3, 0), box(0.1, 2.6, 5, wall, 2.5, 1.3, 0), box(5, 2.6, 0.1, wall, 0, 1.3, 2.5));
  S.add(box(1.65, 2.6, 0.1, wall, -1.675, 1.3, -2.5), box(1.65, 2.6, 0.1, wall, 1.675, 1.3, -2.5), box(1.7, 0.9, 0.1, wall, 0, 0.45, -2.5), box(1.7, 0.6, 0.1, wall, 0, 2.3, -2.5));
  const frame = lam(0xe8e6df); S.add(box(1.75, 0.08, 0.14, frame, 0, 0.92, -2.48), box(1.75, 0.08, 0.14, frame, 0, 1.98, -2.48), box(0.08, 1.1, 0.14, frame, -0.86, 1.45, -2.48), box(0.08, 1.1, 0.14, frame, 0.86, 1.45, -2.48), box(0.05, 1.1, 0.1, frame, 0, 1.45, -2.48), box(1.7, 0.05, 0.1, frame, 0, 1.45, -2.48));
  const glassM = new THREE.MeshLambertMaterial({ color: 0x8aa0d0, transparent: true, opacity: 0.12, depthWrite: false }); const glassP = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.05), glassM); glassP.position.set(0, 1.45, -2.47); S.add(glassP);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), new THREE.MeshBasicMaterial({ map: gradTex([[0, '#0b1426'], [0.6, '#24386a'], [1, '#34508a']]) })); sky.position.set(0, 4, -14); S.add(sky);
  const mn = glow(4, [200, 215, 255]); mn.position.set(2.5, 4.5, -13); S.add(mn);
  for (let i = 0; i < 9; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(1.2, 4, 5), new THREE.MeshBasicMaterial({ color: 0x03050a })); t.position.set(-6 + i * 1.5, 0.5 + rnd(), -9 - rnd() * 3); S.add(t); }
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.85), lam(0xb8553a)); poster.position.set(-2.44, 1.6, -0.5); poster.rotation.y = Math.PI / 2; S.add(poster);
  S.add(box(0.9, 0.75, 0.5, lam(0x5b3d28), 1.9, 0.375, -1.6));
  const bed = sprite(C.boyBed(), 1.0, 0.25); bed.userData.noBB = true; bed.children[0].visible = false; bed.position.set(0.2, 0, -0.4); S.add(bed);
  const moth = makeMoth(2.95); moth.G.position.set(0.1, -0.55, -2.9); S.add(moth.G);
  const claw = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), new THREE.MeshBasicMaterial({ map: claws(), transparent: true, opacity: 0.85, depthWrite: false })); claw.position.set(0.35, 1.45, -2.46); S.add(claw);
  return { S, amb, moonL, bed, moth, claw, glassM, cam: new THREE.PerspectiveCamera(50, 9 / 16, 0.03, 100) };
}

export function build() { return { N: buildNight(), D: buildDusk(), R: buildRoom() }; }

// ------------------------------------------------------------------ SHOTS
const carAt = (car, x, z, ry = 0) => { car.G.position.set(x, 0, z); car.G.rotation.y = ry; };
const inCar = (car, lx, ly, lz) => car.G.localToWorld(V(lx, ly, lz));
function nightBase(N, beam = true) { N.moth.s.material.emissiveIntensity = 0.3; N.car.beam.intensity = beam ? 60 : 0; N.car.lights.forEach(l => l.visible = beam); N.moth.G.visible = false; seatSprites(N.car, null); mothEyes(N.moth, 0.55); }

function fov(cam, f) { if (cam.fov !== f) { cam.fov = f; cam.updateProjectionMatrix(); } }
export const SHOTS = {
  road_wide(W, p, t) { const N = W.N; nightBase(N); const z = L(-40, -18, p); carAt(N.car, 1.6, z);
    look(N.cam, lerpV(V(-9, 7, z - 16), V(-7, 5.5, z - 11), ease(p)), V(1.6, 1, z + 8)); return { world: N, vig: 0.6 }; },
  car_back(W, p, t, sh) { const N = W.N; nightBase(N); const z = 10 + (t - sh.s) * 8; carAt(N.car, 1.6, z); seatSprites(N.car, 'back');
    N.car.G.updateMatrixWorld(); fov(N.cam, 68); look(N.cam, inCar(N.car, 0, 1.38 + Math.sin(t * 9) * 0.004, -1.3), inCar(N.car, 0, 1.05, 6)); return { world: N, vig: 0.65 }; },
  bunkers(W, p, t) { const N = W.N; nightBase(N); const z = 30 + p * 40; carAt(N.car, 1.6, z + 6);
    look(N.cam, V(-3, 1.6, z), V(-15, 1.2, z + 14)); return { world: N, vig: 0.7 }; },
  eyes_road(W, p, t, sh) { const N = W.N; nightBase(N); carAt(N.car, 1.6, 150); seatSprites(N.car, null);
    N.moth.G.visible = true; mothPose(N.moth, 'folded'); N.moth.G.position.set(-0.6, 0, 168);
    const k = sm(0.35, 0.75, p); mothEyes(N.moth, L(0.3, 0.9, k), k); N.car.G.updateMatrixWorld();
    look(N.cam, inCar(N.car, -0.4, 1.28, 0.05), lerpV(inCar(N.car, -0.3, 1.0, 10), V(-0.6, 1.9, 168), ease(sm(0.4, 1, p))));
    const tb = sh.sfx.find(f => f.n === 'brakes'); return { world: N, vig: 0.7, shake: tb && t > tb.t && t < tb.t + 1.2 ? 0.006 : 0 }; },
  eyes_side(W, p) { const N = W.N; nightBase(N); carAt(N.car, 1.6, 150); N.moth.G.visible = true; mothPose(N.moth, 'folded'); N.moth.G.position.set(-0.6, 0, 168); mothEyes(N.moth, 0.8);
    look(N.cam, lerpV(V(9, 1.6, 160), V(8, 1.6, 162), ease(p)), V(-0.2, 1.4, 166));
    return { world: N, vig: 0.65, measure: [V(-1.6, 0, 168), V(-1.6, 2.0, 168)], measureLabel: '2,00 M', measureP: sm(0.05, 0.5, p) }; },
  moth_rise(W, p, t) { const N = W.N; nightBase(N); carAt(N.car, 1.6, 150); N.moth.G.visible = true; N.moth.G.position.set(-0.6, 0, 168);
    const st = sm(0.0, 0.35, p), op = sm(0.42, 0.72, p);
    mothPose(N.moth, op > 0 ? 'open' : 'folded'); N.moth.s.scale.set(op > 0 ? L(0.35, 1, easeOut(op)) : 1, L(0.86, 1, st), 1); mothEyes(N.moth, L(0.8, 1.2, op));
    look(N.cam, lerpV(V(0.5, 0.9, 157), V(0.2, 0.75, 159.5), ease(p)), V(-0.5, L(1.6, 1.9, p), 168));
    return { world: N, vig: 0.7, shake: op > 0.95 && op < 1 ? 0.004 : 0 }; },
  side_window(W, p, t, sh) { const N = W.N; nightBase(N); const z = -200 + (t - sh.s) * 40; carAt(N.car, 1.6, z); seatSprites(N.car, null); N.car.G.updateMatrixWorld();
    N.moth.G.visible = true; mothPose(N.moth, 'open'); N.moth.s.scale.set(1, 1, 1); mothEyes(N.moth, 1.0);
    N.moth.G.position.set(1.6 - 3.8, -0.75 + Math.sin(t * 1.3) * 0.1, z + 0.3 + Math.sin(t * 0.9) * 0.2); N.moth.s.material.emissiveIntensity = 0.55;
    fov(N.cam, 62); look(N.cam, inCar(N.car, -0.45, 1.22, 0.3), inCar(N.car, -6, 1.3, 0.3)); return { world: N, vig: 0.7, shake: 0.0015 }; },
  car_front(W, p, t, sh) { const N = W.N; nightBase(N); const z = 300 + (t - sh.s) * 8; carAt(N.car, 1.6, z); seatSprites(N.car, 'front'); N.car.G.updateMatrixWorld();
    fov(N.cam, 58); look(N.cam, inCar(N.car, 0, 1.45 + Math.sin(t * 9) * 0.004, L(2.7, 2.4, ease(p))), inCar(N.car, 0, 1.2, -0.05)); return { world: N, vig: 0.6 }; },

  // --- Daemmerung
  river_road(W, p, t) { const D = W.D; collapse(D, 0); D.moth.G.visible = false; seatSprites(D.car, null); D.car.beam.intensity = 8;
    const z = L(-150, -120, p); carAt(D.car, 1.8, z); look(D.cam, V(5.5, 1.4, z + 18), V(1.6, 1.2, z)); return { world: D, vig: 0.5 }; },
  bridge_wide(W, p) { const D = W.D; collapse(D, 0); D.moth.G.visible = false; carAt(D.car, 1.8, -12); seatSprites(D.car, null);
    look(D.cam, lerpV(V(70, 28, -25), V(58, 24, -15), ease(p)), V(0, 12, 100)); return { world: D, vig: 0.5 }; },
  pillar_tilt(W, p) { const D = W.D; collapse(D, 0); D.moth.G.visible = true; mothPose(D.moth, 'folded'); mothEyes(D.moth, 1.2); carAt(D.car, 1.8, -12);
    look(D.cam, V(2.5, 12.2, 48), lerpV(V(-1, 12.5, 70), V(-4.6, 27.6, 70), ease(p))); return { world: D, vig: 0.55 }; },
  pillar_moth(W, p, t) { const D = W.D; collapse(D, 0); D.moth.G.visible = true; mothPose(D.moth, 'folded'); mothEyes(D.moth, L(1.4, 2.0, p)); carAt(D.car, 1.8, -12);
    look(D.cam, lerpV(V(-1, 25.5, 58), V(-2.6, 26.8, 62.5), ease(p)), V(-4.6, 27.2, 70)); return { world: D, vig: 0.7, tint: 0.2 * p }; },
  ben_face(W, p, t) { const D = W.D; collapse(D, 0); D.moth.G.visible = false; carAt(D.car, 1.8, -12); seatSprites(D.car, 'ben'); D.car.G.updateMatrixWorld();
    look(D.cam, inCar(D.car, -0.45, 1.22, L(0.15, 0.25, p)), inCar(D.car, 0.42, 1.05, -0.05)); return { world: D, vig: 0.6 }; },
  uturn(W, p, t) { const D = W.D; collapse(D, 0); D.moth.G.visible = false; seatSprites(D.car, null);
    const a = ease(clamp(p * 1.3)) * Math.PI; carAt(D.car, 1.8 - 4.2 * Math.sin(a / 2) ** 2 * 1, -12 - 3 * Math.sin(a), a);
    look(D.cam, V(-1.5, 22, -12.01), V(-1.5, 0, -12)); return { world: D, vig: 0.5 }; },
  mirror(W, p, t, sh) { const D = W.D; const tc = sh.sfx.find(f => f.n === 'collapse'); const c = tc ? clamp((t - tc.t) / 3.2) : 0; collapse(D, c);
    carAt(D.car, -1.8, -60); D.car.G.visible = false; look(D.cam, V(-1.8, 2.0, -75 - p * 10), V(0, 11, 100));
    return { world: D, vig: 0.4, post2d: (g, p2, t2) => { mirrorFrame(g); D.car.G.visible = true; }, shake: c > 0.25 && c < 0.6 ? 0.002 : 0 }; },
  road_relief(W, p, t) { const D = W.D; collapse(D, 1); seatSprites(D.car, null); D.car.beam.intensity = 8; D.car.G.visible = true;
    const z = L(-260, -290, p); carAt(D.car, -1.8, z, Math.PI); look(D.cam, lerpV(V(-1, 1.0, z - 12), V(-1.4, 1.2, z - 16), ease(p)), V(-1.8, 1.3, z)); return { world: D, vig: 0.5 }; },

  // --- Kinderzimmer
  bedroom(W, p) { const R = W.R; R.moth.G.visible = false; R.claw.visible = false; R.bed.visible = true;
    fov(R.cam, 60); look(R.cam, lerpV(V(0.0, 1.35, 2.3), V(-0.05, 1.3, 1.9), ease(p)), V(-0.15, 0.95, -1.3)); return { world: R, vig: 0.7 }; },
  window_scratch(W, p) { const R = W.R; R.moth.G.visible = false; R.claw.visible = true; R.bed.visible = true; R.claw.position.y = L(1.6, 1.3, ease(p)); R.claw.material.opacity = sm(0, 0.2, p);
    look(R.cam, lerpV(V(0.2, 1.4, 0.4), V(0.15, 1.45, -0.4), ease(p)), V(0.1, 1.45, -2.5)); return { world: R, vig: 0.75 }; },
  window_eyes(W, p) { const R = W.R; R.claw.visible = false; R.moth.G.visible = true; mothPose(R.moth, 'folded'); R.moth.s.material.color.setScalar(0.25); mothEyes(R.moth, L(0.1, 0.32, sm(0, 0.4, p)));
    look(R.cam, lerpV(V(0.15, 1.45, -0.4), V(0.12, 1.47, -0.9), ease(p)), V(0.1, 1.5, -2.5)); return { world: R, vig: 0.8 }; },
  window_face(W, p, t, sh) { const R = W.R; R.claw.visible = false; R.moth.G.visible = true; mothPose(R.moth, 'folded');
    const st = sh.sfx.find(f => f.n === 'stinger'), after = st ? t - st.t : -1;
    R.moth.s.material.color.setScalar(after > 0 ? 1 : 0.45); mothEyes(R.moth, after > 0 ? 0.55 : 0.38);
    look(R.cam, lerpV(V(0.12, 1.47, -1.0), V(0.1, 1.5, -1.75), ease(p)), V(0.1, 1.52, -2.6));
    return { world: R, vig: 0.85, tint: 0.55, shake: after > 0 && after < 0.5 ? 0.008 * (1 - after / 0.5) : 0, flash: after > 0 && after < 0.12 ? 1 - after / 0.12 : 0 }; },
};
for (const k of Object.keys(SHOTS)) { const f = SHOTS[k]; SHOTS[k] = (W, ...a) => { fov(W.N.cam, 50); fov(W.D.cam, 50); fov(W.R.cam, 50); return f(W, ...a); }; }
SHOTS._billboard = billboard; SHOTS._shake = shake;
// Mothman im Zimmer immer in normaler Helligkeit zuruecksetzen
const _wf = SHOTS.window_eyes; SHOTS.bedroom = ((f) => (W, ...a) => { W.R.moth.s.material.color.setScalar(1); return f(W, ...a); })(SHOTS.bedroom);

// Rueckspiegel: GL-Bild gespiegelt in einen Spiegel im dunklen Auto-Innenraum
let mc = null;
function mirrorFrame(g) {
  if (!mc) mc = C.cv(CW, CH);
  const m = mc.getContext('2d'); m.setTransform(1, 0, 0, 1, 0, 0); m.drawImage(g.canvas, 0, 0);
  const sky = g.createLinearGradient(0, 0, 0, CH); sky.addColorStop(0, '#2b1c3a'); sky.addColorStop(0.45, '#a1525f'); sky.addColorStop(0.62, '#3a2a2c'); sky.addColorStop(1, '#0c0a0b');
  g.fillStyle = sky; g.fillRect(0, 0, CW, CH);
  g.fillStyle = '#100c0d'; g.fillRect(0, 0, CW, 180); g.beginPath(); g.moveTo(0, 180); g.lineTo(140, 180); g.lineTo(0, 1100); g.fill(); g.beginPath(); g.moveTo(CW, 180); g.lineTo(CW - 140, 180); g.lineTo(CW, 1100); g.fill();
  g.fillStyle = '#1a1314'; g.fillRect(0, 1180, CW, CH - 1180); g.fillStyle = '#3a2b22'; g.fillRect(0, 1180, CW, 40);
  g.fillStyle = '#0a0809'; g.fillRect(CW / 2 - 18, 180, 36, 170);
  const x = 90, y = 330, w = CW - 180, h = 520;
  g.save(); g.beginPath(); g.roundRect(x, y, w, h, 60); g.clip();
  g.translate(x + w, y); g.scale(-1, 1); const sh = h / w * CW; g.drawImage(mc, 0, (CH - sh) / 2 - 120, CW, sh, 0, 0, w, h);
  g.restore();
  const gl = g.createLinearGradient(x, y, x + w, y + h); gl.addColorStop(0, 'rgba(255,255,255,.10)'); gl.addColorStop(0.4, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.beginPath(); g.roundRect(x, y, w, h, 60); g.fill();
  g.lineWidth = 28; g.strokeStyle = '#0d0b0c'; g.beginPath(); g.roundRect(x, y, w, h, 60); g.stroke();
}

// ------------------------------------------------------------------ 2D-Szenen
const T2 = {};
function redSky(g, t) {
  const s = g.createLinearGradient(0, 0, 0, CH); s.addColorStop(0, '#3a0507'); s.addColorStop(0.55, '#a51f1a'); s.addColorStop(0.8, '#d24a2c'); s.addColorStop(1, '#260304');
  g.fillStyle = s; g.fillRect(0, 0, CW, CH);
}
function mapScene(g, p, t) {
  g.fillStyle = '#e6dcc0'; g.fillRect(0, 0, CW, CH);
  const z = L(1, 1.35, ease(p)); g.save(); g.translate(CW * 0.42, CH * 0.45); g.scale(z, z); g.translate(-CW * 0.42, -CH * 0.45);
  g.strokeStyle = 'rgba(140,120,80,.35)'; g.lineWidth = 3; for (let i = 0; i < 26; i++) { g.beginPath(); for (let x = -50; x <= CW + 50; x += 30) { const y = 80 + i * 72 + Math.sin(x * 0.012 + i) * 22 + Math.sin(x * 0.03 + i * 2) * 8; x < -40 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
  g.fillStyle = 'rgba(70,110,60,.35)'; for (let i = 0; i < 260; i++) { const x = (i * 97) % CW, y = (i * 211) % CH; g.beginPath(); g.arc(x, y, 6 + (i % 5), 0, 7); g.fill(); }
  g.fillStyle = 'rgba(160,110,70,.18)'; g.strokeStyle = '#7a4a2a'; g.lineWidth = 6; g.setLineDash([18, 10]);
  g.beginPath(); const st = [[300, 380], [560, 300], [700, 420], [960, 470], [1010, 700], [880, 900], [930, 1150], [760, 1400], [520, 1500], [380, 1330], [260, 1060], [180, 760]]; st.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); g.stroke(); g.setLineDash([]);
  g.strokeStyle = '#3d6fa8'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(330, 200); g.bezierCurveTo(140, 520, 300, 700, 170, 900); g.bezierCurveTo(60, 1100, 220, 1300, 120, 1700); g.stroke();
  g.fillStyle = '#5a3a22'; g.font = '400 64px Anton'; g.textAlign = 'center'; g.fillText('WEST VIRGINIA', 640, 1000);
  g.font = '800 26px Montserrat'; g.fillStyle = '#3d6fa8'; g.save(); g.translate(120, 1150); g.rotate(-1.2); g.fillText('OHIO RIVER', 0, 0); g.restore();
  const px = 215, py = 820;
  for (let k = 0; k < 3; k++) { const r = ((t * 0.8 + k / 3) % 1); g.strokeStyle = `rgba(200,30,30,${0.7 * (1 - r)})`; g.lineWidth = 5; g.beginPath(); g.arc(px, py, 30 + r * 220, 0, 7); g.stroke(); }
  g.fillStyle = '#d42020'; g.beginPath(); g.arc(px, py - 46, 26, Math.PI, 0); g.lineTo(px, py); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(px, py - 46, 10, 0, 7); g.fill();
  g.fillStyle = 'rgba(14,14,18,.88)'; g.beginPath(); g.roundRect(px + 40, py - 70, 330, 60, 30); g.fill(); g.fillStyle = '#fff'; g.font = '400 36px Anton'; g.textAlign = 'left'; g.fillText('POINT PLEASANT', px + 62, py - 26);
  g.restore();
  return { vig: 0.45 };
}
function tachoScene(g, p, t, shot) {
  const segS = shot.segs[0].s, segE = shot.segs[0].e, u = clamp((t - segS) / (segE - segS));
  const target = u < 0.38 ? L(60, 100, sm(0.2, 0.38, u)) : u < 0.62 ? L(100, 120, sm(0.42, 0.6, u)) : L(120, 160, sm(0.66, 0.9, u));
  const v = target + Math.sin(t * 40) * 1.2;
  g.fillStyle = '#120d0b'; g.fillRect(0, 0, CW, CH);
  const wd = g.createLinearGradient(0, 0, 0, CH); wd.addColorStop(0, '#2a1a12'); wd.addColorStop(0.5, '#4a2c1a'); wd.addColorStop(1, '#1a100b'); g.fillStyle = wd; g.fillRect(0, 300, CW, 1250);
  g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 3; for (let y = 320; y < 1540; y += 18) { g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(300, y + 8, 700, y - 8, CW, y + 4); g.stroke(); }
  const s = L(1, 1.12, ease(p)), cx = CW / 2 + Math.sin(t * 31) * 2, cy = 900 + Math.cos(t * 27) * 2, R = 380 * s;
  g.save(); g.shadowColor = 'rgba(120,255,160,.35)'; g.shadowBlur = 60; g.fillStyle = '#0d0f0c'; g.beginPath(); g.arc(cx, cy, R + 40, 0, 7); g.fill(); g.restore();
  g.lineWidth = 22; g.strokeStyle = '#c9ced6'; g.beginPath(); g.arc(cx, cy, R + 24, 0, 7); g.stroke();
  const fg = g.createRadialGradient(cx, cy, 10, cx, cy, R); fg.addColorStop(0, '#f6efd9'); fg.addColorStop(1, '#d9ceb0'); g.fillStyle = fg; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
  const A = val => Math.PI * 0.75 + (val / 180) * Math.PI * 1.5;
  g.fillStyle = 'rgba(220,30,30,.25)'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R - 10, A(140), A(180)); g.closePath(); g.fill();
  for (let val = 0; val <= 180; val += 5) { const a = A(val), big = val % 20 === 0; g.strokeStyle = '#1a1512'; g.lineWidth = big ? 7 : 3; g.beginPath(); g.moveTo(cx + Math.cos(a) * (R - 12), cy + Math.sin(a) * (R - 12)); g.lineTo(cx + Math.cos(a) * (R - (big ? 50 : 30)), cy + Math.sin(a) * (R - (big ? 50 : 30))); g.stroke();
    if (big) { g.fillStyle = val >= 140 ? '#b01818' : '#1a1512'; g.font = `400 ${46 * s}px Anton`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(val, cx + Math.cos(a) * (R - 92 * s), cy + Math.sin(a) * (R - 92 * s)); } }
  g.fillStyle = '#1a1512'; g.font = `800 ${30 * s}px Montserrat`; g.fillText('KM/H', cx, cy + R * 0.42);
  const a = A(v); g.save(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 10; g.strokeStyle = '#d01a14'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - Math.cos(a) * 40, cy - Math.sin(a) * 40); g.lineTo(cx + Math.cos(a) * (R - 40), cy + Math.sin(a) * (R - 40)); g.stroke(); g.restore();
  g.fillStyle = '#222'; g.beginPath(); g.arc(cx, cy, 34, 0, 7); g.fill();
  g.fillStyle = 'rgba(14,14,18,.9)'; g.beginPath(); g.roundRect(cx - 150, cy + R * 0.55, 300, 96, 18); g.fill(); g.fillStyle = v > 140 ? '#ff3b30' : '#fff'; g.font = '400 72px Anton'; g.fillText(Math.round(target), cx, cy + R * 0.55 + 50);
  return { vig: 0.6 };
}
let MO = null, MOB = null;
function redMoth(g, p, t) {
  if (!MO) MO = C.mothman('open'); redSky(g, t);
  g.fillStyle = '#4a0709'; for (let i = 0; i < 14; i++) { const x = i * 90 - 30, h = 240 + ((i * 53) % 160); g.beginPath(); g.moveTo(x - 80, CH); g.lineTo(x, CH - h); g.lineTo(x + 80, CH); g.fill(); }
  const s = L(1.0, 1.2, ease(p)), w = 1500 * s; g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 40; g.drawImage(MO, CW / 2 - w / 2, CH * 0.47 - w * 0.36, w, w); g.restore();
  const pulse = 0.6 + 0.4 * Math.sin(t * 6); g.save(); g.globalCompositeOperation = 'lighter';
  for (const dx of [-0.037, 0.037]) { const x = CW / 2 + dx * w, y = CH * 0.47 - w * 0.36 + w * 330 / 1024, gr = g.createRadialGradient(x, y, 1, x, y, 90 * s); gr.addColorStop(0, `rgba(255,120,90,${pulse})`); gr.addColorStop(1, 'rgba(255,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 90 * s, 0, 7); g.fill(); }
  g.restore(); return { vig: 0.75, tint: 0.15 };
}
function redTown(g, p, t) {
  if (!MOB) { MOB = C.cv(1024, 1024); const m = MOB.getContext('2d'); m.filter = 'brightness(0)'; m.drawImage(C.mothman('open'), 0, 0, 1024, 1024); m.filter = 'none'; }
  redSky(g, t);
  const x = L(-250, CW + 250, p), y = 520 + Math.sin(p * 6) * 30, w = 520; g.drawImage(MOB, x - w / 2, y - w / 2, w, w);
  g.save(); g.globalCompositeOperation = 'lighter'; for (const dx of [-0.037, 0.037]) { const ex = x + dx * w, ey = y - w / 2 + w * 330 / 1024, gr = g.createRadialGradient(ex, ey, 1, ex, ey, 40); gr.addColorStop(0, 'rgba(255,90,70,1)'); gr.addColorStop(1, 'rgba(255,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(ex, ey, 40, 0, 7); g.fill(); } g.restore();
  g.fillStyle = '#1c0203'; const base = 1500;
  g.fillRect(0, base, CW, CH - base);
  let xx = -20; let sd = 5; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  while (xx < CW + 40) { const w2 = 70 + r() * 90, h2 = 90 + r() * 180; g.fillRect(xx, base - h2, w2, h2 + 2); g.beginPath(); g.moveTo(xx - 8, base - h2); g.lineTo(xx + w2 / 2, base - h2 - 60 - r() * 40); g.lineTo(xx + w2 + 8, base - h2); g.fill();
    if (r() > 0.55) { g.fillStyle = 'rgba(255,190,90,.75)'; g.fillRect(xx + w2 * 0.3, base - h2 * 0.6, 14, 18); g.fillStyle = '#1c0203'; } xx += w2 + 6; }
  g.fillRect(620, base - 430, 40, 430); g.beginPath(); g.moveTo(600, base - 430); g.lineTo(640, base - 560); g.lineTo(680, base - 430); g.fill();
  return { vig: 0.75, tint: 0.15 };
}
export const TWO = { map: mapScene, tacho: tachoScene, red_moth: redMoth, red_town: redTown };
