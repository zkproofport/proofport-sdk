export function hexToBytes(hex: string | Uint8Array): Uint8Array {
  if (typeof hex !== "string") return new Uint8Array(hex);
  let s = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (s.length % 2) s = "0" + s;
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function parseHexAddress(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (clean.length !== 40) throw new Error("Invalid address length");
  const bytes = new Uint8Array(20);
  for (let i = 0; i < 20; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function lastByteOf32(hex: string): number {
  const clean = hex.startsWith("0x") ? hex.slice(2).padStart(64, "0") : hex.padStart(64, "0");
  return parseInt(clean.slice(62, 64), 16);
}

/** 32바이트 슬롯 배열에서 각 슬롯의 마지막 1바이트만 뽑아 20바이트로 */
export function hexStringsToByteArray(hexArr: string[]): Uint8Array {
  return Uint8Array.from(hexArr.map(lastByteOf32));
}

export function arraysEqual(a: Uint8Array | number[], b: Uint8Array | number[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
