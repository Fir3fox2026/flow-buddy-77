import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

const STORAGE_KEY = "fluxo:profile:v1";

export interface Profile {
  name: string;
  avatar: string;
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
  const { user, hydrated: authHydrated } = useAuth();
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [hydrated, setHydrated] = useState(false);
  const lastSyncedUserId = useRef<string | null>(null);

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

  // Pull from cloud on login
  useEffect(() => {
    if (!authHydrated || !hydrated) return;
    if (!user) {
      lastSyncedUserId.current = null;
      return;
    }
    if (lastSyncedUserId.current === user.id) return;
    lastSyncedUserId.current = user.id;

    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name,avatar")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setProfile({ name: data.name, avatar: data.avatar });
      } else {
        // Push local to cloud
        await supabase.from("profiles").upsert({ id: user.id, ...profile });
      }
    })();
  }, [user, authHydrated, hydrated, profile]);

  const updateProfile = useCallback(
    (patch: Partial<Profile>) => {
      setProfile((prev) => {
        const next = { ...prev, ...patch };
        if (user) {
          supabase
            .from("profiles")
            .upsert({ id: user.id, ...next })
            .then(({ error }) => {
              if (error) console.warn("Cloud profile update failed", error);
            });
        }
        return next;
      });
    },
    [user],
  );

  return { profile, updateProfile, hydrated };
}
