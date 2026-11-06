// Roman road construction site, 312 BC, plus storm and present-day variants.
import * as THREE from 'three';
import { toon, outline, box, vnoise, hash, skyDome, cloudSprite, glowTexture, blobShadow, canvasTex } from './world.js';
import { Char, CW, CH } from './chars.js';

export const ROAD_HALF = 3.0;
export const CAMBER = 0.32;
export const ROAD_Y = 0.45;
export const OLD_X = 15.5;
export const BUILD_Z0 = 0, BUILD_Z1 = 12; // construction zone (paving advances from z0 to z1)

export function roadY(x, flat = false) { const u = Math.min(1, Math.abs(x) / ROAD_HALF); return ROAD_Y + (flat ? 0.05 : CAMBER * (1 - u * u)); }
export function groundY(x, z) {
  const d = Math.abs(x);
  let y = 0;
  if (d < 3.45 && z > BUILD_Z0 - 0.05 && z < BUILD_Z1 + 18) return -0.7;
  if (d > 3.7 && d < 5.5) y -= 0.6 * Math.sin(Math.PI * (d - 3.7) / 1.8);
  const side = Math.max(0, d - 26) / 70, far = Math.max(0, -z - 140) / 120;
  const k = Math.min(1, side + far * 0.6);
  y += k * (vnoise(x * 0.02 + 3, z * 0.02) * 18 - 2) + vnoise(x * 0.3, z * 0.3) * 0.08;
  return y;
}

// ---------------- textures ----------------
function voronoiTex(size, cells, colorFn, edgeCol, edgeW, seed = 1) {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  const img = x.createImageData(size, size); const n = cells; const pts = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) pts.push([(i + 0.15 + hash(i + seed, j) * 0.7) / n, (j + 0.15 + hash(j + seed * 3, i) * 0.7) / n, i, j]);
  const cols = pts.map((p, k) => colorFn(k));
  for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
    const u = px / size, v = py / size; const ci = Math.floor(u * n), cj = Math.floor(v * n);
    let d1 = 9, d2 = 9, best = 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const ii = (ci + di + n) % n, jj = (cj + dj + n) % n; const p = pts[jj * n + ii];
      let dx = p[0] - u, dy = p[1] - v; if (dx > 0.5) dx -= 1; if (dx < -0.5) dx += 1; if (dy > 0.5) dy -= 1; if (dy < -0.5) dy += 1;
      const d = Math.sqrt(dx * dx + dy * dy); if (d < d1) { d2 = d1; d1 = d; best = jj * n + ii; } else if (d < d2) d2 = d;
    }
    const k = (py * size + px) * 4; const e = (d2 - d1) * n < edgeW;
    const col = e ? edgeCol : cols[best]; const sh = e ? 1 : 1 - d1 * n * 0.25;
    img.data[k] = col[0] * sh; img.data[k + 1] = col[1] * sh; img.data[k + 2] = col[2] * sh; img.data[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
const basalt = (k) => { const v = 0.75 + hash(k, 2) * 0.35; return [92 * v + 10 * hash(k, 5), 96 * v, 108 * v + 14 * hash(k, 7)]; };
function speckTex(size, base, specks, n, seed) {
  return canvasTex(size, size, (x) => { x.fillStyle = base; x.fillRect(0, 0, size, size); for (let i = 0; i < n; i++) { x.fillStyle = specks[i % specks.length]; const r = 1 + hash(i, seed) * 4; x.beginPath(); x.arc(hash(i, seed + 1) * size, hash(i, seed + 2) * size, r, 0, 7); x.fill(); } });
}

// ---------------- builders ----------------
function roadGeometry(z0, z1, flat = false, segZ = 1) {
  const nx = 16; const g = new THREE.PlaneGeometry(ROAD_HALF * 2, z1 - z0, nx, segZ);
  g.rotateX(-Math.PI / 2); g.translate(0, 0, (z0 + z1) / 2);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, roadY(x, flat)); uv.setXY(i, x / 2.2, -z / 2.2); }
  g.computeVertexNormals(); return g;
}
function runoffGeometry(z0, z1) {
  const g = roadGeometry(z0, z1, false, 1); const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, p.getY(i) + 0.02); uv.setXY(i, Math.abs(x) / 1.2, -z / 3); }
  return g;
}

