import { describe, it, expect } from "vitest";
import {
  getStreamDetailUrl,
  generateTwitterShareUrl,
  generateLinkedInShareUrl,
  generateCopyLinkUrl,
} from "../share";

describe("Share URL Generation Utility", () => {
  const mockOrigin = "https://sorostream.app";
  const standardId = "123";
  const largeIntId = 999999999999; // Edge-case large integer ID

  describe("getStreamDetailUrl", () => {
    it("should correctly format stream detail URL with standard ID", () => {
      const url = getStreamDetailUrl(standardId, mockOrigin);
      expect(url).toBe("https://sorostream.app/stream/123");
    });

    it("should correctly format stream detail URL with edge-case large integer ID", () => {
      const url = getStreamDetailUrl(largeIntId, mockOrigin);
      expect(url).toBe("https://sorostream.app/stream/999999999999");
    });

    it("should handle trailing slash in origin correctly", () => {
      const url = getStreamDetailUrl(standardId, "https://sorostream.app/");
      expect(url).toBe("https://sorostream.app/stream/123");
    });
  });

  describe("generateTwitterShareUrl", () => {
    it("should embed stream detail URL in Twitter share URL with default text", () => {
      const shareUrl = generateTwitterShareUrl(standardId, mockOrigin);
      const expectedEncodedUrl = encodeURIComponent("https://sorostream.app/stream/123");
      const expectedEncodedText = encodeURIComponent("Check out this payment stream on SoroStream!");
      expect(shareUrl).toContain(`https://twitter.com/intent/tweet?url=${expectedEncodedUrl}`);
      expect(shareUrl).toContain(`&text=${expectedEncodedText}`);
    });

    it("should handle large integer ID correctly", () => {
      const shareUrl = generateTwitterShareUrl(largeIntId, mockOrigin);
      const expectedEncodedUrl = encodeURIComponent("https://sorostream.app/stream/999999999999");
      expect(shareUrl).toContain(`https://twitter.com/intent/tweet?url=${expectedEncodedUrl}`);
    });
  });

  describe("generateLinkedInShareUrl", () => {
    it("should embed stream detail URL in LinkedIn share URL", () => {
      const shareUrl = generateLinkedInShareUrl(standardId, mockOrigin);
      const expectedEncodedUrl = encodeURIComponent("https://sorostream.app/stream/123");
      expect(shareUrl).toBe(`https://www.linkedin.com/sharing/share-offsite/?url=${expectedEncodedUrl}`);
    });

    it("should handle large integer ID correctly", () => {
      const shareUrl = generateLinkedInShareUrl(largeIntId, mockOrigin);
      const expectedEncodedUrl = encodeURIComponent("https://sorostream.app/stream/999999999999");
      expect(shareUrl).toBe(`https://www.linkedin.com/sharing/share-offsite/?url=${expectedEncodedUrl}`);
    });
  });

  describe("generateCopyLinkUrl", () => {
    it("should generate exact stream detail URL for standard ID", () => {
      const url = generateCopyLinkUrl(standardId, mockOrigin);
      expect(url).toBe("https://sorostream.app/stream/123");
    });

    it("should generate exact stream detail URL for large integer ID", () => {
      const url = generateCopyLinkUrl(largeIntId, mockOrigin);
      expect(url).toBe("https://sorostream.app/stream/999999999999");
    });
  });
});
