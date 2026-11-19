// Folge 7 – Kuchisake-onna: enge Gasse in Tokio bei Nacht (Laterne, Automaten, Strommasten), Kueche der Gastfamilie + 2D-Szenen
import * as THREE from 'three';
import * as C from '../chars.js';
import { tex, lam, box, sprite, setTex, glow, gradTex, V, L, clamp, sm, lerpV, look, billboard, shake, rnd, ease } from '../world.js';
import { W as CW, H as CH } from '../overlay.js';

const easeOut = t => 1 - Math.pow(1 - t, 3);
function fov(cam, f) { if (cam.fov !== f) { cam.fov = f; cam.updateProjectionMatrix(); } }
const basic = c => new THREE.MeshBasicMaterial({ color: c });

function buildAlley() {
  const S = new THREE.Scene(); S.background = gradTex([[0, '#04050c'], [0.7, '#111a30'], [1, '#1a2238']]); S.fog = new THREE.Fog(0x0c1222, 8, 70);
  const hemi = new THREE.HemisphereLight(0x5a6a9a, 0x161214, 0.45); S.add(hemi);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(6, 200), lam(0x3a3a40)); fl.rotation.x = -Math.PI / 2; fl.position.z = -60; S.add(fl);
  for (let z = 10; z > -140; z -= 6) S.add(box(0.1, 0.01, 0.3, lam(0xd8d8d0), -2.3, 0.02, z), box(0.1, 0.01, 0.3, lam(0xd8d8d0), 2.3, 0.02, z));
  // Mauern / Zaeune / Haeuser links und rechts
  for (let z = 10; z > -140; z -= 8) { for (const s of [-1, 1]) {
    const h = 2 + rnd() * 0.6; S.add(box(0.3, h, 8, lam(s < 0 ? 0x6a6a72 : 0x76726a), s * 3.1, h / 2, z - 4));
    const hh = 5 + rnd() * 4; S.add(box(5, hh, 7.6, lam([0x4a4f5e, 0x5a5048, 0x4e5a56][Math.floor(rnd() * 3)]), s * 6, hh / 2, z - 4));
    if (rnd() > 0.5) { const w = box(0.05, 0.6, 0.8, basic(rnd() > 0.5 ? 0xffd28a : 0x8ab0ff), s * 3.48, hh * 0.7, z - 3); S.add(w); } } }
  // Strommasten + Leitungen
  for (let z = 4; z > -140; z -= 16) { S.add(box(0.25, 8, 0.25, lam(0x5a5a5a), 2.8, 4, z), box(1.4, 0.12, 0.12, lam(0x5a5a5a), 2.6, 7.2, z)); }
  for (const y of [7.0, 7.3, 6.7]) { const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 150, 4), lam(0x111111)); wire.rotation.x = Math.PI / 2; wire.position.set(2.4, y, -66); S.add(wire); }
  // Getraenkeautomaten (leuchten)
  const vend = new THREE.Group(); vend.position.set(-2.55, 0, -6); S.add(vend);
  vend.add(box(0.8, 1.8, 0.7, lam(0xc02a2a), 0, 0.9, 0)); const vf = box(0.02, 1.2, 0.55, basic(0xe8f2ff), 0.41, 1.05, 0); vend.add(vf);
  for (let i = 0; i < 12; i++) vend.add(box(0.02, 0.12, 0.08, basic([0x3a8ad9, 0xe8c040, 0x4ab06a, 0xd94a3a][i % 4]), 0.425, 1.45 - Math.floor(i / 4) * 0.25, -0.18 + (i % 4) * 0.12));
  const vl = new THREE.PointLight(0xdfe9ff, 6, 6, 1.4); vl.position.set(-1.8, 1.2, -6); S.add(vl);
  // Laterne mit Lichtkegel
  const lampZ = -22, lamp = new THREE.Group(); lamp.position.set(2.4, 0, lampZ); S.add(lamp);
  lamp.add(box(0.15, 5.2, 0.15, lam(0x6a6a6a), 0, 2.6, 0), box(0.9, 0.1, 0.1, lam(0x6a6a6a), -0.45, 5.1, 0), box(0.5, 0.12, 0.3, lam(0x2a2a2a), -0.85, 5.0, 0));
  const bulb = box(0.4, 0.04, 0.22, basic(0xfff3cf), -0.85, 4.93, 0); lamp.add(bulb);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(2.4, 4.9, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide })); cone.position.set(-0.85, 2.45, 0); lamp.add(cone);
  const spot = new THREE.SpotLight(0xffe9b8, 40, 12, 0.6, 0.5, 1.2); spot.position.set(1.55, 4.9, lampZ); spot.target.position.set(1.4, 0, lampZ); S.add(spot, spot.target);
  const T = { mask: C.kuchisake(true, false), maskS: C.kuchisake(true, true), boyB: C.boy('back'), boyS: C.boy('front', 'scared_sweat'), boyF: C.boy('front', 'neutral') };
  const woman = sprite(T.mask, 1.9, 0.2); S.add(woman);
  const boy = sprite(T.boyB, 1.35); S.add(boy);
  // Kueche (bei x = 40)
  const K = new THREE.Group(); K.position.set(40, 0, 0); S.add(K);
  const kf = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), lam(0xc9b08a)); kf.rotation.x = -Math.PI / 2; K.add(kf);
  K.add(box(8, 3, 0.1, lam(0xe8e0d0), 0, 1.5, -3), box(0.1, 3, 8, lam(0xe8e0d0), -3.5, 1.5, 0), box(0.1, 3, 8, lam(0xe8e0d0), 3.5, 1.5, 0));
  const shoji = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.4), new THREE.MeshBasicMaterial({ color: 0xfff1d6 })); shoji.position.set(0.5, 1.7, -2.94); K.add(shoji);
  for (let i = -1; i <= 1; i++) K.add(box(0.03, 1.4, 0.02, lam(0x6a4a30), 0.5 + i * 0.73, 1.7, -2.93)); K.add(box(2.2, 0.03, 0.02, lam(0x6a4a30), 0.5, 1.7, -2.93));
  K.add(box(1.6, 0.06, 1.0, lam(0x8a5a3a), 0, 0.72, -0.6)); for (const [x, z] of [[-0.7, -1], [0.7, -1], [-0.7, -0.2], [0.7, -0.2]]) K.add(box(0.06, 0.72, 0.06, lam(0x6a4a30), x, 0.36, z));
  for (const x of [-0.35, 0.35]) { K.add(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.06, 0.08, 16), lam(0xf2f2ee))); K.children[K.children.length - 1].position.set(x, 0.79, -0.35); }
  K.add(box(0.3, 0.02, 0.2, lam(0xd94a3a), 0, 0.76, -0.8));
  const mom = sprite(C.hostmom(true, 'smile'), 1.5, 0.3); mom.userData.noBB = true; mom.children[0].visible = false; mom.position.set(0, 0, -1.25); K.add(mom);
  const T2 = { momMask: C.hostmom(true, 'smile'), momMaskC: C.hostmom(true, 'calm'), momNormal: C.hostmom('normal', 'calm'), momOpen: C.hostmom(false, 'wide') };
  const kitL = new THREE.PointLight(0xfff0d8, 4, 9, 1.2); kitL.position.set(40, 2.6, 0.5); S.add(kitL);
  const sun = new THREE.DirectionalLight(0xffe2b8, 0.0); sun.position.set(40.5, 4, -6); sun.target.position.set(40, 0, 0); S.add(sun, sun.target);
  return { S, hemi, lamp, bulb, cone, spot, vl, woman, boy, T, mom, T2, kitL, sun, cam: new THREE.PerspectiveCamera(50, 9 / 16, 0.05, 300) };
}
export function build() { return { A: buildAlley() }; }

