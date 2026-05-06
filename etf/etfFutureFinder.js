/* =============================================================
 * Zyvola · etfFutureFinder.js
 * Para cada ETF actual computa sus rasgos técnicos/macro hoy y
 * los compara contra los patrones ganadores. Si cumple ≥ 70%
 * de los rasgos de un patrón → marca el ETF como "ETF con futuro"
 * y guarda explicación.
 * ============================================================= */
(function (root) {
  "use strict";

  function _featuresFromSnapshot(snap, macroMap) {
    var feats = [];
    if (snap.breakout60) feats.push("ruptura_resistencia");
    if (snap.emaAligned) feats.push("ema_alineadas");
    if (snap.relativeVolume != null && snap.relativeVolume > 1.2) feats.push("volumen_alto");
    if (snap.rsi14 != null) {
      if (snap.rsi14 >= 60 && snap.rsi14 <= 70) feats.push("rsi_fuerte");
      else if (snap.rsi14 > 70) feats.push("rsi_sobrecompra");
      else if (snap.rsi14 >= 50) feats.push("rsi_neutro_alcista");
      else feats.push("rsi_debil");
    }
    if (snap.relativeStrength && snap.relativeStrength.rank != null) {
      if (snap.relativeStrength.rank >= 0.75) feats.push("fuerza_relativa_alta");
      else if (snap.relativeStrength.rank <= 0.25) feats.push("fuerza_relativa_baja");
    }
    var sec = snap.etf && snap.etf.sector;
    var n = (root.ZyvolaETF && root.ZyvolaETF.macroNarratives) || (root.ZyvolaETF.rallyAnalysis && root.ZyvolaETF.rallyAnalysis.DEFAULT_NARRATIVES) || {};
    var narr = sec ? n[sec] : null;
    if (narr) {
      if (narr.sentimiento === "positivo" || narr.sentimiento === "muy positivo") feats.push("macro_favorable");
      if (narr.sentimiento === "negativo" || narr.sentimiento === "muy negativo") feats.push("macro_adversa");
      if (narr.tema && narr.tema !== "Sin narrativa específica") feats.push("narrativa_sectorial");
    }
    return feats;
  }

  function _matchScore(currentFeats, patternFeats) {
    if (!patternFeats || !patternFeats.length) return 0;
    var hits = 0;
    patternFeats.forEach(function (f) { if (currentFeats.indexOf(f) !== -1) hits++; });
    return hits / patternFeats.length;
  }

  /**
   * @param snapshots array de snapshots producidos por analyzer.analyze
   * @param patterns array producido por patternEngine.detectPatterns
   * @param opts.threshold (0..1) — match mínimo, por defecto 0.7
   */
  function findFuture(snapshots, patterns, opts) {
    opts = opts || {};
    var th = opts.threshold != null ? opts.threshold : 0.7;
    var topN = opts.topN || 3; // top patrones a mostrar por ETF
    var out = [];

    snapshots.forEach(function (snap) {
      var feats = _featuresFromSnapshot(snap);
      if (!feats.length) return;
      var matches = patterns.map(function (p) {
        return { pattern: p, match: _matchScore(feats, p.rasgos) };
      }).filter(function (m) { return m.match >= th; });

      if (!matches.length) return;
      matches.sort(function (a, b) { return b.match - a.match || b.pattern.score - a.pattern.score; });
      var best = matches.slice(0, topN);
      var explicacion = best.map(function (m) {
        return m.pattern.nombre + " (" + Math.round(m.match * 100) + "% match, +" + m.pattern.mediaSubida + "% en " + m.pattern.mediaDuracion + " días de media)";
      }).join("; ");

      out.push({
        etf: snap.etf,
        snapshot: snap,
        rasgosActuales: feats,
        patronesCoincidentes: best.map(function (m) { return { id: m.pattern.id, nombre: m.pattern.nombre, match: +m.match.toFixed(2), mediaSubida: m.pattern.mediaSubida, mediaDuracion: m.pattern.mediaDuracion, ocurrencias: m.pattern.ocurrencias }; }),
        score: +(best[0].match * (1 + Math.log(1 + best[0].pattern.ocurrencias))).toFixed(3),
        explicacion: "Cumple patrones: " + explicacion + "."
      });
    });

    out.sort(function (a, b) { return b.score - a.score; });
    return out;
  }

  root.ZyvolaETF = root.ZyvolaETF || {};
  root.ZyvolaETF.futureFinder = {
    findFuture: findFuture,
    featuresFromSnapshot: _featuresFromSnapshot
  };
})(typeof window !== "undefined" ? window : globalThis);
