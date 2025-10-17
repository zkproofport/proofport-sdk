
import { verifyProof, verifyOnchain } from "./verifier";
import { validateMetadata } from "./signer";
import { CIRCUIT_URL, PROOF_PORTAL_URL, ALLOWED_ORIGIN, COINBASE_CONTRACT } from "./constants";
import { JsonRpcProvider, ethers } from "ethers";

export type ProofResult =
  | { success: true; proof: string; publicInputs: any }
  | { success: false; error: string };

export async function openZkKycPopup(): Promise<{
  proof: string;
  publicInputs: string[];
  meta: any;
}> {
  return new Promise((resolve, reject) => {
    const origin = window.location.origin;
    const nonce = crypto.randomUUID();
    const url = `${PROOF_PORTAL_URL}?origin=${encodeURIComponent(origin)}&nonce=${nonce}`;

    const popup = window.open(url, "_blank");
    if (!popup) return reject(new Error("Popup blocked"));

    const timeout = setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(new Error("Timed out waiting for proof"));
    }, 120000);

    function handler(event: MessageEvent) {
      console.log('[DAPP] Message event received', event);
      console.log('event.origin', event.origin);
      console.log('ALLOWED_ORIGIN', ALLOWED_ORIGIN);

      // if (event.origin !== ALLOWED_ORIGIN) {
      //   console.warn(`[DAPP] REJECTED message from unknown origin. Expected: "${ALLOWED_ORIGIN}", but got: "${event.origin}"`);
      //   return;
      // }
      
      const { type, proof, publicInputs, meta } = event.data || {};
      if (type !== "zk-coinbase-proof") {
        console.warn(`[DAPP] IGNORED message with wrong type. Expected: "zk-coinbase-proof", but got: "${type}"`, event.data);
        return;
      }

      console.log('[DAPP] SUCCESS! Proof message validated and processed.');
      clearTimeout(timeout);
      window.removeEventListener("message", handler);
      resolve({ proof, publicInputs, meta });
    }

    window.addEventListener("message", handler);
  });
}

export async function verifyZkKycProof({
  proof,
  publicInputs,
  meta,
  mode = "offchain",
  provider,
  verifierAddress = "0xB3705B6d33Fe7b22e86130Fa12592B308a191483" 
}: {
  proof: string;
  publicInputs: string[];
  meta: any;
  mode?: "offchain" | "onchain";
  provider?: JsonRpcProvider;
  verifierAddress?: string;
}): Promise<ProofResult> {
  try {
    // 1. validate metadata
    validateMetadata(meta);

    const COINBASE_CONTRACT_BYTES = parseHexAddress(COINBASE_CONTRACT); // Uint8Array(20)

    const contractBytes = hexStringsToByteArray(publicInputs);
    console.log({contractBytes})
    console.log({COINBASE_CONTRACT_BYTES})
    if (!arraysEqual(contractBytes, COINBASE_CONTRACT_BYTES)) {
      throw new Error("Contract address mismatch");
    }
    // 2. extract publicInputs[0–63] as 32-byte x/y
    // const pubX = hexStringsToUint8Array(publicInputs.slice(0, 32));
    // const pubY = hexStringsToUint8Array(publicInputs.slice(32, 64));

    // 3. compare with known Coinbase attester pubkey
    // if (!arraysEqual(pubX, COINBASE_PUBKEY.x)) {
    //   throw new Error("Coinbase public key X mismatch");
    // }
    // if (!arraysEqual(pubY, COINBASE_PUBKEY.y)) {
    //   throw new Error("Coinbase public key Y mismatch");
    // }

    let isValid = false;
    if (mode === "offchain") {
      isValid = await verifyProof(proof, publicInputs, CIRCUIT_URL);
    } else if (mode === "onchain") {
      if (!provider) throw new Error("Onchain mode requires provider");
      isValid = await verifyOnchain({
        proof,
        publicInputs,
        verifierAddress,
        provider
      });
    } else {
      throw new Error(`Unknown mode: ${mode}`);
    }

    if (!isValid) throw new Error("Invalid proof");

    return { success: true, proof, publicInputs };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

function hexStringsToByteArray(hexArr: string[]): Uint8Array {
  const result: number[] = [];
  for (const hex of hexArr) {
    const clean = hex.startsWith("0x") ? hex.slice(2).padStart(64, "0") : hex.padStart(64, "0");
    const byte = parseInt(clean.slice(62, 64), 16);
    result.push(byte);
  }
  return Uint8Array.from(result);
}

function arraysEqual(a: Uint8Array | number[], b: Uint8Array | number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

function parseHexAddress(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (clean.length !== 40) throw new Error("Invalid address length");
  const bytes = new Uint8Array(20);
  for (let i = 0; i < 20; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
