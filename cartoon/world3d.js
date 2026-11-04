// Calm 3D sets behind the 2D puppets: a betting shop and a living room.
// One fixed palette per set; mood only changes the light. 1 unit = 100 px of the 2D world.
window.World3D = (function () {
  const T = THREE;
  const SETS = {
    bookies: { wall: '#3f6680', wainscot: '#2f5066', floorA: '#c48a55', floorB: '#b07a48', base: '#24394a', lights: [-3.3, 13.9] },
    stands:  { wall: '#232a4a', wainscot: '#1c2240', floorA: '#5b6277', floorB: '#535a6e', base: '#151a33', lights: [0, 0], stripes: 0 },
    pitch:   { wall: '#1a2140', wainscot: '#1a2140', floorA: '#2f9a4a', floorB: '#2a8a42', base: '#14182f', lights: [-3, 3], stripes: 1 },
    studio:  { wall: '#3b2a6b', wainscot: '#2e2058', floorA: '#4a3486', floorB: '#3d2a72', base: '#22174a', lights: [0, 0] },
    room:    { wall: '#d6a273', wainscot: '#b9855a', floorA: '#8c5d3d', floorB: '#7c5135', base: '#5c3a24', lights: [0, -11.5] }
  };
  const C = h => new T.Color(h);
  let renderer, scene, camera, groups = {}, mats = [], conf, confData = [];
  const R = (() => { let s = 4242; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; })();

  const VS = 'varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }';
  const LIGHT = `uniform float bright; uniform vec2 L0, L1;
    float pool(vec2 p){ return .55*exp(-pow(length(p-L0)/4.5,2.)) + .45*exp(-pow(length(p-L1)/4.5,2.)); }`;

  function floorMat(s) {
    const u = { a: { value: C(s.floorA) }, b: { value: C(s.floorB) }, stripes: { value: s.stripes || 0 }, bright: { value: 1 }, L0: { value: new T.Vector2(s.lights[0], 0) }, L1: { value: new T.Vector2(s.lights[1], 0) } };
    mats.push(u);
    return new T.ShaderMaterial({ uniforms: u, vertexShader: VS, fragmentShader: `varying vec3 vW; uniform vec3 a,b; ${LIGHT}
      uniform float stripes;
      void main(){ vec2 g=floor(vW.xz/2.2); float ch = stripes > .5 ? mod(floor(vW.x/3.2),2.) : mod(g.x+g.y,2.);
        vec3 c=mix(a,b,ch);
        float l=.72+.38*pool(vW.xz);
        c*=l*bright*(1.-.25*smoothstep(4.,14.,vW.z));
        gl_FragColor=vec4(c,1.); }` });
  }
  function wallMat(s) {
    const u = { wall: { value: C(s.wall) }, wain: { value: C(s.wainscot) }, base: { value: C(s.base) }, bright: { value: 1 }, L0: { value: new T.Vector2(s.lights[0], 0) }, L1: { value: new T.Vector2(s.lights[1], 0) } };
    mats.push(u);
    return new T.ShaderMaterial({ uniforms: u, vertexShader: VS, fragmentShader: `varying vec3 vW; uniform vec3 wall,wain,base; ${LIGHT}
      void main(){ float y=vW.y;
        vec3 c = y<3.4 ? wain : wall;
        if (y<.5) c=base;
        if (abs(y-3.4)<.1) c=base*1.25;
        if (y<3.4 && y>.5 && fract(vW.x/4.)<.03) c*=.85;
        float l=.7+.45*(.55*exp(-pow(abs(vW.x-L0.x)/5.,2.))+.45*exp(-pow(abs(vW.x-L1.x)/5.,2.)));
        l*=1.-.35*smoothstep(6.,16.,y);
        gl_FragColor=vec4(c*l*bright,1.); }` });
  }
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  function plane(w, h, mat, x, y, z) { const m = new T.Mesh(new T.PlaneGeometry(w, h), mat); m.position.set(x, y, z); return m; }
  function cone(x, color) {
    const g = new T.ConeGeometry(4.2, 16, 40, 1, true); g.translate(0, -8, 0);
    const m = new T.Mesh(g, new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
      uniforms: { col: { value: C(color) }, bright: { value: 1 } },
      vertexShader: 'varying float vY; void main(){ vY=position.y; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'varying float vY; uniform vec3 col; uniform float bright; void main(){ float a=.16*smoothstep(-16.,-2.,vY)*(1.-smoothstep(-1.,0.,vY)); gl_FragColor=vec4(col*a*bright,1.); }'
    }));
    m.position.set(x, 16, -1.5); return m;
  }

  function buildBookies() {
    const s = SETS.bookies, g = new T.Group();
    const fl = plane(120, 40, floorMat(s), 0, 0, 0); fl.rotation.x = -Math.PI / 2; fl.position.z = 12; g.add(fl);
    g.add(plane(120, 40, wallMat(s), 0, 20, -8));
    // framed posters
    const poster = (x, txt, bg) => {
      const tex = canvasTex(300, 400, (c, w, h) => {
        c.fillStyle = '#1b1035'; c.fillRect(0, 0, w, h); c.fillStyle = bg; c.fillRect(14, 14, w - 28, h - 28);
        c.fillStyle = '#fff'; c.beginPath(); c.arc(w / 2, 160, 70, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#1b1035'; c.beginPath(); c.arc(w / 2, 160, 26, 0, Math.PI * 2); c.fill();
        c.font = '900 44px Inter Display'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText(txt, w / 2, 320);
      });
      g.add(plane(2.4, 3.2, new T.MeshBasicMaterial({ map: tex }), x, 6.6, -7.9));
    };
    poster(-10, 'MATCH', '#e05a47'); poster(9.2, 'DAY', '#2f8f6a'); poster(18.6, 'ODDS', '#e0a447');
    s.lights.forEach(x => g.add(cone(x, '#fff3d6')));
    return g;
  }
  function buildRoom() {
    const s = SETS.room, g = new T.Group();
    const fl = plane(120, 40, floorMat(s), 0, 0, 0); fl.rotation.x = -Math.PI / 2; fl.position.z = 12; g.add(fl);
    g.add(plane(120, 40, wallMat(s), 0, 20, -8));
    const sky = canvasTex(512, 512, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2b2d5c'); gr.addColorStop(.6, '#b86a6a'); gr.addColorStop(1, '#f0a46a');
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.fillStyle = '#2a2448';
      [[20, 300], [90, 220], [150, 330], [210, 180], [290, 260], [350, 210], [420, 300], [470, 240]].forEach(([x, y]) => c.fillRect(x, y, 56, h - y));
      c.fillStyle = 'rgba(255,220,140,.8)'; for (let i = 0; i < 26; i++) c.fillRect(30 + (i * 83) % 460, 260 + (i * 47) % 220, 8, 10);
    });
    const frame = new T.MeshBasicMaterial({ color: '#efe4d4' });
    g.add(plane(5, 3.8, frame, 0, 7.3, -7.95));
    g.add(plane(4.4, 3.2, new T.MeshBasicMaterial({ map: sky }), 0, 7.3, -7.9));
    g.add(plane(.18, 3.2, frame, 0, 7.3, -7.88));
    const clock = canvasTex(256, 256, (c, w) => {
      c.fillStyle = '#efe4d4'; c.beginPath(); c.arc(w / 2, w / 2, 120, 0, Math.PI * 2); c.fill();
      c.lineWidth = 10; c.strokeStyle = '#1b1035'; c.stroke(); c.lineCap = 'round';
      c.beginPath(); c.moveTo(w / 2, w / 2); c.lineTo(w / 2, 50); c.moveTo(w / 2, w / 2); c.lineTo(w / 2 + 60, w / 2); c.stroke();
    });
    g.add(plane(2.4, 2.4, new T.MeshBasicMaterial({ map: clock, transparent: true }), -6.4, 9.4, -7.9));
    // picture frame on the right
    g.add(plane(3, 2.2, frame, 7.5, 8.4, -7.95));
    g.add(plane(2.6, 1.8, new T.MeshBasicMaterial({ color: '#3a7d5c' }), 7.5, 8.4, -7.9));
    s.lights.forEach(x => g.add(cone(x, '#ffe2b8')));
    return g;
  }


  let crowdTex = null;
  function crowdTexture() {
    if (crowdTex) return crowdTex;
    crowdTex = canvasTex(1024, 512, (c, w, h) => {
      c.fillStyle = '#1b2142'; c.fillRect(0, 0, w, h);
      const skins = ['#ffd2b0', '#e8b08a', '#c98d63', '#8a5a3c', '#5e3a24'];
      let seed = 3; const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let row = 0; row < 10; row++) {
        const y = 30 + row * 50;
        c.fillStyle = row % 2 ? '#20284e' : '#252d56'; c.fillRect(0, y + 10, w, 50);
        for (let x = 10 + (row % 2) * 16; x < w; x += 32) {
          const body = r() < .78 ? '#c8102e' : (r() < .5 ? '#ffffff' : '#111111');
          c.fillStyle = body; c.beginPath(); c.roundRect(x - 12, y + 18, 24, 30, 8); c.fill();
          c.fillStyle = skins[Math.floor(r() * skins.length)]; c.beginPath(); c.arc(x, y + 10, 10, 0, Math.PI * 2); c.fill();
          if (r() < .25) { c.fillStyle = '#c8102e'; c.fillRect(x - 3, y - 26, 6, 26); c.fillStyle = '#fff'; c.fillRect(x - 3, y - 18, 6, 6); }
        }
      }
    });
    crowdTex.wrapS = crowdTex.wrapT = THREE.RepeatWrapping; crowdTex.repeat.set(9, 2);
    return crowdTex;
  }
  function buildStands() {
    const s = SETS.stands, g = new T.Group();
    const fl = plane(120, 40, floorMat(s), 0, 0, 0); fl.rotation.x = -Math.PI / 2; fl.position.z = 12; g.add(fl);
    // tiered crowd rising behind the fans
    const crowd = new T.Mesh(new T.PlaneGeometry(120, 26), new T.MeshBasicMaterial({ map: crowdTexture(), color: '#8f95ad' }));
    crowd.position.set(0, 13, -9); crowd.rotation.x = -.25; g.add(crowd); g.userData.crowd = crowd;
    const roof = plane(120, 6, new T.MeshBasicMaterial({ color: '#0e1226' }), 0, 27, -12); g.add(roof);
    [-5, 5].forEach(x => g.add(cone(x, '#e8eeff')));
    return g;
  }
  function buildPitch() {
    const s = SETS.pitch, g = new T.Group();
    const fl = plane(160, 60, floorMat(s), 0, 0, 0); fl.rotation.x = -Math.PI / 2; fl.position.z = 10; g.add(fl);
    const boards = canvasTex(1024, 64, (c, w, h) => {
      for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? '#1655d6' : '#0e2a8a'; c.fillRect(i * w / 4, 0, w / 4, h); c.fillStyle = '#fff'; c.font = '900 34px Inter Display'; c.textAlign = 'center'; c.fillText('FOOTBALLPAGE.TV', i * w / 4 + w / 8, 45); }
    });
    boards.wrapS = THREE.RepeatWrapping; boards.repeat.set(4, 1);
    g.add(plane(160, 1.4, new T.MeshBasicMaterial({ map: boards }), 0, .7, -12));
    const crowd = new T.Mesh(new T.PlaneGeometry(160, 22), new T.MeshBasicMaterial({ map: crowdTexture(), color: '#7d839b' }));
    crowd.position.set(0, 12, -16); crowd.rotation.x = -.35; g.add(crowd); g.userData.crowd = crowd;
    g.add(plane(160, 30, new T.MeshBasicMaterial({ color: '#0b0f24' }), 0, 34, -20));
    [-4, 4].forEach(x => g.add(cone(x, '#f0f4ff')));
    return g;
  }
  function buildStudio() {
    const s = SETS.studio, g = new T.Group();
    const fl = plane(120, 40, floorMat(s), 0, 0, 0); fl.rotation.x = -Math.PI / 2; fl.position.z = 12; g.add(fl);
    g.add(plane(120, 40, wallMat(s), 0, 20, -8));
    [-4.2, 0, 4.2].forEach(x => g.add(cone(x, x === 0 ? '#fff3d6' : '#c9b8ff')));
    return g;
  }
  function init(canvas) {
    renderer = new T.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1); renderer.setSize(1080, 1920, false);
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(46, 1080 / 1920, .1, 400);
    groups.bookies = buildBookies(); groups.room = buildRoom(); groups.studio = buildStudio(); groups.stands = buildStands(); groups.pitch = buildPitch();
    scene.add(groups.bookies, groups.room, groups.studio, groups.stands, groups.pitch);
    conf = new T.InstancedMesh(new T.PlaneGeometry(.22, .36), new T.MeshBasicMaterial({ side: T.DoubleSide }), 300);
    const pal = ['#1655d6', '#ffd400', '#ffffff', '#ef3b5c', '#20c56a'];
    for (let k = 0; k < 300; k++) { confData.push({ x: (R() - .5) * 16, z: -1 + R() * 6, y0: R() * 16, v: 1.6 + R() * 2, rx: R() * 6, ry: R() * 6, w: R() * 3 + 1 }); conf.setColorAt(k, C(pal[k % pal.length])); }
    scene.add(conf);
  }

  // cam: the 2D camera {x, y, z}; set: 'bookies' | 'room'; mood: {bright, conf}
  function frame(t, cam, set, mood = {}) {
    for (const k in groups) groups[k].visible = k === set;
    const cr = groups[set] && groups[set].userData.crowd; if (cr) { cr.position.y = (set === 'pitch' ? 12 : 13) + Math.abs(Math.sin(t * (mood.crowd || 2))) * .12 * (mood.crowdAmp || 1); }
    const b = mood.bright != null ? mood.bright : 1;
    mats.forEach(u => { u.bright.value = b; });
    scene.traverse(o => { if (o.material && o.material.uniforms && o.material.uniforms.col) o.material.uniforms.bright.value = b; });
    // confetti only when the story calls for it
    const cf = mood.conf || 0, m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), s = new T.Vector3();
    const cx = cam.x / 100;
    confData.forEach((c, k) => {
      const y = 15 - ((c.y0 + t * c.v) % 16);
      e.set(c.rx + t * c.w, c.ry + t * c.w * .7, 0); q.setFromEuler(e);
      v.set(cx + c.x + Math.sin(t * 1.3 + k) * .4, y, c.z); s.setScalar(cf > .02 ? cf : .0001);
      m.compose(v, q, s); conf.setMatrixAt(k, m);
    });
    conf.instanceMatrix.needsUpdate = true;
    // camera matches the 2D camera: x pan, zoom by distance, gentle downward tilt
    const dist = 20.6 / cam.z;
    const ty = (1400 - cam.y) / 100;
    camera.position.set(cx, ty + 2.2, dist);
    camera.lookAt(cx, ty, 0);
    renderer.render(scene, camera);
  }
  return { init, frame };
})();
