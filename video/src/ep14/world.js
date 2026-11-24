// Folge 13 – SCP-173: Betonflur mit Alarm-Drehlicht und Neon, Kontrollraum, Zellentuer + 2D-Szenen
import * as THREE from 'three';
import * as C from '../chars.js';
import { tex, lam, box, sprite, setTex, glow, gradTex, V, L, clamp, sm, lerpV, look, billboard, shake, rnd, ease } from '../world.js';
import { W as CW, H as CH } from '../overlay.js';

const easeOut = t => 1 - Math.pow(1 - t, 3);
function fov(cam, f) { if (cam.fov !== f) { cam.fov = f; cam.updateProjectionMatrix(); } }
const basic = c => new THREE.MeshBasicMaterial({ color: c });
function labelTex(txt, bg = '#d9b020', fg = '#111') { const c = C.cv(512, 128), g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, 512, 128); g.fillStyle = fg; for (let x = -128; x < 512; x += 64) { g.beginPath(); g.moveTo(x, 128); g.lineTo(x + 32, 128); g.lineTo(x + 96, 0); g.lineTo(x + 64, 0); g.fill(); }
  g.fillStyle = bg; g.fillRect(40, 24, 432, 80); g.fillStyle = fg; g.font = '400 64px Anton'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 256, 66); return tex(c); }

