(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function closePanels() {
    document.querySelectorAll(".folio-floating-panel").forEach(function (el) {
      el.classList.remove("open");
    });
  }

  function togglePanel(id) {
    var panel = byId(id);
    if (!panel) return;
    var wasOpen = panel.classList.contains("open");
    closePanels();
    if (!wasOpen) panel.classList.add("open");
  }

  function render() {
    var host = document.createElement("div");
    host.id = "folio-top-menu";
    host.className = "folio-top-menu";
    host.innerHTML =
      '<div class="folio-menu-buttons">' +
        '<button type="button" class="folio-menu-btn" data-open="panel-templates">Plantillas</button>' +
        '<button type="button" class="folio-menu-btn" data-open="panel-shapes">Cambiar forma</button>' +
        '<button type="button" class="folio-menu-btn" data-open="panel-auto">Auto</button>' +
      '</div>' +
      '<div id="panel-templates" class="folio-floating-panel">' +
        '<button class="folio-panel-btn" data-template="PLANTILLA_A">PLANTILLA_A</button>' +
        '<button class="folio-panel-btn" data-template="PLANTILLA_B">PLANTILLA_B</button>' +
        '<button class="folio-panel-btn" data-template="PLANTILLA_C">PLANTILLA_C</button>' +
        '<button class="folio-panel-btn" data-template="PLANTILLA_D">PLANTILLA_D</button>' +
      '</div>' +
      '<div id="panel-shapes" class="folio-floating-panel">' +
        '<button class="folio-panel-btn" data-shape="FormaGrandeHorizontal">FormaGrandeHorizontal</button>' +
        '<button class="folio-panel-btn" data-shape="FormaCuadrada">FormaCuadrada</button>' +
        '<button class="folio-panel-btn" data-shape="FormaVertical">FormaVertical</button>' +
        '<button class="folio-panel-btn" data-shape="FormaMini">FormaMini</button>' +
        '<button class="folio-panel-btn" data-shape="FormaHero">FormaHero</button>' +
      '</div>' +
      '<div id="panel-auto" class="folio-floating-panel">' +
        '<button class="folio-panel-btn" data-auto="reflow">Reestructurar</button>' +
        '<button class="folio-panel-btn" id="btn-placement-mode">Modo colocación: Off</button>' +
      '</div>';

    document.body.appendChild(host);
  }

  function bind() {
    var layout = window.ZyvolaLayoutEngine;
    var shape = window.ZyvolaShapeEngine;
    if (!layout || !shape) return;

    var host = byId("folio-top-menu");
    if (!host || host.dataset.bound === "1") return;
    host.dataset.bound = "1";

    host.addEventListener("click", function (ev) {
      var openBtn = ev.target.closest("[data-open]");
      if (openBtn) {
        togglePanel(openBtn.getAttribute("data-open"));
        return;
      }

      var tplBtn = ev.target.closest("[data-template]");
      if (tplBtn) {
        layout.applyTemplate(tplBtn.getAttribute("data-template"));
        closePanels();
        return;
      }

      var shapeBtn = ev.target.closest("[data-shape]");
      if (shapeBtn) {
        shape.applyShape(shapeBtn.getAttribute("data-shape"));
        closePanels();
        return;
      }

      var autoBtn = ev.target.closest("[data-auto='reflow']");
      if (autoBtn) {
        layout.autoRestructure();
        closePanels();
        return;
      }

      if (ev.target.id === "btn-placement-mode") {
        var next = !layout.isPlacementMode();
        layout.setPlacementMode(next);
        ev.target.textContent = "Modo colocación: " + (next ? "On" : "Off");
      }
    });

    document.addEventListener("click", function (ev) {
      if (!host.contains(ev.target)) closePanels();
    });
  }

  function init() {
    if (byId("folio-top-menu")) return;
    render();
    bind();
  }

  window.ZyvolaMenuTop = {
    init: init
  };
})();
