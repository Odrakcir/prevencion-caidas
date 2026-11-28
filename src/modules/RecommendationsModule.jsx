import { useState, useEffect } from "react";
import { getStyles } from "../styles/theme";
import { useIsDesktop } from "../hooks/useDesktop";
import Button from "../components/common/Button";
import SafetyStars from "../components/common/SafetyStars";
import PrintModal from "../components/dashboard/PrintModal";
import { ENVIRONMENTAL_HAZARDS } from "../constants/surveyData";
import {
  fetchUserRecommendations,
  saveUserRecommendationsProgress,
} from "../services/sessionService";
import { enqueuePendingRecommendations } from "../services/offlineStorage";

// Mapeo estático de prefijos de ID a habitaciones del hogar
const ZONES_CONFIG = [
  { prefix: "A", name: "Sala" },
  { prefix: "B", name: "Cocina" },
  { prefix: "C", name: "Dormitorio" },
  { prefix: "D", name: "Baño" },
  { prefix: "E", name: "Pasillos" },
];

// Diccionario de recomendaciones por ID
const RECOMMENDATIONS_MAP = {
  A1: {
    action:
      "Fijar las alfombras sueltas con cinta antideslizante de doble contacto o retirarlas de las zonas de paso.",
    priority: "alta",
  },
  A2: {
    action:
      "Ordenar los cables de lámparas y alargadores, manteniéndolos pegados a la pared fuera del recorrido habitual.",
    priority: "alta",
  },
  A3: {
    action:
      "Evitar sillones demasiado blandos; agregar un cojín firme o elevador de patas para facilitar el levantamiento.",
    priority: "media",
  },
  B1: {
    action:
      "Limpiar inmediatamente derrames de agua o grasa y utilizar calzado cerrado con suela antideslizante en la cocina.",
    priority: "alta",
  },
  B2: {
    action:
      "Bajar los platos, vasos y alimentos de uso diario a estantes ubicados entre la cintura y el pecho.",
    priority: "media",
  },
  B3: {
    action:
      "Retirar los paños o secapiés del suelo que puedan doblarse y provocar tropiezos.",
    priority: "media",
  },
  C1: {
    action:
      "Instalar luces nocturnas automáticas con sensor en el trayecto desde la cama hasta el baño.",
    priority: "alta",
  },
  C2: {
    action:
      "Ajustar la altura de la cama para que al sentarse en el borde ambos pies apoyen firmemente en el suelo.",
    priority: "media",
  },
  C3: {
    action:
      "Usar pantuflas cerradas con talón firme o calcetines con goma antideslizante.",
    priority: "media",
  },
  D1: {
    action:
      "Instalar barras de sujeción firmes a 80–90 cm del suelo junto al inodoro y dentro de la ducha.",
    priority: "alta",
  },
  D2: {
    action:
      "Colocar una goma de succión antideslizante dentro de la ducha o tina antes de cada uso.",
    priority: "alta",
  },
  D3: {
    action:
      "Si el borde de la tina es alto, considerar una silla de ducha o banco de transferencia estable.",
    priority: "alta",
  },
  E1: {
    action:
      "Señalizar los desniveles o peldaños con cinta reflectante de alto contraste para distinguirlos fácilmente.",
    priority: "alta",
  },
  E2: {
    action:
      "Asegurar que las escaleras cuenten con pasamanos firme y continuo para apoyarse al subir y bajar.",
    priority: "alta",
  },
  E3: {
    action:
      "Mejorar la iluminación de pasillos con ampolletas de buena intensidad e interruptores de fácil acceso.",
    priority: "media",
  },
};

