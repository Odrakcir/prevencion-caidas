import { useIsDesktop } from "../../hooks/useDesktop";

export default function PwaStatusBanner({
  isOnline,
  canInstall,
  showIosHint,
  installDismissed,
  needRefresh,
  offlineReady,
  pendingSyncCount = 0,
  syncNotice = null,
  syncing = false,
  onInstall,
  onDismissInstall,
  onApplyUpdate,
  onDismissOfflineReady,
  onManualSync,
}) {
  const isDesktop = useIsDesktop();

  const showInstallBanner = !installDismissed && (canInstall || showIosHint);
  const hasAnyBanner =
    !isOnline ||
    showInstallBanner ||
    needRefresh ||
    offlineReady ||
    pendingSyncCount > 0 ||
    Boolean(syncNotice);

  if (!hasAnyBanner) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        marginBottom: "18px",
      }}
    >
      {/* 1. Aviso de modo sin conexión (Offline-First) */}
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: "#FFFBEB",
            border: "1.5px solid #F59E0B",
            borderLeft: "5px solid #D97706",
            borderRadius: "12px",
            padding: isDesktop ? "14px 18px" : "12px 14px",
            color: "#78350F",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "15.5px",
              fontWeight: "800",
              marginBottom: "4px",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "#D97706",
                flexShrink: 0,
              }}
            />
            Modo sin conexión activo
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "14.5px",
              lineHeight: "1.5",
              color: "#92400E",
            }}
          >
            Puedes seguir respondiendo la encuesta, usando el plano interactivo
            y revisando tus recomendaciones. Tus datos se guardarán en este
            dispositivo y se sincronizarán automáticamente al recuperar señal.
          </p>
        </div>
      )}

      {/* 2. Datos pendientes por sincronizar cuando vuelve la señal */}
      {isOnline && pendingSyncCount > 0 && (
        <div
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: "#EFF6FF",
            border: "1.5px solid #93C5FD",
            borderRadius: "12px",
            padding: isDesktop ? "12px 16px" : "12px 14px",
            display: "flex",
            flexDirection: isDesktop ? "row" : "column",
            justifyContent: "space-between",
            alignItems: isDesktop ? "center" : "stretch",
            gap: "10px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "14.5px",
              fontWeight: "600",
              color: "#1E3A8A",
              lineHeight: "1.45",
            }}
          >
            {syncing
              ? "Sincronizando tus registros guardados sin conexión..."
              : `Tienes ${pendingSyncCount} ${pendingSyncCount === 1 ? "registro guardado" : "registros guardados"} sin conexión pendientes de enviar.`}
          </p>
          {onManualSync && !syncing && (
            <button
              type="button"
              onClick={onManualSync}
              style={{
                minHeight: "42px",
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#1D4ED8",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Sincronizar ahora
            </button>
          )}
        </div>
      )}

      {/* 3. Confirmación de sincronización exitosa */}
      {syncNotice && (
        <div
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: "#ECFDF5",
            border: "1.5px solid #6EE7B7",
            borderRadius: "12px",
            padding: "12px 16px",
            color: "#065F46",
            fontSize: "14.5px",
            fontWeight: "700",
            lineHeight: "1.45",
          }}
        >
          ✓ {syncNotice}
        </div>
      )}

      {/* 4. Confirmación de caché Offline-First lista */}
      {offlineReady && isOnline && (
        <div
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: "#F0FDFA",
            border: "1px solid #99F6E4",
            borderRadius: "12px",
            padding: "10px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#115E59",
              lineHeight: "1.4",
            }}
          >
            ✓ Aplicación lista para funcionar sin conexión a internet.
          </span>
          {onDismissOfflineReady && (
            <button
              type="button"
              onClick={onDismissOfflineReady}
              style={{
                minHeight: "36px",
                padding: "4px 12px",
                borderRadius: "8px",
                border: "1px solid #5EEAD4",
                backgroundColor: "#FFFFFF",
                color: "#0F766E",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              Entendido
            </button>
          )}
        </div>
      )}

      {/* 5. Aviso de nueva versión disponible del Service Worker */}
      {needRefresh && (
        <div
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: "#F0FDFA",
            border: "1.5px solid #0F766E",
            borderRadius: "12px",
            padding: "12px 16px",
            display: "flex",
            flexDirection: isDesktop ? "row" : "column",
            justifyContent: "space-between",
            alignItems: isDesktop ? "center" : "stretch",
            gap: "10px",
          }}
        >
          <span
            style={{
              fontSize: "14.5px",
              fontWeight: "700",
              color: "#115E59",
            }}
          >
            Hay una actualización disponible de Hogar Seguro.
          </span>
          <button
            type="button"
            onClick={onApplyUpdate}
            style={{
              minHeight: "42px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#0F766E",
              color: "#FFFFFF",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Actualizar ahora
          </button>
        </div>
      )}

      {/* 6. Invitación accesible para instalar la PWA en pantalla de inicio */}
      {showInstallBanner && (
        <div
          role="region"
          aria-label="Instalar aplicación Hogar Seguro"
          style={{
            backgroundColor: "#F0FDFA",
            border: "1.5px solid #99F6E4",
            borderRadius: "12px",
            padding: isDesktop ? "14px 18px" : "14px",
            display: "flex",
            flexDirection: isDesktop ? "row" : "column",
            justifyContent: "space-between",
            alignItems: isDesktop ? "center" : "stretch",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img
              src="/icons/pwa-192x192.png"
              alt=""
              aria-hidden="true"
              width="42"
              height="42"
              style={{
                borderRadius: "10px",
                flexShrink: 0,
              }}
            />
            <div>
              <p
                style={{
                  margin: "0 0 2px 0",
                  fontSize: "15.5px",
                  fontWeight: "800",
                  color: "#0F172A",
                }}
              >
                Agrega Hogar Seguro a tu pantalla de inicio
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "#115E59",
                  lineHeight: "1.45",
                }}
              >
                {canInstall
                  ? "Úsala en pantalla completa sin barra de navegación y accede a la encuesta, plano y recomendaciones sin internet."
                  : "En Safari, toca el botón Compartir y elige «Agregar a inicio» para abrirla como aplicación y usarla sin conexión."}
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexShrink: 0,
              flexWrap: "wrap",
            }}
          >
            {canInstall && (
              <button
                type="button"
                onClick={onInstall}
                style={{
                  flex: isDesktop ? "none" : 1,
                  minHeight: "44px",
                  padding: "9px 16px",
                  borderRadius: "9px",
                  border: "none",
                  backgroundColor: "#0F766E",
                  color: "#FFFFFF",
                  fontSize: "14.5px",
                  fontWeight: "700",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Instalar App
              </button>
            )}
            <button
              type="button"
              onClick={onDismissInstall}
              style={{
                minHeight: "44px",
                padding: "9px 14px",
                borderRadius: "9px",
                border: "1.5px solid #99F6E4",
                backgroundColor: "#FFFFFF",
                color: "#115E59",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {canInstall ? "Ahora no" : "Entendido"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
