// Folge 15 – Ryomen Sukuna: Tempelhalle mit Kerzen und Holzstatue, Flur mit Papierwaenden, Schlafraum, Bergtempel im Schnee + 2D-Szenen
import * as THREE from 'three';
import * as C from '../chars.js';
import { tex, lam, box, sprite, setTex, glow, gradTex, V, L, clamp, sm, lerpV, look, billboard, shake, rnd, ease } from '../world.js';
import { W as CW, H as CH } from '../overlay.js';

const easeOut = t => 1 - Math.pow(1 - t, 3);
function fov(cam, f) { if (cam.fov !== f) { cam.fov = f; cam.updateProjectionMatrix(); } }
const basic = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });
const hsh = n => { const x = Math.sin(n * 91.7) * 43758.5; return x - Math.floor(x); };
const CX = 40, RX = 80, EX = -60;   // Flur, Schlafraum, Aussen

function planks(col = '#6a4a2e', n = 10) { const c = C.cv(256, 256), g = c.getContext('2d'); g.fillStyle = col; g.fillRect(0, 0, 256, 256); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 3;
  for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * 256 / n, 0); g.lineTo(i * 256 / n, 256); g.stroke(); } g.globalAlpha = 0.15; for (let i = 0; i < 60; i++) { g.fillStyle = i % 2 ? '#000' : '#fff'; g.fillRect(rnd() * 256, rnd() * 256, 2, 20 + rnd() * 40); } const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
function shojiTex() { const c = C.cv(256, 256), g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#3a2616'; g.lineWidth = 8; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 256); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(256, i * 64); g.stroke(); } return tex(c); }
function tatamiTex() { const c = C.cv(256, 256), g = c.getContext('2d'); g.fillStyle = '#b8b070'; g.fillRect(0, 0, 256, 256); g.strokeStyle = 'rgba(80,70,30,.25)'; g.lineWidth = 1; for (let y = 0; y < 256; y += 4) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); } g.fillStyle = '#2a3a20'; g.fillRect(0, 0, 256, 8); g.fillRect(0, 248, 256, 8); const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
function floor(S, w, d, x, z, t, rep) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ map: t })); m.material.map.repeat.set(...rep); m.rotation.x = -Math.PI / 2; m.position.set(x, 0, z); S.add(m); return m; }
function snowTex() { const c = C.cv(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return tex(c); }
function roof(w, d, h, mat) { const m = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 4), mat); m.rotation.y = Math.PI / 4; m.scale.set(w * 0.72, h, d * 0.72); return m; }

