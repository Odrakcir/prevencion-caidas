import Button from "../common/Button";

export default function PrintModal({
  show,
  onClose,
  patient,
  risk,
  hazards,
  contact,
  metrics,
}) {
  if (!show) return null;

  // Diccionario de recomendaciones ergonómicas
  const RECOMMENDATIONS_MAP = {
    A1: "Fijar las alfombras sueltas con cinta antideslizante o retirarlas de las zonas de paso.",
    A2: "Ordenar los cables de lámparas y extensiones, manteniéndolos pegados a la pared.",
    A3: "Evitar sillones demasiado blandos; usar un cojín firme para facilitar el levantamiento.",
    B1: "Limpiar inmediatamente los derrames de agua o grasa y usar calzado antideslizante.",
    B2: "Bajar los utensilios y alimentos de uso diario a estantes a la altura de la cintura.",
    B3: "Retirar los paños o secapiés del suelo que puedan doblarse.",
    C1: "Instalar luces nocturnas automáticas en el trayecto de la cama al baño.",
    C2: "Ajustar la altura de la cama para que ambos pies toquen firmemente el suelo.",
    C3: "Usar pantuflas cerradas con talón o caminar con calcetines antideslizantes.",
    D1: "Instalar barras de sujeción firmes a 80-90 cm del suelo junto al inodoro y en la ducha.",
    D2: "Colocar una goma de succión antideslizante dentro de la ducha.",
    D3: "Si la tina es muy alta, considerar una silla de ducha o un banco de transferencia.",
    E1: "Señalizar los desniveles con cinta reflectante de alto contraste.",
    E2: "Asegurar que las escaleras tengan pasamanos firme a ambos lados.",
    E3: "Mejorar la iluminación de pasillos y colocar interruptores de fácil acceso.",
  };

  const activeHazards = Object.keys(hazards).filter((id) => hazards[id]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: "20px",
      }}
    >
      <div
        id="print-report"
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "40px",
          maxWidth: "800px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          fontFamily: "Segoe UI, sans-serif",
          color: "#111827",
        }}
      >
        {/* 1. ENCABEZADO INSTITUCIONAL Y DESLINDE DE RESPONSABILIDAD */}
        <div
          style={{
            borderBottom: "2px solid #0D9488",
            paddingBottom: "16px",
            marginBottom: "20px",
          }}
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: "#0D9488",
              margin: "0 0 8px 0",
            }}
          >
            Ficha de Orientación Preventiva y Adaptación del Entorno
          </h1>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "14px",
              color: "#4B5563",
            }}
          >
            <span>
              <strong>Participante:</strong> {patient?.nombres}{" "}
              {patient?.apellidos}
            </span>
            <span>
              <strong>Fecha:</strong> {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#F3F4F6",
            padding: "12px",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#4B5563",
            marginBottom: "24px",
            fontStyle: "italic",
          }}
        >
          "Este reporte ha sido generado de manera automática por el Asistente
          'Hogar Seguro' (PWA + IoT) con fines exclusivamente educativos,
          ergonómicos y preventivos. No constituye un diagnóstico médico,
          pronóstico de salud ni indicación farmacológica, y no reemplaza la
          consulta o evaluación de un profesional de la salud."
        </div>

        {/* 2. ÍNDICE DE SEGURIDAD DEL HOGAR */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "700",
              marginBottom: "12px",
            }}
          >
            Nivel de Protección del Hogar
          </h2>
          <div
            style={{
              fontSize: "40px",
              color: "#FBBF24",
              letterSpacing: "8px",
              marginBottom: "8px",
            }}
          >
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                style={{ color: i < risk.stars ? "#FBBF24" : "#E5E7EB" }}
              >
                ★
              </span>
            ))}
          </div>
          <h3
            style={{
              fontSize: "22px",
              fontWeight: "800",
              color:
                risk.stars >= 4
                  ? "#047857"
                  : risk.stars === 3
                    ? "#B45309"
                    : "#B91C1C",
              margin: 0,
            }}
          >
            {risk.safetyLabel} ({risk.stars}/5)
          </h3>
          <p style={{ fontSize: "14px", color: "#4B5563", marginTop: "8px" }}>
            Factores de entorno detectados: {activeHazards.length} de 15.
          </p>
        </div>

        {/* 3. MAPEO DE FACTORES Y RECOMENDACIONES ERGONÓMICAS */}
        <div style={{ marginBottom: "30px" }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "700",
              borderBottom: "1px solid #E5E7EB",
              paddingBottom: "8px",
              marginBottom: "16px",
            }}
          >
            Plan de Adaptación Ergonómica
          </h2>
          {activeHazards.length > 0 ? (
            <ul
              style={{
                paddingLeft: "20px",
                fontSize: "15px",
                lineHeight: "1.6",
              }}
            >
              {activeHazards.map((id) => (
                <li key={id} style={{ marginBottom: "10px" }}>
                  {RECOMMENDATIONS_MAP[id]}
                </li>
              ))}
            </ul>
          ) : (
            <p
              style={{ fontSize: "15px", color: "#047857", fontWeight: "600" }}
            >
              No se detectaron factores de riesgo ambiental en la vivienda.
              ¡Excelente entorno!
            </p>
          )}
        </div>

        {/* 4. TELEMETRÍA DE MARCHA Y ESTABILIDAD (APORTE IOT) */}
        <div style={{ marginBottom: "30px" }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "700",
              borderBottom: "1px solid #E5E7EB",
              paddingBottom: "8px",
              marginBottom: "16px",
            }}
          >
            Resumen de Telemetría de Marcha
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: "16px",
              backgroundColor: "#F8FAFC",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: "13px", color: "#6B7280" }}>
                Estabilidad Promedio
              </p>
              <strong style={{ fontSize: "18px", color: "#0D9488" }}>
                {metrics?.avgStability || 0}%
              </strong>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "13px", color: "#6B7280" }}>
                Inclinación Promedio
              </p>
              <strong style={{ fontSize: "18px", color: "#0D9488" }}>
                {metrics?.avgTilt || 0}°
              </strong>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "13px", color: "#6B7280" }}>
                Aceleración Media
              </p>
              <strong style={{ fontSize: "18px", color: "#0D9488" }}>
                {metrics?.avgAccel || 0} G
              </strong>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "13px", color: "#6B7280" }}>
                Cadencia Promedio
              </p>
              <strong style={{ fontSize: "18px", color: "#0D9488" }}>
                {metrics?.avgCadence || 0} p/min
              </strong>
            </div>
          </div>
          <p style={{ fontSize: "13px", color: "#6B7280", marginTop: "12px" }}>
            * Las magnitudes físicas reportadas no emiten juicio clínico sobre
            patologías, solo describen el desplazamiento registrado durante la
            sesión.
          </p>
        </div>

        {/* 5. PLAN DE ACCIÓN FAMILIAR Y CANAL DE COMPARTICIÓN */}
        <div
          style={{
            backgroundColor: "#F0FDFA",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #0D9488",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#0D9488",
              margin: "0 0 12px 0",
            }}
          >
            Compromisos Familiares Sugeridos
          </h3>
          <p
            style={{ fontSize: "14px", color: "#374151", marginBottom: "12px" }}
          >
            Recomendamos compartir esta ficha con su red de apoyo para realizar
            las siguientes tareas:
          </p>
          <ul
            style={{
              listStyleType: "none",
              padding: 0,
              fontSize: "15px",
              fontWeight: "600",
              color: "#374151",
            }}
          >
            {activeHazards.slice(0, 3).map((id, index) => (
              <li key={id} style={{ marginBottom: "8px" }}>
                ☐ {RECOMMENDATIONS_MAP[id]}
              </li>
            ))}
          </ul>
        </div>

        {/* BOTONES DE EXPORTACIÓN */}
        <div
          style={{
            marginTop: "30px",
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="back"
            onClick={onClose}
            fullWidth={false}
            style={{ width: "auto" }}
          >
            Cerrar
          </Button>
          <Button
            variant="primary"
            onClick={() => window.print()}
            fullWidth={false}
            style={{ width: "auto" }}
          >
            Imprimir / Guardar en PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