function lampOn(A, on) { A.spot.intensity = on ? 40 : 0; A.bulb.material.color.set(on ? 0xfff3cf : 0x333333); A.cone.visible = on; }
function base(A) { A.woman.visible = A.boy.visible = false; A.woman.rotation.z = 0; lampOn(A, true); A.hemi.intensity = 0.45; A.woman.material.emissiveIntensity = 0.2; A.sun.intensity = 0; A.kitL.intensity = 4; }
const flick = (t, k = 1) => Math.sin(t * 31) * Math.sin(t * 7.3) > 0.55 * k;

export const SHOTS = {
  alley_open(W, p, t, sh) { const A = W.A; base(A); const dt = t - sh.s;
    // Laterne flackert; bei jedem Aus/An steht sie naeher
    const off = (dt > 0.55 && dt < 0.75) || (dt > 1.25 && dt < 1.4); lampOn(A, !off);
    const stage = dt < 0.75 ? 0 : dt < 1.4 ? 1 : 2; const z = [-24, -15, -8][stage]; A.woman.visible = !off; A.woman.position.set(1.0, 0, z);
    look(A.cam, V(-0.2, 1.55, 2), V(0.6, 1.5, -20)); fov(A.cam, L(42, 36, ease(p)));
    return { world: A, vig: 0.85, shake: (dt > 0.75 && dt < 0.95) || (dt > 1.4 && dt < 1.6) ? 0.006 : 0 }; },
  alley_walk(W, p, t, sh) { const A = W.A; base(A); const z = 2 - (t - sh.s) * 1.2; A.boy.visible = true; setTex(A.boy, A.T.boyB); A.boy.position.set(-0.6, 0, z);
    look(A.cam, V(-0.3, 1.6, z + 4.2), V(-0.4, 1.2, z - 8)); return { world: A, vig: 0.7 }; },
  alley_lamp(W, p, t) { const A = W.A; base(A); A.woman.visible = true; A.woman.position.set(1.2, 0, -21.5); A.boy.visible = true; setTex(A.boy, A.T.boyB); A.boy.position.set(-0.5, 0, -6);
    look(A.cam, lerpV(V(-0.8, 1.4, -1.5), V(-0.6, 1.5, -3.5), ease(p)), V(0.8, 1.4, -21)); fov(A.cam, L(46, 34, ease(p))); return { world: A, vig: 0.75 }; },
  close_mask(W, p, t, sh) { const A = W.A; base(A); A.woman.visible = true; A.woman.position.set(0.2, 0, -10.6); const s1 = sh.segs[1] ? sh.segs[1].s : 1e9, k = ease(sm(0, 1, p));
    A.woman.rotation.z = t > s1 ? Math.sin((t - s1) * 1.5) * 0.04 : 0;
    look(A.cam, lerpV(V(0.0, 1.3, -8.2), V(0.15, 1.55, -9.75), k), lerpV(V(0.2, 1.4, -10.6), V(0.2, 1.62, -10.6), k)); fov(A.cam, 50);
    return { world: A, vig: 0.85, shake: t > s1 ? 0.0012 : 0 }; },
  boy_rule(W, p, t) { const A = W.A; base(A); A.boy.visible = true; setTex(A.boy, A.T.boyS); A.boy.position.set(0, 0, -9);
    look(A.cam, V(0.05, 1.12, L(-10.1, -10.2, ease(p))), V(0, 1.02, -9)); fov(A.cam, 58); return { world: A, vig: 0.8 }; },
  boy_answer(W, p, t) { const A = W.A; base(A); A.boy.visible = true; setTex(A.boy, A.T.boyS); A.boy.position.set(0, 0, -9);
    look(A.cam, V(0.05, 1.05, L(-9.75, -9.6, ease(p))), V(0, 1.02, -9)); fov(A.cam, 56); return { world: A, vig: 0.85, shake: 0.001 }; },
  alley_tilt(W, p, t, sh) { const A = W.A; base(A); const dt = t - sh.s, dur = sh.e - sh.s; const off = dt > dur * 0.55 && dt < dur * 0.62; lampOn(A, !off);
    A.woman.visible = dt < dur * 0.55; A.woman.position.set(0.2, 0, -10.6); A.woman.rotation.z = -0.35 * easeOut(clamp(dt / (dur * 0.4)));
    look(A.cam, V(0.0, 1.45, -7.6), V(0.2, 1.4, -10.6)); fov(A.cam, 46); return { world: A, vig: 0.8 }; },
  home_warn(W, p, t) { const A = W.A; base(A); A.kitL.intensity = 3; setTex(A.mom, A.T2.momNormal);
    look(A.cam, lerpV(V(40, 1.25, 1.6), V(40, 1.25, 1.2), ease(p)), V(40, 1.05, -1.25)); return { world: A, vig: 0.55 }; },
  breakfast(W, p, t) { const A = W.A; base(A); A.sun.intensity = 1.3; A.kitL.intensity = 3; setTex(A.mom, A.T2.momMaskC);
    look(A.cam, lerpV(V(41.2, 1.5, 1.8), V(40.6, 1.35, 1.2), ease(p)), V(40, 1.0, -1.0)); return { world: A, vig: 0.4 }; },
  mom_close(W, p, t, sh) { const A = W.A; base(A); A.sun.intensity = 1.3; const st = sh.sfx.find(f => f.n === 'stinger'), after = st ? t - st.t : -1;
    setTex(A.mom, after > 0 ? A.T2.momOpen : A.T2.momMask);
    const k = ease(sm(0, 1, p)); look(A.cam, lerpV(V(40, 1.2, 0.2), V(40, 1.18, -0.42), k), V(40, 1.18, -1.25)); fov(A.cam, 50);
    return { world: A, vig: 0.6, tint: after > 0 ? 0.35 : 0, flash: after > 0 && after < 0.12 ? 1 - after / 0.12 : 0, shake: after > 0 && after < 0.5 ? 0.01 * (1 - after / 0.5) : 0 }; },
};
for (const k of Object.keys(SHOTS)) { const f = SHOTS[k]; SHOTS[k] = (W, ...a) => { fov(W.A.cam, 50); return f(W, ...a); }; }
SHOTS._billboard = billboard; SHOTS._shake = shake;

