import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Pencil,
  Download,
  Upload,
  Fingerprint,
  LogIn,
  LogOut,
  Cloud,
  CloudOff,
  Sun,
  Moon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import { toast } from "sonner";
import type { Profile } from "@/hooks/use-profile";
import type { Transaction } from "@/lib/finance-data";
import { useAuth } from "@/hooks/use-auth";
import {
  isBiometricSupported,
  isLockEnabled,
  enableBiometricLock,
  disableBiometricLock,
} from "@/lib/biometric";

const AVATAR_OPTIONS = ["🌊", "🚀", "🌸", "🦊", "🐢", "🦄", "🌟", "🍀", "🔥", "🐳", "🍉", "🪐"];

interface ProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
  onUpdate: (patch: Partial<Profile>) => void;
  transactions: Transaction[];
  onImportTransactions: (next: Transaction[]) => void | Promise<void>;
  theme: "light" | "dark";
  onToggleTheme: (origin?: { x: number; y: number }) => void;
}

export function ProfileSheet({
  open,
  onOpenChange,
  profile,
  onUpdate,
  transactions,
  onImportTransactions,
  theme,
  onToggleTheme,
}: ProfileSheetProps) {
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [editingName, setEditingName] = useState(false);
  const [pickingAvatar, setPickingAvatar] = useState(false);
  const [biometricOn, setBiometricOn] = useState(false);
  const [pendingImport, setPendingImport] = useState<Transaction[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, signInWithGoogle, signOut } = useAuth();

  useEffect(() => {
    if (open) {
      setName(profile.name);
      setAvatar(profile.avatar);
      setEditingName(false);
      setPickingAvatar(false);
      setBiometricOn(isLockEnabled());
    }
  }, [open, profile.name, profile.avatar]);

  function handleExport() {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile,
      transactions,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fluxo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exportado");
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const txs = Array.isArray(parsed.transactions) ? (parsed.transactions as Transaction[]) : null;
        if (!txs) throw new Error("Arquivo inválido");
        // basic validation
        const ok = txs.every(
          (t) =>
            typeof t.id === "string" &&
            typeof t.title === "string" &&
            typeof t.amount === "number" &&
            ["income", "fixed", "variable"].includes(t.kind),
        );
        if (!ok) throw new Error("Formato inválido");
        setPendingImport(txs);
      } catch {
        toast.error("Não foi possível ler o arquivo. Verifique se é um backup válido.");
      }
    };
    reader.readAsText(file);
  }

  async function confirmImport() {
    if (!pendingImport) return;
    await onImportTransactions(pendingImport);
    setPendingImport(null);
    toast.success(`${pendingImport.length} lançamentos importados`);
  }

  async function toggleBiometric() {
    if (biometricOn) {
      disableBiometricLock();
      setBiometricOn(false);
      toast.success("Biometria desativada");
      return;
    }
    try {
      const ok = await enableBiometricLock(user?.email ?? profile.name);
      if (ok) {
        setBiometricOn(true);
        toast.success("Biometria ativada — será pedida ao abrir o app");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao ativar biometria");
    }
  }

  async function handleSignIn() {
    const result = await signInWithGoogle();
    if (result.error) {
      toast.error("Não foi possível entrar com Google");
    }
  }

  async function handleSignOut() {
    await signOut();
    toast.success("Você saiu da conta");
  }

  const commit = (patch: Partial<Profile>) => onUpdate(patch);
  const biometricSupported = typeof window !== "undefined" && isBiometricSupported();

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="max-h-[92vh] overflow-y-auto rounded-t-3xl border-border bg-background"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)" }}
        >
          <SheetHeader className="text-left">
            <SheetTitle>Perfil</SheetTitle>
            <SheetDescription>Personalize, proteja e sincronize seus dados.</SheetDescription>
          </SheetHeader>

          {/* Avatar + name */}
          <section className="mt-5 flex items-center gap-4">
            <motion.button
              type="button"
              onClick={() => setPickingAvatar((v) => !v)}
              key={avatar}
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 20 }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary text-3xl shadow-glow ring-2 ring-transparent transition active:scale-95 data-[active=true]:ring-primary"
              data-active={pickingAvatar}
              aria-label="Trocar avatar"
              aria-expanded={pickingAvatar}
            >
              <span aria-hidden>{avatar}</span>
            </motion.button>
            <div className="min-w-0 flex-1">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 24))}
                    onBlur={() => {
                      setEditingName(false);
                      if (name.trim()) commit({ name: name.trim() });
                      else setName(profile.name);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                    className="w-full rounded-xl bg-muted/40 px-3 py-2 text-base font-semibold outline-none ring-1 ring-border focus:ring-primary"
                    placeholder="Seu nome"
                  />
                  <button
                    onClick={() => {
                      setEditingName(false);
                      if (name.trim()) commit({ name: name.trim() });
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"
                    aria-label="Salvar nome"
                  >
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingName(true)}
                  className="group flex w-full items-center gap-2 text-left"
                >
                  <span className="truncate text-lg font-semibold">{profile.name}</span>
                  <Pencil
                    size={14}
                    className="text-muted-foreground transition group-hover:text-foreground"
                  />
                </button>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground">
                {user ? user.email : "Toque no nome para editar"}
              </p>
            </div>
          </section>

          {/* Avatar picker */}
          <section className="mt-6">
            <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              Escolha seu avatar
            </p>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_OPTIONS.map((emoji) => {
                const active = avatar === emoji;
                return (
                  <button
                    key={emoji}
                    onClick={() => {
                      setAvatar(emoji);
                      commit({ avatar: emoji });
                    }}
                    className={`flex aspect-square items-center justify-center rounded-2xl text-2xl ring-1 transition active:scale-95 ${
                      active
                        ? "bg-primary/15 ring-primary shadow-glow"
                        : "bg-muted/40 ring-border hover:bg-muted/60"
                    }`}
                    aria-label={`Avatar ${emoji}`}
                    aria-pressed={active}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Cloud sync */}
          <section className="mt-6">
            <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              Sincronização na nuvem
            </p>
            {user ? (
              <div className="flex items-center gap-3 rounded-2xl bg-success/10 p-4 ring-1 ring-success/30">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/20 text-success">
                  <Cloud size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Conectado</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex h-9 items-center gap-1.5 rounded-xl bg-muted/50 px-3 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <LogOut size={14} />
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex w-full items-center gap-3 rounded-2xl bg-muted/40 p-4 text-left ring-1 ring-border transition hover:bg-muted/60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
                  <CloudOff size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Entrar com Google</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Sincronize seus dados entre dispositivos
                  </p>
                </div>
                <LogIn size={16} className="shrink-0 text-muted-foreground" />
              </button>
            )}
          </section>

          {/* Biometric lock */}
          {biometricSupported && (
            <section className="mt-6">
              <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                Segurança
              </p>
              <button
                onClick={toggleBiometric}
                className={`flex w-full items-center gap-3 rounded-2xl p-4 text-left ring-1 transition ${
                  biometricOn
                    ? "bg-primary/10 ring-primary/40"
                    : "bg-muted/40 ring-border hover:bg-muted/60"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${
                    biometricOn
                      ? "bg-primary/20 text-primary ring-primary/30"
                      : "bg-muted text-muted-foreground ring-border"
                  }`}
                >
                  <Fingerprint size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {biometricOn ? "Bloqueio ativado" : "Bloquear com Face ID / Touch ID"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {biometricOn
                      ? "Será pedido ao abrir o app"
                      : "Adiciona uma camada extra de proteção"}
                  </p>
                </div>
                <div
                  className={`relative h-6 w-10 shrink-0 rounded-full transition ${
                    biometricOn ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                >
                  <motion.span
                    className="absolute top-0.5 h-5 w-5 rounded-full bg-background"
                    animate={{ left: biometricOn ? "1.125rem" : "0.125rem" }}
                    transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  />
                </div>
              </button>
            </section>
          )}

          {/* Appearance */}
          <section className="mt-6">
            <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              Aparência
            </p>
            <button
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                onToggleTheme({
                  x: rect.left + rect.width / 2,
                  y: rect.top + rect.height / 2,
                });
              }}
              className="flex w-full items-center gap-3 rounded-2xl bg-muted/40 p-4 text-left ring-1 ring-border transition hover:bg-muted/60"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
                {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {theme === "dark" ? "Modo escuro" : "Modo claro"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  Toque para alternar
                </p>
              </div>
              <div
                className={`relative h-6 w-10 shrink-0 rounded-full transition ${
                  theme === "dark" ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <motion.span
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-background"
                  animate={{ left: theme === "dark" ? "1.125rem" : "0.125rem" }}
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                />
              </div>
            </button>
          </section>

          {/* Backup */}
          <section className="mt-6">
            <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              Backup
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 rounded-2xl bg-muted/40 p-3 text-left ring-1 ring-border transition hover:bg-muted/60"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Download size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold">Exportar</p>
                  <p className="truncate text-[10px] text-muted-foreground">JSON completo</p>
                </div>
              </button>
              <button
                onClick={handleImportClick}
                className="flex items-center gap-2 rounded-2xl bg-muted/40 p-3 text-left ring-1 ring-border transition hover:bg-muted/60"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
                  <Upload size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold">Importar</p>
                  <p className="truncate text-[10px] text-muted-foreground">Restaurar backup</p>
                </div>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleFileChange}
            />
          </section>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!pendingImport} onOpenChange={(o) => !o && setPendingImport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Importar backup?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso vai <span className="font-medium text-foreground">substituir</span> todos os{" "}
              {transactions.length} lançamentos atuais por{" "}
              <span className="font-medium text-foreground">{pendingImport?.length}</span> do
              arquivo. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>Importar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
