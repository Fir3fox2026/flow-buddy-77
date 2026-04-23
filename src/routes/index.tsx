import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, AlertTriangle } from "lucide-react";
import { useFinance } from "@/hooks/use-finance";
import { MonthProgressBar } from "@/components/finance/MonthProgressBar";
import { Timeline } from "@/components/finance/Timeline";
import { QuickActionFab } from "@/components/finance/QuickActionFab";
import { FixedManager } from "@/components/finance/FixedManager";
import { StatCards } from "@/components/finance/StatCards";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Fluxo · Finanças sem planilha" },
      {
        name: "description",
        content:
          "App de finanças pessoais com timeline visual, ondas de fluxo e registro em 2 cliques. Veja seu dinheiro livre por dia.",
      },
      { property: "og:title", content: "Fluxo · Finanças sem planilha" },
      {
        property: "og:description",
        content: "Registre receitas e gastos de forma intuitiva e gamificada.",
      },
    ],
  }),
});

function Index() {
  const { transactions, addTransaction, markPaid, stats, flowSeries } = useFinance();
  const [tab, setTab] = useState<"timeline" | "fixed">("timeline");

  // Apply warning theme on the root
  useEffect(() => {
    const root = document.documentElement;
    if (stats.atypical) root.classList.add("theme-warning");
    else root.classList.remove("theme-warning");
  }, [stats.atypical]);

  return (
    <main
      className="mx-auto min-h-screen w-full max-w-2xl px-4 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] sm:px-5 sm:pt-12"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 9rem)" }}
    >
      {/* Header */}
      <header className="mb-6 flex items-center justify-between gap-3 sm:mb-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <Sparkles size={18} className="text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight">Fluxo</h1>
            <p className="truncate text-xs text-muted-foreground">Suas finanças em movimento</p>
          </div>
        </div>
        <AnimatePresence>
          {stats.atypical && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-1.5 text-[11px] font-medium text-warning ring-1 ring-warning/30 sm:px-3 sm:text-xs"
            >
              <AlertTriangle size={13} />
              <span>Atípico</span>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Progress card */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-card p-5 shadow-elegant ring-1 ring-border sm:p-6"
      >
        <MonthProgressBar
          currentBalance={stats.currentBalance}
          projectedBalance={stats.projectedBalance}
          daysLeft={stats.daysLeft}
          warning={stats.atypical}
        />
      </motion.section>

      {/* Stat cards */}
      <section className="mt-5">
        <StatCards
          income={stats.incomePaid + stats.incomePending}
          fixed={stats.fixedPaid + stats.fixedPending}
          variable={stats.variablePaid}
          dailyFree={stats.dailyFree}
          daysLeft={stats.daysLeft}
          warning={stats.atypical}
        />
      </section>

      {/* Tabs */}
      <section className="mt-8">
        <div className="mb-5 flex w-full rounded-2xl bg-muted/40 p-1 ring-1 ring-border sm:inline-flex sm:w-auto">
          {([
            { k: "timeline", label: "Timeline", short: "Timeline" },
            { k: "fixed", label: "Assinaturas & Receitas", short: "Fixos" },
          ] as const).map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`relative flex-1 rounded-xl px-3 py-2 text-xs font-medium transition sm:flex-none sm:px-4 ${
                tab === t.k ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === t.k && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-xl bg-gradient-primary shadow-glow"
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                />
              )}
              <span className={`relative ${tab === t.k ? "text-primary-foreground" : ""}`}>
                <span className="sm:hidden">{t.short}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "timeline" ? (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Timeline transactions={transactions} />
            </motion.div>
          ) : (
            <motion.div
              key="fixed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <FixedManager transactions={transactions} onConfirm={markPaid} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <QuickActionFab
        warning={stats.atypical}
        onQuickAdd={(category, amount, title) =>
          addTransaction({ title, amount, category, kind: "variable" })
        }
      />
    </main>
  );
}
