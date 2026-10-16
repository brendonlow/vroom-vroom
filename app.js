/* EV Chooser AU — app logic (no build step, no dependencies) */
(function () {
  const D = window.EV_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const fmt$ = n => "$" + Math.round(n).toLocaleString("en-AU");
  const fmtK = n => n >= 1000 ? "$" + Math.round(n / 1000) + "k" : fmt$(n);
  const m = mm => (mm / 1000).toFixed(2) + " m";
  const BODY_LABEL = { hatch: "Hatch", sedan: "Sedan", "small-suv": "Small SUV", "mid-suv": "Mid SUV", "large-suv": "Large SUV", wagon: "Wagon", coupe: "Coupe / fastback", "people-mover": "People mover" };
  const bootOf = c => c.boot != null ? c.boot : (c.boot5 != null ? c.boot5 : 0);
  const BODY_ORDER = ["hatch", "sedan", "coupe", "wagon", "small-suv", "mid-suv", "large-suv", "people-mover"];

  // ---------- persisted state ----------
  const LS = "evchooser.v1";
  const saved = JSON.parse(localStorage.getItem(LS) || "{}");
  const state = Object.assign({
    stateCode: "NSW", priceMode: "driveaway", view: "grid", sort: "price",
    budget: 250000, bootMin: 0, lenMax: 5400, widMax: 2050, rangeMin: 0,
    bodies: [], seats: "any", drive: "any", origin: "any", cnOwned: false, brandsOff: [], q: "",
    compare: [], quotes: {}, chosen: {}, chartY: "boot", presets: [],
  }, saved);
  const FILTER_KEYS = ["budget", "bootMin", "lenMax", "widMax", "rangeMin", "bodies", "seats", "drive", "origin", "cnOwned", "brandsOff", "q", "sort", "priceMode", "stateCode"];
  const pickFilters = () => Object.fromEntries(FILTER_KEYS.map(k => [k, state[k]]));
  const sameFilters = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  // URL hash carries the filters so a bookmarked link reopens the same view
  const readHash = () => { try { const h = location.hash.slice(1); if (!h) return null; return JSON.parse(decodeURIComponent(atob(h))); } catch { return null; } };
  const writeHash = () => { const enc = btoa(encodeURIComponent(JSON.stringify(pickFilters()))); history.replaceState(null, "", "#" + enc); };
  { const fromHash = readHash(); if (fromHash) Object.assign(state, Object.fromEntries(FILTER_KEYS.filter(k => k in fromHash).map(k => [k, fromHash[k]]))); }
  const persist = () => { localStorage.setItem(LS, JSON.stringify(state)); writeHash(); };

  // ---------- pricing ----------
  function paintsFor(car) {
    const list = car.paints || D.brandPaint[car.brand] || [["White", "#f0f1f0", 0], ["Black", "#121416", 0], ["Grey", "#8d9296", 0]];
    return list.map(p => { const o = Array.isArray(p) ? { name: p[0], hex: p[1], price: p[2] } : { ...p }; if (car.paintPrice != null && o.price > 0) o.price = car.paintPrice; return o; });
  }
  function breakdown(car, v, paintPrice, stateCode) {
    const st = D.states[stateCode];
    const offer = v.offer || null;
    const listPrice = offer ? offer.price : v.price;
    const priceType = offer ? offer.type : v.priceType;
    const base = listPrice + (paintPrice || 0);
    const quote = state.quotes[car.id + "|" + v.name];
    if (quote) return { base, driveaway: quote, quoted: true, type: priceType, offer, items: [] };
    if (priceType === "driveaway") return { base, driveaway: base, type: "driveaway", offer, items: [[offer ? "Offer driveaway price (incl. on-roads)" : "Brand driveaway price (incl. on-roads)", base]] };
    const duty = st.duty(base);
    const delivery = car.delivery != null ? car.delivery : D.defaultDelivery;
    const items = [[offer ? "Offer price (before on-roads)" : "List price (RRP)", base], ["Stamp duty · " + stateCode, duty], ["Rego, CTP & plates (12 mo, est.)", st.rego], ["Dealer delivery (est.)", delivery]];
    return { base, driveaway: base + duty + st.rego + delivery, type: "rrp", offer, duty, rego: st.rego, delivery, items };
  }
  function shownPrice(car, v, paintPrice = 0) {
    const b = breakdown(car, v, paintPrice, state.stateCode);
    const off = b.offer ? "offer · " : "";
    if (state.priceMode === "rrp") return { value: b.base, label: off + (b.type === "driveaway" ? "driveaway" : "RRP"), quoted: b.quoted, offer: b.offer };
    return { value: b.driveaway, label: b.quoted ? "your quote" : off + (b.type === "driveaway" ? "driveaway" : "est. driveaway " + state.stateCode), quoted: b.quoted, offer: b.offer };
  }
  // cheapest variant that passes the per-variant filters
  function pickVariant(car) {
    const ok = car.variants.filter(v => passesVariant(v, car));
    if (!ok.length) return null;
    return ok.reduce((a, b) => shownPrice(car, a).value <= shownPrice(car, b).value ? a : b);
  }
  function passesVariant(v, car) {
    if (v.range != null && v.range < state.rangeMin) return false;
    if (state.drive === "AWD" && v.drive !== "AWD") return false;
    if (state.drive === "2wd" && v.drive === "AWD") return false;
    if (shownPrice(car || { id: "_", brand: "_" }, v).value > state.budget) return false;
    return true;
  }
  const isChinese = brand => D.brandOrigin[brand] === "CN" || (state.cnOwned && D.chineseOwned.includes(brand));
  function passesCar(car) {
    if (bootOf(car) < state.bootMin) return false;
    if (car.length > state.lenMax) return false;
    if (car.width > state.widMax) return false;
    if (state.bodies.length && !state.bodies.includes(car.body)) return false;
    if (state.seats !== "any" && car.seats < +state.seats) return false;
    if (state.brandsOff.includes(car.brand)) return false;
    if (state.origin !== "any" && isChinese(car.brand) !== (state.origin === "cn")) return false;
    if (state.q && !(car.brand + " " + car.model).toLowerCase().includes(state.q.trim().toLowerCase())) return false;
    return true;
  }

  // ---------- silhouettes ----------
  // Side profiles in a 400x150 box, drawn left (rear) to right (front)
  const SIL = {
    hatch:        { body: "M50 112 L46 94 Q46 72 64 62 L94 48 Q134 40 198 42 L258 64 Q318 70 346 80 Q362 88 362 112 Z", win: "M72 64 L98 52 Q134 46 194 48 L248 66 L78 70 Z" },
    sedan:        { body: "M34 112 L34 92 Q36 76 68 72 L122 66 Q160 40 220 38 L262 40 Q300 44 322 66 L352 70 Q366 76 364 112 Z", win: "M130 66 L164 46 Q200 42 236 44 L312 66 Z" },
    coupe:        { body: "M34 112 L34 94 Q36 78 70 74 L120 68 Q165 36 225 36 L268 38 Q304 44 326 68 L354 74 Q366 80 364 112 Z", win: "M128 68 L168 44 Q210 40 244 42 L316 68 Z" },
    wagon:        { body: "M38 112 L36 90 Q36 60 60 54 L118 46 Q170 36 230 38 L288 60 Q330 66 350 78 Q364 86 364 112 Z", win: "M62 60 L120 50 Q170 42 226 44 L280 62 L66 66 Z" },
    "small-suv":  { body: "M44 112 L42 90 Q42 60 70 54 L112 44 Q160 34 220 36 L276 58 Q326 64 350 76 Q364 84 364 112 Z", win: "M72 58 L114 48 Q160 40 216 42 L268 60 L76 64 Z" },
    "mid-suv":    { body: "M40 112 L38 88 Q38 54 68 48 L112 38 Q164 28 226 30 L286 54 Q332 60 354 72 Q368 80 366 112 Z", win: "M70 54 L114 42 Q164 34 222 36 L278 56 L74 60 Z" },
    "large-suv":  { body: "M34 112 L32 86 Q32 48 64 42 L112 32 Q170 22 236 24 L300 48 Q340 54 358 68 Q372 76 370 112 Z", win: "M66 48 L114 36 Q170 28 232 30 L292 50 L70 54 Z" },
    "people-mover": { body: "M30 112 L30 70 Q30 30 64 26 L250 22 Q300 22 330 42 L358 66 Q372 76 370 112 Z", win: "M64 32 L248 28 Q296 28 322 46 L340 66 L68 68 Z" },
  };
  window.EV_SIL = SIL;
  function silhouette(car, hex, opts = {}) {
    const s = SIL[car.body] || SIL["mid-suv"];
    const tall = car.body === "large-suv" || car.body === "people-mover";
    const r = tall ? 21 : 19;
    const wy = 108;
    const glass = isDark(hex) ? "rgba(255,255,255,.28)" : "rgba(20,30,40,.22)";
    return `<svg viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="200" cy="130" rx="168" ry="5" fill="rgba(0,0,0,.08)"/>
      <path d="${s.body}" fill="${hex}" stroke="rgba(0,0,0,.28)" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="${s.win}" fill="${glass}"/>
      <g fill="#1d1f22"><circle cx="104" cy="${wy}" r="${r}"/><circle cx="296" cy="${wy}" r="${r}"/></g>
      <g fill="#a3a8ad"><circle cx="104" cy="${wy}" r="${r - 8}"/><circle cx="296" cy="${wy}" r="${r - 8}"/></g>
      <g fill="#3a3d41"><circle cx="104" cy="${wy}" r="3"/><circle cx="296" cy="${wy}" r="3"/></g>
      <rect x="338" y="80" width="18" height="6" rx="2" fill="rgba(255,255,255,.6)"/>
    </svg>`;
  }
  const IMG = window.EV_IMG || {};
  // ---------- resale ----------
  // % of the new price kept after 3 years / ~45,000 km (resale.js, Oct 2026 research)
  const RESALE = window.EV_RESALE || {};
  const resaleOf = car => RESALE[car.id] || null;
  const resaleValue = (car, v, paintPrice = 0) => { const r = resaleOf(car); return r ? Math.round(breakdown(car, v, paintPrice, state.stateCode).base * r.pct / 100) : null; };
  const resaleLoss = (car, v, paintPrice = 0) => { const rv = resaleValue(car, v, paintPrice); return rv == null ? null : shownPrice(car, v, paintPrice).value - rv; };
  const resaleTier = pct => pct >= 54 ? "good" : pct >= 45 ? "mid" : "low";
  const LOGOS = window.EV_LOGOS || {};
  const logoSrc = brand => LOGOS[brand] ? `logos/${brand.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png` : null;
  const logoImg = (brand, cls) => { const src = logoSrc(brand); return src ? `<img class="${cls}" src="${src}" alt="${brand} logo" loading="lazy" onerror="this.remove()">` : ""; };
  function photo(car, hex, cls = "") {
    const c = IMG[car.id];
    if (!c) return silhouette(car, hex);
    return `<img class="photo ${cls}" src="img/${car.id}.jpg" alt="${car.brand} ${car.model}" loading="lazy" onerror="this.outerHTML=window.__sil('${car.id}','${hex}')">`;
  }
  window.__sil = (id, hex) => { const c = D.cars.find(x => x.id === id); return c ? silhouette(c, hex) : ""; };
  function credit(car) { const c = IMG[car.id]; return c ? `Photo: ${c.artist || "Wikimedia Commons"}, ${c.license || ""} via <a href="${c.url}" target="_blank" rel="noopener">Wikimedia Commons</a>.` : ""; }
  function isDark(hex) { const c = hex.replace("#", ""); const n = parseInt(c.length === 3 ? c.split("").map(x => x + x).join("") : c, 16); const r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) < 128; }
  function defaultPaint(car) { const ps = paintsFor(car); return ps.find(p => !/white|black|grey|gray|silver|quartz/i.test(p.name)) || ps.find(p => /grey|gray|silver/i.test(p.name)) || ps[0]; }

  // ---------- filters UI ----------
  function initFilters() {
    const stSel = $("#stateSel");
    stSel.innerHTML = Object.keys(D.states).map(k => `<option value="${k}">${k}</option>`).join("");
    stSel.value = state.stateCode;
    stSel.onchange = () => { state.stateCode = stSel.value; update(); };
    $$("#priceMode button").forEach(b => { b.classList.toggle("on", b.dataset.mode === state.priceMode); b.onclick = () => { state.priceMode = b.dataset.mode; $$("#priceMode button").forEach(x => x.classList.toggle("on", x === b)); update(); }; });
    $$("#viewMode button").forEach(b => { b.classList.toggle("on", b.dataset.view === state.view); b.onclick = () => { state.view = b.dataset.view; $$("#viewMode button").forEach(x => x.classList.toggle("on", x === b)); update(); }; });

    // slider + free-text number box, kept in sync. "any" = slider at its open end.
    const bind = (id, key, anyAt, placeholder) => {
      const el = $(id), num = $(id + "Num");
      const isAny = v => anyAt === "max" ? v >= +el.max : v <= +el.min;
      const show = () => { const v = state[key]; el.value = Math.min(+el.max, Math.max(+el.min, v)); num.value = isAny(v) ? "" : v; num.placeholder = placeholder; };
      show();
      el.oninput = () => { state[key] = +el.value; show(); update(); };
      num.onchange = () => { const v = parseFloat(num.value); state[key] = isNaN(v) ? (anyAt === "max" ? +el.max : +el.min) : v; show(); update(); };
      num.onkeydown = e => { if (e.key === "Enter") num.blur(); };
    };
    const q = $("#search"); q.value = state.q || ""; q.oninput = () => { state.q = q.value; update(); };
    $("#saveForm").onsubmit = e => { e.preventDefault(); const name = $("#saveName").value.trim(); if (!name) return; const f = pickFilters(); const i = state.presets.findIndex(p => p.name.toLowerCase() === name.toLowerCase()); if (i >= 0) state.presets[i] = { name, f }; else state.presets.push({ name, f }); $("#saveName").value = ""; update(); };
    bind("#budget", "budget", "max", "any");
    bind("#bootMin", "bootMin", "min", "any");
    bind("#lenMax", "lenMax", "max", "any");
    bind("#widMax", "widMax", "max", "any");
    bind("#rangeMin", "rangeMin", "min", "any");

    const bc = $("#bodyChips");
    bc.innerHTML = BODY_ORDER.map(b => `<button data-v="${b}" class="${state.bodies.includes(b) ? "on" : ""}">${BODY_LABEL[b]}</button>`).join("");
    bc.onclick = e => { const b = e.target.closest("button"); if (!b) return; const v = b.dataset.v; state.bodies = state.bodies.includes(v) ? state.bodies.filter(x => x !== v) : [...state.bodies, v]; b.classList.toggle("on"); update(); };
    const single = (id, key) => { const wrap = $(id); $$("button", wrap).forEach(b => b.classList.toggle("on", b.dataset.v === String(state[key]))); wrap.onclick = e => { const b = e.target.closest("button"); if (!b) return; state[key] = b.dataset.v; $$("button", wrap).forEach(x => x.classList.toggle("on", x === b)); update(); }; };
    single("#seatChips", "seats"); single("#driveChips", "drive"); single("#originChips", "origin");
    const own = $("#cnOwned"); own.checked = !!state.cnOwned; own.onchange = () => { state.cnOwned = own.checked; update(); };
    $("#cnOwnedList").textContent = `(${D.chineseOwned.join(", ")}, all Geely-owned)`;

    const brands = [...new Set(D.cars.map(c => c.brand))].sort();
    const bl = $("#brandList");
    bl.innerHTML = brands.map(b => `<label class="${state.brandsOff.includes(b) ? "off" : ""}"><input type="checkbox" value="${b}" ${state.brandsOff.includes(b) ? "" : "checked"}> ${b}${D.brandOrigin[b] === "CN" ? `<span class="cn-tag" title="Chinese brand">CN</span>` : D.chineseOwned.includes(b) ? `<span class="cn-tag owned" title="Chinese-owned (Geely)">CN-owned</span>` : ""}<span class="n">${D.cars.filter(c => c.brand === b).length}</span></label>`).join("");
    bl.onchange = e => { const v = e.target.value; state.brandsOff = e.target.checked ? state.brandsOff.filter(x => x !== v) : [...state.brandsOff, v]; e.target.closest("label").classList.toggle("off", !e.target.checked); update(); };
    $("#brandAll").onclick = () => { state.brandsOff = []; $$("#brandList input").forEach(i => { i.checked = true; i.closest("label").classList.remove("off"); }); update(); };
    $("#brandNone").onclick = () => { state.brandsOff = brands.slice(); $$("#brandList input").forEach(i => { i.checked = false; i.closest("label").classList.add("off"); }); update(); };
    $("#resetFilters").onclick = () => { Object.assign(state, { budget: 250000, bootMin: 0, lenMax: 5400, widMax: 2050, rangeMin: 0, bodies: [], seats: "any", drive: "any", origin: "any", brandsOff: [], q: "" }); persist(); initFilters(); update(); };
    const sortSel = $("#sortSel"); sortSel.value = state.sort; sortSel.onchange = () => { state.sort = sortSel.value; update(); };
  }

  // ---------- results ----------
  function results() {
    const rows = [];
    for (const car of D.cars) {
      if (!passesCar(car)) continue;
      const v = pickVariant(car);
      if (!v) continue;
      rows.push({ car, v, price: shownPrice(car, v) });
    }
    const s = state.sort;
    rows.sort((a, b) => s === "price" ? a.price.value - b.price.value : s === "boot" ? bootOf(b.car) - bootOf(a.car) : s === "value" ? (bootOf(b.car) / b.price.value) - (bootOf(a.car) / a.price.value) : s === "short" ? a.car.length - b.car.length : s === "long" ? b.car.length - a.car.length : s === "range" ? (b.v.range || 0) - (a.v.range || 0) : s === "resale" ? (resaleOf(b.car)?.pct ?? -1) - (resaleOf(a.car)?.pct ?? -1) : s === "loss" ? (resaleLoss(a.car, a.v) ?? 1e9) - (resaleLoss(b.car, b.v) ?? 1e9) : (a.car.brand + a.car.model).localeCompare(b.car.brand + b.car.model));
    return rows;
  }
  function sizeTag(car) {
    const refs = D.refs.filter(r => r.id !== "ranger");
    const near = refs.reduce((a, r) => Math.abs(r.length - car.length) < Math.abs(a.length - car.length) ? r : a);
    const d = car.length - near.length;
    return `${Math.abs(d) < 60 ? "About" : d > 0 ? Math.round(d / 10) + " cm longer than" : Math.round(-d / 10) + " cm shorter than"} a ${near.name.replace(" (7 seat)", "")}`;
  }
  const PLUS_ICON = `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  const CHECK_ICON = `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const esc = s => String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  function renderGrid(rows) {
    const g = $("#grid");
    if (!rows.length) { g.innerHTML = `<div class="empty">Nothing matches. Loosen a filter, or raise the budget.</div>`; return; }
    g.innerHTML = rows.map(({ car, v, price }) => {
      const paint = defaultPaint(car);
      const cmp = state.compare.includes(car.id);
      const rs = resaleOf(car);
      const bootTxt = car.boot == null ? `${car.boot5} L` : car.seats >= 6 && car.boot5 ? `${car.boot} L` : `${car.boot} L`;
      const bootSub = car.boot == null ? "behind 2nd row" : car.seats >= 6 && car.boot5 ? `behind 3rd row · ${car.boot5} L as 5-seat` : `boot${car.frunk ? ` + ${car.frunk} L frunk` : ""}`;
      return `<article class="card ${cmp ? "compared" : ""}" data-id="${car.id}">
        ${price.quoted ? `<span class="mine">YOUR QUOTE</span>` : ""}
        <button class="cmp" data-cmp="${car.id}" title="${cmp ? "Remove from compare" : "Add to compare"}" aria-label="${cmp ? "Remove from compare" : "Add to compare"}" aria-pressed="${cmp}">${cmp ? CHECK_ICON : PLUS_ICON}</button>
        <div class="sil">${photo(car, paint.hex)}${logoSrc(car.brand) ? `<span class="blogo-chip">${logoImg(car.brand, "")}</span>` : ""}</div>
        <div class="brand-line">${car.brand}</div>
        <div class="model-line">${car.model}</div>
        <div class="tags"><span class="tag">${BODY_LABEL[car.body]}</span><span class="tag">${car.seats} seats</span><span class="tag">${v.drive}</span>${v.range ? `<span class="tag">${v.range} km</span>` : ""}${price.offer ? `<span class="tag offer">Offer</span>` : ""}</div>
        <div class="price-row">
          <div class="price">${fmt$(price.value)}<small>${car.variants.length > 1 ? "from · " : ""}${price.label}</small></div>
          <div class="boot"><b>${bootTxt}</b><span>${bootSub}</span></div>
        </div>
        <div class="dims"><span>${m(car.length)} long</span><span>${m(car.width)} wide</span><span>${m(car.height)} tall</span></div>
        ${rs ? `<div class="resale-row ${resaleTier(rs.pct)}" title="${esc(rs.note)}"><div class="rtop"><span class="rl">3-yr resale${rs.basis === "estimate" ? " <i>est.</i>" : ""}</span><span><b>${rs.pct}%</b> <span class="rv">≈ ${fmtK(resaleValue(car, v))}</span></span></div><span class="meter"><i style="width:${rs.pct}%"></i></span></div>` : ""}
      </article>`;
    }).join("");
  }

  // ---------- chart ----------
  function renderChart(rows) {
    const el = $("#chartView");
    const yKey = state.chartY;
    const yDef = { boot: { label: "Boot space, seats up (L)", get: r => bootOf(r.car), unit: " L" }, length: { label: "Length (m)", get: r => r.car.length / 1000, unit: " m" }, range: { label: "Range, WLTP (km)", get: r => r.v.range || 0, unit: " km" }, resale: { label: "Resale value after 3 years (% kept)", get: r => resaleOf(r.car)?.pct ?? 0, unit: "%" } }[yKey];
    const W = 920, H = 460, P = { l: 56, r: 24, t: 16, b: 44 };
    const xs = rows.map(r => r.price.value), ys = rows.map(yDef.get);
    const xmin = Math.floor(Math.min(...xs, 30000) / 10000) * 10000, xmax = Math.ceil(Math.max(...xs, 60000) / 10000) * 10000;
    const ymin = yKey === "length" ? 3.5 : yKey === "resale" ? 30 : 0, ymax = yKey === "length" ? Math.max(5.4, Math.ceil(Math.max(...ys) * 10) / 10) : yKey === "resale" ? Math.max(70, Math.ceil(Math.max(...ys) / 10) * 10) : Math.ceil(Math.max(...ys, 100) / 100) * 100;
    const sx = x => P.l + (x - xmin) / (xmax - xmin) * (W - P.l - P.r);
    const sy = y => H - P.b - (y - ymin) / (ymax - ymin) * (H - P.t - P.b);
    const xt = []; for (let x = xmin; x <= xmax; x += (xmax - xmin) > 120000 ? 20000 : 10000) xt.push(x);
    const yt = []; const ystep = yKey === "length" ? 0.25 : yKey === "resale" ? 10 : 100; for (let y = ymin; y <= ymax + 1e-9; y += ystep) yt.push(+y.toFixed(2));
    const hl = new Set(state.compare);
    const dots = rows.map(r => `<circle class="dot ${hl.has(r.car.id) ? "hl" : ""}" r="5.5" cx="${sx(r.price.value).toFixed(1)}" cy="${sy(yDef.get(r)).toFixed(1)}" data-id="${r.car.id}"/>`).join("");
    const labels = rows.filter(r => hl.has(r.car.id)).map(r => `<text class="dlabel" x="${(sx(r.price.value) + 8).toFixed(1)}" y="${(sy(yDef.get(r)) - 8).toFixed(1)}">${r.car.brand} ${r.car.model}</text>`).join("");
    el.innerHTML = `
      <div class="chart-head">
        <h2>${yDef.label} against ${state.priceMode === "rrp" ? "list price" : "estimated driveaway price"} — ${rows.length} cars, cheapest matching variant each</h2>
        <div style="display:flex;gap:12px;align-items:center">
          <div class="legend"><span><i style="background:var(--accent)"></i>All cars</span><span><i style="background:var(--warm)"></i>In your compare list</span></div>
          <label class="ctl">Vertical axis <select id="chartY"><option value="boot">Boot space</option><option value="length">Length</option><option value="range">Range</option><option value="resale">Resale value</option></select></label>
        </div>
      </div>
      <div class="chart-wrap">
        <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Scatter chart of price against ${yDef.label}">
          ${yt.map(y => `<line class="grid-line" x1="${P.l}" x2="${W - P.r}" y1="${sy(y)}" y2="${sy(y)}"/>`).join("")}
          <g class="axis">${xt.map(x => `<text x="${sx(x)}" y="${H - P.b + 18}" text-anchor="middle">${fmtK(x)}</text>`).join("")}
          ${yt.map(y => `<text x="${P.l - 8}" y="${sy(y) + 4}" text-anchor="end">${yKey === "length" ? y.toFixed(2) : y}</text>`).join("")}
          <text x="${(P.l + W - P.r) / 2}" y="${H - 6}" text-anchor="middle">Price (AUD)</text></g>
          ${dots}${labels}
        </svg>
        <div class="tooltip" id="tip"></div>
      </div>
      <p class="disclaimer" style="margin-top:10px">Hover a dot for details, click to open the car. Add cars to compare to highlight and label them.</p>`;
    const sel = $("#chartY"); sel.value = yKey; sel.onchange = () => { state.chartY = sel.value; persist(); renderChart(rows); };
    const tip = $("#tip"), wrap = $(".chart-wrap", el), svg = $("svg", wrap);
    const byId = Object.fromEntries(rows.map(r => [r.car.id, r]));
    svg.addEventListener("mousemove", e => {
      const d = e.target.closest(".dot"); if (!d) { tip.style.opacity = 0; return; }
      const r = byId[d.dataset.id]; const wr = wrap.getBoundingClientRect();
      tip.innerHTML = `<b>${r.car.brand} ${r.car.model}</b> · ${r.v.name}<br>${fmt$(r.price.value)} ${r.price.label}<br>${bootOf(r.car)} L boot · ${m(r.car.length)} long${r.v.range ? ` · ${r.v.range} km` : ""}${resaleOf(r.car) ? `<br>Keeps ~${resaleOf(r.car).pct}% after 3 yrs (≈ ${fmt$(resaleValue(r.car, r.v))})` : ""}`;
      tip.style.left = (e.clientX - wr.left) + "px"; tip.style.top = (e.clientY - wr.top) + "px"; tip.style.opacity = 1;
    });
    svg.addEventListener("mouseleave", () => tip.style.opacity = 0);
    svg.addEventListener("click", e => { const d = e.target.closest(".dot"); if (d) openDetail(d.dataset.id); });
  }

  // ---------- update ----------
  let update = function () {
    persist();
    const rows = results();
    const total = D.cars.length;
    $("#resultCount").textContent = `${rows.length} of ${total} electric cars`;
    const cheapest = rows.length ? rows.reduce((a, b) => a.price.value < b.price.value ? a : b) : null;
    const biggest = rows.length ? rows.reduce((a, b) => bootOf(a.car) > bootOf(b.car) ? a : b) : null;
    $("#resultSub").textContent = rows.length ? `Cheapest: ${cheapest.car.brand} ${cheapest.car.model} at ${fmt$(cheapest.price.value)} · Biggest boot: ${biggest.car.brand} ${biggest.car.model} at ${bootOf(biggest.car)} L` : "";
    $("#budgetHint").textContent = (state.priceMode === "driveaway" ? `Filtering on estimated driveaway price in ${state.stateCode}` : "Filtering on list price before on-road costs") + ". Type a number or drag.";
    $("#grid").classList.toggle("hidden", state.view !== "grid");
    $("#chartView").classList.toggle("hidden", state.view !== "chart");
    if (state.view === "grid") renderGrid(rows); else renderChart(rows);
    renderTray(); renderSaved();
  };

  // ---------- saved searches ----------
  function renderSaved() {
    const el = $("#savedList"); const cur = pickFilters();
    el.innerHTML = state.presets.length ? state.presets.map((p, i) => { const n = countFor(p.f); return `<div class="saved-item ${sameFilters(p.f, cur) ? "on" : ""}"><button class="load" data-load="${i}">${p.name}<small>${n} car${n === 1 ? "" : "s"} · ${p.f.priceMode === "rrp" ? "list price" : "driveaway " + p.f.stateCode}</small></button><button class="del" data-del="${i}" aria-label="Delete">×</button></div>`; }).join("") : `<div class="f-hint">Nothing saved yet. Set up filters, give them a name below and hit Save.</div>`;
    $$("[data-load]", el).forEach(b => b.onclick = () => { Object.assign(state, JSON.parse(JSON.stringify(state.presets[+b.dataset.load].f))); initFilters(); update(); });
    $$("[data-del]", el).forEach(b => b.onclick = () => { state.presets.splice(+b.dataset.del, 1); update(); });
  }
  function countFor(f) { const keep = pickFilters(); Object.assign(state, f); const n = results().length; Object.assign(state, keep); return n; }

  // ---------- compare tray ----------
  function renderTray() {
    const tray = $("#compareTray");
    tray.classList.toggle("hidden", state.compare.length === 0);
    $("#trayItems").innerHTML = state.compare.map(id => { const c = D.cars.find(x => x.id === id); return c ? `<span>${c.brand} ${c.model}<button data-rm="${id}" aria-label="Remove">×</button></span>` : ""; }).join("");
  }
  function toggleCompare(id) {
    if (state.compare.includes(id)) state.compare = state.compare.filter(x => x !== id);
    else { if (state.compare.length >= 4) state.compare.shift(); state.compare.push(id); }
    update();
  }

  // ---------- overlay history ----------
  // Every overlay (filter sheet, detail, hologram, studio, compare) pushes a history entry, so the
  // phone's back button / swipe closes the top overlay instead of leaving the site.
  const layers = []; let skipPops = 0;
  const pushLayer = name => { if (layers.includes(name)) return; layers.push(name); history.pushState({ layer: name }, ""); };
  // a layer closed from the UI: drop it (and anything above it) and rewind history to match
  const dropLayer = name => { const i = layers.lastIndexOf(name); if (i < 0) return; const n = layers.length - i; layers.splice(i); skipPops++; history.go(-n); };
  window.addEventListener("popstate", () => {
    if (skipPops) { skipPops--; return; }
    const top = layers.pop(); if (!top) return;
    if (top === "studio") closeStudio(true); else if (top === "holo") closeHoloModal(true); else if (top === "filters") closeF(true); else closeModals(true);
  });

  // ---------- detail / configurator ----------
  let detail = null; // { car, vIdx, paintIdx, tab, refId, hud }
  let stopHud = null;
  function openDetail(id) {
    const car = D.cars.find(c => c.id === id); if (!car) return;
    const chosen = state.chosen[id] || {};
    const passing = car.variants.findIndex(v => passesVariant(v, car));
    const dp = paintsFor(car).findIndex(p => p.name === defaultPaint(car).name);
    detail = { car, vIdx: chosen.v != null ? chosen.v : Math.max(0, passing), paintIdx: chosen.p != null ? chosen.p : Math.max(0, dp), tab: "footprint", refId: state.refId || "rav4", hud: !!car.hud };
    renderDetail();
    $("#detailModal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
    pushLayer("detail");
  }
  const stopHolo = () => { if (stopHud) { (stopHud.dispose || stopHud)(); stopHud = null; } };
  function closeModals(fromBack) {
    if (bigHolo) { bigHolo.dispose(); bigHolo = null; } if (studio) { saveStudio(); studio.ctl.dispose(); studio = null; }
    $$(".modal").forEach(mo => mo.classList.add("hidden")); document.body.style.overflow = ""; stopHolo(); detail = null;
    if (!fromBack) { const first = layers.findIndex(l => l !== "filters"); if (first >= 0) dropLayer(layers[first]); }
  }

  function bagsHtml(litres) {
    const big = Math.floor(litres / 90), rem = litres - big * 90, small = Math.floor(rem / 40);
    return `<div class="bags">${'<span class="bag" title="Large check-in suitcase, about 90 L"></span>'.repeat(Math.min(big, 12))}${'<span class="bag small" title="Carry-on bag, about 40 L"></span>'.repeat(small)}</div>
      <div class="note">Roughly <b>${big}</b> large check-in suitcase${big === 1 ? "" : "s"}${small ? ` plus <b>${small}</b> carry-on${small === 1 ? "" : "s"}` : ""} (90 L and 40 L each). A rule of thumb only, as real packing depends on the boot's shape.</div>`;
  }

  function stageFootprint(car) {
    const ref = D.refs.find(r => r.id === detail.refId) || D.refs[0];
    const W = 560, H = 300, scale = 0.085; // px per mm
    const cx = W / 2, cy = H / 2;
    const rect = (L, Wd, fill, stroke, dash) => `<rect x="${cx - L * scale / 2}" y="${cy - Wd * scale / 2}" width="${L * scale}" height="${Wd * scale}" rx="${Wd * scale * 0.18}" fill="${fill}" stroke="${stroke}" stroke-width="2" ${dash ? 'stroke-dasharray="6 5"' : ""}/>`;
    const bay = rect(5400, 2400, "none", "#c9c9c3", true);
    const dL = car.length - ref.length, dW = car.width - ref.width;
    return `<div class="ref-row">Compare footprint with <select id="refSel">${D.refs.map(r => `<option value="${r.id}" ${r.id === ref.id ? "selected" : ""}>${r.name}</option>`).join("")}</select></div>
      <div class="footprint">
        <div class="fp"><svg viewBox="0 0 ${W} ${H}">${bay}${rect(ref.length, ref.width, "rgba(0,0,0,.05)", "#8a8985", false)}${rect(car.length, car.width, "rgba(42,120,214,.28)", "#2a78d6", false)}
          <text x="${cx}" y="${cy - 2400 * scale / 2 - 8}" text-anchor="middle" font-size="11" fill="#8a8985">Standard parking bay 5.4 × 2.4 m</text>
          <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="12" fill="#1b5aa8" font-weight="600">${car.brand} ${car.model}</text>
        </svg></div>
        <div class="legend">
          <div><span class="sw" style="background:rgba(42,120,214,.5);border:1px solid #2a78d6"></span><b>${car.brand} ${car.model}</b><br>${m(car.length)} × ${m(car.width)} × ${m(car.height)} tall<br>wheelbase ${m(car.wheelbase)}</div>
          <div><span class="sw" style="background:rgba(0,0,0,.08);border:1px solid #8a8985"></span><b>${ref.name}</b><br>${m(ref.length)} × ${m(ref.width)} × ${m(ref.height)} tall</div>
          <div><b>${dL === 0 ? "Same length" : (dL > 0 ? "+" : "−") + Math.abs(dL / 10).toFixed(0) + " cm long"}</b>, <b>${dW === 0 ? "same width" : (dW > 0 ? "+" : "−") + Math.abs(dW / 10).toFixed(0) + " cm wide"}</b> vs the ${ref.name.split(" (")[0]}</div>
          <div>${car.length <= 5400 ? "Fits a standard 5.4 m bay with " + ((5400 - car.length) / 10).toFixed(0) + " cm spare" : "Overhangs a standard 5.4 m bay by " + ((car.length - 5400) / 10).toFixed(0) + " cm"}. In a 6 m garage you'd have ${((6000 - car.length) / 10).toFixed(0)} cm front-to-back.</div>
        </div>
      </div>`;
  }
  function stageBoot(car) {
    const ref = D.refs.find(r => r.id === detail.refId) || D.refs[0];
    const max = 900;
    const bar = (label, val, cls = "") => `<div class="boot-bar"><span>${label}</span><div class="track"><div class="fill ${cls}" style="width:${Math.min(100, val / max * 100)}%"></div></div><b>${val ? val + " L" : "—"}</b></div>`;
    const rows = [bar(`${car.model} · ${car.seats >= 6 ? "all seats up" : "seats up"}`, car.boot || 0)];
    if (car.boot5) rows.push(bar(`${car.model} · as 5-seater`, car.boot5));
    if (car.frunk) rows.push(bar(`${car.model} · frunk`, car.frunk));
    rows.push(bar(`${ref.name.split(" (")[0]} · seats up`, ref.boot, "ref"));
    if (ref.boot5) rows.push(bar(`${ref.name.split(" (")[0]} · as 5-seater`, ref.boot5, "ref"));
    const total = (car.boot || 0) + (car.frunk || 0);
    const bootMain = car.boot != null ? car.boot : car.boot5;
    return `<div class="ref-row">Compare boot with <select id="refSel">${D.refs.filter(r => r.boot).map(r => `<option value="${r.id}" ${r.id === ref.id ? "selected" : ""}>${r.name}</option>`).join("")}</select></div>
      <h3>${car.boot != null ? `${car.boot} L behind the ${car.seats >= 6 ? "third" : "rear"} seats` : `${car.boot5} L behind the second row (no third-row figure published)`}${car.frunk ? `, plus ${car.frunk} L under the bonnet${car.boot != null ? ` (${total} L total)` : ""}` : ""}${car.bootMax ? `. Fold the seats for up to ${car.bootMax} L` : ""}.</h3>
      ${bagsHtml(bootMain)}
      <div class="boot-bars">${rows.join("")}</div>
      <p class="note">Litres are each brand's published VDA figure with seats up, which is the most comparable number available but is still measured a little differently brand to brand. Tesla quotes total cargo including underfloor bins, so its numbers run high.</p>`;
  }
  function stageSize(car) {
    // rank among all cars by length and boot
    const all = D.cars;
    const pctL = Math.round(all.filter(c => c.length < car.length).length / all.length * 100);
    const pctB = Math.round(all.filter(c => bootOf(c) < bootOf(car)).length / all.length * 100);
    const bodyPeers = all.filter(c => c.body === car.body && c.id !== car.id);
    const peers = [...bodyPeers].sort((a, b) => Math.abs(a.length - car.length) - Math.abs(b.length - car.length)).slice(0, 5);
    const H = 150, W = 560, scale = 0.07, base = 130;
    const outline = (c, x, fill, stroke) => { const w = c.width * scale, h = c.height * scale; return `<rect x="${x - w / 2}" y="${base - h}" width="${w}" height="${h}" rx="${h * 0.18}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`; };
    const ref = D.refs.find(r => r.id === detail.refId) || D.refs[0];
    const px = 56;
    const persons = `<g fill="#8a8985"><circle cx="${px}" cy="${base - 118}" r="7"/><rect x="${px - 6}" y="${base - 108}" width="12" height="40" rx="5"/><rect x="${px - 5}" y="${base - 70}" width="4" height="70"/><rect x="${px + 1}" y="${base - 70}" width="4" height="70"/></g><text x="${px}" y="${base + 16}" text-anchor="middle" font-size="10" fill="#8a8985">1.75 m</text>`;
    return `<h3>Front view, to scale</h3>
      <svg viewBox="0 0 ${W} ${H}">${outline(ref, 170, "rgba(0,0,0,.06)", "#8a8985")}${outline(car, 170, "rgba(42,120,214,.3)", "#2a78d6")}
        <line x1="20" x2="${W - 20}" y1="${base}" y2="${base}" stroke="#c9c9c3"/>
        <text x="330" y="${base - 95}" font-size="12" fill="#1b5aa8" font-weight="600">${car.brand} ${car.model} · ${m(car.width)} wide, ${m(car.height)} tall</text>
        <text x="330" y="${base - 75}" font-size="12" fill="#52514e">${ref.name} · ${m(ref.width)} wide, ${m(ref.height)} tall</text>
        ${persons}
      </svg>
      <div class="note">Longer than <b>${pctL}%</b> of the EVs on sale, with a bigger boot than <b>${pctB}%</b> of them.</div>
      <h3 style="margin-top:14px">Closest-sized ${BODY_LABEL[car.body]}s</h3>
      <div class="boot-bars">${peers.map(p => `<div class="boot-bar peer" data-open="${p.id}" style="cursor:pointer"><span>${p.brand} ${p.model}</span><div class="track"><div class="fill ${p.length > car.length ? "" : "ref"}" style="width:${(p.length - 3400) / 2000 * 100}%"></div></div><b>${m(p.length)}</b></div>`).join("")}</div>`;
  }

  function renderDetail() {
    const { car } = detail;
    const v = car.variants[detail.vIdx] || car.variants[0];
    const paints = paintsFor(car); const paint = paints[detail.paintIdx] || paints[0];
    const bd = breakdown(car, v, paint.price, state.stateCode);
    const quoteKey = car.id + "|" + v.name;
    const panel = $("#detailPanel");
    const stage = detail.tab === "footprint" ? stageFootprint(car) : detail.tab === "boot" ? stageBoot(car) : stageSize(car);
    const spec = (k, val, unit = "") => `<div class="spec"><div class="k">${k}</div><div class="v">${val == null || val === "" ? "—" : val}<small> ${unit}</small></div></div>`;
    panel.innerHTML = `
      <button class="close" data-close aria-label="Close">×</button>
      <div class="detail">
        <div class="d-stage">
          <div class="d-title">${logoImg(car.brand, "dlogo")}<div><div class="b">${car.brand}</div><h2>${car.model}</h2><div class="meta">${BODY_LABEL[car.body]} · ${car.seats} seats · ${sizeTag(car)}</div></div></div>
          <div class="hero" id="heroBox">${photo(car, paint.hex, "hero-img")}</div>
          ${car.hud || car.studio ? `<div class="hero-tools">${car.studio ? `<button id="studioOpen" class="studio-btn">🎨 Customise in 3D</button>` : ""}${car.hud ? `<button id="holoOpen" class="holo-btn">⬡ Open 3D hologram</button>` : ""}</div>` : ""}
          <div class="stage-tabs">
            <button data-tab="footprint" class="${detail.tab === "footprint" ? "on" : ""}">Footprint</button>
            <button data-tab="boot" class="${detail.tab === "boot" ? "on" : ""}">Boot space</button>
            <button data-tab="size" class="${detail.tab === "size" ? "on" : ""}">Size vs others</button>
          </div>
          <div class="stage-body">${stage}</div>
        </div>
        <div class="d-config">
          <div>
            <h3>Variant</h3>
            <div class="variants">${car.variants.map((x, i) => { const p = shownPrice(car, x, paint.price); return `<button class="variant ${i === detail.vIdx ? "on" : ""}" data-v="${i}">
              <span class="vn">${x.name}</span><span class="vp">${fmt$(p.value)}</span>
              <span class="vs">${[x.range ? x.range + " km WLTP" : null, x.battery ? x.battery + " kWh" : null, x.power ? x.power + " kW" : null, x.drive, x.accel ? "0–100 in " + x.accel + "s" : null].filter(Boolean).join(" · ")}${x.offer ? ` · <b style="color:var(--good)">${x.offer.label}</b>` : ""}</span></button>`; }).join("")}</div>
          </div>
          <div>
            <h3>Paint <span style="font-weight:500;text-transform:none;letter-spacing:0">· surcharges indicative, check with the brand</span></h3>
            <div class="paints">${paints.map((p, i) => `<button class="paint ${i === detail.paintIdx ? "on" : ""}" data-p="${i}" style="background:${p.hex}" title="${p.name}${p.price ? " +" + fmt$(p.price) : ""}" aria-label="${p.name}"></button>`).join("")}</div>
            <div class="paint-name">${paint.name} · ${paint.price ? "+" + fmt$(paint.price) : "no cost"}</div>
          </div>
          <div class="price-box">
            <div class="big">${fmt$(bd.driveaway)}<small>${bd.quoted ? "your quote" : bd.type === "driveaway" ? (bd.offer ? "offer driveaway" : "driveaway (brand-quoted)") : "est. driveaway in " + state.stateCode}</small></div>
            ${bd.offer && !bd.quoted ? `<div class="foot" style="color:var(--good);font-weight:600">${bd.offer.label}. Regular ${v.priceType === "driveaway" ? "driveaway" : "list"} price ${fmt$(v.price)}.</div>` : ""}
            <table>${bd.items.map(([k, val]) => `<tr><td>${k}</td><td>${fmt$(val)}</td></tr>`).join("")}</table>
            ${bd.type === "rrp" && !bd.quoted ? `<div class="foot">${D.states[state.stateCode].name}: ${D.states[state.stateCode].dutyNote} Rego and delivery are estimates. Switch state in the top bar.</div>` : ""}
            ${bd.type === "driveaway" && !bd.quoted ? `<div class="foot">${car.brand} quotes a national driveaway price, so it already includes stamp duty, rego and delivery.</div>` : ""}
            ${(() => { const rs = resaleOf(car); if (!rs) return ""; const rv = resaleValue(car, v, paint.price); return `<div class="resale-box ${resaleTier(rs.pct)}"><div><b>Worth about ${fmt$(rv)} after 3 years</b><span>Keeps ~${rs.pct}% of its ${bd.type === "driveaway" ? "driveaway" : "list"} price, so you'd lose about ${fmt$(bd.driveaway - rv)} including on-road costs${rs.basis === "estimate" ? ". Estimate: too new for much used-market data" : ""}.</span></div><span class="meter"><i style="width:${rs.pct}%"></i></span><div class="rnote">${esc(rs.note)}</div></div>`; })()}
            <div class="quote"><label>Got a dealer quote?</label><input type="number" id="quoteIn" placeholder="e.g. 61500" value="${state.quotes[quoteKey] || ""}"><button class="link" id="quoteSave">Save</button>${state.quotes[quoteKey] ? `<button class="link" id="quoteClear">Clear</button>` : ""}</div>
          </div>
          <div>
            <h3>Specs</h3>
            <div class="specs">
              ${spec("Boot, seats up", car.boot, "L")}${spec("Boot, seats folded", car.bootMax, "L")}${spec("Frunk", car.frunk || null, "L")}
              ${spec("Length", m(car.length))}${spec("Width", m(car.width))}${spec("Height", m(car.height))}
              ${spec("Range (WLTP)", v.range, "km")}${spec("Battery", v.battery, "kWh")}${spec("DC charging", v.dc, "kW peak")}
              ${spec("Power", v.power, "kW")}${spec("0–100 km/h", v.accel, "s")}${spec("Drive", v.drive)}
              ${spec("Towing (braked)", car.towing || "Not rated", car.towing ? "kg" : "")}${spec("Kerb weight", car.kerb, "kg")}${spec("Wheelbase", m(car.wheelbase))}
              ${spec("Resale after 3 yrs", resaleOf(car) ? resaleOf(car).pct + "%" : null, resaleOf(car)?.basis === "estimate" ? "est." : "kept")}
            </div>
          </div>
          <div class="d-actions">
            <button class="primary" id="dCompare">${state.compare.includes(car.id) ? "✓ In compare list" : "+ Add to compare"}</button>
            <button class="ghost" data-close>Back to showroom</button>
          </div>
          <div class="src">Prices as of ${car.asOf}. ${car.notes || ""} ${credit(car)}</div>
        </div>
      </div>`;
    // wire
    stopHolo();
    const ho = $("#holoOpen", panel); if (ho) ho.onclick = () => openHoloModal(car, v);
    const so = $("#studioOpen", panel); if (so) so.onclick = () => openStudio(car);
    $$(".variant", panel).forEach(b => b.onclick = () => { detail.vIdx = +b.dataset.v; state.chosen[car.id] = { v: detail.vIdx, p: detail.paintIdx }; persist(); renderDetail(); });
    $$(".paint", panel).forEach(b => b.onclick = () => { detail.paintIdx = +b.dataset.p; state.chosen[car.id] = { v: detail.vIdx, p: detail.paintIdx }; persist(); renderDetail(); });
    $$(".stage-tabs button", panel).forEach(b => b.onclick = () => { detail.tab = b.dataset.tab; renderDetail(); });
    const rs = $("#refSel", panel); if (rs) rs.onchange = () => { detail.refId = rs.value; state.refId = rs.value; persist(); renderDetail(); };
    $("#dCompare", panel).onclick = () => { toggleCompare(car.id); renderDetail(); };
    $("#quoteSave", panel).onclick = () => { const n = +$("#quoteIn", panel).value; if (n > 1000) state.quotes[quoteKey] = n; else delete state.quotes[quoteKey]; persist(); renderDetail(); update(); };
    const qc = $("#quoteClear", panel); if (qc) qc.onclick = () => { delete state.quotes[quoteKey]; persist(); renderDetail(); update(); };
    $$("[data-open]", panel).forEach(el => el.onclick = () => openDetail(el.dataset.open));
  }

  // ---------- full-screen hologram ----------
  let bigHolo = null;
  function partInfo(car, v, key) {
    const sp = shownPrice(car, v, 0);
    const kv = rows => `<div class="kv">${rows.filter(r => r[1] != null && r[1] !== "").map(([k, val]) => `<span>${k}</span><span>${val}</span>`).join("")}</div>`;
    const hrs = v.battery && v.ac ? (v.battery / v.ac).toFixed(1) : null;
    const dcMin = v.battery && v.dc ? Math.round(v.battery * 0.7 / (v.dc * 0.55) * 60) : null;
    const ref = D.refs.find(r => r.id === "rav4");
    const litres = car.boot != null ? car.boot : car.boot5;
    const bags = litres ? `${Math.floor(litres / 90)} large suitcases${Math.floor((litres % 90) / 40) ? ` + ${Math.floor((litres % 90) / 40)} carry-on` : ""}` : "";
    const info = {
      null: { h: `${car.brand} ${car.model}`, sub: `${v.name} · ${BODY_LABEL[car.body]} · ${car.seats} seats`, body: kv([["Price", `${fmt$(sp.value)} ${sp.label}`], ["Length", m(car.length)], ["Width", m(car.width)], ["Height", m(car.height)], ["Wheelbase", m(car.wheelbase)], ["Boot", litres ? litres + " L" : null], ["Range (WLTP)", v.range ? v.range + " km" : null], ["Battery", v.battery ? v.battery + " kWh" : null], ["Drive", v.drive], ["Kerb weight", car.kerb ? car.kerb + " kg" : null]]) + `<p>Click any part of the hologram, or pick one below, to see what the data says about it.</p>` },
      body: { h: "Body shell", sub: sizeTag(car), body: kv([["Length", m(car.length)], ["Width (mirrors folded)", m(car.width)], ["Height", m(car.height)], ["Wheelbase", m(car.wheelbase)], ["Front + rear overhang", m(car.length - car.wheelbase)], ["Body style", BODY_LABEL[car.body]], ["Kerb weight", car.kerb ? car.kerb + " kg" : null], ["vs Toyota RAV4", `${car.length - ref.length > 0 ? "+" : ""}${Math.round((car.length - ref.length) / 10)} cm long, ${car.width - ref.width > 0 ? "+" : ""}${Math.round((car.width - ref.width) / 10)} cm wide`]]) + `<p>${car.length <= 5400 ? `Fits a standard 5.4 m parking bay with ${Math.round((5400 - car.length) / 10)} cm to spare` : `Overhangs a standard 5.4 m bay by ${Math.round((car.length - 5400) / 10)} cm`}. In a 6 m garage you would have ${Math.round((6000 - car.length) / 10)} cm front to back.</p><p>The shell is lofted from the ${BODY_LABEL[car.body].toLowerCase()} side profile and scaled to these exact dimensions; it is schematic, not the manufacturer's surface data.</p>` },
      glass: { h: "Glasshouse", sub: "Windows, roof and pillars", body: kv([["Overall height", m(car.height)], ["Seats", car.seats], ["Rows", car.seats >= 6 ? 3 : 2]]) + `<p>Pulled apart, the glasshouse lifts off so you can see the seating and the cargo volumes underneath.</p>` },
      trim: { h: "Lights and mirrors", sub: "Exterior details", body: kv([["Width incl. mirrors", "roughly " + m(car.width + 220)], ["Charge port", `${v.dc || "—"} kW DC peak`]]) + `<p>Published widths exclude mirrors; allow about 22 cm more for them when judging a tight garage.</p>` },
      battery: { h: `Battery · ${v.battery || "—"} kWh`, sub: "Skateboard pack under the floor", body: kv([["Capacity", v.battery ? v.battery + " kWh (as quoted by the brand)" : null], ["Range (WLTP)", v.range ? v.range + " km" : null], ["Efficiency", v.battery && v.range ? (v.battery / v.range * 100).toFixed(1) + " kWh / 100 km" : null], ["DC fast charge", v.dc ? v.dc + " kW peak" : null], ["Est. 10 to 80% DC", dcMin ? `about ${dcMin} min` : null], ["AC charge", v.ac ? v.ac + " kW" : null], ["Est. 0 to 100% AC", hrs ? `about ${hrs} h` : null]]) + `<p>The slab is drawn ${Math.round((0.09 + (v.battery || 60) / 900) * 100)} cm thick to represent the capacity. The 10 to 80% time is a rough estimate from peak power; real curves taper.</p>` },
      "motor-f": { h: "Front motor", sub: v.drive === "AWD" ? "Part of the all-wheel-drive pair" : "Front-wheel drive", body: kv([["System power", v.power ? v.power + " kW" : null], ["0 to 100 km/h", v.accel ? v.accel + " s" : null], ["Drive", v.drive], ["Towing (braked)", car.towing ? car.towing + " kg" : "Not rated"]]) + `<p>Power is the combined system figure the brand quotes${v.drive === "AWD" ? ", split across both motors" : ""}.</p>` },
      "motor-r": { h: "Rear motor", sub: v.drive === "AWD" ? "Part of the all-wheel-drive pair" : "Rear-wheel drive", body: kv([["System power", v.power ? v.power + " kW" : null], ["0 to 100 km/h", v.accel ? v.accel + " s" : null], ["Drive", v.drive], ["Towing (braked)", car.towing ? car.towing + " kg" : "Not rated"]]) + `<p>Power is the combined system figure the brand quotes${v.drive === "AWD" ? ", split across both motors" : ""}.</p>` },
      boot: { h: `Boot · ${litres || "—"} L`, sub: car.boot == null ? "Behind the second row (no third-row figure published)" : car.seats >= 6 ? "Behind the third row" : "Behind the rear seats", body: kv([["Seats up", car.boot != null ? car.boot + " L" : null], ["As a 5-seater", car.boot5 ? car.boot5 + " L" : null], ["Seats folded", car.bootMax ? car.bootMax + " L" : null], ["Frunk", car.frunk ? car.frunk + " L" : null], ["Rough capacity", bags], ["vs Toyota RAV4 (542 L)", litres ? `${litres - 542 > 0 ? "+" : ""}${litres - 542} L` : null]]) + `<p>The box is sized to the published litres. Brands measure a little differently; Tesla and Cadillac quote total cargo rather than VDA, so theirs run high.</p>` },
      frunk: { h: `Frunk · ${car.frunk || 0} L`, sub: "Storage under the bonnet", body: kv([["Volume", car.frunk + " L"], ["Good for", car.frunk >= 80 ? "a cabin bag or charging cables and groceries" : car.frunk >= 40 ? "charging cables and a small bag" : "charging cables"]]) },
      port: { h: "Charge port", sub: "Charging", body: kv([["DC fast charge", v.dc ? v.dc + " kW peak" : null], ["Est. 10 to 80% DC", dcMin ? `about ${dcMin} min` : null], ["AC onboard charger", v.ac ? v.ac + " kW" : null], ["Est. 0 to 100% AC", hrs ? `about ${hrs} h` : null], ["Battery", v.battery ? v.battery + " kWh" : null]]) + `<p>Port position on the model is illustrative; real location varies by brand.</p>` },
    };
    const seatKey = k => /^seat-/.test(k); const wheelKey = k => /^wheel-/.test(k);
    if (seatKey(key)) return { h: "Seating", sub: `${car.seats} seats in ${car.seats >= 6 ? "three" : "two"} rows`, body: kv([["Seats", car.seats], ["Wheelbase (cabin length proxy)", m(car.wheelbase)], ["Width", m(car.width)], ["Height", m(car.height)]]) + `<p>Seat positions are laid out from the wheelbase and seat count, not from interior measurements.</p>` };
    if (wheelKey(key)) return { h: "Wheels and suspension", sub: "Rolling chassis", body: kv([["Wheelbase", m(car.wheelbase)], ["Track (approx.)", m(car.width - 260)], ["Kerb weight", car.kerb ? car.kerb + " kg" : null], ["Drive", v.drive], ["Towing (braked)", car.towing ? car.towing + " kg" : "Not rated"]]) + `<p>Wheel size is drawn by body type, not the car's actual tyre spec.</p>` };
    return info[key] || info[null];
  }
  function openHoloModal(car, v) {
    stopHolo();
    const stage = $("#holoStage");
    stage.innerHTML = `<div class="holo-view" id="holoView"></div>
      <aside class="holo-side" id="holoSide"></aside>
      <div class="holo-bar">
        <label class="holo-ctl">Pull apart <input type="range" id="bigExplode" min="0" max="100" value="${Math.round((detail?.explode || 0) * 100)}"></label>
        <button id="bigSpin" class="${detail?.spin !== false ? "on" : ""}">Spin</button><button id="bigLabels" class="${detail?.labels !== false ? "on" : ""}">Labels</button><button id="bigReset">Reset view</button>
        <button class="close-holo" data-close>Close ×</button>
      </div>
      <button class="x-close holo-x" data-close aria-label="Close hologram">×</button>`;
    $("#holoModal").classList.remove("hidden"); document.body.style.overflow = "hidden"; pushLayer("holo");
    const side = $("#holoSide");
    let current = null;
    const renderSide = key => {
      current = key; const i = partInfo(car, v, key);
      side.innerHTML = `<h2>${key ? "Selected part" : "Hologram"}</h2><h3>${i.h}</h3><div class="sub">${i.sub || ""}</div>${i.body}
        <h2 style="margin-top:14px">Parts</h2><div class="parts">${[["", "Overview"], ...bigHolo.parts().filter(p => !/^seat-|^wheel-/.test(p.key)).map(p => [p.key, p.label.replace(/ · .*/, "")]), ["seat-front-0", "Seats"], ["wheel-fl", "Wheels"]].map(([k, l]) => `<button data-part="${k}" class="${(k || null) === key ? "on" : ""}">${l}</button>`).join("")}</div>
        <div class="hint">${matchMedia("(pointer: coarse)").matches ? "Drag to orbit · pinch to zoom · tap a part · × or back to close" : "Drag to orbit · scroll to zoom · click a part · Esc to close"}</div>`;
      $$("[data-part]", side).forEach(b => b.onclick = () => bigHolo.select(b.dataset.part || null, false));
    };
    bigHolo = window.startHolo($("#holoView"), car, v, { explode: detail?.explode || 0, autoRotate: detail?.spin !== false, labels: detail?.labels !== false,
      onSelect: key => { renderSide(key); }, onExplode: x => { const ex = $("#bigExplode"); if (ex) ex.value = Math.round(x * 100); if (detail) detail.explode = x; } });
    renderSide(null);
    $("#bigExplode").oninput = e => bigHolo.setExplode(+e.target.value / 100);
    $("#bigSpin").onclick = e => { e.target.classList.toggle("on"); bigHolo.setAutoRotate(e.target.classList.contains("on")); if (detail) detail.spin = e.target.classList.contains("on"); };
    $("#bigLabels").onclick = e => { e.target.classList.toggle("on"); bigHolo.setLabels(e.target.classList.contains("on")); if (detail) detail.labels = e.target.classList.contains("on"); };
    $("#bigReset").onclick = () => bigHolo.reset();
  }
  function closeHoloModal(fromBack) { if (!bigHolo) return; bigHolo.dispose(); bigHolo = null; $("#holoModal").classList.add("hidden"); document.body.style.overflow = detail ? "hidden" : ""; if (!fromBack) dropLayer("holo"); }

  // ---------- 3D paint-and-trim studio ----------
  let studio = null; // { car, ctl, vIdx, paintIdx, interior, spin }
  const swatchCss = p => `background:${p.finish === "metallic" ? `radial-gradient(circle at 32% 28%, #fff9 0, ${p.hex} 38%, ${p.hex} 62%, #0004 100%)` : p.finish === "pearl" ? `radial-gradient(circle at 32% 28%, #fffc 0, ${p.hex} 45%, ${p.hex} 100%)` : p.hex}`;
  function openStudio(car) {
    const cfg = window.EV_STUDIO && window.EV_STUDIO[car.id]; if (!cfg || !window.startStudio) return;
    const ch = state.chosen[car.id] || {};
    studio = { car, cfg, vIdx: detail ? detail.vIdx : ch.v || 0, paintIdx: detail ? detail.paintIdx : ch.p || 0, interior: ch.i || cfg.interiors[0].name, spin: true };
    const stage = $("#studioStage");
    stage.innerHTML = `<div class="studio-view" id="studioView"></div><aside class="studio-side" id="studioSide"></aside>
      <div class="studio-bar"><span class="lbl">View</span>${[["front", "Front ¾"], ["side", "Side"], ["rear", "Rear ¾"], ["nose", "Front"], ["top", "Top"]].map(([k, l]) => `<button data-view="${k}">${l}</button>`).join("")}<button id="studioSpin" class="on">Spin</button><span class="hint">Drag to turn · scroll to zoom</span></div>
      <button class="x-close studio-x" data-close aria-label="Close configurator">×</button>`;
    $("#studioModal").classList.remove("hidden"); document.body.style.overflow = "hidden"; pushLayer("studio");
    const v = car.variants[studio.vIdx], paint = paintsFor(car)[studio.paintIdx];
    studio.ctl = window.startStudio($("#studioView"), car, { paint, look: cfg.variants[v.name] }, { onSpin: on => { studio.spin = on; $("#studioSpin").classList.toggle("on", on); } });
    $$("[data-view]", stage).forEach(b => b.onclick = () => studio.ctl.setView(b.dataset.view));
    $("#studioSpin").onclick = () => { studio.spin = !studio.spin; studio.ctl.setAutoRotate(studio.spin); $("#studioSpin").classList.toggle("on", studio.spin); };
    renderStudioSide();
  }
  function saveStudio() {
    const { car, vIdx, paintIdx, interior } = studio;
    state.chosen[car.id] = { v: vIdx, p: paintIdx, i: interior };
    if (detail && detail.car.id === car.id) { detail.vIdx = vIdx; detail.paintIdx = paintIdx; }
    persist();
  }
  function renderStudioSide() {
    const { car, cfg } = studio, side = $("#studioSide");
    const v = car.variants[studio.vIdx], look = cfg.variants[v.name];
    const paints = paintsFor(car), paint = paints[studio.paintIdx] || paints[0];
    const interiors = cfg.interiors.filter(i => !i.only || i.only.includes(v.name));
    if (!interiors.some(i => i.name === studio.interior)) studio.interior = interiors[0].name;
    const bd = breakdown(car, v, paint.price, state.stateCode);
    side.innerHTML = `<div class="s-head"><div class="b">${car.brand}</div><h2>${car.model} <span>· build yours</span></h2></div>
      <h3>Grade</h3>
      <div class="s-grades">${car.variants.map((x, i) => { const lk = cfg.variants[x.name] || {}; return `<button class="s-grade ${i === studio.vIdx ? "on" : ""}" data-sv="${i}"><span class="n">${x.name}</span><span class="p">${fmt$(shownPrice(car, x, paint.price).value)}</span>
        <span class="d">${[x.range ? x.range + " km" : null, x.battery ? x.battery + " kWh" : null, x.power ? x.power + " kW" : null].filter(Boolean).join(" · ")}</span>
        <span class="d">${[lk.wheelLabel, lk.roofLabel, ...(lk.extras || [])].filter(Boolean).join(" · ")}</span></button>`; }).join("")}</div>
      <h3>Paint <span class="sub">${paint.name} · ${paint.price ? "+" + fmt$(paint.price) : "no cost"}</span></h3>
      <div class="s-paints">${paints.map((p, i) => `<button class="s-paint ${i === studio.paintIdx ? "on" : ""}" data-sp="${i}" title="${p.name}${p.price ? " +" + fmt$(p.price) : ""}"><i style="${swatchCss(p)}"></i><span>${p.name}</span><small>${p.price ? "+" + fmt$(p.price) : "Included"}</small></button>`).join("")}</div>
      <h3>Interior <span class="sub">${studio.interior}</span></h3>
      <div class="s-interiors">${cfg.interiors.map(it => { const ok = !it.only || it.only.includes(v.name); return `<button class="s-int ${it.name === studio.interior ? "on" : ""}" data-si="${it.name}" ${ok ? "" : "disabled"}><i style="background:${it.hex}"></i>${it.name}${ok ? "" : `<small>${it.only.join(", ")} only</small>`}</button>`; }).join("")}</div>
      <p class="s-note">Interior trim isn't modelled in 3D; the swatch shows the colour.</p>
      <h3>On this ${v.name}</h3>
      <ul class="s-feats"><li>${look.wheelLabel}</li><li>${look.roofLabel}</li>${(look.extras || []).map(x => `<li>${x}</li>`).join("")}</ul>
      <div class="s-price"><div class="big">${fmt$(bd.driveaway)}<small>${bd.quoted ? "your quote" : bd.type === "driveaway" ? "driveaway" : "est. driveaway in " + state.stateCode}</small></div>
        <div class="row"><span>${v.name} list price</span><span>${fmt$(bd.base - (paint.price || 0))}</span></div>
        <div class="row"><span>${paint.name} paint</span><span>${paint.price ? "+" + fmt$(paint.price) : "—"}</span></div>
        ${bd.type === "rrp" && !bd.quoted ? `<div class="row"><span>On-road costs (est.)</span><span>+${fmt$(bd.driveaway - bd.base)}</span></div>` : ""}
      </div>
      <div class="s-actions"><button class="primary" data-close>Done</button></div>
      <p class="s-note">The model is built from the EX2's published dimensions and is a likeness, not Geely's CAD. Paint swatches are approximate; see colours in person before you order.</p>`;
    $$("[data-sv]", side).forEach(b => b.onclick = () => { studio.vIdx = +b.dataset.sv; studio.ctl.setLook(cfg.variants[car.variants[studio.vIdx].name]); saveStudio(); renderStudioSide(); });
    $$("[data-sp]", side).forEach(b => b.onclick = () => { studio.paintIdx = +b.dataset.sp; studio.ctl.setPaint(paints[studio.paintIdx]); saveStudio(); renderStudioSide(); });
    $$("[data-si]", side).forEach(b => b.onclick = () => { studio.interior = b.dataset.si; saveStudio(); renderStudioSide(); });
  }
  function closeStudio(fromBack) {
    if (!studio) return; saveStudio(); studio.ctl.dispose(); studio = null; if (!fromBack) dropLayer("studio");
    $("#studioModal").classList.add("hidden");
    if (detail) { document.body.style.overflow = "hidden"; renderDetail(); } else document.body.style.overflow = "";
    update();
  }

  // ---------- compare table ----------
  function renderCompare() {
    const cars = state.compare.map(id => D.cars.find(c => c.id === id)).filter(Boolean);
    const panel = $("#comparePanel");
    if (!cars.length) { panel.innerHTML = `<button class="close" data-close>×</button><div class="compare"><h2>Pick up to four cars to compare</h2></div>`; return; }
    const sel = cars.map(c => { const ch = state.chosen[c.id] || {}; const i = ch.v != null ? ch.v : Math.max(0, c.variants.findIndex(v => passesVariant(v, c))); const ps = paintsFor(c); const pi = ch.p != null ? ch.p : Math.max(0, ps.findIndex(p => p.name === defaultPaint(c).name)); return { car: c, v: c.variants[i], vIdx: i, paint: ps[pi] }; });
    const row = (label, get, best, fmtv = x => x, sub) => {
      const vals = sel.map(get);
      const nums = vals.filter(x => typeof x === "number");
      const allSame = nums.length > 1 && nums.every(x => x === nums[0]);
      const target = best && nums.length && !allSame ? (best === "min" ? Math.min(...nums) : Math.max(...nums)) : null;
      return `<tr><td>${label}</td>${vals.map((x, i) => `<td class="${target != null && x === target && nums.length > 1 ? "best" : ""}">${x == null ? "—" : fmtv(x)}${sub ? `<div class="sub">${sub(sel[i])}</div>` : ""}</td>`).join("")}</tr>`;
    };
    panel.innerHTML = `<button class="close" data-close aria-label="Close">×</button>
      <div class="compare"><h2>Side by side</h2>
      <table>
        <thead><tr><th></th>${sel.map(s => `<th><div class="sil">${photo(s.car, s.paint.hex)}</div>${s.car.brand} ${s.car.model}<br>
          <select data-cv="${s.car.id}">${s.car.variants.map((v, i) => `<option value="${i}" ${i === s.vIdx ? "selected" : ""}>${v.name}</option>`).join("")}</select></th>`).join("")}</tr></thead>
        <tbody>
          ${row(state.priceMode === "rrp" ? "List price" : "Est. driveaway (" + state.stateCode + ")", s => shownPrice(s.car, s.v, s.paint.price).value, "min", fmt$, s => shownPrice(s.car, s.v, s.paint.price).label)}
          ${row("Boot, seats up", s => s.car.boot, "max", x => x + " L", s => s.car.boot5 ? s.car.boot5 + " L behind 2nd row" : "")}
          ${row("Boot, seats folded", s => s.car.bootMax, "max", x => x + " L")}
          ${row("Frunk", s => s.car.frunk || null, "max", x => x + " L")}
          ${row("Boot litres per $10k", s => Math.round(bootOf(s.car) / shownPrice(s.car, s.v, s.paint.price).value * 10000), "max", x => x + " L")}
          ${row("Resale after 3 yrs", s => resaleOf(s.car)?.pct ?? null, "max", x => x + "% kept", s => resaleOf(s.car)?.basis === "estimate" ? "estimate" : "")}
          ${row("Est. value after 3 yrs", s => resaleValue(s.car, s.v, s.paint.price), null, fmt$)}
          ${row("Est. 3-yr depreciation", s => resaleLoss(s.car, s.v, s.paint.price), "min", fmt$, () => "incl. on-road costs")}
          ${row("Length", s => s.car.length, null, m)}
          ${row("Width", s => s.car.width, null, m)}
          ${row("Height", s => s.car.height, null, m)}
          ${row("Wheelbase", s => s.car.wheelbase, "max", m)}
          ${row("Seats", s => s.car.seats, "max")}
          ${row("Body", s => BODY_LABEL[s.car.body])}
          ${row("Range (WLTP)", s => s.v.range, "max", x => x + " km")}
          ${row("Battery", s => s.v.battery, "max", x => x + " kWh")}
          ${row("DC charging peak", s => s.v.dc, "max", x => x + " kW")}
          ${row("AC charging", s => s.v.ac, "max", x => x + " kW")}
          ${row("Power", s => s.v.power, "max", x => x + " kW")}
          ${row("0–100 km/h", s => s.v.accel, "min", x => x + " s")}
          ${row("Drive", s => s.v.drive)}
          ${row("Towing (braked)", s => s.car.towing || null, "max", x => x + " kg")}
          ${row("Kerb weight", s => s.car.kerb, "min", x => x + " kg")}
          ${row("Prices as of", s => s.car.asOf)}
        </tbody></table>
        <p class="disclaimer">Bold marks the best value in each row. Variant pickers change the compared trim.</p>
      </div>`;
    $$("select[data-cv]", panel).forEach(s => s.onchange = () => { const ch = state.chosen[s.dataset.cv] || {}; state.chosen[s.dataset.cv] = { v: +s.value, p: ch.p || 0 }; persist(); renderCompare(); });
  }

  // ---------- global events ----------
  document.addEventListener("click", e => {
    if (e.target.closest("[data-close]")) { if (bigHolo && e.target.closest("#holoModal")) closeHoloModal(); else if (studio && e.target.closest("#studioModal")) closeStudio(); else closeModals(); return; }
    const cmp = e.target.closest("[data-cmp]"); if (cmp) { e.stopPropagation(); toggleCompare(cmp.dataset.cmp); return; }
    const rm = e.target.closest("[data-rm]"); if (rm) { toggleCompare(rm.dataset.rm); return; }
    const card = e.target.closest(".card"); if (card) { openDetail(card.dataset.id); return; }
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { if (bigHolo) closeHoloModal(); else if (studio) closeStudio(); else closeModals(); } });
  $("#openCompare").onclick = () => { renderCompare(); $("#compareModal").classList.remove("hidden"); document.body.style.overflow = "hidden"; pushLayer("compare"); };
  $("#clearCompare").onclick = () => { state.compare = []; update(); };

  // mobile filter sheet
  const filtersEl = $("#filters");
  const openF = () => { filtersEl.classList.add("open"); document.body.style.overflow = "hidden"; pushLayer("filters"); };
  function closeF(fromBack) { if (!filtersEl.classList.contains("open")) return; filtersEl.classList.remove("open"); if (!detail && !bigHolo && !studio) document.body.style.overflow = ""; if (fromBack !== true) dropLayer("filters"); }
  $("#openFilters").onclick = openF; $("#closeFilters").onclick = () => closeF(); $("#applyFilters").onclick = () => closeF();
  const syncApply = () => { const b = $("#applyFilters"); if (b) b.textContent = `Show ${results().length} cars`; };
  const _update = update; update = function () { _update(); syncApply(); };

  initFilters();
  update();
})();
