import { motion } from "framer-motion";
import { format, isToday, isYesterday, isFuture } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Coffee,
  Car,
  Sparkles,
  ShoppingBag,
  ArrowDownCircle,
  Repeat,
  type LucideIcon,
} from "lucide-react";
import { categoryLabel, formatBRL, type Transaction } from "@/lib/finance-data";

const iconMap: Record<string, LucideIcon> = {
  food: Coffee,
  transport: Car,
  leisure: Sparkles,
  other: ShoppingBag,
  income: ArrowDownCircle,
  subscription: Repeat,
};

function formatLabel(date: Date) {
  if (isToday(date)) return "Hoje";
  if (isYesterday(date)) return "Ontem";
  return format(date, "EEE, d 'de' MMM", { locale: ptBR });
}

interface TimelineProps {
  transactions: Transaction[];
}

export function Timeline({ transactions }: TimelineProps) {
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div className="relative">
      <div className="absolute bottom-2 left-[19px] top-2 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
      <ul className="space-y-2">
        {sorted.map((t, i) => {
          const Icon = iconMap[t.category] ?? ShoppingBag;
          const date = new Date(t.date);
          const future = isFuture(date) || t.status === "pending";
          const isIncome = t.kind === "income";
          return (
            <motion.li
              key={t.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: future ? 0.45 : 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
              className={`relative flex items-center gap-4 rounded-2xl px-3 py-3 transition hover:bg-muted/40 ${
                future ? "" : ""
              }`}
            >
              <div
                className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ${
                  isIncome
                    ? "bg-success/15 text-success ring-success/30"
                    : future
                      ? "bg-muted/60 text-muted-foreground ring-border"
                      : "bg-primary/15 text-primary ring-primary/30"
                }`}
              >
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{t.title}</p>
                  {future && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      Previsto
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatLabel(date)} · {categoryLabel[t.category]}
                </p>
              </div>
              <div
                className={`text-right text-sm font-semibold tabular-nums ${
                  isIncome ? "text-success" : "text-foreground"
                }`}
              >
                {isIncome ? "+" : "−"}
                {formatBRL(t.amount)}
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
