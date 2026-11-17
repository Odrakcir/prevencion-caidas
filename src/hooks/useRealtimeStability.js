import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { HOURLY_DATA } from "../constants/surveyData";

export function useRealtimeStability(sessionId) {
  const [liveData, setLiveData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setLiveData(HOURLY_DATA);
      setIsConnected(false);
      return;
    }

    const loadHistory = async () => {
      const { data, error } = await supabase
        .from("eventos_telemetria")
        .select("*")
        .eq("id_sesion", sessionId)
        .order("fecha_hora", { ascending: true });

      if (!error && data) {
        setLiveData(data.map(formatSingleEvent));
      }
    };

    loadHistory();

    const channel = supabase
      .channel(`sesion-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "eventos_telemetria",
          filter: `id_sesion=eq.${sessionId}`,
        },
        (payload) => {
          const newEvent = formatSingleEvent(payload.new);
          setLiveData((prev) => [...prev, newEvent].slice(-20));
        },
      )
      .subscribe((status) => setIsConnected(status === "SUBSCRIBED"));

    return () => supabase.removeChannel(channel);
  }, [sessionId]);

  return { liveData, isConnected };
}

// TRADUCTOR BIOMECÁNICO
function formatSingleEvent(event) {
  let cinematica = {};
  try {
    cinematica =
      typeof event.datos_cinematicos === "string"
        ? JSON.parse(event.datos_cinematicos)
        : event.datos_cinematicos;
  } catch (e) {
    console.error("Error parseando datos", e);
  }

  // Extraemos datos reales (con valores por defecto si el ESP32 aún no los envía)
  const presion = cinematica.presion_actual || 0;
  const cadencia = cinematica.cadencia || 0;

  // IMPORTANTE: Si tu ESP32 aún no envía inclinación, asumimos un valor normal (5°)
  const inclinacion = cinematica.inclinacion || cinematica.tilt || 5;

  // --- LÓGICA BIOMECÁNICA ---
  let stability = 100;
  let eventLabel = null;

  if (presion > 0) {
    // Fase Stance (Apoyo): El pie está en el suelo. Estabilidad óptima.
    stability = 95 + Math.min((presion / 500) * 5, 5); // 95% a 100% según firmeza
  } else {
    // Fase Swing (Pie en el aire)
    if (inclinacion > 25) {
      // Peligro real: Pie en aire y torso muy inclinado
      stability = 20;
      eventLabel = "Pérdida de Equilibrio (Caída)";
    } else if (inclinacion > 15) {
      // Precaución: Balanceo fuerte
      stability = 60;
      eventLabel = "Balanceo Inestable";
    } else {
      // Normal: Fase de oscilación natural de la marcha
      stability = 90;
    }
  }

  // Ajuste fino: Si la cadencia es muy baja o cero estando de pie, no es "alerta" clínica,
  // solo reposo. (No lo marcamos como error para no llenar de rojos el gráfico).
  if (cadencia === 0 && presion > 0 && inclinacion < 10) {
    stability = 100;
  }

  return {
    time: new Date(event.fecha_hora).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    stability: Math.round(stability),
    label:
      stability > 80
        ? "Estable"
        : stability > 50
          ? "Alerta Leve"
          : "Alerta Crítica",
    statusColor:
      stability > 80 ? "#10B981" : stability > 50 ? "#F59E0B" : "#EF4444",
    event: eventLabel,

    // Separamos las variables correctamente para el Tooltip
    tilt: inclinacion, // Grados reales
    accelG: 0.98, // Placeholder hasta que el ESP32 envíe aceleración
    fsr: presion, // Presión real
    cadencia: cadencia, // Cadencia real

    detail: eventLabel
      ? `¡Atención! ${eventLabel}. Inclinación: ${inclinacion}°.`
      : `Marcha normal. Presión: ${presion}, Cadencia: ${cadencia} pasos/min, Inclinación: ${inclinacion}°.`,
  };
}