function buildSite() {
  const S = new THREE.Scene(); S.background = new THREE.Color(0x020203); S.fog = new THREE.Fog(0x050506, 4, 30);
  const hemi = new THREE.HemisphereLight(0x8a8a90, 0x202020, 0.12); S.add(hemi);
  const conc = lam(0x6a6862), conc2 = lam(0x5a5852);
  // Flur: x -2..2, z 4..-40
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(4, 46), conc2); fl.rotation.x = -Math.PI / 2; fl.position.z = -18; S.add(fl);
  S.add(box(0.2, 3.2, 46, conc, -2.1, 1.6, -18), box(0.2, 3.2, 46, conc, 2.1, 1.6, -18), box(4.4, 0.2, 46, conc2, 0, 3.3, -18));
  for (let z = 2; z > -40; z -= 6) { S.add(box(0.25, 3.2, 0.3, lam(0x4a4842), -1.95, 1.6, z), box(0.25, 3.2, 0.3, lam(0x4a4842), 1.95, 1.6, z)); }
  for (let z = -1; z > -40; z -= 3) S.add(box(4, 0.02, 0.06, lam(0x3a3a36), 0, 0.01, z));
  const neons = [], nl = []; for (let z = 1; z > -38; z -= 5) { const n = box(0.12, 0.05, 1.4, basic(0xdfe8f0), 0, 3.17, z); S.add(n); neons.push(n); }
  for (let z = -2; z > -36; z -= 10) { const l = new THREE.PointLight(0xdfe8f0, 5, 10, 1.4); l.position.set(0, 2.9, z); S.add(l); nl.push(l); }
  // Alarm-Drehlicht
  const alarm = new THREE.Group(); alarm.position.set(1.85, 2.7, -6); S.add(alarm); alarm.add(box(0.25, 0.25, 0.25, basic(0xff2a20), 0, 0, 0));
  const red = new THREE.SpotLight(0xff2010, 30, 25, 0.5, 0.6, 1.0); red.position.set(1.8, 2.7, -6); S.add(red, red.target);
  const redG = glow(1.4, [255, 40, 30]); redG.position.copy(alarm.position); S.add(redG);
  // Zellentuer seitlich bei z = -14 (Wand x = -2.1)
  const cell = new THREE.Group(); cell.position.set(-2.0, 0, -14); S.add(cell);
  cell.add(box(0.3, 2.6, 2.2, lam(0x4a4e52), 0, 1.3, 0)); const dark = box(0.1, 2.3, 1.6, basic(0x020202), 0.12, 1.15, 0); cell.add(dark);
  const doorL = new THREE.Group(); doorL.position.set(0.18, 0, 0.8); cell.add(doorL); doorL.add(box(0.12, 2.3, 1.6, lam(0x7a7e82), 0, 1.15, -0.8)); doorL.rotation.y = -0.9;
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: labelTex('SCP-173') })); lab.position.set(0.2, 2.75, 0); lab.rotation.y = Math.PI / 2; cell.add(lab);
  // Kratzspuren auf der Tuer
  const scr = C.cv(256, 256), sg = scr.getContext('2d'); sg.strokeStyle = 'rgba(30,26,22,.8)'; sg.lineWidth = 6; for (let k = 0; k < 4; k++) { sg.beginPath(); sg.moveTo(60 + k * 30, 40); sg.lineTo(90 + k * 30, 220); sg.stroke(); }
  const scrM = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshBasicMaterial({ map: tex(scr), transparent: true })); scrM.position.set(0.07, 1.3, -0.6); scrM.rotation.y = Math.PI / 2; doorL.add(scrM);
  // Kontrollraum (bei x = 40)
  const K = new THREE.Group(); K.position.set(40, 0, 0); S.add(K);
  const kf = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), conc2); kf.rotation.x = -Math.PI / 2; K.add(kf); K.add(box(8, 3, 0.2, conc, 0, 1.5, -3), box(0.2, 3, 8, conc, -4, 1.5, 0), box(0.2, 3, 8, conc, 4, 1.5, 0));
  K.add(box(5, 0.9, 1, lam(0x2a2c30), 0, 0.45, -2.2)); const screens = []; for (let i = 0; i < 6; i++) { const m = box(0.8, 0.5, 0.05, basic(0x60d0ff), -2 + (i % 3) * 2 - (i > 2 ? 0 : 0), 1.3 + (i > 2 ? 0.6 : 0), -2.6); K.add(m); screens.push(m); }
  const kl = new THREE.PointLight(0x80c8ff, 6, 8, 1.3); kl.position.set(40, 1.8, -1.6); S.add(kl);
  // Figuren
  const PT = { a: C.scp173('a'), b: C.scp173('b'), c: C.scp173('c') };
  const st = sprite(PT.a, 1.95, 0.08); st.userData.noBB = true; st.children[0].visible = false; S.add(st);
  const T = { boyS: C.boy('front', 'scared_sweat'), boyB: C.boy('back'), benB: C.ben('back'), benS: C.ben('front', 'scared_sweat') };
  const boy = sprite(T.boyB, 1.35); boy.userData.noBB = true; boy.children[0].visible = false; S.add(boy);
  const ben = sprite(T.benB, 1.35); ben.userData.noBB = true; ben.children[0].visible = false; S.add(ben);
  // Taschenlampen
  const fl1 = new THREE.SpotLight(0xfff4d8, 0, 14, 0.32, 0.4, 1.2), fl2 = new THREE.SpotLight(0xfff4d8, 0, 14, 0.32, 0.4, 1.2); S.add(fl1, fl1.target, fl2, fl2.target);
  const torch = new THREE.Group(); S.add(torch); torch.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.28, 10), lam(0x222222))); const tg = glow(0.3, [255, 240, 200]); tg.position.y = 0.15; torch.add(tg); torch.rotation.z = Math.PI / 2;
  const tl = new THREE.SpotLight(0xfff4d8, 0, 6, 0.4, 0.5, 1.2); S.add(tl, tl.target);
  return { S, hemi, neons, nl, alarm, red, redG, st, PT, boy, ben, T, fl1, fl2, torch, tl, screens, kl, cam: new THREE.PerspectiveCamera(50, 9 / 16, 0.05, 200) };
}
export function build() { return { Sc: buildSite() }; }

function base(A, t, o = {}) { A.st.visible = A.boy.visible = A.ben.visible = A.torch.visible = false; A.fl1.intensity = A.fl2.intensity = A.tl.intensity = 0;
  const on = o.lights ?? 1; A.nl.forEach(l => l.intensity = 5 * on); A.neons.forEach(n => n.material.color.set(on > 0.5 ? 0xdfe8f0 : 0x1a1c1e));
  const a = t * 4.2; A.alarm.rotation.y = a; A.red.intensity = (o.alarm ?? 1) * 40; A.red.target.position.set(1.8 + Math.cos(a) * 3, 0.5, -6 + Math.sin(a) * 3); A.redG.material.opacity = 0.5 + 0.5 * Math.max(0, Math.cos(a)); A.redG.visible = (o.alarm ?? 1) > 0; }
