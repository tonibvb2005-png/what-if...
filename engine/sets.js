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
  const th = lastEv('thing', t, null); R3.thing.visible = !!th; if (th) R3.thing.material.color.setScalar(.03 + .2 * lv[3]);
  const pr = lastEv('print', t, null);
  const printing = pr && t < pr[1];
  R3.scan.position.x = printing ? Math.sin((t - pr[0]) * 3.2) * .4 : 0; R3.scan.visible = !!printing; R3.scanLight.intensity = printing ? 1.6 : 0;
  R3.sheet.position.z = 3.08 - (pr && t >= pr[1] ? .1 * clamp((t - pr[1]) / .6) : 0);
  return { lv, off };
}
async function officeYou(t, close = false, opts = {}) {
  ensurePlane('you', 2, 2); ensurePlane('youClose', .7, .7, 1536);
  const st = youPos(t), { lv } = officeState(t);
  const lit = Math.max(...lv.slice(0, 5).map((v, i) => Math.hypot(st.p[0] - R3.panels[i].x, st.p[1] - R3.panels[i].z) < 2 ? v : 0));
  const col = st.sit ? '#c6d4ff' : lit > .5 ? '#e6e9f2' : (lv[4] > .5 ? '#d0d6e8' : '#3a3c48');
  await W3.setPlane('youClose', { visible: false });
  if (close) {
    await W3.setPlane('you', { visible: false });
    return W3.setPlane('youClose', { svg: svgWrap(st.p[0], 1.35, .7, person(st.p[0], { ...YOU_OFFICE, eyes: 'wide', mouth: 'o', t, look: opts.look || 0 })), pos: [st.p[0], 1.35, st.p[1]], color: col });
  }
  if (opts.hide) return W3.setPlane('you', { visible: false });
  if (st.sit) return W3.setPlane('you', { svg: svgLocal(2, 2, sitter({ shirt: YOU_OFFICE.shirt, eyes: 'open', t, lit: true })), pos: [st.p[0], 1.0, st.p[1]], rotY: Math.PI, color: col });
  return W3.setPlane('you', { svg: svgWrap(st.p[0], 1.0, 2.0, person(st.p[0], { ...YOU_OFFICE, eyes: opts.eyes || 'open', t, look: opts.look || 0, mouth: opts.mouth || '', walk: st.moving ? st.phase : null })), pos: [st.p[0], 1.0, st.p[1]], color: col, face: true, shadow: [.6, .32] });
}
async function viewOoDesk(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start;
  W3.setCam([.45 + .1 * ease(lt / d), 1.85, -8.0], [-1.25, 1.0, -6.3], 48);
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
  await officeYou(t, false, { eyes: sh.eyes, look: sh.look ?? -.6 });
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
  W3.setCam([-.28, 1.55, 2.57 - .06 * ease(lt / d)], [-.28, 1.52, 1.95], 40);
  await officeYou(t, true, { look: lt > d * .5 ? -1.3 : 0 });
  return '';
}
function photoSvg(fig) {
  return `<svg viewBox="0 0 300 220" width="100%" height="100%" style="display:block;filter:grayscale(1) contrast(1.15)">
    <rect width="300" height="220" fill="#2a2a2a"/><rect y="150" width="300" height="70" fill="#3a3a3a"/>
    <rect x="95" y="128" width="110" height="80" fill="#bdbdbd"/><rect x="95" y="124" width="110" height="8" fill="#555"/>
    ${fig ? `<path d="M196 220 L200 70 Q204 46 218 44 Q232 46 234 70 L238 220 Z" fill="#0e0e0e"/><ellipse cx="216" cy="40" rx="15" ry="21" fill="#9a9a9a"/>
      <ellipse cx="210" cy="37" rx="4" ry="6" fill="#000"/><ellipse cx="222" cy="37" rx="4" ry="6" fill="#000"/><path d="M206 50 Q216 57 226 50" stroke="#000" stroke-width="2" fill="none"/>
      <path d="M204 82 Q186 96 172 98" stroke="#0e0e0e" stroke-width="7" fill="none" stroke-linecap="round"/>` : ''}
    <path d="M125 220 L128 120 Q150 108 172 120 L175 220 Z" fill="#7a7a7a"/><circle cx="150" cy="96" r="24" fill="#d0d0d0"/>
    <rect width="300" height="220" fill="url(#np)" opacity=".25"/>
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


/* ======================================================================= KIOSK (Spätschicht) */
// Grinsen: die Zähne hängen an der Oberlippe (Oberkante des Mundes), nichts schwebt frei
function grin(cx, cy, w, n = 11, id = 'gm') {
  const l = cx - w / 2, r = cx + w / 2, lo = cy + w * .5, up = cy + w * .3;
  const d = `M${l} ${cy} Q${cx} ${lo} ${r} ${cy} Q${cx} ${up} ${l} ${cy} Z`;
  const teeth = Array.from({ length: n }, (_, i) => {
    const t = .06 + i * (.88 / (n - 1)), x = r - w * t, top = cy + 2 * t * (1 - t) * (up - cy), gap = 2 * t * (1 - t) * (lo - up);
    return `<rect x="${x - w * .016}" y="${top - w * .01}" width="${w * .032}" height="${w * .01 + gap * .8}" rx="${w * .007}" fill="#e2dfd2"/>`;
  }).join('');
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><path d="${d}" fill="#05050a"/><g clip-path="url(#${id})">${teeth}</g>`;
}
// Der Kunde: zu groß, Kapuze, Gesicht im Schatten. Welt-Koordinaten wie person().
const HOOD = '#191b23', HOOD_IN = '#040406', CSKIN = '#aeb2c3';
function hooded(x, st) {
  const s = [], hy = -1.76 + (st.lean || 0) * .12, hx = x + (st.lean || 0) * .0;
  const ws = st.walk != null ? Math.sin(st.walk) : 0, lift = st.walk != null ? Math.max(0, Math.cos(st.walk)) * .04 : 0, lift2 = st.walk != null ? Math.max(0, -Math.cos(st.walk)) * .04 : 0;
  const fL = [x - .065 - ws * .08, -.02 - lift], fR = [x + .065 + ws * .08, -.02 - lift2];
  s.push(`<path d="M${x - .06} -.95 Q${x - .07} -.5 ${fL[0]} ${fL[1]} M${x + .06} -.95 Q${x + .07} -.5 ${fR[0]} ${fR[1]}" stroke="#121319" stroke-width=".055" stroke-linecap="round" fill="none"/>`);
  s.push(`<path d="M${fL[0] - .02} ${fL[1]} h.05 M${fR[0] - .03} ${fR[1]} h.05" stroke="#08080b" stroke-width=".035" stroke-linecap="round"/>`);
  // Hoodie (lang, schmal), leicht schattiert
  const body = `M${x - .12} ${hy + .2} Q${x} ${hy + .15} ${x + .12} ${hy + .2} L${x + .135} -.86 Q${x} -.83 ${x - .135} -.86 Z`;
  s.push(`<path d="${body}" fill="${HOOD}"/><path d="${body}" fill="url(#shadeR)"/>`);
  // Arme: viel zu lang. Vorne an der Theke (counter) oder hängend
  const sh = [[x - .1, hy + .24], [x + .1, hy + .24]];
  const hands = st.hands || [[x - .19 + ws * .05, -.74], [x + .19 - ws * .05, -.74]];
  if (!st.back) for (let k = 0; k < 2; k++) {
    const [a, b] = [sh[k], hands[k]], sx = k ? 1 : -1, mx = (a[0] + b[0]) / 2 + sx * .03, my = (a[1] + b[1]) / 2;
    s.push(`<path d="M${a[0]} ${a[1]} Q${mx} ${my} ${b[0]} ${b[1] - .03}" stroke="${HOOD}" stroke-width=".06" stroke-linecap="round" fill="none"/>`);
    // Hand mit langen, knotigen Fingern
    s.push(`<ellipse cx="${b[0]}" cy="${b[1]}" rx=".022" ry=".028" fill="${CSKIN}"/>`);
    for (let i = 0; i < 4; i++) {
      const fx = b[0] - .015 + i * .01, L = .07 + (i === 1 || i === 2 ? .02 : 0);
      s.push(`<path d="M${fx} ${b[1] + .015} Q${fx + sx * .004} ${b[1] + .015 + L * .55} ${fx - sx * .002} ${b[1] + .015 + L}" stroke="${CSKIN}" stroke-width=".0075" stroke-linecap="round" fill="none"/>
        <circle cx="${fx + sx * .002}" cy="${b[1] + .015 + L * .5}" r=".005" fill="#8d91a4"/>`);
    }
  } else for (let k = 0; k < 2; k++) {        // von hinten: Ellbogen nach vorne auf die Theke
    const a = sh[k], sx = k ? 1 : -1;
    s.push(`<path d="M${a[0]} ${a[1]} Q${a[0] + sx * .07} ${a[1] + .2} ${a[0] + sx * .04} ${a[1] + .42}" stroke="${HOOD}" stroke-width=".06" stroke-linecap="round" fill="none"/>`);
  }
  // Kapuze
  s.push(`<ellipse cx="${hx}" cy="${hy}" rx=".155" ry=".175" fill="${HOOD}"/><ellipse cx="${hx}" cy="${hy}" rx=".155" ry=".175" fill="url(#shadeR)"/>`);
  if (st.back) {
    s.push(`<path d="M${hx} ${hy - .17} Q${hx + .01} ${hy} ${hx} ${hy + .17}" stroke="#101117" stroke-width=".008" fill="none"/>`);
  } else {
    s.push(`<ellipse cx="${hx}" cy="${hy + .02}" rx=".105" ry=".13" fill="${HOOD_IN}"/>`);
    const sm = st.smile || 0;
    if (sm > 0) {   // nur die untere Gesichtshälfte kommt aus dem Schatten
      s.push(`<defs><clipPath id="hoodC"><ellipse cx="${hx}" cy="${hy + .02}" rx=".105" ry=".13"/></clipPath>
        <linearGradient id="lowF" x1="0" y1="0" x2="0" y2="1"><stop offset=".42" stop-color="${CSKIN}" stop-opacity="0"/><stop offset=".72" stop-color="${CSKIN}" stop-opacity=".95"/></linearGradient></defs>
        <g clip-path="url(#hoodC)" opacity="${sm}"><ellipse cx="${hx}" cy="${hy + .05}" rx=".085" ry=".12" fill="url(#lowF)"/>
        ${grin(hx, hy + .085, .11, 11, 'hoodGrin')}</g>`);
    }
  }
  return s.join('');
}
const LAGER_FIG = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2200" viewBox="-.5 -2.2 1 2.2">${DEFS}
  <defs><linearGradient id="lgDark" x1="0" y1="0" x2="0" y2="1"><stop offset=".25" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></linearGradient></defs>
  ${hooded(0, { smile: .85, hands: [[-.2, -.7], [.21, -.72]] })}
  <g transform="translate(.215 -.66) rotate(8)">
    <path d="M-.012 0 L-.004 .2 M.012 0 L.026 .19" stroke="#d6d9e2" stroke-width=".011" stroke-linecap="round"/>
    <circle cx="-.016" cy="-.02" r=".02" fill="none" stroke="#2a2a30" stroke-width=".008"/><circle cx=".018" cy="-.02" r=".02" fill="none" stroke="#2a2a30" stroke-width=".008"/></g>
  <rect x="-.5" y="-2.2" width="1" height="2.2" fill="url(#lgDark)"/>
