import { useState, useEffect } from "react";
import { getStyles } from "../styles/theme";
import { useIsDesktop } from "../hooks/useDesktop";
import PrintModal from "../components/dashboard/PrintModal";
import Button from "../components/common/Button";
import Header from "../components/common/Header";
import StabilityChart from "../components/dashboard/StabilityChart";
import { supabase } from "../services/supabaseClient";
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

export default function AdminPanelModule({ onExit, onStartEvaluation }) {
  const isDesktop = useIsDesktop();
  const styles = getStyles(isDesktop);

  // --- ESTADOS ---
  const [patients, setPatients] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [patientSessions, setPatientSessions] = useState([]); // Guarda las sesiones del paciente seleccionado
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
    contact: {},
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

  // Recomendaciones y peligros ambientales del participante seleccionado
  const [patientRecommendations, setPatientRecommendations] = useState([]);
  const [patientHazards, setPatientHazards] = useState({});

  // Filtro del gráfico (Todos / Alertas)
  const [graphFilter, setGraphFilter] = useState("all");
  const [selectedGraphPoint, setSelectedGraphPoint] = useState(null);
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
        setGraphSessionId(active.id_sesion);
        const [allSessions, { data: lastHazard }] = await Promise.all([
          fetchAllSessionsByUser(active.id_usuario),
          supabase
            .from("peligros_ambientales")
            .select("*")
            .eq("id_usuario", active.id_usuario)
            .order("fecha_registro", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);
        setPatientSessions(allSessions);
        setAllSessionIds(allSessions.map((s) => s.id_sesion));
        setPatientHazards(lastHazard || {});
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
    setSelectedGraphPoint(null);
    setGraphFilter("all");

    if (id) {
      try {
        // 1. Cargar recomendaciones y últimos peligros ambientales
        const [{ data: recs }, { data: lastHazard }] = await Promise.all([
          supabase
            .from("recomendaciones")
            .select("*")
            .eq("id_usuario", id)
            .order("fecha_generacion", { ascending: false }),
          supabase
            .from("peligros_ambientales")
            .select("*")
            .eq("id_usuario", id)
            .order("fecha_registro", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);
        setPatientRecommendations(recs || []);
        setPatientHazards(lastHazard || {});

        // 2. Cargar sesiones
        const lastSession = await fetchLatestSessionByUser(id);
        if (lastSession) {
          setGraphSessionId(lastSession.id_sesion);
        } else {
          setGraphSessionId(null);
        }

        const allSessions = await fetchAllSessionsByUser(id);
        setPatientSessions(allSessions);
        setAllSessionIds(allSessions.map((s) => s.id_sesion));
      } catch (err) {
        console.error("Error buscando sesiones:", err);
      }
    } else {
      setGraphSessionId(null);
      setAllSessionIds([]);
      setPatientSessions([]);
      setPatientRecommendations([]);
      setPatientHazards({});
    }
  };

  const handleGenerateReport = async (patient) => {
    // 1. Obtenemos las sesiones del paciente y la telemetría
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

    // 4. Buscamos los peligros de la ÚLTIMA evaluación
    const { data: lastHazard } = await supabase
      .from("peligros_ambientales")
      .select("*")
      .eq("id_usuario", patient.id_usuario)
      .order("fecha_registro", { ascending: false })
      .limit(1)
      .maybeSingle();

    const patientHazards = {
      A1: lastHazard?.alfombras_sueltas || false,
      B1: lastHazard?.alfombras_sueltas || false,
      C1: lastHazard?.iluminacion_deficiente || false,
      D1: lastHazard?.ausencia_barras || false,
      E1: lastHazard?.obstaculos_ruta || false,
    };

    // 5. Buscamos el último contacto de emergencia
    const { data: lastContact } = await supabase
      .from("contactos_emergencia")
      .select("*")
      .eq("id_usuario", patient.id_usuario)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 6. Armamos el objeto final del reporte
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
      contact: lastContact
        ? { name: lastContact.nombre, phone: lastContact.telefono }
        : { name: "Sin registrar", phone: "-" },
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
      const allSessions = await fetchAllSessionsByUser(selectedPatientId);
      setPatientSessions(allSessions);
      setAllSessionIds(allSessions.map((s) => s.id_sesion));
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
      fontSize: "17px",
      fontWeight: "700",
      color: "#0F172A",
      marginBottom: "16px",
      borderBottom: "1px solid #E2E8F0",
      paddingBottom: "10px",
      letterSpacing: "-0.01em",
    },
    label: {
      display: "block",
      fontSize: "13.5px",
      fontWeight: "600",
      color: "#334155",
      marginBottom: "6px",
    },
    input: {
      width: "100%",
      minHeight: "44px",
      padding: "10px 12px",
      fontSize: "14.5px",
      borderRadius: "8px",
      border: "1.5px solid #CBD5E1",
      backgroundColor: "#FFFFFF",
      color: "#0F172A",
      marginBottom: "12px",
      boxSizing: "border-box",
    },
    card: {
      backgroundColor: "#FFFFFF",
      border: "1px solid #E2E8F0",
      borderRadius: "14px",
      padding: isDesktop ? "22px" : "16px",
      marginBottom: "20px",
      boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
    },
  };

  const hasChartData =
    viewMode === "history"
      ? allSessionIds.length > 0
      : Boolean(activeSessionId || graphSessionId);

  const handleChangeViewMode = (mode) => {
    setViewMode(mode);
    setSelectedGraphPoint(null);
    setGraphFilter("all");
  };

  return (
    <div style={styles.wrapper}>
      <main style={styles.container}>
        <Header
          roleMode="caregiver"
          onChangeRole={() => {}}
          hideRoleSwitch={true}
          onLogout={onExit}
        />

        <div style={{ marginTop: "8px" }}>
          {/* CABECERA INVESTIGADOR */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: isDesktop ? "22px" : "19px",
                  fontWeight: "800",
                  color: "#0F172A",
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                Panel de Control e Investigación
              </h2>
              <p
                style={{
                  fontSize: "13.5px",
                  color: "#64748B",
                  margin: "2px 0 0 0",
                }}
              >
                Gestión de participantes, sesiones IoT y análisis de estabilidad
              </p>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#F8FAFC",
                padding: "7px 12px",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                width: isDesktop ? "auto" : "100%",
                boxSizing: "border-box",
              }}
            >
              <label
                style={{
                  fontSize: "12.5px",
                  fontWeight: "700",
                  color: "#475569",
                  whiteSpace: "nowrap",
                }}
              >
                IP ESP32:
              </label>
              <input
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "13.5px",
                  fontWeight: "700",
                  color: "#0F766E",
                  width: isDesktop ? "125px" : "100%",
                  outline: "none",
                }}
                value={esp32Ip}
                onChange={handleIpChange}
                placeholder="192.168.1.150"
              />
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
                  flexWrap: "wrap",
                  gap: "12px",
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FECACA",
                  padding: "16px",
                  borderRadius: "10px",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      fontWeight: "700",
                      color: "#991B1B",
                    }}
                  >
                    Sesión en curso
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "13.5px",
                      color: "#7F1D1D",
                    }}
                  >
                    Transmitiendo telemetría desde el sensor en {esp32Ip}.
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={handleEnd}
                  disabled={loading}
                  style={{
                    backgroundColor: "#DC2626",
                    width: isDesktop ? "auto" : "100%",
                    minHeight: "42px",
                    padding: "8px 18px",
                    fontSize: "14.5px",
                    margin: 0,
                  }}
                >
                  Finalizar Prueba
                </Button>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isDesktop ? "2fr auto" : "1fr",
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
                  style={{
                    width: isDesktop ? "auto" : "100%",
                    minHeight: "44px",
                    fontSize: "15px",
                    padding: "10px 22px",
                    margin: "0 0 12px 0",
                  }}
                >
                  Iniciar Prueba
                </Button>
              </div>
            )}
          </div>

          {/* 3. GRÁFICO DE TELEMETRÍA E HISTÓRICO */}
          <div
            style={{ ...adminStyles.card, padding: "0", overflow: "hidden" }}
          >
            <div
              style={{
                padding: isDesktop ? "16px 22px" : "14px 16px",
                borderBottom: "1px solid #E2E8F0",
                backgroundColor: "#F8FAFC",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
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
                Análisis de Estabilidad y Telemetría
              </h3>

              {selectedPatientId && (
                <div
                  style={{
                    display: "inline-flex",
                    backgroundColor: "#E2E8F0",
                    padding: "3px",
                    borderRadius: "10px",
                    gap: "4px",
                    width: isDesktop ? "auto" : "100%",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleChangeViewMode("live")}
                    style={{
                      flex: isDesktop ? "none" : 1,
                      padding: "8px 16px",
                      minHeight: "38px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor:
                        viewMode === "live" ? "#FFFFFF" : "transparent",
                      color: viewMode === "live" ? "#0F766E" : "#475569",
                      fontSize: "13.5px",
                      fontWeight: "700",
                      cursor: "pointer",
                      boxShadow:
                        viewMode === "live"
                          ? "0 1px 3px rgba(15, 23, 42, 0.1)"
                          : "none",
                    }}
                  >
                    Última Sesión
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangeViewMode("history")}
                    style={{
                      flex: isDesktop ? "none" : 1,
                      padding: "8px 16px",
                      minHeight: "38px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor:
                        viewMode === "history" ? "#FFFFFF" : "transparent",
                      color: viewMode === "history" ? "#0F766E" : "#475569",
                      fontSize: "13.5px",
                      fontWeight: "700",
                      cursor: "pointer",
                      boxShadow:
                        viewMode === "history"
                          ? "0 1px 3px rgba(15, 23, 42, 0.1)"
                          : "none",
                    }}
                  >
                    Histórico Completo
                  </button>
                </div>
              )}
            </div>

            <div
              style={{
                padding: isDesktop ? "20px" : "14px",
                opacity: hasChartData ? 1 : 0.55,
                pointerEvents: hasChartData ? "auto" : "none",
              }}
            >
              {/* SELECTOR DE SESIÓN (Solo visible en la vista "Última Sesión") */}
              {selectedPatientId &&
                viewMode === "live" &&
                patientSessions.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: isDesktop ? "row" : "column",
                      alignItems: isDesktop ? "center" : "stretch",
                      gap: "10px",
                      marginBottom: "16px",
                      backgroundColor: "#F8FAFC",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "13.5px",
                        fontWeight: "700",
                        color: "#334155",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Sesión visualizada:
                    </label>
                    <select
                      style={{
                        padding: "9px 12px",
                        minHeight: "42px",
                        borderRadius: "8px",
                        border: "1.5px solid #CBD5E1",
                        backgroundColor: "#FFFFFF",
                        color: "#0F172A",
                        fontSize: "14px",
                        fontWeight: "500",
                        width: "100%",
                        maxWidth: isDesktop ? "420px" : "100%",
                      }}
                      value={graphSessionId || activeSessionId || ""}
                      onChange={(e) => {
                        setGraphSessionId(e.target.value);
                        setSelectedGraphPoint(null);
                      }}
                    >
                      {[...patientSessions].reverse().map((s, revIdx) => {
                        const sessionNum = patientSessions.length - revIdx;
                        const isLive = s.id_sesion === activeSessionId;
                        return (
                          <option key={s.id_sesion} value={s.id_sesion}>
                            Sesión {sessionNum} —{" "}
                            {new Date(s.fecha_inicio).toLocaleString("es-CL")}
                            {isLive ? " (En curso)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

              <StabilityChart
                sessionId={
                  viewMode === "history"
                    ? allSessionIds
                    : graphSessionId || activeSessionId
                }
                viewMode={viewMode}
                graphFilter={graphFilter}
                setGraphFilter={setGraphFilter}
                selectedGraphPoint={selectedGraphPoint}
                setSelectedGraphPoint={setSelectedGraphPoint}
                hazards={patientHazards}
              />
            </div>
          </div>

          {/* 4. RECOMENDACIONES */}
          {viewMode === "history" && patientRecommendations.length > 0 && (
            <div style={adminStyles.card}>
              <h3 style={adminStyles.sectionTitle}>Plan de Acción Generado</h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#4B5563",
                  marginBottom: "16px",
                }}
              >
                Estas son las adaptaciones recomendadas para el hogar del
                participante según sus evaluaciones:
              </p>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {patientRecommendations.map((r) => (
                  <li
                    key={r.id_recomendacion}
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #E5E7EB",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong
                        style={{
                          color: "#0D9488",
                          fontSize: "12px",
                          textTransform: "uppercase",
                        }}
                      >
                        {r.tipo_recomendacion}
                      </strong>
                      <p style={{ margin: "4px 0 0 0", fontSize: "14px" }}>
                        {r.descripcion}
                      </p>
                    </div>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={r.estado_aplicada}
                        readOnly
                      />
                      Aplicada
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 5. HISTORIAL DE SESIONES */}
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

          {/* 6. MODAL DE REPORTE */}
          {showReport && (
            <PrintModal
              show={showReport}
              onClose={() => setShowReport(false)}
              patient={reportData.patient}
              risk={reportData.risk}
              hazards={reportData.hazards}
              contact={reportData.contact}
              metrics={reportData.metrics}
            />
          )}
        </div>
      </main>
    </div>
  );
}
