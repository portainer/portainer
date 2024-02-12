import { semverCompare } from './semver-utils';

describe('semverCompare', () => {
  test('sort array', () => {
    const versions = [
      '1.2.3',
      '4.11.6',
      '4.2.0',
      '1.5.19',
      '1.5.5',
      '4.1.3',
      '2.3.1',
      '10.5.5',
      '11.3.0',
    ];
    expect(versions.sort(semverCompare)).toStrictEqual([
      '1.2.3',
      '1.5.5',
      '1.5.19',
      '2.3.1',
      '4.1.3',
      '4.2.0',
      '4.11.6',
      '10.5.5',
      '11.3.0',
    ]);
  });

  test('compare versions', () => {
    // 1.0.0 < 2.0.0 < 2.1.0 < 2.1.1
    expect(semverCompare('1.0.0', '2.0.0')).toBe(-1);
    expect(semverCompare('2.0.0', '2.1.0')).toBe(-1);
    expect(semverCompare('2.1.0', '2.1.1')).toBe(-1);

    // 1.0.0-alpha < 1.0.0
    expect(semverCompare('1.0.0-alpha', '1.0.0')).toBe(-1);

    // 1.0.0-alpha < 1.0.0-alpha.1 < 1.0.0-alpha.beta < 1.0.0-beta < 1.0.0-beta.2 < 1.0.0-beta.11 < 1.0.0-rc.1 < 1.0.0
    expect(semverCompare('1.0.0-alpha', '1.0.0-alpha.1')).toBe(-1);
    expect(semverCompare('1.0.0-alpha.1', '1.0.0-alpha.beta')).toBe(-1);
    expect(semverCompare('1.0.0-alpha.beta', '1.0.0-beta')).toBe(-1);
    expect(semverCompare('1.0.0-beta', '1.0.0-beta.2')).toBe(-1);
    expect(semverCompare('1.0.0-beta.2', '1.0.0-beta.11')).toBe(-1);
    expect(semverCompare('1.0.0-beta.11', '1.0.0-rc.1')).toBe(-1);
    expect(semverCompare('1.0.0-rc.1', '1.0.0')).toBe(-1);

    // Build metadata MUST be ignored when determining version precedence.
    // expect(semverCompare("1.0.0", "=", "1.0.0+asdf") // ❌ exp: =, got: <).toBe(-1)
    // expect(semverCompare("1.0.0+qwer", "=", "1.0.0+asdf") // ❌ exp: =, got: >).toBe(-1)

    // Workaround via `v.replace(/\+.*/, "")`
    // expect(semverCompare("1.0.0", "=", "1.0.0+asdf".replace(/\+.*/, ""))).toBe(-1)
    // expect(semverCompare("1.0.0+qwer".replace(/\+.*/, ""), "=", "1.0.0+asdf".replace(/\+.*/, ""))).toBe(-1)

    expect(semverCompare('0.0.0', '0.0.0-foo')).toBe(1);
    expect(semverCompare('0.0.1', '0.0.0')).toBe(1);
    expect(semverCompare('1.0.0', '0.9.9')).toBe(1);
    expect(semverCompare('0.10.0', '0.9.0')).toBe(1);
    expect(semverCompare('0.99.0', '0.10.0')).toBe(1);
    expect(semverCompare('2.0.0', '1.2.3')).toBe(1);
    expect(semverCompare('1.2.3', '1.2.3-asdf')).toBe(1);
    expect(semverCompare('1.2.3', '1.2.3-4')).toBe(1);
    expect(semverCompare('1.2.3', '1.2.3-4-foo')).toBe(1);
    // expect(semverCompare("1.2.3-5-foo", ">", "1.2.3-5").toBe(1) // ❌ exp: >, got: <)
    expect(semverCompare('1.2.3-5', '1.2.3-4')).toBe(1);
    expect(semverCompare('1.2.3-5-foo', '1.2.3-5-Foo')).toBe(1);
    expect(semverCompare('3.0.0', '2.7.2+asdf')).toBe(1);
    expect(semverCompare('1.2.3-a.10', '1.2.3-a.5')).toBe(1);
    expect(semverCompare('1.2.3-a.b', '1.2.3-a.5')).toBe(1);
    expect(semverCompare('1.2.3-a.b', '1.2.3-a')).toBe(1);
    expect(semverCompare('1.2.3-a.b.c.10.d.5', '1.2.3-a.b.c.5.d.100')).toBe(1);
    // expect(semverCompare("1.2.3-r2", "1.2.3-r100").toBe(1) // ❌ exp: >, got: <)
    expect(semverCompare('1.2.3-r100', '1.2.3-R2')).toBe(1);

    expect(semverCompare('1.0.0', '1.0.0')).toBe(0);
    expect(semverCompare('1.2.3', '1.2.3')).toBe(0);
  });
});
