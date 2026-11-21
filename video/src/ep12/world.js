// Folge 11 – Alkarisi: Dorf im Schnee (Haus, Stall mit Pferden), warmes Zimmer (Bett, Wiege, rotes Band), Haustuer + 2D-Szenen
import * as THREE from 'three';
import * as C from '../chars.js';
import { tex, lam, box, sprite, setTex, glow, gradTex, V, L, clamp, sm, lerpV, look, billboard, shake, rnd, ease } from '../world.js';
import { W as CW, H as CH } from '../overlay.js';

const easeOut = t => 1 - Math.pow(1 - t, 3);
function fov(cam, f) { if (cam.fov !== f) { cam.fov = f; cam.updateProjectionMatrix(); } }
const basic = c => new THREE.MeshBasicMaterial({ color: c });
function rugTex() { const c = C.cv(256, 256), g = c.getContext('2d'); g.fillStyle = '#8a1e1e'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#e0b050'; g.lineWidth = 10; g.strokeRect(14, 14, 228, 228);
  g.fillStyle = '#1e3a6a'; for (let i = 0; i < 4; i++) { g.save(); g.translate(128, 128); g.rotate(i * Math.PI / 2); g.beginPath(); g.moveTo(0, -90); g.lineTo(30, -40); g.lineTo(0, 10); g.lineTo(-30, -40); g.fill(); g.restore(); } return tex(c); }

