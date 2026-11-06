// 2D-Figuren, Kamera-Einstellungen und Overlays für die Sets Keller, Zelt, Auto.
const EV = (n) => (TL.ev && TL.ev[n]) || [];
const lastEv = (n, t, def) => { let v = def; for (const e of EV(n)) if (e[0] <= t) v = e; return v; };
const R3 = W3.reg;
const _planes = {};
function ensurePlane(name, w, h, px) { if (!_planes[name]) _planes[name] = W3.H.plane(name, w, h, px); }
const svgLocal = (w, h, body, pxw = 1536) => `<svg xmlns="http://www.w3.org/2000/svg" width="${pxw}" height="${Math.round(pxw * h / w)}" viewBox="${-w / 2} ${-h / 2} ${w} ${h}">${DEFS}${body}</svg>`;

/* ------------------------------------------------ Gestalten (statische Texturen) */
const BACKSEAT = `<svg xmlns="http://www.w3.org/2000/svg" width="950" height="1000" viewBox="0 0 95 100">${DEFS}
  <defs><linearGradient id="bs" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4e5163"/><stop offset=".5" stop-color="#a6aabb"/><stop offset="1" stop-color="#4e5163"/></linearGradient>
  <linearGradient id="bsd" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".9"/></linearGradient></defs>
  <path d="M14 100 Q12 70 26 60 Q40 54 48 50 Q58 54 70 60 Q84 70 82 100 Z" fill="url(#bs)"/>
  ${[0, 1, 2, 3].map(i => `<path d="M34 ${70 + i * 6} Q48 ${73 + i * 6} 62 ${70 + i * 6}" stroke="#4d5064" stroke-width="1.1" fill="none"/>`).join('')}
  <path d="M20 66 Q6 80 8 100 M76 66 Q90 80 88 100" stroke="url(#bs)" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M46 52 Q42 40 40 32" stroke="#9a9eb0" stroke-width="6" stroke-linecap="round"/>
  <g transform="rotate(-24 40 22)"><ellipse cx="40" cy="20" rx="13" ry="18" fill="url(#cface)"/>
    <ellipse cx="34.5" cy="16" rx="4.3" ry="6" fill="#05050a"/><ellipse cx="46" cy="16" rx="4.3" ry="6" fill="#05050a"/>
    <circle cx="35.2" cy="15" r="1" fill="#fff"/><circle cx="46.7" cy="15" r="1" fill="#fff"/>
    <clipPath id="bm"><path d="M29 27 Q40 39 52 27 Q40 33 29 27 Z"/></clipPath><path d="M29 27 Q40 39 52 27 Q40 33 29 27 Z" fill="#05050a"/>
    <g clip-path="url(#bm)">${Array.from({ length: 9 }, (_, i) => { const t = .08 + i * .105, x = 52 - 23 * t, top = 27 + 12 * t * (1 - t); return `<rect x="${x - .8}" y="${top - 1}" width="1.6" height="${1 + 10 * t * (1 - t)}" fill="#e9e6da"/>`; }).join('')}</g></g>
  <rect width="95" height="100" fill="url(#bsd)"/>
</svg>`;
const TENT_SHADOW = `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="800" viewBox="0 0 220 160">
  <defs><filter id="tb"><feGaussianBlur stdDeviation="2.2"/></filter></defs>
  <g filter="url(#tb)" fill="#000">
    <ellipse cx="122" cy="26" rx="9" ry="12"/><rect x="119" y="34" width="5" height="10"/>
    <path d="M108 44 Q122 40 136 44 L132 100 L126 160 L118 160 L112 100 Z"/>
    <path d="M110 48 Q90 70 84 110 Q82 124 78 140" stroke="#000" stroke-width="4" fill="none"/>
    <path d="M134 48 Q160 52 176 34 Q182 28 188 30" stroke="#000" stroke-width="4" fill="none"/>
    ${[0, 1, 2, 3].map(i => `<path d="M188 30 l${9 - i} ${-6 + i * 4}" stroke="#000" stroke-width="1.6"/>`).join('')}
    <path d="M78 140 l-5 9 M78 140 l-1 10 M78 140 l3 9" stroke="#000" stroke-width="1.6"/>
  </g></svg>`;
