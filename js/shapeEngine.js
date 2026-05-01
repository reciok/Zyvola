(function () {
  var SHAPES = {
    FormaGrandeHorizontal: { w: null, h: 260 },
    FormaCuadrada: { w: 300, h: 300 },
    FormaVertical: { w: 260, h: 420 },
    FormaMini: { w: 220, h: 140 },
    FormaHero: { w: null, h: 380 }
  };

  function getSelectedCard() {
    var layout = window.ZyvolaLayoutEngine;
    if (!layout || typeof layout.getSelectedCardId !== "function") return null;
    var id = layout.getSelectedCardId();
    if (!id) return null;
    return document.querySelector('.pc-block[data-block-id="' + id + '"]');
  }

  function getSlotByCard(card) {
    var layout = window.ZyvolaLayoutEngine;
    if (!layout || !card) return null;
    var idx = parseInt(card.dataset.slotIndex || "-1", 10);
    var slots = layout.getActiveTemplateSlots();
    return slots[idx] || null;
  }

  function applyShape(shapeName) {
    var shape = SHAPES[shapeName];
    if (!shape) return;

    var layout = window.ZyvolaLayoutEngine;
    var card = getSelectedCard();
    if (!layout || !card) return;

    var slot = getSlotByCard(card);
    if (!slot) return;

    var targetW = shape.w == null ? slot.width : shape.w;
    var targetH = shape.h;

    card.dataset.shapeW = String(targetW);
    card.dataset.shapeH = String(targetH);

    layout.centerCardInSlot(card, slot);
    layout.syncDomToProject();
    layout.autoRestructure();
  }

  window.ZyvolaShapeEngine = {
    shapes: SHAPES,
    applyShape: applyShape
  };
})();
