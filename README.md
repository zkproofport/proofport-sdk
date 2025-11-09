# ZKProofport SDK

The easiest way to verify on-chain facts and identity without exposing wallet addresses. The ZKProofport SDK allows you to integrate powerful privacy features into your dApp with just a few lines of code.

## Features

  * **Complete Privacy:** The user's actual wallet address is never exposed to the dApp.
  * **Fast Proofs:** All ZK proofs are generated locally in the user's browser in seconds.
  * **Browser-Based:** Works instantly in any web environment with no installation required.
  * **Simple Integration:** Abstracts away complex ZK logic for a great developer experience.
  * **Extensible & Multi-Circuit:** Request different kinds of proofs, from KYC to NFT ownership, simply by changing a `circuitId`.

## Getting Started

### 1. Installation

```bash
npm install @zkproofport/sdk
# or
yarn add @zkproofport/sdk
```

### 2. Usage Example (React)

```jsx
import { openProofPortal, verifyProof } from "@zkproofport/sdk";
import { JsonRpcProvider } from "ethers";

// Setup a provider for on-chain verification (e.g., Base)
// const provider = new JsonRpcProvider("https://your_base_rpc_url");

function MyComponent() {
  async function handleVerification() {
    try {
      // 1. Open the ZKProofport portal (iFrame modal) and request a ZK proof.
      //    Specify which proof to generate using the 'circuitId'.
      const proofData = await openProofPortal({
        circuitId: "coinbase_kyc" // Example: Coinbase KYC proof
      });

      // 2. Verify the received proof. (Default: off-chain)
      //    'proofData' contains the proof, publicInputs, and meta (including circuitId).
      const result = await verifyProof({
        ...proofData,
        // --- For on-chain verification ---
        // mode: "onchain",
        // provider: provider,
        // verifierAddress: "0x..." // (Optional) Override default address
      });

      if (result.success) {
        alert("Success: User KYC is verified!");
        // Add your success logic here (e.g., grant airdrop eligibility)
      }
    } catch (error) {
      // User closed the portal or verification failed
      console.error("Verification was canceled or failed:", error.message);
    }
  }

  return (
    <button onClick={handleVerification}>
      Start Private KYC Verification
    </button>
  );
}
```

## Architecture: How it Works

1.  dApp calls `openProofPortal({ circuitId: 'coinbase_kyc' })`.
2.  SDK opens the Portal iFrame, passing the `circuitId` as a URL parameter.
3.  Portal loads the correct **Proving Module** for that ID.
4.  User generates the proof inside the Portal.
5.  Portal returns the `proofData` object (which includes `meta.circuitId`) to the dApp.
6.  dApp calls `verifyProof({ ...proofData })`.
7.  SDK reads the `meta.circuitId` and looks up the correct **Verification Config** (verifier address, PI logic) from its internal registry.
8.  SDK performs the verification using the circuit-specific config.

## API

### `openProofPortal(options)`

  * Opens the ZKProofport portal as an iFrame modal.
  * **`options` (required):**
      * `circuitId: string`: The unique ID of the proof circuit to be executed in the portal. (e.g., `"coinbase_kyc"`)
  * **Returns:** A `Promise` that resolves with a `{ proof: string, publicInputs: string[], meta: object }` object upon successful proof generation. The `meta` object includes the `circuitId`, `origin`, and `nonce` needed for verification.
  * **Rejects:** If the user closes the portal or it times out (2 minutes).

### `verifyProof(options)`

  * Verifies the proof by accepting a single options object containing the `proofData` from `openProofPortal`.
  * **`options` (required):**
      * `proof: string | ...`: The proof from `proofData`.
      * `publicInputs: any`: The public inputs from `proofData`.
      * `meta: object`: The metadata object from `proofData`. Must contain `meta.circuitId`.
      * `mode`: `"offchain"` (default) or `"onchain"`.
      * `provider`: (Required for on-chain mode) An Ethers.js `JsonRpcProvider` instance.
      * `verifierAddress`: (Optional) Overrides the SDK's built-in default address for the specified `circuitId`.
  * **Returns:** A `Promise` that resolves with `{ success: true, ... }` or `{ success: false, error: string }`.

## Supported Circuits (Examples)

The SDK is designed to support any compatible circuit. The circuits currently included in the default registry are:

  * **`coinbase_kyc`**: A ZK proof based on Coinbase's on-chain KYC attestation (EAS) on the Base network.
      * **Base (Mainnet) Verifier:** [`0x4C163fa6756244e7f29Cb5BEA0458eA993Eb0F6d`](https://repo.sourcify.dev/8453/0x4C163fa6756244e7f29Cb5BEA0458eA993Eb0F6d)
      * **Authorized Signers (Merkle Root):** This circuit verifies that the attestation transaction was signed by one of the addresses in a known list.
        ```json
        [
          "0x952f32128AF084422539C4Ff96df5C525322E564",
          "0x8844591D47F17bcA6F5dF8f6B64F4a739F1C0080",
          "0x88fe64ea2e121f49bb77abea6c0a45e93638c3c5",
          "0x44ace9abb148e8412ac4492e9a1ae6bd88226803"
        ]
        ```

## Future Direction

  * Complete production-level ZK circuits with enhanced security (full Keccak256 and Merkle Tree verification).
  * Add more circuits to the default registry (e.g., World ID, POAPs, NFT ownership, social media proofs).
  * Introduce a dApp whitelist model to enhance user security.

## Contributing

Bug reports and feature requests are welcome\! Please open an issue on GitHub.

## License

[MIT](https://www.google.com/search?q=LICENSE)