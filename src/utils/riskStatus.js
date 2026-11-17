export function getRiskStatus(score, hazardCount) {
  // Lógica clínica original (Semáforo y texto para el cuidador/admin)
  let clinicalLabel = "Riesgo Bajo";
  let clinicalColor = "#10B981";
  let desc =
    "Entorno y condición física estables. Mantenga hábitos de caminata cotidiana y espacio libre de obstáculos.";

  if (score >= 45 || hazardCount >= 7) {
    clinicalLabel = "Riesgo Alto";
    clinicalColor = "#EF4444";
    desc =
      "Requiere adaptaciones prioritarias en el hogar y coordinación con su red de apoyo para mitigar caídas.";
  } else if (score >= 25 || hazardCount >= 3) {
    clinicalLabel = "Riesgo Medio";
    clinicalColor = "#F59E0B";
    desc =
      "Se sugieren ajustes en zonas de tránsito (luces nocturnas y sujeciones en baño).";
  }

  // --- NUEVA LÓGICA: Estrellas de Seguridad (Enfoque Positivo TAM) ---
  let stars = 5;
  let safetyLabel = "Hogar Altamente Seguro";

  if (score >= 45 || hazardCount >= 7) {
    stars = 1;
    safetyLabel = "Atención Prioritaria Inmediata";
  } else if (score >= 35 || hazardCount >= 5) {
    stars = 2;
    safetyLabel = "Atención Requerida";
  } else if (score >= 25 || hazardCount >= 3) {
    stars = 3;
    safetyLabel = "Seguridad Moderada";
  } else if (score > 0 || hazardCount >= 1) {
    stars = 4;
    safetyLabel = "Hogar Seguro con Ajustes Menores";
  }

  return {
    // Para la vista del adulto mayor
    stars,
    safetyLabel,
    // Para la vista del cuidador y base de datos
    label: clinicalLabel,
    color: clinicalColor,
    desc,
  };
}
