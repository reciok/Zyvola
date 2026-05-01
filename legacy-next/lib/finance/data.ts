import { AssetItem, ChallengeItem, CollectionCard, GuideItem, MarketTickerItem, SimulatorLink } from "./types";

export const simulatorLinks: SimulatorLink[] = [
  {
    slug: "compound-interest",
    title: "Interes compuesto",
    description: "Calcula cuanto crece tu dinero con el tiempo."
  },
  {
    slug: "monthly-investment",
    title: "Aporte mensual",
    description: "Mide cuanto juntarias aportando cada mes."
  },
  {
    slug: "inflation",
    title: "Inflacion",
    description: "Mide cuanto valor pierde tu dinero con los anos."
  },
  {
    slug: "mortgage",
    title: "Hipoteca",
    description: "Compara cuota mensual, interes total y anos de pago."
  },
  {
    slug: "opportunity-cost",
    title: "Si no inviertes",
    description: "Mira cuanto dejas de ganar por esperar."
  },
  {
    slug: "fire",
    title: "Meta FIRE",
    description: "Calcula en cuantos anos podrias vivir de tu ahorro."
  }
];

export const financeCollections: CollectionCard[] = [
  {
    id: "fundamentos",
    title: "Fundamentos financieros",
    icon: "PF",
    description: "Conceptos base para entender dinero, interes, riesgo y horizonte.",
    relatedSimulators: ["compound-interest", "inflation"]
  },
  {
    id: "largo-plazo",
    title: "Inversion a largo plazo",
    icon: "LP",
    description: "Disciplina, aportes recurrentes y vision multianual.",
    relatedSimulators: ["monthly-investment", "fire"]
  },
  {
    id: "personales",
    title: "Finanzas personales",
    icon: "FP",
    description: "Presupuesto, ahorro, deuda e intensidad de gasto.",
    relatedSimulators: ["mortgage", "opportunity-cost"]
  },
  {
    id: "mercados",
    title: "Mercados y activos",
    icon: "MA",
    description: "Como se posiciona cada activo dentro de una cartera modular.",
    relatedSimulators: ["inflation", "compound-interest"]
  }
];

export const financeChallenges: ChallengeItem[] = [
  {
    id: "save-30",
    title: "Ahorra 1 EUR al dia durante 30 dias",
    description: "Construye una base de disciplina financiera diaria.",
    progress: 42,
    status: "in-progress",
    reward: "Insignia: Constancia"
  },
  {
    id: "three-sims",
    title: "Completa 3 simulaciones esta semana",
    description: "Practica con escenarios reales y compara decisiones.",
    progress: 66,
    status: "in-progress",
    reward: "Insignia: Explorador"
  },
  {
    id: "learn-five",
    title: "Aprende 5 conceptos financieros",
    description: "Revisa mini-guias y conecta teoria con simulacion.",
    progress: 100,
    status: "completed",
    reward: "Insignia: Base financiera"
  }
];

export const financeGuides: GuideItem[] = [
  {
    id: "compound-guide",
    title: "Que es el interes compuesto",
    bullets: [
      "Ganas interes sobre el capital y sobre intereses previos.",
      "El tiempo es tan importante como la tasa.",
      "Aportar de forma regular acelera el efecto compuesto."
    ],
    chartLabel: "Crecimiento Exponencial",
    ctaSimulator: "compound-interest"
  },
  {
    id: "inflation-guide",
    title: "Que es la inflacion",
    bullets: [
      "La inflacion reduce el valor real del dinero.",
      "Si tus retornos no superan la inflacion, pierdes poder de compra.",
      "Comparar escenarios nominales vs reales evita sesgos."
    ],
    chartLabel: "Valor Real Decreciente",
    ctaSimulator: "inflation"
  },
  {
    id: "etf-guide",
    title: "Que es un ETF",
    bullets: [
      "Un ETF replica un indice o estrategia.",
      "Permite diversificacion con una sola posicion.",
      "Suele tener costes bajos frente a gestion activa tradicional."
    ],
    chartLabel: "Diversificacion por Cesta",
    ctaSimulator: "monthly-investment"
  },
  {
    id: "bond-guide",
    title: "Que es un bono",
    bullets: [
      "Es deuda emitida por gobierno o empresa.",
      "Paga cupon y devuelve principal al vencimiento.",
      "Aporta estabilidad relativa en carteras mixtas."
    ],
    chartLabel: "Flujo de Cupones",
    ctaSimulator: "opportunity-cost"
  },
  {
    id: "diversification-guide",
    title: "Que es la diversificacion",
    bullets: [
      "Reparte riesgo entre activos distintos.",
      "Reduce dependencia de una sola tesis.",
      "No elimina riesgo, pero mejora resiliencia."
    ],
    chartLabel: "Riesgo Distribuido",
    ctaSimulator: "fire"
  },
  {
    id: "risk-vol-guide",
    title: "Riesgo vs volatilidad",
    bullets: [
      "Volatilidad es movimiento de precio.",
      "Riesgo es no cumplir tu objetivo financiero.",
      "Gestionar horizonte y liquidez reduce errores."
    ],
    chartLabel: "Ruido vs Objetivo",
    ctaSimulator: "mortgage"
  }
];

