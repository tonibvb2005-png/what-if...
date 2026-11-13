// FLACHER 2D-STIL (Regel-Horror): reine SVG/HTML-Szenen, kein 3D.
W3.BUILD.flat = async () => { W3.scene.background = new THREE.Color('#05060b'); };
const FL = {
  bg: (extra = '') => `<svg viewBox="0 0 540 960" width="540" height="960" style="position:absolute;inset:0"><defs>
      <radialGradient id="flbg" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#18203a"/><stop offset=".6" stop-color="#0c1022"/><stop offset="1" stop-color="#03040a"/></radialGradient></defs>
      <rect width="540" height="960" fill="url(#flbg)"/>${extra}</svg>`,
};
const RULE_C = { 1: '#ffc21f', 2: '#38b6ff', 3: '#ff3b30' };

/* ---------------- Zeichnungen */
function flDoor(t, knock, gapCol) {
  const dx = knock ? Math.sin(t * 90) * 4 * knock : 0;
  return `<g transform="translate(${dx} 0)">
    <rect x="128" y="236" width="284" height="540" rx="6" fill="#2a2f3d"/>
    <rect x="148" y="256" width="244" height="516" rx="4" fill="#5d6574"/>
    <rect x="148" y="256" width="244" height="516" rx="4" fill="url(#dsh)"/>
    ${[0, 1, 2, 3, 4].map(i => [160, 380].map(x => `<circle cx="${x}" cy="${280 + i * 118}" r="4" fill="#3d4350"/>`).join('')).join('')}
    <rect x="206" y="290" width="128" height="34" rx="3" fill="#ffc21f"/><text x="270" y="313" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="15" fill="#15130c">SCHUTZRAUM</text>
    <circle cx="350" cy="520" r="34" fill="none" stroke="#2c313c" stroke-width="9"/><circle cx="350" cy="520" r="8" fill="#2c313c"/>
    ${[0, 1, 2].map(i => `<line x1="350" y1="520" x2="${350 + Math.cos(i * 2.094 + .4) * 34}" y2="${520 + Math.sin(i * 2.094 + .4) * 34}" stroke="#2c313c" stroke-width="6"/>`).join('')}
  </g>
  <rect x="148" y="772" width="244" height="5" fill="${gapCol}" opacity=".9"/><ellipse cx="270" cy="790" rx="160" ry="24" fill="${gapCol}" opacity=".18"/>
  <rect x="0" y="776" width="540" height="184" fill="#0a0d18"/>`;
}
function flCity(t) {
  const pulse = .5 + .5 * Math.sin(t * 2.2);
  let b = '', x = 0, i = 0;
  while (x < 540) { const w = 40 + (i * 37 % 50), h = 160 + (i * 71 % 230); b += `<rect x="${x}" y="${720 - h}" width="${w}" height="${h + 240}" fill="#070910"/>`;
    for (let yy = 720 - h + 14; yy < 700; yy += 22) for (let xx = x + 8; xx < x + w - 8; xx += 14) if ((xx * 7 + yy * 3 + i) % 11 < 2) b += `<rect x="${xx}" y="${yy}" width="5" height="8" fill="#ffcf86" opacity=".7"/>`;
    x += w + 4; i++; }
  const waves = [0, 1, 2].map(k => { const r = 40 + ((t * 90 + k * 60) % 180); return `<circle cx="120" cy="330" r="${r}" fill="none" stroke="#ff3b30" stroke-width="3" opacity="${Math.max(0, 1 - r / 220)}"/>`; }).join('');
  return `<rect width="540" height="960" fill="#ff1d1d" opacity="${.08 + .1 * pulse}"/>${waves}
    <rect x="114" y="330" width="12" height="400" fill="#1a1d26"/><path d="M96 318 h48 l-8 24 h-32 Z" fill="#2f3442"/><circle cx="120" cy="318" r="10" fill="#ff3b30" opacity="${.5 + .5 * pulse}"/>${b}`;
}
function flPlan(t, st) {      // Grundriss Schutzraum von oben
  const lamp = st.lamp, dark = st.dark ? .82 : 0;
  const benches = [0, 1, 2, 3].map(i => `<rect x="128" y="${290 + i * 108}" width="46" height="84" rx="6" fill="#2a3a66"/><rect x="366" y="${290 + i * 108}" width="46" height="84" rx="6" fill="#2a3a66"/>`).join('');
  const you = `<circle cx="198" cy="512" r="15" fill="none" stroke="#ffc21f" stroke-width="4"/><circle cx="198" cy="512" r="7" fill="#e9eefc"/>
    <rect x="178" y="470" width="40" height="20" rx="3" fill="#ffc21f"/><text x="198" y="485" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="12" fill="#15130c">DU</text>`;
  const jan = st.jan ? `<circle cx="248" cy="512" r="9" fill="#cfd6ea"/><rect x="216" y="536" width="64" height="18" rx="3" fill="#0b0f1d" stroke="#5a6aa0"/><text x="248" y="549" text-anchor="middle" font-family="Montserrat" font-weight="800" font-size="8.5" fill="#cfd6ea">HAUSMEISTER</text>` : '';
  const keys = st.keys ? `<g transform="translate(248 512)"><circle r="7" fill="none" stroke="#ffc21f" stroke-width="3"/><path d="M5 5 l12 12 m-4 -4 l4 -4 m-8 0 l4 -4" stroke="#ffc21f" stroke-width="3"/></g>` : '';
  const cone = st.phone ? `<path d="M198 512 L150 360 Q248 330 346 380 Z" fill="#dfe8ff" opacity=".22"/>` : '';
  const door = `<rect x="236" y="736" width="68" height="10" fill="#0c1022"/><rect x="232" y="732" width="8" height="18" fill="#ffc21f"/><rect x="300" y="732" width="8" height="18" fill="#ffc21f"/>
    <text x="270" y="772" text-anchor="middle" font-family="Montserrat" font-weight="800" font-size="11" fill="#8a96c0">STAHLTÜR</text>`;
  const lampG = lamp ? `<circle cx="270" cy="440" r="120" fill="#ffd08a" opacity=".13"/><circle cx="270" cy="440" r="12" fill="#ffd08a"/>` : `<circle cx="270" cy="440" r="10" fill="#2a2f44"/>`;
  const knock = st.knock ? Math.sin(t * 90) * 3 * st.knock : 0;
  return `<rect x="106" y="230" width="328" height="516" rx="14" fill="#16203d" stroke="#3b4c7a" stroke-width="4"/>${benches}${lampG}
    <g transform="translate(0 ${knock})">${door}</g>${jan}${keys}${you}
    <rect x="106" y="230" width="328" height="516" rx="14" fill="#000" opacity="${dark * (st.phone ? .55 : 1)}"/>${st.phone ? cone + you + keys : (dark ? you : '')}`;
}
function flJanitor(t, talk) {
  const m = talk && Math.sin(t * 15) > 0;
  return `<g transform="translate(270 560)">
    <path d="M-150 400 Q-150 160 0 150 Q150 160 150 400 Z" fill="#2a3a5c"/><path d="M-150 400 Q-150 160 0 150 L0 400 Z" fill="#324570"/>
    <path d="M-40 150 L0 230 L40 150 Z" fill="#dfe3ea"/><rect x="-10" y="160" width="20" height="90" fill="#8a2a2a"/>
    <rect x="58" y="230" width="58" height="40" rx="5" fill="#3a4c74"/><text x="87" y="255" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="12" fill="#ffc21f">HM</text>
    <g transform="translate(-70 270)"><circle r="14" fill="none" stroke="#c9a54a" stroke-width="4"/><path d="M8 8 l16 18 m-6 -6 l6 -6" stroke="#c9a54a" stroke-width="4"/></g>
    <rect x="-34" y="96" width="68" height="64" fill="#e2b892"/>
    <ellipse cx="0" cy="20" rx="92" ry="102" fill="#ecc5a0"/><ellipse cx="34" cy="26" rx="58" ry="92" fill="#dcb08a" opacity=".55"/>
    <ellipse cx="-92" cy="30" rx="16" ry="24" fill="#e2b892"/><ellipse cx="92" cy="30" rx="16" ry="24" fill="#dcb08a"/>
    <path d="M-104 -46 Q-100 -118 0 -122 Q100 -118 104 -46 Z" fill="#33425f"/><rect x="-120" y="-50" width="240" height="20" rx="10" fill="#26324a"/>
    <rect x="-24" y="-104" width="48" height="26" rx="4" fill="#ffc21f"/>
    <path d="M-52 2 q16 -10 30 0 M22 2 q16 -10 30 0" stroke="#5a4636" stroke-width="7" fill="none" stroke-linecap="round"/>
    <circle cx="-37" cy="26" r="7" fill="#1c1410"/><circle cx="37" cy="26" r="7" fill="#1c1410"/>
    <path d="M-6 40 q6 22 -2 30" stroke="#b98d6a" stroke-width="5" fill="none"/>
    <path d="M-50 74 Q-26 60 0 70 Q26 60 50 74 Q30 88 0 82 Q-30 88 -50 74 Z" fill="#cfcfcf"/>
    ${m ? `<ellipse cx="0" cy="98" rx="14" ry="9" fill="#5a2a2a"/>` : `<path d="M-14 96 q14 6 28 0" stroke="#5a2a2a" stroke-width="5" fill="none" stroke-linecap="round"/>`}
  </g>`;
}
/* ---------------- HTML-Bausteine */
function flTimebox(sh) {
  if (!sh.tbox) return '';
  const [lab, tm, col] = sh.tbox;
  return `<div class="ftb" style="border-color:${col === 'red' ? '#ff3b30' : '#ffc21f'}"><span>${lab}</span><b>${tm}</b></div>`;
}
function flRules(t, sh) {
  const rs = EV('rule').filter(e => e[0] <= t);
  if (!rs.length || sh.scene === 'fl_choice' || sh.scene === 'end') return '';
  const big = sh.scene === 'fl_rule' ? sh.rule : null;
  return `<div class="frl">${rs.filter(e => e[1] !== big).map(e => `<div><i style="background:${RULE_C[e[1]]}">${e[1]}</i>${e[2]}</div>`).join('')}</div>`;
}
/* ---------------- Szenen */
async function vDoor(t, sh) {
  let k = 0; for (const kt of TL.knocks || []) { const a = t - kt; if (a >= 0 && a < .2) k = Math.max(k, 1 - a / .2); }
  const red = (TL.knocks || []).some(kt => t - kt >= 0 && t - kt < .35);
  return FL.bg(`<defs><linearGradient id="dsh" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient></defs>
    ${red ? '<rect width="540" height="960" fill="#ff1d1d" opacity=".12"/>' : ''}${flDoor(t, k, sh.gap || '#9fb4ff')}`)
    + (sh.title ? `<div class="ftitle"><b>${sh.title[0]}</b><span>${sh.title[1]}</span></div>` : '');
}
async function vRewind(t, sh) {
  const lt = t - sh.start;
  return FL.bg(`<g opacity=".25"><defs><linearGradient id="dsh" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient></defs>${flDoor(t, 0, '#9fb4ff')}</g>
    <g transform="translate(${270 - 20 * Math.sin(lt * 6)} 420)" fill="#fff"><path d="M0 -40 L-60 0 L0 40 Z"/><path d="M60 -40 L0 0 L60 40 Z"/></g>`)
    + `<div class="fpill" style="top:490px">${sh.label}</div>`;
}
async function vCity(t, sh) { return FL.bg(flCity(t)); }
async function vPlan(t, sh) {
  const has = (n) => !!lastEv(n, t, null);
  let k = 0; for (const kt of TL.knocks || []) { const a = t - kt; if (a >= 0 && a < .2) k = Math.max(k, 1 - a / .2); }
  const st = { lamp: !has('lampOff'), dark: has('lampOff') && !has('phone'), phone: has('phone'), jan: has('jan') && !has('janGone'), keys: has('janGone') && has('phone'), knock: k };
  if (has('phone')) st.dark = true;
  return FL.bg(flPlan(t, st) + (sh.label ? '' : ''));
}
async function vJanitor(t, sh) {
  const q = (TL.quotes || []).find(q => t >= q.start && t < q.end);
  return FL.bg(`<circle cx="270" cy="620" r="260" fill="#2a3a66" opacity=".25"/>${flJanitor(t, !!q)}`)
    + (sh.tag ? `<div class="fnt"><b>${sh.tag[0]}</b><span>${sh.tag[1]}</span></div>` : '');
}
async function vRule(t, sh) {
  const lt = t - sh.start, p = outBack(lt / .35), c = RULE_C[sh.rule];
  return FL.bg('') + `<div class="frule" style="transform:translate(-50%,-50%) scale(${.85 + .15 * p});opacity:${clamp(p * 1.4)}">
    <i style="background:${c}">${sh.rule}</i><div style="border-color:${c}"><span style="color:${c}">REGEL ${sh.rule}</span><b>${sh.text}</b></div></div>`;
}
async function vDark(t, sh) {
  const lt = t - sh.start;
  return FL.bg('<rect width="540" height="960" fill="#000" opacity=".85"/>') +
    (sh.words || []).map((w, i) => `<div class="fword" style="top:${330 + i * 54}px;opacity:${clamp((lt - .6 - i * 1.1) / .4) * (.75 + .25 * Math.sin(t * 3 + i))}">${w}</div>`).join('');
}
async function vVoice(t, sh) {
  const q = (TL.quotes || []).find(q => t >= q.start && t < q.end);
  const bars = Array.from({ length: 46 }, (_, i) => { const h = q ? 6 + Math.abs(Math.sin(t * 13 + i * .7) * Math.sin(t * 5 + i)) * 46 : 3; return `<i style="height:${h}px"></i>`; }).join('');
  return FL.bg(`<g opacity=".3"><defs><linearGradient id="dsh" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient></defs>${flDoor(t, 0, '#ffb35a')}</g>`)
    + `<div class="fwave"><span>● ${sh.vlabel || 'STIMME · VOR DER TÜR'}</span><div>${bars}</div></div>`;
}
async function vChoice(t, sh) {
  const lt = t - sh.start, a = (d) => `opacity:${clamp((lt - d) / .3)};transform:translateY(${(1 - ease((lt - d) / .3)) * 16}px)`;
  return FL.bg('<rect width="540" height="960" fill="#ff3b30" opacity=".04"/>') + `<div class="fch">
    <h1 style="${a(0)}"><span style="color:#ff8a2a">${sh.q[0]}</span><br><span style="color:#38b6ff">${sh.q[1]}</span></h1>
    <div class="fbt" style="${a(.3)}"><div style="border-color:#ff8a2a;color:#ff8a2a">${sh.a[0]}<small>${sh.a[1]}</small></div>
      <div style="border-color:#38b6ff;color:#38b6ff;${a(.6)}">${sh.b[0]}<small>${sh.b[1]}</small></div></div>
    <div class="fmaj" style="${a(1.1)}">MEHRHEIT ENTSCHEIDET TEIL 2 →</div></div>`;
}
async function vEnd(t, sh) {
  const lt = t - sh.start, a = (d) => `opacity:${clamp((lt - d) / .3)}`;
  return FL.bg('') + `<div class="fend"><span style="${a(0)}">${TL.title}</span><b style="${a(.15)}">TEIL 2</b><em style="${a(.3)}">${TL.nextTitle || ''}</em><i style="${a(.5)}">FOLGE FÜR TEIL 2</i></div>`;
}
Object.assign(VIEWS, { fl_door: vDoor, fl_rewind: vRewind, fl_city: vCity, fl_plan: vPlan, fl_janitor: vJanitor, fl_rule: vRule, fl_dark: vDark, fl_voice: vVoice, fl_choice: vChoice, fl_end: vEnd });
['fl_door', 'fl_rewind', 'fl_city', 'fl_plan', 'fl_janitor', 'fl_rule', 'fl_dark', 'fl_voice', 'fl_choice', 'fl_end'].forEach(k => GLSTYLE[k] = 'none');
function flOverlays(t, sh) { return (TL.handleTag ? `<div class="fhd"><i></i>${TL.handleTag}</div>` : "") + flTimebox(sh) + flRules(t, sh); }
