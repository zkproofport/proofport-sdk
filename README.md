# ZKProofport SDK

The easiest way to verify on-chain identity without exposing wallet addresses. The ZKProofport SDK allows you to integrate powerful privacy features into your dApp with just a few lines of code.

## Features

* **Complete Privacy:** The user's actual wallet address is never exposed to the dApp.
* **Fast Proofs:** All ZK proofs are generated locally in the user's browser in seconds.
* **Browser-Based:** Works instantly in any web environment with no installation required.
* **Simple Integration:** Abstracts away complex ZK logic for a great developer experience.

## Getting Started

### 1. Installation

```bash
npm install @zkproofport/sdk
# or
yarn add @zkproofport/sdk
````

### 2\. Usage Example (React)

```jsx
import { openZkKycPopup, verifyZkKycProof } from "@zkproofport/sdk";

function MyComponent() {
  async function handleVerification() {
    try {
      // 1. Open the ZKProofport portal (iFrame modal) and get the ZK proof.
      const proofData = await openZkKycPopup();

      // 2. Verify the received proof. (Default: off-chain)
      //    (On-chain mode requires provider & verifierAddress options)
      const result = await verifyZkKycProof(proofData);

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

## API

### `openZkKycPopup()`

  * Opens the ZKProofport portal as an iFrame modal.
  * **Returns:** A `Promise` that resolves with a `{ proof: string, publicInputs: string[], meta: object }` object upon successful proof generation.
  * **Rejects:** If the user closes the portal or it times out (2 minutes).

### `verifyZkKycProof(proofData, options?)`

  * Verifies the `proofData` object returned from `openZkKycPopup`.
  * **`options` (optional):**
      * `mode`: `"offchain"` (default) or `"onchain"`.
      * `provider`: (Required for on-chain mode) An Ethers.js `JsonRpcProvider` instance.
      * `verifierAddress`: (Optional for on-chain mode) The deployed verifier contract address (a default is provided).
  * **Returns:** A `Promise` that resolves with `{ success: true, ... }` or `{ success: false, error: string }`.

## Current Status & Future Direction

  * **Current Support:** ZK proof generation and verification based on Coinbase on-chain KYC attestations (EAS) on the Base network.
  * **Limitations:** The current ZK circuit is in active development to include transaction digest (`keccak256`) recalculation for enhanced security. The alpha version uses a PoC-level circuit.
  * **Future Direction:**
      * Complete the production-level ZK circuit (including Keccak256 and Merkle Tree verification).
      * Support for additional attestation types (e.g., Twitter followers, specific NFT ownership).
      * Introduce a dApp whitelist model to enhance user security.

## Contributing

Bug reports and feature requests are welcome\! Please open an issue on GitHub.

## License

[MIT](https://www.google.com/search?q=LICENSE)