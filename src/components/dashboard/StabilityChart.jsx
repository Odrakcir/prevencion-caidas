import { getStyles } from "../../styles/theme";
import { useIsDesktop } from "../../hooks/useDesktop";
import {
  useRealtimeStability,
  processWeeklyData,
  analyzeGaitProgression,
} from "../../hooks/useRealtimeStability";
import StabilityChartSvg from "./StabilityChartSvg";
import StabilityLegend from "./StabilityLegend";
import StabilityTooltip from "./StabilityTooltip";
import CrossAlerts, { computeCrossRecommendations } from "./CrossAlerts";

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
  canExportHistoryPdf = false,
  patient = null,
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

  const { liveData, isConnected, isLoading } = useRealtimeStability(
    sessionId,
    isHistoryMode,
  );

  const isLoadingData = hasSession && isLoading;

  // En histórico agrupamos por día; en vivo mostramos la serie de telemetría
  const currentDataSet =
    !hasSession || isLoadingData
      ? []
      : isHistoryMode
        ? processWeeklyData(liveData)
        : liveData;

  const isEmptyInactive = !hasSession;

  // Análisis longitudinal resumido para la vista histórica (y completo al exportar PDF)
  const progression =
    isHistoryMode && hasSession && !isLoadingData && liveData.length > 0
      ? analyzeGaitProgression(liveData)
      : null;

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

  // Exporta el Análisis Histórico de Marcha a PDF (sin gráfico, enfocado en evolución y deterioro por semanas y días)
  const handleExportHistoryPdf = () => {
    const reportProgression = progression || analyzeGaitProgression(liveData);
    const crossRecs = computeCrossRecommendations(liveData, hazards);

    const participantName = patient
      ? `${patient.nombres || ""} ${patient.apellidos || ""}`.trim()
      : "Participante seleccionado";
    const participantRut = patient?.rut ? ` (${patient.rut})` : "";
    const dateStr = new Date().toLocaleDateString("es-CL");

    const formatDelta = (delta) => {
      if (delta === null || delta === undefined) return "Base";
      if (delta > 0) return `+${delta}%`;
      return `${delta}%`;
    };

    const deltaColor = (delta) => {
      if (delta === null || delta === undefined) return "#64748B";
      if (delta <= -5) return "#DC2626";
      if (delta >= 5) return "#059669";
      return "#0F766E";
    };

    const weeklyRowsHtml = reportProgression.weekly
      .map(
        (w) => `
        <tr>
          <td style="padding:7px 9px;border-bottom:1px solid #E2E8F0;font-weight:700;">Semana ${w.weekNumber} <span style="font-weight:500;color:#64748B;">(${w.rangeLabel})</span></td>
          <td style="padding:7px 9px;border-bottom:1px solid #E2E8F0;text-align:center;">${w.daysCount}</td>
          <td style="padding:7px 9px;border-bottom:1px solid #E2E8F0;font-weight:800;color:${w.avgStability >= 80 ? "#059669" : w.avgStability >= 50 ? "#D97706" : "#DC2626"};">${w.avgStability}%</td>
          <td style="padding:7px 9px;border-bottom:1px solid #E2E8F0;font-weight:700;color:${deltaColor(w.delta)};">${formatDelta(w.delta)}</td>
          <td style="padding:7px 9px;border-bottom:1px solid #E2E8F0;text-align:center;font-weight:700;color:${w.alertsCount > 0 ? "#DC2626" : "#059669"};">${w.alertsCount}</td>
          <td style="padding:7px 9px;border-bottom:1px solid #E2E8F0;">${w.avgTilt}°</td>
          <td style="padding:7px 9px;border-bottom:1px solid #E2E8F0;font-weight:700;color:${w.statusColor};">${w.statusLabel}</td>
        </tr>
      `,
      )
      .join("");

    const dailyRowsHtml = reportProgression.daily
      .map(
        (d) => `
        <tr>
          <td style="padding:7px 9px;border-bottom:1px solid #E2E8F0;font-weight:600;">${d.dateLabel}</td>
          <td style="padding:7px 9px;border-bottom:1px solid #E2E8F0;font-weight:800;color:${d.avgStability >= 80 ? "#059669" : d.avgStability >= 50 ? "#D97706" : "#DC2626"};">${d.avgStability}%</td>
          <td style="padding:7px 9px;border-bottom:1px solid #E2E8F0;font-weight:700;color:${deltaColor(d.delta)};">${formatDelta(d.delta)}</td>
          <td style="padding:7px 9px;border-bottom:1px solid #E2E8F0;">${d.minStability}%</td>
          <td style="padding:7px 9px;border-bottom:1px solid #E2E8F0;text-align:center;font-weight:700;color:${d.alertsCount > 0 ? "#DC2626" : "#059669"};">${d.alertsCount}</td>
          <td style="padding:7px 9px;border-bottom:1px solid #E2E8F0;">${d.avgTilt}°</td>
          <td style="padding:7px 9px;border-bottom:1px solid #E2E8F0;font-weight:700;color:${d.statusColor};">${d.statusLabel}</td>
        </tr>
      `,
      )
      .join("");

    const recsHtml =
      crossRecs.length > 0
        ? crossRecs
            .map(
              (rec) => `
              <div style="background:#FFFBEB;border:1px solid #FDE68A;border-left:4px solid #D97706;border-radius:8px;padding:10px 12px;margin-bottom:8px;">
                <div style="font-size:11.5px;font-weight:800;color:#92400E;text-transform:uppercase;margin-bottom:4px;">
                  ${rec.badge} · <span style="font-weight:600;color:#475569;text-transform:none;">${rec.meta}</span>
                </div>
                <p style="margin:0;font-size:13px;color:#0F172A;line-height:1.5;">${rec.message}</p>
              </div>
            `,
            )
            .join("")
        : `<p style="margin:0;font-size:13px;color:#475569;">No se activaron recomendaciones cruzadas para el período analizado.</p>`;

    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>Análisis Histórico de Marcha — Hogar Seguro</title>
          <style>
            * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body { font-family: 'Segoe UI', -apple-system, Roboto, sans-serif; color: #0F172A; margin: 16px; line-height: 1.5; }
            .keep-together { page-break-inside: avoid; break-inside: avoid; }
            @media print {
              @page { size: A4; margin: 14mm; }
            }
          </style>
        </head>
        <body>
          <!-- 1. ENCABEZADO -->
          <div style="border-bottom:2px solid #0F766E;padding-bottom:12px;margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <img src="/logo-utem.png" alt="Logo" style="width:120px;height:auto;" />
              <span style="font-size:11.5px;font-weight:700;color:#0F766E;background:#F0FDFA;border:1px solid #99F6E4;padding:4px 10px;border-radius:999px;">
                Hogar Seguro · Análisis Longitudinal
              </span>
            </div>
            <h1 style="margin:0 0 6px 0;font-size:22px;font-weight:800;color:#0F766E;">
              Análisis Histórico de Marcha
            </h1>
            <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;font-size:13px;color:#334155;">
              <span><strong>Participante:</strong> ${participantName}${participantRut}</span>
              <span><strong>Período:</strong> ${reportProgression.dateRangeLabel}</span>
              <span><strong>Emisión:</strong> ${dateStr}</span>
            </div>
          </div>

          <!-- 2. RESUMEN GLOBAL Y DETECCIÓN DE DETERIORO -->
          <div class="keep-together" style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:10px;padding:14px 16px;margin-bottom:16px;">
            <h2 style="margin:0 0 10px 0;font-size:15.5px;font-weight:800;color:#0F172A;border-bottom:1px solid #E2E8F0;padding-bottom:6px;">
              Resumen Global y Evaluación de Deterioro
            </h2>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px;">
              <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px;padding:9px 10px;">
                <div style="font-size:10.5px;font-weight:700;color:#64748B;text-transform:uppercase;">Estabilidad Promedio Global</div>
                <div style="font-size:20px;font-weight:800;color:${reportProgression.globalAvgStability >= 80 ? "#059669" : reportProgression.globalAvgStability >= 50 ? "#D97706" : "#DC2626"};">${reportProgression.globalAvgStability}%</div>
              </div>
              <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px;padding:9px 10px;">
                <div style="font-size:10.5px;font-weight:700;color:#64748B;text-transform:uppercase;">Días con Alertas</div>
                <div style="font-size:20px;font-weight:800;color:${reportProgression.daysWithAlerts > 0 ? "#DC2626" : "#059669"};">${reportProgression.daysWithAlerts} <span style="font-size:12px;color:#64748B;font-weight:600;">/ ${reportProgression.daily.length}</span></div>
              </div>
              <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px;padding:9px 10px;">
                <div style="font-size:10.5px;font-weight:700;color:#64748B;text-transform:uppercase;">Semanas Evaluadas</div>
                <div style="font-size:20px;font-weight:800;color:#0F172A;">${reportProgression.weekly.length}</div>
              </div>
              <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px;padding:9px 10px;">
                <div style="font-size:10.5px;font-weight:700;color:#64748B;text-transform:uppercase;">Eventos Totales</div>
                <div style="font-size:20px;font-weight:800;color:${reportProgression.totalAlerts > 0 ? "#DC2626" : "#059669"};">${reportProgression.totalAlerts}</div>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div style="background:${reportProgression.weeklyTrend.bg};border:1px solid ${reportProgression.weeklyTrend.color}33;border-left:4px solid ${reportProgression.weeklyTrend.color};border-radius:8px;padding:10px 12px;">
                <div style="font-size:11px;font-weight:800;color:${reportProgression.weeklyTrend.color};text-transform:uppercase;margin-bottom:4px;">
                  Tendencia Semanal: ${reportProgression.weeklyTrend.label}
                </div>
                <p style="margin:0;font-size:12.5px;color:#0F172A;line-height:1.45;">
                  ${reportProgression.weeklyTrend.summary}
                </p>
              </div>
              <div style="background:${reportProgression.dailyTrend.bg};border:1px solid ${reportProgression.dailyTrend.color}33;border-left:4px solid ${reportProgression.dailyTrend.color};border-radius:8px;padding:10px 12px;">
                <div style="font-size:11px;font-weight:800;color:${reportProgression.dailyTrend.color};text-transform:uppercase;margin-bottom:4px;">
                  Tendencia Diaria: ${reportProgression.dailyTrend.label}
                </div>
                <p style="margin:0;font-size:12.5px;color:#0F172A;line-height:1.45;">
                  ${reportProgression.dailyTrend.summary}
                </p>
              </div>
            </div>
          </div>

          <!-- 3. EVOLUCIÓN POR SEMANAS -->
          <div class="keep-together" style="margin-bottom:16px;">
            <h2 style="margin:0 0 8px 0;font-size:15.5px;font-weight:800;color:#0F172A;">
              Evolución de la Marcha por Semanas
            </h2>
            <table style="width:100%;border-collapse:collapse;font-size:12.5px;border:1px solid #CBD5E1;">
              <thead style="background:#F1F5F9;text-align:left;">
                <tr>
                  <th style="padding:8px 9px;border-bottom:1px solid #CBD5E1;">Semana</th>
                  <th style="padding:8px 9px;border-bottom:1px solid #CBD5E1;text-align:center;">Días</th>
                  <th style="padding:8px 9px;border-bottom:1px solid #CBD5E1;">Estabilidad</th>
                  <th style="padding:8px 9px;border-bottom:1px solid #CBD5E1;">Var. Semanal</th>
                  <th style="padding:8px 9px;border-bottom:1px solid #CBD5E1;text-align:center;">Alertas</th>
                  <th style="padding:8px 9px;border-bottom:1px solid #CBD5E1;">Inclinación</th>
                  <th style="padding:8px 9px;border-bottom:1px solid #CBD5E1;">Evaluación</th>
                </tr>
              </thead>
              <tbody>
                ${weeklyRowsHtml}
              </tbody>
            </table>
          </div>

          <!-- 4. EVOLUCIÓN POR DÍAS -->
          <div style="margin-bottom:16px;">
            <h2 style="margin:0 0 8px 0;font-size:15.5px;font-weight:800;color:#0F172A;">
              Evolución de la Marcha por Días
            </h2>
            <table style="width:100%;border-collapse:collapse;font-size:12.5px;border:1px solid #CBD5E1;">
              <thead style="background:#F1F5F9;text-align:left;">
                <tr>
                  <th style="padding:8px 9px;border-bottom:1px solid #CBD5E1;">Día</th>
                  <th style="padding:8px 9px;border-bottom:1px solid #CBD5E1;">Estabilidad</th>
                  <th style="padding:8px 9px;border-bottom:1px solid #CBD5E1;">Var. Diaria</th>
                  <th style="padding:8px 9px;border-bottom:1px solid #CBD5E1;">Mínima</th>
                  <th style="padding:8px 9px;border-bottom:1px solid #CBD5E1;text-align:center;">Alertas</th>
                  <th style="padding:8px 9px;border-bottom:1px solid #CBD5E1;">Inclinación</th>
                  <th style="padding:8px 9px;border-bottom:1px solid #CBD5E1;">Estado</th>
                </tr>
              </thead>
              <tbody>
                ${dailyRowsHtml}
              </tbody>
            </table>
          </div>

          <!-- 5. RECOMENDACIONES CRUZADAS GENERADAS -->
          <div class="keep-together" style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:10px;padding:12px 14px;margin-bottom:14px;">
            <h2 style="margin:0 0 8px 0;font-size:15px;font-weight:800;color:#0F172A;">
              Recomendaciones Cruzadas generadas (${crossRecs.length})
            </h2>
            ${recsHtml}
          </div>

          <p style="margin:10px 0 0 0;font-size:11px;color:#64748B;font-style:italic;">
            Documento generado con fines exclusivamente educativos, preventivos y de investigación universitaria. El indicador de deterioro refleja únicamente variaciones en las lecturas de los sensores y no constituye diagnóstico médico.
          </p>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (iframe.parentNode) document.body.removeChild(iframe);
      }, 1000);
    }, 400);
  };

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

        {/* Botón Exportar Análisis Histórico (PDF) exclusivo en vista histórica del Admin */}
        {canExportHistoryPdf && isHistoryMode && !isEmptyInactive && (
          <button
            type="button"
            onClick={handleExportHistoryPdf}
            disabled={isLoadingData || currentDataSet.length === 0}
            style={{
              minHeight: "40px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#0F766E",
              color: "#FFFFFF",
              fontSize: "13.5px",
              fontWeight: "700",
              cursor:
                isLoadingData || currentDataSet.length === 0
                  ? "not-allowed"
                  : "pointer",
              boxShadow: "0 2px 5px rgba(15, 118, 110, 0.2)",
              width: isDesktop ? "auto" : "100%",
            }}
          >
            {isLoadingData
              ? "Cargando análisis..."
              : "Descargar Análisis Histórico (PDF)"}
          </button>
        )}

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
                color:
                  isEmptyInactive || isLoadingData
                    ? "#94A3B8"
                    : totalAlerts > 0
                      ? "#DC2626"
                      : "#059669",
                lineHeight: "1.2",
                marginTop: "2px",
              }}
            >
              {isEmptyInactive || isLoadingData ? "—" : totalAlerts}
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
                  color:
                    isEmptyInactive || isLoadingData ? "#94A3B8" : "#0F172A",
                  lineHeight: "1.2",
                  marginTop: "2px",
                }}
              >
                {isEmptyInactive || isLoadingData ? "—" : currentDataSet.length}
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

      {/* Vista resumida de evaluación de deterioro en pantalla (el desglose completo queda en el PDF) */}
      {isHistoryMode && !isEmptyInactive && progression && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr",
            gap: "10px",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              backgroundColor: progression.weeklyTrend.bg,
              border: `1px solid ${progression.weeklyTrend.color}33`,
              borderLeft: `4px solid ${progression.weeklyTrend.color}`,
              borderRadius: "10px",
              padding: "10px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                Tendencia Semanal ({progression.weekly.length}{" "}
                {progression.weekly.length === 1 ? "sem." : "sems."})
              </div>
              <div
                style={{
                  fontSize: "14.5px",
                  fontWeight: "800",
                  color: progression.weeklyTrend.color,
                  marginTop: "2px",
                }}
              >
                {progression.weeklyTrend.label}
              </div>
            </div>
            {progression.weeklyTrend.delta !== null && (
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "800",
                  color: progression.weeklyTrend.color,
                  backgroundColor: "#FFFFFF",
                  border: `1px solid ${progression.weeklyTrend.color}44`,
                  padding: "3px 9px",
                  borderRadius: "999px",
                  whiteSpace: "nowrap",
                }}
              >
                {progression.weeklyTrend.delta > 0
                  ? `+${progression.weeklyTrend.delta}%`
                  : `${progression.weeklyTrend.delta}%`}
              </span>
            )}
          </div>

          <div
            style={{
              backgroundColor: progression.dailyTrend.bg,
              border: `1px solid ${progression.dailyTrend.color}33`,
              borderLeft: `4px solid ${progression.dailyTrend.color}`,
              borderRadius: "10px",
              padding: "10px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                Tendencia Diaria ({progression.daily.length}{" "}
                {progression.daily.length === 1 ? "día" : "días"})
              </div>
              <div
                style={{
                  fontSize: "14.5px",
                  fontWeight: "800",
                  color: progression.dailyTrend.color,
                  marginTop: "2px",
                }}
              >
                {progression.dailyTrend.label}
              </div>
            </div>
            {progression.dailyTrend.delta !== null && (
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "800",
                  color: progression.dailyTrend.color,
                  backgroundColor: "#FFFFFF",
                  border: `1px solid ${progression.dailyTrend.color}44`,
                  padding: "3px 9px",
                  borderRadius: "999px",
                  whiteSpace: "nowrap",
                }}
              >
                {progression.dailyTrend.delta > 0
                  ? `+${progression.dailyTrend.delta}%`
                  : `${progression.dailyTrend.delta}%`}
              </span>
            )}
          </div>
        </div>
      )}

      {!isEmptyInactive && !isLoadingData && <StabilityLegend />}

      <div
        style={{
          width: "100%",
          marginBottom: isEmptyInactive || isLoadingData ? "0" : "14px",
        }}
      >
        {isLoadingData ? (
          <div
            role="status"
            aria-live="polite"
            style={{
              width: "100%",
              height: isDesktop ? "330px" : "270px",
              backgroundColor: "#F8FAFC",
              border: "1px solid #CBD5E1",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "14px",
              padding: "20px",
              textAlign: "center",
              boxSizing: "border-box",
            }}
          >
            <div className="chart-spinner" aria-hidden="true" />
            <div>
              <p
                style={{
                  margin: "0 0 4px 0",
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#0F172A",
                }}
              >
                {isHistoryMode
                  ? "Cargando histórico completo..."
                  : "Cargando telemetría de la sesión..."}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "13.5px",
                  color: "#475569",
                  lineHeight: "1.45",
                }}
              >
                {isHistoryMode
                  ? "Recopilando todas las sesiones registradas para calcular la evolución."
                  : "Obteniendo las lecturas más recientes de los sensores."}
              </p>
            </div>
          </div>
        ) : (
          <StabilityChartSvg
            filteredDataSet={filteredDataSet}
            selectedGraphPoint={isEmptyInactive ? null : selectedGraphPoint}
            onSelectPoint={isEmptyInactive ? () => {} : setSelectedGraphPoint}
            isHistoryMode={isHistoryMode}
            isInactive={isEmptyInactive}
            emptyMessage={emptyMessage}
          />
        )}
      </div>

      {!isEmptyInactive && !isLoadingData && (
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
