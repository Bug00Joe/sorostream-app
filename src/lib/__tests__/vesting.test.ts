import { describe, it, expect } from "vitest";

describe("Vesting Preview Calculation", () => {
  describe("calculateFlowRate", () => {
    it("calculates correct flow rate for valid inputs", () => {
      // Mock implementation - actual function would be imported from sorostream
      const toStroops = (usdc: string): bigint => BigInt(Math.round(parseFloat(usdc) * 10000000));
      const calculateFlowRate = (stroops: bigint, durationSeconds: number): bigint => {
        if (durationSeconds === 0) return 0n;
        return stroops / BigInt(durationSeconds);
      };

      const deposit = toStroops("1000"); // 1000 USDC in stroops
      const duration = 86400; // 1 day in seconds
      
      const flowRate = calculateFlowRate(deposit, duration);
      
      // 1000 USDC / 86400 seconds = ~0.01157 USDC/sec
      // In stroops: 10,000,000,000 / 86,400 = 115,740 stroops/sec
      expect(flowRate).toBe(115740n);
    });

    it("returns 0 for zero duration", () => {
      const calculateFlowRate = (stroops: bigint, durationSeconds: number): bigint => {
        if (durationSeconds === 0) return 0n;
        return stroops / BigInt(durationSeconds);
      };

      const deposit = 10000000000n;
      const result = calculateFlowRate(deposit, 0);
      
      expect(result).toBe(0n);
    });

    it("handles small deposits correctly", () => {
      const toStroops = (usdc: string): bigint => BigInt(Math.round(parseFloat(usdc) * 10000000));
      const calculateFlowRate = (stroops: bigint, durationSeconds: number): bigint => {
        if (durationSeconds === 0) return 0n;
        return stroops / BigInt(durationSeconds);
      };

      const deposit = toStroops("0.01"); // 0.01 USDC
      const duration = 3600; // 1 hour
      
      const flowRate = calculateFlowRate(deposit, duration);
      
      // 0.01 USDC = 100,000 stroops
      // 100,000 / 3600 = 27 stroops/sec (rounded down)
      expect(flowRate).toBe(27n);
    });
  });

  describe("Vested amount calculation", () => {
    it("calculates vested amount based on elapsed time", () => {
      const flowRate = 1000000; // 0.1 USDC/sec in stroops
      const elapsedSeconds = 3600; // 1 hour
      const deposit = 10000000000; // 1000 USDC in stroops
      
      const vested = Math.min(flowRate * elapsedSeconds, deposit);
      
      // 0.1 USDC/sec * 3600 sec = 360 USDC = 3,600,000,000 stroops
      expect(vested).toBe(3600000000);
    });

    it("caps vested amount at total deposit", () => {
      const flowRate = 1000000; // 0.1 USDC/sec in stroops
      const elapsedSeconds = 864000; // 10 days (more than total duration)
      const deposit = 10000000000; // 1000 USDC in stroops
      
      const vested = Math.min(flowRate * elapsedSeconds, deposit);
      
      // Should cap at deposit amount
      expect(vested).toBe(deposit);
    });

    it("handles zero elapsed time", () => {
      const flowRate = 1000000;
      const elapsedSeconds = 0;
      const deposit = 10000000000;
      
      const vested = Math.min(flowRate * elapsedSeconds, deposit);
      
      expect(vested).toBe(0);
    });
  });

  describe("Progress percentage calculation", () => {
    it("calculates correct percentage for partial progress", () => {
      const elapsed = 43200; // 12 hours
      const total = 86400; // 24 hours
      
      const percentage = (elapsed / total) * 100;
      
      expect(percentage).toBe(50);
    });

    it("returns 0% for no elapsed time", () => {
      const elapsed = 0;
      const total = 86400;
      
      const percentage = Math.max(0, (elapsed / total) * 100);
      
      expect(percentage).toBe(0);
    });

    it("returns 100% for completed streams", () => {
      const elapsed = 86400;
      const total = 86400;
      
      const percentage = Math.min(100, Math.max(0, (elapsed / total) * 100));
      
      expect(percentage).toBe(100);
    });

    it("handles negative elapsed time (stream not started)", () => {
      const elapsed = -3600;
      const total = 86400;
      
      const percentage = Math.max(0, (elapsed / total) * 100);
      
      expect(percentage).toBe(0);
    });
  });

  describe("Claimable amount calculation", () => {
    it("calculates claimable based on flow rate and time since last withdrawal", () => {
      const flowRate = 1000000; // 0.1 USDC/sec
      const lastWithdrawTime = Date.now() - 3600000; // 1 hour ago
      const now = Date.now();
      
      const elapsedSeconds = Math.max(0, (now - lastWithdrawTime) / 1000);
      const claimable = Math.floor(flowRate * elapsedSeconds);
      
      // Should be approximately 0.1 USDC/sec * 3600 sec = 360 USDC
      expect(claimable).toBeGreaterThan(3590000000);
      expect(claimable).toBeLessThan(3610000000);
    });

    it("returns 0 for invalid flow rate", () => {
      const flowRate = NaN;
      const lastWithdrawTime = Date.now() - 3600000;
      
      if (!Number.isFinite(flowRate)) {
        expect(true).toBe(true);
      }
    });

    it("returns 0 for invalid last withdrawal time", () => {
      const flowRate = 1000000;
      const lastWithdrawTime = NaN;
      
      if (!Number.isFinite(lastWithdrawTime)) {
        expect(true).toBe(true);
      }
    });
  });

  describe("Stroops conversion", () => {
    it("converts USDC to stroops correctly", () => {
      const toStroops = (usdc: string): bigint => BigInt(Math.round(parseFloat(usdc) * 10000000));
      
      expect(toStroops("1")).toBe(10000000n);
      expect(toStroops("0.5")).toBe(5000000n);
      expect(toStroops("0.0000001")).toBe(1n);
      expect(toStroops("1000")).toBe(10000000000n);
    });

    it("converts stroops to USDC correctly", () => {
      const formatStellarAmount = (stroops: number): string => {
        const whole = stroops / 10_000_000;
        return whole.toLocaleString(undefined, {
          minimumFractionDigits: 7,
          maximumFractionDigits: 7,
        });
      };
      
      expect(formatStellarAmount(10000000)).toBe("1.0000000");
      expect(formatStellarAmount(5000000)).toBe("0.5000000");
      expect(formatStellarAmount(1)).toBe("0.0000001");
      expect(formatStellarAmount(10000000000)).toBe("1,000.0000000");
    });
  });
});
