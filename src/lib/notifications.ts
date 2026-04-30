// Local PWA notifications — uses the Notifications API directly.
// No server push: all checks run client-side and are scheduled while the app
// is open (or when the SW catches a periodic check, in the future).

export type NotificationKind =
  | "due-bills"
  | "weekly-summary"
  | "atypical-spend"
  | "log-reminder";

const PREF_KEY = "fluxo:notif-prefs:v1";
const LAST_FIRED_KEY = "fluxo:notif-last:v1";

export interface NotifPrefs {
  enabled: boolean;
  dueBills: boolean;
  weeklySummary: boolean;
  atypical: boolean;
  logReminder: boolean;
}

export const DEFAULT_PREFS: NotifPrefs = {
  enabled: false,
  dueBills: true,
  weeklySummary: true,
  atypical: true,
  logReminder: true,
};

export function isNotifSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getPermission(): NotificationPermission {
  if (!isNotifSupported()) return "denied";
  return Notification.permission;
}

export function loadPrefs(): NotifPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREF_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<NotifPrefs>) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: NotifPrefs): void {
  try {
    window.localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent("fluxo:notif-prefs-changed"));
  } catch {
    /* ignore */
  }
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!isNotifSupported()) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

function loadLastFired(): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(LAST_FIRED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function saveLastFired(map: Record<string, number>): void {
  try {
    window.localStorage.setItem(LAST_FIRED_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/** Returns true if the dedupe key has NOT fired in the last `windowMs`. */
export function shouldFire(key: string, windowMs: number): boolean {
  const map = loadLastFired();
  const last = map[key] ?? 0;
  return Date.now() - last >= windowMs;
}

export function markFired(key: string): void {
  const map = loadLastFired();
  map[key] = Date.now();
  saveLastFired(map);
}

export interface NotifyOptions {
  title: string;
  body: string;
  tag?: string;
  /** Dedupe key + minimum interval (ms) before the same key can fire again. */
  dedupeKey?: string;
  dedupeWindowMs?: number;
}

export async function notify(opts: NotifyOptions): Promise<boolean> {
  if (!isNotifSupported()) return false;
  if (Notification.permission !== "granted") return false;
  if (opts.dedupeKey && opts.dedupeWindowMs) {
    if (!shouldFire(opts.dedupeKey, opts.dedupeWindowMs)) return false;
  }

  try {
    // Prefer the SW so notifications survive page close on installed PWAs.
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(opts.title, {
          body: opts.body,
          icon: "/icon-512.png",
          badge: "/icon-512.png",
          tag: opts.tag,
        });
        if (opts.dedupeKey) markFired(opts.dedupeKey);
        return true;
      }
    }
    new Notification(opts.title, {
      body: opts.body,
      icon: "/icon-512.png",
      tag: opts.tag,
    });
    if (opts.dedupeKey) markFired(opts.dedupeKey);
    return true;
  } catch {
    return false;
  }
}