// ------------------------------------------------------------------ 2D-Szenen
function redSky(g) { const s = g.createLinearGradient(0, 0, 0, CH); s.addColorStop(0, '#3a0507'); s.addColorStop(0.55, '#a51f1a'); s.addColorStop(0.8, '#d24a2c'); s.addColorStop(1, '#260304'); g.fillStyle = s; g.fillRect(0, 0, CW, CH); }
function skyline(g, base) { g.fillStyle = '#4a0709'; let x = -20, sd = 3; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647; while (x < CW + 40) { const w = 60 + r() * 90, h = 120 + r() * 260; g.fillRect(x, base - h, w, h + 10); x += w + 8; } g.fillRect(0, base, CW, CH - base);
  g.strokeStyle = '#4a0709'; g.lineWidth = 6; for (const y of [base - 420, base - 400]) { g.beginPath(); g.moveTo(0, y); g.quadraticCurveTo(CW / 2, y + 60, CW, y); g.stroke(); } }
let KS = null, KF = {};
function redKuchi(g, p, t) { if (!KS) KS = C.kuchisake(true, true); redSky(g); skyline(g, 1550);
  const hh = 2500, top = L(-hh + 1850, 120, ease(p)); g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 40; g.drawImage(KS, CW / 2 - hh / 4, top, hh / 2, hh); g.restore(); return { vig: 0.75, tint: 0.15 }; }
