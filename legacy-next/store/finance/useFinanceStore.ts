"use client";

import { create } from "zustand";
import { financeChallenges } from "@/lib/finance/data";
import { ActivityItem, ChallengeItem } from "@/lib/finance/types";
import { financialLevel } from "@/lib/finance/utils";

interface FinanceState {
  userProgress: number;
  simulationsCompleted: number;
  activeChallenges: ChallengeItem[];
  completedChallenges: ChallengeItem[];
  learnedConcepts: string[];
  financialScore: number;
  financialLevel: string;
  activityHistory: ActivityItem[];
  markConceptLearned: (concept: string) => void;
  completeSimulation: (simulator: string) => void;
  completeChallenge: (challengeId: string) => void;
}

const initialCompleted = financeChallenges.filter((c) => c.status === "completed");
const initialActive = financeChallenges.filter((c) => c.status !== "completed");

export const useFinanceStore = create<FinanceState>((set, get) => ({
  userProgress: 48,
  simulationsCompleted: 7,
  activeChallenges: initialActive,
  completedChallenges: initialCompleted,
  learnedConcepts: ["Interes compuesto", "Inflacion", "Diversificacion"],
  financialScore: 61,
  financialLevel: financialLevel(61),
  activityHistory: [
    { id: "a1", message: "Completaste la simulacion de hipoteca", date: "Hoy" },
    { id: "a2", message: "Lograste la insignia Base financiera", date: "Ayer" }
  ],
  markConceptLearned: (concept) => {
    const current = get().learnedConcepts;
    if (current.includes(concept)) return;
    const nextConcepts = [...current, concept];
    const nextScore = Math.min(get().financialScore + 3, 100);
    set({
      learnedConcepts: nextConcepts,
      financialScore: nextScore,
      financialLevel: financialLevel(nextScore),
      userProgress: Math.min(get().userProgress + 2, 100)
    });
  },
  completeSimulation: (simulator) => {
    const nextScore = Math.min(get().financialScore + 2, 100);
    set({
      simulationsCompleted: get().simulationsCompleted + 1,
      financialScore: nextScore,
      financialLevel: financialLevel(nextScore),
      userProgress: Math.min(get().userProgress + 1, 100),
      activityHistory: [
        { id: crypto.randomUUID(), message: `Simulacion completada: ${simulator}`, date: "Hoy" },
        ...get().activityHistory
      ].slice(0, 8)
    });
  },
  completeChallenge: (challengeId) => {
    const active = get().activeChallenges;
    const target = active.find((c) => c.id === challengeId);
    if (!target) return;

    const nextScore = Math.min(get().financialScore + 8, 100);
    set({
      activeChallenges: active.filter((c) => c.id !== challengeId),
      completedChallenges: [...get().completedChallenges, { ...target, status: "completed", progress: 100 }],
      financialScore: nextScore,
      financialLevel: financialLevel(nextScore),
      userProgress: Math.min(get().userProgress + 6, 100),
      activityHistory: [
        { id: crypto.randomUUID(), message: `Reto completado: ${target.title}`, date: "Hoy" },
        ...get().activityHistory
      ].slice(0, 8)
    });
  }
}));
