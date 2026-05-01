/* ============================================================
 * Zyvola · AutoChartGenerator.js
 * Genera gráficos automáticamente a partir de los datos
 * expuestos por una tarjeta (toolCard.getChartData()).
 * Se inserta como una "tarjeta de gráfico" dentro de un slot
 * vacío (el workspace se encarga de añadir la tarjeta y
 * reservar slot; aquí solo dibujamos el gráfico).
 *
 * Soporta: line | bar | pie | radar.
 * Usa Chart.js (carga por CDN si no está disponible).
 * ============================================================ */
(function () {
  "use strict";

  var CHARTJS_URL = "https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js";
  var loadingPromise = null;

  function ensureChartJs() {
    if (window.Chart) return Promise.resolve(window.Chart);
    if (loadingPromise) return loadingPromise;
    loadingPromise = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = CHARTJS_URL;
      s.async = true;
      s.onload = function () { resolve(window.Chart); };
      s.onerror = function () { reject(new Error("No se pudo cargar Chart.js")); };
      document.head.appendChild(s);
    });
    return loadingPromise;
  }

  var PALETTE = ["#b8963e", "#3e8db8", "#b83e6f", "#5fb83e", "#7d3eb8", "#b8a13e", "#3eb8a1"];

  function pickColors(n, alpha) {
    var out = [];
    for (var i = 0; i < n; i += 1) {
      var hex = PALETTE[i % PALETTE.length];
      if (alpha == null) out.push(hex);
      else {
        var r = parseInt(hex.slice(1, 3), 16);
        var g = parseInt(hex.slice(3, 5), 16);
        var b = parseInt(hex.slice(5, 7), 16);
        out.push("rgba(" + r + "," + g + "," + b + "," + alpha + ")");
      }
    }
    return out;
  }

  function buildDataset(type, data) {
    var labels = data.labels && data.labels.length ? data.labels : data.values.map(function (_, i) { return "#" + (i + 1); });
    var values = data.values || [];
    var dsLabel = data.datasetLabel || "Datos";
    var dataset = { label: dsLabel, data: values };
    if (type === "line") {
      dataset.borderColor = "#b8963e";
      dataset.backgroundColor = "rgba(184,150,62,0.15)";
      dataset.tension = 0.3;
      dataset.fill = true;
    } else if (type === "bar") {
      dataset.backgroundColor = pickColors(values.length, 0.7);
      dataset.borderColor = pickColors(values.length, 1);
      dataset.borderWidth = 1;
    } else if (type === "pie") {
      dataset.backgroundColor = pickColors(values.length, 0.85);
      dataset.borderColor = "#fff";
    } else if (type === "radar") {
      dataset.borderColor = "#b8963e";
      dataset.backgroundColor = "rgba(184,150,62,0.25)";
      dataset.pointBackgroundColor = "#b8963e";
    }
    return { labels: labels, datasets: [dataset] };
  }

  /**
   * Renderiza el gráfico dentro de mountEl.
   * @param {HTMLElement} mountEl - donde insertar el canvas.
   * @param {string} type - 'line' | 'bar' | 'pie' | 'radar'
   * @param {{labels:string[], values:number[], datasetLabel?:string}} data
   * @param {object} [opts]
   * @returns {Promise<Chart>}
   */
  function generate(mountEl, type, data, opts) {
    if (!mountEl) return Promise.reject(new Error("mountEl requerido"));
    type = ["line", "bar", "pie", "radar"].indexOf(type) >= 0 ? type : "bar";
    if (!data || !Array.isArray(data.values) || !data.values.length) {
      mountEl.innerHTML = '<p class="muted" style="padding:18px">No hay datos numéricos suficientes para generar el gráfico.</p>';
      return Promise.resolve(null);
    }

    return ensureChartJs().then(function (Chart) {
      mountEl.innerHTML = '<canvas></canvas>';
      var canvas = mountEl.querySelector("canvas");
      var cfg = {
        type: type,
        data: buildDataset(type, data),
        options: Object.assign({
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: type !== "bar" }, title: { display: false } }
        }, opts && opts.options ? opts.options : {})
      };
      return new Chart(canvas, cfg);
    });
  }

  /**
   * Crea una tarjeta-gráfico a partir de una tarjeta-fuente.
   * El llamador (PanelWorkspace) inserta la tarjeta en el slot
   * vacío correspondiente; aquí sólo configuramos el body.
   */
  function buildChartCard(sourceCard, type) {
    var ToolCard = window.ZyvolaToolCard;
    if (!ToolCard) return null;
    var data = sourceCard.getChartData();
    var card = new ToolCard({
      toolName: "Gráfico · " + (sourceCard.toolName || "Tarjeta"),
      section:  sourceCard.section || "",
      group:    "auto-chart",
      size:     "M",
      shape:    "wide"
    });
    // Override del render para meter el chart
    card.renderToolContent = function () {
      this.bodyEl.innerHTML = '<div class="zv-chart-mount" style="position:absolute;inset:0;padding:8px"></div>';
      this.bodyEl.style.position = "relative";
      var mount = this.bodyEl.querySelector(".zv-chart-mount");
      generate(mount, type, data);
    };
    card._sourceCardId = sourceCard.id;
    card._chartType = type;
    return card;
  }

  window.ZyvolaAutoChartGenerator = {
    ensureChartJs: ensureChartJs,
    generate: generate,
    buildChartCard: buildChartCard,
    types: ["line", "bar", "pie", "radar"]
  };
})();
