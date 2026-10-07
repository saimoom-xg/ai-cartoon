export function isTrustedBlobUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".public.blob.vercel-storage.com") &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
