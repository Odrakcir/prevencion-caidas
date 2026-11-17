import { useState, useEffect } from "react";
import { getStyles } from "./styles/theme";
import { useIsDesktop } from "./hooks/useDesktop";
import { useMorseSurvey } from "./hooks/useMorseSurvey";
import { getRiskStatus } from "./utils/riskStatus";
import { supabase } from "./services/supabaseClient";
import { saveEvaluation } from "./services/sessionService";

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

  // --- ESTADOS PARA EVALUACIÓN DEL ADMIN ---
  const [isAdminEvaluating, setIsAdminEvaluating] = useState(false);
  const [evaluatingUserId, setEvaluatingUserId] = useState(null);

  const isDesktop = useIsDesktop();
  const styles = getStyles(isDesktop);
  const survey = useMorseSurvey();
  const risk = getRiskStatus(survey.morseScore, survey.selectedHazardsCount);

  // 1. Verificar sesión al cargar
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
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
    setIsAdminEvaluating(false); // Limpiamos si estaba evaluando
    setEvaluatingUserId(null);
    window.history.pushState({}, "", "/");
  };

  const resetAll = () => {
    survey.reset();
    setContact({ name: "", phone: "" });
    setScreen("onboarding");
    setIsAdminEvaluating(false);
    setEvaluatingUserId(null);
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

  // --- FUNCIONES DEL MODO EVALUADOR (ADMIN) ---
  const handleStartAdminEvaluation = (userId) => {
    setEvaluatingUserId(userId);
    setIsAdminEvaluating(true);
    survey.reset();
    setScreen("questionnaire"); // Saltamos directo al cuestionario
  };

  const handleSaveAdminEvaluation = async () => {
    try {
      await saveEvaluation(
        evaluatingUserId,
        survey.answers,
        survey.morseScore,
        risk.label,
      );
      alert("Evaluación guardada exitosamente.");
      setIsAdminEvaluating(false);
      setEvaluatingUserId(null);
      setScreen("onboarding");
    } catch (error) {
      alert("Error al guardar la evaluación: " + error.message);
    }
  };

  // --- LÓGICA DE RUTEO ---
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

  // Si NO hay sesión, Login
  if (!session) {
    return <LoginModule onLoginSuccess={handleLoginSuccess} />;
  }

  // Si ES ADMIN
  if (isAdmin) {
    // Sub-vista: El admin está realizando una encuesta
    if (isAdminEvaluating) {
      return (
        <div style={styles.wrapper}>
          <main style={styles.container}>
            <div
              style={{
                backgroundColor: "#FEF3C7",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "16px",
                borderLeft: "4px solid #F59E0B",
              }}
            >
              <p style={{ margin: 0, fontWeight: "bold", color: "#B45309" }}>
                Modo Evaluador: Completando encuesta para el participante
              </p>
            </div>

            <SurveyModule
              screen={screen}
              setScreen={setScreen}
              contact={contact}
              setContact={setContact}
              survey={survey}
              isAdminMode={true} // <-- Nueva prop
              onAdminSave={handleSaveAdminEvaluation} // <-- Nueva prop
            />
          </main>
        </div>
      );
    }

    // Sub-vista: El admin está en su panel normal
    return (
      <AdminPanelModule
        onExit={handleLogout}
        onStartEvaluation={handleStartAdminEvaluation}
      />
    );
  }

  // Si NO ES ADMIN (App normal para el adulto mayor)
  return (
    <div style={styles.wrapper}>
      <main style={styles.container}>
        <div>
          {/* CONTENEDOR DEL HEADER Y LOGOUT */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start", // Alinea arriba
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            {/* El Header ocupa el mayor espacio posible */}
            <div style={{ flex: 1 }}>
              <Header
                roleMode={roleMode}
                onChangeRole={(newRole) => {
                  setRoleMode(newRole);
                  if (screen !== "dashboard") setScreen("dashboard");
                }}
              />
            </div>

            {/* El botón de Salir se queda a la derecha */}
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: "#F3F4F6",
                color: "#4B5563",
                border: "1px solid #D1D5DB",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                whiteSpace: "nowrap",
                marginTop: "10px", // Un pequeño margen para que no choque con el borde superior
              }}
            >
              Salir
            </button>
          </div>

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
              isAdminMode={false} // <-- Modo normal
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
