// =====================================================================
// "Wo wirst du diesmal geboren?" – Folge: SCHWEIZ
// Jeder Beat = ein gesprochener Satz = eine Einstellung.
// say:  Sprechertext ([Anzeige|Aussprache] für Zahlen)
// shot: Kulisse (siehe shots unten); gleiche shot-Namen hintereinander = gleiche Einstellung
// head: orange Überschrift · card: Faktenkarte · pill/stamp/bubble/age: Einblendungen
// =====================================================================
window.EPISODE = {
  country: 'Schweiz', isoId: '756', center: [8.2, 46.8], tag: 'Wo wirst du diesmal geboren?',
  sources: 'Quellen: BFS (Geburten 2023, Lebenserwartung), UN WPP (Geburten weltweit),\nBAFU (Seen), BABS (Schutzplätze), Tierschutzverordnung',
  beats: [
    { shot: 'globe', say: 'Wo wirst du diesmal geboren?', gap: 0.9 },
    { shot: 'globe', say: 'Die Schweiz. Das Wasserschloss Europas.', clouds: true, sfx: [['ding', 0.1]] },
    { shot: 'ticket', say: 'Ungefähr eine Chance von [1 zu 1.600|eins zu sechzehnhundert].', sfx: [['paper', 0.2]] },
    { shot: 'parents', say: 'Etwa [80.000|achtzigtausend] Babys kommen hier jedes Jahr zur Welt.',
      card: { big: '80.024', sub: 'Babys geboren in der\nSchweiz, 2023', src: 'BFS' } },
    { shot: 'parents', say: 'Dein Name ist Luca.', hl: ['luca.'], pill: { text: 'Luca', x: 330, y: 930, at: 0.55, bg: '#f6b93b' } },

    { shot: 'lakes', head: 'über 1.500 seen', say: 'Die Schweiz hat über [1.500|tausendfünfhundert] Seen.',
      card: { big: '1.500+', sub: 'Seen in der Schweiz', src: 'BAFU' } },
    { shot: 'rhine', head: 'der fisch', say: 'Im Sommer schwimmt man in Basel nach der Arbeit den Rhein hinunter.', sfx: [['splash', 0.4]] },
    { shot: 'rhine', head: 'der fisch', say: 'Die Kleider kommen in einen wasserdichten Fisch.', pill: { text: 'Wickelfisch', y: 760, at: 0.6 } },
    { shot: 'bunker', head: 'bunker', say: 'Für jeden Einwohner gibt es einen Platz im Schutzbunker.',
      card: { big: '~9 Mio.', sub: 'Schutzplätze im Land', src: 'BABS' }, sfx: [['door', 0.2]] },
    { shot: 'bunker', head: 'bunker', say: 'Viele lagern dort ihren Wein.', pill: { text: 'Weinkeller', y: 640, at: 0.5 } },
    { shot: 'guinea', head: 'einsam?', say: 'Und nur ein Meerschweinchen zu halten, ist verboten.', stamp: { text: 'VERBOTEN', y: 640, at: 1.6 } },
    { shot: 'guinea', head: 'einsam?', say: 'Es könnte sich einsam fühlen.', pill: { text: 'Tierschutzverordnung', y: 560, at: 0.4, size: 34 }, sfx: [['squeak', 0.3]] },

    { shot: 'kinder', age: 'mit 6', head: 'allein', say: 'Mit sechs läuft Luca allein zum Kindergarten.' },
    { shot: 'kinder', age: 'mit 6', head: 'allein', say: 'Mit einem leuchtenden Dreieck um den Hals. Alle Kinder tragen es.', pill: { text: 'Leuchtdreieck', y: 560, at: 0.4 } },
    { shot: 'pets', age: 'mit 10', head: 'gesetz ist gesetz', say: 'Mit zehn wünscht er sich ein Meerschweinchen.' },
    { shot: 'pets', age: 'mit 10', head: 'gesetz ist gesetz', say: 'Er bekommt zwei.', sfx: [['squeak', 0.3], ['squeak', 0.55]] },
    { shot: 'train', age: 'mit 16', head: '2 minuten', say: 'Mit sechzehn kommt sein Zug zwei Minuten zu spät.', pill: { text: '+2 Min.', x: 760, y: 560, at: 1.0, bg: '#fff', fg: '#d23c2c' }, sfx: [['horn', 1.2]] },
    { shot: 'dinner', age: 'mit 16', head: '2 minuten', say: 'Die Familie redet noch jahrelang davon.', bubble: { text: 'Weisch no? Die 2 Minute!', x: 600, y: 700, at: 0.3 } },
    { shot: 'berlin', age: 'mit 22', head: 'berlin', say: 'Mit [22|zweiundzwanzig] zieht er nach Berlin.' },
    { shot: 'party', age: 'mit 22', head: 'pünktlich', say: 'Er kommt pünktlich zur Party. Er ist der Einzige.', pill: { text: 'Einladung: 20 Uhr', y: 560, at: 0.3 } },
    { shot: 'street', say: 'Jemand sagt: Du bist aus der Schweiz, oder?', bubble: { text: 'Du bist aus der Schweiz, oder?', x: 640, y: 760, at: 0.6 } },
    { shot: 'street', say: 'Wow. Woher weißt du das?', bubble: { text: 'Wow. Woher weisst du das?', x: 400, y: 760, at: 0.1 } },
    { shot: 'wedding', age: 'mit 30', head: 'hochzeit', say: 'Mit dreißig zieht er zurück und heiratet Lina.', sfx: [['bells', 0.6]] },
    { shot: 'fondue', age: 'mit 30', head: 'fondue', say: 'Wer beim Fondue sein Brot verliert, zahlt die nächste Runde.', stamp: { text: 'RUNDE ZAHLEN!', y: 640, at: 2.4 }, sfx: [['plop', 1.6]] },
    { shot: 'old', say: 'Die Menschen hier werden fast [84|vierundachtzig] Jahre alt.',
      card: { big: '~84 Jahre', size: 92, sub: 'Lebenserwartung\nin der Schweiz', src: 'BFS 2023' } },
    { shot: 'old', head: 'wasserschloss', say: 'Luca wird alt im Wasserschloss Europas.' },
    { shot: 'cb_rhine', head: 'immer noch.', say: 'Immer noch im Rhein unterwegs.' },
    { shot: 'cb_guinea', head: 'immer noch.', say: 'Immer noch zwei Meerschweinchen.' },
    { shot: 'cb_bunker', head: 'immer noch.', say: 'Immer noch Wein im Bunker.' },
    { shot: 'cb_train', head: 'immer noch.', say: 'Immer noch sauer auf diesen einen Zug.' },
    { shot: 'globe_end', say: 'Wo wirst du nächstes Mal geboren?', tail: 2.6 },
  ],

  // -------------------------------------------------------------------
  // Country-specific shots. (u = time in this shot, b = beat, lu = time in beat)
  // -------------------------------------------------------------------
  shots: (G) => {
    const ST = {
      mom:   { skin: '#efc29e', hair: '#8a4b2a', hair_: 'long', top: '#5aa897', pants: '#3b3b58' },
      dad:   { skin: '#f0c6a2', hair: '#3a2a20', hair_: 'short', top: '#56783a', pattern: 'stripes', pcol: '#6e9450', pants: '#4a4036', glasses: true },
      luca:  { skin: '#f1c4a0', hair: '#6b4429', hair_: 'boy', top: '#c8352b', pattern: 'zigzag', pcol: '#fff', pants: '#34496e', shoe: '#f2f2f2' },
      lina:  { skin: '#f3cfb3', hair: '#c98b3e', hair_: 'long', top: '#fdfdfd', pants: '#fdfdfd', dress: '#ffffff', veil: true },
      ber:   { skin: '#c99a75', hair: '#222', hair_: 'short', top: '#2b2b2b', pants: '#222', beard: true },
      kidA:  { skin: '#8d5a3b', hair: '#1a1a1a', hair_: 'curly', top: '#4d8fe8', pants: '#333', reflector: true },
      kidB:  { skin: '#f6d3b3', hair: '#e0b04a', hair_: 'long', top: '#62b86f', pants: '#5b4b8a', reflector: true },
      man:   { skin: '#f3cdb0', hair: '#555', hair_: 'bald', top: '#7d6a8f', pants: '#3a3a3a', glasses: true, mustache: true },
      swimA: { skin: '#e8b48f', hair: '#3b2416', hair_: 'short', top: '#fff', pants: '#fff' },
      swimB: { skin: '#f4d1b2', hair: '#c9963f', hair_: 'long', top: '#fff', pants: '#fff' },
      guestA:{ skin: '#d59d78', hair: '#3b2416', hair_: 'short', top: '#4d8fe8', pants: '#333' },
      guestB:{ skin: '#a8714f', hair: '#1f1a17', hair_: 'bun', top: '#e07b9a', pants: '#444' },
    };
    const kid = { ...ST.luca, reflector: false };
    const old = { ...ST.luca, hair: '#d8d8d8', top: '#8b6b55', pcol: '#e8d9c0', glasses: true, wrinkles: true, cane: true };
    const oldLina = { ...ST.lina, hair: '#cfcfcf', hair_: 'bun', veil: false, dress: '#8fb3d9', top: '#8fb3d9', wrinkles: true, glasses: true };
    const P = G.person;

    const guineaPig = (x, y, s, t, col = '#b8763d', ph = 0) => {
      const ctx = G.ctx; ctx.save(); ctx.translate(x, y + Math.sin(t * 6 + ph) * 2); ctx.scale(s, s);
      ctx.beginPath(); ctx.ellipse(0, 0, 70, 46, 0, 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = G.INK; ctx.lineWidth = 4; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-20, -6, 30, 30, 0, 0, 7); ctx.fillStyle = '#fbf3e6'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(52, -30, 13, 10, -0.4, 0, 7); ctx.fillStyle = '#e8a989'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(46, -8, 6, 0, 7); ctx.fillStyle = '#222'; ctx.fill();
      ctx.beginPath(); ctx.arc(70, 6, 6, 0, 7); ctx.fillStyle = '#e88a8a'; ctx.fill();
      for (const fx of [-40, 30]) { ctx.beginPath(); ctx.ellipse(fx, 44, 12, 6, 0, 0, 7); ctx.fillStyle = '#e8a989'; ctx.fill(); }
      ctx.restore();
    };
    const fishBag = (x, y, s, col = '#f28c28', rot = 0) => {
      const ctx = G.ctx; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
      ctx.beginPath(); ctx.ellipse(0, 0, 70, 34, 0, 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = G.INK; ctx.lineWidth = 4; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-64, 0); ctx.lineTo(-104, -30); ctx.lineTo(-104, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(40, -8, 8, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(42, -8, 3.5, 0, 7); ctx.fillStyle = '#222'; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 3; for (const sx of [-20, 0, 20]) { ctx.beginPath(); ctx.arc(sx, 0, 18, -1, 1); ctx.stroke(); }
      ctx.restore();
    };
    const river = (u) => {
      const ctx = G.ctx; G.skyBg();
      const cols = ['#e8c07a', '#d98b6a', '#c9d6a3', '#e3a6a0', '#a9c4de', '#f0d9a8'];
      for (let i = 0; i < 9; i++) { const x = -40 + i * 130, h = 260 + (i * 53) % 140; G.rrect(x, 900 - h, 128, h, 2, cols[i % 6]);
        for (let wy = 900 - h + 30; wy < 860; wy += 70) for (const wx of [20, 72]) G.rrect(x + wx, wy, 34, 42, 2, '#fdf6e3', G.INK, 3); ctx.beginPath(); ctx.moveTo(x - 6, 900 - h); ctx.lineTo(x + 64, 900 - h - 60); ctx.lineTo(x + 134, 900 - h); ctx.closePath(); ctx.fillStyle = '#9b4a33'; ctx.fill(); ctx.strokeStyle = G.INK; ctx.lineWidth = 3; ctx.stroke(); }
      // Münster towers
      for (const tx of [760, 860]) { G.rrect(tx, 420, 70, 480, 2, '#b8563f'); ctx.beginPath(); ctx.moveTo(tx - 6, 422); ctx.lineTo(tx + 35, 300); ctx.lineTo(tx + 76, 422); ctx.closePath(); ctx.fillStyle = '#5e7a5a'; ctx.fill(); ctx.stroke(); }
      G.ground(900, '#c9b48f'); ctx.fillStyle = '#5b9fd0'; ctx.fillRect(0, 960, G.W, 600);
      ctx.fillStyle = '#c9a27a'; ctx.fillRect(0, 930, G.W, 34); ctx.strokeStyle = G.INK; ctx.lineWidth = 3; ctx.strokeRect(-4, 930, G.W + 8, 34);
      for (let x = 60; x < G.W; x += 260) { ctx.beginPath(); ctx.arc(x + 130, 1000, 90, Math.PI, 0); ctx.fillStyle = '#5b9fd0'; ctx.fill(); }
      for (let x = 0; x < G.W; x += 40) { ctx.fillStyle = '#8b6b4e'; ctx.fillRect(x, 906, 6, 24); }
      for (const tx of [40, 1000]) G.tree(tx, 905, 0.8, '#6aa04a');
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 14; i++) { const y = 1000 + (i * 37) % 520, x = ((i * 211 + u * 60) % 1300) - 150; ctx.fillRect(x, y, 120, 5); }
      G.ground(1560, '#c9b48f');
    };
    const platform = (u, arrive = 0) => {
      const ctx = G.ctx; G.skyBg(); G.mountains(840, '#a9bdd6', 6, 300); G.ground(900, '#9aa0a6');
      ctx.fillStyle = '#6b5a4c'; ctx.fillRect(0, 1010, G.W, 40);
      const fx = G.lerp(1300, 80, G.easeOut(arrive));
      ctx.save(); ctx.translate(fx, 0); G.rrect(0, 760, 1500, 260, [70, 14, 14, 14], '#d63a2e'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 930, 1500, 16);
      for (let i = 0; i < 6; i++) G.rrect(100 + i * 220, 800, 150, 90, 12, '#cfe9fb'); ctx.restore();
      G.ground(1050, '#c9c6c0'); ctx.fillStyle = '#f2c94c'; ctx.fillRect(0, 1060, G.W, 12);
      ctx.fillStyle = '#56606e'; ctx.fillRect(0, 300, G.W, 40); ctx.strokeStyle = G.INK; ctx.lineWidth = 4; ctx.strokeRect(-4, 300, G.W + 8, 40);
      for (const px of [420, 980]) { ctx.fillStyle = '#56606e'; ctx.fillRect(px, 340, 24, 720); ctx.strokeRect(px, 340, 24, 720); }
      G.departures(560, 400); G.bench(840, 1200, 1);
      // station clock
      ctx.strokeStyle = G.INK; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(150, 380); ctx.lineTo(150, 520); ctx.stroke();
      ctx.beginPath(); ctx.arc(150, 580, 70, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 7; ctx.stroke();
      for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(150 + Math.sin(a) * 50, 580 - Math.cos(a) * 50); ctx.lineTo(150 + Math.sin(a) * 60, 580 - Math.cos(a) * 60); ctx.stroke(); }
      const ma = 54 / 60 * 6.283, ha = (7 + 54 / 60) / 12 * 6.283;
      ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(150, 580); ctx.lineTo(150 + Math.sin(ha) * 32, 580 - Math.cos(ha) * 32); ctx.stroke();
      ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(150, 580); ctx.lineTo(150 + Math.sin(ma) * 50, 580 - Math.cos(ma) * 50); ctx.stroke();
    };
    const bunkerRoom = (u, wine) => {
      const ctx = G.ctx; ctx.fillStyle = '#b7b9b6'; ctx.fillRect(0, 0, G.W, G.H);
      ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 3; for (let y = 300; y < 1100; y += 90) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(G.W, y); ctx.stroke(); }
      G.ground(1100, '#8d8f8c');
      for (const py of [330, 380]) { ctx.fillStyle = '#8f8f8f'; ctx.fillRect(0, py, G.W, 18); ctx.strokeStyle = G.INK; ctx.lineWidth = 3; ctx.strokeRect(-4, py, G.W + 8, 18); }
      G.rrect(470, 470, 120, 80, 6, '#f6d36b'); G.txt('SCHUTZRAUM', 530, 512, 18, G.INK);
      G.rrect(40, 1060, 200, 30, 4, '#6b6f6c'); G.rrect(880, 1000, 180, 90, 6, '#7d8f6a'); G.rrect(900, 940, 140, 70, 6, '#8f9f7a');
      ctx.beginPath(); ctx.arc(250, 820, 210, 0, 7); ctx.fillStyle = '#9ea29f'; ctx.fill(); ctx.strokeStyle = G.INK; ctx.lineWidth = 8; ctx.stroke();
      ctx.beginPath(); ctx.arc(250, 820, 150, 0, 7); ctx.fillStyle = '#c4c7c3'; ctx.fill(); ctx.stroke();
      ctx.save(); ctx.translate(250, 820); ctx.rotate(u * 0.3); ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-80, 0); ctx.lineTo(80, 0); ctx.moveTo(0, -80); ctx.lineTo(0, 80); ctx.stroke(); ctx.restore();
      if (wine > 0) { G.rrect(600, 650, 400, 420, 6, '#8b5a3c');
        for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { const p = G.prog(wine, (r * 5 + c) * 0.03, (r * 5 + c) * 0.03 + 0.2); if (p <= 0) continue;
          ctx.beginPath(); ctx.arc(640 + c * 80, 700 + r * 95, 26 * G.easeBack(p), 0, 7); ctx.fillStyle = ['#5e1f2b', '#2f4a2a', '#5e1f2b', '#7a2f3d'][(r + c) % 4]; ctx.fill(); ctx.strokeStyle = G.INK; ctx.lineWidth = 3; ctx.stroke(); } }
    };
    const guineaRoom = (u) => { G.room(); G.windowView(640, 360, 300, 300); G.frame(120, 420, 160, 120, 'flower'); G.shelf(110, 760, 330, 5);
      G.plant(980, 1060, 0.9); G.rug(540, 1330, 380, 70, '#d9a26a'); G.cage(140, 1200, 800, 300); };
    const kStreet = (u) => {
      const ctx = G.ctx; G.skyBg(); G.mountains(820, '#a9bdd6', 13, 300);
      G.rrect(560, 600, 420, 300, 2, '#f2d27a'); ctx.beginPath(); ctx.moveTo(540, 610); ctx.lineTo(770, 480); ctx.lineTo(1000, 610); ctx.closePath(); ctx.fillStyle = '#c0533a'; ctx.fill(); ctx.strokeStyle = G.INK; ctx.lineWidth = 4; ctx.stroke();
      G.txt('Kindergarten', 770, 650, 38, G.INK); for (const wx of [600, 700, 840, 900]) G.rrect(wx, 700, 50, 60, 2, '#cfe9fb', G.INK, 3);
      G.fir(120, 900, 1); G.fir(250, 905, 0.8);
      G.ground(900, G.PAL.grass); ctx.fillStyle = G.PAL.walk; ctx.fillRect(0, 1000, G.W, 140); ctx.fillStyle = G.PAL.street; ctx.fillRect(0, 1140, G.W, 500);
      ctx.fillStyle = '#fff'; for (let x = 60; x < G.W; x += 160) ctx.fillRect(x, 1260, 90, 14);
      ctx.fillStyle = '#f4f1e8'; for (let x = 400; x < 680; x += 46) ctx.fillRect(x, 1150, 26, 480);
      G.fence(960, 0, 520); G.bush(470, 960, 0.7); G.sign(990, 1000, 'kids'); G.cloudShape(300, 340, 0.9); G.bird(200, 450, u);
    };
    const party = (u) => {
      const ctx = G.ctx; G.room('#3e3557', 1080, '#2a2340');
      for (let i = 0; i < 12; i++) { const x = 40 + i * 90; ctx.beginPath(); ctx.moveTo(x, 300); ctx.lineTo(x + 45, 360); ctx.lineTo(x + 90, 300); ctx.strokeStyle = ['#f4a62a', '#e07b9a', '#5aa897'][i % 3]; ctx.lineWidth = 6; ctx.stroke(); }
      ctx.beginPath(); ctx.arc(820, 700, 80, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = G.INK; ctx.lineWidth = 6; ctx.stroke();
      ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(820, 700); ctx.lineTo(820, 640); ctx.moveTo(820, 700); ctx.lineTo(772, 700); ctx.stroke();
      G.balloon(140, 520, '#e86a5f', u); G.balloon(220, 560, '#f6d36b', u, 1); G.balloon(960, 540, '#5aa897', u, 2);
      ctx.strokeStyle = G.INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(540, 0); ctx.lineTo(540, 420); ctx.stroke();
      G.circ(540, 450, 34, '#c9ccd2'); for (let i = 0; i < 6; i++) G.circ(540 + Math.cos(i + u) * 18, 450 + Math.sin(i * 2) * 18, 5, '#fff', 0);
      G.rrect(40, 860, 330, 40, 6, '#8b5a3c'); G.rrect(60, 900, 20, 180, 3, '#6b4a2e'); G.rrect(330, 900, 20, 180, 3, '#6b4a2e');
      G.pretzel(120, 840, 0.6); G.pretzel(210, 845, 0.55); ctx.beginPath(); ctx.ellipse(300, 845, 46, 14, 0, 0, 7); ctx.fillStyle = '#e0a640'; ctx.fill(); ctx.stroke();
      G.rrect(900, 840, 120, 240, 10, '#2b2b2b'); G.circ(960, 900, 30, '#555'); G.circ(960, 1000, 40, '#555');
      G.rrect(640, 900, 260, 150, 30, '#c0533a'); G.rrect(620, 960, 300, 110, 24, '#d9694c');
    };
    const berlinBg = (u) => {
      const ctx = G.ctx; G.skyBg('#a9c7de', '#e0ecf3');
      const cols = ['#c9b6a6', '#a8b5c4', '#d9c2a0', '#b5a8c4', '#9fb5a6'];
      for (let i = 0; i < 8; i++) { const x = -30 + i * 140, h = 300 + (i * 97) % 260; G.rrect(x, 940 - h, 136, h, 2, cols[i % 5]); for (let wy = 960 - h; wy < 900; wy += 60) for (const wx of [18, 76]) G.rrect(x + wx, wy, 36, 34, 2, '#f3efe4', G.INK, 2); }
      ctx.strokeStyle = G.INK; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(760, 940); ctx.lineTo(760, 330); ctx.stroke(); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(760, 330); ctx.lineTo(760, 220); ctx.stroke();
      ctx.beginPath(); ctx.arc(760, 420, 46, 0, 7); ctx.fillStyle = '#c9ccd2'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
      G.ground(940, G.PAL.walk); ctx.fillStyle = G.PAL.street; ctx.fillRect(0, 1180, G.W, 500);
      G.tree(110, 1000, 1, '#6aa04a'); G.tree(980, 1000, 1.1, '#5c9b4a'); G.streetLamp(260, 1000); G.streetLamp(880, 1000);
      G.rrect(420, 800, 200, 140, 6, '#e8d7b0'); G.txt('SPÄTI', 520, 830, 30, G.INK); G.rrect(440, 860, 160, 70, 4, '#bfe3f7', G.INK, 3);
      ctx.strokeStyle = G.INK; ctx.lineWidth = 5; for (const bx of [680, 760]) { ctx.beginPath(); ctx.arc(bx, 1060, 26, 0, 7); ctx.moveTo(bx + 96, 1060); ctx.arc(bx + 70, 1060, 26, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(bx, 1060); ctx.lineTo(bx + 30, 1020); ctx.lineTo(bx + 70, 1060); ctx.stroke(); }
    };
    const fondueTable = (u, lu, b) => {
      const ctx = G.ctx; G.room('#f1e2c7', 1080, '#b8402f'); G.cuckooClock(170, 380, u); G.frame(760, 330, 200, 150, 'mountain'); G.pendant(540, 260);
      G.shelf(700, 640, 300, 4);
      G.rrect(80, 980, 920, 60, 10, '#fff'); ctx.fillStyle = '#d23c2c'; for (let x = 80; x < 1000; x += 46) ctx.fillRect(x, 1040, 23, 140); G.rrect(80, 1040, 920, 140, 0, null);
      for (const x of [190, 890]) G.plate(x, 960, 'none');
      G.drawProp('wine', 300, 950, 1.1); G.drawProp('wine', 780, 950, 1.1);
      ctx.beginPath(); ctx.ellipse(900, 920, 70, 26, 0, 0, 7); ctx.fillStyle = '#c99a5a'; ctx.fill(); ctx.strokeStyle = G.INK; ctx.lineWidth = 3; ctx.stroke(); for (let i = 0; i < 5; i++) G.rrect(850 + i * 20, 890 - (i % 2) * 8, 26, 22, 6, '#e3b26a', G.INK, 2.5);
      // caquelon
      ctx.beginPath(); ctx.ellipse(540, 900, 170, 40, 0, 0, 7); ctx.fillStyle = '#f6d36b'; ctx.fill(); ctx.strokeStyle = G.INK; ctx.lineWidth = 5; ctx.stroke();
      for (let i = 0; i < 5; i++) { const ph = (u * 0.8 + i * 0.37) % 1; ctx.beginPath(); ctx.arc(460 + i * 40, 900 - ph * 12, 8 * (1 - ph) + 2, 0, 7); ctx.fillStyle = '#fde9a0'; ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(370, 900); ctx.quadraticCurveTo(380, 1010, 540, 1010); ctx.quadraticCurveTo(700, 1010, 710, 900); ctx.closePath(); ctx.fillStyle = '#c0392b'; ctx.fill(); ctx.stroke();
      // fork + bread falling
      const tb = (b.words.find(w => w.text.startsWith('Brot')) || b.words[3]).start - b.a, k = G.prog(lu, tb, tb + 0.6);
      ctx.strokeStyle = '#888'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(760, 560); ctx.lineTo(600, 780); ctx.stroke();
      ctx.save(); ctx.translate(G.lerp(596, 560, k), G.lerp(790, 905, G.easeOut(k)) ); ctx.rotate(k * 2); G.rrect(-22, -18, 44, 36, 8, '#e3b26a'); ctx.restore();
      if (k > 0.9) for (let i = 0; i < 6; i++) { const a = i * 1.05, r = 60 * G.easeOut(G.prog(lu, tb + 0.55, tb + 0.9)); ctx.beginPath(); ctx.arc(560 + Math.cos(a) * r, 890 + Math.sin(a) * r * 0.4, 7, 0, 7); ctx.fillStyle = '#f6d36b'; ctx.fill(); }
    };

    return {
      globe(u, b, t, lu) {
        const iEnd = b.words === undefined ? 0 : 0;
        const second = b.say.startsWith('Die');
        const t2 = second ? u - lu : 1e9; // start of 2nd beat in shot time
        const k = second ? lu : 0;
        G.globeShot(t, { spinLon: -60 + u * 40, rotK: G.prog(k, 0, 1.2), pinDrop: G.prog(k, 0.9, 1.3), zoomK: G.prog(k, 1.0, 2.4), hl: G.prog(k, 1.2, 1.6) });
        if (!second) { G.txt('Wo wirst du', 540, 330, 78, '#fff', { stroke: '#1d2b4f', lw: 10 }); G.txt('diesmal geboren?', 540, 425, 78, '#ffcf3f', { stroke: '#1d2b4f', lw: 10 }); }
        else {
          const p = G.prog(k, 1.1, 1.5);
          if (p > 0) { G.ctx.globalAlpha = p; G.txt('Schweiz', 540, 330, 84, '#fff', { stroke: '#1d2b4f', lw: 12 }); G.txt('das Wasserschloss Europas', 540, 430, 62, '#ffcf3f', { stroke: '#1d2b4f', lw: 10 }); G.ctx.globalAlpha = 1; }
        }
      },
      ticket(u, b, t, lu) {
        G.alpsVillage(t);
        P(t, ST.dad, { x: 180, feet: 1420, pose: 'wave', expr: 'happy', phase: 1 });
        const p = G.prog(lu, 0.1, 0.45), ctx = G.ctx;
        ctx.save(); ctx.translate(560, G.lerp(500, 760, G.easeBack(p))); ctx.rotate(-0.02); ctx.globalAlpha = G.clamp(p * 3);
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(-300, -190, 620, 400);
        G.rrect(-310, -200, 620, 400, 10, G.PAL.cream, G.INK, 5);
        ctx.setLineDash([10, 8]); G.rrect(-290, -180, 580, 360, 6, null, '#b9ab93', 3); ctx.setLineDash([]);
        G.txt('TICKET INS LEBEN', 0, -145, 30, '#6d625a', { weight: 600 });
        G.txt('Schweiz · Europa', 0, -95, 46, '#2e2622');
        G.txt('Junge', 0, -52, 32, G.PAL.orange, { weight: 600 });
        G.txt('1 zu 1.600', 0, 20, 112, G.PAL.orange, { stroke: '#5b3b1d', lw: 14 });
        G.txt('Chance, in der Schweiz geboren zu werden', 0, 100, 30, '#2e2622', { weight: 600 });
        G.txt('ca. 80.000 von 132 Mio. Geburten', 0, 145, 24, '#6d625a', { weight: 500 });
        ctx.restore();
      },
      parents(u, b, t, lu) {
        G.room(); G.windowView(420, 330, 260, 240); G.cuckooClock(860, 420, t); G.frame(120, 400, 150, 190, 'portrait');
        G.floorLamp(110, 1080); G.plant(990, 1080, 0.8); G.rug(540, 1400, 420, 70);
        P(t, ST.mom, { x: 330, feet: 1420, pose: 'cradle', expr: 'content', phase: 0.2, baby: true });
        P(t, ST.dad, { x: 720, feet: 1420, pose: 'wave', expr: 'excited', phase: 1.3 });
      },
      lakes(u, b, t) {
        const ctx = G.ctx; G.skyBg(); G.mountains(820, '#a9bdd6', 31, 380); G.mountains(880, '#8ea6c6', 17, 220, false);
        G.ground(880, G.PAL.grass); ctx.fillStyle = '#5b9fd0'; ctx.fillRect(0, 960, G.W, 380); G.ground(1340, G.PAL.grass);
        for (let i = 0; i < 3; i++) { const x = (i * 360 + u * 30) % 1300 - 120, y = 1060 + i * 90; ctx.beginPath(); ctx.moveTo(x - 60, y); ctx.lineTo(x + 60, y); ctx.lineTo(x + 40, y + 30); ctx.lineTo(x - 40, y + 30); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = G.INK; ctx.lineWidth = 3; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x, y - 110); ctx.lineTo(x + 60, y - 10); ctx.closePath(); ctx.fillStyle = ['#f4a62a', '#e8f1f8', '#d23c2c'][i]; ctx.fill(); ctx.stroke(); }
        G.chalet(900, 900, 0.6); G.fir(120, 895, 0.9); G.fir(230, 895, 0.7); G.cloudShape(250, 330, 1); G.cloudShape(830, 420, 0.7); G.bird(600, 480, u); G.bird(650, 500, u + 0.4, 0.8);
        G.flowers(1360, 1500, 8, 26); G.bench(820, 1420, 0.9);
      },
      rhine(u, b, t, lu) {
        river(u);
        const second = b.say.startsWith('Die');
        for (let i = 0; i < 4; i++) { const x = ((i * 300 + u * 70) % 1400) - 200, y = 1080 + (i % 2) * 170;
          P(t, i % 2 ? ST.swimB : ST.swimA, { x, feet: y, swimming: true, expr: 'content', phase: i, scale: 1 });
          fishBag(x + 120, y - 10, 0.75, ['#f28c28', '#3fa34d', '#d23c2c', '#2f7fd1'][i], Math.sin(t * 2 + i) * 0.08); }
        if (second) { const p = G.prog(lu, 0.2, 0.5); if (p > 0) fishBag(540, 600, 2.2 * G.easeBack(p), '#f28c28', -0.05); }
      },
      bunker(u, b, t, lu) {
        const second = b.say.startsWith('Viele');
        bunkerRoom(u, second ? lu : 0);
        P(t, ST.man, { x: 520, feet: 1420, pose: second ? 'hold' : 'present', prop: second ? 'wine' : null, expr: second ? 'content' : 'happy', phase: 0.4 });
      },
      guinea(u, b, t, lu) {
        guineaRoom(u); const second = b.say.startsWith('Es');
        guineaPig(second ? 420 : 540, 1120, 1.5, t, '#b8763d');
        if (second) { const p = G.prog(lu, 0.6, 1.0); if (p > 0) { guineaPig(G.lerp(1300, 700, G.easeOut(p)), 1130, 1.4, t, '#4a3a2e', 1); G.heart(560, 980 - G.prog(lu, 1.1, 2.5) * 90, 1.6, G.prog(lu, 1.0, 1.3)); } }
        else { const q = G.prog(lu, 0.6, 1.0); if (q > 0) { G.thought(720, 960, 1, q); ctx_q(G, q); } }
      },
      kinder(u, b, t, lu) {
        kStreet(u); const second = b.say.startsWith('Mit einem');
        P(t, { ...kid, reflector: true }, { x: G.lerp(200, 520, G.clamp(u / 6)), feet: 1260, scale: 0.68, walk: true, pose: 'idle', expr: 'happy', phase: 0.3 });
        if (second) { P(t, ST.kidA, { x: G.lerp(-100, 250, G.easeOut(G.prog(lu, 0.4, 1.4))), feet: 1270, scale: 0.62, walk: true, expr: 'happy', phase: 1 });
          P(t, ST.kidB, { x: G.lerp(1200, 830, G.easeOut(G.prog(lu, 1.0, 2.0))), feet: 1270, scale: 0.62, walk: true, flip: true, expr: 'happy', phase: 2 }); }
      },
      pets(u, b, t, lu) {
        G.room('#e6eef3'); G.windowView(660, 330, 280, 260); const second = b.say.startsWith('Er');
        G.frame(150, 360, 140, 180, 'portrait'); G.shelf(380, 700, 240, 9); G.rug(540, 1360, 420, 70, '#8fb3d9');
        G.rrect(820, 900, 220, 180, 10, '#d6a874'); G.rrect(840, 860, 180, 50, 14, '#fff');
        P(t, kid, { x: 330, feet: 1400, scale: 0.72, pose: second ? 'tada' : 'present', expr: second ? 'excited' : 'happy', phase: 0.5 });
        if (second) { guineaPig(600, 1340, 0.9, t, '#b8763d'); const p = G.prog(lu, 0.4, 0.8); if (p > 0) guineaPig(800, G.lerp(900, 1340, G.easeBack(p)), 0.9, t, '#4a3a2e', 1); }
        else G.drawProp('gift', 640, 1330, 1.6);
      },
      train(u, b, t, lu) {
        platform(u, G.prog(lu, 0.8, 2.6));
        P(t, { ...ST.luca }, { x: 360, feet: 1420, scale: 0.9, pose: G.prog(lu, 0, 1) < 1 ? 'hips' : 'shrug', expr: lu < 1.2 ? 'doubt' : 'grumpy', phase: 0.7 });
      },
      dinner(u, b, t, lu) {
        G.room('#efe0c4'); G.windowView(400, 330, 280, 240); G.cuckooClock(820, 430, t); G.frame(110, 380, 150, 120, 'mountain'); G.pendant(540, 200);
        P(t, ST.mom, { x: 230, sit: true, seatY: 1180, hideLegs: true, pose: 'present', expr: 'excited', phase: 0.3 });
        P(t, ST.dad, { x: 540, sit: true, seatY: 1180, hideLegs: true, pose: 'shrug', expr: 'doubt', phase: 1.1 });
        P(t, ST.luca, { x: 850, sit: true, seatY: 1180, hideLegs: true, scale: 0.92, pose: 'sitdesk', expr: 'grumpy', phase: 2 });
        G.rrect(60, 1150, 960, 40, 8, '#fff'); G.rrect(60, 1190, 960, 260, 0, '#c9a27a');
        G.plate(360, 1140, 'roesti'); G.plate(720, 1140, 'roesti'); G.cheeseWheel(540, 1150, 0.7);
      },
      berlin(u, b, t) {
        berlinBg(u);
        P(t, ST.luca, { x: G.lerp(-120, 520, G.clamp(u / 2.2)), feet: 1300, walk: u < 2.2, pose: 'hold', prop: 'suitcase', expr: 'happy', phase: 0.4 });
      },
      party(u, b, t, lu) {
        party(u);
        P(t, ST.luca, { x: 560, feet: 1420, pose: 'hold', prop: 'gift', expr: lu > 2.2 ? 'doubt' : 'happy', phase: 0.9, look: lu > 2.2 ? -1.5 : 0 });
      },
      street(u, b, t, lu) {
        berlinBg(u);
        P(t, ST.luca, { x: 330, feet: 1420, pose: 'hold', prop: 'watch', expr: b.say.startsWith('Wow') ? 'surprised' : 'happy', phase: 0.2 });
        P(t, ST.ber, { x: 760, feet: 1420, pose: 'present', flip: true, expr: 'thinking', phase: 1.4 });
      },
      wedding(u, b, t) {
        G.alpsVillage(t); G.bunting(560, 0, G.W);
        G.ctx.lineWidth = 14; G.ctx.beginPath(); G.ctx.arc(530, 1200, 230, Math.PI, 0); G.ctx.strokeStyle = '#f3ead8'; G.ctx.stroke();
        for (let i = 0; i < 16; i++) { const a = Math.PI + i * Math.PI / 15; G.circ(530 + Math.cos(a) * 230, 1200 + Math.sin(a) * 230, 14, ['#e86a8a', '#fff', '#f6d36b'][i % 3], 2.5); }
        P(t, ST.guestA, { x: 130, feet: 1400, scale: 0.85, pose: 'cheer', expr: 'excited', phase: 0.1 });
        P(t, ST.luca, { x: 420, feet: 1420, pose: 'wave', expr: 'excited', phase: 0.6 });
        P(t, ST.lina, { x: 640, feet: 1420, pose: 'wave', expr: 'happy', phase: 1.6 });
        P(t, ST.guestB, { x: 940, feet: 1400, scale: 0.85, pose: 'cheer', expr: 'excited', phase: 2.1 });
        for (let i = 0; i < 20; i++) { const x = (i * 97 + u * 40) % 1080, y = (i * 173 + u * 120) % 900 + 300; G.ctx.fillStyle = ['#f4a62a', '#e07b9a', '#fff'][i % 3]; G.ctx.fillRect(x, y, 12, 8); }
      },
      fondue(u, b, t, lu) { fondueTable(u, lu, b); },
      old(u, b, t) {
        G.alpsVillage(t);
        P(t, { ...ST.dad, hair: '#cfcfcf', wrinkles: true, cane: true }, { x: 170, feet: 1420, pose: 'cane', expr: 'content', phase: 0.3 });
        P(t, old, { x: 440, feet: 1420, pose: 'cane', expr: 'happy', phase: 1 });
        P(t, oldLina, { x: 680, feet: 1420, pose: 'wave', expr: 'happy', phase: 2 });
        P(t, { ...ST.guestB, hair: '#d0d0d0', wrinkles: true }, { x: 920, feet: 1420, pose: 'idle', expr: 'content', phase: 2.7 });
      },
      cb_rhine(u, b, t) { river(u); P(t, old, { x: 360 + u * 30, feet: 1180, swimming: true, expr: 'content', phase: 0.5 }); fishBag(520 + u * 30, 1170, 0.8, '#f28c28'); },
      cb_guinea(u, b, t) { guineaRoom(u); P(t, old, { x: 280, feet: 1420, pose: 'cane', expr: 'content', phase: 0.6 }); guineaPig(600, 1340, 0.9, t, '#b8763d'); guineaPig(820, 1345, 0.9, t, '#4a3a2e', 1); },
      cb_bunker(u, b, t) { bunkerRoom(u, 5); P(t, old, { x: 480, feet: 1420, pose: 'hold', prop: 'wine', expr: 'content', phase: 0.5 }); },
      cb_train(u, b, t) { platform(u, 1); P(t, old, { x: 380, feet: 1420, pose: 'cane', expr: 'grumpy', phase: 0.8, look: -1.2 }); },
      globe_end(u, b, t) {
        G.globeShot(t, { spinLon: -20 + u * 40 });
        G.txt('Wo wirst du', 540, 330, 78, '#fff', { stroke: '#1d2b4f', lw: 10 }); G.txt('nächstes Mal geboren?', 540, 425, 78, '#ffcf3f', { stroke: '#1d2b4f', lw: 10 });
        EP_SRC(G);
      },
    };
  },
};
function EP_SRC(G) { window.EPISODE.sources.split('\n').forEach((l, i) => G.txt(l, 540, 1780 + i * 30, 22, 'rgba(255,255,255,0.7)', { weight: 500 })); }

function ctx_q(G, q) { const c = G.ctx; c.save(); c.globalAlpha = q; c.translate(720, 960); c.scale(0.55, 0.55); c.beginPath(); c.ellipse(0, 0, 70, 46, 0, 0, 7); c.fillStyle = '#b8763d'; c.fill(); c.strokeStyle = G.INK; c.lineWidth = 6; c.stroke(); c.beginPath(); c.arc(46, -8, 7, 0, 7); c.fillStyle = '#222'; c.fill(); c.restore(); }
