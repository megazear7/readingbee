import { AppView } from "./event.view.js";

export const pathForView = (view: AppView): string => {
  return view === "settings" ? "/settings" : "/";
};

export const viewFromPath = (pathname = window.location.pathname): AppView => {
  return pathname.startsWith("/settings") ? "settings" : "reading";
};

export const navigate = (view: AppView): void => {
  const path = pathForView(view);
  if (window.location.pathname !== path) {
    window.history.pushState({ view }, "", path);
  }
  window.dispatchEvent(new PopStateEvent("popstate"));
};
