import { getStyles } from "../../styles/theme";
import { useIsDesktop } from "../../hooks/useDesktop";
import { useRealtimeStability } from "../../hooks/useRealtimeStability"; // <-- Importamos el hook
import { WEEKLY_DATA } from "../../constants/surveyData";
import StabilityChartSvg from "./StabilityChartSvg";
import StabilityLegend from "./StabilityLegend";
import StabilityTooltip from "./StabilityTooltip";

export default function StabilityChart({
  sessionId, // <-- Nueva prop que viene del AdminPanel
  graphTimeframe,
  setGraphTimeframe,
  graphFilter,
  setGraphFilter,
  selectedGraphPoint,
  setSelectedGraphPoint,
}) {
  const isDesktop = useIsDesktop();
  const styles = getStyles(isDesktop);

  // Usamos el hook que se conecta a Supabase.
  // Si el sessionId es un arreglo, traerá todo el historial. Si es un string, traerá solo esa sesión.
  const { liveData, isConnected } = useRealtimeStability(sessionId);

  // Seleccionamos el set de datos dependiendo del botón (Hoy vs Semana)
  // Nota: Para la vista semanal aún usamos los datos estáticos (WEEKLY_DATA),
  // ya que agrupar por días requiere un procesamiento extra en el backend.
  const currentDataSet = graphTimeframe === "today" ? liveData : WEEKLY_DATA;

  const filteredDataSet =
    graphFilter === "alerts"
      ? currentDataSet.filter((d) => d.event !== null)
      : currentDataSet;

  const avgStability =
    currentDataSet.length > 0
      ? Math.round(
          currentDataSet.reduce((acc, curr) => acc + curr.stability, 0) /
            currentDataSet.length,
        )
      : 0;

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
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            Historial de Estabilidad y Marcha
            {isConnected && (
              <span
                style={{
                  fontSize: "12px",
                  backgroundColor: "#ECFDF5",
                  color: "#047857",
                  padding: "2px 8px",
                  borderRadius: "12px",
                }}
              >
                🟢 EN VIVO
              </span>
            )}
          </h2>
          <p style={{ fontSize: "15px", color: "#4B5563", margin: 0 }}>
            {sessionId
              ? "Recibiendo datos de los sensores."
              : "Selecciona un participante o inicia una sesión."}
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
              if (liveData.length > 0)
                setSelectedGraphPoint(liveData[liveData.length - 1]);
            }}
          >
            Detalle de Sesión
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
            Resumen Semanal
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
