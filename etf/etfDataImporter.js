/* =============================================================
 * Zyvola · etfDataImporter.js
 * Importa y mantiene la lista maestra de ETFs UCITS europeos
 * disponibles en Trade Republic. Como la app es estática, usa
 * un dataset semilla curado (gestoras: iShares, Amundi, Xtrackers,
 * Lyxor, Vanguard) y permite enriquecerlo con un loader externo
 * vía ETF_DATA.setRemoteFetcher(fn).
 * ============================================================= */
(function (root) {
  "use strict";

  // -------- Dataset semilla (UCITS, top de cada gestora) -------------
  // Campos: nombre, ticker (Xetra/EuroTLX cuando aplica), ISIN, gestora,
  //          TER (%), sector/tema, tipo (Equity/Bond/Commodity/...),
  //          moneda.
  var SEED_ETFS = [
    // ---- iShares ----
    { nombre: "iShares Core MSCI World UCITS ETF",          ticker: "EUNL",  ISIN: "IE00B4L5Y983", gestora: "iShares",  TER: 0.20, sector: "Global Equity",   tipo: "Equity",    moneda: "EUR" },
    { nombre: "iShares Core S&P 500 UCITS ETF",             ticker: "CSPX",  ISIN: "IE00B5BMR087", gestora: "iShares",  TER: 0.07, sector: "US Large Cap",    tipo: "Equity",    moneda: "USD" },
    { nombre: "iShares Nasdaq 100 UCITS ETF",               ticker: "CNDX",  ISIN: "IE00B53SZB19", gestora: "iShares",  TER: 0.33, sector: "US Tech",         tipo: "Equity",    moneda: "USD" },
    { nombre: "iShares MSCI Emerging Markets IMI UCITS ETF",ticker: "EIMI",  ISIN: "IE00BKM4GZ66", gestora: "iShares",  TER: 0.18, sector: "Emerging",        tipo: "Equity",    moneda: "USD" },
    { nombre: "iShares Automation & Robotics UCITS ETF",    ticker: "RBOT",  ISIN: "IE00BYZK4552", gestora: "iShares",  TER: 0.40, sector: "Robotics & AI",   tipo: "Equity",    moneda: "USD" },
    { nombre: "iShares Global Clean Energy UCITS ETF",      ticker: "INRG",  ISIN: "IE00B1XNHC34", gestora: "iShares",  TER: 0.65, sector: "Clean Energy",    tipo: "Equity",    moneda: "USD" },
    { nombre: "iShares MSCI World Information Technology",  ticker: "5MVW",  ISIN: "IE00BM67HT60", gestora: "iShares",  TER: 0.25, sector: "Tech",            tipo: "Equity",    moneda: "USD" },
    { nombre: "iShares Core EURO STOXX 50 UCITS ETF",       ticker: "CSX5",  ISIN: "IE0008471009", gestora: "iShares",  TER: 0.10, sector: "Europe Large Cap",tipo: "Equity",    moneda: "EUR" },
    { nombre: "iShares Physical Gold ETC",                  ticker: "SGLN",  ISIN: "IE00B4ND3602", gestora: "iShares",  TER: 0.12, sector: "Gold",            tipo: "Commodity", moneda: "USD" },
    { nombre: "iShares Core Global Aggregate Bond UCITS",   ticker: "AGGH",  ISIN: "IE00BDBRDM35", gestora: "iShares",  TER: 0.10, sector: "Global Bonds",    tipo: "Bond",      moneda: "EUR" },

    // ---- Amundi (incluye antiguos Lyxor integrados) ----
    { nombre: "Amundi MSCI World UCITS ETF",                ticker: "CW8",   ISIN: "LU1681043599", gestora: "Amundi",   TER: 0.38, sector: "Global Equity",   tipo: "Equity",    moneda: "EUR" },
    { nombre: "Amundi S&P 500 UCITS ETF",                   ticker: "500",   ISIN: "LU1681048804", gestora: "Amundi",   TER: 0.15, sector: "US Large Cap",    tipo: "Equity",    moneda: "EUR" },
    { nombre: "Amundi MSCI Semiconductors ESG UCITS ETF",   ticker: "SEMI",  ISIN: "LU1900066033", gestora: "Amundi",   TER: 0.35, sector: "Semiconductors",  tipo: "Equity",    moneda: "USD" },
    { nombre: "Amundi MSCI India UCITS ETF",                ticker: "CI2",   ISIN: "LU1681045370", gestora: "Amundi",   TER: 0.85, sector: "India",           tipo: "Equity",    moneda: "USD" },
    { nombre: "Amundi MSCI Europe UCITS ETF",               ticker: "CEU",   ISIN: "LU1681042864", gestora: "Amundi",   TER: 0.15, sector: "Europe",          tipo: "Equity",    moneda: "EUR" },

    // ---- Xtrackers ----
    { nombre: "Xtrackers MSCI World UCITS ETF",             ticker: "XDWD",  ISIN: "IE00BJ0KDQ92", gestora: "Xtrackers",TER: 0.19, sector: "Global Equity",   tipo: "Equity",    moneda: "USD" },
    { nombre: "Xtrackers Artificial Intelligence & Big Data",ticker:"XAIX",  ISIN: "IE00BGV5VN51", gestora: "Xtrackers",TER: 0.35, sector: "AI & Big Data",   tipo: "Equity",    moneda: "USD" },
    { nombre: "Xtrackers MSCI USA Banks UCITS ETF",         ticker: "XUFB",  ISIN: "IE00BCHWNQ94", gestora: "Xtrackers",TER: 0.12, sector: "US Banks",        tipo: "Equity",    moneda: "USD" },
    { nombre: "Xtrackers MSCI Japan UCITS ETF",             ticker: "XMJD",  ISIN: "IE00BJ0KDR00", gestora: "Xtrackers",TER: 0.20, sector: "Japan",           tipo: "Equity",    moneda: "JPY" },
    { nombre: "Xtrackers MSCI World Momentum UCITS ETF",    ticker: "XDEM",  ISIN: "IE00BL25JL35", gestora: "Xtrackers",TER: 0.25, sector: "Momentum Factor", tipo: "Equity",    moneda: "USD" },

    // ---- Lyxor (vivos como UCITS legacy) ----
    { nombre: "Lyxor STOXX Europe 600 Banks UCITS ETF",     ticker: "BNK",   ISIN: "LU1834983550", gestora: "Lyxor",    TER: 0.30, sector: "Europe Banks",    tipo: "Equity",    moneda: "EUR" },
    { nombre: "Lyxor MSCI Future Mobility UCITS ETF",       ticker: "ELCR",  ISIN: "LU2023679256", gestora: "Lyxor",    TER: 0.45, sector: "EV & Mobility",   tipo: "Equity",    moneda: "USD" },
    { nombre: "Lyxor MSCI Disruptive Technology UCITS ETF", ticker: "UNIC",  ISIN: "LU2023678100", gestora: "Lyxor",    TER: 0.45, sector: "Disruptive Tech", tipo: "Equity",    moneda: "USD" },

    // ---- Vanguard ----
    { nombre: "Vanguard FTSE All-World UCITS ETF",          ticker: "VWCE",  ISIN: "IE00BK5BQT80", gestora: "Vanguard", TER: 0.22, sector: "Global Equity",   tipo: "Equity",    moneda: "EUR" },
    { nombre: "Vanguard S&P 500 UCITS ETF",                 ticker: "VUAA",  ISIN: "IE00BFMXXD54", gestora: "Vanguard", TER: 0.07, sector: "US Large Cap",    tipo: "Equity",    moneda: "USD" },
    { nombre: "Vanguard FTSE Developed World UCITS ETF",    ticker: "VGVE",  ISIN: "IE00BKX55T58", gestora: "Vanguard", TER: 0.12, sector: "Developed World", tipo: "Equity",    moneda: "USD" },
    { nombre: "Vanguard FTSE Emerging Markets UCITS ETF",   ticker: "VFEM",  ISIN: "IE00B3VVMM84", gestora: "Vanguard", TER: 0.22, sector: "Emerging",        tipo: "Equity",    moneda: "USD" },
    { nombre: "Vanguard EUR Eurozone Government Bond",      ticker: "VETY",  ISIN: "IE00BZ163M45", gestora: "Vanguard", TER: 0.07, sector: "EUR Govt Bonds",  tipo: "Bond",      moneda: "EUR" }
  ];

  var STORAGE_KEY = "zyvola.etf.universe";
  var remoteFetcher = null; // función opcional inyectada externamente

  function _now() { return new Date().toISOString(); }

  function _readStorage() {
    try {
      if (typeof localStorage === "undefined") return null;
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function _writeStorage(payload) {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {}
  }

  function getUniverse() {
    var cached = _readStorage();
    if (cached && Array.isArray(cached.list) && cached.list.length) return cached;
    var fresh = { updatedAt: _now(), source: "seed", list: SEED_ETFS.slice() };
    _writeStorage(fresh);
    return fresh;
  }

  function listETFs() { return getUniverse().list.slice(); }
  function findByISIN(isin) { return listETFs().filter(function (e) { return e.ISIN === isin; })[0] || null; }
  function findByTicker(t) { return listETFs().filter(function (e) { return e.ticker === t; })[0] || null; }

  function setRemoteFetcher(fn) { remoteFetcher = (typeof fn === "function") ? fn : null; }

  /**
   * Refresca el universo ETF. Si hay remoteFetcher configurado lo usa,
   * si no, devuelve la semilla. El fetcher debe devolver Promise<Array>.
   */
  function refresh() {
    if (!remoteFetcher) {
      var data = { updatedAt: _now(), source: "seed", list: SEED_ETFS.slice() };
      _writeStorage(data);
      return Promise.resolve(data);
    }
    return Promise.resolve(remoteFetcher())
      .then(function (list) {
        if (!Array.isArray(list) || !list.length) throw new Error("remoteFetcher sin datos");
        var data = { updatedAt: _now(), source: "remote", list: list };
        _writeStorage(data);
        return data;
      })
      .catch(function () {
        var data = { updatedAt: _now(), source: "seed-fallback", list: SEED_ETFS.slice() };
        _writeStorage(data);
        return data;
      });
  }

  function clearCache() {
    try { if (typeof localStorage !== "undefined") localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  root.ZyvolaETF = root.ZyvolaETF || {};
  root.ZyvolaETF.dataImporter = {
    listETFs: listETFs,
    getUniverse: getUniverse,
    findByISIN: findByISIN,
    findByTicker: findByTicker,
    refresh: refresh,
    setRemoteFetcher: setRemoteFetcher,
    clearCache: clearCache,
    SEED_ETFS: SEED_ETFS
  };
})(typeof window !== "undefined" ? window : globalThis);