</svg>`;
// Hand von oben (liegt flach auf der Theke): Finger zeigen zu dir, die Kuppen liegen auf der Schere
const CUST_HAND = (() => {
  // Ärmel unten, Handrücken, vier lange Finger nach oben; die Kuppen liegen auf den Scherengriffen (Plane-Mitte = oben)
  const F = [[-.05, .2], [-.017, .235], [.017, .23], [.05, .19]];
  let s = `<defs><filter id="hsh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".008"/></filter></defs>
    <g filter="url(#hsh)" opacity=".55" transform="translate(.012 .01)"><path d="M-.07 .25 Q-.08 .06 -.06 .0 L-.06 -.2 L.06 -.2 L.07 .0 Q.09 .06 .08 .25 Z" fill="#000"/></g>
    <path d="M-.085 .25 Q-.09 .17 -.07 .12 L.075 .115 Q.095 .17 .09 .25 Z" fill="${HOOD}"/>
    <path d="M-.068 .125 Q-.078 .06 -.064 .01 Q0 -.012 .064 .006 Q.078 .06 .07 .12 Q0 .14 -.068 .125 Z" fill="${CSKIN}"/>
    <path d="M-.068 .125 Q-.078 .06 -.064 .01 Q0 -.012 .064 .006 Q.078 .06 .07 .12 Q0 .14 -.068 .125 Z" fill="url(#shadeR)"/>`;
  for (const [x, L] of F) {
    const y0 = .012, j1 = y0 - L * .4, j2 = y0 - L * .72, tip = y0 - L;
    const d = `M${x} ${y0} Q${x + .003} ${(y0 + j1) / 2} ${x + .002} ${j1} Q${x} ${(j1 + j2) / 2} ${x - .001} ${j2} Q${x - .003} ${(j2 + tip) / 2} ${x - .004} ${tip}`;
    s += `<path d="${d}" stroke="#000" stroke-opacity=".35" stroke-width=".016" stroke-linecap="round" fill="none" transform="translate(.005 .004)"/>
      <path d="${d}" stroke="${CSKIN}" stroke-width=".014" stroke-linecap="round" fill="none"/>
      <path d="M${x - .005} ${j1} h.012 M${x - .006} ${j2} h.011" stroke="#80849a" stroke-width=".0022" stroke-linecap="round"/>
      <path d="M${x - .007} ${tip + .006} q.003 -.006 .006 0" stroke="#5a5648" stroke-width=".003" fill="none"/>`;
  }
  s += `<path d="M.064 .07 Q.1 .04 .108 -.02" stroke="${CSKIN}" stroke-width=".016" stroke-linecap="round" fill="none"/>`;
  return svgLocal(.5, .5, s, 1024);
})();

const CASHIER = [-.6, -2.05], CUST_AT = [-.6, -.88];
const KP = [[3.4, 9.0], [1.15, 3.75], [1.15, 2.5], [-.2, .2], CUST_AT];
function along(pts, u) {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), L = seg.reduce((a, b) => a + b, 0);
  let d = clamp(u) * L;
  for (let i = 0; i < seg.length; i++) { if (d <= seg[i] || i === seg.length - 1) { const k = clamp(d / seg[i]); return lerp2(pts[i], pts[i + 1], k); } d -= seg[i]; }
}
function custPos(t) {
  const en = lastEv('enter', t, null); if (!en) return null;
  const dr = EV('door')[0], ar = EV('arrive')[0];
  if (!dr || t < dr[0]) { const u = clamp((t - en[0]) / Math.max(.5, (dr ? dr[0] : en[0] + 4) - en[0])); return { p: lerp2(KP[0], KP[1], u), moving: u < 1, phase: (t - en[0]) * 8 }; }
  if (!ar || t < ar[0]) { const u = clamp((t - dr[0]) / Math.max(.5, (ar ? ar[0] : dr[0] + 3) - dr[0])); return { p: along(KP.slice(1), ease(u) * .3 + u * .7), moving: true, phase: (t - en[0]) * 8 }; }
  return { p: CUST_AT, moving: false };
}
function kioskState(t, cctv = false) {
  const dr = EV('door')[0];
  let a = 0; if (dr) { const k = t - dr[0]; a = 1.15 * (ease((k + .5) / .5) - ease((k - 1.2) / .8)); }
  R3.doorPivot.rotation.y = a;
  R3.bell.rotation.z = dr && t - dr[0] > -.2 && t - dr[0] < 1.5 ? Math.sin((t - dr[0]) * 30) * .4 * Math.exp(-(t - dr[0]) * 2) : 0;
  R3.water.visible = !!lastEv('water', t, null);
  const sc = lastEv('scissors', t, null), sl = lastEv('slide', t, null);
  R3.scissors.visible = !!sc; R3.scissors.position.z = -1.22 - .1 * (sl ? ease((t - sl[0]) / 1.2) : 0);
  let f2 = 1; for (const [ft] of EV('flick')) { const k = t - ft; if (k >= 0 && k < .7) f2 = Math.sin(k * 55) > .1 ? 1 : .08; }
  R3.setTubes(1, f2);
  const beep = EV('beep').some(b => t >= b[0] && t < b[0] + .15); R3.scanner.material.color.set(beep ? '#ff4a3a' : '#202228');
  const lg = lastEv('lager', t, null);
  R3.lagerFig.visible = !!lg; if (lg) R3.lagerFig.material.color.setScalar((cctv ? 1.0 : .3) * clamp((t - lg[0]) / .25));
  return { lg, f2 };
}
async function kioskChars(t, o = {}) {
  ensurePlane('you', 2, 2); ensurePlane('youClose', .7, .7, 1536); ensurePlane('cust', 2.2, 2.2); ensurePlane('hand', .5, .5, 1024);
  const st = kioskState(t, o.cctv);
  await W3.setPlane('youClose', { visible: false }); await W3.setPlane('hand', { visible: false });
  if (o.you !== false) await W3.setPlane('you', { svg: svgWrap(CASHIER[0], 1.0, 2.0, person(CASHIER[0], { eyes: o.eyes || 'open', t, look: o.look || 0, mouth: o.mouth || '', handL: [CASHIER[0] - .17, -1.02], handR: [CASHIER[0] + .17, -1.02] })), pos: [CASHIER[0], 1.0, CASHIER[1]], color: o.cctv ? '#d8dbe4' : '#e6e9f2', face: true });
  else await W3.setPlane('you', { visible: false });
  const c = custPos(t);
  if (c && o.cust !== false) {
    const at = !c.moving && c.p === CUST_AT, lean = o.lean || 0;
    const hands = at ? [[c.p[0] - .2, -1.04], [c.p[0] + .2, -1.04]] : null;
    await W3.setPlane('cust', { svg: svgWrap(c.p[0], 1.1, 2.2, hooded(c.p[0], { walk: c.moving ? c.phase : null, back: !!o.back, smile: o.smile || 0, lean, hands })), pos: [c.p[0], 1.1 - lean * .1, c.p[1] - lean * .3], color: o.custCol || '#8a8ea0', face: true, shadow: [.6, .32] });
  } else await W3.setPlane('cust', { visible: false });
  return st;
}
async function viewKsExt(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start, p = ease(lt / d);
  W3.setCam([4.6 - .6 * p, 1.9, 11.5 - 1.2 * p], [.3, 1.3, 2.2], 42);
  await kioskChars(t, { custCol: '#4a4e5e', back: true });
  return '';
}
async function viewKsWide(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start;
  W3.setCam([-1.55 + .1 * ease(lt / d), 2.15, 2.7 - .2 * ease(lt / d)], [-.25, 1.05, -1.3], 52);
  await kioskChars(t, { look: .8, back: true });
  return '';
}
async function viewKsCounter(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start;
  W3.setCam([-.36, 1.62, -.78 + .04 * ease(lt / d)], [-.68, 1.02, -1.4], 40);
  await kioskChars(t, { you: false, cust: false });
  const sl = lastEv('slide', t, null), z = -1.22 - .1 * (sl ? ease((t - sl[0]) / 1.2) : 0);
  // Hand liegt OBEN auf den Griffen (Ringe enden bei y≈1.055), Fingerspitzen drücken auf die Ringe – nichts geht durch die Schere
  await W3.setPlane('hand', { svg: CUST_HAND, pos: [-.552, 1.07, z + .168], color: '#9da1b2' });
  _planes.hand.mesh.rotation.set(-Math.PI / 2, 0, 0); _planes.hand.mesh.scale.set(.5, .5, 1);
  return '';
}
async function viewKsOver(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start;
  W3.setCam([-.32, 1.78, .45 - .15 * ease(lt / d)], [-.62, 1.42, -2.2], 46);
  await kioskChars(t, { back: true, custCol: '#6a6e80', eyes: sh.eyes || 'open', look: -.3 });
  return '';
}
async function viewKsCctv(t, sh) {
  W3.setCam([-1.95, 2.55, 2.95], [-.1, .95, -1.95], 60);
  const st = await kioskChars(t, { cust: false, cctv: true, look: .5 });
  let gl = 0; for (const [gt] of EV('glitch')) { const k = t - gt; if (k >= 0 && k < .45) gl = Math.max(gl, Math.sin(k / .45 * Math.PI)); }
  const lines = gl ? `<div style="position:absolute;inset:0;opacity:${.6 * gl};background:repeating-linear-gradient(0deg, rgba(255,255,255,.35) 0 2px, transparent 2px ${3 + Math.floor(Math.random() * 6)}px);transform:translateX(${(Math.random() - .5) * 30 * gl}px)"></div>` : '';
  return `<div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg, rgba(0,0,0,.18) 0 1px, transparent 1px 3px)"></div>${lines}${camOverlay(t, 'CAM 1 · KASSE')}`;
}
async function viewKsFace(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start;
  W3.setCam([-.6, 1.52, -1.38 - .06 * ease(lt / d)], [-.6, 1.48, -2.05], 40);
  await kioskChars(t, { you: false, cust: false });
  await W3.setPlane('youClose', { svg: svgWrap(CASHIER[0], 1.35, .7, person(CASHIER[0], { eyes: 'wide', mouth: 'o', t, look: lt > d * .4 ? 1.35 : .3 })), pos: [CASHIER[0], 1.35, CASHIER[1]], color: '#dfe3ee' });
  return '';
}
async function viewKsLean(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start, lean = ease((lt - .2) / Math.max(1, d * .6));
  W3.setCam([-.6, 1.5, -2.0], [-.6, 1.5, -.85], 46 - 4 * ease(lt / d));
  const sm = lastEv('smile', t, null);
  await kioskChars(t, { you: false, lean, smile: sm ? clamp((t - sm[0]) / .8) : 0, custCol: '#7a7e90' });
  return '';
}
function stickyNote(t, sh) {
  const lt = t - sh.start, p = ease(lt / .45);
  return `<div style="position:absolute;left:50%;top:250px;width:360px;height:360px;transform:translate(-50%, ${(1 - p) * 90}px) rotate(${-5 + 2 * p}deg);opacity:${clamp(lt / .3)};
      background:linear-gradient(170deg,#f2dd7a,#e3c95c);box-shadow:0 30px 70px rgba(0,0,0,.7), inset 0 -18px 30px rgba(120,90,0,.12);padding:46px 34px;color:#1d2a5a;
      font:italic 800 31px/1.28 'Montserrat';letter-spacing:-.3px">
    <div style="position:absolute;top:0;left:0;right:0;height:38px;background:rgba(0,0,0,.05)"></div>
    Sag ihm <span style="color:#c4281c;text-decoration:underline">NIE</span>,<br>wann du Feier&shy;abend hast!<br>
    <span style="font-size:25px">Einfach kassieren.</span>
    <div style="position:absolute;right:34px;bottom:30px;font-size:24px">– Mia</div></div>`;
}
async function viewKsNote(t, sh) {
  await SETBG.kiosk(t);
  return stickyNote(t, sh);
}
Object.assign(VIEWS, { ks_ext: viewKsExt, ks_wide: viewKsWide, ks_counter: viewKsCounter, ks_over: viewKsOver, ks_cctv: viewKsCctv, ks_face: viewKsFace, ks_lean: viewKsLean, ks_note: viewKsNote });
Object.assign(GLSTYLE, { ks_ext: '', ks_wide: '', ks_counter: '', ks_over: '', ks_cctv: 'grayscale(1) contrast(1.3) brightness(1.05)', ks_face: '', ks_lean: '', ks_note: 'blur(9px) brightness(.55)' });
Object.assign(SETBG, { kiosk: async (t) => { await kioskChars(t, { eyes: 'wide', look: .8 }); W3.setCam([-1.55, 2.15, 2.6], [-.25, 1.05, -1.3], 52); } });
Object.assign(SET_ASSETS, { lagerFig: LAGER_FIG });


