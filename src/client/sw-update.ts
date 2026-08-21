const UPDATED_KEY = "reading-bee:app-updated";
const RELOAD_KEY = "reading-bee:sw-reload";

export const consumeAppUpdated = (): boolean => {
  if (sessionStorage.getItem(UPDATED_KEY) !== "1") return false;
  sessionStorage.removeItem(UPDATED_KEY);
  return true;
};

export const registerServiceWorker = (): void => {
  if (!("serviceWorker" in navigator)) return;
  sessionStorage.removeItem(RELOAD_KEY);
  void navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then((registration) => {
    const hadController = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hadController) return;
      if (sessionStorage.getItem(RELOAD_KEY) === "1") return;
      sessionStorage.setItem(RELOAD_KEY, "1");
      sessionStorage.setItem(UPDATED_KEY, "1");
      window.location.reload();
    });
    const check = (): void => {
      void registration.update();
    };
    check();
    window.setInterval(check, 60_000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") check();
    });
  });
};
