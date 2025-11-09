export type ProofMeta = {
  origin: string;
  nonce: string;
  timestamp: number;
  circuitId: string;
};

export interface CircuitSdkConfig {
  circuitUrl: string;
  verifierAddress: string;
  getExpectedPublicInputs: (meta: ProofMeta) => string[];
  normalizePublicInputs: (publicInputs: any) => string[];
}