// Folge 3 – Slender Man: Herbstwald, Dorf, Polizei, Zimmer + Camcorder-Sucher + Roehrenfernseher
import * as THREE from 'three';
import * as C from '../chars.js';
import { tex, lam, box, sprite, setTex, glow, gradTex, V, L, clamp, sm, lerpV, look, billboard, shake, rnd, ease } from '../world.js';
import { W as CW, H as CH } from '../overlay.js';

const easeOut = t => 1 - Math.pow(1 - t, 3);
function fov(cam, f) { if (cam.fov !== f) { cam.fov = f; cam.updateProjectionMatrix(); } }
function spr(canvas, h, em = 0.35) { const s = sprite(canvas, h, em); return s; }

// ------------------------------------------------------------------ WELT
function build3() {
  const S = new THREE.Scene();
  const BG = { night: gradTex([[0, '#03050b'], [0.6, '#0d1724'], [1, '#121c28']]), grey: gradTex([[0, '#8d949c'], [1, '#b9bec2']]), dawn: gradTex([[0, '#6d7fa3'], [0.7, '#e8b98c'], [1, '#f2d2a6']]) };
  S.background = BG.night; S.fog = new THREE.Fog(0x0e1824, 5, 42);
  const hemi = new THREE.HemisphereLight(0x6b84b0, 0x1a1410, 0.75); S.add(hemi);
  const moon = new THREE.DirectionalLight(0x9fb2e0, 0.7); moon.position.set(-10, 30, 10); S.add(moon);
  // Waldboden mit Laub
  const gg = new THREE.PlaneGeometry(240, 700, 80, 220); gg.rotateX(-Math.PI / 2); const col = [], P = gg.attributes.position;
  for (let i = 0; i < P.count; i++) { const c = [[0.42, 0.22, 0.09], [0.55, 0.3, 0.1], [0.32, 0.2, 0.12], [0.6, 0.4, 0.15]][Math.floor(rnd() * 4)], k = 0.55 + rnd() * 0.3; col.push(c[0] * k, c[1] * k, c[2] * k); P.setY(i, (rnd() - .5) * 0.12); }
  gg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); gg.computeVertexNormals();
  S.add(new THREE.Mesh(gg, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })));
  const path = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 300), lam(0x4a3a2c)); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.075, 0); S.add(path);
  // hohe, duenne Staemme + Herbstkronen
  const N = 900, trunk = new THREE.CylinderGeometry(0.16, 0.26, 14, 6), crown = new THREE.IcosahedronGeometry(2.2, 0);
  const it = new THREE.InstancedMesh(trunk, lam(0x3a2c24), N), ic = new THREE.InstancedMesh(crown, lam(0x8a4a1c), N), M = new THREE.Matrix4(), Q = new THREE.Quaternion();
  for (let i = 0; i < N; i++) {
    let x = (rnd() - .5) * 120, z = -140 + rnd() * 280; if (Math.abs(x) < 1.6) x += 3 * Math.sign(x || 1);
    const s = 0.8 + rnd() * 0.5; Q.setFromEuler(new THREE.Euler((rnd() - .5) * 0.06, 0, (rnd() - .5) * 0.06));
    M.compose(V(x, 7 * s, z), Q, V(s, s, s)); it.setMatrixAt(i, M);
    M.compose(V(x, 13.5 * s, z), Q, V(s * 1.3, s, s * 1.3)); ic.setMatrixAt(i, M); ic.setColorAt(i, new THREE.Color([0x8a4a1c, 0x6e3a16, 0xa3611f, 0x5a4a1e][i % 4]));
  }
  S.add(it, ic);
  // Kinder + Taschenlampen
  const T = { boyB: C.boy('back'), boyF: C.boy('front', 'neutral'), boyS: C.boy('front', 'scared_sweat'), miaB: C.mia('back'), miaF: C.mia('front', 'neutral', true), miaS: C.mia('front', 'scared_sweat', true) };
  const boy = spr(T.boyB, 1.35), mia = spr(T.miaB, 1.3); S.add(boy, mia);
  const fl = [0, 1].map(() => { const l = new THREE.SpotLight(0xfff2d8, 18, 30, 0.32, 0.5, 1.3); S.add(l, l.target); return l; });
  const camL = new THREE.PointLight(0x9fd4ff, 1.4, 1.6, 1.5); S.add(camL);
  const slender = spr(C.MONSTERS['SLENDER MAN'](), 3.3, 0.18); S.add(slender);
  // Dorf (z 150..)
  const vil = new THREE.Group(); vil.position.set(0, 0, 160); S.add(vil);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(6, 120), lam(0x2c2d31)); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.03, 40); vil.add(road);
  const lamps = [];
  for (let k = 0; k < 6; k++) {
    const z = 10 + k * 14, x = k % 2 ? 4 : -4; vil.add(box(0.12, 4.5, 0.12, lam(0x2a2a2e), x, 2.25, z));
    const l = new THREE.PointLight(0xffb060, 6, 14, 1.4); l.position.set(x * 0.85, 4.3, z); vil.add(l); const gl = glow(1.6, [255, 180, 90]); gl.position.set(x * 0.9, 4.35, z); vil.add(gl); lamps.push(l);
    for (const sx of [-1, 1]) { const hx = sx * (10 + rnd() * 3), hz = z + 4; const h = new THREE.Group(); h.position.set(hx, 0, hz); vil.add(h);
      h.add(box(6, 4, 6, lam([0xd9cdb8, 0xc8b49a, 0xe2d6c4][k % 3]), 0, 2, 0)); const rs = new THREE.Shape(); rs.moveTo(-3.4, 0); rs.lineTo(3.4, 0); rs.lineTo(0, 2.6); const rg = new THREE.ExtrudeGeometry(rs, { depth: 6.6, bevelEnabled: false }); rg.translate(0, 0, -3.3);
      const roof = new THREE.Mesh(rg, lam(0x7a3a2a)); roof.position.y = 4; h.add(roof);
      if (rnd() > 0.4) h.add(box(1.0, 1.0, 0.05, new THREE.MeshBasicMaterial({ color: 0xffc070 }), -sx * 3.03 < 0 ? 0 : 0, 2.4, -sx * 3.03)); }
  }
  // Haustuer + Kamera auf der Matte
  const door = new THREE.Group(); door.position.set(30, 0, 160); S.add(door);
  door.add(box(6, 4, 0.3, lam(0xd8ccb4), 0, 2, 0), box(1.1, 2.2, 0.1, lam(0x7a2e22), 0, 1.1, 0.18), box(0.08, 0.08, 0.06, lam(0xd9b24a), 0.4, 1.1, 0.25));
  door.add(box(1.0, 0.03, 0.6, lam(0x5a4a3a), 0, 0.02, 0.6), box(1.6, 0.18, 0.8, lam(0x8a8a8a), 0, 0.09, 0.95));
  const cam = new THREE.Group(); cam.add(box(0.26, 0.14, 0.12, lam(0x1f2024), 0, 0.07, 0)); const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.08, 14), lam(0x0e0f12)); lens.rotation.z = Math.PI / 2; lens.position.set(0.16, 0.08, 0); cam.add(lens);
  cam.add(box(0.12, 0.08, 0.01, new THREE.MeshBasicMaterial({ color: 0x223040 }), -0.02, 0.1, 0.065)); const led = glow(0.25, [255, 40, 30]); led.position.set(0.1, 0.16, 0.06); cam.add(led); cam.add(box(0.02, 0.02, 0.01, new THREE.MeshBasicMaterial({ color: 0xff3020 }), 0.1, 0.16, 0.062));
  cam.position.set(0.15, 0.18, 0.95); cam.rotation.y = 0.5; door.add(cam);
  // Polizei am Waldrand
  const pol = new THREE.Group(); pol.position.set(-30, 0, -60); S.add(pol);
  const pc = new THREE.Group(); pc.add(box(1.9, 0.7, 4.6, lam(0xeeeeea), 0, 0.65, 0), box(1.92, 0.25, 4.62, lam(0x2f7a4a), 0, 0.75, 0), box(1.7, 0.6, 2.4, lam(0xeeeeea), 0, 1.3, -0.2), box(1.2, 0.12, 0.3, lam(0x2050ff), 0, 1.66, -0.2));
  pol.add(pc); pc.rotation.y = 0.6;
  const blue = [new THREE.PointLight(0x3060ff, 0, 18, 1.2), new THREE.PointLight(0x3060ff, 0, 18, 1.2)]; blue.forEach((b, i) => { b.position.set(i ? 0.4 : -0.4, 1.9, -0.2); pc.add(b); });
  const blueG = [glow(2.2, [60, 110, 255]), glow(2.2, [60, 110, 255])]; blueG.forEach((b, i) => { b.position.set(i ? 0.4 : -0.4, 1.75, -0.2); pc.add(b); });
  const searchers = []; for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 1.1, 4, 8), lam(0x2a3038)); m.position.set(-3 + i * 1.6 + (rnd() - .5), 0.8, 6 + rnd() * 3); pol.add(m); searchers.push(m); }
  // Zimmer (separat, weit weg)
  const room = new THREE.Group(); room.position.set(0, 0, -400); S.add(room);
  const wall = lam(0x6d7690); const rfl = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), lam(0x5a4030)); rfl.rotation.x = -Math.PI / 2; room.add(rfl);
  room.add(box(5, 0.08, 5, lam(0x8a92a8), 0, 2.6, 0), box(0.1, 2.6, 5, wall, -2.5, 1.3, 0), box(0.1, 2.6, 5, wall, 2.5, 1.3, 0), box(5, 2.6, 0.1, wall, 0, 1.3, -2.5), box(5, 2.6, 0.1, wall, 0, 1.3, 2.5));
  room.add(box(1.2, 0.9, 0.06, new THREE.MeshBasicMaterial({ color: 0x24365c }), 1.0, 1.5, -2.44));
  const bed = spr(C.boyBed(), 1.0, 0.25); bed.userData.noBB = true; bed.children[0].visible = false; bed.position.set(-0.6, 0, -1.2); bed.rotation.y = Math.PI / 2; room.add(bed);
  const roomL = new THREE.PointLight(0x7f95d0, 3, 8, 1.2); roomL.position.set(0.5, 2.2, 0); room.add(roomL);
  const cornerS = spr(C.MONSTERS['SLENDER MAN'](), 3.0, 0.3); cornerS.position.set(2.0, -0.35, 2.0); room.add(cornerS);
  return { S, BG, hemi, moon, boy, mia, T, fl, camL, slender, vil, lamps, door, pol, blue, blueG, searchers, room, roomL, cornerS, bed,
    cam: new THREE.PerspectiveCamera(50, 9 / 16, 0.03, 600) };
}
export function build() { return { F: build3() }; }

