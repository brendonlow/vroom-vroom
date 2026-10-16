/* Iron Man style 3D hologram of a car, built parametrically from its published dimensions.
   Orbit, zoom, pull apart, hover and click parts for details.
   window.startHolo(container, car, variant, opts) -> controller */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

const CYAN = 0x4fe6ff, CYAN_DIM = 0x1fb6e0, ORANGE = 0xffb347, WHITE = 0xeaffff, SEL = 0xffffff;

// ---------- 2D helpers (silhouette coordinates: x right = front, y down, ground at y = 127) ----------
function pathToPoints(d) {
  const tok = d.replace(/([MLQZ])/g, " $1 ").trim().split(/[\s,]+/);
  const pts = []; let i = 0, cmd = "M", cur = [0, 0];
  while (i < tok.length) {
    const t = tok[i];
    if (/[MLQZ]/.test(t)) { cmd = t; i++; if (cmd === "Z") continue; }
    if (cmd === "M" || cmd === "L") { cur = [+tok[i], +tok[i + 1]]; pts.push(cur); i += 2; }
    else if (cmd === "Q") { const c = [+tok[i], +tok[i + 1]], p = [+tok[i + 2], +tok[i + 3]]; const s = cur; for (let k = 1; k <= 8; k++) { const u = k / 8; pts.push([(1 - u) ** 2 * s[0] + 2 * (1 - u) * u * c[0] + u * u * p[0], (1 - u) ** 2 * s[1] + 2 * (1 - u) * u * c[1] + u * u * p[1]]); } cur = p; i += 4; }
    else i++;
  }
  return pts;
}
// [minY, maxY] of a closed polygon at vertical line x, or null when outside it
function spanAt(poly, x) {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    if ((a[0] <= x && b[0] > x) || (b[0] <= x && a[0] > x)) { const y = a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); lo = Math.min(lo, y); hi = Math.max(hi, y); }
  }
  return lo === Infinity ? null : [lo, hi];
}

function mats(color, fillOpacity) {
  return { fill: new THREE.MeshBasicMaterial({ color, transparent: true, opacity: fillOpacity, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }), line: new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 }) };
}
function part(key, label, color, fillOpacity = 0.06) {
  const g = new THREE.Group(); g.name = key;
  g.userData = { key, label, color, mats: mats(color, fillOpacity), rest: new THREE.Vector3(), dir: new THREE.Vector3(), fills: [], fillOpacity };
  return g;
}
function addMesh(p, geo, opts = {}) {
  const m = new THREE.Mesh(geo, p.userData.mats.fill); m.userData.part = p; p.add(m); p.userData.fills.push(m);
  if (opts.edges !== false) p.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, opts.angle ?? 20), p.userData.mats.line));
  return m;
}
function addLine(p, pts, closed = false, mat) { p.add(new (closed ? THREE.LineLoop : THREE.Line)(new THREE.BufferGeometry().setFromPoints(pts), mat || p.userData.mats.line)); }

// Loft a closed, rounded-rectangle cross-section along x. Top and bottom follow the side profile,
// width follows the plan taper and narrows above the beltline (tumblehome).
function loft({ N = 64, M = 28, xMin, xMax, topBot, halfWidth, n = 4.5 }) {
  const pos = [], idx = []; const rows = [];
  for (let i = 0; i <= N; i++) {
    const x = xMin + (xMax - xMin) * i / N; const tb = topBot(x); const row = [];
    if (!tb) { rows.push(null); continue; }
    const [yb, yt] = tb; const yc = (yb + yt) / 2, hh = Math.max(0.01, (yt - yb) / 2);
    for (let j = 0; j < M; j++) {
      const th = (j / M) * Math.PI * 2; const c = Math.cos(th), s = Math.sin(th);
      const yy = yc + hh * Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
      const hw = halfWidth(x, yy, yb, yt);
      row.push(pos.length / 3); pos.push(x, yy, hw * Math.sign(c) * Math.pow(Math.abs(c), 2 / n));
    }
    rows.push(row);
  }
  for (let i = 0; i < N; i++) { const a = rows[i], b = rows[i + 1]; if (!a || !b) continue; for (let j = 0; j < M; j++) { const j2 = (j + 1) % M; idx.push(a[j], b[j], b[j2], a[j], b[j2], a[j2]); } }
  const first = rows.find(r => r), last = [...rows].reverse().find(r => r);
  for (const [row, flip] of [[first, true], [last, false]]) { if (!row) continue; const cx = pos[row[0] * 3]; let cy = 0, cz = 0; row.forEach(vi => { cy += pos[vi * 3 + 1]; cz += pos[vi * 3 + 2]; }); const ci = pos.length / 3; pos.push(cx, cy / M, cz / M); for (let j = 0; j < M; j++) { const j2 = (j + 1) % M; flip ? idx.push(ci, row[j2], row[j]) : idx.push(ci, row[j], row[j2]); } }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  return { geo, rows, pos, M };
}
function loftLines(p, lf, { ribEvery = 4, longEvery = 2, mat } = {}) {
  const { rows, pos, M } = lf; const P = i => new THREE.Vector3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
  rows.forEach((r, i) => { if (r && (i % ribEvery === 0 || i === rows.length - 1)) addLine(p, r.map(P), true, mat); });
  for (let j = 0; j < M; j += longEvery) addLine(p, rows.filter(r => r).map(r => P(r[j])), false, mat);
}

