import { useIsDesktop } from "../../hooks/useDesktop";

export default function StabilityTooltip({ point, isHistoryMode }) {
  const isDesktop = useIsDesktop();

  if (!point) {
    return (
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: "#F8FAFC",
          borderRadius: "10px",
          border: "1px dashed #CBD5E1",
          fontSize: "14px",
          color: "#64748B",
          textAlign: "center",
        }}
      >
        {isHistoryMode
          ? "Selecciona cualquier barra diaria del gráfico para inspeccionar el resumen del día."
          : "Selecciona cualquier punto del gráfico para ver los valores exactos de los sensores."}
      </div>
    );
  }

  const isAlert = isHistoryMode
    ? (point.alertsCount || 0) > 0
    : point.event !== null;
  const accentColor = isAlert
    ? "#DC2626"
    : point.stability >= 80
      ? "#059669"
      : "#D97706";
  const surfaceBg = isAlert
    ? "#FEF2F2"
    : point.stability >= 80
      ? "#F0FDF4"
      : "#FFFBEB";
  const displayTime = point.fullTime || point.time;

  const metricBoxStyle = {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    padding: "10px 12px",
  };

  const metricLabelStyle = {
    fontSize: "11.5px",
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.02em",
    marginBottom: "2px",
  };

  const metricValueStyle = {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0F172A",
  };

  return (
    <div
      style={{
        padding: isDesktop ? "16px 20px" : "14px 16px",
        backgroundColor: surfaceBg,
        borderRadius: "12px",
        border: `1px solid ${accentColor}33`,
        borderLeft: `5px solid ${accentColor}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "10px",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "12px",
              fontWeight: "700",
              color: "#64748B",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
              display: "block",
            }}
          >
            {isHistoryMode ? "Resumen del Día" : "Lectura del Sensor"}
          </span>
          <strong style={{ fontSize: "17px", color: "#0F172A" }}>
            {displayTime}
          </strong>
        </div>

        <span
          style={{
            backgroundColor: accentColor,
            color: "#FFFFFF",
            padding: "4px 12px",
            borderRadius: "999px",
            fontSize: "13.5px",
            fontWeight: "700",
          }}
        >
          Estabilidad: {point.stability}%
        </span>
      </div>

      {isAlert && point.event && (
        <p
          style={{
            margin: "0 0 12px 0",
            color: "#991B1B",
            fontSize: "14px",
            fontWeight: "700",
          }}
        >
          Alerta detectada: {point.event}
        </p>
      )}

      {isHistoryMode ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isDesktop
              ? "repeat(4, 1fr)"
              : "repeat(2, 1fr)",
            gap: "10px",
          }}
        >
          <div style={metricBoxStyle}>
            <div style={metricLabelStyle}>Mínima del Día</div>
            <div style={metricValueStyle}>
              {point.minStability !== undefined ? `${point.minStability}%` : "—"}
            </div>
          </div>
          <div style={metricBoxStyle}>
            <div style={metricLabelStyle}>Eventos de Alerta</div>
            <div
              style={{
                ...metricValueStyle,
                color: (point.alertsCount || 0) > 0 ? "#DC2626" : "#059669",
              }}
            >
              {point.alertsCount ?? 0}
            </div>
          </div>
          <div style={metricBoxStyle}>
            <div style={metricLabelStyle}>Inclinación Prom.</div>
            <div style={metricValueStyle}>
              {point.tilt !== "-" && point.tilt !== undefined
                ? `${point.tilt}°`
                : "—"}
            </div>
          </div>
          <div style={metricBoxStyle}>
            <div style={metricLabelStyle}>Sesiones / Lecturas</div>
            <div style={metricValueStyle}>
              {point.sessionsCount || 1} / {point.sampleCount || 1}
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isDesktop
              ? "repeat(4, 1fr)"
              : "repeat(2, 1fr)",
            gap: "10px",
          }}
        >
          <div style={metricBoxStyle}>
            <div style={metricLabelStyle}>Inclinación</div>
            <div style={metricValueStyle}>{point.tilt ?? 0}°</div>
          </div>
          <div style={metricBoxStyle}>
            <div style={metricLabelStyle}>Presión Plantar</div>
            <div style={metricValueStyle}>{point.fsr ?? 0} N</div>
          </div>
          <div style={metricBoxStyle}>
            <div style={metricLabelStyle}>Cadencia</div>
            <div style={metricValueStyle}>{point.cadencia || 0} p/min</div>
          </div>
          <div style={metricBoxStyle}>
            <div style={metricLabelStyle}>Estado del Pie</div>
            <div
              style={{
                ...metricValueStyle,
                textTransform: "capitalize",
              }}
            >
              {point.estadoPie || "—"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