const HAND_SHADOW = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 50 50">
  <defs><filter id="hb"><feGaussianBlur stdDeviation=".9"/></filter></defs>
  <g filter="url(#hb)" fill="none" stroke="#000" stroke-linecap="round">
    <path d="M8 50 Q14 38 22 32" stroke-width="6"/><ellipse cx="24" cy="30" rx="5" ry="4" fill="#000" stroke="none"/>
    ${[0, 1, 2, 3].map(i => `<path d="M26 ${27 + i * 2} Q${36 + i} ${18 + i * 4} ${42 - i} ${10 + i * 6}" stroke-width="1.8"/>`).join('')}
    <path d="M22 28 Q26 16 30 12" stroke-width="1.8"/></g></svg>`;

/* ------------------------------------------------ 2D-Figuren */
function standing(x, st) {          // Welt-Koordinaten, stehend mit Wäschekorb
  const hc = [x, -1.55], s = [];
  s.push(`<path d="M${x - .06} -.9 L${x - .07} -.02 M${x + .06} -.9 L${x + .07} -.02" stroke="${SKIN}" stroke-width=".03" stroke-linecap="round"/>`);
  s.push(`<path d="M${x - .07} -.02 l-.04 0 M${x + .07} -.02 l.04 0" stroke="#2a2b33" stroke-width=".03" stroke-linecap="round"/>`);
  s.push(torso(x, -1.43, .21, .55));
  s.push(head(hc, .13, { eyes: st.eyes, t: st.t, look: st.look, mouth: st.mouth, lit: st.lit }));
  if (st.basket !== false) {
    s.push(`<rect x="${x - .23}" y="-1.08" width=".46" height=".22" rx=".03" fill="#cbbf9f"/>
      ${[-.15, -.05, .05, .15].map(dx => `<rect x="${x + dx - .015}" y="-1.03" width=".03" height=".13" rx=".01" fill="#a99c7b"/>`).join('')}
      <circle cx="${x - .1}" cy="-1.09" r=".06" fill="#9cb6d8"/><circle cx="${x + .03}" cy="-1.1" r=".07" fill="#e3a9b5"/><circle cx="${x + .14}" cy="-1.09" r=".05" fill="#f2f0e8"/>`);
    s.push(arm([x - .078, -1.385], [x - .2, -1.0], 1) + arm([x + .078, -1.385], [x + .2, -1.0], -1));
  }
  return s.join('');
}
function lying(x, y, st) {          // Kopf auf dem Kissen, Körper im Schlafsack
  let s = head([x, -y], .1, { eyes: st.eyes, t: st.t, look: st.look, mouth: st.mouth });
  if (st.hair) s += `<path d="M${x - .085} ${-y - .05} Q${x - .06} ${-y - .12} ${x} ${-y - .105} Q${x + .07} ${-y - .125} ${x + .09} ${-y - .045} Q${x + .03} ${-y - .085} ${x - .085} ${-y - .05} Z" fill="#5a3b24"/>`;
  return s;
}
function driver(st) {               // lokale Koordinaten (Ebene gedreht), Blick zur Kamera
  const [hl, hr] = st.hands || [[-.2, .12], [.2, .12]];
  return torso(0, -.02, .24, .5) +
    head([0, -.14], .12, { eyes: st.eyes, t: st.t, look: st.look, mouth: st.mouth, lit: st.lit }) +
    arm([-.09, .02], hl, 1) + arm([.09, .02], hr, -1);
}
// Hände um den Lenkradkranz (eigene Ebene direkt vor dem Lenkrad)
const WHEEL = [-.37, .97, -.06], GRIP = [[-.128, .068], [.128, .068]];
function handsSvg() {
  return svgLocal(.5, .3, GRIP.map(([x, y]) => {
    const sx = Math.sign(x), cx = x, cy = -y;
    return `<g transform="rotate(${sx * 30} ${cx} ${cy})">
      <path d="M${cx - .034} ${cy - .018} Q${cx - .036} ${cy + .036} ${cx} ${cy + .036} Q${cx + .036} ${cy + .036} ${cx + .034} ${cy - .018} Z" fill="${SKIN}"/>
      ${[0, 1, 2, 3].map(i => `<circle cx="${cx - .025 + i * .0167}" cy="${cy - .02}" r=".011" fill="${SKIN}"/>`).join('')}
      ${[0, 1, 2].map(i => `<path d="M${cx - .017 + i * .0167} ${cy - .026} v.016" stroke="#9fa9d0" stroke-width=".003" stroke-linecap="round"/>`).join('')}
      <path d="M${cx - sx * .03} ${cy + .01} Q${cx - sx * .02} ${cy - .03} ${cx + sx * .006} ${cy - .03}" stroke="${SKIN}" stroke-width=".016" stroke-linecap="round" fill="none"/>
      <path d="M${cx - sx * .03} ${cy + .01} Q${cx - sx * .02} ${cy - .03} ${cx + sx * .006} ${cy - .03}" stroke="#9fa9d0" stroke-width=".003" fill="none" opacity=".6"/></g>`;
  }).join(''), 1024);
}

/* ------------------------------------------------ KELLER */
function cellarState(t) {
  const e = lastEv('light', t, [0, 1]); let L = e[1];
  if (L > 0 && e[0] > .5 && t - e[0] < .3) L = Math.sin((t - e[0]) * 70) > -.2 ? 1 : .1;
  const fz = lastEv('fig', t, [0, 99])[1];
  R3.setLight(L, fz);
  const pr = EV('press').some(p => t >= p[0] && t < p[0] + .22);
  R3.switchBtn.position.x = -.868 + (pr ? .006 : 0);
  return { L };
}
async function viewCellarWide(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start, { L } = cellarState(t);
  W3.setCam([.35, 1.72, 4.3 - .35 * ease(lt / d)], [0, 1.05, -.6], 50);
  ensurePlane('you', 2, 2); ensurePlane('hand', .5, .5, 1024);
  await W3.setPlane('hand', { visible: false });
  await W3.setPlane('you', { svg: svgWrap(0, 1.0, 2.0, standing(0, { eyes: 'open', t, look: sh.look || 0 }), 1536), pos: [0, 1.0, .35], color: L > .05 ? '#ece8df' : '#101012', face: true, shadow: [.55, .3] });
  return '';
}
async function viewCellarPov(t, sh) {
  const lt = t - sh.start; cellarState(t);
  const sway = .01 * Math.sin(t * 1.3), close = lastEv('fig', t, [0, 99])[1] < 3;
  W3.setCam([.05 + sway, 1.6, .55 + (close ? 0 : .15 * ease(lt / (sh.end - sh.start)))], close ? [.08, 1.86, 1.35] : [0, 1.35, 14], close ? 52 : 46);
  ensurePlane('you', 2, 2); await W3.setPlane('you', { visible: false });
  return '';
}
async function viewSwitch(t, sh) {
  const lt = t - sh.start, { L } = cellarState(t);
  W3.setCam([-.42, 1.23, 1.0 - .05 * ease(lt / (sh.end - sh.start))], [-.885, 1.15, .45], 40);
  ensurePlane('you', 2, 2); ensurePlane('hand', .5, .5, 1024); await W3.setPlane('you', { visible: false });
  let p = 0; for (const e of EV('press')) { const a = t - e[0]; if (a > -.6 && a < .5) p = Math.max(p, a < 0 ? 1 + a / .6 : a < .22 ? 1 : 1 - (a - .22) / .28); }
  if (p <= 0) { await W3.setPlane('hand', { visible: false }); return ''; }
  const tip = [.06 + .1 * ease(p), .055];
  const body = `<path d="M-.3 -.32 Q-.1 -.1 .0 -.02" stroke="${SKIN}" stroke-width=".05" fill="none" stroke-linecap="round"/>
    <circle cx=".0" cy="-.02" r=".035" fill="${SKIN}"/><path d="M.01 -.04 L${tip[0]} ${-tip[1]}" stroke="${SKIN}" stroke-width=".02" stroke-linecap="round"/>
    <path d="M.0 .0 q.03 .02 .05 .01 M.0 .01 q.025 .03 .045 .025" stroke="#c9d0ef" stroke-width=".012" fill="none"/>`;
  await W3.setPlane('hand', { svg: svgLocal(.5, .5, body, 1024), pos: [-.84, 1.1, .62], rotY: Math.PI / 2, color: L > .05 ? '#ece8df' : '#5a4a3a' });
  return '';
}
async function viewCellarFace(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start, { L } = cellarState(t);
  W3.setCam([.02, 1.5, 1.2 - .1 * ease(lt / d)], [0, 1.47, .35], 40);
  ensurePlane('you', 2, 2); ensurePlane('youClose', .7, .7, 1536);
  await W3.setPlane('you', { visible: false });
  const look = lt > d * .5 ? 1.3 * (sh.lookDir || 1) : 0;
  await W3.setPlane('youClose', { svg: svgWrap(0, 1.35, .7, standing(0, { eyes: 'wide', mouth: 'o', t, look, basket: true }), 1536), pos: [0, 1.35, .36], color: L > .05 ? '#ece8df' : '#101012' });
  return '';
}
function timerOverlay(t, sh) {
  if (sh.timer === false) return '';
  for (const [t0, frm, t1] of EV('timer')) {
    if (t < t0 || t > t1 + .6) continue;
    const v = Math.max(0, Math.ceil(frm * (t1 - t) / (t1 - t0)));
    const red = v <= 5, blink = v === 0 && (t * 4 % 1) < .5;
    return `<div class="timer" style="${red ? 'color:#ff3b30;border-color:#ff3b30' : ''};opacity:${blink ? .3 : 1}"><span>LICHT</span>0:${String(v).padStart(2, '0')}</div>`;
  }
  return '';
}

/* ------------------------------------------------ ZELT */
async function tentChars(t, show) {
  ensurePlane('you', .8, .8); ensurePlane('jonas', .8, .8); ensurePlane('jonasClose', .36, .36, 1536);
  await W3.setPlane('jonasClose', { visible: false });
  if (!show) { await W3.setPlane('you', { visible: false }); await W3.setPlane('jonas', { visible: false }); return; }
  const wake = lastEv('wake', t, null), jo = lastEv('jonasEyes', t, null);
  const youEyes = wake ? 'wide' : 'closed', youLook = wake && t - wake[0] > 1 ? 1.2 * Math.sin(t * .5 + 1) : 0;
  await W3.setPlane('you', { svg: svgWrap(-.43, .3, .8, lying(-.43, .22, { eyes: youEyes, t, look: youLook, mouth: wake ? 'o' : '' }), 1536), pos: [-.43, .3, -.62], color: '#a3abc8' });
  await W3.setPlane('jonas', { svg: svgWrap(.43, .3, .8, lying(.43, .22, { eyes: jo ? 'wide' : 'closed', look: jo ? -.4 : 0, mouth: '', hair: true }), 1536), pos: [.43, .3, -.62], color: '#a3abc8' });
}
function tentState(t, inside = true) {
  R3.tick(t);
  R3.fabric.emissiveIntensity = inside ? .55 : .12; R3.inLight.intensity = inside ? .35 : 0;
  const s = lastEv('shadow', t, null), sp = s ? ease((t - s[0]) / 1.6) : 0;
  R3.wallShadow.material.opacity = .82 * sp;
  R3.wallShadow.position.z = .5 - .5 * sp;
  const z = lastEv('zip', t, null), zp = z ? ease((t - z[0]) / Math.max(.5, z[1] - z[0])) : 0;
  R3.zip.position.y = .1 + .75 * zp;
  R3.handShadow.material.opacity = 0;
  return { zip: z, zp };
}
async function viewTentExt(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start, a = .78 + .16 * ease(lt / d), r = 8.6 - .7 * ease(lt / d);
  W3.setCam([Math.sin(a) * r, 2.1, Math.cos(a) * r], [-.2, .5, 0], 44);
  tentState(t, false); await tentChars(t, false);
  return '';
}
async function viewTentIn(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start, p = ease(lt / d);
  if (sh.look === 'wall') W3.setCam([-.3, .62 + .04 * p, .75], [.55, .62, -.15], 56);
  else W3.setCam([0, .82 - .03 * p, 1.08 - .12 * p], [0, .04, -.7], 68);
  tentState(t); await tentChars(t, true);
  return '';
}
async function viewJonas(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start;
  W3.setCam([.36, .47, -.04 - .06 * ease(lt / d)], [.43, .15, -.62], 42);
  tentState(t); await tentChars(t, false);
  const q = (TL.quotes || []).find(q => t >= q.start && t < q.end && q.who === 'JONAS' && q.place === 'NEBEN DIR');
  const mouth = q && Math.sin(t * 14) > 0 ? 'o' : '';
  await W3.setPlane('jonasClose', { svg: svgWrap(.43, .23, .36, lying(.43, .22, { eyes: 'wide', look: -.5 + .1 * Math.sin(t * 2), mouth, hair: true }), 1536), pos: [.43, .23, -.6], color: '#aab2cc' });
  return '';
}
// Schatten der ganzen Gestalt auf der Zelttür: beugt sich herunter, die Hand zieht den Reißverschluss hoch
function doorShadowSvg(t, zp, op) {
  const zy = .1 + .75 * zp - .65;                 // Reißverschluss in lokalen Koordinaten
  const hx = .035, hy = -(zy + .03);              // Hand am Zipper (SVG: y nach unten)
  const sway = .01 * Math.sin(t * 1.7);
  const sh = [.3 + sway, .08], head = [sh[0] - .015, sh[1] - .19];
  return svgLocal(1.9, 1.3, `<defs><clipPath id="tri"><polygon points="-.95,.65 0,-.65 .95,.65"/></clipPath>
      <filter id="sb" filterUnits="userSpaceOnUse" x="-1" y="-1" width="2" height="2"><feGaussianBlur stdDeviation=".012"/></filter></defs>
    <g clip-path="url(#tri)" opacity="${op}"><g filter="url(#sb)" fill="#000" stroke="#000" stroke-width="0" stroke-linecap="round" stroke-linejoin="round">
      <g transform="rotate(-10 ${head[0]} ${head[1]})"><ellipse cx="${head[0]}" cy="${head[1]}" rx=".062" ry=".082"/></g>
      <path d="M${head[0] + .002} ${head[1] + .07} L${sh[0]} ${sh[1] + .01}" stroke-width=".036" fill="none"/>
      <path d="M${sh[0] - .1} ${sh[1] + .03} Q${sh[0]} ${sh[1] - .03} ${sh[0] + .11} ${sh[1] + .04} Q${sh[0] + .1} .15 ${sh[0] + .08} .3 L${sh[0] + .12} .7 L${sh[0] + .02} .7 L${sh[0] - .02} .3 Q${sh[0] - .06} .15 ${sh[0] - .1} ${sh[1] + .03} Z" stroke="none"/>
      <path d="M${sh[0] - .08} ${sh[1] + .04} Q${(sh[0] + hx) / 2 + .02} ${(sh[1] + hy) / 2 + .1} ${hx + .03} ${hy + .01}" stroke-width=".032" fill="none"/>
      <ellipse cx="${hx + .02}" cy="${hy}" rx=".028" ry=".022" stroke="none"/>
      ${[0, 1, 2, 3].map(i => `<path d="M${hx + .01} ${hy - .01 + i * .008} Q${hx - .03} ${hy - .05 + i * .012} ${hx - .055 + i * .006} ${hy - .085 + i * .02}" stroke-width=".007" fill="none"/>`).join('')}
      <path d="M${sh[0] + .1} ${sh[1] + .05} Q${sh[0] + .2} .1 ${sh[0] + .22} .5 L${sh[0] + .24} .62" stroke-width=".028" fill="none"/>
      ${[0, 1, 2].map(i => `<path d="M${sh[0] + .24} .62 l${-.02 + i * .02} .08" stroke-width=".007"/>`).join('')}
    </g></g>`, 1024);
}
async function viewTentDoor(t, sh) {
  const lt = t - sh.start;
  W3.setCam([0, .58, -.5 - .08 * ease(lt / (sh.end - sh.start))], [0, .55, 1.15], 52);
  const { zip, zp } = tentState(t); await tentChars(t, false);
  ensurePlane('doorShadow', 1.9, 1.3, 1024);
  const op = zip ? .85 * clamp((t - zip[0] + 1.2) / .9) : 0;
  await W3.setPlane('doorShadow', op > 0 ? { svg: doorShadowSvg(t, zp, op), pos: [0, .65, 1.137], rotY: Math.PI } : { visible: false });
  return '';
}

/* ------------------------------------------------ AUTO */
function carState(t, inside) {
  R3.tick(t);
  const fo = lastEv('follow', t, null);
  R3.follow.visible = !!fo;
  if (fo) { const a = t - fo[0]; R3.follow.position.set(.15 * Math.sin(t * .7), 0, Math.max(7.2, 45 - a * 7) + .4 * Math.sin(t * 1.3)); }
  let f = 0; for (const [ft] of EV('flash')) { const a = t - ft; if (a >= 0) f += Math.min(1, a / .04) * Math.exp(-a * 6); }
  f = Math.min(1.4, f);
  R3.fSpots.forEach(l => l.intensity = 7 + 160 * f);
  R3.fLamps.forEach(l => l.material.color.setScalar(1 + 2 * f));
  const rv = lastEv('reveal', t, null), vis = rv ? (.02 + .42 * Math.min(1, f + (t - rv[0] < 1.2 ? .35 : 0))) : 0;
  R3.backseat.material.color.setScalar(vis); R3.backseat.visible = vis > .01;
  R3.ext.visible = !inside; R3.int.visible = inside;
  R3.radio.material.color.set(lastEv('radio', t, null) ? '#ffb347' : '#5a3c14');
  return { f };
}
function driverHands() {               // Hand-Positionen (Lenkrad) auf die Fahrer-Ebene projiziert, lokale SVG-Koordinaten
  return GRIP.map(([x, y]) => { const w = [WHEEL[0] - x, WHEEL[1] + y, WHEEL[2] - .03]; const p = W3.toPlane(w, .22); return [-(p[0] + .37), -(p[1] - 1.0)]; });
}
async function driverPlane(t, show, eyes = 'open', look = 0, mouth = '') {
  ensurePlane('you', 1.1, 1.1); ensurePlane('youClose', .5, .5, 1536); ensurePlane('hands', .5, .3, 1024);
  await W3.setPlane('youClose', { visible: false });
  if (!show) { await W3.setPlane('hands', { visible: false }); return W3.setPlane('you', { visible: false }); }
  await W3.setPlane('you', { svg: svgLocal(1.1, 1.1, driver({ eyes, t, look, mouth, lit: true, hands: driverHands() })), pos: [-.37, 1.0, .22], rotY: Math.PI, color: '#b6bfdc' });
  await W3.setPlane('hands', { svg: handsSvg(), pos: [WHEEL[0], WHEEL[1], WHEEL[2] - .03], rotY: Math.PI, color: '#b6bfdc' });
}
const flashDiv = (f, k = .35) => f > .02 ? `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%, rgba(255,255,245,${Math.min(.9, f * k)}), rgba(255,255,245,${Math.min(.5, f * k * .4)}) 60%, transparent)"></div>` : '';
async function viewCarExt(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start, p = ease(lt / d);
  const { f } = carState(t, false); await driverPlane(t, false);
  if (sh.cam === 'side') W3.setCam([-7.5 + p, 2.0, 5.2], [0, .6, 5.0], 46);
  else W3.setCam([-2.6 + .4 * p, 2.3 - .2 * p, 8 - p], [0, .8, -5], 44);
  return flashDiv(f, .15);
}
async function viewCarIn(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start, { f } = carState(t, true);
  W3.setCam([-.36, 1.3, -.6], [-.22, 1.0, 1.5 + .2 * ease(lt / d)], 60);
  await driverPlane(t, true, 'wide', f > .3 ? 1.2 : 0, f > .3 ? 'o' : '');
  return flashDiv(f, .28);
}
async function viewMirror(t, sh) {
  const { f } = carState(t, true); await driverPlane(t, false);
  W3.setCam([0, 1.31, -.5], [0, 1.06, 4], 30 - 2 * ease((t - sh.start) / (sh.end - sh.start)));
  const rv = lastEv('reveal', t, null);
  const glare = rv ? .15 + .15 * f : .55 + .45 * Math.min(1, f);
  return `<div class="glare" style="opacity:${glare}"></div><div class="mirror"></div>`;
}
async function viewCarFace(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start, { f } = carState(t, true);
  await driverPlane(t, false);
  W3.setCam([-.34, 1.15, -.2 - .05 * ease(lt / d)], [-.37, 1.12, .22], 42);
  await W3.setPlane('youClose', { svg: svgLocal(.5, .5, `<g transform="translate(0 .1)">${driver({ eyes: 'wide', t, look: lt > d * .5 ? 1 : 0, mouth: 'o', lit: true })}</g>`), pos: [-.37, 1.12, .22], rotY: Math.PI, color: '#b6bfdc' });
  return flashDiv(f, .3);
}
async function viewRadio(t, sh) {
  carState(t, true); await driverPlane(t, true);
  W3.setCam([.3, 1.2, .25], [.05, .9, -.45], 50);
  const q = (TL.quotes || []).find(q => t >= q.start && t < q.end);
  const msg = q ? `+++ ${q.text.toUpperCase()} +++ ` : '';
  const scroll = msg ? `<div style="white-space:nowrap;transform:translateX(${260 - ((t - q.start) * 120) % (msg.length * 15 + 260)}px)">${msg.repeat(3)}</div>` : `<div style="opacity:${.5 + .5 * Math.sin(t * 9)}">· · · RAUSCHEN · · ·</div>`;
  const bars = Array.from({ length: 16 }, (_, i) => `<i style="height:${4 + Math.abs(noise(t * 9 + i)) * 26}px"></i>`).join('');
  return `<div class="radio"><div class="lcd"><div class="fm">FM 87,6</div><div class="txt">${scroll}</div><div class="bars">${bars}</div></div>
    <div class="knobs"><b></b><b></b></div></div>`;
}

