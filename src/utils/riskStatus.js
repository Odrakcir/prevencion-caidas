export function getRiskStatus(score, hazardCount) {
  if (score >= 45 || hazardCount >= 3) {
    return {
      label: "Riesgo Alto",
      color: "#EF4444",
      desc: "Requiere adaptaciones prioritarias en el hogar y coordinación con su red de apoyo para mitigar caídas.",
    };
  }
  if (score >= 25 || hazardCount >= 1) {
    return {
      label: "Riesgo Medio",
      color: "#F59E0B",
      desc: "Se sugieren ajustes en zonas de tránsito (luces nocturnas y sujeciones en baño).",
    };
  }
  return {
    label: "Riesgo Bajo",
    color: "#10B981",
    desc: "Entorno y condición física estables. Mantenga hábitos de caminata cotidiana y espacio libre de obstáculos.",
  };
}
