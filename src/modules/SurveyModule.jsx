import { getStyles } from "../styles/theme";
import { useIsDesktop } from "../hooks/useDesktop";
import Button from "../components/common/Button";
import { QUESTIONS, ENVIRONMENTAL_HAZARDS } from "../constants/surveyData";

export default function SurveyModule({
  screen,
  setScreen,
  contact,
  setContact,
  survey,
}) {
  const isDesktop = useIsDesktop();
  const styles = getStyles(isDesktop);

  const {
    currentQuestion,
    hazards,
    answerCurrent,
    next,
    prev,
    toggleHazard,
    reset,
  } = survey;

  const handleAnswer = (value) => {
    answerCurrent(value);
    if (currentQuestion < QUESTIONS.length - 1) {
      next();
    } else {
      setScreen("hazards");
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      prev();
    } else {
      setScreen("support");
    }
  };

  const handleResetAndHome = () => {
    reset();
    setScreen("onboarding");
  };

  if (screen === "onboarding") {
    return (
      <section style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            <span style={styles.statusDot("#0D9488")} />
            Bienvenida e Información del Sistema
          </h2>
          <p style={styles.text}>
            Esta plataforma web interactiva le ayudará a evaluar de forma
            sencilla los factores físicos de su marcha y las condiciones de su
            hogar para prevenir tropiezos.
          </p>
          <p
            style={{
              ...styles.text,
              fontSize: "15px",
              color: "#4B5563",
              borderLeft: "4px solid #0D9488",
              paddingLeft: "12px",
            }}
          >
            <strong>Aviso Ético y de Privacidad:</strong> Este software es un
            asistente educativo y de orientación que{" "}
            <strong>
              no emite diagnósticos médicos ni reemplaza la atención
              profesional.
            </strong>
          </p>
        </div>

        <Button variant="primary" onClick={() => setScreen("support")}>
          Iniciar Evaluación
        </Button>
      </section>
    );
  }

  if (screen === "support") {
    return (
      <section style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            <span style={styles.statusDot("#0D9488")} />
            Red de Apoyo Familiar
          </h2>
          <p style={styles.text}>
            Ingrese los datos de un familiar o cuidador de confianza con quien
            le gustaría compartir el informe de seguridad al finalizar.
          </p>

          <label
            style={{
              display: "block",
              fontSize: "16px",
              fontWeight: "800",
              color: "#111827",
              marginBottom: "8px",
            }}
          >
            Nombre del contacto:
          </label>
          <input
            style={styles.input}
            type="text"
            placeholder="Ej: María Rodríguez (Hija)"
            value={contact.name}
            onChange={(e) => setContact({ ...contact, name: e.target.value })}
          />

          <label
            style={{
              display: "block",
              fontSize: "16px",
              fontWeight: "800",
              color: "#111827",
              marginBottom: "8px",
            }}
          >
            Teléfono de contacto:
          </label>
          <input
            style={styles.input}
            type="tel"
            placeholder="Ej: +56912345678"
            value={contact.phone}
            onChange={(e) => setContact({ ...contact, phone: e.target.value })}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "14px",
          }}
        >
          <Button variant="back" onClick={() => setScreen("onboarding")}>
            Atrás
          </Button>
          <Button
            variant="primary"
            disabled={!contact.name || !contact.phone}
            onClick={() => setScreen("questionnaire")}
          >
            Continuar
          </Button>
        </div>
      </section>
    );
  }

  if (screen === "questionnaire") {
    return (
      <section style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div style={styles.card}>
          <span
            style={{
              fontSize: "14px",
              color: "#0D9488",
              fontWeight: "800",
              textTransform: "uppercase",
            }}
          >
            Evaluación Médica — Pregunta {currentQuestion + 1} de{" "}
            {QUESTIONS.length}
          </span>
          <p
            style={{
              ...styles.text,
              fontWeight: "700",
              marginTop: "12px",
              fontSize: "20px",
              color: "#111827",
            }}
          >
            {QUESTIONS[currentQuestion].text}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Button variant="primary" onClick={() => handleAnswer(true)}>
            Sí
          </Button>
          <Button variant="secondary" onClick={() => handleAnswer(false)}>
            No
          </Button>
          <Button
            variant="back"
            style={{ marginTop: "8px" }}
            onClick={handlePrev}
          >
            Volver Anterior
          </Button>
        </div>
      </section>
    );
  }

  if (screen === "hazards") {
    return (
      <section style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            <span style={styles.statusDot("#0D9488")} />
            Revisión de Factores del Hogar
          </h2>
          <p style={styles.text}>
            Marque las condiciones que se presenten actualmente en su vivienda:
          </p>

          {ENVIRONMENTAL_HAZARDS.map((h) => (
            <div
              key={h.id}
              style={{
                ...styles.checkboxContainer,
                borderColor: hazards[h.id] ? "#0D9488" : "#E5E7EB",
                backgroundColor: hazards[h.id] ? "#F0FDFA" : "#FFFFFF",
              }}
              onClick={() => toggleHazard(h.id)}
            >
              <input
                type="checkbox"
                style={styles.checkboxInput}
                checked={hazards[h.id]}
                onChange={() => {}}
              />
              <span style={styles.checkboxText}>{h.label}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "14px",
          }}
        >
          <Button
            variant="back"
            onClick={() => {
              setScreen("questionnaire");
            }}
          >
            Atrás
          </Button>
          <Button variant="primary" onClick={() => setScreen("dashboard")}>
            Ver Resultados
          </Button>
        </div>
      </section>
    );
  }

  return null;
}
