import { supabase } from "./supabaseClient";

// 1. Iniciar una nueva sesión de prueba
export async function startSession(idUsuario, nombreInvestigador) {
  // Obtenemos el usuario autenticado actualmente (el investigador logueado)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("sesiones_prueba")
    .insert([
      {
        id_usuario: idUsuario,
        // Si el investigador llenó el campo manualmente, usamos ese.
        // Si no, usamos el correo del usuario logueado en Supabase Auth.
        nombre_investigador:
          nombreInvestigador || user?.email || "Investigador Desconocido",
        estado: "activa",
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 2. Finalizar la sesión activa
export async function endSession(idSesion) {
  const { data, error } = await supabase
    .from("sesiones_prueba")
    .update({
      estado: "finalizada",
      fecha_fin: new Date().toISOString(),
    })
    .eq("id_sesion", idSesion)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 3. Traer el historial de sesiones recientes
export async function fetchActiveSessions() {
  const { data, error } = await supabase
    .from("sesiones_prueba")
    .select(
      `
      *,
      usuarios (nombres, apellidos)
    `,
    )
    .order("fecha_inicio", { ascending: false })
    .limit(10);

  if (error) throw error;
  return data;
}

// 4. Traer todos los usuarios/pacientes para el dropdown
export async function fetchAllPatients() {
  const { data, error } = await supabase
    .from("usuarios")
    // Tu tabla usa "rut" en vez de "email"
    .select("id_usuario, nombres, apellidos, rut, nivel_riesgo_actual")
    .order("nombres", { ascending: true });

  if (error) throw error;
  return data;
}

// 5. Crear un nuevo paciente en la tabla usuarios
export async function createPatient(nombres, apellidos, rut, is_admin = false) {
  const { data, error } = await supabase
    .from("usuarios")
    .insert([
      {
        nombres,
        apellidos,
        rut, // <-- Ahora pedimos RUT en vez de Email
        is_admin,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 6. Enviar comando al ESP32
export async function sendCommandToESP32(ipAddress, action, sessionId = null) {
  // action puede ser 'start' o 'stop'
  const url = `http://${ipAddress}/${action}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_sesion: sessionId }),
    });
    if (!response.ok) throw new Error("Error al comunicarse con el ESP32");
    return true;
  } catch (error) {
    console.error("Error conectando al ESP32:", error);
    // Retornamos false pero no bloqueamos la sesión en la BD,
    // por si el sensor está desconectado (para pruebas).
    return false;
  }
}

// 7. Guardar evaluación de riesgo
export async function saveEvaluation(idUsuario, answers, score, riskLevel) {
  const { data, error } = await supabase
    .from("evaluaciones_mfs")
    .insert([
      {
        id_usuario: idUsuario,
        caidas_previas: answers.caidas || false,
        diagnostico_secundario: answers.diagnostico || false,
        // Como en la BD son varchar, asignamos textos fijos:
        ayuda_ambulatoria: answers.ayuda ? "Requiere apoyo" : "Ninguna",
        via_intravenosa: false, // No lo estamos preguntando en la app
        marcha: answers.marcha ? "Anormal" : "Normal",
        estado_mental: answers.mental ? "Desorientado" : "Orientado",
        puntaje_total: score,
        // Nota: En tu BD no hay columna para el nivel de riesgo en esta tabla,
        // pero puedes guardarlo en la tabla usuarios si lo deseas.
      },
    ])
    .select()
    .single();

  if (error) throw error;

  // Opcional: Actualizar el nivel de riesgo actual en la tabla usuarios
  await supabase
    .from("usuarios")
    .update({ nivel_riesgo_actual: riskLevel.replace("Riesgo ", "") }) // 'Alto', 'Medio', 'Bajo'
    .eq("id_usuario", idUsuario);

  return data;
}

// 8. Obtener las últimas evaluaciones
export async function fetchEvaluations() {
  const { data, error } = await supabase
    .from("evaluaciones_mfs")
    .select("*, usuarios(nombres, apellidos)")
    .order("fecha_evaluacion", { ascending: false });

  if (error) throw error;

  // Mapeamos el nivel de riesgo desde la tabla usuarios para mantener la compatibilidad
  return data.map((e) => ({
    ...e,
    nivel_riesgo: e.usuarios?.nivel_riesgo_actual || "Sin evaluar",
  }));
}