function cypress(x, z, h) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.ConeGeometry(0.9 * h / 8, h, 10), toon(0x2d5e34)); m.position.y = h / 2 + 0.3; outline(m, 0.08); m.castShadow = true; g.add(m);
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.8, 6), toon(0x6a4a2a)); t.position.y = 0.3; g.add(t);
  g.position.set(x, groundY(x, z), z); return g;
}
function stonePine(x, z, h, s) {
  const g = new THREE.Group();
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, h, 7), toon(0x8a5a3a)); t.position.y = h / 2; t.rotation.z = (hash(s, 1) - 0.5) * 0.3; outline(t, 0.05); g.add(t);
  for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 8), toon(i ? 0x3f7a3a : 0x356c33)); c.scale.set(3.4 - i * 0.6, 0.9, 3.0 - i * 0.5); c.position.set((hash(s, i) - 0.5) * 1.5, h + i * 0.45, (hash(i, s) - 0.5) * 1.5); outline(c, 0.08); c.castShadow = true; g.add(c); }
  g.position.set(x, groundY(x, z), z); return g;
}
function tent(x, z, rot) {
  const sh = new THREE.Shape(); sh.moveTo(-1.4, 0); sh.lineTo(0, 1.9); sh.lineTo(1.4, 0); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 3, bevelEnabled: false }); geo.translate(0, 0, -1.5);
  const m = new THREE.Mesh(geo, toon(0xd9b98a)); outline(m, 0.06); m.castShadow = true; m.receiveShadow = true;
  const flap = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.2), new THREE.MeshBasicMaterial({ color: 0x3a2a1a })); flap.position.set(0, 0.6, 1.52); m.add(flap);
  m.position.set(x, groundY(x, z), z); m.rotation.y = rot; return m;
}
function banner(x, z, h = 4.2) {
  const g = new THREE.Group();
  g.add(box(0.12, h, 0.12, 0x6a4a2a, [0, h / 2, 0], 0.03));
  g.add(box(1.6, 0.1, 0.1, 0x6a4a2a, [0, h - 0.4, 0], 0.03));
  const tex = canvasTex(256, 300, (c) => {
    c.fillStyle = '#b8262b'; c.fillRect(0, 0, 256, 270); c.strokeStyle = '#e8b63c'; c.lineWidth = 12; c.strokeRect(12, 12, 232, 246);
    c.fillStyle = '#e8b63c'; c.font = '900 64px serif'; c.textAlign = 'center'; c.fillText('SPQR', 128, 150);
    c.beginPath(); c.arc(128, 210, 22, 0, 7); c.fill();
    for (let i = 0; i < 12; i++) { c.fillRect(8 + i * 21, 270, 8, 30); }
  });
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.65), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, alphaTest: 0.5 }));
  cloth.position.set(0, h - 1.25, 0.08); g.add(cloth);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), toon(0xe8b63c)); top.position.y = h + 0.1; outline(top, 0.03); g.add(top);
  g.position.set(x, groundY(x, z), z); g.userData.cloth = cloth; return g;
}
function amphora(x, z, rot = 0) {
  const pts = [[0, 0], [0.12, 0.05], [0.22, 0.35], [0.24, 0.6], [0.16, 0.8], [0.08, 0.9], [0.08, 1.05], [0.12, 1.08]].map(([a, b]) => new THREE.Vector2(a, b));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 12), toon(0xc0643a)); outline(m, 0.025); m.castShadow = true;
  m.position.set(x, groundY(x, z), z); m.rotation.z = rot; return m;
}
function cart(withLoad = true) {
  const g = new THREE.Group();
  g.add(box(1.8, 0.5, 2.6, 0x9a6234, [0, 0.95, 0], 0.04));
  g.add(box(1.9, 0.12, 2.7, 0x7a4a24, [0, 0.72, 0], 0.03));
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.16, 16), toon(0x6a4020)); w.rotation.z = Math.PI / 2; w.position.set(s * 1.05, 0.62, 0); outline(w, 0.04); w.castShadow = true; g.add(w);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.22, 8), toon(0x3a2a1a)); hub.rotation.z = Math.PI / 2; hub.position.set(s * 1.08, 0.62, 0); g.add(hub);
    for (let k = 0; k < 4; k++) { const sp = box(0.05, 1.1, 0.08, 0x3a2414, null, 0); sp.position.set(s * 1.14, 0.62, 0); sp.rotation.x = k * Math.PI / 4; g.add(sp); }
    g.add(box(0.1, 0.1, 2.2, 0x7a4a24, [s * 0.5, 0.75, 2.3], 0.02));
  }
  if (withLoad) {
    for (let i = 0; i < 5; i++) { const a = amphora(0, 0); a.scale.setScalar(0.85); a.position.set(-0.55 + (i % 3) * 0.55, 1.15, -0.7 + Math.floor(i / 3) * 0.9); a.rotation.x = 0.15; g.add(a); }
    const sack = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), toon(0xd8c08a)); sack.scale.set(1, 0.7, 1.2); sack.position.set(0.3, 1.45, 0.6); outline(sack, 0.04); g.add(sack);
  }
  return g;
}
function crane() {
  const g = new THREE.Group(); const W = 0x9a6a3a;
  for (const s of [-1, 1]) { const b = box(0.28, 7.5, 0.28, W, [s * 1.2, 3.6, 0], 0.04); b.rotation.z = -s * 0.16; g.add(b); }
  const jib = box(0.26, 0.26, 4.2, W, [0, 7.0, 1.6], 0.04); jib.rotation.x = -0.35; g.add(jib);
  g.add(box(2.8, 0.22, 0.22, W, [0, 6.8, 0], 0.04), box(3.2, 0.22, 0.22, W, [0, 1.4, 0], 0.04));
  const wheel = new THREE.Group(); wheel.position.set(-1.75, 1.85, 0); wheel.rotation.y = Math.PI / 2; g.add(wheel);
  for (const zz of [-0.55, 0.55]) { const r = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.1, 6, 28), toon(W)); r.position.z = zz; wheel.add(r); const ro = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.16, 6, 28), new THREE.MeshBasicMaterial({ color: 0x17110c, side: THREE.BackSide })); ro.position.z = zz; wheel.add(ro); }
  for (let k = 0; k < 6; k++) { const sp = box(0.08, 3.4, 0.08, 0x7a4a24, null, 0.02); sp.rotation.z = k * Math.PI / 6; wheel.add(sp); }
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; const sl = box(0.1, 0.1, 1.2, 0x7a4a24, [Math.cos(a) * 1.7, Math.sin(a) * 1.7, 0], 0.02); wheel.add(sl); }
  const rope = box(0.04, 4.2, 0.04, 0x3a2a1a, [0, 5.4, 3.5], 0); g.add(rope);
  const blk = box(1.2, 0.7, 0.9, 0x8d8f96, [0, 3.0, 3.5], 0.05); g.add(blk);
  g.userData = { wheel, blk, rope };
  return g;
}
function turtle() {
  const g = new THREE.Group();
  const shellTex = voronoiTex(256, 4, (k) => [70 + hash(k, 1) * 30, 130 + hash(k, 2) * 30, 60], [40, 70, 30], 0.12, 9);
  const sh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon(0xffffff, { map: shellTex })); sh.scale.set(1, 0.75, 1.2); outline(sh, 0.03); g.add(sh);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), toon(0x9cc86a)); head.position.set(0, 0.12, 0.66); outline(head, 0.025); g.add(head);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: 0x111111 })); e.position.set(s * 0.08, 0.2, 0.8); g.add(e); }
  const legs = [];
  for (const [x, z] of [[-0.4, 0.35], [0.4, 0.35], [-0.4, -0.35], [0.4, -0.35]]) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), toon(0x9cc86a)); l.scale.set(1, 0.6, 1.3); l.position.set(x, 0.02, z); outline(l, 0.02); g.add(l); legs.push(l); }
  g.userData.legs = legs; return g;
}
function oxSprite() {
  const tex = canvasTex(640, 420, (c) => {
    const INK = '#151012'; c.lineWidth = 10; c.strokeStyle = INK; c.lineJoin = 'round';
    for (const x of [170, 230, 410, 470]) { c.beginPath(); c.moveTo(x, 300); c.lineTo(x, 400); c.stroke(); }
    c.beginPath(); c.roundRect(120, 160, 400, 170, 80); c.fillStyle = '#efe8dc'; c.fill(); c.stroke();
    c.fillStyle = '#8a5a3a'; c.beginPath(); c.ellipse(260, 220, 50, 34, 0.3, 0, 7); c.fill(); c.beginPath(); c.ellipse(420, 270, 36, 26, 0, 0, 7); c.fill();
    c.beginPath(); c.roundRect(470, 110, 150, 140, 60); c.fillStyle = '#efe8dc'; c.fill(); c.stroke();
    c.beginPath(); c.ellipse(590, 215, 34, 30, 0, 0, 7); c.fillStyle = '#f2b6b0'; c.fill(); c.stroke();
    c.fillStyle = INK; c.beginPath(); c.arc(530, 160, 9, 0, 7); c.fill(); c.beginPath(); c.arc(582, 212, 5, 0, 7); c.arc(600, 214, 5, 0, 7); c.fill();
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(520 + s * 30, 116); c.quadraticCurveTo(520 + s * 70, 80, 520 + s * 60, 40); c.lineWidth = 16; c.strokeStyle = INK; c.stroke(); c.lineWidth = 8; c.strokeStyle = '#f2e6c4'; c.stroke(); }
    c.lineWidth = 10; c.strokeStyle = INK; c.beginPath(); c.moveTo(120, 200); c.quadraticCurveTo(80, 240, 96, 300); c.stroke();
    c.beginPath(); c.roundRect(470, 116, 60, 20, 8); c.fillStyle = '#7a4a22'; c.fill();
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.7), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
  m.geometry.translate(0, 0.85, 0); return m;
}

