import { getStyles } from "../styles/theme";
import { useIsDesktop } from "../hooks/useDesktop";
import Button from "../components/common/Button";
import RiskBadge from "../components/common/RiskBadge";
import StabilityChart from "../components/dashboard/StabilityChart";
import PrintModal from "../components/dashboard/PrintModal";
import { useState } from "react";

export default function DashboardView({
  risk,
  morseScore,
  selectedHazardsCount,
  contact,
  hazards,
  userProfile,
  userContext,
  onReset,
}) {
  const isDesktop = useIsDesktop();
  const styles = getStyles(isDesktop);

  const [graphTimeframe, setGraphTimeframe] = useState("today");
  const [graphFilter, setGraphFilter] = useState("all");
  const [selectedGraphPoint, setSelectedGraphPoint] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Si el usuario tiene sesiones reales en Supabase, las conectamos al gráfico
  const activeChartSessionId =
    graphTimeframe === "weekly"
      ? userContext?.allSessionIds?.length > 0
        ? userContext.allSessionIds
        : null
      : userContext?.latestSessionId || null;

  // Combinamos los peligros marcados en la encuesta actual con el último registro guardado en Supabase
  const hasCurrentSurveyHazards = selectedHazardsCount > 0;
  const saved = userContext?.savedHazards;
  const mappedHazards = hasCurrentSurveyHazards
    ? {
        iluminacion_deficiente: Boolean(hazards?.C1 || hazards?.E3),
        alfombras_sueltas: Boolean(hazards?.A1 || hazards?.B3),
        ausencia_barras: Boolean(hazards?.D1 || hazards?.D2),
        obstaculos_ruta: Boolean(hazards?.A2 || hazards?.E1 || hazards?.E2),
      }
    : {
        iluminacion_deficiente: Boolean(saved?.iluminacion_deficiente),
        alfombras_sueltas: Boolean(saved?.alfombras_sueltas),
        ausencia_barras: Boolean(saved?.ausencia_barras),
        obstaculos_ruta: Boolean(saved?.obstaculos_ruta),
      };

  const hasAnyMappedHazard =
    mappedHazards.alfombras_sueltas ||
    mappedHazards.iluminacion_deficiente ||
    mappedHazards.ausencia_barras ||
    mappedHazards.obstaculos_ruta;

  const fullName = userProfile
    ? `${userProfile.nombres} ${userProfile.apellidos}`.trim()
    : "Participante Registrado";

  return (
    <section>
      <StabilityChart
        sessionId={activeChartSessionId}
        graphTimeframe={graphTimeframe}
        setGraphTimeframe={setGraphTimeframe}
        graphFilter={graphFilter}
        setGraphFilter={setGraphFilter}
        selectedGraphPoint={selectedGraphPoint}
        setSelectedGraphPoint={setSelectedGraphPoint}
        hazards={mappedHazards}
      />

      <div style={isDesktop ? styles.desktopGrid : {}}>
        {/* Columna 1 */}
        <div>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <span style={styles.statusDot("#0F766E")} />
              Perfil del Usuario y Red de Apoyo
            </h3>
            <p style={{ margin: "6px 0", fontSize: "16px" }}>
              <strong>Usuario:</strong> {fullName}
            </p>
            {userProfile?.rut && (
              <p style={{ margin: "6px 0", fontSize: "15.5px", color: "#475569" }}>
                <strong>RUT:</strong> {userProfile.rut}
              </p>
            )}
            <p style={{ margin: "6px 0", fontSize: "16px" }}>
              <strong>Contacto Familiar:</strong>{" "}
              {contact.name || "Sin registrar"}
            </p>
            <p
              style={{
                margin: "6px 0",
                fontSize: "16px",
                color: "#4B5563",
              }}
            >
              <strong>Teléfono Móvil:</strong> {contact.phone || "N/A"}
            </p>
            <Button
              variant="secondary"
              style={{ marginTop: "14px", fontSize: "15px" }}
              onClick={() => setShowPrintModal(true)}
            >
              Generar Ficha Imprimible
            </Button>
          </div>
        </div>

        {/* Columna 2 */}
        <div>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <span style={styles.statusDot(risk.color)} />
              Estado de Seguridad Global
            </h3>
            <RiskBadge color={risk.color} label={risk.label} />
            <p
              style={{
                ...styles.text,
                fontSize: "16px",
                marginTop: "10px",
              }}
            >
              {risk.desc}
            </p>
            <div
              style={{
                borderTop: "1px solid #E2E8F0",
                paddingTop: "12px",
                marginTop: "12px",
                fontSize: "15px",
              }}
            >
              <p style={{ margin: "4px 0" }}>
                Puntaje Escala de Morse: <strong>{morseScore} / 125 pts</strong>
              </p>
              <p style={{ margin: "4px 0" }}>
                Factores del Hogar:{" "}
                <strong>{selectedHazardsCount} identificados</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Adaptación Recomendada del Hogar (ancho completo equilibrado) */}
      <div style={styles.card}>
        <h3 style={{ ...styles.cardTitle, color: "#0F766E" }}>
          Adaptación Recomendada del Hogar
        </h3>
        <ul
          style={{
            paddingLeft: "20px",
            fontSize: "16px",
            lineHeight: "1.6",
            margin: 0,
          }}
        >
          {mappedHazards.alfombras_sueltas && (
            <li style={{ marginBottom: "8px" }}>
              <strong>Alfombras:</strong> Fijar o retirar alfombras sueltas en
              zonas de tránsito.
            </li>
          )}
          {mappedHazards.iluminacion_deficiente && (
            <li style={{ marginBottom: "8px" }}>
              <strong>Iluminación:</strong> Instalar luces automáticas nocturnas
              en pasillos.
            </li>
          )}
          {mappedHazards.ausencia_barras && (
            <li style={{ marginBottom: "8px" }}>
              <strong>Sujeciones:</strong> Instalar barras firmes en WC y ducha.
            </li>
          )}
          {mappedHazards.obstaculos_ruta && (
            <li style={{ marginBottom: "8px" }}>
              <strong>Rutas Libres:</strong> Mantener suelos despejados de
              cables y objetos.
            </li>
          )}
          {!hasAnyMappedHazard && (
            <li style={{ marginBottom: "8px" }}>
              Espacios del hogar ordenados y libres de obstáculos identificados.
            </li>
          )}
        </ul>
      </div>

      <div
        style={{
          marginTop: "20px",
          maxWidth: isDesktop ? "480px" : "100%",
          margin: isDesktop ? "20px auto 0" : "20px 0 0",
        }}
      >
        <Button
          variant="primary"
          onClick={() => {
            const msg = `Hola ${contact.name}, informe de seguridad del Asistente Hogar Seguro. Estado: ${risk.label}. Se detectaron ${selectedHazardsCount} factores de riesgo en la vivienda.`;
            window.open(
              `https://api.whatsapp.com/send?phone=${contact.phone}&text=${encodeURIComponent(msg)}`,
            );
          }}
        >
          Compartir Reporte por WhatsApp
        </Button>
        <Button variant="back" style={{ marginTop: "10px" }} onClick={onReset}>
          Reiniciar Evaluación
        </Button>
      </div>

      <PrintModal
        show={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        patient={userProfile}
        risk={risk}
        hazards={hazards}
        contact={contact}
        metrics={null}
      />
    </section>
  );
}
