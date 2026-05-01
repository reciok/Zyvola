(function () {
  var KEY = "zyv_panel_blocks_clipboard";
  var Z = 20;
  var MIN_W = 220;
  var MAX_W = 520;
  var MIN_H = 260;
  var MAX_H = 520;

  var SIZE_PRESETS = {
    s: { w: 260, h: 300 },
    m: { w: 320, h: 360 },
    l: { w: 420, h: 440 }
  };

  function id() {
    return "blk_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function getMobilityMode() {
    var value = localStorage.getItem("zyv_folio_mobility") || "snap";
    return value === "free" ? "free" : "snap";
  }

  function getCardSize() {
    var value = localStorage.getItem("zyv_folio_size") || "m";
    return SIZE_PRESETS[value] ? value : "m";
  }

  function getPattern() {
    return localStorage.getItem("zyv_folio_pattern") || "auto";
  }

  function getDragMode() {
    var value = localStorage.getItem("zyv_folio_drag_mode");
    if (value == null) return true;
    return value === "on";
  }

  function getSlotsVisibility() {
    var value = localStorage.getItem("zyv_folio_slots");
    if (value == null) return true;
    return value !== "off";
  }

  function sizeSpec(sizeKey) {
    return SIZE_PRESETS[sizeKey] || SIZE_PRESETS.m;
  }

  function normalizeBlock(input, offset) {
    var o = Number(offset || 0);
    var preset = sizeSpec(getCardSize());
    return {
      id: input && input.id ? String(input.id) : id(),
      toolName: String((input && input.toolName) || "Herramienta"),
      section: String((input && input.section) || ""),
      group: String((input && input.group) || ""),
      x: Number.isFinite(Number(input && input.x)) ? Number(input.x) + o : 24 + o,
      y: Number.isFinite(Number(input && input.y)) ? Number(input.y) + o : 24 + o,
      w: Number.isFinite(Number(input && input.w)) ? clamp(Number(input.w), MIN_W, MAX_W) : preset.w,
      h: Number.isFinite(Number(input && input.h)) ? clamp(Number(input.h), MIN_H, MAX_H) : preset.h,
      collapsed: !!(input && input.collapsed)
    };
  }

  function parseToolFromLink(anchor) {
    if (!anchor) return null;
    var t = anchor.getAttribute("data-tool-name");
    var s = anchor.getAttribute("data-tool-section");
    var g = anchor.getAttribute("data-tool-group");
    if (t) return { toolName: t, section: s || "", group: g || "" };
    try {
      var href = anchor.getAttribute("href") || "";
      var full = new URL(href, window.location.href);
      return {
        toolName: full.searchParams.get("tool") || "",
        section: full.searchParams.get("section") || "",
        group: full.searchParams.get("group") || ""
      };
    } catch (_e) {
      return null;
    }
  }

  function saveToProject(state) {
    var pp = window.ZyvolaPanelProject;
    if (!pp || typeof pp.setProjectBlocks !== "function") return;
    pp.setProjectBlocks(state.blocks);
  }

  function loadFromProject() {
    var pp = window.ZyvolaPanelProject;
    if (!pp || typeof pp.getProjectBlocks !== "function") return [];
    var list = pp.getProjectBlocks();
    return Array.isArray(list) ? list.map(function (b) { return normalizeBlock(b, 0); }) : [];
  }

  function createState(root, folio) {
    return {
      root: root,
      folio: folio,
      grid: null,
      blocks: [],
      nodeById: new Map(),
      mobility: getMobilityMode(),
      cardSize: getCardSize(),
      showSlots: getSlotsVisibility(),
      dragMode: getDragMode()
    };
  }

  function positionNode(node, block) {
    node.style.left = Math.round(block.x) + "px";
    node.style.top = Math.round(block.y) + "px";
    node.style.width = Math.round(block.w) + "px";
    node.style.height = Math.round(block.h) + "px";
    node.style.zIndex = String(++Z);
  }

  function syncNodeSizes(state) {
    var m = state.grid.metrics();
    state.blocks.forEach(function (b) {
      b.w = clamp(b.w, MIN_W, Math.min(MAX_W, m.colW));
      b.h = clamp(b.h, b.collapsed ? 54 : MIN_H, b.collapsed ? 54 : MAX_H);
      var box = state.folio.getBox();
      b.x = clamp(b.x, 0, Math.max(0, box.width - b.w));
      b.y = clamp(b.y, 0, Math.max(0, box.height - b.h));
    });
  }

  function readingOrder(blocks) {
    return blocks.slice().sort(function (a, b) {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
  }

  function placeBlocksInTemplate(state, ordered) {
    state.blocks = state.grid.applyOrder(ordered || state.blocks);
    state.folio.ensureHeight(state.blocks);
  }

  function reflowWithMovedBlock(state, moving, targetIndex) {
    var ordered = readingOrder(state.blocks).filter(function (b) { return b.id !== moving.id; });
    var idx = Math.max(0, Math.min(targetIndex, ordered.length));
    ordered.splice(idx, 0, moving);
    placeBlocksInTemplate(state, ordered);
  }

  function nearestFreeSlotIndex(fromIndex, freeSet, slots) {
    if (!slots || !slots.length || !freeSet || !freeSet.size) return null;
    var start = Number.isFinite(fromIndex) ? fromIndex : 0;
    for (var step = 1; step <= slots.length; step += 1) {
      var idx = (start + step) % slots.length;
      if (freeSet.has(idx)) return idx;
    }
    return null;
  }

  function placeInSlot(block, slot) {
    if (!block || !slot) return;
    block.w = slot.w;
    block.h = slot.h;
    block.x = slot.x;
    block.y = slot.y;
  }

  function refreshSlots(state) {
    if (!state.folio || typeof state.folio.renderSlots !== "function") return;
    state.folio.setSlotsVisible(false);
    state.folio.clearSlots();
  }

  function showDragSlots(state) {
    if (!state.folio || typeof state.folio.renderSlots !== "function") return;
    if (!state.showSlots || !state.dragMode || state.mobility === "free") return;
    var slots = state.grid.getSlots(5);
    state.folio.renderSlots(slots);
    state.folio.setSlotsVisible(true);
  }

  function hideDragSlots(state) {
    if (!state.folio) return;
    state.folio.setSlotsVisible(false);
    state.folio.clearSlots();
  }

  function applyPattern(state, pattern) {
    placeBlocksInTemplate(state, readingOrder(state.blocks));
  }

  function applyCardSize(state, sizeKey) {
    state.cardSize = SIZE_PRESETS[sizeKey] ? sizeKey : "m";
    applyPattern(state, "auto");
  }

  function renderAll(state) {
    state.folio.sheet.querySelectorAll(".pc-block").forEach(function (n) { n.remove(); });
    state.nodeById.clear();

    state.blocks.forEach(function (block) {
      var node = window.ZyvolaCompactCard.create(block, function (act, b) {
        if (act === "remove") {
          state.blocks = state.blocks.filter(function (x) { return x.id !== b.id; });
          renderAll(state);
          saveToProject(state);
          return;
        }
        if (act === "duplicate") {
          var copy = normalizeBlock(b, 24);
          copy.id = id();
          state.blocks.push(copy);
          renderAll(state);
          saveToProject(state);
          return;
        }
        if (act === "collapse") {
          b.collapsed = !b.collapsed;
          b.h = b.collapsed ? 54 : 360;
          renderAll(state);
          saveToProject(state);
          return;
        }
        if (act === "rename") {
          saveToProject(state);
          return;
        }
      });

      positionNode(node, block);
      state.folio.sheet.appendChild(node);
      state.nodeById.set(block.id, node);
    });

    state.folio.ensureHeight(state.blocks);
    refreshSlots(state);
  }

  function addBlock(state, data) {
    var block = normalizeBlock(data, state.blocks.length * 12);
    state.blocks.push(block);

    if (state.mobility === "free") {
      syncNodeSizes(state);
      state.folio.ensureHeight(state.blocks);
    } else {
      applyPattern(state, getPattern());
    }

    renderAll(state);
    saveToProject(state);
    if (window.ZyvolaPanelProject && typeof window.ZyvolaPanelProject.recordToolUsage === "function") {
      window.ZyvolaPanelProject.recordToolUsage(block.toolName, block.section, block.group);
    }
  }

  function getBlock(state, id) {
    return state.blocks.find(function (b) { return b.id === id; }) || null;
  }

  function setupSidebarDnD(state) {
    var nav = document.getElementById("finance-tools-menu");
    if (!nav) return;

    function makeLinksDraggable() {
      document.querySelectorAll(".finance-tool-link").forEach(function (a) {
        a.setAttribute("draggable", "true");
      });
    }

    var ob = new MutationObserver(makeLinksDraggable);
    ob.observe(nav, { subtree: true, childList: true });
    makeLinksDraggable();

    document.addEventListener("dragstart", function (ev) {
      var link = ev.target.closest(".finance-tool-link");
      if (!link || document.body.dataset.page !== "panel") return;
      var data = parseToolFromLink(link);
      if (!data || !data.toolName) return;
      ev.dataTransfer.setData("application/json", JSON.stringify(data));
      ev.dataTransfer.effectAllowed = "copy";
    });

    state.folio.sheet.addEventListener("dragover", function (ev) {
      ev.preventDefault();
    });

    state.folio.sheet.addEventListener("drop", function (ev) {
      ev.preventDefault();
      var raw = ev.dataTransfer.getData("application/json") || "";
      if (!raw) return;
      try {
        var obj = JSON.parse(raw);
        var rect = state.folio.sheet.getBoundingClientRect();
        obj.x = clamp(ev.clientX - rect.left - 230, 0, Math.max(0, rect.width - 360));
        obj.y = clamp(ev.clientY - rect.top - 24, 0, Math.max(0, rect.height - 380));
        addBlock(state, obj);
      } catch (_e) {}
    });

    document.addEventListener("click", function (ev) {
      var link = ev.target.closest(".finance-tool-link");
      if (!link || document.body.dataset.page !== "panel") return;
      var data = parseToolFromLink(link);
      if (!data || !data.toolName) return;
      ev.preventDefault();
      addBlock(state, data);
    });
  }

  function setupDrag(state) {
    var snap = window.ZyvolaSnapSystem;
    var dragCtx = {
      origin: null,
      lastSnap: null
    };

    window.ZyvolaDragSystem.attach({
      mount: state.folio.sheet,
      canDrag: function () { return !!state.dragMode; },
      getBlock: function (id) { return getBlock(state, id); },
      getFolioBox: function () { return state.folio.getBox(); },
      onStart: function (block, node) {
        node.style.zIndex = String(++Z);
        dragCtx.origin = { x: block.x, y: block.y, w: block.w, h: block.h };
        dragCtx.lastSnap = null;
        state.folio.setArranging(true);
        showDragSlots(state);
      },
      onMove: function (block, node, x, y) {
        if (state.mobility === "free") {
          block.x = x;
          block.y = y;
          positionNode(node, block);
          state.folio.clearGuides();
          state.folio.showSlotHighlight(null);
          return;
        }

        var slots = state.grid.getSlots(state.blocks.length);
        slots = state.grid.getSlots(5);
        var result = snap.applySnap({
          moving: { id: block.id, x: x, y: y, w: block.w, h: block.h },
          slots: slots
        });
        dragCtx.lastSnap = result;
        block.x = result.x;
        block.y = result.y;
        positionNode(node, block);
        state.folio.showGuides(result.guides);
        state.folio.showSlotHighlight(result.slot);
      },
      onDrop: function (block, node) {
        if (state.mobility === "free") {
          var box = state.folio.getBox();
          block.x = clamp(block.x, 0, Math.max(0, box.width - block.w));
          block.y = clamp(block.y, 0, Math.max(0, box.height - block.h));
          positionNode(node, block);
          state.folio.ensureHeight(state.blocks);
          saveToProject(state);
          return;
        }

        if (!dragCtx.lastSnap || !dragCtx.lastSnap.snapped || !dragCtx.lastSnap.slot) {
          if (dragCtx.origin) {
            block.x = dragCtx.origin.x;
            block.y = dragCtx.origin.y;
            block.w = dragCtx.origin.w;
            block.h = dragCtx.origin.h;
          }
          positionNode(node, block);
          state.folio.ensureHeight(state.blocks);
          saveToProject(state);
          return;
        }

        var slots = state.grid.getSlots(5);
        var target = Number.isFinite(dragCtx.lastSnap.slot.index)
          ? dragCtx.lastSnap.slot.index
          : state.grid.getNearestSlotIndex(block, 5);
        var targetSlot = slots[target] || null;

        if (!targetSlot) {
          if (dragCtx.origin) {
            block.x = dragCtx.origin.x;
            block.y = dragCtx.origin.y;
            block.w = dragCtx.origin.w;
            block.h = dragCtx.origin.h;
          }
          positionNode(node, block);
          state.folio.ensureHeight(state.blocks);
          saveToProject(state);
          return;
        }

        var bySlot = {};
        state.blocks.forEach(function (b) {
          var idx = state.grid.getNearestSlotIndex(b, 5);
          bySlot[idx] = bySlot[idx] || [];
          bySlot[idx].push(b);
        });

        var movingPrev = state.grid.getNearestSlotIndex(block, 5);
        var occupied = (bySlot[target] || []).find(function (b) { return b.id !== block.id; }) || null;

        placeInSlot(block, targetSlot);

        if (occupied) {
          var freeSet = new Set();
          for (var i = 0; i < slots.length; i += 1) {
            var hasCard = (bySlot[i] || []).some(function (b) { return b.id !== block.id && b.id !== occupied.id; });
            if (!hasCard) freeSet.add(i);
          }

          var nextFree = nearestFreeSlotIndex(target, freeSet, slots);
          if (nextFree == null && Number.isFinite(movingPrev)) {
            nextFree = movingPrev;
          }
          if (nextFree != null && slots[nextFree]) {
            placeInSlot(occupied, slots[nextFree]);
          }
        }

        positionNode(node, block);
        state.folio.showGuides(targetSlot ? [{ orientation: "v", pos: targetSlot.x }, { orientation: "h", pos: targetSlot.y }] : []);
        state.folio.showSlotHighlight(targetSlot);
        state.folio.ensureHeight(state.blocks);
        renderAll(state);
        saveToProject(state);
      },
      onEnd: function () {
        dragCtx.origin = null;
        dragCtx.lastSnap = null;
        state.folio.clearGuides();
        state.folio.showSlotHighlight(null);
        state.folio.setArranging(false);
        hideDragSlots(state);
      }
    });
  }

  function setupSortButton(state) {
    document.addEventListener("zyv:folio-sort", function () {
      placeBlocksInTemplate(state, readingOrder(state.blocks));
      renderAll(state);
      saveToProject(state);
    });

    document.addEventListener("zyv:folio-pattern", function (ev) {
      var pattern = ev && ev.detail && ev.detail.pattern ? String(ev.detail.pattern) : "auto";
      if (state.mobility === "free") return;
      applyPattern(state, pattern);
      renderAll(state);
      refreshSlots(state);
      saveToProject(state);
    });

    document.addEventListener("zyv:folio-mobility", function (ev) {
      var mobility = ev && ev.detail && ev.detail.mobility ? String(ev.detail.mobility) : "snap";
      state.mobility = mobility === "free" ? "free" : "snap";
      if (state.mobility === "snap") {
        applyPattern(state, getPattern());
      } else {
        syncNodeSizes(state);
      }
      renderAll(state);
      saveToProject(state);
    });

    document.addEventListener("zyv:folio-size", function (ev) {
      var size = ev && ev.detail && ev.detail.size ? String(ev.detail.size) : "m";
      applyCardSize(state, size);
      renderAll(state);
      saveToProject(state);
    });

    document.addEventListener("zyv:folio-slots", function (ev) {
      var visible = !!(ev && ev.detail && ev.detail.visible);
      state.showSlots = visible;
      if (!visible) hideDragSlots(state);
    });

    document.addEventListener("zyv:folio-dragmode", function (ev) {
      state.dragMode = !!(ev && ev.detail && ev.detail.active);
      localStorage.setItem("zyv_folio_drag_mode", state.dragMode ? "on" : "off");
      if (!state.dragMode) {
        state.folio.clearGuides();
        state.folio.showSlotHighlight(null);
        state.folio.setArranging(false);
        hideDragSlots(state);
      }
    });
  }

  function init(mount) {
    if (!mount || !window.ZyvolaFolio || !window.ZyvolaCompactCard || !window.ZyvolaDragSystem || !window.ZyvolaSnapSystem) {
      return null;
    }

    mount.classList.add("panel-canvas");
    var folio = window.ZyvolaFolio.create(mount);
    var state = createState(mount, folio);
    state.grid = window.ZyvolaGridTemplate.create(folio.sheet);
    state.blocks = loadFromProject();
    applyCardSize(state, state.cardSize);
    if (state.mobility === "free") {
      syncNodeSizes(state);
      state.folio.ensureHeight(state.blocks);
    } else {
      applyPattern(state, getPattern());
    }
    renderAll(state);

    setupSidebarDnD(state);
    setupDrag(state);
    setupSortButton(state);

    var pp = window.ZyvolaPanelProject;
    if (pp && typeof pp.subscribe === "function") {
      pp.subscribe(function () {
        state.blocks = loadFromProject();
        state.mobility = getMobilityMode();
        state.cardSize = getCardSize();
        state.showSlots = getSlotsVisibility();
        state.dragMode = getDragMode();
        applyCardSize(state, state.cardSize);
        if (state.mobility === "free") {
          syncNodeSizes(state);
          state.folio.ensureHeight(state.blocks);
        } else {
          applyPattern(state, getPattern());
        }
        renderAll(state);
      });
    }

    return {
      addBlock: function (data) { addBlock(state, data); },
      addFromQuery: function () {
        var p = new URLSearchParams(window.location.search);
        var tool = p.get("tool") || "";
        var section = p.get("section") || "";
        var group = p.get("group") || "";
        if (!tool) return;
        addBlock(state, { toolName: tool, section: section, group: group });
        history.replaceState({}, "", window.location.pathname);
      },
      getState: function () { return state.blocks.slice(); }
    };
  }

  window.ZyvolaPanelCanvas = {
    init: init,
    stashBlock: function (block) {
      localStorage.setItem(KEY, JSON.stringify(normalizeBlock(block, 0)));
    },
    popStashedBlock: function () {
      try {
        var raw = localStorage.getItem(KEY);
        if (!raw) return null;
        localStorage.removeItem(KEY);
        return normalizeBlock(JSON.parse(raw), 0);
      } catch (_e) {
        return null;
      }
    }
  };
})();
