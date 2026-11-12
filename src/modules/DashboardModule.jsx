import { getStyles } from "../styles/theme";
import { useIsDesktop } from "../hooks/useDesktop";
import { useTelemetry } from "../hooks/useTelemetry";
import Button from "../components/common/Button";
import RiskBadge from "../components/common/RiskBadge";
import StabilityChart from "../components/dashboard/StabilityChart";
import SensorCard from "../components/dashboard/SensorCard";
import PrintModal from "../components/dashboard/PrintModal";
import { HOURLY_DATA, WEEKLY_DATA } from "../constants/surveyData";
import { useState } from "react";

export default function DashboardView({
  risk,
  morseScore,
  selectedHazardsCount,
  contact,
  hazards,
  onReset,
}) {
  const isDesktop = useIsDesktop();
  const styles = getStyles(isDesktop);
  const { simMode, setSimMode, simData } = useTelemetry();

  const [graphTimeframe, setGraphTimeframe] = useState("today");
  const [graphFilter, setGraphFilter] = useState("all");
  const [selectedGraphPoint, setSelectedGraphPoint] = useState(
    HOURLY_DATA[HOURLY_DATA.length - 1],
  );
  const [showPrintModal, setShowPrintModal] = useState(false);

  return (
    <section>
      <StabilityChart
        graphTimeframe={graphTimeframe}
        setGraphTimeframe={setGraphTimeframe}
        graphFilter={graphFilter}
        setGraphFilter={setGraphFilter}
        selectedGraphPoint={selectedGraphPoint}
        setSelectedGraphPoint={setSelectedGraphPoint}
      />

      <div style={isDesktop ? styles.desktopGrid : {}}>
        {/* Columna 1 */}
        <div>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <span style={styles.statusDot("#0D9488")} />
              Perfil del Usuario y Red de Apoyo
            </h3>
            <p style={{ margin: "6px 0", fontSize: "16px" }}>
              <strong>Usuario:</strong> Adulto Mayor Registrado
            </p>
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

          <div
            style={{
              ...styles.card,
              border: "2px dashed #0D9488",
              backgroundColor: "#F0FDFA",
            }}
          >
            <h3
              style={{
                ...styles.cardTitle,
                fontSize: "16px",
                color: "#0D9488",
              }}
            >
              Simulador de Estado de Marcha (ESP32)
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#374151",
                marginBottom: "10px",
              }}
            >
              Alterne la actividad para probar cómo responden los nodos de
              hardware:
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <Button
                fullWidth={false}
                style={{
                  margin: 0,
                  minHeight: "42px",
                  fontSize: "14px",
                  flex: 1,
                  backgroundColor:
                    simMode === "standing" ? "#0D9488" : "#E5E7EB",
                  color: simMode === "standing" ? "#FFFFFF" : "#374151",
                }}
                onClick={() => setSimMode("standing")}
              >
                Estático
              </Button>
              <Button
                fullWidth={false}
                style={{
                  margin: 0,
                  minHeight: "42px",
                  fontSize: "14px",
                  flex: 1,
                  backgroundColor:
                    simMode === "walking" ? "#0D9488" : "#E5E7EB",
                  color: simMode === "walking" ? "#FFFFFF" : "#374151",
                }}
                onClick={() => setSimMode("walking")}
              >
                Caminando
              </Button>
            </div>
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
                borderTop: "2px solid #E5E7EB",
                paddingTop: "12px",
                marginTop: "12px",
                fontSize: "15px",
              }}
            >
              <p style={{ margin: "4px 0" }}>
                Puntaje Escala de Morse: <strong>{morseScore} / 125 pts</strong>
              </p>
              <p style={{ margin: "4px 0" }}>
                Peligros del Hogar:{" "}
                <strong>{selectedHazardsCount} identificados</strong>
              </p>
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={{ ...styles.cardTitle, color: "#0D9488" }}>
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
              {hazards.rugs && (
                <li style={{ marginBottom: "8px" }}>
                  <strong>Alfombras:</strong> Fijar o retirar alfombras sueltas
                  en zonas de tránsito.
                </li>
              )}
              {hazards.lighting && (
                <li style={{ marginBottom: "8px" }}>
                  <strong>Iluminación:</strong> Instalar luces automáticas
                  nocturnas en pasillos.
                </li>
              )}
              {hazards.bars && (
                <li style={{ marginBottom: "8px" }}>
                  <strong>Sujeciones:</strong> Instalar barras firmes en WC y
                  ducha.
                </li>
              )}
              {hazards.obstacles && (
                <li style={{ marginBottom: "8px" }}>
                  <strong>Rutas Libres:</strong> Mantener suelos despejados de
                  cables y objetos.
                </li>
              )}
              {selectedHazardsCount === 0 && (
                <li style={{ marginBottom: "8px" }}>
                  Espacios del hogar ordenados y libres de obstáculos
                  identificados.
                </li>
              )}
            </ul>
          </div>

          <div style={styles.card}>
            <h3 style={{ ...styles.cardTitle, fontSize: "17px" }}>
              Monitores Físicos en Tiempo Real
            </h3>

            <SensorCard
              title="Nodo Lumbar (MPU6050)"
              value={`${simData.tilt}° Inclinación`}
              subtitle={`Aceleración: ${simData.accelY} G`}
            />
            <SensorCard
              title="Nodo Plantar (FSR406)"
              value={`${simData.fsrPressure}% Fuerza`}
              subtitle={`Estado: ${simData.gaitPhase}`}
              isLast
            />
          </div>
        </div>
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
        risk={risk}
        morseScore={morseScore}
        selectedHazardsCount={selectedHazardsCount}
        contact={contact}
      />
    </section>
  );
}
