/* ============================================================
 * Zyvola Service Worker
 * Estrategia: cache-first para assets estáticos,
 * network-first (con fallback a caché) para páginas HTML.
 * ============================================================ */

const CACHE_NAME = "zyvola-v3";
const CACHE_PAGES = "zyvola-pages-v3";

/* Assets que se pre-cachean al instalar el SW */
const PRECACHE_ASSETS = [
  "./",
  "./finance/panel/",
  "./assets/css/styles.css",
  "./panel/panel.css",
  "./assets/js/pages.js",
  "./assets/js/financeModuleBlueprints.js",
  "./assets/js/financeModuleEngine.js",
  "./assets/js/site.js",
  "./assets/js/charts.js",
  "./assets/js/financeToolRuntime.js",
  "./assets/js/portfolioOptimizer.js",
  "./templates/panelTemplates.js",
  "./panel/PanelGrid.js",
  "./panel/PanelTemplateEngine.js",
  "./components/ToolCard.js",
  "./components/ToolCardResizer.js",
  "./components/ToolCardMover.js",
  "./charts/AutoChartGenerator.js",
  "./panel/PanelWorkspace.js",
  "./assets/icons/icono_calculadora.png"
];

/* ── Install: pre-caché de assets estáticos ── */
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_ASSETS).catch(function () {
        /* Si algún asset falla (ej. file://) ignoramos el error
           para no bloquear la instalación */
      });
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

/* ── Activate: limpia cachés antiguas ── */
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME && k !== CACHE_PAGES; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* ── Fetch: cache-first para assets, network-first para HTML ── */
self.addEventListener("fetch", function (event) {
  var req = event.request;

  /* Ignorar peticiones no-GET y esquemas que no sean http/https */
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  /* HTML: network-first, fallback a caché */
  if (req.headers.get("Accept") && req.headers.get("Accept").indexOf("text/html") >= 0) {
    event.respondWith(
      fetch(req).then(function (res) {
        var clone = res.clone();
        caches.open(CACHE_PAGES).then(function (cache) { cache.put(req, clone); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (cached) {
          return cached || caches.match("./finance/panel/");
        });
      })
    );
    return;
  }

  /* Assets JS/CSS/imágenes: stale-while-revalidate
     (sirve caché al instante pero refresca en segundo plano para que
     el móvil reciba updates sin tener que limpiar caché manualmente). */
  event.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, clone); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});
