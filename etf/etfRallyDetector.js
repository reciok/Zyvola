/* =============================================================
 * Zyvola · etfRallyDetector.js
 * Detecta rallies de +15% con duración 7–90 días dentro de la
 * serie histórica de un ETF. Usa una búsqueda mínimo→máximo con
 * sliding window para no duplicar movimientos solapados.
 * ============================================================= */
(function (root) {
  "use strict";

  var DEFAULT_THRESHOLD = 15;   // %
  var MIN_DAYS = 7;
  var MAX_DAYS = 90;

  function findRallies(etf, series, opts) {
    opts = opts || {};
    var threshold = opts.threshold != null ? opts.threshold : DEFAULT_THRESHOLD;
    var minDays = opts.minDays || MIN_DAYS;
    var maxDays = opts.maxDays || MAX_DAYS;

    if (!series || series.length < minDays + 1) return [];

    var rallies = [];
    var n = series.length;

    // Para cada punto candidato como mínimo, buscamos el máximo posterior
    // en ventana [minDays..maxDays]. Tomamos el rally más fuerte y
    // saltamos hasta su fin para evitar duplicados solapados.
    var i = 0;
    while (i < n - minDays) {
      var startPrice = series[i].close;
      var bestEnd = -1, bestPct = -Infinity, bestPrice = startPrice;
      var jMax = Math.min(n - 1, i + maxDays);
      for (var j = i + minDays; j <= jMax; j++) {
        var pct = ((series[j].close - startPrice) / startPrice) * 100;
        if (pct > bestPct) { bestPct = pct; bestEnd = j; bestPrice = series[j].close; }
      }
      if (bestPct >= threshold && bestEnd > i) {
        var avgVolBefore = _avgVolume(series, Math.max(0, i - 20), i);
        var avgVolDuring = _avgVolume(series, i, bestEnd + 1);
        rallies.push({
          etf: { nombre: etf.nombre, ticker: etf.ticker, ISIN: etf.ISIN, gestora: etf.gestora, sector: etf.sector, tipo: etf.tipo, moneda: etf.moneda },
          fechaInicio: series[i].date,
          fechaFin: series[bestEnd].date,
          duracionDias: bestEnd - i,
          porcentajeSubida: +bestPct.toFixed(2),
          precioInicio: +startPrice.toFixed(4),
          precioFin: +bestPrice.toFixed(4),
          volumenRelativo: avgVolBefore > 0 ? +(avgVolDuring / avgVolBefore).toFixed(2) : null,
          indices: { startIdx: i, endIdx: bestEnd }
        });
        i = bestEnd + 1;
      } else {
        i++;
      }
    }
    return rallies;
  }

  function _avgVolume(series, from, to) {
    if (from < 0) from = 0;
    if (to > series.length) to = series.length;
    if (to <= from) return 0;
    var sum = 0;
    for (var k = from; k < to; k++) sum += series[k].volume || 0;
    return sum / (to - from);
  }

  /** Versión por lotes para todo un universo (recibe array de {etf, series}). */
  function findInUniverse(items, opts) {
    var out = [];
    items.forEach(function (it) {
      var rs = findRallies(it.etf, it.series, opts);
      out.push.apply(out, rs);
    });
    return out;
  }

  root.ZyvolaETF = root.ZyvolaETF || {};
  root.ZyvolaETF.rallyDetector = {
    findRallies: findRallies,
    findInUniverse: findInUniverse,
    DEFAULT_THRESHOLD: DEFAULT_THRESHOLD,
    MIN_DAYS: MIN_DAYS,
    MAX_DAYS: MAX_DAYS
  };
})(typeof window !== "undefined" ? window : globalThis);
