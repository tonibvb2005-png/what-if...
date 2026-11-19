// Folge 9 – The Rake: Kinderzimmer bei Mondlicht, Blick vom Kopfkissen, Wesen am Bettende, Morgen mit Schwester + 2D-Szenen
import * as THREE from 'three';
import * as C from '../chars.js';
import { tex, lam, box, sprite, setTex, glow, gradTex, V, L, clamp, sm, lerpV, look, billboard, shake, rnd, ease } from '../world.js';
import { W as CW, H as CH } from '../overlay.js';

const easeOut = t => 1 - Math.pow(1 - t, 3);
function fov(cam, f) { if (cam.fov !== f) { cam.fov = f; cam.updateProjectionMatrix(); } }
const basic = c => new THREE.MeshBasicMaterial({ color: c });

function blanketTex(scratch) { const c = C.cv(512, 512), g = c.getContext('2d'); g.fillStyle = '#3a5a8a'; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 10; for (let x = 0; x < 512; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
  if (scratch) { g.strokeStyle = '#e8e2d6'; g.lineCap = 'round'; for (const [x0, y0] of [[120, 80], [300, 140]]) for (let k = 0; k < 4; k++) { g.lineWidth = 9; g.beginPath(); g.moveTo(x0 + k * 26, y0); g.quadraticCurveTo(x0 + k * 26 + 20, y0 + 120, x0 + k * 26 + 6, y0 + 230); g.stroke(); } }
  return tex(c); }
function buildRoom() {
  const S = new THREE.Scene(); const BG = { night: gradTex([[0, '#02040a'], [1, '#0d1a36']]), dawn: gradTex([[0, '#8fa8d8'], [1, '#f2c79a']]) }; S.background = BG.night;
  const hemi = new THREE.HemisphereLight(0x4a5a8a, 0x141018, 0.25); S.add(hemi);
  const moon = new THREE.DirectionalLight(0x9fb4ee, 0.9); moon.position.set(-8, 5, 3); moon.target.position.set(0, 0, 0); S.add(moon, moon.target);
  const wall = lam(0x6a6488); const fl = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), lam(0x7a5a40)); fl.rotation.x = -Math.PI / 2; S.add(fl);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), lam(0x4a4660)); ceil.rotation.x = Math.PI / 2; ceil.position.y = 2.8; S.add(ceil);
  S.add(box(8, 2.8, 0.1, wall, 0, 1.4, -4), box(0.1, 2.8, 8, wall, 4, 1.4, 0));
  S.add(box(0.1, 0.9, 8, wall, -4, 0.45, 0), box(0.1, 0.7, 8, wall, -4, 2.45, 0), box(0.1, 1.2, 2.8, wall, -4, 1.5, -2.6), box(0.1, 1.2, 2.8, wall, -4, 1.5, 2.6));
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), new THREE.MeshBasicMaterial({ map: gradTex([[0, '#02040a'], [1, '#1a2a50']]) })); sky.rotation.y = Math.PI / 2; sky.position.set(-6, 1.5, 0); S.add(sky);
  const moonS = glow(2.5, [220, 230, 255]); moonS.position.set(-5.8, 2.2, -0.6); S.add(moonS);
  // vordere Wand mit Tuer (Tuer offen) bei z = 4
  S.add(box(4.6, 2.8, 0.1, wall, -1.7, 1.4, 4), box(2.2, 2.8, 0.1, wall, 2.9, 1.4, 4), box(1.2, 0.6, 0.1, wall, 1.2, 2.5, 4));
  const hall = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.2), new THREE.MeshBasicMaterial({ color: 0x0a0c14 })); hall.position.set(1.2, 1.1, 4.3); hall.rotation.y = Math.PI; S.add(hall);
  // Bett mittig, Kopfende bei z = -3.6, Fussende bei z = -1.2
  S.add(box(1.5, 0.4, 2.6, lam(0x5a4030), 0, 0.2, -2.4), box(1.6, 1.0, 0.1, lam(0x5a4030), 0, 0.5, -3.7), box(1.6, 0.6, 0.1, lam(0x5a4030), 0, 0.3, -1.1));
  S.add(box(1.45, 0.16, 2.5, lam(0xe8e4dc), 0, 0.48, -2.4), box(0.7, 0.16, 0.45, lam(0xf2f2ee), 0, 0.62, -3.35));
  const T = { bl: blanketTex(false), blS: blanketTex(true) };
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 1.9), [lam(0x3a5a8a), lam(0x3a5a8a), new THREE.MeshLambertMaterial({ map: T.bl }), lam(0x3a5a8a), lam(0x3a5a8a), lam(0x3a5a8a)]); blanket.position.set(0, 0.62, -2.15); S.add(blanket);
  // Junge liegend (Sprite flach auf dem Kissen)
  const boyT = { open: C.boy('front', 'scared_sweat'), closed: C.boy('front', 'closed') };
  const boy = sprite(boyT.open, 1.35, 0.35); boy.userData.noBB = true; boy.children[0].visible = false; boy.rotation.x = -Math.PI / 2; boy.position.set(0, 0.725, -2.35); S.add(boy);
  // The Rake am Fussende
  const rake = sprite(C.rakeCrouch(), 1.25, 0.12); rake.userData.noBB = true; rake.children[0].visible = false; rake.position.set(0, 0.6, -1.35); rake.rotation.y = Math.PI; S.add(rake);
  const rakeEyes = [glow(0.12, [235, 235, 230]), glow(0.12, [235, 235, 230])]; S.add(...rakeEyes);
  // Schwester in der Tuer, Rake im Flur dahinter
  const sis = sprite(C.sister('scared'), 1.05, 0.3); sis.userData.noBB = true; sis.children[0].visible = false; sis.position.set(1.2, 0, 3.9); sis.rotation.y = Math.PI; S.add(sis);
  const rake2 = sprite(C.rakeCrouch(), 1.1, 0.05); rake2.userData.noBB = true; rake2.children[0].visible = false; rake2.position.set(1.3, 0.0, 5.2); rake2.rotation.y = Math.PI; S.add(rake2);
  return { S, BG, hemi, moon, moonS, blanket, T, boy, boyT, rake, rakeEyes, sis, rake2, cam: new THREE.PerspectiveCamera(50, 9 / 16, 0.05, 200) };
}
export function build() { return { R: buildRoom() }; }

