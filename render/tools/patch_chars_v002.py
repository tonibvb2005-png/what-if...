def sub(p,a,b):
    s=open(p).read(); assert a in s, (p,a[:70]); s2=s.replace(a,b,1); open(p,'w').write(s2)
C='src/chars.js'
sub(C,"function mug(c, x, y) {","""function brush(c, x, y, a = 0) { c.save(); c.translate(x, y); c.rotate(a); rrect(c, -46, -16, 92, 32, 10); fillStroke(c, '#b07a40', 7); for (let i = -36; i <= 36; i += 12) line(c, [[i, 16], [i, 34]], 5, '#e8dcc0'); c.restore(); }
function foam(c, x, y, n = 9) { for (let i = 0; i < n; i++) { const a = i * 2.4, r = 18 + (i % 3) * 10; circ(c, x + Math.cos(a) * (30 + i * 4), y + Math.sin(a) * 18 - i * 3, r, '#ffffff', 5); } }
function baby(c, x, y) { c.beginPath(); c.ellipse(x, y, 70, 46, -0.2, 0, Math.PI * 2); fillStroke(c, '#f6f1e4', 8); circ(c, x - 34, y - 18, 30, '#ffffff', 7); c.beginPath(); c.arc(x - 40, y - 16, 6, 0.1, 3); stroke(c, 4); c.beginPath(); c.arc(x - 26, y - 16, 6, 0.1, 3); stroke(c, 4); c.beginPath(); c.ellipse(x - 34, y - 46, 40, 16, 0, Math.PI, 0); fillStroke(c, '#f6c6d0', 6); }
function notebook(c, x, y) { rrect(c, x - 40, y - 52, 80, 104, 6); fillStroke(c, '#5a3a22', 7); c.fillStyle = '#f3ead2'; c.fillRect(x - 30, y - 42, 60, 84); for (let i = 0; i < 5; i++) line(c, [[x - 22, y - 30 + i * 16], [x + 20, y - 30 + i * 16]], 3, '#8a8a8a'); }
function mug(c, x, y) {""")
sub(C,"  tourist(c, s) {","""  frock(c, s) {
    c.beginPath(); c.moveTo(BX - 80, BB - 120); c.lineTo(BX - 104, BB + 70); c.lineTo(BX - 20, BB + 50); c.lineTo(BX + 20, BB + 50); c.lineTo(BX + 104, BB + 70); c.lineTo(BX + 80, BB - 120); c.closePath(); fillStroke(c, s.coat || '#23232b', 9);
    bodyPath(c); c.fillStyle = s.coat || '#23232b'; c.fill();
    c.save(); bodyPath(c); c.clip();
    c.fillStyle = '#f7f5ef'; c.beginPath(); c.moveTo(BX - 44, BT); c.lineTo(BX, BT + 150); c.lineTo(BX + 44, BT); c.fill();
    c.fillStyle = s.vest || '#e9e2cf'; c.beginPath(); c.moveTo(BX - 40, BT + 70); c.lineTo(BX, BT + 210); c.lineTo(BX + 40, BT + 70); c.lineTo(BX + 30, BT + 60); c.lineTo(BX, BT + 150); c.lineTo(BX - 30, BT + 60); c.fill();
    line(c, [[BX - 44, BT], [BX, BT + 150], [BX + 44, BT]], 6);
    c.fillStyle = 'rgba(255,255,255,0.10)'; c.beginPath(); c.moveTo(BX - 44, BT); c.lineTo(BX - 64, BT + 60); c.lineTo(BX - 24, BT + 110); c.fill(); c.beginPath(); c.moveTo(BX + 44, BT); c.lineTo(BX + 64, BT + 60); c.lineTo(BX + 24, BT + 110); c.fill();
    for (let i = 0; i < 3; i++) { dot(c, BX - 34, BT + 140 + i * 34, 6, '#c8a24a'); dot(c, BX + 34, BT + 140 + i * 34, 6, '#c8a24a'); }
    if (s.apron) { c.fillStyle = '#f2efe6'; c.fillRect(BX - 70, BT + 160, 140, 200); if (s.stained) { c.fillStyle = 'rgba(140,70,50,0.45)'; for (let i = 0; i < 7; i++) { c.beginPath(); c.ellipse(BX - 40 + (i * 37) % 90, BT + 190 + (i * 29) % 120, 9 + i % 3 * 4, 6, i, 0, 7); c.fill(); } } line(c, [[BX - 70, BT + 160], [BX + 70, BT + 160]], 5); }
    shade(c); c.restore();
    bodyPath(c); stroke(c);
    c.beginPath(); c.moveTo(BX - 26, BT + 6); c.lineTo(BX + 26, BT + 6); c.lineTo(BX + 8, BT + 30); c.lineTo(BX + 16, BT + 70); c.lineTo(BX, BT + 80); c.lineTo(BX - 16, BT + 70); c.lineTo(BX - 8, BT + 30); c.closePath(); fillStroke(c, s.cravat || '#2a2a6a', 6);
  },
  professor(c, s) {
    c.beginPath(); c.moveTo(BX - 92, BB - 120); c.lineTo(BX - 116, BB + 70); c.lineTo(BX + 116, BB + 70); c.lineTo(BX + 92, BB - 120); c.closePath(); fillStroke(c, '#2a2430', 9);
    const w = 214; rrect(c, BX - w / 2, BT, w, BB - BT, w / 2); c.fillStyle = '#2a2430'; c.fill();
    c.save(); rrect(c, BX - w / 2, BT, w, BB - BT, w / 2); c.clip();
    c.fillStyle = '#7a2a2a'; c.beginPath(); c.ellipse(BX, BT + 170, 74, 140, 0, 0, 7); c.fill();
    for (let i = 0; i < 5; i++) dot(c, BX, BT + 90 + i * 34, 6, '#e8c24a');
    c.beginPath(); c.moveTo(BX - 50, BT + 150); c.quadraticCurveTo(BX - 10, BT + 200, BX + 40, BT + 160); c.lineWidth = 6; c.strokeStyle = '#f0c24a'; c.stroke();
    circ(c, BX + 44, BT + 162, 12, '#f0c24a', 5);
    c.fillStyle = '#f7f5ef'; c.beginPath(); c.moveTo(BX - 40, BT); c.lineTo(BX, BT + 60); c.lineTo(BX + 40, BT); c.fill();
    shade(c, w); c.restore();
    rrect(c, BX - w / 2, BT, w, BB - BT, w / 2); stroke(c);
    c.beginPath(); c.moveTo(BX - 30, BT + 4); c.lineTo(BX + 30, BT + 4); c.lineTo(BX, BT + 40); c.closePath(); fillStroke(c, '#1a1a1a', 6);
  },
  nurse(c, s) {
    c.beginPath(); c.moveTo(BX - 84, BT + 150); c.lineTo(BX - 120, FEET - 10); c.lineTo(BX + 120, FEET - 10); c.lineTo(BX + 84, BT + 150); c.closePath(); fillStroke(c, s.dress || '#3f5f9a', 9);
    bodyPath(c); c.fillStyle = s.dress || '#3f5f9a'; c.fill();
    c.save(); bodyPath(c); c.clip(); c.fillStyle = '#ffffff'; c.fillRect(BX - 60, BT + 70, 120, 260); line(c, [[BX - 60, BT + 70], [BX + 60, BT + 70]], 5); shade(c); c.restore(); bodyPath(c); stroke(c);
    c.beginPath(); c.moveTo(BX - 62, BT + 140); c.lineTo(BX - 96, FEET - 16); c.lineTo(BX + 96, FEET - 16); c.lineTo(BX + 62, BT + 140); c.closePath(); fillStroke(c, '#ffffff', 7);
    c.beginPath(); c.ellipse(BX, BT + 8, 64, 22, 0, 0, 7); fillStroke(c, '#ffffff', 6);
  },
  dress(c, s) {
    c.beginPath(); c.moveTo(BX - 80, BT + 170); c.quadraticCurveTo(BX - 150, FEET - 30, BX - 140, FEET - 6); c.lineTo(BX + 140, FEET - 6); c.quadraticCurveTo(BX + 150, FEET - 30, BX + 80, BT + 170); c.closePath(); fillStroke(c, s.dress || '#b85a7a', 9);
    for (let i = -2; i <= 2; i++) line(c, [[BX + i * 30, BT + 200], [BX + i * 50, FEET - 10]], 4, 'rgba(0,0,0,0.18)');
    bodyPath(c); c.fillStyle = s.dress || '#b85a7a'; c.fill(); c.save(); bodyPath(c); c.clip(); c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.ellipse(BX, BT + 10, 70, 30, 0, 0, 7); c.fill(); shade(c); c.restore(); bodyPath(c); stroke(c);
    for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(BX + sd * 78, BT + 44, 34, 40, 0, 0, 7); fillStroke(c, s.dress || '#b85a7a', 7); }
    line(c, [[BX - 80, BT + 170], [BX + 80, BT + 170]], 8, '#f3e6c8');
  },
  patient(c, s) {
    bodyPath(c); c.fillStyle = '#f6f3ea'; c.fill(); c.save(); bodyPath(c); c.clip();
    for (let y = BT + 60; y < BB; y += 40) line(c, [[BX - 100, y], [BX + 100, y]], 3, 'rgba(120,140,170,0.35)');
    c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(BX, BT + 8, 80, 34, 0, 0, 7); c.fill(); shade(c); c.restore(); bodyPath(c); stroke(c);
    for (let i = -3; i <= 3; i++) circ(c, BX + i * 22, BT + 28 + Math.abs(i) * 4, 9, '#ffffff', 4);
  },
  scrubs(c, s) {
    bodyPath(c); c.fillStyle = '#3aa58f'; c.fill(); c.save(); bodyPath(c); c.clip();
    c.fillStyle = '#2f8c79'; c.beginPath(); c.moveTo(BX - 40, BT); c.lineTo(BX, BT + 70); c.lineTo(BX + 40, BT); c.fill();
    line(c, [[BX - 40, BT + 2], [BX, BT + 70], [BX + 40, BT + 2]], 6);
    rrect(c, BX + 24, BT + 110, 50, 44, 5); fillStroke(c, '#3aa58f', 5); rrect(c, BX - 74, BT + 110, 44, 30, 5); fillStroke(c, '#ffffff', 4);
    c.fillStyle = '#2f8c79'; c.fillRect(BX - 100, BB - 80, 200, 90); shade(c); c.restore(); bodyPath(c); stroke(c);
  },
  tourist(c, s) {""")