// ------------------------------------------------------------------ Hilfen
function base(F, mode = 'night') {
  F.boy.visible = F.mia.visible = F.slender.visible = false; F.fl.forEach(l => l.intensity = 0); F.camL.intensity = 0;
  F.blue.forEach(b => b.intensity = 0); F.blueG.forEach(b => b.visible = false);
  F.cornerS.visible = false; F.slender.rotation.z = 0;
  if (mode === 'night') { F.S.background = F.BG.night; F.S.fog.color.set(0x0e1824); F.S.fog.near = 5; F.S.fog.far = 42; F.hemi.color.set(0x6b84b0); F.hemi.intensity = 0.75; F.moon.intensity = 0.7; }
  if (mode === 'grey') { F.S.background = F.BG.grey; F.S.fog.color.set(0xa7adb3); F.S.fog.near = 8; F.S.fog.far = 70; F.hemi.color.set(0xdfe4ea); F.hemi.intensity = 1.6; F.moon.intensity = 1.0; }
  if (mode === 'dawn') { F.S.background = F.BG.dawn; F.S.fog.color.set(0xe0b896); F.S.fog.near = 10; F.S.fog.far = 90; F.hemi.color.set(0xffe2c0); F.hemi.intensity = 1.5; F.moon.intensity = 1.2; }
  if (mode === 'room') { F.S.background = F.BG.night; F.S.fog.near = 50; F.S.fog.far = 100; F.hemi.intensity = 0.35; F.moon.intensity = 0.2; }
}
function kids(F, bz, mode = 'back', spacing = 0.7) {
  F.boy.visible = F.mia.visible = true;
  setTex(F.boy, mode === 'back' ? F.T.boyB : mode === 'scared' ? F.T.boyS : F.T.boyF);
  setTex(F.mia, mode === 'back' ? F.T.miaB : mode === 'scared' ? F.T.miaS : F.T.miaF);
  F.boy.position.set(-spacing / 2 - 0.05, 0, bz); F.mia.position.set(spacing / 2 + 0.05, 0, bz + 0.1);
}
function flash(F, i, from, to, I = 18) { const l = F.fl[i]; l.intensity = I; l.position.copy(from); l.target.position.copy(to); }

