const isAppDisplay = (): boolean => {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches
  );
};

const isFullscreen = (): boolean => {
  return Boolean(document.fullscreenElement) || window.matchMedia("(display-mode: fullscreen)").matches;
};

const enterFullscreen = (): void => {
  if (isFullscreen()) return;
  const root = document.documentElement;
  if (typeof root.requestFullscreen !== "function") return;
  void root.requestFullscreen({ navigationUI: "hide" }).catch(() => undefined);
};

export const lockMobileAppDisplay = (): void => {
  if (isAppDisplay()) {
    document.documentElement.classList.add("in-app");
  }
  if (!isAppDisplay()) {
    return;
  }
  if (isFullscreen() || typeof document.documentElement.requestFullscreen !== "function") {
    return;
  }
  const onGesture = (): void => {
    document.removeEventListener("pointerup", onGesture);
    enterFullscreen();
  };
  document.addEventListener("pointerup", onGesture, { passive: true });
};