function bigFace(g, mask, eyes, zoom) { // Kopfausschnitt formatfuellend
  const key = String(mask) + eyes; if (!KF[key]) KF[key] = C.kuchisake(mask, false, eyes);
  const w = 2000 * zoom, h = w * 2; g.drawImage(KF[key], CW / 2 - w / 2, 860 - h * 0.235, w, h);
}
function redMask(g, p, t, shot) { redSky(g); const s1 = shot.segs[0], half = s1.s + (s1.e - s1.s) * 0.5, d = easeOut(clamp((t - half) / 1.1));
  if (t < half) { bigFace(g, true, 'calm', 1.0); return { vig: 0.8, tint: 0.15 }; }
  bigFace(g, false, 'calm', 1.0);
  g.fillStyle = 'rgba(12,0,0,.94)'; g.beginPath(); g.ellipse(CW / 2, 1010, 560, 210, 0, 0, 7); g.fill(); // Mund liegt noch im Schatten
  g.save(); g.translate(CW / 2 + d * 120, 960 + d * 900); g.rotate(d * 0.6); g.globalAlpha = 1 - d * 0.6; // Maske faellt
  g.fillStyle = '#f4f6f8'; g.strokeStyle = '#1c1512'; g.lineWidth = 14; g.beginPath(); g.moveTo(-460, -40); g.quadraticCurveTo(0, -90, 460, -40); g.quadraticCurveTo(430, 330, 0, 380); g.quadraticCurveTo(-430, 330, -460, -40); g.fill(); g.stroke(); g.restore();
  return { vig: 0.8, tint: 0.15 }; }
function redMouth(g, p, t) { redSky(g); bigFace(g, false, 'wide', L(1.0, 1.25, ease(p))); return { vig: 0.8, tint: 0.15, shake: p < 0.15 ? 0.004 : 0 }; }
export const TWO = { red_kuchi: redKuchi, red_mask: redMask, red_mouth: redMouth };
