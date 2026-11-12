import { useState } from "react";
import Button from "../components/common/Button";
import { QUESTIONS } from "../constants/surveyData";
import { getRiskStatus } from "../utils/riskStatus";

export default function RiskModal({ patient, onClose, onSave }) {
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);

  // Calculamos el puntaje en tiempo real
  const calculateScore = () => {
    return Object.keys(answers).reduce((total, key) => {
      return answers[key]
        ? total + (QUESTIONS.find((q) => q.id === key)?.points || 0)
        : total;
    }, 0);
  };

  const score = calculateScore();
  const risk = getRiskStatus(score, 0);

  const handleSave = async () => {
    setSaving(true);
    await onSave(patient.id_usuario, answers, score, risk.label);
    setSaving(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "500px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h2
          style={{ fontSize: "20px", fontWeight: "800", marginBottom: "4px" }}
        >
          Evaluación de Riesgo
        </h2>
        <p style={{ color: "#4B5563", marginBottom: "20px", fontSize: "14px" }}>
          Paciente:{" "}
          <strong>
            {patient.nombres} {patient.apellidos}
          </strong>
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          {QUESTIONS.map((q) => (
            <div
              key={q.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px",
                backgroundColor: "#F9FAFB",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  flex: 1,
                  paddingRight: "10px",
                  fontWeight: "500",
                }}
              >
                {q.text}
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setAnswers({ ...answers, [q.id]: true })}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid",
                    borderColor: answers[q.id] === true ? "#0D9488" : "#D1D5DB",
                    backgroundColor:
                      answers[q.id] === true ? "#0D9488" : "#fff",
                    color: answers[q.id] === true ? "#fff" : "#374151",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Sí
                </button>
                <button
                  onClick={() => setAnswers({ ...answers, [q.id]: false })}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid",
                    borderColor:
                      answers[q.id] === false ? "#374151" : "#D1D5DB",
                    backgroundColor:
                      answers[q.id] === false ? "#374151" : "#fff",
                    color: answers[q.id] === false ? "#fff" : "#374151",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  No
                </button>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            backgroundColor:
              risk.color === "#EF4444"
                ? "#FEF2F2"
                : risk.color === "#F59E0B"
                  ? "#FEF3C7"
                  : "#ECFDF5",
            padding: "16px",
            borderRadius: "8px",
            marginBottom: "20px",
            borderLeft: `4px solid ${risk.color}`,
          }}
        >
          <p style={{ margin: 0, fontWeight: "800", color: risk.color }}>
            Puntaje: {score} pts — {risk.label}
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={saving}
            style={{ flex: 1 }}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving}
            style={{ flex: 1 }}
          >
            {saving ? "Guardando..." : "Guardar y Cerrar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
