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
    const baseHost = u.hostname.replace(/^www\./, "");
    const allow = new Set<string>([
      `${u.protocol}//${u.hostname}`,            // e.g. https://zkproofport.com
      `${u.protocol}//www.${baseHost}`,          // e.g. https://www.zkproofport.com
    ]);

    const nonce = crypto.randomUUID();
    const finalUrl =
      `${portalUrl}?sdk=1&circuit=${encodeURIComponent(circuit)}` +
      `&origin=${encodeURIComponent(origin)}&nonce=${nonce}`;

    const tab = window.open(finalUrl, "_blank");
    if (!tab) return reject(new Error("Popup blocked"));
    try { tab.focus(); } catch {}

    const timer = setTimeout(() => {
      window.removeEventListener("message", onMsg);
      reject(new Error("Timed out waiting for proof"));
    }, timeoutMs);

    function onMsg(e: MessageEvent) {
      if (e.source !== tab) return;

      if (!allow.has(e.origin)) {
        return;
      }

      const { type, proof, publicInputs, meta } = e.data || {};
      if (type !== "zk-coinbase-proof" && type !== "zkproofport-proof") return;

      clearTimeout(timer);
      window.removeEventListener("message", onMsg);
      resolve({ proof, publicInputs, meta });
    }

    window.addEventListener("message", onMsg);
  });
}
