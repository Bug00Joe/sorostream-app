import React from 'react';

// Minimal Next.js Link stub for Vitest/jsdom tests
const Link = ({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
  <a href={typeof href === 'string' ? href : String(href)} {...props}>
    {children}
  </a>
);

export default Link;
