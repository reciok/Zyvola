(function () {
  var CHART_SCRIPT_ID = "zyv-chartjs-cdn";
  var CHART_SCRIPT_SRC = "https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js";
  var chartsByCanvas = {};

  function ensureChartJsLoaded() {
    if (window.Chart) {
      return Promise.resolve(window.Chart);
    }

    if (window.__zyvChartJsPromise) {
      return window.__zyvChartJsPromise;
    }

    window.__zyvChartJsPromise = new Promise(function (resolve, reject) {
      var existing = document.getElementById(CHART_SCRIPT_ID);
      if (existing) {
        existing.addEventListener("load", function () {
          resolve(window.Chart);
        });
        existing.addEventListener("error", function () {
          reject(new Error("No se pudo cargar Chart.js"));
        });
        return;
      }

      var script = document.createElement("script");
      script.id = CHART_SCRIPT_ID;
      script.src = CHART_SCRIPT_SRC;
      script.async = true;
      script.onload = function () {
        resolve(window.Chart);
      };
      script.onerror = function () {
        reject(new Error("No se pudo cargar Chart.js"));
      };

      document.head.appendChild(script);
    });

    return window.__zyvChartJsPromise;
  }

  function getChartColor(chartType) {
    if (chartType === "bar") {
      return {
        borderColor: "rgba(124, 99, 52, 0.95)",
        backgroundColor: "rgba(200, 170, 100, 0.35)"
      };
    }

    return {
      borderColor: "rgba(100, 121, 158, 0.95)",
      backgroundColor: "rgba(100, 121, 158, 0.2)"
    };
  }

  function normalizeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function renderChart(canvasId, chartType, labels, datasetLabel, values) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    return ensureChartJsLoaded().then(function () {
      var ChartCtor = window.Chart;
      if (!ChartCtor) return null;

      if (chartsByCanvas[canvasId]) {
        chartsByCanvas[canvasId].destroy();
        delete chartsByCanvas[canvasId];
      }

      var palette = getChartColor(chartType);
      var nextChart = new ChartCtor(canvas.getContext("2d"), {
        type: chartType,
        data: {
          labels: normalizeArray(labels),
          datasets: [
            {
              label: datasetLabel || "Serie",
              data: normalizeArray(values),
              borderColor: palette.borderColor,
              backgroundColor: palette.backgroundColor,
              borderWidth: 2,
              fill: chartType === "line",
              tension: chartType === "line" ? 0.25 : 0,
              pointRadius: chartType === "line" ? 2 : 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: { top: 0, bottom: 0, left: 0, right: 0 }
          },
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              grid: {
                color: "rgba(68, 83, 106, 0.08)",
                drawBorder: false
              },
              ticks: {
                color: "rgba(68, 83, 106, 0.65)",
                maxRotation: 0,
                autoSkip: true
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: "rgba(68, 83, 106, 0.08)",
                drawBorder: false
              },
              ticks: {
                color: "rgba(68, 83, 106, 0.65)"
              }
            }
          }
        }
      });

      chartsByCanvas[canvasId] = nextChart;
      return nextChart;
    });
  }

  window.ZyvolaCharts = {
    ensureChartJsLoaded: ensureChartJsLoaded,
    renderChart: renderChart
  };

  ensureChartJsLoaded();
})();
