import { useState, useEffect } from "react";
import { getStyles } from "../styles/theme";
import { useIsDesktop } from "../hooks/useDesktop";
import PrintModal from "../components/dashboard/PrintModal";
import Button from "../components/common/Button";
import Header from "../components/common/Header";
import StabilityChart from "../components/dashboard/StabilityChart";
import {
  startSession,
  endSession,
  fetchActiveSessions,
  fetchAllPatients,
  createPatient,
  sendCommandToESP32,
  fetchEvaluations,
  fetchAllSessionsByUser,
  fetchLatestSessionByUser,
  fetchTelemetryBySessionIds,
} from "../services/sessionService";
import { HOURLY_DATA } from "../constants/surveyData";

export default function AdminPanelModule({ onExit, onStartEvaluation }) {
  const isDesktop = useIsDesktop();
  const styles = getStyles(isDesktop);

  // --- ESTADOS ---
  const [patients, setPatients] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- ESTADOS DE GRAFICO ---
  const [viewMode, setViewMode] = useState("live");
  const [allSessionIds, setAllSessionIds] = useState([]);
  const [graphSessionId, setGraphSessionId] = useState(null);

  // --- ESTADOS DEL REPORTE ---
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState({
    patient: null,
    risk: null,
    hazards: {},
    metrics: {},
  });

  // IP del ESP32 persistente en localStorage
  const [esp32Ip, setEsp32Ip] = useState(
    () => localStorage.getItem("esp32_ip") || "10.242.196.70",
  );

  // Formulario de nuevo participante
  const [newPatient, setNewPatient] = useState({
    nombres: "",
    apellidos: "",
    rut: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);

  // Gráfico
  const [graphTimeframe, setGraphTimeframe] = useState("today");
  const [graphFilter, setGraphFilter] = useState("all");
  const [selectedGraphPoint, setSelectedGraphPoint] = useState(
    HOURLY_DATA[HOURLY_DATA.length - 1],
  );

  // --- EFECTOS ---
  useEffect(() => {
    loadData();
  }, []);

  // --- CARGA DE DATOS ---
  const loadData = async () => {
    try {
      const [patientsData, sessionsData, evalData] = await Promise.all([
        fetchAllPatients(),
        fetchActiveSessions(),
        fetchEvaluations(),
      ]);
      setPatients(patientsData);
      setSessions(sessionsData);
      setEvaluations(evalData);

      const active = sessionsData.find((s) => s.estado === "activa");
      if (active) {
        setActiveSessionId(active.id_sesion);
        setSelectedPatientId(active.id_usuario);
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
    }
  };

  // --- MANEJADORES ---
  const handleIpChange = (e) => {
    const newIp = e.target.value;
    setEsp32Ip(newIp);
    localStorage.setItem("esp32_ip", newIp);
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!newPatient.nombres || !newPatient.apellidos) {
      return alert("Nombre y Apellidos son obligatorios.");
    }
    setLoading(true);
    try {
      await createPatient(
        newPatient.nombres,
        newPatient.apellidos,
        newPatient.rut,
      );
      setNewPatient({ nombres: "", apellidos: "", rut: "" });
      setShowAddForm(false);
      await loadData();
    } catch (err) {
      alert("Error al registrar participante: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = async (e) => {
    const id = e.target.value;
    setSelectedPatientId(id);

    if (id) {
      try {
        const lastSession = await fetchLatestSessionByUser(id);
        if (lastSession) {
          setGraphSessionId(lastSession.id_sesion);
        } else {
          setGraphSessionId(null);
        }

        const allSessions = await fetchAllSessionsByUser(id);
        setAllSessionIds(allSessions.map((s) => s.id_sesion));
      } catch (err) {
        console.error("Error buscando sesiones:", err);
      }
    } else {
      setGraphSessionId(null);
      setAllSessionIds([]);
    }
  };

  const handleGenerateReport = async (patient) => {
    // 1. Obtenemos las sesiones del paciente
    const patientSessions = await fetchAllSessionsByUser(patient.id_usuario);
    const sessionIds = patientSessions.map((s) => s.id_sesion);
    const telemetry = await fetchTelemetryBySessionIds(sessionIds);

    // 2. Calculamos los promedios de telemetría
    let metrics = { avgStability: 0, avgTilt: 0, avgAccel: 0, avgCadence: 0 };
    if (telemetry.length > 0) {
      let sumStability = 0,
        sumTilt = 0,
        sumAccel = 0,
        sumCadence = 0;
      telemetry.forEach((event) => {
        const data =
          typeof event.datos_cinematicos === "string"
            ? JSON.parse(event.datos_cinematicos)
            : event.datos_cinematicos;
        sumTilt +=
          Math.acos(
            (data.az || 9.8) /
              Math.sqrt(
                (data.ax || 0) ** 2 +
                  (data.ay || 0) ** 2 +
                  (data.az || 9.8) ** 2,
              ),
          ) *
          (180 / Math.PI);
        sumAccel += Math.sqrt(
          (data.ax || 0) ** 2 + (data.ay || 0) ** 2 + (data.az || 9.8) ** 2,
        );
        sumCadence += data.cadencia || 0;
        sumStability += data.estado_pie === "apoyado" ? 95 : 85;
      });
      metrics = {
        avgStability: Math.round(sumStability / telemetry.length),
        avgTilt: Math.round(sumTilt / telemetry.length),
        avgAccel: Number((sumAccel / telemetry.length).toFixed(2)),
        avgCadence: Math.round(sumCadence / telemetry.length),
      };
    }

    // 3. Buscamos el riesgo
    const riskLabel = getLastRisk(patient.id_usuario);

    // 4. Buscamos los peligros de la ÚLTIMA evaluación de este paciente
    // Buscamos en el arreglo de evaluaciones la más reciente para este usuario
    const lastEval = evaluations.find(
      (e) => e.id_usuario === patient.id_usuario,
    );

    // Creamos un objeto de peligros basado en la evaluación (asumiendo que guardas los peligros ahí)
    // Nota: Si los peligros están en la tabla 'peligros_ambientales', deberías hacer una consulta similar aquí.
    const patientHazards = {
      A1: lastEval?.alfombras_sueltas || false,
      B1: lastEval?.pisos_resbaladizos || false,
      C1: lastEval?.iluminacion_deficiente || false,
      D1: lastEval?.ausencia_barras || false,
      E1: lastEval?.desniveles || false,
    };

    setReportData({
      patient,
      risk: {
        stars: riskLabel.includes("Alto")
          ? 1
          : riskLabel.includes("Medio")
            ? 3
            : 5,
        safetyLabel:
          riskLabel === "Sin evaluar" ? "Sin evaluación registrada" : riskLabel,
      },
      hazards: patientHazards,
      metrics,
    });

    setShowReport(true);
  };

  const handleStart = async () => {
    if (!selectedPatientId) return alert("Selecciona un participante.");
    setLoading(true);
    try {
      const newSession = await startSession(selectedPatientId);
      setActiveSessionId(newSession.id_sesion);
      setGraphSessionId(newSession.id_sesion);

      const success = await sendCommandToESP32(
        esp32Ip,
        "start",
        newSession.id_sesion,
      );
      if (!success) {
        alert(
          "Sesión creada en BD, pero no se pudo conectar con el ESP32. Verifica la IP y el WiFi.",
        );
      }
      await loadData();
    } catch (err) {
      alert("Error al iniciar sesión: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = async () => {
    if (!activeSessionId) return;
    setLoading(true);
    try {
      await sendCommandToESP32(esp32Ip, "stop");
      await endSession(activeSessionId);
      setActiveSessionId(null);
      await loadData();
    } catch (err) {
      alert("Error al finalizar sesión: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getLastRisk = (idUsuario) => {
    const patient = patients.find((p) => p.id_usuario === idUsuario);
    return patient?.nivel_riesgo_actual || "Sin evaluar";
  };

  // --- ESTILOS LOCALES ---
  const adminStyles = {
    sectionTitle: {
      fontSize: "18px",
      fontWeight: "700",
      color: "#111827",
      marginBottom: "16px",
      borderBottom: "1px solid #E5E7EB",
      paddingBottom: "8px",
    },
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: "600",
      color: "#374151",
      marginBottom: "6px",
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      fontSize: "14px",
      borderRadius: "6px",
      border: "1px solid #D1D5DB",
      marginBottom: "12px",
      boxSizing: "border-box",
    },
    card: {
      backgroundColor: "#FFFFFF",
      border: "1px solid #E5E7EB",
      borderRadius: "8px",
      padding: "20px",
      marginBottom: "20px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    },
  };

  return (
    <div style={styles.wrapper}>
      <main style={styles.container}>
        <Header roleMode="caregiver" onChangeRole={() => {}} />

        <div style={{ marginTop: "24px" }}>
          {/* CABECERA */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <h2
              style={{
                fontSize: "22px",
                fontWeight: "800",
                color: "#111827",
                margin: 0,
              }}
            >
              Panel de Control - Admin
            </h2>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "#F3F4F6",
                  padding: "4px 12px",
                  borderRadius: "6px",
                  border: "1px solid #E5E7EB",
                }}
              >
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "#4B5563",
                  }}
                >
                  IP Sensor:
                </label>
                <input
                  style={{
                    border: "none",
                    background: "transparent",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#0D9488",
                    width: "110px",
                    outline: "none",
                  }}
                  value={esp32Ip}
                  onChange={handleIpChange}
                  placeholder="192.168.1.150"
                />
              </div>
              <Button
                variant="back"
                onClick={onExit}
                style={{
                  width: "auto",
                  minHeight: "36px",
                  padding: "6px 16px",
                  fontSize: "14px",
                }}
              >
                Salir
              </Button>
            </div>
          </div>

          {/* 1. DIRECTORIO DE PARTICIPANTES */}
          <div style={adminStyles.card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3
                style={{
                  ...adminStyles.sectionTitle,
                  margin: 0,
                  border: "none",
                  padding: 0,
                }}
              >
                Directorio de Participantes
              </h3>
              <Button
                variant={showAddForm ? "secondary" : "primary"}
                onClick={() => setShowAddForm(!showAddForm)}
                style={{
                  width: "auto",
                  minHeight: "32px",
                  padding: "4px 12px",
                  fontSize: "13px",
                }}
              >
                {showAddForm ? "Cancelar" : "+ Nuevo Participante"}
              </Button>
            </div>

            {showAddForm && (
              <form
                onSubmit={handleCreatePatient}
                style={{
                  backgroundColor: "#F9FAFB",
                  padding: "16px",
                  borderRadius: "6px",
                  marginBottom: "16px",
                  border: "1px solid #E5E7EB",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isDesktop ? "1fr 1fr 1fr" : "1fr",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label style={adminStyles.label}>Nombres</label>
                    <input
                      style={adminStyles.input}
                      value={newPatient.nombres}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          nombres: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label style={adminStyles.label}>Apellidos</label>
                    <input
                      style={adminStyles.input}
                      value={newPatient.apellidos}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          apellidos: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label style={adminStyles.label}>RUT</label>
                    <input
                      style={adminStyles.input}
                      placeholder="Ej: 12345678-9"
                      value={newPatient.rut}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, rut: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "auto",
                    minHeight: "36px",
                    padding: "6px 16px",
                    fontSize: "14px",
                  }}
                >
                  Guardar Participante
                </Button>
              </form>
            )}

            <div
              style={{
                maxHeight: "200px",
                overflowY: "auto",
                border: "1px solid #E5E7EB",
                borderRadius: "6px",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                }}
              >
                <thead
                  style={{
                    backgroundColor: "#F9FAFB",
                    textAlign: "left",
                    position: "sticky",
                    top: 0,
                  }}
                >
                  <tr>
                    <th
                      style={{
                        padding: "8px 12px",
                        borderBottom: "1px solid #E5E7EB",
                      }}
                    >
                      Nombre Completo
                    </th>
                    <th
                      style={{
                        padding: "8px 12px",
                        borderBottom: "1px solid #E5E7EB",
                      }}
                    >
                      Riesgo Actual
                    </th>
                    <th
                      style={{
                        padding: "8px 12px",
                        borderBottom: "1px solid #E5E7EB",
                      }}
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => {
                    const riskLabel = getLastRisk(p.id_usuario);
                    const riskColor = riskLabel.includes("Alto")
                      ? "#B91C1C"
                      : riskLabel.includes("Medio")
                        ? "#B45309"
                        : riskLabel.includes("Bajo")
                          ? "#047857"
                          : "#6B7280";
                    return (
                      <tr
                        key={p.id_usuario}
                        style={{ borderBottom: "1px solid #F3F4F6" }}
                      >
                        <td style={{ padding: "8px 12px", fontWeight: "500" }}>
                          {p.nombres} {p.apellidos}
                        </td>
                        <td
                          style={{
                            padding: "8px 12px",
                            fontWeight: "700",
                            color: riskColor,
                          }}
                        >
                          {riskLabel}
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            {/* BOTONES DE ACCIÓN CORREGIDOS */}
                            <button
                              onClick={() => onStartEvaluation(p.id_usuario)}
                              style={{
                                padding: "4px 10px",
                                fontSize: "12px",
                                backgroundColor: "#0D9488",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontWeight: "600",
                              }}
                            >
                              Evaluar
                            </button>
                            <button
                              onClick={() => handleGenerateReport(p)}
                              style={{
                                padding: "4px 10px",
                                fontSize: "12px",
                                backgroundColor: "#F3F4F6",
                                color: "#374151",
                                border: "1px solid #D1D5DB",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontWeight: "600",
                              }}
                            >
                              Reporte PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. CONTROL DE SESIÓN */}
          <div
            style={{
              ...adminStyles.card,
              borderLeft: `4px solid ${activeSessionId ? "#EF4444" : "#0D9488"}`,
            }}
          >
            <h3 style={adminStyles.sectionTitle}>
              Control de Sesión de Prueba
            </h3>
            {activeSessionId ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#FEF2F2",
                  padding: "16px",
                  borderRadius: "6px",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      fontWeight: "700",
                      color: "#B91C1C",
                    }}
                  >
                    Sesión en curso
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "13px",
                      color: "#7F1D1D",
                    }}
                  >
                    Transmitiendo desde el sensor en {esp32Ip}.
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={handleEnd}
                  disabled={loading}
                  style={{
                    backgroundColor: "#DC2626",
                    width: "auto",
                    minHeight: "36px",
                    padding: "6px 16px",
                  }}
                >
                  Finalizar Prueba
                </Button>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isDesktop ? "2fr 1fr auto" : "1fr",
                  gap: "12px",
                  alignItems: "end",
                }}
              >
                <div>
                  <label style={adminStyles.label}>
                    Seleccionar Participante
                  </label>
                  <select
                    style={adminStyles.input}
                    value={selectedPatientId}
                    onChange={handlePatientSelect}
                  >
                    <option value="">-- Selecciona un participante --</option>
                    {patients.map((p) => (
                      <option key={p.id_usuario} value={p.id_usuario}>
                        {p.nombres} {p.apellidos}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  variant="primary"
                  onClick={handleStart}
                  disabled={loading || !selectedPatientId}
                  style={{ minHeight: "20px", marginBottom: "12px" }}
                >
                  Iniciar Prueba
                </Button>
              </div>
            )}
          </div>

          {/* 3. GRÁFICO EN VIVO */}
          <div
            style={{ ...adminStyles.card, padding: "0", overflow: "hidden" }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #E5E7EB",
                backgroundColor: "#F9FAFB",
              }}
            >
              <h3
                style={{
                  ...adminStyles.sectionTitle,
                  margin: 0,
                  border: "none",
                  padding: 0,
                }}
              >
                Telemetría en Tiempo Real
              </h3>
            </div>
            <div
              style={{
                padding: "20px",
                opacity: activeSessionId || graphSessionId ? 1 : 0.4,
                pointerEvents:
                  activeSessionId || graphSessionId ? "auto" : "none",
              }}
            >
              {selectedPatientId && (
                <div
                  style={{ display: "flex", gap: "8px", marginBottom: "16px" }}
                >
                  <button
                    onClick={() => setViewMode("live")}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor:
                        viewMode === "live" ? "#0D9488" : "#E5E7EB",
                      color: viewMode === "live" ? "#fff" : "#374151",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Última Sesión
                  </button>
                  <button
                    onClick={() => setViewMode("history")}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor:
                        viewMode === "history" ? "#0D9488" : "#E5E7EB",
                      color: viewMode === "history" ? "#fff" : "#374151",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Histórico Completo
                  </button>
                </div>
              )}

              <StabilityChart
                sessionId={
                  viewMode === "history"
                    ? allSessionIds
                    : activeSessionId || graphSessionId
                }
                graphTimeframe={graphTimeframe}
                setGraphTimeframe={setGraphTimeframe}
                graphFilter={graphFilter}
                setGraphFilter={setGraphFilter}
                selectedGraphPoint={selectedGraphPoint}
                setSelectedGraphPoint={setSelectedGraphPoint}
              />
            </div>
          </div>

          {/* 4. HISTORIAL DE SESIONES */}
          <div style={adminStyles.card}>
            <h3 style={adminStyles.sectionTitle}>Historial de Pruebas</h3>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                }}
              >
                <thead
                  style={{ backgroundColor: "#F9FAFB", textAlign: "left" }}
                >
                  <tr>
                    <th
                      style={{
                        padding: "10px 12px",
                        borderBottom: "1px solid #E5E7EB",
                      }}
                    >
                      Participante
                    </th>
                    <th
                      style={{
                        padding: "10px 12px",
                        borderBottom: "1px solid #E5E7EB",
                      }}
                    >
                      Estado
                    </th>
                    <th
                      style={{
                        padding: "10px 12px",
                        borderBottom: "1px solid #E5E7EB",
                      }}
                    >
                      Fecha / Hora
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr
                      key={s.id_sesion}
                      style={{ borderBottom: "1px solid #F3F4F6" }}
                    >
                      <td style={{ padding: "10px 12px", fontWeight: "500" }}>
                        {s.usuarios?.nombres || "Desconocido"}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span
                          style={{
                            backgroundColor:
                              s.estado === "activa" ? "#FEF2F2" : "#ECFDF5",
                            color:
                              s.estado === "activa" ? "#B91C1C" : "#047857",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "700",
                          }}
                        >
                          {s.estado.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", color: "#6B7280" }}>
                        {new Date(s.fecha_inicio).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. MODAL DE REPORTE */}
          {showReport && (
            <PrintModal
              show={showReport}
              onClose={() => setShowReport(false)}
              patient={reportData.patient}
              risk={reportData.risk}
              hazards={reportData.hazards}
              contact={{ name: "Red de Apoyo", phone: "-" }}
              metrics={reportData.metrics}
            />
          )}
        </div>
      </main>
    </div>
  );
}