function buildWorld() {
  const S = new THREE.Scene(); const BG = { night: gradTex([[0, '#020308'], [1, '#0c1222']]), dusk: gradTex([[0, '#3a3a52'], [0.6, '#8a7a8a'], [1, '#c8b8b0']]), day: gradTex([[0, '#c8d4e4'], [1, '#f0ece4']]) };
  S.background = BG.night; S.fog = new THREE.Fog(0x05060c, 6, 30);
  const hemi = new THREE.HemisphereLight(0x8a90b0, 0x2a2018, 0.15); S.add(hemi);
  const moon = new THREE.DirectionalLight(0x9fb4e8, 0.3); moon.position.set(10, 12, 6); S.add(moon);
  const wood = lam(0x4a301c), dark = lam(0x2a1a10), redw = lam(0x7a2418);
  // ---------- Halle (Ursprung): x -6..6, z -8..8
  floor(S, 12, 16, 0, 0, planks('#5a3e26', 12), [2, 3]);
  S.add(box(12, 4.6, 0.3, wood, 0, 2.3, -8.1), box(12, 0.3, 16.4, dark, 0, 4.6, 0), box(12, 4.6, 0.3, wood, 0, 2.3, 8.1));
  const shM = new THREE.MeshBasicMaterial({ map: shojiTex(), color: 0x6a7898 }); const shojiH = [];
  for (const sx of [-1, 1]) for (let z = -7; z <= 7; z += 2) { const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 3.4), shM); m.position.set(sx * 6.05, 1.7, z); m.rotation.y = -sx * Math.PI / 2; S.add(m); shojiH.push(m); }
  for (const sx of [-1, 1]) { S.add(box(0.2, 1.2, 16.4, wood, sx * 6.1, 4.0, 0)); for (let z = -8; z <= 8; z += 4) S.add(box(0.36, 4.6, 0.36, redw, sx * 5.8, 2.3, z)); }
  S.add(box(5, 0.5, 2.6, dark, 0, 0.25, -6.4)); const ped = box(1.3, 0.62, 1.3, lam(0x3a2414), 0, 0.81, -6.4); S.add(ped);
  S.add(box(4.6, 3.6, 0.1, lam(0x5a1a10), 0, 2.5, -7.9)); // roter Wandbehang hinter der Statue
  const candles = [], cl = []; for (let i = 0; i < 6; i++) { const x = -2 + i * 0.8 + (i > 2 ? 0.4 : -0.4) * 0, z = -5.3 + (i % 2) * 0.2; const cd = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22 + (i % 3) * 0.08, 8), lam(0xe8e0c8)); cd.position.set(x, 0.62, z); S.add(cd); const f = glow(0.35, [255, 180, 80]); f.position.set(x, 0.8 + (i % 3) * 0.04, z); S.add(f); candles.push(f); }
  for (const x of [-1.5, 1.5]) { const l = new THREE.PointLight(0xff9a40, 4, 9, 1.4); l.position.set(x, 1.2, -4.8); S.add(l); cl.push(l); }
  const lanterns = []; for (const x of [-4, 4]) { const ln = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.5, 12), basic(0xffd890)); ln.position.set(x, 3.4, -2); S.add(ln); const l = new THREE.PointLight(0xffc070, 0, 10, 1.3); l.position.set(x, 3.1, -2); S.add(l); lanterns.push([ln, l]); }
  // ---------- Flur bei x = 40 (z 2 .. -30), links Holzwand, rechts Papierwand mit Mondlicht dahinter
  floor(S, 2.6, 34, CX, -14, planks('#4a3220', 4), [1, 8]);
  S.add(box(0.2, 3, 34, wood, CX - 1.3, 1.5, -14), box(2.8, 0.2, 34, dark, CX, 3.0, -14));
  for (let z = 2; z > -31; z -= 3) S.add(box(0.2, 3, 0.2, dark, CX + 1.3, 1.5, z), box(0.2, 3, 0.2, dark, CX - 1.2, 1.5, z));
  const paper = new THREE.MeshBasicMaterial({ map: shojiTex(), color: 0x8a9ec8, transparent: true, opacity: 0.86, depthWrite: false });
  for (let z = 0.5; z > -30; z -= 3) { const m = new THREE.Mesh(new THREE.PlaneGeometry(3, 2.8), paper); m.position.set(CX + 1.3, 1.4, z); m.rotation.y = -Math.PI / 2; S.add(m); }
  const back = box(0.1, 4, 36, basic(0xb8c8f0), CX + 3.2, 1.6, -14); S.add(back); // helles Mondlicht hinter dem Papier
  const corrL = new THREE.PointLight(0x8aa0d8, 2.2, 14, 1.2); S.add(corrL);
  // ---------- Schlafraum bei x = 80
  floor(S, 7, 7, RX, 0, tatamiTex(), [3, 3]);
  S.add(box(7, 3, 0.2, wood, RX, 1.5, -3.5), box(0.2, 3, 7, wood, RX - 3.5, 1.5, 0), box(7, 0.2, 7, dark, RX, 3, 0));
  for (let z = -2.6; z <= 3; z += 1.8) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.6), shM); m.position.set(RX + 3.45, 1.3, z); m.rotation.y = -Math.PI / 2; S.add(m); }
  const fut = (x) => { const G = new THREE.Group(); G.position.set(x, 0, -0.5); S.add(G); G.add(box(1.0, 0.1, 2.1, lam(0xeeeae0), 0, 0.05, 0), box(0.6, 0.14, 0.32, lam(0xe0dcd0), 0, 0.17, -0.82)); const bl = box(1.02, 0.12, 1.4, lam(0x5a6a9a), 0, 0.16, 0.3); G.add(bl); return { G, bl }; };
  const fu1 = fut(RX - 1.2), fu2 = fut(RX + 0.6);
  const roomL = new THREE.PointLight(0xa8b8e8, 1.5, 9, 1.2); roomL.position.set(RX + 2.5, 2.2, 0); S.add(roomL);
  // ---------- Bergtempel aussen bei x = -60: Treppe, rote Tore, Tempel, Zedern, Schnee
  const eg = new THREE.PlaneGeometry(80, 120, 30, 40); eg.rotateX(-Math.PI / 2); const EP = eg.attributes.position; for (let i = 0; i < EP.count; i++) { const z = EP.getZ(i), x = EP.getX(i); EP.setY(i, Math.max(0, -z - 2) * 0.45 + (Math.abs(x) > 4 ? rnd() * 0.6 + Math.abs(x) * 0.08 : 0)); } eg.computeVertexNormals();
  const eGround = new THREE.Mesh(eg, lam(0xe4e8ee)); eGround.position.set(EX, 0, -40); S.add(eGround);
  const hE = z => Math.max(0, -(z + 40) - 2) * 0.45;  // Hoehe am Hang (Weltkoordinate z)
  for (let i = 0; i < 40; i++) { const z = -42 - i * 0.6; S.add(box(3, 0.3, 0.6, lam(0x8a8a88), EX, hE(z) + 0.05, z)); }
  for (const z of [-44, -52, -60]) { const y = hE(z); S.add(box(0.3, 3.6, 0.3, redw, EX - 1.6, y + 1.8, z), box(0.3, 3.6, 0.3, redw, EX + 1.6, y + 1.8, z), box(4.4, 0.32, 0.4, redw, EX, y + 3.6, z), box(3.6, 0.2, 0.3, redw, EX, y + 3.0, z), box(4.6, 0.1, 0.5, lam(0xeef2f6), EX, y + 3.82, z)); }
  const tz = -70, ty = hE(-66); const tG = new THREE.Group(); tG.position.set(EX, ty, tz); S.add(tG);
  tG.add(box(10, 0.8, 7, lam(0x6a6a68), 0, 0.4, 0), box(8, 3.4, 5, wood, 0, 2.5, 0)); for (const x of [-3.6, -1.2, 1.2, 3.6]) tG.add(box(0.36, 3.4, 0.36, redw, x, 2.5, 2.6));
  const r1 = roof(12, 9, 2.6, lam(0x2a2a30)); r1.position.y = 5.4; tG.add(r1); const r1s = roof(11, 8, 2.2, lam(0xeef2f6)); r1s.position.y = 5.75; tG.add(r1s);
  const tLamp = new THREE.PointLight(0xffb060, 0, 12, 1.4); tLamp.position.set(EX, ty + 2.2, tz + 4); S.add(tLamp); const tWin = box(5, 1.6, 0.1, basic(0x302010), 0, 2.4, 2.56); tG.add(tWin);
  const N = 160, cone = new THREE.InstancedMesh(new THREE.ConeGeometry(1.3, 6, 7), lam(0x1a2a22), N), M = new THREE.Matrix4(), Q = new THREE.Quaternion();
  for (let i = 0; i < N; i++) { let x, z; do { x = (rnd() - 0.5) * 60; z = -30 - rnd() * 80; } while (Math.abs(x) < 6 || (Math.abs(x) < 9 && z < -64)); const s = 0.9 + rnd() * 0.8; M.compose(V(EX + x, hE(z) + Math.abs(x) * 0.08 + 3 * s, z), Q, V(s, s, s)); cone.setMatrixAt(i, M); } S.add(cone);
  // ---------- Figuren
  const T = { stF: C.sukuna('front', 'wood'), stB: C.sukuna('back', 'wood'), stBo: C.sukuna('back', 'wood', true), lvF: [0, 1, 2, 3].map(k => C.sukuna('front', 'live', false, k * Math.PI / 2)), lvB: C.sukuna('back', 'live', false), lvBo: C.sukuna('back', 'live', true),
    sil: [0, 1, 2, 3].map(k => C.silhouette(C.sukuna('front', 'live', false, k * Math.PI / 2), '#05060c')),
    boyB: C.boy('back'), boyS: C.boy('front', 'scared_sweat'), boyN: C.boy('front', 'neutral'), boyC: C.boy('front', 'closed'), benB: C.ben('back'), benS: C.ben('front', 'scared_sweat'), benN: C.ben('front', 'neutral') };
  const mk = (tx, h, e = 0.38) => { const s = sprite(Array.isArray(T[tx]) ? T[tx][0] : T[tx], h, e); s.userData.noBB = true; s.children[0].visible = false; S.add(s); return s; };
  const statue = mk('stF', 2.3, 0.2), suk = mk('lvF', 2.5, 0.12), sil = mk('sil', 2.5, 0); sil.material.opacity = 0.85; const boy = mk('boyB', 1.3), ben = mk('benB', 1.3);
  setTex(suk, T.lvF[0]); setTex(sil, T.sil[0]);
  const eyes = [0, 1].map(() => { const e = glow(0.28, [255, 40, 20]); S.add(e); return e; });
  const SN = 1600, sg = new THREE.BufferGeometry(), sp0 = new Float32Array(SN * 3); for (let i = 0; i < SN; i++) { sp0[i * 3] = (rnd() - 0.5) * 24; sp0[i * 3 + 1] = rnd() * 16; sp0[i * 3 + 2] = (rnd() - 0.5) * 24; }
  sg.setAttribute('position', new THREE.BufferAttribute(sp0.slice(), 3)); const snow = new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.08, map: snowTex(), transparent: true, depthWrite: false })); S.add(snow);
  return { S, BG, hemi, moon, candles, cl, lanterns, shM, corrL, roomL, fu2, tLamp, tWin, hE, statue, suk, sil, boy, ben, eyes, T, snow, sp0, cam: new THREE.PerspectiveCamera(50, 9 / 16, 0.05, 300) };
}
export function build() { return { D: buildWorld() }; }

