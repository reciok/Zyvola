(function () {
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function hasOwnVisibleText(el) {
    if (!el) return false;
    var nodes = el.childNodes || [];
    for (var i = 0; i < nodes.length; i += 1) {
      var n = nodes[i];
      if (n && n.nodeType === Node.TEXT_NODE && String(n.nodeValue || "").trim()) {
        return true;
      }
    }
    return false;
  }

  function attach(config) {
    var state = {
      active: null
    };

    var mount = config.mount;

    mount.addEventListener("mousedown", function (ev) {
      if (typeof config.canDrag === "function" && !config.canDrag()) return;
      var node = ev.target.closest(".pc-block");
      if (!node) return;

      // Do not start drag from interactive controls/editable elements.
      if (ev.target.closest(".pc-menu, .pc-btn, .pc-block-title, input, textarea, select, button, a, [contenteditable='true']")) return;

      // Virtual drag handle: only allow drag on areas without visible text.
      var textCarrier = ev.target.closest("p, span, strong, em, small, label, li, h1, h2, h3, h4, h5, h6, td, th");
      if (textCarrier || hasOwnVisibleText(ev.target)) return;

      var id = node.getAttribute("data-block-id");
      var block = config.getBlock(id);
      if (!block) return;

      ev.preventDefault();
      state.active = {
        id: id,
        node: node,
        startX: ev.clientX,
        startY: ev.clientY,
        origX: block.x,
        origY: block.y
      };

      if (config.onStart) config.onStart(block, node);
    });

    window.addEventListener("mousemove", function (ev) {
      if (!state.active) return;
      var active = state.active;
      var block = config.getBlock(active.id);
      if (!block) return;

      var dx = ev.clientX - active.startX;
      var dy = ev.clientY - active.startY;

      var folio = config.getFolioBox();
      var nx = clamp(active.origX + dx, 0, Math.max(0, folio.width - block.w));
      var ny = clamp(active.origY + dy, 0, Math.max(0, folio.height - block.h));

      if (config.onMove) config.onMove(block, active.node, nx, ny, false);
    });

    window.addEventListener("mouseup", function () {
      if (!state.active) return;
      var active = state.active;
      state.active = null;
      var block = config.getBlock(active.id);
      if (!block) return;
      if (config.onDrop) config.onDrop(block, active.node);
      if (config.onEnd) config.onEnd(block, active.node);
    });
  }

  window.ZyvolaDragSystem = {
    attach: attach
  };
})();
