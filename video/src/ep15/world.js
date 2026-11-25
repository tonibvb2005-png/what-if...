// Folge 14 – DUELL Ruebezahl vs. Nachzehrer: Bergdorf im Schnee, Kirche mit Glocke, Friedhof, Fenster, Waldhang + 2D-Duell-Szenen
import * as THREE from 'three';
import * as C from '../chars.js';
import { tex, lam, box, sprite, setTex, glow, gradTex, V, L, clamp, sm, lerpV, look, billboard, shake, rnd, ease } from '../world.js';
import { W as CW, H as CH } from '../overlay.js';

const easeOut = t => 1 - Math.pow(1 - t, 3);
const back = t => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
function fov(cam, f) { if (cam.fov !== f) { cam.fov = f; cam.updateProjectionMatrix(); } }
const basic = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });
const hsh = n => { const x = Math.sin(n * 91.7) * 43758.5; return x - Math.floor(x); };
const GREEN = '#35d07a', RED = '#ff3b3b';
const FX = 100;                         // Waldhang liegt bei x = 100
const hF = z => Math.max(0, -z) * 0.22;  // Hoehe am Hang

function roofPrism(w, d, h, mat) { const s = new THREE.Shape(); s.moveTo(-w / 2 - 0.3, 0); s.lineTo(0, h); s.lineTo(w / 2 + 0.3, 0); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d + 0.4, bevelEnabled: false }); g.translate(0, 0, -(d + 0.4) / 2); return new THREE.Mesh(g, mat); }
function house(S, x, z, ry, w = 4, d = 4, h = 2.8, lit = true) { const G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = ry; S.add(G);
  G.add(box(w, h, d, lam(0x4a3a2e), 0, h / 2, 0)); const r = roofPrism(w, d, 1.8, lam(0xe6edf5)); r.position.y = h; G.add(r);
  const wm = basic(lit ? 0xffc870 : 0x101418); for (const dx of [-w / 4, w / 4]) G.add(box(0.7, 0.8, 0.12, wm, dx, 1.5, d / 2 + 0.03));
  G.add(box(0.8, 1.6, 0.12, lam(0x2a1c14), 0, 0.8, d / 2 + 0.03)); return G; }