// ------------------------------------------------------------------ Camcorder-Sucher + Fernseher (2D-Nachbearbeitung)
let NZ = null, CP = null, GT = null;
function noiseCanvases() { if (NZ) return NZ; NZ = []; for (let k = 0; k < 5; k++) { const c = C.cv(270, 480), g = c.getContext('2d'), d = g.createImageData(270, 480);
  for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); NZ.push(c); } return NZ; }
function glitch(g, t, amt, x0 = 0, y0 = 0, w = CW, h = CH) {
  const n = noiseCanvases();
  if (amt > 0.25) { const k = Math.floor(amt * 6); let sd = Math.floor(t * 24) * 7 + 3; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    if (!GT) GT = C.cv(CW, CH); const gt = GT.getContext('2d'); gt.setTransform(1, 0, 0, 1, 0, 0); gt.clearRect(0, 0, CW, CH); gt.drawImage(g.canvas, 0, 0);
    for (let i = 0; i < k; i++) { const y = y0 + r() * h, bh = 10 + r() * 60 * amt, dx = (r() - .5) * 120 * amt; g.drawImage(GT, x0, y, w, bh, x0 + dx, y, w, bh); } }
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = Math.min(0.42, amt * 0.4); g.drawImage(n[Math.floor(t * 30) % n.length], x0, y0, w, h); g.restore();
  g.fillStyle = 'rgba(0,0,0,.14)'; for (let y = y0; y < y0 + h; y += 5) g.fillRect(x0, y, w, 2);
}
function viewfinder(g, t, amt) {
  glitch(g, t, amt);
  g.save(); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 6; g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 6;
  for (const [x, y, dx, dy] of [[70, 150, 1, 1], [CW - 70, 150, -1, 1], [70, 1440, 1, -1], [CW - 70, 1440, -1, -1]]) { g.beginPath(); g.moveTo(x, y + dy * 80); g.lineTo(x, y); g.lineTo(x + dx * 80, y); g.stroke(); }
  g.font = '700 40px DejaVu Sans Mono, monospace'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.textAlign = 'left';
  if (Math.floor(t * 1.6) % 2 === 0) { g.fillStyle = '#ff2a20'; g.beginPath(); g.arc(120, 215, 15, 0, 7); g.fill(); } g.fillStyle = '#fff'; g.fillText('REC', 148, 217);
  g.strokeStyle = '#fff'; g.lineWidth = 4; g.strokeRect(CW - 220, 198, 110, 40); g.fillRect(CW - 110, 208, 8, 20); g.fillRect(CW - 214, 204, 60, 28);
  const s = Math.floor(t), f = Math.floor((t % 1) * 25); g.textAlign = 'right'; g.fillText(`00:0${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}:${String(f).padStart(2, '0')}`, CW - 110, 1390);
  g.textAlign = 'left'; g.fillText('14.10.2011', 110, 1390); g.fillText('SP', 110, 290);
  g.restore();
}
function tvFrame(g, t, amt, extra) {
  if (!CP) CP = C.cv(CW, CH); const m = CP.getContext('2d'); m.setTransform(1, 0, 0, 1, 0, 0); m.drawImage(g.canvas, 0, 0);
  const bg = g.createRadialGradient(CW / 2, 800, 50, CW / 2, 900, 1300); bg.addColorStop(0, '#1d2a3a'); bg.addColorStop(1, '#050608'); g.fillStyle = bg; g.fillRect(0, 0, CW, CH);
  g.fillStyle = '#2a1e16'; g.fillRect(0, 1240, CW, CH - 1240); g.fillStyle = '#3a2a1e'; g.fillRect(40, 1230, CW - 80, 40);
  g.save(); g.shadowColor = 'rgba(120,170,255,.45)'; g.shadowBlur = 90; g.fillStyle = '#26272b'; g.beginPath(); g.roundRect(70, 380, CW - 140, 860, 50); g.fill(); g.restore();
  g.fillStyle = '#18191c'; g.beginPath(); g.roundRect(70, 1110, CW - 140, 130, [0, 0, 50, 50]); g.fill();
  for (let i = 0; i < 6; i++) { g.fillStyle = '#0c0c0e'; g.beginPath(); g.arc(CW - 160 - i * 34, 1175, 10, 0, 7); g.fill(); }
  g.fillStyle = '#4ad04a'; g.beginPath(); g.arc(150, 1175, 9, 0, 7); g.fill();
  const x = 120, y = 430, w = CW - 240, h = 660;
  g.save(); g.beginPath(); g.roundRect(x, y, w, h, 70); g.clip();
  const sh = h / w * CW; g.filter = 'brightness(1.9) contrast(1.15) saturate(0.8)'; g.drawImage(CP, 0, (CH - sh) / 2, CW, sh, x, y, w, h); g.filter = 'none';
  if (extra) extra(g, x, y, w, h);
  glitch(g, t, amt, x, y, w, h);
  const vg = g.createRadialGradient(x + w / 2, y + h / 2, h * 0.3, x + w / 2, y + h / 2, h * 0.85); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.65)'); g.fillStyle = vg; g.fillRect(x, y, w, h);
  g.font = '700 34px DejaVu Sans Mono, monospace'; g.fillStyle = '#7dff7d'; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('PLAY ▶', x + 40, y + 34);
  const s = Math.floor(t * 0.7 + 812); g.textAlign = 'right'; g.fillText(`0:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`, x + w - 40, y + 34);
  const gl = g.createLinearGradient(x, y, x + w, y + h); gl.addColorStop(0, 'rgba(255,255,255,.12)'); gl.addColorStop(0.35, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.fillRect(x, y, w, h);
  g.restore();
}
function fingers(g, x, y, w, h, k) { // lange, blasse Finger von unten ins Bild
  g.save(); g.translate(x + w * 0.3, y + h + 40 - k * 260); g.rotate(-0.15);
  for (let i = 0; i < 4; i++) { g.fillStyle = '#e8e4dc'; g.strokeStyle = '#1c1512'; g.lineWidth = 6; g.beginPath(); g.roundRect(i * 46, -40 - i * 12, 30, 380, 15); g.fill(); g.stroke(); }
  g.fillStyle = '#16161a'; g.fillRect(-30, 200, 230, 400); g.restore();
}

