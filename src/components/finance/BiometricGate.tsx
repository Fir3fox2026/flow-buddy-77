import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Fingerprint, Lock } from "lucide-react";
import { isLockEnabled, isBiometricSupported, verifyBiometric } from "@/lib/biometric";

interface BiometricGateProps {
  children: React.ReactNode;
}

export function BiometricGate({ children }: BiometricGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function unlock() {
    setError(null);
    try {
      const ok = await verifyBiometric();
      if (ok) setUnlocked(true);
      else setError("Não foi possível autenticar. Tente novamente.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao verificar biometria.");
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isLockEnabled() || !isBiometricSupported()) {
      setUnlocked(true);
      setChecking(false);
      return;
    }
    setChecking(false);
    // Auto-prompt on mount
    unlock();
  }, []);

  if (checking) return <div className="min-h-screen bg-background" />;
  if (unlocked) return <>{children}</>;

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6"
      style={{
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 2rem)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2rem)",
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-primary shadow-glow"
      >
        <Lock size={32} className="text-primary-foreground" />
      </motion.div>

      <div className="text-center">
        <h1 className="text-xl font-semibold">Fluxo está bloqueado</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Use Face ID ou Touch ID para acessar suas finanças.
        </p>
      </div>

      {error && (
        <p className="text-center text-xs text-destructive max-w-xs">{error}</p>
      )}

      <button
        onClick={unlock}
        className="flex items-center gap-2 rounded-2xl bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow active:scale-[0.98]"
      >
        <Fingerprint size={18} />
        Desbloquear
      </button>
    </div>
  );
}