function snowTex() { const c = C.cv(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return tex(c); }

function buildWorld() {
  const S = new THREE.Scene(); const BG = { night: gradTex([[0, '#020410'], [0.6, '#0b1430'], [1, '#1a2440']]), storm: gradTex([[0, '#3a4252'], [1, '#8c96a6']]) };
  S.background = BG.night; S.fog = new THREE.Fog(0x0a1226, 10, 70);
  const hemi = new THREE.HemisphereLight(0x7a8ab8, 0x1a1a22, 0.32); S.add(hemi);
  const moon = new THREE.DirectionalLight(0xa8b8e8, 0.7); moon.position.set(-20, 30, 10); S.add(moon);
  // Boden Dorf (flach) + Berge ringsum
  const vg = new THREE.PlaneGeometry(160, 160, 40, 40); vg.rotateX(-Math.PI / 2); const P = vg.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), d = Math.max(Math.abs(x) - 30, -z - 50, 0); P.setY(i, d > 0 ? d * 0.5 + rnd() * 1.5 : 0); } vg.computeVertexNormals();
  S.add(new THREE.Mesh(vg, lam(0xdfe7f2)));
  for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(14 + rnd() * 8, 22 + rnd() * 14, 6), lam(0x2a3448)); m.position.set(-60 + i * 15, 8, -95 - rnd() * 10); S.add(m);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(5, 8, 6), lam(0xe8eef6)); cap.position.set(m.position.x, m.position.y + m.geometry.parameters.height / 2 - 3.6, m.position.z); S.add(cap); }
  // Haeuser
  for (const [x, z, ry, lit] of [[-9, -6, 0.3, 1], [9, -8, -0.4, 1], [-14, -20, 0.2, 0], [13, -20, -0.2, 1], [-10, -34, 0.1, 1], [15, -36, -0.3, 0], [-20, -10, 0.5, 1], [22, -14, -0.5, 1]]) house(S, x, z, ry, 4, 4, 2.8, lit);
  // Kirche
  const ch = new THREE.Group(); ch.position.set(3, 0, -32); S.add(ch);
  ch.add(box(5, 4.5, 9, lam(0x8a8478), 0, 2.25, -3)); const cr = roofPrism(5, 9, 3, lam(0xe6edf5)); cr.position.set(0, 4.5, -3); ch.add(cr);
  ch.add(box(2.6, 8.5, 2.6, lam(0x8a8478), 0, 4.25, 2.2));
  for (const [dx, dz] of [[-1.15, 1.05], [1.15, 1.05], [-1.15, 3.35], [1.15, 3.35]]) ch.add(box(0.3, 2.6, 0.3, lam(0x7a7468), dx, 9.8, dz));
  ch.add(box(2.8, 0.3, 2.8, lam(0x6a6458), 0, 11.2, 2.2)); const sp = new THREE.Mesh(new THREE.ConeGeometry(1.9, 4.5, 4), lam(0x2e3a48)); sp.rotation.y = Math.PI / 4; sp.position.set(0, 13.6, 2.2); ch.add(sp);
  ch.add(box(0.12, 1.1, 0.12, lam(0x222222), 0, 16.3, 2.2), box(0.6, 0.12, 0.12, lam(0x222222), 0, 16.5, 2.2));
  const clockF = new THREE.Mesh(new THREE.CircleGeometry(0.6, 24), basic(0xf0e6c8)); clockF.position.set(0, 7, 3.52); ch.add(clockF);
  const hand = box(0.06, 0.5, 0.02, basic(0x111111), 0, 7.2, 3.56); ch.add(hand); ch.add(box(0.06, 0.4, 0.02, basic(0x111111), 0, 7.18, 3.57));
  ch.add(box(1.2, 2.2, 0.1, lam(0x2a1c14), 0, 1.1, 3.56));
  const bell = new THREE.Group(); bell.position.set(0, 10.9, 2.2); ch.add(bell);
  const bellM = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.62, 0.9, 16, 1, true), new THREE.MeshLambertMaterial({ color: 0x9a7a3a, side: THREE.DoubleSide })); bellM.position.y = -0.55; bell.add(bellM);
  const bTop = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 6, 0, 6.3, 0, 1.6), lam(0x9a7a3a)); bTop.position.y = -0.1; bell.add(bTop);
  const clap = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), lam(0x3a3a3a)); clap.position.y = -0.95; bell.add(clap);
  const graveL = new THREE.PointLight(0x9ab8ff, 4, 9, 1.4); graveL.position.set(2.2, 2.2, -12.5); S.add(graveL);
  const bellL = new THREE.PointLight(0xffc070, 3, 6, 1.5); bellL.position.set(3, 10.3, -29.8); S.add(bellL);
  // Friedhof
  const yard = new THREE.Group(); S.add(yard); const stone = lam(0x6a6c70), wood = lam(0x3a2a1e);
  for (let i = 0; i < 14; i++) { const x = -5 + (i % 5) * 2.4 + (rnd() - 0.5) * 0.4, z = -12 - Math.floor(i / 5) * 3 - rnd() * 0.5; if (Math.abs(x - 0.8) < 1.2 && Math.abs(z + 15) < 1.6) continue;
    if (i % 3 === 0) { yard.add(box(0.1, 1.1, 0.1, wood, x, 0.55, z), box(0.6, 0.1, 0.1, wood, x, 0.8, z)); } else { const s = box(0.6, 0.8, 0.14, stone, x, 0.4, z); s.rotation.z = (rnd() - 0.5) * 0.2; yard.add(s); } }
  for (let x = -7; x <= 7; x += 0.5) yard.add(box(0.06, 0.8, 0.06, lam(0x1a1a1a), x, 0.4, -9.5)); yard.add(box(14.2, 0.06, 0.06, lam(0x1a1a1a), 0, 0.7, -9.5));
  // frisches Grab
  const G0 = V(0.8, 0, -15); const mound = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, 6.3, 0, 1.4), lam(0x5a4636)); mound.scale.set(0.75, 0.32, 1.25); mound.position.copy(G0); S.add(mound);
  const gcross = new THREE.Group(); gcross.position.set(G0.x, 0, G0.z - 1.45); S.add(gcross); gcross.add(box(0.1, 1.3, 0.1, wood, 0, 0.65, 0), box(0.7, 0.1, 0.1, wood, 0, 0.95, 0));
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.55, 18), basic(0x050302)); hole.rotation.x = -Math.PI / 2; hole.scale.set(1, 1.5, 1); hole.position.set(G0.x, 0.33, G0.z); S.add(hole);
  const chunks = []; for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.04 + rnd() * 0.06), lam(i % 4 ? 0x5a4636 : 0xdfe7f2)); m.userData.v = V((rnd() - 0.5) * 3, 2.5 + rnd() * 3, (rnd() - 0.5) * 3); S.add(m); chunks.push(m); }
  // Zimmer mit Fenster (Blick nach -z auf Friedhof und Kirche), Wand bei z = 6
  const room = new THREE.Group(); S.add(room); const wallM = lam(0x5a4030);
  room.add(box(3.6, 6, 0.25, wallM, -2.4, 3, 6), box(3.6, 6, 0.25, wallM, 2.4, 3, 6), box(1.2, 0.5, 0.25, wallM, 0, 0.25, 6), box(1.2, 3.9, 0.25, wallM, 0, 4.05, 6));
  room.add(box(1.3, 0.08, 0.35, lam(0x3a2418), 0, 0.52, 6.05), box(1.2, 0.05, 0.27, lam(0x3a2418), 0, 1.55, 6));
  room.add(box(8, 0.1, 6, lam(0x3a2a20), 0, 0.0, 9)); room.add(box(8, 4, 0.2, wallM, 0, 2, 12)); room.add(box(0.2, 4, 6, wallM, -3.5, 2, 9), box(0.2, 4, 6, wallM, 3.5, 2, 9));
  const lampL = new THREE.PointLight(0xffb060, 3.5, 6, 1.5); lampL.position.set(1.4, 2.2, 8.4); S.add(lampL);
  // Waldhang bei x = 100
  const fg = new THREE.PlaneGeometry(70, 140, 30, 60); fg.rotateX(-Math.PI / 2); const FP = fg.attributes.position; for (let i = 0; i < FP.count; i++) { const z = FP.getZ(i) - 50; FP.setY(i, hF(z) + (Math.abs(FP.getX(i)) > 4 ? rnd() * 0.25 : 0)); FP.setZ(i, z); } fg.computeVertexNormals();
  const fgm = new THREE.Mesh(fg, lam(0xdfe7f2)); fgm.position.x = FX; S.add(fgm);
  const N = 340, cone = new THREE.InstancedMesh(new THREE.ConeGeometry(1.5, 5, 7), lam(0x1a2a26), N), cap = new THREE.InstancedMesh(new THREE.ConeGeometry(0.8, 1.6, 7), lam(0xe8eef6), N), trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.18, 0.24, 6, 6), lam(0x2a201a), N), M = new THREE.Matrix4(), Q = new THREE.Quaternion();
  for (let i = 0; i < N; i++) { let x, z; do { x = (rnd() - 0.5) * 60; z = 10 - rnd() * 120; } while (Math.abs(x) < 3.2); const s = 0.8 + rnd() * 0.7, y = hF(z);
    M.compose(V(FX + x, y + 3 * s, z), Q, V(s, s, s)); trunk.setMatrixAt(i, M); M.compose(V(FX + x, y + 4.4 * s + 1.5, z), Q, V(s, s, s)); cone.setMatrixAt(i, M); M.compose(V(FX + x, y + 6.6 * s + 1.5, z), Q, V(s, s, s)); cap.setMatrixAt(i, M); }
  S.add(trunk, cone, cap);
  // Figuren
  const T = { boyB: C.boy('back'), boyF: C.boy('front', 'neutral'), boyS: C.boy('front', 'scared_sweat'), boyC: C.boy('front', 'count'), boyH: C.boy('front', 'happy'), boyR: C.boy('front', 'closed'),
    nW: C.nachzehrer('walk'), nR: C.nachzehrer('reach'), nC: C.nachzehrer('crawl'), rCalm: C.ruebezahl('calm'), rAngry: C.ruebezahl('angry') };
  const mk = (tx, h, e) => { const s = sprite(T[tx], h, e); s.userData.noBB = true; s.children[0].visible = false; S.add(s); return s; };
  const boy = mk('boyB', 1.3), nach = mk('nW', 1.8, 0.2), giant = mk('rCalm', 26, 0.25);
  const eyes = [0, 1].map(() => { const e = glow(2.6, [140, 210, 255]); e.material.fog = false; S.add(e); return e; });
  const nEyes = [0, 1].map(() => { const e = glow(0.16, [230, 240, 200]); S.add(e); return e; });
  // Schnee
  const SN = 2600, sg = new THREE.BufferGeometry(), sp0 = new Float32Array(SN * 3); for (let i = 0; i < SN; i++) { sp0[i * 3] = (rnd() - 0.5) * 30; sp0[i * 3 + 1] = rnd() * 20; sp0[i * 3 + 2] = (rnd() - 0.5) * 30; }
  sg.setAttribute('position', new THREE.BufferAttribute(sp0.slice(), 3)); const snow = new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.09, map: snowTex(), transparent: true, depthWrite: false, opacity: 0.9 })); S.add(snow);
  return { S, BG, hemi, moon, bell, bellL, hand, mound, hole, G0, chunks, lampL, boy, nach, giant, eyes, nEyes, T, snow, sp0, cam: new THREE.PerspectiveCamera(50, 9 / 16, 0.05, 400) };
}
export function build() { return { D: buildWorld() }; }

