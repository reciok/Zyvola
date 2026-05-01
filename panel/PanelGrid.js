/* ============================================================
 * Zyvola · PanelGrid.js
 * Contenedor vertical sencillo. Las tarjetas se apilan en una
 * lista (sin folio, sin grid de celdas). Conserva la API mínima
 * que usan otros módulos: getCardsLayer().
 * ============================================================ */
(function () {
  "use strict";

  function PanelGrid(rootEl) {
    this.root = rootEl;
    this.build();
  }

  PanelGrid.prototype.build = function () {
    this.root.classList.add("zv-list-root");
    this.root.innerHTML = '<div class="zv-list" id="zv-list"></div>';
    this.list = this.root.querySelector("#zv-list");
  };

  PanelGrid.prototype.getCardsLayer = function () { return this.list; };
  PanelGrid.prototype.getList       = function () { return this.list; };

  window.ZyvolaPanelGrid = PanelGrid;
})();
