import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatBRL } from "@/lib/finance-data";

interface MonthProgressBarProps {
  currentBalance: number;
  projectedBalance: number;
  daysLeft: number;
  warning?: boolean;
}

export function MonthProgressBar({
  currentBalance,
  projectedBalance,
  daysLeft,
  warning,
}: MonthProgressBarProps) {
  const now = new Date();
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const progress = Math.min(100, (dayOfMonth / totalDays) * 100);
  const monthLabel = format(now, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="w-full">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Saldo atual</p>
          <motion.p
            key={currentBalance}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-semibold tracking-tight text-gradient-primary"
          >
            {formatBRL(currentBalance)}
          </motion.p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Previsto fim do mês
          </p>
          <p className="text-xl font-medium text-foreground/80">{formatBRL(projectedBalance)}</p>
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