sub(C,"    if (s.hair === 'curly' || s.hair === 'short') {\n      const col = s.hairColor || '#3a2616';\n      c.beginPath(); c.arc(x, y - 6, r + 12, Math.PI * 0.95, Math.PI * 2.05); c.fillStyle = col; c.fill(); stroke(c, 9);\n    }",
"""    if (s.hair === 'curly' || s.hair === 'short') {
      const col = s.hairColor || '#3a2616';
      c.beginPath(); c.arc(x, y - 6, r + 12, Math.PI * 0.95, Math.PI * 2.05); c.fillStyle = col; c.fill(); stroke(c, 9);
    }
    if (s.hair === 'long' || s.hair === 'bun') {
      const col = s.hairColor || '#6a3a1a';
      if (s.hair === 'long') { c.beginPath(); c.moveTo(x - r - 14, y - 10); c.quadraticCurveTo(x - r - 30, y + 150, x - r + 10, y + 190); c.lineTo(x + r - 10, y + 190); c.quadraticCurveTo(x + r + 30, y + 150, x + r + 14, y - 10); c.arc(x, y - 10, r + 14, 0, Math.PI, true); c.closePath(); fillStroke(c, col, 9); }
      else circ(c, x, y - r - 30, 46, col, 9);
    }
    if (h === 'bonnet') { c.beginPath(); c.arc(x, y - 4, r + 40, Math.PI * 0.85, Math.PI * 2.15); c.closePath(); fillStroke(c, s.hatColor || '#f2e2b8', 10); }
    if (h === 'nursecap') { c.beginPath(); c.moveTo(x - r - 20, y - 40); c.lineTo(x - r + 6, y + 120); c.lineTo(x + r - 6, y + 120); c.lineTo(x + r + 20, y - 40); c.closePath(); fillStroke(c, '#ffffff', 9); }""")
