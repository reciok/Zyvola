/* =============================================================
 * Zyvola · etfPriceFeed.js
 * Fuente de precios "pluggable". Por defecto genera series
 * históricas deterministas (semilla por ISIN) para que el resto
 * del módulo pueda detectar rallies, calcular indicadores y
 * exhibir resultados sin depender de un backend.
 *
 * En producción sustituir window.ZyvolaETF.priceFeed.setProvider()
 * por un fetcher real (Yahoo, Stooq, Trade Republic, etc.).
 * ============================================================= */
(function (root) {
  "use strict";

  var DAY_MS = 86400000;
  var DAYS = 180;            // ventana histórica por defecto
  var providerFn = null;     // función externa opcional

  // PRNG determinista (mulberry32)
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashString(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function _generateSeries(isin, days) {
    days = days || DAYS;
    var rng = mulberry32(hashString(isin || "ETF"));
    // Bias por gestora/tema (firma del ISIN) para variar comportamiento
    var trendBias = (rng() - 0.5) * 0.0015;          // tendencia diaria
    var vol = 0.008 + rng() * 0.02;                  // 0.8%–2.8% diaria
    var rallyEpoch = Math.floor(20 + rng() * (days - 60)); // día donde meter un rally
    var rallyLen = 10 + Math.floor(rng() * 40);            // 10–49 días
    var rallyMag = 0.0035 + rng() * 0.006;                 // boost diario

    var prices = [];
    var price = 50 + rng() * 150;
    var today = Date.now();
    var startMs = today - (days - 1) * DAY_MS;

    for (var i = 0; i < days; i++) {
      var date = new Date(startMs + i * DAY_MS);
      var shock = (rng() - 0.5) * 2 * vol;
      var localBoost = 0;
      if (i >= rallyEpoch && i < rallyEpoch + rallyLen) {
        localBoost = rallyMag * (1 - Math.abs((i - rallyEpoch) - rallyLen / 2) / (rallyLen / 2));
      }
      var ret = trendBias + shock + localBoost;
      price = Math.max(1, price * (1 + ret));
      var baseVol = 100000 + rng() * 400000;
      // volumen sube con la magnitud del cambio
      var volume = Math.round(baseVol * (1 + Math.abs(ret) * 8));
      prices.push({
        date: date.toISOString().slice(0, 10),
        close: +price.toFixed(4),
        volume: volume
      });
    }
    return prices;
  }

  function setProvider(fn) { providerFn = (typeof fn === "function") ? fn : null; }

  function getSeries(etf, days) {
    if (providerFn) {
      try {
        var ext = providerFn(etf, days || DAYS);
        if (ext && (ext.then || Array.isArray(ext))) return Promise.resolve(ext);
      } catch (e) {}
    }
    return Promise.resolve(_generateSeries(etf.ISIN || etf.ticker || etf.nombre, days || DAYS));
  }

  function getSeriesSync(etf, days) {
    return _generateSeries(etf.ISIN || etf.ticker || etf.nombre, days || DAYS);
  }

  root.ZyvolaETF = root.ZyvolaETF || {};
  root.ZyvolaETF.priceFeed = {
    getSeries: getSeries,
    getSeriesSync: getSeriesSync,
    setProvider: setProvider,
    DAYS: DAYS
  };
})(typeof window !== "undefined" ? window : globalThis);
