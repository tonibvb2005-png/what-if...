const C = {
  bg1: '#070b1f', bg2: '#13214d', land: '#2a3b66', landStroke: '#0b1430',
  yellow: '#ffd23f', white: '#ffffff', pink: '#ff4f8b', cyan: '#38e1ff',
  green: '#5cf29a', orange: '#ff8c42', suit: '#1d1f2b', tie: '#e63946'
};

const countries = topojson.feature(WORLD, WORLD.objects.countries).features;
const sphere = { type: 'Sphere' };
// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

const stars = []; { let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 160; i++) stars.push([r() * W, r() * H, r() * 2.2 + .4, r() * 6.28]); }

function background(t) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, C.bg1); g.addColorStop(1, C.bg2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (const [x, y, r, p] of stars) {
    ctx.globalAlpha = .25 + .35 * (0.5 + 0.5 * Math.sin(t * 2 + p));
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function textLine(segs, x, y, size, opts = {}) {
  const p = opts.p === undefined ? 1 : opts.p; if (p <= 0) return;
  ctx.save(); ctx.font = `${opts.weight || 900} ${size}px Montserrat`; ctx.textBaseline = 'middle';
  const widths = segs.map(s => ctx.measureText(s[0]).width), total = widths.reduce((a, b) => a + b, 0);
  const s = opts.noPop ? 1 : easeBack(clamp(p));
  ctx.translate(x, y + (1 - clamp(p)) * 40); ctx.scale(s, s); ctx.globalAlpha = clamp(p * 1.5);
  let cx = -total / 2;
  segs.forEach((seg, i) => {
    ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.16; ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.strokeText(seg[0], cx, 0);
    ctx.fillStyle = seg[1] || C.white; ctx.fillText(seg[0], cx, 0); cx += widths[i];
  });
  ctx.restore();
}
function pill(label, x, y, p, color = C.pink, size = 44) {
  if (p <= 0) return;
  ctx.save(); ctx.font = `900 ${size}px Montserrat`; ctx.textBaseline = 'middle';
  const w = ctx.measureText(label).width + 64, h = size * 1.9;
  const s = easeBack(clamp(p)); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = clamp(p * 2);
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, h / 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(label, 0, 3); ctx.restore();
}
function label(text, x, y, color, p, size = 38) {
  if (p <= 0) return;
  ctx.save(); ctx.globalAlpha *= clamp(p * 2);
  ctx.font = `800 ${size}px Montserrat`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(0,0,0,.85)';
  const yy = y + (1 - easeOut(clamp(p))) * 20;
  ctx.strokeText(text, x, yy); ctx.fillStyle = color; ctx.fillText(text, x, yy); ctx.restore();
}
function drawGlobe(proj, highlights = {}, opts = {}) {
  const path = d3.geoPath(proj, ctx);
  const [cx, cy] = proj.translate(), r = proj.scale();
  const glow = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.25);
  glow.addColorStop(0, 'rgba(56,140,255,0.35)'); glow.addColorStop(1, 'rgba(56,140,255,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, r * 1.25, 0, 7); ctx.fill();
  const og = ctx.createRadialGradient(cx - r * .35, cy - r * .35, r * .1, cx, cy, r);
  og.addColorStop(0, '#1d4b9e'); og.addColorStop(1, '#0a1d45');
  ctx.beginPath(); path(sphere); ctx.fillStyle = og; ctx.fill();
  for (const f of countries) {
    ctx.beginPath(); path(f); ctx.fillStyle = highlights[f.id] || (opts.dim ? '#223154' : C.land); ctx.fill();
    ctx.strokeStyle = C.landStroke; ctx.lineWidth = 1.2; ctx.stroke();
  }
  ctx.beginPath(); path(sphere); ctx.strokeStyle = 'rgba(120,180,255,0.6)'; ctx.lineWidth = 3; ctx.stroke();
}
function progressBar(t) {
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(60, 70, W - 120, 10);
  ctx.fillStyle = C.yellow; ctx.fillRect(60, 70, (W - 120) * clamp(t / DURATION), 10);
  ctx.font = '700 34px Montserrat'; ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('🌍 ' + HANDLE, 60, 130);
  if (window.CORNER) { ctx.textAlign = 'right'; ctx.fillText(CORNER, W - 60, 130); }
  ctx.textAlign = 'start';
}

// =====================================================================
// HOST CHARACTER – stick figure in a suit
// =====================================================================
const FIG = { x: 180, y: 1440 };              // hip position
const SH = { L: [-46, -150], R: [46, -150] };  // shoulders relative to hip
const UA = 82, FA = 78;                        // upper arm / forearm length
const D2R = Math.PI / 180;
const dir = a => [Math.sin(a * D2R), Math.cos(a * D2R)]; // 0 = down, 90 = right, 180 = up

const POSE = {
  idle:    { L: [-14, -6], R: [14, 6] },
  hips:    { L: [-45, 100], R: [45, -100] },
  think:   { L: [-45, 100], R: [28, 150], brow: 1 },
  shrug:   { L: [-75, -85], R: [75, 85], brow: 1 },
  tada:    { L: [-135, -10], R: [135, 10] },
  present: { L: [-14, -6], R: [80, 40] },
};
const wave = u => ({ L: [-14, -6], R: [150, 25 + 25 * Math.sin(u * 11)] });
function pointAt(x, y) {
  const sx = FIG.x + SH.R[0], sy = FIG.y + SH.R[1];
  const a = Math.atan2(x - sx, y - sy) / D2R;
  return { L: [-30, 60], R: [a, 0] };
}
function blendPose(a, b, k) {
  return {
    L: [lerp(a.L[0], b.L[0], k), lerp(a.L[1], b.L[1], k)],
    R: [lerp(a.R[0], b.R[0], k), lerp(a.R[1], b.R[1], k)],
    brow: lerp(a.brow || 0, b.brow || 0, k),
  };
}
function poseAt(keys, u) {
  const ev = (p) => typeof p === 'function' ? p(u) : p;
  let i = 0; while (i + 1 < keys.length && keys[i + 1][0] <= u) i++;
  const cur = ev(keys[i][1]); if (i === 0) return cur;
  const prev = ev(keys[i - 1][1]);
  return blendPose(prev, cur, easeInOut(prog(u, keys[i][0], keys[i][0] + 0.3)));
}
function activeWord(t) { for (const w of WORDS) if (t >= w.start && t < w.end) return w; return null; }

function strokeLimb(pts, width) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p));
  ctx.strokeStyle = '#fff'; ctx.lineWidth = width + 9; ctx.stroke();
  ctx.strokeStyle = C.suit; ctx.lineWidth = width; ctx.stroke();
}

