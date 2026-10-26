import { getStyles } from "../../styles/theme";
import { useIsDesktop } from "../../hooks/useDesktop";
import { HOURLY_DATA, WEEKLY_DATA } from "../../constants/surveyData";
import StabilityChartSvg from "./StabilityChartSvg";
import StabilityLegend from "./StabilityLegend";
import StabilityTooltip from "./StabilityTooltip";

export default function StabilityChart({
  graphTimeframe,
  setGraphTimeframe,
  graphFilter,
  setGraphFilter,
  selectedGraphPoint,
  setSelectedGraphPoint,
}) {
  const isDesktop = useIsDesktop();
  const styles = getStyles(isDesktop);

  const currentDataSet = graphTimeframe === "today" ? HOURLY_DATA : WEEKLY_DATA;
  const filteredDataSet =
    graphFilter === "alerts"
      ? currentDataSet.filter((d) => d.event !== null)
      : currentDataSet;

  const avgStability = Math.round(
    currentDataSet.reduce((acc, curr) => acc + curr.stability, 0) /
      currentDataSet.length,
  );
  const totalAlerts = currentDataSet.filter((d) => d.event !== null).length;

  return (
    <div style={styles.featuredCard}>
      {/* Título + selector Hoy/Semana */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: "800",
              color: "#0D9488",
              margin: "0 0 4px 0",
            }}
          >
            Historial Diario de Estabilidad y Marcha
          </h2>
          <p style={{ fontSize: "15px", color: "#4B5563", margin: 0 }}>
            Evolución del equilibrio a lo largo del día. Seleccione los puntos
            para ver el detalle.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            backgroundColor: "#E5E7EB",
            borderRadius: "8px",
            padding: "3px",
            gap: "4px",
          }}
        >
          <button
            style={{
              border: "none",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "700",
              borderRadius: "6px",
              cursor: "pointer",
              backgroundColor:
                graphTimeframe === "today" ? "#0D9488" : "transparent",
              color: graphTimeframe === "today" ? "#FFFFFF" : "#4B5563",
              transition: "all 0.2s",
            }}
            onClick={() => {
              setGraphTimeframe("today");
              setSelectedGraphPoint(HOURLY_DATA[HOURLY_DATA.length - 1]);
            }}
          >
            Hoy (Detalle Horario)
          </button>
          <button
            style={{
              border: "none",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "700",
              borderRadius: "6px",
              cursor: "pointer",
              backgroundColor:
                graphTimeframe === "weekly" ? "#0D9488" : "transparent",
              color: graphTimeframe === "weekly" ? "#FFFFFF" : "#4B5563",
              transition: "all 0.2s",
            }}
            onClick={() => {
              setGraphTimeframe("weekly");
              setSelectedGraphPoint(WEEKLY_DATA[0]);
            }}
          >
            Semana (7 Días)
          </button>
        </div>
      </div>

      {/* Barra de métricas + filtros */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          backgroundColor: "#F8FAFC",
          padding: "12px 18px",
          borderRadius: "10px",
          border: "1.5px solid #E2E8F0",
          marginBottom: "16px",
          fontSize: "15px",
        }}
      >
        <div>
          Estabilidad Promedio:{" "}
          <strong
            style={{
              fontSize: "18px",
              color: avgStability >= 80 ? "#10B981" : "#F59E0B",
            }}
          >
            {avgStability}%
          </strong>{" "}
          | Eventos de Inestabilidad:{" "}
          <strong
            style={{
              fontSize: "18px",
              color: totalAlerts > 0 ? "#EF4444" : "#10B981",
            }}
          >
            {totalAlerts}
          </strong>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            style={{
              border: "1.5px solid #CBD5E1",
              padding: "6px 14px",
              fontSize: "13px",
              fontWeight: "700",
              borderRadius: "6px",
              cursor: "pointer",
              backgroundColor: graphFilter === "all" ? "#0D9488" : "#FFFFFF",
              color: graphFilter === "all" ? "#FFFFFF" : "#374151",
            }}
            onClick={() => setGraphFilter("all")}
          >
            Ver Todos
          </button>
          <button
            style={{
              border: "1.5px solid #CBD5E1",
              padding: "6px 14px",
              fontSize: "13px",
              fontWeight: "700",
              borderRadius: "6px",
              cursor: "pointer",
              backgroundColor: graphFilter === "alerts" ? "#EF4444" : "#FFFFFF",
              color: graphFilter === "alerts" ? "#FFFFFF" : "#374151",
            }}
            onClick={() => setGraphFilter("alerts")}
          >
            Solo Alertas ({totalAlerts})
          </button>
        </div>
      </div>

      {/* Gráfico + Leyenda */}
      <div
        style={{
          display: "flex",
          flexDirection: isDesktop ? "row" : "column",
          gap: "16px",
          alignItems: "stretch",
          marginBottom: "16px",
        }}
      >
        <StabilityChartSvg
          filteredDataSet={filteredDataSet}
          graphTimeframe={graphTimeframe}
          selectedGraphPoint={selectedGraphPoint}
          onSelectPoint={setSelectedGraphPoint}
        />
        <StabilityLegend />
      </div>

      {/* Tooltip */}
      <StabilityTooltip point={selectedGraphPoint} />
    </div>
  );
}
