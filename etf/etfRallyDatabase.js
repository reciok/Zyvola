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
  var memCache = null;

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

  function _id(rally) {
    return [rally.etf.ISIN || rally.etf.ticker, rally.fechaInicio, rally.fechaFin].join("|");
  }

  function list() { return _read().slice(); }

  function getById(id) {
    var found = _read().filter(function (r) { return r.id === id; });
    return found[0] || null;
  }

  function upsert(rally) {
    var all = _read();
    var id = rally.id || _id(rally);
    var idx = -1;
    for (var i = 0; i < all.length; i++) if (all[i].id === id) { idx = i; break; }
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

  function remove(id) {
    var all = _read().filter(function (r) { return r.id !== id; });
    _write(all);
  }

  function clear() { _write([]); }

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
    getById: getById,
    upsert: upsert,
    upsertMany: upsertMany,
    remove: remove,
    clear: clear,
    query: query,
    stats: stats
  };
})(typeof window !== "undefined" ? window : globalThis);
