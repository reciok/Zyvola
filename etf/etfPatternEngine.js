/* =============================================================
 * Zyvola · etfPatternEngine.js
 * Toma todos los rallies enriquecidos y agrupa por combinaciones
 * de "rasgos" (features) booleanos/categóricos para identificar
 * patrones repetidos.
 *
 * Un patrón = combinación de rasgos que se da en >= minSupport
 * rallies, con métricas medias (subida, duración, volumen).
 * ============================================================= */
(function (root) {
  "use strict";

  function _features(rally) {
    var t = rally.contextoTecnico || {};
    var m = rally.contextoMacro || {};
    var feats = [];
    if (t.rupturaResistencia) feats.push("ruptura_resistencia");
    if (t.alineacionEMA) feats.push("ema_alineadas");
    if (t.volumenAlto) feats.push("volumen_alto");
    if (t.rsiPrevio != null) {
      if (t.rsiPrevio >= 60 && t.rsiPrevio <= 70) feats.push("rsi_fuerte");
      else if (t.rsiPrevio > 70) feats.push("rsi_sobrecompra");
      else if (t.rsiPrevio >= 50) feats.push("rsi_neutro_alcista");
      else feats.push("rsi_debil");
    }
    if (t.fuerzaRelativa && t.fuerzaRelativa.rank != null) {
      if (t.fuerzaRelativa.rank >= 0.75) feats.push("fuerza_relativa_alta");
      else if (t.fuerzaRelativa.rank <= 0.25) feats.push("fuerza_relativa_baja");
    }
    if (m.sentimientoMercado === "muy positivo" || m.sentimientoMercado === "positivo") feats.push("macro_favorable");
    if (m.sentimientoMercado === "negativo" || m.sentimientoMercado === "muy negativo") feats.push("macro_adversa");
    if (m.noticiaSector && m.noticiaSector !== "Sin narrativa específica") feats.push("narrativa_sectorial");
    return feats;
  }

  // Genera todas las combinaciones de tamaño 2..k de los features
  function _combinations(arr, k) {
    var out = [];
    function go(start, combo) {
      if (combo.length >= 2) out.push(combo.slice());
      if (combo.length === k) return;
      for (var i = start; i < arr.length; i++) {
        combo.push(arr[i]);
        go(i + 1, combo);
        combo.pop();
      }
    }
    go(0, []);
    return out;
  }

  function detectPatterns(rallies, opts) {
    opts = opts || {};
    var minSupport = opts.minSupport || 2;          // nº mínimo de rallies
    var maxFeatures = opts.maxFeatures || 4;
    var counts = {}; // key → { count, rallies[], features[] }

    rallies.forEach(function (r) {
      var feats = _features(r).sort();
      var combos = _combinations(feats, maxFeatures);
      combos.forEach(function (c) {
        var key = c.join("+");
        if (!counts[key]) counts[key] = { features: c, count: 0, rallies: [] };
        counts[key].count++;
        counts[key].rallies.push(r.id || (r.etf.ticker + "|" + r.fechaInicio));
      });
    });

    var patterns = [];
    Object.keys(counts).forEach(function (k) {
      var c = counts[k];
      if (c.count < minSupport) return;
      var sample = rallies.filter(function (r) {
        return c.rallies.indexOf(r.id || (r.etf.ticker + "|" + r.fechaInicio)) !== -1;
      });
      var avgPct = _avg(sample, "porcentajeSubida");
      var avgDur = _avg(sample, "duracionDias");
      patterns.push({
        id: k,
        nombre: _patternName(c.features),
        rasgos: c.features,
        ocurrencias: c.count,
        ralliesIds: c.rallies,
        mediaSubida: +avgPct.toFixed(2),
        mediaDuracion: +avgDur.toFixed(1),
        score: +(c.count * Math.log(1 + avgPct)).toFixed(2)
      });
    });

    patterns.sort(function (a, b) { return b.score - a.score; });
    return patterns;
  }

  function _avg(arr, key) {
    if (!arr.length) return 0;
    return arr.reduce(function (s, r) { return s + (r[key] || 0); }, 0) / arr.length;
  }

  function _patternName(feats) {
    var dict = {
      ruptura_resistencia: "Ruptura",
      ema_alineadas: "EMAs alineadas",
      volumen_alto: "Volumen alto",
      rsi_fuerte: "RSI fuerte",
      rsi_sobrecompra: "RSI sobrecompra",
      rsi_neutro_alcista: "RSI neutro",
      fuerza_relativa_alta: "Fuerza relativa alta",
      fuerza_relativa_baja: "Fuerza relativa baja",
      macro_favorable: "Macro favorable",
      macro_adversa: "Macro adversa",
      narrativa_sectorial: "Narrativa sectorial"
    };
    return feats.map(function (f) { return dict[f] || f; }).join(" + ");
  }

  function featuresOf(rally) { return _features(rally); }

  root.ZyvolaETF = root.ZyvolaETF || {};
  root.ZyvolaETF.patternEngine = {
    detectPatterns: detectPatterns,
    featuresOf: featuresOf
  };
})(typeof window !== "undefined" ? window : globalThis);