function base(R, mode = 'night') { const d = mode === 'dawn'; R.S.background = d ? R.BG.dawn : R.BG.night; R.hemi.intensity = d ? 1.1 : 0.25; R.moon.intensity = d ? 1.2 : 0.9; R.moon.color.set(d ? 0xffd2a0 : 0x9fb4ee); R.moonS.visible = !d;
  R.rake.visible = R.sis.visible = R.rake2.visible = false; R.rakeEyes.forEach(e => e.visible = false); R.rake.rotation.z = 0; R.boy.visible = true; setTex(R.boy, R.boyT.open);
  R.blanket.material[2].map = R.T.bl; R.blanket.material[2].needsUpdate = true; }
const pillowCam = (R, p, tgtY = 0.95) => { look(R.cam, lerpV(V(0, 0.95, -3.35), V(0.05, 0.9, -3.15), ease(p)), V(0, tgtY, -1.3)); fov(R.cam, 55); };

export const SHOTS = {
  pov_open(W, p, t, sh) { const R = W.R; base(R); R.boy.visible = false; const dt = t - sh.s; R.rake.visible = true; R.rake.rotation.z = -0.4 * easeOut(clamp((dt - 0.4) / 1.2));
    R.rakeEyes.forEach(e => e.visible = false); pillowCam(R, p); return { world: R, vig: 0.9, shake: dt < 0.4 ? 0.004 : 0.0006 }; },
  bed_top(W, p, t) { const R = W.R; base(R); look(R.cam, lerpV(V(0.05, 1.9, -3.05), V(0.05, 1.6, -3.2), ease(p)), V(0, 0.72, -3.4)); return { world: R, vig: 0.7 }; },
  pov_dark(W, p, t) { const R = W.R; base(R); R.boy.visible = false; R.rake.visible = true; R.rake.material.emissiveIntensity = 0.02; pillowCam(R, p, 0.9); return { world: R, vig: 0.95 }; },
  claws(W, p, t) { const R = W.R; base(R); R.boy.visible = false; R.rake.visible = true; R.rake.material.emissiveIntensity = 0.12;
    look(R.cam, lerpV(V(0.5, 0.85, -2.4), V(0.4, 0.8, -2.1), ease(p)), V(0, 0.75, -1.35)); fov(R.cam, 45); return { world: R, vig: 0.85 }; },
  bed_rule(W, p, t) { const R = W.R; base(R); look(R.cam, V(0.02, 1.8, L(-3.1, -3.2, ease(p))), V(0, 0.72, -3.4)); fov(R.cam, 50); return { world: R, vig: 0.8 }; },
  morning(W, p, t) { const R = W.R; base(R, 'dawn'); R.boy.visible = false; R.blanket.material[2].map = R.T.blS; R.blanket.material[2].needsUpdate = true;
    look(R.cam, lerpV(V(0.9, 1.7, -0.2), V(0.6, 1.5, -0.6), ease(p)), V(0, 0.6, -1.9)); return { world: R, vig: 0.45 }; },
  sister(W, p, t, sh) { const R = W.R; base(R, 'dawn'); R.boy.visible = false; R.sis.visible = true; const st = sh.sfx.find(f => f.n === 'stinger'), after = st ? t - st.t : -1;
    R.rake2.visible = after > 0 && after < 0.55; R.hemi.intensity = after > 0 ? 0.5 : 1.1;
    const k = ease(sm(0, 1, p)); look(R.cam, lerpV(V(0.4, 1.0, 0.8), V(1.1, 0.95, 2.4), k), V(1.2, 0.85, 4)); fov(R.cam, 50);
    return { world: R, vig: 0.6, tint: after > 0 ? 0.35 : 0, flash: after > 0 && after < 0.12 ? 1 - after / 0.12 : 0, shake: after > 0 && after < 0.5 ? 0.01 * (1 - after / 0.5) : 0 }; },
};
for (const k of Object.keys(SHOTS)) { const f = SHOTS[k]; SHOTS[k] = (W, ...a) => { fov(W.R.cam, 50); return f(W, ...a); }; }
SHOTS._billboard = billboard; SHOTS._shake = shake;

