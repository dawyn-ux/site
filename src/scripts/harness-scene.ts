/**
 * Scène 3D interactive de la page d'accueil : un faisceau électrique
 * (connecteur, contacts, fils, repère, gaine thermorétractable, tresse métallique)
 * traversé par des impulsions de courant. Chargée à la demande (import dynamique).
 */
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  LatheGeometry,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Raycaster,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  BoxGeometry,
  NoColorSpace,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export type PartKey = 'connector' | 'contact' | 'marker' | 'sleeve' | 'braid';

interface Options {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  hotspots: Map<PartKey, HTMLElement>;
  accent: string;
  secondary: string;
  ink: string;
  reducedMotion: boolean;
  onReady?: () => void;
}

export function initHarnessScene(opts: Options) {
  const { canvas, container, hotspots, reducedMotion } = opts;

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTexture;

  const camera = new PerspectiveCamera(30, 1, 0.1, 100);
  const cameraBase = new Vector3(0.4, 1.9, 10.5);
  camera.position.copy(cameraBase);
  const target = new Vector3(-0.7, -0.1, 0);

  scene.add(new HemisphereLight(0xffffff, 0x444444, 0.6));
  const key = new DirectionalLight(0xffffff, 1.6);
  key.position.set(4, 6, 5);
  scene.add(key);
  const rim = new DirectionalLight(new Color(opts.secondary), 1.4);
  rim.position.set(-6, 2, -4);
  scene.add(rim);

  const root = new Group();
  scene.add(root);

  // ---------------------------------------------------------------- Matériaux
  const accent = new Color(opts.accent);
  const ink = new Color(opts.ink);
  const secondary = new Color(opts.secondary);

  const housingMat = new MeshPhysicalMaterial({ color: 0xf3f5f8, roughness: 0.55, clearcoat: 0.2, clearcoatRoughness: 0.6 });
  const cavityMat = new MeshStandardMaterial({ color: ink.clone().multiplyScalar(0.8), roughness: 0.9 });
  const goldMat = new MeshStandardMaterial({ color: 0xd8b25a, metalness: 1, roughness: 0.22 });
  const tinMat = new MeshStandardMaterial({ color: 0xd3d7d9, metalness: 1, roughness: 0.26 });
  // Brins de cuivre étamé
  const copperMat = new MeshStandardMaterial({ color: 0xc9ced3, metalness: 1, roughness: 0.3 });
  const sleeveMat = new MeshPhysicalMaterial({ color: 0x1d1b1a, roughness: 0.62, clearcoat: 0.35, clearcoatRoughness: 0.5, side: DoubleSide });

  // Couleurs d'isolant reprises du logo : noir, framboise, bleu, bleu ciel, gris, blanc
  const wireColors = [ink.getHex(), accent.getHex(), secondary.getHex(), 0xc1dcf2, 0x8e99a6, 0xf1f4f8];
  const wireMats = wireColors.map(
    (c) => new MeshPhysicalMaterial({ color: c, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.35 }),
  );

  // Texture de tresse générée (pas de fichier à charger)
  const braidCanvas = document.createElement('canvas');
  braidCanvas.width = braidCanvas.height = 128;
  const bctx = braidCanvas.getContext('2d')!;
  bctx.fillStyle = '#6d7479';
  bctx.fillRect(0, 0, 128, 128);
  for (let d = 0; d < 2; d++) {
    for (let i = -128; i < 256; i += 16) {
      const g = bctx.createLinearGradient(0, 0, 128, 128);
      g.addColorStop(0, d ? '#e9edef' : '#c6ccd0');
      g.addColorStop(1, d ? '#b7bec3' : '#9aa2a8');
      bctx.strokeStyle = g;
      bctx.lineWidth = 6;
      bctx.beginPath();
      if (d) {
        bctx.moveTo(i, 0);
        bctx.lineTo(i + 128, 128);
      } else {
        bctx.moveTo(i + 128, 0);
        bctx.lineTo(i, 128);
      }
      bctx.stroke();
    }
  }
  const braidTex = new CanvasTexture(braidCanvas);
  braidTex.colorSpace = SRGBColorSpace;
  braidTex.wrapS = braidTex.wrapT = RepeatWrapping;
  braidTex.repeat.set(46, 3);
  braidTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const braidBump = braidTex.clone();
  braidBump.colorSpace = NoColorSpace;
  const braidMat = new MeshStandardMaterial({
    map: braidTex,
    bumpMap: braidBump,
    bumpScale: 2.2,
    metalness: 0.85,
    roughness: 0.36,
  });

  // Les éléments survolables : clé de la pièce -> meshes
  const parts = new Map<PartKey, Mesh[]>();
  const addPart = (k: PartKey, m: Mesh) => {
    m.userData.part = k;
    if (!parts.has(k)) parts.set(k, []);
    parts.get(k)!.push(m);
  };

  // ---------------------------------------------------------------- Boîtier
  const housing = new Group();
  const HOUSING_X = 1.25;
  const body = new Mesh(new RoundedBoxGeometry(1.3, 1.0, 2.9, 4, 0.1), housingMat);
  housing.add(body);
  addPart('connector', body);
  const latch = new Mesh(new RoundedBoxGeometry(0.7, 0.16, 0.5, 2, 0.05), housingMat);
  latch.position.set(0.05, 0.56, 0);
  housing.add(latch);
  addPart('connector', latch);
  const rib = new Mesh(new RoundedBoxGeometry(1.1, 0.12, 0.12, 2, 0.04), housingMat);
  rib.position.set(0, -0.2, 1.47);
  housing.add(rib);

  const cavityZ = [-1.0, -0.6, -0.2, 0.2, 0.6, 1.0];
  for (const z of cavityZ) {
    const cav = new Mesh(new BoxGeometry(0.04, 0.36, 0.26), cavityMat);
    cav.position.set(0.66, 0.02, z);
    housing.add(cav);
    const pin = new Mesh(new CylinderGeometry(0.035, 0.035, 0.34, 12), goldMat);
    pin.rotation.z = Math.PI / 2;
    pin.position.set(0.8, 0.02, z);
    housing.add(pin);
    addPart('connector', pin);
  }
  housing.position.x = HOUSING_X;
  root.add(housing);

  // ---------------------------------------------------------------- Fils
  const ringR = 0.2;
  const ring = Array.from({ length: 6 }, (_, k) => {
    const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
    return { y: Math.sin(a) * ringR, z: Math.cos(a) * ringR };
  }).sort((a, b) => a.z - b.z);

  const wireCurves: CatmullRomCurve3[] = [];
  const pulseMats: ShaderMaterial[] = [];
  const WIRE_R = 0.105;

  const pulseVertex = /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const pulseFragment = /* glsl */ `
    uniform float uTime;
    uniform float uOffset;
    uniform vec3 uColor;
    varying vec2 vUv;
    void main() {
      float p = fract(vUv.x * 1.4 - uTime * 0.35 + uOffset);
      float band = smoothstep(0.0, 0.05, p) * (1.0 - smoothstep(0.05, 0.22, p));
      float edge = 0.55 + 0.45 * sin(vUv.y * 6.2831);
      gl_FragColor = vec4(uColor * band * 1.6, band * edge);
    }
  `;

  cavityZ.forEach((z, i) => {
    const b = ring[i];
    const curve = new CatmullRomCurve3(
      [
        new Vector3(HOUSING_X - 0.6, 0.02, z),
        new Vector3(0.1, 0.02, z),
        new Vector3(-0.55, b.y * 0.5, z * 0.5 + b.z * 0.5),
        new Vector3(-1.25, b.y, b.z),
        new Vector3(-2.2, b.y, b.z),
        new Vector3(-3.3, b.y, b.z),
      ],
      false,
      'centripetal',
    );
    wireCurves.push(curve);
    const wire = new Mesh(new TubeGeometry(curve, 120, WIRE_R, 16, false), wireMats[i]);
    root.add(wire);

    const pulseMat = new ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uOffset: { value: i * 0.17 }, uColor: { value: accent.clone().lerp(new Color(0xffd6e4), 0.35) } },
      vertexShader: pulseVertex,
      fragmentShader: pulseFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    pulseMats.push(pulseMat);
    const pulse = new Mesh(new TubeGeometry(curve, 120, WIRE_R * 1.12, 16, false), pulseMat);
    pulse.renderOrder = 2;
    root.add(pulse);
  });

  // Repère d'identification (manchon blanc marqué « L1 »)
  const markerCanvas = document.createElement('canvas');
  markerCanvas.width = 256;
  markerCanvas.height = 64;
  const mctx = markerCanvas.getContext('2d')!;
  mctx.fillStyle = '#f7f5f0';
  mctx.fillRect(0, 0, 256, 64);
  mctx.fillStyle = '#0b1220';
  mctx.font = '600 40px "Geist Mono Variable", ui-monospace, monospace';
  mctx.textAlign = 'center';
  mctx.textBaseline = 'middle';
  for (let k = 0; k < 4; k++) mctx.fillText('L1', 32 + k * 64, 34);
  const markerTex = new CanvasTexture(markerCanvas);
  markerTex.colorSpace = SRGBColorSpace;
  const marker = new Mesh(
    new CylinderGeometry(0.15, 0.15, 0.34, 32, 1, false),
    new MeshStandardMaterial({ map: markerTex, roughness: 0.6 }),
  );
  marker.rotation.z = Math.PI / 2;
  marker.rotation.y = 0;
  marker.position.set(0.32, 0.02, 1.0);
  root.add(marker);
  addPart('marker', marker);

  // ---------------------------------------------------------------- Tresse
  const braidCurve = new CatmullRomCurve3(
    [
      new Vector3(-2.9, 0, 0),
      new Vector3(-4.2, 0, 0),
      new Vector3(-5.5, -0.12, 0.35),
      new Vector3(-6.8, -0.75, 1.1),
      new Vector3(-8.4, -1.9, 2.2),
    ],
    false,
    'centripetal',
  );
  const braid = new Mesh(new TubeGeometry(braidCurve, 220, 0.36, 36, false), braidMat);
  root.add(braid);
  addPart('braid', braid);

  // ---------------------------------------------------------------- Gaine thermorétractable
  const profile: Vector2[] = [];
  const L = 1.05;
  for (let s = 0; s <= 40; s++) {
    const t = s / 40;
    const shoulder = Math.min(1, Math.min(t, 1 - t) / 0.16);
    const eased = Math.sin((shoulder * Math.PI) / 2);
    profile.push(new Vector2(0.37 + eased * 0.06, t * L));
  }
  const sleeveGeo = new LatheGeometry(profile, 48);
  sleeveGeo.rotateZ(Math.PI / 2);
  const sleeve = new Mesh(sleeveGeo, sleeveMat);
  sleeve.position.x = -2.45;
  root.add(sleeve);
  addPart('sleeve', sleeve);

  const ferrule = new Mesh(new TorusGeometry(0.4, 0.03, 12, 48), tinMat);
  ferrule.rotation.y = Math.PI / 2;
  ferrule.position.x = -2.43;
  root.add(ferrule);

  // ---------------------------------------------------------------- Contact serti en lévitation
  const contact = new Group();
  const stub = new Mesh(new CylinderGeometry(WIRE_R, WIRE_R, 0.9, 20), wireMats[1]);
  stub.rotation.z = Math.PI / 2;
  stub.position.x = -0.8;
  contact.add(stub);
  for (let k = 0; k < 7; k++) {
    const a = (k / 6) * Math.PI * 2;
    const r = k === 6 ? 0 : 0.05;
    const strand = new Mesh(new CylinderGeometry(0.024, 0.024, 0.34, 8), copperMat);
    strand.rotation.z = Math.PI / 2;
    strand.position.set(-0.2, Math.sin(a) * r, Math.cos(a) * r);
    contact.add(strand);
  }
  const wings = new Mesh(new CylinderGeometry(0.135, 0.135, 0.22, 20, 1, true, 0, Math.PI * 1.6), tinMat);
  wings.rotation.z = Math.PI / 2;
  wings.position.x = -0.42;
  contact.add(wings);
  const barrel = new Mesh(new CylinderGeometry(0.095, 0.095, 0.32, 20), tinMat);
  barrel.rotation.z = Math.PI / 2;
  barrel.scale.set(1, 1, 0.82);
  barrel.position.x = -0.06;
  contact.add(barrel);
  const box = new Mesh(new RoundedBoxGeometry(0.62, 0.2, 0.2, 2, 0.03), tinMat);
  box.position.x = 0.42;
  contact.add(box);
  const spring = new Mesh(new BoxGeometry(0.3, 0.05, 0.16), tinMat);
  spring.position.set(0.45, 0.12, 0);
  spring.rotation.z = -0.12;
  contact.add(spring);
  contact.traverse((o) => {
    if ((o as Mesh).isMesh) addPart('contact', o as Mesh);
  });
  contact.position.set(0.45, 1.7, -0.15);
  contact.scale.setScalar(1.6);
  contact.rotation.set(0.2, -0.5, 0.25);
  root.add(contact);

  // ---------------------------------------------------------------- Ombre portée douce
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 128;
  const sctx = shadowCanvas.getContext('2d')!;
  const grad = sctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(11,18,32,0.5)');
  grad.addColorStop(1, 'rgba(11,18,32,0)');
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 128, 128);
  const shadow = new Mesh(
    new PlaneGeometry(7, 3.2),
    new MeshBasicMaterial({ map: new CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0.6, -1.3, 0.2);
  scene.add(shadow);

  // ---------------------------------------------------------------- Points d'intérêt
  const anchors: Record<PartKey, Object3D> = {
    connector: new Object3D(),
    contact: new Object3D(),
    marker: new Object3D(),
    sleeve: new Object3D(),
    braid: new Object3D(),
  };
  anchors.connector.position.set(0.1, 0.6, -0.6);
  housing.add(anchors.connector);
  anchors.contact.position.set(0.4, 0.14, 0);
  contact.add(anchors.contact);
  anchors.marker.position.set(0.32, 0.18, 1.0);
  root.add(anchors.marker);
  anchors.sleeve.position.set(-2.0, 0.45, 0);
  root.add(anchors.sleeve);
  anchors.braid.position.copy(braidCurve.getPoint(0.36)).add(new Vector3(0, 0.37, 0));
  root.add(anchors.braid);

  // ---------------------------------------------------------------- Interaction
  const state = {
    yaw: -0.78,
    pitch: 0.14,
    targetYaw: -0.78,
    targetPitch: 0.14,
    dragging: false,
    lastX: 0,
    lastY: 0,
    velocity: 0,
    pointer: new Vector2(0, 0),
    pointerSmoothed: new Vector2(0, 0),
    active: null as PartKey | null,
    hoverFromCanvas: null as PartKey | null,
    scroll: 0,
    visible: true,
    time: 0,
  };
  const highlight = new Map<PartKey, number>();
  (Object.keys(anchors) as PartKey[]).forEach((k) => highlight.set(k, 0));

  const raycaster = new Raycaster();
  const ndc = new Vector2();
  const pickables = [...parts.values()].flat();

  const setActive = (k: PartKey | null) => {
    state.active = k;
    hotspots.forEach((el, key) => el.classList.toggle('is-active', key === k));
    container.classList.toggle('has-active', k !== null);
  };

  const touchOnly = window.matchMedia('(hover: none)').matches;
  hotspots.forEach((el, key) => {
    // Sur écran tactile : un premier appui affiche le nom de la pièce, le second ouvre la gamme
    el.addEventListener('click', (e) => {
      if (touchOnly && state.active !== key) {
        e.preventDefault();
        setActive(key);
      }
    });
    el.addEventListener('pointerenter', (e) => e.pointerType !== 'touch' && setActive(key));
    el.addEventListener('pointerleave', (e) => e.pointerType !== 'touch' && setActive(state.hoverFromCanvas));
    el.addEventListener('focus', () => el.matches(':focus-visible') && setActive(key));
    el.addEventListener('blur', () => setActive(null));
  });

  const onPointerDown = (e: PointerEvent) => {
    state.dragging = true;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    container.classList.add('is-dragging');
  };
  const onPointerMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    state.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    if (state.dragging) {
      const dx = e.clientX - state.lastX;
      const dy = e.clientY - state.lastY;
      state.lastX = e.clientX;
      state.lastY = e.clientY;
      state.targetYaw += dx * 0.008;
      state.targetPitch = MathUtils.clamp(state.targetPitch + dy * 0.004, -0.35, 0.55);
      state.velocity = dx * 0.008;
      return;
    }
    if (e.pointerType === 'mouse') {
      ndc.copy(state.pointer);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(pickables, false)[0];
      const k = (hit?.object.userData.part as PartKey | undefined) ?? null;
      if (k !== state.hoverFromCanvas) {
        state.hoverFromCanvas = k;
        setActive(k);
        canvas.style.cursor = k ? 'pointer' : 'grab';
      }
    }
  };
  const onPointerUp = (e: PointerEvent) => {
    state.dragging = false;
    container.classList.remove('is-dragging');
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  };
  const onClick = () => {
    if (state.hoverFromCanvas && Math.abs(state.velocity) < 0.01) {
      const link = hotspots.get(state.hoverFromCanvas) as HTMLAnchorElement | undefined;
      if (link?.href) window.location.href = link.href;
    }
  };
  const onLeave = () => {
    state.pointer.set(0, 0);
    if (state.hoverFromCanvas) {
      state.hoverFromCanvas = null;
      setActive(null);
    }
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('click', onClick);

  // ---------------------------------------------------------------- Dimensionnement
  let width = 0;
  let height = 0;
  const resize = () => {
    const r = container.getBoundingClientRect();
    width = Math.max(1, Math.round(r.width));
    height = Math.max(1, Math.round(r.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Recadrage : sur écran étroit on recule la caméra pour garder le connecteur visible
    const narrow = camera.aspect < 1;
    camera.fov = narrow ? 38 : 30;
    cameraBase.set(narrow ? 0.9 : 0.2, 1.9, narrow ? 12.5 : 10.5);
    target.set(narrow ? 0.2 : -0.75, 0, 0);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  const onScroll = () => {
    const r = container.getBoundingClientRect();
    state.scroll = MathUtils.clamp(-r.top / Math.max(1, r.height), 0, 1);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  const io = new IntersectionObserver(([entry]) => {
    state.visible = entry.isIntersecting;
    if (state.visible) loop();
  });
  io.observe(container);
  const onVisibility = () => {
    if (!document.hidden && state.visible) loop();
  };
  document.addEventListener('visibilitychange', onVisibility);

  // ---------------------------------------------------------------- Boucle de rendu
  const tmp = new Vector3();
  let raf = 0;
  let last = performance.now();
  let first = true;

  function updateHotspots() {
    (Object.keys(anchors) as PartKey[]).forEach((k) => {
      const el = hotspots.get(k);
      if (!el) return;
      anchors[k].getWorldPosition(tmp);
      tmp.project(camera);
      const x = (tmp.x * 0.5 + 0.5) * width;
      const y = (-tmp.y * 0.5 + 0.5) * height;
      const visible = tmp.z < 1 && x > 8 && x < width - 8 && y > 8 && y < height - 8;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.classList.toggle('is-hidden', !visible);
    });
  }

  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!reducedMotion) state.time += dt;

    if (!state.dragging) {
      // inertie puis léger balancement automatique
      state.velocity *= 0.92;
      state.targetYaw += state.velocity;
      if (!reducedMotion) state.targetYaw += Math.sin(state.time * 0.35) * 0.0009;
    }
    state.yaw = MathUtils.damp(state.yaw, state.targetYaw + state.scroll * 0.6, 6, dt);
    state.pitch = MathUtils.damp(state.pitch, state.targetPitch + state.scroll * 0.25, 6, dt);
    root.rotation.set(state.pitch, state.yaw, 0);

    state.pointerSmoothed.lerp(state.pointer, 1 - Math.exp(-dt * 3));
    camera.position.set(
      cameraBase.x + state.pointerSmoothed.x * 0.45,
      cameraBase.y + state.pointerSmoothed.y * 0.3,
      cameraBase.z,
    );
    camera.lookAt(target);

    // lévitation du contact
    contact.position.y = 1.7 + Math.sin(state.time * 1.3) * 0.08;
    contact.rotation.x = 0.2 + Math.sin(state.time * 0.9) * 0.08;

    pulseMats.forEach((m) => (m.uniforms.uTime.value = state.time));

    // surbrillance des pièces survolées
    parts.forEach((meshes, k) => {
      const targetH = state.active === k ? 1 : 0;
      const h = MathUtils.damp(highlight.get(k) ?? 0, targetH, 10, dt);
      highlight.set(k, h);
      meshes.forEach((m) => {
        const mat = m.material as MeshStandardMaterial;
        if (!mat.emissive) return;
        if (!m.userData.baseEmissive) m.userData.baseEmissive = mat.emissive.clone();
        mat.emissive.copy(m.userData.baseEmissive).lerp(accent, h * 0.35);
      });
    });

    renderer.render(scene, camera);
    updateHotspots();

    if (first) {
      first = false;
      opts.onReady?.();
    }
  }

  // Les matériaux partagés sont clonés par pièce pour une surbrillance indépendante
  parts.forEach((meshes) =>
    meshes.forEach((m) => {
      m.material = (m.material as MeshStandardMaterial).clone();
    }),
  );

  function loop() {
    cancelAnimationFrame(raf);
    const tick = (now: number) => {
      frame(now);
      if (state.visible && !document.hidden) raf = requestAnimationFrame(tick);
    };
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
  loop();

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', onVisibility);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerUp);
    canvas.removeEventListener('pointerleave', onLeave);
    canvas.removeEventListener('click', onClick);
    scene.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh) {
        m.geometry.dispose();
        const mat = m.material as MeshStandardMaterial;
        mat.map?.dispose();
        mat.dispose();
      }
    });
    envTexture.dispose();
    pmrem.dispose();
    renderer.dispose();
  };
}