/* ------------------------------------------------ Hintergrund für Auswahl/Handy je Set */
const SETBG = {
  cellar: async (t) => { cellarState(t); ensurePlane('you', 2, 2); await W3.setPlane('you', { visible: false }); W3.setCam([.05, 1.6, .6], [0, 1.35, 14], 46); },
  tent: async (t) => { tentState(t); await tentChars(t, true); W3.setCam([0, .82, 1.08], [0, .04, -.7], 68); },
  car: async (t) => { carState(t, true); await driverPlane(t, true, 'wide'); W3.setCam([-.36, 1.3, -.6], [-.22, 1.0, 1.5], 60); },
};

Object.assign(VIEWS, { cellar_wide: viewCellarWide, cellar_pov: viewCellarPov, switch: viewSwitch, cellar_face: viewCellarFace,
  tent_ext: viewTentExt, tent_in: viewTentIn, jonas: viewJonas, tent_door: viewTentDoor,
  car_ext: viewCarExt, car_in: viewCarIn, mirror: viewMirror, car_face: viewCarFace, radio: viewRadio });
Object.assign(GLSTYLE, { cellar_wide: '', cellar_pov: '', switch: '', cellar_face: '', tent_ext: '', tent_in: '', jonas: '', tent_door: '',
  car_ext: '', car_in: '', mirror: '', car_face: '', radio: 'blur(7px) brightness(.55)' });
