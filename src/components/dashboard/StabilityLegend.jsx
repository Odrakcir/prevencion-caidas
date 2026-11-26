export default function StabilityLegend() {
  const zones = [
    {
      color: "#059669",
      bg: "#ECFDF5",
      text: "#065F46",
      label: "Estable",
      range: "80–100%",
    },
    {
      color: "#D97706",
      bg: "#FFFBEB",
      text: "#92400E",
      label: "Precaución",
      range: "50–79%",
    },
    {
      color: "#DC2626",
      bg: "#FEF2F2",
      text: "#991B1B",
      label: "Alerta",
      range: "0–49%",
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        marginBottom: "14px",
      }}
    >
      {zones.map((z) => (
        <div
          key={z.label}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            backgroundColor: z.bg,
            border: `1px solid ${z.color}33`,
            padding: "5px 11px",
            borderRadius: "999px",
            fontSize: "12.5px",
            fontWeight: "600",
            color: z.text,
          }}
        >
          <span
            style={{
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              backgroundColor: z.color,
              flexShrink: 0,
            }}
          />
          <span>
            <strong>{z.label}</strong> ({z.range})
          </span>
        </div>
      ))}
    </div>
  );
}
