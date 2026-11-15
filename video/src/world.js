// 3D-Welten (Low-Poly) + Szenen-Setups pro Shot
import * as THREE from 'three';
import * as C from './chars.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const L = (a, b, t) => a + (b - a) * t;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const lerpV = (a, b, t) => a.clone().lerp(b, t);
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

function tex(canvas) { const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t; }
function lam(color, o = {}) { return new THREE.MeshLambertMaterial({ color, flatShading: true, ...o }); }
function box(w, h, d, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m; }
function jitter(geo, a) { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + (rnd() - .5) * a, p.getY(i) + (rnd() - .5) * a, p.getZ(i) + (rnd() - .5) * a); geo.computeVertexNormals(); return geo; }

// Sprite (flache Figur) – Ursprung unten Mitte, dreht sich zur Kamera
const sprites = [];
function sprite(canvas, h, emissive = 0.38) {
  const t = tex(canvas), w = h * canvas.width / canvas.height;
  const g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2, 0);
  const m = new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.04, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: emissive });
  const s = new THREE.Mesh(g, m); s.castShadow = true; s.userData.bb = true; sprites.push(s);
  const blob = new THREE.Mesh(new THREE.CircleGeometry(w * 0.42, 24), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.32, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.scale.set(1, 0.45, 1); blob.position.y = 0.006; s.add(blob); blob.userData.blob = true;
  return s;
}
function setTex(s, canvas) { s.material.map = s.material.emissiveMap = tex(canvas); s.material.needsUpdate = true; }
function glowTex(r = 255, g = 190, b = 110) {
  const c = C.cv(256, 256), x = c.getContext('2d'), gr = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, `rgba(${r},${g},${b},.9)`); gr.addColorStop(0.25, `rgba(${r},${g},${b},.35)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = gr; x.fillRect(0, 0, 256, 256); return tex(c);
}
function glow(size, col) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(...col), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.scale.set(size, size, 1); return s; }
function gradTex(stops) { const c = C.cv(4, 512), x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 512); stops.forEach(([o, col]) => g.addColorStop(o, col)); x.fillStyle = g; x.fillRect(0, 0, 4, 512); return tex(c); }

// ================================================================= AUSSEN
function buildExt() {
  const S = new THREE.Scene();
  S.background = gradTex([[0, '#d98b6a'], [0.45, '#efb27c'], [0.7, '#f4cf98'], [1, '#f6dcaa']]);
  S.fog = new THREE.Fog(0xf0c08e, 22, 95);
  const hemi = new THREE.HemisphereLight(0xffe2b8, 0x5a4a3a, 1.1); S.add(hemi);
  const sun = new THREE.DirectionalLight(0xffcf96, 2.4); sun.position.set(-14, 16, 10); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 70 }); sun.shadow.bias = -0.0008;
  S.add(sun, sun.target);
  // Boden
  const gg = new THREE.PlaneGeometry(240, 240, 70, 70); gg.rotateX(-Math.PI / 2);
  const pos = gg.attributes.position, col = [];
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i), d = Math.hypot(x, z); if (d > 18) pos.setY(i, (rnd() - .3) * Math.min(3, (d - 18) * 0.08)); const k = 0.85 + rnd() * 0.25; col.push(0.42 * k, 0.55 * k, 0.26 * k); }
  gg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); gg.computeVertexNormals();
  const ground = new THREE.Mesh(gg, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })); ground.receiveShadow = true; S.add(ground);
  // Reisfelder
  const rc = C.cv(256, 256), rx = rc.getContext('2d'); rx.fillStyle = '#7fa24a'; rx.fillRect(0, 0, 256, 256); rx.fillStyle = '#6b8f3c'; for (let y = 0; y < 256; y += 16) rx.fillRect(0, y, 256, 7);
  const rt = tex(rc); rt.wrapS = rt.wrapT = THREE.RepeatWrapping; rt.repeat.set(6, 6);
  for (const [x, z] of [[-26, 14], [26, 16], [-28, -18], [30, -22]]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(30, 22), new THREE.MeshLambertMaterial({ map: rt })); f.rotation.x = -Math.PI / 2; f.position.set(x, 0.03, z); f.receiveShadow = true; S.add(f); }
  // Kiesweg
  const path = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 11), lam(0xcdb994)); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.02, 0.6); path.receiveShadow = true; S.add(path);
  // Haus
  const H = new THREE.Group(); H.position.set(0, 0, -8); S.add(H);
  const plaster = lam(0xe9dcc2), wood = lam(0x5e3f28), dark = lam(0x2f333d);
  H.add(box(11, 0.5, 7, lam(0x8b7b66), 0, 0.25, 0));
  const walls = box(10, 2.6, 6, plaster, 0, 1.8, 0); walls.castShadow = walls.receiveShadow = true; H.add(walls);
  for (const x of [-5, -2.5, 0, 2.5, 5]) { const p = box(0.22, 2.7, 0.22, wood, x, 1.85, 3.02); p.castShadow = true; H.add(p); }
  H.add(box(10.4, 0.2, 0.25, wood, 0, 3.05, 3.02));
  const pmat = new THREE.MeshBasicMaterial({ color: 0xfff1d2 });
  for (const x of [-3.75, -1.25, 1.25, 3.75]) { H.add(box(1.9, 1.7, 0.05, pmat, x, 1.75, 3.0)); for (const xx of [-0.5, 0, 0.5]) H.add(box(0.05, 1.7, 0.08, wood, x + xx, 1.75, 3.03)); for (const yy of [1.2, 1.75, 2.3]) H.add(box(1.9, 0.05, 0.08, wood, x, yy, 3.03)); }
  H.add(box(11, 0.35, 1.3, lam(0x7a5636), 0, 0.42, 3.7));
  const rs = new THREE.Shape(); rs.moveTo(-4.4, 0); rs.lineTo(4.4, 0); rs.lineTo(0, 2.3); rs.closePath();
  const rg = new THREE.ExtrudeGeometry(rs, { depth: 12.4, bevelEnabled: false }); rg.translate(0, 0, -6.2); rg.rotateY(Math.PI / 2);
  const roof = new THREE.Mesh(rg, dark); roof.position.y = 3.1; roof.castShadow = true; H.add(roof);
  // Hecke
  // Kern + viele Blattbueschel mit Farbverlauf (unten schattig, oben sonnig)
  const hedge = new THREE.Group(); S.add(hedge);
  const core = box(18.4, 1.9, 0.75, lam(0x2a4a24), 0, 0.95, 6.9); core.receiveShadow = true; hedge.add(core);
  const greens = [[0.25, 0.42, 0.18], [0.30, 0.50, 0.20], [0.36, 0.56, 0.22], [0.22, 0.38, 0.17], [0.42, 0.60, 0.24]];
  const parts = [];
  const clump = (x, y, z, r) => {
    const ico = new THREE.IcosahedronGeometry(r, 2); ico.deleteAttribute('normal'); ico.deleteAttribute('uv');
    const g = jitter(mergeVertices(ico), r * 0.07).toNonIndexed();
    g.scale(1, 0.85, 0.9); g.translate(x, y, z);
    const base = greens[Math.floor(rnd() * greens.length)], v = 0.92 + rnd() * 0.16;
    const n = g.attributes.position.count, col = new Float32Array(n * 3), P = g.attributes.position;
    for (let i = 0; i < n; i++) { const h = Math.min(1, Math.max(0, P.getY(i) / 2.2)), k = (0.55 + 0.55 * h) * v, warm = h * h * 0.07;
      col[i * 3] = (base[0] + warm) * k; col[i * 3 + 1] = (base[1] + warm * 0.5) * k; col[i * 3 + 2] = base[2] * k; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); parts.push(g);
  };
  for (let x = -9.2; x <= 9.2; x += 0.5) {
    for (let y = 0.3; y <= 1.7; y += 0.46) { clump(x + (rnd() - .5) * 0.2, y + (rnd() - .5) * 0.1, 6.55 + (rnd() - .5) * 0.08, 0.34 + rnd() * 0.08); clump(x + (rnd() - .5) * 0.2, y, 7.25, 0.34 + rnd() * 0.08); }
    for (const z of [6.62, 7.18]) clump(x + (rnd() - .5) * 0.2, 1.82 + (rnd() - .5) * 0.08, z, 0.36 + rnd() * 0.06);
  }
  const hedgeMesh = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: false }));
  hedgeMesh.castShadow = hedgeMesh.receiveShadow = true; hedge.add(hedgeMesh);
  // Graskante vor der Hecke
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(18.4, 0.5), lam(0x2c4a22)); strip.rotation.x = -Math.PI / 2; strip.position.set(0, 0.015, 6.35); hedge.add(strip);
  // Bäume & Berge
  const tm = [lam(0x2f5a2c), lam(0x3a6b30), lam(0x4b7a36), lam(0x9a6a2e)];
  const tree = (x, z, s) => { const g = new THREE.Group(); g.add(box(0.3 * s, 1.2 * s, 0.3 * s, lam(0x5a3b25), 0, 0.6 * s, 0)); for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry((1.5 - k * .35) * s, 1.6 * s, 6), tm[Math.floor(rnd() * 4)]); c.position.y = (1.4 + k * 0.9) * s; c.castShadow = true; g.add(c); } g.position.set(x, 0, z); S.add(g); };
  for (let i = 0; i < 70; i++) { const a = rnd() * Math.PI * 2, d = 14 + rnd() * 45; const x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.abs(x) < 7 && z > -16 && z < 9) continue; tree(x, z, 1 + rnd() * 1.4); }
  for (const [x, z] of [[-7.5, -2], [7.8, -1.5], [-8, 3], [8.5, 4]]) tree(x, z, 1.2);
  const mm = [lam(0x8a6a86), lam(0x7a5c7a), lam(0x9b7a8e)];
  for (let i = 0; i < 16; i++) { const a = rnd() * Math.PI * 2, d = 85 + rnd() * 25; const m = new THREE.Mesh(new THREE.ConeGeometry(18 + rnd() * 16, 22 + rnd() * 18, 5), mm[i % 3]); m.position.set(Math.cos(a) * d, 8, Math.sin(a) * d); S.add(m); }
  // Hut
  const hat = new THREE.Group();
  const hw = lam(0xfbfaf4, { flatShading: false, emissive: 0xcfc8bc, emissiveIntensity: 0.75 });
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.48, 0.03, 28), hw); hat.add(brim);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.2, 20), hw); crown.position.y = 0.11; hat.add(crown);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.05, 20), lam(0x1a1718)); band.position.y = 0.04; hat.add(band);
  const hair = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.24, 0.62, 14, 1, true), new THREE.MeshLambertMaterial({ color: 0x0d0b0d, side: THREE.DoubleSide })); hair.position.y = -0.3; hat.add(hair);
  hat.traverse(o => o.castShadow = true); S.add(hat);
  // Figuren
  const boyB = sprite(C.boy('back'), 1.35), boyF = sprite(C.boy('front', 'scared_sweat'), 1.35);
  const om = sprite(C.oma(), 1.3), op = sprite(C.opa(), 1.42);
  S.add(boyB, boyF, om, op);
  return { S, sun, hemi, hat, boyB, boyF, om, op, fog: S.fog, cam: new THREE.PerspectiveCamera(50, 9 / 16, 0.05, 400) };
}

// ================================================================= INNEN (Zimmer + Flur)
function tatami() {
  const c = C.cv(1024, 1024), g = c.getContext('2d');
  g.fillStyle = '#c4b47e'; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 1024; i += 6) { g.fillStyle = `rgba(90,80,40,${0.05 + Math.random() * 0.06})`; g.fillRect(0, i, 1024, 3); }
  g.fillStyle = '#3b3328'; const mats = [[0, 0, 512, 256], [512, 0, 512, 256], [0, 256, 256, 512], [256, 256, 512, 256], [768, 256, 256, 512], [256, 512, 512, 256], [0, 768, 512, 256], [512, 768, 512, 256]];
  for (const [x, y, w, h] of mats) { g.strokeStyle = '#3b3328'; g.lineWidth = 14; g.strokeRect(x + 7, y + 7, w - 14, h - 14); }
  return tex(c);
}
function planks() {
  const c = C.cv(512, 512), g = c.getContext('2d');
  for (let i = 0; i < 8; i++) { g.fillStyle = ['#8a6440', '#80593a', '#936c46'][i % 3]; g.fillRect(i * 64, 0, 64, 512); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(i * 64, 0, 3, 512); }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function silhouette(kind) {
  const c = C.cv(512, 1024), g = c.getContext('2d');
  g.filter = 'blur(10px)'; g.fillStyle = '#000';
  if (kind === 'hat') { // Kopf mit Hut am Fenster
    g.beginPath(); g.ellipse(256, 330, 240, 52, 0, 0, 7); g.fill(); g.fillRect(160, 190, 192, 150);
    g.beginPath(); g.ellipse(256, 470, 100, 120, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(140, 380); g.lineTo(372, 380); g.lineTo(420, 1024); g.lineTo(92, 1024); g.fill();
  } else if (kind === 'tall') { // grosse Frau, Kopf ueber Tuerrahmen
    g.beginPath(); g.moveTo(170, -50); g.lineTo(342, -50); g.lineTo(360, 300); g.lineTo(380, 1024); g.lineTo(132, 1024); g.lineTo(152, 300); g.closePath(); g.fill();
    g.fillRect(96, 120, 34, 640); g.fillRect(382, 120, 34, 640);
  } else { // Opa normal
    g.beginPath(); g.arc(256, 380, 92, 0, 7); g.fill(); g.beginPath(); g.moveTo(130, 520); g.lineTo(382, 520); g.lineTo(392, 1024); g.lineTo(120, 1024); g.fill();
  }
  return tex(c);
}
function shoji(w, h, paperMat, woodMat) {
  const G = new THREE.Group();
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(w, h), paperMat); G.add(paper);
  const nx = Math.round(w / 0.32), ny = Math.round(h / 0.32);
  for (let i = 0; i <= nx; i++) G.add(box(i % nx === 0 ? 0.07 : 0.025, h, 0.04, woodMat, -w / 2 + i * w / nx, 0, 0.02));
  for (let j = 0; j <= ny; j++) G.add(box(w, j % ny === 0 ? 0.07 : 0.025, 0.04, woodMat, 0, -h / 2 + j * h / ny, 0.02));
  return G;
}
function buildInt() {
  const S = new THREE.Scene(); S.background = new THREE.Color(0x0b0a0c);
  const amb = new THREE.AmbientLight(0xffd9a8, 0.5); S.add(amb);
  const hemi = new THREE.HemisphereLight(0xffe2c0, 0x3a2a1a, 0.4); S.add(hemi);
  const winL = new THREE.DirectionalLight(0xffc890, 1.0); winL.position.set(0.5, 3, -6); winL.target.position.set(0, 0, 1); S.add(winL, winL.target);
  const plaster = lam(0xd8cbb0), wood = lam(0x5b3d26), woodD = lam(0x3e2918);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshLambertMaterial({ map: tatami() })); floor.rotation.x = -Math.PI / 2; S.add(floor);
  const ceil = box(6.4, 0.08, 6.4, lam(0x6e4e33), 0, 2.44, 0); S.add(ceil);
  for (const x of [-2, 0, 2]) S.add(box(0.14, 0.14, 6, woodD, x, 2.36, 0));
  // Waende
  S.add(box(6.2, 2.4, 0.1, plaster, 0, 1.2, 3.05));
  S.add(box(0.1, 2.4, 6.2, plaster, -3.05, 1.2, 0));
  // Fensterwand (z=-3) mit Oeffnung x -0.8..0.8, y 0.85..2.05
  S.add(box(2.2, 2.4, 0.1, plaster, -1.9, 1.2, -3.05), box(2.2, 2.4, 0.1, plaster, 1.9, 1.2, -3.05), box(1.6, 0.85, 0.1, plaster, 0, 0.425, -3.05), box(1.6, 0.35, 0.1, plaster, 0, 2.225, -3.05));
  // Tuerwand (x=3) mit Oeffnung z -0.5..0.5, y 0..1.95
  S.add(box(0.1, 2.4, 2.6, plaster, 3.05, 1.2, -1.8), box(0.1, 2.4, 2.6, plaster, 3.05, 1.2, 1.8), box(0.1, 0.45, 1.0, plaster, 3.05, 2.175, 0));
  for (const [x, z] of [[-3, -3], [3, -3], [-3, 3], [3, 3], [0, -3], [3, 0.55], [3, -0.55], [-3, 0]]) S.add(box(0.16, 2.4, 0.16, wood, x, 1.2, z));
  S.add(box(0.12, 0.08, 6.2, wood, 2.98, 1.97, 0), box(6.2, 0.1, 0.12, wood, 0, 2.08, -2.98), box(0.12, 0.1, 6.2, wood, -2.98, 2.08, 0));
  S.add(box(6.2, 0.12, 0.06, woodD, 0, 0.06, -2.98), box(0.06, 0.12, 6.2, woodD, -2.98, 0.06, 0));
  // Fenster (Shoji)
  const winPaper = new THREE.MeshBasicMaterial({ color: 0xffd9a0 });
  const win = shoji(1.6, 1.2, winPaper, wood); win.position.set(0, 1.45, -3.0); S.add(win);
  const winSil = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.8), new THREE.MeshBasicMaterial({ map: silhouette('hat'), transparent: true, opacity: 0.92, depthWrite: false, color: 0x000000 }));
  winSil.position.set(0.3, 1.45, -2.985); S.add(winSil);
  const winGlow = glow(3.2, [170, 200, 255]); winGlow.position.set(0, 1.45, -2.7); S.add(winGlow);
  // Talismane
  const ofu = [];
  [[-0.55, 1.62], [-0.18, 1.3], [0.2, 1.68], [0.56, 1.32]].forEach(([x, y], i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.38), new THREE.MeshLambertMaterial({ map: tex(C.ofuda(i + 2)), emissive: 0xffffff, emissiveMap: tex(C.ofuda(i + 2)), emissiveIntensity: 0.25 })); m.position.set(x, y, -2.94); m.rotation.z = (i % 2 ? 1 : -1) * 0.05; S.add(m); ofu.push(m); });
  const ofuDoor = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.38), new THREE.MeshLambertMaterial({ map: tex(C.ofuda(9)), emissive: 0xffffff, emissiveMap: tex(C.ofuda(9)), emissiveIntensity: 0.25 }));
  // Schiebetuer (Shoji) in x=3
  const doorPaper = new THREE.MeshBasicMaterial({ color: 0x8090a8 });
  const door = shoji(1.0, 1.95, doorPaper, wood); door.rotation.y = -Math.PI / 2; door.position.set(2.97, 0.975, 0); S.add(door);
  ofuDoor.position.set(-0.04, 0.35, 0.03); ofuDoor.rotation.z = 0.04; door.add(ofuDoor);
  const doorSil = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.95), new THREE.MeshBasicMaterial({ map: silhouette('tall'), transparent: true, opacity: 0.8, depthWrite: false, color: 0x0a0f1a }));
  doorSil.position.set(0, 0, 0.012); door.add(doorSil);
  const silTall = doorSil.material.map, silOpa = silhouette('opa');
  // Laterne (Andon)
  const andon = new THREE.Group(); andon.position.set(-1.7, 0, -1.9); S.add(andon);
  const paperLit = new THREE.MeshBasicMaterial({ color: 0xffd28a });
  andon.add(box(0.28, 0.42, 0.28, paperLit, 0, 0.36, 0));
  for (const [x, z] of [[-.15, -.15], [.15, -.15], [-.15, .15], [.15, .15]]) andon.add(box(0.03, 0.62, 0.03, woodD, x, 0.31, z));
  andon.add(box(0.34, 0.03, 0.34, woodD, 0, 0.6, 0));
  const lamp = new THREE.PointLight(0xffa955, 4, 9, 1.4); lamp.position.set(0, 0.4, 0); andon.add(lamp);
  const lampGlow = glow(1.8, [255, 170, 80]); lampGlow.position.set(0, 0.38, 0); andon.add(lampGlow);
  // Salz-Schaelchen
  const salts = [];
  for (const [x, z] of [[-2.72, -2.72], [2.72, -2.72], [-2.72, 2.72], [2.72, 2.72]]) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.03, 18), lam(0xe9e4da))); g.children[0].position.y = 0.015;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.11, 8), lam(0xffffff)); cone.position.y = 0.085; g.add(cone); g.userData.cone = cone; S.add(g); salts.push(g);
  }
  // Tisch + Tasse
  const table = new THREE.Group(); table.position.set(0.2, 0, -0.5); S.add(table);
  const tm = lam(0x6b4429); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 20), tm); top.position.y = 0.33; table.add(top);
  for (const [x, z] of [[-.3, -.3], [.3, -.3], [-.3, .3], [.3, .3]]) table.add(box(0.05, 0.31, 0.05, tm, x, 0.155, z));
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.14, 12), lam(0x4a6e5a)); pot.position.set(-0.15, 0.42, 0.05); table.add(pot);
  const cup = new THREE.Group(); const cm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.08, 12), lam(0xf2efe8)); cup.add(cm);
  const tea = new THREE.Mesh(new THREE.CircleGeometry(0.04, 12), lam(0x8aa04a)); tea.rotation.x = -Math.PI / 2; tea.position.y = 0.035; cup.add(tea); S.add(cup);
  const shards = new THREE.Group(); for (let i = 0; i < 9; i++) { const s = box(0.03 + rnd() * 0.03, 0.01, 0.02 + rnd() * 0.03, lam(0xf2efe8), (rnd() - .5) * 0.45, 0.008, (rnd() - .5) * 0.35); s.rotation.y = rnd() * 3; shards.add(s); }
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), new THREE.MeshLambertMaterial({ color: 0x7a8a40, transparent: true, opacity: 0.7 })); puddle.rotation.x = -Math.PI / 2; puddle.position.y = 0.005; shards.add(puddle); S.add(shards);
  // Futon
  const futon = new THREE.Group(); futon.position.set(-0.4, 0, 0.9); S.add(futon);
  futon.add(box(1.0, 0.1, 2.0, lam(0xeeeae0), 0, 0.05, 0)); futon.add(box(0.95, 0.08, 1.3, lam(0x3f5f8f), 0, 0.12, 0.3)); futon.add(box(0.5, 0.1, 0.3, lam(0xf6f2ea), 0, 0.14, -0.75));
  // Flur (x 3..4.6)
  const hall = new THREE.Group(); S.add(hall);
  const pl = planks(); pl.repeat.set(1, 5);
  const hf = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 12), new THREE.MeshLambertMaterial({ map: pl })); hf.rotation.x = -Math.PI / 2; hf.position.set(3.8, 0.001, 0); hall.add(hf);
  hall.add(box(0.1, 2.4, 12, plaster, 4.65, 1.2, 0), box(1.7, 0.08, 12, lam(0x6e4e33), 3.8, 2.44, 0));
  for (const z of [-3, -1.5, 1.5, 3]) hall.add(box(0.12, 2.4, 0.12, wood, 4.58, 1.2, z));
  for (const z of [-4, -1.3, 1.3, 4]) hall.add(box(1.6, 0.12, 0.12, woodD, 3.8, 2.36, z));
  const hallWin = box(1.4, 2.0, 0.05, new THREE.MeshBasicMaterial({ color: 0xfff2dc }), 3.8, 1.2, -5.9); hall.add(hallWin);
  const hallL = new THREE.PointLight(0xfff0dc, 3, 10, 1.2); hallL.position.set(3.8, 2.1, -1.5); S.add(hallL);
  // Figuren
  const boyF = sprite(C.boy('front', 'neutral'), 1.35), boySit = sprite(C.boySit(), 1.1);
  const om = sprite(C.oma('shocked'), 1.3), op = sprite(C.opa(), 1.42), omS = sprite(C.omaSleep(), 0.8, 0.3);
  omS.children[0].visible = false;
  const opT = sprite(C.opaTall('creepy'), 2.54, 0.45);
  S.add(boyF, boySit, om, op, omS, opT);
  const T = { boyNeutral: C.boy('front', 'neutral'), boyScared: C.boy('front', 'scared_sweat'), opaCreepy: C.opaTall('creepy'), opaGlow: C.opaTall('glow') };
  return { S, amb, hemi, winL, winPaper, winSil, winGlow, ofu, door, doorPaper, doorSil, silTall, silOpa, andon, lamp, lampGlow, paperLit, salts, cup, shards, table, futon, hallL, hallWin, boyF, boySit, om, op, omS, opT, T,
    cam: new THREE.PerspectiveCamera(50, 9 / 16, 0.03, 100) };
}

export function build() {
  const ext = buildExt(), int = buildInt();
  return { ext, int };
}

// ================================================================= SHOT-SETUPS
function look(cam, pos, target) { cam.position.copy(pos); cam.lookAt(target); }
function onlyShow(list, show) { for (const o of list) o.visible = show.includes(o); }
const _wp = new THREE.Vector3();
function billboard(cam) { for (const s of sprites) { if (!s.visible || s.userData.noBB) continue; s.getWorldPosition(_wp); const dx = cam.position.x - _wp.x, dz = cam.position.z - _wp.z; s.rotation.y = Math.atan2(dx, dz); } }
function shake(cam, amt, t) { cam.rotation.z += Math.sin(t * 61) * amt; cam.rotation.x += Math.sin(t * 47 + 1) * amt; }

function extBase(W, tone = 0, garden = false) { // tone 0 = warmer Nachmittag, 1 = kuehl/unheimlich
  if (garden) W.sun.position.set(-12, 15, -9); else W.sun.position.set(-14, 16, 10);
  W.sun.color.setRGB(L(1, 0.75, tone), L(0.81, 0.72, tone), L(0.59, 0.72, tone)); W.sun.intensity = L(2.4, 1.3, tone);
  W.hemi.intensity = L(1.1, 0.7, tone); W.fog.color.setRGB(L(0.94, 0.55, tone), L(0.75, 0.52, tone), L(0.56, 0.55, tone));
}

export const SHOTS = {
  ext_wide(W, p) { const E = W.ext; extBase(E); onlyShow([E.boyB, E.boyF, E.om, E.op, E.hat], [E.om, E.op]);
    E.om.position.set(-0.8, 0.6, -4.3); E.op.position.set(0.8, 0.6, -4.3);
    look(E.cam, lerpV(V(10, 6.5, 17), V(6.5, 4.6, 12.5), ease(p)), V(0, 1.6, -6)); return { world: E, vig: 0.45 }; },
  ext_arrive(W, p, t) { const E = W.ext; extBase(E); onlyShow([E.boyB, E.boyF, E.om, E.op, E.hat], [E.boyB, E.om, E.op]);
    const z = L(2.6, 0.9, p); E.boyB.position.set(0.05, Math.abs(Math.sin(t * 7)) * 0.03, z);
    E.om.position.set(-0.8, 0.6, -4.3); E.op.position.set(0.8, 0.6, -4.3);
    look(E.cam, V(0.9, 1.45, L(5.6, 4.2, p)), V(0, 1.1, -4.5)); return { world: E, vig: 0.45 }; },
  garden_hat(W, p) { const E = W.ext; extBase(E, 0.15, true); onlyShow([E.boyB, E.boyF, E.om, E.op, E.hat], [E.boyB, E.hat]);
    E.boyB.position.set(-0.3, 0, 4.7); E.hat.position.set(L(3.4, 0.7, ease(p)), 2.52, 7.6); E.hat.rotation.set(0.05, p, 0);
    look(E.cam, lerpV(V(-1.0, 1.25, 0.6), V(-0.8, 1.3, 1.4), ease(p)), V(0.3, 2.05, 7.5)); return { world: E, vig: 0.5 }; },
  face_garden(W, p) { const E = W.ext; extBase(E, 0.35, true); onlyShow([E.boyB, E.boyF, E.om, E.op, E.hat], [E.boyF]);
    E.boyF.position.set(0, 0, 4.6);
    look(E.cam, V(0, 0.98, L(5.85, 5.6, ease(p))), V(0, 0.93, 4.6)); return { world: E, vig: 0.55 }; },
  hedge_po(W, p, t) { const E = W.ext; extBase(E, 0.6 + p * 0.2, true); onlyShow([E.boyB, E.boyF, E.om, E.op, E.hat], [E.hat]);
    E.hat.position.set(0.7, 2.52 + Math.sin(t * 2) * 0.01, 7.6); E.hat.rotation.set(0.05, 1, 0);
    look(E.cam, lerpV(V(0.0, 1.2, 3.0), V(0.2, 1.35, 4.2), ease(p)), V(0.6, 2.35, 7.6)); return { world: E, vig: 0.65 }; },
  side_measure(W, p) { const E = W.ext; extBase(E, 0.7, true); onlyShow([E.boyB, E.boyF, E.om, E.op, E.hat], [E.boyF, E.hat]);
    E.hat.position.set(0.7, 2.52, 7.6);
    E.boyF.position.set(-0.9, 0, 5.7);
    look(E.cam, lerpV(V(-3.4, 1.25, 1.9), V(-3.0, 1.25, 2.4), ease(p)), V(-0.3, 1.25, 6.4));
    return { world: E, vig: 0.6, measure: [V(0.1, 0, 6.42), V(0.1, 2.12, 6.42)], measureLabel: '2,10 M', measureP: sm(0.05, 0.5, p) }; },
  tilt_hat(W, p, t) { const E = W.ext; extBase(E, 0.85, true); onlyShow([E.boyB, E.boyF, E.om, E.op, E.hat], [E.hat]);
    E.hat.position.set(0.7, L(2.55, 2.95, ease(p)), 7.6); E.hat.rotation.set(0.05 + Math.sin(t * 3) * 0.03, 1 + p * 0.3, 0);
    look(E.cam, V(0.1, 1.0, 4.0), lerpV(V(0.4, 1.6, 7.3), V(0.65, 2.75, 7.6), ease(p))); return { world: E, vig: 0.7 }; },

  // ---------------------------------------------------- innen
  kitchen(W, p, t, sh) { const I = W.int; intBase(I, 'day'); onlyShow(intActors(I), [I.om, I.table, I.cup]);
    I.om.position.set(0.75, 0, -1.25); I.shards.position.set(0.85, 0, -0.85);
    const tHit = sh.segs[0].e - 0.35, f = clamp((t - (tHit - 0.45)) / 0.45);
    I.cup.visible = t < tHit; I.shards.visible = t >= tHit;
    I.cup.position.set(0.85, L(0.92, 0.04, f * f), L(-1.0, -0.85, f)); I.cup.rotation.set(f * 2.5, 0, f * 1.2);
    look(I.cam, lerpV(V(-0.9, 1.25, 1.7), V(-0.55, 1.15, 1.05), ease(p)), V(0.6, 0.8, -1.1)); return { world: I, vig: 0.5, shake: t >= tHit && t < tHit + 0.25 ? 0.01 : 0 }; },
  room_rule(W, p) { const I = W.int; intBase(I, 'evening'); onlyShow(intActors(I), [I.boyF, I.op, I.andon, I.futon]);
    setTex(I.boyF, I.T.boyNeutral); I.boyF.position.set(-0.45, 0, -0.5); I.op.position.set(0.55, 0, -0.95);
    look(I.cam, lerpV(V(0.1, 1.3, 2.5), V(0.05, 1.2, 1.8), ease(p)), V(0, 0.85, -0.8)); return { world: I, vig: 0.55 }; },
  talisman(W, p) { const I = W.int; intBase(I, 'evening'); onlyShow(intActors(I), [I.andon]);
    I.ofu.forEach((o, i) => { const k = sm(0.06 + i * 0.12, 0.12 + i * 0.12, p); o.visible = k > 0; o.scale.setScalar(L(1.3, 1, k)); });
    const q = sm(0.62, 0.95, p);
    look(I.cam, lerpV(V(0, 1.45, -1.1), V(-1.95, 0.75, -1.85), q), lerpV(V(0, 1.45, -3), V(-2.72, 0.05, -2.72), q)); return { world: I, vig: 0.55 }; },
  room_alone(W, p) { const I = W.int; intBase(I, 'night', 1 - p * 0.3); onlyShow(intActors(I), [I.boyF, I.andon, I.futon]);
    setTex(I.boyF, I.T.boyScared); I.boyF.position.set(0, 0, -0.7);
    look(I.cam, lerpV(V(0, 1.05, 0.55), V(0.2, 1.6, 2.7), ease(p)), V(0, 0.75, -0.8)); return { world: I, vig: 0.65 }; },
  window_night(W, p, t, sh) { const I = W.int; intBase(I, 'night'); onlyShow(intActors(I), [I.andon, I.winSil]);
    I.winSil.position.x = L(0.5, 0.15, ease(p)); I.winSil.material.opacity = 0.92;
    look(I.cam, lerpV(V(0.15, 1.3, -0.4), V(0.05, 1.38, -1.15), ease(p)), V(0, 1.42, -3));
    const k = sh.sfx.find(f => f.n === 'knock3'); let sk = 0; if (k) for (let i = 0; i < 3; i++) { const d = t - (k.t + i * 0.32); if (d > 0 && d < 0.12) sk = 0.006; }
    return { world: I, vig: 0.7, shake: sk }; },
  window_po(W, p, t) { const I = W.int; intBase(I, 'night'); onlyShow(intActors(I), [I.winSil]);
    I.winSil.position.x = L(0.25, -0.45, ease(p)); I.winPaper.color.setRGB(0.36, 0.46, 0.66).multiplyScalar(0.9 + Math.sin(t * 13) * 0.04);
    look(I.cam, lerpV(V(0.05, 1.38, -1.15), V(-0.05, 1.45, -1.7), ease(p)), V(-0.1, 1.5, -3)); return { world: I, vig: 0.75 }; },
  door_oma(W, p) { const I = W.int; intBase(I, 'night'); onlyShow(intActors(I), [I.doorSil, I.andon]);
    I.doorSil.material.map = I.silTall; I.doorSil.material.opacity = 0.85; I.doorPaper.color.setRGB(0.33, 0.4, 0.55); I.door.position.z = 0;
    look(I.cam, lerpV(V(0.4, 1.15, 0.9), V(1.4, 1.2, 0.45), ease(p)), V(3, 1.2, 0)); return { world: I, vig: 0.7 }; },
  oma_sleep(W, p) { const I = W.int; intBase(I, 'night', 0.25); onlyShow(intActors(I), [I.omS]);
    I.omS.position.set(-1.2, 0, -0.2);
    look(I.cam, lerpV(V(-1.0, 1.25, 2.85), V(-1.15, 1.1, 2.5), ease(p)), V(-1.75, 0.35, -0.2)); return { world: I, vig: 0.75 }; },
  salt_black(W, p) { const I = W.int; intBase(I, 'night', 0.6); onlyShow(intActors(I), [I.andon]);
    const k = sm(0.15, 0.85, p); I.salts[0].userData.cone.material.color.setRGB(L(1, 0.05, k), L(1, 0.04, k), L(1, 0.05, k));
    look(I.cam, lerpV(V(-2.2, 0.45, -2.15), V(-2.42, 0.3, -2.42), ease(p)), V(-2.72, 0.07, -2.72)); return { world: I, vig: 0.8, tint: k * 0.55 }; },
  dawn(W, p) { const I = W.int; intBase(I, 'dawn', p); onlyShow(intActors(I), [I.boySit, I.futon]);
    I.boySit.position.set(0.25, 0, -1.7);
    look(I.cam, lerpV(V(0.1, 0.9, 0.7), V(0.15, 0.88, 0.2), ease(p)), V(0.2, 0.6, -1.9)); return { world: I, vig: 0.6 }; },
  door_opa(W, p, t, sh) { const I = W.int; intBase(I, 'dawn', 1); onlyShow(intActors(I), [I.doorSil]);
    I.doorSil.material.map = I.silOpa; I.doorSil.material.opacity = 0.75; I.doorPaper.color.setRGB(0.62, 0.66, 0.72); I.door.position.z = 0;
    look(I.cam, lerpV(V(1.0, 1.15, 0.7), V(1.7, 1.15, 0.35), ease(p)), V(3, 1.1, 0));
    const k = sh.sfx.find(f => f.n === 'knock2'); let sk = 0; if (k) for (let i = 0; i < 2; i++) { const d = t - (k.t + i * 0.26); if (d > 0 && d < 0.1) sk = 0.005; }
    return { world: I, vig: 0.6, shake: sk }; },
  face_wait(W, p) { const I = W.int; intBase(I, 'dawn', 1); onlyShow(intActors(I), [I.boyF]);
    setTex(I.boyF, I.T.boyScared); I.boyF.position.set(0, 0, -1.2);
    look(I.cam, V(0, 0.98, L(-0.05, -0.3, ease(p))), V(0, 0.94, -1.2)); return { world: I, vig: 0.7 }; },
  door_open(W, p) { const I = W.int; intBase(I, 'dawn', 1); onlyShow(intActors(I), []);
    I.door.position.z = L(0, 1.0, ease(sm(0.25, 0.75, p))); I.doorSil.material.opacity = 0; I.hallL.intensity = 5; I.hallL.color.set(0xfff0dc);
    look(I.cam, lerpV(V(1.3, 1.2, 0.1), V(1.9, 1.2, 0.05), ease(p)), V(3.2, 1.15, 0)); return { world: I, vig: 0.5 }; },
  opa_smile(W, p) { const I = W.int; intBase(I, 'dawn', 1); onlyShow(intActors(I), [I.opT]);
    I.door.position.z = 1.0; I.hallL.intensity = 5; I.hallL.color.set(0xfff0dc); setTex(I.opT, I.T.opaCreepy); I.opT.position.set(4.35, 0, 0);
    look(I.cam, V(L(3.25, 3.42, ease(p)), 2.1, 0.02), V(4.35, 2.1, 0)); return { world: I, vig: 0.55 }; },
  look_up(W, p, t) { const I = W.int; intBase(I, 'dawn', 1); onlyShow(intActors(I), [I.opT]);
    I.door.position.z = 1.0; I.hallL.intensity = 5; I.hallL.color.setRGB(1, L(0.94, 0.35, p), L(0.86, 0.3, p)); setTex(I.opT, I.T.opaCreepy); I.opT.position.set(4.35, 0, 0);
    look(I.cam, V(3.0, 1.0, 0.03), lerpV(V(4.35, 1.0, 0), V(4.35, 2.2, 0), ease(p))); return { world: I, vig: 0.6, tint: p * 0.5 }; },
  ceiling(W, p, t, sh) { const I = W.int; intBase(I, 'red'); onlyShow(intActors(I), [I.opT]);
    I.door.position.z = 1.0; I.hallL.intensity = 6; I.hallL.color.setRGB(1, 0.25, 0.2); setTex(I.opT, I.T.opaGlow); I.opT.position.set(4.35, 0, 0);
    const st = sh.sfx.find(f => f.n === 'stinger'); const after = st ? t - st.t : -1;
    look(I.cam, lerpV(V(3.3, 1.35, 0.03), V(3.5, 1.5, 0.03), ease(p)), V(4.35, 2.2, 0));
    return { world: I, vig: 0.8, tint: 0.65, shake: after > 0 && after < 0.5 ? 0.008 * (1 - after / 0.5) : 0, flash: after > 0 && after < 0.12 ? 1 - after / 0.12 : 0 }; },
};
SHOTS._billboard = billboard; SHOTS._shake = shake;

function intActors(I) { return [I.boyF, I.boySit, I.om, I.op, I.omS, I.opT, I.cup, I.shards, I.table, I.andon, I.futon, I.winSil, I.doorSil, ...I.ofu]; }
function intBase(I, mode, k = 1) {
  I.ofu.forEach(o => { o.visible = mode !== 'day'; o.scale.setScalar(1); });
  I.winSil.visible = false; I.doorSil.visible = I.doorSil.visible; I.door.position.z = 0; I.hallL.intensity = 1; I.hallL.color.set(0x8090b0);
  I.salts.forEach(s => { s.visible = mode !== 'day'; s.userData.cone.material.color.set(0xffffff); });
  const M = {
    day: { amb: [0xffe2b5, 0.75], hemi: 0.5, win: [0xffd09a, 1.3], paper: [1, 0.86, 0.62], lamp: 0, },
    evening: { amb: [0xffb27a, 0.32], hemi: 0.25, win: [0xff8a50, 0.6], paper: [0.95, 0.55, 0.36], lamp: 4.5 },
    night: { amb: [0x6d7fb8, 0.22], hemi: 0.12, win: [0x7a95d6, 0.5], paper: [0.36, 0.46, 0.66], lamp: 3.6 },
    dawn: { amb: [0xa8b6cc, 0.5], hemi: 0.3, win: [0xc6d4e8, 1.0], paper: [0.75, 0.8, 0.88], lamp: 0.0 },
    red: { amb: [0xff5040, 0.35], hemi: 0.15, win: [0xff4030, 0.3], paper: [0.6, 0.2, 0.18], lamp: 0 },
  }[mode];
  I.amb.color.set(M.amb[0]); I.amb.intensity = M.amb[1] * (mode === 'dawn' ? L(0.6, 1, k) : k);
  I.hemi.intensity = M.hemi * k; I.winL.color.set(M.win[0]); I.winL.intensity = M.win[1] * (mode === 'dawn' ? L(0.4, 1, k) : 1);
  I.winPaper.color.setRGB(...M.paper.map(v => v * (mode === 'dawn' ? L(0.55, 1, k) : 1)));
  I.winGlow.material.color.setRGB(...M.paper); I.winGlow.material.opacity = mode === 'day' ? 0.5 : 0.35;
  I.lamp.intensity = M.lamp * (mode === 'night' ? k : 1); I.andon.visible = M.lamp > 0;
  I.doorPaper.color.setRGB(0.3, 0.35, 0.45);
}

export { tex, lam, box, jitter, sprite, setTex, glow, glowTex, gradTex, V, L, clamp, sm, lerpV, look, onlyShow, billboard, shake, rnd };
