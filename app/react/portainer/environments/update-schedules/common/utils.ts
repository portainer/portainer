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

export function compareVersion(
  currentVersion: string,
  version = '',
  bigger = false
) {
  if (!currentVersion) {
    return true;
  }

  // if supplied version is not a string, e.g develop
  if (!version.includes('.')) {
    return true;
  }

  if (bigger) {
    return semverCompare(currentVersion, version) > 0;
  }

  // env version is less than the supplied
  return semverCompare(currentVersion, version) < 0;
}
