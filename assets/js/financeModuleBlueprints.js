window.FINANCE_MODULE_BLUEPRINTS = [
  {
    id: "resumen-financiero",
    name: "Resumen financiero",
    objective: "Concentrar en una sola vista la salud financiera actual y las prioridades accionables del usuario.",
    functions: [
      "Panel consolidado de saldo, ingresos, gastos y ahorro neto.",
      "Semaforo de salud financiera por rango objetivo.",
      "Comparativa mensual y tendencia de 3/6/12 meses.",
      "Top 5 alertas criticas con prioridad automatica.",
      "Resumen de objetivos activos y progreso acumulado.",
      "Acciones sugeridas para el siguiente ciclo semanal.",
      "Bloque de riesgo operativo (deuda, liquidez, sobrecostes)."
    ],
    inputs: [
      "Transacciones normalizadas por fecha, categoria e importe.",
      "Saldos de cuentas y productos financieros.",
      "Objetivos de ahorro, deuda e inversion.",
      "Reglas de presupuesto y umbrales personalizados.",
      "Historico de cierres mensuales."
    ],
    outputs: [
      "KPIs de resumen (ingresos, gastos, ahorro neto, cash ratio).",
      "Grafico de evolucion temporal.",
      "Mapa de alertas por severidad.",
      "Tabla de variaciones vs mes anterior.",
      "Insights de impacto inmediato."
    ],
    logic: {
      calculations: [
        "Ahorro neto = ingresos - gastos.",
        "Runway = liquidez disponible / gasto mensual promedio.",
        "Score de estabilidad ponderando liquidez, deuda y consistencia."
      ],
      rules: [
        "Alerta roja si ahorro neto < 0 durante 2 periodos seguidos.",
        "Alerta amarilla si gasto discrecional supera umbral definido."
      ],
      detection: [
        "Deteccion de desviaciones abruptas por categoria.",
        "Deteccion de estancamiento en objetivos clave."
      ],
      analysis: [
        "Analisis de tendencia y volatilidad de flujo.",
        "Analisis de concentracion de gasto."
      ],
      ai: [
        "Motor de recomendaciones por patrones recurrentes.",
        "Priorizacion automatica de acciones sugeridas."
      ],
      automations: [
        "Cierre automatico diario y snapshot semanal.",
        "Actualizacion de panel tras sincronizacion bancaria."
      ]
    },
    endpoints: [
      "GET /api/finance/summary?range=30d",
      "GET /api/finance/summary/trends?period=12m",
      "GET /api/finance/summary/alerts",
      "POST /api/finance/summary/recompute"
    ],
    events: [
      "cron.daily.summary.refresh",
      "cron.weekly.summary.snapshot",
      "transaction.created -> summary.incrementalUpdate",
      "goal.updated -> summary.goalRecompute"
    ],
    premiumIdeas: [
      "Vista ejecutiva multicuenta con benchmark por perfil.",
      "Score predictivo de tension financiera a 30 dias.",
      "Recomendaciones con impacto estimado en euros."
    ]
  },
  {
    id: "estado-financiero-personal",
    name: "Estado financiero personal",
    objective: "Modelar la posicion financiera personal de forma estructurada para evaluar estabilidad y crecimiento.",
    functions: [
      "Ficha integral de activos, pasivos e indicadores de solvencia.",
      "Tracking de variacion patrimonial por periodos.",
      "Clasificacion por bloques: liquidez, inversion, deuda, obligaciones.",
      "Comparativa de estado actual vs objetivo anual.",
      "Deteccion de desequilibrios en composicion patrimonial.",
      "Panel de exposicion por tipo de activo.",
      "Estimador de capacidad financiera futura."
    ],
    inputs: [
      "Inventario de activos y pasivos con valor actual.",
      "Saldos de cuentas y deuda pendiente.",
      "Objetivos de composicion patrimonial.",
      "Historico de valoraciones.",
      "Calendario de obligaciones financieras."
    ],
    outputs: [
      "Estado financiero agregado.",
      "Tabla de composicion patrimonial.",
      "Grafico de evolutivo de solvencia.",
      "Indice de estabilidad personal.",
      "Alertas por concentracion o sobreapalancamiento."
    ],
    logic: {
      calculations: [
        "Patrimonio neto = activos - pasivos.",
        "Ratio deuda/activo y ratio liquidez inmediata.",
        "Capacidad de ahorro proyectada por flujo promedio."
      ],
      rules: [
        "Alerta si ratio deuda/ingreso excede limite objetivo.",
        "Alerta si liquidez < 3 meses de gasto fijo."
      ],
      detection: [
        "Deteccion de dependencia excesiva de un activo.",
        "Deteccion de deterioro progresivo de solvencia."
      ],
      analysis: [
        "Analisis de resiliencia ante escenarios de caida de ingresos.",
        "Analisis de consistencia en crecimiento patrimonial."
      ],
      ai: [
        "Rebalanceo sugerido de bloques patrimoniales.",
        "Prediccion de riesgo de tension financiera."
      ],
      automations: [
        "Recalculo tras cada actualizacion de saldo.",
        "Snapshot automatico de fin de mes."
      ]
    },
    endpoints: [
      "GET /api/finance/personal-state",
      "GET /api/finance/personal-state/history",
      "POST /api/finance/personal-state/rebalance-suggestions",
      "POST /api/finance/personal-state/recompute"
    ],
    events: [
      "balance.updated -> personalState.recompute",
      "cron.monthly.personalState.snapshot",
      "liability.changed -> personalState.riskCheck"
    ],
    premiumIdeas: [
      "Stress map de estado financiero con escenarios personalizados.",
      "Simulacion de decision grande (coche, vivienda, mudanza).",
      "Comparativa anonima por segmento de perfil."
    ]
  },
  {
    id: "flujo-de-caja",
    name: "Flujo de caja",
    objective: "Controlar entradas y salidas para anticipar tensiones y optimizar liquidez operativa.",
    functions: [
      "Calendario de cash in/cash out diario, semanal y mensual.",
      "Vista de flujo real vs flujo previsto.",
      "Deteccion de picos de salida por periodicidad.",
      "Forecast de liquidez a corto plazo.",
      "Alertas de saldo minimo operativo.",
      "Segmentacion por categorias fijas y variables.",
      "Recomendaciones de ajuste de gasto."
    ],
    inputs: [
      "Transacciones historicas etiquetadas.",
      "Pagos recurrentes y suscripciones.",
      "Ingresos recurrentes y extraordinarios.",
      "Saldo inicial por cuenta.",
      "Reglas de umbral de liquidez."
    ],
    outputs: [
      "Proyeccion de caja 7/30/90 dias.",
      "Grafico de flujo neto acumulado.",
      "Mapa de riesgo de liquidez por fecha.",
      "Tabla de desviaciones previsto vs real.",
      "Alertas tempranas de tension."
    ],
    logic: {
      calculations: [
        "Flujo neto por periodo.",
        "Saldo proyectado por fecha considerando recurrencias.",
        "Desviacion porcentual entre forecast y real."
      ],
      rules: [
        "Alerta roja si proyeccion cruza umbral minimo.",
        "Alerta amarilla si gasto variable supera promedio historico + desviacion."
      ],
      detection: [
        "Deteccion de estacionalidad de salidas.",
        "Deteccion de eventos atipicos de cobro/pago."
      ],
      analysis: [
        "Analisis de cobertura de obligaciones proximas.",
        "Analisis de elasticidad de gasto recortable."
      ],
      ai: [
        "Forecast adaptativo segun comportamiento reciente.",
        "Sugerencias de fecha optima para pagos."
      ],
      automations: [
        "Reforecast diario automatico.",
        "Trigger de alerta inmediata por transaccion relevante."
      ]
    },
    endpoints: [
      "GET /api/finance/cashflow?range=90d",
      "GET /api/finance/cashflow/forecast?days=30",
      "GET /api/finance/cashflow/alerts",
      "POST /api/finance/cashflow/recompute"
    ],
    events: [
      "cron.daily.cashflow.forecast",
      "transaction.created -> cashflow.incrementalUpdate",
      "subscription.updated -> cashflow.reforecast"
    ],
    premiumIdeas: [
      "What-if planner para mover gastos entre fechas.",
      "Liquidez consolidada multicuenta en tiempo real.",
      "Auto-propuesta de colchon minimo dinamico."
    ]
  },
  {
    id: "balance-general",
    name: "Balance general",
    objective: "Estructurar activos, pasivos y patrimonio para medir solvencia y posicion financiera neta.",
    functions: [
      "Vista tabular y jerarquica de balance.",
      "Consolidacion de cuentas y productos.",
      "Comparativa temporal del balance.",
      "Ratio de apalancamiento y cobertura.",
      "Distribucion de activos por clase.",
      "Tracking de pasivos por vencimiento.",
      "Exportable a formato contable."
    ],
    inputs: [
      "Catalogo de activos y pasivos.",
      "Valoraciones periodicas.",
      "Datos de deuda con calendario.",
      "Ajustes manuales contables.",
      "Parametros de clasificacion patrimonial."
    ],
    outputs: [
      "Balance consolidado por fecha.",
      "Ratios de solvencia.",
      "Grafico de estructura patrimonial.",
      "Tabla de evolucion de pasivos.",
      "Alertas de desequilibrio estructural."
    ],
    logic: {
      calculations: [
        "Patrimonio = activo total - pasivo total.",
        "Ratio pasivo/activo y ratio patrimonio/activo.",
        "Cobertura de pasivos con activos liquidos."
      ],
      rules: [
        "Alerta si apalancamiento supera limite definido.",
        "Alerta si concentracion de activo supera umbral."
      ],
      detection: [
        "Deteccion de degradacion de calidad de activos.",
        "Deteccion de vencimientos conflictivos de deuda."
      ],
      analysis: [
        "Analisis de robustez de estructura.",
        "Analisis de sensibilidad ante shock de mercado."
      ],
      ai: [
        "Sugerencias de rebalanceo de activos.",
        "Clasificacion automatica de partidas nuevas."
      ],
      automations: [
        "Cierre mensual automatico del balance.",
        "Recalculo incremental por cambios de valoracion."
      ]
    },
    endpoints: [
      "GET /api/finance/balance-sheet",
      "GET /api/finance/balance-sheet/history",
      "GET /api/finance/balance-sheet/ratios",
      "POST /api/finance/balance-sheet/recompute"
    ],
    events: [
      "cron.monthly.balance.close",
      "asset.valuation.updated -> balance.recompute",
      "liability.schedule.updated -> balance.riskCheck"
    ],
    premiumIdeas: [
      "Versionado de cierres contables con auditoria.",
      "Comparador de balance contra objetivo estructural.",
      "Escenarios de desapalancamiento guiado."
    ]
  },
  {
    id: "patrimonio-neto",
    name: "Patrimonio neto",
    objective: "Medir y proyectar la evolucion del patrimonio neto para apoyar decisiones de largo plazo.",
    functions: [
      "Linea temporal del patrimonio neto.",
      "Desglose de contribucion por tipo de activo.",
      "Tracking de hitos patrimoniales.",
      "Proyeccion de patrimonio por escenarios.",
      "Comparativa rendimiento vs inflacion.",
      "Objetivos de patrimonio y ritmo requerido.",
      "Alertas por desviacion de trayectoria."
    ],
    inputs: [
      "Historico de activos/pasivos.",
      "Aportes, retiros y variaciones de mercado.",
      "Metas patrimoniales por fecha.",
      "Supuestos de rentabilidad e inflacion.",
      "Horizonte temporal objetivo."
    ],
    outputs: [
      "Patrimonio neto actual y evolucion.",
      "Curva de proyeccion base/optimista/estres.",
      "Gap hacia objetivo.",
      "Tabla de contribucion por factor.",
      "Alertas de desaceleracion patrimonial."
    ],
    logic: {
      calculations: [
        "Patrimonio neto en fecha corte.",
        "CAGR patrimonial.",
        "Patrimonio real ajustado por inflacion."
      ],
      rules: [
        "Alerta si crecimiento cae bajo trayectoria minima.",
        "Alerta si deuda crece mas rapido que activos."
      ],
      detection: [
        "Deteccion de periodos de erosión patrimonial.",
        "Deteccion de sobredependencia de un activo."
      ],
      analysis: [
        "Analisis de impulsores de crecimiento neto.",
        "Analisis de riesgo de cumplimiento de meta."
      ],
      ai: [
        "Recomendaciones de aportacion mensual objetivo.",
        "Proyeccion probabilistica por bandas."
      ],
      automations: [
        "Actualizacion diaria de valor neto.",
        "Reevaluacion de metas al cierre mensual."
      ]
    },
    endpoints: [
      "GET /api/finance/net-worth",
      "GET /api/finance/net-worth/trend",
      "GET /api/finance/net-worth/projection",
      "POST /api/finance/net-worth/recompute"
    ],
    events: [
      "cron.daily.netWorth.refresh",
      "goal.updated -> netWorth.retarget",
      "asset.value.changed -> netWorth.incrementalUpdate"
    ],
    premiumIdeas: [
      "Mapa FIRE con progreso hacia independencia financiera.",
      "Comparador de estrategias de aportacion.",
      "Asistente de decisiones con impacto patrimonial estimado."
    ]
  },
  {
    id: "indicadores-financieros",
    name: "Indicadores financieros",
    objective: "Calcular y monitorizar indicadores clave para evaluar rendimiento, riesgo y sostenibilidad financiera.",
    functions: [
      "Biblioteca de KPIs financieros personalizables.",
      "Semaforos de estado por umbral.",
      "Comparativa KPI actual vs historico.",
      "Panel de alertas por ruptura de rango.",
      "Ranking de indicadores por criticidad.",
      "Exportacion de reportes KPI.",
      "Anotaciones de contexto por periodo."
    ],
    inputs: [
      "Datos de ingresos, gastos, activos y pasivos.",
      "Umbrales KPI por perfil de usuario.",
      "Historico de periodos.",
      "Reglas de negocio para alertas.",
      "Metas financieras."
    ],
    outputs: [
      "Dashboard de indicadores.",
      "Serie temporal por KPI.",
      "Alertas de desviacion.",
      "Resumen ejecutivo KPI.",
      "Tabla de cumplimiento de objetivos."
    ],
    logic: {
      calculations: [
        "Tasa de ahorro, deuda/ingreso, liquidez, cobertura.",
        "Variacion intermensual e interanual.",
        "Indice compuesto de salud financiera."
      ],
      rules: [
        "Clasificacion por rango: sano, vigilancia, critico.",
        "Escalado de alerta por persistencia de desviacion."
      ],
      detection: [
        "Deteccion de cambio de regimen en indicadores.",
        "Deteccion de deterioro correlacionado multi-KPI."
      ],
      analysis: [
        "Analisis de causa raiz de deterioro KPI.",
        "Analisis de elasticidad de mejora por accion."
      ],
      ai: [
        "Generacion automatica de explicaciones KPI.",
        "Sugerencia de priorizacion de mejoras."
      ],
      automations: [
        "Recalculo KPI tras cada sincronizacion.",
        "Snapshot semanal de estado."
      ]
    },
    endpoints: [
      "GET /api/finance/indicators",
      "GET /api/finance/indicators/history",
      "GET /api/finance/indicators/alerts",
      "POST /api/finance/indicators/recompute"
    ],
    events: [
      "cron.daily.indicators.refresh",
      "threshold.updated -> indicators.reclassify",
      "transaction.created -> indicators.incrementalUpdate"
    ],
    premiumIdeas: [
      "Editor avanzado de KPI con formulas custom.",
      "Comparador de KPI contra cohortes anonimas.",
      "Alertas inteligentes con explicacion de impacto."
    ]
  },
  {
    id: "auditoria-automatica-de-gastos",
    name: "Auditoría automática de gastos",
    objective: "Auditar automaticamente el gasto para detectar ineficiencias, fugas y oportunidades de ahorro.",
    functions: [
      "Escaneo de gasto por categoria y proveedor.",
      "Deteccion de sobrecostes recurrentes.",
      "Identificacion de gastos prescindibles.",
      "Ranking de oportunidades de ahorro inmediato.",
      "Comparativa de precio historico por servicio.",
      "Alertas por desviacion no justificada.",
      "Checklist accionable de correcciones."
    ],
    inputs: [
      "Transacciones historicas y actuales.",
      "Etiquetas de necesidad (fijo, variable, discrecional).",
      "Presupuestos por categoria.",
      "Suscripciones y servicios recurrentes.",
      "Reglas de tolerancia de variacion."
    ],
    outputs: [
      "Informe de auditoria por periodo.",
      "Lista de gastos optimizables.",
      "Ahorro potencial estimado en euros.",
      "Alertas de gasto anomalo.",
      "Plan de accion priorizado."
    ],
    logic: {
      calculations: [
        "Diferencia entre gasto real y baseline esperado.",
        "Ahorro potencial por eliminacion o sustitucion.",
        "Impacto acumulado anual de correcciones."
      ],
      rules: [
        "Marcar gasto como auditable si supera umbral de desviacion.",
        "Priorizar acciones por ratio impacto/esfuerzo."
      ],
      detection: [
        "Deteccion de picos injustificados.",
        "Deteccion de pagos recurrentes sin uso aparente."
      ],
      analysis: [
        "Analisis de patrones de consumo por proveedor.",
        "Analisis de sensibilidad de presupuesto."
      ],
      ai: [
        "Clasificacion de gasto util vs recortable.",
        "Sugerencia de alternativas mas eficientes."
      ],
      automations: [
        "Auditoria nocturna automatica.",
        "Generacion semanal de informe de oportunidades."
      ]
    },
    endpoints: [
      "GET /api/finance/expense-audit/report",
      "GET /api/finance/expense-audit/opportunities",
      "GET /api/finance/expense-audit/anomalies",
      "POST /api/finance/expense-audit/run"
    ],
    events: [
      "cron.nightly.expenseAudit.run",
      "transaction.created -> expenseAudit.incrementalCheck",
      "budget.updated -> expenseAudit.rebaseline"
    ],
    premiumIdeas: [
      "Negociador de tarifas asistido por IA.",
      "Simulador de ahorro acumulado por plan de recorte.",
      "Integracion con proveedores para propuesta de downgrade."
    ]
  },
  {
    id: "clasificador-de-transacciones",
    name: "Clasificador de transacciones",
    objective: "Clasificar automaticamente cada transaccion para mantener un dataset financiero limpio y accionable.",
    functions: [
      "Clasificacion automatica por categoria y subcategoria.",
      "Deteccion de transferencias internas.",
      "Separacion de gasto personal vs negocio.",
      "Aprendizaje de reglas personalizadas del usuario.",
      "Normalizacion de descripciones de movimiento.",
      "Reasignacion masiva de categorias.",
      "Control de calidad de etiquetas."
    ],
    inputs: [
      "Feed de transacciones bancarias.",
      "Diccionario de categorias y reglas.",
      "Historico etiquetado por usuario.",
      "Metadatos de comercio y medio de pago.",
      "Reglas de exclusiones/manual overrides."
    ],
    outputs: [
      "Transacciones clasificadas.",
      "Confianza de clasificacion por item.",
      "Items ambiguos para revision.",
      "Log de reglas aplicadas.",
      "Matriz de precision de clasificacion."
    ],
    logic: {
      calculations: [
        "Score de confianza por modelo y reglas.",
        "Cobertura de clasificacion automatica."
      ],
      rules: [
        "Reglas deterministas priorizadas sobre modelo.",
        "Fallback a categoria temporal si confianza baja."
      ],
      detection: [
        "Deteccion de cambios de patron en comercio.",
        "Deteccion de posibles errores de etiquetado historico."
      ],
      analysis: [
        "Analisis de precision por categoria.",
        "Analisis de ambiguedad por proveedor."
      ],
      ai: [
        "Modelo NLP para descripciones de transaccion.",
        "Sistema de aprendizaje continuo por feedback."
      ],
      automations: [
        "Clasificacion en streaming al recibir transaccion.",
        "Retraining programado con nuevos labels."
      ]
    },
    endpoints: [
      "POST /api/finance/transactions/classify",
      "POST /api/finance/transactions/reclassify",
      "GET /api/finance/transactions/unresolved",
      "POST /api/finance/transactions/classifier-feedback"
    ],
    events: [
      "transaction.created -> classifier.run",
      "classifier.feedback.received -> classifier.learn",
      "cron.weekly.classifier.retrain"
    ],
    premiumIdeas: [
      "Clasificacion multicriterio por contexto geolocalizado.",
      "Auto-segmentacion de categorias por estilo de vida.",
      "Auditoria inteligente de consistencia fiscal."
    ]
  },
  {
    id: "deteccion-de-comisiones-bancarias",
    name: "Detección de comisiones bancarias",
    objective: "Identificar automaticamente comisiones explicitas y ocultas para reducir costes bancarios.",
    functions: [
      "Deteccion de comisiones por mantenimiento, transferencias y tarjetas.",
      "Identificacion de cargos repetitivos no negociados.",
      "Clasificacion por tipo de comision y entidad.",
      "Comparativa historica de comisiones mensuales.",
      "Alertas por incremento anomalo de comisiones.",
      "Estimacion de ahorro potencial por cambio de condiciones.",
      "Registro de disputas y recuperaciones."
    ],
    inputs: [
      "Movimientos bancarios con descripciones completas.",
      "Condiciones de cuentas y productos contratados.",
      "Catalogo de tipos de comision esperables.",
      "Historico de cobros bancarios.",
      "Datos de entidades y cuentas vinculadas."
    ],
    outputs: [
      "Listado de comisiones detectadas.",
      "Informe mensual por entidad.",
      "Alertas de comision sospechosa.",
      "Cuadro de ahorro potencial anual.",
      "Recomendaciones de accion (reclamar, renegociar, migrar)."
    ],
    logic: {
      calculations: [
        "Comision total mensual y anual.",
        "Desviacion vs media historica por tipo.",
        "Ahorro estimado por optimizacion."
      ],
      rules: [
        "Marcar como sospechosa si no coincide con condiciones pactadas.",
        "Escalar prioridad segun impacto acumulado."
      ],
      detection: [
        "Deteccion por patrones de texto y codigos de cargo.",
        "Deteccion de duplicidad de comisiones por evento unico."
      ],
      analysis: [
        "Analisis comparativo entre entidades.",
        "Analisis de recurrencia y recurrencia creciente."
      ],
      ai: [
        "Clasificador de comisiones ocultas por similitud semantica.",
        "Sugerencia de estrategia de reclamacion priorizada."
      ],
      automations: [
        "Monitor diario de nuevos cargos tipo comision.",
        "Informe automatico de cierre mensual."
      ]
    },
    endpoints: [
      "GET /api/finance/bank-fees",
      "GET /api/finance/bank-fees/anomalies",
      "GET /api/finance/bank-fees/summary",
      "POST /api/finance/bank-fees/recompute"
    ],
    events: [
      "transaction.created -> bankFees.check",
      "cron.daily.bankFees.scan",
      "account.terms.updated -> bankFees.reconcile"
    ],
    premiumIdeas: [
      "Asistente de carta de reclamacion autogenerada.",
      "Benchmark de coste bancario por perfil de uso.",
      "Motor de recomendaciones de cuenta alternativa."
    ]
  },
  {
    id: "deteccion-de-gastos-duplicados",
    name: "Detección de gastos duplicados",
    objective: "Detectar cargos duplicados o repetidos indebidamente para prevenir perdida de dinero y fraude operativo.",
    functions: [
      "Deteccion de duplicados exactos por importe, fecha y comercio.",
      "Deteccion de casi-duplicados con ventana temporal configurable.",
      "Agrupacion de transacciones sospechosas por cluster.",
      "Alertas inmediatas de posible duplicado.",
      "Panel de casos abiertos/cerrados.",
      "Registro de reembolso o correccion.",
      "Exportable de incidencias para soporte bancario."
    ],
    inputs: [
      "Transacciones en tiempo real e historicas.",
      "Metadatos de comercio, importe y timestamp.",
      "Reglas de tolerancia (importe/tiempo).",
      "Marcas de transaccion validada por usuario.",
      "Datos de reversiones y devoluciones."
    ],
    outputs: [
      "Lista de posibles duplicados con score de confianza.",
      "Alertas push/email de casos criticos.",
      "Tabla de impacto economico potencial.",
      "Estado de seguimiento por incidencia.",
      "Reporte de duplicados prevenidos."
    ],
    logic: {
      calculations: [
        "Score de similitud por importe, proveedor y proximidad temporal.",
        "Impacto monetario total de duplicados detectados."
      ],
      rules: [
        "Duplicado exacto si coincide firma completa.",
        "Casi-duplicado si similitud supera umbral configurable."
      ],
      detection: [
        "Deteccion por hash de firma de transaccion.",
        "Deteccion fuzzy para variaciones de descripcion."
      ],
      analysis: [
        "Analisis de origen recurrente de duplicados.",
        "Analisis de tasa de falsos positivos."
      ],
      ai: [
        "Modelo de priorizacion de sospechas reales.",
        "Sugerencia automatica de accion por caso."
      ],
      automations: [
        "Trigger inmediato al alta de transaccion.",
        "Cierre automatico si aparece reverso confirmado."
      ]
    },
    endpoints: [
      "GET /api/finance/duplicate-expenses",
      "GET /api/finance/duplicate-expenses/open",
      "POST /api/finance/duplicate-expenses/resolve",
      "POST /api/finance/duplicate-expenses/recompute"
    ],
    events: [
      "transaction.created -> duplicateDetector.run",
      "refund.created -> duplicateDetector.autoResolve",
      "cron.hourly.duplicateDetector.rescanRecent"
    ],
    premiumIdeas: [
      "Deteccion preventiva en autorizaciones pendientes.",
      "Workflow de reclamacion bancaria con tracking.",
      "Modulo antifraude de microcargos anormales."
    ]
  }
];
