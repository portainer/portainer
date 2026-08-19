/* eslint-disable no-loss-of-precision */
import { abbreviateNumber } from './numbers';

describe('abbreviateNumber', () => {
  test('errors', () => {
    expect(() => abbreviateNumber(Number.NaN)).toThrowError();
    expect(() => abbreviateNumber(1, -1)).toThrowError();
    expect(() => abbreviateNumber(1, 21)).toThrowError();
  });

  test('zero', () => {
    expect(abbreviateNumber(0)).toBe('0');
    expect(abbreviateNumber(-0)).toBe('0');
  });

  test('decimals=0', () => {
    const cases: [number, string][] = [
      [123, '123'],
      [123_123, '123k'],
      [123_123_123, '123M'],
      [123_123_123_123, '123G'],
      [123_123_123_123_123, '123T'],
      [123_123_123_123_123_123, '123P'],
      [123_123_123_123_123_123_123, '123E'],
      [123_123_123_123_123_123_123_123, '123Z'],
      [123_123_123_123_123_123_123_123_123, '123Y'],
      [123_123_123_123_123_123_123_123_123_123, '123123Y'],
    ];
    cases.forEach(([num, str]) => {
      expect(abbreviateNumber(num, 0)).toBe(str);
      expect(abbreviateNumber(-num, 0)).toBe(`-${str}`);
    });
  });

  test('decimals=1 (default)', () => {
    const cases: [number, string][] = [
      [123, '123'],
      [123_123, '123.1k'],
      [123_123_123, '123.1M'],
      [123_123_123_123, '123.1G'],
      [123_123_123_123_123, '123.1T'],
      [123_123_123_123_123_123, '123.1P'],
      [123_123_123_123_123_123_123, '123.1E'],
      [123_123_123_123_123_123_123_123, '123.1Z'],
      [123_123_123_123_123_123_123_123_123, '123.1Y'],
      [123_123_123_123_123_123_123_123_123_123, '123123.1Y'],
    ];
    cases.forEach(([num, str]) => {
      expect(abbreviateNumber(num)).toBe(str);
      expect(abbreviateNumber(-num)).toBe(`-${str}`);
    });
  });

  test('decimals=10', () => {
    const cases: [number, string][] = [
      [123, '123'],
      [123_123, '123.123k'],
      [123_123_123, '123.123123M'],
      [123_123_123_123, '123.123123123G'],
      [123_123_123_123_123, '123.1231231231T'],
      [123_123_123_123_123_123, '123.1231231231P'],
      [123_123_123_123_123_123_123, '123.1231231231E'],
      [123_123_123_123_123_123_123_123, '123.1231231231Z'],
      [123_123_123_123_123_123_123_123_123, '123.1231231231Y'],
      [123_123_123_123_123_123_123_123_123_123, '123123.1231231231Y'],
    ];
    cases.forEach(([num, str]) => {
      expect(abbreviateNumber(num, 10)).toBe(str);
      expect(abbreviateNumber(-num, 10)).toBe(`-${str}`);
    });
  });
});

/* eslint-enable no-loss-of-precision */
