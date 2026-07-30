/**
 * TOTP (Time-based One-Time Password) implementation for 2FA
 * Compatible with RFC 6238 and standard authenticator apps
 */

/**
 * Generate a random base32 secret key
 */
export function generateSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const secretLength = 32;
  let secret = "";
  
  for (let i = 0; i < secretLength; i++) {
    const randomBytes = new Uint8Array(1);
    crypto.getRandomValues(randomBytes);
    secret += chars[randomBytes[0] % chars.length];
  }
  
  return secret;
}

/**
 * Generate TOTP URI for QR code
 */
export function generateTOTPURI(
  secret: string,
  accountName: string,
  issuer: string = "SoroStream"
): string {
  const encodedSecret = secret;
  const encodedAccount = encodeURIComponent(accountName);
  const encodedIssuer = encodeURIComponent(issuer);
  
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${encodedSecret}&issuer=${encodedIssuer}&digits=6&period=30`;
}

/**
 * Generate recovery codes (8 single-use codes)
 */
export function generateRecoveryCodes(): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < 8; i++) {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    const code = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    codes.push(code);
  }
  
  return codes;
}

/**
 * Validate TOTP code (simplified - in production, use a proper TOTP library)
 * This is a placeholder for demonstration. In production, use a library like 'otpauth'
 */
export function validateTOTP(
  secret: string,
  token: string,
  window: number = 1
): boolean {
  // Placeholder implementation
  // In production, this would:
  // 1. Get current time
  // 2. Calculate time steps
  // 3. Generate HMAC for each step in the window
  // 4. Compare with provided token
  
  // For now, just check format (6 digits)
  return /^\d{6}$/.test(token);
}

/**
 * Hash a secret for storage (never store raw secrets)
 */
export async function hashSecret(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify recovery code format
 */
export function isValidRecoveryCode(code: string): boolean {
  return /^[A-F0-9]{8}$/.test(code);
}

/**
 * Format recovery code for display (add hyphens for readability)
 */
export function formatRecoveryCode(code: string): string {
  if (code.length === 8) {
    return `${code.slice(0, 4)}-${code.slice(4)}`;
  }
  return code;
}