function base(A, t, o = {}) {
  for (const k of ['statue', 'suk', 'sil', 'boy', 'ben']) { A[k].visible = false; A[k].rotation.set(0, 0, 0); A[k].userData.noBB = true; }
  A.eyes.forEach(e => e.visible = false); A.snow.visible = false;
  const mode = o.mode || 'night'; A.S.background = A.BG[mode === 'dusk' ? 'dusk' : mode === 'day' ? 'day' : 'night'];
  A.S.fog.color.set(mode === 'dusk' ? 0x9a90a0 : mode === 'day' ? 0xe8e4dc : 0x05060c); A.S.fog.near = mode === 'night' ? 5 : 8; A.S.fog.far = mode === 'night' ? (o.far || 26) : 60;
  A.hemi.intensity = mode === 'day' ? 0.95 : mode === 'dusk' ? 0.6 : 0.12; A.hemi.color.set(mode === 'day' ? 0xfff0d8 : 0x8a90b0); A.moon.intensity = mode === 'night' ? 0.3 : 0.8;
  const c = o.candles ?? 1; A.candles.forEach((f, i) => { const fl = 0.8 + 0.2 * Math.sin(t * (9 + i) + i * 2); f.visible = c > 0.05; f.scale.setScalar(0.35 * c * fl); }); A.cl.forEach((l, i) => l.intensity = 5 * c * (0.85 + 0.15 * Math.sin(t * 11 + i * 3)));
  A.lanterns.forEach(([m, l]) => { m.material.color.set(o.lanterns ? 0xffd890 : 0x2a2418); l.intensity = o.lanterns ? 7 : 0; });
  A.shM.color.set(mode === 'day' ? 0xf0ece0 : mode === 'dusk' ? 0xd8c8a8 : 0x6a7898); A.corrL.intensity = 0; A.roomL.intensity = mode === 'night' ? 1.5 : 4; A.roomL.color.set(mode === 'night' ? 0xa8b8e8 : 0xfff0d8);
  A.fu2.bl.scale.set(1, 1, 1); A.fu2.bl.rotation.set(0, 0, 0); A.fu2.bl.position.set(0, 0.16, 0.3); A.tLamp.intensity = 0;
}
function put(A, who, tx, x, y, z, ry = 0) { const s = A[who]; s.visible = true; setTex(s, Array.isArray(A.T[tx]) ? A.T[tx][0] : A.T[tx]); s.position.set(x, y, z); s.rotation.y = ry; return s; }
function eyesOn(A, x, y, z, k = 1, dx = 0.08) { A.eyes.forEach((e, i) => { e.visible = k > 0; e.material.opacity = k; e.position.set(x + (i ? dx : -dx), y, z); }); }
function snowOn(A, t, sp = 0.7) { A.snow.visible = true; const pa = A.snow.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { pa.setY(i, ((A.sp0[i * 3 + 1] - t * sp) % 16 + 16) % 16 - 6); pa.setX(i, A.sp0[i * 3] + Math.sin(t * 0.7 + i) * 0.3); } pa.needsUpdate = true; A.snow.position.copy(A.cam.position); }
const SY = 1.12, SZ = -6.4;   // Statue steht auf dem Sockel
const EYE_Y = SY + 2.3 * (1 - 234 / 1024);

