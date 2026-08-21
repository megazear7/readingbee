import { Profile } from "./type.app.js";

export const PROFILE_SHARE_ORIGIN = "https://readingbee.alexlockhart.me";
export const PROFILE_SHARE_PARAM = "profile";

export const encodeProfileParam = (profile: Profile): string => encodeURIComponent(JSON.stringify(profile));

export const decodeProfileParam = (value: string): Profile | null => {
  try {
    return Profile.parse(JSON.parse(value));
  } catch {
    try {
      return Profile.parse(JSON.parse(decodeURIComponent(value)));
    } catch {
      return null;
    }
  }
};

export const profileShareUrl = (profile: Profile, origin = PROFILE_SHARE_ORIGIN): string =>
  `${origin}/?${PROFILE_SHARE_PARAM}=${encodeProfileParam(profile)}`;

export const readSharedProfileFromSearch = (search: string): Profile | null => {
  const value = new URLSearchParams(search).get(PROFILE_SHARE_PARAM);
  return value ? decodeProfileParam(value) : null;
};

export const shouldNativeShare = (): boolean => {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return coarse || mobileUa;
};

const isAbort = (error: unknown): boolean =>
  Boolean(error && typeof error === "object" && "name" in error && error.name === "AbortError");

const copyText = async (value: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Fall through to the older copy path.
    }
  }
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.left = "-9999px";
  document.body.append(field);
  field.select();
  const ok = document.execCommand("copy");
  field.remove();
  if (!ok) {
    throw new Error("copy failed");
  }
};

export const shareProfileLink = async (profile: Profile): Promise<"shared" | "copied" | "cancelled"> => {
  const url = profileShareUrl(profile);
  const title = "Reading Bee";
  const text = `Add ${profile.name}'s Reading Bee profile`;
  if (shouldNativeShare()) {
    try {
      const data: ShareData = { title, text, url };
      if (typeof navigator.canShare !== "function" || navigator.canShare(data)) {
        await navigator.share(data);
        return "shared";
      }
    } catch (error) {
      if (isAbort(error)) return "cancelled";
    }
    try {
      await navigator.share({ title, text: `${text}\n${url}` });
      return "shared";
    } catch (error) {
      if (isAbort(error)) return "cancelled";
    }
  }
  await copyText(url);
  return "copied";
};
