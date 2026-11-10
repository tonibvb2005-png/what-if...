// Medieval fairy-tale kingdom "Mudbury": town square + castle, candle-lit throne room, rat farm barn.
import * as THREE from 'three';
import { toon, outline, box, hash, skyDome, cloudSprite, glowTexture, canvasTex } from '../world.js';

export const THRONE_X = -200, BARN_X = 200;
const INK = '#151012';

function tiled(t, rx, ry) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; }
function cobbleTex() {
  return canvasTex(512, 512, (c) => {
    c.fillStyle = '#6e665e'; c.fillRect(0, 0, 512, 512);
    for (let row = 0; row < 16; row++) for (let k = 0; k < 12; k++) {
      const x = k * 44 + (row % 2) * 22 + (hash(row, k) - 0.5) * 6, y = row * 32 + 16, v = 150 + hash(k, row) * 50;
      c.fillStyle = `rgb(${v},${v * 0.94 | 0},${v * 0.86 | 0})`; c.beginPath(); c.roundRect(x - 19, y - 13, 38, 26, 9); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.12)'; c.beginPath(); c.roundRect(x - 15, y - 11, 22, 8, 4); c.fill();
      c.fillStyle = 'rgba(0,0,0,0.18)'; c.beginPath(); c.roundRect(x - 17, y + 5, 34, 7, 4); c.fill();
    }
  });
}
function grassTex() { return canvasTex(512, 512, (c) => { c.fillStyle = '#6aa84a'; c.fillRect(0, 0, 512, 512); for (let i = 0; i < 4000; i++) { c.fillStyle = ['#5a983a', '#7ab85a', '#62a042', '#88c060'][i % 4]; c.fillRect(hash(i, 1) * 512, hash(i, 2) * 512, 2, 5); } }); }
function stoneTex(base = '#8a8378', rows = 8, cols = 4) {
  return canvasTex(512, 512, (c) => {
    c.fillStyle = '#4a443e'; c.fillRect(0, 0, 512, 512);
    const bh = 512 / rows, bw = 512 / cols;
    for (let r = 0; r < rows; r++) for (let k = -1; k < cols + 1; k++) {
      const x = k * bw + (r % 2) * bw / 2, v = 0.85 + hash(r, k) * 0.3;
      const col = new THREE.Color(base).multiplyScalar(v);
      c.fillStyle = '#' + col.getHexString(); c.fillRect(x + 3, r * bh + 3, bw - 6, bh - 6);
      c.fillStyle = 'rgba(255,255,255,0.10)'; c.fillRect(x + 3, r * bh + 3, bw - 6, 6);
    }
  });
}
function planks(base = '#8a5a32', vertical = true) {
  return canvasTex(256, 256, (c) => { c.fillStyle = base; c.fillRect(0, 0, 256, 256); for (let i = 0; i < 8; i++) { const v = hash(i, 7); c.fillStyle = v > 0.5 ? `rgba(255,230,190,${(v - 0.5) * 0.3})` : `rgba(30,15,5,${(0.5 - v) * 0.5})`; if (vertical) c.fillRect(i * 32, 0, 32, 256); else c.fillRect(0, i * 32, 256, 32); } c.strokeStyle = 'rgba(30,15,5,0.7)'; c.lineWidth = 3; for (let i = 0; i <= 8; i++) { c.beginPath(); if (vertical) { c.moveTo(i * 32, 0); c.lineTo(i * 32, 256); } else { c.moveTo(0, i * 32); c.lineTo(256, i * 32); } c.stroke(); } for (let i = 0; i < 30; i++) { c.fillStyle = 'rgba(30,15,5,0.5)'; c.beginPath(); c.arc(hash(i, 1) * 256, hash(i, 2) * 256, 2, 0, 7); c.fill(); } });
}
function prism(w, h, d) { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); return g; }

