import { useEffect, useState } from "react";
import {
  loadPrefs,
  savePrefs,
  notify,
  shouldFire,
  type NotifPrefs,
} from "@/lib/notifications";
import { formatBRL, type Transaction } from "@/lib/finance-data";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

interface MonitorArgs {
  transactions: Transaction[];
  atypical: boolean;
  variableSpentToday: number;
}

/** Hook that owns the notification preferences and runs periodic checks
 * for the four notification kinds: due bills, weekly summary, atypical
 * spending, and "log a transaction" reminder. */
export function useNotifications({
  transactions,
  atypical,
  variableSpentToday,
}: MonitorArgs) {
  const [prefs, setPrefs] = useState<NotifPrefs>(() => loadPrefs());

  useEffect(() => {
    const onChange = () => setPrefs(loadPrefs());
    window.addEventListener("fluxo:notif-prefs-changed", onChange);
    return () => window.removeEventListener("fluxo:notif-prefs-changed", onChange);
  }, []);

  const updatePrefs = (patch: Partial<NotifPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    savePrefs(next);
  };

  // --- Atypical spend (immediate when flag flips) ---
  useEffect(() => {
    if (!prefs.enabled || !prefs.atypical) return;
    if (!atypical) return;
    notify({
      title: "Gasto atípico hoje",
      body: `Você já gastou ${formatBRL(variableSpentToday)} hoje — acima da sua média.`,
      tag: "fluxo-atypical",
      dedupeKey: `atypical:${new Date().toDateString()}`,
      dedupeWindowMs: 12 * HOUR,
    });
  }, [atypical, variableSpentToday, prefs.enabled, prefs.atypical]);

  // --- Periodic checks: due bills, weekly summary, log reminder ---
  useEffect(() => {
    if (!prefs.enabled) return;

    const run = () => {
      const now = new Date();

      // 1) Due bills — fixed pending in next 3 days
      if (prefs.dueBills) {
        const horizon = now.getTime() + 3 * DAY;
        const due = transactions.filter((t) => {
          if (t.kind !== "fixed" || t.status !== "pending") return false;
          const ts = new Date(t.date).getTime();
          return ts >= now.getTime() - DAY && ts <= horizon;
        });
        if (due.length > 0) {
          const total = due.reduce((s, t) => s + t.amount, 0);
          const dateKey = now.toISOString().slice(0, 10);
          notify({
            title:
              due.length === 1
                ? `${due[0].title} vence em breve`
                : `${due.length} contas a vencer`,
            body:
              due.length === 1
                ? `${formatBRL(due[0].amount)} — ${new Date(due[0].date).toLocaleDateString("pt-BR")}`
                : `Total ${formatBRL(total)} nos próximos 3 dias.`,
            tag: "fluxo-due-bills",
            dedupeKey: `due-bills:${dateKey}`,
            dedupeWindowMs: 20 * HOUR,
          });
        }
      }

      // 2) Weekly summary — Sunday 19h–22h
      if (prefs.weeklySummary && now.getDay() === 0 && now.getHours() >= 19 && now.getHours() <= 22) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        const weekTx = transactions.filter((t) => {
          const ts = new Date(t.date).getTime();
          return ts >= weekStart.getTime() && ts <= now.getTime() && t.status === "paid";
        });
        const spent = weekTx
          .filter((t) => t.kind !== "income")
          .reduce((s, t) => s + t.amount, 0);
        const earned = weekTx
          .filter((t) => t.kind === "income")
          .reduce((s, t) => s + t.amount, 0);
        const weekKey = `${now.getFullYear()}-W${Math.floor(now.getDate() / 7)}`;
        notify({
          title: "Resumo da semana",
          body: `Você gastou ${formatBRL(spent)} e recebeu ${formatBRL(earned)} esta semana.`,
          tag: "fluxo-weekly",
          dedupeKey: `weekly:${weekKey}`,
          dedupeWindowMs: 6 * DAY,
        });
      }

      // 3) Log reminder — 20h–22h, only if no variable transaction today
      if (prefs.logReminder && now.getHours() >= 20 && now.getHours() <= 22) {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const loggedToday = transactions.some((t) => {
          if (t.kind === "income") return false;
          return new Date(t.date).getTime() >= todayStart;
        });
        if (!loggedToday) {
          const dateKey = now.toISOString().slice(0, 10);
          if (shouldFire(`log-reminder:${dateKey}`, 20 * HOUR)) {
            notify({
              title: "Lembrete de despesas",
              body: "Não esqueça de registrar seus gastos de hoje.",
              tag: "fluxo-log-reminder",
              dedupeKey: `log-reminder:${dateKey}`,
              dedupeWindowMs: 20 * HOUR,
            });
          }
        }
      }
    };

    // Run immediately + every 30 minutes while app is open
    run();
    const interval = window.setInterval(run, 30 * 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [
    prefs.enabled,
    prefs.dueBills,
    prefs.weeklySummary,
    prefs.logReminder,
    transactions,
  ]);

  return { prefs, updatePrefs };
}
