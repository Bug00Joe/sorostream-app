import React from 'react';

// Minimal Next.js Image stub for Vitest/jsdom tests
const Image = ({
  src,
  alt,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={src} alt={alt} {...props} />
);

export default Image;
