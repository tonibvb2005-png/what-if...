// Folge 6 (Momo): Kinderzimmer bei Nacht mit Nachttisch, Handy, Deckenlampe, Tuerspalt + Handy-2D-Szenen
import * as THREE from 'three';
import * as C from '../chars.js';
import { tex, lam, box, sprite, setTex, glow, gradTex, V, L, clamp, sm, lerpV, look, billboard, shake, rnd, ease } from '../world.js';
import { W as CW, H as CH } from '../overlay.js';

const easeOut = t => 1 - Math.pow(1 - t, 3);
function fov(cam, f) { if (cam.fov !== f) { cam.fov = f; cam.updateProjectionMatrix(); } }
const basic = c => new THREE.MeshBasicMaterial({ color: c });
const MF = {}; const mface = m => MF[m] || (MF[m] = C.momoFace(m, 512));
let MFT = null; const mfaceT = () => MFT || (MFT = C.momoFaceT('close', 512));

// ------------------------------------------------------------------ Messenger-Oberflaeche (eigene, neutrale Optik)
// st: { title, msgs:[{who:'them'|'me', text, img, voice, at, time, ticks}], banner, typing }
function phoneUI(g, w, h, t, st = {}) {
  g.fillStyle = '#0e1117'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1a1f2b'; g.fillRect(0, 0, w, h * 0.11);
  g.fillStyle = '#3a3f4c'; g.beginPath(); g.arc(w * 0.12, h * 0.065, h * 0.03, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.font = `800 ${h * 0.028}px Montserrat`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(st.title || 'Unbekannt', w * 0.2, h * 0.055);
  g.fillStyle = '#8a90a0'; g.font = `700 ${h * 0.018}px Montserrat`; g.fillText(st.sub || 'online', w * 0.2, h * 0.085);
  let y = h * 0.14; const fs = h * 0.026;
  for (const m of st.msgs || []) {
    if (m.at !== undefined && t < m.at) continue;
    const me = m.who === 'me', bw = m.img ? w * 0.62 : m.voice ? w * 0.66 : Math.min(w * 0.72, (g.font = `700 ${fs}px Montserrat`, g.measureText(m.text || '').width) + fs * 1.4);
    const bh = m.img ? w * 0.62 + fs * 1.2 : m.voice ? fs * 2.6 : fs * 2.2, bx = me ? w * 0.95 - bw : w * 0.05;
    g.fillStyle = me ? '#2f6f5a' : '#232938'; g.beginPath(); g.roundRect(bx, y, bw, bh, fs * 0.7); g.fill();
    if (m.img) { const p = clamp((t - (m.at || 0)) / 1.2); g.save(); g.beginPath(); g.roundRect(bx + fs * 0.3, y + fs * 0.3, bw - fs * 0.6, bw - fs * 0.6, fs * 0.5); g.clip();
      if (p < 1) { g.fillStyle = '#2a2f3c'; g.fillRect(bx, y, bw, bw); g.filter = `blur(${(1 - p) * 30}px)`; } g.drawImage(mface('photo'), bx + fs * 0.3, y + fs * 0.3, bw - fs * 0.6, bw - fs * 0.6); g.filter = 'none'; g.restore(); }
    else if (m.voice) { const play = m.play !== undefined ? clamp((t - m.play) / m.dur) : 0; g.fillStyle = '#fff'; g.beginPath(); const px = bx + fs * 1.2, py = y + bh / 2;
      if (play > 0 && play < 1) { g.fillRect(px - fs * 0.35, py - fs * 0.45, fs * 0.25, fs * 0.9); g.fillRect(px + fs * 0.1, py - fs * 0.45, fs * 0.25, fs * 0.9); } else { g.moveTo(px - fs * 0.3, py - fs * 0.5); g.lineTo(px + fs * 0.5, py); g.lineTo(px - fs * 0.3, py + fs * 0.5); g.fill(); }
      for (let i = 0; i < 28; i++) { const bxx = bx + fs * 2.4 + i * (bw - fs * 3.4) / 28, a = 0.3 + 0.7 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)); g.fillStyle = i / 28 < play ? '#7ee0b0' : '#6a7184'; g.fillRect(bxx, py - a * fs * 0.7, fs * 0.22, a * fs * 1.4); } }
    else { g.fillStyle = '#eef1f6'; g.font = `700 ${fs}px Montserrat`; g.textAlign = 'left'; g.fillText(m.text, bx + fs * 0.7, y + bh / 2); }
    if (m.time) { g.fillStyle = '#9aa3b5'; g.font = `700 ${fs * 0.6}px Montserrat`; g.textAlign = 'right'; g.fillText(m.time + (m.ticks ? '  ✓✓' : ''), bx + bw - fs * 0.5, y + bh + fs * 0.6); }
    y += bh + fs * 1.4;
  }
  if (st.typing) { g.fillStyle = '#232938'; g.beginPath(); g.roundRect(w * 0.05, y, fs * 3.4, fs * 1.8, fs * 0.7); g.fill(); g.fillStyle = '#9aa3b5'; for (let i = 0; i < 3; i++) { g.globalAlpha = 0.4 + 0.6 * ((Math.sin(t * 8 - i) + 1) / 2); g.beginPath(); g.arc(w * 0.05 + fs * (0.9 + i * 0.8), y + fs * 0.9, fs * 0.22, 0, 7); g.fill(); } g.globalAlpha = 1; }
  if (st.banner) { g.fillStyle = 'rgba(200,40,40,.92)'; g.beginPath(); g.roundRect(w * 0.08, h * 0.45, w * 0.84, h * 0.08, h * 0.02); g.fill(); g.fillStyle = '#fff'; g.font = `800 ${h * 0.026}px Montserrat`; g.textAlign = 'center'; g.fillText(st.banner, w / 2, h * 0.49); }
}
function phoneFrame(g, t, draw, s = 1, rot = -0.03, vib = 0) {
  g.save(); g.translate(CW / 2 + vib, 900); g.scale(s, s); g.rotate(rot);
  const w = 560, h = 1120; g.fillStyle = '#07080a'; g.beginPath(); g.roundRect(-w / 2 - 20, -h / 2 - 20, w + 40, h + 40, 80); g.fill();
  g.save(); g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 62); g.clip(); g.translate(-w / 2, -h / 2); draw(g, w, h); g.restore();
  g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; const gl = g.createRadialGradient(CW / 2, 900, 100, CW / 2, 900, 900); gl.addColorStop(0, 'rgba(120,160,255,.10)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(0, 0, CW, CH); g.restore();
}
function bedBG(g) { g.fillStyle = '#07080d'; g.fillRect(0, 0, CW, CH); const bl = g.createLinearGradient(0, 0, 0, CH); bl.addColorStop(0, '#141b30'); bl.addColorStop(1, '#06070b'); g.fillStyle = bl; g.fillRect(0, 0, CW, CH);
  g.strokeStyle = 'rgba(255,255,255,.035)'; g.lineWidth = 34; for (let y = 160; y < CH; y += 130) { g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(300, y + 70, 700, y - 70, CW, y + 30); g.stroke(); } }
