(function () {
  const content = document.getElementById("tool-content");
  const title = document.getElementById("tool-title");
  const objective = document.getElementById("tool-objective");
  if (!content) return;

  const blueprints = window.FINANCE_MODULE_BLUEPRINTS || [];
  const financeSections = (window.ZYVOLA_DATA && window.ZYVOLA_DATA.financeMenuSections) || [];
  const documentsSections = (window.ZYVOLA_DATA && window.ZYVOLA_DATA.documentsMenuSections) || [];
  const params = new URLSearchParams(window.location.search);
  const toolName = params.get("tool") || "";
  const section = params.get("section") || "";
  const group = params.get("group") || "";

  const isPanelPage = (document.body && document.body.dataset && document.body.dataset.page) === "panel";
  if (isPanelPage && window.ZyvolaPanelCanvas && typeof window.ZyvolaPanelCanvas.init === "function") {
    window.ZyvolaPanelCanvasInstance = window.ZyvolaPanelCanvas.init(content);
    if (window.ZyvolaPanelCanvasInstance && typeof window.ZyvolaPanelCanvasInstance.addFromQuery === "function") {
      window.ZyvolaPanelCanvasInstance.addFromQuery();
    }
    return;
  }

  /* ── Favorites panel ────────────────────────────────────────────── */
  if (section === "favoritos" && !toolName) {
    const FAVS_KEY = "zyv_finance_favorites";
    const depth = Number((document.body && document.body.dataset.depth) || 0);
    const pfx = "../".repeat(depth);
    const sectionLabelByKey = new Map(financeSections.map((s) => [s.key, s.label]));

    /* hide dashboard send slot — not applicable here */
    const sendSlot = document.getElementById("dashboard-send-slot");
    if (sendSlot) sendSlot.style.display = "none";

    function esc(value) {
      return String(value || "")
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function readFavs() {
      try {
        const raw = localStorage.getItem(FAVS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter((item) => item && item.sectionKey && item.toolName) : [];
      } catch (_e) { return []; }
    }

    function removeFav(sKey, gLabel, tName) {
      const id = sKey + "::" + (gLabel || "") + "::" + tName;
      const next = readFavs().filter((item) => (item.sectionKey + "::" + (item.groupLabel || "") + "::" + item.toolName) !== id);
      localStorage.setItem(FAVS_KEY, JSON.stringify(next));
    }

    function buildHref(item) {
      const base = pfx + "finance/panel/index.html";
      const p = new URLSearchParams({ section: item.sectionKey, tool: item.toolName });
      if (item.groupLabel) p.set("group", item.groupLabel);
      return base + "?" + p.toString();
    }

    function renderFavPanel() {
      const favs = readFavs();

      if (!favs.length) {
        content.innerHTML =
          '<div class="fav-panel">' +
            '<div class="fav-panel-header">' +
              '<div>' +
                '<h1 class="fav-panel-title">Mis Favoritos</h1>' +
                '<p class="fav-panel-sub muted">Guarda herramientas con la estrella \u2605 del men\u00fa lateral.</p>' +
              '</div>' +
            '</div>' +
            '<div class="fav-empty">' +
              '<div class="fav-empty-icon">' +
                '<svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' +
              '</div>' +
              '<h2 class="fav-empty-title">A\u00fan no tienes favoritos</h2>' +
              '<p class="fav-empty-desc">Navega por las secciones del men\u00fa lateral y guarda las herramientas que m\u00e1s uses pulsando la estrella \u2605 junto a cada una.</p>' +
            '</div>' +
          '</div>';
        return;
      }

      /* Group by sectionKey preserving insertion order */
      const grouped = new Map();
      favs.forEach(function (item) {
        if (!grouped.has(item.sectionKey)) grouped.set(item.sectionKey, []);
        grouped.get(item.sectionKey).push(item);
      });

      const totalCount = favs.length;
      const sectionCount = grouped.size;

      var groupsHtml = "";
      grouped.forEach(function (items, sKey) {
        var sLabel = sectionLabelByKey.get(sKey) || sKey;
        var cardsHtml = items.map(function (item) {
          var href = buildHref(item);
          var sName = sectionLabelByKey.get(item.sectionKey) || item.sectionKey;
          var gInfo = item.groupLabel ? " \u00b7 " + item.groupLabel : "";
          return (
            '<article class="fav-card">' +
              '<div class="fav-card-head">' +
                '<span class="fav-card-name">' + esc(item.toolName) + '</span>' +
                '<button class="fav-card-remove" type="button"' +
                  ' data-fav-section="' + esc(item.sectionKey) + '"' +
                  ' data-fav-group="' + esc(item.groupLabel || "") + '"' +
                  ' data-fav-tool="' + esc(item.toolName) + '"' +
                  ' aria-label="Quitar de favoritos" title="Quitar de favoritos">' +
                  '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' +
                '</button>' +
              '</div>' +
              '<span class="fav-card-meta">' + esc(sName) + esc(gInfo) + '</span>' +
              '<a class="fav-card-link" href="' + href + '">Abrir herramienta \u2192</a>' +
            '</article>'
          );
        }).join("");

        groupsHtml +=
          '<section class="fav-group">' +
            '<h2 class="fav-group-title">' + esc(sLabel) + '</h2>' +
            '<div class="fav-grid">' + cardsHtml + '</div>' +
          '</section>';
      });

      content.innerHTML =
        '<div class="fav-panel">' +
          '<div class="fav-panel-header">' +
            '<div>' +
              '<h1 class="fav-panel-title">Mis Favoritos</h1>' +
              '<p class="fav-panel-sub muted">' +
                totalCount + ' herramienta' + (totalCount !== 1 ? 's' : '') +
                ' \u00b7 ' + sectionCount + ' secci\u00f3n' + (sectionCount !== 1 ? 'es' : '') +
              '</p>' +
            '</div>' +
            '<button class="fav-clear-btn" type="button" id="fav-clear-all">Limpiar todo</button>' +
          '</div>' +
          '<div class="fav-panel-body">' + groupsHtml + '</div>' +
        '</div>';

      content.querySelectorAll(".fav-card-remove").forEach(function (btn) {
        btn.addEventListener("click", function () {
          removeFav(btn.getAttribute("data-fav-section"), btn.getAttribute("data-fav-group"), btn.getAttribute("data-fav-tool"));
          renderFavPanel();
        });
      });

      var clearBtn = content.querySelector("#fav-clear-all");
      if (clearBtn) {
        clearBtn.addEventListener("click", function () {
          if (window.confirm("¿Eliminar todos los favoritos?")) {
            localStorage.removeItem(FAVS_KEY);
            renderFavPanel();
          }
        });
      }
    }

    renderFavPanel();
    return;
  }
  /* ── end favorites panel ────────────────────────────────────────── */

  const normalize = (value) =>
    String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const target = blueprints.find((item) => normalize(item.name) === normalize(toolName));
  const sectionTemplates = {
    finanzas: (name) => [
      `Vista ejecutiva de ${name} con estado actual y alertas prioritarias.`,
      `Seguimiento diario de variaciones relevantes para ${name}.`,
      `Indicadores clave y umbrales configurables por perfil.`,
      `Deteccion automatica de desviaciones y oportunidades.`,
      `Resumen semanal con recomendaciones accionables.`,
      `Historial de decisiones y resultados asociados.`
    ],
    calculadoras: (name) => [
      `Formulario dinamico de parametros para ${name}.`,
      `Calculo instantaneo con validaciones de entrada.`,
      `Comparador de escenarios base, optimista y conservador.`,
      `Desglose paso a paso del resultado final.`,
      `Guardado de simulaciones frecuentes.`,
      `Exportacion de resultados a CSV y PDF.`
    ],
    simuladores: (name) => [
      `Configuracion de escenarios para ${name}.`,
      `Ejecucion de simulacion por periodos y supuestos.`,
      `Visualizacion de impacto en tiempo real.`,
      `Comparativa entre estrategias alternativas.`,
      `Alertas de riesgo por condiciones extremas.`,
      `Resumen de conclusiones accionables tras la simulacion.`
    ],
    guia: (name) => [
      `Ruta de aprendizaje estructurada para ${name}.`,
      `Checklist de conceptos esenciales por nivel.`,
      `Ejemplos practicos aplicados a casos reales.`,
      `Bloque de errores comunes y como evitarlos.`,
      `Recomendaciones de siguiente modulo relacionado.`,
      `Autoevaluacion rapida de comprension.`
    ],
    "importar-datos": (name) => [
      `Carga asistida de archivos para ${name}.`,
      "Validacion de estructura y formato de origen.",
      "Mapeo de columnas y campos detectados.",
      "Vista previa antes de confirmar importacion.",
      "Control de errores por fila y campo.",
      "Registro de trazabilidad de cargas."
    ],
    "procesamiento-automatico": (name) => [
      `Ejecucion automatica de reglas para ${name}.`,
      "Clasificacion y etiquetado de registros.",
      "Deteccion de duplicados y anomalias.",
      "Normalizacion de categorias financieras.",
      "Limpieza automatica de datos incompletos.",
      "Resumen de calidad y acciones aplicadas."
    ],
    "finanzas-automaticas": (name) => [
      `Generacion automatica del modulo ${name}.`,
      "Calculo continuo de metricas clave.",
      "Consolidacion de datos de origen importado.",
      "Actualizacion programada de resultados.",
      "Alertas de variaciones fuera de umbral.",
      "Historial de versiones del resultado."
    ],
    "informes-automaticos": (name) => [
      `Construccion automatica de ${name}.`,
      "Plantilla estandar con datos consolidados.",
      "Calendario de generacion mensual y anual.",
      "Versionado y trazabilidad documental.",
      "Control de consistencia antes de emitir.",
      "Salida lista para exportacion y auditoria."
    ],
    "exportar-y-plantillas": (name) => [
      `Salida documental para ${name}.`,
      "Exportacion en formatos CSV, Excel y PDF.",
      "Aplicacion de plantilla financiera estandar.",
      "Control de columnas y formato de entrega.",
      "Generacion de paquete documental final.",
      "Registro de descargas y versiones emitidas."
    ]
  };

  function defaultFeatures(name, sectionKey) {
    const generator = sectionTemplates[sectionKey] || sectionTemplates.finanzas;
    return generator(name);
  }

  function resolveFeatures() {
    if (target && target.functions && target.functions.length) {
      return target.functions;
    }
    return defaultFeatures(toolName || "Herramienta", section);
  }

  const resolvedName = target ? target.name : toolName || "Herramienta";
  const resolvedObjective = target
    ? target.objective
    : `Modulo operativo de ${resolvedName} con funcionalidades listas para uso inmediato.`;

  if (title) {
    title.textContent = resolvedName;
  }
  if (objective) {
    objective.textContent = resolvedObjective;
  }

  const runtime = window.FINANCE_TOOL_RUNTIME;
  if (runtime && typeof runtime.renderToolExperience === "function") {
    const handled = runtime.renderToolExperience(resolvedName, content, { section, group });
    if (handled) {
      return;
    }
  }

  const features = resolveFeatures();
  content.innerHTML = `
    <div class="cards">
      <article class="card">
        <h3>Funcionalidades</h3>
        <ul class="tool-list">${features.map((item) => `<li>${item}</li>`).join("")}</ul>
      </article>
    </div>
  `;
})();
