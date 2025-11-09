import type { CircuitSdkConfig } from "./types";
import { coinbaseKycConfig } from "./coinbaseKyc";

export const CIRCUIT_REGISTRY: Record<string, CircuitSdkConfig> = {
  
  "coinbase_kyc": coinbaseKycConfig,
  // "email_auth": emailConfig,
};

export type { CircuitSdkConfig, ProofMeta } from "./types";