Object.assign(SET_ASSETS, { creatureCellar: CREATURE.replace(/<rect x="0" y="290"[^>]*\/>/, ''), backseat: BACKSEAT, tentShadow: TENT_SHADOW, handShadow: HAND_SHADOW });

/* ======================================================================= AUFZUG */
function person(x, st) {                 // stehende Person, Welt-Koordinaten, Kleidung frei wählbar
  const s = [], shirt = st.shirt || SHIRT;
  const ws = st.walk != null ? Math.sin(st.walk) : 0, lift = st.walk != null ? Math.max(0, Math.cos(st.walk)) * .04 : 0, lift2 = st.walk != null ? Math.max(0, -Math.cos(st.walk)) * .04 : 0;
  const fL = [x - .065 - ws * .07, -.02 - lift], fR = [x + .065 + ws * .07, -.02 - lift2];
  s.push(`<path d="M${x - .06} -.9 Q${x - .07} -.5 ${fL[0]} ${fL[1]} M${x + .06} -.9 Q${x + .07} -.5 ${fR[0]} ${fR[1]}" stroke="${st.pants || '#2a2c35'}" stroke-width=".05" stroke-linecap="round" fill="none"/>`);
  s.push(`<path d="M${fL[0] - .02} ${fL[1]} h.05 M${fR[0] - .03} ${fR[1]} h.05" stroke="#111" stroke-width=".035" stroke-linecap="round"/>`);
  s.push(`<path d="M${x - .105} -1.43 Q${x} -1.47 ${x + .105} -1.43 L${x + .1} -.88 L${x - .1} -.88 Z" fill="${shirt}"/>`);
  if (st.tie) s.push(`<path d="M${x} -1.42 l.02 .05 -.014 .25 -.006 .03 -.006 -.03 -.014 -.25 Z" fill="${st.tie}"/>`);
  if (st.collar) s.push(`<path d="M${x - .045} -1.44 L${x} -1.38 L${x + .045} -1.44" stroke="${st.collar}" stroke-width=".018" fill="none"/>`);
  const hl = st.handL || [x - .15 + ws * .05, -.95], hr = st.handR || [x + .15 - ws * .05, -.95];
  s.push(arm([x - .09, -1.39], hl, 1) + arm([x + .09, -1.39], hr, -1));
  s.push(head([x, -1.55], .13, { eyes: st.eyes, t: st.t, look: st.look, mouth: st.mouth, lit: st.lit }));
  if (st.hair) s.push(`<path d="M${x - .125} -1.58 Q${x - .12} -1.69 ${x} -1.69 Q${x + .12} -1.69 ${x + .125} -1.58 Q${x + .06} -1.64 ${x - .03} -1.62 Q${x - .09} -1.61 ${x - .125} -1.58 Z" fill="${st.hair}"/>`);
  return s.join('');
}
const YOU_OFFICE = { shirt: '#c9d2e4', tie: '#7c3347', collar: '#e8edf6', pants: '#2a2c35' };
const MARKUS = { shirt: '#383c48', tie: '#1a1c22', collar: '#d7dbe4', pants: '#26282f', hair: '#2b1f17' };
function elevState(t) {
  const f = lastEv('floor', t, [0, '12', 0]); const key = f[1] + '|' + f[2] + '|' + (f[3] || 0);
  if (R3._floorKey !== key) { R3.setFloor(f[1], f[2], f[3]); R3._floorKey = key; }
  const b = EV('btn').filter(e => e[0] <= t).map(e => e[1]); const bk = b.join(',');
  if (R3._btnKey !== bk) { R3.setButtons(b); R3._btnKey = bk; }
  const d = lastEv('doors', t, [-9, 0]); const prevOpen = EV('doors').filter(e => e[0] < d[0]).slice(-1)[0]?.[1] ?? 0;
  const op = lerp(prevOpen, d[1], ease((t - d[0]) / .9));
  R3.doors[0].position.x = -.225 - .44 * op; R3.doors[1].position.x = .225 + .44 * op;
  let fl = 1; for (const [ft] of EV('flicker')) { const a = t - ft; if (a >= 0 && a < .8) fl = Math.sin(a * 60) > .2 ? 1 : .15; }
  R3.cabLight.intensity = 1.6 * fl; R3.panelLight.material.color.set(fl > .5 ? '#eef2ff' : '#3a3c44');
  const m13 = lastEv('floor13', t, null);
  R3.endDesk.visible = !!m13;
  R3.tubes.forEach((tb, i) => { const on = !m13 ? 1 : i === 1 ? (Math.sin(t * 23) * Math.sin(t * 7.1) > .1 ? .8 : 0) : 0; tb.l.intensity = 6 * on; tb.m.material.color.set(on ? '#eef3ff' : '#25272c'); });
  R3.hemi.intensity = m13 ? .12 : .3;
  return { op, fl, m13 };
}
function markusPos(t) {
  const m = lastEv('markus', t, null); if (!m) return null;
  const prev = EV('markus').filter(e => e[0] < m[0]).slice(-1)[0];
  const P = { 1: [-.05, 1.15], 2: [-.14, -.12] }, a = prev ? P[prev[1]] : P[1], b = P[m[1]];
  const k = ease((t - m[0]) / 1.1); return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
}
async function elevChars(t, showYou, youOpts = {}) {
  ensurePlane('you', 2, 2); ensurePlane('markus', 2, 2); ensurePlane('deskYou', 1.2, 1.2); ensurePlane('youClose', .7, .7, 1536);
  await W3.setPlane('youClose', { visible: false });
  const { fl, m13 } = elevState(t), col = fl > .5 ? '#e9ecf4' : '#5a5c66';
  if (showYou) await W3.setPlane('you', { svg: svgWrap(youOpts.x ?? .1, 1.0, 2.0, person(youOpts.x ?? .1, { ...YOU_OFFICE, eyes: youOpts.eyes || 'open', t, look: youOpts.look || 0, mouth: youOpts.mouth || '' })), pos: [youOpts.x ?? .1, 1.0, youOpts.z ?? -.25], color: col, face: true, shadow: [.55, .3] });
  else await W3.setPlane('you', { visible: false });
  const mp = markusPos(t), ml = lastEv('markusLook', t, null);
  if (mp && youOpts.markus !== false) await W3.setPlane('markus', { svg: svgWrap(mp[0], 1.0, 2.0, person(mp[0], { ...MARKUS, eyes: 'open', look: ml ? 1.4 * ease((t - ml[0]) / 1.5) : 0, mouth: '' })), pos: [mp[0], 1.0, mp[1]], color: col, face: true, shadow: [.55, .3] });
  else await W3.setPlane('markus', { visible: false });
  if (m13) await W3.setPlane('deskYou', { svg: svgLocal(1.2, 1.2, `<path d="M-.11 .2 Q0 .16 .11 .2 L.12 .6 L-.12 .6 Z" fill="${YOU_OFFICE.shirt}"/><path d="M0 .2 l.02 .05 -.014 .25 -.006 .03 -.006 -.03 -.014 -.25 Z" fill="${YOU_OFFICE.tie}"/>` + head([0, .06], .13, { eyes: 'open', look: .9, lit: true })), pos: [0, 1.0, 8.95], rotY: Math.PI, color: '#c8d4ff' });
  else await W3.setPlane('deskYou', { visible: false });
}
function camOverlay(t, label) {
  const sec = Math.floor(t) % 60, ts = `2026-11-06  03:3${3 + Math.floor((t + 20) / 60)}:${String(sec).padStart(2, '0')}`;
  return `<div class="cam"><i></i><b>REC</b><span>${label}</span><em>${ts}</em></div>`;
}
async function viewOffice(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start; elevState(t);
  W3.setCam([-.9 + .15 * ease(lt / d), 1.6, 3.9 - .3 * ease(lt / d)], [.35, 1.2, .9], 48);
  await elevChars(t, true, { x: .55, z: 1.25, look: -.6 });
  return '';
}
async function viewElevIn(t, sh) {
  elevState(t);
  W3.setCam([.62, 2.12, .62], [-.08, .85, -.5], 64);
  const ml = lastEv('markusLook', t, null);
  await elevChars(t, true, { x: .24, z: -.38, eyes: ml ? 'wide' : 'open', mouth: ml ? 'o' : '', look: lastEv('markus', t, null) ? -.8 : 0 });
  return camOverlay(t, 'AUFZUG 2 · CAM 1');
}
async function viewElevPov(t, sh) {
  const lt = t - sh.start; elevState(t);
  const zp = ease((lt - 2) / Math.max(1, sh.end - sh.start - 2));
  W3.setCam([0, 1.62, -.3 + .1 * ease(lt / (sh.end - sh.start))], [0, 1.2 - .12 * zp, 9], 46 - 32 * zp);
  await elevChars(t, false, { markus: true });
  return '';
}
async function viewElevDisplay(t, sh) {
  elevState(t);
  W3.setCam([0, 1.85, -.25], [0, 2.12, .72], 34);
  await elevChars(t, false, { markus: false });
  return '';
}
async function viewElevFace(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start, { fl } = elevState(t);
  W3.setCam([.12, 1.55, .42 - .06 * ease(lt / d)], [.12, 1.52, -.3], 40);
  await elevChars(t, false, { markus: false });
  const ml = lastEv('markusLook', t, null);
  await W3.setPlane('youClose', { svg: svgWrap(.12, 1.35, .7, person(.12, { ...YOU_OFFICE, eyes: 'wide', mouth: 'o', t, look: lt > d * .5 ? (sh.lookDir || -1) * 1.3 : 0 })), pos: [.12, 1.35, -.3], color: fl > .5 ? '#e9ecf4' : '#5a5c66' });
  return '';
}

