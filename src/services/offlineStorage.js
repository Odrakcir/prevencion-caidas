const PROFILE_KEY_PREFIX = "hogar_seguro_profile_";
const CONTEXT_KEY_PREFIX = "hogar_seguro_context_";
const SURVEY_DRAFT_KEY = "hogar_seguro_survey_draft_v1";
const PENDING_EVALUATIONS_KEY = "hogar_seguro_pending_evaluations_v1";
const PENDING_RECS_KEY = "hogar_seguro_pending_recs_v1";

function safeReadJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeWriteJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignorar errores de almacenamiento (modo privado / cuota excedida)
  }
}

export function cacheUserProfile(userId, profile) {
  if (!userId || !profile) return;
  safeWriteJson(`${PROFILE_KEY_PREFIX}${userId}`, profile);
}

export function getCachedUserProfile(userId) {
  if (!userId) return null;
  return safeReadJson(`${PROFILE_KEY_PREFIX}${userId}`, null);
}

export function cacheUserContext(userId, context) {
  if (!userId || !context) return;
  safeWriteJson(`${CONTEXT_KEY_PREFIX}${userId}`, context);
}

export function getCachedUserContext(userId) {
  if (!userId) return null;
  return safeReadJson(`${CONTEXT_KEY_PREFIX}${userId}`, null);
}

export function saveSurveyDraft(draft) {
  safeWriteJson(SURVEY_DRAFT_KEY, {
    ...draft,
    updatedAt: new Date().toISOString(),
  });
}

export function loadSurveyDraft() {
  return safeReadJson(SURVEY_DRAFT_KEY, null);
}

export function clearSurveyDraft() {
  safeRemove(SURVEY_DRAFT_KEY);
}

export function getPendingEvaluations() {
  const list = safeReadJson(PENDING_EVALUATIONS_KEY, []);
  return Array.isArray(list) ? list : [];
}

export function enqueuePendingEvaluation(payload) {
  const current = getPendingEvaluations();
  const next = [
    ...current,
    {
      ...payload,
      queuedAt: new Date().toISOString(),
    },
  ];
  safeWriteJson(PENDING_EVALUATIONS_KEY, next);
  return next.length;
}

export function getPendingRecommendations() {
  const list = safeReadJson(PENDING_RECS_KEY, []);
  return Array.isArray(list) ? list : [];
}

export function enqueuePendingRecommendations(payload) {
  const current = getPendingRecommendations().filter(
    (item) => item.idUsuario !== payload.idUsuario,
  );
  const next = [
    ...current,
    {
      ...payload,
      queuedAt: new Date().toISOString(),
    },
  ];
  safeWriteJson(PENDING_RECS_KEY, next);
  return next.length;
}

export function getPendingSyncCount() {
  return getPendingEvaluations().length + getPendingRecommendations().length;
}

export async function flushOfflineQueues({
  saveEvaluationFn,
  saveRecommendationsFn,
}) {
  let syncedEvaluations = 0;
  let syncedRecommendations = 0;

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return {
      syncedEvaluations,
      syncedRecommendations,
      remaining: getPendingSyncCount(),
    };
  }

  const evalQueue = getPendingEvaluations();
  if (evalQueue.length > 0 && typeof saveEvaluationFn === "function") {
    const remainingEvals = [];
    for (const item of evalQueue) {
      try {
        await saveEvaluationFn(
          item.idUsuario,
          item.answers,
          item.hazards,
          item.score,
          item.riskLevel,
          item.contact,
        );
        syncedEvaluations += 1;
      } catch {
        remainingEvals.push(item);
      }
    }
    if (remainingEvals.length > 0) {
      safeWriteJson(PENDING_EVALUATIONS_KEY, remainingEvals);
    } else {
      safeRemove(PENDING_EVALUATIONS_KEY);
    }
  }

  const recQueue = getPendingRecommendations();
  if (recQueue.length > 0 && typeof saveRecommendationsFn === "function") {
    const remainingRecs = [];
    for (const item of recQueue) {
      try {
        await saveRecommendationsFn(
          item.idUsuario,
          item.activeHazards,
          item.checkedActions,
          item.recommendationsMap,
        );
        syncedRecommendations += 1;
      } catch {
        remainingRecs.push(item);
      }
    }
    if (remainingRecs.length > 0) {
      safeWriteJson(PENDING_RECS_KEY, remainingRecs);
    } else {
      safeRemove(PENDING_RECS_KEY);
    }
  }

  return {
    syncedEvaluations,
    syncedRecommendations,
    remaining: getPendingSyncCount(),
  };
}
