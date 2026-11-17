import { getStyles } from "../../styles/theme";
import { useIsDesktop } from "../../hooks/useDesktop";

export default function SafetyStars({ stars, label }) {
  const isDesktop = useIsDesktop();
  const styles = getStyles(isDesktop);

  return (
    <div style={{ textAlign: "center", margin: "20px 0" }}>
      <div
        style={{ fontSize: "40px", letterSpacing: "8px", marginBottom: "8px" }}
      >
        {[...Array(5)].map((_, i) => (
          <span key={i} style={{ color: i < stars ? "#FBBF24" : "#E5E7EB" }}>
            ★
          </span>
        ))}
      </div>
      <h3
        style={{
          fontSize: "20px",
          fontWeight: "800",
          color: stars >= 4 ? "#047857" : stars === 3 ? "#B45309" : "#B91C1C",
          margin: 0,
        }}
      >
        {label}
      </h3>
      <p style={{ fontSize: "15px", color: "#4B5563", marginTop: "4px" }}>
        Nivel de Protección: {stars} de 5
      </p>
    </div>
  );
}