sub(C,"  } else if (h === 'cap') {","""  } else if (h === 'tophat') {
    rrect(c, x - r - 30, y - r + 14, 2 * r + 60, 30, 14); fillStroke(c, s.hatColor || '#1d1d24');
    c.beginPath(); c.moveTo(x - r + 26, y - r + 20); c.lineTo(x - r + 16, y - r - 150); c.lineTo(x + r - 16, y - r - 150); c.lineTo(x + r - 26, y - r + 20); c.closePath(); fillStroke(c, s.hatColor || '#1d1d24');
    c.fillStyle = s.hatBand || '#5a1a2a'; c.fillRect(x - r + 24, y - r - 20, 2 * r - 48, 26); line(c, [[x - r + 24, y - r - 20], [x + r - 24, y - r - 20]], 5);
  } else if (h === 'bonnet') {
    c.beginPath(); c.arc(x, y - 4, r + 40, Math.PI * 1.02, Math.PI * 1.98); stroke(c, 10);
    c.beginPath(); c.moveTo(x - r - 10, y + 40); c.quadraticCurveTo(x - 30, y + 140, x - 10, y + 150); stroke(c, 7); c.beginPath(); c.moveTo(x + r + 10, y + 40); c.quadraticCurveTo(x + 30, y + 140, x + 10, y + 150); stroke(c, 7);
    for (const sd of [-1, 1]) circ(c, x + sd * (r + 4), y - 60, 22, s.flower || '#e8608a', 6);
  } else if (h === 'nursecap') {
    c.beginPath(); c.moveTo(x - r + 4, y - 50); c.quadraticCurveTo(x - r + 10, y - r - 34, x, y - r - 26); c.quadraticCurveTo(x + r - 10, y - r - 34, x + r - 4, y - 50); c.quadraticCurveTo(x, y - 80, x - r + 4, y - 50); fillStroke(c, '#ffffff');
    line(c, [[x - 20, y - r - 10], [x + 20, y - r - 10]], 6, '#d84a4a'); line(c, [[x, y - r - 30], [x, y - r + 10]], 6, '#d84a4a');
  } else if (h === 'surgcap') {
    c.beginPath(); c.moveTo(x - r + 2, y - 36); c.quadraticCurveTo(x - r + 6, y - r - 30, x, y - r - 22); c.quadraticCurveTo(x + r - 6, y - r - 30, x + r - 2, y - 36); c.quadraticCurveTo(x, y - 62, x - r + 2, y - 36); fillStroke(c, '#3aa58f');
    for (let i = 0; i < 7; i++) dot(c, x - 80 + i * 26, y - 96 + (i % 2) * 14, 5, '#2f8c79');
  } else if (h === 'cap') {""")