const phoneScene = (stf, opts = {}) => (g, p, t, shot) => { const st = stf(p, t, shot); bedBG(g);
  const vib = opts.vib && t - shot.s < 1.4 ? Math.sin(t * 90) * 8 : 0; phoneFrame(g, t, (gg, w, h) => phoneUI(gg, w, h, t, st), L(opts.s0 || 1, opts.s1 || 1.08, ease(p)), -0.03, vib);
  if (st.glitch) glitchFX(g, t, st.glitch); return { vig: 0.7, tint: st.tint || 0, flash: st.flash || 0, shake: st.shake || 0 }; };
function glitchFX(g, t, amt) { const seed = Math.floor(t * 12); for (let i = 0; i < 6; i++) { const r = ((seed * 9301 + i * 49297) % 233280) / 233280, y = r * CH, hh = 30 + i * 12; try { g.drawImage(g.canvas, 0, y, CW, hh, (r - 0.5) * 120 * amt, y, CW, hh); } catch (e) {} } }

// ------------------------------------------------------------------ 3D: Kinderzimmer
function buildRoom() {
  const S = new THREE.Scene(); S.background = gradTex([[0, '#03050c'], [1, '#0b1428']]);
  const BG = { night: S.background, dawn: gradTex([[0, '#8fa8d8'], [1, '#f2c79a']]) };
  const hemi = new THREE.HemisphereLight(0x4a5a8a, 0x141018, 0.3); S.add(hemi);
  const moon = new THREE.DirectionalLight(0x8fa4e0, 0.35); moon.position.set(-10, 6, 2); S.add(moon);
  const wall = lam(0x7a6f9a), fl = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), lam(0x8a6a4e)); fl.rotation.x = -Math.PI / 2; S.add(fl);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), lam(0x5a5670)); ceil.rotation.x = Math.PI / 2; ceil.position.y = 3; S.add(ceil);
  S.add(box(8, 3, 0.1, wall, 0, 1.5, -4), box(0.1, 3, 8, wall, 4, 1.5, 0));
  S.add(box(0.1, 0.9, 8, wall, -4, 0.45, 0), box(0.1, 0.8, 8, wall, -4, 2.6, 0), box(0.1, 1.3, 2.6, wall, -4, 1.55, -2.7), box(0.1, 1.3, 2.6, wall, -4, 1.55, 2.7));
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshBasicMaterial({ map: gradTex([[0, '#02040a'], [1, '#0d1a36']]) })); sky.rotation.y = Math.PI / 2; sky.position.set(-6, 1.6, 0); S.add(sky);
  // Wand vorne mit Tuer (Spalt) bei x = 2
  S.add(box(5.2, 3, 0.1, wall, -1.4, 1.5, 4), box(1.6, 3, 0.1, wall, 3.2, 1.5, 4), box(1.2, 0.8, 0.1, wall, 2, 2.6, 4));
  const door = new THREE.Group(); door.position.set(1.2, 0, 4); S.add(door); const dp = box(1.2, 2.2, 0.06, lam(0xe8e4dc), 0.6, 1.1, 0); door.add(dp); door.rotation.y = -0.75;
  const hall = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.4), new THREE.MeshBasicMaterial({ color: 0x0a0c14 })); hall.position.set(1.8, 1.2, 5.2); hall.rotation.y = Math.PI; S.add(hall);
  const eyes = [glow(0.6, [255, 245, 235]), glow(0.6, [255, 245, 235])]; eyes[0].position.set(2.0, 1.62, 4.6); eyes[1].position.set(2.26, 1.62, 4.6); eyes.forEach(e => { e.material.fog = false; S.add(e); });
  // Bett, Nachttisch mit Schublade, Handy, Deckenlampe
  S.add(box(1.5, 0.45, 2.4, lam(0x5a4030), -3.1, 0.22, 0.4), box(1.45, 0.18, 2.3, lam(0xe8e4dc), -3.1, 0.52, 0.4), box(0.6, 0.15, 0.4, lam(0xf2f2ee), -3.1, 0.68, -0.6));
  const blanket = box(1.5, 0.25, 1.6, lam(0x3a6ea8), -3.1, 0.7, 0.85); S.add(blanket);
  const ns = new THREE.Group(); ns.position.set(-3.3, 0, -1.45); S.add(ns); ns.add(box(0.6, 0.55, 0.5, lam(0x8a6a4e), 0, 0.275, 0)); const drawer = box(0.5, 0.18, 0.04, lam(0x9a7a5e), 0, 0.38, 0.26); ns.add(drawer);
  const dglow = glow(0.5, [140, 190, 255]); dglow.position.set(0, 0.47, 0.3); dglow.visible = false; ns.add(dglow);
  const phC = C.cv(256, 512), phG = phC.getContext('2d'), phT = tex(phC);
  const phone = new THREE.Group(); phone.position.set(-3.25, 0.56, -1.45); phone.rotation.x = -Math.PI / 2; S.add(phone);
  phone.add(box(0.1, 0.2, 0.012, lam(0x0a0a0c), 0, 0, 0)); const phS = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.185), new THREE.MeshBasicMaterial({ map: phT })); phS.position.z = 0.007; phone.add(phS);
  const phL = new THREE.PointLight(0x9ab8ff, 0, 3, 1.4); phL.position.set(-3.25, 0.8, -1.4); S.add(phL);
  const lampB = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 10), basic(0xfff2cc)); lampB.position.set(0, 2.8, 0); S.add(lampB); S.add(box(0.02, 0.2, 0.02, lam(0x222222), 0, 2.92, 0));
  const lamp = new THREE.PointLight(0xffe6b0, 0, 12, 1.3); lamp.position.set(0, 2.6, 0); S.add(lamp);
  S.add(box(1.8, 0.06, 0.7, lam(0xe6e2da), 2.4, 0.75, -3.5), box(0.95, 0.6, 0.05, lam(0x15161a), 2.4, 1.2, -3.62));
  const T = { boyF: C.boy('front', 'neutral'), boyS: C.boy('front', 'scared_sweat') };
  const boy = sprite(T.boyF, 1.3); boy.userData.noBB = true; boy.children[0].visible = false; boy.position.set(-3.1, 0.35, 0.05); boy.rotation.y = Math.PI / 2 * 0.85; S.add(boy);
  return { S, BG, hemi, moon, door, eyes, blanket, ns, drawer, dglow, phone, phG, phT, phL, lampB, lamp, boy, T, cam: new THREE.PerspectiveCamera(50, 9 / 16, 0.05, 200) };
}
export function build() { return { R: buildRoom() }; }

