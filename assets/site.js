(() => {
  "use strict";

  const TECH = (window.KQL_ATTACK && window.KQL_ATTACK.techniques) || {};
  const ALL = [...(window.KQL_DETECTIONS || []), ...(window.KQL_HUNTING || [])];
  const CHEAT = window.KQL_CHEATSHEET || [];
  const BY_ID = new Map(ALL.map(q => [q.id, q]));

  const TACTICS = [
    ["reconnaissance", "Reconnaissance"],
    ["resource-development", "Resource development"],
    ["initial-access", "Initial access"],
    ["execution", "Execution"],
    ["persistence", "Persistence"],
    ["privilege-escalation", "Privilege escalation"],
    ["stealth", "Stealth"],
    ["defense-impairment", "Defense impairment"],
    ["defense-evasion", "Defense evasion"],
    ["credential-access", "Credential access"],
    ["discovery", "Discovery"],
    ["lateral-movement", "Lateral movement"],
    ["collection", "Collection"],
    ["command-and-control", "Command and control"],
    ["exfiltration", "Exfiltration"],
    ["impact", "Impact"],
    ["atlas", "AI attacks (ATLAS)"]
  ];

  const $ = sel => document.querySelector(sel);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const techName = id => (TECH[id] && TECH[id].name) || id;
  const isTested = q => q.kind === "detection";
  const plural = (n, word) => `${n} ${n === 1 ? word : word.endsWith("y") ? word.slice(0, -1) + "ies" : word + "s"}`;

  const ICON = {
    check: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5"/></svg>',
    copy: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="8.5" height="8.5" rx="1.2"/><path d="M10.5 5V3.2c0-.7-.5-1.2-1.2-1.2H3.2C2.5 2 2 2.5 2 3.2v6.1c0 .7.5 1.2 1.2 1.2H5"/></svg>',
    ext: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9 2.5h4.5V7M13.5 2.5L7.5 8.5M11.5 9.5v3.3c0 .4-.3.7-.7.7H3.2c-.4 0-.7-.3-.7-.7V5.2c0-.4.3-.7.7-.7h3.3"/></svg>'
  };

  // ---------- Index ----------
  for (const q of ALL) {
    const maps = [...(q.attack || []), ...(q.atlas || [])];
    q._cells = [
      ...(q.attack || []).map(a => `${a.tactic}|${a.technique}`),
      ...(q.atlas || []).map(a => `atlas|${a.technique}`)
    ];
    q._techs = [...new Set(maps.map(a => a.technique))];
    q._text = [
      q.id, q.title, q.description, q.how, q.severity, isTested(q) ? "tested" : "hunting",
      ...(q.tables || []), ...(q.products || []),
      ...q._techs.flatMap(t => [t, techName(t)]), q.query
    ].join(" ").toLowerCase();
  }

  const CELLS = new Map();
  for (const q of ALL) {
    for (const key of q._cells) {
      if (!CELLS.has(key)) {
        const [tactic, tech] = key.split("|");
        CELLS.set(key, { key, tactic, tech, name: techName(tech) });
      }
    }
  }
  const COLUMNS = TACTICS.filter(([id]) => [...CELLS.values()].some(c => c.tactic === id))
    .map(([id, label]) => ({
      id, label,
      cells: [...CELLS.values()].filter(c => c.tactic === id).sort((a, b) => a.name.localeCompare(b.name))
    }));

  // ---------- State (kept in the URL hash) ----------
  const state = { view: "library", s: "", table: "", in: "", tested: false, tech: "", q: "" };

  function readHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    state.view = p.get("view") === "cheatsheet" ? "cheatsheet" : "library";
    state.s = p.get("s") || "";
    state.table = p.get("table") || "";
    state.in = p.get("in") || "";
    state.tested = p.get("tested") === "1";
    state.tech = p.get("tech") || "";
    state.q = p.get("q") || "";
    if (state.q && BY_ID.has(state.q) && !p.get("view")) state.view = "library";
  }

  function writeHash() {
    const p = new URLSearchParams();
    if (state.view !== "library") p.set("view", state.view);
    if (state.s) p.set("s", state.s);
    if (state.table) p.set("table", state.table);
    if (state.in) p.set("in", state.in);
    if (state.tested) p.set("tested", "1");
    if (state.tech) p.set("tech", state.tech);
    if (state.q && state.view === "library") p.set("q", state.q);
    const h = p.toString();
    history.replaceState(null, "", h ? `#${h}` : location.pathname + location.search);
  }

  const terms = () => state.s.toLowerCase().split(/\s+/).filter(Boolean);

  function baseFiltered() {
    const t = terms();
    return ALL.filter(q =>
      (!state.table || (q.tables || []).includes(state.table)) &&
      (!state.in || (q.products || []).includes(state.in)) &&
      (!state.tested || isTested(q)) &&
      t.every(term => q._text.includes(term))
    );
  }

  // ---------- KQL highlighting ----------
  const KW = new Set(("where project extend summarize by sort order top take limit distinct count join union lookup let on kind " +
    "and or not in in~ has has_any has_all has_cs contains contains_cs startswith endswith startswith_cs endswith_cs matches regex " +
    "between asc desc mv-expand mv-apply parse with evaluate render serialize as materialize isfuzzy project-away project-rename " +
    "project-keep project-reorder make-series from to step search true false null dynamic inner innerunique leftouter leftanti " +
    "leftsemi rightanti rightouter fullouter range print invoke datatable").split(" "));
  const TOKEN = /(\/\/[^\n]*)|(@"[^"]*"|@'[^']*'|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(\b\d+(?:\.\d+)?(?:ms|d|h|m|s)?\b)|([A-Za-z_][\w-]*~?)|(\|\||\||==|!=|=~|!~|>=|<=|\.\.|[<>=!])/g;

  function highlight(src) {
    let out = "", last = 0, m;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(src))) {
      out += esc(src.slice(last, m.index));
      const [tok, com, str, num, word, op] = m;
      if (com) out += `<span class="tk-com">${esc(tok)}</span>`;
      else if (str) out += `<span class="tk-str">${esc(tok)}</span>`;
      else if (num) out += `<span class="tk-num">${esc(tok)}</span>`;
      else if (word) {
        const nextChar = src.slice(TOKEN.lastIndex).match(/^\s*(.)/);
        if (nextChar && nextChar[1] === "(" && !KW.has(word.toLowerCase())) out += `<span class="tk-fn">${esc(tok)}</span>`;
        else if (KW.has(word.toLowerCase())) out += `<span class="tk-op">${esc(tok)}</span>`;
        else out += esc(tok);
      } else if (op) out += `<span class="tk-op">${esc(tok)}</span>`;
      last = TOKEN.lastIndex;
    }
    return out + esc(src.slice(last));
  }

  // ---------- Clipboard ----------
  const toast = $("#toast");
  let toastTimer;
  function say(msg) {
    toast.textContent = msg;
    toast.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("on"), 1600);
  }
  async function copy(text, label) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (err) { say("Copy failed. Select the text and copy it manually."); ta.remove(); return; }
      ta.remove();
    }
    say(label || "Copied");
  }

  // ---------- Library ----------
  const matrixEl = $("#matrix");
  const listEl = $("#list");
  const detailEl = $("#detail");

  function buildMatrix() {
    matrixEl.style.setProperty("--cols", COLUMNS.length);
    matrixEl.innerHTML = COLUMNS.map(col => `
      <div class="tactic${col.id === "atlas" ? " atlas" : ""}" role="group" aria-labelledby="th-${col.id}">
        <div class="tactic-head"><b id="th-${col.id}">${esc(col.label)}</b><span data-col="${col.id}"></span></div>
        ${col.cells.map(c => `
          <button class="cell" type="button" title="${esc(c.name)}" data-tech="${esc(c.tech)}" data-key="${esc(c.key)}" aria-pressed="false">
            <span class="nm">${esc(c.name)}</span>
            <span class="meta"><span>${esc(c.tech)}</span><b></b></span>
          </button>`).join("")}
      </div>`).join("");
  }

  function renderMatrix(base) {
    const counts = new Map();
    for (const q of base) for (const k of q._cells) counts.set(k, (counts.get(k) || 0) + 1);
    matrixEl.querySelectorAll(".cell").forEach(el => {
      const n = counts.get(el.dataset.key) || 0;
      el.dataset.r = String(Math.min(n, 4));
      el.querySelector(".meta b").textContent = n;
      el.setAttribute("aria-pressed", String(el.dataset.tech === state.tech));
      el.setAttribute("aria-label", `${el.querySelector(".nm").textContent}, ${el.dataset.tech}, ${plural(n, "query")}`);
    });
    for (const col of COLUMNS) {
      const n = base.filter(q => q._cells.some(k => k.startsWith(col.id + "|"))).length;
      const span = matrixEl.querySelector(`[data-col="${col.id}"]`);
      if (span) span.textContent = plural(n, "query");
    }
  }

  function badge(q) {
    return isTested(q)
      ? `<span class="badge tested" title="Replayed against attack and benign logs in CI">${ICON.check}Tested</span>`
      : `<span class="badge hunt" title="Hand-written hunting query, not tested in CI">Hunting</span>`;
  }

  function renderList(items) {
    if (!items.length) {
      listEl.innerHTML = `<li class="empty"><p>No queries match these filters.</p><button class="text-btn" type="button" data-clear>Clear filters</button></li>`;
      return;
    }
    listEl.innerHTML = items.map(q => `
      <li><button class="qrow" type="button" data-id="${esc(q.id)}" aria-current="${q.id === state.q}">
        <span class="id">${esc(q.id)}</span>
        <span class="t">${esc(q.title)}</span>
        <span class="sub"><code>${esc(q._techs.join(", "))}</code> · ${esc((q.tables || []).join(", "))}</span>
        <span class="badge-wrap">${badge(q)}</span>
      </button></li>`).join("");
  }

  function scheduleText(s) {
    if (!s || (!s.frequency && !s.lookback)) return "";
    return [s.frequency && `Every ${s.frequency}`, s.lookback && `looks back ${s.lookback}`].filter(Boolean).join(", ");
  }

  function renderDetail(q) {
    if (!q) {
      detailEl.innerHTML = `<p class="muted">Pick a query to see its KQL.</p>`;
      return;
    }
    const techButtons = [...(q.attack || []), ...(q.atlas || [])]
      .map(a => `<button type="button" data-tech="${esc(a.technique)}"><code>${esc(a.technique)}</code> ${esc(techName(a.technique))}</button>`)
      .join("<br>");
    const facts = [
      ["Technique", techButtons, true],
      ["Tables", esc((q.tables || []).join(", "))],
      ["Runs in", esc((q.products || []).join(", "))],
      q.severity && ["Severity", `<span class="${q.severity === "High" ? "sev-high" : ""}">${esc(q.severity)}</span>`],
      scheduleText(q.schedule) && ["Schedule", esc(scheduleText(q.schedule))]
    ].filter(Boolean);

    const tuning = Object.entries(q.tuning || {});
    const sections = [];
    sections.push(`<section class="d-sec"><h3>What it finds</h3><p>${esc(q.description)}</p></section>`);
    if (q.how) sections.push(`<section class="d-sec"><h3>How the KQL works</h3><p>${esc(q.how)}</p></section>`);
    if (tuning.length) sections.push(`<section class="d-sec"><h3>Tuning</h3><dl class="tuning">${tuning.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl></section>`);
    if ((q.falsePositives || []).length) sections.push(`<section class="d-sec"><h3>False positives</h3><ul>${q.falsePositives.map(x => `<li>${esc(x)}</li>`).join("")}</ul></section>`);
    if ((q.triage || []).length) sections.push(`<section class="d-sec"><h3>Triage</h3><ol>${q.triage.map(x => `<li>${esc(x)}</li>`).join("")}</ol></section>`);
    if (isTested(q)) {
      sections.push(`<section class="d-sec"><h3>Test record</h3><div class="proof">
        <div class="proof-head"><span>Replayed in CI against the Azure Data Explorer emulator on every push</span><a href="${esc(q.source)}/tests">Fixtures</a></div>
        ${(q.tests || []).map(t => `<div class="proof-row">${ICON.check}<span>${esc(t.name)}<small>${esc((t.fixtures || []).join(", "))}</small></span>
          <span class="exp">${t.rows > 0 ? `fires · ${plural(t.rows, "row")}` : "stays quiet · 0 rows"}</span></div>`).join("")}
      </div></section>`);
    } else {
      sections.push(`<section class="d-sec"><div class="note">This hunting query is not tested in CI. Run it over a short time range first, and check the results against your own tenant's schema and data.</div></section>`);
    }
    if ((q.references || []).length) sections.push(`<section class="d-sec refs"><h3>References</h3><ul>${q.references.map(r => `<li><a href="${esc(r)}">${esc(r.replace(/^https?:\/\//, ""))}</a></li>`).join("")}</ul></section>`);

    detailEl.innerHTML = `
      <div class="d-top"><span>${esc(q.id)}</span>${badge(q)}</div>
      <h2>${esc(q.title)}</h2>
      <dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
      <div class="code">
        <div class="code-bar"><span>KQL</span><span class="actions">
          ${q.source ? `<a class="code-btn" href="${esc(q.source)}">${ICON.ext}Source</a>` : ""}
          <button class="code-btn primary" type="button" data-copy-query>${ICON.copy}Copy query</button>
        </span></div>
        <pre><code>${highlight(q.query)}</code></pre>
      </div>
      ${sections.join("")}`;
    detailEl.scrollTop = 0;
  }

  function renderLibrary() {
    const base = baseFiltered();
    const items = state.tech ? base.filter(q => q._techs.includes(state.tech)) : base;
    if (!items.some(q => q.id === state.q)) {
      if (!(state.q && BY_ID.has(state.q) && !state.s && !state.table && !state.in && !state.tested && !state.tech)) {
        state.q = items.length ? items[0].id : "";
      }
    }
    renderMatrix(base);
    renderList(items);
    renderDetail(BY_ID.get(state.q));

    const tested = ALL.filter(isTested).length;
    $("#lib-count").textContent = `${ALL.length} queries, ${tested} tested in CI,`;
    $("#list-title").textContent = state.tech ? `${state.tech} ${techName(state.tech)}` : "All queries";
    $("#list-count").textContent = `${plural(items.length, "query")} shown`;
    $("#f-clear").hidden = !(state.s || state.table || state.in || state.tested || state.tech);
  }

  function fillSelect(sel, values) {
    const counts = new Map();
    for (const q of ALL) for (const v of values(q)) counts.set(v, (counts.get(v) || 0) + 1);
    [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).forEach(([v, n]) => {
      const o = document.createElement("option");
      o.value = v; o.textContent = `${v} (${n})`;
      sel.appendChild(o);
    });
  }

  // ---------- Cheat sheet ----------
  const csBody = $("#cs-body");
  const csToc = $("#cs-toc");

  function mark(text, t) {
    let html = esc(text);
    for (const term of t) {
      const re = new RegExp(esc(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      html = html.replace(re, m => `<mark>${m}</mark>`);
    }
    return html;
  }

  function renderCheatsheet() {
    const t = terms();
    let shown = 0;
    const secs = CHEAT.map(sec => {
      const entries = sec.entries.filter(e => {
        const hay = `${e.syntax} ${e.does} ${e.example} ${sec.title}`.toLowerCase();
        return t.every(x => hay.includes(x));
      });
      shown += entries.length;
      if (!entries.length) return "";
      return `<section class="cs-sec" id="cs-${sec.id}" aria-labelledby="h-${sec.id}">
        <h2 id="h-${sec.id}">${esc(sec.title)}</h2><p>${esc(sec.intro)}</p>
        <table class="cs-table"><colgroup><col class="c1"><col class="c2"><col class="c3"></colgroup>
          <thead><tr><th scope="col">Syntax</th><th scope="col">What it does</th><th scope="col">Example</th></tr></thead>
          <tbody>${entries.map(e => `<tr>
            <td class="syn">${mark(e.syntax, t)}</td>
            <td>${mark(e.does, t)}${(e.see || []).length ? `<span class="see">Used in ${e.see.filter(id => BY_ID.has(id)).map(id => `<a href="#q=${esc(id)}">${esc(id)}</a>`).join("")}</span>` : ""}</td>
            <td class="ex"><pre><code>${highlight(e.example)}</code></pre><button class="mini-copy" type="button" data-copy="${esc(e.example)}" aria-label="Copy example">${ICON.copy}</button></td>
          </tr>`).join("")}</tbody></table></section>`;
    }).join("");
    csBody.innerHTML = secs || `<div class="empty"><p>Nothing in the cheat sheet matches "${esc(state.s)}".</p><button class="text-btn" type="button" data-clear>Clear search</button></div>`;
    csToc.innerHTML = CHEAT.filter(sec => csBody.querySelector(`#cs-${sec.id}`))
      .map(sec => `<li><a href="#cs-${sec.id}" data-sec="${sec.id}">${esc(sec.title)}</a></li>`).join("");
    observeSections();
    return shown;
  }

  let observer;
  function observeSections() {
    if (observer) observer.disconnect();
    if (!("IntersectionObserver" in window)) return;
    observer = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const id = e.target.id.replace(/^cs-/, "");
        csToc.querySelectorAll("a").forEach(a => a.setAttribute("aria-current", String(a.dataset.sec === id)));
      }
    }, { rootMargin: "-70px 0px -70% 0px" });
    csBody.querySelectorAll(".cs-sec").forEach(s => observer.observe(s));
  }

  // ---------- View ----------
  const searchEl = $("#search");
  function render() {
    $("#library").hidden = state.view !== "library";
    $("#cheatsheet").hidden = state.view !== "cheatsheet";
    document.querySelectorAll(".tabs a").forEach(a => {
      if (a.dataset.view === state.view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    searchEl.placeholder = state.view === "cheatsheet" ? "Search the cheat sheet" : "Search queries, techniques, tables";
    if (searchEl.value !== state.s) searchEl.value = state.s;
    $("#f-table").value = state.table;
    $("#f-product").value = state.in;
    $("#f-tested").checked = state.tested;
    document.title = state.view === "cheatsheet" ? "KQL cheat sheet · KQL Hunting" : "KQL Hunting";
    if (state.view === "library") renderLibrary(); else renderCheatsheet();
  }

  function update(changes) {
    Object.assign(state, changes);
    writeHash();
    render();
  }

  const narrow = () => window.matchMedia("(max-width: 860px)").matches;

  // ---------- Events ----------
  matrixEl.addEventListener("click", e => {
    const cell = e.target.closest(".cell");
    if (!cell) return;
    update({ tech: state.tech === cell.dataset.tech ? "" : cell.dataset.tech, q: "" });
  });

  listEl.addEventListener("click", e => {
    if (e.target.closest("[data-clear]")) return clearFilters();
    const row = e.target.closest(".qrow");
    if (!row) return;
    update({ q: row.dataset.id });
    if (narrow()) detailEl.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  listEl.addEventListener("keydown", e => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const rows = [...listEl.querySelectorAll(".qrow")];
    const i = rows.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    const next = rows[Math.max(0, Math.min(rows.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)))];
    update({ q: next.dataset.id });
    listEl.querySelector(`[data-id="${next.dataset.id}"]`).focus();
  });

  detailEl.addEventListener("click", e => {
    const tech = e.target.closest("[data-tech]");
    if (tech) return update({ tech: tech.dataset.tech });
    if (e.target.closest("[data-copy-query]")) {
      const q = BY_ID.get(state.q);
      if (q) copy(q.query, `Copied ${q.id}`);
    }
  });

  csBody.addEventListener("click", e => {
    if (e.target.closest("[data-clear]")) return update({ s: "" });
    const btn = e.target.closest("[data-copy]");
    if (btn) copy(btn.dataset.copy, "Copied example");
  });

  let searchTimer;
  searchEl.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => update({ s: searchEl.value.trim(), q: "" }), 120);
  });
  searchEl.addEventListener("keydown", e => {
    if (e.key === "Escape" && searchEl.value) { e.preventDefault(); searchEl.value = ""; update({ s: "" }); }
  });
  document.addEventListener("keydown", e => {
    if (e.key === "/" && !e.ctrlKey && !e.metaKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
      e.preventDefault();
      searchEl.focus();
    }
  });

  $("#f-table").addEventListener("change", e => update({ table: e.target.value, q: "" }));
  $("#f-product").addEventListener("change", e => update({ in: e.target.value, q: "" }));
  $("#f-tested").addEventListener("change", e => update({ tested: e.target.checked, q: "" }));
  function clearFilters() { update({ s: "", table: "", in: "", tested: false, tech: "", q: "" }); }
  $("#f-clear").addEventListener("click", clearFilters);

  window.addEventListener("hashchange", () => {
    const h = location.hash.slice(1);
    if (h.startsWith("cs-")) return; // in-page cheat sheet anchor
    readHash();
    render();
  });

  // Theme
  const themeBtn = $("#theme");
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const current = () => document.documentElement.dataset.theme || (media.matches ? "dark" : "light");
  function labelTheme() { themeBtn.setAttribute("aria-label", current() === "dark" ? "Switch to light theme" : "Switch to dark theme"); }
  themeBtn.addEventListener("click", () => {
    const next = current() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("kql-theme", next); } catch (e) {}
    labelTheme();
  });
  media.addEventListener && media.addEventListener("change", labelTheme);

  // ---------- Boot ----------
  fillSelect($("#f-table"), q => q.tables || []);
  fillSelect($("#f-product"), q => q.products || []);
  buildMatrix();
  labelTheme();
  readHash();
  render();
})();
