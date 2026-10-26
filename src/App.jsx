import React, { useState, useEffect } from "react";
import { getStyles } from "./styles/theme";
import { useIsDesktop } from "./hooks/useDesktop";
import Header from "./components/common/Header";
import Button from "./components/common/Button";
import RiskBadge from "./components/common/RiskBadge";
import SensorCard from "./components/dashboard/SensorCard";
import {
  QUESTIONS,
  ENVIRONMENTAL_HAZARDS,
  HOURLY_DATA,
} from "./constants/surveyData";
import StabilityChart from "./components/dashboard/StabilityChart";
/**
 * App-v10.jsx — Asistente "Hogar Seguro" (PWA / IoT + Supabase)
 *
 * Novedades principales en v10:
 * 1. Leyenda de Zonas del Gráfico Ubicada al Lado:
 *    - Se removió el texto superpuesto dentro del área de dibujo del SVG para dejar la curva limpia.
 *    - Se creó una tarjeta de "Leyenda de Niveles" dedicada al lado del gráfico con tipografía grande (15px-16px),
 *      alto contraste y códigos de color claros (Verde, Amarillo, Rojo) ideada para fácil lectura de adultos mayores.
 * 2. Mantiene todo el comportamiento, diseño centrado, inputs corregidos e integración con Supabase.
 */

