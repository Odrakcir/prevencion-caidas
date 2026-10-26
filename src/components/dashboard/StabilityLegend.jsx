import { getStyles } from "../../styles/theme";
import { useIsDesktop } from "../../hooks/useDesktop";

const ZONES = [
  {
    bg: "#ECFDF5",
    border: "#10B981",
    title: "🟢 Zona Verde (80% - 100%)",
    titleColor: "#047857",
    subtitle: "Estabilidad Segura / Marcha Normal",
    subtitleColor: "#065F46",
  },
  {
    bg: "#FEF3C7",
    border: "#F59E0B",
    title: "🟡 Zona Amarilla (50% - 79%)",
    titleColor: "#B45309",
    subtitle: "Precaución / Desbalance Leve",
    subtitleColor: "#92400E",
  },
  {
    bg: "#FEF2F2",
    border: "#EF4444",
    title: "🔴 Zona Roja (0% - 49%)",
    titleColor: "#B91C1C",
    subtitle: "Alerta / Tropiezo Detectado",
    subtitleColor: "#991B1B",
  },
];

export default function StabilityLegend() {
  const isDesktop = useIsDesktop();

  return (
    <div
      style={{
        flex: isDesktop ? "0 0 260px" : "1 1 100%",
        backgroundColor: "#F8FAFC",
        border: "2px solid #CBD5E1",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-around",
        gap: "12px",
        boxSizing: "border-box",
      }}
    >
      <h4
        style={{
          margin: "0 0 4px 0",
          fontSize: "16px",
          fontWeight: "800",
          color: "#111827",
          borderBottom: "2px solid #E2E8F0",
          paddingBottom: "6px",
        }}
      >
        Leyenda de Niveles
      </h4>

      {ZONES.map((z) => (
        <div
          key={z.title}
          style={{
            backgroundColor: z.bg,
            borderLeft: `5px solid ${z.border}`,
            padding: "10px 12px",
            borderRadius: "8px",
          }}
        >
          <div
            style={{ fontSize: "15px", fontWeight: "800", color: z.titleColor }}
          >
            {z.title}
          </div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: z.subtitleColor,
              marginTop: "2px",
            }}
          >
            {z.subtitle}
          </div>
        </div>
      ))}
    </div>
  );
}