function base(A, t, o = {}) {
  A.boy.visible = A.nach.visible = A.giant.visible = false; [...A.eyes, ...A.nEyes].forEach(e => e.visible = false); A.chunks.forEach(c => c.visible = false); A.hole.visible = false;
  A.boy.rotation.set(0, 0, 0); A.nach.rotation.set(0, 0, 0); A.giant.rotation.set(0, 0, 0); A.mound.scale.set(0.75, 0.32, 1.25);
  const storm = o.storm || 0; A.S.background = storm > 0.5 ? A.BG.storm : A.BG.night; A.S.fog.color.set(storm > 0.5 ? 0x8a94a4 : 0x0a1226); A.S.fog.near = L(10, 0.5, storm); A.S.fog.far = L(o.far ?? 70, 14, storm);
  A.hemi.intensity = storm > 0.5 ? 0.9 : 0.32; A.moon.intensity = storm > 0.5 ? 0.4 : 0.7; A.bell.rotation.z = o.bell ? Math.sin(t * 3.2) * 0.55 : 0; A.bellL.intensity = 3;
  A.hand.rotation.z = 0;
  // Schnee folgt der Kamera, faellt (und weht bei Sturm)
  const pa = A.snow.geometry.attributes.position, sp = 1.1 + storm * 4, wind = storm * 6 + (o.wind || 0.4);
  for (let i = 0; i < pa.count; i++) { const y0 = A.sp0[i * 3 + 1], x0 = A.sp0[i * 3]; pa.setY(i, ((y0 - t * sp) % 20 + 20) % 20 - 8); pa.setX(i, ((x0 + t * wind + Math.sin(t + i) * 0.3) % 30 + 45) % 30 - 15); }
  pa.needsUpdate = true; A.snow.material.size = storm > 0.5 ? 0.14 : 0.09; A.snow.visible = o.snow ?? true; A.snow.position.copy(A.cam.position);
}
function put(A, who, tx, x, y, z, ry = 0) { const s = A[who]; s.visible = true; setTex(s, A.T[tx]); s.position.set(x, y, z); s.rotation.y = ry; return s; }
function nachAt(A, t, x, y, z, ry = 0, eyes = true) { const k = Math.floor(t / 0.22); put(A, 'nach', hsh(k) > 0.5 ? 'nR' : 'nW', x, y, z, ry); A.nach.rotation.z = (hsh(k + 3) - 0.5) * 0.22;
  if (eyes) A.nEyes.forEach((e, i) => { e.visible = true; e.position.set(x + (i ? 1 : -1) * 0.12 * Math.cos(ry) + Math.sin(A.nach.rotation.z) * -0.4, y + 1.55, z + 0.05 - (i ? 1 : -1) * 0.12 * Math.sin(ry)); }); }
function giantAt(A, x, y, z, mood = 'calm', eyeK = 1, ry = 0) { put(A, 'giant', mood === 'angry' ? 'rAngry' : 'rCalm', x, y, z, ry); const col = mood === 'angry' ? [255, 70, 40] : [140, 210, 255];
  A.eyes.forEach((e, i) => { e.visible = eyeK > 0; e.material.color.setRGB(col[0] / 255, col[1] / 255, col[2] / 255); e.material.opacity = eyeK; e.position.set(x + (i ? 1.42 : -1.42), y + 20.1, z + 0.4); }); }

// ------------------------------------------------------------------ 2D-Bausteine (auch ueber 3D-Shots)
function pillBox(g, x, y, w, h, fill, stroke) { g.beginPath(); g.roundRect(x, y, w, h, 14); g.fillStyle = fill; g.fill(); if (stroke) { g.lineWidth = 3; g.strokeStyle = stroke; g.stroke(); } }
function counter(g, rows, t0 = 0) { g.save(); let y = 150; for (const r of rows) { const k = easeOut(clamp(r.k ?? 1)); g.globalAlpha = k; g.save(); g.translate((1 - k) * -40, 0);
  pillBox(g, 40, y, 400, 96, 'rgba(12,12,16,.86)', r.col || 'rgba(255,255,255,.7)'); g.fillStyle = r.col || '#e9b949'; g.font = '800 18px Montserrat'; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(r.k2, 62, y + 14);
  const pop = r.pop ? 1 + 0.25 * Math.max(0, 1 - r.pop) : 1; g.translate(62, y + 38); g.scale(pop, pop); g.fillStyle = '#fff'; g.font = '400 46px Anton'; g.fillText(r.v, 0, 0); g.restore(); y += 112; } g.restore(); }
function stamp(g, lines, k, col = RED, y = 620, rot = -0.08) { if (k <= 0) return; const s = L(2.2, 1, easeOut(clamp(k / 0.25))); g.save(); g.translate(CW / 2, y); g.rotate(rot); g.scale(s, s); g.globalAlpha = clamp(k * 4);
  g.font = '400 92px Anton'; const w = Math.max(...lines.map(l => g.measureText(l).width)) + 90, h = 60 + lines.length * 100; g.lineWidth = 12; g.strokeStyle = col; g.fillStyle = 'rgba(10,8,8,.55)'; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 18); g.fill(); g.stroke();
  g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; lines.forEach((l, i) => { g.font = i ? '400 60px Anton' : '400 92px Anton'; g.fillText(l, 0, -h / 2 + 80 + i * 100); }); g.restore(); }
function fightBar(g, v, k = 1) { if (k <= 0) return; g.save(); g.globalAlpha = clamp(k * 3); const x0 = 90, w = CW - 180, y = 170, mid = x0 + w * (0.5 + v * 0.5);
  g.font = '800 24px Montserrat'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = GREEN; g.fillText('BESCHÜTZER', x0, y - 30); g.textAlign = 'right'; g.fillStyle = RED; g.fillText('JÄGER', x0 + w, y - 30);
  g.beginPath(); g.roundRect(x0, y, w, 46, 23); g.fillStyle = '#16171c'; g.fill(); g.save(); g.clip(); g.fillStyle = GREEN; g.fillRect(x0, y, mid - x0, 46); g.fillStyle = RED; g.fillRect(mid, y, x0 + w - mid, 46); g.restore();
  g.lineWidth = 4; g.strokeStyle = '#fff'; g.beginPath(); g.roundRect(x0, y, w, 46, 23); g.stroke(); g.fillStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = 20; g.beginPath(); g.roundRect(mid - 7, y - 12, 14, 70, 7); g.fill(); g.restore(); }
function snow2d(g, t, n = 120, sp = 1, wind = 0.3) { g.save(); g.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < n; i++) { const x = ((hsh(i) * CW + t * 60 * wind * (1 + hsh(i + 9))) % CW + CW) % CW, y = (hsh(i + 5) * CH + t * 140 * sp * (0.6 + hsh(i + 2))) % CH; g.beginPath(); g.arc(x, y, 2 + hsh(i + 7) * 4, 0, 7); g.fill(); } g.restore(); }
const segT = (sh, i, o = 0) => sh.segs[i] ? sh.segs[i].s + o : 1e9;

