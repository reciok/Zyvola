(function () {
  var GAP = 24;

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function resolveMetrics(width) {
    return {
      width: Math.max(900, width || 900),
      gap: GAP
    };
  }

  function slot(index, name, x, y, w, h) {
    return {
      index: index,
      name: name,
      x: Math.round(x),
      y: Math.round(y),
      w: Math.round(w),
      h: Math.round(h)
    };
  }

  function fixedSlots() {
    // Fixed structure:
    // Row 1: A (350x250) - B (300x150) - C (200x200)
    // Row 2: D (300x300) - E (250x120)
    var x0 = 0;
    var x1 = x0 + 350 + GAP;
    var x2 = x1 + 300 + GAP;
    var y0 = 0;
    var y1 = y0 + 250 + 32;

    return [
      slot(0, "A", x0, y0, 350, 250),
      slot(1, "B", x1, y0, 300, 150),
      slot(2, "C", x2, y0, 200, 200),
      slot(3, "D", x0, y1, 300, 300),
      slot(4, "E", x1, y1, 250, 120)
    ];
  }

  function nearestIndex(block, list) {
    if (!list.length) return 0;
    var cx = block.x + block.w / 2;
    var cy = block.y + block.h / 2;
    var best = list[0];
    var bestD = Number.MAX_SAFE_INTEGER;

    list.forEach(function (s) {
      var sx = s.x + s.w / 2;
      var sy = s.y + s.h / 2;
      var d = Math.hypot(cx - sx, cy - sy);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    });

    return best.index;
  }

  function create(sheet) {
    function metrics() {
      return resolveMetrics(sheet.clientWidth || 900);
    }

    function getSlots(count) {
      var base = fixedSlots();
      if (!count) return base;
      return base.slice(0, clamp(count, 1, base.length));
    }

    function applyOrder(blocks) {
      var ordered = blocks.slice();
      var list = fixedSlots();
      ordered.forEach(function (b, i) {
        var s = list[i % list.length];
        if (!s) return;
        b.w = s.w;
        b.h = s.h;
        b.x = s.x;
        b.y = s.y;
      });
      return ordered;
    }

    function getNearestSlotIndex(block, count) {
      var list = fixedSlots();
      return nearestIndex(block, list);
    }

    return {
      metrics: metrics,
      getSlots: getSlots,
      applyOrder: applyOrder,
      getNearestSlotIndex: getNearestSlotIndex
    };
  }

  window.ZyvolaGridTemplate = {
    create: create
  };
})();
