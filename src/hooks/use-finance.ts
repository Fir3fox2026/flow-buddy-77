import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  initialTransactions,
  signedAmount,
  isExpense,
  startOfMonth,
  endOfMonth,
  type Transaction,
} from "@/lib/finance-data";
import { useAuth } from "./use-auth";
import { queuePending, getPending, clearPending } from "./use-cloud-status";

const STORAGE_KEY = "fluxo:transactions:v1";
const ONBOARDING_KEY = "fluxo:onboarding:v1";

function loadTransactions(): Transaction[] {
  if (typeof window === "undefined") return initialTransactions;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialTransactions;
    const parsed = JSON.parse(raw) as Transaction[];
    if (!Array.isArray(parsed)) return initialTransactions;
    return parsed;
  } catch {
    return initialTransactions;
  }
}

interface CloudRow {
  client_id: string;
  title: string;
  amount: number;
  kind: Transaction["kind"];
  category: Transaction["category"];
  date: string;
  status: Transaction["status"];
}

function txToRow(t: Transaction, userId: string) {
  return {
    user_id: userId,
    client_id: t.id,
    title: t.title,
    amount: t.amount,
    kind: t.kind,
    category: t.category,
    date: t.date,
    status: t.status,
  };
}

function rowToTx(r: CloudRow): Transaction {
  return {
    id: r.client_id,
    title: r.title,
    amount: Number(r.amount),
    kind: r.kind,
    category: r.category,
    date: r.date,
    status: r.status,
  };
}