// ------------------------------------------------------------------ 2D
let RF = null, RS = null, RC = null;
function faceDark(g, p, t) { if (!RF) RF = C.rakeFaceBig('stare'); g.fillStyle = '#020204'; g.fillRect(0, 0, CW, CH);
  const s = L(700, 1000, ease(p)), a = sm(0, 0.5, p); g.save(); g.globalAlpha = a; g.filter = `brightness(${L(0.25, 0.6, p)})`; g.drawImage(RF, CW / 2 - s / 2, 860 - s / 2, s, s); g.restore();
  const gr = g.createRadialGradient(CW / 2, 860, 100, CW / 2, 860, 900); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.95)'); g.fillStyle = gr; g.fillRect(0, 0, CW, CH); return { vig: 0.9 }; }
function redSky(g) { const s = g.createLinearGradient(0, 0, 0, CH); s.addColorStop(0, '#3a0507'); s.addColorStop(0.55, '#a51f1a'); s.addColorStop(0.8, '#d24a2c'); s.addColorStop(1, '#260304'); g.fillStyle = s; g.fillRect(0, 0, CW, CH); }
function redRake(g, p, t) { if (!RS) RS = C.MONSTERS['THE RAKE'](); redSky(g); g.fillStyle = '#4a0709'; g.fillRect(0, 1500, CW, CH - 1500);
  const hh = 2500, top = L(-hh + 1850, 120, ease(p)); g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 40; g.drawImage(RS, CW / 2 - hh / 4, top, hh / 2, hh); g.restore(); return { vig: 0.8, tint: 0.15 }; }
