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
  await W3.setPlane('you', { svg: svgWrap(0, 1.0, 2.0, standing(0, { eyes: 'open', t, look: sh.look || 0 }), 1536), pos: [0, 1.0, .35], color: L > .05 ? '#ece8df' : '#101012' });
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
  const rv = lastEv('reveal', t, null), vis = rv ? (.04 + 1.1 * Math.min(1, f + (t - rv[0] < 1.2 ? .35 : 0))) : 0;
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