// ------------------------------------------------------------------ SHOTS
const PZ = 0; // Pfad laeuft entlang z
export const SHOTS = {
  forest_wide(W, p, t) { const F = W.F; base(F); kids(F, L(4, 6, p), 'back'); flash(F, 0, V(-0.4, 1.0, F.boy.position.z), V(-0.6, 0, F.boy.position.z + 12)); flash(F, 1, V(0.4, 1.0, F.mia.position.z), V(0.8, 0, F.mia.position.z + 12));
    look(F.cam, lerpV(V(6, 7, -10), V(4, 5.5, -6), ease(p)), V(0, 1, 8)); return { world: F, vig: 0.7 }; },
  walk(W, p, t, sh) { const F = W.F; base(F); const z = 10 + (t - sh.s) * 0.9; kids(F, z, 'back'); F.boy.position.y = Math.abs(Math.sin(t * 6)) * 0.02; F.mia.position.y = Math.abs(Math.sin(t * 6 + 1)) * 0.02;
    flash(F, 0, V(-0.4, 1.0, z + 0.2), V(-0.8, 0, z + 12)); flash(F, 1, V(0.4, 1.1, z + 0.3), V(0.6, 0.6, z + 12), 8);
    look(F.cam, V(0.2, 1.45, z - 3.2), V(0, 1.0, z + 6)); return { world: F, vig: 0.7 }; },
  vf_static(W, p, t) { const F = W.F; base(F); flash(F, 0, V(0, 1.2, 18), V(0, 0.5, 34)); fov(F.cam, 50);
    look(F.cam, V(Math.sin(t * 1.3) * 0.03, 1.3 + Math.sin(t * 2.1) * 0.02, 18), V(0.4, 1.4, 30)); return { world: F, vig: 0.4, post2d: g => viewfinder(g, t, L(0.05, 0.55, sm(0.3, 1, p))) }; },
  mia_face(W, p, t) { const F = W.F; base(F); F.mia.visible = true; setTex(F.mia, F.T.miaS); F.mia.position.set(0, 0, 18); F.camL.intensity = 2.2; F.camL.position.set(0.1, 0.85, 18.4);
    flash(F, 0, V(-0.8, 1.2, 17), V(0, 0.4, 30), 6); look(F.cam, lerpV(V(0, 1.05, 19.3), V(0, 1.02, 19.0), ease(p)), V(0, 0.95, 18)); return { world: F, vig: 0.75 }; },
  vf_man(W, p, t) { const F = W.F; base(F); F.slender.visible = true; F.slender.position.set(1.6, 0, 33); flash(F, 0, V(0, 1.2, 18), V(0.8, 0.8, 33), 10);
    look(F.cam, lerpV(V(0, 1.3, 18), V(0.05, 1.3, 19.5), ease(p)), V(1.3, 1.8, 33)); return { world: F, vig: 0.4, post2d: g => viewfinder(g, t, 0.35 + 0.1 * Math.sin(t * 7)) }; },
  real_empty(W, p, t) { const F = W.F; base(F); flash(F, 0, V(0, 1.2, 18), V(0.8, 0.8, 33), 10);
    look(F.cam, V(0, 1.45, 19.2), lerpV(V(1.3, 1.6, 33), V(1.3, 3.5, 33), ease(p))); return { world: F, vig: 0.65 }; },
  vf_closer(W, p, t) { const F = W.F; base(F); F.slender.visible = true; F.slender.position.set(0.9, 0, L(28, 25, p)); flash(F, 0, V(0, 1.2, 18), V(0.8, 0.8, 28), 12);
    look(F.cam, lerpV(V(0, 1.3, 19.5), V(0, 1.35, 20.5), ease(p)), V(0.8, 2.0, 27)); return { world: F, vig: 0.4, shake: 0.002, post2d: g => viewfinder(g, t, L(0.4, 0.8, p)) }; },
  kids_front(W, p, t) { const F = W.F; base(F); kids(F, 22, 'front', 0.8); flash(F, 0, V(-0.4, 1.0, 22.3), V(-0.5, 0, 26), 6); flash(F, 1, V(0.4, 0.9, 22.3), V(0.4, 0, 26), 6); F.camL.intensity = 1.2; F.camL.position.set(0.5, 0.8, 22.5);
    look(F.cam, lerpV(V(0, 1.2, 25.2), V(0, 1.15, 24.6), ease(p)), V(0, 0.95, 22)); return { world: F, vig: 0.65 }; },
  walk_slow(W, p, t, sh) { const F = W.F; base(F); const z = 30 + (t - sh.s) * 0.45; kids(F, z, 'back'); F.boy.position.y = Math.abs(Math.sin(t * 3)) * 0.02;
    flash(F, 0, V(-0.4, 1.0, z + 0.2), V(-0.6, 0, z + 8), 14); look(F.cam, V(0.3, 0.45, z - 1.6), V(0, 0.5, z + 3)); return { world: F, vig: 0.7 }; },
  vf_behind(W, p, t) { const F = W.F; base(F); F.slender.visible = true; F.slender.position.set(0.2, 0, L(27, 29.5, ease(p))); F.camL.intensity = 0;
    flash(F, 0, V(0, 1.3, 33), V(0, 0.8, 26), 10); look(F.cam, V(Math.sin(t * 9) * 0.02, 1.35, 33), V(0.1, 1.8, 26));
    return { world: F, vig: 0.4, shake: 0.003, post2d: g => viewfinder(g, t, L(0.4, 0.95, p)) }; },
  mia_runs(W, p, t, sh) { const F = W.F; base(F); const tr = sh.sfx.find(f => f.n === 'run'), go = tr ? clamp((t - tr.t) / 1.6) : 0;
    F.mia.visible = true; setTex(F.mia, F.T.miaB); F.mia.position.set(0.3 + go * 0.8, Math.abs(Math.sin(t * 14)) * 0.08 * (go > 0), 36 + go * 14);
    F.boy.visible = true; setTex(F.boy, F.T.boyB); F.boy.position.set(-0.45, 0, 34.6);
    flash(F, 0, V(-0.4, 1.0, 34.8), V(0.2 + go, 0.4, 40 + go * 10), 16); flash(F, 1, V(0.4 + go * 0.8, 1.1, 36.2 + go * 14), V(0.5 + go, 0, 46 + go * 14), go > 0 ? 6 : 12);
    look(F.cam, V(-0.9, 1.35, 32.6), V(0.2, 1.0, 40)); return { world: F, vig: 0.7, shake: tr && t > tr.t - 0.9 && t < tr.t - 0.6 ? 0.004 : 0 }; },
  alone(W, p, t) { const F = W.F; base(F); F.boy.visible = true; setTex(F.boy, F.T.boyS); F.boy.position.set(0, 0, 40);
    flash(F, 0, V(0.2, 1.0, 40.3), V(Math.sin(t * 0.8) * 3, 0.3, 50), 14); const a = L(-0.4, 0.4, ease(p));
    look(F.cam, V(Math.sin(a) * 2.6, 1.3, 40 + Math.cos(a) * 2.6), V(0, 0.95, 40)); return { world: F, vig: 0.8 }; },
  village(W, p, t, sh) { const F = W.F; base(F); F.boy.visible = true; setTex(F.boy, F.T.boyB); const z = 160 + 6 + (t - sh.s) * 0.8; F.boy.position.set(-0.6, Math.abs(Math.sin(t * 5)) * 0.02, z);
    look(F.cam, V(-0.2, 1.6, z - 4.5), V(-0.5, 1.2, z + 10)); return { world: F, vig: 0.65 }; },
  police(W, p, t) { const F = W.F; base(F, 'grey'); const on = Math.floor(t * 6) % 2; F.blue[0].intensity = on ? 30 : 0; F.blue[1].intensity = on ? 0 : 30; F.blueG[0].visible = !!on; F.blueG[1].visible = !on;
    F.searchers.forEach((m, i) => m.position.x = -3 + i * 1.6 + Math.sin(t * 0.7 + i) * 0.3);
    look(F.cam, lerpV(V(-22, 3, -72), V(-24, 2.6, -70), ease(p)), V(-30, 1.0, -55)); return { world: F, vig: 0.5 }; },
  doormat(W, p) { const F = W.F; base(F, 'dawn'); look(F.cam, lerpV(V(30.9, 0.95, 162.5), V(30.6, 0.7, 161.9), ease(p)), V(30.15, 0.3, 160.95)); return { world: F, vig: 0.55 }; },
  tv_run(W, p, t, sh) { const F = W.F; base(F); F.mia.visible = false; const fall = sm(0.62, 0.8, p); const z = 36 + p * 10;
    flash(F, 0, V(0, 1.2, z), V(0, 0.4, z + 10), 14); const cp = V(Math.sin(t * 15) * 0.08 * (1 - fall), L(1.3, 0.12, fall) + Math.abs(Math.sin(t * 13)) * 0.06 * (1 - fall), z);
    F.cam.position.copy(cp); F.cam.lookAt(V(0, L(1.0, 0.1, fall), z + 6)); F.cam.rotation.z += fall * 1.45;
    return { world: F, vig: 0.4, post2d: g => tvFrame(g, t, 0.25 + fall * 0.4) }; },
  tv_pickup(W, p, t) { const F = W.F; base(F); const up = ease(sm(0.25, 0.9, p)); const z = 46;
    flash(F, 0, V(0, 0.3, z), V(0, 0, z + 10), 8); F.cam.position.set(0, L(0.12, 2.6, up), z); F.cam.lookAt(V(0, L(0.1, 1.2, up), z + 6)); F.cam.rotation.z += (1 - up) * 1.45;
    return { world: F, vig: 0.4, post2d: g => tvFrame(g, t, 0.5 - up * 0.2, (g2, x, y, w, h) => fingers(g2, x, y, w, h, sm(0.15, 0.55, p) * (1 - sm(0.75, 1, p)))) }; },
  tv_follow(W, p, t, sh) { const F = W.F; base(F); F.boy.visible = true; setTex(F.boy, F.T.boyB); const z = 160 + 20 + (t - sh.s) * 0.8; F.boy.position.set(-0.6, Math.abs(Math.sin(t * 5)) * 0.02, z);
    look(F.cam, V(0.6 + Math.sin(t * 1.7) * 0.06, 2.4 + Math.sin(t * 2.3) * 0.04, z - 9), V(-0.6, 0.9, z)); return { world: F, vig: 0.4, post2d: g => tvFrame(g, t, 0.22) }; },
  tv_room(W, p, t, sh) { const F = W.F; base(F, 'room'); const st = sh.sfx.find(f => f.n === 'stinger'), after = st ? t - st.t : -1; const R = V(0, 0, -400);
    if (after < 0) { F.roomL.intensity = 7; F.bed.material.emissiveIntensity = 0.55; F.cornerS.visible = false;
      look(F.cam, V(2.2, 2.45, -400 + 2.2), V(-0.6, 0.4, -400 - 1.2)); return { world: F, vig: 0.4, tint: 0, post2d: g => tvFrame(g, t, 0.28 + 0.1 * Math.sin(t * 9)) }; }
    F.roomL.intensity = 3.5; F.roomL.color.set(0xff4030); F.cornerS.visible = true;
    look(F.cam, lerpV(V(0.3, 1.2, -400 + 0.2), V(0.6, 1.25, -400 + 0.6), clamp(after / 1.2)), V(2.0, 2.0, -400 + 2.0));
    return { world: F, vig: 0.85, tint: 0.55, shake: after < 0.5 ? 0.01 * (1 - after / 0.5) : 0, flash: after < 0.12 ? 1 - after / 0.12 : 0 }; },
};
for (const k of Object.keys(SHOTS)) { const f = SHOTS[k]; SHOTS[k] = (W, ...a) => { fov(W.F.cam, 50); W.F.roomL.color.set(0x7f95d0); return f(W, ...a); }; }
SHOTS._billboard = billboard; SHOTS._shake = shake;