/* ======================================================================= NACHTBUS */
function sitter(st) {                    // sitzend, lokale Koordinaten, Blick zur Kamera
  return `<path d="M-.12 -.12 Q0 -.17 .12 -.12 L.13 .42 L-.13 .42 Z" fill="${st.shirt || '#4a5a7a'}"/>` +
    arm([-.1, -.08], [-.08, .3], 1) + arm([.1, -.08], [.08, .3], -1) +
    head([0, -.27], .12, { eyes: st.eyes, t: st.t, look: st.look, mouth: st.mouth, lit: st.lit });
}
function busState(t, inside) {
  R3.tick(t); R3.ext.visible = !inside; R3.int.visible = inside;
  const l = lastEv('led', t, [0, 'LINIE N7  ·  NACHTBUS', 0]); const g = l[2] || 0;
  const key = l[1] + (g ? Math.floor(t * 8) : '');
  if (R3._ledKey !== key) { R3.setLed(l[1], g ? g * (.6 + .4 * Math.random()) : 0); R3._ledKey = key; }
  let fl = 1; for (const [ft] of EV('flick')) { const a = t - ft; if (a >= 0 && a < .9) fl = Math.sin(a * 50) > .1 ? 1 : .1; }
  R3.cabin.intensity = 1.1 * fl; R3.strip.material.color.set(fl > .5 ? '#c9d6ff' : '#2a2d36');
  const empty = lastEv('empty', t, null);
  R3.busWheel.rotation.z = empty ? .35 * Math.sin((t - empty[0]) * 1.3) : .05 * Math.sin(t * .8);
  return { fl, empty };
}
async function busChars(t, opts = {}) {
  ensurePlane('you', 1.4, 1.4); ensurePlane('driver', 1.2, 1.2); ensurePlane('youClose', .6, .6, 1536); ensurePlane('refl', .9, .7, 1536);
  await W3.setPlane('youClose', { visible: false }); await W3.setPlane('refl', { visible: false });
  const { empty, fl } = busState(t, true), col = fl > .5 ? '#d6ddf0' : '#6a6f80';
  if (opts.you !== false) await W3.setPlane('you', { svg: svgLocal(1.4, 1.4, sitter({ eyes: opts.eyes || 'open', t, look: opts.look || 0, mouth: opts.mouth || '' })), pos: [.72, 1.0, .12], rotY: Math.PI, color: col });
  else await W3.setPlane('you', { visible: false });
  if (!empty && opts.driver !== false) await W3.setPlane('driver', { svg: svgLocal(1.2, 1.2, `<path d="M-.14 0 Q0 -.06 .14 0 L.16 .5 L-.16 .5 Z" fill="#3d4f7a"/>
      <circle cx="0" cy="-.14" r=".12" fill="url(#headG)"/><path d="M-.125 -.17 Q0 -.31 .125 -.17 Z" fill="#1e2a46"/><rect x="-.135" y="-.185" width=".27" height=".03" rx=".01" fill="#141c30"/>
      <ellipse cx="-.12" cy="-.13" rx=".02" ry=".03" fill="#c9d0ef"/><ellipse cx=".12" cy="-.13" rx=".02" ry=".03" fill="#c9d0ef"/>`), pos: [-.65, 1.32, -4.62], color: col });
  else await W3.setPlane('driver', { visible: false });
}
async function viewBusExt(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start; busState(t, false);
  ensurePlane('you', 1.4, 1.4); ensurePlane('driver', 1.2, 1.2); await W3.setPlane('you', { visible: false }); await W3.setPlane('driver', { visible: false });
  W3.setCam([-9 + .8 * ease(lt / d), 3.0, -15 + ease(lt / d)], [0, 1.3, -1.5], 42);
  return '';
}
async function viewBusIn(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start;
  W3.setCam([-.3, 1.7, -1.6 + .15 * ease(lt / d)], [.55, 1.12, .6], 52);
  const q = (TL.quotes || []).find(q => t >= q.start && t < q.end);
  await busChars(t, { eyes: sh.eyes || (q ? 'wide' : 'open'), look: sh.look || 0, mouth: q ? 'o' : '' });
  return '';
}
async function viewBusFront(t, sh) {
  const lt = t - sh.start;
  W3.setCam([.62, 1.3, .0 - .2 * ease(lt / (sh.end - sh.start))], [-.45, 1.25, -5], 50);
  await busChars(t, { you: false });
  return '';
}
async function viewBusDisplay(t, sh) {
  W3.setCam([0, 1.7, -2.0], [0, 2.0, -3.95], 40);
  await busChars(t, { you: false, driver: false });
  const l = lastEv('led', t, [0, 'LINIE N7  ·  NACHTBUS', 0]);
  let tx = l[1]; if (l[2]) tx = tx.split('').map(ch => ch !== ' ' && Math.random() < l[2] ? '█▓▒#%&'[Math.floor(Math.random() * 6)] : ch).join('');
  const lines = tx.length > 12 ? (() => { const w = tx.split(' '); const h = Math.ceil(w.length / 2); return [w.slice(0, h).join(' '), w.slice(h).join(' ')]; })() : [tx];
  return `<div class="led">${lines.map(x => `<div>${x}</div>`).join('')}</div>`;
}
async function viewBusWindow(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start;
  W3.setCam([.32, 1.4, .2 + .05 * ease(lt / d)], [1.2, 1.43, .42], 46);
  await busChars(t, { you: false });
  const rf = lastEv('reflFig', t, null), fo = rf ? clamp((t - rf[0]) / .8) : 0;
  const body = `<g opacity=".38">${head([-.1, .02], .09, { eyes: 'wide', t })}<path d="M-.19 .14 Q-.1 .1 -.01 .14 L0 .35 L-.2 .35 Z" fill="#4a5a7a"/></g>
    <g opacity="${.62 * fo}"><ellipse cx=".16" cy="-.02" rx=".085" ry=".12" fill="url(#cface)"/>
      <ellipse cx=".13" cy="-.04" rx=".02" ry=".03" fill="#000"/><ellipse cx=".19" cy="-.04" rx=".02" ry=".03" fill="#000"/>
      <path d="M.13 .04 Q.16 .07 .2 .035" stroke="#000" stroke-width=".006" fill="none"/>
      <path d="M.09 .1 Q.16 .08 .24 .12 L.26 .35 L.07 .35 Z" fill="#14151b"/></g>`;
  await W3.setPlane('refl', { svg: svgLocal(.9, .7, body), pos: [1.175, 1.43, .45], rotY: -Math.PI / 2 });
  return '';
}
async function viewBusFace(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start;
  W3.setCam([.72, 1.3, -.3 - .05 * ease(lt / d)], [.72, 1.27, .12], 40);
  await busChars(t, { you: false });
  const { fl } = busState(t, true);
  await W3.setPlane('youClose', { svg: svgLocal(.6, .6, `<g transform="translate(0 .25)">${sitter({ eyes: 'wide', mouth: 'o', t, look: lt > d * .5 ? (sh.lookDir || 1) * 1.3 : 0 })}</g>`), pos: [.72, 1.27, .12], rotY: Math.PI, color: fl > .5 ? '#d6ddf0' : '#6a6f80' });
  return '';
}

