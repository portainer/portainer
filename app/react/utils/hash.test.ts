import { describe, expect, it } from 'vitest';

import { strToHash } from './hash';

describe('strToHash', () => {
  it('returns the same value for the same input', () => {
    expect(strToHash('password123')).toBe(strToHash('password123'));
  });

  it('returns different values for different inputs', () => {
    expect(strToHash('password123')).not.toBe(strToHash('password456'));
  });
});
