import { useIsDesktop } from "../../hooks/useDesktop";

export default function RoomFloorPlan({ zone, hazards }) {
  const isDesktop = useIsDesktop();

  // Definimos los dibujos SVG para cada zona
  const renderRoom = () => {
    switch (zone) {
      case "Sala":
        return (
          <svg viewBox="0 0 200 150" style={{ width: "100%", height: "100%" }}>
            {/* Piso de la sala */}
            <rect
              x="0"
              y="0"
              width="200"
              height="150"
              fill="#F3F4F6"
              stroke="#D1D5DB"
              strokeWidth="2"
            />
            {/* Sillón base */}
            <rect x="50" y="90" width="80" height="40" fill="#9CA3AF" rx="5" />

            {/* Alfombra (A1) */}
            {hazards["A1"] && (
              <g>
                <rect
                  x="60"
                  y="110"
                  width="60"
                  height="10"
                  fill="#F59E0B"
                  transform="rotate(15 90 115)"
                />
                <text
                  x="90"
                  y="105"
                  fill="#B45309"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  Alfombra
                </text>
              </g>
            )}

            {/* Cables (A2) */}
            {hazards["A2"] && (
              <g>
                <path
                  d="M 40 40 Q 100 70 160 40"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="3"
                  strokeDasharray="4"
                />
                <text
                  x="100"
                  y="30"
                  fill="#B91C1C"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  Cables
                </text>
              </g>
            )}

            {/* Sillón bajo (A3) */}
            {hazards["A3"] && (
              <g>
                <rect
                  x="45"
                  y="85"
                  width="90"
                  height="50"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="2"
                />
                <text
                  x="90"
                  y="140"
                  fill="#B91C1C"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  Sillón Bajo
                </text>
              </g>
            )}
          </svg>
        );

      case "Cocina":
        return (
          <svg viewBox="0 0 200 150" style={{ width: "100%", height: "100%" }}>
            <text x="10" y="25" fontSize="16" fontWeight="bold" fill="#9CA3AF">
              {zone}
            </text>
            <rect
              x="0"
              y="0"
              width="200"
              height="150"
              fill="#F3F4F6"
              stroke="#D1D5DB"
              strokeWidth="2"
            />
            <rect x="20" y="20" width="160" height="50" fill="#9CA3AF" rx="2" />{" "}
            {/* Mesón */}
            {hazards["B1"] && (
              <g>
                <ellipse
                  cx="100"
                  cy="110"
                  rx="30"
                  ry="10"
                  fill="#60A5FA"
                  opacity="0.6"
                />
                <text
                  x="100"
                  y="130"
                  fill="#1D4ED8"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  Piso Mojado
                </text>
              </g>
            )}
            {hazards["B3"] && (
              <g>
                <rect
                  x="70"
                  y="110"
                  width="60"
                  height="15"
                  fill="#F59E0B"
                  rx="3"
                />
                <text
                  x="100"
                  y="105"
                  fill="#B45309"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  Alfombrilla
                </text>
              </g>
            )}
          </svg>
        );

      case "Dormitorio":
        return (
          <svg viewBox="0 0 200 150" style={{ width: "100%", height: "100%" }}>
            <text x="10" y="25" fontSize="16" fontWeight="bold" fill="#9CA3AF">
              {zone}
            </text>
            <rect
              x="0"
              y="0"
              width="200"
              height="150"
              fill="#F3F4F6"
              stroke="#D1D5DB"
              strokeWidth="2"
            />
            <rect x="40" y="40" width="120" height="80" fill="#9CA3AF" rx="5" />{" "}
            {/* Cama */}
            {hazards["C1"] && (
              <g>
                <circle cx="170" cy="30" r="10" fill="#FBBF24" />
                <text
                  x="170"
                  y="55"
                  fill="#B45309"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  Luz
                </text>
              </g>
            )}
            {hazards["C3"] && (
              <g>
                <ellipse cx="100" cy="130" rx="20" ry="8" fill="#8B5CF6" />
                <text
                  x="100"
                  y="145"
                  fill="#5B21B6"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  Pantuflas
                </text>
              </g>
            )}
          </svg>
        );

      case "Baño":
        return (
          <svg viewBox="0 0 200 150" style={{ width: "100%", height: "100%" }}>
            <text x="10" y="25" fontSize="16" fontWeight="bold" fill="#9CA3AF">
              {zone}
            </text>
            <rect
              x="0"
              y="0"
              width="200"
              height="150"
              fill="#F3F4F6"
              stroke="#D1D5DB"
              strokeWidth="2"
            />
            <rect
              x="20"
              y="90"
              width="60"
              height="40"
              fill="#E5E7EB"
              stroke="#9CA3AF"
              strokeWidth="2"
            />{" "}
            {/* Ducha */}
            {hazards["D1"] && (
              <g>
                <line
                  x1="20"
                  y1="70"
                  x2="80"
                  y2="70"
                  stroke="#EF4444"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <text
                  x="50"
                  y="60"
                  fill="#B91C1C"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  Barras
                </text>
              </g>
            )}
            {hazards["D2"] && (
              <g>
                <rect
                  x="30"
                  y="100"
                  width="40"
                  height="20"
                  fill="#F59E0B"
                  rx="2"
                  strokeDasharray="2"
                />
                <text
                  x="50"
                  y="115"
                  fill="#B45309"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  Goma
                </text>
              </g>
            )}
          </svg>
        );

      case "Pasillos":
        return (
          <svg viewBox="0 0 200 150" style={{ width: "100%", height: "100%" }}>
            <text x="10" y="25" fontSize="16" fontWeight="bold" fill="#9CA3AF">
              {zone}
            </text>
            <rect
              x="0"
              y="0"
              width="200"
              height="150"
              fill="#F3F4F6"
              stroke="#D1D5DB"
              strokeWidth="2"
            />
            <path
              d="M 20 20 L 180 130"
              fill="none"
              stroke="#9CA3AF"
              strokeWidth="40"
              opacity="0.3"
            />{" "}
            {/* Pasillo */}
            {hazards["E1"] && (
              <g>
                <line
                  x1="80"
                  y1="60"
                  x2="120"
                  y2="100"
                  stroke="#EF4444"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                />
                <text
                  x="100"
                  y="50"
                  fill="#B91C1C"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  Desnivel
                </text>
              </g>
            )}
            {hazards["E3"] && (
              <g>
                <circle cx="160" cy="30" r="15" fill="#4B5563" opacity="0.5" />
                <text
                  x="160"
                  y="55"
                  fill="#374151"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  Penumbra
                </text>
              </g>
            )}
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        aspectRatio: "4/3",
        backgroundColor: "#fff",
        border: "2px solid #E5E7EB",
        borderRadius: "12px",
        padding: "10px",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
        margin: "0 auto",
      }}
    >
      {renderRoom()}
    </div>
  );
}
