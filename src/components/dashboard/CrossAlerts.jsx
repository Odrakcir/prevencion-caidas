import { useIsDesktop } from "../../hooks/useDesktop";

/**
 * Extrae los minutos transcurridos del día (0..1439) desde item.time ("HH:MM")
 * o, como respaldo, desde item.rawDate (timestamp ISO).
 */
function getMinutesOfDay(item) {
  if (typeof item?.time === "string" && item.time.includes(":")) {
    const [hStr, mStr] = item.time.split(":");
    const hours = parseInt(hStr, 10);
    const minutes = parseInt(mStr, 10) || 0;
    if (!Number.isNaN(hours) && hours >= 0 && hours <= 23) {
      return hours * 60 + Math.max(0, Math.min(59, minutes));
    }
  }

  if (item?.rawDate) {
    const dateObj = new Date(item.rawDate);
    if (!Number.isNaN(dateObj.getTime())) {
      return dateObj.getHours() * 60 + dateObj.getMinutes();
    }
  }

  return null;
}

/**
 * Determina si una lectura ocurrió en horario nocturno (> 20:00 o < 06:00).
 */
function isNightEvent(item) {
  const minutes = getMinutesOfDay(item);
  if (minutes === null) return false;
  return minutes > 20 * 60 || minutes < 6 * 60;
}

export default function CrossAlerts({ telemetryData = [], hazards = {} }) {
  const isDesktop = useIsDesktop();

  const safeTelemetry = Array.isArray(telemetryData) ? telemetryData : [];
  const safeHazards = hazards || {};

  // Filtramos los registros donde el sensor detectó un episodio de inestabilidad
  const instabilityEvents = safeTelemetry.filter(
    (d) => d && d.event !== null && d.event !== undefined,
  );

  if (instabilityEvents.length === 0) return null;

  const nightEvents = instabilityEvents.filter(isNightEvent);
  const recommendations = [];

  // 1. Sugerencia Nocturna (> 20:00 o < 06:00 + iluminación deficiente)
  if (
    nightEvents.length > 0 &&
    safeHazards.iluminacion_deficiente === true
  ) {
    recommendations.push({
      id: "nocturna",
      badge: "Iluminación Nocturna",
      meta: `${nightEvents.length} ${nightEvents.length === 1 ? "registro" : "registros"} entre 20:00 y 06:00`,
      message:
        "Se registraron variaciones de estabilidad durante la noche/madrugada y se reportó poca iluminación. Se recomienda considerar la instalación de luces de paso automáticas.",
    });
  }

  // 2. Sugerencia para el Baño (inestabilidad + ausencia de barras)
  if (safeHazards.ausencia_barras === true) {
    recommendations.push({
      id: "bano",
      badge: "Apoyo en el Baño",
      meta: `${instabilityEvents.length} ${instabilityEvents.length === 1 ? "registro observado" : "registros observados"}`,
      message:
        "Se observaron variaciones de estabilidad y se reportó ausencia de barras de sujeción en el baño. Se recomienda evaluar la instalación de barras de apoyo como medida preventiva.",
    });
  }

  // 3. Sugerencia para Rutas de Paso (inestabilidad + alfombras sueltas u obstáculos)
  if (
    safeHazards.alfombras_sueltas === true ||
    safeHazards.obstaculos_ruta === true
  ) {
    recommendations.push({
      id: "tropiezo",
      badge: "Rutas y Superficies",
      meta: `${instabilityEvents.length} ${instabilityEvents.length === 1 ? "registro observado" : "registros observados"}`,
      message:
        "El sensor registró episodios de inestabilidad y se reportaron alfombras sueltas u obstáculos. Se recomienda despejar las rutas de tránsito y fijar las alfombras al piso.",
    });
  }

  // Si no se cumple ninguna condición de cruce, no renderizamos nada
  if (recommendations.length === 0) return null;

  return (
    <section
      role="region"
      aria-label="Recomendaciones Cruzadas: Telemetría y Entorno"
      style={{
        marginTop: "16px",
        backgroundColor: "#FFFBEB",
        border: "1.5px solid #F59E0B",
        borderLeft: "5px solid #D97706",
        borderRadius: "12px",
        padding: isDesktop ? "18px 20px" : "15px 14px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: isDesktop ? "17.5px" : "16.5px",
            fontWeight: "800",
            color: "#92400E",
            letterSpacing: "-0.01em",
            lineHeight: "1.3",
          }}
        >
          Recomendaciones Cruzadas: Telemetría y Entorno
        </h3>
        <span
          style={{
            backgroundColor: "#B45309",
            color: "#FFFFFF",
            fontSize: "12px",
            fontWeight: "700",
            padding: "3px 10px",
            borderRadius: "999px",
          }}
        >
          {recommendations.length}{" "}
          {recommendations.length === 1 ? "sugerencia" : "sugerencias"}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #FDE68A",
              borderRadius: "10px",
              padding: isDesktop ? "14px 16px" : "12px 14px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "6px",
                marginBottom: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "12.5px",
                  fontWeight: "800",
                  color: "#92400E",
                  backgroundColor: "#FEF3C7",
                  padding: "2px 9px",
                  borderRadius: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                }}
              >
                {rec.badge}
              </span>
              <span
                style={{
                  fontSize: "12.5px",
                  fontWeight: "600",
                  color: "#475569",
                }}
              >
                {rec.meta}
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "15.5px",
                lineHeight: "1.55",
                color: "#0F172A",
                fontWeight: "500",
              }}
            >
              {rec.message}
            </p>
          </div>
        ))}
      </div>

      <p
        style={{
          margin: "12px 0 0 0",
          fontSize: "13px",
          color: "#78350F",
          lineHeight: "1.45",
        }}
      >
        Nota: Estas sugerencias son únicamente de carácter preventivo y
        orientativo a partir del cruce entre los sensores y el cuestionario del
        hogar.
      </p>
    </section>
  );
}