/* ======================================================================= HOCHSITZ (Wärmebild) */
// Wärmebild „weiß = heiß“: Himmel kalt (schwarz), Bäume mittelgrau, Wesen weiß mit Glühen.
function thermalSvg(t, sh) {
  const mode = sh.mode, lt = t - sh.start, d = sh.end - sh.start;
  const n = (k) => Math.sin(t * 13.1 + k * 7.7) * Math.sin(t * 5.3 + k * 2.1);
  const jitter = `translate(${n(1) * 1.5} ${n(2) * 1.2})`;
  let scene = '';
  const hotFig = (x, y, s, o = {}) => {   // warme Gestalt, aufrecht, zu dünn, zu lange Arme
    const hy = y - 1.75 * s, k = o.look || 0;
    return `<g filter="url(#heat)" opacity="${o.op ?? 1}">
      <ellipse cx="${x}" cy="${hy}" rx="${.13 * s}" ry="${.16 * s}" fill="#fff"/>
      <path d="M${x - .12 * s} ${hy + .22 * s} Q${x} ${hy + .17 * s} ${x + .12 * s} ${hy + .22 * s} L${x + .09 * s} ${y - .9 * s} L${x - .09 * s} ${y - .9 * s} Z" fill="#f2f2f2"/>
      <path d="M${x - .05 * s} ${y - .92 * s} L${x - .07 * s} ${y} M${x + .05 * s} ${y - .92 * s} L${x + .07 * s} ${y}" stroke="#d8d8d8" stroke-width="${.06 * s}" stroke-linecap="round"/>
      <path d="M${x - .12 * s} ${hy + .25 * s} Q${x - .22 * s} ${y - 1.0 * s} ${x - .2 * s} ${y - .45 * s} M${x + .12 * s} ${hy + .25 * s} Q${x + .22 * s} ${y - 1.0 * s} ${x + .2 * s} ${y - .45 * s}" stroke="#e6e6e6" stroke-width="${.05 * s}" fill="none" stroke-linecap="round"/></g>`;
  };
  if (mode === 'edge' || mode === 'uncle') {
    const zoom = mode === 'uncle' ? 1 : 1 + .06 * ease(lt / d);
    let trees = '';
    for (let i = 0; i < 26; i++) { const x = i * 23 - 20 + (i % 3) * 7, h = 150 + (i * 37 % 90); trees += `<path d="M${x} 470 L${x + 12} ${470 - h} L${x + 24} 470 Z" fill="#${i % 2 ? '303030' : '2a2a2a'}"/><rect x="${x + 10}" y="430" width="5" height="45" fill="#3a3a3a"/>`; }
    scene = `<g transform="translate(270 480) scale(${zoom}) translate(-270 -480)">
      <rect width="540" height="960" fill="url(#tsky)"/>${trees}
      <rect y="468" width="540" height="492" fill="url(#tground)"/>`;
    if (mode === 'edge') {
      const fx = 300 - 40 * ease(lt / d);
      scene += hotFig(fx, 478, 62) + `<ellipse cx="${fx}" cy="480" rx="20" ry="3" fill="#000" opacity=".35"/>`;
    } else {   // Onkels Hochsitz am anderen Ende, 300 m: winzig, aber er sitzt drin und ist warm
      const pan = 120 * (1 - ease(lt / Math.min(1.2, d)));
      scene += `<g transform="translate(${pan} 0)"><g stroke="#4a4a4a" stroke-width="2.4"><path d="M262 470 L266 412 M278 470 L274 412"/><path d="M262 470 L278 440 M278 470 L262 440"/></g>
        <rect x="258" y="398" width="24" height="16" fill="#454545"/><path d="M255 398 L285 398 L282 391 L258 391 Z" fill="#3c3c3c"/>
        <g filter="url(#heat)"><circle cx="270" cy="401" r="3.2" fill="#fff"/><rect x="266.5" y="404" width="7" height="8" rx="2" fill="#eee"/></g></g>`;
    }
    scene += '</g>';
  } else {      // Blick von oben die Leiter hinunter auf den Boden
    let grass = ''; for (let i = 0; i < 160; i++) { const x = (i * 97) % 540, y = 380 + (i * 53) % 580; grass += `<path d="M${x} ${y} l${(i % 5) - 2} -9" stroke="#2c2c2c" stroke-width="2"/>`; }
    const rungs = Array.from({ length: 7 }, (_, i) => { const y = 120 + i * 120, w = 70 + i * 18; return `<rect x="${270 - w}" y="${y}" width="${w * 2}" height="${8 + i}" rx="4" fill="#3e3e3e"/>`; }).join('');
    scene = `<rect width="540" height="960" fill="#1e1e1e"/>${grass}
      <path d="M200 0 L120 960 M340 0 L420 960" stroke="#454545" stroke-width="16"/>${rungs}`;
    if (mode === 'below') {   // es steht unten am Fuß der Leiter: dünn, Kopf zu lang, Arme greifen schon nach den Sprossen
      const up = sh.look ? ease((lt - .4) / .8) : 1, hy = 760 - 22 * up;
      scene += `<g filter="url(#heat)">
        <path d="M232 830 Q270 812 308 830 L300 905 L240 905 Z" fill="#e6e6e6"/>
        <g transform="rotate(${-10 - 12 * up} 270 ${hy + 30})"><ellipse cx="270" cy="${hy - 6}" rx="27" ry="${48 + 10 * up}" fill="#fff"/></g>
        <path d="M238 836 Q196 790 176 712 Q166 676 160 646" stroke="#e8e8e8" stroke-width="13" fill="none" stroke-linecap="round"/>
        <path d="M302 838 Q332 880 336 960" stroke="#e8e8e8" stroke-width="12" fill="none" stroke-linecap="round"/>
        <ellipse cx="160" cy="640" rx="11" ry="15" fill="#efefef"/>
        ${[0, 1, 2, 3].map(i => `<path d="M150 ${626 + i * 8} q12 -5 22 1" stroke="#e8e8e8" stroke-width="4.5" fill="none" stroke-linecap="round"/>`).join('')}</g>`;
    } else if (mode === 'gone') {   // weg vom Wärmebild – nur ein KALTER Umriss, dunkler als der Boden
      scene += `<g opacity="${.55 * clamp((lt - .2) / .8)}" filter="url(#soft)"><ellipse cx="270" cy="815" rx="70" ry="58" fill="#0a0a0a"/><ellipse cx="270" cy="718" rx="54" ry="60" fill="#080808"/></g>`;
    }
  }
  const temp = mode === 'edge' || mode === 'below' ? '36,8' : mode === 'uncle' ? '35,9' : '−2,1';
  const zoomTxt = mode === 'uncle' ? '8.0x' : mode === 'edge' ? '4.0x' : '1.0x';
  return `<svg viewBox="0 0 540 960" width="540" height="960" style="position:absolute;inset:0">
    <defs><linearGradient id="tsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050505"/><stop offset="1" stop-color="#121212"/></linearGradient>
      <linearGradient id="tground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#262626"/><stop offset="1" stop-color="#1a1a1a"/></linearGradient>
      <filter id="heat" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feGaussianBlur in="SourceGraphic" stdDeviation="9" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="b"/></feMerge></filter>
      <filter id="soft"><feGaussianBlur stdDeviation="10"/></filter>
      <radialGradient id="tvig" cx="50%" cy="50%" r="70%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient></defs>
    <g transform="${jitter}">${scene}</g>
    <rect width="540" height="960" fill="url(#tvig)"/>
    ${Array.from({ length: 120 }, (_, i) => `<rect y="${i * 8}" width="540" height="1.2" fill="#000" opacity=".22"/>`).join('')}
    <g stroke="#f2f2f2" stroke-width="2" opacity=".85" fill="none"><path d="M270 440 v-40 M270 520 v40 M230 480 h-40 M310 480 h40"/><circle cx="270" cy="480" r="4"/></g>
    <g font-family="JetBrains Mono" font-weight="700" fill="#f2f2f2" font-size="15">
      <text x="34" y="120">WÄRMEBILD</text><text x="506" y="120" text-anchor="end">${zoomTxt}</text>
      <text x="34" y="146" font-size="12" font-weight="500" opacity=".75">WEISS-HEISS</text>
      <text x="34" y="850">${temp} °C</text><text x="506" y="850" text-anchor="end">▮▮▯</text></g>
  </svg>`;
}
async function viewHsThermal(t, sh) {
  await SETBG.hochsitz(t);
  return `<div style="position:absolute;inset:0;background:#000"></div>` + thermalSvg(t, sh);
}
const HS_YOU = [0, 3.62, -.42];
function hsYou(st) {   // sitzend in der Kanzel, mit Funkgerät; lokale Koordinaten
  const radio = st.radio ? `<rect x=".03" y="-.24" width=".05" height=".1" rx=".01" fill="#15161a"/><path d="M.07 -.24 l.008 -.07" stroke="#15161a" stroke-width=".01" stroke-linecap="round"/>
    <rect x=".037" y="-.225" width=".035" height=".03" fill="${st.radioLit ? '#ffb347' : '#2a2a22'}"/>` : '';
  const hR = st.radio ? [.06, -.14] : [.08, .3];
  return `<path d="M-.12 -.12 Q0 -.17 .12 -.12 L.13 .42 L-.13 .42 Z" fill="${SHIRT}"/><path d="M-.12 -.12 Q0 -.17 .12 -.12 L.13 .42 L-.13 .42 Z" fill="url(#shadeR)"/>
` +
    arm([-.1, -.08], [-.08, .3], 1) + arm([.1, -.08], hR, -1) + radio +
    head([0, -.27], .12, { eyes: st.eyes, t: st.t, look: st.look, mouth: st.mouth, lit: st.lit }) +
    `<path d="M-.118 -.33 Q-.11 -.41 0 -.405 Q.11 -.41 .118 -.33 Z" fill="#3b4a2f"/><rect x="-.124" y="-.345" width=".248" height=".03" rx=".012" fill="#2f3b26"/><circle cx="0" cy="-.41" r=".018" fill="#2f3b26"/>`;
}
async function hsChars(t, o = {}) {
  ensurePlane('you', 1.2, 1.2); ensurePlane('youClose', .6, .6, 1536); ensurePlane('rungHand', .5, .3, 1024);
  await W3.setPlane('youClose', { visible: false });
  const q = (TL.quotes || []).find(q => t >= q.start && t < q.end);
  const talk = lastEv('talk', t, null), talking = talk && t < talk[1];
  if (o.you !== false) await W3.setPlane('you', { svg: svgLocal(1.2, 1.2, hsYou({ eyes: o.eyes || 'open', t, look: o.look || 0, mouth: o.mouth || (talking && Math.sin(t * 14) > 0 ? 'o' : ''), radio: true, radioLit: !!q || talking })), pos: HS_YOU, rotY: 0, color: '#9aa4c8' });
  else await W3.setPlane('you', { visible: false });
  // Finger an der Sprosse (erst nach „grip“): greifen von unten über die Sprosse, Kuppen auf deiner Seite
  const gp = lastEv('grip', t, null);
  if (gp && o.hand !== false) {
    const k = R3.rungs.length - 3, along = R3.rungs[k], a = R3.ladder.rotation.x;
    const y = along * Math.cos(a), z = 2.2 + along * Math.sin(a);
    // zwei Hände, je vier lange Finger, die sich über die Sprosse krümmen (Knöchel oben, Kuppe vorne unten)
    let body = '';
    for (const hx of [-.13, .12]) {
      body += `<path d="M${hx - .04} .085 Q${hx} .1 ${hx + .04} .085 L${hx + .034} .03 L${hx - .034} .03 Z" fill="#8f93a4" opacity=".7"/>`;
      [-.027, -.009, .009, .027].forEach((dx, i) => {
        const x = hx + dx, L = i === 1 || i === 2 ? .012 : 0;
        const d = `M${x} .035 Q${x + .002} ${-.03 - L} ${x + .001} ${-.034 - L} Q${x} ${-.02 - L} ${x - .001} ${.004}`;
        body += `<path d="${d}" stroke="#000" stroke-opacity=".5" stroke-width=".014" stroke-linecap="round" fill="none" transform="translate(.003 .004)"/>
          <path d="${d}" stroke="#b9bdcc" stroke-width=".012" stroke-linecap="round" fill="none"/>
          <ellipse cx="${x + .001}" cy="${-.028 - L}" rx=".007" ry=".005" fill="#d0d3de"/>
          <path d="M${x - .005} ${-.012 - L * .5} h.009" stroke="#6f7386" stroke-width=".0022"/>
          <ellipse cx="${x - .001}" cy="${.002}" rx=".0045" ry=".004" fill="#3e3a30"/>`;
      });
    }
    body = svgLocal(.5, .3, body, 1024);
    await W3.setPlane('rungHand', { svg: body, pos: [0, y + .012, z + .03], color: '#c8ccd8' });
    _planes.rungHand.mesh.rotation.set(a - .35, 0, 0);
    _planes.rungHand.mesh.material.opacity = clamp((t - gp[0]) / .4); _planes.rungHand.mesh.material.transparent = true;
  } else await W3.setPlane('rungHand', { visible: false });
}
async function viewHsExt(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start, p = ease(lt / d);
  W3.setCam([4.2 - .8 * p, 2.0 + .3 * p, 8.5 - 1.2 * p], [0, 3.1, 0], 46);
  await hsChars(t, { look: .4 });
  return '';
}
async function viewHsIn(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start;
  W3.setCam([.25, 3.95, .95 - .15 * ease(lt / d)], [0, 3.6, -.42], 48);
  await hsChars(t, { eyes: sh.eyes || 'open', look: sh.look || 0 });
  return '';
}
async function viewHsFace(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start;
  W3.setCam([0, 3.38, .36 - .06 * ease(lt / d)], [0, 3.36, -.42], 40);
  await hsChars(t, { you: false, hand: false });
  const q = (TL.quotes || []).find(q => t >= q.start && t < q.end);
  await W3.setPlane('youClose', { svg: svgLocal(.6, .6, `<g transform="translate(0 .27)">${hsYou({ eyes: 'wide', mouth: 'o', t, look: lt > d * .5 ? (sh.lookDir || 1) * 1.3 : 0, radio: true, radioLit: !!q })}</g>`), pos: [0, 3.35, -.42], rotY: 0, color: '#9aa4c8' });
  return '';
}
async function viewHsLadder(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start;
  W3.setCam([.08, 3.95, 1.02], [0, 1.6 - .4 * ease(lt / d), 2.05], 46 - 6 * ease(lt / d));
  await hsChars(t, { you: false });
  return '';
}
Object.assign(VIEWS, { hs_thermal: viewHsThermal, hs_ext: viewHsExt, hs_in: viewHsIn, hs_face: viewHsFace, hs_ladder: viewHsLadder });
Object.assign(GLSTYLE, { hs_thermal: 'none', hs_ext: '', hs_in: '', hs_face: '', hs_ladder: '' });
Object.assign(SETBG, { hochsitz: async (t) => { await hsChars(t, { eyes: 'wide', look: .6 }); W3.setCam([.25, 3.95, .9], [0, 3.6, -.42], 48); } });


