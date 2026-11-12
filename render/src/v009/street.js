// Old London terrace street at dawn: colourful row houses with windows that light up, gas lamps, factory with clock tower; bedroom set.
import * as THREE from 'three';
import { toon, outline, box, hash, skyDome, cloudSprite, glowTexture, canvasTex } from '../world.js';
import { clockFace } from '../v008/station.js';

export const BED_X = 200;
const INK = '#151012';
const tiled = (t, rx, ry) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };

function brickTex(base, w = 256, h = 256) {
  return canvasTex(w, h, (c) => { c.fillStyle = '#d8ccb8'; c.fillRect(0, 0, w, h); const bh = 16, bw = 40; for (let r = 0; r < h / bh; r++) for (let k = -1; k < w / bw + 1; k++) { const v = 0.85 + hash(r, k) * 0.3; const col = new THREE.Color(base).multiplyScalar(v); c.fillStyle = '#' + col.getHexString(); c.fillRect(k * bw + (r % 2) * bw / 2 + 2, r * bh + 2, bw - 4, bh - 4); } });
}
function cobbleTex() {
  return canvasTex(256, 256, (c) => { c.fillStyle = '#4a4650'; c.fillRect(0, 0, 256, 256); for (let r = 0; r < 12; r++) for (let k = 0; k < 10; k++) { const x = k * 26 + (r % 2) * 13, y = r * 22 + 11, v = 120 + hash(r, k) * 50; c.fillStyle = `rgb(${v * 0.9 | 0},${v * 0.86 | 0},${v | 0})`; c.beginPath(); c.roundRect(x - 11, y - 9, 22, 18, 7); c.fill(); c.fillStyle = 'rgba(255,220,200,0.15)'; c.fillRect(x - 8, y - 7, 12, 4); } });
}
function doorTex(col, num) {
  return canvasTex(96, 192, (c) => { c.fillStyle = col; c.fillRect(0, 0, 96, 192); c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 5; c.strokeRect(14, 20, 68, 60); c.strokeRect(14, 100, 68, 76); c.fillStyle = '#e8c24a'; c.beginPath(); c.arc(76, 110, 6, 0, 7); c.fill(); c.fillRect(34, 86, 28, 6); c.fillStyle = '#ffffff'; c.font = '900 22px Montserrat'; c.textAlign = 'center'; c.fillText(String(num), 48, 16); c.strokeStyle = INK; c.lineWidth = 6; c.strokeRect(3, 3, 90, 186); });
}
const fronts = ['#7ab8e8', '#f2a8b8', '#9ad8b0', '#f4d47a', '#c8a8e8', '#f0b080', '#a8d0e0', '#e8e0d0'];
const doors = ['#c8302a', '#2a6ad8', '#2a8a4a', '#f2c23a', '#8a3a8a', '#e8701a', '#1a1a2a', '#3ac8b8'];