export const SHOTS = {
  // Einstieg: Kamera faehrt um die Statue, hinten oeffnet das zweite Gesicht die Augen, Kerzen gehen aus
  statue_open(W, p, t, sh) { const A = W.D, dt = t - sh.s, dur = sh.e - sh.s; const out = dt > dur - 0.55; base(A, t, { candles: out ? 0 : 1 - sm(0.8, 0.95, p) * 0.6, far: 18 });
    const a = L(0.15, Math.PI - 0.05, ease(clamp(p / 0.8))), rad = Math.cos(a) < 0 ? L(2.6, 1.3, clamp(-Math.cos(a) * 1.6)) : 2.6, cam = V(Math.sin(a) * rad, 1.9 + p * 0.3, SZ + Math.cos(a) * rad); const behind = Math.cos(a) < 0;
    put(A, 'statue', behind ? (p > 0.72 ? 'stBo' : 'stB') : 'stF', 0, SY, SZ); if (behind && p > 0.72) eyesOn(A, 0, EYE_Y, SZ - 0.04, out ? 1 : sm(0.72, 0.8, p));
    look(A.cam, cam, V(0, L(1.9, 2.75, sm(0.5, 1, p)), SZ)); fov(A.cam, L(52, 36, sm(0.6, 1, p)));
    return { world: A, vig: 0.85, shake: p > 0.72 && p < 0.8 ? 0.004 : 0.0006 }; },
  trip(W, p, t) { const A = W.D; base(A, t, { mode: 'dusk' }); A.tLamp.intensity = 6; A.tWin.material.color.set(0xffb060); snowOn(A, t, 0.6); const z = L(-36, -48, ease(p));
    look(A.cam, V(EX + 0.4, A.hE(z) + 1.7, z), V(EX, A.hE(-66) + 3.5, -70)); fov(A.cam, 55); return { world: A, vig: 0.6 }; },
  statue_day(W, p, t) { const A = W.D; base(A, t, { lanterns: true, candles: 1, far: 30 }); A.hemi.intensity = 0.35; put(A, 'boy', 'boyB', -0.55, 0, -3.6); put(A, 'ben', 'benB', 0.55, 0, -3.6);
    const side = sm(0.5, 0.85, p); put(A, 'statue', side > 0.5 ? 'stB' : 'stF', 0, SY, SZ);
    const a = L(0, Math.PI * 0.82, side), hy = L(2.1, 2.85, side), rad = Math.cos(a) < 0 ? L(3.2, 1.35, clamp(-Math.cos(a) * 1.6)) : 3.2, cam = side < 0.01 ? lerpV(V(0.3, 1.7, 0.5), V(0.2, 1.75, -0.6), ease(p / 0.5)) : V(Math.sin(a) * rad, hy, SZ + Math.cos(a) * rad + (1 - side) * 2.5);
    look(A.cam, cam, V(0, hy, SZ)); fov(A.cam, 50); return { world: A, vig: 0.7 }; },
  rule(W, p, t) { const A = W.D; base(A, t); put(A, 'boy', 'boyS', RX - 1.2, 0, 0.6); look(A.cam, V(RX - 1.18, 1.0, L(2.0, 1.85, ease(p))), V(RX - 1.2, 0.98, 0.6)); fov(A.cam, 55); return { world: A, vig: 0.85 }; },
  empty(W, p, t) { const A = W.D; base(A, t, { candles: 0.45, far: 20 }); A.moon.intensity = 0.7; look(A.cam, lerpV(V(0.4, 1.6, 1.5), V(0.1, 1.5, -2.2), ease(p)), V(0, 1.3, SZ)); fov(A.cam, 48); return { world: A, vig: 0.9, shake: 0.0005 }; },
  corridor(W, p, t, sh) { const A = W.D; base(A, t, { far: 30 }); A.corrL.intensity = 2.2; A.corrL.position.set(CX, 2.4, -6);
    // Schatten mit vier Armen hinter dem Papier, kommt ruckartig naeher
    const k = Math.floor(t * 3), z = L(-10.5, -5.6, Math.floor(p * 9) / 9 * 0.7 + p * 0.3); put(A, 'sil', 'sil', CX + 1.24, 0, z, -Math.PI / 2); setTex(A.sil, A.T.sil[k % 4]);
    look(A.cam, lerpV(V(CX - 1.05, 1.45, -2.6), V(CX - 1.0, 1.4, -3.2), ease(p)), V(CX + 1.3, 1.35, -6.6)); fov(A.cam, 56); return { world: A, vig: 0.9 }; },
  pass(W, p, t, sh) { const A = W.D; base(A, t, { far: 30 }); A.corrL.intensity = 2.0; A.corrL.position.set(CX, 2.4, -4); const s1 = sh.segs[1].s;
    put(A, 'boy', 'boyC', CX - 1.0, 0, -6.6, Math.PI / 2); put(A, 'ben', 'benS', CX - 1.0, 0, -7.6, Math.PI / 2);
    if (t < s1) { const q = clamp((t - sh.s) / (s1 - sh.s)), z = L(-15, -4.2, q); put(A, 'suk', 'lvF', CX + 0.25, 0, z, 0); setTex(A.suk, A.T.lvF[Math.floor(t * 4) % 4]); A.suk.userData.noBB = false;
      look(A.cam, V(CX + 0.95, 1.45, -1.2), V(CX - 0.5, 1.1, -7.6)); fov(A.cam, 50); }
    else { look(A.cam, V(CX + 0.25, 1.05, -7.4), V(CX - 1.0, 0.98, -7.6)); fov(A.cam, 45); setTex(A.ben, A.T.benS); A.ben.position.x = CX - 1.0 + Math.sin(t * 40) * 0.005; }
    return { world: A, vig: 0.9 }; },
  turn(W, p, t, sh) { const A = W.D; base(A, t, { far: 30 }); A.corrL.intensity = 2.0; A.corrL.position.set(CX, 2.4, -2); const dt = t - sh.s, dur = sh.e - sh.s, jump = dt > dur * 0.62;
    put(A, 'ben', 'benB', CX - 0.5, 0, -7.0, 0);
    if (!jump) { const z = L(-1.5, 0.8, p); put(A, 'suk', p > 0.35 ? 'lvBo' : 'lvB', CX + 0.2, 0, z, 0); eyesOn(A, CX + 0.2, 2.5 * (1 - 234 / 1024), z + 0.05, sm(0.35, 0.45, p), 0.09); look(A.cam, V(CX - 0.3, 1.5, -9.6), V(CX + 0.1, 1.4, 0)); }
    else { put(A, 'suk', 'lvBo', CX - 0.35, 0, -5.9, 0); eyesOn(A, CX - 0.35, 2.5 * (1 - 234 / 1024), -5.85, 1, 0.09); look(A.cam, V(CX - 0.3, 1.55, -9.2), V(CX - 0.3, 1.8, -5.9)); }
    fov(A.cam, 50); const jd = dt - dur * 0.62; return { world: A, vig: 0.9, flash: jump && jd < 0.1 ? 1 - jd / 0.1 : 0, shake: jump && jd < 0.6 ? 0.012 * (1 - jd / 0.6) : 0 }; },
  morning(W, p, t) { const A = W.D; base(A, t, { mode: 'day', candles: 0.4, far: 60 });
    if (p < 0.45) { A.fu2.bl.position.set(0.2, 0.12, 0.6); A.fu2.bl.rotation.set(0, 0.4, 0.05); A.fu2.bl.scale.set(1, 1, 0.7); look(A.cam, lerpV(V(RX + 1.6, 1.6, 2.5), V(RX + 1.2, 1.4, 2.0), ease(p / 0.45)), V(RX + 0.6, 0.1, -0.5)); fov(A.cam, 50); }
    else { put(A, 'statue', 'stF', 0, SY, SZ); look(A.cam, lerpV(V(0.2, 1.7, 2), V(0.1, 1.9, -1.5), ease((p - 0.45) / 0.55)), V(0, 2.2, SZ)); fov(A.cam, 48); }
    return { world: A, vig: 0.55 }; },
};
for (const k of Object.keys(SHOTS)) { const f = SHOTS[k]; SHOTS[k] = (W, ...a) => { fov(W.D.cam, 50); return f(W, ...a); }; }
SHOTS._billboard = billboard; SHOTS._shake = shake;