Object.assign(VIEWS, { office: viewOffice, elev_in: viewElevIn, elev_pov: viewElevPov, elev_display: viewElevDisplay, elev_face: viewElevFace,
  bus_ext: viewBusExt, bus_in: viewBusIn, bus_front: viewBusFront, bus_display: viewBusDisplay, bus_window: viewBusWindow, bus_face: viewBusFace });
Object.assign(GLSTYLE, { office: '', elev_in: '', elev_pov: '', elev_display: '', elev_face: '', bus_ext: '', bus_in: '', bus_front: '', bus_display: 'blur(6px) brightness(.5)', bus_window: '', bus_face: '' });
Object.assign(SETBG, {
  elevator: async (t) => { await elevChars(t, true, { x: .24, z: -.38, eyes: 'wide' }); W3.setCam([.62, 2.12, .62], [-.02, .85, -.5], 64); },
  bus: async (t) => { await busChars(t, { eyes: 'wide' }); W3.setCam([-.3, 1.7, -1.6], [.55, 1.12, .6], 52); },
});


/* ======================================================================= GROSSRAUMBÜRO (Bewegungsmelder) */
const DESK_POS = [-1.25, -6.3], COPIER_POS = [-.28, 1.95];
function youPos(t) {
  const w = lastEv('walk', t, null);
  if (!w) return { p: DESK_POS, sit: true, moving: false };
  const u = clamp((t - w[0]) / (w[1] - w[0]));
  if (u >= 1) return { p: COPIER_POS, sit: false, moving: false };
  const a = clamp(u / .15), b = clamp((u - .15) / .85);
  return { p: [lerp(DESK_POS[0], 0, ease(a)), lerp(DESK_POS[1], COPIER_POS[1], b)], sit: false, moving: u > 0, phase: (t - w[0]) * 9 };
}
function officeState(t) {
  const off = lastEv('allOff', t, null), lv = [0, 0, 0, 0, 0];
  R3.panels.forEach((P, i) => {
    let near = false;
    if (!off) for (let k = 0; k <= 1.5; k += .25) { const q = youPos(t - k).p; if (Math.hypot(q[0] - P.x, q[1] - P.z) < 1.8) near = true; }
    let v = near ? 1 : 0;
    for (const [gt, gi] of EV('ghost')) if (gi === i && gt <= t && (!off || gt >= off[0])) { v = (t - gt < .3) ? (Math.sin((t - gt) * 70) > 0 ? 1 : .15) : 1; }
    lv[i] = v;
  });
  R3.setPanels(lv);
  const th = lastEv('thing', t, null); R3.thing.visible = !!th;
  if (th) { R3.thing.material.color.setScalar(.5 + .4 * lv[3]); lv[3] *= .42; R3.setPanels(lv); R3.panels[3].l.color.set('#9fb4e0'); }
  const pr = lastEv('print', t, null);
  const printing = pr && t < pr[1];
  R3.scan.position.x = printing ? Math.sin((t - pr[0]) * 3.2) * .4 : 0; R3.scan.visible = !!printing; R3.scanLight.intensity = printing ? 1.6 : 0;
  R3.sheet.position.z = 3.08 - (pr && t >= pr[1] ? .1 * clamp((t - pr[1]) / .6) : 0);
  return { lv, off };
}
async function officeYou(t, close = false, opts = {}) {       // echte 3D-Figur
  ensurePlane('you', 2, 2); ensurePlane('youClose', .7, .7, 1536);
  await W3.setPlane('you', { visible: false }); await W3.setPlane('youClose', { visible: false });
  officeState(t);
  const H = R3.heroBuild(), st = youPos(t), nx = youPos(t + .08).p;
  const dx = nx[0] - st.p[0], dz = nx[1] - st.p[1];
  const yaw = st.sit ? Math.PI : (st.moving && Math.hypot(dx, dz) > 1e-4 ? Math.atan2(dx, dz) : 0);
  const pos = st.sit ? [DESK_POS[0], 0, DESK_POS[1] - .12] : [st.p[0], 0, st.p[1]];
  H.setPose({ visible: !opts.hide, pos, yaw, sit: st.sit, walk: st.moving ? st.phase : null,
    look: opts.look || 0, eyes: close || opts.eyes === 'wide' ? 'wide' : 'open', mouth: close || opts.mouth === 'o' ? 'o' : '' });
}
async function viewOoDesk(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start;
  W3.setCam([.35 + .1 * ease(lt / d), 1.75, -8.1], [-1.2, 1.0, -6.4], 46);
  await officeYou(t);
  return '';
}
async function viewOoWalk(t, sh) {
  const st = youPos(t);
  W3.setCam([st.p[0] + 1.3, 1.7, st.p[1] + 2.7], [st.p[0] - .1, 1.1, st.p[1] - 1.2], 50);
  await officeYou(t);
  return '';
}
async function viewOoCopier(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start;
  W3.setCam([.2 - .05 * ease(lt / d), 1.8, 3.6], [-.05, 1.2, -3], sh.zoom ? 56 : 62);
  await officeYou(t, false, { eyes: sh.eyes, look: sh.look ?? -.2 });
  return '';
}
async function viewOoPov(t, sh) {
  const lt = t - sh.start;
  W3.setCam([-.1, 1.6, 1.9 - .2 * ease(lt / (sh.end - sh.start))], [-.1, 1.3, -8], 46);
  await officeYou(t, false, { hide: true });
  return '';
}
async function viewOoFace(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start;
  W3.setCam([-.28, 1.52, 2.78 - .06 * ease(lt / d)], [-.28, 1.48, 1.95], 36);
  await officeYou(t, true, { look: lt > d * .5 ? -.7 : 0 });
  return '';
}
function photoSvg(fig) {            // Schwarzweiß-Foto: du von hinten am Kopierer (unsere Statur), dahinter die Gestalt
  return `<svg viewBox="0 0 300 220" width="100%" height="100%" style="display:block;filter:grayscale(1) contrast(1.1)">
    <defs><radialGradient id="ph" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#e6e6e6"/><stop offset="1" stop-color="#9a9a9a"/></radialGradient>
      <radialGradient id="pv" cx="50%" cy="45%" r="70%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient></defs>
    <rect width="300" height="220" fill="#1e1e1e"/><rect y="150" width="300" height="70" fill="#2c2c2c"/>
    <polygon points="110,0 190,0 230,150 70,150" fill="#fff" opacity=".06"/>
    <rect x="88" y="138" width="124" height="82" rx="4" fill="#b8b8b8"/><rect x="88" y="132" width="124" height="9" rx="2" fill="#4a4a4a"/>
    ${fig ? `<g opacity=".92">
      <path d="M206 220 Q204 150 208 108 Q211 86 220 82 Q229 86 232 108 Q236 150 234 220 Z" fill="#0a0a0a"/>
      <ellipse cx="220" cy="64" rx="13" ry="19" fill="#3a3a3a"/><circle cx="215" cy="61" r="1.6" fill="#f5f5f5"/><circle cx="225" cy="61" r="1.6" fill="#f5f5f5"/>
      <path d="M210 100 Q190 104 176 100 Q170 98 166 100" stroke="#0a0a0a" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      ${[0, 1, 2, 3].map(i => `<path d="M166 100 q-8 ${-3 + i * 2} -13 ${-1 + i * 3}" stroke="#0a0a0a" stroke-width="1.4" stroke-linecap="round"/>`).join('')}</g>` : ''}
    <path d="M134 220 L136 172 Q137 160 150 158 Q163 160 164 172 L166 220 Z" fill="#2a2a2a"/>
    <path d="M128 172 Q131 128 150 126 Q169 128 172 172 L170 176 L130 176 Z" fill="#c8c8c8"/>
    <path d="M131 134 Q122 150 124 172 M169 134 Q178 150 176 172" stroke="#d6d6d6" stroke-width="6" fill="none" stroke-linecap="round"/>
    <rect x="145" y="114" width="10" height="12" fill="#d6d6d6"/><circle cx="150" cy="98" r="20" fill="url(#ph)"/>
    <rect width="300" height="220" fill="url(#pv)"/>
    <text x="10" y="212" font-family="JetBrains Mono" font-size="9" fill="#ddd">03:34  KOPIE 1/1</text></svg>`;
}
async function viewOoPaper(t, sh) {
  await officeYou(t, false, {}); W3.setCam([.2, 1.8, 3.6], [-.05, 1.2, -3], 62);
  const lt = t - sh.start, p = ease(lt / .5), fig = !!lastEv('paperFig', t, null);
  return `<div class="paper" style="transform:translate(-50%, ${(1 - p) * 120}px) rotate(${-4 + 2 * p}deg);opacity:${clamp(lt / .3)}">
    <div class="photo">${photoSvg(fig)}</div><div class="pl"></div><div class="pl short"></div></div>`;
}
Object.assign(VIEWS, { oo_desk: viewOoDesk, oo_walk: viewOoWalk, oo_copier: viewOoCopier, oo_pov: viewOoPov, oo_face: viewOoFace, oo_paper: viewOoPaper });
Object.assign(GLSTYLE, { oo_desk: '', oo_walk: '', oo_copier: '', oo_pov: '', oo_face: '', oo_paper: 'blur(8px) brightness(.5)' });
Object.assign(SETBG, { openoffice: async (t) => { await officeYou(t, false, { eyes: 'wide' }); W3.setCam([.2, 1.8, 3.6], [-.05, 1.2, -3], 62); } });

