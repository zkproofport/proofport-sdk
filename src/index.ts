import { verifyProof as internalVerifyProof, verifyOnchain } from "./verifier";
import { validateMetadata } from "./signer";
import { 
  PROOF_PORTAL_URL, 
  ALLOWED_ORIGIN, 
} from "./constants";
import { JsonRpcProvider, ethers } from "ethers";
import { CIRCUIT_REGISTRY } from "./circuits";
import { describePublicInputs } from "./utils";

const DBG = false;
function dbg(...args: any[]) {
  if (DBG) console.log("[ZKPROOFPORT][SDK]", ...args);
}

export type ProofResult =
  | { success: true; proof: string; publicInputs: any }
  | { success: false; error: string };

export async function openProofPortal(options: {
  circuitId: string;
}): Promise<{
  proof: string;
  publicInputs: string[];
  meta: any;
}> {
  const { circuitId } = options;
  if (!circuitId) {
    throw new Error("[SDK] circuitId is required.");
  }

  return new Promise((resolve, reject) => {
    const origin = window.location.origin;
    const nonce = crypto.randomUUID();
    
    const url = `${PROOF_PORTAL_URL}?origin=${encodeURIComponent(origin)}&nonce=${nonce}&circuitId=${encodeURIComponent(circuitId)}`;
    const displayURL = new URL(PROOF_PORTAL_URL).origin + "/portal";

    if (!document.getElementById('zkp-styles')) {
      const style = document.createElement('style');
      style.id = 'zkp-styles';
      style.textContent = `
        :root { --zkp-bg:#0f1115; --zkp-head:#12161f; --zkp-border:rgba(255,255,255,.08); --zkp-fg:#d8e1ff; --zkp-dim:#8a94a7; }
        #zkp-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);backdrop-filter:saturate(140%) blur(4px);z-index:10000;}
        #zkp-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
          width:min(1000px,96vw);height:min(700px,92svh);border-radius:14px;overflow:hidden;
          box-shadow:0 10px 40px rgba(0,0,0,.6), 0 0 0 1px var(--zkp-border);background:var(--zkp-bg);
          display:flex;flex-direction:column;}
        #zkp-header{height:44px;display:flex;align-items:center;gap:10px;background:var(--zkp-head);
          border-bottom:1px solid var(--zkp-border);padding:0 12px;user-select:none}
        #zkp-dot{width:10px;height:10px;border-radius:50%;background:#4ade80;box-shadow:0 0 10px #4ade80aa}
        #zkp-title{font:600 13px/1.1 ui-sans-serif,system-ui;letter-spacing:.2px;color:var(--zkp-fg)}
        #zkp-url{margin-left:6px;font:12px/1.1 ui-monospace,Menlo,monospace;color:var(--zkp-dim);
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:40ch}
        #zkp-actions{margin-left:auto;display:flex;gap:6px}
        #zkp-actions button{appearance:none;border:0;background:#1b2130;color:#cbd5e1;
          padding:6px 9px;border-radius:8px;cursor:pointer;transition:transform .08s ease, opacity .15s}
        #zkp-actions button:hover{transform:translateY(-1px)}
        #zkp-actions button:active{transform:none;opacity:.8}
        #zkp-iframe{border:0;width:100%;height:100%;background:#0a0c10}
        #zkp-modal.fullscreen{top:auto;left:auto;transform:none;inset:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
          width:100svw;height:100svh;border-radius:0}
        @media (max-width:640px){
          #zkp-modal{top:auto;left:auto;transform:none;width:100svw;height:100svh;border-radius:0}
          #zkp-header{padding-top:calc(env(safe-area-inset-top))}
        }
        #zkp-dock{position:fixed;right:16px;bottom:16px;display:none;z-index:10000}
        #zkp-dock.show{display:flex}
        #zkp-dock button{appearance:none;border:0;background:#151a24;color:#dbe4ff;
          padding:10px 14px;border-radius:999px;box-shadow:0 6px 24px rgba(0,0,0,.45);cursor:pointer}
        `;
      document.head.appendChild(style);
    }
    const overlay = document.createElement('div');
    overlay.id = 'zkp-overlay';
    const modal = document.createElement('div');
    modal.id = 'zkp-modal';
    const header = document.createElement('div');
    header.id = 'zkp-header';
    const dot = document.createElement('span');
    dot.id = 'zkp-dot';
    const title = document.createElement('span');
    title.id = 'zkp-title';
    title.textContent = 'zkProofport – Secure Proof Portal';
    const urlSpan = document.createElement('span');
    urlSpan.id = 'zkp-url';
    urlSpan.textContent = displayURL;
    urlSpan.title = displayURL;
    const actions = document.createElement('div');
    actions.id = 'zkp-actions';
    const btnClose = document.createElement('button');
    btnClose.title = 'Close';
    btnClose.textContent = '×';
    const iframe = document.createElement('iframe');
    iframe.id = 'zkp-iframe';
    iframe.src = url;
    iframe.allow = 'cross-origin-isolated; fullscreen; clipboard-read; clipboard-write';
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.referrerPolicy = 'no-referrer';
    iframe.loading = 'eager';
    header.append(dot, title, urlSpan, actions);
    actions.append(btnClose);
    modal.append(header, iframe);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    const dock = document.createElement('div');
    dock.id = 'zkp-dock';
    const dockBtn = document.createElement('button');
    dockBtn.textContent = 'Open zkProofport';
    dock.appendChild(dockBtn);
    document.body.appendChild(dock);
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    const cleanup = (finalize?: () => void) => {
      window.removeEventListener('message', handler);
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = prevOverflow;
      if (document.body.contains(overlay)) overlay.remove();
      if (document.body.contains(dock)) dock.remove();
      finalize?.();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanup(() => reject(new Error('User closed the portal.')));
      }
    };
    window.addEventListener('keydown', onKey);
    btnClose.onclick = () => cleanup(() => reject(new Error('User closed the portal.')));

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out waiting for proof'));
    }, 120000);

    function handler(event: MessageEvent) {
      if (event.origin !== ALLOWED_ORIGIN) return;

      const { type, proof, publicInputs, meta } = event.data || {};
      
      if (type === 'zkp-proof') { 
        clearTimeout(timeout);
        
        if (meta?.circuitId !== circuitId) {
          cleanup(() => reject(new Error(`Circuit ID mismatch: expected ${circuitId}, got ${meta?.circuitId}`)));
          return;
        }
        
        cleanup(() => resolve({ proof, publicInputs, meta }));

      } else if (type === 'zkp-close-request') { 
        clearTimeout(timeout);
        cleanup(() => reject(new Error('User closed the portal.')));
      
      } else if (type === 'zk-coinbase-portal-size') { 
        const h = Math.max(320, Math.min(event.data?.height ?? 0, window.innerHeight * 0.92));
        modal.style.height = `${h}px`;
      }
    }
    window.addEventListener('message', handler);
  });
}

