import { useRef, useEffect } from "react";
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
  const scrollContainerRef = useRef(null);
  const prevCountRef = useRef(0);

  const displayData = filteredDataSet || [];
  const totalPoints = displayData.length;

  // En modo sesión/en vivo con muchos puntos activamos desplazamiento horizontal con eje Y fijo
  const useHorizontalScroll =
    !isHistoryMode && !isInactive && totalPoints > 25;

  // Al cargar una sesión larga o recibir nuevas lecturas estando al final, desplazamos al extremo derecho
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || !useHorizontalScroll) {
      prevCountRef.current = totalPoints;
      return;
    }

    const wasInitialLoad = prevCountRef.current === 0 || Math.abs(totalPoints - prevCountRef.current) > 5;
    const isNearRight = el.scrollWidth - el.clientWidth - el.scrollLeft < 120;

    if (wasInitialLoad || isNearRight) {
      el.scrollLeft = el.scrollWidth;
    }
    prevCountRef.current = totalPoints;
  }, [totalPoints, useHorizontalScroll]);

  const scrollToStart = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  };

  const scrollToEnd = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollWidth,
        behavior: "smooth",
      });
    }
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

  // =========================================================================
  // MODO 1: SESIÓN COMPLETA CON DESPLAZAMIENTO HORIZONTAL + EJE Y FIJO
  // =========================================================================
  if (useHorizontalScroll) {
    const svgHeight = isDesktop ? 290 : 240;
    const chartTop = 24;
    const chartBottom = svgHeight - 42;
    const chartHeight = chartBottom - chartTop;

    const getY = (stability) => {
      const clamped = Math.max(0, Math.min(100, Number(stability) || 0));
      return chartBottom - (clamped / 100) * chartHeight;
    };

    const y100 = getY(100);
    const y80 = getY(80);
    const y50 = getY(50);
    const y0 = getY(0);

    // Espaciado adaptable para que incluso miles de lecturas del día se vean limpias y fluidas
    const pxPerPoint =
      totalPoints <= 250
        ? 22
        : totalPoints <= 1000
          ? 14
          : Math.max(8, Math.floor(20000 / totalPoints));

    const padX = 24;
    const contentWidth = Math.max(
      680,
      padX * 2 + (totalPoints - 1) * pxPerPoint,
    );

    const getX = (index) => padX + index * pxPerPoint;

    const pathString = displayData
      .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.stability)}`)
      .join(" ");

    const areaString = `${pathString} L ${getX(totalPoints - 1)} ${y0} L ${getX(0)} ${y0} Z`;

    // Etiquetas de hora cada ~95px sin superposición
    const labelStep = Math.max(1, Math.ceil(95 / pxPerPoint));
    const shouldShowLabel = (index) => {
      if (index === 0 || index === totalPoints - 1) return true;
      return (
        index % labelStep === 0 &&
        totalPoints - 1 - index >= Math.ceil(labelStep * 0.6)
      );
    };

    const firstTime = displayData[0]?.time || "";
    const lastTime = displayData[totalPoints - 1]?.time || "";

    return (
      <div
        style={{
          width: "100%",
          backgroundColor: "#FFFFFF",
          border: "1px solid #CBD5E1",
          borderRadius: "12px",
          padding: isDesktop ? "12px 14px 10px" : "10px 8px 8px",
          boxSizing: "border-box",
        }}
      >
        {/* Barra guía de desplazamiento horizontal */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "8px",
            paddingBottom: "8px",
            borderBottom: "1px solid #F1F5F9",
            fontSize: "12.5px",
            color: "#475569",
          }}
        >
          <span style={{ fontWeight: "600" }}>
            Sesión completa: <strong>{totalPoints} lecturas</strong> ({firstTime}{" "}
            – {lastTime}) · Desliza horizontalmente
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              onClick={scrollToStart}
              style={{
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: "700",
                borderRadius: "6px",
                border: "1px solid #CBD5E1",
                backgroundColor: "#F8FAFC",
                color: "#334155",
                cursor: "pointer",
              }}
            >
              ← Inicio
            </button>
            <button
              type="button"
              onClick={scrollToEnd}
              style={{
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: "700",
                borderRadius: "6px",
                border: "1px solid #0F766E",
                backgroundColor: "#F0FDFA",
                color: "#0F766E",
                cursor: "pointer",
              }}
            >
              Más reciente →
            </button>
          </div>
        </div>

        {/* Contenedor Flex: Eje Y fijo a la izquierda + área desplazable a la derecha */}
        <div style={{ display: "flex", alignItems: "stretch", width: "100%" }}>
          {/* Eje Y fijo (siempre visible al hacer scroll) */}
          <svg
            width="46"
            height={svgHeight}
            viewBox={`0 0 46 ${svgHeight}`}
            aria-hidden="true"
            style={{ flexShrink: 0, display: "block" }}
          >
            {[
              { value: 100, y: y100, labelColor: "#065F46" },
              { value: 80, y: y80, labelColor: "#047857" },
              { value: 50, y: y50, labelColor: "#B45309" },
              { value: 0, y: y0, labelColor: "#64748B" },
            ].map((tick) => (
              <text
                key={tick.value}
                x="40"
                y={tick.y + 4}
                fill={tick.labelColor}
                fontSize="11.5"
                fontWeight="700"
                textAnchor="end"
              >
                {tick.value}%
              </text>
            ))}
          </svg>

          {/* Zona desplazable horizontalmente */}
          <div
            ref={scrollContainerRef}
            style={{
              flex: 1,
              minWidth: 0,
              overflowX: "auto",
              overflowY: "hidden",
              WebkitOverflowScrolling: "touch",
              paddingBottom: "4px",
            }}
          >
            <svg
              width={contentWidth}
              height={svgHeight}
              viewBox={`0 0 ${contentWidth} ${svgHeight}`}
              role="img"
              aria-label="Gráfico desplazable de telemetría de estabilidad de la sesión completa"
              style={{ display: "block" }}
            >
              <defs>
                <linearGradient
                  id="liveScrollAreaGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#0F766E" stopOpacity="0.26" />
                  <stop offset="100%" stopColor="#0F766E" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Bandas de estabilidad exactas */}
              <rect
                x="0"
                y={y100}
                width={contentWidth}
                height={y80 - y100}
                fill="#ECFDF5"
                opacity="0.75"
              />
              <rect
                x="0"
                y={y80}
                width={contentWidth}
                height={y50 - y80}
                fill="#FFFBEB"
                opacity="0.75"
              />
              <rect
                x="0"
                y={y50}
                width={contentWidth}
                height={y0 - y50}
                fill="#FEF2F2"
                opacity="0.7"
              />

              {/* Líneas horizontales alineadas exactamente con el eje Y fijo */}
              {[
                { value: 100, y: y100, color: "#059669" },
                { value: 80, y: y80, color: "#10B981" },
                { value: 50, y: y50, color: "#D97706" },
                { value: 0, y: y0, color: "#CBD5E1" },
              ].map((tick) => (
                <line
                  key={tick.value}
                  x1="0"
                  y1={tick.y}
                  x2={contentWidth}
                  y2={tick.y}
                  stroke={tick.color}
                  strokeWidth={tick.value === 0 ? "1.5" : "1"}
                  strokeDasharray={tick.value === 0 ? undefined : "4 4"}
                  opacity={tick.value === 0 ? "1" : "0.65"}
                />
              ))}

              {/* Área sombreada y curva continua */}
              <path d={areaString} fill="url(#liveScrollAreaGradient)" />
              <path
                d={pathString}
                fill="none"
                stroke="#0F766E"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Nodos clickeables y etiquetas horarias */}
              {displayData.map((d, i) => {
                const x = getX(i);
                const y = getY(d.stability);
                const isAlert = d.event !== null;
                const selected = isPointSelected(d);
                const pointColor = isAlert
                  ? "#DC2626"
                  : d.statusColor || "#0F766E";
                const showCircle = selected || isAlert || pxPerPoint >= 16;
                const radius = selected ? 6.5 : isAlert ? 5.5 : 3.5;

                return (
                  <g
                    key={d.id || `${d.time}-${i}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => onSelectPoint(d)}
                  >
                    <rect
                      x={x - Math.max(8, pxPerPoint / 2)}
                      y={chartTop}
                      width={Math.max(16, pxPerPoint)}
                      height={chartHeight + 36}
                      fill="transparent"
                    />

                    {selected && (
                      <line
                        x1={x}
                        y1={chartTop}
                        x2={x}
                        y2={y0}
                        stroke="#0F766E"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                        opacity="0.7"
                      />
                    )}

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
                        strokeWidth="1.5"
                      />
                    )}

                    {shouldShowLabel(i) && (
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
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODO 2: HISTÓRICO, SESIONES CORTAS (≤ 25 LECTURAS) O INACTIVO
  // =========================================================================
  const viewWidth = 560;
  const viewHeight = 250;
  const plotLeft = 52;
  const plotRight = 540;
  const plotWidth = plotRight - plotLeft;
  const chartTop = 26;
  const chartBottom = 196;
  const chartHeight = chartBottom - chartTop;

  const getY = (stability) => {
    const clamped = Math.max(0, Math.min(100, Number(stability) || 0));
    return chartBottom - (clamped / 100) * chartHeight;
  };

  const y100 = getY(100);
  const y80 = getY(80);
  const y50 = getY(50);
  const y0 = getY(0);

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

  const pathString = displayData
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getPointX(i)} ${getY(d.stability)}`)
    .join(" ");

  const areaString =
    totalPoints > 1
      ? `${pathString} L ${getPointX(totalPoints - 1)} ${y0} L ${getPointX(0)} ${y0} Z`
      : "";

  const historySlotWidth = plotWidth / Math.max(totalPoints, 1);
  const barWidth = Math.min(48, Math.max(22, historySlotWidth * 0.48));

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

        {/* MODO HISTÓRICO: Barras diarias + línea de tendencia */}
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
                  <rect
                    x={cx - historySlotWidth / 2}
                    y={chartTop - 10}
                    width={historySlotWidth}
                    height={chartHeight + 54}
                    fill={selected ? "rgba(15, 118, 110, 0.06)" : "transparent"}
                    rx="6"
                  />

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

        {/* MODO SESIÓN CORTA (≤ 25 puntos): Curva continua */}
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
              const pointColor = isAlert
                ? "#DC2626"
                : d.statusColor || "#0F766E";
              const radius = selected ? 6.5 : isAlert ? 5.5 : 4;
              const hitWidth =
                totalPoints > 1 ? Math.max(14, plotWidth / totalPoints) : 60;

              return (
                <g
                  key={d.id || `${d.time}-${i}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => onSelectPoint(d)}
                >
                  <rect
                    x={x - hitWidth / 2}
                    y={chartTop}
                    width={hitWidth}
                    height={chartHeight + 36}
                    fill="transparent"
                  />

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

                  {(isAlert || selected) && (
                    <circle
                      cx={x}
                      cy={y}
                      r={radius + 4}
                      fill={isAlert ? "#DC2626" : "#0F766E"}
                      opacity="0.18"
                    />
                  )}

                  <circle
                    cx={x}
                    cy={y}
                    r={radius}
                    fill={pointColor}
                    stroke="#FFFFFF"
                    strokeWidth="1.75"
                  />

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
