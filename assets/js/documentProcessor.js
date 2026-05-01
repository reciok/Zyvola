(function (global) {
  'use strict';


  /* ── type detection ──────────────────────────────────────────────── */

  function detectDocumentType(filename) {
    var ext = String(filename || '').split('.').pop().toLowerCase().trim();
    var map = {
      txt:  'text',
      md:   'markdown',
      pdf:  'pdf',
      docx: 'word',
      csv:  'csv',
      json: 'json',
      xlsx: 'excel',
      xls:  'excel'
    };
    return map[ext] || 'unknown';
  }

  /* ── read ────────────────────────────────────────────────────────── */

  function readUploadedFile(file) {
    return new Promise(function (resolve, reject) {
      var type = detectDocumentType(file.name);
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('Error al leer el archivo.')); };

      if (type === 'excel' || type === 'pdf' || type === 'word') {
        reader.onload = function (e) {
          resolve({ raw: e.target.result, type: type, filename: file.name, size: file.size });
        };
        reader.readAsArrayBuffer(file);
      } else {
        reader.onload = function (e) {
          resolve({ raw: e.target.result, type: type, filename: file.name, size: file.size });
        };
        reader.readAsText(file, 'UTF-8');
      }
    });
  }

  /* ── auxiliary parsers ───────────────────────────────────────────── */

  function summarizeText(text) {
    var clean = String(text || '').replace(/\s+/g, ' ').trim();
    var sentences = clean.match(/[^.!?\n]+[.!?]*/g) || [];
    return sentences.slice(0, 3).join(' ').trim() || clean.slice(0, 200);
  }

  function parseCSV(text) {
    var lines = String(text || '').trim().split(/\r?\n/);
    if (lines.length < 1) return [];

    function splitLine(line) {
      var values = [];
      var current = '';
      var inQuote = false;
      for (var i = 0; i < line.length; i++) {
        var ch = line[i];
        if (ch === '"') { inQuote = !inQuote; continue; }
        if (ch === ',' && !inQuote) { values.push(current.trim()); current = ''; continue; }
        current += ch;
      }
      values.push(current.trim());
      return values;
    }

    var headers = splitLine(lines[0]);
    var rows = [];
    for (var r = 1; r < lines.length; r++) {
      if (!lines[r].trim()) continue;
      var vals = splitLine(lines[r]);
      var row = {};
      headers.forEach(function (h, i) {
        row[h] = vals[i] !== undefined ? vals[i] : '';
      });
      rows.push(row);
    }
    return rows;
  }

  function parseExcel(arrayBuffer) {
    var XLSX = global.XLSX;
    if (!XLSX) {
      return { type: 'excel', error: 'SheetJS (XLSX) no está cargado. Verifica la conexión.', sheets: {}, sheetNames: [] };
    }
    try {
      var workbook = XLSX.read(arrayBuffer, { type: 'array' });
      var sheets = {};
      workbook.SheetNames.forEach(function (name) {
        sheets[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: '' });
      });
      return { type: 'excel', sheets: sheets, sheetNames: workbook.SheetNames };
    } catch (e) {
      return { type: 'excel', error: 'Error al parsear Excel: ' + e.message, sheets: {}, sheetNames: [] };
    }
  }

  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'campo';
  }

  function toNumber(value) {
    if (typeof value === 'number' && isFinite(value)) return value;
    if (value == null) return NaN;
    var raw = String(value).trim();
    if (!raw) return NaN;

    var normalized = raw
      .replace(/\s+/g, '')
      .replace(/\.(?=\d{3}(\D|$))/g, '')
      .replace(/,/g, '.');

    var n = Number(normalized);
    return isFinite(n) ? n : NaN;
  }

  function isDateLike(value) {
    if (value == null || value === '') return false;
    if (value instanceof Date) return !isNaN(value.getTime());
    if (typeof value === 'number' && isFinite(value) && value > 20000 && value < 70000) return true;
    var parsed = Date.parse(String(value));
    return !isNaN(parsed);
  }

  function getColumnTypeStats(rows, columnName) {
    var nonEmpty = 0;
    var numeric = 0;
    var dateLike = 0;
    var uniqueMap = {};

    rows.forEach(function (row) {
      var val = row && row[columnName];
      if (val == null || val === '') return;
      nonEmpty += 1;
      if (isFinite(toNumber(val))) numeric += 1;
      if (isDateLike(val)) dateLike += 1;
      if (Object.keys(uniqueMap).length < 80) uniqueMap[String(val)] = 1;
    });

    var uniqueCount = Object.keys(uniqueMap).length;
    return {
      nonEmpty: nonEmpty,
      numericRatio: nonEmpty ? (numeric / nonEmpty) : 0,
      dateRatio: nonEmpty ? (dateLike / nonEmpty) : 0,
      uniqueCount: uniqueCount
    };
  }

  function chooseXAxisColumn(rows, columns, statsMap) {
    var dateCol = columns.find(function (col) {
      var st = statsMap[col];
      return st && st.nonEmpty > 0 && st.dateRatio >= 0.6;
    });
    if (dateCol) return dateCol;

    var categoryCol = columns.find(function (col) {
      var st = statsMap[col];
      return st && st.nonEmpty > 0 && st.numericRatio < 0.5 && st.uniqueCount >= 2 && st.uniqueCount <= 24;
    });
    return categoryCol || null;
  }

  function inferTopicFromColumns(columnNames) {
    var joined = columnNames.join(' ').toLowerCase();
    var rules = [
      { topic: 'ventas e ingresos', re: /(venta|factura|ingreso|cliente|ticket|precio|importe)/ },
      { topic: 'gastos y presupuesto', re: /(gasto|coste|costo|presupuesto|egreso|proveedor)/ },
      { topic: 'contabilidad y flujo de caja', re: /(saldo|cuenta|debe|haber|asiento|caja|cash)/ },
      { topic: 'inventario y operaciones', re: /(stock|inventario|sku|almacen|existencia|unidad)/ },
      { topic: 'personas y nomina', re: /(empleado|nomina|salario|rrhh|equipo|puesto)/ }
    ];

    for (var i = 0; i < rules.length; i += 1) {
      if (rules[i].re.test(joined)) return rules[i].topic;
    }
    return 'indicadores operativos';
  }

  function safePercent(value) {
    return isFinite(value) ? Number(value.toFixed(2)) : null;
  }

  function createEmptyAnalysis() {
    return {
      insights: [],
      risks: [],
      opportunities: [],
      anomalies: []
    };
  }

  function pushFinding(list, title, detail, level) {
    list.push({
      title: String(title || 'Hallazgo'),
      detail: String(detail || ''),
      level: level || 'info'
    });
  }

  function mergeAnalysis(base, extra) {
    base = base || createEmptyAnalysis();
    extra = extra || createEmptyAnalysis();
    return {
      insights: (base.insights || []).concat(extra.insights || []),
      risks: (base.risks || []).concat(extra.risks || []),
      opportunities: (base.opportunities || []).concat(extra.opportunities || []),
      anomalies: (base.anomalies || []).concat(extra.anomalies || [])
    };
  }

  function topUniqueFindings(items, limit) {
    var seen = {};
    var out = [];
    (items || []).forEach(function (it) {
      var key = (it.title || '') + '|' + (it.detail || '');
      if (seen[key]) return;
      seen[key] = 1;
      out.push(it);
    });
    return out.slice(0, limit || 8);
  }

  /* ── linear regression & forecast ───────────────────────────────── */

  function linearRegressionForecast(values) {
    if (!values || values.length < 4) return null;
    var n = values.length;
    var sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (var i = 0; i < n; i++) {
      sumX += i; sumY += values[i];
      sumXY += i * values[i]; sumXX += i * i;
    }
    var denom = n * sumXX - sumX * sumX;
    if (denom === 0) return null;
    var slope = (n * sumXY - sumX * sumY) / denom;
    var intercept = (sumY - slope * sumX) / n;
    var meanY = sumY / n;
    var ssTot = 0, ssRes = 0;
    for (var j = 0; j < n; j++) {
      ssTot += Math.pow(values[j] - meanY, 2);
      ssRes += Math.pow(values[j] - (slope * j + intercept), 2);
    }
    var r2 = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;
    return {
      slope: slope,
      intercept: intercept,
      r2: r2,
      nextValue: slope * n + intercept,
      trend: slope > 0.0001 ? 'creciente' : slope < -0.0001 ? 'decreciente' : 'plana'
    };
  }

  /* ── pearson correlation ─────────────────────────────────────────── */

  function pearsonCorrelation(a, b) {
    var n = Math.min(a.length, b.length);
    if (n < 5) return NaN;
    var sumA = 0, sumB = 0;
    for (var i = 0; i < n; i++) { sumA += a[i]; sumB += b[i]; }
    var mA = sumA / n, mB = sumB / n;
    var num = 0, dA = 0, dB = 0;
    for (var j = 0; j < n; j++) {
      var da = a[j] - mA, db = b[j] - mB;
      num += da * db; dA += da * da; dB += db * db;
    }
    var den = Math.sqrt(dA * dB);
    return den > 0 ? num / den : NaN;
  }

  function findTopCorrelations(rows, numericCols) {
    var results = [];
    if (!numericCols || numericCols.length < 2) return results;
    var colVals = {};
    numericCols.forEach(function (col) {
      colVals[col] = rows.map(function (r) { return toNumber(r[col]); }).filter(isFinite);
    });
    for (var i = 0; i < numericCols.length - 1; i++) {
      for (var j = i + 1; j < numericCols.length; j++) {
        var cA = numericCols[i], cB = numericCols[j];
        var vA = colVals[cA], vB = colVals[cB];
        var n = Math.min(vA.length, vB.length);
        if (n < 5) continue;
        var r = pearsonCorrelation(vA.slice(0, n), vB.slice(0, n));
        if (isFinite(r)) results.push({ colA: cA, colB: cB, r: r, absR: Math.abs(r) });
      }
    }
    results.sort(function (a, b) { return b.absR - a.absR; });
    return results.slice(0, 3);
  }

  /* ── tone detection ──────────────────────────────────────────────── */

  function analyzeTone(text) {
    var lower = String(text || '').toLowerCase();
    var riskKws = ['pérdida','perdida','riesgo','deuda','mora','incumplimiento','déficit','deficit',
      'caída','caida','reducción','reduccion','recorte','quiebra','insolvencia','impago',
      'negativo','deterioro','disminución','disminucion','fraude','multa','sanción','sancion',
      'embargo','litigio','escasez','impagado','pérdidas','endeudamiento'];
    var posKws = ['crecimiento','beneficio','superávit','superavit','ganancia','incremento',
      'mejora','expansión','expansion','oportunidad','rentabilidad','éxito','exito',
      'positivo','inversión','inversion','dividendo','liquidez','solvencia','eficiencia',
      'optimización','optimizacion','ahorro','excedente','fortaleza','recuperación','recuperacion'];
    var riskCount = 0, posCount = 0;
    var riskFound = [], posFound = [];
    riskKws.forEach(function (kw) {
      var escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var m = lower.match(new RegExp(escaped, 'g'));
      if (m) { riskCount += m.length; if (riskFound.indexOf(kw) < 0) riskFound.push(kw); }
    });
    posKws.forEach(function (kw) {
      var escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var m = lower.match(new RegExp(escaped, 'g'));
      if (m) { posCount += m.length; if (posFound.indexOf(kw) < 0) posFound.push(kw); }
    });
    var total = riskCount + posCount;
    var score = total > 0 ? Math.round((posCount / total) * 100) : -1;
    var signal, cls;
    if (score < 0)        { signal = 'Neutro';   cls = 'neutral';  }
    else if (score >= 65) { signal = 'Positivo'; cls = 'positive'; }
    else if (score <= 35) { signal = 'Alerta';   cls = 'alert';    }
    else                  { signal = 'Mixto';    cls = 'mixed';    }
    return {
      toneScore: score < 0 ? 50 : score,
      signal: signal,
      signalClass: cls,
      riskCount: riskCount,
      positiveCount: posCount,
      riskKeywords: riskFound.slice(0, 5),
      positiveKeywords: posFound.slice(0, 5)
    };
  }

  function analyzeText(processed) {
    var analysis = createEmptyAnalysis();
    var raw = String(processed && processed.raw || '');
    var text = raw.replace(/\s+/g, ' ').trim();
    if (!text) {
      pushFinding(analysis.risks, 'Documento sin contenido', 'El texto extraído está vacío o no contiene información utilizable.', 'high');
      return analysis;
    }

    var words = text.split(/\s+/).filter(Boolean);
    var lines = raw.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    var uniqueLineMap = {};
    var duplicatedLines = 0;
    lines.forEach(function (line) {
      if (uniqueLineMap[line]) duplicatedLines += 1;
      uniqueLineMap[line] = (uniqueLineMap[line] || 0) + 1;
    });

    if (words.length < 80) {
      pushFinding(analysis.risks, 'Contenido limitado', 'El documento tiene pocas palabras para extraer conclusiones robustas.', 'medium');
    } else {
      pushFinding(analysis.insights, 'Base textual suficiente', 'Se detecta volumen de texto adecuado para análisis cualitativo.', 'info');
    }

    if (duplicatedLines > 0) {
      pushFinding(analysis.anomalies, 'Frases repetidas', 'Se identificaron ' + duplicatedLines + ' línea(s) repetida(s), posible ruido o duplicación.', 'medium');
    }

    var tokenMap = {};
    words.forEach(function (w) {
      var token = w.toLowerCase().replace(/[^a-z0-9áéíóúñü]/gi, '');
      if (token.length < 4) return;
      tokenMap[token] = (tokenMap[token] || 0) + 1;
    });
    var dominant = Object.keys(tokenMap).sort(function (a, b) { return tokenMap[b] - tokenMap[a]; })[0];
    if (dominant && tokenMap[dominant] >= 6) {
      pushFinding(analysis.insights, 'Tema dominante detectado', 'El término "' + dominant + '" aparece con alta frecuencia, útil para segmentar contenido.', 'info');
    }

    return analysis;
  }

  function analyzeTabular(rows, sourceName) {
    var analysis = createEmptyAnalysis();
    rows = Array.isArray(rows) ? rows : [];
    if (!rows.length) {
      pushFinding(analysis.risks, 'Sin registros', 'No hay filas disponibles en ' + sourceName + ' para detectar patrones.', 'high');
      return analysis;
    }

    var columnsMap = {};
    rows.slice(0, 500).forEach(function (row) {
      Object.keys(row || {}).forEach(function (k) {
        if (k) columnsMap[k] = 1;
      });
    });
    var columns = Object.keys(columnsMap);
    if (!columns.length) {
      pushFinding(analysis.risks, 'Sin columnas detectadas', 'No se identificaron columnas estructuradas en ' + sourceName + '.', 'high');
      return analysis;
    }

    var duplicateCount = 0;
    var rowSignatures = {};
    rows.forEach(function (row) {
      var sig = JSON.stringify(row || {});
      if (rowSignatures[sig]) duplicateCount += 1;
      rowSignatures[sig] = 1;
    });
    if (duplicateCount > 0) {
      pushFinding(analysis.risks, 'Duplicados detectados', 'Se encontraron ' + duplicateCount + ' fila(s) duplicada(s) en ' + sourceName + '.', 'high');
    }

    var numericColumns = [];
    columns.forEach(function (col) {
      var st = getColumnTypeStats(rows, col);
      var emptyRatio = st.nonEmpty ? 1 - (st.nonEmpty / rows.length) : 1;

      if (emptyRatio >= 0.6) {
        pushFinding(analysis.risks, 'Columna con alta vaciedad', '"' + col + '" tiene ' + Math.round(emptyRatio * 100) + '% de valores vacíos.', 'medium');
      }

      if (st.nonEmpty >= 8 && st.numericRatio > 0.2 && st.numericRatio < 0.8) {
        pushFinding(analysis.anomalies, 'Incoherencia numérica', '"' + col + '" mezcla valores numéricos y no numéricos; revisar tipado.', 'medium');
      }

      if (st.nonEmpty >= 8) {
        var valueFreq = {};
        rows.forEach(function (row) {
          var v = row && row[col];
          if (v == null || v === '') return;
          var key = String(v);
          valueFreq[key] = (valueFreq[key] || 0) + 1;
        });
        var topValue = Object.keys(valueFreq).sort(function (a, b) { return valueFreq[b] - valueFreq[a]; })[0];
        var topRatio = topValue ? (valueFreq[topValue] / st.nonEmpty) : 0;
        if (topRatio >= 0.85) {
          pushFinding(analysis.anomalies, 'Valor repetido dominante', '"' + col + '" repite "' + topValue + '" en ' + Math.round(topRatio * 100) + '% de los registros.', 'medium');
        }
      }

      if (st.numericRatio >= 0.75 && st.nonEmpty >= 6 && st.dateRatio < 0.6) {
        numericColumns.push(col);
      }
    });

    numericColumns.slice(0, 6).forEach(function (col) {
      var values = rows.map(function (r) { return toNumber(r[col]); }).filter(isFinite);
      if (values.length < 3) return;

      var first = values[0];
      var last = values[values.length - 1];
      var change = last - first;
      var changePct = first !== 0 ? (change / Math.abs(first)) * 100 : NaN;

      var sum = values.reduce(function (acc, v) { return acc + v; }, 0);
      var avg = sum / values.length;
      var variance = values.reduce(function (acc, v) {
        var d = v - avg;
        return acc + d * d;
      }, 0) / values.length;
      var stdDev = Math.sqrt(variance);

      if (isFinite(changePct) && changePct >= 12) {
        pushFinding(analysis.opportunities, 'Tendencia positiva en ' + col, 'Crecimiento de ' + changePct.toFixed(2) + '% en el periodo analizado.', 'info');
      } else if (isFinite(changePct) && changePct <= -12) {
        pushFinding(analysis.risks, 'Tendencia negativa en ' + col, 'Descenso de ' + Math.abs(changePct).toFixed(2) + '% en el periodo analizado.', 'high');
      }

      var anomalyCount = 0;
      if (stdDev > 0) {
        values.forEach(function (v) {
          var z = Math.abs((v - avg) / stdDev);
          if (z >= 2.5) anomalyCount += 1;
        });
      }
      if (anomalyCount > 0) {
        pushFinding(analysis.anomalies, 'Outliers en ' + col, 'Se detectaron ' + anomalyCount + ' valor(es) atípico(s) por z-score.', anomalyCount >= 3 ? 'high' : 'medium');
      }
    });

    if (numericColumns.length >= 2) {
      var colA = numericColumns[0];
      var colB = numericColumns[1];
      var valsA = rows.map(function (r) { return toNumber(r[colA]); }).filter(isFinite);
      var valsB = rows.map(function (r) { return toNumber(r[colB]); }).filter(isFinite);
      var meanA = valsA.length ? valsA.reduce(function (a, b) { return a + b; }, 0) / valsA.length : NaN;
      var meanB = valsB.length ? valsB.reduce(function (a, b) { return a + b; }, 0) / valsB.length : NaN;
      if (isFinite(meanA) && isFinite(meanB) && meanB !== 0) {
        var ratio = meanA / meanB;
        pushFinding(analysis.insights, 'Ratio relevante', 'Relación media ' + colA + '/' + colB + ': ' + ratio.toFixed(3) + '.', 'info');
      }
    }

    /* ── regression forecasts ── */
    numericColumns.slice(0, 4).forEach(function (col) {
      var values = rows.map(function (r) { return toNumber(r[col]); }).filter(isFinite);
      var fc = linearRegressionForecast(values);
      if (!fc || fc.r2 < 0.6) return;
      var nextFmt = isFinite(fc.nextValue) ? fmtMoney(fc.nextValue) : '\u2014';
      if (fc.slope > 0) {
        pushFinding(analysis.opportunities, 'Proyección positiva: ' + col,
          'Tendencia ' + fc.trend + ' (R\u00b2\u202f=\u202f' + fc.r2.toFixed(2) + '). Siguiente periodo estimado: ' + nextFmt + '.', 'info');
      } else if (fc.slope < 0) {
        pushFinding(analysis.risks, 'Proyección negativa: ' + col,
          'Tendencia ' + fc.trend + ' (R\u00b2\u202f=\u202f' + fc.r2.toFixed(2) + '). Siguiente periodo estimado: ' + nextFmt + '.', 'medium');
      }
    });

    /* ── column correlations ── */
    var topCorrs = findTopCorrelations(rows, numericColumns.slice(0, 6));
    topCorrs.forEach(function (corr) {
      if (corr.absR < 0.65) return;
      var strength = corr.absR >= 0.85 ? 'muy alta' : 'alta';
      var direction = corr.r > 0 ? 'positiva' : 'negativa';
      pushFinding(analysis.insights,
        'Correlación ' + strength + ': ' + corr.colA + ' / ' + corr.colB,
        'Correlación ' + direction + ' de ' + corr.r.toFixed(3) + '. ' +
          (corr.r > 0 ? 'Ambas variables se mueven en la misma dirección.' : 'Variables inversamente relacionadas.'),
        'info');
    });

    if (!analysis.insights.length && !analysis.risks.length && !analysis.opportunities.length && !analysis.anomalies.length) {
      pushFinding(analysis.insights, 'Estructura consistente', 'No se detectaron señales críticas en ' + sourceName + '.', 'info');
    }

    analysis.insights = topUniqueFindings(analysis.insights, 6);
    analysis.risks = topUniqueFindings(analysis.risks, 6);
    analysis.opportunities = topUniqueFindings(analysis.opportunities, 6);
    analysis.anomalies = topUniqueFindings(analysis.anomalies, 6);
    return analysis;
  }

  function analyzeCSV(processed) {
    return analyzeTabular(processed && processed.rows, 'CSV');
  }

  function analyzeJSON(processed) {
    var analysis = createEmptyAnalysis();
    if (!processed || processed.error) {
      pushFinding(analysis.risks, 'JSON inválido', processed && processed.error ? processed.error : 'No se pudo interpretar el JSON.', 'high');
      return analysis;
    }

    var data = processed.data;
    if (Array.isArray(data) && data.length && typeof data[0] === 'object' && data[0] !== null) {
      return analyzeTabular(data, 'JSON');
    }

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      var keys = Object.keys(data);
      pushFinding(analysis.insights, 'JSON objeto detectado', 'Se identificaron ' + keys.length + ' clave(s) raíz.', 'info');
      var scalarCount = keys.filter(function (k) {
        var v = data[k];
        return v == null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
      }).length;
      if (scalarCount >= 2) {
        pushFinding(analysis.opportunities, 'Campos listos para KPI', scalarCount + ' clave(s) son escalares y pueden mapearse a KPIs.', 'info');
      }
      return analysis;
    }

    pushFinding(analysis.anomalies, 'Estructura JSON no tabular', 'El contenido no corresponde a una tabla ni a un objeto de negocio estándar.', 'medium');
    return analysis;
  }

  function analyzeExcel(processed) {
    var analysis = createEmptyAnalysis();
    if (!processed || processed.error) {
      pushFinding(analysis.risks, 'Excel con error', processed && processed.error ? processed.error : 'No se pudo procesar el Excel.', 'high');
      return analysis;
    }

    var sheetNames = processed.sheetNames || [];
    if (!sheetNames.length) {
      pushFinding(analysis.risks, 'Excel sin hojas', 'No hay hojas disponibles para análisis.', 'high');
      return analysis;
    }

    sheetNames.forEach(function (name) {
      var rows = processed.sheets && processed.sheets[name] || [];
      analysis = mergeAnalysis(analysis, analyzeTabular(rows, 'Excel · ' + name));
    });

    if (processed.insights && processed.insights.executive) {
      pushFinding(analysis.insights, 'Cobertura de series', 'Se construyeron ' + (processed.insights.stats && processed.insights.stats.datasets || 0) + ' series para lectura global.', 'info');
      if (processed.insights.executive.anomalyAlerts > 0) {
        pushFinding(analysis.risks, 'Anomalías detectadas en series', processed.insights.executive.anomalyAlerts + ' serie(s) presentan alertas de anomalía.', 'medium');
      }
    }

    analysis.insights = topUniqueFindings(analysis.insights, 8);
    analysis.risks = topUniqueFindings(analysis.risks, 8);
    analysis.opportunities = topUniqueFindings(analysis.opportunities, 8);
    analysis.anomalies = topUniqueFindings(analysis.anomalies, 8);
    return analysis;
  }

  function analyzePending(processed) {
    var analysis = analyzeText(processed || {});
    pushFinding(analysis.insights, 'Análisis documental base', 'Extracción de texto completada. Se aplicó análisis preliminar orientado a negocio.', 'info');
    pushFinding(analysis.anomalies, 'Análisis estructural pendiente', 'Para PDF/DOCX se recomienda clasificación semántica por secciones en una fase avanzada.', 'medium');
    return analysis;
  }

  function analyzeDocument(processed, type) {
    switch (type) {
      case 'text':
      case 'markdown':
        return analyzeText(processed);
      case 'csv':
        return analyzeCSV(processed);
      case 'json':
        return analyzeJSON(processed);
      case 'excel':
        return analyzeExcel(processed);
      case 'pdf':
      case 'word':
        return analyzePending(processed);
      default: {
        var fallback = createEmptyAnalysis();
        pushFinding(fallback.risks, 'Tipo no soportado', 'No hay un analizador específico para este tipo de documento.', 'medium');
        return fallback;
      }
    }
  }

  /* ── data quality score ──────────────────────────────────────────── */

  function calculateDataQualityScore(rows) {
    if (!rows || !rows.length) return { score: 0, completeness: 0, uniqueness: 0, coherence: 0, label: 'Sin datos' };
    var cols = Object.keys(rows[0] || {});
    if (!cols.length) return { score: 0, completeness: 0, uniqueness: 0, coherence: 0, label: 'Sin columnas' };
    var totalCells = rows.length * cols.length;
    var filled = 0;
    rows.forEach(function (row) {
      cols.forEach(function (c) { if (row[c] != null && row[c] !== '') filled++; });
    });
    var completeness = totalCells > 0 ? filled / totalCells : 0;
    var sigs = {}, dupes = 0;
    rows.forEach(function (row) {
      var sig = JSON.stringify(row);
      if (sigs[sig]) dupes++;
      sigs[sig] = 1;
    });
    var uniqueness = 1 - (dupes / rows.length);
    var coherentCols = 0;
    cols.forEach(function (col) {
      var st = getColumnTypeStats(rows, col);
      if (st.nonEmpty === 0) { coherentCols += 0.5; return; }
      if (st.numericRatio >= 0.85 || st.numericRatio <= 0.15 || st.dateRatio >= 0.7) coherentCols += 1;
      else coherentCols += 0.4;
    });
    var coherence = cols.length > 0 ? coherentCols / cols.length : 0;
    var score = Math.round(completeness * 40 + uniqueness * 35 + coherence * 25);
    var label = score >= 85 ? 'Excelente' : score >= 70 ? 'Buena' : score >= 50 ? 'Regular' : 'Baja';
    return {
      score: score,
      completeness: Math.round(completeness * 100),
      uniqueness: Math.round(uniqueness * 100),
      coherence: Math.round(coherence * 100),
      label: label
    };
  }

  function calculateImpactScore(analysis) {
    analysis = analysis || createEmptyAnalysis();
    var riskCount = (analysis.risks || []).length;
    var oppCount = (analysis.opportunities || []).length;
    var anomalyCount = (analysis.anomalies || []).length;

    var estimatedLoss = riskCount * 1200 + anomalyCount * 350;
    var estimatedGain = oppCount * 1000 + (analysis.insights || []).length * 250;
    var net = estimatedGain - estimatedLoss;
    var priority = estimatedLoss >= 5000 ? 'high' : estimatedLoss >= 2000 ? 'medium' : 'low';

    if (net > 0 && estimatedLoss < 3000) {
      priority = 'opportunity';
    }

    return {
      estimatedLoss: estimatedLoss,
      estimatedGain: estimatedGain,
      priority: priority
    };
  }

  function generateActions(analysis, impactScore) {
    analysis = analysis || createEmptyAnalysis();
    impactScore = impactScore || { estimatedLoss: 0, estimatedGain: 0, priority: 'low' };
    var actions = [];

    if ((analysis.risks || []).length) {
      actions.push({
        title: 'Mitigar riesgos críticos',
        detail: 'Prioriza los 2 riesgos con mayor impacto y define responsables y fecha objetivo en 7 días.'
      });
    }

    if ((analysis.anomalies || []).length) {
      actions.push({
        title: 'Auditar calidad de datos',
        detail: 'Revisar duplicados, columnas vacías e incoherencias numéricas antes del próximo ciclo de decisión.'
      });
    }

    if ((analysis.opportunities || []).length) {
      actions.push({
        title: 'Escalar oportunidades',
        detail: 'Convertir oportunidades detectadas en hipótesis con KPI y seguimiento quincenal.'
      });
    }

    if (impactScore.estimatedLoss > impactScore.estimatedGain) {
      actions.push({
        title: 'Plan defensivo inmediato',
        detail: 'Activar contención de pérdida estimada y revisión presupuestaria focalizada.'
      });
    } else {
      actions.push({
        title: 'Plan de captura de valor',
        detail: 'Reasignar recursos hacia las áreas con mayor ganancia potencial estimada.'
      });
    }

    if (!actions.length) {
      actions.push({
        title: 'Mantener monitoreo',
        detail: 'No hay señales críticas. Ejecutar seguimiento periódico para validar estabilidad.'
      });
    }

    return actions.slice(0, 5);
  }

  function buildExecutiveSummary(analysis, impactScore) {
    analysis = analysis || createEmptyAnalysis();
    impactScore = impactScore || { estimatedLoss: 0, estimatedGain: 0, priority: 'low' };
    var keyRisks = (analysis.risks || []).slice(0, 3).map(function (r) { return r.title; });
    var keyOpportunities = (analysis.opportunities || []).slice(0, 3).map(function (o) { return o.title; });

    var headline = 'Impacto estimado: pérdida ' + fmtMoney(-impactScore.estimatedLoss) + ' | ganancia ' + fmtMoney(impactScore.estimatedGain) + '.';
    return {
      headline: headline,
      priority: impactScore.priority,
      keyRisks: keyRisks,
      keyOpportunities: keyOpportunities
    };
  }

  function enrichWithBusinessAnalysis(processed, type) {
    var analysis = analyzeDocument(processed, type);
    var impactScore = calculateImpactScore(analysis);
    var actions = generateActions(analysis, impactScore);
    var executiveSummary = buildExecutiveSummary(analysis, impactScore);

    processed.analysis = analysis;
    processed.impactScore = impactScore;
    processed.actions = actions;
    processed.executiveSummary = executiveSummary;

    /* quality score for tabular types */
    var qualityRows = null;
    if (type === 'csv' && processed.rows) {
      qualityRows = processed.rows;
    } else if (type === 'json' && Array.isArray(processed.data) && processed.data.length) {
      qualityRows = processed.data;
    } else if (type === 'excel' && processed.sheets && processed.sheetNames) {
      var firstSN = processed.sheetNames.find(function (n) {
        return processed.sheets[n] && processed.sheets[n].length > 0;
      });
      if (firstSN) qualityRows = processed.sheets[firstSN];
    }
    if (qualityRows) processed.qualityScore = calculateDataQualityScore(qualityRows);

    /* tone analysis for text-based types */
    if ((type === 'text' || type === 'markdown' || type === 'pdf' || type === 'word') && processed.raw) {
      processed.tone = analyzeTone(processed.raw);
    }

    return processed;
  }

  function summarizeDatasetForExecutive(dataset) {
    var values = (dataset && dataset.values || []).map(function (v) { return Number(v); }).filter(isFinite);
    if (values.length < 2) {
      return {
        label: dataset && dataset.label || 'Serie',
        first: NaN,
        last: NaN,
        change: NaN,
        changePct: NaN,
        avg: NaN,
        stdDev: NaN,
        anomalies: 0,
        maxAnomalyAbs: 0
      };
    }

    var first = values[0];
    var last = values[values.length - 1];
    var change = last - first;
    var changePct = first !== 0 ? (change / Math.abs(first)) * 100 : NaN;
    var sum = values.reduce(function (acc, v) { return acc + v; }, 0);
    var avg = sum / values.length;
    var variance = values.reduce(function (acc, v) {
      var d = v - avg;
      return acc + d * d;
    }, 0) / values.length;
    var stdDev = Math.sqrt(variance);

    var anomalies = 0;
    var maxAnomalyAbs = 0;
    if (stdDev > 0) {
      values.forEach(function (v) {
        var z = Math.abs((v - avg) / stdDev);
        if (z >= 2.5) {
          anomalies += 1;
          if (Math.abs(v - avg) > maxAnomalyAbs) maxAnomalyAbs = Math.abs(v - avg);
        }
      });
    }

    return {
      label: dataset && dataset.label || 'Serie',
      first: first,
      last: last,
      change: change,
      changePct: changePct,
      avg: avg,
      stdDev: stdDev,
      anomalies: anomalies,
      maxAnomalyAbs: maxAnomalyAbs
    };
  }

  function buildExcelExecutive(datasetsList) {
    var rows = (datasetsList || []).map(function (entry) {
      return summarizeDatasetForExecutive(entry.dataset);
    }).filter(function (item) {
      return isFinite(item.change);
    });

    if (!rows.length) {
      return {
        topMetrics: [],
        periodVariationPctAvg: null,
        anomalyAlerts: 0,
        anomalyPoints: 0,
        datasetCount: 0
      };
    }

    var sortedByAbsChange = rows.slice().sort(function (a, b) {
      return Math.abs(b.change) - Math.abs(a.change);
    });

    var topMetrics = sortedByAbsChange.slice(0, 5).map(function (item) {
      return {
        label: item.label,
        change: item.change,
        changePct: item.changePct,
        trend: item.change >= 0 ? 'up' : 'down'
      };
    });

    var pctValues = rows
      .map(function (item) { return item.changePct; })
      .filter(isFinite);

    var periodVariationPctAvg = pctValues.length
      ? pctValues.reduce(function (acc, v) { return acc + v; }, 0) / pctValues.length
      : NaN;

    var anomalyAlerts = rows.filter(function (item) { return item.anomalies > 0; }).length;
    var anomalyPoints = rows.reduce(function (acc, item) { return acc + item.anomalies; }, 0);

    return {
      topMetrics: topMetrics,
      periodVariationPctAvg: safePercent(periodVariationPctAvg),
      anomalyAlerts: anomalyAlerts,
      anomalyPoints: anomalyPoints,
      datasetCount: rows.length
    };
  }

  function fmtMoney(v) {
    if (!isFinite(v)) return '—';
    var abs = Math.abs(v);
    var sign = v < 0 ? '-' : '+';
    if (abs >= 1000000) return sign + (abs / 1000000).toFixed(2) + ' M';
    if (abs >= 1000) return sign + (abs / 1000).toFixed(1) + ' K';
    return sign + abs.toFixed(2);
  }

  function buildActionableInsights(datasetsList) {
    var rows = (datasetsList || []).map(function (entry) {
      return summarizeDatasetForExecutive(entry.dataset);
    }).filter(function (item) {
      return isFinite(item.change) && isFinite(item.avg);
    });

    if (!rows.length) {
      return { riskScore: 0, items: [], totalImpact: 0 };
    }

    /* Biggest absolute value across all datasets — used for normalization */
    var globalMaxAbs = rows.reduce(function (mx, r) {
      return Math.max(mx, Math.abs(r.avg * rows[0].label ? 1 : 1), Math.abs(r.change));
    }, 1);

    /* Build candidates with financial-impact score */
    var candidates = [];

    rows.forEach(function (row) {
      var cv = row.avg !== 0 ? Math.abs(row.stdDev / row.avg) : 0;

      /* ── CAÍDA FINANCIERA ── */
      if (isFinite(row.changePct) && row.changePct <= -5) {
        var absLoss = Math.abs(row.change);
        var severity = row.changePct <= -25 ? 'high' : row.changePct <= -10 ? 'high' : 'medium';
        var financialPriority = absLoss * (1 + Math.abs(row.changePct) / 100);
        candidates.push({
          level: severity,
          title: 'Caída de ' + Math.abs(row.changePct).toFixed(1) + '%',
          detail: row.label + ' pierde ' + fmtMoney(-absLoss) + ' unidades de valor (' + Math.abs(row.changePct).toFixed(2) + '% del total). Revisar causas y mitigar exposición.',
          recommendation: row.changePct <= -25
            ? 'Acción urgente: analiza partida presupuestaria y establece un plan de recuperación trimestral.'
            : 'Revisa esta línea en el próximo ciclo de reporting y compara con benchmarks del sector.',
          financialImpact: -absLoss,
          financialPriority: financialPriority
        });
      }

      /* ── OPORTUNIDAD DE CRECIMIENTO ── */
      if (isFinite(row.changePct) && row.changePct >= 8) {
        var gain = Math.abs(row.change);
        var growthPriority = gain * (1 + row.changePct / 100);
        candidates.push({
          level: 'info',
          title: 'Crecimiento del ' + row.changePct.toFixed(1) + '%',
          detail: row.label + ' genera +' + fmtMoney(gain) + ' unidades de valor en el periodo. Alta oportunidad de escalar.',
          recommendation: row.changePct >= 30
            ? 'Oportunidad excepcional: evalúa reasignar más recursos a esta área antes del próximo trimestre.'
            : 'Mantén el impulso e identifica los factores clave que explican esta mejora.',
          financialImpact: gain,
          financialPriority: growthPriority
        });
      }

      /* ── ALTA VOLATILIDAD ── */
      if (cv >= 0.30) {
        var volImpact = cv * Math.abs(row.avg);
        candidates.push({
          level: cv >= 0.65 ? 'high' : 'medium',
          title: 'Volatilidad ' + (cv >= 0.65 ? 'extrema' : 'alta') + ' (' + (cv * 100).toFixed(1) + '% CV)',
          detail: row.label + ': dispersión de ±' + fmtMoney(row.stdDev) + ' unidades sobre una media de ' + fmtMoney(row.avg) + '. Dificulta previsiones fiables.',
          recommendation: cv >= 0.65
            ? 'Estabiliza esta variable mediante controles o límites operativos antes de tomar decisiones estratégicas sobre ella.'
            : 'Introduce revisiones periódicas para detectar antes cuándo se sale del rango habitual.',
          financialImpact: -volImpact,
          financialPriority: volImpact * (1 + cv)
        });
      }

      /* ── PUNTOS ANÓMALOS ── */
      if (row.anomalies > 0) {
        var anomImpact = row.maxAnomalyAbs;
        candidates.push({
          level: row.anomalies >= 3 ? 'high' : 'medium',
          title: row.anomalies + ' punto' + (row.anomalies > 1 ? 's' : '') + ' anómalo' + (row.anomalies > 1 ? 's' : ''),
          detail: row.label + ': desviación máxima de ' + fmtMoney(row.maxAnomalyAbs) + ' unidades respecto a la media. Probable error de datos o evento puntual.',
          recommendation: row.anomalies >= 3
            ? 'Audita la fuente de datos: múltiples outliers sugieren errores de entrada o discontinuidades en el proceso.'
            : 'Verifica si el punto anómalo es un error de registro o un evento real que deba documentarse.',
          financialImpact: -anomImpact,
          financialPriority: anomImpact * (1 + row.anomalies * 0.4)
        });
      }
    });

    /* De-duplicate: keep highest-priority candidate per label */
    var seen = {};
    candidates = candidates.filter(function (c) {
      var key = c.title + '|' + c.level;
      if (seen[key]) return false;
      seen[key] = 1;
      return true;
    });

    /* Sort by financialPriority descending */
    candidates.sort(function (a, b) { return b.financialPriority - a.financialPriority; });

    if (!candidates.length) {
      candidates.push({
        level: 'info',
        title: 'Comportamiento estable',
        detail: 'No se detectaron señales críticas en ninguna de las series analizadas.',
        recommendation: 'Mantén el seguimiento periódico para detectar cualquier cambio de tendencia.',
        financialImpact: 0,
        financialPriority: 0
      });
    }

    var items = candidates.slice(0, 5);

    /* riskScore: 40% conteo-severidad + 60% magnitud financiera normalizada */
    var severityBase = 0;
    items.forEach(function (item) {
      if (item.level === 'high') severityBase += 35;
      else if (item.level === 'medium') severityBase += 20;
      else severityBase += 8;
    });

    var totalNegImpact = items.reduce(function (acc, item) {
      return acc + (item.financialImpact < 0 ? Math.abs(item.financialImpact) : 0);
    }, 0);
    var maxPossibleImpact = rows.reduce(function (acc, r) {
      return acc + Math.abs(r.avg || 0);
    }, 0) || 1;
    var impactRatio = Math.min(1, totalNegImpact / maxPossibleImpact);
    var riskScore = Math.round(Math.min(100, severityBase * 0.4 + impactRatio * 100 * 0.6));

    var totalImpact = items.reduce(function (acc, item) {
      return acc + (item.financialImpact || 0);
    }, 0);

    return {
      riskScore: riskScore,
      items: items,
      totalImpact: totalImpact
    };
  }

  function buildExcelInsights(parsedExcel) {
    if (!parsedExcel || parsedExcel.error || !parsedExcel.sheets) {
      return {
        summary: 'No fue posible analizar el contenido del Excel.',
        stats: { sheets: 0, rows: 0, columns: 0, datasets: 0 },
        datasetsObj: {},
        datasetsList: []
      };
    }

    var sheetNames = parsedExcel.sheetNames || [];
    var allColumns = {};
    var totalRows = 0;
    var maxColumns = 0;
    var datasetsObj = {};
    var datasetsList = [];

    sheetNames.forEach(function (sheetName) {
      var rows = parsedExcel.sheets[sheetName] || [];
      totalRows += rows.length;
      if (!rows.length) return;

      var columnsMap = {};
      rows.slice(0, 250).forEach(function (row) {
        Object.keys(row || {}).forEach(function (key) {
          if (key) columnsMap[key] = 1;
          if (key) allColumns[key] = 1;
        });
      });

      var columns = Object.keys(columnsMap);
      maxColumns = Math.max(maxColumns, columns.length);
      if (!columns.length) return;

      var statsMap = {};
      columns.forEach(function (col) {
        statsMap[col] = getColumnTypeStats(rows, col);
      });

      var xAxisCol = chooseXAxisColumn(rows, columns, statsMap);

      var numericCols = columns.filter(function (col) {
        var st = statsMap[col];
        if (!st || st.nonEmpty <= 0 || st.numericRatio < 0.65) return false;

        // Do not chart the same column used as x-axis or date-like index columns.
        if (xAxisCol && col === xAxisCol) return false;
        if (st.dateRatio >= 0.6) return false;

        return true;
      }).slice(0, 4);

      numericCols.forEach(function (numCol) {
        var labels = [];
        var values = [];

        rows.forEach(function (row, index) {
          var num = toNumber(row[numCol]);
          if (!isFinite(num)) return;

          var labelRaw = xAxisCol ? row[xAxisCol] : null;
          var label = labelRaw == null || labelRaw === '' ? ('Fila ' + (index + 1)) : String(labelRaw);
          labels.push(label);
          values.push(num);
        });

        if (labels.length < 2) return;

        // Skip flat series (all points equal): they produce misleading charts with no signal.
        var firstVal = values[0];
        var isFlat = values.every(function (v) { return v === firstVal; });
        if (isFlat) return;

        var key = 'excel_' + slugify(sheetName) + '_' + slugify(numCol);
        var label = sheetName + ' - ' + numCol;
        var chartType = labels.length > 12 || (xAxisCol && statsMap[xAxisCol] && statsMap[xAxisCol].dateRatio >= 0.6)
          ? 'line'
          : 'bar';

        var dataset = { labels: labels, values: values, label: label, chartType: chartType };
        datasetsObj[key] = { labels: labels, values: values, label: label };
        datasetsList.push({ key: key, dataset: dataset });
      });
    });

    var topic = inferTopicFromColumns(Object.keys(allColumns));
    var executive = buildExcelExecutive(datasetsList);
    var actionable = buildActionableInsights(datasetsList);
    var summary = 'El archivo parece tratar sobre ' + topic + '. Se detectaron ' + sheetNames.length + ' hoja(s), ' + totalRows + ' fila(s) y ' + Object.keys(datasetsObj).length + ' serie(s) numérica(s) para visualización global.';

    if (executive.datasetCount) {
      summary += ' Variación media por periodo: ' + (executive.periodVariationPctAvg == null ? '-' : executive.periodVariationPctAvg + '%') + '. Alertas de anomalías: ' + executive.anomalyAlerts + ' serie(s).';
    }

    return {
      summary: summary,
      topic: topic,
      executive: executive,
      actionable: actionable,
      stats: {
        sheets: sheetNames.length,
        rows: totalRows,
        columns: maxColumns,
        datasets: Object.keys(datasetsObj).length
      },
      datasetsObj: datasetsObj,
      datasetsList: datasetsList
    };
  }

  function createDashboardFromExcel(filename, processedExcel) {
    var insights = processedExcel && processedExcel.insights;
    var datasetsObj = insights && insights.datasetsObj ? insights.datasetsObj : {};
    var executive = insights && insights.executive ? insights.executive : null;
    var actionable = insights && insights.actionable ? insights.actionable : null;
    var keys = Object.keys(datasetsObj);
    if (!keys.length) {
      return { created: false, reason: 'No se encontraron series numéricas para el dashboard.' };
    }

    var dashboards = [];
    try {
      dashboards = JSON.parse(localStorage.getItem('zyv_dashboards') || '[]');
    } catch (_e) {
      dashboards = [];
    }
    if (!Array.isArray(dashboards)) dashboards = [];

    var id = 'db_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    var base = String(filename || 'Excel').replace(/\.[^.]+$/, '');
    var dashboardName = 'Dashboard ' + base + ' · ' + new Date().toLocaleDateString('es-ES');

    if (executive && executive.datasetCount) {
      var values = {
        topicDetected: insights.topic || '-',
        sheets: insights.stats && insights.stats.sheets || 0,
        rows: insights.stats && insights.stats.rows || 0,
        datasets: insights.stats && insights.stats.datasets || 0,
        periodVariationPctAvg: executive.periodVariationPctAvg == null ? '-' : executive.periodVariationPctAvg + ' %',
        anomalyAlerts: executive.anomalyAlerts,
        anomalyPoints: executive.anomalyPoints
      };

      executive.topMetrics.forEach(function (metric, index) {
        values['topMetric' + (index + 1)] = metric.label + ' · ' + (isFinite(metric.changePct) ? metric.changePct.toFixed(2) + '%' : '-');
      });

      datasetsObj.excelExecutive = {
        toolName: 'Resumen ejecutivo del Excel',
        section: 'documentos',
        timestamp: Date.now(),
        values: values
      };
    }

    if (actionable && Array.isArray(actionable.items) && actionable.items.length) {
      var alertValues = {
        riskScore: actionable.riskScore + ' / 100',
        totalAlerts: actionable.items.length,
        impactoNeto: isFinite(actionable.totalImpact) ? actionable.totalImpact.toFixed(2) + ' uds.' : '-'
      };
      actionable.items.forEach(function (item, idx) {
        var impStr = isFinite(item.financialImpact) && item.financialImpact !== 0
          ? ' [impacto: ' + (item.financialImpact >= 0 ? '+' : '') + item.financialImpact.toFixed(2) + ']'
          : '';
        alertValues['alerta' + (idx + 1)] = '[' + String(item.level || 'info').toUpperCase() + '] ' + item.title + impStr + ' — ' + item.detail;
      });

      datasetsObj.excelActionInsights = {
        toolName: 'Alertas inteligentes',
        section: 'documentos',
        timestamp: Date.now(),
        values: alertValues
      };
    }

    dashboards.push({
      id: id,
      nombre: dashboardName,
      data: datasetsObj,
      dataMeta: {
        toolName: 'Documentos',
        section: 'documentos',
        group: 'excel-import',
        sourceFile: filename || '',
        summary: insights.summary,
        timestamp: Date.now(),
        autoGenerated: true
      }
    });

    localStorage.setItem('zyv_dashboards', JSON.stringify(dashboards));
    return { created: true, id: id, name: dashboardName, datasets: keys.length };
  }

  function parsePdf(arrayBuffer) {
    var pdfjs = global.pdfjsLib;
    if (!pdfjs || !pdfjs.getDocument) {
      return Promise.resolve({
        type: 'pdf',
        error: 'pdf.js no está cargado. Verifica la conexión.'
      });
    }

    if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    }

    return pdfjs.getDocument({ data: arrayBuffer }).promise.then(function (doc) {
      var tasks = [];
      for (var p = 1; p <= doc.numPages; p++) {
        tasks.push(doc.getPage(p).then(function (page) {
          return page.getTextContent().then(function (textContent) {
            return textContent.items.map(function (item) {
              return item.str || '';
            }).join(' ');
          });
        }));
      }
      return Promise.all(tasks).then(function (pagesText) {
        var rawText = pagesText.join('\n\n').replace(/\s+/g, ' ').trim();
        return {
          type: 'pdf',
          raw: rawText,
          summary: summarizeText(rawText),
          wordCount: rawText ? rawText.split(/\s+/).length : 0,
          lineCount: rawText ? rawText.split(/\r?\n/).length : 0,
          pageCount: doc.numPages
        };
      });
    }).catch(function (e) {
      return {
        type: 'pdf',
        error: 'Error al extraer PDF: ' + e.message
      };
    });
  }

  function parseWord(arrayBuffer) {
    var mammoth = global.mammoth;
    if (!mammoth || !mammoth.extractRawText) {
      return Promise.resolve({
        type: 'word',
        error: 'Mammoth no está cargado. Verifica la conexión.'
      });
    }

    return mammoth.extractRawText({ arrayBuffer: arrayBuffer }).then(function (result) {
      var rawText = String(result && result.value || '').replace(/\r/g, '').trim();
      var paragraphs = rawText ? rawText.split(/\n{2,}/).filter(Boolean) : [];
      return {
        type: 'word',
        raw: rawText,
        summary: summarizeText(rawText),
        wordCount: rawText ? rawText.split(/\s+/).length : 0,
        lineCount: rawText ? rawText.split(/\r?\n/).length : 0,
        paragraphCount: paragraphs.length
      };
    }).catch(function (e) {
      return {
        type: 'word',
        error: 'Error al extraer DOCX: ' + e.message
      };
    });
  }

  /* ── process ─────────────────────────────────────────────────────── */

  function processDocument(content, type) {
    switch (type) {
      case 'text':
      case 'markdown': {
        var text = String(content || '');
        return Promise.resolve(enrichWithBusinessAnalysis({
          type: type,
          raw: text,
          summary: summarizeText(text),
          wordCount: text.trim() ? text.trim().split(/\s+/).length : 0,
          lineCount: text.split(/\r?\n/).length
        }, type));
      }
      case 'csv': {
        var rows = parseCSV(content);
        return Promise.resolve(enrichWithBusinessAnalysis({
          type: 'csv',
          rows: rows,
          rowCount: rows.length,
          columns: rows.length ? Object.keys(rows[0]) : []
        }, 'csv'));
      }
      case 'json': {
        try {
          var data = JSON.parse(content);
          return Promise.resolve(enrichWithBusinessAnalysis({ type: 'json', data: data, raw: content }, 'json'));
        } catch (e) {
          return Promise.resolve(enrichWithBusinessAnalysis({ type: 'json', error: 'JSON inválido: ' + e.message, raw: content }, 'json'));
        }
      }
      case 'excel':
        var parsedExcel = parseExcel(content);
        if (parsedExcel && !parsedExcel.error) {
          parsedExcel.insights = buildExcelInsights(parsedExcel);
        }
        return Promise.resolve(enrichWithBusinessAnalysis(parsedExcel, 'excel'));
      case 'pdf':
        return parsePdf(content).then(function (processedPdf) {
          return enrichWithBusinessAnalysis(processedPdf, 'pdf');
        });
      case 'word':
        return parseWord(content).then(function (processedWord) {
          return enrichWithBusinessAnalysis(processedWord, 'word');
        });
      default:
        return Promise.resolve(enrichWithBusinessAnalysis({ type: 'unknown', raw: String(content || '') }, 'unknown'));
    }
  }

  /* ── storage ─────────────────────────────────────────────────────── */

  var ZY_DOCS_KEY = 'zy_docs';

  function saveDocument(name, processed) {
    var docs = [];
    try { docs = JSON.parse(localStorage.getItem(ZY_DOCS_KEY) || '[]'); } catch (_) {}
    if (!Array.isArray(docs)) docs = [];
    var id = 'doc_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    docs.push({ id: id, name: String(name || 'Sin nombre'), savedAt: Date.now(), data: processed });
    localStorage.setItem(ZY_DOCS_KEY, JSON.stringify(docs));
    return id;
  }

  function loadSavedDocuments() {
    try {
      var raw = localStorage.getItem(ZY_DOCS_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (_) { return []; }
  }

  function deleteSavedDocument(id) {
    var docs = loadSavedDocuments().filter(function (d) { return d.id !== id; });
    localStorage.setItem(ZY_DOCS_KEY, JSON.stringify(docs));
  }

  /* ── sync with finance runtime ─────────────────────────────────── */

  var ZY_FINANCE_RUNTIME_KEY = 'zyvola-finance-runtime-v1';

  function normalizeToken(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function findColumnKey(rows, candidates) {
    if (!rows || !rows.length) return null;
    var keys = Object.keys(rows[0] || {});
    if (!keys.length) return null;

    var normalizedCandidates = (candidates || []).map(function (c) { return normalizeToken(c); });
    var best = null;
    var bestScore = 0;

    keys.forEach(function (key) {
      var token = normalizeToken(key);
      if (!token) return;
      var score = 0;
      normalizedCandidates.forEach(function (candidate) {
        if (!candidate) return;
        if (token === candidate) score += 4;
        else if (token.indexOf(candidate) !== -1 || candidate.indexOf(token) !== -1) score += 2;
      });
      if (score > bestScore) {
        best = key;
        bestScore = score;
      }
    });

    return bestScore > 0 ? best : null;
  }

  function parseFinanceDate(value) {
    if (value == null || value === '') return null;
    if (value instanceof Date && !isNaN(value.getTime())) return value;

    if (typeof value === 'number' && isFinite(value)) {
      if (value > 20000 && value < 70000) {
        var millis = Math.round((value - 25569) * 86400 * 1000);
        var excelDate = new Date(millis);
        if (!isNaN(excelDate.getTime())) return excelDate;
      }
      return null;
    }

    var raw = String(value).trim();
    if (!raw) return null;

    var isoLike = Date.parse(raw);
    if (!isNaN(isoLike)) return new Date(isoLike);

    var ddmmyyyy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (ddmmyyyy) {
      var day = Number(ddmmyyyy[1]);
      var month = Number(ddmmyyyy[2]) - 1;
      var year = Number(ddmmyyyy[3]);
      if (year < 100) year += 2000;
      var parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime())) return parsed;
    }

    return null;
  }

  function parseFinanceAmount(value) {
    if (typeof value === 'number' && isFinite(value)) return value;
    if (value == null) return NaN;
    var raw = String(value).trim();
    if (!raw) return NaN;
    var sign = /-/.test(raw) ? -1 : 1;
    var normalized = raw
      .replace(/\s+/g, '')
      .replace(/€/g, '')
      .replace(/\.(?=\d{3}(\D|$))/g, '')
      .replace(/,/g, '.')
      .replace(/[^0-9.\-]/g, '');
    var amount = Number(normalized);
    if (!isFinite(amount)) return NaN;
    if (amount === 0) return 0;
    return sign < 0 ? -Math.abs(amount) : amount;
  }

  function pickImportRows(processed) {
    if (!processed || typeof processed !== 'object') return [];

    if (processed.type === 'csv' && Array.isArray(processed.rows)) {
      return processed.rows;
    }

    if (processed.type === 'json') {
      if (Array.isArray(processed.data) && processed.data.length && typeof processed.data[0] === 'object') {
        return processed.data;
      }
      if (processed.data && typeof processed.data === 'object') {
        var objectKeys = Object.keys(processed.data);
        for (var i = 0; i < objectKeys.length; i += 1) {
          var candidate = processed.data[objectKeys[i]];
          if (Array.isArray(candidate) && candidate.length && typeof candidate[0] === 'object') {
            return candidate;
          }
        }
      }
    }

    if (processed.type === 'excel' && processed.sheets && processed.sheetNames) {
      var preferred = (processed.sheetNames || []).find(function (name) {
        var rows = processed.sheets[name] || [];
        if (!rows.length) return false;
        var dateKey = findColumnKey(rows, ['fecha', 'date', 'valor']);
        var amountKey = findColumnKey(rows, ['importe', 'amount', 'monto', 'total']);
        return !!dateKey && !!amountKey;
      });
      if (preferred) return processed.sheets[preferred] || [];

      var firstWithRows = (processed.sheetNames || []).find(function (name) {
        return processed.sheets[name] && processed.sheets[name].length > 0;
      });
      if (firstWithRows) return processed.sheets[firstWithRows] || [];
    }

    return [];
  }

  function inferCategoryFromRow(row, categoryKey, merchantKey, amount) {
    var base = '';
    if (categoryKey && row && row[categoryKey] != null) base = String(row[categoryKey]);
    else if (merchantKey && row && row[merchantKey] != null) base = String(row[merchantKey]);

    var token = normalizeToken(base);
    if (!token) return amount >= 0 ? 'ingresos' : 'otros';

    if (/nomina|salario|ingreso|abono|sueldo/.test(token)) return 'ingresos';
    if (/alquiler|hipoteca|vivienda/.test(token)) return 'vivienda';
    if (/supermercado|mercado|aliment/.test(token)) return 'alimentacion';
    if (/uber|metro|tren|gasolina|movilidad|transporte/.test(token)) return 'movilidad';
    if (/luz|agua|internet|telefono|servicio|comision/.test(token)) return 'servicios';
    if (/netflix|spotify|prime|suscrip/.test(token)) return 'suscripciones';
    if (/broker|etf|fondo|accion|inversion|cripto/.test(token)) return 'inversion';
    if (/ocio|restaurante|cine|viaje/.test(token)) return 'ocio';
    return amount >= 0 ? 'ingresos' : 'otros';
  }

  function extractFinanceTransactions(processed, meta) {
    var rows = pickImportRows(processed);
    if (!rows.length) {
      return { transactions: [], ignoredRows: 0, reason: 'No se detectaron filas tabulares para importar.' };
    }

    var dateKey = findColumnKey(rows, ['fecha', 'date', 'fecha operacion', 'booking date', 'valor']);
    var amountKey = findColumnKey(rows, ['importe', 'amount', 'monto', 'valor', 'total', 'euros']);
    var debitKey = findColumnKey(rows, ['debe', 'cargo', 'debit', 'withdrawal', 'salida']);
    var creditKey = findColumnKey(rows, ['haber', 'abono', 'credit', 'deposit', 'entrada']);
    var typeKey = findColumnKey(rows, ['tipo', 'type', 'naturaleza', 'movimiento', 'direction']);
    var merchantKey = findColumnKey(rows, ['comercio', 'merchant', 'descripcion', 'description', 'concepto', 'beneficiario']);
    var categoryKey = findColumnKey(rows, ['categoria', 'category', 'rubro']);
    var accountKey = findColumnKey(rows, ['cuenta', 'account', 'iban', 'origen']);

    var importedAt = Date.now();
    var sourceName = meta && meta.filename ? String(meta.filename) : 'import';
    var transactions = [];
    var ignored = 0;

    rows.forEach(function (row, idx) {
      var debit = debitKey ? parseFinanceAmount(row[debitKey]) : NaN;
      var credit = creditKey ? parseFinanceAmount(row[creditKey]) : NaN;
      var amount = NaN;

      if (isFinite(credit) || isFinite(debit)) {
        amount = (isFinite(credit) ? Math.abs(credit) : 0) - (isFinite(debit) ? Math.abs(debit) : 0);
      }
      if (!isFinite(amount) && amountKey) {
        amount = parseFinanceAmount(row[amountKey]);
      }

      if (!isFinite(amount) || amount === 0) {
        ignored += 1;
        return;
      }

      if (typeKey) {
        var typeToken = normalizeToken(row[typeKey]);
        if (/debit|cargo|gasto|retirada|pago/.test(typeToken)) amount = -Math.abs(amount);
        if (/credit|abono|ingreso|deposito/.test(typeToken)) amount = Math.abs(amount);
      }

      var parsedDate = dateKey ? parseFinanceDate(row[dateKey]) : null;
      if (!parsedDate) parsedDate = new Date();
      var merchantRaw = merchantKey ? row[merchantKey] : '';
      var merchant = String(merchantRaw || ('Movimiento ' + (idx + 1))).trim().toUpperCase();
      if (!merchant) merchant = 'MOVIMIENTO ' + (idx + 1);

      var category = inferCategoryFromRow(row, categoryKey, merchantKey, amount);
      var account = accountKey && row[accountKey] ? String(row[accountKey]).trim() : 'Cuenta principal';

      transactions.push({
        id: 'imp_' + importedAt.toString(36) + '_' + idx,
        date: parsedDate.toISOString().slice(0, 10),
        merchant: merchant,
        category: category,
        amount: Number(amount.toFixed(2)),
        isFee: /comision|mantenimiento|fee/.test(normalizeToken(merchant)),
        account: account || 'Cuenta principal',
        source: 'document-import',
        sourceFile: sourceName
      });
    });

    return {
      transactions: transactions,
      ignoredRows: ignored,
      totalRows: rows.length,
      detected: {
        dateKey: dateKey,
        amountKey: amountKey,
        debitKey: debitKey,
        creditKey: creditKey,
        merchantKey: merchantKey,
        categoryKey: categoryKey,
        accountKey: accountKey
      }
    };
  }

  function loadFinanceRuntimeState() {
    try {
      var raw = localStorage.getItem(ZY_FINANCE_RUNTIME_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (_e) {
      return null;
    }
  }

  function baseFinanceRuntimeState() {
    return {
      accounts: [],
      assets: [],
      liabilities: [],
      goals: [],
      categoryHints: {},
      transactions: [],
      resolvedDuplicates: []
    };
  }

  function importToFinanceRuntime(processed, meta, options) {
    var opts = options || {};
    var mode = opts.mode === 'append' ? 'append' : 'replace-imported';
    var extracted = extractFinanceTransactions(processed, meta);
    if (!extracted.transactions.length) {
      return {
        imported: 0,
        ignoredRows: extracted.ignoredRows || 0,
        totalRows: extracted.totalRows || 0,
        mode: mode,
        reason: extracted.reason || 'No se detectaron movimientos válidos.',
        detected: extracted.detected || {}
      };
    }

    var state = loadFinanceRuntimeState() || baseFinanceRuntimeState();
    if (!Array.isArray(state.transactions)) state.transactions = [];
    if (!state.categoryHints || typeof state.categoryHints !== 'object') state.categoryHints = {};

    var manualTransactions = mode === 'append'
      ? state.transactions.slice()
      : state.transactions.filter(function (tx) { return tx && tx.source !== 'document-import'; });

    extracted.transactions.forEach(function (tx) {
      if (tx.merchant) state.categoryHints[tx.merchant] = tx.category || 'otros';
    });

    state.transactions = manualTransactions.concat(extracted.transactions);
    localStorage.setItem(ZY_FINANCE_RUNTIME_KEY, JSON.stringify(state));

    return {
      imported: extracted.transactions.length,
      ignoredRows: extracted.ignoredRows || 0,
      totalRows: extracted.totalRows || 0,
      mode: mode,
      detected: extracted.detected || {}
    };
  }

  /* ── render helpers ──────────────────────────────────────────────── */

  function esc(val) {
    return String(val == null ? '' : val)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmtSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function renderTable(rows, maxRows) {
    if (!rows || !rows.length) return '<p class="doc-empty">Sin filas para mostrar.</p>';
    var limit = maxRows || 50;
    var cols = Object.keys(rows[0]);
    var displayed = rows.slice(0, limit);
    var head = cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('');
    var body = displayed.map(function (row) {
      return '<tr>' + cols.map(function (c) { return '<td>' + esc(row[c]) + '</td>'; }).join('') + '</tr>';
    }).join('');
    var more = rows.length > displayed.length
      ? '<p class="doc-table-more">Mostrando ' + displayed.length + ' de ' + rows.length + ' filas.</p>'
      : '';
    return '<div class="doc-table-wrap"><table class="doc-table"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div>' + more;
  }

  function renderAnalysisListItems(items, level) {
    var cls = level || 'info';
    return (items || []).map(function (item) {
      return '' +
        '<li class="doc-alert-item ' + esc(cls) + '">' +
          '<span class="doc-alert-pill">' + esc(cls.toUpperCase()) + '</span>' +
          '<div class="doc-alert-copy">' +
            '<p class="doc-alert-title">' + esc(item.title || '') + '</p>' +
            '<p class="doc-alert-detail">' + esc(item.detail || '') + '</p>' +
          '</div>' +
        '</li>';
    }).join('');
  }

  /* ── quality score panel ─────────────────────────────────────────── */

  function renderQualityBar(label, value) {
    var cls = value >= 85 ? 'excellent' : value >= 70 ? 'good' : value >= 50 ? 'regular' : 'low';
    return '' +
      '<div class="doc-quality-bar-row">' +
        '<span class="doc-quality-bar-label">' + esc(label) + '</span>' +
        '<div class="doc-quality-bar-track">' +
          '<div class="doc-quality-bar-fill ' + cls + '" style="width:' + esc(value) + '%"></div>' +
        '</div>' +
        '<span class="doc-quality-bar-value">' + esc(value) + '%</span>' +
      '</div>';
  }

  function renderQualityScorePanel(processed) {
    var qs = processed && processed.qualityScore;
    if (!qs) return '';
    var scoreClass = qs.score >= 85 ? 'excellent' : qs.score >= 70 ? 'good' : qs.score >= 50 ? 'regular' : 'low';
    return '' +
      '<section class="doc-quality-panel">' +
        '<div class="doc-quality-header">' +
          '<h4 class="doc-kpi-title">Calidad de datos</h4>' +
          '<div class="doc-quality-score-wrap">' +
            '<span class="doc-quality-score ' + scoreClass + '">' + esc(qs.score) + '<span class="doc-quality-score-max">/100</span></span>' +
            '<span class="doc-quality-badge ' + scoreClass + '">' + esc(qs.label) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="doc-quality-bars">' +
          renderQualityBar('Completitud', qs.completeness) +
          renderQualityBar('Unicidad de registros', qs.uniqueness) +
          renderQualityBar('Coherencia de tipos', qs.coherence) +
        '</div>' +
      '</section>';
  }

  /* ── tone panel ──────────────────────────────────────────────────── */

  function renderTonePanel(processed) {
    var tone = processed && processed.tone;
    if (!tone || (tone.riskCount === 0 && tone.positiveCount === 0)) return '';
    var riskKwsHtml = tone.riskKeywords.length
      ? '<span class="doc-tone-kws risk">' + tone.riskKeywords.map(esc).join(', ') + '</span>'
      : '';
    var posKwsHtml = tone.positiveKeywords.length
      ? '<span class="doc-tone-kws positive">' + tone.positiveKeywords.map(esc).join(', ') + '</span>'
      : '';
    return '' +
      '<section class="doc-tone-panel">' +
        '<div class="doc-tone-header">' +
          '<h4 class="doc-kpi-title">Se\u00f1al de tono financiero</h4>' +
          '<span class="doc-tone-signal ' + esc(tone.signalClass) + '">' + esc(tone.signal) + '</span>' +
        '</div>' +
        '<div class="doc-tone-bar-track">' +
          '<div class="doc-tone-bar-fill" style="width:' + esc(tone.toneScore) + '%"></div>' +
        '</div>' +
        '<div class="doc-tone-labels">' +
          '<span class="doc-tone-side risk">Alerta (' + esc(tone.riskCount) + ')</span>' +
          '<span class="doc-tone-side positive">Positivo (' + esc(tone.positiveCount) + ')</span>' +
        '</div>' +
        ((riskKwsHtml || posKwsHtml)
          ? '<div class="doc-tone-keywords">' + riskKwsHtml + posKwsHtml + '</div>'
          : '') +
      '</section>';
  }

  function renderBusinessAnalysisPanel(processed) {
    if (!processed || !processed.analysis || !processed.impactScore || !processed.executiveSummary) return '';

    var analysis = processed.analysis;
    var impact = processed.impactScore;
    var summary = processed.executiveSummary;
    var actions = Array.isArray(processed.actions) ? processed.actions : [];

    var qualityPanel = renderQualityScorePanel(processed);
    var tonePanel = renderTonePanel(processed);

    var risks = topUniqueFindings(analysis.risks || [], 3);
    var opportunities = topUniqueFindings(analysis.opportunities || [], 3);
    var anomalies = topUniqueFindings(analysis.anomalies || [], 2);
    var insights = topUniqueFindings(analysis.insights || [], 2);

    var actionHtml = actions.map(function (a) {
      return '<li class="doc-alert-item info"><span class="doc-alert-pill">ACCION</span><div class="doc-alert-copy"><p class="doc-alert-title">' + esc(a.title || '') + '</p><p class="doc-alert-detail">' + esc(a.detail || '') + '</p></div></li>';
    }).join('');

    return '' +
      qualityPanel +
      tonePanel +
      '<section class="doc-summary">' +
        '<p class="doc-summary-label">Resumen ejecutivo de negocio</p>' +
        '<p class="doc-summary-text">' + esc(summary.headline || '') + '</p>' +
        '<div class="doc-preview-meta">' +
          '<span class="doc-meta-item">Prioridad: ' + esc(String(summary.priority || '-').toUpperCase()) + '</span>' +
          '<span class="doc-meta-sep">·</span>' +
          '<span class="doc-meta-item">Pérdida estimada: ' + esc(fmtMoney(-impact.estimatedLoss)) + '</span>' +
          '<span class="doc-meta-sep">·</span>' +
          '<span class="doc-meta-item">Ganancia estimada: ' + esc(fmtMoney(impact.estimatedGain)) + '</span>' +
        '</div>' +
      '</section>' +
      '<section class="doc-alert-panel">' +
        '<div class="doc-alert-head"><h4 class="doc-kpi-title">Hallazgos de análisis</h4></div>' +
        '<ul class="doc-alert-list">' +
          renderAnalysisListItems(risks, 'high') +
          renderAnalysisListItems(opportunities, 'info') +
          renderAnalysisListItems(anomalies, 'medium') +
          renderAnalysisListItems(insights, 'info') +
        '</ul>' +
      '</section>' +
      (actionHtml
        ? '<section class="doc-alert-panel"><div class="doc-alert-head"><h4 class="doc-kpi-title">Acciones recomendadas</h4></div><ul class="doc-alert-list">' + actionHtml + '</ul></section>'
        : '');
  }

  function renderDocumentPreview(processed, meta) {
    var container = document.getElementById('preview');
    if (!container) return;
    if (!processed) {
      container.innerHTML = '<p class="doc-empty">Sin datos para previsualizar.</p>';
      return;
    }

    var metaBar = '';
    if (meta && meta.filename) {
      metaBar =
        '<div class="doc-file-meta">' +
          '<span class="doc-file-name">' + esc(meta.filename) + '</span>' +
          (meta.size ? '<span class="doc-meta-sep">·</span><span class="doc-meta-item">' + fmtSize(meta.size) + '</span>' : '') +
        '</div>';
    }

    var body = '';

    switch (processed.type) {
      case 'text':
      case 'markdown': {
        body =
          '<div class="doc-preview-meta">' +
            '<span class="doc-badge">' + esc(processed.type) + '</span>' +
            '<span class="doc-meta-item">' + esc(processed.wordCount) + ' palabras</span>' +
            '<span class="doc-meta-sep">·</span>' +
            '<span class="doc-meta-item">' + esc(processed.lineCount) + ' líneas</span>' +
          '</div>' +
          (processed.summary
            ? '<div class="doc-summary">' +
                '<p class="doc-summary-label">Resumen automático</p>' +
                '<p class="doc-summary-text">' + esc(processed.summary) + '</p>' +
              '</div>'
            : '') +
          '<details class="doc-details">' +
            '<summary class="doc-details-trigger">Ver contenido completo</summary>' +
            '<pre class="doc-raw">' + esc((processed.raw || '').slice(0, 20000)) + '</pre>' +
          '</details>';
        break;
      }
      case 'csv': {
        body =
          '<div class="doc-preview-meta">' +
            '<span class="doc-badge">csv</span>' +
            '<span class="doc-meta-item">' + esc(processed.rowCount) + ' filas</span>' +
            '<span class="doc-meta-sep">·</span>' +
            '<span class="doc-meta-item">' + esc(processed.columns ? processed.columns.length : 0) + ' columnas</span>' +
          '</div>' +
          renderTable(processed.rows, 50);
        break;
      }
      case 'json': {
        if (processed.error) {
          body =
            '<div class="doc-preview-meta"><span class="doc-badge doc-badge-warn">json · error</span></div>' +
            '<p class="doc-error">' + esc(processed.error) + '</p>' +
            '<pre class="doc-raw">' + esc((processed.raw || '').slice(0, 4000)) + '</pre>';
        } else {
          var isArray = Array.isArray(processed.data);
          var itemCount = isArray ? processed.data.length : Object.keys(processed.data).length;
          var pretty = JSON.stringify(processed.data, null, 2);
          body =
            '<div class="doc-preview-meta">' +
              '<span class="doc-badge">json</span>' +
              '<span class="doc-meta-item">' + (isArray ? itemCount + ' elementos' : itemCount + ' claves raíz') + '</span>' +
            '</div>' +
            (isArray && processed.data.length && typeof processed.data[0] === 'object'
              ? renderTable(processed.data, 50)
              : '') +
            '<details class="doc-details">' +
              '<summary class="doc-details-trigger">Ver JSON completo</summary>' +
              '<pre class="doc-raw">' + esc(pretty.slice(0, 30000)) + '</pre>' +
            '</details>';
        }
        break;
      }
      case 'excel': {
        if (processed.error) {
          body =
            '<div class="doc-preview-meta"><span class="doc-badge doc-badge-warn">excel · error</span></div>' +
            '<p class="doc-error">' + esc(processed.error) + '</p>';
        } else {
          var firstSheet = processed.sheetNames[0] || '';
          var insights = processed.insights || null;
          var insightMeta = '';
          var executiveHtml = '';
          var actionableHtml = '';
          if (insights && insights.stats) {
            insightMeta =
              '<div class="doc-summary">' +
                '<p class="doc-summary-label">Resumen automático</p>' +
                '<p class="doc-summary-text">' + esc(insights.summary || '') + '</p>' +
                '<div class="doc-preview-meta">' +
                  '<span class="doc-meta-item">Hojas: ' + esc(insights.stats.sheets) + '</span>' +
                  '<span class="doc-meta-sep">·</span>' +
                  '<span class="doc-meta-item">Filas: ' + esc(insights.stats.rows) + '</span>' +
                  '<span class="doc-meta-sep">·</span>' +
                  '<span class="doc-meta-item">Series: ' + esc(insights.stats.datasets) + '</span>' +
                '</div>' +
              '</div>';
          }

          if (insights && insights.executive && insights.executive.datasetCount) {
            var topItems = (insights.executive.topMetrics || []).map(function (metric, idx) {
              var pct = isFinite(metric.changePct) ? metric.changePct.toFixed(2) + '%' : '-';
              var cls = metric.trend === 'up' ? 'up' : 'down';
              return '' +
                '<li class="doc-kpi-top-item">' +
                  '<span class="doc-kpi-rank">' + (idx + 1) + '</span>' +
                  '<span class="doc-kpi-label">' + esc(metric.label) + '</span>' +
                  '<span class="doc-kpi-change ' + cls + '">' + esc(pct) + '</span>' +
                '</li>';
            }).join('');

            executiveHtml =
              '<section class="doc-kpi-panel">' +
                '<h4 class="doc-kpi-title">KPIs ejecutivos</h4>' +
                '<div class="doc-kpi-grid">' +
                  '<article class="doc-kpi-card"><p class="doc-kpi-label-soft">Variación media periodo</p><p class="doc-kpi-value">' + esc((insights.executive.periodVariationPctAvg == null ? '-' : insights.executive.periodVariationPctAvg + '%')) + '</p></article>' +
                  '<article class="doc-kpi-card"><p class="doc-kpi-label-soft">Alertas de anomalía</p><p class="doc-kpi-value">' + esc(insights.executive.anomalyAlerts) + '</p></article>' +
                  '<article class="doc-kpi-card"><p class="doc-kpi-label-soft">Puntos anómalos</p><p class="doc-kpi-value">' + esc(insights.executive.anomalyPoints) + '</p></article>' +
                '</div>' +
                '<div class="doc-kpi-top">' +
                  '<p class="doc-kpi-label-soft">Top 5 métricas por impacto</p>' +
                  '<ol class="doc-kpi-top-list">' + topItems + '</ol>' +
                '</div>' +
              '</section>';
          }

          if (insights && insights.actionable && Array.isArray(insights.actionable.items) && insights.actionable.items.length) {
            var totalImpact = insights.actionable.totalImpact || 0;
            var totalImpactLabel = isFinite(totalImpact) && totalImpact !== 0
              ? (totalImpact >= 0 ? '+' : '') + totalImpact.toFixed(2) + ' uds. impacto neto estimado'
              : '';

            var alertItems = insights.actionable.items.map(function (item) {
              var lvl = String(item.level || 'info');
              var impactBadge = '';
              if (isFinite(item.financialImpact) && item.financialImpact !== 0) {
                var impSign = item.financialImpact >= 0 ? '+' : '';
                var impAbs = Math.abs(item.financialImpact);
                var impStr = impAbs >= 1000000
                  ? impSign + (item.financialImpact / 1000000).toFixed(2) + ' M'
                  : impAbs >= 1000
                    ? impSign + (item.financialImpact / 1000).toFixed(1) + ' K'
                    : impSign + item.financialImpact.toFixed(2);
                impactBadge = '<span class="doc-alert-impact ' + (item.financialImpact >= 0 ? 'positive' : 'negative') + '">' + esc(impStr) + '</span>';
              }
              var recHtml = item.recommendation
                ? '<p class="doc-alert-rec">\u2192 ' + esc(item.recommendation) + '</p>'
                : '';
              return '' +
                '<li class="doc-alert-item ' + esc(lvl) + '">' +
                  '<span class="doc-alert-pill">' + esc(lvl.toUpperCase()) + '</span>' +
                  '<div class="doc-alert-copy">' +
                    '<p class="doc-alert-title">' + esc(item.title || '') + impactBadge + '</p>' +
                    '<p class="doc-alert-detail">' + esc(item.detail || '') + '</p>' +
                    recHtml +
                  '</div>' +
                '</li>';
            }).join('');

            var totalImpactHtml = totalImpactLabel
              ? '<span class="doc-alert-total-impact">' + esc(totalImpactLabel) + '</span>'
              : '';

            actionableHtml =
              '<section class="doc-alert-panel">' +
                '<div class="doc-alert-head">' +
                  '<h4 class="doc-kpi-title">Insights accionables</h4>' +
                  '<div class="doc-alert-head-right">' +
                    totalImpactHtml +
                    '<span class="doc-alert-risk">Riesgo ' + esc(insights.actionable.riskScore) + '/100</span>' +
                  '</div>' +
                '</div>' +
                '<ul class="doc-alert-list">' + alertItems + '</ul>' +
              '</section>';
          }

          var tabs = processed.sheetNames.map(function (name, i) {
            return '<button class="doc-sheet-tab' + (i === 0 ? ' active' : '') + '" type="button" data-sheet="' + esc(name) + '">' + esc(name) + '</button>';
          }).join('');
          body =
            '<div class="doc-preview-meta">' +
              '<span class="doc-badge">excel</span>' +
              '<span class="doc-meta-item">' + processed.sheetNames.length + ' hoja' + (processed.sheetNames.length !== 1 ? 's' : '') + '</span>' +
            '</div>' +
            insightMeta +
            executiveHtml +
            actionableHtml +
            '<div class="doc-excel-charts" id="doc-excel-charts"></div>' +
            '<div class="doc-sheet-tabs" id="doc-sheet-tabs">' + tabs + '</div>' +
            '<div id="doc-sheet-content">' + renderTable(processed.sheets[firstSheet] || [], 50) + '</div>';
        }
        break;
      }
      case 'pdf':
      case 'word': {
        if (processed.error) {
          body =
            '<div class="doc-preview-meta"><span class="doc-badge doc-badge-warn">' + esc(processed.type) + ' · error</span></div>' +
            '<p class="doc-error">' + esc(processed.error) + '</p>';
          break;
        }

        var docExtraMeta = '';
        if (processed.type === 'pdf') {
          docExtraMeta = '<span class="doc-meta-sep">·</span><span class="doc-meta-item">' + esc(processed.pageCount || 0) + ' páginas</span>';
        } else {
          docExtraMeta = '<span class="doc-meta-sep">·</span><span class="doc-meta-item">' + esc(processed.paragraphCount || 0) + ' párrafos</span>';
        }

        body =
          '<div class="doc-preview-meta">' +
            '<span class="doc-badge">' + esc(processed.type) + '</span>' +
            '<span class="doc-meta-item">' + esc(processed.wordCount || 0) + ' palabras</span>' +
            docExtraMeta +
          '</div>' +
          (processed.summary
            ? '<div class="doc-summary">' +
                '<p class="doc-summary-label">Resumen automático</p>' +
                '<p class="doc-summary-text">' + esc(processed.summary) + '</p>' +
              '</div>'
            : '') +
          '<details class="doc-details">' +
            '<summary class="doc-details-trigger">Ver texto extraído</summary>' +
            '<pre class="doc-raw">' + esc((processed.raw || '').slice(0, 20000)) + '</pre>' +
          '</details>';
        break;
      }
      default:
        body =
          '<div class="doc-preview-meta"><span class="doc-badge doc-badge-warn">desconocido</span></div>' +
          '<pre class="doc-raw">' + esc(JSON.stringify(processed, null, 2).slice(0, 6000)) + '</pre>';
    }

    var businessPanel = renderBusinessAnalysisPanel(processed);

    container.innerHTML =
      '<div class="doc-preview-inner">' +
        metaBar +
        businessPanel +
        body +
      '</div>';

    /* wire sheet tabs */
    if (processed.type === 'excel' && !processed.error) {
      var tabsEl = container.querySelector('#doc-sheet-tabs');
      var sheetContentEl = container.querySelector('#doc-sheet-content');
      if (tabsEl && sheetContentEl) {
        tabsEl.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-sheet]');
          if (!btn) return;
          tabsEl.querySelectorAll('.doc-sheet-tab').forEach(function (t) { t.classList.remove('active'); });
          btn.classList.add('active');
          var name = btn.getAttribute('data-sheet');
          sheetContentEl.innerHTML = renderTable(processed.sheets[name] || [], 50);
        });
      }

      var chartsHost = container.querySelector('#doc-excel-charts');
      var chartApi = global.ZyvolaCharts;
      var insights = processed.insights || {};
      var chartItems = Array.isArray(insights.datasetsList) ? insights.datasetsList.slice(0, 4) : [];

      if (chartsHost) {
        if (!chartItems.length) {
          chartsHost.innerHTML = '<p class="doc-empty">No se detectaron suficientes series numéricas para gráficos globales.</p>';
        } else {
          chartsHost.innerHTML = chartItems.map(function (item, index) {
            return '' +
              '<article class="doc-excel-chart-card">' +
                '<h4 class="doc-excel-chart-title">' + esc(item.dataset.label) + '</h4>' +
                '<div class="doc-excel-chart-frame"><canvas id="doc-excel-chart-' + index + '"></canvas></div>' +
              '</article>';
          }).join('');

          if (chartApi && typeof chartApi.renderChart === 'function') {
            chartItems.forEach(function (item, index) {
              chartApi.renderChart(
                'doc-excel-chart-' + index,
                item.dataset.chartType || 'line',
                item.dataset.labels,
                item.dataset.label,
                item.dataset.values
              );
            });
          }
        }
      }
    }
  }

  /* ── analysis export ────────────────────────────────────────────── */

  function exportAnalysisAsJSON(processed, meta) {
    var exportData = {
      exportedAt: new Date().toISOString(),
      file: meta ? { name: meta.filename || '', size: meta.size || 0 } : {},
      type: (processed && processed.type) || 'unknown',
      executiveSummary: (processed && processed.executiveSummary) || null,
      impactScore: (processed && processed.impactScore) || null,
      qualityScore: (processed && processed.qualityScore) || null,
      tone: (processed && processed.tone) || null,
      analysis: (processed && processed.analysis) || null,
      actions: (processed && processed.actions) || null
    };
    try {
      var json = JSON.stringify(exportData, null, 2);
      var blob = new Blob([json], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      var baseName = (meta && meta.filename) ? meta.filename.replace(/\.[^.]+$/, '') : 'analisis';
      a.download = baseName + '_zyvola_analisis.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (_e) { /* blob not supported */ }
  }

  /* ── export ──────────────────────────────────────────────────────── */

  global.ZyvolaDocProcessor = {
    detectDocumentType:    detectDocumentType,
    readUploadedFile:      readUploadedFile,
    processDocument:       processDocument,
    analyzeDocument:       analyzeDocument,
    analyzeText:           analyzeText,
    analyzeCSV:            analyzeCSV,
    analyzeJSON:           analyzeJSON,
    analyzeExcel:          analyzeExcel,
    analyzePending:        analyzePending,
    calculateImpactScore:  calculateImpactScore,
    generateActions:       generateActions,
    buildExecutiveSummary: buildExecutiveSummary,
    parseCSV:              parseCSV,
    parseExcel:            parseExcel,
    buildExcelInsights:    buildExcelInsights,
    createDashboardFromExcel: createDashboardFromExcel,
    summarizeText:         summarizeText,
    renderDocumentPreview: renderDocumentPreview,
    saveDocument:          saveDocument,
    loadSavedDocuments:    loadSavedDocuments,
    deleteSavedDocument:   deleteSavedDocument,
    extractFinanceTransactions: extractFinanceTransactions,
    importToFinanceRuntime: importToFinanceRuntime,
    exportAnalysisAsJSON:  exportAnalysisAsJSON,
    fmtSize:               fmtSize
  };

})(window);
