import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SoroStream Widget",
  description: "Embeddable SoroStream stream status widget",
  robots: "noindex",
};

/**
 * Bare layout for /embed/* routes.
 * No nav, footer, wallet connect bar, or global providers — just the widget.
 */
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "transparent" }}>
        {children}
      </body>
    </html>
  );
}