export function useFinance() {
  const { user, hydrated: authHydrated } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [hydrated, setHydrated] = useState(false);
  const [onboarded, setOnboarded] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const lastSyncedUserId = useRef<string | null>(null);

  // Hydrate once on the client
  useEffect(() => {
    setTransactions(loadTransactions());
    setOnboarded(window.localStorage.getItem(ONBOARDING_KEY) === "1");
    setHydrated(true);
  }, []);

  // Auto-save to localStorage on every change after hydration
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch {
      /* quota or privacy mode */
    }
  }, [transactions, hydrated]);

  // Sync with Cloud when user logs in (one-time merge)
  useEffect(() => {
    if (!authHydrated || !hydrated) return;
    if (!user) {
      lastSyncedUserId.current = null;
      return;
    }
    if (lastSyncedUserId.current === user.id) return;
    lastSyncedUserId.current = user.id;

    (async () => {
      setSyncing(true);
      try {
        const { data: remote } = await supabase
          .from("transactions")
          .select("client_id,title,amount,kind,category,date,status")
          .eq("user_id", user.id);

        const remoteIds = new Set((remote ?? []).map((r) => r.client_id));
        const localToPush = transactions.filter((t) => !remoteIds.has(t.id));

        if (localToPush.length > 0) {
          await supabase
            .from("transactions")
            .upsert(
              localToPush.map((t) => txToRow(t, user.id)),
              { onConflict: "user_id,client_id" },
            );
        }

        // Merged set: remote + local-only
        const mergedRemote = (remote ?? []) as CloudRow[];
        const merged = [
          ...mergedRemote.map(rowToTx),
          ...localToPush, // already pushed; included for immediate UI consistency
        ];
        // Dedupe by id
        const byId = new Map<string, Transaction>();
        merged.forEach((t) => byId.set(t.id, t));
        setTransactions(Array.from(byId.values()));
      } catch (e) {
        console.warn("Cloud sync failed", e);
      } finally {
        setSyncing(false);
      }
    })();
  }, [user, authHydrated, hydrated, transactions]);

  // Drain pending operations queue when online + signed in
  useEffect(() => {
    if (!user || !authHydrated || !hydrated) return;
    const drain = async () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      const ops = getPending();
      if (ops.length === 0) return;
      const remaining: typeof ops = [];
      for (const op of ops) {
        try {
          if (op.type === "upsert") {
            const { error } = await supabase
              .from("transactions")
              .upsert([txToRow(op.tx, user.id)], { onConflict: "user_id,client_id" });
            if (error) remaining.push(op);
          } else if (op.type === "update") {
            const cloudPatch: Partial<CloudRow> = {};
            const p = op.patch;
            if (p.title !== undefined) cloudPatch.title = p.title;
            if (p.amount !== undefined) cloudPatch.amount = p.amount;
            if (p.kind !== undefined) cloudPatch.kind = p.kind;
            if (p.category !== undefined) cloudPatch.category = p.category;
            if (p.date !== undefined) cloudPatch.date = p.date;
            if (p.status !== undefined) cloudPatch.status = p.status;
            const { error } = await supabase
              .from("transactions")
              .update(cloudPatch)
              .eq("user_id", user.id)
              .eq("client_id", op.id);
            if (error) remaining.push(op);
          } else if (op.type === "delete") {
            const { error } = await supabase
              .from("transactions")
              .delete()
              .eq("user_id", user.id)
              .eq("client_id", op.id);
            if (error) remaining.push(op);
          }
        } catch {
          remaining.push(op);
        }
      }
      if (remaining.length === 0) clearPending();
      else {
        try {
          window.localStorage.setItem("fluxo:pending-sync:v1", JSON.stringify(remaining));
          window.dispatchEvent(new CustomEvent("fluxo:pending-changed"));
        } catch {
          /* ignore */
        }
      }
    };
    drain();
    const onOnline = () => drain();
    window.addEventListener("online", onOnline);
    window.addEventListener("fluxo:pending-changed", drain);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("fluxo:pending-changed", drain);
    };
  }, [user, authHydrated, hydrated]);

  const completeOnboarding = useCallback(() => {
    try {
      window.localStorage.setItem(ONBOARDING_KEY, "1");
    } catch {
      /* ignore */
    }
    setOnboarded(true);
  }, []);

  const addTransaction = useCallback(
    (tx: Omit<Transaction, "id" | "date" | "status">) => {
      const newTx: Transaction = {
        ...tx,
        id: `t${Date.now()}`,
        date: new Date().toISOString(),
        status: "paid",
      };
      setTransactions((prev) => [newTx, ...prev]);
      if (user) {
        supabase
          .from("transactions")
          .upsert([txToRow(newTx, user.id)], { onConflict: "user_id,client_id" })
          .then(({ error }) => {
            if (error) {
              console.warn("Cloud add failed", error);
              queuePending({ type: "upsert", tx: newTx });
            }
          });
      } else {
        queuePending({ type: "upsert", tx: newTx });
      }
    },
    [user],
  );

  const markPaid = useCallback(
    (id: string) => {
      const date = new Date().toISOString();
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "paid", date } : t)),
      );
      const patch: Partial<Transaction> = { status: "paid", date };
      if (user) {
        supabase
          .from("transactions")
          .update({ status: "paid", date })
          .eq("user_id", user.id)
          .eq("client_id", id)
          .then(({ error }) => {
            if (error) {
              console.warn("Cloud markPaid failed", error);
              queuePending({ type: "update", id, patch });
            }
          });
      } else {
        queuePending({ type: "update", id, patch });
      }
    },
    [user],
  );

  const removeTransaction = useCallback(
    (id: string) => {
      const removed = transactions.find((t) => t.id === id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      if (user) {
        supabase
          .from("transactions")
          .delete()
          .eq("user_id", user.id)
          .eq("client_id", id)
          .then(({ error }) => {
            if (error) {
              console.warn("Cloud delete failed", error);
              queuePending({ type: "delete", id, title: removed?.title });
            }
          });
      } else {
        queuePending({ type: "delete", id, title: removed?.title });
      }
    },
    [user, transactions],
  );

  const updateTransaction = useCallback(
    (id: string, patch: Partial<Transaction>) => {
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      );
      if (user) {
        const cloudPatch: Partial<CloudRow> = {};
        if (patch.title !== undefined) cloudPatch.title = patch.title;
        if (patch.amount !== undefined) cloudPatch.amount = patch.amount;
        if (patch.kind !== undefined) cloudPatch.kind = patch.kind;
        if (patch.category !== undefined) cloudPatch.category = patch.category;
        if (patch.date !== undefined) cloudPatch.date = patch.date;
        if (patch.status !== undefined) cloudPatch.status = patch.status;
        supabase
          .from("transactions")
          .update(cloudPatch)
          .eq("user_id", user.id)
          .eq("client_id", id)
          .then(({ error }) => {
            if (error) {
              console.warn("Cloud update failed", error);
              queuePending({ type: "update", id, patch });
            }
          });
      } else {
        queuePending({ type: "update", id, patch });
      }
    },
    [user],
  );

  const replaceAllTransactions = useCallback(
    async (next: Transaction[]) => {
      setTransactions(next);
      if (user) {
        try {
          await supabase.from("transactions").delete().eq("user_id", user.id);
          if (next.length > 0) {
            await supabase
              .from("transactions")
              .insert(next.map((t) => txToRow(t, user.id)));
          }
        } catch (e) {
          console.warn("Cloud replaceAll failed", e);
        }
      }
    },
    [user],
  );

  const addManyTransactions = useCallback(
    async (items: Transaction[]) => {
      if (items.length === 0) return;
      setTransactions((prev) => [...items, ...prev]);
      if (user) {
        const { error } = await supabase
          .from("transactions")
          .upsert(items.map((t) => txToRow(t, user.id)), { onConflict: "user_id,client_id" });
        if (error) {
          console.warn("Cloud addMany failed", error);
          items.forEach((tx) => queuePending({ type: "upsert", tx }));
        }
      } else {
        items.forEach((tx) => queuePending({ type: "upsert", tx }));
      }
    },
    [user],
  );

  const stats = useMemo(() => {
    const now = new Date();
    const som = startOfMonth(now);
    const eom = endOfMonth(now);
    const monthTx = transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= som && d <= eom;
    });

    const incomePaid = monthTx
      .filter((t) => t.kind === "income" && t.status === "paid")
      .reduce((s, t) => s + t.amount, 0);
    const incomePending = monthTx
      .filter((t) => t.kind === "income" && t.status === "pending")
      .reduce((s, t) => s + t.amount, 0);
    const fixedPaid = monthTx
      .filter((t) => t.kind === "fixed" && t.status === "paid")
      .reduce((s, t) => s + t.amount, 0);
    const fixedPending = monthTx
      .filter((t) => t.kind === "fixed" && t.status === "pending")
      .reduce((s, t) => s + t.amount, 0);
    const variablePaid = monthTx
      .filter((t) => t.kind === "variable" && t.status === "paid")
      .reduce((s, t) => s + t.amount, 0);

    const currentBalance = incomePaid - fixedPaid - variablePaid;
    const projectedBalance = incomePaid + incomePending - fixedPaid - fixedPending - variablePaid;

    const daysLeft = Math.max(1, Math.ceil((eom.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const freeMoney = Math.max(0, projectedBalance);
    const dailyFree = freeMoney / daysLeft;

    const dayMs = 24 * 60 * 60 * 1000;
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todaySpend = transactions
      .filter((t) => isExpense(t) && t.kind === "variable" && new Date(t.date).getTime() >= todayStart)
      .reduce((s, t) => s + t.amount, 0);
    const last7 = transactions.filter((t) => {
      if (!isExpense(t) || t.kind !== "variable") return false;
      const ts = new Date(t.date).getTime();
      return ts < todayStart && ts >= todayStart - 7 * dayMs;
    });
    const avgDaily = last7.length > 0 ? last7.reduce((s, t) => s + t.amount, 0) / 7 : 0;
    const atypical = avgDaily > 0 && todaySpend > avgDaily * 1.6;

    return {
      incomePaid,
      incomePending,
      fixedPaid,
      fixedPending,
      variablePaid,
      currentBalance,
      projectedBalance,
      daysLeft,
      dailyFree,
      atypical,
      monthTx,
    };
  }, [transactions]);

  const flowSeries = useMemo(() => {
    const now = new Date();
    const som = startOfMonth(now);
    const eom = endOfMonth(now);
    const totalDays = eom.getDate();
    const todayDay = now.getDate();

    const byDayDelta = new Map<number, { actual: number; projected: number }>();
    for (let i = 1; i <= totalDays; i++) byDayDelta.set(i, { actual: 0, projected: 0 });

    transactions.forEach((t) => {
      const d = new Date(t.date);
      if (d < som || d > eom) return;
      const day = d.getDate();
      const delta = signedAmount(t);
      const bucket = byDayDelta.get(day)!;
      bucket.projected += delta;
      if (t.status === "paid" && day <= todayDay) bucket.actual += delta;
    });

    let actualCum = 0;
    let projectedCum = 0;
    return Array.from({ length: totalDays }, (_, i) => {
      const day = i + 1;
      const b = byDayDelta.get(day)!;
      projectedCum += b.projected;
      if (day <= todayDay) actualCum += b.actual;
      return {
        day,
        actual: day <= todayDay ? actualCum : null,
        projected: projectedCum,
        isToday: day === todayDay,
      };
    });
  }, [transactions]);

  return {
    transactions,
    addTransaction,
    markPaid,
    removeTransaction,
    updateTransaction,
    replaceAllTransactions,
    stats,
    flowSeries,
    hydrated,
    onboarded,
    completeOnboarding,
    syncing,
  };
}