export default function App() {
  const [roleMode, setRoleMode] = useState("recommendations");
  const [screen, setScreen] = useState("onboarding");
  const [contact, setContact] = useState({ name: "", phone: "" });
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Estados del Gráfico de Estabilidad Potenciado
  const [graphTimeframe, setGraphTimeframe] = useState("today"); // 'today' | 'weekly'
  const [graphFilter, setGraphFilter] = useState("all"); // 'all' | 'alerts'
  const [selectedGraphPoint, setSelectedGraphPoint] = useState(
    HOURLY_DATA[HOURLY_DATA.length - 1],
  );

  const [hazards, setHazards] = useState({
    rugs: false,
    lighting: false,
    bars: false,
    obstacles: false,
  });

  const isDesktop = useIsDesktop();

  const styles = getStyles(isDesktop);

  // Telemetría simulada en tiempo real
  const [simMode, setSimMode] = useState("standing");
  const [simData, setSimData] = useState({
    tilt: 3.8,
    accelY: 0.98,
    fsrPressure: 49,
    gaitPhase: "Estático (Soporte Estable)",
    latency: 124,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      if (simMode === "standing") {
        setSimData({
          tilt: Number((3.2 + Math.random() * 1.2).toFixed(1)),
          accelY: Number((0.97 + Math.random() * 0.03).toFixed(2)),
          fsrPressure: Math.floor(46 + Math.random() * 5),
          gaitPhase: "Estático (Soporte Estable)",
          latency: Math.floor(118 + Math.random() * 20),
        });
      } else {
        const isStance = Math.random() > 0.45;
        setSimData({
          tilt: Number((7.2 + Math.random() * 4).toFixed(1)),
          accelY: Number((0.83 + Math.random() * 0.28).toFixed(2)),
          fsrPressure: isStance
            ? Math.floor(70 + Math.random() * 15)
            : Math.floor(2 + Math.random() * 6),
          gaitPhase: isStance
            ? "Fase de Apoyo (Stance)"
            : "Fase de Oscilación (Swing)",
          latency: Math.floor(122 + Math.random() * 28),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [simMode]);

  /*const triggerDemoMode = () => {
    setContact({ name: "Familiar Tutor", phone: "+56912345678" });
    setAnswers({
      caidas: true,
      diagnostico: false,
      ayuda: true,
      marcha: true,
      mental: false,
    });
    setHazards({ rugs: true, lighting: true, bars: false, obstacles: true });
    setScreen("dashboard");
    setActiveTab("iot");
  };*/

  const calculateMorseScore = () => {
    return Object.keys(answers).reduce((total, key) => {
      return answers[key]
        ? total + (QUESTIONS.find((q) => q.id === key)?.points || 0)
        : total;
    }, 0);
  };

  const morseScore = calculateMorseScore();
  const selectedHazardsCount = Object.values(hazards).filter(Boolean).length;

  const getRiskStatus = (score, hazardCount) => {
    if (score >= 45 || hazardCount >= 3) {
      return {
        label: "Riesgo Alto",
        color: "#EF4444",
        desc: "Requiere adaptaciones prioritarias en el hogar y coordinación con su red de apoyo para mitigar caídas.",
      };
    }
    if (score >= 25 || hazardCount >= 1) {
      return {
        label: "Riesgo Medio",
        color: "#F59E0B",
        desc: "Se sugieren ajustes en zonas de tránsito (luces nocturnas y sujeciones en baño).",
      };
    }
    return {
      label: "Riesgo Bajo",
      color: "#10B981",
      desc: "Entorno y condición física estables. Mantenga hábitos de caminata cotidiana y espacio libre de obstáculos.",
    };
  };

  const risk = getRiskStatus(morseScore, selectedHazardsCount);

  const getProgressPercentage = () => {
    if (screen === "onboarding") return 10;
    if (screen === "support") return 25;
    if (screen === "questionnaire")
      return 30 + ((currentQuestion + 1) / QUESTIONS.length) * 40;
    if (screen === "hazards") return 85;
    if (screen === "dashboard") return 100;
    return 0;
  };

  const toggleHazard = (id) => {
    setHazards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={styles.wrapper}>
      <main style={styles.container}>
        <div>
          {/* ENCABEZADO Y CONMUTADOR DE ROL */}
          <Header
            roleMode={roleMode}
            onChangeRole={(newRole) => {
              setRoleMode(newRole);
              if (screen !== "dashboard") setScreen("dashboard");
            }}
          />

          {/* BARRA DE PROGRESO */}
          {screen !== "dashboard" && roleMode === "recommendations" && (
            <div style={styles.progressBarContainer}>
              <div style={styles.progressBar(getProgressPercentage())} />
            </div>
          )}

          {/* PANTALLA 1: BIENVENIDA */}
          {screen === "onboarding" && roleMode === "recommendations" && (
            <section style={{ maxWidth: "600px", margin: "0 auto" }}>
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>
                  <span style={styles.statusDot("#0D9488")} />
                  Bienvenida e Información del Sistema
                </h2>
                <p style={styles.text}>
                  Esta plataforma web interactiva le ayudará a evaluar de forma
                  sencilla los factores físicos de su marcha y las condiciones
                  de su hogar para prevenir tropiezos.
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
                  <strong>Aviso Ético y de Privacidad:</strong> Este software es
                  un asistente educativo y de orientación que{" "}
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
          )}

          {/* PANTALLA 2: RED DE APOYO - INPUTS CORREGIDOS DE ALTO CONTRASTE */}
          {screen === "support" && roleMode === "recommendations" && (
            <section style={{ maxWidth: "600px", margin: "0 auto" }}>
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>
                  <span style={styles.statusDot("#0D9488")} />
                  Red de Apoyo Familiar
                </h2>
                <p style={styles.text}>
                  Ingrese los datos de un familiar o cuidador de confianza con
                  quien le gustaría compartir el informe de seguridad al
                  finalizar.
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
                  onChange={(e) =>
                    setContact({ ...contact, name: e.target.value })
                  }
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
                  onChange={(e) =>
                    setContact({ ...contact, phone: e.target.value })
                  }
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
          )}

          {/* PANTALLA 3: MORSE SCALE */}
          {screen === "questionnaire" && roleMode === "recommendations" && (
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

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <Button
                  variant="primary"
                  onClick={() => {
                    setAnswers({
                      ...answers,
                      [QUESTIONS[currentQuestion].id]: true,
                    });
                    if (currentQuestion < QUESTIONS.length - 1) {
                      setCurrentQuestion(currentQuestion + 1);
                    } else {
                      setScreen("hazards");
                    }
                  }}
                >
                  Sí
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setAnswers({
                      ...answers,
                      [QUESTIONS[currentQuestion].id]: false,
                    });
                    if (currentQuestion < QUESTIONS.length - 1) {
                      setCurrentQuestion(currentQuestion + 1);
                    } else {
                      setScreen("hazards");
                    }
                  }}
                >
                  No
                </Button>
                <Button
                  variant="back"
                  style={{ marginTop: "8px" }}
                  onClick={() => {
                    if (currentQuestion > 0) {
                      setCurrentQuestion(currentQuestion - 1);
                    } else {
                      setScreen("support");
                    }
                  }}
                >
                  Volver Anterior
                </Button>
              </div>
            </section>
          )}

          {/* PANTALLA 4: PELIGROS AMBIENTALES */}
          {screen === "hazards" && roleMode === "recommendations" && (
            <section style={{ maxWidth: "600px", margin: "0 auto" }}>
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>
                  <span style={styles.statusDot("#0D9488")} />
                  Revisión de Factores del Hogar
                </h2>
                <p style={styles.text}>
                  Marque las condiciones que se presenten actualmente en su
                  vivienda:
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
                    setCurrentQuestion(QUESTIONS.length - 1);
                  }}
                >
                  Atrás
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setScreen("dashboard")}
                >
                  Ver Resultados
                </Button>
              </div>
            </section>
          )}

          {/* PANTALLA 5: VISTA RECOMENDACIONES vs VISTA CUIDADOR */}

          {/* VISTA 1: SOLO RECOMENDACIONES (VISTA RECOMENDACIONES) */}
          {roleMode === "recommendations" && screen === "dashboard" && (
            <section style={{ maxWidth: "720px", margin: "0 auto" }}>
              {/* Tarjeta 1: Semáforo y Estado de Seguridad */}
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
                    • Puntaje Escala de Morse:{" "}
                    <strong>{morseScore} / 125 pts</strong>
                  </p>
                  <p style={{ margin: "4px 0" }}>
                    • Peligros del Hogar Identificados:{" "}
                    <strong>{selectedHazardsCount} de 4</strong>
                  </p>
                  <p style={{ margin: "4px 0" }}>
                    • Contacto de Apoyo Registrado:{" "}
                    <strong>
                      {contact.name || "Familiar / Cuidador"} (
                      {contact.phone || "N/A"})
                    </strong>
                  </p>
                </div>
              </div>

              {/* Tarjeta 2: Recomendaciones Personalizadas de Alto Contraste */}
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
                  Basado en su evaluación de salud y los factores observados en
                  su vivienda, le sugerimos aplicar las siguientes medidas para
                  mantener un entorno seguro y prevenir tropiezos:
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
                      <strong>Alfombras y Superficies:</strong> Fijar las
                      alfombras sueltas con cinta antideslizante o retirarlas de
                      los pasillos y del trayecto hacia la cama.
                    </li>
                  )}
                  {hazards.lighting && (
                    <li style={{ marginBottom: "12px" }}>
                      <strong>Iluminación Nocturna:</strong> Colocar luces
                      nocturnas automáticas o lámparas de fácil acceso en el
                      trayecto desde el dormitorio hacia el baño.
                    </li>
                  )}
                  {hazards.bars && (
                    <li style={{ marginBottom: "12px" }}>
                      <strong>Sujeciones en Baño:</strong> Solicitar apoyo para
                      instalar barras firmes de sujeción al costado del inodoro
                      y dentro de la ducha.
                    </li>
                  )}
                  {hazards.obstacles && (
                    <li style={{ marginBottom: "12px" }}>
                      <strong>Rutas Libres de Obstáculos:</strong> Mantener los
                      pasillos y zonas de paso libres de cables sueltos, cajas o
                      calzados en el piso.
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
                      <strong>Acompañamiento Frecuente:</strong> Se recomienda
                      mantener una conversación con su familiar o médico de
                      cabecera para coordinar apoyo en desplazamientos fuera de
                      casa.
                    </li>
                  )}
                  {risk.color === "#F59E0B" && (
                    <li style={{ marginBottom: "12px" }}>
                      <strong>Calzado Adecuado:</strong> Procurar usar siempre
                      zapatos cerrados, bien ajustados y con suela de goma
                      antideslizante dentro y fuera del hogar.
                    </li>
                  )}
                  {risk.color === "#10B981" && (
                    <li style={{ marginBottom: "12px", color: "#047857" }}>
                      <strong>Actividad Física Habitual:</strong> Mantener sus
                      caminatas diarias a paso tranquilo para fortalecer la
                      musculatura y el equilibrio.
                    </li>
                  )}
                </ul>
              </div>

              {/* Botones de Acción */}
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
                <Button
                  variant="back"
                  onClick={() => {
                    setAnswers({});
                    setHazards({
                      rugs: false,
                      lighting: false,
                      bars: false,
                      obstacles: false,
                    });
                    setCurrentQuestion(0);
                    setScreen("onboarding");
                  }}
                >
                  Realizar Nueva Evaluación
                </Button>
              </div>
            </section>
          )}

          {/* VISTA 2: CUIDADOR / DASHBOARD INTEGRADO */}
          {roleMode === "caregiver" && (
            <section>
              {/* SECCIÓN CENTRADA Y DESTACADA: GRÁFICO DE ESTABILIDAD MAXIMIZADO */}
              <StabilityChart
                graphTimeframe={graphTimeframe}
                setGraphTimeframe={setGraphTimeframe}
                graphFilter={graphFilter}
                setGraphFilter={setGraphFilter}
                selectedGraphPoint={selectedGraphPoint}
                setSelectedGraphPoint={setSelectedGraphPoint}
              />

              {/* GRID PRINCIPAL: 2 COLUMNAS EQUILIBRADAS EN DESKTOP PARA CUIDADOR */}
              <div style={isDesktop ? styles.desktopGrid : {}}>
                {/* COLUMNA 1: Perfil de Usuario y Simulador */}
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
                      Alterne la actividad para probar cómo responden los nodos
                      de hardware:
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

                {/* COLUMNA 2: Semáforo Clínico, Plan y Sensores Físicos */}
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
                        Puntaje Escala de Morse:{" "}
                        <strong>{morseScore} / 125 pts</strong>
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
                          <strong>Alfombras:</strong> Fijar o retirar alfombras
                          sueltas en zonas de tránsito.
                        </li>
                      )}
                      {hazards.lighting && (
                        <li style={{ marginBottom: "8px" }}>
                          <strong>Iluminación:</strong> Instalar luces
                          automáticas nocturnas en pasillos.
                        </li>
                      )}
                      {hazards.bars && (
                        <li style={{ marginBottom: "8px" }}>
                          <strong>Sujeciones:</strong> Instalar barras firmes en
                          WC y ducha.
                        </li>
                      )}
                      {hazards.obstacles && (
                        <li style={{ marginBottom: "8px" }}>
                          <strong>Rutas Libres:</strong> Mantener suelos
                          despejados de cables y objetos.
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

              {/* Botones de Acción Global para Cuidador */}
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
                <Button
                  variant="back"
                  style={{ marginTop: "10px" }}
                  onClick={() => {
                    setAnswers({});
                    setHazards({
                      rugs: false,
                      lighting: false,
                      bars: false,
                      obstacles: false,
                    });
                    setCurrentQuestion(0);
                    setScreen("onboarding");
                  }}
                >
                  Reiniciar Evaluación
                </Button>
              </div>
            </section>
          )}

          {/* MODAL DE FICHA PREVENTIVA IMPRIMIBLE */}
          {showPrintModal && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.6)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
                padding: "20px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "28px",
                  maxWidth: "600px",
                  width: "100%",
                  maxHeight: "90vh",
                  overflowY: "auto",
                }}
              >
                <h2
                  style={{
                    color: "#0D9488",
                    margin: "0 0 12px 0",
                    borderBottom: "2.5px solid #0D9488",
                    paddingBottom: "8px",
                  }}
                >
                  Ficha Preventiva del Adulto Mayor
                </h2>
                <p style={{ fontSize: "15px", color: "#4B5563" }}>
                  Documento de orientación gerontológica para el hogar y la
                  consulta médica.
                </p>

                <div
                  style={{
                    marginTop: "16px",
                    lineHeight: "1.6",
                    fontSize: "16px",
                    color: "#111827",
                  }}
                >
                  <p>
                    <strong>Clasificación de Riesgo:</strong> {risk.label}
                  </p>
                  <p>
                    <strong>Puntaje Escala de Morse:</strong> {morseScore} / 125
                    puntos
                  </p>
                  <p>
                    <strong>Factores Ambientales Identificados:</strong>{" "}
                    {selectedHazardsCount} de 4 principales
                  </p>
                  <p>
                    <strong>Red de Apoyo Registrada:</strong>{" "}
                    {contact.name || "Sin registrar"} ({contact.phone || "N/A"})
                  </p>
                  <p>
                    <strong>Base de Datos:</strong> Supabase PostgreSQL
                  </p>
                </div>

                <div
                  style={{ marginTop: "24px", display: "flex", gap: "12px" }}
                >
                  <Button
                    variant="primary"
                    fullWidth={false}
                    style={{ flex: 1 }}
                    onClick={() => window.print()}
                  >
                    Imprimir / Guardar PDF
                  </Button>
                  <Button
                    variant="back"
                    fullWidth={false}
                    style={{ flex: 1 }}
                    onClick={() => setShowPrintModal(false)}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <footer
          style={{
            marginTop: "28px",
            textAlign: "center",
            fontSize: "14px",
            color: "#6B7280",
          }}
        >
          Diseñado bajo pautas de accesibilidad gerontológica WCAG 2.1 AA y
          Modelo TAM
        </footer>
      </main>
    </div>
  );
}
