export function capitalize(s: string) {
  return s.slice(0, 1).toUpperCase() + s.slice(1);
}

export function pluralize(val: number, word: string, plural = `${word}s`) {
  return [1, -1].includes(Number(val)) ? word : plural;
}

export function addPlural(value: number, word: string, plural = `${word}s`) {
  return `${value} ${pluralize(value, word, plural)}`;
}

/**
 * Joins an array of strings into a grammatically correct sentence.
 */
export function grammaticallyJoin(
  values: string[],
  separator = ', ',
  lastSeparator = ' and '
) {
  if (values.length === 0) return '';
  if (values.length === 1) return values[0];

  const allButLast = values.slice(0, -1);
  const last = values[values.length - 1];
  return `${allButLast.join(separator)}${lastSeparator}${last}`;
}
