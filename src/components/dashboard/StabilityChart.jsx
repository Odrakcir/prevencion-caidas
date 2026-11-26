import { getStyles } from "../../styles/theme";
import { useIsDesktop } from "../../hooks/useDesktop";
import {
  useRealtimeStability,
  processWeeklyData,
} from "../../hooks/useRealtimeStability";
import StabilityChartSvg from "./StabilityChartSvg";
import StabilityLegend from "./StabilityLegend";
import StabilityTooltip from "./StabilityTooltip";
import CrossAlerts from "./CrossAlerts";

export default function StabilityChart({
  sessionId,
  viewMode,
  graphTimeframe,
  setGraphTimeframe,
  graphFilter,
  setGraphFilter,
  selectedGraphPoint,
  setSelectedGraphPoint,
  hazards,
}) {
  const isDesktop = useIsDesktop();
  const styles = getStyles(isDesktop);

  // Compatibilidad con AdminPanelModule (viewMode) y DashboardModule (graphTimeframe)
  const effectiveViewMode =
    viewMode || (graphTimeframe === "weekly" ? "history" : "live");
  const isHistoryMode = effectiveViewMode === "history";

  // Determina si existe al menos una sesión real asignada al gráfico
  const hasSession = Array.isArray(sessionId)
    ? sessionId.filter(Boolean).length > 0
    : Boolean(sessionId);

  const { liveData, isConnected } = useRealtimeStability(
    sessionId,
    isHistoryMode,
  );

  // En histórico agrupamos por día; en vivo mostramos la serie de telemetría
  const currentDataSet = !hasSession
    ? []
    : isHistoryMode
      ? processWeeklyData(liveData)
      : liveData;

  const isEmptyInactive = !hasSession;

  const filteredDataSet =
    graphFilter === "alerts"
      ? currentDataSet.filter((d) =>
          isHistoryMode ? (d.alertsCount || 0) > 0 : d.event !== null,
        )
      : currentDataSet;

  const avgStability =
    currentDataSet.length > 0
      ? Math.round(
          currentDataSet.reduce((acc, curr) => acc + curr.stability, 0) /
            currentDataSet.length,
        )
      : 0;

  // En histórico sumamos los eventos reales de cada día; en vivo contamos los registros con alerta
  const totalAlerts = isHistoryMode
    ? currentDataSet.reduce((acc, d) => acc + (d.alertsCount || 0), 0)
    : currentDataSet.filter((d) => d.event !== null).length;

  const daysWithAlerts = isHistoryMode
    ? currentDataSet.filter((d) => (d.alertsCount || 0) > 0).length
    : totalAlerts;

  const emptyMessage = !hasSession
    ? "Sin sesiones de sensores registradas"
    : graphFilter === "alerts"
      ? "No se registraron eventos de inestabilidad en este período."
      : isHistoryMode
        ? "Aún no existen días con telemetría registrada para este participante."
        : "Esperando lecturas del sensor para esta sesión...";

  const avgColor =
    avgStability >= 80 ? "#059669" : avgStability >= 50 ? "#D97706" : "#DC2626";

  return (
    <div
      style={{
        ...styles.featuredCard,
        ...(isEmptyInactive
          ? {
              backgroundColor: "#F8FAFC",
              border: "1px solid #CBD5E1",
              borderTop: "4px solid #94A3B8",
              boxShadow: "none",
            }
          : {}),
      }}
    >
      {/* Cabecera del gráfico */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "18px",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "4px",
            }}
          >
            <h2
              style={{
                fontSize: isDesktop ? "21px" : "19px",
                fontWeight: "700",
                color: isEmptyInactive ? "#475569" : "#0F172A",
                margin: 0,
                letterSpacing: "-0.015em",
              }}
            >
              {isHistoryMode
                ? "Evolución Histórica de la Marcha"
                : "Telemetría de Estabilidad"}
            </h2>
            {isConnected && !isHistoryMode && hasSession && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: "700",
                  backgroundColor: "#ECFDF5",
                  color: "#047857",
                  border: "1px solid #A7F3D0",
                  padding: "3px 10px",
                  borderRadius: "999px",
                  letterSpacing: "0.03em",
                }}
              >
                <span className="live-pulse-dot" />
                EN VIVO
              </span>
            )}
            {isEmptyInactive && (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  backgroundColor: "#E2E8F0",
                  color: "#475569",
                  padding: "3px 10px",
                  borderRadius: "999px",
                }}
              >
                SIN SESIONES
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: "14px",
              color: "#64748B",
              margin: 0,
              lineHeight: "1.45",
            }}
          >
            {isEmptyInactive
              ? "Este gráfico permanecerá inactivo hasta que el investigador realice una sesión de prueba con los sensores."
              : isHistoryMode
                ? "Estabilidad promedio diaria y conteo de alertas acumuladas (últimos 7 días activos)."
                : "Seguimiento continuo de postura, apoyo plantar e inclinación lumbar."}
          </p>
        </div>

        {/* Selector de periodo opcional cuando se usa desde DashboardModule */}
        {!viewMode && setGraphTimeframe && !isEmptyInactive && (
          <div
            style={{
              display: "inline-flex",
              backgroundColor: "#F1F5F9",
              padding: "3px",
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setGraphTimeframe("today");
                setSelectedGraphPoint(null);
              }}
              style={{
                padding: "6px 12px",
                fontSize: "13px",
                fontWeight: "600",
                borderRadius: "7px",
                border: "none",
                cursor: "pointer",
                backgroundColor: !isHistoryMode ? "#FFFFFF" : "transparent",
                color: !isHistoryMode ? "#0F766E" : "#475569",
                boxShadow: !isHistoryMode
                  ? "0 1px 2px rgba(15, 23, 42, 0.08)"
                  : "none",
              }}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => {
                setGraphTimeframe("weekly");
                setSelectedGraphPoint(null);
              }}
              style={{
                padding: "6px 12px",
                fontSize: "13px",
                fontWeight: "600",
                borderRadius: "7px",
                border: "none",
                cursor: "pointer",
                backgroundColor: isHistoryMode ? "#FFFFFF" : "transparent",
                color: isHistoryMode ? "#0F766E" : "#475569",
                boxShadow: isHistoryMode
                  ? "0 1px 2px rgba(15, 23, 42, 0.08)"
                  : "none",
              }}
            >
              Semanal
            </button>
          </div>
        )}
      </div>

      {/* Barra de KPIs clínicos + filtros */}
      <div
        style={{
          display: "flex",
          flexDirection: isDesktop ? "row" : "column",
          justifyContent: "space-between",
          alignItems: isDesktop ? "center" : "stretch",
          gap: "12px",
          backgroundColor: "#F8FAFC",
          padding: "14px 16px",
          borderRadius: "12px",
          border: "1px solid #E2E8F0",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isHistoryMode
              ? "repeat(3, minmax(0, 1fr))"
              : "repeat(2, minmax(0, 1fr))",
            gap: "12px",
            flex: 1,
          }}
        >
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#64748B",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              Estabilidad Prom.
            </div>
            <div
              style={{
                fontSize: isDesktop ? "22px" : "20px",
                fontWeight: "800",
                color: currentDataSet.length > 0 ? avgColor : "#94A3B8",
                lineHeight: "1.2",
                marginTop: "2px",
              }}
            >
              {currentDataSet.length > 0 ? `${avgStability}%` : "—"}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#64748B",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              Eventos de Alerta
            </div>
            <div
              style={{
                fontSize: isDesktop ? "22px" : "20px",
                fontWeight: "800",
                color: isEmptyInactive
                  ? "#94A3B8"
                  : totalAlerts > 0
                    ? "#DC2626"
                    : "#059669",
                lineHeight: "1.2",
                marginTop: "2px",
              }}
            >
              {isEmptyInactive ? "—" : totalAlerts}
            </div>
          </div>

          {isHistoryMode && (
            <div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#64748B",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                Días Registrados
              </div>
              <div
                style={{
                  fontSize: isDesktop ? "22px" : "20px",
                  fontWeight: "800",
                  color: isEmptyInactive ? "#94A3B8" : "#0F172A",
                  lineHeight: "1.2",
                  marginTop: "2px",
                }}
              >
                {isEmptyInactive ? "—" : currentDataSet.length}
              </div>
            </div>
          )}
        </div>

        {!isEmptyInactive && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              style={{
                flex: isDesktop ? "none" : 1,
                minHeight: "40px",
                border:
                  graphFilter === "all"
                    ? "1px solid #0F766E"
                    : "1px solid #CBD5E1",
                padding: "8px 14px",
                fontSize: "13px",
                fontWeight: "700",
                borderRadius: "8px",
                cursor: "pointer",
                backgroundColor: graphFilter === "all" ? "#0F766E" : "#FFFFFF",
                color: graphFilter === "all" ? "#FFFFFF" : "#334155",
                transition: "all 0.15s ease",
              }}
              onClick={() => {
                setGraphFilter("all");
                setSelectedGraphPoint(null);
              }}
            >
              Ver Todos
            </button>
            <button
              type="button"
              style={{
                flex: isDesktop ? "none" : 1,
                minHeight: "40px",
                border:
                  graphFilter === "alerts"
                    ? "1px solid #DC2626"
                    : "1px solid #CBD5E1",
                padding: "8px 14px",
                fontSize: "13px",
                fontWeight: "700",
                borderRadius: "8px",
                cursor: "pointer",
                backgroundColor:
                  graphFilter === "alerts" ? "#DC2626" : "#FFFFFF",
                color: graphFilter === "alerts" ? "#FFFFFF" : "#334155",
                transition: "all 0.15s ease",
              }}
              onClick={() => {
                setGraphFilter("alerts");
                setSelectedGraphPoint(null);
              }}
            >
              {isHistoryMode
                ? `Días con Alertas (${daysWithAlerts})`
                : `Solo Alertas (${totalAlerts})`}
            </button>
          </div>
        )}
      </div>

      {!isEmptyInactive && <StabilityLegend />}

      <div style={{ width: "100%", marginBottom: isEmptyInactive ? "0" : "14px" }}>
        <StabilityChartSvg
          filteredDataSet={filteredDataSet}
          selectedGraphPoint={isEmptyInactive ? null : selectedGraphPoint}
          onSelectPoint={isEmptyInactive ? () => {} : setSelectedGraphPoint}
          isHistoryMode={isHistoryMode}
          isInactive={isEmptyInactive}
          emptyMessage={emptyMessage}
        />
      </div>

      {!isEmptyInactive && (
        <>
          <StabilityTooltip
            point={selectedGraphPoint}
            isHistoryMode={isHistoryMode}
          />
          <CrossAlerts telemetryData={liveData} hazards={hazards} />
        </>
      )}
    </div>
  );
}
