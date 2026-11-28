import { useState, useEffect, useCallback } from "react";
import { getStyles } from "./styles/theme";
import { useIsDesktop } from "./hooks/useDesktop";
import { useMorseSurvey } from "./hooks/useMorseSurvey";
import { usePwaStatus } from "./hooks/usePwaStatus";
import { getRiskStatus } from "./utils/riskStatus";
import { supabase } from "./services/supabaseClient";
import {
  saveEvaluation,
  ensureUserProfile,
  fetchUserLatestContext,
  saveUserRecommendationsProgress,
} from "./services/sessionService";
import {
  cacheUserProfile,
  getCachedUserProfile,
  cacheUserContext,
  getCachedUserContext,
  saveSurveyDraft,
  loadSurveyDraft,
  clearSurveyDraft,
  enqueuePendingEvaluation,
  getPendingSyncCount,
  flushOfflineQueues,
} from "./services/offlineStorage";

import Header from "./components/common/Header";
import PwaStatusBanner from "./components/common/PwaStatusBanner";
import SurveyModule from "./modules/SurveyModule";
import RecommendationsModule from "./modules/RecommendationsModule";
import DashboardModule from "./modules/DashboardModule";
import AdminPanelModule from "./modules/AdminPanelModule";
import LoginModule from "./modules/LoginModule";

const VALID_SCREENS = new Set([
  "onboarding",
  "support",
  "questionnaire",
  "hazards",
  "dashboard",
]);

