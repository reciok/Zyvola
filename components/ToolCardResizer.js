/* ============================================================
 * Zyvola · ToolCardResizer.js
 * Maneja el redimensionado de tarjetas mediante un handle
 * en la esquina inferior-derecha y traduce el delta a tamaños
 * canónicos S/M/L/XL del sistema de plantillas.
 * ============================================================ */
(function () {
  "use strict";

  var T = window.ZyvolaPanelTemplates;
  if (!T) return;

  function classifySize(cellW, cellH) {
    // Buscar el tamaño canónico más cercano por área y proporción
    var candidates = [
      { name: "S",  w: 1, h: 1 },
      { name: "M",  w: 2, h: 1 },
      { name: "L",  w: 2, h: 2 },
      { name: "XL", w: 4, h: 2 }
    ];
    var best = candidates[1], bestScore = Infinity;
    candidates.forEach(function (c) {
      var dw = c.w - cellW;
      var dh = c.h - cellH;
      var score = dw * dw + dh * dh;
      if (score < bestScore) { bestScore = score; best = c; }
    });
    return best.name;
  }

  function attach(card, grid, opts) {
    opts = opts || {};
    var handle = card.el.querySelector('[data-zv-resize-handle="1"]');
    if (!handle) return;

    var dragging = null;

    handle.addEventListener("mousedown", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      var rect = card.el.getBoundingClientRect();
      dragging = {
        startX: ev.clientX,
        startY: ev.clientY,
        startW: rect.width,
        startH: rect.height
      };
      card.el.classList.add("is-resizing");
    });

    window.addEventListener("mousemove", function (ev) {
      if (!dragging) return;
      var dw = ev.clientX - dragging.startX;
      var dh = ev.clientY - dragging.startY;
      var nw = Math.max(160, dragging.startW + dw);
      var nh = Math.max(140, dragging.startH + dh);
      card.el.style.width  = nw + "px";
      card.el.style.height = nh + "px";
    });

    window.addEventListener("mouseup", function () {
      if (!dragging) return;
      var rect = card.el.getBoundingClientRect();
      var c = grid.cellSize();
      // Calcular celdas equivalentes a partir del tamaño actual
      var cellW = Math.max(1, Math.round((rect.width  + c.gutter) / (c.w + c.gutter)));
      var cellH = Math.max(1, Math.round((rect.height + c.gutter) / (c.h + c.gutter)));
      var newSize = classifySize(cellW, cellH);
      card.el.classList.remove("is-resizing");
      dragging = null;
      card.setSize(newSize);
      if (typeof opts.onResize === "function") opts.onResize(card, newSize);
    });
  }

  window.ZyvolaToolCardResizer = { attach: attach, classifySize: classifySize };
})();
