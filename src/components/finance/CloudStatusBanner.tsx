import { motion, AnimatePresence } from "framer-motion";
import { CloudOff, WifiOff, CloudUpload } from "lucide-react";
import { useCloudStatus } from "@/hooks/use-cloud-status";

interface Props {
  onOpenPending: () => void;
}

export function CloudStatusBanner({ onOpenPending }: Props) {
  const { status, pendingCount, online, authHydrated } = useCloudStatus();

  if (!authHydrated) return null;
  // Only show when there's something to communicate
  const showOffline = status === "offline";
  const showPending = pendingCount > 0;
  if (!showOffline && !showPending) return null;

  const isOffline = showOffline;
  const label = !online
    ? "Sem conexão — alterações ficam salvas no aparelho"
    : status === "offline"
      ? "Cloud indisponível — tentando reconectar"
      : `${pendingCount} ${pendingCount === 1 ? "alteração pendente" : "alterações pendentes"} para sincronizar`;

  const Icon = !online ? WifiOff : isOffline ? CloudOff : CloudUpload;

  return (
    <AnimatePresence>
      <motion.button
        key={`${status}-${pendingCount}`}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        onClick={onOpenPending}
        className={`mb-4 flex w-full items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-left text-xs ring-1 transition active:scale-[0.99] ${
          isOffline
            ? "bg-warning/10 text-warning ring-warning/30"
            : "bg-primary/10 text-primary ring-primary/30"
        }`}
        aria-label="Ver detalhes da sincronização"
      >
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
            isOffline ? "bg-warning/20" : "bg-primary/20"
          }`}
        >
          <Icon size={14} />
        </div>
        <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
        {pendingCount > 0 && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isOffline ? "bg-warning text-warning-foreground" : "bg-primary text-primary-foreground"
            }`}
          >
            {pendingCount}
          </span>
        )}
      </motion.button>
    </AnimatePresence>
  );
}
