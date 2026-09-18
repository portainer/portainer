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

/** True when `url` differs from `currentUrl` at most by its hash. */
export function isSameDocumentUrl(
  url: string,
  currentUrl = window.location.href
): boolean {
  try {
    const target = new URL(url, currentUrl);
    const current = new URL(currentUrl);
    return (
      target.origin === current.origin &&
      target.pathname === current.pathname &&
      target.search === current.search
    );
  } catch {
    return false;
  }
}
