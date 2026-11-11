// 2D cartoon puppets with blendable facial expressions and poses.
window.Puppet = (function () {
  const OUT = '#1b1035';
  const D2R = Math.PI / 180;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

  const ED = { eyeOpen: 1, squint: 0, pupil: 1, browY: 0, browA: 0, mouthCurve: .2, mouthOpen: 0, mouthW: .8, teeth: 0, tongue: 0, blush: 0, sweat: 0, tears: 0, wink: 0, tremble: 0, smug: 0, sparkle: 0, anger: 0 };
  const EX = {
    neutral: {},
    happy: { mouthCurve: .85, mouthOpen: .3, teeth: .7, browY: .25, eyeOpen: .95, blush: .3 },
    confident: { mouthCurve: .75, mouthOpen: .06, smug: .8, browY: .15, browA: -.25, eyeOpen: .78 },
    wink: { mouthCurve: .9, mouthOpen: .25, teeth: .8, smug: .6, browY: .3, browA: -.2, eyeOpen: .85, wink: 1 },
    smirk: { mouthCurve: .5, smug: 1, browY: .35, browA: -.35, eyeOpen: .72 },
    laugh: { squint: 1, mouthCurve: .9, mouthOpen: 1, mouthW: 1.25, teeth: .8, tongue: 1, browY: .55, browA: .35, blush: .9, tears: 1 },
    giggle: { squint: .8, mouthCurve: .8, mouthOpen: .55, mouthW: 1.05, teeth: .8, tongue: .5, browY: .4, blush: .6 },
    surprised: { eyeOpen: 1.25, pupil: .8, browY: .8, mouthOpen: .45, mouthW: .55, mouthCurve: 0 },
    worried: { browA: .8, browY: .25, mouthCurve: -.45, mouthOpen: .12, mouthW: .6, tremble: .6, sweat: .7, eyeOpen: 1.05, pupil: .85 },
    nervous: { mouthCurve: .35, mouthOpen: .35, teeth: 1, mouthW: 1.2, browA: .85, browY: .2, sweat: 1, tremble: .5, eyeOpen: 1.1, pupil: .75 },
    tense: { browA: .6, browY: -.1, mouthCurve: -.25, mouthOpen: .22, teeth: 1, mouthW: 1, sweat: .9, eyeOpen: 1.2, pupil: .6, tremble: .3 },
    pleading: { browA: 1, browY: .5, eyeOpen: 1.25, pupil: 1.3, sparkle: 1, mouthCurve: -.55, mouthOpen: .4, mouthW: .7, tremble: .4 },
    shock: { eyeOpen: 1.45, pupil: .5, browY: 1, browA: .2, mouthOpen: 1, mouthW: .6, mouthCurve: -.15, sweat: .6 },
    ecstatic: { eyeOpen: 1.15, sparkle: 1, mouthOpen: 1, mouthCurve: 1, mouthW: 1.3, teeth: .7, tongue: 1, browY: .85, blush: .8 },
    focused: { browA: -.55, browY: -.2, mouthCurve: .05, eyeOpen: .9, mouthW: .6 },
    angry: { browA: -1.1, browY: -.35, eyeOpen: .95, pupil: .8, mouthCurve: -.75, mouthOpen: .28, teeth: 1, mouthW: .95, tremble: .35, blush: .7, anger: 1 },
    despair: { browA: 1, browY: .1, eyeOpen: .75, mouthCurve: -.85, mouthOpen: .5, mouthW: .9, sweat: .5, tremble: .7 }
  };
  const PD = { lA: 12, lE: -10, rA: 12, rE: -10, lL: 5, lK: 0, rL: 5, rK: 0, lean: 0, headTilt: 0 };
  const POSES = {
    idle: {},
    giveL: { lA: 82, lE: -5 },
    takeR: { rA: 78, rE: -12 },
    thumbsUpR: { rA: 38, rE: 118 },
    pointL: { lA: 86, lE: 4, rA: 22, rE: -112 },
    pointR: { rA: 86, rE: 4, lA: 22, lE: -112 },
    bellyLaugh: { lA: 24, lE: -112, rA: 24, rE: -112, lL: 12, rL: 12 },
    cheer: { lA: 155, lE: 18, rA: 155, rE: 18, lL: 14, rL: 14 },
    fistPumpR: { rA: 42, rE: 128, lA: 20, lE: -30 },
    handsOnHead: { lA: 150, lE: 62, rA: 150, rE: 62 },
    nervous: { lA: 22, lE: -150, rA: 22, rE: -150 },
    pleading: { lA: 28, lE: -164, rA: 28, rE: -164 },
    crossed: { lA: 16, lE: -104, rA: 18, rE: -98 },
    phone: { rA: 24, rE: -132 },
    hips: { lA: 36, lE: -78, rA: 36, rE: -78, lL: 10, rL: 10 },
    holdCashUp: { rA: 130, rE: 30 },
    waveR: { rA: 150, rE: 20 },
    faint: { lA: 130, lE: 20, rA: 130, rE: 20, lean: -72, lL: 20, rL: 20 },
    giveBagR: { rA: 72, rE: -15, lA: -30, lE: -20 },
    holdBag: { rA: 160, rE: 10, lA: 150, lE: 20, lL: 14, rL: 14 }
  };
  const MD = { laugh: 0, tremble: 0, jump: 0, dance: 0, no: 0, wave: 0, walk: 0, sing: 0, lookX: 0, lookY: 0, dy: 0 };

  const lerp = (a, b, x) => a + (b - a) * x;
  function mix(a, b, x, def) { const o = {}; for (const k in def) o[k] = lerp(a[k] ?? def[k], b[k] ?? def[k], x); return o; }
  const expr = (name, ov) => Object.assign({}, ED, EX[name] || {}, ov || {});
  const pose = (name, ov) => Object.assign({}, PD, POSES[name] || {}, ov || {});

  // Resolve keyframed acting into a state at local time lt.
  // keys: [[fraction, {e, p, m, ex, po, propL, propR, handL, handR, hat}], ...]
  function stateAt(keys, lt, d, trans = .3) {
    let tgt = { e: 'neutral', p: 'idle', m: {}, ex: {}, po: {}, propL: null, propR: null, handL: null, handR: null, hat: null };
    let prev = null, prevT = -1e9;
    const resolved = [];
    for (const [f, k] of keys) {
      const n = Object.assign({}, tgt, k);
      n.m = Object.assign({}, tgt.m, k.m || {});
      if (k.e) n.ex = k.ex || {}; else if (k.ex) n.ex = Object.assign({}, tgt.ex, k.ex);
      if (k.p) n.po = k.po || {}; else if (k.po) n.po = Object.assign({}, tgt.po, k.po);
      resolved.push([f * d, n]); tgt = n;
    }
    let cur = resolved[0][1], from = cur, tk = -1e9;
    for (const [t, n] of resolved) { if (t <= lt) { from = cur; cur = n; tk = t; } }
    const x = clamp((lt - tk) / trans); const s = x * x * (3 - 2 * x);
    return {
      e: mix(expr(from.e, from.ex), expr(cur.e, cur.ex), s, ED),
      p: mix(pose(from.p, from.po), pose(cur.p, cur.po), s, PD),
      m: mix(Object.assign({}, MD, from.m), Object.assign({}, MD, cur.m), s, MD),
      propL: cur.propL, propR: cur.propR, handL: cur.handL, handR: cur.handR, hat: cur.hat
    };
  }

  // ---------- drawing ----------
  function stroke(ctx, w, c) { ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke(); }
  function limb(ctx, x0, y0, a1, l1, a2, l2, side, wOut, wIn, c1, c2) {
    const x1 = x0 + Math.sin(a1 * D2R) * side * l1, y1 = y0 + Math.cos(a1 * D2R) * l1;
    const x2 = x1 + Math.sin(a2 * D2R) * side * l2, y2 = y1 + Math.cos(a2 * D2R) * l2;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); stroke(ctx, wOut, OUT);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); stroke(ctx, wIn, c2);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); stroke(ctx, wIn + 2, c1);
    return { x1, y1, x2, y2, ang: a2 };
  }
  function circle(ctx, x, y, r, fill, lw = 6) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); if (lw) stroke(ctx, lw, OUT); }
  function ellipse(ctx, x, y, rx, ry, fill, lw = 6, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(rx, .1), Math.max(ry, .1), rot, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (lw) stroke(ctx, lw, OUT); }

  function drawProp(ctx, kind, x, y, t, ang) {
    if (!kind) return;
    ctx.save(); ctx.translate(x, y);
    if (kind === 'cash' || kind === 'cashFan') {
      const wig = kind === 'cashFan' ? Math.sin(t * 10) * .12 : 0;
      for (let i = -1; i <= 1; i++) {
        ctx.save(); ctx.rotate(i * .32 + wig - .2); ctx.translate(0, -34);
        ctx.beginPath(); ctx.roundRect(-26, -44, 52, 88, 6); ctx.fillStyle = '#4cc26a'; ctx.fill(); stroke(ctx, 5, OUT);
        ctx.beginPath(); ctx.roundRect(-17, -35, 34, 70, 4); stroke(ctx, 3, '#2a7a40');
        ctx.fillStyle = '#1e5c30'; ctx.font = '900 34px Inter Display'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText((window.BETCFG && window.BETCFG.cur) || '£', 0, 2);
        ctx.restore();
      }
    } else if (kind === 'slip') {
      ctx.rotate(-.2); ctx.beginPath(); ctx.roundRect(-30, -80, 60, 84, 4); ctx.fillStyle = '#fff'; ctx.fill(); stroke(ctx, 5, OUT);
      ctx.fillStyle = '#7b5cff'; ctx.fillRect(-20, -68, 40, 8); ctx.fillStyle = '#bbb'; ctx.fillRect(-20, -52, 34, 5); ctx.fillRect(-20, -42, 28, 5);
      ctx.fillStyle = '#e8364f'; ctx.font = '900 16px Inter Display'; ctx.textAlign = 'center'; ctx.fillText((window.BETCFG && window.BETCFG.slip) || '5000/1', 0, -16);
    } else if (kind === 'phone' || kind === 'phoneRing') {
      if (kind === 'phoneRing') { ctx.rotate(Math.sin(t * 50) * .12); }
      ctx.beginPath(); ctx.roundRect(-26, -84, 52, 92, 10); ctx.fillStyle = '#20233a'; ctx.fill(); stroke(ctx, 5, OUT);
      ctx.beginPath(); ctx.roundRect(-19, -76, 38, 72, 5); ctx.fillStyle = kind === 'phoneRing' && Math.sin(t * 14) > 0 ? '#7dffb0' : '#5ad0ff'; ctx.fill();
      if (kind === 'phoneRing') {
        ctx.strokeStyle = '#ffd400'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        for (let k = 1; k <= 2; k++) { ctx.beginPath(); ctx.arc(0, -40, 40 + k * 16, -.7, .7); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -40, 40 + k * 16, Math.PI - .7, Math.PI + .7); ctx.stroke(); }
      }
    } else if (kind === 'scarf') {
      ctx.rotate(Math.sin(t * 4) * .25 - .3);
      for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.rect(-14, -40 - k * 34, 28, 34); const sc = window.SCARF || ['#c8102e', '#ffffff']; ctx.fillStyle = k % 2 ? sc[1] : sc[0]; ctx.fill(); stroke(ctx, 4, OUT); }
    } else if (kind === 'shirt10' || kind === 'shirt100') {
      ctx.rotate(-.1);
      const sh = new Path2D(); sh.moveTo(-40, -110); sh.lineTo(-70, -90); sh.lineTo(-58, -60); sh.lineTo(-44, -66); sh.lineTo(-44, 0); sh.lineTo(44, 0); sh.lineTo(44, -66); sh.lineTo(58, -60); sh.lineTo(70, -90); sh.lineTo(40, -110); sh.quadraticCurveTo(0, -90, -40, -110); sh.closePath();
      ctx.fillStyle = '#a50044'; ctx.fill(sh); ctx.save(); ctx.clip(sh); ctx.fillStyle = '#004d98'; for (let k = -2; k <= 2; k += 2) ctx.fillRect(k * 18 - 9, -115, 18, 120); ctx.restore();
      ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke(sh);
      ctx.beginPath(); ctx.roundRect(20, -40, 80, 44, 10); ctx.fillStyle = '#ffd400'; ctx.fill(); stroke(ctx, 5, OUT);
      ctx.fillStyle = OUT; ctx.font = '900 26px Inter Display'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(kind === 'shirt10' ? '€10' : '€100', 60, -17);
    } else if (kind === 'cup') {
      if (window.drawJulesRimet) window.drawJulesRimet(ctx, 0, -10, 1.25, t);
    } else if (kind === 'yellow') {
      ctx.rotate(-.15); ctx.beginPath(); ctx.roundRect(-24, -96, 48, 70, 6); ctx.fillStyle = '#ffd400'; ctx.fill(); stroke(ctx, 5, OUT);
    } else if (kind === 'bottle') {
      ctx.rotate(-.2); ctx.beginPath(); ctx.roundRect(-16, -110, 32, 90, 10); ctx.fillStyle = '#4fbaf5'; ctx.fill(); stroke(ctx, 5, OUT);
      ctx.beginPath(); ctx.roundRect(-9, -128, 18, 20, 4); ctx.fillStyle = '#fff'; ctx.fill(); stroke(ctx, 4, OUT);
    } else if (kind === 'coat') {
      ctx.rotate(.15);
      ctx.beginPath(); ctx.moveTo(-10, -6); ctx.lineTo(-58, 20); ctx.lineTo(-64, 170); ctx.lineTo(48, 170); ctx.lineTo(44, 20); ctx.lineTo(10, -6); ctx.closePath();
      ctx.fillStyle = '#7a5236'; ctx.fill(); stroke(ctx, 6, OUT);
      ctx.beginPath(); ctx.moveTo(-10, -6); ctx.lineTo(-4, 60); ctx.lineTo(10, -6); ctx.fillStyle = '#5c3c26'; ctx.fill(); stroke(ctx, 4, OUT);
    } else if (kind === 'radio') {
      ctx.beginPath(); ctx.moveTo(18, -40); ctx.lineTo(48, -110); stroke(ctx, 5, OUT);
      ctx.beginPath(); ctx.roundRect(-46, -44, 92, 60, 10); ctx.fillStyle = '#c94f3a'; ctx.fill(); stroke(ctx, 6, OUT);
      circle(ctx, -18, -14, 17, '#2a2a3a', 4); ctx.fillStyle = '#ffe9a8'; ctx.fillRect(8, -32, 30, 14); stroke(ctx, 0, OUT);
      ctx.strokeStyle = '#ffd400'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let k = 1; k <= 2; k++) { ctx.beginPath(); ctx.arc(-18, -14, 24 + k * 14 + (t * 30 % 14), -.8, .8); ctx.globalAlpha = .7; ctx.stroke(); ctx.globalAlpha = 1; }
    } else if (kind === 'bag') {
      ctx.beginPath(); ctx.moveTo(-22, 4); ctx.quadraticCurveTo(-95, 60, -80, 120); ctx.quadraticCurveTo(-60, 175, 0, 175);
      ctx.quadraticCurveTo(60, 175, 80, 120); ctx.quadraticCurveTo(95, 60, 22, 4); ctx.closePath();
      ctx.fillStyle = '#c98a3c'; ctx.fill(); stroke(ctx, 6, OUT);
      ctx.beginPath(); ctx.ellipse(0, 6, 30, 12, 0, 0, Math.PI * 2); ctx.fillStyle = '#a86c26'; ctx.fill(); stroke(ctx, 5, OUT);
      ctx.fillStyle = '#ffd400'; ctx.strokeStyle = OUT; ctx.lineWidth = 6; ctx.font = '900 84px Inter Display'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const cs = (window.BETCFG && window.BETCFG.cur) || '£'; ctx.strokeText(cs, 0, 105); ctx.fillText(cs, 0, 105);
    }
    ctx.restore();
  }

  function hand(ctx, x, y, skin, kind, side, ang) {
    circle(ctx, x, y, 19, skin, 6);
    if (kind === 'thumb') {
      // clear thumbs-up: thumb tilted to the side, curled fingers drawn on the fist
      ctx.save(); ctx.translate(x + 12 * side, y - 12); ctx.rotate(-.45 * side);
      ctx.beginPath(); ctx.roundRect(-9, -34, 18, 34, 9); ctx.fillStyle = skin; ctx.fill(); stroke(ctx, 5, OUT); ctx.restore();
      ctx.beginPath(); for (let k = -1; k <= 1; k++) { ctx.moveTo(x - 14, y + k * 8); ctx.lineTo(x + 6, y + k * 8); } ctx.lineCap = 'round'; stroke(ctx, 3.5, OUT);
    }
    if (kind === 'fist') { ctx.beginPath(); ctx.moveTo(x - 10, y - 6); ctx.lineTo(x + 10, y - 6); stroke(ctx, 4, OUT); }
  }

  function hair(ctx, ch, R) {
    const c = ch.hairColor;
    ctx.save();
    if (ch.hair === 'spiky') {
      ctx.beginPath(); ctx.moveTo(-R * .98, -10);
      const pts = [[-R * .95, -R * .7], [-R * .75, -R * 1.25], [-R * .45, -R * .95], [-R * .2, -R * 1.42], [R * .05, -R * 1.0], [R * .35, -R * 1.38], [R * .5, -R * .95], [R * .85, -R * 1.18], [R * .9, -R * .62], [R * .98, -10]];
      pts.forEach(p => ctx.lineTo(p[0], p[1]));
      ctx.quadraticCurveTo(R * .6, -R * .55, 0, -R * .6); ctx.quadraticCurveTo(-R * .6, -R * .55, -R * .98, -10);
      ctx.fillStyle = c; ctx.fill(); stroke(ctx, 6, OUT);
    } else if (ch.hair === 'slick') {
      ctx.beginPath(); ctx.moveTo(-R * .98, -5); ctx.quadraticCurveTo(-R * 1.05, -R * 1.1, 0, -R * 1.08); ctx.quadraticCurveTo(R * 1.05, -R * 1.1, R * .98, -5);
      ctx.quadraticCurveTo(R * .8, -R * .55, R * .1, -R * .62); ctx.quadraticCurveTo(-R * .3, -R * .75, -R * .98, -5);
      ctx.fillStyle = c; ctx.fill(); stroke(ctx, 6, OUT);
      ctx.beginPath(); ctx.moveTo(-R * .2, -R * 1.02); ctx.quadraticCurveTo(-R * .1, -R * .8, R * .15, -R * .66); stroke(ctx, 4, 'rgba(255,255,255,.35)');
    } else if (ch.hair === 'cap') {
      ctx.beginPath(); ctx.moveTo(-R * 1.0, -R * .28); ctx.quadraticCurveTo(-R * 1.0, -R * 1.18, 0, -R * 1.15); ctx.quadraticCurveTo(R * 1.0, -R * 1.18, R * 1.0, -R * .28); ctx.closePath();
      ctx.fillStyle = ch.capColor; ctx.fill(); stroke(ctx, 6, OUT);
      ctx.beginPath(); ctx.ellipse(R * .25, -R * .3, R * .95, R * .2, -.05, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fillStyle = ch.capColor; ctx.fill(); stroke(ctx, 6, OUT);
      circle(ctx, 0, -R * 1.13, 9, ch.capColor, 5);
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(-R * .92, -R * .1, 12, 26, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(R * .92, -R * .1, 12, 26, 0, 0, Math.PI * 2); ctx.fill();
    } else if (ch.hair === 'short') {
      ctx.beginPath(); ctx.moveTo(-R * .97, -R * .1); ctx.quadraticCurveTo(-R * 1.02, -R * 1.08, 0, -R * 1.07); ctx.quadraticCurveTo(R * 1.02, -R * 1.08, R * .97, -R * .1);
      ctx.quadraticCurveTo(R * .85, -R * .5, R * .35, -R * .62); ctx.quadraticCurveTo(0, -R * .5, -R * .35, -R * .62); ctx.quadraticCurveTo(-R * .85, -R * .5, -R * .97, -R * .1);
      ctx.fillStyle = c; ctx.fill(); stroke(ctx, 6, OUT);
    } else if (ch.hair === 'buzz') {
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R - 3, 0, Math.PI * 2); ctx.clip();
      ctx.beginPath(); ctx.ellipse(0, -R * .95, R * 1.05, R * .55, 0, 0, Math.PI * 2); ctx.fillStyle = c; ctx.globalAlpha = .55; ctx.fill(); ctx.restore();
    } else if (ch.hair === 'helmet') {
      ctx.beginPath(); ctx.moveTo(-R * .95, -R * .35); ctx.quadraticCurveTo(-R * .9, -R * 1.6, 0, -R * 1.75); ctx.quadraticCurveTo(R * .9, -R * 1.6, R * .95, -R * .35); ctx.closePath();
      ctx.fillStyle = '#1b2348'; ctx.fill(); stroke(ctx, 6, OUT);
      ctx.beginPath(); ctx.ellipse(0, -R * .38, R * 1.05, R * .14, 0, 0, Math.PI * 2); ctx.fillStyle = '#1b2348'; ctx.fill(); stroke(ctx, 5, OUT);
      circle(ctx, 0, -R * 1.05, 14, '#e0b84a', 4);
    } else if (ch.hair === 'bald') {
      ctx.beginPath(); ctx.ellipse(-R * .35, -R * .6, 22, 12, -.5, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fill();
    }
    ctx.restore();
  }

  function santa(ctx, R, t) {
    ctx.beginPath(); ctx.moveTo(-R * .95, -R * .55); ctx.quadraticCurveTo(-R * .4, -R * 1.9, R * .9, -R * 1.45 + Math.sin(t * 3) * 6); ctx.quadraticCurveTo(R * .3, -R * 1.2, R * .95, -R * .55); ctx.closePath();
    ctx.fillStyle = '#e8243b'; ctx.fill(); stroke(ctx, 6, OUT);
    ctx.beginPath(); ctx.roundRect(-R * 1.05, -R * .78, R * 2.1, 38, 19); ctx.fillStyle = '#fff'; ctx.fill(); stroke(ctx, 6, OUT);
    circle(ctx, R * .92, -R * 1.45 + Math.sin(t * 3) * 6, 18, '#fff', 6);
  }

  function face(ctx, ch, e, m, t, R) {
    const fx = m.lookX * 12, fy = m.lookY * 6;
    const blinkP = ((t + (ch.blinkPh || 0)) % 3.6);
    const blink = blinkP < .12 ? Math.sin(blinkP / .12 * Math.PI) : 0;
    // brows
    for (const i of [-1, 1]) {
      const base = fy - 46 - e.browY * 16 - (ch.mustache ? 4 : 0);
      const smugR = i === 1 ? e.smug * 8 : 0;
      ctx.beginPath(); ctx.moveTo(fx + i * 14, base - e.browA * 14 - smugR); ctx.lineTo(fx + i * 50, base + e.browA * 6 - smugR * 1.5);
      ctx.lineCap = 'round'; stroke(ctx, 10, ch.browColor || OUT);
    }
    // eyes
    for (const i of [-1, 1]) {
      const ex = fx + i * 32, ey = fy - 8;
      const closed = e.squint > .5 || (i === 1 && e.wink > .5);
      if (closed) {
        ctx.beginPath();
        if (e.squint > .5) { ctx.moveTo(ex - 18, ey + 6); ctx.lineTo(ex, ey - 10); ctx.lineTo(ex + 18, ey + 6); }
        else { ctx.arc(ex, ey - 4, 16, Math.PI * .15, Math.PI * .85); }
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; stroke(ctx, 7, OUT);
        continue;
      }
      const ry = Math.max(2, 25 * e.eyeOpen * (1 - blink)), rx = 20 * (1 + (e.eyeOpen - 1) * .4);
      ellipse(ctx, ex, ey, rx, ry, '#fff', 5);
      if (ry > 5) {
        ctx.save(); ctx.beginPath(); ctx.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2); ctx.clip();
        const px = ex + m.lookX * 8, py = ey + m.lookY * 9 + (e.eyeOpen > 1.3 ? 0 : 2);
        circle(ctx, px, py, 11 * e.pupil, '#1b1035', 0);
        circle(ctx, px + 4, py - 5, 3.5 + e.sparkle * 2.5, '#fff', 0);
        if (e.sparkle > .3) circle(ctx, px - 4, py + 4, 2 * e.sparkle, '#fff', 0);
        ctx.restore();
        if (e.eyeOpen < .85) { // heavy lids for confident/smug
          ctx.save(); ctx.beginPath(); ctx.ellipse(ex, ey, rx + 1, ry + 1, 0, 0, Math.PI * 2); ctx.clip();
          ctx.fillStyle = ch.skin; ctx.fillRect(ex - rx - 2, ey - ry - 2, rx * 2 + 4, ry * (1 - e.eyeOpen / .85) * 2 + 8);
          ctx.restore();
          ctx.beginPath(); ctx.moveTo(ex - rx, ey - ry + ry * (1 - e.eyeOpen / .85) * 2 + 6); ctx.lineTo(ex + rx, ey - ry + ry * (1 - e.eyeOpen / .85) * 2 + 6); stroke(ctx, 5, OUT);
        }
      }
    }
    if (ch.glasses) { for (const i of [-1, 1]) ellipse(ctx, fx + i * 32, fy - 8, 30, 28, null, 5); ctx.beginPath(); ctx.moveTo(fx - 3, fy - 10); ctx.lineTo(fx + 3, fy - 10); stroke(ctx, 5, OUT); }
    // nose
    ctx.beginPath(); ctx.arc(fx + m.lookX * 4, fy + 16, 9, Math.PI * .1, Math.PI * .9); stroke(ctx, 5, OUT);
    // blush
    if (e.blush > .02) for (const i of [-1, 1]) ellipse(ctx, fx + i * 52, fy + 26, 17, 9, `rgba(255,90,130,${.5 * e.blush})`, 0);
    if (ch.stubble) {
      ctx.save(); ctx.globalAlpha = .28; ctx.beginPath(); ctx.moveTo(-R * .9, 0); ctx.quadraticCurveTo(-R * .85, R * 1.05, 0, R * 1.0); ctx.quadraticCurveTo(R * .85, R * 1.05, R * .9, 0);
      ctx.quadraticCurveTo(R * .5, R * .3, 0, fy + 24); ctx.quadraticCurveTo(-R * .5, R * .3, -R * .9, 0); ctx.fillStyle = ch.hairColor; ctx.fill(); ctx.restore();
    }
    // beard
    if (ch.beard) {
      ctx.beginPath(); ctx.moveTo(-R * .92, -5); ctx.quadraticCurveTo(-R * .9, R * 1.15, 0, R * 1.08); ctx.quadraticCurveTo(R * .9, R * 1.15, R * .92, -5);
      ctx.quadraticCurveTo(R * .5, R * .25, fx, fy + 22); ctx.quadraticCurveTo(-R * .5, R * .25, -R * .92, -5);
      ctx.fillStyle = ch.hairColor; ctx.fill(); stroke(ctx, 6, OUT);
    }
    // mouth
    const mx = fx, my = fy + 46 + (ch.beard ? 4 : 0);
    const w = 44 * e.mouthW, c = e.mouthCurve, o = e.mouthOpen;
    const wob = Math.sin(t * 38) * 3 * e.tremble;
    const lY = -c * 16 + e.smug * 4, rY = -c * 16 - e.smug * 12;
    if (o < .06) {
      ctx.beginPath(); ctx.moveTo(mx - w, my + lY); ctx.quadraticCurveTo(mx, my + c * 26 + wob, mx + w, my + rY);
      ctx.lineCap = 'round'; stroke(ctx, 7, OUT);
    } else {
      // keep the mouth shape in its own path so the outline always follows it
      const mp = new Path2D(); mp.moveTo(mx - w, my + lY);
      mp.quadraticCurveTo(mx, my + c * 10 - o * 14 + wob, mx + w, my + rY);
      mp.quadraticCurveTo(mx, my + c * 26 + o * 78 - wob, mx - w, my + lY); mp.closePath();
      ctx.fillStyle = '#5a0d24'; ctx.fill(mp);
      ctx.save(); ctx.clip(mp);
      if (e.tongue > .05) ellipse(ctx, mx, my + c * 18 + o * 50, w * .6, 22 * e.tongue, '#ff6b8a', 0);
      if (e.teeth > .05) { ctx.fillStyle = '#fff'; ctx.fillRect(mx - w, my - 40, w * 2, 40 + c * 6 - o * 6 + 16 * e.teeth); }
      ctx.restore();
      ctx.lineJoin = 'round'; ctx.lineWidth = 7; ctx.strokeStyle = OUT; ctx.stroke(mp);
    }
    if (ch.mustache) {
      ctx.beginPath(); ctx.moveTo(mx, my - 18); ctx.quadraticCurveTo(mx - 30, my - 34, mx - 56, my - 8); ctx.quadraticCurveTo(mx - 30, my - 14, mx, my - 6);
      ctx.quadraticCurveTo(mx + 30, my - 14, mx + 56, my - 8); ctx.quadraticCurveTo(mx + 30, my - 34, mx, my - 18);
      ctx.fillStyle = ch.hairColor; ctx.fill(); stroke(ctx, 5, OUT);
    }
    // sweat
    if (e.sweat > .05) {
      for (const k of [0, .5]) {
        const ph = ((t * .8 + k) % 1), sx = R * .78 - k * R * 1.6, sy = -R * .35 + ph * 60;
        ctx.globalAlpha = e.sweat * (1 - ph * .6);
        ctx.beginPath(); ctx.moveTo(sx, sy - 22); ctx.quadraticCurveTo(sx + 14, sy, sx, sy + 10); ctx.quadraticCurveTo(sx - 14, sy, sx, sy - 22);
        ctx.fillStyle = '#7fd8ff'; ctx.fill(); stroke(ctx, 4, OUT); ctx.globalAlpha = 1;
      }
    }
    // anger mark on the forehead
    if (e.anger > .3) {
      ctx.save(); ctx.translate(R * .5, -R * .62); const k = 1 + .12 * Math.sin(t * 9); ctx.scale(k * e.anger, k * e.anger);
      ctx.strokeStyle = '#e8243b'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.beginPath(); ctx.moveTo(sx * 5, sy * 20); ctx.quadraticCurveTo(sx * 5, sy * 5, sx * 20, sy * 5); ctx.stroke(); }
      ctx.restore();
    }
    // laughing tears
    if (e.tears > .05) {
      for (const i of [-1, 1]) for (let k = 0; k < 3; k++) {
        const ph = (t * 2.4 + k / 3) % 1;
        const x = fx + i * (52 + ph * 70), y = fy - 4 - Math.sin(ph * Math.PI) * 34 + ph * 46;
        ctx.globalAlpha = e.tears * (1 - ph);
        ctx.beginPath(); ctx.arc(x, y, 8 * (1 - ph * .4), 0, Math.PI * 2); ctx.fillStyle = '#7fd8ff'; ctx.fill(); stroke(ctx, 3, OUT);
        ctx.globalAlpha = 1;
      }
    }
  }

  // Draw a character; ch has x, y (ground), scale and look; st from stateAt().
  function draw(ctx, ch, st, t) {
    let { e, m } = st; const p = Object.assign({}, st.p);
    const s = ch.scale || 1, bw = ch.bw || 1;
    const laughB = m.laugh * Math.abs(Math.sin(t * 15 + (ch.blinkPh || 0))) * -16;
    const jumpPh = Math.abs(Math.sin(t * 5.2 + (ch.blinkPh || 0)));
    const jumpB = -m.jump * jumpPh * 120;
    const danceX = m.dance * Math.sin(t * 6.5) * 22;
    const trem = (m.tremble + e.tremble * .4) * Math.sin(t * 57) * 3;
    p.lean += m.dance * Math.sin(t * 6.5) * 6;
    p.headTilt += m.dance * Math.sin(t * 6.5 + 1) * 8 + m.laugh * Math.sin(t * 7) * 6;
    if (m.dance > 0) { p.lA += m.dance * (Math.sin(t * 6.5) * 25); p.rA += m.dance * (-Math.sin(t * 6.5) * 25); }
    const lookX = m.lookX + m.no * Math.sin(t * 11) * .9;
    p.rE += m.wave * Math.sin(t * 12) * 28;
    if (m.walk > 0) {
      // natural front-view walk: legs stay under the hips, one knee lifts at a time, arms swing opposite
      const w = Math.sin(t * 8), up = Math.max(0, w), dn = Math.max(0, -w);
      p.lL += (4 - up * 6) * m.walk; p.rL += (4 - dn * 6) * m.walk;
      p.lK -= up * 38 * m.walk; p.rK -= dn * 38 * m.walk;
      p.lA += -w * 10 * m.walk; p.rA += w * 10 * m.walk;
      m = Object.assign({}, m, { dy: m.dy - Math.abs(w) * 7 * m.walk });
    }
    if (m.sing > 0) { e = Object.assign({}, e, { mouthOpen: e.mouthOpen + (.35 + .3 * Math.sin(t * 7)) * m.sing, squint: Math.max(e.squint, .8 * m.sing) }); p.headTilt += Math.sin(t * 3) * 8 * m.sing; p.lean += Math.sin(t * 3) * 4 * m.sing; }
    const tuck = m.jump * jumpPh;
    p.lL += tuck * 5; p.rL += tuck * 5; p.lK -= tuck * 28; p.rK -= tuck * 28;

    const hipY = -185, sY = -375, headY = sY - 84 + laughB * .6, R = 88;
    const tw = 64 * bw, bwid = 56 * bw;
    ctx.save();
    ctx.translate(ch.x, ch.y);
    // shadow
    ctx.save(); ctx.scale(1, .22); ctx.beginPath(); ctx.arc(0, 0, (95 * bw) * s * (1 - tuck * .25), 0, Math.PI * 2); ctx.fillStyle = 'rgba(10,0,30,.35)'; ctx.fill(); ctx.restore();
    ctx.translate(danceX + trem, jumpB + m.dy + laughB * .3);
    ctx.rotate(p.lean * D2R);
    ctx.scale(s, s);
    // legs
    for (const side of [-1, 1]) {
      const L = side < 0 ? 'l' : 'r';
      const k = limb(ctx, side * 28 * bw, hipY, p[L + 'L'], 95, p[L + 'L'] + p[L + 'K'], 92, side, 44, 32, ch.pants, ch.pants);
      ellipse(ctx, k.x2 + side * 16, k.y2 + 4, 34, 17, ch.shoes, 6);
    }
    // neck + torso
    ctx.beginPath(); ctx.roundRect(-18, sY - 30, 36, 40, 8); ctx.fillStyle = ch.skin; ctx.fill(); stroke(ctx, 6, OUT);
    const bulge = (bw - 1) * 60 + 6;
    ctx.beginPath(); ctx.moveTo(-tw + 20, sY); ctx.lineTo(tw - 20, sY); ctx.quadraticCurveTo(tw, sY, tw, sY + 22);
    ctx.quadraticCurveTo(tw + bulge, (sY + hipY) / 2 + 30, bwid, hipY + 14); ctx.lineTo(-bwid, hipY + 14);
    ctx.quadraticCurveTo(-tw - bulge, (sY + hipY) / 2 + 30, -tw, sY + 22); ctx.quadraticCurveTo(-tw, sY, -tw + 20, sY); ctx.closePath();
    ctx.fillStyle = ch.shirt; ctx.fill();
    if (ch.band) { ctx.save(); ctx.clip(); ctx.fillStyle = '#ffffff'; ctx.fillRect(-27, sY - 10, 54, hipY - sY + 40); ctx.fillStyle = ch.band; ctx.fillRect(-20, sY - 10, 40, hipY - sY + 40); ctx.restore(); }
    if (ch.stripes) {
      ctx.save(); ctx.clip(); ctx.fillStyle = ch.stripes;
      for (let k = -4; k <= 4; k++) if (k % 2) ctx.fillRect(k * 26 - 13, sY - 10, 26, hipY - sY + 40);
      ctx.restore();
    }
    if (ch.vest) {
      ctx.save(); ctx.clip();
      ctx.fillStyle = ch.vest; ctx.beginPath(); ctx.moveTo(-tw - 40, sY); ctx.lineTo(-14, sY); ctx.lineTo(0, sY + 120); ctx.lineTo(14, sY); ctx.lineTo(tw + 40, sY); ctx.lineTo(tw + 40, hipY + 20); ctx.lineTo(-tw - 40, hipY + 20); ctx.closePath(); ctx.fill();
      for (let k = 0; k < 3; k++) circle(ctx, 0, sY + 140 + k * 26, 5, '#ffd400', 3);
      ctx.restore();
    }
    ctx.beginPath(); ctx.moveTo(-tw + 20, sY); ctx.lineTo(tw - 20, sY); ctx.quadraticCurveTo(tw, sY, tw, sY + 22);
    ctx.quadraticCurveTo(tw + bulge, (sY + hipY) / 2 + 30, bwid, hipY + 14); ctx.lineTo(-bwid, hipY + 14);
    ctx.quadraticCurveTo(-tw - bulge, (sY + hipY) / 2 + 30, -tw, sY + 22); ctx.quadraticCurveTo(-tw, sY, -tw + 20, sY); ctx.closePath();
    ctx.lineJoin = 'round'; stroke(ctx, 7, OUT);
    // collar
    ctx.beginPath(); ctx.moveTo(-22, sY); ctx.lineTo(0, sY + 30); ctx.lineTo(22, sY); ctx.fillStyle = ch.trim || 'rgba(255,255,255,.7)'; ctx.fill(); stroke(ctx, 5, OUT);
    if (ch.bowtie) { ctx.beginPath(); ctx.moveTo(0, sY + 12); ctx.lineTo(-24, sY); ctx.lineTo(-24, sY + 26); ctx.closePath(); ctx.moveTo(0, sY + 12); ctx.lineTo(24, sY); ctx.lineTo(24, sY + 26); ctx.closePath(); ctx.fillStyle = ch.bowtie; ctx.fill(); stroke(ctx, 4, OUT); }
    if (ch.number) {
      ctx.font = '900 92px Inter Display'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 8; ctx.strokeStyle = OUT; ctx.strokeText(ch.number, 0, sY + 104); ctx.fillStyle = ch.trim || '#fff'; ctx.fillText(ch.number, 0, sY + 104);
    }
    // belt
    ctx.beginPath(); ctx.roundRect(-bwid - 2, hipY - 4, bwid * 2 + 4, 24, 6); ctx.fillStyle = ch.pants; ctx.fill(); stroke(ctx, 6, OUT);

    // head
    ctx.save(); ctx.translate(0, headY); ctx.rotate(p.headTilt * D2R);
    for (const i of [-1, 1]) circle(ctx, i * R * .96, 8, 19, ch.skin, 6);
    circle(ctx, 0, 0, R, ch.skin, 7);
    face(ctx, ch, e, Object.assign({}, m, { lookX }), t, R);
    hair(ctx, ch, R);
    if (st.hat === 'santa') santa(ctx, R, t);
    ctx.restore();

    // arms (in front)
    for (const side of [-1, 1]) {
      const L = side < 0 ? 'l' : 'r';
      const a = limb(ctx, side * (tw - 8), sY + 24, p[L + 'A'], 92, p[L + 'A'] + p[L + 'E'], 88, side, 34, 24, ch.shirt, ch.skin);
      hand(ctx, a.x2, a.y2, ch.gloves || ch.skin, side < 0 ? st.handL : st.handR, side, a.ang);
      drawProp(ctx, side < 0 ? st.propL : st.propR, a.x2, a.y2, t, a.ang);
    }
    ctx.restore();
  }

  return { draw, stateAt, EX, POSES };
})();
