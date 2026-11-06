// Zusätzliche 3D-Sets: Keller, Zelt im Wald, Auto auf der Landstraße.
(() => {
  const { std, basic, put, rbox, canvasTex, svgTex, plane } = W3.H, R = W3.reg;
  const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const inst = (geo, mat, n) => { const m = new THREE.InstancedMesh(geo, mat, n); m.castShadow = true; m.receiveShadow = true; W3.scene.add(m); return m; };
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1);
  const setInst = (m, i, x, y, z, ry = 0, s = 1) => { Q.setFromEuler(new THREE.Euler(0, ry, 0)); M4.compose(V.set(x, y, z), Q, S1.set(s, s, s)); m.setMatrixAt(i, M4); };

  /* =============================================================== KELLER */
  W3.BUILD.cellar = async (A) => {
    const sc = W3.scene;
    sc.background = new THREE.Color('#040405'); sc.fog = new THREE.FogExp2('#040405', .085);
    R.hemi = new THREE.HemisphereLight('#d6d0c4', '#151515', .3); sc.add(R.hemi);
    const concrete = std('#47474c'), wallM = std('#6b6b70'), wood = std('#5a4c3c'), dark = basic('#060607');
    const fl = put(new THREE.Mesh(new THREE.PlaneGeometry(1.8, 20), concrete), 0, 0, 6, sc, false); fl.rotation.x = -Math.PI / 2;
    const ce = put(new THREE.Mesh(new THREE.PlaneGeometry(1.8, 20), std('#2e2e33')), 0, 2.3, 6, sc, false); ce.rotation.x = Math.PI / 2;
    // Waschküche am Anfang (feste Wände) + Waschmaschine
    for (const sx of [-1, 1]) { const w = put(new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.3), wallM), sx * .9, 1.15, -.8, sc, false); w.rotation.y = -sx * Math.PI / 2; }
    put(new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.3), wallM), 0, 1.15, -2.6, sc, false);
    put(rbox(.6, .85, .6, .04, std('#d9d9dc', { r: .5 })), -.5, .43, -2.25);
    const door = put(new THREE.Mesh(new THREE.TorusGeometry(.17, .03, 12, 32), std('#9fa0a6', { m: .6, r: .35 })), -.5, .5, -1.94);
    put(new THREE.Mesh(new THREE.CircleGeometry(.16, 32), std('#1c2026', { r: .15 })), -.5, .5, -1.945);
    put(rbox(.5, .03, .3, .01, wood), .5, 1.2, -2.42); put(rbox(.12, .2, .08, .02, std('#3b6fb0')), .4, 1.32, -2.42); put(rbox(.1, .16, .08, .02, std('#c2462f')), .58, 1.3, -2.42);
    // Gang mit Lattenverschlägen links und rechts
    const n = 108, slat = new THREE.BoxGeometry(.03, 1.95, .07);
    for (const sx of [-1, 1]) {
      const m = inst(slat, wood, n);
      for (let i = 0; i < n; i++) setInst(m, i, sx * .82, 1.0, 1.0 + i * .108);
      m.instanceMatrix.needsUpdate = true;
      for (const y of [.25, 1.85]) put(new THREE.Mesh(new THREE.BoxGeometry(.05, .08, 11.7), wood), sx * .84, y, 6.85);
      for (let z = 1; z <= 12.8; z += 2.35) put(new THREE.Mesh(new THREE.BoxGeometry(.09, 2.3, .09), wood), sx * .84, 1.15, z);
      put(new THREE.Mesh(new THREE.PlaneGeometry(11.8, 2.3), dark), sx * 1.5, 1.15, 6.9, sc, false).rotation.y = -sx * Math.PI / 2;
      const r = rng(sx > 0 ? 7 : 3);
      for (let i = 0; i < 9; i++) put(rbox(.35 + r() * .3, .25 + r() * .4, .3 + r() * .3, .02, std(['#4a3e32', '#3c3a36', '#5a5650'][i % 3])), sx * (1.15 + r() * .15), .2 + r() * .3, 1.5 + i * 1.25);
    }
    // Rohre an der Decke
    for (const [x, y, r_] of [[.5, 2.16, .05], [.33, 2.2, .03], [-.55, 2.18, .035]]) { const p = put(new THREE.Mesh(new THREE.CylinderGeometry(r_, r_, 16, 12), std('#7d7f86', { m: .5, r: .45 })), x, y, 6); p.rotation.x = Math.PI / 2; }
    // Glühbirnen im Käfig (gemeinsamer Zeitschalter)
    R.bulbs = [];
    for (const z of [.9, 4.4, 7.9, 11.4]) {
      const b = put(new THREE.Mesh(new THREE.SphereGeometry(.045, 16, 10), basic('#fff1cf')), 0, 2.08, z, sc, false);
      put(new THREE.Mesh(new THREE.TorusGeometry(.07, .004, 6, 20), std('#444')), 0, 2.08, z).rotation.x = Math.PI / 2;
      put(new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, .2, 6), std('#333')), 0, 2.2, z);
      const l = new THREE.PointLight('#ffd9a3', 1.4, 7, 1.6); l.position.set(0, 2.0, z); sc.add(l);
      if (z < 1) { l.castShadow = true; l.shadow.mapSize.set(512, 512); l.shadow.bias = -.004; }
      R.bulbs.push({ b, l });
    }
    // Treppe + Notausgang am Ende
    for (let i = 0; i < 9; i++) put(new THREE.Mesh(new THREE.BoxGeometry(1.6, .18, .28), concrete), 0, .09 + i * .18, 13.2 + i * .28);
    put(new THREE.Mesh(new THREE.PlaneGeometry(1.8, 4), wallM), 0, 2, 15.9, sc, false).rotation.y = Math.PI;
    const exitTex = canvasTex(256, 100, (g, w, h) => {
      g.fillStyle = '#16b35a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff';
      g.beginPath(); g.arc(50, 24, 9, 0, 7); g.fill(); g.fillRect(44, 34, 12, 30); g.fillRect(34, 60, 10, 26); g.fillRect(56, 60, 10, 26); g.fillRect(28, 38, 40, 8);
      g.font = 'bold 30px sans-serif'; g.fillText('→ AUSGANG', 86, 62);
    });
    const ex = put(new THREE.Mesh(new THREE.PlaneGeometry(.42, .16), basic('#ffffff', { map: exitTex })), 0, 2.1, 12.95, sc, false); ex.rotation.y = Math.PI;
    R.exitLight = new THREE.PointLight('#38ff8a', .5, 4, 1.6); R.exitLight.position.set(0, 1.9, 12.6); sc.add(R.exitLight);
    // Zeitschalter an der linken Wand (Knopf glüht orange im Dunkeln)
    put(rbox(.03, .13, .09, .006, std('#d8d6cf')), -.885, 1.15, .45);
    R.switchBtn = put(new THREE.Mesh(new THREE.BoxGeometry(.02, .05, .05), basic('#ff8a2a')), -.868, 1.15, .45, W3.scene, false);
    R.switchLight = new THREE.PointLight('#ff8a2a', .25, .9, 2); R.switchLight.position.set(-.8, 1.15, .45); sc.add(R.switchLight);
    // Gestalt im Gang (2D)
    R.figure = put(new THREE.Mesh(new THREE.PlaneGeometry(.9, 2.3), basic('#ffffff', { map: await svgTex(A.creatureCellar || A.creature, 900, 2300), transparent: true, alphaTest: .02 })), .1, 1.15, 13, sc, false);
    R.figure.rotation.y = Math.PI; R.figure.material.toneMapped = false;
    plane('you', 2, 2); plane('hand', .5, .5, 1024);
    R.setLight = (L, fig) => {
      for (const { b, l } of R.bulbs) { l.intensity = 1.5 * L; b.material.color.set(L > .05 ? '#fff1cf' : '#18140e'); }
      R.hemi.intensity = .02 + .28 * L;
      R.figure.material.color.setRGB(.03 + .16 * L, .03 + .16 * L, .04 + .18 * L);
      R.figure.position.z = fig; R.figure.visible = fig < 50;
    };
  };

  /* =============================================================== ZELT */
  W3.BUILD.tent = async (A) => {
    const sc = W3.scene;
    sc.background = new THREE.Color('#06080d'); sc.fog = new THREE.FogExp2('#070a10', .06);
    sc.add(new THREE.HemisphereLight('#8e9ac4', '#0b0d0c', .6));
    const moon = new THREE.DirectionalLight('#b8c4ff', 1.0); moon.position.set(-5, 9, -3); moon.target.position.set(0, 0, 0);
    moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); Object.assign(moon.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 30 }); moon.shadow.bias = -.002;
    sc.add(moon, moon.target);
    const g = put(new THREE.Mesh(new THREE.PlaneGeometry(80, 80), std('#1b201c')), 0, 0, 0, sc, false); g.rotation.x = -Math.PI / 2;
    // Bäume
    const r = rng(11), N = 70;
    const trunks = inst(new THREE.CylinderGeometry(.1, .16, 7, 8), std('#15171a'), N);
    const crowns = inst(new THREE.ConeGeometry(1.2, 3.6, 9), std('#121916'), N * 2);
    for (let i = 0; i < N; i++) {
      let x, z, ok = false, s = .8 + r() * .6;
      while (!ok) {   // keine Bäume zwischen Kamera und Zelt
        const a = r() * Math.PI * 2, d = 4.5 + r() * 18; x = Math.cos(a) * d; z = Math.sin(a) * d - 2;
        const ang = Math.atan2(x, z), dist = Math.hypot(x, z);
        ok = !(ang > .55 && ang < 1.5 && dist < 13) && !(Math.abs(x - 1.3) < 1.5 && Math.abs(z - 2.6) < 1.5);
      }
      setInst(trunks, i, x, 3.5 * s, z, 0, s); setInst(crowns, i * 2, x, 4.2 * s, z, r() * 3, s); setInst(crowns, i * 2 + 1, x, 5.8 * s, z, r() * 3, s * .75);
    }
    trunks.instanceMatrix.needsUpdate = crowns.instanceMatrix.needsUpdate = true;
    // Mond
    put(new THREE.Mesh(new THREE.SphereGeometry(1.3, 20, 12), basic('#e8edff')), -16, 10, -30, sc, false);
    // Zelt (A-Form, Eingang zeigt nach +z)
    const W = .95, Hh = 1.3, L = 1.15;
    const geo = new THREE.BufferGeometry();
    const v = [-W, 0, -L, 0, Hh, -L, 0, Hh, L, -W, 0, -L, 0, Hh, L, -W, 0, L,   W, 0, -L, 0, Hh, L, 0, Hh, -L, W, 0, -L, W, 0, L, 0, Hh, L,
      -W, 0, -L, W, 0, -L, 0, Hh, -L,   -W, 0, L, 0, Hh, L, W, 0, L];
    geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); geo.computeVertexNormals();
    const fabric = new THREE.MeshStandardMaterial({ color: '#5a6b5d', roughness: .95, side: THREE.DoubleSide, emissive: '#3a4a66', emissiveIntensity: .2 });
    R.fabric = fabric;
    R.inLight = new THREE.PointLight('#8ea2d8', 0, 3, 2); R.inLight.position.set(0, .9, .1); sc.add(R.inLight);
    R.tent = put(new THREE.Mesh(geo, fabric), 0, 0, 0);
    put(new THREE.Mesh(new THREE.PlaneGeometry(1.88, 2.28), std('#262b27')), 0, .005, 0, sc, false).rotation.x = -Math.PI / 2;
    put(new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 2.4, 6), std('#2a2d30')), 0, Hh, 0).rotation.x = Math.PI / 2;
    // Reißverschluss am Eingang
    put(new THREE.Mesh(new THREE.BoxGeometry(.012, 1.22, .006), basic('#0c0e10')), 0, .62, L + .003, sc, false);
    put(new THREE.Mesh(new THREE.BoxGeometry(.012, 1.22, .006), basic('#0c0e10')), 0, .62, L - .003, sc, false);
    R.zip = put(new THREE.Mesh(new THREE.BoxGeometry(.03, .05, .012), std('#a8aab2', { m: .7, r: .3 })), 0, .1, L - .01);
    // Schlafsäcke + Kissen + Rucksack + Laterne
    put(rbox(.62, .2, 1.7, .09, std('#6b2c36')), -.43, .1, .12);
    put(rbox(.62, .2, 1.7, .09, std('#2a4470')), .43, .1, .12);
    for (const x of [-.43, .43]) put(rbox(.42, .1, .26, .045, std('#c6c7cf')), x, .06, -.84);
    put(rbox(.3, .42, .2, .06, std('#4a3a2a')), -.72, .21, -.98);
    put(new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .13, 12), std('#3c3f46', { m: .4 })), .1, 1.08, -.2);
    // Lagerfeuer-Glut vor dem Zelt
    const fr = rng(5);
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; put(new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), std('#4b4d52')), 1.3 + Math.cos(a) * .32, .05, 2.6 + Math.sin(a) * .32); }
    R.embers = [];
    for (let i = 0; i < 7; i++) R.embers.push(put(new THREE.Mesh(new THREE.SphereGeometry(.04 + fr() * .03, 8, 6), basic('#ff6a1a')), 1.3 + (fr() - .5) * .3, .04, 2.6 + (fr() - .5) * .3, sc, false));
    R.fire = new THREE.PointLight('#ff7a2a', .7, 5, 2); R.fire.position.set(1.3, .3, 2.6); sc.add(R.fire);
    // Schatten auf der rechten Zeltwand (innen) + Hand-Schatten am Eingang
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), basic('#000000', { map: await svgTex(A.tentShadow, 1100, 800), transparent: true, opacity: 0, depthWrite: false }));
    sh.position.set(W / 2 - .02, Hh / 2, 0); sh.lookAt(new THREE.Vector3(-1.3, -.95, 0).normalize().multiplyScalar(2).add(sh.position)); sc.add(sh); R.wallShadow = sh;
    const hs = new THREE.Mesh(new THREE.PlaneGeometry(.5, .5), basic('#000000', { map: await svgTex(A.handShadow, 500, 500), transparent: true, opacity: 0, depthWrite: false }));
    hs.position.set(.08, .4, L - .012); hs.rotation.y = Math.PI; sc.add(hs); R.handShadow = hs;
    plane('you', .8, .8); plane('jonas', .8, .8);
    R.tick = (t) => { const f = .75 + .25 * Math.sin(t * 7) * Math.sin(t * 2.3); R.fire.intensity = .7 * f; R.embers.forEach((e, i) => e.material.color.setHSL(.05, 1, .35 + .12 * Math.sin(t * 5 + i))); };
  };

  /* =============================================================== AUTO */
  W3.BUILD.car = async (A) => {
    const sc = W3.scene;
    sc.background = new THREE.Color('#030407'); sc.fog = new THREE.FogExp2('#04050a', .045);
    R.hemi = new THREE.HemisphereLight('#7b86b2', '#08080a', .45); sc.add(R.hemi);
    const moon = new THREE.DirectionalLight('#aab6ff', .35); moon.position.set(-8, 12, -6); sc.add(moon);
    // Straße, Seitenstreifen, Mittellinie, Bäume (alles bewegt sich, das Auto steht)
    const road = put(new THREE.Mesh(new THREE.PlaneGeometry(7, 500), std('#1c1d22', { r: .7 })), 0, 0, -150, sc, false); road.rotation.x = -Math.PI / 2;
    const grass = put(new THREE.Mesh(new THREE.PlaneGeometry(200, 500), std('#111511')), 0, -.01, -150, sc, false); grass.rotation.x = -Math.PI / 2;
    for (const x of [-3.3, 3.3]) put(new THREE.Mesh(new THREE.PlaneGeometry(.1, 500), basic('#8a8a84')), x, .004, -150, sc, false).rotation.x = -Math.PI / 2;
    R.dashes = inst(new THREE.BoxGeometry(.12, .006, 2.2), basic('#c9c6b8'), 40);
    const r = rng(23), NT = 140;
    R.trunks = inst(new THREE.CylinderGeometry(.14, .2, 7, 7), std('#16181b'), NT);
    R.crowns = inst(new THREE.ConeGeometry(1.4, 4.2, 8), std('#111713'), NT);
    R.treeData = Array.from({ length: NT }, () => ({ x: (r() > .5 ? 1 : -1) * (4.6 + r() * 9), z: r() * 240, s: .8 + r() * .7 }));
    // Eigenes Auto: Außenhülle (nur Außenaufnahmen) und Innenraum
    R.ext = new THREE.Group(); sc.add(R.ext);
    put(rbox(1.82, .62, 4.3, .14, std('#3c4256', { m: .3, r: .5 })), 0, .55, .3, R.ext);
    put(rbox(1.58, .52, 2.2, .16, std('#0b0c10', { m: .2, r: .15 })), 0, 1.12, .55, R.ext);
    for (const x of [-.65, .65]) {
      put(new THREE.Mesh(new THREE.BoxGeometry(.32, .1, .02), basic('#ff2626')), x, .72, 2.46, R.ext, false);
      put(new THREE.Mesh(new THREE.BoxGeometry(.3, .1, .02), basic('#fff6dc')), x, .66, -1.86, R.ext, false);
      for (const z of [-1.0, 1.6]) { const w = put(new THREE.Mesh(new THREE.CylinderGeometry(.33, .33, .22, 18), std('#0c0c0e')), x * 1.36, .33, z, R.ext); w.rotation.z = Math.PI / 2; }
    }
    R.tail = new THREE.PointLight('#ff2020', 3, 4, 2); R.tail.position.set(0, .7, 2.7); R.ext.add(R.tail);
    R.int = new THREE.Group(); sc.add(R.int);
    const trim = std('#1a1b21'), seat = std('#2b2c33');
    put(rbox(1.62, .26, .5, .06, trim), 0, .86, -.7, R.int);
    put(new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.4), std('#1c1d23')), 0, 1.46, .5, R.int, false).rotation.x = Math.PI / 2;
    for (const sx of [-1, 1]) {
      put(new THREE.Mesh(new THREE.BoxGeometry(.06, .6, .08), trim), sx * .78, 1.16, -.5, R.int).rotation.z = sx * .25;
      put(new THREE.Mesh(new THREE.BoxGeometry(.06, .5, .1), trim), sx * .8, 1.2, .62, R.int);
      put(new THREE.Mesh(new THREE.BoxGeometry(.08, .55, .14), trim), sx * .79, 1.18, 1.52, R.int);
      put(new THREE.Mesh(new THREE.BoxGeometry(.06, .55, 2.2), trim), sx * .82, .66, .5, R.int);
      put(rbox(.5, .16, .52, .06, seat), sx * .37, .47, .15, R.int);
      const back = put(rbox(.5, .72, .13, .06, seat), sx * .37, .86, .43, R.int); back.rotation.x = -.12;
      put(rbox(.26, .17, .1, .04, seat), sx * .37, 1.3, .47, R.int);
    }
    put(rbox(1.44, .16, .52, .06, seat), 0, .47, 1.1, R.int);
    const rb = put(rbox(1.44, .66, .13, .06, seat), 0, .83, 1.4, R.int); rb.rotation.x = -.15;
    put(new THREE.Mesh(new THREE.BoxGeometry(1.5, .04, .3), trim), 0, 1.0, 1.58, R.int);
    // Lenkrad, Tacho-Glühen, Radio
    // Lenkrad direkt vor dem Fahrer (Hände greifen es, siehe sets.js)
    const wheelM = std('#1b1b21', { r: .6 });
    const wheel = put(new THREE.Mesh(new THREE.TorusGeometry(.15, .019, 14, 40), wheelM), -.37, .97, -.06, R.int); wheel.rotation.x = -.35;
    const hub = put(new THREE.Mesh(new THREE.CylinderGeometry(.055, .06, .04, 20), wheelM), -.37, .955, -.07, R.int); hub.rotation.x = Math.PI / 2 - .35;
    for (const a of [Math.PI / 2 + .1, -.35, Math.PI + .35]) { const sp = put(new THREE.Mesh(new THREE.BoxGeometry(.13, .02, .012), wheelM), -.37 + Math.cos(a) * .075, .97 + Math.sin(a) * .075 * .94, -.062, R.int); sp.rotation.z = a; }
    const col = put(new THREE.Mesh(new THREE.CylinderGeometry(.03, .035, .48, 10), wheelM), -.37, .9, -.3, R.int); col.rotation.x = 1.35;
    put(new THREE.Mesh(new THREE.PlaneGeometry(.34, .09), basic('#3d7fd6')), -.37, .985, -.455, R.int, false).rotation.x = -.5;
    R.radio = put(new THREE.Mesh(new THREE.PlaneGeometry(.22, .07), basic('#d9922e')), .05, .9, -.45, R.int, false); R.radio.rotation.x = -.4;
    put(rbox(.24, .075, .04, .015, std('#111')), 0, 1.33, -.52, R.int);
    R.dash = new THREE.PointLight('#5a8cff', 1.2, 1.6, 2); R.dash.position.set(-.37, 1.0, -.3); R.int.add(R.dash);
    // Unsere Scheinwerfer
    for (const x of [-.6, .6]) { const l = new THREE.SpotLight('#fff1d2', 140, 70, .42, .55, 1.5); l.position.set(x, .7, -1.9); l.target.position.set(x * 1.5, 0, -22); sc.add(l, l.target); }
    // Das Auto dahinter
    R.follow = new THREE.Group(); sc.add(R.follow);
    put(rbox(1.8, .62, 4.0, .14, std('#2a2c33')), 0, .55, 0, R.follow); put(rbox(1.5, .5, 2.0, .16, std('#08090c')), 0, 1.08, .3, R.follow);
    R.fLamps = [-.6, .6].map(x => put(new THREE.Mesh(new THREE.CircleGeometry(.12, 20), basic('#fffbe8')), x, .66, -2.01, R.follow, false));
    R.fLamps.forEach(l => l.rotation.y = Math.PI);
    R.fSpots = [-.6, .6].map(x => { const l = new THREE.SpotLight('#f4f2ff', 20, 40, .5, .6, 1.5); l.position.set(x, .75, -2.1); const tg = new THREE.Object3D(); tg.position.set(x * .4, .6, -14); R.follow.add(l, tg); l.target = tg; return l; });
    // Das Ding auf dem Rücksitz (nur im Lichtblitz sichtbar)
    R.backseat = put(new THREE.Mesh(new THREE.PlaneGeometry(.95, 1.0), basic('#ffffff', { map: await svgTex(A.backseat, 950, 1000), transparent: true, alphaTest: .02, opacity: 1 })), .18, 1.0, 1.2, sc, false);
    R.backseat.position.x = .02; R.backseat.rotation.y = Math.PI; R.backseat.material.toneMapped = false;
    plane('you', 1.1, 1.1);
    R.tick = (t, speed = 24) => {
      for (let i = 0; i < 40; i++) setInst(R.dashes, i, 0, .004, ((i * 6 + t * speed) % 240) - 200);
      R.dashes.instanceMatrix.needsUpdate = true;
      R.treeData.forEach((d, i) => { const z = ((d.z + t * speed) % 240) - 200; setInst(R.trunks, i, d.x, 3.5 * d.s, z, 0, d.s); setInst(R.crowns, i, d.x, 5.2 * d.s, z, 0, d.s); });
      R.trunks.instanceMatrix.needsUpdate = R.crowns.instanceMatrix.needsUpdate = true;
    };
  };
})();

