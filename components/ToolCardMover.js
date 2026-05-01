/* ============================================================
 * Zyvola · ToolCardMover.js
 * Drag & drop profesional con snapping a slots de la plantilla
 * activa. Muestra slots vacíos al arrastrar y guías visuales
 * (centro / bordes) tipo Figma / macOS.
 * ============================================================ */
(function () {
  "use strict";

  var T = window.ZyvolaPanelTemplates;
  if (!T) return;

  function attach(card, ctx) {
    /*
     * ctx provides:
     *   grid        : ZyvolaPanelGrid instance
     *   engine      : ZyvolaPanelTemplateEngine instance
     *   onDrop      : function(card, slotIndex)
     *   getSlots    : function() -> [{x,y,w,h,size}]
     *   getOccupied : function() -> Set<number>  // slot indices ya ocupados
     */
    var handle = card.el.querySelector('[data-zv-drag-handle="1"]');
    if (!handle) return;

    var dragging = null;

    handle.addEventListener("mousedown", function (ev) {
      // No iniciar arrastre si el click es sobre un control interactivo
      if (ev.target.closest("select, input, button, [contenteditable='true']")) return;
      ev.preventDefault();

      var sheetRect = ctx.grid.getSheet().getBoundingClientRect();
      var cardRect  = card.el.getBoundingClientRect();
      dragging = {
        offsetX: ev.clientX - cardRect.left,
        offsetY: ev.clientY - cardRect.top,
        sheetRect: sheetRect,
        startLeft: parseFloat(card.el.style.left || "0") || 0,
        startTop:  parseFloat(card.el.style.top  || "0") || 0,
        hitSlot: -1
      };
      card.el.classList.add("is-dragging");

      var slots = ctx.getSlots();
      var occupied = ctx.getOccupied();
      ctx.grid.renderSlots(slots.map(function (s, i) {
        return Object.assign({}, s, { occupied: occupied.has(i) });
      }), { show: true });
    });

    window.addEventListener("mousemove", function (ev) {
      if (!dragging) return;
      var sheetRect = dragging.sheetRect;
      var x = ev.clientX - sheetRect.left - dragging.offsetX;
      var y = ev.clientY - sheetRect.top  - dragging.offsetY;
      card.el.style.left = Math.round(x) + "px";
      card.el.style.top  = Math.round(y) + "px";

      // Centro de la tarjeta para nearest-slot
      var cardCx = ev.clientX - dragging.offsetX + (card.el.offsetWidth  / 2);
      var cardCy = ev.clientY - dragging.offsetY + (card.el.offsetHeight / 2);
      var cell = ctx.grid.pointToCell(cardCx, cardCy);
      var nearest = ctx.engine.nearestSlot(cell);
      dragging.hitSlot = nearest;

      var slots = ctx.getSlots();
      var occupied = ctx.getOccupied();
      ctx.grid.renderSlots(slots.map(function (s, i) {
        return Object.assign({}, s, { occupied: occupied.has(i) });
      }), { show: true, highlightIndex: nearest });

      // Guías sutiles: línea vertical al centro del slot objetivo
      if (slots[nearest]) {
        var px = ctx.grid.cellsToPx(slots[nearest]);
        ctx.grid.showGuides([
          { orientation: "v", pos: px.x + px.w / 2 },
          { orientation: "h", pos: px.y + px.h / 2 }
        ]);
      } else {
        ctx.grid.clearGuides();
      }
    });

    window.addEventListener("mouseup", function () {
      if (!dragging) return;
      var hit = dragging.hitSlot;
      card.el.classList.remove("is-dragging");
      ctx.grid.clearGuides();
      dragging = null;

      if (hit < 0) {
        // Sin slot válido → notificar drop fuera para que el workspace re-snap
        if (typeof ctx.onDrop === "function") ctx.onDrop(card, -1);
        return;
      }
      if (typeof ctx.onDrop === "function") ctx.onDrop(card, hit);
    });
  }

  window.ZyvolaToolCardMover = { attach: attach };
})();