export const assetsData: AssetItem[] = [
  {
    id: "sp500-etf",
    name: "ETF S&P 500",
    category: "ETF",
    whyExists: "Permitir exposicion amplia al mercado de EE.UU. con un solo vehiculo.",
    risks: "Riesgo de mercado y caidas prolongadas en renta variable.",
    portfolioUse: "Nucleo de crecimiento diversificado a largo plazo.",
    relatedSimulators: ["monthly-investment", "compound-interest"]
  },
  {
    id: "apple-stock",
    name: "Accion iconica: Apple",
    category: "Acción",
    whyExists: "Participar en crecimiento de una empresa lider en tecnologia.",
    risks: "Riesgo especifico de empresa y valoracion exigente.",
    portfolioUse: "Exposicion satelite dentro de cartera diversificada.",
    relatedSimulators: ["opportunity-cost", "compound-interest"]
  },
  {
    id: "gov-bond",
    name: "Bono soberano",
    category: "Bono",
    whyExists: "Financiar gasto publico con pagos de cupon predecibles.",
    risks: "Riesgo de tipos y perdida de valor real por inflacion.",
    portfolioUse: "Capa defensiva y de estabilidad.",
    relatedSimulators: ["inflation", "mortgage"]
  },
  {
    id: "gold",
    name: "Oro",
    category: "Materia Prima",
    whyExists: "Reserva historica de valor en escenarios inciertos.",
    risks: "No genera flujo y puede tener largos periodos laterales.",
    portfolioUse: "Cobertura parcial frente a estres de mercado.",
    relatedSimulators: ["inflation", "fire"]
  },
  {
    id: "btc",
    name: "Bitcoin (educativo)",
    category: "Cripto",
    whyExists: "Activo digital escaso con red descentralizada.",
    risks: "Alta volatilidad y riesgos regulatorios/operativos.",
    portfolioUse: "Asignacion pequena y controlada en perfil agresivo.",
    relatedSimulators: ["opportunity-cost", "compound-interest"]
  }
];

export const marketTickerData: MarketTickerItem[] = [
  {
    symbol: "SPY",
    name: "S&P 500 ETF",
    price: 543.82,
    changePct: 0.74,
    dayRange: [538.44, 545.17],
    sparkline: [534, 535, 536, 535, 537, 539, 541, 540, 542, 544]
  },
  {
    symbol: "QQQ",
    name: "Nasdaq 100 ETF",
    price: 462.11,
    changePct: 1.12,
    dayRange: [455.73, 463.08],
    sparkline: [448, 449, 451, 452, 453, 454, 456, 458, 460, 462]
  },
  {
    symbol: "TLT",
    name: "US 20Y Bonds",
    price: 92.46,
    changePct: -0.58,
    dayRange: [91.8, 93.12],
    sparkline: [94, 93.8, 93.7, 93.4, 93.2, 93.1, 92.9, 92.7, 92.5, 92.46]
  },
  {
    symbol: "GLD",
    name: "Gold ETF",
    price: 229.63,
    changePct: 0.31,
    dayRange: [228.9, 230.2],
    sparkline: [226, 226.8, 227.2, 227.9, 228.4, 228.1, 228.8, 229.1, 229.4, 229.63]
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: 68420,
    changePct: 2.84,
    dayRange: [65890, 68820],
    sparkline: [63400, 64000, 64600, 65200, 64900, 65800, 66500, 67300, 67900, 68420]
  }
];
