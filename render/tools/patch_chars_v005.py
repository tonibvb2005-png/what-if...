def sub(p,a,b):
    s=open(p).read(); assert a in s, (p,a[:70]); s2=s.replace(a,b,1); open(p,'w').write(s2)
C='src/chars.js'
sub(C,"function mug(c, x, y) {","""function hammer(c, x, y, a = 0) { c.save(); c.translate(x, y); c.rotate(a); line(c, [[0, 0], [0, -150]], 14); line(c, [[0, 0], [0, -150]], 7, '#9a6a3a'); rrect(c, -40, -180, 80, 40, 8); fillStroke(c, '#8a8e96', 7); c.restore(); }
function copperPlate(c, x, y, a = 0) { c.save(); c.translate(x, y); c.rotate(a); rrect(c, -60, -40, 120, 80, 6); fillStroke(c, '#d88a3a', 7); c.fillStyle = 'rgba(255,240,200,0.6)'; c.fillRect(-50, -32, 40, 10); for (const [px, py] of [[-48, -28], [48, -28], [-48, 28], [48, 28]]) dot(c, px, py, 5, '#8a4a1a'); c.restore(); }
function mug(c, x, y) {""")
sub(C,"  tourist(c, s) {","""  shipwright(c, s) {
    bodyPath(c); c.fillStyle = '#f4efe2'; c.fill(); c.save(); bodyPath(c); c.clip();
    for (let y = BT + 40; y < BB; y += 36) line(c, [[BX - 100, y], [BX + 100, y + 6]], 3, 'rgba(0,0,0,0.08)');
    c.fillStyle = '#8a5a2a'; c.beginPath(); c.moveTo(BX - 70, BT + 90); c.lineTo(BX + 70, BT + 90); c.lineTo(BX + 80, BB + 10); c.lineTo(BX - 80, BB + 10); c.fill();
    line(c, [[BX - 70, BT + 90], [BX + 70, BT + 90]], 5); line(c, [[BX - 70, BT + 92], [BX - 96, BT + 10]], 7, '#6a4020'); line(c, [[BX + 70, BT + 92], [BX + 96, BT + 10]], 7, '#6a4020');
    rrect(c, BX - 40, BT + 180, 80, 50, 6); fillStroke(c, '#7a4a22', 5); c.fillStyle = '#5a3a1a'; c.fillRect(BX - 100, BB - 120, 200, 14);
    shade(c); c.restore(); bodyPath(c); stroke(c);
    c.beginPath(); c.moveTo(BX - 50, BT + 6); c.lineTo(BX + 50, BT + 6); c.lineTo(BX + 20, BT + 50); c.lineTo(BX - 20, BT + 50); c.closePath(); fillStroke(c, '#c83a2a', 6);
  },
  tar(c, s) {
    bodyPath(c); c.fillStyle = '#ffffff'; c.fill(); c.save(); bodyPath(c); c.clip();
    for (let y = BT; y < BB; y += 26) { c.fillStyle = s.stripe || '#c83a2a'; c.fillRect(BX - 100, y, 200, 12); }
    c.fillStyle = '#e8dcc0'; c.fillRect(BX - 100, BB - 90, 200, 100); line(c, [[BX - 100, BB - 90], [BX + 100, BB - 90]], 5);
    c.fillStyle = '#3a2a1a'; c.fillRect(BX - 100, BB - 100, 200, 14);
    shade(c); c.restore(); bodyPath(c); stroke(c);
    c.beginPath(); c.moveTo(BX - 46, BT + 4); c.lineTo(BX + 46, BT + 4); c.lineTo(BX, BT + 56); c.closePath(); fillStroke(c, s.kerchief || '#1a3a8a', 6);
  },
  rncaptain(c, s) {
    c.beginPath(); c.moveTo(BX - 84, BB - 110); c.lineTo(BX - 108, BB + 70); c.lineTo(BX + 108, BB + 70); c.lineTo(BX + 84, BB - 110); c.closePath(); fillStroke(c, '#1c2a5a', 9);
    bodyPath(c); c.fillStyle = '#1c2a5a'; c.fill(); c.save(); bodyPath(c); c.clip();
    c.fillStyle = '#f4f0e6'; c.fillRect(BX - 46, BT, 92, 300);
    c.fillStyle = '#f8f8f8'; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(BX + sd * 46, BT); c.lineTo(BX + sd * 80, BT + 20); c.lineTo(BX + sd * 66, BT + 200); c.lineTo(BX + sd * 46, BT + 200); c.fill(); }
    for (let i = 0; i < 5; i++) { dot(c, BX + 58, BT + 30 + i * 36, 6, '#e8c24a'); dot(c, BX - 58, BT + 30 + i * 36, 6, '#e8c24a'); }
    shade(c); c.restore(); bodyPath(c); stroke(c);
    for (let i = 0; i < 4; i++) circ(c, BX, BT + 16 + i * 8, 10, '#ffffff', 3);
    for (const sd of [-1, 1]) { c.save(); c.translate(BX + sd * 80, BT + 30); rrect(c, -30, -12, 60, 24, 8); fillStroke(c, '#e8c24a', 5); for (let k = 0; k < 6; k++) line(c, [[-26 + k * 10, 12], [-26 + k * 10, 40]], 4, '#e8c24a'); c.restore(); }
  },
  tourist(c, s) {""")
sub(C,"  } else if (h === 'tophat') {","""  } else if (h === 'tricorn') {
    c.beginPath(); c.moveTo(x - r - 50, y - r + 30); c.quadraticCurveTo(x, y - r - 60, x + r + 50, y - r + 30); c.quadraticCurveTo(x, y - r - 10, x - r - 50, y - r + 30); fillStroke(c, '#18181e');
    c.beginPath(); c.moveTo(x - r - 50, y - r + 30); c.quadraticCurveTo(x, y - r - 60, x + r + 50, y - r + 30); c.lineWidth = 8; c.strokeStyle = s.trim || '#e8c24a'; c.stroke();
    c.beginPath(); c.moveTo(x - 60, y - r - 6); c.quadraticCurveTo(x, y - r - 90, x + 60, y - r - 6); c.closePath(); fillStroke(c, '#18181e');
    circ(c, x + 50, y - r - 6, 12, '#1a1a1a', 4);
  } else if (h === 'tarhat') {
    c.beginPath(); c.ellipse(x, y - r + 22, r + 10, 26, 0, 0, Math.PI * 2); fillStroke(c, '#2a2a2a');
    rrect(c, x - r + 30, y - r - 30, 2 * r - 60, 56, 20); fillStroke(c, '#2a2a2a'); line(c, [[x - r + 32, y - r + 10], [x + r - 32, y - r + 10]], 6, '#c8c8c8');
  } else if (h === 'tophat') {""")
sub(C,"  } else if (s.hair === 'receding') {","""  } else if (s.hair === 'wig') {
    for (const sd of [-1, 1]) for (let k = 0; k < 2; k++) { c.beginPath(); c.ellipse(x + sd * (r - 10), y - 20 + k * 44, 30, 22, 0, 0, Math.PI * 2); fillStroke(c, '#f2f0ea', 7); }
    c.beginPath(); c.arc(x, y - 10, r + 4, Math.PI * 1.08, Math.PI * 1.92); c.lineWidth = 34; c.strokeStyle = INK; c.stroke(); c.lineWidth = 22; c.strokeStyle = '#f2f0ea'; c.stroke();
  } else if (s.hair === 'receding') {""")
print('ok')