function house(i, side, windows) {
  const o = -side;
  const g = new THREE.Group(); const w = 4.2, h = 6.4, d = 6;
  const brick = i % 3 === 0;
  const frontM = brick ? toon(0xffffff, { map: tiled(brickTex('#a8483a'), 2, 3) }) : toon(new THREE.Color(fronts[i % 8]));
  const body = new THREE.Mesh(new THREE.BoxGeometry(d, h, w), [frontM, frontM, toon(0x6a5a5a), toon(0x6a5a5a), frontM, frontM]); body.position.set(-o * d / 2, h / 2, 0); body.castShadow = body.receiveShadow = true; outline(body, 0.05); g.add(body);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(d + 0.4, 0.4, w + 0.1), toon(0x4a4250)); roof.position.set(-o * d / 2, h + 0.2, 0); g.add(roof);
  const ch = box(0.8, 1.6, 0.8, 0x8a4a3a, [-o * 2.4, h + 1.0, w / 2 - 0.5], 0.03); g.add(ch); for (let k = 0; k < 2; k++) g.add(box(0.22, 0.4, 0.22, 0xd86a3a, [-o * 2.4 + (k - 0.5) * 0.36, h + 1.95, w / 2 - 0.5], 0.01));
  g.add(box(0.12, 0.28, w + 0.05, 0xf4ecdc, [0.06 * o, 3.2, 0], 0.01));
  // door
  const dm = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.2), toon(0xffffff, { map: doorTex(doors[i % 8], 10 + i * 2) })); dm.position.set(0.02 * o, 1.1, -0.9); dm.rotation.y = o * Math.PI / 2; g.add(dm);
  g.add(box(0.5, 0.2, 1.4, 0xb8b0a0, [0.25 * o, 0.1, -0.9], 0.02));
  // windows: ground floor + upper floor
  for (const [wz, wy] of [[0.9, 1.6], [-0.9, 4.6], [0.9, 4.6]]) {
    const frame = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.55), toon(0xf8f4ec)); frame.position.set(0.02 * o, wy, wz); frame.rotation.y = o * Math.PI / 2; g.add(frame);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.3), new THREE.MeshStandardMaterial({ color: 0x1a2440, emissive: 0xffc860, emissiveIntensity: 0, roughness: 0.1, metalness: 0.2 })); pane.position.set(0.035 * o, wy, wz); pane.rotation.y = o * Math.PI / 2; g.add(pane);
    const bars = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.3), new THREE.MeshBasicMaterial({ map: canvasTex(64, 80, (c) => { c.clearRect(0, 0, 64, 80); c.fillStyle = '#f8f4ec'; c.fillRect(29, 0, 6, 80); c.fillRect(0, 37, 64, 6); c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.moveTo(6, 30); c.lineTo(20, 4); c.lineTo(26, 4); c.lineTo(12, 30); c.fill(); }), transparent: true })); bars.position.set(0.045 * o, wy, wz); bars.rotation.y = o * Math.PI / 2; g.add(bars);
    g.add(box(0.25, 0.12, 1.3, 0xf8f4ec, [0.12 * o, wy - 0.8, wz], 0.01));
    if (wy > 3 && hash(i, wz) > 0.4) { const fb = box(0.3, 0.25, 1.2, 0x8a5a2a, [0.2 * o, wy - 0.95, wz], 0.01); g.add(fb); for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), toon([0xe84a6a, 0xf2c23a, 0xffffff, 0xe8701a][(k + i) % 4])); f.position.set(0.25 * o, wy - 0.78, wz - 0.45 + k * 0.3); g.add(f); } }
    windows.push({ pane, house: i, side, upper: wy > 3, local: new THREE.Vector3(0.05 * o, wy, wz), group: g });
  }
  return g;
}
function gasLamp() {
  const g = new THREE.Group(); g.add(box(0.12, 3.6, 0.12, 0x1a1a22, [0, 1.8, 0], 0.02)); g.add(box(0.5, 0.6, 0.5, 0x1a1a22, [0, 3.85, 0], 0.02));
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.45, 0.38), new THREE.MeshBasicMaterial({ color: 0xffe6a0 })); glass.position.y = 3.82; g.add(glass);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,230,160,0.9)', 'rgba(255,170,80,0)'), blending: THREE.AdditiveBlending, depthWrite: false })); glow.position.y = 3.82; glow.scale.setScalar(2.4); g.add(glow);
  return g;
}

