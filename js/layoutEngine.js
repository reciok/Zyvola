(function () {
  var TEMPLATE_KEY = "zyv_layout_template";
  var SELECTED_KEY = "zyv_selected_card";

  var state = {
    isPlacementMode: false,
    activeTemplate: localStorage.getItem(TEMPLATE_KEY) || "PLANTILLA_A",
    selectedCardId: localStorage.getItem(SELECTED_KEY) || "",
    slotsVisible: false,
    dragSlotIndex: -1
  };

  // Global placement state requested by user.
  window.isPlacementMode = state.isPlacementMode;

  function getSheet() {
    return document.getElementById("folio-sheet");
  }

  function getBlocks() {
    var sheet = getSheet();
    if (!sheet) return [];
    return Array.prototype.slice.call(sheet.querySelectorAll(".pc-block"));
  }

  function getProjectBlocks() {
    var pp = window.ZyvolaPanelProject;
    if (!pp || typeof pp.getProjectBlocks !== "function") return [];
    return pp.getProjectBlocks() || [];
  }

  function setProjectBlocks(blocks) {
    var pp = window.ZyvolaPanelProject;
    if (!pp || typeof pp.setProjectBlocks !== "function") return;
    pp.setProjectBlocks(blocks);
  }

  function slotHost(sheet) {
    var host = sheet.querySelector("#folio-slots");
    if (host) return host;
    host = document.createElement("div");
    host.id = "folio-slots";
    host.className = "folio-slots";
    sheet.appendChild(host);
    return host;
  }

  // Fixed-size template JSON definitions.
  var templates = {
    PLANTILLA_A: [
      { id: "A", width: 586, height: 520, position: { row: 1, col: 1 }, order: 1, x: 0, y: 0 },
      { id: "B", width: 390, height: 248, position: { row: 1, col: 2 }, order: 2, x: 610, y: 0 },
      { id: "C", width: 390, height: 248, position: { row: 2, col: 2 }, order: 3, x: 610, y: 272 }
    ],
    PLANTILLA_B: [
      { id: "A", width: 488, height: 220, position: { row: 1, col: 1 }, order: 1, x: 0, y: 0 },
      { id: "B", width: 488, height: 220, position: { row: 1, col: 2 }, order: 2, x: 512, y: 0 },
      { id: "C", width: 1000, height: 320, position: { row: 2, col: 1 }, order: 3, x: 0, y: 252 }
    ],
    PLANTILLA_C: [
      { id: "A", width: 317, height: 300, position: { row: 1, col: 1 }, order: 1, x: 0, y: 0 },
      { id: "B", width: 317, height: 300, position: { row: 1, col: 2 }, order: 2, x: 341, y: 0 },
      { id: "C", width: 318, height: 300, position: { row: 1, col: 3 }, order: 3, x: 682, y: 0 }
    ],
    PLANTILLA_D: [
      { id: "A", width: 1000, height: 300, position: { row: 1, col: 1 }, order: 1, x: 0, y: 0 },
      { id: "B", width: 488, height: 220, position: { row: 2, col: 1 }, order: 2, x: 0, y: 332 },
      { id: "C", width: 488, height: 220, position: { row: 2, col: 2 }, order: 3, x: 512, y: 332 }
    ]
  };

  function getActiveTemplateSlots() {
    return templates[state.activeTemplate] || templates.PLANTILLA_A;
  }

  function renderSlots(show) {
    var sheet = getSheet();
    if (!sheet) return;
    var host = slotHost(sheet);
    host.innerHTML = "";
    state.slotsVisible = !!show;
    host.style.display = show ? "block" : "none";
    if (!show) return;

    getActiveTemplateSlots().forEach(function (slot) {
      var el = document.createElement("div");
      el.className = "folio-slot-fixed";
      el.setAttribute("data-slot-id", slot.id);
      el.style.left = slot.x + "px";
      el.style.top = slot.y + "px";
      el.style.width = slot.width + "px";
      el.style.height = slot.height + "px";
      host.appendChild(el);
    });
  }

  function setHighlightedSlot(index) {
    state.dragSlotIndex = index;
    var sheet = getSheet();
    if (!sheet) return;
    var host = slotHost(sheet);
    var nodes = host.querySelectorAll(".folio-slot-fixed");
    nodes.forEach(function (n, idx) {
      if (idx === index) n.classList.add("is-active");
      else n.classList.remove("is-active");
    });
  }

  function centerCardInSlot(block, slot) {
    var w = parseFloat(block.dataset.shapeW || String(slot.width));
    var h = parseFloat(block.dataset.shapeH || String(slot.height));
    var x = slot.x + (slot.width - w) / 2;
    var y = slot.y + (slot.height - h) / 2;

    block.style.width = Math.round(w) + "px";
    block.style.height = Math.round(h) + "px";
    block.style.left = Math.round(x) + "px";
    block.style.top = Math.round(y) + "px";
  }

  function applyTemplate(templateId) {
    state.activeTemplate = templates[templateId] ? templateId : "PLANTILLA_A";
    localStorage.setItem(TEMPLATE_KEY, state.activeTemplate);
    var slots = getActiveTemplateSlots();
    var blocks = getBlocks();

    blocks.forEach(function (block, idx) {
      var slot = slots[idx % slots.length];
      centerCardInSlot(block, slot);
      block.dataset.slotId = slot.id;
      block.dataset.slotIndex = String(idx % slots.length);
    });

    syncDomToProject();
  }

  function selectCard(cardId) {
    state.selectedCardId = cardId || "";
    localStorage.setItem(SELECTED_KEY, state.selectedCardId);
    getBlocks().forEach(function (block) {
      var active = block.getAttribute("data-block-id") === state.selectedCardId;
      block.classList.toggle("is-selected-card", active);
    });
  }

  function bindSelection() {
    var sheet = getSheet();
    if (!sheet) return;
    if (sheet.dataset.selectionBound === "1") return;
    sheet.dataset.selectionBound = "1";

    sheet.addEventListener("click", function (ev) {
      var card = ev.target.closest(".pc-block");
      if (!card) return;
      selectCard(card.getAttribute("data-block-id") || "");
    });
  }

  function slotIndexAtPoint(clientX, clientY) {
    var slots = getActiveTemplateSlots();
    var sheet = getSheet();
    if (!sheet) return -1;
    var rect = sheet.getBoundingClientRect();
    var x = clientX - rect.left;
    var y = clientY - rect.top;

    for (var i = 0; i < slots.length; i += 1) {
      var s = slots[i];
      if (x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height) {
        return i;
      }
    }
    return -1;
  }

  function nearestFreeSlotIndex(startIndex, occupied) {
    var slots = getActiveTemplateSlots();
    for (var step = 1; step <= slots.length; step += 1) {
      var idx = (startIndex + step) % slots.length;
      if (!occupied.has(idx)) return idx;
    }
    return -1;
  }

  function syncDomToProject() {
    var current = getProjectBlocks();
    if (!current.length) return;

    var byId = {};
    getBlocks().forEach(function (el) {
      byId[el.getAttribute("data-block-id")] = el;
    });

    var next = current.map(function (b) {
      var el = byId[b.id];
      if (!el) return b;
      return Object.assign({}, b, {
        x: parseFloat(el.style.left || "0") || 0,
        y: parseFloat(el.style.top || "0") || 0,
        w: parseFloat(el.style.width || "0") || b.w,
        h: parseFloat(el.style.height || "0") || b.h
      });
    });

    setProjectBlocks(next);
  }

  function autoRestructure() {
    var slots = getActiveTemplateSlots();
    var blocks = getBlocks();

    blocks.sort(function (a, b) {
      var ay = parseFloat(a.style.top || "0");
      var by = parseFloat(b.style.top || "0");
      if (ay !== by) return ay - by;
      return (parseFloat(a.style.left || "0") - parseFloat(b.style.left || "0"));
    });

    blocks.forEach(function (block, idx) {
      var slot = slots[idx % slots.length];
      centerCardInSlot(block, slot);
      block.dataset.slotId = slot.id;
      block.dataset.slotIndex = String(idx % slots.length);
    });

    syncDomToProject();
  }

  function setPlacementMode(active) {
    state.isPlacementMode = !!active;
    window.isPlacementMode = state.isPlacementMode;
    if (!state.isPlacementMode) {
      renderSlots(false);
      setHighlightedSlot(-1);
    }
  }

  function init() {
    bindSelection();
    applyTemplate(state.activeTemplate);
    if (state.selectedCardId) {
      selectCard(state.selectedCardId);
    }

    var sheet = getSheet();
    if (!sheet) return;
    var observer = new MutationObserver(function () {
      bindSelection();
      if (state.selectedCardId) selectCard(state.selectedCardId);
    });
    observer.observe(sheet, { childList: true, subtree: true });
  }

  window.ZyvolaLayoutEngine = {
    init: init,
    templates: templates,
    applyTemplate: applyTemplate,
    autoRestructure: autoRestructure,
    setPlacementMode: setPlacementMode,
    isPlacementMode: function () { return state.isPlacementMode; },
    getActiveTemplateSlots: getActiveTemplateSlots,
    renderSlots: renderSlots,
    setHighlightedSlot: setHighlightedSlot,
    slotIndexAtPoint: slotIndexAtPoint,
    nearestFreeSlotIndex: nearestFreeSlotIndex,
    centerCardInSlot: centerCardInSlot,
    syncDomToProject: syncDomToProject,
    selectCard: selectCard,
    getSelectedCardId: function () { return state.selectedCardId; }
  };
})();
