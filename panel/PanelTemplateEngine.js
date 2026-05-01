/* ============================================================
 * Zyvola · PanelTemplateEngine.js
 * Selecciona, sugiere y recalcula plantillas de panel.
 *  - Asigna tarjetas a slots
 *  - Genera plantillas dinámicas a partir de la geometría real
 *  - Calcula slots vacíos y reorganización armónica
 * ============================================================ */
(function () {
  "use strict";

  var T = window.ZyvolaPanelTemplates;
  if (!T) return;

  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  function PanelTemplateEngine() {
    this.activeId = "grid-2x2";
    this.template = T.get(this.activeId);
  }

  PanelTemplateEngine.prototype.list = function () { return T.list(); };

  PanelTemplateEngine.prototype.getActive = function () { return clone(this.template); };

  PanelTemplateEngine.prototype.setActive = function (id) {
    this.activeId = id;
    this.template = T.get(id);
    return this.getActive();
  };

  /**
   * Sugiere la mejor plantilla del catálogo según la lista de tarjetas
   * (cada una con .size). Heurística: la que minimiza diferencia entre
   * número de slots y número de tarjetas y mejor calza tamaños.
   */
  PanelTemplateEngine.prototype.suggest = function (cards) {
    var n = (cards || []).length;
    var list = T.list();
    var best = list[0];
    var bestScore = -Infinity;

    list.forEach(function (tpl) {
      var slots = tpl.slots;
      var diff = Math.abs(slots.length - n);
      // bonus por coincidencia de tamaños
      var sizesA = slots.map(function (s) { return s.size; }).sort();
      var sizesB = (cards || []).map(function (c) { return c.size || "M"; }).sort();
      var match = 0;
      var i = 0, j = 0;
      while (i < sizesA.length && j < sizesB.length) {
        if (sizesA[i] === sizesB[j]) { match += 1; i += 1; j += 1; }
        else if (sizesA[i] < sizesB[j]) i += 1;
        else j += 1;
      }
      var score = match * 3 - diff * 2;
      if (score > bestScore) { bestScore = score; best = tpl; }
    });
    return clone(best);
  };

  /**
   * Genera una plantilla dinámica empaquetando las tarjetas dadas
   * (por sus tamaños) en el grid de COLS columnas.
   * Devuelve { id, name, alignment, slots[] }.
   */
  PanelTemplateEngine.prototype.recalcFromCards = function (cards) {
    var COLS = T.GRID.COLS;
    var grid = []; // matriz de filas, cada fila es array[COLS] de bools
    var slots = [];

    function ensureRow(r) {
      while (grid.length <= r) {
        grid.push(new Array(COLS).fill(false));
      }
    }
    function fits(x, y, w, h) {
      if (x + w > COLS) return false;
      ensureRow(y + h - 1);
      for (var r = y; r < y + h; r += 1) {
        for (var c = x; c < x + w; c += 1) {
          if (grid[r][c]) return false;
        }
      }
      return true;
    }
    function place(x, y, w, h) {
      for (var r = y; r < y + h; r += 1) {
        for (var c = x; c < x + w; c += 1) grid[r][c] = true;
      }
    }
    function findSpot(w, h) {
      var r = 0;
      while (true) {
        ensureRow(r + h - 1);
        for (var c = 0; c <= COLS - w; c += 1) {
          if (fits(c, r, w, h)) return { x: c, y: r };
        }
        r += 1;
        if (r > 200) return { x: 0, y: r };
      }
    }

    // Ordenar por tamaño (mayores primero) para mejor empaquetado
    var sortedIndices = (cards || []).map(function (c, i) { return i; })
      .sort(function (a, b) {
        var sa = T.sizeOf((cards[a] && cards[a].size) || "M");
        var sb = T.sizeOf((cards[b] && cards[b].size) || "M");
        return (sb.w * sb.h) - (sa.w * sa.h);
      });

    var byOriginal = {};
    sortedIndices.forEach(function (origIdx) {
      var card = cards[origIdx];
      var sz = T.sizeOf((card && card.size) || "M");
      var spot = findSpot(sz.w, sz.h);
      place(spot.x, spot.y, sz.w, sz.h);
      byOriginal[origIdx] = {
        x: spot.x, y: spot.y, w: sz.w, h: sz.h, size: card.size || "M"
      };
    });

    // Reconstruir slots en el orden original de cards
    (cards || []).forEach(function (_card, idx) {
      slots.push(byOriginal[idx]);
    });

    var tpl = {
      id: "dynamic-" + Date.now(),
      name: "Dinámica",
      alignment: T.ALIGN.DENSE,
      slots: slots
    };
    this.template = tpl;
    this.activeId = tpl.id;
    return clone(tpl);
  };

  /**
   * Asigna tarjetas a los slots de la plantilla activa por orden,
   * truncando si hay más tarjetas que slots o devolviendo huecos
   * vacíos si hay menos.
   */
  PanelTemplateEngine.prototype.assignCards = function (cards) {
    var slots = this.template.slots;
    var assignments = [];
    (cards || []).forEach(function (card, i) {
      if (i < slots.length) {
        assignments.push({ card: card, slot: slots[i], slotIndex: i });
      }
    });
    return assignments;
  };

  /** Devuelve los slots no ocupados (índices). */
  PanelTemplateEngine.prototype.getEmptySlotIndices = function (cardCount) {
    var slots = this.template.slots;
    var empty = [];
    for (var i = cardCount; i < slots.length; i += 1) empty.push(i);
    return empty;
  };

  /**
   * Encuentra el slot más cercano (índice) a un punto en celdas.
   * Útil para snap-on-drop.
   */
  PanelTemplateEngine.prototype.nearestSlot = function (cellPoint) {
    var slots = this.template.slots;
    var bestIdx = -1;
    var bestDist = Infinity;
    slots.forEach(function (s, idx) {
      var cx = s.x + s.w / 2;
      var cy = s.y + s.h / 2;
      var dx = cx - cellPoint.x;
      var dy = cy - cellPoint.y;
      var d = dx * dx + dy * dy;
      if (d < bestDist) { bestDist = d; bestIdx = idx; }
    });
    return bestIdx;
  };

  /** Añade un slot extra (fila nueva) si no hay vacíos. */
  PanelTemplateEngine.prototype.expandWithSlot = function (size) {
    size = size || "M";
    var sz = T.sizeOf(size);
    var bounds = T.bounds(this.template);
    // Intentar colocar en el hueco disponible al final de la última fila
    var lastRow = Math.max(0, bounds.rows - 1);
    var rowOccupancy = new Array(T.GRID.COLS).fill(false);
    this.template.slots.forEach(function (s) {
      if (s.y <= lastRow && s.y + s.h - 1 >= lastRow) {
        for (var c = s.x; c < s.x + s.w; c += 1) rowOccupancy[c] = true;
      }
    });
    var freeStart = -1, freeLen = 0, bestStart = -1, bestLen = 0;
    for (var c = 0; c < T.GRID.COLS; c += 1) {
      if (!rowOccupancy[c]) {
        if (freeStart < 0) freeStart = c;
        freeLen += 1;
        if (freeLen > bestLen) { bestLen = freeLen; bestStart = freeStart; }
      } else { freeStart = -1; freeLen = 0; }
    }
    var slot;
    if (bestLen >= sz.w) {
      slot = { x: bestStart, y: lastRow, w: sz.w, h: 1, size: size };
    } else {
      slot = { x: 0, y: bounds.rows, w: Math.min(sz.w, T.GRID.COLS), h: sz.h, size: size };
    }
    this.template.slots.push(slot);
    return slot;
  };

  window.ZyvolaPanelTemplateEngine = PanelTemplateEngine;
})();