// ======================================================================= Weitere Sets
(() => {
  const { std, basic, put, rbox, canvasTex, plane } = W3.H, R = W3.reg;
  const dynTex = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return { c, g: c.getContext('2d'), t }; };

  /* =============================================================== AUFZUG + BÜROFLUR */
  W3.BUILD.elevator = async () => {
    const sc = W3.scene;
    sc.background = new THREE.Color('#05060a'); sc.fog = new THREE.FogExp2('#05060a', .07);
    R.hemi = new THREE.HemisphereLight('#c8ccd8', '#141418', .3); sc.add(R.hemi);
    const steel = std('#5f636d', { m: .35, r: .4 }), dark = std('#232428'), wall = std('#5d6068');
    // Kabine (x -.8..8, z -.75..75)
    const fl = put(new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.5), dark), 0, .002, 0, sc, false); fl.rotation.x = -Math.PI / 2;
    put(new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.3), steel), 0, 1.15, -.75, sc, false);
    for (const sx of [-1, 1]) put(new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.3), steel), sx * .8, 1.15, 0, sc, false).rotation.y = -sx * Math.PI / 2;
    const ce = put(new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.5), std('#3a3c43')), 0, 2.3, 0, sc, false); ce.rotation.x = Math.PI / 2;
    R.panelLight = put(new THREE.Mesh(new THREE.PlaneGeometry(1.0, .7), basic('#cfd6ea')), 0, 2.29, 0, sc, false); R.panelLight.rotation.x = Math.PI / 2;
    R.cabLight = new THREE.PointLight('#e8eeff', 3, 4, 1.6); R.cabLight.position.set(0, 2.1, 0); sc.add(R.cabLight);
    const rail = put(new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, 1.4, 10), std('#b9bcc4', { m: .7, r: .25 })), 0, .95, -.7); rail.rotation.z = Math.PI / 2;
    // Bedienfeld rechts
    put(rbox(.02, .5, .22, .006, std('#a3a6ae', { m: .6, r: .3 })), .79, 1.2, .45);
    R.btn = dynTex(128, 300); R.btnPlane = put(new THREE.Mesh(new THREE.PlaneGeometry(.2, .46), basic('#ffffff', { map: R.btn.t, transparent: true })), .778, 1.2, .45, sc, false); R.btnPlane.rotation.y = -Math.PI / 2;
    // Front: Türrahmen, Türen, Anzeige über der Tür
    put(new THREE.Mesh(new THREE.BoxGeometry(.35, 2.3, .06), steel), -.625, 1.15, .75); put(new THREE.Mesh(new THREE.BoxGeometry(.35, 2.3, .06), steel), .625, 1.15, .75);
    put(new THREE.Mesh(new THREE.BoxGeometry(1.6, .25, .06), steel), 0, 2.175, .75);
    R.doors = [-1, 1].map(sx => put(rbox(.46, 2.04, .04, .005, std('#9a9ea8', { m: .45, r: .3 })), sx * .225, 1.02, .76));
    R.disp = dynTex(256, 128); R.dispPlane = put(new THREE.Mesh(new THREE.PlaneGeometry(.3, .15), basic('#ffffff', { map: R.disp.t })), 0, 2.15, .715, sc, false); R.dispPlane.rotation.y = Math.PI;
    // Flur draußen (z .8 .. 9)
    const offW = std('#3f424b'), cf = std('#d0d2d6');
    const ofl = put(new THREE.Mesh(new THREE.PlaneGeometry(4, 9), std('#26272d')), 0, 0, 5, sc, false); ofl.rotation.x = -Math.PI / 2;
    const oce = put(new THREE.Mesh(new THREE.PlaneGeometry(4, 9), std('#1f2025')), 0, 2.6, 5, sc, false); oce.rotation.x = Math.PI / 2;
    for (const sx of [-1, 1]) put(new THREE.Mesh(new THREE.PlaneGeometry(9, 2.6), offW), sx * 2, 1.3, 5, sc, false).rotation.y = -sx * Math.PI / 2;
    put(new THREE.Mesh(new THREE.PlaneGeometry(4, 2.6), offW), 0, 1.3, 9.4, sc, false).rotation.y = Math.PI;
    for (const [x, w] of [[-1.4, 1.2], [1.4, 1.2]]) put(new THREE.Mesh(new THREE.BoxGeometry(w, 2.6, .1), offW), x, 1.3, .83);
    put(new THREE.Mesh(new THREE.BoxGeometry(1.6, .3, .1), offW), 0, 2.45, .83);
    R.call = put(new THREE.Mesh(new THREE.CircleGeometry(.025, 16), basic('#ffb347')), .95, 1.15, .885, sc, false);
    put(rbox(.09, .16, .02, .005, std('#a3a6ae', { m: .6 })), .95, 1.15, .878);
    // Neonröhren
    R.tubes = [];
    for (const z of [2.2, 4.6, 7.0]) {
      const m = put(new THREE.Mesh(new THREE.BoxGeometry(.18, .03, 1.2), basic('#eef3ff')), 0, 2.58, z, sc, false);
      const l = new THREE.PointLight('#dfe8ff', 6, 6, 1.6); l.position.set(0, 2.4, z); sc.add(l); R.tubes.push({ m, l });
    }
    // Schreibtische
    for (const z of [2.6, 4.6, 6.6]) for (const sx of [-1, 1]) {
      put(rbox(1.2, .05, .7, .01, cf), sx * 1.25, .74, z); put(new THREE.Mesh(new THREE.BoxGeometry(.04, .72, .6), std('#555')), sx * 1.25 - sx * .55, .37, z);
      put(rbox(.45, .3, .03, .01, std('#15161a')), sx * 1.25, 1.0, z - .15); put(new THREE.Mesh(new THREE.BoxGeometry(.06, .2, .06), std('#222')), sx * 1.25, .85, z - .15);
      put(rbox(.5, .5, .5, .05, std('#2c3550')), sx * 1.25, .45, z + .55);
    }
    // Der Schreibtisch am Ende (Stock 13)
    R.endDesk = new THREE.Group(); sc.add(R.endDesk);
    put(rbox(1.3, .05, .7, .01, cf), 0, .74, 8.6, R.endDesk); put(new THREE.Mesh(new THREE.BoxGeometry(1.2, .7, .04), std('#4a4b52')), 0, .37, 8.25, R.endDesk);
    R.endMon = put(new THREE.Mesh(new THREE.PlaneGeometry(.42, .27), basic('#9cc2ff')), .3, 1.02, 8.38, R.endDesk, false); R.endMon.rotation.y = Math.PI;
    put(new THREE.Mesh(new THREE.BoxGeometry(.45, .3, .02), std('#111')), .3, 1.02, 8.4, R.endDesk);
    R.endLamp = new THREE.PointLight('#ffcf8a', 7, 3.5, 1.6); R.endLamp.position.set(-.35, 1.2, 8.4); R.endDesk.add(R.endLamp);
    put(new THREE.Mesh(new THREE.ConeGeometry(.08, .12, 16, 1, true), std('#2d2e33')), -.35, 1.15, 8.5, R.endDesk);
    plane('you', 2, 2); plane('markus', 2, 2); plane('deskYou', 1.2, 1.2); plane('youClose', .7, .7, 1536);
    R.setFloor = (txt, arrow, red) => {
      const { g, c, t } = R.disp; g.fillStyle = '#060606'; g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = red ? '#ff2a1a' : '#ff5a2a'; g.shadowColor = '#ff3a1a'; g.shadowBlur = 14;
      g.font = 'bold 96px "JetBrains Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 150, 68);
      if (arrow) { g.beginPath(); const y0 = arrow > 0 ? 34 : 94, y1 = arrow > 0 ? 94 : 34; g.moveTo(222, y0); g.lineTo(196, y1); g.lineTo(248, y1); g.fill(); }
      g.shadowBlur = 0; t.needsUpdate = true;
    };
    R.setButtons = (lit) => {
      const { g, c, t } = R.btn; g.clearRect(0, 0, c.width, c.height);
      for (let i = 0; i <= 12; i++) {
        const col = i % 2, row = Math.floor(i / 2), x = 36 + col * 56, y = 270 - row * 40;
        g.beginPath(); g.arc(x, y, 15, 0, 7); g.fillStyle = '#c9ccd3'; g.fill();
        g.lineWidth = 3; g.strokeStyle = lit.includes(i) ? '#ffb347' : '#7a7d85'; g.stroke();
        g.fillStyle = '#26272b'; g.font = 'bold 15px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(i === 0 ? 'E' : String(i), x, y + 1);
      }
      g.fillStyle = '#26272b'; g.fillRect(28, 12, 72, 22); g.fillStyle = '#9aa0a8'; for (let i = 0; i < 4; i++) g.fillRect(34 + i * 16, 18, 8, 10);
      t.needsUpdate = true;
    };
    R.setButtons([]); R.setFloor('12', 0);
  };

  /* =============================================================== NACHTBUS */
  W3.BUILD.bus = async () => {
    const sc = W3.scene;
    sc.background = new THREE.Color('#04050a'); sc.fog = new THREE.FogExp2('#05060b', .05);
    R.hemi = new THREE.HemisphereLight('#9aa4c8', '#0c0c10', .22); sc.add(R.hemi);
    // Straße + Laternen (bewegen sich, der Bus steht)
    const road = put(new THREE.Mesh(new THREE.PlaneGeometry(14, 400), std('#1a1b20')), 0, -.4, 0, sc, false); road.rotation.x = -Math.PI / 2;
    R.lamps = [];
    for (let i = 0; i < 6; i++) {
      const g = new THREE.Group(); sc.add(g);
      put(new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, 5.5, 8), std('#2a2b30')), 0, 2.35, 0, g);
      put(new THREE.Mesh(new THREE.SphereGeometry(.16, 12, 8), basic('#ffcf8a')), 0, 5.1, 0, g, false);
      const l = new THREE.PointLight('#ffc27a', 22, 10, 1.6); l.position.set(0, 4.8, 0); g.add(l);
      R.lamps.push({ g, side: i % 2 ? 1 : -1, z0: i * 9 });
    }
    // Außenhülle
    R.ext = new THREE.Group(); sc.add(R.ext);
    put(rbox(2.5, 2.7, 11, .2, std('#a48b2c', { r: .5 })), 0, 1.0, 0, R.ext);
    for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) put(new THREE.Mesh(new THREE.PlaneGeometry(1.4, .9), basic('#a9b8d6')), sx * 1.26, 1.6, -3.6 + i * 1.5, R.ext, false).rotation.y = sx * Math.PI / 2;
    put(new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), basic('#0e1018')), 0, 1.6, -5.51, R.ext, false).rotation.y = Math.PI;
    R.extSign = put(new THREE.Mesh(new THREE.PlaneGeometry(1.6, .25), basic('#ff9a2a')), 0, 2.2, -5.52, R.ext, false); R.extSign.rotation.y = Math.PI;
    for (const x of [-.9, .9]) { const l = new THREE.SpotLight('#fff1d2', 120, 50, .5, .5, 1.5); l.position.set(x, .3, -5.6); l.target.position.set(x, -.4, -25); R.ext.add(l, l.target); }
    // Innenraum (x -1.2..1.2, z -5..5)
    R.int = new THREE.Group(); sc.add(R.int);
    const seatM = std('#243050'), pole = std('#b8992a', { m: .3, r: .45 }), wallM = std('#4c5058'), trim = std('#2a2c33');
    const fl = put(new THREE.Mesh(new THREE.PlaneGeometry(2.4, 10), std('#3a3b42')), 0, 0, 0, R.int, false); fl.rotation.x = -Math.PI / 2;
    const ce = put(new THREE.Mesh(new THREE.PlaneGeometry(2.4, 10), std('#4e5159')), 0, 2.25, 0, R.int, false); ce.rotation.x = Math.PI / 2;
    R.strip = put(new THREE.Mesh(new THREE.BoxGeometry(.12, .02, 9), basic('#c9d6ff')), 0, 2.24, 0, R.int, false);
    R.cabin = new THREE.PointLight('#c4d0ff', 2.2, 10, 1.4); R.cabin.position.set(0, 2.0, .5); R.int.add(R.cabin);
    for (const sx of [-1, 1]) {
      put(new THREE.Mesh(new THREE.PlaneGeometry(10, .95), wallM), sx * 1.2, .475, 0, R.int, false).rotation.y = -sx * Math.PI / 2;
      put(new THREE.Mesh(new THREE.PlaneGeometry(10, .25), wallM), sx * 1.2, 2.12, 0, R.int, false).rotation.y = -sx * Math.PI / 2;
      const gl = put(new THREE.Mesh(new THREE.PlaneGeometry(10, 1.05), basic('#05070c', { transparent: true, opacity: .55 })), sx * 1.2, 1.47, 0, R.int, false); gl.rotation.y = -sx * Math.PI / 2;
      for (let z = -4.5; z <= 4.5; z += 1.5) put(new THREE.Mesh(new THREE.BoxGeometry(.06, 1.1, .06), trim), sx * 1.19, 1.47, z, R.int);
      for (let z = -3.2; z <= 4.2; z += .85) {
        put(rbox(.9, .14, .45, .05, seatM), sx * .72, .48, z, R.int);
        const b = put(rbox(.9, .62, .1, .05, seatM), sx * .72, .82, z + .23, R.int); b.rotation.x = -.08;
        put(new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .9, 8), pole), sx * .72, 1.15, z + .29, R.int).rotation.z = Math.PI / 2;
      }
      put(new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, 9.5, 8), pole), sx * .4, 2.05, 0, R.int).rotation.x = Math.PI / 2;
    }
    for (let z = -2.8; z <= 4; z += 1.7) put(new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, 2.25, 10), pole), .27, 1.12, z, R.int);
    put(new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.3), wallM), 0, 1.15, 5, R.int, false).rotation.y = Math.PI;
    // Fahrerkabine vorne
    put(new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.25, .05), trim), -.65, .62, -4.1, R.int);
    put(new THREE.Mesh(new THREE.BoxGeometry(1.0, .9, .02), basic('#0b0d14', { transparent: true, opacity: .4 })), -.65, 1.7, -4.1, R.int, false);
    put(rbox(.55, .15, .5, .05, seatM), -.65, .55, -4.55, R.int); put(rbox(.55, .7, .1, .05, seatM), -.65, .95, -4.3, R.int);
    R.busWheel = put(new THREE.Mesh(new THREE.TorusGeometry(.26, .025, 12, 36), std('#141418')), -.65, 1.05, -4.95, R.int); R.busWheel.rotation.x = -1.1;
    put(new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.3), basic('#0a0c14')), 0, 1.5, -5.05, R.int, false);
    put(rbox(2.4, .8, .5, .05, std('#1c1d22')), 0, .7, -5.0, R.int);
    // LED-Anzeige
    R.led = dynTex(1024, 128); R.ledPlane = put(new THREE.Mesh(new THREE.PlaneGeometry(1.5, .19), basic('#ffffff', { map: R.led.t })), 0, 2.08, -3.95, R.int, false);
    put(rbox(1.6, .26, .06, .01, std('#111')), 0, 2.08, -3.99, R.int);
    plane('you', 1.4, 1.4); plane('driver', 1.2, 1.2); plane('youClose', .6, .6, 1536); plane('refl', .9, .7, 1536);
    R.setLed = (txt, glitch = 0) => {
      const { g, c, t } = R.led; const s = document.createElement('canvas'); s.width = 256; s.height = 32; const sg = s.getContext('2d');
      sg.fillStyle = '#000'; sg.fillRect(0, 0, 256, 32); sg.fillStyle = '#fff'; sg.font = 'bold 22px sans-serif'; sg.textBaseline = 'middle'; sg.textAlign = 'center';
      let tx = txt; if (glitch) tx = tx.split('').map(ch => Math.random() < glitch && ch !== ' ' ? '█▓▒#%&'[Math.floor(Math.random() * 6)] : ch).join('');
      sg.fillText(tx, 128, 17); const d = sg.getImageData(0, 0, 256, 32).data;
      g.fillStyle = '#080503'; g.fillRect(0, 0, c.width, c.height);
      for (let y = 0; y < 32; y++) for (let x = 0; x < 256; x++) { const on = d[(y * 256 + x) * 4] > 100; g.fillStyle = on ? '#ff9a2a' : '#1d1206'; g.beginPath(); g.arc(x * 4 + 2, y * 4 + 2, 1.5, 0, 7); g.fill(); }
      t.needsUpdate = true;
    };
    R.setLed('LINIE N7  ·  NACHTBUS');
    R.tick = (t, speed = 11) => {
      for (const L of R.lamps) { const z = ((L.z0 + t * speed) % 54) - 30; L.g.position.set(L.side * 2.6, -.4, z); }
    };
  };
})();

