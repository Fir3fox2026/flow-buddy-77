import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PiggyBank, Wallet } from "lucide-react";
import { formatBRL } from "@/lib/finance-data";

interface MonthProgressBarProps {
  currentBalance: number;
  projectedBalance: number;
  daysLeft: number;
  warning?: boolean;
  savingsTotal?: number;
}

export function MonthProgressBar({
  currentBalance,
  projectedBalance,
  daysLeft,
  warning,
  savingsTotal = 0,
}: MonthProgressBarProps) {
  const [view, setView] = useState<"balance" | "savings">("balance");
  const now = new Date();
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const progress = Math.min(100, (dayOfMonth / totalDays) * 100);
  const monthLabel = format(now, "MMMM 'de' yyyy", { locale: ptBR });

  const isSavings = view === "savings";
  const displayValue = isSavings ? savingsTotal : currentBalance;
  const displayLabel = isSavings ? "Cofrinho" : "Saldo atual";

  return (
    <div className="w-full">
      <div className="mb-5 flex flex-col gap-3 xs:flex-row xs:items-end xs:justify-between sm:flex-row sm:items-end sm:justify-between">
        <div className="relative">
          <div className="flex items-center gap-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
              {displayLabel}
            </p>
            {/* Floating toggle balloon */}
            <motion.button
              type="button"
              onClick={() => setView(isSavings ? "balance" : "savings")}
              whileTap={{ scale: 0.92 }}
              animate={{ y: [0, -2, 0] }}
              transition={{ y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } }}
              className={`group relative flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 transition ${
                isSavings
                  ? "bg-background text-foreground ring-border hover:bg-muted/60"
                  : "bg-primary/15 text-primary ring-primary/30 hover:bg-primary/20"
              }`}
              aria-label={isSavings ? "Ver saldo" : "Ver cofrinho"}
            >
              {isSavings ? <Wallet size={11} /> : <PiggyBank size={11} />}
              <span>{isSavings ? "Saldo" : formatBRL(savingsTotal)}</span>
              {/* balloon tail */}
              <span
                className={`absolute -bottom-1 left-3 h-2 w-2 rotate-45 ${
                  isSavings ? "bg-background ring-1 ring-border" : "bg-primary/15 ring-1 ring-primary/30"
                }`}
                style={{ clipPath: "polygon(0 100%, 100% 0, 100% 100%)" }}
              />
            </motion.button>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={`${view}-${displayValue}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className={`text-3xl font-semibold tracking-tight sm:text-4xl ${
                isSavings ? "text-success" : "text-gradient-primary"
              }`}
            >
              {formatBRL(displayValue)}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
            {isSavings ? "Meta livre / mês" : "Previsto fim do mês"}
          </p>
          <p className="text-lg font-medium text-foreground/80 sm:text-xl">
            {formatBRL(isSavings ? savingsTotal : projectedBalance)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="capitalize">{monthLabel}</span>
          <span>
            Dia {dayOfMonth} de {totalDays} · {daysLeft}d restantes
          </span>
        </div>

        <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted/50 ring-1 ring-border">
          {/* progress fill */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.1, ease: [0.4, 0, 0.2, 1] }}
            className={`relative h-full rounded-full ${
              warning ? "bg-gradient-to-r from-warning to-warning/70" : "bg-gradient-primary"
            } shadow-glow`}
          >
            {/* shimmer */}
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
            />
          </motion.div>

          {/* today marker dot */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1, type: "spring", stiffness: 260 }}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${progress}%` }}
          >
            <div
              className={`h-5 w-5 rounded-full border-2 border-background ${
                warning ? "bg-warning" : "bg-primary-glow"
              } shadow-glow`}
            />
          </motion.div>
        </div>

        <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground/70">
          <span>Início</span>
          <span>{Math.round(progress)}% do mês</span>
          <span>Fim</span>
        </div>
      </div>
    </div>
  );
}
