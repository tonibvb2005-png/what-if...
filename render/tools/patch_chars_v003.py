def sub(p,a,b):
    s=open(p).read(); assert a in s, (p,a[:70]); s2=s.replace(a,b,1); open(p,'w').write(s2)
C='src/chars.js'
sub(C,"function mug(c, x, y) {","""function handset(c, x, y, a = -0.5) { c.save(); c.translate(x, y); c.rotate(a); rrect(c, -16, -70, 32, 140, 14); fillStroke(c, s_phoneCol, 7); rrect(c, -26, -86, 52, 34, 14); fillStroke(c, s_phoneCol, 7); rrect(c, -26, 52, 52, 34, 14); fillStroke(c, s_phoneCol, 7); c.restore(); }
let s_phoneCol = '#1e1e22';
function papers(c, x, y) { for (let i = 0; i < 6; i++) { c.save(); c.translate(x + (i % 2) * 6 - 3, y - i * 14); c.rotate((i % 3 - 1) * 0.05); rrect(c, -70, -10, 140, 22, 3); fillStroke(c, i % 2 ? '#f6f2e6' : '#ece6d2', 5); c.restore(); } }
function mug(c, x, y) {""")
sub(C,"  tourist(c, s) {","""  soviet(c, s) {
    const w = s.general ? 214 : BW; const olive = s.olive || '#66703f';
    rrect(c, BX - w / 2, BT, w, BB - BT, w / 2); c.fillStyle = olive; c.fill();
    c.save(); rrect(c, BX - w / 2, BT, w, BB - BT, w / 2); c.clip();
    c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(BX - 3, BT + 40, 6, 260);
    for (let i = 0; i < 4; i++) dot(c, BX, BT + 70 + i * 52, 7, '#d8b44a');
    for (const sd of [-1, 1]) { rrect(c, BX + sd * 50 - 28, BT + 70, 56, 46, 6); fillStroke(c, olive, 5); rrect(c, BX + sd * 50 - 30, BT + 64, 60, 16, 4); fillStroke(c, olive, 5); rrect(c, BX + sd * 54 - 30, BT + 190, 60, 50, 6); fillStroke(c, olive, 5); }
    const ribbons = ['#c83a2a', '#e8c24a', '#3a6ab0', '#2a8a4a', '#e8e8e8', '#8a2a6a'];
    const rows = s.general ? 4 : 2;
    for (let r = 0; r < rows; r++) for (let k = 0; k < 3; k++) { c.fillStyle = ribbons[(r * 3 + k) % 6]; c.fillRect(BX - 92 + k * 22, BT + 40 - r * 14 + (s.general ? 30 : 0), 20, 12); }
    if (s.general) for (let k = 0; k < 4; k++) { c.fillStyle = '#f0c24a'; c.beginPath(); for (let j = 0; j < 10; j++) { const a = j * Math.PI / 5 - Math.PI / 2, rr = j % 2 ? 7 : 16; c.lineTo(BX + 50 + (k % 2) * 34 + Math.cos(a) * rr, BT + 150 + Math.floor(k / 2) * 40 + Math.sin(a) * rr); } c.fill(); }
    c.fillStyle = '#6a3a1a'; c.fillRect(BX - w / 2, BB - 116, w, 22); rrect(c, BX - 20, BB - 120, 40, 30, 4); fillStroke(c, '#d8b44a', 5);
    shade(c, w); c.restore();
    rrect(c, BX - w / 2, BT, w, BB - BT, w / 2); stroke(c);
    // collar + shoulder boards
    c.beginPath(); c.moveTo(BX - 50, BT + 4); c.lineTo(BX, BT + 40); c.lineTo(BX + 50, BT + 4); stroke(c, 7);
    for (const sd of [-1, 1]) { rrect(c, BX + sd * 22 - 12, BT + 8, 24, 16, 3); fillStroke(c, '#b8262b', 4);
      c.save(); c.translate(BX + sd * 76, BT + 34); c.rotate(sd * 0.35); rrect(c, -34, -12, 68, 24, 6); fillStroke(c, s.general ? '#e8c24a' : '#b8262b', 6); if (!s.general) { line(c, [[-30, 0], [30, 0]], 4, '#e8c24a'); dot(c, -8, 0, 5, '#f0d060'); dot(c, 10, 0, 5, '#f0d060'); } else { for (let k = 0; k < 3; k++) dot(c, -16 + k * 16, 0, 6, '#b8262b'); } c.restore(); }
  },
  tourist(c, s) {""")
sub(C,"  } else if (h === 'cap') {","""  } else if (h === 'peakcap') {
    const big = s.general ? 1.18 : 1;
    c.beginPath(); c.ellipse(x, y - r + 6, (r + 34) * big, 46 * big, 0, 0, Math.PI * 2); fillStroke(c, s.olive || '#66703f');
    rrect(c, x - r + 14, y - r + 10, 2 * r - 28, 40, 10); fillStroke(c, '#b8262b');
    c.beginPath(); c.ellipse(x, y - r + 54, r - 6, 22, 0, 0, Math.PI); fillStroke(c, '#18181c');
    c.fillStyle = '#e8c24a'; c.beginPath(); for (let j = 0; j < 10; j++) { const a = j * Math.PI / 5 - Math.PI / 2, rr = j % 2 ? 9 : 22; c.lineTo(x + Math.cos(a) * rr, y - r + 28 + Math.sin(a) * rr); } c.closePath(); c.fill(); stroke(c, 3);
  } else if (h === 'cap') {""")
sub(C,"  if (s.sunglasses) {","""  if (s.headset) { c.beginPath(); c.arc(x, y - 10, HR + 12, Math.PI * 1.05, Math.PI * 1.95); stroke(c, 14); c.beginPath(); c.arc(x, y - 10, HR + 12, Math.PI * 1.05, Math.PI * 1.95); c.lineWidth = 7; c.strokeStyle = '#3a3a40'; c.stroke(); for (const sd of [-1, 1]) { rrect(c, x + sd * (HR + 2) - 22, y - 30, 44, 70, 16); fillStroke(c, '#2a2a30', 7); } line(c, [[x - HR + 4, y + 30], [x - 40, y + 70]], 7); circ(c, x - 34, y + 72, 10, '#2a2a30', 5); }
  if (s.sunglasses) {""")
sub(C,"    case 'photo':","""    case 'phone': post = () => { arm([SR, [400, 360], [372, 250]]); handset(c, 378, 214, -0.25); hand(372, 250); }; arm([SL, [150, 500], [196, 548]]); break;
    case 'papers': post = () => { arm([SL, [160, 470], [178, 430]]); arm([SR, [352, 470], [334, 430]]); papers(c, 256, 440); }; break;
    case 'photo':""")
print('ok')