/* ======================================================================= WASCHSALON (Maschine 7) */
const DRUM_HAND = (() => {
  const F = [[-.13, -.06, -.28, -.36], [-.05, -.09, -.08, -.46], [.04, -.09, .08, -.45], [.12, -.06, .22, -.36]];
  let f = '';
  for (const [x0, y0, x1, y1] of F) {
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, j1 = [x0 + (x1 - x0) * .38, y0 + (y1 - y0) * .38], j2 = [x0 + (x1 - x0) * .7, y0 + (y1 - y0) * .7];
    const nx = -(y1 - y0), ny = x1 - x0, L = Math.hypot(nx, ny), ux = nx / L, uy = ny / L, w0 = .03, w1 = .016;
    f += `<path d="M${x0 + ux * w0} ${y0 + uy * w0} L${x1 + ux * w1} ${y1 + uy * w1} Q${x1 + (x1 - x0) * .08} ${y1 + (y1 - y0) * .08} ${x1 - ux * w1} ${y1 - uy * w1} L${x0 - ux * w0} ${y0 - uy * w0} Z" fill="#b9bdcb"/>
      <ellipse cx="${j1[0]}" cy="${j1[1]}" rx=".026" ry=".02" fill="#cdd0dc"/><ellipse cx="${j2[0]}" cy="${j2[1]}" rx=".02" ry=".016" fill="#cdd0dc"/>
      <path d="M${j1[0] - .015} ${j1[1]} h.03 M${j2[0] - .012} ${j2[1]} h.024" stroke="#80849a" stroke-width=".005"/>
      <ellipse cx="${x1}" cy="${y1}" rx=".018" ry=".02" fill="#e2e4ec"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="-.5 -.5 1 1">
  <path d="M-.17 .5 Q-.2 .25 -.15 .1 L.15 .08 Q.21 .25 .18 .5 Z" fill="#8a8ea0"/>
  <path d="M-.16 .14 Q-.19 -.02 -.14 -.08 Q0 -.12 .15 -.08 Q.2 0 .17 .14 Q0 .2 -.16 .14 Z" fill="#b3b7c6"/>
  <ellipse cx="0" cy=".02" rx=".09" ry=".07" fill="#d8dbe4" opacity=".6"/>${f}
  <path d="M.16 .06 Q.26 .02 .31 -.1" stroke="#b3b7c6" stroke-width=".05" stroke-linecap="round" fill="none"/></svg>`;
})();
function drawDrum(W, t, kind, extra = {}) {
  const { g, c, t: tex } = W.drum, S = c.width, cx = S / 2, a = t * (kind === 'off' ? 0 : 5.5);
  const gr = g.createRadialGradient(cx, cx, 10, cx, cx, cx); gr.addColorStop(0, '#5a5f6b'); gr.addColorStop(1, '#16181d');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  g.fillStyle = 'rgba(0,0,0,.45)';
  for (let r = 30; r < cx; r += 26) for (let k = 0; k < r / 6; k++) { const ang = k / (r / 6) * Math.PI * 2 + a * .3; g.beginPath(); g.arc(cx + Math.cos(ang) * r, cx + Math.sin(ang) * r, 3, 0, 7); g.fill(); }
  if (kind === 'clothes') {
    for (let k = 0; k < 7; k++) { const ang = a + k * .9, r = 50 + (k % 3) * 18; g.fillStyle = ['#7c3347', '#3b5f8f', '#d8d8d0', '#5a6b3a', '#8f6a3b', '#2c2c34', '#b0485a'][k]; g.beginPath(); g.ellipse(cx + Math.cos(ang) * r, cx + 40 + Math.sin(ang) * r * .6, 34, 22, ang, 0, 7); g.fill(); }
  }
  if (kind === 'foam') {
    g.fillStyle = 'rgba(28,38,50,.9)'; g.beginPath(); g.ellipse(cx, cx + 40 + 6 * Math.sin(t * 3), cx, 110, Math.sin(t * 2) * .15, 0, 7); g.fill();
    if (extra.shape) {   // dunkler Umriss hinter dem Schaum, als würde jemand in der Trommel kauern
      g.fillStyle = `rgba(10,12,16,${.55 * extra.shape})`; g.beginPath(); g.ellipse(cx - 10, cx - 20, 60, 72, -.2, 0, 7); g.fill();
    }
    for (let k = 0; k < 45; k++) {
      const ang = a * (.6 + (k % 5) * .1) + k * 1.7, r = 40 + (k * 37 % 80);
      const x = cx + Math.cos(ang) * r, y = cx + 30 + Math.sin(ang) * r * .7, s = 6 + (k * 13 % 14);
      g.fillStyle = `rgba(200,208,220,${.3 + (k % 4) * .08})`; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill();
    }
  }
  const vg = g.createRadialGradient(cx, cx, cx * .6, cx, cx, cx); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.7)'); g.fillStyle = vg; g.fillRect(0, 0, S, S);
  tex.needsUpdate = true;
}
function drawPanel(W, txt, col, lock) {
  const { g, c, t } = W.panel; g.fillStyle = '#1a1c22'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#07080a'; g.fillRect(70, 10, 130, 44);
  g.font = 'bold 34px "JetBrains Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col; g.shadowColor = col; g.shadowBlur = txt === '' ? 0 : 10; g.fillText(txt, 135, 34); g.shadowBlur = 0;
  if (lock) { g.strokeStyle = lock; g.fillStyle = lock; g.lineWidth = 4; g.strokeRect(219, 30, 22, 18); g.beginPath(); g.arc(230, 30, 8, Math.PI, 0); g.stroke(); }
  t.needsUpdate = true;
}
function laundryState(t, flash = false) {
  const W = R3.washers; if (!W) return {};
  drawDrum(W[2], t, 'clothes');
  // flash = Vorgriff im Cold Open: Maschine läuft schon, Hand ist schon da
  const on = flash ? [t - 20] : lastEv('m7on', t, null), hand = flash ? [-5] : lastEv('hand', t, null), unl = flash ? null : lastEv('unlock', t, null);
  drawDrum(W[6], t, on ? 'foam' : 'off', { shape: hand ? clamp((t - hand[0]) / 1.5) : 0 });
  drawPanel(W[2], '0:31', '#5dff8f', null);
  if (!on) drawPanel(W[6], '', '#333', null);
  else {
    const v = Math.max(0, 44 - Math.floor(t - on[0])), blink = (t * 2 % 1) < .6;
    drawPanel(W[6], `0:${String(v).padStart(2, '0')}`, unl ? '#ff3b30' : '#ff8a2a', unl ? (blink ? '#5dff8f' : '#1a1c22') : '#ff3b30');
  }
  let kn = 0; for (const k of TL.knocks) { const d = t - k; if (d >= 0 && d < .2) kn = Math.max(kn, Math.sin(d / .2 * Math.PI)); }
  const vib = on ? .0025 * Math.sin(t * 90) : 0;
  W[6].ring.position.x = W[6].x + vib + kn * .004; W[6].dm.position.x = W[6].x + vib;
  R3.hand7.material.opacity = hand ? clamp((t - hand[0]) / .35) * (.8 + .2 * kn) : 0; R3.hand7.material.color.set('#7d8294'); W[6].dm.material.color.set('#8a8f9c');
  R3.hand7.position.z = -2.369 + kn * .003; R3.hand7.position.y = .44 - (hand ? .01 * Math.sin(t * 1.3) : 0);
  let f = 1; for (const [ft] of EV('flick')) { const d = t - ft; if (d >= 0 && d < .7) f = Math.sin(d * 55) > .1 ? 1 : .08; }
  R3.tubes[1].l.intensity = 2.6 * f; R3.tubes[1].m.material.color.set(f > .5 ? '#e8eeff' : '#2a2c33');
  return { on, hand, unl };
}
const WS_YOU = [-.25, .87, -.2];
function seatedLegs() {   // lokale Koordinaten einer 1.6-m-Ebene mit Mitte auf 0.8 m: Sitz = .35, Boden = .8
  return [-1, 1].map(k => `<path d="M${k * .06} .33 L${k * .085} .43" stroke="#2a2c35" stroke-width=".07" stroke-linecap="round"/>
      <path d="M${k * .085} .43 L${k * .09} .76" stroke="#2a2c35" stroke-width=".055" stroke-linecap="round"/>
      <path d="M${k * .085} .43 L${k * .09} .76" stroke="url(#shadeR)" stroke-width=".055" stroke-linecap="round"/>
      <ellipse cx="${k * .1}" cy=".785" rx=".05" ry=".022" fill="#111216"/>`).join('');
}
async function wsChars(t, o = {}) {
  ensurePlane('you', 1.6, 1.6); ensurePlane('youClose', .6, .6, 1536);
  const st = laundryState(t, !!o.flash);
  await W3.setPlane('youClose', { visible: false });
  // Sitzend auf der Bank, MIT Beinen: Oberschenkel nach vorn, Unterschenkel zum Boden, Schuhe auf den Fliesen
  if (o.you !== false) await W3.setPlane('you', { svg: svgLocal(1.6, 1.6, seatedLegs() + `<g transform="translate(0 -.07)">${sitter({ shirt: SHIRT, eyes: o.eyes || 'open', t, look: o.look || 0, mouth: o.mouth || '' })}</g>`), pos: [WS_YOU[0], .8, WS_YOU[2]], face: true, color: '#e2e6f0', shadow: [.5, .25], floorY: 0 });
  else await W3.setPlane('you', { visible: false });
  return st;
}
async function viewWsPorthole(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start, x = R3.washers[6].x;
  W3.setCam([x + .02, .47, -1.72 + .12 * ease(lt / d)], [x, .45, -2.39], 38);
  await wsChars(t, { you: false, flash: !!sh.flash });
  return '';
}
async function viewWsWide(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start;
  W3.setCam([-2.0 + .2 * ease(lt / d), 1.85, 2.0 - .3 * ease(lt / d)], [.25, .7, -2.0], 50);
  await wsChars(t, { look: sh.look ?? .6, eyes: sh.eyes });
  return '';
}
async function viewWsRow(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start;
  W3.setCam([2.25, .85, -1.55 - .1 * ease(lt / d)], [-1.6, .55, -2.45], 48);
  await wsChars(t);
  return '';
}
async function viewWsDisplay(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start, x = R3.washers[6].x;
  W3.setCam([x + .03, .85, -1.72 + .05 * ease(lt / d)], [x + .03, .77, -2.378], 34);
  await wsChars(t, { you: false });
  return '';
}
async function viewWsFace(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start;
  W3.setCam([WS_YOU[0] + .03, 1.08, -.78 + .05 * ease(lt / d)], [WS_YOU[0], 1.06, -.2], 40);
  await wsChars(t, { you: false });
  await W3.setPlane('youClose', { svg: svgLocal(.6, .6, `<g transform="translate(0 .27)">${sitter({ shirt: SHIRT, eyes: 'wide', mouth: 'o', t, look: lt > d * .5 ? (sh.lookDir || -1) * 1.2 : 0 })}</g>`), pos: [WS_YOU[0], 1.06, -.2], face: true, color: '#e2e6f0' });
  return '';
}
function signHtml(t, sh) {
  const lt = t - sh.start, p = ease(lt / .4), z = sh.zoom ? 1 + 1.3 * ease((lt - .3) / 1.2) : 1;
  return `<div style="position:absolute;left:50%;top:210px;width:380px;height:500px;transform:translate(-50%, ${(1 - p) * 80}px) rotate(-2deg) scale(${z});transform-origin:50% 92%;opacity:${clamp(lt / .25)};
      background:#f3f1ea;box-shadow:0 30px 70px rgba(0,0,0,.7);border-radius:4px;overflow:hidden;text-align:center;font-family:'Montserrat'">
    <div style="background:#d42a1f;color:#fff;font:900 30px 'Montserrat';letter-spacing:1px;padding:20px 0">AUSSER BETRIEB</div>
    <div style="font:900 22px 'Montserrat';color:#222;margin-top:34px;letter-spacing:.5px">MASCHINE 7</div>
    <div style="font:900 46px/1.05 'Montserrat';color:#d42a1f;margin-top:16px">NICHT<br>ÖFFNEN!</div>
    <div style="font:700 17px/1.35 'Montserrat';color:#444;margin-top:24px;padding:0 30px">Auch wenn sie läuft.<br>Egal, was du hörst.</div>
    <div style="position:absolute;left:0;right:0;bottom:26px;font:italic 700 12px 'Montserrat';color:${sh.zoom ? '#b0201a' : '#888'}">Er klingt wie ein Kind.</div></div>`;
}
async function viewWsSign(t, sh) { await SETBG.laundromat(t); return signHtml(t, sh); }
Object.assign(VIEWS, { ws_porthole: viewWsPorthole, ws_wide: viewWsWide, ws_row: viewWsRow, ws_display: viewWsDisplay, ws_face: viewWsFace, ws_sign: viewWsSign });
Object.assign(GLSTYLE, { ws_porthole: '', ws_wide: '', ws_row: '', ws_display: '', ws_face: '', ws_sign: 'blur(9px) brightness(.5)' });
Object.assign(SETBG, { laundromat: async (t) => { await wsChars(t, { eyes: 'wide', look: .6 }); W3.setCam([-1.8, 1.85, 1.7], [.25, .7, -2.0], 50); } });
Object.assign(SET_ASSETS, { drumHand: DRUM_HAND });