function statue(A, pose, x, z, ry = 0) { A.st.visible = true; setTex(A.st, A.PT[pose]); A.st.position.set(x, 0, z); A.st.rotation.y = ry; }
const hsh = n => { const x = Math.sin(n * 91.7) * 43758.5; return x - Math.floor(x); };

export const SHOTS = {
  hall_open(W, p, t, sh) { const A = W.Sc; const dt = t - sh.s; const dur = sh.e - sh.s, flick = [0.08, 0.28, 0.5, 0.72].map(f => f * dur), k = flick.filter(f => dt > f).length, off = flick.some(f => dt > f && dt < f + 0.14);
    base(A, t, { lights: off ? 0 : 1 }); if (!off) statue(A, ['a', 'b', 'c', 'a', 'c'][k], [0.6, -0.5, 0.4, -0.2, 0.1][k], [-26, -19, -13, -8, -5][k]);
    look(A.cam, V(0.2, 1.6, 3), V(0.1, 1.3, -20)); fov(A.cam, 48); return { world: A, vig: 0.85, shake: flick.some(f => dt > f + 0.14 && dt < f + 0.3) ? 0.004 : 0.0006 }; },
  control(W, p, t, sh) { const A = W.Sc; base(A, t, { alarm: 0.6 }); const off = p > 0.45; A.screens.forEach((m, i) => m.material.color.set(off && hsh(i) < p ? 0x050608 : 0x60d0ff)); A.kl.intensity = off ? 1.2 : 6;
    look(A.cam, lerpV(V(40, 1.6, 2.6), V(40, 1.5, 1.8), ease(p)), V(40, 1.2, -2.4)); return { world: A, vig: 0.75, shake: off && p < 0.55 ? 0.003 : 0 }; },
  cell_door(W, p, t) { const A = W.Sc; base(A, t, { lights: Math.sin(t * 19) > 0.85 ? 0.2 : 1 }); look(A.cam, lerpV(V(1.5, 1.6, -8.4), V(1.2, 1.55, -9.6), ease(p)), V(-1.9, 1.3, -14)); fov(A.cam, 50); return { world: A, vig: 0.85 }; },
  boy_rule(W, p, t) { const A = W.Sc; base(A, t); A.boy.visible = true; setTex(A.boy, A.T.boyS); A.boy.position.set(0, 0, -3); A.boy.rotation.y = 0;
    look(A.cam, V(0.02, 1.05, L(-2.1, -2.2, ease(p))), V(0, 0.98, -3)); fov(A.cam, 58); return { world: A, vig: 0.8 }; },
  facing(W, p, t, sh) { const A = W.Sc; base(A, t, { lights: 0.15 }); A.boy.visible = A.ben.visible = true; setTex(A.boy, A.T.boyB); setTex(A.ben, A.T.benB);
    A.boy.position.set(-0.45, 0, -4); A.ben.position.set(0.45, 0, -4); A.boy.rotation.y = A.ben.rotation.y = Math.PI; statue(A, 'a', 0, -8.5);
    for (const [f, x] of [[A.fl1, -0.45], [A.fl2, 0.45]]) { f.intensity = 30; f.position.set(x, 1.1, -4.2); f.target.position.set(Math.sin(t * 7 + x) * 0.05, 1.3, -8.5); }
    const s1 = sh.segs[1] ? sh.segs[1].s : 1e9; if (t > s1) A.fl2.target.position.x += Math.sin(t * 40) * 0.08; // Bens Hand zittert
    look(A.cam, lerpV(V(0, 1.45, -0.6), V(0, 1.4, -1.4), ease(p)), V(0, 1.05, -8.5)); return { world: A, vig: 0.85 }; },
  flick(W, p, t, sh) { const A = W.Sc; const dt = t - sh.s; const on = !(dt > 0.15 && dt < 0.4) && !(dt > 0.6 && dt < 1.0) && dt < 1.3; base(A, t, { lights: 0.15 });
    A.fl1.intensity = on ? 30 : 0; A.fl1.position.set(-0.45, 1.1, -4.2); A.fl1.target.position.set(0, 1.3, -7); if (on) statue(A, dt < 0.4 ? 'a' : 'b', 0, dt < 0.4 ? -8.5 : -6.2);
    A.red.intensity = on ? 40 : 0; A.redG.visible = on; look(A.cam, V(0, 1.6, -2.4), V(0, 1.2, -8)); return { world: A, vig: 0.9, shake: on ? 0 : 0.003 }; },
  in_face(W, p, t, sh) { const A = W.Sc; const dt = t - sh.s; base(A, t, { lights: 0.15 }); statue(A, 'c', 0, -3.0); A.st.material.emissiveIntensity = 0.12; A.fl1.intensity = 40; A.fl1.position.set(0, 1.2, -1.4); A.fl1.target.position.set(0, 1.6, -3);
    look(A.cam, V(0, 1.55, L(-1.6, -1.95, easeOut(clamp(dt / 0.4)))), V(0.1, 1.75, -3)); fov(A.cam, 55); return { world: A, vig: 0.9, flash: dt < 0.1 ? 1 - dt / 0.1 : 0, shake: dt < 0.5 ? 0.008 * (1 - dt / 0.5) : 0.0008 }; },
  ben_gone(W, p, t) { const A = W.Sc; base(A, t, { lights: 0.15, alarm: 0.5 }); A.torch.visible = true; A.torch.position.set(0.5 + Math.sin(t * 2) * 0.05, 0.05, -4.1); A.torch.rotation.y = t * 0.8;
    A.tl.intensity = 18; A.tl.position.copy(A.torch.position); A.tl.target.position.set(0.5 + Math.cos(t * 0.8) * 2, 0, -4.1 - Math.sin(t * 0.8) * 2);
    look(A.cam, V(0.2, 1.3, -2.6), V(0.5, 0.1, -4.2)); return { world: A, vig: 0.9 }; },
};
for (const k of Object.keys(SHOTS)) { const f = SHOTS[k]; SHOTS[k] = (W, ...a) => { fov(W.Sc.cam, 50); W.Sc.st.material.emissiveIntensity = 0.08; return f(W, ...a); }; }
SHOTS._billboard = billboard; SHOTS._shake = shake;

