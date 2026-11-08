// B-59 submarine interior, underwater set, night surface with destroyers.
import * as THREE from 'three';
import { toon, outline, box, hash, skyDome, glowTexture, canvasTex } from '../world.js';
import { normalTex } from '../effects.js';

export const UW_X = 300;     // underwater origin
export const SURF_X = -300;  // night surface origin
export const SURF_Y = 30;    // water surface height in the underwater set

function dialTex(label, maxTxt, redFrom = 0.75) {
  return canvasTex(256, 256, (c) => {
    c.fillStyle = '#f2ecd8'; c.beginPath(); c.arc(128, 128, 122, 0, 7); c.fill(); c.lineWidth = 12; c.strokeStyle = '#2a2a2a'; c.stroke();
    c.lineWidth = 16; c.strokeStyle = '#c8261c'; c.beginPath(); c.arc(128, 128, 92, Math.PI * 0.75 + Math.PI * 1.5 * redFrom, Math.PI * 2.25); c.stroke();
    c.strokeStyle = '#1a1a1a'; for (let i = 0; i <= 10; i++) { const a = Math.PI * 0.75 + i / 10 * Math.PI * 1.5; c.lineWidth = i % 5 ? 4 : 7; c.beginPath(); c.moveTo(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100); c.lineTo(128 + Math.cos(a) * 84, 128 + Math.sin(a) * 84); c.stroke(); }
    c.fillStyle = '#1a1a1a'; c.font = '700 26px sans-serif'; c.textAlign = 'center'; c.fillText(label, 128, 190); c.font = '700 20px sans-serif'; c.fillText(maxTxt, 128, 80);
  });
}
function gauge(r, label, maxTxt, redFrom) {
  const g = new THREE.Group();
  const face = new THREE.Mesh(new THREE.CircleGeometry(r, 32), new THREE.MeshStandardMaterial({ map: dialTex(label, maxTxt, redFrom), roughness: 0.3 })); face.position.z = 0.03; g.add(face);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.1, r * 1.1, 0.06, 32), toon(0xb8862a, { metalness: 0.8, roughness: 0.3 })); rim.rotation.x = Math.PI / 2; g.add(rim);
  const needle = new THREE.Group(); const nm = new THREE.Mesh(new THREE.BoxGeometry(r * 0.06, r * 0.8, 0.01), new THREE.MeshBasicMaterial({ color: 0x111111 })); nm.position.y = r * 0.35; needle.add(nm); needle.position.z = 0.05; g.add(needle);
  g.userData.set = (v) => { needle.rotation.z = -(Math.PI * 0.75 + v * Math.PI * 1.5) + Math.PI / 2 + Math.PI; };
  return g;
}
function valve(r, col = 0xc8261c) {
  const g = new THREE.Group(); const m = toon(col, { roughness: 0.4 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.12, 8, 24), m); g.add(ring);
  for (let k = 0; k < 3; k++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.07, r * 0.07, r * 2, 6), m); s.rotation.z = k * Math.PI / 3; g.add(s); }
  return g;
}
function cagedLamp() {
  const g = new THREE.Group();
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffd08a })); g.add(bulb);
  for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 4, 16, Math.PI), toon(0x2a2a2a)); b.rotation.y = k * Math.PI / 4; g.add(b); }
  g.userData.bulb = bulb; return g;
}
function subModel() {
  const g = new THREE.Group(); const hullM = toon(0x2a2e34, { roughness: 0.55, metalness: 0.3 });
  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(1.6, 20, 12, 24), hullM); hull.rotation.x = Math.PI / 2; hull.scale.set(1, 1, 0.9); outline(hull, 0.06); g.add(hull);
  const sail = new THREE.Mesh(new THREE.CapsuleGeometry(0.9, 3.4, 8, 16), hullM); sail.rotation.x = Math.PI / 2; sail.scale.set(0.6, 1, 1.4); sail.position.set(0, 2.1, 1.5); outline(sail, 0.05); g.add(sail);
  g.add(box(0.9, 0.6, 3.6, 0x2a2e34, [0, 2.7, 1.5], 0.04));
  for (let i = 0; i < 3; i++) g.add(box(0.08, 1.2 + i * 0.3, 0.08, 0x5a5e64, [0.15 * (i - 1), 3.2 + i * 0.15, 1.0 + i * 0.4], 0.01));
  for (const z of [8.5, -9]) for (const s of [-1, 1]) { const p = box(2.2, 0.1, 1.0, 0x2a2e34, [s * 1.6, -0.2, z], 0.03); g.add(p); }
  const prop = new THREE.Group(); for (let k = 0; k < 3; k++) { const b = box(0.12, 1.4, 0.4, 0x8a7a4a, [0, 0.55, 0], 0.02); const p = new THREE.Group(); p.add(b); p.rotation.z = k * Math.PI * 2 / 3; prop.add(p); } prop.position.set(0, 0, -11.6); g.add(prop);
  g.add(box(0.1, 2.0, 1.6, 0x2a2e34, [0, 0, -11], 0.03));
  const number = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.6), new THREE.MeshBasicMaterial({ map: canvasTex(256, 110, (c) => { c.clearRect(0, 0, 256, 110); c.fillStyle = '#e8e8e8'; c.font = '900 84px sans-serif'; c.fillText('Б-59', 6, 90); }), transparent: true })); number.position.set(0.47, 2.7, 1.8); number.rotation.y = Math.PI / 2; g.add(number);
  g.userData.prop = prop; return g;
}
function destroyer() {
  const g = new THREE.Group(); const grey = toon(0x7a8490, { roughness: 0.6 });
  const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(1.4, 0.4); shape.lineTo(1.6, 26); shape.lineTo(0, 30); shape.lineTo(-1.6, 26); shape.lineTo(-1.4, 0.4); shape.closePath();
  const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 3, bevelEnabled: false }), toon(0x5a646e)); hull.rotation.x = -Math.PI / 2; hull.position.set(0, -1.5, 15); outline(hull, 0.08); g.add(hull);
  g.add(box(2.4, 1.6, 7, 0x7a8490, [0, 2.3, 2], 0.05), box(1.8, 1.2, 3, 0x7a8490, [0, 3.6, 3], 0.05), box(1.2, 2.2, 1.2, 0x6a7480, [0, 3.2, -4], 0.04));
  const mast = box(0.15, 6, 0.15, 0x3a3e44, [0, 7, 3], 0.02); g.add(mast);
  for (const z of [10, -10]) { const t = box(1.3, 0.8, 1.6, 0x7a8490, [0, 2.0, z], 0.04); g.add(t); g.add(box(0.15, 0.15, 2.0, 0x3a3e44, [0, 2.2, z + (z > 0 ? 1.4 : -1.4)], 0.01)); }
  const num = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.2), new THREE.MeshBasicMaterial({ map: canvasTex(256, 140, (c) => { c.clearRect(0, 0, 256, 140); c.fillStyle = '#f4f4f4'; c.font = '900 110px sans-serif'; c.fillText('471', 18, 116); }), transparent: true, side: THREE.DoubleSide })); num.position.set(1.62, 0.6, 11); num.rotation.y = Math.PI / 2; g.add(num);
  return g;
}

