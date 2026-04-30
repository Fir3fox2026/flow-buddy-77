import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import {
  isNotifSupported,
  getPermission,
  requestPermission,
  loadPrefs,
  savePrefs,
  type NotifPrefs,
} from "@/lib/notifications";

const ITEMS: Array<{ key: keyof Omit<NotifPrefs, "enabled">; label: string; desc: string }> = [
  { key: "dueBills", label: "Contas a vencer", desc: "Aviso 3 dias antes do vencimento" },
  { key: "weeklySummary", label: "Resumo semanal", desc: "Domingo à noite" },
  { key: "atypical", label: "Gasto atípico", desc: "Quando o dia foge da sua média" },
  { key: "logReminder", label: "Lembrete diário", desc: "À noite, se você ainda não registrou nada" },
];

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotifPrefs>(() => loadPrefs());
  const [perm, setPerm] = useState<NotificationPermission>("default");
  const supported = isNotifSupported();

  useEffect(() => {
    setPerm(getPermission());
    const onChange = () => setPrefs(loadPrefs());
    window.addEventListener("fluxo:notif-prefs-changed", onChange);
    return () => window.removeEventListener("fluxo:notif-prefs-changed", onChange);
  }, []);

  if (!supported) return null;

  const update = (patch: Partial<NotifPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    savePrefs(next);
  };

  async function handleToggleMaster() {
    if (prefs.enabled) {
      update({ enabled: false });
      toast.success("Notificações desativadas");
      return;
    }
    let p = perm;
    if (p === "default") p = await requestPermission();
    setPerm(p);
    if (p !== "granted") {
      toast.error("Permissão de notificações negada pelo navegador");
      return;
    }
    update({ enabled: true });
    toast.success("Notificações ativadas");
  }

  return (
    <section className="mt-6">
      <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        Notificações
      </p>
      <button
        onClick={handleToggleMaster}
        className={`flex w-full items-center gap-3 rounded-2xl p-4 text-left ring-1 transition ${
          prefs.enabled
            ? "bg-primary/10 ring-primary/40"
            : "bg-muted/40 ring-border hover:bg-muted/60"
        }`}
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${
            prefs.enabled
              ? "bg-primary/20 text-primary ring-primary/30"
              : "bg-muted text-muted-foreground ring-border"
          }`}
        >
          {prefs.enabled ? <Bell size={18} /> : <BellOff size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {prefs.enabled ? "Notificações ativadas" : "Ativar notificações"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {perm === "denied"
              ? "Bloqueadas no navegador — habilite nas configurações do site"
              : prefs.enabled
                ? "Você receberá lembretes importantes"
                : "Lembretes de contas, gastos e mais"}
          </p>
        </div>
        <div
          className={`relative h-6 w-10 shrink-0 rounded-full transition ${
            prefs.enabled ? "bg-primary" : "bg-muted-foreground/30"
          }`}
        >
          <motion.span
            className="absolute top-0.5 h-5 w-5 rounded-full bg-background"
            animate={{ left: prefs.enabled ? "1.125rem" : "0.125rem" }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {prefs.enabled && (
          <motion.div
            key="notif-items"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-2 rounded-2xl bg-muted/30 p-2 ring-1 ring-border">
              {ITEMS.map((item) => {
                const active = prefs[item.key];
                return (
                  <button
                    key={item.key}
                    onClick={() => update({ [item.key]: !active } as Partial<NotifPrefs>)}
                    className="flex w-full items-center gap-3 rounded-xl bg-background/40 p-3 text-left transition hover:bg-background/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold">{item.label}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <div
                      className={`relative h-5 w-9 shrink-0 rounded-full transition ${
                        active ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                    >
                      <motion.span
                        className="absolute top-0.5 h-4 w-4 rounded-full bg-background"
                        animate={{ left: active ? "1.125rem" : "0.125rem" }}
                        transition={{ type: "spring", stiffness: 320, damping: 26 }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
