import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "fluxo:profile:v1";

export interface Profile {
  name: string;
  avatar: string; // emoji
}

const DEFAULT_PROFILE: Profile = { name: "Você", avatar: "🌊" };

function loadProfile(): Profile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<Profile>;
    return {
      name: typeof parsed.name === "string" && parsed.name ? parsed.name : DEFAULT_PROFILE.name,
      avatar:
        typeof parsed.avatar === "string" && parsed.avatar ? parsed.avatar : DEFAULT_PROFILE.avatar,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      /* ignore */
    }
  }, [profile, hydrated]);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  return { profile, updateProfile, hydrated };
}
