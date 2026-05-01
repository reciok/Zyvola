(function () {
  /* ── Marble background (inline SVG so feTurbulence filters render) ── */
  (function injectMarble() {
    if (document.getElementById("marble-bg")) return;
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.id = "marble-bg";
    svg.setAttribute("xmlns", ns);
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svg.setAttribute("viewBox", "0 0 1920 1080");
    svg.innerHTML = `
      <defs>
        <filter id="_mb" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.0025 0.007" numOctaves="6" seed="8" stitchTiles="stitch" result="n1"/>
          <feTurbulence type="fractalNoise" baseFrequency="0.009 0.003" numOctaves="4" seed="22" stitchTiles="stitch" result="n2"/>
          <feTurbulence type="fractalNoise" baseFrequency="0.018 0.009" numOctaves="3" seed="42" stitchTiles="stitch" result="n3"/>
          <feMerge result="cn"><feMergeNode in="n1"/><feMergeNode in="n2"/></feMerge>
          <feColorMatrix in="cn" type="saturate" values="0" result="g"/>
          <feComponentTransfer in="g" result="veins">
            <feFuncR type="discrete" tableValues="1 1 1 0.97 0.88 0.72 0.52 0.4 0.52 0.72 0.88 0.97 1 1 1 1"/>
            <feFuncG type="discrete" tableValues="1 1 1 0.98 0.92 0.82 0.66 0.56 0.66 0.82 0.92 0.98 1 1 1 1"/>
            <feFuncB type="discrete" tableValues="1 1 1 0.99 0.97 0.93 0.86 0.8 0.86 0.93 0.97 0.99 1 1 1 1"/>
          </feComponentTransfer>
          <feGaussianBlur in="veins" stdDeviation="2.2" result="sv"/>
          <feColorMatrix in="sv" type="matrix" values="0.35 0.3  0.35 0 0.5
                                                        0.25 0.2  0.55 0 0.58
                                                        0.1  0.08 0.82 0 0.68
                                                        0    0    0    1 0" result="bv"/>
          <feColorMatrix in="n3" type="saturate" values="0" result="fg"/>
          <feComponentTransfer in="fg" result="fv">
            <feFuncR type="linear" slope="0.08" intercept="0.94"/>
            <feFuncG type="linear" slope="0.06" intercept="0.96"/>
            <feFuncB type="linear" slope="0.03" intercept="0.99"/>
          </feComponentTransfer>
          <feGaussianBlur in="fv" stdDeviation="0.5" result="sf"/>
          <feBlend in="bv" in2="sf" mode="multiply" result="cb"/>
          <feComponentTransfer in="cb">
            <feFuncR type="linear" slope="1.08" intercept="0.02"/>
            <feFuncG type="linear" slope="1.04" intercept="0.05"/>
            <feFuncB type="linear" slope="0.98" intercept="0.08"/>
          </feComponentTransfer>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="#fafcff" filter="url(#_mb)"/>
    `;
    document.body.prepend(svg);
  })();

  const data = window.ZYVOLA_DATA;

  if (!data) return;

  const body = document.body;
  const depth = Number(body.dataset.depth || 0);
  const pageKey = body.dataset.page || "home";
  const categoryKey = body.dataset.category || "";
  const prefix = "../".repeat(depth);
  const toolsById = Object.fromEntries((data.tools || []).map((tool) => [tool.id, tool]));
  let closeFinanceMenuOnOutsideClick = null;
  const FINANCE_FAVORITES_KEY = "zyv_finance_favorites";
  const I18N_LANG_KEY = "zyv_lang";
  const SUPPORTED_LANGS = ["es", "en"];

  const i18n = {
    es: {
      header: {
        menu: "Menú"
      },
      nav: {
        home: "Inicio",
        panel: "Panel",
        documentos: "Documentos",
        connect: "Connect"
      },
      footer: {
        map: "Mapa del Sitio",
        legal: "Legal",
        privacy: "Política de privacidad (placeholder)",
        terms: "Términos de servicio (placeholder)",
        copy: "Copyright 2026 Zyvola. Todos los derechos reservados.",
        claim: "Ecosistema premium modular inspirado en claridad operativa, ritmo visual y escalabilidad."
      },
      home: {
        hero: {
          title: "Plataforma Modular Premium Para Flujos de Precisión",
          lead: "Construye en finanzas, productividad, herramientas, creatividad y sistemas de vida desde una sola arquitectura premium. Zyvola escala de pocos módulos a cientos sin perder claridad visual ni orden."
        },
        search: {
          aria: "Buscador global de herramientas",
          ariaInput: "Búsqueda global",
          placeholder: "Buscar módulos, herramientas y categorías",
          button: "Explorar Hub"
        },
        quicklinks: {
          aria: "Accesos directos de categorías"
        },
        sections: {
          mostUsed: {
            title: "Más Usados",
            copy: "Módulos de alta demanda con marcadores de layout premium."
          },
          new: {
            title: "Nuevos",
            copy: "Nuevos espacios de arquitectura listos para próximas herramientas."
          },
          recommended: {
            title: "Recomendados",
            copy: "Rutas curadas entre categorías para una navegación estratégica."
          }
        }
      },
      search: {
        category: "Categoría",
        tool: "Herramienta"
      }
    },
    en: {
      header: {
        menu: "Menu"
      },
      nav: {
        home: "Home",
        panel: "Panel",
        documentos: "Documents",
        connect: "Connect"
      },
      footer: {
        map: "Sitemap",
        legal: "Legal",
        privacy: "Privacy policy (placeholder)",
        terms: "Terms of service (placeholder)",
        copy: "Copyright 2026 Zyvola. All rights reserved.",
        claim: "Premium modular ecosystem inspired by operational clarity, visual rhythm and scalability."
      },
      home: {
        hero: {
          title: "Premium Modular Platform For Precision Flows",
          lead: "Build across finance, productivity, tools, creativity and life systems from a single premium architecture. Zyvola scales from a few modules to hundreds without losing clarity or structure."
        },
        search: {
          aria: "Global tools search",
          ariaInput: "Global search",
          placeholder: "Search modules, tools and categories",
          button: "Explore Hub"
        },
        quicklinks: {
          aria: "Category quick links"
        },
        sections: {
          mostUsed: {
            title: "Most Used",
            copy: "High-demand modules with premium layout markers."
          },
          new: {
            title: "New",
            copy: "New architecture spaces ready for upcoming tools."
          },
          recommended: {
            title: "Recommended",
            copy: "Curated cross-category routes for strategic navigation."
          }
        }
      },
      search: {
        category: "Category",
        tool: "Tool"
      }
    }
  };

  function detectLanguage() {
    var saved = (localStorage.getItem(I18N_LANG_KEY) || "").toLowerCase();
    if (SUPPORTED_LANGS.indexOf(saved) >= 0) return saved;
    var browserLang = (navigator.language || "es").slice(0, 2).toLowerCase();
    return SUPPORTED_LANGS.indexOf(browserLang) >= 0 ? browserLang : "es";
  }

  let currentLang = detectLanguage();

  function getI18nValue(path, fallback) {
    var parts = String(path || "").split(".");
    var cursor = i18n[currentLang] || i18n.es;
    for (var i = 0; i < parts.length; i += 1) {
      if (!cursor || typeof cursor !== "object") return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function navLabel(item) {
    if (!item) return "";
    return getI18nValue("nav." + item.key, item.label || item.key || "");
  }

  function setLanguage(lang) {
    var next = String(lang || "").toLowerCase();
    if (SUPPORTED_LANGS.indexOf(next) < 0) next = "es";
    currentLang = next;
    localStorage.setItem(I18N_LANG_KEY, next);
    document.documentElement.setAttribute("lang", next);
  }

  function translateStaticPageContent() {
    document.querySelectorAll("[data-i18n]").forEach(function (node) {
      var key = node.getAttribute("data-i18n") || "";
      var fallback = node.getAttribute("data-i18n-fallback") || node.textContent;
      node.textContent = getI18nValue(key, fallback);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (node) {
      var key = node.getAttribute("data-i18n-placeholder") || "";
      var fallback = node.getAttribute("placeholder") || "";
      node.setAttribute("placeholder", getI18nValue(key, fallback));
    });

    document.querySelectorAll("[data-i18n-aria-label]").forEach(function (node) {
      var key = node.getAttribute("data-i18n-aria-label") || "";
      var fallback = node.getAttribute("aria-label") || "";
      node.setAttribute("aria-label", getI18nValue(key, fallback));
    });
  }

  const withPrefix = (href) => `${prefix}${href}`;

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function getToolByRef(ref) {
    if (!ref) return null;
    if (typeof ref === "string") return toolsById[ref] || null;
    if (typeof ref === "object" && ref.id) return toolsById[ref.id] || null;
    return null;
  }

  function loadFinanceFavorites() {
    try {
      const raw = localStorage.getItem(FINANCE_FAVORITES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item) => item && item.sectionKey && item.toolName);
    } catch (_e) {
      return [];
    }
  }

  function saveFinanceFavorites(favorites) {
    localStorage.setItem(FINANCE_FAVORITES_KEY, JSON.stringify(favorites));
  }

  function favoriteId(sectionKey, groupLabel, toolName) {
    return `${sectionKey}::${groupLabel || ""}::${toolName}`;
  }

  function isFavoriteTool(favorites, sectionKey, groupLabel, toolName) {
    const id = favoriteId(sectionKey, groupLabel, toolName);
    return favorites.some((item) => favoriteId(item.sectionKey, item.groupLabel, item.toolName) === id);
  }

  function toggleFavoriteTool(sectionKey, groupLabel, toolName) {
    const favorites = loadFinanceFavorites();
    const id = favoriteId(sectionKey, groupLabel, toolName);
    const exists = favorites.some((item) => favoriteId(item.sectionKey, item.groupLabel, item.toolName) === id);
    if (exists) {
      saveFinanceFavorites(
        favorites.filter((item) => favoriteId(item.sectionKey, item.groupLabel, item.toolName) !== id)
      );
      return;
    }

    favorites.push({
      sectionKey,
      groupLabel: groupLabel || "",
      toolName
    });
    saveFinanceFavorites(favorites);
  }

  function renderHeader() {
    const mount = document.getElementById("site-header");
    if (!mount) return;

    const links = data.nav
      .filter((item) => item.key !== "educacion")
      .map((item) => {
        const active = item.key === pageKey ? "active" : "";
        return `<li><a class="nav-link ${active}" href="${withPrefix(item.href)}">${navLabel(item)}</a></li>`;
      })
      .join("");

    mount.innerHTML = `
      <header class="site-header">
        <div class="container nav-shell">
          <a class="brand" href="${withPrefix("index.html")}" aria-label="Inicio de Zyvola">
            <span>Zyvola</span>
          </a>
          <div class="nav-actions">
            <button class="mobile-toggle" aria-expanded="false" aria-controls="site-nav">${getI18nValue("header.menu", "Menú")}</button>
          </div>
          <ul id="site-nav" class="nav-list">${links}</ul>
        </div>
      </header>
    `;

    const toggle = mount.querySelector(".mobile-toggle");
    const nav = mount.querySelector(".nav-list");
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        const open = nav.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
      });
    }

  }

  function renderFooter() {
    const mount = document.getElementById("site-footer");
    if (!mount) return;

    if (pageKey !== "home") {
      mount.innerHTML = "";
      return;
    }

    const map = data.nav
      .map((item) => `<a class="footer-link" href="${withPrefix(item.href)}">${navLabel(item)}</a>`)
      .join("");

    mount.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-grid">
          <div>
            <p class="footer-title">Zyvola</p>
            <p class="muted">${getI18nValue("footer.claim", "Ecosistema premium modular inspirado en claridad operativa, ritmo visual y escalabilidad.")}</p>
          </div>
          <div class="footer-map">
            <p class="footer-title">${getI18nValue("footer.map", "Mapa del Sitio")}</p>
            ${map}
          </div>
          <div class="footer-legal">
            <p class="footer-title">${getI18nValue("footer.legal", "Legal")}</p>
            <span class="muted">${getI18nValue("footer.privacy", "Política de privacidad (placeholder)")}</span>
            <span class="muted">${getI18nValue("footer.terms", "Términos de servicio (placeholder)")}</span>
            <span class="muted">${getI18nValue("footer.copy", "Copyright 2026 Zyvola. Todos los derechos reservados.")}</span>
          </div>
        </div>
      </footer>
    `;
  }

  const sectionIcons = {
    favoritos: `<img src="${prefix}assets/icons/icono_favoritos.png" width="44" height="44" alt="" aria-hidden="true" class="finance-favorites-section-icon" style="display:block;object-fit:contain;filter:brightness(0) saturate(100%);">`,
    calculadoras: `<img src="${prefix}assets/icons/icono_calculadora.png" width="44" height="44" alt="" aria-hidden="true" style="display:block;object-fit:contain;filter:brightness(0) saturate(100%);">`,
    finanzas: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    simuladores: `<img src="${prefix}assets/icons/icono_simuladores.png" width="44" height="44" alt="" aria-hidden="true" style="display:block;object-fit:contain;filter:brightness(0) saturate(100%);">`,
    optimizador: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M16.24 7.76a6 6 0 0 1 0 8.49M4.93 19.07a10 10 0 0 1 0-14.14M7.76 16.24a6 6 0 0 1 0-8.49"/></svg>`,
    analizador: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,
    inversion: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>`,
    ahorro: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 11.5 5c-.59 0-1.14.08-1.67.22"/><path d="M12 22v-5"/><path d="M9 8c0 1.5.5 3 2 4"/><circle cx="8" cy="10" r="5"/></svg>`,
    presupuestos: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  };

  function getSectionIcon(key) {
    return sectionIcons[key] || `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`;
  }

  function getFavoritesSectionIcon(hasSavedFavorites) {
    return `<img src="${prefix}assets/icons/icono_favoritos.png" width="44" height="44" alt="" aria-hidden="true" class="finance-favorites-section-icon ${hasSavedFavorites ? "is-saved" : ""}" style="display:block;object-fit:contain;">`;
  }

  function renderFinanceToolsMenu() {
    const mount = document.getElementById("finance-tools-menu");
    if (!mount) {
      body.classList.remove("has-finance-sidebar");
      body.classList.remove("has-finance-secondary");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const isFinanceToolPage = /\/finance\/(herramienta|panel)\/index\.html$/i.test(window.location.pathname);
    const hasSelectedTool = Boolean(params.get("tool"));
    const expandedGroupsBySection = new Map();

    body.classList.add("has-finance-sidebar");
    body.classList.remove("has-finance-secondary");

    const isDocumentsPage = pageKey === "documentos";
    const isEducationPage = pageKey === "educacion";
    const sectionsOrder = isDocumentsPage
      ? [
          "importar-datos",
          "procesamiento-automatico",
          "finanzas-automaticas",
          "informes-automaticos",
          "exportar-y-plantillas"
        ]
      : isEducationPage
      ? ["guias", "cursos", "ejercicios-y-practica"]
      : [
          "finanzas",
          "calculadoras",
          "simuladores",
          "optimizador",
          "analizador",
          "inversion",
          "ahorro",
          "presupuestos",
          "impuestos",
          "riesgo",
          "herramientas-rapidas",
          "comparadores",
          "planificadores",
          "conversores",
          "estadisticas",
          "informes",
          "perfil-financiero"
        ];
    const orderIndex = new Map(sectionsOrder.map((key, index) => [key, index]));
    const sourceSections = isDocumentsPage
      ? data.documentsMenuSections || []
      : isEducationPage
      ? data.educationMenuSections || []
      : data.financeMenuSections || [];
    const filteredSections = isDocumentsPage || isEducationPage ? sourceSections : sourceSections.filter((section) => orderIndex.has(section.key));
    const orderedSections = [...filteredSections].sort((a, b) => {
      const aIndex = orderIndex.has(a.key) ? orderIndex.get(a.key) : Number.MAX_SAFE_INTEGER;
      const bIndex = orderIndex.has(b.key) ? orderIndex.get(b.key) : Number.MAX_SAFE_INTEGER;
      return aIndex - bIndex;
    });
    const sections = [{ key: "favoritos", label: "Favoritos", tools: [] }, ...orderedSections];
    const sectionLabelByKey = new Map(orderedSections.map((section) => [section.key, section.label]));
    if (!sections.length) {
      mount.innerHTML = "";
      return;
    }

    function getExpandedGroups(sectionKey) {
      if (!expandedGroupsBySection.has(sectionKey)) {
        expandedGroupsBySection.set(sectionKey, new Set());
      }
      return expandedGroupsBySection.get(sectionKey);
    }

    function renderToolRow(sectionKey, groupLabel, toolName, showSavedMarker) {
      const favorites = loadFinanceFavorites();
      const favorite = isFavoriteTool(favorites, sectionKey, groupLabel, toolName);
      const href = groupLabel
        ? withPrefix(`finance/panel/index.html?section=${encodeURIComponent(sectionKey)}&group=${encodeURIComponent(groupLabel)}&tool=${encodeURIComponent(toolName)}`)
        : withPrefix(`finance/panel/index.html?section=${encodeURIComponent(sectionKey)}&tool=${encodeURIComponent(toolName)}`);
      const marker = showSavedMarker
        ? '<span class="finance-saved-fav-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span>'
        : "";

      return `
        <div class="finance-tool-row">
          <a class="finance-tool-link" draggable="true" data-tool-section="${escapeHtml(sectionKey)}" data-tool-group="${escapeHtml(groupLabel || "")}" data-tool-name="${escapeHtml(toolName)}" href="${href}">${marker}${escapeHtml(toolName)}</a>
          <button class="finance-fav-toggle ${favorite ? "is-favorite" : ""}" type="button" data-favorite-toggle="${favorite ? "1" : "0"}" data-favorite-section="${escapeHtml(sectionKey)}" data-favorite-group="${escapeHtml(groupLabel || "")}" data-favorite-tool="${escapeHtml(toolName)}" aria-label="${favorite ? "Quitar de favoritos" : "Agregar a favoritos"}" title="${favorite ? "Quitar de favoritos" : "Agregar a favoritos"}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="${favorite ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </button>
        </div>
      `;
    }

    function renderSectionTools(section) {
      if (!section || !Array.isArray(section.tools)) return "";

      if (section.key === "favoritos") {
        const favorites = loadFinanceFavorites();
        if (!favorites.length) {
          return '<li><p class="finance-tools-empty">Aun no hay favoritos.</p></li>';
        }

        const grouped = new Map();
        favorites.forEach((item) => {
          const sectionKey = item.sectionKey;
          const groupName = sectionLabelByKey.get(sectionKey) || sectionKey;
          if (!grouped.has(groupName)) grouped.set(groupName, []);
          grouped.get(groupName).push(item);
        });

        let html = "";
        grouped.forEach((entries, groupName) => {
          html += `<li><p class="finance-tools-label">${escapeHtml(groupName)}</p></li>`;
          entries.forEach((entry) => {
            html += `<li>${renderToolRow(entry.sectionKey, entry.groupLabel || "", entry.toolName, true)}</li>`;
          });
        });
        return html;
      }

      const expandedGroups = getExpandedGroups(section.key);
      return section.tools
        .map((entry, entryIndex) => {
          if (typeof entry === "string") {
            return `<li>${renderToolRow(section.key, "", entry, false)}</li>`;
          }

          if (entry && Array.isArray(entry.items)) {
            const groupKey = `${section.key}::${entryIndex}`;
            const isExpanded = expandedGroups.has(groupKey);
            const items = entry.items
              .map((tool) => {
                return `<li>${renderToolRow(section.key, entry.label || "Grupo", tool, false)}</li>`;
              })
              .join("");

            return `
              <li class="finance-tool-group ${isExpanded ? "expanded" : ""}">
                <button class="finance-tools-label finance-tools-toggle" type="button" data-finance-group-key="${escapeHtml(groupKey)}" data-finance-group-section="${escapeHtml(section.key)}" aria-expanded="${isExpanded ? "true" : "false"}">
                  <span class="finance-group-label">${escapeHtml(entry.label || "Grupo")}</span>
                  <span class="finance-group-caret" aria-hidden="true">&gt;</span>
                </button>
                <ul class="finance-tools-group-list">${items}</ul>
              </li>
            `;
          }

          return "";
        })
        .join("");
    }

    function paint(sectionKey) {
      const previousSectionsNav = mount.querySelector(".finance-sections-nav");
      const previousScrollTop = previousSectionsNav ? previousSectionsNav.scrollTop : 0;
      const activeSection = sections.find((section) => section.key === sectionKey) || null;
      const savedFavoritesCount = loadFinanceFavorites().length;
      const primaryLinks = sections
        .map((section) => {
          const active = activeSection && section.key === activeSection.key ? "active" : "";
          const icon = section.key === "favoritos" ? getFavoritesSectionIcon(savedFavoritesCount > 0) : getSectionIcon(section.key);
          return `<li>
            <button class="finance-section-link ${active}" type="button" data-finance-section-key="${section.key}" data-section-label="${escapeHtml(section.label)}" aria-label="${escapeHtml(section.label)}">
              <span class="finance-section-icon">${icon}</span>
            </button>
          </li>`;
        })
        .join("");

      const shouldHideEmptyFavoritesPanel = activeSection && activeSection.key === "favoritos" && savedFavoritesCount === 0;
      const secondaryPanel = activeSection && !shouldHideEmptyFavoritesPanel
        ? `
        <aside class="finance-tools-nav" aria-label="Herramientas de la sección">
          <p class="finance-tools-nav-title">${escapeHtml(activeSection.label)}</p>
          <ul class="finance-tools-list">
            ${renderSectionTools(activeSection)}
          </ul>
        </aside>
      `
        : "";

      if (activeSection && !shouldHideEmptyFavoritesPanel) {
        body.classList.add("has-finance-secondary");
      } else {
        body.classList.remove("has-finance-secondary");
      }

      mount.innerHTML = `
        <aside class="finance-sections-nav" aria-label="Secciones de ${isDocumentsPage ? "documentos" : isEducationPage ? "educacion" : "finanzas"}">
          <ul class="finance-sections-list">${primaryLinks}</ul>
        </aside>
        ${secondaryPanel}
      `;

      const nextSectionsNav = mount.querySelector(".finance-sections-nav");
      if (nextSectionsNav) {
        nextSectionsNav.scrollTop = previousScrollTop;
      }

      mount.querySelectorAll("[data-finance-section-key]").forEach((button) => {
        button.addEventListener("click", () => {
          const nextKey = button.getAttribute("data-finance-section-key") || "";
          paint(activeSection && activeSection.key === nextKey ? "" : nextKey);
        });

        button.addEventListener("mouseenter", () => {
          let tip = document.getElementById("finance-nav-tooltip");
          if (!tip) {
            tip = document.createElement("span");
            tip.id = "finance-nav-tooltip";
            tip.className = "finance-section-tooltip";
            document.body.appendChild(tip);
          }
          const label = button.getAttribute("data-section-label") || "";
          tip.textContent = label;
          const rect = button.getBoundingClientRect();
          tip.style.top = `${rect.top + rect.height / 2 - 14}px`;
          tip.classList.add("visible");
        });

        button.addEventListener("mouseleave", () => {
          const tip = document.getElementById("finance-nav-tooltip");
          if (tip) tip.classList.remove("visible");
        });
      });

      mount.querySelectorAll("[data-finance-group-key]").forEach((button) => {
        button.addEventListener("click", () => {
          if (!activeSection) return;
          const groupKey = button.getAttribute("data-finance-group-key") || "";
          if (!groupKey) return;
          const expandedGroups = getExpandedGroups(activeSection.key);
          const groupItem = button.closest(".finance-tool-group");
          const isExpanded = expandedGroups.has(groupKey);
          const groupList = groupItem ? groupItem.querySelector(".finance-tools-group-list") : null;

          if (isExpanded) {
            expandedGroups.delete(groupKey);
            if (groupList) {
              const currentHeight = groupList.scrollHeight;
              groupList.style.maxHeight = `${currentHeight}px`;
              void groupList.offsetHeight;
            }
            if (groupItem) {
              groupItem.classList.remove("expanded");
            }
            button.setAttribute("aria-expanded", "false");
            if (groupList) {
              groupList.style.maxHeight = "0px";
            }
          } else {
            expandedGroups.add(groupKey);
            if (groupItem) {
              groupItem.classList.add("expanded");
            }
            button.setAttribute("aria-expanded", "true");
            if (groupList) {
              groupList.style.maxHeight = "0px";
              requestAnimationFrame(() => {
                groupList.style.maxHeight = `${groupList.scrollHeight}px`;
              });
            }
          }
        });
      });

      mount.querySelectorAll(".finance-tools-group-list").forEach((groupList) => {
        groupList.addEventListener("transitionend", (event) => {
          if (event.propertyName !== "max-height") return;
          const groupItem = groupList.closest(".finance-tool-group");
          if (groupItem && groupItem.classList.contains("expanded")) {
            groupList.style.maxHeight = "none";
          }
        });
      });

      mount.querySelectorAll("[data-favorite-toggle]").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const section = button.getAttribute("data-favorite-section") || "";
          const group = button.getAttribute("data-favorite-group") || "";
          const tool = button.getAttribute("data-favorite-tool") || "";
          if (!section || !tool) return;
          toggleFavoriteTool(section, group, tool);
          paint(activeSection ? activeSection.key : "");
        });
      });

      if (closeFinanceMenuOnOutsideClick) {
        document.removeEventListener("click", closeFinanceMenuOnOutsideClick);
      }

      closeFinanceMenuOnOutsideClick = (event) => {
        if (!body.classList.contains("has-finance-secondary")) return;
        const target = event.target;
        if (!(target instanceof Element)) return;
        if (target.closest(".finance-tools-nav")) return;
        if (target.closest("[data-finance-section-key]")) return;
        paint("");
      };

      document.addEventListener("click", closeFinanceMenuOnOutsideClick);
    }

    const initialSection = isFinanceToolPage && hasSelectedTool ? "" : params.get("section") || "";
    paint(initialSection);
  }

  function cardTemplate(tool) {
    if (!tool) return "";
    const href = tool.href ? withPrefix(tool.href) : "#";
    return `
      <article class="card reveal" data-tag="${escapeHtml((tool.tag || "").toLowerCase())} ${escapeHtml((tool.name || "").toLowerCase())}">
        <h3>${escapeHtml(tool.name)}</h3>
        <p class="card-copy">${escapeHtml(tool.description || "Módulo en construcción dentro del ecosistema Zyvola.")}</p>
        <div class="card-meta">
          <span class="badge">${escapeHtml(tool.tag || "Módulo")}</span>
          <span class="badge">${escapeHtml(tool.state || "Activo")}</span>
        </div>
        <a class="card-link" href="${href}">Ver módulo</a>
      </article>
    `;
  }

  function quickLinkTemplate(item, index) {
    return `<a class="pill" href="${withPrefix(item.href)}"><span>${escapeHtml(navLabel(item))}</span><span>${String(index + 1).padStart(2, "0")}</span></a>`;
  }

  function renderHomeQuickLinks() {
    const target = document.getElementById("home-quick-links");
    if (!target) return;
    const navItems = (data.nav || []).filter((item) => item.key !== "home");
    target.innerHTML = navItems.map(quickLinkTemplate).join("");
  }

  function renderHomeSearch() {
    const form = document.getElementById("global-search-form");
    const input = document.getElementById("global-search");
    const results = document.getElementById("global-results");
    if (!form || !input || !results) return;

    form.setAttribute("aria-label", getI18nValue("home.search.aria", form.getAttribute("aria-label") || "Buscador global"));
    input.setAttribute("placeholder", getI18nValue("home.search.placeholder", input.getAttribute("placeholder") || "Buscar"));
    input.setAttribute("aria-label", getI18nValue("home.search.ariaInput", input.getAttribute("aria-label") || "Búsqueda"));
    var submitBtn = form.querySelector("button[type=\"submit\"]");
    if (submitBtn) {
      submitBtn.textContent = getI18nValue("home.search.button", submitBtn.textContent || "Explorar Hub");
    }

    if (form.dataset.searchBound === "1") return;
    form.dataset.searchBound = "1";

    function buildSearchIndex() {
      return [
        ...(data.nav || [])
          .filter((item) => item.key !== "home")
          .map((item) => ({ title: navLabel(item), text: navLabel(item), href: item.href, type: getI18nValue("search.category", "Categoría") })),
        ...(data.tools || []).map((tool) => ({
          title: tool.name,
          text: `${tool.name} ${tool.tag} ${tool.description}`,
          href: tool.href,
          type: getI18nValue("search.tool", "Herramienta")
        }))
      ];
    }

    function paint(matches) {
      if (!matches.length) {
        results.innerHTML = "";
        results.classList.remove("open");
        return;
      }

      results.innerHTML = matches
        .map(
          (item) =>
            `<a class="search-result-item" href="${withPrefix(item.href)}"><span>${escapeHtml(item.title)}</span><span class="search-type">${escapeHtml(item.type)}</span></a>`
        )
        .join("");
      results.classList.add("open");
    }

    input.addEventListener("input", () => {
      const query = input.value.trim().toLowerCase();
      if (!query) return paint([]);
      const index = buildSearchIndex();
      const matches = index.filter((entry) => entry.text.toLowerCase().includes(query)).slice(0, 6);
      paint(matches);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const first = results.querySelector("a");
      if (first) window.location.href = first.getAttribute("href") || "#";
    });

    document.addEventListener("click", (event) => {
      if (!form.contains(event.target)) {
        results.classList.remove("open");
      }
    });
  }

  function renderCategoryGrid() {
    if (!categoryKey) return;
    const category = data.categories[categoryKey];
    if (!category) return;

    const heroKicker = document.getElementById("category-kicker");
    const heroTitle = document.getElementById("category-title");
    const heroDescription = document.getElementById("category-description");
    const quickLinks = document.getElementById("category-quick-links");

    if (heroKicker) heroKicker.textContent = `Categoría / ${category.label}`;
    if (heroTitle) heroTitle.textContent = category.title;
    if (heroDescription) heroDescription.textContent = category.description;

    if (quickLinks) {
      quickLinks.innerHTML = (category.subpages || [])
        .map((sub, index) => `<a class="pill" href="${withPrefix(`${category.key}/${sub.href}`)}"><span>${escapeHtml(sub.title)}</span><span>${String(index + 1).padStart(2, "0")}</span></a>`)
        .join("");
      if (!quickLinks.innerHTML) {
        quickLinks.innerHTML = `<a class="pill" href="${withPrefix("connect/index.html")}"><span>Escalar ecosistema</span><span>01</span></a>`;
      }
    }

    const target = document.getElementById("category-grid");
    if (!target) return;

    const tools = (category.tools || []).map(getToolByRef).filter(Boolean);
    target.innerHTML = tools.map(cardTemplate).join("");

    const subcategoryGrid = document.getElementById("subcategory-grid");
    if (subcategoryGrid) {
      subcategoryGrid.innerHTML = (category.subpages || [])
        .map(
          (sub) => `
            <article class="card reveal compact-card">
              <h3>${escapeHtml(sub.title)}</h3>
              <p class="card-copy">${escapeHtml(sub.note || "Subpágina modular")}</p>
              <a class="card-link" href="${withPrefix(`${category.key}/${sub.href}`)}">Abrir subpágina</a>
            </article>
          `
        )
        .join("");
    }

    const ctaTitle = document.getElementById("category-cta-title");
    const ctaCopy = document.getElementById("category-cta-copy");
    const ctaLink = document.getElementById("category-cta-link");
    if (ctaTitle && category.cta) ctaTitle.textContent = category.cta.title;
    if (ctaCopy && category.cta) ctaCopy.textContent = category.cta.copy;
    if (ctaLink && category.cta) {
      ctaLink.href = withPrefix(category.cta.href);
      ctaLink.textContent = category.cta.label;
    }

    const input = document.getElementById("category-search");
    const select = document.getElementById("category-filter");

    if (select) {
      const tags = [...new Set(tools.map((tool) => (tool.tag || "").toLowerCase()).filter(Boolean))];
      const currentOptions = [...select.querySelectorAll("option")].map((option) => option.value.toLowerCase());
      if (currentOptions.length <= 1) {
        select.innerHTML = `<option value="all">Todos</option>${tags
          .map((tag) => `<option value="${escapeHtml(tag)}">${escapeHtml(tag.charAt(0).toUpperCase() + tag.slice(1))}</option>`)
          .join("")}`;
      }
    }

    const applyFilters = () => {
      const query = (input ? input.value : "").trim().toLowerCase();
      const byTag = (select ? select.value : "all").toLowerCase();
      const cards = target.querySelectorAll(".card");

      cards.forEach((card) => {
        const pool = card.dataset.tag || "";
        const matchText = !query || pool.includes(query);
        const matchTag = byTag === "all" || pool.includes(byTag);
        card.style.display = matchText && matchTag ? "grid" : "none";
      });
    };

    if (input) input.addEventListener("input", applyFilters);
    if (select) select.addEventListener("change", applyFilters);
  }

  function renderHighlights() {
    const blocks = [
      { id: "most-used-grid", values: data.highlights.mostUsed },
      { id: "new-grid", values: data.highlights.new },
      { id: "recommended-grid", values: data.highlights.recommended }
    ];

    blocks.forEach((block) => {
      const target = document.getElementById(block.id);
      if (!target) return;
      const tools = (block.values || []).map(getToolByRef).filter(Boolean);
      target.innerHTML = tools.map(cardTemplate).join("");
    });
  }

  function renderHomeValueProof() {
    const txEl = document.getElementById("proof-transactions");
    const netEl = document.getElementById("proof-net");
    const docsEl = document.getElementById("proof-docs");
    const dbEl = document.getElementById("proof-dashboards");
    if (!txEl && !netEl && !docsEl && !dbEl) return;

    function safeParse(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return parsed == null ? fallback : parsed;
      } catch (_e) {
        return fallback;
      }
    }

    function euros(value) {
      return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0
      }).format(Number(value) || 0);
    }

    function monthKey(date) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }

    const financeState = safeParse("zyvola-finance-runtime-v1", {});
    const tx = Array.isArray(financeState.transactions) ? financeState.transactions : [];
    const docs = safeParse("zy_docs", []);
    const dashboards = safeParse("zyv_dashboards", []);

    const currentMonth = monthKey(new Date());
    const monthTx = tx.filter((item) => {
      const date = item && item.date ? String(item.date) : "";
      return date.slice(0, 7) === currentMonth;
    });
    const net = monthTx.reduce((acc, item) => acc + (Number(item && item.amount) || 0), 0);

    if (txEl) {
      txEl.textContent = `${tx.length} movimiento${tx.length === 1 ? "" : "s"}`;
    }
    if (netEl) {
      netEl.textContent = `Flujo neto mensual: ${euros(net)}`;
    }
    if (docsEl) {
      const count = Array.isArray(docs) ? docs.length : 0;
      docsEl.textContent = `${count} documento${count === 1 ? "" : "s"}`;
    }
    if (dbEl) {
      const projects = safeParse("zyv_projects", []);
      const count = Array.isArray(projects) ? projects.length : 0;
      dbEl.textContent = `${count} proyecto${count === 1 ? "" : "s"}`;
    }
  }

  function renderToolPage() {
    const toolId = body.dataset.tool;
    if (!toolId) return;
    const tool = getToolByRef(toolId);
    if (!tool) return;

    const category = data.categories[tool.category];
    const title = document.getElementById("tool-title");
    const description = document.getElementById("tool-description");
    const tags = document.getElementById("tool-tags");
    const previewTitle = document.getElementById("tool-preview-title");
    const previewBody = document.getElementById("tool-preview-body");
    const openLink = document.getElementById("tool-open-link");
    const breadcrumbCategory = document.getElementById("tool-breadcrumb-category");
    const breadcrumbTool = document.getElementById("tool-breadcrumb-name");
    const kicker = document.getElementById("tool-kicker");

    if (title) title.textContent = tool.name;
    if (description) description.textContent = tool.description;
    if (previewTitle) previewTitle.textContent = tool.previewTitle || "Vista previa";
    if (previewBody) previewBody.textContent = tool.previewBody || "Módulo en preparación.";
    if (openLink) {
      openLink.href = withPrefix(tool.href || "index.html");
      openLink.textContent = tool.demoLabel || "Abrir herramienta";
    }
    if (breadcrumbCategory && category) {
      breadcrumbCategory.textContent = category.label;
      breadcrumbCategory.href = withPrefix(`${category.key}/index.html`);
    }
    if (breadcrumbTool) breadcrumbTool.textContent = tool.name;
    if (kicker) kicker.textContent = `${category ? category.label : "Módulo"} / Herramienta`;

    if (tags) {
      tags.innerHTML = `
        <span class="badge">${escapeHtml(tool.tag)}</span>
        <span class="badge">${escapeHtml(tool.state)}</span>
        <span class="badge">${escapeHtml(category ? category.label : "Zyvola")}</span>
      `;
    }

    document.title = `${tool.name} | Zyvola`;
  }

  function observeReveal() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 }
    );

    document.querySelectorAll(".reveal").forEach((node) => observer.observe(node));
  }

  function applyPremiumMotion() {
    const cards = document.querySelectorAll(".card");
    cards.forEach((card, index) => {
      card.style.transitionDelay = `${Math.min(index * 35, 140)}ms`;
    });
  }

  function applySeoEnhancements() {
    const existing = document.querySelector('meta[name="theme-color"]');
    if (!existing) {
      const meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.content = "#000000";
      document.head.appendChild(meta);
    }
  }

  function removeKickerLabels() {
    document.querySelectorAll(".kicker").forEach((node) => node.remove());
  }

  setLanguage(currentLang);
  renderHeader();
  renderFinanceToolsMenu();
  renderFooter();
  renderHomeQuickLinks();
  renderHomeSearch();
  renderCategoryGrid();
  renderHighlights();
  renderHomeValueProof();
  renderToolPage();
  removeKickerLabels();
  translateStaticPageContent();
  observeReveal();
  applyPremiumMotion();
  applySeoEnhancements();
})();
