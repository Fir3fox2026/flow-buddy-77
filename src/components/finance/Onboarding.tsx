import { motion } from "framer-motion";
import { Sparkles, TrendingUp, TrendingDown, ArrowRight, WifiOff } from "lucide-react";
import { formatBRL } from "@/lib/finance-data";

interface OnboardingProps {
  income: number;
  expenses: number;
  dailyFree: number;
  daysLeft: number;
  onStart: () => void;
  onAddIncome: () => void;
  onAddExpense: () => void;
}

export function Onboarding({
  income,
  expenses,
  dailyFree,
  daysLeft,
  onStart,
  onAddIncome,
  onAddExpense,
}: OnboardingProps) {
  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5"
      style={{
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 2.5rem)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2rem)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col items-center text-center"
      >
        <div className="animate-float flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-primary shadow-glow">
          <Sparkles size={36} className="text-primary-foreground" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">Bem-vindo ao Fluxo</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Suas finanças pessoais em movimento. Registre receitas e gastos em poucos cliques.
        </p>
      </motion.div>

      {/* Month summary */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="mt-8 rounded-3xl bg-gradient-card p-5 shadow-elegant ring-1 ring-border"
      >
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Resumo do mês
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-success/10 p-3 ring-1 ring-success/20">
            <p className="text-[10px] uppercase tracking-wider text-success/80">Receitas</p>
            <p className="mt-1 text-base font-semibold tabular-nums text-success">
              {formatBRL(income)}
            </p>
          </div>
          <div className="rounded-2xl bg-muted/40 p-3 ring-1 ring-border">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Gastos</p>
            <p className="mt-1 text-base font-semibold tabular-nums">{formatBRL(expenses)}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl bg-primary/10 p-3 ring-1 ring-primary/20">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-primary/80">
              Livre por dia ({daysLeft}d)
            </p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-primary">
              {formatBRL(dailyFree)}
            </p>
          </div>
          <Sparkles size={20} className="text-primary" />
        </div>
      </motion.section>

      {/* Quick actions */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.2 }}
        className="mt-5 grid grid-cols-2 gap-3"
      >
        <button
          onClick={onAddIncome}
          className="group flex flex-col items-start gap-2 rounded-2xl bg-gradient-card p-4 ring-1 ring-border transition active:scale-[0.97]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15 text-success ring-1 ring-success/30">
            <TrendingUp size={18} />
          </div>
          <p className="text-sm font-semibold">Receita</p>
          <p className="text-xs text-muted-foreground">Registre uma entrada</p>
        </button>
        <button
          onClick={onAddExpense}
          className="group flex flex-col items-start gap-2 rounded-2xl bg-gradient-card p-4 ring-1 ring-border transition active:scale-[0.97]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
            <TrendingDown size={18} />
          </div>
          <p className="text-sm font-semibold">Gasto</p>
          <p className="text-xs text-muted-foreground">Registre uma saída</p>
        </button>
      </motion.section>

      {/* Offline note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-5 flex items-center gap-2 rounded-2xl bg-muted/30 px-4 py-3 text-xs text-muted-foreground ring-1 ring-border"
      >
        <WifiOff size={14} className="shrink-0" />
        <span>Funciona offline — seus dados ficam salvos automaticamente neste dispositivo.</span>
      </motion.div>

      <div className="flex-1" />

      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.35 }}
        onClick={onStart}
        whileTap={{ scale: 0.97 }}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-4 text-sm font-semibold text-primary-foreground shadow-glow"
      >
        Começar agora
        <ArrowRight size={18} />
      </motion.button>
    </main>
  );
}
