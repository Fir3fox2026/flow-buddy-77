import { useEffect, useState } from "react";
import { useAuth } from "./use-auth";
import type { Transaction } from "@/lib/finance-data";
import { supabase } from "@/integrations/supabase/client";

const PENDING_KEY = "fluxo:pending-sync:v1";

export type PendingOp =
  | { type: "upsert"; tx: Transaction; queuedAt: string }
  | { type: "update"; id: string; patch: Partial<Transaction>; queuedAt: string }
  | { type: "delete"; id: string; title?: string; queuedAt: string };

function load(): PendingOp[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(ops: PendingOp[]) {
  try {
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(ops));
    window.dispatchEvent(new CustomEvent("fluxo:pending-changed"));
  } catch {
    /* ignore */
  }
}

export function queuePending(op: Omit<PendingOp, "queuedAt"> & { queuedAt?: string }) {
  const ops = load();
  ops.push({ ...op, queuedAt: op.queuedAt ?? new Date().toISOString() } as PendingOp);
  save(ops);
}

export function clearPending() {
  save([]);
}

export function getPending(): PendingOp[] {
  return load();
}

export function useCloudStatus() {
  const { user, hydrated } = useAuth();
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [pending, setPending] = useState<PendingOp[]>([]);
  const [reachable, setReachable] = useState(true);

  useEffect(() => {
    setPending(load());
    const onChange = () => setPending(load());
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("fluxo:pending-changed", onChange);
    window.addEventListener("storage", onChange);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("fluxo:pending-changed", onChange);
      window.removeEventListener("storage", onChange);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Periodic reachability check (cheap HEAD against supabase)
  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      if (!online) {
        setReachable(false);
        return;
      }
      try {
        const { error } = await supabase.from("profiles").select("id").limit(1);
        if (!cancelled) setReachable(!error || error.code !== "PGRST301" ? true : false);
      } catch {
        if (!cancelled) setReachable(false);
      }
    };
    ping();
    const id = setInterval(ping, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [online, user]);

  const connected = !!user && online && reachable;
  const status: "connected" | "offline" | "signed-out" = !user
    ? "signed-out"
    : !online || !reachable
      ? "offline"
      : "connected";

  return {
    status,
    connected,
    online,
    reachable,
    user,
    authHydrated: hydrated,
    pending,
    pendingCount: pending.length,
    clearPending,
  };
}
