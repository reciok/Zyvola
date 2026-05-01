(function () {
  var DASHBOARDS_KEY = "zyv_dashboards";
  var hasDelegatedSendHandler = false;

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function loadDashboards() {
    try {
      var raw = localStorage.getItem(DASHBOARDS_KEY);
      var list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) return [];

      var changed = false;
      list = list.filter(function (item) {
        if (!item || typeof item !== "object") return false;
        if (Object.prototype.hasOwnProperty.call(item, "tipo")) {
          delete item.tipo;
          changed = true;
        }
        return true;
      });

      list.forEach(function (item) {
        if (!item || typeof item !== "object") return;
        if (!item.data || typeof item.data !== "object" || Array.isArray(item.data)) {
          item.data = {};
          changed = true;
        }

        var seenSignatures = {};
        Object.keys(item.data).forEach(function (key) {
          var ds = item.data[key];
          if (!isValidDataset(ds)) return;
          var sig = datasetSignature(ds);
          if (!sig) return;
          if (seenSignatures[sig]) {
            delete item.data[key];
            changed = true;
            return;
          }
          seenSignatures[sig] = key;
        });
      });

      if (changed) {
        saveDashboards(list);
      }

      return list;
    } catch (_e) {
      return [];
    }
  }

  function saveDashboards(list) {
    localStorage.setItem(DASHBOARDS_KEY, JSON.stringify(list));
  }

  function dashboardIcon() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>';
  }

  function isValidDataset(dataset) {
    return !!dataset
      && typeof dataset === "object"
      && Array.isArray(dataset.labels)
      && Array.isArray(dataset.values)
      && dataset.labels.length === dataset.values.length;
  }

  function normalizeDataset(dataset, fallbackLabel) {
    if (!isValidDataset(dataset)) return null;
    return {
      labels: dataset.labels.slice(),
      label: dataset.label || fallbackLabel || "Serie",
      values: dataset.values.slice()
    };
  }

  function datasetSignature(dataset) {
    if (!isValidDataset(dataset)) return "";
    return JSON.stringify({
      label: dataset.label || "",
      labels: dataset.labels,
      values: dataset.values
    });
  }

  function readToolDatasets(toolName) {
    var datasets = window.ZYVOLA_DASHBOARD_DATASETS;
    if (datasets && typeof datasets === "object") return datasets;

    var runtime = window.FINANCE_TOOL_RUNTIME;
    if (runtime && typeof runtime.getDashboardDatasets === "function") {
      return runtime.getDashboardDatasets(toolName) || {};
    }

    return {};
  }

  function sendToDashboard(dashboard, toolName, section, group) {
    var toolDatasets = readToolDatasets(toolName);
    var savedCount = 0;

    if (!dashboard.data || typeof dashboard.data !== "object") {
      dashboard.data = {};
    }

    var signatureByKey = {};
    Object.keys(dashboard.data).forEach(function (existingKey) {
      var existingSig = datasetSignature(dashboard.data[existingKey]);
      if (existingSig) signatureByKey[existingSig] = existingKey;
    });

    /* Store every valid dataset the tool produced */
    var keys = Object.keys(toolDatasets);
    for (var i = 0; i < keys.length; i++) {
      var sourceKey = keys[i];
      var normalized = normalizeDataset(toolDatasets[sourceKey], toolName + " - " + sourceKey);
      if (!normalized) continue;

      var sig = datasetSignature(normalized);
      var existingKeyWithSameSig = signatureByKey[sig];
      if (existingKeyWithSameSig && existingKeyWithSameSig !== sourceKey) {
        continue;
      }

      var current = dashboard.data[sourceKey];
      var currentSig = datasetSignature(current);
      if (currentSig && currentSig === sig) {
        continue;
      }

      dashboard.data[sourceKey] = normalized;
      signatureByKey[sig] = sourceKey;
      savedCount += 1;
    }

    dashboard.dataMeta = {
      toolName: toolName,
      section: section,
      group: group,
      timestamp: Date.now()
    };

    return savedCount;
  }

  function showToast(message) {
    var existing = document.querySelector(".db-toast");
    if (existing) existing.parentNode.removeChild(existing);

    var toast = document.createElement("div");
    toast.className = "db-toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(function () {
      toast.classList.add("visible");
    });
    setTimeout(function () {
      toast.classList.remove("visible");
      setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    }, 2400);
  }

  function sendToDashboardById(dbId, toolName, section, group) {
    var allDashboards = loadDashboards();
    var target = null;
    for (var i = 0; i < allDashboards.length; i++) {
      if (allDashboards[i].id === dbId) { target = allDashboards[i]; break; }
    }
    if (!target) return false;

    var savedCount = sendToDashboard(target, toolName, section, group);
    saveDashboards(allDashboards);
    if (savedCount > 0) {
      showToast('Datos enviados a "' + target.nombre + '" (' + savedCount + ')');
    } else {
      showToast("Esta herramienta aun no genera datasets compatibles para dashboard.");
    }
    return true;
  }

  function openSendPromptFallback(toolName, section, group) {
    var dashboards = loadDashboards();
    if (!dashboards.length) {
      window.alert("No hay dashboards creados todavia. Crea uno y vuelve a intentarlo.");
      return;
    }

    var list = dashboards.map(function (db, index) {
      return (index + 1) + ". " + db.nombre;
    }).join("\n");

    var input = window.prompt("Elige dashboard (numero):\n" + list, "1");
    if (input == null) return;

    var selected = parseInt(String(input).trim(), 10);
    if (!Number.isFinite(selected) || selected < 1 || selected > dashboards.length) {
      window.alert("Seleccion invalida.");
      return;
    }

    sendToDashboardById(dashboards[selected - 1].id, toolName, section, group);
  }

  function openSendFlow(toolName, section, group) {
    try {
      openSendModal(toolName, section, group);
      setTimeout(function () {
        if (!document.querySelector(".db-modal-overlay")) {
          openSendPromptFallback(toolName, section, group);
        }
      }, 0);
    } catch (_err) {
      openSendPromptFallback(toolName, section, group);
    }
  }

  function openSendModal(toolName, section, group) {
    var dashboards = loadDashboards();

    var overlay = document.createElement("div");
    overlay.className = "db-modal-overlay";

    var listHtml = "";
    if (!dashboards.length) {
      listHtml = '<div class="db-picker-empty"><p>No hay dashboards creados todavía.</p><p class="muted">Crea uno con el nombre que quieras y vuelve a intentarlo.</p></div>';
    } else {
      listHtml = '<div class="db-picker-list">';
      dashboards.forEach(function (db) {
        listHtml += '<button class="db-picker-item" type="button" data-db-id="' + escapeHtml(db.id) + '"><div class="db-card-icon">' + dashboardIcon() + '</div><div><div class="db-picker-item-name">' + escapeHtml(db.nombre) + "</div></div></button>';
      });
      listHtml += "</div>";
    }

    overlay.innerHTML = '<div class="db-modal"><div class="db-modal-header"><h2>Enviar a dashboard</h2><button class="db-modal-close" type="button" aria-label="Cerrar">&times;</button></div><div class="db-modal-body"><p class="db-modal-label">Herramienta: ' + escapeHtml(toolName) + "</p>" + listHtml + "</div></div>";

    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }

    overlay.querySelector(".db-modal-close").addEventListener("click", close);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });

    overlay.querySelectorAll("[data-db-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var dbId = btn.getAttribute("data-db-id");
        var ok = sendToDashboardById(dbId, toolName, section, group);
        if (!ok) return;
        close();
      });
    });

    document.body.appendChild(overlay);
  }

  /* ── Inject button into tool pages ── */
  function injectSendButton() {
    var params = new URLSearchParams(window.location.search);
    var section = params.get("section") || "";
    var group = params.get("group") || "";

    var content = document.getElementById("tool-content");
    var slot = document.getElementById("dashboard-send-slot");
    var staticBtn = document.getElementById("dashboard-send-btn-static");
    if (!content) return;

    function resolveToolName() {
      var fromQuery = params.get("tool");
      if (fromQuery) return fromQuery;

      var heading = content.querySelector("h1, h2, .fx-calculator-head h2");
      if (heading && heading.textContent) {
        var t = heading.textContent.trim();
        if (t) return t;
      }

      return "Herramienta";
    }

    function handleSendClick() {
      var toolName = resolveToolName();
      openSendFlow(toolName, section, group);
    }

    window.ZyvolaOpenSendModal = handleSendClick;

    if (!hasDelegatedSendHandler) {
      document.addEventListener("click", function (event) {
        var target = event.target;
        if (!(target instanceof Element)) return;
        var trigger = target.closest("[data-dashboard-send-trigger='1']");
        if (!trigger) return;
        event.preventDefault();
        handleSendClick();
      });
      hasDelegatedSendHandler = true;
    }

    if (staticBtn && !staticBtn.getAttribute("data-bound")) {
      staticBtn.setAttribute("data-bound", "1");
      staticBtn.setAttribute("data-dashboard-send-trigger", "1");
    }

    function tryInject() {
      /* Don't inject twice */
      if (staticBtn || (slot && slot.querySelector(".db-send-btn")) || content.querySelector(".db-send-btn")) return;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "db-send-btn";
      btn.setAttribute("data-dashboard-send-trigger", "1");
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg> Enviar a dashboard';

      /* Insert into fixed slot when available, otherwise inside tool content */
      var wrapper = document.createElement("div");
      wrapper.setAttribute("data-dashboard-send-wrapper", "1");
      wrapper.style.cssText = slot ? "display:flex;" : "display:flex;justify-content:flex-end;margin-bottom:1rem;";
      wrapper.appendChild(btn);

      if (slot) {
        slot.innerHTML = "";
        slot.appendChild(wrapper);
      } else {
        var firstChild = content.firstElementChild;
        if (firstChild) {
          content.insertBefore(wrapper, firstChild);
        } else {
          content.appendChild(wrapper);
        }
      }
    }

    /* Retry briefly because tool content may render asynchronously */
    var attempts = 0;
    var maxAttempts = 20;
    var timer = setInterval(function () {
      attempts += 1;
      tryInject();
      if (content.querySelector(".db-send-btn") || attempts >= maxAttempts) {
        clearInterval(timer);
      }
    }, 120);

    /* Keep the button alive in case another render replaces tool-content */
    var observer = new MutationObserver(function () {
      tryInject();
    });
    observer.observe(content, { childList: true, subtree: true });
  }

  injectSendButton();
})();
