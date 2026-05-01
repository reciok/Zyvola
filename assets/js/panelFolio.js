(function () {
  function create(root) {
    root.innerHTML =
      '<div class="folio-stage">' +
        '<div class="folio-sheet" id="folio-sheet">' +
          '<div class="folio-slots" id="folio-slots"></div>' +
          '<div class="folio-highlight" id="folio-highlight"></div>' +
          '<div class="folio-guides" id="folio-guides"></div>' +
        '</div>' +
      '</div>';

    var sheet = root.querySelector("#folio-sheet");
    var slotsHost = root.querySelector("#folio-slots");
    var highlight = root.querySelector("#folio-highlight");
    var guides = root.querySelector("#folio-guides");

    function getBox() {
      return {
        width: sheet.clientWidth,
        height: sheet.clientHeight
      };
    }

    function ensureHeight(blocks) {
      var minHeight = 980;
      var maxBottom = minHeight;
      blocks.forEach(function (b) {
        var bottom = b.y + b.h + 48;
        if (bottom > maxBottom) maxBottom = bottom;
      });
      sheet.style.height = maxBottom + "px";
    }

    function showGuides(list) {
      guides.innerHTML = "";
      (list || []).forEach(function (g) {
        var line = document.createElement("span");
        line.className = "folio-guide folio-guide-" + g.orientation;
        if (g.orientation === "v") {
          line.style.left = g.pos + "px";
        } else {
          line.style.top = g.pos + "px";
        }
        guides.appendChild(line);
      });
    }

    function clearGuides() {
      guides.innerHTML = "";
    }

    function showSlotHighlight(slot) {
      if (!slot) {
        highlight.classList.remove("is-visible");
        return;
      }
      highlight.classList.add("is-visible");
      highlight.style.left = slot.x + "px";
      highlight.style.top = slot.y + "px";
      highlight.style.width = slot.w + "px";
      highlight.style.height = slot.h + "px";
    }

    function renderSlots(slots) {
      slotsHost.innerHTML = "";
      (slots || []).forEach(function (slot) {
        var node = document.createElement("span");
        node.className = "folio-slot";
        node.style.left = slot.x + "px";
        node.style.top = slot.y + "px";
        node.style.width = slot.w + "px";
        node.style.height = slot.h + "px";
        slotsHost.appendChild(node);
      });
    }

    function clearSlots() {
      slotsHost.innerHTML = "";
    }

    function setSlotsVisible(active) {
      if (active) {
        sheet.classList.add("show-slots");
      } else {
        sheet.classList.remove("show-slots");
      }
    }

    function setArranging(active) {
      if (active) {
        sheet.classList.add("is-arranging");
      } else {
        sheet.classList.remove("is-arranging");
        showSlotHighlight(null);
      }
    }

    function orderGrid(blocks) {
      var colGap = 20;
      var rowGap = 18;
      var sheetWidth = sheet.clientWidth;
      var cardWidth = Math.floor((sheetWidth - 48 - colGap) / 2);
      var x0 = 24;
      var x1 = x0 + cardWidth + colGap;
      var colHeights = [24, 24];

      blocks.forEach(function (b) {
        b.w = Math.max(340, Math.min(cardWidth, 520));
        b.h = Math.max(350, Math.min(b.h || 400, 450));
        var col = colHeights[0] <= colHeights[1] ? 0 : 1;
        b.x = col === 0 ? x0 : x1;
        b.y = colHeights[col];
        colHeights[col] += b.h + rowGap;
      });

      ensureHeight(blocks);
    }

    return {
      sheet: sheet,
      ensureHeight: ensureHeight,
      showGuides: showGuides,
      clearGuides: clearGuides,
      showSlotHighlight: showSlotHighlight,
      setArranging: setArranging,
      renderSlots: renderSlots,
      clearSlots: clearSlots,
      setSlotsVisible: setSlotsVisible,
      getBox: getBox,
      orderGrid: orderGrid
    };
  }

  window.ZyvolaFolio = {
    create: create
  };
})();
