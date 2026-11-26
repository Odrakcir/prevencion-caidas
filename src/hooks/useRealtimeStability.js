import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { fetchTelemetryBySessionIds } from "../services/sessionService";

// Recibe sessionIds (string o arreglo) y opcionalmente isHistoryMode
export function useRealtimeStability(sessionIds, isHistoryMode = false) {
  const [liveData, setLiveData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const idsKey = JSON.stringify(sessionIds ?? null);

  useEffect(() => {
    const ids = Array.isArray(sessionIds)
      ? sessionIds.filter(Boolean)
      : sessionIds
        ? [sessionIds]
        : [];

    // Si no existen sesiones registradas, mantenemos el gráfico vacío (sin datos mock)
    if (ids.length === 0) {
      setLiveData([]);
      setIsConnected(false);
      return;
    }

    let isMounted = true;

    const loadHistory = async () => {
      try {
        const data = await fetchTelemetryBySessionIds(ids);
        if (!isMounted) return;

        // En modo histórico cargamos TODOS los registros (incluso si hay 1 sola sesión).
        // En modo en vivo / sesión individual limitamos a los últimos 60 puntos para fluidez.
        const displayData = isHistoryMode ? data : data.slice(-60);
        setLiveData(displayData.map(formatSingleEvent));
      } catch (err) {
        console.error("Error cargando historial:", err);
      }
    };

    loadHistory();

    // Solo nos suscribimos en tiempo real cuando estamos viendo 1 sesión en modo en vivo
    if (!isHistoryMode && ids.length === 1) {
      const channel = supabase
        .channel(`sesion-${ids[0]}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "eventos_telemetria",
            filter: `id_sesion=eq.${ids[0]}`,
          },
          (payload) => {
            const newEvent = formatSingleEvent(payload.new);
            setLiveData((prev) => [...prev, newEvent].slice(-60));
          },
        )
        .subscribe((status) => {
          if (isMounted) setIsConnected(status === "SUBSCRIBED");
        });

      return () => {
        isMounted = false;
        supabase.removeChannel(channel);
      };
    }

    setIsConnected(false);
    return () => {
      isMounted = false;
    };
  }, [idsKey, isHistoryMode]);

  return { liveData, isConnected };
}

// Formatea un registro crudo de eventos_telemetria
function formatSingleEvent(event) {
  let data = {};
  try {
    data =
      typeof event.datos_cinematicos === "string"
        ? JSON.parse(event.datos_cinematicos)
        : event.datos_cinematicos || {};
  } catch {
    data = {};
  }

  const fechaObj = new Date(event.fecha_hora);
  const horaCorta = fechaObj.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const fechaCompleta = fechaObj
    .toLocaleString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(",", " ·");

  const estadoPie = data.estado_pie || "desconocido";
  const cadencia = Number(data.cadencia) || 0;
  const ax = Number(data.ax) || 0;
  const ay = Number(data.ay) || 0;
  const az = data.az !== undefined && data.az !== null ? Number(data.az) : 9.8;

  const gravedadTotal = Math.sqrt(ax * ax + ay * ay + az * az);
  // Clamp entre -1 y 1 para evitar NaN por imprecisión de punto flotante en Math.acos
  const cosAngle =
    gravedadTotal > 0 ? Math.max(-1, Math.min(1, az / gravedadTotal)) : 1;
  const inclinacionReal = Math.round(Math.acos(cosAngle) * (180 / Math.PI));

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

  const roundedStability = Math.round(stability);

  return {
    id: event.id_evento || `${event.id_sesion}-${event.fecha_hora}`,
    sessionId: event.id_sesion || null,
    rawDate: event.fecha_hora,
    time: horaCorta,
    fullTime: fechaCompleta,
    stability: roundedStability,
    label:
      roundedStability >= 80
        ? "Estable"
        : roundedStability >= 50
          ? "Precaución"
          : "Alerta Crítica",
    statusColor:
      roundedStability >= 80
        ? "#059669"
        : roundedStability >= 50
          ? "#D97706"
          : "#DC2626",
    event: eventLabel,
    tilt: inclinacionReal,
    accelG: Number(gravedadTotal.toFixed(2)),
    fsr: Number(data.presion_max_intervalo) || 0,
    cadencia,
    estadoPie,
    detail: eventLabel
      ? `${eventLabel}. Inclinación registrada: ${inclinacionReal}°.`
      : `Marcha normal. Pie: ${estadoPie}. Cadencia: ${cadencia} pasos/min.`,
  };
}

// Obtiene clave local YYYY-MM-DD sin desfase de zona horaria UTC
function getLocalDateKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Agrupa los registros reales por día calendario local con métricas completas
export function processWeeklyData(telemetryData) {
  if (!telemetryData || telemetryData.length === 0) return [];

  const groupedByDay = {};

  telemetryData.forEach((event) => {
    if (!event.rawDate) return;
    const dateObj = new Date(event.rawDate);
    if (Number.isNaN(dateObj.getTime())) return;

    const dateKey = getLocalDateKey(dateObj);

    if (!groupedByDay[dateKey]) {
      const rawDay = dateObj
        .toLocaleDateString("es-CL", { weekday: "short" })
        .replace(".", "");
      const dayName = rawDay.charAt(0).toUpperCase() + rawDay.slice(1);
      const shortDate = `${String(dateObj.getDate()).padStart(2, "0")}/${String(
        dateObj.getMonth() + 1,
      ).padStart(2, "0")}`;
      const longDateRaw = dateObj.toLocaleDateString("es-CL", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      const longDate =
        longDateRaw.charAt(0).toUpperCase() + longDateRaw.slice(1);

      groupedByDay[dateKey] = {
        dateKey,
        dayName,
        shortDate,
        longDate,
        totalStability: 0,
        minStability: 100,
        maxStability: 0,
        totalTilt: 0,
        totalCadencia: 0,
        totalFsr: 0,
        count: 0,
        alertsCount: 0,
        sessions: new Set(),
      };
    }

    const bucket = groupedByDay[dateKey];
    bucket.totalStability += event.stability;
    bucket.minStability = Math.min(bucket.minStability, event.stability);
    bucket.maxStability = Math.max(bucket.maxStability, event.stability);
    bucket.totalTilt += Number(event.tilt) || 0;
    bucket.totalCadencia += Number(event.cadencia) || 0;
    bucket.totalFsr += Number(event.fsr) || 0;
    bucket.count += 1;
    if (event.event) bucket.alertsCount += 1;
    if (event.sessionId) bucket.sessions.add(event.sessionId);
  });

  const weeklyArray = Object.values(groupedByDay)
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
    .map((bucket) => {
      const avg = Math.round(bucket.totalStability / bucket.count);
      const avgTilt = Math.round(bucket.totalTilt / bucket.count);
      const avgCadencia = Math.round(bucket.totalCadencia / bucket.count);
      const avgFsr = Math.round(bucket.totalFsr / bucket.count);

      return {
        dateKey: bucket.dateKey,
        time: bucket.dayName,
        shortDate: bucket.shortDate,
        fullTime: bucket.longDate,
        stability: avg,
        minStability: bucket.minStability,
        maxStability: bucket.maxStability,
        label:
          avg >= 80 ? "Estable" : avg >= 50 ? "Precaución" : "Alerta Crítica",
        statusColor:
          avg >= 80 ? "#059669" : avg >= 50 ? "#D97706" : "#DC2626",
        event:
          bucket.alertsCount > 0
            ? `${bucket.alertsCount} evento${bucket.alertsCount > 1 ? "s" : ""} de inestabilidad`
            : null,
        alertsCount: bucket.alertsCount,
        sessionsCount: bucket.sessions.size || 1,
        sampleCount: bucket.count,
        tilt: avgTilt,
        fsr: avgFsr,
        cadencia: avgCadencia,
        estadoPie: "-",
        detail: `Promedio diario: ${avg}% (${bucket.count} lecturas, ${bucket.alertsCount} alertas).`,
      };
    });

  // Retornar los últimos 7 días con actividad registrada
  return weeklyArray.slice(-7);
}
