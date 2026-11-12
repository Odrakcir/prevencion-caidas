import { useState, useEffect } from "react";
import { getStyles } from "./styles/theme";
import { useIsDesktop } from "./hooks/useDesktop";
import { useMorseSurvey } from "./hooks/useMorseSurvey";
import { getRiskStatus } from "./utils/riskStatus";
import { supabase } from "./services/supabaseClient";

import Header from "./components/common/Header";
import SurveyModule from "./modules/SurveyModule";
import RecommendationsModule from "./modules/RecommendationsModule";
import DashboardModule from "./modules/DashboardModule";
import AdminPanelModule from "./modules/AdminPanelModule";
import LoginModule from "./modules/LoginModule";

export default function App() {
  // --- ESTADOS DE AUTENTICACIÓN ---
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // --- ESTADOS DE LA APP NORMAL ---
  const [roleMode, setRoleMode] = useState("recommendations");
  const [screen, setScreen] = useState("onboarding");
  const [contact, setContact] = useState({ name: "", phone: "" });

  const isDesktop = useIsDesktop();
  const styles = getStyles(isDesktop);
  const survey = useMorseSurvey();
  const risk = getRiskStatus(survey.morseScore, survey.selectedHazardsCount);

  // 1. Verificar si ya hay sesión al cargar la página
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // Si ya hay sesión, verificamos si es admin para setear el estado
        const { data } = await supabase
          .from("usuarios")
          .select("is_admin")
          .eq("id_usuario", session.user.id)
          .single();
        setIsAdmin(data?.is_admin || false);
        setSession(session);
      }
      setCheckingAuth(false);
    });
  }, []);

  const handleLoginSuccess = (newSession, isAdminUser) => {
    setSession(newSession);
    setIsAdmin(isAdminUser);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
    // Si quieres limpiar la URL de admin, puedes hacer:
    window.history.pushState({}, "", "/");
  };

  const resetAll = () => {
    survey.reset();
    setContact({ name: "", phone: "" });
    setScreen("onboarding");
  };

  const getProgress = () => {
    if (screen === "onboarding") return 10;
    if (screen === "support") return 25;
    if (screen === "questionnaire")
      return 30 + ((survey.currentQuestion + 1) / 5) * 40;
    if (screen === "hazards") return 85;
    if (screen === "dashboard") return 100;
    return 0;
  };

  // 2. Lógica de ruteo y pantallas de carga
  if (checkingAuth) {
    return (
      <div style={styles.wrapper}>
        <p
          style={{
            textAlign: "center",
            marginTop: "50px",
            fontSize: "18px",
            color: "#0D9488",
          }}
        >
          Cargando sistema...
        </p>
      </div>
    );
  }

  // Si NO hay sesión, mostramos el Login obligatorio
  if (!session) {
    return <LoginModule onLoginSuccess={handleLoginSuccess} />;
  }

  // Si HAY sesión y es ADMIN, mostramos el panel de control
  if (isAdmin) {
    return <AdminPanelModule onExit={handleLogout} />;
  }

  // Si HAY sesión pero NO es admin, mostramos la app normal (abuelitos)
  return (
    <div style={styles.wrapper}>
      <main style={styles.container}>
        <div>
          <Header
            roleMode={roleMode}
            onChangeRole={(newRole) => {
              setRoleMode(newRole);
              if (screen !== "dashboard") setScreen("dashboard");
            }}
          />

          {screen !== "dashboard" && roleMode === "recommendations" && (
            <div style={styles.progressBarContainer}>
              <div style={styles.progressBar(getProgress())} />
            </div>
          )}

          {roleMode === "recommendations" && screen !== "dashboard" && (
            <SurveyModule
              screen={screen}
              setScreen={setScreen}
              contact={contact}
              setContact={setContact}
              survey={survey}
            />
          )}

          {roleMode === "recommendations" && screen === "dashboard" && (
            <RecommendationsModule
              risk={risk}
              morseScore={survey.morseScore}
              selectedHazardsCount={survey.selectedHazardsCount}
              contact={contact}
              hazards={survey.hazards}
              onReset={resetAll}
            />
          )}

          {roleMode === "caregiver" && (
            <DashboardModule
              risk={risk}
              morseScore={survey.morseScore}
              selectedHazardsCount={survey.selectedHazardsCount}
              contact={contact}
              hazards={survey.hazards}
              onReset={resetAll}
            />
          )}
        </div>

        <footer
          style={{
            marginTop: "28px",
            textAlign: "center",
            fontSize: "14px",
            color: "#6B7280",
          }}
        >
          Diseñado bajo pautas de accesibilidad gerontológica WCAG 2.1 AA y
          Modelo TAM
        </footer>
      </main>
    </div>
  );
}
