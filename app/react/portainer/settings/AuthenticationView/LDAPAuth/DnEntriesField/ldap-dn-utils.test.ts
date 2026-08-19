import { describe, it, expect } from 'vitest';

import {
  parseDN,
  buildDN,
  validateDnEntryValue,
  DnEntry,
} from './ldap-dn-utils';

describe('parseDN', () => {
  it('should parse DN with OU entries', () => {
    const dn = 'ou=Users,ou=Department,dc=example,dc=com';
    const suffix = 'dc=example,dc=com';

    const result = parseDN(dn, suffix);

    expect(result).toEqual([
      { type: 'ou', value: 'Users' },
      { type: 'ou', value: 'Department' },
    ]);
  });

  it('should parse DN with mixed OU and CN entries', () => {
    const dn = 'cn=Admins,ou=Groups,dc=example,dc=com';
    const suffix = 'dc=example,dc=com';

    const result = parseDN(dn, suffix);

    expect(result).toEqual([
      { type: 'cn', value: 'Admins' },
      { type: 'ou', value: 'Groups' },
    ]);
  });

  it('should filter out non-OU/CN entries', () => {
    const dn = 'uid=john,ou=Users,dc=example,dc=com';
    const suffix = 'dc=example,dc=com';

    const result = parseDN(dn, suffix);

    expect(result).toEqual([{ type: 'ou', value: 'Users' }]);
  });

  it('should return empty array when DN equals the suffix', () => {
    const suffix = 'dc=example,dc=com';

    const result = parseDN(suffix, suffix);

    expect(result).toEqual([]);
  });

  it('should return empty array for empty DN', () => {
    const result = parseDN('', '');

    expect(result).toEqual([]);
  });

  it('should return empty array for undefined DN', () => {
    const result = parseDN(undefined, 'dc=example,dc=com');

    expect(result).toEqual([]);
  });

  it('should handle values with spaces', () => {
    const result = parseDN(
      'ou=Sales Team,ou=Department,dc=example,dc=com',
      'dc=example,dc=com'
    );

    expect(result).toEqual([
      { type: 'ou', value: 'Sales Team' },
      { type: 'ou', value: 'Department' },
    ]);
  });

  it('should handle values with underscores and numbers', () => {
    const result = parseDN(
      'ou=group_01,ou=dept_2,dc=example,dc=com',
      'dc=example,dc=com'
    );

    expect(result).toEqual([
      { type: 'ou', value: 'group_01' },
      { type: 'ou', value: 'dept_2' },
    ]);
  });

  it('should preserve special characters in values', () => {
    const result = parseDN(
      'ou=R&D (Eng.),ou=Sales+Mktg,dc=example,dc=com',
      'dc=example,dc=com'
    );

    expect(result).toEqual([
      { type: 'ou', value: 'R&D (Eng.)' },
      { type: 'ou', value: 'Sales+Mktg' },
    ]);
  });

  it('should round-trip values containing special characters', () => {
    const dn = 'ou=R&D (Eng.),dc=example,dc=com';
    const suffix = 'dc=example,dc=com';

    expect(buildDN(parseDN(dn, suffix), suffix)).toBe(dn);
  });
});

describe('buildDN', () => {
  it('should build DN from entries with suffix', () => {
    const entries: DnEntry[] = [
      { type: 'ou', value: 'Users' },
      { type: 'ou', value: 'Department' },
    ];
    const suffix = 'dc=example,dc=com';

    const result = buildDN(entries, suffix);

    expect(result).toBe('ou=Users,ou=Department,dc=example,dc=com');
  });

  it('should build DN from mixed CN and OU entries with suffix', () => {
    const entries: DnEntry[] = [
      { type: 'cn', value: 'Admins' },
      { type: 'ou', value: 'Groups' },
    ];

    const result = buildDN(entries, 'dc=example,dc=com');

    expect(result).toBe('cn=Admins,ou=Groups,dc=example,dc=com');
  });

  it('should build DN without suffix', () => {
    const entries: DnEntry[] = [
      { type: 'ou', value: 'Users' },
      { type: 'cn', value: 'Admins' },
    ];

    const result = buildDN(entries, '');

    expect(result).toBe('ou=Users,cn=Admins');
  });

  it('should filter out entries with empty values', () => {
    const entries: DnEntry[] = [
      { type: 'ou', value: 'Users' },
      { type: 'ou', value: '' },
      { type: 'cn', value: 'Admins' },
    ];
    const suffix = 'dc=example,dc=com';

    const result = buildDN(entries, suffix);

    expect(result).toBe('ou=Users,cn=Admins,dc=example,dc=com');
  });

  it('should return only suffix when all entries have empty values', () => {
    const entries: DnEntry[] = [
      { type: 'ou', value: '' },
      { type: 'cn', value: '' },
    ];

    const result = buildDN(entries, 'dc=example,dc=com');

    expect(result).toBe('dc=example,dc=com');
  });

  it('should return only suffix for empty entries array', () => {
    const result = buildDN([], 'dc=example,dc=com');

    expect(result).toBe('dc=example,dc=com');
  });

  it('should return empty string when entries are empty and no suffix', () => {
    const result = buildDN([], '');

    expect(result).toBe('');
  });
});

describe('validateDnEntryValue', () => {
  it('should accept an empty value', () => {
    expect(validateDnEntryValue('')).toBeUndefined();
  });

  it('should accept values with allowed characters', () => {
    expect(validateDnEntryValue('R&D (Eng.)')).toBeUndefined();
    expect(validateDnEntryValue('Sales_Team 01')).toBeUndefined();
  });

  it('should accept an equals sign (escaped only in the type, not the value)', () => {
    expect(validateDnEntryValue('a=b')).toBeUndefined();
  });

  it('should accept non-ASCII characters', () => {
    expect(validateDnEntryValue('Café Müller')).toBeUndefined();
  });

  it('should accept an interior number sign', () => {
    expect(validateDnEntryValue('Team#1')).toBeUndefined();
  });

  it('should reject each reserved character', () => {
    expect(validateDnEntryValue('a"b')).toContain('"');
    expect(validateDnEntryValue('a+b')).toContain('+');
    expect(validateDnEntryValue('a,b')).toContain(',');
    expect(validateDnEntryValue('a;b')).toContain(';');
    expect(validateDnEntryValue('a<b')).toContain('<');
    expect(validateDnEntryValue('a>b')).toContain('>');
    expect(validateDnEntryValue('a\\b')).toContain('\\');
  });

  it('should list every reserved character it finds', () => {
    expect(validateDnEntryValue('a,b+c')).toBe(
      'These characters are not allowed in a DN entry value: + ,'
    );
  });

  it('should reject a leading space or number sign', () => {
    expect(validateDnEntryValue(' Users')).toBe(
      'A DN entry value cannot start with a space or "#".'
    );
    expect(validateDnEntryValue('#Users')).toBe(
      'A DN entry value cannot start with a space or "#".'
    );
  });

  it('should reject a trailing space', () => {
    expect(validateDnEntryValue('Users ')).toBe(
      'A DN entry value cannot end with a space.'
    );
  });

  it('should reject control characters', () => {
    expect(validateDnEntryValue('a\tb')).toBe(
      'A DN entry value cannot contain control characters.'
    );
  });
});
