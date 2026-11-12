import { useState } from "react";
import { getStyles } from "../styles/theme";
import { useIsDesktop } from "../hooks/useDesktop";
import Button from "../components/common/Button";
import { supabase } from "../services/supabaseClient";

export default function LoginModule({ onLoginSuccess }) {
  const isDesktop = useIsDesktop();
  const styles = getStyles(isDesktop);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Autenticamos en Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

    if (authError) {
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      setLoading(false);
      return;
    }

    // 2. Verificamos si el usuario es administrador en nuestra tabla
    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .select("is_admin")
      .eq("id_usuario", authData.user.id)
      .single();

    if (userError || !userData) {
      // Si hay error o no existe el usuario en la tabla, lo tratamos como no-admin
      // Pero si el error es porque no existe, tal vez debamos cerrar sesión.
      console.warn(
        "No se encontró perfil en tabla usuarios, asumiendo no-admin.",
      );
    }

    // 3. Enviamos el éxito al App.jsx con la sesión y el rol
    onLoginSuccess(authData.session, userData?.is_admin || false);
    setLoading(false);
  };

  return (
    <div style={styles.wrapper}>
      <main style={styles.container}>
        <div
          style={{
            maxWidth: "400px",
            margin: "auto",
            width: "100%",
            paddingTop: "40px",
          }}
        >
          <div style={styles.featuredCard}>
            <h2
              style={{
                ...styles.cardTitle,
                justifyContent: "center",
                fontSize: "24px",
              }}
            >
              Acceso al Sistema
            </h2>
            <p
              style={{
                ...styles.text,
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              Ingresa tus credenciales para continuar.
            </p>

            {error && (
              <div
                style={{
                  backgroundColor: "#FEF2F2",
                  color: "#B91C1C",
                  padding: "10px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "14px",
                  textAlign: "center",
                }}
              >
                {error}
              </div>
            )}

            <form
              onSubmit={handleLogin}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "15px",
                    fontWeight: "700",
                    marginBottom: "6px",
                    color: "#374151",
                  }}
                >
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  style={styles.input}
                  placeholder="ejemplo@proyecto.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "15px",
                    fontWeight: "700",
                    marginBottom: "6px",
                    color: "#374151",
                  }}
                >
                  Contraseña
                </label>
                <input
                  type="password"
                  style={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? "Verificando..." : "Iniciar Sesión"}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
