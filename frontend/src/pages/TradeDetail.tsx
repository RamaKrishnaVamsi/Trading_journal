import { ChangeEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TradeAPI } from "../api/client";
import { Trade } from "../types/trade";
import { formatMinutes, formatMoney } from "../utils/calculations";

const SLOTS: { key: "before" | "after" | "exit"; label: string }[] = [
  { key: "before", label: "Before Entry" },
  { key: "after", label: "After Entry" },
  { key: "exit", label: "Exit" },
];

export default function TradeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  function load() {
    if (!id) return;
    TradeAPI.get(id).then(setTrade);
  }

  useEffect(load, [id]);

  async function handleUpload(type: "before" | "after" | "exit", e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploading(type);
    try {
      await TradeAPI.uploadScreenshot(id, type, file);
      load();
    } finally {
      setUploading(null);
    }
  }

  async function handleDelete() {
    if (!id || !confirm("Delete this trade permanently?")) return;
    await TradeAPI.remove(id);
    navigate("/history");
  }

  if (!trade) return <p>Loading…</p>;

  return (
    <div>
      <h2 className="page-title">
        {trade.stock} · {trade.side} · {trade.date.slice(0, 10)}
      </h2>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Net P&L</div>
          <div className={`value ${trade.netPnl >= 0 ? "pos" : "neg"}`}>{formatMoney(trade.netPnl)}</div>
        </div>
        <div className="stat-card">
          <div className="label">% Return</div>
          <div className="value">{trade.pctReturn}%</div>
        </div>
        <div className="stat-card">
          <div className="label">R-Multiple</div>
          <div className="value">{trade.rMultiple !== null ? `${trade.rMultiple}R` : "—"}</div>
        </div>
        <div className="stat-card">
          <div className="label">Holding Time</div>
          <div className="value">{formatMinutes(trade.holdingTimeMinutes)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Result</div>
          <div className="value">
            <span className={`badge ${trade.result.toLowerCase()}`}>{trade.result}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <p className="section-title">Trade Details</p>
        <div className="two-col">
          <div>
            <p><b>Entry:</b> {trade.entryPrice} {trade.entryTime && `at ${trade.entryTime}`}</p>
            <p><b>Exit:</b> {trade.exitPrice} {trade.exitTime && `at ${trade.exitTime}`}</p>
            <p><b>Quantity:</b> {trade.quantity}</p>
            <p><b>Stop Loss:</b> {trade.stopLoss ?? "—"}</p>
            <p><b>Target:</b> {trade.target ?? "—"}</p>
          </div>
          <div>
            <p><b>Setup:</b> {trade.setup || "—"}</p>
            <p><b>Charges:</b> {formatMoney(trade.charges)}</p>
            <p><b>Reason for Entry:</b> {trade.reasonEntry || "—"}</p>
            <p><b>Reason for Exit:</b> {trade.reasonExit || "—"}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <p className="section-title">Screenshots</p>
        <div className="screenshot-grid">
          {SLOTS.map((s) => {
            const url = trade.screenshots?.[s.key];
            return (
              <label key={s.key} className="screenshot-slot" style={{ cursor: "pointer" }}>
                {url ? (
                  <img src={url} alt={s.label} />
                ) : (
                  <span className="placeholder">
                    {uploading === s.key ? "Uploading…" : `+ ${s.label}`}
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => handleUpload(s.key, e)}
                />
              </label>
            );
          })}
        </div>
      </div>

      <div className="card">
        <p className="section-title">Trade Notes</p>
        <p><b>Why did I enter?</b> {trade.notes?.whyEnter || "—"}</p>
        <p><b>What happened?</b> {trade.notes?.whatHappened || "—"}</p>
        <p><b>Why did I exit?</b> {trade.notes?.whyExit || "—"}</p>
        <p><b>What did I do correctly?</b> {trade.notes?.whatRight || "—"}</p>
        <p><b>What did I do wrong?</b> {trade.notes?.whatWrong || "—"}</p>
        <p><b>What will I do differently next time?</b> {trade.notes?.nextTime || "—"}</p>
      </div>

      <div className="card">
        <p className="section-title">Psychology</p>
        <div className="pill-row" style={{ marginBottom: 10 }}>
          {trade.psychology?.emotions?.length ? (
            trade.psychology.emotions.map((e) => (
              <span key={e} className="chip selected">{e}</span>
            ))
          ) : (
            <span style={{ color: "var(--text-dim)" }}>No emotions tagged</span>
          )}
        </div>
        <p>Followed plan? {trade.psychology?.followedPlan ? "✅" : "❌"}</p>
        <p>Moved SL? {trade.psychology?.movedSL ? "✅" : "❌"}</p>
        <p>Overtraded? {trade.psychology?.overtraded ? "✅" : "❌"}</p>
        <p>Chased entry? {trade.psychology?.chasedEntry ? "✅" : "❌"}</p>
      </div>

      <button className="btn danger" onClick={handleDelete}>Delete Trade</button>
    </div>
  );
}