// ------------------------------------------------------------------ 3D-Shots
export const SHOTS = {
  village(W, p, t) { const A = W.D; base(A, t); look(A.cam, lerpV(V(-1, 4.2, 4), V(0, 3.4, -1), ease(p)), V(2, 3.2, -30)); fov(A.cam, 60); return { world: A, vig: 0.7 }; },
  grave(W, p, t, sh) { const A = W.D; base(A, t, { far: 45 }); A.mound.scale.y = 0.32 + Math.max(0, Math.sin(t * 9)) * 0.02 * sm(0.3, 0.5, p); // Erde bewegt sich beim Schmatzen
    look(A.cam, lerpV(V(2.6, 1.6, -8.0), V(2.0, 1.3, -9.3), ease(p)), V(0.8, 0.4, -15)); fov(A.cam, 50); return { world: A, vig: 0.85 }; },
  tower(W, p, t, sh) { const A = W.D; base(A, t, { bell: true }); A.hand.rotation.z = 0; look(A.cam, lerpV(V(4.5, 2, -16), V(4, 3.2, -19), ease(p)), V(3, 10.5, -29.8)); fov(A.cam, 46);
    return { world: A, vig: 0.8, shake: 0.0012 * Math.max(0, Math.sin(t * 3.2)) }; },
  window(W, p, t, sh) { const A = W.D; base(A, t, { bell: true }); const s0 = sh.segs[0].s, d = sh.segs[0].e - s0, beat = [0.42, 0.62, 0.82].map(f => s0 + d * f), n = beat.filter(b => t > b).length;
    // erst von hinten am Fenster, dann Gesicht beim Mitzaehlen
    if (p < 0.38) { put(A, 'boy', 'boyB', 0, 0, 6.7, 0); look(A.cam, V(0.3, 1.4, L(9.3, 8.9, ease(p / 0.38))), V(0.3, 1.0, -25)); fov(A.cam, 50); }
    else { put(A, 'boy', 'boyC', 0, 0, 6.45, 0); look(A.cam, V(0.05, 0.95, L(4.4, 4.7, p)), V(0, 0.9, 6.45)); fov(A.cam, 40); if (Math.floor(t * 6) % 2 && n < 3) setTex(A.boy, A.T.boyS); }
    const post2d = g => { const last = n ? beat[n - 1] : 0; counter(g, [{ k2: 'GLOCKENSCHLÄGE', v: String(8 + n), pop: n ? (t - last) / 0.3 : 1, col: '#e9b949' }, ...(n >= 3 ? [{ k2: 'REGELN GEBROCHEN', v: '1 / 3', col: RED, k: (t - beat[2]) / 0.3 }] : [])]);
      if (n >= 3) stamp(g, ['REGEL 1', 'GEBROCHEN'], (t - beat[2]) / 1.0, RED, 640); };
    return { world: A, vig: 0.85, post2d, shake: beat.some(b => t > b && t < b + 0.15) ? 0.004 : 0 }; },
  burst(W, p, t, sh) { const A = W.D; base(A, t, { far: 40 }); const dt = t - sh.s, G = A.G0; A.hole.visible = dt > 0.15;
    A.chunks.forEach((c, i) => { const tt = Math.max(0, dt - 0.12); c.visible = dt > 0.12; c.position.set(G.x + c.userData.v.x * tt, Math.max(0.05, 0.4 + c.userData.v.y * tt - 4.9 * tt * tt), G.z + c.userData.v.z * tt); c.rotation.set(tt * 5 + i, tt * 3, 0); });
    put(A, 'nach', 'nR', G.x, L(-1.8, -1.0, easeOut(clamp((dt - 0.2) / 0.6))), G.z + 0.1, 0); A.nach.rotation.z = Math.sin(t * 30) * 0.05; // nur Haende/Kopf ragen aus dem Loch
    look(A.cam, V(1.0, 1.3, -11.0), V(0.8, 0.4, -15)); fov(A.cam, 48); return { world: A, vig: 0.85, flash: dt < 0.1 ? 1 - dt / 0.1 : 0, shake: dt < 0.8 ? 0.01 * (1 - dt / 0.8) : 0.001 }; },
  comes(W, p, t, sh) { const A = W.D; base(A, t, { far: 40 }); A.hole.visible = true; const G = A.G0;
    // zieht sich ruckartig heraus, dann kommt er auf die Kamera zu
    const up = clamp(p / 0.4), y = L(-1.0, 0, Math.floor(up * 5) / 5 * 0.7 + up * 0.3), q = sm(0.4, 1, p), z = G.z + 0.1 + 4.0 * (Math.floor(q * 7) / 7 * 0.6 + q * 0.4);
    nachAt(A, t, G.x, y, z); look(A.cam, lerpV(V(0.4, 1.4, -8.5), V(0.5, 1.3, -9.3), ease(p)), V(G.x, 1.0, G.z)); fov(A.cam, 46);
    const dist = Math.round(L(80, 55, sm(0.4, 1, p)));
    return { world: A, vig: 0.85, post2d: g => counter(g, [{ k2: 'ABSTAND', v: dist + ' M', col: RED }]) }; },
  run(W, p, t, sh) { const A = W.D; base(A, t, { far: 50 }); const z = L(-8, -26, p), bx = FX + Math.sin(t * 2) * 0.3; put(A, 'boy', 'boyS', bx, hF(z) + Math.abs(Math.sin(t * 13)) * 0.12, z, 0); A.boy.rotation.z = Math.sin(t * 13) * 0.08;
    const gap = L(9, 3.2, ease(p)); nachAt(A, t * 1.5, FX - 0.4, hF(z + gap), z + gap, 0, true); A.boy.userData.noBB = false; A.nach.userData.noBB = false;
    look(A.cam, V(FX + 0.9, hF(z - 3.5) + 1.3, z - 3.5), V(FX, hF(z + 2) + 0.8, z + 2)); fov(A.cam, 54);
    return { world: A, vig: 0.85, shake: 0.002, post2d: g => counter(g, [{ k2: 'ABSTAND', v: Math.round(L(40, 15, ease(p))) + ' M', col: RED }]) }; },
  quake(W, p, t) { const A = W.D; base(A, t, { far: 60, wind: 2 }); const z = -26; put(A, 'boy', 'boyB', FX, hF(z), z, 0); A.boy.userData.noBB = false;
    look(A.cam, V(FX + 0.6, hF(z) + 1.1, z + 2.8), V(FX, hF(z - 20) + 2.2, z - 20)); fov(A.cam, 55); return { world: A, vig: 0.8, shake: 0.012 * sm(0, 0.3, p) }; },
  giant(W, p, t, sh) { const A = W.D; base(A, t, { far: 120, wind: 2 }); const z = -26, gz = -62; put(A, 'boy', 'boyB', FX, hF(z), z, 0); A.boy.userData.noBB = false;
    const rise = easeOut(clamp(p / 0.55)); giantAt(A, FX, hF(gz) - 26 + 26 * rise, gz, 'calm', sm(0.3, 0.6, p));
    look(A.cam, lerpV(V(FX + 1.3, hF(z) + 1.5, z + 4.2), V(FX + 1.1, hF(z) + 1.3, z + 3.6), ease(p)), V(FX, hF(gz) + L(6, 14, rise), gz)); fov(A.cam, 60);
    return { world: A, vig: 0.75, shake: p < 0.6 ? 0.008 : 0.001, post2d: g => counter(g, [{ k2: 'GRÖSSE', v: Math.round(30 * rise) + ' M', col: GREEN, k: (p - 0.2) / 0.1 }]) }; },
  survived(W, p, t, sh) { const A = W.D; base(A, t, { far: 60, wind: 0.2 }); const z = -26; put(A, 'boy', 'boyR', FX, hF(z), z, 0); A.boy.scale.y = 1 + Math.sin(t * 3) * 0.012; A.boy.userData.noBB = false;
    look(A.cam, lerpV(V(FX + 0.3, hF(z - 2.6) + 0.9, z - 2.6), V(FX + 0.2, hF(z - 2.1) + 0.9, z - 2.1), ease(p)), V(FX, hF(z) + 0.9, z)); fov(A.cam, 50);
    const st = segT(sh, 0, 0.75); return { world: A, vig: 0.6, post2d: g => { stamp(g, ['ÜBERLEBT', 'BESCHÜTZER GEWINNT'], (t - st) / 1, GREEN, 620); } }; },
  thanks(W, p, t, sh) { const A = W.D; base(A, t, { far: 120 }); const z = -26, gz = -62; put(A, 'boy', 'boyH', FX, hF(z), z, 0); A.boy.userData.noBB = false; A.boy.rotation.z = Math.sin(t * 9) * 0.05;
    look(A.cam, lerpV(V(FX + 0.5, hF(z - 3) + 0.9, z - 3), V(FX + 0.35, hF(z - 2.4) + 0.9, z - 2.4), ease(p)), V(FX, hF(z) + 0.95, z)); fov(A.cam, 50); return { world: A, vig: 0.6 }; },
  turns(W, p, t, sh) { const A = W.D; base(A, t, { far: 120 }); const z = -26, gz = -62, s1 = segT(sh, 1); const rw = segT(sh, 0, 0.15), dt = t - sh.s;
    // Replay: Szene von eben zurueckgespult, roter Kreis um den Mund
    const replay = t < rw + 1.6;
    if (replay) { put(A, 'boy', 'boyH', FX, hF(z), z, 0); A.boy.userData.noBB = false; giantAt(A, FX - 6, hF(gz), gz, 'calm', 0); A.giant.rotation.y = Math.PI * 0.9; look(A.cam, V(FX + 0.25, hF(z - 1.7) + 0.6, z - 1.7), V(FX, hF(z) + 1.0, z)); fov(A.cam, 45); }
    else { const k = clamp((t - rw - 1.6) / Math.max(0.5, s1 - rw - 1.6)); giantAt(A, FX - 6, hF(gz), gz, 'angry', sm(0.5, 1, k)); A.giant.rotation.y = L(Math.PI * 0.9, 0, ease(k)); A.giant.scale.x = Math.abs(Math.cos(A.giant.rotation.y)) < 0.15 ? 0.15 : 1;
      look(A.cam, V(FX - 1, hF(z) + 0.6, z + 2), V(FX - 6, hF(gz) + 19, gz)); fov(A.cam, 55); }
    const post2d = g => {
      if (replay) { g.save(); g.fillStyle = 'rgba(0,0,30,.25)'; g.fillRect(0, 0, CW, CH); for (let i = 0; i < 6; i++) { const y = (hsh(Math.floor(t * 20) + i) * CH); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, y, CW, 6 + i * 2); }
        g.fillStyle = '#fff'; g.font = '400 64px Anton'; g.textAlign = 'right'; g.fillText('◀◀ REPLAY', CW - 50, 220); const ck = clamp((t - rw - 0.5) / 0.4);
        if (ck > 0) { g.strokeStyle = RED; g.lineWidth = 12; g.beginPath(); g.ellipse(CW / 2 - 5, 1215, 150, 100, 0, -1.2, -1.2 + ck * 6.6); g.stroke(); }
        if (t > rw + 0.8) { stamp(g, ['REGEL 3', 'GEBROCHEN'], (t - rw - 0.8) / 1, RED, 560); counter(g, [{ k2: 'REGELN GEBROCHEN', v: '2 / 3', col: RED, pop: (t - rw - 0.8) / 0.3 }]); } g.restore(); }
      if (t > s1) faceZoom(g, t - s1, sh.e - s1);
    };
    return { world: A, vig: 0.85, post2d, shake: !replay && t < s1 ? 0.006 : 0 }; },
  storm(W, p, t) { const A = W.D; base(A, t, { storm: sm(0, 0.7, p) * 0.5 + 0.5, far: 40 }); look(A.cam, lerpV(V(0, 4, 4), V(0, 4.5, -1), ease(p)), V(0, 2, -30)); fov(A.cam, 55); return { world: A, vig: 0.7 }; },
};
for (const k of Object.keys(SHOTS)) { const f = SHOTS[k]; SHOTS[k] = (W, ...a) => { fov(W.D.cam, 50); W.D.boy.userData.noBB = true; W.D.nach.userData.noBB = true; W.D.boy.scale.set(1, 1, 1); W.D.giant.scale.set(1, 1, 1); return f(W, ...a); }; }
SHOTS._billboard = billboard; SHOTS._shake = shake;

