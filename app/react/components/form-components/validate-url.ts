export function isValidUrl(
  value: string | undefined,
  additionalCheck: (url: URL) => boolean = () => true
) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return additionalCheck(url);
  } catch {
    return false;
  }
}