export function buildSub() {
  const scene = new THREE.Scene();
  const hemi = new THREE.HemisphereLight(0xffe0b0, 0x2a2018, 0.3); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 300 }); sun.userData.dir = new THREE.Vector3(0.3, 1, 0.2).normalize(); scene.add(sun, sun.target);

  // ===== INTERIOR (control room z 4..-8, torpedo room z -8..-16) =====
  const inside = new THREE.Group(); scene.add(inside);
  const ribTex = canvasTex(512, 512, (c) => { c.fillStyle = '#a8b29a'; c.fillRect(0, 0, 512, 512); for (let i = 0; i < 1600; i++) { c.fillStyle = `rgba(${hash(i, 1) > 0.5 ? '90,70,40' : '255,255,255'},${hash(i, 2) * 0.08})`; c.fillRect(hash(i, 3) * 512, hash(i, 4) * 512, 4 + hash(i, 5) * 20, 3); } c.fillStyle = 'rgba(0,0,0,0.25)'; for (let x = 0; x < 512; x += 64) c.fillRect(x, 0, 6, 512); for (let i = 0; i < 30; i++) { c.fillStyle = '#5a5a4a'; c.beginPath(); c.arc(hash(i, 7) * 512, hash(i, 8) * 512, 4, 0, 7); c.fill(); } });
  ribTex.wrapS = ribTex.wrapT = THREE.RepeatWrapping; ribTex.repeat.set(6, 3);
  const hullIn = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 22, 32, 1, true), toon(0xffffff, { map: ribTex, side: THREE.BackSide, roughness: 0.55 })); hullIn.rotation.x = Math.PI / 2; hullIn.position.set(0, 1.5, -6); hullIn.receiveShadow = true; inside.add(hullIn);
  for (const z of [5, -17]) { const cap = new THREE.Mesh(new THREE.CircleGeometry(2.6, 32), toon(0x8a947c, { side: THREE.DoubleSide })); cap.position.set(0, 1.5, z); inside.add(cap); }
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 22), toon(0xffffff, { map: canvasTex(256, 256, (c) => { c.fillStyle = '#5a5e58'; c.fillRect(0, 0, 256, 256); c.strokeStyle = '#3a3e38'; c.lineWidth = 3; for (let i = 0; i < 256; i += 16) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 8, 256); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(256, i + 8); c.stroke(); } }), roughness: 0.4, metalness: 0.5 }));
  deck.material.map.wrapS = deck.material.map.wrapT = THREE.RepeatWrapping; deck.material.map.repeat.set(2, 10);
  deck.rotation.x = -Math.PI / 2; deck.position.set(0, 0, -6); deck.receiveShadow = true; inside.add(deck);
  for (let z = 4; z > -17; z -= 1.3) { const rib = new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.07, 6, 32, Math.PI * 1.45), toon(0x7a846c)); rib.position.set(0, 1.5, z); rib.rotation.z = -Math.PI * 0.225 + Math.PI / 2 - Math.PI * 0.5; inside.add(rib); }
  const pipeCols = [0x8a8e88, 0xb8261c, 0x3a7a4a, 0xd8b23a, 0x5a6aa8, 0x8a8e88];
  pipeCols.forEach((col, i) => { const a = Math.PI * (0.62 + i * 0.07); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06 + (i % 2) * 0.03, 0.06 + (i % 2) * 0.03, 22, 8), toon(col, { roughness: 0.4, metalness: 0.4 })); p.rotation.x = Math.PI / 2; p.position.set(Math.cos(a) * 2.35, 1.5 + Math.sin(a) * 2.35, -6); p.castShadow = true; inside.add(p); });
  pipeCols.forEach((col, i) => { const a = Math.PI * (0.38 - i * 0.07); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05 + (i % 3) * 0.02, 0.05 + (i % 3) * 0.02, 22, 8), toon(pipeCols[(i + 2) % 6], { roughness: 0.4, metalness: 0.4 })); p.rotation.x = Math.PI / 2; p.position.set(Math.cos(a) * 2.35, 1.5 + Math.sin(a) * 2.35, -6); inside.add(p); });
  // periscope + ladder + hatch
  const peri = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 4.2, 16), toon(0x6a6e68, { metalness: 0.6, roughness: 0.35 })); peri.position.set(0, 2.1, -2.2); peri.castShadow = true; inside.add(peri);
  const periBox = box(0.5, 0.35, 0.45, 0x5a5e58, [0, 1.6, -2.0], 0.02); inside.add(periBox); for (const s of [-1, 1]) inside.add(box(0.35, 0.06, 0.06, 0x2a2a2a, [s * 0.4, 1.6, -2.0], 0.01));
  for (const s of [-1, 1]) inside.add(box(0.05, 3.6, 0.05, 0x8a8e88, [-1.2 + s * 0.25, 1.8, -4.6], 0.01)); for (let y = 0.4; y < 3.6; y += 0.35) inside.add(box(0.5, 0.04, 0.04, 0x8a8e88, [-1.2, y, -4.6], 0));
  // panels with gauges + valves on both walls
  const gauges = [];
  for (let k = 0; k < 6; k++) {
    const side = k % 2 ? 1 : -1, z = 2.5 - Math.floor(k / 2) * 2.6;
    const panel = box(0.12, 1.4, 1.8, 0x6a7a6a, [side * 1.95, 1.5, z], 0.02); panel.rotation.z = side * 0.25; inside.add(panel);
    for (let j = 0; j < 3; j++) { const gg = gauge(0.17, ['ATM', 'V', 'МПа'][j], ['10', '220', '6'][j], 0.7); gg.position.set(side * 1.86, 1.75 - (j % 2) * 0.4, z - 0.55 + j * 0.55); gg.rotation.y = -side * Math.PI / 2; gg.rotation.x = 0; gg.rotateX(-side * 0.0); inside.add(gg); gauges.push(gg); gg.userData.set(0.3 + hash(k, j) * 0.4); }
    const v = valve(0.25, k % 3 === 0 ? 0xc8261c : 0x3a6a3a); v.position.set(side * 2.0, 2.6, z + 0.4); v.rotation.y = Math.PI / 2; inside.add(v);
  }
  const battery = gauge(0.32, 'БАТАРЕЯ', '100%', 0); battery.position.set(1.95, 1.9, 1.2); battery.rotation.y = -Math.PI / 2; inside.add(battery);
  const thermoTex = (v) => canvasTex(160, 512, (c) => { c.fillStyle = '#f2ecd8'; c.fillRect(0, 0, 160, 512); c.strokeStyle = '#3a2a1a'; c.lineWidth = 10; c.strokeRect(5, 5, 150, 502); c.fillStyle = '#d8d8d8'; c.fillRect(66, 40, 28, 380); c.fillStyle = '#c8261c'; c.beginPath(); c.arc(80, 450, 34, 0, 7); c.fill(); c.fillRect(70, 420 - v * 360, 20, v * 360 + 20); c.fillStyle = '#1a1a1a'; c.font = '700 24px sans-serif'; for (let i = 0; i <= 5; i++) { c.fillRect(100, 420 - i * 72, 20, 4); c.fillText(String(i * 10), 124, 428 - i * 72); } c.font = '900 28px sans-serif'; c.fillText('°C', 20, 490); });
  const thermo = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 1.35), new THREE.MeshStandardMaterial({ map: thermoTex(0.6), roughness: 0.6 })); thermo.position.set(-2.0, 1.7, 1.2); thermo.rotation.y = Math.PI / 2; inside.add(thermo);
  const thermoHot = thermoTex(0.92);
  // radio station
  inside.add(box(0.9, 0.08, 1.4, 0x6a4a2a, [1.55, 0.95, 3.6], 0.02));
  const radio = box(0.5, 0.7, 1.2, 0x4a5a4a, [1.85, 1.35, 3.6], 0.03); inside.add(radio);
  const radioFace = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), new THREE.MeshBasicMaterial({ map: canvasTex(256, 128, (c) => { c.fillStyle = '#2a3a2a'; c.fillRect(0, 0, 256, 128); c.fillStyle = '#ffcf5a'; c.fillRect(20, 20, 216, 36); c.fillStyle = '#1a1a1a'; for (let i = 0; i < 18; i++) c.fillRect(28 + i * 12, 30, 2, 16); for (let i = 0; i < 6; i++) { c.fillStyle = '#d8d8d8'; c.beginPath(); c.arc(36 + i * 38, 92, 12, 0, 7); c.fill(); } }) })); radioFace.position.set(1.59, 1.38, 3.6); radioFace.rotation.y = -Math.PI / 2; inside.add(radioFace);
  // bulkhead with oval door to torpedo room
  const bk = new THREE.Shape(); bk.absarc(0, 1.5, 2.6, 0, Math.PI * 2); const hole = new THREE.Path(); hole.absellipse(0, 1.3, 0.55, 0.9, 0, Math.PI * 2); bk.holes.push(hole);
  const bulk = new THREE.Mesh(new THREE.ShapeGeometry(bk, 32), toon(0x8a947c, { side: THREE.DoubleSide })); bulk.position.z = -7.8; inside.add(bulk);
  const rimDoor = new THREE.Mesh(new THREE.TorusGeometry(1, 0.07, 8, 32), toon(0x5a5e58)); rimDoor.scale.set(0.57, 0.92, 1); rimDoor.position.set(0, 1.3, -7.8); inside.add(rimDoor);
  // torpedo room
  for (let i = 0; i < 4; i++) { const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 24), toon(0x8a8e88, { metalness: 0.6, roughness: 0.3 })); tube.rotation.x = Math.PI / 2; tube.position.set((i % 2 ? 0.55 : -0.55), 1.0 + Math.floor(i / 2) * 0.9, -16.8); inside.add(tube); const door = new THREE.Mesh(new THREE.CircleGeometry(0.3, 24), toon(0x3a3e38)); door.position.set(tube.position.x, tube.position.y, -16.6); inside.add(door); }
  const torp = new THREE.Group();
  const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 6, 20), toon(0x5a6a5a, { metalness: 0.4, roughness: 0.4 })); tb.rotation.x = Math.PI / 2; outline(tb, 0.02); torp.add(tb);
  const tn = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon(0x5a6a5a)); tn.rotation.x = -Math.PI / 2; tn.position.z = -3; torp.add(tn);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.6, 20), toon(0xe8c22a)); band.rotation.x = Math.PI / 2; band.position.z = -1.6; torp.add(band);
  const trefoil = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: canvasTex(256, 256, (c) => { c.fillStyle = '#e8c22a'; c.fillRect(0, 0, 256, 256); c.fillStyle = '#111'; c.beginPath(); c.arc(128, 128, 22, 0, 7); c.fill(); for (let k = 0; k < 3; k++) { const a = k * Math.PI * 2 / 3 - Math.PI / 2; c.beginPath(); c.moveTo(128, 128); c.arc(128, 128, 110, a - 0.5, a + 0.5); c.closePath(); c.fill(); } c.fillStyle = '#e8c22a'; c.beginPath(); c.arc(128, 128, 36, 0, 7); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(128, 128, 22, 0, 7); c.fill(); }), transparent: true }));
  trefoil.position.set(0.285, 0, -1.6); trefoil.rotation.y = Math.PI / 2; torp.add(trefoil);
  for (const z of [1.5, -1]) torp.add(box(0.7, 0.3, 0.2, 0x3a3e38, [0, -0.35, z], 0.02));
  torp.position.set(0.55, 1.0, -12.5); inside.add(torp);
  // lights
  const lamps = [], lampLights = [];
  for (const z of [3, -1, -5, -11]) { const l = cagedLamp(); l.position.set(0, 3.7, z); inside.add(l); lamps.push(l); const L = new THREE.PointLight(0xffc070, 9, 9, 1.4); L.position.set(0, 3.3, z); L.castShadow = z === -1; inside.add(L); lampLights.push(L); }
  const redLight = new THREE.PointLight(0xff2a1a, 0, 14, 1.2); redLight.position.set(0, 3.0, -2); inside.add(redLight);
  const haze = new THREE.Points(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 500 }, (_, i) => new THREE.Vector3((hash(i, 1) - 0.5) * 4, hash(i, 2) * 3.6, 4 - hash(i, 3) * 20))), new THREE.PointsMaterial({ color: 0xffd8a0, size: 0.03, transparent: true, opacity: 0.6 })); inside.add(haze);

  // ===== UNDERWATER =====
  const uw = new THREE.Group(); uw.position.x = UW_X; scene.add(uw);
  const uwSky = skyDome(0x1a6a9a, 0x0a2a48, 0x020a14, 250); uwSky.position.x = 0; uw.add(uwSky);
  const nrm = normalTex(256, [[5, 1], [11, 0.5]], [1, 1], 3); nrm.repeat.set(8, 8);
  const surfMat = new THREE.MeshStandardMaterial({ color: 0x6ac0e8, roughness: 0.1, normalMap: nrm, side: THREE.DoubleSide, emissive: 0x2a6a8a, emissiveIntensity: 0.6 });
  const surfUW = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), surfMat); surfUW.rotation.x = -Math.PI / 2; surfUW.position.y = SURF_Y; uw.add(surfUW);
  const rayTex = canvasTex(64, 256, (c) => { const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(180,230,255,0.9)'); g.addColorStop(1, 'rgba(180,230,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 256); });
  const rays = []; for (let i = 0; i < 26; i++) { const r = new THREE.Mesh(new THREE.PlaneGeometry(2 + hash(i, 1) * 4, 60), new THREE.MeshBasicMaterial({ map: rayTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.12 + hash(i, 2) * 0.12, side: THREE.DoubleSide, fog: false })); r.position.set((hash(i, 3) - 0.5) * 80, SURF_Y - 30, (hash(i, 4) - 0.5) * 80); r.rotation.set(0.15, hash(i, 5) * 3, 0.2); uw.add(r); rays.push(r); }
  const motes = new THREE.Points(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 1500 }, (_, i) => new THREE.Vector3((hash(i, 1) - 0.5) * 60, (hash(i, 2) - 0.3) * 40, (hash(i, 3) - 0.5) * 60))), new THREE.PointsMaterial({ color: 0xbfe8ff, size: 0.08, transparent: true, opacity: 0.6 })); uw.add(motes);
  const sub = subModel(); uw.add(sub);
  const destroyersUW = []; for (const [x, z] of [[-6, 10], [10, -14]]) { const d = destroyer(); d.position.set(x, SURF_Y + 0.6, z); d.rotation.y = x > 0 ? 0.5 : -0.3; uw.add(d); destroyersUW.push(d); }
  const charges = []; for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.8, 12), toon(0x3a3e38)); outline(c, 0.03); c.visible = false; uw.add(c); charges.push(c); }
  const flashTex = glowTexture('rgba(255,255,240,1)', 'rgba(150,220,255,0)');
  const blasts = []; for (let i = 0; i < 6; i++) { const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: flashTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false })); f.visible = false; uw.add(f); const ring = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ color: 0xcfefff, transparent: true, opacity: 0.25, wireframe: false, depthWrite: false, side: THREE.DoubleSide })); ring.visible = false; uw.add(ring); blasts.push({ f, ring }); }
  const bubbleTex = canvasTex(64, 64, (c) => { c.strokeStyle = 'rgba(220,245,255,0.95)'; c.lineWidth = 5; c.beginPath(); c.arc(32, 32, 24, 0, 7); c.stroke(); c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.arc(24, 24, 6, 0, 7); c.fill(); });
  const bubbles = []; for (let i = 0; i < 160; i++) { const b = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex, transparent: true, depthWrite: false })); b.visible = false; uw.add(b); bubbles.push(b); }

  // ===== NIGHT SURFACE =====
  const surf = new THREE.Group(); surf.position.x = SURF_X; scene.add(surf);
  const nightSky = skyDome(0x050a1a, 0x1a2a4a, 0x1a2a4a, 400); surf.add(nightSky);
  const stars = new THREE.Points(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 1400 }, (_, i) => { const a = hash(i, 1) * Math.PI * 2, e = 0.05 + hash(i, 2) * 1.4; return new THREE.Vector3(Math.cos(a) * Math.cos(e) * 380, Math.sin(e) * 380, Math.sin(a) * Math.cos(e) * 380); })), new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: false, fog: false })); surf.add(stars);
  const seaN = normalTex(256, [[4, 1], [9, 0.5], [19, 0.25]], [1, 2], 3.5); seaN.repeat.set(20, 20);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.MeshStandardMaterial({ color: 0x0a2236, roughness: 0.12, metalness: 0.2, normalMap: seaN, normalScale: new THREE.Vector2(1.2, 1.2), envMapIntensity: 1.3 })); sea.rotation.x = -Math.PI / 2; sea.receiveShadow = true; surf.add(sea);
  const subS = subModel(); surf.add(subS);
  const foam = []; for (let i = 0; i < 120; i++) { const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0)'), transparent: true, depthWrite: false })); f.visible = false; surf.add(f); foam.push(f); }
  const destroyers = [], lights = [];
  for (const [x, z, ry] of [[-22, -18, 0.9], [24, -26, -0.7], [-8, -48, 1.4], [30, 12, -1.9]]) { const d = destroyer(); d.position.set(x, 0, z); d.rotation.y = ry; surf.add(d); destroyers.push(d);
    const sp = new THREE.SpotLight(0xfff4d8, 400, 120, 0.12, 0.4, 1.2); sp.position.set(0, 6.5, 4); d.add(sp); const tg = new THREE.Object3D(); surf.add(tg); sp.target = tg; sp.userData.tg = tg;
    const beamTex = canvasTex(64, 256, (c) => { const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,250,230,0.8)'); g.addColorStop(1, 'rgba(255,250,230,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 256); });
    const beam = new THREE.Mesh(new THREE.ConeGeometry(4.5, 60, 24, 1, true), new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, opacity: 0.12, fog: false })); beam.geometry.translate(0, -30, 0); beam.geometry.rotateX(Math.PI); surf.add(beam);
    const lens = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,255,240,1)', 'rgba(255,240,200,0)'), blending: THREE.AdditiveBlending, depthWrite: false })); lens.scale.setScalar(5); surf.add(lens);
    lights.push({ sp, tg, beam, lens, d });
  }
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,250,230,1)', 'rgba(150,180,255,0)'), fog: false, depthWrite: false })); moon.position.set(SURF_X - 80, 90, -250); moon.scale.setScalar(45); scene.add(moon);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(8, 22, 1, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0xf4f8ff, roughness: 0.9, emissive: 0x8a9aaa, emissiveIntensity: 0.5, side: THREE.DoubleSide })); column.geometry.translate(0, 0.5, 0); column.visible = false; surf.add(column);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xf4f8ff, emissive: 0xffffff, emissiveIntensity: 0.8, roughness: 1 })); dome.visible = false; surf.add(dome);

  return { scene, hemi, sun, inside, gauges, battery, thermo, thermoHot, torp, lamps, lampLights, redLight, haze, uw, surfMat, nrm, rays, motes, sub, destroyersUW, charges, blasts, bubbles, surf, sea, seaN, subS, foam, destroyers, lights, moon, column, dome };
}
