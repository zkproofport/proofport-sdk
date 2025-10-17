export type OpenPortalParams = {
  circuit: string;                    // e.g. "coinbase_kyc"
  portalUrl?: string;                 // default: https://zkproofport.com/portal
  origin?: string;                    // default: window.location.origin
  timeoutMs?: number;                 // default: 120_000
};

export function openPortal({
  circuit,
  portalUrl = "https://zkproofport.com/portal",
  origin = window.location.origin,
  timeoutMs = 120_000,
}: OpenPortalParams): Promise<{ proof: string; publicInputs: string[]; meta: any }> {
  return new Promise((resolve, reject) => {
    const u = new URL(portalUrl);
    const nonce = crypto.randomUUID();
    const finalUrl =
      `${portalUrl}?sdk=1&circuit=${encodeURIComponent(circuit)}` +
      `&origin=${encodeURIComponent(origin)}&nonce=${nonce}`;

    const tab = window.open(finalUrl, "_blank");
    if (!tab) return reject(new Error("Popup blocked"));
    try { tab.focus(); } catch {}
    (window as any).__zk_tab = tab;

    const timer = setTimeout(() => {
      window.removeEventListener("message", onMsg);
      console.warn("[SDK] Timeout waiting for proof");
      reject(new Error("Timed out waiting for proof"));
    }, timeoutMs);

    function onMsg(e: MessageEvent) {
      if (e.source !== tab) return;

      console.log("[SDK] got message", { origin: e.origin, type: e.data?.type, data: e.data });

      const { type, proof, publicInputs, meta } = e.data || {};
      if (type !== "zk-coinbase-proof" && type !== "zkproofport-proof") return;

      clearTimeout(timer);
      window.removeEventListener("message", onMsg);
      resolve({ proof, publicInputs, meta });
    }

    window.addEventListener("message", onMsg);
  });
}

