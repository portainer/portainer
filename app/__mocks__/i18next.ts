function replaceBetween(
  startIndex: number,
  endIndex: number,
  original: string,
  insertion: string
) {
  const result =
    original.substring(0, startIndex) +
    insertion +
    original.substring(endIndex);
  return result;
}

export function mockT(i18nKey: string, args?: Record<string, string>) {
  let key = i18nKey;

  while (key.includes('{{') && args) {
    const startIndex = key.indexOf('{{');
    const endIndex = key.indexOf('}}');

    const currentArg = key.substring(startIndex + 2, endIndex);
    const value = args[currentArg];

    key = replaceBetween(startIndex, endIndex + 2, key, value);
  }

  return key;
}

export default {
  t: mockT,
  language: 'en',
  changeLanguage: () => new Promise(() => {}),
  use: () => this,
};