// ------------------------------------------------------------------ 2D-Szenen
let IMG = null;
const img = () => IMG || (IMG = { rC: C.ruebezahl('calm'), rA: C.ruebezahl('angry'), nW: C.nachzehrer('walk'), nR: C.nachzehrer('reach'), nF: C.nachFace('chew'), nFc: C.nachFace('coin'), rF: C.ruebFace('angry'), opa: C.opa('neutral'), boyS: C.boy('front', 'scared_sweat') });
function faceZoom(g, dt, dur) { const I = img(); const k = easeOut(clamp(dt / 0.35)), s = L(0.6, 1.25, k) + dt * 0.04; g.save(); g.fillStyle = `rgba(0,0,0,${clamp(dt / 0.15)})`; g.fillRect(0, 0, CW, CH);
  const w = CW * 1.6 * s, jx = Math.sin(dt * 37) * 4; g.drawImage(I.rF, CW / 2 - w / 2 + jx, 820 - w / 2, w, w); g.restore();
  if (dt < 0.12) { g.fillStyle = `rgba(255,230,220,${0.8 * (1 - dt / 0.12)})`; g.fillRect(0, 0, CW, CH); } }
function sky(g, a, b, c) { const s = g.createLinearGradient(0, 0, 0, CH); s.addColorStop(0, a); s.addColorStop(0.6, b); s.addColorStop(1, c); g.fillStyle = s; g.fillRect(0, 0, CW, CH); }
function mountains(g, col, y = 1500) { g.fillStyle = col; g.beginPath(); g.moveTo(0, CH); for (let i = 0; i <= 12; i++) g.lineTo(i * CW / 12, y - (i % 2 ? 220 : 60) - hsh(i) * 120); g.lineTo(CW, CH); g.fill(); }