// ======================================================================= Großraumbüro (Bewegungsmelder)
(() => {
  const { std, basic, put, rbox, canvasTex, svgTex, plane } = W3.H, R = W3.reg;
  W3.BUILD.openoffice = async (A) => {
    const sc = W3.scene;
    sc.background = new THREE.Color('#05060a'); sc.fog = new THREE.FogExp2('#05060a', .055);
    R.hemi = new THREE.HemisphereLight('#8f9ac0', '#101014', .16); sc.add(R.hemi);
    const night = new THREE.DirectionalLight('#7f8fc8', .35); night.position.set(-6, 5, -10); sc.add(night);
    const carpet = std('#2a2c33'), wallM = std('#4a4d55'), desk = std('#c9cbd0'), dark = std('#18191d');
    const fl = put(new THREE.Mesh(new THREE.PlaneGeometry(12, 13), carpet), 0, 0, -2.2, sc, false); fl.rotation.x = -Math.PI / 2;
    const ce = put(new THREE.Mesh(new THREE.PlaneGeometry(12, 13), std('#2e3036')), 0, 2.8, -2.2, sc, false); ce.rotation.x = Math.PI / 2;
    for (const sx of [-1, 1]) put(new THREE.Mesh(new THREE.PlaneGeometry(13, 2.8), wallM), sx * 6, 1.4, -2.2, sc, false).rotation.y = -sx * Math.PI / 2;
    put(new THREE.Mesh(new THREE.PlaneGeometry(12, 2.8), wallM), 0, 1.4, 3.85, sc, false).rotation.y = Math.PI;
    // Rückwand mit Fenstern und Stadt bei Nacht
    const city = canvasTex(1024, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0c1230'); gr.addColorStop(1, '#2a2f55'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      let x = 0; while (x < w) { const bw = 30 + Math.random() * 70, bh = 60 + Math.random() * 170; g.fillStyle = '#0a0c16'; g.fillRect(x, h - bh, bw, bh);
        for (let yy = h - bh + 8; yy < h - 6; yy += 12) for (let xx = x + 5; xx < x + bw - 5; xx += 10) if (Math.random() < .18) { g.fillStyle = Math.random() < .7 ? '#ffd58a' : '#bcd4ff'; g.fillRect(xx, yy, 4, 5); }
        x += bw + 4; }
    });
    put(new THREE.Mesh(new THREE.PlaneGeometry(12, 1.9), basic('#ffffff', { map: city })), 0, 1.45, -8.69, sc, false);
    put(new THREE.Mesh(new THREE.PlaneGeometry(12, .5), wallM), 0, .25, -8.7, sc, false); put(new THREE.Mesh(new THREE.PlaneGeometry(12, .45), wallM), 0, 2.6, -8.7, sc, false);
    for (let x = -5.5; x <= 5.5; x += 1.375) put(new THREE.Mesh(new THREE.BoxGeometry(.07, 1.9, .06), dark), x, 1.45, -8.66);
    // Schreibtischreihen links und rechts vom Gang
    for (let z = -7.0; z <= 1.0; z += 2.0) for (const sx of [-1, 1]) for (const k of [0, 1]) {
      const x = sx * (1.25 + k * 1.5);
      put(rbox(1.4, .04, .75, .01, desk), x, .74, z);
      put(new THREE.Mesh(new THREE.BoxGeometry(.04, .72, .7), std('#4c4e55')), x + sx * .68, .37, z);
      put(new THREE.Mesh(new THREE.BoxGeometry(1.4, .4, .03), std('#3a3d48')), x, .95, z - .38);
      put(rbox(.48, .3, .03, .01, std('#101114')), x, 1.08, z - .2); put(new THREE.Mesh(new THREE.BoxGeometry(.05, .18, .05), std('#222')), x, .85, z - .2);
      put(rbox(.48, .1, .48, .04, std('#22283a')), x, .5, z + .5); put(rbox(.48, .5, .08, .04, std('#22283a')), x, .8, z + .74);
    }
    // Dein Platz: Monitor leuchtet, kleine Lampe
    R.myMon = put(new THREE.Mesh(new THREE.PlaneGeometry(.44, .26), basic('#a8c6ff')), -1.25, 1.08, -6.98, sc, false); R.myMon.rotation.y = Math.PI;
    R.myLamp = new THREE.PointLight('#9fbaff', 2.2, 3, 1.8); R.myLamp.position.set(-1.25, 1.2, -6.7); sc.add(R.myLamp);
    // Kopierer am Ende des Gangs
    put(rbox(1.0, .95, .65, .04, std('#d6d7da', { r: .5 })), 0, .48, 3.42);
    put(rbox(1.0, .06, .65, .02, std('#3a3c42')), 0, .98, 3.42);
    R.copierScreen = put(new THREE.Mesh(new THREE.PlaneGeometry(.18, .09), basic('#62ff9a')), .3, 1.02, 3.1, sc, false); R.copierScreen.rotation.x = -1.2;
    R.scan = put(new THREE.Mesh(new THREE.PlaneGeometry(.9, .02), basic('#b9ffd6')), 0, .955, 3.09, sc, false);
    R.scanLight = new THREE.PointLight('#b9ffd6', 0, 1.8, 2); R.scanLight.position.set(0, 1.0, 3.0); sc.add(R.scanLight);
    R.sheet = put(new THREE.Mesh(new THREE.PlaneGeometry(.3, .42), basic('#f2f2ee')), 0, .7, 3.08, sc, false); R.sheet.rotation.x = -1.35;
    // Bewegungsmelder-Lampen über dem Gang (0..3) + über dem Kopierer (4)
    R.panels = [-6.0, -3.5, -1.0, .95, 2.9].map((z, i) => {
      const x = i === 0 ? -1.0 : 0;
      const m = put(new THREE.Mesh(new THREE.PlaneGeometry(.6, .6), basic('#1d1f25')), x, 2.79, z, sc, false); m.rotation.x = Math.PI / 2;
      const l = new THREE.PointLight('#e6edff', 0, 5.5, 1.5); l.position.set(x, 2.55, z); sc.add(l);
      if (i === 3) { l.castShadow = true; l.shadow.mapSize.set(512, 512); l.shadow.bias = -.004; }
      return { m, l, z, x };
    });
    for (const [x, z] of [[-2.5, -3.5], [2.5, -3.5], [-2.5, -1], [2.5, -1], [-2.5, 1.5], [2.5, 1.5], [2.5, -6]]) put(new THREE.Mesh(new THREE.PlaneGeometry(.6, .6), basic('#1d1f25')), x, 2.79, z, sc, false).rotation.x = Math.PI / 2;
    // Das Ding (2D) unter der Lampe hinter dir
    R.thing = put(new THREE.Mesh(new THREE.PlaneGeometry(.9, 2.3), basic('#ffffff', { map: await svgTex(A.creatureCellar || A.creature, 900, 2300), transparent: true, alphaTest: .02 })), .16, 1.15, .95, sc, false);
    R.thing.material.toneMapped = false; R.thing.visible = false;
    plane('you', 2, 2); plane('youClose', .7, .7, 1536);
    R.setPanels = (lv) => R.panels.forEach((p, i) => { const v = lv[i] || 0; p.l.intensity = 9 * v; p.m.material.color.set(v > .05 ? '#f2f5ff' : '#1d1f25'); });
  };
})();

