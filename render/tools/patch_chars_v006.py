def sub(p,a,b):
    s=open(p).read(); assert a in s, (p,a[:70]); s2=s.replace(a,b,1); open(p,'w').write(s2)
C='src/chars.js'
sub(C,"  tourist(c, s) {","""  tailor(c, s) {
    bodyPath(c); c.fillStyle = '#f6f2e8'; c.fill(); c.save(); bodyPath(c); c.clip();
    c.fillStyle = '#7a4a2a'; c.beginPath(); c.moveTo(BX - 100, BT + 40); c.lineTo(BX - 30, BT + 40); c.lineTo(BX, BT + 150); c.lineTo(BX + 30, BT + 40); c.lineTo(BX + 100, BT + 40); c.lineTo(BX + 100, BB); c.lineTo(BX - 100, BB); c.fill();
    for (let i = 0; i < 4; i++) dot(c, BX, BT + 170 + i * 30, 6, '#e8c24a');
    rrect(c, BX + 36, BT + 150, 36, 26, 4); fillStroke(c, '#6a3a1a', 4); line(c, [[BX + 54, BT + 150], [BX + 20, BT + 190]], 3, '#e8c24a');
    c.fillStyle = '#3a4a6a'; c.fillRect(BX - 100, BB - 70, 200, 80);
    shade(c); c.restore(); bodyPath(c); stroke(c);
    // tape measure around the neck
    line(c, [[BX - 40, BT + 4], [BX - 50, BT + 200]], 14, '#e8d23a'); line(c, [[BX + 40, BT + 4], [BX + 50, BT + 200]], 14, '#e8d23a');
    for (let k = 0; k < 9; k++) { line(c, [[BX - 46, BT + 20 + k * 20], [BX - 38, BT + 20 + k * 20]], 3); line(c, [[BX + 46, BT + 20 + k * 20], [BX + 38, BT + 20 + k * 20]], 3); }
    c.beginPath(); c.moveTo(BX - 30, BT + 4); c.lineTo(BX + 30, BT + 4); c.lineTo(BX, BT + 34); c.closePath(); fillStroke(c, '#1a1a1a', 5);
  },
  miner(c, s) {
    bodyPath(c); c.fillStyle = '#b8302a'; c.fill(); c.save(); bodyPath(c); c.clip();
    for (let x = BX - 100; x < BX + 100; x += 30) { c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(x, BT, 10, 300); }
    for (let y = BT; y < BB; y += 30) { c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(BX - 100, y, 200, 10); }
    c.fillStyle = s.pants || '#3a5a8a'; c.fillRect(BX - 100, BB - 110, 200, 120);
    if (s.ripped) { c.fillStyle = '#2a1a10'; c.beginPath(); c.moveTo(BX + 20, BB - 90); c.lineTo(BX + 70, BB - 96); c.lineTo(BX + 60, BB - 40); c.lineTo(BX + 44, BB - 60); c.lineTo(BX + 30, BB - 30); c.closePath(); c.fill(); }
    if (s.rivets) for (const [px, py] of [[BX - 70, BB - 96], [BX - 20, BB - 96], [BX + 20, BB - 96], [BX + 70, BB - 96]]) { circ(c, px, py, 7, '#d88a3a', 3); }
    c.fillStyle = 'rgba(90,60,30,0.3)'; for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(BX - 70 + i * 20, BT + 60 + (i * 37) % 160, 8, 0, 7); c.fill(); }
    shade(c); c.restore(); bodyPath(c); stroke(c);
    line(c, [[BX - 46, BT + 6], [BX - 52, BB - 108]], 12, '#4a2a1a'); line(c, [[BX + 46, BT + 6], [BX + 52, BB - 108]], 12, '#4a2a1a');
  },
  cowboy(c, s) {
    bodyPath(c); c.fillStyle = s.shirt || '#d8c8a0'; c.fill(); c.save(); bodyPath(c); c.clip();
    c.fillStyle = s.vestCol || '#6a3a1a'; c.fillRect(BX - 100, BT + 20, 66, 300); c.fillRect(BX + 34, BT + 20, 66, 300);
    for (let i = 0; i < 6; i++) { dot(c, BX - 60, BT + 70 + i * 26, 3, '#e8d8b0'); dot(c, BX + 60, BT + 70 + i * 26, 3, '#e8d8b0'); }
    c.fillStyle = '#3a2a1a'; c.fillRect(BX - 100, BB - 112, 200, 18); rrect(c, BX - 22, BB - 118, 44, 30, 6); fillStroke(c, '#c8c8c8', 4);
    c.fillStyle = s.pants || '#6a4a2a'; c.fillRect(BX - 100, BB - 94, 200, 110);
    shade(c); c.restore(); bodyPath(c); stroke(c);
    c.beginPath(); c.moveTo(BX - 50, BT + 2); c.lineTo(BX + 50, BT + 2); c.lineTo(BX + 10, BT + 66); c.lineTo(BX - 10, BT + 66); c.closePath(); fillStroke(c, s.bandana || '#c83a2a', 6);
    for (let i = 0; i < 5; i++) dot(c, BX - 30 + i * 15, BT + 18 + (i % 2) * 14, 4, '#ffffff');
    for (const sd of [-1, 1]) { c.fillStyle = '#8a5a2a'; c.beginPath(); c.moveTo(BX + sd * 20, BB - 10); c.lineTo(BX + sd * 96, BB - 10); c.lineTo(BX + sd * 70, BB + 70); c.lineTo(BX + sd * 30, BB + 70); c.closePath(); fillStroke(c, '#8a5a2a', 6); for (let k = 0; k < 5; k++) line(c, [[BX + sd * (80 - k * 2), BB + k * 14], [BX + sd * 100, BB + k * 14 + 4]], 4, '#6a3a1a'); }
  },
  longjohns(c, s) {
    bodyPath(c); c.fillStyle = '#d83a3a'; c.fill(); c.save(); bodyPath(c); c.clip();
    for (let i = 0; i < 5; i++) dot(c, BX, BT + 40 + i * 34, 7, '#f4f4f4');
    rrect(c, BX - 60, BB - 70, 120, 60, 10); fillStroke(c, '#c83030', 5);
    shade(c); c.restore(); bodyPath(c); stroke(c);
  },
  tourist(c, s) {""")