// ------------------------------------------------------------------ 2D
let I = null; const img = () => I || (I = { lvB: C.sukuna('back', 'live', true), lvF: C.sukuna('front', 'live', true), jan: C.sukJanus('live', true), dem: C.sukFace('demon', 'live', true), three: C.sukThree(false), threeO: C.sukThree(true), monk: C.monk() });
function redSky(g) { const s = g.createLinearGradient(0, 0, 0, CH); s.addColorStop(0, '#2a0405'); s.addColorStop(0.55, '#8a1a16'); s.addColorStop(0.8, '#b8401f'); s.addColorStop(1, '#1a0203'); g.fillStyle = s; g.fillRect(0, 0, CW, CH); }
function torii(g, x, y, s, col) { g.fillStyle = col; g.fillRect(x - 160 * s, y - 330 * s, 30 * s, 330 * s); g.fillRect(x + 130 * s, y - 330 * s, 30 * s, 330 * s); g.fillRect(x - 220 * s, y - 360 * s, 440 * s, 34 * s); g.fillRect(x - 180 * s, y - 290 * s, 360 * s, 22 * s); }
function redLegend(g, p, t) { const J = img(); redSky(g); torii(g, 200, 1560, 0.9, '#3a0607'); torii(g, 880, 1560, 0.9, '#3a0607'); g.fillStyle = '#3a0607'; g.fillRect(0, 1560, CW, CH - 1560);
  const hh = 2300, k = Math.floor(t / 0.3), top = L(-hh + 1900, 200, ease(p)); g.save(); g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 50; g.translate(CW / 2, top); g.rotate((hsh(k) - 0.5) * 0.03); g.drawImage(J.lvB, -hh / 4, 0, hh / 2, hh); g.restore(); return { vig: 0.85, tint: 0.15 }; }
