(function () {
  const STORE_KEY = "zyvola-finance-runtime-v1";

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function sum(values) {
    return values.reduce((acc, n) => acc + n, 0);
  }

  function getState() {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function saveState(next) {
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
    return next;
  }

  function parseDate(value) {
    return new Date(`${value}T00:00:00`);
  }

  function monthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function weekKey(date) {
    const d = new Date(date);
    const first = new Date(d.getFullYear(), 0, 1);
    const dayMs = 24 * 60 * 60 * 1000;
    const week = Math.ceil(((d - first) / dayMs + first.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
  }

  function byMonth(transactions, targetKey) {
    return transactions.filter((tx) => monthKey(parseDate(tx.date)) === targetKey);
  }

  function groupBy(transactions, getKey) {
    const map = new Map();
    transactions.forEach((tx) => {
      const key = getKey(tx);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(tx);
    });
    return map;
  }

  // 1) Resumen financiero
  function calcMonthlyTotals(state, key) {
    const currentKey = key || monthKey(new Date());
    const tx = byMonth(state.transactions, currentKey);
    const ingresos = sum(tx.filter((t) => t.amount > 0).map((t) => t.amount));
    const gastos = sum(tx.filter((t) => t.amount < 0).map((t) => Math.abs(t.amount)));
    return {
      month: currentKey,
      ingresos,
      gastos,
      ahorroPct: ingresos > 0 ? ((ingresos - gastos) / ingresos) * 100 : 0
    };
  }

  function buildIncomeVsExpenseSeries(state, monthsBack) {
    const months = monthsBack || 6;
    const out = [];
    for (let i = months - 1; i >= 0; i -= 1) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      out.push(calcMonthlyTotals(state, monthKey(d)));
    }
    return out;
  }

  function projectEndOfMonth(state, dateLike) {
    const now = dateLike ? new Date(dateLike) : new Date();
    const key = monthKey(now);
    const tx = byMonth(state.transactions, key);
    const day = Math.max(now.getDate(), 1);
    const maxDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const ingresosActual = sum(tx.filter((t) => t.amount > 0).map((t) => t.amount));
    const gastosActual = sum(tx.filter((t) => t.amount < 0).map((t) => Math.abs(t.amount)));
    const factor = maxDay / day;
    return {
      month: key,
      proyectadoIngresos: ingresosActual * factor,
      proyectadoGastos: gastosActual * factor,
      proyectadoNeto: (ingresosActual - gastosActual) * factor
    };
  }

  function alertIfExpenseOverIncome(monthlyTotals) {
    return monthlyTotals.gastos > monthlyTotals.ingresos
      ? "Alerta: gastos por encima de ingresos del mes."
      : null;
  }

  // 2) Estado financiero personal
  function calcLiquidityRatio(state) {
    const liquidos = sum(state.assets.filter((a) => a.type === "liquido").map((a) => a.value));
    const pasivoCorto = sum(state.liabilities.filter((l) => l.type === "corto").map((l) => l.value));
    return pasivoCorto > 0 ? liquidos / pasivoCorto : 999;
  }

  function calcDebtRatio(state) {
    const pasivos = sum(state.liabilities.map((l) => l.value));
    const activos = sum(state.assets.map((a) => a.value));
    return activos > 0 ? pasivos / activos : 0;
  }

  function calcSavingCapacity(state) {
    const monthly = calcMonthlyTotals(state, monthKey(new Date()));
    return {
      neto: monthly.ingresos - monthly.gastos,
      ratio: monthly.ingresos > 0 ? (monthly.ingresos - monthly.gastos) / monthly.ingresos : 0
    };
  }

  function calcInternalFinancialScore(state) {
    const liquidity = Math.min(calcLiquidityRatio(state), 5) / 5;
    const debt = 1 - Math.min(calcDebtRatio(state), 1);
    const saving = Math.max(0, calcSavingCapacity(state).ratio);
    return Math.round((liquidity * 0.35 + debt * 0.35 + saving * 0.3) * 100);
  }

  function buildAutoRecommendations(state) {
    const rec = [];
    const liquidity = calcLiquidityRatio(state);
    const debt = calcDebtRatio(state);
    const saving = calcSavingCapacity(state).ratio;
    if (liquidity < 1.5) rec.push("Aumentar liquidez para cubrir pasivo de corto plazo.");
    if (debt > 0.65) rec.push("Priorizar amortizacion de deuda de mayor coste.");
    if (saving < 0.15) rec.push("Reducir gasto variable para elevar tasa de ahorro.");
    if (!rec.length) rec.push("Estado financiero estable. Mantener plan actual.");
    return rec;
  }

  // 3) Flujo de caja
  function cashFlowByPeriod(state, period) {
    const keyFn =
      period === "daily"
        ? (tx) => tx.date
        : period === "weekly"
          ? (tx) => weekKey(parseDate(tx.date))
          : (tx) => monthKey(parseDate(tx.date));

    const grouped = groupBy(state.transactions, keyFn);
    return [...grouped.entries()]
      .map(([bucket, tx]) => ({
        bucket,
        ingresos: sum(tx.filter((t) => t.amount > 0).map((t) => t.amount)),
        gastos: sum(tx.filter((t) => t.amount < 0).map((t) => Math.abs(t.amount))),
        neto: sum(tx.map((t) => t.amount))
      }))
      .sort((a, b) => String(a.bucket).localeCompare(String(b.bucket)));
  }

  function predictFutureCashFlow(state, monthsAhead) {
    const monthly = cashFlowByPeriod(state, "monthly").slice(-6);
    const avgIn = sum(monthly.map((m) => m.ingresos)) / Math.max(monthly.length, 1);
    const avgOut = sum(monthly.map((m) => m.gastos)) / Math.max(monthly.length, 1);
    const out = [];
    for (let i = 1; i <= (monthsAhead || 3); i += 1) {
      const d = new Date();
      d.setMonth(d.getMonth() + i);
      out.push({
        month: monthKey(d),
        ingresos: avgIn,
        gastos: avgOut,
        neto: avgIn - avgOut
      });
    }
    return out;
  }

  function detectNegativeMonths(state) {
    return cashFlowByPeriod(state, "monthly").filter((m) => m.neto < 0);
  }

  function simulateRemoveExpense(state, categoryOrMerchant) {
    const key = normalize(categoryOrMerchant);
    const matched = state.transactions.filter(
      (tx) => tx.amount < 0 && (normalize(tx.category) === key || normalize(tx.merchant) === key)
    );
    const ahorro = sum(matched.map((tx) => Math.abs(tx.amount)));
    const current = calcMonthlyTotals(state);
    return {
      criterio: categoryOrMerchant,
      ahorroEstimado: ahorro,
      netoActual: current.ingresos - current.gastos,
      netoSimulado: current.ingresos - (current.gastos - ahorro)
    };
  }

  // 4) Balance general
  function registerAsset(state, asset) {
    const next = clone(state);
    next.assets.push(asset);
    return saveState(next);
  }

  function registerLiability(state, liability) {
    const next = clone(state);
    next.liabilities.push(liability);
    return saveState(next);
  }

  function calculateNetWorth(state) {
    return sum(state.assets.map((a) => a.value)) - sum(state.liabilities.map((l) => l.value));
  }

  function revalueAssets(state, revalueMap) {
    const next = clone(state);
    next.assets = next.assets.map((asset) => {
      const factor = revalueMap[asset.name] || 1;
      return { ...asset, value: Math.round(asset.value * factor) };
    });
    return saveState(next);
  }

  function buildNetWorthEvolution(state, monthsBack) {
    const monthly = buildIncomeVsExpenseSeries(state, monthsBack || 12);
    let nw = calculateNetWorth(state);
    return monthly.map((m) => {
      nw += m.ingresos - m.gastos;
      return { month: m.month, netWorth: nw };
    });
  }

  // 5) Patrimonio neto
  function netWorthHistory(state) {
    return buildNetWorthEvolution(state, 12);
  }

  function yearOverYearComparison(state) {
    const history = netWorthHistory(state);
    const grouped = {};
    history.forEach((h) => {
      const year = h.month.slice(0, 4);
      grouped[year] = grouped[year] || { start: h.netWorth, end: h.netWorth };
      grouped[year].end = h.netWorth;
    });
    return Object.entries(grouped).map(([year, values]) => ({
      year,
      start: values.start,
      end: values.end,
      change: values.end - values.start
    }));
  }

  function netWorthDistribution(state) {
    const total = sum(state.assets.map((a) => a.value));
    return state.assets.map((a) => ({
      category: a.type,
      name: a.name,
      value: a.value,
      pct: total > 0 ? (a.value / total) * 100 : 0
    }));
  }

  function setNetWorthGoal(state, goalName, targetValue) {
    const next = clone(state);
    const idx = next.goals.findIndex((g) => normalize(g.name) === normalize(goalName));
    if (idx >= 0) next.goals[idx].target = targetValue;
    else next.goals.push({ name: goalName, target: targetValue, current: calculateNetWorth(next) });
    return saveState(next);
  }

  function netWorthGoalProgress(state) {
    const nw = calculateNetWorth(state);
    return state.goals.map((g) => ({
      goal: g.name,
      target: g.target,
      current: g.current,
      globalCurrent: nw,
      progressPct: g.target > 0 ? (nw / g.target) * 100 : 0
    }));
  }

  // 6) Indicadores financieros
  function savingsRate(state) {
    return calcMonthlyTotals(state).ahorroPct;
  }

  function investmentRate(state) {
    const monthly = calcMonthlyTotals(state);
    const invest = Math.abs(
      sum(byMonth(state.transactions, monthly.month).filter((t) => normalize(t.category) === "inversion").map((t) => t.amount))
    );
    return monthly.ingresos > 0 ? (invest / monthly.ingresos) * 100 : 0;
  }

  function fixedVariableRatio(state) {
    const monthly = byMonth(state.transactions, monthKey(new Date())).filter((t) => t.amount < 0);
    const fixedSet = new Set(["vivienda", "servicios", "suscripciones", "deuda"]);
    const fixed = sum(monthly.filter((t) => fixedSet.has(normalize(t.category))).map((t) => Math.abs(t.amount)));
    const variable = sum(monthly.filter((t) => !fixedSet.has(normalize(t.category))).map((t) => Math.abs(t.amount)));
    return {
      fixed,
      variable,
      ratio: variable > 0 ? fixed / variable : 999
    };
  }

  function financialFreedomMonths(state) {
    const passive = Math.abs(sum(state.transactions.filter((t) => normalize(t.category) === "inversion" && t.amount > 0).map((t) => t.amount)));
    const expense = calcMonthlyTotals(state).gastos;
    return expense > 0 ? passive / expense : 0;
  }

  function passiveVsActiveIncome(state) {
    const monthTx = byMonth(state.transactions, monthKey(new Date())).filter((t) => t.amount > 0);
    const passive = sum(monthTx.filter((t) => normalize(t.category) === "inversion").map((t) => t.amount));
    const active = sum(monthTx.filter((t) => normalize(t.category) !== "inversion").map((t) => t.amount));
    return { passive, active, passivePct: passive + active > 0 ? (passive / (passive + active)) * 100 : 0 };
  }

  // 7) Auditoria automatica de gastos
  function detectExcessByCategory(state, pctThreshold) {
    const threshold = pctThreshold || 20;
    const monthly = cashFlowByPeriod(state, "monthly").slice(-4);
    if (monthly.length < 2) return [];
    const currentMonth = monthKey(new Date());
    const current = byMonth(state.transactions, currentMonth).filter((t) => t.amount < 0);
    const prev3 = state.transactions
      .filter((t) => t.amount < 0 && monthKey(parseDate(t.date)) !== currentMonth)
      .slice(-300);

    const currentMap = {};
    current.forEach((t) => {
      currentMap[t.category] = (currentMap[t.category] || 0) + Math.abs(t.amount);
    });

    const prevMap = {};
    prev3.forEach((t) => {
      prevMap[t.category] = (prevMap[t.category] || 0) + Math.abs(t.amount);
    });

    return Object.keys(currentMap)
      .map((cat) => {
        const prevAvg = (prevMap[cat] || 0) / 3;
        const growth = prevAvg > 0 ? ((currentMap[cat] - prevAvg) / prevAvg) * 100 : 0;
        return { category: cat, current: currentMap[cat], prevAvg, growth };
      })
      .filter((i) => i.growth >= threshold)
      .sort((a, b) => b.growth - a.growth);
  }

  function identifySubscriptions(state) {
    const byMerchant = groupBy(state.transactions.filter((t) => t.amount < 0), (t) => normalize(t.merchant));
    const out = [];
    byMerchant.forEach((list, merchant) => {
      if (list.length < 3) return;
      const amounts = list.map((t) => Math.abs(t.amount));
      const avg = sum(amounts) / amounts.length;
      const stable = amounts.filter((a) => Math.abs(a - avg) / avg < 0.2).length;
      if (stable >= 3) {
        out.push({ merchant, avgMonthly: avg, count: list.length });
      }
    });
    return out.sort((a, b) => b.avgMonthly - a.avgMonthly);
  }

  function detectGrowingExpenses(state) {
    return detectExcessByCategory(state, 12);
  }

  function detectAnomalousMerchants(state) {
    const tx = state.transactions.filter((t) => t.amount < 0);
    const byMerchant = groupBy(tx, (t) => normalize(t.merchant));
    const out = [];
    byMerchant.forEach((list, merchant) => {
      const amounts = list.map((t) => Math.abs(t.amount));
      const avg = sum(amounts) / amounts.length;
      const max = Math.max(...amounts);
      if (max > avg * 2.2 && list.length > 3) out.push({ merchant, avg, max });
    });
    return out;
  }

  function buildExpenseAlerts(state) {
    const alerts = [];
    const excess = detectExcessByCategory(state, 20);
    const anom = detectAnomalousMerchants(state);
    if (excess.length) alerts.push(`Categorias con gasto excesivo: ${excess.map((e) => e.category).join(", ")}`);
    if (anom.length) alerts.push(`Comercios con gasto anormal: ${anom.slice(0, 3).map((a) => a.merchant).join(", ")}`);
    if (!alerts.length) alerts.push("Sin alertas criticas de auditoria.");
    return alerts;
  }

  // 8) Clasificador de transacciones
  function normalizeTransaction(tx) {
    return {
      ...tx,
      merchant: String(tx.merchant || "").toUpperCase().trim(),
      category: normalize(tx.category),
      amount: Number(tx.amount || 0),
      labels: Array.isArray(tx.labels) ? tx.labels : []
    };
  }

  function classifyTransactionAI(tx, hints) {
    const cleaned = normalizeTransaction(tx);
    const dict = hints || {};
    if (dict[cleaned.merchant]) return dict[cleaned.merchant];

    const rules = [
      [/NOMINA|SALARIO/, "ingresos"],
      [/ALQUILER|HIPOTECA/, "vivienda"],
      [/SUPERMERCADO|MERCADO/, "alimentacion"],
      [/NETFLIX|SPOTIFY|PRIME/, "suscripciones"],
      [/GASOLINA|UBER|METRO/, "movilidad"],
      [/BROKER|ETF|ACCION/, "inversion"],
      [/COMISION|MANTENIMIENTO/, "servicios"]
    ];
    const hit = rules.find((r) => r[0].test(cleaned.merchant));
    return hit ? hit[1] : "otros";
  }

  function applyCustomRules(tx, rules) {
    const normalizedRules = rules || [];
    const cleaned = normalizeTransaction(tx);
    const hit = normalizedRules.find((r) => {
      const nameOk = !r.merchant || normalize(cleaned.merchant).includes(normalize(r.merchant));
      const minOk = r.minAmount == null || Math.abs(cleaned.amount) >= r.minAmount;
      const maxOk = r.maxAmount == null || Math.abs(cleaned.amount) <= r.maxAmount;
      return nameOk && minOk && maxOk;
    });
    return hit ? hit.category : null;
  }

  function assignMultiLabels(tx) {
    const labels = [];
    if (tx.amount < 0) labels.push("gasto");
    if (tx.amount > 0) labels.push("ingreso");
    if (Math.abs(tx.amount) > 500) labels.push("alto-impacto");
    if (normalize(tx.category) === "suscripciones") labels.push("recurrente");
    if (!labels.length) labels.push("neutro");
    return labels;
  }

  function correctAndTrain(state, txId, category) {
    const next = clone(state);
    const tx = next.transactions.find((t) => t.id === txId);
    if (!tx) return saveState(next);
    tx.category = normalize(category);
    next.categoryHints[tx.merchant] = tx.category;
    return saveState(next);
  }

  // 9) Deteccion de comisiones bancarias
  function identifyBankFees(state) {
    return state.transactions.filter((tx) => {
      const text = normalize(tx.merchant);
      return tx.amount < 0 && (tx.isFee || text.includes("comision") || text.includes("mantenimiento"));
    });
  }

  function monthlyFeeComparison(state) {
    const grouped = groupBy(identifyBankFees(state), (tx) => monthKey(parseDate(tx.date)));
    return [...grouped.entries()]
      .map(([month, list]) => ({ month, total: Math.abs(sum(list.map((tx) => tx.amount))) }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  function annualFeeTotal(state, year) {
    const targetYear = String(year || new Date().getFullYear());
    return sum(
      identifyBankFees(state)
        .filter((tx) => tx.date.startsWith(targetYear))
        .map((tx) => Math.abs(tx.amount))
    );
  }

  function detectNewFees(state) {
    const recent = identifyBankFees(state).filter((tx) => {
      const d = parseDate(tx.date);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      return d >= cutoff;
    });
    const oldMerchants = new Set(
      identifyBankFees(state)
        .filter((tx) => {
          const d = parseDate(tx.date);
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 30);
          return d < cutoff;
        })
        .map((tx) => normalize(tx.merchant))
    );
    return recent.filter((tx) => !oldMerchants.has(normalize(tx.merchant)));
  }

  function detectHiddenFees(state) {
    return state.transactions.filter((tx) => {
      const m = normalize(tx.merchant);
      return tx.amount < 0 && normalize(tx.category) === "servicios" && (m.includes("ajuste") || m.includes("cargo"));
    });
  }

  // 10) Deteccion de gastos duplicados
  function detectDuplicatesByAmountDateMerchant(state) {
    const tx = state.transactions.filter((t) => t.amount < 0);
    const map = new Map();
    tx.forEach((t) => {
      const key = `${normalize(t.merchant)}|${Math.abs(t.amount)}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    });

    const out = [];
    map.forEach((list) => {
      if (list.length < 2) return;
      const sorted = [...list].sort((a, b) => parseDate(a.date) - parseDate(b.date));
      for (let i = 1; i < sorted.length; i += 1) {
        const d1 = parseDate(sorted[i - 1].date);
        const d2 = parseDate(sorted[i].date);
        const diff = Math.abs((d2 - d1) / (1000 * 60 * 60 * 24));
        if (diff <= 3) out.push({ a: sorted[i - 1], b: sorted[i], key: `${sorted[i - 1].id}|${sorted[i].id}` });
      }
    });
    return out;
  }

  function detectDuplicateSubscriptions(state) {
    const subs = identifySubscriptions(state);
    const tx = state.transactions.filter((t) => normalize(t.category) === "suscripciones");
    const byMerchantMonth = groupBy(tx, (t) => `${normalize(t.merchant)}|${monthKey(parseDate(t.date))}`);
    const duplicates = [];
    byMerchantMonth.forEach((list, key) => {
      if (list.length > 1) duplicates.push({ key, count: list.length, amount: sum(list.map((t) => Math.abs(t.amount))) });
    });
    return { subscriptions: subs, duplicates };
  }

  function confirmDuplicate(state, duplicateKey) {
    const next = clone(state);
    const set = new Set(next.resolvedDuplicates || []);
    set.add(duplicateKey);
    next.resolvedDuplicates = [...set];
    return saveState(next);
  }

  function duplicateRegistry(state) {
    const detected = detectDuplicatesByAmountDateMerchant(state);
    const resolved = new Set(state.resolvedDuplicates || []);
    return {
      abiertos: detected.filter((d) => !resolved.has(d.key)),
      resueltos: detected.filter((d) => resolved.has(d.key))
    };
  }

  function suggestRefund(duplicatePair) {
    return {
      message: `Solicitar reembolso a ${duplicatePair.a.merchant} por cargo duplicado de ${Math.abs(duplicatePair.a.amount)} EUR.`,
      payload: {
        merchant: duplicatePair.a.merchant,
        amount: Math.abs(duplicatePair.a.amount),
        dates: [duplicatePair.a.date, duplicatePair.b.date]
      }
    };
  }

  const endpoints = {
    // Flujo de caja
    "GET /api/finance/cashflow/daily": (state) => cashFlowByPeriod(state, "daily"),
    "GET /api/finance/cashflow/weekly": (state) => cashFlowByPeriod(state, "weekly"),
    "GET /api/finance/cashflow/monthly": (state) => cashFlowByPeriod(state, "monthly"),
    "GET /api/finance/cashflow/predict": (state, params) => predictFutureCashFlow(state, Number(params.months || 3)),
    "GET /api/finance/cashflow/negative-months": (state) => detectNegativeMonths(state),
    "POST /api/finance/cashflow/simulate-remove": (state, body) => simulateRemoveExpense(state, body.categoryOrMerchant),

    // Clasificador
    "POST /api/finance/classifier/classify": (state, body) => {
      const normalizedTx = normalizeTransaction(body.transaction || {});
      const category =
        applyCustomRules(normalizedTx, body.rules || []) || classifyTransactionAI(normalizedTx, state.categoryHints || {});
      return {
        ...normalizedTx,
        category,
        labels: assignMultiLabels({ ...normalizedTx, category })
      };
    },
    "POST /api/finance/classifier/correct": (state, body) => correctAndTrain(state, body.txId, body.category),
    "POST /api/finance/classifier/normalize": (_state, body) => normalizeTransaction(body.transaction || {}),

    // Duplicados
    "GET /api/finance/duplicates": (state) => duplicateRegistry(state),
    "GET /api/finance/duplicates/subscriptions": (state) => detectDuplicateSubscriptions(state),
    "POST /api/finance/duplicates/confirm": (state, body) => confirmDuplicate(state, body.duplicateKey),
    "POST /api/finance/duplicates/refund-suggestion": (_state, body) => suggestRefund(body.duplicatePair)
  };

  function callEndpoint(method, path, paramsOrBody) {
    const state = getState();
    if (!state) throw new Error("Estado financiero no inicializado.");
    const key = `${String(method || "GET").toUpperCase()} ${path}`;
    const handler = endpoints[key];
    if (!handler) throw new Error(`Endpoint no implementado: ${key}`);
    if (String(method || "GET").toUpperCase() === "GET") return handler(state, paramsOrBody || {});
    return handler(state, paramsOrBody || {});
  }

  window.FINANCE_MODULE_ENGINE = {
    // shared
    getState,
    saveState,

    // 1 resumen
    calcMonthlyTotals,
    buildIncomeVsExpenseSeries,
    projectEndOfMonth,
    alertIfExpenseOverIncome,

    // 2 estado
    calcLiquidityRatio,
    calcDebtRatio,
    calcSavingCapacity,
    calcInternalFinancialScore,
    buildAutoRecommendations,

    // 3 flujo
    cashFlowByPeriod,
    predictFutureCashFlow,
    detectNegativeMonths,
    simulateRemoveExpense,

    // 4 balance
    registerAsset,
    registerLiability,
    calculateNetWorth,
    revalueAssets,
    buildNetWorthEvolution,

    // 5 patrimonio
    netWorthHistory,
    yearOverYearComparison,
    netWorthDistribution,
    setNetWorthGoal,
    netWorthGoalProgress,

    // 6 indicadores
    savingsRate,
    investmentRate,
    fixedVariableRatio,
    financialFreedomMonths,
    passiveVsActiveIncome,

    // 7 auditoria
    detectExcessByCategory,
    identifySubscriptions,
    detectGrowingExpenses,
    detectAnomalousMerchants,
    buildExpenseAlerts,

    // 8 clasificador
    classifyTransactionAI,
    applyCustomRules,
    correctAndTrain,
    assignMultiLabels,
    normalizeTransaction,

    // 9 comisiones
    identifyBankFees,
    monthlyFeeComparison,
    annualFeeTotal,
    detectNewFees,
    detectHiddenFees,

    // 10 duplicados
    detectDuplicatesByAmountDateMerchant,
    detectDuplicateSubscriptions,
    confirmDuplicate,
    duplicateRegistry,
    suggestRefund,

    // endpoint facade
    endpoints,
    callEndpoint
  };
})();
