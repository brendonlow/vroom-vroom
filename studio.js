/* 3D paint-and-trim configurator ("studio"): a solid, painted model of one car, built
   parametrically from its published dimensions plus a hand-drawn profile in STUDIO below.
   window.startStudio(container, car, build, opts) -> controller
   build = { paint: { name, hex, finish }, look: STUDIO[id].variants[name] } */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

// Per-car configurator data. Profiles are fractions of overall height against u (0 = rear bumper, 1 = front bumper).
export const STUDIO = {
  "geely-ex2": {
    tyre: { R: 0.322, w: 0.215, rim: 0.203 }, // 215/55 R16
    frontOverhang: 0.775,
    top: [[0, 0.6], [0.02, 0.79], [0.05, 0.915], [0.09, 0.968], [0.2, 0.993], [0.4, 1], [0.52, 0.99], [0.585, 0.962], [0.66, 0.855], [0.75, 0.73], [0.8, 0.69], [0.88, 0.655], [0.94, 0.615], [0.975, 0.54], [1, 0.4]],
    bottom: [[0, 0.24], [0.03, 0.14], [0.08, 0.105], [0.92, 0.105], [0.97, 0.14], [1, 0.25]],
    belt: [[0, 0.62], [0.08, 0.66], [0.3, 0.65], [0.6, 0.628], [0.75, 0.6], [1, 0.59]],
    tumble: 0.3,
    // side glass runs from the rear quarter to the A-pillar; windscreen from the header to the cowl
    dlo: { rear: 0.075, aPillar: 0.705, header: 0.585, roofRail: 0.085 },
    windscreen: [0.592, 0.748], backlight: [0.006, 0.07],
    pillars: [[0.462, 0.484], [0.215, 0.24]], louvre: [0.075, 0.125],
    variants: {
      Complete: { wheel: "cover", roof: "body", wheelLabel: "16-inch steel wheels with aero covers", roofLabel: "Body-colour roof and pillars", extras: [] },
      Inspire: { wheel: "alloy", roof: "black", wheelLabel: "16-inch two-tone alloy wheels", roofLabel: "Contrast black roof and pillars", extras: ["Power tailgate", "Rain-sensing wipers", "Skyline White interior option"] },
    },
    interiors: [{ name: "Horizon Grey", hex: "#6c7075" }, { name: "Skyline White", hex: "#e9e6df", only: ["Inspire"] }],
    sources: ["https://www.carexpert.com.au/car-news/2026-geely-ex2-price-and-specs", "https://thebeep.com.au/car-news/2026-geely-ex2-price-australia"],
  },
};

// Catmull-Rom (Hermite) through [u, value] knots, clamped at the ends
function curve(knots) {
  return u => {
    if (u <= knots[0][0]) return knots[0][1];
    const n = knots.length; if (u >= knots[n - 1][0]) return knots[n - 1][1];
    let i = 0; while (knots[i + 1][0] < u) i++;
    const p0 = knots[Math.max(0, i - 1)], p1 = knots[i], p2 = knots[i + 1], p3 = knots[Math.min(n - 1, i + 2)];
    const h = p2[0] - p1[0], t = (u - p1[0]) / h;
    const m1 = (p2[1] - p0[1]) / (p2[0] - p0[0]) * h, m2 = (p3[1] - p1[1]) / (p3[0] - p1[0]) * h;
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2[1] + (t3 - t2) * m2;
  };
}
const S = (t, e) => Math.sign(t) * Math.pow(Math.abs(t), e);
const range = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + (b - a) * i / n);

const FINISH = {
  solid: { metalness: 0.0, roughness: 0.3 },
  pearl: { metalness: 0.3, roughness: 0.28 },
  metallic: { metalness: 0.65, roughness: 0.28 },
};