function redBed(g, p, t) { if (!RC) RC = C.rakeCrouch(); redSky(g);
  g.fillStyle = '#4a0709'; g.beginPath(); g.roundRect(100, 1050, CW - 200, 420, 30); g.fill(); g.fillRect(100, 980, 60, 600); g.fillRect(CW - 160, 980, 60, 600); g.fillStyle = '#6a0b0e'; g.beginPath(); g.ellipse(300, 1060, 150, 60, 0, 0, 7); g.fill();
  const x = L(CW - 200, 420, ease(p)), s = 760; g.save(); g.filter = 'brightness(0.12)'; g.drawImage(RC, x - s / 2, 1080 - s * 0.95, s, s); g.restore();
  for (const dx of [-40, 40]) { const gr = g.createRadialGradient(x + dx * 0.9, 1080 - s * 0.95 + s * 0.36, 1, x + dx * 0.9, 1080 - s * 0.95 + s * 0.36, 30); gr.addColorStop(0, 'rgba(255,240,230,.9)'); gr.addColorStop(1, 'rgba(255,200,180,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x + dx * 0.9, 1080 - s * 0.95 + s * 0.36, 30, 0, 7); g.fill(); }
  return { vig: 0.8, tint: 0.15 }; }
function eyesClosed(g, p, t) { g.fillStyle = '#030204'; g.fillRect(0, 0, CW, CH); const beat = Math.pow(Math.max(0, Math.sin(t * Math.PI * 2.4)), 6);
  const gr = g.createRadialGradient(CW / 2, 860, 50, CW / 2, 860, 1100); gr.addColorStop(0, `rgba(90,10,14,${0.25 + beat * 0.35})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, CW, CH); return { vig: 0.9 }; }
function earClose(g, p, t, shot) { if (!RF) RF = C.rakeFaceBig('stare'); g.fillStyle = '#020204'; g.fillRect(0, 0, CW, CH); const s1 = shot.segs[1] ? shot.segs[1].s : 1e9;
  // Seitenprofil des Jungen (Ohr) links, Gesicht des Wesens kommt von rechts ins Bild
  g.fillStyle = '#2a2420'; g.beginPath(); g.ellipse(160, 900, 360, 460, 0, 0, 7); g.fill(); g.fillStyle = '#3a302a'; g.beginPath(); g.ellipse(420, 880, 70, 110, 0.2, 0, 7); g.fill();
  const k = ease(sm(0.1, 0.8, p)), x = L(CW + 300, 720, k), s = 900; g.save(); g.filter = `brightness(${t > s1 ? 0.7 : 0.4})`; g.drawImage(RF, x - s / 2, 880 - s / 2, s, s); g.restore();
  const gr = g.createRadialGradient(560, 880, 100, 560, 880, 1000); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.95)'); g.fillStyle = gr; g.fillRect(0, 0, CW, CH);
  return { vig: 0.9, shake: t > s1 ? 0.0015 : 0 }; }
function bedClock(g, p, t) { g.fillStyle = '#05060a'; g.fillRect(0, 0, CW, CH); g.fillStyle = '#1f3a66'; g.beginPath(); g.moveTo(0, 1250); g.quadraticCurveTo(CW / 2, 1080, CW, 1250); g.lineTo(CW, CH); g.lineTo(0, CH); g.fill();
  const mins = L(3 * 60 + 8, 6 * 60 + 30, ease(p)), hh = Math.floor(mins / 60), mm = Math.floor(mins % 60);
  g.fillStyle = '#0b0c10'; g.beginPath(); g.roundRect(CW / 2 - 330, 640, 660, 300, 40); g.fill();
  g.save(); g.shadowColor = 'rgba(255,60,50,.8)'; g.shadowBlur = 40; g.fillStyle = '#ff4a3d'; g.font = '400 220px Anton'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`0${hh}:${String(mm).padStart(2, '0')}`, CW / 2, 795); g.restore(); return { vig: 0.7 }; }
export const TWO = { face_dark: faceDark, red_rake: redRake, red_bed: redBed, eyes_closed: eyesClosed, ear_close: earClose, bed_clock: bedClock };
