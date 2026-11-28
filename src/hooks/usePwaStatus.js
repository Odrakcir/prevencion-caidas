import { useState, useEffect, useCallback, useRef } from "react";
import { registerSW } from "virtual:pwa-register";

const DISMISS_INSTALL_KEY = "hogar_seguro_pwa_install_dismissed";

function checkIsStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator?.standalone === true
  );
}

function checkIsIosSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIosDevice =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
  return isIosDevice && isSafari;
}

export function usePwaStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [offlineReady, setOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(checkIsStandalone);
  const [installDismissed, setInstallDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_INSTALL_KEY) === "1";
    } catch {
      return false;
    }
  });

  const updateSwRef = useRef(null);
  const isIosSafari = checkIsIosSafari();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    const displayModeMedia = window.matchMedia?.("(display-mode: standalone)");
    const handleDisplayModeChange = (e) => setIsStandalone(e.matches);
    displayModeMedia?.addEventListener?.("change", handleDisplayModeChange);

    try {
      const updateSW = registerSW({
        immediate: true,
        onOfflineReady() {
          setOfflineReady(true);
        },
        onNeedRefresh() {
          setNeedRefresh(true);
        },
      });
      updateSwRef.current = updateSW;
    } catch (err) {
      console.warn("No se pudo registrar el Service Worker:", err);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      displayModeMedia?.removeEventListener?.(
        "change",
        handleDisplayModeChange,
      );
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [deferredPrompt]);

  const applyUpdate = useCallback(() => {
    if (updateSwRef.current) {
      updateSwRef.current(true);
    } else {
      window.location.reload();
    }
  }, []);

  const dismissInstall = useCallback(() => {
    setInstallDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_INSTALL_KEY, "1");
    } catch {
      // Ignorar si sessionStorage no está disponible
    }
  }, []);

  const dismissOfflineReady = useCallback(() => {
    setOfflineReady(false);
  }, []);

  return {
    isOnline,
    offlineReady,
    needRefresh,
    isStandalone,
    canInstall: Boolean(deferredPrompt) && !isStandalone,
    showIosHint: isIosSafari && !isStandalone && !deferredPrompt,
    installDismissed,
    promptInstall,
    applyUpdate,
    dismissInstall,
    dismissOfflineReady,
  };
}
