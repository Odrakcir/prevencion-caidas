import Button from "../common/Button";
import { useIsDesktop } from "../../hooks/useDesktop";
import { ENVIRONMENTAL_HAZARDS } from "../../constants/surveyData";

const RECOMMENDATIONS_MAP = {
  A1: "Fijar las alfombras sueltas con cinta antideslizante o retirarlas de las zonas de paso.",
  A2: "Ordenar los cables de lámparas y extensiones, manteniéndolos pegados a la pared.",
  A3: "Evitar sillones demasiado blandos; usar un cojín firme para facilitar el levantamiento.",
  B1: "Limpiar inmediatamente los derrames de agua o grasa y usar calzado antideslizante.",
  B2: "Bajar los utensilios y alimentos de uso diario a estantes a la altura de la cintura.",
  B3: "Retirar los paños o secapiés del suelo que puedan doblarse.",
  C1: "Instalar luces nocturnas automáticas en el trayecto de la cama al baño.",
  C2: "Ajustar la altura de la cama para que ambos pies toquen firmemente el suelo.",
  C3: "Usar pantuflas cerradas con talón o caminar con calcetines antideslizantes.",
  D1: "Instalar barras de sujeción firmes a 80–90 cm del suelo junto al inodoro y en la ducha.",
  D2: "Colocar una goma de succión antideslizante dentro de la ducha.",
  D3: "Si la tina es muy alta, considerar una silla de ducha o un banco de transferencia.",
  E1: "Señalizar los desniveles con cinta reflectante de alto contraste.",
  E2: "Asegurar que las escaleras tengan pasamanos firme a ambos lados.",
  E3: "Mejorar la iluminación de pasillos y colocar interruptores de fácil acceso.",
};

