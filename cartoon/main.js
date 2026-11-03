// Cartoon storytelling video: 3D world (World3D) + 2D puppets (Puppet) + overlays.
(function () {
  const W = 1080, H = 1920, GROUND = 1400;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const eo = x => 1 - Math.pow(1 - x, 3);
  const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const eb = x => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const lerp = (a, b, x) => a + (b - a) * x;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const OUT = '#1b1035';
  const cv = document.getElementById('c2d'), ctx = cv.getContext('2d');
  const ov = document.getElementById('ov');
  function el(tag, cls, html, parent) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; (parent || ov).appendChild(e); return e; }

  // ---------- cast ----------
  const CH = {
    hero:   { skin: '#ffd2b0', shirt: '#1655d6', trim: '#ffffff', pants: '#2b2f4a', shoes: '#16162a', hair: 'spiky', hairColor: '#4a2a14', number: '9', bw: 1, scale: 1, blinkPh: 0 },
    mike:   { skin: '#c98d63', shirt: '#e8364f', trim: '#ffd1d8', pants: '#3b3355', shoes: '#16162a', hair: 'bald', beard: true, hairColor: '#3a2212', bw: 1.32, scale: .97, blinkPh: 1.3 },
    jay:    { skin: '#ffe0c7', shirt: '#20c56a', trim: '#d9ffe8', pants: '#26324d', shoes: '#16162a', hair: 'cap', capColor: '#ffd400', hairColor: '#d08a30', bw: .9, scale: 1.04, blinkPh: 2.1 },
    bookie: { skin: '#ffd9b8', shirt: '#ffffff', vest: '#6a2bd1', bowtie: '#e8364f', trim: '#ffffff', pants: '#222', shoes: '#111', hair: 'slick', hairColor: '#1d1d1d', mustache: true, glasses: true, bw: 1.1, scale: 1, blinkPh: .7 }
  };

  // ---------- sets ----------
  function neonText(txt, x, y, size, color, glow, t) {
    ctx.font = `900 ${size}px Inter Display`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = glow; ctx.shadowBlur = 30; ctx.fillStyle = color; ctx.fillText(txt, x, y); ctx.shadowBlur = 0;
  }
  function drawBookiesBack(t, fx) {
    if (fx.hideSign) return;
    const x = -330, y = 730, sw = 560, sh = 220;
    ctx.strokeStyle = OUT; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - 190, y - sh / 2); ctx.lineTo(x - 190, y - 420); ctx.moveTo(x + 190, y - sh / 2); ctx.lineTo(x + 190, y - 420); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(x - sw / 2, y - sh / 2, sw, sh, 18); ctx.fillStyle = '#1c2238'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.beginPath(); ctx.roundRect(x - sw / 2 + 16, y - sh / 2 + 16, sw - 32, sh - 32, 10); ctx.lineWidth = 5; ctx.strokeStyle = '#e0b84a'; ctx.stroke();
    txt('TITLE ODDS 2015/16', x, y - 64, 28, '#e0b84a', 800);
    txt('LEICESTER CITY', x, y - 26, 40, '#ffffff', 900);
    const pulse = fx.signPulse != null ? Math.sin(P(fx.lt, fx.signPulse, fx.signPulse + .6) * Math.PI) : 0;
    ctx.save(); ctx.translate(x, y + 48); ctx.scale(1 + pulse * .2, 1 + pulse * .2);
    txt('5000 / 1', 0, 0, 92, '#ff5a4f', 900); ctx.restore();
  }
  function drawCounter() {
    const x0 = -620, x1 = -60, top = 1130;
    ctx.lineWidth = 7; ctx.strokeStyle = OUT;
    ctx.beginPath(); ctx.roundRect(x0, top + 30, x1 - x0, GROUND - top - 10, 14); ctx.fillStyle = '#9a6238'; ctx.fill(); ctx.stroke();
    ctx.lineWidth = 5;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.roundRect(x0 + 30 + i * 172, top + 70, 150, 170, 10); ctx.fillStyle = '#8a5530'; ctx.fill(); ctx.stroke(); }
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.roundRect(x0 - 30, top, x1 - x0 + 60, 44, 12); ctx.fillStyle = '#c07e4a'; ctx.fill(); ctx.stroke();
  }
  function drawSofa() {
    const x0 = -470, x1 = 470;
    ctx.lineWidth = 7; ctx.strokeStyle = OUT;
    ctx.beginPath(); ctx.roundRect(x0 + 30, 1010, x1 - x0 - 60, 220, 50); ctx.fillStyle = '#34539a'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(x0, 1170, x1 - x0, 170, 40); ctx.fillStyle = '#3f62ad'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(x0 - 40, 1100, 110, 260, 40); ctx.fillStyle = '#2d4886'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(x1 - 70, 1100, 110, 260, 40); ctx.fillStyle = '#2d4886'; ctx.fill(); ctx.stroke();
  }
  const TVX = -1150, TVY = 880, TVW = 860, TVH = 520;
  function drawTV(t, card, lt, d) {
    ctx.lineWidth = 7; ctx.strokeStyle = OUT;
    ctx.beginPath(); ctx.moveTo(TVX - 150, TVY + TVH / 2); ctx.lineTo(TVX - 220, GROUND); ctx.moveTo(TVX + 150, TVY + TVH / 2); ctx.lineTo(TVX + 220, GROUND); ctx.lineWidth = 16; ctx.stroke();
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.roundRect(TVX - TVW / 2 - 26, TVY - TVH / 2 - 26, TVW + 52, TVH + 52, 34); ctx.fillStyle = '#20233a'; ctx.fill(); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.roundRect(TVX - TVW / 2, TVY - TVH / 2, TVW, TVH, 14); ctx.clip();
    ctx.translate(TVX - TVW / 2, TVY - TVH / 2);
    drawCard(card, t, lt, d);
    // scanline shine
    const g = ctx.createLinearGradient(0, 0, TVW, TVH); g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(.4, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, TVW, TVH);
    ctx.restore();
    ctx.beginPath(); ctx.roundRect(TVX - TVW / 2, TVY - TVH / 2, TVW, TVH, 14); ctx.stroke();
  }
  function txt(s, x, y, size, color = '#fff', weight = 900, align = 'center', strokeW = 0) {
    ctx.font = `${weight} ${size}px Inter Display`; ctx.textAlign = align; ctx.textBaseline = 'middle';
    if (strokeW) { ctx.lineWidth = strokeW; ctx.strokeStyle = OUT; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
    ctx.fillStyle = color; ctx.fillText(s, x, y);
  }
  function cardBg(c1, c2) {
    const g = ctx.createLinearGradient(0, 0, 0, TVH); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fillRect(0, 0, TVW, TVH);
    ctx.beginPath(); ctx.roundRect(24, 22, 110, 44, 10); ctx.fillStyle = '#ef3b5c'; ctx.fill(); txt('LIVE', 79, 45, 28);
  }
  function drawCard(card, t, lt, d) {
    const f = lt / d;
    if (card === 'ranieri') {
      cardBg('#0d2a8a', '#06134a');
      txt('NEW MANAGER', TVW / 2, 105, 40, '#ffd400', 800);
      txt('CLAUDIO RANIERI', TVW / 2, 175, 78, '#fff', 900, 'center', 0);
      const k = eb(P(lt, d * .31, d * .31 + .4));
      if (k > 0) {
        ctx.save(); ctx.translate(TVW / 2, 360); ctx.scale(k, k);
        ctx.beginPath(); ctx.roundRect(-330, -95, 660, 190, 26); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.stroke();
        ctx.beginPath(); ctx.arc(-260, -30, 40, 0, Math.PI * 2); ctx.fillStyle = '#1d9bf0'; ctx.fill();
        txt('G', -260, -30, 44, '#fff');
        txt('Gary Lineker', -200, -48, 34, '#1b1035', 900, 'left'); txt('@GaryLineker', -200, -12, 28, '#6b6b80', 600, 'left');
        txt('"Claudio Ranieri? Really?"', 0, 52, 50, '#1b1035', 900);
        ctx.restore();
      }
    } else if (card === 'vardy') {
      cardBg('#0d2a8a', '#06134a');
      txt('JAMIE VARDY', TVW / 2, 100, 60, '#fff');
      const n = Math.max(1, Math.min(11, Math.ceil(lerp(0, 11, P(lt, d * .12, d * .57)))));
      const pop = 1 + .15 * Math.max(0, Math.sin((lt * 11 / (d * .5)) * Math.PI * 2)) * (n < 11 ? 1 : 0);
      ctx.save(); ctx.translate(TVW / 2, 250); ctx.scale(pop, pop); txt(String(n), 0, 0, 190, '#ffd400', 900, 'center', 14); ctx.restore();
      txt('GAMES IN A ROW WITH A GOAL', TVW / 2, 370, 38, '#fff', 800);
      for (let i = 0; i < 11; i++) {
        const x = TVW / 2 + (i - 5) * 64, on = i < n;
        ctx.beginPath(); ctx.arc(x, 445, 24, 0, Math.PI * 2); ctx.fillStyle = on ? '#fff' : 'rgba(255,255,255,.15)'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
        if (on) { ctx.beginPath(); ctx.arc(x, 445, 9, 0, Math.PI * 2); ctx.fillStyle = OUT; ctx.fill(); }
      }
      if (n === 11) txt('NEW RECORD!', TVW / 2, 175, 44, '#ff5c8a', 900, 'center', 0);
    } else if (card === 'table') {
      cardBg('#7a0f22', '#2b0610');
      txt('PREMIER LEAGUE · CHRISTMAS 2015', TVW / 2, 100, 36, '#ffd166', 800);
      const k = eb(P(lt, d * .1, d * .1 + .45));
      ctx.save(); ctx.translate(TVW / 2, 250); ctx.scale(k, k);
      ctx.beginPath(); ctx.roundRect(-370, -70, 740, 140, 24); ctx.fillStyle = '#1655d6'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.stroke();
      txt('1', -310, 0, 80, '#ffd400'); txt('LEICESTER CITY', 30, 0, 66, '#fff');
      ctx.restore();
      for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.roundRect(TVW / 2 - 330, 360 + i * 70, 660, 50, 14); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fill(); txt(String(i + 2), TVW / 2 - 290, 385 + i * 70, 32, 'rgba(255,255,255,.5)'); }
      txt('TOP OF THE LEAGUE', TVW / 2, 175, 40, '#fff', 800);
    } else if (card === 'city') {
      cardBg('#2a0d5c', '#0d0524');
      txt('6 FEB 2016 · FULL TIME', TVW / 2, 100, 36, '#ffd400', 800);
      score('MAN CITY', 1, 3, 'LEICESTER', '#6cabdd', '#1655d6', lt, d, null);
    } else if (card === 'chelsea') {
      cardBg('#2a0d5c', '#0d0524');
      const late = f > .73, ft = f > .9;
      txt(ft ? 'FULL TIME' : 'LIVE · 2 MAY 2016', TVW / 2, 100, 40, ft ? '#ffd400' : '#fff', 800);
      score('CHELSEA', late ? 2 : 1, 2, 'TOTTENHAM', '#034694', '#ffffff', lt, d, late ? d * .73 : null);
      if (ft) txt('LEICESTER ARE CHAMPIONS!', TVW / 2, 445, 44, '#ffd400', 900, 'center', 0);
    } else if (card === 'champions') {
      const fl = Math.sin(t * 12) > 0;
      cardBg(fl ? '#1655d6' : '#0d2a8a', '#06134a');
      txt('LEICESTER CITY', TVW / 2, 200, 84, '#fff'); txt('CHAMPIONS!', TVW / 2, 320, 110, '#ffd400', 900, 'center', 10);
    }
  }
  function score(a, ga, gb, b, ca, cb, lt, d, flashAt) {
    const y = 240;
    ctx.beginPath(); ctx.roundRect(40, y - 120, TVW - 80, 250, 30); ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = '#fff';
    ctx.beginPath(); ctx.arc(150, y - 20, 48, 0, Math.PI * 2); ctx.fillStyle = ca; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(TVW - 150, y - 20, 48, 0, Math.PI * 2); ctx.fillStyle = cb; ctx.fill(); ctx.stroke();
    txt(a, 150, y + 70, 36, '#fff'); txt(b, TVW - 150, y + 70, 36, '#fff');
    let k = 1; if (flashAt != null) k = 1 + .5 * Math.max(0, 1 - (lt - flashAt) / .5);
    ctx.save(); ctx.translate(TVW / 2, y + 10); ctx.scale(k, k); txt(`${ga} – ${gb}`, 0, 0, 120, '#ffd400', 900, 'center', 12); ctx.restore();
  }

  // ---------- money rain (2D, front) ----------
  const notes = [...Array(60)].map((_, i) => ({ x: (i * 397) % 1300 - 110, v: 260 + (i * 71) % 260, ph: (i * 0.37) % 6.28, s: .8 + (i % 5) * .12, y0: (i * 613) % 2200 }));
  function moneyRain(t, amt) {
    if (amt <= 0) return;
    ctx.save(); ctx.globalAlpha = amt;
    for (const n of notes) {
      const y = ((n.y0 + t * n.v) % 2300) - 250, x = n.x + Math.sin(t * 2 + n.ph) * 40;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 3 + n.ph) * .8); ctx.scale(n.s, n.s * Math.abs(Math.cos(t * 4 + n.ph)) + .2);
      ctx.beginPath(); ctx.roundRect(-50, -26, 100, 52, 6); ctx.fillStyle = '#4cc26a'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke();
      txt('£', 0, 2, 34, '#1e5c30');
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------- shots ----------
  const TV = { x: TVX, y: 930, z: 1.13 }, G = { x: 0, y: 985, z: 1.25 }, G2 = { x: 0, y: 995, z: 1.33 };
  const BOOK = { x: -135, y: 990, z: 1.15 };
  const HERO_CU = { x: 60, y: 1050, z: 1.7 };
  const FR = { x: 1390, y: 985, z: 1.25 };
  const room = { mike: { x: -270 }, hero: { x: 0 }, jay: { x: 270 } };
  const bookies = { bookie: { x: -330 }, hero: { x: 60 }, mike: { x: 1250 }, jay: { x: 1530 } };
  const SHOTS = {
    hook: {
      bright: 1,
      set: 'bookies', cast: bookies, noCaption: true,
      title: ['WHAT IF YOU BET', '<span class="gold">£1,000</span>', 'ON LEICESTER?'], titleSize: [96, 200, 104],
      fx: { hideSign: true }, cam: [[0, { x: 90, y: 1000, z: 1.35 }], [1, { x: 90, y: 1000, z: 1.45 }]],
      acts: {
        hero: [[0, { e: 'confident', p: 'holdCashUp', propR: 'cashFan' }], [.55, { e: 'wink' }]],
        bookie: [[0, { e: 'smirk', m: { lookX: 1 } }]]
      }
    },
    bet: {
      set: 'bookies', cast: bookies, tag: 'AUGUST 2015', fx: { signPulse: .75 },
      cam: [[0, BOOK], [1, { x: -120, y: 990, z: 1.22 }]],
      acts: {
        hero: [[0, { e: 'happy', m: { lookX: -1 }, propL: 'cash' }], [.3, { p: 'giveL' }], [.46, { p: 'idle', propL: null, e: 'confident', m: { lookX: -.6 } }], [.62, { p: 'giveL', propL: null }], [.75, { p: 'hips', propL: null, e: 'confident', m: { lookX: 0 } }]],
        bookie: [[0, { e: 'neutral', m: { lookX: 1 } }], [.4, { e: 'surprised', p: 'takeR', propR: 'cash' }], [.52, { e: 'giggle', p: 'bellyLaugh', propR: null, m: { laugh: .5, lookX: 1 } }], [.62, { e: 'smirk', p: 'takeR', propR: 'slip', m: { laugh: 0 } }], [.74, { p: 'idle', propR: null }]],
        mike: [[0, { e: 'smirk', m: { lookX: -1 } }]], jay: [[0, { e: 'smirk', m: { lookX: -1 } }]]
      },
      propFix: { hero: [[.74, 'slip']] }
    },
    laugh: {
      set: 'bookies', cast: bookies,
      cam: [[0, { x: -120, y: 990, z: 1.22 }], [.05, { x: -120, y: 990, z: 1.22 }], [.18, FR], [1, { x: 1390, y: 990, z: 1.38 }]],
      acts: {
        hero: [[0, { e: 'confident', p: 'hips', propL: 'slip' }]],
        bookie: [[0, { e: 'smirk', m: { lookX: 1 } }]],
        mike: [[0, { e: 'giggle', m: { lookX: -1 } }], [.18, { e: 'laugh', p: 'bellyLaugh', m: { laugh: 1, lookX: -.4 } }]],
        jay: [[0, { e: 'smirk', m: { lookX: -1 } }], [.2, { e: 'laugh', p: 'pointL', m: { laugh: 1, lookX: -1 } }], [.62, { p: 'bellyLaugh', po: { lean: 10 } }]]
      }
    },
    confident: {
      set: 'bookies', cast: bookies, fx: { hideSign: true },
      cam: [[0, { x: 1390, y: 990, z: 1.38 }], [.08, { x: 1390, y: 990, z: 1.38 }], [.26, HERO_CU], [1, { x: 60, y: 1050, z: 1.85 }]],
      acts: {
        hero: [[0, { e: 'confident', p: 'hips', propL: 'slip', m: { lookX: 1 } }], [.3, { m: { lookX: 0 } }], [.46, { e: 'wink', p: 'thumbsUpR', handR: 'thumb', propL: 'slip' }]],
        bookie: [[0, { e: 'smirk', m: { lookX: 1 } }]],
        mike: [[0, { e: 'laugh', p: 'bellyLaugh', m: { laugh: 1 } }]], jay: [[0, { e: 'laugh', p: 'bellyLaugh', m: { laugh: 1 } }]]
      }
    },
    ranieri: {
      bright: 1,
      set: 'room', cast: room, tag: 'THE NEW MANAGER', card: 'ranieri',
      cam: [[0, TV], [.55, TV], [.66, G], [1, G2]],
      acts: {
        hero: [[0, { e: 'neutral', m: { lookX: -1 } }], [.66, { e: 'confident', p: 'crossed', m: { lookX: 0 } }]],
        mike: [[0, { e: 'smirk', m: { lookX: -1 } }], [.62, { e: 'laugh', p: 'pointR', m: { laugh: .8, lookX: 1 } }]],
        jay: [[0, { e: 'giggle', m: { lookX: -1 } }], [.64, { e: 'laugh', p: 'pointL', m: { laugh: .8, lookX: -1 } }]]
      }
    },
    vardy: {
      set: 'room', cast: room, tag: 'NOVEMBER 2015', card: 'vardy',
      cam: [[0, TV], [.58, TV], [.68, G], [1, G2]],
      acts: {
        hero: [[0, { e: 'happy', m: { lookX: -1 } }], [.68, { e: 'ecstatic', p: 'fistPumpR', handR: 'fist', m: { jump: .45, lookX: 0 } }]],
        mike: [[0, { e: 'smirk', m: { lookX: -1 } }], [.68, { e: 'surprised', m: { lookX: 1 } }], [.84, { e: 'worried', p: 'crossed' }]],
        jay: [[0, { e: 'giggle', m: { lookX: -1 } }], [.7, { e: 'surprised', m: { lookX: -1 } }], [.86, { e: 'nervous', p: 'nervous' }]]
      }
    },
    christmas: {
      set: 'room', cast: room, tag: 'CHRISTMAS 2015', card: 'table',
      cam: [[0, TV], [.48, TV], [.58, G], [1, G2]],
      acts: {
        hero: [[0, { e: 'happy', hat: 'santa', m: { lookX: -1 } }], [.58, { e: 'ecstatic', p: 'cheer', m: { dance: 1, lookX: 0 } }]],
        mike: [[0, { e: 'surprised', hat: 'santa', m: { lookX: -1 } }], [.58, { e: 'nervous', p: 'nervous', m: { lookX: 1, tremble: .5 } }]],
        jay: [[0, { e: 'surprised', hat: 'santa', m: { lookX: -1 } }], [.6, { e: 'worried', p: 'crossed', m: { lookX: -1, tremble: .4 } }]]
      }
    },
    city: {
      bright: .86,
      set: 'room', cast: room, tag: 'FEBRUARY 2016', card: 'city',
      cam: [[0, TV], [.5, TV], [.6, G], [1, G2]],
      acts: {
        hero: [[0, { e: 'happy', m: { lookX: -1 } }], [.6, { e: 'ecstatic', p: 'cheer', m: { jump: 1, lookX: 0 } }]],
        mike: [[0, { e: 'tense', m: { lookX: -1 } }], [.6, { e: 'shock', p: 'handsOnHead', m: { lookX: -1, tremble: .6 } }]],
        jay: [[0, { e: 'tense', p: 'nervous', m: { lookX: -1 } }], [.62, { e: 'tense', p: 'nervous', m: { lookX: -1, tremble: 1 } }]]
      }
    },
    cashout: {
      bright: .8,
      set: 'room', cast: { mike: { x: -240 }, hero: { x: 0 }, jay: { x: 240 } }, card: 'off', phone: true,
      cam: [[0, G], [.25, { x: 0, y: 1030, z: 1.5 }], [.86, { x: 0, y: 1030, z: 1.5 }], [.97, G2], [1, G2]],
      acts: {
        hero: [[0, { e: 'surprised', p: 'phone', propR: 'phoneRing', m: { lookY: .6 } }], [.25, { e: 'focused', propR: 'phone' }], [.8, { e: 'confident', m: { no: 1, lookY: 0 } }], [.9, { e: 'wink', p: 'crossed', propR: null, m: { no: 0 } }]],
        mike: [[0, { e: 'surprised', m: { lookX: 1 } }], [.5, { e: 'pleading', p: 'pleading', po: { lean: 9 }, m: { lookX: 1, tremble: .4 } }], [.9, { e: 'despair', p: 'handsOnHead', m: { lookX: 1 } }]],
        jay: [[0, { e: 'surprised', m: { lookX: -1 } }], [.52, { e: 'pleading', p: 'pleading', po: { lean: -9 }, m: { lookX: -1 } }], [.91, { e: 'despair', p: 'handsOnHead', m: { lookX: -1, tremble: .5 } }]]
      }
    },
    chelsea: {
      bright: .7,
      set: 'room', cast: room, tag: '2 MAY 2016', card: 'chelsea',
      cam: [[0, TV], [.28, TV], [.38, G], [.62, { x: 0, y: 1010, z: 1.45 }], [.72, TV], [1, { x: TVX, y: 930, z: 1.2 }]],
      acts: {
        hero: [[0, { e: 'tense', p: 'pleading', m: { lookX: -1, tremble: .4 } }]],
        mike: [[0, { e: 'tense', p: 'nervous', m: { lookX: -1, tremble: .7 } }]],
        jay: [[0, { e: 'worried', p: 'nervous', m: { lookX: -1, tremble: .7 } }]]
      }
    },
    champions: {
      bright: 1.12, conf: 1,
      set: 'room', cast: room, card: 'champions', minDur: 4.6, shake: 1, flash: true,
      cam: [[0, { x: 0, y: 985, z: 1.35 }], [1, { x: 0, y: 985, z: 1.2 }]],
      acts: {
        hero: [[0, { e: 'ecstatic', p: 'cheer', m: { jump: 1 } }]],
        mike: [[0, { e: 'shock', p: 'handsOnHead', m: { lookX: 1 } }]],
        jay: [[0, { e: 'shock', p: 'handsOnHead', m: { lookX: -1 } }], [.45, { e: 'shock', p: 'faint', m: { lookX: 0 } }]]
      }
    },
    payout: {
      bright: 1.06, conf: .64,
      set: 'bookies', cast: { bookie: { x: -330 }, hero: { x: 60 }, mike: { x: 330 }, jay: { x: 580 } }, counter: true, captionTop: 640, fx: { hideSign: true },
      cam: [[0, { x: 110, y: 1010, z: .92 }], [1, { x: 110, y: 1000, z: .98 }]],
      acts: {
        bookie: [[0, { e: 'nervous', m: { lookX: 1, tremble: .6 } }], [.45, { e: 'despair', p: 'giveBagR', propR: 'bag' }], [.62, { p: 'idle', propR: null, e: 'despair' }]],
        hero: [[0, { e: 'confident', p: 'hips', m: { lookX: -1 } }], [.62, { e: 'ecstatic', p: 'holdBag', propR: 'bag', m: { jump: .6, lookX: 0 } }]],
        mike: [[0, { e: 'tense', p: 'nervous', m: { lookX: -1 } }], [.7, { e: 'shock', p: 'handsOnHead', m: { lookX: -1 } }]],
        jay: [[0, { e: 'tense', m: { lookX: -1 } }], [.72, { e: 'shock', p: 'handsOnHead', m: { lookX: -1 } }]]
      },
      rain: .64
    },
    cta: {
      bright: 1.08, conf: 1,
      set: 'bookies', cast: { bookie: { x: -330 }, hero: { x: 60 }, mike: { x: 330 }, jay: { x: 580 } }, noCaption: true, minDur: 4.5, fx: { hideSign: true },
      title: ['WHAT WOULD YOU DO', 'WITH <span class="gold">£5,000,000</span>?'], titleSize: [84, 84], follow: 'FOLLOW FOR MORE WHAT IFs',
      cam: [[0, { x: 110, y: 1000, z: .98 }], [1, { x: 110, y: 1000, z: 1.03 }]],
      acts: {
        bookie: [[0, { e: 'despair', m: { lookX: 1 } }]],
        hero: [[0, { e: 'happy', p: 'waveR', propL: 'cash', m: { wave: 1 } }]],
        mike: [[0, { e: 'ecstatic', p: 'cheer', m: { jump: .5 } }]],
        jay: [[0, { e: 'happy', p: 'cheer', m: { dance: .8 } }]]
      },
      rain: 0
    }
  };


  // ---------- quiz: guess the player ----------
  const PAT = { plain: 0 };
  function crest(x, y, c, sc = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    const sh = new Path2D(); sh.moveTo(-34, -40); sh.lineTo(34, -40); sh.lineTo(34, 2); sh.quadraticCurveTo(34, 30, 0, 44); sh.quadraticCurveTo(-34, 30, -34, 2); sh.closePath();
    ctx.fillStyle = c.c1; ctx.fill(sh);
    ctx.save(); ctx.clip(sh); ctx.fillStyle = c.c2;
    if (c.p === 'stripes') for (let k = -3; k <= 3; k += 2) ctx.fillRect(k * 11 - 5.5, -45, 11, 95);
    else if (c.p === 'sash') { ctx.beginPath(); ctx.moveTo(-40, -10); ctx.lineTo(-10, -45); ctx.lineTo(10, -45); ctx.lineTo(40, -10); ctx.lineTo(40, 20); ctx.lineTo(-40, -10 + 30); ctx.closePath(); ctx.fill(); }
    else if (c.p === 'band') ctx.fillRect(-40, -8, 80, 18);
    else if (c.p === 'vband') ctx.fillRect(-12, -45, 24, 95);
    else if (c.p === 'half') ctx.fillRect(0, -45, 40, 95);
    else if (c.p === 'chief') ctx.fillRect(-40, -45, 80, 24);
    ctx.restore();
    ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.lineJoin = 'round'; ctx.stroke(sh);
    const fs = c.t.length > 2 ? 22 : 30;
    ctx.font = `900 ${fs}px Inter Display`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.strokeText(c.t, 0, 4); ctx.fillStyle = c.tc || '#fff'; ctx.fillText(c.t, 0, 4);
    ctx.restore();
  }
  function ring(x, y, r, p, num) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = '#1c2238'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r - 14, 0, Math.PI * 2); ctx.lineWidth = 14; ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r - 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - p)); ctx.strokeStyle = '#ffd400'; ctx.lineCap = 'round'; ctx.stroke();
    txt(String(num), x, y + 4, r * .9, '#fff', 900, 'center', 0);
  }
  const silCv = document.createElement('canvas'); silCv.width = W; silCv.height = H; const silCtx = silCv.getContext('2d');
  function silhouette(ch, st, t, glow) {
    silCtx.setTransform(1, 0, 0, 1, 0, 0); silCtx.clearRect(0, 0, W, H);
    silCtx.setTransform(ctx.getTransform());
    Puppet.draw(silCtx, ch, st, t);
    silCtx.setTransform(1, 0, 0, 1, 0, 0);
    silCtx.globalCompositeOperation = 'source-in'; silCtx.fillStyle = '#150d33'; silCtx.fillRect(0, 0, W, H); silCtx.globalCompositeOperation = 'source-over';
    const m = ctx.getTransform(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.shadowColor = glow || '#c9b8ff'; ctx.shadowBlur = 26; ctx.drawImage(silCv, 0, 0); ctx.shadowBlur = 0;
    ctx.setTransform(m);
  }
  const STUDIO = { x: 540, y: 960, z: 1 };
  const quizDur = s => .7 + s.clubs.length * .7 + .5 + (s.countdown || 5) + .3;
  const playerCh = (pl, x, y, scale) => Object.assign({ skin: '#ffd2b0', trim: '#ffffff', pants: '#1f2236', shoes: '#16162a', hairColor: '#2a1a10', bw: 1, blinkPh: x * .01 }, pl, { x, y, scale });
  Object.assign(SHOTS, {
    qhook: {
      set: 'studio', cast: {}, cam: [[0, STUDIO], [1, STUDIO]], noCaption: true, bright: 1,
      dur: () => 3.2,
      draw(s, lt, d, t) {
        const q = k => eo(P(lt, .1 + k * .2, .32 + k * .2));
        ctx.save(); ctx.translate(540, 560); ctx.scale(lerp(2, 1, q(0)), lerp(2, 1, q(0))); ctx.globalAlpha = q(0); txt('GUESS THE', 0, 0, 120, '#fff', 900, 'center', 18); ctx.restore();
        ctx.save(); ctx.translate(540, 690); ctx.scale(lerp(2, 1, q(1)), lerp(2, 1, q(1))); ctx.globalAlpha = q(1); txt('PLAYER', 0, 0, 170, '#ffd400', 900, 'center', 20); ctx.restore();
        const k = eb(P(lt, .8, 1.2)); ctx.save(); ctx.translate(540, 830); ctx.scale(k, k); ctx.globalAlpha = clamp(k);
        ctx.beginPath(); ctx.roundRect(-250, -40, 500, 80, 40); ctx.fillStyle = '#ef3b5c'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.stroke();
        txt('HARD MODE · 3 PLAYERS', 0, 3, 40, '#fff'); ctx.restore();
        s.players.forEach((pl, i) => {
          const a = eb(P(lt, 1.1 + i * .25, 1.5 + i * .25));
          const ch = playerCh(pl, 230 + i * 310, 1560 + (1 - a) * 500, .85);
          silhouette(ch, Puppet.stateAt([[0, { e: 'neutral', p: i === 1 ? 'hips' : 'crossed' }]], lt, d), t);
          ctx.globalAlpha = clamp(a); txt('?', 230 + i * 310, 1560 - 300 + (1 - a) * 500, 110, '#ffd400', 900, 'center', 14); ctx.globalAlpha = 1;
        });
        txt('CAN YOU GET ALL 3?', 540, 950, 56, '#fff', 900, 'center', 12);
      }
    },
    qboard: {
      set: 'studio', cast: {}, cam: [[0, STUDIO], [1, STUDIO]], noCaption: true, bright: .95,
      dur: quizDur,
      draw(s, lt, d, t) {
        const n = s.clubs.length, rowH = 102, top = 470;
        const k0 = eb(P(lt, 0, .35));
        txt(`PLAYER ${s.num} / 3`, 540, 255, 46, '#ffd400', 900, 'center', 10);
        ctx.save(); ctx.translate(540, 335); ctx.scale(k0, k0); txt('WHO IS HE?', 0, 0, 92, '#fff', 900, 'center', 16); ctx.restore();
        const ph = eo(P(lt, .15, .5));
        ctx.save(); ctx.globalAlpha = ph;
        ctx.beginPath(); ctx.roundRect(70, top - 30, 940, n * rowH + 50, 30); ctx.fillStyle = 'rgba(20,14,48,.92)'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = OUT; ctx.stroke();
        ctx.beginPath(); ctx.roundRect(84, top - 16, 912, n * rowH + 22, 22); ctx.lineWidth = 4; ctx.strokeStyle = '#e0b84a'; ctx.stroke();
        ctx.restore();
        s.clubs.forEach((c, i) => {
          const st = .7 + i * .7, k = eo(P(lt, st, st + .35)), y = top + i * rowH + rowH / 2 - 8;
          if (k <= 0) return;
          ctx.save(); ctx.globalAlpha = k; ctx.translate((1 - k) * 160, 0);
          if (i) { ctx.beginPath(); ctx.moveTo(160, y - rowH + 40); ctx.lineTo(160, y - 40); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(224,184,74,.6)'; ctx.stroke(); }
          crest(160, y, c, 1.15 * (1 + .25 * Math.sin(P(lt, st, st + .3) * Math.PI)));
          txt(c.club, 236, y + 2, 54, '#fff', 900, 'left');
          if (c.loan) { ctx.font = '900 54px Inter Display'; const w = ctx.measureText(c.club).width; ctx.beginPath(); ctx.roundRect(252 + w, y - 20, 96, 40, 20); ctx.fillStyle = '#7b5cff'; ctx.fill(); txt('LOAN', 300 + w, y + 2, 24, '#fff'); }
          txt(String(c.year), 975, y + 2, 40, 'rgba(255,255,255,.7)', 800, 'right');
          ctx.restore();
        });
        const cd = s.countdown || 5, ts = .7 + n * .7 + .5;
        const rk = eb(P(lt, ts - .4, ts));
        if (rk > 0) {
          const ry = top + n * rowH + 140;
          ctx.save(); ctx.translate(540, ry); ctx.scale(rk * (1 + .07 * Math.max(0, Math.sin((lt - ts) * Math.PI * 2))), rk);
          ring(0, 0, 82, P(lt, ts, ts + cd), lt < ts ? cd : Math.max(0, Math.ceil(cd - (lt - ts)))); ctx.restore();
          txt('COMMENT YOUR GUESS 👇', 540, ry + 125, 40, '#fff', 800, 'center', 10);
        }
      }
    },
    qreveal: {
      set: 'studio', cast: {}, cam: [[0, STUDIO], [1, STUDIO]], noCaption: true, bright: 1.1, conf: .05, flash: true,
      dur: () => 4.2,
      draw(s, lt, d, t) {
        const pl = s.player;
        const up = eb(P(lt, .05, .5));
        const ch = playerCh(pl.look, 540, 1640 + (1 - up) * 700, 1.25);
        const st = Puppet.stateAt([[0, { e: 'happy', p: 'idle' }], [.18, { e: 'wink', p: pl.pose || 'thumbsUpR', handR: 'thumb', m: { jump: .25 } }]], lt, d);
        Puppet.draw(ctx, ch, st, t);
        const k = eo(P(lt, .1, .35));
        txt("IT'S...", 540, 255, 46, '#ffd400', 900, 'center', 10);
        const lines = pl.name.split('|');
        lines.forEach((ln, i) => {
          const q = eo(P(lt, .15 + i * .18, .37 + i * .18));
          ctx.save(); ctx.translate(540, 360 + i * 120); ctx.scale(lerp(2.2, 1, q), lerp(2.2, 1, q)); ctx.globalAlpha = q;
          txt(ln, 0, 0, i ? 120 : 92, i ? '#ffd400' : '#fff', 900, 'center', 18); ctx.restore();
        });
        const f = eo(P(lt, .8, 1.2));
        ctx.save(); ctx.globalAlpha = f; ctx.translate(0, (1 - f) * 30);
        ctx.beginPath(); ctx.roundRect(110, 560 + (lines.length - 1) * 120 - 10, 860, 90, 24); ctx.fillStyle = 'rgba(20,14,48,.85)'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.stroke();
        txt(pl.fact, 540, 560 + (lines.length - 1) * 120 + 35, 36, '#fff', 800, 'center');
        ctx.restore();
      }
    },
    qcta: {
      set: 'studio', cast: {}, cam: [[0, STUDIO], [1, STUDIO]], noCaption: true, bright: 1.05, conf: 1,
      dur: () => 4.5,
      draw(s, lt, d, t) {
        const q = k => eo(P(lt, .1 + k * .2, .32 + k * .2));
        ctx.save(); ctx.translate(540, 360); ctx.globalAlpha = q(0); txt('HOW MANY', 0, 0, 110, '#fff', 900, 'center', 18); ctx.restore();
        ctx.save(); ctx.translate(540, 480); ctx.globalAlpha = q(1); txt('DID YOU GET?', 0, 0, 110, '#ffd400', 900, 'center', 18); ctx.restore();
        const b = eb(P(lt, .7, 1.1)); ctx.save(); ctx.translate(540, 630); ctx.scale(b * (1 + .04 * Math.sin(lt * 8)), b);
        ctx.beginPath(); ctx.roundRect(-300, -48, 600, 96, 48); ctx.fillStyle = '#fe2c55'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = OUT; ctx.stroke();
        txt('＋ FOLLOW FOR EPISODE 2', 0, 3, 42, '#fff'); ctx.restore();
        s.players.forEach((pl, i) => {
          const ch = playerCh(pl, 230 + i * 310, 1600, .85);
          Puppet.draw(ctx, ch, Puppet.stateAt([[0, { e: i === 1 ? 'ecstatic' : 'happy', p: i === 1 ? 'cheer' : 'waveR', m: { wave: i === 1 ? 0 : 1, jump: i === 1 ? .4 : 0 } }]], lt, d), t);
        });
      }
    }
  });

  // ---------- timeline ----------
  let spec, scenes = [], total = 0;
  function camAt(keys, lt, d) {
    const f = lt / d;
    if (f <= keys[0][0]) return keys[0][1];
    for (let i = 0; i < keys.length - 1; i++) {
      const [fa, a] = keys[i], [fb, b] = keys[i + 1];
      if (f <= fb) { const x = eio((f - fa) / (fb - fa)); return { x: lerp(a.x, b.x, x), y: lerp(a.y, b.y, x), z: lerp(a.z, b.z, x) }; }
    }
    return keys[keys.length - 1][1];
  }
  function tokens(text) {
    const out = []; let on = false;
    for (let w of text.split(/\s+/).filter(Boolean)) { let k = on; if (w.startsWith('*')) { k = true; on = true; w = w.slice(1); } if (w.endsWith('*')) { on = false; w = w.slice(0, -1); } out.push({ w, k }); }
    return out;
  }
  window.setup = async function (sp) {
    spec = sp; total = 0;
    World3D.init(document.getElementById('gl'));
    for (const s of spec.scenes) {
      const sh = SHOTS[s.shot]; if (!sh) throw new Error('unknown shot ' + s.shot);
      s.sh = sh;
      const toks = tokens(s.text || '');
      s.duration = s.duration || (sh.dur ? sh.dur(s) : Math.max(sh.minDur || 0, toks.length / 2.5 + .9));
      s._start = total; total += s.duration; s._end = total;
      // overlay elements
      const root = el('div', null, null); root.style.display = 'none'; s._ov = root;
      if (sh.tag) s._tag = el('div', 'tag', `<span>${esc(sh.tag)}</span>`, root);
      if (sh.title) {
        s._title = el('div', 'title', null, root);
        s._tl = sh.title.map((h, i) => { const d = el('div', null, h, s._title); d.style.fontSize = (sh.titleSize[i] || 100) + 'px'; return d; });
        if (sh.sub) s._sub = el('div', 'sub', esc(sh.sub), s._title);
        if (sh.follow) s._follow = el('div', 'follow', '＋ ' + esc(sh.follow), s._title);
      }
      if (sh.counter) { s._cnt = el('div', 'title', null, root); s._cntL = el('div', 'sub', '£1,000 × 5000 =', s._cnt); s._cntN = el('div', 'gold', '£0', s._cnt); s._cntN.style.fontSize = '150px'; }
      if (sh.phone) {
        s._ph = el('div', 'phoneui', `<div class="who">📞 INCOMING CALL · THE BOOKIES</div><div class="q">CASH OUT YOUR BET?</div><div class="btns"><div class="b y">YES</div><div class="b n">NO</div></div>`, root);
      }
      if (!sh.noCaption) {
        s._cap = el('div', 'cap', null, root);
        if (sh.captionTop) s._cap.style.top = sh.captionTop + 'px';
        const wts = toks.map(t => t.w.length + 3), tot = wts.reduce((a, b) => a + b, 0) || 1;
        let acc = 0; const t0 = .12, t1 = s.duration - .3;
        toks.forEach((t, i) => { t.t = s.wordTimes && s.wordTimes[i] != null ? s.wordTimes[i] : t0 + (acc / tot) * (t1 - t0); acc += wts[i]; });
        s._chunks = []; let cur = [];
        toks.forEach(t => { const len = cur.reduce((a, x) => a + x.w.length + 1, 0); if (cur.length && (cur.length >= 3 || len + t.w.length > 15)) { s._chunks.push(cur); cur = []; } cur.push(t); if (/[.!?,:;]$/.test(t.w)) { s._chunks.push(cur); cur = []; } });
        if (cur.length) s._chunks.push(cur);
        s._active = -1;
      }
    }
    window.sceneStarts = spec.scenes.map(s => s._start);
    window.sfxEvents = buildSfx();
    await document.fonts.ready;
    return total;
  };

  // ---------- sound effects (times in seconds, gain in dB) ----------
  function buildSfx() {
    const ev = [], add = (t, name, db) => { if (t >= 0) ev.push({ t: +t.toFixed(3), name, db }); };
    spec.scenes.forEach((s, i) => {
      const sh = s.sh, st = s._start, d = s.duration, next = spec.scenes[i + 1];
      // camera pans
      for (let k = 0; k < sh.cam.length - 1; k++) {
        const [fa, a] = sh.cam[k], [fb, b] = sh.cam[k + 1];
        if (Math.abs(b.x - a.x) > 500) add(st + fa * d - .05, (fb - fa) * d > .7 ? 'whoosh_long' : 'whoosh', -15);
      }
      // scene changes
      if (next) {
        if (next.sh.set !== sh.set) add(s._end - .35, 'whoosh_long', -15);
        else if (!(next.sh.cam[0][1].x === sh.cam[sh.cam.length - 1][1].x)) add(s._end - .12, 'whoosh_soft', -21);
      }
      if (sh.tag) add(st + .05, 'pop', -19);
      const at = (f, name, db) => add(st + f * d, name, db);
      switch (s.shot) {
        case 'hook': sh.title.forEach((_, k) => add(st + .1 + k * .22 + .18, 'thump', -13)); add(st + .55 * d, 'sparkle', -19); break;
        case 'bet': at(.4, 'kaching', -17); at(.75, 'ding', -17); break;
        case 'confident': at(.46, 'sparkle', -16); break;
        case 'ranieri': add(st + d * .31, 'pop', -16); break;
        case 'vardy': for (let k = 1; k <= 11; k++) add(st + d * .12 + (k - 1) / 11 * d * .45, 'tick', -17); at(.57, 'ding', -17); break;
        case 'christmas': add(st + d * .1, 'pop', -16); at(.58, 'sparkle', -18); break;
        case 'city': add(st + .1, 'whistle', -22); break;
        case 'cashout': add(st + .05, 'ring', -16); add(st + 1.7, 'ring', -18); at(.86, 'click', -13); break;
        case 'chelsea': for (let x = .1; x < d * .7; x += .85) add(st + x, 'heartbeat', -13); at(.73, 'thump', -12); at(.9, 'whistle', -18); break;
        case 'champions': add(st, 'thump', -10); add(st + .02, 'cheer', -13); break;
        case 'payout': at(.62, 'thump', -12); at(.66, 'coins', -18); for (let k = 0; k < 10; k++) add(st + d * (.52 + k * .021), 'tick', -21); at(.74, 'kaching', -13); break;
        case 'cta': add(st + .9, 'pop', -14); add(st + .2, 'coins', -22); break;
        case 'qhook': add(st + .3, 'thump', -12); add(st + .5, 'thump', -12); add(st + .9, 'pop', -15); for (let k = 0; k < 3; k++) add(st + 1.2 + k * .25, 'whoosh_soft', -20); break;
        case 'qboard': {
          add(st + .05, 'pop', -16);
          s.clubs.forEach((_, k) => add(st + .7 + k * .7, 'pop', -17));
          const ts = st + .7 + s.clubs.length * .7 + .5, cd = s.countdown || 5;
          for (let k = 0; k < cd; k++) add(ts + k, 'tick', k >= cd - 2 ? -12 : -15);
          break;
        }
        case 'qreveal': add(st, 'thump', -10); add(st + .05, 'sparkle', -15); add(st + .1, 'cheer', -22); break;
        case 'qcta': add(st + .1, 'thump', -13); add(st + .75, 'pop', -14); break;
      }
    });
    return ev.sort((a, b) => a.t - b.t);
  }

  function updateOverlay(s, lt, d) {
    const sh = s.sh;
    if (s._tag) { const k = eb(P(lt, .05, .4)); s._tag.style.transform = `scale(${k})`; s._tag.style.opacity = clamp(k); }
    if (s._title) {
      s._tl.forEach((e, i) => { const st = .1 + i * .22, q = eo(P(lt, st, st + .22)); e.style.opacity = clamp(q * 3); e.style.transform = `scale(${lerp(2.2, 1, q)}) rotate(${(1 - q) * -6}deg)`; });
      if (s._sub) s._sub.style.opacity = P(lt, d * .55, d * .55 + .3);
      if (s._follow) { const k = eb(P(lt, .9, 1.3)); s._follow.style.transform = `scale(${k * (1 + .05 * Math.sin(lt * 8))})`; s._follow.style.opacity = clamp(k); }
    }
    if (s._cnt) {
      s._cntL.style.opacity = P(lt, d * .28, d * .28 + .3);
      const v = P(lt, d * .52, d * .73), k = eo(v);
      const val = v <= 0 ? 0 : Math.round(lerp(1000, 5000000, k * k));
      s._cntN.textContent = '£' + val.toLocaleString('en-US');
      s._cntN.style.opacity = P(lt, d * .5, d * .53);
      const pop = P(lt, d * .73, d * .81); s._cntN.style.transform = `scale(${1 + Math.sin(pop * Math.PI) * .25})`;
      if (s._cap) s._cap.style.opacity = lt < d * .5 ? 1 : 0;
    }
    if (s._ph) {
      const f = lt / d, k = eb(P(f, .1, .2)), out = P(f, .9, .95);
      s._ph.style.transform = `scale(${k * (1 - out)}) rotate(${Math.sin(lt * 40) * (f < .25 ? 2 : 0)}deg)`;
      s._ph.style.opacity = clamp(k) * (1 - out);
      const n = s._ph.querySelector('.n'), y = s._ph.querySelector('.y');
      const press = P(f, .86, .9); n.style.transform = `scale(${1 + Math.sin(press * Math.PI) * .2})`; n.style.boxShadow = press > 0 ? '0 0 0 10px #ffd400' : 'none';
      y.style.opacity = f > .86 ? .35 : 1;
    }
    if (s._cap) {
      let idx = 0; s._chunks.forEach((ch, i) => { if (lt >= ch[0].t - .05) idx = i; });
      if (idx !== s._active) { s._active = idx; s._cap.innerHTML = ''; s._spans = s._chunks[idx].map(t => { const e = el('span', null, esc(t.w), s._cap); e._t = t.t; return e; }); }
      const ch = s._chunks[idx]; const pop = eb(P(lt, ch[0].t - .05, ch[0].t + .12));
      s._cap.style.transform = `scale(${lerp(.75, 1, pop)})`;
      s._spans.forEach((e, i) => { const next = s._spans[i + 1] ? s._spans[i + 1]._t : Infinity; const on = lt >= e._t && lt < next; e.classList.toggle('on', on); e.style.transform = `scale(${on ? 1.1 : 1}) rotate(${on ? -2 : 0}deg)`; });
    }
  }

  window.frame = function (t) {
    let idx = spec.scenes.findIndex(s => t < s._end); if (idx < 0) idx = spec.scenes.length - 1;
    const s = spec.scenes[idx], sh = s.sh, lt = t - s._start, d = s.duration;
    spec.scenes.forEach((x, i) => { x._ov.style.display = i === idx ? 'block' : 'none'; });
    const prev = spec.scenes[idx - 1], next = spec.scenes[idx + 1];
    let cam = camAt(sh.cam, lt, d);
    const shake = sh.shake ? Math.max(0, 1 - lt / 1.5) * 14 : 0;
    // 3D world with theme crossfade
    const br = sh.bright != null ? sh.bright : 1;
    const pbr = prev && prev.sh.set === sh.set ? (prev.sh.bright != null ? prev.sh.bright : 1) : br;
    const conf = sh.conf ? (sh.conf < 1 ? P(lt, sh.conf * d, sh.conf * d + .4) : 1) : 0;
    World3D.frame(t, { x: cam.x - Math.sin(t * 50) * shake * 0, y: cam.y, z: cam.z }, sh.set, { bright: lerp(pbr, br, eio(P(lt, 0, .8))), conf });
    // 2D
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.setTransform(cam.z, 0, 0, cam.z, W / 2 - cam.x * cam.z + Math.sin(t * 50) * shake, H / 2 - cam.y * cam.z + Math.cos(t * 43) * shake);
    const states = {};
    for (const name in sh.cast) states[name] = Puppet.stateAt(sh.acts[name] || [[0, {}]], lt, d);
    if (sh.propFix) for (const n in sh.propFix) for (const [f, pr] of sh.propFix[n]) if (lt >= f * d) states[n].propL = pr;
    const drawC = name => { if (!sh.cast[name]) return; const c = Object.assign({}, CH[name], sh.cast[name], { y: GROUND }); Puppet.draw(ctx, c, states[name], t); };
    if (sh.draw) {
      sh.draw(s, lt, d, t);
    } else if (sh.set === 'bookies') {
      drawBookiesBack(t, Object.assign({ lt: lt / d }, sh.fx || {}));
      drawC('bookie'); drawCounter();
      ['hero', 'mike', 'jay'].forEach(drawC);
    } else {
      drawTV(t, sh.card === 'off' ? 'champions' : sh.card, lt, d);
      drawSofa();
      ['mike', 'jay', 'hero'].forEach(drawC);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const rain = sh.rain != null ? (sh.rain > 0 ? P(lt, sh.rain * d, sh.rain * d + .3) : 1) : 0;
    moneyRain(t, rain);
    if (sh.flash) { const a = .85 * (1 - P(lt, 0, .3)); if (a > 0) { ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(0, 0, W, H); } }
    // iris wipe between sets
    let iris = 1;
    if (next && next.sh.set !== sh.set) iris = Math.min(iris, 1 - eio(P(lt, d - .3, d)));
    if (prev && prev.sh.set !== sh.set) iris = Math.min(iris, eio(P(lt, 0, .3)));
    if (iris < 1) {
      ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(W / 2, H * .55, Math.max(1, iris * 1250), 0, Math.PI * 2, true);
      ctx.fillStyle = OUT; ctx.fill('evenodd');
    }
    updateOverlay(s, lt, d);
  };
})();
