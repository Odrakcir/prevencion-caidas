import { useIsDesktop } from "../../hooks/useDesktop";

/**
 * Ilustración interactiva y accesible de cada habitación del hogar.
 * - Muestra escenas arquitectónicas reconocibles (pared, piso, mobiliario real).
 * - Los 15 peligros (A1..E3) están siempre representados con pines numerados (1, 2, 3)
 *   sincronizados con la lista de verificación.
 * - Tocar un peligro en el dibujo también lo marca o desmarca.
 */
export default function RoomFloorPlan({
  zone,
  hazards,
  onToggleHazard,
  highlightedId = null,
}) {
  const isDesktop = useIsDesktop();

  const isActive = (id) => Boolean(hazards?.[id]);
  const isFocused = (id) => highlightedId === id;

  const handleInteract = (id) => {
    if (onToggleHazard) onToggleHazard(id);
  };

  // Pin numerado de alto contraste (≥ WCAG AA) con anillo de enfoque y estado
  const renderPin = (id, num, cx, cy, shortLabel, labelPlacement = "bottom") => {
    const active = isActive(id);
    const focused = isFocused(id);

    const fill = active ? "#DC2626" : focused ? "#0F766E" : "#334155";
    const pillBg = active ? "#FEF2F2" : focused ? "#F0FDFA" : "#FFFFFF";
    const pillBorder = active ? "#DC2626" : focused ? "#0F766E" : "#94A3B8";
    const pillText = active ? "#991B1B" : focused ? "#115E59" : "#1E293B";

    const pillW = Math.max(76, shortLabel.length * 6.5 + 16);
    const pillX = Math.max(8, Math.min(412 - pillW, cx - pillW / 2));
    const pillY =
      labelPlacement === "top"
        ? Math.max(8, cy - 39)
        : Math.min(256, cy + 19);

    return (
      <g
        key={id}
        role="button"
        tabIndex={0}
        aria-label={`Peligro ${num}: ${shortLabel}. ${active ? "Marcado" : "Sin marcar"}`}
        style={{ cursor: onToggleHazard ? "pointer" : "default" }}
        onClick={() => handleInteract(id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleInteract(id);
          }
        }}
      >
        {/* Halo visual cuando está activo o resaltado */}
        {(active || focused) && (
          <circle
            cx={cx}
            cy={cy}
            r="21"
            fill={active ? "#DC2626" : "#0F766E"}
            opacity="0.2"
          />
        )}

        {/* Círculo numerado */}
        <circle
          cx={cx}
          cy={cy}
          r="14"
          fill={fill}
          stroke="#FFFFFF"
          strokeWidth="2.5"
        />
        <text
          x={cx}
          y={cy + 4.5}
          fill="#FFFFFF"
          fontSize="13"
          fontWeight="800"
          textAnchor="middle"
        >
          {num}
        </text>

        {/* Etiqueta compacta legible */}
        <rect
          x={pillX}
          y={pillY}
          width={pillW}
          height="21"
          rx="10.5"
          fill={pillBg}
          stroke={pillBorder}
          strokeWidth={active || focused ? "1.8" : "1.2"}
        />
        <text
          x={pillX + pillW / 2}
          y={pillY + 14}
          fill={pillText}
          fontSize="10.5"
          fontWeight="700"
          textAnchor="middle"
        >
          {shortLabel}
        </text>
      </g>
    );
  };

  // Fondo arquitectónico base: pared superior + zócalo + suelo cálido
  const renderRoomBackdrop = (wallColor = "#F8FAFC", floorColor = "#EDE9E0") => (
    <>
      <rect x="0" y="0" width="420" height="170" fill={wallColor} />
      <rect x="0" y="164" width="420" height="8" fill="#CBD5E1" />
      <rect x="0" y="172" width="420" height="118" fill={floorColor} />
      {/* Líneas sutiles de perspectiva en el suelo */}
      <line x1="0" y1="210" x2="420" y2="210" stroke="#DDD6C7" strokeWidth="1" />
      <line x1="0" y1="250" x2="420" y2="250" stroke="#DDD6C7" strokeWidth="1" />
    </>
  );

  const renderRoomScene = () => {
    switch (zone) {
      case "Sala": {
        const a1 = isActive("A1");
        const a2 = isActive("A2");
        const a3 = isActive("A3");
        return (
          <svg
            viewBox="0 0 420 290"
            role="img"
            aria-label="Ilustración interactiva de la Sala con 3 puntos de revisión"
            style={{ width: "100%", height: "100%", display: "block" }}
          >
            {renderRoomBackdrop("#F8FAFC", "#EFECE4")}

            {/* Ventana en la pared */}
            <rect
              x="265"
              y="22"
              width="110"
              height="74"
              rx="4"
              fill="#E0F2FE"
              stroke="#94A3B8"
              strokeWidth="2.5"
            />
            <line x1="320" y1="22" x2="320" y2="96" stroke="#94A3B8" strokeWidth="2" />
            <line x1="265" y1="59" x2="375" y2="59" stroke="#94A3B8" strokeWidth="2" />

            {/* Cuadro decorativo */}
            <rect
              x="76"
              y="32"
              width="68"
              height="44"
              rx="3"
              fill="#FFFFFF"
              stroke="#CBD5E1"
              strokeWidth="2"
            />
            <path d="M 86 66 L 105 48 L 120 60 L 132 52 L 136 66 Z" fill="#CBD5E1" />

            {/* Lámpara de pie a la derecha (origen del cable) */}
            <line x1="358" y1="88" x2="358" y2="188" stroke="#475569" strokeWidth="4" />
            <ellipse cx="358" cy="188" rx="18" ry="5" fill="#475569" />
            <polygon
              points="340,88 376,88 370,62 346,62"
              fill="#FEF3C7"
              stroke="#B45309"
              strokeWidth="1.8"
            />

            {/* A3: Sillón (resaltado si es bajo/blando) */}
            <g
              onClick={() => handleInteract("A3")}
              style={{ cursor: "pointer" }}
            >
              {/* Respaldo */}
              <rect
                x="44"
                y="94"
                width="148"
                height="58"
                rx="10"
                fill={a3 ? "#FEE2E2" : "#CBD5E1"}
                stroke={a3 ? "#DC2626" : "#64748B"}
                strokeWidth={a3 ? "2.5" : "2"}
              />
              {/* Cojín asiento */}
              <rect
                x="56"
                y="134"
                width="124"
                height="26"
                rx="6"
                fill={a3 ? "#FECACA" : "#E2E8F0"}
                stroke={a3 ? "#DC2626" : "#64748B"}
                strokeWidth="2"
              />
              {/* Apoyabrazos */}
              <rect
                x="36"
                y="122"
                width="22"
                height="48"
                rx="6"
                fill={a3 ? "#FCA5A5" : "#94A3B8"}
                stroke={a3 ? "#B91C1C" : "#475569"}
                strokeWidth="1.8"
              />
              <rect
                x="178"
                y="122"
                width="22"
                height="48"
                rx="6"
                fill={a3 ? "#FCA5A5" : "#94A3B8"}
                stroke={a3 ? "#B91C1C" : "#475569"}
                strokeWidth="1.8"
              />
              {/* Patas cortas */}
              <rect x="44" y="170" width="8" height="9" fill="#475569" />
              <rect x="184" y="170" width="8" height="9" fill="#475569" />
              {/* Flechas de asiento hundido/bajo */}
              <path
                d="M 118 118 L 118 134 M 112 128 L 118 135 L 124 128"
                fill="none"
                stroke={a3 ? "#DC2626" : "#64748B"}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            {/* A1: Alfombra suelta con punta levantada */}
            <g
              onClick={() => handleInteract("A1")}
              style={{ cursor: "pointer" }}
            >
              <polygon
                points="58,205 215,205 232,256 42,256"
                fill={a1 ? "#FEF3C7" : "#DCE5E3"}
                stroke={a1 ? "#D97706" : "#64748B"}
                strokeWidth={a1 ? "2.6" : "1.8"}
              />
              {/* Esquina doblada hacia arriba (riesgo de tropiezo) */}
              <polygon
                points="196,205 215,205 224,225 190,222"
                fill={a1 ? "#F59E0B" : "#94A3B8"}
                stroke={a1 ? "#B45309" : "#475569"}
                strokeWidth="1.6"
              />
              <line
                x1="64"
                y1="246"
                x2="218"
                y2="246"
                stroke={a1 ? "#D97706" : "#94A3B8"}
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            </g>

            {/* A2: Cables cruzando la zona de paso */}
            <g
              onClick={() => handleInteract("A2")}
              style={{ cursor: "pointer" }}
            >
              {/* Enchufe pared */}
              <rect
                x="382"
                y="142"
                width="14"
                height="18"
                rx="2"
                fill="#FFFFFF"
                stroke="#64748B"
                strokeWidth="1.5"
              />
              {/* Cable serpenteando en el suelo */}
              <path
                d="M 389 154 C 390 198, 342 204, 322 222 C 302 240, 268 232, 248 212"
                fill="none"
                stroke={a2 ? "#DC2626" : "#475569"}
                strokeWidth={a2 ? "4.5" : "3"}
                strokeLinecap="round"
                strokeDasharray={a2 ? undefined : "6 4"}
              />
              {/* Zapatilla eléctrica en el piso */}
              <rect
                x="278"
                y="214"
                width="34"
                height="12"
                rx="3"
                fill={a2 ? "#FEE2E2" : "#E2E8F0"}
                stroke={a2 ? "#DC2626" : "#475569"}
                strokeWidth="1.8"
              />
            </g>

            {/* Pines numerados */}
            {renderPin("A1", 1, 134, 232, "Alfombra suelta", "bottom")}
            {renderPin("A2", 2, 314, 212, "Cables en paso", "bottom")}
            {renderPin("A3", 3, 118, 96, "Sillón bajo", "top")}
          </svg>
        );
      }

      case "Cocina": {
        const b1 = isActive("B1");
        const b2 = isActive("B2");
        const b3 = isActive("B3");
        return (
          <svg
            viewBox="0 0 420 290"
            role="img"
            aria-label="Ilustración interactiva de la Cocina con 3 puntos de revisión"
            style={{ width: "100%", height: "100%", display: "block" }}
          >
            {renderRoomBackdrop("#F8FAFC", "#EAECEF")}

            {/* Baldosas sutiles en el suelo */}
            {[84, 168, 252, 336].map((x) => (
              <line
                key={x}
                x1={x}
                y1="172"
                x2={x - 16}
                y2="290"
                stroke="#CBD5E1"
                strokeWidth="1"
              />
            ))}

            {/* B2: Muebles altos (almacenamiento en altura) */}
            <g
              onClick={() => handleInteract("B2")}
              style={{ cursor: "pointer" }}
            >
              <rect
                x="44"
                y="18"
                width="176"
                height="58"
                rx="5"
                fill={b2 ? "#FEF3C7" : "#E2E8F0"}
                stroke={b2 ? "#D97706" : "#64748B"}
                strokeWidth={b2 ? "2.6" : "2"}
              />
              <line
                x1="102"
                y1="18"
                x2="102"
                y2="76"
                stroke={b2 ? "#D97706" : "#94A3B8"}
                strokeWidth="1.5"
              />
              <line
                x1="162"
                y1="18"
                x2="162"
                y2="76"
                stroke={b2 ? "#D97706" : "#94A3B8"}
                strokeWidth="1.5"
              />
              {/* Tiradores */}
              <circle cx="94" cy="64" r="2.5" fill="#475569" />
              <circle cx="110" cy="64" r="2.5" fill="#475569" />
              <circle cx="170" cy="64" r="2.5" fill="#475569" />
              {/* Flecha vertical indicando estirarse hacia arriba */}
              <path
                d="M 240 100 L 240 32 M 232 42 L 240 30 L 248 42"
                fill="none"
                stroke={b2 ? "#DC2626" : "#64748B"}
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            {/* Mesón inferior y lavaplatos */}
            <rect
              x="34"
              y="112"
              width="352"
              height="68"
              rx="4"
              fill="#CBD5E1"
              stroke="#64748B"
              strokeWidth="2"
            />
            <rect x="30" y="106" width="360" height="10" rx="3" fill="#94A3B8" />
            {/* Puertas del mueble */}
            <line x1="122" y1="116" x2="122" y2="180" stroke="#64748B" strokeWidth="1.5" />
            <line x1="210" y1="116" x2="210" y2="180" stroke="#64748B" strokeWidth="1.5" />
            <line x1="298" y1="116" x2="298" y2="180" stroke="#64748B" strokeWidth="1.5" />
            {/* Llave del lavaplatos a la derecha */}
            <path
              d="M 326 106 L 326 84 C 326 76, 342 76, 342 86"
              fill="none"
              stroke="#475569"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <ellipse cx="336" cy="108" rx="28" ry="4" fill="#64748B" />

            {/* B1: Charco de agua/grasa junto al lavaplatos */}
            <g
              onClick={() => handleInteract("B1")}
              style={{ cursor: "pointer" }}
            >
              <path
                d="M 272 222 C 266 206, 294 198, 322 204 C 350 202, 376 214, 366 230 C 356 244, 314 246, 286 240 C 272 236, 274 230, 272 222 Z"
                fill={b1 ? "#93C5FD" : "#DBEAFE"}
                stroke={b1 ? "#1D4ED8" : "#60A5FA"}
                strokeWidth={b1 ? "2.6" : "1.8"}
              />
              {/* Gotitas cayendo */}
              <circle cx="338" cy="192" r="3" fill={b1 ? "#2563EB" : "#93C5FD"} />
              <circle cx="328" cy="198" r="2.2" fill={b1 ? "#2563EB" : "#93C5FD"} />
            </g>

            {/* B3: Alfombrilla doblada frente al mesón izquierdo */}
            <g
              onClick={() => handleInteract("B3")}
              style={{ cursor: "pointer" }}
            >
              <polygon
                points="66,204 190,204 202,246 54,246"
                fill={b3 ? "#FEF3C7" : "#E2E8F0"}
                stroke={b3 ? "#D97706" : "#64748B"}
                strokeWidth={b3 ? "2.6" : "1.8"}
              />
              {/* Pliegue levantado */}
              <path
                d="M 164 204 L 190 204 L 198 224 L 160 220 Z"
                fill={b3 ? "#F59E0B" : "#94A3B8"}
                stroke={b3 ? "#B45309" : "#475569"}
                strokeWidth="1.6"
              />
            </g>

            {/* Pines numerados (sin superposición) */}
            {renderPin("B1", 1, 322, 222, "Piso resbaladizo", "bottom")}
            {renderPin("B2", 2, 132, 52, "Muebles altos", "bottom")}
            {renderPin("B3", 3, 126, 224, "Alfombrilla suelta", "bottom")}
          </svg>
        );
      }

      case "Dormitorio": {
        const c1 = isActive("C1");
        const c2 = isActive("C2");
        const c3 = isActive("C3");
        return (
          <svg
            viewBox="0 0 420 290"
            role="img"
            aria-label="Ilustración interactiva del Dormitorio con 3 puntos de revisión"
            style={{ width: "100%", height: "100%", display: "block" }}
          >
            {renderRoomBackdrop(c1 ? "#E2E8F0" : "#F8FAFC", "#EFECE4")}

            {/* Sombra nocturna suave si falta luz nocturna (C1) */}
            {c1 && (
              <rect
                x="0"
                y="0"
                width="420"
                height="290"
                fill="#0F172A"
                opacity="0.14"
                pointerEvents="none"
              />
            )}

            {/* C1: Velador + lámpara nocturna (a la derecha de la cama) */}
            <g
              onClick={() => handleInteract("C1")}
              style={{ cursor: "pointer" }}
            >
              <rect
                x="292"
                y="128"
                width="68"
                height="56"
                rx="5"
                fill="#CBD5E1"
                stroke="#64748B"
                strokeWidth="2"
              />
              <line x1="298" y1="154" x2="354" y2="154" stroke="#64748B" strokeWidth="1.5" />
              <circle cx="326" cy="142" r="3" fill="#475569" />
              <circle cx="326" cy="168" r="3" fill="#475569" />
              {/* Lámpara de velador */}
              <rect x="322" y="106" width="8" height="22" fill="#475569" />
              <polygon
                points="306,106 346,106 338,76 314,76"
                fill={c1 ? "#475569" : "#FEF3C7"}
                stroke={c1 ? "#DC2626" : "#D97706"}
                strokeWidth="2.2"
              />
              {/* Rayos o cruz de apagada */}
              {c1 ? (
                <path
                  d="M 314 82 L 338 100 M 338 82 L 314 100"
                  stroke="#FCA5A5"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              ) : (
                <circle cx="326" cy="60" r="9" fill="#FDE68A" opacity="0.7" />
              )}
            </g>

            {/* C2: Cama (altura adecuada vs muy alta/baja) */}
            <g
              onClick={() => handleInteract("C2")}
              style={{ cursor: "pointer" }}
            >
              {/* Respaldo cama */}
              <rect
                x="36"
                y="68"
                width="20"
                height="122"
                rx="5"
                fill="#94A3B8"
                stroke="#475569"
                strokeWidth="2"
              />
              {/* Almohada */}
              <rect
                x="60"
                y="108"
                width="50"
                height="24"
                rx="8"
                fill="#FFFFFF"
                stroke="#94A3B8"
                strokeWidth="1.8"
              />
              {/* Colchón */}
              <rect
                x="56"
                y="128"
                width="194"
                height="32"
                rx="6"
                fill={c2 ? "#FEE2E2" : "#E0F2FE"}
                stroke={c2 ? "#DC2626" : "#0F766E"}
                strokeWidth={c2 ? "2.6" : "2"}
              />
              {/* Base cama */}
              <rect
                x="56"
                y="160"
                width="194"
                height="22"
                rx="3"
                fill="#CBD5E1"
                stroke="#64748B"
                strokeWidth="2"
              />
              <rect x="236" y="182" width="10" height="16" fill="#475569" />
              {/* Flecha doble de altura cama-suelo */}
              <path
                d="M 264 132 L 264 196 M 258 140 L 264 130 L 270 140 M 258 188 L 264 198 L 270 188"
                fill="none"
                stroke={c2 ? "#DC2626" : "#64748B"}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            {/* C3: Pantuflas abiertas sin talón junto a la cama */}
            <g
              onClick={() => handleInteract("C3")}
              style={{ cursor: "pointer" }}
            >
              {/* Pantufla izquierda */}
              <ellipse
                cx="142"
                cy="228"
                rx="22"
                ry="11"
                fill={c3 ? "#FDE68A" : "#E2E8F0"}
                stroke={c3 ? "#DC2626" : "#64748B"}
                strokeWidth={c3 ? "2.4" : "1.8"}
              />
              <path
                d="M 142 217 C 154 217, 162 222, 162 228 C 162 234, 154 239, 142 239"
                fill={c3 ? "#F59E0B" : "#94A3B8"}
              />
              {/* Pantufla derecha */}
              <ellipse
                cx="196"
                cy="236"
                rx="22"
                ry="11"
                fill={c3 ? "#FDE68A" : "#E2E8F0"}
                stroke={c3 ? "#DC2626" : "#64748B"}
                strokeWidth={c3 ? "2.4" : "1.8"}
              />
              <path
                d="M 196 225 C 208 225, 216 230, 216 236 C 216 242, 208 247, 196 247"
                fill={c3 ? "#F59E0B" : "#94A3B8"}
              />
            </g>

            {/* Pines numerados */}
            {renderPin("C1", 1, 326, 86, "Luz nocturna", "top")}
            {renderPin("C2", 2, 152, 142, "Altura de cama", "top")}
            {renderPin("C3", 3, 170, 232, "Pantuflas abiertas", "bottom")}
          </svg>
        );
      }

      case "Baño": {
        const d1 = isActive("D1");
        const d2 = isActive("D2");
        const d3 = isActive("D3");
        return (
          <svg
            viewBox="0 0 420 290"
            role="img"
            aria-label="Ilustración interactiva del Baño con 3 puntos de revisión"
            style={{ width: "100%", height: "100%", display: "block" }}
          >
            {renderRoomBackdrop("#F0F9FF", "#E2E8F0")}

            {/* Azulejos sutiles en la pared */}
            {[56, 112].map((y) => (
              <line key={y} x1="0" y1={y} x2="420" y2={y} stroke="#E0F2FE" strokeWidth="1.5" />
            ))}

            {/* Cabezal de ducha */}
            <path
              d="M 38 140 L 38 42 L 74 42 L 82 54"
              fill="none"
              stroke="#64748B"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <ellipse cx="84" cy="57" rx="12" ry="5" fill="#475569" />
            {/* Gotitas de ducha */}
            <line x1="78" y1="68" x2="72" y2="92" stroke="#38BDF8" strokeWidth="1.8" strokeDasharray="4 4" />
            <line x1="88" y1="68" x2="86" y2="96" stroke="#38BDF8" strokeWidth="1.8" strokeDasharray="4 4" />
            <line x1="96" y1="68" x2="100" y2="92" stroke="#38BDF8" strokeWidth="1.8" strokeDasharray="4 4" />

            {/* D1: Barra de sujeción en la pared (punteada si falta) */}
            <g
              onClick={() => handleInteract("D1")}
              style={{ cursor: "pointer" }}
            >
              <rect
                x="110"
                y="98"
                width="92"
                height="12"
                rx="6"
                fill={d1 ? "#FEE2E2" : "#E2E8F0"}
                stroke={d1 ? "#DC2626" : "#475569"}
                strokeWidth="2.4"
                strokeDasharray={d1 ? "5 3" : undefined}
              />
              <circle cx="116" cy="104" r="5" fill={d1 ? "#DC2626" : "#64748B"} />
              <circle cx="196" cy="104" r="5" fill={d1 ? "#DC2626" : "#64748B"} />
            </g>

            {/* Inodoro (WC) a la derecha */}
            <g>
              {/* Estanque */}
              <rect
                x="336"
                y="96"
                width="44"
                height="58"
                rx="6"
                fill="#FFFFFF"
                stroke="#64748B"
                strokeWidth="2"
              />
              {/* Taza */}
              <path
                d="M 300 154 L 376 154 L 368 194 C 364 206, 314 206, 308 190 Z"
                fill="#FFFFFF"
                stroke="#64748B"
                strokeWidth="2"
              />
              <rect x="320" y="198" width="40" height="22" rx="4" fill="#F1F5F9" stroke="#64748B" strokeWidth="2" />
            </g>

            {/* Tina / Ducha con borde alto (D3) y fondo interior (D2) */}
            <g>
              {/* Interior de la tina (D2: sin goma antideslizante) */}
              <g
                onClick={() => handleInteract("D2")}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x="44"
                  y="148"
                  width="196"
                  height="38"
                  rx="6"
                  fill={d2 ? "#DBEAFE" : "#F8FAFC"}
                  stroke={d2 ? "#2563EB" : "#94A3B8"}
                  strokeWidth={d2 ? "2.4" : "1.8"}
                />
                {/* Ondas resbaladizas en el piso de la ducha */}
                <path
                  d="M 68 172 Q 86 164 104 172 T 140 172 T 176 172"
                  fill="none"
                  stroke={d2 ? "#DC2626" : "#94A3B8"}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </g>

              {/* Borde frontal alto de la tina (D3) */}
              <g
                onClick={() => handleInteract("D3")}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x="38"
                  y="174"
                  width="208"
                  height="54"
                  rx="8"
                  fill={d3 ? "#FEE2E2" : "#FFFFFF"}
                  stroke={d3 ? "#DC2626" : "#64748B"}
                  strokeWidth={d3 ? "2.8" : "2.2"}
                />
                {/* Flecha de altura del borde */}
                <path
                  d="M 260 176 L 260 226 M 254 184 L 260 174 L 266 184 M 254 218 L 260 228 L 266 218"
                  fill="none"
                  stroke={d3 ? "#DC2626" : "#64748B"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </g>

            {/* Pines numerados */}
            {renderPin("D1", 1, 156, 102, "Falta barra apoyo", "top")}
            {renderPin("D2", 2, 92, 166, "Sin goma ducha", "top")}
            {renderPin("D3", 3, 212, 214, "Borde tina alto", "bottom")}
          </svg>
        );
      }

      case "Pasillos": {
        const e1 = isActive("E1");
        const e2 = isActive("E2");
        const e3 = isActive("E3");
        return (
          <svg
            viewBox="0 0 420 290"
            role="img"
            aria-label="Ilustración interactiva de Pasillos y Escaleras con 3 puntos de revisión"
            style={{ width: "100%", height: "100%", display: "block" }}
          >
            {renderRoomBackdrop(e3 ? "#CBD5E1" : "#F8FAFC", "#EAE6DC")}

            {/* Penumbra general si E3 está marcado */}
            {e3 && (
              <rect
                x="0"
                y="0"
                width="420"
                height="290"
                fill="#0F172A"
                opacity="0.18"
                pointerEvents="none"
              />
            )}

            {/* Puerta al fondo del pasillo */}
            <rect
              x="36"
              y="60"
              width="72"
              height="112"
              rx="3"
              fill="#E2E8F0"
              stroke="#64748B"
              strokeWidth="2"
            />
            <circle cx="96" cy="120" r="3.5" fill="#475569" />

            {/* E3: Ampolleta de techo / iluminación */}
            <g
              onClick={() => handleInteract("E3")}
              style={{ cursor: "pointer" }}
            >
              <line x1="210" y1="0" x2="210" y2="28" stroke="#475569" strokeWidth="3" />
              <circle
                cx="210"
                cy="38"
                r="13"
                fill={e3 ? "#64748B" : "#FDE047"}
                stroke={e3 ? "#DC2626" : "#CA8A04"}
                strokeWidth="2.2"
              />
              {/* Cono de luz */}
              {!e3 && (
                <polygon
                  points="196,50 224,50 276,170 144,170"
                  fill="#FEF9C3"
                  opacity="0.45"
                  pointerEvents="none"
                />
              )}
            </g>

            {/* E2: Escaleras y pasamanos faltante (derecha) */}
            <g
              onClick={() => handleInteract("E2")}
              style={{ cursor: "pointer" }}
            >
              {/* Peldaños */}
              <polygon
                points="232,216 286,216 286,184 338,184 338,152 396,152 396,246 232,246"
                fill="#CBD5E1"
                stroke="#475569"
                strokeWidth="2"
              />
              {/* Pasamanos punteado en pared/borde */}
              <line
                x1="242"
                y1="168"
                x2="388"
                y2="104"
                stroke={e2 ? "#DC2626" : "#64748B"}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={e2 ? "7 5" : undefined}
              />
              <line x1="254" y1="163" x2="254" y2="216" stroke={e2 ? "#DC2626" : "#94A3B8"} strokeWidth="2.5" strokeDasharray={e2 ? "4 3" : undefined} />
              <line x1="364" y1="115" x2="364" y2="152" stroke={e2 ? "#DC2626" : "#94A3B8"} strokeWidth="2.5" strokeDasharray={e2 ? "4 3" : undefined} />
            </g>

            {/* E1: Desnivel / grada sin señalizar en el suelo del pasillo */}
            <g
              onClick={() => handleInteract("E1")}
              style={{ cursor: "pointer" }}
            >
              <polygon
                points="32,216 232,216 232,246 32,246"
                fill={e1 ? "#FEF3C7" : "#DDD6C7"}
                stroke={e1 ? "#D97706" : "#94A3B8"}
                strokeWidth={e1 ? "2.4" : "1.5"}
              />
              {/* Borde del desnivel */}
              <line
                x1="158"
                y1="184"
                x2="136"
                y2="252"
                stroke={e1 ? "#DC2626" : "#64748B"}
                strokeWidth={e1 ? "4.5" : "2.8"}
                strokeDasharray="6 4"
              />
            </g>

            {/* Pines numerados */}
            {renderPin("E1", 1, 146, 220, "Desnivel sin marca", "bottom")}
            {renderPin("E2", 2, 322, 134, "Sin pasamanos", "top")}
            {renderPin("E3", 3, 210, 42, "Luz muy tenue", "bottom")}
          </svg>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#FFFFFF",
        border: "1.5px solid #CBD5E1",
        borderRadius: "14px",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 14px",
          backgroundColor: "#F8FAFC",
          borderBottom: "1px solid #E2E8F0",
          fontSize: "13px",
          fontWeight: "700",
          color: "#334155",
        }}
      >
        <span>Guía Visual — {zone}</span>
        <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>
          Toca un número para marcar
        </span>
      </div>

      <div
        style={{
          width: "100%",
          aspectRatio: isDesktop ? "420 / 290" : "420 / 300",
          padding: "8px",
          boxSizing: "border-box",
          backgroundColor: "#FFFFFF",
        }}
      >
        {renderRoomScene()}
      </div>
    </div>
  );
}
