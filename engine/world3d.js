// 3D-Hintergrund (Three.js): Schlafzimmer, Tür, Flur. Figuren bleiben 2D (SVG-Textur auf Ebenen).
const W3 = (() => {
  let renderer, scene, cam, charMesh, charCtx, charTex, deskPhone, deskScreen, phoneLight, doorPivot, doorMesh,
      handlePivot, spill, warmLight, creature, fingers, fingersMat, creatureTex;
  const TEX = 2048;

  function rrect(w, h, r) {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
  }
  function rbox(w, h, d, b, m) {
    b = Math.min(b, d / 2 - 1e-3, w / 2 - 1e-3, h / 2 - 1e-3);
    const g = new THREE.ExtrudeGeometry(rrect(w - 2 * b, h - 2 * b, Math.min(b, (w - 2 * b) / 2, (h - 2 * b) / 2) * .5 + 1e-3),
      { depth: Math.max(1e-3, d - 2 * b), bevelEnabled: true, bevelSize: b, bevelThickness: b, bevelSegments: 4, curveSegments: 8 });
    g.center(); return new THREE.Mesh(g, m);
  }
  const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? .88, metalness: o.m ?? 0, emissive: o.e ?? 0, emissiveIntensity: o.ei ?? 1 });
  const basic = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });
  function put(m, x, y, z, parent = scene, cast = true) { m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; }
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }
  async function svgToCanvas(svg, ctx, size) {
    const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    await img.decode(); ctx.clearRect(0, 0, size, size); ctx.drawImage(img, 0, 0, size, size);
  }

  async function init(canvas, dpr, creatureSvg, fingersSvg) {
    THREE.ColorManagement.legacyMode = false;
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(dpr); renderer.setSize(540, 960, false);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
    scene = new THREE.Scene(); scene.background = new THREE.Color('#14162a');
    cam = new THREE.PerspectiveCamera(55, 540 / 960, 0.03, 30);

    // Licht: Mond durchs Fenster, kühles Fülllicht, Handy, warmes Fluerlicht
    scene.add(new THREE.HemisphereLight('#c4c7da', '#1c1d28', .8));
    const moon = new THREE.DirectionalLight('#d6daf0', 1.45); moon.position.set(-1.4, 3.4, 3.2); moon.target.position.set(.2, 0, .6);
    moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); Object.assign(moon.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: .5, far: 10 });
    moon.shadow.radius = 4; moon.shadow.bias = -0.0015; scene.add(moon, moon.target);
    const fill = new THREE.DirectionalLight('#9a9db8', .3); fill.position.set(2.5, 2, 5); scene.add(fill);
    phoneLight = new THREE.PointLight('#bcd3ff', 0, 2.4, 2); scene.add(phoneLight);
    warmLight = new THREE.PointLight('#ffad58', 0, 3.2, 2); warmLight.position.set(1.25, .35, .35); scene.add(warmLight);

    // Raum
    const wallM = std('#2c2f46'), sideM = std('#24273e');
    const floor = put(new THREE.Mesh(new THREE.PlaneGeometry(4.4, 5), std('#191a28')), 0, 0, 2.4, scene, false); floor.rotation.x = -Math.PI / 2;
    put(rbox(2.2, .012, 1.7, .005, std('#2f334b')), .1, .006, 1.35, scene, false);
    put(new THREE.Mesh(new THREE.BoxGeometry(3.15, 2.8, .1), wallM), -.625, 1.4, -.05, scene, false);   // links von Tür
    put(new THREE.Mesh(new THREE.BoxGeometry(.4, 2.8, .1), wallM), 2.0, 1.4, -.05, scene, false);
    put(new THREE.Mesh(new THREE.BoxGeometry(.85, .72, .1), wallM), 1.375, 2.44, -.05, scene, false);
    const lw = put(new THREE.Mesh(new THREE.PlaneGeometry(5, 2.8), sideM), -2.2, 1.4, 2.4, scene, false); lw.rotation.y = Math.PI / 2;
    const rw = put(new THREE.Mesh(new THREE.PlaneGeometry(5, 2.8), sideM), 2.2, 1.4, 2.4, scene, false); rw.rotation.y = -Math.PI / 2;
    const ceil = put(new THREE.Mesh(new THREE.PlaneGeometry(4.4, 5), std('#171927')), 0, 2.8, 2.4, scene, false); ceil.rotation.x = Math.PI / 2;
    put(new THREE.Mesh(new THREE.BoxGeometry(3.1, .1, .03), std('#1f2033')), -.62, .05, .015, scene, false);

    // Fenster mit Mond
    const glass = canvasTex(256, 280, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#7581b8'); gr.addColorStop(1, '#2e3460'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(235,240,255,.95)'; g.beginPath(); g.arc(180, 70, 26, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 18; i++) { g.fillRect(Math.random() * w, Math.random() * h * .6, 2, 2); }
    });
    put(rbox(.92, .98, .06, .02, std('#181a2a')), -.95, 1.68, .03, scene, false);
    put(new THREE.Mesh(new THREE.PlaneGeometry(.8, .86), basic('#ffffff', { map: glass })), -.95, 1.68, .062, scene, false);
    put(new THREE.Mesh(new THREE.BoxGeometry(.03, .86, .02), std('#181a2a')), -.95, 1.68, .07, scene, false);
    put(new THREE.Mesh(new THREE.BoxGeometry(.8, .03, .02), std('#181a2a')), -.95, 1.68, .07, scene, false);
    put(rbox(1.0, .04, .12, .015, std('#202238')), -.95, 1.17, .07);
    put(rbox(.24, 1.35, .07, .03, std('#383d5a')), -1.47, 1.62, .1);
    put(rbox(.24, 1.35, .07, .03, std('#383d5a')), -.43, 1.62, .1);

    // Bett
    put(rbox(1.38, .3, 2.0, .04, std('#21243a')), .15, .17, 1.05);
    put(rbox(1.3, .2, 1.95, .06, std('#c7cad7')), .15, .42, 1.05);
    put(rbox(1.5, 1.05, .1, .05, std('#31354e')), .15, .56, .06);
    const pillow = put(new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), std('#c1c5d6')), .15, .62, .3); pillow.scale.set(.47, .1, .2);
    put(rbox(1.42, .3, 1.5, .08, std('#3d4365')), .15, .49, 1.33);
    const fold = put(new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 1.42, 20), std('#4d557b')), .15, .63, .6); fold.rotation.z = Math.PI / 2;

    // Nachttisch + Lampe + Handy
    put(rbox(.44, .56, .4, .03, std('#24273e')), -.82, .28, .22);
    put(new THREE.Mesh(new THREE.BoxGeometry(.36, .006, .01), std('#141626')), -.82, .36, .425, scene, false);
    put(new THREE.Mesh(new THREE.SphereGeometry(.018, 12, 8), std('#80839a', { m: .5, r: .4 })), -.82, .3, .43);
    put(new THREE.Mesh(new THREE.CylinderGeometry(.07, .08, .03, 24), std('#343851')), -.95, .575, .15);
    put(new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .22, 12), std('#343851')), -.95, .69, .15);
    put(new THREE.Mesh(new THREE.CylinderGeometry(.075, .12, .15, 24, 1, true), std('#434768')), -.95, .82, .15);
    deskPhone = put(rbox(.078, .012, .155, .004, std('#07080b', { r: .3 })), -.7, .566, .24);
    deskScreen = new THREE.Mesh(new THREE.PlaneGeometry(.068, .145), basic('#d7e6ff', { transparent: true, opacity: 0 }));
    deskScreen.rotation.x = -Math.PI / 2; deskScreen.position.y = .0065; deskPhone.add(deskScreen);

    // Tür (Scharnier rechts, öffnet ins Zimmer) + Rahmen
    const trim = std('#191b2b');
    put(new THREE.Mesh(new THREE.BoxGeometry(.06, 2.1, .14), trim), .925, 1.05, -.02);
    put(new THREE.Mesh(new THREE.BoxGeometry(.06, 2.1, .14), trim), 1.825, 1.05, -.02);
    put(new THREE.Mesh(new THREE.BoxGeometry(.96, .06, .14), trim), 1.375, 2.1, -.02);
    doorPivot = new THREE.Group(); doorPivot.position.set(1.795, 0, -.04); scene.add(doorPivot);
    doorMesh = put(rbox(.84, 2.045, .05, .01, std('#292d45')), -.42, 1.05, 0, doorPivot);
    const panelM = std('#31354f');
    put(rbox(.6, .7, .012, .005, panelM), -.42, 1.58, .03, doorPivot);
    put(rbox(.6, .85, .012, .005, panelM), -.42, .58, .03, doorPivot);
    handlePivot = new THREE.Group(); handlePivot.position.set(-.76, 1.0, .03); doorPivot.add(handlePivot);
    const metal = std('#9598b0', { m: .7, r: .35 });
    const ros = put(new THREE.Mesh(new THREE.CylinderGeometry(.028, .028, .012, 20), metal), 0, 0, 0, handlePivot); ros.rotation.x = Math.PI / 2;
    put(rbox(.13, .024, .024, .01, metal), .06, 0, .03, handlePivot);

    // Flur hinter der Tür (warm, unbeleuchtet gerendert)
    const hall = (w, h, c, x, y, z, rx = 0, ry = 0) => { const m = put(new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic(c)), x, y, z, scene, false); m.rotation.set(rx, ry, 0); return m; };
    const hfloor = canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, '#ffbe6a'); gr.addColorStop(.5, '#8a5428'); gr.addColorStop(1, '#3a220f'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const hf = hall(1.2, 2.2, '#ffffff', 1.375, .001, -1.2, -Math.PI / 2); hf.material.map = hfloor;
    hall(2.4, 2.8, '#4a2c16', .78, 1.4, -1.2, 0, Math.PI / 2);
    hall(2.4, 2.8, '#3c2412', 1.97, 1.4, -1.2, 0, -Math.PI / 2);
    hall(1.2, 2.8, '#2c1a0d', 1.375, 1.4, -2.3);
    hall(1.2, 2.4, '#1f130a', 1.375, 2.6, -1.2, Math.PI / 2);
    const bulb = put(new THREE.Mesh(new THREE.SphereGeometry(.05, 12, 8), basic('#ffe0a0')), 1.375, 2.45, -1.4, scene, false);
    for (const x of [1.22, 1.52]) put(new THREE.Mesh(new THREE.BoxGeometry(.11, .07, .26), basic('#140b05')), x, .035, -.22, scene, false);

    // Lichtschein auf dem Zimmerboden
    const spillTex = canvasTex(256, 256, (g, w, h) => { const gr = g.createRadialGradient(w / 2, 0, 4, w / 2, 0, h); gr.addColorStop(0, 'rgba(255,180,90,1)'); gr.addColorStop(1, 'rgba(255,180,90,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    spill = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.3), basic('#ffffff', { map: spillTex, transparent: true, opacity: .3, blending: THREE.AdditiveBlending, depthWrite: false }));
    spill.rotation.x = -Math.PI / 2; spill.position.set(1.37, .004, .65); scene.add(spill);

    // Das Ding im Flur (2D) + Finger an der Türkante
    const cc = document.createElement('canvas'); cc.width = 1024; cc.height = 2048; const cg = cc.getContext('2d');
    const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(creatureSvg); await img.decode(); cg.drawImage(img, 0, 0, 1024, 2048);
    creatureTex = new THREE.CanvasTexture(cc); creatureTex.encoding = THREE.sRGBEncoding;
    creature = put(new THREE.Mesh(new THREE.PlaneGeometry(.9, 1.8 * 1.0), basic('#ffffff', { map: creatureTex, transparent: true, alphaTest: .02 })), 1.03, 1.32, -.38, scene, false);
    creature.material.toneMapped = false;
    const fc = document.createElement('canvas'); fc.width = 512; fc.height = 512; const fg = fc.getContext('2d');
    const fimg = new Image(); fimg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(fingersSvg); await fimg.decode(); fg.drawImage(fimg, 0, 0, 512, 512);
    const ft = new THREE.CanvasTexture(fc); ft.encoding = THREE.sRGBEncoding;
    fingersMat = basic('#ffffff', { map: ft, transparent: true, opacity: 0, depthWrite: false }); fingersMat.toneMapped = false;
    fingers = new THREE.Mesh(new THREE.PlaneGeometry(.2, .2), fingersMat); fingers.position.set(-.74, 1.47, .032); doorPivot.add(fingers);

    // 2D-Figur als Ebene
    const ch = document.createElement('canvas'); ch.width = TEX; ch.height = TEX; charCtx = ch.getContext('2d');
    charTex = new THREE.CanvasTexture(ch); charTex.encoding = THREE.sRGBEncoding; charTex.anisotropy = 4;
    const cm = basic('#ffffff', { map: charTex, transparent: true, alphaTest: .02 }); cm.toneMapped = false;
    charMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), cm); scene.add(charMesh);
  }

  // Punkt in 3D -> Punkt auf der Figuren-Ebene (z = pz), entlang des Kamerastrahls
  function toPlane(p, pz) {
    const c = cam.position, s = (pz - c.z) / (p[2] - c.z);
    return [c.x + (p[0] - c.x) * s, c.y + (p[1] - c.y) * s];
  }
  function setCam(pos, look, fov = 55) { cam.position.set(...pos); cam.fov = fov; cam.updateProjectionMatrix(); cam.lookAt(...look); cam.updateMatrixWorld(); }

  async function setChar(svg, cx, cy, z, S) {
    if (!svg) { charMesh.visible = false; return; }
    charMesh.visible = true; charMesh.position.set(cx, cy, z); charMesh.scale.set(S, S, 1);
    await svgToCanvas(svg, charCtx, TEX); charTex.needsUpdate = true;
  }

  function setState(s) {
    // s: {phoneLit, phoneVib, phoneOnDesk, phonePos, handle, open, knock, t}
    deskPhone.visible = s.phoneOnDesk;
    deskPhone.position.x = -.7 + (s.phoneVib ? Math.sin(s.t * 260) * .004 : 0);
    deskScreen.material.opacity = s.phoneLit ? .95 : 0;
    phoneLight.intensity = s.phoneLit ? 1.6 * (s.flick || 1) : 0;
    phoneLight.position.set(...(s.phonePos || [-.7, .62, .26]));
    handlePivot.rotation.z = -(s.handle || 0);
    doorPivot.rotation.y = s.open || 0;
    doorPivot.position.x = 1.795 + (s.knock || 0) * .006;
    const o = clamp((s.open || 0) / .3);
    spill.material.opacity = .28 + .55 * o; spill.scale.set(1 + o * .3, 1, 1 + o * .6);
    warmLight.intensity = .25 + 1.6 * o;
    fingersMat.opacity = clamp(((s.open || 0) - .2) / .1);
  }

  function render() { renderer.render(scene, cam); }
  return { init, setCam, setChar, setState, toPlane, render, get cam() { return cam; } };
})();
