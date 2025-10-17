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
    const finalUrl = `${portalUrl}?sdk=1&circuit=${encodeURIComponent(circuit)}&origin=${encodeURIComponent(origin)}&nonce=${nonce}`;

    // 1) opener 보존 시도 (noopener=no)
    const name = `zkproofport_${nonce}`;
    const features = "noopener=no"; // 일부 브라우저에서 탭에도 적용됨
    const tab = window.open(finalUrl, name, features);
    if (!tab) return reject(new Error("Popup blocked"));
    try { tab.focus(); } catch {}

    // 2) BroadcastChannel 백업 채널
    const ch = new BroadcastChannel(`zkp-${nonce}`);
    const timeout = setTimeout(() => {
      window.removeEventListener("message", onMsg);
      ch.close();
      reject(new Error("Timed out waiting for proof"));
    }, timeoutMs);

    function finish(payload: any) {
      clearTimeout(timeout);
      window.removeEventListener("message", onMsg);
      ch.close();
      resolve(payload);
    }

    // postMessage 수신 (opener 있는 경우)
    function onMsg(e: MessageEvent) {
      // 디버그
      console.log("[SDK] message", {
        origin: e.origin,
        type: e.data?.type,
        fromExpectedTab: e.source === tab,
      });
      if (e.source !== tab) return;
      const { type, proof, publicInputs, meta } = e.data || {};
      if (type !== "zk-coinbase-proof" && type !== "zkproofport-proof") return;
      console.log("[SDK] ✅ proof via postMessage");
      finish({ proof, publicInputs, meta });
    }

    // BroadcastChannel 수신 (opener 없는 경우)
    ch.onmessage = (e) => {
      const { type, proof, publicInputs, meta } = e.data || {};
      if (type !== "zk-coinbase-proof" && type !== "zkproofport-proof") return;
      console.log("[SDK] ✅ proof via BroadcastChannel");
      finish({ proof, publicInputs, meta });
    };

    window.addEventListener("message", onMsg);
  });
}