function buildVillage() {
  const S = new THREE.Scene(); const BG = { night: gradTex([[0, '#03050e'], [1, '#1a2444']]), day: gradTex([[0, '#9fb8e0'], [1, '#e8eef6']]) }; S.background = BG.night; S.fog = new THREE.Fog(0x10182c, 10, 80);
  const hemi = new THREE.HemisphereLight(0x8fa4d0, 0x302830, 0.5); S.add(hemi);
  const moon = new THREE.DirectionalLight(0xbfd0ff, 0.8); moon.position.set(-10, 14, 8); S.add(moon);
  // Schnee
  const sg = new THREE.PlaneGeometry(120, 120, 40, 40); sg.rotateX(-Math.PI / 2); const P = sg.attributes.position; for (let i = 0; i < P.count; i++) P.setY(i, rnd() * 0.15); sg.computeVertexNormals();
  S.add(new THREE.Mesh(sg, new THREE.MeshLambertMaterial({ color: 0xe8eef6, flatShading: true })));
  // Haus (aussen) bei z = -6
  S.add(box(8, 3.2, 6, lam(0xc9b08a), 0, 1.6, -9), box(8.6, 0.3, 6.6, lam(0x6a3a2a), 0, 3.35, -9)); const roof = new THREE.Mesh(new THREE.ConeGeometry(5.8, 2.2, 4), lam(0x7a3a2a)); roof.rotation.y = Math.PI / 4; roof.position.set(0, 4.5, -9); roof.scale.set(1, 1, 0.75); S.add(roof);
  const win = box(1.1, 0.9, 0.05, basic(0xffcf7a), -2, 1.8, -5.97); S.add(win); const wl = new THREE.PointLight(0xffb060, 6, 10, 1.5); wl.position.set(-2, 1.8, -5); S.add(wl);
  const doorO = box(1.0, 2.0, 0.08, lam(0x5a3a22), 1.5, 1.0, -5.96); S.add(doorO);
  // Stall bei x = 12
  const St = new THREE.Group(); St.position.set(12, 0, -4); S.add(St);
  St.add(box(7, 3, 0.2, lam(0x6a4a30), 0, 1.5, -2), box(0.2, 3, 4, lam(0x6a4a30), -3.5, 1.5, 0), box(0.2, 3, 4, lam(0x6a4a30), 3.5, 1.5, 0), box(7.4, 0.2, 4.4, lam(0x4a3020), 0, 3.05, 0));
  for (let x = -3; x <= 3; x += 0.5) St.add(box(0.06, 0.05, 0.05, lam(0x8a6a40), x, 0.02, 0.5 + rnd()));
  const hay = new THREE.Mesh(new THREE.PlaneGeometry(7, 4), lam(0xc8a050)); hay.rotation.x = -Math.PI / 2; hay.position.y = 0.02; St.add(hay);
  const lantern = glow(1.2, [255, 190, 100]); lantern.position.set(0, 2.4, -1.6); St.add(lantern); const ll = new THREE.PointLight(0xffb060, 5, 9, 1.4); ll.position.set(12, 2.3, -5.4); S.add(ll);
  const hT = [0, 1, 2, 3].map(k => C.horse(false, k / 4)), hTB = C.horse(true, 0);
  const horses = [0, 1].map(i => { const h = sprite(hT[0], 1.7, 0.25); h.userData.noBB = true; h.children[0].visible = false; h.position.set(12 + (i ? 1.4 : -1.6), 0, -4.6 - i * 0.6); h.scale.x = i ? -1 : 1; S.add(h); return h; });
  const ghost = sprite(C.alkarisi('true'), 1.85, 0.25); ghost.userData.noBB = true; ghost.children[0].visible = false; ghost.position.set(12.0, 0, -5.4); S.add(ghost);
  // Zimmer innen (bei x = 40)
  const R = new THREE.Group(); R.position.set(40, 0, 0); S.add(R);
  const rf = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), lam(0x8a6a4e)); rf.rotation.x = -Math.PI / 2; R.add(rf);
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.8), new THREE.MeshLambertMaterial({ map: rugTex() })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.01, 0.2); R.add(rug);
  R.add(box(8, 3, 0.1, lam(0xe8d8b8), 0, 1.5, -3), box(0.1, 3, 8, lam(0xe8d8b8), -3.5, 1.5, 0), box(0.1, 3, 8, lam(0xe8d8b8), 3.5, 1.5, 0), box(8, 0.1, 8, lam(0x6a4a30), 0, 3, 0));
  const rwin = box(1.0, 0.8, 0.05, basic(0x0c1630), -1.8, 1.8, -2.94); R.add(rwin);
  // Bett mit Tante, Wiege, rotes Band, Stuhl, Kerze
  R.add(box(1.6, 0.45, 2.2, lam(0x6a4a30), 1.6, 0.22, -1.6), box(1.5, 0.18, 2.1, lam(0xf2ece0), 1.6, 0.5, -1.6), box(1.6, 1.1, 0.1, lam(0x6a4a30), 1.6, 0.55, -2.7));
  const auntS = sprite(C.aunt(), 1.25, 0.3); auntS.userData.noBB = true; auntS.children[0].visible = false; auntS.position.set(1.6, 0.25, -2.2); R.add(auntS);
  R.add(box(1.5, 0.25, 1.4, lam(0xb03a3a), 1.6, 0.66, -1.2));
  const ribbon = new THREE.Group(); ribbon.position.set(0.82, 1.05, -2.65); R.add(ribbon); ribbon.add(box(0.06, 0.06, 0.06, basic(0xd01818), 0, 0, 0), box(0.04, 0.35, 0.02, basic(0xd01818), 0.03, -0.2, 0.02), box(0.04, 0.3, 0.02, basic(0xd01818), -0.04, -0.18, 0.03));
  const cradle = new THREE.Group(); cradle.position.set(0.2, 0, -1.0); R.add(cradle); cradle.add(box(0.8, 0.35, 0.5, lam(0x8a6a40), 0, 0.5, 0), box(0.05, 0.5, 0.05, lam(0x6a4a30), -0.4, 0.25, 0), box(0.05, 0.5, 0.05, lam(0x6a4a30), 0.4, 0.25, 0));
  const babyS = sprite(C.baby(), 0.35, 0.3); babyS.userData.noBB = true; babyS.children[0].visible = false; babyS.position.set(0, 0.55, 0.05); cradle.add(babyS);
  R.add(box(0.5, 0.06, 0.5, lam(0x5a3a22), -1.0, 0.5, -0.6), box(0.5, 0.6, 0.06, lam(0x5a3a22), -1.0, 0.8, -0.85));
  R.add(box(0.4, 0.5, 0.4, lam(0x5a3a22), 0.5, 0.25, -2.5), box(0.06, 0.18, 0.06, basic(0xf2eee0), 0.5, 0.59, -2.5)); const flame = glow(0.25, [255, 200, 110]); flame.position.set(0.5, 0.74, -2.5); R.add(flame);
  const cl = new THREE.PointLight(0xffb060, 4, 6, 1.6); cl.position.set(40.5, 0.9, -2.3); S.add(cl);
  // Kueche/Flur mit Haustuer (bei x = 70)
  const D = new THREE.Group(); D.position.set(70, 0, 0); S.add(D);
  const df = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), lam(0x8a6a4e)); df.rotation.x = -Math.PI / 2; D.add(df);
  D.add(box(1.6, 3, 0.1, lam(0xe8d8b8), -1.6, 1.5, -3), box(1.6, 3, 0.1, lam(0xe8d8b8), 1.6, 1.5, -3), box(1.6, 0.9, 0.1, lam(0xe8d8b8), 0, 2.55, -3), box(0.1, 3, 6, lam(0xe8d8b8), -2.4, 1.5, 0), box(0.1, 3, 6, lam(0xe8d8b8), 2.4, 1.5, 0));
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(4, 3), new THREE.MeshBasicMaterial({ map: gradTex([[0, '#03050e'], [0.7, '#1a2444'], [1, '#c8d4e8']]) })); outside.position.set(0, 1.5, -4.5); D.add(outside);
  const door = new THREE.Group(); door.position.set(-0.8, 0, -3); D.add(door); door.add(box(1.6, 2.1, 0.08, lam(0x6a4a30), 0.8, 1.05, 0));
  const nb = sprite(C.alkarisi('neighbor'), 1.8, 0.3); nb.userData.noBB = true; nb.children[0].visible = false; nb.position.set(70.05, 0, -3.6); S.add(nb);
  const dl = new THREE.PointLight(0xffd8a0, 3, 7, 1.4); dl.position.set(70, 2.2, -1); S.add(dl);
  const T = { boyS: C.boy('front', 'scared_sweat'), boyF: C.boy('front', 'neutral'), boyB: C.boy('back'), omaN: C.oma('neutral'), omaS: C.oma('shocked') };
  const boy = sprite(T.boyF, 1.3); boy.userData.noBB = true; boy.children[0].visible = false; S.add(boy);
  const oma = sprite(T.omaN, 1.35); oma.userData.noBB = true; oma.children[0].visible = false; S.add(oma);
  const walker = sprite(C.alkarisi('neighbor'), 1.8, 0.2); walker.userData.noBB = true; walker.children[0].visible = false; S.add(walker);
  return { S, BG, hemi, moon, horses, hT, hTB, ghost, ll, ribbon, babyS, flame, cl, door, nb, boy, oma, walker, T, auntS, cam: new THREE.PerspectiveCamera(50, 9 / 16, 0.05, 300) };
}
export function build() { return { Vl: buildVillage() }; }

