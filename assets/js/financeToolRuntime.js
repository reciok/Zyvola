(function () {
  const STORE_KEY = "zyvola-finance-runtime-v1";

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function euros(value) {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0
    }).format(value || 0);
  }

  function pct(value) {
    return `${(value || 0).toFixed(1)}%`;
  }

  function isoDateOffset(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
  }

  function seedData() {
    const categories = [
      ["NOMINA", "ingresos", 2800],
      ["FREELANCE", "ingresos", 600],
      ["ALQUILER", "vivienda", -980],
      ["SUPERMERCADO", "alimentacion", -260],
      ["TRANSPORTE", "movilidad", -120],
      ["RESTAURANTES", "ocio", -170],
      ["LUZ", "servicios", -82],
      ["INTERNET", "servicios", -46],
      ["STREAMING", "suscripciones", -18],
      ["BROKER", "inversion", -350]
    ];

    const transactions = [];
    for (let day = 0; day < 210; day += 1) {
      categories.forEach((row, idx) => {
        if ((day + idx) % (idx < 2 ? 30 : 10 + idx) === 0) {
          const sign = row[2] >= 0 ? 1 : -1;
          const base = Math.abs(row[2]);
          const noise = ((day * (idx + 3)) % 37) - 18;
          transactions.push({
            id: `tx-${day}-${idx}`,
            date: isoDateOffset(day),
            merchant: row[0],
            category: row[1],
            amount: sign * (base + noise),
            isFee: row[1] === "servicios" && (day + idx) % 45 === 0,
            account: idx % 2 === 0 ? "Cuenta principal" : "Tarjeta"
          });
        }
      });
    }

    // Duplicados de ejemplo
    transactions.push({
      id: "dup-1",
      date: isoDateOffset(3),
      merchant: "SUPERMERCADO",
      category: "alimentacion",
      amount: -92,
      isFee: false,
      account: "Tarjeta"
    });
    transactions.push({
      id: "dup-2",
      date: isoDateOffset(2),
      merchant: "SUPERMERCADO",
      category: "alimentacion",
      amount: -92,
      isFee: false,
      account: "Tarjeta"
    });

    return {
      accounts: [
        { name: "Cuenta principal", balance: 12450 },
        { name: "Ahorro", balance: 18600 },
        { name: "Tarjeta", balance: -1350 }
      ],
      assets: [
        { name: "Liquidez", type: "liquido", value: 31050 },
        { name: "ETF Global", type: "inversion", value: 22800 },
        { name: "Acciones", type: "inversion", value: 9200 },
        { name: "Fondo emergencia", type: "liquido", value: 6200 }
      ],
      liabilities: [
        { name: "Hipoteca", type: "largo", value: 119000, monthly: 780 },
        { name: "Préstamo coche", type: "medio", value: 8200, monthly: 240 },
        { name: "Tarjeta revolving", type: "corto", value: 1350, monthly: 90 }
      ],
      goals: [
        { name: "Fondo emergencia", target: 12000, current: 6200 },
        { name: "Inversión anual", target: 10000, current: 5400 },
        { name: "Reducir deuda", target: 10000, current: 3150 }
      ],
      categoryHints: {
        NOMINA: "ingresos",
        FREELANCE: "ingresos",
        ALQUILER: "vivienda",
        SUPERMERCADO: "alimentacion",
        TRANSPORTE: "movilidad",
        RESTAURANTES: "ocio",
        LUZ: "servicios",
        INTERNET: "servicios",
        STREAMING: "suscripciones",
        BROKER: "inversion"
      },
      transactions,
      resolvedDuplicates: []
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) {
        const initial = seedData();
        localStorage.setItem(STORE_KEY, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(raw);
    } catch (_err) {
      return seedData();
    }
  }

  function saveState(next) {
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  }

  function byDays(transactions, days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return transactions.filter((tx) => new Date(tx.date) >= cutoff);
  }

  function sum(values) {
    return values.reduce((acc, n) => acc + n, 0);
  }

  function monthlyBuckets(transactions, monthsBack) {
    const map = new Map();
    for (let i = monthsBack - 1; i >= 0; i -= 1) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, { income: 0, expense: 0, net: 0 });
    }
    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map.has(key)) return;
      if (tx.amount >= 0) map.get(key).income += tx.amount;
      else map.get(key).expense += Math.abs(tx.amount);
      map.get(key).net += tx.amount;
    });
    return [...map.entries()].map(([month, values]) => ({ month, ...values }));
  }

  function kpiCard(label, value, tone) {
    const toneClass = tone ? `tone-${tone}` : "";
    const icons = { ok: "↑", warn: "~", bad: "↓" };
    const icon = icons[tone] || "•";
    return `<article class="fx-metric ${toneClass}"><div class="fx-metric-icon">${icon}</div><p class="fx-metric-label">${label}</p><p class="fx-metric-value">${value}</p></article>`;
  }

  function listCard(title, items) {
    return `
      <div class="fx-insights-panel">
        <div class="fx-insights-head">
          <span class="fx-insights-icon">💡</span>
          <span class="fx-insights-title">${title}</span>
        </div>
        <ul class="fx-insights-list">${items.map((i) => `<li>${i}</li>`).join("")}</ul>
      </div>
    `;
  }

  function tableCard(title, headers, rows) {
    const head = headers.map((h) => `<th>${h}</th>`).join("");
    const body = rows
      .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
      .join("");
    return `
      <div class="fx-results-table-wrap">
        <div class="fx-results-table-header">
          <span class="fx-insights-icon">📋</span>
          <span class="fx-results-table-title">${title}</span>
        </div>
        <table class="fx-results-table">
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    `;
  }

  function eurosPrecise(value, digits) {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: digits == null ? 2 : digits,
      maximumFractionDigits: digits == null ? 2 : digits
    }).format(value || 0);
  }

  function decimal(value, digits) {
    return new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: digits == null ? 2 : digits,
      maximumFractionDigits: digits == null ? 2 : digits
    }).format(value || 0);
  }

  function annualRateToMonthly(ratePct) {
    return (ratePct || 0) / 100 / 12;
  }

  function totalMonths(years) {
    return Math.max(Math.round((years || 0) * 12), 1);
  }

  function compoundGrowth(amount, ratePct, years, compoundsPerYear) {
    const periods = Math.max(Math.round((years || 0) * (compoundsPerYear || 1)), 0);
    const periodRate = compoundsPerYear ? (ratePct || 0) / 100 / compoundsPerYear : 0;
    return amount * Math.pow(1 + periodRate, periods);
  }

  function futureValueWithMonthlyContributions(principal, monthlyContribution, annualRatePct, years) {
    const months = totalMonths(years);
    const rate = annualRateToMonthly(annualRatePct);
    const futurePrincipal = principal * Math.pow(1 + rate, months);
    if (rate === 0) {
      return futurePrincipal + monthlyContribution * months;
    }
    const futureContributions = monthlyContribution * ((Math.pow(1 + rate, months) - 1) / rate);
    return futurePrincipal + futureContributions;
  }

  function monthlyPayment(principal, annualRatePct, years) {
    const months = totalMonths(years);
    const rate = annualRateToMonthly(annualRatePct);
    if (rate === 0) return principal / months;
    return (principal * rate) / (1 - Math.pow(1 + rate, -months));
  }

  function amortizationSchedule(principal, annualRatePct, years, maxRows) {
    const payment = monthlyPayment(principal, annualRatePct, years);
    const rate = annualRateToMonthly(annualRatePct);
    const months = totalMonths(years);
    const rows = [];
    let balance = principal;

    for (let month = 1; month <= months; month += 1) {
      const interest = balance * rate;
      const principalPaid = payment - interest;
      balance = Math.max(balance - principalPaid, 0);
      if (month <= (maxRows || months) || month === months) {
        rows.push({
          month,
          payment,
          interest,
          principalPaid,
          balance
        });
      }
    }

    return rows;
  }

  function parseNumber(value, fallback) {
    const normalized = String(value == null ? "" : value).replace(/,/g, ".").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback || 0;
  }

  function parseCashFlows(value) {
    return String(value || "")
      .split(/[\n,;]+/)
      .map((item) => parseNumber(item, NaN))
      .filter((item) => Number.isFinite(item));
  }

  function npv(discountRatePct, initialInvestment, cashFlows) {
    const rate = (discountRatePct || 0) / 100;
    return cashFlows.reduce((acc, flow, index) => acc + flow / Math.pow(1 + rate, index + 1), -initialInvestment);
  }

  function irr(initialInvestment, cashFlows) {
    const flows = [-Math.abs(initialInvestment), ...cashFlows];
    let guess = 0.12;

    for (let i = 0; i < 60; i += 1) {
      let value = 0;
      let derivative = 0;

      for (let t = 0; t < flows.length; t += 1) {
        value += flows[t] / Math.pow(1 + guess, t);
        if (t > 0) {
          derivative -= (t * flows[t]) / Math.pow(1 + guess, t + 1);
        }
      }

      if (Math.abs(derivative) < 1e-9) break;
      const next = guess - value / derivative;
      if (!Number.isFinite(next) || next <= -0.9999) break;
      if (Math.abs(next - guess) < 1e-7) return next;
      guess = next;
    }

    let low = -0.95;
    let high = 2;
    for (let i = 0; i < 100; i += 1) {
      const mid = (low + high) / 2;
      const value = flows.reduce((acc, flow, index) => acc + flow / Math.pow(1 + mid, index), 0);
      if (Math.abs(value) < 1e-7) return mid;
      if (value > 0) low = mid;
      else high = mid;
    }

    return guess;
  }

  function normalizeWeights(weights) {
    const total = sum(weights);
    if (!total) return weights.map(() => 0);
    return weights.map((weight) => weight / total);
  }

  function realRate(nominalRatePct, inflationRatePct) {
    return ((1 + (nominalRatePct || 0) / 100) / (1 + (inflationRatePct || 0) / 100) - 1) * 100;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function percentile(values, p) {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = clamp((sorted.length - 1) * p, 0, sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  function annualRateToMonthlyReturn(ratePct) {
    return (ratePct || 0) / 100 / 12;
  }

  function annualVolatilityToMonthly(volatilityPct) {
    return ((volatilityPct || 0) / 100) / Math.sqrt(12);
  }

  function randomNormal() {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function maxDrawdownFromSeries(series) {
    if (!series.length) return 0;
    let peak = series[0];
    let drawdown = 0;
    series.forEach((value) => {
      peak = Math.max(peak, value);
      if (peak > 0) {
        drawdown = Math.max(drawdown, ((peak - value) / peak) * 100);
      }
    });
    return drawdown;
  }

  function simulatePath(options) {
    const months = Math.max(Math.round(options.months || 0), 1);
    const contribution = options.monthlyContribution || 0;
    const withdrawal = options.monthlyWithdrawal || 0;
    const monthlyMean = annualRateToMonthlyReturn(options.annualReturnPct || 0);
    const monthlyVol = annualVolatilityToMonthly(options.volatilityPct || 0);
    const floorAtZero = options.floorAtZero !== false;
    const series = [options.initialBalance || 0];
    let balance = options.initialBalance || 0;

    for (let month = 1; month <= months; month += 1) {
      const shock = monthlyVol > 0 ? randomNormal() * monthlyVol : 0;
      const monthlyRate = Math.max(monthlyMean + shock, -0.95);
      balance = balance * (1 + monthlyRate) + contribution - withdrawal;
      if (floorAtZero && balance < 0) balance = 0;
      series.push(balance);
    }

    return series;
  }

  function yearsMonthsLabel(totalMonthsValue) {
    const safeMonths = Math.max(Math.round(totalMonthsValue || 0), 0);
    const years = Math.floor(safeMonths / 12);
    const months = safeMonths % 12;
    return `${years}a ${months}m`;
  }

  function compareOptionTotalCost(initialCost, monthlyCost, years, annualRatePct) {
    const months = totalMonths(years);
    const monthlyRate = annualRateToMonthlyReturn(annualRatePct);
    let presentValue = initialCost || 0;
    for (let month = 1; month <= months; month += 1) {
      presentValue += monthlyCost / Math.pow(1 + monthlyRate, month);
    }
    return presentValue;
  }

  function renderMetrics(items) {
    return `<div class="fx-metrics-grid">${items.map((item) => kpiCard(item.label, item.value, item.tone)).join("")}</div>`;
  }

  function renderCalculatorOutput(result) {
    const sections = [];
    sections.push(`<div class="fx-results-section">`);
    sections.push(`<div class="fx-results-header"><span class="fx-results-icon">RS</span><span class="fx-results-title">Resultados</span></div>`);
    if (result.summary && result.summary.length) {
      sections.push(renderMetrics(result.summary));
    }
    if (result.insights && result.insights.length) {
      sections.push(listCard("Lectura de resultados", result.insights));
    }
    if (result.tables && result.tables.length) {
      sections.push(
        result.tables
          .map((table) => tableCard(table.title, table.headers, table.rows))
          .join("")
      );
    }
    sections.push(`</div>`);
    return sections.join("");
  }

  function toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function safeDataset(labels, label, values) {
    const cleanLabels = Array.isArray(labels) ? labels.slice() : [];
    const cleanValues = Array.isArray(values) ? values.map((item) => toNumber(item)) : [];
    if (!cleanLabels.length || cleanLabels.length !== cleanValues.length) return null;
    return {
      labels: cleanLabels,
      label: label || "Serie",
      values: cleanValues
    };
  }

  function extractDatasetFromResult(result, fallbackLabel) {
    if (!result || typeof result !== "object") return null;

    if (Array.isArray(result.tables) && result.tables.length) {
      const firstTable = result.tables[0];
      if (firstTable && Array.isArray(firstTable.rows) && firstTable.rows.length) {
        const labels = [];
        const values = [];
        firstTable.rows.forEach((row) => {
          if (!Array.isArray(row) || !row.length) return;
          labels.push(String(row[0]));
          let numeric = null;
          for (let i = row.length - 1; i >= 1; i -= 1) {
            const asNumber = parseNumber(String(row[i]).replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(/,/g, "."), NaN);
            if (Number.isFinite(asNumber)) {
              numeric = asNumber;
              break;
            }
          }
          values.push(numeric == null ? 0 : numeric);
        });
        const fromTable = safeDataset(labels, fallbackLabel, values);
        if (fromTable) return fromTable;
      }
    }

    if (Array.isArray(result.summary) && result.summary.length) {
      const labels = [];
      const values = [];
      result.summary.forEach((item) => {
        if (!item || typeof item !== "object") return;
        labels.push(String(item.label || "Metrica"));
        const numeric = parseNumber(String(item.value || "").replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(/,/g, "."), 0);
        values.push(numeric);
      });
      return safeDataset(labels, fallbackLabel, values);
    }

    return null;
  }

  function buildDashboardDatasets(definition, values, result) {
    const out = {};
    const id = String((definition && definition.id) || "").toLowerCase();

    if (result && result.datasets && typeof result.datasets === "object") {
      const keys = Object.keys(result.datasets);
      for (let i = 0; i < keys.length; i += 1) {
        const ds = result.datasets[keys[i]];
        if (ds && Array.isArray(ds.labels) && Array.isArray(ds.values) && ds.labels.length === ds.values.length && ds.labels.length > 0) {
          out[keys[i]] = { labels: ds.labels.slice(), label: ds.label || "Serie", values: ds.values.slice() };
        }
      }
    }

    if (!out.amortizationSchedule && (id === "amortization" || id === "sim-dynamic-amortization" || id === "sim-mortgage" || id === "mortgage")) {
      const principal = toNumber(values.principal != null ? values.principal : values.propertyValue - values.downPayment);
      const annualRate = toNumber(values.annualRate);
      const years = Math.max(toNumber(values.years), 1);
      const schedule = amortizationSchedule(Math.max(principal, 0), annualRate, years);

      const monthLabels = schedule.slice(0, 24).map((row) => `Mes ${row.month}`);
      const monthBalances = schedule.slice(0, 24).map((row) => row.balance);
      const amortizationDataset = safeDataset(monthLabels, "Amortizacion", monthBalances);
      if (amortizationDataset) out.amortizationSchedule = amortizationDataset;

      if (!out.interestVsPrincipal) {
        const yearsCount = Math.min(Math.ceil(schedule.length / 12), 10);
        const yearsLabels = [];
        const principalByYear = [];
        for (let year = 1; year <= yearsCount; year += 1) {
          const start = (year - 1) * 12;
          const chunk = schedule.slice(start, start + 12);
          if (!chunk.length) break;
          yearsLabels.push(`Año ${year}`);
          principalByYear.push(chunk.reduce((acc, row) => acc + row.principalPaid, 0));
        }
        const interestVsPrincipal = safeDataset(yearsLabels, "Capital amortizado por año", principalByYear);
        if (interestVsPrincipal) out.interestVsPrincipal = interestVsPrincipal;
      }
    }

    if (!out.cashflowHistory && (id === "monthly-cashflow-real-estate" || id === "sim-real-estate-cashflow" || id === "buy-vs-rent" || id === "sim-buy-vs-rent")) {
      if (id === "buy-vs-rent" || id === "sim-buy-vs-rent") {
        const annualBuyCost = toNumber(values.annualMortgage) + toNumber(values.annualOwnershipCosts) + toNumber(values.opportunityCost);
        const annualRent = toNumber(values.annualRent);
        const compareDataset = safeDataset(["Comprar", "Alquilar"], "Coste anual comparado", [annualBuyCost, annualRent]);
        if (compareDataset) out.cashflowHistory = compareDataset;
      } else {
        const effectiveRent = toNumber(values.monthlyRent) * (1 - toNumber(values.vacancyPct) / 100);
        const monthlyCashFlow = effectiveRent - toNumber(values.monthlyMortgage) - toNumber(values.monthlyExpenses);
        const labels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const valuesSeries = labels.map(() => monthlyCashFlow);
        const cashflowDataset = safeDataset(labels, "Cashflow mensual", valuesSeries);
        if (cashflowDataset) out.cashflowHistory = cashflowDataset;
      }
    }

    if (!out.roiByYear && (id === "roi" || id === "real-estate-roi-tax" || id === "sim-real-estate-investment" || id === "real-estate-irr" || id === "sim-real-estate-irr")) {
      let years = Math.max(Math.round(toNumber(values.years || 5)), 1);
      if ((id === "real-estate-irr" || id === "sim-real-estate-irr") && Array.isArray(result && result.tables) && result.tables[0] && Array.isArray(result.tables[0].rows)) {
        years = Math.max(result.tables[0].rows.length, 1);
      }
      const totalRoi = result && Array.isArray(result.summary)
        ? parseNumber(String((result.summary.find((item) => {
          const label = String(item && item.label ? item.label : "").toLowerCase();
          return label.indexOf("roi") !== -1 || label.indexOf("irr") !== -1 || label.indexOf("retorno") !== -1;
        }) || {}).value || "").replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(/,/g, "."), 0)
        : 0;
      const step = years > 0 ? totalRoi / years : totalRoi;
      const labels = [];
      const valuesSeries = [];
      for (let year = 1; year <= years; year += 1) {
        labels.push(`Año ${year}`);
        valuesSeries.push(step * year);
      }
      const roiDataset = safeDataset(labels, "ROI acumulado (%)", valuesSeries);
      if (roiDataset) out.roiByYear = roiDataset;
    }

    if (!out.profitHistory && (id.indexOf("compound") !== -1 || id.indexOf("investment") !== -1 || id.indexOf("dca") !== -1 || id.indexOf("saving") !== -1)) {
      const years = Math.max(Math.round(toNumber(values.years || 10)), 1);
      const initial = toNumber(values.principal != null ? values.principal : values.initialInvestment != null ? values.initialInvestment : values.initialBalance);
      const monthly = toNumber(values.monthlyContribution);
      const annualRate = toNumber(values.annualRate != null ? values.annualRate : values.annualReturn);
      const labels = [];
      const valuesSeries = [];
      for (let year = 1; year <= years; year += 1) {
        labels.push(`Año ${year}`);
        valuesSeries.push(futureValueWithMonthlyContributions(initial, monthly, annualRate, year));
      }
      const profitDataset = safeDataset(labels, "Evolución de capital", valuesSeries);
      if (profitDataset) out.profitHistory = profitDataset;
    }

    const fallback = extractDatasetFromResult(result, definition && definition.title ? definition.title : "Serie");
    if (fallback && !Object.keys(out).length) {
      out.fallbackSeries = fallback;
    }

    return out;
  }

  function renderField(field) {
    if (field.type === "textarea") {
      return `
        <label class="fx-field fx-field-full">
          <span class="fx-field-label">${field.label}</span>
          <textarea name="${field.name}" rows="${field.rows || 4}" placeholder="${field.placeholder || ""}">${field.default || ""}</textarea>
          ${field.help ? `<small class="fx-field-help">${field.help}</small>` : ""}
        </label>
      `;
    }

    if (field.type === "select") {
      return `
        <label class="fx-field">
          <span class="fx-field-label">${field.label}</span>
          <select name="${field.name}">
            ${(field.options || [])
              .map(
                (option) =>
                  `<option value="${option.value}" ${String(option.value) === String(field.default) ? "selected" : ""}>${option.label}</option>`
              )
              .join("")}
          </select>
          ${field.help ? `<small class="fx-field-help">${field.help}</small>` : ""}
        </label>
      `;
    }

    return `
      <label class="fx-field">
        <span class="fx-field-label">${field.label}</span>
        <input
          type="${field.type || "number"}"
          name="${field.name}"
          value="${field.default != null ? field.default : ""}"
          min="${field.min != null ? field.min : ""}"
          max="${field.max != null ? field.max : ""}"
          step="${field.step != null ? field.step : "any"}"
          placeholder="${field.placeholder || ""}"
        />
        ${field.help ? `<small class="fx-field-help">${field.help}</small>` : ""}
      </label>
    `;
  }

  const CALCULATOR_SCENARIOS_KEY = "zyv_calculator_scenarios";

  function metricToNumber(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const cleaned = String(value == null ? "" : value)
      .replace(/[^0-9,.-]/g, "")
      .replace(/\.(?=\d{3}(\D|$))/g, "")
      .replace(/,/g, ".");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function loadCalculatorScenarios() {
    try {
      const raw = localStorage.getItem(CALCULATOR_SCENARIOS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_e) {
      return {};
    }
  }

  function saveCalculatorScenarios(value) {
    localStorage.setItem(CALCULATOR_SCENARIOS_KEY, JSON.stringify(value || {}));
  }

  function getPrimaryMetric(result) {
    if (!result || !Array.isArray(result.summary) || !result.summary.length) {
      return { label: "Métrica principal", numeric: NaN, raw: "-" };
    }
    const first = result.summary[0] || {};
    return {
      label: first.label || "Métrica principal",
      numeric: metricToNumber(first.value),
      raw: first.value == null ? "-" : String(first.value)
    };
  }

  function buildCalculatorRecommendations(definition, values, result) {
    const recs = [];
    const id = String((definition && definition.id) || "");
    const primary = getPrimaryMetric(result);

    if (id.indexOf("compound") !== -1 || id.indexOf("investment") !== -1 || id.indexOf("dca") !== -1) {
      recs.push("Evalúa aumentar el aporte mensual en 5%-10% para acelerar el capital final sin elevar de golpe el riesgo.");
      recs.push("Compara el mismo escenario con 1 año adicional para medir el efecto del tiempo sobre el interés compuesto.");
    }

    if (id.indexOf("mortgage") !== -1 || id.indexOf("loan") !== -1 || id.indexOf("amortization") !== -1) {
      recs.push("Prueba una amortización extra mensual y compara el ahorro total en intereses antes de decidir.");
      recs.push("Contrasta al menos dos escenarios de tipo de interés para estimar tu sensibilidad a cambios de mercado.");
    }

    if (id.indexOf("roi") !== -1 || id.indexOf("irr") !== -1 || id.indexOf("npv") !== -1) {
      recs.push("Valida el escenario con una hipótesis conservadora y otra agresiva antes de ejecutar la inversión.");
      recs.push("Define un umbral mínimo de retorno aceptable y usa la comparativa para descartar decisiones débiles.");
    }

    if (values && Number.isFinite(values.years) && values.years > 0 && values.years < 5) {
      recs.push("Revisa un horizonte de 5+ años para evitar decisiones demasiado cortoplacistas.");
    }

    if (Number.isFinite(primary.numeric)) {
      recs.push(`Métrica principal actual (${primary.label}): ${primary.raw}. Guarda este escenario como referencia antes de probar ajustes.`);
    }

    if (!recs.length) {
      recs.push("Guarda este escenario como base y compara variantes para decidir con evidencia.");
      recs.push("Documenta el supuesto más incierto y vuelve a calcularlo con rangos conservador/base/agresivo.");
    }

    return recs.slice(0, 4);
  }

  function createCalculatorRenderer(definition) {
    return function () {
      const html = `
        <section class="fx-calculator-shell reveal">
          <article class="card fx-calculator-card">
            <div class="fx-calculator-head">
              <div>
                <h2>${definition.title}</h2>
                <p class="card-copy">${definition.description}</p>
              </div>
            </div>
            <form class="fx-calculator-form" data-calculator-form="${definition.id}">
              <div class="fx-fields-grid">
                ${definition.fields.map(renderField).join("")}
              </div>
              <div class="fx-form-actions">
                <button class="button" type="submit">Calcular</button>
                <button class="button" type="button" data-calc-save="${definition.id}" style="font-size:0.78rem;padding:0.62rem 0.88rem">Guardar escenario</button>
                <button class="button" type="button" data-calc-baseline="${definition.id}" style="font-size:0.78rem;padding:0.62rem 0.88rem">Usar como base</button>
              </div>
            </form>
          </article>
        </section>
        <div data-calculator-output="${definition.id}"></div>
        <div data-calculator-compare="${definition.id}"></div>
        <div data-calculator-scenarios="${definition.id}"></div>
      `;

      return {
        html,
        hookAfterRender(container) {
          const form = container.querySelector(`[data-calculator-form="${definition.id}"]`);
          const output = container.querySelector(`[data-calculator-output="${definition.id}"]`);
          const compareHost = container.querySelector(`[data-calculator-compare="${definition.id}"]`);
          const scenariosHost = container.querySelector(`[data-calculator-scenarios="${definition.id}"]`);
          const saveBtn = container.querySelector(`[data-calc-save="${definition.id}"]`);
          const baselineBtn = container.querySelector(`[data-calc-baseline="${definition.id}"]`);
          if (!form || !output || !compareHost || !scenariosHost) return;

          const readValues = () => {
            const data = new FormData(form);
            return definition.fields.reduce((acc, field) => {
              const raw = data.get(field.name);
              acc[field.name] = field.type === "textarea" ? String(raw || "") : parseNumber(raw, field.default || 0);
              if (field.type === "select") {
                acc[field.name] = String(raw || field.default || "");
              }
              return acc;
            }, {});
          };

          let baselineValues = readValues();
          let baselineResult = definition.compute(baselineValues);

          const renderScenarioHistory = () => {
            const store = loadCalculatorScenarios();
            const items = Array.isArray(store[definition.id]) ? store[definition.id] : [];
            if (!items.length) {
              scenariosHost.innerHTML = listCard("Escenarios guardados", ["Aún no tienes escenarios guardados para esta calculadora."]);
              return;
            }

            scenariosHost.innerHTML = tableCard(
              "Escenarios guardados",
              ["Fecha", "Escenario", "Métrica principal", "Acción"],
              items.slice(0, 6).map((item, idx) => [
                new Date(item.savedAt).toLocaleString("es-ES"),
                item.name,
                item.metricRaw || "-",
                `<button class="button" type="button" data-calc-load="${definition.id}" data-scenario-index="${idx}" style="padding:0.35rem 0.55rem;font-size:0.7rem">Cargar</button>`
              ])
            );

            scenariosHost.querySelectorAll("[data-calc-load]").forEach((btn) => {
              btn.addEventListener("click", () => {
                const index = parseInt(btn.getAttribute("data-scenario-index") || "-1", 10);
                const fresh = loadCalculatorScenarios();
                const list = Array.isArray(fresh[definition.id]) ? fresh[definition.id] : [];
                const selected = list[index];
                if (!selected || !selected.values) return;
                definition.fields.forEach((field) => {
                  const input = form.elements[field.name];
                  if (!input) return;
                  if (field.type === "select") {
                    input.value = String(selected.values[field.name] == null ? field.default : selected.values[field.name]);
                  } else {
                    input.value = selected.values[field.name] == null ? "" : String(selected.values[field.name]);
                  }
                });
                paint();
              });
            });
          };

          const renderComparison = (result) => {
            const current = getPrimaryMetric(result);
            const base = getPrimaryMetric(baselineResult);
            const comparable = Number.isFinite(current.numeric) && Number.isFinite(base.numeric);
            const delta = comparable ? current.numeric - base.numeric : NaN;
            const deltaPct = comparable && base.numeric !== 0 ? (delta / Math.abs(base.numeric)) * 100 : NaN;

            compareHost.innerHTML = tableCard(
              "Comparativa rápida (base vs actual)",
              ["Métrica", "Base", "Actual", "Delta"],
              [[
                current.label || base.label || "Métrica principal",
                base.raw,
                current.raw,
                comparable ? `${delta >= 0 ? "+" : ""}${decimal(delta, 2)} (${deltaPct >= 0 ? "+" : ""}${decimal(deltaPct, 2)}%)` : "No comparable"
              ]]
            );
          };

          const paint = () => {
            const values = readValues();
            const result = definition.compute(values);
            window.ZYVOLA_DASHBOARD_DATASETS = buildDashboardDatasets(definition, values, result);
            const recommendations = buildCalculatorRecommendations(definition, values, result);

            var chartPlaceholders = "";
            if (result.chartData && Array.isArray(result.chartData) && result.chartData.length) {
              chartPlaceholders = result.chartData.map(function (cd) {
                return '<div class="fx-chart-wrap" style="margin-top:1.25rem">' +
                  '<div class="fx-results-header"><span class="fx-results-icon">GR</span><span class="fx-results-title">' + (cd.title || "Gráfico") + '</span></div>' +
                  '<div style="position:relative;height:220px;margin-top:0.5rem"><canvas id="' + cd.id + '"></canvas></div>' +
                '</div>';
              }).join("");
            }

            output.innerHTML = renderCalculatorOutput(result) + chartPlaceholders + listCard("Recomendaciones accionables", recommendations);
            output.querySelectorAll(".reveal").forEach((node) => node.classList.add("is-visible"));

            if (result.chartData && Array.isArray(result.chartData) && window.ZyvolaCharts) {
              result.chartData.forEach(function (cd) {
                window.ZyvolaCharts.renderChart(cd.id, cd.type || "bar", cd.labels, cd.datasetLabel || definition.title, cd.values);
              });
            }

            renderComparison(result);
            renderScenarioHistory();
          };

          form.addEventListener("submit", (event) => {
            event.preventDefault();
            paint();
          });
          form.addEventListener("input", paint);
          form.addEventListener("change", paint);

          if (saveBtn) {
            saveBtn.addEventListener("click", () => {
              const values = readValues();
              const result = definition.compute(values);
              const metric = getPrimaryMetric(result);
              const store = loadCalculatorScenarios();
              const current = Array.isArray(store[definition.id]) ? store[definition.id] : [];
              const next = [
                {
                  savedAt: Date.now(),
                  name: `Escenario ${current.length + 1}`,
                  values,
                  metricRaw: metric.raw
                },
                ...current
              ].slice(0, 12);
              store[definition.id] = next;
              saveCalculatorScenarios(store);
              renderScenarioHistory();
            });
          }

          if (baselineBtn) {
            baselineBtn.addEventListener("click", () => {
              baselineValues = readValues();
              baselineResult = definition.compute(baselineValues);
              paint();
            });
          }

          paint();
        }
      };
    };
  }

  const calculatorDefinitions = {
    "calculadora de interés compuesto": {
      id: "compound-interest",
      title: "Calculadora de interés compuesto",
      description: "Proyecta crecimiento de capital con aportes periódicos y efecto compuesto.",
      fields: [
        { name: "principal", label: "Capital inicial", default: 12000, min: 0, step: 100 },
        { name: "monthlyContribution", label: "Aporte mensual", default: 250, min: 0, step: 10 },
        { name: "annualRate", label: "Rentabilidad anual (%)", default: 7, min: 0, step: 0.1 },
        { name: "years", label: "Plazo (años)", default: 10, min: 0, step: 1 }
      ],
      compute(values) {
        const futureValue = futureValueWithMonthlyContributions(
          values.principal,
          values.monthlyContribution,
          values.annualRate,
          values.years
        );
        const invested = values.principal + values.monthlyContribution * totalMonths(values.years);
        const yrs = Math.max(Math.round(values.years), 1);
        const yearLabels = [];
        const yearValues = [];
        for (let y = 1; y <= yrs; y += 1) {
          yearLabels.push(`Año ${y}`);
          yearValues.push(futureValueWithMonthlyContributions(values.principal, values.monthlyContribution, values.annualRate, y));
        }
        return {
          summary: [
            { label: "Valor futuro", value: eurosPrecise(futureValue), tone: "ok" },
            { label: "Capital aportado", value: eurosPrecise(invested), tone: "warn" },
            { label: "Ganancia estimada", value: eurosPrecise(futureValue - invested), tone: "ok" }
          ],
          insights: [
            `La cartera se multiplica por ${decimal(values.principal > 0 ? futureValue / values.principal : 0, 2)} veces sobre el capital inicial.`,
            `Con aportes mensuales de ${eurosPrecise(values.monthlyContribution)}, el interés compuesto acelera el resultado a medida que crece el plazo.`
          ],
          datasets: {
            profitHistory: safeDataset(yearLabels, "Evolución de capital", yearValues)
          }
        };
      }
    },
    "calculadora de inflación": {
      id: "inflation",
      title: "Calculadora de inflación",
      description: "Estima el coste futuro de un importe actual y la pérdida de poder adquisitivo.",
      fields: [
        { name: "currentAmount", label: "Importe actual", default: 1000, min: 0, step: 10 },
        { name: "annualInflation", label: "Inflacion anual (%)", default: 3, min: 0, step: 0.1 },
        { name: "years", label: "Horizonte (años)", default: 8, min: 0, step: 1 }
      ],
      compute(values) {
        const futureCost = compoundGrowth(values.currentAmount, values.annualInflation, values.years, 1);
        const loss = futureCost - values.currentAmount;
        return {
          summary: [
            { label: "Coste futuro", value: eurosPrecise(futureCost), tone: "warn" },
            { label: "Incremento acumulado", value: eurosPrecise(loss), tone: "bad" },
            { label: "Inflación acumulada", value: pct(values.currentAmount > 0 ? (loss / values.currentAmount) * 100 : 0), tone: "warn" }
          ],
          insights: [
            `Necesitarías ${eurosPrecise(futureCost)} para mantener el mismo poder de compra dentro de ${values.years} años.`,
            `Una rentabilidad inferior al ${pct(values.annualInflation)} anual destruiría poder adquisitivo en términos reales.`
          ]
        };
      }
    },
    "calculadora de préstamos": {
      id: "loan",
      description: "Calcula cuota mensual, coste total e interés acumulado de un préstamo amortizable.",
      fields: [
        { name: "principal", label: "Importe del préstamo", default: 15000, min: 0, step: 100 },
        { name: "annualRate", label: "TIN anual (%)", default: 6.5, min: 0, step: 0.1 },
        { name: "years", label: "Plazo (años)", default: 5, min: 1, step: 1 }
      ],
      compute(values) {
        const payment = monthlyPayment(values.principal, values.annualRate, values.years);
        const months = totalMonths(values.years);
        const totalPaid = payment * months;
        return {
          summary: [
            { label: "Cuota mensual", value: eurosPrecise(payment), tone: "warn" },
            { label: "Total pagado", value: eurosPrecise(totalPaid), tone: "bad" },
            { label: "Intereses totales", value: eurosPrecise(totalPaid - values.principal), tone: "bad" }
          ],
          insights: [
            `El préstamo exige ${months} cuotas mensuales.`,
            `Cada punto adicional de tipo aumenta el coste financiero y reduce flexibilidad de caja.`
          ]
        };
      }
    },
    "calculadora de hipoteca": {
      id: "mortgage",
      title: "Calculadora de hipoteca",
      description: "Proyecta la cuota hipotecaria a partir del precio, entrada y tipo de interés.",
      fields: [
        { name: "propertyValue", label: "Precio de la vivienda", default: 240000, min: 0, step: 1000 },
        { name: "downPayment", label: "Entrada inicial", default: 48000, min: 0, step: 1000 },
        { name: "annualRate", label: "Tipo anual (%)", default: 3.2, min: 0, step: 0.1 },
        { name: "years", label: "Plazo (años)", default: 30, min: 1, step: 1 },
        { name: "extraMonthly", label: "Gastos mensuales extra", default: 180, min: 0, step: 10 }
      ],
      compute(values) {
        const financed = Math.max(values.propertyValue - values.downPayment, 0);
        const payment = monthlyPayment(financed, values.annualRate, values.years);
        const schedule = amortizationSchedule(financed, values.annualRate, values.years);
        const monthLabels = schedule.slice(0, 24).map((row) => `Mes ${row.month}`);
        const monthBalances = schedule.slice(0, 24).map((row) => row.balance);
        const yearsCount = Math.min(Math.ceil(schedule.length / 12), 10);
        const yearsLabels = [];
        const principalByYear = [];
        for (let y = 1; y <= yearsCount; y += 1) {
          const chunk = schedule.slice((y - 1) * 12, y * 12);
          if (!chunk.length) break;
          yearsLabels.push(`Año ${y}`);
          principalByYear.push(chunk.reduce((a, r) => a + r.principalPaid, 0));
        }
        return {
          summary: [
            { label: "Capital financiado", value: eurosPrecise(financed), tone: "warn" },
            { label: "Cuota hipotecaria", value: eurosPrecise(payment), tone: "warn" },
            { label: "Carga mensual total", value: eurosPrecise(payment + values.extraMonthly), tone: "bad" }
          ],
          insights: [
            `La entrada cubre ${pct(values.propertyValue > 0 ? (values.downPayment / values.propertyValue) * 100 : 0)} del precio total.`,
            `Una cuota cercana o superior al 35% de tus ingresos netos tensiona la operativa mensual.`
          ],
          datasets: {
            amortizationSchedule: safeDataset(monthLabels, "Saldo pendiente", monthBalances),
            interestVsPrincipal: safeDataset(yearsLabels, "Capital amortizado por año", principalByYear)
          }
        };
      }
    },
    "calculadora de amortización": {
      id: "amortization",
      title: "Calculadora de amortización",
      description: "Muestra el desglose de capital e intereses durante la vida del préstamo.",
      fields: [
        { name: "principal", label: "Principal", default: 180000, min: 0, step: 1000 },
        { name: "annualRate", label: "Tipo anual (%)", default: 3.4, min: 0, step: 0.1 },
        { name: "years", label: "Plazo (años)", default: 25, min: 1, step: 1 }
      ],
      compute(values) {
        const scheduleFull = amortizationSchedule(values.principal, values.annualRate, values.years);
        const schedulePreview = scheduleFull.slice(0, 12);
        const payment = monthlyPayment(values.principal, values.annualRate, values.years);
        const months = totalMonths(values.years);
        const monthLabels = scheduleFull.slice(0, 24).map((row) => `Mes ${row.month}`);
        const monthBalances = scheduleFull.slice(0, 24).map((row) => row.balance);
        const yearsCount = Math.min(Math.ceil(scheduleFull.length / 12), 10);
        const yearsLabels = [];
        const principalByYear = [];
        for (let y = 1; y <= yearsCount; y += 1) {
          const chunk = scheduleFull.slice((y - 1) * 12, y * 12);
          if (!chunk.length) break;
          yearsLabels.push(`Año ${y}`);
          principalByYear.push(chunk.reduce((a, r) => a + r.principalPaid, 0));
        }
        return {
          summary: [
            { label: "Cuota mensual", value: eurosPrecise(payment), tone: "warn" },
            { label: "Interés primer año", value: eurosPrecise(sum(schedulePreview.slice(0, 12).map((row) => row.interest))), tone: "bad" },
            { label: "Saldo tras 12 meses", value: eurosPrecise(schedulePreview[Math.min(11, schedulePreview.length - 1)].balance), tone: "ok" }
          ],
          tables: [
            {
              title: `Primeros ${Math.min(12, months)} meses`,
              headers: ["Mes", "Cuota", "Interés", "Capital", "Saldo"],
              rows: schedulePreview.map((row) => [
                String(row.month),
                eurosPrecise(row.payment),
                eurosPrecise(row.interest),
                eurosPrecise(row.principalPaid),
                eurosPrecise(row.balance)
              ])
            }
          ],
          datasets: {
            amortizationSchedule: safeDataset(monthLabels, "Saldo pendiente", monthBalances),
            interestVsPrincipal: safeDataset(yearsLabels, "Capital amortizado por año", principalByYear)
          }
        };
      }
    },
    "calculadora de jubilación": {
      id: "retirement",
      title: "Calculadora de jubilación",
      description: "Proyecta el capital acumulado al retiro y el ingreso anual estimado bajo una regla de retiro.",
      fields: [
        { name: "currentAge", label: "Edad actual", default: 32, min: 18, step: 1 },
        { name: "retirementAge", label: "Edad de jubilación", default: 67, min: 19, step: 1 },
        { name: "currentSavings", label: "Ahorro acumulado", default: 45000, min: 0, step: 100 },
        { name: "monthlyContribution", label: "Aporte mensual", default: 500, min: 0, step: 10 },
        { name: "annualRate", label: "Rentabilidad anual (%)", default: 6, min: 0, step: 0.1 }
      ],
      compute(values) {
        const years = Math.max(values.retirementAge - values.currentAge, 0);
        const futureValue = futureValueWithMonthlyContributions(
          values.currentSavings,
          values.monthlyContribution,
          values.annualRate,
          years
        );
        return {
          summary: [
            { label: "Capital estimado al retiro", value: eurosPrecise(futureValue), tone: "ok" },
            { label: "Ingreso anual al 4%", value: eurosPrecise(futureValue * 0.04), tone: "warn" },
            { label: "Tiempo restante", value: `${years} años`, tone: "ok" }
          ],
          insights: [
            `Con una regla del 4%, el ingreso mensual orientativo sería ${eurosPrecise((futureValue * 0.04) / 12)}.`,
            `El capital crecería combinando aportes y rentabilidad durante ${years} años.`
          ]
        };
      }
    },
    "calculadora de roi": {
      id: "roi",
      title: "Calculadora de ROI",
      description: "Mide la rentabilidad total y anualizada de una inversión o proyecto.",
      fields: [
        { name: "initialInvestment", label: "Inversión inicial", default: 12000, min: 0, step: 100 },
        { name: "finalValue", label: "Valor final", default: 16800, min: 0, step: 100 },
        { name: "additionalCosts", label: "Costes adicionales", default: 250, min: 0, step: 10 },
        { name: "years", label: "Duración (años)", default: 3, min: 0.1, step: 0.1 }
      ],
      compute(values) {
        const base = values.initialInvestment + values.additionalCosts;
        const gain = values.finalValue - base;
        const roiValue = base > 0 ? (gain / base) * 100 : 0;
        const cagr = base > 0 && values.years > 0 ? (Math.pow(values.finalValue / base, 1 / values.years) - 1) * 100 : 0;
        const yrs = Math.max(Math.round(values.years), 1);
        const roiStep = yrs > 0 ? roiValue / yrs : roiValue;
        const roiLabels = [];
        const roiValues = [];
        for (let y = 1; y <= yrs; y += 1) {
          roiLabels.push(`Año ${y}`);
          roiValues.push(roiStep * y);
        }
        return {
          summary: [
            { label: "Beneficio neto", value: eurosPrecise(gain), tone: gain >= 0 ? "ok" : "bad" },
            { label: "ROI total", value: pct(roiValue), tone: roiValue >= 0 ? "ok" : "bad" },
            { label: "Rentabilidad anualizada", value: pct(cagr), tone: cagr >= 0 ? "ok" : "bad" }
          ],
          insights: [
            `La inversión total comprometida asciende a ${eurosPrecise(base)}.`,
            `El CAGR permite comparar esta operación con otras alternativas de distinta duración.`
          ],
          datasets: {
            roiByYear: safeDataset(roiLabels, "ROI acumulado (%)", roiValues)
          }
        };
      }
    },
    "calculadora de van": {
      id: "npv",
      title: "Calculadora de VAN",
      description: "Descuenta flujos futuros para valorar si un proyecto crea o destruye valor.",
      fields: [
        { name: "initialInvestment", label: "Inversión inicial", default: 15000, min: 0, step: 100 },
        { name: "discountRate", label: "Tasa de descuento (%)", default: 8, min: 0, step: 0.1 },
        {
          name: "cashFlows",
          label: "Flujos esperados",
          type: "textarea",
          default: "5000, 6000, 6500, 7000",
          help: "Introduce importes separados por comas o saltos de línea."
        }
      ],
      compute(values) {
        const cashFlows = parseCashFlows(values.cashFlows);
        const value = npv(values.discountRate, values.initialInvestment, cashFlows);
        return {
          summary: [
            { label: "VAN", value: eurosPrecise(value), tone: value >= 0 ? "ok" : "bad" },
            { label: "Flujos analizados", value: String(cashFlows.length), tone: "warn" },
            { label: "Inversión inicial", value: eurosPrecise(values.initialInvestment), tone: "warn" }
          ],
          tables: [
            {
              title: "Flujos descontados",
              headers: ["Periodo", "Flujo", "Valor presente"],
              rows: cashFlows.map((flow, index) => [
                String(index + 1),
                eurosPrecise(flow),
                eurosPrecise(flow / Math.pow(1 + values.discountRate / 100, index + 1))
              ])
            }
          ],
          insights: [
            value >= 0 ? "El proyecto genera valor por encima de la tasa de descuento exigida." : "El proyecto no compensa el coste de oportunidad definido.",
            `La tasa de corte utilizada es ${pct(values.discountRate)} anual.`
          ]
        };
      }
    },
    "calculadora de tir": {
      id: "irr",
      title: "Calculadora de TIR",
      description: "Encuentra la tasa interna de retorno implícita en una serie de flujos de caja.",
      fields: [
        { name: "initialInvestment", label: "Inversión inicial", default: 15000, min: 0, step: 100 },
        {
          name: "cashFlows",
          label: "Flujos esperados",
          type: "textarea",
          default: "4500, 5200, 6000, 6500",
          help: "Introduce flujos positivos separados por comas o saltos de línea."
        }
      ],
      compute(values) {
        const cashFlows = parseCashFlows(values.cashFlows);
        const rate = irr(values.initialInvestment, cashFlows) * 100;
        const npvAtIrr = npv(rate, values.initialInvestment, cashFlows);
        return {
          summary: [
            { label: "TIR estimada", value: pct(rate), tone: rate >= 0 ? "ok" : "bad" },
            { label: "VAN a esa tasa", value: eurosPrecise(npvAtIrr), tone: Math.abs(npvAtIrr) < 1 ? "ok" : "warn" },
            { label: "Flujos analizados", value: String(cashFlows.length), tone: "warn" }
          ],
          insights: [
            `La TIR representa la rentabilidad anual compuesta aproximada del proyecto.`,
            `Compárala con tu rentabilidad mínima exigida antes de aprobar la inversión.`
          ]
        };
      }
    },
    "calculadora de riesgo": {
      id: "risk",
      title: "Calculadora de riesgo",
      description: "Evalúa retorno esperado, volatilidad y drawdown para obtener una lectura operativa del riesgo.",
      fields: [
        { name: "expectedReturn", label: "Rentabilidad esperada (%)", default: 8, min: 0, step: 0.1 },
        { name: "volatility", label: "Volatilidad anual (%)", default: 14, min: 0, step: 0.1 },
        { name: "riskFreeRate", label: "Tasa libre de riesgo (%)", default: 2.5, min: 0, step: 0.1 },
        { name: "maxDrawdown", label: "Max drawdown estimado (%)", default: 18, min: 0, step: 0.1 }
      ],
      compute(values) {
        const sharpe = values.volatility > 0 ? (values.expectedReturn - values.riskFreeRate) / values.volatility : 0;
        const riskScore = values.volatility * 0.6 + values.maxDrawdown * 0.4;
        const profile = riskScore < 12 ? "Conservador" : riskScore < 22 ? "Moderado" : "Agresivo";
        return {
          summary: [
            { label: "Ratio Sharpe", value: decimal(sharpe, 2), tone: sharpe >= 0.7 ? "ok" : sharpe >= 0.4 ? "warn" : "bad" },
            { label: "Score de riesgo", value: decimal(riskScore, 1), tone: riskScore < 22 ? "warn" : "bad" },
            { label: "Perfil estimado", value: profile, tone: riskScore < 22 ? "ok" : "warn" }
          ],
          insights: [
            `Con un drawdown del ${pct(values.maxDrawdown)}, la cartera debe tolerar caidas relevantes en entornos adversos.`,
            `Un Sharpe mas alto implica mejor compensacion de retorno por unidad de volatilidad.`
          ]
        };
      }
    },
    "calculadora dca": {
      id: "dca",
      title: "Calculadora DCA",
      description: "Proyecta acumulacion por compras periodicas y diferencia entre capital aportado y valor final.",
      fields: [
        { name: "initialInvestment", label: "Inversión inicial", default: 5000, min: 0, step: 100 },
        { name: "monthlyContribution", label: "Compra mensual", default: 300, min: 0, step: 10 },
        { name: "annualRate", label: "Rentabilidad anual esperada (%)", default: 8, min: 0, step: 0.1 },
        { name: "years", label: "Horizonte (años)", default: 12, min: 1, step: 1 }
      ],
      compute(values) {
        const futureValue = futureValueWithMonthlyContributions(
          values.initialInvestment,
          values.monthlyContribution,
          values.annualRate,
          values.years
        );
        const invested = values.initialInvestment + values.monthlyContribution * totalMonths(values.years);
        const yrs = Math.max(Math.round(values.years), 1);
        const yearLabels = [];
        const yearValues = [];
        for (let y = 1; y <= yrs; y += 1) {
          yearLabels.push(`Año ${y}`);
          yearValues.push(futureValueWithMonthlyContributions(values.initialInvestment, values.monthlyContribution, values.annualRate, y));
        }
        return {
          summary: [
            { label: "Valor final estimado", value: eurosPrecise(futureValue), tone: "ok" },
            { label: "Capital aportado", value: eurosPrecise(invested), tone: "warn" },
            { label: "Ganancia potencial", value: eurosPrecise(futureValue - invested), tone: "ok" }
          ],
          insights: [
            `La disciplina mensual de ${eurosPrecise(values.monthlyContribution)} reduce dependencia del timing de entrada.`,
            `El rendimiento total mejora cuanto mayor es el horizonte y la consistencia de aportes.`
          ],
          datasets: {
            profitHistory: safeDataset(yearLabels, "Evolución de capital", yearValues)
          }
        };
      }
    },
    "proyección de dividendos": {
      id: "dividends",
      title: "Proyección de dividendos",
      description: "Estima ingresos por dividendos futuros con crecimiento del dividendo y aportes anuales.",
      fields: [
        { name: "initialInvestment", label: "Capital inicial", default: 20000, min: 0, step: 100 },
        { name: "annualContribution", label: "Aporte anual", default: 3000, min: 0, step: 100 },
        { name: "dividendYield", label: "Dividend yield inicial (%)", default: 3.5, min: 0, step: 0.1 },
        { name: "dividendGrowth", label: "Crecimiento anual del dividendo (%)", default: 5, min: 0, step: 0.1 },
        { name: "years", label: "Horizonte (años)", default: 10, min: 1, step: 1 },
        {
          name: "reinvest",
          label: "Reinvertir dividendos",
          type: "select",
          default: "si",
          options: [
            { value: "si", label: "Si" },
            { value: "no", label: "No" }
          ]
        }
      ],
      compute(values) {
        let capital = values.initialInvestment;
        let cumulativeDividends = 0;
        const rows = [];

        for (let year = 1; year <= values.years; year += 1) {
          const yieldPct = values.dividendYield * Math.pow(1 + values.dividendGrowth / 100, year - 1);
          const yearlyDividend = capital * (yieldPct / 100);
          cumulativeDividends += yearlyDividend;
          rows.push([String(year), eurosPrecise(capital), pct(yieldPct), eurosPrecise(yearlyDividend)]);
          capital += values.annualContribution;
          if (values.reinvest === "si") capital += yearlyDividend;
        }

        const lastDividend = rows.length ? rows[rows.length - 1][3] : eurosPrecise(0);
        return {
          summary: [
            { label: "Dividendos acumulados", value: eurosPrecise(cumulativeDividends), tone: "ok" },
            { label: "Ingreso anual final", value: lastDividend, tone: "warn" },
            { label: "Capital estimado final", value: eurosPrecise(capital), tone: "ok" }
          ],
          tables: [
            {
              title: "Proyección anual",
              headers: ["Año", "Capital base", "Yield", "Dividendo anual"],
              rows
            }
          ]
        };
      }
    },
    "calculadora de rentabilidad ajustada al riesgo": {
      id: "risk-adjusted-return",
      title: "Calculadora de rentabilidad ajustada al riesgo",
      description: "Compara el retorno de la cartera con el riesgo asumido mediante ratios clasicos.",
      fields: [
        { name: "portfolioReturn", label: "Rentabilidad cartera (%)", default: 11, min: -100, step: 0.1 },
        { name: "riskFreeRate", label: "Tasa libre de riesgo (%)", default: 2.5, min: -100, step: 0.1 },
        { name: "volatility", label: "Volatilidad (%)", default: 16, min: 0, step: 0.1 },
        { name: "beta", label: "Beta", default: 1.1, min: 0, step: 0.01 },
        { name: "marketReturn", label: "Rentabilidad mercado (%)", default: 9, min: -100, step: 0.1 }
      ],
      compute(values) {
        const sharpe = values.volatility > 0 ? (values.portfolioReturn - values.riskFreeRate) / values.volatility : 0;
        const treynor = values.beta > 0 ? (values.portfolioReturn - values.riskFreeRate) / values.beta : 0;
        const alpha = values.portfolioReturn - (values.riskFreeRate + values.beta * (values.marketReturn - values.riskFreeRate));
        return {
          summary: [
            { label: "Sharpe", value: decimal(sharpe, 2), tone: sharpe >= 0.7 ? "ok" : "warn" },
            { label: "Treynor", value: decimal(treynor, 2), tone: treynor >= 0 ? "ok" : "bad" },
            { label: "Alpha de Jensen", value: pct(alpha), tone: alpha >= 0 ? "ok" : "bad" }
          ],
          insights: [
            `El ratio Sharpe mide retorno extra por unidad de volatilidad.`,
            `El alpha muestra si la cartera supera lo que cabria esperar por su beta frente al mercado.`
          ]
        };
      }
    },
    "calculadora de plusvalias y minusvalias": {
      id: "gains-losses",
      title: "Calculadora de plusvalias y minusvalias",
      description: "Calcula beneficio o pérdida neta por operación incluyendo comisiones.",
      fields: [
        { name: "buyPrice", label: "Precio de compra por unidad", default: 42, min: 0, step: 0.01 },
        { name: "sellPrice", label: "Precio de venta por unidad", default: 57, min: 0, step: 0.01 },
        { name: "units", label: "Numero de unidades", default: 120, min: 0, step: 1 },
        { name: "fees", label: "Comisiones totales", default: 18, min: 0, step: 0.01 }
      ],
      compute(values) {
        const costBasis = values.buyPrice * values.units + values.fees;
        const proceeds = values.sellPrice * values.units - values.fees;
        const gain = proceeds - costBasis;
        const taxEstimate = gain > 0 ? gain * 0.19 : 0;
        return {
          summary: [
            { label: "Resultado neto", value: eurosPrecise(gain), tone: gain >= 0 ? "ok" : "bad" },
            { label: "Rentabilidad", value: pct(costBasis > 0 ? (gain / costBasis) * 100 : 0), tone: gain >= 0 ? "ok" : "bad" },
            { label: "Impuesto estimado", value: eurosPrecise(taxEstimate), tone: taxEstimate > 0 ? "warn" : "ok" }
          ],
          insights: [
            `Coste total de adquisición: ${eurosPrecise(costBasis)}.`,
            `Importe neto de venta: ${eurosPrecise(proceeds)}.`
          ]
        };
      }
    },
    "wacc (coste medio ponderado de capital)": {
      id: "wacc",
      title: "WACC (Coste Medio Ponderado de Capital)",
      description: "Combina el coste de equity y deuda para estimar la rentabilidad mínima exigida a una empresa o proyecto.",
      fields: [
        { name: "equityValue", label: "Valor del equity", default: 600000, min: 0, step: 1000 },
        { name: "debtValue", label: "Valor de la deuda", default: 250000, min: 0, step: 1000 },
        { name: "costOfEquity", label: "Coste del equity (%)", default: 11, min: 0, step: 0.1 },
        { name: "costOfDebt", label: "Coste de la deuda (%)", default: 5.2, min: 0, step: 0.1 },
        { name: "taxRate", label: "Tasa fiscal (%)", default: 25, min: 0, step: 0.1 }
      ],
      compute(values) {
        const totalCapital = values.equityValue + values.debtValue;
        const equityWeight = totalCapital > 0 ? values.equityValue / totalCapital : 0;
        const debtWeight = totalCapital > 0 ? values.debtValue / totalCapital : 0;
        const afterTaxDebt = values.costOfDebt * (1 - values.taxRate / 100);
        const wacc = equityWeight * values.costOfEquity + debtWeight * afterTaxDebt;
        return {
          summary: [
            { label: "WACC", value: pct(wacc), tone: "warn" },
            { label: "Peso equity", value: pct(equityWeight * 100), tone: "ok" },
            { label: "Peso deuda", value: pct(debtWeight * 100), tone: "warn" }
          ],
          insights: [
            `El coste de la deuda tras impuestos queda en ${pct(afterTaxDebt)}.`,
            `Cualquier inversión con retorno esperado por debajo del ${pct(wacc)} destruiría valor económico.`
          ]
        };
      }
    },
    "capm (rentabilidad esperada)": {
      id: "capm",
      title: "CAPM (Rentabilidad esperada)",
      description: "Calcula la rentabilidad esperada de un activo usando riesgo libre, beta y retorno esperado del mercado.",
      fields: [
        { name: "riskFreeRate", label: "Tasa libre de riesgo (%)", default: 2.5, min: -100, step: 0.1 },
        { name: "beta", label: "Beta del activo", default: 1.15, min: 0, step: 0.01 },
        { name: "marketReturn", label: "Rentabilidad esperada del mercado (%)", default: 8.5, min: -100, step: 0.1 }
      ],
      compute(values) {
        const marketPremium = values.marketReturn - values.riskFreeRate;
        const expectedReturn = values.riskFreeRate + values.beta * marketPremium;
        return {
          summary: [
            { label: "Rentabilidad esperada", value: pct(expectedReturn), tone: "ok" },
            { label: "Prima de mercado", value: pct(marketPremium), tone: "warn" },
            { label: "Beta", value: decimal(values.beta, 2), tone: values.beta <= 1 ? "ok" : "warn" }
          ],
          insights: [
            `Con una beta de ${decimal(values.beta, 2)}, el activo amplifica ${values.beta > 1 ? "por encima" : "por debajo"} del mercado.`,
            `El CAPM sirve como referencia de retorno mínimo exigido, no como garantía de rentabilidad futura.`
          ]
        };
      }
    },
    "beta de cartera": {
      id: "portfolio-beta",
      title: "Beta de cartera",
      description: "Calcula la sensibilidad agregada de la cartera frente al mercado a partir de pesos y betas individuales.",
      fields: [
        { name: "weight1", label: "Peso activo 1 (%)", default: 35, min: 0, step: 1 },
        { name: "beta1", label: "Beta activo 1", default: 1.2, min: 0, step: 0.01 },
        { name: "weight2", label: "Peso activo 2 (%)", default: 25, min: 0, step: 1 },
        { name: "beta2", label: "Beta activo 2", default: 0.85, min: 0, step: 0.01 },
        { name: "weight3", label: "Peso activo 3 (%)", default: 20, min: 0, step: 1 },
        { name: "beta3", label: "Beta activo 3", default: 1.45, min: 0, step: 0.01 },
        { name: "weight4", label: "Peso activo 4 (%)", default: 20, min: 0, step: 1 },
        { name: "beta4", label: "Beta activo 4", default: 0.4, min: 0, step: 0.01 }
      ],
      compute(values) {
        const rawWeights = [values.weight1, values.weight2, values.weight3, values.weight4];
        const normalized = normalizeWeights(rawWeights);
        const betas = [values.beta1, values.beta2, values.beta3, values.beta4];
        const portfolioBeta = sum(normalized.map((weight, index) => weight * betas[index]));
        return {
          summary: [
            { label: "Beta cartera", value: decimal(portfolioBeta, 2), tone: portfolioBeta <= 1 ? "ok" : "warn" },
            { label: "Peso total introducido", value: pct(sum(rawWeights)), tone: sum(rawWeights) === 100 ? "ok" : "warn" },
            { label: "Sensibilidad vs mercado", value: portfolioBeta > 1 ? "Superior" : portfolioBeta < 1 ? "Inferior" : "Neutral", tone: "warn" }
          ],
          tables: [
            {
              title: "Composicion normalizada",
              headers: ["Activo", "Peso normalizado", "Beta", "Contribucion"],
              rows: normalized.map((weight, index) => [
                `Activo ${index + 1}`,
                pct(weight * 100),
                decimal(betas[index], 2),
                decimal(weight * betas[index], 2)
              ])
            }
          ],
          insights: [
            sum(rawWeights) === 100 ? "Los pesos ya suman 100% y no requieren normalización." : "Los pesos se han normalizado automáticamente para calcular la beta agregada.",
            `Una beta de ${decimal(portfolioBeta, 2)} implica un movimiento esperado del ${pct(portfolioBeta * 100)} frente a un 100% del mercado.`
          ]
        };
      }
    },
    "cagr real (ajustado por inflacion)": {
      id: "real-cagr",
      title: "CAGR real (ajustado por inflación)",
      description: "Compara el crecimiento nominal de una inversión con la inflación para obtener rentabilidad real.",
      fields: [
        { name: "initialValue", label: "Valor inicial", default: 10000, min: 0, step: 100 },
        { name: "finalValue", label: "Valor final", default: 16000, min: 0, step: 100 },
        { name: "years", label: "Periodo (años)", default: 5, min: 0.1, step: 0.1 },
        { name: "inflationRate", label: "Inflacion media anual (%)", default: 3, min: -100, step: 0.1 }
      ],
      compute(values) {
        const nominalCagr = values.initialValue > 0 && values.years > 0 ? (Math.pow(values.finalValue / values.initialValue, 1 / values.years) - 1) * 100 : 0;
        const adjusted = realRate(nominalCagr, values.inflationRate);
        return {
          summary: [
            { label: "CAGR nominal", value: pct(nominalCagr), tone: "ok" },
            { label: "CAGR real", value: pct(adjusted), tone: adjusted >= 0 ? "ok" : "bad" },
            { label: "Inflacion media", value: pct(values.inflationRate), tone: "warn" }
          ],
          insights: [
            adjusted >= 0 ? "La inversión gana poder adquisitivo en términos reales." : "La inflación está erosionando el rendimiento real de la inversión.",
            `El capital final nominal es ${eurosPrecise(values.finalValue)}, pero su lectura real depende del entorno inflacionario.`
          ]
        };
      }
    },
    "payback descontado": {
      id: "discounted-payback",
      title: "Payback descontado",
      description: "Mide en qué momento una inversión recupera su desembolso inicial considerando el valor temporal del dinero.",
      fields: [
        { name: "initialInvestment", label: "Inversión inicial", default: 20000, min: 0, step: 100 },
        { name: "discountRate", label: "Tasa de descuento (%)", default: 9, min: 0, step: 0.1 },
        {
          name: "cashFlows",
          label: "Flujos anuales",
          type: "textarea",
          default: "5000, 6000, 6500, 7000, 7500",
          help: "Introduce los flujos separados por comas o saltos de línea."
        }
      ],
      compute(values) {
        const cashFlows = parseCashFlows(values.cashFlows);
        let cumulative = 0;
        let paybackPeriod = null;
        const rows = cashFlows.map((flow, index) => {
          const discounted = flow / Math.pow(1 + values.discountRate / 100, index + 1);
          const previous = cumulative;
          cumulative += discounted;
          if (paybackPeriod == null && cumulative >= values.initialInvestment && discounted > 0) {
            paybackPeriod = index + (values.initialInvestment - previous) / discounted + 1;
          }
          return [
            String(index + 1),
            eurosPrecise(flow),
            eurosPrecise(discounted),
            eurosPrecise(cumulative)
          ];
        });
        return {
          summary: [
            { label: "Payback descontado", value: paybackPeriod == null ? "No recuperado" : `${decimal(paybackPeriod, 2)} años`, tone: paybackPeriod == null ? "bad" : "ok" },
            { label: "Valor presente acumulado", value: eurosPrecise(cumulative), tone: cumulative >= values.initialInvestment ? "ok" : "warn" },
            { label: "Inversión inicial", value: eurosPrecise(values.initialInvestment), tone: "warn" }
          ],
          tables: [
            {
              title: "Recuperacion descontada",
              headers: ["Periodo", "Flujo", "Flujo descontado", "Acumulado"],
              rows
            }
          ],
          insights: [
            paybackPeriod == null ? "Con estos flujos y esta tasa de descuento, el proyecto no recupera la inversión inicial en el horizonte definido." : "El payback descontado ya incorpora coste de oportunidad, por eso suele ser más largo que el payback simple.",
            `La tasa usada para descontar es ${pct(values.discountRate)}.`
          ]
        };
      }
    },
    "margen de seguridad (value investing)": {
      id: "margin-of-safety",
      title: "Margen de seguridad (value investing)",
      description: "Compara valor intrínseco y precio de mercado para estimar colchón de seguridad y upside potencial.",
      fields: [
        { name: "intrinsicValue", label: "Valor intrínseco por acción", default: 120, min: 0, step: 0.01 },
        { name: "marketPrice", label: "Precio de mercado", default: 84, min: 0, step: 0.01 },
        { name: "desiredMargin", label: "Margen objetivo (%)", default: 25, min: 0, step: 0.1 }
      ],
      compute(values) {
        const margin = values.intrinsicValue > 0 ? ((values.intrinsicValue - values.marketPrice) / values.intrinsicValue) * 100 : 0;
        const upside = values.marketPrice > 0 ? ((values.intrinsicValue / values.marketPrice) - 1) * 100 : 0;
        return {
          summary: [
            { label: "Margen de seguridad", value: pct(margin), tone: margin >= values.desiredMargin ? "ok" : "warn" },
            { label: "Upside teórico", value: pct(upside), tone: upside >= 0 ? "ok" : "bad" },
            { label: "Descuento vs objetivo", value: pct(margin - values.desiredMargin), tone: margin >= values.desiredMargin ? "ok" : "bad" }
          ],
          insights: [
            margin >= values.desiredMargin ? "El precio actual ofrece el colchón de seguridad exigido según tu criterio." : "El descuento actual todavía no alcanza el margen de seguridad objetivo.",
            `Valor intrínseco: ${eurosPrecise(values.intrinsicValue)} frente a precio de mercado ${eurosPrecise(values.marketPrice)}.`
          ]
        };
      }
    },
    "rebalanceo optimo segun pesos objetivo": {
      id: "optimal-rebalance",
      title: "Rebalanceo óptimo según pesos objetivo",
      description: "Calcula cuánto comprar o vender en cada bloque para acercar la cartera a sus pesos objetivo.",
      fields: [
        { name: "current1", label: "Valor actual activo 1", default: 18000, min: 0, step: 100 },
        { name: "target1", label: "Peso objetivo activo 1 (%)", default: 35, min: 0, step: 1 },
        { name: "current2", label: "Valor actual activo 2", default: 12000, min: 0, step: 100 },
        { name: "target2", label: "Peso objetivo activo 2 (%)", default: 25, min: 0, step: 1 },
        { name: "current3", label: "Valor actual activo 3", default: 9000, min: 0, step: 100 },
        { name: "target3", label: "Peso objetivo activo 3 (%)", default: 20, min: 0, step: 1 },
        { name: "current4", label: "Valor actual activo 4", default: 6000, min: 0, step: 100 },
        { name: "target4", label: "Peso objetivo activo 4 (%)", default: 20, min: 0, step: 1 }
      ],
      compute(values) {
        const currentValues = [values.current1, values.current2, values.current3, values.current4];
        const totalValue = sum(currentValues);
        const normalizedTargets = normalizeWeights([values.target1, values.target2, values.target3, values.target4]);
        const diffs = [];
        const rows = normalizedTargets.map((targetWeight, index) => {
          const targetAmount = totalValue * targetWeight;
          const diff = targetAmount - currentValues[index];
          diffs.push(diff);
          return [
            `Activo ${index + 1}`,
            eurosPrecise(currentValues[index]),
            pct(targetWeight * 100),
            eurosPrecise(targetAmount),
            diff >= 0 ? `Comprar ${eurosPrecise(diff)}` : `Vender ${eurosPrecise(Math.abs(diff))}`
          ];
        });
        return {
          summary: [
            { label: "Valor total cartera", value: eurosPrecise(totalValue), tone: "ok" },
            { label: "Pesos objetivo cargados", value: pct(values.target1 + values.target2 + values.target3 + values.target4), tone: values.target1 + values.target2 + values.target3 + values.target4 === 100 ? "ok" : "warn" },
            { label: "Mayor ajuste", value: eurosPrecise(Math.max(...diffs.map((diff) => Math.abs(diff)), 0)), tone: "warn" }
          ],
          tables: [
            {
              title: "Plan de rebalanceo",
              headers: ["Activo", "Actual", "Objetivo", "Valor objetivo", "Acción"],
              rows
            }
          ],
          insights: [
            values.target1 + values.target2 + values.target3 + values.target4 === 100 ? "Los pesos objetivo suman 100% y no requieren ajuste previo." : "Los pesos objetivo se han normalizado automáticamente para repartir el total de la cartera.",
            "El rebalanceo reduce desviaciones tácticas y mantiene el riesgo alineado con tu asignación deseada."
          ]
        };
      }
    },
    "análisis de sensibilidad (van/tir variando inputs)": {
      id: "sensitivity-analysis",
      title: "Análisis de sensibilidad (VAN/TIR variando inputs)",
      description: "Compara escenarios conservador, base y optimista variando flujos y tasa de descuento para ver su impacto en VAN y TIR.",
      fields: [
        { name: "initialInvestment", label: "Inversión inicial", default: 20000, min: 0, step: 100 },
        { name: "discountRate", label: "Tasa base de descuento (%)", default: 9, min: 0, step: 0.1 },
        { name: "flowVariation", label: "Variación de flujos (%)", default: 12, min: 0, step: 0.1 },
        { name: "discountVariation", label: "Variación de tasa (p.p.)", default: 1.5, min: 0, step: 0.1 },
        {
          name: "cashFlows",
          label: "Flujos base",
          type: "textarea",
          default: "7000, 8000, 8500, 9000",
          help: "Los flujos se ajustan automáticamente en los escenarios optimista y conservador."
        }
      ],
      compute(values) {
        const baseFlows = parseCashFlows(values.cashFlows);
        const scenarios = [
          {
            label: "Conservador",
            rate: values.discountRate + values.discountVariation,
            flows: baseFlows.map((flow) => flow * (1 - values.flowVariation / 100))
          },
          {
            label: "Base",
            rate: values.discountRate,
            flows: baseFlows
          },
          {
            label: "Optimista",
            rate: Math.max(values.discountRate - values.discountVariation, 0),
            flows: baseFlows.map((flow) => flow * (1 + values.flowVariation / 100))
          }
        ];

        const rows = scenarios.map((scenario) => {
          const scenarioNpv = npv(scenario.rate, values.initialInvestment, scenario.flows);
          const scenarioIrr = irr(values.initialInvestment, scenario.flows) * 100;
          return [scenario.label, pct(scenario.rate), eurosPrecise(scenarioNpv), pct(scenarioIrr)];
        });

        const baseRow = rows[1];
        return {
          summary: [
            { label: "VAN base", value: baseRow[2], tone: parseNumber(baseRow[2].replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(/,/g, "."), 0) >= 0 ? "ok" : "bad" },
            { label: "TIR base", value: baseRow[3], tone: "warn" },
            { label: "Escenarios", value: String(rows.length), tone: "ok" }
          ],
          tables: [
            {
              title: "Sensibilidad de resultados",
              headers: ["Escenario", "Tasa descuento", "VAN", "TIR"],
              rows
            }
          ],
          insights: [
            "El escenario conservador penaliza simultáneamente flujos y tasa de descuento para forzar una lectura más dura del proyecto.",
            "Si el VAN se vuelve negativo con pequeñas variaciones, la decisión es muy sensible a supuestos de entrada."
          ]
        };
      }
    },
    "punto de equilibrio (break-even)": {
      id: "break-even",
      title: "Punto de equilibrio (Break-even)",
      description: "Calcula cuántas unidades o ventas necesitas para cubrir todos los costes sin entrar en pérdidas.",
      fields: [
        { name: "fixedCosts", label: "Costes fijos", default: 18000, min: 0, step: 100 },
        { name: "pricePerUnit", label: "Precio por unidad", default: 75, min: 0, step: 0.01 },
        { name: "variableCostPerUnit", label: "Coste variable por unidad", default: 28, min: 0, step: 0.01 }
      ],
      compute(values) {
        const contribution = values.pricePerUnit - values.variableCostPerUnit;
        const units = contribution > 0 ? values.fixedCosts / contribution : 0;
        const revenue = units * values.pricePerUnit;
        return {
          summary: [
            { label: "Unidades de equilibrio", value: decimal(units, 2), tone: contribution > 0 ? "ok" : "bad" },
            { label: "Ventas necesarias", value: eurosPrecise(revenue), tone: contribution > 0 ? "warn" : "bad" },
            { label: "Margen de contribución", value: eurosPrecise(contribution), tone: contribution > 0 ? "ok" : "bad" }
          ],
          insights: [
            contribution > 0 ? `Cada unidad aporta ${eurosPrecise(contribution)} a cubrir costes fijos.` : "El precio unitario no cubre el coste variable, así que no existe punto de equilibrio operativo.",
            `A partir de ${decimal(units, 0)} unidades, las ventas empiezan a generar beneficio antes de impuestos.`
          ]
        };
      }
    },
    "unit economics (margen unitario, contribucion, etc.)": {
      id: "unit-economics",
      title: "Unit Economics (margen unitario, contribución, etc.)",
      description: "Evalúa la rentabilidad por unidad vendida y la contribución real al negocio.",
      fields: [
        { name: "pricePerUnit", label: "Precio por unidad", default: 49, min: 0, step: 0.01 },
        { name: "variableCostPerUnit", label: "Coste variable por unidad", default: 17, min: 0, step: 0.01 },
        { name: "fulfillmentCost", label: "Coste operativo por unidad", default: 6, min: 0, step: 0.01 },
        { name: "refundRate", label: "Tasa de devoluciones (%)", default: 4, min: 0, step: 0.1 }
      ],
      compute(values) {
        const refundImpact = values.pricePerUnit * (values.refundRate / 100);
        const totalUnitCost = values.variableCostPerUnit + values.fulfillmentCost + refundImpact;
        const unitMargin = values.pricePerUnit - totalUnitCost;
        const contributionMargin = values.pricePerUnit > 0 ? (unitMargin / values.pricePerUnit) * 100 : 0;
        return {
          summary: [
            { label: "Margen unitario", value: eurosPrecise(unitMargin), tone: unitMargin >= 0 ? "ok" : "bad" },
            { label: "Coste total por unidad", value: eurosPrecise(totalUnitCost), tone: "warn" },
            { label: "Contribución (%)", value: pct(contributionMargin), tone: contributionMargin >= 0 ? "ok" : "bad" }
          ],
          insights: [
            `Las devoluciones descuentan ${eurosPrecise(refundImpact)} por unidad en promedio.`,
            contributionMargin >= 30 ? "El margen de contribución es sano para escalar captación." : "El margen de contribución es estrecho y puede complicar escalado y adquisición."
          ]
        };
      }
    },
    "cac (coste de adquisición de cliente)": {
      id: "cac",
      title: "CAC (Coste de adquisición de cliente)",
      description: "Calcula cuánto cuesta adquirir cada nuevo cliente a partir del gasto comercial y de marketing.",
      fields: [
        { name: "marketingSpend", label: "Gasto en marketing", default: 12000, min: 0, step: 100 },
        { name: "salesSpend", label: "Gasto en ventas", default: 8000, min: 0, step: 100 },
        { name: "newCustomers", label: "Nuevos clientes", default: 180, min: 1, step: 1 }
      ],
      compute(values) {
        const totalSpend = values.marketingSpend + values.salesSpend;
        const cac = values.newCustomers > 0 ? totalSpend / values.newCustomers : 0;
        return {
          summary: [
            { label: "CAC", value: eurosPrecise(cac), tone: "warn" },
            { label: "Inversión total", value: eurosPrecise(totalSpend), tone: "warn" },
            { label: "Clientes captados", value: decimal(values.newCustomers, 0), tone: "ok" }
          ],
          insights: [
            `Cada nuevo cliente requiere ${eurosPrecise(cac)} de inversión comercial media.`,
            "El CAC debe leerse junto con margen bruto y LTV para validar sostenibilidad de crecimiento."
          ]
        };
      }
    },
    "ltv (lifetime value)": {
      id: "ltv",
      title: "LTV (Lifetime Value)",
      description: "Estima el valor económico esperado de un cliente durante toda su vida útil.",
      fields: [
        { name: "averageRevenuePerCustomer", label: "Ingreso medio por cliente", default: 65, min: 0, step: 0.01 },
        { name: "grossMarginPct", label: "Margen bruto (%)", default: 72, min: 0, step: 0.1 },
        { name: "purchaseFrequency", label: "Frecuencia anual de compra", default: 5, min: 0, step: 0.1 },
        { name: "customerLifespanYears", label: "Vida media cliente (años)", default: 3.5, min: 0, step: 0.1 }
      ],
      compute(values) {
        const annualGrossProfit = values.averageRevenuePerCustomer * values.purchaseFrequency * (values.grossMarginPct / 100);
        const ltv = annualGrossProfit * values.customerLifespanYears;
        return {
          summary: [
            { label: "LTV estimado", value: eurosPrecise(ltv), tone: "ok" },
            { label: "Beneficio bruto anual", value: eurosPrecise(annualGrossProfit), tone: "warn" },
            { label: "Vida media", value: `${decimal(values.customerLifespanYears, 1)} años`, tone: "ok" }
          ],
          insights: [
            `El cálculo supone ${decimal(values.purchaseFrequency, 1)} compras al año con margen bruto del ${pct(values.grossMarginPct)}.`,
            "Si el comportamiento del cliente cambia rápido, conviene recalibrar esta estimación con cohortes reales."
          ]
        };
      }
    },
    "ratio ltv/cac": {
      id: "ltv-cac-ratio",
      title: "Ratio LTV/CAC",
      description: "Compara el valor del cliente frente a su coste de adquisición para medir eficiencia de crecimiento.",
      fields: [
        { name: "ltv", label: "LTV", default: 680, min: 0, step: 0.01 },
        { name: "cac", label: "CAC", default: 140, min: 0.01, step: 0.01 }
      ],
      compute(values) {
        const ratio = values.cac > 0 ? values.ltv / values.cac : 0;
        return {
          summary: [
            { label: "Ratio LTV/CAC", value: decimal(ratio, 2), tone: ratio >= 3 ? "ok" : ratio >= 1 ? "warn" : "bad" },
            { label: "LTV", value: eurosPrecise(values.ltv), tone: "ok" },
            { label: "CAC", value: eurosPrecise(values.cac), tone: "warn" }
          ],
          insights: [
            ratio >= 3 ? "La relación sugiere una captación eficiente y escalable." : ratio >= 1 ? "La relación es viable pero ajustada; revisa monetización o adquisición." : "El coste de adquisición está destruyendo valor frente al LTV actual.",
            `Cada euro invertido en captar clientes devuelve ${decimal(ratio, 2)} euros de valor bruto estimado.`
          ]
        };
      }
    },
    "churn rate": {
      id: "churn-rate",
      title: "Churn rate",
      description: "Mide el porcentaje de clientes o suscriptores que abandonan en un periodo dado.",
      fields: [
        { name: "customersStart", label: "Clientes al inicio", default: 1250, min: 1, step: 1 },
        { name: "customersLost", label: "Clientes perdidos", default: 58, min: 0, step: 1 }
      ],
      compute(values) {
        const churn = values.customersStart > 0 ? (values.customersLost / values.customersStart) * 100 : 0;
        return {
          summary: [
            { label: "Churn rate", value: pct(churn), tone: churn <= 3 ? "ok" : churn <= 7 ? "warn" : "bad" },
            { label: "Clientes perdidos", value: decimal(values.customersLost, 0), tone: "warn" },
            { label: "Base inicial", value: decimal(values.customersStart, 0), tone: "ok" }
          ],
          insights: [
            `Se han perdido ${decimal(values.customersLost, 0)} clientes sobre una base de ${decimal(values.customersStart, 0)}.`,
            "Un churn alto suele encarecer el CAC efectivo y deteriorar el LTV esperado."
          ]
        };
      }
    },
    "retention rate": {
      id: "retention-rate",
      title: "Retention rate",
      description: "Calcula el porcentaje de clientes retenidos en un periodo y da una lectura rápida de estabilidad.",
      fields: [
        { name: "customersStart", label: "Clientes al inicio", default: 1250, min: 1, step: 1 },
        { name: "customersEnd", label: "Clientes al final", default: 1320, min: 0, step: 1 },
        { name: "newCustomers", label: "Nuevos clientes del periodo", default: 140, min: 0, step: 1 }
      ],
      compute(values) {
        const retained = Math.max(values.customersEnd - values.newCustomers, 0);
        const retention = values.customersStart > 0 ? (retained / values.customersStart) * 100 : 0;
        return {
          summary: [
            { label: "Retention rate", value: pct(retention), tone: retention >= 90 ? "ok" : retention >= 75 ? "warn" : "bad" },
            { label: "Clientes retenidos", value: decimal(retained, 0), tone: "ok" },
            { label: "Clientes nuevos", value: decimal(values.newCustomers, 0), tone: "warn" }
          ],
          insights: [
            `La retención neta parte de ${decimal(values.customersStart, 0)} clientes iniciales y descuenta la captación nueva.`,
            "La retención es la cara inversa del churn y suele ser el mejor indicador de calidad del producto o servicio."
          ]
        };
      }
    },
    "margenes: bruto, operativo y neto": {
      id: "business-margins",
      title: "Márgenes: bruto, operativo y neto",
      description: "Desglosa la rentabilidad del negocio en margen bruto, operativo y neto a partir de la cuenta de resultados.",
      fields: [
        { name: "revenue", label: "Ingresos", default: 250000, min: 0, step: 100 },
        { name: "cogs", label: "Coste de ventas", default: 95000, min: 0, step: 100 },
        { name: "operatingExpenses", label: "Gastos operativos", default: 78000, min: 0, step: 100 },
        { name: "netIncome", label: "Beneficio neto", default: 42000, min: -1000000000, step: 100 }
      ],
      compute(values) {
        const grossProfit = values.revenue - values.cogs;
        const operatingProfit = grossProfit - values.operatingExpenses;
        const grossMargin = values.revenue > 0 ? (grossProfit / values.revenue) * 100 : 0;
        const operatingMargin = values.revenue > 0 ? (operatingProfit / values.revenue) * 100 : 0;
        const netMargin = values.revenue > 0 ? (values.netIncome / values.revenue) * 100 : 0;
        return {
          summary: [
            { label: "Margen bruto", value: pct(grossMargin), tone: grossMargin >= 40 ? "ok" : "warn" },
            { label: "Margen operativo", value: pct(operatingMargin), tone: operatingMargin >= 15 ? "ok" : operatingMargin >= 5 ? "warn" : "bad" },
            { label: "Margen neto", value: pct(netMargin), tone: netMargin >= 10 ? "ok" : netMargin >= 0 ? "warn" : "bad" }
          ],
          insights: [
            `Beneficio bruto estimado: ${eurosPrecise(grossProfit)}.`,
            `Resultado operativo estimado: ${eurosPrecise(operatingProfit)}.`
          ]
        };
      }
    },
    "dcf simplificado (valor presente de flujos)": {
      id: "simplified-dcf",
      title: "DCF simplificado (valor presente de flujos)",
      description: "Descuenta una serie de flujos y un valor terminal para estimar el valor presente del negocio o proyecto.",
      fields: [
        { name: "discountRate", label: "Tasa de descuento (%)", default: 10, min: 0, step: 0.1 },
        { name: "terminalGrowth", label: "Crecimiento terminal (%)", default: 2, min: -100, step: 0.1 },
        {
          name: "cashFlows",
          label: "Flujos explícitos",
          type: "textarea",
          default: "12000, 14500, 16800, 19000, 21500",
          help: "Introduce flujos separados por comas o saltos de línea."
        }
      ],
      compute(values) {
        const cashFlows = parseCashFlows(values.cashFlows);
        const rate = values.discountRate / 100;
        const growth = values.terminalGrowth / 100;
        const presentFlows = cashFlows.map((flow, index) => flow / Math.pow(1 + rate, index + 1));
        const lastFlow = cashFlows[cashFlows.length - 1] || 0;
        const terminalValue = rate > growth ? (lastFlow * (1 + growth)) / (rate - growth) : 0;
        const discountedTerminal = terminalValue / Math.pow(1 + rate, cashFlows.length || 1);
        const dcfValue = sum(presentFlows) + discountedTerminal;
        return {
          summary: [
            { label: "Valor DCF", value: eurosPrecise(dcfValue), tone: "ok" },
            { label: "Valor terminal descontado", value: eurosPrecise(discountedTerminal), tone: terminalValue > 0 ? "warn" : "bad" },
            { label: "Horizonte explícito", value: `${cashFlows.length} años`, tone: "ok" }
          ],
          tables: [
            {
              title: "Flujos descontados",
              headers: ["Periodo", "Flujo", "Valor presente"],
              rows: cashFlows.map((flow, index) => [
                String(index + 1),
                eurosPrecise(flow),
                eurosPrecise(presentFlows[index])
              ])
            }
          ],
          insights: [
            terminalValue > 0 ? "El valor terminal representa una parte muy relevante del DCF; revisa con cuidado tasa y crecimiento perpetuo." : "Con estos supuestos no es posible calcular un valor terminal válido porque la tasa de descuento no supera al crecimiento perpetuo.",
            `La tasa de descuento es ${pct(values.discountRate)} y el crecimiento terminal ${pct(values.terminalGrowth)}.`
          ]
        };
      }
    },
    "elasticidad precio / análisis de pricing": {
      id: "pricing-elasticity",
      title: "Elasticidad precio / análisis de pricing",
      description: "Mide cómo cambia la demanda cuando cambias el precio y te ayuda a leer sensibilidad comercial.",
      fields: [
        { name: "initialPrice", label: "Precio inicial", default: 29, min: 0.01, step: 0.01 },
        { name: "newPrice", label: "Nuevo precio", default: 33, min: 0.01, step: 0.01 },
        { name: "initialDemand", label: "Demanda inicial", default: 2200, min: 1, step: 1 },
        { name: "newDemand", label: "Nueva demanda", default: 1980, min: 1, step: 1 }
      ],
      compute(values) {
        const avgPrice = (values.initialPrice + values.newPrice) / 2;
        const avgDemand = (values.initialDemand + values.newDemand) / 2;
        const pctPriceChange = avgPrice > 0 ? ((values.newPrice - values.initialPrice) / avgPrice) * 100 : 0;
        const pctDemandChange = avgDemand > 0 ? ((values.newDemand - values.initialDemand) / avgDemand) * 100 : 0;
        const elasticity = pctPriceChange !== 0 ? pctDemandChange / pctPriceChange : 0;
        const initialRevenue = values.initialPrice * values.initialDemand;
        const newRevenue = values.newPrice * values.newDemand;
        return {
          summary: [
            { label: "Elasticidad", value: decimal(elasticity, 2), tone: Math.abs(elasticity) < 1 ? "ok" : "warn" },
            { label: "Cambio en ingresos", value: eurosPrecise(newRevenue - initialRevenue), tone: newRevenue >= initialRevenue ? "ok" : "bad" },
            { label: "Cambio demanda", value: pct(pctDemandChange), tone: pctDemandChange >= 0 ? "ok" : "warn" }
          ],
          insights: [
            Math.abs(elasticity) < 1 ? "La demanda parece relativamente inelástica: el precio pesa menos que en mercados muy sensibles." : "La demanda parece elástica: pequeños cambios de precio afectan más a volumen.",
            `Los ingresos pasan de ${eurosPrecise(initialRevenue)} a ${eurosPrecise(newRevenue)} con el cambio de pricing.`
          ]
        };
      }
    },
    "rentabilidad bruta": {
      id: "gross-rental-yield",
      title: "Rentabilidad bruta",
      description: "Calcula la rentabilidad bruta anual de un inmueble en función del precio de compra y el alquiler anual.",
      fields: [
        { name: "purchasePrice", label: "Precio de compra", default: 180000, min: 0, step: 1000 },
        { name: "monthlyRent", label: "Alquiler mensual", default: 950, min: 0, step: 10 },
        { name: "occupancy", label: "Ocupación estimada (%)", default: 95, min: 0, step: 0.1 }
      ],
      compute(values) {
        const annualIncome = values.monthlyRent * 12 * (values.occupancy / 100);
        const yieldPct = values.purchasePrice > 0 ? (annualIncome / values.purchasePrice) * 100 : 0;
        return {
          summary: [
            { label: "Ingresos anuales", value: eurosPrecise(annualIncome), tone: "ok" },
            { label: "Rentabilidad bruta", value: pct(yieldPct), tone: yieldPct >= 6 ? "ok" : "warn" },
            { label: "Precio de compra", value: eurosPrecise(values.purchasePrice), tone: "warn" }
          ],
          insights: [
            `La ocupación ajusta el alquiler teórico a ${eurosPrecise(annualIncome)} al año.`,
            "La rentabilidad bruta no descuenta gastos operativos, impuestos ni financiación."
          ]
        };
      }
    },
    "rentabilidad neta": {
      id: "net-rental-yield",
      title: "Rentabilidad neta",
      description: "Descuenta gastos recurrentes del alquiler para medir la rentabilidad neta real del activo.",
      fields: [
        { name: "purchasePrice", label: "Precio de compra", default: 180000, min: 0, step: 1000 },
        { name: "monthlyRent", label: "Alquiler mensual", default: 950, min: 0, step: 10 },
        { name: "annualExpenses", label: "Gastos anuales", default: 3200, min: 0, step: 100 },
        { name: "occupancy", label: "Ocupación estimada (%)", default: 95, min: 0, step: 0.1 }
      ],
      compute(values) {
        const annualIncome = values.monthlyRent * 12 * (values.occupancy / 100);
        const netIncome = annualIncome - values.annualExpenses;
        const yieldPct = values.purchasePrice > 0 ? (netIncome / values.purchasePrice) * 100 : 0;
        return {
          summary: [
            { label: "Ingreso neto anual", value: eurosPrecise(netIncome), tone: netIncome >= 0 ? "ok" : "bad" },
            { label: "Rentabilidad neta", value: pct(yieldPct), tone: yieldPct >= 4 ? "ok" : "warn" },
            { label: "Gastos anuales", value: eurosPrecise(values.annualExpenses), tone: "warn" }
          ],
          insights: [
            `Los gastos reducen la rentabilidad desde el ingreso bruto hasta ${eurosPrecise(netIncome)} netos al año.`,
            "La rentabilidad neta es más útil que la bruta para comparar activos con gastos muy distintos."
          ]
        };
      }
    },
    "cap rate": {
      id: "cap-rate",
      title: "Cap rate",
      description: "Mide el retorno operativo del inmueble antes de financiación usando el NOI sobre valor del activo.",
      fields: [
        { name: "propertyValue", label: "Valor del inmueble", default: 200000, min: 0, step: 1000 },
        { name: "grossAnnualIncome", label: "Ingreso bruto anual", default: 12000, min: 0, step: 100 },
        { name: "operatingExpenses", label: "Gastos operativos anuales", default: 3000, min: 0, step: 100 }
      ],
      compute(values) {
        const noi = values.grossAnnualIncome - values.operatingExpenses;
        const capRate = values.propertyValue > 0 ? (noi / values.propertyValue) * 100 : 0;
        return {
          summary: [
            { label: "NOI", value: eurosPrecise(noi), tone: noi >= 0 ? "ok" : "bad" },
            { label: "Cap rate", value: pct(capRate), tone: capRate >= 5 ? "ok" : "warn" },
            { label: "Valor del activo", value: eurosPrecise(values.propertyValue), tone: "warn" }
          ],
          insights: [
            "El cap rate permite comparar inmuebles sin contaminar la lectura con hipoteca o apalancamiento.",
            `Con este NOI, cada ${eurosPrecise(100000)} invertidos generan ${eurosPrecise((capRate / 100) * 100000)} operativos al año.`
          ]
        };
      }
    },
    "cash-on-cash return": {
      id: "cash-on-cash",
      title: "Cash-on-cash return",
      description: "Calcula el retorno del flujo de caja anual sobre el efectivo realmente invertido en la operación.",
      fields: [
        { name: "annualCashFlow", label: "Flujo de caja anual", default: 4200, min: -1000000000, step: 100 },
        { name: "cashInvested", label: "Capital aportado", default: 45000, min: 0.01, step: 100 },
        { name: "closingCosts", label: "Costes de cierre", default: 5000, min: 0, step: 100 }
      ],
      compute(values) {
        const totalCash = values.cashInvested + values.closingCosts;
        const coc = totalCash > 0 ? (values.annualCashFlow / totalCash) * 100 : 0;
        return {
          summary: [
            { label: "Cash-on-cash", value: pct(coc), tone: coc >= 8 ? "ok" : coc >= 4 ? "warn" : "bad" },
            { label: "Caja total invertida", value: eurosPrecise(totalCash), tone: "warn" },
            { label: "Flujo anual", value: eurosPrecise(values.annualCashFlow), tone: values.annualCashFlow >= 0 ? "ok" : "bad" }
          ],
          insights: [
            "Este ratio mide retorno sobre tu dinero puesto de verdad, no sobre el valor completo del activo.",
            `Los costes de cierre elevan el capital real comprometido hasta ${eurosPrecise(totalCash)}.`
          ]
        };
      }
    },
    "flujo de caja mensual": {
      id: "monthly-cashflow-real-estate",
      title: "Flujo de caja mensual",
      description: "Calcula el flujo de caja mensual del inmueble descontando hipoteca, vacancia y gastos recurrentes.",
      fields: [
        { name: "monthlyRent", label: "Alquiler mensual", default: 950, min: 0, step: 10 },
        { name: "vacancyPct", label: "Vacancia (%)", default: 5, min: 0, step: 0.1 },
        { name: "monthlyMortgage", label: "Cuota hipotecaria", default: 620, min: 0, step: 10 },
        { name: "monthlyExpenses", label: "Gastos mensuales", default: 140, min: 0, step: 10 }
      ],
      compute(values) {
        const effectiveRent = values.monthlyRent * (1 - values.vacancyPct / 100);
        const cashFlow = effectiveRent - values.monthlyMortgage - values.monthlyExpenses;
        const cfLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const cfValues = cfLabels.map(() => cashFlow);
        return {
          summary: [
            { label: "Alquiler efectivo", value: eurosPrecise(effectiveRent), tone: "ok" },
            { label: "Flujo mensual", value: eurosPrecise(cashFlow), tone: cashFlow >= 0 ? "ok" : "bad" },
            { label: "Flujo anualizado", value: eurosPrecise(cashFlow * 12), tone: cashFlow >= 0 ? "ok" : "bad" }
          ],
          insights: [
            `La vacancia descuenta ${eurosPrecise(values.monthlyRent - effectiveRent)} al mes del alquiler potencial.`,
            cashFlow >= 0 ? "La propiedad genera caja positiva con los supuestos actuales." : "La propiedad quema caja mensualmente con los supuestos actuales."
          ],
          datasets: {
            cashflowHistory: safeDataset(cfLabels, "Cashflow mensual", cfValues)
          }
        };
      }
    },
    "roi inmobiliario con impuestos": {
      id: "real-estate-roi-tax",
      title: "ROI inmobiliario con impuestos",
      description: "Calcula la rentabilidad total de una operación inmobiliaria descontando impuestos sobre plusvalía y flujos netos.",
      fields: [
        { name: "cashInvested", label: "Capital invertido", default: 50000, min: 0.01, step: 100 },
        { name: "purchasePrice", label: "Precio de compra", default: 180000, min: 0, step: 1000 },
        { name: "salePrice", label: "Precio de venta", default: 220000, min: 0, step: 1000 },
        { name: "netRentalCashFlow", label: "Flujos netos acumulados", default: 18000, min: -1000000000, step: 100 },
        { name: "taxRate", label: "Impuestos sobre plusvalía (%)", default: 19, min: 0, step: 0.1 }
      ],
      compute(values) {
        const capitalGain = values.salePrice - values.purchasePrice;
        const taxes = capitalGain > 0 ? capitalGain * (values.taxRate / 100) : 0;
        const netProfit = capitalGain - taxes + values.netRentalCashFlow;
        const roiPct = values.cashInvested > 0 ? (netProfit / values.cashInvested) * 100 : 0;
        const years = 5;
        const roiLabels = [];
        const roiValues = [];
        for (let year = 1; year <= years; year += 1) {
          roiLabels.push(`Año ${year}`);
          roiValues.push((roiPct / years) * year);
        }
        return {
          summary: [
            { label: "Beneficio neto", value: eurosPrecise(netProfit), tone: netProfit >= 0 ? "ok" : "bad" },
            { label: "ROI sobre capital", value: pct(roiPct), tone: roiPct >= 0 ? "ok" : "bad" },
            { label: "Impuestos estimados", value: eurosPrecise(taxes), tone: taxes > 0 ? "warn" : "ok" }
          ],
          insights: [
            `La plusvalía bruta asciende a ${eurosPrecise(capitalGain)} antes de impuestos.`,
            "Este cálculo mezcla ganancia de venta y caja de explotación para una lectura más completa de la operación."
          ],
          datasets: {
            roiByYear: safeDataset(roiLabels, "ROI acumulado (%)", roiValues)
          }
        };
      }
    },
    "irr inmobiliaria (iterativa pero aceptada como calculadora)": {
      id: "real-estate-irr",
      title: "IRR inmobiliaria (iterativa pero aceptada como calculadora)",
      description: "Estima la TIR de una inversión inmobiliaria combinando desembolso inicial, flujos anuales y venta final.",
      fields: [
        { name: "initialInvestment", label: "Desembolso inicial", default: 50000, min: 0.01, step: 100 },
        {
          name: "annualCashFlows",
          label: "Flujos anuales",
          type: "textarea",
          default: "2500, 2800, 3000, 3200, 3500",
          help: "Introduce flujos anuales netos separados por comas o saltos de línea."
        },
        { name: "saleNetProceeds", label: "Cobro neto final por venta", default: 90000, min: 0, step: 1000 }
      ],
      compute(values) {
        const annualFlows = parseCashFlows(values.annualCashFlows);
        const flows = annualFlows.length ? [...annualFlows] : [0];
        flows[flows.length - 1] += values.saleNetProceeds;
        const irrValue = irr(values.initialInvestment, flows) * 100;
        const cumulative = [];
        let running = 0;
        for (let i = 0; i < flows.length; i += 1) {
          running += flows[i];
          cumulative.push(values.initialInvestment > 0 ? (running / values.initialInvestment) * 100 : 0);
        }
        return {
          summary: [
            { label: "IRR estimada", value: pct(irrValue), tone: irrValue >= 0 ? "ok" : "bad" },
            { label: "Flujos cargados", value: String(flows.length), tone: "warn" },
            { label: "Venta neta final", value: eurosPrecise(values.saleNetProceeds), tone: "ok" }
          ],
          tables: [
            {
              title: "Flujos de la operación",
              headers: ["Periodo", "Flujo neto"],
              rows: flows.map((flow, index) => [String(index + 1), eurosPrecise(flow)])
            }
          ],
          insights: [
            "La TIR inmobiliaria integra tanto explotación como salida final del activo.",
            `El último periodo incorpora la venta neta del inmueble junto al flujo operativo del año.`
          ],
          datasets: {
            roiByYear: safeDataset(
              flows.map((_flow, index) => `Año ${index + 1}`),
              "Retorno acumulado (%)",
              cumulative
            )
          }
        };
      }
    },
    "compra vs alquiler (version simple basada en coste anual)": {
      id: "buy-vs-rent",
      title: "Compra vs alquiler (versión simple basada en coste anual)",
      description: "Compara el coste anual estimado de comprar una vivienda frente a alquilarla usando una versión simple.",
      fields: [
        { name: "annualRent", label: "Coste anual de alquiler", default: 13200, min: 0, step: 100 },
        { name: "annualMortgage", label: "Cuotas anuales de compra", default: 9600, min: 0, step: 100 },
        { name: "annualOwnershipCosts", label: "Gastos anuales de propiedad", default: 2600, min: 0, step: 100 },
        { name: "opportunityCost", label: "Coste de oportunidad anual del capital", default: 1800, min: 0, step: 100 }
      ],
      compute(values) {
        const annualBuyCost = values.annualMortgage + values.annualOwnershipCosts + values.opportunityCost;
        const difference = values.annualRent - annualBuyCost;
        return {
          summary: [
            { label: "Coste anual alquilar", value: eurosPrecise(values.annualRent), tone: "warn" },
            { label: "Coste anual comprar", value: eurosPrecise(annualBuyCost), tone: "warn" },
            { label: "Diferencia", value: eurosPrecise(difference), tone: difference >= 0 ? "ok" : "bad" }
          ],
          insights: [
            difference >= 0 ? "Comprar sale más barato en esta versión simple basada en coste anual." : "Alquilar sale más barato en esta versión simple basada en coste anual.",
            "Esta lectura no incorpora apreciación del activo ni ventajas fiscales complejas; sirve como filtro rápido."
          ],
          datasets: {
            cashflowHistory: safeDataset(
              ["Comprar", "Alquilar"],
              "Coste anual comparado",
              [annualBuyCost, values.annualRent]
            )
          }
        };
      }
    },
    "impacto de impuestos en inversiones": {
      id: "investment-tax-impact",
      title: "Impacto de impuestos en inversiones",
      description: "Mide cómo los impuestos reducen la ganancia bruta y la rentabilidad final de una inversión.",
      fields: [
        { name: "initialInvestment", label: "Inversión inicial", default: 15000, min: 0.01, step: 100 },
        { name: "finalValue", label: "Valor final antes de impuestos", default: 21000, min: 0, step: 100 },
        { name: "taxRate", label: "Tipo impositivo sobre ganancias (%)", default: 19, min: 0, step: 0.1 },
        { name: "years", label: "Duración (años)", default: 4, min: 0.1, step: 0.1 }
      ],
      compute(values) {
        const grossGain = values.finalValue - values.initialInvestment;
        const taxes = grossGain > 0 ? grossGain * (values.taxRate / 100) : 0;
        const netValue = values.finalValue - taxes;
        const grossReturn = values.initialInvestment > 0 ? (grossGain / values.initialInvestment) * 100 : 0;
        const netGain = netValue - values.initialInvestment;
        const netReturn = values.initialInvestment > 0 ? (netGain / values.initialInvestment) * 100 : 0;
        const netCagr = values.initialInvestment > 0 && values.years > 0 ? (Math.pow(netValue / values.initialInvestment, 1 / values.years) - 1) * 100 : 0;
        return {
          summary: [
            { label: "Ganancia bruta", value: eurosPrecise(grossGain), tone: grossGain >= 0 ? "ok" : "bad" },
            { label: "Impuestos estimados", value: eurosPrecise(taxes), tone: taxes > 0 ? "warn" : "ok" },
            { label: "Rentabilidad neta", value: pct(netReturn), tone: netReturn >= 0 ? "ok" : "bad" }
          ],
          insights: [
            `La rentabilidad bruta es ${pct(grossReturn)} y cae a ${pct(netReturn)} tras impuestos.`,
            `El valor final neto sería ${eurosPrecise(netValue)} con un CAGR neto aproximado del ${pct(netCagr)}.`
          ]
        };
      }
    },
    "cagr del patrimonio": {
      id: "net-worth-cagr",
      title: "CAGR del patrimonio",
      description: "Calcula el crecimiento anual compuesto del patrimonio para medir la evolución real de riqueza en el tiempo.",
      fields: [
        { name: "initialNetWorth", label: "Patrimonio inicial", default: 45000, min: 0.01, step: 100 },
        { name: "finalNetWorth", label: "Patrimonio final", default: 98000, min: 0, step: 100 },
        { name: "years", label: "Periodo (años)", default: 5, min: 0.1, step: 0.1 }
      ],
      compute(values) {
        const cagr = values.initialNetWorth > 0 && values.years > 0
          ? (Math.pow(values.finalNetWorth / values.initialNetWorth, 1 / values.years) - 1) * 100
          : 0;
        const absoluteGrowth = values.finalNetWorth - values.initialNetWorth;
        const multiple = values.initialNetWorth > 0 ? values.finalNetWorth / values.initialNetWorth : 0;
        return {
          summary: [
            { label: "CAGR del patrimonio", value: pct(cagr), tone: cagr >= 0 ? "ok" : "bad" },
            { label: "Crecimiento absoluto", value: eurosPrecise(absoluteGrowth), tone: absoluteGrowth >= 0 ? "ok" : "bad" },
            { label: "Multiplicador", value: `${decimal(multiple, 2)}x`, tone: multiple >= 1 ? "ok" : "bad" }
          ],
          insights: [
            `El patrimonio pasa de ${eurosPrecise(values.initialNetWorth)} a ${eurosPrecise(values.finalNetWorth)} en ${decimal(values.years, 1)} años.`,
            "El CAGR permite comparar trayectorias patrimoniales de distinta duración con una misma referencia anualizada."
          ]
        };
      }
    }
  };

  /* ── Inversión: calculadoras específicas por activo ────────────── */
  Object.assign(calculatorDefinitions, {
    "inversion::acciones": {
      id: "inv-stocks",
      title: "Análisis de acciones",
      description: "Calcula rentabilidad total, anualizada, dividendos y control de riesgo por stop-loss.",
      fields: [
        { name: "buyPrice", label: "Precio de compra (€)", default: 42, min: 0, step: 0.01 },
        { name: "currentPrice", label: "Precio actual (€)", default: 58, min: 0, step: 0.01 },
        { name: "shares", label: "Número de acciones", default: 100, min: 1, step: 1 },
        { name: "dividendYield", label: "Dividendo anual (%)", default: 2.5, min: 0, step: 0.1 },
        { name: "years", label: "Años en cartera", default: 3, min: 0.1, step: 0.5 },
        { name: "stopLoss", label: "Stop-loss objetivo (%)", default: 15, min: 1, max: 100, step: 1 }
      ],
      compute(values) {
        const invested = values.buyPrice * values.shares;
        const current = values.currentPrice * values.shares;
        const capitalGain = current - invested;
        const totalReturn = invested > 0 ? (capitalGain / invested) * 100 : 0;
        const annualReturn = values.years > 0 && invested > 0
          ? (Math.pow(current / invested, 1 / values.years) - 1) * 100
          : 0;
        const dividendsReceived = invested * (values.dividendYield / 100) * values.years;
        const totalWithDiv = capitalGain + dividendsReceived;
        const stopLossPrice = values.currentPrice * (1 - values.stopLoss / 100);
        const maxLoss = (stopLossPrice - values.currentPrice) * values.shares;

        return {
          summary: [
            { label: "Rentabilidad total", value: pct(totalReturn), tone: totalReturn >= 0 ? "ok" : "bad" },
            { label: "Rentabilidad anualizada", value: pct(annualReturn), tone: annualReturn >= 0 ? "ok" : "bad" },
            { label: "P&L total (cap + div)", value: eurosPrecise(totalWithDiv), tone: totalWithDiv >= 0 ? "ok" : "bad" }
          ],
          tables: [{
            title: "Desglose de rentabilidad",
            headers: ["Concepto", "Importe"],
            rows: [
              ["Capital invertido", eurosPrecise(invested)],
              ["Valor actual", eurosPrecise(current)],
              ["Plusvalía latente", eurosPrecise(capitalGain)],
              ["Dividendos recibidos", eurosPrecise(dividendsReceived)],
              ["Stop-loss -> precio", eurosPrecise(stopLossPrice)],
              ["Pérdida máxima (stop)", eurosPrecise(maxLoss)]
            ]
          }],
          chartData: [
            {
              id: "chart-stocks-bar-" + Date.now(),
              type: "bar",
              title: "Capital invertido vs valor actual vs stop-loss",
              labels: ["Capital invertido", "Valor actual", "Stop-loss"],
              values: [invested, current, stopLossPrice * values.shares],
              datasetLabel: "Importe (€)"
            },
            {
              id: "chart-stocks-ohlc-" + (Date.now() + 1),
              type: "bar",
              title: "Vela sintética: compra / stop / actual",
              labels: ["Compra", "Stop", "Actual"],
              values: [values.buyPrice, stopLossPrice, values.currentPrice],
              datasetLabel: "Precio por acción (€)"
            }
          ],
          insights: [
            totalReturn >= 0
              ? `Plusvalía latente de ${pct(totalReturn)} en ${decimal(values.years, 1)} años (${pct(annualReturn)} anualizada).`
              : `Posición en pérdidas: ${pct(totalReturn)}. Revisa la tesis de inversión.`,
            `Stop-loss al ${pct(values.stopLoss)} limita la pérdida aproximada a ${eurosPrecise(Math.abs(maxLoss))}.`
          ]
        };
      }
    },

    "inversion::etfs": {
      id: "inv-etf",
      title: "Análisis de ETFs",
      description: "Evalúa coste por TER y resultado neto con aportaciones periódicas.",
      fields: [
        { name: "capital", label: "Capital inicial (€)", default: 10000, min: 0, step: 100 },
        { name: "monthly", label: "Aportación mensual (€)", default: 250, min: 0, step: 10 },
        { name: "annualReturn", label: "Retorno esperado anual (%)", default: 8, min: 0, step: 0.1 },
        { name: "ter", label: "TER anual (%)", default: 0.2, min: 0, max: 5, step: 0.01 },
        { name: "trackingError", label: "Tracking error anual (%)", default: 0.15, min: 0, step: 0.01 },
        { name: "years", label: "Horizonte (años)", default: 15, min: 1, step: 1 }
      ],
      compute(values) {
        const netReturn = Math.max(values.annualReturn - values.ter, 0);
        const months = Math.round(values.years * 12);
        const projected = futureValueWithMonthlyContributions(values.capital, values.monthly, netReturn, values.years);
        const projectedGross = futureValueWithMonthlyContributions(values.capital, values.monthly, values.annualReturn, values.years);
        const terDrag = projectedGross - projected;
        const totalContrib = values.capital + values.monthly * months;
        const gain = projected - totalContrib;

        return {
          summary: [
            { label: "Capital proyectado", value: eurosPrecise(projected), tone: "ok" },
            { label: "Coste TER acumulado", value: eurosPrecise(terDrag), tone: "warn" },
            { label: "Ganancia neta", value: eurosPrecise(gain), tone: gain >= 0 ? "ok" : "bad" }
          ],
          tables: [{
            title: "Comparativa bruto vs neto",
            headers: ["Escenario", "Capital final", "Diferencia vs neto"],
            rows: [
              ["Sin TER (bruto)", eurosPrecise(projectedGross), "+" + eurosPrecise(terDrag)],
              ["Con TER (neto)", eurosPrecise(projected), "-"],
              ["Solo capital inicial", eurosPrecise(compoundGrowth(values.capital, netReturn, values.years, 1)), "-" + eurosPrecise(values.monthly * months)]
            ]
          }],
          chartData: [{
            id: "chart-etf-" + Date.now(),
            type: "bar",
            title: "Capital final: bruto vs neto vs sin aportes",
            labels: ["Bruto", "Neto", "Sin aportes"],
            values: [projectedGross, projected, compoundGrowth(values.capital, netReturn, values.years, 1)],
            datasetLabel: "Capital final (€)"
          }],
          insights: [
            `TER de ${pct(values.ter)} reduce aproximadamente ${eurosPrecise(terDrag)} en ${values.years} años.`,
            `Tracking error ${pct(values.trackingError)}: controla la desviación frente al índice de referencia.`
          ]
        };
      }
    },

    "inversion::fondos indexados": {
      id: "inv-index-fund",
      title: "Fondos indexados",
      description: "Compara indexación contra gestión activa por impacto de comisiones.",
      fields: [
        { name: "capital", label: "Capital inicial (€)", default: 5000, min: 0, step: 100 },
        { name: "monthly", label: "Aportación mensual (€)", default: 300, min: 0, step: 10 },
        { name: "indexReturn", label: "Retorno índice esperado (%)", default: 7.5, min: 0, step: 0.1 },
        { name: "indexTer", label: "TER fondo índice (%)", default: 0.15, min: 0, step: 0.01 },
        { name: "activeTer", label: "TER gestión activa (%)", default: 1.65, min: 0, step: 0.01 },
        { name: "years", label: "Horizonte (años)", default: 20, min: 1, step: 1 }
      ],
      compute(values) {
        const indexNet = Math.max(values.indexReturn - values.indexTer, 0);
        const activeNet = Math.max(values.indexReturn - values.activeTer, 0);
        const projIndex = futureValueWithMonthlyContributions(values.capital, values.monthly, indexNet, values.years);
        const projActive = futureValueWithMonthlyContributions(values.capital, values.monthly, activeNet, values.years);
        const advantage = projIndex - projActive;
        const totalIn = values.capital + values.monthly * Math.round(values.years * 12);

        return {
          summary: [
            { label: "Capital con fondo índice", value: eurosPrecise(projIndex), tone: "ok" },
            { label: "Capital con gestión activa", value: eurosPrecise(projActive), tone: "warn" },
            { label: "Ventaja del índice", value: eurosPrecise(advantage), tone: advantage >= 0 ? "ok" : "bad" }
          ],
          tables: [{
            title: "Índice vs activa",
            headers: ["Estrategia", "TER", "Capital final", "Ganancia neta"],
            rows: [
              ["Fondo índice", pct(values.indexTer), eurosPrecise(projIndex), eurosPrecise(projIndex - totalIn)],
              ["Gestión activa", pct(values.activeTer), eurosPrecise(projActive), eurosPrecise(projActive - totalIn)]
            ]
          }],
          chartData: [{
            id: "chart-indexfund-" + Date.now(),
            type: "bar",
            title: "Capital final: indexado vs activo",
            labels: ["Fondo índice", "Gestión activa"],
            values: [projIndex, projActive],
            datasetLabel: "Capital final (€)"
          }],
          insights: [
            `La indexación supera a la gestión activa en ${eurosPrecise(advantage)} a ${values.years} años.`,
            "A largo plazo, la diferencia de TER tiene un impacto relevante en el capital final."
          ]
        };
      }
    },

    "inversion::cartera diversificada": {
      id: "inv-diversified",
      title: "Cartera diversificada",
      description: "Calcula pesos reales y retorno ponderado esperado por bloques de activo.",
      fields: [
        { name: "eq", label: "Renta variable (€)", default: 30000, min: 0, step: 100 },
        { name: "eqR", label: "Retorno RV esperado (%)", default: 8.5, min: 0, step: 0.1 },
        { name: "fi", label: "Renta fija (€)", default: 12000, min: 0, step: 100 },
        { name: "fiR", label: "Retorno RF esperado (%)", default: 3.2, min: 0, step: 0.1 },
        { name: "re", label: "Inmobiliario (€)", default: 8000, min: 0, step: 100 },
        { name: "reR", label: "Retorno RE esperado (%)", default: 5.5, min: 0, step: 0.1 },
        { name: "liq", label: "Liquidez (€)", default: 5000, min: 0, step: 100 },
        { name: "years", label: "Horizonte (años)", default: 10, min: 1, step: 1 }
      ],
      compute(values) {
        const total = values.eq + values.fi + values.re + values.liq;
        if (total <= 0) {
          return { summary: [{ label: "Error", value: "Capital total = 0", tone: "bad" }], insights: ["Introduce al menos un activo con valor > 0."] };
        }

        const wEq = values.eq / total;
        const wFi = values.fi / total;
        const wRe = values.re / total;
        const wLiq = values.liq / total;
        const portfolioReturn = wEq * values.eqR + wFi * values.fiR + wRe * values.reR;
        const projected = compoundGrowth(total, portfolioReturn, values.years, 1);

        return {
          summary: [
            { label: "Patrimonio invertido", value: eurosPrecise(total), tone: "ok" },
            { label: "Retorno ponderado", value: pct(portfolioReturn), tone: portfolioReturn >= 4 ? "ok" : "warn" },
            { label: "Capital proyectado", value: eurosPrecise(projected), tone: "ok" }
          ],
          tables: [{
            title: "Composición de cartera",
            headers: ["Bloque", "Importe", "Peso", "Retorno", "Contribución"],
            rows: [
              ["Renta variable", eurosPrecise(values.eq), pct(wEq * 100), pct(values.eqR), pct(wEq * values.eqR)],
              ["Renta fija", eurosPrecise(values.fi), pct(wFi * 100), pct(values.fiR), pct(wFi * values.fiR)],
              ["Inmobiliario", eurosPrecise(values.re), pct(wRe * 100), pct(values.reR), pct(wRe * values.reR)],
              ["Liquidez", eurosPrecise(values.liq), pct(wLiq * 100), "-", "-"]
            ]
          }],
          chartData: [{
            id: "chart-portfolio-" + Date.now(),
            type: "bar",
            title: "Distribución de cartera por bloque",
            labels: ["Renta variable", "Renta fija", "Inmobiliario", "Liquidez"],
            values: [values.eq, values.fi, values.re, values.liq],
            datasetLabel: "Importe (€)"
          }],
          insights: [
            `Retorno ponderado esperado: ${pct(portfolioReturn)}; capital proyectado en ${values.years} años: ${eurosPrecise(projected)}.`,
            wLiq > 0.3 ? "Liquidez > 30%: considera reducirla para mejorar retorno esperado." : "Distribución razonable entre crecimiento y liquidez."
          ]
        };
      }
    },

    "inversion::rebalanceo automatico": {
      id: "inv-rebalance-auto",
      title: "Rebalanceo automático",
      description: "Detecta desviaciones frente a pesos objetivo y propone compras/ventas por bloque.",
      fields: [
        { name: "curr1", label: "Valor actual bloque 1 (€)", default: 28000, min: 0, step: 100 },
        { name: "tgt1", label: "Peso objetivo bloque 1 (%)", default: 50, min: 0, step: 1 },
        { name: "curr2", label: "Valor actual bloque 2 (€)", default: 9000, min: 0, step: 100 },
        { name: "tgt2", label: "Peso objetivo bloque 2 (%)", default: 25, min: 0, step: 1 },
        { name: "curr3", label: "Valor actual bloque 3 (€)", default: 7000, min: 0, step: 100 },
        { name: "tgt3", label: "Peso objetivo bloque 3 (%)", default: 15, min: 0, step: 1 },
        { name: "curr4", label: "Valor actual bloque 4 (€)", default: 6000, min: 0, step: 100 },
        { name: "tgt4", label: "Peso objetivo bloque 4 (%)", default: 10, min: 0, step: 1 }
      ],
      compute(values) {
        const currents = [values.curr1, values.curr2, values.curr3, values.curr4];
        const targets = normalizeWeights([values.tgt1, values.tgt2, values.tgt3, values.tgt4]);
        const total = sum(currents);
        let maxDev = 0;

        const rows = currents.map((c, i) => {
          const currW = total > 0 ? (c / total) * 100 : 0;
          const tgtW = targets[i] * 100;
          const dev = currW - tgtW;
          const tgtAmt = total * targets[i];
          const action = tgtAmt - c;
          maxDev = Math.max(maxDev, Math.abs(dev));
          return [
            `Bloque ${i + 1}`,
            pct(currW),
            pct(tgtW),
            pct(dev),
            action >= 0 ? `Comprar ${eurosPrecise(action, 0)}` : `Vender ${eurosPrecise(Math.abs(action), 0)}`
          ];
        });

        const balanced = maxDev < 3;
        return {
          summary: [
            { label: "Valor total cartera", value: eurosPrecise(total), tone: "ok" },
            { label: "Desviación máxima", value: pct(maxDev), tone: balanced ? "ok" : maxDev < 8 ? "warn" : "bad" },
            { label: "Estado de cartera", value: balanced ? "Equilibrada" : "Requiere ajuste", tone: balanced ? "ok" : "warn" }
          ],
          tables: [{
            title: "Plan de rebalanceo",
            headers: ["Bloque", "Peso actual", "Peso objetivo", "Desviación", "Acción"],
            rows
          }],
          chartData: [{
            id: "chart-rebalance-" + Date.now(),
            type: "bar",
            title: "Peso actual por bloque",
            labels: ["Bloque 1", "Bloque 2", "Bloque 3", "Bloque 4"],
            values: currents.map((c) => (total > 0 ? Number(((c / total) * 100).toFixed(2)) : 0)),
            datasetLabel: "Peso actual (%)"
          }],
          insights: [
            balanced
              ? "La cartera está dentro del umbral ±3%; no requiere rebalanceo urgente."
              : `Desviación de ${pct(maxDev)} detectada; conviene rebalancear para mantener el perfil de riesgo.`,
            "Rebalancear de forma periódica ayuda a evitar deriva de riesgo en el tiempo."
          ]
        };
      }
    },

    "inversion::analisis de correlacion entre activos": {
      id: "inv-correlation",
      title: "Análisis de correlación entre activos",
      description: "Estima retorno, volatilidad y beneficio de diversificación de una cartera multiactivo.",
      fields: [
        { name: "ret1", label: "Retorno anual activo 1 (%)", default: 8.5, step: 0.1 },
        { name: "vol1", label: "Volatilidad activo 1 (%)", default: 18, step: 0.1, min: 0 },
        { name: "w1", label: "Peso activo 1 (%)", default: 40, step: 1, min: 0 },
        { name: "ret2", label: "Retorno anual activo 2 (%)", default: 3.2, step: 0.1 },
        { name: "vol2", label: "Volatilidad activo 2 (%)", default: 6, step: 0.1, min: 0 },
        { name: "w2", label: "Peso activo 2 (%)", default: 30, step: 1, min: 0 },
        { name: "ret3", label: "Retorno anual activo 3 (%)", default: 5.5, step: 0.1 },
        { name: "vol3", label: "Volatilidad activo 3 (%)", default: 12, step: 0.1, min: 0 },
        { name: "w3", label: "Peso activo 3 (%)", default: 20, step: 1, min: 0 },
        { name: "ret4", label: "Retorno anual activo 4 (%)", default: 1.5, step: 0.1 },
        { name: "vol4", label: "Volatilidad activo 4 (%)", default: 1, step: 0.1, min: 0 },
        { name: "w4", label: "Peso activo 4 (%)", default: 10, step: 1, min: 0 }
      ],
      compute(values) {
        const ws = normalizeWeights([values.w1, values.w2, values.w3, values.w4]);
        const rets = [values.ret1, values.ret2, values.ret3, values.ret4];
        const vols = [values.vol1, values.vol2, values.vol3, values.vol4];
        const portReturn = ws.reduce((s, w, i) => s + w * rets[i], 0);
        const wVolSumSq = ws.reduce((s, w, i) => s + Math.pow(w * vols[i], 2), 0);
        const portVolFullCorr = Math.sqrt(
          wVolSumSq +
          2 * ws[0] * ws[1] * vols[0] * vols[1] * 0.4 +
          2 * ws[0] * ws[2] * vols[0] * vols[2] * 0.25 +
          2 * ws[0] * ws[3] * vols[0] * vols[3] * 0.05 +
          2 * ws[1] * ws[2] * vols[1] * vols[2] * 0.3 +
          2 * ws[1] * ws[3] * vols[1] * vols[3] * 0.1 +
          2 * ws[2] * ws[3] * vols[2] * vols[3] * 0.15
        );
        const portVolNocorr = Math.sqrt(wVolSumSq);
        const diversBenefit = portVolNocorr - portVolFullCorr;
        const sharpe = portVolFullCorr > 0 ? (portReturn - 2) / portVolFullCorr : 0;

        return {
          summary: [
            { label: "Retorno ponderado", value: pct(portReturn), tone: portReturn >= 4 ? "ok" : "warn" },
            { label: "Volatilidad cartera", value: pct(portVolFullCorr), tone: portVolFullCorr <= 12 ? "ok" : portVolFullCorr <= 20 ? "warn" : "bad" },
            { label: "Ratio Sharpe estimado", value: decimal(sharpe, 2), tone: sharpe >= 0.5 ? "ok" : sharpe >= 0.2 ? "warn" : "bad" }
          ],
          tables: [{
            title: "Perfil de activos",
            headers: ["Activo", "Peso", "Retorno", "Volatilidad", "Contribución riesgo"],
            rows: [
              ["Activo 1", pct(ws[0] * 100), pct(rets[0]), pct(vols[0]), pct(ws[0] * vols[0])],
              ["Activo 2", pct(ws[1] * 100), pct(rets[1]), pct(vols[1]), pct(ws[1] * vols[1])],
              ["Activo 3", pct(ws[2] * 100), pct(rets[2]), pct(vols[2]), pct(ws[2] * vols[2])],
              ["Activo 4", pct(ws[3] * 100), pct(rets[3]), pct(vols[3]), pct(ws[3] * vols[3])]
            ]
          }],
          chartData: [
            {
              id: "chart-corr-ret-" + Date.now(),
              type: "bar",
              title: "Retorno esperado por activo",
              labels: ["Activo 1", "Activo 2", "Activo 3", "Activo 4"],
              values: rets,
              datasetLabel: "Retorno anual (%)"
            },
            {
              id: "chart-corr-vol-" + (Date.now() + 1),
              type: "bar",
              title: "Volatilidad por activo vs cartera",
              labels: ["Activo 1", "Activo 2", "Activo 3", "Activo 4", "Cartera"],
              values: vols.concat([portVolFullCorr]),
              datasetLabel: "Volatilidad (%)"
            }
          ],
          insights: [
            `Volatilidad cartera con correlaciones: ${pct(portVolFullCorr)}; sin correlaciones: ${pct(portVolNocorr)}.`,
            `Beneficio de diversificación aproximado: ${decimal(Math.max(diversBenefit, 0), 1)} pp de volatilidad.`
          ]
        };
      }
    }
  });

  function cloneDefinition(baseDefinition, overrides) {
    return {
      ...baseDefinition,
      ...overrides,
      fields: overrides.fields || baseDefinition.fields,
      compute: overrides.compute || baseDefinition.compute
    };
  }

  Object.assign(calculatorDefinitions, {
    "simuladores::finanzas e inversion::inversion": cloneDefinition(calculatorDefinitions["calculadora de interés compuesto"], {
      id: "sim-investment",
      title: "Simulador de inversión",
      description: "Proyecta cómo crece un capital con aportes periódicos y una rentabilidad esperada en el tiempo."
    }),
    "simuladores::finanzas e inversion::aportaciones variables": {
      id: "sim-variable-contributions",
      title: "Simulador de aportaciones variables",
      description: "Simula aportes irregulares incluyendo meses sin aportar y bonus anuales para medir su impacto en el capital final.",
      fields: [
        { name: "initialBalance", label: "Capital inicial", default: 12000, min: 0, step: 100 },
        { name: "baseContribution", label: "Aporte base mensual", default: 350, min: 0, step: 10 },
        { name: "monthsWithoutContribution", label: "Meses sin aportar por año", default: 2, min: 0, max: 12, step: 1 },
        { name: "annualBonus", label: "Bonus anual adicional", default: 2000, min: 0, step: 100 },
        { name: "annualReturn", label: "Rentabilidad anual esperada (%)", default: 7, min: -100, step: 0.1 },
        { name: "years", label: "Horizonte (años)", default: 10, min: 1, step: 1 }
      ],
      compute(values) {
        const months = totalMonths(values.years);
        const monthlyRate = annualRateToMonthlyReturn(values.annualReturn);
        let balance = values.initialBalance;
        let contributed = values.initialBalance;
        const rows = [];

        for (let month = 1; month <= months; month += 1) {
          const monthOfYear = ((month - 1) % 12) + 1;
          let contribution = monthOfYear <= values.monthsWithoutContribution ? 0 : values.baseContribution;
          if (monthOfYear === 12) contribution += values.annualBonus;
          balance = balance * (1 + monthlyRate) + contribution;
          contributed += contribution;
          if (month % 12 === 0 || month === months) {
            rows.push([`Año ${Math.ceil(month / 12)}`, eurosPrecise(contributed), eurosPrecise(balance)]);
          }
        }

        return {
          summary: [
            { label: "Capital final", value: eurosPrecise(balance), tone: "ok" },
            { label: "Total aportado", value: eurosPrecise(contributed), tone: "warn" },
            { label: "Ganancia estimada", value: eurosPrecise(balance - contributed), tone: balance >= contributed ? "ok" : "bad" }
          ],
          tables: [
            {
              title: "Evolución anual",
              headers: ["Periodo", "Aportado acumulado", "Capital estimado"],
              rows
            }
          ],
          insights: [
            `Con ${decimal(values.monthsWithoutContribution, 0)} meses al año sin aportar, el bonus de ${eurosPrecise(values.annualBonus)} ayuda a compensar parte del hueco.`,
            "La irregularidad en aportes ralentiza el efecto compuesto, pero mantener consistencia en el largo plazo sigue siendo decisivo."
          ]
        };
      }
    },
    "simuladores::finanzas e inversion::objetivos financieros": {
      id: "sim-financial-goals",
      title: "Simulador de objetivos financieros",
      description: "Calcula cuándo alcanzarías una meta patrimonial a partir de tu capital actual, aportaciones y rentabilidad esperada.",
      fields: [
        { name: "targetAmount", label: "Objetivo financiero", default: 100000, min: 1, step: 1000 },
        { name: "initialBalance", label: "Capital inicial", default: 18000, min: 0, step: 100 },
        { name: "monthlyContribution", label: "Aporte mensual", default: 450, min: 0, step: 10 },
        { name: "annualReturn", label: "Rentabilidad anual (%)", default: 6.5, min: -100, step: 0.1 }
      ],
      compute(values) {
        const monthlyRate = annualRateToMonthlyReturn(values.annualReturn);
        let balance = values.initialBalance;
        let month = 0;
        const maxMonths = 12 * 80;
        while (balance < values.targetAmount && month < maxMonths) {
          balance = balance * (1 + monthlyRate) + values.monthlyContribution;
          month += 1;
        }
        const reached = balance >= values.targetAmount;
        return {
          summary: [
            { label: "Objetivo", value: eurosPrecise(values.targetAmount), tone: "warn" },
            { label: "Tiempo estimado", value: reached ? yearsMonthsLabel(month) : "No alcanzado", tone: reached ? "ok" : "bad" },
            { label: "Capital al final", value: eurosPrecise(balance), tone: reached ? "ok" : "warn" }
          ],
          insights: [
            reached ? `Manteniendo estos supuestos, la meta se alcanzaría en aproximadamente ${yearsMonthsLabel(month)}.` : "Con los supuestos actuales la meta no se alcanza en un horizonte razonable; habría que subir aportes, plazo o rentabilidad.",
            `Cada ${eurosPrecise(values.monthlyContribution)} mensual acorta el tiempo necesario para cerrar la brecha hacia el objetivo.`
          ]
        };
      }
    },
    "simuladores::finanzas e inversion::monte carlo": {
      id: "sim-monte-carlo",
      title: "Simulador Monte Carlo",
      description: "Genera múltiples trayectorias aleatorias para estimar la distribución de resultados y la probabilidad de escenarios favorables o adversos.",
      fields: [
        { name: "initialBalance", label: "Capital inicial", default: 25000, min: 0, step: 100 },
        { name: "monthlyContribution", label: "Aporte mensual", default: 500, min: 0, step: 10 },
        { name: "annualReturn", label: "Rentabilidad media anual (%)", default: 7, min: -100, step: 0.1 },
        { name: "volatility", label: "Volatilidad anual (%)", default: 16, min: 0, step: 0.1 },
        { name: "years", label: "Horizonte (años)", default: 15, min: 1, step: 1 },
        { name: "simulations", label: "Número de simulaciones", default: 1000, min: 100, step: 100 }
      ],
      compute(values) {
        const months = totalMonths(values.years);
        const invested = values.initialBalance + values.monthlyContribution * months;
        const results = [];
        const drawdowns = [];
        for (let i = 0; i < values.simulations; i += 1) {
          const path = simulatePath({
            initialBalance: values.initialBalance,
            monthlyContribution: values.monthlyContribution,
            annualReturnPct: values.annualReturn,
            volatilityPct: values.volatility,
            months
          });
          results.push(path[path.length - 1]);
          drawdowns.push(maxDrawdownFromSeries(path));
        }
        const p10 = percentile(results, 0.1);
        const p50 = percentile(results, 0.5);
        const p90 = percentile(results, 0.9);
        const successRate = results.filter((value) => value >= invested).length / results.length;
        return {
          summary: [
            { label: "Escenario p10", value: eurosPrecise(p10), tone: "bad" },
            { label: "Escenario mediano", value: eurosPrecise(p50), tone: "warn" },
            { label: "Probabilidad de acabar sobre aportado", value: pct(successRate * 100), tone: successRate >= 0.7 ? "ok" : successRate >= 0.5 ? "warn" : "bad" }
          ],
          tables: [
            {
              title: "Rangos estimados",
              headers: ["Métrica", "Valor"],
              rows: [
                ["Capital aportado", eurosPrecise(invested)],
                ["Percentil 10", eurosPrecise(p10)],
                ["Percentil 50", eurosPrecise(p50)],
                ["Percentil 90", eurosPrecise(p90)],
                ["Drawdown mediano", pct(percentile(drawdowns, 0.5))]
              ]
            }
          ],
          insights: [
            "Monte Carlo no predice el futuro, pero sirve para visualizar un abanico razonable de resultados bajo volatilidad y retorno esperados.",
            `Con ${decimal(values.simulations, 0)} trayectorias simuladas, el resultado mediano se sitúa en ${eurosPrecise(p50)}.`
          ]
        };
      }
    },
    "simuladores::finanzas e inversion::rebalanceo": {
      id: "sim-rebalance",
      title: "Simulador de rebalanceo",
      description: "Compara la evolución de una cartera con y sin rebalanceo periódico entre un bloque de riesgo y otro defensivo.",
      fields: [
        { name: "initialCapital", label: "Capital inicial", default: 50000, min: 0, step: 100 },
        { name: "riskyWeight", label: "Peso objetivo activo de riesgo (%)", default: 65, min: 0, max: 100, step: 1 },
        { name: "riskyReturn", label: "Rentabilidad anual riesgo (%)", default: 9, min: -100, step: 0.1 },
        { name: "defensiveReturn", label: "Rentabilidad anual defensivo (%)", default: 3, min: -100, step: 0.1 },
        { name: "rebalanceMonths", label: "Rebalancear cada X meses", default: 6, min: 1, step: 1 },
        { name: "years", label: "Horizonte (años)", default: 10, min: 1, step: 1 }
      ],
      compute(values) {
        const months = totalMonths(values.years);
        const riskyTarget = clamp(values.riskyWeight / 100, 0, 1);
        const defensiveTarget = 1 - riskyTarget;
        const riskyRate = annualRateToMonthlyReturn(values.riskyReturn);
        const defensiveRate = annualRateToMonthlyReturn(values.defensiveReturn);
        let riskyRebalanced = values.initialCapital * riskyTarget;
        let defensiveRebalanced = values.initialCapital * defensiveTarget;
        let riskyDrift = riskyRebalanced;
        let defensiveDrift = defensiveRebalanced;

        for (let month = 1; month <= months; month += 1) {
          riskyRebalanced *= 1 + riskyRate;
          defensiveRebalanced *= 1 + defensiveRate;
          riskyDrift *= 1 + riskyRate;
          defensiveDrift *= 1 + defensiveRate;

          if (month % values.rebalanceMonths === 0) {
            const total = riskyRebalanced + defensiveRebalanced;
            riskyRebalanced = total * riskyTarget;
            defensiveRebalanced = total * defensiveTarget;
          }
        }

        const totalRebalanced = riskyRebalanced + defensiveRebalanced;
        const totalDrift = riskyDrift + defensiveDrift;
        const driftRiskyWeight = totalDrift > 0 ? (riskyDrift / totalDrift) * 100 : 0;
        return {
          summary: [
            { label: "Valor con rebalanceo", value: eurosPrecise(totalRebalanced), tone: "ok" },
            { label: "Valor sin rebalanceo", value: eurosPrecise(totalDrift), tone: "warn" },
            { label: "Peso final riesgo sin rebal.", value: pct(driftRiskyWeight), tone: driftRiskyWeight > values.riskyWeight + 5 ? "bad" : "warn" }
          ],
          insights: [
            "El rebalanceo no garantiza más rentabilidad, pero sí mantiene la exposición al riesgo cerca del objetivo estratégico.",
            `Sin rebalancear, el activo de riesgo termina pesando ${pct(driftRiskyWeight)} frente al objetivo del ${pct(values.riskyWeight)}.`
          ]
        };
      }
    },
    "simuladores::finanzas e inversion::escenarios economicos": {
      id: "sim-economic-scenarios",
      title: "Simulador de escenarios económicos",
      description: "Aplica distintos entornos macro a una cartera para comparar cómo cambian el valor futuro nominal y real.",
      fields: [
        { name: "initialBalance", label: "Capital inicial", default: 30000, min: 0, step: 100 },
        { name: "monthlyContribution", label: "Aporte mensual", default: 400, min: 0, step: 10 },
        { name: "baseReturn", label: "Rentabilidad base anual (%)", default: 7, min: -100, step: 0.1 },
        { name: "baseInflation", label: "Inflación base anual (%)", default: 2.5, min: -100, step: 0.1 },
        { name: "years", label: "Horizonte (años)", default: 10, min: 1, step: 1 }
      ],
      compute(values) {
        const scenarios = [
          { label: "Base", returnDelta: 0, inflationDelta: 0 },
          { label: "Inflación alta", returnDelta: -1.5, inflationDelta: 3 },
          { label: "Recesión", returnDelta: -4, inflationDelta: -0.5 },
          { label: "Tipos altos", returnDelta: -2, inflationDelta: 1.5 }
        ];
        const rows = scenarios.map((scenario) => {
          const annualReturn = values.baseReturn + scenario.returnDelta;
          const inflation = Math.max(values.baseInflation + scenario.inflationDelta, -90);
          const nominal = futureValueWithMonthlyContributions(values.initialBalance, values.monthlyContribution, annualReturn, values.years);
          const real = nominal / Math.pow(1 + inflation / 100, values.years);
          return [scenario.label, pct(annualReturn), pct(inflation), eurosPrecise(nominal), eurosPrecise(real)];
        });
        return {
          summary: [
            { label: "Escenarios comparados", value: String(rows.length), tone: "ok" },
            { label: "Capital base nominal", value: rows[0][3], tone: "ok" },
            { label: "Capital base real", value: rows[0][4], tone: "warn" }
          ],
          tables: [
            {
              title: "Escenarios macro",
              headers: ["Escenario", "Retorno anual", "Inflación", "Valor nominal", "Valor real"],
              rows
            }
          ],
          insights: [
            "El valor real descuenta inflación, por eso puede caer incluso si el valor nominal sigue creciendo.",
            "Comparar escenarios macro ayuda a estresar supuestos antes de comprometer una estrategia de inversión a largo plazo."
          ]
        };
      }
    },
    "simuladores::finanzas e inversion::inflacion futura": cloneDefinition(calculatorDefinitions["calculadora de inflación"], {
      id: "sim-future-inflation",
      title: "Simulador de inflación futura",
      description: "Proyecta cuánto valdrá el dinero en el futuro y cuánto poder adquisitivo se perderá bajo distintas tasas de inflación."
    }),
    "simuladores::finanzas e inversion::patrimonio a largo plazo": {
      id: "sim-net-worth-long-term",
      title: "Simulador de patrimonio a largo plazo",
      description: "Integra ingresos, gastos, inversiones y deudas para proyectar la evolución global del patrimonio neto a varios años.",
      fields: [
        { name: "currentAssets", label: "Activos actuales", default: 90000, min: 0, step: 1000 },
        { name: "currentDebt", label: "Deuda actual", default: 35000, min: 0, step: 1000 },
        { name: "monthlyIncome", label: "Ingresos mensuales", default: 3200, min: 0, step: 10 },
        { name: "monthlyExpenses", label: "Gastos mensuales", default: 2100, min: 0, step: 10 },
        { name: "monthlyInvestment", label: "Aporte a inversión mensual", default: 450, min: 0, step: 10 },
        { name: "annualReturn", label: "Rentabilidad de activos (%)", default: 6, min: -100, step: 0.1 },
        { name: "debtRate", label: "Coste medio de deuda (%)", default: 4.2, min: 0, step: 0.1 },
        { name: "years", label: "Horizonte (años)", default: 15, min: 1, step: 1 }
      ],
      compute(values) {
        let assets = values.currentAssets;
        let debt = values.currentDebt;
        const annualSurplus = Math.max((values.monthlyIncome - values.monthlyExpenses - values.monthlyInvestment) * 12, 0);
        const annualInvestment = values.monthlyInvestment * 12;
        const annualDebtService = Math.max((values.monthlyIncome - values.monthlyExpenses) * 12 * 0.35, 0);
        const rows = [];

        for (let year = 1; year <= values.years; year += 1) {
          assets = assets * (1 + values.annualReturn / 100) + annualInvestment + annualSurplus;
          debt = Math.max(debt * (1 + values.debtRate / 100) - annualDebtService, 0);
          rows.push([`Año ${year}`, eurosPrecise(assets), eurosPrecise(debt), eurosPrecise(assets - debt)]);
        }

        return {
          summary: [
            { label: "Patrimonio final", value: eurosPrecise(assets - debt), tone: assets >= debt ? "ok" : "bad" },
            { label: "Activos finales", value: eurosPrecise(assets), tone: "ok" },
            { label: "Deuda final", value: eurosPrecise(debt), tone: debt <= values.currentDebt ? "ok" : "warn" }
          ],
          tables: [
            {
              title: "Proyección patrimonial",
              headers: ["Periodo", "Activos", "Deuda", "Patrimonio neto"],
              rows
            }
          ],
          insights: [
            `El modelo asume ${eurosPrecise(annualInvestment)} al año en aportes de inversión y un superávit adicional de ${eurosPrecise(annualSurplus)}.`,
            "Sirve para ver dirección patrimonial y sensibilidad global, no para sustituir una planificación financiera detallada."
          ]
        };
      }
    },
    "simuladores::finanzas e inversion::sensibilidad": {
      id: "sim-sensitivity",
      title: "Simulador de sensibilidad",
      description: "Muestra cómo cambia el resultado final si modificas la rentabilidad esperada en torno a un escenario base.",
      fields: [
        { name: "initialBalance", label: "Capital inicial", default: 22000, min: 0, step: 100 },
        { name: "monthlyContribution", label: "Aporte mensual", default: 400, min: 0, step: 10 },
        { name: "baseReturn", label: "Rentabilidad base (%)", default: 7, min: -100, step: 0.1 },
        { name: "delta", label: "Variación de sensibilidad (p.p.)", default: 2, min: 0, step: 0.1 },
        { name: "years", label: "Horizonte (años)", default: 12, min: 1, step: 1 }
      ],
      compute(values) {
        const scenarios = [
          { label: "Bajo", rate: values.baseReturn - values.delta },
          { label: "Base", rate: values.baseReturn },
          { label: "Alto", rate: values.baseReturn + values.delta }
        ];
        const rows = scenarios.map((scenario) => [
          scenario.label,
          pct(scenario.rate),
          eurosPrecise(futureValueWithMonthlyContributions(values.initialBalance, values.monthlyContribution, scenario.rate, values.years))
        ]);
        return {
          summary: [
            { label: "Escenario bajo", value: rows[0][2], tone: "bad" },
            { label: "Escenario base", value: rows[1][2], tone: "warn" },
            { label: "Escenario alto", value: rows[2][2], tone: "ok" }
          ],
          tables: [
            {
              title: "Sensibilidad por retorno",
              headers: ["Escenario", "Rentabilidad", "Valor final"],
              rows
            }
          ],
          insights: [
            `Una variación de ${pct(values.delta)} en rentabilidad anual puede mover el capital final en varios miles de euros a largo plazo.`,
            "La sensibilidad sirve para detectar cuánto dependen tus resultados de un supuesto concreto."
          ]
        };
      }
    },
    "simuladores::finanzas e inversion::drawdowns": {
      id: "sim-drawdowns",
      title: "Simulador de drawdowns",
      description: "Estima caídas máximas esperadas bajo distintas trayectorias aleatorias para ayudarte a calibrar tolerancia al riesgo.",
      fields: [
        { name: "initialBalance", label: "Capital inicial", default: 40000, min: 0, step: 100 },
        { name: "annualReturn", label: "Rentabilidad anual media (%)", default: 7, min: -100, step: 0.1 },
        { name: "volatility", label: "Volatilidad anual (%)", default: 18, min: 0, step: 0.1 },
        { name: "years", label: "Horizonte (años)", default: 8, min: 1, step: 1 },
        { name: "simulations", label: "Simulaciones", default: 800, min: 100, step: 100 }
      ],
      compute(values) {
        const months = totalMonths(values.years);
        const drawdowns = [];
        for (let i = 0; i < values.simulations; i += 1) {
          const path = simulatePath({
            initialBalance: values.initialBalance,
            annualReturnPct: values.annualReturn,
            volatilityPct: values.volatility,
            months
          });
          drawdowns.push(maxDrawdownFromSeries(path));
        }
        return {
          summary: [
            { label: "Drawdown mediano", value: pct(percentile(drawdowns, 0.5)), tone: "warn" },
            { label: "Drawdown p90", value: pct(percentile(drawdowns, 0.9)), tone: "bad" },
            { label: "Peor caso simulado", value: pct(Math.max(...drawdowns, 0)), tone: "bad" }
          ],
          insights: [
            "El drawdown mide la caída desde el pico hasta el valle posterior, y suele ser más útil psicológicamente que la volatilidad pura.",
            `Con los supuestos actuales, en escenarios duros la cartera puede sufrir caídas de alrededor del ${pct(percentile(drawdowns, 0.9))}.`
          ]
        };
      }
    },
    "simuladores::finanzas e inversion::riesgo de ruina": {
      id: "sim-risk-of-ruin",
      title: "Simulador de riesgo de ruina",
      description: "Calcula la probabilidad de agotar totalmente el capital bajo retiradas periódicas y volatilidad de mercado.",
      fields: [
        { name: "initialBalance", label: "Capital inicial", default: 180000, min: 0, step: 1000 },
        { name: "monthlyWithdrawal", label: "Retirada mensual", default: 1100, min: 0, step: 10 },
        { name: "annualReturn", label: "Rentabilidad anual media (%)", default: 5, min: -100, step: 0.1 },
        { name: "volatility", label: "Volatilidad anual (%)", default: 14, min: 0, step: 0.1 },
        { name: "years", label: "Horizonte (años)", default: 25, min: 1, step: 1 },
        { name: "simulations", label: "Simulaciones", default: 1000, min: 100, step: 100 }
      ],
      compute(values) {
        const months = totalMonths(values.years);
        let ruined = 0;
        const endingBalances = [];
        for (let i = 0; i < values.simulations; i += 1) {
          const path = simulatePath({
            initialBalance: values.initialBalance,
            monthlyWithdrawal: values.monthlyWithdrawal,
            annualReturnPct: values.annualReturn,
            volatilityPct: values.volatility,
            months
          });
          if (path.some((value) => value <= 0)) ruined += 1;
          endingBalances.push(path[path.length - 1]);
        }
        const ruinRate = ruined / values.simulations;
        return {
          summary: [
            { label: "Probabilidad de ruina", value: pct(ruinRate * 100), tone: ruinRate < 0.1 ? "ok" : ruinRate < 0.25 ? "warn" : "bad" },
            { label: "Balance final mediano", value: eurosPrecise(percentile(endingBalances, 0.5)), tone: "warn" },
            { label: "Balance final p10", value: eurosPrecise(percentile(endingBalances, 0.1)), tone: "bad" }
          ],
          insights: [
            "El riesgo de ruina combina secuencia de rendimientos y nivel de retiradas; es especialmente útil para fases de desacumulación.",
            `Con retiradas de ${eurosPrecise(values.monthlyWithdrawal)} al mes, la probabilidad estimada de agotar el capital es ${pct(ruinRate * 100)}.`
          ]
        };
      }
    },

    "simuladores::finanzas personales::ahorro": cloneDefinition(calculatorDefinitions["calculadora de interés compuesto"], {
      id: "sim-saving",
      title: "Simulador de ahorro",
      description: "Proyecta cuánto acumulas al ahorrar cada mes y cómo contribuyen aportes y rendimiento al saldo final."
    }),
    "simuladores::finanzas personales::deuda": {
      id: "sim-debt",
      title: "Simulador de deuda",
      description: "Compara una estrategia tipo snowball o avalanche para estimar el tiempo de pago y los intereses acumulados de varias deudas.",
      fields: [
        { name: "balance1", label: "Deuda 1 - saldo", default: 6500, min: 0, step: 100 },
        { name: "rate1", label: "Deuda 1 - interés (%)", default: 18, min: 0, step: 0.1 },
        { name: "balance2", label: "Deuda 2 - saldo", default: 4200, min: 0, step: 100 },
        { name: "rate2", label: "Deuda 2 - interés (%)", default: 8.5, min: 0, step: 0.1 },
        { name: "balance3", label: "Deuda 3 - saldo", default: 12500, min: 0, step: 100 },
        { name: "rate3", label: "Deuda 3 - interés (%)", default: 5.2, min: 0, step: 0.1 },
        { name: "monthlyBudget", label: "Presupuesto mensual de pago", default: 750, min: 1, step: 10 },
        {
          name: "strategy",
          label: "Estrategia",
          type: "select",
          default: "avalanche",
          options: [
            { value: "snowball", label: "Snowball (saldo menor primero)" },
            { value: "avalanche", label: "Avalanche (interés mayor primero)" }
          ]
        }
      ],
      compute(values) {
        const debts = [
          { name: "Deuda 1", balance: values.balance1, rate: values.rate1 },
          { name: "Deuda 2", balance: values.balance2, rate: values.rate2 },
          { name: "Deuda 3", balance: values.balance3, rate: values.rate3 }
        ];
        let month = 0;
        let totalInterest = 0;
        const rows = [];

        while (debts.some((debt) => debt.balance > 0.01) && month < 600) {
          month += 1;
          debts.forEach((debt) => {
            if (debt.balance <= 0) return;
            const monthlyInterest = debt.balance * annualRateToMonthlyReturn(debt.rate);
            debt.balance += monthlyInterest;
            totalInterest += monthlyInterest;
          });

          const ordered = [...debts].filter((debt) => debt.balance > 0.01).sort((a, b) => {
            return values.strategy === "snowball" ? a.balance - b.balance : b.rate - a.rate;
          });
          let remainingBudget = values.monthlyBudget;
          ordered.forEach((debt) => {
            if (remainingBudget <= 0) return;
            const payment = Math.min(debt.balance, remainingBudget);
            debt.balance -= payment;
            remainingBudget -= payment;
          });

          if (month <= 12 || !debts.some((debt) => debt.balance > 0.01)) {
            rows.push([
              String(month),
              eurosPrecise(sum(debts.map((debt) => debt.balance))),
              eurosPrecise(totalInterest)
            ]);
          }
        }

        return {
          summary: [
            { label: "Tiempo estimado", value: yearsMonthsLabel(month), tone: "ok" },
            { label: "Intereses pagados", value: eurosPrecise(totalInterest), tone: "bad" },
            { label: "Estrategia", value: values.strategy === "snowball" ? "Snowball" : "Avalanche", tone: "warn" }
          ],
          tables: [
            {
              title: "Evolución de la deuda",
              headers: ["Mes", "Saldo total", "Intereses acumulados"],
              rows
            }
          ],
          insights: [
            values.strategy === "snowball" ? "Snowball prioriza victorias rápidas psicológicas al atacar primero saldos pequeños." : "Avalanche minimiza intereses atacando primero la deuda más cara.",
            `Con un presupuesto mensual de ${eurosPrecise(values.monthlyBudget)}, la deuda queda liquidada en ${yearsMonthsLabel(month)} bajo los supuestos actuales.`
          ]
        };
      }
    },
    "simuladores::finanzas personales::gastos futuros": {
      id: "sim-future-expenses",
      title: "Simulador de gastos futuros",
      description: "Estima cuánto costará en el futuro un gran gasto y cuánto deberías ahorrar al mes para llegar preparado.",
      fields: [
        { name: "targetCostToday", label: "Coste actual del objetivo", default: 18000, min: 0, step: 100 },
        { name: "years", label: "Faltan (años)", default: 5, min: 1, step: 1 },
        { name: "inflation", label: "Inflación anual estimada (%)", default: 3, min: -100, step: 0.1 },
        { name: "currentSavings", label: "Ahorro ya acumulado", default: 2500, min: 0, step: 100 },
        { name: "annualReturn", label: "Rentabilidad del ahorro (%)", default: 3, min: -100, step: 0.1 }
      ],
      compute(values) {
        const futureCost = compoundGrowth(values.targetCostToday, values.inflation, values.years, 1);
        const growthFactor = annualRateToMonthlyReturn(values.annualReturn);
        const months = totalMonths(values.years);
        const currentSavingsFuture = values.currentSavings * Math.pow(1 + growthFactor, months);
        const gap = Math.max(futureCost - currentSavingsFuture, 0);
        const monthlyNeeded = growthFactor === 0
          ? gap / months
          : gap / ((Math.pow(1 + growthFactor, months) - 1) / growthFactor);
        return {
          summary: [
            { label: "Coste futuro estimado", value: eurosPrecise(futureCost), tone: "warn" },
            { label: "Brecha por cubrir", value: eurosPrecise(gap), tone: gap > 0 ? "bad" : "ok" },
            { label: "Ahorro mensual necesario", value: eurosPrecise(monthlyNeeded), tone: "ok" }
          ],
          insights: [
            `El objetivo que hoy cuesta ${eurosPrecise(values.targetCostToday)} puede subir hasta ${eurosPrecise(futureCost)} con la inflación asumida.`,
            "Este simulador sirve para gastos grandes puntuales como estudios, coche, boda, hijos o reformas."
          ]
        };
      }
    },
    "simuladores::finanzas personales::fire": {
      id: "sim-fire",
      title: "Simulador FIRE",
      description: "Calcula cuándo tu cartera alcanzaría un tamaño suficiente para sostener tus gastos usando una tasa de retiro segura.",
      fields: [
        { name: "currentPortfolio", label: "Cartera actual", default: 85000, min: 0, step: 1000 },
        { name: "monthlyContribution", label: "Aporte mensual", default: 900, min: 0, step: 10 },
        { name: "annualReturn", label: "Rentabilidad anual (%)", default: 7, min: -100, step: 0.1 },
        { name: "annualExpenses", label: "Gastos anuales", default: 24000, min: 0, step: 100 },
        { name: "safeWithdrawal", label: "Tasa de retiro segura (%)", default: 4, min: 0.1, step: 0.1 }
      ],
      compute(values) {
        const target = values.annualExpenses / (values.safeWithdrawal / 100);
        const monthlyRate = annualRateToMonthlyReturn(values.annualReturn);
        let balance = values.currentPortfolio;
        let month = 0;
        while (balance < target && month < 960) {
          balance = balance * (1 + monthlyRate) + values.monthlyContribution;
          month += 1;
        }
        return {
          summary: [
            { label: "Número FIRE", value: eurosPrecise(target), tone: "warn" },
            { label: "Tiempo estimado", value: balance >= target ? yearsMonthsLabel(month) : "No alcanzado", tone: balance >= target ? "ok" : "bad" },
            { label: "Retiro anual objetivo", value: eurosPrecise(values.annualExpenses), tone: "ok" }
          ],
          insights: [
            `Con una tasa del ${pct(values.safeWithdrawal)}, la cartera objetivo sería ${eurosPrecise(target)}.`,
            "FIRE simplifica mucho la realidad, pero ayuda a visualizar la distancia entre cartera actual y libertad financiera."
          ]
        };
      }
    },
    "simuladores::finanzas personales::independencia financiera": {
      id: "sim-financial-independence",
      title: "Simulador de independencia financiera",
      description: "Calcula cuándo los ingresos pasivos de tu capital podrían cubrir tus gastos mensuales sin depender de una regla fija como el 4%.",
      fields: [
        { name: "currentCapital", label: "Capital actual", default: 65000, min: 0, step: 1000 },
        { name: "monthlyContribution", label: "Aporte mensual", default: 700, min: 0, step: 10 },
        { name: "annualReturn", label: "Rentabilidad anual (%)", default: 6.5, min: -100, step: 0.1 },
        { name: "passiveYield", label: "Yield pasivo esperado (%)", default: 3.5, min: 0, step: 0.1 },
        { name: "otherPassiveIncome", label: "Otros ingresos pasivos mensuales", default: 150, min: 0, step: 10 },
        { name: "monthlyExpenses", label: "Gastos mensuales", default: 1800, min: 0, step: 10 }
      ],
      compute(values) {
        const monthlyRate = annualRateToMonthlyReturn(values.annualReturn);
        let capital = values.currentCapital;
        let month = 0;
        while (((capital * (values.passiveYield / 100)) / 12 + values.otherPassiveIncome) < values.monthlyExpenses && month < 960) {
          capital = capital * (1 + monthlyRate) + values.monthlyContribution;
          month += 1;
        }
        const passiveIncome = (capital * (values.passiveYield / 100)) / 12 + values.otherPassiveIncome;
        return {
          summary: [
            { label: "Capital proyectado", value: eurosPrecise(capital), tone: "ok" },
            { label: "Ingreso pasivo mensual", value: eurosPrecise(passiveIncome), tone: passiveIncome >= values.monthlyExpenses ? "ok" : "warn" },
            { label: "Tiempo estimado", value: passiveIncome >= values.monthlyExpenses ? yearsMonthsLabel(month) : "No alcanzado", tone: passiveIncome >= values.monthlyExpenses ? "ok" : "bad" }
          ],
          insights: [
            "A diferencia de FIRE clásico, aquí mandan tus ingresos pasivos reales esperados y no una única regla de retiro.",
            `El objetivo se cumple cuando los ingresos pasivos superan tus gastos de ${eurosPrecise(values.monthlyExpenses)} al mes.`
          ]
        };
      }
    },
    "simuladores::finanzas personales::jubilación avanzada": {
      id: "sim-advanced-retirement",
      title: "Simulador de jubilación avanzada",
      description: "Integra ahorro, rentabilidad, inflación y pensión esperada para estimar tus ingresos totales en la jubilación.",
      fields: [
        { name: "currentAge", label: "Edad actual", default: 35, min: 18, step: 1 },
        { name: "retirementAge", label: "Edad de jubilación", default: 67, min: 19, step: 1 },
        { name: "currentSavings", label: "Ahorro actual", default: 70000, min: 0, step: 1000 },
        { name: "monthlyContribution", label: "Aporte mensual", default: 650, min: 0, step: 10 },
        { name: "annualReturn", label: "Rentabilidad anual (%)", default: 6, min: -100, step: 0.1 },
        { name: "inflation", label: "Inflación esperada (%)", default: 2.5, min: -100, step: 0.1 },
        { name: "publicPension", label: "Pensión pública mensual estimada", default: 1200, min: 0, step: 10 },
        { name: "withdrawalRate", label: "Tasa de retiro (%)", default: 3.5, min: 0.1, step: 0.1 },
        { name: "currentExpenses", label: "Gasto mensual actual", default: 2100, min: 0, step: 10 }
      ],
      compute(values) {
        const years = Math.max(values.retirementAge - values.currentAge, 0);
        const futureCapital = futureValueWithMonthlyContributions(values.currentSavings, values.monthlyContribution, values.annualReturn, years);
        const investmentIncomeMonthly = (futureCapital * (values.withdrawalRate / 100)) / 12;
        const totalRetirementIncome = investmentIncomeMonthly + values.publicPension;
        const inflatedExpenses = values.currentExpenses * Math.pow(1 + values.inflation / 100, years);
        return {
          summary: [
            { label: "Capital al retiro", value: eurosPrecise(futureCapital), tone: "ok" },
            { label: "Ingreso mensual estimado", value: eurosPrecise(totalRetirementIncome), tone: totalRetirementIncome >= inflatedExpenses ? "ok" : "warn" },
            { label: "Gasto mensual futuro", value: eurosPrecise(inflatedExpenses), tone: "warn" }
          ],
          insights: [
            `La parte de inversiones aportaría aproximadamente ${eurosPrecise(investmentIncomeMonthly)} al mes con una tasa de retiro del ${pct(values.withdrawalRate)}.`,
            totalRetirementIncome >= inflatedExpenses ? "La combinación de cartera y pensión cubre el nivel de gasto proyectado." : "Con estos supuestos habría una brecha entre ingresos de jubilación y gasto futuro esperado."
          ]
        };
      }
    },
    "simuladores::finanzas personales::coste de vida futuro": {
      id: "sim-future-cost-of-living",
      title: "Simulador de coste de vida futuro",
      description: "Proyecta el coste de vivir dentro de unos años desglosando inflación por categorías clave del presupuesto.",
      fields: [
        { name: "housing", label: "Vivienda mensual actual", default: 900, min: 0, step: 10 },
        { name: "food", label: "Comida mensual actual", default: 350, min: 0, step: 10 },
        { name: "energy", label: "Energía mensual actual", default: 120, min: 0, step: 10 },
        { name: "other", label: "Otros gastos mensuales", default: 650, min: 0, step: 10 },
        { name: "housingInflation", label: "Inflación vivienda (%)", default: 3.5, min: -100, step: 0.1 },
        { name: "foodInflation", label: "Inflación comida (%)", default: 3, min: -100, step: 0.1 },
        { name: "energyInflation", label: "Inflación energía (%)", default: 4.5, min: -100, step: 0.1 },
        { name: "otherInflation", label: "Inflación otros (%)", default: 2.5, min: -100, step: 0.1 },
        { name: "years", label: "Horizonte (años)", default: 10, min: 1, step: 1 }
      ],
      compute(values) {
        const categories = [
          ["Vivienda", values.housing, values.housingInflation],
          ["Comida", values.food, values.foodInflation],
          ["Energía", values.energy, values.energyInflation],
          ["Otros", values.other, values.otherInflation]
        ];
        const rows = categories.map(([label, amount, inflation]) => [
          label,
          eurosPrecise(amount),
          pct(inflation),
          eurosPrecise(compoundGrowth(amount, inflation, values.years, 1))
        ]);
        const futureTotal = sum(rows.map((row) => parseNumber(String(row[3]).replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(/,/g, "."), 0)));
        return {
          summary: [
            { label: "Coste mensual futuro", value: eurosPrecise(futureTotal), tone: "warn" },
            { label: "Coste anual futuro", value: eurosPrecise(futureTotal * 12), tone: "warn" },
            { label: "Horizonte", value: `${values.years} años`, tone: "ok" }
          ],
          tables: [
            {
              title: "Proyección por categoría",
              headers: ["Categoría", "Coste actual", "Inflación", "Coste futuro"],
              rows
            }
          ],
          insights: [
            "Separar la inflación por categorías da una lectura más realista que usar una única tasa para todo el coste de vida.",
            `La partida más sensible será aquella con mayor peso y mayor inflación estructural.`
          ]
        };
      }
    },
    "simuladores::finanzas personales::impacto fiscal": cloneDefinition(calculatorDefinitions["impacto de impuestos en inversiones"], {
      id: "sim-personal-tax-impact",
      title: "Simulador de impacto fiscal",
      description: "Calcula cómo afectan los impuestos al ahorro y a la inversión para ver la rentabilidad neta real de la estrategia."
    }),
    "simuladores::finanzas personales::decisiones financieras": {
      id: "sim-financial-decisions",
      title: "Simulador de decisiones financieras",
      description: "Compara dos opciones financieras evaluando coste inicial, cuota mensual, duración y coste de oportunidad del dinero.",
      fields: [
        { name: "upfrontA", label: "Opción A - pago inicial", default: 5000, min: 0, step: 100 },
        { name: "monthlyA", label: "Opción A - coste mensual", default: 450, min: 0, step: 10 },
        { name: "yearsA", label: "Opción A - duración (años)", default: 5, min: 0.1, step: 0.1 },
        { name: "upfrontB", label: "Opción B - pago inicial", default: 15000, min: 0, step: 100 },
        { name: "monthlyB", label: "Opción B - coste mensual", default: 180, min: 0, step: 10 },
        { name: "yearsB", label: "Opción B - duración (años)", default: 5, min: 0.1, step: 0.1 },
        { name: "discountRate", label: "Coste de oportunidad anual (%)", default: 4, min: 0, step: 0.1 }
      ],
      compute(values) {
        const npvA = compareOptionTotalCost(values.upfrontA, values.monthlyA, values.yearsA, values.discountRate);
        const npvB = compareOptionTotalCost(values.upfrontB, values.monthlyB, values.yearsB, values.discountRate);
        const better = npvA <= npvB ? "Opción A" : "Opción B";
        return {
          summary: [
            { label: "Coste equivalente A", value: eurosPrecise(npvA), tone: npvA <= npvB ? "ok" : "warn" },
            { label: "Coste equivalente B", value: eurosPrecise(npvB), tone: npvB < npvA ? "ok" : "warn" },
            { label: "Mejor opción", value: better, tone: "ok" }
          ],
          insights: [
            "El coste equivalente descuenta el tiempo del dinero, por lo que permite comparar pagos iniciales altos con cuotas mensuales más bajas o viceversa.",
            `${better} presenta el menor coste económico total con los supuestos actuales.`
          ]
        };
      }
    },

    "simuladores::inmobiliario::hipoteca": cloneDefinition(calculatorDefinitions["calculadora de hipoteca"], {
      id: "sim-mortgage",
      title: "Simulador de hipoteca",
      description: "Proyecta cuota, intereses y carga mensual total de una hipoteca para entender cuánto pagarás realmente."
    }),
    "simuladores::inmobiliario::compra vs alquiler": cloneDefinition(calculatorDefinitions["compra vs alquiler (version simple basada en coste anual)"], {
      id: "sim-buy-vs-rent",
      title: "Simulador compra vs alquiler",
      description: "Compara el coste total de comprar frente a alquilar para estimar qué alternativa conviene más."
    }),
    "simuladores::inmobiliario::inversion inmobiliaria": cloneDefinition(calculatorDefinitions["roi inmobiliario con impuestos"], {
      id: "sim-real-estate-investment",
      title: "Simulador de inversión inmobiliaria",
      description: "Integra rentabilidad, cashflow, gastos e impuestos para evaluar si una operación inmobiliaria tiene sentido."
    }),
    "simuladores::inmobiliario::cashflow inmobiliario": cloneDefinition(calculatorDefinitions["flujo de caja mensual"], {
      id: "sim-real-estate-cashflow",
      title: "Simulador de cashflow inmobiliario",
      description: "Calcula ingresos menos gastos del inmueble para ver si genera caja positiva o negativa cada mes."
    }),
    "simuladores::inmobiliario::revalorizacion": {
      id: "sim-appreciation",
      title: "Simulador de revalorización",
      description: "Proyecta el valor futuro de un inmueble bajo una tasa anual de apreciación nominal y te muestra su valor real ajustado por inflación.",
      fields: [
        { name: "propertyValue", label: "Valor actual del inmueble", default: 220000, min: 0, step: 1000 },
        { name: "annualGrowth", label: "Revalorización anual (%)", default: 3.5, min: -100, step: 0.1 },
        { name: "inflation", label: "Inflación anual (%)", default: 2.5, min: -100, step: 0.1 },
        { name: "years", label: "Horizonte (años)", default: 12, min: 1, step: 1 }
      ],
      compute(values) {
        const futureValue = compoundGrowth(values.propertyValue, values.annualGrowth, values.years, 1);
        const realFutureValue = futureValue / Math.pow(1 + values.inflation / 100, values.years);
        return {
          summary: [
            { label: "Valor futuro nominal", value: eurosPrecise(futureValue), tone: "ok" },
            { label: "Valor futuro real", value: eurosPrecise(realFutureValue), tone: "warn" },
            { label: "Plusvalía nominal", value: eurosPrecise(futureValue - values.propertyValue), tone: futureValue >= values.propertyValue ? "ok" : "bad" }
          ],
          insights: [
            `Una apreciación del ${pct(values.annualGrowth)} anual llevaría el inmueble a ${eurosPrecise(futureValue)} en ${values.years} años.`,
            "Mirar también el valor real evita sobreestimar la ganancia si la inflación se come parte importante de la subida nominal."
          ]
        };
      }
    },
    "simuladores::inmobiliario::gastos de compra/venta": {
      id: "sim-buy-sell-costs",
      title: "Simulador de gastos de compra/venta",
      description: "Calcula impuestos y costes asociados a comprar o vender un inmueble para conocer el coste real completo de la operación.",
      fields: [
        { name: "purchasePrice", label: "Precio de compra", default: 180000, min: 0, step: 1000 },
        { name: "salePrice", label: "Precio de venta", default: 220000, min: 0, step: 1000 },
        { name: "transferTax", label: "Impuestos de compra (%)", default: 8, min: 0, step: 0.1 },
        { name: "notaryCosts", label: "Notaría y registro", default: 2500, min: 0, step: 100 },
        { name: "renovationCosts", label: "Reformas / mejoras", default: 6000, min: 0, step: 100 },
        { name: "sellingCostsPct", label: "Costes de venta (%)", default: 4, min: 0, step: 0.1 },
        { name: "plusvalia", label: "Plusvalía / otros impuestos", default: 2500, min: 0, step: 100 }
      ],
      compute(values) {
        const buyCosts = values.purchasePrice * (values.transferTax / 100) + values.notaryCosts + values.renovationCosts;
        const sellCosts = values.salePrice * (values.sellingCostsPct / 100) + values.plusvalia;
        const netAfterSale = values.salePrice - sellCosts - values.purchasePrice - buyCosts;
        return {
          summary: [
            { label: "Coste total de compra", value: eurosPrecise(buyCosts), tone: "warn" },
            { label: "Coste total de venta", value: eurosPrecise(sellCosts), tone: "warn" },
            { label: "Resultado neto final", value: eurosPrecise(netAfterSale), tone: netAfterSale >= 0 ? "ok" : "bad" }
          ],
          insights: [
            `Comprar no cuesta solo el precio del activo: aquí los extras suman ${eurosPrecise(buyCosts)}.`,
            `Al vender, los costes e impuestos restan ${eurosPrecise(sellCosts)} del precio de salida.`
          ]
        };
      }
    },
    "simuladores::inmobiliario::cap rate": cloneDefinition(calculatorDefinitions["cap rate"], {
      id: "sim-cap-rate",
      title: "Simulador de cap rate",
      description: "Calcula la rentabilidad operativa bruta del activo antes de financiación para comparar inmuebles."
    }),
    "simuladores::inmobiliario::cash-on-cash": cloneDefinition(calculatorDefinitions["cash-on-cash return"], {
      id: "sim-cash-on-cash",
      title: "Simulador cash-on-cash",
      description: "Mide la rentabilidad sobre el efectivo realmente invertido en la operación inmobiliaria."
    }),
    "simuladores::inmobiliario::irr inmobiliaria": cloneDefinition(calculatorDefinitions["irr inmobiliaria (iterativa pero aceptada como calculadora)"], {
      id: "sim-real-estate-irr",
      title: "Simulador IRR inmobiliaria",
      description: "Calcula la rentabilidad total considerando flujos operativos y venta futura del inmueble."
    }),
    "simuladores::inmobiliario::hipoteca con amortizacion dinamica": {
      id: "sim-dynamic-amortization",
      title: "Simulador de hipoteca con amortización dinámica",
      description: "Mide cómo cambia la duración e intereses de la hipoteca cuando introduces amortizaciones extraordinarias mensuales y anuales.",
      fields: [
        { name: "principal", label: "Principal", default: 190000, min: 0, step: 1000 },
        { name: "annualRate", label: "Tipo anual (%)", default: 3.1, min: 0, step: 0.1 },
        { name: "years", label: "Plazo original (años)", default: 30, min: 1, step: 1 },
        { name: "extraMonthly", label: "Amortización extra mensual", default: 150, min: 0, step: 10 },
        { name: "annualExtra", label: "Amortización extra anual", default: 2000, min: 0, step: 100 }
      ],
      compute(values) {
        const regularPayment = monthlyPayment(values.principal, values.annualRate, values.years);
        const rate = annualRateToMonthlyReturn(values.annualRate) * 100;
        const baseSchedule = amortizationSchedule(values.principal, values.annualRate, values.years);
        const baseInterest = sum(baseSchedule.map((row) => row.interest));

        let balance = values.principal;
        let month = 0;
        let dynamicInterest = 0;
        const monthlyData = [];
        while (balance > 0.01 && month < 1000) {
          month += 1;
          const interest = balance * annualRateToMonthlyReturn(values.annualRate);
          dynamicInterest += interest;
          let payment = regularPayment + values.extraMonthly;
          if (month % 12 === 0) payment += values.annualExtra;
          const prevBalance = balance;
          balance = Math.max(balance + interest - payment, 0);
          monthlyData.push({ month, balance, principalPaid: prevBalance - balance });
        }
        const monthLabels = monthlyData.slice(0, 24).map((d) => `Mes ${d.month}`);
        const monthBalances = monthlyData.slice(0, 24).map((d) => d.balance);
        const yearsCount = Math.min(Math.ceil(monthlyData.length / 12), 10);
        const yearsLabels = [];
        const principalByYear = [];
        for (let y = 1; y <= yearsCount; y += 1) {
          const chunk = monthlyData.slice((y - 1) * 12, y * 12);
          if (!chunk.length) break;
          yearsLabels.push(`Año ${y}`);
          principalByYear.push(chunk.reduce((a, d) => a + d.principalPaid, 0));
        }
        return {
          summary: [
            { label: "Plazo original", value: yearsMonthsLabel(baseSchedule.length), tone: "warn" },
            { label: "Plazo con amortización", value: yearsMonthsLabel(month), tone: "ok" },
            { label: "Intereses ahorrados", value: eurosPrecise(baseInterest - dynamicInterest), tone: "ok" }
          ],
          insights: [
            `La cuota base es ${eurosPrecise(regularPayment)} y las amortizaciones extra reducen vida e intereses del préstamo.`,
            `Con extras de ${eurosPrecise(values.extraMonthly)} al mes y ${eurosPrecise(values.annualExtra)} al año, el recorte estimado es de ${yearsMonthsLabel(baseSchedule.length - month)}.`
          ],
          datasets: {
            amortizationSchedule: safeDataset(monthLabels, "Saldo pendiente", monthBalances),
            interestVsPrincipal: safeDataset(yearsLabels, "Capital amortizado por año", principalByYear)
          }
        };
      }
    },
    "simuladores::inmobiliario::turistico vs tradicional": {
      id: "sim-tourist-vs-traditional",
      title: "Simulador turístico vs tradicional",
      description: "Compara ingresos y gastos entre alquiler turístico y alquiler tradicional para ver cuál deja mejor flujo neto anual.",
      fields: [
        { name: "nightlyRate", label: "Precio medio por noche", default: 95, min: 0, step: 1 },
        { name: "occupancy", label: "Ocupación turística (%)", default: 62, min: 0, step: 0.1 },
        { name: "touristMonthlyExpenses", label: "Gastos turísticos mensuales", default: 420, min: 0, step: 10 },
        { name: "traditionalRent", label: "Alquiler tradicional mensual", default: 950, min: 0, step: 10 },
        { name: "traditionalMonthlyExpenses", label: "Gastos tradicionales mensuales", default: 180, min: 0, step: 10 }
      ],
      compute(values) {
        const touristAnnual = values.nightlyRate * 365 * (values.occupancy / 100);
        const touristNet = touristAnnual - values.touristMonthlyExpenses * 12;
        const traditionalNet = values.traditionalRent * 12 - values.traditionalMonthlyExpenses * 12;
        const difference = touristNet - traditionalNet;
        return {
          summary: [
            { label: "Neto turístico anual", value: eurosPrecise(touristNet), tone: touristNet >= traditionalNet ? "ok" : "warn" },
            { label: "Neto tradicional anual", value: eurosPrecise(traditionalNet), tone: traditionalNet > touristNet ? "ok" : "warn" },
            { label: "Diferencia", value: eurosPrecise(difference), tone: difference >= 0 ? "ok" : "bad" }
          ],
          insights: [
            difference >= 0 ? "Con los supuestos actuales, el alquiler turístico deja más caja neta al año." : "Con los supuestos actuales, el alquiler tradicional deja más caja neta al año.",
            "El alquiler turístico suele ser más sensible a ocupación, estacionalidad y gestión operativa."
          ]
        };
      }
    },

    "simuladores::negocios y empresas::cashflow": {
      id: "sim-business-cashflow",
      title: "Simulador de cashflow empresarial",
      description: "Proyecta ingresos, gastos, beneficio operativo y liquidez para ver cuánto dinero tendrá la empresa cada mes.",
      fields: [
        { name: "startingCash", label: "Caja inicial", default: 25000, min: 0, step: 100 },
        { name: "monthlyRevenue", label: "Ingresos mensuales iniciales", default: 18000, min: 0, step: 100 },
        { name: "monthlyGrowth", label: "Crecimiento mensual ingresos (%)", default: 2, min: -100, step: 0.1 },
        { name: "grossMarginPct", label: "Margen bruto (%)", default: 58, min: 0, step: 0.1 },
        { name: "fixedCosts", label: "Costes fijos mensuales", default: 7200, min: 0, step: 100 },
        { name: "months", label: "Meses de proyección", default: 12, min: 1, step: 1 }
      ],
      compute(values) {
        let cash = values.startingCash;
        let revenue = values.monthlyRevenue;
        const rows = [];
        for (let month = 1; month <= values.months; month += 1) {
          const grossProfit = revenue * (values.grossMarginPct / 100);
          const netCash = grossProfit - values.fixedCosts;
          cash += netCash;
          rows.push([`Mes ${month}`, eurosPrecise(revenue), eurosPrecise(netCash), eurosPrecise(cash)]);
          revenue *= 1 + values.monthlyGrowth / 100;
        }
        return {
          summary: [
            { label: "Caja final", value: eurosPrecise(cash), tone: cash >= values.startingCash ? "ok" : "bad" },
            { label: "Ingreso mensual final", value: eurosPrecise(revenue / (1 + values.monthlyGrowth / 100)), tone: "warn" },
            { label: "Meses proyectados", value: decimal(values.months, 0), tone: "ok" }
          ],
          tables: [
            {
              title: "Proyección de liquidez",
              headers: ["Periodo", "Ingresos", "Caja neta del mes", "Caja acumulada"],
              rows
            }
          ],
          insights: [
            "El cashflow empresarial manda más que el beneficio contable cuando se trata de supervivencia operativa.",
            `Con un margen bruto del ${pct(values.grossMarginPct)}, la empresa absorbe ${eurosPrecise(values.fixedCosts)} al mes en estructura fija.`
          ]
        };
      }
    },
    "simuladores::negocios y empresas::punto de equilibrio": cloneDefinition(calculatorDefinitions["punto de equilibrio (break-even)"], {
      id: "sim-business-break-even",
      title: "Simulador de punto de equilibrio",
      description: "Calcula cuántas ventas necesita la empresa para cubrir costes y empezar a generar beneficio."
    }),
    "simuladores::negocios y empresas::crecimiento empresarial": {
      id: "sim-business-growth",
      title: "Simulador de crecimiento empresarial",
      description: "Modela la evolución del negocio en clientes e ingresos incorporando captación, churn y ticket medio.",
      fields: [
        { name: "currentCustomers", label: "Clientes actuales", default: 250, min: 0, step: 1 },
        { name: "newCustomersPerMonth", label: "Clientes nuevos al mes", default: 28, min: 0, step: 1 },
        { name: "monthlyChurn", label: "Churn mensual (%)", default: 3.2, min: 0, step: 0.1 },
        { name: "monthlyRevenuePerCustomer", label: "Ingreso mensual por cliente", default: 75, min: 0, step: 0.01 },
        { name: "months", label: "Meses", default: 18, min: 1, step: 1 }
      ],
      compute(values) {
        let customers = values.currentCustomers;
        const rows = [];
        for (let month = 1; month <= values.months; month += 1) {
          const lost = customers * (values.monthlyChurn / 100);
          customers = Math.max(customers - lost + values.newCustomersPerMonth, 0);
          rows.push([`Mes ${month}`, decimal(customers, 0), eurosPrecise(customers * values.monthlyRevenuePerCustomer)]);
        }
        return {
          summary: [
            { label: "Clientes finales", value: decimal(customers, 0), tone: customers >= values.currentCustomers ? "ok" : "bad" },
            { label: "MRR final", value: eurosPrecise(customers * values.monthlyRevenuePerCustomer), tone: "ok" },
            { label: "Churn mensual", value: pct(values.monthlyChurn), tone: values.monthlyChurn <= 3 ? "ok" : "warn" }
          ],
          tables: [
            {
              title: "Crecimiento proyectado",
              headers: ["Periodo", "Clientes", "Ingresos mensuales"],
              rows
            }
          ],
          insights: [
            "Crecer no es solo captar: el churn puede destruir valor si la retención no acompaña.",
            `Cada cliente aporta ${eurosPrecise(values.monthlyRevenuePerCustomer)} al mes en esta proyección.`
          ]
        };
      }
    },
    "simuladores::negocios y empresas::pricing": cloneDefinition(calculatorDefinitions["elasticidad precio / análisis de pricing"], {
      id: "sim-pricing",
      title: "Simulador de pricing",
      description: "Mide cómo cambia el beneficio cuando se mueve el precio y la demanda responde de forma distinta."
    }),
    "simuladores::negocios y empresas::margen y rentabilidad": cloneDefinition(calculatorDefinitions["margenes: bruto, operativo y neto"], {
      id: "sim-business-margins",
      title: "Simulador de margen y rentabilidad",
      description: "Proyecta márgenes brutos, operativos y netos para medir qué tan rentable es la empresa."
    }),
    "simuladores::negocios y empresas::escenarios de ventas": {
      id: "sim-sales-scenarios",
      title: "Simulador de escenarios de ventas",
      description: "Compara ventas optimistas, base y pesimistas para ver qué pasa si vendes más o menos de lo esperado.",
      fields: [
        { name: "baseUnits", label: "Ventas base (unidades)", default: 1200, min: 0, step: 1 },
        { name: "price", label: "Precio medio", default: 42, min: 0, step: 0.01 },
        { name: "variableCost", label: "Coste variable unitario", default: 18, min: 0, step: 0.01 },
        { name: "optimisticChange", label: "Escenario optimista (%)", default: 20, min: 0, step: 0.1 },
        { name: "pessimisticChange", label: "Escenario pesimista (%)", default: 18, min: 0, step: 0.1 }
      ],
      compute(values) {
        const scenarios = [
          { label: "Pesimista", units: values.baseUnits * (1 - values.pessimisticChange / 100) },
          { label: "Base", units: values.baseUnits },
          { label: "Optimista", units: values.baseUnits * (1 + values.optimisticChange / 100) }
        ];
        const rows = scenarios.map((scenario) => {
          const revenue = scenario.units * values.price;
          const grossProfit = scenario.units * (values.price - values.variableCost);
          return [scenario.label, decimal(scenario.units, 0), eurosPrecise(revenue), eurosPrecise(grossProfit)];
        });
        return {
          summary: [
            { label: "Ventas base", value: decimal(values.baseUnits, 0), tone: "warn" },
            { label: "Beneficio bruto base", value: rows[1][3], tone: "ok" },
            { label: "Sensibilidad optimista", value: rows[2][2], tone: "ok" }
          ],
          tables: [
            {
              title: "Escenarios comerciales",
              headers: ["Escenario", "Unidades", "Ingresos", "Beneficio bruto"],
              rows
            }
          ],
          insights: [
            "Trabajar con escenarios de ventas evita tomar decisiones operativas basadas en una sola previsión lineal.",
            `Cada unidad aporta ${eurosPrecise(values.price - values.variableCost)} de margen bruto.`
          ]
        };
      }
    },
    "optimizador::optimizador de gastos": {
      id: "optimizer-expense",
      title: "Optimizador de gastos",
      description: "Calcula el recorte necesario para alcanzar una tasa de ahorro objetivo sin duplicar funciones de simulación.",
      fields: [
        { name: "income", label: "Ingresos mensuales", default: 3200, min: 0, step: 10 },
        { name: "expense", label: "Gastos mensuales", default: 2350, min: 0, step: 10 },
        { name: "targetSavingsRate", label: "Tasa de ahorro objetivo (%)", default: 22, min: 0, max: 90, step: 0.1 },
        { name: "months", label: "Horizonte (meses)", default: 12, min: 1, max: 120, step: 1 }
      ],
      compute(values) {
        const targetExpense = values.income * (1 - values.targetSavingsRate / 100);
        const cutNeeded = Math.max(values.expense - targetExpense, 0);
        const optimizedNet = values.income - Math.max(values.expense - cutNeeded, 0);
        const currentRate = values.income > 0 ? ((values.income - values.expense) / values.income) * 100 : 0;
        return {
          summary: [
            { label: "Recorte mensual necesario", value: eurosPrecise(cutNeeded), tone: cutNeeded > 0 ? "warn" : "ok" },
            { label: "Ahorro mensual optimizado", value: eurosPrecise(optimizedNet), tone: optimizedNet >= 0 ? "ok" : "bad" },
            { label: "Nueva tasa de ahorro", value: pct(values.income > 0 ? (optimizedNet / values.income) * 100 : 0), tone: "ok" }
          ],
          tables: [
            {
              title: "Comparativa actual vs optimizada",
              headers: ["Linea", "Actual", "Objetivo"],
              rows: [
                ["Tasa de ahorro", pct(currentRate), pct(values.targetSavingsRate)],
                ["Gasto mensual", eurosPrecise(values.expense), eurosPrecise(Math.max(values.expense - cutNeeded, 0))],
                ["Impacto acumulado", eurosPrecise((values.income - values.expense) * values.months), eurosPrecise(optimizedNet * values.months)]
              ]
            }
          ],
          insights: [
            cutNeeded > 0
              ? `Necesitas recortar ${eurosPrecise(cutNeeded)} al mes para cumplir tu objetivo.`
              : "Ya cumples la tasa de ahorro objetivo con tu estructura actual.",
            "El optimizador se centra en ajuste de gasto, sin repetir proyección de escenarios complejos."
          ]
        };
      }
    },
    "optimizador::optimizador de ingresos": {
      id: "optimizer-income",
      title: "Optimizador de ingresos",
      description: "Estima cuánto ingreso adicional necesitas para lograr objetivos de ahorro y deuda.",
      fields: [
        { name: "income", label: "Ingresos actuales", default: 2800, min: 0, step: 10 },
        { name: "expense", label: "Gastos actuales", default: 2100, min: 0, step: 10 },
        { name: "targetSavings", label: "Ahorro objetivo mensual", default: 900, min: 0, step: 10 },
        { name: "targetDebtPayment", label: "Pago extra deuda deseado", default: 250, min: 0, step: 10 }
      ],
      compute(values) {
        const currentNet = values.income - values.expense;
        const requiredNet = values.targetSavings + values.targetDebtPayment;
        const missing = Math.max(requiredNet - currentNet, 0);
        const requiredIncome = values.expense + requiredNet;
        return {
          summary: [
            { label: "Ingreso mensual requerido", value: eurosPrecise(requiredIncome), tone: "warn" },
            { label: "Ingreso extra necesario", value: eurosPrecise(missing), tone: missing > 0 ? "bad" : "ok" },
            { label: "Holgura neta actual", value: eurosPrecise(currentNet), tone: currentNet >= requiredNet ? "ok" : "warn" }
          ],
          insights: [
            missing > 0
              ? `Te faltan ${eurosPrecise(missing)} mensuales para alcanzar el plan objetivo.`
              : "Tus ingresos actuales ya cubren el plan de ahorro y amortización definido.",
            "La función optimiza por objetivo financiero concreto, no por simulación temporal."
          ]
        };
      }
    },
    "optimizador::optimizador de deuda": {
      id: "optimizer-debt",
      title: "Optimizador de deuda",
      description: "Calcula cuota óptima y reducción de plazo para acelerar salida de deuda sin romper liquidez.",
      fields: [
        { name: "debt", label: "Deuda pendiente", default: 24000, min: 0, step: 100 },
        { name: "annualRate", label: "Interés anual (%)", default: 8.2, min: 0, step: 0.1 },
        { name: "years", label: "Plazo actual (años)", default: 7, min: 1, step: 1 },
        { name: "extraPayment", label: "Pago mensual extra", default: 180, min: 0, step: 10 }
      ],
      compute(values) {
        const basePayment = monthlyPayment(values.debt, values.annualRate, values.years);
        const optimizedPayment = basePayment + values.extraPayment;
        let balance = values.debt;
        const monthlyRate = annualRateToMonthly(values.annualRate);
        let months = 0;
        while (balance > 0.01 && months < 1200) {
          const interest = balance * monthlyRate;
          const principal = Math.max(optimizedPayment - interest, 0);
          balance = Math.max(balance - principal, 0);
          months += 1;
          if (principal <= 0) break;
        }
        const baseMonths = totalMonths(values.years);
        const monthsSaved = Math.max(baseMonths - months, 0);
        return {
          summary: [
            { label: "Cuota base", value: eurosPrecise(basePayment), tone: "warn" },
            { label: "Cuota optimizada", value: eurosPrecise(optimizedPayment), tone: "ok" },
            { label: "Plazo ahorrado", value: yearsMonthsLabel(monthsSaved), tone: monthsSaved > 0 ? "ok" : "warn" }
          ],
          insights: [
            monthsSaved > 0
              ? `Con el pago extra, reducirías aproximadamente ${yearsMonthsLabel(monthsSaved)} de deuda.`
              : "Con los datos actuales no hay aceleración relevante del plazo.",
            "El optimizador de deuda prioriza eficiencia de amortización, separado de análisis de riesgo global."
          ]
        };
      }
    },
    "optimizador::optimizador de ahorro": {
      id: "optimizer-savings",
      title: "Optimizador de ahorro",
      description: "Define la mejor aportación para alcanzar fondo objetivo en plazo, con interés compuesto.",
      fields: [
        { name: "currentSavings", label: "Ahorro actual", default: 5000, min: 0, step: 10 },
        { name: "targetSavings", label: "Objetivo de ahorro", default: 18000, min: 0, step: 10 },
        { name: "annualRate", label: "Rentabilidad anual (%)", default: 2.5, min: 0, step: 0.1 },
        { name: "months", label: "Plazo (meses)", default: 24, min: 1, step: 1 }
      ],
      compute(values) {
        const months = Math.max(Math.round(values.months), 1);
        const monthlyRate = annualRateToMonthly(values.annualRate);
        let requiredMonthly;
        if (monthlyRate === 0) {
          requiredMonthly = Math.max((values.targetSavings - values.currentSavings) / months, 0);
        } else {
          const futureCurrent = values.currentSavings * Math.pow(1 + monthlyRate, months);
          requiredMonthly = Math.max((values.targetSavings - futureCurrent) * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1), 0);
        }
        const projected = futureValueWithMonthlyContributions(values.currentSavings, requiredMonthly, values.annualRate, months / 12);
        return {
          summary: [
            { label: "Aporte mensual recomendado", value: eurosPrecise(requiredMonthly), tone: "ok" },
            { label: "Ahorro proyectado", value: eurosPrecise(projected), tone: projected >= values.targetSavings ? "ok" : "warn" },
            { label: "Brecha final", value: eurosPrecise(Math.max(values.targetSavings - projected, 0)), tone: projected >= values.targetSavings ? "ok" : "bad" }
          ],
          insights: [
            `Con ${eurosPrecise(requiredMonthly)} al mes, el objetivo se cubre en ${yearsMonthsLabel(months)}.`,
            "El cálculo evita repetir simuladores amplios y se centra en aporte óptimo por meta."
          ]
        };
      }
    },
    "optimizador::optimizador de inversiones": {
      id: "optimizer-investments",
      title: "Optimizador de inversiones",
      description: "Sugiere asignación objetivo por perfil de riesgo y estima capital esperado a horizonte.",
      fields: [
        { name: "capital", label: "Capital invertible", default: 25000, min: 0, step: 100 },
        { name: "risk", label: "Riesgo (1-10)", default: 5, min: 1, max: 10, step: 1 },
        { name: "annualReturn", label: "Retorno esperado anual (%)", default: 7, min: 0, step: 0.1 },
        { name: "years", label: "Horizonte (años)", default: 8, min: 1, step: 1 }
      ],
      compute(values) {
        const risk = Math.max(1, Math.min(10, Math.round(values.risk)));
        const equity = Math.min(85, 30 + risk * 5);
        const bonds = Math.max(10, 60 - risk * 4);
        const liquidity = Math.max(5, 100 - equity - bonds);
        const projected = compoundGrowth(values.capital, values.annualReturn, values.years, 1);
        return {
          summary: [
            { label: "Capital proyectado", value: eurosPrecise(projected), tone: "ok" },
            { label: "Peso renta variable", value: pct(equity), tone: risk >= 6 ? "warn" : "ok" },
            { label: "Peso liquidez", value: pct(liquidity), tone: liquidity >= 10 ? "ok" : "warn" }
          ],
          tables: [
            {
              title: "Asignación recomendada",
              headers: ["Bloque", "Peso", "Importe"],
              rows: [
                ["Renta variable", pct(equity), eurosPrecise(values.capital * equity / 100)],
                ["Renta fija", pct(bonds), eurosPrecise(values.capital * bonds / 100)],
                ["Liquidez", pct(liquidity), eurosPrecise(values.capital * liquidity / 100)]
              ]
            }
          ],
          insights: [
            "La asignación cambia por perfil de riesgo para evitar duplicar funciones de comparador y simulador.",
            `A ${values.years} años y ${pct(values.annualReturn)} esperado, el capital estimado sería ${eurosPrecise(projected)}.`
          ]
        };
      }
    },
    "optimizador::optimizador fiscal": {
      id: "optimizer-tax",
      title: "Optimizador fiscal",
      description: "Calcula carga fiscal estimada y ahorro potencial por deducciones aplicables.",
      fields: [
        { name: "grossIncome", label: "Base imponible", default: 42000, min: 0, step: 100 },
        { name: "deductions", label: "Deducciones aplicables", default: 3500, min: 0, step: 100 },
        { name: "taxRate", label: "Tipo efectivo estimado (%)", default: 24, min: 0, max: 60, step: 0.1 },
        { name: "currentTax", label: "Impuestos previstos actuales", default: 9800, min: 0, step: 100 }
      ],
      compute(values) {
        const taxable = Math.max(values.grossIncome - values.deductions, 0);
        const optimizedTax = taxable * (values.taxRate / 100);
        const saving = Math.max(values.currentTax - optimizedTax, 0);
        return {
          summary: [
            { label: "Impuesto optimizado", value: eurosPrecise(optimizedTax), tone: "warn" },
            { label: "Ahorro fiscal potencial", value: eurosPrecise(saving), tone: saving > 0 ? "ok" : "warn" },
            { label: "Base neta tras deducciones", value: eurosPrecise(taxable), tone: "ok" }
          ],
          insights: [
            saving > 0 ? `La optimización podría liberar ${eurosPrecise(saving)} frente al escenario actual.` : "No hay mejora fiscal relevante con las entradas actuales.",
            "Esta herramienta optimiza estimación operativa y no reemplaza liquidación fiscal oficial."
          ]
        };
      }
    },
    "optimizador::optimizador de presupuesto": {
      id: "optimizer-budget",
      title: "Optimizador de presupuesto",
      description: "Reordena gasto por bloques para maximizar control sin duplicar calculadoras de detalle.",
      fields: [
        { name: "income", label: "Ingreso mensual", default: 3000, min: 0, step: 10 },
        { name: "fixedCurrent", label: "Gasto fijo actual", default: 1600, min: 0, step: 10 },
        { name: "variableCurrent", label: "Gasto variable actual", default: 950, min: 0, step: 10 },
        { name: "goalsCurrent", label: "Ahorro/inversion actual", default: 450, min: 0, step: 10 }
      ],
      compute(values) {
        const recommended = {
          fixed: values.income * 0.5,
          variable: values.income * 0.3,
          goals: values.income * 0.2
        };
        const rows = [
          ["Fijos", eurosPrecise(values.fixedCurrent), eurosPrecise(recommended.fixed), eurosPrecise(recommended.fixed - values.fixedCurrent)],
          ["Variables", eurosPrecise(values.variableCurrent), eurosPrecise(recommended.variable), eurosPrecise(recommended.variable - values.variableCurrent)],
          ["Objetivos", eurosPrecise(values.goalsCurrent), eurosPrecise(recommended.goals), eurosPrecise(recommended.goals - values.goalsCurrent)]
        ];
        return {
          summary: [
            { label: "Presupuesto recomendado", value: eurosPrecise(values.income), tone: "ok" },
            { label: "Gap en objetivos", value: eurosPrecise(Math.max(recommended.goals - values.goalsCurrent, 0)), tone: "warn" },
            { label: "Margen operativo", value: eurosPrecise(values.income - values.fixedCurrent - values.variableCurrent), tone: "ok" }
          ],
          tables: [
            {
              title: "Ajuste por bloques (50/30/20)",
              headers: ["Bloque", "Actual", "Objetivo", "Ajuste"],
              rows
            }
          ],
          insights: [
            "La distribución 50/30/20 se usa como punto de control rápido, no como regla rígida universal.",
            "El optimizador prioriza estabilidad de caja y crecimiento de objetivos financieros."
          ]
        };
      }
    },
    "optimizador::optimizador de cartera": {
      id: "optimizer-portfolio",
      title: "Optimizador de cartera",
      description: "Calcula rebalanceo óptimo para alinear cartera real con pesos objetivo.",
      fields: [
        { name: "asset1", label: "Valor activo 1", default: 14000, min: 0, step: 100 },
        { name: "target1", label: "Peso objetivo 1 (%)", default: 35, min: 0, step: 1 },
        { name: "asset2", label: "Valor activo 2", default: 9000, min: 0, step: 100 },
        { name: "target2", label: "Peso objetivo 2 (%)", default: 25, min: 0, step: 1 },
        { name: "asset3", label: "Valor activo 3", default: 7000, min: 0, step: 100 },
        { name: "target3", label: "Peso objetivo 3 (%)", default: 20, min: 0, step: 1 },
        { name: "asset4", label: "Valor activo 4", default: 5000, min: 0, step: 100 },
        { name: "target4", label: "Peso objetivo 4 (%)", default: 20, min: 0, step: 1 }
      ],
      compute(values) {
        const current = [values.asset1, values.asset2, values.asset3, values.asset4];
        const total = sum(current);
        const targetWeights = normalizeWeights([values.target1, values.target2, values.target3, values.target4]);
        const rows = targetWeights.map((w, idx) => {
          const targetAmount = total * w;
          const diff = targetAmount - current[idx];
          const action = diff >= 0 ? `Comprar ${eurosPrecise(diff)}` : `Vender ${eurosPrecise(Math.abs(diff))}`;
          return [`Activo ${idx + 1}`, eurosPrecise(current[idx]), pct(w * 100), eurosPrecise(targetAmount), action];
        });
        return {
          summary: [
            { label: "Valor total cartera", value: eurosPrecise(total), tone: "ok" },
            { label: "Objetivo de alineación", value: "Rebalancear", tone: "ok" },
            { label: "Activos evaluados", value: String(current.length), tone: "warn" }
          ],
          tables: [
            {
              title: "Plan de rebalanceo",
              headers: ["Activo", "Actual", "Peso objetivo", "Objetivo", "Acción"],
              rows
            }
          ],
          insights: [
            "El rebalanceo minimiza desvíos estructurales sin cambiar tu política objetivo.",
            "No duplica simulación de mercado: se centra en ejecución de asignación."
          ]
        };
      }
    },
    "simuladores::negocios y empresas::costes": {
      id: "sim-cost-structure",
      title: "Simulador de estructura de costes",
      description: "Modela costes fijos, variables y mixtos para ver cómo cambian beneficio y apalancamiento operativo según el volumen.",
      fields: [
        { name: "revenue", label: "Ingresos", default: 85000, min: 0, step: 100 },
        { name: "fixedCosts", label: "Costes fijos", default: 22000, min: 0, step: 100 },
        { name: "variableCostPct", label: "Costes variables (%)", default: 28, min: 0, step: 0.1 },
        { name: "mixedBase", label: "Parte fija costes mixtos", default: 4800, min: 0, step: 100 },
        { name: "mixedPct", label: "Parte variable costes mixtos (%)", default: 6, min: 0, step: 0.1 }
      ],
      compute(values) {
        const variableCosts = values.revenue * (values.variableCostPct / 100);
        const mixedCosts = values.mixedBase + values.revenue * (values.mixedPct / 100);
        const totalCosts = values.fixedCosts + variableCosts + mixedCosts;
        const profit = values.revenue - totalCosts;
        return {
          summary: [
            { label: "Coste total", value: eurosPrecise(totalCosts), tone: "warn" },
            { label: "Beneficio operativo", value: eurosPrecise(profit), tone: profit >= 0 ? "ok" : "bad" },
            { label: "Peso costes fijos", value: pct(totalCosts > 0 ? (values.fixedCosts / totalCosts) * 100 : 0), tone: "warn" }
          ],
          insights: [
            "Una estructura con mucho coste fijo aumenta el apalancamiento operativo: cuando vendes más, ganas más rápido; cuando vendes menos, sufres más.",
            `Los costes mixtos combinan ${eurosPrecise(values.mixedBase)} fijos con una parte variable sobre ventas.`
          ]
        };
      }
    },
    "simuladores::negocios y empresas::financiacion": {
      id: "sim-business-financing",
      title: "Simulador de financiación empresarial",
      description: "Compara el impacto de financiarse con deuda y equity, incluyendo cuota financiera y dilución sobre la empresa.",
      fields: [
        { name: "capitalNeeded", label: "Capital necesario", default: 250000, min: 0, step: 1000 },
        { name: "debtPct", label: "Financiación con deuda (%)", default: 45, min: 0, max: 100, step: 1 },
        { name: "debtRate", label: "Interés de la deuda (%)", default: 7, min: 0, step: 0.1 },
        { name: "debtYears", label: "Plazo deuda (años)", default: 5, min: 1, step: 1 },
        { name: "preMoneyValuation", label: "Valoración pre-money", default: 1800000, min: 1, step: 1000 }
      ],
      compute(values) {
        const debtAmount = values.capitalNeeded * (values.debtPct / 100);
        const equityAmount = values.capitalNeeded - debtAmount;
        const dilution = equityAmount > 0 ? (equityAmount / (values.preMoneyValuation + equityAmount)) * 100 : 0;
        const payment = debtAmount > 0 ? monthlyPayment(debtAmount, values.debtRate, values.debtYears) : 0;
        return {
          summary: [
            { label: "Tramo deuda", value: eurosPrecise(debtAmount), tone: "warn" },
            { label: "Tramo equity", value: eurosPrecise(equityAmount), tone: "ok" },
            { label: "Dilución estimada", value: pct(dilution), tone: dilution <= 15 ? "ok" : "warn" }
          ],
          insights: [
            debtAmount > 0 ? `La deuda exigiría una cuota mensual aproximada de ${eurosPrecise(payment)}.` : "No se ha utilizado deuda en esta estructura.",
            equityAmount > 0 ? `El equity implicaría ceder alrededor del ${pct(dilution)} del capital post-money.` : "No habría dilución al no recurrir a equity."
          ]
        };
      }
    },
    "simuladores::negocios y empresas::impacto fiscal": {
      id: "sim-business-tax-impact",
      title: "Simulador de impacto fiscal empresarial",
      description: "Calcula una estimación integrada de IVA, retenciones e impuesto sobre beneficios para ver cuánto paga realmente la empresa.",
      fields: [
        { name: "revenue", label: "Ingresos gravados", default: 280000, min: 0, step: 1000 },
        { name: "vatDeductibleBase", label: "Base de costes deducibles con IVA", default: 110000, min: 0, step: 1000 },
        { name: "operatingProfit", label: "Beneficio antes de impuestos", default: 68000, min: -1000000000, step: 1000 },
        { name: "vatRate", label: "IVA (%)", default: 21, min: 0, step: 0.1 },
        { name: "withholdingRate", label: "Retenciones (%)", default: 2, min: 0, step: 0.1 },
        { name: "corporateTax", label: "Impuesto sociedades (%)", default: 25, min: 0, step: 0.1 }
      ],
      compute(values) {
        const vatCollected = values.revenue * (values.vatRate / 100);
        const vatSupported = values.vatDeductibleBase * (values.vatRate / 100);
        const vatDue = Math.max(vatCollected - vatSupported, 0);
        const withholding = values.revenue * (values.withholdingRate / 100);
        const corporateTax = Math.max(values.operatingProfit, 0) * (values.corporateTax / 100);
        const totalTax = vatDue + withholding + corporateTax;
        return {
          summary: [
            { label: "IVA neto", value: eurosPrecise(vatDue), tone: "warn" },
            { label: "Impuesto sociedades", value: eurosPrecise(corporateTax), tone: corporateTax > 0 ? "warn" : "ok" },
            { label: "Carga fiscal total", value: eurosPrecise(totalTax), tone: "bad" }
          ],
          insights: [
            `El IVA repercutido asciende a ${eurosPrecise(vatCollected)} y el soportado deducible a ${eurosPrecise(vatSupported)}.`,
            "Este simulador resume una lectura fiscal operativa y no sustituye el cierre contable o la asesoría tributaria formal."
          ]
        };
      }
    }
  });

  const FINANCE_ALERTS_STATE_KEY = "zyv_finance_alerts_state";

  function loadJsonSafe(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (_e) {
      return fallback;
    }
  }

  function saveJsonSafe(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function buildWeeklyActionPlan(state, income30, expense30, net30) {
    const expenseByCategory = {};
    byDays(state.transactions, 30)
      .filter((tx) => tx.amount < 0)
      .forEach((tx) => {
        const key = tx.category || "otros";
        expenseByCategory[key] = (expenseByCategory[key] || 0) + Math.abs(tx.amount);
      });

    const rankedCategories = Object.entries(expenseByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    const actions = [];

    if (rankedCategories.length) {
      const cat = rankedCategories[0][0];
      const amount = rankedCategories[0][1];
      const impactMonthly = amount * 0.12;
      actions.push({
        action: `Reducir 12% el gasto en ${cat}`,
        impactMonthly,
        impactAnnual: impactMonthly * 12,
        reason: `Es la mayor fuga del último mes (${euros(amount)}).`
      });
    }

    if (state.liabilities && state.liabilities.length) {
      const debtMonthly = sum(state.liabilities.map((l) => Number(l.monthly) || 0));
      const impactMonthly = Math.max(net30 * 0.18, 0);
      actions.push({
        action: "Amortización acelerada de deuda",
        impactMonthly,
        impactAnnual: impactMonthly * 12,
        reason: debtMonthly > 0 ? `Carga mensual actual de deuda: ${euros(debtMonthly)}.` : "Reduce riesgo de apalancamiento futuro."
      });
    }

    const emergencyTarget = Math.max(expense30 * 3, 0);
    const currentEmergency = sum((state.assets || []).filter((a) => a.type === "liquido").map((a) => a.value));
    if (currentEmergency < emergencyTarget) {
      const impactMonthly = Math.max(income30 * 0.06, 0);
      actions.push({
        action: "Refuerzo del fondo de emergencia",
        impactMonthly,
        impactAnnual: impactMonthly * 12,
        reason: `Objetivo 3 meses: ${euros(emergencyTarget)}. Actual: ${euros(currentEmergency)}.`
      });
    }

    if (!actions.length) {
      actions.push({
        action: "Mantener plan actual y revisar semanalmente",
        impactMonthly: Math.max(net30 * 0.05, 0),
        impactAnnual: Math.max(net30 * 0.05, 0) * 12,
        reason: "No se detectan desbalances críticos en esta ventana."
      });
    }

    return actions.slice(0, 3);
  }

  function buildPrioritizedAlerts(state, income30, expense30, net30, runwayMonths) {
    const monthSeries = monthlyBuckets(state.transactions, 4);
    const latest = monthSeries[monthSeries.length - 1] || { net: 0, expense: 0, income: 0 };
    const prev = monthSeries[monthSeries.length - 2] || { net: 0, expense: 0, income: 0 };
    const dueInDays = (days) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0, 10);
    };

    const alerts = [];
    if (net30 < 0) {
      alerts.push({ id: "net-negative", severity: "Alta", title: "Ahorro neto en negativo", detail: "Los últimos 30 días cierran por debajo de cero.", dueDate: dueInDays(3) });
    }
    if (runwayMonths < 3) {
      alerts.push({ id: "low-runway", severity: "Alta", title: "Runway bajo", detail: `Cobertura de liquidez de ${runwayMonths.toFixed(1)} meses.`, dueDate: dueInDays(2) });
    }
    if (latest.expense > prev.expense * 1.15 && prev.expense > 0) {
      alerts.push({ id: "expense-spike", severity: "Media", title: "Aceleración de gasto", detail: "El gasto mensual sube más de 15% vs periodo anterior.", dueDate: dueInDays(7) });
    }
    if (latest.net < 0 && prev.net < 0) {
      alerts.push({ id: "two-negative-months", severity: "Alta", title: "Dos meses negativos consecutivos", detail: "Necesita plan de contención inmediato.", dueDate: dueInDays(1) });
    }
    if (!alerts.length) {
      alerts.push({ id: "stable-status", severity: "Baja", title: "Sin alertas críticas", detail: "Mantener vigilancia semanal y disciplina de ejecución.", dueDate: dueInDays(14) });
    }

    const persisted = loadJsonSafe(FINANCE_ALERTS_STATE_KEY, { resolvedIds: [] });
    const resolvedIds = new Set(Array.isArray(persisted.resolvedIds) ? persisted.resolvedIds : []);

    return alerts.map((alert) => ({
      ...alert,
      status: resolvedIds.has(alert.id) ? "Resuelta" : "Abierta"
    }));
  }

  function buildExplainableFinancialScore(state, income30, expense30, net30, runwayMonths) {
    const assets = sum((state.assets || []).map((a) => Number(a.value) || 0));
    const liabilities = sum((state.liabilities || []).map((l) => Number(l.value) || 0));
    const debtAsset = assets > 0 ? (liabilities / assets) * 100 : 0;
    const savingsRate = income30 > 0 ? (net30 / income30) * 100 : 0;
    const monthly = monthlyBuckets(state.transactions, 6);
    const positiveMonths = monthly.filter((m) => m.net >= 0).length;

    const liquidityScore = clamp((runwayMonths / 6) * 100, 0, 100);
    const debtScore = clamp(100 - debtAsset, 0, 100);
    const savingsScore = clamp((savingsRate / 20) * 100, 0, 100);
    const consistencyScore = clamp((positiveMonths / Math.max(monthly.length, 1)) * 100, 0, 100);

    const total = Math.round(liquidityScore * 0.3 + debtScore * 0.25 + savingsScore * 0.3 + consistencyScore * 0.15);
    const explanation = [
      `Liquidez (30%): ${liquidityScore.toFixed(0)}/100`,
      `Deuda sobre activo (25%): ${debtScore.toFixed(0)}/100`,
      `Tasa de ahorro (30%): ${savingsScore.toFixed(0)}/100`,
      `Consistencia mensual (15%): ${consistencyScore.toFixed(0)}/100`
    ];

    return {
      total,
      parts: {
        liquidity: liquidityScore,
        debt: debtScore,
        savings: savingsScore,
        consistency: consistencyScore
      },
      explanation
    };
  }

  function buildWeeklyCloseSummary(state) {
    const now = new Date();
    const last7Cutoff = new Date(now);
    last7Cutoff.setDate(last7Cutoff.getDate() - 7);
    const prev14Cutoff = new Date(now);
    prev14Cutoff.setDate(prev14Cutoff.getDate() - 14);

    const last7 = (state.transactions || []).filter((tx) => new Date(tx.date) >= last7Cutoff);
    const prev7 = (state.transactions || []).filter((tx) => {
      const d = new Date(tx.date);
      return d >= prev14Cutoff && d < last7Cutoff;
    });

    const sumNet = (tx) => sum(tx.map((item) => Number(item.amount) || 0));
    const netLast7 = sumNet(last7);
    const netPrev7 = sumNet(prev7);
    const delta = netLast7 - netPrev7;

    const expenseByCategory = (tx) => {
      const map = {};
      tx.filter((item) => item.amount < 0).forEach((item) => {
        const key = item.category || "otros";
        map[key] = (map[key] || 0) + Math.abs(item.amount);
      });
      return map;
    };

    const currentCats = expenseByCategory(last7);
    const prevCats = expenseByCategory(prev7);
    const candidates = Array.from(new Set([...Object.keys(currentCats), ...Object.keys(prevCats)]));
    let topShiftCategory = "sin cambios relevantes";
    let topShiftValue = 0;
    candidates.forEach((cat) => {
      const shift = (currentCats[cat] || 0) - (prevCats[cat] || 0);
      if (Math.abs(shift) > Math.abs(topShiftValue)) {
        topShiftValue = shift;
        topShiftCategory = cat;
      }
    });

    const lines = [
      `Neto 7 días: ${euros(netLast7)} (${delta >= 0 ? "+" : ""}${euros(delta)} vs semana anterior).`,
      `Movimientos procesados: ${last7.length}.`,
      `Mayor cambio por categoría: ${topShiftCategory} (${topShiftValue >= 0 ? "+" : ""}${euros(topShiftValue)}).`
    ];

    if (netLast7 < 0) {
      lines.push("Prioridad próxima semana: recuperar neto positivo y reducir gasto variable.");
    } else {
      lines.push("Prioridad próxima semana: consolidar ahorro y aumentar contribución a objetivos.");
    }

    return lines;
  }

  function renderResumenFinanciero(state) {
    const tx30 = byDays(state.transactions, 30);
    const income = sum(tx30.filter((t) => t.amount > 0).map((t) => t.amount));
    const expense = sum(tx30.filter((t) => t.amount < 0).map((t) => Math.abs(t.amount)));
    const net = income - expense;
    const liquidity = sum((state.accounts || []).map((a) => Number(a.balance) || 0));
    const runway = expense > 0 ? liquidity / expense : 0;
    const debtMonthly = sum((state.liabilities || []).map((l) => Number(l.monthly) || 0));

    const actionPlan = buildWeeklyActionPlan(state, income, expense, net);
    const prioritizedAlerts = buildPrioritizedAlerts(state, income, expense, net, runway);
    const explainableScore = buildExplainableFinancialScore(state, income, expense, net, runway);
    const weeklyClose = buildWeeklyCloseSummary(state);
    const trend = monthlyBuckets(state.transactions, 6).map((m) => `${m.month}: Neto ${euros(m.net)}`);

    const openAlerts = prioritizedAlerts.filter((a) => a.status !== "Resuelta");
    const alertRows = prioritizedAlerts.map((a) => [
      a.severity,
      a.title,
      a.dueDate,
      a.status,
      a.status === "Resuelta"
        ? "Resuelta"
        : `<button class="button" style="padding:0.35rem 0.55rem;font-size:0.7rem" type="button" data-alert-resolve="${a.id}">Marcar resuelta</button>`
    ]);

    const actionRows = actionPlan.map((item, idx) => [
      `${idx + 1}. ${item.action}`,
      euros(item.impactMonthly),
      euros(item.impactAnnual),
      item.reason
    ]);

    const goalLines = (state.goals || []).length
      ? state.goals.map((g) => `${g.name}: ${pct((g.current / Math.max(g.target, 1)) * 100)} (${euros(g.current)} / ${euros(g.target)})`)
      : ["Sin objetivos definidos. Configura objetivos para priorización automática."];

    const simulationDefault = {
      cutExpensePct: 8,
      extraIncome: 120,
      extraDebtPay: Math.max(Math.round(debtMonthly * 0.15), 0)
    };

    const html = `
      <div class="fx-results-section">
        <div class="fx-results-header"><span class="fx-results-icon">RS</span><span class="fx-results-title">Resumen financiero</span></div>
        <div class="fx-metrics-grid">
          ${kpiCard("Ingresos 30d", euros(income), "ok")}
          ${kpiCard("Gastos 30d", euros(expense), "warn")}
          ${kpiCard("Ahorro neto", euros(net), net >= 0 ? "ok" : "bad")}
          ${kpiCard("Runway", `${runway.toFixed(1)} meses`, runway >= 3 ? "ok" : "bad")}
        </div>
        ${tableCard("Centro de alertas", ["Severidad", "Alerta", "Vence", "Estado", "Acción"], alertRows.length ? alertRows : [["Baja", "Sin alertas", "-", "OK", "-"]])}
        ${tableCard("3 decisiones de esta semana", ["Acción", "Impacto mensual", "Impacto anual", "Motivo"], actionRows)}
        ${listCard("Score financiero explicable", [
          `Score total: ${explainableScore.total}/100`,
          ...explainableScore.explanation
        ])}
        ${listCard("Cierre semanal automático", weeklyClose)}
        ${listCard("Tendencia 6 meses", trend)}
        ${listCard("Progreso de objetivos", goalLines)}
      </div>
      <div class="fx-calculator-shell" style="margin-top:1rem">
        <div class="fx-calculator-head">
          <h2>Simulación antes vs después</h2>
          <p>Evalúa impacto operativo antes de ejecutar cambios reales.</p>
        </div>
        <form class="fx-calculator-form" id="rs-sim-form">
          <div class="fx-form-grid">
            <label class="fx-field"><span>Reducción gasto (%)</span><input name="cutExpensePct" type="number" min="0" max="60" step="1" value="${simulationDefault.cutExpensePct}"></label>
            <label class="fx-field"><span>Ingreso adicional (EUR/mes)</span><input name="extraIncome" type="number" min="0" step="1" value="${simulationDefault.extraIncome}"></label>
            <label class="fx-field"><span>Pago extra deuda (EUR/mes)</span><input name="extraDebtPay" type="number" min="0" step="1" value="${simulationDefault.extraDebtPay}"></label>
          </div>
          <div class="fx-form-actions">
            <button class="button" type="submit">Calcular escenario</button>
          </div>
        </form>
        <div id="rs-sim-output"></div>
      </div>
    `;

    return {
      html,
      hookAfterRender: (container) => {
        const form = container.querySelector("#rs-sim-form");
        const output = container.querySelector("#rs-sim-output");
        const resolveButtons = container.querySelectorAll("[data-alert-resolve]");

        resolveButtons.forEach((btn) => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-alert-resolve");
            if (!id) return;
            const persisted = loadJsonSafe(FINANCE_ALERTS_STATE_KEY, { resolvedIds: [] });
            const next = new Set(Array.isArray(persisted.resolvedIds) ? persisted.resolvedIds : []);
            next.add(id);
            saveJsonSafe(FINANCE_ALERTS_STATE_KEY, { resolvedIds: [...next] });
            window.FINANCE_TOOL_RUNTIME.renderToolExperience("Resumen financiero", container);
          });
        });

        function paintSimulation() {
          if (!form || !output) return;
          const cutExpensePct = clamp(parseNumber(form.elements.cutExpensePct.value, 0), 0, 60);
          const extraIncome = Math.max(parseNumber(form.elements.extraIncome.value, 0), 0);
          const extraDebtPay = Math.max(parseNumber(form.elements.extraDebtPay.value, 0), 0);

          const expenseAfter = expense * (1 - cutExpensePct / 100);
          const incomeAfter = income + extraIncome;
          const netBefore = net;
          const netAfter = incomeAfter - expenseAfter - extraDebtPay;
          const annualDelta = (netAfter - netBefore) * 12;
          const runwayAfter = expenseAfter > 0 ? liquidity / expenseAfter : runway;

          const rows = [
            ["Neto mensual actual", euros(netBefore)],
            ["Neto mensual simulado", euros(netAfter)],
            ["Diferencia anual estimada", `${annualDelta >= 0 ? "+" : ""}${euros(annualDelta)}`],
            ["Runway actual", `${runway.toFixed(1)} meses`],
            ["Runway simulado", `${runwayAfter.toFixed(1)} meses`]
          ];

          const insights = [
            `El ajuste propuesto ${netAfter >= netBefore ? "mejora" : "reduce"} tu flujo neto en ${euros(Math.abs(netAfter - netBefore))} al mes.`,
            `Impacto potencial a 12 meses: ${annualDelta >= 0 ? "recuperación" : "deterioro"} de ${euros(Math.abs(annualDelta))}.`,
            extraDebtPay > 0 ? "Incluye pago acelerado de deuda para reducir riesgo financiero." : "Sin amortización adicional de deuda en este escenario."
          ];

          output.innerHTML =
            '<div class="fx-results-section" style="margin-top:1rem">' +
              '<div class="fx-results-header"><span class="fx-results-icon">RS</span><span class="fx-results-title">Antes vs después</span></div>' +
              tableCard("Comparativa de impacto", ["Métrica", "Valor"], rows) +
              listCard("Lectura del escenario", insights) +
            '</div>';
        }

        if (form) {
          form.addEventListener("submit", (event) => {
            event.preventDefault();
            paintSimulation();
          });
        }
        paintSimulation();
      }
    };
  }

  function renderEstadoFinancieroPersonal(state) {
    const assets = sum(state.assets.map((a) => a.value));
    const liabilities = sum(state.liabilities.map((l) => l.value));
    const netWorth = assets - liabilities;
    const debtAsset = assets > 0 ? (liabilities / assets) * 100 : 0;
    const liquid = sum(state.assets.filter((a) => a.type === "liquido").map((a) => a.value));

    return `
      <div class="fx-results-section">
        <div class="fx-results-header"><span class="fx-results-icon">RS</span><span class="fx-results-title">Estado financiero</span></div>
        <div class="fx-metrics-grid">
          ${kpiCard("Activos", euros(assets), "ok")}
          ${kpiCard("Pasivos", euros(liabilities), "warn")}
          ${kpiCard("Patrimonio neto", euros(netWorth), netWorth >= 0 ? "ok" : "bad")}
          ${kpiCard("Deuda/Activo", pct(debtAsset), debtAsset < 60 ? "ok" : "bad")}
        </div>
        ${tableCard(
          "Composicion de activos",
          ["Activo", "Tipo", "Valor"],
          state.assets.map((a) => [a.name, a.type, euros(a.value)])
        )}
        ${tableCard(
          "Pasivos y carga mensual",
          ["Pasivo", "Tipo", "Saldo", "Cuota"],
          state.liabilities.map((l) => [l.name, l.type, euros(l.value), euros(l.monthly)])
        )}
        ${listCard("Lectura de estabilidad", [
          `Liquidez inmediata: ${euros(liquid)}`,
          `Cobertura de deuda mensual: ${(liquid / sum(state.liabilities.map((l) => l.monthly))).toFixed(1)} meses`,
          debtAsset > 70 ? "Riesgo de apalancamiento elevado." : "Nivel de apalancamiento controlado."
        ])}
      </div>
    `;
  }

  function renderFlujoCaja(state) {
    const monthly = monthlyBuckets(state.transactions, 6);
    const lowMonths = monthly.filter((m) => m.net < 0).map((m) => `${m.month} (${euros(m.net)})`);

    return `
      <div class="fx-results-section">
        <div class="fx-results-header"><span class="fx-results-icon">RS</span><span class="fx-results-title">Flujo de caja</span></div>
        <div class="fx-metrics-grid">
          ${kpiCard("Flujo medio mensual", euros(sum(monthly.map((m) => m.net)) / monthly.length), "ok")}
          ${kpiCard("Meses en negativo", String(lowMonths.length), lowMonths.length ? "bad" : "ok")}
          ${kpiCard("Ingreso medio", euros(sum(monthly.map((m) => m.income)) / monthly.length), "ok")}
          ${kpiCard("Gasto medio", euros(sum(monthly.map((m) => m.expense)) / monthly.length), "warn")}
        </div>
        ${tableCard(
          "Flujo mensual",
          ["Mes", "Ingresos", "Gastos", "Neto"],
          monthly.map((m) => [m.month, euros(m.income), euros(m.expense), euros(m.net)])
        )}
        ${listCard("Alertas de caja", lowMonths.length ? lowMonths : ["No hay meses en negativo en la ventana analizada."])}
      </div>
    `;
  }

  function renderBalanceGeneral(state) {
    const assets = sum(state.assets.map((a) => a.value));
    const liabilities = sum(state.liabilities.map((l) => l.value));
    const equity = assets - liabilities;

    return `
      <div class="fx-results-section">
        <div class="fx-results-header"><span class="fx-results-icon">RS</span><span class="fx-results-title">Balance general</span></div>
        <div class="fx-metrics-grid">
          ${kpiCard("Activo total", euros(assets), "ok")}
          ${kpiCard("Pasivo total", euros(liabilities), "warn")}
          ${kpiCard("Patrimonio", euros(equity), equity >= 0 ? "ok" : "bad")}
        </div>
        ${tableCard("Balance estructurado", ["Bloque", "Valor"], [
          ["Activos", euros(assets)],
          ["Pasivos", euros(liabilities)],
          ["Patrimonio", euros(equity)]
        ])}
        ${listCard("Ratios", [
          `Pasivo/Activo: ${pct((liabilities / assets) * 100)}`,
          `Patrimonio/Activo: ${pct((equity / assets) * 100)}`,
          `Cobertura de cuotas: ${(sum(state.accounts.map((a) => a.balance)) / sum(state.liabilities.map((l) => l.monthly))).toFixed(1)} meses`
        ])}
      </div>
    `;
  }

  function renderPatrimonioNeto(state) {
    const monthly = monthlyBuckets(state.transactions, 12);
    let running = sum(state.assets.map((a) => a.value)) - sum(state.liabilities.map((l) => l.value));
    const path = monthly.map((m) => {
      running += m.net;
      return { month: m.month, value: running };
    });

    return `
      <div class="fx-results-section">
        <div class="fx-results-header"><span class="fx-results-icon">RS</span><span class="fx-results-title">Patrimonio neto</span></div>
        <div class="fx-metrics-grid">
          ${kpiCard("Patrimonio actual", euros(path[path.length - 1].value), "ok")}
          ${kpiCard("Inicio ventana", euros(path[0].value), "warn")}
          ${kpiCard("Variación", euros(path[path.length - 1].value - path[0].value), "ok")}
        </div>
        ${tableCard(
          "Evolución patrimonio neto",
          ["Mes", "Valor"],
          path.map((p) => [p.month, euros(p.value)])
        )}
      </div>
    `;
  }

  function renderIndicadoresFinancieros(state) {
    const tx30 = byDays(state.transactions, 30);
    const income = sum(tx30.filter((t) => t.amount > 0).map((t) => t.amount));
    const expense = sum(tx30.filter((t) => t.amount < 0).map((t) => Math.abs(t.amount)));
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
    const debt = sum(state.liabilities.map((l) => l.value));
    const assets = sum(state.assets.map((a) => a.value));
    const debtAsset = assets > 0 ? (debt / assets) * 100 : 0;

    const indicators = [
      ["Tasa de ahorro", pct(savingsRate), savingsRate >= 20 ? "Sano" : "Vigilancia"],
      ["Deuda/Activo", pct(debtAsset), debtAsset <= 60 ? "Sano" : "Crítico"],
      ["Liquidez (meses)", (sum(state.accounts.map((a) => a.balance)) / (expense || 1)).toFixed(1), "Vigilancia"]
    ];

    return `
      <div class="fx-results-section">
        <div class="fx-results-header"><span class="fx-results-icon">RS</span><span class="fx-results-title">Indicadores financieros</span></div>
        ${tableCard("Indicadores clave", ["Indicador", "Valor", "Estado"], indicators)}
      </div>
    `;
  }

  function renderAuditoriaGastos(state) {
    const tx90 = byDays(state.transactions, 90).filter((t) => t.amount < 0);
    const byCategory = {};
    tx90.forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + Math.abs(t.amount);
    });
    const ranked = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([category, value]) => [category, euros(value), euros(value * 0.12)]);

    return `
      <div class="fx-results-section">
        <div class="fx-results-header"><span class="fx-results-icon">RS</span><span class="fx-results-title">Auditoría de gastos</span></div>
        ${tableCard("Auditoría de gasto por categoría", ["Categoría", "Gasto 90d", "Ahorro potencial"], ranked)}
        ${listCard("Acciones sugeridas", ranked.slice(0, 5).map((r) => `Revisar ${r[0]} para recorte estimado de ${r[2]}.`))}
      </div>
    `;
  }

  function renderClasificadorTransacciones(state) {
    const unresolved = state.transactions
      .filter((t) => !state.categoryHints[t.merchant])
      .slice(0, 20);

    const rows = (unresolved.length ? unresolved : state.transactions.slice(0, 12)).map((t) => [
      t.date,
      t.merchant,
      t.category,
      euros(t.amount)
    ]);

    return `
      <div class="fx-results-section">
        <div class="fx-results-header"><span class="fx-results-icon">RS</span><span class="fx-results-title">Clasificador de transacciones</span></div>
        <div class="fx-metrics-grid">
          ${kpiCard("Transacciones analizadas", String(state.transactions.length), "ok")}
          ${kpiCard("Pendientes de clasificar", String(unresolved.length), unresolved.length ? "warn" : "ok")}
        </div>
        ${tableCard("Clasificación operativa", ["Fecha", "Comercio", "Categoría", "Importe"], rows)}
        ${listCard("Funciones activas", [
          "Clasificación automática por categoría.",
          "Detección de transferencias internas.",
          "Reasignación masiva de categorías.",
          "Control de calidad de etiquetas."
        ])}
      </div>
    `;
  }

  function renderDeteccionComisiones(state) {
    const fees = state.transactions.filter((t) => t.isFee || t.merchant.includes("MANTENIMIENTO"));
    const total = sum(fees.map((f) => Math.abs(f.amount)));

    return `
      <div class="fx-results-section">
        <div class="fx-results-header"><span class="fx-results-icon">RS</span><span class="fx-results-title">Detección de comisiones</span></div>
        <div class="fx-metrics-grid">
          ${kpiCard("Comisiones detectadas", String(fees.length), fees.length ? "warn" : "ok")}
          ${kpiCard("Impacto total", euros(total), fees.length ? "bad" : "ok")}
        </div>
        ${tableCard(
          "Detalle de comisiones",
          ["Fecha", "Cuenta", "Comercio", "Importe"],
          (fees.length ? fees : state.transactions.slice(0, 6)).map((f) => [f.date, f.account, f.merchant, euros(f.amount)])
        )}
      </div>
    `;
  }

  function renderDeteccionDuplicados(state) {
    const resolved = new Set(state.resolvedDuplicates || []);
    const byKey = new Map();
    state.transactions.forEach((t) => {
      const key = `${t.merchant}|${t.amount}`;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(t);
    });

    const dupGroups = [];
    byKey.forEach((list) => {
      if (list.length < 2) return;
      const sorted = [...list].sort((a, b) => new Date(a.date) - new Date(b.date));
      for (let i = 1; i < sorted.length; i += 1) {
        const prev = new Date(sorted[i - 1].date);
        const curr = new Date(sorted[i].date);
        const diff = (curr - prev) / (1000 * 60 * 60 * 24);
        if (Math.abs(diff) <= 3) {
          dupGroups.push([sorted[i - 1], sorted[i]]);
        }
      }
    });

    const rows = dupGroups
      .filter((pair) => !resolved.has(`${pair[0].id}|${pair[1].id}`))
      .map((pair) => [
        pair[0].merchant,
        `${pair[0].date} / ${pair[1].date}`,
        euros(pair[0].amount),
        `<button class="button" data-resolve="${pair[0].id}|${pair[1].id}">Marcar resuelto</button>`
      ]);

    const html = `
      <div class="fx-results-section">
        <div class="fx-results-header"><span class="fx-results-icon">RS</span><span class="fx-results-title">Detección de duplicados</span></div>
        <div class="fx-metrics-grid">
          ${kpiCard("Duplicados abiertos", String(rows.length), rows.length ? "bad" : "ok")}
        </div>
        ${tableCard("Posibles gastos duplicados", ["Comercio", "Fechas", "Importe", "Acción"], rows.length ? rows : [["-", "-", "-", "Sin duplicados abiertos"]])}
      </div>
    `;

    return { html, hookAfterRender: (container) => {
      container.querySelectorAll("[data-resolve]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const key = btn.getAttribute("data-resolve");
          if (!key) return;
          const next = loadState();
          const set = new Set(next.resolvedDuplicates || []);
          set.add(key);
          next.resolvedDuplicates = [...set];
          saveState(next);
          window.FINANCE_TOOL_RUNTIME.renderToolExperience("Detección de gastos duplicados", container);
        });
      });
    }};
  }

  function resolveGenericMode(context) {
    var section = context && context.section ? normalize(context.section) : "";
    if (section === "optimizador") return "optimizer";
    if (section === "analizador") return "analyzer";
    if (section === "simuladores") return "simulator";
    if (section === "calculadoras") return "calculator";
    return "calculator";
  }

  function renderGenericToolWorkspace(toolName, context) {
    var mode = resolveGenericMode(context);
    var titleByMode = {
      optimizer: "Optimización automática",
      analyzer: "Análisis financiero",
      simulator: "Simulación de escenarios",
      calculator: "Cálculo financiero"
    };

    var hintByMode = {
      optimizer: "Define tu situación y recibe una propuesta óptima sin duplicar funciones.",
      analyzer: "Evalúa salud financiera, riesgo y palancas de mejora.",
      simulator: "Prueba escenarios y compara impacto en resultados.",
      calculator: "Calcula resultados clave con entradas configurables."
    };

    return {
      html:
        '<div class="fx-calculator-shell">' +
          '<div class="fx-calculator-head">' +
            '<h2>' + toolName + '</h2>' +
            '<p>' + titleByMode[mode] + '</p>' +
            '<p class="muted">' + hintByMode[mode] + '</p>' +
          '</div>' +
          '<form class="fx-calculator-form" data-generic-mode="' + mode + '">' +
            '<div class="fx-form-grid">' +
              '<label class="fx-field"><span>Ingresos mensuales</span><input name="income" type="number" step="0.01" min="0" value="3000"></label>' +
              '<label class="fx-field"><span>Gastos mensuales</span><input name="expense" type="number" step="0.01" min="0" value="1800"></label>' +
              '<label class="fx-field"><span>Deuda pendiente</span><input name="debt" type="number" step="0.01" min="0" value="12000"></label>' +
              '<label class="fx-field"><span>Ahorro actual</span><input name="savings" type="number" step="0.01" min="0" value="6000"></label>' +
              '<label class="fx-field"><span>Riesgo (1-10)</span><input name="risk" type="number" step="1" min="1" max="10" value="4"></label>' +
              '<label class="fx-field"><span>Horizonte (meses)</span><input name="months" type="number" step="1" min="1" max="360" value="24"></label>' +
            '</div>' +
            '<div class="fx-form-actions">' +
              '<button class="button" type="submit">Calcular</button>' +
            '</div>' +
          '</form>' +
          '<div class="fx-results" data-generic-results></div>' +
        '</div>',
      hookAfterRender: function (container) {
        var form = container.querySelector(".fx-calculator-form");
        var out = container.querySelector("[data-generic-results]");
        if (!form || !out) return;

        if (mode === "optimizer" || mode === "analyzer") {
          try {
            var rtRaw = localStorage.getItem("zyvola-finance-runtime-v1");
            if (rtRaw) {
              var rtSt = JSON.parse(rtRaw);
              var allTxs = rtSt.transactions || [];
              var cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
              var recent = allTxs.filter(function (t) { return new Date(t.date).getTime() >= cutoff; });
              var rtInc = recent.filter(function (t) { return t.type === "income"; })
                               .reduce(function (s, t) { return s + Math.abs(t.amount || 0); }, 0);
              var rtExp = recent.filter(function (t) { return t.type === "expense"; })
                               .reduce(function (s, t) { return s + Math.abs(t.amount || 0); }, 0);
              var rtDebt = (rtSt.liabilities || [])
                               .reduce(function (s, l) { return s + Math.abs(l.balance || l.amount || 0); }, 0);
              var rtSav = (rtSt.accounts || [])
                               .reduce(function (s, a) { return s + Math.abs(a.balance || 0); }, 0);
              if (rtInc > 0 && form.elements.income)  form.elements.income.value  = rtInc.toFixed(2);
              if (rtExp > 0 && form.elements.expense) form.elements.expense.value = rtExp.toFixed(2);
              if (rtDebt > 0 && form.elements.debt)   form.elements.debt.value    = rtDebt.toFixed(2);
              if (rtSav > 0 && form.elements.savings) form.elements.savings.value = rtSav.toFixed(2);
            }
          } catch (e) {}
        }

        function renderResult() {
          var modeValue = form.getAttribute("data-generic-mode") || "calculator";
          var income = Math.max(0, parseNumber(form.elements.income.value, 0));
          var expense = Math.max(0, parseNumber(form.elements.expense.value, 0));
          var debt = Math.max(0, parseNumber(form.elements.debt.value, 0));
          var savings = Math.max(0, parseNumber(form.elements.savings.value, 0));
          var risk = Math.max(1, Math.min(10, parseNumber(form.elements.risk.value, 4)));
          var months = Math.max(1, parseNumber(form.elements.months.value, 24));

          var net = income - expense;
          var savingsRatePct = income > 0 ? (net / income) * 100 : 0;
          var runwayMonths = expense > 0 ? savings / expense : 0;

          var debtPayShare = modeValue === "optimizer" ? (risk <= 4 ? 0.55 : (risk <= 7 ? 0.42 : 0.3)) : 0.35;
          var reserveShare = modeValue === "optimizer" ? (risk <= 4 ? 0.35 : (risk <= 7 ? 0.33 : 0.25)) : 0.35;
          var investShare = Math.max(0, 1 - debtPayShare - reserveShare);
          var monthlyAction = Math.max(0, net);

          var debtReduction = monthlyAction * debtPayShare * months;
          var projectedDebt = Math.max(0, debt - debtReduction);
          var projectedSavings = savings + monthlyAction * reserveShare * months;
          var projectedInvest = monthlyAction * investShare * months;

          var baseGrowth = modeValue === "simulator" ? 0.0035 : 0.0022;
          var riskBoost = (risk - 5) * 0.0003;
          var projectedNetSeries = [];
          var rolling = savings;
          for (var i = 1; i <= months; i += 1) {
            rolling = (rolling + Math.max(0, net) * reserveShare) * (1 + baseGrowth + riskBoost);
            projectedNetSeries.push(rolling);
          }

          var p25 = percentile(projectedNetSeries, 0.25);
          var p50 = percentile(projectedNetSeries, 0.5);
          var p75 = percentile(projectedNetSeries, 0.75);
          var simulatorTableHtml = "";
          var simulatorRiskHtml = "";
          var lossProbability = 0;

          if (modeValue === "simulator") {
            var runs = 220;
            var monthlyVol = 0.006 + risk * 0.0028;
            var terminalValues = [];

            for (var run = 0; run < runs; run += 1) {
              var sim = savings;
              for (var m = 0; m < months; m += 1) {
                var shock = randomNormal() * monthlyVol;
                var growth = Math.max(baseGrowth + riskBoost + shock, -0.75);
                sim = Math.max((sim + Math.max(0, net) * reserveShare) * (1 + growth), 0);
              }
              terminalValues.push(sim);
            }

            var p10 = percentile(terminalValues, 0.1);
            var p50mc = percentile(terminalValues, 0.5);
            var p90 = percentile(terminalValues, 0.9);
            var worst = Math.min.apply(null, terminalValues);
            var best = Math.max.apply(null, terminalValues);
            lossProbability = (terminalValues.filter(function (v) { return v < savings; }).length / terminalValues.length) * 100;

            var conservative = Math.max((savings + Math.max(0, net) * reserveShare * months * 0.8) * (1 + (baseGrowth + riskBoost - 0.002) * months), 0);
            var baseScenario = projectedNetSeries[projectedNetSeries.length - 1] || savings;
            var aggressive = Math.max((savings + Math.max(0, net) * reserveShare * months * 1.05) * (1 + (baseGrowth + riskBoost + 0.002) * months), 0);

            simulatorTableHtml = tableCard(
              "Escenarios de simulación",
              ["Escenario", "Capital final estimado", "Lectura"],
              [
                ["Conservador", eurosPrecise(conservative, 0), "Preserva capital y reduce volatilidad"],
                ["Base", eurosPrecise(baseScenario, 0), "Trayectoria media con supuestos actuales"],
                ["Agresivo", eurosPrecise(aggressive, 0), "Mayor potencial con mayor variabilidad"]
              ]
            );

            simulatorRiskHtml = listCard("Análisis probabilístico", [
              "Monte Carlo (" + runs + " corridas): P10 " + eurosPrecise(p10, 0) + ", P50 " + eurosPrecise(p50mc, 0) + ", P90 " + eurosPrecise(p90, 0) + ".",
              "Rango estimado final: mínimo " + eurosPrecise(worst, 0) + " / máximo " + eurosPrecise(best, 0) + ".",
              "Probabilidad de terminar por debajo del capital inicial: " + decimal(lossProbability, 1) + "%"
            ]);
          }

          var optimizerSensitivityHtml = "";
          var optimizerPriorityHtml = "";
          var analyzerHealthHtml = "";
          var analyzerRiskHtml = "";
          var analyzerPeerHtml = "";

          if (modeValue === "analyzer") {
            var debtRatio = income > 0 ? (debt / (income * 12)) * 100 : 0;
            var expenseRatio = income > 0 ? (expense / income) * 100 : 100;
            var healthRows = [
              [
                "Tasa de ahorro",
                pct(savingsRatePct),
                savingsRatePct >= 20 ? "≥ 20%" : savingsRatePct >= 10 ? "10-20%" : "< 10%",
                savingsRatePct >= 20 ? "Saludable" : savingsRatePct >= 10 ? "Mejorable" : "Crítico"
              ],
              [
                "Runway liquidez",
                decimal(runwayMonths, 1) + " meses",
                runwayMonths >= 6 ? "≥ 6 meses" : runwayMonths >= 3 ? "3-6 meses" : "< 3 meses",
                runwayMonths >= 6 ? "Saludable" : runwayMonths >= 3 ? "Mejorable" : "Crítico"
              ],
              [
                "Ratio de gasto",
                pct(expenseRatio),
                expenseRatio <= 70 ? "≤ 70%" : expenseRatio <= 85 ? "70-85%" : "> 85%",
                expenseRatio <= 70 ? "Saludable" : expenseRatio <= 85 ? "Mejorable" : "Crítico"
              ],
              [
                "Deuda / ingreso anual",
                pct(debtRatio),
                debtRatio <= 100 ? "≤ 100%" : debtRatio <= 200 ? "100-200%" : "> 200%",
                debtRatio <= 100 ? "Saludable" : debtRatio <= 200 ? "Mejorable" : "Crítico"
              ]
            ];
            analyzerHealthHtml = tableCard(
              "Diagnóstico de salud financiera vs benchmarks",
              ["Indicador", "Valor actual", "Benchmark", "Estado"],
              healthRows
            );

            var incomeRisk    = income === 0 ? 10 : Math.max(0, Math.min(10, 10 - savingsRatePct / 5));
            var debtRiskScore = Math.max(0, Math.min(10, debtRatio / 30));
            var savRiskScore  = Math.max(0, Math.min(10, 6 - runwayMonths));
            var globalRisk    = (incomeRisk * 0.35 + debtRiskScore * 0.35 + savRiskScore * 0.3);
            function riskLabel(s) { return s >= 7 ? "Alto" : s >= 4 ? "Moderado" : "Bajo"; }
            analyzerRiskHtml = tableCard(
              "Descomposición del riesgo financiero (0-10)",
              ["Componente", "Puntuación", "Nivel", "Peso"],
              [
                ["Riesgo de ingresos",  decimal(incomeRisk, 1),    riskLabel(incomeRisk),    "35%"],
                ["Riesgo de deuda",     decimal(debtRiskScore, 1), riskLabel(debtRiskScore), "35%"],
                ["Riesgo de liquidez",  decimal(savRiskScore, 1),  riskLabel(savRiskScore),  "30%"],
                ["Riesgo global",       decimal(globalRisk, 1),    riskLabel(globalRisk),    "—"]
              ]
            );

            var peerSavRate  = 12.4;
            var peerRunway   = 3.8;
            var peerDebtRat  = 142;
            var peerExpRat   = 78;
            analyzerPeerHtml = tableCard(
              "Comparativa con hogar europeo medio",
              ["Indicador", "Tú", "Media europea", "Posición"],
              [
                ["Tasa de ahorro",        pct(savingsRatePct), pct(peerSavRate),  savingsRatePct >= peerSavRate  ? "Por encima" : "Por debajo"],
                ["Runway",                decimal(runwayMonths, 1) + " m", decimal(peerRunway, 1) + " m", runwayMonths >= peerRunway   ? "Por encima" : "Por debajo"],
                ["Ratio deuda/ing. anual",pct(debtRatio),     pct(peerDebtRat), debtRatio <= peerDebtRat      ? "Por encima" : "Por debajo"],
                ["Ratio de gasto",        pct(expenseRatio),  pct(peerExpRat),  expenseRatio <= peerExpRat    ? "Por encima" : "Por debajo"]
              ]
            );
          }

          if (modeValue === "optimizer") {
            var sensitivityCases = [
              { label: "Ingresos +20%",  netAdj: income * 1.2 - expense,   dbtAdj: debt,        savAdj: savings },
              { label: "Gastos -20%",   netAdj: income - expense * 0.8,   dbtAdj: debt,        savAdj: savings },
              { label: "Deuda -20%",    netAdj: net,                       dbtAdj: debt * 0.8,  savAdj: savings },
              { label: "Ahorro +20%",   netAdj: net,                       dbtAdj: debt,        savAdj: savings * 1.2 }
            ];
            var sensitivityRows = sensitivityCases.map(function (sc) {
              var sNetPos = Math.max(0, sc.netAdj);
              var sDR     = Math.max(0, sc.dbtAdj - sNetPos * debtPayShare * months);
              var sSavP   = sc.savAdj + sNetPos * reserveShare * months;
              var dDebt   = projectedDebt - sDR;
              var dSav    = sSavP - projectedSavings;
              return [
                sc.label,
                (dDebt >= 0 ? "+" : "") + eurosPrecise(dDebt, 0),
                (dSav  >= 0 ? "+" : "") + eurosPrecise(dSav,  0)
              ];
            });
            optimizerSensitivityHtml = tableCard(
              "Análisis de sensibilidad (±20%)",
              ["Palanca", "Δ Deuda reducida", "Δ Ahorro acumulado"],
              sensitivityRows
            );

            var oActions = [
              { label: "Amortizar deuda",  monthly: monthlyAction * debtPayShare,  total: debtReduction,              roi: debt > 0 ? (debtReduction / Math.max(monthlyAction * debtPayShare * months, 1)) * 100 : 0 },
              { label: "Reforzar ahorro",  monthly: monthlyAction * reserveShare,  total: projectedSavings - savings,  roi: (reserveShare + baseGrowth * months) * 100 },
              { label: "Invertir capital", monthly: monthlyAction * investShare,   total: projectedInvest,             roi: (investShare  + (baseGrowth + riskBoost) * months) * 100 }
            ];
            oActions.sort(function (a, b) { return b.roi - a.roi; });
            var priorityRows = oActions.map(function (r, i) {
              return [
                ["1º", "2º", "3º"][i] + " " + r.label,
                eurosPrecise(r.monthly, 2),
                eurosPrecise(r.total, 0),
                decimal(r.roi, 1) + "%"
              ];
            });
            optimizerPriorityHtml = tableCard(
              "Acciones prioritarias por retorno estimado",
              ["Acción", "Mensual", "Acumulado", "ROI est."],
              priorityRows
            );
          }

          var summary = [
            { label: "Flujo neto mensual", value: eurosPrecise(net, 2), tone: net >= 0 ? "ok" : "bad" },
            { label: "Tasa de ahorro", value: pct(savingsRatePct), tone: savingsRatePct >= 20 ? "ok" : (savingsRatePct >= 10 ? "warn" : "bad") },
            { label: "Runway", value: decimal(runwayMonths, 1) + " meses", tone: runwayMonths >= 6 ? "ok" : (runwayMonths >= 3 ? "warn" : "bad") },
            { label: "Deuda proyectada", value: eurosPrecise(projectedDebt, 0), tone: projectedDebt <= debt * 0.7 ? "ok" : "warn" },
            { label: "Riesgo de pérdida", value: modeValue === "simulator" ? decimal(lossProbability, 1) + "%" : "-", tone: modeValue === "simulator" ? (lossProbability <= 25 ? "ok" : (lossProbability <= 45 ? "warn" : "bad")) : "ok" }
          ];

          var rows = [
            ["Amortización deuda", eurosPrecise(monthlyAction * debtPayShare, 2), eurosPrecise(debtReduction, 0)],
            ["Refuerzo ahorro", eurosPrecise(monthlyAction * reserveShare, 2), eurosPrecise(projectedSavings - savings, 0)],
            ["Capital inversión", eurosPrecise(monthlyAction * investShare, 2), eurosPrecise(projectedInvest, 0)]
          ];

          var insights = [];
          if (modeValue === "optimizer") {
            var opportunityCost = Math.max(0, net) * 0.15;
            var bestLever = sensitivityRows && sensitivityRows.length
              ? sensitivityRows.reduce(function (best, r) {
                  var v = parseFloat((r[1] || "0").replace(/[^0-9.,\-]/g, "").replace(",", "."));
                  return (v > best.v ? { label: r[0], v: v } : best);
                }, { label: "", v: -Infinity }).label
              : "Recortar gastos";
            insights.push("Palanca de mayor impacto: " + (bestLever || "Recortar gastos") + ". Ver tabla de sensibilidad.");
            insights.push("En " + Math.round(months) + " meses: deuda estimada → " + eurosPrecise(projectedDebt, 0) + ", ahorro → " + eurosPrecise(projectedSavings, 0) + ".");
            insights.push("Coste de oportunidad de no actuar: ~" + eurosPrecise(opportunityCost, 0) + "/mes (≈15% del flujo neto sin optimizar).");
          } else if (modeValue === "analyzer") {
            var criticalCount = healthRows ? healthRows.filter(function (r) { return r[3] === "Crítico"; }).length : 0;
            var healthLabel = criticalCount === 0 ? "Sin alertas críticas" : criticalCount === 1 ? "1 indicador crítico" : criticalCount + " indicadores críticos";
            insights.push("Diagnóstico: " + (net >= 0 ? "superávit mensual" : "déficit mensual") + ". " + healthLabel + ".");
            insights.push("Riesgo global: " + decimal(globalRisk, 1) + "/10 (" + riskLabel(globalRisk) + "). Peso mayor en ingresos y deuda.");
            insights.push("Bandas de liquidez proyectada: P25 " + eurosPrecise(p25, 0) + ", P50 " + eurosPrecise(p50, 0) + ", P75 " + eurosPrecise(p75, 0) + ".");
          } else if (modeValue === "simulator") {
            insights.push("Escenario simulado con crecimiento medio y ajuste por riesgo.");
            insights.push("Trayectoria esperada al mes " + Math.round(months) + ": " + eurosPrecise(projectedNetSeries[projectedNetSeries.length - 1] || savings, 0) + ".");
            insights.push("Usa el rango probabilístico para decidir un plan defensivo y otro ofensivo antes de ejecutar.");
          } else {
            insights.push("Resultado calculado con entradas actuales y horizonte definido.");
            insights.push("Puedes ajustar riesgo y horizonte para comparar estrategias.");
          }

          out.innerHTML =
            '<div class="fx-results-section">' +
              '<div class="fx-results-header"><span class="fx-results-icon">RS</span><span class="fx-results-title">Resultados</span></div>' +
              renderMetrics(summary) +
              tableCard("Plan de acción", ["Línea", "Mensual", "Acumulado"], rows) +
              listCard("Lectura rápida", insights) +
              optimizerPriorityHtml +
              optimizerSensitivityHtml +
              analyzerHealthHtml +
              analyzerRiskHtml +
              analyzerPeerHtml +
              simulatorTableHtml +
              simulatorRiskHtml +
            '</div>';

          window.ZYVOLA_DASHBOARD_DATASETS = {
            projection: {
              label: toolName + " (proyección)",
              labels: projectedNetSeries.map(function (_, idx) { return "Mes " + (idx + 1); }),
              values: projectedNetSeries.map(function (n) { return Number(n.toFixed(2)); })
            }
          };
        }

        form.addEventListener("submit", function (event) {
          event.preventDefault();
          renderResult();
        });
        form.addEventListener("input", renderResult);
        form.addEventListener("change", renderResult);

        renderResult();
      }
    };
  }

  function renderChatInversiones() {
    var ENTRIES_KEY = "zyv_invest_chat_entries_v1";
    var MESSAGES_KEY = "zyv_invest_chat_messages_v1";
    var LIVE_PREFS_KEY = "zyv_invest_live_prefs_v1";
    var LIVE_SNAPSHOTS_KEY = "zyv_invest_live_snapshots_v1";
    var MONTHLY_CLOSES_KEY = "zyv_invest_monthly_closes_v1";

    function esc(value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    return {
      html:
        '<div class="fx-calculator-shell" style="max-width:1100px">' +
          '<div class="fx-calculator-head">' +
            '<h2>Chat de inversiones</h2>' +
            '<p class="muted">Modo MSCI-first: registra por chat inversiones, participaciones y cierres mensuales; el módulo cruza tus datos con precio vivo para riesgo y beneficio esperado.</p>' +
          '</div>' +

          '<div class="fx-results-section" style="margin-bottom:1rem">' +
            '<div class="fx-results-header"><span class="fx-results-icon">CH</span><span class="fx-results-title">Asistente</span></div>' +
            '<div id="inv-chat-log" style="max-height:230px;overflow:auto;border:1px solid rgba(180,160,100,0.24);border-radius:8px;padding:0.8rem;background:rgba(255,255,255,0.5)"></div>' +
            '<div style="display:grid;grid-template-columns:1fr auto;gap:0.6rem;margin-top:0.75rem">' +
              '<input id="inv-chat-input" type="text" placeholder="Ej: he metido 1200 en msci world" />' +
              '<button class="button" id="inv-chat-send" type="button">Enviar</button>' +
            '</div>' +
            '<small class="muted" style="display:block;margin-top:0.5rem">Comandos clave: "he metido 1200 en msci", "tengo 25 participaciones de msci a 93", "cierro mes con ganancia 420".</small>' +
          '</div>' +

          '<div class="fx-results-section" style="margin-bottom:1rem">' +
            '<div class="fx-results-header"><span class="fx-results-icon">UP</span><span class="fx-results-title">Importar / Adjuntar</span></div>' +
            '<div style="display:flex;gap:0.7rem;flex-wrap:wrap;align-items:center">' +
              '<input id="inv-file-input" type="file" accept=".csv,.json,.xlsx,image/*" />' +
              '<button class="button" id="inv-file-process" type="button">Procesar archivo</button>' +
              '<button class="button" id="inv-clear-all" type="button">Limpiar registro</button>' +
            '</div>' +
            '<small id="inv-file-msg" class="muted" style="display:block;margin-top:0.5rem"></small>' +
          '</div>' +

          '<div class="fx-results-section" style="margin-bottom:1rem">' +
            '<div class="fx-results-header"><span class="fx-results-icon">MK</span><span class="fx-results-title">Mercado en vivo (MSCI/ETF)</span></div>' +
            '<div style="display:grid;grid-template-columns:1fr;gap:0.9rem;margin-top:0.2rem">' +
              '<div style="position:relative;height:220px"><canvas id="inv-live-direct-chart"></canvas></div>' +
              '<div style="position:relative;height:180px"><canvas id="inv-live-direct-monthly-chart"></canvas></div>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:0.6rem;align-items:center;margin-top:0.65rem">' +
              '<label class="fx-field" style="margin:0"><span>Símbolo</span>' +
                '<select id="inv-live-symbol">' +
                  '<option value="URTH">URTH (MSCI World ETF)</option>' +
                  '<option value="IWDA.AS">IWDA.AS (MSCI World)</option>' +
                  '<option value="SWDA.L">SWDA.L (MSCI World)</option>' +
                  '<option value="EUNL.DE">EUNL.DE (MSCI World)</option>' +
                '</select>' +
              '</label>' +
              '<label class="fx-field" style="margin:0"><span>API key Finnhub (opcional)</span><input id="inv-live-token" type="text" placeholder="token opcional para quote más estable" /></label>' +
              '<button class="button" id="inv-live-refresh" type="button" style="height:40px">Actualizar</button>' +
            '</div>' +
            '<div style="display:flex;gap:0.6rem;flex-wrap:wrap;margin-top:0.6rem">' +
              '<button class="button" id="inv-close-month" type="button">Confirmar cierre mensual</button>' +
              '<button class="button" id="inv-export-csv" type="button">Exportar histórico CSV</button>' +
            '</div>' +
            '<small id="inv-live-status" class="muted" style="display:block;margin-top:0.5rem"></small>' +
          '</div>' +

          '<div id="inv-analysis-host"></div>' +
        '</div>',
      hookAfterRender: function (container) {
        var logEl = container.querySelector("#inv-chat-log");
        var inputEl = container.querySelector("#inv-chat-input");
        var sendBtn = container.querySelector("#inv-chat-send");
        var fileEl = container.querySelector("#inv-file-input");
        var fileBtn = container.querySelector("#inv-file-process");
        var fileMsg = container.querySelector("#inv-file-msg");
        var clearBtn = container.querySelector("#inv-clear-all");
        var liveSymbolEl = container.querySelector("#inv-live-symbol");
        var liveTokenEl = container.querySelector("#inv-live-token");
        var liveRefreshBtn = container.querySelector("#inv-live-refresh");
        var closeMonthBtn = container.querySelector("#inv-close-month");
        var exportCsvBtn = container.querySelector("#inv-export-csv");
        var liveStatusEl = container.querySelector("#inv-live-status");
        var analysisHost = container.querySelector("#inv-analysis-host");
        if (!logEl || !inputEl || !sendBtn || !analysisHost) return;

        function loadJson(key, fallback) {
          try {
            var raw = localStorage.getItem(key);
            var parsed = raw ? JSON.parse(raw) : fallback;
            return parsed == null ? fallback : parsed;
          } catch (_e) {
            return fallback;
          }
        }

        function saveJson(key, value) {
          localStorage.setItem(key, JSON.stringify(value));
        }

        var livePrefs = loadJson(LIVE_PREFS_KEY, { symbol: "URTH", token: "" });
        var liveQuote = {
          symbol: livePrefs.symbol || "URTH",
          price: 0,
          changePct: 0,
          source: "-",
          ts: null,
          error: ""
        };
        var liveTimer = null;

        if (liveSymbolEl) liveSymbolEl.value = livePrefs.symbol || "URTH";
        if (liveTokenEl) liveTokenEl.value = livePrefs.token || "";

        var entries = loadJson(ENTRIES_KEY, []);
        var liveSnapshots = loadJson(LIVE_SNAPSHOTS_KEY, []);
        var monthlyCloses = loadJson(MONTHLY_CLOSES_KEY, []);
        var messages = loadJson(MESSAGES_KEY, [
          { role: "assistant", text: "Cuéntame tus movimientos y te construyo tablas de beneficio esperado y riesgo automáticamente.", ts: Date.now() }
        ]);

        function currentMonthKey() {
          var now = new Date();
          return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
        }

        function amountFromText(text) {
          var m = String(text || "").match(/(-?\d+[\d\.,]*)/);
          return m ? parseNumber(m[1].replace(/\./g, "").replace(/,/g, "."), 0) : 0;
        }

        function extractAsset(text) {
          var m = String(text || "").match(/(?:en|de)\s+([a-zA-Z0-9\s\-\.]+)/i);
          var raw = m ? m[1] : "MSCI World";
          return raw.replace(/\s+/g, " ").trim().slice(0, 40);
        }

        function parseChatCommand(text) {
          var original = String(text || "").trim();
          var n = normalize(original);
          var amount = amountFromText(original);
          var asset = extractAsset(original);

          if (/cierro mes|cierre mes|confirmo ganancia|cerrar mes/.test(n)) {
            var month = currentMonthKey();
            var gain = amount;
            var close = {
              id: "close-" + Date.now(),
              month: month,
              gain: gain,
              confirmedAt: Date.now(),
              note: original
            };
            return {
              entry: null,
              monthlyClose: close,
              reply: "Cierre mensual confirmado para " + month + " con ganancia " + eurosPrecise(gain, 2) + "."
            };
          }

          if (/participaciones|shares|titulos/.test(n)) {
            var unitsMatch = original.match(/(\d+[\d\.,]*)\s*(?:participaciones|shares|titulos)/i);
            var priceMatch = original.match(/(?:a|precio)\s*(\d+[\d\.,]*)/i);
            var units = unitsMatch ? parseNumber(unitsMatch[1].replace(/\./g, "").replace(/,/g, "."), 0) : 0;
            var price = priceMatch ? parseNumber(priceMatch[1].replace(/\./g, "").replace(/,/g, "."), 0) : 0;
            var total = units * price;
            return {
              entry: {
                id: "chat-pos-" + Date.now(),
                date: new Date().toISOString().slice(0, 10),
                type: "posicion",
                asset: asset,
                amount: total,
                units: units,
                price: price,
                source: "chat",
                note: original
              },
              reply: "Posición registrada: " + decimal(units, 2) + " participaciones de " + asset + (price > 0 ? " a " + eurosPrecise(price, 2) : "") + "."
            };
          }

          if (/ganad|beneficio|profit/.test(n)) {
            return {
              entry: {
                id: "chat-profit-" + Date.now(),
                date: new Date().toISOString().slice(0, 10),
                type: "beneficio",
                asset: asset,
                amount: amount,
                units: 0,
                price: 0,
                source: "chat",
                note: original
              },
              reply: "Beneficio registrado: " + eurosPrecise(amount, 2) + "."
            };
          }

          if (/retir|vendi|salid|saque/.test(n)) {
            return {
              entry: {
                id: "chat-out-" + Date.now(),
                date: new Date().toISOString().slice(0, 10),
                type: "retiro",
                asset: asset,
                amount: -Math.abs(amount),
                units: 0,
                price: 0,
                source: "chat",
                note: original
              },
              reply: "Retiro/venta registrado por " + eurosPrecise(Math.abs(amount), 2) + "."
            };
          }

          if (/metid|invert|aporte|compre|comprado/.test(n)) {
            return {
              entry: {
                id: "chat-in-" + Date.now(),
                date: new Date().toISOString().slice(0, 10),
                type: "aporte",
                asset: asset,
                amount: Math.abs(amount),
                units: 0,
                price: 0,
                source: "chat",
                note: original
              },
              reply: "Aporte registrado: " + eurosPrecise(Math.abs(amount), 2) + " en " + asset + "."
            };
          }

          return {
            entry: null,
            reply: "No pude extraer una operación concreta. Prueba con formato: 'he metido 1200 en msci' o 'he ganado 250 este mes'."
          };
        }

        function getSymbolTrend(symbol) {
          var cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
          var arr = liveSnapshots.filter(function (s) {
            return s && s.symbol === symbol && s.ts >= cutoff && s.price > 0;
          }).sort(function (a, b) { return a.ts - b.ts; });
          if (arr.length < 2) return { points: arr.length, trendPct: 0, pattern: "Sin patrón" };
          var first = arr[0].price;
          var last = arr[arr.length - 1].price;
          var trend = first > 0 ? ((last - first) / first) * 100 : 0;
          var pattern = trend >= 2.5 ? "Momentum alcista" : (trend <= -2.5 ? "Corrección" : "Rango lateral");
          return { points: arr.length, trendPct: trend, pattern: pattern };
        }

        function buildPatternScenarios(price, trendPct) {
          var annualBase = 7.2;
          var annualAdj = annualBase + Math.max(Math.min(trendPct, 6), -6) * 0.7;
          var annualCons = annualAdj - 3;
          var annualAgg = annualAdj + 3;
          return {
            conservador: { annual: annualCons, price12m: price * (1 + annualCons / 100) },
            base: { annual: annualAdj, price12m: price * (1 + annualAdj / 100) },
            agresivo: { annual: annualAgg, price12m: price * (1 + annualAgg / 100) }
          };
        }

        function downloadCsv(filename, rows) {
          var csv = rows.map(function (r) {
            return r.map(function (c) {
              var text = String(c == null ? "" : c).replace(/"/g, '""');
              return '"' + text + '"';
            }).join(";");
          }).join("\r\n");
          var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          var url = URL.createObjectURL(blob);
          var a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }

        function riskProfileForAsset(assetName) {
          var key = normalize(assetName);
          if (key.indexOf("msci") !== -1 || key.indexOf("etf") !== -1 || key.indexOf("acciones") !== -1) {
            return { expected: 7.2, vol: 16, level: "Medio" };
          }
          if (key.indexOf("crypto") !== -1 || key.indexOf("cripto") !== -1 || key.indexOf("btc") !== -1) {
            return { expected: 14, vol: 45, level: "Alto" };
          }
          if (key.indexOf("bono") !== -1 || key.indexOf("renta fija") !== -1) {
            return { expected: 3.3, vol: 6, level: "Bajo" };
          }
          if (key.indexOf("inmobili") !== -1 || key.indexOf("reit") !== -1) {
            return { expected: 5.6, vol: 11, level: "Medio" };
          }
          return { expected: 5.2, vol: 12, level: "Medio" };
        }

        function symbolToStooq(symbol) {
          var s = String(symbol || "URTH").toUpperCase();
          if (s === "URTH") return "urth.us";
          if (s === "IWDA.AS") return "iwda.as";
          if (s === "SWDA.L") return "swda.l";
          if (s === "EUNL.DE") return "eunl.de";
          return s.toLowerCase();
        }

        function fetchFinnhubQuote(symbol, token) {
          if (!token) return Promise.reject(new Error("Sin token Finnhub"));
          var url = "https://finnhub.io/api/v1/quote?symbol=" + encodeURIComponent(symbol) + "&token=" + encodeURIComponent(token);
          return fetch(url)
            .then(function (res) {
              if (!res.ok) throw new Error("HTTP " + res.status);
              return res.json();
            })
            .then(function (data) {
              var price = parseNumber(data && data.c, 0);
              var prev = parseNumber(data && data.pc, 0);
              if (!(price > 0)) throw new Error("Precio no disponible");
              var changePct = prev > 0 ? ((price - prev) / prev) * 100 : parseNumber(data && data.dp, 0);
              return { price: price, changePct: changePct, source: "Finnhub" };
            });
        }

        function fetchStooqQuote(symbol) {
          var stooqSymbol = symbolToStooq(symbol);
          var sourceUrl = "https://stooq.com/q/l/?s=" + encodeURIComponent(stooqSymbol) + "&i=1";
          var proxies = [
            "https://api.allorigins.win/raw?url=" + encodeURIComponent(sourceUrl),
            "https://corsproxy.io/?" + encodeURIComponent(sourceUrl)
          ];

          function parseStooqRaw(raw) {
            var line = String(raw || "").trim().split(/\r?\n/)[0] || "";
            var cols = line.split(",");
            if (cols.length < 7) throw new Error("Respuesta Stooq inválida");
            var close = parseNumber(cols[6], 0);
            var open = parseNumber(cols[4], 0);
            if (!(close > 0)) throw new Error("Precio Stooq no disponible");
            var changePct = open > 0 ? ((close - open) / open) * 100 : 0;
            return { price: close, changePct: changePct, source: "Stooq" };
          }

          function fetchWithProxy(index) {
            if (index >= proxies.length) {
              return Promise.reject(new Error("Todos los proxies fallaron"));
            }
            return fetch(proxies[index])
              .then(function (res) {
                if (!res.ok) throw new Error("HTTP " + res.status);
                return res.text();
              })
              .then(parseStooqRaw)
              .catch(function () {
                return fetchWithProxy(index + 1);
              });
          }

          return fetchWithProxy(0);
        }

        function refreshLiveQuote(manual) {
          var symbol = liveSymbolEl ? (liveSymbolEl.value || "URTH") : "URTH";
          var token = liveTokenEl ? (liveTokenEl.value || "").trim() : "";
          livePrefs = { symbol: symbol, token: token };
          saveJson(LIVE_PREFS_KEY, livePrefs);

          if (liveStatusEl) liveStatusEl.textContent = "Actualizando cotización de " + symbol + "...";

          fetchFinnhubQuote(symbol, token)
            .catch(function () { return fetchStooqQuote(symbol); })
            .then(function (q) {
              liveQuote.symbol = symbol;
              liveQuote.price = q.price;
              liveQuote.changePct = q.changePct;
              liveQuote.source = q.source;
              liveQuote.ts = Date.now();
              liveQuote.error = "";
              liveSnapshots.push({ symbol: symbol, price: q.price, ts: liveQuote.ts, source: q.source });
              if (liveSnapshots.length > 1200) liveSnapshots = liveSnapshots.slice(liveSnapshots.length - 1200);
              saveJson(LIVE_SNAPSHOTS_KEY, liveSnapshots);
              if (liveStatusEl) {
                liveStatusEl.textContent =
                  symbol + " " + eurosPrecise(q.price, 2) + " (" + (q.changePct >= 0 ? "+" : "") + decimal(q.changePct, 2) + "%) · Fuente: " + q.source + (manual ? " · actualizado" : "");
              }
              buildAnalysis();
              renderDirectCharts();
            })
            .catch(function (err) {
              liveQuote.error = (err && err.message) ? err.message : "No disponible";
              if (liveStatusEl) {
                liveStatusEl.textContent = "No se pudo obtener cotización en vivo ahora mismo (" + liveQuote.error + ").";
              }
              buildAnalysis();
              renderDirectCharts();
            });
        }

        function renderDirectCharts() {
          if (!window.ZyvolaCharts || typeof window.ZyvolaCharts.renderChart !== "function") return;
          var symbol = liveQuote.symbol || "URTH";
          var series = liveSnapshots
            .filter(function (s) { return s && s.symbol === symbol && s.price > 0; })
            .sort(function (a, b) { return a.ts - b.ts; })
            .slice(-50);

          var labels = series.map(function (s) {
            return new Date(s.ts).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
          });
          var values = series.map(function (s) { return Number((s.price || 0).toFixed(2)); });
          if (!labels.length && liveQuote.price > 0) {
            labels = ["Ahora"];
            values = [Number((liveQuote.price || 0).toFixed(2))];
          }
          if (!labels.length) {
            labels = ["Sin datos"];
            values = [0];
          }

          var monthly = monthlyCloses.slice().sort(function (a, b) {
            return String(a.month).localeCompare(String(b.month));
          }).slice(-12);
          var mLabels = monthly.map(function (m) { return m.month; });
          var mValues = monthly.map(function (m) { return Number((m.gain || 0).toFixed(2)); });
          if (!mLabels.length) {
            mLabels = ["Sin cierres"];
            mValues = [0];
          }

          window.ZyvolaCharts.renderChart("inv-live-direct-chart", "line", labels, symbol + " precio", values);
          window.ZyvolaCharts.renderChart("inv-live-direct-monthly-chart", "bar", mLabels, "Ganancia mensual", mValues);
        }

        function aggregatePortfolio(items) {
          var map = {};
          items.forEach(function (e) {
            var asset = e.asset || "Cartera";
            if (!map[asset]) {
              map[asset] = {
                asset: asset,
                invested: 0,
                profit: 0,
                units: 0,
                avgPriceNumerator: 0,
                avgPriceDenominator: 0
              };
            }
            var r = map[asset];
            if (e.type === "aporte") r.invested += Math.max(0, e.amount || 0);
            if (e.type === "retiro") r.invested += (e.amount || 0);
            if (e.type === "beneficio") r.profit += Math.max(0, e.amount || 0);
            if (e.type === "posicion") {
              r.invested += Math.max(0, e.amount || 0);
              r.units += Math.max(0, e.units || 0);
              if ((e.units || 0) > 0 && (e.price || 0) > 0) {
                r.avgPriceNumerator += (e.units || 0) * (e.price || 0);
                r.avgPriceDenominator += (e.units || 0);
              }
            }
          });
          return Object.keys(map).map(function (k) {
            var item = map[k];
            var risk = riskProfileForAsset(item.asset);
            var base = Math.max(item.invested, 0);
            var expectedBenefit12m = base * (risk.expected / 100);
            var avgPrice = item.avgPriceDenominator > 0 ? item.avgPriceNumerator / item.avgPriceDenominator : 0;
            return {
              asset: item.asset,
              invested: item.invested,
              realizedProfit: item.profit,
              units: item.units,
              avgPrice: avgPrice,
              expectedReturn: risk.expected,
              volatility: risk.vol,
              riskLevel: risk.level,
              expectedBenefit12m: expectedBenefit12m
            };
          });
        }

        function buildAnalysis() {
          var portfolio = aggregatePortfolio(entries);
          var month = currentMonthKey();
          var monthClose = monthlyCloses.filter(function (c) { return c.month === month; }).slice(-1)[0] || null;
          var trend = getSymbolTrend(liveQuote.symbol || "URTH");
          var scenarios = buildPatternScenarios(liveQuote.price || 0, trend.trendPct);
          var investedTotal = portfolio.reduce(function (s, p) { return s + p.invested; }, 0);
          var realizedProfit = portfolio.reduce(function (s, p) { return s + p.realizedProfit; }, 0);
          var expected12m = portfolio.reduce(function (s, p) { return s + p.expectedBenefit12m; }, 0);

          var weightedVol = 0;
          var positiveInvested = Math.max(investedTotal, 0.0001);
          portfolio.forEach(function (p) {
            var w = Math.max(p.invested, 0) / positiveInvested;
            weightedVol += w * p.volatility;
          });

          var riskLabel = weightedVol >= 25 ? "Alto" : weightedVol >= 13 ? "Medio" : "Bajo";
          var summary = [
            { label: "Capital neto registrado", value: eurosPrecise(investedTotal, 2), tone: investedTotal >= 0 ? "ok" : "warn" },
            { label: "Beneficio reportado", value: eurosPrecise(realizedProfit, 2), tone: realizedProfit >= 0 ? "ok" : "warn" },
            { label: "Beneficio esperado (12m)", value: eurosPrecise(expected12m, 2), tone: expected12m >= 0 ? "ok" : "warn" },
            { label: "Riesgo agregado", value: riskLabel + " (vol " + decimal(weightedVol, 1) + "%)", tone: riskLabel === "Alto" ? "bad" : (riskLabel === "Medio" ? "warn" : "ok") },
            { label: "Patrón 14d", value: trend.pattern + " (" + (trend.trendPct >= 0 ? "+" : "") + decimal(trend.trendPct, 2) + "%)", tone: trend.trendPct >= 0 ? "ok" : "warn" },
            { label: "Cierre mensual", value: monthClose ? eurosPrecise(monthClose.gain, 2) : "Pendiente", tone: monthClose ? (monthClose.gain >= 0 ? "ok" : "warn") : "warn" }
          ];

          var movementsRows = entries.slice().reverse().slice(0, 12).map(function (e) {
            return [
              esc(e.date || "-"),
              esc(e.type || "-"),
              esc(e.asset || "-"),
              eurosPrecise(e.amount || 0, 2),
              e.units ? decimal(e.units, 2) : "-",
              e.price ? eurosPrecise(e.price, 2) : "-",
              esc(e.source || "-")
            ];
          });

          var portfolioRows = portfolio.map(function (p) {
            var livePnL = "-";
            if (p.units > 0 && p.avgPrice > 0 && liveQuote.price > 0) {
              livePnL = eurosPrecise((liveQuote.price - p.avgPrice) * p.units, 2);
            }
            return [
              esc(p.asset),
              eurosPrecise(p.invested, 2),
              p.units > 0 ? decimal(p.units, 2) : "-",
              p.avgPrice > 0 ? eurosPrecise(p.avgPrice, 2) : "-",
              liveQuote.price > 0 ? eurosPrecise(liveQuote.price, 2) : "-",
              livePnL,
              pct(p.expectedReturn),
              pct(p.volatility),
              p.riskLevel,
              eurosPrecise(p.expectedBenefit12m, 2)
            ];
          });

          var liveRows = [[
            esc(liveQuote.symbol || "URTH"),
            liveQuote.price > 0 ? eurosPrecise(liveQuote.price, 2) : "-",
            liveQuote.price > 0 ? ((liveQuote.changePct >= 0 ? "+" : "") + decimal(liveQuote.changePct, 2) + "%") : "-",
            esc(liveQuote.source || "-"),
            liveQuote.ts ? new Date(liveQuote.ts).toLocaleTimeString("es-ES") : "-",
            liveQuote.error ? esc(liveQuote.error) : "OK"
          ]];

          var scenarioRows = [
            ["Conservador", pct(scenarios.conservador.annual), liveQuote.price > 0 ? eurosPrecise(scenarios.conservador.price12m, 2) : "-"],
            ["Base", pct(scenarios.base.annual), liveQuote.price > 0 ? eurosPrecise(scenarios.base.price12m, 2) : "-"],
            ["Agresivo", pct(scenarios.agresivo.annual), liveQuote.price > 0 ? eurosPrecise(scenarios.agresivo.price12m, 2) : "-"]
          ];

          var monthlyRows = monthlyCloses.slice().sort(function (a, b) { return String(b.month).localeCompare(String(a.month)); }).slice(0, 12).map(function (c) {
            return [c.month, eurosPrecise(c.gain, 2), new Date(c.confirmedAt).toLocaleString("es-ES")];
          });

          analysisHost.innerHTML =
            '<div class="fx-results-section">' +
              '<div class="fx-results-header"><span class="fx-results-icon">RS</span><span class="fx-results-title">Análisis automático de cartera</span></div>' +
              renderMetrics(summary) +
              '<div class="fx-results-table-wrap">' +
                '<div class="fx-results-table-header"><span class="fx-insights-icon">📈</span><span class="fx-results-table-title">Gráficos MSCI</span></div>' +
                '<div style="display:grid;grid-template-columns:1fr;gap:0.9rem">' +
                  '<div style="position:relative;height:230px"><canvas id="inv-msci-price-chart"></canvas></div>' +
                  '<div style="position:relative;height:210px"><canvas id="inv-msci-monthly-chart"></canvas></div>' +
                '</div>' +
              '</div>' +
              tableCard("Cotización viva (MSCI/ETF)", ["Símbolo", "Precio", "Cambio", "Fuente", "Hora", "Estado"], liveRows) +
              tableCard("Patrones y beneficio proyectado", ["Escenario", "Rentabilidad anual", "Precio estimado 12m"], scenarioRows) +
              tableCard("Movimientos recientes", ["Fecha", "Tipo", "Activo", "Importe", "Participaciones", "Precio", "Origen"], movementsRows.length ? movementsRows : [["-", "-", "-", "-", "-", "-", "-"]]) +
              tableCard("Beneficio esperado y riesgo por activo", ["Activo", "Capital", "Participaciones", "Precio medio", "Precio vivo", "P/L vivo", "Rent. esperada", "Volatilidad", "Riesgo", "Beneficio esp. 12m"], portfolioRows.length ? portfolioRows : [["Sin datos", "-", "-", "-", "-", "-", "-", "-", "-", "-"]]) +
              tableCard("Histórico mensual confirmado", ["Mes", "Ganancia confirmada", "Fecha de confirmación"], monthlyRows.length ? monthlyRows : [["Sin cierres", "-", "-"]]) +
              listCard("Lectura rápida", [
                "Escribe cada movimiento y el sistema recalcula automáticamente beneficios esperados y riesgo.",
                "Puedes importar CSV/JSON para mantener una especie de Excel vivo en el navegador y cruzarlo con precio de mercado.",
                "Cierra el mes por chat ('cierro mes con ganancia X') o con botón para consolidar el histórico mensual.",
                "Las capturas se guardan como evidencia, pero sin OCR automático en esta pantalla."
              ]) +
            '</div>';

          if (window.ZyvolaCharts && typeof window.ZyvolaCharts.renderChart === "function") {
            var symbol = liveQuote.symbol || "URTH";
            var series = liveSnapshots
              .filter(function (s) { return s && s.symbol === symbol && s.price > 0; })
              .sort(function (a, b) { return a.ts - b.ts; })
              .slice(-40);

            var priceLabels = series.map(function (s) {
              return new Date(s.ts).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
            });
            var priceValues = series.map(function (s) { return Number((s.price || 0).toFixed(2)); });

            if (!priceLabels.length && liveQuote.price > 0) {
              priceLabels = ["Ahora"];
              priceValues = [Number((liveQuote.price || 0).toFixed(2))];
            }

            var closes = monthlyCloses.slice().sort(function (a, b) {
              return String(a.month).localeCompare(String(b.month));
            }).slice(-12);
            var closeLabels = closes.map(function (c) { return c.month; });
            var closeValues = closes.map(function (c) { return Number((c.gain || 0).toFixed(2)); });

            if (!closeLabels.length) {
              closeLabels = ["Sin cierres"];
              closeValues = [0];
            }

            window.ZyvolaCharts.renderChart("inv-msci-price-chart", "line", priceLabels, "MSCI precio", priceValues);
            window.ZyvolaCharts.renderChart("inv-msci-monthly-chart", "bar", closeLabels, "Ganancia mensual confirmada", closeValues);
          }
          renderDirectCharts();

          window.ZYVOLA_DASHBOARD_DATASETS = {
            portfolioExpected: {
              label: "Beneficio esperado 12m por activo",
              labels: portfolio.map(function (p) { return p.asset; }),
              values: portfolio.map(function (p) { return Number((p.expectedBenefit12m || 0).toFixed(2)); })
            }
          };
        }

        function renderMessages() {
          logEl.innerHTML = messages.slice(-30).map(function (m) {
            var align = m.role === "user" ? "flex-end" : "flex-start";
            var bg = m.role === "user" ? "rgba(200,168,75,0.18)" : "rgba(68,83,106,0.08)";
            return '<div style="display:flex;justify-content:' + align + ';margin:0.35rem 0">' +
              '<div style="max-width:85%;padding:0.5rem 0.65rem;border-radius:8px;background:' + bg + ';font-size:0.88rem">' + esc(m.text) + '</div>' +
            '</div>';
          }).join("");
          logEl.scrollTop = logEl.scrollHeight;
        }

        function pushMessage(role, text) {
          messages.push({ role: role, text: String(text || ""), ts: Date.now() });
          saveJson(MESSAGES_KEY, messages);
          renderMessages();
        }

        function addEntry(entry) {
          entries.push(entry);
          saveJson(ENTRIES_KEY, entries);
          buildAnalysis();
        }

        function handleSend() {
          var text = inputEl.value.trim();
          if (!text) return;
          inputEl.value = "";
          pushMessage("user", text);
          var parsed = parseChatCommand(text);
          if (parsed.entry) {
            addEntry(parsed.entry);
          }
          if (parsed.monthlyClose) {
            monthlyCloses.push(parsed.monthlyClose);
            monthlyCloses = monthlyCloses.slice(-120);
            saveJson(MONTHLY_CLOSES_KEY, monthlyCloses);
            buildAnalysis();
          }
          pushMessage("assistant", parsed.reply);
        }

        function parseCsv(text) {
          var lines = String(text || "").split(/\r?\n/).filter(function (l) { return l.trim(); });
          if (lines.length < 2) return [];
          var sep = lines[0].indexOf(";") !== -1 ? ";" : ",";
          var headers = lines[0].split(sep).map(function (h) { return normalize(h); });
          function idx(nameCandidates) {
            for (var i = 0; i < headers.length; i += 1) {
              for (var j = 0; j < nameCandidates.length; j += 1) {
                if (headers[i].indexOf(nameCandidates[j]) !== -1) return i;
              }
            }
            return -1;
          }
          var iDate = idx(["fecha", "date"]);
          var iType = idx(["tipo", "type"]);
          var iAsset = idx(["activo", "asset", "ticker"]);
          var iAmount = idx(["importe", "amount", "capital"]);
          var iUnits = idx(["particip", "units", "shares"]);
          var iPrice = idx(["precio", "price"]);
          var out = [];
          for (var l = 1; l < lines.length; l += 1) {
            var cols = lines[l].split(sep);
            if (!cols.length) continue;
            out.push({
              id: "csv-" + Date.now() + "-" + l,
              date: iDate >= 0 ? (cols[iDate] || "").trim() : new Date().toISOString().slice(0, 10),
              type: iType >= 0 ? normalize(cols[iType]).replace(/\s+/g, "") : "aporte",
              asset: iAsset >= 0 ? (cols[iAsset] || "Cartera").trim() : "Cartera",
              amount: iAmount >= 0 ? parseNumber((cols[iAmount] || "0").replace(/\./g, "").replace(/,/g, "."), 0) : 0,
              units: iUnits >= 0 ? parseNumber((cols[iUnits] || "0").replace(/\./g, "").replace(/,/g, "."), 0) : 0,
              price: iPrice >= 0 ? parseNumber((cols[iPrice] || "0").replace(/\./g, "").replace(/,/g, "."), 0) : 0,
              source: "csv",
              note: "import csv"
            });
          }
          return out;
        }

        function handleFile() {
          if (!fileEl || !fileEl.files || !fileEl.files.length) {
            fileMsg.textContent = "Selecciona un archivo primero.";
            return;
          }
          var f = fileEl.files[0];
          var name = (f.name || "").toLowerCase();

          if (/\.(png|jpg|jpeg|webp)$/i.test(name)) {
            pushMessage("assistant", "Captura adjuntada: " + f.name + ". La guardo como evidencia. En esta pantalla no hay OCR automático; añade importe/participaciones por chat para calcular tablas.");
            fileMsg.textContent = "Captura guardada como evidencia (sin OCR).";
            return;
          }

          var reader = new FileReader();
          reader.onload = function () {
            try {
              if (/\.json$/i.test(name)) {
                var data = JSON.parse(String(reader.result || "[]"));
                var arr = Array.isArray(data) ? data : (Array.isArray(data.entries) ? data.entries : []);
                var mapped = arr.map(function (x, idx) {
                  return {
                    id: "json-" + Date.now() + "-" + idx,
                    date: x.date || new Date().toISOString().slice(0, 10),
                    type: normalize(x.type || "aporte").replace(/\s+/g, ""),
                    asset: x.asset || x.ticker || "Cartera",
                    amount: parseNumber(x.amount, 0),
                    units: parseNumber(x.units, 0),
                    price: parseNumber(x.price, 0),
                    source: "json",
                    note: x.note || "import json"
                  };
                });
                entries = entries.concat(mapped);
                saveJson(ENTRIES_KEY, entries);
                buildAnalysis();
                pushMessage("assistant", "Importación JSON completada: " + mapped.length + " movimientos.");
                fileMsg.textContent = "JSON importado correctamente.";
                return;
              }

              if (/\.csv$/i.test(name)) {
                var csvRows = parseCsv(String(reader.result || ""));
                entries = entries.concat(csvRows);
                saveJson(ENTRIES_KEY, entries);
                buildAnalysis();
                pushMessage("assistant", "Importación CSV completada: " + csvRows.length + " movimientos.");
                fileMsg.textContent = "CSV importado correctamente.";
                return;
              }

              if (/\.xlsx$/i.test(name)) {
                fileMsg.textContent = "Archivo Excel detectado (.xlsx). Exportalo como CSV para importación automática en este módulo.";
                pushMessage("assistant", "He detectado un Excel (.xlsx). En esta pantalla aún no leo .xlsx directo: exportalo como CSV y lo importo manteniendo la actualización de tablas.");
                return;
              }
              fileMsg.textContent = "Formato no soportado. Usa CSV, JSON, XLSX o imagen.";
            } catch (e) {
              fileMsg.textContent = "No pude leer el archivo: " + (e && e.message ? e.message : "error");
            }
          };
          reader.readAsText(f);
        }

        sendBtn.addEventListener("click", handleSend);
        inputEl.addEventListener("keydown", function (ev) {
          if (ev.key === "Enter") {
            ev.preventDefault();
            handleSend();
          }
        });
        if (fileBtn) fileBtn.addEventListener("click", handleFile);
        if (liveRefreshBtn) {
          liveRefreshBtn.addEventListener("click", function () {
            refreshLiveQuote(true);
          });
        }
        if (liveSymbolEl) {
          liveSymbolEl.addEventListener("change", function () {
            refreshLiveQuote(true);
          });
        }
        if (closeMonthBtn) {
          closeMonthBtn.addEventListener("click", function () {
            var gainText = window.prompt("Ganancia neta confirmada del mes actual (EUR):", "0");
            if (gainText == null) return;
            var gain = parseNumber(String(gainText).replace(/\./g, "").replace(/,/g, "."), 0);
            var close = { id: "close-" + Date.now(), month: currentMonthKey(), gain: gain, confirmedAt: Date.now(), note: "confirmado manual" };
            monthlyCloses.push(close);
            monthlyCloses = monthlyCloses.slice(-120);
            saveJson(MONTHLY_CLOSES_KEY, monthlyCloses);
            pushMessage("assistant", "Cierre mensual confirmado: " + close.month + " → " + eurosPrecise(gain, 2) + ".");
            buildAnalysis();
          });
        }
        if (exportCsvBtn) {
          exportCsvBtn.addEventListener("click", function () {
            var rows = [];
            rows.push(["SECCION", "TIPO", "FECHA/MES", "ACTIVO", "IMPORTE", "UNIDADES", "PRECIO", "ORIGEN", "NOTA"]);
            entries.forEach(function (e) {
              rows.push(["movimientos", e.type || "", e.date || "", e.asset || "", e.amount || 0, e.units || 0, e.price || 0, e.source || "", e.note || ""]);
            });
            monthlyCloses.forEach(function (c) {
              rows.push(["cierres_mensuales", "cierre", c.month || "", "MSCI", c.gain || 0, "", "", "manual/chat", c.note || ""]);
            });
            liveSnapshots.slice(-600).forEach(function (s) {
              rows.push(["cotizaciones", "snapshot", new Date(s.ts).toISOString(), s.symbol || "", s.price || 0, "", "", s.source || "", ""]);
            });
            downloadCsv("msci_historico_" + currentMonthKey() + ".csv", rows);
            pushMessage("assistant", "CSV exportado con histórico de movimientos, cierres mensuales y snapshots de cotización.");
          });
        }
        if (clearBtn) {
          clearBtn.addEventListener("click", function () {
            entries = [];
            monthlyCloses = [];
            liveSnapshots = [];
            messages = [{ role: "assistant", text: "Registro limpiado. Puedes empezar de nuevo con tus movimientos.", ts: Date.now() }];
            saveJson(ENTRIES_KEY, entries);
            saveJson(MESSAGES_KEY, messages);
            saveJson(MONTHLY_CLOSES_KEY, monthlyCloses);
            saveJson(LIVE_SNAPSHOTS_KEY, liveSnapshots);
            renderMessages();
            buildAnalysis();
            if (fileMsg) fileMsg.textContent = "Registro reiniciado.";
          });
        }

        renderMessages();
        buildAnalysis();
        refreshLiveQuote(false);
        liveTimer = window.setInterval(function () {
          refreshLiveQuote(false);
        }, 60000);
      }
    };
  }

  /* ── Perfil financiero ──────────────────────────────────────────── */

  function renderMiPerfilFinanciero(state) {
    var esc = function (v) {
      return String(v == null ? "" : v)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    };

    var profileData = {
      accounts:    (state.accounts    || []).map(function(a) { return Object.assign({}, a); }),
      assets:      (state.assets      || []).map(function(a) { return Object.assign({}, a); }),
      liabilities: (state.liabilities || []).map(function(l) { return Object.assign({}, l); }),
      goals:       (state.goals       || []).map(function(g) { return Object.assign({}, g); }),
      recurring:   (state.recurringItems || []).map(function(r) { return Object.assign({}, r); })
    };

    function panelListHtml(items, fields, panelKey) {
      var typeLabels = { liquido: "Líquido", inversion: "Inversión", otro: "Otro", largo: "Largo plazo", medio: "Medio plazo", corto: "Corto plazo", income: "Ingreso", expense: "Gasto" };
      var rows = items.map(function (item, idx) {
        var cells = fields.map(function (f) {
          var val = item[f.key] != null ? item[f.key] : "";
          if (f.type === "select") return '<td><span class="fx-badge">' + esc(typeLabels[val] || val) + '</span></td>';
          if (f.type === "number") return '<td>' + (typeof val === "number" ? new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(val) : esc(val)) + '</td>';
          return '<td>' + esc(val) + '</td>';
        }).join("");
        return '<tr>' + cells + '<td><button class="fx-del-btn" type="button" data-panel="' + esc(panelKey) + '" data-idx="' + idx + '" aria-label="Eliminar">✕</button></td></tr>';
      }).join("");
      if (!rows) return '<p class="muted" style="margin:0.5rem 0 1rem;font-size:0.85rem">Sin entradas todavía.</p>';
      var heads = fields.map(function(f) { return '<th>' + esc(f.label) + '</th>'; }).join("") + '<th></th>';
      return '<div class="fx-results-table-wrap" style="margin-bottom:1rem"><table class="fx-results-table"><thead><tr>' + heads + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
    }

    function addFormHtml(panelKey, fields) {
      var inputs = fields.map(function(f) {
        if (f.type === "select") {
          var opts = f.options.map(function(o) { return '<option value="' + esc(o.value) + '">' + esc(o.label) + '</option>'; }).join("");
          return '<label class="fx-field"><span>' + esc(f.label) + '</span><select name="' + esc(f.key) + '">' + opts + '</select></label>';
        }
        return '<label class="fx-field"><span>' + esc(f.label) + '</span><input name="' + esc(f.key) + '" type="' + esc(f.type) + '" step="' + esc(f.step || "any") + '" min="' + esc(f.min != null ? f.min : "") + '" placeholder="' + esc(f.placeholder || "") + '"></label>';
      }).join("");
      return '<form class="fx-profile-add-form fx-form-grid" data-panel="' + esc(panelKey) + '" style="margin-top:0.5rem">' + inputs + '<div class="fx-form-actions"><button class="button" type="submit" style="font-size:0.82rem;padding:0.45rem 1rem">+ Añadir</button></div></form>';
    }

    var tabStyle = 'style="display:none"';
    var tabs = [
      { key: "cuentas",     label: "Cuentas" },
      { key: "activos",     label: "Activos" },
      { key: "deudas",      label: "Deudas" },
      { key: "recurrentes", label: "Ingresos y gastos" },
      { key: "objetivos",   label: "Objetivos" }
    ];

    var tabBtns = tabs.map(function(t, i) {
      return '<button class="fx-tab-btn' + (i === 0 ? ' active' : '') + '" data-tab="' + t.key + '" type="button">' + t.label + '</button>';
    }).join("");

    var accountFields = [
      { key: "name",    label: "Nombre",  type: "text",   placeholder: "Cuenta corriente" },
      { key: "balance", label: "Saldo",   type: "number", step: "0.01", min: "" }
    ];
    var assetFields = [
      { key: "name",  label: "Nombre", type: "text",   placeholder: "ETF Global" },
      { key: "type",  label: "Tipo",   type: "select", options: [{ value: "liquido", label: "Líquido" }, { value: "inversion", label: "Inversión" }, { value: "otro", label: "Otro" }] },
      { key: "value", label: "Valor",  type: "number", step: "0.01", min: "0" }
    ];
    var liabilityFields = [
      { key: "name",    label: "Nombre",     type: "text",   placeholder: "Hipoteca" },
      { key: "type",    label: "Plazo",      type: "select", options: [{ value: "largo", label: "Largo plazo" }, { value: "medio", label: "Medio plazo" }, { value: "corto", label: "Corto plazo" }] },
      { key: "value",   label: "Saldo pendiente", type: "number", step: "0.01", min: "0" },
      { key: "monthly", label: "Cuota mensual",   type: "number", step: "0.01", min: "0" }
    ];
    var recurringFields = [
      { key: "name",     label: "Descripción",  type: "text",   placeholder: "Nómina" },
      { key: "merchant", label: "Comercio/Código", type: "text", placeholder: "NOMINA" },
      { key: "type",     label: "Tipo", type: "select", options: [{ value: "income", label: "Ingreso" }, { value: "expense", label: "Gasto" }] },
      { key: "category", label: "Categoría", type: "select", options: [
        { value: "ingresos", label: "Ingresos" }, { value: "vivienda", label: "Vivienda" },
        { value: "alimentacion", label: "Alimentación" }, { value: "movilidad", label: "Movilidad" },
        { value: "ocio", label: "Ocio" }, { value: "servicios", label: "Servicios" },
        { value: "suscripciones", label: "Suscripciones" }, { value: "inversion", label: "Inversión" },
        { value: "otros", label: "Otros" }
      ]},
      { key: "amount", label: "Importe (€/mes)", type: "number", step: "0.01", min: "0" }
    ];
    var goalFields = [
      { key: "name",    label: "Objetivo",     type: "text",   placeholder: "Fondo de emergencia" },
      { key: "target",  label: "Meta (€)",     type: "number", step: "0.01", min: "0" },
      { key: "current", label: "Conseguido (€)", type: "number", step: "0.01", min: "0" }
    ];

    var html =
      '<div class="fx-calculator-shell" style="max-width:900px">' +
        '<div class="fx-calculator-head">' +
          '<h2>Mi Perfil Financiero</h2>' +
          '<p class="muted">Introduce tus datos reales. El Resumen financiero, Flujo de caja, Balance y todas las herramientas de análisis usarán esta información.</p>' +
        '</div>' +
        '<nav style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-bottom:1.5rem;padding-bottom:0.75rem;border-bottom:1px solid rgba(180,160,100,0.18)">' +
          tabBtns +
        '</nav>' +

        // Cuentas
        '<div class="fx-tab-panel" data-panel="cuentas">' +
          '<div class="fx-results-header"><span class="fx-results-icon">CC</span><span class="fx-results-title">Cuentas bancarias</span></div>' +
          '<div id="fp-list-cuentas">' + panelListHtml(profileData.accounts, accountFields, "cuentas") + '</div>' +
          addFormHtml("cuentas", accountFields) +
        '</div>' +

        // Activos
        '<div class="fx-tab-panel" data-panel="activos" ' + tabStyle + '>' +
          '<div class="fx-results-header"><span class="fx-results-icon">AT</span><span class="fx-results-title">Activos y patrimonio</span></div>' +
          '<div id="fp-list-activos">' + panelListHtml(profileData.assets, assetFields, "activos") + '</div>' +
          addFormHtml("activos", assetFields) +
        '</div>' +

        // Deudas
        '<div class="fx-tab-panel" data-panel="deudas" ' + tabStyle + '>' +
          '<div class="fx-results-header"><span class="fx-results-icon">DU</span><span class="fx-results-title">Deudas y pasivos</span></div>' +
          '<div id="fp-list-deudas">' + panelListHtml(profileData.liabilities, liabilityFields, "deudas") + '</div>' +
          addFormHtml("deudas", liabilityFields) +
        '</div>' +

        // Ingresos y gastos recurrentes
        '<div class="fx-tab-panel" data-panel="recurrentes" ' + tabStyle + '>' +
          '<div class="fx-results-header"><span class="fx-results-icon">IG</span><span class="fx-results-title">Ingresos y gastos recurrentes</span></div>' +
          '<p class="muted" style="font-size:0.83rem;margin:0 0 0.75rem">Añade tus ingresos y gastos mensuales fijos. Al guardar se generarán 12 meses de historial automáticamente.</p>' +
          '<div id="fp-list-recurrentes">' + panelListHtml(profileData.recurring, recurringFields, "recurrentes") + '</div>' +
          addFormHtml("recurrentes", recurringFields) +
        '</div>' +

        // Objetivos
        '<div class="fx-tab-panel" data-panel="objetivos" ' + tabStyle + '>' +
          '<div class="fx-results-header"><span class="fx-results-icon">OB</span><span class="fx-results-title">Objetivos financieros</span></div>' +
          '<div id="fp-list-objetivos">' + panelListHtml(profileData.goals, goalFields, "objetivos") + '</div>' +
          addFormHtml("objetivos", goalFields) +
        '</div>' +

        '<div style="margin-top:2rem;padding-top:1.25rem;border-top:1px solid rgba(180,160,100,0.18);display:flex;align-items:center;gap:1.2rem;flex-wrap:wrap">' +
          '<button class="button" id="fp-save-btn" type="button">Guardar y aplicar perfil</button>' +
          '<span id="fp-save-msg" style="display:none;font-size:0.85rem;color:var(--gold,#c8a84b)"></span>' +
        '</div>' +
      '</div>';

    return {
      html: html,
      hookAfterRender: function (container) {

        // ── tab switching ──
        container.querySelectorAll(".fx-tab-btn").forEach(function (btn) {
          btn.style.cssText = "appearance:none;border:1px solid rgba(180,160,100,0.25);background:transparent;color:var(--marble,#44536a);font-family:var(--font-tech,sans-serif);font-size:0.82rem;padding:0.4rem 0.9rem;border-radius:6px;cursor:pointer;transition:all 180ms";
          btn.addEventListener("mouseenter", function() { if (!btn.classList.contains("active")) btn.style.borderColor = "rgba(180,160,100,0.55)"; });
          btn.addEventListener("mouseleave", function() { if (!btn.classList.contains("active")) btn.style.borderColor = "rgba(180,160,100,0.25)"; });
        });
        function activateTab(key) {
          container.querySelectorAll(".fx-tab-btn").forEach(function(b) {
            var on = b.getAttribute("data-tab") === key;
            b.classList.toggle("active", on);
            b.style.background = on ? "var(--gold,#c8a84b)" : "transparent";
            b.style.color = on ? "#fff" : "var(--marble,#44536a)";
            b.style.borderColor = on ? "var(--gold,#c8a84b)" : "rgba(180,160,100,0.25)";
          });
          container.querySelectorAll(".fx-tab-panel").forEach(function(p) {
            p.style.display = p.getAttribute("data-panel") === key ? "" : "none";
          });
        }
        activateTab("cuentas");
        container.querySelectorAll(".fx-tab-btn").forEach(function(btn) {
          btn.addEventListener("click", function() { activateTab(btn.getAttribute("data-tab")); });
        });

        // ── panel → data mapping ──
        var panelFields = {
          cuentas:     accountFields,
          activos:     assetFields,
          deudas:      liabilityFields,
          recurrentes: recurringFields,
          objetivos:   goalFields
        };
        var panelData = {
          cuentas:     profileData.accounts,
          activos:     profileData.assets,
          deudas:      profileData.liabilities,
          recurrentes: profileData.recurring,
          objetivos:   profileData.goals
        };

        // ── re-render a panel list ──
        function reRenderList(panelKey) {
          var el = container.querySelector("#fp-list-" + panelKey);
          if (el) el.innerHTML = panelListHtml(panelData[panelKey], panelFields[panelKey], panelKey);
          wireDelButtons();
        }

        // ── delete buttons ──
        function wireDelButtons() {
          container.querySelectorAll(".fx-del-btn").forEach(function(btn) {
            btn.style.cssText = "appearance:none;border:none;background:rgba(200,50,50,0.12);color:#c04040;border-radius:4px;cursor:pointer;padding:0.2rem 0.45rem;font-size:0.78rem;transition:background 150ms";
            btn.addEventListener("mouseenter", function() { btn.style.background = "rgba(200,50,50,0.22)"; });
            btn.addEventListener("mouseleave", function() { btn.style.background = "rgba(200,50,50,0.12)"; });
            btn.addEventListener("click", function() {
              var pKey = btn.getAttribute("data-panel");
              var idx  = parseInt(btn.getAttribute("data-idx"), 10);
              if (panelData[pKey]) panelData[pKey].splice(idx, 1);
              reRenderList(pKey);
            });
          });
        }
        wireDelButtons();

        // ── add forms ──
        container.querySelectorAll(".fx-profile-add-form").forEach(function(form) {
          form.addEventListener("submit", function(e) {
            e.preventDefault();
            var pKey = form.getAttribute("data-panel");
            var fields = panelFields[pKey];
            var item = {};
            fields.forEach(function(f) {
              var el = form.elements[f.key];
              if (!el) return;
              item[f.key] = f.type === "number" ? (parseFloat(el.value.replace(",", ".")) || 0) : el.value.trim();
            });
            // require at least name
            var nameVal = item.name || item.description;
            if (!nameVal && !item.merchant) return;
            panelData[pKey].push(item);
            reRenderList(pKey);
            form.reset();
          });
        });

        // ── save ──
        function generateTransactionsFromRecurring(recurringItems) {
          var transactions = [];
          var now = new Date();
          recurringItems.forEach(function(item, ri) {
            for (var m = 11; m >= 0; m--) {
              var d = new Date(now.getFullYear(), now.getMonth() - m, item.type === "income" ? 1 : 15);
              var sign = item.type === "expense" ? -1 : 1;
              var amount = Math.abs(parseFloat(item.amount) || 0);
              if (!amount) return;
              transactions.push({
                id: "rec-" + ri + "-" + d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"),
                date: d.toISOString().slice(0, 10),
                merchant: String(item.merchant || item.name || "").toUpperCase().trim(),
                category: item.category || (item.type === "income" ? "ingresos" : "otros"),
                amount: sign * amount,
                isFee: false,
                account: "Cuenta principal"
              });
            }
          });
          return transactions;
        }

        var saveBtn = container.querySelector("#fp-save-btn");
        var saveMsg = container.querySelector("#fp-save-msg");
        if (saveBtn) {
          saveBtn.addEventListener("click", function() {
            var current = loadState();
            // Build updated categoryHints from recurring
            var hints = Object.assign({}, current.categoryHints || {});
            panelData.recurrentes.forEach(function(r) {
              if (r.merchant) hints[r.merchant.toUpperCase().trim()] = r.category || "otros";
            });
            // Generate transactions
            var generated = generateTransactionsFromRecurring(panelData.recurrentes);
            // Keep any manually added transactions (not from recurring generator)
            var manualTx = (current.transactions || []).filter(function(tx) {
              return !String(tx.id).startsWith("rec-");
            });
            var nextState = Object.assign({}, current, {
              accounts:      panelData.cuentas,
              assets:        panelData.activos,
              liabilities:   panelData.deudas,
              goals:         panelData.objetivos,
              recurringItems: panelData.recurrentes,
              categoryHints: hints,
              transactions:  generated.concat(manualTx),
              resolvedDuplicates: []
            });
            saveState(nextState);
            if (saveMsg) {
              saveMsg.textContent = "✓ Perfil guardado. Todas las herramientas de análisis ya usan tus datos reales.";
              saveMsg.style.display = "";
              setTimeout(function() { saveMsg.style.display = "none"; }, 4000);
            }
          });
        }
      }
    };
  }

  /* ── end Perfil financiero ──────────────────────────────────────── */

  const renderers = {
    "inversion::chat de inversiones": renderChatInversiones,
    "resumen financiero": renderResumenFinanciero,
    "estado financiero personal": renderEstadoFinancieroPersonal,
    "flujo de caja": renderFlujoCaja,
    "balance general": renderBalanceGeneral,
    "patrimonio neto": renderPatrimonioNeto,
    "indicadores financieros": renderIndicadoresFinancieros,
    "auditoría automática de gastos": renderAuditoriaGastos,
    "clasificador de transacciones": renderClasificadorTransacciones,
    "detección de comisiones bancarias": renderDeteccionComisiones,
    "detección de gastos duplicados": renderDeteccionDuplicados,
    "mi perfil financiero": renderMiPerfilFinanciero,
    ...Object.fromEntries(Object.entries(calculatorDefinitions).map(([key, definition]) => [key, createCalculatorRenderer(definition)]))
  };

  window.FINANCE_TOOL_RUNTIME = {
    getDashboardDatasets() {
      return window.ZYVOLA_DASHBOARD_DATASETS || {};
    },
    renderToolExperience(toolName, mountNode, context) {
      if (!mountNode) return false;
      const baseKey = normalize(toolName);
      const sectionKey = context && context.section ? normalize(context.section) : "";
      const groupKey = context && context.group ? normalize(context.group) : "";
      const renderer =
        renderers[normalize(`${sectionKey}::${groupKey}::${toolName}`)] ||
        renderers[normalize(`${sectionKey}::${toolName}`)] ||
        renderers[baseKey];
      const hasSpecificRenderer = !!renderer;
      if (!hasSpecificRenderer && (!baseKey || baseKey === "herramienta")) return false;

      const state = loadState();
      const rendered = hasSpecificRenderer ? renderer(state) : renderGenericToolWorkspace(toolName, context);
      if (typeof rendered === "string") {
        mountNode.innerHTML = rendered;
      } else {
        mountNode.innerHTML = rendered.html;
        if (rendered.hookAfterRender) rendered.hookAfterRender(mountNode);
      }

      // Runtime content is mounted after initial page-load observers;
      // mark reveal blocks visible to avoid blank sections.
      mountNode.querySelectorAll(".reveal").forEach((node) => {
        node.classList.add("is-visible");
      });

      return true;
    }
  };
})();

