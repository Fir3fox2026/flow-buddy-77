import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link2, ChevronRight, Check, Pencil } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { Profile } from "@/hooks/use-profile";

const AVATAR_OPTIONS = ["🌊", "🚀", "🌸", "🦊", "🐢", "🦄", "🌟", "🍀", "🔥", "🐳", "🍉", "🪐"];

interface ProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
  onUpdate: (patch: Partial<Profile>) => void;
}

export function ProfileSheet({ open, onOpenChange, profile, onUpdate }: ProfileSheetProps) {
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [editingName, setEditingName] = useState(false);

  useEffect(() => {
    if (open) {
      setName(profile.name);
      setAvatar(profile.avatar);
      setEditingName(false);
    }
  }, [open, profile.name, profile.avatar]);

  const commit = (patch: Partial<Profile>) => onUpdate(patch);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-border bg-background"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)" }}
      >
        <SheetHeader className="text-left">
          <SheetTitle>Perfil</SheetTitle>
          <SheetDescription>Personalize seu nome e avatar.</SheetDescription>
        </SheetHeader>

        {/* Avatar + name */}
        <section className="mt-5 flex items-center gap-4">
          <motion.div
            key={avatar}
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 20 }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary text-3xl shadow-glow"
          >
            <span aria-hidden>{avatar}</span>
          </motion.div>
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
            <p className="mt-0.5 text-xs text-muted-foreground">Toque no nome para editar</p>
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

        {/* Open Finance placeholder */}
        <section className="mt-6">
          <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            Conexões
          </p>
          <button
            disabled
            className="flex w-full items-center gap-3 rounded-2xl bg-muted/30 p-4 text-left ring-1 ring-border opacity-80"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
              <Link2 size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold">Conectar contas e cartões</p>
                <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-warning ring-1 ring-warning/30">
                  Em breve
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                Sincronize via Open Finance
              </p>
            </div>
            <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
          </button>
        </section>
      </SheetContent>
    </Sheet>
  );
}
