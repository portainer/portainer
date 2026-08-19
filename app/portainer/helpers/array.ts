export function getValueAsArrayOfStrings(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || (typeof value !== 'string' && typeof value !== 'number')) {
    return [];
  }

  if (typeof value === 'number') {
    return [value.toString()];
  }

  return [value];
}