function base(A, t, day = false) { A.ghost.visible = A.boy.visible = A.oma.visible = A.walker.visible = false; A.nb.visible = false; A.door.rotation.y = 0;
  A.S.background = day ? A.BG.day : A.BG.night; A.hemi.intensity = day ? 1.1 : 0.5; A.moon.intensity = day ? 1.2 : 0.8; A.S.fog.color.set(day ? 0xdfe6f0 : 0x10182c);
  const f = 0.85 + Math.sin(t * 13) * 0.08 + Math.sin(t * 31) * 0.05; A.cl.intensity = day ? 0 : 4 * f; A.flame.visible = !day; A.flame.scale.setScalar(0.25 * f); }
function horsesAnim(A, t, panic = 1, braid = false) { A.horses.forEach((h, i) => { setTex(h, braid ? A.hTB : A.hT[Math.floor(t * (3 + panic * 5) + i * 2) % 4]); h.position.y = Math.abs(Math.sin(t * 9 + i)) * 0.06 * panic; h.rotation.z = Math.sin(t * 7 + i) * 0.03 * panic; }); }

export const SHOTS = {
  barn_open(W, p, t, sh) { const A = W.Vl; base(A, t); const dt = t - sh.s; horsesAnim(A, t, 1); A.ghost.visible = dt < 1.2 && !(dt > 0.5 && dt < 0.58);
    A.ll.intensity = dt < 1.2 && Math.sin(t * 40) > 0.6 ? 1.5 : 5;
    look(A.cam, lerpV(V(12.3, 1.5, 0.4), V(12.2, 1.45, -0.6), ease(p)), V(12, 1.2, -5.2)); fov(A.cam, 50); return { world: A, vig: 0.8, shake: dt < 0.35 ? 0.004 : 0.0008 }; },
  room(W, p, t) { const A = W.Vl; base(A, t); A.oma.visible = true; setTex(A.oma, A.T.omaN); A.oma.position.set(39.0, 0, -1.6);
    look(A.cam, lerpV(V(38.4, 1.7, 2.6), V(38.8, 1.6, 1.8), ease(p)), V(40.8, 0.8, -1.6)); return { world: A, vig: 0.55 }; },
  ribbon(W, p, t, sh) { const A = W.Vl; base(A, t); const s1 = sh.segs[1] ? sh.segs[1].s : 1e9, k = ease(sm(0, 1, clamp((t - s1 + 0.8) / 1.2)));
    A.oma.visible = true; setTex(A.oma, A.T.omaN); A.oma.position.set(40.3, 0, -2.0); A.ribbon.rotation.z = Math.sin(t * 2) * 0.08;
    look(A.cam, lerpV(V(40.85, 1.1, -2.0), V(40.35, 1.15, -0.95), k), lerpV(V(40.82, 0.95, -2.65), V(40.3, 1.12, -2.0), k)); fov(A.cam, L(40, 50, k)); return { world: A, vig: 0.6 }; },
  vigil(W, p, t) { const A = W.Vl; base(A, t); A.boy.visible = true; setTex(A.boy, A.T.boyF); A.boy.position.set(39.0, 0.12, -0.55); A.boy.scale.set(0.9, 0.9, 1);
    look(A.cam, lerpV(V(41.6, 1.3, 1.6), V(41.2, 1.2, 1.0), ease(p)), V(39.6, 0.85, -0.8)); return { world: A, vig: 0.7 }; },
  window_barn(W, p, t) { const A = W.Vl; base(A, t); horsesAnim(A, t, 1.2); look(A.cam, lerpV(V(4, 2.2, 3), V(5, 2.0, 2.2), ease(p)), V(12, 1.3, -4.8)); fov(A.cam, 38); return { world: A, vig: 0.85, shake: 0.001 }; },
  boy_rule(W, p, t) { const A = W.Vl; base(A, t); A.boy.visible = true; setTex(A.boy, A.T.boyS); A.boy.position.set(39.0, 0.12, -0.55); A.boy.scale.set(0.9, 0.9, 1);
    look(A.cam, V(39.02, 1.05, L(0.25, 0.15, ease(p))), V(39.0, 0.95, -0.55)); fov(A.cam, 58); return { world: A, vig: 0.75 }; },
  door_knock(W, p, t, sh) { const A = W.Vl; base(A, t); const s1 = sh.segs[1] ? sh.segs[1].s : 1e9; A.door.rotation.y = -0.55 * ease(sm(0, 0.35, p)); A.nb.visible = true;
    const k = ease(clamp((t - s1 + 0.3) / 1.2)); look(A.cam, lerpV(V(70.6, 1.55, 0.6), V(70.15, 1.55, -2.35), k), lerpV(V(70.0, 1.3, -3.4), V(70.05, 1.55, -3.6), k)); fov(A.cam, L(50, 42, k));
    return { world: A, vig: 0.8 }; },
  door_close(W, p, t) { const A = W.Vl; base(A, t); A.nb.visible = true; A.door.rotation.y = -0.55 * (1 - ease(sm(0.35, 0.85, p)));
    A.boy.visible = true; setTex(A.boy, A.T.boyS); A.boy.position.set(70.6, 0, -1.4); A.boy.scale.set(1, 1, 1);
    look(A.cam, V(71.4, 1.4, 1.2), V(70.2, 1.1, -2.6)); return { world: A, vig: 0.75 }; },
  walk_away(W, p, t) { const A = W.Vl; base(A, t); A.walker.visible = true; A.walker.position.set(L(1.5, 4.5, p), 0, L(-4.6, -1.5, p)); A.walker.rotation.y = 0.6;
    look(A.cam, V(-2, 1.8, -4.8), V(2.5, 1.1, -3.0)); fov(A.cam, 44); return { world: A, vig: 0.75 }; },
  morning(W, p, t, sh) { const A = W.Vl; base(A, t, true); const s1 = sh.segs[1] ? sh.segs[1].s : 1e9; A.oma.visible = true; setTex(A.oma, t > s1 + 0.6 ? A.T.omaS : A.T.omaN); A.oma.position.set(70.3, 0, -1.6);
    look(A.cam, lerpV(V(70.9, 1.4, 0.8), V(70.5, 1.3, 0.1), ease(p)), V(70.3, 1.05, -1.6)); return { world: A, vig: 0.4 }; },
};
for (const k of Object.keys(SHOTS)) { const f = SHOTS[k]; SHOTS[k] = (W, ...a) => { fov(W.Vl.cam, 50); W.Vl.boy.scale.set(1, 1, 1); return f(W, ...a); }; }
SHOTS._billboard = billboard; SHOTS._shake = shake;

