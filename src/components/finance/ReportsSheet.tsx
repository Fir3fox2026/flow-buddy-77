import { Download, FileText, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { formatBRL } from "@/lib/finance-data";
import type { MonthlyReport } from "@/hooks/use-month-close";

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function formatMonthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

interface ReportsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reports: MonthlyReport[];
}

function exportReport(r: MonthlyReport) {
  const data = {
    version: 1,
    month: r.month,
    salary: r.salary,
    total_income: r.total_income,
    total_fixed: r.total_fixed,
    total_variable: r.total_variable,
    balance: r.balance,
    closed_at: r.closed_at,
    transactions: r.snapshot,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fluxo-${r.month}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Relatório de ${formatMonthLabel(r.month)} exportado`);
}

export function ReportsSheet({ open, onOpenChange, reports }: ReportsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-3xl border-border bg-background"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)" }}
      >
        <SheetHeader className="text-left">
          <SheetTitle>Histórico de meses</SheetTitle>
          <SheetDescription>
            Resumos dos meses que você fechou. Toque em exportar para baixar o JSON.
          </SheetDescription>
        </SheetHeader>

        {reports.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl bg-muted/40 p-8 text-center ring-1 ring-border">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold">Nenhum mês fechado ainda</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Quando virar o mês, vou perguntar se você quer fechá-lo e salvar aqui.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {reports.map((r) => {
              const positive = r.balance >= 0;
              return (
                <div
                  key={r.id}
                  className="rounded-2xl bg-gradient-card p-4 ring-1 ring-border"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{formatMonthLabel(r.month)}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Fechado em{" "}
                        {new Date(r.closed_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => exportReport(r)}
                      className="flex h-9 items-center gap-1.5 rounded-xl bg-muted/50 px-3 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      aria-label="Exportar mês"
                    >
                      <Download size={13} />
                      Exportar
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    <div className="rounded-xl bg-success/10 p-2 ring-1 ring-success/30">
                      <div className="flex items-center gap-1 text-success">
                        <TrendingUp size={11} />
                        <span className="text-[9px] font-semibold uppercase tracking-wider">
                          Receita
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs font-semibold">
                        {formatBRL(r.total_income)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-destructive/10 p-2 ring-1 ring-destructive/30">
                      <div className="flex items-center gap-1 text-destructive">
                        <TrendingDown size={11} />
                        <span className="text-[9px] font-semibold uppercase tracking-wider">
                          Gastos
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs font-semibold">
                        {formatBRL(r.total_fixed + r.total_variable)}
                      </p>
                    </div>
                    <div
                      className={`rounded-xl p-2 ring-1 ${
                        positive
                          ? "bg-primary/10 ring-primary/30"
                          : "bg-warning/10 ring-warning/30"
                      }`}
                    >
                      <div
                        className={`flex items-center gap-1 ${
                          positive ? "text-primary" : "text-warning"
                        }`}
                      >
                        <Wallet size={11} />
                        <span className="text-[9px] font-semibold uppercase tracking-wider">
                          Saldo
                        </span>
                      </div>
                      <p
                        className={`mt-0.5 truncate text-xs font-bold ${
                          positive ? "text-success" : "text-destructive"
                        }`}
                      >
                        {formatBRL(r.balance)}
                      </p>
                    </div>
                  </div>

                  {r.salary > 0 && (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Salário registrado: {formatBRL(r.salary)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
