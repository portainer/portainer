export function pluralize(val: number, word: string, plural = `${word}s`) {
  return [1, -1].includes(Number(val)) ? word : plural;
}

export function addPlural(value: number, word: string, plural = `${word}s`) {
  return `${value} ${pluralize(value, word, plural)}`;
}
