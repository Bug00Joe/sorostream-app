import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge middleware that sets permissive iframe security headers exclusively on
 * /embed/* routes. All other routes are unaffected.
 *
 * Headers applied to /embed/*:
 *   - X-Frame-Options: ALLOWALL  (allows embedding in any iframe)
 *   - Content-Security-Policy: frame-ancestors *  (CSP equivalent, overrides any stricter ancestor policy)
 *
 * The root app layout sets X-Frame-Options: SAMEORIGIN and a restrictive CSP
 * via next.config.js (or headers()), so we need to explicitly override here.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/embed")) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // Allow embedding from any origin
  response.headers.set("X-Frame-Options", "ALLOWALL");

  // CSP: allow this page to be framed by any origin
  response.headers.set(
    "Content-Security-Policy",
    "frame-ancestors *; default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src *;",
  );

  // Remove any stricter framing headers that might have been set upstream
  response.headers.delete("X-Content-Security-Policy");

  return response;
}

export const config = {
  matcher: ["/embed/:path*"],
};