// ------------------------------------------------------------------ 2D-Szenen
function camcorder(g, p, t) {
  const bg = g.createLinearGradient(0, 0, 0, CH); bg.addColorStop(0, '#0d1420'); bg.addColorStop(1, '#1d140c'); g.fillStyle = bg; g.fillRect(0, 0, CW, CH);
  for (let i = 0; i < 26; i++) { const x = (i * 211) % CW, y = (i * 389) % CH, r = 30 + (i % 5) * 18; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${200 + (i % 3) * 20},${110 + (i % 4) * 20},40,.35)`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  const s = L(1, 1.1, ease(p)); g.save(); g.translate(CW / 2, CH * 0.45); g.scale(s, s); g.rotate(-0.08);
  g.fillStyle = '#1e2024'; g.strokeStyle = '#000'; g.lineWidth = 8; g.beginPath(); g.roundRect(-330, -170, 660, 340, 50); g.fill(); g.stroke();
  g.fillStyle = '#2a2d33'; g.beginPath(); g.roundRect(-330, -170, 660, 60, [50, 50, 0, 0]); g.fill();
  g.fillStyle = '#0b0c0e'; g.beginPath(); g.arc(-170, 10, 135, 0, 7); g.fill(); g.fillStyle = '#16233a'; g.beginPath(); g.arc(-170, 10, 95, 0, 7); g.fill();
  const lg = g.createRadialGradient(-200, -20, 5, -170, 10, 95); lg.addColorStop(0, 'rgba(160,200,255,.8)'); lg.addColorStop(0.3, 'rgba(90,120,200,.3)'); lg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = lg; g.beginPath(); g.arc(-170, 10, 95, 0, 7); g.fill();
  g.fillStyle = '#c9ced6'; g.font = '800 30px Montserrat'; g.textAlign = 'left'; g.fillText('Mini DV', 40, -60); g.fillStyle = '#7a7f88'; g.font = '700 22px Montserrat'; g.fillText('DIGITAL HANDYCAM', 40, -20);
  const on = Math.floor(t * 1.6) % 2 === 0; const rg = g.createRadialGradient(240, 80, 1, 240, 80, on ? 60 : 20); rg.addColorStop(0, on ? '#ff6050' : '#802018'); rg.addColorStop(1, 'rgba(255,0,0,0)'); g.fillStyle = rg; g.beginPath(); g.arc(240, 80, 60, 0, 7); g.fill();
  g.fillStyle = on ? '#ff3020' : '#601010'; g.beginPath(); g.arc(240, 80, 14, 0, 7); g.fill();
  g.restore();
  g.fillStyle = 'rgba(14,14,18,.88)'; g.beginPath(); g.roundRect(CW / 2 - 200, 260, 400, 70, 35); g.fill(); g.fillStyle = '#fff'; g.font = '400 44px Anton'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('HERBST 2011', CW / 2, 297);
  return { vig: 0.6 };
}
let SL = null;
function redSlender(g, p, t) {
  if (!SL) SL = C.MONSTERS['SLENDER MAN']();
  const s = g.createLinearGradient(0, 0, 0, CH); s.addColorStop(0, '#3a0507'); s.addColorStop(0.55, '#a51f1a'); s.addColorStop(0.8, '#d24a2c'); s.addColorStop(1, '#260304'); g.fillStyle = s; g.fillRect(0, 0, CW, CH);
  g.fillStyle = '#3a0405'; for (let i = 0; i < 12; i++) { const x = i * 100 + 20; g.fillRect(x, 0, 18 + (i % 3) * 8, CH); }
  g.save(); g.strokeStyle = 'rgba(10,0,0,.85)'; g.lineCap = 'round';
  for (let k = 0; k < 8; k++) { const sx = CW / 2 + (k < 4 ? -40 : 40), sy = 760; g.lineWidth = 18 - k; g.beginPath(); g.moveTo(sx, sy); let x = sx, y = sy;
    for (let j = 1; j <= 12; j++) { const a = (k < 4 ? Math.PI : 0) + (k % 4 - 1.5) * 0.45 + Math.sin(t * 1.6 + k + j * 0.5) * 0.35; x += Math.cos(a) * 45; y += Math.sin(a) * 45 - 6; g.lineTo(x, y); } g.stroke(); }
  g.restore();
  const h = L(1700, 1900, ease(p)); g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 40; g.drawImage(SL, CW / 2 - h / 4, CH * 0.98 - h, h / 2, h); g.restore();
  return { vig: 0.75, tint: 0.15 };
}
export const TWO = { camcorder, red_slender: redSlender };
