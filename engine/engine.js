// Frame-deterministic motion-graphics engine for vertical football videos.
// window.setup(spec) builds all scenes, window.frame(t) renders the frame at time t (seconds).
(function () {
  const W = 1080, H = 1920;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const eo = x => 1 - Math.pow(1 - x, 3);
  const eb = x => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const lerp = (a, b, x) => a + (b - a) * x;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hl = s => esc(s).replace(/\*(.+?)\*/g, '<span class="hl">$1</span>');
  function el(tag, cls, html, parent) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }
  function rnd(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function fit(e, maxW, minPx = 40) {
    let fs = parseFloat(getComputedStyle(e).fontSize);
    while (Math.max(e.getBoundingClientRect().width, e.scrollWidth) > maxW && fs > minPx) { fs -= 2; e.style.fontSize = fs + 'px'; }
  }
  // Split "*marked* words" into tokens with highlight flags (markers may span several words).
  function tokens(text) {
    const out = []; let on = false;
    for (let w of text.split(/\s+/).filter(Boolean)) {
      let k = on;
      if (w.startsWith('*')) { k = true; on = true; w = w.slice(1); }
      if (w.endsWith('*')) { on = false; w = w.slice(0, -1); }
      out.push({ w, k });
    }
    return out;
  }
  const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };

  const BALL = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="url(#gold)"/>' +
    '<polygon points="50,34 65.2,45 59.4,62.9 40.6,62.9 34.8,45" fill="rgba(110,60,0,.55)"/>' +
    '<g stroke="rgba(110,60,0,.5)" stroke-width="3" fill="none"><line x1="50" y1="34" x2="50" y2="5"/><line x1="65.2" y1="45" x2="93" y2="36"/>' +
    '<line x1="59.4" y1="62.9" x2="77" y2="87"/><line x1="40.6" y1="62.9" x2="23" y2="87"/><line x1="34.8" y1="45" x2="7" y2="36"/></g>' +
    '<ellipse cx="36" cy="28" rx="14" ry="8" fill="rgba(255,255,255,.55)"/></svg>';
  const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>';
  const CROSS = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const ring = (r, w) => `<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="${r}" fill="#05070d" stroke="rgba(255,255,255,.15)" stroke-width="${w}"/>` +
    `<circle class="arc" cx="100" cy="100" r="${r}" fill="none" stroke="var(--acc)" stroke-width="${w}" stroke-linecap="round" transform="rotate(-90 100 100)" stroke-dasharray="${2 * Math.PI * r}" stroke-dashoffset="0"/></svg>`;

  // ---------- background ----------
  const bg = document.getElementById('bg'), cx = bg.getContext('2d');
  const R = rnd(7);
  const parts = [...Array(70)].map(() => ({ x: R() * W, y: R() * H, s: 1.5 + R() * 3.5, v: 15 + R() * 60, a: .08 + R() * .25, ph: R() * 6.28 }));
  function drawBg(t, acc, acc2) {
    cx.fillStyle = '#05070d'; cx.fillRect(0, 0, W, H);
    let g = cx.createRadialGradient(540 + Math.sin(t * .4) * 160, 260, 0, 540, 260, 1250);
    g.addColorStop(0, hexA(acc, .34)); g.addColorStop(1, hexA(acc, 0)); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    g = cx.createRadialGradient(540 + Math.cos(t * .3) * 220, 1850, 0, 540, 1850, 1150);
    g.addColorStop(0, hexA(acc2, .2)); g.addColorStop(1, hexA(acc2, 0)); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    // perspective pitch with mowing stripes
    const hy = 1050, topW = 700, botW = 2600, n = 10;
    const xAt = (y, f) => { const k = (y - hy) / (H - hy); const w = lerp(topW, botW, k); return 540 - w / 2 + w * f; };
    for (let i = 0; i < n; i++) {
      if (i % 2) continue;
      cx.fillStyle = 'rgba(255,255,255,.025)'; cx.beginPath();
      cx.moveTo(xAt(hy, i / n), hy); cx.lineTo(xAt(hy, (i + 1) / n), hy); cx.lineTo(xAt(H, (i + 1) / n), H); cx.lineTo(xAt(H, i / n), H); cx.fill();
    }
    cx.strokeStyle = 'rgba(255,255,255,.08)'; cx.lineWidth = 4;
    cx.beginPath(); cx.moveTo(xAt(hy, 0), hy); cx.lineTo(xAt(H, 0), H); cx.moveTo(xAt(hy, 1), hy); cx.lineTo(xAt(H, 1), H);
    cx.moveTo(xAt(hy, 0), hy); cx.lineTo(xAt(hy, 1), hy); cx.stroke();
    const my = 1420; cx.beginPath(); cx.moveTo(xAt(my, 0), my); cx.lineTo(xAt(my, 1), my); cx.stroke();
    cx.beginPath(); cx.ellipse(540, my, 330, 120, 0, 0, Math.PI * 2); cx.stroke();
    // light sweep
    const sx = (((t * .22) % 1.6) - .3) * W * 1.4;
    cx.save(); cx.translate(sx, 0); cx.rotate(-.35);
    g = cx.createLinearGradient(-200, 0, 200, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.05)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    cx.fillStyle = g; cx.fillRect(-200, -600, 400, H * 2); cx.restore();
    // particles
    for (const p of parts) {
      const y = ((p.y - t * p.v) % H + H) % H;
      cx.fillStyle = `rgba(255,255,255,${p.a * (.6 + .4 * Math.sin(t * 2 + p.ph))})`;
      cx.beginPath(); cx.arc(p.x + Math.sin(t + p.ph) * 12, y, p.s, 0, 6.29); cx.fill();
    }
    g = cx.createRadialGradient(540, 900, 500, 540, 900, 1400); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.65)');
    cx.fillStyle = g; cx.fillRect(0, 0, W, H);
  }

  // ---------- scenes ----------
  const S = {};
  function slamLines(c, lt, start, gap) {
    let shake = 0;
    c.lines.forEach((e, i) => {
      const st = start + i * gap, p = P(lt, st, st + .22), q = eo(p);
      e.style.opacity = clamp(p * 3);
      e.style.transform = `scale(${lerp(2.4, 1, q)})`;
      e.style.filter = `blur(${(1 - q) * 18}px)`;
      const since = lt - (st + .22);
      if (since > 0 && since < .3) shake = Math.max(shake, (1 - since / .3) * 14);
    });
    return shake;
  }
  function buildLines(text, box, size) {
    return text.split('|').map(l => {
      const w = el('div', 'lnwrap', null, box);
      const e = el('div', 'hookline', hl(l), w);
      if (size) e.style.fontSize = size + 'px';
      return e;
    });
  }

  S.hook = {
    dur: () => 2.6,
    build(s, root) {
      const c = {}, box = el('div', 'center', null, root);
      if (s.kicker) c.k = el('div', 'pill', esc(s.kicker), box), c.k.style.marginBottom = '40px';
      c.lines = buildLines(s.title, box, s.size);
      c.bar = el('div', 'bar', null, box);
      if (s.sub) c.sub = el('div', 'sub', hl(s.sub), box);
      c.fit = () => c.lines.forEach(e => fit(e, 950));
      return c;
    },
    update(c, lt, d, s, root) {
      if (c.k) { const k = eb(P(lt, 0, .35)); c.k.style.opacity = P(lt, 0, .15); c.k.style.transform = `translateY(${(1 - k) * -70}px) scale(${lerp(.6, 1, k)})`; }
      const start = c.k ? .25 : .1, gap = .22;
      const shake = slamLines(c, lt, start, gap);
      const lEnd = start + c.lines.length * gap + .1;
      c.bar.style.width = eo(P(lt, lEnd, lEnd + .4)) * 420 + 'px';
      if (c.sub) { const p = eo(P(lt, lEnd + .15, lEnd + .55)); c.sub.style.opacity = p; c.sub.style.transform = `translateY(${(1 - p) * 30}px)`; }
      root.style.transform = `translate(${Math.sin(lt * 90) * shake}px,${Math.cos(lt * 77) * shake}px) scale(${1 + lt * .012})`;
    }
  };

  S.rank = {
    dur: s => 3.2 + (s.entries || [s]).length * .25 + Math.min(s.value || 0, 8) * .12,
    build(s, root) {
      const c = {};
      c.num = el('div', 'ranknum', esc(s.label || ('#' + s.rank)), root);
      if (s.tag) c.tag = el('div', 'ranktag', `<span class="pill">${esc(s.tag)}</span>`, root);
      const col = el('div', 'col', null, root);
      const entries = s.entries || [{ name: s.name, meta: s.meta }];
      c.rows = entries.map(en => {
        const n = el('div', 'rname' + (entries.length > 1 ? ' small' : ''), hl(en.name), el('div', null, null, col));
        const m = en.meta ? el('div', 'rmeta', hl(en.meta), col) : null;
        return { n, m };
      });
      if (s.value != null) {
        const v = el('div', 'rvalue', null, col);
        c.vnum = el('div', 'vnum', '0', v);
        el('div', 'vunit', hl(s.unit || ''), v);
        if (s.icons) {
          const ic = el('div', 'icons', null, col);
          c.icons = [...Array(s.value)].map(() => el('div', null, BALL, ic));
        } else {
          const b = el('div', 'rbar', null, col);
          c.bar = el('div', null, null, b);
        }
      }
      c.fit = () => c.rows.forEach(r => fit(r.n, 940));
      return c;
    },
    update(c, lt, d, s) {
      const p = eo(P(lt, 0, .45));
      c.num.style.transform = `translateX(${(1 - p) * -500}px) scale(${lerp(1.3, 1, p)})`;
      c.num.style.opacity = p;
      if (c.tag) { const k = eb(P(lt, .45, .8)); c.tag.style.transform = `scale(${k})`; c.tag.style.opacity = clamp(k); }
      c.rows.forEach((r, i) => {
        const st = .3 + i * .22, q = eo(P(lt, st, st + .4));
        r.n.style.clipPath = `inset(-20px ${(1 - q) * 100}% -20px -20px)`;
        r.n.style.transform = `translateX(${(1 - q) * 60}px)`;
        if (r.m) { const m = P(lt, st + .2, st + .5); r.m.style.opacity = m; r.m.style.transform = `translateY(${(1 - m) * 15}px)`; }
      });
      if (c.vnum) {
        const vs = .7 + c.rows.length * .22, vp = eo(P(lt, vs, vs + .7));
        c.vnum.textContent = Math.round(lerp(0, s.value, vp)).toLocaleString('en-US') + (s.suffix || '');
        const pop = P(lt, vs + .7, vs + .95);
        c.vnum.style.transform = `scale(${1 + Math.sin(pop * Math.PI) * .18})`;
        c.vnum.parentNode.style.opacity = P(lt, vs - .1, vs + .1);
        if (c.icons) c.icons.forEach((e, j) => { const k = eb(P(lt, vs + j * .12, vs + j * .12 + .3)); e.style.transform = `scale(${k}) rotate(${(1 - k) * -90}deg)`; e.style.opacity = clamp(k * 2); });
        if (c.bar) c.bar.style.width = vp * clamp(s.value / (s.max || s.value)) * 100 + '%';
      }
    }
  };

  S.poll = {
    dur: s => 1.6 + tokens(s.statement).length * .13 + 4.5,
    build(s, root) {
      const c = {}, box = el('div', 'center', null, root);
      c.label = el('div', 'pill', esc(s.label || 'HOT TAKE'), box);
      const st = el('div', 'stmt', null, box);
      c.words = tokens(s.statement).map(t => el('span', t.k ? 'hl' : '', esc(t.w), st));
      const ch = el('div', 'choices', null, box);
      c.a = el('div', 'choice a', `${CHECK}<div>${esc(s.a || 'AGREE')}</div>`, ch);
      c.vs = el('div', 'vs', ring(88, 16) + '<b>VS</b>', ch);
      c.b = el('div', 'choice b', `${CROSS}<div>${esc(s.b || 'DISAGREE')}</div>`, ch);
      c.cta = el('div', 'cta', hl(s.cta || 'Comment *your answer* 👇'), box);
      c.arc = c.vs.querySelector('.arc');
      return c;
    },
    update(c, lt, d) {
      const k = eb(P(lt, 0, .35));
      c.label.style.transform = `scale(${k * (1 + .04 * Math.sin(lt * 9))})`;
      c.label.style.boxShadow = `0 0 ${30 + 20 * Math.sin(lt * 9)}px var(--acc)`;
      c.words.forEach((w, i) => { const st = .3 + i * .13, q = eb(P(lt, st, st + .28)); w.style.transform = `scale(${lerp(.3, 1, q)})`; w.style.opacity = clamp(q * 2); });
      const ct = .3 + c.words.length * .13 + .3;
      const qa = eb(P(lt, ct, ct + .45)), qb = eb(P(lt, ct + .1, ct + .55));
      c.a.style.transform = `translateX(${(1 - qa) * -700}px) rotate(${(1 - qa) * -12}deg)`;
      c.b.style.transform = `translateX(${(1 - qb) * 700}px) rotate(${(1 - qb) * 12}deg)`;
      const qv = eb(P(lt, ct + .4, ct + .7));
      c.vs.style.transform = `scale(${qv})`;
      const len = 2 * Math.PI * 88;
      c.arc.setAttribute('stroke-dashoffset', len * P(lt, ct + .7, d - .2));
      const qc = P(lt, ct + .7, ct + 1);
      c.cta.style.opacity = qc * (.7 + .3 * Math.sin(lt * 7));
      c.cta.style.transform = `translateY(${Math.sin(lt * 5) * 8}px)`;
    }
  };

  S.story = {
    dur: s => 1 + tokens(s.text).length / 2.6,
    build(s, root, ctx) {
      const c = {};
      if (s.tag) c.tag = el('div', 'stag', `<span class="pill ghost">${esc(s.tag)}</span>`, root);
      if (s.image) { c.img = el('div', 'simg', `<img src="${esc(ctx.assetUrl(s.image))}">`, root); }
      else if (s.big != null || s.count != null) {
        c.big = el('div', 'big', hl(s.big != null ? s.big : '0'), root);
        if (s.bigLabel) c.bigLabel = el('div', 'biglabel', hl(s.bigLabel), root);
      }
      c.cap = el('div', 'cap', null, root);
      c.cap.style.top = (c.img || c.big ? 1000 : 720) + 'px';
      // word timings weighted by length, spread over the scene
      const toks = tokens(s.text);
      const wts = toks.map(t => t.w.length + 3), tot = wts.reduce((a, b) => a + b, 0);
      let acc = 0; const t0 = .15, t1 = s.duration - .35;
      toks.forEach((t, i) => { t.t = t0 + (acc / tot) * (t1 - t0); acc += wts[i]; });
      // chunks of up to 3 words / ~16 chars
      c.chunks = []; let cur = [];
      toks.forEach(t => {
        const len = cur.reduce((a, x) => a + x.w.length + 1, 0);
        if (cur.length && (cur.length >= 3 || len + t.w.length > 16)) { c.chunks.push(cur); cur = []; }
        cur.push(t);
        if (/[.!?,:;]$/.test(t.w)) { c.chunks.push(cur); cur = []; }
      });
      if (cur.length) c.chunks.push(cur);
      c.active = -1;
      c.fit = () => { if (c.big) fit(c.big, 1000); };
      return c;
    },
    update(c, lt, d, s) {
      if (c.tag) c.tag.style.opacity = P(lt, 0, .3);
      if (c.big) {
        const q = eo(P(lt, .05, .35));
        if (s.count != null) {
          const v = lerp(0, s.count, eo(P(lt, .1, 1.3)));
          c.big.textContent = (s.prefix || '') + Math.round(v).toLocaleString('en-US') + (s.suffix || '');
        }
        c.big.style.transform = `scale(${lerp(1.8, 1, q) + Math.sin(lt * 2) * .015})`;
        c.big.style.opacity = q; c.big.style.filter = `blur(${(1 - q) * 16}px)`;
        if (c.bigLabel) c.bigLabel.style.opacity = P(lt, .35, .7);
      }
      if (c.img) { const q = eo(P(lt, 0, .5)); c.img.style.opacity = q; c.img.querySelector('img').style.transform = `scale(${1.15 - lt * .015})`; c.img.style.transform = `translateY(${(1 - q) * 60}px)`; }
      let idx = 0;
      c.chunks.forEach((ch, i) => { if (lt >= ch[0].t - .05) idx = i; });
      if (idx !== c.active) {
        c.active = idx; c.cap.innerHTML = '';
        c.spans = c.chunks[idx].map(t => { const e = el('span', t.k ? 'k' : '', esc(t.w), c.cap); e._t = t.t; return e; });
      }
      const ch = c.chunks[idx];
      const pop = eb(P(lt, ch[0].t - .05, ch[0].t + .12));
      c.cap.style.transform = `scale(${lerp(.8, 1, pop)})`;
      c.spans.forEach((e, i) => {
        const next = c.spans[i + 1] ? c.spans[i + 1]._t : Infinity;
        const on = lt >= e._t && lt < next;
        const said = lt >= e._t;
        e.style.opacity = said ? 1 : .5;
        e.classList.toggle('on', on && !e.classList.contains('k'));
        e.style.transform = `scale(${on ? 1.08 : 1})`;
      });
    }
  };

  S.quiz = {
    dur: s => .6 + s.clubs.length * (s.stagger || .5) + .3 + (s.countdown || 5) + .3,
    build(s, root) {
      const c = {};
      const tt = el('div', 'qtitle', null, root);
      c.title = el('div', 'hookline', hl(s.title || 'GUESS THE *PLAYER*'), tt);
      c.chip = el('div', 'qchip', `<span class="pill">${esc(s.chip || 'LEVEL: HARD')}</span>`, root);
      const list = el('div', 'qlist', null, root);
      c.line = el('div', 'qline', null, list);
      c.rows = s.clubs.map((cl, i) => el('div', 'qrow',
        `<div class="qdot">${i + 1}</div><div class="qclub">${hl(cl.club)}</div><div class="qyears">${esc(cl.years || '')}</div>`, list));
      c.timer = el('div', 'timer', ring(88, 14) + '<b></b>', root);
      c.arc = c.timer.querySelector('.arc'); c.tnum = c.timer.querySelector('b');
      c.fit = () => { fit(c.title, 960); c.rows.forEach(r => fit(r.querySelector('.qclub'), 640, 30)); };
      return c;
    },
    update(c, lt, d, s) {
      const q = eb(P(lt, 0, .35));
      c.title.style.transform = `scale(${q})`; c.title.style.opacity = clamp(q);
      c.chip.style.opacity = P(lt, .25, .45);
      const stg = s.stagger || .5;
      c.rows.forEach((r, i) => {
        const st = .6 + i * stg, k = eo(P(lt, st, st + .35));
        r.style.opacity = k; r.style.transform = `translateX(${(1 - k) * 120}px)`;
      });
      const shown = clamp((lt - .6) / stg + .4, 0, c.rows.length);
      c.line.style.height = Math.max(0, Math.min(shown, c.rows.length) - 1) * 88 + 'px';
      const cd = s.countdown || 5, ts = .6 + c.rows.length * stg + .3;
      const tp = P(lt, ts, ts + cd);
      const k = eb(P(lt, ts - .3, ts));
      c.timer.style.transform = `scale(${k * (1 + .08 * Math.max(0, Math.sin((lt - ts) * Math.PI * 2)))})`;
      c.timer.style.opacity = clamp(k);
      c.tnum.textContent = lt < ts ? cd : Math.max(0, Math.ceil(cd - (lt - ts)));
      c.arc.setAttribute('stroke-dashoffset', 2 * Math.PI * 88 * tp);
    }
  };

  S.reveal = {
    dur: () => 3.4,
    build(s, root) {
      const c = {};
      c.rays = el('div', 'rays', null, root);
      const box = el('div', 'center', null, root);
      if (s.kicker) c.k = el('div', 'pill', esc(s.kicker), box), c.k.style.marginBottom = '40px';
      c.lines = buildLines(s.name, box, s.size || 150);
      c.bar = el('div', 'bar', null, box);
      if (s.sub) c.sub = el('div', 'sub', hl(s.sub), box);
      c.flash = el('div', 'flash', null, root);
      c.fit = () => c.lines.forEach(e => fit(e, 950));
      return c;
    },
    update(c, lt, d, s, root) {
      c.flash.style.opacity = 1 - eo(P(lt, 0, .45));
      c.rays.style.transform = `rotate(${lt * 18}deg) scale(${lerp(.3, 1, eo(P(lt, 0, .6)))})`;
      if (c.k) c.k.style.opacity = P(lt, .1, .3);
      const shake = slamLines(c, lt, .15, .2);
      const lEnd = .15 + c.lines.length * .2 + .1;
      c.bar.style.width = eo(P(lt, lEnd, lEnd + .4)) * 420 + 'px';
      if (c.sub) c.sub.style.opacity = P(lt, lEnd + .1, lEnd + .5);
      root.style.transform = `translate(${Math.sin(lt * 90) * shake}px,${Math.cos(lt * 77) * shake}px)`;
    }
  };

  S.cta = {
    dur: () => 3.2,
    build(s, root) {
      const c = {}, box = el('div', 'center', null, root);
      c.lines = buildLines(s.title || 'FOLLOW FOR|*PART 2*', box, s.size || 130);
      c.btn = el('div', 'follow', `<span>＋</span><span>${esc(s.button || 'FOLLOW')}</span>`, box);
      c.handle = el('div', 'handle', hl(s.sub || '@footballpage.tv'), box);
      c.fit = () => c.lines.forEach(e => fit(e, 950));
      return c;
    },
    update(c, lt, d, s, root) {
      const shake = slamLines(c, lt, .1, .22);
      const bs = .2 + c.lines.length * .22;
      const k = eb(P(lt, bs, bs + .4));
      c.btn.style.transform = `scale(${k * (1 + .05 * Math.sin(lt * 8))})`; c.btn.style.opacity = clamp(k);
      c.handle.style.opacity = P(lt, bs + .3, bs + .6);
      root.style.transform = `translate(${Math.sin(lt * 90) * shake}px,${Math.cos(lt * 77) * shake}px)`;
    }
  };

  // ---------- timeline ----------
  let spec, scenes = [], total = 0;
  const stage = document.getElementById('stage'), prog = document.getElementById('progress'), swipe = document.getElementById('swipe');
  window.sceneDefaultDuration = s => S[s.type].dur(s);
  window.setup = async function (sp) {
    spec = sp; total = 0;
    const theme = Object.assign({ accent: '#00ff88', accent2: '#ffd400' }, spec.theme || {});
    document.getElementById('brand').textContent = spec.brand || 'FOOTBALLPAGE.TV';
    const ctx = { assetUrl: p => (spec.assetBase || '') + p };
    for (const s of spec.scenes) {
      if (!S[s.type]) throw new Error('Unknown scene type ' + s.type);
      s.duration = s.duration || S[s.type].dur(s);
      s._start = total; total += s.duration; s._end = total;
      s._acc = s.accent || theme.accent; s._acc2 = s.accent2 || theme.accent2;
      s._swipe = s.swipe != null ? s.swipe : s.type !== 'story';
      const w = el('div', 'scene', null, stage);
      w.style.setProperty('--acc', s._acc); w.style.setProperty('--acc2', s._acc2);
      const root = el('div', 'inner', null, w);
      s._w = w; s._root = root; s._c = S[s.type].build(s, root, ctx);
    }
    window.sceneStarts = spec.scenes.map(s => s._start);
    await document.fonts.ready;
    await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
    for (const s of spec.scenes) { s._w.style.display = 'block'; if (s._c.fit) s._c.fit(); s._w.style.display = 'none'; }
    return total;
  };
  window.frame = function (t) {
    let idx = spec.scenes.findIndex(s => t < s._end); if (idx < 0) idx = spec.scenes.length - 1;
    spec.scenes.forEach((s, i) => { s._w.style.display = i === idx ? 'block' : 'none'; });
    const s = spec.scenes[idx], lt = t - s._start, d = s.duration;
    const fd = s._swipe ? .06 : .2;
    const next = spec.scenes[idx + 1];
    const outFade = next && next._swipe ? .06 : .2;
    s._w.style.opacity = Math.min(P(lt, 0, fd), idx === spec.scenes.length - 1 ? 1 : 1 - P(lt, d - outFade, d));
    S[s.type].update(s._c, lt, d, s, s._root);
    drawBg(t, s._acc, s._acc2);
    document.documentElement.style.setProperty('--acc', s._acc);
    document.documentElement.style.setProperty('--acc2', s._acc2);
    prog.style.width = (t / total) * 100 + '%';
    // swipe transition across scene boundaries
    swipe.style.display = 'none';
    for (let i = 1; i < spec.scenes.length; i++) {
      const b = spec.scenes[i]._start;
      if (spec.scenes[i]._swipe && Math.abs(t - b) < .2) {
        const x = (t - b + .2) / .4;
        swipe.style.display = 'block';
        swipe.style.background = spec.scenes[i]._acc;
        swipe.style.boxShadow = `0 0 0 50px ${spec.scenes[i]._acc2}`;
        swipe.style.transform = `translateX(${lerp(-2300, 1900, eo(x))}px) skewX(-18deg)`;
      }
    }
  };
})();
