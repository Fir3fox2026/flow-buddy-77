import { useCallback, useMemo, useState } from "react";
import {
  initialTransactions,
  signedAmount,
  isExpense,
  startOfMonth,
  endOfMonth,
  type Transaction,
} from "@/lib/finance-data";

export function useFinance() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

  const addTransaction = useCallback((tx: Omit<Transaction, "id" | "date" | "status">) => {
    setTransactions((prev) => [
      {
        ...tx,
        id: `t${Date.now()}`,
        date: new Date().toISOString(),
        status: "paid",
      },
      ...prev,
    ]);
  }, []);

  const markPaid = useCallback((id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "paid", date: new Date().toISOString() } : t)),
    );
  }, []);

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

    // Atypical spend detection: variable spend today vs avg of last 7 days
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

  // Build streamgraph series: cumulative actual vs projected, day-by-day for current month
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

  return { transactions, addTransaction, markPaid, stats, flowSeries };
}
