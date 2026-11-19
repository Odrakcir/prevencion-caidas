import { useIsDesktop } from "../../hooks/useDesktop";

export default function StabilityChartSvg({
  filteredDataSet,
  graphTimeframe,
  selectedGraphPoint,
  onSelectPoint,
}) {
  const isDesktop = useIsDesktop();
  const isToday = graphTimeframe === "today";

  // Mostramos un máximo de 20 puntos en el gráfico para que no se sature
  const displayData = filteredDataSet.slice(-20);
  const totalPoints = displayData.length;

  // Lógica matemática para distribuir los puntos en el eje X (de 60 a 470)
  const startX = 60;
  const endX = 470;
  const stepX = totalPoints > 1 ? (endX - startX) / (totalPoints - 1) : 0;

  // Calculamos el promedio para la línea de fondo si no hay datos
  const avgStability =
    totalPoints > 0
      ? displayData.reduce((acc, curr) => acc + curr.stability, 0) / totalPoints
      : 100;

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
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0D9488" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0D9488" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Bandas de color de fondo */}
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

        {/* Etiquetas Eje Y */}
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

        {/* TRAZADO DINÁMICO */}
        {displayData.length > 1 && (
          <>
            {/* Área de relleno debajo de la curva */}
            <path
              d={`M ${startX} 195 
                 ${displayData
                   .map((d, i) => {
                     const x = startX + i * stepX;
                     const y = 195 - (d.stability / 100) * 175; // Mapea 0-100% a Y (195-20)
                     return `L ${x} ${y}`;
                   })
                   .join(" ")} 
                 L ${startX + (totalPoints - 1) * stepX} 195 Z`}
              fill="url(#areaGradient)"
            />
            {/* Línea de la curva */}
            <path
              d={`M ${displayData
                .map((d, i) => {
                  const x = startX + i * stepX;
                  const y = 195 - (d.stability / 100) * 175;
                  return `${i === 0 ? "" : "L"} ${x} ${y}`;
                })
                .join(" ")}`}
              fill="none"
              stroke="#0D9488"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {/* NODOS (Puntos clickeables) */}
        {displayData.map((d, i) => {
          const x = startX + i * stepX;
          const y = 195 - (d.stability / 100) * 175;
          const isSelected = selectedGraphPoint?.time === d.time;
          const isAlert = d.event !== null;

          return (
            <g
              key={`${d.time}-${i}`}
              cursor="pointer"
              onClick={() => onSelectPoint(d)}
            >
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
                  ⚠️
                </text>
              )}

              {/* Mostramos la hora solo en algunos puntos para evitar que se superpongan */}
              {(i === 0 ||
                i === totalPoints - 1 ||
                i % Math.ceil(totalPoints / 6) === 0) && (
                <text
                  x={x}
                  y="218"
                  fill={isSelected ? "#0D9488" : "#374151"}
                  fontSize="11"
                  fontWeight={isSelected ? "800" : "700"}
                  textAnchor="middle"
                >
                  {d.time.slice(0, 5)}{" "}
                  {/* Corta los segundos para que se vea más limpio */}
                </text>
              )}
            </g>
          );
        })}

        {/* Mensaje si no hay datos */}
        {displayData.length === 0 && (
          <text
            x="250"
            y="110"
            fill="#9CA3AF"
            fontSize="14"
            fontWeight="600"
            textAnchor="middle"
          >
            Esperando datos de la sesión...
          </text>
        )}
      </svg>
    </div>
  );
}
