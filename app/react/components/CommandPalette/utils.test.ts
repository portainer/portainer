import { globToRegex } from './utils';

describe('globToRegex', () => {
  it('matches a file by extension using *', () => {
    const re = globToRegex('*.yml');
    expect(re.test('foo.yml')).toBe(true);
    expect(re.test('foo.ts')).toBe(false);
  });

  it('wraps pattern in "*" when not explicitly used', () => {
    const re = globToRegex('yml');
    expect(re.test('foo.yml')).toBe(true);
    expect(re.test('foo.ts')).toBe(false);
  });

  it('matches nested paths with **', () => {
    const re = globToRegex('src/**');
    expect(re.test('src/foo.ts')).toBe(true);
    expect(re.test('src/nested/bar.ts')).toBe(true);
    expect(re.test('lib/foo.ts')).toBe(false);
  });

  it('is case-insensitive', () => {
    const re = globToRegex('*.YML');
    expect(re.test('foo.yml')).toBe(true);
    expect(re.test('FOO.YML')).toBe(true);
  });

  it('escapes dots so they match only literal dots', () => {
    const re = globToRegex('file.ts');
    expect(re.test('file.ts')).toBe(true);
    expect(re.test('fileXts')).toBe(false);
  });

  it('matches exact paths with no wildcards', () => {
    const re = globToRegex('src/foo.ts');
    expect(re.test('src/foo.ts')).toBe(true);
    expect(re.test('src/bar.ts')).toBe(false);
  });

  it('matches any path with a bare wildcard', () => {
    const re = globToRegex('*');
    expect(re.test('anything')).toBe(true);
  });

  it('matches exactly one character with ?', () => {
    const re = globToRegex('te?t');
    expect(re.test('testy')).toBe(true);
    expect(re.test('text')).toBe(true);
    expect(re.test('tesst')).toBe(false);
    expect(re.test('tet')).toBe(false);
  });
});
