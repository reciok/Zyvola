/* =============================================================
 * Zyvola · etfAnalyzer.js
 * Indicadores técnicos y métricas de variación a partir de la
 * serie histórica de precios (priceFeed). Diseñado para que
 * cada función sea pura (input prices → output number/object).
 * ============================================================= */
(function (root) {
  "use strict";

  function _closes(series) { return series.map(function (p) { return p.close; }); }
  function _volumes(series) { return series.map(function (p) { return p.volume; }); }

  function pctChange(series, lookbackDays) {
    if (!series || series.length <= lookbackDays) return null;
    var last = series[series.length - 1].close;
    var prev = series[series.length - 1 - lookbackDays].close;
    if (!prev) return null;
    return ((last - prev) / prev) * 100;
  }

  function ema(values, period) {
    if (!values || !values.length) return [];
    var k = 2 / (period + 1);
    var out = [values[0]];
    for (var i = 1; i < values.length; i++) {
      out.push(values[i] * k + out[i - 1] * (1 - k));
    }
    return out;
  }

  function rsi(values, period) {
    period = period || 14;
    if (!values || values.length <= period) return null;
    var gains = 0, losses = 0;
    for (var i = 1; i <= period; i++) {
      var diff = values[i] - values[i - 1];
      if (diff >= 0) gains += diff; else losses -= diff;
    }
    var avgG = gains / period, avgL = losses / period;
    for (var j = period + 1; j < values.length; j++) {
      var d = values[j] - values[j - 1];
      var g = d > 0 ? d : 0, l = d < 0 ? -d : 0;
      avgG = (avgG * (period - 1) + g) / period;
      avgL = (avgL * (period - 1) + l) / period;
    }
    if (avgL === 0) return 100;
    var rs = avgG / avgL;
    return 100 - (100 / (1 + rs));
  }

  function volatility(values, period) {
    period = period || 30;
    if (!values || values.length < period + 1) return null;
    var rets = [];
    for (var i = values.length - period; i < values.length; i++) {
      rets.push(Math.log(values[i] / values[i - 1]));
    }
    var mean = rets.reduce(function (a, b) { return a + b; }, 0) / rets.length;
    var sq = rets.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / rets.length;
    return Math.sqrt(sq) * Math.sqrt(252) * 100; // % anualizado
  }

  function relativeVolume(series, period) {
    period = period || 20;
    var vols = _volumes(series);
    if (vols.length < period + 1) return null;
    var avg = 0;
    for (var i = vols.length - period - 1; i < vols.length - 1; i++) avg += vols[i];
    avg /= period;
    if (!avg) return null;
    return vols[vols.length - 1] / avg;
  }

  function highBefore(values, idx, lookback) {
    var start = Math.max(0, idx - lookback);
    var hi = -Infinity;
    for (var i = start; i < idx; i++) if (values[i] > hi) hi = values[i];
    return hi;
  }

  function isBreakout(values, lookback) {
    lookback = lookback || 60;
    if (!values || values.length < lookback + 1) return false;
    var idx = values.length - 1;
    var hi = highBefore(values, idx, lookback);
    return values[idx] > hi * 1.001;
  }

  function emaAligned(values) {
    if (!values || values.length < 60) return false;
    var e20 = ema(values, 20);
    var e50 = ema(values, 50);
    var i = values.length - 1;
    return values[i] > e20[i] && e20[i] > e50[i];
  }

  /**
   * Fuerza relativa: % variación 90d del ETF vs media del universo.
   * Devuelve "relRank": 1 = mejor, 0 = peor; y "spread" en p.p.
   */
  function relativeStrength(targetSeries, peerSeriesArray, lookback) {
    lookback = lookback || 90;
    var target = pctChange(targetSeries, lookback);
    if (target == null) return null;
    var peerChanges = peerSeriesArray
      .map(function (s) { return pctChange(s, lookback); })
      .filter(function (v) { return v != null; });
    if (!peerChanges.length) return { value: target, rank: null, spread: null };
    var avg = peerChanges.reduce(function (a, b) { return a + b; }, 0) / peerChanges.length;
    var below = peerChanges.filter(function (v) { return v < target; }).length;
    return {
      value: +target.toFixed(2),
      avg: +avg.toFixed(2),
      spread: +(target - avg).toFixed(2),
      rank: +(below / peerChanges.length).toFixed(2)
    };
  }

  /** Snapshot completo de indicadores para un ETF. */
  function analyze(etf, series, peerSeriesArray) {
    var closes = _closes(series);
    var snap = {
      etf: { nombre: etf.nombre, ticker: etf.ticker, ISIN: etf.ISIN, sector: etf.sector },
      lastDate: series.length ? series[series.length - 1].date : null,
      lastClose: series.length ? series[series.length - 1].close : null,
      change7d: pctChange(series, 7),
      change30d: pctChange(series, 30),
      change90d: pctChange(series, 90),
      relativeVolume: relativeVolume(series, 20),
      volatility30d: volatility(closes, 30),
      rsi14: rsi(closes, 14),
      emaAligned: emaAligned(closes),
      breakout60: isBreakout(closes, 60),
      relativeStrength: peerSeriesArray ? relativeStrength(series, peerSeriesArray, 90) : null
    };
    // Redondeos de presentación
    ["change7d","change30d","change90d","volatility30d"].forEach(function (k) {
      if (snap[k] != null) snap[k] = +snap[k].toFixed(2);
    });
    if (snap.rsi14 != null) snap.rsi14 = +snap.rsi14.toFixed(1);
    if (snap.relativeVolume != null) snap.relativeVolume = +snap.relativeVolume.toFixed(2);
    return snap;
  }

  root.ZyvolaETF = root.ZyvolaETF || {};
  root.ZyvolaETF.analyzer = {
    analyze: analyze,
    pctChange: pctChange,
    ema: ema,
    rsi: rsi,
    volatility: volatility,
    relativeVolume: relativeVolume,
    isBreakout: isBreakout,
    emaAligned: emaAligned,
    relativeStrength: relativeStrength,
    highBefore: highBefore
  };
})(typeof window !== "undefined" ? window : globalThis);
