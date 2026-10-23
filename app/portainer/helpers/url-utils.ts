export function isValidReturnUrl(
  url: string,
  origin = window.location.origin
): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url, origin);
    return parsed.origin === origin;
  } catch {
    return false;
  }
}
