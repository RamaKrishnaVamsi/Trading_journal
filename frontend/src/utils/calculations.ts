import { TradeSide } from "../types/trade";

export interface CalcPreviewInput {
  side: TradeSide;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  stopLoss?: number;
  charges?: number;
  date: string;
  entryTime?: string;
  exitTime?: string;
}

export interface CalcPreviewResult {
  grossPnl: number;
  netPnl: number;
  pctReturn: number;
  riskAmount: number;
  rMultiple: number | null;
  holdingTimeMinutes: number | null;
}

// Mirrors backend/src/utils/calculations.ts so Add-Trade shows a live preview
// before the record is even saved.
export function computeTradeMetrics(input: CalcPreviewInput): CalcPreviewResult {
  const { side, entryPrice, exitPrice, quantity, stopLoss, charges = 0 } = input;
  if (!entryPrice || !exitPrice || !quantity) {
    return { grossPnl: 0, netPnl: 0, pctReturn: 0, riskAmount: 0, rMultiple: null, holdingTimeMinutes: null };
  }

  const dir = side === "LONG" ? 1 : -1;
  const grossPnl = (exitPrice - entryPrice) * quantity * dir;
  const netPnl = grossPnl - charges;
  const capital = entryPrice * quantity;
  const pctReturn = capital !== 0 ? (grossPnl / capital) * 100 : 0;

  let riskAmount = 0;
  let rMultiple: number | null = null;
  if (stopLoss !== undefined && !Number.isNaN(stopLoss)) {
    riskAmount = Math.abs((entryPrice - stopLoss) * quantity * dir);
    rMultiple = riskAmount !== 0 ? netPnl / riskAmount : null;
  }

  let holdingTimeMinutes: number | null = null;
  if (input.entryTime && input.exitTime && input.date) {
    const entry = new Date(`${input.date}T${input.entryTime}:00`);
    const exit = new Date(`${input.date}T${input.exitTime}:00`);
    let diffMs = exit.getTime() - entry.getTime();
    if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
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

export function formatMoney(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatMinutes(m: number | null): string {
  if (m === null) return "—";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return `${h}h ${rem}m`;
}