const THING_DARK = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2300" viewBox="0 0 100 230">
  <defs><linearGradient id="tdRim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a2f3e"/><stop offset=".25" stop-color="#05060a"/><stop offset=".8" stop-color="#05060a"/><stop offset="1" stop-color="#1c202c"/></linearGradient>
    <radialGradient id="tdFace" cx="50%" cy="38%" r="60%"><stop offset="0" stop-color="#3b3f4c"/><stop offset=".7" stop-color="#14161d"/><stop offset="1" stop-color="#07080b"/></radialGradient>
    <filter id="tdB"><feGaussianBlur stdDeviation=".6"/></filter>
    <radialGradient id="tdE" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
  <g filter="url(#tdB)">
    <path d="M38 230 L40 120 Q41 70 50 62 Q59 70 60 120 L62 230 Z" fill="url(#tdRim)"/>
    <path d="M42 74 Q24 92 16 128 Q12 146 10 168" stroke="#05060a" stroke-width="3.2" fill="none" stroke-linecap="round"/>
    <path d="M58 74 Q70 84 74 100 Q78 112 70 118" stroke="#05060a" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${[0, 1, 2, 3].map(i => `<path d="M10 168 q-3 ${5 + i} -1 ${10 + i * 2}" stroke="#0a0b10" stroke-width=".9" fill="none" stroke-linecap="round"/>`).join('')}
    <path d="M47 50 L48 64 L52 64 L53 50 Z" fill="#05060a"/>
    <g transform="rotate(-14 50 34)"><ellipse cx="50" cy="34" rx="11" ry="16" fill="url(#tdFace)"/>
      <path d="M42 41 Q50 47 58 41" stroke="#000" stroke-width="1.2" fill="none" opacity=".8"/></g>
  </g>
  <circle cx="45.5" cy="31" r="2.6" fill="url(#tdE)"/><circle cx="54" cy="29.5" r="2.6" fill="url(#tdE)"/>
  <circle cx="45.5" cy="31" r=".7" fill="#fff"/><circle cx="54" cy="29.5" r=".7" fill="#fff"/>
</svg>`;
const YOU3D = { shirt: '#8590a8', tie: '#7c3347', pants: '#2a2c35' };
Object.assign(SET_ASSETS, { thingDark: THING_DARK });
