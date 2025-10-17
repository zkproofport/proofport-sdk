export type CircuitId = "coinbase_kyc" | string;

export type CircuitSpec = {
  id: CircuitId;
  title: string;
  circuitUrl: string;                      // Noir metadata (bytecode) json URL
  verifierAddress?: string;                // optional on-chain verifier
  validatePublicInputs?: (inputs: string[]) => void; // optional per-circuit checks
};

const registry = new Map<CircuitId, CircuitSpec>();

export function registerCircuit(spec: CircuitSpec) {
  registry.set(spec.id, spec);
}

export function getCircuit(id: CircuitId) {
  return registry.get(id);
}
