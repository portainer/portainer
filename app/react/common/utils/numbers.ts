const suffixes = ['', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];

/**
 * Converts a number to a human-readable abbreviated format
 * Uses base 10 and standard SI prefixes
 *
 * @param num - The number to abbreviate
 * @param decimals - Number of decimal places (default: 1)
 * @returns Abbreviated number as string (e.g., "90k", "123M")
 */
export function abbreviateNumber(num: number, decimals: number = 1): string {
  if (Number.isNaN(num)) {
    throw new Error('Invalid number');
  }

  if (decimals < 0 || decimals > 20) {
    throw new Error('Invalid decimals. Must be in [0;20] range');
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  if (absNum === 0) {
    return '0';
  }

  let exponent = Math.floor(Math.log10(absNum) / 3);

  if (exponent > suffixes.length - 1) {
    exponent = suffixes.length - 1;
  }

  if (exponent < 0) {
    exponent = 0;
  }

  const value = absNum / 1000 ** exponent;

  const roundedValue =
    exponent > 0 ? Number(value.toFixed(decimals)) : Math.floor(value);

  const finalValue = isNegative ? -roundedValue : roundedValue;

  return `${finalValue}${suffixes[exponent]}`;
}
