(function () {
  var PROJECTS_KEY = "zyv_projects";
  var ACTIVE_KEY   = "zyv_active_project";
  var subscribers = [];

  /* ── helpers ─────────────────────────────────────────── */
  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function genId() {
    return "proj_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
  }

  /* ── storage ─────────────────────────────────────────── */
  function loadProjects() {
    try {
      var raw = localStorage.getItem(PROJECTS_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (_e) { return []; }
  }

  function saveProjects(list) {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(list));
    emitChange();
  }

  function emitChange() {
    subscribers.forEach(function (fn) {
      try { fn(); } catch (_e) {}
    });
  }

  function subscribe(fn) {
    if (typeof fn !== "function") return function () {};
    subscribers.push(fn);
    return function () {
      subscribers = subscribers.filter(function (item) { return item !== fn; });
    };
  }

  function getActiveId() {
    return localStorage.getItem(ACTIVE_KEY) || "";
  }

  function setActiveId(id) {
    localStorage.setItem(ACTIVE_KEY, String(id || ""));
    emitChange();
  }

  function getPattern() {
    return localStorage.getItem("zyv_folio_pattern") || "auto";
  }

  function setPattern(value) {
    localStorage.setItem("zyv_folio_pattern", String(value || "auto"));
  }

  function getMobility() {
    var value = localStorage.getItem("zyv_folio_mobility") || "snap";
    return value === "free" ? "free" : "snap";
  }

  function setMobility(value) {
    localStorage.setItem("zyv_folio_mobility", value === "free" ? "free" : "snap");
  }

  function getCardSize() {
    var value = localStorage.getItem("zyv_folio_size") || "m";
    return /^(s|m|l)$/.test(value) ? value : "m";
  }

  function setCardSize(value) {
    localStorage.setItem("zyv_folio_size", /^(s|m|l)$/.test(value) ? value : "m");
  }

  function getSlotsVisibility() {
    var value = localStorage.getItem("zyv_folio_slots");
    if (value == null) return "on";
    return value === "off" ? "off" : "on";
  }

  function setSlotsVisibility(value) {
    localStorage.setItem("zyv_folio_slots", value === "off" ? "off" : "on");
  }

  function getDragMode() {
    var value = localStorage.getItem("zyv_folio_drag_mode");
    if (value == null) return "on";
    return value === "on" ? "on" : "off";
  }

  function setDragMode(value) {
    localStorage.setItem("zyv_folio_drag_mode", value === "on" ? "on" : "off");
  }

  function getActiveProject() {
    var list = loadProjects();
    var id   = getActiveId();
    return list.find(function (p) { return p.id === id; }) || list[0] || null;
  }

  /* ── CRUD ────────────────────────────────────────────── */
  function createProject(name) {
    var list = loadProjects();
    var proj = {
      id: genId(),
      name: (name || "Proyecto").trim(),
      createdAt: Date.now(),
      toolHistory: [],
      canvasBlocks: []
    };
    list.push(proj);
    saveProjects(list);
    setActiveId(proj.id);
    return proj;
  }

  function ensureDefaultProject() {
    var list = loadProjects();
    var changed = false;
    list.forEach(function (p) {
      if (!Array.isArray(p.toolHistory)) {
        p.toolHistory = [];
        changed = true;
      }
      if (!Array.isArray(p.canvasBlocks)) {
        p.canvasBlocks = [];
        changed = true;
      }
    });
    if (changed) saveProjects(list);
    if (!list.length) return createProject("Mi espacio de trabajo");
    var id = getActiveId();
    if (!id || !list.find(function (p) { return p.id === id; })) {
      setActiveId(list[0].id);
    }
    return getActiveProject();
  }

  function renameProject(id, name) {
    var list = loadProjects();
    list.forEach(function (p) { if (p.id === id) p.name = name.trim(); });
    saveProjects(list);
  }

  function deleteProject(id) {
    var list = loadProjects().filter(function (p) { return p.id !== id; });
    if (!list.length) {
      list.push({ id: genId(), name: "Mi espacio de trabajo", createdAt: Date.now(), toolHistory: [], canvasBlocks: [] });
    }
    saveProjects(list);
    if (getActiveId() === id) setActiveId(list[0].id);
  }

  function recordToolUsage(toolName, section, group) {
    var proj = getActiveProject();
    if (!proj) return;
    var list = loadProjects();
    var p    = list.find(function (x) { return x.id === proj.id; });
    if (!p) return;
    if (!Array.isArray(p.toolHistory)) p.toolHistory = [];
    var key = section + "::" + (group || "") + "::" + toolName;
    p.toolHistory = p.toolHistory.filter(function (e) { return e.key !== key; });
    p.toolHistory.unshift({ key: key, toolName: toolName, section: section, group: group || "", usedAt: Date.now() });
    if (p.toolHistory.length > 30) p.toolHistory = p.toolHistory.slice(0, 30);
    saveProjects(list);
  }

  function getProjectBlocks() {
    var p = getActiveProject();
    if (!p || !Array.isArray(p.canvasBlocks)) return [];
    return p.canvasBlocks;
  }

  function setProjectBlocks(blocks) {
    var list = loadProjects();
    var active = getActiveId();
    var next = Array.isArray(blocks) ? blocks : [];
    list.forEach(function (p) {
      if (p.id !== active) return;
      p.canvasBlocks = next;
    });
    saveProjects(list);
  }

  /* ── modal helper ────────────────────────────────────── */
  function openModal(opts) {
    var overlay = document.createElement("div");
    overlay.className = "db-modal-overlay";

    var modal = document.createElement("div");
    modal.className = "db-modal db-modal-sm";
    modal.style.width = "min(90vw, 380px)";

    var header = document.createElement("div");
    header.className = "db-modal-header";
    var titleEl = document.createElement("h2");
    titleEl.textContent = opts.title || "";
    var closeBtn = document.createElement("button");
    closeBtn.className = "db-modal-close";
    closeBtn.innerHTML = "&times;";
    closeBtn.setAttribute("aria-label", "Cerrar");
    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    var body = document.createElement("div");
    body.className = "db-modal-body";

    var inputEl = null;
    if (opts.input != null) {
      var lbl = document.createElement("p");
      lbl.className = "db-modal-label";
      lbl.textContent = opts.inputLabel || "Nombre:";
      body.appendChild(lbl);
      inputEl = document.createElement("input");
      inputEl.className = "input";
      inputEl.style.cssText = "width:100%;margin-top:0.4rem;";
      inputEl.type  = "text";
      inputEl.value = opts.input;
      body.appendChild(inputEl);
    } else if (opts.message) {
      var msg = document.createElement("p");
      msg.style.cssText = "margin:0;padding:0.5rem 0;color:var(--marble,#44536a);font-size:0.9rem;";
      msg.textContent = opts.message;
      body.appendChild(msg);
    }

    var footer = document.createElement("div");
    footer.style.cssText = "display:flex;gap:0.5rem;justify-content:flex-end;padding-top:0.9rem;";

    var cancelBtn = document.createElement("button");
    cancelBtn.className = "ppbar-btn";
    cancelBtn.type = "button";
    cancelBtn.textContent = "Cancelar";

    var confirmBtn = document.createElement("button");
    confirmBtn.className = "ppbar-btn ppbar-confirm";
    confirmBtn.type = "button";
    confirmBtn.textContent = opts.confirmLabel || "Confirmar";

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    if (inputEl) {
      setTimeout(function () { inputEl.focus(); inputEl.select(); }, 50);
      inputEl.addEventListener("keydown", function (e) {
        if (e.key === "Enter")  confirmBtn.click();
        if (e.key === "Escape") closeBtn.click();
      });
    }

    function close() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    closeBtn.addEventListener("click", close);
    cancelBtn.addEventListener("click", close);

    return new Promise(function (resolve) {
      confirmBtn.addEventListener("click", function () {
        var val = inputEl ? inputEl.value.trim() : true;
        close();
        resolve(val || null);
      });
      closeBtn.addEventListener("click",  function () { resolve(null); });
      cancelBtn.addEventListener("click", function () { resolve(null); });
    });
  }

  /* ── project bar renderer ────────────────────────────── */
  function renderProjectBar() {
    var slot = document.getElementById("panel-project-bar");
    if (!slot) return;

    var proj = ensureDefaultProject();
    var list = loadProjects();
    var activePattern = getPattern();
    var activeMobility = getMobility();
    var activeSize = getCardSize();
    var activeSlots = getSlotsVisibility();
    var activeDragMode = getDragMode();

    var optionsHtml = list.map(function (p) {
      return '<option value="' + esc(p.id) + '"' + (proj && p.id === proj.id ? " selected" : "") + ">" + esc(p.name) + "</option>";
    }).join("");

    slot.innerHTML =
      '<div class="ppbar">' +
        '<span class="ppbar-label">Proyecto</span>' +
        '<select class="ppbar-select" id="ppbar-select" aria-label="Seleccionar proyecto">' + optionsHtml + "</select>" +
        '<span class="ppbar-label">Patrón</span>' +
        '<select class="ppbar-select" id="ppbar-pattern" aria-label="Patrón de colocación">' +
          '<option value="auto"' + (activePattern === "auto" ? " selected" : "") + '>Auto</option>' +
          '<option value="columns"' + (activePattern === "columns" ? " selected" : "") + '>Columnas</option>' +
          '<option value="zigzag"' + (activePattern === "zigzag" ? " selected" : "") + '>Zigzag</option>' +
          '<option value="focus"' + (activePattern === "focus" ? " selected" : "") + '>Enfoque</option>' +
          '<option value="editorial"' + (activePattern === "editorial" ? " selected" : "") + '>Editorial</option>' +
          '<option value="mosaic"' + (activePattern === "mosaic" ? " selected" : "") + '>Mosaico</option>' +
          '<option value="stack"' + (activePattern === "stack" ? " selected" : "") + '>Vertical</option>' +
        '</select>' +
        '<span class="ppbar-label">Arrastrar</span>' +
        '<select class="ppbar-select" id="ppbar-drag-mode" aria-label="Modo arrastrar tarjeta">' +
          '<option value="off"' + (activeDragMode === "off" ? " selected" : "") + '>Off</option>' +
          '<option value="on"' + (activeDragMode === "on" ? " selected" : "") + '>On</option>' +
        '</select>' +
        '<span class="ppbar-label">Movimiento</span>' +
        '<select class="ppbar-select" id="ppbar-mobility" aria-label="Modo de movimiento">' +
          '<option value="snap"' + (activeMobility === "snap" ? " selected" : "") + '>Snap</option>' +
          '<option value="free"' + (activeMobility === "free" ? " selected" : "") + '>Libre</option>' +
        '</select>' +
        '<span class="ppbar-label">Tamaño</span>' +
        '<select class="ppbar-select" id="ppbar-size" aria-label="Tamaño de recuadro">' +
          '<option value="s"' + (activeSize === "s" ? " selected" : "") + '>S</option>' +
          '<option value="m"' + (activeSize === "m" ? " selected" : "") + '>M</option>' +
          '<option value="l"' + (activeSize === "l" ? " selected" : "") + '>L</option>' +
        '</select>' +
        '<span class="ppbar-label">Recuadros</span>' +
        '<select class="ppbar-select" id="ppbar-slots" aria-label="Mostrar recuadros de colocación">' +
          '<option value="on"' + (activeSlots === "on" ? " selected" : "") + '>On</option>' +
          '<option value="off"' + (activeSlots === "off" ? " selected" : "") + '>Off</option>' +
        '</select>' +
        '<button class="ppbar-btn" id="ppbar-pattern-apply" type="button" title="Aplicar vista">Aplicar vista</button>' +
        '<button class="ppbar-btn" id="ppbar-sort" type="button" title="Ordenar folio">Ordenar folio</button>' +
        '<button class="ppbar-btn" id="ppbar-new" type="button" title="Nuevo proyecto">+ Nuevo</button>' +
        '<button class="ppbar-btn ppbar-icon" id="ppbar-rename" type="button" title="Renombrar" aria-label="Renombrar proyecto">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
        '</button>' +
        '<button class="ppbar-btn ppbar-icon ppbar-danger" id="ppbar-delete" type="button" title="Eliminar" aria-label="Eliminar proyecto">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>' +
        '</button>' +
      "</div>";

    document.getElementById("ppbar-select").addEventListener("change", function () {
      setActiveId(this.value);
      renderProjectBar();
    });

    document.getElementById("ppbar-sort").addEventListener("click", function () {
      document.dispatchEvent(new CustomEvent("zyv:folio-sort"));
    });

    document.getElementById("ppbar-pattern-apply").addEventListener("click", function () {
      var pattern = document.getElementById("ppbar-pattern") ? document.getElementById("ppbar-pattern").value : "auto";
      var mobility = document.getElementById("ppbar-mobility") ? document.getElementById("ppbar-mobility").value : "snap";
      var size = document.getElementById("ppbar-size") ? document.getElementById("ppbar-size").value : "m";
      var slots = document.getElementById("ppbar-slots") ? document.getElementById("ppbar-slots").value : "on";
      var dragMode = document.getElementById("ppbar-drag-mode") ? document.getElementById("ppbar-drag-mode").value : "on";

      setPattern(pattern);
      setMobility(mobility);
      setCardSize(size);
      setSlotsVisibility(slots);
      setDragMode(dragMode);

      document.dispatchEvent(new CustomEvent("zyv:folio-dragmode", { detail: { active: dragMode === "on" } }));
      document.dispatchEvent(new CustomEvent("zyv:folio-mobility", { detail: { mobility: mobility } }));
      document.dispatchEvent(new CustomEvent("zyv:folio-size", { detail: { size: size } }));
      document.dispatchEvent(new CustomEvent("zyv:folio-slots", { detail: { visible: slots !== "off" } }));
      document.dispatchEvent(new CustomEvent("zyv:folio-pattern", { detail: { pattern: pattern } }));
    });

    document.getElementById("ppbar-pattern").addEventListener("change", function () {
      setPattern(this.value);
    });

    document.getElementById("ppbar-mobility").addEventListener("change", function () {
      setMobility(this.value);
    });

    document.getElementById("ppbar-size").addEventListener("change", function () {
      setCardSize(this.value);
    });

    document.getElementById("ppbar-drag-mode").addEventListener("change", function () {
      setDragMode(this.value);
      document.dispatchEvent(new CustomEvent("zyv:folio-dragmode", { detail: { active: this.value === "on" } }));
    });

    document.getElementById("ppbar-slots").addEventListener("change", function () {
      setSlotsVisibility(this.value);
      document.dispatchEvent(new CustomEvent("zyv:folio-slots", { detail: { visible: this.value !== "off" } }));
    });

    document.getElementById("ppbar-new").addEventListener("click", function () {
      openModal({ title: "Nuevo proyecto", inputLabel: "Nombre:", input: "" })
        .then(function (name) {
          if (!name) return;
          createProject(name);
          renderProjectBar();
        });
    });

    document.getElementById("ppbar-rename").addEventListener("click", function () {
      var current = getActiveProject();
      if (!current) return;
      openModal({ title: "Renombrar proyecto", inputLabel: "Nuevo nombre:", input: current.name })
        .then(function (name) {
          if (!name) return;
          renameProject(current.id, name);
          renderProjectBar();
        });
    });

    document.getElementById("ppbar-delete").addEventListener("click", function () {
      var current = getActiveProject();
      if (!current) return;
      if (loadProjects().length <= 1) {
        openModal({ title: "No se puede eliminar", message: "Necesitas al menos un proyecto.", confirmLabel: "Entendido" });
        return;
      }
      openModal({
        title: "Eliminar proyecto",
        message: "\u00bfEliminar \u00ab" + current.name + "\u00bb? Esta acci\u00f3n no se puede deshacer.",
        confirmLabel: "Eliminar"
      }).then(function (confirmed) {
        if (!confirmed) return;
        deleteProject(current.id);
        renderProjectBar();
      });
    });
  }

  /* ── public API ──────────────────────────────────────── */
  window.ZyvolaPanelProject = {
    ensureDefaultProject: ensureDefaultProject,
    getActiveProject:     getActiveProject,
    createProject:        createProject,
    renameProject:        renameProject,
    deleteProject:        deleteProject,
    recordToolUsage:      recordToolUsage,
    getProjectBlocks:     getProjectBlocks,
    setProjectBlocks:     setProjectBlocks,
    subscribe:            subscribe,
    renderProjectBar:     renderProjectBar,
    loadProjects:         loadProjects,
    setActiveId:          setActiveId
  };
})();
