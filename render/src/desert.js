import * as THREE from 'three';
import { toon, outline, box, vnoise, hash, skyDome, cloudSprite, glowTexture, blobShadow, canvasTex } from './world.js';
import { Char } from './chars.js';

const SAND = 0xeab66b;
const WOOD = 0xb06e34, WOOD2 = 0x8c5226;
const STONE = 0xe6c088, STONE2 = 0xcf9f62;

export const ROPE_X = [-2.5, -0.85, 0.85, 2.5];
export const DECK_Y = 0.92;

function buildStatue() {
  const g = new THREE.Group();
  const S = (w, h, d, p, c = STONE) => g.add(box(w, h, d, c, p, 0.05));
  S(3.8, 0.6, 5.2, [0, DECK_Y + 0.3, -0.5], STONE2);
  S(3.4, 3.6, 2.2, [0, DECK_Y + 0.6 + 1.8, -2.1]);          // throne back
  S(2.6, 0.9, 2.8, [0, DECK_Y + 0.6 + 1.85, -0.2]);         // thighs
  S(2.5, 1.7, 0.95, [0, DECK_Y + 0.6 + 0.85, 1.2]);         // shins
  S(2.8, 0.32, 1.2, [0, DECK_Y + 0.6 + 0.16, 1.45], STONE2); // feet
  S(2.3, 2.6, 1.4, [0, DECK_Y + 3.2 + 1.3, -1.35]);         // torso
  S(3.3, 0.6, 1.35, [0, DECK_Y + 5.35, -1.35]);             // shoulders
  for (const s of [-1, 1]) {
    S(0.7, 2.2, 0.75, [s * 1.35, DECK_Y + 4.2, -1.3]);      // upper arms
    S(0.7, 0.62, 2.1, [s * 1.0, DECK_Y + 3.65, -0.15]);     // forearms on thighs
  }
  // head + painted nemes headdress
  const stripes = canvasTex(256, 256, (x) => { for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#2d58b0' : '#f0bf45'; x.fillRect(i * 16, 0, 16, 256); } });
  const nemesMat = toon(0xffffff, { map: stripes });
  const head = box(1.25, 1.45, 1.25, STONE, [0, DECK_Y + 6.4, -1.15], 0.05);
  g.add(head);
  const hd = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.75, 1.55), nemesMat); hd.position.set(0, DECK_Y + 7.2, -1.3); outline(hd, 0.05); hd.castShadow = true; g.add(hd);
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.7, 0.5), nemesMat); l.position.set(s * 0.82, DECK_Y + 6.05, -0.75); outline(l, 0.05); l.castShadow = true; g.add(l); }
  g.add(box(0.3, 0.7, 0.3, 0x2d58b0, [0, DECK_Y + 5.55, -0.45], 0.04)); // beard
  for (const s of [-1, 1]) {
    g.add(box(0.38, 0.17, 0.05, 0xffffff, [s * 0.3, DECK_Y + 6.6, -0.5], 0.025));
    g.add(box(0.13, 0.13, 0.05, 0x1a120c, [s * 0.3, DECK_Y + 6.6, -0.47], 0));
    g.add(box(0.42, 0.07, 0.05, 0x1a120c, [s * 0.3, DECK_Y + 6.82, -0.5], 0));
  }
  g.add(box(0.18, 0.34, 0.16, STONE2, [0, DECK_Y + 6.35, -0.45], 0.03));
  g.add(box(0.46, 0.07, 0.05, 0x7a3a22, [0, DECK_Y + 6.0, -0.5], 0));
  return g;
}

