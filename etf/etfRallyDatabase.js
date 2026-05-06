/* =============================================================
 * Zyvola · etfRallyDatabase.js
 * Persistencia de rallies detectados (localStorage + memoria).
 * Esquema por rally:
 *   { id, etf, fechaInicio, fechaFin, duracionDias, porcentajeSubida,
 *     volumenRelativo, contextoTecnico, contextoMacro,
 *     conclusionAutomatica, registradoEn }
 * ============================================================= */
(function (root) {
  "use strict";

  var STORAGE_KEY = "zyvola.etf.rallies";
  var META_KEY = "zyvola.etf.rallies.meta";
  var memCache = null;
  var metaCache = null;

  function _now() { return new Date().toISOString(); }

  function _read() {
    if (memCache) return memCache;
    try {
      if (typeof localStorage !== "undefined") {
        var raw = localStorage.getItem(STORAGE_KEY);
        memCache = raw ? JSON.parse(raw) : [];
      } else {
        memCache = [];
      }
    } catch (e) { memCache = []; }
    return memCache;
  }

  function _write(list) {
    memCache = list;
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      }
    } catch (e) {}
  }

  function _readMeta() {
    if (metaCache) return metaCache;
    try {
      if (typeof localStorage !== "undefined") {
        var raw = localStorage.getItem(META_KEY);
        metaCache = raw ? JSON.parse(raw) : { lastPipelineAt: null, firstSeededAt: null, lastSeedMode: null };
      } else {
        metaCache = { lastPipelineAt: null, firstSeededAt: null, lastSeedMode: null };
      }
    } catch (e) {
      metaCache = { lastPipelineAt: null, firstSeededAt: null, lastSeedMode: null };
    }
    return metaCache;
  }

  function _writeMeta(meta) {
    metaCache = meta;
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(META_KEY, JSON.stringify(meta));
      }
    } catch (e) {}
  }

  function _id(rally) {
    return [rally.etf.ISIN || rally.etf.ticker, rally.fechaInicio, rally.fechaFin].join("|");
  }

  function _iso(value) {
    return value ? new Date(value).toISOString() : null;
  }

  function _sameMovement(a, b) {
    if (!a || !b || !a.etf || !b.etf) return false;
    if ((a.etf.ISIN || a.etf.ticker) !== (b.etf.ISIN || b.etf.ticker)) return false;
    if (a.fechaInicio === b.fechaInicio && a.fechaFin === b.fechaFin) return true;

    var aStart = new Date(a.fechaInicio).getTime();
    var aEnd = new Date(a.fechaFin).getTime();
    var bStart = new Date(b.fechaInicio).getTime();
    var bEnd = new Date(b.fechaFin).getTime();
    if (!(isFinite(aStart) && isFinite(aEnd) && isFinite(bStart) && isFinite(bEnd))) return false;

    var overlap = Math.min(aEnd, bEnd) - Math.max(aStart, bStart);
    if (overlap < 0) return false;
    var aLen = Math.max(1, aEnd - aStart);
    var bLen = Math.max(1, bEnd - bStart);
    var overlapRatio = overlap / Math.min(aLen, bLen);
    return overlapRatio >= 0.7;
  }

  function list() { return _read().slice(); }
  function meta() { return Object.assign({}, _readMeta()); }
  function lastPipelineAt() { return _readMeta().lastPipelineAt || null; }

  function getById(id) {
    var found = _read().filter(function (r) { return r.id === id; });
    return found[0] || null;
  }

  function has(rally) {
    var all = _read();
    for (var i = 0; i < all.length; i++) {
      if (_sameMovement(all[i], rally)) return true;
    }
    return false;
  }

  function filterNew(rallies, options) {
    options = options || {};
    var all = _read();
    var since = options.since || lastPipelineAt();
    return (rallies || []).filter(function (rally) {
      var endDate = _iso(rally.fechaFin);
      if (since && endDate && endDate <= _iso(since)) return false;
      for (var i = 0; i < all.length; i++) {
        if (_sameMovement(all[i], rally)) return false;
      }
      return true;
    });
  }

  function upsert(rally) {
    var all = _read();
    var id = rally.id || _id(rally);
    var idx = -1;
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id || _sameMovement(all[i], rally)) { idx = i; break; }
    }
    var entry = Object.assign({ registradoEn: _now() }, rally, { id: id });
    if (idx >= 0) all[idx] = Object.assign({}, all[idx], entry);
    else all.push(entry);
    _write(all);
    return entry;
  }

  function upsertMany(rallies) {
    var out = [];
    (rallies || []).forEach(function (r) { out.push(upsert(r)); });
    return out;
  }

  function markPipelineRun(info) {
    var current = _readMeta();
    var next = Object.assign({}, current, {
      lastPipelineAt: (info && info.at) || _now(),
      lastSeedMode: (info && info.mode) || current.lastSeedMode || "incremental"
    });
    if (!current.firstSeededAt && info && info.mode === "historical-seed") {
      next.firstSeededAt = next.lastPipelineAt;
    }
    _writeMeta(next);
    return next;
  }

  function query(filter) {
    filter = filter || {};
    return _read().filter(function (r) {
      if (filter.gestora && r.etf.gestora !== filter.gestora) return false;
      if (filter.sector && r.etf.sector !== filter.sector) return false;
      if (filter.minPct != null && r.porcentajeSubida < filter.minPct) return false;
      if (filter.maxDuracion != null && r.duracionDias > filter.maxDuracion) return false;
      if (filter.minDuracion != null && r.duracionDias < filter.minDuracion) return false;
      if (filter.desde && r.fechaFin < filter.desde) return false;
      if (filter.hasta && r.fechaInicio > filter.hasta) return false;
      return true;
    });
  }

  function stats() {
    var all = _read();
    if (!all.length) return { total: 0 };
    var bySector = {}, byGestora = {};
    var sumPct = 0, sumDur = 0;
    all.forEach(function (r) {
      bySector[r.etf.sector] = (bySector[r.etf.sector] || 0) + 1;
      byGestora[r.etf.gestora] = (byGestora[r.etf.gestora] || 0) + 1;
      sumPct += r.porcentajeSubida;
      sumDur += r.duracionDias;
    });
    return {
      total: all.length,
      mediaPct: +(sumPct / all.length).toFixed(2),
      mediaDuracion: +(sumDur / all.length).toFixed(1),
      bySector: bySector,
      byGestora: byGestora
    };
  }

  root.ZyvolaETF = root.ZyvolaETF || {};
  root.ZyvolaETF.rallyDB = {
    list: list,
    meta: meta,
    lastPipelineAt: lastPipelineAt,
    getById: getById,
    has: has,
    filterNew: filterNew,
    upsert: upsert,
    upsertMany: upsertMany,
    markPipelineRun: markPipelineRun,
    query: query,
    stats: stats
  };
})(typeof window !== "undefined" ? window : globalThis);