// Duell-Roulette: zwei Reihen. Oben Beschuetzer (gruen), unten Jaeger (rot). Oben stoppt zuerst.
const TOP = ['RÜBEZAHL', 'WENDIGO', 'MOTHMAN', 'SKINWALKER', 'SIREN HEAD', 'THE SMILER'], BOT = ['NACHZEHRER', 'THE RAKE', 'TEKE TEKE', 'KUCHISAKE-ONNA', 'AKA MANTO', 'SCP-173'];
let RM = null;
function rowReel(g, t, tLand, names, imgs, y0, col, label, dir) { const SP = 300, TARGET = 18, k = easeOut(clamp(t / tLand)), off = SP * TARGET * k * dir, locked = t >= tLand, lk = clamp((t - tLand) / 0.3);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, y0, CW, 640);
  const i0 = Math.floor((off - CW / 2) / SP) - 2;
  for (let i = i0; i < i0 + 7; i++) { const x = CW / 2 + i * SP - off, idx = ((i % names.length) + names.length) % names.length, sel = locked && i === TARGET * dir;
    g.save(); g.beginPath(); g.roundRect(x - 135, y0 + 40, 270, 540, 22); g.fillStyle = sel ? '#1d2a22' : '#15161b'; if (sel && col === RED) g.fillStyle = '#2a1416'; g.fill(); g.clip();
    const lg = g.createRadialGradient(x, y0 + 300, 20, x, y0 + 300, 300); lg.addColorStop(0, sel ? col + '55' : 'rgba(255,255,255,.08)'); lg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = lg; g.fillRect(x - 135, y0 + 40, 270, 540);
    g.drawImage(imgs[idx], x - 115, y0 + 110, 230, 460); g.restore();
    g.save(); g.lineWidth = sel ? 8 : 4; g.strokeStyle = sel ? col : 'rgba(255,255,255,.25)'; if (sel) { g.shadowColor = col; g.shadowBlur = 30 * (0.6 + 0.4 * Math.sin((t - tLand) * 20)); } g.beginPath(); g.roundRect(x - 135, y0 + 40, 270, 540, 22); g.stroke(); g.restore();
    g.fillStyle = sel ? col : '#fff'; g.font = '800 22px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(names[idx], x, y0 + 80); }
  // Label-Fahne
  g.save(); g.beginPath(); g.roundRect(CW / 2 - 170, y0 - 26, 340, 52, 26); g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 20; g.fill(); g.shadowBlur = 0; g.fillStyle = '#0c0c10'; g.font = '900 28px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, CW / 2, y0 + 1); g.restore();
  // Zeiger
  g.save(); g.fillStyle = '#f5c518'; g.shadowColor = '#f5c518'; g.shadowBlur = 12; g.beginPath(); g.moveTo(CW / 2 - 18, y0 + 606); g.lineTo(CW / 2 + 18, y0 + 606); g.lineTo(CW / 2, y0 + 580); g.fill(); g.restore();
  if (locked && lk < 1) { g.fillStyle = `rgba(255,255,255,${0.5 * (1 - lk)})`; g.fillRect(0, y0, CW, 640); } }
function duelRoulette(g, p, t, sh) { if (!RM) RM = { top: TOP.map(n => C.MONSTERS[n]()), bot: BOT.map(n => C.MONSTERS[n]()) }; const dt = t - sh.s, dur = sh.e - sh.s;
  g.fillStyle = '#0d0e13'; g.fillRect(0, 0, CW, CH); const tg = g.createLinearGradient(0, 0, 0, CH); tg.addColorStop(0, 'rgba(53,208,122,.12)'); tg.addColorStop(0.5, 'rgba(0,0,0,0)'); tg.addColorStop(1, 'rgba(255,59,59,.14)'); g.fillStyle = tg; g.fillRect(0, 0, CW, CH);
  g.save(); g.font = '800 76px Montserrat'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 16; const w1 = g.measureText('Horror ').width, w2 = g.measureText('ROULETTE').width, x = CW / 2 - (w1 + w2) / 2;
  g.fillStyle = '#fff'; g.fillText('Horror ', x, 120); g.fillStyle = '#e3262b'; g.fillText('ROULETTE', x + w1, 120); g.font = '400 64px Anton'; g.textAlign = 'center'; g.fillStyle = '#f5c518'; g.fillText('⚔  DUELL  ⚔', CW / 2, 205); g.restore();
  rowReel(g, dt, dur - 0.95, TOP, RM.top, 300, GREEN, 'BESCHÜTZER', 1); rowReel(g, dt, dur - 0.35, BOT, RM.bot, 1000, RED, 'JÄGER', -1);
  return { vig: 0.45 }; }

function reveal(g, p, t, sh, who) { const I = img(), dt = t - sh.s, prot = who === 'prot', col = prot ? GREEN : RED;
  if (prot) { sky(g, '#06121a', '#123a3a', '#0a1a1a'); mountains(g, '#0d2226', 1500); } else { sky(g, '#0a0204', '#3a0a0c', '#120304'); g.fillStyle = '#1a0507'; for (let i = 0; i < 7; i++) { const x = 80 + i * 160; g.fillRect(x - 8, 1300 - hsh(i) * 60, 16, 200); g.fillRect(x - 40, 1340 - hsh(i) * 60, 80, 14); } }
  snow2d(g, t, 80, prot ? 0.6 : 0.3); const k = easeOut(clamp(dt / 0.35)), s = L(1.6, 1, k), im = prot ? I.rC : (Math.floor(t / 0.2) % 2 ? I.nR : I.nW), hh = prot ? 1300 : 1200;
  g.save(); g.translate(CW / 2 + (prot ? 0 : Math.sin(t * 30) * 4), 1780); g.scale(s, s); g.shadowColor = col; g.shadowBlur = 60; g.drawImage(im, -hh / 4, -hh, hh / 2, hh); g.restore();
  // Karte
  const ck = back(clamp((dt - 0.25) / 0.35)); g.save(); g.translate(CW / 2, 330); g.scale(ck, ck); g.globalAlpha = clamp((dt - 0.25) * 5);
  g.font = '900 34px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(prot ? 'DEIN BESCHÜTZER' : 'DEIN JÄGER', 0, -95);
  g.font = '400 120px Anton'; g.lineWidth = 12; g.strokeStyle = 'rgba(0,0,0,.6)'; const nm = prot ? 'RÜBEZAHL' : 'NACHZEHRER'; g.strokeText(nm, 0, 20); g.fillStyle = '#fff'; g.fillText(nm, 0, 20);
  g.font = '800 28px Montserrat'; g.fillStyle = 'rgba(255,255,255,.8)'; g.fillText(prot ? 'RIESENGEBIRGE' : 'ALTER FRIEDHOF', 0, 110); g.restore();
  return { vig: 0.7, flash: dt < 0.12 ? 1 - dt / 0.12 : 0, shake: dt < 0.3 ? 0.006 : 0 }; }