function timberTex(plaster, seed, floors = 2, w = 256, h = 320) {
  return canvasTex(w, h, (c) => {
    c.fillStyle = plaster; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(0,0,0,${hash(i, seed) * 0.05})`; c.fillRect(hash(i, 1 + seed) * w, hash(i, 2 + seed) * h, 6, 4); }
    const beam = '#4a2c18'; c.fillStyle = beam;
    c.fillRect(0, 0, w, 12); c.fillRect(0, h - 12, w, 12); c.fillRect(0, 0, 12, h); c.fillRect(w - 12, 0, 12, h);
    for (let f = 1; f < floors; f++) c.fillRect(0, f * h / floors - 6, w, 12);
    c.lineWidth = 10; c.strokeStyle = beam;
    for (let f = 0; f < floors; f++) { const y0 = f * h / floors, y1 = (f + 1) * h / floors; for (const xx of [w * 0.33, w * 0.66]) c.fillRect(xx - 5, y0, 10, y1 - y0); if ((f + seed) % 2) { c.beginPath(); c.moveTo(12, y1); c.lineTo(w * 0.33, y0); c.moveTo(w - 12, y1); c.lineTo(w * 0.66, y0); c.stroke(); } }
    for (let f = 0; f < floors; f++) {
      const y = f * h / floors + h / floors * 0.28, wh = h / floors * 0.44;
      for (const xx of [w * 0.165, w * 0.83]) {
        if (f === floors - 1 && xx > w / 2 && seed % 3 === 0) continue;
        c.fillStyle = '#2a3446'; c.fillRect(xx - 20, y, 40, wh);
        c.fillStyle = 'rgba(255,220,150,0.35)'; c.fillRect(xx - 20, y, 18, wh * 0.5);
        c.strokeStyle = beam; c.lineWidth = 6; c.strokeRect(xx - 20, y, 40, wh); c.beginPath(); c.moveTo(xx, y); c.lineTo(xx, y + wh); c.stroke();
        c.fillStyle = ['#c8302a', '#2a6ab0', '#3a8a3a'][(seed + f) % 3]; c.fillRect(xx - 28, y - 6, 8, wh + 12); c.fillRect(xx + 20, y - 6, 8, wh + 12);
        c.fillStyle = '#8a5a2a'; c.fillRect(xx - 24, y + wh, 48, 10);
        for (let k = 0; k < 4; k++) { c.fillStyle = ['#e84a6a', '#f2c23a', '#ffffff'][k % 3]; c.beginPath(); c.arc(xx - 16 + k * 11, y + wh - 2, 5, 0, 7); c.fill(); }
      }
    }
    // door on the ground floor
    c.fillStyle = '#5a3418'; c.beginPath(); c.roundRect(w / 2 - 26, h - 12 - h / floors * 0.62, 52, h / floors * 0.62, [26, 26, 0, 0]); c.fill(); c.strokeStyle = beam; c.lineWidth = 5; c.stroke();
  });
}
const roofTexCache = {};
function roofTex(col) {
  if (roofTexCache[col]) return roofTexCache[col];
  const t = canvasTex(256, 256, (c) => { c.fillStyle = col; c.fillRect(0, 0, 256, 256); for (let r = 0; r < 12; r++) for (let k = 0; k < 9; k++) { const x = k * 32 + (r % 2) * 16; c.fillStyle = `rgba(0,0,0,${0.1 + hash(r, k) * 0.15})`; c.beginPath(); c.arc(x, r * 22 + 22, 15, 0, Math.PI); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 2; c.stroke(); } });
  tiled(t, 2, 2); roofTexCache[col] = t; return t;
}
function house(w, d, floors, plaster, roof, seed) {
  const g = new THREE.Group(); const h = floors * 2.6;
  const front = toon(0xffffff, { map: timberTex(plaster, seed, floors) }), side = toon(0xffffff, { map: timberTex(plaster, seed + 1, floors) });
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, toon(plaster), toon(plaster), front, front]);
  body.position.y = h / 2; body.castShadow = body.receiveShadow = true; outline(body, 0.06); g.add(body);
  const rf = new THREE.Mesh(prism(w + 0.8, w * 0.55, d + 0.8), toon(0xffffff, { map: roofTex(roof) })); rf.position.y = h; rf.castShadow = true; outline(rf, 0.06); g.add(rf);
  if (seed % 2) { const ch = box(0.6, 1.4, 0.6, 0x8a5a4a, [w * 0.25, h + w * 0.4, 0], 0.03); g.add(ch); }
  return g;
}
function tree(x, z, s = 1, col = 0x4a9a3a) {
  const g = new THREE.Group(); const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * s, 0.26 * s, 1.6 * s, 8), toon(0x6a4422)); tr.position.y = 0.8 * s; g.add(tr);
  for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry((1.1 - k * 0.15) * s, 1), toon(new THREE.Color(col).offsetHSL(0, 0, k * 0.04 - 0.02), { flatShading: true })); b.position.set((hash(k, x) - 0.5) * 0.8 * s, (1.9 + k * 0.6) * s, (hash(z, k) - 0.5) * 0.8 * s); b.castShadow = true; outline(b, 0.04 * s); g.add(b); }
  g.position.set(x, 0, z); return g;
}
function flagTex(c1, c2) { return canvasTex(128, 96, (c) => { c.fillStyle = c1; c.beginPath(); c.moveTo(0, 0); c.lineTo(128, 0); c.lineTo(108, 48); c.lineTo(128, 96); c.lineTo(0, 96); c.fill(); c.fillStyle = c2; c.fillRect(0, 38, 110, 20); }); }
function castle() {
  const g = new THREE.Group();
  const hill = new THREE.Mesh(new THREE.SphereGeometry(40, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), toon(0xffffff, { map: tiled(grassTex(), 6, 3) })); hill.scale.set(1.4, 0.55, 1); hill.receiveShadow = true; outline(hill, 0.3); g.add(hill);
  const st = tiled(stoneTex('#d8d0c0', 6, 4), 6, 1); const stone = toon(0xffffff, { map: st });
  const top = 21.5;
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 7, 8, 1, true), stone); wall.material.side = THREE.DoubleSide; wall.position.y = top + 3.5; outline(wall, 0.15); g.add(wall);
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; g.add(box(2.2, 1.4, 1.2, 0xd8d0c0, [Math.cos(a) * 20, top + 7.6, Math.sin(a) * 20], 0.06)); g.children[g.children.length - 1].rotation.y = -a; }
  const roofs = [0x3a6ad8, 0xc8302a, 0x3a6ad8, 0xc8302a, 0x3a6ad8];
  const towers = [[-20, 0, 4.2, 18], [20, 0, 4.2, 18], [-12, -16, 3.8, 22], [12, -16, 3.8, 22], [0, -6, 6.5, 30], [-6, 14, 3.2, 14], [6, 14, 3.2, 14]];
  towers.forEach(([x, z, r, h], i) => {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.05, h, 20), toon(0xffffff, { map: tiled(stoneTex('#e8e0d0', 6, 4), 3, h / 6) })); t.position.set(x, top + h / 2, z); t.castShadow = true; outline(t, 0.12); g.add(t);
    const rf = new THREE.Mesh(new THREE.ConeGeometry(r * 1.3, r * 2.6, 20), toon(roofs[i % 5])); rf.position.set(x, top + h + r * 1.3, z); outline(rf, 0.12); g.add(rf);
    for (let k = 0; k < 3; k++) { const wnd = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.8), new THREE.MeshBasicMaterial({ color: 0x2a3040 })); const a = 0.3 + k * 0.6 - 0.6; wnd.position.set(x + Math.sin(a) * (r + 0.02), top + h * 0.55 + k * 1.5, z + Math.cos(a) * (r + 0.02)); wnd.rotation.y = a; g.add(wnd); }
    const pole = box(0.15, 4, 0.15, 0x5a3a1a, [x, top + h + r * 2.6 + 1.6, z], 0); g.add(pole);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), new THREE.MeshStandardMaterial({ map: flagTex(i % 2 ? '#c8302a' : '#f2c23a', i % 2 ? '#f2c23a' : '#c8302a'), side: THREE.DoubleSide })); fl.position.set(x + 1.5, top + h + r * 2.6 + 2.8, z); g.add(fl); g.userData.flags = (g.userData.flags || []).concat(fl);
  });
  const gate = box(6, 8, 1, 0x3a2414, [0, top + 4, 20.2], 0.06); g.add(gate);
  return g;
}

// ---------- 2D sprites ----------
function ratCanvas(frame) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 160; const x = c.getContext('2d');
  x.lineJoin = x.lineCap = 'round'; x.strokeStyle = INK;
  x.beginPath(); x.moveTo(40, 110); x.bezierCurveTo(0, 100 + (frame ? 20 : -10), 10, 50, 30, 40); x.lineWidth = 12; x.stroke(); x.lineWidth = 6; x.strokeStyle = '#e8a0a8'; x.stroke(); x.strokeStyle = INK;
  const legs = frame ? [[80, 150, 60], [110, 150, 128], [170, 150, 150], [190, 150, 206]] : [[90, 150, 92], [110, 150, 112], [170, 150, 172], [190, 150, 192]];
  for (const [lx, ly, fx] of legs) { x.beginPath(); x.moveTo(lx, 120); x.lineTo(fx, ly); x.lineWidth = 9; x.stroke(); }
  x.beginPath(); x.ellipse(130, 105, 80, 42, 0, 0, 7); x.fillStyle = '#8a8a96'; x.fill(); x.lineWidth = 9; x.stroke();
  x.fillStyle = 'rgba(0,0,0,0.12)'; x.beginPath(); x.ellipse(140, 125, 66, 18, 0, 0, 7); x.fill();
  x.beginPath(); x.moveTo(180, 80); x.quadraticCurveTo(250, 90, 246, 108); x.quadraticCurveTo(220, 128, 186, 126); x.closePath(); x.fillStyle = '#8a8a96'; x.fill(); x.lineWidth = 9; x.stroke();
  x.beginPath(); x.arc(186, 70, 20, 0, 7); x.fillStyle = '#c8a0a8'; x.fill(); x.stroke();
  x.fillStyle = '#ffffff'; x.beginPath(); x.arc(212, 92, 12, 0, 7); x.fill(); x.lineWidth = 5; x.stroke(); x.fillStyle = INK; x.beginPath(); x.arc(216, 93, 5, 0, 7); x.fill();
  x.fillStyle = '#e86a7a'; x.beginPath(); x.arc(246, 106, 7, 0, 7); x.fill();
  x.lineWidth = 3; for (const dy of [-6, 4]) { x.beginPath(); x.moveTo(236, 110 + dy); x.lineTo(256, 106 + dy * 2); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// instanced billboard rats: set(list of {x,y,z,dx,dz,s}) each frame
function ratField(parent, n, size = 0.55) {
  const tex = [ratCanvas(0), ratCanvas(1)];
  const geo = new THREE.PlaneGeometry(size * 1.6, size); geo.translate(0, size / 2 - size * 0.06, 0);
  const meshes = tex.map((t) => { const m = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }), n); m.count = 0; m.frustumCulled = false; m.castShadow = true; m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: 0.5 }); parent.add(m); return m; });
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3(), E = new THREE.Euler();
  const wp = new THREE.Vector3();
  return {
    meshes,
    set(list, camera, t) {
      const counts = [0, 0];
      parent.updateMatrixWorld(true);
      for (let i = 0; i < list.length && i < n * 2; i++) {
        const r = list[i]; const f = (Math.floor(t * 10 + i * 0.37) + i) % 2; if (counts[f] >= n) continue;
        wp.set(r.x, r.y || 0, r.z); parent.localToWorld(wp);
        const yaw = Math.atan2(camera.position.x - wp.x, camera.position.z - wp.z);
        const rx = Math.cos(yaw), rz = -Math.sin(yaw); // screen-right in world
        const flip = (r.dx || 0) * rx + (r.dz || 0) * rz < 0 ? -1 : 1;
        E.set(0, yaw, 0); Q.setFromEuler(E); P.set(r.x, (r.y || 0) + (r.hop || 0), r.z); const s = r.s || 1; S.set(flip * s, s, s);
        M.compose(P, Q, S); meshes[f].setMatrixAt(counts[f]++, M);
      }
      meshes.forEach((m, k) => { m.count = counts[k]; m.instanceMatrix.needsUpdate = true; });
    },
  };
}
function coinField(parent, n) {
  const m = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.13, 0.13, 0.035, 18), new THREE.MeshStandardMaterial({ color: 0xf2c23a, metalness: 0.85, roughness: 0.28, emissive: 0x3a2400 }), n);
  m.count = 0; m.castShadow = true; m.frustumCulled = false; parent.add(m);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1);
  return { mesh: m, set(list) { let k = 0; for (const c of list) { if (k >= n) break; E.set(c.rx || 0, c.ry || 0, c.rz || 0); Q.setFromEuler(E); P.set(c.x, c.y, c.z); S.setScalar(c.s || 1); M.compose(P, Q, S); m.setMatrixAt(k++, M); } m.count = k; m.instanceMatrix.needsUpdate = true; } };
}
// flip-counter sign: "RATS IN MUDBURY" + digits
function counterSign() {
  const cv = document.createElement('canvas'); cv.width = 640; cv.height = 420; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  let last = null;
  const draw = (n, flip) => {
    const key = n + ':' + Math.round(flip * 6); if (key === last) return; last = key;
    const x = cv.getContext('2d'); x.clearRect(0, 0, 640, 420);
    x.fillStyle = '#7a4a24'; x.beginPath(); x.roundRect(10, 10, 620, 400, 20); x.fill(); x.lineWidth = 14; x.strokeStyle = INK; x.stroke();
    x.fillStyle = 'rgba(255,230,190,0.12)'; for (let i = 0; i < 6; i++) x.fillRect(20, 30 + i * 64, 600, 26);
    x.fillStyle = '#c8302a'; x.beginPath(); x.roundRect(40, 36, 560, 110, 12); x.fill(); x.lineWidth = 10; x.stroke();
    x.fillStyle = '#ffffff'; x.font = '900 62px Montserrat, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('RATS IN TOWN', 320, 94);
    const s = n.toLocaleString('en-US'); const cw = 84, gap = 10; const tw = s.length * (cw + gap) - gap; let px = 320 - tw / 2;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i]; const digit = ch !== ',';
      const w = digit ? cw : 30;
      if (digit) { x.fillStyle = '#f8f4ec'; x.beginPath(); x.roundRect(px, 180, w, 190, 10); x.fill(); x.lineWidth = 9; x.strokeStyle = INK; x.stroke(); x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(px + 4, 275, w - 8, 4); }
      x.fillStyle = INK; x.font = '900 130px Montserrat, serif'; x.fillText(ch, px + w / 2, 282);
      if (digit && flip > 0 && flip < 1 && i >= s.length - 6) { const fy = 180 + 95 * (1 - Math.cos(flip * Math.PI)) ; x.fillStyle = '#e8e2d4'; const fh = Math.min(fy, 275) - 180; x.beginPath(); x.rect(px + 3, 183, w - 6, Math.max(0, fh)); x.fill(); x.strokeStyle = INK; x.lineWidth = 6; x.beginPath(); x.moveTo(px, 180 + fh); x.lineTo(px + w, 180 + fh); x.stroke(); }
      px += (digit ? cw : 30) + gap;
    }
    tex.needsUpdate = true;
  };
  draw(10000, 0);
  const g = new THREE.Group();
  for (const s of [-1, 1]) g.add(box(0.28, 4.4, 0.28, 0x5a3418, [s * 1.9, 2.2, -0.05], 0.03));
  const board = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.9), new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.5, roughness: 0.8 })); board.position.set(0, 3.0, 0.12); board.castShadow = true; g.add(board);
  const back = box(4.3, 2.8, 0.12, 0x5a3418, [0, 3.0, 0.02], 0.03); g.add(back);
  for (let k = 0; k < 9; k++) { const x = -1.6 + k * 0.4, z = 0.4 + (k % 2) * 0.3; g.add(box(0.04, 0.4, 0.04, 0x3a8a2a, [x, 0.2, z], 0)); const fl = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), toon([0xe84a6a, 0xf2c23a, 0xffffff][k % 3])); fl.position.set(x, 0.42, z); g.add(fl); }
  g.userData.draw = draw; return g;
}

export function buildKingdom() {
  const scene = new THREE.Scene();
  const sky = skyDome(0x3a86e8, 0xffe8c0, 0xffe8c0); scene.add(sky);
  const hemi = new THREE.HemisphereLight(0xe0f0ff, 0x6a8a4a, 0.65); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d8, 3.4); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 320 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  sun.userData.dir = new THREE.Vector3(0.55, 0.6, 0.5).normalize(); scene.add(sun, sun.target);
  const clouds = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; const cl = cloudSprite(i, 18 + hash(i, 9) * 14); cl.position.set(Math.cos(a) * 250, 55 + hash(i, 2) * 55, Math.sin(a) * 250); scene.add(cl); clouds.push(cl); }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), toon(0xffffff, { map: tiled(grassTex(), 140, 140), roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  // ===== TOWN SQUARE =====
  const town = new THREE.Group(); scene.add(town);
  const sq = new THREE.Mesh(new THREE.CircleGeometry(22, 48), toon(0xffffff, { map: tiled(cobbleTex(), 9, 9), roughness: 0.95 })); sq.rotation.x = -Math.PI / 2; sq.position.y = 0.02; sq.receiveShadow = true; town.add(sq);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(6, 70), toon(0xffffff, { map: tiled(cobbleTex(), 1.5, 16), roughness: 0.95 })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.015, -50); road.receiveShadow = true; town.add(road);
  const plasters = ['#f2e6cc', '#f0d8b0', '#e8d0c8', '#f4ecd8', '#dce4c8', '#f0c8a8'];
  const roofsC = ['#b8482a', '#8a4a3a', '#3a5a8a', '#a8582a', '#6a3a2a'];
  let seed = 0;
  const placeHouse = (x, z, ry, w = 5, d = 5, fl = 2) => { const h = house(w, d, fl, plasters[seed % 6], roofsC[seed % 5], seed); seed++; h.position.set(x, 0, z); h.rotation.y = ry; town.add(h); return h; };
  for (let i = 0; i < 5; i++) placeHouse(-15, 10 - i * 6.2, Math.PI / 2, 6, 5.6, 2 + (i % 2));
  for (let i = 0; i < 5; i++) placeHouse(15, 10 - i * 6.2, -Math.PI / 2, 6, 5.6, 2 + ((i + 1) % 2));
  for (const x of [-10, -5]) placeHouse(x, -20, 0, 5, 5, 2 + (x === -5 ? 1 : 0));
  for (const x of [5, 10]) placeHouse(x, -20, 0, 5, 5, 2 + (x === 10 ? 1 : 0));
  for (const x of [-10, -4, 4, 10]) placeHouse(x, 22, Math.PI, 5.5, 5, 2);
  // well in the middle
  const well = new THREE.Group(); const wst = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.4, 1.0, 20), toon(0xffffff, { map: tiled(stoneTex('#a8a090', 3, 8), 3, 1) })); wst.position.y = 0.5; wst.castShadow = true; outline(wst, 0.05); well.add(wst);
  for (const s of [-1, 1]) well.add(box(0.18, 2.4, 0.18, 0x5a3418, [s * 1.1, 1.6, 0], 0.02)); const wr = new THREE.Mesh(prism(3.0, 1.0, 2.0), toon(0xffffff, { map: roofTex('#b8482a') })); wr.position.y = 2.7; outline(wr, 0.04); well.add(wr);
  well.position.set(4.5, 0, -8); town.add(well);
  // market stalls with striped awnings
  const stall = (x, z, ry, c1, c2) => { const g = new THREE.Group(); g.add(box(3, 1, 1.4, 0x8a5a32, [0, 0.5, 0], 0.03)); for (const s of [-1, 1]) for (const t of [-1, 1]) g.add(box(0.12, 2.6, 0.12, 0x5a3418, [s * 1.4, 1.3, t * 0.6], 0.01)); const aw = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.1, 1.9), toon(0xffffff, { map: canvasTex(128, 64, (c) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? c1 : c2; c.fillRect(i * 16, 0, 16, 64); } }) })); aw.position.set(0, 2.7, 0.1); aw.rotation.x = 0.15; outline(aw, 0.03); g.add(aw); for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), toon([0xe84a3a, 0xf2a23a, 0x8ac83a, 0xf2d23a][i % 4])); f.position.set(-1 + i * 0.5, 1.15, 0.2); g.add(f); } g.position.set(x, 0, z); g.rotation.y = ry; town.add(g); };
  stall(-9.5, -4, Math.PI / 2, '#c8302a', '#f8f4ec'); stall(-9.5, 3, Math.PI / 2, '#2a6ab0', '#f8f4ec'); stall(9.5, 4, -Math.PI / 2, '#3a8a3a', '#f8f4ec');
  for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 1.0, 12), toon(0x8a5a2a)); b.position.set([-11, -11.6, 11.4, 11, -6, 7, 12][i], 0.5, [-9, -8, -10, -1, -15, -15, 9][i]); b.castShadow = true; outline(b, 0.03); town.add(b); }
  // herald podium
  const podium = new THREE.Group(); podium.add(box(3, 1.0, 2.2, 0x7a4a24, [0, 0.5, 0], 0.04)); for (let i = 0; i < 3; i++) podium.add(box(0.8, 0.25, 0.5, 0x6a3a1a, [0, 0.125 + i * 0.0, 1.3 + i * 0], 0.02));
  const drape = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.9), new THREE.MeshStandardMaterial({ map: canvasTex(256, 80, (c) => { c.fillStyle = '#c8302a'; c.fillRect(0, 0, 256, 80); c.fillStyle = '#f2c23a'; for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(i * 32, 80); c.lineTo(i * 32 + 16, 56); c.lineTo(i * 32 + 32, 80); c.fill(); } c.fillRect(0, 0, 256, 8); }) })); drape.position.set(0, 0.55, 1.11); podium.add(drape);
  podium.position.set(-3, 0, -11); town.add(podium);
  // counter sign
  const sign = counterSign(); sign.position.set(-5.5, 0, -1); sign.rotation.y = 0.35; town.add(sign);
  // banners on poles around the square
  for (const [x, z, c1, c2] of [[-7, -16, '#c8302a', '#f2c23a'], [7, -16, '#2a6ab0', '#f2c23a'], [-12.5, 14, '#c8302a', '#f2c23a'], [12.5, 14, '#2a6ab0', '#f2c23a']]) { town.add(box(0.16, 6, 0.16, 0x5a3418, [x, 3, z], 0.02)); const b = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.6), new THREE.MeshStandardMaterial({ map: canvasTex(64, 128, (c) => { c.fillStyle = c1; c.beginPath(); c.moveTo(0, 0); c.lineTo(64, 0); c.lineTo(64, 128); c.lineTo(32, 104); c.lineTo(0, 128); c.fill(); c.fillStyle = c2; c.beginPath(); c.arc(32, 50, 16, 0, 7); c.fill(); }), side: THREE.DoubleSide, transparent: true, alphaTest: 0.5 })); b.position.set(x + 0.8, 4.4, z); town.add(b); }
  // castle + countryside
  const cst = castle(); cst.position.set(0, -2, -125); scene.add(cst);
  for (let i = 0; i < 40; i++) { const a = hash(i, 3) * Math.PI * 2, r = 40 + hash(i, 4) * 120; const x = Math.cos(a) * r, z = Math.sin(a) * r; if (Math.abs(x) < 26 && z > -95 && z < 30) continue; if (Math.abs(x) < 8) continue; scene.add(tree(x, z, 1.6 + hash(i, 5) * 1.6)); }
  for (const [x, z, s] of [[-17.5, -15, 1.2], [18, -16, 1.4], [-19, 18, 1.1], [19, 20, 1.3]]) town.add(tree(x, z, s, 0x5aa83a));
  for (const [x, z, w, h] of [[-160, -240, 90, 40], [120, -260, 110, 50], [-40, -300, 120, 60], [220, -180, 80, 35]]) { const hl = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon(0x7aa85a)); hl.scale.set(w, h, w * 0.6); hl.position.set(x, -1, z); scene.add(hl); }
  const rats = ratField(town, 420, 0.55);
  const coins = coinField(town, 160);
  // a pile of rat tails at the treasurer's table
  const table = new THREE.Group(); table.add(box(3, 0.12, 1.4, 0x7a4a24, [0, 1.0, 0], 0.03)); for (const s of [-1, 1]) for (const t of [-1, 1]) table.add(box(0.12, 1.0, 0.12, 0x5a3418, [s * 1.35, 0.5, t * 0.6], 0.01));
  const cloth = box(3.1, 0.02, 1.5, 0xc8302a, [0, 1.07, 0], 0); table.add(cloth); table.position.set(6, 0, -3); table.rotation.y = -0.4; town.add(table);
  const tailTex = canvasTex(256, 128, (c) => { c.lineCap = 'round'; for (let i = 0; i < 14; i++) { c.beginPath(); const x0 = 20 + hash(i, 1) * 200, y0 = 30 + hash(i, 2) * 70; c.moveTo(x0, y0); c.bezierCurveTo(x0 + 30, y0 - 30, x0 + 40, y0 + 30, x0 + 70 * (hash(i, 3) > 0.5 ? 1 : -1), y0 + 10); c.lineWidth = 10; c.strokeStyle = INK; c.stroke(); c.lineWidth = 5; c.strokeStyle = '#e8a0a8'; c.stroke(); } });
  const tails = []; for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), new THREE.MeshBasicMaterial({ map: tailTex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.rotation.z = hash(i, 9) * 6; m.position.set((hash(i, 1) - 0.5) * 2.2, 1.09 + i * 0.012, (hash(i, 2) - 0.5) * 0.9); m.visible = false; table.add(m); tails.push(m); }

  // ===== THRONE ROOM =====
  const throne = new THREE.Group(); throne.position.x = THRONE_X; scene.add(throne);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(18, 28), toon(0xffffff, { map: tiled(stoneTex('#9a8a78', 6, 6), 4, 6), roughness: 0.6 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; throne.add(fl);
  const wallM = toon(0xffffff, { map: tiled(stoneTex('#8a7a6a', 8, 4), 4, 2), roughness: 0.9 });
  for (const [w, h, d, x, y, z] of [[18, 12, 0.4, 0, 6, -12], [0.4, 12, 28, -9, 6, 0], [0.4, 12, 28, 9, 6, 0], [18, 0.4, 28, 0, 12, 0], [18, 12, 0.4, 0, 6, 14]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallM); m.position.set(x, y, z); m.receiveShadow = true; throne.add(m); }
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 22), toon(0xffffff, { map: canvasTex(64, 256, (c) => { c.fillStyle = '#a8182a'; c.fillRect(0, 0, 64, 256); c.fillStyle = '#f2c23a'; c.fillRect(4, 0, 4, 256); c.fillRect(56, 0, 4, 256); }) })); carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, 0.02, 1); carpet.receiveShadow = true; throne.add(carpet);
  const dais = box(7, 0.6, 4, 0x8a7a6a, [0, 0.3, -9.5], 0.04); throne.add(dais); throne.add(box(6, 0.3, 1, 0x7a6a5a, [0, 0.15, -7.2], 0.03));
  const seat = new THREE.Group(); seat.add(box(2.4, 1.0, 1.6, 0xc8a03a, [0, 1.1, 0], 0.04)); seat.add(box(2.4, 4.2, 0.4, 0xc8a03a, [0, 2.7, -0.7], 0.04)); seat.add(box(1.8, 3.4, 0.1, 0xa8182a, [0, 2.7, -0.48], 0.02)); for (const s of [-1, 1]) { seat.add(box(0.3, 1.1, 1.6, 0xc8a03a, [s * 1.2, 1.9, 0], 0.03)); const k = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), new THREE.MeshStandardMaterial({ color: 0xf2c23a, metalness: 0.8, roughness: 0.3 })); k.position.set(s * 1.2, 4.9, -0.7); seat.add(k); }
  seat.children.forEach((c) => { if (c.material && c.material.color && c.material.color.getHex() === 0xc8a03a) { c.material = new THREE.MeshStandardMaterial({ color: 0xd8aa3a, metalness: 0.7, roughness: 0.35 }); } });
  seat.position.set(0, 0.6, -9.8); throne.add(seat);
  const banners = []; for (const x of [-6, -3.4, 3.4, 6]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 6), new THREE.MeshStandardMaterial({ map: canvasTex(64, 220, (c) => { c.fillStyle = x < 0 ? '#a8182a' : '#2a4aa8'; c.beginPath(); c.moveTo(0, 0); c.lineTo(64, 0); c.lineTo(64, 220); c.lineTo(32, 196); c.lineTo(0, 220); c.fill(); c.fillStyle = '#f2c23a'; c.fillRect(0, 0, 64, 10); c.beginPath(); c.moveTo(32, 70); c.lineTo(48, 100); c.lineTo(32, 130); c.lineTo(16, 100); c.fill(); }), transparent: true, alphaTest: 0.5 })); b.position.set(x, 7, -11.75); throne.add(b); banners.push(b); }
  const winMat = new THREE.MeshBasicMaterial({ map: canvasTex(128, 256, (c) => { const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#bfe4ff'); g.addColorStop(1, '#ffe8b8'); c.fillStyle = g; c.fillRect(0, 0, 128, 256); c.strokeStyle = '#2a2018'; c.lineWidth = 10; c.strokeRect(5, 5, 118, 246); c.beginPath(); c.moveTo(64, 0); c.lineTo(64, 256); c.moveTo(0, 128); c.lineTo(128, 128); c.stroke(); }) });
  for (const z of [-6, 0, 6]) for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3.6), winMat); w.position.set(s * 8.78, 6.5, z); w.rotation.y = -s * Math.PI / 2; throne.add(w); }
  const flameTex = glowTexture('rgba(255,230,160,1)', 'rgba(255,140,40,0)');
  const flames = [];
  const candle = (x, z, h = 2.2) => { const g = new THREE.Group(); g.add(box(0.12, h, 0.12, 0x3a2a1a, [0, h / 2, 0], 0.01)); g.add(box(0.7, 0.08, 0.7, 0x3a2a1a, [0, h, 0], 0.01)); for (const dx of [-0.22, 0, 0.22]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 8), toon(0xf6ecd8)); c.position.set(dx, h + 0.24, 0); g.add(c); const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, blending: THREE.AdditiveBlending, depthWrite: false })); f.position.set(dx, h + 0.55, 0); f.scale.setScalar(0.45); g.add(f); flames.push(f); } g.position.set(x, 0, z); throne.add(g); return g; };
  for (const [x, z] of [[-4.2, -8], [4.2, -8], [-4.2, -2], [4.2, -2], [-4.2, 4], [4.2, 4]]) candle(x, z);
  const tLights = []; for (const [x, y, z, i] of [[-4, 3.2, -7, 16], [4, 3.2, -7, 16], [0, 4, -2, 10], [0, 5, 6, 8]]) { const l = new THREE.PointLight(0xffb060, i, 14, 1.3); l.position.set(x, y, z); throne.add(l); tLights.push(l); }
  const winLight = new THREE.SpotLight(0xdff0ff, 50, 30, 0.6, 0.7, 1.1); winLight.position.set(8, 9, 2); winLight.target.position.set(-2, 0, -6); winLight.castShadow = true; winLight.shadow.mapSize.set(1024, 1024); throne.add(winLight, winLight.target);
  // treasure chest with gold
  const chest = new THREE.Group(); chest.add(box(2.0, 1.0, 1.2, 0x7a4a24, [0, 0.5, 0], 0.04)); chest.add(box(2.1, 0.12, 1.3, 0xc8a03a, [0, 0.95, 0], 0.02)); for (const x of [-0.8, 0.8]) chest.add(box(0.12, 1.02, 1.25, 0xc8a03a, [x, 0.5, 0], 0.01));
  const lid = new THREE.Group(); lid.add(box(2.0, 0.6, 1.2, 0x7a4a24, [0, 0.3, 0.6], 0.04)); lid.position.set(0, 1.0, -0.6); lid.rotation.x = -1.9; chest.add(lid);
  chest.position.set(4.8, 0, -4.5); chest.rotation.y = -0.5; throne.add(chest);
  const tCoins = coinField(chest, 260);
  const tRats = ratField(throne, 160, 0.5);

  // ===== RAT FARM BARN =====
  const barn = new THREE.Group(); barn.position.x = BARN_X; scene.add(barn);
  const strawT = canvasTex(256, 256, (c) => { c.fillStyle = '#c8a05a'; c.fillRect(0, 0, 256, 256); for (let i = 0; i < 1600; i++) { c.strokeStyle = ['#e8c47a', '#b8904a', '#d8b06a'][i % 3]; c.lineWidth = 2; c.beginPath(); const x = hash(i, 1) * 256, y = hash(i, 2) * 256, a = hash(i, 3) * 6; c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14); c.stroke(); } });
  const bf = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), toon(0xb8a890, { map: tiled(strawT, 5, 5) })); bf.rotation.x = -Math.PI / 2; bf.position.y = 0.01; bf.receiveShadow = true; barn.add(bf);
  const bw = toon(0xffffff, { map: tiled(planks('#7a4a2a'), 6, 2), roughness: 0.95 });
  for (const [w, h, d, x, y, z] of [[16, 7, 0.3, 0, 3.5, -6], [0.3, 7, 16, -7, 3.5, 0], [0.3, 7, 16, 7, 3.5, 0], [16, 0.3, 16, 0, 7, 0]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bw); m.position.set(x, y, z); m.receiveShadow = true; barn.add(m); }
  for (let i = -3; i <= 3; i++) barn.add(box(0.3, 0.4, 16, 0x4a2a14, [i * 2.2, 6.6, 0], 0.02));
  // front wall with a door opening (daylight behind)
  for (const [w, x] of [[5.5, -4.25], [5.5, 4.25]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 7, 0.3), bw); m.position.set(x, 3.5, 6); barn.add(m); }
  barn.add(box(3, 2.6, 0.3, 0x7a4a2a, [0, 5.7, 6], 0.02));
  const daylight = new THREE.Mesh(new THREE.PlaneGeometry(3, 4.4), new THREE.MeshBasicMaterial({ map: canvasTex(64, 96, (c) => { const g = c.createLinearGradient(0, 0, 0, 96); g.addColorStop(0, '#7ab8e8'); g.addColorStop(0.55, '#c8e0f0'); g.addColorStop(0.62, '#6a9a4a'); g.addColorStop(1, '#4a7a32'); c.fillStyle = g; c.fillRect(0, 0, 64, 96); c.fillStyle = '#e8e0d0'; c.fillRect(8, 40, 18, 18); c.fillStyle = '#b8482a'; c.beginPath(); c.moveTo(4, 40); c.lineTo(17, 30); c.lineTo(30, 40); c.fill(); }) })); daylight.position.set(0, 2.2, 6.5); daylight.rotation.y = Math.PI; barn.add(daylight);
  const doorLight = new THREE.SpotLight(0xfff0d8, 25, 16, 0.55, 0.8, 1.2); doorLight.position.set(0, 3.5, 6.4); doorLight.target.position.set(0, 0, 0); barn.add(doorLight, doorLight.target);
  // cages along the back wall
  const cageTex = canvasTex(128, 128, (c) => { c.clearRect(0, 0, 128, 128); c.strokeStyle = '#2a2018'; c.lineWidth = 6; c.strokeRect(3, 3, 122, 122); c.lineWidth = 4; for (let x = 16; x < 128; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 128); c.stroke(); } });
  const cageMat = new THREE.MeshStandardMaterial({ map: cageTex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.3 });
  const cages = [], cageDoors = [];
  for (let row = 0; row < 3; row++) for (let k = 0; k < 6; k++) {
    const x = -5 + k * 2, y = row * 1.6, z = -5;
    const g = new THREE.Group(); const shelf = box(1.9, 0.1, 1.6, 0x6a3a1a, [0, 0, 0], 0.01); g.add(shelf);
    const cgBox = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 1.5), cageMat); cgBox.position.y = 0.75; g.add(cgBox);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.4), cageMat); door.geometry.translate(0.9, 0, 0); door.position.set(-0.9, 0.75, 0.77); g.add(door); cageDoors.push(door);
    g.position.set(x, 0.2 + y, z); barn.add(g); cages.push(g);
  }
  for (const [x, z] of [[-5.6, -2], [5.4, -1.5], [-4, 3.4]]) { const h = box(1.8, 1.0, 1.2, 0xd8b05a, [x, 0.5, z], 0.03); barn.add(h); }
  const lanternLights = []; for (const [x, z] of [[-3, -2.5], [3, -2.5], [0, 2]]) { const l = new THREE.PointLight(0xffa850, 9, 11, 1.3); l.position.set(x, 4.6, z); barn.add(l); lanternLights.push(l); const lb = box(0.3, 0.45, 0.3, 0x2a2018, [x, 4.6, z], 0.01); barn.add(lb); const fs = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, blending: THREE.AdditiveBlending, depthWrite: false })); fs.position.set(x, 4.6, z + 0.2); fs.scale.setScalar(0.9); barn.add(fs); barn.add(box(0.03, 1.8, 0.03, 0x2a2018, [x, 5.7, z], 0)); }
  const cheeseM = toon(0xf6c63a);
  const cheeses = []; for (let i = 0; i < 10; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 3, 1, false, 0, Math.PI * 2), cheeseM); outline(c, 0.02); c.visible = false; barn.add(c); cheeses.push(c); }
  for (let i = 0; i < 4; i++) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.4, 24), cheeseM); w.position.set(4.6 + (i % 2) * 0.3, 0.2 + Math.floor(i / 2) * 0.42, 2.5 + (i % 2) * 0.9); outline(w, 0.03); barn.add(w); }
  const bRats = ratField(barn, 300, 0.5);
  for (const [x, y] of [[-3, 2.6], [3, 2.6]]) { const l = new THREE.PointLight(0xffc070, 8, 6, 1.4); l.position.set(x, y, -3.2); barn.add(l); }

  return { scene, ground, sky, hemi, sun, clouds, town, sign, rats, coins, tails, table, podium, well, castle: cst, throne, tLights, flames, banners, chest, tCoins, tRats, barn, cages, cageDoors, cheeses, bRats, lanternLights };
}
export { ratCanvas };
