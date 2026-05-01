export type ChallengeStatus = "pending" | "in-progress" | "completed";

export interface SimulatorLink {
  slug: string;
  title: string;
  description: string;
}

export interface CollectionCard {
  id: string;
  title: string;
  icon: string;
  description: string;
  relatedSimulators: string[];
}

export interface ChallengeItem {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: ChallengeStatus;
  reward: string;
}

export interface GuideItem {
  id: string;
  title: string;
  bullets: string[];
  chartLabel: string;
  ctaSimulator: string;
}

export interface AssetItem {
  id: string;
  name: string;
  category: "ETF" | "Acción" | "Bono" | "Materia Prima" | "Cripto";
  whyExists: string;
  risks: string;
  portfolioUse: string;
  relatedSimulators: string[];
}

export interface ActivityItem {
  id: string;
  message: string;
  date: string;
}

export interface MarketTickerItem {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  dayRange: [number, number];
  sparkline: number[];
}