function versus(g, p, t, sh) { const I = img(), dt = t - sh.s; g.save(); g.beginPath(); g.moveTo(0, 0); g.lineTo(CW, 0); g.lineTo(CW, 760); g.lineTo(0, 1160); g.closePath(); g.clip(); sky(g, '#06121a', '#14403a', '#0a2018'); g.drawImage(I.rC, 10 - dt * 15, 400, 440, 880); g.restore();
  g.save(); g.beginPath(); g.moveTo(0, 1160); g.lineTo(CW, 760); g.lineTo(CW, CH); g.lineTo(0, CH); g.closePath(); g.clip(); sky(g, '#1a0406', '#4a0c10', '#120304'); g.drawImage(Math.floor(t / 0.2) % 2 ? I.nR : I.nW, 600 + dt * 15, 700, 440, 880); g.restore();
  g.save(); g.strokeStyle = '#fff'; g.lineWidth = 10; g.shadowColor = '#f5c518'; g.shadowBlur = 40; g.beginPath(); for (let i = 0; i <= 10; i++) { const x = i * CW / 10, y = L(1160, 760, i / 10) + (i % 2 ? -30 : 30) * Math.sin(t * 40 + i); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.restore();
  const k = back(clamp(dt / 0.35)); g.save(); g.translate(CW / 2, 960); g.scale(k, k); g.beginPath(); g.arc(0, 0, 120, 0, 7); g.fillStyle = '#f5c518'; g.fill(); g.fillStyle = '#111'; g.font = '400 120px Anton'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('VS', 0, 8); g.restore();
  g.save(); g.font = '400 100px Anton'; g.textAlign = 'center'; g.lineWidth = 14; g.strokeStyle = '#000'; g.globalAlpha = clamp((dt - 0.15) * 5); g.strokeText('WER GEWINNT?', CW / 2, 300); g.fillStyle = '#fff'; g.fillText('WER GEWINNT?', CW / 2, 300); g.restore();
  return { vig: 0.5, flash: dt < 0.1 ? 1 - dt / 0.1 : 0 }; }

const RULES = ['Glocke läutet? NICHT mitzählen.', 'Immer eine MÜNZE dabeihaben.', 'NIEMALS „Rübezahl“ sagen.'];
function rules(g, p, t, sh) { const I = img(), n = { rule1: 1, rule2: 2, rule3: 3 }[sh.id] || 3, dt = t - sh.s, opaT = segT(sh, 1);
  sky(g, '#1a0f08', '#2e1c10', '#120a06'); const fl = 0.85 + Math.sin(t * 11) * 0.05; g.fillStyle = `rgba(255,150,60,${0.12 * fl})`; g.fillRect(0, 0, CW, CH);
  for (let y = 0; y < CH; y += 120) { g.fillStyle = y % 240 ? '#24160c' : '#2a1a0e'; g.fillRect(0, y, CW, 118); }
  if (t > opaT) { const k = easeOut(clamp((t - opaT) / 0.4)), s = L(1.4, 2.1, k); g.save(); g.translate(CW / 2, 1900); g.scale(s, s); g.drawImage(I.opa, -260, -1040, 520, 1040); g.restore(); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, CW, CH); return { vig: 0.8 }; }
  // Zettel
  g.save(); g.translate(CW / 2, 760); g.rotate(-0.03); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 40; g.fillStyle = '#efe6cf'; g.fillRect(-430, -420, 860, 860); g.shadowBlur = 0;
  g.strokeStyle = 'rgba(80,110,160,.35)'; g.lineWidth = 2; for (let y = -300; y < 420; y += 70) { g.beginPath(); g.moveTo(-400, y); g.lineTo(400, y); g.stroke(); }
  g.fillStyle = '#8a1a14'; g.font = '400 84px Anton'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('OPAS REGELN', 0, -330);
  for (let i = 0; i < n; i++) { const st = i === n - 1 ? dt : 9, k = easeOut(clamp(st / 0.3)), y = -170 + i * 200; g.globalAlpha = k;
    g.lineWidth = 6; g.strokeStyle = '#1a1410'; g.strokeRect(-390, y - 34, 68, 68); g.fillStyle = '#1a1410'; g.font = '400 54px Anton'; g.textAlign = 'left'; g.fillText(`${i + 1}.`, -300, y);
    g.font = '700 38px Montserrat'; const words = RULES[i]; g.fillText(words, -230, y, 600); g.globalAlpha = 1; }
  g.restore(); g.drawImage(I.opa, 700, 1180, 340, 680);
  return { vig: 0.75 }; }

function redNach(g, p, t) { const I = img(); sky(g, '#2a0405', '#8a1a16', '#1a0203'); g.fillStyle = '#3a0607'; g.fillRect(0, 1560, CW, CH - 1560);
  for (let i = 0; i < 6; i++) { const x = 90 + i * 190; g.fillStyle = '#2a0405'; g.fillRect(x - 10, 1380, 20, 200); g.fillRect(x - 50, 1420, 100, 16); }
  const hh = 2100, k = Math.floor(t / 0.22), top = L(-hh + 1900, 240, ease(p)); g.save(); g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 50; g.translate(CW / 2 + (hsh(k) - 0.5) * 14, top); g.rotate((hsh(k + 3) - 0.5) * 0.05); g.drawImage(hsh(k) > 0.5 ? I.nR : I.nW, -hh / 4, 0, hh / 2, hh); g.restore();
  // Nah: kauender Mund im zweiten Teil
  if (p > 0.55) { const k2 = easeOut(clamp((p - 0.55) / 0.1)), s = 1 + Math.sin(t * 8) * 0.015; g.save(); g.globalAlpha = k2; g.fillStyle = 'rgba(20,0,0,.6)'; g.fillRect(0, 0, CW, CH); g.translate(CW / 2, 800); g.scale(s, s); g.drawImage(I.nF, -560, -560, 1120, 1120); g.restore(); }
  return { vig: 0.85, tint: 0.15 }; }
function lord(g, p, t) { const I = img(); sky(g, '#04101a', '#0f3a3e', '#06161a'); g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { g.strokeStyle = `rgba(80,255,180,${0.08 + 0.04 * Math.sin(t + i)})`; g.lineWidth = 60; g.beginPath(); g.moveTo(-100, 300 + i * 80); g.bezierCurveTo(300, 150 + i * 60 + Math.sin(t + i) * 40, 700, 450 + i * 40, CW + 100, 250 + i * 70); g.stroke(); } g.restore();
  mountains(g, '#0a1c20', 1600); const hh = 2300, top = L(-hh + 1950, 200, ease(p)); g.save(); g.shadowColor = 'rgba(120,220,255,.35)'; g.shadowBlur = 60; g.drawImage(I.rC, CW / 2 - hh / 4, top, hh / 2, hh); g.restore(); snow2d(g, t, 100, 0.5);
  return { vig: 0.75 }; }

function fight(g, p, t, sh) { const I = img(), s1 = segT(sh, 1, 0), torn = t > s1, k = torn ? clamp((t - s1) / 0.6) : 0;
  sky(g, '#05080f', '#141c2c', '#0a0d14'); mountains(g, '#0c121c', 1500); g.fillStyle = '#dfe7f2'; g.fillRect(0, 1640, CW, CH - 1640); snow2d(g, t, 90, 1.2, 1.5);
  // Riesenhand von oben rechts packt den Toten
  const nx = CW / 2 + (torn ? L(0, -120, k) : Math.sin(t * 24) * 18), ny = torn ? L(1160, 1640, k * k) : 1160 + Math.sin(t * 31) * 10;
  g.save(); g.translate(nx, ny); g.rotate(torn ? L(0, -0.4, k) : Math.sin(t * 20) * 0.12); g.drawImage(Math.floor(t / 0.12) % 2 ? I.nR : I.nW, -230, -920, 460, 920); g.restore();
  const hx = torn ? L(nx + 40, nx + 260, k) : nx + 40, hy = torn ? L(ny - 760, ny - 980, k) : ny - 760;
  g.save(); g.fillStyle = '#5c574f'; g.strokeStyle = '#1c1512'; g.lineWidth = 12; g.beginPath(); g.moveTo(CW + 200, -200); g.lineTo(hx + 260, hy - 60); g.lineTo(hx + 120, hy + 140); g.lineTo(CW + 200, 200); g.closePath(); g.fill(); g.stroke();
  for (let i = 0; i < 4; i++) { const a = 2.4 + i * 0.28 - (torn ? k * 0.6 : 0), fx = hx + 120 + Math.cos(a) * 240, fy = hy + 40 + Math.sin(a) * 240; g.lineWidth = 70; g.strokeStyle = '#1c1512'; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx + 160, hy + 40); g.lineTo(fx, fy); g.stroke(); g.lineWidth = 56; g.strokeStyle = '#6a645a'; g.stroke(); }
  g.lineWidth = 12; g.strokeStyle = '#1c1512'; g.fillStyle = '#6a645a'; g.beginPath(); g.ellipse(hx + 170, hy + 30, 130, 110, 0.5, 0, 7); g.fill(); g.stroke();
  g.restore();
  if (torn && k < 0.5) { g.fillStyle = 'rgba(255,40,40,.35)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(hx + 60 + i * 20, hy + 80 + hsh(i) * 60, 10 + i * 2, 0, 7); g.fill(); } }
  const v = torn ? L(0.25, -0.65, easeOut(k)) : 0.15 + Math.sin(t * 7) * 0.35; fightBar(g, v, 1);
  return { vig: 0.75, shake: torn && k < 0.4 ? 0.01 : 0.004, flash: torn && t - s1 < 0.1 ? 0.6 : 0 }; }

