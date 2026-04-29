import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import type { Transaction } from "@/lib/finance-data";

const LAST_CLOSED_KEY = "fluxo:last-closed-month:v1";
const SNOOZED_KEY = "fluxo:close-snoozed:v1"; // ISO date string of "until"

/** YYYY-MM */
export function monthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Returns the previous month key relative to "now". */
export function previousMonthKey(d: Date = new Date()): string {
  const x = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return monthKey(x);
}

export interface MonthlyReport {
  id: string;
  month: string;
  salary: number;
  total_income: number;
  total_fixed: number;
  total_variable: number;
  balance: number;
  snapshot: Transaction[];
  closed_at: string;
}

interface CloseInput {
  month: string; // YYYY-MM (the month being closed)
  salary: number;
  snapshot: Transaction[];
  carryFixedIds: string[]; // tx ids from snapshot to carry into the new month
}

export function useMonthClose(transactions: Transaction[]) {
  const { user } = useAuth();
  const [shouldPrompt, setShouldPrompt] = useState(false);
  const [reports, setReports] = useState<MonthlyReport[]>([]);

  // Detect: it's a new month and we haven't closed the previous one yet,
  // and the user hasn't snoozed the prompt for today.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const now = new Date();
    const prev = previousMonthKey(now);
    const lastClosed = window.localStorage.getItem(LAST_CLOSED_KEY);
    const snoozedUntil = window.localStorage.getItem(SNOOZED_KEY);

    if (lastClosed === prev) return;
    if (snoozedUntil) {
      const until = new Date(snoozedUntil);
      if (!Number.isNaN(until.getTime()) && until.getTime() > now.getTime()) return;
    }

    // Only prompt if there is meaningful data from the previous month
    const hasPrevData = transactions.some((t) => {
      const d = new Date(t.date);
      return monthKey(d) === prev;
    });
    if (hasPrevData) setShouldPrompt(true);
  }, [transactions]);

  const dismissPrompt = useCallback(() => setShouldPrompt(false), []);

  const snoozeUntilTomorrow = useCallback(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    try {
      window.localStorage.setItem(SNOOZED_KEY, tomorrow.toISOString());
    } catch {
      /* ignore */
    }
    setShouldPrompt(false);
  }, []);

  const loadReports = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("monthly_reports")
      .select("id,month,salary,total_income,total_fixed,total_variable,balance,snapshot,closed_at")
      .eq("user_id", user.id)
      .order("month", { ascending: false });
    if (error) {
      console.warn("Failed to load reports", error);
      return;
    }
    setReports(
      (data ?? []).map((r) => ({
        id: r.id,
        month: r.month,
        salary: Number(r.salary),
        total_income: Number(r.total_income),
        total_fixed: Number(r.total_fixed),
        total_variable: Number(r.total_variable),
        balance: Number(r.balance),
        snapshot: (r.snapshot as unknown as Transaction[]) ?? [],
        closed_at: r.closed_at,
      })),
    );
  }, [user]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  /**
   * Persists the closed month report. Returns the new transactions to carry
   * over (caller is responsible for replacing the working transactions list).
   */
  const closeMonth = useCallback(
    async (
      input: CloseInput,
    ): Promise<{ report: MonthlyReport; carriedTx: Transaction[] }> => {
      const { month, salary, snapshot, carryFixedIds } = input;

      const total_income = snapshot
        .filter((t) => t.kind === "income")
        .reduce((s, t) => s + t.amount, 0);
      const total_fixed = snapshot
        .filter((t) => t.kind === "fixed")
        .reduce((s, t) => s + t.amount, 0);
      const total_variable = snapshot
        .filter((t) => t.kind === "variable")
        .reduce((s, t) => s + t.amount, 0);
      const balance = total_income - total_fixed - total_variable;

      // Build new transactions for the current month from the chosen fixed ids
      const now = new Date();
      const baseDate = new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0).toISOString();
      const carriedTx: Transaction[] = snapshot
        .filter((t) => carryFixedIds.includes(t.id))
        .map((t) => ({
          ...t,
          id: `t${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
          date: baseDate,
          status: "pending",
        }));

      // Add the salary as a paid income for the new month if > 0
      if (salary > 0) {
        carriedTx.unshift({
          id: `t${Date.now()}sal`,
          title: "Salário",
          amount: salary,
          kind: "income",
          category: "income",
          date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).toISOString(),
          status: "paid",
        });
      }

      let savedReport: MonthlyReport = {
        id: `local-${month}`,
        month,
        salary,
        total_income,
        total_fixed,
        total_variable,
        balance,
        snapshot,
        closed_at: new Date().toISOString(),
      };

      if (user) {
        const payload = {
          user_id: user.id,
          month,
          salary,
          total_income,
          total_fixed,
          total_variable,
          balance,
          snapshot: snapshot as unknown as never,
          closed_at: new Date().toISOString(),
        };
        const { data, error } = await supabase
          .from("monthly_reports")
          .upsert(payload, { onConflict: "user_id,month" })
          .select(
            "id,month,salary,total_income,total_fixed,total_variable,balance,snapshot,closed_at",
          )
          .single();
        if (error) {
          console.warn("Failed to save report", error);
        } else if (data) {
          savedReport = {
            id: data.id,
            month: data.month,
            salary: Number(data.salary),
            total_income: Number(data.total_income),
            total_fixed: Number(data.total_fixed),
            total_variable: Number(data.total_variable),
            balance: Number(data.balance),
            snapshot: (data.snapshot as unknown as Transaction[]) ?? [],
            closed_at: data.closed_at,
          };
        }
      }

      try {
        window.localStorage.setItem(LAST_CLOSED_KEY, month);
        window.localStorage.removeItem(SNOOZED_KEY);
      } catch {
        /* ignore */
      }

      setReports((prev) => {
        const filtered = prev.filter((r) => r.month !== savedReport.month);
        return [savedReport, ...filtered].sort((a, b) => b.month.localeCompare(a.month));
      });
      setShouldPrompt(false);

      return { report: savedReport, carriedTx };
    },
    [user],
  );

  return {
    shouldPrompt,
    dismissPrompt,
    snoozeUntilTomorrow,
    closeMonth,
    reports,
    reloadReports: loadReports,
  };
}