// ------------------------------------------------------------------ 2D
function redSky(g) { const s = g.createLinearGradient(0, 0, 0, CH); s.addColorStop(0, '#2a0405'); s.addColorStop(0.55, '#8a1a16'); s.addColorStop(0.8, '#b8401f'); s.addColorStop(1, '#1a0203'); g.fillStyle = s; g.fillRect(0, 0, CW, CH); }
let SP = null, SF = null;
function redScp(g, p, t) { if (!SP) SP = { a: C.scp173('a'), b: C.scp173('b'), c: C.scp173('c') }; redSky(g); g.fillStyle = '#3a0607'; g.fillRect(0, 1560, CW, CH - 1560);
  const hh = 2300, top = L(-hh + 1850, 220, ease(p)); g.save(); g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 50; g.drawImage(SP.a, CW / 2 - hh / 4, top, hh / 2, hh); g.restore(); return { vig: 0.85, tint: 0.15 }; }
function redMoves(g, p, t, shot) { if (!SP) SP = { a: C.scp173('a'), b: C.scp173('b'), c: C.scp173('c') }; redSky(g); g.fillStyle = '#3a0607'; g.fillRect(0, 1500, CW, CH - 1500);
  const n = Math.min(3, Math.floor(p * 3.6)), dt = (p * 3.6) % 1, blink = dt < 0.12; if (blink) { g.fillStyle = '#000'; g.fillRect(0, 0, CW, CH); return { vig: 0.9 }; }
  const pos = [[CW * 0.25, 900], [CW * 0.72, 1100], [CW * 0.45, 1500], [CW * 0.5, 2200]][n], s = [1, 1.3, 1.9, 3.2][n], img = [SP.a, SP.b, SP.c, SP.c][n];
  g.save(); g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 40; g.drawImage(img, pos[0] - 260 * s, pos[1] - 1040 * s, 520 * s, 1040 * s); g.restore(); return { vig: 0.85, tint: 0.15, shake: dt < 0.2 ? 0.004 : 0 }; }
