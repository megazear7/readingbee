import { AppView } from "./event.view.js";

export const pathForView = (view: AppView, id?: string): string => {
  if (view === "add-profile") return "/settings/new";
  if (view === "edit-profile") return `/settings/profile/${id ?? ""}`;
  if (view === "upload") return "/settings/upload";
  if (view === "instructions") return "/settings/instructions";
  if (view === "shop") return "/shop";
  if (view === "achievements") return "/achievements";
  if (view === "settings") return "/settings";
  return "/";
};

export const viewFromPath = (pathname = window.location.pathname): AppView => {
  if (pathname.startsWith("/settings/upload")) return "upload";
  if (pathname.startsWith("/settings/new")) return "add-profile";
  if (pathname.startsWith("/settings/instructions")) return "instructions";
  if (pathname.startsWith("/settings/profile/")) return "edit-profile";
  if (pathname.startsWith("/shop")) return "shop";
  if (pathname.startsWith("/achievements")) return "achievements";
  if (pathname.startsWith("/settings")) return "settings";
  return "reading";
};

export const profileIdFromPath = (pathname = window.location.pathname): string | null => {
  const match = pathname.match(/^\/settings\/profile\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

export const navigate = (view: AppView, id?: string): void => {
  const path = pathForView(view, id);
  if (window.location.pathname !== path) {
    window.history.pushState({ view }, "", path);
  }
  window.dispatchEvent(new PopStateEvent("popstate"));
};