// ======================================================================= Kiosk (Spätschicht)
(() => {
  const { std, basic, put, rbox, canvasTex, svgTex, plane } = W3.H, R = W3.reg;
  const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  W3.BUILD.kiosk = async (A) => {
    const sc = W3.scene;
    sc.background = new THREE.Color('#05060b'); sc.fog = new THREE.FogExp2('#06070c', .045);
    R.hemi = new THREE.HemisphereLight('#a9b2d0', '#121318', .22); sc.add(R.hemi);
    const moon = new THREE.DirectionalLight('#8e9bd0', .25); moon.position.set(-6, 9, 8); sc.add(moon);
    // Innenraum: x -2.2..2.2, z -2.6 (Rückwand) .. 3.2 (Schaufenster), Decke 2.7
    const tiles = canvasTex(512, 512, (g, w, h) => {
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#3a3d48' : '#33363f'; g.fillRect(x * 64, y * 64, 64, 64); }
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
    });
    tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(2.2, 2.9);
    const fl = put(new THREE.Mesh(new THREE.PlaneGeometry(4.4, 5.8), new THREE.MeshStandardMaterial({ map: tiles, roughness: .6 })), 0, 0, .3, sc, false); fl.rotation.x = -Math.PI / 2;
    const ce = put(new THREE.Mesh(new THREE.PlaneGeometry(4.4, 5.8), std('#25272e')), 0, 2.7, .3, sc, false); ce.rotation.x = Math.PI / 2;
    const wallM = std('#4b4f5c'), sideM = std('#454956');
    for (const sx of [-1, 1]) put(new THREE.Mesh(new THREE.PlaneGeometry(5.8, 2.7), sideM), sx * 2.2, 1.35, .3, sc, false).rotation.y = -sx * Math.PI / 2;
    // Rückwand mit Tür zum Lager (x .2 .. 1.0)
    put(new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.7, .08), wallM), -1.0, 1.35, -2.64, sc, false);
    put(new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.7, .08), wallM), 1.6, 1.35, -2.64, sc, false);
    put(new THREE.Mesh(new THREE.BoxGeometry(.8, .65, .08), wallM), .6, 2.375, -2.64, sc, false);
    const trim = std('#24262d');
    for (const x of [.18, 1.02]) put(new THREE.Mesh(new THREE.BoxGeometry(.05, 2.05, .12), trim), x, 1.025, -2.62);
    put(new THREE.Mesh(new THREE.BoxGeometry(.89, .05, .12), trim), .6, 2.06, -2.62);
    // Lager: stockdunkel, nur Umrisse von Kartons
    const lag = basic('#050507');
    put(new THREE.Mesh(new THREE.PlaneGeometry(2, 2.1), lag), .6, 1.05, -4.2, sc, false);
    for (const sx of [-1, 1]) put(new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.1), lag), .6 + sx * .9, 1.05, -3.4, sc, false).rotation.y = -sx * Math.PI / 2;
    put(new THREE.Mesh(new THREE.PlaneGeometry(2, 1.6), lag), .6, .002, -3.4, sc, false).rotation.x = -Math.PI / 2;
    put(new THREE.Mesh(new THREE.PlaneGeometry(2, 1.6), lag), .6, 2.08, -3.4, sc, false).rotation.x = Math.PI / 2;
    for (const [x, y, z, s] of [[1.25, .25, -3.9, .5], [1.2, .7, -3.95, .4], [-.05, .3, -3.8, .55]]) put(new THREE.Mesh(new THREE.BoxGeometry(s, s, s), std('#2a2219')), x, y, z);
    R.lagerDoor = new THREE.Group(); R.lagerDoor.position.set(1.0, 0, -2.66); sc.add(R.lagerDoor);
    put(rbox(.78, 2.0, .04, .01, std('#3b3f4a')), -.39, 1.0, 0, R.lagerDoor);
    R.lagerDoor.rotation.y = -1.15;     // steht weit offen, ins Lager hinein
    // Regal hinter der Kasse
    const r = rng(17), boxCols = ['#6b3b3b', '#3b4f6b', '#6b6040', '#3f5a4a', '#5a4a66', '#7a6a5a'];
    for (const y of [1.2, 1.55, 1.9]) {
      put(rbox(1.9, .03, .28, .01, std('#2c2e35')), -.95, y, -2.45);
      for (let x = -1.85; x < -.05; x += .09 + r() * .05) put(new THREE.Mesh(new THREE.BoxGeometry(.07, .14 + r() * .1, .1), std(boxCols[Math.floor(r() * 6)])), x, y + .1, -2.47);
    }
    // Theke (x -1.7..0.1, z -1.8..-1.2, Höhe 1.0)
    put(rbox(1.8, 1.0, .6, .02, std('#2d3039')), -.8, .5, -1.5);
    put(rbox(1.86, .04, .66, .01, std('#8c8f98', { r: .45 })), -.8, 1.02, -1.5);
    put(new THREE.Mesh(new THREE.BoxGeometry(1.7, .5, .01), std('#3a3e4a')), -.8, .55, -1.195);
    // Kasse + Scanner
    put(rbox(.34, .12, .3, .02, std('#1b1c21')), -1.3, 1.1, -1.6);
    put(rbox(.3, .2, .03, .01, std('#1b1c21')), -1.3, 1.28, -1.68).rotation.x = .25;
    put(new THREE.Mesh(new THREE.PlaneGeometry(.26, .15), basic('#4e7fbf')), -1.3, 1.285, -1.664, sc, false).rotation.set(.25, Math.PI, 0);
    put(rbox(.2, .012, .12, .004, std('#1b1c21')), -.95, 1.045, -1.55); R.scanner = put(new THREE.Mesh(new THREE.PlaneGeometry(.14, .07), basic('#202228')), -.95, 1.052, -1.55, sc, false); R.scanner.rotation.x = -Math.PI / 2;
    // Überwachungsmonitor (zeigt zur Kassiererin)
    put(rbox(.28, .2, .04, .01, std('#131418')), -.05, 1.15, -1.45).rotation.y = Math.PI - .5;
    R.monScreen = put(new THREE.Mesh(new THREE.PlaneGeometry(.24, .16), basic('#9aa3b8')), -.065, 1.15, -1.473, sc, false); R.monScreen.rotation.y = Math.PI - .5;
    put(new THREE.Mesh(new THREE.CylinderGeometry(.015, .05, .05, 12), std('#131418')), -.05, 1.05, -1.45);
    // Ware auf der Theke: Wasserflasche + Schere (erst sichtbar, wenn er sie hinlegt)
    R.water = new THREE.Group(); R.water.position.set(-.85, 1.04, -1.33); sc.add(R.water);
    const bottleM = new THREE.MeshStandardMaterial({ color: '#8fb3d8', roughness: .15, transparent: true, opacity: .55 });
    put(new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .2, 20), bottleM), 0, .1, 0, R.water);
    put(new THREE.Mesh(new THREE.CylinderGeometry(.018, .04, .06, 20), bottleM), 0, .23, 0, R.water);
    put(new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .025, 14), std('#2f6fd0')), 0, .27, 0, R.water);
    put(new THREE.Mesh(new THREE.CylinderGeometry(.041, .041, .07, 20), std('#d8e2ee')), 0, .1, 0, R.water);
    R.scissors = new THREE.Group(); R.scissors.position.set(-.55, 1.045, -1.3); sc.add(R.scissors);
    const steel = std('#c4c8d2', { m: .8, r: .25 }), grip = std('#1d1d22');
    for (const s of [-1, 1]) {
      const ring = put(new THREE.Mesh(new THREE.TorusGeometry(.028, .009, 8, 20), grip), s * .025, 0, .07, R.scissors); ring.rotation.x = Math.PI / 2;
      const bl = put(new THREE.Mesh(new THREE.BoxGeometry(.012, .006, .17), steel), s * .008, .002, -.04, R.scissors); bl.rotation.y = s * .09;
    }
    put(new THREE.Mesh(new THREE.CylinderGeometry(.007, .007, .014, 10), steel), 0, .004, .03, R.scissors);
    R.water.visible = R.scissors.visible = false;
    // Kühlschrank links (leuchtet kalt)
    put(rbox(.6, 2.0, 2.2, .03, std('#1d1f26')), -1.9, 1.0, .9);
    R.fridgeGlass = put(new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.75), basic('#7f9fc4', { transparent: true, opacity: .55 })), -1.595, 1.05, .9, sc, false); R.fridgeGlass.rotation.y = Math.PI / 2;
    for (const z of [.2, .9, 1.6]) put(new THREE.Mesh(new THREE.BoxGeometry(.02, 1.8, .03), std('#2a2c33')), -1.59, 1.05, z - .35);
    for (const y of [.5, .95, 1.4]) for (let z = .0; z < 1.85; z += .11) put(new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .2, 10), std(['#3d6fb0', '#b03d3d', '#d7dbe4', '#3da06a'][Math.floor(r() * 4)])), -1.72, y + .1, z);
    R.fridgeLight = new THREE.PointLight('#9fc2ff', 1.1, 3.2, 1.6); R.fridgeLight.position.set(-1.3, 1.2, .9); sc.add(R.fridgeLight);
    // Regale rechts
    for (const z of [-.6, .7, 2.0]) {
      put(rbox(.5, 1.6, 1.1, .02, std('#30333c')), 1.85, .8, z);
      for (const y of [.35, .75, 1.15, 1.55]) for (let zz = z - .48; zz < z + .48; zz += .1 + r() * .04) put(new THREE.Mesh(new THREE.BoxGeometry(.18, .16 + r() * .12, .07), std(boxCols[Math.floor(r() * 6)])), 1.68, y + .1, zz);
    }
    // Schaufensterfront (z 3.2): Fenster links, Glastür rechts (x .7 .. 1.6)
    const glassM = basic('#1b2236', { transparent: true, opacity: .28, depthWrite: false });
    put(new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.9), glassM), -.75, 1.25, 3.2, sc, false);
    R.doorPivot = new THREE.Group(); R.doorPivot.position.set(1.6, 0, 3.2); sc.add(R.doorPivot);
    put(new THREE.Mesh(new THREE.PlaneGeometry(.86, 2.1), glassM), -.45, 1.07, 0, R.doorPivot, false);
    put(new THREE.Mesh(new THREE.BoxGeometry(.04, 2.1, .04), trim), -.88, 1.07, 0, R.doorPivot);
    put(new THREE.Mesh(new THREE.BoxGeometry(.03, .35, .03), std('#9da1ab', { m: .7 })), -.8, 1.05, -.03, R.doorPivot);
    const front = std('#23262f');
    put(new THREE.Mesh(new THREE.BoxGeometry(4.4, .3, .1), front), 0, .15, 3.2);
    put(new THREE.Mesh(new THREE.BoxGeometry(4.4, .58, .1), front), 0, 2.41, 3.2);
    for (const x of [-2.18, .67, 1.63, 1.9]) put(new THREE.Mesh(new THREE.BoxGeometry(x > 1.7 ? .6 : .06, 2.2, .1), front), x, 1.25, 3.2);
    // Türglocke über der Tür
    R.bell = put(new THREE.Mesh(new THREE.ConeGeometry(.035, .05, 12, 1, true), std('#b89a4a', { m: .7, r: .3 })), 1.45, 2.05, 3.08);
    // Neonröhren (eine flackert)
    R.tubes = [];
    for (const [x, z] of [[-.7, -1.4], [0, 1.2]]) {
      const m = put(new THREE.Mesh(new THREE.BoxGeometry(1.2, .03, .12), basic('#e8eeff')), x, 2.68, z, sc, false);
      const l = new THREE.PointLight('#dfe6ff', 3.2, 6, 1.6); l.position.set(x, 2.45, z); sc.add(l);
      if (z < 0) { l.castShadow = true; l.shadow.mapSize.set(512, 512); l.shadow.bias = -.004; }
      R.tubes.push({ m, l });
    }
    // Außen: Gehweg, Straße, Laterne, Häuser gegenüber, Leuchtschrift
    const out = put(new THREE.Mesh(new THREE.PlaneGeometry(80, 60), std('#14151a')), 0, -.01, 20, sc, false); out.rotation.x = -Math.PI / 2;
    const walk = put(new THREE.Mesh(new THREE.PlaneGeometry(30, 4), std('#2a2b31')), 0, .005, 5.2, sc, false); walk.rotation.x = -Math.PI / 2;
    put(new THREE.Mesh(new THREE.BoxGeometry(30, .12, .2), std('#3a3b42')), 0, .06, 7.2);
    for (let x = -12; x < 12; x += 3) put(new THREE.Mesh(new THREE.PlaneGeometry(1.4, .12), basic('#77766e')), x, .006, 11, sc, false).rotation.x = -Math.PI / 2;
    for (const [x, w, h] of [[-10, 6, 9], [-3.5, 5.5, 12], [3, 6, 8], [9.5, 5, 11]]) {
      put(new THREE.Mesh(new THREE.BoxGeometry(w, h, 3), std('#0d0e14')), x, h / 2, 17);
      const rr = rng(Math.abs(x * 7) + 3);
      for (let k = 0; k < 4; k++) if (rr() < .5) put(new THREE.Mesh(new THREE.PlaneGeometry(.7, .9), basic(rr() < .7 ? '#3a3120' : '#1e2638')), x - w / 2 + .9 + rr() * (w - 1.8), 2 + rr() * (h - 3), 15.49, sc, false).rotation.y = Math.PI;
    }
    // Außenhülle des Kiosks
    const shell = std('#1e2129', { r: .95 });
    for (const sx of [-1, 1]) put(new THREE.Mesh(new THREE.PlaneGeometry(6, 3.1), shell), sx * 2.27, 1.55, .3, sc, false).rotation.y = sx * Math.PI / 2;
    put(new THREE.Mesh(new THREE.BoxGeometry(4.7, .12, 6.1), shell), 0, 3.1, .3);
    put(new THREE.Mesh(new THREE.BoxGeometry(4.6, .45, .12), shell), 0, 2.9, 3.27);
    const sign = canvasTex(512, 96, (g, w, h) => {
      g.fillStyle = '#0b0b10'; g.fillRect(0, 0, w, h);
      g.font = '900 64px Montserrat, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.shadowColor = '#ff8a3a'; g.shadowBlur = 18; g.fillStyle = '#ffb36a'; g.fillText('KIOSK  24/7', w / 2, h / 2 + 3);
    });
    R.sign = put(new THREE.Mesh(new THREE.PlaneGeometry(2.6, .44), basic('#ffffff', { map: sign })), -.2, 2.9, 3.34, sc, false);
    R.signLight = new THREE.PointLight('#ff9a4a', .35, 3, 2); R.signLight.position.set(-.2, 2.6, 4.0); sc.add(R.signLight);
    const pole = put(new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, 5, 8), std('#26272c')), 4.2, 2.5, 6.9);
    put(new THREE.Mesh(new THREE.BoxGeometry(.9, .06, .1), std('#26272c')), 3.8, 4.95, 6.9);
    put(new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 8), basic('#ffcf8a')), 3.4, 4.88, 6.9, sc, false);
    const lamp = new THREE.PointLight('#c9b48a', 2.2, 10, 1.8); lamp.position.set(3.4, 4.6, 6.9); sc.add(lamp);
    R.inLight = new THREE.PointLight('#c8d4ff', 1.0, 7, 1.6); R.inLight.position.set(0, 1.6, 4.2); sc.add(R.inLight);
    // Der zweite: in der Lagertür (2D)
    R.lagerFig = put(new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.2), basic('#ffffff', { map: await svgTex(A.lagerFig, 1000, 2200), transparent: true, alphaTest: .02 })), .62, 1.1, -2.85, sc, false);
    R.lagerFig.material.toneMapped = false; R.lagerFig.visible = false;
    plane('you', 2, 2); plane('youClose', .7, .7, 1536); plane('cust', 2.2, 2.2); plane('hand', .5, .5, 1024);
    R.setTubes = (a, b) => { R.tubes[0].l.intensity = 3.2 * a; R.tubes[0].m.material.color.set(a > .5 ? '#e8eeff' : '#2a2c33'); R.tubes[1].l.intensity = 3.2 * b; R.tubes[1].m.material.color.set(b > .5 ? '#e8eeff' : '#2a2c33'); };
  };
})();
