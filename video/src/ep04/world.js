// Folge 4 – Siren Head: Tankstelle im Wald (aussen/innen), Siren Head, Feuerwehrauto + 2D-Szenen
import * as THREE from 'three';
import * as C from '../chars.js';
import { tex, lam, box, sprite, setTex, glow, gradTex, V, L, clamp, sm, lerpV, look, billboard, shake, rnd, ease } from '../world.js';
import { W as CW, H as CH } from '../overlay.js';

const easeOut = t => 1 - Math.pow(1 - t, 3);
function fov(cam, f) { if (cam.fov !== f) { cam.fov = f; cam.updateProjectionMatrix(); } }
const basic = c => new THREE.MeshBasicMaterial({ color: c });

function build4() {
  const S = new THREE.Scene();
  const BG = { night: gradTex([[0, '#020409'], [0.6, '#0b1222'], [1, '#141c2c']]), dawn: gradTex([[0, '#5d6f99'], [0.6, '#d9a98a'], [1, '#f1cfa2']]) };
  S.background = BG.night; S.fog = new THREE.Fog(0x0b1222, 18, 140);
  const hemi = new THREE.HemisphereLight(0x5f78a8, 0x10121a, 0.7); S.add(hemi);
  const moon = new THREE.DirectionalLight(0x9fb2e0, 0.6); moon.position.set(30, 40, 20); S.add(moon);
  const gg = new THREE.PlaneGeometry(600, 600, 60, 60); gg.rotateX(-Math.PI / 2); const col = [];
  for (let i = 0; i < gg.attributes.position.count; i++) { const k = 0.8 + rnd() * 0.3; col.push(0.1 * k, 0.15 * k, 0.11 * k); }
  gg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); S.add(new THREE.Mesh(gg, new THREE.MeshLambertMaterial({ vertexColors: true })));
  const road = new THREE.Mesh(new THREE.PlaneGeometry(7, 600), lam(0x2a2b30)); road.rotation.x = -Math.PI / 2; road.position.set(14, 0.02, 0); S.add(road);
  for (let z = -300; z < 300; z += 8) S.add(box(0.14, 0.01, 3, lam(0xd8d8d0), 14, 0.03, z));
  const fc = new THREE.Mesh(new THREE.PlaneGeometry(20, 18), lam(0x6a6b70)); fc.rotation.x = -Math.PI / 2; fc.position.set(4, 0.025, 0); S.add(fc);
  // Wald (instanziert), Lichtung fuer Tankstelle frei
  const N = 1600, im = new THREE.InstancedMesh(new THREE.ConeGeometry(2.2, 8, 6), lam(0x16302a), N), it = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.25, 2, 5), lam(0x2a1d16), N), M = new THREE.Matrix4(), Q = new THREE.Quaternion();
  for (let i = 0; i < N; i++) { let x = (rnd() - .5) * 400, z = (rnd() - .5) * 400; const u = clamp((x * 40 - z * 35) / (40 * 40 + 35 * 35), 0, 0.92), dl = Math.hypot(x - 40 * u, z + 35 * u);
    if ((x > -16 && x < 20 && z > -14 && z < 14) || Math.abs(x - 14) < 5 || dl < 6) { M.makeScale(0, 0, 0); im.setMatrixAt(i, M); it.setMatrixAt(i, M); continue; }
    const s = 0.9 + rnd() * 0.7; M.compose(V(x, 5 * s, z), Q, V(s, s, s)); im.setMatrixAt(i, M); M.compose(V(x, 1 * s, z), Q, V(s, s, s)); it.setMatrixAt(i, M); }
  S.add(im, it);
  // Tankstellen-Dach + Saeulen
  const white = lam(0xe9e9e6), red = lam(0xc0322a);
  S.add(box(12, 0.6, 9, white, 8, 5.3, 0)); S.add(box(12.1, 0.35, 9.1, red, 8, 5.05, 0));
  const panel = basic(0xf3f6ff); for (const x of [4.5, 8, 11.5]) for (const z of [-2.5, 2.5]) S.add(box(2.2, 0.05, 0.8, panel, x, 4.97, z));
  for (const [x, z] of [[3, -3.5], [3, 3.5], [13, -3.5], [13, 3.5]]) S.add(box(0.35, 5, 0.35, white, x, 2.5, z));
  const canL = [new THREE.PointLight(0xe8eeff, 14, 16, 1.3), new THREE.PointLight(0xe8eeff, 14, 16, 1.3)]; canL[0].position.set(6, 4.6, 0); canL[1].position.set(10.5, 4.6, 0); S.add(...canL);
  for (const z of [-1.8, 1.8]) { S.add(box(3.2, 0.25, 1.0, lam(0x9a9a9a), 8, 0.12, z)); for (const x of [6.8, 9.2]) { S.add(box(0.8, 1.8, 0.5, red, x, 1.15, z), box(0.82, 0.3, 0.52, white, x, 1.9, z), box(0.5, 0.3, 0.02, basic(0x8fe0ff), x, 1.4, z + 0.27)); } }
  // Preisschild
  S.add(box(0.3, 6, 0.3, lam(0x444448), 16.5, 3, -7)); S.add(box(2.4, 2.6, 0.3, basic(0xf5f0e6), 16.5, 6.8, -7)); S.add(box(2.42, 0.6, 0.32, red, 16.5, 7.9, -7));
  const signG = glow(5, [255, 245, 220]); signG.position.set(16.5, 6.8, -6.6); S.add(signG);
  // Shop (hohl): x -10..0, z -3.5..3.5, h 3.5
  const wallM = lam(0xd9d4c8), floorM = lam(0xbfc3c4);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(10, 7), floorM); fl.rotation.x = -Math.PI / 2; fl.position.set(-5, 0.03, 0); S.add(fl);
  S.add(box(10.2, 0.2, 7.2, wallM, -5, 3.6, 0), box(0.2, 3.6, 7.2, wallM, -10, 1.8, 0), box(10.2, 3.6, 0.2, wallM, -5, 1.8, -3.6), box(10.2, 3.6, 0.2, wallM, -5, 1.8, 3.6));
  S.add(box(0.2, 0.9, 7.2, wallM, 0, 0.45, 0), box(0.2, 0.6, 7.2, wallM, 0, 3.3, 0), box(0.25, 0.4, 7.4, red, 0.05, 3.2, 0));
  for (const z of [-3.4, -1.2, 1.2, 3.4]) S.add(box(0.15, 2.2, 0.12, lam(0x3a3a3e), 0, 2.0, z));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(7, 2.1), new THREE.MeshLambertMaterial({ color: 0x8aa4c0, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide })); glass.rotation.y = Math.PI / 2; glass.position.set(0, 1.95, 0); S.add(glass);
  const ceilP = basic(0xf6f8ff); const panels = []; for (const x of [-2.5, -5, -7.5]) for (const z of [-1.5, 1.5]) { const p = box(1.6, 0.04, 0.5, ceilP, x, 3.48, z); S.add(p); panels.push(p); }
  const shopL = [new THREE.PointLight(0xeef3ff, 9, 9, 1.2), new THREE.PointLight(0xeef3ff, 9, 9, 1.2)]; shopL[0].position.set(-3, 3.2, 0); shopL[1].position.set(-7, 3.2, 0); S.add(...shopL);
  // Regale + Produkte
  const prodCols = [0xd94a3a, 0x3a7ad9, 0xe8c040, 0x4ab06a, 0xe07a30, 0xf2f2f2, 0x8a4fb0];
  for (const z of [-2.2, 0.2]) { S.add(box(4, 1.7, 0.6, lam(0x7a7f88), -6.5, 0.85, z)); for (let i = 0; i < 40; i++) S.add(box(0.28, 0.32, 0.22, lam(prodCols[i % 7]), -8.3 + (i % 13) * 0.3, 0.45 + Math.floor(i / 13) * 0.45, z + (i % 2 ? 0.2 : -0.2))); }
  const fridge = basic(0xbfe6ff); for (const z of [-2.4, -1.2, 0, 1.2, 2.4]) S.add(box(0.1, 2.2, 1.05, fridge, -9.85, 1.2, z));
  // Theke, Kasse, Radio, Lautsprecher, Uhr
  S.add(box(1.0, 1.05, 3.2, lam(0x8a3a2e), -1.9, 0.52, 1.6), box(1.1, 0.06, 3.3, lam(0xe0dcd2), -1.9, 1.07, 1.6));
  S.add(box(0.45, 0.3, 0.4, lam(0x2a2a2e), -1.9, 1.25, 0.6), box(0.3, 0.2, 0.02, basic(0x80ff9a), -1.7, 1.35, 0.6));
  const radio = new THREE.Group(); radio.position.set(-1.9, 1.1, 2.6); S.add(radio);
  radio.add(box(0.55, 0.32, 0.22, lam(0x6a4a30), 0, 0.16, 0)); const rdial = box(0.3, 0.08, 0.01, basic(0xffcf7a), 0.08, 0.22, 0.115); radio.add(rdial);
  const radioG = glow(0.6, [255, 200, 120]); radioG.position.set(0.08, 0.22, 0.2); radio.add(radioG);
  const pa = new THREE.Group(); pa.position.set(-3.5, 3.45, -0.6); S.add(pa);
  const paBody = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.12, 20), lam(0xeeeeea)); pa.add(paBody);
  const paGrill = new THREE.Mesh(new THREE.CircleGeometry(0.24, 20), lam(0x9a9a9a)); paGrill.rotation.x = Math.PI / 2; paGrill.position.y = -0.065; pa.add(paGrill);
  // Figuren
  const T = { boyF: C.boy('front', 'neutral'), boyS: C.boy('front', 'scared_sweat'), boyB: C.boy('back'), col: C.colleague('front', 'neutral') };
  const boy = sprite(T.boyF, 1.35); boy.userData.noBB = false; S.add(boy);
  const sit = sprite(C.boySit('scared_sweat'), 1.1); S.add(sit);
  const coll = sprite(T.col, 1.4); S.add(coll);
  // Siren Head
  const sh = sprite(C.MONSTERS['SIREN HEAD'](), 13, 0.15); sh.userData.noBB = true; sh.children[0].visible = false; sh.position.set(52, 0, 4); S.add(sh);
  // Feuerwehrauto im Wald (Strasse weiter suedlich)
  const truck = new THREE.Group(); truck.position.set(14.8, 0, -110); truck.rotation.y = 0.25; S.add(truck);
  const tr = lam(0xb8231c); truck.add(box(2.5, 2.4, 6.5, tr, 0, 1.6, -1), box(2.5, 2.0, 2.0, tr, 0, 1.4, 3.2), box(2.3, 0.8, 0.05, new THREE.MeshLambertMaterial({ color: 0x6b86a8, transparent: true, opacity: 0.5 }), 0, 1.9, 4.22));
  truck.add(box(2.52, 0.25, 6.52, lam(0xeeeeee), 0, 1.3, -1), box(0.4, 0.15, 6.0, lam(0xbfbfbf), 0.6, 2.9, -1), box(0.4, 0.15, 6.0, lam(0xbfbfbf), -0.6, 2.9, -1));
  for (const [x, z] of [[1.2, 2.8], [-1.2, 2.8], [1.2, -3], [-1.2, -3]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 16), lam(0x151515)); w.rotation.z = Math.PI / 2; w.position.set(x, 0.5, z); truck.add(w); }
  const door = box(0.08, 1.4, 1.2, tr, 1.3, 1.4, 3.6); door.rotation.y = -0.9; door.position.set(1.8, 1.4, 4.0); truck.add(door);
  const tBlue = [glow(3, [60, 110, 255]), glow(3, [60, 110, 255])]; tBlue[0].position.set(-0.6, 2.55, 4.1); tBlue[1].position.set(0.6, 2.55, 4.1); truck.add(...tBlue);
  const tBlueL = new THREE.PointLight(0x3060ff, 0, 30, 1.2); tBlueL.position.set(0, 3, 4.5); truck.add(tBlueL);
  const hl = [glow(2, [255, 240, 200]), glow(2, [255, 240, 200])]; hl[0].position.set(-0.8, 0.9, 4.3); hl[1].position.set(0.8, 0.9, 4.3); truck.add(...hl);
  const sh2 = sprite(C.MONSTERS['SIREN HEAD'](), 13, 0.2); sh2.userData.noBB = true; sh2.children[0].visible = false; sh2.position.set(22, 0, -150); S.add(sh2);
  return { S, BG, hemi, moon, canL, shopL, panels, ceilP, radio, radioG, rdial, pa, T, boy, sit, coll, sh, sh2, truck, tBlue, tBlueL, cam: new THREE.PerspectiveCamera(50, 9 / 16, 0.03, 800) };
}
export function build() { return { G: build4() }; }

