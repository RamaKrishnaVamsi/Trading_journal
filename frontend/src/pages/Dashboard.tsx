import { useEffect, useState } from "react";
import { AnalyticsAPI, DashboardStats } from "../api/client";
import StatCard from "../components/StatCard";
import { formatMoney } from "../utils/calculations";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AnalyticsAPI.dashboard()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading…</p>;
  if (error)
    return (
      <div className="card">
        <p>Couldn't reach the API ({error}). Make sure the backend server is running on port 5000.</p>
      </div>
    );
  if (!stats) return null;

  const tone = (n: number) => (n > 0 ? "pos" : n < 0 ? "neg" : "neutral");

  return (
    <div>
      <h2 className="page-title">Dashboard</h2>
      <div className="stat-grid">
        <StatCard label="Today's P&L" value={formatMoney(stats.todayPnl)} tone={tone(stats.todayPnl)} />
        <StatCard label="This Week's P&L" value={formatMoney(stats.weekPnl)} tone={tone(stats.weekPnl)} />
        <StatCard label="This Month's P&L" value={formatMoney(stats.monthPnl)} tone={tone(stats.monthPnl)} />
        <StatCard label="Total Trades" value={`${stats.totalTrades}`} />
        <StatCard label="Win Rate" value={`${stats.winRate}%`} />
        <StatCard label="Average Profit" value={formatMoney(stats.avgProfit)} tone="pos" />
        <StatCard label="Average Loss" value={formatMoney(stats.avgLoss)} tone="neg" />
        <StatCard
          label="Profit Factor"
          value={stats.profitFactor === null ? "∞" : `${stats.profitFactor}`}
        />
        <StatCard label="Average R:R" value={`${stats.avgRR}R`} />
        <StatCard
          label="Current Streak"
          value={
            stats.streak.type
              ? `${stats.streak.count} ${stats.streak.type === "WIN" ? "Wins 🔥" : "Losses ⚠️"}`
              : "—"
          }
          tone={stats.streak.type === "WIN" ? "pos" : stats.streak.type === "LOSS" ? "neg" : "neutral"}
        />
      </div>
      {stats.totalTrades === 0 && (
        <div className="card">
          <p>No trades logged yet. Head to <b>Add Trade</b> to record your first one.</p>
        </div>
      )}
    </div>
  );
}
