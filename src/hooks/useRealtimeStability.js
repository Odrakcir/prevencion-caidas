import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { HOURLY_DATA } from "../constants/surveyData";
import { fetchTelemetryBySessionIds } from "../services/sessionService";

// Ahora recibe sessionIds (puede ser un solo string o un arreglo)
export function useRealtimeStability(sessionIds) {
  const [liveData, setLiveData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Normalizamos la entrada para que siempre sea un arreglo
    const ids = Array.isArray(sessionIds)
      ? sessionIds
      : sessionIds
        ? [sessionIds]
        : [];

    if (ids.length === 0) {
      setLiveData(HOURLY_DATA);
      setIsConnected(false);
      return;
    }

    const loadHistory = async () => {
      try {
        // Traemos toda la telemetría de todas las sesiones de ese usuario
        const data = await fetchTelemetryBySessionIds(ids);

        // Si hay muchos datos (ej: 1000 puntos), tomamos solo los últimos 50 para que el gráfico no se sature
        const recentData = data.slice(-50);
        setLiveData(recentData.map(formatSingleEvent));
      } catch (err) {
        console.error("Error cargando historial:", err);
      }
    };

    loadHistory();

    // Nos suscribimos en tiempo real SOLO si hay una sesión activa en el arreglo
    // (Para no escuchar cambios en sesiones antiguas que ya no reciben datos)
    const activeChannel = supabase
      .channel(`historico-${ids.join("-")}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "eventos_telemetria",
          // No podemos filtrar por un arreglo en Supabase Realtime fácilmente, así que escuchamos todo
          // y filtramos en el frontend
        },
        (payload) => {
          // Si el dato nuevo pertenece a alguna de las sesiones que estamos viendo
          if (ids.includes(payload.new.id_sesion)) {
            const newEvent = formatSingleEvent(payload.new);
            setLiveData((prev) => [...prev, newEvent].slice(-50));
          }
        },
      )
      .subscribe((status) => setIsConnected(status === "SUBSCRIBED"));

    return () => supabase.removeChannel(activeChannel);
  }, [JSON.stringify(sessionIds)]); // Usamos JSON.stringify para que React detecte cambios en el arreglo

  return { liveData, isConnected };
}

// 🧠 Lógica de formateo (la misma de antes)
function formatSingleEvent(event) {
  let data = {};
  try {
    data =
      typeof event.datos_cinematicos === "string"
        ? JSON.parse(event.datos_cinematicos)
        : event.datos_cinematicos;
  } catch (e) {}

  const estadoPie = data.estado_pie || "desconocido";
  const cadencia = data.cadencia || 0;
  const ax = data.ax || 0;
  const ay = data.ay || 0;
  const az = data.az || 9.8;

  const gravedadTotal = Math.sqrt(ax * ax + ay * ay + az * az);
  const inclinacionReal =
    gravedadTotal > 0
      ? Math.round(Math.acos(az / gravedadTotal) * (180 / Math.PI))
      : 0;

  let stability = 100;
  let eventLabel = null;

  if (estadoPie === "apoyado") {
    stability = 95;
  } else {
    if (inclinacionReal > 25) {
      stability = 20;
      eventLabel = "Riesgo de Caída";
    } else if (inclinacionReal > 15) {
      stability = 60;
      eventLabel = "Balanceo Inestable";
    } else {
      stability = 90;
    }
  }

  if (cadencia === 0 && inclinacionReal < 10) stability = 100;

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
    tilt: inclinacionReal,
    accelG: Number(gravedadTotal.toFixed(2)),
    fsr: data.presion_max_intervalo || 0,
    cadencia: cadencia,
    estadoPie: estadoPie,
    detail: eventLabel
      ? `¡Atención! ${eventLabel}. Inclinación: ${inclinacionReal}°.`
      : `Marcha normal. Pie: ${estadoPie}. Cadencia: ${cadencia} pasos/min.`,
  };
}