sub(C,"  } else if (s.hair === 'short') {","""  } else if (s.hair === 'receding') {
    const col = s.hairColor || '#4a2e1a';
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(x + sd * (r - 2), y - 70); c.quadraticCurveTo(x + sd * (r + 16), y - 10, x + sd * (r - 8), y + 60); c.lineTo(x + sd * (r - 36), y + 50); c.quadraticCurveTo(x + sd * (r - 26), y - 20, x + sd * (r - 40), y - 66); c.closePath(); fillStroke(c, col, 7); }
    c.beginPath(); c.moveTo(x - 30, y - r + 6); c.quadraticCurveTo(x, y - r - 8, x + 30, y - r + 6); stroke(c, 6);
  } else if (s.hair === 'muttonchops') {
    const col = s.hairColor || '#b8b8c0';
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(x + sd * (r - 4), y - 60); c.quadraticCurveTo(x + sd * (r + 24), y + 40, x + sd * (r - 30), y + 110); c.quadraticCurveTo(x + sd * (r - 70), y + 90, x + sd * (r - 54), y + 20); c.quadraticCurveTo(x + sd * (r - 40), y - 30, x + sd * (r - 40), y - 60); c.closePath(); fillStroke(c, col, 7); }
  } else if (s.hair === 'long' || s.hair === 'bun') {
    const col = s.hairColor || '#6a3a1a';
    c.beginPath(); c.moveTo(x - r + 4, y - 20); c.quadraticCurveTo(x - r + 6, y - r - 18, x, y - r - 10); c.quadraticCurveTo(x + r - 6, y - r - 18, x + r - 4, y - 20); c.quadraticCurveTo(x + 50, y - 90, x + 4, y - 96); c.quadraticCurveTo(x - 50, y - 90, x - r + 4, y - 20); fillStroke(c, col, 8);
    line(c, [[x + 2, y - r - 8], [x + 4, y - 94]], 4);
  } else if (s.hair === 'short') {""")
