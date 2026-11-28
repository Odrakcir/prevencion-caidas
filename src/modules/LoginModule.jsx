import { useState } from "react";
import { getStyles } from "../styles/theme";
import { useIsDesktop } from "../hooks/useDesktop";
import Button from "../components/common/Button";
import { supabase } from "../services/supabaseClient";
import { ensureUserProfile } from "../services/sessionService";

// Normaliza RUT chileno a formato sin puntos y con guión (ej: 12345678-9)
function normalizeRut(raw) {
  const clean = raw.replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length <= 1) return clean;
  return `${clean.slice(0, -1)}-${clean.slice(-1)}`;
}

function isValidRutFormat(rut) {
  return /^\d{7,8}-[0-9K]$/.test(rut);
}

export default function LoginModule({ onLoginSuccess, pwaBanner = null }) {
  const isDesktop = useIsDesktop();
  const styles = getStyles(isDesktop);

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Campos exclusivos de registro (coinciden con public.usuarios)
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [rut, setRut] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);

  const switchMode = (newMode) => {
    setMode(newMode);
    setError(null);
    setInfoMessage(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (authError) {
        if (authError.message?.toLowerCase().includes("email not confirmed")) {
          setError(
            "Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.",
          );
        } else {
          setError(
            "Credenciales incorrectas. Verifica tu correo electrónico y contraseña.",
          );
        }
        return;
      }

      // Obtiene o crea automáticamente el perfil en public.usuarios con el mismo UUID
      let profile = null;
      try {
        profile = await ensureUserProfile(authData.user);
      } catch (profileErr) {
        console.warn("No se pudo sincronizar perfil en usuarios:", profileErr);
      }

      onLoginSuccess(authData.session, profile);
    } catch (err) {
      setError("Ocurrió un problema al iniciar sesión: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const cleanNombres = nombres.trim();
    const cleanApellidos = apellidos.trim();
    const formattedRut = normalizeRut(rut);
    const cleanEmail = email.trim();

    if (!cleanNombres || !cleanApellidos) {
      return setError("Por favor ingresa tus nombres y apellidos.");
    }
    if (!isValidRutFormat(formattedRut)) {
      return setError(
        "Ingresa un RUT válido sin puntos y con guión (ejemplo: 12345678-9).",
      );
    }
    if (password.length < 6) {
      return setError("La contraseña debe tener al menos 6 caracteres.");
    }

    setLoading(true);
    try {
      // 1. Creamos la cuenta en Supabase Auth guardando los datos base en metadata
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email: cleanEmail,
          password,
          options: {
            data: {
              nombres: cleanNombres,
              apellidos: cleanApellidos,
              rut: formattedRut,
              fecha_nacimiento: fechaNacimiento || null,
            },
          },
        },
      );

      if (signUpError) {
        const msg = signUpError.message?.toLowerCase() || "";
        if (msg.includes("already registered") || msg.includes("already exists")) {
          setError(
            "Este correo electrónico ya tiene una cuenta registrada. Intenta iniciar sesión.",
          );
        } else {
          setError("No se pudo crear la cuenta: " + signUpError.message);
        }
        return;
      }

      if (!authData?.user) {
        setError("No se recibió respuesta del servidor de autenticación.");
        return;
      }

      // 2. Si Supabase entregó sesión inmediata (confirmación de email desactivada),
      // creamos la fila en public.usuarios con el mismo UUID e ingresamos de inmediato.
      if (authData.session) {
        try {
          const profile = await ensureUserProfile(authData.user, {
            nombres: cleanNombres,
            apellidos: cleanApellidos,
            rut: formattedRut,
            fecha_nacimiento: fechaNacimiento || null,
          });
          onLoginSuccess(authData.session, profile);
          return;
        } catch (profileErr) {
          if (profileErr?.code === "23505") {
            setError(
              "Ese RUT ya está registrado en el sistema. Verifica el número o inicia sesión.",
            );
          } else {
            setError(
              "Tu cuenta de acceso se creó, pero hubo un error al guardar tu perfil: " +
                profileErr.message,
            );
          }
          return;
        }
      }

      // 3. Si Supabase tiene activada la confirmación por correo, intentamos pre-crear el perfil
      // (y si RLS requiere sesión, se creará automáticamente en el primer inicio de sesión).
      try {
        await ensureUserProfile(authData.user, {
          nombres: cleanNombres,
          apellidos: cleanApellidos,
          rut: formattedRut,
          fecha_nacimiento: fechaNacimiento || null,
        });
      } catch {
        // Se sincronizará automáticamente al confirmar correo e iniciar sesión
      }

      setInfoMessage(
        "Cuenta creada correctamente. Revisa tu correo electrónico para confirmarla y luego inicia sesión.",
      );
      setMode("login");
      setPassword("");
    } catch (err) {
      setError("Error inesperado al registrar cuenta: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = {
    display: "block",
    fontSize: "15px",
    fontWeight: "700",
    marginBottom: "6px",
    color: "#1E293B",
  };

  return (
    <div style={styles.wrapper}>
      <main
        style={{
          ...styles.container,
          maxWidth: isDesktop ? "540px" : "100%",
          minHeight: isDesktop ? "auto" : "100vh",
          justifyContent: "center",
          margin: isDesktop ? "auto" : "0",
        }}
      >
        <div style={{ width: "100%" }}>
          {pwaBanner}

          {/* Identidad visual consistente */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              marginBottom: "22px",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                backgroundColor: "#0F766E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "12px",
                boxShadow: "0 4px 12px rgba(15, 118, 110, 0.22)",
              }}
            >
              <svg
                width="28"
                height="28"
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
            <h1
              style={{
                margin: "0 0 4px 0",
                fontSize: "26px",
                fontWeight: "800",
                color: "#0F172A",
                letterSpacing: "-0.025em",
              }}
            >
              Hogar Seguro
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "15px",
                color: "#475569",
                lineHeight: "1.45",
              }}
            >
              Prevención de Caídas e Independencia Domiciliaria
            </p>
          </div>

          {/* Pestañas Ingresar / Crear Cuenta */}
          <div
            role="tablist"
            aria-label="Modo de acceso"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "6px",
              backgroundColor: "#F1F5F9",
              padding: "4px",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              marginBottom: "18px",
            }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              onClick={() => switchMode("login")}
              style={{
                minHeight: "46px",
                border: "none",
                borderRadius: "9px",
                fontSize: "15.5px",
                fontWeight: "700",
                cursor: "pointer",
                backgroundColor: mode === "login" ? "#0F766E" : "transparent",
                color: mode === "login" ? "#FFFFFF" : "#334155",
                transition: "all 0.15s ease",
              }}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "register"}
              onClick={() => switchMode("register")}
              style={{
                minHeight: "46px",
                border: "none",
                borderRadius: "9px",
                fontSize: "15.5px",
                fontWeight: "700",
                cursor: "pointer",
                backgroundColor:
                  mode === "register" ? "#0F766E" : "transparent",
                color: mode === "register" ? "#FFFFFF" : "#334155",
                transition: "all 0.15s ease",
              }}
            >
              Crear Cuenta
            </button>
          </div>

          <div style={{ ...styles.featuredCard, marginBottom: "16px" }}>
            <h2
              style={{
                margin: "0 0 6px 0",
                fontSize: "20px",
                fontWeight: "800",
                color: "#0F172A",
              }}
            >
              {mode === "login"
                ? "Bienvenido nuevamente"
                : "Registro de Participante"}
            </h2>
            <p
              style={{
                margin: "0 0 18px 0",
                fontSize: "15px",
                color: "#475569",
                lineHeight: "1.5",
              }}
            >
              {mode === "login"
                ? "Ingresa tu correo electrónico y contraseña para acceder."
                : "Completa tus datos una sola vez para guardar tus evaluaciones y seguimiento."}
            </p>

            {infoMessage && (
              <div
                role="status"
                style={{
                  backgroundColor: "#ECFDF5",
                  border: "1px solid #A7F3D0",
                  color: "#065F46",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  marginBottom: "16px",
                  fontSize: "14.5px",
                  fontWeight: "600",
                  lineHeight: "1.45",
                }}
              >
                {infoMessage}
              </div>
            )}

            {error && (
              <div
                role="alert"
                style={{
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#991B1B",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  marginBottom: "16px",
                  fontSize: "14.5px",
                  fontWeight: "600",
                  lineHeight: "1.45",
                }}
              >
                {error}
              </div>
            )}

            <form
              onSubmit={mode === "login" ? handleLogin : handleRegister}
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              {mode === "register" && (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <label htmlFor="reg-nombres" style={labelStyle}>
                        Nombres
                      </label>
                      <input
                        id="reg-nombres"
                        type="text"
                        autoComplete="given-name"
                        style={styles.input}
                        placeholder="Ej: María Elena"
                        value={nombres}
                        onChange={(e) => setNombres(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="reg-apellidos" style={labelStyle}>
                        Apellidos
                      </label>
                      <input
                        id="reg-apellidos"
                        type="text"
                        autoComplete="family-name"
                        style={styles.input}
                        placeholder="Ej: González Pérez"
                        value={apellidos}
                        onChange={(e) => setApellidos(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <label htmlFor="reg-rut" style={labelStyle}>
                        RUT
                      </label>
                      <input
                        id="reg-rut"
                        type="text"
                        style={styles.input}
                        placeholder="Ej: 12345678-9"
                        value={rut}
                        onChange={(e) => setRut(e.target.value)}
                        onBlur={() => {
                          if (rut.trim()) setRut(normalizeRut(rut));
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="reg-fecha" style={labelStyle}>
                        Fecha de Nacimiento (opcional)
                      </label>
                      <input
                        id="reg-fecha"
                        type="date"
                        style={styles.input}
                        value={fechaNacimiento}
                        onChange={(e) => setFechaNacimiento(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label htmlFor="auth-email" style={labelStyle}>
                  Correo Electrónico
                </label>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  style={styles.input}
                  placeholder="ejemplo@correo.cl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="auth-password" style={labelStyle}>
                  Contraseña
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "stretch",
                    marginBottom: "18px",
                  }}
                >
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    style={{
                      ...styles.input,
                      marginBottom: 0,
                      flex: 1,
                    }}
                    placeholder={
                      mode === "login"
                        ? "Ingresa tu contraseña"
                        : "Mínimo 6 caracteres"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={mode === "register" ? 6 : undefined}
                  />
                  <button
                    type="button"
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((prev) => !prev)}
                    style={{
                      minHeight: "52px",
                      padding: "0 14px",
                      borderRadius: "10px",
                      border: "1.5px solid #94A3B8",
                      backgroundColor: "#F8FAFC",
                      color: "#1E293B",
                      fontSize: "14px",
                      fontWeight: "700",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <Button variant="primary" type="submit" disabled={loading}>
                {loading
                  ? mode === "login"
                    ? "Verificando acceso..."
                    : "Creando cuenta..."
                  : mode === "login"
                    ? "Iniciar Sesión"
                    : "Registrarme y Entrar"}
              </Button>
            </form>
          </div>

          <p
            style={{
              textAlign: "center",
              fontSize: "13.5px",
              color: "#475569",
              margin: "8px 0 0 0",
              lineHeight: "1.45",
            }}
          >
            Proyecto universitario preventivo y educativo — Accesibilidad WCAG
            2.1 AA
          </p>
        </div>
      </main>
    </div>
  );
}
