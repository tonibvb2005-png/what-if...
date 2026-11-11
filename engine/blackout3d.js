// BLACKOUT-Set: Skyline bei Nacht, Wohnung im 9. Stock, Treppenhaus. (Stil: Fiktion + echte Überlebensfakten)
(() => {
  const { std, basic, put, rbox, canvasTex, plane } = W3.H, R = W3.reg;
  const rnd = (s) => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  function winTex(seed, cols, rows, lit) {
    const r = rnd(seed);
    return canvasTex(cols * 8, rows * 10, (g, w, h) => {
      g.fillStyle = '#0d1018'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const on = r() < lit; g.fillStyle = on ? (r() < .8 ? '#ffcf86' : '#cfe0ff') : '#161a24'; g.fillRect(x * 8 + 2, y * 10 + 2, 4, 6);
      }
    });
  }
  W3.BUILD.blackout = async () => {
    const sc = W3.scene;
    sc.background = new THREE.Color('#070912'); sc.fog = new THREE.FogExp2('#080a14', .006);
    R.hemi = new THREE.HemisphereLight('#7f8cc0', '#0a0a10', .35); sc.add(R.hemi);
    const moon = new THREE.DirectionalLight('#aab8ff', .5); moon.position.set(-20, 30, -10); sc.add(moon);

    /* ---------- Skyline (Außen), weit weg vom Innenraum bei z = -200 */
    R.city = new THREE.Group(); R.city.position.set(0, 0, -200); sc.add(R.city);
    const gr = put(new THREE.Mesh(new THREE.PlaneGeometry(800, 800), std('#0b0d14')), 0, 0, 0, R.city, false); gr.rotation.x = -Math.PI / 2;
    const sky = canvasTex(4, 256, (g, w, h) => { const q = g.createLinearGradient(0, 0, 0, h); q.addColorStop(0, '#04050b'); q.addColorStop(.7, '#141a34'); q.addColorStop(1, '#2a2440'); g.fillStyle = q; g.fillRect(0, 0, w, h); });
    put(new THREE.Mesh(new THREE.PlaneGeometry(900, 260), basic('#ffffff', { map: sky, fog: false })), 0, 110, -380, R.city, false);
    R.districts = [[], [], [], []];
    const r = rnd(42);
    for (let i = 0; i < 110; i++) {
      const x = (r() - .5) * 360, z = -40 - r() * 260, w = 10 + r() * 18, d = 10 + r() * 18, h = 20 + Math.pow(r(), 2.2) * 150 * (Math.abs(x) < 60 ? 1.6 : 1);
      const lit = .4 + r() * .4, tex = winTex(i + 7, Math.round(w / 2), Math.round(h / 3), lit);
      const m = new THREE.MeshStandardMaterial({ color: '#141824', roughness: .9, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 1.6 });
      const b = put(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m), x, h / 2, z, R.city, false);
      const dist = x < -60 ? 0 : x > 60 ? 1 : 2; R.districts[dist].push(m);
      if (r() < .15) put(new THREE.Mesh(new THREE.SphereGeometry(.8, 8, 6), basic('#ff2a2a')), x, h + 1, z, R.city, false);
    }
    // dein Haus (nah, 12 Stockwerke) mit deinem Fenster
    const myTex = winTex(999, 10, 12, .45);
    R.myHouseM = new THREE.MeshStandardMaterial({ color: '#1a1e2a', roughness: .9, emissive: '#ffffff', emissiveMap: myTex, emissiveIntensity: 1 });
    put(new THREE.Mesh(new THREE.BoxGeometry(22, 40, 16), R.myHouseM), 14, 20, -18, R.city, false);
    R.districts[3].push(R.myHouseM);
    R.streetL = [];
    for (let i = 0; i < 8; i++) { const l = new THREE.PointLight('#ffb35a', 60, 30, 1.6); l.position.set(-30 + i * 9, 6, 2); R.city.add(l); R.streetL.push(l);
      put(new THREE.Mesh(new THREE.SphereGeometry(.4, 8, 6), basic('#ffd08a')), -30 + i * 9, 6, 2, R.city, false); }
    R.setDistrict = (k, on) => { R.districts[k].forEach(m => m.emissiveIntensity = 1.6 * on); if (k === 3) R.streetL.forEach(l => l.intensity = 60 * on); };

    /* ---------- Wohnung (Innen) um den Ursprung */
    R.apt = new THREE.Group(); sc.add(R.apt);
    const wall = std('#3a3d4a'), floor = std('#3b2f28'), counter = std('#c9c4bb'), dark = std('#1c1d22');
    const fl = put(new THREE.Mesh(new THREE.PlaneGeometry(7, 6), floor), 0, 0, 0, R.apt, false); fl.rotation.x = -Math.PI / 2;
    const ce = put(new THREE.Mesh(new THREE.PlaneGeometry(7, 6), std('#2a2c33')), 0, 2.6, 0, R.apt, false); ce.rotation.x = Math.PI / 2;
    put(new THREE.Mesh(new THREE.PlaneGeometry(7, 2.6), wall), 0, 1.3, 3, R.apt, false).rotation.y = Math.PI;
    for (const sx of [-1, 1]) put(new THREE.Mesh(new THREE.PlaneGeometry(6, 2.6), wall), sx * 3.5, 1.3, 0, R.apt, false).rotation.y = -sx * Math.PI / 2;
    // Fensterfront hinten (z=-3) mit Blick auf die Stadt
    const view = canvasTex(1024, 384, (g, w, h) => {
      const q = g.createLinearGradient(0, 0, 0, h); q.addColorStop(0, '#05060c'); q.addColorStop(1, '#1a1f36'); g.fillStyle = q; g.fillRect(0, 0, w, h);
      const rr = rnd(5); let x = 0; while (x < w) { const bw = 20 + rr() * 60, bh = 60 + rr() * 220; g.fillStyle = '#090b12'; g.fillRect(x, h - bh, bw, bh);
        for (let yy = h - bh + 6; yy < h - 4; yy += 9) for (let xx = x + 3; xx < x + bw - 3; xx += 7) if (rr() < .25) { g.fillStyle = 'rgba(255,207,134,.9)'; g.fillRect(xx, yy, 3, 4); }
        x += bw + 3; }
    });
    const viewDark = canvasTex(1024, 384, (g, w, h) => {
      const q = g.createLinearGradient(0, 0, 0, h); q.addColorStop(0, '#04050a'); q.addColorStop(1, '#111427'); g.fillStyle = q; g.fillRect(0, 0, w, h);
      const rr = rnd(5); let x = 0; while (x < w) { const bw = 20 + rr() * 60, bh = 60 + rr() * 220; g.fillStyle = '#07080d'; g.fillRect(x, h - bh, bw, bh); x += bw + 3; }
      g.fillStyle = 'rgba(255,40,40,.9)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(80 + i * 160, 120 + (i % 3) * 40, 2, 0, 7); g.fill(); }
    });
    R.viewMat = basic('#ffffff', { map: view }); R.viewLit = view; R.viewDark = viewDark;
    put(new THREE.Mesh(new THREE.PlaneGeometry(6.2, 2.2), R.viewMat), 0, 1.35, -3.05, R.apt, false);
    for (let x = -3; x <= 3.01; x += 1.55) put(new THREE.Mesh(new THREE.BoxGeometry(.07, 2.3, .08), dark), x, 1.35, -2.98, R.apt);
    put(new THREE.Mesh(new THREE.BoxGeometry(6.4, .08, .1), dark), 0, .23, -2.98, R.apt); put(new THREE.Mesh(new THREE.BoxGeometry(6.4, .08, .1), dark), 0, 2.48, -2.98, R.apt);
    // Möbel: Sofa, Tisch, Küchenzeile mit Kühlschrank und Spüle
    put(rbox(2.0, .45, .9, .1, std('#3d4a63')), -1.4, .32, -1.2, R.apt); put(rbox(2.0, .55, .25, .1, std('#3d4a63')), -1.4, .62, -1.6, R.apt);
    put(rbox(1.0, .06, .6, .02, std('#6b5440')), -1.4, .42, -.2, R.apt);
    put(rbox(2.6, .9, .65, .02, counter), 2.1, .45, 2.55, R.apt);
    R.fridge = put(rbox(.7, 1.85, .7, .03, std('#d7d8dc', { r: .4 })), .45, .93, 2.6, R.apt);
    put(new THREE.Mesh(new THREE.BoxGeometry(.03, .5, .03), std('#888')), .14, 1.2, 2.24, R.apt);
    put(rbox(.6, .05, .45, .02, std('#8c9099', { m: .6, r: .3 })), 2.4, .91, 2.5, R.apt);
    R.tap = put(new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .3, 8), std('#b9bcc4', { m: .7, r: .25 })), 2.4, 1.05, 2.72, R.apt);
    R.water = put(new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .28, 8), basic('#bfd8ff', { transparent: true, opacity: .7 })), 2.4, 1.02, 2.62, R.apt, false);
    R.bottles = [0, 1, 2].map(i => put(new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .3, 12), basic('#9fc6ff', { transparent: true, opacity: .45 })), 1.7 + i * .14, 1.05, 2.45, R.apt, false));
    R.phoneL = new THREE.PointLight('#bcd3ff', 1.6, 3, 2); R.phoneL.position.set(0, 1.2, .3); R.apt.add(R.phoneL);
    R.moonIn = new THREE.DirectionalLight('#8f9ccc', .35); R.moonIn.position.set(0, 3, -8); R.moonIn.target.position.set(0, 0, 1); R.apt.add(R.moonIn, R.moonIn.target);
    R.hero = W3.H.makeChar({ shirt: '#3e4a5e', tie: '#3e4a5e', pants: '#22252d', skin: '#b98a6a', hair: '#231a14' });

    /* ---------- Treppenhaus/Flur bei z = 100 */
    R.hall = new THREE.Group(); R.hall.position.set(0, 0, 100); sc.add(R.hall);
    const hw = std('#4a4c52'), hd = std('#5a4636');
    const hf = put(new THREE.Mesh(new THREE.PlaneGeometry(2.4, 10), std('#2e2f33')), 0, 0, 0, R.hall, false); hf.rotation.x = -Math.PI / 2;
    const hc = put(new THREE.Mesh(new THREE.PlaneGeometry(2.4, 10), std('#26272b')), 0, 2.5, 0, R.hall, false); hc.rotation.x = Math.PI / 2;
    for (const sx of [-1, 1]) put(new THREE.Mesh(new THREE.PlaneGeometry(10, 2.5), hw), sx * 1.2, 1.25, 0, R.hall, false).rotation.y = -sx * Math.PI / 2;
    put(new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.5), hw), 0, 1.25, -5, R.hall, false);
    R.doors = [];
    for (const [sx, z] of [[-1, -1.5], [1, -2.8], [-1, 1.5]]) {
      put(new THREE.Mesh(new THREE.BoxGeometry(.06, 2.05, .95), hd), sx * 1.17, 1.03, z, R.hall);
      put(new THREE.Mesh(new THREE.SphereGeometry(.03, 10, 8), std('#c9b071', { m: .7, r: .3 })), sx * 1.13, 1.0, z + .35, R.hall);
    }
    // Lichtspalt unter Brandts Tür (Generator-Licht) + Notausgang-Schild
    R.gap = put(new THREE.Mesh(new THREE.BoxGeometry(.02, .015, .85), basic('#ffd9a0')), 1.15, .008, -2.8, R.hall, false);
    R.gapL = new THREE.PointLight('#ffcf8a', 2, 2, 2); R.gapL.position.set(1.05, .05, -2.8); R.hall.add(R.gapL);
    const exit = canvasTex(256, 100, (g, w, h) => { g.fillStyle = '#16b35a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = 'bold 34px sans-serif'; g.fillText('🏃  →', 70, 64); });
    put(new THREE.Mesh(new THREE.PlaneGeometry(.4, .16), basic('#ffffff', { map: exit })), 0, 2.2, -4.95, R.hall, false);
    R.exitL = new THREE.PointLight('#3dff8f', 1.2, 4, 2); R.exitL.position.set(0, 2.0, -4.6); R.hall.add(R.exitL);
    R.candle = new THREE.PointLight('#ffb050', 0, 3.5, 1.8); R.candle.position.set(-.3, 1.2, -.6); R.hall.add(R.candle);
    R.candleM = put(new THREE.Mesh(new THREE.SphereGeometry(.025, 10, 8), basic('#ffd27a')), -.3, 1.2, -.6, R.hall, false);
    R.neighbor = W3.H.makeChar({ shirt: '#6b5a48', tie: '#6b5a48', pants: '#3a3630', skin: '#d8b49a', hair: '#bdbdbd' });
  };
})();
