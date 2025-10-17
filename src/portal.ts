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
      reject(new Error("Timed out waiting for proof"));
    }, timeoutMs);

    function onMsg(e: MessageEvent) {
  // 🔎 디버그 로그 (무조건 보이게)
  console.log("[SDK] message:", {
    origin: e.origin,
    type: e.data?.type,
    hasData: !!e.data,
    keys: e.data ? Object.keys(e.data) : [],
    fromSameWindow: e.source === window,
    fromExpectedTab: e.source === tab,
  });

  // 보낸 탭인지 확인 (다른 postMessage 잡음 필터링)
  if (e.source !== tab) {
    // console.log("[SDK] ignore: not from opened tab");
    return;
  }

  // 타입 통일 체크 (원본은 'zk-coinbase-proof')
  const { type, proof, publicInputs, meta } = e.data || {};
  if (type !== "zk-coinbase-proof" && type !== "zkproofport-proof") {
    // console.log("[SDK] ignore: unexpected type", type);
    return;
  }

  // (개발 중엔 origin 필터 잠시 끔)
  // const allowedOrigin = `${u.protocol}//${u.host}`; // e.g. https://zkproofport.com
  // if (e.origin !== allowedOrigin) {
  //   console.warn("[SDK] origin mismatch", { got: e.origin, allowed: allowedOrigin });
  //   return;
  // }

  clearTimeout(timer);
  window.removeEventListener("message", onMsg);
  console.log("[SDK] ✅ proof received");
  resolve({ proof, publicInputs, meta });
}


    window.addEventListener("message", onMsg);
  });
}

