import { UltraHonkBackend } from "@aztec/bb.js";
import { Contract, JsonRpcProvider, ethers } from "ethers";

type BytesInput = string | Uint8Array | number[];

export function toBytes(data: BytesInput): Uint8Array {
  if (typeof data === "string") return ethers.getBytes(data);
  if (data instanceof Uint8Array) return data;
  if (Array.isArray(data)) return Uint8Array.from(data);
  throw new Error("Unsupported bytes input");
}

export function toHex(data: BytesInput): string {
  return ethers.hexlify(toBytes(data));
}

export async function verifyProof(
  proofHex: string | Uint8Array | number[],
  publicInputs: any,
  circuitUrl: string,
): Promise<boolean> {
  try {
    const metadata = await fetch(circuitUrl).then((res) => res.json());
    const backend = new UltraHonkBackend(metadata.bytecode, { threads: 4 });

    const proofBytes = toBytes(proofHex);
    const ok = await backend.verifyProof({ proof: proofBytes, publicInputs }, { keccak: true });

    backend.destroy();
    return ok;
  } catch (err) {
    console.error("Verification failed:", err);
    return false;
  }
}

const VERIFIER_ABI = [
  "function verify(bytes proof, bytes32[] publicInputs) view returns (bool)",
  "error PublicInputsLengthWrong(uint256 expected, uint256 actual)",
  "error ProofLengthWrong(uint256 expected, uint256 actual)",
  "error SumcheckFailed()",
  "error ShpleminiFailed()",
];

const toHex32 = (x: string) => {
  const h = x.startsWith("0x") ? x.slice(2) : x;
  return "0x" + h.padStart(64, "0").slice(-64).toLowerCase();
};

export async function verifyOnchain({
  proof,
  publicInputs,
  verifierAddress,
  provider
}: {
  proof: string | Uint8Array | number[];
  publicInputs: string[];
  verifierAddress: string;
  provider: JsonRpcProvider;
}): Promise<boolean> {
  const contract = new Contract(verifierAddress, VERIFIER_ABI, provider);

  console.log("[ZKPROOFPORT][SDK][ONCHAIN] inputs.len =", publicInputs.length);
  console.log("[ZKPROOFPORT][SDK][ONCHAIN] inputs[0..2] =", publicInputs.slice(0, 3));

  const proofBytes = toBytes(proof);
  const formattedInputs = publicInputs.map(toHex32);

  try {
    // v6 staticCall
    const ok = await contract.verify.staticCall(proofBytes, formattedInputs);
    return Boolean(ok);
  } catch (err: any) {
    const data = err?.data ?? err?.info?.error?.data ?? err?.error?.data;
    if (data) {
      try {
        const decoded = contract.interface.parseError(data);
        console.error("[ZKPROOFPORT][SDK][ONCHAIN] revert:", decoded?.name, decoded?.args);
      } catch {
        console.error("[ZKPROOFPORT][SDK][ONCHAIN] revert (unknown):", data);
      }
    } else {
      console.error("[ZKPROOFPORT][SDK][ONCHAIN] call error:", err);
    }
    return false;
  }
}