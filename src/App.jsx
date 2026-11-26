import { useState, useEffect } from "react";
import { getStyles } from "./styles/theme";
import { useIsDesktop } from "./hooks/useDesktop";
import { useMorseSurvey } from "./hooks/useMorseSurvey";
import { getRiskStatus } from "./utils/riskStatus";
import { supabase } from "./services/supabaseClient";
import {
  saveEvaluation,
  ensureUserProfile,
  fetchUserLatestContext,
} from "./services/sessionService";

import Header from "./components/common/Header";
import SurveyModule from "./modules/SurveyModule";
import RecommendationsModule from "./modules/RecommendationsModule";
import DashboardModule from "./modules/DashboardModule";
import AdminPanelModule from "./modules/AdminPanelModule";
import LoginModule from "./modules/LoginModule";

export default function App() {
  // --- ESTADOS DE AUTENTICACIÓN ---
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // --- CONTEXTO REAL DEL PARTICIPANTE (sesiones, peligros guardados, contacto) ---
  const [userContext, setUserContext] = useState({
    latestSessionId: null,
    allSessionIds: [],
    savedHazards: null,
    savedContact: null,
  });

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

  const hydrateUserSession = async (activeSession, preloadedProfile = null) => {
    setSession(activeSession);
    if (!activeSession?.user) {
      setUserProfile(null);
      setIsAdmin(false);
      setUserContext({
        latestSessionId: null,
        allSessionIds: [],
        savedHazards: null,
        savedContact: null,
      });
      return;
    }

    let profile = preloadedProfile;
    if (!profile) {
      try {
        profile = await ensureUserProfile(activeSession.user);
      } catch (err) {
        console.warn("No se pudo obtener/crear perfil en usuarios:", err);
      }
    }

    setUserProfile(profile);
    const adminFlag = Boolean(profile?.is_admin);
    setIsAdmin(adminFlag);

    if (!adminFlag) {
      const ctx = await fetchUserLatestContext(activeSession.user.id);
      setUserContext(ctx);
      if (ctx.savedContact?.name || ctx.savedContact?.phone) {
        setContact((prev) =>
          prev.name || prev.phone ? prev : ctx.savedContact,
        );
      }
    }
  };

  // 1. Verificar sesión al cargar y escuchar cambios de autenticación
  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(async ({ data: { session: current } }) => {
      if (!isMounted) return;
      if (current) {
        await hydrateUserSession(current);
      }
      if (isMounted) setCheckingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && isMounted) {
        setSession(null);
        setUserProfile(null);
        setIsAdmin(false);
        setIsAdminEvaluating(false);
        setEvaluatingUserId(null);
        setUserContext({
          latestSessionId: null,
          allSessionIds: [],
          savedHazards: null,
          savedContact: null,
        });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLoginSuccess = async (newSession, profile) => {
    await hydrateUserSession(newSession, profile);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
    setIsAdmin(false);
    setIsAdminEvaluating(false);
    setEvaluatingUserId(null);
    setContact({ name: "", phone: "" });
    setScreen("onboarding");
    setRoleMode("recommendations");
    window.history.pushState({}, "", "/");
  };

  const handleCompleteUserEvaluation = async () => {
    if (session?.user?.id && userProfile?.id_usuario) {
      try {
        await saveEvaluation(
          session.user.id,
          survey.answers,
          survey.hazards,
          survey.morseScore,
          risk.label,
          contact,
        );
        const updatedCtx = await fetchUserLatestContext(session.user.id);
        setUserContext(updatedCtx);
      } catch (err) {
        console.warn("No se pudo guardar la evaluación en Supabase:", err);
      }
    }
    setScreen("dashboard");
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
        survey.hazards,
        survey.morseScore,
        risk.label,
        contact,
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
          <Header
            roleMode={roleMode}
            onChangeRole={(newRole) => {
              setRoleMode(newRole);
              if (screen !== "dashboard") setScreen("dashboard");
            }}
            onLogout={handleLogout}
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
              isAdminMode={false}
              onUserComplete={handleCompleteUserEvaluation}
            />
          )}

          {roleMode === "recommendations" && screen === "dashboard" && (
            <RecommendationsModule
              risk={risk}
              morseScore={survey.morseScore}
              selectedHazardsCount={survey.selectedHazardsCount}
              contact={contact}
              hazards={survey.hazards}
              userProfile={userProfile}
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
              userProfile={userProfile}
              userContext={userContext}
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
