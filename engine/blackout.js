// BLACKOUT: detaillierte 2D-Porträts, Overlays (Kapsel, ECHT-Fakten, Regel-Karten, Grafiken) und Kamera-Einstellungen.
/* ------------------------------------------------ Porträts (Brustbild, viewBox 300x420) */
const PEOPLE = {
  you: { skin: '#c99a76', skinD: '#a97b5c', hair: '#241a14', style: 'short', top: 'hoodie', topC: '#3e4a5e', topD: '#2e374a' },
  brandt: { skin: '#e2bea2', skinD: '#c49c80', hair: '#c7c7c7', style: 'bald', top: 'cardigan', topC: '#7a6650', topD: '#5d4c3b', glasses: true, stubble: true },
};
function portraitSvg(who, st = {}) {
  const P = PEOPLE[who], O = '#1c1717', ow = 3.2;
  const blink = st.t !== undefined && (st.t % 3.9) < .12, eyesH = blink ? 1 : (st.eyes === 'wide' ? 15 : 12);
  const brow = { worried: [8, -4], scared: [10, -6], neutral: [2, 0], pain: [12, -8] }[st.mood || 'neutral'];
  const mouth = st.talk ? (Math.sin(st.t * 15) > 0 ? 'o' : 'small') : ({ worried: 'wave', scared: 'o', pain: 'grit', neutral: 'line' }[st.mood || 'neutral']);
  const lx = (st.look || 0) * 5;
  let body = '';
  if (P.top === 'hoodie') body = `
    <path d="M22 420 Q26 330 80 304 Q116 292 150 292 Q184 292 220 304 Q274 330 278 420 Z" fill="${P.topC}" stroke="${O}" stroke-width="${ow}"/>
    <path d="M150 300 Q200 300 238 316 Q262 360 266 420 L232 420 Q226 360 208 330 Z" fill="${P.topD}" opacity=".55"/>
    <path d="M96 300 Q150 352 204 300 Q190 330 150 340 Q110 330 96 300 Z" fill="${P.topD}" stroke="${O}" stroke-width="${ow}"/>
    <path d="M132 334 L128 392 M168 334 L172 392" stroke="#d9dde6" stroke-width="4" stroke-linecap="round"/><circle cx="128" cy="394" r="4" fill="#d9dde6"/><circle cx="172" cy="394" r="4" fill="#d9dde6"/>
    <path d="M110 390 L190 390 L196 420 L104 420 Z" fill="${P.topD}" stroke="${O}" stroke-width="2.5"/>`;
  else body = `
    <path d="M22 420 Q26 330 84 306 Q118 294 150 294 Q182 294 216 306 Q274 330 278 420 Z" fill="${P.topC}" stroke="${O}" stroke-width="${ow}"/>
    <path d="M118 298 L150 340 L182 298 L170 420 L130 420 Z" fill="#e9e3d6" stroke="${O}" stroke-width="2.5"/>
    <path d="M118 298 L138 326 L150 312 M182 298 L162 326 L150 312" fill="#f4efe6" stroke="${O}" stroke-width="2.5"/>
    <path d="M150 300 Q206 302 236 318 Q262 360 266 420 L236 420 Q228 362 206 330 Z" fill="${P.topD}" opacity=".5"/>
    ${[350, 378, 406].map(y => `<circle cx="${y > 380 ? 126 : 128}" cy="${y}" r="4" fill="#3a2d22"/>`).join('')}
    <path d="M118 298 Q112 360 124 420 M182 298 Q188 360 176 420" stroke="${O}" stroke-width="2.5" fill="none"/>`;
  const neck = `<path d="M124 252 L126 300 Q150 312 174 300 L176 252 Z" fill="${P.skinD}" stroke="${O}" stroke-width="${ow}"/>`;
  const head = `
    <ellipse cx="58" cy="176" rx="15" ry="21" fill="${P.skin}" stroke="${O}" stroke-width="${ow}"/><path d="M58 166 q-6 10 0 20" stroke="${P.skinD}" stroke-width="3" fill="none"/>
    <ellipse cx="242" cy="176" rx="15" ry="21" fill="${P.skinD}" stroke="${O}" stroke-width="${ow}"/>
    <path d="M70 120 Q72 64 150 60 Q228 64 230 120 L230 200 Q228 262 150 268 Q72 262 70 200 Z" fill="${P.skin}" stroke="${O}" stroke-width="${ow}"/>
    <path d="M168 62 Q226 70 230 120 L230 200 Q228 258 168 266 Q206 236 210 190 Q214 120 168 62 Z" fill="${P.skinD}" opacity=".45"/>
    <ellipse cx="104" cy="214" rx="15" ry="8" fill="#e57d6a" opacity=".18"/><ellipse cx="196" cy="214" rx="15" ry="8" fill="#e57d6a" opacity=".15"/>`;
  let hair = '';
  if (P.style === 'short') hair = `<path d="M66 134 Q60 52 150 46 Q240 52 234 134 Q222 98 196 92 Q170 112 128 98 Q96 92 80 112 Q72 120 66 134 Z" fill="${P.hair}" stroke="${O}" stroke-width="${ow}"/>
      <path d="M112 64 Q150 54 196 70" stroke="#3a2b22" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  else hair = `<path d="M68 150 Q62 110 80 98 Q76 128 84 150 Z M232 150 Q238 110 220 98 Q224 128 216 150 Z" fill="${P.hair}" stroke="${O}" stroke-width="2.5"/>`;
  const eyes = [-1, 1].map(s => { const ex = 150 + s * 38;
    return eyesH <= 2 ? `<path d="M${ex - 14} ${166} q14 6 28 0" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
      : `<ellipse cx="${ex}" cy="166" rx="15" ry="${eyesH}" fill="#fff" stroke="${O}" stroke-width="2.8"/><circle cx="${ex + lx}" cy="${166 + 1}" r="${st.eyes === 'wide' ? 6.5 : 7.5}" fill="#2a1e18"/><circle cx="${ex + lx + 2.5}" cy="${163}" r="2.4" fill="#fff"/>`; }).join('');
  const brows = [-1, 1].map(s => { const bx = 150 + s * 38;
    return `<path d="M${bx - 18} ${142 - (s < 0 ? brow[1] : 0) + (s < 0 ? 0 : brow[0] * .3)} Q${bx} ${134 - brow[0] * .5} ${bx + 18} ${142 - (s > 0 ? brow[1] : 0) + (s > 0 ? 0 : brow[0] * .3)}" stroke="${P.style === 'bald' ? '#9b9b9b' : '#1e1612'}" stroke-width="7" fill="none" stroke-linecap="round"/>`; }).join('');
  const nose = `<path d="M152 180 Q160 200 150 206 Q144 207 141 203" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  const M = { line: `<path d="M130 232 Q150 238 170 232" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    wave: `<path d="M128 234 q8 -6 14 0 q8 6 16 0 q8 -6 14 0" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    small: `<ellipse cx="150" cy="233" rx="9" ry="5" fill="#4a1e1e" stroke="${O}" stroke-width="2.5"/>`,
    o: `<ellipse cx="150" cy="234" rx="12" ry="13" fill="#4a1e1e" stroke="${O}" stroke-width="2.8"/><ellipse cx="150" cy="241" rx="6" ry="4" fill="#c45b5b"/>`,
    grit: `<rect x="128" y="226" width="44" height="14" rx="6" fill="#fff" stroke="${O}" stroke-width="2.8"/><path d="M128 233 h44" stroke="${O}" stroke-width="1.6"/>` }[mouth];
  const glasses = P.glasses ? `<g fill="none" stroke="#2d2a28" stroke-width="4"><rect x="92" y="146" width="44" height="38" rx="12"/><rect x="164" y="146" width="44" height="38" rx="12"/><path d="M136 162 h28 M92 160 l-22 -6 M208 160 l22 -6"/></g>
      <path d="M96 150 l12 0" stroke="#fff" stroke-width="3" opacity=".5"/>` : '';
  const stubble = P.stubble ? Array.from({ length: 34 }, (_, i) => { const a = Math.PI * (.12 + .76 * i / 33), r = 92 + (i % 3) * 5; return `<circle cx="${150 + Math.cos(a) * r * .82}" cy="${168 + Math.sin(a) * r * .95}" r="1.4" fill="#9a8a7e" opacity=".55"/>`; }).join('') : '';
  const sweat = st.sweat ? `<path d="M212 130 q8 14 0 20 q-8 -6 0 -20 Z" fill="#cfe6ff" stroke="${O}" stroke-width="2"/>` : '';
  const light = st.warm ? `<radialGradient id="wl" cx="30%" cy="80%" r="80%"><stop offset="0" stop-color="#ffb15a" stop-opacity=".35"/><stop offset="1" stop-color="#ffb15a" stop-opacity="0"/></radialGradient><rect width="300" height="420" fill="url(#wl)"/>`
    : `<radialGradient id="cl" cx="50%" cy="95%" r="70%"><stop offset="0" stop-color="#9fc0ff" stop-opacity=".28"/><stop offset="1" stop-color="#9fc0ff" stop-opacity="0"/></radialGradient><rect width="300" height="420" fill="url(#cl)"/>`;
  return `<svg viewBox="0 0 300 420" width="100%" height="100%" style="display:block;overflow:visible">${body}${neck}${head}${stubble}${hair}${brows}${eyes}${nose}${M}${glasses}${sweat}${light}</svg>`;
}
function candleSvg(t) {
  const f = 1 + .08 * Math.sin(t * 17) * Math.sin(t * 5.3);
  return `<svg viewBox="0 0 80 160" width="100%" height="100%"><defs><radialGradient id="cg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffd27a" stop-opacity=".8"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>
    <circle cx="40" cy="36" r="${34 * f}" fill="url(#cg)"/><path d="M40 ${18 - 4 * f} Q50 34 40 46 Q30 34 40 ${18 - 4 * f} Z" fill="#ffe7a8" stroke="#1c1717" stroke-width="2"/>
    <rect x="28" y="48" width="24" height="70" rx="4" fill="#f1ead8" stroke="#1c1717" stroke-width="3"/><rect x="14" y="116" width="52" height="10" rx="5" fill="#8a6a3a" stroke="#1c1717" stroke-width="3"/>
    <path d="M22 126 Q20 150 34 158 L46 158 Q60 150 58 126" fill="#e2bea2" stroke="#1c1717" stroke-width="3"/></svg>`;
}
/* ------------------------------------------------ Zustand der Welt */
function boState(t) {
  for (let k = 0; k < 4; k++) { const e = (EV('off') || []).filter(x => x[1] === k && x[0] <= t)[0]; let v = 1;
    if (e) { const a = t - e[0]; v = a < .5 ? (Math.sin(a * 60) > 0 ? .8 : .1) * (1 - a / .5) : 0; } R3.setDistrict(k, v); }
  const allOff = (EV('off') || []).some(x => x[1] === 3 && x[0] <= t);
  R3.viewMat.map = allOff ? R3.viewDark : R3.viewLit; R3.viewMat.needsUpdate = true;
  const w = lastEv('waterOff', t, null), wp = w ? clamp((t - w[0]) / 2.2) : 0;
  R3.water.scale.set(1 - .7 * wp, 1 - wp * .9, 1 - .7 * wp); R3.water.visible = wp < .98 && !!lastEv('waterOn', t, null);
  const fillK = lastEv('waterOn', t, null) ? clamp((t - lastEv('waterOn', t, null)[0]) / 3) * (1 - wp * .3) : 0;
  R3.bottles.forEach((b, i) => b.material.opacity = .15 + .45 * clamp(fillK * 3 - i));
  const c = lastEv('candle', t, null) && !lastEv('gone', t, null); R3.candle.intensity = c ? 2.2 * (1 + .12 * Math.sin(t * 17)) : 0; R3.candleM.visible = !!c;
  R3.gapL.intensity = 2 * (.85 + .15 * Math.sin(t * 40));
}
function hideChars() { R3.hero.setPose({ visible: false }); R3.neighbor.setPose({ visible: false }); R3.mrsB.setPose({ visible: false }); R3.mrB.setPose({ visible: false }); }
const BO_BG = {
  apt: () => W3.setCam([2.5, 1.6, 2.0], [-.4, 1.2, -2.6], 52),
  kitchen: () => W3.setCam([1.15, 1.7, .75], [2.15, .95, 2.65], 52),
  hall: () => W3.setCam([-.6, 1.6, 102.8], [.2, 1.2, 96.5], 54),
};
/* ------------------------------------------------ Kamera-Einstellungen */
async function viewBoCity(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start; boState(t); hideChars();
  W3.setCam([-18 + 8 * ease(lt / d), 75 - 6 * ease(lt / d), -95 - 12 * ease(lt / d)], [10, 18, -330], 48);
  return '';
}
async function viewBoAptWide(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start; boState(t);
  R3.neighbor.setPose({ visible: false });
  R3.hero.setPose({ visible: true, pos: [.6, 0, -2.05], yaw: Math.PI, look: .25 * Math.sin(t * .6) });
  W3.setCam([2.6 - .3 * ease(lt / d), 1.7, 2.3 - .4 * ease(lt / d)], [-.2, 1.2, -2.8], 50);
  R3.phoneL.position.set(.55, 1.3, -1.7); R3.phoneL.intensity = 3.2;
  return '';
}
async function viewBoKitchen(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start; boState(t); hideChars();
  W3.setCam([1.15 + .1 * ease(lt / d), 1.7, .75], [2.15, .95, 2.65], 52);
  R3.phoneL.position.set(1.9, 1.3, 1.8); R3.phoneL.intensity = 1.2;
  return '';
}
async function viewBoFill(t, sh) {          // du füllst Flaschen an der Spüle
  const lt = t - sh.start, d = sh.end - sh.start; boState(t); hideChars();
  R3.hero.setPose({ visible: true, pos: [2.25, 0, 2.05], yaw: 0, reach: .55 + .05 * Math.sin(t * 2), reachL: .45, look: -.15 });
  W3.setCam([.35 + .15 * ease(lt / d), 1.85, .15], [2.2, 1.0, 2.45], 50);
  R3.phoneL.position.set(1.9, 1.5, 1.6); R3.phoneL.intensity = 2.2;
  return '';
}
async function viewBoFridge3d(t, sh) {      // Hand zum Kühlschrank ... und zurück
  const lt = t - sh.start, d = sh.end - sh.start; boState(t); hideChars();
  const r = ease(lt / .9) - ease((lt - 1.4) / .8);
  R3.hero.setPose({ visible: true, pos: [.45, 0, 1.95], yaw: 0, reach: .75 * r, look: .2 });
  W3.setCam([-1.45, 1.65, .55], [.45, 1.05, 2.3], 50);
  R3.phoneL.position.set(.0, 1.4, 1.6); R3.phoneL.intensity = 2.0;
  return '';
}
async function viewBoBapt(t, sh) {          // Wohnung der Brandts im Licht der Arbeitslampe
  const lt = t - sh.start, d = sh.end - sh.start; boState(t); hideChars();
  R3.workL.intensity = 4 * (.86 + .14 * Math.sin(t * 31) * Math.sin(t * 7));
  R3.mrsB.setPose({ visible: true, pos: [-.35, 0, 198.55], yaw: 0, sit: true, eyes: 'open', look: 0, nod: .08 });
  const mr = lastEv('mrSeat', t, null), turn = lastEv('mrTurn', t, null);
  R3.mrB.setPose({ visible: !!mr, pos: [.35, 0, 198.55], yaw: 0, sit: true, eyes: 'open', look: turn ? -.5 * ease((t - turn[0]) / 2.5) : .35, nod: .1 });
  W3.setCam([.05 + .1 * Math.sin(lt * .3), 1.55 - .1 * ease(lt / d), 202.6 - 1.2 * ease(lt / d)], [0, .95, 198.6], 46);
  return '';
}
async function viewBoHall(t, sh) {
  const lt = t - sh.start, d = sh.end - sh.start; boState(t);
  R3.hero.setPose({ visible: false });
  const nb = lastEv('brandt', t, null) && !lastEv('gone', t, null);
  R3.neighbor.setPose({ visible: !!nb, pos: [-.3, 0, 99.2], yaw: 0, nod: .1 });
  if (sh.pov) W3.setCam([.1, .95, 98.6 - .3 * ease(lt / d)], [1.17, .45, 97.2], 46);
  else W3.setCam([-.55, 1.62, 102.6 - .4 * ease(lt / d)], [.1, 1.25, 96.5], 54);
  return '';
}
function overlayBg(t, bg) { boState(t); hideChars(); BO_BG[bg](); }
async function viewBoPortrait(t, sh) {
  overlayBg(t, sh.bg || 'apt');
  if ((sh.bg || 'apt') === 'apt') { R3.phoneL.position.set(.3, 1.3, 1.2); R3.phoneL.intensity = 1.2; }
  const lt = t - sh.start, p = outBack(lt / .35);
  const q = (TL.quotes || []).find(q => t >= q.start && t < q.end);
  const talk = q && sh.who === 'brandt';
  const svg = portraitSvg(sh.who, { t, mood: sh.mood, eyes: sh.eyes, talk, look: sh.look || 0, sweat: sh.sweat, warm: sh.who === 'brandt' });
  const tag = sh.tag ? `<div class="ntag"><b>${sh.tag[0]}</b><span>${sh.tag[1]}</span></div>` : '';
  const candle = sh.who === 'brandt' ? `<div style="position:absolute;left:30px;top:560px;width:90px;height:180px">${candleSvg(t)}</div>` : '';
  const phone = sh.who === 'you' ? `<div style="position:absolute;left:330px;top:700px;width:70px;height:120px;border-radius:12px;background:#0b0c10;border:3px solid #1c1717;box-shadow:0 0 60px 20px rgba(150,190,255,.25)"></div>` : '';
  return `${tag}<div class="portrait" style="transform:translate(-50%, ${(1 - p) * 60}px) scale(${.95 + .05 * p})">${svg}</div>${candle}${phone}`;
}
async function viewBoAlert(t, sh) {
  overlayBg(t, 'apt');
  const lt = t - sh.start, p = outBack((lt - .1) / .35), shake = lt < 1.2 ? Math.sin(t * 60) * 3 * (1 - lt / 1.2) : 0;
  return handBox(118, 150, 304, 620, `<div class="phone" style="left:118px;top:150px;width:304px;height:620px;transform:translateX(${shake}px)"><div class="screen"><div class="island"></div>
    <div class="lock" style="background:linear-gradient(170deg,#1a1d2c,#2a1f30)"><div class="d">Donnerstag, 12. November</div><div class="c">3:34</div>
    <div class="cb" style="opacity:${clamp(p)};transform:scale(${.9 + .1 * p})"><div class="cbh">⚠ NOTFALLWARNUNG</div>
      <div class="cbt">Großflächiger Stromausfall</div><div class="cbm">Bleiben Sie zu Hause. Informieren Sie sich über Radio und Warn-Apps.</div></div></div></div></div>`);
}
async function viewBoRule(t, sh) {
  overlayBg(t, sh.bg || 'apt');
  const lt = t - sh.start, p = outBack((lt - .05) / .4);
  return `<div class="rule" style="opacity:${clamp(p * 1.4)};transform:translate(-50%, ${(1 - p) * -30}px) rotate(${-3 + p}deg)"><div class="rn">REGEL ${sh.rule.n}</div><div class="rt">${sh.rule.text}</div>${sh.rule.sub ? `<div class="rs">${sh.rule.sub}</div>` : ''}</div>`;
}
async function viewBoFridge(t, sh) {
  overlayBg(t, 'kitchen');
  const lt = t - sh.start, a = ease((lt - .3) / 1.6), b = ease((lt - 1.2) / 2.2);
  return `<div class="graph"><div class="gcol"><div class="gbar"><i style="height:${a * 14}%;background:#4d9bff"></i></div><b>KÜHLSCHRANK</b><span>ca. 4 Std.</span></div>
    <div class="gcol"><div class="gbar"><i style="height:${b * 100}%;background:#ffc21f"></i></div><b>GEFRIERSCHRANK</b><span>voll: ca. 48 Std.</span></div>
    <div class="gnote">… wenn die Tür zu bleibt</div></div>`;
}
async function viewBoCO(t, sh) {
  overlayBg(t, 'hall');
  const lt = t - sh.start, p = outBack((lt - .1) / .4);
  return `<div class="co" style="opacity:${clamp(p * 1.3)};transform:translate(-50%, ${(1 - p) * 30}px)"><div class="coi">CO</div><div class="cot">KOHLENMONOXID</div>
    <div class="cor">${['unsichtbar', 'geruchlos', 'tödlich in geschlossenen Räumen'].map((x, i) => `<div style="opacity:${clamp((lt - .4 - i * .5) / .3)}">✕ ${x}</div>`).join('')}</div></div>`;
}
function boOverlays(t, sh) {
  let ov = '';
  const pill = sh.pill || TL.pill;
  if (pill && sh.scene !== 'end') ov += `<div class="pill2"><i></i>${pill}</div>`;
  const f = (EV('fact') || []).filter(e => t >= e[0] && t < e[2]).slice(-1)[0];
  if (f) ov += `<div class="fact" style="opacity:${clamp((t - f[0]) / .25) * clamp((f[2] - t) / .25)}"><b>ECHT</b><span>${f[1]}</span></div>`;
  return ov;
}
Object.assign(VIEWS, { bo_fill: viewBoFill, bo_fridge3d: viewBoFridge3d, bo_bapt: viewBoBapt, bo_city: viewBoCity, bo_apt: viewBoAptWide, bo_kitchen: viewBoKitchen, bo_hall: viewBoHall, bo_portrait: viewBoPortrait,
  bo_alert: viewBoAlert, bo_rule: viewBoRule, bo_fridge: viewBoFridge, bo_co: viewBoCO });
Object.assign(GLSTYLE, { bo_fill: '', bo_fridge3d: '', bo_bapt: '', bo_city: '', bo_apt: '', bo_kitchen: '', bo_hall: '', bo_portrait: 'blur(7px) brightness(.75)', bo_alert: 'blur(9px) brightness(.6)',
  bo_rule: 'blur(8px) brightness(.6)', bo_fridge: 'blur(8px) brightness(.5)', bo_co: 'blur(8px) brightness(.55)' });
Object.assign(SETBG, { blackout: async (t) => overlayBg(t, 'hall') });