function eyesBurn(g, p, t, shot) { g.fillStyle = '#0a0606'; g.fillRect(0, 0, CW, CH);
  const cy = 860, w = 760, h = 380; g.fillStyle = '#e9c6a0'; g.fillRect(0, cy - 420, CW, 840); // Haut
  g.save(); g.beginPath(); g.ellipse(CW / 2, cy, w / 2, h / 2, 0, 0, 7); g.clip(); g.fillStyle = '#f4ebe4'; g.fillRect(0, 0, CW, CH);
  g.strokeStyle = 'rgba(200,30,30,.8)'; g.lineWidth = 5; for (let i = 0; i < 22; i++) { const a = i / 22 * 6.28; g.beginPath(); g.moveTo(CW / 2 + Math.cos(a) * 360, cy + Math.sin(a) * 180); g.quadraticCurveTo(CW / 2 + Math.cos(a + 0.3) * 230, cy + Math.sin(a + 0.3) * 120, CW / 2 + Math.cos(a) * 140, cy + Math.sin(a) * 70); g.stroke(); }
  const jit = Math.sin(t * 50) * 4; g.fillStyle = '#5a3a20'; g.beginPath(); g.arc(CW / 2 + jit, cy, 140, 0, 7); g.fill(); g.fillStyle = '#0a0606'; g.beginPath(); g.arc(CW / 2 + jit, cy, 62 + Math.sin(t * 3) * 4, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(CW / 2 - 40 + jit, cy - 40, 22, 0, 7); g.fill();
  const close = Math.max(0, Math.sin(t * 9) - 0.85) * 3; g.fillStyle = '#d9b490'; g.fillRect(0, 0, CW, cy - h / 2 + close * h); g.restore();
  g.strokeStyle = '#1c1512'; g.lineWidth = 14; g.beginPath(); g.ellipse(CW / 2, cy, w / 2, h / 2, 0, 0, 7); g.stroke();
  g.fillStyle = 'rgba(160,210,255,.6)'; g.beginPath(); g.ellipse(CW / 2 + 330, cy + 150 + p * 300, 14, 26, 0, 0, 7); g.fill(); // Traene
  return { vig: 0.85, shake: 0.0015 }; }
function scratchDark(g, p, t) { g.fillStyle = '#000'; g.fillRect(0, 0, CW, CH); const n = Math.floor(p * 6); g.strokeStyle = 'rgba(120,110,100,.25)'; g.lineWidth = 8;
  for (let i = 0; i < n; i++) { g.beginPath(); g.moveTo(200 + i * 120, 600 + (i * 97) % 300); g.lineTo(260 + i * 120, 1000 + (i * 53) % 300); g.stroke(); } return { vig: 0.9, shake: Math.sin(t * 20) > 0.6 ? 0.004 : 0 }; }
function eyeClose(g, p, t, shot) { const st = shot.sfx.find(f => f.n === 'stinger'), after = st ? t - st.t : -1;
  if (after > 0) { if (!SF) SF = C.scpFace(); g.fillStyle = '#000'; g.fillRect(0, 0, CW, CH); const w = CW * L(0.8, 1.5, easeOut(clamp(after / 0.25))); g.drawImage(SF, CW / 2 - w / 2, 860 - w / 2, w, w);
    return { vig: 0.8, tint: 0.35, flash: after < 0.12 ? 1 - after / 0.12 : 0, shake: after < 0.6 ? 0.012 * (1 - after / 0.6) : 0 }; }
  const r = eyesBurn(g, p, t, shot); const lid = ease(clamp(p * 1.1)); g.fillStyle = '#d9b490'; g.fillRect(0, 0, CW, 860 - 190 + lid * 380); g.strokeStyle = '#1c1512'; g.lineWidth = 14; g.beginPath(); g.moveTo(CW / 2 - 380, 860); g.quadraticCurveTo(CW / 2, 860 - 190 + lid * 380 - 30, CW / 2 + 380, 860); g.stroke(); return r; }
export const TWO = { red_scp: redScp, red_moves: redMoves, eyes_burn: eyesBurn, scratch_dark: scratchDark, eye_close: eyeClose };
