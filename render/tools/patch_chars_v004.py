def sub(p,a,b):
    s=open(p).read(); assert a in s, (p,a[:70]); s2=s.replace(a,b,1); open(p,'w').write(s2)
C='src/chars.js'
sub(C,"  tourist(c, s) {","""  navyofficer(c, s) {
    bodyPath(c); c.fillStyle = '#1c2030'; c.fill();
    c.save(); bodyPath(c); c.clip();
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(BX - 40, BT); c.lineTo(BX, BT + 70); c.lineTo(BX + 40, BT); c.fill();
    c.save(); c.beginPath(); c.moveTo(BX - 40, BT); c.lineTo(BX, BT + 70); c.lineTo(BX + 40, BT); c.clip(); for (let y = BT; y < BT + 80; y += 14) { c.fillStyle = '#1a3a8a'; c.fillRect(BX - 50, y, 100, 7); } c.restore();
    line(c, [[BX - 40, BT + 2], [BX, BT + 70], [BX + 40, BT + 2]], 6);
    for (let i = 0; i < 4; i++) { dot(c, BX - 30, BT + 110 + i * 40, 7, '#e8c24a'); dot(c, BX + 30, BT + 110 + i * 40, 7, '#e8c24a'); }
    for (let k = 0; k < 3; k++) { c.fillStyle = ['#c83a2a', '#e8c24a', '#3a6ab0'][k]; c.fillRect(BX - 92 + k * 20, BT + 90, 18, 10); }
    if (s.wetShirt) { c.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(BX - 50 + i * 26, BT + 130 + (i % 2) * 40, 18, 30, 0, 0, 7); c.fill(); } }
    shade(c); c.restore(); bodyPath(c); stroke(c);
    for (const sd of [-1, 1]) { c.save(); c.translate(BX + sd * 76, BT + 34); c.rotate(sd * 0.35); rrect(c, -34, -12, 68, 24, 6); fillStroke(c, '#1a1a22', 6); line(c, [[-30, -4], [30, -4]], 4, '#e8c24a'); line(c, [[-30, 4], [30, 4]], 4, '#e8c24a'); dot(c, 0, 0, 6, '#f0d060'); c.restore(); }
  },
  sailor(c, s) {
    bodyPath(c); c.fillStyle = '#ffffff'; c.fill();
    c.save(); bodyPath(c); c.clip();
    for (let y = BT; y < BB; y += 22) { c.fillStyle = '#1a3a8a'; c.fillRect(BX - 100, y, 200, 11); }
    if (s.sweat) { c.fillStyle = 'rgba(0,0,0,0.18)'; c.beginPath(); c.ellipse(BX, BT + 120, 60, 80, 0, 0, 7); c.fill(); }
    c.fillStyle = '#1c2030'; c.fillRect(BX - 100, BB - 90, 200, 100); line(c, [[BX - 100, BB - 90], [BX + 100, BB - 90]], 5);
    c.fillStyle = '#3a2a1a'; c.fillRect(BX - 100, BB - 100, 200, 14); rrect(c, BX - 16, BB - 104, 32, 22, 3); fillStroke(c, '#e8c24a', 4);
    shade(c); c.restore(); bodyPath(c); stroke(c);
  },
  ussailor(c, s) {
    bodyPath(c); c.fillStyle = '#f4f6f8'; c.fill(); c.save(); bodyPath(c); c.clip();
    c.fillStyle = '#1c2a5a'; c.beginPath(); c.moveTo(BX - 70, BT); c.lineTo(BX, BT + 80); c.lineTo(BX + 70, BT); c.fill();
    line(c, [[BX - 60, BT + 4], [BX, BT + 70], [BX + 60, BT + 4]], 4, '#ffffff');
    c.fillStyle = '#1c1c22'; c.beginPath(); c.moveTo(BX - 20, BT + 70); c.lineTo(BX + 20, BT + 70); c.lineTo(BX, BT + 110); c.fill();
    shade(c); c.restore(); bodyPath(c); stroke(c);
  },
  tourist(c, s) {""")
sub(C,"  } else if (h === 'peakcap') {\n    const big = s.general ? 1.18 : 1;\n    c.beginPath(); c.ellipse(x, y - r + 6, (r + 34) * big, 46 * big, 0, 0, Math.PI * 2); fillStroke(c, s.olive || '#66703f');\n    rrect(c, x - r + 14, y - r + 10, 2 * r - 28, 40, 10); fillStroke(c, '#b8262b');",
"  } else if (h === 'peakcap') {\n    const big = s.general ? 1.18 : 1;\n    c.beginPath(); c.ellipse(x, y - r + 6, (r + 34) * big, 46 * big, 0, 0, Math.PI * 2); fillStroke(c, s.navy ? '#f4f4f0' : (s.olive || '#66703f'));\n    rrect(c, x - r + 14, y - r + 10, 2 * r - 28, 40, 10); fillStroke(c, s.navy ? '#1a1a22' : '#b8262b');")
sub(C,"  } else if (h === 'tophat') {","""  } else if (h === 'pilotka') {
    c.beginPath(); c.moveTo(x - r + 6, y - r + 40); c.lineTo(x - 30, y - r - 24); c.lineTo(x + 50, y - r - 20); c.lineTo(x + r - 6, y - r + 40); c.closePath(); fillStroke(c, '#1c2030');
    line(c, [[x - r + 10, y - r + 30], [x + r - 10, y - r + 30]], 6, '#e8c24a');
  } else if (h === 'dixie') {
    c.beginPath(); c.ellipse(x, y - r + 20, r - 6, 30, 0, 0, Math.PI * 2); fillStroke(c, '#ffffff');
    c.beginPath(); c.moveTo(x - r + 26, y - r + 20); c.quadraticCurveTo(x - r + 30, y - r - 46, x, y - r - 50); c.quadraticCurveTo(x + r - 30, y - r - 46, x + r - 26, y - r + 20); c.closePath(); fillStroke(c, '#ffffff');
  } else if (h === 'tophat') {""")
print('ok')
