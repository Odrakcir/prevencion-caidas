import { useState } from "react";
import { getStyles } from "../styles/theme";
import { useIsDesktop } from "../hooks/useDesktop";
import Button from "../components/common/Button";
import { QUESTIONS, ENVIRONMENTAL_HAZARDS } from "../constants/surveyData";
import RoomFloorPlan from "../components/survey/RoomFloorPlan";

export default function SurveyModule({
  screen,
  setScreen,
  contact,
  setContact,
  survey,
  isAdminMode = false,
  onAdminSave,
}) {
  const isDesktop = useIsDesktop();
  const styles = getStyles(isDesktop);

  const { currentQuestion, hazards, answerCurrent, next, prev, toggleHazard } =
    survey;

  const handleAnswer = (value) => {
    answerCurrent(value);
    if (currentQuestion < QUESTIONS.length - 1) {
      next();
    } else {
      setScreen("hazards");
    }
  };

  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const ROOMS = ["Sala", "Cocina", "Dormitorio", "Baño", "Pasillos"];
  const currentZone = ROOMS[currentRoomIndex];

  const handlePrev = () => {
    if (currentQuestion > 0) {
      prev();
    } else {
      setScreen("support");
    }
  };

  // 1. PANTALLA: BIENVENIDA
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

  // 2. PANTALLA: RED DE APOYO
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

  // 3. PANTALLA: CUESTIONARIO MORSE
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

  // 4. PANTALLA: PELIGROS AMBIENTALES (FLUJO LINEAL)
  if (screen === "hazards") {
    const zoneHazards = ENVIRONMENTAL_HAZARDS.filter(
      (h) => h.zone === currentZone,
    );
    const isLastRoom = currentRoomIndex === ROOMS.length - 1;

    return (
      <section style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* INDICADOR DE PROGRESO DE HABITACIONES */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <span
            style={{
              fontSize: "14px",
              fontWeight: "800",
              color: "#0D9488",
              textTransform: "uppercase",
            }}
          >
            Habitación {currentRoomIndex + 1} de {ROOMS.length}
          </span>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            {ROOMS.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: "40px",
                  height: "6px",
                  borderRadius: "3px",
                  backgroundColor:
                    idx <= currentRoomIndex ? "#0D9488" : "#E5E7EB",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: "#111827",
              marginBottom: "8px",
              textAlign: "center",
            }}
          >
            Revisemos: {currentZone}
          </h2>
          <p
            style={{
              ...styles.text,
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            Marca lo que veas en esta habitación.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr",
              gap: "20px",
              alignItems: "center",
            }}
          >
            {/* Checkboxes de la habitación actual */}
            <div>
              {zoneHazards.map((h) => (
                <div
                  key={h.id}
                  style={{
                    ...styles.checkboxContainer,
                    borderColor: hazards[h.id] ? "#0D9488" : "#E5E7EB",
                    backgroundColor: hazards[h.id] ? "#F0FDFA" : "#FFFFFF",
                    marginBottom: "12px",
                    padding: "16px", // Más grande para el adulto mayor
                  }}
                  onClick={() => toggleHazard(h.id)}
                >
                  <input
                    type="checkbox"
                    style={{
                      ...styles.checkboxInput,
                      width: "28px",
                      height: "28px",
                    }} // Checkbox más grande
                    checked={hazards[h.id]}
                    onChange={() => {}}
                  />
                  <span
                    style={{
                      ...styles.checkboxText,
                      fontSize: "18px",
                      lineHeight: "1.4",
                    }}
                  >
                    {h.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Plano Interactivo Grande */}
            <div>
              <RoomFloorPlan zone={currentZone} hazards={hazards} />
            </div>
          </div>
        </div>

        {/* BOTONES DE NAVEGACIÓN */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "20px",
          }}
        >
          {isLastRoom ? (
            // Si es la última habitación, mostramos el botón de terminar
            <Button
              variant="primary"
              style={{ minHeight: "60px", fontSize: "20px" }} // Botón gigante
              onClick={() => {
                if (isAdminMode && onAdminSave) onAdminSave();
                else setScreen("dashboard");
              }}
            >
              {isAdminMode ? "Guardar y Volver al Panel" : "Ver Mis Resultados"}
            </Button>
          ) : (
            // Si no es la última, mostramos el botón de Siguiente
            <Button
              variant="primary"
              style={{ minHeight: "60px", fontSize: "20px" }} // Botón gigante
              onClick={() => {
                setCurrentRoomIndex((prev) => prev + 1);
                window.scrollTo(0, 0); // Hacemos scroll al principio de la página
              }}
            >
              Siguiente Habitación →
            </Button>
          )}

          {/* Botón para volver atrás (opcional, pero útil) */}
          <div style={{ display: "flex", gap: "12px" }}>
            {!isAdminMode && (
              <Button
                variant="back"
                style={{ flex: 1, minHeight: "50px" }}
                onClick={() => {
                  if (currentRoomIndex > 0) {
                    setCurrentRoomIndex((prev) => prev - 1);
                  } else {
                    setScreen("questionnaire"); // Si está en la primera, vuelve a la encuesta clínica
                  }
                  window.scrollTo(0, 0);
                }}
              >
                Atrás
              </Button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return null;
}
