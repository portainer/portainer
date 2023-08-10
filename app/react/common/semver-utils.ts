/**
 * Compares two semver strings.
 *
 * returns:
 * - `-1` if `a < b`
 * - `0` if `a == b`
 * - `1` if `a > b`
 */
export function semverCompare(a: string, b: string) {
  if (a.startsWith(`${b}-`)) {
    return -1;
  }

  if (b.startsWith(`${a}-`)) {
    return 1;
  }

  return a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: 'case',
    caseFirst: 'upper',
  });
}

export function isVersionSmaller(a: string, b: string) {
  return semverCompare(a, b) < 0;
}
