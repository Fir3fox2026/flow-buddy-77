import { motion, AnimatePresence } from "framer-motion";
import { Coffee, Car, Sparkles, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import type { Category } from "@/lib/finance-data";

interface QuickActionFabProps {
  onQuickAdd: (category: Category, amount: number, title: string) => void;
  warning?: boolean;
}

const quickItems: { key: Category; label: string; icon: React.ElementType; color: string }[] = [
  { key: "food", label: "Alimentação", icon: Coffee, color: "oklch(0.74 0.16 160)" },
  { key: "transport", label: "Transporte", icon: Car, color: "oklch(0.72 0.16 195)" },
  { key: "leisure", label: "Lazer", icon: Sparkles, color: "oklch(0.7 0.18 300)" },
  { key: "other", label: "Outros", icon: ShoppingBag, color: "oklch(0.78 0.16 70)" },
];

export function QuickActionFab({ onQuickAdd, warning }: QuickActionFabProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Category | null>(null);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setAmount("");
    }
  }, [open]);

  function commit() {
    const v = parseFloat(amount.replace(",", "."));
    if (!selected || !v || v <= 0) return;
    const item = quickItems.find((i) => i.key === selected)!;
    onQuickAdd(selected, v, item.label);
    setOpen(false);
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-md"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 7rem)" }}
            className="fixed left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 rounded-3xl bg-gradient-card p-5 shadow-elegant ring-1 ring-border sm:p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-semibold">Registrar gasto</h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {quickItems.map((item, i) => {
                const Icon = item.icon;
                const active = selected === item.key;
                return (
                  <motion.button
                    key={item.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setSelected(item.key)}
                    className={`group flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition ${
                      active
                        ? "bg-primary/15 ring-2 ring-primary"
                        : "bg-muted/40 ring-1 ring-border hover:bg-muted"
                    }`}
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl transition"
                      style={{ background: `${item.color} / 0.15`, backgroundColor: `color-mix(in oklab, ${item.color} 18%, transparent)` }}
                    >
                      <Icon size={22} style={{ color: item.color }} />
                    </div>
                    <span className="text-[11px] font-medium text-foreground/80">{item.label}</span>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence>
              {selected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-5 overflow-hidden"
                >
                  <div className="flex items-center gap-2 rounded-2xl bg-muted/40 px-4 py-3 ring-1 ring-border focus-within:ring-2 focus-within:ring-primary">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <input
                      autoFocus
                      inputMode="decimal"
                      placeholder="0,00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && commit()}
                      className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <button
                    onClick={commit}
                    className="mt-3 w-full rounded-2xl bg-gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95 active:scale-[0.98]"
                  >
                    Adicionar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.75rem)" }}
        className={`fixed left-1/2 z-50 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow ${warning ? "animate-pulse-glow" : ""}`}
        aria-label="Adicionar"
      >
        <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ type: "spring", stiffness: 280 }}>
          <Plus size={28} strokeWidth={2.5} />
        </motion.div>
      </motion.button>
    </>
  );
}
