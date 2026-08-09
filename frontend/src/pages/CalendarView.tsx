import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TradeAPI } from "../api/client";
import { formatMoney } from "../utils/calculations";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CalendarView() {
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12
  const [days, setDays] = useState<Record<string, { netPnl: number; trades: number; status: string }>>({});

  useEffect(() => {
    TradeAPI.calendar(year, month).then((res) => setDays(res.days));
  }, [year, month]);

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y);
  }

  const firstOfMonth = new Date(year, month - 1, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      <h2 className="page-title">Calendar</h2>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button className="btn secondary" onClick={() => shiftMonth(-1)}>← Prev</button>
          <b>{MONTH_NAMES[month - 1]} {year}</b>
          <button className="btn secondary" onClick={() => shiftMonth(1)}>Next →</button>
        </div>

        <div className="calendar-grid" style={{ marginBottom: 6 }}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} style={{ fontSize: 11, color: "var(--text-dim)", textAlign: "center" }}>{d}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {cells.map((day, idx) => {
            if (day === null) return <div key={idx} className="cal-cell empty" />;
            const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const info = days[key];
            const status = info ? info.status : "none";
            return (
              <div
                key={idx}
                className={`cal-cell ${status}`}
                onClick={() => info && navigate(`/history?date=${key}`)}
                title={info ? `${info.trades} trade(s)` : "No trades"}
              >
                <div className="cal-day-num">{day}</div>
                {info ? (
                  <>
                    <div className="cal-pnl" style={{ color: info.netPnl >= 0 ? "var(--green)" : "var(--red)" }}>
                      {info.netPnl >= 0 ? "🟢" : "🔴"} {formatMoney(info.netPnl)}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{info.trades} trade(s)</div>
                  </>
                ) : (
                  <div style={{ fontSize: 11, color: "var(--text-dim)" }}>⚪</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
