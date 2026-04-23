import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { registerPwa } from "@/lib/pwa";

export function UpdatePrompt() {
  const [updateFn, setUpdateFn] = useState<null | (() => Promise<void>)>(null);
  const [updating, setUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    registerPwa({
      onNeedRefresh: (update) => {
        setUpdateFn(() => update);
        setDismissed(false);
      },
      onOfflineReady: () => {
        // Could show a "ready offline" toast — keeping minimal for now.
      },
    });
  }, []);

  const visible = !!updateFn && !dismissed;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 26 }}
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
          className="fixed left-1/2 z-[60] w-[min(94vw,420px)] -translate-x-1/2 rounded-2xl bg-gradient-card p-3 shadow-elegant ring-1 ring-primary/30"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
              <RefreshCw size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Nova versão disponível</p>
              <p className="text-xs text-muted-foreground">
                Atualize para ver as melhorias mais recentes.
              </p>
            </div>
            <button
              onClick={async () => {
                if (!updateFn || updating) return;
                setUpdating(true);
                await updateFn();
              }}
              disabled={updating}
              className="rounded-xl bg-gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-glow transition active:scale-95 disabled:opacity-60"
            >
              {updating ? "Atualizando…" : "Atualizar"}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Dispensar"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
