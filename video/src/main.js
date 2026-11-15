import * as THREE from 'three';
import * as O from './overlay.js';
const { W, H } = O;
const GS = 0.75;
const out = document.getElementById('out'), g = out.getContext('2d');
const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
R.setPixelRatio(1); R.setSize(W * GS, H * GS); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
R.outputColorSpace = THREE.SRGBColorSpace;
await Promise.all(['400 40px Anton', '800 40px Montserrat', '900 40px Montserrat', '700 40px Montserrat'].map(f => document.fonts.load(f, 'ÄÖÜß„“✓')));
const EP = new URLSearchParams(location.search).get('ep') || '';
const TL = await (await fetch((EP ? EP + '/build/' : 'build/') + 'timeline.json')).json();
const MOD = EP ? await import(`./${EP}/world.js`) : await import('./world.js');
const SHOTS = MOD.SHOTS, worlds = MOD.build(); O.initPost();
const TWO = { roulette: 1, red_tall: 1, red_face: 1, cta: 1, endcard: 1, ...(MOD.TWO || {}) };

window.TL = TL;
window.renderAt = (t) => {
  const shot = TL.shots.find(s => t >= s.s && t < s.e) || TL.shots[TL.shots.length - 1];
  const p = Math.min(1, Math.max(0, (t - shot.s) / (shot.e - shot.s)));
  let fx = { vig: 0.55, tint: shot.tint === 'red' ? 0.45 : 0 };
  if (TWO[shot.scene]) {
    if (MOD.TWO && MOD.TWO[shot.scene]) fx = { vig: 0.55, ...MOD.TWO[shot.scene](g, p, t, shot) };
    else if (shot.scene === 'roulette') O.roulette(g, t, shot.e, TL.monster);
    if (shot.scene === 'red_tall') { O.redTall(g, p, t); fx = { vig: 0.7, tint: 0.15 }; }
    if (shot.scene === 'red_face') { O.redFace(g, p, t); fx = { vig: 0.8, tint: 0.15 }; }
    if (shot.scene === 'cta') { O.cta(g, p, t); fx = { vig: 0.4 }; }
    if (shot.scene === 'endcard') { O.endcard(g, p); fx = { vig: 0.3 }; }
  } else {
    const r = SHOTS[shot.scene](worlds, p, t, shot);
    const cam = r.world.cam; SHOTS._billboard(cam); if (r.shake) SHOTS._shake(cam, r.shake, t);
    R.render(r.world.S, cam);
    g.drawImage(R.domElement, 0, 0, W, H);
    fx = { vig: r.vig ?? 0.55, tint: Math.max(fx.tint, r.tint || 0), flash: r.flash || 0 };
    if (r.measure) {
      const pr = v => { const q = v.clone().project(cam); return { x: (q.x + 1) / 2 * W, y: (1 - q.y) / 2 * H }; };
      r._m = [pr(r.measure[0]), pr(r.measure[1])];
    }
    if (r.post2d) r.post2d(g, p, t);
    window._last = r;
  }
  // Lock-in-Blitz nach dem Roulette
  if (shot.id === 'name' && t - shot.s < 0.15) fx.flash = 1 - (t - shot.s) / 0.15;
  O.post(g, t, fx);
  if (window._last && window._last._m && !TWO[shot.scene] && SHOTS[shot.scene] && window._last.measure) O.measure(g, window._last._m[0], window._last._m[1], window._last.measureLabel, window._last.measureP);
  if (!shot.noHeader) O.header(g, TL.monster, shot.clock);
  O.card(g, t, shot.card, shot); O.rule(g, t, shot.rule);
  O.subtitles(g, t, TL);
};
window.frame = (t, q = 0.92) => { window.renderAt(t); return out.toDataURL('image/jpeg', q); };
window.done = true;