function buildSledge() {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    g.add(box(0.5, 0.5, 11, WOOD2, [s * 1.6, 0.25, 0], 0.04));
    const tip = box(0.5, 0.5, 1.3, WOOD2, [s * 1.6, 0.48, 5.95], 0.04); tip.rotation.x = -0.45; g.add(tip);
  }
  for (let z = -5; z <= 5; z += 2) g.add(box(4.3, 0.26, 0.42, WOOD, [0, 0.63, z], 0.03));
  g.add(box(4.0, 0.18, 10.6, WOOD, [0, 0.83, 0], 0.04));
  for (let x = -1.5; x <= 1.5; x += 0.75) g.add(box(0.04, 0.02, 10.6, WOOD2, [x, 0.93, 0], 0));
  g.add(box(5.9, 0.32, 0.38, WOOD2, [0, 0.52, 5.45], 0.04));
  g.add(buildStatue());
  // lashing ropes over the statue
  for (const z of [-0.2, 1.2]) g.add(box(3.0, 0.1, 0.12, 0xc9a46a, [0, DECK_Y + (z > 0 ? 1.75 : 2.85), z + 0.02], 0.02));
  return g;
}

function buildPalm(x, z, h, seed) {
  const g = new THREE.Group();
  let px = 0, py = 0;
  const bend = (hash(seed, 1) - 0.5) * 0.5;
  for (let i = 0; i < 6; i++) {
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.28 - i * 0.025, 0.32 - i * 0.025, h / 6, 8), toon(0x9a6a3a));
    const nx = px + bend * i * 0.4;
    seg.position.set(nx, py + h / 12, 0); seg.rotation.z = -bend * 0.4;
    outline(seg, 0.04); seg.castShadow = true; g.add(seg);
    px = nx; py += h / 6;
  }
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), toon(i % 2 ? 0x3fa34d : 0x2f8a3e));
    leaf.scale.set(2.3, 0.14, 0.55);
    const a = i / 7 * Math.PI * 2;
    const p = new THREE.Group(); p.position.set(px, py, 0); p.rotation.y = a;
    leaf.position.set(1.9, -0.35, 0); leaf.rotation.z = -0.35;
    outline(leaf, 0.06); leaf.castShadow = true;
    p.add(leaf); g.add(p);
  }
  g.position.set(x, 0, z);
  return g;
}