function base(G, mode = 'night') {
  G.boy.visible = G.sit.visible = G.coll.visible = false; G.sh.visible = true; G.sh2.visible = false;
  G.shopL.forEach(l => l.intensity = 9); G.ceilP.color.set(0xf6f8ff); G.radioG.visible = true; G.rdial.material.color.set(0xffcf7a);
  G.sh.rotation.y = Math.atan2(-3.9 - 40, 0 + 35) + 0.85; G.sh.material.emissiveIntensity = 0.4; G.tBlueL.intensity = 0; G.sh.position.set(40, -1.5, -35);
  if (mode === 'night') { G.S.background = G.BG.night; G.S.fog.color.set(0x0b1222); G.S.fog.near = 18; G.S.fog.far = 140; G.hemi.color.set(0x5f78a8); G.hemi.intensity = 0.7; G.moon.intensity = 0.6; }
  if (mode === 'dawn') { G.S.background = G.BG.dawn; G.S.fog.color.set(0xd8b090); G.S.fog.near = 25; G.S.fog.far = 200; G.hemi.color.set(0xffe2c4); G.hemi.intensity = 1.5; G.moon.intensity = 1.2; G.sh.visible = false; }
}
const face = (spr, cam) => { spr.userData.noBB = false; };

export const SHOTS = {
  station_wide(W, p, t) { const G = W.G; base(G); G.sh.visible = false;
    look(G.cam, lerpV(V(30, 7, 22), V(25, 5.5, 17), ease(p)), V(2, 2, 0)); return { world: G, vig: 0.6 }; },
  counter(W, p) { const G = W.G; base(G); G.boy.visible = true; setTex(G.boy, G.T.boyF); G.boy.position.set(-2.8, 0.42, 1.6);
    look(G.cam, lerpV(V(1.8, 1.8, 3.0), V(1.0, 1.7, 2.4), ease(p)), V(-2.6, 1.45, 1.4)); return { world: G, vig: 0.55 }; },
  window_mast(W, p, t) { const G = W.G; base(G); G.boy.visible = true; setTex(G.boy, G.T.boyB); G.boy.position.set(-1.0, 0, -0.4); G.sh.position.set(40, -1.5, -35);
    fov(G.cam, 48); look(G.cam, lerpV(V(-4.2, 1.6, 0.6), V(-3.6, 1.6, 0.4), ease(p)), V(40, 8.5, -30)); return { world: G, vig: 0.6 }; },
  window_mast2(W, p, t) { const G = W.G; base(G); G.sh.position.set(40, -1.5, -35);
    fov(G.cam, 34); look(G.cam, lerpV(V(-1.5, 1.6, 1.0), V(0.6, 1.8, -0.2), ease(p)), V(40, 10.3, -35)); return { world: G, vig: 0.65 }; },
  mast_turn(W, p, t) { const G = W.G; base(G); G.sh.position.set(40, -1.5, -35); const k = easeOut(sm(0.1, 0.75, p)); G.sh.rotation.y = -Math.PI / 2 + 0.05 + k * (Math.PI / 2 - 0.05 - 0.0) ;
    const cp = V(6, 2.0, -8); G.sh.rotation.y = Math.atan2(cp.x - 40, cp.z + 35) + (1 - k) * 0.85;
    fov(G.cam, 30); look(G.cam, cp, V(40, 10.4, -35)); return { world: G, vig: 0.7, shake: k > 0.95 && p < 0.85 ? 0.003 : 0 }; },
  counter_rule(W, p) { const G = W.G; base(G); G.boy.visible = true; setTex(G.boy, G.T.boyS); G.boy.position.set(-2.8, 0.42, 1.6);
    look(G.cam, lerpV(V(-0.4, 1.75, 1.7), V(-0.8, 1.7, 1.65), ease(p)), V(-2.8, 1.45, 1.6)); return { world: G, vig: 0.6 }; },
  hide(W, p, t, sh) { const G = W.G; base(G); const off = t > sh.segs[0].s + 0.9; G.radioG.visible = !off; if (off) G.rdial.material.color.set(0x332a20);
    const k = sm(0.45, 0.8, p); G.sit.visible = k > 0; G.boy.visible = false; G.sit.position.set(-2.8, 0, 1.6);
    look(G.cam, lerpV(V(-0.9, 1.55, 3.4), V(-3.7, 0.95, 3.4), ease(k)), lerpV(V(-1.9, 1.25, 2.6), V(-2.8, 0.55, 1.6), ease(k))); return { world: G, vig: 0.7 }; },
  pa_speaker(W, p, t, sh) { const G = W.G; base(G); const s1 = sh.segs[1].s; const fl = t > s1 && Math.sin(t * 37) > 0.2;
    G.shopL.forEach(l => l.intensity = fl ? 1.0 : 4); G.ceilP.color.set(fl ? 0x404448 : 0xd6d8df);
    look(G.cam, lerpV(V(-2.6, 1.6, 0.8), V(-3.0, 2.3, 0.2), ease(p)), V(-3.5, 3.4, -0.6));
    const on = t > s1; return { world: G, vig: 0.7, shake: on ? 0.0015 : 0, rings: on ? { p: V(-3.5, 3.38, -0.6), t: t - s1 } : null }; },
  face_hand(W, p) { const G = W.G; base(G); G.sit.visible = true; G.sit.position.set(-2.8, 0, 1.6); G.shopL.forEach(l => l.intensity = 4);
    look(G.cam, V(-2.8 + 0.05, 0.8, L(2.75, 2.55, ease(p))), V(-2.8, 0.72, 1.6)); return { world: G, vig: 0.8 }; },
  dawn_ext(W, p) { const G = W.G; base(G, 'dawn'); look(G.cam, lerpV(V(5, 1.7, 3), V(5, 1.9, 2.6), ease(p)), lerpV(V(40, 6, 3), V(40, 12, 3), ease(p))); return { world: G, vig: 0.4 }; },
  colleague_door(W, p) { const G = W.G; base(G, 'dawn'); G.coll.visible = true; G.coll.position.set(-0.8, 0, -2.2); G.boy.visible = true; setTex(G.boy, G.T.boyB); G.boy.position.set(-2.8, 0, 1.6);
    look(G.cam, lerpV(V(-5.5, 1.7, 2.8), V(-5.0, 1.6, 2.4), ease(p)), V(-1.2, 1.1, -1.2)); return { world: G, vig: 0.5 }; },
  colleague_face(W, p) { const G = W.G; base(G, 'dawn'); G.coll.visible = true; G.coll.position.set(-0.8, 0, -2.2);
    look(G.cam, V(-2.0, 1.12, L(-1.2, -1.45, ease(p))), V(-0.8, 1.02, -2.2)); return { world: G, vig: 0.55, desat: 0.4 }; },
  truck_forest(W, p, t, sh) { const G = W.G; base(G); G.sh.visible = false; G.sh2.visible = true; const on = Math.floor(t * 5) % 2;
    G.tBlue[0].visible = !!on; G.tBlue[1].visible = !on; G.tBlueL.intensity = 40; G.hemi.intensity = 1.3; G.moon.intensity = 1.0; G.S.fog.near = 30; G.S.fog.far = 220;
    const st = sh.sfx.find(f => f.n === 'stinger'), after = st ? t - st.t : -1; G.sh2.position.set(3, after > 0 ? 0 : -2.5, -126); G.sh2.material.emissiveIntensity = 0.5;
    G.sh2.rotation.y = Math.atan2(13 - 3, -92 + 126);
    look(G.cam, lerpV(V(13.5, 1.2, -90), V(13.8, 1.25, -95), ease(p)), V(10, after > 0 ? 8.5 : 4.5, -118));
    return { world: G, vig: 0.8, tint: after > 0 ? 0.55 : 0.2, shake: after > 0 && after < 0.5 ? 0.01 * (1 - after / 0.5) : 0, flash: after > 0 && after < 0.12 ? 1 - after / 0.12 : 0 }; },
};
for (const k of Object.keys(SHOTS)) { const f = SHOTS[k]; SHOTS[k] = (W, ...a) => { fov(W.G.cam, 50); const r = f(W, ...a);
  if (r.rings) { const cam = W.G.cam, rp = r.rings; r.post2d = g => { cam.updateMatrixWorld(); const q = rp.p.clone().project(cam), x = (q.x + 1) / 2 * CW, y = (1 - q.y) / 2 * CH;
    g.save(); for (let i = 0; i < 4; i++) { const u = (rp.t * 1.4 + i / 4) % 1; g.strokeStyle = `rgba(255,255,255,${0.7 * (1 - u)})`; g.lineWidth = 8; g.beginPath(); g.ellipse(x, y, 60 + u * 420, 25 + u * 170, 0, 0, 7); g.stroke(); } g.restore(); }; }
  return r; }; }
