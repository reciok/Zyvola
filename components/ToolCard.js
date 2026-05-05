/* ============================================================
 * Zyvola · ToolCard.js
 * Componente "Tarjeta de Herramienta" (equivalente vanilla a
 * ToolCard.vue / ToolCard.jsx).
 *
 * Props:
 *   id        : string
 *   toolName  : string
 *   section   : string
 *   group     : string
 *   size      : 'S' | 'M' | 'L' | 'XL'
 *   shape     : 'rect' | 'square' | 'wide' | 'tall'
 *
 * Eventos (callbacks que el workspace inyecta):
 *   onSizeChange(card, newSize)
 *   onShapeChange(card, newShape)
 *   onRemove(card)
 *   onRequestChart(card)
 *   onSelect(card)
 *
 * No modifica la lógica de cada herramienta:
 *   delega el render de su contenido a window.FINANCE_TOOL_RUNTIME
 * ============================================================ */
(function () {
  "use strict";

  var T = window.ZyvolaPanelTemplates;

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function ToolCard(props) {
    this.id        = props.id || ("card_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6));
    this.toolName  = props.toolName || "Herramienta";
    this.section   = props.section || "";
    this.group     = props.group   || "";
    this.size      = (T && T.SIZES[props.size]) ? props.size : "M";
    this.shape     = props.shape || "rect";
    this.callbacks = {};
    this.el        = null;
    this.bodyEl    = null;
    this.kpiEl     = null;
  }

  ToolCard.prototype.on = function (name, fn) { this.callbacks[name] = fn; return this; };

  ToolCard.prototype._fire = function (name, payload) {
    var fn = this.callbacks[name];
    if (typeof fn === "function") fn(this, payload);
  };

  ToolCard.prototype.mount = function (parent) {
    var el = document.createElement("section");
    el.className = "zv-card zv-card--" + this.size.toLowerCase() + " zv-card--shape-" + this.shape;
    el.dataset.cardId = this.id;
    el.dataset.toolName = this.toolName;
    el.innerHTML =
      '<header class="zv-card__head" data-zv-drag-handle="1">' +
        '<div class="zv-card__title-wrap">' +
          '<h3 class="zv-card__title">' + esc(this.toolName) + '</h3>' +
          '<p class="zv-card__sub">' + esc(this.section) + (this.group ? ' · ' + esc(this.group) : '') + '</p>' +
        '</div>' +
        '<div class="zv-card__head-actions">' +
          '<button type="button" class="zv-card__btn zv-card__btn--menu" aria-haspopup="true" aria-expanded="false" title="Más opciones">⋯</button>' +
          '<div class="zv-card__menu" role="menu" hidden>' +
            '<button type="button" class="zv-card__menu-item" data-act="chart" role="menuitem">' +
              '<span class="zv-card__menu-ico">📊</span>Crear gráfico' +
            '</button>' +
            '<button type="button" class="zv-card__menu-item" data-act="advanced" role="menuitem" aria-pressed="false">' +
              '<span class="zv-card__menu-ico">⚙</span>Opciones avanzadas' +
            '</button>' +
            '<div class="zv-card__menu-sep" role="separator"></div>' +
            '<button type="button" class="zv-card__menu-item zv-card__menu-item--danger" data-act="remove" role="menuitem">' +
              '<span class="zv-card__menu-ico">✕</span>Quitar tarjeta' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</header>' +
      '<div class="zv-card__body" data-zv-tool-mount="1"></div>' +
      '<footer class="zv-card__foot">' +
        '<div class="zv-card__kpis" aria-live="polite"></div>' +
      '</footer>' +
      '<span class="zv-card__resize-handle" data-zv-resize-handle="1" aria-hidden="true"></span>';

    parent.appendChild(el);
    this.el     = el;
    this.bodyEl = el.querySelector('[data-zv-tool-mount="1"]');
    this.kpiEl  = el.querySelector('.zv-card__kpis');

    el.querySelector('.zv-card__size').value  = this.size;
    el.querySelector('.zv-card__shape').value = this.shape;

    this._bindEvents();
    this.renderToolContent();
    this.refreshKpis();
    return this;
  };

  ToolCard.prototype._bindEvents = function () {
    var self = this;
    var el   = this.el;

    var menuBtn = el.querySelector('.zv-card__btn--menu');
    var menu    = el.querySelector('.zv-card__menu');

    function closeMenu() {
      if (!menu) return;
      menu.hidden = true;
      if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
      el.classList.remove('is-menu-open');
      document.removeEventListener('click', onDocClick, true);
      document.removeEventListener('keydown', onKey, true);
    }
    function openMenu() {
      if (!menu) return;
      menu.hidden = false;
      if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
      el.classList.add('is-menu-open');
      document.addEventListener('click', onDocClick, true);
      document.addEventListener('keydown', onKey, true);
    }
    function onDocClick(ev) {
      if (!menu || menu.hidden) return;
      if (ev.target.closest && ev.target.closest('.zv-card__menu')) return;
      if (ev.target.closest && ev.target.closest('.zv-card__btn--menu') === menuBtn) return;
      closeMenu();
    }
    function onKey(ev) {
      if (ev.key === 'Escape') closeMenu();
    }

    if (menuBtn) {
      menuBtn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (menu && menu.hidden) openMenu(); else closeMenu();
      });
    }

    el.addEventListener("click", function (ev) {
      var act = ev.target.closest('[data-act]');
      if (act && el.contains(act)) {
        ev.stopPropagation();
        var name = act.getAttribute('data-act');
        if (name === 'remove') {
          closeMenu();
          self._fire("onRemove");
          return;
        }
        if (name === 'chart') {
          closeMenu();
          self._fire("onRequestChart");
          return;
        }
        if (name === 'advanced') {
          var isOpen = el.classList.toggle('is-advanced-open');
          act.setAttribute('aria-pressed', isOpen ? 'true' : 'false');
          return;
        }
      }
      // selección
      if (!ev.target.closest('select, input, button, .zv-card__menu')) {
        self._fire("onSelect");
      }
    });

    el.querySelector('.zv-card__size').addEventListener("change", function (ev) {
      self.size = ev.target.value;
      el.classList.remove("zv-card--s", "zv-card--m", "zv-card--l", "zv-card--xl");
      el.classList.add("zv-card--" + self.size.toLowerCase());
      self._fire("onSizeChange", self.size);
    });

    el.querySelector('.zv-card__shape').addEventListener("change", function (ev) {
      self.shape = ev.target.value;
      el.classList.remove("zv-card--shape-rect", "zv-card--shape-square", "zv-card--shape-wide", "zv-card--shape-tall");
      el.classList.add("zv-card--shape-" + self.shape);
      self._fire("onShapeChange", self.shape);
    });
  };

  /** Renderiza el contenido real de la herramienta sin tocar su lógica. */
  ToolCard.prototype.renderToolContent = function () {
    if (!this.bodyEl) return;
    var rt = window.FINANCE_TOOL_RUNTIME;
    if (rt && typeof rt.renderToolExperience === "function") {
      try {
        var ok = rt.renderToolExperience(this.toolName, this.bodyEl, {
          section: this.section,
          group:   this.group
        });
        if (!ok) this._renderPlaceholder();
      } catch (err) {
        console.warn("[ToolCard] error renderizando", this.toolName, err);
        this._renderPlaceholder();
      }
    } else {
      this._renderPlaceholder();
    }
  };

  ToolCard.prototype._renderPlaceholder = function () {
    this.bodyEl.innerHTML =
      '<div class="zv-card__placeholder">' +
        '<p>Sin renderizador disponible para <strong>' + esc(this.toolName) + '</strong>.</p>' +
        '<p class="muted">El motor de la herramienta no se ha tocado; añade su renderer en <code>FINANCE_TOOL_RUNTIME</code>.</p>' +
      '</div>';
  };

  /** Lee KPIs del cuerpo y los pinta en el footer. */
  ToolCard.prototype.refreshKpis = function () {
    if (!this.kpiEl || !this.bodyEl) return;
    var nodes = this.bodyEl.querySelectorAll(".fx-metric, .kpi-card, .result-card, .resultado-card, [data-kpi]");
    var rows = [];
    nodes.forEach(function (n) {
      if (rows.length >= 4) return;
      var labelEl = n.querySelector(".fx-metric-label, .kpi-label, .label, [data-kpi-label]");
      var valueEl = n.querySelector(".fx-metric-value, .kpi-value, .value, [data-kpi-value]");
      var label = (labelEl ? labelEl.textContent : "Dato").trim();
      var value = (valueEl ? valueEl.textContent : n.textContent || "").trim();
      if (!value) return;
      rows.push({ label: label.slice(0, 18), value: value.slice(0, 24) });
    });
    if (!rows.length) {
      this.kpiEl.innerHTML = '<span class="zv-card__kpi-empty">Sin KPIs aún</span>';
      return;
    }
    this.kpiEl.innerHTML = rows.map(function (r) {
      return '<span class="zv-card__kpi"><em>' + esc(r.label) + '</em><strong>' + esc(r.value) + '</strong></span>';
    }).join("");
  };

  /**
   * getChartData: extrae números del cuerpo para alimentar AutoChartGenerator.
   * Si la herramienta expone window.ZYVOLA_DASHBOARD_DATASETS lo usa también.
   */
  ToolCard.prototype.getChartData = function () {
    var data = { labels: [], values: [], datasetLabel: this.toolName };
    if (!this.bodyEl) return data;

    // 1) KPIs numéricos como dataset principal
    var kpiNodes = this.bodyEl.querySelectorAll(".fx-metric, .kpi-card, .result-card, .resultado-card");
    kpiNodes.forEach(function (n) {
      var labelEl = n.querySelector(".fx-metric-label, .kpi-label, .label");
      var valueEl = n.querySelector(".fx-metric-value, .kpi-value, .value");
      if (!valueEl) return;
      var raw = valueEl.textContent || "";
      var num = parseFloat(raw.replace(/[^\d.,-]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
      if (!isFinite(num)) return;
      data.labels.push((labelEl && labelEl.textContent || "Dato").trim().slice(0, 18));
      data.values.push(num);
    });

    // 2) Fallback: datasets globales de la herramienta
    if (!data.values.length && window.ZYVOLA_DASHBOARD_DATASETS) {
      var ds = window.ZYVOLA_DASHBOARD_DATASETS;
      var key = Object.keys(ds)[0];
      if (key && ds[key]) {
        data.labels = (ds[key].labels || []).slice(0, 12);
        data.values = (ds[key].values || []).slice(0, 12);
        data.datasetLabel = ds[key].label || this.toolName;
      }
    }
    return data;
  };

  ToolCard.prototype.setSize = function (size) {
    if (!T || !T.SIZES[size]) return;
    this.size = size;
    if (this.el) {
      this.el.classList.remove("zv-card--s", "zv-card--m", "zv-card--l", "zv-card--xl");
      this.el.classList.add("zv-card--" + size.toLowerCase());
      var sel = this.el.querySelector('.zv-card__size');
      if (sel) sel.value = size;
    }
  };

  ToolCard.prototype.setShape = function (shape) {
    this.shape = shape;
    if (!this.el) return;
    this.el.classList.remove("zv-card--shape-rect", "zv-card--shape-square", "zv-card--shape-wide", "zv-card--shape-tall");
    this.el.classList.add("zv-card--shape-" + shape);
    var sel = this.el.querySelector('.zv-card__shape');
    if (sel) sel.value = shape;
  };

  ToolCard.prototype.serialize = function () {
    return {
      id: this.id,
      toolName: this.toolName,
      section: this.section,
      group: this.group,
      size: this.size,
      shape: this.shape
    };
  };

  window.ZyvolaToolCard = ToolCard;
})();
