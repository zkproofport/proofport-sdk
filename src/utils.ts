export function toHex32(x: string): string {
  const h = x.startsWith("0x") ? x.slice(2) : x;
  return "0x" + h.padStart(64, "0").slice(-64).toLowerCase();
}

export function u8SliceToBytes32(slice: any[]): string {
  if (!Array.isArray(slice) || slice.length !== 32) {
    throw new Error(`u8SliceToBytes32: expected 32 items, got ${slice?.length}`);
  }
  const toByteHex = (b: any): string => {
    if (typeof b === "string") {
      const hex = b.startsWith("0x") ? b.slice(2) : b;
      return hex.slice(-2).padStart(2, "0").toLowerCase();
    }
    if (typeof b === "number") return (b & 0xff).toString(16).padStart(2, "0");
    if (typeof b === "bigint") return Number(b & 0xffn).toString(16).padStart(2, "0");
    if (b instanceof Uint8Array) return (b[0] & 0xff).toString(16).padStart(2, "0");
    throw new Error("u8SliceToBytes32: unsupported byte item type");
  };
  const bytes = slice.map(toByteHex);
  return "0x" + bytes.join("");
}

export function feToBytes32(v: any): string {
  if (typeof v === "bigint") return ("0x" + v.toString(16)).padStart(66, "0").toLowerCase();
  if (typeof v === "number") return ("0x" + v.toString(16)).padStart(66, "0").toLowerCase();
  if (typeof v === "string") {
    if (v.startsWith("0x")) return toHex32(v);
    const asBigInt = BigInt(v);
    return ("0x" + asBigInt.toString(16)).padStart(66, "0").toLowerCase();
  }
  throw new Error("feToBytes32: unsupported field element type");
}

export function describePublicInputs(pi: any): any {
  const shape: any = { type: typeof pi };
  if (Array.isArray(pi)) {
    shape.type = "array";
    shape.length = pi.length;
    shape.sampleTypes = pi.slice(0, 3).map((x: any) => typeof x);
    shape.sampleValues = pi.slice(0, 3);
    if (pi.length > 0 && Array.isArray(pi[0])) {
      shape.dim2 = pi[0].length;
      shape.dim2Types = (pi[0] as any[]).slice(0, 3).map((x) => typeof x);
    }
  }
  return shape;
}

export function normalizePIToPair(pi: any): { pair: [string, string], used: string } {
  if (Array.isArray(pi) && pi.length === 2 && pi.every((x) => typeof x === "string" && x.startsWith("0x"))) {
    const pair: [string, string] = [toHex32(pi[0]), toHex32(pi[1])];
    return { pair, used: "bytes32[2]" };
  }
  if (Array.isArray(pi) && pi.length === 2 && pi.every((x) => typeof x === "bigint" || typeof x === "number" || (typeof x === "string" && !x.startsWith("0x")))) {
    const pair: [string, string] = [feToBytes32(pi[0]), feToBytes32(pi[1])];
    return { pair, used: "fieldElement[2]" };
  }
  if (Array.isArray(pi) && pi.length === 64) {
    const pair: [string, string] = [u8SliceToBytes32(pi.slice(0, 32)), u8SliceToBytes32(pi.slice(32, 64))];
    return { pair, used: "u8[64]" };
  }
  if (Array.isArray(pi) && pi.length === 2 && Array.isArray(pi[0]) && Array.isArray(pi[1]) && pi[0].length === 32 && pi[1].length === 32) {
    const pair: [string, string] = [u8SliceToBytes32(pi[0]), u8SliceToBytes32(pi[1])];
    return { pair, used: "u8[32]x2" };
  }
  throw new Error("normalizePIToPair: Unexpected publicInputs format");
}

/**
 * Reconstructs a bytes32 hash from 32 individual u8 public inputs
 */
export function reconstructHashFromInputs(inputs: string[]): string {
  if (inputs.length !== 32) {
    throw new Error(`Invalid hash slice length: expected 32, got ${inputs.length}`);
  }
  const bytes = inputs.map(input => {
    const hex = input.startsWith('0x') ? input.slice(2) : input;
    return hex.padStart(2, '0');
  });
  return '0x' + bytes.join('');
}