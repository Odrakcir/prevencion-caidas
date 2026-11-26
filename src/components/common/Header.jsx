import { getStyles } from "../../styles/theme";
import { useIsDesktop } from "../../hooks/useDesktop";

export default function Header({
  roleMode,
  onChangeRole,
  hideRoleSwitch = false,
  onLogout,
}) {
  const isDesktop = useIsDesktop();
  const styles = getStyles(isDesktop);

  return (
    <header style={styles.header}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          width: isDesktop ? "auto" : "100%",
        }}
      >
        <div style={styles.headerTitleGroup}>
          <div
            aria-hidden="true"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "#0F766E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 10.5L12 3l9 7.5" />
              <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
              <path d="M9.5 14.5l1.8 1.8 3.7-3.8" />
            </svg>
          </div>
          <div>
            <h1 style={styles.title}>Hogar Seguro</h1>
            <p style={styles.subtitle}>
              Prevención de Caídas e Independencia Domiciliaria
            </p>
          </div>
        </div>

        {/* Botón Salir integrado en móvil */}
        {onLogout && !isDesktop && (
          <button
            type="button"
            onClick={onLogout}
            style={{
              backgroundColor: "#FFFFFF",
              color: "#334155",
              border: "1.5px solid #CBD5E1",
              padding: "8px 14px",
              minHeight: "40px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Salir
          </button>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          width: isDesktop ? "auto" : "100%",
        }}
      >
        {!hideRoleSwitch && (
          <div style={{ ...styles.roleSwitchContainer, flex: isDesktop ? "none" : 1 }}>
            <button
              type="button"
              style={styles.roleBtn(roleMode === "recommendations")}
              onClick={() => onChangeRole("recommendations")}
            >
              Recomendaciones
            </button>
            <button
              type="button"
              style={styles.roleBtn(roleMode === "caregiver")}
              onClick={() => onChangeRole("caregiver")}
            >
              Panel Principal
            </button>
          </div>
        )}

        {onLogout && isDesktop && (
          <button
            type="button"
            onClick={onLogout}
            style={{
              backgroundColor: "#FFFFFF",
              color: "#334155",
              border: "1.5px solid #CBD5E1",
              padding: "9px 16px",
              minHeight: "42px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Cerrar Sesión
          </button>
        )}
      </div>
    </header>
  );
}