function bodyBeats(g, p, t, sh) { const J = img(), s0 = sh.segs[0], s1 = sh.segs[1].s;
  if (t >= s1) { // Moench mit Laterne im Dunkeln
    g.fillStyle = '#07060a'; g.fillRect(0, 0, CW, CH); const k = easeOut(clamp((t - s1) / 0.4)), fl = 0.9 + Math.sin(t * 9) * 0.05;
    const gr = g.createRadialGradient(CW * 0.7, 1300, 50, CW * 0.7, 1300, 900 * fl); gr.addColorStop(0, 'rgba(255,170,80,.35)'); gr.addColorStop(1, 'rgba(255,170,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, CW, CH);
    g.save(); g.globalAlpha = k; const s = L(2.2, 2.35, clamp((t - s1) / 4)); g.translate(CW / 2 - 40, 2050); g.scale(s, s); g.drawImage(J.monk, -256, -1024, 512, 1024); g.restore(); return { vig: 0.85 }; }
  redSky(g); const d = s0.e - s0.s, q = (t - s0.s) / d, beat = q < 0.33 ? 0 : q < 0.68 ? 1 : 2, bt = (q - [0, 0.33, 0.68][beat]) * d;
  const pop = L(1.12, 1, easeOut(clamp(bt / 0.25)));
  g.save(); g.translate(CW / 2, 900); g.scale(pop, pop);
  if (beat === 0) g.drawImage(J.lvF, -450, -780, 900, 1800);
  else if (beat === 1) { const w = 1000; g.rotate(Math.sin(t * 2) * 0.05); g.drawImage(J.jan, -w / 2, -w / 2 - 60, w, w); }
  else { const tw = Math.sin(t * 24) * 6; g.drawImage(J.lvF, -700 + tw, -1556 + 60, 1400, 2800); }
  g.restore(); g.font = '400 110px Anton'; g.textAlign = 'center'; g.lineWidth = 14; g.strokeStyle = '#000'; const lab = ['1 KÖRPER', '2 GESICHTER', '4 ARME'][beat]; g.strokeText(lab, CW / 2, 230); g.fillStyle = '#fff'; g.fillText(lab, CW / 2, 230);
  return { vig: 0.8, tint: 0.12, flash: bt < 0.08 ? 0.5 : 0 }; }
function faces(g, p, t, sh) { const J = img(), st = sh.sfx.find(f => f.n === 'stinger'), after = st ? t - st.t : -1;
  g.fillStyle = '#120c08'; g.fillRect(0, 0, CW, CH); const gr = g.createRadialGradient(CW / 2, 800, 50, CW / 2, 800, 1000); gr.addColorStop(0, 'rgba(255,220,160,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, CW, CH);
  // langsamer Zoom auf das dritte Gesicht (rechts am Kopf)
  const z = L(1.0, 1.9, ease(clamp(p * 1.05))) + (after > 0 ? 0.25 * easeOut(clamp(after / 0.25)) : 0), fx = L(0, 150, ease(clamp(p * 1.05))), w = 1100 * z;
  g.save(); g.translate(CW / 2 - fx * z + (after > 0 && after < 0.6 ? Math.sin(t * 60) * 8 : 0), 820); g.drawImage(after > 0 ? J.threeO : J.three, -w / 2, -w / 2, w, w); g.restore();
  return { vig: 0.85, flash: after > 0 && after < 0.12 ? 1 - after / 0.12 : 0, tint: after > 0 ? 0.25 : 0, shake: after > 0 && after < 0.6 ? 0.01 * (1 - after / 0.6) : 0 }; }
export const TWO = { red_legend: redLegend, body_beats: bodyBeats, faces };
