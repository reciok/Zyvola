/* ============================================================
 * Zyvola · panelTemplates.js
 * Plantillas inteligentes de panel basadas en grid de celdas.
 *
 * Sistema de coordenadas:
 *   - El folio es un grid de COLS columnas x N filas (alto dinámico).
 *   - Cada slot se define como { x, y, w, h, size } en celdas.
 *   - Tamaños canónicos:
 *        S  = 1x1   (mini)
 *        M  = 2x1   (wide)
 *        L  = 2x2   (square)
 *        XL = 4x2   (hero)
 *
 * Cada plantilla tiene reglas de alineación (alignment) que el
 * Template Engine usa al recolocar tarjetas.
 * ============================================================ */
(function () {
  "use strict";

  var SIZES = {
    S:  { w: 1, h: 1, label: "S"  },
    M:  { w: 2, h: 1, label: "M"  },
    L:  { w: 2, h: 2, label: "L"  },
    XL: { w: 4, h: 2, label: "XL" }
  };

  var GRID = {
    COLS: 4,                 // columnas del folio
    SHEET_WIDTH: 980,        // ancho fijo tipo A4 portrait útil
    GUTTER: 16,              // separación entre slots (px)
    CELL_HEIGHT: 200,        // altura base de una celda (px)
    PADDING: 28              // padding interno del folio (px)
  };

  /** Alignments / reglas de armonía visual. */
  var ALIGN = {
    TOP_HERO:    "top-hero",     // bloque grande arriba, secundarios debajo
    BALANCED:    "balanced",     // simetría 2x2 / 3x1
    SIDEBAR:     "sidebar",      // columna principal + lateral
    STACK:       "stack",        // todo apilado en columna
    DENSE:       "dense"         // empaquetado denso S/M
  };

  /** Catálogo base de plantillas predefinidas. */
  var TEMPLATES = [
    {
      id: "focus",
      name: "Foco",
      alignment: ALIGN.TOP_HERO,
      slots: [
        { x: 0, y: 0, w: 4, h: 2, size: "XL" },
        { x: 0, y: 2, w: 2, h: 1, size: "M"  },
        { x: 2, y: 2, w: 2, h: 1, size: "M"  }
      ]
    },
    {
      id: "grid-2x2",
      name: "Cuadrícula 2x2",
      alignment: ALIGN.BALANCED,
      slots: [
        { x: 0, y: 0, w: 2, h: 1, size: "M" },
        { x: 2, y: 0, w: 2, h: 1, size: "M" },
        { x: 0, y: 1, w: 2, h: 1, size: "M" },
        { x: 2, y: 1, w: 2, h: 1, size: "M" }
      ]
    },
    {
      id: "sidebar",
      name: "Lateral",
      alignment: ALIGN.SIDEBAR,
      slots: [
        { x: 0, y: 0, w: 2, h: 2, size: "L" },
        { x: 2, y: 0, w: 2, h: 1, size: "M" },
        { x: 2, y: 1, w: 2, h: 1, size: "M" }
      ]
    },
    {
      id: "trio",
      name: "Trío",
      alignment: ALIGN.BALANCED,
      slots: [
        { x: 0, y: 0, w: 4, h: 2, size: "XL" },
        { x: 0, y: 2, w: 2, h: 2, size: "L"  },
        { x: 2, y: 2, w: 2, h: 2, size: "L"  }
      ]
    },
    {
      id: "dense",
      name: "Denso",
      alignment: ALIGN.DENSE,
      slots: [
        { x: 0, y: 0, w: 1, h: 1, size: "S" },
        { x: 1, y: 0, w: 1, h: 1, size: "S" },
        { x: 2, y: 0, w: 2, h: 1, size: "M" },
        { x: 0, y: 1, w: 2, h: 1, size: "M" },
        { x: 2, y: 1, w: 1, h: 1, size: "S" },
        { x: 3, y: 1, w: 1, h: 1, size: "S" }
      ]
    },
    {
      id: "stack",
      name: "Pila",
      alignment: ALIGN.STACK,
      slots: [
        { x: 0, y: 0, w: 4, h: 1, size: "M" },
        { x: 0, y: 1, w: 4, h: 1, size: "M" },
        { x: 0, y: 2, w: 4, h: 1, size: "M" }
      ]
    }
  ];

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function listTemplates() { return clone(TEMPLATES); }

  function getTemplate(id) {
    var t = TEMPLATES.find(function (x) { return x.id === id; });
    return t ? clone(t) : clone(TEMPLATES[0]);
  }

  function sizeOf(name) { return SIZES[name] ? clone(SIZES[name]) : clone(SIZES.M); }

  function listSizes() { return Object.keys(SIZES); }

  /** Devuelve la "huella" mínima en celdas (cols, rows) de una plantilla. */
  function templateBounds(tpl) {
    var maxX = 0, maxY = 0;
    (tpl.slots || []).forEach(function (s) {
      if (s.x + s.w > maxX) maxX = s.x + s.w;
      if (s.y + s.h > maxY) maxY = s.y + s.h;
    });
    return { cols: maxX, rows: maxY };
  }

  window.ZyvolaPanelTemplates = {
    SIZES: SIZES,
    GRID: GRID,
    ALIGN: ALIGN,
    list: listTemplates,
    get: getTemplate,
    sizeOf: sizeOf,
    listSizes: listSizes,
    bounds: templateBounds
  };
})();
