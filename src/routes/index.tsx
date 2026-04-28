import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { useFinance } from "@/hooks/use-finance";
import { useProfile } from "@/hooks/use-profile";
import { MonthProgressBar } from "@/components/finance/MonthProgressBar";
import { Timeline } from "@/components/finance/Timeline";
import {
  QuickActionFab,
  type QuickActionFabHandle,
} from "@/components/finance/QuickActionFab";
import { FixedManager } from "@/components/finance/FixedManager";
import { StatCards } from "@/components/finance/StatCards";
import { CategoryChart } from "@/components/finance/CategoryChart";
import { Onboarding } from "@/components/finance/Onboarding";
import { UpdatePrompt } from "@/components/finance/UpdatePrompt";
import { ProfileSheet } from "@/components/finance/ProfileSheet";
import { EditTransactionSheet } from "@/components/finance/EditTransactionSheet";
import { BiometricGate } from "@/components/finance/BiometricGate";
import { CloudStatusBanner } from "@/components/finance/CloudStatusBanner";
import { PendingSyncSheet } from "@/components/finance/PendingSyncSheet";
import type { Transaction } from "@/lib/finance-data";

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
  const {
    transactions,
    addTransaction,
    markPaid,
    removeTransaction,
    updateTransaction,
    replaceAllTransactions,
    stats,
    hydrated,
    onboarded,
    completeOnboarding,
  } = useFinance();
  const { profile, updateProfile } = useProfile();
  const [tab, setTab] = useState<"timeline" | "fixed" | "categories">("timeline");
  const [profileOpen, setProfileOpen] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const fabRef = useRef<QuickActionFabHandle>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (stats.atypical) root.classList.add("theme-warning");
    else root.classList.remove("theme-warning");
  }, [stats.atypical]);

  if (!hydrated) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!onboarded) {
    return (
      <BiometricGate>
        <UpdatePrompt />
        <Onboarding
          income={stats.incomePaid + stats.incomePending}
          expenses={stats.fixedPaid + stats.fixedPending + stats.variablePaid}
          dailyFree={stats.dailyFree}
          daysLeft={stats.daysLeft}
          onStart={completeOnboarding}
          onAddIncome={() => {
            completeOnboarding();
            setTimeout(() => fabRef.current?.open("income"), 50);
          }}
          onAddExpense={() => {
            completeOnboarding();
            setTimeout(() => fabRef.current?.open("expense"), 50);
          }}
        />
      </BiometricGate>
    );
  }

  return (
    <BiometricGate>
      <UpdatePrompt />
      <main
        className="mx-auto min-h-screen w-full max-w-2xl px-4 sm:px-5"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 9.5rem)",
        }}
      >
        <header className="mb-6 flex items-center justify-between gap-3 sm:mb-8">
          <button
            onClick={() => setProfileOpen(true)}
            className="group flex min-w-0 items-center gap-3 rounded-2xl px-1 py-1 -ml-1 transition active:scale-[0.98]"
            aria-label="Abrir perfil"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-xl shadow-glow">
              <span aria-hidden>{profile.avatar}</span>
            </div>
            <div className="min-w-0 text-left">
              <div className="flex items-center gap-1">
                <h1 className="truncate text-sm font-semibold tracking-tight">
                  Olá, {profile.name}
                </h1>
                <ChevronDown
                  size={14}
                  className="shrink-0 text-muted-foreground transition group-hover:text-foreground"
                />
              </div>
              <p className="truncate text-xs text-muted-foreground">Suas finanças em movimento</p>
            </div>
          </button>
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

        <CloudStatusBanner onOpenPending={() => setPendingOpen(true)} />

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

        <section className="mt-8">
          <div className="mb-5 flex w-full rounded-2xl bg-muted/40 p-1 ring-1 ring-border">
            {(
              [
                { k: "timeline", label: "Timeline", short: "Timeline" },
                { k: "fixed", label: "Fixos", short: "Fixos" },
                { k: "categories", label: "Categorias", short: "Categorias" },
              ] as const
            ).map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`relative flex-1 rounded-xl px-3 py-2 text-xs font-medium transition ${
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
                  {t.short}
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "timeline" && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Timeline
                  transactions={transactions}
                  onRemove={removeTransaction}
                  onEdit={setEditing}
                />
              </motion.div>
            )}
            {tab === "fixed" && (
              <motion.div
                key="fixed"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <FixedManager
                  transactions={transactions}
                  onConfirm={markPaid}
                  onRemove={removeTransaction}
                />
              </motion.div>
            )}
            {tab === "categories" && (
              <motion.div
                key="categories"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <CategoryChart transactions={transactions} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      <QuickActionFab
        ref={fabRef}
        warning={stats.atypical}
        onQuickAdd={(category, amount, title) =>
          addTransaction({ title, amount, category, kind: "variable" })
        }
        onAddIncome={(amount, title) =>
          addTransaction({ title, amount, category: "income", kind: "income" })
        }
      />

      <ProfileSheet
        open={profileOpen}
        onOpenChange={setProfileOpen}
        profile={profile}
        onUpdate={updateProfile}
        transactions={transactions}
        onImportTransactions={replaceAllTransactions}
      />

      <EditTransactionSheet
        tx={editing}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        onSave={updateTransaction}
      />
    </BiometricGate>
  );
}
