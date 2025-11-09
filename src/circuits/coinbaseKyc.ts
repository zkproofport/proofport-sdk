import { ethers } from "ethers";
import { MerkleTree } from "merkletreejs";
import type { CircuitSdkConfig, ProofMeta } from "./types";
import { normalizePIToPair } from "../utils";

const CIRCUIT_URL =
  "https://raw.githubusercontent.com/zkproofport/circuits/main/coinbase-kyc/target/zk_coinbase_attestor.json";

const VERIFIER_ADDRESS = "0x4C163fa6756244e7f29Cb5BEA0458eA993Eb0F6d";

const AUTHORIZED_SIGNERS = [
  '0x952f32128AF084422539C4Ff96df5C525322E564',
  '0x8844591D47F17bcA6F5dF8f6B64F4a739F1C0080',
  '0x88fe64ea2e121f49bb77abea6c0a45e93638c3c5',
  '0x44ace9abb148e8412ac4492e9a1ae6bd88226803'
];

function generateSignalHash(origin: string, nonce: string): string {
  const signal_bytes = ethers.toUtf8Bytes(origin + nonce);
  return ethers.keccak256(signal_bytes);
}

function buildMerkleRoot(): string {
  const leaves = AUTHORIZED_SIGNERS.map(addr =>
    ethers.keccak256(ethers.getBytes(ethers.getAddress(addr)))
  );

  const tree = new MerkleTree(leaves, ethers.keccak256, {
    sortPairs: false, 
  });

  return tree.getHexRoot();
}

export const coinbaseKycConfig: CircuitSdkConfig = {
  
  circuitUrl: CIRCUIT_URL,
  
  verifierAddress: VERIFIER_ADDRESS,
  
  getExpectedPublicInputs: (meta: ProofMeta) => {
    const expectedSignalHash = generateSignalHash(meta.origin, meta.nonce);
    const expectedMerkleRoot = buildMerkleRoot();
    // [signal_hash, merkle_root]
    return [expectedSignalHash, expectedMerkleRoot];
  },
  
  normalizePublicInputs: (publicInputs: any): string[] => {
    const { pair } = normalizePIToPair(publicInputs);
    return pair;
  }
};