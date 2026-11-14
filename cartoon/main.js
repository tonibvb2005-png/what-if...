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

  // ---------- bet configuration (per spec; defaults = Leicester) ----------
  const BET = () => Object.assign({ top: 'TITLE ODDS 2015/16', team: 'LEICESTER CITY', odds: '5000 / 1', cur: '£', stake: 1000, mult: 5000, slip: '5000/1', champ: ['LEICESTER CITY', 'CHAMPIONS!'] }, (spec && spec.bet) || {});
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
    txt(BET().top, x, y - 64, 28, '#e0b84a', 800);
    txt(BET().team, x, y - 26, 40, '#ffffff', 900);
    const pulse = fx.signPulse != null ? Math.sin(P(fx.lt, fx.signPulse, fx.signPulse + .6) * Math.PI) : 0;
    ctx.save(); ctx.translate(x, y + 48); ctx.scale(1 + pulse * .2, 1 + pulse * .2);
    txt(BET().odds, 0, 0, 92, '#ff5a4f', 900); ctx.restore();
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
    if (typeof card === 'function') card(t, lt, d); else drawCard(card, t, lt, d);
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
    } else if (card === 'blank') {
      cardBg('#14162a', '#07080f');
    } else if (card === 'champions') {
      const fl = Math.sin(t * 12) > 0;
      cardBg(fl ? '#1655d6' : '#0d2a8a', '#06134a');
      txt(BET().champ[0], TVW / 2, 200, 84, '#fff'); txt(BET().champ[1], TVW / 2, 320, BET().champ[1].length > 12 ? 70 : 110, '#ffd400', 900, 'center', 10);
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
      txt(BET().cur, 0, 2, 34, '#1e5c30');
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


  // ---------- Istanbul 2005 story ----------
  let CUR = null;                       // scene being drawn (for cue lookups)
  const cue = (name, def) => CUR && CUR.cues && CUR.cues[name] != null ? CUR.cues[name] : def * (CUR ? CUR.duration : 1);
  function scoreCard(top, steps, extra) {
    // steps: [[cueName|null, defFrac, ga, gb, label]]
    return (t, lt, d) => {
      cardBg('#7a0f22', '#2b0610');
      let ga = steps[0][2], gb = steps[0][3], label = steps[0][4], at = -9;
      for (const [cn, df, a, b, lb] of steps) { const tt = cn ? cue(cn, df) : df * d; if (lt >= tt) { ga = a; gb = b; label = lb; at = tt; } }
      txt(top, TVW / 2, 100, 34, '#ffd400', 800);
      const y = 240;
      ctx.beginPath(); ctx.roundRect(40, y - 120, TVW - 80, 250, 30); ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = '#fff';
      ctx.beginPath(); ctx.arc(150, y - 20, 48, 0, Math.PI * 2); ctx.fillStyle = '#d81e2c'; ctx.fill(); ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.arc(150, y - 20, 45, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = '#111'; for (let k = -2; k <= 2; k += 2) ctx.fillRect(150 + k * 14 - 7, y - 70, 14, 100); ctx.restore();
      ctx.beginPath(); ctx.arc(TVW - 150, y - 20, 48, 0, Math.PI * 2); ctx.fillStyle = '#c8102e'; ctx.fill(); ctx.stroke();
      txt('AC MILAN', 150, y + 70, 36, '#fff'); txt('LIVERPOOL', TVW - 150, y + 70, 36, '#fff');
      const k = 1 + .5 * Math.max(0, 1 - (lt - at) / .5);
      ctx.save(); ctx.translate(TVW / 2, y + 10); ctx.scale(k, k); txt(`${ga} – ${gb}`, 0, 0, 120, '#ffd400', 900, 'center', 12); ctx.restore();
      if (label) { const kk = eb(P(lt, at, at + .35)); ctx.save(); ctx.translate(TVW / 2, 445); ctx.scale(kk, kk); txt(label, 0, 0, 50, '#fff', 900, 'center', 10); ctx.restore(); }
      if (extra) extra(t, lt, d);
    };
  }
  function textCard(lines, bg = ['#0b3d2e', '#04150f']) {
    return (t, lt, d) => {
      cardBg(bg[0], bg[1]);
      lines.forEach(([txtv, size, color, cn, df], i) => {
        const tt = cn ? cue(cn, df) : (df || 0) * d; const k = eb(P(lt, tt, tt + .35)); if (k <= 0) return;
        ctx.save(); ctx.translate(TVW / 2, 130 + i * 120); ctx.scale(k, k);
        if (txtv === 'DUDEK_DANCE') ctx.rotate(Math.sin(t * 9) * .12);
        txt(txtv === 'DUDEK_DANCE' ? "DUDEK'S DANCE" : txtv, 0, 0, size, color, 900, 'center', 8); ctx.restore();
      });
    };
  }
  function drawBus(t) {
    const x0 = 1150, x1 = 1950, top = 600, bot = GROUND - 40;
    ctx.lineWidth = 7; ctx.strokeStyle = OUT;
    ctx.beginPath(); ctx.roundRect(x0, top, x1 - x0, bot - top, 40); ctx.fillStyle = '#ffcf4a'; ctx.fill(); ctx.stroke();
    for (let i = 0; i < 2; i++) {
      const wx = x0 + 50 + i * 370, wy = top + 60;
      ctx.save(); ctx.beginPath(); ctx.roundRect(wx, wy, 330, 260, 24); ctx.clip();
      const g = ctx.createLinearGradient(0, wy, 0, wy + 260); g.addColorStop(0, '#1d1f4a'); g.addColorStop(1, '#5a3a6a'); ctx.fillStyle = g; ctx.fillRect(wx, wy, 330, 260);
      for (let k = 0; k < 14; k++) { const bx = wx + ((k * 97 - t * 260) % 700 + 700) % 700 - 180, bh = 60 + (k * 37) % 120; ctx.fillStyle = '#2a2448'; ctx.fillRect(bx, wy + 260 - bh, 60, bh); ctx.fillStyle = 'rgba(255,220,140,.8)'; ctx.fillRect(bx + 14, wy + 260 - bh + 16, 10, 12); }
      ctx.restore(); ctx.beginPath(); ctx.roundRect(wx, wy, 330, 260, 24); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(x0 + 400, top); ctx.lineTo(x0 + 400, bot); ctx.lineWidth = 14; ctx.strokeStyle = '#b7bccf'; ctx.stroke();
    ctx.beginPath(); ctx.roundRect(x0 + 60, bot - 220, 260, 160, 30); ctx.fillStyle = '#3f62ad'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = OUT; ctx.stroke();
    txt((CUR && CUR.sh.busLabel) || 'BUS HOME', x0 + 400, top + 32, 34, OUT, 900);
  }
  function musicNotes(t, xs) {
    xs.forEach((x, i) => { for (let k = 0; k < 3; k++) { const ph = (t * .6 + k / 3 + i * .17) % 1; ctx.globalAlpha = Math.sin(ph * Math.PI);
      txt(k % 2 ? '♪' : '♫', x + Math.sin(t * 2 + k) * 40 + (k - 1) * 50, 860 - ph * 260, 64, '#ffd400', 900, 'center', 8); } });
    ctx.globalAlpha = 1;
  }
  const IROOM = { mike: { x: -270 }, hero: { x: 0 }, jay: { x: 270 } };
  const IG = { x: 0, y: 985, z: 1.25 }, IG2 = { x: 0, y: 995, z: 1.33 };
  const panTV = (a, b) => [[0, TV], [a, TV], [b, IG], [1, IG2]];
  Object.assign(SHOTS, {
    ihook: {
      set: 'room', cast: IROOM, noCaption: true, bright: .95,
      title: ['WHAT IF YOU LEFT', 'AT <span class="gold">HALF-TIME</span>?'], titleSize: [92, 110],
      cam: [[0, { x: 0, y: 1010, z: 1.15 }], [1, { x: 0, y: 1000, z: 1.25 }]], card: 'off',
      acts: { hero: [[0, { e: 'confident', m: { lookX: 0 } }]], mike: [[0, { e: 'smirk', p: 'crossed', m: { lookX: 1 } }], [.5, { e: 'neutral', p: 'idle', propR: 'coat', m: { lookX: 1 } }]], jay: [[0, { e: 'happy', m: { lookX: -1 } }]] }
    },
    iintro: {
      set: 'room', cast: IROOM, tag: '25 MAY 2005', bright: 1,
      card: textCard([['CHAMPIONS LEAGUE FINAL', 40, '#ffd400', null, .05], ['ISTANBUL', 96, '#fff', null, .15], ['AC MILAN vs LIVERPOOL', 54, '#fff', null, .45]], ['#0b2a7a', '#06134a']),
      cam: panTV(.62, .72),
      acts: { hero: [[0, { e: 'happy', m: { lookX: -1 } }], [.72, { e: 'ecstatic', p: 'cheer', m: { lookX: 0, jump: .4 } }]], mike: [[0, { e: 'happy', m: { lookX: -1 } }], [.72, { e: 'happy', p: 'fistPumpR', handR: 'fist', m: { lookX: 1 } }]], jay: [[0, { e: 'happy', m: { lookX: -1 } }], [.74, { e: 'ecstatic', p: 'cheer', m: { dance: .6 } }]] }
    },
    imaldini: {
      set: 'room', cast: IROOM, tag: '1st MINUTE', bright: .95,
      card: scoreCard('CHAMPIONS LEAGUE FINAL', [[null, 0, 0, 0, ''], ['goal', .5, 1, 0, 'MALDINI']]),
      cam: [[0, TV], [.66, TV], [.76, IG], [1, IG2]],
      acts: { hero: [[0, { e: 'happy', m: { lookX: -1 } }], [.76, { e: 'shock', p: 'handsOnHead', m: { lookX: 0 } }]], mike: [[0, { e: 'happy', m: { lookX: -1 } }], [.76, { e: 'shock', m: { lookX: -1 } }]], jay: [[0, { e: 'happy', m: { lookX: -1 } }], [.78, { e: 'surprised', p: 'nervous', m: { lookX: -1 } }]] }
    },
    icrespo: {
      set: 'room', cast: IROOM, bright: .82,
      card: scoreCard('CHAMPIONS LEAGUE FINAL', [[null, 0, 1, 0, ''], ['g2', .25, 2, 0, 'CRESPO'], ['g3', .5, 3, 0, 'CRESPO AGAIN'], ['ht', .68, 3, 0, 'HALF-TIME']]),
      cam: [[0, TV], [.72, TV], [.8, IG], [1, IG2]],
      acts: { hero: [[0, { e: 'worried', m: { lookX: -1 } }], [.8, { e: 'despair', m: { lookX: -1 } }]], mike: [[0, { e: 'worried', m: { lookX: -1 } }], [.8, { e: 'despair', p: 'handsOnHead', m: { lookX: -1 } }]], jay: [[0, { e: 'worried', m: { lookX: -1 } }], [.82, { e: 'despair', p: 'crossed', m: { lookX: -1, tremble: .4 } }]] }
    },
    ileave: {
      set: 'room', cast: IROOM, bright: .8, card: scoreCard('HALF-TIME', [[null, 0, 3, 0, '']]),
      cam: [[0, IG], [1, { x: -120, y: 990, z: 1.2 }]],
      move: { mike: [[0, -270], ['leave', .45, -270], [1, -1250]] },
      acts: {
        mike: [[0, { e: 'focused', ex: { mouthCurve: -.4 }, p: 'idle', m: { lookX: 0, no: .6 } }], [.4, { e: 'focused', ex: { mouthCurve: -.4 }, p: 'idle', propR: 'coat', m: { lookX: -1, no: 0 } }], [.5, { m: { walk: 1, lookX: -1 } }]],
        hero: [[0, { e: 'despair', m: { lookX: -1 } }], [.45, { e: 'surprised', m: { lookX: -1 } }]], jay: [[0, { e: 'despair', m: { lookX: -1 } }], [.5, { e: 'worried', m: { lookX: -1 } }]]
      }
    },
    isinging: {
      set: 'room', cast: { hero: { x: -120 }, jay: { x: 170 } }, bright: .9, card: 'off',
      cam: [[0, { x: -120, y: 990, z: 1.2 }], [.4, { x: 20, y: 1010, z: 1.45 }], [1, { x: 20, y: 1000, z: 1.3 }]],
      notesFrom: 'sing',
      acts: { hero: [[0, { e: 'confident', m: { lookX: 0 } }], ['sing', .5, { e: 'happy', p: 'cheer', m: { sing: 1 } }]], jay: [[0, { e: 'surprised', m: { lookX: -1 } }], ['sing', .55, { e: 'happy', p: 'cheer', m: { sing: 1 } }]] }
    },
    igerrard: {
      set: 'room', cast: { hero: { x: -120 }, jay: { x: 170 } }, tag: "54'", bright: .95,
      card: scoreCard('SECOND HALF', [[null, 0, 3, 0, ''], ['goal', .55, 3, 1, 'GERRARD!']]),
      cam: [[0, TV], [.7, TV], [.8, { x: 20, y: 985, z: 1.3 }], [1, { x: 20, y: 995, z: 1.38 }]],
      acts: { hero: [[0, { e: 'tense', p: 'nervous', m: { lookX: -1 } }], [.8, { e: 'ecstatic', p: 'fistPumpR', handR: 'fist', m: { lookX: 0, jump: .4 } }]], jay: [[0, { e: 'tense', m: { lookX: -1 } }], [.8, { e: 'happy', p: 'cheer', m: { lookX: -1 } }]] }
    },
    ismicer: {
      set: 'room', cast: { hero: { x: -120 }, jay: { x: 170 } }, tag: "56'", bright: 1,
      card: scoreCard('SECOND HALF', [[null, 0, 3, 1, ''], ['goal', .6, 3, 2, 'ŠMICER!']]),
      cam: [[0, TV], [.72, TV], [.82, { x: 20, y: 985, z: 1.3 }], [1, { x: 20, y: 995, z: 1.38 }]],
      acts: { hero: [[0, { e: 'happy', m: { lookX: -1 } }], [.82, { e: 'ecstatic', p: 'cheer', m: { jump: 1 } }]], jay: [[0, { e: 'surprised', m: { lookX: -1 } }], [.82, { e: 'ecstatic', p: 'cheer', m: { jump: .8 } }]] }
    },
    ialonso: {
      set: 'room', cast: { hero: { x: -120 }, jay: { x: 170 } }, tag: "60'", bright: 1.05,
      card: scoreCard('SECOND HALF', [[null, 0, 3, 2, ''], ['pen', .1, 3, 2, 'PENALTY!'], ['saved', .37, 3, 2, 'SAVED...'], ['goal', .55, 3, 3, 'ALONSO! 3–3']]),
      cam: [[0, TV], [.62, TV], [.72, { x: 20, y: 985, z: 1.25 }], [1, { x: 20, y: 990, z: 1.15 }]],
      acts: { hero: [[0, { e: 'tense', p: 'pleading', m: { lookX: -1, tremble: .5 } }], [.72, { e: 'ecstatic', p: 'cheer', m: { jump: 1 } }]], jay: [[0, { e: 'tense', p: 'nervous', m: { lookX: -1, tremble: .5 } }], [.72, { e: 'ecstatic', p: 'cheer', m: { dance: 1 } }]] }
    },
    idudek: {
      set: 'room', cast: { hero: { x: -120 }, jay: { x: 170 } }, tag: 'EXTRA TIME', bright: .78,
      card: textCard([['SHEVCHENKO...', 70, '#fff', 'shot', .2], ['DOUBLE SAVE!', 96, '#ffd400', 'save', .7], ['JERZY DUDEK', 54, '#fff', 'save', .72]], ['#2a0d5c', '#0d0524']),
      cam: [[0, TV], [.78, TV], [.86, { x: 20, y: 990, z: 1.35 }], [1, { x: 20, y: 990, z: 1.4 }]],
      acts: { hero: [[0, { e: 'tense', p: 'nervous', m: { lookX: -1, tremble: .6 } }], [.86, { e: 'shock', p: 'handsOnHead', m: { lookX: 0 } }]], jay: [[0, { e: 'worried', p: 'nervous', m: { lookX: -1, tremble: .6 } }], [.86, { e: 'shock', p: 'handsOnHead', m: { lookX: -1 } }]] }
    },
    ipens: {
      set: 'room', cast: { hero: { x: -120 }, jay: { x: 170 } }, tag: 'PENALTIES', bright: .7,
      card: textCard([['DUDEK_DANCE', 84, '#ffd400', 'dance', .2], ['SHEVCHENKO', 70, '#fff', 'step', .7], ['STEPS UP...', 54, '#fff', 'step', .72]], ['#2a0d5c', '#0d0524']),
      cam: [[0, TV], [.55, TV], [.65, { x: 20, y: 1000, z: 1.45 }], [1, { x: 20, y: 1005, z: 1.6 }]],
      acts: { hero: [[0, { e: 'tense', p: 'pleading', m: { lookX: -1, tremble: .8 } }]], jay: [[0, { e: 'worried', p: 'nervous', m: { lookX: -1, tremble: .8 } }]] }
    },
    isaved: {
      set: 'room', cast: { hero: { x: -120 }, jay: { x: 170 } }, bright: 1.12, conf: 1, flash: true, shake: 1, card: 'off',
      cam: [[0, { x: 20, y: 985, z: 1.3 }], [1, { x: 20, y: 985, z: 1.15 }]],
      acts: { hero: [[0, { e: 'ecstatic', p: 'cheer', m: { jump: 1 } }]], jay: [[0, { e: 'ecstatic', p: 'cheer', m: { dance: 1 } }]] }
    },
    imate: {
      set: 'room', cast: { mike: { x: 1550 } }, bright: 1, bus: true, card: 'off',
      title: ['FOLLOW FOR MORE', '<span class="gold">WHAT IFs</span>'], titleSize: [84, 110], titleAt: 'follow',
      cam: [[0, { x: 1550, y: 990, z: 1.3 }], [1, { x: 1550, y: 1000, z: 1.4 }]],
      acts: { mike: [[0, { e: 'neutral', p: 'phone', propR: 'radio', m: { lookX: -.5 } }], ['radio', .45, { e: 'shock', p: 'phone', propR: 'radio', m: { lookX: 0 } }], ['follow', .75, { e: 'despair', p: 'handsOnHead', propR: null, m: { lookX: 0 } }]] }
    }
  });


  // ---------- Istanbul v2: stadium, pitch action, bus ----------
  Object.assign(CH, {
    maldini:   { skin: '#f0c19a', shirt: '#d81e2c', stripes: '#111111', trim: '#fff', number: '3', pants: '#ffffff', shoes: '#111', hair: 'short', hairColor: '#3a2414', bw: 1, blinkPh: .4 },
    crespo:    { skin: '#f0c19a', shirt: '#d81e2c', stripes: '#111111', trim: '#fff', pants: '#ffffff', shoes: '#111', hair: 'spiky', hairColor: '#2a1a10', stubble: true, bw: 1, blinkPh: .9 },
    shevchenko:{ skin: '#ffd9b8', shirt: '#d81e2c', stripes: '#111111', trim: '#fff', number: '7', pants: '#ffffff', shoes: '#111', hair: 'short', hairColor: '#c9a46a', bw: 1, blinkPh: 1.7 },
    dida:      { skin: '#6b4430', shirt: '#3a3f52', trim: '#ffd400', number: '1', pants: '#3a3f52', shoes: '#111', hair: 'buzz', hairColor: '#120a05', bw: 1.05, blinkPh: 2.2 },
    gerrard:   { skin: '#ffd2b0', shirt: '#c8102e', trim: '#fff', number: '8', pants: '#c8102e', shoes: '#111', hair: 'short', hairColor: '#6a4a2a', bw: 1, blinkPh: .2 },
    smicer:    { skin: '#ffd9b8', shirt: '#c8102e', trim: '#fff', pants: '#c8102e', shoes: '#111', hair: 'slick', hairColor: '#4a3020', bw: 1, blinkPh: 1.1 },
    alonso:    { skin: '#f0c19a', shirt: '#c8102e', trim: '#fff', number: '14', pants: '#c8102e', shoes: '#111', hair: 'short', hairColor: '#2a1a10', beard: true, bw: 1, blinkPh: 2.6 },
    dudek:     { skin: '#ffd9b8', shirt: '#2fbf71', trim: '#111', number: '1', pants: '#1f2236', shoes: '#111', hair: 'short', hairColor: '#7a5a3a', bw: 1.05, blinkPh: 1.5 }
  });
  Object.assign(Puppet.POSES, {});
  const KP = { lA: 62, lE: -25, rA: 62, rE: -25, lL: 16, lK: -18, rL: 16, rK: -18 };          // keeper ready
  const DIVE_L = { lA: 170, lE: 5, rA: 150, rE: 10, lL: 20, rL: 30, lean: -78 };
  const DIVE_R = { lA: 150, lE: 10, rA: 170, rE: 5, lL: 30, rL: 20, lean: 78 };
  const KICK = { lL: 70, lK: -15, rL: 6, lA: 40, rA: 50, rE: -20 };
  const GOAL = { x0: -640, x1: -60, top: 980 };
  function drawGoalBack() {
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.45)';
    for (let x = GOAL.x0 + 20; x < GOAL.x1; x += 34) { ctx.beginPath(); ctx.moveTo(x, GOAL.top + 10); ctx.lineTo(x + 20, GROUND - 30); ctx.stroke(); }
    for (let y = GOAL.top + 30; y < GROUND - 20; y += 34) { ctx.beginPath(); ctx.moveTo(GOAL.x0 + 10, y); ctx.lineTo(GOAL.x1 - 10, y + 6); ctx.stroke(); }
  }
  function drawGoalFront() {
    ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.strokeStyle = OUT;
    ctx.beginPath(); ctx.moveTo(GOAL.x0, GROUND); ctx.lineTo(GOAL.x0, GOAL.top); ctx.lineTo(GOAL.x1, GOAL.top); ctx.lineTo(GOAL.x1, GROUND); ctx.stroke();
    ctx.lineWidth = 12; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  }
  function drawBall(x, y, t, spin = 1, sc = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    ctx.save(); ctx.translate(0, GROUND - y + 4); ctx.scale(1, .25); ctx.beginPath(); ctx.arc(0, 0, 26 * Math.max(.3, 1 - (GROUND - y) / 900), 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fill(); ctx.restore();
    ctx.rotate(t * 8 * spin);
    ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 - Math.PI / 2; ctx.lineTo(Math.cos(a) * 10, Math.sin(a) * 10); } ctx.closePath(); ctx.fillStyle = OUT; ctx.fill();
    ctx.restore();
  }
  // ball path: keys [[time, x, y, arc]]; arc lifts the segment ending at that key
  function ballPos(keys, lt) {
    if (lt <= keys[0][0]) return { x: keys[0][1], y: keys[0][2], moving: false };
    for (let i = 0; i < keys.length - 1; i++) {
      const [ta, xa, ya] = keys[i], [tb, xb, yb, arc] = keys[i + 1];
      if (lt <= tb) { const u = (lt - ta) / (tb - ta || 1); return { x: lerp(xa, xb, u), y: lerp(ya, yb, u) - Math.sin(u * Math.PI) * (arc || 0), moving: true }; }
    }
    const k = keys[keys.length - 1]; return { x: k[1], y: k[2], moving: false };
  }
  function scoreboard(txtScore, label) {
    const x = -330, y = 680;
    ctx.beginPath(); ctx.roundRect(x - 220, y - 52, 440, 104, 18); ctx.fillStyle = '#1c2238'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.beginPath(); ctx.roundRect(x - 206, y - 38, 412, 76, 12); ctx.lineWidth = 4; ctx.strokeStyle = '#e0b84a'; ctx.stroke();
    txt(txtScore, x, y + 2, 46, '#fff', 900);
    if (label) txt(label, x, y + 82, 32, '#ffd400', 900, 'center', 8);
  }
  function drawRailing() {
    ctx.lineWidth = 7; ctx.strokeStyle = OUT;
    ctx.beginPath(); ctx.roundRect(-1600, 1210, 3400, 40, 14); ctx.fillStyle = '#c9ced8'; ctx.fill(); ctx.stroke();
    const rl = (spec && spec.railing) || { color: '#c8102e', text: "YOU'LL NEVER WALK ALONE" };
    ctx.beginPath(); ctx.roundRect(-1600, 1250, 3400, 260, 0); ctx.fillStyle = rl.color; ctx.fill(); ctx.stroke();
    ctx.font = '900 56px Inter Display'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = rl.textColor || '#fff';
    for (let x = -1650; x < 1800; x += 1100) ctx.fillText(rl.text, x, 1330);
  }
  const PITCH = { x: -60, y: 820, z: 1.0 }, STANDS = { x: 0, y: 985, z: 1.22 }, STANDS2 = { x: 0, y: 995, z: 1.32 };
  const FANS = { mike: { x: -270 }, hero: { x: 0 }, jay: { x: 270 } }, FANS2 = { hero: { x: -120 }, jay: { x: 170 } };
  const cueT = (n, df) => cue(n, df);
  // cuts: [{ at: [cueName|null, defFrac] | frac, set, cam, cast, acts, move, ball, score, label, extra }]
  const pitchCut = o => Object.assign({ set: 'pitch', cam: [[0, PITCH], [1, Object.assign({}, PITCH, { z: PITCH.z + .04 })]] }, o);
  const standsCut = o => Object.assign({ set: 'stands', cam: [[0, STANDS], [1, STANDS2]] }, o);
  Object.assign(SHOTS, {
    ihook: { set: 'stands', noCaption: true, bright: 1, title: ['WHAT IF YOU LEFT', 'AT <span class="gold">HALF-TIME</span>?'], titleSize: [92, 110],
      cuts: [standsCut({ at: 0, cam: [[0, { x: 0, y: 1000, z: 1.1 }], [1, { x: 0, y: 995, z: 1.2 }]], cast: FANS,
        acts: { hero: [[0, { e: 'happy', p: 'cheer', propR: 'scarf', m: { sing: .6 } }]], mike: [[0, { e: 'happy', p: 'cheer', propR: 'scarf' }]], jay: [[0, { e: 'ecstatic', p: 'cheer', propR: 'scarf', m: { dance: .5 } }]] } })] },
    iintro: { set: 'pitch', tag: '25 MAY 2005', bright: 1,
      cuts: [
        pitchCut({ at: 0, cast: { gerrard: { x: 260, scale: .8 }, maldini: { x: -330, scale: .8 } }, score: 'MIL 0 – 0 LIV', label: 'ISTANBUL',
          acts: { gerrard: [[0, { e: 'focused', p: 'hips', m: { lookX: -1 } }]], maldini: [[0, { e: 'confident', p: 'crossed', m: { lookX: 1 } }]] }, ball: [[0, -30, 1385]] }),
        standsCut({ at: .58, cast: FANS, acts: { hero: [[0, { e: 'ecstatic', p: 'cheer', propR: 'scarf', m: { jump: .4 } }]], mike: [[0, { e: 'happy', p: 'fistPumpR', handR: 'fist' }]], jay: [[0, { e: 'happy', p: 'cheer', propR: 'scarf', m: { dance: .6 } }]] } })] },
    imaldini: { set: 'pitch', tag: '1st MINUTE', bright: .95,
      cuts: [
        pitchCut({ at: 0, cast: { maldini: { x: 300, scale: .8 }, dudek: { x: -340, scale: .78 } },
          score: lt => lt < cue('goal', .5) ? 'MIL 0 – 0 LIV' : 'MIL 1 – 0 LIV', label: lt => lt >= cue('goal', .5) ? 'MALDINI' : '',
          ball: () => { const g = cue('goal', .5); return [[0, 900, 700], [g - .9, 230, 1380, 260], [g, -380, 1120, 120], [g + .5, -420, 1385, 40]]; },
          acts: () => { const g = cue('goal', .5); return {
            maldini: [[0, { e: 'focused', p: 'idle', m: { lookX: 1 } }], [(g - 1.1) / CUR.duration, { m: { lookX: -1 } }], [(g - .95) / CUR.duration, { p: 'idle', po: KICK }], [(g + .2) / CUR.duration, { e: 'ecstatic', p: 'cheer', po: {}, m: { jump: .6 } }]],
            dudek: [[0, { e: 'focused', p: 'idle', po: KP, m: { lookX: 1 } }], [(g - .5) / CUR.duration, { e: 'shock', p: 'idle', po: DIVE_L, m: { dy: -60 } }], [(g + .6) / CUR.duration, { e: 'despair', p: 'idle', po: { lean: -88, lA: 160, rA: 160 }, m: { dy: 0 } }]] }; } }),
        standsCut({ at: .78, cast: FANS, acts: { hero: [[0, { e: 'shock', p: 'handsOnHead' }]], mike: [[0, { e: 'shock', m: { lookX: 1 } }]], jay: [[0, { e: 'surprised', p: 'nervous' }]] } })] },
    icrespo: { set: 'pitch', bright: .9,
      cuts: [
        pitchCut({ at: 0, cast: { crespo: { x: 280, scale: .8 }, dudek: { x: -340, scale: .78 } },
          score: lt => lt < cue('g2', .25) ? 'MIL 1 – 0 LIV' : lt < cue('g3', .5) ? 'MIL 2 – 0 LIV' : 'MIL 3 – 0 LIV',
          label: lt => lt >= cue('ht', .68) ? 'HALF-TIME' : lt >= cue('g2', .25) ? 'CRESPO' : '',
          ball: () => { const a = cue('g2', .25), b = cue('g3', .5); return [[0, 210, 1385], [a - .1, 210, 1385], [a + .25, -470, 1080, 60], [a + .7, -500, 1385, 30], [b - .6, 200, 1385], [b - .1, 200, 1385], [b + .25, -200, 1150, 80], [b + .7, -230, 1385, 30]]; },
          acts: () => { const a = cue('g2', .25), b = cue('g3', .5), D = CUR.duration; return {
            crespo: [[0, { e: 'focused', m: { lookX: -1 } }], [(a - .15) / D, { po: KICK }], [(a + .3) / D, { e: 'happy', p: 'fistPumpR', po: {}, handR: 'fist' }], [(b - .2) / D, { e: 'focused', p: 'idle', po: KICK }], [(b + .3) / D, { e: 'ecstatic', p: 'cheer', po: {}, m: { jump: .5 } }]],
            dudek: [[0, { e: 'tense', po: KP, m: { lookX: 1 } }], [(a + .05) / D, { e: 'shock', po: DIVE_L, m: { dy: -50 } }], [(a + .7) / D, { e: 'despair', po: KP, m: { dy: 0 } }], [(b + .05) / D, { e: 'shock', po: DIVE_R, m: { dy: -40 } }], [(b + .7) / D, { e: 'despair', p: 'handsOnHead', po: {}, m: { dy: 0 } }]] }; } }),
        standsCut({ at: .74, cast: FANS, bright: .8, acts: { hero: [[0, { e: 'despair' }]], mike: [[0, { e: 'despair', p: 'handsOnHead' }]], jay: [[0, { e: 'despair', p: 'crossed', m: { tremble: .4 } }]] } })] },
    ileave: { set: 'stands', bright: .78,
      cuts: [standsCut({ at: 0, cam: [[0, STANDS], [1, { x: -140, y: 990, z: 1.18 }]], cast: FANS,
        move: { mike: [[0, -270], ['leave', .45, -270], [1, -1300]] },
        acts: { mike: [[0, { e: 'focused', ex: { mouthCurve: -.4 }, m: { no: .6 } }], ['leave', .42, { propR: 'coat', m: { no: 0, lookX: -1 } }], ['leave', .5, { m: { walk: 1, lookX: -1 } }]],
                hero: [[0, { e: 'despair', m: { lookX: -1 } }], ['leave', .45, { e: 'surprised', m: { lookX: -1 } }]], jay: [[0, { e: 'despair', m: { lookX: -1 } }], ['leave', .5, { e: 'worried', m: { lookX: -1 } }]] } })] },
    isinging: { set: 'stands', bright: .9, notesFrom: 'sing',
      cuts: [standsCut({ at: 0, cam: [[0, { x: -140, y: 990, z: 1.18 }], [.4, { x: 20, y: 1005, z: 1.45 }], [1, { x: 20, y: 1000, z: 1.32 }]], cast: FANS2,
        acts: { hero: [[0, { e: 'confident', m: { lookX: 0 } }], ['sing', .5, { e: 'happy', p: 'cheer', propR: 'scarf', m: { sing: 1 } }]], jay: [[0, { e: 'surprised', m: { lookX: -1 } }], ['sing', .55, { e: 'happy', p: 'cheer', propR: 'scarf', m: { sing: 1 } }]] } })] },
    igerrard: { set: 'pitch', tag: "54'", bright: 1,
      cuts: [
        pitchCut({ at: 0, cast: { gerrard: { x: -180, scale: .8 }, dida: { x: -380, scale: .78 } },
          score: lt => lt < cue('goal', .55) ? 'MIL 3 – 0 LIV' : 'MIL 3 – 1 LIV', label: lt => lt >= cue('goal', .55) ? 'GERRARD!' : '',
          ball: () => { const g = cue('goal', .55); return [[0, 900, 1385], [g - 1.2, 700, 1385], [g - .25, -180, 980, 380], [g + .05, -520, 1100, 20], [g + .5, -540, 1385, 20]]; },
          acts: () => { const g = cue('goal', .55), D = CUR.duration; return {
            gerrard: [[0, { e: 'focused', m: { lookX: 1 } }], [(g - .55) / D, { e: 'focused', p: 'cheer', m: { jump: 1, lookX: 1 } }], [(g + .1) / D, { e: 'ecstatic', p: 'cheer', m: { jump: .3, lookX: 0 } }]],
            dida: [[0, { e: 'focused', po: KP, m: { lookX: 1 } }], [(g - .15) / D, { e: 'shock', po: DIVE_L, m: { dy: -50 } }], [(g + .6) / D, { e: 'despair', po: KP, m: { dy: 0 } }]] }; } }),
        standsCut({ at: .74, cast: FANS2, acts: { hero: [[0, { e: 'ecstatic', p: 'fistPumpR', handR: 'fist', m: { jump: .5 } }]], jay: [[0, { e: 'happy', p: 'cheer', propR: 'scarf' }]] } })] },
    ismicer: { set: 'pitch', tag: "56'", bright: 1.02,
      cuts: [
        pitchCut({ at: 0, cast: { smicer: { x: 360, scale: .8 }, dida: { x: -380, scale: .78 } },
          score: lt => lt < cue('goal', .6) ? 'MIL 3 – 1 LIV' : 'MIL 3 – 2 LIV', label: lt => lt >= cue('goal', .6) ? 'ŠMICER!' : '',
          ball: () => { const g = cue('goal', .6); return [[0, 340, 1385], [g - .8, 340, 1385], [g, -580, 1250, 90], [g + .4, -600, 1385, 20]]; },
          acts: () => { const g = cue('goal', .6), D = CUR.duration; return {
            smicer: [[0, { e: 'focused', m: { lookX: -1 } }], [(g - .85) / D, { po: KICK }], [(g + .1) / D, { e: 'ecstatic', p: 'cheer', po: {}, m: { jump: .6 } }]],
            dida: [[0, { e: 'focused', po: KP, m: { lookX: 1 } }], [(g - .35) / D, { e: 'shock', po: DIVE_L, m: { dy: -30 } }], [(g + .6) / D, { e: 'despair', po: KP, m: { dy: 0 } }]] }; } }),
        standsCut({ at: .76, cast: FANS2, acts: { hero: [[0, { e: 'ecstatic', p: 'cheer', m: { jump: 1 } }]], jay: [[0, { e: 'ecstatic', p: 'cheer', propR: 'scarf', m: { jump: .8 } }]] } })] },
    ialonso: { set: 'pitch', tag: "60'", bright: 1.05,
      cuts: [
        pitchCut({ at: 0, cast: { alonso: { x: 260, scale: .8 }, dida: { x: -350, scale: .78 } },
          move: { alonso: [[0, 260], ['saved', .37, 260], ['goal', .55, -60]] },
          score: lt => lt < cue('goal', .55) ? 'MIL 3 – 2 LIV' : 'MIL 3 – 3 LIV',
          label: lt => lt >= cue('goal', .55) ? 'ALONSO! 3–3' : lt >= cue('saved', .37) ? 'SAVED...' : lt >= cue('pen', .1) ? 'PENALTY!' : '',
          ball: () => { const s1 = cue('saved', .37), g = cue('goal', .55); return [[0, 120, 1385], [s1 - .35, 120, 1385], [s1, -470, 1180, 40], [s1 + .6, -130, 1385, 120], [g - .2, -130, 1385], [g + .15, -330, 1080, 60], [g + .6, -360, 1385, 20]]; },
          acts: () => { const s1 = cue('saved', .37), g = cue('goal', .55), D = CUR.duration; return {
            alonso: [[0, { e: 'focused', m: { lookX: -1 } }], [(s1 - .45) / D, { po: KICK }], [(s1 + .1) / D, { e: 'shock', p: 'idle', po: {}, m: { walk: 1 } }], [(g - .3) / D, { e: 'focused', po: KICK, m: { walk: 0 } }], [(g + .2) / D, { e: 'ecstatic', p: 'cheer', po: {}, m: { jump: 1 } }]],
            dida: [[0, { e: 'focused', po: KP, m: { lookX: 1 } }], [(s1 - .25) / D, { e: 'focused', po: DIVE_L, m: { dy: -40 } }], [(s1 + .5) / D, { e: 'shock', po: { lean: -85, lA: 160, rA: 160 }, m: { dy: 0 } }]] }; } }),
        standsCut({ at: .76, cast: FANS2, bright: 1.08, acts: { hero: [[0, { e: 'ecstatic', p: 'cheer', propR: 'scarf', m: { jump: 1 } }]], jay: [[0, { e: 'ecstatic', p: 'cheer', m: { dance: 1 } }]] } })] },
    idudek: { set: 'pitch', tag: 'EXTRA TIME', bright: .85,
      cuts: [
        pitchCut({ at: 0, cast: { shevchenko: { x: 60, scale: .8 }, dudek: { x: -340, scale: .78 } }, score: 'MIL 3 – 3 LIV', label: lt => lt >= cue('save', .7) ? 'DOUBLE SAVE!' : '',
          ball: () => { const s1 = cue('save', .7); return [[0, 500, 900], [s1 - 1.0, -20, 1385, 200], [s1 - .7, -330, 1150, 30], [s1 - .35, -120, 1300, 60], [s1, -330, 1060, 30], [s1 + .6, -420, 600, 120]]; },
          acts: () => { const s1 = cue('save', .7), D = CUR.duration; return {
            shevchenko: [[0, { e: 'focused', m: { lookX: 1 } }], [(s1 - 1.0) / D, { po: KICK, m: { lookX: -1 } }], [(s1 - .45) / D, { e: 'focused', p: 'idle', po: KICK }], [(s1 + .2) / D, { e: 'shock', p: 'handsOnHead', po: {} }]],
            dudek: [[0, { e: 'tense', po: KP, m: { lookX: 1 } }], [(s1 - .8) / D, { e: 'focused', po: DIVE_R, m: { dy: -20 } }], [(s1 - .25) / D, { e: 'shock', po: { lA: 160, rA: 160, lean: 20 }, m: { dy: -60 } }], [(s1 + .6) / D, { e: 'ecstatic', p: 'cheer', po: {}, m: { dy: 0 } }]] }; } }),
        standsCut({ at: .84, cast: FANS2, acts: { hero: [[0, { e: 'shock', p: 'handsOnHead' }]], jay: [[0, { e: 'shock', p: 'handsOnHead' }]] } })] },
    ipens: { set: 'pitch', tag: 'PENALTIES', bright: .8,
      cuts: [
        pitchCut({ at: 0, cast: { dudek: { x: -340, scale: .78 }, shevchenko: { x: 360, scale: .8 } }, score: 'MIL 2 – 3 LIV', label: 'PENALTIES',
          move: { shevchenko: [[0, 360], ['step', .7, 360], [1, 220]] },
          ball: [[0, 100, 1385]],
          acts: { dudek: [[0, { e: 'wink', po: KP, m: { dance: 1, lookX: 1 } }], ['step', .72, { e: 'focused', po: KP, m: { dance: .4, lookX: 1 } }]], shevchenko: [[0, { e: 'neutral', m: { lookX: -1 } }], ['step', .7, { e: 'focused', m: { walk: .7, lookX: -1 } }]] } }),
        standsCut({ at: ['step', .7, .25], cam: [[0, { x: 20, y: 1000, z: 1.45 }], [1, { x: 20, y: 1005, z: 1.6 }]], cast: FANS2, bright: .7,
          acts: { hero: [[0, { e: 'tense', p: 'pleading', m: { tremble: .8 } }]], jay: [[0, { e: 'worried', p: 'nervous', m: { tremble: .8 } }]] } })] },
    isaved: { set: 'pitch', bright: 1.12, flash: false,
      cuts: [
        pitchCut({ at: 0, cast: { dudek: { x: -340, scale: .78 }, shevchenko: { x: 220, scale: .8 } }, score: 'MIL 2 – 3 LIV', label: 'SAVED!',
          ball: [[0, 100, 1385], [.25, 100, 1385], [.6, -470, 1250, 40], [1.1, -250, 1385, 120]],
          acts: { shevchenko: [[0, { e: 'focused', po: KICK, m: { lookX: -1 } }], [.12, { e: 'despair', p: 'handsOnHead', po: {} }]], dudek: [[0, { e: 'focused', po: DIVE_L, m: { dy: -40 } }], [.3, { e: 'ecstatic', p: 'cheer', po: {}, m: { dy: 0, jump: 1 } }]] } }),
        standsCut({ at: .26, cast: FANS2, conf: 1, shake: 1, flash: true, acts: { hero: [[0, { e: 'ecstatic', p: 'cheer', propR: 'scarf', m: { jump: 1 } }]], jay: [[0, { e: 'ecstatic', p: 'cheer', m: { dance: 1 } }]] } })] }
  });


  // ---------- Barça 2014/15 story ----------
  const BARCA = { shirt: '#a50044', stripes: '#004d98', trim: '#ffd400', pants: '#004d98', shoes: '#111' };
  Object.assign(CH, {
    messi:   Object.assign({}, BARCA, { skin: '#f0c19a', number: '10', hair: 'short', hairColor: '#4a2f1c', stubble: true, bw: .95, blinkPh: .3 }),
    suarez:  Object.assign({}, BARCA, { skin: '#e8b08a', number: '9', hair: 'slick', hairColor: '#1d1410', stubble: true, bw: 1, blinkPh: 1.4 }),
    neymar:  Object.assign({}, BARCA, { skin: '#c98d63', number: '11', hair: 'spiky', hairColor: '#c9a46a', bw: .92, blinkPh: 2.3 }),
    rakitic: Object.assign({}, BARCA, { skin: '#ffd9b8', number: '4', hair: 'slick', hairColor: '#c9a46a', bw: 1, blinkPh: .8 }),
    terstegen: { skin: '#ffd9b8', shirt: '#ffcc00', trim: '#111', number: '1', pants: '#111', shoes: '#111', hair: 'short', hairColor: '#c9a46a', bw: 1.05, blinkPh: 1.9 },
    boateng: { skin: '#6b4430', shirt: '#dc052d', trim: '#fff', number: '17', pants: '#dc052d', shoes: '#111', hair: 'buzz', hairColor: '#120a05', bw: 1.1, blinkPh: .5 },
    neuer:   { skin: '#ffd9b8', shirt: '#2fbf71', trim: '#111', number: '1', pants: '#1f2236', shoes: '#111', hair: 'short', hairColor: '#c9a46a', bw: 1.1, blinkPh: 2.7 },
    athletic1: { skin: '#f0c19a', shirt: '#ee2523', stripes: '#ffffff', trim: '#111', pants: '#111', shoes: '#111', hair: 'short', hairColor: '#2a1a10', bw: 1, blinkPh: .1 },
    athletic2: { skin: '#e8b08a', shirt: '#ee2523', stripes: '#ffffff', trim: '#111', pants: '#111', shoes: '#111', hair: 'spiky', hairColor: '#1d1410', bw: 1, blinkPh: 1.1 },
    athletic3: { skin: '#ffd9b8', shirt: '#ee2523', stripes: '#ffffff', trim: '#111', pants: '#111', shoes: '#111', hair: 'buzz', hairColor: '#3a2414', bw: 1.05, blinkPh: 2.1 },
    morata:  { skin: '#f0c19a', shirt: '#ffffff', stripes: '#111111', trim: '#e0b84a', number: '9', pants: '#ffffff', shoes: '#111', hair: 'short', hairColor: '#2a1a10', bw: 1, blinkPh: .6 },
    buffon:  { skin: '#f0c19a', shirt: '#5b6070', trim: '#ffd400', number: '1', pants: '#5b6070', shoes: '#111', hair: 'short', hairColor: '#2a1a10', stubble: true, bw: 1.1, blinkPh: 1.6 },
    sociedad: { skin: '#f0c19a', shirt: '#0067b1', stripes: '#ffffff', trim: '#fff', pants: '#ffffff', shoes: '#111', hair: 'spiky', hairColor: '#2a1a10', bw: 1, blinkPh: 1.2 }
  });
  function drawDugout() {
    ctx.lineWidth = 7; ctx.strokeStyle = OUT;
    ctx.beginPath(); ctx.roundRect(60, 1020, 720, 400, [60, 60, 0, 0]); ctx.fillStyle = 'rgba(200,225,255,.28)'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(60, 1240, 720, 180, 0); ctx.fillStyle = '#20284e'; ctx.fill(); ctx.stroke();
    txt('BENCH', 420, 1330, 54, '#ffffff', 900);
  }
  function trophy(x, y, sc, t, label) {
    ctx.save(); ctx.translate(x, y + Math.sin(t * 3 + x) * 8); ctx.scale(sc, sc);
    ctx.lineWidth = 7; ctx.strokeStyle = OUT; ctx.fillStyle = '#ffcc33';
    ctx.beginPath(); ctx.moveTo(-60, -120); ctx.lineTo(60, -120); ctx.quadraticCurveTo(60, -20, 14, 0); ctx.lineTo(14, 40); ctx.lineTo(-14, 40); ctx.lineTo(-14, 0); ctx.quadraticCurveTo(-60, -20, -60, -120); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(-70, -80, 26, Math.PI * .5, Math.PI * 1.5); ctx.stroke(); ctx.beginPath(); ctx.arc(70, -80, 26, -Math.PI * .5, Math.PI * .5); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(-46, 40, 92, 30, 6); ctx.fillStyle = '#7a4a1a'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-24, -90, 10, 24, .3, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill();
    txt(label, 0, 110, 34, '#fff', 900, 'center', 8);
    ctx.restore();
  }
  const MSN = { messi: { x: -60, scale: .8 }, suarez: { x: -300, scale: .8 }, neymar: { x: 180, scale: .8 } };
  const BFANS = { mike: { x: -270 }, hero: { x: 0 }, jay: { x: 270 } }, BFANS2 = { hero: { x: -120 }, jay: { x: 170 } };
  const BROOM = { mike: { x: -270 }, hero: { x: 0 }, jay: { x: 270 } };
  const MIKE_GREEN = { shirt: '#2fae5a', stripes: null, trim: '#d9ffe8', number: null };
  const BROOM_AFTER = { mike: Object.assign({ x: -270 }, MIKE_GREEN), hero: { x: 0 }, jay: { x: 270 } };
  const kickAt = (who, ft, D) => [[0, { e: 'focused', m: { lookX: -1 } }], [(ft - .15) / D, { po: KICK }], [(ft + .3) / D, { e: 'ecstatic', p: 'cheer', po: {}, m: { jump: .6 } }]];
  const keeperDive = (ft, D, dir = DIVE_L) => [[0, { e: 'focused', po: KP, m: { lookX: 1 } }], [(ft + .05) / D, { e: 'shock', po: dir, m: { dy: -40 } }], [(ft + .7) / D, { e: 'despair', po: KP, m: { dy: 0 } }]];
  const shotBall = (ft, fromX, toX, toY) => [[0, fromX, 1385], [ft - .05, fromX, 1385], [ft + .35, toX, toY, 70], [ft + .8, toX - 20, 1385, 20]];
  Object.assign(SHOTS, {
    bhook: { set: 'stands', noCaption: true, title: ['WHAT IF YOU GAVE UP', 'ON <span class="gold">BARÇA</span>?'], titleSize: [84, 130],
      cuts: [standsCut({ at: 0, cam: [[0, { x: 0, y: 1000, z: 1.1 }], [1, { x: 0, y: 995, z: 1.2 }]], cast: BFANS,
        acts: { hero: [[0, { e: 'confident', p: 'crossed' }]], mike: [[0, { e: 'despair', p: 'handsOnHead' }]], jay: [[0, { e: 'worried', p: 'nervous' }]] } })] },
    bsociedad: { set: 'pitch', tag: '4 JANUARY 2015', bright: .9,
      cuts: [
        pitchCut({ at: 0, cast: { sociedad: { x: 330, scale: .8 }, terstegen: { x: -340, scale: .78 } }, score: lt => lt < cue('goal', .2) ? 'RSO 0 – 0 FCB' : 'RSO 1 – 0 FCB',
          ball: () => shotBall(cue('goal', .2) - .35, 210, -430, 1150), acts: () => ({ sociedad: kickAt('sociedad', cue('goal', .2) - .35, CUR.duration), terstegen: keeperDive(cue('goal', .2) - .35, CUR.duration) }) }),
        pitchCut({ at: ['bench', .5], cam: [[0, { x: 420, y: 960, z: 1.15 }], [1, { x: 420, y: 960, z: 1.22 }]], cast: { messi: { x: 280, scale: .85 }, neymar: { x: 560, scale: .85 } }, score: 'RSO 1 – 0 FCB', label: 'MESSI & NEYMAR ON THE BENCH',
          acts: { messi: [[0, { e: 'focused', ex: { mouthCurve: -.4 }, p: 'crossed', m: { lookX: -1 } }]], neymar: [[0, { e: 'worried', p: 'crossed', m: { lookX: -1 } }]] }, front: 'dugout' })] },
    bcrisis: { set: 'room', cast: BROOM, bright: .85, tag: '5 JANUARY 2015',
      card: textCard([['BREAKING NEWS', 40, '#ff5a4f', null, .02], ['MESSI MISSES TRAINING', 54, '#fff', null, .15], ['WANTS TO LEAVE?', 64, '#ffd400', null, .4], ['SPORTING DIRECTOR SACKED', 44, '#fff', null, .62]], ['#2a0d5c', '#0d0524']),
      cam: [[0, TV], [.78, TV], [.88, { x: 0, y: 985, z: 1.25 }], [1, { x: 0, y: 995, z: 1.32 }]],
      acts: { hero: [[0, { e: 'surprised', m: { lookX: -1 } }], [.88, { e: 'focused', p: 'crossed', m: { lookX: -1 } }]], mike: [[0, { e: 'worried', m: { lookX: -1 } }], [.88, { e: 'despair', p: 'handsOnHead', m: { lookX: -1 } }]], jay: [[0, { e: 'worried', m: { lookX: -1 } }], [.88, { e: 'shock', m: { lookX: -1 } }]] } },
    bsell: { set: 'room', cast: BROOM, bright: .9, card: 'off', looks: { mike: [['sell', .45, MIKE_GREEN]] },
      cam: [[0, { x: -150, y: 990, z: 1.35 }], [1, { x: -150, y: 995, z: 1.45 }]],
      acts: { mike: [[0, { e: 'angry', ex: { anger: 0, teeth: 0, mouthOpen: .05 }, m: { lookX: 0 } }], ['sell', .45, { e: 'angry', p: 'holdCashUp', propR: 'shirt10', m: { lookX: 0 } }]], hero: [[0, { e: 'neutral', m: { lookX: -1 } }], ['sell', .5, { e: 'shock', p: 'handsOnHead', m: { lookX: -1 } }]], jay: [[0, { e: 'neutral', m: { lookX: -1 } }]] } },
    bkeep: { set: 'room', cast: BROOM_AFTER, bright: .95, card: textCard([['THE SECRET WEAPON', 46, '#ffd400', 'weapon', .5], ['M · S · N', 120, '#fff', 'three', .78]], ['#2a0d5c', '#0d0524']),
      cam: [[0, { x: 0, y: 1040, z: 1.6 }], [.4, { x: 0, y: 1040, z: 1.6 }], [.5, TV], [1, TV]],
      acts: { hero: [[0, { e: 'confident', p: 'thumbsUpR', handR: 'thumb', m: { lookX: 0 } }], [.35, { e: 'wink' }]], mike: [[0, { e: 'smirk', p: 'crossed' }]], jay: [[0, { e: 'neutral' }]] } },
    bmsn: { set: 'pitch', tag: '2014/15', bright: 1.05,
      cuts: [pitchCut({ at: 0, cam: [[0, { x: -60, y: 900, z: 1.15 }], [1, { x: -60, y: 905, z: 1.2 }]], cast: MSN, score: '', label: '',
        acts: { messi: [[0, { e: 'confident', p: 'crossed' }]], suarez: [[0, { e: 'smirk', p: 'hips' }], ['bite', .5, { e: 'happy', ex: { teeth: 1, mouthOpen: .5, mouthCurve: .9 } }]], neymar: [[0, { e: 'wink', p: 'thumbsUpR', handR: 'thumb' }]] },
        extra: lt => { const k = eb(P(lt, cue('bite', .5), cue('bite', .5) + .4)); if (k > 0) { ctx.save(); ctx.translate(-300, 760); ctx.scale(k, k); ctx.beginPath(); ctx.roundRect(-200, -40, 400, 80, 40); ctx.fillStyle = '#ef3b5c'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.stroke(); txt('4-MONTH BAN (2014)', 0, 3, 34, '#fff'); ctx.restore(); } } })] },
    bbayern: { set: 'pitch', tag: 'SEMI-FINAL · BAYERN', bright: 1,
      cuts: [
        pitchCut({ at: 0, cast: { boateng: { x: 90, scale: .82 }, messi: { x: 300, scale: .8 }, neuer: { x: -340, scale: .8 } },
          move: { messi: [[0, 300], ['skip', .4, 60], ['chip', .62, -120]] },
          score: lt => lt < cue('chip', .62) + .4 ? 'FCB 1 – 0 BAY' : 'FCB 2 – 0 BAY', label: lt => lt >= cue('chip', .62) + .4 ? 'MESSI!' : '',
          ball: () => { const sk = cue('skip', .4), ch = cue('chip', .62); return [[0, 240, 1385], [sk, 90, 1385], [ch - .1, -170, 1385], [ch + .45, -430, 1040, 330], [ch + .9, -450, 1385, 20]]; },
          acts: () => { const sk = cue('skip', .4), ch = cue('chip', .62), D = CUR.duration; return {
            messi: [[0, { e: 'focused', m: { walk: .8, lookX: -1 } }], [(ch - .15) / D, { po: KICK, m: { walk: 0 } }], [(ch + .5) / D, { e: 'ecstatic', p: 'cheer', po: {}, m: { jump: .5 } }]],
            boateng: [[0, { e: 'focused', po: KP, m: { lookX: 1 } }], [(sk - .1) / D, { e: 'shock', p: 'faint', po: { lean: 72 }, m: { lookX: 1 } }]],
            neuer: [[0, { e: 'focused', po: KP, m: { lookX: 1 } }], [(ch + .05) / D, { e: 'shock', po: { lA: 170, rA: 170, lE: 0, rE: 0 }, m: { dy: -50 } }], [(ch + .7) / D, { e: 'despair', p: 'handsOnHead', po: {}, m: { dy: 0 } }]] }; } })] },
    bdouble: { set: 'pitch', tag: 'MAY 2015', bright: 1.05,
      cuts: [
        pitchCut({ at: 0, cast: MSN, score: 'LA LIGA', label: 'CHAMPIONS!', acts: { messi: [[0, { e: 'ecstatic', p: 'cheer', m: { jump: .6 } }]], suarez: [[0, { e: 'happy', p: 'cheer', m: { dance: .7 } }]], neymar: [[0, { e: 'ecstatic', p: 'fistPumpR', handR: 'fist', m: { jump: .4 } }]] },
          extra: (lt, t) => trophy(230, 560, .95, t, 'LA LIGA') }),
        pitchCut({ at: ['cup', .4], cast: { athletic1: { x: 300, scale: .8 }, athletic2: { x: 80, scale: .8 }, athletic3: { x: -150, scale: .8 }, messi: { x: 520, scale: .8 } },
          move: { messi: [['cup', .4, 520], ['cupgoal', .85, -150]] }, score: lt => lt < cue('cupgoal', .85) ? 'FCB 0 – 0 ATH' : 'FCB 1 – 0 ATH', label: 'COPA DEL REY FINAL',
          ball: () => { const g = cue('cupgoal', .85), st = cue('cup', .4); return [[st, 460, 1385], [g - .1, -140, 1385], [g + .3, -470, 1200, 40], [g + .7, -490, 1385, 20]]; },
          acts: () => { const D = CUR.duration, st = cue('cup', .4), g = cue('cupgoal', .85), pass = k => st + (g - st) * k; return {
            messi: [[0, { e: 'focused', m: { walk: 1, lookX: -1 } }], [(g - .15) / D, { po: KICK, m: { walk: 0 } }], [(g + .3) / D, { e: 'ecstatic', p: 'cheer', po: {}, m: { jump: .5 } }]],
            athletic1: [[0, { e: 'focused', po: KP }], [pass(.2) / D, { e: 'shock', p: 'faint', po: {} }]],
            athletic2: [[0, { e: 'focused', po: KP }], [pass(.45) / D, { e: 'shock', p: 'faint', po: { lean: 72 } }]],
            athletic3: [[0, { e: 'focused', po: KP }], [pass(.7) / D, { e: 'shock', p: 'faint', po: {} }]] }; } })] },
    bberlin: { set: 'stands', tag: '6 JUNE 2015 · BERLIN', bright: .85,
      cuts: [standsCut({ at: 0, cast: BFANS2, cam: [[0, { x: 20, y: 1000, z: 1.4 }], [1, { x: 20, y: 1005, z: 1.55 }]], acts: { hero: [[0, { e: 'tense', p: 'pleading', m: { tremble: .5 } }]], jay: [[0, { e: 'nervous', p: 'nervous', m: { tremble: .5 } }]] } })] },
    bfinal: { set: 'pitch', tag: 'CHAMPIONS LEAGUE FINAL', bright: 1,
      cuts: [
        pitchCut({ at: 0, cast: { rakitic: { x: 300, scale: .8 }, buffon: { x: -340, scale: .8 } }, score: lt => lt < cue('rak', .08) + .35 ? 'JUV 0 – 0 FCB' : 'JUV 0 – 1 FCB', label: lt => lt >= cue('rak', .08) + .35 ? 'RAKITIĆ' : '',
          ball: () => shotBall(cue('rak', .08), 180, -440, 1130), acts: () => ({ rakitic: kickAt('rakitic', cue('rak', .08), CUR.duration), buffon: keeperDive(cue('rak', .08), CUR.duration) }) }),
        pitchCut({ at: ['mor', .3, -.4], cast: { morata: { x: 300, scale: .8 }, terstegen: { x: -340, scale: .78 } }, score: lt => lt < cue('mor', .3) + .35 ? 'JUV 0 – 1 FCB' : 'JUV 1 – 1 FCB', label: lt => lt >= cue('mor', .3) + .35 ? 'MORATA' : '',
          ball: () => shotBall(cue('mor', .3), 180, -250, 1200), acts: () => ({ morata: kickAt('morata', cue('mor', .3), CUR.duration), terstegen: keeperDive(cue('mor', .3), CUR.duration, DIVE_R) }) }),
        pitchCut({ at: ['sua', .55, -.4], cast: { suarez: { x: 280, scale: .8 }, buffon: { x: -340, scale: .8 } }, score: lt => lt < cue('sua', .55) + .35 ? 'JUV 1 – 1 FCB' : 'JUV 1 – 2 FCB', label: lt => lt >= cue('sua', .55) + .35 ? 'SUÁREZ' : '',
          ball: () => shotBall(cue('sua', .55), 160, -480, 1250), acts: () => ({ suarez: kickAt('suarez', cue('sua', .55), CUR.duration), buffon: keeperDive(cue('sua', .55), CUR.duration) }) }),
        pitchCut({ at: ['ney', .78, -.4], cast: { neymar: { x: 280, scale: .8 }, buffon: { x: -340, scale: .8 } }, score: lt => lt < cue('ney', .78) + .35 ? 'JUV 1 – 2 FCB' : 'JUV 1 – 3 FCB', label: lt => lt >= cue('ney', .78) + .35 ? "NEYMAR 90+7'" : '',
          ball: () => shotBall(cue('ney', .78), 160, -200, 1100), acts: () => ({ neymar: kickAt('neymar', cue('ney', .78), CUR.duration), buffon: keeperDive(cue('ney', .78), CUR.duration, DIVE_R) }) })] },
    btreble: { set: 'stands', bright: 1.12,
      cuts: [standsCut({ at: 0, cast: BFANS2, conf: 1, shake: 1, flash: true, cam: [[0, { x: 20, y: 985, z: 1.25 }], [1, { x: 20, y: 985, z: 1.15 }]],
        acts: { hero: [[0, { e: 'ecstatic', p: 'cheer', m: { jump: 1 } }]], jay: [[0, { e: 'ecstatic', p: 'cheer', m: { dance: 1 } }]] },
        extraTop: (lt, t) => { ['LIGA', 'COPA', 'UCL'].forEach((l, i) => { const k = eb(P(lt, .3 + i * .25, .7 + i * .25)); if (k > 0) trophy(-280 + i * 300, 770, .6 * k, t, l); }); } })] },
    bgoals: { set: 'pitch', bright: 1.05,
      cuts: [pitchCut({ at: 0, cam: [[0, { x: -60, y: 900, z: 1.15 }], [1, { x: -60, y: 905, z: 1.2 }]], cast: MSN, score: '', label: '',
        acts: { messi: [[0, { e: 'happy', p: 'cheer' }]], suarez: [[0, { e: 'happy', p: 'fistPumpR', handR: 'fist' }]], neymar: [[0, { e: 'ecstatic', p: 'cheer', m: { dance: .6 } }]] },
        extra: lt => { const v = Math.round(lerp(0, 122, eo(P(lt, .3, cue('num', .7))))); txt(String(v), -60, 660, 220, '#ffd400', 900, 'center', 18); txt('GOALS', -60, 800, 70, '#fff', 900, 'center', 12); } })] },
    bmate: { set: 'room', cast: { mike: Object.assign({ x: -200 }, MIKE_GREEN), jay: { x: 150 } }, bright: 1, card: 'off',
      title: ['FOLLOW FOR MORE', '<span class="gold">WHAT IFs</span>'], titleSize: [84, 110], titleAt: 'follow',
      cam: [[0, { x: -30, y: 990, z: 1.3 }], [1, { x: -30, y: 995, z: 1.38 }]],
      acts: { mike: [[0, { e: 'pleading', p: 'takeR', propR: 'shirt100', m: { lookX: 1 } }], ['follow', .75, { e: 'despair', p: 'handsOnHead', propR: null }]], jay: [[0, { e: 'smirk', p: 'crossed', m: { lookX: -1, no: .8 } }]] } }
  });


  // ---------- Remontada 2017 story ----------
  const PSG = { shirt: '#0b2a5b', band: '#da291c', trim: '#ffffff', pants: '#0b2a5b', shoes: '#111' };
  Object.assign(CH, {
    cavani:  Object.assign({}, PSG, { skin: '#f0c19a', number: '9', hair: 'slick', hairColor: '#1d1410', stubble: true, bw: 1, blinkPh: .7 }),
    psgA:    Object.assign({}, PSG, { skin: '#f0c19a', number: '11', hair: 'short', hairColor: '#2a1a10', bw: .95, blinkPh: 1.3 }),
    kurzawa: Object.assign({}, PSG, { skin: '#8a5a3c', number: '20', hair: 'buzz', hairColor: '#120a05', bw: 1, blinkPh: 2.1 }),
    wallA:   Object.assign({}, PSG, { skin: '#e8b08a', hair: 'short', hairColor: '#2a1a10', bw: 1.05, blinkPh: .4 }),
    wallB:   Object.assign({}, PSG, { skin: '#6b4430', hair: 'buzz', hairColor: '#120a05', bw: 1.1, blinkPh: 1.8 }),
    trapp:   { skin: '#ffd9b8', shirt: '#ff8c1a', trim: '#111', number: '1', pants: '#111', shoes: '#111', hair: 'short', hairColor: '#c9a46a', bw: 1.05, blinkPh: 2.4 },
    sergi:   Object.assign({}, BARCA, { skin: '#f0c19a', number: '20', hair: 'short', hairColor: '#2a1a10', bw: .95, blinkPh: .9 })
  });
  const RF = { mike: { x: -270 }, hero: { x: 0 }, jay: { x: 270 } }, RF2 = { hero: { x: -120 }, jay: { x: 170 } };
  const goalCut = (at, scorer, keeper, kickF, score0, score1, label, toX = -440, toY = 1130, dive = DIVE_L, sx = 300) => pitchCut({ at,
    cast: { [scorer]: { x: sx, scale: .8 }, [keeper]: { x: -340, scale: .78 } },
    score: lt => lt < kickF() + .35 ? score0 : score1, label: lt => lt >= kickF() + .35 ? label : '',
    ball: () => shotBall(kickF(), sx - 120, toX, toY),
    acts: () => ({ [scorer]: kickAt(scorer, kickF(), CUR.duration), [keeper]: keeperDive(kickF(), CUR.duration, dive) }) });
  Object.assign(SHOTS, {
    rhook: { set: 'stands', noCaption: true, title: ['<span class="gold">LA REMONTADA</span>', 'WHAT IF YOU LEFT', 'AT <span class="gold">3–1</span>?'], titleSize: [104, 84, 140],
      cuts: [standsCut({ at: 0, cam: [[0, { x: 0, y: 1000, z: 1.1 }], [1, { x: 0, y: 995, z: 1.2 }]], cast: RF,
        acts: { hero: [[0, { e: 'confident', p: 'cheer', propR: 'scarf' }]], mike: [[0, { e: 'angry', p: 'crossed' }]], jay: [[0, { e: 'nervous', p: 'nervous' }]] } })] },
    rparis: { set: 'pitch', tag: '14 FEB 2017 · PARIS', bright: .85,
      cuts: [
        pitchCut({ at: 0, cast: { psgA: { x: 300, scale: .8 }, terstegen: { x: -340, scale: .78 } },
          score: lt => { const n = Math.min(4, Math.floor(P(lt, .6, CUR.duration * .62) * 4.999)); return `PSG ${n} – 0 FCB`; }, label: lt => lt > CUR.duration * .62 ? 'FIRST LEG' : '',
          ball: () => shotBall(.6, 180, -430, 1140), acts: () => ({ psgA: kickAt('psgA', .6, CUR.duration), terstegen: keeperDive(.6, CUR.duration) }) }),
        standsCut({ at: .72, cast: RF, bright: .75, acts: { hero: [[0, { e: 'worried' }]], mike: [[0, { e: 'despair', p: 'handsOnHead' }]], jay: [[0, { e: 'despair', p: 'crossed' }]] } })] },
    rnobody: { set: 'room', cast: BROOM, bright: .85, card: textCard([['TEAMS THAT CAME BACK', 44, '#fff', null, .05], ['FROM 4–0 IN THE UCL', 44, '#fff', null, .12], ['0', 170, '#ffd400', null, .35]], ['#0b2a5b', '#06132e']),
      cam: [[0, TV], [.62, TV], [.72, { x: 0, y: 985, z: 1.25 }], [1, { x: 0, y: 995, z: 1.32 }]],
      acts: { hero: [[0, { e: 'neutral', m: { lookX: -1 } }], [.72, { e: 'confident', p: 'crossed', m: { lookX: 0 } }]], mike: [[0, { e: 'smirk', m: { lookX: -1 } }], [.72, { e: 'focused', ex: { mouthCurve: -.4 }, p: 'crossed', m: { lookX: 1, no: .7 } }]], jay: [[0, { e: 'worried', m: { lookX: -1 } }]] } },
    rthree: { set: 'pitch', tag: '8 MARCH 2017 · CAMP NOU', bright: 1,
      cuts: [
        pitchCut({ at: 0, cast: { suarez: { x: -180, scale: .8 }, trapp: { x: -380, scale: .78 } }, score: lt => lt < cue('s1', .12) + .3 ? 'FCB 0 – 0 PSG' : 'FCB 1 – 0 PSG', label: lt => lt >= cue('s1', .12) + .3 ? "SUÁREZ 3'" : '',
          ball: () => { const g = cue('s1', .12); return [[0, 700, 1385], [g - .6, 600, 1385], [g - .05, -180, 980, 330], [g + .3, -520, 1100, 20], [g + .7, -540, 1385, 20]]; },
          acts: () => { const g = cue('s1', .12), D = CUR.duration; return { suarez: [[0, { e: 'focused', m: { lookX: 1 } }], [(g - .35) / D, { p: 'cheer', m: { jump: 1 } }], [(g + .2) / D, { e: 'ecstatic', p: 'cheer', m: { jump: .3 } }]], trapp: keeperDive(g - .1, D) }; } }),
        pitchCut({ at: ['og', .45, -.6], cast: { kurzawa: { x: -150, scale: .8 }, trapp: { x: -380, scale: .78 } }, score: lt => lt < cue('og', .45) + .2 ? 'FCB 1 – 0 PSG' : 'FCB 2 – 0 PSG', label: lt => lt >= cue('og', .45) + .2 ? 'OWN GOAL!' : '',
          ball: () => { const g = cue('og', .45); return [[0, 400, 1385], [g - .2, -90, 1385], [g + .2, -470, 1250, 30], [g + .6, -490, 1385, 10]]; },
          acts: () => { const g = cue('og', .45), D = CUR.duration; return { kurzawa: [[0, { e: 'focused', po: KP, m: { lookX: 1 } }], [(g - .2) / D, { e: 'shock', po: KICK }], [(g + .3) / D, { e: 'despair', p: 'handsOnHead', po: {} }]], trapp: [[0, { e: 'focused', po: KP }], [(g + .25) / D, { e: 'angry', p: 'handsOnHead', po: {} }]] }; } }),
        goalCut(['pen', .75, -.6], 'messi', 'trapp', () => cue('pen', .75), 'FCB 2 – 0 PSG', 'FCB 3 – 0 PSG', 'MESSI (PEN)', -480, 1200, DIVE_R, 260)] },
    rcavani: { set: 'pitch', bright: .85,
      cuts: [
        goalCut(0, 'cavani', 'terstegen', () => cue('goal', .15), 'FCB 3 – 0 PSG', 'FCB 3 – 1 PSG', 'CAVANI', -300, 1180, DIVE_R),
        pitchCut({ at: ['need', .45], cam: [[0, { x: -60, y: 820, z: 1.0 }], [1, { x: -60, y: 820, z: 1.0 }]], cast: {}, score: 'FCB 3 – 1 PSG', label: 'AGG 3–5',
          extra: lt => { const k = eb(P(lt, cue('need', .45), cue('need', .45) + .4)); if (k > 0) { ctx.save(); ctx.translate(-60, 1050); ctx.scale(k, k); txt('NEED 3 MORE', 0, 0, 110, '#ffd400', 900, 'center', 16); txt('IN 30 MINUTES', 0, 120, 70, '#fff', 900, 'center', 12); ctx.restore(); } } })] },
    rleave: { set: 'stands', bright: .72,
      cuts: [standsCut({ at: 0, cam: [[0, STANDS], [1, { x: -140, y: 990, z: 1.18 }]], cast: RF,
        move: { mike: [[0, -270], ['leave', .5, -270], [1, -1300]] },
        acts: { mike: [[0, { e: 'angry', m: { no: .6 } }], ['leave', .45, { propR: 'scarf', m: { no: 0, lookX: -1 } }], ['leave', .55, { m: { walk: 1, lookX: -1 } }]],
                hero: [[0, { e: 'despair', m: { lookX: -1 } }], ['leave', .5, { e: 'surprised', m: { lookX: -1 } }]], jay: [[0, { e: 'despair', m: { lookX: -1 } }]] } })] },
    rstay: { set: 'stands', bright: .8, minDur: 2.6,
      cuts: [standsCut({ at: 0, cast: RF2, cam: [[0, { x: -120, y: 1030, z: 1.6 }], [1, { x: -120, y: 1030, z: 1.7 }]], acts: { hero: [[0, { e: 'focused', p: 'crossed' }], [.4, { e: 'confident', p: 'crossed' }]], jay: [[0, { e: 'worried' }]] } })] },
    rfk: { set: 'pitch', tag: "88'", bright: .95,
      cuts: [
        pitchCut({ at: 0, cast: { wallA: { x: -40, scale: .8 }, wallB: { x: 80, scale: .8 }, neymar: { x: 420, scale: .8 }, trapp: { x: -380, scale: .78 } },
          score: lt => lt < cue('goal', .6) ? 'FCB 3 – 1 PSG' : 'FCB 4 – 1 PSG', label: lt => lt >= cue('goal', .6) ? 'NEYMAR FREE KICK!' : '',
          ball: () => { const g = cue('goal', .6); return [[0, 300, 1385], [g - .6, 300, 1385], [g, -560, 1020, 420], [g + .4, -580, 1385, 20]]; },
          acts: () => { const g = cue('goal', .6), D = CUR.duration; return {
            neymar: [[0, { e: 'focused', m: { lookX: -1 } }], [(g - .7) / D, { po: KICK }], [(g + .1) / D, { e: 'ecstatic', p: 'cheer', po: {}, m: { jump: .6 } }]],
            wallA: [[0, { e: 'tense', p: 'nervous', m: { lookX: 1 } }], [(g - .4) / D, { e: 'tense', p: 'nervous', m: { jump: .8 } }], [(g + .2) / D, { e: 'despair', p: 'handsOnHead', m: { jump: 0 } }]],
            wallB: [[0, { e: 'tense', p: 'nervous', m: { lookX: 1 } }], [(g - .4) / D, { e: 'tense', p: 'nervous', m: { jump: .8 } }], [(g + .2) / D, { e: 'despair', p: 'handsOnHead', m: { jump: 0 } }]],
            trapp: keeperDive(g - .3, D) }; } }),
        standsCut({ at: .8, cast: RF2, acts: { hero: [[0, { e: 'ecstatic', p: 'fistPumpR', handR: 'fist', m: { jump: .5 } }]], jay: [[0, { e: 'surprised', p: 'cheer' }]] } })] },
    rpen: { set: 'pitch', tag: "90+1'", bright: 1,
      cuts: [
        goalCut(0, 'neymar', 'trapp', () => cue('goal', .55), 'FCB 4 – 1 PSG', 'FCB 5 – 1 PSG', 'NEYMAR (PEN)', -180, 1220, DIVE_L, 260),
        standsCut({ at: .8, cast: RF2, acts: { hero: [[0, { e: 'ecstatic', p: 'cheer', propR: 'scarf', m: { jump: 1 } }]], jay: [[0, { e: 'ecstatic', p: 'cheer', m: { jump: .8 } }]] } })] },
    rchip: { set: 'pitch', tag: "90+5'", bright: .8,
      cuts: [
        pitchCut({ at: 0, cast: { neymar: { x: 420, scale: .8 }, sergi: { x: -150, scale: .8 }, trapp: { x: -380, scale: .78 } }, score: 'FCB 5 – 1 PSG', label: 'LAST CHANCE',
          ball: () => { const c = cue('chip', .55); return [[0, 330, 1385], [c, 330, 1385], [CUR.duration, -120, 1100, 360]]; },
          acts: () => { const c = cue('chip', .55), D = CUR.duration; return { neymar: [[0, { e: 'focused', m: { lookX: -1 } }], [(c - .1) / D, { po: KICK }], [(c + .4) / D, { e: 'tense', p: 'pleading', po: {} }]], sergi: [[0, { e: 'focused', m: { lookX: 1, walk: .6 } }], [(c + .2) / D, { e: 'focused', p: 'cheer', m: { lookX: 1, walk: 0 } }]], trapp: [[0, { e: 'tense', po: KP, m: { lookX: 1 } }]] }; } }),
        standsCut({ at: ['chip', .55, .4], cast: RF2, bright: .7, cam: [[0, { x: 20, y: 1000, z: 1.45 }], [1, { x: 20, y: 1005, z: 1.6 }]], acts: { hero: [[0, { e: 'tense', p: 'pleading', m: { tremble: .8 } }]], jay: [[0, { e: 'worried', p: 'nervous', m: { tremble: .8 } }]] } })] },
    rgoal: { set: 'pitch', bright: 1.12,
      cuts: [
        pitchCut({ at: 0, cast: { sergi: { x: -150, scale: .8 }, trapp: { x: -380, scale: .78 } }, score: lt => lt < .35 ? 'FCB 5 – 1 PSG' : 'FCB 6 – 1 PSG', label: lt => lt >= .35 ? 'SERGI ROBERTO!' : '',
          ball: [[0, -120, 1100], [.35, -470, 1180, 20], [.8, -490, 1385, 10]],
          acts: { sergi: [[0, { e: 'focused', po: KICK, m: { dy: -40 } }], [.08, { e: 'ecstatic', p: 'cheer', po: {}, m: { jump: 1, dy: 0 } }]], trapp: [[0, { e: 'shock', po: DIVE_R, m: { dy: -30 } }], [.15, { e: 'despair', po: { lean: 85, lA: 160, rA: 160 }, m: { dy: 0 } }]] } }),
        standsCut({ at: .3, cast: RF2, conf: 1, shake: 1, flash: true, acts: { hero: [[0, { e: 'ecstatic', p: 'cheer', propR: 'scarf', m: { jump: 1 } }]], jay: [[0, { e: 'ecstatic', p: 'cheer', m: { dance: 1 } }]] } })] },
    rgreat: { set: 'pitch', bright: 1.08,
      cuts: [pitchCut({ at: 0, cam: [[0, { x: -60, y: 900, z: 1.15 }], [1, { x: -60, y: 905, z: 1.2 }]], cast: { suarez: { x: -330, scale: .8 }, messi: { x: -120, scale: .8 }, neymar: { x: 90, scale: .8 }, sergi: { x: 300, scale: .8 } }, score: '', label: '',
        acts: { messi: [[0, { e: 'ecstatic', p: 'cheer', m: { jump: .5 } }]], suarez: [[0, { e: 'ecstatic', p: 'cheer', m: { dance: .7 } }]], neymar: [[0, { e: 'ecstatic', p: 'cheer', m: { jump: .4 } }]], sergi: [[0, { e: 'ecstatic', p: 'cheer', m: { jump: .8 } }]] },
        extra: (lt, t) => { const k = eb(P(lt, .2, .6)); ctx.save(); ctx.translate(-60, 640); ctx.scale(k, k); txt('6 – 1', 0, 0, 200, '#ffd400', 900, 'center', 18); txt('AGG 6 – 5', 0, 140, 64, '#fff', 900, 'center', 12); ctx.restore(); } })] },
    rmate: { set: 'room', cast: { mike: { x: 1550 } }, bright: 1, bus: true, busLabel: 'METRO', card: 'off',
      title: ['FOLLOW FOR MORE', '<span class="gold">WHAT IFs</span>'], titleSize: [84, 110], titleAt: 'follow',
      cam: [[0, { x: 1550, y: 990, z: 1.3 }], [1, { x: 1550, y: 1000, z: 1.4 }]],
      acts: { mike: [[0, { e: 'neutral', propR: 'scarf', m: { lookX: -.5 } }], ['noise', .4, { e: 'shock', p: 'handsOnHead', propR: null, m: { lookX: 0, tremble: .5 } }], ['follow', .75, { e: 'despair', p: 'handsOnHead' }]] },
      extraRoom: (lt, t) => { const k = P(lt, cue('noise', .4), cue('noise', .4) + .3); if (k > 0 && lt < cue('follow', .75)) { ctx.save(); ctx.globalAlpha = k; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(1250, 820, 60 + i * 40 + (t * 80 % 40), -.9, .9); ctx.lineWidth = 8; ctx.strokeStyle = '#ffd400'; ctx.stroke(); } txt('ROAR!', 1290, 700, 60, '#ffd400', 900, 'center', 10); ctx.restore(); } } }
  });


  // ---------- Greece Euro 2004 story ----------
  function teamScore(top, A, cA, B, cB, steps, bg = ['#0b2a7a', '#06134a']) {
    return (t, lt, d) => {
      cardBg(bg[0], bg[1]);
      let ga = steps[0][2], gb = steps[0][3], label = steps[0][4], at = -9;
      for (const [cn, df, a, b, lb] of steps) { const tt = cn ? cue(cn, df) : df * d; if (lt >= tt) { ga = a; gb = b; label = lb; at = tt; } }
      txt(top, TVW / 2, 100, 34, '#ffd400', 800);
      const y = 240;
      ctx.beginPath(); ctx.roundRect(40, y - 120, TVW - 80, 250, 30); ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = '#fff';
      ctx.beginPath(); ctx.arc(150, y - 20, 48, 0, Math.PI * 2); ctx.fillStyle = cA; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(TVW - 150, y - 20, 48, 0, Math.PI * 2); ctx.fillStyle = cB; ctx.fill(); ctx.stroke();
      txt(A, 150, y + 70, 36, '#fff'); txt(B, TVW - 150, y + 70, 36, '#fff');
      const k = 1 + .5 * Math.max(0, 1 - (lt - at) / .5);
      ctx.save(); ctx.translate(TVW / 2, y + 10); ctx.scale(k, k); txt(`${ga} – ${gb}`, 0, 0, 120, '#ffd400', 900, 'center', 12); ctx.restore();
      if (label) { const kk = eb(P(lt, at, at + .35)); ctx.save(); ctx.translate(TVW / 2, 445); ctx.scale(kk, kk); txt(label, 0, 0, 46, '#fff', 900, 'center', 10); ctx.restore(); }
    };
  }
  const GRE = '#0d5eaf', POR = '#c8102e', FRA = '#1f3a93', CZE = '#d7141a';
  const reactPan = (a, b) => [[0, TV], [a, TV], [b, G], [1, G2]];
  Object.assign(SHOTS, {
    gotto: { set: 'room', cast: room, tag: 'THE COACH',
      card: textCard([['GREECE · EURO 2004', 40, '#ffd400', null, .03], ['OTTO REHHAGEL', 70, '#fff', null, .1], ['THE PLAN:', 40, '#ffd400', 'plan', .5], ['DEFEND · DEFEND · DEFEND', 46, '#fff', 'defend', .65]], ['#0b2a7a', '#06134a']),
      cam: reactPan(.78, .86),
      acts: { hero: [[0, { e: 'neutral', m: { lookX: -1 } }], [.86, { e: 'confident', p: 'crossed', m: { lookX: 0 } }]],
              mike: [[0, { e: 'smirk', m: { lookX: -1 } }], [.86, { e: 'laugh', p: 'pointR', m: { laugh: .8, lookX: 1 } }]],
              jay: [[0, { e: 'giggle', m: { lookX: -1 } }], [.86, { e: 'laugh', p: 'bellyLaugh', m: { laugh: .8 } }]] } },
    gopener: { set: 'room', cast: room, tag: '12 JUNE 2004 · PORTO',
      card: teamScore('OPENING GAME', 'PORTUGAL', POR, 'GREECE', GRE, [[null, 0, 0, 0, ''], ['win', .6, 1, 2, 'FULL TIME']]),
      cam: reactPan(.68, .76),
      acts: { hero: [[0, { e: 'happy', m: { lookX: -1 } }], [.76, { e: 'ecstatic', p: 'fistPumpR', handR: 'fist', m: { jump: .4, lookX: 0 } }]],
              mike: [[0, { e: 'smirk', m: { lookX: -1 } }], [.76, { e: 'surprised', m: { lookX: 1 } }]], jay: [[0, { e: 'giggle', m: { lookX: -1 } }], [.78, { e: 'surprised', m: { lookX: -1 } }]] } },
    gfrance: { set: 'room', cast: room, tag: 'QUARTER-FINAL',
      card: teamScore('vs THE CHAMPIONS', 'FRANCE', FRA, 'GREECE', GRE, [[null, 0, 0, 0, ''], ['goal', .6, 0, 1, 'CHARISTEAS!']]),
      cam: reactPan(.7, .78),
      acts: { hero: [[0, { e: 'tense', m: { lookX: -1 } }], [.78, { e: 'ecstatic', p: 'cheer', m: { jump: .8 } }]],
              mike: [[0, { e: 'smirk', m: { lookX: -1 } }], [.78, { e: 'worried', p: 'crossed', m: { lookX: -1 } }]], jay: [[0, { e: 'neutral', m: { lookX: -1 } }], [.8, { e: 'nervous', p: 'nervous', m: { lookX: -1 } }]] } },
    gczech: { set: 'room', cast: room, tag: 'SEMI-FINAL', bright: .9,
      card: teamScore('EXTRA TIME', 'GREECE', GRE, 'CZECH REP.', CZE, [[null, 0, 0, 0, ''], ['goal', .55, 1, 0, 'DELLAS! SILVER GOAL']]),
      cam: reactPan(.72, .8),
      acts: { hero: [[0, { e: 'tense', p: 'pleading', m: { lookX: -1, tremble: .4 } }], [.8, { e: 'ecstatic', p: 'cheer', m: { dance: 1 } }]],
              mike: [[0, { e: 'tense', m: { lookX: -1 } }], [.8, { e: 'shock', p: 'handsOnHead', m: { lookX: -1 } }]], jay: [[0, { e: 'tense', p: 'nervous', m: { lookX: -1 } }], [.82, { e: 'nervous', p: 'nervous', m: { lookX: -1, tremble: .7 } }]] } },
    gfinal: { set: 'room', cast: room, tag: '4 JULY 2004 · LISBON', bright: .72,
      card: teamScore('EURO 2004 FINAL', 'PORTUGAL', POR, 'GREECE', GRE, [[null, 0, 0, 0, 'RONALDO · FIGO · 62,000 FANS']]),
      cam: [[0, TV], [.5, TV], [.62, { x: 0, y: 1010, z: 1.45 }], [1, { x: 0, y: 1015, z: 1.55 }]],
      acts: { hero: [[0, { e: 'tense', p: 'pleading', m: { lookX: -1, tremble: .5 } }]], mike: [[0, { e: 'tense', p: 'nervous', m: { lookX: -1, tremble: .7 } }]], jay: [[0, { e: 'worried', p: 'nervous', m: { lookX: -1, tremble: .7 } }]] } },
    ggoal: { set: 'room', cast: room, tag: "57'", bright: .8,
      card: teamScore('EURO 2004 FINAL', 'PORTUGAL', POR, 'GREECE', GRE, [[null, 0, 0, 0, 'CORNER...'], ['goal', .6, 0, 1, 'CHARISTEAS!']]),
      cam: [[0, TV], [.7, TV], [.78, G], [1, G2]],
      acts: { hero: [[0, { e: 'tense', p: 'pleading', m: { lookX: -1, tremble: .6 } }], [.78, { e: 'ecstatic', p: 'cheer', m: { jump: 1 } }]],
              mike: [[0, { e: 'tense', m: { lookX: -1 } }], [.78, { e: 'shock', p: 'handsOnHead', m: { lookX: -1 } }]], jay: [[0, { e: 'tense', m: { lookX: -1 } }], [.78, { e: 'shock', m: { lookX: -1 } }]] } }
  });


  // ---------- Greece: the final in the stadium ----------
  Object.assign(CH, {
    charisteas: { skin: '#f0c19a', shirt: '#0d5eaf', trim: '#ffffff', number: '9', pants: '#0d5eaf', shoes: '#111', hair: 'short', hairColor: '#2a1a10', stubble: true, bw: 1.05, blinkPh: .5 },
    ronaldo:    { skin: '#e8b08a', shirt: '#c8102e', trim: '#0f8a3c', number: '17', pants: '#0f8a3c', shoes: '#111', hair: 'spiky', hairColor: '#3a2414', bw: .92, blinkPh: 1.2 },
    figo:       { skin: '#f0c19a', shirt: '#c8102e', trim: '#0f8a3c', number: '7', pants: '#0f8a3c', shoes: '#111', hair: 'slick', hairColor: '#2a1a10', stubble: true, bw: 1, blinkPh: 2.0 },
    ricardo:    { skin: '#f0c19a', shirt: '#2b2f3a', trim: '#ffd400', number: '1', pants: '#2b2f3a', shoes: '#111', hair: 'buzz', hairColor: '#2a1a10', bw: 1.05, blinkPh: 2.6 }
  });
  const GFANS = { mike: { x: -270 }, hero: { x: 0 }, jay: { x: 270 } };
  Object.assign(SHOTS, {
    gfinal2: { set: 'stands', tag: '4 JULY 2004 · LISBON', bright: .78,
      cuts: [
        standsCut({ at: 0, cast: GFANS, cam: [[0, { x: 0, y: 995, z: 1.25 }], [1, { x: 0, y: 1000, z: 1.35 }]],
          acts: { hero: [[0, { e: 'tense', p: 'pleading', m: { tremble: .5 } }]], mike: [[0, { e: 'tense', p: 'nervous', m: { tremble: .6 } }]], jay: [[0, { e: 'worried', p: 'nervous', m: { tremble: .6 } }]] } }),
        pitchCut({ at: ['stars', .5], cast: { ronaldo: { x: -120, scale: .82 }, figo: { x: 180, scale: .82 } }, score: 'POR 0 – 0 GRE', label: 'EURO 2004 FINAL',
          acts: { ronaldo: [[0, { e: 'confident', p: 'hips', m: { lookX: 1 } }]], figo: [[0, { e: 'focused', p: 'crossed', m: { lookX: -1 } }]] } })] },
    ggoal2: { set: 'pitch', tag: "57'", bright: 1,
      cuts: [
        pitchCut({ at: 0, cast: { charisteas: { x: -170, scale: .82 }, ricardo: { x: -380, scale: .78 } },
          score: lt => lt < cue('goal', .62) ? 'POR 0 – 0 GRE' : 'POR 0 – 1 GRE', label: lt => lt >= cue('goal', .62) ? 'CHARISTEAS!' : 'CORNER...',
          ball: () => { const g = cue('goal', .62); return [[0, 980, 1385], [g - 1.3, 900, 1385], [g - .25, -170, 975, 420], [g + .05, -470, 1110, 20], [g + .5, -490, 1385, 20]]; },
          acts: () => { const g = cue('goal', .62), D = CUR.duration; return {
            charisteas: [[0, { e: 'focused', m: { lookX: 1 } }], [(g - .55) / D, { e: 'focused', p: 'cheer', m: { jump: 1, lookX: 1 } }], [(g + .1) / D, { e: 'ecstatic', p: 'cheer', m: { jump: .4, lookX: 0 } }]],
            ricardo: [[0, { e: 'focused', po: KP, m: { lookX: 1 } }], [(g - .2) / D, { e: 'shock', po: { lA: 170, rA: 170, lE: 0, rE: 0 }, m: { dy: -50 } }], [(g + .6) / D, { e: 'despair', p: 'handsOnHead', po: {}, m: { dy: 0 } }]] }; } }),
        standsCut({ at: ['goal', .62, .45], cast: GFANS, acts: { hero: [[0, { e: 'ecstatic', p: 'cheer', propR: 'scarf', m: { jump: 1 } }]], mike: [[0, { e: 'shock', p: 'handsOnHead' }]], jay: [[0, { e: 'shock', p: 'cheer' }]] } })] },
    gchamp: { set: 'stands', bright: 1.12, minDur: 4.6,
      cuts: [standsCut({ at: 0, cast: GFANS, conf: 1, shake: 1, flash: true, cam: [[0, { x: 0, y: 985, z: 1.2 }], [1, { x: 0, y: 985, z: 1.1 }]],
        acts: { hero: [[0, { e: 'ecstatic', p: 'cheer', propR: 'scarf', m: { jump: 1 } }]], mike: [[0, { e: 'shock', p: 'handsOnHead', m: { lookX: 1 } }]], jay: [[0, { e: 'shock', p: 'handsOnHead', m: { lookX: -1 } }], [.45, { e: 'shock', p: 'faint', m: { lookX: 0 } }]] },
      })] }
  });


  // ---------- Bert Trautmann story ----------
  Object.assign(CH, {
    trautmann: { skin: '#ffd9b8', shirt: '#3a3f52', trim: '#ffd400', pants: '#ffffff', shoes: '#111', hair: 'short', hairColor: '#d8b46a', bw: 1.05, blinkPh: .6 },
    soldier:   { skin: '#ffd9b8', shirt: '#5b5f3a', trim: '#3f4228', pants: '#5b5f3a', shoes: '#2a2116', hair: 'cap', capColor: '#5b5f3a', hairColor: '#d8b46a', bw: 1.05, blinkPh: .6 },
    tommy:     { skin: '#f0c19a', shirt: '#9a8a55', trim: '#6b5f38', pants: '#9a8a55', shoes: '#2a2116', hair: 'cap', capColor: '#7a6d40', hairColor: '#3a2414', bw: 1, blinkPh: 1.4 },
    striker:   { skin: '#f0c19a', shirt: '#ffffff', trim: '#1f4fa8', pants: '#1f4fa8', shoes: '#111', hair: 'slick', hairColor: '#2a1a10', bw: 1, blinkPh: 2.2 }
  });
  function impact(x, y, t, k) {
    if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(t * 2);
    ctx.beginPath(); for (let i = 0; i < 16; i++) { const r = i % 2 ? 26 : 62; const a = i / 16 * Math.PI * 2; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath();
    ctx.fillStyle = '#ffd400'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#e8243b'; ctx.stroke(); ctx.restore();
  }
  function fence() {
    ctx.lineWidth = 7; ctx.strokeStyle = OUT;
    for (let x = -900; x <= 900; x += 260) { ctx.beginPath(); ctx.roundRect(x - 14, 820, 28, 600, 6); ctx.fillStyle = '#6b4a2a'; ctx.fill(); ctx.stroke(); }
    ctx.strokeStyle = '#9aa0ad'; ctx.lineWidth = 4;
    for (let y = 860; y < 1300; y += 80) { ctx.beginPath(); for (let x = -900; x <= 900; x += 20) ctx.lineTo(x, y + Math.sin(x * .1) * 6); ctx.stroke(); }
    ctx.fillStyle = '#9aa0ad'; for (let y = 860; y < 1300; y += 80) for (let x = -890; x <= 900; x += 60) { ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); }
  }
  function xray(t, k) {
    ctx.save(); ctx.translate(0, 820); ctx.scale(k, k);
    ctx.beginPath(); ctx.roundRect(-300, -330, 600, 660, 26); ctx.fillStyle = '#0d1b33'; ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = '#c9ced8'; ctx.stroke();
    ctx.fillStyle = 'rgba(190,220,255,.85)';
    ctx.beginPath(); ctx.ellipse(0, -200, 120, 105, 0, 0, Math.PI * 2); ctx.fill();          // skull
    ctx.fillStyle = '#0d1b33'; ctx.beginPath(); ctx.ellipse(-42, -205, 26, 22, 0, 0, Math.PI * 2); ctx.ellipse(42, -205, 26, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(190,220,255,.85)';
    for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.roundRect(-34, -80 + i * 52, 68, 40, 10); ctx.fill(); }        // vertebrae
    ctx.beginPath(); ctx.moveTo(-260, 260); ctx.quadraticCurveTo(0, 170, 260, 260); ctx.lineWidth = 30; ctx.strokeStyle = 'rgba(190,220,255,.85)'; ctx.stroke(); // shoulders
    const pulse = .6 + .4 * Math.sin(t * 8);
    ctx.strokeStyle = `rgba(255,40,60,${pulse})`; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-40, 76); ctx.lineTo(-10, 96); ctx.lineTo(-24, 110); ctx.lineTo(16, 128); ctx.lineTo(4, 140); ctx.lineTo(44, 158); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 118, 80, 0, Math.PI * 2); ctx.lineWidth = 8; ctx.stroke();
    ctx.restore();
  }
  const NECK = { lA: 40, lE: -168, rA: 40, rE: -168 };
  const TP = { x: -60, y: 820, z: 1.0 };
  const STUDIO2 = { x: 0, y: 985, z: 1.25 };
  const saveSeq = (times) => {      // keeper saves at given times: alternate dives
    const ball = [[0, 400, 1385]], acts = [[0, { e: 'focused', po: KP, m: { lookX: 1 } }]];
    times.forEach((tt, i) => {
      const left = i % 2 === 0; ball.push([tt - .45, 300, 1385], [tt, left ? -470 : -210, 1150, 80], [tt + .35, 380, 1385, 120]);
      acts.push([tt - .25, { e: 'focused', po: left ? DIVE_L : DIVE_R, m: { dy: -50 } }], [tt + .25, { e: 'confident', po: KP, m: { dy: 0 } }]);
    });
    return { ball, acts };
  };
  Object.assign(SHOTS, {
    tcold: { set: 'pitch', noCaption: true, bright: .95, titleFast: true,
      title: ['HE WON A CUP FINAL', 'WITH A <span class="gold">BROKEN NECK</span>'], titleSize: [80, 96],
      cuts: [pitchCut({ at: 0, cam: [[0, { x: -340, y: 980, z: 1.35 }], [1, { x: -340, y: 980, z: 1.55 }]], cast: { trautmann: { x: -340, scale: .85 } }, score: '', label: '',
        acts: { trautmann: [[0, { e: 'tense', ex: { mouthCurve: -.4 }, p: 'idle', po: NECK, m: { tremble: .6 } }]] },
        extra: (lt, t) => impact(-345, 1400 - 375 * .85, t, (.7 + .3 * Math.sin(lt * 10)) * .9) })] },
    tnot: { set: 'pitch', bright: 1,
      cuts: [pitchCut({ at: 0, cam: [[0, { x: -340, y: 1000, z: 1.55 }], [1, { x: -340, y: 950, z: 2.1 }]], cast: { trautmann: { x: -340, scale: .85 } }, score: '', label: '',
        acts: { trautmann: [[0, { e: 'tense', po: NECK }], [.45, { e: 'wink', p: 'idle', po: {} }]] },
        extra: (lt, t) => { const k = eb(P(lt, .5, .8)); if (k > 0) txt('?', -180, 760, 200 * k, '#ffd400', 900, 'center', 16); } })] },
    tsoldier: { set: 'studio', bright: .85, sepia: true, tag: 'WORLD WAR II',
      cam: [[0, STUDIO2], [1, { x: 0, y: 990, z: 1.35 }]], cast: { soldier: { x: 0 } },
      acts: { soldier: [[0, { e: 'focused', p: 'idle', m: { lookX: 0 } }]] } },
    tcaptured: { set: 'studio', bright: .8, sepia: true, tag: '1945',
      cam: [[0, STUDIO2], [1, { x: 0, y: 990, z: 1.3 }]], cast: { soldier: { x: -160 }, tommy: { x: 240 } }, front: 'fence', afterFence: ['tommy'],
      acts: { soldier: [[0, { e: 'worried', p: 'cheer', m: { lookX: 1 } }], ['camp', .55, { e: 'despair', p: 'idle', m: { lookX: 0 } }]], tommy: [[0, { e: 'focused', p: 'pointL', m: { lookX: -1 } }], ['camp', .55, { e: 'focused', p: 'crossed' }]] },
      frontFrom: ['camp', .55], label: 'POW CAMP · ENGLAND' },
    tstay: { set: 'pitch', bright: .95, tag: 'AFTER THE WAR',
      cuts: [pitchCut({ at: 0, cast: { trautmann: { x: -340, scale: .8 } }, score: '', label: '',
        ball: () => saveSeq([CUR.duration * .62]).ball, acts: () => ({ trautmann: saveSeq([CUR.duration * .62]).acts.map(([tt, k]) => [tt / CUR.duration, k]) }) })] },
    tprotest: { set: 'stands', bright: .8, tag: '1949 · MANCHESTER CITY',
      cuts: [standsCut({ at: 0, cast: { mike: { x: -270 }, hero: { x: 0 }, jay: { x: 270 } },
        acts: { mike: [[0, { e: 'angry', p: 'pointR', m: { lookX: 1 } }]], hero: [[0, { e: 'angry', p: 'crossed' }]], jay: [[0, { e: 'angry', p: 'pointL', m: { lookX: -1 } }]] },
        extraTop: (lt, t) => { const k = eb(P(lt, .3, .6)); if (k > 0) { ctx.save(); ctx.translate(0, 760); ctx.rotate(Math.sin(t * 3) * .05); ctx.scale(k, k); ctx.beginPath(); ctx.roundRect(-260, -60, 520, 120, 12); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = OUT; ctx.stroke(); txt('NOT IN OUR GOAL!', 0, 4, 50, '#e8243b', 900); ctx.restore(); } } })] },
    tsaves: { set: 'pitch', bright: 1,
      cuts: [pitchCut({ at: 0, cast: { trautmann: { x: -340, scale: .8 }, striker: { x: 360, scale: .8 } }, score: '', label: 'SAVE · SAVE · SAVE',
        ball: () => { const D = CUR.duration; return saveSeq([cue('s1', .3), cue('s2', .55), cue('s3', .8)]).ball; },
        acts: () => { const D = CUR.duration, sq = saveSeq([cue('s1', .3), cue('s2', .55), cue('s3', .8)]); return { trautmann: sq.acts.map(([tt, k]) => [tt / D, k]), striker: [[0, { e: 'focused', po: KICK, m: { lookX: -1 } }], [.9, { e: 'despair', p: 'handsOnHead', po: {} }]] }; } })] },
    tcheers: { set: 'stands', bright: 1.05,
      cuts: [standsCut({ at: 0, cast: { mike: { x: -270 }, hero: { x: 0 }, jay: { x: 270 } },
        acts: { mike: [[0, { e: 'neutral', p: 'crossed' }], [.35, { e: 'happy', p: 'cheer', propR: 'scarf' }]], hero: [[0, { e: 'surprised' }], [.3, { e: 'ecstatic', p: 'cheer', m: { jump: .5 } }]], jay: [[0, { e: 'neutral' }], [.4, { e: 'happy', p: 'cheer', propR: 'scarf' }]] } })] },
    tfinal: { set: 'pitch', tag: '5 MAY 1956 · WEMBLEY', bright: .95,
      cuts: [pitchCut({ at: 0, cast: { striker: { x: 360, scale: .8 }, trautmann: { x: -340, scale: .8 } }, score: 'MCI 3 – 1 BIR', label: "FA CUP FINAL · 75'",
        move: { striker: [[0, 360], ['knee', .75, -120]], trautmann: [[0, -340], ['knee', .75, -230]] },
        ball: () => { const k = cue('knee', .75); return [[0, 300, 1385], [k - .1, -150, 1385], [k + .5, -220, 1385]]; },
        acts: () => { const k = cue('knee', .75), D = CUR.duration; return {
          striker: [[0, { e: 'focused', m: { walk: 1, lookX: -1 } }], [(k - .05) / D, { e: 'shock', po: KICK, m: { walk: 0 } }], [(k + .4) / D, { e: 'shock', p: 'faint', po: { lean: 70 } }]],
          trautmann: [[0, { e: 'focused', po: KP, m: { lookX: 1 } }], [(k - .3) / D, { e: 'focused', po: DIVE_R, m: { dy: -10 } }], [(k + .15) / D, { e: 'despair', po: { lean: 85, lA: 40, lE: -168, rA: 40, rE: -168 }, m: { dy: 30 } }]] }; },
        extra: (lt, t) => { const k = cue('knee', .75); impact(-200, 1240, t, lt > k ? eb(P(lt, k, k + .25)) * (1 - P(lt, k + 1.2, k + 1.6)) : 0); } })] },
    tplayon: { set: 'pitch', bright: .75,
      cuts: [
        pitchCut({ at: 0, cast: { trautmann: { x: -300, scale: .85 } }, score: 'MCI 3 – 1 BIR', label: 'NO SUBSTITUTES IN 1956', cam: [[0, { x: -170, y: 950, z: 1.25 }], [1, { x: -170, y: 960, z: 1.38 }]],
          acts: { trautmann: [[0, { e: 'despair', po: { lean: 85, lA: 40, lE: -168, rA: 40, rE: -168 }, m: { dy: 30 } }], ['up', .5, { e: 'tense', ex: { mouthCurve: -.5 }, p: 'idle', po: NECK, m: { dy: 0, tremble: .8 } }], ['up', .7, { e: 'focused', po: KP, m: { tremble: .5 } }]] } })] },
    twin: { set: 'pitch', bright: 1.05,
      cuts: [
        pitchCut({ at: 0, cast: { trautmann: { x: -340, scale: .8 }, striker: { x: 360, scale: .8 } }, score: lt => lt < CUR.duration * .45 ? 'MCI 3 – 1 BIR' : 'FULL TIME 3 – 1', label: lt => lt < CUR.duration * .45 ? 'ANOTHER SAVE!' : 'CITY WIN THE CUP!',
          ball: () => saveSeq([CUR.duration * .22]).ball, acts: () => { const D = CUR.duration; return { trautmann: saveSeq([D * .22]).acts.map(([tt, k]) => [tt / D, k]).concat([[.45, { e: 'ecstatic', p: 'cheer', po: {}, m: { dy: 0 } }]]), striker: [[0, { e: 'focused', po: KICK }], [.4, { e: 'despair', p: 'handsOnHead', po: {} }]] }; } }),
        standsCut({ at: .55, cast: { mike: { x: -270 }, hero: { x: 0 }, jay: { x: 270 } }, conf: 1, flash: true, acts: { mike: [[0, { e: 'ecstatic', p: 'cheer', propR: 'scarf', m: { jump: .6 } }]], hero: [[0, { e: 'ecstatic', p: 'cheer', m: { jump: 1 } }]], jay: [[0, { e: 'ecstatic', p: 'cheer', propR: 'scarf', m: { dance: 1 } }]] } })] },
    txray: { set: 'studio', bright: .7, tag: '3 DAYS LATER', cast: {},
      cam: [[0, STUDIO], [1, { x: 540, y: 960, z: 1.05 }]],
      draw: (s, lt, d, t) => { ctx.save(); ctx.translate(540, 0); xray(t, eb(P(lt, .1, .5))); ctx.restore(); const k = eb(P(lt, cue('truth', .5), cue('truth', .5) + .4)); if (k > 0) { ctx.save(); ctx.translate(540, 1300); ctx.scale(k, k); txt('BROKEN NECK', 0, 0, 120, '#ff3b4f', 900, 'center', 16); ctx.restore(); } } },
    tlegend: { set: 'stands', bright: 1.08, title: ['FOLLOW FOR MORE', '<span class="gold">FOOTBALL STORIES</span>'], titleSize: [80, 92], titleAt: 'follow',
      cuts: [standsCut({ at: 0, cast: { mike: { x: -270 }, trautmann: { x: 0 }, jay: { x: 270 } },
        acts: { trautmann: [[0, { e: 'happy', p: 'waveR', m: { wave: 1 } }]], mike: [[0, { e: 'happy', p: 'cheer', propR: 'scarf' }]], jay: [[0, { e: 'happy', p: 'cheer', propR: 'scarf', m: { dance: .5 } }]] },
        extraTop: (lt, t) => { const k = eb(P(lt, .3, .7)); if (k > 0 && lt < cue('follow', .7)) { ctx.save(); ctx.translate(0, 700); ctx.scale(k, k); ctx.beginPath(); ctx.roundRect(-250, -50, 500, 100, 50); ctx.fillStyle = '#6cabdd'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = OUT; ctx.stroke(); txt('CLUB LEGEND', 0, 4, 56, '#fff', 900, 'center', 8); ctx.restore(); } } })] }
  });


  // ---------- Pickles 1966 story ----------
  Object.assign(CH, {
    thief:  { skin: '#e8c9a8', shirt: '#2b2b33', trim: '#4a4a55', pants: '#1d1d24', shoes: '#111', hair: 'slick', hairColor: '#111', mustache: true, bw: 1, blinkPh: .3 },
    police: { skin: '#f0c19a', shirt: '#1b2348', trim: '#c9ced8', pants: '#1b2348', shoes: '#111', hair: 'helmet', hairColor: '#3a2414', bw: 1.05, blinkPh: 1.5 },
    moore:  { skin: '#ffd9b8', shirt: '#d81e2c', trim: '#ffffff', number: '6', pants: '#ffffff', shoes: '#111', hair: 'short', hairColor: '#d8b46a', bw: 1, blinkPh: .9 }
  });
  window.drawJulesRimet = function (c, x, y, sc, t) {
    c.save(); c.translate(x, y); c.scale(sc, sc); c.lineWidth = 6; c.strokeStyle = OUT; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(-46, 0); c.lineTo(46, 0); c.lineTo(38, 34); c.lineTo(-38, 34); c.closePath(); c.fillStyle = '#2346a8'; c.fill(); c.stroke();
    const g = c.createLinearGradient(-40, -170, 40, 0); g.addColorStop(0, '#fff2a8'); g.addColorStop(.5, '#ffc928'); g.addColorStop(1, '#b07a10'); c.fillStyle = g;
    c.beginPath(); c.moveTo(-22, 0); c.quadraticCurveTo(-14, -60, -8, -95); c.lineTo(8, -95); c.quadraticCurveTo(14, -60, 22, 0); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-8, -90); c.quadraticCurveTo(-70, -110, -64, -165); c.quadraticCurveTo(-40, -130, -6, -120); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(8, -90); c.quadraticCurveTo(70, -110, 64, -165); c.quadraticCurveTo(40, -130, 6, -120); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-40, -150); c.lineTo(40, -150); c.lineTo(28, -112); c.lineTo(-28, -112); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(-12, -132, 6, 14, .2, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,.6)'; c.fill();
    c.restore();
  };
  // side-view cartoon dog (black & white collie mix)
  function drawDog(x, y, sc, st, t) {
    const trot = st.trot ? Math.sin(t * 13) : 0, wag = Math.sin(t * (st.wagFast ? 26 : 12)) * .5;
    ctx.save(); ctx.translate(x, y - (st.jump ? Math.abs(Math.sin(t * 6)) * 90 : 0)); ctx.scale(sc * (st.flip ? -1 : 1), sc);
    ctx.save(); ctx.scale(1, .22); ctx.beginPath(); ctx.arc(0, 0, 80, 0, Math.PI * 2); ctx.fillStyle = 'rgba(10,0,30,.3)'; ctx.fill(); ctx.restore();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const leg = (lx, ph) => { const a = (st.trot ? Math.sin(t * 13 + ph) * .5 : 0); ctx.beginPath(); ctx.moveTo(lx, -60); ctx.lineTo(lx + Math.sin(a) * 40, -4); ctx.lineWidth = 26; ctx.strokeStyle = OUT; ctx.stroke(); ctx.lineWidth = 16; ctx.strokeStyle = '#ffffff'; ctx.stroke(); };
    leg(-46, Math.PI); leg(40, 0);
    // tail
    ctx.beginPath(); ctx.moveTo(-66, -82); ctx.quadraticCurveTo(-110, -110 + wag * 40, -100, -150 + wag * 50); ctx.lineWidth = 22; ctx.strokeStyle = OUT; ctx.stroke(); ctx.lineWidth = 12; ctx.strokeStyle = '#1d1d24'; ctx.stroke();
    // body
    ctx.beginPath(); ctx.ellipse(0, -84, 78, 40, 0, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.save(); ctx.clip(); ctx.fillStyle = '#1d1d24'; ctx.beginPath(); ctx.ellipse(-20, -110, 50, 30, .2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.ellipse(0, -84, 78, 40, 0, 0, Math.PI * 2); ctx.lineWidth = 7; ctx.strokeStyle = OUT; ctx.stroke();
    leg(-24, 0); leg(60, Math.PI);
    if (st.bow) { ctx.beginPath(); ctx.moveTo(62, -112); ctx.lineTo(44, -126); ctx.lineTo(44, -98); ctx.closePath(); ctx.moveTo(62, -112); ctx.lineTo(80, -126); ctx.lineTo(80, -98); ctx.closePath(); ctx.fillStyle = '#e8243b'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke(); }
    if (st.medal) { ctx.beginPath(); ctx.moveTo(48, -104); ctx.lineTo(62, -60); ctx.lineTo(76, -104); ctx.lineWidth = 6; ctx.strokeStyle = '#2346a8'; ctx.stroke(); ctx.beginPath(); ctx.arc(62, -54, 14, 0, Math.PI * 2); ctx.fillStyle = '#ffc928'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke(); }
    // head
    const hy = st.sniff ? -60 + Math.sin(t * 16) * 6 : -132, hx = st.sniff ? 92 : 78;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(st.sniff ? .5 : (st.tilt ? Math.sin(t * 2) * .25 : 0));
    ctx.beginPath(); ctx.ellipse(30, 10, 30, 20, 0, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 36, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 33, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = '#1d1d24'; ctx.beginPath(); ctx.ellipse(-12, -14, 28, 26, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.moveTo(-18, -26); ctx.quadraticCurveTo(-46, -10, -34, 22); ctx.quadraticCurveTo(-20, 6, -6, -24); ctx.closePath(); ctx.fillStyle = '#1d1d24'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
    ctx.beginPath(); ctx.arc(56, 4, 9, 0, Math.PI * 2); ctx.fillStyle = OUT; ctx.fill();
    ctx.beginPath(); ctx.arc(10, -6, 8, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.beginPath(); ctx.arc(12, -6, 5, 0, Math.PI * 2); ctx.fillStyle = OUT; ctx.fill();
    if (st.tongue) { ctx.beginPath(); ctx.ellipse(36, 34 + Math.sin(t * 10) * 3, 9, 15, .2, 0, Math.PI * 2); ctx.fillStyle = '#ff6b8a'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke(); }
    ctx.restore();
    ctx.restore();
  }
  function glassCase(x, full, t, broken) {
    ctx.lineWidth = 7; ctx.strokeStyle = OUT;
    ctx.beginPath(); ctx.roundRect(x - 150, 1120, 300, 280, 10); ctx.fillStyle = '#6b4a2a'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(x - 170, 1100, 340, 30, 8); ctx.fillStyle = '#8a6238'; ctx.fill(); ctx.stroke();
    if (full) window.drawJulesRimet(ctx, x, 1060, 1.3, t);
    ctx.beginPath(); ctx.roundRect(x - 150, 760, 300, 340, 8); ctx.fillStyle = 'rgba(200,230,255,.18)'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#d9e8ff'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 110, 790); ctx.lineTo(x - 60, 790); ctx.lineTo(x - 130, 1000); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fill();
    if (!full) { ctx.save(); ctx.globalAlpha = .9; txt('?', x, 980, 120, 'rgba(255,255,255,.7)', 900); ctx.restore(); }
  }
  function stamp(textv, x, y, k, rot = -.15, color = '#e8243b') {
    if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(lerp(2.2, 1, k), lerp(2.2, 1, k)); ctx.globalAlpha = clamp(k * 2);
    ctx.font = '900 84px Inter Display'; const w = ctx.measureText(textv).width;
    ctx.beginPath(); ctx.roundRect(-w / 2 - 30, -62, w + 60, 124, 16); ctx.lineWidth = 12; ctx.strokeStyle = color; ctx.stroke();
    txt(textv, 0, 4, 84, color, 900); ctx.restore();
  }
  function newspaper(x, y, k, t) {
    if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate((1 - k) * Math.PI * 4 - .06); ctx.scale(k, k);
    ctx.beginPath(); ctx.rect(-300, -380, 600, 760); ctx.fillStyle = '#f4efe2'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = OUT; ctx.stroke();
    txt('THE DAILY NEWS', 0, -320, 48, OUT, 900); ctx.fillStyle = OUT; ctx.fillRect(-270, -285, 540, 6);
    txt('WORLD CUP', 0, -200, 92, '#c8102e', 900); txt('STOLEN!', 0, -100, 110, '#c8102e', 900);
    ctx.fillStyle = 'rgba(27,16,53,.25)'; for (let i = 0; i < 9; i++) { ctx.fillRect(-270, -20 + i * 40, 250, 14); ctx.fillRect(20, -20 + i * 40, 250, 14); }
    ctx.restore();
  }
  function ransomNote(x, y, k) {
    if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(.08); ctx.scale(k, k);
    ctx.beginPath(); ctx.moveTo(-260, -160); ctx.lineTo(250, -170); ctx.lineTo(262, 150); ctx.lineTo(-250, 160); ctx.closePath(); ctx.fillStyle = '#fffaf0'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = OUT; ctx.stroke();
    const word = (w, yy, size) => { let xx = -(w.length * size * .62) / 2; for (const ch of w) { const bg = ['#ffd400', '#7fd8ff', '#ff9ab0', '#c9f27a', '#ffffff'][(ch.charCodeAt(0) + w.length) % 5]; ctx.save(); ctx.translate(xx + size * .3, yy); ctx.rotate(((ch.charCodeAt(0) % 7) - 3) * .05); ctx.fillStyle = bg; ctx.fillRect(-size * .3, -size * .48, size * .6, size * .9); txt(ch, 0, 2, size * .7, OUT, 900); ctx.restore(); xx += size * .62; } };
    word('£15,000', -50, 96); word('OR ELSE', 80, 70);
    ctx.restore();
  }
  function hedge(x0, x1) {
    ctx.lineWidth = 7; ctx.strokeStyle = OUT;
    for (let x = x0; x <= x1; x += 90) { ctx.beginPath(); ctx.arc(x, 1300 - ((x * 7) % 40), 90, 0, Math.PI * 2); ctx.fillStyle = (x / 90) % 2 ? '#2f8f4a' : '#287a40'; ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.rect(x0 - 90, 1300, x1 - x0 + 180, 100); ctx.fillStyle = '#287a40'; ctx.fill();
  }
  function lamp(x) {
    ctx.lineWidth = 7; ctx.strokeStyle = OUT;
    ctx.beginPath(); ctx.rect(x - 12, 700, 24, 700); ctx.fillStyle = '#2b2f3a'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(x - 50, 640, 100, 80, 14); ctx.fillStyle = '#ffe9a8'; ctx.fill(); ctx.stroke();
    ctx.save(); ctx.globalAlpha = .18; ctx.beginPath(); ctx.moveTo(x - 50, 720); ctx.lineTo(x - 260, 1400); ctx.lineTo(x + 260, 1400); ctx.lineTo(x + 50, 720); ctx.fillStyle = '#ffe9a8'; ctx.fill(); ctx.restore();
  }
  function bundle(x, y, open, t) {
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath(); ctx.roundRect(-70, -60, 140, 60, 10); ctx.fillStyle = '#e8e1cf'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.fillStyle = 'rgba(27,16,53,.3)'; for (let i = 0; i < 3; i++) ctx.fillRect(-55, -48 + i * 16, 110, 6);
    ctx.beginPath(); ctx.moveTo(-70, -30); ctx.lineTo(70, -30); ctx.lineWidth = 5; ctx.strokeStyle = '#8a6238'; ctx.stroke();
    ctx.restore();
  }
  const ST = { x: 0, y: 985, z: 1.25 };
  const dogAt = (lt, keys) => { let st = keys[0][1]; for (const [tt, k] of keys) if (lt >= tt) st = Object.assign({}, st, k); return st; };
  Object.assign(SHOTS, {
    pcold: { set: 'studio', noCaption: true, titleFast: true, bright: 1.05, cast: {}, title: ['A DOG SAVED', 'THE <span class="gold">WORLD CUP</span>'], titleSize: [110, 120],
      cam: [[0, { x: 0, y: 1110, z: 1.55 }], [1, { x: 0, y: 1110, z: 1.7 }]],
      draw2: (s, lt, d, t) => { window.drawJulesRimet(ctx, 165, 1400, 1.7, t); drawDog(-110, 1400, 1.75, { tongue: true, wag: true }, t); } },
    pserious: { set: 'studio', bright: 1, cast: {},
      cam: [[0, { x: -40, y: 1150, z: 1.9 }], [1, { x: -40, y: 1150, z: 2.15 }]],
      draw2: (s, lt, d, t) => { window.drawJulesRimet(ctx, 150, 1400, 1.5, t); drawDog(-110, 1400, 1.5, { tongue: lt > d * .4, tilt: true }, t); ctx.save(); ctx.translate(-40, 1010); ctx.scale(.5, .5); stamp('TRUE STORY', 0, 0, eo(P(lt, d * .45, d * .45 + .3))); ctx.restore(); } },
    pexhibit: { set: 'studio', tag: 'MARCH 1966 · LONDON', bright: 1, cast: { mike: { x: -340 }, jay: { x: 360 } },
      cam: [[0, ST], [1, { x: 0, y: 990, z: 1.32 }]],
      acts: { mike: [[0, { e: 'happy', m: { lookX: 1 } }]], jay: [[0, { e: 'surprised', m: { lookX: -1 } }]] },
      draw2: (s, lt, d, t) => { glassCase(0, true, t); ctx.beginPath(); ctx.roundRect(-260, 610, 520, 90, 14); ctx.fillStyle = '#1c2238'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#e0b84a'; ctx.stroke(); txt('WORLD CUP EXHIBITION', 0, 657, 40, '#fff', 900); } },
    pstolen: { set: 'studio', bright: .75, cast: {},
      cam: [[0, ST], [1, { x: 0, y: 990, z: 1.3 }]],
      draw2: (s, lt, d, t) => {
        const gone = lt > d * .35;
        glassCase(0, !gone, t);
        if (lt < d * .55) { const tx = lerp(-60, 900, eio(P(lt, d * .3, d * .55))); silhouette(Object.assign({}, CH.thief, { x: tx, y: GROUND, scale: 1 }), Puppet.stateAt([[0, { e: 'smirk', p: 'holdCashUp', propR: 'cup', m: { walk: 1 } }]], lt, d), t, '#ff5a4f'); }
        stamp('STOLEN!', 0, 820, eo(P(lt, d * .5, d * .5 + .3)));
      } },
    pnews: { set: 'studio', bright: .9, cast: {},
      cam: [[0, STUDIO], [1, { x: 540, y: 960, z: 1.04 }]],
      draw: (s, lt, d, t) => { const r = cue('ransom', .5); newspaper(540, 900, eb(P(lt, .1, .7)) * (1 - P(lt, r - .2, r)), t); ransomNote(540, 900, eb(P(lt, r, r + .4))); } },
    phandover: { set: 'street', bright: .7, cast: { police: { x: -150 }, thief: { x: 150 } },
      cam: [[0, ST], [1, { x: 0, y: 990, z: 1.3 }]],
      acts: { police: [[0, { e: 'focused', p: 'pointR', m: { lookX: 1 } }], [.3, { e: 'confident', p: 'takeR', m: { lookX: 1 } }]], thief: [[0, { e: 'shock', p: 'cheer', m: { lookX: -1 } }], [.5, { e: 'despair', p: 'cheer' }]] },
      draw2: (s, lt, d, t) => { lamp(-520); stamp('TROPHY STILL MISSING', 0, 760, eo(P(lt, cue('missing', .65), cue('missing', .65) + .3)), -.1); } },
    pwalk: { set: 'street', tag: 'ONE WEEK LATER', bright: .95, cast: { hero: { x: -200 } },
      cam: [[0, ST], [1, { x: 120, y: 990, z: 1.25 }]],
      move: { hero: [[0, -420], [1, 180]] },
      acts: { hero: [[0, { e: 'happy', m: { walk: 1, lookX: 1 } }]] },
      draw2: (s, lt, d, t) => { lamp(-620); const dx = lerp(-180, 420, lt / d); drawDog(dx, 1400, 1.4, { trot: true, tongue: true }, t); const k = eb(P(lt, cue('name', .75), cue('name', .75) + .35)); if (k > 0) { ctx.save(); ctx.translate(dx + 40, 1080); ctx.scale(k, k); ctx.beginPath(); ctx.roundRect(-150, -46, 300, 92, 46); ctx.fillStyle = '#ffd400'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = OUT; ctx.stroke(); txt('PICKLES', 0, 4, 56, OUT, 900); ctx.restore(); } } },
    psniff: { set: 'street', bright: .9, cast: { hero: { x: -260 } },
      cam: [[0, { x: 150, y: 1000, z: 1.3 }], [1, { x: 260, y: 1050, z: 1.6 }]],
      acts: { hero: [[0, { e: 'surprised', m: { lookX: 1 } }]] },
      draw2: (s, lt, d, t) => { hedge(380, 920); const pk = cue('pkg', .55); if (lt > pk) bundle(470, 1400, false, t); drawDog(250, 1400, 1.4, { sniff: true, wagFast: true }, t); const k = eb(P(lt, pk, pk + .3)); if (k > 0) txt('!', 470, 1180, 140 * k, '#ffd400', 900, 'center', 14); } },
    popen: { set: 'street', bright: 1, cast: { hero: { x: 100 } },
      cam: [[0, { x: 120, y: 1040, z: 1.5 }], [1, { x: 120, y: 1060, z: 1.65 }]],
      acts: { hero: [[0, { e: 'focused', p: 'takeR', m: { lookY: .6 } }], ['find', .6, { e: 'shock', p: 'holdCashUp', propR: 'cup', m: { lookY: 0 } }], ['find', .75, { e: 'ecstatic', p: 'holdCashUp', propR: 'cup', m: { jump: .4 } }]] },
      draw2: (s, lt, d, t) => { hedge(500, 900); const f = cue('find', .6); if (lt < f) bundle(330, 1250, false, t); drawDog(-180, 1400, 1.4, { tongue: lt > f, jump: lt > f + .3, wagFast: lt > f }, t);
        const k = P(lt, f, f + .5); if (k > 0) { ctx.save(); ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(270, 900, 120 + k * 500, 0, Math.PI * 2); ctx.fillStyle = '#fff6c0'; ctx.fill(); ctx.restore(); } } },
    pwembley: { set: 'pitch', tag: '30 JULY 1966 · WEMBLEY', bright: 1.1,
      cuts: [pitchCut({ at: 0, cam: [[0, { x: -60, y: 930, z: 1.2 }], [1, { x: -60, y: 930, z: 1.3 }]], conf: 1, cast: { moore: { x: -60, scale: .85 } }, score: 'ENG 4 – 2 FRG', label: 'WORLD CHAMPIONS!',
        acts: { moore: [[0, { e: 'ecstatic', p: 'holdCashUp', propR: 'cup', m: { jump: .3 } }]] } })] },
    pparty: { set: 'studio', bright: 1.1, conf: 1, cast: {},
      cam: [[0, { x: 0, y: 1080, z: 1.4 }], [1, { x: 0, y: 1080, z: 1.5 }]],
      draw2: (s, lt, d, t) => {
        ctx.beginPath(); ctx.roundRect(-240, 1300, 480, 100, 12); ctx.fillStyle = '#e0b84a'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = OUT; ctx.stroke();
        drawDog(0, 1300, 1.5, { tongue: true, bow: lt > cue('party', .75), medal: lt > cue('medal', .3), wag: true }, t);
        [['MEDAL', 'medal', .3, -260], ['MOVIE ROLE', 'movie', .5, 0], ['PARTY INVITE', 'party', .75, 260]].forEach(([l, n, df, x]) => { const k = eb(P(lt, cue(n, df), cue(n, df) + .35)); if (k > 0) { ctx.save(); ctx.translate(x, 820); ctx.scale(k, k); ctx.beginPath(); ctx.roundRect(-125, -40, 250, 80, 40); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.stroke(); txt(l, 0, 4, 34, OUT, 900); ctx.restore(); } });
      } },
    pend: { set: 'street', bright: 1, cast: { hero: { x: -200 } }, title: ['FOLLOW FOR MORE', '<span class="gold">FOOTBALL STORIES</span>'], titleSize: [80, 92], titleAt: 'follow',
      cam: [[0, ST], [1, { x: 0, y: 990, z: 1.32 }]],
      acts: { hero: [[0, { e: 'happy', p: 'waveR', m: { wave: 1 } }]] },
      draw2: (s, lt, d, t) => { lamp(-620); drawDog(130, 1400, 1.5, { tongue: true, wag: true }, t); window.drawJulesRimet(ctx, 330, 1400, 1.2, t); } }
  });


  // ---------- flat daylight style ("Why it sucks being a ...") ----------
  Object.assign(CH, {
    max:     { skin: '#f0c19a', shirt: '#2fbf71', trim: '#111', number: '1', pants: '#1f2236', shoes: '#111', hair: 'spiky', hairColor: '#4a2a14', gloves: '#ff8c1a', bw: 1, blinkPh: .4 },
    kidR:    { skin: '#ffd9b8', shirt: '#e8364f', trim: '#fff', number: '9', pants: '#fff', shoes: '#111', hair: 'short', hairColor: '#c9a46a', bw: .95, blinkPh: 1.1 },
    kidY:    { skin: '#8a5a3c', shirt: '#ffd400', trim: '#111', number: '10', pants: '#111', shoes: '#111', hair: 'buzz', hairColor: '#120a05', bw: .95, blinkPh: 2.0 },
    kidB:    { skin: '#e8b08a', shirt: '#1f6fe0', trim: '#fff', number: '7', pants: '#fff', shoes: '#111', hair: 'slick', hairColor: '#2a1a10', bw: .95, blinkPh: .7 },
    coach:   { skin: '#e8b08a', shirt: '#1c2c5b', trim: '#ffd400', pants: '#1c2c5b', shoes: '#111', hair: 'cap', capColor: '#1c2c5b', hairColor: '#3a2414', stubble: true, bw: 1.2, blinkPh: 1.6 },
    dad:     { skin: '#f0c19a', shirt: '#5a6a8a', trim: '#fff', pants: '#2b2f4a', shoes: '#111', hair: 'short', hairColor: '#4a2a14', beard: false, stubble: true, bw: 1.1, blinkPh: 2.4 },
    striker: Object.assign({}, CH.striker || {}, { skin: '#ffd9b8', shirt: '#1f6fe0', trim: '#fff', number: '9', pants: '#fff', shoes: '#111', hair: 'slick', hairColor: '#e0c060', bw: 1, blinkPh: 2.2 }),
    opp:     { skin: '#c98d63', shirt: '#e8364f', trim: '#fff', number: '11', pants: '#e8364f', shoes: '#111', hair: 'buzz', hairColor: '#120a05', bw: 1, blinkPh: 1.3 }
  });
  const R7 = (seed) => { let x = seed; return () => (x = (x * 16807) % 2147483647) / 2147483647; };
  function skyDay(t) {
    const g = ctx.createLinearGradient(0, 0, 0, 1100); g.addColorStop(0, '#4fbaf5'); g.addColorStop(1, '#bfe8ff'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.beginPath(); ctx.arc(900, 330, 70, 0, Math.PI * 2); ctx.fillStyle = '#ffe14d'; ctx.fill();
    ctx.fillStyle = '#fff';
    [[120, 250, 1], [520, 180, 1.2], [760, 420, .9], [300, 520, .8]].forEach(([x, y, k], i) => { const xx = ((x + t * 12 * (1 + i * .3)) % 1300) - 100; ctx.save(); ctx.translate(xx, y); ctx.scale(k, k); for (const [cx, cy, r] of [[0, 0, 40], [45, -18, 50], [95, 0, 40], [48, 14, 42]]) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); });
  }
  function stripes(top, c1, c2) {
    ctx.fillStyle = c1; ctx.fillRect(0, top, W, H - top);
    ctx.fillStyle = c2; for (let i = 0; i < 12; i++) { ctx.beginPath(); const x0 = i * 180 - 540, x1 = x0 + 90; ctx.moveTo(540 + (x0 - 540) * .35, top); ctx.lineTo(540 + (x1 - 540) * .35, top); ctx.lineTo(540 + (x1 - 540) * 2.2, H); ctx.lineTo(540 + (x0 - 540) * 2.2, H); ctx.closePath(); ctx.fill(); }
  }
  function bgPark(t) {
    skyDay(t);
    ctx.fillStyle = '#7fd36a'; ctx.fillRect(0, 900, W, 140);
    const r = R7(5); for (let x = -40; x < W + 60; x += 70) { const h = 70 + r() * 50; ctx.fillStyle = '#5b3a24'; ctx.fillRect(x - 6, 920 - 10, 12, 40); ctx.beginPath(); ctx.arc(x, 900 - h * .3, h * .55, 0, Math.PI * 2); ctx.fillStyle = r() < .5 ? '#3f9a46' : '#358a3d'; ctx.fill(); }
    ctx.fillStyle = '#e8f5e0'; ctx.fillRect(0, 1036, W, 6);
    stripes(1040, '#4caf50', '#43a047');
  }
  function crowdBand(top, bot, night) {
    ctx.fillStyle = night ? '#141a36' : '#2b3a6b'; ctx.fillRect(0, top, W, bot - top);
    const r = R7(11), pal = night ? ['#3a4a8a', '#6a7ab0', '#8a3040', '#c9c9d9'] : ['#e8364f', '#1f6fe0', '#ffd400', '#ffffff', '#ff8c1a', '#2fbf71'];
    for (let y = top + 18; y < bot - 10; y += 26) for (let x = (y / 26 % 2) * 11; x < W; x += 22) { ctx.fillStyle = pal[Math.floor(r() * pal.length)]; ctx.fillRect(x, y, 14, 16); ctx.fillStyle = night ? '#8a7a6a' : '#f0c19a'; ctx.beginPath(); ctx.arc(x + 7, y - 4, 6, 0, Math.PI * 2); ctx.fill(); }
  }
  function adStrip(y) {
    ctx.fillStyle = '#1c2238'; ctx.fillRect(0, y, W, 56);
    for (let x = 0; x < W; x += 360) { ctx.fillStyle = '#ffd400'; ctx.fillRect(x + 10, y + 8, 160, 40); txt('FOOTBALLPAGE', x + 90, y + 29, 22, '#1c2238', 900); txt('FOOTBALLPAGE', x + 270, y + 29, 22, '#ffffff', 900); }
  }
  function bgStadium(t, night) {
    if (night) { const g = ctx.createLinearGradient(0, 0, 0, 600); g.addColorStop(0, '#060a1e'); g.addColorStop(1, '#16204a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (const x of [140, 940]) { ctx.fillStyle = '#2b2f3a'; ctx.fillRect(x - 6, 260, 12, 300); ctx.fillStyle = '#fff8d0'; ctx.fillRect(x - 70, 220, 140, 50); ctx.save(); ctx.globalAlpha = .12; ctx.beginPath(); ctx.moveTo(x - 70, 270); ctx.lineTo(x - 300, 1500); ctx.lineTo(x + 300, 1500); ctx.lineTo(x + 70, 270); ctx.fillStyle = '#fff8d0'; ctx.fill(); ctx.restore(); }
    } else skyDay(t);
    crowdBand(720, 1100, night); adStrip(1100);
    stripes(1156, night ? '#2e8f45' : '#4caf50', night ? '#29803e' : '#43a047');
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(0, 1180, W, 5);
  }
  function bgCar(t) {
    const g = ctx.createLinearGradient(0, 0, 0, 1300); g.addColorStop(0, '#ff9a5a'); g.addColorStop(1, '#ffd08a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#c96a5a'; [[60, 760, 140], [220, 700, 120], [360, 800, 160], [560, 720, 130], [720, 780, 150], [900, 690, 140]].forEach(([x, y, w]) => ctx.fillRect(x, y, w, 1300 - y));
    ctx.fillStyle = '#4a4f62'; ctx.fillRect(0, 1300, W, H - 1300);
    ctx.fillStyle = '#ffffff'; for (let x = -((t * 400) % 200); x < W; x += 200) ctx.fillRect(x, 1560, 100, 14);
  }
  function car(x, y) {
    ctx.save(); ctx.translate(x, y); ctx.lineWidth = 8; ctx.strokeStyle = OUT; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-400, 120); ctx.lineTo(-400, -20); ctx.quadraticCurveTo(-380, -60, -300, -70); ctx.lineTo(-230, -230); ctx.quadraticCurveTo(-215, -260, -170, -260); ctx.lineTo(230, -260); ctx.quadraticCurveTo(270, -260, 290, -220); ctx.lineTo(340, -70); ctx.quadraticCurveTo(400, -60, 400, 0); ctx.lineTo(400, 120); ctx.closePath();
    const bodyPath = new Path2D(); bodyPath.moveTo(-400, 120); bodyPath.lineTo(-400, -60); bodyPath.lineTo(400, -60); bodyPath.lineTo(400, 120); bodyPath.closePath();
    ctx.fillStyle = '#2f6fd6'; ctx.fill(bodyPath);
    ctx.beginPath(); ctx.moveTo(-300, -70); ctx.lineTo(-230, -230); ctx.quadraticCurveTo(-215, -260, -170, -260); ctx.lineTo(230, -260); ctx.quadraticCurveTo(270, -260, 290, -220); ctx.lineTo(340, -70); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, -255); ctx.lineTo(10, -65); ctx.lineWidth = 14; ctx.stroke(); ctx.lineWidth = 8;
    ctx.beginPath(); ctx.roundRect(-400, -70, 800, 190, 40); ctx.fillStyle = '#2f6fd6'; ctx.fill(); ctx.stroke();
    for (const wx of [-240, 240]) { ctx.beginPath(); ctx.arc(wx, 120, 70, 0, Math.PI * 2); ctx.fillStyle = '#2b2f3a'; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(wx, 120, 28, 0, Math.PI * 2); ctx.fillStyle = '#c9ced8'; ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
  function bgDark(t) {
    ctx.fillStyle = '#05060f'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = .28; ctx.beginPath(); ctx.moveTo(470, 0); ctx.lineTo(610, 0); ctx.lineTo(860, 1550); ctx.lineTo(220, 1550); ctx.closePath(); ctx.fillStyle = '#ffe9a8'; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.ellipse(540, 1490, 330, 60, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,233,168,.25)'; ctx.fill();
    [[110, 700], [230, 980], [130, 1250], [930, 760], [850, 1040], [960, 1300], [300, 520], [780, 500]].forEach(([x, y], i) => { const bl = ((t + i * .7) % 3.1) < .15 ? .1 : 1; for (const dx of [-16, 16]) { ctx.beginPath(); ctx.ellipse(x + dx, y, 12, 16 * bl, 0, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.beginPath(); ctx.arc(x + dx + 3, y + 2, 5 * bl, 0, Math.PI * 2); ctx.fillStyle = '#05060f'; ctx.fill(); } });
  }
  function bgPurple(t) {
    ctx.fillStyle = '#3b2a8a'; ctx.fillRect(0, 0, W, H);
    const r = R7(3); for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc(r() * W, r() * H, 6 + r() * 8, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,90,110,.6)'; ctx.fill(); }
  }
  function bubble(x, y, textv, k = 1, tailDx = -30) {
    if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.font = '900 40px Inter Display'; const w = ctx.measureText(textv).width + 50;
    ctx.beginPath(); ctx.roundRect(-w / 2, -50, w, 84, 24); ctx.moveTo(tailDx - 16, 32); ctx.lineTo(tailDx, 70); ctx.lineTo(tailDx + 18, 32);
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.stroke();
    txt(textv, 0, -6, 40, OUT, 900); ctx.restore();
  }
  function statCard(x, y, title, rows, k) {
    if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    const h = 90 + rows.length * 62;
    ctx.beginPath(); ctx.roundRect(-210, 0, 420, h, 22); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = OUT; ctx.stroke();
    txt(title, 0, 48, 36, OUT, 900);
    rows.forEach(([l, v, ok], i) => { const yy = 110 + i * 62; ctx.beginPath(); ctx.arc(-160, yy, 20, 0, Math.PI * 2); ctx.fillStyle = ok ? '#2fbf71' : '#e8364f'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke(); txt(ok ? '✓' : '✗', -160, yy + 2, 26, '#fff', 900); txt(l, -120, yy, 34, OUT, 800, 'left'); txt(String(v), 180, yy, 38, OUT, 900, 'right'); });
    ctx.restore();
  }
  function pill(x, y, textv, k, bg = '#ffd400', fg = OUT, size = 44) {
    if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.font = `900 ${size}px Inter Display`; const w = ctx.measureText(textv).width + 60;
    ctx.beginPath(); ctx.roundRect(-w / 2, -size * .9, w, size * 1.8, size * .9); ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = OUT; ctx.stroke(); txt(textv, 0, 3, size, fg, 900); ctx.restore();
  }
  function phone(x, y, k, comments, t) {
    if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.beginPath(); ctx.roundRect(-190, -330, 380, 660, 46); ctx.fillStyle = '#1b1035'; ctx.fill(); ctx.beginPath(); ctx.roundRect(-170, -300, 340, 600, 30); ctx.fillStyle = '#fff'; ctx.fill();
    txt('COMMENTS', 0, -260, 30, OUT, 900);
    comments.forEach(([u, c, at], i) => { if (t < at) return; const yy = -190 + i * 110; ctx.beginPath(); ctx.arc(-130, yy, 22, 0, Math.PI * 2); ctx.fillStyle = ['#e8364f', '#1f6fe0', '#ffd400', '#2fbf71'][i % 4]; ctx.fill(); txt(u, -96, yy - 16, 22, '#6b6b80', 700, 'left'); txt(c, -96, yy + 14, 28, OUT, 900, 'left'); });
    ctx.restore();
  }
  function headline(x, y, k, title, line) {
    if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(.06); ctx.scale(k, k);
    ctx.beginPath(); ctx.rect(-230, -300, 460, 600); ctx.fillStyle = '#f4efe2'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = OUT; ctx.stroke();
    txt('THE DAILY GOAL', 0, -250, 34, OUT, 900); ctx.fillStyle = OUT; ctx.fillRect(-200, -222, 400, 5);
    txt(title, 0, -160, title.length > 11 ? 50 : 62, '#c8102e', 900); txt(line, 0, -90, 30, OUT, 800);
    ctx.beginPath(); ctx.rect(-180, -40, 360, 260); ctx.fillStyle = '#cfd6e0'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
    ctx.restore();
  }
  function rain(t) { ctx.strokeStyle = 'rgba(200,220,255,.55)'; ctx.lineWidth = 3; const r = R7(9); for (let i = 0; i < 120; i++) { const x = r() * W, y = ((r() * H + t * 1400) % H); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 10, y + 36); ctx.stroke(); } }
  const FC = { x: 0, y: 900, z: 1 };
  const int3 = () => Math.round(1400 - 1.4 * 553 * .8);
  let CASTX = {};
  const castXNow = n => CASTX[n] != null ? CASTX[n] : 0;
  const kidPark = (age) => ({ 6: .62, 8: .7, 11: .8, 13: .86, 15: .94, 17: 1 })[age];
  const keeperGoal = (xL, xR, top) => { ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(xL, GROUND); ctx.lineTo(xL, top); ctx.lineTo(xR, top); ctx.lineTo(xR, GROUND); ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.6)'; for (let x = xL + 25; x < xR; x += 30) { ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, GROUND); ctx.stroke(); } for (let y = top + 25; y < GROUND; y += 30) { ctx.beginPath(); ctx.moveTo(xL, y); ctx.lineTo(xR, y); ctx.stroke(); } };
  Object.assign(SHOTS, {
    whook: { set: 'flat', flat: (t) => bgStadium(t, false), noCaption: false, titleFast: true, captionTop: 1235,
      title: ['WHY IT SUCKS BEING A', '<span class="box">GOALKEEPER</span>'], titleSize: [70, 104],
      cam: [[0, FC], [1, { x: 0, y: 900, z: 1.04 }]], cast: { striker: { x: 260, scale: .55, y: 1180 }, max: { x: -40, scale: 1 } },
      acts: { max: [[0, { e: 'despair', p: 'idle' }]], striker: [[0, { e: 'ecstatic', p: 'cheer', m: { jump: .5 } }]] } },
    wsix: { set: 'flat', flat: bgPark, age: 'AGE 6', captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { kidR: { x: -320, scale: .62 }, kidY: { x: -60, scale: .62 }, kidB: { x: 200, scale: .62 }, max: { x: 400, scale: .62 }, coach: { x: 420, scale: 1 } },
      move: { max: [[0, 420], ['coach', .62, 420], [1, -360]] },
      acts: { kidR: [[0, { e: 'ecstatic', p: 'cheer', m: { jump: .6 } }]], kidY: [[0, { e: 'happy', p: 'fistPumpR', handR: 'fist', m: { jump: .4 } }]], kidB: [[0, { e: 'ecstatic', p: 'cheer', m: { jump: .5 } }]],
              max: [[0, { e: 'neutral', p: 'idle', m: { walk: .5 } }], ['coach', .62, { e: 'surprised', m: { walk: 1, lookX: -1 } }]], coach: [[0, { e: 'neutral', p: 'crossed', m: { lookX: -1 } }], ['coach', .62, { e: 'focused', p: 'pointL', m: { lookX: -1 } }]] },
      extra: (lt, t) => { const k = eb(P(lt, .3, .6)); bubble(-320, 820, 'I SCORE!', k); bubble(-40, 760, 'ME! ME!', eb(P(lt, .5, .8))); bubble(220, 830, 'STRIKER!', eb(P(lt, .7, 1))); const c = cue('coach', .62); pill(210, 690, '⬅ GOALKEEPER', eb(P(lt, c + .3, c + .6)), '#fff'); }, castOrder: ['coach', 'kidR', 'kidY', 'kidB', 'max'], hideCast: { coach: [0, .55] } },
    weight: { set: 'flat', flat: bgPark, age: 'AGE 8', captionTop: 1235, bright: .9,
      cam: [[0, FC], [1, { x: 0, y: 920, z: 1.1 }]], cast: { max: { x: 0, scale: .7 } },
      acts: { max: [[0, { e: 'neutral', p: 'crossed', m: { tremble: .4 } }], [.5, { e: 'worried', p: 'crossed', m: { tremble: 1 } }]] },
      back: () => keeperGoal(-520, 520, 858),
      extra: (lt, t) => { pill(330, 720, '40:00', eb(P(lt, .2, .5)), '#fff'); const k = P(lt, .4, .7); if (k > 0) { ctx.save(); ctx.globalAlpha = .7 * (0.5 + .5 * Math.sin(t * 3)); ctx.beginPath(); ctx.arc(70, 990 - (t * 20 % 30), 22, 0, Math.PI * 2); ctx.arc(95, 975 - (t * 20 % 30), 16, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore(); } } },
    wcar: { set: 'flat', flat: bgCar, age: 'AFTER THE GAME', captionTop: 1650,
      cam: [[0, FC], [1, FC]], cast: { dad: { x: -150, scale: .5, y: 1380 }, max: { x: 190, scale: .42, y: 1360 } },
      acts: { dad: [[0, { e: 'happy', m: { lookX: 1 } }]], max: [[0, { e: 'neutral', m: { lookX: -1 } }], ['twice', .7, { e: 'despair', m: { lookX: 0 } }]] },
      front: (lt, t) => { car(20, 1330); bubble(-160, 800, 'DID YOU SAVE ANYTHING?', eb(P(lt, .2, .5)), 40); statCard(300, 400, 'YOUR GAME', [['TOUCHES', 2, false]], eb(P(lt, cue('twice', .7), cue('twice', .7) + .4))); } },
    weleven: { set: 'flat', flat: (t) => bgStadium(t, false), age: 'AGE 11', captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { max: { x: -300, scale: .8 }, opp: { x: 360, scale: .8 } },
      back: () => keeperGoal(-960, 360, 780),
      ball: () => { const D = CUR.duration; return saveSeq([D * .15, D * .3, D * .45]).ball.concat([[D * .58, 300, 1385], [D * .66, -360, 1150, 60], [D * .9, -400, 1385, 20]]); },
      acts: () => { const D = CUR.duration, sq = saveSeq([D * .15, D * .3, D * .45]); return { max: sq.acts.map(([tt, k]) => [tt / D, k]).concat([[.6, { e: 'shock', po: DIVE_R, m: { dy: -40 } }], [.75, { e: 'despair', p: 'handsOnHead', po: {}, m: { dy: 0 } }]]), opp: [[0, { e: 'focused', po: KICK, m: { lookX: -1 } }], [.7, { e: 'ecstatic', p: 'cheer', po: {}, m: { jump: .6 } }]] }; },
      extra: (lt, t) => { const D = CUR.duration, n = Math.min(10, Math.floor(P(lt, 0, D * .5) * 10.99)); statCard(260, 330, 'YOUR GAME', [['SAVES', n, true], ['RESULT', lt > D * .66 ? '0-1' : '0-0', lt <= D * .66]], 1); } },
    weyes: { set: 'flat', flat: bgDark, captionTop: 1650, cam: [[0, FC], [1, { x: 0, y: 930, z: 1.08 }]], cast: { max: { x: 0, scale: .8 } },
      acts: { max: [[0, { e: 'worried', p: 'nervous', m: { tremble: .4 } }]] }, extra: (lt) => pill(0, 640, 'EVERYONE LOOKS AT YOU', eb(P(lt, .2, .5)), '#e8364f', '#fff', 40) },
    wface: { set: 'flat', flat: (t) => bgStadium(t, false), age: 'AGE 13', captionTop: 1235,
      cam: [[0, FC], [1, { x: -120, y: 930, z: 1.15 }]], cast: { max: { x: -200, scale: .86 }, kidR: { x: 300, scale: .8 }, kidB: { x: 480, scale: .8 } },
      back: () => keeperGoal(-880, 480, 734),
      ball: () => { const f = cue('face', .45); return [[0, 330, 1385], [f - .35, 330, 1385], [f, -200, 1400 - 470 * .86, 30], [f + .5, 200, 1385, 140]]; },
      acts: () => { const f = cue('face', .45), D = CUR.duration; return { max: [[0, { e: 'focused', po: KP }], [f / D, { e: 'shock', squint: 1, po: { lean: -12 }, ex: { squint: 1 } }], [(f + .5) / D, { e: 'despair', p: 'idle', po: {}, m: { tremble: .4 } }]], kidR: [[0, { e: 'focused', po: KICK, m: { lookX: -1 } }], [(f + .4) / D, { e: 'laugh', p: 'bellyLaugh', po: {}, m: { laugh: 1 } }]], kidB: [[0, { e: 'neutral', m: { lookX: -1 } }], [(f + .45) / D, { e: 'laugh', p: 'pointL', m: { laugh: 1, lookX: -1 } }]] }; },
      extra: (lt, t) => { const f = cue('face', .45); impact(-200, 1400 - 465 * .86, t, lt > f ? eb(P(lt, f, f + .2)) * (1 - P(lt, f + .8, f + 1.1)) : 0); pill(-200, 720, 'IT COUNTS AS A SAVE ✓', eb(P(lt, f + .6, f + .9)), '#2fbf71', '#fff', 36); } },
    wrain: { set: 'flat', flat: (t) => { bgStadium(t, true); }, age: 'AGE 15', captionTop: 1235, bright: .8,
      cam: [[0, FC], [1, { x: 0, y: 900, z: 1.05 }]], cast: { kidR: { x: 300, scale: .5, y: 1200 }, kidY: { x: 430, scale: .5, y: 1200 }, kidB: { x: 360, scale: .5, y: 1190 }, max: { x: -180, scale: .94 } },
      acts: { kidR: [[0, { e: 'happy', m: { walk: 1 } }]], kidY: [[0, { e: 'happy', m: { walk: 1 } }]], kidB: [[0, { e: 'ecstatic', p: 'cheer' }]], max: [[0, { e: 'focused', po: { lA: 160, lE: 10, rA: 160, rE: 10 } }], [.5, { e: 'focused', po: DIVE_L, m: { dy: -40 } }], [.7, { e: 'focused', po: { lA: 160, lE: 10, rA: 160, rE: 10 }, m: { dy: 0 } }]] },
      back: () => keeperGoal(-900, 540, 672),
      extra: (lt, t) => { rain(t); pill(-260, 700, 'ALONE', eb(P(lt, cue('alone', .8), cue('alone', .8) + .3)), '#fff'); statCard(300, 330, 'CROSSES', [['CAUGHT', Math.floor(P(lt, 0, CUR.duration) * 30), true]], 1); } },
    wslip: { set: 'flat', flat: (t) => bgStadium(t, true), age: 'AGE 17', captionTop: 1235,
      cam: [[0, FC], [1, { x: -200, y: 930, z: 1.15 }]], cast: { max: { x: -300, scale: 1 }, opp: { x: 360, scale: .85 } },
      back: () => keeperGoal(-1000, 400, 625),
      ball: () => { const s1 = cue('slip', .65); return [[0, 400, 1385], [s1 - .9, 300, 1385], [s1, -300, 1385, 30], [s1 + .6, -460, 1385, 0]]; },
      acts: () => { const s1 = cue('slip', .65), D = CUR.duration; return { max: [[0, { e: 'confident', po: KP }], [(s1 - .3) / D, { e: 'focused', po: { lA: 60, lE: -40, rA: 60, rE: -40, lL: 20, rL: 20, lK: -30, rK: -30 } }], [s1 / D, { e: 'shock', po: { lA: 80, lE: 0, rA: 80, rE: 0 } }], [(s1 + .5) / D, { e: 'despair', p: 'handsOnHead', po: {} }]], opp: [[0, { e: 'neutral', m: { lookX: -1 } }], [(s1 + .5) / D, { e: 'ecstatic', p: 'cheer', m: { jump: .8 } }]] }; },
      extra: (lt, t) => { const s1 = cue('slip', .65); scoreboard(lt < s1 + .5 ? 'HOME 1 – 0 AWAY' : 'HOME 1 – 1 AWAY', "90:00"); if (lt > s1 + .5) pill(300, 900, 'GOAL!', eb(P(lt, s1 + .5, s1 + .8)), '#e8364f', '#fff', 56); } },
    wname: { set: 'flat', flat: bgPurple, captionTop: 1650, cam: [[0, STUDIO], [1, STUDIO]], cast: {},
      draw: (s, lt, d, t) => { pill(540, 300, 'NOW EVERYONE KNOWS YOUR NAME', eb(P(lt, .1, .4)), '#ffd400', OUT, 36); phone(330, 1000, eb(P(lt, .2, .5)), [['@fan_99', 'who is #1??', .5], ['@coach_k', 'bench him', 1.1], ['@ultra77', 'BUTTERFINGERS 😂', 1.7]], lt); headline(780, 1050, eb(P(lt, 1.2, 1.6)), 'BUTTERFINGERS!', 'Keeper drops it in 90th min'); } },
    whero: { set: 'flat', flat: (t) => bgStadium(t, false), captionTop: 1235, cam: [[0, FC], [1, FC]], cast: { striker: { x: 0, scale: 1 } },
      acts: { striker: [[0, { e: 'confident', p: 'hips' }], ['one', .55, { e: 'ecstatic', p: 'cheer', m: { jump: .7 } }]] },
      extra: (lt, t) => { statCard(0, 330, 'STRIKER', [['MISSES', Math.min(10, Math.floor(P(lt, .1, cue('one', .55)) * 10.99)), false], ['GOALS', lt > cue('one', .55) ? 1 : 0, true]], 1); pill(0, 810, 'HERO 🏆', eb(P(lt, cue('hero', .8), cue('hero', .8) + .35)), '#2fbf71', '#fff', 56); } },
    wvillain: { set: 'flat', flat: bgDark, captionTop: 1650, cam: [[0, FC], [1, { x: 0, y: 930, z: 1.08 }]], cast: { max: { x: 0, scale: 1 } },
      acts: { max: [[0, { e: 'neutral', p: 'idle' }], ['drop', .5, { e: 'despair', p: 'handsOnHead', m: { tremble: .3 } }]] },
      extra: (lt, t) => { statCard(0, 330, 'GOALKEEPER', [['SAVES', Math.min(10, Math.floor(P(lt, .1, cue('drop', .5)) * 10.99)), true], ['MISTAKES', lt > cue('drop', .5) ? 1 : 0, false]], 1); pill(0, 810, 'VILLAIN', eb(P(lt, cue('villain', .8), cue('villain', .8) + .35)), '#e8364f', '#fff', 56); } },
    wtag: { set: 'flat', flat: (t) => bgStadium(t, false), captionTop: 1235, conf: 0,
      cam: [[0, FC], [1, FC]], cast: { max: { x: -170, scale: 1 }, kidB: { x: 200, scale: 1 } },
      acts: { max: [[0, { e: 'surprised', m: { lookX: 1 } }], [.4, { e: 'happy', p: 'thumbsUpR', handR: 'thumb', m: { lookX: 1 } }]], kidB: [[0, { e: 'happy', p: 'takeR', m: { lookX: -1 } }]] },
      extra: (lt, t) => { pill(0, 520, '@ TAG YOUR GOALKEEPER', eb(P(lt, .1, .45)), '#ffd400', OUT, 50); bubble(240, 790, 'THANK YOU.', eb(P(lt, cue('thanks', .6), cue('thanks', .6) + .35)), -40); } }
  });


  // ---------- "Why it sucks being a defender" ----------
  Object.assign(CH, {
    leo:    { skin: '#c98d63', shirt: '#1f6fe0', trim: '#ffffff', number: '4', pants: '#ffffff', shoes: '#111', hair: 'buzz', hairColor: '#120a05', bw: 1.25, blinkPh: .5 },
    ref:    { skin: '#f0c19a', shirt: '#111111', trim: '#ffd400', pants: '#111111', shoes: '#111', hair: 'bald', hairColor: '#3a2414', bw: 1.1, blinkPh: 1.9 },
    winger: { skin: '#ffd9b8', shirt: '#e8364f', trim: '#fff', number: '7', pants: '#e8364f', shoes: '#111', hair: 'spiky', hairColor: '#e0c060', bw: .85, blinkPh: 2.6 }
  });
  const SLIDE = { lean: 62, lL: 75, lK: 0, rL: 10, rK: -60, lA: 120, lE: 20, rA: 40, rE: -30 };
  function speedLines(x, y, t, k) { if (k <= 0) return; ctx.save(); ctx.globalAlpha = k * .8; ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.lineCap = 'round'; for (let i = 0; i < 6; i++) { const yy = y - 420 + i * 70, l = 120 + ((i * 53 + t * 900) % 160); ctx.beginPath(); ctx.moveTo(x + 80, yy); ctx.lineTo(x + 80 + l, yy); ctx.stroke(); } ctx.restore(); }
  function viewsPhone(x, y, k, lt, t) {
    if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.beginPath(); ctx.roundRect(-210, -380, 420, 760, 50); ctx.fillStyle = '#1b1035'; ctx.fill(); ctx.beginPath(); ctx.roundRect(-188, -350, 376, 700, 34); ctx.fillStyle = '#0f0f14'; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.roundRect(-188, -350, 376, 470, 34); ctx.clip(); ctx.fillStyle = '#43a047'; ctx.fillRect(-190, -350, 380, 470);
    ctx.fillStyle = '#4caf50'; for (let i = -3; i < 4; i++) ctx.fillRect(i * 80, -350, 40, 470);
    const bx = -150 + ((lt * 260) % 300); ctx.beginPath(); ctx.arc(bx, 40, 16, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
    txt('NUTMEG 😂', 0, -270, 46, '#fff', 900, 'center', 10); ctx.restore();
    const v = Math.round(lerp(0, 10000000, Math.pow(P(lt, .4, cue('views', 1.4) + .6), 2)));
    txt('👁 ' + v.toLocaleString('en-US'), 0, 190, 44, '#fff', 900);
    txt('views', 0, 240, 28, 'rgba(255,255,255,.6)', 700);
    txt('"bro got cooked 💀"', 0, 310, 28, '#ffd400', 800);
    ctx.restore();
  }
  Object.assign(SHOTS, {
    dhook: { set: 'flat', flat: (t) => bgStadium(t, false), titleFast: true, captionTop: 1235,
      title: ['WHY IT SUCKS BEING A', '<span class="box">DEFENDER</span>'], titleSize: [70, 104],
      cam: [[0, FC], [1, { x: 0, y: 900, z: 1.04 }]], cast: { striker: { x: 270, scale: .55, y: 1180 }, leo: { x: -40, scale: 1 } },
      acts: { leo: [[0, { e: 'despair', p: 'crossed' }]], striker: [[0, { e: 'ecstatic', p: 'cheer', m: { jump: .5 } }]] } },
    dsix: { set: 'flat', flat: bgPark, age: 'AGE 6', captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { kidR: { x: -330, scale: .58 }, kidY: { x: -120, scale: .58 }, leo: { x: 120, scale: .8 }, coach: { x: 400, scale: 1 } },
      acts: { kidR: [[0, { e: 'happy', p: 'cheer', m: { jump: .4 } }]], kidY: [[0, { e: 'happy', p: 'idle', m: { dance: .5 } }]], leo: [[0, { e: 'neutral', m: { lookX: 1 } }], ['coach', .6, { e: 'surprised', m: { lookX: 1 } }]], coach: [[0, { e: 'neutral', p: 'crossed', m: { lookX: -1 } }], ['coach', .6, { e: 'focused', p: 'pointL', m: { lookX: -1 } }]] },
      extra: (lt, t) => { const c = cue('coach', .6); pill(130, 650, 'TALLEST KID', eb(P(lt, cue('tall', .35), cue('tall', .35) + .3)), '#fff', OUT, 38); bubble(170, 760, 'JUST STAND AT THE BACK!', eb(P(lt, c + .2, c + .5)), 200); } },
    dcorner: { set: 'flat', flat: (t) => bgStadium(t, false), age: 'AGE 9', captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { leo: { x: 300, scale: .8 } },
      move: { leo: [[0, 360], ['up', .3, -60], ['back', .72, -60], [1, 520]] },
      acts: { leo: [[0, { e: 'happy', m: { walk: 1, lookX: -1 } }], ['up', .32, { e: 'ecstatic', p: 'cheer', m: { walk: 0, lookX: 0 } }], ['never', .55, { e: 'surprised', p: 'idle', m: { lookX: 1 } }], ['back', .72, { e: 'despair', p: 'idle', m: { walk: 1, lookX: 1 } }]] },
      back: () => keeperGoal(-1000, -200, int3()),
      ball: () => { const n = cue('never', .5); return [[0, 1200, 1385], [n - 1.2, 1200, 1385], [n + .2, -900, 700, 500]]; },
      extra: (lt) => { const n = cue('never', .55); if (lt > n) txt('?', 30, 760, 140 * eb(P(lt, n, n + .3)), '#ffd400', 900, 'center', 14); } },
    dtackle: { set: 'flat', flat: (t) => bgStadium(t, false), age: 'AGE 12', captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { winger: { x: 260, scale: .86 }, leo: { x: -260, scale: .86 } },
      move: { leo: [[0, -320], ['slide', .35, 120]] },
      ball: () => { const sl = cue('slide', .35); return [[0, 160, 1385], [sl, 160, 1385], [sl + .5, -500, 1385, 60]]; },
      acts: () => { const sl = cue('slide', .35), D = CUR.duration; return { leo: [[0, { e: 'focused', m: { walk: 1 } }], [(sl - .2) / D, { e: 'focused', po: SLIDE, m: { walk: 0, dy: 40 } }], [(sl + 1) / D, { e: 'confident', p: 'hips', po: {}, m: { dy: 0 } }]], winger: [[0, { e: 'confident', m: { lookX: -1 } }], [(sl + .1) / D, { e: 'shock', p: 'handsOnHead' }]] }; },
      extra: (lt) => { const sl = cue('slide', .35); pill(-60, 650, 'CLEAN BALL ✓', eb(P(lt, sl + .5, sl + .8)), '#2fbf71', '#fff', 40); pill(-60, 800, '👏 0', eb(P(lt, cue('claps', .75), cue('claps', .75) + .3)), '#fff', OUT, 50); } },
    dshadow: { set: 'flat', flat: (t) => bgStadium(t, false), age: 'AGE 14', captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { opp: { x: 120, scale: .9 }, leo: { x: -200, scale: .92 }, ref: { x: 400, scale: .95 } },
      acts: () => { const f = cue('fall', .25), y = cue('yellow', .7), D = CUR.duration; return {
        opp: [[0, { e: 'focused', m: { walk: 1 } }], [f / D, { e: 'shock', p: 'faint', po: { lean: -75 }, m: { walk: 0 } }], [(f + .6) / D, { e: 'despair', p: 'faint', po: { lean: -88 } }]],
        leo: [[0, { e: 'focused', p: 'idle' }], [(f + .2) / D, { e: 'surprised', p: 'shrug' }], [y / D, { e: 'pleading', p: 'pleading' }]],
        ref: [[0, { e: 'neutral', m: { lookX: -1 } }], [cue('pen', .45) / D, { e: 'focused', p: 'pointL', m: { lookX: -1 } }], [y / D, { e: 'focused', p: 'holdCashUp', propR: 'yellow', m: { lookX: -1 } }]] }; },
      extra: (lt) => { const y = cue('yellow', .7); pill(400, 650, 'PENALTY!', eb(P(lt, cue('pen', .45), cue('pen', .45) + .3)), '#e8364f', '#fff', 46); bubble(-200, 760, "I DIDN'T TOUCH HIM!", eb(P(lt, y + .2, y + .5)), 30); } },
    dclean: { set: 'flat', flat: (t) => bgStadium(t, false), age: 'AGE 16', captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { leo: { x: -230, scale: .96 }, max: { x: 260, scale: .96 } },
      acts: { leo: [[0, { e: 'confident', p: 'hips' }], ['motm', .7, { e: 'despair', p: 'crossed' }]], max: [[0, { e: 'neutral' }], ['keeper', .88, { e: 'ecstatic', p: 'holdCashUp', propR: 'cup' }]] },
      extra: (lt, t) => { statCard(-230, 300, 'YOUR GAME', [['SHOTS FACED', 0, true], ['CLEAN SHEET', '✓', true]], eb(P(lt, .2, .5))); const m = cue('motm', .7); if (lt > m) { const k = eb(P(lt, m, m + .35)); ctx.save(); ctx.translate(260, 560); ctx.scale(k, k); ctx.beginPath(); ctx.roundRect(-170, -110, 340, 220, 22); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = OUT; ctx.stroke(); txt('MAN OF THE MATCH', 0, -60, 30, OUT, 900); txt(lt > cue('keeper', .88) ? 'THE GOALKEEPER' : '?', 0, 30, lt > cue('keeper', .88) ? 36 : 110, '#e8364f', 900); ctx.restore(); } } },
    dwinger: { set: 'flat', flat: (t) => bgStadium(t, true), age: 'AGE 17', captionTop: 1235,
      cam: [[0, FC], [1, { x: -80, y: 920, z: 1.1 }]], cast: { leo: { x: -100, scale: 1 }, winger: { x: 420, scale: .86 } },
      move: { winger: [[0, 520], ['blink', .55, 150], [1, -700]] },
      ball: () => { const b = cue('legs', .75); return [[0, 400, 1385], [b - .6, 60, 1385], [b, -100, 1390], [b + .5, -500, 1385]]; },
      acts: () => { const b = cue('legs', .75), D = CUR.duration; return { leo: [[0, { e: 'focused', po: KP, m: { lookX: 1 } }], [cue('blink', .55) / D, { e: 'neutral', ex: { eyeOpen: .1 }, po: KP }], [b / D, { e: 'shock', p: 'handsOnHead', po: { lL: 20, rL: 20 }, m: { lookX: -1 } }]], winger: [[0, { e: 'confident', m: { walk: 1, lookX: -1 } }], [(b + .2) / D, { e: 'wink', p: 'cheer', m: { walk: 1 } }]] }; },
      extra: (lt, t) => { const wx = castXNow('winger'); speedLines(wx, 1400, t, lt > .3 ? 1 : 0); pill(-100, 650, 'NUTMEGGED', eb(P(lt, cue('legs', .75) + .2, cue('legs', .75) + .5)), '#e8364f', '#fff', 46); } },
    dviews: { set: 'flat', flat: bgPurple, captionTop: 1700, cam: [[0, STUDIO], [1, STUDIO]], cast: {},
      draw: (s, lt, d, t) => { pill(540, 280, 'ONE NUTMEG', eb(P(lt, 0, .3)), '#ffd400', OUT, 44); viewsPhone(540, 960, 1.35 * eb(P(lt, .1, .4)), lt, t); } },
    dnothing: { set: 'flat', flat: (t) => bgStadium(t, false), captionTop: 1235, cam: [[0, FC], [1, FC]], cast: { leo: { x: 0, scale: 1 } },
      acts: { leo: [[0, { e: 'neutral', p: 'hips' }], ['nothing', .7, { e: 'neutral', p: 'shrug' }]] },
      extra: (lt) => { statCard(0, 280, 'YOUR SEASON', [['TACKLES', Math.round(lerp(0, 84, P(lt, .2, 1.6))), true], ['BLOCKS', Math.round(lerp(0, 37, P(lt, .4, 1.8))), true], ['CLEAN SHEETS', Math.round(lerp(0, 12, P(lt, .6, 2))), true]], 1); pill(0, 830, 'NOTHING HAPPENED', eb(P(lt, cue('nothing', .7), cue('nothing', .7) + .35)), '#fff', OUT, 44); } },
    dclap: { set: 'flat', flat: bgDark, captionTop: 1700, cam: [[0, FC], [1, { x: 0, y: 930, z: 1.08 }]], cast: { leo: { x: 0, scale: 1 } },
      acts: { leo: [[0, { e: 'neutral', p: 'idle' }], [.5, { e: 'despair', p: 'crossed' }]] }, extra: (lt) => pill(0, 640, '👏 0', eb(P(lt, .3, .6)), '#fff', OUT, 60) },
    dtag: { set: 'flat', flat: (t) => bgStadium(t, false), captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { leo: { x: -170, scale: 1 }, max: { x: 210, scale: .96 } },
      acts: { leo: [[0, { e: 'surprised', m: { lookX: 1 } }], [.45, { e: 'happy', p: 'thumbsUpR', handR: 'thumb', m: { lookX: 1 } }]], max: [[0, { e: 'happy', p: 'takeR', m: { lookX: -1 } }]] },
      extra: (lt) => { pill(0, 520, '@ TAG YOUR DEFENDER', eb(P(lt, .1, .45)), '#ffd400', OUT, 50); bubble(240, 790, 'WE SEE YOU.', eb(P(lt, cue('see', .6), cue('see', .6) + .35)), -40); } }
  });


  // ---------- "Why it sucks being a midfielder" ----------
  Object.assign(CH, {
    nico: { skin: '#e8b08a', shirt: '#7b3ff2', trim: '#ffffff', number: '8', pants: '#ffffff', shoes: '#111', hair: 'short', hairColor: '#2a1a10', bw: .95, blinkPh: .8 },
    nine: { skin: '#ffd9b8', shirt: '#7b3ff2', trim: '#ffffff', number: '9', pants: '#ffffff', shoes: '#111', hair: 'slick', hairColor: '#e0c060', bw: 1, blinkPh: 1.7 },
    mate: { skin: '#8a5a3c', shirt: '#7b3ff2', trim: '#ffffff', number: '5', pants: '#ffffff', shoes: '#111', hair: 'buzz', hairColor: '#120a05', bw: 1.05, blinkPh: 2.3 }
  });
  function highlightPhone(x, y, k, lt) {
    if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.beginPath(); ctx.roundRect(-210, -380, 420, 760, 50); ctx.fillStyle = '#1b1035'; ctx.fill(); ctx.beginPath(); ctx.roundRect(-188, -350, 376, 700, 34); ctx.fillStyle = '#0f0f14'; ctx.fill();
    txt('SEASON HIGHLIGHTS', 0, -300, 30, '#fff', 900);
    for (let i = 0; i < 5; i++) { const yy = -230 + i * 110; ctx.beginPath(); ctx.roundRect(-165, yy, 330, 92, 14); ctx.fillStyle = '#2b2f4a'; ctx.fill();
      ctx.beginPath(); ctx.roundRect(-155, yy + 10, 110, 72, 8); ctx.fillStyle = '#43a047'; ctx.fill(); txt('▶', -100, yy + 46, 30, '#fff', 900);
      txt('GOAL #9', 40, yy + 30, 28, '#fff', 900); txt('feat. 0 assists', 40, yy + 62, 20, 'rgba(255,255,255,.55)', 700); }
    ctx.restore();
  }
  Object.assign(SHOTS, {
    mhook: { set: 'flat', flat: (t) => bgStadium(t, false), titleFast: true, captionTop: 1235,
      title: ['WHY IT SUCKS BEING A', '<span class="box">MIDFIELDER</span>'], titleSize: [70, 104],
      cam: [[0, FC], [1, { x: 0, y: 900, z: 1.04 }]], cast: { nine: { x: 270, scale: .55, y: 1180 }, nico: { x: -40, scale: 1 } },
      acts: { nico: [[0, { e: 'despair', p: 'hips', m: { tremble: .2 } }]], nine: [[0, { e: 'ecstatic', p: 'cheer', m: { jump: .5 } }]] } },
    mseven: { set: 'flat', flat: bgPark, age: 'AGE 7', captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { nico: { x: -180, scale: .66 }, coach: { x: 330, scale: 1 } },
      move: { nico: [['run', .7, -180], [.8, 420], [.9, -420], [1, 300]] },
      acts: { nico: [[0, { e: 'neutral', m: { lookX: 1 } }], ['know', .45, { e: 'surprised', p: 'shrug', m: { lookX: 1 } }], ['run', .7, { e: 'focused', m: { walk: 1.2 } }]], coach: [[0, { e: 'confident', p: 'pointL', m: { lookX: -1 } }]] },
      extra: (lt) => { bubble(240, 760, '"BOX TO BOX!"', eb(P(lt, cue('box', .2), cue('box', .2) + .35)), 80); const k = eb(P(lt, cue('know', .45), cue('know', .45) + .3)); if (k > 0 && lt < cue('run', .7)) txt('?', -180, 860, 140 * k, '#ffd400', 900, 'center', 14); } },
    mten: { set: 'flat', flat: bgPark, age: 'AGE 10', captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { nico: { x: -220, scale: .74 }, nine: { x: 220, scale: .74 } },
      acts: { nico: [[0, { e: 'tense', ex: { sweat: 1, mouthOpen: .5 }, p: 'hips', m: { tremble: .3 } }]], nine: [[0, { e: 'confident', p: 'idle' }], ['drink', .65, { e: 'happy', p: 'holdCashUp', propR: 'bottle' }]] },
      extra: (lt) => { statCard(-220, 300, 'DISTANCE', [['YOU', Math.round(lerp(0, 12, P(lt, .2, cue('two', .4)))) + ' KM', true]], eb(P(lt, .1, .4))); statCard(220, 300, 'DISTANCE', [['STRIKER', lt > cue('two', .4) ? '2 KM' : '…', false]], eb(P(lt, cue('two', .4) - .2, cue('two', .4) + .2))); pill(220, 780, 'FIRST DRINK 💧', eb(P(lt, cue('drink', .65), cue('drink', .65) + .3)), '#fff', OUT, 36); } },
    mtwelve: { set: 'flat', flat: (t) => bgStadium(t, false), age: 'AGE 12', captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { mate: { x: -400, scale: .8 }, nico: { x: -100, scale: .86 }, nine: { x: 180, scale: .8 }, coach: { x: 420, scale: .92 } },
      ball: () => { const sw = cue('side', .6); return [[0, 60, 1385], [sw, 60, 1385], [sw + .6, -330, 1385]]; },
      acts: { mate: [[0, { e: 'neutral', p: 'idle' }]], nine: [[0, { e: 'neutral', p: 'crossed' }]], nico: [[0, { e: 'focused', m: { lookX: 0 } }], ['look', .3, { e: 'worried', m: { lookX: 1 } }], ['side', .6, { e: 'neutral', po: KICK, m: { lookX: -1 } }], ['side', .7, { e: 'despair', po: {} }]], coach: [[0, { e: 'neutral', m: { lookX: -1 } }], ['coach', .82, { e: 'angry', p: 'pointL', m: { lookX: -1 } }]] },
      extra: (lt) => { pill(0, 650, 'NOBODY MOVING', eb(P(lt, cue('look', .35), cue('look', .35) + .3)) * (1 - P(lt, cue('side', .6), cue('side', .6) + .2)), '#fff', OUT, 38); bubble(250, 760, 'BE MORE CREATIVE!', eb(P(lt, cue('coach', .82), cue('coach', .82) + .3)), 170); } },
    mkicked: { set: 'flat', flat: (t) => bgStadium(t, false), age: 'AGE 14', captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { nico: { x: -120, scale: .9 }, opp: { x: 180, scale: .9 }, ref: { x: 430, scale: .95 } },
      acts: () => { const D = CUR.duration, ks = [cue('k1', .25), cue('k2', .4), cue('k3', .52)]; const a = [[0, { e: 'focused', p: 'idle' }]]; ks.forEach(k => { a.push([k / D, { e: 'shock', p: 'faint', po: { lean: -70 } }], [(k + .45) / D, { e: 'angry', p: 'idle', po: {} }]); }); a.push([cue('ref', .8) / D, { e: 'pleading', p: 'pleading' }]);
        const o = [[0, { e: 'smirk', m: { lookX: -1 } }]]; ks.forEach(k => o.push([(k - .2) / D, { e: 'smirk', po: KICK }], [(k + .3) / D, { e: 'smirk', po: {} }]));
        return { nico: a, opp: o, ref: [[0, { e: 'neutral', p: 'crossed', m: { lookX: -1 } }], [cue('ref', .8) / D, { e: 'confident', p: 'waveR', m: { wave: 1, lookX: -1 } }]] }; },
      extra: (lt, t) => { [cue('k1', .25), cue('k2', .4), cue('k3', .52)].forEach(k => impact(-60, 1250, t, lt > k ? eb(P(lt, k, k + .15)) * (1 - P(lt, k + .35, k + .5)) * .7 : 0)); bubble(430, 760, 'PLAY ON!', eb(P(lt, cue('ref', .8), cue('ref', .8) + .3)), 0); } },
    mgoal: { set: 'flat', flat: (t) => bgStadium(t, false), age: 'AGE 16', captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { nico: { x: 300, scale: .86 }, max: { x: -760, scale: .8 }, mate: { x: -100, scale: .8 }, nine: { x: 120, scale: .8 } },
      back: () => keeperGoal(-1080, -380, int3()),
      ball: () => { const s1 = cue('shoot', .2); return [[0, 220, 1385], [s1, 220, 1385], [s1 + .7, -460, 830, 360], [s1 + 1.2, -500, 1385, 30]]; },
      acts: () => { const s1 = cue('shoot', .2), D = CUR.duration, pi = cue('pass', .62); return {
        nico: [[0, { e: 'focused', m: { lookX: -1 } }], [(s1 - .1) / D, { po: KICK }], [(s1 + .8) / D, { e: 'ecstatic', p: 'cheer', po: {}, m: { jump: .7 } }], [pi / D, { e: 'surprised', p: 'shrug', m: { jump: 0 } }]],
        mate: [[0, { e: 'neutral', m: { lookX: 1 } }], [(s1 + .8) / D, { e: 'ecstatic', p: 'cheer' }], [pi / D, { e: 'angry', p: 'pointR', m: { lookX: 1 } }]],
        nine: [[0, { e: 'neutral', m: { lookX: 1 } }], [(s1 + .8) / D, { e: 'surprised', p: 'cheer' }], [pi / D, { e: 'angry', p: 'pleading', m: { lookX: 1 } }]] }; },
      extra: (lt) => { const s1 = cue('shoot', .2); pill(-500, 650, 'TOP CORNER!', eb(P(lt, s1 + .7, s1 + 1)) * (1 - P(lt, cue('pass', .62) - .3, cue('pass', .62))), '#2fbf71', '#fff', 44); const pi = cue('pass', .62); bubble(-100, 800, 'PASS IT!', eb(P(lt, pi + .1, pi + .35)), 0); bubble(160, 730, 'PASS IT!!', eb(P(lt, pi + .25, pi + .5)), -40); } },
    massists: { set: 'flat', flat: bgPurple, age: 'AGE 17', captionTop: 1700, cam: [[0, STUDIO], [1, STUDIO]], cast: {},
      draw: (s, lt, d, t) => { statCard(540, 300, 'YOUR SEASON', [['ASSISTS', Math.round(lerp(0, 15, P(lt, .2, cue('hl', .45)))), true]], eb(P(lt, 0, .3))); highlightPhone(540, 1060, 1.3 * eb(P(lt, cue('hl', .45), cue('hl', .45) + .4)), lt); } },
    mthing: { set: 'flat', flat: (t) => bgStadium(t, false), captionTop: 1235, cam: [[0, FC], [1, FC]], cast: { mate: { x: -330, scale: .86 }, nico: { x: 0, scale: .9 }, nine: { x: 330, scale: .86 } },
      acts: { mate: [[0, { e: 'happy', p: 'pointR', m: { lookX: 1 } }], ['ball', .7, { e: 'focused', p: 'cheer', m: { jump: .4 } }]], nine: [[0, { e: 'happy', p: 'pointL', m: { lookX: -1 } }], ['ball', .7, { e: 'focused', p: 'cheer', m: { jump: .4 } }]], nico: [[0, { e: 'neutral', p: 'hips' }]] },
      extra: (lt) => { bubble(-330, 760, 'ME!', eb(P(lt, cue('ball', .7), cue('ball', .7) + .3)), 0); bubble(330, 760, 'TO ME!', eb(P(lt, cue('ball', .7) + .15, cue('ball', .7) + .45)), 0); } },
    mjob: { set: 'flat', flat: bgDark, captionTop: 1700, cam: [[0, FC], [1, { x: 0, y: 930, z: 1.08 }]], cast: { nico: { x: 0, scale: 1 } },
      acts: { nico: [[0, { e: 'tense', ex: { sweat: 1 }, p: 'hips', m: { tremble: .3 } }]] }, extra: (lt) => pill(0, 640, 'NOBODY WANTS YOUR JOB', eb(P(lt, .3, .6)), '#ffd400', OUT, 40) },
    mtag: { set: 'flat', flat: (t) => bgStadium(t, false), captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { nico: { x: -170, scale: 1 }, leo: { x: 220, scale: .96 } },
      acts: { nico: [[0, { e: 'tense', ex: { sweat: .8 }, m: { lookX: 1 } }], [.45, { e: 'happy', p: 'thumbsUpR', handR: 'thumb', m: { lookX: 1 } }]], leo: [[0, { e: 'happy', p: 'takeR', propR: 'bottle', m: { lookX: -1 } }]] },
      extra: (lt) => { pill(0, 520, '@ TAG YOUR MIDFIELDER', eb(P(lt, .1, .45)), '#ffd400', OUT, 50); bubble(240, 790, 'YOU EARNED THIS.', eb(P(lt, cue('ran', .6), cue('ran', .6) + .35)), -40); } }
  });


  // ---------- "Why it sucks being a striker" ----------
  Object.assign(CH, {
    rico: { skin: '#f0c19a', shirt: '#e8364f', trim: '#ffffff', number: '9', pants: '#ffffff', shoes: '#111', hair: 'spiky', hairColor: '#2a1a10', bw: .95, blinkPh: .2 },
    defA: { skin: '#c98d63', shirt: '#1f6fe0', trim: '#fff', number: '4', pants: '#fff', shoes: '#111', hair: 'buzz', hairColor: '#120a05', bw: 1.2, blinkPh: 1.0 },
    defB: { skin: '#ffd9b8', shirt: '#1f6fe0', trim: '#fff', number: '5', pants: '#fff', shoes: '#111', hair: 'short', hairColor: '#c9a46a', bw: 1.2, blinkPh: 1.6 },
    defC: { skin: '#e8b08a', shirt: '#1f6fe0', trim: '#fff', number: '6', pants: '#fff', shoes: '#111', hair: 'slick', hairColor: '#2a1a10', bw: 1.2, blinkPh: 2.4 },
    lino: { skin: '#f0c19a', shirt: '#ffd400', trim: '#111', pants: '#111', shoes: '#111', hair: 'bald', hairColor: '#3a2414', bw: 1.05, blinkPh: .9 }
  });
  function offsideFlag(x, y, k, t) {
    if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(-.15 + Math.sin(t * 10) * .08);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -260); ctx.lineWidth = 12; ctx.strokeStyle = OUT; ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = '#c9ced8'; ctx.stroke();
    ctx.beginPath(); ctx.rect(0, -260, 120, 90); ctx.fillStyle = '#ffd400'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.fillStyle = '#e8364f'; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2) ctx.fillRect(i * 30, -260 + j * 30, 30, 30);
    ctx.restore();
  }
  Object.assign(SHOTS, {
    shook: { set: 'flat', flat: (t) => bgStadium(t, false), titleFast: true, captionTop: 1235,
      title: ['WHY IT SUCKS BEING A', '<span class="box">STRIKER</span>'], titleSize: [70, 104],
      cam: [[0, FC], [1, { x: 0, y: 900, z: 1.04 }]], cast: { leo: { x: 280, scale: .58, y: 1180 }, rico: { x: -40, scale: 1 } },
      acts: { rico: [[0, { e: 'despair', p: 'handsOnHead' }]], leo: [[0, { e: 'smirk', p: 'crossed' }]] } },
    ssix: { set: 'flat', flat: bgPark, age: 'AGE 6', captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { kidR: { x: -330, scale: .6 }, rico: { x: 0, scale: .62 }, kidY: { x: 320, scale: .6 } },
      acts: { rico: [[0, { e: 'ecstatic', p: 'cheer', m: { jump: .6 } }]], kidR: [[0, { e: 'happy', p: 'cheer' }], ['love', .7, { e: 'ecstatic', p: 'cheer', m: { jump: .5 } }]], kidY: [[0, { e: 'happy', p: 'cheer' }], ['love', .7, { e: 'ecstatic', p: 'cheer', m: { jump: .5 } }]] },
      extra: (lt) => { statCard(0, 300, 'TODAY', [['GOALS', Math.round(lerp(0, 10, P(lt, .2, cue('ten', .5)))), true]], eb(P(lt, .1, .4))); if (lt > cue('love', .7)) ['❤️', '❤️', '❤️'].forEach((h, i) => txt(h, -200 + i * 200, 760 - ((lt * 120 + i * 40) % 140), 70, '#e8364f', 900)); } },
    snine: { set: 'flat', flat: (t) => bgStadium(t, false), age: 'AGE 9', captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { defA: { x: -330, scale: .8 }, rico: { x: 0, scale: .72 }, defB: { x: 300, scale: .8 }, defC: { x: 120, scale: .82 } },
      move: { rico: [['three', .4, 0], [1, -160]], defA: [['three', .4, -330], [1, -400]], defB: [['three', .4, 300], [1, 140]], defC: [['three', .4, 520], [1, 0]] },
      acts: { rico: [[0, { e: 'happy' }], ['three', .45, { e: 'worried', p: 'nervous', m: { walk: .6 } }]], defA: [[0, { e: 'focused', po: KP, m: { lookX: 1 } }], ['three', .4, { e: 'focused', po: KP, m: { walk: .6, lookX: 1 } }]], defB: [[0, { e: 'focused', po: KP, m: { lookX: -1 } }], ['three', .4, { e: 'focused', po: KP, m: { walk: .6, lookX: -1 } }]], defC: [[0, { e: 'smirk', po: KP, m: { lookX: -1 } }], ['three', .4, { e: 'smirk', po: KP, m: { walk: .6, lookX: -1 } }]] },
      extra: (lt) => pill(0, 650, '3 DEFENDERS ON YOU', eb(P(lt, cue('three', .4) + .3, cue('three', .4) + .6)), '#e8364f', '#fff', 40) },
    scar: { set: 'flat', flat: bgCar, age: 'AGE 11', captionTop: 1650,
      cam: [[0, FC], [1, FC]], cast: { dad: { x: -150, scale: .5, y: 1380 }, rico: { x: 190, scale: .42, y: 1360 } },
      acts: { dad: [[0, { e: 'happy', m: { lookX: 1 } }], ['dad', .6, { e: 'focused', p: 'pointR', ex: { mouthOpen: .4 }, m: { lookX: 1 } }]], rico: [[0, { e: 'happy', m: { lookX: -1 } }], ['dad', .65, { e: 'despair', m: { lookX: 0 } }]] },
      front: (lt) => { car(20, 1330); statCard(260, 300, 'YOUR GAME', [['GOALS', 2, true], ['EASY MISSES', lt > cue('miss', .3) ? 1 : 0, false]], eb(P(lt, .1, .4))); bubble(-160, 800, 'WHY DID YOU MISS THAT ONE?', eb(P(lt, cue('dad', .6), cue('dad', .6) + .35)), 40); } },
    snopass: { set: 'flat', flat: (t) => bgStadium(t, false), age: 'AGE 13', captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { rico: { x: 300, scale: .86 }, nico: { x: -150, scale: .82 }, coach: { x: -400, scale: .9 } },
      ball: () => [[0, -200, 1385], [CUR.duration * .3, -320, 1385], [CUR.duration * .55, -120, 1385]],
      acts: { rico: [[0, { e: 'happy', p: 'waveR', m: { wave: 1, lookX: -1 } }], ['once', .45, { e: 'despair', p: 'pleading', m: { lookX: -1 } }], ['coach', .75, { e: 'shock', p: 'idle' }]], nico: [[0, { e: 'focused', m: { lookX: -1 } }]], coach: [[0, { e: 'neutral', m: { lookX: 1 } }], ['coach', .75, { e: 'angry', p: 'pointR', m: { lookX: 1 } }]] },
      extra: (lt) => { pill(300, 650, 'TOUCHES: 0', eb(P(lt, cue('once', .45), cue('once', .45) + .3)), '#fff', OUT, 40); bubble(-180, 760, "WHY AREN'T YOU INVOLVED?", eb(P(lt, cue('coach', .75), cue('coach', .75) + .3)), -220); pill(380, 420, '80:00', eb(P(lt, .2, .5)), '#fff', OUT, 40); } },
    spen: { set: 'flat', flat: (t) => bgStadium(t, true), age: 'AGE 15', captionTop: 1235,
      cam: [[0, FC], [.7, { x: -150, y: 920, z: 1.1 }], [1, { x: -150, y: 920, z: 1.12 }]], cast: { max: { x: -330, scale: .82 }, rico: { x: 250, scale: .9 } },
      back: () => keeperGoal(-900, 240, int3()),
      ball: () => { const k = cue('bar', .7); return [[0, 60, 1385], [k - .6, 60, 1385], [k, -330, int3() + 8, 200], [k + .6, 200, 1385, 300]]; },
      acts: () => { const k = cue('bar', .7), D = CUR.duration; return { rico: [[0, { e: 'tense', ex: { sweat: .8 }, m: { lookX: -1 } }], [(k - .7) / D, { e: 'focused', po: KICK }], [(k + .2) / D, { e: 'shock', p: 'handsOnHead', po: {} }]], max: [[0, { e: 'focused', po: KP, m: { lookX: 1 } }], [(k - .3) / D, { e: 'focused', po: DIVE_L, m: { dy: -40 } }], [(k + .5) / D, { e: 'ecstatic', p: 'cheer', po: {}, m: { dy: 0 } }]] }; },
      extra: (lt, t) => { const k = cue('bar', .7); scoreboard('HOME 0 – 0 AWAY', "90+3'"); impact(-330, int3(), t, lt > k ? eb(P(lt, k, k + .15)) * (1 - P(lt, k + .5, k + .7)) : 0); pill(-330, 760, 'CROSSBAR!', eb(P(lt, k + .1, k + .4)), '#e8364f', '#fff', 46); } },
    shat: { set: 'flat', flat: bgPurple, age: 'AGE 16', captionTop: 1700, cam: [[0, STUDIO], [1, STUDIO]], cast: {},
      draw: (s, lt, d, t) => { const n = cue('next', .4); pill(540, 300, lt < n ? 'HAT-TRICK! ⚽⚽⚽' : 'NEXT WEEK: 0 GOALS', 1, lt < n ? '#2fbf71' : '#e8364f', '#fff', 46); if (lt < n) { for (let i = 0; i < 3; i++) { const k = eb(P(lt, .2 + i * .25, .5 + i * .25)); if (k > 0) drawBall(330 + i * 210, 980, 0, 1, k * 2.4); } ctx.save(); ctx.translate(540, 1250); const kk = eb(P(lt, .9, 1.2)); ctx.scale(kk, kk); txt('3 GOALS', 0, 0, 110, '#ffd400', 900, 'center', 14); ctx.restore(); }
        phone(540, 1000, eb(P(lt, n, n + .4)), [['@fan_99', 'flop 😴', cue('flop', .6)], ['@coach_k', 'bench him', cue('flop', .6) + .6], ['@ultra77', 'SELL HIM', cue('flop', .6) + 1.2]], lt); } },
    soffside: { set: 'flat', flat: (t) => bgStadium(t, true), age: 'AGE 17', captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { rico: { x: -100, scale: .96 }, lino: { x: 420, scale: .9 } },
      move: { rico: [['run', .35, -100], ['off', .8, 160]] },
      acts: { rico: [[0, { e: 'ecstatic', p: 'cheer', m: { jump: .6 } }], ['run', .35, { e: 'ecstatic', p: 'cheer', m: { walk: 1 } }], ['off', .8, { e: 'despair', p: 'handsOnHead', m: { walk: 0 } }]], lino: [[0, { e: 'neutral', m: { lookX: -1 } }], ['off', .78, { e: 'focused', p: 'holdCashUp', m: { lookX: -1 } }]] },
      extra: (lt, t) => { const o = cue('off', .8); scoreboard(lt < o ? 'HOME 1 – 0 AWAY' : 'HOME 0 – 0 AWAY', "90+5'"); pill(0, 850, 'WINNER!', eb(P(lt, .1, .4)) * (1 - P(lt, o - .2, o)), '#2fbf71', '#fff', 50); offsideFlag(455, 1400 - 420 * .9, lt > o ? eb(P(lt, o, o + .3)) : 0, t); pill(160, 650, 'OFFSIDE', eb(P(lt, o + .1, o + .4)), '#e8364f', '#fff', 56); } },
    sthing: { set: 'flat', flat: (t) => bgStadium(t, false), captionTop: 1235, cam: [[0, FC], [1, FC]], cast: { leo: { x: -330, scale: .9 }, rico: { x: 0, scale: .92 }, nico: { x: 330, scale: .9 } },
      acts: { leo: [[0, { e: 'happy', p: 'hips' }]], nico: [[0, { e: 'happy', p: 'hips' }]], rico: [[0, { e: 'neutral', p: 'idle' }]] },
      extra: (lt) => { pill(-330, 700, '90 MIN', eb(P(lt, cue('ninety', .7), cue('ninety', .7) + .3)), '#fff', OUT, 40); pill(330, 700, '90 MIN', eb(P(lt, cue('ninety', .7) + .1, cue('ninety', .7) + .4)), '#fff', OUT, 40); } },
    ssecond: { set: 'flat', flat: bgDark, captionTop: 1700, cam: [[0, FC], [1, { x: 0, y: 930, z: 1.08 }]], cast: { rico: { x: 0, scale: 1 } },
      acts: { rico: [[0, { e: 'worried', p: 'nervous', m: { tremble: .3 } }]] }, extra: (lt) => pill(0, 640, '1 SECOND', eb(P(lt, .3, .6)), '#e8364f', '#fff', 60) },
    stag: { set: 'flat', flat: (t) => bgStadium(t, false), captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { rico: { x: -170, scale: 1 }, nico: { x: 220, scale: .96 } },
      acts: { rico: [[0, { e: 'worried', m: { lookX: 1 } }], [.45, { e: 'happy', p: 'thumbsUpR', handR: 'thumb', m: { lookX: 1 } }]], nico: [[0, { e: 'happy', p: 'takeR', m: { lookX: -1 } }]] },
      extra: (lt) => { pill(0, 520, '@ TAG YOUR STRIKER', eb(P(lt, .1, .45)), '#ffd400', OUT, 50); bubble(240, 790, 'NEXT ONE GOES IN.', eb(P(lt, cue('next', .6), cue('next', .6) + .35)), -40); } }
  });


  // ---------- "Why it sucks being the captain" ----------
  Object.assign(CH, {
    theo: { skin: '#ffd2b0', shirt: '#0f8a5c', trim: '#ffffff', number: '6', pants: '#ffffff', shoes: '#111', hair: 'slick', hairColor: '#6a4a2a', bw: 1.05, blinkPh: .6, armband: true },
    tA: { skin: '#c98d63', shirt: '#0f8a5c', trim: '#fff', number: '11', pants: '#fff', shoes: '#111', hair: 'buzz', hairColor: '#120a05', bw: .95, blinkPh: 1.2 },
    tB: { skin: '#ffd9b8', shirt: '#0f8a5c', trim: '#fff', number: '7', pants: '#fff', shoes: '#111', hair: 'spiky', hairColor: '#c9a46a', bw: .95, blinkPh: 2.0 },
    tC: { skin: '#e8b08a', shirt: '#0f8a5c', trim: '#fff', number: '9', pants: '#fff', shoes: '#111', hair: 'short', hairColor: '#2a1a10', bw: 1, blinkPh: 2.6 },
    oppCap: { skin: '#e8b08a', shirt: '#e8364f', trim: '#fff', number: '4', pants: '#e8364f', shoes: '#111', hair: 'short', hairColor: '#2a1a10', bw: 1.05, blinkPh: 1.8, armband: true }
  });
  function cones(x, y) { for (let i = 0; i < 5; i++) { const cx = x + i * 70 - (i % 2) * 20, cy = y - i * 6; ctx.beginPath(); ctx.moveTo(cx - 26, cy); ctx.lineTo(cx, cy - 46); ctx.lineTo(cx + 26, cy); ctx.closePath(); ctx.fillStyle = '#ff8c1a'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke(); } }
  function ballBag(x, y) { ctx.beginPath(); ctx.ellipse(x, y - 70, 80, 90, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(30,40,70,.85)'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.stroke(); for (const [dx, dy] of [[-30, -70], [25, -95], [10, -40]]) drawBall(x + dx, y + dy, 0, 1, .9); }
  const TEAM = { tA: { x: -360, scale: .86 }, tB: { x: 360, scale: .86 } };
  Object.assign(SHOTS, {
    chook: { set: 'flat', flat: (t) => bgStadium(t, false), titleFast: true, captionTop: 1235,
      title: ['WHY IT SUCKS BEING THE', '<span class="box">CAPTAIN</span>'], titleSize: [66, 104],
      cam: [[0, FC], [1, { x: 0, y: 900, z: 1.04 }]], cast: { rico: { x: 280, scale: .58, y: 1180 }, theo: { x: -40, scale: 1 } },
      acts: { theo: [[0, { e: 'despair', p: 'crossed' }]], rico: [[0, { e: 'ecstatic', p: 'cheer', m: { jump: .5 } }]] } },
    ceight: { set: 'flat', flat: bgPark, age: 'AGE 8', captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { coach: { x: -360, scale: 1 }, theo: { x: -60, scale: .66 }, ref: { x: 200, scale: .95 }, oppCap: { x: 420, scale: .66 } },
      acts: { coach: [[0, { e: 'happy', p: 'giveL', propL: 'armband', m: { lookX: 1 } }], ['honour', .3, { e: 'happy', p: 'thumbsUpR', handR: 'thumb' }]],
              theo: [[0, { e: 'surprised', m: { lookX: -1 } }], ['honour', .3, { e: 'ecstatic', p: 'cheer', m: { jump: .4 } }], ['toss', .6, { e: 'focused', p: 'idle', m: { lookX: 1 } }], ['lose', .85, { e: 'despair', p: 'idle', m: { lookX: 1 } }]],
              ref: [[0, { e: 'neutral', p: 'crossed', m: { lookX: -1 } }], ['toss', .6, { e: 'neutral', p: 'idle', propR: 'coin' }], ['lose', .85, { e: 'neutral', p: 'pointR', propR: null, m: { lookX: 1 } }]],
              oppCap: [[0, { e: 'neutral', m: { lookX: -1 } }], ['lose', .85, { e: 'ecstatic', p: 'fistPumpR', handR: 'fist' }]] },
      extra: (lt) => { pill(-60, 680, 'AN HONOUR? ✨', eb(P(lt, cue('honour', .3), cue('honour', .3) + .3)) * (1 - P(lt, cue('toss', .6) - .2, cue('toss', .6))), '#fff', OUT, 40); pill(200, 650, 'COIN TOSS: LOST', eb(P(lt, cue('lose', .85), cue('lose', .85) + .3)), '#e8364f', '#fff', 40); } },
    celeven: { set: 'flat', flat: (t) => bgStadium(t, false), age: 'AGE 11', captionTop: 1235, bright: .85,
      cam: [[0, FC], [.6, FC], [1, { x: 0, y: 960, z: 1.25 }]], cast: { tA: { x: -360, scale: .82 }, coach: { x: -120, scale: .95 }, theo: { x: 140, scale: .84 }, tB: { x: 380, scale: .82 } },
      acts: { coach: [[0, { e: 'despair', p: 'handsOnHead' }], ['say', .4, { e: 'focused', p: 'pointR', m: { lookX: 1 } }]], theo: [[0, { e: 'despair' }], ['stare', .78, { e: 'nervous', p: 'nervous', m: { tremble: .5 } }]], tA: [[0, { e: 'despair', p: 'crossed' }], ['stare', .78, { e: 'neutral', m: { lookX: 1 } }]], tB: [[0, { e: 'despair', p: 'crossed' }], ['stare', .78, { e: 'neutral', m: { lookX: -1 } }]] },
      extra: (lt) => { scoreboard('HOME 0 – 5 AWAY', 'HALF-TIME'); bubble(-60, 760, 'CAPTAIN, SAY SOMETHING.', eb(P(lt, cue('say', .4), cue('say', .4) + .3)), -60); } },
    cthirteen: { set: 'flat', flat: (t) => bgStadium(t, false), age: 'AGE 13', captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { tC: { x: -320, scale: .86 }, ref: { x: 60, scale: .95 }, theo: { x: 360, scale: .88 } },
      move: { theo: [['come', .5, 360], ['card', .8, 230]] },
      acts: { tC: [[0, { e: 'angry', p: 'pointR', ex: { mouthOpen: .7 }, m: { lookX: 1, tremble: .5 } }], ['card', .8, { e: 'smirk', p: 'crossed' }]],
              ref: [[0, { e: 'neutral', m: { lookX: -1 } }], ['come', .5, { e: 'angry', p: 'pointR', m: { lookX: 1 } }], ['card', .8, { e: 'focused', p: 'holdCashUp', propR: 'yellow', m: { lookX: 1 } }]],
              theo: [[0, { e: 'worried', m: { lookX: -1 } }], ['come', .5, { e: 'surprised', m: { walk: .7, lookX: -1 } }], ['card', .8, { e: 'despair', p: 'idle', m: { walk: 0 } }]] },
      extra: (lt) => { bubble(-180, 760, 'REF!! NEVER A FOUL!', eb(P(lt, .2, .5)) * (1 - P(lt, cue('come', .5) - .1, cue('come', .5))), 0); bubble(60, 760, 'CAPTAIN! COME HERE.', eb(P(lt, cue('come', .5), cue('come', .5) + .3)), -40); } },
    cfifteen: { set: 'flat', flat: (t) => bgStadium(t, true), age: 'AGE 15', captionTop: 1235, bright: .8,
      cam: [[0, FC], [1, { x: 0, y: 920, z: 1.1 }]], cast: { theo: { x: 0, scale: .92 }, tA: { x: 380, scale: .55, y: 1200 }, tB: { x: 470, scale: .55, y: 1200 } },
      move: { tA: [[0, 380], ['home', .35, 900]], tB: [[0, 470], ['home', .35, 1000]] },
      acts: { tA: [[0, { e: 'happy', m: { walk: 1 } }]], tB: [[0, { e: 'happy', m: { walk: 1 } }]], theo: [[0, { e: 'neutral', m: { lookX: 1 } }], ['bibs', .5, { e: 'despair', p: 'holdBag', propR: 'bibs' }]] },
      extra: (lt) => { const b = cue('bibs', .5); if (lt < cue('cones', .7)) cones(-480, 1400); if (lt < cue('balls', .82)) ballBag(330, 1400); pill(0, 650, 'ALONE', eb(P(lt, cue('alone', .92), cue('alone', .92) + .3)), '#fff', OUT, 50); } },
    csixteen: { set: 'flat', flat: (t) => bgStadium(t, true), age: 'AGE 16', captionTop: 1235, bright: .75,
      cam: [[0, FC], [.6, FC], [1, { x: 0, y: 940, z: 1.22 }]], cast: { tA: { x: -380, scale: .84 }, tC: { x: -150, scale: .84 }, theo: { x: 90, scale: .88 }, tB: { x: 360, scale: .84 } },
      acts: { tA: [[0, { e: 'worried', p: 'crossed', m: { no: .8 } }], ['look', .65, { e: 'neutral', m: { lookX: 1 } }]], tC: [[0, { e: 'worried', p: 'nervous', m: { no: .8 } }], ['look', .65, { e: 'neutral', m: { lookX: 1 } }]], tB: [[0, { e: 'worried', p: 'crossed', m: { no: .8 } }], ['look', .65, { e: 'neutral', m: { lookX: -1 } }]], theo: [[0, { e: 'tense' }], ['look', .65, { e: 'nervous', ex: { sweat: 1 }, p: 'nervous', m: { tremble: .5 } }]] },
      extra: (lt) => { scoreboard('PENALTIES 4 – 4', 'KICK 5 OF 5'); bubble(-260, 880, 'NOT ME.', eb(P(lt, .3, .6)) * (1 - P(lt, cue('look', .65) - .2, cue('look', .65))), 0); bubble(360, 880, 'NOPE.', eb(P(lt, .6, .9)) * (1 - P(lt, cue('look', .65) - .2, cue('look', .65))), 0); const k = eb(P(lt, cue('look', .65), cue('look', .65) + .3)); if (k > 0) { ctx.save(); ctx.translate(40, 820); ctx.scale(k, k); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-20, -40); ctx.lineTo(20, -40); ctx.closePath(); ctx.fillStyle = '#ffd400'; ctx.fill(); ctx.restore(); pill(90, 700, 'THE ARMBAND 👀', k, '#ffd400', OUT, 40); } } },
    cseventeen: { set: 'flat', flat: (t) => bgStadium(t, false), age: 'AGE 17', captionTop: 1235, conf: 1,
      cam: [[0, FC], [1, FC]], cast: { theo: { x: -150, scale: .92 }, rico: { x: 200, scale: .9 } },
      acts: { theo: [[0, { e: 'ecstatic', p: 'holdBag', propR: null, m: { jump: .3 } }], ['take', .72, { e: 'shock', p: 'idle', m: { jump: 0 } }], ['take', .85, { e: 'despair', p: 'crossed' }]], rico: [[0, { e: 'happy', p: 'cheer' }], ['take', .72, { e: 'ecstatic', p: 'holdBag', m: { lookX: 0 } }]] },
      extra: (lt, t) => { const tk = cue('take', .72), x = lt < tk ? -150 : lerp(-150, 200, eio(P(lt, tk, tk + .35))); trophy(x, 1400 - 553 * .92 - 230, 1.1, t, 'CUP'); pill(-150, 520, '1 SECOND', eb(P(lt, cue('one', .55), cue('one', .55) + .3)) * (1 - P(lt, tk, tk + .2)), '#fff', OUT, 40); if (lt > tk + .4) { ctx.save(); ctx.translate(340, 600); const k = eb(P(lt, tk + .4, tk + .7)); ctx.scale(k, k); ctx.beginPath(); ctx.roundRect(-110, -60, 220, 120, 16); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.stroke(); txt('📸', 0, 4, 64, OUT, 900); ctx.restore(); } } },
    cthing: { set: 'flat', flat: (t) => bgStadium(t, false), captionTop: 1235, cam: [[0, FC], [1, FC]], cast: { tA: { x: -350, scale: .86 }, theo: { x: 0, scale: .92 }, tB: { x: 350, scale: .86 } },
      acts: { tA: [[0, { e: 'neutral' }], ['team', .7, { e: 'ecstatic', p: 'cheer', m: { jump: .5 } }]], tB: [[0, { e: 'neutral' }], ['team', .7, { e: 'ecstatic', p: 'cheer', m: { jump: .5 } }]], theo: [[0, { e: 'neutral', p: 'hips' }], ['team', .7, { e: 'happy', p: 'cheer' }]] },
      extra: (lt) => pill(0, 640, 'WIN = THE TEAM 🏆', eb(P(lt, cue('team', .7), cue('team', .7) + .3)), '#2fbf71', '#fff', 46) },
    cyou: { set: 'flat', flat: bgDark, captionTop: 1700, cam: [[0, FC], [1, { x: 0, y: 930, z: 1.08 }]], cast: { theo: { x: 0, scale: 1 } },
      acts: { theo: [[0, { e: 'despair', p: 'idle' }]] }, extra: (lt) => pill(0, 640, 'LOSS = YOU', eb(P(lt, cue('you', .55), cue('you', .55) + .3)), '#e8364f', '#fff', 56) },
    ctag: { set: 'flat', flat: (t) => bgStadium(t, false), captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { tA: { x: -380, scale: .88 }, theo: { x: -100, scale: 1 }, nico: { x: 170, scale: .92 }, leo: { x: 420, scale: .92 } },
      acts: { theo: [[0, { e: 'worried', m: { lookX: 1 } }], [.45, { e: 'happy', p: 'cheer' }]], tA: [[0, { e: 'happy', p: 'pointR' }]], nico: [[0, { e: 'happy', p: 'pointL', m: { lookX: -1 } }]], leo: [[0, { e: 'happy', p: 'thumbsUpR', handR: 'thumb', m: { lookX: -1 } }]] },
      extra: (lt) => { pill(0, 520, '@ TAG YOUR CAPTAIN', eb(P(lt, .1, .45)), '#ffd400', OUT, 50); bubble(240, 790, "WE'VE GOT YOU.", eb(P(lt, cue('got', .6), cue('got', .6) + .35)), -60); } }
  });


  // ---------- "Why it sucks being the coach" / "... the referee" ----------
  Object.assign(CH, {
    gran: { skin: '#f0c19a', shirt: '#c96a9a', trim: '#fff', pants: '#5a4a6a', shoes: '#111', hair: 'short', hairColor: '#d9d9e0', glasses: true, bw: 1.15, blinkPh: .5 },
    mum:  { skin: '#e8b08a', shirt: '#2fae9a', trim: '#fff', pants: '#2b2f4a', shoes: '#111', hair: 'short', hairColor: '#4a2a14', bw: 1.05, blinkPh: 1.4 },
    kidG: { skin: '#ffd9b8', shirt: '#0f8a5c', trim: '#fff', number: '3', pants: '#fff', shoes: '#111', hair: 'spiky', hairColor: '#c9a46a', bw: .95, blinkPh: 2.2 }
  });
  function groupChat(x, y, k, lt, msgs) {
    if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.beginPath(); ctx.roundRect(-210, -380, 420, 760, 50); ctx.fillStyle = '#1b1035'; ctx.fill(); ctx.beginPath(); ctx.roundRect(-188, -350, 376, 700, 34); ctx.fillStyle = '#e9f5e9'; ctx.fill();
    ctx.fillStyle = '#2fbf71'; ctx.beginPath(); ctx.roundRect(-188, -350, 376, 80, [34, 34, 0, 0]); ctx.fill(); txt('U9 PARENTS (40)', 0, -310, 28, '#fff', 900);
    msgs.forEach(([who, m, at], i) => { if (lt < at) return; const yy = -230 + i * 105; ctx.beginPath(); ctx.roundRect(-170, yy - 34, 300, 84, 16); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.1)'; ctx.stroke(); txt(who, -152, yy - 12, 20, '#2fbf71', 800, 'left'); txt(m, -152, yy + 20, 24, OUT, 800, 'left'); });
    ctx.restore();
  }
  function phonesUp(t, k) { if (k <= 0) return; for (let i = 0; i < 9; i++) { const x = -480 + i * 120, y = 1120 + (i % 2) * 40 + Math.sin(t * 2 + i) * 6; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.beginPath(); ctx.roundRect(-26, -46, 52, 92, 8); ctx.fillStyle = '#1b1035'; ctx.fill(); ctx.beginPath(); ctx.roundRect(-20, -38, 40, 70, 4); ctx.fillStyle = (Math.floor(t * 2 + i) % 2) ? '#fff' : '#ff3b4f'; ctx.fill(); ctx.restore(); } }
  function splitCrowd(lt, cl, cr) { pill(-280, 520, cl, 1, '#e8364f', '#fff', 34); pill(280, 520, cr, 1, '#1f6fe0', '#fff', 34); }
  const COACH = { x: 0, scale: 1 };
  Object.assign(SHOTS, {
    // ===== COACH =====
    kohook: { set: 'flat', flat: (t) => bgStadium(t, false), titleFast: true, captionTop: 1235,
      title: ['WHY IT SUCKS BEING THE', '<span class="box">COACH</span>'], titleSize: [66, 110],
      cam: [[0, FC], [1, { x: 0, y: 900, z: 1.04 }]], cast: { theo: { x: 290, scale: .58, y: 1180 }, coach: { x: -40, scale: 1 } },
      acts: { coach: [[0, { e: 'despair', p: 'handsOnHead' }]], theo: [[0, { e: 'happy', p: 'cheer' }]] } },
    kovol: { set: 'flat', flat: bgPark, age: 'YEAR 1', captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { coach: { x: -230, scale: 1 } },
      acts: { coach: [[0, { e: 'surprised', p: 'cheer' }], ['own', .4, { e: 'neutral', p: 'holdBag', propR: 'bibs' }], ['chat', .72, { e: 'despair', p: 'phone', propR: 'phoneRing' }]] },
      extra: (lt, t) => { pill(-230, 650, 'NOBODY ELSE? 🙋', eb(P(lt, .2, .5)) * (1 - P(lt, cue('own', .4) - .2, cue('own', .4))), '#fff', OUT, 40); if (lt > cue('own', .4)) cones(-80, 1400); statCard(270, 330, 'YOU OWN', [['BIBS', 20, true], ['CONES', 30, true], ['PARENTS', lt > cue('chat', .72) ? 40 : 0, false]], eb(P(lt, cue('own', .4), cue('own', .4) + .3))); } },
    kosat: { set: 'flat', flat: (t) => bgStadium(t, true), age: 'SATURDAY 7:00', captionTop: 1235, bright: .7,
      cam: [[0, FC], [1, { x: -60, y: 920, z: 1.08 }]], cast: { coach: { x: 160, scale: 1 } },
      back: () => keeperGoal(-780, 100, int3()),
      acts: { coach: [[0, { e: 'focused', p: 'holdBag', m: { walk: .6 } }], ['nets', .5, { e: 'tense', ex: { sweat: .6 }, p: 'cheer', m: { walk: 0 } }], ['rain', .85, { e: 'despair', p: 'cheer', m: { tremble: .5 } }]] },
      extra: (lt, t) => { pill(160, 650, 'FIRST ONE THERE', eb(P(lt, .3, .6)), '#fff', OUT, 38); if (lt > cue('rain', .82)) rain(t); } },
    koparents: { set: 'flat', flat: (t) => bgStadium(t, false), age: 'MATCH DAY', captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { mum: { x: -380, scale: .95 }, dad: { x: -130, scale: .95 }, coach: { x: 130, scale: 1 }, gran: { x: 380, scale: .92 } },
      acts: { coach: [[0, { e: 'focused', p: 'crossed' }], ['parents', .6, { e: 'nervous', ex: { sweat: 1 }, p: 'nervous' }]], mum: [[0, { e: 'neutral' }], ['parents', .6, { e: 'angry', p: 'pointR', m: { lookX: 1 } }]], dad: [[0, { e: 'neutral' }], ['parents', .6, { e: 'angry', p: 'pointR', m: { lookX: 1 } }]], gran: [[0, { e: 'neutral' }], ['parents', .6, { e: 'angry', p: 'pointL', m: { lookX: -1 } }]] },
      extra: (lt) => { statCard(0, 300, 'THE MATHS', [['PLAYERS', 15, true], ['POSITIONS', 11, false]], eb(P(lt, .1, .4))); const k = cue('parents', .6); bubble(-330, 860, 'MY KID STARTS!', eb(P(lt, k, k + .3)), -40); bubble(-120, 720, 'WHY IS HE ON THE BENCH?', eb(P(lt, k + .2, k + .5)), 0); bubble(320, 800, 'MY GRANDSON!', eb(P(lt, k + .4, k + .7)), 50); } },
    koflip: { set: 'flat', flat: (t) => bgStadium(t, false), captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { coach: { x: 0, scale: 1 } },
      acts: { coach: [[0, { e: 'despair', p: 'handsOnHead' }], ['win', .5, { e: 'happy', p: 'cheer' }], ['great', .8, { e: 'neutral', p: 'crossed' }]] },
      extra: (lt) => { const w = cue('win', .5); scoreboard(lt < w ? 'HOME 0 – 3 AWAY' : 'HOME 3 – 0 AWAY', lt < w ? 'LOST' : 'WON'); pill(0, 860, lt < w ? '"BAD TACTICS."' : '"GREAT PLAYERS."', eb(P(lt, lt < w ? cue('bad', .3) : cue('great', .8), (lt < w ? cue('bad', .3) : cue('great', .8)) + .3)), lt < w ? '#e8364f' : '#2fbf71', '#fff', 46); } },
    kodad: { set: 'flat', flat: (t) => bgStadium(t, false), age: 'SECOND HALF', captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { coach: { x: -230, scale: 1 }, dad: { x: 260, scale: 1 } },
      acts: { coach: [[0, { e: 'focused', p: 'pointR', ex: { mouthOpen: .5 } }], ['louder', .7, { e: 'angry', p: 'crossed' }]], dad: [[0, { e: 'neutral', m: { lookX: -1 } }], ['dad', .35, { e: 'angry', p: 'pointL', ex: { mouthOpen: 1, mouthW: 1.3 }, m: { lookX: -1, tremble: .5 } }]] },
      extra: (lt) => { bubble(-230, 760, 'HOLD YOUR POSITION!', eb(P(lt, .1, .4)), 0); const k = cue('dad', .35); ctx.save(); const s2 = lt > cue('louder', .7) ? 1.35 : 1; ctx.translate(260, 700); ctx.scale(s2, s2); bubble(0, 0, 'ATTAAACK!!!', eb(P(lt, k, k + .3)), 0); ctx.restore(); } },
    kospeech: { set: 'flat', flat: (t) => bgStadium(t, false), age: 'HALF-TIME', captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { kidR: { x: -360, scale: .66 }, kidG: { x: -150, scale: .66 }, coach: { x: 120, scale: 1 }, kidY: { x: 390, scale: .66 } },
      acts: { coach: [[0, { e: 'confident', p: 'pointR', ex: { mouthOpen: .4 } }], ['orange', .7, { e: 'despair', p: 'idle' }]], kidR: [[0, { e: 'neutral' }]], kidY: [[0, { e: 'neutral', m: { lookX: -1 } }]], kidG: [[0, { e: 'neutral', m: { lookX: 1 } }], ['orange', .7, { e: 'happy', p: 'waveR', m: { wave: 1 } }]] },
      extra: (lt) => { pill(120, 560, '📋 TACTICS · PRESSING · SHAPE', eb(P(lt, .2, .5)) * (1 - P(lt, cue('orange', .7) - .2, cue('orange', .7))), '#fff', OUT, 30); bubble(-150, 860, 'CAN WE HAVE ORANGE SLICES?', eb(P(lt, cue('orange', .7), cue('orange', .7) + .3)), 0); } },
    kophoto: { set: 'flat', flat: (t) => bgStadium(t, false), age: 'END OF SEASON', captionTop: 1235, conf: 1,
      cam: [[0, FC], [1, FC]], cast: { kidR: { x: -380, scale: .7 }, kidG: { x: -170, scale: .7 }, kidY: { x: 40, scale: .7 }, kidB: { x: 250, scale: .7 }, coach: { x: 450, scale: 1 } },
      move: { coach: [[0, 0], ['photo', .45, 0], ['cam', .78, 470]] },
      acts: { kidR: [[0, { e: 'ecstatic', p: 'cheer' }]], kidG: [[0, { e: 'ecstatic', p: 'cheer', m: { jump: .4 } }]], kidY: [[0, { e: 'ecstatic', p: 'holdBag', propR: 'cup' }]], kidB: [[0, { e: 'ecstatic', p: 'cheer' }]], coach: [[0, { e: 'ecstatic', p: 'cheer' }], ['cam', .78, { e: 'neutral', p: 'holdCashUp', propR: 'camera', m: { lookX: -1 } }]] },
      extra: (lt) => { pill(0, 520, 'LEAGUE CHAMPIONS 🏆', eb(P(lt, .1, .4)), '#2fbf71', '#fff', 44); const c = cue('cam', .78); if (lt > c + .2) { const a = 1 - P(lt, c + .2, c + .5); if (a > 0) { ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(-2000, -2000, 5000, 5000); } } } },
    kothing: { set: 'flat', flat: (t) => bgStadium(t, false), captionTop: 1235, cam: [[0, FC], [1, FC]], cast: { coach: { x: 0, scale: 1 } },
      acts: { coach: [[0, { e: 'neutral', p: 'hips' }]] },
      extra: (lt) => statCard(0, 330, 'YOUR SALARY', [['MONEY', '€0', false], ['THANK YOUS', lt > cue('thanks', .75) ? 0 : '…', false]], eb(P(lt, cue('money', .55), cue('money', .55) + .3))) },
    koagain: { set: 'flat', flat: (t) => bgStadium(t, true), age: 'NEXT SATURDAY 7:00', captionTop: 1700, bright: .75, cam: [[0, FC], [1, { x: 0, y: 930, z: 1.08 }]], cast: { coach: { x: 0, scale: 1 } },
      acts: { coach: [[0, { e: 'happy', p: 'holdBag', propR: 'bibs', m: { walk: .5 } }]] }, extra: (lt) => pill(0, 640, '❤️', eb(P(lt, .6, .9)), '#fff', OUT, 60) },
    kotag: { set: 'flat', flat: (t) => bgStadium(t, false), captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { kidR: { x: -380, scale: .7 }, coach: { x: -120, scale: 1 }, kidG: { x: 150, scale: .7 }, kidY: { x: 380, scale: .7 } },
      acts: { coach: [[0, { e: 'surprised' }], [.45, { e: 'happy', p: 'thumbsUpR', handR: 'thumb' }]], kidR: [[0, { e: 'happy', p: 'cheer' }]], kidG: [[0, { e: 'happy', p: 'cheer', m: { jump: .3 } }]], kidY: [[0, { e: 'happy', p: 'waveR', m: { wave: 1 } }]] },
      extra: (lt) => { pill(0, 520, '@ TAG YOUR COACH', eb(P(lt, .1, .45)), '#ffd400', OUT, 50); bubble(220, 790, 'THANK YOU, COACH!', eb(P(lt, cue('thanks', .6), cue('thanks', .6) + .35)), -60); } },
    // ===== REFEREE =====
    rfhook: { set: 'flat', flat: (t) => bgStadium(t, false), titleFast: true, captionTop: 1235,
      title: ['WHY IT SUCKS BEING THE', '<span class="box">REFEREE</span>'], titleSize: [66, 110],
      cam: [[0, FC], [1, { x: 0, y: 900, z: 1.04 }]], cast: { tC: { x: 290, scale: .58, y: 1180 }, ref: { x: -40, scale: 1 } },
      acts: { ref: [[0, { e: 'despair', p: 'crossed' }]], tC: [[0, { e: 'angry', p: 'pointL', m: { lookX: -1 } }]] } },
    rffirst: { set: 'flat', flat: bgPark, age: 'FIRST GAME · U9', captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { ref: { x: -200, scale: 1 }, gran: { x: 280, scale: .95 } },
      acts: { ref: [[0, { e: 'happy', p: 'holdCashUp', propR: 'whistle' }], ['blind', .65, { e: 'shock', p: 'idle' }]], gran: [[0, { e: 'neutral', m: { lookX: -1 } }], ['blind', .6, { e: 'angry', p: 'pointL', ex: { mouthOpen: 1 }, m: { lookX: -1, tremble: .4 } }]] },
      extra: (lt) => bubble(280, 760, 'ARE YOU BLIND, REF?!', eb(P(lt, cue('blind', .6), cue('blind', .6) + .3)), 0) },
    rffree: { set: 'flat', flat: (t) => bgStadium(t, false), captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { ref: { x: 0, scale: 1 } },
      acts: { ref: [[0, { e: 'focused', p: 'pointR' }], ['dont', .55, { e: 'neutral', p: 'waveR', m: { wave: 1 } }]] },
      extra: (lt) => { const d2 = cue('dont', .55); if (lt < d2) { pill(0, 650, 'FREE KICK ✓', 1, '#fff', OUT, 40); bubble(-300, 820, 'BOOO!', eb(P(lt, cue('hate1', .3), cue('hate1', .3) + .3)), 0); splitCrowd(lt, '😡 HOME', '😊 AWAY'); } else { pill(0, 650, 'PLAY ON ✗', 1, '#fff', OUT, 40); bubble(300, 820, 'BOOO!', eb(P(lt, cue('hate2', .85), cue('hate2', .85) + .3)), 0); splitCrowd(lt, '😊 HOME', '😡 AWAY'); } } },
    rfrun: { set: 'flat', flat: (t) => bgStadium(t, false), captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { ref: { x: -150, scale: 1 } },
      move: { ref: [[0, -350], [1, 250]] },
      acts: { ref: [[0, { e: 'tense', ex: { sweat: 1 }, m: { walk: 1.2 } }]] },
      extra: (lt) => { statCard(220, 320, 'DISTANCE', [['RUN', Math.round(lerp(0, 10, P(lt, .2, cue('pass', .6)))) + ' KM', true], ['PASSES TO YOU', 0, false]], eb(P(lt, .1, .4))); } },
    rfdecisions: { set: 'flat', flat: bgPurple, captionTop: 1700, cam: [[0, STUDIO], [1, STUDIO]], cast: {},
      draw: (s, lt, d, t) => { statCard(540, 380, 'YOUR GAME', [['DECISIONS', Math.round(lerp(0, 100, P(lt, .2, cue('right', .45)))), true], ['CORRECT', lt > cue('right', .45) ? 99 : '…', true], ['WRONG', lt > cue('one', .8) ? 1 : '…', false]], 1.3 * eb(P(lt, 0, .3))); if (lt > cue('one', .8)) { phone(540, 1240, .95 * eb(P(lt, cue('one', .8), cue('one', .8) + .3)), [['@fan_99', 'THAT ONE CALL 😡', cue('one', .8)], ['@ultra77', 'worst ref ever', cue('one', .8) + .4]], lt); } } },
    rfpen: { set: 'flat', flat: (t) => bgStadium(t, true), age: "90+4'", captionTop: 1235,
      cam: [[0, FC], [.5, FC], [1, { x: 0, y: 960, z: 1.2 }]], cast: { tA: { x: -380, scale: .86 }, tB: { x: -170, scale: .86 }, ref: { x: 30, scale: 1 }, tC: { x: 250, scale: .86 }, oppCap: { x: 440, scale: .86 } },
      move: { tA: [[0, -560], ['mob', .55, -330]], tB: [[0, -420], ['mob', .55, -160]], tC: [[0, 420], ['mob', .55, 220]], oppCap: [[0, 600], ['mob', .55, 390]] },
      acts: () => { const m = cue('mob', .55), D = CUR.duration, mob = { e: 'angry', p: 'pointR', ex: { mouthOpen: 1 }, m: { tremble: .6 } }, mobL = Object.assign({}, mob, { p: 'pointL' });
        return { ref: [[0, { e: 'focused', p: 'pointR' }], [m / D, { e: 'shock', p: 'idle', m: { tremble: .3 } }]], tA: [[0, { e: 'neutral', m: { walk: 1 } }], [m / D, mob]], tB: [[0, { e: 'neutral', m: { walk: 1 } }], [m / D, mob]], tC: [[0, { e: 'neutral', m: { walk: 1 } }], [m / D, mobL]], oppCap: [[0, { e: 'neutral', m: { walk: 1 } }], [m / D, mobL]] }; },
      extra: (lt) => { pill(30, 620, 'PENALTY!', eb(P(lt, cue('pen', .2), cue('pen', .2) + .3)), '#e8364f', '#fff', 50); const m = cue('mob', .55); ['NEVER!', 'DIVE!', 'REF!!', 'NO WAY!'].forEach((b, i) => bubble([-320, -150, 170, 340][i], 760 + (i % 2) * 70, b, eb(P(lt, m + i * .12, m + i * .12 + .25)), 0)); } },
    rfvar: { set: 'flat', flat: (t) => bgStadium(t, true), captionTop: 1235, bright: .8,
      cam: [[0, FC], [1, FC]], cast: { ref: { x: 0, scale: 1 } },
      acts: { ref: [[0, { e: 'worried', p: 'shrug' }], ['phones', .6, { e: 'nervous', ex: { sweat: 1 }, p: 'nervous' }]] },
      extra: (lt, t) => { pill(0, 620, 'VAR ✗  REPLAY ✗', eb(P(lt, .1, .4)), '#fff', OUT, 40); phonesUp(t, eb(P(lt, cue('phones', .6), cue('phones', .6) + .4))); } },
    rfcar: { set: 'flat', flat: (t) => bgStadium(t, true), age: 'AFTER THE GAME', captionTop: 1235, bright: .6,
      cam: [[0, FC], [1, { x: 100, y: 920, z: 1.06 }]], cast: { ref: { x: -300, scale: .95 }, dad: { x: 520, scale: .6, y: 1200 } },
      move: { ref: [[0, -400], [1, 200]] },
      acts: { ref: [[0, { e: 'neutral', p: 'idle', m: { walk: 1 } }], ['shout', .55, { e: 'surprised', p: 'idle', m: { walk: 0, lookX: 1 } }], ['sure', .8, { e: 'worried', p: 'shrug', m: { lookX: 1 } }]], dad: [[0, { e: 'neutral' }], ['shout', .55, { e: 'smirk', p: 'waveR', m: { wave: 1 } }]] },
      extra: (lt) => { pill(-300, 640, 'ALONE', eb(P(lt, cue('alone', .3), cue('alone', .3) + .3)) * (1 - P(lt, cue('shout', .55) - .2, cue('shout', .55))), '#fff', OUT, 44); bubble(230, 900, '"GET HOME SAFE, REF!"', eb(P(lt, cue('shout', .55), cue('shout', .55) + .3)), 230); if (lt > cue('sure', .8)) txt('?', 120, 820, 120 * eb(P(lt, cue('sure', .8), cue('sure', .8) + .3)), '#ffd400', 900, 'center', 14); } },
    rfthing: { set: 'flat', flat: (t) => bgStadium(t, false), captionTop: 1235, cam: [[0, FC], [1, FC]], cast: { tA: { x: -360, scale: .86 }, ref: { x: 0, scale: 1 }, oppCap: { x: 360, scale: .86 } },
      acts: { ref: [[0, { e: 'confident', p: 'holdCashUp', propR: 'whistle' }]], tA: [[0, { e: 'happy', p: 'idle', m: { lookX: 1 } }]], oppCap: [[0, { e: 'happy', p: 'idle', m: { lookX: -1 } }]] },
      extra: (lt) => pill(0, 640, 'NO REF = NO GAME', eb(P(lt, cue('nogame', .65), cue('nogame', .65) + .3)), '#ffd400', OUT, 46) },
    rfforget: { set: 'flat', flat: bgDark, captionTop: 1700, cam: [[0, FC], [1, { x: 0, y: 930, z: 1.08 }]], cast: { ref: { x: 0, scale: 1 } },
      acts: { ref: [[0, { e: 'despair', p: 'idle' }]] }, extra: (lt) => pill(0, 640, 'FORGOTTEN', eb(P(lt, .3, .6)), '#fff', OUT, 56) },
    rftag: { set: 'flat', flat: (t) => bgStadium(t, false), captionTop: 1235,
      cam: [[0, FC], [1, FC]], cast: { theo: { x: -380, scale: .9 }, ref: { x: -100, scale: 1 }, oppCap: { x: 180, scale: .9 }, rico: { x: 420, scale: .9 } },
      acts: { ref: [[0, { e: 'surprised' }], [.45, { e: 'happy', p: 'thumbsUpR', handR: 'thumb' }]], theo: [[0, { e: 'happy', p: 'waveR', m: { wave: 1 } }]], oppCap: [[0, { e: 'happy', p: 'thumbsUpR', handR: 'thumb', m: { lookX: -1 } }]], rico: [[0, { e: 'happy', p: 'cheer' }]] },
      extra: (lt) => { pill(0, 520, '@ TAG A REFEREE', eb(P(lt, .1, .45)), '#ffd400', OUT, 50); bubble(250, 790, 'THANKS FOR THE GAME!', eb(P(lt, cue('thanks', .6), cue('thanks', .6) + .35)), -100); } }
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
    World3D.init(document.getElementById('gl'), { crowd: spec.crowd });
    if (spec.chars) for (const n in spec.chars) Object.assign(CH[n], spec.chars[n]);
    window.BETCFG = { cur: BET().cur, slip: BET().slip };
    window.SCARF = spec.scarf || null;
    for (const s of spec.scenes) {
      const base = SHOTS[s.shot]; if (!base) throw new Error('unknown shot ' + s.shot);
      const sh = s.override ? Object.assign({}, base, s.override) : base;
      s.sh = sh;
      const toks = tokens(s.text || '');
      s.duration = s.duration || (sh.dur ? sh.dur(s) : Math.max(sh.minDur || 0, toks.length / 2.5 + .9));
      s._start = total; total += s.duration; s._end = total;
      // overlay elements
      const root = el('div', null, null); root.style.display = 'none'; s._ov = root;
      if (sh.tag) s._tag = el('div', 'tag', `<span>${esc(sh.tag)}</span>`, root);
      if (sh.age) s._tag = el('div', 'agetag', `<span>${esc(sh.age)}</span>`, root);
      if (sh.title) {
        s._title = el('div', 'title', null, root);
        s._tl = sh.title.map((h, i) => { const d = el('div', null, h, s._title); d.style.fontSize = (sh.titleSize[i] || 100) + 'px'; return d; });
        if (sh.sub) s._sub = el('div', 'sub', esc(sh.sub), s._title);
        if (sh.follow) s._follow = el('div', 'follow', '＋ ' + esc(sh.follow), s._title);
      }
      if (sh.counter) { s._cnt = el('div', 'title', null, root); s._cntL = el('div', 'sub', `${BET().cur}${BET().stake.toLocaleString('en-US')} × ${BET().mult} =`, s._cnt); s._cntN = el('div', 'gold', BET().cur + '0', s._cnt); s._cntN.style.fontSize = '150px'; }
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
    let C;
    spec.scenes.forEach((s, i) => {
      const sh = s.sh, st = s._start, d = s.duration, next = spec.scenes[i + 1];
      C = (n, df) => s.cues && s.cues[n] != null ? s.cues[n] : df * d;
      // camera pans
      if (sh.cam) for (let k = 0; k < sh.cam.length - 1; k++) {
        const [fa, a] = sh.cam[k], [fb, b] = sh.cam[k + 1];
        if (Math.abs(b.x - a.x) > 500) add(st + fa * d - .05, (fb - fa) * d > .7 ? 'whoosh_long' : 'whoosh', -15);
      }
      // hard cuts inside a shot
      if (sh.cuts) sh.cuts.forEach((c, k) => { if (k) add(st + cutStart(s, c) - .1, 'whoosh_soft', -19); });
      // scene changes
      if (next) {
        if (setOf(next, 'first') !== setOf(s, 'last')) add(s._end - .35, 'whoosh_long', -15);
        else if (sh.cam && next.sh.cam && !(next.sh.cam[0][1].x === sh.cam[sh.cam.length - 1][1].x)) add(s._end - .12, 'whoosh_soft', -21);
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
        case 'ihook': add(st + .28, 'thump', -13); add(st + .5, 'thump', -13); break;
        case 'iintro': add(st + .3, 'pop', -16); break;
        case 'imaldini': add(st + C('goal', .5), 'thump', -12); break;
        case 'icrespo': add(st + C('g2', .25), 'thump', -13); add(st + C('g3', .5), 'thump', -12); add(st + C('ht', .68), 'whistle', -20); break;
        case 'ileave': add(st + C('leave', .45), 'whoosh_soft', -18); break;
        case 'igerrard': case 'ismicer': add(st + C('goal', .55), 'thump', -11); add(st + C('goal', .55) + .05, 'cheer', -18); break;
        case 'ialonso': add(st + C('pen', .1), 'whistle', -22); add(st + C('saved', .37), 'thump', -14); add(st + C('goal', .55), 'thump', -10); add(st + C('goal', .55) + .05, 'cheer', -15); break;
        case 'idudek': add(st + C('save', .7), 'thump', -11); add(st + C('save', .7) + .1, 'sparkle', -16); break;
        case 'ipens': for (let x = .2; x < d - .2; x += .85) add(st + x, 'heartbeat', -13); break;
        case 'isaved': add(st, 'thump', -9); add(st + .02, 'cheer', -11); break;
        case 'bhook': add(st + .28, 'thump', -13); add(st + .5, 'thump', -13); break;
        case 'bsociedad': add(st + C('goal', .2), 'thump', -14); break;
        case 'bcrisis': add(st + .1, 'pop', -16); add(st + .4 * d, 'thump', -15); break;
        case 'bsell': add(st + C('sell', .45), 'kaching', -18); break;
        case 'bkeep': add(st + C('three', .6), 'sparkle', -15); break;
        case 'bmsn': add(st + C('bite', .5), 'pop', -14); break;
        case 'bbayern': add(st + C('skip', .4), 'whoosh_soft', -18); add(st + C('chip', .62) + .4, 'thump', -11); add(st + C('chip', .62) + .45, 'cheer', -17); break;
        case 'bdouble': add(st + .2, 'sparkle', -16); add(st + C('cupgoal', .85) + .3, 'thump', -11); add(st + C('cupgoal', .85) + .35, 'cheer', -17); break;
        case 'bberlin': for (let x = .2; x < d - .2; x += .85) add(st + x, 'heartbeat', -15); break;
        case 'bfinal': [['rak', .08], ['mor', .3], ['sua', .55], ['ney', .78]].forEach(([n, df]) => add(st + C(n, df) + .35, 'thump', -12)); add(st + C('ney', .78) + .4, 'cheer', -16); break;
        case 'btreble': add(st, 'thump', -9); add(st + .02, 'cheer', -11); [0, 1, 2].forEach(i => add(st + .4 + i * .25, 'pop', -14)); break;
        case 'bgoals': for (let k = 0; k < 12; k++) add(st + .3 + k * .12, 'tick', -19); add(st + C('num', .7), 'ding', -15); break;
        case 'bmate': add(st + C('follow', .75) + .1, 'pop', -14); break;
        case 'rhook': add(st + .28, 'thump', -13); add(st + .5, 'thump', -13); add(st + .72, 'thump', -13); break;
        case 'rparis': for (let k = 0; k < 4; k++) add(st + .6 + k * (d * .62 - .6) / 4 + .3, 'thump', -15); break;
        case 'rnobody': add(st + .35 * d, 'thump', -14); break;
        case 'rthree': add(st + C('s1', .12) + .3, 'thump', -12); add(st + C('og', .45) + .2, 'thump', -12); add(st + C('pen', .75) + .35, 'thump', -12); add(st + C('pen', .75) + .4, 'cheer', -18); break;
        case 'rcavani': add(st + C('goal', .15) + .35, 'thump', -13); add(st + C('need', .45), 'heartbeat', -14); add(st + C('need', .45) + .85, 'heartbeat', -14); break;
        case 'rleave': add(st + C('leave', .5), 'whoosh_soft', -18); break;
        case 'rfk': add(st + C('goal', .6), 'thump', -11); add(st + C('goal', .6) + .05, 'cheer', -16); break;
        case 'rpen': add(st + C('goal', .55) + .35, 'thump', -11); add(st + C('goal', .55) + .4, 'cheer', -15); break;
        case 'rchip': for (let x = .1; x < d - .1; x += .85) add(st + x, 'heartbeat', -12); break;
        case 'rgoal': add(st + .35, 'thump', -9); add(st + .38, 'cheer', -10); break;
        case 'rgreat': add(st + .2, 'sparkle', -15); break;
        case 'rmate': add(st + C('noise', .4), 'cheer', -20); add(st + C('follow', .75) + .1, 'pop', -14); break;
        case 'gotto': add(st + C('defend', .65), 'thump', -15); break;
        case 'gopener': add(st + C('win', .6), 'thump', -12); add(st + C('win', .6) + .1, 'whistle', -20); break;
        case 'gfrance': case 'ggoal': add(st + C('goal', .6), 'thump', -11); add(st + C('goal', .6) + .05, 'cheer', -17); break;
        case 'gczech': add(st + C('goal', .55), 'thump', -11); add(st + C('goal', .55) + .05, 'cheer', -17); break;
        case 'gfinal': for (let x = .2; x < d - .2; x += .85) add(st + x, 'heartbeat', -14); break;
        case 'gfinal2': for (let x = .2; x < d - .2; x += .85) add(st + x, 'heartbeat', -14); break;
        case 'ggoal2': add(st + C('goal', .62), 'thump', -10); add(st + C('goal', .62) + .05, 'cheer', -14); break;
        case 'gchamp': add(st, 'thump', -9); add(st + .02, 'cheer', -11); break;
        case 'tcold': add(st, 'thump', -9); break;
        case 'tnot': add(st + d * .5, 'pop', -15); break;
        case 'tcaptured': add(st + C('camp', .55), 'thump', -14); break;
        case 'tstay': add(st + d * .62, 'thump', -15); break;
        case 'tprotest': add(st + .3, 'thump', -14); break;
        case 'tsaves': [['s1', .3], ['s2', .55], ['s3', .8]].forEach(([n, f]) => add(st + C(n, f), 'thump', -13)); break;
        case 'tcheers': add(st + d * .3, 'cheer', -17); break;
        case 'tfinal': add(st + C('knee', .75), 'thump', -8); break;
        case 'tplayon': for (let x = .2; x < d - .2; x += .85) add(st + x, 'heartbeat', -13); break;
        case 'twin': add(st + d * .22, 'thump', -12); add(st + d * .45, 'whistle', -17); add(st + d * .55, 'cheer', -12); break;
        case 'txray': add(st + .1, 'whoosh_soft', -18); add(st + C('truth', .5), 'thump', -10); break;
        case 'tlegend': add(st + .3, 'sparkle', -15); add(st + C('follow', .7) + .1, 'pop', -14); break;
        case 'pcold': add(st, 'thump', -9); add(st + .3, 'sparkle', -14); break;
        case 'pserious': add(st + d * .45, 'thump', -12); break;
        case 'pexhibit': add(st + .3, 'sparkle', -17); break;
        case 'pstolen': add(st + d * .3, 'whoosh_soft', -15); add(st + d * .5, 'thump', -10); break;
        case 'pnews': add(st + .1, 'whoosh', -15); add(st + .7, 'thump', -12); add(st + C('ransom', .5), 'thump', -12); break;
        case 'phandover': add(st + .2, 'whistle', -20); add(st + C('missing', .65), 'thump', -12); break;
        case 'pwalk': add(st + C('name', .75), 'pop', -13); break;
        case 'psniff': add(st + C('pkg', .55), 'pop', -12); for (let x = .3; x < d; x += .85) add(st + x, 'heartbeat', -16); break;
        case 'popen': add(st + C('find', .6), 'thump', -9); add(st + C('find', .6) + .05, 'sparkle', -12); break;
        case 'pwembley': add(st, 'thump', -10); add(st + .05, 'cheer', -11); break;
        case 'pparty': [['medal', .3], ['movie', .5], ['party', .75]].forEach(([n, f]) => add(st + C(n, f), 'pop', -13)); break;
        case 'pend': add(st + C('follow', .7) + .1, 'pop', -14); break;
        case 'whook': add(st, 'thump', -10); break;
        case 'wsix': add(st + C('coach', .62), 'whistle', -18); break;
        case 'wcar': add(st + .2 * d, 'pop', -15); add(st + C('twice', .7), 'pop', -14); break;
        case 'weleven': [.15, .3, .45].forEach(f => add(st + d * f, 'thump', -15)); add(st + d * .66, 'thump', -11); break;
        case 'weyes': add(st + .2, 'heartbeat', -14); add(st + 1.05, 'heartbeat', -14); break;
        case 'wface': add(st + C('face', .45), 'thump', -8); break;
        case 'wslip': add(st + C('slip', .65), 'thump', -10); add(st + C('slip', .65) + .55, 'cheer', -16); break;
        case 'wname': add(st + .5, 'pop', -16); add(st + 1.1, 'pop', -16); add(st + 1.7, 'pop', -16); add(st + 1.3, 'whoosh', -15); break;
        case 'whero': add(st + C('one', .55), 'cheer', -17); add(st + C('hero', .8), 'ding', -15); break;
        case 'wvillain': add(st + C('drop', .5), 'thump', -12); add(st + C('villain', .8), 'thump', -10); break;
        case 'wtag': add(st + .1, 'pop', -14); add(st + C('thanks', .6), 'sparkle', -16); break;
        case 'dhook': add(st, 'thump', -10); break;
        case 'dsix': add(st + C('coach', .6) + .2, 'pop', -15); break;
        case 'dcorner': add(st + C('never', .5) - 1.2, 'whistle', -22); add(st + C('never', .55), 'pop', -15); break;
        case 'dtackle': add(st + C('slide', .35), 'whoosh_soft', -14); add(st + C('slide', .35) + .1, 'thump', -12); add(st + C('claps', .75), 'tick', -16); break;
        case 'dshadow': add(st + C('fall', .25), 'thump', -14); add(st + C('pen', .45), 'whistle', -16); add(st + C('yellow', .7), 'pop', -13); break;
        case 'dclean': add(st + C('motm', .7), 'pop', -14); add(st + C('keeper', .88), 'ding', -15); break;
        case 'dwinger': add(st + .3, 'whoosh', -15); add(st + C('legs', .75), 'whoosh_soft', -12); break;
        case 'dviews': for (let k = 0; k < 12; k++) add(st + .5 + k * .12, 'tick', -20); add(st + C('views', 1.4) + .6, 'ding', -14); break;
        case 'dnothing': add(st + C('nothing', .7), 'pop', -15); break;
        case 'dclap': add(st + .3, 'tick', -16); break;
        case 'dtag': add(st + .1, 'pop', -14); add(st + C('see', .6), 'sparkle', -16); break;
        case 'mhook': add(st, 'thump', -10); break;
        case 'mseven': add(st + C('box', .2), 'whistle', -20); add(st + C('run', .7), 'whoosh_soft', -16); break;
        case 'mten': for (let k = 0; k < 10; k++) add(st + .3 + k * .12, 'tick', -20); add(st + C('drink', .65), 'pop', -15); break;
        case 'mtwelve': add(st + C('side', .6), 'thump', -16); add(st + C('coach', .82), 'pop', -14); break;
        case 'mkicked': [['k1', .25], ['k2', .4], ['k3', .52]].forEach(([n, f]) => add(st + C(n, f), 'thump', -11)); add(st + C('ref', .8), 'whistle', -18); break;
        case 'mgoal': add(st + C('shoot', .2), 'thump', -13); add(st + C('shoot', .2) + .7, 'cheer', -15); add(st + C('pass', .62) + .1, 'pop', -14); add(st + C('pass', .62) + .25, 'pop', -14); break;
        case 'massists': for (let k = 0; k < 15; k++) add(st + .2 + k * .1, 'tick', -20); add(st + C('hl', .45), 'whoosh_soft', -16); break;
        case 'mthing': add(st + C('ball', .7), 'pop', -15); break;
        case 'mjob': add(st + .3, 'heartbeat', -14); break;
        case 'mtag': add(st + .1, 'pop', -14); add(st + C('ran', .6), 'sparkle', -16); break;
        case 'shook': add(st, 'thump', -10); break;
        case 'ssix': for (let k = 0; k < 10; k++) add(st + .2 + k * .12, 'tick', -19); add(st + C('love', .7), 'cheer', -18); break;
        case 'snine': add(st + C('three', .4), 'whoosh_soft', -16); add(st + C('three', .4) + .3, 'pop', -14); break;
        case 'scar': add(st + C('miss', .3), 'pop', -15); add(st + C('dad', .6), 'pop', -14); break;
        case 'snopass': add(st + C('once', .45), 'pop', -15); add(st + C('coach', .75), 'pop', -14); break;
        case 'spen': add(st + .2, 'heartbeat', -14); add(st + 1.05, 'heartbeat', -14); add(st + C('bar', .7), 'thump', -8); add(st + C('bar', .7) + .02, 'ding', -12); break;
        case 'shat': add(st + .1, 'cheer', -17); add(st + C('next', .4), 'whoosh', -15); [0, .6, 1.2].forEach(o => add(st + C('flop', .6) + o, 'pop', -15)); break;
        case 'soffside': add(st + .1, 'cheer', -15); add(st + C('off', .8), 'whistle', -14); break;
        case 'sthing': add(st + C('ninety', .7), 'pop', -16); break;
        case 'ssecond': add(st + .3, 'heartbeat', -13); break;
        case 'stag': add(st + .1, 'pop', -14); add(st + C('next', .6), 'sparkle', -16); break;
        case 'chook': add(st, 'thump', -10); break;
        case 'ceight': add(st + C('honour', .3), 'sparkle', -16); add(st + C('toss', .6), 'whoosh_soft', -18); add(st + C('lose', .85), 'pop', -14); break;
        case 'celeven': add(st + C('say', .4), 'pop', -15); add(st + C('stare', .78), 'heartbeat', -14); break;
        case 'cthirteen': add(st + .2, 'pop', -16); add(st + C('come', .5), 'whistle', -16); add(st + C('card', .8), 'pop', -13); break;
        case 'cfifteen': add(st + .1, 'whistle', -20); [['bibs', .5], ['cones', .7], ['balls', .82]].forEach(([n, f]) => add(st + C(n, f), 'pop', -16)); break;
        case 'csixteen': for (let x = .2; x < d - .2; x += .85) add(st + x, 'heartbeat', -14); add(st + C('look', .65), 'thump', -13); break;
        case 'cseventeen': add(st, 'cheer', -14); add(st + C('take', .72), 'whoosh_soft', -14); add(st + C('take', .72) + .4, 'pop', -14); break;
        case 'cthing': add(st + C('team', .7), 'cheer', -18); break;
        case 'cyou': add(st + C('you', .55), 'thump', -12); break;
        case 'ctag': add(st + .1, 'pop', -14); add(st + C('got', .6), 'sparkle', -16); break;
        case 'kohook': case 'rfhook': add(st, 'thump', -10); break;
        case 'kovol': add(st + C('own', .4), 'pop', -15); add(st + C('chat', .72), 'ring', -18); break;
        case 'kosat': add(st + C('nets', .5), 'thump', -16); break;
        case 'koparents': [0, .2, .4].forEach(o => add(st + C('parents', .6) + o, 'pop', -15)); break;
        case 'koflip': add(st + C('bad', .3), 'thump', -14); add(st + C('win', .5), 'whoosh_soft', -16); add(st + C('great', .8), 'ding', -15); break;
        case 'kodad': add(st + C('dad', .35), 'pop', -14); add(st + C('louder', .7), 'thump', -13); break;
        case 'kospeech': add(st + C('orange', .7), 'pop', -14); break;
        case 'kophoto': add(st, 'cheer', -15); add(st + C('cam', .78) + .2, 'sparkle', -14); break;
        case 'kothing': add(st + C('money', .55), 'pop', -15); break;
        case 'koagain': add(st + .1, 'whistle', -22); break;
        case 'kotag': case 'rftag': add(st + .1, 'pop', -14); add(st + C('thanks', .6), 'sparkle', -16); break;
        case 'rffirst': add(st + .2, 'whistle', -18); add(st + C('blind', .6), 'pop', -14); break;
        case 'rffree': add(st + .1, 'whistle', -18); add(st + C('hate1', .3), 'pop', -15); add(st + C('hate2', .85), 'pop', -15); break;
        case 'rfrun': for (let k = 0; k < 10; k++) add(st + .2 + k * .14, 'tick', -20); break;
        case 'rfdecisions': for (let k = 0; k < 12; k++) add(st + .2 + k * .12, 'tick', -20); add(st + C('one', .8), 'thump', -13); break;
        case 'rfpen': add(st + C('pen', .2), 'whistle', -14); add(st + C('mob', .55), 'whoosh', -14); break;
        case 'rfvar': add(st + C('phones', .6), 'sparkle', -17); break;
        case 'rfcar': add(st + C('shout', .55), 'pop', -15); break;
        case 'rfthing': add(st + C('nogame', .65), 'ding', -15); break;
        case 'rfforget': add(st + .3, 'heartbeat', -14); break;
        case 'imate': add(st + .1, 'whoosh_soft', -20); add(st + C('follow', .75) + .1, 'pop', -14); break;
      }
    });
    return ev.sort((a, b) => a.t - b.t);
  }

  function updateOverlay(s, lt, d) {
    const sh = s.sh;
    if (s._tag) { const k = eb(P(lt, .05, .4)); s._tag.style.transform = `scale(${k})`; s._tag.style.opacity = clamp(k); }
    if (s._title) {
      const t0 = sh.titleAt ? cue(sh.titleAt, .7) : (sh.titleFast ? -.25 : 0);
      if (sh.titleAt && s._cap) s._cap.style.opacity = lt < t0 ? 1 : 0;
      s._tl.forEach((e, i) => { const st = t0 + .1 + i * .22, q = eo(P(lt, st, st + .22)); e.style.opacity = clamp(q * 3); e.style.transform = `scale(${lerp(2.2, 1, q)}) rotate(${(1 - q) * -6}deg)`; });
      if (s._sub) s._sub.style.opacity = P(lt, d * .55, d * .55 + .3);
      if (s._follow) { const k = eb(P(lt, .9, 1.3)); s._follow.style.transform = `scale(${k * (1 + .05 * Math.sin(lt * 8))})`; s._follow.style.opacity = clamp(k); }
    }
    if (s._cnt) {
      s._cntL.style.opacity = P(lt, d * .28, d * .28 + .3);
      const v = P(lt, d * .52, d * .73), k = eo(v);
      const B = BET(), val = v <= 0 ? 0 : Math.round(lerp(B.stake, B.stake * B.mult, k * k));
      s._cntN.textContent = B.cur + val.toLocaleString('en-US');
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

  // resolve the active cut of a multi-cut shot
  function cutStart(s, c) {
    if (typeof c.at === 'number') return c.at * s.duration;
    const [n, df, off] = c.at; return (s.cues && s.cues[n] != null ? s.cues[n] : df * s.duration) + (off || 0);
  }
  function activeCut(s, lt) {
    const cs = s.sh.cuts; let k = 0;
    for (let i = 0; i < cs.length; i++) if (lt >= cutStart(s, cs[i])) k = i;
    const t0 = cutStart(s, cs[k]), t1 = k + 1 < cs.length ? cutStart(s, cs[k + 1]) : s.duration;
    return { cut: cs[k], t0, t1, k };
  }
  const setOf = (s, which) => s.sh.cuts ? s.sh.cuts[which === 'first' ? 0 : s.sh.cuts.length - 1].set : s.sh.set;

  window.frame = function (t) {
    let idx = spec.scenes.findIndex(s => t < s._end); if (idx < 0) idx = spec.scenes.length - 1;
    const s = spec.scenes[idx], lt = t - s._start, d = s.duration;
    CUR = s;
    let sh = s.sh, clt = lt, cd = d, cutK = 0;
    if (sh.cuts) {
      const ac = activeCut(s, lt); cutK = ac.k;
      sh = Object.assign({}, s.sh, ac.cut); clt = lt - ac.t0; cd = Math.max(.1, ac.t1 - ac.t0);
      if (typeof sh.acts === 'function') sh.acts = sh.acts();
      if (typeof sh.ball === 'function') sh.ball = sh.ball();
    }
    spec.scenes.forEach((x, i) => { x._ov.style.display = i === idx ? 'block' : 'none'; });
    const prev = spec.scenes[idx - 1], next = spec.scenes[idx + 1];
    let cam = camAt(sh.cam, clt, cd);
    const shake = sh.shake ? Math.max(0, 1 - clt / 1.5) * 14 : 0;
    const br = sh.bright != null ? sh.bright : 1;
    const pbr = !sh.cuts && prev && prev.sh.set === sh.set ? (prev.sh.bright != null ? prev.sh.bright : 1) : br;
    const conf = sh.conf ? (sh.conf < 1 ? P(lt, sh.conf * d, sh.conf * d + .4) : 1) : 0;
    { const f = sh.sepia ? 'sepia(.85) saturate(.75) contrast(1.05)' : ''; document.getElementById('gl').style.filter = f; cv.style.filter = f; }
    World3D.frame(t, { x: cam.x, y: cam.y, z: cam.z }, sh.set, { bright: lerp(pbr, br, eio(P(lt, 0, .8))), conf, crowd: conf ? 9 : 2, crowdAmp: conf ? 3 : 1 });
    // 2D
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
    if (sh.flat) sh.flat(t, lt, d);
    ctx.setTransform(cam.z, 0, 0, cam.z, W / 2 - cam.x * cam.z + Math.sin(t * 50) * shake, H / 2 - cam.y * cam.z + Math.cos(t * 43) * shake);
    const toF = k => typeof k[0] === 'string' ? [cue(k[0], k[1]) / d, k[2]] : k;
    const states = {}, castX = {};
    if (typeof sh.acts === 'function') sh = Object.assign({}, sh, { acts: sh.acts() });
    if (typeof sh.ball === 'function') sh = Object.assign({}, sh, { ball: sh.ball() });
    for (const name in sh.cast) states[name] = Puppet.stateAt(((sh.acts || {})[name] || [[0, {}]]).map(toF), lt, d);
    if (sh.move) for (const n in sh.move) {
      const ks = sh.move[n].map(k => typeof k[0] === 'string' ? [cue(k[0], k[1]) / d, k[2]] : k);
      let x = ks[0][1]; for (let i = 0; i < ks.length - 1; i++) if (lt / d >= ks[i][0]) x = lerp(ks[i][1], ks[i + 1][1], eio(P(lt / d, ks[i][0], ks[i + 1][0])));
      castX[n] = x;
    }
    CASTX = castX;
    if (sh.propFix) for (const n in sh.propFix) for (const [f, pr] of sh.propFix[n]) if (lt >= f * d) states[n].propL = pr;
    const drawC = name => { if (!sh.cast[name]) return; const c = Object.assign({}, CH[name], sh.cast[name], { y: sh.cast[name].y || GROUND }, castX[name] != null ? { x: castX[name] } : {});
      if (sh.looks && sh.looks[name]) for (const [n, df, ov] of sh.looks[name]) if (lt >= cue(n, df)) Object.assign(c, ov); Puppet.draw(ctx, c, states[name], t); };
    if (sh.draw) {
      sh.draw(s, lt, d, t);
    } else if (sh.set === 'flat') {
      if (sh.back) sh.back(lt, t);
      const order = sh.castOrder || Object.keys(sh.cast || {});
      order.forEach(n => { if (sh.hideCast && sh.hideCast[n] && lt / d >= sh.hideCast[n][0] && lt / d < sh.hideCast[n][1]) return; const c = sh.cast[n]; if (c && c.y) { const keep = GROUND; } drawC(n); });
      if (sh.ball) { const b = ballPos(sh.ball, lt); drawBall(b.x, b.y, b.moving ? t : 0); }
      if (sh.front) sh.front(lt, t);
      if (sh.extra) sh.extra(lt, t);
    } else if (sh.set === 'street') {
      Object.keys(sh.cast || {}).forEach(drawC);
      if (sh.draw2) sh.draw2(s, lt, d, t);
    } else if (sh.set === 'studio' && sh.draw2) {
      if (sh.set === 'studio' && s.shot === 'pexhibit') sh.draw2(s, lt, d, t);
      Object.keys(sh.cast || {}).forEach(drawC);
      if (s.shot !== 'pexhibit') sh.draw2(s, lt, d, t);
    } else if (sh.set === 'studio') {
      const after = sh.afterFence || [];
      Object.keys(sh.cast || {}).filter(n => !after.includes(n)).forEach(drawC);
      if (sh.front === 'fence' && (!sh.frontFrom || lt >= cue(sh.frontFrom[0], sh.frontFrom[1]))) fence();
      after.forEach(drawC);
      if (sh.label && sh.frontFrom && lt >= cue(sh.frontFrom[0], sh.frontFrom[1])) { const k = eb(P(lt, cue(sh.frontFrom[0], sh.frontFrom[1]), cue(sh.frontFrom[0], sh.frontFrom[1]) + .4)); ctx.save(); ctx.translate(0, 760); ctx.scale(k, k); ctx.beginPath(); ctx.roundRect(-290, -50, 580, 100, 14); ctx.fillStyle = '#1c2238'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#e0b84a'; ctx.stroke(); txt(sh.label, 0, 4, 44, '#fff', 900); ctx.restore(); }
    } else if (sh.set === 'pitch') {
      // the whole goal sits behind the players so nobody walks "through" a post
      drawGoalBack();
      drawGoalFront();
      Object.keys(sh.cast).forEach(drawC);
      if (sh.front === 'dugout') drawDugout();
      if (sh.ball) { const b = ballPos(sh.ball, lt); drawBall(b.x, b.y, b.moving ? t : 0); }
      if (sh.extra) sh.extra(lt, t);
      const sc = typeof sh.score === 'function' ? sh.score(lt) : sh.score, lb = typeof sh.label === 'function' ? sh.label(lt) : sh.label;
      if (sc) scoreboard(sc, lb);
    } else if (sh.set === 'stands') {
      Object.keys(sh.cast).forEach(drawC);
      drawRailing();
      if (sh.extraTop) sh.extraTop(clt, t);
      if (sh.notesFrom && lt > cue(sh.notesFrom, .5)) musicNotes(t, Object.keys(sh.cast).map(n => sh.cast[n].x));
    } else if (sh.set === 'bookies') {
      drawBookiesBack(t, Object.assign({ lt: lt / d }, sh.fx || {}));
      drawC('bookie'); drawCounter();
      ['hero', 'mike', 'jay'].forEach(drawC);
    } else {
      drawTV(t, sh.card === 'off' ? 'blank' : sh.card, lt, d);
      drawSofa();
      if (sh.bus) drawBus(t);
      ['mike', 'jay', 'hero'].forEach(drawC);
      if (sh.extraRoom) sh.extraRoom(lt, t);
      if (sh.notesFrom && lt > cue(sh.notesFrom, .5)) musicNotes(t, Object.keys(sh.cast).map(n => sh.cast[n].x));
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const rain = sh.rain != null ? (sh.rain > 0 ? P(lt, sh.rain * d, sh.rain * d + .3) : 1) : 0;
    moneyRain(t, rain);
    if (sh.flash) { const a = .85 * (1 - P(clt, 0, .3)); if (a > 0) { ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(0, 0, W, H); } }
    // hard cut inside a shot: tiny white blink
    if (s.sh.cuts && cutK > 0 && clt < .08) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(0, 0, W, H); }
    // iris wipe between sets
    let iris = 1;
    if (next && setOf(next, 'first') !== setOf(s, 'last')) iris = Math.min(iris, 1 - eio(P(lt, d - .3, d)));
    if (prev && setOf(prev, 'last') !== setOf(s, 'first')) iris = Math.min(iris, eio(P(lt, 0, .3)));
    if (iris < 1) {
      ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(W / 2, H * .55, Math.max(1, iris * 1250), 0, Math.PI * 2, true);
      ctx.fillStyle = OUT; ctx.fill('evenodd');
    }
    updateOverlay(s, lt, d);
  };
})();