function phoneTex(R, t, mode) { const g = R.phG; g.setTransform(1, 0, 0, 1, 0, 0);
  if (mode === 'off') { g.fillStyle = '#050608'; g.fillRect(0, 0, 256, 512); }
  else { phoneUI(g, 256, 512, t, { msgs: [{ who: 'them', img: true }] }); if (mode === 'notif') { g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.roundRect(12, 40, 232, 70, 16); g.fill(); g.fillStyle = '#111'; g.font = '800 20px Montserrat'; g.textAlign = 'left'; g.fillText('Unbekannt', 26, 66); g.font = '700 16px Montserrat'; g.fillText('📷 Bild', 26, 92); } }
  R.phT.needsUpdate = true; R.phL.intensity = mode === 'off' ? 0 : 2.5; }
function base(R, o = {}) {
  const dawn = o.mode === 'dawn'; R.S.background = dawn ? R.BG.dawn : R.BG.night; R.hemi.intensity = dawn ? 1.1 : 0.3; R.moon.intensity = dawn ? 1.0 : 0.35; R.moon.color.set(dawn ? 0xffd2a0 : 0x8fa4e0);
  R.lamp.intensity = o.lamp ? 7 : 0; R.lampB.material.color.set(o.lamp ? 0xfff2cc : 0x444038);
  R.eyes.forEach(e => e.visible = !!o.eyes); R.dglow.visible = false; R.drawer.position.z = 0.26; R.phone.visible = o.phone !== false;
  phoneTex(R, o.t || 0, o.phone === false ? 'off' : (o.phoneMode || 'off'));
  R.boy.visible = !!o.boy; if (o.boy) setTex(R.boy, R.T[o.boy]);
}
export const SHOTS = {
  room_bed(W, p, t) { const R = W.R; base(R, { t, phoneMode: 'notif', boy: 'boyF' }); R.phone.position.y = 0.56 + (Math.floor(t * 20) % 2 && t % 1.2 < 0.6 ? 0.004 : 0);
    R.phL.intensity = 4; look(R.cam, lerpV(V(-0.4, 1.6, 1.6), V(-1.0, 1.4, 1.0), ease(p)), V(-3.15, 0.85, -0.4)); return { world: R, vig: 0.65 }; },
  bed_rule(W, p, t) { const R = W.R; base(R, { t, phoneMode: 'notif', boy: 'boyS', lamp: true }); R.lamp.intensity = 4;
    look(R.cam, V(-1.7, 1.15, L(0.4, 0.3, ease(p))), V(-3.1, 1.15, 0.05)); return { world: R, vig: 0.7 }; },
  drawer_buzz(W, p, t) { const R = W.R; base(R, { t, phone: false, lamp: true }); R.lamp.intensity = 6; const b = Math.sin(t * 80) * 0.004 * (t % 1.0 < 0.6 ? 1 : 0); R.drawer.position.x = b; R.dglow.visible = t % 1.0 < 0.6;
    look(R.cam, lerpV(V(-2.2, 0.9, -0.3), V(-2.6, 0.7, -0.8), ease(p)), V(-3.3, 0.38, -1.45)); return { world: R, vig: 0.65 }; },
  light_out(W, p, t, sh) { const R = W.R; const off = t > sh.segs[0].s + 0.5, fl = !off && Math.sin(t * 40) > 0.3 && t > sh.segs[0].s; const s1 = sh.segs[1] ? sh.segs[1].s : 1e9;
    base(R, { t, phone: false, lamp: !off && !fl, eyes: t > s1 - 0.4, boy: 'boyS' }); R.hemi.intensity = off ? 0.12 : 0.3;
    const k = ease(sm(0.45, 1, p)); look(R.cam, lerpV(V(-2.6, 1.5, -0.6), V(-2.2, 1.55, -0.2), k), lerpV(V(0, 2.6, 0), V(2.13, 1.6, 4.5), k)); fov(R.cam, L(55, 28, k));
    return { world: R, vig: off ? 0.85 : 0.6, shake: t > s1 ? 0.0012 : 0 }; },
  room_dawn(W, p, t) { const R = W.R; base(R, { t, mode: 'dawn', phoneMode: 'off' });
    look(R.cam, lerpV(V(1.2, 1.9, 2.8), V(0.6, 1.7, 2.2), ease(p)), V(-3.1, 0.8, -0.8)); return { world: R, vig: 0.4 }; },
};
for (const k of Object.keys(SHOTS)) { const f = SHOTS[k]; SHOTS[k] = (W, ...a) => { fov(W.R.cam, 50); return f(W, ...a); }; }
SHOTS._billboard = billboard; SHOTS._shake = shake;

