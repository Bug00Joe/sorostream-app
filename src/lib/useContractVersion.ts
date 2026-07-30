"use client";
/**
 * useContractVersion — fetches the deployed SoroStream contract's version on
 * app load and compares it against the build's expected version.
 *
 * The expected version is baked in at build time via NEXT_PUBLIC_CONTRACT_VERSION.
 * A mismatch means the app was built against an older/newer contract ABI than
 * what's actually deployed, so the UI should prompt the user to refresh.
 */
import { useState, useEffect, useCallback } from "react";
import { getDeployedContractVersion } from "./sorostream";

export interface ContractVersionState {
  mismatch: boolean;
  expectedVersion: string;
  deployedVersion: string | null;
}

function getExpectedVersion(): string {
  return process.env.NEXT_PUBLIC_CONTRACT_VERSION ?? "";
}

export function useContractVersion(): ContractVersionState {
  const [deployedVersion, setDeployedVersion] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);
  const expectedVersion = getExpectedVersion();

  const checkVersion = useCallback(async () => {
    try {
      const deployed = await getDeployedContractVersion();
      setDeployedVersion(deployed);

      // Skip the check if the expected version isn't configured — nothing to compare against.
      const isMismatch = expectedVersion !== "" && deployed !== expectedVersion;
      setMismatch(isMismatch);

      if (isMismatch) {
        console.warn(
          `[SoroStream] Contract version mismatch: expected ${expectedVersion}, deployed contract reports ${deployed}. A refresh is needed to pick up the new contract.`,
        );
      }
    } catch (err) {
      // Unable to fetch — don't show a false-positive mismatch banner.
      console.error("[SoroStream] Failed to fetch deployed contract version:", err);
      setMismatch(false);
    }
  }, [expectedVersion]);

  useEffect(() => {
    void checkVersion();
  }, [checkVersion]);

  return { mismatch, expectedVersion, deployedVersion };
}
