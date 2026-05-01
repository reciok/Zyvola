/* ============================================================
 * Zyvola · portfolioOptimizer.js
 * Herramienta "Optimizador de cartera" (1 año).
 *
 * Dado un capital y un catálogo de productos financieros con
 * sus características (rentabilidad, comisiones, duración,
 * riesgo, drawdown e importe mínimo), calcula el reparto que
 * maximiza la rentabilidad neta esperada penalizada por riesgo
 * y respetando límites de diversificación.
 *
 * Modelo:
 *   max  Σ wi·ri_neto - λ·Σ wi²·σi²
 *   s.a. Σ wi = 1, 0 ≤ wi ≤ wi_max
 *
 * Optimización por gradiente ascendente con proyección al
 * simplex (Wang–Carreira-Perpiñán). Los productos cuyo
 * importe asignado quede por debajo del mínimo se descartan
 * y se reproyecta.
 * ============================================================ */
(function () {
  "use strict";

  /* ── Catálogo por defecto ───────────────────────────────── */
  var DEFAULT_CATALOG = [
    { id: "depo-12m",   name: "Depósito 12M",         category: "Renta fija",   grossYield: 0.025, fees: { mgmt: 0.000, entry: 0.000, exit: 0.000 }, durationMonths: 12, liquidity: "baja",  riskPct: 0.02, drawdownProb: 0.05, drawdownMax: 0.005, minTicket: 1000,  maxWeight: 0.50 },
    { id: "monetario",  name: "Fondo monetario",      category: "Renta fija",   grossYield: 0.030, fees: { mgmt: 0.003, entry: 0.000, exit: 0.000 }, durationMonths: 12, liquidity: "alta",  riskPct: 0.01, drawdownProb: 0.05, drawdownMax: 0.003, minTicket: 100,   maxWeight: 0.50 },
    { id: "bonos-corp", name: "Bonos corporativos",   category: "Renta fija",   grossYield: 0.045, fees: { mgmt: 0.006, entry: 0.000, exit: 0.000 }, durationMonths: 12, liquidity: "media", riskPct: 0.05, drawdownProb: 0.10, drawdownMax: 0.030, minTicket: 500,   maxWeight: 0.40 },
    { id: "mixto",      name: "Fondo mixto (50/50)",  category: "Mixto",        grossYield: 0.060, fees: { mgmt: 0.012, entry: 0.000, exit: 0.000 }, durationMonths: 12, liquidity: "alta",  riskPct: 0.09, drawdownProb: 0.15, drawdownMax: 0.080, minTicket: 100,   maxWeight: 0.40 },
    { id: "rv-global",  name: "Renta variable global",category: "Renta variable",grossYield: 0.085, fees: { mgmt: 0.005, entry: 0.000, exit: 0.000 }, durationMonths: 12, liquidity: "alta",  riskPct: 0.16, drawdownProb: 0.20, drawdownMax: 0.180, minTicket: 50,    maxWeight: 0.35 },
    { id: "rv-emer",    name: "RV emergentes",        category: "Renta variable",grossYield: 0.110, fees: { mgmt: 0.010, entry: 0.000, exit: 0.000 }, durationMonths: 12, liquidity: "media", riskPct: 0.22, drawdownProb: 0.25, drawdownMax: 0.260, minTicket: 100,   maxWeight: 0.20 },
    { id: "reit",       name: "REITs / Inmobiliario", category: "Alternativos", grossYield: 0.075, fees: { mgmt: 0.008, entry: 0.000, exit: 0.000 }, durationMonths: 12, liquidity: "media", riskPct: 0.14, drawdownProb: 0.18, drawdownMax: 0.150, minTicket: 100,   maxWeight: 0.25 },
    { id: "oro",        name: "Oro",                  category: "Alternativos", grossYield: 0.040, fees: { mgmt: 0.004, entry: 0.000, exit: 0.000 }, durationMonths: 12, liquidity: "alta",  riskPct: 0.13, drawdownProb: 0.15, drawdownMax: 0.120, minTicket: 50,    maxWeight: 0.20 },
    { id: "crypto",     name: "Cripto (BTC/ETH)",     category: "Alternativos", grossYield: 0.180, fees: { mgmt: 0.000, entry: 0.005, exit: 0.005 }, durationMonths: 12, liquidity: "alta",  riskPct: 0.55, drawdownProb: 0.30, drawdownMax: 0.500, minTicket: 50,    maxWeight: 0.10 }
  ];

  function getCatalog() {
    if (Array.isArray(window.ZYVOLA_PRODUCTS) && window.ZYVOLA_PRODUCTS.length) return window.ZYVOLA_PRODUCTS;
    window.ZYVOLA_PRODUCTS = DEFAULT_CATALOG.slice();
    return window.ZYVOLA_PRODUCTS;
  }

  /* ── Utilidades ─────────────────────────────────────────── */
  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function eur(n) {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
  }
  function pct(n, d) { return (Number(n) * 100).toFixed(d == null ? 2 : d) + "%"; }

  /** Rentabilidad neta esperada anual de un producto. */
  function netYield(p) {
    var g = Number(p.grossYield) || 0;
    var fm = (p.fees && p.fees.mgmt)  || 0;
    var fe = (p.fees && p.fees.entry) || 0;
    var fx = (p.fees && p.fees.exit)  || 0;
    var net = (1 + g) * (1 - fm) * (1 - fe) * (1 - fx) - 1;
    var expectedDrawdown = (Number(p.drawdownProb) || 0) * (Number(p.drawdownMax) || 0);
    return net - expectedDrawdown;
  }

  /** Comisiones totales como fracción anual (informativo). */
  function totalFees(p) {
    var fm = (p.fees && p.fees.mgmt)  || 0;
    var fe = (p.fees && p.fees.entry) || 0;
    var fx = (p.fees && p.fees.exit)  || 0;
    return fm + fe + fx;
  }

  /**
   * Proyección al simplex con cotas superiores w_i <= u_i, w_i >= 0, Σw=1.
   * Uso de búsqueda binaria sobre el desplazamiento λ.
   */
  function projectToSimplexCapped(v, u) {
    var n = v.length;
    function f(lam) {
      var s = 0;
      for (var i = 0; i < n; i++) {
        var x = Math.min(u[i], Math.max(0, v[i] - lam));
        s += x;
      }
      return s;
    }
    var lo = -1, hi = 1;
    while (f(lo) < 1) lo *= 2;
    while (f(hi) > 1) hi *= 2;
    for (var k = 0; k < 80; k++) {
      var mid = (lo + hi) / 2;
      var s = f(mid);
      if (s > 1) lo = mid; else hi = mid;
      if (Math.abs(s - 1) < 1e-9) break;
    }
    var lam = (lo + hi) / 2;
    var out = new Array(n);
    for (var i = 0; i < n; i++) {
      out[i] = Math.min(u[i], Math.max(0, v[i] - lam));
    }
    return out;
  }

  /**
   * Optimiza el reparto. lambdaRisk define el peso de la penalización por riesgo
   * (perfil del usuario).
   */
  function optimize(products, capital, lambdaRisk) {
    var n = products.length;
    if (!n) return { weights: [], info: null };

    var r = products.map(netYield);
    var v = products.map(function (p) { var s = Number(p.riskPct) || 0; return s * s; });
    var u = products.map(function (p) {
      var m = Number(p.maxWeight);
      if (!isFinite(m) || m <= 0 || m > 1) m = 1;
      return m;
    });
    // Si Σu < 1, no es factible cumplir Σw=1 sin saltarse cotas → escalar cotas
    var sumU = u.reduce(function (a, b) { return a + b; }, 0);
    if (sumU < 1) u = u.map(function (x) { return x / sumU; });

    var w = new Array(n).fill(1 / n);
    var lr = 0.05;
    for (var it = 0; it < 1200; it++) {
      var grad = new Array(n);
      for (var i = 0; i < n; i++) grad[i] = r[i] - 2 * lambdaRisk * v[i] * w[i];
      var v2 = w.map(function (wi, i) { return wi + lr * grad[i]; });
      w = projectToSimplexCapped(v2, u);
    }

    // Forzar mínimos: si w_i*C < minTicket, descartar y reproyectar
    var passes = 0;
    while (passes < 4) {
      var changed = false;
      var capped = u.slice();
      for (var i = 0; i < n; i++) {
        var min = Number(products[i].minTicket) || 0;
        if (w[i] > 0 && w[i] * capital < min) {
          capped[i] = 0;
          changed = true;
        }
      }
      if (!changed) break;
      // reoptimizar con cotas reducidas
      var sU = capped.reduce(function (a, b) { return a + b; }, 0);
      if (sU <= 0) break;
      var capped2 = capped.map(function (x) { return x / sU; });
      var w2 = new Array(n).fill(0);
      for (var j = 0; j < n; j++) w2[j] = capped2[j] > 0 ? 1 / n : 0;
      // un par de iteraciones bastan
      for (var it2 = 0; it2 < 600; it2++) {
        var g2 = new Array(n);
        for (var k = 0; k < n; k++) g2[k] = capped2[k] > 0 ? r[k] - 2 * lambdaRisk * v[k] * w2[k] : -1e9;
        var v3 = w2.map(function (wi, idx) { return wi + lr * g2[idx]; });
        w2 = projectToSimplexCapped(v3, capped2);
      }
      w = w2;
      passes++;
    }

    return { weights: w, returns: r, vars: v };
  }

  /* ── Render ─────────────────────────────────────────────── */
  var STATE_KEY = "zyv_portfolio_optimizer_state_v1";

  function loadPrefs() {
    try { return JSON.parse(localStorage.getItem(STATE_KEY) || "{}") || {}; }
    catch (_) { return {}; }
  }
  function savePrefs(s) {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch (_) {}
  }

  function profileLambda(profile) {
    if (profile === "conservador") return 30;
    if (profile === "agresivo")    return 2;
    return 8; // moderado
  }

  function renderInto(mount) {
    var prefs = loadPrefs();
    var capital  = Number(prefs.capital) || 10000;
    var profile  = prefs.profile || "moderado";
    var enabled  = prefs.enabled || null; // map id->bool; null = todos
    var products = getCatalog();

    function isOn(id) { return !enabled || enabled[id] !== false; }

    var html =
      '<div class="zv-opt">' +
        '<form class="fx-calculator-form zv-opt__form">' +
          '<div class="fx-fields-grid">' +
            '<label class="fx-field"><span>Capital (€)</span>' +
              '<input type="number" min="0" step="100" name="capital" value="' + capital + '">' +
            '</label>' +
            '<label class="fx-field"><span>Perfil de riesgo</span>' +
              '<select name="profile">' +
                '<option value="conservador"' + (profile === "conservador" ? " selected" : "") + '>Conservador</option>' +
                '<option value="moderado"'    + (profile === "moderado"    ? " selected" : "") + '>Moderado</option>' +
                '<option value="agresivo"'    + (profile === "agresivo"    ? " selected" : "") + '>Agresivo</option>' +
              '</select>' +
            '</label>' +
          '</div>' +
          '<details class="zv-opt__details">' +
            '<summary>Productos a considerar (' + products.length + ')</summary>' +
            '<div class="zv-opt__products">' +
              products.map(function (p) {
                return '<label class="zv-opt__chk">' +
                  '<input type="checkbox" data-pid="' + esc(p.id) + '"' + (isOn(p.id) ? " checked" : "") + '>' +
                  '<span><strong>' + esc(p.name) + '</strong> · ' + esc(p.category) + ' · ' + pct(p.grossYield, 1) + ' bruto · σ ' + pct(p.riskPct, 0) + '</span>' +
                '</label>';
              }).join("") +
            '</div>' +
          '</details>' +
        '</form>' +
        '<div class="zv-opt__output"></div>' +
      '</div>';

    mount.innerHTML = html;

    var form    = mount.querySelector(".zv-opt__form");
    var output  = mount.querySelector(".zv-opt__output");

    function paint() {
      var data = new FormData(form);
      capital = Math.max(0, Number(data.get("capital")) || 0);
      profile = String(data.get("profile") || "moderado");
      var checks = mount.querySelectorAll(".zv-opt__chk input[type=checkbox]");
      enabled = {};
      checks.forEach(function (cb) { enabled[cb.getAttribute("data-pid")] = cb.checked; });
      savePrefs({ capital: capital, profile: profile, enabled: enabled });

      var selected = products.filter(function (p) { return enabled[p.id] !== false; });
      if (!selected.length || capital <= 0) {
        output.innerHTML = '<p class="muted" style="padding:8px 0">Selecciona al menos un producto e introduce un capital mayor que cero.</p>';
        return;
      }

      var lam = profileLambda(profile);
      var res = optimize(selected, capital, lam);
      var w   = res.weights;

      // Cartera final: filtra pesos > 0
      var rows = [];
      var expReturn = 0, expVar = 0, totalAlloc = 0, totalFeesAcc = 0;
      for (var i = 0; i < selected.length; i++) {
        var p = selected[i], wi = w[i] || 0;
        if (wi <= 0.0005) continue;
        var amt = wi * capital;
        var ri  = res.returns[i];
        expReturn += wi * ri;
        expVar    += wi * wi * res.vars[i];
        totalAlloc += amt;
        totalFeesAcc += wi * totalFees(p) * capital;
        rows.push({
          name: p.name,
          category: p.category,
          weight: wi,
          amount: amt,
          ri: ri,
          risk: p.riskPct
        });
      }
      rows.sort(function (a, b) { return b.weight - a.weight; });

      var sigma = Math.sqrt(Math.max(0, expVar));
      var worst = expReturn - 1.65 * sigma; // proxy CVaR ~ percentil 5%

      var summary =
        '<div class="fx-results-section">' +
          '<div class="fx-results-header"><span class="fx-results-icon">RS</span><span class="fx-results-title">Resultados</span></div>' +
          '<div class="fx-metrics-grid">' +
            '<div class="fx-metric"><div class="fx-metric-label">Rentabilidad esperada (12M)</div><div class="fx-metric-value">' + pct(expReturn) + '</div></div>' +
            '<div class="fx-metric"><div class="fx-metric-label">Beneficio estimado</div><div class="fx-metric-value">' + eur(expReturn * capital) + '</div></div>' +
            '<div class="fx-metric"><div class="fx-metric-label">Volatilidad cartera</div><div class="fx-metric-value">' + pct(sigma) + '</div></div>' +
            '<div class="fx-metric"><div class="fx-metric-label">Peor escenario (5%)</div><div class="fx-metric-value">' + pct(worst) + '</div></div>' +
            '<div class="fx-metric"><div class="fx-metric-label">Comisiones totales</div><div class="fx-metric-value">' + eur(totalFeesAcc) + '</div></div>' +
            '<div class="fx-metric"><div class="fx-metric-label">Productos en cartera</div><div class="fx-metric-value">' + rows.length + '</div></div>' +
          '</div>' +
        '</div>';

      var table =
        '<div class="fx-results-section">' +
          '<div class="fx-results-header"><span class="fx-results-title">Reparto óptimo</span></div>' +
          '<div class="fx-results-table-wrap"><table class="fx-results-table">' +
            '<thead><tr><th>Producto</th><th>Categoría</th><th style="text-align:right">Peso</th><th style="text-align:right">Importe</th><th style="text-align:right">Rent. neta</th></tr></thead>' +
            '<tbody>' +
              rows.map(function (r) {
                return '<tr>' +
                  '<td>' + esc(r.name) + '</td>' +
                  '<td>' + esc(r.category) + '</td>' +
                  '<td style="text-align:right">' + pct(r.weight, 1) + '</td>' +
                  '<td style="text-align:right">' + eur(r.amount) + '</td>' +
                  '<td style="text-align:right">' + pct(r.ri, 2) + '</td>' +
                '</tr>';
              }).join("") +
            '</tbody>' +
          '</table></div>' +
        '</div>';

      // Gráfico de tarta (si está disponible)
      var chartId = "zv-opt-chart-" + Math.random().toString(36).slice(2, 7);
      var chartHtml =
        '<div class="fx-chart-wrap" style="margin-top:8px">' +
          '<div class="fx-results-header"><span class="fx-results-title">Distribución</span></div>' +
          '<div style="position:relative;height:240px;margin-top:6px"><canvas id="' + chartId + '"></canvas></div>' +
        '</div>';

      output.innerHTML = summary + table + chartHtml;

      // Datasets para "+ Añadir gráfico" externo y para charts internos
      window.ZYVOLA_DASHBOARD_DATASETS = {
        primary: {
          labels: rows.map(function (r) { return r.name; }),
          label: "Peso cartera",
          values: rows.map(function (r) { return Number((r.weight * 100).toFixed(2)); })
        }
      };

      if (window.ZyvolaCharts && typeof window.ZyvolaCharts.renderChart === "function") {
        window.ZyvolaCharts.renderChart(
          chartId,
          "doughnut",
          rows.map(function (r) { return r.name; }),
          "Cartera",
          rows.map(function (r) { return Number((r.weight * 100).toFixed(2)); })
        );
      }
    }

    form.addEventListener("input", paint);
    form.addEventListener("change", paint);
    paint();
  }

  /* ── Hook al runtime de herramientas ────────────────────── */
  function installRuntimeHook() {
    var rt = window.FINANCE_TOOL_RUNTIME;
    if (!rt || typeof rt.renderToolExperience !== "function") return false;
    if (rt.__zvOptimizerHooked) return true;

    var orig = rt.renderToolExperience.bind(rt);
    rt.renderToolExperience = function (toolName, mountNode, ctx) {
      var nm = String(toolName || "").toLowerCase().trim();
      if (mountNode && (nm === "optimizador de cartera" || nm === "optimizador de cartera 1 año")) {
        renderInto(mountNode);
        mountNode.querySelectorAll(".reveal").forEach(function (n) { n.classList.add("is-visible"); });
        return true;
      }
      return orig(toolName, mountNode, ctx);
    };
    rt.__zvOptimizerHooked = true;
    return true;
  }

  if (!installRuntimeHook()) {
    document.addEventListener("DOMContentLoaded", installRuntimeHook);
  }

  window.ZyvolaPortfolioOptimizer = {
    render: renderInto,
    optimize: optimize,
    getCatalog: getCatalog,
    setCatalog: function (list) { if (Array.isArray(list)) window.ZYVOLA_PRODUCTS = list.slice(); }
  };
})();
