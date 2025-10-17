import { Contract, JsonRpcProvider, Wallet } from "ethers";

export async function verifyOffchain(params: {
  proofHex: string;
  publicInputs: string[];
  circuitUrl: string;
  threads?: number; 
  keccak?: boolean; 
}): Promise<boolean> {
  const { proofHex, publicInputs, circuitUrl, threads = 1, keccak = true } =
    params;

  const metadata = await fetch(circuitUrl).then((r) => r.json());
  const { UltraHonkBackend } = await import("@aztec/bb.js");
  const backend = new UltraHonkBackend(metadata.bytecode, { threads });

  try {
    const proofBytes = hexToBytes(proofHex);
    const ok = await backend.verifyProof(
      { proof: proofBytes, publicInputs },
      { keccak }
    );
    return ok;
  } finally {
    try {
      backend.destroy();
    } catch {}
  }
}

export async function verifyOnchain({
  proof,
  publicInputs,
  verifierAddress,
  provider,
}: {
  proof: string;
  publicInputs: string[];
  verifierAddress: string;
  provider: JsonRpcProvider;
}): Promise<boolean> {
  const abi = [
    "function verify(bytes calldata _proof, bytes32[] calldata _publicInputs) external view returns (bool)",
  ];
  const signer = Wallet.createRandom().connect(provider);
  const contract = new Contract(verifierAddress, abi, signer);

  const proofBytes = hexToBytes(proof);
  const formattedInputs = publicInputs.map(pad32);

  try {
    return await contract.verify(proofBytes, formattedInputs);
  } catch (err) {
    console.error("Onchain verification failed:", err);
    return false;
  }
}

/** utils */
function hexToBytes(hex: string | Uint8Array): Uint8Array {
  if (typeof hex !== "string") return new Uint8Array(hex);
  let h = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (h.length % 2) h = "0" + h;
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function pad32(v: string) {
  const h = v.startsWith("0x") ? v.slice(2) : v;
  return "0x" + h.padStart(64, "0");
}
