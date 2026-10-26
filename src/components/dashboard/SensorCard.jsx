export default function SensorCard({ title, value, subtitle, isLast = false }) {
  return (
    <div
      style={{
        borderBottom: isLast ? "none" : "1px solid #E5E7EB",
        paddingBottom: isLast ? 0 : "10px",
        marginBottom: isLast ? 0 : "10px",
        fontSize: "15px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontWeight: "bold",
        }}
      >
        <span>{title}</span>
        <span style={{ color: "#0D9488" }}>{value}</span>
      </div>
      <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "2px" }}>
        {subtitle}
      </div>
    </div>
  );
}
