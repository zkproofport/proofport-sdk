import { UltraHonkBackend } from "@aztec/bb.js";
import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { arrayify, hexZeroPad } from "@ethersproject/bytes";
import { hexToBytes } from "./utils/hex";

export async function verifyOffchain(params: {
  proofHex: string;
  publicInputs: string[];
  circuitUrl: string;
  threads?: number; // default 1 for browser compatibility
  keccak?: boolean; // default true for EVM verifier compatibility
}): Promise<boolean> {
  const { proofHex, publicInputs, circuitUrl, threads = 1, keccak = true } = params;
  const metadata = await fetch(circuitUrl).then((r) => r.json());
  const backend = new UltraHonkBackend(metadata.bytecode, { threads });
  try {
    const ok = await backend.verifyProof({ proof: hexToBytes(proofHex), publicInputs }, { keccak });
    return !!ok;
  } finally {
    backend.destroy?.();
  }
}

export async function verifyOnchain({
  proof,
  publicInputs,
  verifierAddress,
  provider
}: {
  proof: string;
  publicInputs: string[];
  verifierAddress: string;
  provider: JsonRpcProvider;
}): Promise<boolean> {
  const abi = ["function verify(bytes calldata, bytes32[] calldata) external view returns (bool)"];
  const signer = Wallet.createRandom().connect(provider); // read-only call
  const contract = new Contract(verifierAddress, abi, signer);
  const proofBytes = arrayify(proof);
  const inputs = publicInputs.map((x) => hexZeroPad(x, 32));
  return await contract.verify(proofBytes, inputs);
}
