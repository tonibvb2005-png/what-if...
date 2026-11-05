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
    R.figure = put(new THREE.Mesh(new THREE.PlaneGeometry(.9, 2.3), basic('#ffffff', { map: await svgTex(A.creature, 900, 2300), transparent: true, alphaTest: .02 })), .1, 1.15, 13, sc, false);
    R.figure.rotation.y = Math.PI; R.figure.material.toneMapped = false;
    plane('you', 2, 2); plane('hand', .5, .5, 1024);
    R.setLight = (L, fig) => {
      for (const { b, l } of R.bulbs) { l.intensity = 1.5 * L; b.material.color.set(L > .05 ? '#fff1cf' : '#18140e'); }
      R.hemi.intensity = .02 + .28 * L;
      R.figure.material.color.setRGB(.06 + .3 * L, .06 + .3 * L, .07 + .32 * L);
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
    const wheel = put(new THREE.Mesh(new THREE.TorusGeometry(.18, .022, 12, 36), std('#121216')), -.37, .99, -.32, R.int); wheel.rotation.x = -1.05;
    put(new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .3, 8), std('#121216')), -.37, .9, -.45, R.int).rotation.x = -1.05;
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
