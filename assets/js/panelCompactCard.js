(function () {
  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function shortTitle(name) {
    var text = String(name || "Herramienta").trim();
    if (text.length <= 28) return text;
    return text.slice(0, 27) + "...";
  }

  function toolFullUrl(block) {
    var p = new URLSearchParams();
    if (block.section) p.set("section", block.section);
    if (block.group) p.set("group", block.group);
    if (block.toolName) p.set("tool", block.toolName);
    return "../herramienta/index.html?" + p.toString();
  }

  function normalizeLabel(text) {
    var t = String(text || "").replace(/\s+/g, " ").trim();
    if (!t) return "KPI";
    if (t.length <= 16) return t;
    return t.slice(0, 15) + "...";
  }

  function collectKpis(output) {
    if (!output) return [];
    var list = [];
    var metricNodes = output.querySelectorAll(".fx-metric, [data-kpi], .kpi-card, .result-card, .resultado-card");
    metricNodes.forEach(function (node) {
      if (list.length >= 4) return;
      var labelEl = node.querySelector(".fx-metric-label, .kpi-label, .label, [data-kpi-label]");
      var valueEl = node.querySelector(".fx-metric-value, .kpi-value, .value, [data-kpi-value]");
      var label = normalizeLabel(labelEl ? labelEl.textContent : "");
      var value = String(valueEl ? valueEl.textContent : node.textContent || "").replace(/\s+/g, " ").trim();
      if (!value) return;
      list.push({ label: label, value: value });
    });

    if (list.length < 2) {
      output.querySelectorAll("strong, b, .value, .amount").forEach(function (el) {
        if (list.length >= 4) return;
        var value = String(el.textContent || "").replace(/\s+/g, " ").trim();
        if (!value || value.length < 2) return;
        list.push({ label: "Dato", value: value });
      });
    }

    return list;
  }

  function collectSummaryLine(output) {
    if (!output) return "";
    var line = "";
    output.querySelectorAll("p, li, .fx-caption, .fx-note").forEach(function (el) {
      if (line) return;
      var txt = String(el.textContent || "").replace(/\s+/g, " ").trim();
      if (!txt) return;
      if (txt.length < 12) return;
      if (/^(resultado|resultados|resumen)$/i.test(txt)) return;
      line = txt;
    });
    if (line.length > 96) return line.slice(0, 95) + "...";
    return line;
  }

  function renderKpiRail(rail, kpis) {
    if (!rail) return;
    var rows = kpis && kpis.length ? kpis.slice(0, 4) : [];
    if (!rows.length) {
      rail.innerHTML = '<span class="pc-kpi-empty">Sin resultados aún</span>';
      return;
    }
    rail.innerHTML = rows.map(function (item) {
      return (
        '<div class="pc-kpi-row">' +
          '<span class="pc-kpi-key">' + esc(item.label) + ':</span>' +
          '<strong class="pc-kpi-val">' + esc(item.value) + '</strong>' +
        '</div>'
      );
    }).join("");
  }

  function compactRuntimeView(runtimeMount) {
    if (!runtimeMount) return;
    runtimeMount.classList.add("pc-runtime-compact");

    runtimeMount.querySelectorAll(
      ".hero, .breadcrumbs, .card-copy, .fav-panel-sub, .fx-insights-panel, .fx-results-table-wrap, .fx-chart-panel, .fx-chart-wrap, table, canvas, h1, h2, .fx-calculator-head, .fx-field-help, .fx-description, .fx-long-copy, .fx-note, .fx-helper, [data-calculator-compare], [data-calculator-scenarios]"
    ).forEach(function (el) {
      el.classList.add("pc-hidden");
    });

    var form = runtimeMount.querySelector(".fx-calculator-form");
    var output = runtimeMount.querySelector("[data-calculator-output], [data-generic-results], #rs-sim-output, .fx-results");
    if (form) form.classList.add("pc-form-panel");
    if (output) {
      output.classList.add("pc-output-panel");
      output.classList.add("pc-hidden");
    }

    var kpiRail = document.createElement("section");
    kpiRail.className = "pc-kpi-rail";
    runtimeMount.appendChild(kpiRail);
    renderKpiRail(kpiRail, collectKpis(output));

    var summaryLine = document.createElement("p");
    summaryLine.className = "pc-summary-line";
    summaryLine.textContent = collectSummaryLine(output) || "Resumen listo";
    runtimeMount.appendChild(summaryLine);

    var fields = runtimeMount.querySelectorAll("input:not([type='hidden']), select, textarea");
    fields.forEach(function (field, idx) {
      var wrap = field.closest(".fx-field, .fx-input, .field, .input-row, .fx-form-row, .fx-controls-row, .fx-field-full, .fx-col, label") || field.parentElement || field;
      if (idx > 2) {
        wrap.classList.add("pc-hidden");
      } else {
        wrap.classList.add("pc-field");
      }
    });

    var kpis = runtimeMount.querySelectorAll(
      ".fx-metric, .kpi-card, [data-kpi], .result-card, .resultado-card"
    );
    kpis.forEach(function (kpi, idx) {
      if (idx > 2) {
        kpi.classList.add("pc-hidden");
      } else {
        kpi.classList.add("pc-kpi");
      }
    });

    var calcButton = null;
    runtimeMount.querySelectorAll("button, [type='submit']").forEach(function (btn) {
      var txt = String(btn.textContent || "").toLowerCase();
      if (!calcButton && /(calcular|simular|analizar|ejecutar|actualizar|procesar)/.test(txt)) {
        calcButton = btn;
      }
      if (btn !== calcButton && /(guardar escenario|usar como base|cargar|reset|reiniciar|limpiar|restablecer|rs)/.test(txt)) {
        btn.classList.add("pc-hidden");
      }
      btn.classList.add("pc-compact-btn");
    });

    if (output) {
      var resultSections = output.querySelectorAll(".fx-results-section");
      resultSections.forEach(function (sec, idx) {
        if (idx > 0) sec.classList.add("pc-hidden");
      });
      var headers = output.querySelectorAll(".fx-results-header");
      headers.forEach(function (h) { h.classList.add("pc-hidden"); });
      output.querySelectorAll("h3, h4, .fx-results-title, .section-title").forEach(function (h) {
        h.classList.add("pc-hidden");
      });
      var metrics = output.querySelectorAll(".fx-metric");
      metrics.forEach(function (m, idx) {
        if (idx > 2) m.classList.add("pc-hidden");
      });
      if (!metrics.length) {
        var fallbackMetric = output.querySelector(".fx-results-section");
        if (fallbackMetric) fallbackMetric.classList.remove("pc-hidden");
      }

      output.querySelectorAll("p, small, .muted, .fx-caption").forEach(function (txt) {
        txt.classList.add("pc-hidden");
      });

      var obs = new MutationObserver(function () {
        renderKpiRail(kpiRail, collectKpis(output));
        summaryLine.textContent = collectSummaryLine(output) || "Resumen listo";
      });
      obs.observe(output, { childList: true, subtree: true, characterData: true });
    }

    if (calcButton) {
      calcButton.classList.add("pc-hidden");
      var debounced = null;
      runtimeMount.querySelectorAll("input:not([type='hidden']), select, textarea").forEach(function (field) {
        field.addEventListener("input", function () {
          clearTimeout(debounced);
          debounced = setTimeout(function () { calcButton.click(); }, 280);
        });
        field.addEventListener("change", function () {
          clearTimeout(debounced);
          debounced = setTimeout(function () { calcButton.click(); }, 80);
        });
      });
    }
  }

  function create(block, onAction) {
    var node = document.createElement("article");
    node.className = "pc-block" + (block.collapsed ? " is-collapsed" : "");
    node.setAttribute("data-block-id", block.id);

    node.innerHTML =
      '<header class="pc-block-head">' +
        '<div class="pc-block-title-wrap">' +
          '<span class="pc-block-drag" title="Arrastrar">::</span>' +
          '<span class="pc-block-title" contenteditable="true" spellcheck="false">' + esc(shortTitle(block.toolName)) + "</span>" +
        "</div>" +
        '<div class="pc-block-actions">' +
          '<button class="pc-btn" type="button" data-act="collapse" title="Colapsar">-</button>' +
          '<button class="pc-btn" type="button" data-act="menu" title="Menu">...</button>' +
          '<div class="pc-menu">' +
            '<button class="pc-menu-item" type="button" data-act="open-full">Abrir completa</button>' +
            '<button class="pc-menu-item" type="button" data-act="duplicate">Duplicar</button>' +
            '<button class="pc-menu-item pc-menu-item-danger" type="button" data-act="remove">Eliminar</button>' +
          '</div>' +
        '</div>' +
      '</header>' +
      '<div class="pc-block-body"><div class="pc-runtime"></div></div>';

    node.addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-act]");
      if (!btn) return;
      var act = btn.getAttribute("data-act");
      if (act === "menu") {
        node.classList.toggle("menu-open");
        return;
      }
      if (act === "open-full") {
        window.open(toolFullUrl(block), "_blank", "noopener");
        node.classList.remove("menu-open");
        return;
      }
      if (onAction) onAction(act, block, node);
      node.classList.remove("menu-open");
    });

    var titleEl = node.querySelector(".pc-block-title");
    if (titleEl) {
      titleEl.addEventListener("blur", function () {
        var txt = String(titleEl.textContent || "").trim();
        block.toolName = txt || block.toolName;
        titleEl.textContent = shortTitle(block.toolName);
        if (onAction) onAction("rename", block, node);
      });
    }

    var runtimeMount = node.querySelector(".pc-runtime");
    var runtime = window.FINANCE_TOOL_RUNTIME;
    if (runtime && typeof runtime.renderToolExperience === "function") {
      var handled = runtime.renderToolExperience(block.toolName, runtimeMount, { section: block.section, group: block.group });
      if (!handled) {
        runtimeMount.innerHTML = '<div class="pc-fallback">Herramienta sin renderer especifico: <strong>' + esc(block.toolName) + '</strong></div>';
      }
    }
    compactRuntimeView(runtimeMount);

    return node;
  }

  window.ZyvolaCompactCard = {
    create: create
  };
})();