sub(C,"  if (s.sunglasses) {","""  if (s.blush) { c.fillStyle = 'rgba(240,120,130,0.35)'; c.beginPath(); c.ellipse(L[0] - 18, L[1] + 40, 22, 13, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(R[0] + 18, R[1] + 40, 22, 13, 0, 0, 7); c.fill(); }
  if (s.monocle) { circ(c, R[0], R[1] + 2, 30, null, 6); line(c, [[R[0] + 26, R[1] + 16], [R[0] + 70, R[1] + 120]], 3, '#c8a24a'); }
  if (s.cigar) { rrect(c, x + 10, y + 52, 70, 16, 6); fillStroke(c, '#8a5a2a', 5); circ(c, x + 82, y + 60, 7, '#ff8a3a', 3); for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x + 92 + i * 10, y + 30 - i * 26, 12 + i * 4, 0, 7); c.fillStyle = 'rgba(220,220,220,0.75)'; c.fill(); } }
  if (s.mask) { rrect(c, x - 80, y + 26, 160, 80, 24); fillStroke(c, '#9fd8d0', 6); line(c, [[x - 70, y + 50], [x + 70, y + 50]], 3, '#6aa8a0'); line(c, [[x - 70, y + 74], [x + 70, y + 74]], 3, '#6aa8a0'); }
  if (s.sunglasses) {""")
sub(C,"    case 'photo':","""    case 'scrub': post = () => { arm([SL, [170, 470], [236, 488]]); arm([SR, [342, 470], [276, 488]]); brush(c, 262, 470, s.scrubT ? Math.sin(s.scrubT) * 0.3 : 0.1); hand(236, 492); hand(280, 492); if (s.foam) foam(c, 256, 440, 9); }; break;
    case 'shake': arm([SL, [150, 500], [192, 548]]); arm([SR, [420, 460], [494, 452]]); hand(494, 452); break;
    case 'baby': post = () => { arm([SL, [170, 470], [196, 470]]); arm([SR, [342, 470], [330, 470]]); baby(c, 262, 470); }; break;
    case 'note': arm([SL, [160, 470], [220, 450]]); arm([SR, [352, 470], [300, 440]]); notebook(c, 256, 440); break;
    case 'sit': arm([SL, [150, 470], [210, 530]]); arm([SR, [362, 470], [302, 530]]); break;
    case 'photo':""")
print('patched')