SHOTS._billboard = billboard; SHOTS._shake = shake;

// ------------------------------------------------------------------ 2D-Szenen
function radioScene(g, p, t, shot) {
  const id = shot.id;
  g.fillStyle = '#16100c'; g.fillRect(0, 0, CW, CH);
  const wd = g.createLinearGradient(0, 0, 0, CH); wd.addColorStop(0, '#2a1d14'); wd.addColorStop(1, '#0c0806'); g.fillStyle = wd; g.fillRect(0, 0, CW, CH);
  const s = L(1, 1.08, ease(p)), cx = CW / 2 + Math.sin(t * 23) * (id === 'radio3' ? 3 : 0), cy = 860;
  g.save(); g.translate(cx, cy); g.scale(s, s);
  g.fillStyle = '#7a5434'; g.strokeStyle = '#1c1310'; g.lineWidth = 10; g.beginPath(); g.roundRect(-430, -330, 860, 660, 60); g.fill(); g.stroke();
  g.fillStyle = '#5e3f26'; g.beginPath(); g.roundRect(-400, -300, 860 - 60, 600, 46); g.fill();
  g.fillStyle = '#2a1d14'; g.beginPath(); g.roundRect(-380, -270, 420, 540, 30); g.fill();
  const vib = id === 'radio3' ? 1 + Math.sin(t * 60) * 0.03 : 1;
  for (let y = -240; y <= 240; y += 26) for (let x = -350; x <= 10; x += 26) { g.fillStyle = '#120c08'; g.beginPath(); g.arc(x * vib, y * vib, 8, 0, 7); g.fill(); }
  g.fillStyle = '#f3dca0'; g.beginPath(); g.roundRect(80, -250, 300, 230, 18); g.fill();
  const glowD = g.createRadialGradient(230, -135, 10, 230, -135, 220); glowD.addColorStop(0, 'rgba(255,190,90,.35)'); glowD.addColorStop(1, 'rgba(255,190,90,0)'); g.fillStyle = glowD; g.fillRect(60, -280, 340, 290);
  g.fillStyle = '#3a2a18'; g.font = '700 22px Montserrat'; g.textAlign = 'center';
  for (let i = 0; i <= 6; i++) { const x = 100 + i * 43; g.fillRect(x - 1, -110, 2, i % 2 ? 14 : 24); g.fillText(String(88 + i * 3), x, -60); }
  g.font = '800 20px Montserrat'; g.fillText('UKW  MHz', 230, -200);
  let pos = 0.2 + 0.6 * ((Math.sin(t * 2.3) + 1) / 2);
  if (id === 'radio1') pos = 0.1 + 0.8 * ((Math.sin(t * 4) + 1) / 2);
  if (id === 'radio2') pos = [0.15, 0.55, 0.85][Math.min(2, Math.floor(p * 3))] + Math.sin(t * 30) * 0.01;
  if (id === 'radio3') pos = 0.55 + Math.sin(t * 40) * 0.02;
  g.strokeStyle = '#c0201a'; g.lineWidth = 6; g.beginPath(); g.moveTo(100 + pos * 258, -240); g.lineTo(100 + pos * 258, -30); g.stroke();
  for (const [x, y] of [[150, 120], [310, 120]]) { g.fillStyle = '#1a120c'; g.beginPath(); g.arc(x, y, 62, 0, 7); g.fill(); g.fillStyle = '#d9c9a0'; g.beginPath(); g.arc(x, y, 50, 0, 7); g.fill(); g.strokeStyle = '#1a120c'; g.lineWidth = 8; const a = t * (x > 200 ? 2 : -1); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 44, y + Math.sin(a) * 44); g.stroke(); }
  g.restore();
  if (id === 'radio2') { const lab = ['NACHRICHTEN', '♪ KINDERLIED', 'WETTER'][Math.min(2, Math.floor(p * 3))];
    g.fillStyle = 'rgba(14,14,18,.88)'; g.beginPath(); g.roundRect(CW / 2 - 230, 300, 460, 76, 38); g.fill(); g.fillStyle = '#ffd27a'; g.font = '400 46px Anton'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(lab, CW / 2, 339); }
  return { vig: 0.6 };
}
let SHC = null;
function redSiren(g, p, t) {
  if (!SHC) SHC = C.MONSTERS['SIREN HEAD']();
  const s = g.createLinearGradient(0, 0, 0, CH); s.addColorStop(0, '#3a0507'); s.addColorStop(0.55, '#a51f1a'); s.addColorStop(0.8, '#d24a2c'); s.addColorStop(1, '#260304'); g.fillStyle = s; g.fillRect(0, 0, CW, CH);
  const hh = 2900, top = L(-hh + 1750, 60, ease(p));
  g.fillStyle = '#4a0709'; for (let i = 0; i < 14; i++) { const x = i * 90 - 30, h = 260 + ((i * 53) % 180), yb = top + hh; g.beginPath(); g.moveTo(x - 80, yb); g.lineTo(x, yb - h); g.lineTo(x + 80, yb); g.fill(); }
  g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 40; g.drawImage(SHC, CW / 2 - hh / 4, top, hh / 2, hh); g.restore();
  return { vig: 0.75, tint: 0.15 };
}
function redWaves(g, p, t) {
  if (!SHC) SHC = C.MONSTERS['SIREN HEAD']();
  const s = g.createLinearGradient(0, 0, 0, CH); s.addColorStop(0, '#3a0507'); s.addColorStop(0.6, '#b0261c'); s.addColorStop(1, '#2a0405'); g.fillStyle = s; g.fillRect(0, 0, CW, CH);
  const sc = L(4.2, 4.6, ease(p)), w = 512 * sc / 2 * 2, h = 1024 * sc / 2 * 2; const x0 = CW / 2 - w / 2, y0 = 640 - 150 * sc;
  for (const side of [-1, 1]) { const cx = CW / 2 + side * 200 * sc / 2 * 1.0, cy = y0 + 150 * sc;
    for (let i = 0; i < 5; i++) { const u = (t * 0.9 + i / 5) % 1; g.strokeStyle = `rgba(255,220,200,${0.75 * (1 - u)})`; g.lineWidth = 10; g.beginPath(); g.arc(cx + side * 40, cy, 60 + u * 520, side < 0 ? Math.PI * 0.6 : -Math.PI * 0.4, side < 0 ? Math.PI * 1.4 : Math.PI * 0.4); g.stroke(); } }
  g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30; g.drawImage(SHC, x0, y0, w, h); g.restore();
  g.fillStyle = 'rgba(255,230,210,.85)'; g.font = '400 46px Anton'; g.textAlign = 'center';
  ['„HALLO?“', '„HILFE!“', '„SCHATZ?“'].forEach((s2, i) => { const u = (t * 0.6 + i / 3) % 1; g.globalAlpha = Math.sin(u * Math.PI); g.fillText(s2, CW / 2 + (i - 1) * 300, 1250 - u * 200); }); g.globalAlpha = 1;
  return { vig: 0.75, tint: 0.15 };
}
function clockFast(g, p, t) {
  g.fillStyle = '#1b1d22'; g.fillRect(0, 0, CW, CH); const wl = g.createRadialGradient(CW / 2, 860, 50, CW / 2, 860, 900); wl.addColorStop(0, '#3a3f48'); wl.addColorStop(1, '#101114'); g.fillStyle = wl; g.fillRect(0, 0, CW, CH);
  const mins = L(3 * 60 + 20, 5 * 60 + 50, ease(p)), cx = CW / 2, cy = 860, R = 360;
  g.fillStyle = '#e9e6dc'; g.strokeStyle = '#222'; g.lineWidth = 26; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); g.stroke();
  for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, big = i % 5 === 0; g.strokeStyle = '#222'; g.lineWidth = big ? 10 : 4; g.beginPath(); g.moveTo(cx + Math.sin(a) * (R - 30), cy - Math.cos(a) * (R - 30)); g.lineTo(cx + Math.sin(a) * (R - (big ? 70 : 45)), cy - Math.cos(a) * (R - (big ? 70 : 45))); g.stroke(); }
  const hA = (mins / 720) * Math.PI * 2, mA = (mins % 60) / 60 * Math.PI * 2;
  for (let k = 0; k < 6; k++) { g.globalAlpha = 0.12; const m2 = mA - k * 0.08; g.strokeStyle = '#222'; g.lineWidth = 14; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(m2) * 280, cy - Math.cos(m2) * 280); g.stroke(); } g.globalAlpha = 1;
  g.lineCap = 'round'; g.strokeStyle = '#111'; g.lineWidth = 22; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(hA) * 190, cy - Math.cos(hA) * 190); g.stroke();
  g.lineWidth = 14; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(mA) * 290, cy - Math.cos(mA) * 290); g.stroke();
  g.fillStyle = '#c0201a'; g.beginPath(); g.arc(cx, cy, 20, 0, 7); g.fill();
  const hh = Math.floor(mins / 60), mm = Math.floor(mins % 60); g.fillStyle = 'rgba(14,14,18,.9)'; g.beginPath(); g.roundRect(cx - 150, cy + R + 60, 300, 100, 20); g.fill();
  g.fillStyle = '#fff'; g.font = '400 70px Anton'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`0${hh}:${String(mm).padStart(2, '0')}`, cx, cy + R + 112);
  return { vig: 0.6 };
}
function dispatch(g, p, t) {
  g.fillStyle = '#0b0e13'; g.fillRect(0, 0, CW, CH);
  const x = 80, y = 300, w = CW - 160, h = 1100; g.fillStyle = '#1a1e26'; g.beginPath(); g.roundRect(x - 20, y - 20, w + 40, h + 40, 40); g.fill();
  g.fillStyle = '#1f3326'; g.fillRect(x, y + 120, w, h - 120);
  g.save(); g.beginPath(); g.rect(x, y + 120, w, h - 120); g.clip();
  g.fillStyle = '#18291e'; for (let i = 0; i < 160; i++) { const tx = x + (i * 97) % w, ty = y + 120 + (i * 151) % (h - 120); g.beginPath(); g.moveTo(tx, ty - 26); g.lineTo(tx + 18, ty + 10); g.lineTo(tx - 18, ty + 10); g.fill(); }
  g.strokeStyle = '#4a4a50'; g.lineWidth = 26; g.beginPath(); g.moveTo(x + 120, y + h); g.bezierCurveTo(x + 260, y + 800, x + 600, y + 700, x + 640, y + 260); g.stroke();
  const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40; const bx = (1 - u) ** 3 * (x + 120) + 3 * (1 - u) ** 2 * u * (x + 260) + 3 * (1 - u) * u * u * (x + 600) + u ** 3 * (x + 640); const by = (1 - u) ** 3 * (y + h) + 3 * (1 - u) ** 2 * u * (y + 800) + 3 * (1 - u) * u * u * (y + 700) + u ** 3 * (y + 260); pts.push([bx, by]); }
  const k = Math.floor(ease(p) * 40); g.strokeStyle = '#3aa0ff'; g.lineWidth = 12; g.setLineDash([24, 16]); g.beginPath(); pts.slice(0, Math.max(2, k)).forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.stroke(); g.setLineDash([]);
  const [fx, fy] = pts[Math.max(1, k)]; g.fillStyle = '#ff3b30'; g.beginPath(); g.arc(fx, fy, 22, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '800 26px Montserrat'; g.textAlign = 'left'; g.fillText('HLF 1', fx + 30, fy + 8);
  g.fillStyle = '#ffd24a'; g.beginPath(); g.arc(x + 640, y + 260, 24, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillText('TANKSTELLE', x + 560, y + 220);
  g.restore();
  g.fillStyle = '#c0201a'; g.fillRect(x, y, w, 120); g.fillStyle = '#fff'; g.font = '400 52px Anton'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('EINSATZ · HILFERUF', x + 30, y + 60);
  g.font = '700 28px Montserrat'; g.textAlign = 'right'; g.fillText('03:12 UHR', x + w - 30, y + 60);
  if (Math.floor(t * 2) % 2) { g.fillStyle = 'rgba(255,60,50,.9)'; g.beginPath(); g.roundRect(x + 40, y + h - 120, w - 80, 80, 20); g.fill(); g.fillStyle = '#fff'; g.font = '400 44px Anton'; g.textAlign = 'center'; g.fillText('KEIN FUNKKONTAKT', x + w / 2, y + h - 80); }
  return { vig: 0.55 };
}
export const TWO = { radio: radioScene, red_siren: redSiren, red_waves: redWaves, clock_fast: clockFast, dispatch };
