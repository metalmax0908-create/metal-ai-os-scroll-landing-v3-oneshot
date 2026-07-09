/**
 * Metal AI OS — WebGL 中环一镜 v3 (P0 写实)
 * Real Des Voeux Central language + photo facades from hero stills.
 * 1 写实贴图  2 A1 几何  3 移动端 LOD + InstancedMesh
 */
import * as THREE from 'https://esm.sh/three@0.170.0';

function clamp(n, a = 0, b = 1) {
  return Math.min(b, Math.max(a, n));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function smooth(t) {
  t = clamp(t);
  return t * t * (3 - 2 * t);
}
function seg(t, a, b) {
  return clamp((t - a) / Math.max(0.0001, b - a));
}
function remapHeroT(tLin) {
  tLin = clamp(tLin);
  if (tLin < 0.30) return (tLin / 0.30) * 0.12;
  return 0.12 + ((tLin - 0.30) / 0.70) * 0.88;
}
function isMobileDevice() {
  return (
    window.matchMedia('(max-width: 820px)').matches ||
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || '')
  );
}

function makeCanvasTexture(draw, size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function fallbackGlass(hue = 200) {
  return makeCanvasTexture((ctx, s) => {
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, `hsl(${hue}, 30%, 44%)`);
    g.addColorStop(1, `hsl(${hue}, 22%, 36%)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    const cols = 12;
    const rows = 24;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        ctx.fillStyle = `rgba(190,220,240,${0.25 + Math.random() * 0.4})`;
        ctx.fillRect(x * (s / cols) + 1, y * (s / rows) + 1, s / cols - 2, s / rows - 2);
      }
    }
    ctx.strokeStyle = 'rgba(30,45,60,0.5)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * (s / cols), 0);
      ctx.lineTo(x * (s / cols), s);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * (s / rows));
      ctx.lineTo(s, y * (s / rows));
      ctx.stroke();
    }
  });
}

function loadTexture(loader, url, { repeatX = 1, repeatY = 1, aniso = 8 } = {}) {
  return new Promise((resolve) => {
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(repeatX, repeatY);
        tex.anisotropy = aniso;
        resolve(tex);
      },
      undefined,
      () => resolve(null)
    );
  });
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ onReady?: () => void }} [opts]
 */
export function createCentralWebGL(canvas, opts = {}) {
  const mobile = isMobileDevice();
  const lod = {
    mobile,
    dpr: mobile ? Math.min(window.devicePixelRatio || 1, 1.5) : Math.min(window.devicePixelRatio || 1, 2),
    shadows: !mobile,
    shadowMap: mobile ? 512 : 2048,
    carCount: mobile ? 10 : 18,
    poleCount: mobile ? 14 : 26,
    aniso: mobile ? 4 : 8,
  };

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !mobile,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(lod.dpr);
  renderer.setClearColor(0x9ec8e8, 1);
  renderer.shadowMap.enabled = lod.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xb4cde0, mobile ? 0.0058 : 0.0042);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.25, 520);

  scene.add(new THREE.HemisphereLight(0xd8ecff, 0x8a8274, 1.1));
  const sun = new THREE.DirectionalLight(0xfff2e0, 1.5);
  sun.position.set(-48, 100, -20);
  if (lod.shadows) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(lod.shadowMap, lod.shadowMap);
    Object.assign(sun.shadow.camera, {
      near: 5, far: 320, left: -100, right: 100, top: 130, bottom: -40,
    });
    sun.shadow.bias = -0.0002;
  }
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xa8c8e8, 0.45);
  fill.position.set(55, 45, 40);
  scene.add(fill);

  // Env reflection
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envSc = new THREE.Scene();
  envSc.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(12, 12, 8),
      new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        map: makeCanvasTexture((ctx, s) => {
          const g = ctx.createLinearGradient(0, 0, 0, s);
          g.addColorStop(0, '#5a9fd0');
          g.addColorStop(0.48, '#c8e4f4');
          g.addColorStop(0.55, '#e8e4d4');
          g.addColorStop(1, '#7a766c');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, s, s);
        }, 128),
      })
    )
  );
  const envMap = pmrem.fromScene(envSc, 0.04).texture;
  scene.environment = envMap;
  pmrem.dispose();

  // Sky
  scene.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(400, mobile ? 16 : 28, mobile ? 10 : 14),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          top: { value: new THREE.Color(0x4e96cc) },
          mid: { value: new THREE.Color(0xb4d6ec) },
          bot: { value: new THREE.Color(0xe6f0f4) },
        },
        vertexShader: `varying vec3 v;void main(){v=normalize((modelMatrix*vec4(position,1.)).xyz);gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.);}`,
        fragmentShader: `uniform vec3 top,mid,bot;varying vec3 v;void main(){float h=v.y;vec3 c=mix(bot,mid,smoothstep(-.05,.22,h));c=mix(c,top,smoothstep(.12,.78,h));float s=pow(max(0.,dot(v,normalize(vec3(-.35,.6,-.15)))),40.);c+=vec3(1.,.96,.88)*s*.4;gl_FragColor=vec4(c,1.);}`,
      })
    )
  );

  const world = new THREE.Group();
  scene.add(world);

  const ROAD_LEN = 250;
  const ROAD_W = 28;
  const TRAM_HALF = 2.5;
  const loader = new THREE.TextureLoader();
  const TEX = 'assets/images/webgl-tex';

  // Materials — procedural curtain wall for towers.
  // Street photo on full boxes = sideways cars 穿帮 (self-review P0 fail).
  const asphaltMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.94, metalness: 0.04 });
  {
    const asph = makeCanvasTexture((ctx, s) => {
      ctx.fillStyle = '#3c3c3e';
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 1200; i++) {
        const v = 45 + Math.random() * 35;
        ctx.fillStyle = `rgb(${v},${v},${v + 2})`;
        ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
      }
    }, 256);
    asph.repeat.set(3, 24);
    asph.anisotropy = lod.aniso;
    asphaltMat.map = asph;
  }
  const glassMats = [200, 195, 208].map((hue) => {
    const map = fallbackGlass(hue);
    map.repeat.set(1, 2.4);
    map.anisotropy = lod.aniso;
    return new THREE.MeshStandardMaterial({
      map,
      color: 0xffffff,
      metalness: 0.74,
      roughness: 0.14,
      envMapIntensity: 1.3,
    });
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xc8c0b4,
    roughness: 0.86,
    metalness: 0.06,
  });
  const shopMat = new THREE.MeshStandardMaterial({
    color: 0xb8b0a0,
    roughness: 0.72,
    metalness: 0.08,
  });
  // Optional: shop photo only on podiums (short face, less stretch)
  loadTexture(loader, `${TEX}/facade-shop.jpg`, { aniso: lod.aniso }).then((shop) => {
    if (!shop) return;
    shop.repeat.set(1, 1);
    shopMat.map = shop;
    shopMat.color.setHex(0xffffff);
    shopMat.needsUpdate = true;
  });
  const ifcMap = fallbackGlass(205);
  ifcMap.repeat.set(2, 4);
  const ifcMat = new THREE.MeshStandardMaterial({
    map: ifcMap,
    color: 0xffffff,
    metalness: 0.8,
    roughness: 0.1,
    envMapIntensity: 1.5,
  });

  // —— Road ——
  const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, ROAD_LEN), asphaltMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.01, ROAD_LEN * 0.5);
  road.receiveShadow = true;
  world.add(road);

  const dashGeo = new THREE.PlaneGeometry(0.15, 2.6);
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xeae6d8 });
  const dashN = mobile ? 48 : 80;
  const dashInst = new THREE.InstancedMesh(dashGeo, dashMat, dashN);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < dashN; i++) {
    dummy.position.set(i % 2 === 0 ? -8.2 : 8.2, 0.035, 12 + (i / dashN) * (ROAD_LEN - 24));
    dummy.rotation.x = -Math.PI / 2;
    dummy.updateMatrix();
    dashInst.setMatrixAt(i, dummy.matrix);
  }
  world.add(dashInst);

  // Tram corridor yellow edges + rails
  const yel = new THREE.MeshBasicMaterial({ color: 0xd4a017 });
  [-TRAM_HALF - 0.35, TRAM_HALF + 0.35].forEach((x) => {
    const ln = new THREE.Mesh(new THREE.PlaneGeometry(0.16, ROAD_LEN * 0.9), yel);
    ln.rotation.x = -Math.PI / 2;
    ln.position.set(x, 0.032, ROAD_LEN * 0.48);
    world.add(ln);
  });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x5a5a60, metalness: 0.88, roughness: 0.25 });
  [-1.2, -0.55, 0.55, 1.2].forEach((x) => {
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, ROAD_LEN * 0.9), railMat);
    r.position.set(x, 0.05, ROAD_LEN * 0.45);
    world.add(r);
  });
  const sleepN = mobile ? 48 : 90;
  const sleepInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(2.7, 0.06, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x3a3a38, roughness: 0.95 }),
    sleepN
  );
  for (let i = 0; i < sleepN; i++) {
    dummy.position.set(0, 0.03, 14 + i * ((ROAD_LEN * 0.88) / sleepN));
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    sleepInst.setMatrixAt(i, dummy.matrix);
  }
  world.add(sleepInst);

  // Sidewalks — thin slabs (was reading as tall white walls)
  const walkMat = new THREE.MeshStandardMaterial({ color: 0xb0a898, roughness: 0.92 });
  [-1, 1].forEach((side) => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.18, ROAD_LEN), walkMat);
    w.position.set(side * (ROAD_W * 0.5 + 2.5), 0.09, ROAD_LEN * 0.5);
    w.receiveShadow = true;
    world.add(w);
    // kerb
    const kerb = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.28, ROAD_LEN),
      new THREE.MeshStandardMaterial({ color: 0x9a948c, roughness: 0.88 })
    );
    kerb.position.set(side * (ROAD_W * 0.5 + 0.15), 0.14, ROAD_LEN * 0.5);
    world.add(kerb);
  });

  // Planters — off tram reserve, smaller (was confused for ding-ding)
  const plantMat = new THREE.MeshStandardMaterial({ color: 0x3a5a36, roughness: 0.85 });
  const potMat = new THREE.MeshStandardMaterial({ color: 0x6a645c, roughness: 0.8 });
  for (let i = 0; i < (mobile ? 8 : 12); i++) {
    const z = 28 + i * 16;
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * (ROAD_W * 0.5 + 3.6);
    const pot = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.8), potMat);
    pot.position.set(x, 0.32, z);
    world.add(pot);
    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), plantMat);
    bush.position.set(x, 0.75, z);
    bush.scale.set(1.1, 0.65, 1.2);
    world.add(bush);
  }

  // —— Towers ——
  function addTower({ x, z, w, d, h, kind = 'glass', seed = 0 }) {
    const g = new THREE.Group();
    const mat = kind === 'stone' ? stoneMat : glassMats[seed % glassMats.length];
    const podiumH = Math.min(7 + (seed % 5), h * 0.16);
    const pod = new THREE.Mesh(
      new THREE.BoxGeometry(w * 1.1, podiumH, d * 1.08),
      kind === 'shop' ? shopMat : stoneMat
    );
    pod.position.y = podiumH * 0.5;
    pod.castShadow = lod.shadows;
    pod.receiveShadow = true;
    g.add(pod);
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(w, h - podiumH, d), mat);
    shaft.position.y = podiumH + (h - podiumH) * 0.5;
    shaft.castShadow = lod.shadows;
    shaft.receiveShadow = true;
    g.add(shaft);
    if (h > 55 && !mobile) {
      const crown = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.9, 2.4, d * 0.9),
        new THREE.MeshStandardMaterial({ color: 0xd4dae0, metalness: 0.55, roughness: 0.32 })
      );
      crown.position.y = h + 0.6;
      g.add(crown);
    }
    if (seed % 3 === 0 && h > 70) {
      const top = new THREE.Mesh(new THREE.BoxGeometry(w * 0.68, h * 0.1, d * 0.68), mat);
      top.position.y = h + h * 0.05;
      g.add(top);
    }
    g.position.set(x, 0, z);
    world.add(g);
  }

  const leftBlocks = [
    { z: 18, w: 17, d: 20, h: 38, kind: 'shop', seed: 0 },
    { z: 44, w: 14, d: 18, h: 78, kind: 'glass', seed: 1 },
    { z: 72, w: 18, d: 22, h: 52, kind: 'glass', seed: 2 },
    { z: 100, w: 13, d: 17, h: 98, kind: 'glass', seed: 0 },
    { z: 128, w: 15, d: 20, h: 62, kind: 'stone', seed: 1 },
    { z: 158, w: 14, d: 18, h: 115, kind: 'glass', seed: 2 },
    { z: 188, w: 16, d: 19, h: 72, kind: 'glass', seed: 0 },
    { z: 218, w: 13, d: 16, h: 88, kind: 'glass', seed: 1 },
  ];
  leftBlocks.forEach((b) =>
    addTower({ ...b, x: -(ROAD_W * 0.5 + 10 + b.w * 0.42) })
  );
  const rightBlocks = [
    { z: 16, w: 14, d: 17, h: 44, kind: 'shop', seed: 2 },
    { z: 40, w: 15, d: 19, h: 68, kind: 'glass', seed: 0 },
    { z: 68, w: 12, d: 16, h: 92, kind: 'glass', seed: 1 },
    { z: 96, w: 17, d: 21, h: 54, kind: 'stone', seed: 2 },
    { z: 124, w: 14, d: 18, h: 108, kind: 'glass', seed: 0 },
    { z: 152, w: 16, d: 20, h: 76, kind: 'glass', seed: 1 },
    { z: 180, w: 13, d: 17, h: 122, kind: 'glass', seed: 2 },
    { z: 210, w: 15, d: 18, h: 70, kind: 'glass', seed: 0 },
  ];
  rightBlocks.forEach((b) =>
    addTower({ ...b, x: ROAD_W * 0.5 + 10 + b.w * 0.42 })
  );

  // —— Flyover (A1: higher, longer, more presence) ——
  const flyMat = new THREE.MeshStandardMaterial({ color: 0xa09c94, roughness: 0.76, metalness: 0.1 });
  const flyDeck = new THREE.Mesh(new THREE.BoxGeometry(22, 1.6, 130), flyMat);
  flyDeck.position.set(-16.5, 15.5, 62);
  flyDeck.rotation.y = 0.05;
  flyDeck.castShadow = lod.shadows;
  world.add(flyDeck);
  // barrier walls on deck
  [-1, 1].forEach((s) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.1, 128), flyMat);
    wall.position.set(-16.5 + s * 10.5, 16.6, 62);
    wall.rotation.y = 0.05;
    world.add(wall);
  });
  if (!mobile) {
    for (let i = 0; i < 14; i++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(20, 0.7, 0.9), flyMat);
      rib.position.set(-16.5, 14.5, 15 + i * 9);
      rib.rotation.y = 0.05;
      world.add(rib);
    }
  }
  for (let i = 0; i < 8; i++) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(2.2, 15.2, 2.6), flyMat);
    pier.position.set(-13 - (i % 2) * 5.5, 7.4, 20 + i * 15);
    pier.castShadow = lod.shadows;
    world.add(pier);
  }
  const redSteel = new THREE.MeshStandardMaterial({ color: 0xb03a2e, metalness: 0.6, roughness: 0.35 });
  {
    const redBeam = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.55, 32), redSteel);
    redBeam.position.set(-24, 17.5, 50);
    redBeam.rotation.z = 0.12;
    world.add(redBeam);
  }

  // —— IFC Two: glass cylinder + clear crown (no photo wrap) ——
  const ifc = new THREE.Group();
  ifc.position.set(0, 0, ROAD_LEN + 8);
  const ifcBody = new THREE.Mesh(
    new THREE.CylinderGeometry(10, 12.5, 150, mobile ? 20 : 36),
    ifcMat
  );
  ifcBody.position.y = 75;
  ifcBody.castShadow = lod.shadows;
  ifc.add(ifcBody);
  // vertical mullion strips for tower read
  if (!mobile) {
    const mullMat = new THREE.MeshStandardMaterial({ color: 0xc8dce8, metalness: 0.7, roughness: 0.25 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const mull = new THREE.Mesh(new THREE.BoxGeometry(0.35, 148, 0.2), mullMat);
      mull.position.set(Math.cos(a) * 11.2, 75, Math.sin(a) * 11.2);
      mull.rotation.y = -a;
      ifc.add(mull);
    }
  }
  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(11.5, mobile ? 14 : 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshStandardMaterial({
      color: 0xe8f4fc,
      metalness: 0.78,
      roughness: 0.08,
      envMapIntensity: 1.6,
    })
  );
  crown.position.y = 150;
  ifc.add(crown);
  const ant = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.32, 24, 6),
    new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 0.88, roughness: 0.18 })
  );
  ant.position.y = 168;
  ifc.add(ant);
  world.add(ifc);

  // Skyline cluster around IFC
  [
    { x: -32, z: ROAD_LEN - 5, w: 15, d: 15, h: 95, seed: 0 },
    { x: 30, z: ROAD_LEN - 8, w: 13, d: 13, h: 82, seed: 1 },
    { x: -20, z: ROAD_LEN + 30, w: 16, d: 16, h: 75, seed: 2 },
    { x: 24, z: ROAD_LEN + 28, w: 12, d: 12, h: 100, seed: 0 },
  ].forEach((b) => addTower({ ...b, kind: 'glass' }));

  // Hills
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x7a8f74, roughness: 1, flatShading: true });
  [-75, -25, 45].forEach((x, i) => {
    const hill = new THREE.Mesh(new THREE.ConeGeometry(38 + i * 6, 24 + i * 3, 7), hillMat);
    hill.position.set(x, 7, ROAD_LEN + 90);
    world.add(hill);
  });

  // Poles
  const poleGeo = new THREE.CylinderGeometry(0.11, 0.15, 7.8, 6);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x6a6a6e, metalness: 0.5, roughness: 0.45 });
  const lampGeo = new THREE.SphereGeometry(0.3, 8, 6);
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xfff6e8,
    emissive: 0xffe8b8,
    emissiveIntensity: 0.4,
  });
  const poleInst = new THREE.InstancedMesh(poleGeo, poleMat, lod.poleCount);
  const lampInst = new THREE.InstancedMesh(lampGeo, lampMat, lod.poleCount);
  for (let i = 0; i < lod.poleCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const z = 20 + (i / lod.poleCount) * (ROAD_LEN - 35);
    const x = side * (ROAD_W * 0.5 + 1.3);
    dummy.position.set(x, 3.9, z);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    poleInst.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x, 7.9, z);
    dummy.updateMatrix();
    lampInst.setMatrixAt(i, dummy.matrix);
  }
  world.add(poleInst, lampInst);

  // Traffic light
  const tl = new THREE.Group();
  tl.position.set(-6, 0, 40);
  {
    const tlPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 5.8, 6), poleMat);
    tlPole.position.set(0, 2.9, 0);
    tl.add(tlPole);
  }
  ['#c62828', '#f9a825', '#2e7d32'].forEach((col, i) => {
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 6),
      new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.55 })
    );
    bulb.position.set(0.4, 4.4 - i * 0.48, 0);
    tl.add(bulb);
  });
  world.add(tl);

  // —— Vehicles (better taxi / sedan proportions) ——
  const vehicles = [];
  const taxiRed = new THREE.MeshStandardMaterial({ color: 0xc62828, roughness: 0.38, metalness: 0.32 });
  const darkCar = new THREE.MeshStandardMaterial({ color: 0x1e1e22, roughness: 0.32, metalness: 0.45 });
  const silverCar = new THREE.MeshStandardMaterial({ color: 0xb4b8bc, roughness: 0.3, metalness: 0.55 });
  const whiteCar = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.36, metalness: 0.28 });
  const glassWin = new THREE.MeshStandardMaterial({
    color: 0x6a90a8,
    metalness: 0.55,
    roughness: 0.12,
    transparent: true,
    opacity: 0.7,
  });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.92 });

  function makeSedan(bodyMat, s = 1) {
    // Scale up ~1.35× so cars read at canyon distance (self-review: lego-tiny)
    s *= 1.35;
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.9 * s, 0.5 * s, 4.3 * s), bodyMat);
    body.position.y = 0.55 * s;
    body.castShadow = lod.shadows;
    g.add(body);
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.75 * s, 0.24 * s, 1.15 * s), bodyMat);
    hood.position.set(0, 0.66 * s, 1.4 * s);
    g.add(hood);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65 * s, 0.58 * s, 2.05 * s), glassWin);
    cabin.position.set(0, 1.05 * s, -0.12 * s);
    g.add(cabin);
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.75 * s, 0.3 * s, 0.95 * s), bodyMat);
    trunk.position.set(0, 0.7 * s, -1.6 * s);
    g.add(trunk);
    [[-0.78, 1.25], [0.78, 1.25], [-0.78, -1.3], [0.78, -1.3]].forEach(([x, z]) => {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.32 * s, 0.32 * s, 0.26 * s, 10), rubber);
      wh.rotation.z = Math.PI / 2;
      wh.position.set(x * s, 0.32 * s, z * s);
      g.add(wh);
    });
    return g;
  }

  function makeTaxi() {
    const g = makeSedan(taxiRed, 1.02);
    // roof light
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.18, 0.75),
      new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.5 })
    );
    roof.position.set(0, 1.35, 0.2);
    g.add(roof);
    // silver roof stripe (HK taxi)
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(1.88, 0.06, 1.2),
      new THREE.MeshStandardMaterial({ color: 0xd0d0d0, metalness: 0.4, roughness: 0.4 })
    );
    stripe.position.set(0, 0.78, 0);
    g.add(stripe);
    return g;
  }

  const lanes = [-10, -7, 7, 10];
  const mats = [darkCar, silverCar, whiteCar, darkCar];
  for (let i = 0; i < lod.carCount; i++) {
    const isTaxi = i % 3 === 0;
    const mesh = isTaxi ? makeTaxi() : makeSedan(mats[i % mats.length], 0.95 + (i % 3) * 0.04);
    const lane = lanes[i % lanes.length];
    const dir = lane < 0 ? 1 : -1;
    const z0 = 20 + (i / lod.carCount) * (ROAD_LEN - 45);
    mesh.position.set(lane, 0, z0);
    mesh.rotation.y = dir > 0 ? 0 : Math.PI;
    world.add(mesh);
    vehicles.push({ mesh, lane, z: z0, speed: (6.2 + (i % 5) * 0.85) * dir, dir });
  }

  // —— Classic ding-ding (A1 proportions, no dolls) ——
  function makeDingDing({ lower, upper }) {
    // Larger so ding-ding reads in mid shots (self-review: lost next to canyon)
    const sc = 1.55;
    const g = new THREE.Group();
    g.scale.set(sc, sc, sc);
    const low = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1.7, 9.5),
      new THREE.MeshStandardMaterial({ color: lower, roughness: 0.38, metalness: 0.22 })
    );
    low.position.y = 1.1;
    low.castShadow = lod.shadows;
    g.add(low);
    const up = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.45, 8.8),
      new THREE.MeshStandardMaterial({ color: upper, roughness: 0.4, metalness: 0.15 })
    );
    up.position.y = 2.65;
    g.add(up);
    // window bands
    const winM = new THREE.MeshStandardMaterial({
      color: 0x5a88a0,
      metalness: 0.5,
      roughness: 0.12,
      transparent: true,
      opacity: 0.62,
    });
    const w1 = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.58, 7.8), winM);
    w1.position.y = 1.55;
    g.add(w1);
    const w2 = w1.clone();
    w2.position.y = 2.85;
    g.add(w2);
    // front face
    const face = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.4, 0.15),
      new THREE.MeshStandardMaterial({ color: lower, roughness: 0.4 })
    );
    face.position.set(0, 1.5, 4.55);
    g.add(face);
    // destination
    const dest = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.32, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x2a3a18, emissiveIntensity: 0.5 })
    );
    dest.position.set(0, 2.15, 4.65);
    g.add(dest);
    // cream window frame band on orange tram
    if (lower !== upper) {
      const band = new THREE.Mesh(
        new THREE.BoxGeometry(2.42, 0.35, 9.0),
        new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.5 })
      );
      band.position.y = 1.95;
      g.add(band);
    }
    // trolley poles
    [-2.8, 2.8].forEach((z) => {
      const p = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 1.1, 5),
        new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.75, roughness: 0.28 })
      );
      p.position.set(0, 3.7, z);
      g.add(p);
    });
    // wheels
    [-3.2, 0, 3.2].forEach((z) => {
      [-0.9, 0.9].forEach((x) => {
        const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 10), rubber);
        wh.rotation.z = Math.PI / 2;
        wh.position.set(x, 0.35, z);
        g.add(wh);
      });
    });
    return g;
  }

  const tramCream = makeDingDing({ lower: 0xf5f0e6, upper: 0xf5f0e6 });
  const tramOrange = makeDingDing({ lower: 0xe87818, upper: 0xf5f0e6 });
  // Keep trams in mid-corridor where camera spends most time
  tramCream.position.set(-0.95, 0, 70);
  tramOrange.position.set(0.95, 0, 88);
  world.add(tramCream, tramOrange);
  const trams = [
    { mesh: tramCream, z: 70, speed: 3.2, x: -0.95 },
    { mesh: tramOrange, z: 88, speed: 2.7, x: 0.95 },
  ];

  // —— Camera (IFC more visible, A1-like elevated) ——
  function sampleCamera(t) {
    t = clamp(t);
    const pos = new THREE.Vector3();
    const look = new THREE.Vector3();
    let fov = 45;
    if (t < 0.16) {
      const u = smooth(seg(t, 0, 0.16));
      pos.lerpVectors(new THREE.Vector3(0.5, 2.6, 26), new THREE.Vector3(0.3, 4.5, 24), u);
      look.lerpVectors(new THREE.Vector3(0, 75, 50), new THREE.Vector3(0, 58, 58), u);
      fov = lerp(55, 49, u);
    } else if (t < 0.38) {
      const u = smooth(seg(t, 0.16, 0.38));
      pos.lerpVectors(new THREE.Vector3(0.3, 4.5, 24), new THREE.Vector3(0, 36, 18), u);
      look.lerpVectors(new THREE.Vector3(0, 58, 58), new THREE.Vector3(1.5, 28, 160), u);
      fov = lerp(49, 44, u);
    } else if (t < 0.68) {
      const u = smooth(seg(t, 0.38, 0.68));
      pos.lerpVectors(new THREE.Vector3(0, 36, 18), new THREE.Vector3(0, 20, 55), u);
      look.lerpVectors(new THREE.Vector3(1.5, 28, 160), new THREE.Vector3(1.5, 18, 190), u);
      fov = lerp(44, 43, u);
    } else {
      const u = smooth(seg(t, 0.68, 1));
      pos.lerpVectors(new THREE.Vector3(0, 20, 55), new THREE.Vector3(0, 11, 100), u);
      look.lerpVectors(new THREE.Vector3(1.5, 18, 190), new THREE.Vector3(1.5, 22, 250), u);
      fov = lerp(43, 42, u);
    }
    return { pos, look, fov };
  }

  let progress = 0;
  let hold = false;
  let lastTs = performance.now();
  let raf = 0;
  let disposed = false;

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    if (w < 2 || h < 2) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function setProgress(tLin, isDaylightStage = false) {
    progress = clamp(tLin);
    hold = !!isDaylightStage;
  }

  function tick(ts) {
    if (disposed) return;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    const motion = hold ? 0.48 : 1;

    vehicles.forEach((v) => {
      v.z += v.speed * dt * motion;
      if (v.dir > 0 && v.z > ROAD_LEN - 14) v.z = 16;
      if (v.dir < 0 && v.z < 16) v.z = ROAD_LEN - 14;
      v.mesh.position.set(v.lane, 0, v.z);
    });
    trams.forEach((tr) => {
      tr.z += tr.speed * dt * motion * 0.65;
      if (tr.z > ROAD_LEN - 28) tr.z = 24;
      tr.mesh.position.set(tr.x, 0, tr.z);
    });

    const tVis = hold ? 1 : remapHeroT(progress);
    const cam = sampleCamera(tVis);
    camera.position.copy(cam.pos);
    camera.lookAt(cam.look);
    if (Math.abs(camera.fov - cam.fov) > 0.04) {
      camera.fov = cam.fov;
      camera.updateProjectionMatrix();
    }
    sun.position.x = -48 + Math.sin(ts * 0.00005) * 4;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }

  resize();
  raf = requestAnimationFrame(tick);
  opts.onReady?.();

  return {
    setProgress,
    resize,
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      renderer.dispose();
      envMap.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const ms = Array.isArray(obj.material) ? obj.material : [obj.material];
          ms.forEach((m) => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        }
      });
    },
    get lod() {
      return { ...lod };
    },
  };
}

export default createCentralWebGL;
