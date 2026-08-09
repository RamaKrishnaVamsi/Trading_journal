import axios from "axios";
import { Trade, TradeFormInput } from "../types/trade";

const api = axios.create({ baseURL: "/api" });

export interface ListTradesParams {
  stock?: string;
  side?: string;
  result?: string;
  setup?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface ListTradesResponse {
  trades: Trade[];
  total: number;
  page: number;
  pages: number;
}

export const TradeAPI = {
  list: (params: ListTradesParams = {}) =>
    api.get<ListTradesResponse>("/trades", { params }).then((r) => r.data),

  get: (id: string) => api.get<Trade>(`/trades/${id}`).then((r) => r.data),

  create: (data: Partial<TradeFormInput>) => api.post<Trade>("/trades", data).then((r) => r.data),

  update: (id: string, data: Partial<Trade>) =>
    api.put<Trade>(`/trades/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/trades/${id}`).then((r) => r.data),

  calendar: (year: number, month: number) =>
    api
      .get<{ year: number; month: number; days: Record<string, { netPnl: number; trades: number; status: string }> }>(
        "/trades/calendar",
        { params: { year, month } }
      )
      .then((r) => r.data),

  day: (date: string) => api.get<Trade[]>(`/trades/day/${date}`).then((r) => r.data),

  uploadScreenshot: (id: string, type: "before" | "after" | "exit", file: File) => {
    const form = new FormData();
    form.append("screenshot", file);
    return api
      .post<{ url: string }>(`/trades/${id}/screenshot`, form, {
        params: { type },
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};

export interface DashboardStats {
  todayPnl: number;
  weekPnl: number;
  monthPnl: number;
  totalTrades: number;
  winRate: number;
  avgProfit: number;
  avgLoss: number;
  profitFactor: number | null;
  avgRR: number;
  streak: { type: "WIN" | "LOSS" | null; count: number };
}

export interface PerformanceGroup {
  key: string;
  trades: number;
  netPnl: number;
  winRate: number;
}

export interface PerformanceStats {
  byStock: PerformanceGroup[];
  bySetup: PerformanceGroup[];
  bySide: PerformanceGroup[];
  byHour: PerformanceGroup[];
  avgWin: number;
  avgLoss: number;
  biggestMistake: string | null;
  mistakeCounts: Record<string, number>;
  tradesWithMistakes: number;
  totalTrades: number;
  moneyLostToMistakes: number;
}

export const AnalyticsAPI = {
  dashboard: () => api.get<DashboardStats>("/analytics/dashboard").then((r) => r.data),
  performance: () => api.get<PerformanceStats>("/analytics/performance").then((r) => r.data),
};

export default api;