function drawHost(t, pose, o = {}) {
  const x = FIG.x + (o.dx || 0), y = FIG.y;
  const w = activeWord(t), talking = !!w;
  const bob = talking ? Math.sin(t * 9) * 3 : Math.sin(t * 2) * 2;
  ctx.save(); ctx.translate(x, y + bob);

  // legs + shoes
  const legSwing = o.walk ? Math.sin(t * 13) * 24 : 0;
  for (const [hx, sw] of [[-18, legSwing], [18, -legSwing]]) {
    const [dx, dy] = dir(sw + (hx < 0 ? -6 : 6));
    const fx = hx + dx * 160, fy = 8 + dy * 160;
    strokeLimb([[hx, 8], [fx, fy]], 26);
    ctx.beginPath(); ctx.ellipse(fx + (hx < 0 ? -12 : 12), fy + 8, 28, 13, 0, 0, 7);
    ctx.fillStyle = '#0c0c10'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke();
  }

  // jacket
  ctx.beginPath();
  ctx.moveTo(-50, -158); ctx.lineTo(50, -158); ctx.lineTo(46, 18); ctx.lineTo(4, 26); ctx.lineTo(-4, 26); ctx.lineTo(-46, 18); ctx.closePath();
  ctx.fillStyle = C.suit; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.stroke();
  // shirt V
  ctx.beginPath(); ctx.moveTo(-24, -158); ctx.lineTo(24, -158); ctx.lineTo(0, -80); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
  // lapels
  ctx.strokeStyle = '#4a4e66'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-24, -158); ctx.lineTo(-8, -72); ctx.moveTo(24, -158); ctx.lineTo(8, -72); ctx.stroke();
  // tie
  ctx.fillStyle = C.tie;
  ctx.beginPath(); ctx.moveTo(-9, -156); ctx.lineTo(9, -156); ctx.lineTo(5, -140); ctx.lineTo(-5, -140); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-5, -140); ctx.lineTo(5, -140); ctx.lineTo(10, -96); ctx.lineTo(0, -84); ctx.lineTo(-10, -96); ctx.closePath(); ctx.fill();
  // buttons + globe pin
  ctx.fillStyle = '#c9ccd8'; for (const by of [-50, -20]) { ctx.beginPath(); ctx.arc(0, by, 4, 0, 7); ctx.fill(); }
  ctx.beginPath(); ctx.arc(-30, -118, 8, 0, 7); ctx.fillStyle = '#3d7bff'; ctx.fill();
  ctx.strokeStyle = C.green; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(-30, -118, 8, -1, 1.2); ctx.stroke();

  // arms
  for (const side of ['L', 'R']) {
    const [sx, sy] = SH[side], [a, e] = pose[side];
    const [d1x, d1y] = dir(a), [d2x, d2y] = dir(a + e);
    const ex = sx + d1x * UA, ey = sy + d1y * UA, hx = ex + d2x * FA, hy = ey + d2y * FA;
    strokeLimb([[sx, sy], [ex, ey], [hx, hy]], 22);
    ctx.beginPath(); ctx.arc(hx, hy, 13, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.stroke();
    if (side === 'R' && o.prop) {
      ctx.save(); ctx.font = '84px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = o.propA ?? 1; ctx.fillText(o.prop, hx + 6, hy - 34); ctx.restore();
    }
  }

  // neck + head
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -170); ctx.lineTo(0, -158); ctx.stroke();
  const tilt = talking ? Math.sin(t * 3.1) * 0.05 : 0;
  ctx.save(); ctx.translate(0, -228); ctx.rotate(tilt);
  ctx.beginPath(); ctx.arc(0, 0, 58, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 5; ctx.stroke();
  // hair
  ctx.beginPath(); ctx.moveTo(-52, -22); ctx.quadraticCurveTo(-24, -80, 48, -32); ctx.quadraticCurveTo(8, -50, -52, -22); ctx.fillStyle = '#111'; ctx.fill();
  // eyes + glasses
  const blink = (t % 3.3) < 0.12;
  for (const ex of [-21, 21]) {
    ctx.beginPath();
    if (blink) { ctx.moveTo(ex - 7, 0); ctx.lineTo(ex + 7, 0); ctx.strokeStyle = '#111'; ctx.lineWidth = 4; ctx.stroke(); }
    else { ctx.arc(ex, 0, 6.5, 0, 7); ctx.fillStyle = '#111'; ctx.fill(); }
    ctx.beginPath(); ctx.arc(ex, 0, 17, 0, 7); ctx.strokeStyle = '#111'; ctx.lineWidth = 4; ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(-4, -2); ctx.lineTo(4, -2); ctx.stroke();
  // brows
  const br = (pose.brow || 0) * 8;
  ctx.lineWidth = 5; ctx.beginPath();
  ctx.moveTo(-32, -26 - br); ctx.lineTo(-12, -28 - br * 1.3); ctx.moveTo(12, -28 - br * 1.3); ctx.lineTo(32, -26 - br); ctx.stroke();
  // mouth: lip-flap while a word is spoken
  if (talking) {
    const n = Math.max(1, Math.round(norm(w.text).length / 3));
    const open = Math.abs(Math.sin(prog(t, w.start, w.end) * Math.PI * n));
    ctx.beginPath(); ctx.ellipse(0, 30, 13, 3 + 12 * open, 0, 0, 7); ctx.fillStyle = '#2a0d12'; ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(0, 18, 18, 0.2 * Math.PI, 0.8 * Math.PI); ctx.strokeStyle = '#111'; ctx.lineWidth = 5; ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

// =====================================================================
// SUBTITLES – karaoke style, current word highlighted
// =====================================================================
let CHUNKS = null;
function buildChunks() {
  ctx.font = '900 62px Montserrat';
  const MAXW = 720, MAXN = 4;
  const width = ws => ctx.measureText(ws.map(w => w.text).join(' ')).width;
  // split a sentence into the fewest chunks that fit, as evenly as possible
  const split = (ws) => {
    for (let k = 1; k <= ws.length; k++) {
      let best = null, bestMax = 1e9;
      const rec = (i, parts) => {
        if (parts.length === k - 1) {
          const last = ws.slice(i); if (!last.length) return;
          const all = [...parts, last];
          if (all.some(p => p.length > MAXN || width(p) > MAXW)) return;
          const m = Math.max(...all.map(width)); if (m < bestMax) { bestMax = m; best = all; }
          return;
        }
        for (let j = i + 1; j < ws.length; j++) rec(j, [...parts, ws.slice(i, j)]);
      };
      rec(0, []);
      if (best) return best;
    }
    return ws.map(w => [w]);
  };
  CHUNKS = [];
  for (const s of SCRIPT) {
    let sent = [];
    for (const w of s.words) { sent.push(w); if (/[.!?:]$/.test(w.text)) { CHUNKS.push(...split(sent)); sent = []; } }
    if (sent.length) CHUNKS.push(...split(sent));
  }
}
function drawSubtitles(t) {
  if (!CHUNKS) buildChunks();
  const cx = 640, cy = 1500;
  for (let i = 0; i < CHUNKS.length; i++) {
    const ch = CHUNKS[i], next = CHUNKS[i + 1];
    const a = ch[0].start - 0.05, b = Math.min(ch[ch.length - 1].end + 0.45, next ? next[0].start - 0.05 : 1e9);
    if (t < a || t >= b) continue;
    const p = prog(t, a, a + 0.15);
    ctx.save(); ctx.font = '900 62px Montserrat'; ctx.textBaseline = 'middle';
    const sp = ctx.measureText(' ').width + 8;
    const ws = ch.map(w => ctx.measureText(w.text).width);
    let x = cx - (ws.reduce((s, v) => s + v, 0) + sp * (ch.length - 1)) / 2;
    ctx.globalAlpha = p;
    ch.forEach((w, j) => {
      const on = t >= w.start && t < w.end + 0.05;
      const sc = on ? 1 + 0.08 * easeBack(prog(t, w.start, w.start + 0.12)) : 1;
      ctx.save(); ctx.translate(x + ws[j] / 2, cy + (1 - easeOut(p)) * 25); ctx.scale(sc, sc);
      ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = 14; ctx.strokeStyle = '#000';
      ctx.strokeText(w.text, 0, 0); ctx.fillStyle = on ? C.yellow : (t >= w.end ? '#fff' : 'rgba(255,255,255,0.75)');
      ctx.fillText(w.text, 0, 0); ctx.restore();
      x += ws[j] + sp;
    });
    ctx.restore();
  }
}

