import { TradeSide } from "../types/trade";

interface CalcInput {
  side: TradeSide;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  stopLoss?: number;
  charges?: number;
  date: string | Date;
  entryTime?: string;
  exitTime?: string;
}

export interface CalcResult {
  grossPnl: number;
  netPnl: number;
  pctReturn: number;
  riskAmount: number;
  rMultiple: number | null;
  holdingTimeMinutes: number | null;
}

/**
 * Pure function — all trade math lives here so the frontend (for live preview)
 * and backend (for persisted/authoritative values) can share identical logic.
 */
export function computeTradeMetrics(input: CalcInput): CalcResult {
  const { side, entryPrice, exitPrice, quantity, stopLoss, charges = 0 } = input;

  const directionMultiplier = side === "LONG" ? 1 : -1;

  const grossPnl = (exitPrice - entryPrice) * quantity * directionMultiplier;
  const netPnl = grossPnl - charges;

  const capitalDeployed = entryPrice * quantity;
  const pctReturn = capitalDeployed !== 0 ? (grossPnl / capitalDeployed) * 100 : 0;

  let riskAmount = 0;
  let rMultiple: number | null = null;
  if (stopLoss !== undefined && stopLoss !== null && !Number.isNaN(stopLoss)) {
    riskAmount = (entryPrice - stopLoss) * quantity * directionMultiplier;
    riskAmount = Math.abs(riskAmount);
    rMultiple = riskAmount !== 0 ? netPnl / riskAmount : null;
  }

  let holdingTimeMinutes: number | null = null;
  if (input.entryTime && input.exitTime) {
    const dateStr =
      typeof input.date === "string" ? input.date.slice(0, 10) : input.date.toISOString().slice(0, 10);
    const entry = new Date(`${dateStr}T${input.entryTime}:00`);
    const exit = new Date(`${dateStr}T${input.exitTime}:00`);
    let diffMs = exit.getTime() - entry.getTime();
    if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000; // crossed midnight
    holdingTimeMinutes = Math.round(diffMs / 60000);
  }

  return {
    grossPnl: round2(grossPnl),
    netPnl: round2(netPnl),
    pctReturn: round2(pctReturn),
    riskAmount: round2(riskAmount),
    rMultiple: rMultiple !== null ? round2(rMultiple) : null,
    holdingTimeMinutes,
  };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function deriveResult(netPnl: number, beThreshold = 0.5): "WIN" | "LOSS" | "BE" {
  if (Math.abs(netPnl) <= beThreshold) return "BE";
  return netPnl > 0 ? "WIN" : "LOSS";
}
