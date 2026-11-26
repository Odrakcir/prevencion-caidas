import { useIsDesktop } from "../../hooks/useDesktop";

export default function StabilityChartSvg({
  filteredDataSet,
  selectedGraphPoint,
  onSelectPoint,
  isHistoryMode,
  isInactive = false,
  emptyMessage = "Esperando datos de la sesión...",
}) {
  const isDesktop = useIsDesktop();
  const displayData = filteredDataSet || [];
  const totalPoints = displayData.length;

  // Sistema de coordenadas calibrado con exactitud matemática
  const viewWidth = 560;
  const viewHeight = 250;
  const plotLeft = 52;
  const plotRight = 540;
  const plotWidth = plotRight - plotLeft;
  const chartTop = 26;
  const chartBottom = 196;
  const chartHeight = chartBottom - chartTop; // 170px -> 1.7px por punto porcentual

  const getY = (stability) => {
    const clamped = Math.max(0, Math.min(100, Number(stability) || 0));
    return chartBottom - (clamped / 100) * chartHeight;
  };

  // Límites exactos de zonas clínicas (100%, 80%, 50%, 0%)
  const y100 = getY(100);
  const y80 = getY(80);
  const y50 = getY(50);
  const y0 = getY(0);

  // Coordenada X según modo:
  // - Histórico: columnas centradas en slots equiespaciados (funciona bien con 1, 2 o 7 días)
  // - En vivo: puntos distribuidos de borde a borde (centrado si solo hay 1 lectura)
  const getPointX = (index) => {
    if (isHistoryMode) {
      const slotWidth = plotWidth / Math.max(totalPoints, 1);
      return plotLeft + slotWidth * index + slotWidth / 2;
    }
    if (totalPoints <= 1) return plotLeft + plotWidth / 2;
    const innerLeft = plotLeft + 14;
    const innerRight = plotRight - 14;
    return innerLeft + (index / (totalPoints - 1)) * (innerRight - innerLeft);
  };

  const isPointSelected = (d) => {
    if (!selectedGraphPoint) return false;
    if (isHistoryMode) {
      return (
        (selectedGraphPoint.dateKey &&
          selectedGraphPoint.dateKey === d.dateKey) ||
        selectedGraphPoint.fullTime === d.fullTime
      );
    }
    if (selectedGraphPoint.id && d.id) return selectedGraphPoint.id === d.id;
    return (
      selectedGraphPoint.fullTime === d.fullTime &&
      selectedGraphPoint.time === d.time
    );
  };

  // Trazado de línea y área (usado completo en modo vivo y como tendencia sutil en histórico)
  const pathString = displayData
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getPointX(i)} ${getY(d.stability)}`)
    .join(" ");

  const areaString =
    totalPoints > 1
      ? `${pathString} L ${getPointX(totalPoints - 1)} ${y0} L ${getPointX(0)} ${y0} Z`
      : "";

  // Ancho de barra proporcional para modo histórico
  const historySlotWidth = plotWidth / Math.max(totalPoints, 1);
  const barWidth = Math.min(48, Math.max(22, historySlotWidth * 0.48));

  // Índices de etiquetas X para modo en vivo sin superposición
  const maxLiveLabels = isDesktop ? 6 : 4;
  const shouldShowLiveLabel = (index) => {
    if (totalPoints <= maxLiveLabels) return true;
    if (index === 0 || index === totalPoints - 1) return true;
    const step = Math.ceil((totalPoints - 1) / (maxLiveLabels - 1));
    return index % step === 0 && totalPoints - 1 - index >= Math.floor(step / 2);
  };

  return (
    <div
      style={{
        width: "100%",
        height: isDesktop ? "330px" : "270px",
        backgroundColor: isInactive ? "#F1F5F9" : "#FFFFFF",
        border: isInactive ? "1.5px dashed #CBD5E1" : "1px solid #CBD5E1",
        borderRadius: "12px",
        padding: isDesktop ? "14px 16px 10px" : "10px 8px 6px",
        boxSizing: "border-box",
        position: "relative",
        pointerEvents: isInactive ? "none" : "auto",
        userSelect: isInactive ? "none" : "auto",
      }}
    >
      <svg
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={
          isInactive
            ? "Gráfico inactivo sin sesiones de sensores registradas"
            : isHistoryMode
              ? "Gráfico histórico de estabilidad promedio por día"
              : "Gráfico de telemetría de estabilidad en tiempo real"
        }
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <defs>
          <linearGradient id="liveAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F766E" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#0F766E" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Bandas de referencia (en gris estático cuando no hay sesiones) */}
        {isInactive ? (
          <rect
            x={plotLeft}
            y={y100}
            width={plotWidth}
            height={y0 - y100}
            fill="#E2E8F0"
            opacity="0.55"
            rx="4"
          />
        ) : (
          <>
            <rect
              x={plotLeft}
              y={y100}
              width={plotWidth}
              height={y80 - y100}
              fill="#ECFDF5"
              opacity="0.75"
            />
            <rect
              x={plotLeft}
              y={y80}
              width={plotWidth}
              height={y50 - y80}
              fill="#FFFBEB"
              opacity="0.75"
            />
            <rect
              x={plotLeft}
              y={y50}
              width={plotWidth}
              height={y0 - y50}
              fill="#FEF2F2"
              opacity="0.7"
            />
          </>
        )}

        {/* Líneas horizontales calibradas y etiquetas Eje Y */}
        {[
          {
            value: 100,
            y: y100,
            color: isInactive ? "#CBD5E1" : "#059669",
            labelColor: isInactive ? "#94A3B8" : "#065F46",
          },
          {
            value: 80,
            y: y80,
            color: isInactive ? "#CBD5E1" : "#10B981",
            labelColor: isInactive ? "#94A3B8" : "#047857",
          },
          {
            value: 50,
            y: y50,
            color: isInactive ? "#CBD5E1" : "#D97706",
            labelColor: isInactive ? "#94A3B8" : "#B45309",
          },
          {
            value: 0,
            y: y0,
            color: "#CBD5E1",
            labelColor: isInactive ? "#94A3B8" : "#64748B",
          },
        ].map((tick) => (
          <g key={tick.value}>
            <line
              x1={plotLeft}
              y1={tick.y}
              x2={plotRight}
              y2={tick.y}
              stroke={tick.color}
              strokeWidth={tick.value === 0 ? "1.5" : "1"}
              strokeDasharray={tick.value === 0 ? undefined : "4 4"}
              opacity={tick.value === 0 ? "1" : "0.65"}
            />
            <text
              x={plotLeft - 8}
              y={tick.y + 4}
              fill={tick.labelColor}
              fontSize="11.5"
              fontWeight="700"
              textAnchor="end"
            >
              {tick.value}%
            </text>
          </g>
        ))}

        {/* MODO HISTÓRICO: Barras clínicas diarias + línea de tendencia */}
        {isHistoryMode && totalPoints > 0 && (
          <>
            {displayData.map((d, i) => {
              const cx = getPointX(i);
              const barTop = getY(d.stability);
              const barHeight = Math.max(4, y0 - barTop);
              const selected = isPointSelected(d);
              const hasAlerts = (d.alertsCount || 0) > 0;
              const barColor = d.statusColor || "#0F766E";

              return (
                <g
                  key={d.dateKey || `${d.time}-${i}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => onSelectPoint(d)}
                >
                  {/* Área táctil amplia para selección cómoda en móvil */}
                  <rect
                    x={cx - historySlotWidth / 2}
                    y={chartTop - 10}
                    width={historySlotWidth}
                    height={chartHeight + 54}
                    fill={selected ? "rgba(15, 118, 110, 0.06)" : "transparent"}
                    rx="6"
                  />

                  {/* Barra vertical con bordes superiores redondeados */}
                  <rect
                    x={cx - barWidth / 2}
                    y={barTop}
                    width={barWidth}
                    height={barHeight}
                    rx="6"
                    fill={barColor}
                    opacity={selected ? 0.96 : 0.78}
                    stroke={selected ? "#0F172A" : "none"}
                    strokeWidth={selected ? "2" : "0"}
                  />

                  {/* Porcentaje exacto sobre la barra */}
                  <text
                    x={cx}
                    y={Math.max(15, barTop - 8)}
                    fill="#0F172A"
                    fontSize="12"
                    fontWeight="800"
                    textAnchor="middle"
                  >
                    {d.stability}%
                  </text>

                  {/* Indicador de alertas del día si existen */}
                  {hasAlerts && (
                    <g>
                      <rect
                        x={cx - 14}
                        y={Math.min(y0 - 20, barTop + 6)}
                        width="28"
                        height="16"
                        rx="8"
                        fill="#DC2626"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                      <text
                        x={cx}
                        y={Math.min(y0 - 8.5, barTop + 17.5)}
                        fill="#FFFFFF"
                        fontSize="10"
                        fontWeight="800"
                        textAnchor="middle"
                      >
                        !{d.alertsCount}
                      </text>
                    </g>
                  )}

                  {/* Etiqueta Eje X: Día + Fecha corta */}
                  <text
                    x={cx}
                    y={y0 + 18}
                    fill={selected ? "#0F766E" : "#1E293B"}
                    fontSize="12.5"
                    fontWeight={selected ? "800" : "700"}
                    textAnchor="middle"
                  >
                    {d.time}
                  </text>
                  {d.shortDate && (
                    <text
                      x={cx}
                      y={y0 + 33}
                      fill={selected ? "#0F766E" : "#64748B"}
                      fontSize="10.5"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {d.shortDate}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Línea de tendencia conectando los promedios diarios */}
            {totalPoints > 1 && (
              <path
                d={pathString}
                fill="none"
                stroke="#0F172A"
                strokeWidth="2"
                strokeDasharray="3 3"
                opacity="0.45"
                pointerEvents="none"
              />
            )}
          </>
        )}

        {/* MODO EN VIVO / DETALLE DE SESIÓN: Curva continua con nodos de alerta */}
        {!isHistoryMode && totalPoints > 0 && (
          <>
            {totalPoints > 1 && (
              <>
                <path d={areaString} fill="url(#liveAreaGradient)" />
                <path
                  d={pathString}
                  fill="none"
                  stroke="#0F766E"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}

            {displayData.map((d, i) => {
              const x = getPointX(i);
              const y = getY(d.stability);
              const isAlert = d.event !== null;
              const selected = isPointSelected(d);
              const pointColor = isAlert ? "#DC2626" : d.statusColor || "#0F766E";

              // Las alertas y el punto seleccionado SIEMPRE son visibles aunque haya >30 puntos
              const showCircle =
                selected || isAlert || totalPoints <= 30 || totalPoints === 1;
              const radius = selected ? 6.5 : isAlert ? 5.5 : 4;

              const hitWidth =
                totalPoints > 1 ? Math.max(14, plotWidth / totalPoints) : 60;

              return (
                <g
                  key={d.id || `${d.time}-${i}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => onSelectPoint(d)}
                >
                  {/* Columna táctil invisible para facilitar toque en celular */}
                  <rect
                    x={x - hitWidth / 2}
                    y={chartTop}
                    width={hitWidth}
                    height={chartHeight + 36}
                    fill="transparent"
                  />

                  {/* Línea guía vertical del punto seleccionado */}
                  {selected && (
                    <line
                      x1={x}
                      y1={chartTop}
                      x2={x}
                      y2={y0}
                      stroke="#0F766E"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                      opacity="0.65"
                    />
                  )}

                  {/* Halo para alertas o selección */}
                  {(isAlert || selected) && (
                    <circle
                      cx={x}
                      cy={y}
                      r={radius + 4}
                      fill={isAlert ? "#DC2626" : "#0F766E"}
                      opacity="0.18"
                    />
                  )}

                  {showCircle && (
                    <circle
                      cx={x}
                      cy={y}
                      r={radius}
                      fill={pointColor}
                      stroke="#FFFFFF"
                      strokeWidth="1.75"
                    />
                  )}

                  {/* Etiquetas de hora Eje X */}
                  {shouldShowLiveLabel(i) && (
                    <text
                      x={x}
                      y={y0 + 20}
                      fill={selected ? "#0F766E" : "#475569"}
                      fontSize="11.5"
                      fontWeight={selected ? "800" : "600"}
                      textAnchor="middle"
                    >
                      {d.time}
                    </text>
                  )}
                </g>
              );
            })}
          </>
        )}

        {/* Estado vacío / inactivo descriptivo */}
        {totalPoints === 0 && (
          <g>
            <rect
              x={plotLeft + plotWidth / 2 - 175}
              y={chartTop + chartHeight / 2 - 30}
              width="350"
              height="62"
              rx="10"
              fill={isInactive ? "#FFFFFF" : "transparent"}
              stroke={isInactive ? "#CBD5E1" : "none"}
              strokeWidth="1"
            />
            <text
              x={plotLeft + plotWidth / 2}
              y={chartTop + chartHeight / 2 - 4}
              fill="#475569"
              fontSize="13.5"
              fontWeight="700"
              textAnchor="middle"
            >
              {emptyMessage}
            </text>
            {isInactive && (
              <text
                x={plotLeft + plotWidth / 2}
                y={chartTop + chartHeight / 2 + 16}
                fill="#64748B"
                fontSize="11.5"
                fontWeight="500"
                textAnchor="middle"
              >
                Los datos aparecerán aquí tras tu primera prueba de sensores.
              </text>
            )}
          </g>
        )}
      </svg>
    </div>
  );
}
