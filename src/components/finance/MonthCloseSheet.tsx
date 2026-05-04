import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Calendar, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import type { Transaction } from "@/lib/finance-data";
import { formatBRL } from "@/lib/finance-data";
import { monthKey, previousMonthKey, useMonthClose } from "@/hooks/use-month-close";

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function formatMonthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

interface MonthCloseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
  closeMonth: ReturnType<typeof useMonthClose>["closeMonth"];
  snoozeUntilTomorrow: () => void;
  /**
   * Atomically removes the closed month's transactions and inserts the
   * carried fixed items + salary into the new month.
   */
  onSwapTransactions: (removeIds: string[], addItems: Transaction[]) => Promise<void> | void;
}

export function MonthCloseSheet({
  open,
  onOpenChange,
  transactions,
  closeMonth,
  snoozeUntilTomorrow,
  onSwapTransactions,
}: MonthCloseSheetProps) {
  const monthToClose = useMemo(() => previousMonthKey(new Date()), []);
  const monthLabel = formatMonthLabel(monthToClose);

  // Snapshot of the previous month's transactions
  const snapshot = useMemo(
    () => transactions.filter((t) => monthKey(new Date(t.date)) === monthToClose),
    [transactions, monthToClose],
  );

  const fixedItems = useMemo(() => snapshot.filter((t) => t.kind === "fixed"), [snapshot]);

  const totals = useMemo(() => {
    const income = snapshot.filter((t) => t.kind === "income").reduce((s, t) => s + t.amount, 0);
    const fixed = snapshot.filter((t) => t.kind === "fixed").reduce((s, t) => s + t.amount, 0);
    const variable = snapshot
      .filter((t) => t.kind === "variable")
      .reduce((s, t) => s + t.amount, 0);
    return { income, fixed, variable, balance: income - fixed - variable };
  }, [snapshot]);

  const [carryIds, setCarryIds] = useState<Set<string>>(new Set());
  const [salary, setSalary] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Reset selections when opened
  useEffect(() => {
    if (open) {
      setCarryIds(new Set(fixedItems.map((t) => t.id)));
      // Pre-fill salary with previous month's first income, if any
      const lastSalary = snapshot.find((t) => t.kind === "income");
      setSalary(lastSalary ? String(lastSalary.amount) : "");
    }
  }, [open, fixedItems, snapshot]);

  function toggleCarry(id: string) {
    setCarryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleConfirm() {
    const salaryNum = Number(salary.replace(",", ".")) || 0;
    setSubmitting(true);
    try {
      const { carriedTx } = await closeMonth({
        month: monthToClose,
        salary: salaryNum,
        snapshot,
        carryFixedIds: Array.from(carryIds),
      });
      // Remove every transaction from the closed month and insert the
      // carried fixed items + salary as the new month's starting state.
      const removeIds = snapshot.map((t) => t.id);
      await onSwapTransactions(removeIds, carriedTx);
      toast.success(`${monthLabel} fechado e arquivado no histórico`);
      onOpenChange(false);
    } catch (e) {
      console.warn(e);
      toast.error("Não foi possível fechar o mês. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSnooze() {
    snoozeUntilTomorrow();
    onOpenChange(false);
    toast("Tudo bem, pergunto de novo amanhã");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-3xl border-border bg-background"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)" }}
      >
        <SheetHeader className="text-left">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Calendar size={16} />
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Novo mês começou
            </span>
          </div>
          <SheetTitle>Fechar {monthLabel}?</SheetTitle>
          <SheetDescription>
            Vou arquivar o resumo no histórico e limpar os lançamentos do mês.
            Apenas os fixos que você marcar abaixo seguem para o novo mês.
          </SheetDescription>
        </SheetHeader>

        {/* Summary */}
        <section className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-success/10 p-3 ring-1 ring-success/30">
            <div className="flex items-center gap-1.5 text-success">
              <TrendingUp size={14} />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Receitas</span>
            </div>
            <p className="mt-1 text-base font-semibold">{formatBRL(totals.income)}</p>
          </div>
          <div className="rounded-2xl bg-destructive/10 p-3 ring-1 ring-destructive/30">
            <div className="flex items-center gap-1.5 text-destructive">
              <TrendingDown size={14} />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Gastos</span>
            </div>
            <p className="mt-1 text-base font-semibold">
              {formatBRL(totals.fixed + totals.variable)}
            </p>
          </div>
          <div className="col-span-2 rounded-2xl bg-gradient-card p-3 ring-1 ring-border">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Wallet size={14} />
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Saldo do mês
              </span>
            </div>
            <p
              className={`mt-1 text-xl font-bold ${
                totals.balance >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {formatBRL(totals.balance)}
            </p>
          </div>
        </section>

        {/* Salary input */}
        <section className="mt-6">
          <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            Salário recebido neste novo mês
          </p>
          <div className="flex items-center gap-2 rounded-2xl bg-muted/40 px-4 py-3 ring-1 ring-border focus-within:ring-primary">
            <span className="text-sm font-medium text-muted-foreground">R$</span>
            <input
              inputMode="decimal"
              value={salary}
              onChange={(e) => setSalary(e.target.value.replace(/[^\d.,]/g, ""))}
              placeholder="0,00"
              className="w-full bg-transparent text-lg font-semibold outline-none"
            />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Será criado como receita já paga. Deixe 0 se ainda não recebeu.
          </p>
        </section>

        {/* Fixed picker */}
        {fixedItems.length > 0 && (
          <section className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Transportar fixos para o novo mês
              </p>
              <button
                onClick={() =>
                  setCarryIds((prev) =>
                    prev.size === fixedItems.length
                      ? new Set()
                      : new Set(fixedItems.map((t) => t.id)),
                  )
                }
                className="text-[11px] font-medium text-primary hover:underline"
              >
                {carryIds.size === fixedItems.length ? "Nenhum" : "Todos"}
              </button>
            </div>
            <div className="space-y-1.5">
              {fixedItems.map((t) => {
                const checked = carryIds.has(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => toggleCarry(t.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left ring-1 transition active:scale-[0.99] ${
                      checked
                        ? "bg-primary/10 ring-primary/40"
                        : "bg-muted/40 ring-border hover:bg-muted/60"
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ring-1 transition ${
                        checked
                          ? "bg-primary text-primary-foreground ring-primary"
                          : "bg-background ring-border"
                      }`}
                    >
                      {checked && <CheckCircle2 size={14} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatBRL(t.amount)} · pendente no novo mês
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Actions */}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={handleSnooze}
            disabled={submitting}
            className="rounded-2xl bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            Mais tarde
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleConfirm}
            disabled={submitting}
            className="rounded-2xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
          >
            {submitting ? "Salvando..." : "Fechar mês"}
          </motion.button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