function coin(g, p, t, sh) { const I = img(), dt = t - sh.s, dur = sh.e - sh.s, a = 0.32, b = 0.8, fk = clamp((p - a) / (b - a)), inMouth = p > b;
  sky(g, '#05080f', '#141c2c', '#0a0d14'); const s = L(1.0, 1.08, p); g.save(); g.translate(CW / 2, 900); g.scale(s, s); g.drawImage(inMouth ? I.nFc : I.nF, -540, -540, 1080, 1080); g.restore();
  if (p < a) { const k = easeOut(clamp(p / 0.12)); g.save(); g.translate(CW / 2, 1620 - k * 120); g.fillStyle = '#f4cfa5'; g.strokeStyle = '#1c1512'; g.lineWidth = 10; g.beginPath(); g.ellipse(0, 60, 150, 110, 0, 0, 7); g.fill(); g.stroke(); drawCoin(g, 0, -20, 70, t * 2); g.restore(); }
  else if (!inMouth) { const x = L(CW / 2 + 80, CW / 2, fk), y = L(1600, 1000, fk) - Math.sin(fk * Math.PI) * 300, r = L(80, 30, fk); g.save(); g.globalAlpha = 0.25; for (let i = 1; i < 5; i++) drawCoin(g, x + i * 12, y + i * 40, r, t * 6 - i); g.restore(); drawCoin(g, x, y, r, t * 6);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, CW, 70); g.fillRect(0, CH - 70, CW, 70); g.fillStyle = '#fff'; g.font = '800 26px Montserrat'; g.textAlign = 'left'; g.fillText('ZEITLUPE  ×0.25', 40, 300); }
  else { stamp(g, ['REGEL 2  ✓'], (p - b) * dur / 1, GREEN, 520); }
  return { vig: 0.8, flash: inMouth && (p - b) * dur < 0.12 ? 0.8 : 0, shake: inMouth && (p - b) * dur < 0.4 ? 0.008 : 0 }; }
function drawCoin(g, x, y, r, ph) { const sx = Math.max(0.12, Math.abs(Math.cos(ph))); g.save(); g.translate(x, y); g.scale(sx, 1); g.shadowColor = '#ffd860'; g.shadowBlur = 40; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fillStyle = '#e0b440'; g.fill(); g.shadowBlur = 0; g.lineWidth = r * 0.12; g.strokeStyle = '#8a6418'; g.stroke(); g.beginPath(); g.arc(0, 0, r * 0.65, 0, 7); g.stroke(); g.restore(); }

function swallow(g, p, t, sh) { const I = img(); sky(g, '#05080f', '#141c2c', '#0a0d14'); mountains(g, '#0c121c', 1450);
  const sink = ease(clamp((p - 0.3) / 0.6)), gy = 1500; g.save(); g.beginPath(); g.rect(0, 0, CW, gy + 10); g.clip(); g.filter = 'grayscale(0.8) brightness(0.8)'; g.drawImage(I.nW, CW / 2 - 300, gy - 1100 + sink * 1150, 600, 1200); g.filter = 'none'; g.restore();
  g.fillStyle = '#dfe7f2'; g.fillRect(0, gy, CW, CH - gy); const open = sink < 0.95 ? Math.sin(Math.min(1, sink * 1.3) * Math.PI) * 260 + (p > 0.3 && sink < 0.2 ? 200 : 0) : 0;
  g.fillStyle = '#2a1c14'; g.beginPath(); g.ellipse(CW / 2, gy + 10, 40 + open, 30 + open * 0.15, 0, 0, 7); g.fill(); g.strokeStyle = '#1a120c'; g.lineWidth = 8; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; g.beginPath(); g.moveTo(CW / 2 + Math.cos(a) * (40 + open), gy + 10 + Math.sin(a) * 30); g.lineTo(CW / 2 + Math.cos(a) * (200 + open * 1.5), gy + 10 + Math.sin(a) * 90); g.stroke(); }
  snow2d(g, t, 70, 0.6); fightBar(g, L(-0.4, 1, ease(clamp((p - 0.2) / 0.7))), 1);
  return { vig: 0.75, shake: sink > 0 && sink < 1 ? 0.006 : 0 }; }

function question(g, p, t) { const I = img(); sky(g, '#0a0d14', '#1a2030', '#0a0d14'); snow2d(g, t, 80, 0.5);
  const s = 1 + Math.sin(t * 2) * 0.01; g.save(); g.globalAlpha = 0.55; g.translate(CW / 2, 1250); g.scale(s, s); g.drawImage(I.rF, -500, -500, 1000, 1000); g.restore();
  const k = easeOut(clamp(p / 0.15)); g.save(); g.globalAlpha = k; g.font = '400 96px Anton'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 14; g.strokeStyle = '#000';
  for (const [l, y, c] of [['HÄTTEST DU', 300, '#fff'], ['SEINEN NAMEN', 410, '#fff'], ['GESAGT?', 520, '#ff2b4a']]) { g.strokeText(l, CW / 2, y); g.fillStyle = c; g.fillText(l, CW / 2, y); } g.restore();
  for (const [x, txt, col, d] of [[CW / 2 - 220, 'JA', RED, 0.25], [CW / 2 + 220, 'NEIN', GREEN, 0.32]]) { const b = back(clamp((p - d) / 0.15)); if (b <= 0) continue; g.save(); g.translate(x, 760); g.scale(b, b); g.beginPath(); g.roundRect(-170, -70, 340, 140, 28); g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 30; g.fill(); g.shadowBlur = 0; g.fillStyle = '#0c0c10'; g.font = '400 80px Anton'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 0, 6); g.restore(); }
  const ck = clamp((p - 0.5) / 0.15); if (ck > 0) { g.save(); g.globalAlpha = ck; g.fillStyle = '#fff'; g.font = '800 40px Montserrat'; g.textAlign = 'center'; g.fillText('👇  SCHREIB ES IN DIE KOMMENTARE', CW / 2, 960); g.restore(); }
  return { vig: 0.5 }; }

export const TWO = { duel_roulette: duelRoulette, reveal_prot: (g, p, t, s) => reveal(g, p, t, s, 'prot'), reveal_hunt: (g, p, t, s) => reveal(g, p, t, s, 'hunt'), versus, rules, red_nach: redNach, lord, fight, coin, swallow, question };
