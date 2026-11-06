// Shared 3D helpers: toon materials, outlines, sky, clouds, noise.
import * as THREE from 'three';

const g = new Uint8Array([95, 95, 95, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
export const gradientMap = new THREE.DataTexture(g, 3, 1);
gradientMap.minFilter = gradientMap.magFilter = THREE.NearestFilter; gradientMap.needsUpdate = true;

export function toon(color, extra = {}) { return new THREE.MeshToonMaterial({ color, gradientMap, ...extra }); }
const outlineMat = new THREE.MeshBasicMaterial({ color: 0x17110c, side: THREE.BackSide });

// inverted hull outline using per-axis scaling (works for convex, centered primitives)
export function outline(mesh, t = 0.05) {
  const geo = mesh.geometry; geo.computeBoundingBox();
  const s = new THREE.Vector3(), c = new THREE.Vector3();
  geo.boundingBox.getSize(s); geo.boundingBox.getCenter(c);
  const o = new THREE.Mesh(geo, outlineMat);
  const k = new THREE.Vector3((s.x + 2 * t) / Math.max(s.x, 1e-3), (s.y + 2 * t) / Math.max(s.y, 1e-3), (s.z + 2 * t) / Math.max(s.z, 1e-3));
  o.scale.copy(k);
  o.position.set(c.x * (1 - k.x), c.y * (1 - k.y), c.z * (1 - k.z));
  mesh.add(o);
  return mesh;
}

export function box(w, h, d, color, pos, t = 0.04, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || toon(color));
  if (pos) m.position.set(...pos);
  m.castShadow = true; m.receiveShadow = true;
  if (t) outline(m, t);
  return m;
}

export function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
export function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function skyDome(top, horizon, bottom = horizon, radius = 450) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(top) }, hor: { value: new THREE.Color(horizon) }, bot: { value: new THREE.Color(bottom) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'uniform vec3 top; uniform vec3 hor; uniform vec3 bot; varying vec3 vP; void main(){ float h=vP.y; vec3 c = h>0.0 ? mix(hor, top, pow(clamp(h*1.6,0.0,1.0),0.7)) : mix(hor, bot, clamp(-h*4.0,0.0,1.0)); gl_FragColor = vec4(c,1.0);\n#include <colorspace_fragment>\n}',
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), mat);
  m.renderOrder = -10; m.frustumCulled = false;
  return m;
}

function cloudCanvas(seed) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const x = c.getContext('2d');
  const puffs = [];
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    puffs.push([70 + t * 370 + (hash(seed, i) - 0.5) * 30, 170 - Math.sin(t * Math.PI) * 70 + (hash(i, seed) - 0.5) * 20, 42 + Math.sin(t * Math.PI) * 38 + hash(seed + 3, i) * 16]);
  }
  const path = () => { x.beginPath(); for (const [px, py, r] of puffs) { x.moveTo(px + r, py); x.arc(px, py, r, 0, Math.PI * 2); } x.rect(70, 170, 370, 46); };
  path(); x.lineWidth = 14; x.strokeStyle = '#1b2440'; x.stroke();
  path(); x.fillStyle = '#ffffff'; x.fill();
  x.save(); path(); x.clip(); x.fillStyle = '#cfe0f5'; x.fillRect(0, 186, 512, 60); x.restore();
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const cloudTex = [];
export function cloudSprite(seed, scale) {
  if (!cloudTex[seed % 4]) cloudTex[seed % 4] = cloudCanvas(seed % 4 + 1);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex[seed % 4], fog: false, transparent: true, depthWrite: false }));
  s.scale.set(scale * 2, scale, 1);
  return s;
}

export function glowTexture(inner = 'rgba(255,250,220,1)', outer = 'rgba(255,200,120,0)') {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  const gr = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, inner); gr.addColorStop(0.25, inner.replace(/[\d.]+\)$/, '0.6)')); gr.addColorStop(1, outer);
  x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function blobShadow(r = 0.45, op = 0.28) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 20), new THREE.MeshBasicMaterial({ color: 0x3a2410, transparent: true, opacity: op, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.02; m.scale.y = 0.6;
  return m;
}

export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

export const ease = {
  io: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  o: (t) => 1 - Math.pow(1 - t, 3),
  i: (t) => t * t * t,
  sine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
};
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
