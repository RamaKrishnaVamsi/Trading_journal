import { NavLink, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AddTrade from "./pages/AddTrade";
import TradeHistory from "./pages/TradeHistory";
import TradeDetail from "./pages/TradeDetail";
import CalendarView from "./pages/CalendarView";
import Analytics from "./pages/Analytics";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/add", label: "Add Trade" },
  { to: "/history", label: "Trade History" },
  { to: "/calendar", label: "Calendar" },
  { to: "/analytics", label: "Analytics" },
];

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>📓 Trading Journal</h1>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
          >
            {l.label}
          </NavLink>
        ))}
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<AddTrade />} />
          <Route path="/history" element={<TradeHistory />} />
          <Route path="/trade/:id" element={<TradeDetail />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </main>
    </div>
  );
}
