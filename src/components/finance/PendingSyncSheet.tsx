import { CloudOff, CloudUpload, Plus, Pencil, Trash2, Wifi, WifiOff } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useCloudStatus, type PendingOp } from "@/hooks/use-cloud-status";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
};

const opMeta = (op: PendingOp) => {
  if (op.type === "upsert") {
    return {
      icon: Plus,
      color: "text-success bg-success/15",
      label: "Novo lançamento",
      detail: `${op.tx.title} · R$ ${op.tx.amount.toFixed(2)}`,
    };
  }
  if (op.type === "update") {
    return {
      icon: Pencil,
      color: "text-primary bg-primary/15",
      label: "Alteração",
      detail: Object.keys(op.patch).join(", ") || "atualização",
    };
  }
  return {
    icon: Trash2,
    color: "text-destructive bg-destructive/15",
    label: "Exclusão",
    detail: op.title ?? op.id,
  };
};

export function PendingSyncSheet({ open, onOpenChange }: Props) {
  const { pending, status, online, user } = useCloudStatus();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto rounded-t-3xl border-border bg-background"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)" }}
      >
        <SheetHeader className="text-left">
          <SheetTitle>Sincronização pendente</SheetTitle>
          <SheetDescription>
            {pending.length === 0
              ? "Tudo sincronizado com a nuvem."
              : `${pending.length} ${pending.length === 1 ? "alteração aguardando" : "alterações aguardando"} envio.`}
          </SheetDescription>
        </SheetHeader>

        {/* Status pill */}
        <div
          className={`mt-5 flex items-center gap-3 rounded-2xl p-4 ring-1 ${
            status === "connected"
              ? "bg-success/10 ring-success/30"
              : status === "signed-out"
                ? "bg-muted/40 ring-border"
                : "bg-warning/10 ring-warning/30"
          }`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              status === "connected"
                ? "bg-success/20 text-success"
                : status === "signed-out"
                  ? "bg-muted text-muted-foreground"
                  : "bg-warning/20 text-warning"
            }`}
          >
            {status === "connected" ? (
              <Wifi size={18} />
            ) : !online ? (
              <WifiOff size={18} />
            ) : (
              <CloudOff size={18} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {status === "connected"
                ? "Conectado à nuvem"
                : status === "signed-out"
                  ? "Não conectado"
                  : !online
                    ? "Sem conexão"
                    : "Cloud indisponível"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {status === "connected"
                ? user?.email ?? "Sincronizando em tempo real"
                : status === "signed-out"
                  ? "Entre com Google no perfil para sincronizar"
                  : "Tudo está salvo localmente — vai sincronizar quando voltar"}
            </p>
          </div>
        </div>

        {/* Pending list */}
        {pending.length > 0 && (
          <section className="mt-5">
            <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              Fila de envio
            </p>
            <ul className="space-y-2">
              {pending
                .slice()
                .reverse()
                .map((op, i) => {
                  const meta = opMeta(op);
                  const Icon = meta.icon;
                  return (
                    <li
                      key={`${op.queuedAt}-${i}`}
                      className="flex items-center gap-3 rounded-2xl bg-muted/30 p-3 ring-1 ring-border"
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.color}`}
                      >
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{meta.label}</p>
                        <p className="truncate text-xs text-muted-foreground">{meta.detail}</p>
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {formatRelative(op.queuedAt)}
                      </span>
                    </li>
                  );
                })}
            </ul>
          </section>
        )}

        {pending.length === 0 && status === "connected" && (
          <div className="mt-5 flex flex-col items-center gap-2 rounded-2xl bg-muted/20 p-8 text-center ring-1 ring-border">
            <CloudUpload size={28} className="text-success" />
            <p className="text-sm font-medium">Tudo em dia</p>
            <p className="text-xs text-muted-foreground">
              Nenhuma alteração esperando para subir.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
