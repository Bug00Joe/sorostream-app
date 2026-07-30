/**
 * Utility for generating social share URLs for streams.
 */

/**
 * Generates the absolute URL to the stream detail page.
 */
export function getStreamDetailUrl(streamId: string | number, origin: string): string {
  const base = origin.replace(/\/+$/, "");
  return `${base}/stream/${streamId}`;
}

/**
 * Generates the Twitter share intent URL.
 */
export function generateTwitterShareUrl(
  streamId: string | number,
  origin: string,
  text: string = "Check out this payment stream on SoroStream!"
): string {
  const url = getStreamDetailUrl(streamId, origin);
  return `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

/**
 * Generates the LinkedIn sharing URL.
 */
export function generateLinkedInShareUrl(streamId: string | number, origin: string): string {
  const url = getStreamDetailUrl(streamId, origin);
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

/**
 * Generates the copy link URL (which is simply the stream detail URL).
 */
export function generateCopyLinkUrl(streamId: string | number, origin: string): string {
  return getStreamDetailUrl(streamId, origin);
}
