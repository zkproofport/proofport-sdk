import { registerCircuit, type CircuitSpec } from "./registry";
import { parseHexAddress, hexStringsToByteArray, arraysEqual } from "../utils/hex";

export const COINBASE_CONTRACT = "0x357458739F90461b99789350868CD7CF330Dd7EE";
export const COINBASE_KYC_CIRCUIT_URL =
  "https://raw.githubusercontent.com/hsy822/zk-coinbase-attestor/develop/packages/circuit/target/zk_coinbase_attestor.json";

const coinbaseKycSpec: CircuitSpec = {
  id: "coinbase_kyc",
  title: "Coinbase KYC",
  circuitUrl: COINBASE_KYC_CIRCUIT_URL,
  // verifierAddress: "0xB3705B6d33Fe7b22e86130Fa12592B308a191483",
  validatePublicInputs: (publicInputs: string[]) => {
    // 32바이트 슬롯들의 마지막 1바이트씩 모아 20바이트 주소 복원
    const fromInputs = hexStringsToByteArray(publicInputs);
    const expected = parseHexAddress(COINBASE_CONTRACT);

    if (!arraysEqual(fromInputs, expected)) {
      throw new Error("Contract address mismatch in public inputs");
    }
  },
};

registerCircuit(coinbaseKycSpec);
export default coinbaseKycSpec;