// ------------------------------------------------------------------ 2D-Szenen
const chat1 = phoneScene((p, t, sh) => ({ msgs: [{ who: 'them', img: true, at: sh.s + 0.8, time: '02:01' }] }), { vib: true });
function photoBig(g, p, t, shot) { g.fillStyle = '#000'; g.fillRect(0, 0, CW, CH); const s = L(1.0, 1.35, ease(p)), w = CW * 1.15 * s;
  g.drawImage(mface('photo'), CW / 2 - w / 2, 880 - w / 2, w, w); return { vig: 0.85, shake: p < 0.08 ? 0.004 : 0 }; }
const voiceMsg = phoneScene((p, t, sh) => { const s1 = sh.segs[1] ? sh.segs[1].s : 1e9, d = sh.segs[1] ? sh.segs[1].e - s1 : 3;
  return { msgs: [{ who: 'them', img: true, time: '02:01' }, { who: 'them', voice: true, at: sh.s + 0.5, play: s1, dur: d, time: '02:02' }] }; }, { s1: 1.12 });
const blocked = phoneScene((p, t, sh) => { const b = sh.s + 1.2; return t < b ? { title: 'Unbekannt', msgs: [{ who: 'them', img: true }], banner: t > sh.s + 0.4 ? 'KONTAKT BLOCKIERT' : null }
  : { title: '+49 1•• •••• 0303', msgs: [{ who: 'them', text: 'Warum blockierst du mich?', at: b + 0.3, time: '02:04' }] }; }, { vib: true });
