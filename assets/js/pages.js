window.ZYVOLA_DATA = {
  brand: {
    name: "Zyvola",
    claim: "Negativo + negativo = positivo.",
    statement:
      "Convertimos fricción en precisión modular para construir herramientas sobrias, útiles y escalables."
  },
  nav: [
    { key: "home", label: "Inicio", href: "index.html" },
    { key: "panel", label: "Panel", href: "finance/panel/index.html" },
    { key: "inversiones", label: "Inversiones", href: "etf/index.html" },
    { key: "documentos", label: "Documentos", href: "documents/index.html" },
    { key: "connect", label: "Connect", href: "connect/index.html" }
  ],
  categories: {
    finance: {
      key: "finance",
      label: "Finanzas",
      title: "Zyvola Finanzas",
      description:
        "Centro financiero modular con panel, simuladores, calculadora, guías, optimizador, analizador y valores de mercado.",
      cta: {
        title: "Activa tu flujo financiero completo",
        copy: "Empieza por panel y simuladores, luego ajusta estrategia con optimizador y analizador desde un mismo sistema.",
        href: "connect/index.html",
        label: "Abrir flujo"
      },
      tools: [
        "finance-roi-architect",
        "finance-risk-matrix",
        "finance-cashflow-lens",
        "finance-tax-route",
        "finance-debt-balance",
        "finance-crypto-delta"
      ],
      subpages: []
    },
    documentos: {
      key: "documents",
      label: "Documentos",
      title: "Zyvola Documentos",
      description:
        "Centro documental financiero para importar, procesar y exportar archivos con flujos automáticos.",
      cta: {
        title: "Centraliza tu flujo documental",
        copy: "Importa archivos, automatiza el procesamiento y exporta informes en formatos estándar.",
        href: "connect/index.html",
        label: "Abrir flujo documental"
      },
      tools: [],
      subpages: []
    },
    productivity: {
      key: "productivity",
      label: "Productivity",
      title: "Zyvola Productivity",
      description:
        "Módulos operativos para ejecución, foco y cadencia semanal, diseñados para claridad y continuidad.",
      cta: {
        title: "Amplía tus rutinas con bloques Life",
        copy: "Escala tus sistemas personales sin romper consistencia visual ni estructura de navegación.",
        href: "life/index.html",
        label: "Ver sinergias"
      },
      tools: [
        "productivity-routine-blocks",
        "productivity-deep-work-grid",
        "productivity-habit-engine",
        "productivity-day-mapping",
        "productivity-focus-counter",
        "productivity-weekly-vault"
      ],
      subpages: [{ title: "Rutinas", href: "rutinas/index.html", note: "Plantilla de herramienta" }]
    },
    tools: {
      key: "tools",
      label: "Tools",
      title: "Zyvola Tools",
      description:
        "Laboratorio de utilidades premium para mini-apps, generadores y conversiones rápidas con look institucional.",
      cta: {
        title: "Publica nuevos módulos en minutos",
        copy: "La arquitectura de datos permite añadir herramientas sin editar plantillas base ni navegación.",
        href: "connect/index.html",
        label: "Abrir roadmap"
      },
      tools: [
        "tools-generator-x",
        "tools-text-refiner",
        "tools-format-studio",
        "tools-data-splitter",
        "tools-link-compressor",
        "tools-quick-grid"
      ],
      subpages: [{ title: "Generator X", href: "generador-x/index.html", note: "Plantilla de herramienta" }]
    },
    creative: {
      key: "creative",
      label: "Creative",
      title: "Zyvola Creative",
      description:
        "Capa creativa para dirección visual, narrativa y sistemas de concepto con disciplina de producto.",
      cta: {
        title: "Activa Creative en modo colaboración",
        copy: "Escala ideas en estructuras accionables y conecta equipos desde un dashboard coherente.",
        href: "connect/index.html",
        label: "Proponer proyecto"
      },
      tools: [
        "creative-idea-forge",
        "creative-shot-composer",
        "creative-palette-pulse",
        "creative-narrative-deck",
        "creative-sound-motif",
        "creative-brand-board"
      ],
      subpages: []
    },
    life: {
      key: "life",
      label: "Life",
      title: "Zyvola Life",
      description:
        "Sistema Life para bienestar y rendimiento personal con seguimiento modular y decisiones más nítidas.",
      cta: {
        title: "Integra Life con Productivity",
        copy: "Conecta hábitos, sesiones de foco y revisiones semanales dentro del mismo ecosistema premium.",
        href: "productivity/index.html",
        label: "Explorar flujo combinado"
      },
      tools: [
        "life-hydration-matrix",
        "life-training-wave",
        "life-mood-lens",
        "life-sleep-sync",
        "life-energy-dial",
        "life-habit-pulse"
      ],
      subpages: []
    }
  },
  tools: [
    {
      id: "finance-roi-architect",
      category: "finance",
      name: "Panel Financiero",
      tag: "Calculadora",
      state: "Activo",
      href: "finance/resumen-financiero/index.html",
      description: "Vista principal de progreso, actividad y próximos pasos financieros.",
      previewTitle: "Resumen ejecutivo",
      previewBody: "Lectura rápida para decidir qué módulo abrir después.",
      demoLabel: "Abrir herramienta"
    },
    { id: "finance-risk-matrix", category: "finance", name: "Simuladores", tag: "Simulador", state: "Activo", href: "finance/simuladores/index.html", description: "Escenarios interactivos para comparar decisiones con datos claros.", previewTitle: "Comparador de escenarios", previewBody: "Entradas simples, gráfico y resultado accionable.", demoLabel: "Abrir herramienta" },
    { id: "finance-cashflow-lens", category: "finance", name: "Calculadora", tag: "Calculadora", state: "Activo", href: "finance/calculadoras/index.html", description: "Cálculo rápido de ahorro, aportes y horizonte de inversión.", previewTitle: "Objetivo y aportes", previewBody: "Valida números reales antes de ejecutar.", demoLabel: "Abrir herramienta" },
    { id: "finance-tax-route", category: "finance", name: "Guía", tag: "Guía", state: "Activo", href: "finance/guia/index.html", description: "Mini guías para entender conceptos sin ruido técnico.", previewTitle: "Conceptos clave", previewBody: "Aprendizaje corto con aplicación inmediata.", demoLabel: "Abrir herramienta" },
    { id: "finance-debt-balance", category: "finance", name: "Optimizador", tag: "Optimizador", state: "Activo", href: "finance/optimizador/index.html", description: "Ajusta pesos de cartera según riesgo y objetivo.", previewTitle: "Ajuste de cartera", previewBody: "Balance rápido entre crecimiento y estabilidad.", demoLabel: "Abrir herramienta" },
    { id: "finance-crypto-delta", category: "finance", name: "Analizador", tag: "Analizador", state: "Activo", href: "finance/analizador/index.html", description: "Diagnóstico de cartera y lectura visual de valores de mercado.", previewTitle: "Diagnóstico y contexto", previewBody: "Evalúa correlación, riesgo y entorno en una sola vista.", demoLabel: "Abrir herramienta" },

    { id: "productivity-routine-blocks", category: "productivity", name: "Routine Blocks", tag: "Rutinas", state: "Próximamente", href: "productivity/rutinas/index.html", description: "Plantillas de rutina diarias y semanales.", previewTitle: "Bloques de rutina", previewBody: "Secuencias configurables por contexto y energía.", demoLabel: "Abrir herramienta" },
    { id: "productivity-deep-work-grid", category: "productivity", name: "Deep Work Grid", tag: "Planificador", state: "Planificado", href: "productivity/index.html", description: "Estructura de foco por bloques intensivos.", previewTitle: "Grid de foco", previewBody: "Plan semanal con capas de prioridad y ejecución.", demoLabel: "Abrir herramienta" },
    { id: "productivity-habit-engine", category: "productivity", name: "Habit Engine", tag: "Seguimiento", state: "Próximamente", href: "productivity/index.html", description: "Motor de hábitos con métricas operativas.", previewTitle: "Motor de hábito", previewBody: "Rachas, consistencia y peso relativo por hábito.", demoLabel: "Abrir herramienta" },
    { id: "productivity-day-mapping", category: "productivity", name: "Day Mapping", tag: "Organizador", state: "Borrador", href: "productivity/index.html", description: "Mapeo táctico de jornada por capas.", previewTitle: "Mapa diario", previewBody: "Bloques críticos, buffers y tiempo profundo.", demoLabel: "Abrir herramienta" },
    { id: "productivity-focus-counter", category: "productivity", name: "Focus Counter", tag: "Temporizador", state: "Borrador", href: "productivity/index.html", description: "Contador de foco para sesiones medibles.", previewTitle: "Contador de foco", previewBody: "Sesiones, pausas y carga cognitiva acumulada.", demoLabel: "Abrir herramienta" },
    { id: "productivity-weekly-vault", category: "productivity", name: "Weekly Vault", tag: "Revisión", state: "Planificado", href: "productivity/index.html", description: "Revisión semanal con decisiones accionables.", previewTitle: "Bóveda semanal", previewBody: "Resumen de resultados, fricciones y mejoras.", demoLabel: "Abrir herramienta" },

    { id: "tools-generator-x", category: "tools", name: "Generator X", tag: "Generador", state: "Próximamente", href: "tools/generador-x/index.html", description: "Generador modular de salidas estructuradas.", previewTitle: "Generador X", previewBody: "Entrada guiada, panel de salida y exportación rápida.", demoLabel: "Abrir herramienta" },
    { id: "tools-text-refiner", category: "tools", name: "Text Refiner", tag: "Utilidad", state: "Borrador", href: "tools/index.html", description: "Refina texto con parámetros de tono y precisión.", previewTitle: "Refinado textual", previewBody: "Transformación de estilo por perfiles configurables.", demoLabel: "Abrir herramienta" },
    { id: "tools-format-studio", category: "tools", name: "Format Studio", tag: "Formateador", state: "Planificado", href: "tools/index.html", description: "Normalización de estructura para texto y datos.", previewTitle: "Estudio de formato", previewBody: "Conversión uniforme para flujos multi-canal.", demoLabel: "Abrir herramienta" },
    { id: "tools-data-splitter", category: "tools", name: "Data Splitter", tag: "Conversor", state: "Borrador", href: "tools/index.html", description: "Divide y reorganiza datasets en segundos.", previewTitle: "Separador de datos", previewBody: "Cortes por columna, reglas y delimitadores.", demoLabel: "Abrir herramienta" },
    { id: "tools-link-compressor", category: "tools", name: "Link Compressor", tag: "Web", state: "Próximamente", href: "tools/index.html", description: "Acorta enlaces y gestiona destinos en lote.", previewTitle: "Compresor de enlaces", previewBody: "Gestión rápida de URL para distribución.", demoLabel: "Abrir herramienta" },
    { id: "tools-quick-grid", category: "tools", name: "Quick Grid", tag: "Constructor", state: "Planificado", href: "tools/index.html", description: "Constructor visual de rejillas rápidas.", previewTitle: "Constructor grid", previewBody: "Plantillas de layout listas para producción.", demoLabel: "Abrir herramienta" },

    { id: "creative-idea-forge", category: "creative", name: "Idea Forge", tag: "Ideación", state: "Próximamente", href: "creative/index.html", description: "Generación de conceptos con lógica de producto.", previewTitle: "Forja de ideas", previewBody: "Sistema de prompts y validación de concepto.", demoLabel: "Abrir herramienta" },
    { id: "creative-shot-composer", category: "creative", name: "Shot Composer", tag: "Video", state: "Borrador", href: "creative/index.html", description: "Composición de planos para narrativa visual.", previewTitle: "Composer", previewBody: "Secuencias visuales por ritmo y objetivo.", demoLabel: "Abrir herramienta" },
    { id: "creative-palette-pulse", category: "creative", name: "Palette Pulse", tag: "Diseño", state: "Planificado", href: "creative/index.html", description: "Sistema cromático con balance editorial.", previewTitle: "Pulse de paleta", previewBody: "Reglas de color para consistencia de marca.", demoLabel: "Abrir herramienta" },
    { id: "creative-narrative-deck", category: "creative", name: "Narrative Deck", tag: "Historia", state: "Planificado", href: "creative/index.html", description: "Construye narrativa modular para campañas.", previewTitle: "Deck narrativo", previewBody: "Arcos, tensión y bloques de mensaje.", demoLabel: "Abrir herramienta" },
    { id: "creative-sound-motif", category: "creative", name: "Sound Motif", tag: "Audio", state: "Borrador", href: "creative/index.html", description: "Dirección sonora para identidad de producto.", previewTitle: "Motif sonoro", previewBody: "Moodboards de audio con capas descriptivas.", demoLabel: "Abrir herramienta" },
    { id: "creative-brand-board", category: "creative", name: "Brand Board", tag: "Identidad", state: "Próximamente", href: "creative/index.html", description: "Tablero editorial para dirección de marca.", previewTitle: "Board de marca", previewBody: "Biblioteca modular de referencias y activos.", demoLabel: "Abrir herramienta" },

    { id: "life-hydration-matrix", category: "life", name: "Hydration Matrix", tag: "Bienestar", state: "Borrador", href: "life/index.html", description: "Registro de hidratación con lectura semanal.", previewTitle: "Matriz de hidratación", previewBody: "Tendencias, hábitos y alertas de consistencia.", demoLabel: "Abrir herramienta" },
    { id: "life-training-wave", category: "life", name: "Training Wave", tag: "Fitness", state: "Próximamente", href: "life/index.html", description: "Progresión de entrenamiento por ciclos.", previewTitle: "Wave de entrenamiento", previewBody: "Bloques de carga y recuperación equilibrados.", demoLabel: "Abrir herramienta" },
    { id: "life-mood-lens", category: "life", name: "Mood Lens", tag: "Reflexión", state: "Planificado", href: "life/index.html", description: "Registro emocional con señal de decisiones.", previewTitle: "Lente emocional", previewBody: "Patrones de ánimo y correlación con hábitos.", demoLabel: "Abrir herramienta" },
    { id: "life-sleep-sync", category: "life", name: "Sleep Sync", tag: "Recuperación", state: "Borrador", href: "life/index.html", description: "Monitoreo de descanso y recuperación diaria.", previewTitle: "Sync de sueño", previewBody: "Horas, eficiencia y consistencia nocturna.", demoLabel: "Abrir herramienta" },
    { id: "life-energy-dial", category: "life", name: "Energy Dial", tag: "Seguimiento", state: "Próximamente", href: "life/index.html", description: "Indicador de energía para gestión diaria.", previewTitle: "Dial de energía", previewBody: "Niveles de energía cruzados con actividad.", demoLabel: "Abrir herramienta" },
    { id: "life-habit-pulse", category: "life", name: "Habit Pulse", tag: "Rutina", state: "Planificado", href: "life/index.html", description: "Pulso de hábitos para mejora incremental.", previewTitle: "Pulse de hábitos", previewBody: "Seguimiento compacto de consistencia y avance.", demoLabel: "Abrir herramienta" }
  ],
  highlights: {
    mostUsed: ["finance-roi-architect", "finance-risk-matrix", "finance-cashflow-lens"],
    new: ["finance-tax-route", "finance-debt-balance", "finance-crypto-delta"],
    recommended: ["finance-roi-architect", "productivity-deep-work-grid", "creative-brand-board"]
  },
  financeMenuSections: [
    {
      key: "finanzas-inversion",
      label: "Finanzas e inversión",
      tools: [
        "Calculadora de interés compuesto",
        "Calculadora de inflación",
        "Calculadora de ROI",
        "Calculadora de VAN",
        "Calculadora de TIR",
        "Calculadora de riesgo",
        "Calculadora DCA",
        "Proyección de dividendos",
        "Calculadora de rentabilidad ajustada al riesgo",
        "Calculadora de plusvalías y minusvalías",
        "WACC (Coste Medio Ponderado de Capital)",
        "CAPM (Rentabilidad esperada)",
        "Beta de cartera",
        "CAGR real (ajustado por inflación)",
        "Payback descontado",
        "Margen de seguridad (value investing)",
        "Rebalanceo óptimo según pesos objetivo",
        "Análisis de sensibilidad (VAN/TIR variando inputs)"
      ]
    },
    {
      key: "negocios-empresas",
      label: "Negocios y empresas",
      tools: [
        "Punto de equilibrio (Break-even)",
        "Unit Economics (margen unitario, contribución, etc.)",
        "CAC (Coste de adquisición de cliente)",
        "LTV (Lifetime Value)",
        "Ratio LTV/CAC",
        "Churn rate",
        "Retention rate",
        "Márgenes: bruto, operativo y neto",
        "DCF simplificado (valor presente de flujos)",
        "Elasticidad precio / análisis de pricing"
      ]
    },
    {
      key: "inmobiliario",
      label: "Inmobiliario",
      tools: [
        "Calculadora de préstamos",
        "Calculadora de hipoteca",
        "Calculadora de amortización",
        "Rentabilidad bruta",
        "Rentabilidad neta",
        "Cap rate",
        "Cash-on-cash return",
        "Flujo de caja mensual",
        "ROI inmobiliario con impuestos",
        "IRR inmobiliaria (iterativa pero aceptada como calculadora)",
        "Compra vs alquiler (versión simple basada en coste anual)"
      ]
    },
    {
      key: "finanzas-personales",
      label: "Finanzas personales",
      tools: [
        "Calculadora de jubilación",
        "Impacto de impuestos en inversiones",
        "CAGR del patrimonio"
      ]
    }
  ],
  documentsMenuSections: [
    {
      key: "importar-datos",
      label: "Importar datos",
      tools: [
        "Importar CSV",
        "Importar PDF",
        "Importar Excel",
        "Importar datos bancarios",
        "Importar datos fiscales"
      ]
    },
    {
      key: "procesamiento-automatico",
      label: "Procesamiento automático",
      tools: [
        "Clasificador de transacciones",
        "Auditoría automática de gastos",
        "Detección de comisiones bancarias",
        "Detección de gastos duplicados",
        "Limpieza automática de datos",
        "Normalización de categorías"
      ]
    },
    {
      key: "finanzas-automaticas",
      label: "Finanzas automáticas",
      tools: [
        "Resumen financiero automático",
        "Estado financiero personal automático",
        "Flujo de caja automático",
        "Balance general automático",
        "Patrimonio neto automático",
        "Indicadores financieros automáticos"
      ]
    },
    {
      key: "informes-automaticos",
      label: "Informes automáticos",
      tools: [
        "Generador de informes automáticos",
        "Informe mensual automático",
        "Informe anual automático",
        "Informe de gastos automático",
        "Informe de ingresos automático",
        "Informe de inversiones automático",
        "Informe de patrimonio automático",
        "Informe fiscal anual automático"
      ]
    },
    {
      key: "exportar-y-plantillas",
      label: "Exportar y plantillas",
      tools: [
        "Exportar datos",
        "Exportar CSV",
        "Exportar Excel",
        "Exportar PDF",
        "Plantillas financieras",
        "Documentos PDF"
      ]
    }
  ]
};

