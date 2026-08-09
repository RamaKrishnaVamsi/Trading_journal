interface Props {
  label: string;
  value: string;
  tone?: "pos" | "neg" | "neutral";
}

export default function StatCard({ label, value, tone = "neutral" }: Props) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className={`value ${tone !== "neutral" ? tone : ""}`}>{value}</div>
    </div>
  );
}
