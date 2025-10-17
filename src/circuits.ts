import { CIRCUIT_URL, COINBASE_CONTRACT } from "./constants";

export type CircuitSpec = {
  id: string;
  title: string;
  circuitUrl: string;
  verifierAddress?: string;
  validatePublicInputs?: (inputs: string[]) => void;
};

const COINBASE_KYC: CircuitSpec = {
  id: "coinbase_kyc",
  title: "Coinbase KYC",
  circuitUrl: CIRCUIT_URL,
  validatePublicInputs: (inputs: string[]) => {
    const contractTail = addressToBytes(COINBASE_CONTRACT);
    const tailFromInputs = inputsToLastNBytes(inputs, 20);
    if (!equalBytes(contractTail, tailFromInputs)) {
      console.warn("PublicInputs contract address tail mismatch (soft check)");
    }
  },
};

export function getCircuit(id: string): CircuitSpec | undefined {
  if (id === "coinbase_kyc") return COINBASE_KYC;
  return undefined;
}

export const availableCircuits: CircuitSpec[] = [COINBASE_KYC];

function addressToBytes(addr: string): Uint8Array {
  const h = addr.startsWith("0x") ? addr.slice(2) : addr;
  if (h.length !== 40) throw new Error("Invalid address");
  const out = new Uint8Array(20);
  for (let i = 0; i < 20; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function inputsToLastNBytes(inputs: string[], n: number): Uint8Array {
  const bytes: number[] = [];
  for (const x of inputs) {
    const h = (x.startsWith("0x") ? x.slice(2) : x).padStart(64, "0");
    for (let i = 0; i < 64; i += 2) {
      bytes.push(parseInt(h.slice(i, i + 2), 16));
    }
  }
  return Uint8Array.from(bytes.slice(-n));
}

function equalBytes(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
