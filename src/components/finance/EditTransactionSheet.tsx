import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Coffee, Car, Sparkles, ShoppingBag, ArrowDownCircle, Repeat } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  type Category,
  type Transaction,
  type TxKind,
  type TxStatus,
  categoryLabel,
} from "@/lib/finance-data";

interface EditTransactionSheetProps {
  tx: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, patch: Partial<Transaction>) => void;
}

const KIND_OPTIONS: { key: TxKind; label: string; icon: React.ElementType }[] = [
  { key: "income", label: "Receita", icon: ArrowDownCircle },
  { key: "fixed", label: "Fixo", icon: Repeat },
  { key: "variable", label: "Variável", icon: ShoppingBag },
];

const CATEGORY_OPTIONS: { key: Category; icon: React.ElementType }[] = [
  { key: "food", icon: Coffee },
  { key: "transport", icon: Car },
  { key: "leisure", icon: Sparkles },
  { key: "other", icon: ShoppingBag },
  { key: "subscription", icon: Repeat },
  { key: "income", icon: ArrowDownCircle },
];

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

export function EditTransactionSheet({
  tx,
  open,
  onOpenChange,
  onSave,
}: EditTransactionSheetProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<TxKind>("variable");
  const [category, setCategory] = useState<Category>("other");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<TxStatus>("paid");

  useEffect(() => {
    if (open && tx) {
      setTitle(tx.title);
      setAmount(String(tx.amount).replace(".", ","));
      setKind(tx.kind);
      setCategory(tx.category);
      setDate(toLocalInput(tx.date));
      setStatus(tx.status);
    }
  }, [open, tx]);

  function handleSave() {
    if (!tx) return;
    const v = parseFloat(amount.replace(",", "."));
    if (!title.trim() || !v || v <= 0) return;
    onSave(tx.id, {
      title: title.trim(),
      amount: v,
      kind,
      category,
      date: new Date(date).toISOString(),
      status,
    });
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-3xl border-border bg-background"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)" }}
      >
        <SheetHeader className="text-left">
          <SheetTitle>Editar lançamento</SheetTitle>
          <SheetDescription>Atualize as informações do registro.</SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-muted-foreground">
              Título
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl bg-muted/40 px-4 py-3 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary"
              placeholder="Ex.: Mercado"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-muted-foreground">
              Valor
            </label>
            <div className="flex items-center gap-2 rounded-2xl bg-muted/40 px-4 py-3 ring-1 ring-border focus-within:ring-2 focus-within:ring-primary">
              <span className="text-sm text-muted-foreground">R$</span>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full bg-transparent text-2xl font-semibold tabular-nums outline-none"
              />
            </div>
          </div>

          {/* Kind */}
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-muted-foreground">
              Tipo
            </label>
            <div className="grid grid-cols-3 gap-2">
              {KIND_OPTIONS.map((k) => {
                const Icon = k.icon;
                const active = kind === k.key;
                return (
                  <button
                    key={k.key}
                    type="button"
                    onClick={() => {
                      setKind(k.key);
                      if (k.key === "income") setCategory("income");
                      else if (k.key === "fixed") setCategory("subscription");
                      else if (category === "income" || category === "subscription")
                        setCategory("other");
                    }}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 ring-1 transition ${
                      active
                        ? "bg-primary/15 ring-primary"
                        : "bg-muted/40 ring-border hover:bg-muted/60"
                    }`}
                  >
                    <Icon size={18} className={active ? "text-primary" : "text-muted-foreground"} />
                    <span className="text-xs font-medium">{k.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-muted-foreground">
              Categoria
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORY_OPTIONS.map((c) => {
                const Icon = c.icon;
                const active = category === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-left ring-1 transition ${
                      active
                        ? "bg-primary/15 ring-primary"
                        : "bg-muted/40 ring-border hover:bg-muted/60"
                    }`}
                  >
                    <Icon size={16} className={active ? "text-primary" : "text-muted-foreground"} />
                    <span className="truncate text-xs font-medium">{categoryLabel[c.key]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-muted-foreground">
              Data
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-2xl bg-muted/40 px-4 py-3 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Status */}
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-muted-foreground">
              Status
            </label>
            <div className="flex rounded-2xl bg-muted/40 p-1 ring-1 ring-border">
              {(["paid", "pending"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 rounded-xl px-3 py-2 text-xs font-medium transition ${
                    status === s
                      ? "bg-card text-foreground ring-1 ring-border"
                      : "text-muted-foreground"
                  }`}
                >
                  {s === "paid" ? "Confirmado" : "Pendente"}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full rounded-2xl bg-gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow transition active:scale-[0.98]"
          >
            Salvar alterações
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