const knows = phoneScene((p, t, sh) => ({ title: '+49 1•• •••• 0303', msgs: [{ who: 'them', text: 'Hallo Jonas.', at: sh.s + 0.2, time: '02:05' }, { who: 'them', text: 'Schöne Haustür. Grün.', at: sh.s + 1.6, time: '02:05' }], tint: 0 }), { s1: 1.14 });
const task = phoneScene((p, t, sh) => ({ title: '+49 1•• •••• 0303', msgs: [{ who: 'them', text: 'Aufgabe 1:', at: sh.s + 0.3, time: '02:09' }, { who: 'them', text: 'Um 03:00 Licht aus.', at: sh.s + 1.2, time: '02:09' }] }), { s1: 1.14 });
const sentScene = phoneScene((p, t, sh) => ({ title: '+49 1•• •••• 0303', sub: 'zuletzt online 03:00', msgs: [{ who: 'them', text: 'Aufgabe 1:', time: '02:09' }, { who: 'them', text: 'Um 03:00 Licht aus.', time: '02:09' }, { who: 'me', text: 'Ja', at: sh.s + 1.2, time: '03:00', ticks: true }] }), { s1: 1.16 });
function jaScene(g, p, t, shot) {
  const st = shot.sfx.find(f => f.n === 'stinger'), after = st ? t - st.t : -1;
  if (after < 0) { return sentScene(g, p * 0.4 + 0.6, t, shot); }
  g.fillStyle = '#000'; g.fillRect(0, 0, CW, CH); const k = easeOut(clamp(after / 0.25)), w = CW * L(0.6, 1.5, k);
  g.drawImage(mface('close'), CW / 2 - w / 2 + Math.sin(t * 70) * 10 * (1 - clamp(after)), 860 - w / 2, w, w);
  return { vig: 0.8, tint: 0.35, flash: after < 0.12 ? 1 - after / 0.12 : 0, shake: after < 0.6 ? 0.01 * (1 - after / 0.6) : 0 };
}
function redSky(g) { const s = g.createLinearGradient(0, 0, 0, CH); s.addColorStop(0, '#3a0507'); s.addColorStop(0.55, '#a51f1a'); s.addColorStop(0.8, '#d24a2c'); s.addColorStop(1, '#260304'); g.fillStyle = s; g.fillRect(0, 0, CW, CH); }
let MB = null;
function redMomo(g, p, t) { if (!MB) MB = C.MONSTERS['MOMO'](); redSky(g);
  g.fillStyle = '#4a0709'; for (let i = 0; i < 14; i++) { const x = i * 90 - 30, h = 240 + ((i * 53) % 160); g.beginPath(); g.moveTo(x - 80, CH); g.lineTo(x, CH - h); g.lineTo(x + 80, CH); g.fill(); }
  const hh = 2500, top = L(-hh + 1800, 120, ease(p)); g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 40; g.drawImage(MB, CW / 2 - hh / 4, top, hh / 2, hh); g.restore(); return { vig: 0.75, tint: 0.15 }; }
