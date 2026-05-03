// Shared helper for proxying short-lived Notion S3 image URLs through /api/image-proxy.
const shouldProxy = (rawUrl: string): boolean => {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === "https:" && parsed.hostname === "prod-files-secure.s3.us-west-2.amazonaws.com";
  } catch {
    return false;
  }
};

export const proxyImageIfNeeded = (rawUrl: string): string =>
  shouldProxy(rawUrl) ? `/api/image-proxy?url=${encodeURIComponent(rawUrl)}` : rawUrl;
