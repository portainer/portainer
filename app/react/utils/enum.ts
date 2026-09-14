export function asEnum<T>(value: unknown, allowed: Set<T>): T | null {
  return allowed.has(value as T) ? (value as T) : null;
}

/** Builds a parser for a numeric enum from a string, validating the parsed value against its members. */
export function makeGetEnumParam<E extends Record<string, string | number>>(
  enumObject: E
) {
  type T = Extract<E[keyof E], number>;

  const allowed = new Set(
    Object.values(enumObject).filter(
      (value): value is T => typeof value === 'number'
    )
  );

  return (value?: string): T | undefined => {
    const parsed = value !== undefined ? parseInt(value, 10) : NaN;
    return asEnum(parsed, allowed) ?? undefined;
  };
}