// ---------------- the world ----------------
export function buildRome() {
  const scene = new THREE.Scene();
  const fog = new THREE.Fog(0xcfe6f5, 60, 380); scene.fog = fog;
  const sky = skyDome(0x2a6fd8, 0xcfe8ff, 0xcfe6f5); scene.add(sky);
  const hemi = new THREE.HemisphereLight(0xd8ecff, 0x7aa050, 1.2); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.4);
  sun.position.set(-35, 50, 40); sun.target.position.set(0, 0, 0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -40, near: 1, far: 200 }); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);

  // ground: near (fine) + far (coarse)
  const grassA = new THREE.Color(0x9cc45e), grassB = new THREE.Color(0x76a646), dirt = new THREE.Color(0xb98d5c), dirt2 = new THREE.Color(0xa47648), tmp = new THREE.Color();
  function colorAt(x, z) {
    const n = vnoise(x * 0.08, z * 0.08);
    tmp.copy(grassA).lerp(grassB, n);
    const site = (Math.abs(x) < 12 && z > -8 && z < 30) ? 1 - Math.max(0, Math.abs(x) - 7) / 5 : 0;
    const old = Math.max(0, 1 - Math.abs(x - OLD_X) / 3.2);
    const edge = Math.abs(x) < 6.2 ? 1 : 0;
    const k = Math.min(1, Math.max(site * (0.6 + 0.4 * vnoise(x * 0.5, z * 0.5)), old * 1.2, edge * 0.85));
    tmp.lerp(vnoise(x * 0.4, z * 0.4) > 0.5 ? dirt : dirt2, k);
    return tmp;
  }
  function makeGround(w, d, sx, sz, cx, cz, lower) {
    const g = new THREE.PlaneGeometry(w, d, sx, sz); g.rotateX(-Math.PI / 2); g.translate(cx, 0, cz);
    const p = g.attributes.position; const col = [];
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, groundY(x, z) - lower); const c = colorAt(x, z); col.push(c.r, c.g, c.b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, toon(0xffffff, { vertexColors: true })); m.receiveShadow = true; return m;
  }
  const near = makeGround(44, 220, 176, 440, 4, -50, 0); scene.add(near);
  const far = makeGround(1000, 1000, 160, 160, 0, -200, 0.12); scene.add(far);

  // road
  const paveTex = voronoiTex(1024, 9, basalt, [40, 38, 44], 0.07, 2);
  const paveGrassTex = voronoiTex(1024, 9, basalt, [88, 130, 60], 0.11, 2);
  const gravelTex = speckTex(512, '#b4a48a', ['#8a7a64', '#d8ccb4', '#6a5a4a', '#c4b090'], 2600, 4); gravelTex.wrapS = gravelTex.wrapT = THREE.RepeatWrapping;
  const stoneTex = voronoiTex(512, 5, (k) => { const v = 0.8 + hash(k, 3) * 0.3; return [170 * v, 150 * v, 120 * v]; }, [70, 55, 40], 0.1, 5);
  const roadMat = toon(0xffffff, { map: paveTex });
  const road = new THREE.Mesh(roadGeometry(-400, BUILD_Z0, false, 1), roadMat); road.receiveShadow = true; scene.add(road);
  const flatRoad = new THREE.Mesh(roadGeometry(-400, BUILD_Z1, true, 1), roadMat); flatRoad.receiveShadow = true; flatRoad.visible = false; scene.add(flatRoad);
  // paving that advances during the time-lapse
  const advance = new THREE.Mesh(roadGeometry(BUILD_Z0, BUILD_Z1, false, 24), roadMat); advance.receiveShadow = true; scene.add(advance);
  const gravelLayer = new THREE.Mesh(roadGeometry(BUILD_Z0, BUILD_Z1 + 5, false, 1), toon(0xffffff, { map: gravelTex })); gravelLayer.position.y = -0.95; gravelLayer.receiveShadow = true; scene.add(gravelLayer);
  const stoneLayer = box(ROAD_HALF * 2, 0.3, 10, 0xffffff, [0, -0.45, BUILD_Z1 + 7], 0.04, toon(0xffffff, { map: stoneTex })); scene.add(stoneLayer);
  // layer cross-section at the build front
  const front = new THREE.Group(); scene.add(front);
  const sh = new THREE.Shape(); sh.moveTo(-ROAD_HALF, -0.72); for (let i = 0; i <= 16; i++) { const x = -ROAD_HALF + i * ROAD_HALF / 8; sh.lineTo(x, roadY(x)); } sh.lineTo(ROAD_HALF, -0.72); sh.closePath();
  const secTex = canvasTex(512, 256, (c) => {
    const bands = [['#8a8c94', 0, 60], ['#b4a48a', 60, 120], ['#a58a68', 120, 190], ['#c9a882', 190, 256]];
    for (const [col, a, b] of bands) { c.fillStyle = col; c.fillRect(0, a, 512, b - a); }
    for (let i = 0; i < 500; i++) { c.fillStyle = ['#6a5a4a', '#d8ccb4', '#5a5040'][i % 3]; c.beginPath(); c.arc(hash(i, 1) * 512, 60 + hash(i, 2) * 196, 1 + hash(i, 3) * (hash(i, 2) > 0.5 ? 9 : 3), 0, 7); c.fill(); }
    c.strokeStyle = '#2a2020'; c.lineWidth = 4; for (const y of [60, 120, 190]) { c.beginPath(); c.moveTo(0, y); c.lineTo(512, y); c.stroke(); }
  });
  const sec = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ map: secTex })); sec.geometry.computeBoundingBox();
  const uvs = sec.geometry.attributes.uv, pp = sec.geometry.attributes.position; for (let i = 0; i < pp.count; i++) uvs.setXY(i, (pp.getX(i) + ROAD_HALF) / (2 * ROAD_HALF), (pp.getY(i) + 0.72) / 1.5);
  sec.position.set(0, 0, 0.005); front.add(sec); front.userData.sec = sec;
  // kerbs
  const kerbMat = toon(0x9a9aa2);
  for (const s of [-1, 1]) { const k = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.6, 400 + BUILD_Z0), kerbMat); k.position.set(s * (ROAD_HALF + 0.2), 0.3, -200 + BUILD_Z0 / 2); outline(k, 0.04); k.receiveShadow = true; scene.add(k); }
  const kerbAdv = []; for (const s of [-1, 1]) { const k = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.6, 1), kerbMat); k.position.set(s * (ROAD_HALF + 0.2), 0.3, 0); outline(k, 0.04); scene.add(k); kerbAdv.push(k); }

  // ditch water + road runoff (storm), wet sheen
  const ditchWaterTex = canvasTex(256, 256, (c) => { c.fillStyle = '#6fb0dc'; c.fillRect(0, 0, 256, 256); c.strokeStyle = '#ffffff'; c.lineWidth = 5; for (let i = 0; i < 20; i++) { const y = hash(i, 2) * 256; c.beginPath(); c.moveTo(hash(i, 1) * 256, y); c.lineTo(hash(i, 1) * 256 + 40, y + 6); c.stroke(); } });
  ditchWaterTex.wrapS = ditchWaterTex.wrapT = THREE.RepeatWrapping; ditchWaterTex.repeat.set(1, 60);
  const ditches = [];
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 420), new THREE.MeshBasicMaterial({ map: ditchWaterTex, transparent: true, opacity: 0.92 })); w.rotation.x = -Math.PI / 2; w.position.set(s * 4.6, -0.22, -190); scene.add(w); ditches.push(w); }
  const runTex = canvasTex(256, 256, (c) => { c.clearRect(0, 0, 256, 256); c.strokeStyle = 'rgba(220,240,255,0.95)'; c.lineCap = 'round'; for (let i = 0; i < 40; i++) { c.lineWidth = 2 + hash(i, 4) * 3; const y = hash(i, 2) * 256, x = hash(i, 1) * 256; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 50 + hash(i, 3) * 60, y + (hash(i, 5) - 0.5) * 8); c.stroke(); } });
  runTex.wrapS = runTex.wrapT = THREE.RepeatWrapping;
  const runoff = new THREE.Mesh(runoffGeometry(-120, BUILD_Z1), new THREE.MeshBasicMaterial({ map: runTex, transparent: true, depthWrite: false, opacity: 0.9 })); runoff.visible = false; scene.add(runoff);
  const sheen = new THREE.Mesh(roadGeometry(-120, BUILD_Z1, false, 1), new THREE.MeshPhongMaterial({ color: 0x334455, transparent: true, opacity: 0.25, shininess: 120, specular: 0xffffff, depthWrite: false })); sheen.position.y = 0.012; sheen.visible = false; scene.add(sheen);

  const pudTex = canvasTex(512, 1024, (c) => { c.clearRect(0, 0, 512, 1024); for (let i = 0; i < 40; i++) { const x = hash(i, 1) * 512, y = hash(i, 2) * 1024, r = 30 + hash(i, 3) * 80; c.fillStyle = 'rgba(40,46,56,0.9)'; c.beginPath(); c.ellipse(x, y, r, r * (0.5 + hash(i, 4) * 0.4), hash(i, 5) * 3, 0, 7); c.fill(); c.strokeStyle = 'rgba(220,230,240,0.7)'; c.lineWidth = 4; c.stroke(); } c.strokeStyle = 'rgba(10,10,10,0.9)'; c.lineWidth = 6; for (let i = 0; i < 30; i++) { let x = hash(i, 8) * 512, y = hash(i, 9) * 1024; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (hash(i, k) - 0.5) * 90; y += 30 + hash(k, i) * 40; c.lineTo(x, y); } c.stroke(); } });
  pudTex.wrapT = THREE.RepeatWrapping; pudTex.repeat.set(1, 8);
  const puddles = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_HALF * 2, 60), new THREE.MeshPhongMaterial({ map: pudTex, transparent: true, shininess: 100, specular: 0xffffff, depthWrite: false })); puddles.rotation.x = -Math.PI / 2; puddles.position.set(0, ROAD_Y + 0.07, -20); puddles.visible = false; scene.add(puddles);
  // old dirt road -> mud river
  const mudTex = canvasTex(256, 256, (c) => { c.fillStyle = '#7a5530'; c.fillRect(0, 0, 256, 256); for (let i = 0; i < 70; i++) { c.fillStyle = i % 2 ? '#5f4022' : '#9a7044'; c.beginPath(); c.ellipse(hash(i, 1) * 256, hash(i, 2) * 256, 10 + hash(i, 3) * 26, 4 + hash(i, 4) * 6, 0, 0, 7); c.fill(); } c.strokeStyle = 'rgba(255,240,220,0.5)'; c.lineWidth = 3; for (let i = 0; i < 18; i++) { c.beginPath(); const y = hash(i, 7) * 256; c.moveTo(hash(i, 8) * 256, y); c.quadraticCurveTo(hash(i, 8) * 256 + 20, y + 30, hash(i, 8) * 256, y + 60); c.stroke(); } });
  mudTex.wrapS = mudTex.wrapT = THREE.RepeatWrapping; mudTex.repeat.set(1, 30);
  const mud = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 300), new THREE.MeshPhongMaterial({ map: mudTex, shininess: 70, specular: 0x887766 })); mud.rotation.x = -Math.PI / 2; mud.position.set(OLD_X, 0.16, -120); mud.visible = false; scene.add(mud);
  const ruts = []; for (const dx of [-0.9, 0.9]) { const r = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 300), new THREE.MeshBasicMaterial({ color: 0x8a6440 })); r.rotation.x = -Math.PI / 2; r.position.set(OLD_X + dx, 0.03, -120); scene.add(r); ruts.push(r); }

  // scenery
  const scenery = new THREE.Group(); scene.add(scenery);
  for (let z = -330; z < 40; z += 9) for (const s of [-1, 1]) { const x = s * (9.5 + hash(z, s) * 1.2); if (z > -12 && z < 30 && s < 0) continue; if (Math.abs(x - OLD_X) < 4) continue; scenery.add(cypress(x, z, 6.5 + hash(z, s + 3) * 2.5)); }
  for (let i = 0; i < 26; i++) { const s = hash(i, 1) > 0.5 ? 1 : -1; const x = s * (24 + hash(i, 2) * 70), z = -20 - hash(i, 3) * 260; scenery.add(stonePine(x, z, 5 + hash(i, 4) * 3, i)); }
  // villa on a hill
  const villa = new THREE.Group(); const vx = -58, vz = -95, vy = groundY(vx, vz);
  villa.add(box(14, 4, 9, 0xf3ead8, [0, 2, 0], 0.15));
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 7.4, 3, 4, 1), toon(0xc0583a)); roof.rotation.y = Math.PI / 4; roof.scale.set(1.35, 1, 0.85); roof.position.y = 5.5; outline(roof, 0.15); villa.add(roof);
  for (let i = 0; i < 5; i++) villa.add(box(0.5, 3.6, 0.5, 0xffffff, [-5 + i * 2.5, 1.8, 4.8], 0.06));
  villa.position.set(vx, vy, vz); scenery.add(villa);
  // Rome on the horizon: walls, houses, temple on a hill
  const rome = new THREE.Group(); scenery.add(rome);
  for (let i = -6; i <= 6; i++) rome.add(box(14, 5 + hash(i, 1) * 2, 2, 0xd9c49a, [i * 14, 2.5, 0], 0.3));
  for (let i = 0; i < 60; i++) { const x = (hash(i, 1) - 0.5) * 170, z = -8 - hash(i, 2) * 40, h = 3 + hash(i, 3) * 6, y = Math.max(0, 14 - Math.abs(x) * 0.15) * hash(i, 5); rome.add(box(5 + hash(i, 4) * 4, h, 5, [0xf0e2c8, 0xe8cfa8, 0xf6efe0][i % 3], [x, y + h / 2, z], 0.25)); const r = new THREE.Mesh(new THREE.ConeGeometry(4.6, 2.2, 4), toon(0xc0583a)); r.rotation.y = Math.PI / 4; r.position.set(x, y + h + 1.1, z); rome.add(r); }
  const hill = new THREE.Mesh(new THREE.SphereGeometry(40, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon(0x8fb258)); hill.scale.set(1.2, 0.5, 0.8); hill.position.set(-10, 0, -40); rome.add(hill);
  const temple = new THREE.Group(); temple.add(box(18, 3, 26, 0xf2ead8, [0, 1.5, 0], 0.25)); for (let i = 0; i < 6; i++) temple.add(box(1.2, 9, 1.2, 0xffffff, [-7 + i * 2.8, 7.5, 12], 0.15)); temple.add(box(18, 9, 18, 0xf2ead8, [0, 7.5, -3], 0.25));
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 11, 4, 3, 1), toon(0xc0583a)); ped.rotation.set(Math.PI / 2, 0, Math.PI); ped.scale.set(1, 7, 1); ped.position.set(0, 14, -1); outline(ped, 0.2); temple.add(ped);
  temple.position.set(-10, 19, -40); rome.add(temple);
  rome.position.set(0, 0, -330);
  // clouds & birds
  const clouds = []; for (let i = 0; i < 16; i++) { const a = -Math.PI / 2 + (i / 16 - 0.5) * 3.6; const c = cloudSprite(i, 20 + hash(i, 9) * 16); c.position.set(Math.cos(a) * 260 * (hash(i, 3) > 0.5 ? 1 : -1) * 0.8, 60 + hash(i, 2) * 60, Math.sin(a) * 260 - 40); scene.add(c); clouds.push(c); }
  const stormClouds = []; for (let i = 0; i < 24; i++) { const c = cloudSprite(i, 30 + hash(i, 4) * 20); c.material = c.material.clone(); c.material.color.set(0x5a6478); c.position.set((hash(i, 1) - 0.5) * 500, 45 + hash(i, 2) * 50, -hash(i, 3) * 400 + 60); c.visible = false; scene.add(c); stormClouds.push(c); }
  const birdTex = canvasTex(128, 64, (c) => { c.strokeStyle = '#1a1a22'; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); c.moveTo(10, 20); c.quadraticCurveTo(40, 10, 64, 40); c.quadraticCurveTo(88, 10, 118, 20); c.stroke(); });
  const birds = []; for (let i = 0; i < 9; i++) { const b = new THREE.Sprite(new THREE.SpriteMaterial({ map: birdTex, fog: false })); b.scale.set(2, 1, 1); b.userData = { x: (hash(i, 1) - 0.5) * 80, y: 30 + hash(i, 2) * 20, z: -40 - hash(i, 3) * 80, p: hash(i, 4) * 6 }; scene.add(b); birds.push(b); }

  // construction site props (ancient only)
  const site = new THREE.Group(); scene.add(site);
  const cr = crane(); cr.position.set(-7.6, 0, 9); cr.rotation.y = 0.5; site.add(cr);
  for (let i = 0; i < 22; i++) { const x = -6.5 - hash(i, 1) * 3, z = 14 + hash(i, 2) * 10; const b = box(1.0 + hash(i, 3) * 0.5, 0.6, 0.8, 0x8d8f96, [x, 0.3 + (i % 3) * 0.6, z], 0.04); b.rotation.y = hash(i, 4); site.add(b); }
  for (const [x, z, r] of [[7.5, 16, 2.0], [8.6, 21, 1.6], [6.8, 26, 1.8]]) { const p = new THREE.Mesh(new THREE.ConeGeometry(r, r * 0.8, 14), toon(0xb4a48a, { map: gravelTex })); p.position.set(x, r * 0.4, z); outline(p, 0.05); p.castShadow = true; site.add(p); }
  for (let i = 0; i < 7; i++) site.add(amphora(6.2 + (i % 4) * 0.55, 6 + Math.floor(i / 4) * 0.6, i === 5 ? 1.4 : 0));
  for (let i = 0; i < 6; i++) { const z = 30 + i * 4.5; site.add(tent(-14 - (i % 2) * 4, z, 0.2 + (i % 2) * 0.3)); }
  const banners = []; for (const [x, z] of [[-5.2, 3], [5.4, -6], [-12, 24], [5.2, 22]]) { const b = banner(x, z); site.add(b); banners.push(b); }
  const stoneCart = cart(); stoneCart.position.set(5.8, 0, 11); stoneCart.rotation.y = 0.12; site.add(stoneCart);
  const ox0 = oxSprite(); ox0.position.set(6.0, 0, 14.6); site.add(ox0);
  const fire = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,210,120,1)', 'rgba(255,80,0,0)'), blending: THREE.AdditiveBlending, depthWrite: false })); fire.position.set(-11, 0.6, 28); fire.scale.set(1.4, 1.8, 1); site.add(fire);
  const milestone = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 2.2, 14), toon(0xffffff, { map: canvasTex(256, 256, (c) => { c.fillStyle = '#e8dcc0'; c.fillRect(0, 0, 256, 256); c.fillStyle = '#4a3a2a'; c.font = '900 52px serif'; c.textAlign = 'center'; c.fillText('ROMA', 128, 100); c.fillText('M·P·I', 128, 170); }) }));
  milestone.position.set(4.6, 1.1, -14); milestone.rotation.y = -0.9; outline(milestone, 0.04); scene.add(milestone);

  // the old-road cart (sinks in the mud)
  const mudCart = cart(); mudCart.position.set(OLD_X, 0, -4); mudCart.rotation.y = Math.PI; scene.add(mudCart);
  const ox1 = oxSprite(); ox1.position.set(OLD_X, 0, -8.5); scene.add(ox1);
  // the roll-off gag cart on the hump
  const gagCart = cart(); gagCart.position.set(0, ROAD_Y + CAMBER, -9); scene.add(gagCart);

  // the turtle
  const tur = turtle(); tur.scale.setScalar(1.7); tur.visible = false; scene.add(tur);

  // present day
  const today = new THREE.Group(); today.visible = false; scene.add(today);
  for (let i = 0; i < 8; i++) { const s = i % 2 ? 1 : -1, z = -10 - i * 14; const t = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 2.2 + hash(i, 1) * 2.5, 16), toon(0xc49a72)); t.position.set(s * 8.2, 1.2, z); outline(t, 0.06); today.add(t); const top = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), toon(0x6a9a40)); top.scale.y = 0.35; top.position.set(s * 8.2, 2.4 + hash(i, 1) * 2.5, z); today.add(top); }
  for (let i = 0; i < 12; i++) today.add(stonePine((i % 2 ? 1 : -1) * (6.5 + hash(i, 6) * 3), 22 - i * 9, 6 + hash(i, 7) * 2, i + 40));
  const sign = new THREE.Group(); sign.add(box(0.12, 2.0, 0.12, 0x4a3a2a, [-0.9, 1, 0], 0.02), box(0.12, 2.0, 0.12, 0x4a3a2a, [0.9, 1, 0], 0.02));
  const signFace = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.9), new THREE.MeshBasicMaterial({ map: canvasTex(480, 180, (c) => { c.fillStyle = '#7a3e1e'; c.fillRect(0, 0, 480, 180); c.strokeStyle = '#f3e6c8'; c.lineWidth = 8; c.strokeRect(10, 10, 460, 160); c.fillStyle = '#f3e6c8'; c.font = '800 56px Montserrat'; c.textAlign = 'center'; c.fillText('VIA APPIA', 240, 82); c.font = '700 40px Montserrat'; c.fillText('ANTICA', 240, 140); }) }));
  signFace.position.set(0, 1.85, 0.08); sign.add(signFace); sign.position.set(4.4, 0, 10); sign.rotation.y = -0.6; today.add(sign);

  // ---------------- people ----------------
  const people = [];
  const add = (spec, x, z, h = 1.9, extra = {}) => { const c = new Char(spec, h); c.base = new THREE.Vector3(x, 0, z); Object.assign(c, extra); c.mesh.position.set(x, groundY(x, z) > -0.1 && Math.abs(x) > ROAD_HALF ? Math.max(0, groundY(x, z)) : 0, z); scene.add(c.mesh); const s = blobShadow(0.5, 0.25); s.position.set(x, 0.03, z); scene.add(s); c.shadow = s; people.push(c); return c; };
  const hero = add({ outfit: 'engineer', hair: 'curly', stubble: true, expr: 'bored', pose: 'hold', item: 'template' }, 1.2, 4.2, 1.95);
  const cent = add({ outfit: 'centurion', hat: 'crest', item: 'vitis', greaves: true, mustache: true, expr: 'angry', pose: 'stand' }, 6.5, 2.0, 2.05);
  const laughers = [
    add({ outfit: 'legionary', hat: 'galea', shield: true, item: 'pilum', expr: 'neutral', pose: 'stand_shield' }, 5.4, 6.4, 1.9),
    add({ outfit: 'legionary', hat: 'galea', expr: 'neutral', pose: 'stand' }, 6.5, 7.6, 1.9),
    add({ outfit: 'legionary', hat: 'galea', hair: 'short', expr: 'neutral', pose: 'stand' }, 4.6, 8.4, 1.85),
  ];
  const tunics = ['#a9774a', '#6f8f4e', '#c99a54', '#8a6a9a', '#b85a3a', '#5a7a9a'];
  const hats = [{ hat: 'straw' }, { hair: 'short' }, { hat: 'bandana', hatColor: '#c94a3a' }, { hair: 'curly', hairColor: '#5a3a1a' }, { hat: 'bandana', hatColor: '#3a7ab0' }, { hair: 'short', hairColor: '#8a5a2a' }];
  const workers = [];
  const jobs = ['carry', 'pick', 'basket', 'carry', 'pick', 'basket', 'walk'];
  for (let i = 0; i < 26; i++) {
    const side = i % 2 ? 1 : -1; const x = side * (1.0 + hash(i, 1) * 1.8); const z = BUILD_Z0 + 6 + hash(i, 2) * 22;
    const job = jobs[i % jobs.length];
    const spec = { outfit: 'worker', tunic: tunics[i % 6], ...hats[(i * 5) % 6], expr: job === 'carry' ? 'strain' : (i % 3 ? 'neutral' : 'happy'), pose: job === 'basket' ? 'hold' : job, item: job === 'basket' ? 'basket' : null, sweat: job === 'carry' };
    const w = add(spec, x + (z > BUILD_Z1 ? side * 1.2 : 0), z, 1.85, { job, phase: hash(i, 7) * 6.28, path: hash(i, 8) * 6 });
    workers.push(w);
  }
  for (let i = 0; i < 8; i++) { const x = -9 - (i % 3) * 1.6, z = 24 + i * 1.8; workers.push(add({ outfit: 'legionary', hat: 'galea', expr: i % 2 ? 'neutral' : 'happy', pose: 'stand_shield', shield: true, item: i % 2 ? 'pilum' : null }, x, z, 1.88, { job: 'idle', phase: i })); }
  const craneWalker = new Char({ outfit: 'worker', tunic: '#b85a3a', hair: 'short', expr: 'strain', pose: 'walk1', sweat: true }, 1.4); scene.add(craneWalker.mesh);
  // legion (march in the storm)
  const legion = []; const legionG = new THREE.Group(); legionG.visible = false; scene.add(legionG);
  for (let r = 0; r < 9; r++) for (let k = 0; k < 4; k++) { const c = new Char({ outfit: 'legionary', hat: 'galea', shield: true, item: 'pilum', expr: 'determined', pose: 'march1', wet: true }, 1.9); c.base = new THREE.Vector3(-1.8 + k * 1.2, ROAD_Y + CAMBER * (1 - Math.pow((-1.8 + k * 1.2) / ROAD_HALF, 2)), -r * 1.6); c.phase = (r + k) % 2; legionG.add(c.mesh); legion.push(c); }
  legionG.add(new Char({ outfit: 'legionary', hat: 'crest', item: 'vitis', greaves: true, mustache: true, expr: 'determined', pose: 'march1', wet: true }, 1.95).mesh);
  // stuck soldiers in the mud
  const stuck = [];
  for (let i = 0; i < 4; i++) { const c = new Char({ outfit: 'legionary', hat: 'galea', expr: 'shock', pose: 'stuck', wet: true }, 1.9); c.base = new THREE.Vector3(OLD_X - 1.6 + i * 1.1, 0, -1 - i * 1.6); scene.add(c.mesh); stuck.push(c); }
  // tourists + performer
  const tourists = [];
  const tSpecs = [{ outfit: 'tourist', hat: 'cap', sunglasses: true, expr: 'happy', pose: 'photo' }, { outfit: 'tourist', shirt: '#7ac0e0', hair: 'curly', hairColor: '#c8902a', expr: 'happy', pose: 'walk1' }, { outfit: 'tourist', shirt: '#f08a7a', hat: 'cap', hatColor: '#e04646', expr: 'aha', pose: 'point' }, { outfit: 'tourist', shirt: '#ffffff', hair: 'short', hairColor: '#222', sunglasses: true, expr: 'neutral', pose: 'walk2' }];
  tSpecs.forEach((s, i) => { const c = new Char(s, 1.85); c.base = new THREE.Vector3(-1.6 + i * 1.1, 0, -2 - i * 2.4); c.phase = i; today.add(c.mesh); tourists.push(c); });
  const performer = new Char({ outfit: 'legionary', hat: 'galea', hair: 'curly', stubble: true, shield: true, expr: 'neutral', pose: 'stand_shield' }, 1.95); performer.mesh.position.set(1.8, ROAD_Y + 0.25, 3.0); today.add(performer.mesh);

  // rain
  const RN = 5000; const rainPos = new Float32Array(RN * 6); const rainSeed = new Float32Array(RN * 3);
  for (let i = 0; i < RN; i++) { rainSeed[i * 3] = hash(i, 1); rainSeed[i * 3 + 1] = hash(i, 2); rainSeed[i * 3 + 2] = hash(i, 3); }
  const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xcfe0f0, transparent: true, opacity: 0.55 })); rain.frustumCulled = false; rain.visible = false; scene.add(rain);
  function updateRain(t, cam) {
    const c = cam.position; const box = 26;
    for (let i = 0; i < RN; i++) {
      const sx = rainSeed[i * 3], sy = rainSeed[i * 3 + 1], sz = rainSeed[i * 3 + 2];
      const x = c.x + (sx - 0.5) * box, z = c.z + (sz - 0.5) * box;
      const y = c.y + 12 - ((t * 22 + sy * 24) % 24);
      rainPos.set([x, y, z, x - 0.12, y + 0.7, z], i * 6);
    }
    rainGeo.attributes.position.needsUpdate = true;
  }

  return { scene, puddles, sky, hemi, sun, fog, road, flatRoad, advance, gravelLayer, stoneLayer, front, kerbAdv, ditches, ditchWaterTex, runoff, runTex, sheen, mud, mudTex, ruts, site, cr, banners, stoneCart, mudCart, ox1, gagCart, tur, today, people, hero, cent, laughers, workers, craneWalker, legion, legionG, stuck, tourists, performer, rain, updateRain, clouds, stormClouds, birds, paveTex, paveGrassTex, roadMat };
}
