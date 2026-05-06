/* =============================================================
 * Zyvola · etfRallyAnalysis.js
 * Para cada rally, calcula su contexto técnico (RSI/EMA/breakout)
 * y un contexto macro/sectorial. Como no hay backend, el contexto
 * macro se nutre de un catálogo de narrativas (window.ZyvolaETF
 * .macroNarratives) o, si no existe, de heurísticas por sector.
 * ============================================================= */
(function (root) {
  "use strict";

  var DEFAULT_NARRATIVES = {
    "AI & Big Data":         { tema: "Adopción de IA generativa",            economica: "Bajada de tipos / inversión tech", sentimiento: "muy positivo" },
    "Robotics & AI":         { tema: "Automatización industrial",            economica: "Reshoring y CAPEX",                 sentimiento: "positivo" },
    "Semiconductors":        { tema: "Ciclo alcista de chips IA",            economica: "Subsidios CHIPS Act / EU Chips",    sentimiento: "muy positivo" },
    "Tech":                  { tema: "Resultados de las big tech",           economica: "Expectativa recortes Fed",          sentimiento: "positivo" },
    "US Tech":               { tema: "Liderazgo Magnificent Seven",          economica: "Liquidez global",                   sentimiento: "positivo" },
    "Clean Energy":          { tema: "Descarbonización y subsidios",         economica: "IRA / Green Deal europeo",          sentimiento: "mixto" },
    "EV & Mobility":         { tema: "Adopción del coche eléctrico",         economica: "Tipos a la baja, demanda china",    sentimiento: "mixto" },
    "Disruptive Tech":       { tema: "Narrativa de innovación disruptiva",   economica: "Risk-on en small/mid",              sentimiento: "positivo" },
    "Europe Banks":          { tema: "Margen de intereses elevado",          economica: "BCE mantiene tipos",                sentimiento: "positivo" },
    "US Banks":              { tema: "Resultados sólidos del sector",        economica: "Curva de tipos normalizándose",     sentimiento: "neutro" },
    "Gold":                  { tema: "Demanda refugio",                      economica: "Inflación persistente / geopolítica",sentimiento: "positivo" },
    "Emerging":              { tema: "Rotación hacia emergentes",            economica: "Dólar débil",                       sentimiento: "positivo" },
    "India":                 { tema: "Crecimiento estructural India",        economica: "Reformas y demografía",             sentimiento: "positivo" },
    "Japan":                 { tema: "Reflación y reforma corporativa",      economica: "Yen débil",                         sentimiento: "positivo" },
    "Global Equity":         { tema: "Rebote bursátil global",               economica: "Liquidez y desinflación",           sentimiento: "positivo" },
    "US Large Cap":          { tema: "S&P 500 marca máximos",                economica: "Beneficios al alza",                sentimiento: "positivo" },
    "Europe Large Cap":      { tema: "Recuperación europea",                 economica: "Caída de la energía",               sentimiento: "neutro" },
    "Developed World":       { tema: "Risk-on global",                       economica: "Bajada de inflación",               sentimiento: "positivo" },
    "Momentum Factor":       { tema: "Continuidad de la tendencia",          economica: "Volatilidad baja",                  sentimiento: "positivo" },
    "EUR Govt Bonds":        { tema: "Apuesta por bajada de tipos",          economica: "Inflación europea cediendo",        sentimiento: "neutro" },
    "Global Bonds":          { tema: "Renta fija anticipa pivote",           economica: "Fin del ciclo restrictivo",         sentimiento: "neutro" }
  };

  function _macroFor(sector, fechaInicio, fechaFin) {
    var src = (root.ZyvolaETF && root.ZyvolaETF.macroNarratives) || DEFAULT_NARRATIVES;
    var n = src[sector] || { tema: "Sin narrativa específica", economica: "Contexto macro neutral", sentimiento: "neutro" };
    return {
      noticiaSector: n.tema,
      noticiaEconomica: n.economica,
      sentimientoMercado: n.sentimiento,
      ventana: { desde: fechaInicio, hasta: fechaFin }
    };
  }

  function _technicalAt(closes, idx) {
    var A = root.ZyvolaETF.analyzer;
    if (!A) return {};
    // Trim para que rsi/ema vean solo lo que existía hasta idx
    var slice = closes.slice(0, idx + 1);
    var rsiPrev = A.rsi(closes.slice(0, Math.max(15, idx - 5)), 14);
    var emaOK = false;
    if (slice.length >= 60) {
      var e20 = A.ema(slice, 20), e50 = A.ema(slice, 50);
      emaOK = slice[slice.length - 1] > e20[e20.length - 1] && e20[e20.length - 1] > e50[e50.length - 1];
    }
    var brk = A.isBreakout(slice, 60);
    return {
      rupturaResistencia: !!brk,
      rsiPrevio: rsiPrev != null ? +rsiPrev.toFixed(1) : null,
      alineacionEMA: !!emaOK
    };
  }

  function _conclusion(tec, macro, rally) {
    var partes = [];
    if (tec.rupturaResistencia) partes.push("ruptura de resistencia de 60 días");
    if (tec.alineacionEMA) partes.push("EMA20 sobre EMA50");
    if (tec.rsiPrevio != null && tec.rsiPrevio >= 55 && tec.rsiPrevio <= 70) partes.push("RSI fuerte (" + tec.rsiPrevio + ")");
    if (rally.volumenRelativo != null && rally.volumenRelativo >= 1.3) partes.push("volumen relativo " + rally.volumenRelativo + "×");
    if (macro && macro.noticiaSector) partes.push("narrativa: " + macro.noticiaSector.toLowerCase());
    if (!partes.length) return "Subida del " + rally.porcentajeSubida + "% en " + rally.duracionDias + " días sin catalizador técnico claro.";
    return "Rally del " + rally.porcentajeSubida + "% en " + rally.duracionDias + " días impulsado por " + partes.join(", ") + ".";
  }

  /**
   * Enriquece un rally con contextoTecnico, contextoMacro y conclusion.
   * Necesita la serie histórica (mismo objeto que se pasó al detector).
   */
  function enrich(rally, series) {
    var fuerza = null;
    var closes = series.map(function (p) { return p.close; });
    var startIdx = (rally.indices && rally.indices.startIdx != null)
      ? rally.indices.startIdx
      : _findIdx(series, rally.fechaInicio);
    var endIdx = (rally.indices && rally.indices.endIdx != null)
      ? rally.indices.endIdx
      : _findIdx(series, rally.fechaFin);

    var tec = _technicalAt(closes, Math.max(0, startIdx));
    // Volumen marcado como "alto" si volumenRelativo > 1.2
    var volAlto = rally.volumenRelativo != null && rally.volumenRelativo > 1.2;
    tec.volumenAlto = volAlto;
    tec.fuerzaRelativa = fuerza; // se asigna externamente si hay peers

    var macro = _macroFor(rally.etf.sector, rally.fechaInicio, rally.fechaFin);
    var conclusion = _conclusion(tec, macro, rally);

    return Object.assign({}, rally, {
      contextoTecnico: tec,
      contextoMacro: macro,
      conclusionAutomatica: conclusion,
      indices: { startIdx: startIdx, endIdx: endIdx }
    });
  }

  function _findIdx(series, isoDate) {
    for (var i = 0; i < series.length; i++) if (series[i].date === isoDate) return i;
    return 0;
  }

  /** Asigna fuerza relativa al rally según ranking en peers. */
  function attachRelativeStrength(rally, targetSeries, peerSeries) {
    var rs = root.ZyvolaETF.analyzer.relativeStrength(targetSeries, peerSeries, Math.max(30, rally.duracionDias));
    if (rally.contextoTecnico) rally.contextoTecnico.fuerzaRelativa = rs;
    return rally;
  }

  root.ZyvolaETF = root.ZyvolaETF || {};
  root.ZyvolaETF.rallyAnalysis = {
    enrich: enrich,
    attachRelativeStrength: attachRelativeStrength,
    DEFAULT_NARRATIVES: DEFAULT_NARRATIVES
  };
})(typeof window !== "undefined" ? window : globalThis);
