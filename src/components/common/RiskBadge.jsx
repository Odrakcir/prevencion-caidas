import { getStyles } from "../../styles/theme";
import { useIsDesktop } from "../../hooks/useDesktop";

export default function RiskBadge({ color, label, style }) {
  const isDesktop = useIsDesktop();
  const styles = getStyles(isDesktop);

  return <div style={{ ...styles.badge(color), ...style }}>{label}</div>;
}
