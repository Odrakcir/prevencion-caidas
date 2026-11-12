import { getStyles } from "../styles/theme";
import { useIsDesktop } from "../hooks/useDesktop";
import Button from "../components/common/Button";
import RiskBadge from "../components/common/RiskBadge";

export default function RecommendationsView({
  risk,
  morseScore,
  selectedHazardsCount,
  contact,
  hazards,
  onReset,
}) {
  const isDesktop = useIsDesktop();
  const styles = getStyles(isDesktop);

  return (
    <section style={{ maxWidth: "720px", margin: "0 auto" }}>
      <div style={styles.card}>
        <h2
          style={{
            fontSize: "22px",
            fontWeight: "800",
            color: "#111827",
            margin: "0 0 12px 0",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={styles.statusDot(risk.color)} />
          Estado de Seguridad e Informe
        </h2>
        <RiskBadge color={risk.color} label={risk.label} />
        <p
          style={{
            ...styles.text,
            fontSize: "18px",
            marginTop: "12px",
            fontWeight: "500",
          }}
        >
          {risk.desc}
        </p>
        <div
          style={{
            borderTop: "2px solid #E5E7EB",
            paddingTop: "12px",
            marginTop: "12px",
            fontSize: "16px",
            color: "#374151",
          }}
        >
          <p style={{ margin: "4px 0" }}>
            • Puntaje Escala de Morse: <strong>{morseScore} / 125 pts</strong>
          </p>
          <p style={{ margin: "4px 0" }}>
            • Peligros del Hogar Identificados:{" "}
            <strong>{selectedHazardsCount} de 4</strong>
          </p>
          <p style={{ margin: "4px 0" }}>
            • Contacto de Apoyo Registrado:{" "}
            <strong>
              {contact.name || "Familiar / Cuidador"} ({contact.phone || "N/A"})
            </strong>
          </p>
        </div>
      </div>

      <div
        style={{
          ...styles.card,
          border: "3px solid #0D9488",
          backgroundColor: "#FFFFFF",
        }}
      >
        <h2
          style={{
            fontSize: "22px",
            fontWeight: "800",
            color: "#0D9488",
            margin: "0 0 16px 0",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "24px" }}>🏡</span>
          Recomendaciones Personalizadas para el Hogar
        </h2>

        <p
          style={{
            fontSize: "17px",
            color: "#374151",
            marginBottom: "16px",
            lineHeight: "1.6",
          }}
        >
          Basado en su evaluación de salud y los factores observados en su
          vivienda, le sugerimos aplicar las siguientes medidas para mantener un
          entorno seguro y prevenir tropiezos:
        </p>

        <ul
          style={{
            paddingLeft: "24px",
            fontSize: "18px",
            lineHeight: "1.8",
            margin: 0,
            color: "#111827",
          }}
        >
          {hazards.rugs && (
            <li style={{ marginBottom: "12px" }}>
              <strong>Alfombras y Superficies:</strong> Fijar las alfombras
              sueltas con cinta antideslizante o retirarlas de los pasillos y
              del trayecto hacia la cama.
            </li>
          )}
          {hazards.lighting && (
            <li style={{ marginBottom: "12px" }}>
              <strong>Iluminación Nocturna:</strong> Colocar luces nocturnas
              automáticas o lámparas de fácil acceso en el trayecto desde el
              dormitorio hacia el baño.
            </li>
          )}
          {hazards.bars && (
            <li style={{ marginBottom: "12px" }}>
              <strong>Sujeciones en Baño:</strong> Solicitar apoyo para instalar
              barras firmes de sujeción al costado del inodoro y dentro de la
              ducha.
            </li>
          )}
          {hazards.obstacles && (
            <li style={{ marginBottom: "12px" }}>
              <strong>Rutas Libres de Obstáculos:</strong> Mantener los pasillos
              y zonas de paso libres de cables sueltos, cajas o calzados en el
              piso.
            </li>
          )}
          {selectedHazardsCount === 0 && (
            <li style={{ marginBottom: "12px", color: "#047857" }}>
              <strong>¡Excelente entorno!</strong> Su hogar se encuentra
              ordenado y libre de los principales peligros ambientales
              identificados.
            </li>
          )}

          {risk.color === "#EF4444" && (
            <li style={{ marginBottom: "12px", color: "#B91C1C" }}>
              <strong>Acompañamiento Frecuente:</strong> Se recomienda mantener
              una conversación con su familiar o médico de cabecera para
              coordinar apoyo en desplazamientos fuera de casa.
            </li>
          )}
          {risk.color === "#F59E0B" && (
            <li style={{ marginBottom: "12px" }}>
              <strong>Calzado Adecuado:</strong> Procurar usar siempre zapatos
              cerrados, bien ajustados y con suela de goma antideslizante dentro
              y fuera del hogar.
            </li>
          )}
          {risk.color === "#10B981" && (
            <li style={{ marginBottom: "12px", color: "#047857" }}>
              <strong>Actividad Física Habitual:</strong> Mantener sus caminatas
              diarias a paso tranquilo para fortalecer la musculatura y el
              equilibrio.
            </li>
          )}
        </ul>
      </div>

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <Button
          variant="primary"
          onClick={() => {
            const msg = `Hola ${contact.name}, informe del Asistente Hogar Seguro. Estado: ${risk.label}. Recomendaciones para mi hogar: ${selectedHazardsCount} factores a revisar.`;
            window.open(
              `https://api.whatsapp.com/send?phone=${contact.phone}&text=${encodeURIComponent(msg)}`,
            );
          }}
        >
          Compartir Reporte por WhatsApp
        </Button>
        <Button variant="back" onClick={onReset}>
          Realizar Nueva Evaluación
        </Button>
      </div>
    </section>
  );
}