export function startStudio(container, car, build, opts = {}) {
  const cfg = STUDIO[car.id];
  const L = car.length / 1000, W = car.width / 1000, H = car.height / 1000, WB = car.wheelbase / 1000;
  const { R, w: TW, rim: RR } = cfg.tyre;
  const XF = L / 2 - cfg.frontOverhang, XR = XF - WB; // axle positions
  const topF = curve(cfg.top), botF = curve(cfg.bottom), beltF = curve(cfg.belt);
  const xOf = u => -L / 2 + u * L, uOfX = x => (x + L / 2) / L;
  const top = u => topF(u) * H, bot = u => botF(u) * H, belt = u => beltF(u) * H;
  const plan = u => (u < 0.12 ? 1 - 0.2 * (1 - u / 0.12) ** 2 : 1) * (u > 0.84 ? 1 - 0.3 * (1 - (1 - u) / 0.16) ** 2 : 1);
  const NEX = 4.2; // superellipse exponent of the cross-section
  // half width at height y: plan taper, tumblehome above the beltline, tuck under the sills
  const hw = (u, y) => {
    let k = W / 2 * plan(u);
    const b = belt(u), t = top(u), lo = bot(u);
    if (y > b) k *= 1 - cfg.tumble * Math.pow(Math.min(1, (y - b) / Math.max(0.05, t - b)), 1.6);
    const tuck = lo + 0.12; if (y < tuck) k *= 1 - 0.05 * (tuck - y) / 0.12;
    return k;
  };
  const RA = R + 0.05, ZIN = W / 2 - 0.262;
  const inArch = (x, y) => [XF, XR].some(xw => Math.hypot(x - xw, y - R) < RA);
  const sec = u => { const lo = bot(u), t = top(u); return { yc: (lo + t) / 2, hh: (t - lo) / 2 }; };
  // point on the body skin at station u, ring angle th (0 = right side, PI/2 = top, PI = left side)
  const skin = (u, th, carve = true) => {
    const { yc, hh } = sec(u); const v = Math.sin(th); const y = yc + hh * v; let z = hw(u, y) * Math.sign(Math.cos(th)) * Math.pow(1 - Math.pow(Math.abs(v), NEX), 1 / NEX);
    if (carve && inArch(xOf(u), y)) z = Math.sign(z) * Math.min(Math.abs(z), ZIN);
    return new THREE.Vector3(xOf(u), y, z);
  };
  // ring angle (right side) where the skin is at height y
  const thAt = (u, y) => { const { yc, hh } = sec(u); return Math.asin(Math.max(-1, Math.min(1, (y - yc) / hh))); };

  // ---------- renderer ----------
  const cw = container.clientWidth || 800, ch = container.clientHeight || 500;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!opts.preserve });
  renderer.setPixelRatio(Math.min(matchMedia("(pointer: coarse)").matches ? 1.5 : 2, window.devicePixelRatio || 1)); renderer.setSize(cw, ch);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.domElement.className = "studio-canvas"; container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environment = envTex; scene.environmentIntensity = 0.95;
  const camera = new THREE.PerspectiveCamera(30, cw / ch, 0.1, 60);
  const target = new THREE.Vector3(0, H * 0.42, 0);
  const VIEWS = { front: [0.82, 0.26, 0.72], side: [0.02, 0.1, 1], rear: [-0.82, 0.3, 0.72], top: [0.001, 1, 0.12], nose: [1, 0.14, 0.05] };
  const dist = () => L * 1.9 * Math.max(1, 1.3 / camera.aspect); // back off on tall, narrow screens
  const viewPos = k => new THREE.Vector3(...VIEWS[k]).normalize().multiplyScalar(dist()).add(target);
  camera.position.copy(viewPos(opts.view || "front"));
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(target); controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false;
  controls.minDistance = L * 0.9; controls.maxDistance = L * 4.5; controls.maxPolarAngle = Math.PI * 0.49;
  controls.autoRotate = opts.autoRotate !== false; controls.autoRotateSpeed = 0.7;

  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(2.5, 6, 3.5); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -3.5, right: 3.5, top: 3.5, bottom: -3.5, near: 1, far: 15 }); key.shadow.radius = 5; key.shadow.bias = -0.0005; key.shadow.normalBias = 0.02;
  scene.add(key); scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d6d0, 0.35));

  // floor: soft shadow catcher plus a contact shadow under the car
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.14 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const cv = document.createElement("canvas"); cv.width = cv.height = 256; const cx = cv.getContext("2d");
  const grd = cx.createRadialGradient(128, 128, 10, 128, 128, 128); grd.addColorStop(0, "rgba(0,0,0,0.62)"); grd.addColorStop(0.55, "rgba(0,0,0,0.32)"); grd.addColorStop(1, "rgba(0,0,0,0)"); cx.fillStyle = grd; cx.fillRect(0, 0, 256, 256);
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(L * 1.18, W * 1.32), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false })); contact.rotation.x = -Math.PI / 2; contact.position.y = 0.002; scene.add(contact);

  // ---------- materials ----------
  const paint = new THREE.MeshPhysicalMaterial({ color: build.paint.hex, vertexColors: true, clearcoat: 1, clearcoatRoughness: 0.05, ...FINISH[build.paint.finish || "metallic"] });
  const black = new THREE.MeshPhysicalMaterial({ color: 0x0c0d0e, roughness: 0.2, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.04 });
  const glassM = new THREE.MeshPhysicalMaterial({ color: 0x07090b, roughness: 0.05, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.03, envMapIntensity: 0.3 });
  const trimM = new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.72, metalness: 0 });
  const seamM = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 });
  const silverM = new THREE.MeshStandardMaterial({ color: 0xd4d7da, roughness: 0.25, metalness: 0.9 });
  const tyreM = new THREE.MeshStandardMaterial({ color: 0x161718, roughness: 0.88 });
  const lampM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xeaf4ff, emissiveIntensity: 1.4, roughness: 0.2 });
  const tailM = new THREE.MeshStandardMaterial({ color: 0x5a0008, emissive: 0xd0101e, emissiveIntensity: 0.9, roughness: 0.2 });
  const lensM = new THREE.MeshPhysicalMaterial({ color: 0x15181b, roughness: 0.08, metalness: 0.3, clearcoat: 1 });
  // patches and decals are generated without caring about winding, so render both faces
  [black, glassM, trimM, seamM, silverM, tyreM, lampM, tailM, lensM].forEach(m => { m.side = THREE.DoubleSide; });

  const carG = new THREE.Group(); scene.add(carG);
  const shade = m => { m.castShadow = true; m.receiveShadow = true; return m; };

  // ---------- body: lofted superellipse sections; normals taken before the wheel arches are carved ----------
  {
    const us = range(0, 1, 300), M = 160, pos = [], carved = [], idx = [];
    us.forEach(u => { for (let j = 0; j < M; j++) { const th = j / M * Math.PI * 2; const p = skin(u, th, false), q = skin(u, th, true); pos.push(p.x, p.y, p.z); carved.push(q.x, q.y, q.z); } });
    for (let i = 0; i < us.length - 1; i++) for (let j = 0; j < M; j++) { const a = i * M + j, b = i * M + (j + 1) % M, c = a + M, d = b + M; idx.push(a, c, d, a, d, b); }
    for (const [i, rear] of [[0, true], [us.length - 1, false]]) { // flat end caps
      let cy = 0; for (let j = 0; j < M; j++) cy += pos[(i * M + j) * 3 + 1];
      const c = pos.length / 3; pos.push(pos[i * M * 3], cy / M, 0); carved.push(pos[i * M * 3], cy / M, 0);
      for (let j = 0; j < M; j++) { const a = i * M + j, b = i * M + (j + 1) % M; rear ? idx.push(c, a, b) : idx.push(c, b, a); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    // the arch walls point inwards so they read as shadowed wells
    const col = new Float32Array(pos.length).fill(1); for (let v = 0; v < pos.length / 3; v++) if (Math.abs(carved[v * 3 + 2] - pos[v * 3 + 2]) > 1e-5) col.fill(0.03, v * 3, v * 3 + 3);
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setAttribute("position", new THREE.Float32BufferAttribute(carved, 3));
    carG.add(shade(new THREE.Mesh(g, paint)));
  }

  // ---------- patches laid on the skin: u range x ring-angle range ----------
  // th0/th1 are numbers or functions of u; out = offset along the outward normal
  function patch(u0, u1, th0, th1, mat, { nu = 40, nv = 8, out = 0.003, mirror = false } = {}) {
    const f = v => typeof v === "function" ? v : () => v;
    const T0 = f(th0), T1 = f(th1), g = new THREE.Group();
    for (const side of mirror ? [1, -1] : [1]) {
      const pos = [];
      for (let i = 0; i <= nv; i++) for (let k = 0; k <= nu; k++) {
        const u = u0 + (u1 - u0) * k / nu; let th = T0(u) + (T1(u) - T0(u)) * i / nv; if (side < 0) th = Math.PI - th;
        const p = skin(u, th), du = 0.0015, dt = 0.004;
        const a = skin(Math.min(1, u + du), th).sub(skin(Math.max(0, u - du), th)), b = skin(u, th + dt).sub(skin(u, th - dt));
        const n = a.cross(b).normalize(); const { yc } = sec(u); if (n.dot(new THREE.Vector3(0, p.y - yc, p.z)) < 0) n.negate();
        p.addScaledVector(n, out); pos.push(p.x, p.y, p.z);
      }
      const idx = []; for (let i = 0; i < nv; i++) for (let k = 0; k < nu; k++) { const a = i * (nu + 1) + k, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, d, a, d, c); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      g.add(shade(new THREE.Mesh(geo, mat)));
    }
    carG.add(g); return g;
  }
  // same, but bounded by heights on the right-hand side (mirrored to the left)
  const sideBand = (u0, u1, y0, y1, mat, o = {}) => { const f = v => typeof v === "function" ? v : () => v; const Y0 = f(y0), Y1 = f(y1); return patch(u0, u1, u => thAt(u, Y0(u)), u => thAt(u, Y1(u)), mat, { mirror: true, ...o }); };

  // ---------- glasshouse ----------
  const D = cfg.dlo;
  const winTop = u => { // top edge of the side glass: roof rail, then down the A-pillar
    const rail = top(u) - D.roofRail;
    if (u <= D.header) return rail;
    const k = Math.min(1, (u - D.header) / (D.aPillar - D.header)); return rail + (belt(u) + 0.02 - rail) * k;
  };
  const winBot = u => belt(u) + 0.004;
  const glassBot = u => winBot(u) + (winTop(u) - winBot(u)) * Math.max(0, 1 - (u - D.rear) / 0.07); // raked rear edge of the quarter glass
  sideBand(D.rear, D.aPillar, glassBot, winTop, glassM, { nu: 140, nv: 8, out: 0.006 });
  sideBand(D.rear + 0.06, D.aPillar - 0.004, u => winBot(u) - 0.012, u => winBot(u) + 0.01, trimM, { nu: 80, nv: 2, out: 0.008 }); // beltline seal
  // windscreen and backlight span the top of the sections between the pillars
  const wsEdge = u => thAt(u, Math.min(top(u) - 0.035, winTop(u) + 0.045));
  patch(cfg.windscreen[0], cfg.windscreen[1], wsEdge, u => Math.PI - wsEdge(u), glassM, { nu: 30, nv: 40, out: 0.004 });
  patch(cfg.backlight[0], cfg.backlight[1], u => thAt(u, Math.max(belt(u) + 0.03, top(u) - 0.3)), u => Math.PI - thAt(u, Math.max(belt(u) + 0.03, top(u) - 0.3)), glassM, { nu: 16, nv: 40, out: 0.004 });
  // B and C pillars, rear-quarter louvre
  for (const [a, b] of cfg.pillars) sideBand(a, b, winBot, winTop, trimM, { nu: 4, nv: 8, out: 0.011 });
  sideBand(cfg.louvre[0], cfg.louvre[1], u => glassBot(u) - 0.01, winTop, trimM, { nu: 10, nv: 8, out: 0.011 });
  for (let i = 1; i <= 4; i++) sideBand(cfg.louvre[0] + 0.006, cfg.louvre[1] - 0.006, u => Math.max(glassBot(u), winBot(u) + i * 0.06), u => Math.max(glassBot(u), winBot(u) + i * 0.06) + 0.008, silverM, { nu: 8, nv: 1, out: 0.014 });
  // contrast roof (Inspire): roof panel plus A-pillars
  const roofBlack = new THREE.Group(); carG.add(roofBlack);
  const railTh = u => thAt(u, winTop(u) + 0.006);
  roofBlack.add(patch(D.rear + 0.02, cfg.windscreen[0] + 0.004, railTh, u => Math.PI - railTh(u), black, { nu: 90, nv: 50, out: 0.0035 }));
  roofBlack.add(patch(D.header - 0.01, D.aPillar, railTh, wsEdge, black, { nu: 30, nv: 6, out: 0.0035, mirror: true }));

  // ---------- trim ----------
  // wheel-arch mouldings: ring segments around each wheel at the skin
  for (const xw of [XF, XR]) {
    const pts = (r, a) => [uOfX(xw + Math.cos(a) * r), R + Math.sin(a) * r];
    for (const side of [1]) {
      const rows = range(RA - 0.03, RA + 0.05, 3).map(r => range(-0.32, Math.PI + 0.32, 60).map(a => pts(r, a)));
      const g = new THREE.Group();
      for (const s of [1, -1]) {
        const pos = []; rows.forEach(row => row.forEach(([u, y]) => { const th = thAt(u, y); const p = skin(u, s > 0 ? th : Math.PI - th, false); p.z += Math.sign(p.z) * 0.006; pos.push(p.x, p.y, p.z); }));
        const n = rows[0].length, idx = []; for (let i = 0; i < rows.length - 1; i++) for (let k = 0; k < n - 1; k++) { const a = i * n + k; idx.push(a, a + 1, a + n + 1, a, a + n + 1, a + n); }
        const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals(); g.add(shade(new THREE.Mesh(geo, trimM)));
      }
      carG.add(g);
    }
  }
  // lower door cladding with a bright accent line
  const cl0 = uOfX(XR + RA + 0.02), cl1 = uOfX(XF - RA - 0.02), sill = bot(0.5);
  sideBand(cl0, cl1, sill + 0.02, sill + 0.14, trimM, { nu: 40, nv: 4 });
  sideBand(cl0 + 0.03, cl1 - 0.04, sill + 0.112, sill + 0.121, silverM, { nu: 40, nv: 1, out: 0.006 });
  // door shut lines and flush handles
  for (const u of [0.705, 0.475, 0.235]) sideBand(u - 0.0008, u + 0.0008, sill + 0.145, u => belt(u) - 0.004, seamM, { nu: 1, nv: 24, out: 0.0016 });
  for (const u of [0.645, 0.415]) sideBand(u - 0.032, u, u => belt(u) - 0.085, u => belt(u) - 0.062, trimM, { nu: 6, nv: 2, out: 0.004 });
  // headlights: slim smoked lens on each nose corner with an LED strip along its top
  const hl0 = u => 0.32 + (u - 0.905) * 3.6;
  patch(0.905, 0.985, hl0, u => hl0(u) + 0.42, lensM, { nu: 30, nv: 8, out: 0.003, mirror: true });
  patch(0.908, 0.982, u => hl0(u) + 0.31, u => hl0(u) + 0.38, lampM, { nu: 30, nv: 2, out: 0.005, mirror: true });
  // vertical daytime running lights low on the bumper corners
  sideBand(0.975, 0.986, 0.3 * H, 0.43 * H, lampM, { nu: 3, nv: 6, out: 0.004 });

  // flat decals on the front and rear end caps
  const capDecal = (front, y0, y1, halfW, mat, r = 0.02, z = 0.002) => {
    const s = new THREE.Shape(); const w = halfW, hgt = y1 - y0; s.moveTo(-w + r, 0); s.lineTo(w - r, 0); s.quadraticCurveTo(w, 0, w, r); s.lineTo(w, hgt - r); s.quadraticCurveTo(w, hgt, w - r, hgt); s.lineTo(-w + r, hgt); s.quadraticCurveTo(-w, hgt, -w, hgt - r); s.lineTo(-w, r); s.quadraticCurveTo(-w, 0, -w + r, 0);
    const m = new THREE.Mesh(new THREE.ShapeGeometry(s, 6), mat); m.rotation.y = front ? Math.PI / 2 : -Math.PI / 2; m.position.set(front ? L / 2 + z : -L / 2 - z, y0, 0); carG.add(m); return m;
  };
  const capHalf = (u, y) => skin(u, thAt(u, y), false).z;
  capDecal(true, bot(1) + 0.015, bot(1) + 0.14, capHalf(1, bot(1) + 0.08) * 0.72, trimM, 0.04);
  capDecal(false, bot(0) + 0.01, bot(0) + 0.1, capHalf(0, bot(0) + 0.05) * 0.8, trimM, 0.04);
  const tailY = top(0) - 0.07;
  capDecal(false, tailY - 0.03, tailY + 0.03, capHalf(0, tailY) * 0.95, lensM, 0.02, 0.002);
  capDecal(false, tailY - 0.013, tailY + 0.013, capHalf(0, tailY) * 0.92, tailM, 0.01, 0.003);
  // lettering
  const word = (text, front, y, wM) => {
    const c = document.createElement("canvas"); c.width = 512; c.height = 96; const x = c.getContext("2d");
    x.fillStyle = "#2b2d30"; x.font = "700 64px 'Helvetica Neue', Arial, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.letterSpacing = "18px"; x.fillText(text, 256, 50);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(wM, wM * 96 / 512), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.3, metalness: 0.6 }));
    m.rotation.y = front ? Math.PI / 2 : -Math.PI / 2; m.position.set(front ? L / 2 + 0.004 : -L / 2 - 0.004, y, 0); carG.add(m);
  };
  word("GEELY", true, bot(1) + 0.19, 0.3); word("GEELY", false, tailY - 0.1, 0.3); word("EX2", false, tailY - 0.17, 0.16);

  // mirrors: body-colour caps on black stalks
  for (const side of [1, -1]) {
    const u = 0.69, y = belt(u) + 0.075, z = skin(u, thAt(u, belt(u)), false).z * side;
    const capGeo = new THREE.SphereGeometry(1, 28, 16); capGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(capGeo.attributes.position.count * 3).fill(1), 3)); // paint uses vertex colours
    const cap = shade(new THREE.Mesh(capGeo, paint)); cap.scale.set(0.1, 0.058, 0.1); cap.position.set(xOf(u) - 0.03, y, z + side * 0.13); carG.add(cap);
    const stalk = shade(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.03, 0.08), trimM)); stalk.position.set(xOf(u) + 0.0, y - 0.03, z + side * 0.04); carG.add(stalk);
    const rep = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.01, 0.1), lampM); rep.position.set(xOf(u) + 0.065, y - 0.012, z + side * 0.15); carG.add(rep);
  }

  // ---------- wheels ----------
  const tyreGeo = new THREE.LatheGeometry([[RR, -TW / 2 + 0.012], [R - 0.045, -TW / 2], [R - 0.012, -TW / 2 + 0.014], [R, -TW / 2 + 0.045], [R, TW / 2 - 0.045], [R - 0.012, TW / 2 - 0.014], [R - 0.045, TW / 2], [RR, TW / 2 - 0.012]].map(([r, y]) => new THREE.Vector2(r, y)), 56);
  tyreGeo.rotateX(Math.PI / 2);
  const barrel = new THREE.CylinderGeometry(RR, RR, TW - 0.03, 40, 1, true); barrel.rotateX(Math.PI / 2);
  const darkM = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.8, side: THREE.DoubleSide });
  const alloyFaceM = new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: 0.22, metalness: 0.95 });
  const alloyDarkM = new THREE.MeshStandardMaterial({ color: 0x1c1d1f, roughness: 0.35, metalness: 0.6 });
  const coverM = new THREE.MeshPhysicalMaterial({ color: 0xaeb2b6, roughness: 0.38, metalness: 0.55, clearcoat: 0.6 });
  function wheelFace(kind) {
    const g = new THREE.Group(); const zf = TW / 2 - 0.03;
    if (kind === "alloy") {
      const back = new THREE.Mesh(new THREE.CircleGeometry(RR - 0.004, 40), alloyDarkM); back.position.z = zf - 0.03; g.add(back);
      const lip = new THREE.Mesh(new THREE.RingGeometry(RR - 0.016, RR, 48), alloyFaceM); lip.position.z = zf; g.add(lip);
      for (let i = 0; i < 5; i++) {
        const s = new THREE.Shape(); s.moveTo(-0.022, 0.055); s.lineTo(0.022, 0.055); s.lineTo(0.05, RR - 0.014); s.lineTo(-0.05, RR - 0.014); s.closePath();
        const sg = new THREE.ExtrudeGeometry(s, { depth: 0.024, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2 });
        const sp = shade(new THREE.Mesh(sg, [alloyFaceM, alloyDarkM])); sp.rotation.z = i / 5 * Math.PI * 2; sp.position.z = zf - 0.026; g.add(sp);
        // black insert down the middle of each spoke for the two-tone look
        const ins = new THREE.Mesh(new THREE.PlaneGeometry(0.018, RR - 0.09), alloyDarkM); ins.position.set(0, 0.055 + (RR - 0.09) / 2 + 0.01, 0); const holder = new THREE.Group(); holder.rotation.z = i / 5 * Math.PI * 2; holder.position.z = zf + 0.0025; holder.add(ins); g.add(holder);
      }
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.066, 0.03, 32), alloyFaceM); hub.rotation.x = Math.PI / 2; hub.position.z = zf - 0.01; g.add(hub);
      const capC = new THREE.Mesh(new THREE.CircleGeometry(0.038, 32), alloyDarkM); capC.position.z = zf + 0.0055; g.add(capC);
    } else {
      // full aero wheel cover over a steel wheel
      const a0 = 0.32, rs = RR / Math.sin(a0), dz = 0.18;
      const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 8, 0, Math.PI * 2, 0, a0), coverM); dome.rotation.x = Math.PI / 2; dome.scale.set(rs, dz, rs); dome.position.z = zf - dz * Math.cos(a0); g.add(shade(dome));
      const zs = zf - dz * Math.cos(a0) + dz;
      for (let i = 0; i < 10; i++) { const sl = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 0.075), darkM); const h = new THREE.Group(); h.rotation.z = i / 10 * Math.PI * 2 + 0.3; sl.position.set(0, RR - 0.06, 0); sl.rotation.z = 0.35; h.add(sl); h.position.z = zs - 0.002; g.add(h); }
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.106, 48), darkM); ring.position.z = zs + 0.001; g.add(ring);
      const capC = new THREE.Mesh(new THREE.CircleGeometry(0.045, 32), alloyDarkM); capC.position.z = zs + 0.002; g.add(capC);
    }
    return g;
  }
  const wheels = [];
  for (const xw of [XF, XR]) for (const side of [1, -1]) {
    const g = new THREE.Group(); g.add(shade(new THREE.Mesh(tyreGeo, tyreM))); g.add(new THREE.Mesh(barrel, darkM));
    const inner = new THREE.Mesh(new THREE.CircleGeometry(RR, 32), darkM); inner.position.z = -0.03; g.add(inner);
    g.position.set(xw, R, side * (W / 2 - 0.035 - TW / 2)); if (side < 0) g.rotation.y = Math.PI;
    carG.add(g); wheels.push(g);
  }
  let faces = [];
  function setWheels(kind) { faces.forEach(f => f.parent.remove(f)); faces = wheels.map(wg => { const f = wheelFace(kind); wg.add(f); return f; }); }

  // ---------- build state ----------
  const tgt = { color: new THREE.Color(build.paint.hex), metalness: paint.metalness, roughness: paint.roughness };
  function setPaint(p) { tgt.color.set(p.hex); const f = FINISH[p.finish || "metallic"]; tgt.metalness = f.metalness; tgt.roughness = f.roughness; }
  function setLook(lk) { setWheels(lk.wheel); roofBlack.visible = lk.roof === "black"; }
  setLook(build.look); setPaint(build.paint); paint.color.copy(tgt.color); paint.metalness = tgt.metalness; paint.roughness = tgt.roughness;

  // ---------- camera moves ----------
  let fly = null;
  function setView(k) { controls.autoRotate = false; opts.onSpin && opts.onSpin(false); fly = { from: camera.position.clone(), to: viewPos(k), t: 0 }; }
  controls.addEventListener("start", () => { fly = null; });

  let raf = 0, disposed = false, last = performance.now();
  function frame(now) {
    if (disposed) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const k = 1 - Math.exp(-dt * 6);
    paint.color.lerp(tgt.color, k); paint.metalness += (tgt.metalness - paint.metalness) * k; paint.roughness += (tgt.roughness - paint.roughness) * k;
    if (fly) {
      fly.t = Math.min(1, fly.t + dt / 0.9); const e = fly.t < 0.5 ? 2 * fly.t * fly.t : 1 - (-2 * fly.t + 2) ** 2 / 2;
      // travel around the car on a sphere rather than through it
      const a = fly.from.clone().sub(target), b = fly.to.clone().sub(target); const len = a.length() + (b.length() - a.length()) * e;
      camera.position.copy(a.normalize().lerp(b.normalize(), e).normalize().multiplyScalar(len).add(target)); if (fly.t >= 1) fly = null;
    }
    controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  const ro = new ResizeObserver(() => { const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); }); ro.observe(container);

  return {
    setPaint, setLook, setView,
    setAutoRotate: on => { controls.autoRotate = !!on; },
    dispose: () => { disposed = true; cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); envTex.dispose(); pmrem.dispose(); renderer.dispose(); renderer.forceContextLoss(); container.innerHTML = ""; },
  };
}
window.EV_STUDIO = STUDIO;
window.startStudio = startStudio;
