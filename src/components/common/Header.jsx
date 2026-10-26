import { getStyles } from "../../styles/theme";
import { useIsDesktop } from "../../hooks/useDesktop";

export default function Header({ roleMode, onChangeRole }) {
  const isDesktop = useIsDesktop();
  const styles = getStyles(isDesktop);

  return (
    <header style={styles.header}>
      <div style={styles.headerTitleGroup}>
        <h1 style={styles.title}>Asistente Hogar Seguro</h1>
        <p style={styles.subtitle}>
          Identificación Preventiva e Independencia Domiciliaria
        </p>
      </div>

      <div style={styles.roleSwitchContainer}>
        <button
          style={styles.roleBtn(roleMode === "recommendations")}
          onClick={() => onChangeRole("recommendations")}
        >
          Recomendaciones
        </button>
        <button
          style={styles.roleBtn(roleMode === "caregiver")}
          onClick={() => onChangeRole("caregiver")}
        >
          Panel Principal
        </button>
      </div>
    </header>
  );
}
