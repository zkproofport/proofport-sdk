export type OpenPortalParams = {
  circuit: string;                          // e.g. "coinbase_kyc"
  portalUrl?: string;                       // default: https://zkproofport.com/portal
  origin?: string;                          // default: window.location.origin
  timeoutMs?: number;                       // default: 120_000
  width?: number; height?: number;
};

/**
 * Opens zkProofport portal in a popup and resolves with proof payload.
 * Performs strict origin checking based on portalUrl.
 */
export function openPortal({
  circuit,
  portalUrl = "https://zkproofport.com/portal",
  origin = window.location.origin,
  timeoutMs = 120000,
  width = 980,
  height = 720
}: OpenPortalParams): Promise<{ proof: string; publicInputs: string[]; meta: any }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(portalUrl);
    const nonce = crypto.randomUUID();
    const portal = `${portalUrl}?sdk=1&circuit=${encodeURIComponent(circuit)}&origin=${encodeURIComponent(origin)}&nonce=${nonce}`;

    const features = `width=${width},height=${height},popup=yes,noopener=yes,noreferrer=yes`;
    const popup = window.open(portal, "zkproofport", features);
    if (!popup) return reject(new Error("Popup blocked"));

    const timer = setTimeout(() => {
      window.removeEventListener("message", onMsg);
      reject(new Error("Timed out waiting for proof"));
    }, timeoutMs);

    function onMsg(e: MessageEvent) {
      // strict origin check
      const allowedOrigin = `${urlObj.protocol}//${urlObj.host}`;
      if (e.origin !== allowedOrigin) return;

      const { type, proof, publicInputs, meta } = e.data || {};
      if (type !== "zkproofport-proof") return;

      clearTimeout(timer);
      window.removeEventListener("message", onMsg);
      resolve({ proof, publicInputs, meta });
    }

    window.addEventListener("message", onMsg);
  });
}