function redTasks(g, p, t) { redSky(g); const n = Math.floor(L(1, 7, ease(p)));
  g.save(); g.globalAlpha = 0.25; const w = 900; g.drawImage(mfaceT(), CW / 2 - w / 2, 300, w, w); g.restore();
  for (let i = 0; i < n; i++) { const y = 380 + i * 150; g.fillStyle = 'rgba(14,10,12,.9)'; g.beginPath(); g.roundRect(120, y, CW - 240, 110, 24); g.fill();
    g.fillStyle = '#ff4a3d'; g.font = '400 54px Anton'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(`AUFGABE ${i + 1}`, 160, y + 56);
    g.fillStyle = '#e9e2dc'; g.font = '800 30px Montserrat'; g.fillText(['Licht aus.', 'Tür auf.', 'Fenster auf.', 'Nicht schlafen.', 'Antworte.', 'Komm runter.', 'Komm zu mir.'][i], 460, y + 56); }
  return { vig: 0.75, tint: 0.15 }; }
function drawerPut(g, p, t) {
  g.fillStyle = '#2a2018'; g.fillRect(0, 0, CW, CH); const lg = g.createRadialGradient(CW / 2, 0, 50, CW / 2, 0, 1400); lg.addColorStop(0, 'rgba(255,230,170,.35)'); lg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = lg; g.fillRect(0, 0, CW, CH);
  g.fillStyle = '#7a5a3e'; g.fillRect(80, 900, CW - 160, 900); g.fillStyle = '#5a3f2a'; g.fillRect(120, 940, CW - 240, 520);
  const close = sm(0.55, 0.9, p), dy = L(0, 300, close); g.fillStyle = '#8a6a4e'; g.fillRect(100, 1200 + dy - 300, CW - 200, 120); g.fillStyle = '#d8c6a0'; g.beginPath(); g.roundRect(CW / 2 - 60, 1240 + dy - 300, 120, 34, 17); g.fill();
  const ph = sm(0.05, 0.5, p), py = L(500, 1080, easeOut(ph)); if (close < 0.6) { g.save(); g.translate(CW / 2, py); g.rotate(-0.2 + ph * 0.2); g.fillStyle = '#08090b'; g.beginPath(); g.roundRect(-110, -200, 220, 400, 30); g.fill(); g.fillStyle = '#121626'; g.beginPath(); g.roundRect(-96, -186, 192, 372, 22); g.fill();
    g.fillStyle = '#f4cfa5'; g.strokeStyle = '#1c1512'; g.lineWidth = 9; g.beginPath(); g.roundRect(-150, 40, 300, 150, 60); g.fill(); g.stroke(); g.restore(); }
  return { vig: 0.6 };
}
function bedClock(g, p, t) {
  g.fillStyle = '#05060a'; g.fillRect(0, 0, CW, CH);
  g.fillStyle = '#1f3a66'; g.beginPath(); g.moveTo(0, 1250); g.quadraticCurveTo(CW / 2, 1080, CW, 1250); g.lineTo(CW, CH); g.lineTo(0, CH); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 14; for (let y = 1300; y < CH; y += 70) { g.beginPath(); g.moveTo(0, y); g.quadraticCurveTo(CW / 2, y - 120, CW, y); g.stroke(); }
  const mins = L(3 * 60 + 2, 6 * 60 + 45, ease(p)), hh = Math.floor(mins / 60), mm = Math.floor(mins % 60);
  g.fillStyle = '#0b0c10'; g.beginPath(); g.roundRect(CW / 2 - 330, 640, 660, 300, 40); g.fill();
  g.save(); g.shadowColor = 'rgba(255,60,50,.8)'; g.shadowBlur = 40; g.fillStyle = '#ff4a3d'; g.font = '400 220px Anton'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`0${hh}:${String(mm).padStart(2, '0')}`, CW / 2, 795); g.restore();
  return { vig: 0.7 };
}
export const TWO = { chat1, photo_big: photoBig, voice_msg: voiceMsg, blocked, knows, red_momo: redMomo, red_tasks: redTasks, task, drawer_put: drawerPut, bed_clock: bedClock, sent: sentScene, ja: jaScene };
