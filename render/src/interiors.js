import * as THREE from 'three';
import { toon, outline, box, hash, skyDome, glowTexture, canvasTex, blobShadow } from './world.js';
import { Char } from './chars.js';

// ---------- Egyptian mural ----------
export const MURAL_W = 2400, MURAL_H = 1000;
export const HERO_PX = [1125, 690];

function egy(x, ctx, X, base, s, o = {}) {
  // profile figure facing right
  const c = ctx; c.save(); c.translate(X, base); c.scale(s, s);
  const skin = o.skin || '#a5502b';
  c.lineWidth = 4; c.strokeStyle = '#2a1a10'; c.lineJoin = 'round';
  // legs (striding)
  c.fillStyle = skin;
  c.beginPath(); c.moveTo(-8, -70); c.lineTo(-30, 0); c.lineTo(-18, 0); c.lineTo(2, -60); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(4, -70); c.lineTo(26, 0); c.lineTo(38, 0); c.lineTo(16, -66); c.closePath(); c.fill(); c.stroke();
  // kilt
  c.fillStyle = '#f5efe0'; c.beginPath(); c.moveTo(-16, -96); c.lineTo(22, -96); c.lineTo(30, -58); c.lineTo(-20, -58); c.closePath(); c.fill(); c.stroke();
  // torso (frontal shoulders)
  c.fillStyle = skin; c.beginPath(); c.moveTo(-22, -150); c.lineTo(26, -150); c.lineTo(16, -96); c.lineTo(-12, -96); c.closePath(); c.fill(); c.stroke();
  // arms
  c.lineWidth = 11; c.strokeStyle = '#2a1a10'; c.lineCap = 'round';
  const arm = (pts) => { c.beginPath(); c.moveTo(...pts[0]); for (const p of pts.slice(1)) c.lineTo(...p); c.lineWidth = 12; c.strokeStyle = '#2a1a10'; c.stroke(); c.lineWidth = 6; c.strokeStyle = skin; c.stroke(); };
  if (o.pose === 'pour') { arm([[18, -142], [46, -170], [62, -190]]); arm([[-14, -142], [24, -160], [50, -182]]); }
  else { arm([[20, -142], [52, -118], [80, -112]]); arm([[-16, -142], [30, -120], [76, -108]]); }
  // head + wig
  c.lineWidth = 4; c.strokeStyle = '#2a1a10';
  c.fillStyle = skin; c.beginPath(); c.ellipse(4, -178, 22, 25, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(24, -184); c.lineTo(32, -176); c.lineTo(24, -172); c.fill(); c.stroke();
  c.fillStyle = '#1c1612'; c.beginPath(); c.moveTo(-22, -150); c.quadraticCurveTo(-30, -205, 6, -206); c.quadraticCurveTo(26, -205, 22, -190); c.lineTo(-2, -188); c.lineTo(-6, -156); c.closePath(); c.fill();
  if (o.band) { c.fillStyle = '#1fb3a6'; c.fillRect(-24, -196, 46, 7); }
  // eye
  if (o.wink) { c.lineWidth = 4; c.beginPath(); c.moveTo(6, -182); c.quadraticCurveTo(13, -176, 20, -182); c.stroke(); }
  else { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(13, -182, 7, 4, 0, 0, Math.PI * 2); c.fill(); c.stroke(); c.fillStyle = '#111'; c.beginPath(); c.arc(14, -182, 2.6, 0, 7); c.fill(); }
  c.restore();
}

function egyJug(c, x, y, rot) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = '#c4572e'; c.strokeStyle = '#2a1a10'; c.lineWidth = 4;
  c.beginPath(); c.ellipse(0, 0, 18, 24, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillRect(-7, -36, 14, 14); c.strokeRect(-7, -36, 14, 14);
  c.restore();
}

function glyphs(c, x0, y0, w, h, seed) {
  c.strokeStyle = '#2b4d8f'; c.fillStyle = '#2b4d8f'; c.lineWidth = 5;
  let i = 0;
  for (let y = y0; y < y0 + h - 40; y += 56) for (let x = x0; x < x0 + w - 30; x += 58) {
    const k = Math.floor(hash(seed + x, y + i++) * 7);
    c.save(); c.translate(x + 22, y + 22);
    c.fillStyle = k % 2 ? '#2b4d8f' : '#a33a24'; c.strokeStyle = c.fillStyle;
    if (k === 0) { c.beginPath(); c.arc(0, 0, 14, 0, 7); c.stroke(); c.beginPath(); c.arc(0, 0, 4, 0, 7); c.fill(); }
    else if (k === 1) { c.beginPath(); for (let j = 0; j < 4; j++) c.lineTo(-18 + j * 12, j % 2 ? -8 : 8); c.stroke(); }
    else if (k === 2) { c.beginPath(); c.ellipse(0, -10, 8, 11, 0, 0, 7); c.stroke(); c.fillRect(-2, 0, 4, 20); c.fillRect(-12, 2, 24, 4); }
    else if (k === 3) { c.beginPath(); c.ellipse(0, 4, 16, 10, 0, 0, 7); c.fill(); c.beginPath(); c.arc(12, -8, 6, 0, 7); c.fill(); c.fillRect(-20, 10, 4, 10); }
    else if (k === 4) { c.fillRect(-16, -4, 32, 8); }
    else if (k === 5) { c.beginPath(); c.moveTo(-14, 14); c.lineTo(0, -16); c.lineTo(14, 14); c.closePath(); c.stroke(); }
    else { c.beginPath(); c.moveTo(-14, -14); c.quadraticCurveTo(14, -14, 14, 14); c.stroke(); }
    c.restore();
  }
}

export function drawMural(ctx, wink) {
  const c = ctx, W = MURAL_W, H = MURAL_H;
  c.fillStyle = '#e8d1a0'; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 2500; i++) { c.fillStyle = `rgba(120,80,40,${hash(i, 9) * 0.08})`; c.fillRect(hash(i, 1) * W, hash(i, 2) * H, 3 + hash(i, 3) * 10, 2 + hash(i, 4) * 6); }
  // borders
  const band = (y) => { const cols = ['#2b4d8f', '#e8d1a0', '#a33a24', '#e8d1a0', '#d9a531']; for (let x = 0; x < W; x += 40) { c.fillStyle = cols[(x / 40) % 5]; c.fillRect(x, y, 40, 34); } c.fillStyle = '#2a1a10'; c.fillRect(0, y, W, 4); c.fillRect(0, y + 30, W, 4); };
  band(0); band(H - 34);
  glyphs(c, 40, 60, 380, 880, 3);
  c.fillStyle = '#2a1a10'; c.fillRect(440, 50, 6, 900);
  // ground lines (registers)
  c.fillStyle = '#5a3a20';
  for (const y of [400, 610, 850]) c.fillRect(1180, y, 1180, 6);
  c.fillRect(480, 850, 700, 6);
  // sledge
  c.fillStyle = '#9a5a26'; c.strokeStyle = '#2a1a10'; c.lineWidth = 5;
  c.beginPath(); c.moveTo(500, 790); c.lineTo(1110, 790); c.quadraticCurveTo(1170, 790, 1180, 750); c.lineTo(1190, 760); c.quadraticCurveTo(1180, 830, 1110, 832); c.lineTo(500, 832); c.closePath(); c.fill(); c.stroke();
  // colossal statue (profile, seated, facing right)
  const st = '#e3bf86';
  c.fillStyle = st;
  c.beginPath(); c.rect(560, 470, 140, 320); c.fill(); c.stroke();                 // throne
  c.beginPath(); c.rect(640, 300, 150, 190); c.fill(); c.stroke();                 // torso
  c.beginPath(); c.rect(690, 470, 260, 90); c.fill(); c.stroke();                  // thighs
  c.beginPath(); c.rect(880, 540, 80, 230); c.fill(); c.stroke();                  // shins
  c.beginPath(); c.rect(870, 760, 130, 30); c.fill(); c.stroke();                  // feet
  c.beginPath(); c.rect(760, 380, 160, 50); c.fill(); c.stroke();                  // forearm
  c.beginPath(); c.ellipse(730, 230, 70, 80, 0, 0, 7); c.fill(); c.stroke();      // head
  c.save(); c.beginPath(); c.moveTo(650, 150); c.quadraticCurveTo(720, 110, 790, 170); c.lineTo(760, 230); c.lineTo(700, 210); c.lineTo(670, 340); c.lineTo(630, 340); c.closePath(); c.clip();
  for (let i = 0; i < 20; i++) { c.fillStyle = i % 2 ? '#2b4d8f' : '#d9a531'; c.fillRect(600, 100 + i * 14, 220, 14); } c.restore();
  c.beginPath(); c.moveTo(650, 150); c.quadraticCurveTo(720, 110, 790, 170); c.lineTo(760, 230); c.lineTo(700, 210); c.lineTo(670, 340); c.lineTo(630, 340); c.closePath(); c.stroke();
  c.fillStyle = '#fff'; c.beginPath(); c.ellipse(772, 226, 12, 6, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#111'; c.beginPath(); c.arc(775, 226, 4, 0, 7); c.fill();
  c.fillStyle = '#2b4d8f'; c.fillRect(770, 300, 18, 50);
  // ropes + 3 rows of workers
  c.strokeStyle = '#6b4a22'; c.lineWidth = 6;
  for (const [y0, base] of [[770, 400], [780, 610], [800, 850]]) {
    c.beginPath(); c.moveTo(1185, y0); c.quadraticCurveTo(1240, base - 108, 1290, base - 108); c.lineTo(2360, base - 108); c.stroke();
    for (let x = 1300; x < 2350; x += 62) egy(0, c, x, base, 0.62, { skin: hash(x, base) > 0.5 ? '#a5502b' : '#8f4424' });
  }
  // the water man standing at the front of the sledge, pouring
  egy(0, c, 1110, 790, 0.95, { pose: 'pour', band: true, wink });
  egyJug(c, 1176, 600, 2.2);
  c.strokeStyle = '#2b6fd0'; c.lineWidth = 5;
  for (let j = 0; j < 3; j++) { c.beginPath(); c.moveTo(1190 + j * 6, 610); for (let k = 1; k < 9; k++) c.lineTo(1192 + j * 6 + (k % 2 ? 8 : -8), 610 + k * 22); c.stroke(); }
  // overseer behind (small, angry)
  egy(0, c, 1030, 380 + 470, 0.0001, {}); // spacer no-op
  c.strokeStyle = '#a33a24'; c.lineWidth = 3; c.font = 'bold 26px serif';
}

export function buildTomb() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a110a);
  scene.fog = new THREE.Fog(0x1a110a, 12, 34);
  scene.add(new THREE.HemisphereLight(0xfff0dc, 0x3a2a1a, 1.35));
  const stoneTex = canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#b38a5a'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#6f5030'; x.lineWidth = 6;
    for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) { x.strokeRect(k * 180 - (r % 2) * 90, r * 128, 180, 128); }
    for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(60,40,20,${hash(i, 3) * 0.12})`; x.fillRect(hash(i, 1) * w, hash(i, 2) * h, 4, 4); }
  });
  stoneTex.wrapS = stoneTex.wrapT = THREE.RepeatWrapping; stoneTex.repeat.set(3, 2);
  const wallMat = toon(0xffffff, { map: stoneTex });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), toon(0x7a5634)); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(26, 10), wallMat); back.position.set(0, 5, -5); scene.add(back);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wallMat); w.position.set(s * 10, 5, 4); w.rotation.y = -s * Math.PI / 2; scene.add(w); }
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), toon(0x3a2818)); ceil.rotation.x = Math.PI / 2; ceil.position.y = 9; scene.add(ceil);
  // mural
  const muralA = canvasTex(MURAL_W, MURAL_H, (x) => drawMural(x, false));
  const muralB = canvasTex(MURAL_W, MURAL_H, (x) => drawMural(x, true));
  const muralMat = toon(0xffffff, { map: muralA });
  const MW = 14.4, MH = 6;
  const mural = new THREE.Mesh(new THREE.PlaneGeometry(MW, MH), muralMat); mural.position.set(0, 4.1, -4.97); scene.add(mural);
  const frame = box(MW + 0.4, MH + 0.4, 0.1, 0x5a3a20, [0, 4.1, -5.03], 0); scene.add(frame);
  const muralPoint = (px, py) => new THREE.Vector3((px / MURAL_W - 0.5) * MW, 4.1 + (0.5 - py / MURAL_H) * MH, -4.95);
  // torches
  const flameTex = glowTexture('rgba(255,230,150,1)', 'rgba(255,90,0,0)');
  const torches = [];
  for (const x of [-8.2, 8.2]) {
    const handle = box(0.18, 1.1, 0.18, 0x5a3a20, [x, 3.6, -4.6], 0.03); scene.add(handle);
    const cup = box(0.5, 0.3, 0.5, 0x3a2a1a, [x, 4.2, -4.6], 0.03); scene.add(cup);
    const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    fl.position.set(x, 4.8, -4.5); fl.scale.set(1.4, 2.0, 1); scene.add(fl);
    const L = new THREE.PointLight(0xffa040, 22, 20, 1.4); L.position.set(x, 4.9, -3.6); scene.add(L);
    torches.push({ fl, L });
  }
  const arch = [
    new Char({ hat: 'pith', outfit: 'khaki', expr: 'neutral', pose: 'chin', mustache: true }, 1.9),
    new Char({ hat: 'pith', outfit: 'khaki', expr: 'neutral', pose: 'point', glasses: true, skin: '#e8b88a' }, 1.85),
  ];
  arch[0].mesh.position.set(-2.4, 0, -1.6); arch[1].mesh.position.set(2.2, 0, -1.2);
  for (const a of arch) { scene.add(a.mesh); const s = blobShadow(); s.position.set(a.mesh.position.x, 0.02, a.mesh.position.z); scene.add(s); }
  // speech bubble
  const bubbleTex = canvasTex(512, 256, (x) => {
    x.fillStyle = '#fff'; x.strokeStyle = '#141010'; x.lineWidth = 12;
    x.beginPath(); x.roundRect(20, 20, 470, 170, 70); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(140, 185); x.lineTo(110, 245); x.lineTo(200, 185); x.fill(); x.stroke();
    x.fillStyle = '#fff'; x.fillRect(130, 170, 80, 20);
    x.fillStyle = '#141010'; x.font = '900 84px Montserrat'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('RITUAL!', 255, 108);
  });
  const bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex, transparent: true, depthTest: false })); bubble.scale.set(2.0, 1.0, 1); scene.add(bubble);
  const dust = new THREE.Points(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 400 }, (_, i) => new THREE.Vector3((hash(i, 1) - 0.5) * 18, hash(i, 2) * 8, (hash(i, 3) - 0.5) * 12))),
    new THREE.PointsMaterial({ color: 0xffd9a0, size: 0.04, transparent: true, opacity: 0.8 }));
  scene.add(dust);
  return { scene, mural, muralMat, muralA, muralB, muralPoint, torches, arch, bubble, dust };
}

// ---------- Lab 2014 ----------
export function buildLab() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdfe9f3);
  scene.fog = new THREE.Fog(0xdfe9f3, 14, 40);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9fb3c8, 1.6));
  const d = new THREE.DirectionalLight(0xffffff, 1.6); d.position.set(4, 10, 8); d.castShadow = true; d.shadow.mapSize.set(1024, 1024);
  Object.assign(d.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); scene.add(d);
  const tiles = canvasTex(512, 512, (x) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#d5dfea' : '#eef3f8'; x.fillRect(i * 64, j * 64, 64, 64); } });
  tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(5, 5);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), toon(0xffffff, { map: tiles })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), toon(0xeef2f6)); back.position.set(0, 5, -4); scene.add(back);
  const win = box(3.4, 2.2, 0.1, 0x8fd0ff, [-3.6, 3.6, -3.95], 0.08, new THREE.MeshBasicMaterial({ color: 0x9fd8ff })); scene.add(win);
  scene.add(box(0.12, 2.2, 0.12, 0xffffff, [-3.6, 3.6, -3.88], 0.03), box(3.4, 0.12, 0.12, 0xffffff, [-3.6, 3.6, -3.88], 0.03));
  const board = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.1), toon(0xffffff, {
    map: canvasTex(840, 420, (x) => {
      x.fillStyle = '#1e5a46'; x.fillRect(0, 0, 840, 420); x.strokeStyle = '#8a5a2a'; x.lineWidth = 24; x.strokeRect(0, 0, 840, 420);
      x.fillStyle = '#fff'; x.font = '900 64px Montserrat'; x.textAlign = 'center'; x.fillText('AMSTERDAM · 2014', 420, 110);
      x.font = '700 46px Montserrat'; x.fillText('F = μ · N', 250, 230); x.fillText('dry sand vs. wet sand', 420, 330);
      x.strokeStyle = '#fff'; x.lineWidth = 6; x.beginPath(); x.moveTo(520, 250); x.lineTo(590, 200); x.lineTo(650, 240); x.lineTo(740, 180); x.stroke();
    })
  }));
  board.position.set(2.2, 3.7, -3.95); scene.add(board);
  // table
  scene.add(box(5.2, 0.16, 2.0, 0xf3f3f3, [0, 1.05, 0], 0.04));
  for (const x of [-2.4, 2.4]) for (const z of [-0.85, 0.85]) scene.add(box(0.12, 1.0, 0.12, 0x9aa7b5, [x, 0.5, z], 0.03));
  scene.add(box(3.6, 0.16, 1.1, 0x7a5a3a, [-0.4, 1.21, 0], 0.03));
  const sandL = box(1.7, 0.04, 0.95, 0xeac88a, [-1.27, 1.3, 0], 0); scene.add(sandL);
  const sandR = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.04, 0.95), new THREE.MeshPhongMaterial({ color: 0xb98445, shininess: 80, specular: 0xffeecc })); sandR.position.set(0.45, 1.3, 0); scene.add(sandR);
  const mini = new THREE.Group(); scene.add(mini);
  mini.add(box(0.5, 0.06, 0.08, 0x8c5226, [0, 0.03, -0.12], 0.012), box(0.5, 0.06, 0.08, 0x8c5226, [0, 0.03, 0.12], 0.012), box(0.44, 0.05, 0.34, 0xb06e34, [0, 0.09, 0], 0.012), box(0.26, 0.3, 0.26, 0xb9b9b9, [0, 0.26, 0], 0.015));
  mini.position.set(-0.3, 1.32, 0);
  // force gauge
  const gauge = new THREE.Group(); scene.add(gauge);
  gauge.position.set(2.15, 1.75, 0.05);
  const dialTex = canvasTex(512, 512, (x) => {
    x.fillStyle = '#fff'; x.beginPath(); x.arc(256, 256, 250, 0, 7); x.fill();
    x.strokeStyle = '#141010'; x.lineWidth = 18; x.beginPath(); x.arc(256, 256, 240, 0, 7); x.stroke();
    x.lineWidth = 26; x.strokeStyle = '#e04646'; x.beginPath(); x.arc(256, 256, 196, Math.PI * 1.75 - 0.6, Math.PI * 1.75 + 0.5); x.stroke();
    x.strokeStyle = '#3fbf6a'; x.beginPath(); x.arc(256, 256, 196, Math.PI * 0.75 + 0.75, Math.PI * 1.25 - 0.1); x.stroke();
    x.fillStyle = '#141010'; x.font = '800 40px Montserrat'; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI * 0.75 + i / 10 * Math.PI * 1.5;
      x.lineWidth = i % 5 ? 6 : 10; x.strokeStyle = '#141010';
      x.beginPath(); x.moveTo(256 + Math.cos(a) * 225, 256 + Math.sin(a) * 225); x.lineTo(256 + Math.cos(a) * (i % 5 ? 200 : 185), 256 + Math.sin(a) * (i % 5 ? 200 : 185)); x.stroke();
      if (i % 5 === 0) x.fillText(String(i * 10), 256 + Math.cos(a) * 145, 256 + Math.sin(a) * 145);
    }
    x.font = '900 46px Montserrat'; x.fillText('FORCE', 256, 380);
  });
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.42, 48), new THREE.MeshBasicMaterial({ map: dialTex })); dial.position.z = 0.051; gauge.add(dial);
  const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.1, 40), toon(0xe0a531)); housing.rotation.x = Math.PI / 2; outline(housing, 0.03); gauge.add(housing);
  const needle = new THREE.Group(); gauge.add(needle); needle.position.z = 0.07;
  const nm = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.34, 0.02), new THREE.MeshBasicMaterial({ color: 0xe02020 })); nm.position.y = 0.15; needle.add(nm);
  const hub = new THREE.Mesh(new THREE.CircleGeometry(0.045, 20), new THREE.MeshBasicMaterial({ color: 0x141010 })); hub.position.z = 0.08; gauge.add(hub);
  scene.add(box(0.1, 0.5, 0.1, 0x9aa7b5, [2.15, 1.35, 0.0], 0.02));
  const setGauge = (pct) => { needle.rotation.z = -(Math.PI * 0.75 + pct / 100 * Math.PI * 1.5) + Math.PI / 2 + Math.PI; };
  const string = box(2.2, 0.015, 0.015, 0x141010, [0.95, 1.55, 0], 0); scene.add(string);
  const phys = new Char({ outfit: 'labcoat', glasses: true, expr: 'neutral', pose: 'stand', skin: '#f0c9a0' }, 2.3);
  phys.mesh.position.set(-0.5, 0, -1.4); scene.add(phys.mesh);
  return { scene, mini, gauge, setGauge, phys, string };
}

// ---------- Macro sand grains ----------
export function buildMacro() {
  const scene = new THREE.Scene();
  scene.add(skyDome(0xf7d9a0, 0xe9a95c, 0xb06a30, 200));
  scene.fog = new THREE.Fog(0xe9a95c, 10, 34);
  scene.add(new THREE.HemisphereLight(0xfff0d8, 0x8a5a30, 1.3));
  const d = new THREE.DirectionalLight(0xfff2d8, 2.2); d.position.set(-6, 10, 6); scene.add(d);
  const cols = [0xf0c27a, 0xe0a55c, 0xf5d59a, 0xd28d4a, 0xe8b46c];
  const grains = [];
  for (let i = 0; i < 16; i++) for (let j = 0; j < 12; j++) {
    const r = 0.5 + hash(i, j) * 0.28;
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), toon(cols[(i * 7 + j) % 5], { flatShading: true }));
    m.position.set((i - 8) * 1.25 + (hash(j, i) - 0.5) * 0.4 + (j % 2) * 0.6, (hash(i + 3, j) - 0.5) * 0.4, (j - 8) * 1.2 + (hash(i, j + 5) - 0.5) * 0.4);
    m.rotation.set(hash(i, 1) * 6, hash(j, 2) * 6, 0);
    outline(m, 0.05); m.userData.r = r; m.userData.base = m.position.clone();
    scene.add(m); grains.push(m);
  }
  const bridgeMat = new THREE.MeshBasicMaterial({ color: 0x3fd0ff, transparent: true, opacity: 0.95 });
  const bridges = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (let a = 0; a < grains.length; a++) for (let b = a + 1; b < grains.length; b++) {
    const A = grains[a], B = grains[b];
    const dist = A.position.distanceTo(B.position);
    if (dist < A.userData.r + B.userData.r + 0.35) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, dist * 0.75, 10), bridgeMat);
      m.position.copy(A.position).lerp(B.position, 0.5);
      m.quaternion.setFromUnitVectors(up, B.position.clone().sub(A.position).normalize());
      m.userData.delay = hash(a, b);
      scene.add(m); bridges.push(m);
    }
  }
  const glowTex = glowTexture('rgba(200,245,255,1)', 'rgba(120,220,255,0)');
  const sparkles = bridges.filter((_, i) => i % 3 === 0).map((b) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); s.position.copy(b.position); s.scale.setScalar(0.9); scene.add(s); s.userData.delay = b.userData.delay; return s; });
  const runner = box(14, 0.9, 1.6, 0x8c5226, [0, 2.2, 0], 0.06); scene.add(runner);
  return { scene, grains, bridges, sparkles, runner };
}
