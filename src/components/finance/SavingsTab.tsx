import { useMemo } from "react";
import { motion } from "framer-motion";
import { PiggyBank, TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatBRL, type Transaction } from "@/lib/finance-data";

interface SavingsTabProps {
  transactions: Transaction[];
  onAdd: () => void;
}

export function SavingsTab({ transactions, onAdd }: SavingsTabProps) {
  const { entries, total, monthTotal } = useMemo(() => {
    const list = transactions
      .filter((t) => t.category === "savings")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const total = list.reduce((s, t) => s + t.amount, 0);
    const now = new Date();
    const monthTotal = list
      .filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, t) => s + t.amount, 0);
    return { entries: list, total, monthTotal };
  }, [transactions]);

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-primary p-6 text-primary-foreground shadow-elegant"
      >
        <div className="absolute -right-6 -top-6 opacity-20">
          <PiggyBank size={140} strokeWidth={1.2} />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-90">
            <PiggyBank size={14} /> Cofrinho pessoal
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums">{formatBRL(total)}</p>
          <div className="mt-3 flex items-center gap-1.5 text-xs opacity-90">
            <TrendingUp size={12} />
            <span>{formatBRL(monthTotal)} guardado este mês</span>
          </div>
        </div>
      </motion.div>

      <button
        onClick={onAdd}
        className="w-full rounded-2xl bg-gradient-card py-3 text-sm font-medium ring-1 ring-border transition hover:bg-muted/60 active:scale-[0.99]"
      >
        + Guardar no cofrinho
      </button>

      <div>
        <h3 className="mb-2 px-1 text-xs uppercase tracking-wider text-muted-foreground">
          Histórico
        </h3>
        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <PiggyBank size={20} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum valor guardado ainda. Comece pequeno!
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {entries.map((t, i) => (
              <motion.li
                key={t.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="flex items-center gap-3 rounded-2xl bg-background px-3 py-3 ring-1 ring-border"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
                  <PiggyBank size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar size={11} />
                    {format(new Date(t.date), "d 'de' MMM, yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="text-right text-sm font-semibold tabular-nums text-success">
                  +{formatBRL(t.amount)}
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
