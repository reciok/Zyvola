(function () {
  var dragging = null;

  function hasVisibleTextTarget(target) {
    if (!target) return false;
    if (target.closest("input, textarea, select, button, a, [contenteditable='true'], .pc-btn, .pc-menu, .pc-block-title")) {
      return true;
    }
    var textCarrier = target.closest("p, span, strong, em, small, label, li, h1, h2, h3, h4, h5, h6, td, th");
    return !!textCarrier;
  }

  function init() {
    var sheet = document.getElementById("folio-sheet");
    var layout = window.ZyvolaLayoutEngine;
    if (!sheet || !layout) return;
    if (sheet.dataset.customDragBound === "1") return;
    sheet.dataset.customDragBound = "1";

    sheet.addEventListener("mousedown", function (ev) {
      var card = ev.target.closest(".pc-block");
      if (!card) return;
      if (!layout.isPlacementMode()) return;
      if (hasVisibleTextTarget(ev.target)) return;

      var rect = card.getBoundingClientRect();
      dragging = {
        card: card,
        id: card.getAttribute("data-block-id") || "",
        originLeft: parseFloat(card.style.left || "0") || 0,
        originTop: parseFloat(card.style.top || "0") || 0,
        originW: parseFloat(card.style.width || String(rect.width)) || rect.width,
        originH: parseFloat(card.style.height || String(rect.height)) || rect.height,
        offsetX: ev.clientX - rect.left,
        offsetY: ev.clientY - rect.top,
        hitSlot: -1
      };

      card.classList.add("is-dragging-card");
      layout.renderSlots(true);
      ev.preventDefault();
    });

    window.addEventListener("mousemove", function (ev) {
      if (!dragging) return;
      var sheetRect = sheet.getBoundingClientRect();
      var x = ev.clientX - sheetRect.left - dragging.offsetX;
      var y = ev.clientY - sheetRect.top - dragging.offsetY;

      dragging.card.style.left = Math.round(x) + "px";
      dragging.card.style.top = Math.round(y) + "px";

      var hit = layout.slotIndexAtPoint(ev.clientX, ev.clientY);
      dragging.hitSlot = hit;
      layout.setHighlightedSlot(hit);
    });

    window.addEventListener("mouseup", function () {
      if (!dragging) return;
      var layout = window.ZyvolaLayoutEngine;
      var slots = layout.getActiveTemplateSlots();
      var card = dragging.card;

      if (dragging.hitSlot < 0 || !slots[dragging.hitSlot]) {
        // Revert to origin when dropped outside valid slot.
        card.style.left = Math.round(dragging.originLeft) + "px";
        card.style.top = Math.round(dragging.originTop) + "px";
        card.style.width = Math.round(dragging.originW) + "px";
        card.style.height = Math.round(dragging.originH) + "px";
      } else {
        var targetSlot = slots[dragging.hitSlot];
        var allCards = Array.prototype.slice.call(sheet.querySelectorAll(".pc-block"));
        var occupied = allCards.find(function (c) {
          if (c === card) return false;
          return parseInt(c.dataset.slotIndex || "-1", 10) === dragging.hitSlot;
        });

        layout.centerCardInSlot(card, targetSlot);
        card.dataset.slotIndex = String(dragging.hitSlot);
        card.dataset.slotId = targetSlot.id;

        if (occupied) {
          var occupiedSet = new Set(
            allCards
              .filter(function (c) { return c !== occupied; })
              .map(function (c) { return parseInt(c.dataset.slotIndex || "-1", 10); })
              .filter(function (n) { return n >= 0; })
          );
          var nextFree = layout.nearestFreeSlotIndex(dragging.hitSlot, occupiedSet);
          if (nextFree >= 0 && slots[nextFree]) {
            layout.centerCardInSlot(occupied, slots[nextFree]);
            occupied.dataset.slotIndex = String(nextFree);
            occupied.dataset.slotId = slots[nextFree].id;
          }
        }
      }

      card.classList.remove("is-dragging-card");
      layout.setHighlightedSlot(-1);
      layout.renderSlots(false);
      layout.syncDomToProject();
      dragging = null;
    });
  }

  window.ZyvolaDragDropSystem = {
    init: init
  };
})();
