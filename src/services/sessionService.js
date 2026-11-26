import { supabase } from "./supabaseClient";

// 1. Iniciar una nueva sesión de prueba
export async function startSession(idUsuario) {
  // 1. Verificar sesión
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.error("Error de sesión:", sessionError);
    throw new Error(
      "No hay sesión activa. Por favor, vuelve a iniciar sesión.",
    );
  }

  console.log("Iniciando sesión con token de:", session.user.email);

  // 2. Intentar insertar
  const { data, error } = await supabase
    .from("sesiones_prueba")
    .insert([
      {
        id_usuario: idUsuario,
        estado: "activa",
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error al insertar en Supabase:", error);
    throw error;
  }

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

// 4. Traer todos los usuarios/participantes para el dropdown
export async function fetchAllPatients() {
  const { data, error } = await supabase
    .from("usuarios")
    // Tu tabla usa "rut" en vez de "email"
    .select("id_usuario, nombres, apellidos, rut, nivel_riesgo_actual")
    .order("nombres", { ascending: true });

  if (error) throw error;
  return data;
}

// 5. Crear un nuevo participante en la tabla usuarios
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

// 7. Guardar evaluación de riesgo (Morse + Peligros)
export async function saveEvaluation(
  idUsuario,
  answers,
  hazards,
  score,
  riskLevel,
  contact,
) {
  //Guardar la evaluación Morse
  const { data: evalData, error: evalError } = await supabase
    .from("evaluaciones_mfs")
    .insert([
      {
        id_usuario: idUsuario,
        caidas_previas: answers.caidas || false,
        diagnostico_secundario: answers.diagnostico || false,
        ayuda_ambulatoria: answers.ayuda ? "Requiere apoyo" : "Ninguna",
        via_intravenosa: answers.medicacion || false,
        marcha: answers.marcha ? "Anormal" : "Normal",
        estado_mental: answers.mental ? "Desorientado" : "Orientado",
        puntaje_total: score,
      },
    ])
    .select()
    .single();

  if (evalError) throw evalError;

  //Mapear los 15 peligros
  const mappedHazards = {
    iluminacion_deficiente: hazards.C1 || hazards.E3 || false,
    alfombras_sueltas: hazards.A1 || hazards.B3 || false,
    ausencia_barras: hazards.D1 || hazards.D2 || false,
    obstaculos_ruta: hazards.A2 || hazards.E1 || hazards.E2 || false,
  };

  //Guardar peligros
  await supabase
    .from("peligros_ambientales")
    .insert([{ id_usuario: idUsuario, ...mappedHazards }]);

  //Guardar contacto de emergencia (solo si escribieron algo)
  if (contact && contact.name && contact.phone) {
    await supabase.from("contactos_emergencia").insert([
      {
        id_usuario: idUsuario,
        nombre: contact.name,
        telefono: contact.phone,
        relacion: "Familiar / Cuidador", // Valor por defecto
      },
    ]);
  }

  // 5. Actualizar el nivel de riesgo en la tabla usuarios
  await supabase
    .from("usuarios")
    .update({ nivel_riesgo_actual: riskLevel.replace("Riesgo ", "") })
    .eq("id_usuario", idUsuario);

  await generateRecommendations(idUsuario, hazards);

  return evalData;
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

// 9. Obtener la última sesión (activa o finalizada) de un participante
export async function fetchLatestSessionByUser(idUsuario) {
  const { data, error } = await supabase
    .from("sesiones_prueba")
    .select("*")
    .eq("id_usuario", idUsuario)
    .order("fecha_inicio", { ascending: false })
    .limit(1)
    .maybeSingle(); // Usamos maybeSingle para que no explote si no hay sesiones

  if (error) throw error;
  return data; // Retorna null si el usuario no tiene sesiones
}

// 10. Obtener TODAS las sesiones de un participante
export async function fetchAllSessionsByUser(idUsuario) {
  const { data, error } = await supabase
    .from("sesiones_prueba")
    .select("*")
    .eq("id_usuario", idUsuario)
    .order("fecha_inicio", { ascending: true }); // Orden cronológico

  if (error) throw error;
  return data;
}

// 11. Obtener la telemetría de un arreglo de IDs de sesiones (CON PAGINACIoN)
export async function fetchTelemetryBySessionIds(sessionIds) {
  if (!sessionIds || sessionIds.length === 0) return [];

  let allData = [];
  let from = 0;
  const limit = 1000; // Supabase devuelve máximo 1000 por defecto
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("eventos_telemetria")
      .select("*")
      .in("id_sesion", sessionIds)
      .order("fecha_hora", { ascending: true })
      .range(from, from + limit - 1); // Paginación

    if (error) throw error;

    if (data.length > 0) {
      allData = [...allData, ...data];
      from += limit;
    }

    // Si devolvió menos de 1000, ya no hay más datos
    if (data.length < limit) {
      hasMore = false;
    }
  }

  return allData;
}

// 12. Generar y guardar recomendaciones en base a los peligros
export async function generateRecommendations(idUsuario, hazards) {
  const recommendationsToInsert = [];

  // Validamos qué peligros marcó para crear las recomendaciones
  if (hazards.A1 || hazards.B3) {
    recommendationsToInsert.push({
      id_usuario: idUsuario,
      tipo_recomendacion: "Entorno",
      descripcion:
        "Fijar alfombras sueltas con cinta antideslizante o retirarlas.",
      estado_aplicada: false,
    });
  }
  if (hazards.C1 || hazards.E3) {
    recommendationsToInsert.push({
      id_usuario: idUsuario,
      tipo_recomendacion: "Iluminación",
      descripcion:
        "Instalar luces nocturnas automáticas en pasillos y dormitorio.",
      estado_aplicada: false,
    });
  }
  if (hazards.D1) {
    recommendationsToInsert.push({
      id_usuario: idUsuario,
      tipo_recomendacion: "Baño",
      descripcion:
        "Instalar barras de sujeción firmes en la ducha y el inodoro.",
      estado_aplicada: false,
    });
  }
  if (hazards.A2 || hazards.E1) {
    recommendationsToInsert.push({
      id_usuario: idUsuario,
      tipo_recomendacion: "Obstáculos",
      descripcion:
        "Despejar cables y señalizar desniveles con cinta reflectante.",
      estado_aplicada: false,
    });
  }

  // Si hay recomendaciones, las insertamos
  if (recommendationsToInsert.length > 0) {
    const { error } = await supabase
      .from("recomendaciones")
      .insert(recommendationsToInsert);

    if (error) console.error("Error guardando recomendaciones:", error);
  }
}

// 13. Obtener perfil del usuario autenticado desde public.usuarios
export async function fetchUserProfile(idUsuario) {
  if (!idUsuario) return null;

  const { data, error } = await supabase
    .from("usuarios")
    .select(
      "id_usuario, rut, nombres, apellidos, fecha_nacimiento, nivel_riesgo_actual, is_admin",
    )
    .eq("id_usuario", idUsuario)
    .maybeSingle();

  if (error) {
    console.error("Error obteniendo perfil de usuario:", error);
    return null;
  }

  return data;
}

// 14. Garantizar que exista el registro en public.usuarios sincronizado con auth.users.id
export async function ensureUserProfile(authUser, extraData = {}) {
  if (!authUser?.id) return null;

  const existing = await fetchUserProfile(authUser.id);
  if (existing) return existing;

  const meta = authUser.user_metadata || {};
  const nombres = (extraData.nombres ?? meta.nombres ?? "").trim();
  const apellidos = (extraData.apellidos ?? meta.apellidos ?? "").trim();
  const rut = (extraData.rut ?? meta.rut ?? "").trim();
  const fechaNacimiento =
    extraData.fecha_nacimiento ?? meta.fecha_nacimiento ?? null;

  // Solo insertamos si contamos con los campos obligatorios NOT NULL de public.usuarios
  if (!nombres || !apellidos || !rut) {
    return null;
  }

  const { data, error } = await supabase
    .from("usuarios")
    .insert([
      {
        id_usuario: authUser.id,
        nombres,
        apellidos,
        rut,
        fecha_nacimiento: fechaNacimiento || null,
        is_admin: false,
      },
    ])
    .select(
      "id_usuario, rut, nombres, apellidos, fecha_nacimiento, nivel_riesgo_actual, is_admin",
    )
    .single();

  if (error) throw error;
  return data;
}

// 15. Cargar sesiones, últimos peligros ambientales y último contacto del usuario autenticado
export async function fetchUserLatestContext(idUsuario) {
  if (!idUsuario) {
    return {
      latestSessionId: null,
      allSessionIds: [],
      savedHazards: null,
      savedContact: null,
    };
  }

  const [sessionsRes, hazardRes, contactRes] = await Promise.all([
    fetchAllSessionsByUser(idUsuario).catch(() => []),
    supabase
      .from("peligros_ambientales")
      .select("*")
      .eq("id_usuario", idUsuario)
      .order("fecha_registro", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("contactos_emergencia")
      .select("*")
      .eq("id_usuario", idUsuario)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const allSessionIds = (sessionsRes || []).map((s) => s.id_sesion);
  const latestSessionId =
    allSessionIds.length > 0 ? allSessionIds[allSessionIds.length - 1] : null;

  return {
    latestSessionId,
    allSessionIds,
    savedHazards: hazardRes?.data || null,
    savedContact: contactRes?.data
      ? {
          name: contactRes.data.nombre || "",
          phone: contactRes.data.telefono || "",
        }
      : null,
  };
}
