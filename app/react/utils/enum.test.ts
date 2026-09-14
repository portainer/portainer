import { describe, it, expect } from 'vitest';

import { asEnum, makeGetEnumParam } from './enum';

describe('asEnum', () => {
  const ALLOWED = new Set(['asc', 'desc'] as const);

  it('returns the value when it is in the allowed set', () => {
    expect(asEnum('asc', ALLOWED)).toBe('asc');
  });

  it('returns null when the value is not in the allowed set', () => {
    expect(asEnum('invalid', ALLOWED)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(asEnum(undefined, ALLOWED)).toBeNull();
  });

  it('returns null for null', () => {
    expect(asEnum(null, ALLOWED)).toBeNull();
  });
});

describe('makeGetEnumParam', () => {
  enum Color {
    Red,
    Green,
    Blue,
  }

  const getColor = makeGetEnumParam(Color);

  it('returns the parsed value when it is a valid enum member', () => {
    expect(getColor('1')).toBe(Color.Green);
  });

  it('returns undefined for a value outside the enum', () => {
    expect(getColor('99')).toBeUndefined();
  });

  it('returns undefined for a non-numeric value', () => {
    expect(getColor('not-a-number')).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(getColor(undefined)).toBeUndefined();
  });
});
