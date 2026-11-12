import Button from "../common/Button";

export default function PrintModal({
  show,
  onClose,
  risk,
  morseScore,
  selectedHazardsCount,
  contact,
}) {
  if (!show) return null;

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
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "28px",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h2
          style={{
            color: "#0D9488",
            margin: "0 0 12px 0",
            borderBottom: "2.5px solid #0D9488",
            paddingBottom: "8px",
          }}
        >
          Ficha Preventiva del Adulto Mayor
        </h2>
        <p style={{ fontSize: "15px", color: "#4B5563" }}>
          Documento de orientación gerontológica para el hogar y la consulta
          médica.
        </p>

        <div
          style={{
            marginTop: "16px",
            lineHeight: "1.6",
            fontSize: "16px",
            color: "#111827",
          }}
        >
          <p>
            <strong>Clasificación de Riesgo:</strong> {risk.label}
          </p>
          <p>
            <strong>Puntaje Escala de Morse:</strong> {morseScore} / 125 puntos
          </p>
          <p>
            <strong>Factores Ambientales Identificados:</strong>{" "}
            {selectedHazardsCount} de 4 principales
          </p>
          <p>
            <strong>Red de Apoyo Registrada:</strong>{" "}
            {contact.name || "Sin registrar"} ({contact.phone || "N/A"})
          </p>
          <p>
            <strong>Base de Datos:</strong> Supabase PostgreSQL
          </p>
        </div>

        <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
          <Button
            variant="primary"
            fullWidth={false}
            style={{ flex: 1 }}
            onClick={() => window.print()}
          >
            Imprimir / Guardar PDF
          </Button>
          <Button
            variant="back"
            fullWidth={false}
            style={{ flex: 1 }}
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
