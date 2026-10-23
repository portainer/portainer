/**
 * Converts a glob pattern to a case-insensitive RegExp.
 *
 * Patterns without `*` are wrapped in `*...*` for substring matching
 * `*` matches any sequence of characters
 * `?` matches exactly one character
 */
export function globToRegex(pattern: string): RegExp {
  let glob = pattern;
  if (!pattern.includes('*')) {
    glob = `*${pattern}*`;
  }
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*+/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`, 'i');
}
