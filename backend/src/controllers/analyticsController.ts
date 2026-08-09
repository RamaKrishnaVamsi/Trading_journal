import { Request, Response } from "express";
import Trade, { ITrade } from "../models/Trade";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 = Sun
  const diff = (day + 6) % 7; // Monday-start week
  x.setDate(x.getDate() - diff);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function sumPnl(trades: ITrade[]) {
  return Math.round(trades.reduce((s, t) => s + t.netPnl, 0) * 100) / 100;
}

// GET /api/analytics/dashboard
export async function getDashboard(_req: Request, res: Response) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const allTrades = await Trade.find().sort({ date: -1, entryTime: -1 });

  const todayTrades = allTrades.filter((t) => t.date >= todayStart);
  const weekTrades = allTrades.filter((t) => t.date >= weekStart);
  const monthTrades = allTrades.filter((t) => t.date >= monthStart);

  const wins = allTrades.filter((t) => t.result === "WIN");
  const losses = allTrades.filter((t) => t.result === "LOSS");

  const winRate = allTrades.length ? (wins.length / allTrades.length) * 100 : 0;
  const avgProfit = wins.length ? sumPnl(wins) / wins.length : 0;
  const avgLoss = losses.length ? sumPnl(losses) / losses.length : 0; // negative number

  const grossProfit = sumPnl(wins);
  const grossLoss = Math.abs(sumPnl(losses));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  const rMultiples = allTrades.map((t) => t.rMultiple).filter((r): r is number => r !== null && r !== undefined);
  const avgRR = rMultiples.length ? rMultiples.reduce((a, b) => a + b, 0) / rMultiples.length : 0;

  // current streak: walk from most-recent trade, count consecutive same-direction results (WIN vs not-WIN)
  let streakType: "WIN" | "LOSS" | null = null;
  let streakCount = 0;
  for (const t of allTrades) {
    if (t.result === "BE") break;
    if (streakType === null) {
      streakType = t.result as "WIN" | "LOSS";
      streakCount = 1;
    } else if (t.result === streakType) {
      streakCount++;
    } else {
      break;
    }
  }

  res.json({
    todayPnl: sumPnl(todayTrades),
    weekPnl: sumPnl(weekTrades),
    monthPnl: sumPnl(monthTrades),
    totalTrades: allTrades.length,
    winRate: round2(winRate),
    avgProfit: round2(avgProfit),
    avgLoss: round2(avgLoss),
    profitFactor: profitFactor === Infinity ? null : round2(profitFactor),
    avgRR: round2(avgRR),
    streak: { type: streakType, count: streakCount },
  });
}

// GET /api/analytics/performance
export async function getPerformance(_req: Request, res: Response) {
  const trades = await Trade.find();

  const byStock = groupBy(trades, (t) => t.stock);
  const bySetup = groupBy(trades, (t) => t.setup || "Unspecified");
  const bySide = groupBy(trades, (t) => t.side);
  const byHour = groupBy(trades, (t) => (t.entryTime ? t.entryTime.split(":")[0] + ":00" : "Unknown"));

  const wins = trades.filter((t) => t.result === "WIN");
  const losses = trades.filter((t) => t.result === "LOSS");
  const avgWin = wins.length ? sumPnl(wins) / wins.length : 0;
  const avgLoss = losses.length ? sumPnl(losses) / losses.length : 0;

  // Mistake tally from psychology flags
  const mistakeCounters = {
    movedSL: 0,
    overtraded: 0,
    chasedEntry: 0,
    didNotFollowPlan: 0,
  };
  let lossFromMistakes = 0;
  for (const t of trades) {
    const p = t.psychology;
    if (!p) continue;
    const hadMistake = p.movedSL || p.overtraded || p.chasedEntry || !p.followedPlan;
    if (p.movedSL) mistakeCounters.movedSL++;
    if (p.overtraded) mistakeCounters.overtraded++;
    if (p.chasedEntry) mistakeCounters.chasedEntry++;
    if (!p.followedPlan) mistakeCounters.didNotFollowPlan++;
    if (hadMistake && t.netPnl < 0) lossFromMistakes += t.netPnl;
  }
  const mistakeEntries = Object.entries(mistakeCounters).sort((a, b) => b[1] - a[1]);
  const biggestMistake = mistakeEntries[0] && mistakeEntries[0][1] > 0 ? mistakeEntries[0][0] : null;

  res.json({
    byStock: summarizeGroups(byStock),
    bySetup: summarizeGroups(bySetup),
    bySide: summarizeGroups(bySide),
    byHour: summarizeGroups(byHour),
    avgWin: round2(avgWin),
    avgLoss: round2(avgLoss),
    biggestMistake,
    mistakeCounts: mistakeCounters,
    tradesWithMistakes: trades.filter(
      (t) => t.psychology && (t.psychology.movedSL || t.psychology.overtraded || t.psychology.chasedEntry || !t.psychology.followedPlan)
    ).length,
    totalTrades: trades.length,
    moneyLostToMistakes: round2(lossFromMistakes),
  });
}

function groupBy<T>(arr: T[], keyFn: (t: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const key = keyFn(item);
    (acc[key] = acc[key] || []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

function summarizeGroups(groups: Record<string, ITrade[]>) {
  return Object.entries(groups)
    .map(([key, trades]) => {
      const wins = trades.filter((t) => t.result === "WIN").length;
      return {
        key,
        trades: trades.length,
        netPnl: sumPnl(trades),
        winRate: round2((wins / trades.length) * 100),
      };
    })
    .sort((a, b) => b.netPnl - a.netPnl);
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
