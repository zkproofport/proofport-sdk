export type ProofMeta = {
  nonce: string;
  origin: string;
  timestamp: number; // seconds
};

const usedNonces = new Set<string>();

export function validateMetadata(meta: ProofMeta, opts?: { maxAgeSec?: number }) {
  const maxAge = opts?.maxAgeSec ?? 300;
  const now = Math.floor(Date.now() / 1000);
  const age = now - meta.timestamp;

  if (meta.origin !== window.location.origin) throw new Error("Origin mismatch");
  if (age > maxAge || age < -10) throw new Error("Timestamp out of range");
  if (usedNonces.has(meta.nonce)) throw new Error("Replay detected");

  usedNonces.add(meta.nonce);
}
