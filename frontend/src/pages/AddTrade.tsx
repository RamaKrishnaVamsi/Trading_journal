import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TradeAPI } from "../api/client";
import { computeTradeMetrics, formatMinutes, formatMoney } from "../utils/calculations";
import { Emotion, EMOTIONS, TradeSide } from "../types/trade";

const SETUPS = ["Breakout", "Pullback", "Reversal", "Trend Following", "Range", "Gap Fill", "Other"];

export default function AddTrade() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    stock: "",
    side: "LONG" as TradeSide,
    entryPrice: "",
    exitPrice: "",
    quantity: "",
    stopLoss: "",
    target: "",
    entryTime: "",
    exitTime: "",
    charges: "0",
    setup: SETUPS[0],
    reasonEntry: "",
    reasonExit: "",
  });

  const [notes, setNotes] = useState({
    whyEnter: "",
    whatHappened: "",
    whyExit: "",
    whatRight: "",
    whatWrong: "",
    nextTime: "",
  });

  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [flags, setFlags] = useState({
    followedPlan: true,
    movedSL: false,
    overtraded: false,
    chasedEntry: false,
  });

  const preview = useMemo(
    () =>
      computeTradeMetrics({
        side: form.side,
        entryPrice: parseFloat(form.entryPrice) || 0,
        exitPrice: parseFloat(form.exitPrice) || 0,
        quantity: parseFloat(form.quantity) || 0,
        stopLoss: form.stopLoss ? parseFloat(form.stopLoss) : undefined,
        charges: parseFloat(form.charges) || 0,
        date: form.date,
        entryTime: form.entryTime || undefined,
        exitTime: form.exitTime || undefined,
      }),
    [form]
  );

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleEmotion(e: Emotion) {
    setEmotions((cur) => (cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]));
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    setErr(null);

    if (!form.stock || !form.entryPrice || !form.exitPrice || !form.quantity) {
      setErr("Stock, entry price, exit price and quantity are required.");
      return;
    }

    setSaving(true);
    try {
      const trade = await TradeAPI.create({
        date: form.date as any,
        stock: form.stock.toUpperCase(),
        side: form.side,
        entryPrice: parseFloat(form.entryPrice),
        exitPrice: parseFloat(form.exitPrice),
        quantity: parseFloat(form.quantity),
        stopLoss: form.stopLoss ? (parseFloat(form.stopLoss) as any) : undefined,
        target: form.target ? (parseFloat(form.target) as any) : undefined,
        entryTime: form.entryTime || undefined,
        exitTime: form.exitTime || undefined,
        charges: parseFloat(form.charges) || 0,
        setup: form.setup,
        reasonEntry: form.reasonEntry,
        reasonExit: form.reasonExit,
        notes,
        psychology: { emotions, ...flags },
      } as any);
      navigate(`/trade/${trade._id}`);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="page-title">Add Trade</h2>
      <form onSubmit={handleSubmit}>
        <div className="card">
          <p className="section-title">Trade Details</p>
          <div className="form-grid">
            <div className="field">
              <label>Date</label>
              <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </div>
            <div className="field">
              <label>Stock</label>
              <input placeholder="e.g. RELIANCE" value={form.stock} onChange={(e) => set("stock", e.target.value)} />
            </div>
            <div className="field">
              <label>Direction</label>
              <select value={form.side} onChange={(e) => set("side", e.target.value as TradeSide)}>
                <option value="LONG">Long (Buy)</option>
                <option value="SHORT">Short (Sell)</option>
              </select>
            </div>
            <div className="field">
              <label>Entry Price</label>
              <input type="number" step="0.01" value={form.entryPrice} onChange={(e) => set("entryPrice", e.target.value)} />
            </div>
            <div className="field">
              <label>Exit Price</label>
              <input type="number" step="0.01" value={form.exitPrice} onChange={(e) => set("exitPrice", e.target.value)} />
            </div>
            <div className="field">
              <label>Quantity</label>
              <input type="number" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
            </div>
            <div className="field">
              <label>Stop Loss</label>
              <input type="number" step="0.01" value={form.stopLoss} onChange={(e) => set("stopLoss", e.target.value)} />
            </div>
            <div className="field">
              <label>Target</label>
              <input type="number" step="0.01" value={form.target} onChange={(e) => set("target", e.target.value)} />
            </div>
            <div className="field">
              <label>Brokerage / Charges</label>
              <input type="number" step="0.01" value={form.charges} onChange={(e) => set("charges", e.target.value)} />
            </div>
            <div className="field">
              <label>Entry Time</label>
              <input type="time" value={form.entryTime} onChange={(e) => set("entryTime", e.target.value)} />
            </div>
            <div className="field">
              <label>Exit Time</label>
              <input type="time" value={form.exitTime} onChange={(e) => set("exitTime", e.target.value)} />
            </div>
            <div className="field">
              <label>Setup / Strategy</label>
              <select value={form.setup} onChange={(e) => set("setup", e.target.value)}>
                {SETUPS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-grid two" style={{ marginTop: 14 }}>
            <div className="field">
              <label>Reason for Entry</label>
              <textarea value={form.reasonEntry} onChange={(e) => set("reasonEntry", e.target.value)} />
            </div>
            <div className="field">
              <label>Reason for Exit</label>
              <textarea value={form.reasonExit} onChange={(e) => set("reasonExit", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card">
          <p className="section-title">Auto-Calculated</p>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="label">Net P&L</div>
              <div className={`value ${preview.netPnl >= 0 ? "pos" : "neg"}`}>{formatMoney(preview.netPnl)}</div>
            </div>
            <div className="stat-card">
              <div className="label">% Return</div>
              <div className={`value ${preview.pctReturn >= 0 ? "pos" : "neg"}`}>{preview.pctReturn}%</div>
            </div>
            <div className="stat-card">
              <div className="label">Risk Amount</div>
              <div className="value">{formatMoney(preview.riskAmount)}</div>
            </div>
            <div className="stat-card">
              <div className="label">R-Multiple</div>
              <div className="value">{preview.rMultiple !== null ? `${preview.rMultiple}R` : "—"}</div>
            </div>
            <div className="stat-card">
              <div className="label">Holding Time</div>
              <div className="value">{formatMinutes(preview.holdingTimeMinutes)}</div>
            </div>
            <div className="stat-card">
              <div className="label">Result</div>
              <div className="value">
                {preview.netPnl > 0.5 ? "WIN" : preview.netPnl < -0.5 ? "LOSS" : "BE"}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <p className="section-title">Trade Notes</p>
          <div className="form-grid two">
            <div className="field">
              <label>Why did I enter?</label>
              <textarea value={notes.whyEnter} onChange={(e) => setNotes({ ...notes, whyEnter: e.target.value })} />
            </div>
            <div className="field">
              <label>What happened?</label>
              <textarea value={notes.whatHappened} onChange={(e) => setNotes({ ...notes, whatHappened: e.target.value })} />
            </div>
            <div className="field">
              <label>Why did I exit?</label>
              <textarea value={notes.whyExit} onChange={(e) => setNotes({ ...notes, whyExit: e.target.value })} />
            </div>
            <div className="field">
              <label>What did I do correctly?</label>
              <textarea value={notes.whatRight} onChange={(e) => setNotes({ ...notes, whatRight: e.target.value })} />
            </div>
            <div className="field">
              <label>What did I do wrong?</label>
              <textarea value={notes.whatWrong} onChange={(e) => setNotes({ ...notes, whatWrong: e.target.value })} />
            </div>
            <div className="field">
              <label>What will I do differently next time?</label>
              <textarea value={notes.nextTime} onChange={(e) => setNotes({ ...notes, nextTime: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="card">
          <p className="section-title">Psychology</p>
          <div className="pill-row">
            {EMOTIONS.map((e) => (
              <span key={e} className={`chip ${emotions.includes(e) ? "selected" : ""}`} onClick={() => toggleEmotion(e)}>
                {e}
              </span>
            ))}
          </div>
          <div className="toggle-row">
            {(
              [
                ["followedPlan", "Followed plan?"],
                ["movedSL", "Moved SL?"],
                ["overtraded", "Overtraded?"],
                ["chasedEntry", "Chased entry?"],
              ] as const
            ).map(([key, label]) => (
              <span
                key={key}
                className={`chip ${flags[key] ? "selected" : ""}`}
                onClick={() => setFlags({ ...flags, [key]: !flags[key] })}
              >
                {label} {flags[key] ? "✅" : "❌"}
              </span>
            ))}
          </div>
        </div>

        {err && <p style={{ color: "var(--red)" }}>{err}</p>}
        <button className="btn" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save Trade"}
        </button>
      </form>
    </div>
  );
}
