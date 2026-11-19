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
          Hora: {point.time} — Estabilidad: {point.stability}%
        </strong>
      </div>

      {/* Solo mostramos el texto del evento si es una alerta real */}
      {isAlert && (
        <p
          style={{ margin: "0 0 10px 0", color: "#B91C1C", fontWeight: "600" }}
        >
          ⚠️ {point.event}
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          borderTop: "1.5px solid #E5E7EB",
          paddingTop: "10px",
          fontSize: "14px",
          color: "#374151",
        }}
      >
        <div>
          Inclinación: <strong>{point.tilt}°</strong>
        </div>
        <div>
          Presión: <strong>{point.fsr} N</strong>
        </div>
        <div>
          Cadencia: <strong>{point.cadencia || 0} p/min</strong>
        </div>
        <div>
          Estado Pie:{" "}
          <strong style={{ textTransform: "capitalize" }}>
            {point.estadoPie || "-"}
          </strong>
        </div>
      </div>
    </div>
  );
}
