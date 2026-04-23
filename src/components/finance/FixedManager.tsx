import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Check, Repeat, ArrowDownCircle } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatBRL, type Transaction } from "@/lib/finance-data";

interface FixedCardProps {
  tx: Transaction;
  onConfirm: (id: string) => void;
}

function FixedCard({ tx, onConfirm }: FixedCardProps) {
  const x = useMotionValue(0);
  const bg = useTransform(
    x,
    [0, 140],
    ["oklch(0.24 0.03 250)", "oklch(0.32 0.1 160)"],
  );
  const checkOpacity = useTransform(x, [40, 120], [0, 1]);
  const [confirmed, setConfirmed] = useState(false);
  const isIncome = tx.kind === "income";

  function handleEnd() {
    if (x.get() > 120) {
      setConfirmed(true);
      animate(x, 360, { duration: 0.35 });
      setTimeout(() => onConfirm(tx.id), 320);
    } else {
      animate(x, 0, { type: "spring", stiffness: 320, damping: 28 });
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl ring-1 ring-border">
      {/* underlay confirm bar */}
      <div className="absolute inset-0 flex items-center justify-start bg-gradient-to-r from-success/30 via-success/15 to-transparent px-5">
        <motion.div
          style={{ opacity: checkOpacity }}
          className="flex items-center gap-2 text-sm font-medium text-success"
        >
          <Check size={18} />
          Solte para confirmar
        </motion.div>
      </div>

      <motion.div
        drag={confirmed ? false : "x"}
        dragConstraints={{ left: 0, right: 200 }}
        dragElastic={0.15}
        onDragEnd={handleEnd}
        style={{ x, background: bg }}
        whileTap={{ cursor: "grabbing" }}
        className="relative z-10 flex cursor-grab items-center gap-4 px-4 py-4"
      >
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${
            isIncome
              ? "bg-success/15 text-success ring-success/30"
              : "bg-primary/15 text-primary ring-primary/30"
          }`}
        >
          {isIncome ? <ArrowDownCircle size={20} /> : <Repeat size={20} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{tx.title}</p>
          <p className="text-xs text-muted-foreground">
            Vence {format(new Date(tx.date), "d 'de' MMM", { locale: ptBR })}
          </p>
        </div>
        <p className={`text-sm font-semibold tabular-nums ${isIncome ? "text-success" : ""}`}>
          {isIncome ? "+" : "−"}
          {formatBRL(tx.amount)}
        </p>
      </motion.div>
    </div>
  );
}

interface FixedManagerProps {
  transactions: Transaction[];
  onConfirm: (id: string) => void;
}

export function FixedManager({ transactions, onConfirm }: FixedManagerProps) {
  const pending = transactions
    .filter((t) => (t.kind === "fixed" || t.kind === "income") && t.status === "pending")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (pending.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">Tudo em dia 🎉</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Nenhuma assinatura ou receita pendente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Arraste o card para a direita para confirmar →
      </p>
      <div className="space-y-2">
        {pending.map((tx) => (
          <FixedCard key={tx.id} tx={tx} onConfirm={onConfirm} />
        ))}
      </div>
    </div>
  );
}