/* ======================================================================= BAD (Spiegeltest) */
const BT_YOU = [.05, .58];
function personBack(x) {   // von hinten: kein Gesicht, weinrotes Shirt, Arme zum Waschbecken
  return `<path d="M${x - .06} -.9 L${x - .065} -.02 M${x + .06} -.9 L${x + .065} -.02" stroke="#2a2c35" stroke-width=".05" stroke-linecap="round"/>
    <path d="M${x - .105} -1.43 Q${x} -1.47 ${x + .105} -1.43 L${x + .1} -.88 L${x - .1} -.88 Z" fill="${SHIRT}"/><path d="M${x - .105} -1.43 Q${x} -1.47 ${x + .105} -1.43 L${x + .1} -.88 L${x - .1} -.88 Z" fill="url(#shadeR)"/>
    ${arm([x - .09, -1.39], [x - .17, -.98], 1)}${arm([x + .09, -1.39], [x + .17, -.98], -1)}
    <circle cx="${x}" cy="-1.55" r=".13" fill="url(#headG)"/><circle cx="${x}" cy="-1.55" r=".13" fill="url(#shadeR)"/>`;
}
// Gesicht hinter dem Glas: ganz nah, halb im Schatten, leere schwarze Augen, Fingerkuppen platt am Glas
function glassFace(mouth = 0) {
  const m = clamp(mouth);
  return svgLocal(.5, .5, `<defs>
      <linearGradient id="gfL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="1"/><stop offset=".5" stop-color="#000" stop-opacity=".9"/><stop offset=".72" stop-color="#000" stop-opacity=".2"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
      <radialGradient id="gfS" cx="62%" cy="40%" r="65%"><stop offset="0" stop-color="#cfcdc4"/><stop offset=".7" stop-color="#9a988f"/><stop offset="1" stop-color="#5c5b56"/></radialGradient></defs>
    <g transform="rotate(-9)">
      <ellipse cx="0" cy="0" rx=".12" ry=".2" fill="url(#gfS)"/>
      <ellipse cx="-.045" cy="-.02" rx=".026" ry=".05" fill="#020203"/><ellipse cx=".048" cy="-.025" rx=".026" ry=".05" fill="#020203"/>
      <ellipse cx="0" cy=".115" rx="${.038 + .006 * m}" ry="${.003 + .024 * m}" fill="#120e0d"/>
      <ellipse cx="0" cy="0" rx=".12" ry=".2" fill="url(#gfL)"/></g>
    ${[0, 1, 2, 3].map(i => `<ellipse cx="${.17 + i * .012}" cy="${-.09 + i * .033}" rx=".011" ry=".015" fill="#b5b3aa" opacity=".8"/>`).join('')}`, 1536);
}
function bathState(t, flash = false) {
  let L = flash ? 0 : lastEv('light', t, [0, 1])[1];
  for (const [ft] of EV('flick')) { const d = t - ft; if (!flash && d >= 0 && d < .45) L = Math.sin(d * 60) > 0 ? 1 : 0; }
  R3.setLight(L);
  const sw = lastEv('light', t, [0, 1]); R3.switchRocker.rotation.z = sw[1] ? .25 : -.25;
  const hd = EV('handle').some(h => t >= h[0] && t < h[0] + 1.2); R3.doorHandle.rotation.z = hd ? -.45 * Math.sin(clamp((t - EV('handle').find(h => t >= h[0])[0]) / 1.2) * Math.PI) : 0;
  const tk = lastEv('talk', t, null), talking = tk && t < tk[1];
  return { L, talking };
}
async function btChars(t, o = {}) {
  for (const [n, w, h, px] of [['back', 2, 2], ['reflYou', 2, 2], ['face', .5, .5, 1536], ['finger', .5, .3, 1024], ['fingerR', .5, .3, 1024], ['swHand', .5, .5, 1024], ['youClose', .6, .6, 1536]]) ensurePlane(n, w, h, px);
  const st = bathState(t, !!o.flash), x = BT_YOU[0];
  await W3.setPlane('youClose', { visible: false }); await W3.setPlane('swHand', { visible: false });
  if (!o.finger) { await W3.setPlane('finger', { visible: false }); await W3.setPlane('fingerR', { visible: false }); }
  const col = st.L > .5 ? '#e6e8f0' : '#3a3c48';
  if (o.back) await W3.setPlane('back', { svg: svgWrap(x, 1.0, 2.0, personBack(x)), pos: [x, 1.0, BT_YOU[1]], color: col, rotY: 0 }); else await W3.setPlane('back', { visible: false });
  // Spiegelbild (nur bei Licht): von vorne, seitenverkehrt
  if (st.L > .5 && o.refl !== false) await W3.setPlane('reflYou', { svg: svgWrap(x, 1.0, 2.0, `<g transform="translate(${2 * x} 0) scale(-1 1)">${person(x, { eyes: o.eyes || 'open', t, look: o.look || 0, mouth: o.mouth || '', handL: o.touch ? [2 * x - o.touch[0], -o.touch[1]] : [x - .17, -.98], handR: [x + .17, -.98] })}</g>`), pos: [x, 1.0, -BT_YOU[1]], color: '#dfe2ea', rotY: 0 });
  else await W3.setPlane('reflYou', { visible: false });
  // Gesicht hinter dem Glas (nur im Dunkeln sichtbar)
  if (st.L <= .5 && o.face !== false) {
    const mouth = st.talking ? Math.abs(Math.sin(t * 9)) * (Math.sin(t * 2.3) > -.3 ? 1 : .2) : 0;
    await W3.setPlane('face', { svg: glassFace(mouth), pos: [x - .02, 1.56, -.07], color: o.flash ? '#8a877f' : '#75726a', rotY: 0 });
  } else await W3.setPlane('face', { visible: false });
  return st;
}
async function viewBtOver(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start;
  W3.setCam([.55 - .1 * ease(lt / d), 1.72, 1.75 - .2 * ease(lt / d)], [-.05, 1.42, -.4], 46);
  await btChars(t, { back: true });
  return '';
}
async function viewBtGlass(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start;
  W3.setCam([.04 + .004 * Math.sin(t * 1.7), 1.56, (sh.wide ? 1.15 : .95) - .15 * ease(lt / d)], [0, 1.54, -.2], sh.wide ? 50 : 40);
  await btChars(t, { flash: !!sh.flash, eyes: 'wide' });
  return '';
}
async function viewBtFinger(t, sh) {
  // frontal: deine Hand von hinten, im Spiegel die Handinnenseite – die Fingerspitzen treffen sich ohne Lücke
  const lt = t - sh.start, d = sh.end - sh.start, X = BT_YOU[0] + .17, Y = 1.32;
  W3.setCam([X - .05, Y + .2, .95 - .08 * ease(lt / d)], [X - .05, Y + .08, 0], 36);
  const tp = W3.toPlane([X, Y, -.02], -BT_YOU[1]);   // Berührungspunkt, auf die Ebene des Spiegelbilds projiziert
  const st = await btChars(t, { finger: true, touch: tp });
  const p = ease((lt - .15) / .8), gap = .06 * (1 - p);   // Abstand der Spitze zum Glas
  const back = svgLocal(.5, .3, `<path d="M.07 .15 Q.1 .08 .12 .05 L.21 .09 Q.19 .14 .17 .15 Z" fill="${SHIRT}"/>
      <path d="M.03 .03 Q.09 -.0 .14 .04 Q.15 .09 .11 .11 Q.05 .12 .02 .09 Q.0 .06 .03 .03 Z" fill="${SKIN}"/><path d="M.03 .03 Q.09 -.0 .14 .04 Q.15 .09 .11 .11 Q.05 .12 .02 .09 Q.0 .06 .03 .03 Z" fill="url(#shadeR)"/>
      <path d="M.035 .035 L.0 .0" stroke="${SKIN}" stroke-width=".022" stroke-linecap="round"/>
      ${[0, 1, 2].map(i => `<path d="M${.06 + i * .022} ${.05 + i * .004} q-.01 .03 .004 .045" stroke="#c9d0ef" stroke-width=".004" fill="none"/>`).join('')}`, 1024);
  const palm = svgLocal(.5, .3, `<path d="M.03 .03 Q.09 -.0 .14 .04 Q.15 .09 .11 .11 Q.05 .12 .02 .09 Q.0 .06 .03 .03 Z" fill="#d4d9ef"/>
      <path d="M.035 .035 L.0 .0" stroke="#d4d9ef" stroke-width=".022" stroke-linecap="round"/><ellipse cx=".004" cy=".004" rx=".009" ry=".008" fill="#e8ebf7"/>
      ${[0, 1, 2].map(i => `<path d="M${.06 + i * .022} ${.06} q.0 .02 .01 .03" stroke="#b3bad6" stroke-width=".004" fill="none"/>`).join('')}`, 1024);
  await W3.setPlane('finger', { svg: back, pos: [X, Y, .004 + gap + .02], rotY: 0, color: '#e6e8f0' });
  if (st.L > .5) await W3.setPlane('fingerR', { svg: palm, pos: [X, Y, -(.004 + gap + .02)], rotY: 0, color: '#bfc3cf' });
  else await W3.setPlane('fingerR', { visible: false });
  return '';
}
async function viewBtSwitch(t, sh) {
  const lt = t - sh.start;
  W3.setCam([.72, 1.25, 1.78], [1.185, 1.1, 2.15], 36);
  await btChars(t, {});
  let p = 0; for (const e of EV('light')) { const a = t - e[0]; if (a > -.6 && a < .5) p = Math.max(p, a < 0 ? 1 + a / .6 : a < .22 ? 1 : 1 - (a - .22) / .28); }
  if (p > 0) {
    const tip = [.06 + .1 * ease(p), .055];
    const body = `<path d="M-.3 -.32 Q-.1 -.1 .0 -.02" stroke="${SHIRT}" stroke-width=".06" fill="none" stroke-linecap="round"/><path d="M-.12 -.14 Q-.05 -.06 .0 -.02" stroke="${SKIN}" stroke-width=".05" fill="none" stroke-linecap="round"/>
      <circle cx=".0" cy="-.02" r=".035" fill="${SKIN}"/><path d="M.01 -.04 L${tip[0]} ${-tip[1]}" stroke="${SKIN}" stroke-width=".02" stroke-linecap="round"/>`;
    await W3.setPlane('swHand', { svg: svgLocal(.5, .5, body, 1024), pos: [1.14, 1.06, 1.93], rotY: -Math.PI / 2, color: '#d0d4e0' });
  }
  return '';
}
async function viewBtDoor(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start;
  W3.setCam([.1, 1.35, .7 + .1 * ease(lt / d)], [.45, .55, 2.6], 48);
  await btChars(t, {});
  return '';
}
async function viewBtFace(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start, x = BT_YOU[0];
  W3.setCam([x, 1.57, .12 + .04 * ease(lt / d)], [x, 1.54, .58], 40);
  const st = await btChars(t, { face: false });
  await W3.setPlane('youClose', { svg: svgWrap(x, 1.35, .7, person(x, { eyes: 'wide', mouth: 'o', t, look: lt > d * .5 ? (sh.lookDir || 1) * 1.3 : 0 })), pos: [x, 1.35, BT_YOU[1]], color: st.L > .5 ? '#e6e8f0' : '#4e4b48', rotY: Math.PI });
  return '';
}
function guestbook(t, sh) {
  const lt = t - sh.start, p = ease(lt / .4), z = sh.page === 2 ? 1 + .45 * ease((lt - .2) / 1.0) : 1;
  const ln = (txt, c = '#1f2f6e', o = 1, mt = 0) => `<div style="font:italic 700 19px/34px 'Montserrat';color:${c};opacity:${o};margin-top:${mt}px">${txt}</div>`;
  return `<div style="position:absolute;left:50%;top:200px;width:400px;height:540px;transform:translate(-50%, ${(1 - p) * 70}px) rotate(1.5deg) scale(${z});transform-origin:50% 72%;opacity:${clamp(lt / .25)};
      background:repeating-linear-gradient(#f2ede0 0 33px, #c9d3e6 33px 34px);box-shadow:0 30px 70px rgba(0,0,0,.75);border-radius:3px;overflow:hidden;padding:0 26px 0 46px">
    <div style="position:absolute;left:30px;top:0;bottom:0;width:2px;background:#e0a0a0"></div>
    <div style="font:900 13px/34px 'Montserrat';letter-spacing:2px;color:#8a7a5a;margin-top:0">GÄSTEBUCH</div>
    ${ln('Schöne Wohnung, sehr ruhig! – Familie K.', '#555', .55)}
    ${ln('8. November:', '#1f2f6e', 1, 34)}
    ${ln('Macht den Spiegeltest im Bad!!')}
    ${ln('Finger ans Glas. Keine Lücke = kein Spiegel.')}
    ${ln('Mach das Licht aus. Dann sieht er dich nicht.', '#8a1c1c', sh.page === 2 ? 1 : 0, 34)}
    ${ln('Aber du siehst ihn.', '#8a1c1c', sh.page === 2 ? 1 : 0)}</div>`;
}
async function viewBtBook(t, sh) { await SETBG.bathroom(t); return guestbook(t, sh); }
Object.assign(VIEWS, { bt_over: viewBtOver, bt_glass: viewBtGlass, bt_finger: viewBtFinger, bt_switch: viewBtSwitch, bt_door: viewBtDoor, bt_face: viewBtFace, bt_book: viewBtBook });
Object.assign(GLSTYLE, { bt_over: '', bt_glass: '', bt_finger: '', bt_switch: '', bt_door: '', bt_face: '', bt_book: 'blur(9px) brightness(.45)' });
Object.assign(SETBG, { bathroom: async (t) => { await btChars(t, { back: true }); W3.setCam([.5, 1.72, 1.7], [-.05, 1.42, -.4], 46); } });
