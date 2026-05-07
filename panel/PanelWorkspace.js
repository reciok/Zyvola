/* ============================================================
 * Zyvola · PanelWorkspace.js  (lista vertical reordenable)
 * Reescrito desde cero — Pointer Events unificados para
 * móvil y escritorio, sin conflictos con el scroll de página.
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
    this._injectMobileNavToggle();
    return this;
  };

  /* ── Toggle hamburguesa para abrir/cerrar el menú lateral en móvil ── */
  PanelWorkspace.prototype._injectMobileNavToggle = function () {
    if (document.getElementById("zv-mobile-nav-toggle")) return;

    var btn = document.createElement("button");
    btn.id = "zv-mobile-nav-toggle";
    btn.type = "button";
    btn.className = "zv-mobile-nav-toggle";
    btn.setAttribute("aria-label", "Abrir menú de herramientas");
    btn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    document.body.appendChild(btn);

    var backdrop = document.createElement("div");
    backdrop.className = "zv-mobile-nav-backdrop";
    document.body.appendChild(backdrop);

    function close() { document.body.classList.remove("zv-mobile-nav-open"); }
    function open()  { document.body.classList.add("zv-mobile-nav-open"); }

    btn.addEventListener("click", function () {
      if (document.body.classList.contains("zv-mobile-nav-open")) close();
      else open();
    });
    backdrop.addEventListener("click", close);

    // Cerrar al pulsar una herramienta
    document.addEventListener("click", function (ev) {
      if (!document.body.classList.contains("zv-mobile-nav-open")) return;
      if (ev.target.closest(".finance-tool-link, .finance-section-button, .finance-panel-actions__btn")) {
        setTimeout(close, 50);
      }
    });
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

  /* ── Acciones del panel inyectadas en la barra lateral ─── */
  PanelWorkspace.prototype._injectSidebarActions = function () {
    var self = this;
    var mount = document.getElementById("finance-tools-menu");
    if (!mount) return;

    var SVG_NEW   = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 2h7l3 3v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.4"/><path d="M10 2v3h3M8 7v4M6 9h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
    var SVG_CLEAR = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 4h12M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1m2 0l-1 9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1L3 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var SVG_PDF   = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 2h7l3 3v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.4"/><path d="M8 6v5M5.5 9l2.5 2 2.5-2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    function injectIfNeeded() {
      var nav = mount.querySelector(".finance-sections-nav");
      if (!nav) return;

      if (!nav.querySelector(".finance-panel-actions")) {
        var div = document.createElement("div");
        div.className = "finance-panel-actions";
        div.innerHTML =
          '<button class="finance-panel-actions__btn" data-panel-action="new" title="Nueva hoja">' + SVG_NEW + '</button>' +
          '<button class="finance-panel-actions__btn finance-panel-actions__btn--danger" data-panel-action="clear" title="Borrar todo">' + SVG_CLEAR + '</button>' +
          '<button class="finance-panel-actions__btn" data-panel-action="export" title="Exportar PDF">' + SVG_PDF + '</button>';
        nav.insertBefore(div, nav.firstChild);
      }
    }

    new MutationObserver(injectIfNeeded).observe(mount, { childList: true });
    injectIfNeeded();

    mount.addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-panel-action]");
      if (!btn) return;
      var action = btn.getAttribute("data-panel-action");
      if (action === "new")    self._newSheet();
      else if (action === "clear")  self._clearAll();
      else if (action === "export") self._exportPdf();
    });
  };

  PanelWorkspace.prototype._newSheet = function () {
    if (this.cards.length && !window.confirm("\u00bfCrear una hoja nueva? Se eliminar\u00e1n todas las tarjetas actuales.")) return;
    this._clearAllCards();
  };

  PanelWorkspace.prototype._clearAll = function () {
    if (!this.cards.length) return;
    if (!window.confirm("\u00bfBorrar todas las tarjetas del panel?")) return;
    this._clearAllCards();
  };

  PanelWorkspace.prototype._clearAllCards = function () {
    this.cards.slice().forEach(function (c) {
      if (c.el && c.el.parentNode) c.el.parentNode.removeChild(c.el);
    });
    this.cards = [];
    this._persist();
  };

  PanelWorkspace.prototype._exportPdf = function () {
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

  /* ── Mover tarjeta arriba/abajo un puesto ──────────────── */
  PanelWorkspace.prototype._attachReorder = function (card) {
    var self = this;
    card.on("onMoveUp",   function () { self._moveCard(card.id, -1); });
    card.on("onMoveDown", function () { self._moveCard(card.id, +1); });
  };

  PanelWorkspace.prototype._moveCard = function (id, dir) {
    var idx = this.cards.findIndex(function (c) { return c.id === id; });
    if (idx < 0) return;
    var target = idx + dir;
    if (target < 0 || target >= this.cards.length) return;

    /* Intercambiar en el array */
    var tmp = this.cards[idx];
    this.cards[idx]    = this.cards[target];
    this.cards[target] = tmp;

    /* Reflejar en el DOM */
    this._render();
    this._persist();

    /* Scroll suave para mantener la tarjeta visible */
    if (tmp.el) {
      requestAnimationFrame(function () {
        try { tmp.el.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (_) {}
      });
    }
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
