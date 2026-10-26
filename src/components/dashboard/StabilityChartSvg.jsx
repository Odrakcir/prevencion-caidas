import { useIsDesktop } from "../../hooks/useDesktop";
import { HOURLY_DATA, WEEKLY_DATA } from "../../constants/surveyData";

export default function StabilityChartSvg({
  filteredDataSet,
  graphTimeframe,
  selectedGraphPoint,
  onSelectPoint,
}) {
  const isDesktop = useIsDesktop();

  const xCoordsHoy = [60, 120, 180, 240, 300, 360, 420, 470];
  const yCoordsHoy = [30, 34, 155, 38, 35, 170, 32, 28];
  const xCoordsSem = [60, 128, 196, 264, 332, 400, 468];
  const yCoordsSem = [32, 38, 142, 28, 45, 35, 28];

  const isToday = graphTimeframe === "today";

  return (
    <div
      style={{
        flex: isDesktop ? "1 1 68%" : "1 1 100%",
        height: isDesktop ? "320px" : "260px",
        backgroundColor: "#FFFFFF",
        border: "2px solid #CBD5E1",
        borderRadius: "12px",
        padding: "16px",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      <svg
        viewBox="0 0 500 230"
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="areaGradientV9" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0D9488" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0D9488" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Bandas de color */}
        <rect
          x="50"
          y="20"
          width="430"
          height="70"
          fill="#ECFDF5"
          opacity="0.8"
        />
        <rect
          x="50"
          y="90"
          width="430"
          height="55"
          fill="#FEF3C7"
          opacity="0.7"
        />
        <rect
          x="50"
          y="145"
          width="430"
          height="50"
          fill="#FEF2F2"
          opacity="0.8"
        />

        {/* Líneas de referencia */}
        <line
          x1="50"
          y1="20"
          x2="480"
          y2="20"
          stroke="#10B981"
          strokeWidth="1.5"
          strokeDasharray="4"
        />
        <line
          x1="50"
          y1="90"
          x2="480"
          y2="90"
          stroke="#F59E0B"
          strokeWidth="1.5"
          strokeDasharray="4"
        />
        <line
          x1="50"
          y1="145"
          x2="480"
          y2="145"
          stroke="#EF4444"
          strokeWidth="1.5"
          strokeDasharray="4"
        />

        {/* Etiquetas eje Y */}
        <text
          x="42"
          y="24"
          fill="#047857"
          fontSize="13"
          fontWeight="800"
          textAnchor="end"
        >
          100%
        </text>
        <text
          x="42"
          y="94"
          fill="#B45309"
          fontSize="13"
          fontWeight="800"
          textAnchor="end"
        >
          50%
        </text>
        <text
          x="42"
          y="149"
          fill="#B91C1C"
          fontSize="13"
          fontWeight="800"
          textAnchor="end"
        >
          0%
        </text>

        {/* Trazado */}
        {isToday ? (
          <>
            <path
              d="M 60 30 L 120 34 L 180 155 L 240 38 L 300 35 L 360 170 L 420 32 L 470 28 L 470 195 L 60 195 Z"
              fill="url(#areaGradientV9)"
            />
            <path
              d="M 60 30 L 120 34 L 180 155 L 240 38 L 300 35 L 360 170 L 420 32 L 470 28"
              fill="none"
              stroke="#0D9488"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : (
          <>
            <path
              d="M 60 32 L 128 38 L 196 142 L 264 28 L 332 45 L 400 35 L 468 28 L 468 195 L 60 195 Z"
              fill="url(#areaGradientV9)"
            />
            <path
              d="M 60 32 L 128 38 L 196 142 L 264 28 L 332 45 L 400 35 L 468 28"
              fill="none"
              stroke="#0D9488"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {/* Nodos */}
        {filteredDataSet.map((d) => {
          const rawIndex = isToday
            ? HOURLY_DATA.findIndex((item) => item.time === d.time)
            : WEEKLY_DATA.findIndex((item) => item.time === d.time);

          const x = isToday ? xCoordsHoy[rawIndex] : xCoordsSem[rawIndex];
          const y = isToday ? yCoordsHoy[rawIndex] : yCoordsSem[rawIndex];
          const isSelected = selectedGraphPoint?.time === d.time;
          const isAlert = d.event !== null;

          return (
            <g key={d.time} cursor="pointer" onClick={() => onSelectPoint(d)}>
              {isSelected && (
                <circle
                  cx={x}
                  cy={y}
                  r="16"
                  fill="none"
                  stroke="#0D9488"
                  strokeWidth="3"
                  strokeDasharray="3"
                />
              )}
              <circle
                cx={x}
                cy={y}
                r={isAlert ? "10" : isSelected ? "9" : "7"}
                fill={isAlert ? "#EF4444" : d.statusColor}
                stroke="#FFFFFF"
                strokeWidth="2.5"
              />
              {isAlert && (
                <text
                  x={x}
                  y={y - 18}
                  fill="#DC2626"
                  fontSize="11"
                  fontWeight="800"
                  textAnchor="middle"
                >
                  ⚠️ Alerta
                </text>
              )}
              <text
                x={x}
                y="218"
                fill={isSelected ? "#0D9488" : "#374151"}
                fontSize="12"
                fontWeight={isSelected ? "800" : "700"}
                textAnchor="middle"
              >
                {d.time}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
