export const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

export function nowSec() {
  return Math.floor(Date.now() / 1000);
}

export function withTimeout<T>(p: Promise<T>, ms: number, label = "operation"): Promise<T> {
  let t: any;
  const timeout = new Promise<never>((_, reject) => {
    t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(t));
}

export function openPopup(url: string, name = "zkproofport", width = 980, height = 720) {
  if (!isBrowser) throw new Error("Popup requires a browser environment");
  const features = `width=${width},height=${height},popup=yes,noopener=yes,noreferrer=yes`;
  const w = window.open(url, name, features);
  if (!w) throw new Error("Popup blocked");
  return w;
}
