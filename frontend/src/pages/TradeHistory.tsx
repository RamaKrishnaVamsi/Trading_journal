import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TradeAPI } from "../api/client";
import { Trade } from "../types/trade";
import { formatMoney } from "../utils/calculations";

export default function TradeHistory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date") || "";
  const [trades, setTrades] = useState<Trade[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    q: "",
    side: "",
    result: "",
    setup: "",
    from: dateParam,
    to: dateParam,
  });

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    TradeAPI.list(params)
      .then((res) => {
        setTrades(res.trades);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div>
      <h2 className="page-title">Trade History</h2>

      <div className="filters-row">
        <input
          placeholder="Search stock…"
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
        />
        <select value={filters.side} onChange={(e) => setFilters({ ...filters, side: e.target.value })}>
          <option value="">Long/Short</option>
          <option value="LONG">Long</option>
          <option value="SHORT">Short</option>
        </select>
        <select value={filters.result} onChange={(e) => setFilters({ ...filters, result: e.target.value })}>
          <option value="">Win/Loss</option>
          <option value="WIN">Win</option>
          <option value="LOSS">Loss</option>
          <option value="BE">Break-even</option>
        </select>
        <input
          placeholder="Setup…"
          value={filters.setup}
          onChange={(e) => setFilters({ ...filters, setup: e.target.value })}
        />
        <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
      </div>

      <div className="card">
        {loading ? (
          <p>Loading…</p>
        ) : trades.length === 0 ? (
          <p>No trades match these filters.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Stock</th>
                <th>Side</th>
                <th>Setup</th>
                <th>Qty</th>
                <th>Entry</th>
                <th>Exit</th>
                <th>Net P&L</th>
                <th>R</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={t._id} onClick={() => navigate(`/trade/${t._id}`)}>
                  <td>{t.date.slice(0, 10)}</td>
                  <td>{t.stock}</td>
                  <td>{t.side}</td>
                  <td>{t.setup || "—"}</td>
                  <td>{t.quantity}</td>
                  <td>{t.entryPrice}</td>
                  <td>{t.exitPrice}</td>
                  <td style={{ color: t.netPnl >= 0 ? "var(--green)" : "var(--red)" }}>
                    {formatMoney(t.netPnl)}
                  </td>
                  <td>{t.rMultiple !== null ? `${t.rMultiple}R` : "—"}</td>
                  <td>
                    <span className={`badge ${t.result.toLowerCase()}`}>{t.result}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p style={{ color: "var(--text-dim)", fontSize: 13 }}>{total} trade(s) total</p>
    </div>
  );
}
