import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { fetchTelemetryBySessionIds } from "../services/sessionService";

// Recibe sessionIds (string o arreglo) y opcionalmente isHistoryMode
export function useRealtimeStability(sessionIds, isHistoryMode = false) {
  const [liveData, setLiveData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setLiveData([]);

    const loadHistory = async () => {
      try {
        const data = await fetchTelemetryBySessionIds(ids);
        if (!isMounted) return;

        // Cargamos todos los registros de la sesión (el gráfico usa scroll horizontal para sesiones largas)
        setLiveData(data.map(formatSingleEvent));
      } catch (err) {
        console.error("Error cargando historial:", err);
      } finally {
        if (isMounted) setIsLoading(false);
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
            setLiveData((prev) => [...prev, newEvent]);
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

  return { liveData, isConnected, isLoading };
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

// Calcula el lunes local de la semana de una fecha dada (para agrupar por semana calendario)
function getWeekBounds(dateObj) {
  const local = new Date(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate(),
  );
  const day = local.getDay(); // 0=Dom, 1=Lun, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(local);
  monday.setDate(local.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmtShort = (d) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;

  return {
    weekKey: getLocalDateKey(monday),
    rangeLabel: `${fmtShort(monday)} – ${fmtShort(sunday)}`,
  };
}

/**
 * Analiza la evolución longitudinal de la marcha por SEMANAS y por DÍAS
 * usando toda la telemetría del participante (sin recorte a 7 días)
 * para identificar posibles deterioros, estabilidad o mejoras.
 */
export function analyzeGaitProgression(telemetryData) {
  if (!telemetryData || telemetryData.length === 0) {
    return {
      daily: [],
      weekly: [],
      globalAvgStability: 0,
      daysWithAlerts: 0,
      totalAlerts: 0,
      dateRangeLabel: "Sin registros",
      dailyTrend: {
        status: "insufficient",
        label: "Sin datos suficientes",
        color: "#475569",
        bg: "#F8FAFC",
        delta: null,
        summary: "No existen registros de telemetría para evaluar evolución.",
      },
      weeklyTrend: {
        status: "insufficient",
        label: "Sin comparación inter-semanal aún",
        color: "#475569",
        bg: "#F8FAFC",
        delta: null,
        summary:
          "Se requieren sesiones en al menos 2 semanas distintas para evaluar cambios entre semanas.",
      },
    };
  }

  const dailyBuckets = {};
  const weeklyBuckets = {};
  let totalStabAll = 0;
  let totalAlertsAll = 0;

  telemetryData.forEach((event) => {
    if (!event?.rawDate) return;
    const dateObj = new Date(event.rawDate);
    if (Number.isNaN(dateObj.getTime())) return;

    const dateKey = getLocalDateKey(dateObj);
    const { weekKey, rangeLabel } = getWeekBounds(dateObj);

    const stability = Number(event.stability) || 0;
    const tilt = Number(event.tilt) || 0;
    const cadencia = Number(event.cadencia) || 0;
    const hasAlert = event.event !== null && event.event !== undefined;

    totalStabAll += stability;
    if (hasAlert) totalAlertsAll += 1;

    if (!dailyBuckets[dateKey]) {
      const longDateRaw = dateObj.toLocaleDateString("es-CL", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const dateLabel =
        longDateRaw.charAt(0).toUpperCase() + longDateRaw.slice(1);

      dailyBuckets[dateKey] = {
        dateKey,
        dateLabel,
        totalStability: 0,
        minStability: 100,
        totalTilt: 0,
        totalCadencia: 0,
        count: 0,
        alertsCount: 0,
      };
    }

    const db = dailyBuckets[dateKey];
    db.totalStability += stability;
    db.minStability = Math.min(db.minStability, stability);
    db.totalTilt += tilt;
    db.totalCadencia += cadencia;
    db.count += 1;
    if (hasAlert) db.alertsCount += 1;

    if (!weeklyBuckets[weekKey]) {
      weeklyBuckets[weekKey] = {
        weekKey,
        rangeLabel,
        daysSet: new Set(),
        totalStability: 0,
        minStability: 100,
        totalTilt: 0,
        totalCadencia: 0,
        count: 0,
        alertsCount: 0,
      };
    }

    const wb = weeklyBuckets[weekKey];
    wb.daysSet.add(dateKey);
    wb.totalStability += stability;
    wb.minStability = Math.min(wb.minStability, stability);
    wb.totalTilt += tilt;
    wb.totalCadencia += cadencia;
    wb.count += 1;
    if (hasAlert) wb.alertsCount += 1;
  });

  // 1. Serie diaria ordenada cronológicamente con variación día vs. día anterior
  const dailySorted = Object.values(dailyBuckets).sort((a, b) =>
    a.dateKey.localeCompare(b.dateKey),
  );

  const daily = dailySorted.map((b, idx) => {
    const avgStability = Math.round(b.totalStability / b.count);
    const avgTilt = Math.round(b.totalTilt / b.count);
    const avgCadencia = Math.round(b.totalCadencia / b.count);
    const prevAvg =
      idx > 0
        ? Math.round(
            dailySorted[idx - 1].totalStability / dailySorted[idx - 1].count,
          )
        : null;
    const delta = prevAvg !== null ? avgStability - prevAvg : null;

    let statusLabel = "Día inicial";
    let statusColor = "#475569";
    if (delta !== null) {
      if (delta <= -5) {
        statusLabel = "Descenso relevante";
        statusColor = "#DC2626";
      } else if (delta >= 5) {
        statusLabel = "Mejora";
        statusColor = "#059669";
      } else {
        statusLabel = "Estable";
        statusColor = "#0F766E";
      }
    }

    return {
      dateKey: b.dateKey,
      dateLabel: b.dateLabel,
      avgStability,
      minStability: b.minStability,
      avgTilt,
      avgCadencia,
      alertsCount: b.alertsCount,
      sampleCount: b.count,
      delta,
      statusLabel,
      statusColor,
    };
  });

  // 2. Serie semanal ordenada cronológicamente con variación semana vs. semana anterior
  const weeklySorted = Object.values(weeklyBuckets).sort((a, b) =>
    a.weekKey.localeCompare(b.weekKey),
  );

  const weekly = weeklySorted.map((b, idx) => {
    const avgStability = Math.round(b.totalStability / b.count);
    const avgTilt = Math.round(b.totalTilt / b.count);
    const avgCadencia = Math.round(b.totalCadencia / b.count);
    const prevAvg =
      idx > 0
        ? Math.round(
            weeklySorted[idx - 1].totalStability / weeklySorted[idx - 1].count,
          )
        : null;
    const delta = prevAvg !== null ? avgStability - prevAvg : null;

    let statusLabel = "Semana base";
    let statusColor = "#475569";
    if (delta !== null) {
      if (delta <= -5) {
        statusLabel = "Posible deterioro";
        statusColor = "#DC2626";
      } else if (delta >= 5) {
        statusLabel = "Mejora semanal";
        statusColor = "#059669";
      } else {
        statusLabel = "Estable";
        statusColor = "#0F766E";
      }
    }

    return {
      weekNumber: idx + 1,
      weekKey: b.weekKey,
      rangeLabel: b.rangeLabel,
      daysCount: b.daysSet.size,
      avgStability,
      minStability: b.minStability,
      avgTilt,
      avgCadencia,
      alertsCount: b.alertsCount,
      sampleCount: b.count,
      delta,
      statusLabel,
      statusColor,
    };
  });

  const globalAvgStability =
    telemetryData.length > 0
      ? Math.round(totalStabAll / telemetryData.length)
      : 0;
  const daysWithAlerts = daily.filter((d) => d.alertsCount > 0).length;

  const dateRangeLabel =
    daily.length > 1
      ? `${daily[0].dateLabel} al ${daily[daily.length - 1].dateLabel}`
      : daily.length === 1
        ? daily[0].dateLabel
        : "Sin registros";

  // 3. Evaluación de tendencia diaria (primer día vs último día + días con descenso)
  let dailyTrend = {
    status: "insufficient",
    label: "Solo 1 día registrado",
    color: "#475569",
    bg: "#F8FAFC",
    delta: null,
    summary:
      "Se cuenta con un solo día de medición. Registra sesiones en días adicionales para detectar variaciones diarias.",
  };

  if (daily.length >= 2) {
    const first = daily[0];
    const last = daily[daily.length - 1];
    const diff = last.avgStability - first.avgStability;
    const dropDays = daily.filter((d) => d.delta !== null && d.delta <= -5).length;

    if (diff <= -5 || (last.alertsCount > first.alertsCount && diff < 0)) {
      dailyTrend = {
        status: "deterioration",
        label: "Indicio de deterioro diario",
        color: "#991B1B",
        bg: "#FEF2F2",
        delta: diff,
        summary: `La estabilidad diaria disminuyó ${Math.abs(diff)} puntos porcentuales desde el primer día (${first.avgStability}%) hasta el más reciente (${last.avgStability}%)${dropDays > 0 ? `, registrando ${dropDays} ${dropDays === 1 ? "jornada" : "jornadas"} con caída ≥ 5%` : ""}.`,
      };
    } else if (diff >= 5) {
      dailyTrend = {
        status: "improvement",
        label: "Tendencia diaria favorable",
        color: "#065F46",
        bg: "#ECFDF5",
        delta: diff,
        summary: `La estabilidad diaria aumentó +${diff} puntos porcentuales desde el primer día (${first.avgStability}%) hasta el último registro (${last.avgStability}%).`,
      };
    } else {
      dailyTrend = {
        status: "stable",
        label: "Comportamiento diario estable",
        color: "#115E59",
        bg: "#F0FDFA",
        delta: diff,
        summary: `La estabilidad se mantuvo dentro de un rango estable (${diff >= 0 ? `+${diff}` : diff} pts entre el primer día con ${first.avgStability}% y el más reciente con ${last.avgStability}%)${dropDays > 0 ? `, aunque se observaron ${dropDays} descensos puntuales que conviene monitorear` : ""}.`,
      };
    }
  }

  // 4. Evaluación de tendencia semanal (primera semana vs última semana)
  let weeklyTrend = {
    status: "insufficient",
    label: "1 semana registrada",
    color: "#475569",
    bg: "#F8FAFC",
    delta: null,
    summary:
      "Todas las sesiones registradas corresponden a una misma semana calendario. Al incorporar pruebas en semanas siguientes se calculará el deterioro o mejora inter-semanal.",
  };

  if (weekly.length >= 2) {
    const firstW = weekly[0];
    const lastW = weekly[weekly.length - 1];
    const wDiff = lastW.avgStability - firstW.avgStability;
    const firstRate = firstW.alertsCount / Math.max(firstW.daysCount, 1);
    const lastRate = lastW.alertsCount / Math.max(lastW.daysCount, 1);
    const alertsIncreased = lastRate > firstRate + 0.5;

    if (wDiff <= -5 || (alertsIncreased && wDiff <= -2)) {
      weeklyTrend = {
        status: "deterioration",
        label: "Posible deterioro entre semanas",
        color: "#991B1B",
        bg: "#FEF2F2",
        delta: wDiff,
        summary: `Al comparar la Semana 1 (${firstW.avgStability}%, ${firstW.alertsCount} alertas) con la Semana ${lastW.weekNumber} (${lastW.avgStability}%, ${lastW.alertsCount} alertas), se observa un descenso de ${Math.abs(wDiff)} puntos en la estabilidad semanal.`,
      };
    } else if (wDiff >= 5) {
      weeklyTrend = {
        status: "improvement",
        label: "Evolución semanal favorable",
        color: "#065F46",
        bg: "#ECFDF5",
        delta: wDiff,
        summary: `Entre la Semana 1 (${firstW.avgStability}%) y la Semana ${lastW.weekNumber} (${lastW.avgStability}%) se observa una mejora de +${wDiff} puntos en la estabilidad promedio semanal.`,
      };
    } else {
      weeklyTrend = {
        status: "stable",
        label: "Estabilidad sostenida entre semanas",
        color: "#115E59",
        bg: "#F0FDFA",
        delta: wDiff,
        summary: `Sin indicios de deterioro significativo entre la Semana 1 (${firstW.avgStability}%) y la Semana ${lastW.weekNumber} (${lastW.avgStability}%, variación de ${wDiff >= 0 ? `+${wDiff}` : wDiff} pts).`,
      };
    }
  }

  return {
    daily,
    weekly,
    globalAvgStability,
    daysWithAlerts,
    totalAlerts: totalAlertsAll,
    dateRangeLabel,
    dailyTrend,
    weeklyTrend,
  };
}
