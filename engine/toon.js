// Vektor-Figuren im Doku-Survival-Stil: Brustbild, dicke Kontur, Cel-Shading (eine Seite dunkler), ausdrucksstarke Brauen.
const TOON = (() => {
  const OL = '#17171d', W = 7;
  const shade = (id, d) => `<clipPath id="${id}"><path d="${d}"/></clipPath>`;
  // Gesicht: expression = neutral | worried | scared | determined | angry ; mouth = closed | open | talk
  function face(c, o) {
    const [cx, cy] = c, R = 118, e = o.expr || 'neutral', t = o.t || 0;
    const blink = (t % 3.6) < .12 && !o.noBlink;
    const look = (o.look || 0) * 10;
    let s = '';
    // Ohren
    for (const k of [-1, 1]) s += `<ellipse cx="${cx + k * (R - 6)}" cy="${cy + 14}" rx="26" ry="32" fill="${o.skin}" stroke="${OL}" stroke-width="${W}"/>
      <path d="M${cx + k * (R - 4)} ${cy + 2} q${k * 10} 12 0 26" stroke="${OL}" stroke-width="4" fill="none" opacity=".5"/>`;
    // Kopf (leicht eckiges Oval)
    const head = `M${cx - R} ${cy - 10} Q${cx - R} ${cy - R - 8} ${cx} ${cy - R - 8} Q${cx + R} ${cy - R - 8} ${cx + R} ${cy - 10} Q${cx + R} ${cy + R - 6} ${cx} ${cy + R + 4} Q${cx - R} ${cy + R - 6} ${cx - R} ${cy - 10} Z`;
    s += `<defs>${shade('hc' + o.id, head)}</defs><path d="${head}" fill="${o.skin}"/>
      <g clip-path="url(#hc${o.id})"><path d="M${cx + 18} ${cy - R - 20} Q${cx + 40} ${cy} ${cx + 8} ${cy + R + 20} L${cx + R + 30} ${cy + R + 20} L${cx + R + 30} ${cy - R - 20} Z" fill="#000" opacity=".1"/></g>`;
    // Augen
    const ey = cy - 4, ex = 46;
    if (blink) for (const k of [-1, 1]) s += `<path d="M${cx + k * ex - 16} ${ey} q16 8 32 0" stroke="${OL}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    else for (const k of [-1, 1]) {
      const ry = e === 'scared' ? 19 : 16;
      s += `<ellipse cx="${cx + k * ex + look}" cy="${ey}" rx="${ry - 3}" ry="${ry}" fill="${OL}"/><circle cx="${cx + k * ex + look + 5}" cy="${ey - 6}" r="5" fill="#fff"/>`;
      if (e === 'scared') s += `<ellipse cx="${cx + k * ex + look}" cy="${ey}" rx="${ry + 5}" ry="${ry + 6}" fill="none" stroke="${OL}" stroke-width="3" opacity=".35"/>`;
    }
    // Augenbrauen
    // [außen, innen]: positiv = tiefer. Sorge: innen hoch; Entschlossen/Wut: innen tief
    const br = { neutral: [0, 0], worried: [10, -12], scared: [12, -18], determined: [-6, 10], angry: [-10, 16] }[e] || [0, 0];
    for (const k of [-1, 1]) {
      const x1 = cx + k * (ex + 22), x2 = cx + k * (ex - 22), yy = ey - 40;
      s += `<path d="M${x1} ${yy + br[0]} L${x2} ${yy + br[1]}" stroke="${o.brow || OL}" stroke-width="11" stroke-linecap="round"/>`;
    }
    // Nase
    s += `<path d="M${cx + 2} ${cy + 16} q10 14 -4 22" stroke="${OL}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>`;
    // Mund
    const my = cy + 62, talk = o.mouth === 'talk' ? Math.abs(Math.sin(t * 11)) * (Math.sin(t * 3.1) > -.4 ? 1 : .2) : 0;
    if (o.mouth === 'open' || e === 'scared') s += `<ellipse cx="${cx}" cy="${my + 4}" rx="16" ry="20" fill="${OL}"/><ellipse cx="${cx}" cy="${my + 14}" rx="9" ry="6" fill="#b4474f"/>`;
    else if (talk > .15) s += `<path d="M${cx - 26} ${my} Q${cx} ${my + 34 * talk} ${cx + 26} ${my} Z" fill="${OL}"/><ellipse cx="${cx}" cy="${my + 14 * talk}" rx="10" ry="${5 * talk}" fill="#b4474f"/>`;
    else if (e === 'worried') s += `<path d="M${cx - 24} ${my + 6} q12 -10 24 0 q12 10 24 0" stroke="${OL}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    else if (e === 'determined' || e === 'angry') s += `<path d="M${cx - 26} ${my + 4} L${cx + 26} ${my + 2}" stroke="${OL}" stroke-width="7" stroke-linecap="round"/>`;
    else s += `<path d="M${cx - 26} ${my} Q${cx} ${my + 14} ${cx + 26} ${my}" stroke="${OL}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    if (o.sweat) s += `<path d="M${cx + R - 22} ${cy - 46} q14 22 0 30 q-14 -8 0 -30 Z" fill="#8fd3ff" stroke="${OL}" stroke-width="4"/>`;
    if (o.soot) s += `<path d="M${cx - 70} ${cy + 30} q20 -6 34 4 M${cx + 50} ${cy - 70} q14 4 22 -4" stroke="#3a3a40" stroke-width="10" stroke-linecap="round" opacity=".5"/>`;
    s += `<path d="${head}" fill="none" stroke="${OL}" stroke-width="${W}"/>`;
    return s;
  }
  const HAIR = {
    messy: (cx, cy, c) => `<path d="M${cx - 124} ${cy - 18} Q${cx - 130} ${cy - 140} ${cx - 10} ${cy - 142} Q${cx + 110} ${cy - 150} ${cx + 126} ${cy - 30} Q${cx + 96} ${cy - 92} ${cx + 40} ${cy - 84} L${cx + 52} ${cy - 104} Q${cx} ${cy - 84} ${cx - 40} ${cy - 92} L${cx - 30} ${cy - 74} Q${cx - 96} ${cy - 84} ${cx - 124} ${cy - 18} Z" fill="${c}" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>
      <path d="M${cx + 30} ${cy - 132} Q${cx + 80} ${cy - 120} ${cx + 100} ${cy - 80}" stroke="#fff" stroke-opacity=".18" stroke-width="10" fill="none" stroke-linecap="round"/>`,
    bun: (cx, cy, c) => `<circle cx="${cx}" cy="${cy - 150}" r="42" fill="${c}" stroke="${OL}" stroke-width="${W}"/>
      <path d="M${cx - 122} ${cy + 10} Q${cx - 132} ${cy - 132} ${cx} ${cy - 134} Q${cx + 132} ${cy - 132} ${cx + 122} ${cy + 10} Q${cx + 110} ${cy - 70} ${cx + 30} ${cy - 92} Q${cx - 10} ${cy - 70} ${cx - 60} ${cy - 84} Q${cx - 108} ${cy - 60} ${cx - 122} ${cy + 10} Z" fill="${c}" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>`,
    balding: (cx, cy, c) => `<path d="M${cx - 124} ${cy + 6} Q${cx - 132} ${cy - 70} ${cx - 92} ${cy - 96} Q${cx - 110} ${cy - 40} ${cx - 104} ${cy + 6} Z M${cx + 124} ${cy + 6} Q${cx + 132} ${cy - 70} ${cx + 92} ${cy - 96} Q${cx + 110} ${cy - 40} ${cx + 104} ${cy + 6} Z" fill="${c}" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>`,
  };
  // Kleidung / Oberkörper
  function torso(cx, top, o) {
    const w = 420, sh = top + 40, b = 960;
    const body = `M${cx - 80} ${top} Q${cx - w / 2} ${top + 20} ${cx - w / 2 + 10} ${sh + 120} L${cx - w / 2 + 30} ${b + 20} L${cx + w / 2 - 30} ${b + 20} L${cx + w / 2 - 10} ${sh + 120} Q${cx + w / 2} ${top + 20} ${cx + 80} ${top} Z`;
    let s = `<defs>${shade('tc' + o.id, body)}</defs><path d="M${cx - 44} ${top - 30} L${cx - 44} ${top + 30} L${cx + 44} ${top + 30} L${cx + 44} ${top - 30} Z" fill="${o.skin}" stroke="${OL}" stroke-width="${W}"/>
      <path d="${body}" fill="${o.cloth}"/>`;
    if (o.kind === 'parka') s += `<path d="M${cx - 120} ${top + 6} Q${cx} ${top - 50} ${cx + 120} ${top + 6} Q${cx} ${top + 40} ${cx - 120} ${top + 6} Z" fill="${o.cloth2}" stroke="${OL}" stroke-width="${W}"/>
        <path d="M${cx} ${top + 30} L${cx} ${b}" stroke="${OL}" stroke-width="6"/><path d="M${cx - 8} ${top + 60} L${cx - 8} ${b}" stroke="#c9c9c9" stroke-width="5" stroke-dasharray="10 8"/>
        <path d="M${cx - 150} ${top + 40} L${cx - 110} ${b}" stroke="#2b2b30" stroke-width="22"/><path d="M${cx - 150} ${top + 40} L${cx - 110} ${b}" stroke="${OL}" stroke-width="3" opacity=".6"/>`;
    if (o.kind === 'uniform') s += `<path d="M${cx - 60} ${top + 6} L${cx} ${top + 120} L${cx + 60} ${top + 6}" fill="#f2f2f4" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>
        <path d="M${cx - 18} ${top + 44} L${cx} ${top + 70} L${cx + 18} ${top + 44} L${cx + 10} ${top + 150} L${cx} ${top + 168} L${cx - 10} ${top + 150} Z" fill="${o.accent}" stroke="${OL}" stroke-width="5"/>
        <path d="M${cx - 60} ${top + 6} L${cx - 110} ${b} M${cx + 60} ${top + 6} L${cx + 110} ${b}" stroke="${OL}" stroke-width="6"/>
        <rect x="${cx + 70}" y="${top + 120}" width="78" height="44" rx="6" fill="#f5f5f7" stroke="${OL}" stroke-width="5"/><rect x="${cx + 80}" y="${top + 130}" width="40" height="8" fill="${o.accent}"/><rect x="${cx + 80}" y="${top + 145}" width="56" height="6" fill="#9a9aa2"/>
        ${[0, 1, 2].map(i => `<circle cx="${cx - 76}" cy="${top + 200 + i * 60}" r="7" fill="#c9b26a" stroke="${OL}" stroke-width="3"/>`).join('')}`;
    if (o.kind === 'cardigan') s += `<path d="M${cx - 54} ${top + 4} L${cx} ${top + 70} L${cx + 54} ${top + 4}" fill="#dfe6ee" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>
        <path d="M${cx - 30} ${top + 40} L${cx - 26} ${b} M${cx + 30} ${top + 40} L${cx + 26} ${b}" stroke="${OL}" stroke-width="6"/>
        ${[0, 1, 2, 3].map(i => `<circle cx="${cx + 42}" cy="${top + 120 + i * 55}" r="7" fill="#e8d9b8" stroke="${OL}" stroke-width="3"/>`).join('')}
        ${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${cx - 190 + i * 8} ${top + 150 + i * 60} h40" stroke="#000" stroke-opacity=".08" stroke-width="10"/>`).join('')}`;
    s += `<g clip-path="url(#tc${o.id})"><path d="M${cx + 30} ${top - 40} Q${cx + 70} ${top + 300} ${cx + 40} ${b + 40} L${cx + 300} ${b + 40} L${cx + 300} ${top - 40} Z" fill="#000" opacity=".14"/></g>
      <path d="${body}" fill="none" stroke="${OL}" stroke-width="${W}"/>`;
    return s;
  }
  function glasses(cx, cy) {
    return [-1, 1].map(k => `<circle cx="${cx + k * 46}" cy="${cy - 4}" r="30" fill="#fff" fill-opacity=".12" stroke="${OL}" stroke-width="6"/>`).join('') + `<path d="M${cx - 16} ${cy - 6} q16 -10 32 0" stroke="${OL}" stroke-width="5" fill="none"/>`;
  }
  function beard(cx, cy, c) { return `<path d="M${cx - 100} ${cy + 20} Q${cx - 96} ${cy + 120} ${cx} ${cy + 128} Q${cx + 96} ${cy + 120} ${cx + 100} ${cy + 20} Q${cx + 70} ${cy + 80} ${cx + 30} ${cy + 70} Q${cx} ${cy + 46} ${cx - 30} ${cy + 70} Q${cx - 70} ${cy + 80} ${cx - 100} ${cy + 20} Z" fill="${c}" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/>`; }
  // Gesamtes Brustbild (540×960). o: Charakter-Definition + Zustand
  function bust(o, st = {}) {
    const cx = 270, bob = Math.sin((st.t || 0) * 1.8) * 4, cy = 420 + bob, id = o.id + (st.k || '');
    const P = { ...o, ...st, id };
    let s = torso(cx, cy + 128, P);
    s += face([cx, cy], P);
    if (o.beard) s += beard(cx, cy, o.beard) + `<path d="M${cx - 26} ${cy + 66} Q${cx} ${cy + 76} ${cx + 26} ${cy + 66}" stroke="${OL}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    if (o.hair) s += HAIR[o.hair](cx, cy, o.hairC);
    if (o.glasses) s += glasses(cx, cy);
    if (o.cap) s += `<path d="M${cx - 112} ${cy - 76} Q${cx} ${cy - 170} ${cx + 112} ${cy - 76} Z" fill="${o.cap}" stroke="${OL}" stroke-width="${W}"/><path d="M${cx - 120} ${cy - 76} L${cx + 150} ${cy - 76}" stroke="${OL}" stroke-width="14" stroke-linecap="round"/>`;
    return `<svg viewBox="0 0 540 960" width="540" height="960" style="position:absolute;inset:0">${s}</svg>`;
  }
  return { bust };
})();
