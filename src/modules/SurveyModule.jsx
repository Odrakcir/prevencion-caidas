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
  onUserComplete,
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
  const [highlightedHazardId, setHighlightedHazardId] = useState(null);
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
            Evaluación Preventiva — Pregunta {currentQuestion + 1} de{" "}
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

  // 4. PANTALLA: PELIGROS AMBIENTALES (FLUJO GUIADO CON PLANO INTERACTIVO)
  if (screen === "hazards") {
    const zoneHazards = ENVIRONMENTAL_HAZARDS.filter(
      (h) => h.zone === currentZone,
    );
    const isLastRoom = currentRoomIndex === ROOMS.length - 1;
    const markedInRoom = zoneHazards.filter((h) => hazards[h.id]).length;
    const totalMarked = ENVIRONMENTAL_HAZARDS.filter((h) => hazards[h.id]).length;

    return (
      <section style={{ maxWidth: "960px", margin: "0 auto" }}>
        {/* NAVEGADOR DE HABITACIONES (Progreso claro + acceso directo) */}
        <div style={{ marginBottom: "18px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "10px",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: "800",
                color: "#0F766E",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              Paso {currentRoomIndex + 1} de {ROOMS.length} — Revisión del Hogar
            </span>
            <span
              style={{
                fontSize: "13.5px",
                fontWeight: "700",
                color: totalMarked > 0 ? "#991B1B" : "#115E59",
                backgroundColor: totalMarked > 0 ? "#FEF2F2" : "#F0FDFA",
                border: `1px solid ${totalMarked > 0 ? "#FECACA" : "#99F6E4"}`,
                padding: "4px 12px",
                borderRadius: "999px",
              }}
            >
              {totalMarked === 0
                ? "Sin peligros marcados aún"
                : `${totalMarked} ${totalMarked === 1 ? "peligro marcado" : "peligros marcados"} en total`}
            </span>
          </div>

          <div
            role="tablist"
            aria-label="Habitaciones del hogar"
            style={{
              display: "grid",
              gridTemplateColumns: isDesktop
                ? "repeat(5, 1fr)"
                : "repeat(auto-fit, minmax(96px, 1fr))",
              gap: "8px",
            }}
          >
            {ROOMS.map((room, idx) => {
              const roomCount = ENVIRONMENTAL_HAZARDS.filter(
                (h) => h.zone === room && hazards[h.id],
              ).length;
              const isCurrent = idx === currentRoomIndex;
              const isVisited = idx < currentRoomIndex;

              return (
                <button
                  key={room}
                  type="button"
                  role="tab"
                  aria-selected={isCurrent}
                  onClick={() => {
                    setCurrentRoomIndex(idx);
                    setHighlightedHazardId(null);
                  }}
                  style={{
                    minHeight: "44px",
                    padding: "8px 10px",
                    borderRadius: "10px",
                    border: isCurrent
                      ? "2px solid #0F766E"
                      : "1.5px solid #CBD5E1",
                    backgroundColor: isCurrent
                      ? "#0F766E"
                      : isVisited
                        ? "#F0FDFA"
                        : "#FFFFFF",
                    color: isCurrent ? "#FFFFFF" : "#1E293B",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{room}</span>
                  {roomCount > 0 && (
                    <span
                      style={{
                        backgroundColor: isCurrent ? "#FFFFFF" : "#DC2626",
                        color: isCurrent ? "#0F766E" : "#FFFFFF",
                        fontSize: "11.5px",
                        fontWeight: "800",
                        minWidth: "20px",
                        height: "20px",
                        borderRadius: "999px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 5px",
                      }}
                    >
                      {roomCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* TARJETA PRINCIPAL DE LA HABITACIÓN */}
        <div
          style={{
            ...styles.featuredCard,
            padding: isDesktop ? "26px" : "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: isDesktop ? "center" : "flex-start",
              flexDirection: isDesktop ? "row" : "column",
              gap: "8px",
              marginBottom: "18px",
              paddingBottom: "14px",
              borderBottom: "1px solid #E2E8F0",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: isDesktop ? "24px" : "21px",
                  fontWeight: "800",
                  color: "#0F172A",
                  margin: "0 0 4px 0",
                  letterSpacing: "-0.02em",
                }}
              >
                Revisemos: {currentZone}
              </h2>
              <p
                style={{
                  fontSize: "16px",
                  color: "#334155",
                  margin: 0,
                  lineHeight: "1.5",
                }}
              >
                Marca cada situación que veas en tu{" "}
                <strong>{currentZone.toLowerCase()}</strong>. Los números{" "}
                <strong>1, 2 y 3</strong> coinciden con el dibujo.
              </p>
            </div>

            <span
              style={{
                fontSize: "13.5px",
                fontWeight: "700",
                color: markedInRoom > 0 ? "#991B1B" : "#334155",
                backgroundColor: markedInRoom > 0 ? "#FEF2F2" : "#F1F5F9",
                border: `1px solid ${markedInRoom > 0 ? "#FECACA" : "#CBD5E1"}`,
                padding: "6px 12px",
                borderRadius: "8px",
                whiteSpace: "nowrap",
              }}
            >
              {markedInRoom} de {zoneHazards.length} marcados aquí
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isDesktop ? "1.05fr 1.15fr" : "1fr",
              gap: isDesktop ? "24px" : "18px",
              alignItems: "start",
            }}
          >
            {/* En móvil mostramos primero la guía visual; en PC a la derecha */}
            <div style={{ order: isDesktop ? 2 : 1 }}>
              <RoomFloorPlan
                zone={currentZone}
                hazards={hazards}
                onToggleHazard={toggleHazard}
                highlightedId={highlightedHazardId}
              />
            </div>

            {/* Checklist accesible numerada */}
            <div
              style={{
                order: isDesktop ? 1 : 2,
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {zoneHazards.map((h, idx) => {
                const checked = Boolean(hazards[h.id]);
                const num = idx + 1;

                return (
                  <button
                    key={h.id}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => toggleHazard(h.id)}
                    onMouseEnter={() => setHighlightedHazardId(h.id)}
                    onMouseLeave={() => setHighlightedHazardId(null)}
                    onFocus={() => setHighlightedHazardId(h.id)}
                    onBlur={() => setHighlightedHazardId(null)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "14px",
                      padding: isDesktop ? "16px" : "14px",
                      minHeight: "76px",
                      borderRadius: "12px",
                      border: checked
                        ? "2px solid #DC2626"
                        : highlightedHazardId === h.id
                          ? "2px solid #0F766E"
                          : "1.5px solid #CBD5E1",
                      backgroundColor: checked ? "#FEF2F2" : "#FFFFFF",
                      cursor: "pointer",
                      boxSizing: "border-box",
                      boxShadow: checked
                        ? "0 2px 6px rgba(220, 38, 38, 0.1)"
                        : "0 1px 2px rgba(15, 23, 42, 0.04)",
                      transition: "all 0.15s ease",
                      userSelect: "none",
                    }}
                  >
                    {/* Insignia numérica sincronizada con el dibujo */}
                    <span
                      aria-hidden="true"
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        backgroundColor: checked ? "#DC2626" : "#0F766E",
                        color: "#FFFFFF",
                        fontSize: "16px",
                        fontWeight: "800",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      {num}
                    </span>

                    {/* Título y explicación cotidiana */}
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          display: "block",
                          fontSize: "17px",
                          fontWeight: "700",
                          color: "#0F172A",
                          lineHeight: "1.35",
                          marginBottom: "4px",
                        }}
                      >
                        {h.label}
                      </span>
                      {h.hint && (
                        <span
                          style={{
                            display: "block",
                            fontSize: "14.5px",
                            fontWeight: "500",
                            color: "#475569",
                            lineHeight: "1.45",
                          }}
                        >
                          {h.hint}
                        </span>
                      )}
                    </span>

                    {/* Indicador visual explícito de estado (no solo color) */}
                    <span
                      aria-hidden="true"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "4px",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      <span
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "7px",
                          border: checked
                            ? "2px solid #DC2626"
                            : "2px solid #64748B",
                          backgroundColor: checked ? "#DC2626" : "#FFFFFF",
                          color: "#FFFFFF",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "16px",
                          fontWeight: "800",
                        }}
                      >
                        {checked ? "✓" : ""}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          color: checked ? "#991B1B" : "#475569",
                        }}
                      >
                        {checked ? "Sí hay" : "No"}
                      </span>
                    </span>
                  </button>
                );
              })}

              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "14px",
                  color: "#475569",
                  lineHeight: "1.45",
                }}
              >
                Si en tu {currentZone.toLowerCase()} no hay ninguno de estos
                peligros, simplemente avanza a la siguiente habitación.
              </p>
            </div>
          </div>
        </div>

        {/* BOTONES DE NAVEGACIÓN */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              !isAdminMode && isDesktop ? "1fr 2fr" : "1fr",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          {!isAdminMode && (
            <Button
              variant="back"
              style={{
                minHeight: "56px",
                fontSize: "17px",
                order: isDesktop ? 1 : 2,
              }}
              onClick={() => {
                setHighlightedHazardId(null);
                if (currentRoomIndex > 0) {
                  setCurrentRoomIndex((prev) => prev - 1);
                } else {
                  setScreen("questionnaire");
                }
                window.scrollTo(0, 0);
              }}
            >
              {currentRoomIndex > 0
                ? `← Volver a ${ROOMS[currentRoomIndex - 1]}`
                : "← Volver a Preguntas"}
            </Button>
          )}

          {isLastRoom ? (
            <Button
              variant="primary"
              style={{
                minHeight: "58px",
                fontSize: "19px",
                order: isDesktop ? 2 : 1,
              }}
              onClick={() => {
                if (isAdminMode && onAdminSave) onAdminSave();
                else if (onUserComplete) onUserComplete();
                else setScreen("dashboard");
              }}
            >
              {isAdminMode
                ? "Guardar y Volver al Panel"
                : "Finalizar y Ver Mis Resultados"}
            </Button>
          ) : (
            <Button
              variant="primary"
              style={{
                minHeight: "58px",
                fontSize: "19px",
                order: isDesktop ? 2 : 1,
              }}
              onClick={() => {
                setHighlightedHazardId(null);
                setCurrentRoomIndex((prev) => prev + 1);
                window.scrollTo(0, 0);
              }}
            >
              Siguiente: {ROOMS[currentRoomIndex + 1]} →
            </Button>
          )}
        </div>
      </section>
    );
  }

  return null;
}