export function startHolo(container, car, v, opts = {}) {
  const SIL = window.EV_SIL || {};
  const L = car.length / 1000, W = car.width / 1000, H = car.height / 1000, WB = (car.wheelbase || car.length * 0.6) / 1000;
  const tall = car.body === "large-suv" || car.body === "people-mover";
  const R = tall ? 0.385 : /suv|wagon/.test(car.body) ? 0.355 : 0.33;

  // ---------- renderer / scene ----------
  const w = container.clientWidth || 720, h = container.clientHeight || 405;
  const touch = matchMedia("(pointer: coarse)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(touch ? 1.5 : 2, window.devicePixelRatio || 1)); // phones: bloom at 3x is too slow renderer.setSize(w, h);
  renderer.domElement.className = "holo-canvas"; container.appendChild(renderer.domElement);
  const labelRenderer = new CSS2DRenderer(); labelRenderer.setSize(w, h); labelRenderer.domElement.className = "holo-labels"; container.appendChild(labelRenderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x04070c); scene.fog = new THREE.Fog(0x04070c, 10, 22);
  const camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 80);
  // back the camera off on tall, narrow screens so the whole car fits
  const fit = () => Math.max(1.2, 1.45 / camera.aspect);
  const HOME = { pos: new THREE.Vector3(L * 0.95, H * 1.0, L * 0.95).multiplyScalar(fit()), tgt: new THREE.Vector3(0, H * 0.5, 0) };
  camera.position.copy(HOME.pos);
  const controls = new OrbitControls(camera, labelRenderer.domElement);
  controls.target.copy(HOME.tgt); controls.enableDamping = true; controls.dampingFactor = 0.08; controls.autoRotate = opts.autoRotate !== false; controls.autoRotateSpeed = 1.0;
  controls.minDistance = 1.5; controls.maxDistance = 16 * fit(); controls.maxPolarAngle = Math.PI * 0.55;
  const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), 0.42, 0.35, 0.5)); composer.addPass(new OutputPass());

  // ---------- ambience ----------
  const grid = new THREE.GridHelper(16, 32, 0x1a6f86, 0x0f3f4e); grid.material.transparent = true; grid.material.opacity = 0.32; scene.add(grid);
  const ringMat = new THREE.MeshBasicMaterial({ color: CYAN_DIM, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
  const ring1 = new THREE.Mesh(new THREE.RingGeometry(L * 0.72, L * 0.74, 96, 1, 0, Math.PI * 1.6), ringMat); ring1.rotation.x = -Math.PI / 2; ring1.position.y = 0.01; scene.add(ring1);
  const ring2 = new THREE.Mesh(new THREE.RingGeometry(L * 0.8, L * 0.805, 96, 1, 0, Math.PI * 0.9), ringMat.clone()); ring2.rotation.x = -Math.PI / 2; ring2.position.y = 0.02; scene.add(ring2);
  const ring3 = new THREE.Mesh(new THREE.TorusGeometry(L * 0.62, 0.006, 6, 120), new THREE.MeshBasicMaterial({ color: ORANGE, transparent: true, opacity: 0.45 })); ring3.position.y = H * 0.5; ring3.rotation.x = Math.PI / 2.4; scene.add(ring3);
  const N = 600, pa = new Float32Array(N * 3); for (let i = 0; i < N; i++) { pa[i * 3] = (Math.random() - 0.5) * L * 2.6; pa[i * 3 + 1] = Math.random() * H * 1.9; pa[i * 3 + 2] = (Math.random() - 0.5) * W * 3.6; }
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute("position", new THREE.BufferAttribute(pa, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: CYAN, size: 0.018, transparent: true, opacity: 0.55, depthWrite: false })); scene.add(particles);
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.5, H * 1.2), new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.035, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); scan.rotation.y = Math.PI / 2; scan.position.y = H * 0.6; scene.add(scan);

  // ---------- geometry from the silhouette and the published dimensions ----------
  const carGroup = new THREE.Group(); scene.add(carGroup);
  const parts = [];
  const add = (p, rest, dir) => { p.position.copy(rest); p.userData.rest.copy(rest); p.userData.dir.copy(dir); carGroup.add(p); parts.push(p); return p; };
  const sil = SIL[car.body] || SIL["mid-suv"];
  const G = 127;
  const bp = pathToPoints(sil.body), wp = pathToPoints(sil.win);
  const xs = bp.map(p => p[0]); const minX = Math.min(...xs), maxX = Math.max(...xs); const minY = Math.min(...bp.map(p => p[1]));
  const sx = L / (maxX - minX), sy = H / (G - minY);
  const toX = x => (x - minX) * sx - L / 2, toY = y => (G - y) * sy, fromX = x => (x + L / 2) / sx + minX;
  const bodySpan = x => { const s = spanAt(bp, fromX(x)); return s ? [toY(s[1]), toY(s[0])] : null; };
  const winSpan = x => { const s = spanAt(wp, fromX(x)); return s ? [toY(s[1]), toY(s[0])] : null; };
  const halfW = W / 2 * 0.985;
  const planTaper = x => { const u = (x + L / 2) / L; const f = Math.max(0, 1 - u / 0.14), r = Math.max(0, 1 - (1 - u) / 0.14); return 1 - 0.28 * f * f - 0.22 * r * r; };
  const tumble = (x, y) => { const ws = winSpan(x); if (!ws) return 1; const [wb, wt] = ws; if (y <= wb) return 1; const u = Math.min(1, (y - wb) / Math.max(0.05, wt - wb)); return 1 - 0.17 * u; };
  const beltY = x => { const ws = winSpan(x); const bs = bodySpan(x); return ws ? ws[0] : bs ? bs[0] + (bs[1] - bs[0]) * 0.55 : H * 0.55; };
  const clearance = 0.14 + (tall ? 0.06 : /suv/.test(car.body) ? 0.04 : 0);

  // body shell
  const body = part("body", "Body shell", CYAN, 0.03);
  const bodyLoft = loft({ N: 72, M: 32, xMin: -L / 2 + 0.01, xMax: L / 2 - 0.01, n: 4.2, topBot: x => { const s = bodySpan(x); return s ? [Math.max(clearance, s[0]), s[1]] : null; }, halfWidth: (x, y) => halfW * planTaper(x) * tumble(x, y) });
  addMesh(body, bodyLoft.geo, { edges: false }); loftLines(body, bodyLoft, { ribEvery: 4, longEvery: 2 });
  const beltMat = new THREE.LineBasicMaterial({ color: WHITE, transparent: true, opacity: 0.7 });
  const wxs = wp.map(p => toX(p[0])); const wf = Math.max(...wxs), wr = Math.min(...wxs);
  for (const side of [1, -1]) {
    const belt = [], sill = []; for (let i = 0; i <= 60; i++) { const x = -L / 2 + 0.05 + (L - 0.1) * i / 60; belt.push(new THREE.Vector3(x, beltY(x), side * halfW * planTaper(x) * 1.002)); sill.push(new THREE.Vector3(x, clearance + 0.05, side * halfW * planTaper(x) * 0.98)); }
    addLine(body, belt, false, beltMat); addLine(body, sill, false, beltMat);
    const doors = car.seats <= 2 ? [wf - 0.1, wr + 0.3] : [wf - 0.08, wf - 0.08 - (wf - wr) * 0.48, wr + 0.12];
    doors.forEach(dx => addLine(body, [new THREE.Vector3(dx, clearance + 0.06, side * halfW * planTaper(dx) * 0.995), new THREE.Vector3(dx, beltY(dx), side * halfW * planTaper(dx) * 1.002)], false, beltMat));
  }
  add(body, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1.0, 0));

  // glasshouse
  const glass = part("glass", "Glasshouse", WHITE, 0.05);
  const glassLoft = loft({ N: 48, M: 20, xMin: wr + 0.01, xMax: wf - 0.01, n: 3.2, topBot: x => winSpan(x), halfWidth: (x, y) => halfW * planTaper(x) * tumble(x, y) * 0.985 });
  addMesh(glass, glassLoft.geo, { edges: false }); loftLines(glass, glassLoft, { ribEvery: 6, longEvery: 4, mat: new THREE.LineBasicMaterial({ color: WHITE, transparent: true, opacity: 0.55 }) });
  add(glass, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1.7, 0));

  // mirrors and lights
  const trim = part("trim", "Lights and mirrors", ORANGE, 0.12);
  const mirX = wf - 0.12, mirY = beltY(mirX) + 0.1;
  for (const side of [1, -1]) addMesh(trim, new THREE.BoxGeometry(0.16, 0.09, 0.14), { angle: 30 }).position.set(mirX, mirY, side * (halfW * planTaper(mirX) + 0.11));
  const fs = bodySpan(L / 2 - 0.08), rs = bodySpan(-L / 2 + 0.08);
  if (fs) for (const side of [1, -1]) addMesh(trim, new THREE.BoxGeometry(0.06, 0.07, W * 0.26), { angle: 30 }).position.set(L / 2 - 0.1, fs[0] + (fs[1] - fs[0]) * 0.68, side * W * 0.3);
  if (rs) for (const side of [1, -1]) addMesh(trim, new THREE.BoxGeometry(0.05, 0.06, W * 0.22), { angle: 30 }).position.set(-L / 2 + 0.09, rs[0] + (rs[1] - rs[0]) * 0.7, side * W * 0.3);
  add(trim, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1.0, 0));

  // wheels and arches
  const tyre = new THREE.CylinderGeometry(R, R, 0.235, 32); tyre.rotateX(Math.PI / 2);
  const rim = new THREE.CylinderGeometry(R * 0.63, R * 0.63, 0.24, 7); rim.rotateX(Math.PI / 2);
  const rimMat = new THREE.LineBasicMaterial({ color: ORANGE, transparent: true, opacity: 0.8 });
  [["wheel-fl", "Front left wheel", 1, 1], ["wheel-fr", "Front right wheel", 1, -1], ["wheel-rl", "Rear left wheel", -1, 1], ["wheel-rr", "Rear right wheel", -1, -1]].forEach(([k, lbl, fx, fz]) => {
    const p = part(k, lbl, CYAN, 0.05); addMesh(p, tyre, { angle: 40 });
    p.add(new THREE.Mesh(rim, mats(ORANGE, 0.05).fill)); p.add(new THREE.LineSegments(new THREE.EdgesGeometry(rim, 30), rimMat));
    for (let s = 0; s < 5; s++) { const a = s / 5 * Math.PI * 2; addLine(p, [new THREE.Vector3(0, 0, fz * 0.125), new THREE.Vector3(Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6, fz * 0.125)], false, rimMat); }
    add(p, new THREE.Vector3(fx * WB / 2, R, fz * (W / 2 - 0.13)), new THREE.Vector3(0, -0.2, fz * 1.3));
    const arch = []; for (let i = 0; i <= 20; i++) { const a = Math.PI * i / 20; arch.push(new THREE.Vector3(fx * WB / 2 + Math.cos(a) * (R + 0.07), R + Math.sin(a) * (R + 0.07), fz * halfW * planTaper(fx * WB / 2) * 1.003)); }
    addLine(body, arch, false, beltMat);
  });

  // battery
  const kwh = v.battery || 60; const thick = 0.09 + kwh / 900;
  const bat = part("battery", `Battery · ${kwh} kWh`, ORANGE, 0.08);
  addMesh(bat, new THREE.BoxGeometry(WB * 0.86, thick, W * 0.74, 8, 1, 5), { angle: 10 });
  for (let i = 1; i < 8; i++) addLine(bat, [new THREE.Vector3(-WB * 0.43 + WB * 0.86 * i / 8, thick / 2 + 0.001, -W * 0.37), new THREE.Vector3(-WB * 0.43 + WB * 0.86 * i / 8, thick / 2 + 0.001, W * 0.37)]);
  add(bat, new THREE.Vector3(0, clearance + thick / 2 + 0.01, 0), new THREE.Vector3(0, -1.3, 0));

  // motors
  const motorGeo = new THREE.CylinderGeometry(0.16, 0.16, W * 0.4, 24); motorGeo.rotateX(Math.PI / 2);
  const mk = (k, lbl, x, dx) => { const p = part(k, lbl, ORANGE, 0.08); addMesh(p, motorGeo, { angle: 30 }); addMesh(p, new THREE.BoxGeometry(0.22, 0.2, W * 0.2), { angle: 30 }).position.set(0, 0.16, 0); add(p, new THREE.Vector3(x, R * 0.95, 0), new THREE.Vector3(dx, -0.55, 0)); };
  if (v.drive === "FWD" || v.drive === "AWD") mk("motor-f", "Front motor", WB / 2, 1.4);
  if (v.drive === "RWD" || v.drive === "AWD") mk("motor-r", "Rear motor", -WB / 2, -1.4);

  // seats
  const cushion = new THREE.BoxGeometry(0.5, 0.11, 0.46); const back = new THREE.BoxGeometry(0.11, 0.58, 0.46); back.translate(-0.25, 0.32, 0);
  const rows = car.seats >= 6 ? [["front", 2], ["second", car.seats === 6 ? 2 : 3], ["third", 2]] : [["front", 2], ["rear", car.seats >= 5 ? 3 : 2]];
  const rowX = { front: WB * 0.12, second: -WB * 0.2, rear: -WB * 0.22, third: -WB * 0.5 };
  const floorY = clearance + thick + 0.08;
  rows.forEach(([row, n]) => { for (let i = 0; i < n; i++) { const z = n === 2 ? (i ? 1 : -1) * W * 0.2 : (i - 1) * W * 0.25; const p = part(`seat-${row}-${i}`, `${row[0].toUpperCase() + row.slice(1)} row seat`, CYAN_DIM, 0.05); addMesh(p, cushion, { angle: 30 }); addMesh(p, back, { angle: 30 }); add(p, new THREE.Vector3(rowX[row], floorY + 0.22, z), new THREE.Vector3(0, 0.85, Math.abs(z) > 0.05 ? Math.sign(z) * 0.5 : 0)); } });

  // boot and frunk
  const litres = car.boot != null ? car.boot : car.boot5 || 300;
  const bw = W * 0.68, bh = 0.42, bl = Math.max(0.18, litres / 1000 / (bw * bh));
  const lastRowX = rows.length === 3 ? rowX.third : rowX.rear;
  const boot = part("boot", `Boot · ${litres} L`, WHITE, 0.07); addMesh(boot, new THREE.BoxGeometry(bl, bh, bw, 3, 2, 3), { angle: 10 });
  add(boot, new THREE.Vector3(lastRowX - 0.42 - bl / 2, floorY + bh / 2 + 0.02, 0), new THREE.Vector3(-1.5, 0.3, 0));
  if (car.frunk) { const fl = Math.max(0.1, car.frunk / 1000 / (W * 0.5 * 0.28)); const fr = part("frunk", `Frunk · ${car.frunk} L`, WHITE, 0.07); addMesh(fr, new THREE.BoxGeometry(fl, 0.28, W * 0.5), { angle: 10 }); add(fr, new THREE.Vector3(WB / 2 + 0.25, R + 0.5, 0), new THREE.Vector3(1.5, 0.3, 0)); }
  const port = part("port", "Charge port", ORANGE, 0.2); addMesh(port, new THREE.TorusGeometry(0.07, 0.012, 8, 24), { angle: 30 });
  add(port, new THREE.Vector3(-L / 2 + 0.5, beltY(-L / 2 + 0.5) - 0.08, halfW * planTaper(-L / 2 + 0.5) + 0.01), new THREE.Vector3(0, 0, 1.2));

  // ---------- labels ----------
  const KEY = new Set(["body", "battery", "motor-f", "motor-r", "boot", "frunk"]);
  const labelObjs = parts.map(p => { const el = document.createElement("div"); el.className = "holo-label"; el.textContent = p.userData.label; const o = new CSS2DObject(el); o.position.set(0, 0.12, 0); p.add(o); return { el, part: p }; });
  const title = document.createElement("div"); title.className = "holo-title"; title.innerHTML = `<b>${car.brand} ${car.model}</b><span>${v.name} · ${L.toFixed(2)} × ${W.toFixed(2)} × ${H.toFixed(2)} m · wheelbase ${WB.toFixed(2)} m</span>`; container.appendChild(title);

  // ---------- interaction ----------
  const ray = new THREE.Raycaster(); const mouse = new THREE.Vector2(-9, -9); let hovered = null, selected = null, focusTarget = null;
  const fills = parts.flatMap(p => p.userData.fills);
  const dom = labelRenderer.domElement; let downAt = null;
  dom.addEventListener("pointermove", e => { const r = dom.getBoundingClientRect(); mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); });
  dom.addEventListener("pointerleave", () => mouse.set(-9, -9));
  const setMouse = e => { const r = dom.getBoundingClientRect(); mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
  dom.addEventListener("pointerdown", e => { downAt = [e.clientX, e.clientY]; setMouse(e); });
  // raycast at the tap itself: touch screens have no hover to rely on
  dom.addEventListener("pointerup", e => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 10) { downAt = null; if (e.pointerType !== "mouse") mouse.set(-9, -9); return; }
    downAt = null; setMouse(e); ray.setFromCamera(mouse, camera); const hit = ray.intersectObjects(fills, false)[0];
    select(hit ? hit.object.userData.part.userData.key : null, true);
    if (e.pointerType !== "mouse") mouse.set(-9, -9);
  });
  const paint = (p, state) => { const u = p.userData; u.mats.line.color.setHex(state === "sel" ? SEL : state === "hot" ? WHITE : u.color); u.mats.fill.opacity = state === "sel" ? 0.2 : state === "hot" ? 0.14 : u.fillOpacity; };
  let explode = opts.explode || 0, explodeTarget = opts.explode || 0, showLabels = opts.labels !== false, t0 = performance.now(), last = t0, raf = 0, disposed = false;
  const setExplode = x => { explodeTarget = Math.max(0, Math.min(1, x)); opts.onExplode && opts.onExplode(explodeTarget); };
  function select(key, fromClick) {
    if (selected) paint(selected, hovered === selected ? "hot" : "");
    selected = key ? parts.find(p => p.userData.key === key) || null : null;
    if (selected) { paint(selected, "sel"); if (explodeTarget < 0.45) setExplode(0.55); focusTarget = selected; } else focusTarget = null;
    opts.onSelect && opts.onSelect(selected ? selected.userData.key : null, fromClick);
  }
  const tmp = new THREE.Vector3();
  function frame(now) {
    if (disposed) return;
    const t = (now - t0) / 1000; const dt = Math.min(0.25, (now - last) / 1000); last = now;
    explode += (explodeTarget - explode) * (1 - Math.exp(-dt * 7));
    parts.forEach(p => p.position.copy(p.userData.rest).addScaledVector(p.userData.dir, explode));
    if (focusTarget) { focusTarget.getWorldPosition(tmp); const k = 1 - Math.exp(-dt * 4); controls.target.lerp(tmp, k); const off = camera.position.clone().sub(controls.target); const want = Math.max(L * 1.15 * fit(), Math.min(off.length(), L * 1.6 * fit())); camera.position.lerp(controls.target.clone().add(off.normalize().multiplyScalar(want)), k); }
    ring1.rotation.z = t * 0.25; ring2.rotation.z = -t * 0.4; ring3.rotation.z = t * 0.5; scan.position.x = Math.sin(t * 0.55) * L * 0.55; particles.rotation.y = t * 0.03;
    ray.setFromCamera(mouse, camera); const hit = ray.intersectObjects(fills, false)[0]; const np = hit ? hit.object.userData.part : null;
    if (np !== hovered) { if (hovered && hovered !== selected) paint(hovered, ""); if (np && np !== selected) paint(np, "hot"); hovered = np; dom.style.cursor = np ? "pointer" : "grab"; }
    labelObjs.forEach(({ el, part: p }) => { const on = (showLabels && KEY.has(p.userData.key) && explode > 0.25) || p === hovered || p === selected; el.style.opacity = on ? 1 : 0; el.classList.toggle("hot", p === hovered || p === selected); });
    controls.update(); composer.render(); labelRenderer.render(scene, camera); raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  const ro = new ResizeObserver(() => { const cw = container.clientWidth, ch = container.clientHeight; if (!cw || !ch) return; camera.aspect = cw / ch; camera.updateProjectionMatrix(); renderer.setSize(cw, ch); composer.setSize(cw, ch); labelRenderer.setSize(cw, ch); }); ro.observe(container);

  return {
    parts: () => parts.map(p => ({ key: p.userData.key, label: p.userData.label })),
    select, setExplode, setAutoRotate: on => { controls.autoRotate = !!on; }, setLabels: on => { showLabels = !!on; },
    reset: () => { camera.position.copy(HOME.pos); controls.target.copy(HOME.tgt); focusTarget = null; select(null); setExplode(0); },
    dispose: () => { disposed = true; cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); renderer.dispose(); renderer.forceContextLoss(); container.innerHTML = ""; }, // free the GL context: mobile browsers cap how many stay alive
  };
}
window.startHolo = startHolo;
