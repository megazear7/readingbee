import { AppView } from "./event.view.js";

export const pathForView = (view: AppView): string => {
  if (view === "add-profile") return "/settings/new";
  if (view === "upload") return "/settings/upload";
  if (view === "instructions") return "/settings/instructions";
  if (view === "shop") return "/shop";
  if (view === "settings") return "/settings";
  return "/";
};

export const viewFromPath = (pathname = window.location.pathname): AppView => {
  if (pathname.startsWith("/settings/upload")) return "upload";
  if (pathname.startsWith("/settings/new")) return "add-profile";
  if (pathname.startsWith("/settings/instructions")) return "instructions";
  if (pathname.startsWith("/shop")) return "shop";
  if (pathname.startsWith("/settings")) return "settings";
  return "reading";
};

export const navigate = (view: AppView): void => {
  const path = pathForView(view);
  if (window.location.pathname !== path) {
    window.history.pushState({ view }, "", path);
  }
  window.dispatchEvent(new PopStateEvent("popstate"));
};
