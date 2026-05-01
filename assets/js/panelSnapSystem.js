(function () {
  var THRESHOLD = 18;

  function centerInSlot(moving, slot) {
    return {
      x: slot.x + (slot.w - moving.w) / 2,
      y: slot.y + (slot.h - moving.h) / 2
    };
  }

  function slotByArea(moving, slots) {
    if (!slots || !slots.length) return null;
    var cx = moving.x + moving.w / 2;
    var cy = moving.y + moving.h / 2;
    for (var i = 0; i < slots.length; i += 1) {
      var s = slots[i];
      if (cx >= s.x && cx <= s.x + s.w && cy >= s.y && cy <= s.y + s.h) {
        return s;
      }
    }
    return null;
  }

  function nearestSlot(moving, slots) {
    if (!slots || !slots.length) return null;
    var cx = moving.x + moving.w / 2;
    var cy = moving.y + moving.h / 2;
    var best = null;
    var bestDist = Number.MAX_SAFE_INTEGER;

    slots.forEach(function (slot) {
      var sx = slot.x + slot.w / 2;
      var sy = slot.y + slot.h / 2;
      var d = Math.hypot(cx - sx, cy - sy);
      if (d < bestDist) {
        bestDist = d;
        best = slot;
      }
    });

    if (!best) return null;
    return {
      slot: best,
      distance: bestDist
    };
  }

  function applySnap(input) {
    var moving = input.moving;
    var slots = input.slots || [];
    var threshold = input.threshold || THRESHOLD;

    var hitArea = slotByArea(moving, slots);
    var hit = hitArea ? { slot: hitArea, distance: 0 } : nearestSlot(moving, slots);
    var x = moving.x;
    var y = moving.y;
    var guides = [];

    if (hit) {
      guides.push({ orientation: "v", pos: hit.slot.x });
      guides.push({ orientation: "h", pos: hit.slot.y });
      if (hitArea || hit.distance <= threshold) {
        var centered = centerInSlot(moving, hit.slot);
        x = centered.x;
        y = centered.y;
      }
    }

    return {
      x: x,
      y: y,
      guides: guides,
      slot: hit ? hit.slot : null,
      snapped: !!(hit && (hitArea || hit.distance <= threshold))
    };
  }

  window.ZyvolaSnapSystem = {
    applySnap: applySnap,
    THRESHOLD: THRESHOLD
  };
})();
