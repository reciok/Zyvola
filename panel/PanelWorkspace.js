/* ============================================================
 * Zyvola · PanelWorkspace.js  (lista vertical reordenable)
 *
 * Modelo:
 *   - Las tarjetas se apilan en una columna; se ven enteras a su
 *     tamaño natural (sin folio, sin recortes).
 *   - Solo se pueden REORDENAR arrastrándolas arriba/abajo.
 *   - No hay redimensionado, ni cambios de forma, ni grid de celdas.
 * ============================================================ */
(function () {
  "use strict";

  var STORAGE_KEY = "zyv_panel_workspace_v4";

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function PanelWorkspace(rootEl) {
    this.root = rootEl;
    this.cards = [];
    this.selectedId = "";
  }

  PanelWorkspace.prototype.mount = function () {
    this.root.innerHTML =
      '<div class="zv-workspace">' +
        '<div class="zv-stage-wrap" id="zv-stage-wrap"></div>' +
      '</div>';

    this.stageWrap = this.root.querySelector("#zv-stage-wrap");
    this.grid      = new window.ZyvolaPanelGrid(this.stageWrap);
    this.list      = this.grid.getList();

    this._loadState();
    this._render();
    this._bindSidebar();
    this._injectSidebarActions();
    return this;
  };

  /* ── Sidebar (finance-tools-menu) ──────────────────────── */
  PanelWorkspace.prototype._bindSidebar = function () {
    var self = this;
    document.addEventListener("click", function (ev) {
      var link = ev.target.closest(".finance-tool-link");
      if (!link) return;
      if (document.body.dataset.page !== "panel") return;
      var toolName = link.getAttribute("data-tool-name") || "";
      if (!toolName) return;
      ev.preventDefault();
      self.addToolCard({
        toolName: toolName,
        section:  link.getAttribute("data-tool-section") || "",
        group:    link.getAttribute("data-tool-group")   || ""
      });
    });
  };

  /* ── Acciones del panel inyectadas en la barra lateral ─ */
  PanelWorkspace.prototype._injectSidebarActions = function () {
    var self = this;
    var mount = document.getElementById("finance-tools-menu");
    if (!mount) return;

    function build() {
      var nav = mount.querySelector(".finance-sections-nav");
      if (!nav) return;
      if (nav.querySelector(".finance-panel-actions")) return;

      var box = document.createElement("div");
      box.className = "finance-panel-actions";
      box.innerHTML =
        '<button type="button" class="finance-panel-actions__btn" data-zv-action="export-pdf" title="Exportar a PDF" aria-label="Exportar a PDF">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v5h5"/><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9l5 5v13a2 2 0 0 1-2 2z"/><path d="M8 13h8M8 17h5"/></svg>' +
        '</button>' +
        '<button type="button" class="finance-panel-actions__btn finance-panel-actions__btn--danger" data-zv-action="clear-all" title="Borrar todo" aria-label="Borrar todo">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>' +
        '</button>';

      nav.insertBefore(box, nav.firstChild);

      box.querySelector('[data-zv-action="export-pdf"]').addEventListener("click", function () {
        self._exportPdf();
      });
      box.querySelector('[data-zv-action="clear-all"]').addEventListener("click", function () {
        if (!self.cards.length) return;
        if (!window.confirm("¿Borrar todas las herramientas del panel?")) return;
        self.cards.slice().forEach(function (c) { self._removeCard(c.id); });
      });
    }

    build();
    var obs = new MutationObserver(function () { build(); });
    obs.observe(mount, { childList: true, subtree: true });
  };

  PanelWorkspace.prototype._exportPdf = function () {
    // Imprime el área del panel; el usuario elige "Guardar como PDF" en el diálogo del navegador.
    window.print();
  };

  /* ── Estado / persistencia ─────────────────────────────── */
  PanelWorkspace.prototype._loadState = function () {
    var raw = localStorage.getItem(STORAGE_KEY);
    var data = null;
    try { data = raw ? JSON.parse(raw) : null; } catch (e) { data = null; }
    var stored = (data && Array.isArray(data.cards)) ? data.cards : [];
    var self = this;
    stored.forEach(function (c) { self._instantiateCard(c); });
  };

  PanelWorkspace.prototype._persist = function () {
    var data = {
      cards: this.cards.map(function (c) {
        return c.serialize ? c.serialize() : {
          toolName: c.toolName, section: c.section, group: c.group
        };
      })
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
  };

  /* ── Cards ────────────────────────────────────────────── */
  PanelWorkspace.prototype._instantiateCard = function (props) {
    var self = this;
    var card = new window.ZyvolaToolCard(props);
    card.mount(this.list);

    card.on("onRemove",       function () { self._removeCard(card.id); });
    card.on("onSelect",       function () { self._select(card.id); });
    card.on("onRequestChart", function () { self._addChartFor(card, "bar"); });

    this._attachReorder(card);
    this.cards.push(card);
    return card;
  };

  PanelWorkspace.prototype.addToolCard = function (props) {
    var card = this._instantiateCard(Object.assign({ size: "M", shape: "rect" }, props || {}));
    this._render();
    this._persist();
    this._closeSidebarAndScrollTo(card);
    return card;
  };

  /** Cierra el panel secundario de la sidebar y desplaza la vista a la card. */
  PanelWorkspace.prototype._closeSidebarAndScrollTo = function (card) {
    // Cierra la sub-sidebar de herramientas (si está abierta)
    document.body.classList.remove("has-finance-secondary");
    var mount = document.getElementById("finance-tools-menu");
    if (mount) {
      var secondary = mount.querySelector(".finance-tools-nav");
      if (secondary && secondary.parentNode) secondary.parentNode.removeChild(secondary);
      // Quita el estado activo de la sección que estuviera abierta
      mount.querySelectorAll(".finance-sections-list .is-active, .finance-sections-list [aria-pressed='true']").forEach(function (n) {
        n.classList.remove("is-active");
        if (n.hasAttribute("aria-pressed")) n.setAttribute("aria-pressed", "false");
      });
    }
    // Cierra el tooltip flotante de la sidebar si quedó visible
    var tip = document.getElementById("finance-nav-tooltip");
    if (tip) tip.classList.remove("visible");

    // Scroll suave a la nueva tarjeta tras el render
    if (card && card.el) {
      requestAnimationFrame(function () {
        try {
          card.el.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (_) {
          card.el.scrollIntoView();
        }
        card.el.classList.add("is-selected");
        setTimeout(function () { card.el.classList.remove("is-selected"); }, 1200);
      });
    }
  };

  PanelWorkspace.prototype._removeCard = function (id) {
    var idx = this.cards.findIndex(function (c) { return c.id === id; });
    if (idx < 0) return;
    var card = this.cards[idx];
    if (card.el && card.el.parentNode) card.el.parentNode.removeChild(card.el);
    this.cards.splice(idx, 1);
    this._persist();
  };

  PanelWorkspace.prototype._select = function (id) {
    this.selectedId = id;
    this.cards.forEach(function (c) {
      if (!c.el) return;
      c.el.classList.toggle("is-selected", c.id === id);
    });
  };

  /* ── Drag para reordenar (solo arriba/abajo) ──────────── */
  PanelWorkspace.prototype._attachReorder = function (card) {
    var self = this;
    var handle = card.el.querySelector('[data-zv-drag-handle="1"]');
    if (!handle) return;

    function startDrag(startY) {
      var el = card.el;
      var rect = el.getBoundingClientRect();
      var placeholder = document.createElement("div");
      placeholder.className = "zv-card__placeholder-slot";
      placeholder.style.height = rect.height + "px";

      el.parentNode.insertBefore(placeholder, el.nextSibling);
      el.classList.add("is-dragging");
      el.style.position = "fixed";
      el.style.left  = rect.left + "px";
      el.style.top   = rect.top  + "px";
      el.style.width = rect.width + "px";
      el.style.zIndex = "1000";
      el.style.pointerEvents = "none";

      function siblings() {
        return self.cards.filter(function (c) { return c !== card; }).map(function (c) { return c.el; });
      }

      function moveToY(clientY) {
        var dy = clientY - startY;
        el.style.transform = "translateY(" + dy + "px)";
        var sibs = siblings();
        var inserted = false;
        for (var i = 0; i < sibs.length; i++) {
          var r = sibs[i].getBoundingClientRect();
          if (clientY < r.top + r.height / 2) {
            sibs[i].parentNode.insertBefore(placeholder, sibs[i]);
            inserted = true;
            break;
          }
        }
        if (!inserted && sibs.length) {
          var last = sibs[sibs.length - 1];
          last.parentNode.insertBefore(placeholder, last.nextSibling);
        }
      }

      function endDrag() {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);

        if (placeholder.parentNode) {
          placeholder.parentNode.insertBefore(el, placeholder);
          placeholder.parentNode.removeChild(placeholder);
        }
        el.classList.remove("is-dragging");
        el.style.position = "";
        el.style.left = "";
        el.style.top  = "";
        el.style.width = "";
        el.style.zIndex = "";
        el.style.pointerEvents = "";
        el.style.transform = "";

        self._syncOrderFromDom();
        self._persist();
      }

      function onMouseMove(e) { moveToY(e.clientY); }
      function onMouseUp()    { endDrag(); }
      function onTouchMove(e) { e.preventDefault(); moveToY(e.touches[0].clientY); }
      function onTouchEnd()   { endDrag(); }

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd);
    }

    handle.addEventListener("mousedown", function (ev) {
      if (ev.target.closest("select, input, button, [contenteditable='true']")) return;
      ev.preventDefault();
      startDrag(ev.clientY);
    });

    handle.addEventListener("touchstart", function (ev) {
      if (ev.target.closest("select, input, button, [contenteditable='true']")) return;
      ev.preventDefault();
      startDrag(ev.touches[0].clientY);
    }, { passive: false });
  };

  PanelWorkspace.prototype._syncOrderFromDom = function () {
    var domOrder = Array.prototype.slice.call(this.list.children).filter(function (n) {
      return n.classList && n.classList.contains("zv-card");
    });
    var byEl = new Map();
    this.cards.forEach(function (c) { byEl.set(c.el, c); });
    var sorted = [];
    domOrder.forEach(function (n) {
      var c = byEl.get(n);
      if (c) sorted.push(c);
    });
    // Preservar tarjetas no presentes en DOM (por seguridad)
    this.cards.forEach(function (c) {
      if (sorted.indexOf(c) < 0) sorted.push(c);
    });
    this.cards = sorted;
  };

  PanelWorkspace.prototype._render = function () {
    var self = this;
    this.cards.forEach(function (c) {
      self.list.appendChild(c.el);
      if (c.refreshKpis) c.refreshKpis();
    });
  };

  /* ── Picker de herramienta ────────────────────────────── */
  PanelWorkspace.prototype._openToolPicker = function () {
    var data = window.ZYVOLA_DATA;
    var tools = (data && Array.isArray(data.tools)) ? data.tools : [];
    var self = this;
    var html =
      '<div class="zv-modal__head"><h3>Añadir herramienta</h3><button class="zv-modal__close" aria-label="Cerrar">×</button></div>' +
      '<div class="zv-modal__body">' +
        '<input type="search" class="zv-modal__search" placeholder="Buscar herramienta..." />' +
        '<ul class="zv-modal__list">' +
          tools.map(function (t) {
            return '<li><button type="button" data-tool="' + esc(t.name) + '" data-section="' + esc(t.category || "") + '">' +
              '<strong>' + esc(t.name) + '</strong>' +
              '<span class="muted">' + esc(t.category || "") + ' · ' + esc(t.tag || "") + '</span>' +
            '</button></li>';
          }).join("") +
        '</ul>' +
      '</div>';
    this._showModal(html, function (modal) {
      var search = modal.querySelector(".zv-modal__search");
      var items  = Array.prototype.slice.call(modal.querySelectorAll(".zv-modal__list li"));
      search.addEventListener("input", function () {
        var q = search.value.toLowerCase();
        items.forEach(function (li) {
          li.style.display = li.textContent.toLowerCase().indexOf(q) >= 0 ? "" : "none";
        });
      });
      modal.querySelector(".zv-modal__list").addEventListener("click", function (ev) {
        var btn = ev.target.closest("button[data-tool]");
        if (!btn) return;
        self.addToolCard({
          toolName: btn.getAttribute("data-tool"),
          section:  btn.getAttribute("data-section"),
          group:    ""
        });
        self._closeModal();
      });
    });
  };

  /* ── Picker de gráfico ────────────────────────────────── */
  PanelWorkspace.prototype._openChartPicker = function () {
    var self = this;
    if (!this.cards.length) {
      this._showModal('<div class="zv-modal__head"><h3>Añadir gráfico</h3><button class="zv-modal__close">×</button></div>' +
        '<div class="zv-modal__body"><p class="muted">Añade primero una herramienta con datos numéricos.</p></div>');
      return;
    }
    var cardOptions = this.cards.map(function (c) {
      return '<option value="' + esc(c.id) + '">' + esc(c.toolName) + '</option>';
    }).join("");
    var typeOptions = (window.ZyvolaAutoChartGenerator && window.ZyvolaAutoChartGenerator.types || ["bar"]).map(function (t) {
      return '<option value="' + t + '">' + t + '</option>';
    }).join("");

    var html =
      '<div class="zv-modal__head"><h3>Añadir gráfico</h3><button class="zv-modal__close">×</button></div>' +
      '<div class="zv-modal__body">' +
        '<label>Fuente<select id="zv-chart-src">' + cardOptions + '</select></label>' +
        '<label>Tipo<select id="zv-chart-type">' + typeOptions + '</select></label>' +
        '<button class="zv-topbar__btn zv-topbar__btn--primary" id="zv-chart-go">Generar</button>' +
      '</div>';
    this._showModal(html, function (modal) {
      modal.querySelector("#zv-chart-go").addEventListener("click", function () {
        var srcId = modal.querySelector("#zv-chart-src").value;
        var type  = modal.querySelector("#zv-chart-type").value;
        var src = self.cards.find(function (c) { return c.id === srcId; });
        if (src) self._addChartFor(src, type);
        self._closeModal();
      });
    });
  };

  PanelWorkspace.prototype._addChartFor = function (sourceCard, type) {
    var generator = window.ZyvolaAutoChartGenerator;
    if (!generator) return;
    var chartCard = generator.buildChartCard(sourceCard, type);
    if (!chartCard) return;

    var self = this;
    chartCard.mount(this.list);
    chartCard.on("onRemove", function () { self._removeCard(chartCard.id); });
    chartCard.on("onSelect", function () { self._select(chartCard.id); });
    this._attachReorder(chartCard);
    this.cards.push(chartCard);
    this._render();
    this._persist();
  };

  /* ── Modal helper ─────────────────────────────────────── */
  PanelWorkspace.prototype._showModal = function (innerHTML, afterMount) {
    this._closeModal();
    var ov = document.createElement("div");
    ov.className = "zv-modal-overlay";
    ov.innerHTML = '<div class="zv-modal" role="dialog">' + innerHTML + '</div>';
    document.body.appendChild(ov);
    this._modal = ov;
    var self = this;
    ov.addEventListener("click", function (ev) {
      if (ev.target === ov || ev.target.closest(".zv-modal__close")) self._closeModal();
    });
    if (typeof afterMount === "function") afterMount(ov.querySelector(".zv-modal"));
  };

  PanelWorkspace.prototype._closeModal = function () {
    if (this._modal && this._modal.parentNode) this._modal.parentNode.removeChild(this._modal);
    this._modal = null;
  };

  window.ZyvolaPanelWorkspace = PanelWorkspace;
})();
