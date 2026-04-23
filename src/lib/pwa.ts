// Manual PWA service worker registration with safety guards for Lovable preview/iframe.
// Why manual: vite-plugin-pwa does not reliably emit a sw.js into the client bundle
// when used with the Lovable TanStack Start config (multi-environment build), so we
// ship a hand-written /public/sw.js and register it ourselves.

export type PwaUpdateHandlers = {
  onNeedRefresh: (update: () => Promise<void>) => void;
  onOfflineReady: () => void;
};

function isUnsafeContext(): boolean {
  if (typeof window === "undefined") return true;

  let inIframe = false;
  try {
    inIframe = window.self !== window.top;
  } catch {
    inIframe = true; // cross-origin block ⇒ assume iframe
  }

  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") || host.includes("lovableproject.com");

  return inIframe || isPreviewHost;
}

async function unregisterAll(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  } catch {
    /* ignore */
  }
}

export async function registerPwa(handlers: PwaUpdateHandlers): Promise<void> {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  // Skip and proactively clean up in unsafe contexts (Lovable preview, iframes).
  if (isUnsafeContext()) {
    await unregisterAll();
    return;
  }

  // Skip in dev — keeps HMR clean. Production builds set import.meta.env.PROD = true.
  if (!import.meta.env.PROD) return;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    // If a worker is already waiting (user opened the app and a new SW had been
    // installed in a previous session), surface the update prompt immediately.
    if (registration.waiting) {
      handlers.onNeedRefresh(() => activateWaiting(registration));
    }

    if (registration.active && !navigator.serviceWorker.controller) {
      handlers.onOfflineReady();
    }

    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;
      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed") {
          if (navigator.serviceWorker.controller) {
            handlers.onNeedRefresh(() => activateWaiting(registration));
          } else {
            handlers.onOfflineReady();
          }
        }
      });
    });

    // Reload exactly once when the new SW takes control.
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });

    // Periodically check for updates so the prompt can appear without a manual reload.
    setInterval(() => {
      registration.update().catch(() => undefined);
    }, 60 * 60 * 1000);
  } catch {
    /* registration failed — silently no-op */
  }
}

async function activateWaiting(registration: ServiceWorkerRegistration): Promise<void> {
  const waiting = registration.waiting;
  if (!waiting) return;
  waiting.postMessage({ type: "SKIP_WAITING" });
}