sub(C,"  } else if (h === 'tophat') {","""  } else if (h === 'cowboyhat') {
    c.save(); c.translate(0, 18);
    c.beginPath(); c.moveTo(x - r - 70, y - r + 34); c.quadraticCurveTo(x - r - 40, y - r + 70, x, y - r + 58); c.quadraticCurveTo(x + r + 40, y - r + 70, x + r + 70, y - r + 34); c.quadraticCurveTo(x, y - r + 20, x - r - 70, y - r + 34); fillStroke(c, s.hatColor || '#8a5a2a');
    c.beginPath(); c.moveTo(x - r + 20, y - r + 34); c.quadraticCurveTo(x - r + 10, y - r - 70, x - 30, y - r - 60); c.quadraticCurveTo(x, y - r - 40, x + 30, y - r - 60); c.quadraticCurveTo(x + r - 10, y - r - 70, x + r - 20, y - r + 34); c.closePath(); fillStroke(c, s.hatColor || '#8a5a2a');
    c.fillStyle = '#3a2a1a'; c.fillRect(x - r + 22, y - r + 6, 2 * r - 44, 18);
    c.restore();
  } else if (h === 'slouch') {
    c.save(); c.translate(0, 14);
    c.beginPath(); c.ellipse(x, y - r + 36, r + 50, 34, 0.05, 0, Math.PI * 2); fillStroke(c, '#5a4a3a');
    c.beginPath(); c.moveTo(x - r + 20, y - r + 40); c.quadraticCurveTo(x - r + 20, y - r - 50, x, y - r - 46); c.quadraticCurveTo(x + r - 20, y - r - 50, x + r - 20, y - r + 40); c.closePath(); fillStroke(c, '#6a5a48');
    c.restore();
  } else if (h === 'bowler') {
    c.beginPath(); c.ellipse(x, y - r + 30, r + 26, 22, 0, 0, Math.PI * 2); fillStroke(c, s.hatColor || '#1d1d24');
    c.beginPath(); c.arc(x, y - r + 28, r - 26, Math.PI, 0); c.closePath(); fillStroke(c, s.hatColor || '#1d1d24');
    c.fillStyle = '#5a1a2a'; c.fillRect(x - r + 28, y - r + 12, 2 * r - 56, 14);
  } else if (h === 'tophat') {""")
sub(C,"  } else if (s.hair === 'receding') {","""  } else if (s.hair === 'beard') {
    const col = s.hairColor || '#5a3a1a';
    c.beginPath(); c.moveTo(x - r + 8, y + 10); c.quadraticCurveTo(x - r + 10, y + r + 30, x, y + r + 40); c.quadraticCurveTo(x + r - 10, y + r + 30, x + r - 8, y + 10); c.quadraticCurveTo(x + 40, y + 90, x, y + 92); c.quadraticCurveTo(x - 40, y + 90, x - r + 8, y + 10); fillStroke(c, col, 8);
  } else if (s.hair === 'receding') {""")
print('ok')
