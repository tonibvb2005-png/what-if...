// Colourful animated 3D backdrop (stadium bowl, floodlights, floating balls/coins, confetti).
window.World3D = (function () {
  const T = THREE;
  const THEMES = {
    neon:    { top: '#2a0a6b', mid: '#b0178f', bot: '#ff8a3d', gA: '#2a1260', gB: '#361775', line: '#ff6fe0', l1: '#ff3fbf', l2: '#39d0ff', stand: ['#ff4fd8', '#7b5cff', '#ffd400', '#39d0ff'], coins: 1, balls: .35, conf: 0 },
    fox:     { top: '#061d6e', mid: '#1663ff', bot: '#5ae8ff', gA: '#0e7a40', gB: '#139650', line: '#e8fff0', l1: '#59a8ff', l2: '#ffffff', stand: ['#1663ff', '#ffffff', '#0a3cc2', '#5ae8ff'], coins: 0, balls: 1, conf: 0 },
    xmas:    { top: '#0b3d2e', mid: '#d4243b', bot: '#ffd166', gA: '#0e6a3a', gB: '#138a4a', line: '#ffffff', l1: '#ff4d4d', l2: '#3dff8a', stand: ['#d4243b', '#ffffff', '#1aa35a', '#ffd166'], coins: 0, balls: .7, conf: .55 },
    tension: { top: '#12062e', mid: '#6a1fb0', bot: '#ff3d6e', gA: '#1d0e40', gB: '#27124f', line: '#ff5c8a', l1: '#ff2e63', l2: '#7a5cff', stand: ['#6a1fb0', '#ff3d6e', '#2b1166', '#ff9a3d'], coins: .15, balls: .6, conf: 0 },
    party:   { top: '#ff2fa0', mid: '#ffb000', bot: '#2fe0ff', gA: '#0e8a46', gB: '#18a95a', line: '#ffffff', l1: '#ff2fa0', l2: '#2fe0ff', stand: ['#1663ff', '#ffd400', '#ff2fa0', '#ffffff'], coins: .7, balls: 1, conf: 1 },
    gold:    { top: '#6b2a00', mid: '#ff9d00', bot: '#fff1a8', gA: '#4a2600', gB: '#5c3000', line: '#ffe27a', l1: '#ffd000', l2: '#ff7a00', stand: ['#ffd000', '#ff9d00', '#ffffff', '#ff5c00'], coins: 1, balls: .3, conf: 1 }
  };
  const C = h => new T.Color(h);
  let renderer, scene, camera, skyU, groundU, stands, standBase = [], balls = [], coins = [], conf, confData = [], beams = [], l1, l2, hemi, moon;
  const R = (() => { let s = 12345; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; })();

  function init(canvas) {
    renderer = new T.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1); renderer.setSize(540, 960, false);
    scene = new T.Scene();
    scene.fog = new T.Fog(0x000000, 45, 160);
    camera = new T.PerspectiveCamera(50, 540 / 960, .1, 800);

    skyU = { top: { value: C('#000') }, mid: { value: C('#000') }, bot: { value: C('#000') }, time: { value: 0 } };
    const sky = new T.Mesh(new T.SphereGeometry(400, 48, 24), new T.ShaderMaterial({
      uniforms: skyU, side: T.BackSide, depthWrite: false, fog: false,
      vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `varying vec3 vP; uniform vec3 top,mid,bot; uniform float time;
        void main(){ vec3 d=normalize(vP); float h=d.y*.5+.5; float a=atan(d.z,d.x);
          float s1=sin(a*5.+time*.35+d.y*9.)*.5+.5; float s2=sin(a*3.-time*.25+d.y*14.)*.5+.5;
          vec3 c=mix(bot,mid,smoothstep(.42,.62,h+.05*(s1-.5)));
          c=mix(c,top,smoothstep(.58,.95,h+.08*(s2-.5)));
          c+=.08*s1*s2*mid;
          gl_FragColor=vec4(c,1.); }`
    }));
    scene.add(sky);

    groundU = { gA: { value: C('#000') }, gB: { value: C('#000') }, line: { value: C('#fff') }, fogc: { value: C('#000') }, l1: { value: C('#fff') }, time: { value: 0 } };
    const ground = new T.Mesh(new T.PlaneGeometry(700, 700), new T.ShaderMaterial({
      uniforms: groundU, fog: false,
      vertexShader: 'varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
      fragmentShader: `varying vec3 vW; uniform vec3 gA,gB,line,fogc,l1; uniform float time;
        void main(){ vec2 p=vW.xz; float st=step(.5,fract(p.x/5.));
          vec3 c=mix(gA,gB,st);
          float ring=smoothstep(.35,.0,abs(length(p)-9.));
          float half_=smoothstep(.3,.0,abs(p.y));
          float box=smoothstep(.3,.0,abs(abs(p.x)-34.))*step(abs(p.y),22.)+smoothstep(.3,.0,abs(abs(p.y)-22.))*step(abs(p.x),34.);
          c=mix(c,line,clamp(ring+half_*step(abs(p.x),34.)+box,0.,1.)*.75);
          c+=l1*.22*smoothstep(9.,0.,length(p-vec2(sin(time*.7)*14.,cos(time*.5)*9.)));
          float d=length(p-vec2(0.,20.));
          c=mix(c,fogc,smoothstep(45.,150.,d));
          gl_FragColor=vec4(c,1.); }`
    }));
    ground.rotation.x = -Math.PI / 2; scene.add(ground);

    // stadium bowl
    const N = 72, tiers = 4;
    stands = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ roughness: .6 }), N * tiers);
    const m = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(), pos = new T.Vector3();
    let i = 0;
    for (let k = 0; k < tiers; k++) for (let j = 0; j < N; j++) {
      const a = j / N * Math.PI * 2, r = 50 + k * 4.5;
      pos.set(Math.cos(a) * r * 1.25, 1.2 + k * 2.6, Math.sin(a) * r);
      q.setFromAxisAngle(new T.Vector3(0, 1, 0), -a);
      sc.set(4.3, 2.4 + k * .3, 4.6);
      m.compose(pos, q, sc); stands.setMatrixAt(i, m);
      standBase.push({ idx: j * 7 + k * 3, ph: R() * 6.28 });
      stands.setColorAt(i, C('#fff')); i++;
    }
    scene.add(stands);

    // floodlights + beams
    [[-46, -30], [46, -30], [-46, 36], [46, 36]].forEach(([x, z], k) => {
      const tower = new T.Mesh(new T.CylinderGeometry(.5, .8, 30, 8), new T.MeshStandardMaterial({ color: '#333a55' }));
      tower.position.set(x, 15, z); scene.add(tower);
      const head = new T.Mesh(new T.BoxGeometry(6, 3, 1), new T.MeshBasicMaterial({ color: '#ffffff' }));
      head.position.set(x, 30, z); head.lookAt(0, 0, 0); scene.add(head);
      const beam = new T.Mesh(new T.ConeGeometry(9, 40, 32, 1, true), new T.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: .1, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }));
      beam.geometry.translate(0, -20, 0); beam.geometry.rotateX(-Math.PI / 2);
      beam.position.set(x, 30, z); beam.userData = { x, z, k }; scene.add(beam); beams.push(beam);
    });

    moon = new T.Group();
    const mball = new T.Mesh(new T.IcosahedronGeometry(14, 1), new T.MeshStandardMaterial({ color: '#ffffff', flatShading: true, emissive: '#555', roughness: .5 }));
    moon.add(mball); moon.add(new T.LineSegments(new T.EdgesGeometry(mball.geometry), new T.LineBasicMaterial({ color: '#111' })));
    moon.position.set(-25, 45, -150); scene.add(moon);

    const ballGeo = new T.IcosahedronGeometry(1, 1), ballEdges = new T.EdgesGeometry(ballGeo);
    for (let k = 0; k < 14; k++) {
      const g = new T.Group();
      g.add(new T.Mesh(ballGeo, new T.MeshStandardMaterial({ color: '#ffffff', flatShading: true, roughness: .45 })));
      g.add(new T.LineSegments(ballEdges, new T.LineBasicMaterial({ color: '#111111' })));
      g.userData = rndFloat(); scene.add(g); balls.push(g);
    }
    const coinGeo = new T.CylinderGeometry(1, 1, .18, 32), coinMat = new T.MeshStandardMaterial({ color: '#ffc928', metalness: .85, roughness: .25, emissive: '#5a3a00' });
    for (let k = 0; k < 18; k++) { const c = new T.Mesh(coinGeo, coinMat); c.userData = rndFloat(); scene.add(c); coins.push(c); }

    conf = new T.InstancedMesh(new T.PlaneGeometry(.35, .6), new T.MeshBasicMaterial({ side: T.DoubleSide }), 500);
    const pal = ['#ff2fa0', '#ffd400', '#2fe0ff', '#7cff4f', '#ffffff', '#ff7a00', '#7b5cff'];
    for (let k = 0; k < 500; k++) { confData.push({ x: (R() - .5) * 60, z: (R() - .5) * 50 - 2, y0: R() * 30, v: 2 + R() * 3, rx: R() * 6, ry: R() * 6, w: R() * 3 + 1 }); conf.setColorAt(k, C(pal[k % pal.length])); }
    scene.add(conf);

    hemi = new T.HemisphereLight('#ffffff', '#222244', .9); scene.add(hemi);
    const dl = new T.DirectionalLight('#ffffff', .9); dl.position.set(6, 14, 10); scene.add(dl);
    l1 = new T.PointLight('#fff', 2.2, 90); l2 = new T.PointLight('#fff', 2.2, 90); scene.add(l1, l2);
  }
  function rndFloat() { return { x: (R() - .5) * 60, y: 6 + R() * 16, z: -40 + R() * 22, s: .6 + R() * 1.0, ph: R() * 6.28, sp: .3 + R() * .8, ax: R(), ay: R() }; }

  const lerpC = (a, b, x) => C(a).lerp(C(b), x);
  function blend(a, b, x) {
    const A = THEMES[a], B = THEMES[b] || A, o = {};
    for (const k of ['top', 'mid', 'bot', 'gA', 'gB', 'line', 'l1', 'l2']) o[k] = lerpC(A[k], B[k], x);
    for (const k of ['coins', 'balls', 'conf']) o[k] = A[k] + (B[k] - A[k]) * x;
    o.stand = i => lerpC(A.stand[i % A.stand.length], B.stand[i % B.stand.length], x);
    return o;
  }

  function frame(t, cam, themeA, themeB, mix, extra = {}) {
    const th = blend(themeA, themeB, mix);
    skyU.top.value = th.top; skyU.mid.value = th.mid; skyU.bot.value = th.bot; skyU.time.value = t;
    groundU.gA.value = th.gA; groundU.gB.value = th.gB; groundU.line.value = th.line; groundU.fogc.value = th.bot; groundU.l1.value = th.l1; groundU.time.value = t;
    scene.fog.color = th.bot;
    hemi.color = th.top.clone().lerp(C('#ffffff'), .6);
    l1.color = th.l1; l2.color = th.l2;
    l1.position.set(Math.sin(t * .6) * 18, 10, Math.cos(t * .6) * 10);
    l2.position.set(Math.cos(t * .4) * -18, 12, Math.sin(t * .4) * 8 - 5);

    const pulse = extra.pulse || 0;
    for (let i = 0; i < standBase.length; i++) {
      const b = standBase[i];
      const c = th.stand(b.idx);
      c.multiplyScalar(.75 + .25 * Math.sin(t * (3 + pulse * 6) + b.ph) + pulse * .3);
      stands.setColorAt(i, c);
    }
    stands.instanceColor.needsUpdate = true;
    beams.forEach(bm => {
      const { x, z, k } = bm.userData;
      bm.material.color = (k % 2 ? th.l2 : th.l1);
      bm.material.opacity = .08 + .05 * Math.sin(t * 2 + k) + pulse * .1;
      bm.lookAt(Math.sin(t * .5 + k * 1.7) * 18 * (1 + pulse), 0, Math.cos(t * .4 + k) * 12);
    });
    moon.rotation.y = t * .15; moon.rotation.x = t * .05;
    const place = (o, w, spin) => {
      const d = o.userData, s = d.s * w;
      o.visible = s > .03; o.scale.setScalar(Math.max(s, .001));
      o.position.set(d.x + Math.sin(t * d.sp + d.ph) * 2.5, d.y + Math.sin(t * d.sp * 1.3 + d.ph) * 1.6, d.z);
      o.rotation.set(t * spin * d.ax + d.ph, t * spin * d.ay + d.ph, 0);
    };
    balls.forEach(b => place(b, th.balls, 1.2));
    coins.forEach(c => place(c, th.coins, 2.2));
    const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), s = new T.Vector3();
    confData.forEach((c, k) => {
      const y = 28 - ((c.y0 + t * c.v) % 30);
      e.set(c.rx + t * c.w, c.ry + t * c.w * .7, 0); q.setFromEuler(e);
      v.set(c.x + Math.sin(t * 1.5 + k) * 1.2, y, c.z); s.setScalar(th.conf > .02 ? th.conf : .0001);
      m.compose(v, q, s); conf.setMatrixAt(k, m);
    });
    conf.instanceMatrix.needsUpdate = true;

    // camera follows the 2D camera for parallax
    const yaw = (cam.x - 200) * .00038 + Math.sin(t * .11) * .07 + t * .012;
    const rad = 30 - (cam.z - 1) * 10;
    const shake = extra.shake || 0;
    camera.position.set(Math.sin(yaw) * rad + Math.sin(t * 40) * shake, 7.5 - (cam.y - 1000) * .004 + Math.cos(t * 37) * shake, Math.cos(yaw) * rad);
    camera.lookAt(Math.sin(yaw) * 6, 7.2, Math.cos(yaw) * 6 - 4);
    renderer.render(scene, camera);
  }
  return { init, frame, THEMES };
})();