export default function PrintModal({
  show,
  onClose,
  patient,
  risk,
  hazards,
  contact,
  metrics,
}) {
  const isDesktop = useIsDesktop();
  if (!show) return null;

  const safeHazards = hazards || {};
  const safeRisk = risk || { stars: 5, safetyLabel: "Sin evaluación" };

  // Agrupamos los factores activos por habitación para un Plan de Acción claro y ordenado
  const activeItems = ENVIRONMENTAL_HAZARDS.filter((h) => safeHazards[h.id]);
  const groupedByZone = activeItems.reduce((acc, item) => {
    if (!acc[item.zone]) acc[item.zone] = [];
    acc[item.zone].push(item);
    return acc;
  }, {});
  const zonesList = Object.keys(groupedByZone);

  const hasTelemetryMetrics = Boolean(
    metrics &&
      (metrics.avgStability > 0 ||
        metrics.avgTilt > 0 ||
        metrics.avgAccel > 0 ||
        metrics.avgCadence > 0),
  );

  const participantName = patient
    ? `${patient.nombres || ""} ${patient.apellidos || ""}`.trim()
    : "Participante Registrado";

  const handlePrintPdf = () => {
    const reportNode = document.getElementById("print-section");
    if (!reportNode) return;

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
          <title>Ficha Preventiva — Hogar Seguro</title>
          <style>
            * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body { font-family: 'Segoe UI', -apple-system, Roboto, sans-serif; color: #0F172A; margin: 16px; line-height: 1.5; }
            .keep-together { page-break-inside: avoid; break-inside: avoid; }
            @media print {
              @page { margin: 14mm; size: A4; }
            }
          </style>
        </head>
        <body>
          ${reportNode.innerHTML}
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
    }, 450);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Vista previa de Ficha Preventiva PDF"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: isDesktop ? "24px" : "10px",
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: isDesktop ? "34px 38px" : "18px 16px",
          maxWidth: "820px",
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          fontFamily:
            '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif',
          color: "#0F172A",
          boxShadow: "0 20px 40px rgba(15, 23, 42, 0.25)",
        }}
      >
        {/* CONTENIDO IMPRIMIBLE */}
        <div id="print-section">
          {/* 1. ENCABEZADO */}
          <div
            style={{
              borderBottom: "2px solid #0F766E",
              paddingBottom: "14px",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "10px",
              }}
            >
              <img
                src="/logo-utem.png"
                alt="Logo institucional"
                style={{
                  width: "125px",
                  height: "auto",
                  objectFit: "contain",
                }}
              />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#0F766E",
                  backgroundColor: "#F0FDFA",
                  border: "1px solid #99F6E4",
                  padding: "4px 10px",
                  borderRadius: "999px",
                }}
              >
                Asistente Hogar Seguro · Proyecto Universitario
              </span>
            </div>

            <h1
              style={{
                fontSize: isDesktop ? "22px" : "19px",
                fontWeight: "800",
                color: "#0F766E",
                margin: "0 0 10px 0",
                lineHeight: "1.25",
              }}
            >
              Ficha de Orientación Preventiva y Adaptación del Hogar
            </h1>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "8px",
                fontSize: "14px",
                color: "#1E293B",
                fontWeight: "500",
              }}
            >
              <span>
                <strong>Participante:</strong> {participantName}
                {patient?.rut ? ` (${patient.rut})` : ""}
              </span>
              <span>
                <strong>Fecha:</strong> {new Date().toLocaleDateString("es-CL")}
              </span>
            </div>
            {contact?.name && (
              <div
                style={{
                  fontSize: "13.5px",
                  color: "#475569",
                  marginTop: "4px",
                }}
              >
                <strong>Red de apoyo:</strong> {contact.name}{" "}
                {contact.phone ? `· ${contact.phone}` : ""}
              </div>
            )}
          </div>

          {/* AVISO ÉTICO */}
          <div
            style={{
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              padding: "11px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#334155",
              marginBottom: "22px",
              fontStyle: "italic",
              lineHeight: "1.5",
            }}
          >
            "Este reporte ha sido generado automáticamente por el Asistente
            'Hogar Seguro' (PWA + IoT) con fines exclusivamente educativos,
            ergonómicos y preventivos. No constituye un diagnóstico médico ni
            reemplaza la evaluación de un profesional de la salud."
          </div>

          {/* 2. NIVEL DE PROTECCIÓN */}
          <div
            className="keep-together"
            style={{
              textAlign: "center",
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "12px",
              padding: "18px",
              marginBottom: "24px",
            }}
          >
            <h2
              style={{
                fontSize: "17px",
                fontWeight: "800",
                color: "#0F172A",
                margin: "0 0 6px 0",
              }}
            >
              Nivel de Protección del Hogar
            </h2>
            <div
              style={{
                fontSize: "42px",
                letterSpacing: "6px",
                marginBottom: "4px",
              }}
            >
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  style={{ color: i < safeRisk.stars ? "#FBBF24" : "#CBD5E1" }}
                >
                  ★
                </span>
              ))}
            </div>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "800",
                color:
                  safeRisk.stars >= 4
                    ? "#065F46"
                    : safeRisk.stars === 3
                      ? "#B45309"
                      : "#991B1B",
                margin: "0 0 6px 0",
              }}
            >
              {safeRisk.safetyLabel} ({safeRisk.stars}/5)
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#334155",
                fontWeight: "600",
                margin: 0,
              }}
            >
              Factores de entorno identificados: {activeItems.length} de 15.
            </p>
          </div>

          {/* 3. PLAN DE ACCIÓN AGRUPADO POR HABITACIÓN */}
          <div style={{ marginBottom: "24px" }}>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "800",
                color: "#0F172A",
                borderBottom: "2px solid #E2E8F0",
                paddingBottom: "8px",
                margin: "0 0 14px 0",
              }}
            >
              Plan de Adaptación del Hogar por Habitación
            </h2>

            {zonesList.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {zonesList.map((zone) => (
                  <div
                    key={zone}
                    className="keep-together"
                    style={{
                      backgroundColor: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderLeft: "4px solid #0F766E",
                      borderRadius: "10px",
                      padding: "12px 14px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "800",
                        color: "#0F766E",
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                        marginBottom: "8px",
                      }}
                    >
                      {zone} ({groupedByZone[zone].length})
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {groupedByZone[zone].map((item) => (
                        <div
                          key={item.id}
                          style={{
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            borderRadius: "8px",
                            padding: "10px 12px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "14.5px",
                              fontWeight: "700",
                              color: "#0F172A",
                              marginBottom: "4px",
                            }}
                          >
                            {item.label}
                          </div>
                          <div
                            style={{
                              fontSize: "14px",
                              color: "#334155",
                              lineHeight: "1.45",
                            }}
                          >
                            <strong style={{ color: "#0F766E" }}>
                              Solución sugerida:
                            </strong>{" "}
                            {RECOMMENDATIONS_MAP[item.id]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p
                style={{
                  fontSize: "15px",
                  color: "#065F46",
                  fontWeight: "700",
                  backgroundColor: "#ECFDF5",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: "1px solid #A7F3D0",
                }}
              >
                No se detectaron factores de riesgo ambiental. Excelente entorno
                preventivo.
              </p>
            )}
          </div>

          {/* 4. TELEMETRÍA (Solo si existen sesiones registradas) */}
          <div className="keep-together" style={{ marginBottom: "24px" }}>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "800",
                color: "#0F172A",
                borderBottom: "2px solid #E2E8F0",
                paddingBottom: "8px",
                margin: "0 0 14px 0",
              }}
            >
              Resumen de Telemetría de Marcha
            </h2>

            {hasTelemetryMetrics ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isDesktop
                    ? "repeat(4, 1fr)"
                    : "repeat(2, 1fr)",
                  gap: "12px",
                  backgroundColor: "#F8FAFC",
                  padding: "14px",
                  borderRadius: "10px",
                  border: "1px solid #E2E8F0",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "#475569", fontWeight: "700" }}>
                    ESTABILIDAD PROM.
                  </p>
                  <strong style={{ fontSize: "20px", color: "#0F766E" }}>
                    {metrics.avgStability}%
                  </strong>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "#475569", fontWeight: "700" }}>
                    INCLINACIÓN PROM.
                  </p>
                  <strong style={{ fontSize: "20px", color: "#0F766E" }}>
                    {metrics.avgTilt}°
                  </strong>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "#475569", fontWeight: "700" }}>
                    ACELERACIÓN MEDIA
                  </p>
                  <strong style={{ fontSize: "20px", color: "#0F766E" }}>
                    {metrics.avgAccel} G
                  </strong>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "#475569", fontWeight: "700" }}>
                    CADENCIA PROM.
                  </p>
                  <strong style={{ fontSize: "20px", color: "#0F766E" }}>
                    {metrics.avgCadence} p/min
                  </strong>
                </div>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: "#F8FAFC",
                  border: "1px dashed #CBD5E1",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  fontSize: "14px",
                  color: "#475569",
                }}
              >
                Sin sesiones de sensores registradas aún. Cuando se realice una
                prueba con el dispositivo de marcha, los promedios aparecerán en
                esta sección.
              </div>
            )}
          </div>

          {/* 5. COMPROMISOS FAMILIARES */}
          {activeItems.length > 0 && (
            <div
              className="keep-together"
              style={{
                backgroundColor: "#F0FDFA",
                padding: "16px 18px",
                borderRadius: "10px",
                border: "1px solid #99F6E4",
              }}
            >
              <h3
                style={{
                  fontSize: "17px",
                  fontWeight: "800",
                  color: "#0F766E",
                  margin: "0 0 8px 0",
                }}
              >
                Primeros Pasos Sugeridos con la Familia
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#1E293B",
                  margin: "0 0 10px 0",
                }}
              >
                Comparte esta ficha con tu red de apoyo para priorizar las
                siguientes mejoras iniciales:
              </p>
              <ul
                style={{
                  listStyleType: "none",
                  padding: 0,
                  margin: 0,
                  fontSize: "14.5px",
                  fontWeight: "600",
                  color: "#0F172A",
                }}
              >
                {activeItems.slice(0, 3).map((item) => (
                  <li key={item.id} style={{ marginBottom: "6px" }}>
                    ☐ <strong>{item.zone}:</strong>{" "}
                    {RECOMMENDATIONS_MAP[item.id]}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div
          style={{
            marginTop: "24px",
            display: "flex",
            flexDirection: isDesktop ? "row" : "column-reverse",
            gap: "10px",
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="back"
            onClick={onClose}
            fullWidth={!isDesktop}
            style={{ width: isDesktop ? "auto" : "100%" }}
          >
            Cerrar
          </Button>
          <Button
            variant="primary"
            onClick={handlePrintPdf}
            fullWidth={!isDesktop}
            style={{ width: isDesktop ? "auto" : "100%" }}
          >
            Imprimir / Guardar en PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
