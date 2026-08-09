import { Request, Response } from "express";
import Trade from "../models/Trade";
import { computeTradeMetrics, deriveResult } from "../utils/calculations";

// POST /api/trades
export async function createTrade(req: Request, res: Response) {
  try {
    const body = req.body;
    const metrics = computeTradeMetrics({
      side: body.side,
      entryPrice: Number(body.entryPrice),
      exitPrice: Number(body.exitPrice),
      quantity: Number(body.quantity),
      stopLoss: body.stopLoss !== undefined && body.stopLoss !== "" ? Number(body.stopLoss) : undefined,
      charges: body.charges ? Number(body.charges) : 0,
      date: body.date,
      entryTime: body.entryTime,
      exitTime: body.exitTime,
    });

    const result = body.result || deriveResult(metrics.netPnl);

    const trade = await Trade.create({
      ...body,
      quantity: Number(body.quantity),
      entryPrice: Number(body.entryPrice),
      exitPrice: Number(body.exitPrice),
      stopLoss: body.stopLoss !== "" ? body.stopLoss : undefined,
      target: body.target !== "" ? body.target : undefined,
      charges: body.charges ? Number(body.charges) : 0,
      result,
      ...metrics,
    });

    res.status(201).json(trade);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

// PUT /api/trades/:id
export async function updateTrade(req: Request, res: Response) {
  try {
    const existing = await Trade.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Trade not found" });

    const merged = { ...existing.toObject(), ...req.body };

    const metrics = computeTradeMetrics({
      side: merged.side,
      entryPrice: Number(merged.entryPrice),
      exitPrice: Number(merged.exitPrice),
      quantity: Number(merged.quantity),
      stopLoss: merged.stopLoss !== undefined && merged.stopLoss !== "" ? Number(merged.stopLoss) : undefined,
      charges: merged.charges ? Number(merged.charges) : 0,
      date: merged.date,
      entryTime: merged.entryTime,
      exitTime: merged.exitTime,
    });

    const result = req.body.result || deriveResult(metrics.netPnl);

    Object.assign(existing, req.body, metrics, { result });
    await existing.save();

    res.json(existing);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

// DELETE /api/trades/:id
export async function deleteTrade(req: Request, res: Response) {
  const deleted = await Trade.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Trade not found" });
  res.json({ message: "Trade deleted" });
}

// GET /api/trades/:id
export async function getTrade(req: Request, res: Response) {
  const trade = await Trade.findById(req.params.id);
  if (!trade) return res.status(404).json({ message: "Trade not found" });
  res.json(trade);
}

// GET /api/trades  (filter/search/paginate)
export async function listTrades(req: Request, res: Response) {
  const {
    stock,
    side,
    result,
    setup,
    from,
    to,
    minPnl,
    maxPnl,
    q,
    page = "1",
    limit = "50",
    sort = "-date",
  } = req.query as Record<string, string>;

  const filter: Record<string, any> = {};
  if (stock) filter.stock = new RegExp(`^${stock}`, "i");
  if (side) filter.side = side;
  if (result) filter.result = result;
  if (setup) filter.setup = new RegExp(setup, "i");
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }
  if (minPnl || maxPnl) {
    filter.netPnl = {};
    if (minPnl) filter.netPnl.$gte = Number(minPnl);
    if (maxPnl) filter.netPnl.$lte = Number(maxPnl);
  }
  if (q) filter.stock = new RegExp(q, "i");

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));

  const [trades, total] = await Promise.all([
    Trade.find(filter)
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Trade.countDocuments(filter),
  ]);

  res.json({ trades, total, page: pageNum, pages: Math.ceil(total / limitNum) });
}

// GET /api/trades/calendar?year=2026&month=8
export async function getCalendar(req: Request, res: Response) {
  const year = parseInt((req.query.year as string) || `${new Date().getFullYear()}`, 10);
  const month = parseInt((req.query.month as string) || `${new Date().getMonth() + 1}`, 10); // 1-12

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const trades = await Trade.find({ date: { $gte: start, $lt: end } }).select(
    "date netPnl stock result"
  );

  const days: Record<string, { netPnl: number; trades: number; status: "profit" | "loss" | "none" }> = {};

  for (const t of trades) {
    const key = t.date.toISOString().slice(0, 10);
    if (!days[key]) days[key] = { netPnl: 0, trades: 0, status: "none" };
    days[key].netPnl += t.netPnl;
    days[key].trades += 1;
  }

  for (const key of Object.keys(days)) {
    days[key].netPnl = Math.round(days[key].netPnl * 100) / 100;
    days[key].status = days[key].netPnl > 0 ? "profit" : days[key].netPnl < 0 ? "loss" : "none";
  }

  res.json({ year, month, days });
}

// GET /api/trades/day/:date  (YYYY-MM-DD) -> all trades on that date
export async function getTradesForDay(req: Request, res: Response) {
  const date = req.params.date;
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(`${date}T23:59:59.999Z`);
  const trades = await Trade.find({ date: { $gte: start, $lte: end } }).sort("entryTime");
  res.json(trades);
}
