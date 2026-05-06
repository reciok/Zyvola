/* =============================================================
 * Zyvola · etfAPI.js
 * Capa de "endpoints" para la app. Como la app es estática (sin
 * backend), exponemos un dispatcher: ETF_API.call("/etf/...").
 * También se exponen helpers directos: rallies(), patterns(),
 * future(), runDailyPipeline().
 *
 * Endpoints:
 *   /etf/universe   → catálogo de ETFs
 *   /etf/snapshot   → análisis técnico actual de cada ETF
 *   /etf/rallies    → rallies registrados (DB)
 *   /etf/patrones   → patrones detectados
 *   /etf/futuro     → ETFs con futuro
 *   /etf/run        → ejecuta pipeline completo (importar → detectar
 *                     → analizar → registrar → patrones)
 * ============================================================= */
(function (root) {
  "use strict";

  function _ns() { return root.ZyvolaETF || {}; }

  /** Pipeline completo. Devuelve un objeto resumen. */
  function runDailyPipeline(opts) {
    opts = opts || {};
    var ns = _ns();
    var importer = ns.dataImporter, feed = ns.priceFeed, analyzer = ns.analyzer;
    var detector = ns.rallyDetector, db = ns.rallyDB, analysis = ns.rallyAnalysis;
    var patternEngine = ns.patternEngine;

    if (!importer || !feed || !analyzer || !detector || !db || !analysis || !patternEngine) {
      throw new Error("ZyvolaETF: faltan módulos requeridos para el pipeline.");
    }

    var universe = importer.listETFs();
    var seriesMap = {};
    universe.forEach(function (etf) {
      seriesMap[etf.ISIN] = feed.getSeriesSync(etf, opts.days || 180);
    });

    // 1) Detección de rallies por cada ETF
    var allRallies = [];
    universe.forEach(function (etf) {
      var rs = detector.findRallies(etf, seriesMap[etf.ISIN], {
        threshold: opts.threshold,
        minDays: opts.minDays,
        maxDays: opts.maxDays
      });
      allRallies.push.apply(allRallies, rs);
    });

    // 2) Enriquecer cada rally con técnico + macro + fuerza relativa
    var peerSeriesAll = Object.keys(seriesMap).map(function (k) { return seriesMap[k]; });
    var enriched = allRallies.map(function (r) {
      var ser = seriesMap[r.etf.ISIN];
      var en = analysis.enrich(r, ser);
      analysis.attachRelativeStrength(en, ser, peerSeriesAll);
      return en;
    });

    // 3) Persistir en la DB
    db.upsertMany(enriched);

    // 4) Patrones a partir del histórico ya almacenado
    var allHistorical = db.list();
    var patterns = patternEngine.detectPatterns(allHistorical, {
      minSupport: opts.minSupport || 2,
      maxFeatures: opts.maxFeatures || 4
    });

    // 5) Snapshots actuales para "ETFs con futuro"
    var snapshots = universe.map(function (etf) {
      var ser = seriesMap[etf.ISIN];
      var peers = peerSeriesAll.filter(function (p) { return p !== ser; });
      return analyzer.analyze(etf, ser, peers);
    });

    var futureFinder = ns.futureFinder;
    var future = futureFinder ? futureFinder.findFuture(snapshots, patterns, {
      threshold: opts.matchThreshold || 0.7
    }) : [];

    // Cachear última ejecución
    _lastRun = {
      ranAt: new Date().toISOString(),
      universeCount: universe.length,
      ralliesDetected: allRallies.length,
      ralliesStored: db.list().length,
      patternsCount: patterns.length,
      futureCount: future.length,
      patterns: patterns,
      future: future,
      snapshots: snapshots
    };
    return _lastRun;
  }

  var _lastRun = null;

  function getUniverse() { return _ns().dataImporter ? _ns().dataImporter.listETFs() : []; }
  function getRallies(filter) { return _ns().rallyDB ? _ns().rallyDB.query(filter || {}) : []; }
  function getRallyStats() { return _ns().rallyDB ? _ns().rallyDB.stats() : { total: 0 }; }
  function getPatterns() {
    if (_lastRun && _lastRun.patterns) return _lastRun.patterns;
    var pe = _ns().patternEngine, db = _ns().rallyDB;
    if (!pe || !db) return [];
    return pe.detectPatterns(db.list(), {});
  }
  function getFuture() {
    if (_lastRun && _lastRun.future) return _lastRun.future;
    return [];
  }
  function getSnapshots() {
    if (_lastRun && _lastRun.snapshots) return _lastRun.snapshots;
    return [];
  }

  function call(path, params) {
    params = params || {};
    var p = (path || "").replace(/\/+$/, "");
    switch (p) {
      case "/etf/universe":
        return { ok: true, data: getUniverse() };
      case "/etf/snapshot":
        return { ok: true, data: getSnapshots() };
      case "/etf/rallies":
        return { ok: true, data: getRallies(params.filter) , stats: getRallyStats() };
      case "/etf/patrones":
      case "/etf/patterns":
        return { ok: true, data: getPatterns() };
      case "/etf/futuro":
      case "/etf/future":
        return { ok: true, data: getFuture() };
      case "/etf/run":
        return { ok: true, data: runDailyPipeline(params) };
      default:
        return { ok: false, error: "Endpoint desconocido: " + path,
                 endpoints: ["/etf/universe", "/etf/snapshot", "/etf/rallies", "/etf/patrones", "/etf/futuro", "/etf/run"] };
    }
  }

  function lastRun() { return _lastRun; }

  root.ZyvolaETF = root.ZyvolaETF || {};
  root.ZyvolaETF.api = {
    call: call,
    runDailyPipeline: runDailyPipeline,
    rallies: getRallies,
    patterns: getPatterns,
    future: getFuture,
    snapshots: getSnapshots,
    universe: getUniverse,
    lastRun: lastRun,
    rallyStats: getRallyStats
  };

  // Alias amistoso global
  root.ETF_API = root.ZyvolaETF.api;
})(typeof window !== "undefined" ? window : globalThis);