export async function verifyProof({
  proof,
  publicInputs,
  meta,
  mode = "offchain",
  provider,
  verifierAddress,
}: {
  proof: string | Uint8Array | number[];
  publicInputs: any;
  meta: any;
  mode?: "offchain" | "onchain";
  provider?: JsonRpcProvider;
  verifierAddress?: string;
}) {
  try {
    const { circuitId } = meta;
    if (!circuitId) {
      throw new Error("Proof metadata is missing 'circuitId'");
    }

    const config = CIRCUIT_REGISTRY[circuitId];
    if (!config) {
      throw new Error(`Unknown circuitId: ${circuitId}`);
    }

    validateMetadata(meta);
    dbg("meta", meta);

    dbg("publicInputs.shape", describePublicInputs(publicInputs));

    const normalizedPIs = config.normalizePublicInputs(publicInputs);
    dbg("publicInputs.normalized", normalizedPIs);

    const expectedPIs = config.getExpectedPublicInputs(meta);
    dbg("expected", expectedPIs);

    if (normalizedPIs.length !== expectedPIs.length) {
      throw new Error(`Public input length mismatch: expected ${expectedPIs.length}, got ${normalizedPIs.length}`);
    }
    
    for (let i = 0; i < expectedPIs.length; i++) {
      if (normalizedPIs[i] !== expectedPIs[i]) {
        dbg(`MISMATCH: publicInput[${i}]`, {
          received: normalizedPIs[i],
          expected: expectedPIs[i],
        });
        throw new Error(`Public input mismatch at index ${i}. Proof may be invalid or for a different request.`);
      }
    }

    let isValid = false;
    const finalVerifierAddress = verifierAddress || config.verifierAddress;

    if (mode === "offchain") {
      dbg("offchain.verifyProof: using raw publicInputs and config.circuitUrl");
      isValid = await internalVerifyProof(proof as any, publicInputs, config.circuitUrl);
    } else if (mode === "onchain") {
      if (!provider) throw new Error("Onchain mode requires provider");
      dbg("onchain.verifyOnchain: using config.verifierAddress", finalVerifierAddress);
      isValid = await verifyOnchain({
        proof: proof as any,
        publicInputs,
        verifierAddress: finalVerifierAddress,
        provider,
      });
    } else {
      throw new Error(`Unknown mode: ${mode}`);
    }

    dbg("verify.result", isValid);
    if (!isValid) throw new Error("Invalid ZK proof");

    return { success: true, proof: proof as any, publicInputs: normalizedPIs };
  } catch (err: any) {
    dbg("verify.error", err?.message || err);
    return { success: false, error: err.message };
  }
}