export default function App() {
  const [initialDraft] = useState(() => loadSurveyDraft());

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
  const [screen, setScreen] = useState(() =>
    initialDraft?.screen && VALID_SCREENS.has(initialDraft.screen)
      ? initialDraft.screen
      : "onboarding",
  );
  const [contact, setContact] = useState(() =>
    initialDraft?.contact && typeof initialDraft.contact === "object"
      ? {
          name: initialDraft.contact.name || "",
          phone: initialDraft.contact.phone || "",
        }
      : { name: "", phone: "" },
  );

  // --- ESTADOS PARA EVALUACIÓN DEL ADMIN ---
  const [isAdminEvaluating, setIsAdminEvaluating] = useState(false);
  const [evaluatingUserId, setEvaluatingUserId] = useState(null);

  // --- ESTADOS PWA Y SINCRONIZACIÓN OFFLINE ---
  const pwa = usePwaStatus();
  const [pendingSyncCount, setPendingSyncCount] = useState(() =>
    getPendingSyncCount(),
  );
  const [syncingOffline, setSyncingOffline] = useState(false);
  const [syncNotice, setSyncNotice] = useState(null);

  const isDesktop = useIsDesktop();
  const styles = getStyles(isDesktop);
  const survey = useMorseSurvey(initialDraft);
  const risk = getRiskStatus(survey.morseScore, survey.selectedHazardsCount);

  const hydrateUserSession = useCallback(
    async (activeSession, preloadedProfile = null) => {
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

      const userId = activeSession.user.id;
      let profile = preloadedProfile;

      if (!profile) {
        if (navigator.onLine) {
          try {
            profile = await ensureUserProfile(activeSession.user);
          } catch (err) {
            console.warn("No se pudo obtener/crear perfil en usuarios:", err);
          }
        }
        if (!profile) {
          profile = getCachedUserProfile(userId);
        }
      }

      if (profile) {
        cacheUserProfile(userId, profile);
      }

      setUserProfile(profile);
      const adminFlag = Boolean(profile?.is_admin);
      setIsAdmin(adminFlag);

      if (!adminFlag) {
        let ctx = null;
        if (navigator.onLine) {
          try {
            ctx = await fetchUserLatestContext(userId);
            cacheUserContext(userId, ctx);
          } catch (err) {
            console.warn(
              "No se pudo cargar el contexto desde Supabase; usando respaldo local:",
              err,
            );
          }
        }
        if (!ctx) {
          ctx = getCachedUserContext(userId) || {
            latestSessionId: null,
            allSessionIds: [],
            savedHazards: null,
            savedContact: null,
          };
        }

        setUserContext(ctx);
        if (ctx.savedContact?.name || ctx.savedContact?.phone) {
          setContact((prev) =>
            prev.name || prev.phone ? prev : ctx.savedContact,
          );
        }
      }
    },
    [],
  );

  // 1. Verificar sesión al cargar y escuchar cambios de autenticación (tolerante a modo offline)
  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(async ({ data: { session: current } }) => {
        if (!isMounted) return;
        if (current) {
          try {
            await hydrateUserSession(current);
          } catch (err) {
            console.warn("Error hidratando sesión en arranque:", err);
          }
        }
      })
      .catch((err) => {
        console.warn("Error verificando sesión local:", err);
      })
      .finally(() => {
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
  }, [hydrateUserSession]);

  // 2. Persistir borrador de la encuesta, plano y recomendaciones en el dispositivo (Offline-First)
  useEffect(() => {
    if (!session || isAdmin) return;
    saveSurveyDraft({
      answers: survey.answers,
      hazards: survey.hazards,
      currentQuestion: survey.currentQuestion,
      contact,
      screen,
    });
  }, [
    session,
    isAdmin,
    survey.answers,
    survey.hazards,
    survey.currentQuestion,
    contact,
    screen,
  ]);

  // 3. Sincronización automática cuando vuelve la conexión a internet
  const handleSyncOfflineQueues = useCallback(async () => {
    if (!navigator.onLine || getPendingSyncCount() === 0) return;

    setSyncingOffline(true);
    try {
      const result = await flushOfflineQueues({
        saveEvaluationFn: saveEvaluation,
        saveRecommendationsFn: saveUserRecommendationsProgress,
      });
      setPendingSyncCount(result.remaining);

      const totalSynced =
        result.syncedEvaluations + result.syncedRecommendations;
      if (totalSynced > 0) {
        setSyncNotice(
          `Se ${totalSynced === 1 ? "sincronizó 1 registro guardado" : `sincronizaron ${totalSynced} registros guardados`} sin conexión.`,
        );
        if (session?.user?.id && !isAdmin) {
          try {
            const updatedCtx = await fetchUserLatestContext(session.user.id);
            cacheUserContext(session.user.id, updatedCtx);
            setUserContext(updatedCtx);
          } catch {
            // Mantener el contexto en caché si falla la recarga
          }
        }
      }
    } finally {
      setSyncingOffline(false);
    }
  }, [session?.user?.id, isAdmin]);

  useEffect(() => {
    if (!pwa.isOnline || !session) return;
    if (getPendingSyncCount() === 0) return;

    const timer = window.setTimeout(() => {
      handleSyncOfflineQueues();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [pwa.isOnline, session, handleSyncOfflineQueues]);

  useEffect(() => {
    if (!syncNotice) return;
    const timer = window.setTimeout(() => setSyncNotice(null), 7000);
    return () => window.clearTimeout(timer);
  }, [syncNotice]);

  const refreshPendingSyncCount = useCallback(() => {
    setPendingSyncCount(getPendingSyncCount());
  }, []);

  const handleLoginSuccess = async (newSession, profile) => {
    await hydrateUserSession(newSession, profile);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Permitir cierre de sesión local incluso sin conexión
    }
    clearSurveyDraft();
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
    const userId = session?.user?.id;
    if (userId) {
      const evalPayload = {
        idUsuario: userId,
        answers: survey.answers,
        hazards: survey.hazards,
        score: survey.morseScore,
        riskLevel: risk.label,
        contact,
      };

      if (!navigator.onLine) {
        const count = enqueuePendingEvaluation(evalPayload);
        setPendingSyncCount(count);
      } else if (userProfile?.id_usuario) {
        try {
          await saveEvaluation(
            userId,
            survey.answers,
            survey.hazards,
            survey.morseScore,
            risk.label,
            contact,
          );
          const updatedCtx = await fetchUserLatestContext(userId);
          cacheUserContext(userId, updatedCtx);
          setUserContext(updatedCtx);
        } catch (err) {
          console.warn(
            "No se pudo guardar en Supabase; encolando evaluación localmente:",
            err,
          );
          const count = enqueuePendingEvaluation(evalPayload);
          setPendingSyncCount(count);
        }
      }
    }
    setScreen("dashboard");
  };

  const resetAll = () => {
    survey.reset();
    clearSurveyDraft();
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
      if (!navigator.onLine) {
        const count = enqueuePendingEvaluation({
          idUsuario: evaluatingUserId,
          answers: survey.answers,
          hazards: survey.hazards,
          score: survey.morseScore,
          riskLevel: risk.label,
          contact,
        });
        setPendingSyncCount(count);
        alert(
          "Sin conexión a internet: la evaluación quedó guardada en este dispositivo y se enviará automáticamente al recuperar señal.",
        );
        setIsAdminEvaluating(false);
        setEvaluatingUserId(null);
        setScreen("onboarding");
      } else {
        alert("Error al guardar la evaluación: " + error.message);
      }
    }
  };

  const pwaBannerNode = (
    <PwaStatusBanner
      isOnline={pwa.isOnline}
      canInstall={pwa.canInstall}
      showIosHint={pwa.showIosHint}
      installDismissed={pwa.installDismissed}
      needRefresh={pwa.needRefresh}
      offlineReady={pwa.offlineReady}
      pendingSyncCount={pendingSyncCount}
      syncNotice={syncNotice}
      syncing={syncingOffline}
      onInstall={pwa.promptInstall}
      onDismissInstall={pwa.dismissInstall}
      onApplyUpdate={pwa.applyUpdate}
      onDismissOfflineReady={pwa.dismissOfflineReady}
      onManualSync={handleSyncOfflineQueues}
    />
  );

  // --- LÓGICA DE RUTEO ---
  if (checkingAuth) {
    return (
      <div style={styles.wrapper}>
        <p
          style={{
            textAlign: "center",
            marginTop: "50px",
            fontSize: "18px",
            color: "#0F766E",
            fontWeight: "600",
          }}
        >
          Cargando sistema...
        </p>
      </div>
    );
  }

  // Si NO hay sesión, Login
  if (!session) {
    return (
      <LoginModule
        onLoginSuccess={handleLoginSuccess}
        pwaBanner={pwaBannerNode}
      />
    );
  }

  // Si ES ADMIN
  if (isAdmin) {
    // Sub-vista: El admin está realizando una encuesta
    if (isAdminEvaluating) {
      return (
        <div style={styles.wrapper}>
          <main style={styles.container}>
            {pwaBannerNode}
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
              isAdminMode={true}
              onAdminSave={handleSaveAdminEvaluation}
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

          {pwaBannerNode}

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
              onOfflineQueueChange={refreshPendingSyncCount}
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
