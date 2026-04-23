// PWA service worker registration with safety guards for Lovable preview/iframe.
// Returns an updater function the UI can call when the user accepts the update.

export type PwaUpdateHandlers = {
  onNeedRefresh: (update: () => Promise<void>) => void;
  onOfflineReady: () => void;
};

function isUnsafeContext(): boolean {
  if (typeof window === "undefined") return true;

  // Inside an iframe? Lovable preview runs in one and SWs misbehave there.
  let inIframe = false;
  try {
    inIframe = window.self !== window.top;
  } catch {
    inIframe = true; // cross-origin block ⇒ assume iframe
  }

  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") ||
    host.includes("lovableproject.com") ||
    host.includes("lovable.app") === false && host.includes("lovable") === true;

  return inIframe || isPreviewHost;
}

export async function registerPwa(handlers: PwaUpdateHandlers): Promise<void> {
  if (typeof window === "undefined") return;

  // In any preview/iframe context, proactively unregister and skip.
  if (isUnsafeContext()) {
    if ("serviceWorker" in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      } catch {
        /* ignore */
      }
    }
    return;
  }

  if (!("serviceWorker" in navigator)) return;

  try {
    // Dynamic import so vite-plugin-pwa virtual module is only pulled in when used.
    const { registerSW } = await import("virtual:pwa-register");
    const updateSW = registerSW({
      onNeedRefresh() {
        handlers.onNeedRefresh(async () => {
          await updateSW(true);
        });
      },
      onOfflineReady() {
        handlers.onOfflineReady();
      },
    });
  } catch {
    // virtual module unavailable (e.g. dev build) — silently no-op
  }
}
