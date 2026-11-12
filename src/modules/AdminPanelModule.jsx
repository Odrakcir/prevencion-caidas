import { useState, useEffect } from "react";
import { getStyles } from "../styles/theme";
import { useIsDesktop } from "../hooks/useDesktop";
import Button from "../components/common/Button";
import Header from "../components/common/Header";
import StabilityChart from "../components/dashboard/StabilityChart";
import RiskModal from "./RiskModal"; // <-- NUEVO IMPORT
import {
  startSession,
  endSession,
  fetchActiveSessions,
  fetchAllPatients,
  createPatient,
  sendCommandToESP32,
  saveEvaluation, // <-- NUEVO
  fetchEvaluations, // <-- NUEVO
} from "../services/sessionService";
import { HOURLY_DATA, WEEKLY_DATA } from "../constants/surveyData";

export default function AdminPanelModule({ onExit }) {
  const isDesktop = useIsDesktop();
  const styles = getStyles(isDesktop);

  // --- ESTADOS ---
  const [patients, setPatients] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [evaluations, setEvaluations] = useState([]); // NUEVO: Historial de riesgos

  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [investigatorName, setInvestigatorName] = useState("");

  // Estado para el Modal de Riesgo
  const [selectedPatientForRisk, setSelectedPatientForRisk] = useState(null);

  // IP del ESP32 persistente en localStorage
  const [esp32Ip, setEsp32Ip] = useState(
    () => localStorage.getItem("esp32_ip") || "192.168.1.150",
  );

  // Formulario de nuevo paciente
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
        fetchEvaluations(), // Cargamos las evaluaciones
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
      alert("Error al registrar paciente: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!selectedPatientId) return alert("Selecciona un paciente.");
    setLoading(true);
    try {
      const newSession = await startSession(
        selectedPatientId,
        investigatorName,
      );
      setActiveSessionId(newSession.id_sesion);

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

  // NUEVO: Guardar Evaluación de Riesgo
  const handleSaveRisk = async (idUsuario, answers, score, riskLabel) => {
    try {
      await saveEvaluation(idUsuario, answers, score, riskLabel);
      setSelectedPatientForRisk(null);
      await loadData();
    } catch (err) {
      alert("Error al guardar evaluación: " + err.message);
    }
  };

  // NUEVO: Obtener el último riesgo de un paciente para mostrarlo en la tabla
  const getLastRisk = (idUsuario) => {
    const patient = patients.find((p) => p.id_usuario === idUsuario);
    return patient?.nivel_riesgo_actual || "Sin evaluar";
  };

  // --- ESTILOS LOCALES (COMPACTOS) ---
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
              Panel de Control - Investigador
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

          {/* 1. DIRECTORIO DE PACIENTES */}
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
                Directorio de Pacientes
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
                {showAddForm ? "Cancelar" : "+ Nuevo Paciente"}
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
                  Guardar Paciente
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
                          <button
                            onClick={() => setSelectedPatientForRisk(p)}
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
                            Evaluar Riesgo
                          </button>
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
                  <label style={adminStyles.label}>Seleccionar Paciente</label>
                  <select
                    style={adminStyles.input}
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                  >
                    <option value="">-- Selecciona un paciente --</option>
                    {patients.map((p) => (
                      <option key={p.id_usuario} value={p.id_usuario}>
                        {p.nombres} {p.apellidos}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={adminStyles.label}>
                    Investigador (Opcional)
                  </label>
                  <input
                    style={adminStyles.input}
                    placeholder="Tu nombre"
                    value={investigatorName}
                    onChange={(e) => setInvestigatorName(e.target.value)}
                  />
                </div>
                <Button
                  variant="primary"
                  onClick={handleStart}
                  disabled={loading || !selectedPatientId}
                  style={{ minHeight: "40px", marginBottom: "12px" }}
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
                opacity: activeSessionId ? 1 : 0.4,
                pointerEvents: activeSessionId ? "auto" : "none",
              }}
            >
              <StabilityChart
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
                      Paciente
                    </th>
                    <th
                      style={{
                        padding: "10px 12px",
                        borderBottom: "1px solid #E5E7EB",
                      }}
                    >
                      Investigador
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
                      <td style={{ padding: "10px 12px", color: "#4B5563" }}>
                        {s.nombre_investigador || "-"}
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
        </div>
      </main>

      {/* MODAL DE EVALUACIÓN (Se muestra si hay un paciente seleccionado) */}
      {selectedPatientForRisk && (
        <RiskModal
          patient={selectedPatientForRisk}
          onClose={() => setSelectedPatientForRisk(null)}
          onSave={handleSaveRisk}
        />
      )}
    </div>
  );
}
