import { MESSAGE_TYPE, PROOF_PORTAL_URL } from "./constants";

export type OpenPortalParams = {
  circuit?: string; 
  portalUrl?: string; 
  origin?: string;    
  timeoutMs?: number; 
};

export function openZkKycPopup({
  circuit,
  portalUrl = PROOF_PORTAL_URL,
  origin = window.location.origin,
  timeoutMs = 120_000,
}: OpenPortalParams = {}): Promise<{
  proof: string;
  publicInputs: string[];
  meta: any;
}> {
  return new Promise((resolve, reject) => {
    const nonce = crypto.randomUUID();
    const url =
      `${portalUrl}?origin=${encodeURIComponent(origin)}&nonce=${nonce}` +
      (circuit ? `&circuit=${encodeURIComponent(circuit)}` : "");

    const tab = window.open(url, "_blank");
    if (!tab) return reject(new Error("Popup blocked"));

    const timer = setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(new Error("Timed out waiting for proof"));
    }, timeoutMs);

    function handler(event: MessageEvent) {
      const { type, proof, publicInputs, meta } = event.data || {};
      if (type !== MESSAGE_TYPE) return;

      clearTimeout(timer);
      window.removeEventListener("message", handler);
      resolve({ proof, publicInputs, meta });
    }

    window.addEventListener("message", handler);
  });
}

export const openPortal = openZkKycPopup;
