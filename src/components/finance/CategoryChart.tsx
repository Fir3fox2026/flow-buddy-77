import { useMemo } from "react";
import { motion } from "framer-motion";
import { PieChart as PieIcon } from "lucide-react";
import {
  categoryLabel,
  formatBRL,
  isExpense,
  startOfMonth,
  endOfMonth,
  type Category,
  type Transaction,
} from "@/lib/finance-data";

interface CategoryChartProps {
  transactions: Transaction[];
}

const COLORS: Record<Category, string> = {
  food: "oklch(0.74 0.16 160)",
  transport: "oklch(0.72 0.16 195)",
  leisure: "oklch(0.7 0.18 300)",
  other: "oklch(0.78 0.16 70)",
  subscription: "oklch(0.7 0.17 25)",
  income: "oklch(0.78 0.18 140)",
};

const CIRCUMFERENCE = 2 * Math.PI * 56; // r=56

export function CategoryChart({ transactions }: CategoryChartProps) {
  const { slices, total } = useMemo(() => {
    const now = new Date();
    const som = startOfMonth(now);
    const eom = endOfMonth(now);

    const totals = new Map<Category, number>();
    transactions.forEach((t) => {
      if (!isExpense(t)) return;
      const d = new Date(t.date);
      if (d < som || d > eom) return;
      totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
    });

    const total = Array.from(totals.values()).reduce((s, v) => s + v, 0);
    const slices = Array.from(totals.entries())
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, value]) => ({
        cat,
        value,
        pct: total > 0 ? value / total : 0,
      }));
    return { slices, total };
  }, [transactions]);

  if (slices.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <PieIcon size={20} className="mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Sem gastos neste mês ainda.</p>
      </div>
    );
  }

  // Build stroke-dasharray segments
  let offset = 0;
  const segments = slices.map((s) => {
    const length = s.pct * CIRCUMFERENCE;
    const seg = {
      ...s,
      length,
      offset,
    };
    offset += length;
    return seg;
  });

  return (
    <div className="rounded-3xl bg-gradient-card p-5 shadow-elegant ring-1 ring-border">
      <div className="flex items-center gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative h-32 w-32 shrink-0"
        >
          <svg viewBox="0 0 128 128" className="-rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="oklch(0.24 0.02 250)"
              strokeWidth="14"
            />
            {segments.map((s, i) => (
              <motion.circle
                key={s.cat}
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke={COLORS[s.cat]}
                strokeWidth="14"
                strokeLinecap="butt"
                strokeDasharray={`${s.length} ${CIRCUMFERENCE}`}
                strokeDashoffset={-s.offset}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05 * i, duration: 0.4 }}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Gastos
            </span>
            <span className="text-base font-semibold tabular-nums">{formatBRL(total)}</span>
          </div>
        </motion.div>

        <ul className="min-w-0 flex-1 space-y-1.5">
          {slices.slice(0, 5).map((s, i) => (
            <motion.li
              key={s.cat}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className="flex items-center gap-2 text-xs"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: COLORS[s.cat] }}
              />
              <span className="truncate text-foreground/90">{categoryLabel[s.cat]}</span>
              <span className="ml-auto shrink-0 text-muted-foreground tabular-nums">
                {Math.round(s.pct * 100)}%
              </span>
              <span className="shrink-0 text-foreground/80 tabular-nums">
                {formatBRL(s.value)}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
