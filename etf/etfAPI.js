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

  function _buildUniverseSeries(universe, feed, days) {
    var seriesMap = {};
    universe.forEach(function (etf) {
      seriesMap[etf.ISIN] = feed.getSeriesSync(etf, days || 180);
    });
    return seriesMap;
  }

  function _detectRallies(universe, seriesMap, detector, opts) {
    var allRallies = [];
    universe.forEach(function (etf) {
      var rs = detector.findRallies(etf, seriesMap[etf.ISIN], {
        threshold: opts.threshold,
        minDays: opts.minDays,
        maxDays: opts.maxDays
      });
      allRallies.push.apply(allRallies, rs);
    });
    return allRallies;
  }

  function _enrichRallies(rallies, seriesMap, analysis) {
    var peerSeriesAll = Object.keys(seriesMap).map(function (k) { return seriesMap[k]; });
    return rallies.map(function (r) {
      var ser = seriesMap[r.etf.ISIN];
      var en = analysis.enrich(r, ser);
      analysis.attachRelativeStrength(en, ser, peerSeriesAll);
      return en;
    });
  }

    function _buildSnapshots(universe, seriesMap, analyzer) {
      var peerSeriesAll = Object.keys(seriesMap).map(function (k) { return seriesMap[k]; });
      return universe.map(function (etf) {
        var ser = seriesMap[etf.ISIN];
        var peers = peerSeriesAll.filter(function (p) { return p !== ser; });
        return analyzer.analyze(etf, ser, peers);
      });
    }

    function _computeDerivedState(universe, seriesMap, analyzer, db, patternEngine, futureFinder, opts) {
      var patterns = patternEngine.detectPatterns(db.list(), {
        minSupport: opts.minSupport || 2,
        maxFeatures: opts.maxFeatures || 4
      });
      var snapshots = _buildSnapshots(universe, seriesMap, analyzer);
      var future = futureFinder ? futureFinder.findFuture(snapshots, patterns, {
        threshold: opts.matchThreshold || 0.7
      }) : [];
      return {
        patterns: patterns,
        snapshots: snapshots,
        future: future
      };
    }

    function preloadHistoricalDatabase(opts) {
      opts = opts || {};
      var ns = _ns();
      var importer = ns.dataImporter, feed = ns.priceFeed, analyzer = ns.analyzer;
      var detector = ns.rallyDetector, db = ns.rallyDB, analysis = ns.rallyAnalysis;
      var patternEngine = ns.patternEngine, futureFinder = ns.futureFinder;

      if (!importer || !feed || !analyzer || !detector || !db || !analysis || !patternEngine) {
        throw new Error("ZyvolaETF: faltan módulos requeridos para la precarga histórica.");
      }

      var universe = importer.listETFs();
      var seriesMap = _buildUniverseSeries(universe, feed, opts.days || 180);
      var preloaded = false;
      var persisted = [];

      if (db.list().length === 0) {
        var allRallies = _detectRallies(universe, seriesMap, detector, opts);
        var enriched = _enrichRallies(allRallies, seriesMap, analysis);
        persisted = db.upsertMany(enriched);
        db.markPipelineRun({ mode: "historical-preload" });
        preloaded = true;
      }

      var derived = _computeDerivedState(universe, seriesMap, analyzer, db, patternEngine, futureFinder, opts);
      _lastRun = {
        ranAt: new Date().toISOString(),
        mode: preloaded ? "historical-preload" : "ready",
        universeCount: universe.length,
        ralliesDetected: db.list().length,
        ralliesNew: persisted.length,
        ralliesStored: db.list().length,
        patternsCount: derived.patterns.length,
        futureCount: derived.future.length,
        dbMeta: db.meta(),
        patterns: derived.patterns,
        future: derived.future,
        snapshots: derived.snapshots
      };
      return _lastRun;
    }

    /** Pipeline diario incremental. Devuelve un objeto resumen. */
  function runDailyPipeline(opts) {
    opts = opts || {};
    var ns = _ns();
    var importer = ns.dataImporter, feed = ns.priceFeed, analyzer = ns.analyzer;
    var detector = ns.rallyDetector, db = ns.rallyDB, analysis = ns.rallyAnalysis;
    var patternEngine = ns.patternEngine;

    if (!importer || !feed || !analyzer || !detector || !db || !analysis || !patternEngine) {
      throw new Error("ZyvolaETF: faltan módulos requeridos para el pipeline.");
    }

    preloadHistoricalDatabase(opts);

    var universe = importer.listETFs();
    var seriesMap = _buildUniverseSeries(universe, feed, opts.days || 180);
    var allRallies = _detectRallies(universe, seriesMap, detector, opts);
    var candidateRallies = db.filterNew(allRallies, { since: db.lastPipelineAt() });
    var enriched = _enrichRallies(candidateRallies, seriesMap, analysis);
    var persisted = db.upsertMany(enriched);
    db.markPipelineRun({ mode: "incremental" });
    var derived = _computeDerivedState(universe, seriesMap, analyzer, db, patternEngine, ns.futureFinder, opts);

    _lastRun = {
      ranAt: new Date().toISOString(),
      mode: "incremental",
      universeCount: universe.length,
      ralliesDetected: allRallies.length,
      ralliesNew: persisted.length,
      ralliesStored: db.list().length,
      patternsCount: derived.patterns.length,
      futureCount: derived.future.length,
      dbMeta: db.meta(),
      patterns: derived.patterns,
      future: derived.future,
      snapshots: derived.snapshots
    };
    return _lastRun;
  }

  var _lastRun = null;

  function getUniverse() { return _ns().dataImporter ? _ns().dataImporter.listETFs() : []; }
  function getRallies(filter) { return _ns().rallyDB ? _ns().rallyDB.query(filter || {}) : []; }
  function getRallyStats() { return _ns().rallyDB ? _ns().rallyDB.stats() : { total: 0 }; }
  function getRallyMeta() { return _ns().rallyDB ? _ns().rallyDB.meta() : { lastPipelineAt: null, firstSeededAt: null, lastSeedMode: null }; }
  function getPatterns() {
    if (_lastRun && _lastRun.patterns) return _lastRun.patterns;
    return preloadHistoricalDatabase({}).patterns;
  }
  function getFuture() {
    if (_lastRun && _lastRun.future) return _lastRun.future;
    return preloadHistoricalDatabase({}).future;
  }
  function getSnapshots() {
    if (_lastRun && _lastRun.snapshots) return _lastRun.snapshots;
    return preloadHistoricalDatabase({}).snapshots;
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
        return { ok: true, data: getRallies(params.filter) , stats: getRallyStats(), meta: getRallyMeta() };
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
    initialize: preloadHistoricalDatabase,
    runDailyPipeline: runDailyPipeline,
    rallies: getRallies,
    patterns: getPatterns,
    future: getFuture,
    snapshots: getSnapshots,
    universe: getUniverse,
    lastRun: lastRun,
    rallyStats: getRallyStats,
    rallyMeta: getRallyMeta
  };

  // Alias amistoso global
  root.ETF_API = root.ZyvolaETF.api;
  preloadHistoricalDatabase({});
})(typeof window !== "undefined" ? window : globalThis);