// ------------------------------------------------------------------ 2D
function redSky(g) { const s = g.createLinearGradient(0, 0, 0, CH); s.addColorStop(0, '#3a0507'); s.addColorStop(0.55, '#a51f1a'); s.addColorStop(0.8, '#d24a2c'); s.addColorStop(1, '#260304'); g.fillStyle = s; g.fillRect(0, 0, CW, CH); }
let AT = null, AF = null, AN = null;
function redAl(g, p, t) { if (!AT) AT = C.alkarisi('true'); redSky(g); g.fillStyle = '#4a0709'; g.fillRect(0, 1520, CW, CH - 1520);
  for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(i * 220 - 60, 1520); g.lineTo(i * 220 + 40, 1350); g.lineTo(i * 220 + 140, 1520); g.fill(); }
  const hh = 2400, top = L(-hh + 1850, 150, ease(p)); g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 40; g.drawImage(AT, CW / 2 - hh / 4, top, hh / 2, hh); g.restore(); return { vig: 0.8, tint: 0.15 }; }
function redPress(g, p, t) { if (!AT) AT = C.alkarisi('true'); redSky(g);
  g.fillStyle = '#4a0709'; g.beginPath(); g.roundRect(80, 1100, CW - 160, 380, 30); g.fill(); g.fillRect(80, 950, 60, 650); g.fillStyle = '#6a0b0e'; g.beginPath(); g.ellipse(260, 1110, 140, 55, 0, 0, 7); g.fill();
  const k = ease(p); g.save(); g.translate(CW / 2 + 200, 1480); g.rotate(L(0, -0.28, k)); g.filter = 'brightness(0.12)'; g.drawImage(AT, -380, -1520, 760, 1520); g.restore();
  for (const dx of [-40, 40]) { const ex = CW / 2 + 200 + dx + L(0, -200, k) * 0.9, ey = 1480 - 1520 * 0.75 + L(0, 60, k), gr = g.createRadialGradient(ex, ey, 1, ex, ey, 26); gr.addColorStop(0, 'rgba(255,80,60,1)'); gr.addColorStop(1, 'rgba(255,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(ex, ey, 26, 0, 7); g.fill(); }
  return { vig: 0.8, tint: 0.15 }; }
function soupFace(g, p, t, shot) { if (!AN) AN = C.alFaceBig('smile', true); g.fillStyle = '#05060a'; g.fillRect(0, 0, CW, CH);
  const s = L(1000, 1200, ease(p)); g.drawImage(AN, CW / 2 - s / 2, 900 - s / 2, s, s); const gr = g.createRadialGradient(CW / 2, 900, 200, CW / 2, 900, 900); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.9)'); g.fillStyle = gr; g.fillRect(0, 0, CW, CH);
  g.fillStyle = 'rgba(255,255,255,.4)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(CW / 2 - 80 + i * 50, 1560 - ((t * 120 + i * 60) % 260), 14, 30, 0, 0, 7); g.fill(); } return { vig: 0.85 }; }
function tracks(g, p, t) { g.fillStyle = '#dfe7f2'; g.fillRect(0, 0, CW, CH); const sky = g.createLinearGradient(0, 0, 0, 700); sky.addColorStop(0, '#0a1024'); sky.addColorStop(1, '#3a4a6a'); g.fillStyle = sky; g.fillRect(0, 0, CW, 520);
  g.fillStyle = '#c9b08a'; g.fillRect(260, 220, 560, 300); g.fillStyle = '#5a3a22'; g.fillRect(470, 300, 140, 220); g.fillStyle = '#ffcf7a'; g.fillRect(300, 300, 110, 90); // Haus mit Tuer
  const sh = g.createLinearGradient(0, 520, 0, CH); sh.addColorStop(0, '#b8c4d8'); sh.addColorStop(1, '#eef3fa'); g.fillStyle = sh; g.fillRect(0, 520, CW, CH - 520);
  const n = Math.floor(L(2, 9, ease(p)));
  for (let i = 0; i < n; i++) { const u = i / 9, y = 560 + u * u * 1300, x = CW / 2 + (i % 2 ? 1 : -1) * L(20, 90, u), sc = L(0.35, 1.6, u);
    g.save(); g.translate(x, y); g.scale(sc, sc); g.fillStyle = 'rgba(70,90,120,.55)';
    g.beginPath(); g.ellipse(0, 20, 34, 56, 0, 0, 7); g.fill(); for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(-26 + k * 13, -48 + Math.abs(k - 2) * 5, 9, 0, 7); g.fill(); } // Zehen zeigen nach oben = zum Haus
    g.restore(); }
  return { vig: 0.6 }; }
function pillow(g, p, t, shot) { if (!AF) AF = C.alFaceBig('evil', false); const st = shot.sfx.find(f => f.n === 'stinger'), after = st ? t - st.t : -1;
  if (after > 0) { g.fillStyle = '#000'; g.fillRect(0, 0, CW, CH); const w = CW * L(0.7, 1.4, easeOut(clamp(after / 0.3))); g.drawImage(AF, CW / 2 - w / 2, 860 - w / 2, w, w);
    return { vig: 0.8, tint: 0.35, flash: after < 0.12 ? 1 - after / 0.12 : 0, shake: after < 0.6 ? 0.01 * (1 - after / 0.6) : 0 }; }
  g.fillStyle = '#e9e2d4'; g.fillRect(0, 0, CW, CH); g.strokeStyle = 'rgba(0,0,0,.06)'; g.lineWidth = 30; for (let y = 0; y < CH; y += 120) { g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(300, y + 60, 700, y - 60, CW, y); g.stroke(); }
  const lift = ease(sm(0.1, 0.6, p)); g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(CW / 2, 980, 420, 120, 0, 0, 7); g.fill();
  g.fillStyle = '#f6f2ea'; g.strokeStyle = '#1c1512'; g.lineWidth = 12; g.beginPath(); g.roundRect(CW / 2 - 460, 600 - lift * 420, 920, 460, 120); g.fill(); g.stroke(); // Kissen hebt sich
  g.fillStyle = '#d01818'; g.fillRect(140, 1500, 60, 300); g.fillRect(190, 1500, 40, 260); // rotes Band am Bettpfosten
  return { vig: 0.6 }; }
export const TWO = { red_al: redAl, red_press: redPress, soup_face: soupFace, tracks, pillow };
