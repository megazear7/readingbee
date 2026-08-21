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
