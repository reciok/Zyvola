(function () {
  var DASHBOARDS_KEY = "zyv_dashboards";
  var root = document.getElementById("dashboard-root");
  var hasMenuOutsideListener = false;
  if (!root) return;

  var params = new URLSearchParams(window.location.search);
  var viewId = params.get("id");

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function isIsoDateLike(value) {
    return typeof value === "string"
      && /^\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}(?::\d{2})?)?/.test(value);
  }

  function humanizeKey(rawKey) {
    var key = String(rawKey || "").trim();
    if (!key) return "Dato";

    var dictionary = {
      profitHistory: "Evolución de capital",
      roiByYear: "ROI acumulado",
      amortizationSchedule: "Saldo pendiente",
      interestVsPrincipal: "Capital amortizado",
      cashflowHistory: "Flujo de caja",
      fallbackSeries: "Serie principal",
      initialInvestment: "Inversión inicial",
      finalValue: "Valor final",
      additionalCosts: "Costes adicionales",
      annualRate: "Tasa anual",
      discountRate: "Tasa de descuento",
      currentAmount: "Importe actual",
      annualInflation: "Inflación anual",
      monthlyContribution: "Aportación mensual",
      currentSavings: "Ahorro acumulado",
      retirementAge: "Edad de jubilación",
      currentAge: "Edad actual",
      principal: "Capital principal",
      downPayment: "Entrada inicial",
      propertyValue: "Valor de la propiedad",
      extraMonthly: "Gasto mensual extra",
      years: "Años"
    };

    if (dictionary[key]) return dictionary[key];

    var spaced = key
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[\-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }

  function formatMetricValue(metricKey, rawValue) {
    if (rawValue == null || rawValue === "") return "-";

    var key = String(metricKey || "").toLowerCase();

    if (key.indexOf("timestamp") !== -1 || key.indexOf("fecha") !== -1 || key.indexOf("date") !== -1) {
      var dateValue = new Date(rawValue);
      if (!isNaN(dateValue.getTime())) {
        return dateValue.toLocaleString("es-ES", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        });
      }
    }

    if (typeof rawValue === "number" && isFinite(rawValue)) {
      return rawValue.toLocaleString("es-ES", { maximumFractionDigits: 2 });
    }

    if (typeof rawValue === "boolean") {
      return rawValue ? "Sí" : "No";
    }

    if (isIsoDateLike(rawValue)) {
      var parsed = new Date(rawValue);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString("es-ES");
      }
    }

    return String(rawValue);
  }

  function getDatasetDisplayName(sourceKey, dataset) {
    var label = dataset && dataset.label ? String(dataset.label).trim() : "";
    if (label && label.toLowerCase() !== "serie") return label;
    return humanizeKey(sourceKey);
  }

  function generateId() {
    return "db_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function loadJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_e) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function loadDashboards() {
    try {
      var raw = localStorage.getItem(DASHBOARDS_KEY);
      var list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) return [];

      var changed = false;
      list = list.filter(function (item) {
        if (!item || typeof item !== "object") return false;
        if (Object.prototype.hasOwnProperty.call(item, "tipo")) {
          delete item.tipo;
          changed = true;
        }
        return true;
      });

      list.forEach(function (item) {
        if (!item || typeof item !== "object") return;
        if (!item.data || typeof item.data !== "object" || Array.isArray(item.data)) {
          item.data = {};
          changed = true;
        }

        var seenSignatures = {};
        Object.keys(item.data).forEach(function (key) {
          var ds = item.data[key];
          if (!isDatasetShape(ds)) return;
          var sig = JSON.stringify({
            label: ds.label || "",
            labels: ds.labels,
            values: ds.values
          });
          if (seenSignatures[sig]) {
            delete item.data[key];
            changed = true;
            return;
          }
          seenSignatures[sig] = key;
        });
      });

      if (changed) {
        saveDashboards(list);
      }

      return list;
    } catch (_e) {
      return [];
    }
  }

  function saveDashboards(list) {
    localStorage.setItem(DASHBOARDS_KEY, JSON.stringify(list));
  }

  function deleteDashboard(id) {
    var list = loadDashboards().filter(function (d) { return d.id !== id; });
    saveDashboards(list);
  }

  function renameDashboard(id, nombre) {
    var list = loadDashboards();
    list.forEach(function (item) {
      if (item.id === id) item.nombre = nombre;
    });
    saveDashboards(list);
  }

  function dashboardIcon() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>';
  }

  function resolveChartsForDashboard(db) {
    if (!db || !db.data || typeof db.data !== "object") return [];

    var keys = Object.keys(db.data).filter(function (key) {
      return isDatasetShape(db.data[key]);
    });

    return keys.map(function (key, index) {
      return {
        id: "dashboardChart_" + index,
        type: "line",
        source: key
      };
    });
  }

  function isDatasetShape(dataset) {
    return !!dataset
      && typeof dataset === "object"
      && Array.isArray(dataset.labels)
      && Array.isArray(dataset.values);
  }

  function migrateDashboardData(db) {
    var changed = false;
    if (!db.data || typeof db.data !== "object" || Array.isArray(db.data)) {
      db.data = {};
      changed = true;
    }

    return changed;
  }

  function formatPercent(value) {
    if (!Number.isFinite(value)) return "-";
    return value.toLocaleString("es-ES", { maximumFractionDigits: 2 }) + " %";
  }

  function formatSignedNumber(value) {
    if (!Number.isFinite(value)) return "-";
    var prefix = value > 0 ? "+" : "";
    return prefix + formatMetricValue("valor", value);
  }

  function buildDatasetMetrics(key, ds) {
    if (!ds || !Array.isArray(ds.values) || !Array.isArray(ds.labels)) return [];

    var numericValues = ds.values
      .map(function (item) { return Number(item); })
      .filter(function (item) { return Number.isFinite(item); });

    var count = ds.values.length;
    if (!count || !numericValues.length) return [];

    var firstValue = Number(ds.values[0]);
    var lastValue = Number(ds.values[count - 1]);
    var sumValues = numericValues.reduce(function (acc, v) { return acc + v; }, 0);
    var avgValue = sumValues / numericValues.length;
    var minValue = Math.min.apply(null, numericValues);
    var maxValue = Math.max.apply(null, numericValues);
    var minIndex = numericValues.indexOf(minValue);
    var maxIndex = numericValues.indexOf(maxValue);
    var change = Number.isFinite(firstValue) && Number.isFinite(lastValue) ? lastValue - firstValue : NaN;
    var changePct = Number.isFinite(change) && firstValue !== 0 ? (change / Math.abs(firstValue)) * 100 : NaN;
    var firstLabel = ds.labels[0] != null ? String(ds.labels[0]) : "Inicio";
    var lastLabel = ds.labels[count - 1] != null ? String(ds.labels[count - 1]) : "Fin";

    var k = String(key || "").toLowerCase();

    /* ── profitHistory: evolucion de capital (interes compuesto, DCA, ahorro) ── */
    if (k === "profithistory") {
      return [
        { label: firstLabel, value: formatMetricValue("valor", firstValue) },
        { label: lastLabel, value: formatMetricValue("valor", lastValue) },
        { label: "Ganancia total", value: formatSignedNumber(change) },
        { label: "Crecimiento", value: formatPercent(changePct) },
        { label: "Maximo alcanzado", value: formatMetricValue("valor", maxValue) },
        { label: "Promedio anual", value: formatMetricValue("valor", avgValue) },
        { label: "Periodos", value: String(count) }
      ];
    }

    /* ── amortizationSchedule: saldo pendiente hipoteca / prestamo ── */
    if (k === "amortizationschedule") {
      var capitalRepaid = Number.isFinite(firstValue) && Number.isFinite(lastValue) ? firstValue - lastValue : NaN;
      return [
        { label: firstLabel + " — saldo", value: formatMetricValue("valor", firstValue) },
        { label: lastLabel + " — saldo", value: formatMetricValue("valor", lastValue) },
        { label: "Capital amortizado", value: formatMetricValue("valor", capitalRepaid) },
        { label: "Reduccion", value: formatPercent(-changePct) },
        { label: "Periodos", value: String(count) }
      ];
    }

    /* ── interestVsPrincipal: capital amortizado por ano ── */
    if (k.indexOf("interest") !== -1 && k.indexOf("principal") !== -1) {
      var bestYearLabel = ds.labels[maxIndex] != null ? String(ds.labels[maxIndex]) : "-";
      return [
        { label: "Total amortizado", value: formatMetricValue("valor", sumValues) },
        { label: "Promedio anual", value: formatMetricValue("valor", avgValue) },
        { label: "Mejor ano", value: bestYearLabel + ": " + formatMetricValue("valor", maxValue) },
        { label: "Menor pago", value: formatMetricValue("valor", minValue) },
        { label: "Anos", value: String(count) }
      ];
    }

    /* ── cashflowHistory: flujo de caja ── */
    if (k === "cashflowhistory") {
      var positiveMonths = numericValues.filter(function (v) { return v > 0; }).length;
      var negativeMonths = numericValues.filter(function (v) { return v < 0; }).length;
      return [
        { label: "Flujo " + firstLabel, value: formatMetricValue("valor", firstValue) },
        { label: "Flujo " + lastLabel, value: formatMetricValue("valor", lastValue) },
        { label: "Total acumulado", value: formatMetricValue("valor", sumValues) },
        { label: "Promedio mensual", value: formatMetricValue("valor", avgValue) },
        { label: "Meses positivos", value: String(positiveMonths) },
        { label: "Meses negativos", value: String(negativeMonths) }
      ];
    }

    /* ── roiByYear: ROI acumulado anual ── */
    if (k === "roibyyear") {
      var annualStep = count > 1 && Number.isFinite(lastValue) ? lastValue / count : NaN;
      return [
        { label: "ROI " + firstLabel, value: formatPercent(firstValue) },
        { label: "ROI " + lastLabel, value: formatPercent(lastValue) },
        { label: "ROI maximo", value: formatPercent(maxValue) },
        { label: "Incremento anual medio", value: formatPercent(annualStep) },
        { label: "Anos", value: String(count) }
      ];
    }

    /* ── projection: proyeccion mensual del optimizador / analizador financiero ── */
    if (k === "projection") {
      var positiveProjected = numericValues.filter(function (v) { return v > 0; }).length;
      var negativeProjected = numericValues.filter(function (v) { return v < 0; }).length;
      var breakEvenMonth = -1;
      for (var bi = 0; bi < numericValues.length; bi += 1) {
        if (numericValues[bi] >= 0) { breakEvenMonth = bi + 1; break; }
      }
      var breakEvenText = breakEvenMonth > 0 ? "Mes " + breakEvenMonth : "No proyectado";
      return [
        { label: "Mes 1", value: formatMetricValue("valor", firstValue) },
        { label: firstLabel.indexOf("Mes") !== -1 ? firstLabel : "Mes " + count, value: formatMetricValue("valor", lastValue) },
        { label: "Crecimiento neto", value: formatSignedNumber(change) },
        { label: "Mejor mes", value: (ds.labels[maxIndex] != null ? String(ds.labels[maxIndex]) + ": " : "") + formatMetricValue("valor", maxValue) },
        { label: "Peor mes", value: (ds.labels[minIndex] != null ? String(ds.labels[minIndex]) + ": " : "") + formatMetricValue("valor", minValue) },
        { label: "Meses en positivo", value: String(positiveProjected) },
        { label: "Meses en negativo", value: String(negativeProjected) },
        { label: "Punto de equilibrio", value: breakEvenText },
        { label: "Promedio mensual", value: formatMetricValue("valor", avgValue) },
        { label: "Meses simulados", value: String(count) }
      ];
    }

    /* ── Detectar si la serie es un snapshot de metricas (pocos puntos, etiquetas textuales) ── */
    /* vs una serie temporal (muchos puntos o etiquetas tipo "Mes X", "Año X", meses) */
    var timePattern = /^(mes|año|ano|jan|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic|ene|month|year|\d{4})/i;
    var isTimeSeries = count > 4 || (count > 1 && ds.labels.some(function (lbl) { return timePattern.test(String(lbl || "")); }));

    if (!isTimeSeries && count <= 6) {
      /* Snapshot de metricas: mostrar cada punto como una metrica propia */
      var snapshotMetrics = [];
      for (var si = 0; si < count; si += 1) {
        var snapshotVal = Number(ds.values[si]);
        var snapshotLbl = ds.labels[si] != null ? String(ds.labels[si]) : "Dato " + (si + 1);
        snapshotMetrics.push({
          label: snapshotLbl,
          value: Number.isFinite(snapshotVal) ? formatMetricValue("valor", snapshotVal) : "-"
        });
      }
      if (Number.isFinite(change) && count > 1) {
        snapshotMetrics.push({ label: "Diferencia", value: formatSignedNumber(change) });
        if (Number.isFinite(changePct)) {
          snapshotMetrics.push({ label: "Variacion %", value: formatPercent(changePct) });
        }
      }
      return snapshotMetrics;
    }

    /* ── Serie temporal generica (fallbackSeries u otras series largas sin clave especifica) ── */
    var allSmall = numericValues.every(function (v) { return Math.abs(v) <= 100; });
    var formatVal = allSmall ? formatPercent : function (v) { return formatMetricValue("valor", v); };

    return [
      { label: "Inicio", value: firstLabel + ": " + (Number.isFinite(firstValue) ? formatVal(firstValue) : "-") },
      { label: "Fin", value: lastLabel + ": " + (Number.isFinite(lastValue) ? formatVal(lastValue) : "-") },
      { label: "Variacion", value: formatSignedNumber(change) },
      { label: "Variacion %", value: formatPercent(changePct) },
      { label: "Minimo", value: (ds.labels[minIndex] != null ? String(ds.labels[minIndex]) + ": " : "") + formatVal(minValue) },
      { label: "Maximo", value: (ds.labels[maxIndex] != null ? String(ds.labels[maxIndex]) + ": " : "") + formatVal(maxValue) },
      { label: "Promedio", value: formatVal(avgValue) },
      { label: "Puntos", value: String(count) }
    ];
  }

  /* ── Data card rendering for dashboard detail ── */
  function renderDataCards(data) {
    if (!data || typeof data !== "object") return "";

    /* Separate datasets (array values) from legacy metric entries (object values) */
    var datasetKeys = [];
    var metricKeys = [];
    Object.keys(data).forEach(function (key) {
      var entry = data[key];
      if (!entry || typeof entry !== "object") return;
      if (Array.isArray(entry.labels) && Array.isArray(entry.values)) {
        datasetKeys.push(key);
      } else if (entry.values && typeof entry.values === "object" && !Array.isArray(entry.values)) {
        metricKeys.push(key);
      }
    });

    if (!datasetKeys.length && !metricKeys.length) return '<p class="db-empty-data">No hay datos todavía. Usa el botón "Enviar a dashboard" en cualquier herramienta compatible.</p>';

    var html = "";

    /* Render dataset summaries */
    datasetKeys.forEach(function (key) {
      var ds = data[key];
      var title = escapeHtml(getDatasetDisplayName(key, ds));
      var source = escapeHtml(humanizeKey(key));
      var metrics = buildDatasetMetrics(key, ds);
      var metricsHtml = '<div class="db-data-metrics">';

      if (metrics.length) {
        metrics.forEach(function (metric) {
          metricsHtml += '<div class="db-data-metric"><span class="db-data-metric-label">' + escapeHtml(metric.label) + '</span><span class="db-data-metric-value">' + escapeHtml(metric.value) + '</span></div>';
        });
      } else {
        metricsHtml += '<div class="db-data-metric"><span class="db-data-metric-label">Estado</span><span class="db-data-metric-value">Sin datos numericos</span></div>';
      }

      metricsHtml += "</div>";
      html += '<article class="db-data-card"><div class="db-data-card-head"><h3>' + title + '</h3><span class="db-data-source">' + source + '</span></div>' + metricsHtml + "</article>";
    });

    /* Render legacy metric entries */
    metricKeys.forEach(function (key) {
      var entry = data[key];
      var title = escapeHtml(entry.toolName || key);
      var date = entry.timestamp ? new Date(entry.timestamp).toLocaleDateString("es-ES") : "";
      var section = escapeHtml(entry.section || "");
      var values = entry.values || {};
      var valKeys = Object.keys(values);

      var metricsHtml = "";
      if (valKeys.length) {
        metricsHtml = '<div class="db-data-metrics">';
        valKeys.forEach(function (vk) {
          metricsHtml += '<div class="db-data-metric"><span class="db-data-metric-label">' + escapeHtml(humanizeKey(vk)) + '</span><span class="db-data-metric-value">' + escapeHtml(formatMetricValue(vk, values[vk])) + "</span></div>";
        });
        metricsHtml += "</div>";
      }

      html += '<article class="db-data-card"><div class="db-data-card-head"><h3>' + title + "</h3>" + (section ? '<span class="badge">' + section + "</span>" : "") + (date ? '<span class="db-data-date">' + date + "</span>" : "") + "</div>" + metricsHtml + "</article>";
    });
    return html;
  }

  function renderDashboard(db) {
    var chartsContainer = root.querySelector("#dashboardCharts");
    if (!chartsContainer) return;

    var chartsApi = window.ZyvolaCharts || {};
    var chartList = resolveChartsForDashboard(db);

    if (!chartList.length) {
      chartsContainer.innerHTML = '<article class="db-chart-placeholder" data-chart-ref="graficos-dashboard"><p>Este dashboard mostrará gráficos cuando reciba datasets desde las herramientas.</p></article>';
      return;
    }

    var renderedAny = false;
    chartsContainer.innerHTML = "";
    chartsContainer.style.display = "grid";
    chartsContainer.style.gap = "1rem";

    chartList.forEach(function (chartConfig) {
      var dataset = db.data && db.data[chartConfig.source];
      if (!dataset || !Array.isArray(dataset.labels) || !Array.isArray(dataset.values)) return;

      renderedAny = true;

      var card = document.createElement("article");
      card.className = "db-chart-card";
      card.style.border = "1px solid var(--diamond)";
      card.style.borderRadius = "var(--radius-lg)";
      card.style.padding = "1rem";
      card.style.background = "rgba(255, 255, 255, 0.9)";
      card.style.display = "grid";
      card.style.gap = "0.75rem";

      var title = document.createElement("h3");
      title.className = "db-chart-title";
      title.textContent = getDatasetDisplayName(chartConfig.source, dataset);
      title.style.margin = "0";
      title.style.fontSize = "0.92rem";

      var frame = document.createElement("div");
      frame.className = "db-chart-frame";
      frame.style.position = "relative";
      frame.style.minHeight = "240px";

      var canvas = document.createElement("canvas");
      canvas.id = chartConfig.id;
      canvas.setAttribute("data-chart-ref", chartConfig.source);

      frame.appendChild(canvas);
      card.appendChild(title);
      card.appendChild(frame);
      chartsContainer.appendChild(card);

      if (typeof chartsApi.renderChart === "function") {
        chartsApi.renderChart(
          chartConfig.id,
          chartConfig.type,
          dataset.labels,
          dataset.label,
          dataset.values
        );
      }
    });

    if (!renderedAny) {
      chartsContainer.innerHTML = '<article class="db-chart-placeholder" data-chart-ref="graficos-dashboard"><p>Este dashboard mostrará gráficos cuando reciba datasets desde las herramientas.</p></article>';
    }
  }

  /* ── Create modal ── */
  function openCreateModal() {
    var overlay = document.createElement("div");
    overlay.className = "db-modal-overlay";

    function renderModal() {
      return '<div class="db-modal"><div class="db-modal-header"><h2>Nuevo dashboard</h2><button class="db-modal-close" type="button" aria-label="Cerrar">&times;</button></div><div class="db-modal-body"><p class="db-modal-label">Elige el nombre del dashboard:</p><div class="db-modal-field"><input id="db-name-input" class="input" type="text" placeholder="Ej: Mi cartera 2026" maxlength="60" autofocus /></div><div class="db-modal-actions"><button class="button db-modal-create" type="button">Crear</button></div></div></div>';
    }

    function paint() {
      overlay.innerHTML = renderModal();
      bind();
    }

    function bind() {
      overlay.querySelector(".db-modal-close").addEventListener("click", close);
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) close();
      });

      var createBtn = overlay.querySelector(".db-modal-create");
      var nameInput = overlay.querySelector("#db-name-input");
      if (createBtn && nameInput) {
        function doCreate() {
          var name = nameInput.value.trim();
          if (!name) { nameInput.focus(); return; }
          var list = loadDashboards();
          list.push({ id: generateId(), nombre: name, data: {} });
          saveDashboards(list);
          close();
          renderList();
        }
        createBtn.addEventListener("click", doCreate);
        nameInput.addEventListener("keydown", function (e) { if (e.key === "Enter") doCreate(); });
      }
    }

    function close() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    paint();
    document.body.appendChild(overlay);
  }

  /* ── Delete confirmation ── */
  function openDeleteModal(id, nombre) {
    var overlay = document.createElement("div");
    overlay.className = "db-modal-overlay";
    overlay.innerHTML = '<div class="db-modal db-modal-sm"><div class="db-modal-header"><h2>Eliminar dashboard</h2><button class="db-modal-close" type="button" aria-label="Cerrar">&times;</button></div><div class="db-modal-body"><p>¿Eliminar <strong>' + escapeHtml(nombre) + '</strong>? Esta acción no se puede deshacer.</p><div class="db-modal-actions"><button class="button db-modal-back" type="button">Cancelar</button><button class="button db-modal-delete" type="button">Eliminar</button></div></div></div>';

    overlay.querySelector(".db-modal-close").addEventListener("click", close);
    overlay.querySelector(".db-modal-back").addEventListener("click", close);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    overlay.querySelector(".db-modal-delete").addEventListener("click", function () {
      deleteDashboard(id);
      close();
      renderList();
    });

    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
    document.body.appendChild(overlay);
  }

  function openRenameModal(id, currentName) {
    var overlay = document.createElement("div");
    overlay.className = "db-modal-overlay";
    overlay.innerHTML = '<div class="db-modal db-modal-sm"><div class="db-modal-header"><h2>Cambiar nombre</h2><button class="db-modal-close" type="button" aria-label="Cerrar">&times;</button></div><div class="db-modal-body"><div class="db-modal-field"><input id="db-rename-input" class="input" type="text" maxlength="60" value="' + escapeHtml(currentName) + '" autofocus /></div><div class="db-modal-actions"><button class="button db-modal-back" type="button">Cancelar</button><button class="button db-modal-create" type="button">Guardar</button></div></div></div>';

    var input = overlay.querySelector("#db-rename-input");
    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
    function doRename() {
      var next = input ? input.value.trim() : "";
      if (!next) {
        if (input) input.focus();
        return;
      }
      renameDashboard(id, next);
      close();
      renderList();
    }

    overlay.querySelector(".db-modal-close").addEventListener("click", close);
    overlay.querySelector(".db-modal-back").addEventListener("click", close);
    overlay.querySelector(".db-modal-create").addEventListener("click", doRename);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    if (input) {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") doRename();
      });
      setTimeout(function () {
        input.focus();
        input.select();
      }, 0);
    }

    document.body.appendChild(overlay);
  }

  /* ── List view ── */
  function renderList() {
    var dashboards = loadDashboards();

    if (!dashboards.length) {
      root.innerHTML = '<div class="db-empty reveal is-visible"><div class="db-empty-icon"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div><h2>Sin dashboards</h2><p class="muted">Crea tu primer dashboard para empezar a organizar métricas financieras.</p><button class="button db-create-btn" type="button">Crear dashboard</button></div>';
      root.querySelector(".db-create-btn").addEventListener("click", openCreateModal);
      return;
    }

    var listHtml = '<div class="db-list-header reveal is-visible"><div><h2>Mis Dashboards</h2><p class="muted">Dashboards personalizados con datos de tus herramientas.</p></div><button class="button db-create-btn" type="button">Crear dashboard</button></div>';

    listHtml += '<div class="db-grid">';
    dashboards.forEach(function (db) {
      listHtml += '<article class="db-card reveal is-visible" data-open-id="' + encodeURIComponent(db.id) + '" role="button" tabindex="0" aria-label="Abrir dashboard ' + escapeHtml(db.nombre) + '"><div class="db-card-menu-wrap"><button class="db-card-menu-toggle" type="button" aria-label="Opciones" aria-expanded="false">&bull;&bull;&bull;</button><div class="db-card-menu" role="menu"><button class="db-card-menu-item" type="button" data-db-rename="' + escapeHtml(db.id) + '" data-db-current-name="' + escapeHtml(db.nombre) + '" role="menuitem">Cambiar nombre</button><button class="db-card-menu-item is-danger" type="button" data-db-del="' + escapeHtml(db.id) + '" data-db-name="' + escapeHtml(db.nombre) + '" role="menuitem">Eliminar</button></div></div><div class="db-card-head"><div class="db-card-icon">' + dashboardIcon() + '</div><div class="db-card-info"><h3 class="db-card-title">' + escapeHtml(db.nombre) + '</h3></div></div></article>';
    });
    listHtml += "</div>";

    root.innerHTML = listHtml;
    root.querySelector(".db-create-btn").addEventListener("click", openCreateModal);

    function closeMenus() {
      root.querySelectorAll(".db-card-menu.open").forEach(function (menu) {
        menu.classList.remove("open");
      });
      root.querySelectorAll(".db-card-menu-toggle[aria-expanded='true']").forEach(function (toggle) {
        toggle.setAttribute("aria-expanded", "false");
      });
    }

    root.querySelectorAll(".db-card-menu-toggle").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var wrap = btn.closest(".db-card-menu-wrap");
        var menu = wrap ? wrap.querySelector(".db-card-menu") : null;
        if (!menu) return;
        var willOpen = !menu.classList.contains("open");
        closeMenus();
        if (willOpen) {
          menu.classList.add("open");
          btn.setAttribute("aria-expanded", "true");
        }
      });
      btn.addEventListener("keydown", function (e) {
        e.stopPropagation();
      });
    });

    root.querySelectorAll("[data-open-id]").forEach(function (card) {
      card.addEventListener("click", function (e) {
        if (e.target && e.target.closest(".db-card-menu-wrap")) return;
        var openId = card.getAttribute("data-open-id");
        if (!openId) return;
        window.location.href = "?id=" + encodeURIComponent(openId);
      });
      card.addEventListener("keydown", function (e) {
        if (e.target && e.target.closest(".db-card-menu-wrap")) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          var openId = card.getAttribute("data-open-id");
          if (!openId) return;
          window.location.href = "?id=" + encodeURIComponent(openId);
        }
      });
    });

    root.querySelectorAll("[data-db-rename]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeMenus();
        openRenameModal(btn.getAttribute("data-db-rename"), btn.getAttribute("data-db-current-name") || "");
      });
    });

    root.querySelectorAll("[data-db-del]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeMenus();
        openDeleteModal(btn.getAttribute("data-db-del"), btn.getAttribute("data-db-name"));
      });
    });

    if (!hasMenuOutsideListener) {
      document.addEventListener("click", function (e) {
        var target = e.target;
        if (!(target instanceof Element)) return;
        if (target.closest(".db-card-menu-wrap")) return;
        closeMenus();
      });
      hasMenuOutsideListener = true;
    }
  }

  /* ── Detail view ── */
  function renderDetail(id) {
    var dashboards = loadDashboards();
    var db = null;
    for (var i = 0; i < dashboards.length; i++) {
      if (dashboards[i].id === id) { db = dashboards[i]; break; }
    }

    if (!db) {
      root.innerHTML = '<div class="db-empty reveal is-visible"><h2>Dashboard no encontrado</h2><p class="muted">Este dashboard puede haber sido eliminado.</p><a class="button" href="index.html">Volver a dashboards</a></div>';
      return;
    }

    if (migrateDashboardData(db)) {
      saveDashboards(dashboards);
    }

    var html = '<div class="db-detail reveal is-visible">';
    html += '<div class="db-detail-header"><a class="db-back-link" href="index.html">&larr; Todos los dashboards</a><div class="db-detail-title-row"><div class="db-card-icon">' + dashboardIcon() + "</div><div><h1>" + escapeHtml(db.nombre) + "</h1></div></div></div>";

    html += '<div class="db-detail-body">';

    /* Data cards */
    html += '<div class="db-detail-section">';
    html += renderDataCards(db.data, db.dataMeta);
    html += "</div>";

    /* Charts section */
    html += '<div class="db-detail-section" id="db-graphs"><div id="dashboardCharts"></div></div>';

    html += "</div></div>";
    root.innerHTML = html;

    renderDashboard(db);
  }

  /* ── Route ── */
  if (viewId) {
    renderDetail(viewId);
  } else {
    renderList();
  }
})();
