// Water, mud and destruction effects.
import * as THREE from 'three';
import { hash, vnoise, canvasTex } from './world.js';

// procedural tiling normal map from layered value noise
export function normalTex(size = 256, freqs = [[4, 1], [9, 0.5], [19, 0.25]], stretch = [1, 1], strength = 2.5) {
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0;
    for (const [f, a] of freqs) {
      const fx = f * stretch[0], fy = f * stretch[1];
      // tileable: blend 4 samples
      const u = x / size, w = y / size;
      const s = (px, py) => vnoise(px * fx, py * fy);
      v += a * ((s(u, w) * (1 - u) + s(u - 1, w) * u) * (1 - w) + (s(u, w - 1) * (1 - u) + s(u - 1, w - 1) * u) * w);
    }
    h[y * size + x] = v;
  }
  const c = document.createElement('canvas'); c.width = c.height = size; const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const l = h[y * size + ((x - 1 + size) % size)], r = h[y * size + ((x + 1) % size)];
    const d = h[((y - 1 + size) % size) * size + x], u = h[((y + 1) % size) * size + x];
    const nx = (l - r) * strength, ny = (d - u) * strength, nz = 1; const len = Math.hypot(nx, ny, nz);
    const k = (y * size + x) * 4;
    img.data[k] = (nx / len * 0.5 + 0.5) * 255; img.data[k + 1] = (ny / len * 0.5 + 0.5) * 255; img.data[k + 2] = (nz / len * 0.5 + 0.5) * 255; img.data[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace;
  return t;
}

export function waterMaterial(color = 0x4f7fa0, opts = {}) {
  const n = normalTex(256, [[5, 1], [11, 0.45], [23, 0.2]], opts.stretch || [1, 1], opts.strength || 3);
  n.repeat.set(...(opts.repeat || [1, 1]));
  const m = new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? 0.06, metalness: 0, normalMap: n, normalScale: new THREE.Vector2(0.8, 0.8), transparent: true, opacity: opts.opacity ?? 0.88, envMapIntensity: 1.6, depthWrite: opts.depthWrite ?? true });
  m.userData.normal = n;
  return m;
}

// soft streaky flow texture (alpha) for the water film running off the camber
export function flowTex() {
  const t = canvasTex(512, 256, (c) => {
    c.clearRect(0, 0, 512, 256);
    c.filter = 'blur(3px)';
    for (let i = 0; i < 70; i++) {
      const y = hash(i, 2) * 256, x = hash(i, 1) * 512, L = 60 + hash(i, 3) * 160;
      c.strokeStyle = `rgba(240,248,255,${0.3 + hash(i, 4) * 0.5})`; c.lineWidth = 2 + hash(i, 5) * 5;
      c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + L * 0.3, y + 6, x + L * 0.6, y - 6, x + L, y + (hash(i, 6) - 0.5) * 10); c.stroke();
    }
    c.filter = 'none';
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

// expanding ring instances (rain splashes on water / mud rings around struggling bodies)
export function ringField(n, color, inner, outer, opacity) {
  const geo = new THREE.RingGeometry(inner, outer, 24); geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
  const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; m.count = 0;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3();
  m.place = (i, x, y, z, s) => { P.set(x, y, z); S.set(s, 1, s); M.compose(P, Q, S); m.setMatrixAt(i, M); };
  m.done = (count) => { m.count = count; m.instanceMatrix.needsUpdate = true; };
  return m;
}

// paving slabs that crack, tilt and sink into mud ("what if" road failure)
export function slabField(x0, x1, z0, z1, topY, paveTex) {
  const cols = 6, sx = (x1 - x0) / cols, rows = Math.round((z1 - z0) / 0.95), sz = (z1 - z0) / rows;
  const geo = new THREE.BoxGeometry(sx * 0.94, 0.22, sz * 0.94);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: paveTex, roughness: 0.35, envMapIntensity: 0.9 });
  const n = cols * rows;
  const mesh = new THREE.InstancedMesh(geo, mat, n); mesh.castShadow = true; mesh.receiveShadow = true;
  const data = [];
  const col = new THREE.Color();
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const k = j * cols + i;
    const v = 0.75 + hash(i, j + 40) * 0.35; col.setRGB(v, v * 0.97, v * 0.93); mesh.setColorAt(k, col);
    data.push({ x: x0 + (i + 0.5) * sx, z: z0 + (j + 0.5) * sz, d: hash(i + 7, j) , ax: (hash(i, j) - 0.5) * 1.1, az: (hash(j, i + 3) - 0.5) * 1.1, depth: 0.5 + hash(i + 2, j + 9) * 0.6, yaw: (hash(i + 5, j + 1) - 0.5) * 0.5 });
  }
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1);
  // p: global progress 0..1 (spreads from far to near with jitter); soak: 0..1 darkening/ puddles
  mesh.update = (p, wobT) => {
    data.forEach((s, k) => {
      const start = (1 - (s.z - z0) / (z1 - z0)) * 0.45 + s.d * 0.4;
      const q = Math.min(1, Math.max(0, (p - start) / 0.35));
      const e = q * q * (3 - 2 * q);
      const crackOnly = s.d < 0.18; // some stay but crack
      const sink = crackOnly ? 0.06 * e : s.depth * e;
      P.set(s.x + (crackOnly ? 0 : s.ax * 0.15 * e), topY - 0.11 - sink, s.z + (crackOnly ? 0 : s.az * 0.12 * e));
      E.set(s.ax * 0.85 * e + Math.sin(wobT * 3 + k) * 0.02 * e, s.yaw * e, s.az * 0.85 * e); Q.setFromEuler(E);
      M.compose(P, Q, S); mesh.setMatrixAt(k, M);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  mesh.update(0, 0);
  return mesh;
}
