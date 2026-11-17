export default function StabilityTooltip({ point }) {
  if (!point) return null;

  const isAlert = point.event !== null;

  return (
    <div
      style={{
        marginTop: "16px",
        padding: "16px 20px",
        backgroundColor: isAlert ? "#FEF2F2" : "#F0FDF4",
        borderRadius: "12px",
        borderLeft: `6px solid ${isAlert ? "#EF4444" : "#10B981"}`,
        fontSize: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <strong style={{ fontSize: "18px", color: "#111827" }}>
          Hora: {point.time} — {point.label} ({point.stability}% Estabilidad)
        </strong>
      </div>

      <p style={{ margin: "0 0 10px 0", color: "#1F2937", lineHeight: "1.6" }}>
        {point.detail}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
          borderTop: "1.5px solid #E5E7EB",
          paddingTop: "10px",
          fontSize: "14px",
          color: "#374151",
        }}
      >
        <div>
          Inclinación Torso: <strong>{point.tilt}°</strong>
        </div>
        <div>
          Presión Plantar: <strong>{point.fsr} N</strong>
        </div>
        <div>
          Cadencia: <strong>{point.cadencia || 0} pasos/min</strong>
        </div>
      </div>
    </div>
  );
}
