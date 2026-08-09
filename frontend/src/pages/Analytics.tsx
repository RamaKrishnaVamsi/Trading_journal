import { useEffect, useState } from "react";
import { AnalyticsAPI, PerformanceGroup, PerformanceStats } from "../api/client";
import { formatMoney } from "../utils/calculations";

function RankList({ title, groups, unit }: { title: string; groups: PerformanceGroup[]; unit?: string }) {
  return (
    <div className="card">
      <p className="section-title">{title}</p>
      <div className="rank-list">
        {groups.length === 0 && <p style={{ color: "var(--text-dim)" }}>No data yet</p>}
        {groups.map((g) => (
          <div key={g.key} className="rank-item">
            <span>{g.key}{unit ? ` ${unit}` : ""} <span style={{ color: "var(--text-dim)" }}>({g.trades} trades, {g.winRate}% win)</span></span>
            <b style={{ color: g.netPnl >= 0 ? "var(--green)" : "var(--red)" }}>{formatMoney(g.netPnl)}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState<PerformanceStats | null>(null);

  useEffect(() => {
    AnalyticsAPI.performance().then(setData);
  }, []);

  if (!data) return <p>Loading…</p>;

  const bestStock = data.byStock[0];
  const bestSetup = data.bySetup[0];
  const bestSide = [...data.bySide].sort((a, b) => b.netPnl - a.netPnl)[0];
  const bestHour = [...data.byHour].sort((a, b) => b.netPnl - a.netPnl)[0];

  return (
    <div>
      <h2 className="page-title">Performance Analytics</h2>

      <div className="card">
        <p className="section-title">Key Takeaways</p>
        <ul>
          <li>Best performing stock: <b>{bestStock ? bestStock.key : "—"}</b></li>
          <li>Most profitable setup: <b>{bestSetup ? bestSetup.key : "—"}</b></li>
          <li>Stronger direction: <b>{bestSide ? bestSide.key : "—"}</b></li>
          <li>Best time of day to trade: <b>{bestHour ? bestHour.key : "—"}</b></li>
          <li>Average winning trade: <b style={{ color: "var(--green)" }}>{formatMoney(data.avgWin)}</b></li>
          <li>Average losing trade: <b style={{ color: "var(--red)" }}>{formatMoney(data.avgLoss)}</b></li>
          <li>Biggest recurring mistake: <b>{data.biggestMistake || "None detected"}</b></li>
          <li>
            Trades with a rule break: <b>{data.tradesWithMistakes}</b> of {data.totalTrades} (
            {data.totalTrades ? Math.round((data.tradesWithMistakes / data.totalTrades) * 100) : 0}%)
          </li>
          <li>Money lost to mistake-tagged trades: <b style={{ color: "var(--red)" }}>{formatMoney(data.moneyLostToMistakes)}</b></li>
        </ul>
      </div>

      <div className="two-col">
        <RankList title="By Stock" groups={data.byStock} />
        <RankList title="By Setup / Strategy" groups={data.bySetup} />
      </div>
      <div className="two-col">
        <RankList title="Long vs Short" groups={data.bySide} />
        <RankList title="By Entry Hour" groups={data.byHour} />
      </div>

      <div className="card">
        <p className="section-title">Rule-Break Frequency</p>
        <div className="rank-list">
          {Object.entries(data.mistakeCounts).map(([k, v]) => (
            <div key={k} className="rank-item">
              <span>{k}</span>
              <b>{v}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