export function buildStreet() {
  const scene = new THREE.Scene();
  const sky = skyDome(0x2a3a8a, 0xffa878, 0xffa878); scene.add(sky);
  const hemi = new THREE.HemisphereLight(0xa8b8f0, 0x5a4a5a, 0.7); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffb878, 2.6); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 300 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  sun.userData.dir = new THREE.Vector3(0.25, 0.32, -0.9).normalize(); scene.add(sun, sun.target);
  const clouds = []; for (let i = 0; i < 12; i++) { const a = -Math.PI / 2 + (i / 12 - 0.5) * 2.4; const cl = cloudSprite(i, 16 + hash(i, 9) * 12); cl.material.color = new THREE.Color(0xffd8d0); cl.position.set(Math.cos(a) * 230, 40 + hash(i, 2) * 50, Math.sin(a) * 230); scene.add(cl); clouds.push(cl); }
  const sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,240,200,1)', 'rgba(255,150,100,0)'), fog: false, depthWrite: false })); sunDisc.position.set(40, 12, -300); sunDisc.scale.setScalar(90); scene.add(sunDisc);

  const street = new THREE.Group(); scene.add(street);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(9, 160), toon(0xffffff, { map: tiled(cobbleTex(), 4, 70), roughness: 0.6 })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0, -40); road.receiveShadow = true; street.add(road);
  for (const s of [-1, 1]) { const pv = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.18, 160), toon(0xffffff, { map: tiled(canvasTex(64, 64, (c) => { c.fillStyle = '#a8a098'; c.fillRect(0, 0, 64, 64); c.strokeStyle = '#7a7268'; c.lineWidth = 3; c.strokeRect(1, 1, 62, 62); }), 2, 100) })); pv.position.set(s * 5.8, 0.09, -40); pv.receiveShadow = true; street.add(pv); }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), toon(0x3a3a48)); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; scene.add(ground);
  const windows = []; const houses = [];
  for (const side of [-1, 1]) for (let i = 0; i < 16; i++) { const hs = house(i + (side > 0 ? 3 : 0), side, windows); hs.position.set(side * 7.1, 0.18, 12 - i * 4.25); hs.rotation.y = 0; street.add(hs); houses.push(hs); }
  const lamps = []; for (let z = 8; z > -60; z -= 11) for (const s of [-1, 1]) { const l = gasLamp(); l.position.set(s * 4.9, 0.18, z + (s > 0 ? 5 : 0)); street.add(l); lamps.push(l); }
  const lampLights = [8, -14, -36].map((z, i) => { const l = new THREE.PointLight(0xffc070, 8, 14, 1.3); l.position.set(i % 2 ? 4.9 : -4.9, 3.8, z); street.add(l); return l; });
  // factory at the end of the street
  const fac = new THREE.Group(); fac.position.set(0, 0, -72); street.add(fac);
  const fb = new THREE.Mesh(new THREE.BoxGeometry(30, 12, 10), toon(0xffffff, { map: tiled(brickTex('#9a3a2a'), 6, 3) })); fb.position.y = 6; outline(fb, 0.1); fac.add(fb);
  for (let k = 0; k < 6; k++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3), new THREE.MeshStandardMaterial({ color: 0x2a3048, emissive: 0xffc070, emissiveIntensity: 0.0 })); w.position.set(-12.5 + k * 5, 8, 5.02); fac.add(w); }
  const tower = new THREE.Mesh(new THREE.BoxGeometry(5, 10, 5), toon(0xffffff, { map: tiled(brickTex('#8a3426'), 2, 3) })); tower.position.set(0, 17, 0); outline(tower, 0.08); fac.add(tower);
  const tRoof = new THREE.Mesh(new THREE.ConeGeometry(4, 4, 4), toon(0x2a5a4a)); tRoof.rotation.y = Math.PI / 4; tRoof.position.set(0, 24, 0); outline(tRoof, 0.08); fac.add(tRoof);
  const clock = clockFace(); const cf = new THREE.Mesh(new THREE.CircleGeometry(1.8, 32), new THREE.MeshBasicMaterial({ map: clock.tex })); cf.position.set(0, 18, 2.52); fac.add(cf);
  const gate = new THREE.Group(); for (const s of [-1, 1]) { const gd = box(2.6, 4.4, 0.2, 0x2f6a48, [s * 1.3, 2.2, 0], 0.02); gate.add(gd); } gate.position.set(0, 0, 5.15); fac.add(gate);
  const gateLamp = new THREE.PointLight(0xffc880, 30, 16, 1.2); gateLamp.position.set(0, 6.5, 9); fac.add(gateLamp); for (const s of [-1, 1]) { const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,230,160,0.9)', 'rgba(255,170,80,0)'), blending: THREE.AdditiveBlending, depthWrite: false })); gl.position.set(s * 3.6, 4.6, 5.6); gl.scale.setScalar(2.2); fac.add(gl); fac.add(box(0.4, 0.5, 0.4, 0xffe6a0, [s * 3.6, 4.6, 5.4], 0.02)); }
  const signF = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.4), new THREE.MeshStandardMaterial({ map: canvasTex(512, 72, (c) => { c.fillStyle = '#f4e6c0'; c.fillRect(0, 0, 512, 72); c.strokeStyle = INK; c.lineWidth = 8; c.strokeRect(4, 4, 504, 64); c.fillStyle = '#3a2410'; c.font = '900 46px serif'; c.textAlign = 'center'; c.fillText('BOW STREET MILL', 256, 54); }) })); signF.position.set(0, 5.4, 5.03); fac.add(signF);
  const chims = [-11, 11].map((x) => { const cm = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.4, 20, 16), toon(0xffffff, { map: tiled(brickTex('#8a3426'), 2, 6) })); cm.position.set(x, 18, -2); outline(cm, 0.08); fac.add(cm); return cm; });
  const smokeTex = canvasTex(128, 128, (c) => { c.fillStyle = 'rgba(80,70,90,0)'; c.fillRect(0, 0, 128, 128); c.fillStyle = '#e8d8e0'; c.beginPath(); c.arc(64, 64, 52, 0, 7); c.fill(); c.lineWidth = 6; c.strokeStyle = '#3a3048'; c.stroke(); });
  const smoke = []; for (let i = 0; i < 16; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false })); fac.add(s); smoke.push(s); }
  // peas
  const peaM = toon(0x7ac83a); const peas = []; for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), peaM); p.visible = false; outline(p, 0.012); scene.add(p); peas.push(p); }

  // ===== BEDROOM =====
  const bed = new THREE.Group(); bed.position.x = BED_X; scene.add(bed);
  const wall = toon(0xffffff, { map: tiled(canvasTex(128, 128, (c) => { c.fillStyle = '#7ac8c0'; c.fillRect(0, 0, 128, 128); c.fillStyle = '#8ad8d0'; c.fillRect(0, 0, 64, 128); for (let i = 0; i < 4; i++) { c.fillStyle = '#f2a8b8'; c.beginPath(); c.arc(32, 16 + i * 32, 7, 0, 7); c.fill(); c.fillStyle = '#f8e8a0'; c.beginPath(); c.arc(32, 16 + i * 32, 3, 0, 7); c.fill(); } }), 6, 3) });
  for (const [w, h, d, x, y, z] of [[7, 4, 0.2, 0, 2, -2.6], [0.2, 4, 7, -3.5, 2, 0.8], [0.2, 4, 7, 3.5, 2, 0.8], [7, 0.2, 7, 0, 4, 0.8]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wall); m.position.set(x, y, z); m.receiveShadow = true; bed.add(m); }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), toon(0xffffff, { map: tiled(canvasTex(128, 128, (c) => { c.fillStyle = '#9a6a3a'; c.fillRect(0, 0, 128, 128); c.strokeStyle = '#6a4220'; c.lineWidth = 3; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(0, i * 16); c.lineTo(128, i * 16); c.stroke(); } }), 3, 3) })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 0.8); floor.receiveShadow = true; bed.add(floor);
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.4, 24), toon(0xd84a6a)); rug.rotation.x = -Math.PI / 2; rug.position.set(1.4, 0.01, 1.6); bed.add(rug);
  // bed: frame, pillow, patchwork quilt
  bed.add(box(2.4, 0.5, 3.2, 0x7a4a2a, [-0.6, 0.35, -0.8], 0.04)); bed.add(box(2.5, 1.6, 0.2, 0x7a4a2a, [-0.6, 0.8, -2.45], 0.04));
  const pillow = box(1.6, 0.35, 0.6, 0xffffff, [-0.6, 0.8, -2.0], 0.03); bed.add(pillow);
  const quilt = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.42, 2.4), toon(0xffffff, { map: canvasTex(128, 128, (c) => { const cols = ['#e84a6a', '#f2c23a', '#3a8ad8', '#7ac83a', '#f4ecdc', '#c87ae8']; for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { c.fillStyle = cols[(r * 3 + k) % 6]; c.fillRect(k * 32, r * 32, 32, 32); } c.strokeStyle = '#f8f4ec'; c.lineWidth = 3; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32, 128); c.moveTo(0, i * 32); c.lineTo(128, i * 32); c.stroke(); } }) })); quilt.position.set(-0.6, 0.78, -0.35); quilt.castShadow = true; outline(quilt, 0.03); bed.add(quilt);
  // window in the back wall with dawn outside
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.7), new THREE.MeshBasicMaterial({ map: canvasTex(128, 136, (c) => { const g = c.createLinearGradient(0, 0, 0, 136); g.addColorStop(0, '#3a4a9a'); g.addColorStop(0.7, '#ffa878'); g.addColorStop(1, '#ffd8a0'); c.fillStyle = g; c.fillRect(0, 0, 128, 136); c.fillStyle = '#4a4250'; for (let k = 0; k < 4; k++) c.fillRect(k * 34, 100 - (k % 2) * 20, 30, 40); c.fillStyle = '#ffe6a0'; c.fillRect(10, 110, 8, 8); }) }));
  outside.position.set(1.5, 2.3, -2.48); bed.add(outside);
  const wbars = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 1.85), new THREE.MeshBasicMaterial({ map: canvasTex(70, 74, (c) => { c.clearRect(0, 0, 70, 74); c.fillStyle = '#f8f4ec'; c.fillRect(0, 0, 70, 6); c.fillRect(0, 68, 70, 6); c.fillRect(0, 0, 6, 74); c.fillRect(64, 0, 6, 74); c.fillRect(32, 0, 6, 74); c.fillRect(0, 34, 70, 6); c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.moveTo(10, 30); c.lineTo(24, 8); c.lineTo(28, 8); c.lineTo(14, 30); c.fill(); }), transparent: true })); wbars.position.set(1.5, 2.3, -2.46); bed.add(wbars);
  const curtains = [-1, 1].map((s) => { const c = box(0.5, 2.1, 0.06, 0xe8701a, [1.5 + s * 1.05, 2.4, -2.42], 0.02); bed.add(c); return c; });
  const lampB = new THREE.PointLight(0xffd8a0, 4, 9, 1.4); lampB.position.set(-2.4, 2.4, 0.4); bed.add(lampB);
  const dawnLight = new THREE.SpotLight(0xffb888, 25, 10, 0.6, 0.8, 1.2); dawnLight.position.set(1.5, 2.4, -2.2); dawnLight.target.position.set(-0.6, 0.8, -0.5); bed.add(dawnLight, dawnLight.target);
  bed.add(box(0.7, 0.8, 0.6, 0x8a5a2a, [1.2, 0.4, -2.1], 0.03));
  const candle = box(0.08, 0.25, 0.08, 0xf8f0e0, [1.2, 0.92, -2.1], 0); bed.add(candle);

  return { scene, sky, hemi, sun, clouds, street, windows, houses, lamps, lampLights, fac, clock, gate, smoke, chims, peas, bed, sunDisc, ground };
}
