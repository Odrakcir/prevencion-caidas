import { getStyles } from "../styles/theme";
import { useIsDesktop } from "../hooks/useDesktop";
import Button from "../components/common/Button";
import SafetyStars from "../components/common/SafetyStars";
import { ENVIRONMENTAL_HAZARDS } from "../constants/surveyData";

// Diccionario de recomendaciones basadas en los IDs de tu documento
const RECOMMENDATIONS_MAP = {
  A1: "Fijar las alfombras sueltas con cinta antideslizante o retirarlas de las zonas de paso.",
  A2: "Ordenar los cables de lámparas y extensiones, manteniéndolos pegados a la pared.",
  A3: "Evitar sillones demasiado blandos; usar un cojín firme para facilitar el levantamiento.",
  B1: "Limpiar inmediatamente los derrames de agua o grasa y usar calzado antideslizante en la cocina.",
  B2: "Bajar los utensilios y alimentos de uso diario a estantes a la altura de la cintura.",
  B3: "Retirar los paños o secapiés del suelo que puedan doblarse y provocar tropiezos.",
  C1: "Instalar luces nocturnas automáticas en el trayecto de la cama al baño.",
  C2: "Ajustar la altura de la cama para que ambos pies toquen firmemente el suelo al sentarse.",
  C3: "Usar pantuflas cerradas con talón o caminar con calcetines antideslizantes.",
  D1: "Instalar barras de sujeción firmes a 80-90 cm del suelo junto al inodoro y en la ducha.",
  D2: "Colocar una goma de succión antideslizante dentro de la ducha.",
  D3: "Si la tina es muy alta, considerar una silla de ducha o un banco de transferencia.",
  E1: "Señalizar los desniveles con cinta reflectante de alto contraste o instalar rampas.",
  E2: "Asegurar que las escaleras tengan pasamanos firme a ambos lados y cinta antideslizante.",
  E3: "Mejorar la iluminación de pasillos y colocar interruptores de fácil acceso.",
};

export default function RecommendationsModule({
  risk,
  morseScore,
  selectedHazardsCount,
  contact,
  hazards,
  onReset,
}) {
  const isDesktop = useIsDesktop();
  const styles = getStyles(isDesktop);

  // Filtramos solo los peligros que el usuario marcó como true
  const activeHazards = ENVIRONMENTAL_HAZARDS.filter((h) => hazards[h.id]);

  return (
    <section style={{ maxWidth: "720px", margin: "0 auto" }}>
      {/* TARJETA 1: ESTRELLAS DE SEGURIDAD (Enfoque TAM) */}
      <div
        style={{
          ...styles.card,
          border: "3px solid #0D9488",
          backgroundColor: "#FFFFFF",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "22px",
            fontWeight: "800",
            color: "#0D9488",
            margin: "0 0 8px 0",
          }}
        >
          Tu Nivel de Protección
        </h2>

        <SafetyStars stars={risk.stars} label={risk.safetyLabel} />

        <p
          style={{
            fontSize: "17px",
            color: "#374151",
            margin: "16px 0",
            lineHeight: "1.6",
          }}
        >
          {risk.desc}
        </p>

        <div
          style={{
            backgroundColor: "#F0FDFA",
            padding: "16px",
            borderRadius: "8px",
            border: "1px dashed #0D9488",
            marginTop: "16px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              color: "#047857",
              fontWeight: "600",
            }}
          >
            ¡Sigue sumando estrellas! Cada ajuste que hagas en tu hogar te
            acerca a las 5 estrellas.
          </p>
        </div>
      </div>

      {/* TARJETA 2: RECOMENDACIONES DINÁMICAS */}
      <div style={styles.card}>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "800",
            color: "#111827",
            margin: "0 0 16px 0",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "24px" }}>🛠️</span>
          Plan de Acción para tu Hogar
        </h2>

        <p style={{ fontSize: "16px", color: "#374151", marginBottom: "16px" }}>
          Según lo que nos contaste, te sugerimos estos ajustes para subir tu
          nivel de protección:
        </p>

        <ul
          style={{
            paddingLeft: "20px",
            fontSize: "16px",
            lineHeight: "1.6",
            margin: 0,
            color: "#111827",
          }}
        >
          {activeHazards.map((h) => (
            <li key={h.id} style={{ marginBottom: "12px" }}>
              <strong>
                {h.zone} - {h.label}:
              </strong>{" "}
              {RECOMMENDATIONS_MAP[h.id]}
            </li>
          ))}

          {selectedHazardsCount === 0 && (
            <li
              style={{
                marginBottom: "12px",
                color: "#047857",
                fontWeight: "600",
              }}
            >
              ¡Excelente! No detectamos peligros ambientales en tu hogar. Mantén
              las rutas despejadas y sigue con tus caminatas diarias.
            </li>
          )}
        </ul>

        {/* Recomendaciones clínicas (si el riesgo es alto) */}
        {risk.label.includes("Alto") && (
          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              backgroundColor: "#FEF2F2",
              borderRadius: "8px",
              borderLeft: "4px solid #EF4444",
            }}
          >
            <p style={{ margin: 0, color: "#B91C1C", fontWeight: "700" }}>
              Recomendación adicional: Se aconseja compartir este informe con tu
              médico de cabecera para evaluar tu movilidad y medicamentos.
            </p>
          </div>
        )}
      </div>

      {/* RESUMEN BREVE (Para que se sienta respaldado) */}
      <div style={styles.card}>
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "700",
            color: "#4B5563",
            marginBottom: "12px",
            borderBottom: "1px solid #E5E7EB",
            paddingBottom: "8px",
          }}
        >
          Resumen del Análisis
        </h3>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "14px",
            color: "#374151",
          }}
        >
          <span>
            <strong>Puntaje Clínico:</strong> {morseScore} pts
          </span>
          <span>
            <strong>Peligros Detectados:</strong> {selectedHazardsCount} de 15
          </span>
          <span>
            <strong>Contacto:</strong> {contact.name || "No registrado"}
          </span>
        </div>
      </div>

      {/* BOTONES */}
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
            const msg = `Hola ${contact.name}, te comparto mi informe del Asistente Hogar Seguro. Mi hogar tiene ${risk.stars} de 5 estrellas de seguridad. Tenemos ${selectedHazardsCount} puntos de mejora identificados.`;
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
