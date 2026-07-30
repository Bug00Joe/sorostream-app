import { type NextRequest, NextResponse } from "next/server";

/**
 * Dynamic OG image generation endpoint.
 * Generates a simple text-based OG image for stream sharing.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const streamId = searchParams.get("streamId") || "Stream";
  const amount = searchParams.get("amount") || "0.00";
  const token = searchParams.get("token") || "USDC";

  try {
    // Create a simple SVG-based OG image
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <!-- Background gradient -->
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#111827;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1F2937;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="topGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#10B981;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="1200" height="630" fill="url(#grad)"/>
        
        <!-- Top accent bar -->
        <rect width="1200" height="8" fill="url(#topGrad)"/>
        
        <!-- Content area -->
        <g>
          <!-- Logo/Title -->
          <text x="60" y="100" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#10B981">
            SoroStream
          </text>
          
          <!-- Stream ID -->
          <text x="60" y="180" font-family="Arial, sans-serif" font-size="32" fill="#D1D5DB">
            Stream #${streamId}
          </text>
          
          <!-- Amount display -->
          <rect x="60" y="240" width="1080" height="140" rx="12" fill="#111827" stroke="#10B981" stroke-width="2"/>
          <text x="90" y="290" font-family="Arial, sans-serif" font-size="28" fill="#9CA3AF">
            Amount
          </text>
          <text x="90" y="360" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="#FFFFFF">
            ${amount} ${token}
          </text>
          
          <!-- Status -->
          <text x="60" y="520" font-family="Arial, sans-serif" font-size="24" fill="#6B7280">
            Real-time payment streaming on Stellar Soroban
          </text>
          
          <!-- Footer -->
          <text x="60" y="600" font-family="Arial, sans-serif" font-size="18" fill="#4B5563">
            sorostream-app.vercel.app
          </text>
        </g>
      </svg>
    `;

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Error generating OG image:", error);
    // Return a simple fallback image
    return new NextResponse(
      `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="630" fill="#111827"/>
        <text x="600" y="315" font-family="Arial" font-size="48" fill="#10B981" text-anchor="middle" dominant-baseline="middle">
          SoroStream
        </text>
      </svg>`,
      {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=86400",
        },
      }
    );
  }
}