export function buildDesert() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xf6dcae, 70, 330);
  const sky = skyDome(0x1f5fd0, 0xbfe2ff, 0xf6dcae); scene.add(sky);
  scene.add(new THREE.HemisphereLight(0xcfe8ff, 0xe0a860, 1.25));
  const sun = new THREE.DirectionalLight(0xfff0d0, 2.6);
  sun.position.set(-40, 55, 45); sun.target.position.set(0, 0, 14);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 40, bottom: -30, near: 1, far: 200 });
  sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);

  // ground with dunes
  const gg = new THREE.PlaneGeometry(900, 900, 220, 220); gg.rotateX(-Math.PI / 2);
  const pos = gg.attributes.position; const col = [];
  const cA = new THREE.Color(0xf0c27a), cB = new THREE.Color(0xd99a52), tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const dPath = Math.max(0, Math.abs(x) - 14) + Math.max(0, -40 - z) * 0.6;
    const k = Math.min(1, dPath / 70);
    const n = vnoise(x * 0.025, z * 0.025) * 0.7 + vnoise(x * 0.07, z * 0.07) * 0.3;
    const y = k * (n * 16 - 3) + vnoise(x * 0.4, z * 0.4) * 0.12;
    pos.setY(i, y);
    tmp.copy(cA).lerp(cB, Math.min(1, Math.max(0, n * 0.9 - 0.1 + (1 - k) * 0.1)));
    col.push(tmp.r, tmp.g, tmp.b);
  }
  gg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); gg.computeVertexNormals();
  const ground = new THREE.Mesh(gg, toon(0xffffff, { vertexColors: true }));
  ground.receiveShadow = true; scene.add(ground);

  // pyramids & palms
  for (const [x, z, r, h] of [[-90, 210, 46, 62], [-20, 280, 58, 76], [85, 235, 36, 48], [140, 300, 30, 40]]) {
    const p = new THREE.Mesh(new THREE.ConeGeometry(r, h, 4), toon(0xf2cd8c));
    p.rotation.y = Math.PI / 4; p.position.set(x, h / 2 - 1, z); outline(p, 0.8); scene.add(p);
  }
  for (const [x, z, h, s] of [[16, 34, 7, 1], [-18, 52, 8, 2], [22, 70, 6.5, 3], [-24, 22, 7.5, 4], [30, 10, 6, 5], [-30, 80, 8, 6]]) scene.add(buildPalm(x, z, h, s));
  // clouds
  const clouds = [];
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2 + hash(i, 4);
    const c = cloudSprite(i, 18 + hash(i, 9) * 14);
    c.position.set(Math.sin(a) * 230, 55 + hash(i, 2) * 50, Math.cos(a) * 230);
    scene.add(c); clouds.push(c);
  }
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), fog: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  sunGlow.scale.set(120, 120, 1); sunGlow.position.copy(sun.position).normalize().multiplyScalar(380); scene.add(sunGlow);

  // sledge
  const sledge = new THREE.Group(); scene.add(sledge);
  sledge.add(buildSledge());

  // wet sand patch in front of the sledge + wet tracks behind
  const wetMat = new THREE.MeshPhongMaterial({ color: 0xa8713a, shininess: 90, specular: 0xfff0c0, transparent: true, opacity: 0.95 });
  const wet = new THREE.Mesh(new THREE.CircleGeometry(1, 32), wetMat);
  wet.rotation.x = -Math.PI / 2; wet.position.set(0.6, 0.03, 6.3); wet.scale.set(2.3, 1.0, 1);
  sledge.add(wet);
  const tracks = [];
  for (const s of [-1, 1]) {
    const t = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 1), wetMat); t.rotation.x = -Math.PI / 2; t.position.set(s * 1.6, 0.025, 0); scene.add(t); tracks.push(t);
  }

  // workers along 4 ropes: 4 x 43 = 172
  const hats = ['#f1ead8', '#d9e7f2', '#f1d38f', '#e9d2c0', '#cfe3c8', '#f3e6b8'];
  const skins = ['#b9774a', '#a8673e', '#c4855a'];
  const workers = [];
  const workerG = new THREE.Group(); sledge.add(workerG);
  ROPE_X.forEach((rx, ri) => {
    for (let k = 0; k < 43; k++) {
      const v = (ri * 43 + k) % 18;
      const c = new Char({ hat: 'khat', hatColor: hats[v % 6], skin: skins[v % 3], expr: 'neutral', pose: 'stand' }, 1.85);
      const side = k % 2 ? 0.34 : -0.34;
      c.base = new THREE.Vector3(rx + side, 0, 8.4 + k * 0.9 + (hash(ri, k) - 0.5) * 0.2);
      c.mesh.position.copy(c.base);
      c.phase = hash(k, ri) * 6.28;
      c.rope = ri; c.k = k;
      workerG.add(c.mesh);
      const sh = blobShadow(); sh.position.set(c.base.x, 0.02, c.base.z); workerG.add(sh);
      workers.push(c);
    }
  });

  // ropes
  const ropeMat = toon(0xa07a45);
  const ropes = ROPE_X.map(() => { const m = new THREE.Mesh(new THREE.BufferGeometry(), ropeMat); m.castShadow = true; sledge.add(m); return m; });
  let lastTension = -1;
  function updateRopes(tension) {
    if (Math.abs(tension - lastTension) < 0.01) return; lastTension = tension;
    ROPE_X.forEach((rx, i) => {
      const pts = [];
      for (let j = 0; j <= 40; j++) {
        const u = j / 40;
        const z = 5.6 + u * 40;
        const taut = 0.55 + (0.78 - 0.55) * Math.min(1, u * 8);
        const slack = 0.06 + 0.5 * Math.exp(-u * 30);
        pts.push(new THREE.Vector3(rx, slack + (taut - slack) * tension, z));
      }
      ropes[i].geometry.dispose();
      ropes[i].geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.055, 6, false);
    });
  }

  // hero, overseer
  const neferu = new Char({ hat: 'headband', collar: true, expr: 'bored', pose: 'pour' }, 1.95);
  neferu.mesh.position.set(0.95, DECK_Y, 4.95); sledge.add(neferu.mesh);
  const nsh = blobShadow(0.5, 0.3); nsh.position.set(0.95, DECK_Y + 0.02, 4.95); sledge.add(nsh);
  const overseer = new Char({ hat: 'nemes', outfit: 'robe', belly: true, expr: 'angry', pose: 'staff', staff: true, mustache: true }, 2.05);
  scene.add(overseer.mesh);
  const osh = blobShadow(0.55, 0.3); scene.add(osh);

  // water stream + splash
  const waterMat = new THREE.MeshBasicMaterial({ color: 0x8fe0ff, transparent: true, opacity: 0.9, fog: false });
  const stream = new THREE.Mesh(new THREE.BufferGeometry(), waterMat); scene.add(stream);
  const streamCore = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false })); scene.add(streamCore);
  const splash = new THREE.Group(); scene.add(splash);
  const dropGeo = new THREE.SphereGeometry(0.045, 8, 6);
  const dropMat = new THREE.MeshBasicMaterial({ color: 0xe9fbff });
  const drops = [];
  for (let i = 0; i < 22; i++) { const d = new THREE.Mesh(dropGeo, dropMat); splash.add(d); drops.push({ m: d, a: hash(i, 7) * 6.28, v: 0.8 + hash(i, 3) * 1.4, up: 1.2 + hash(i, 5) * 1.6, off: hash(i, 11) }); }
  const ripple = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.9, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }));
  ripple.rotation.x = -Math.PI / 2; splash.add(ripple);

  // reinforcements for the "what if" timeline
  const extra = [];
  const extraG = new THREE.Group(); scene.add(extraG);
  for (let r = 0; r < 4; r++) for (let k = 0; k < 24; k++) {
    const c = new Char({ hat: 'khat', hatColor: hats[(r + k) % 6], skin: skins[k % 3], expr: 'neutral', pose: 'walk1' }, 1.85);
    c.base = new THREE.Vector3(5.5 + r * 0.9, 0, 10 + k * 1.1);
    c.phase = hash(r, k + 50) * 6.28;
    extraG.add(c.mesh); extra.push(c);
  }
  extraG.visible = false;

  const dust = new THREE.Points(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 300 }, (_, i) => new THREE.Vector3((hash(i, 1) - 0.5) * 40, hash(i, 2) * 6, hash(i, 3) * 60 - 10))),
    new THREE.PointsMaterial({ color: 0xfff1d0, size: 0.06, transparent: true, opacity: 0.7 }));
  scene.add(dust);

  function setStream(on, t, from, to) {
    stream.visible = streamCore.visible = splash.visible = on;
    if (!on) return;
    const mid = from.clone().lerp(to, 0.5); mid.y = from.y + 0.05; mid.add(to.clone().sub(from).multiplyScalar(0.12).setY(0));
    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    const wob = 1 + Math.sin(t * 40) * 0.12;
    stream.geometry.dispose(); stream.geometry = new THREE.TubeGeometry(curve, 30, 0.045 * wob, 8, false);
    streamCore.geometry.dispose(); streamCore.geometry = new THREE.TubeGeometry(curve, 30, 0.016, 6, false);
    splash.position.copy(to);
    drops.forEach((d) => {
      const u = ((t * d.v + d.off) % 1);
      d.m.position.set(Math.cos(d.a) * u * 0.6, Math.max(0, u * d.up * 0.5 - u * u * d.up * 0.55) + 0.02, Math.sin(d.a) * u * 0.6);
      d.m.scale.setScalar(1 - u * 0.6);
    });
    const ru = (t * 1.6) % 1; ripple.scale.setScalar(0.25 + ru * 0.9); ripple.material.opacity = 0.8 * (1 - ru); ripple.position.y = 0.04;
  }

  return { scene, sun, sky, sledge, wet, tracks, workers, workerG, ropes, updateRopes, neferu, nsh, overseer, osh, setStream, extra, extraG, dust, clouds };
}