export default function RecommendationsModule({
  risk,
  morseScore,
  selectedHazardsCount,
  contact,
  hazards,
  userProfile,
  onReset,
  onOfflineQueueChange,
}) {
  const isDesktop = useIsDesktop();
  const styles = getStyles(isDesktop);

  // 1. Filtramos solo los peligros marcados en true
  const safeHazards = hazards || {};
  const activeHazards = ENVIRONMENTAL_HAZARDS.filter((h) => safeHazards[h.id]);

  // 2. Agrupamos por zona usando el arreglo estático (A=Sala, B=Cocina, etc.)
  const groupedZones = ZONES_CONFIG.map((zoneCfg) => {
    const items = activeHazards.filter((h) => h.id.startsWith(zoneCfg.prefix));
    return {
      ...zoneCfg,
      items,
    };
  }).filter((z) => z.items.length > 0);

  // 3. Estado del acordeón: por defecto abre la primera habitación con peligros
  const [openZone, setOpenZone] = useState(
    () => groupedZones[0]?.name || null,
  );

  const storageKey = userProfile?.id_usuario
    ? `hogar_seguro_recs_${userProfile.id_usuario}`
    : "hogar_seguro_recs_local";

  const [checkedActions, setCheckedActions] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | "saved" | "error"
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Sincronizamos el estado inicial con las recomendaciones ya guardadas en Supabase
  useEffect(() => {
    if (!userProfile?.id_usuario || !navigator.onLine) return;
    let isMounted = true;

    fetchUserRecommendations(userProfile.id_usuario)
      .then((rows) => {
        if (!isMounted || !rows.length) return;
        const fromDb = {};
        ENVIRONMENTAL_HAZARDS.forEach((h) => {
          const actionText = RECOMMENDATIONS_MAP[h.id]?.action;
          const match = rows.find((r) => r.descripcion === actionText);
          if (match) {
            fromDb[h.id] = Boolean(match.estado_aplicada);
          }
        });
        if (Object.keys(fromDb).length > 0) {
          setCheckedActions((prev) => ({ ...prev, ...fromDb }));
        }
      })
      .catch(() => {
        // Si no hay conexión, conservamos el respaldo local del dispositivo
      });

    return () => {
      isMounted = false;
    };
  }, [userProfile?.id_usuario]);

  const completedCount = activeHazards.filter(
    (h) => checkedActions[h.id],
  ).length;
  const progressPct =
    activeHazards.length > 0
      ? Math.round((completedCount / activeHazards.length) * 100)
      : 100;

  const handleToggleZone = (zoneName) => {
    setOpenZone((prev) => (prev === zoneName ? null : zoneName));
  };

  const toggleActionDone = (id) => {
    setCheckedActions((prev) => ({ ...prev, [id]: !prev[id] }));
    setHasUnsavedChanges(true);
    setSaveStatus(null);
  };

  const handleSaveRecommendations = async () => {
    setSaving(true);
    setSaveStatus(null);

    try {
      // 1. Guardamos respaldo local inmediato en el dispositivo (PWA Offline-First)
      try {
        localStorage.setItem(storageKey, JSON.stringify(checkedActions));
      } catch {
        // Ignoramos si el almacenamiento local no está disponible
      }

      const nowStr = new Date().toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // 2. Si no hay conexión, encolamos para sincronizar automáticamente al recuperar señal
      if (userProfile?.id_usuario && !navigator.onLine) {
        enqueuePendingRecommendations({
          idUsuario: userProfile.id_usuario,
          activeHazards,
          checkedActions,
          recommendationsMap: RECOMMENDATIONS_MAP,
        });
        onOfflineQueueChange?.();
        setLastSavedTime(nowStr);
        setHasUnsavedChanges(false);
        setSaveStatus("offline-saved");
        return;
      }

      // 3. Guardamos en Supabase si hay usuario autenticado y conexión
      if (userProfile?.id_usuario) {
        await saveUserRecommendationsProgress(
          userProfile.id_usuario,
          activeHazards,
          checkedActions,
          RECOMMENDATIONS_MAP,
        );
      }

      setLastSavedTime(nowStr);
      setHasUnsavedChanges(false);
      setSaveStatus("saved");
    } catch (err) {
      console.error("Error guardando recomendaciones:", err);
      if (userProfile?.id_usuario) {
        enqueuePendingRecommendations({
          idUsuario: userProfile.id_usuario,
          activeHazards,
          checkedActions,
          recommendationsMap: RECOMMENDATIONS_MAP,
        });
        onOfflineQueueChange?.();
      }
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section style={{ maxWidth: "820px", margin: "0 auto" }}>
      {/* TARJETA 1: ESTRELLAS DE SEGURIDAD (Enfoque Positivo TAM) */}
      <div
        style={{
          ...styles.featuredCard,
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: isDesktop ? "24px" : "21px",
            fontWeight: "800",
            color: "#0F172A",
            margin: "0 0 8px 0",
            letterSpacing: "-0.02em",
          }}
        >
          Tu Nivel de Protección en el Hogar
        </h2>

        <SafetyStars stars={risk.stars} label={risk.safetyLabel} />

        <p
          style={{
            fontSize: "17px",
            color: "#334155",
            margin: "14px 0",
            lineHeight: "1.6",
          }}
        >
          {risk.desc}
        </p>

        <div
          style={{
            backgroundColor: "#F0FDFA",
            padding: "14px 18px",
            borderRadius: "10px",
            border: "1px solid #99F6E4",
            marginTop: "14px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "15.5px",
              color: "#115E59",
              fontWeight: "600",
              lineHeight: "1.5",
            }}
          >
            Cada ajuste preventivo que apliques en tu vivienda fortalece tu
            autonomía y te acerca a las 5 estrellas de seguridad.
          </p>
        </div>
      </div>

      {/* TARJETA 2: PLAN DE ACCIÓN EN ACORDEÓN POR HABITACIÓN */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "14px",
          padding: isDesktop ? "24px" : "16px",
          border: "1px solid #CBD5E1",
          marginBottom: "18px",
          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: isDesktop ? "center" : "flex-start",
            flexDirection: isDesktop ? "row" : "column",
            gap: "10px",
            marginBottom: "14px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: isDesktop ? "21px" : "19px",
                fontWeight: "800",
                color: "#0F172A",
                margin: "0 0 4px 0",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span style={styles.statusDot("#0F766E")} />
              Plan de Acción por Habitación
            </h2>
            <p
              style={{
                fontSize: "15.5px",
                color: "#475569",
                margin: 0,
                lineHeight: "1.5",
              }}
            >
              {activeHazards.length > 0
                ? "Toca cada habitación para desplegar sus recomendaciones y marcar las que ya revisaste."
                : "No se registraron peligros ambientales en tu evaluación."}
            </p>
          </div>

          {activeHazards.length > 0 && (
            <span
              style={{
                fontSize: "13.5px",
                fontWeight: "700",
                color:
                  completedCount === activeHazards.length
                    ? "#065F46"
                    : "#0F766E",
                backgroundColor:
                  completedCount === activeHazards.length
                    ? "#ECFDF5"
                    : "#F0FDFA",
                border: "1px solid #99F6E4",
                padding: "6px 12px",
                borderRadius: "999px",
                whiteSpace: "nowrap",
              }}
            >
              {completedCount} de {activeHazards.length} revisados
            </span>
          )}
        </div>

        {/* Estado positivo si NO hay peligros marcados */}
        {activeHazards.length === 0 ? (
          <div
            style={{
              backgroundColor: "#ECFDF5",
              border: "1.5px solid #A7F3D0",
              borderRadius: "12px",
              padding: "22px 18px",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: "20px",
                fontWeight: "800",
                color: "#065F46",
              }}
            >
              ¡Felicidades! Tu hogar es seguro
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: "16px",
                color: "#047857",
                lineHeight: "1.55",
              }}
            >
              No se detectaron peligros ambientales en ninguna habitación.
              Mantén tus espacios iluminados, las rutas despejadas y continúa
              con tus hábitos preventivos diarios.
            </p>
          </div>
        ) : (
          <>
            {/* Barra de avance global */}
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  backgroundColor: "#E2E8F0",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progressPct}%`,
                    height: "100%",
                    backgroundColor:
                      completedCount === activeHazards.length
                        ? "#059669"
                        : "#0F766E",
                    borderRadius: "999px",
                    transition: "width 0.25s ease",
                  }}
                />
              </div>
            </div>

            {/* ACORDEÓN POR HABITACIÓN */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {groupedZones.map((zone) => {
                const isOpen = openZone === zone.name;
                const zoneDone = zone.items.filter(
                  (item) => checkedActions[item.id],
                ).length;
                const allZoneDone = zoneDone === zone.items.length;
                const panelId = `accordion-panel-${zone.prefix}`;

                return (
                  <div
                    key={zone.name}
                    style={{
                      border: isOpen
                        ? "2px solid #0F766E"
                        : "1.5px solid #CBD5E1",
                      borderRadius: "12px",
                      overflow: "hidden",
                      backgroundColor: "#FFFFFF",
                      transition: "border-color 0.15s ease",
                    }}
                  >
                    {/* Botón cabecera de la habitación */}
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => handleToggleZone(zone.name)}
                      style={{
                        width: "100%",
                        minHeight: "60px",
                        padding: isDesktop ? "14px 18px" : "14px 14px",
                        backgroundColor: isOpen ? "#F0FDFA" : "#F8FAFC",
                        border: "none",
                        borderBottom: isOpen ? "1px solid #CCFBF1" : "none",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "10px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "18px",
                            fontWeight: "800",
                            color: isOpen ? "#0F766E" : "#0F172A",
                          }}
                        >
                          {zone.name}
                        </span>
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: "700",
                            backgroundColor: allZoneDone
                              ? "#DCFCE7"
                              : "#FEF3C7",
                            color: allZoneDone ? "#065F46" : "#92400E",
                            padding: "3px 10px",
                            borderRadius: "999px",
                          }}
                        >
                          {zone.items.length}{" "}
                          {zone.items.length === 1
                            ? "recomendación"
                            : "recomendaciones"}
                        </span>
                        {zoneDone > 0 && (
                          <span
                            style={{
                              fontSize: "12.5px",
                              fontWeight: "700",
                              color: "#065F46",
                            }}
                          >
                            ({zoneDone}/{zone.items.length} listas)
                          </span>
                        )}
                      </div>

                      <span
                        aria-hidden="true"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "13.5px",
                          fontWeight: "700",
                          color: isOpen ? "#0F766E" : "#475569",
                          flexShrink: 0,
                        }}
                      >
                        <span>{isOpen ? "Ocultar" : "Ver"}</span>
                        <span style={{ fontSize: "16px" }}>
                          {isOpen ? "▴" : "▾"}
                        </span>
                      </span>
                    </button>

                    {/* Contenido desplegable: SOLO recomendaciones de esta habitación */}
                    {isOpen && (
                      <div
                        id={panelId}
                        role="region"
                        aria-label={`Recomendaciones para ${zone.name}`}
                        style={{
                          padding: isDesktop ? "16px 18px" : "12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          backgroundColor: "#FFFFFF",
                        }}
                      >
                        {zone.items.map((h) => {
                          const rec = RECOMMENDATIONS_MAP[h.id];
                          const isHigh = rec?.priority === "alta";
                          const isDone = Boolean(checkedActions[h.id]);

                          return (
                            <button
                              key={h.id}
                              type="button"
                              role="checkbox"
                              aria-checked={isDone}
                              onClick={() => toggleActionDone(h.id)}
                              style={{
                                width: "100%",
                                textAlign: "left",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "14px",
                                padding: isDesktop ? "14px 16px" : "13px",
                                borderRadius: "10px",
                                border: isDone
                                  ? "1.5px solid #10B981"
                                  : "1.5px solid #E2E8F0",
                                borderLeft: isDone
                                  ? "5px solid #059669"
                                  : isHigh
                                    ? "5px solid #D97706"
                                    : "5px solid #0F766E",
                                backgroundColor: isDone
                                  ? "#F0FDF4"
                                  : "#F8FAFC",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <span
                                aria-hidden="true"
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "8px",
                                  border: isDone
                                    ? "2px solid #059669"
                                    : "2px solid #64748B",
                                  backgroundColor: isDone
                                    ? "#059669"
                                    : "#FFFFFF",
                                  color: "#FFFFFF",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "16px",
                                  fontWeight: "800",
                                  flexShrink: 0,
                                  marginTop: "2px",
                                }}
                              >
                                {isDone ? "✓" : ""}
                              </span>

                              <span style={{ flex: 1, minWidth: 0 }}>
                                <span
                                  style={{
                                    display: "inline-block",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    color: isDone
                                      ? "#065F46"
                                      : isHigh
                                        ? "#92400E"
                                        : "#334155",
                                    backgroundColor: isDone
                                      ? "#DCFCE7"
                                      : isHigh
                                        ? "#FEF3C7"
                                        : "#E2E8F0",
                                    padding: "2px 9px",
                                    borderRadius: "6px",
                                    marginBottom: "6px",
                                  }}
                                >
                                  {isDone
                                    ? "Revisado"
                                    : isHigh
                                      ? "Prioridad sugerida"
                                      : "Ajuste recomendado"}
                                </span>

                                <span
                                  style={{
                                    display: "block",
                                    fontSize: "16px",
                                    fontWeight: "700",
                                    color: "#0F172A",
                                    marginBottom: "4px",
                                    textDecoration: isDone
                                      ? "line-through"
                                      : "none",
                                    opacity: isDone ? 0.78 : 1,
                                  }}
                                >
                                  {h.label}
                                </span>

                                <span
                                  style={{
                                    display: "block",
                                    fontSize: "15.5px",
                                    color: "#334155",
                                    lineHeight: "1.55",
                                  }}
                                >
                                  {rec?.action}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* BLOQUE EXPLÍCITO DE GUARDADO PARA ADULTOS MAYORES */}
            <div
              style={{
                marginTop: "18px",
                padding: isDesktop ? "16px 18px" : "14px",
                borderRadius: "12px",
                backgroundColor:
                  (saveStatus === "saved" || saveStatus === "offline-saved") &&
                  !hasUnsavedChanges
                    ? "#ECFDF5"
                    : hasUnsavedChanges
                      ? "#FFFBEB"
                      : "#F8FAFC",
                border:
                  (saveStatus === "saved" || saveStatus === "offline-saved") &&
                  !hasUnsavedChanges
                    ? "1.5px solid #10B981"
                    : hasUnsavedChanges
                      ? "1.5px solid #F59E0B"
                      : "1px solid #E2E8F0",
              }}
            >
              {saveStatus === "saved" && !hasUnsavedChanges && (
                <div
                  role="status"
                  aria-live="polite"
                  style={{
                    marginBottom: "10px",
                    color: "#065F46",
                    fontSize: "15.5px",
                    fontWeight: "700",
                    lineHeight: "1.45",
                  }}
                >
                  ✓ ¡Tus recomendaciones fueron guardadas correctamente!
                  {lastSavedTime && (
                    <span
                      style={{
                        display: "block",
                        fontSize: "13.5px",
                        fontWeight: "500",
                        color: "#047857",
                        marginTop: "2px",
                      }}
                    >
                      Último guardado a las {lastSavedTime}. Tu progreso queda
                      registrado de forma segura.
                    </span>
                  )}
                </div>
              )}

              {saveStatus === "offline-saved" && !hasUnsavedChanges && (
                <div
                  role="status"
                  aria-live="polite"
                  style={{
                    marginBottom: "10px",
                    color: "#115E59",
                    fontSize: "15px",
                    fontWeight: "700",
                    lineHeight: "1.45",
                  }}
                >
                  ✓ Tu avance quedó guardado en este dispositivo (sin conexión).
                  {lastSavedTime && (
                    <span
                      style={{
                        display: "block",
                        fontSize: "13.5px",
                        fontWeight: "500",
                        color: "#0F766E",
                        marginTop: "2px",
                      }}
                    >
                      Guardado localmente a las {lastSavedTime}. Se sincronizará
                      automáticamente cuando vuelvas a tener internet.
                    </span>
                  )}
                </div>
              )}

              {saveStatus === "error" && (
                <div
                  role="alert"
                  style={{
                    marginBottom: "10px",
                    color: "#991B1B",
                    fontSize: "14.5px",
                    fontWeight: "700",
                    lineHeight: "1.45",
                  }}
                >
                  No se pudo conectar con el servidor, pero tu avance quedó
                  guardado en este dispositivo. Intenta guardar nuevamente en un
                  momento.
                </div>
              )}

              {hasUnsavedChanges && (
                <p
                  style={{
                    margin: "0 0 10px 0",
                    fontSize: "15px",
                    fontWeight: "700",
                    color: "#92400E",
                    lineHeight: "1.45",
                  }}
                >
                  Tienes cambios marcados sin guardar. Presiona el botón para
                  guardar tus recomendaciones.
                </p>
              )}

              {!hasUnsavedChanges &&
                saveStatus !== "saved" &&
                saveStatus !== "offline-saved" && (
                <p
                  style={{
                    margin: "0 0 10px 0",
                    fontSize: "14.5px",
                    color: "#334155",
                    lineHeight: "1.45",
                  }}
                >
                  Cuando termines de revisar o marcar tus mejoras, presiona este
                  botón para guardar tu avance.
                </p>
              )}

              <Button
                variant={
                  (saveStatus === "saved" || saveStatus === "offline-saved") &&
                  !hasUnsavedChanges
                    ? "back"
                    : "primary"
                }
                onClick={handleSaveRecommendations}
                disabled={saving}
                style={{
                  minHeight: "56px",
                  fontSize: "18px",
                  margin: 0,
                }}
              >
                {saving
                  ? "Guardando recomendaciones..."
                  : (saveStatus === "saved" ||
                        saveStatus === "offline-saved") &&
                      !hasUnsavedChanges
                    ? "✓ Recomendaciones Guardadas (Guardar de nuevo)"
                    : "Guardar Mis Recomendaciones"}
              </Button>
            </div>
          </>
        )}

        {/* Sugerencia orientativa adicional si el nivel de riesgo es alto */}
        {risk.label.includes("Alto") && (
          <div
            style={{
              marginTop: "18px",
              padding: "15px 16px",
              backgroundColor: "#FFFBEB",
              borderRadius: "10px",
              border: "1px solid #FDE68A",
              borderLeft: "5px solid #D97706",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#92400E",
                fontSize: "15px",
                fontWeight: "700",
                lineHeight: "1.55",
              }}
            >
              Sugerencia orientativa: Te recomendamos compartir esta ficha con
              tu red de apoyo familiar o en tu próximo control de salud
              preventivo.
            </p>
          </div>
        )}
      </div>

      {/* RESUMEN BREVE RESPONSIVO */}
      <div style={styles.card}>
        <h3
          style={{
            fontSize: "15.5px",
            fontWeight: "700",
            color: "#334155",
            margin: "0 0 14px 0",
            borderBottom: "1px solid #E2E8F0",
            paddingBottom: "8px",
          }}
        >
          Resumen de la Evaluación
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : "1fr",
            gap: "12px",
            fontSize: "15.5px",
            color: "#1E293B",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              padding: "12px 14px",
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#475569",
                fontWeight: "700",
              }}
            >
              PUNTAJE DE EVALUACIÓN
            </div>
            <strong style={{ fontSize: "18px", color: "#0F172A" }}>
              {morseScore} pts
            </strong>
          </div>
          <div
            style={{
              backgroundColor: "#FFFFFF",
              padding: "12px 14px",
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#475569",
                fontWeight: "700",
              }}
            >
              FACTORES DETECTADOS
            </div>
            <strong style={{ fontSize: "18px", color: "#0F172A" }}>
              {selectedHazardsCount} de 15
            </strong>
          </div>
          <div
            style={{
              backgroundColor: "#FFFFFF",
              padding: "12px 14px",
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#475569",
                fontWeight: "700",
              }}
            >
              CONTACTO DE APOYO
            </div>
            <strong style={{ fontSize: "17px", color: "#0F172A" }}>
              {contact.name || "No registrado"}
            </strong>
          </div>
        </div>
      </div>

      {/* ACCIONES PRINCIPALES AL FINAL DE LA PÁGINA */}
      <div
        style={{
          marginTop: "18px",
          display: "grid",
          gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr",
          gap: "12px",
        }}
      >
        <Button variant="primary" onClick={() => setShowPrintModal(true)}>
          Descargar PDF
        </Button>

        <Button
          variant="secondary"
          onClick={() => {
            const msg = `Hola ${contact.name || ""}, te comparto mi ficha preventiva de Hogar Seguro. Nivel de protección: ${risk.stars} de 5 estrellas (${risk.safetyLabel}). Detectamos ${selectedHazardsCount} puntos de mejora en el hogar.`;
            window.open(
              `https://api.whatsapp.com/send?phone=${contact.phone || ""}&text=${encodeURIComponent(msg)}`,
            );
          }}
        >
          Compartir por WhatsApp
        </Button>
      </div>

      <div style={{ marginTop: "8px" }}>
        <Button variant="back" onClick={onReset}>
          Realizar Nueva Evaluación
        </Button>
      </div>

      {/* MODAL DE REPORTE PDF */}
      <PrintModal
        show={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        patient={userProfile}
        risk={risk}
        hazards={hazards}
        contact={contact}
        metrics={null}
      />
    </section>
  );
}
