import { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { format, isToday, isYesterday, isFuture } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Coffee,
  Car,
  Sparkles,
  ShoppingBag,
  ArrowDownCircle,
  Repeat,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { categoryLabel, formatBRL, type Transaction } from "@/lib/finance-data";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  onRemove?: (id: string) => void;
}

const SWIPE_REVEAL = -84;
const SWIPE_THRESHOLD = -56;

interface RowProps {
  tx: Transaction;
  index: number;
  onAskRemove: (tx: Transaction) => void;
}

function TimelineRow({ tx, index, onAskRemove }: RowProps) {
  const x = useMotionValue(0);
  const [revealed, setRevealed] = useState(false);
  const Icon = iconMap[tx.category] ?? ShoppingBag;
  const date = new Date(tx.date);
  const future = isFuture(date) || tx.status === "pending";
  const isIncome = tx.kind === "income";

  const deleteOpacity = useTransform(x, [SWIPE_REVEAL, SWIPE_THRESHOLD / 2, 0], [1, 0.6, 0]);

  return (
    <li className="relative overflow-hidden rounded-2xl">
      {/* Delete background revealed by swipe */}
      <motion.button
        type="button"
        onClick={() => onAskRemove(tx)}
        style={{ opacity: deleteOpacity }}
        className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-destructive text-destructive-foreground"
        aria-label={`Excluir ${tx.title}`}
      >
        <Trash2 size={18} />
      </motion.button>

      <motion.div
        drag="x"
        dragConstraints={{ left: SWIPE_REVEAL, right: 0 }}
        dragElastic={{ left: 0.05, right: 0.2 }}
        dragMomentum={false}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.offset.x < SWIPE_THRESHOLD || revealed) {
            x.set(SWIPE_REVEAL);
            setRevealed(true);
          } else {
            x.set(0);
            setRevealed(false);
          }
        }}
        onClick={() => {
          if (revealed) {
            x.set(0);
            setRevealed(false);
          }
        }}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: future ? 0.55 : 1, x: 0 }}
        transition={{ delay: Math.min(index * 0.03, 0.4) }}
        className="relative flex cursor-grab items-center gap-4 rounded-2xl bg-background px-3 py-3 transition active:cursor-grabbing"
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
            <p className="truncate text-sm font-medium text-foreground">{tx.title}</p>
            {future && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                Previsto
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatLabel(date)} · {categoryLabel[tx.category]}
          </p>
        </div>
        <div
          className={`text-right text-sm font-semibold tabular-nums ${
            isIncome ? "text-success" : "text-foreground"
          }`}
        >
          {isIncome ? "+" : "−"}
          {formatBRL(tx.amount)}
        </div>
      </motion.div>
    </li>
  );
}

export function Timeline({ transactions, onRemove }: TimelineProps) {
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const [pending, setPending] = useState<Transaction | null>(null);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute bottom-2 left-[19px] top-2 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {sorted.map((t, i) => (
            <TimelineRow key={t.id} tx={t} index={i} onAskRemove={setPending} />
          ))}
        </AnimatePresence>
      </ul>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending && (
                <>
                  <span className="font-medium text-foreground">{pending.title}</span> —{" "}
                  {formatBRL(pending.amount)}. Esta ação não pode ser desfeita.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pending) onRemove?.(pending.id);
                setPending(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
