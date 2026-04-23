import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, Calendar } from "lucide-react";
import { formatBRL } from "@/lib/finance-data";

interface StatCardsProps {
  income: number;
  fixed: number;
  variable: number;
  dailyFree: number;
  daysLeft: number;
  warning?: boolean;
}

export function StatCards({ income, fixed, variable, dailyFree, daysLeft, warning }: StatCardsProps) {
  const items = [
    {
      label: "Receitas",
      value: formatBRL(income),
      icon: TrendingUp,
      tone: "success" as const,
    },
    {
      label: "Fixos",
      value: formatBRL(fixed),
      icon: Calendar,
      tone: "muted" as const,
    },
    {
      label: "Variáveis",
      value: formatBRL(variable),
      icon: TrendingDown,
      tone: warning ? ("warning" as const) : ("muted" as const),
    },
    {
      label: `Livre / dia (${daysLeft}d)`,
      value: formatBRL(dailyFree),
      icon: Wallet,
      tone: "primary" as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it, i) => {
        const Icon = it.icon;
        const toneClass = {
          success: "text-success",
          muted: "text-muted-foreground",
          warning: "text-warning",
          primary: "text-primary",
        }[it.tone];
        return (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl bg-gradient-card p-4 ring-1 ring-border shadow-soft"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {it.label}
              </p>
              <Icon size={14} className={toneClass} />
            </div>
            <p className={`mt-2 text-lg font-semibold tabular-nums ${toneClass}`}>{it.value}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
