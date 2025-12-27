import {
  parseDotEnvFile,
  parseArrayOfStrings,
  stripInlineComment,
} from './utils';

describe('stripInlineComment', () => {
  describe('unquoted values', () => {
    test('strips comment after space-hash', () => {
      expect(stripInlineComment('value # comment')).toBe('value');
    });

    test('preserves hash without preceding space', () => {
      expect(stripInlineComment('value#notcomment')).toBe('value#notcomment');
    });

    test('handles empty value', () => {
      expect(stripInlineComment('')).toBe('');
    });

    test('handles whitespace-only value', () => {
      expect(stripInlineComment('   ')).toBe('');
    });

    test('handles value with multiple space-hash patterns', () => {
      expect(stripInlineComment('value # first # second')).toBe('value');
    });

    test('strips trailing whitespace before comment', () => {
      expect(stripInlineComment('value   # comment')).toBe('value');
    });

    test('strips comment after tab', () => {
      expect(stripInlineComment('value\t# comment')).toBe('value');
    });

    test('strips comment after mixed whitespace', () => {
      expect(stripInlineComment('value \t # comment')).toBe('value');
    });

    test('preserves value without comment', () => {
      expect(stripInlineComment('simple-value')).toBe('simple-value');
    });
  });

  describe('double-quoted values', () => {
    test('strips quotes and preserves hash inside', () => {
      expect(stripInlineComment('"value # with hash"')).toBe('value # with hash');
    });

    test('strips quotes from simple value', () => {
      expect(stripInlineComment('"simple"')).toBe('simple');
    });

    test('handles empty quoted string', () => {
      expect(stripInlineComment('""')).toBe('');
    });

    test('strips comment after closing quote', () => {
      expect(stripInlineComment('"value" # comment')).toBe('value');
    });

    test('handles escaped quotes inside', () => {
      expect(stripInlineComment('"say \\"hello\\""')).toBe('say "hello"');
    });

    test('handles unclosed quote gracefully', () => {
      expect(stripInlineComment('"unclosed')).toBe('unclosed');
    });
  });

  describe('single-quoted values', () => {
    test('strips quotes and preserves hash inside', () => {
      expect(stripInlineComment("'value # with hash'")).toBe('value # with hash');
    });

    test('strips quotes from simple value', () => {
      expect(stripInlineComment("'simple'")).toBe('simple');
    });

    test('handles empty quoted string', () => {
      expect(stripInlineComment("''")).toBe('');
    });

    test('strips comment after closing quote', () => {
      expect(stripInlineComment("'value' # comment")).toBe('value');
    });

    test('handles escaped quotes inside', () => {
      expect(stripInlineComment("'it\\'s working'")).toBe("it's working");
    });
  });

  describe('edge cases', () => {
    test('hex color value without quotes', () => {
      expect(stripInlineComment('#ff0000')).toBe('#ff0000');
    });

    test('hex color value with quotes', () => {
      expect(stripInlineComment('"#ff0000"')).toBe('#ff0000');
    });

    test('url with fragment', () => {
      expect(stripInlineComment('https://example.com/page#section')).toBe(
        'https://example.com/page#section'
      );
    });

    test('value starting with hash but not quoted', () => {
      expect(stripInlineComment('#value')).toBe('#value');
    });

    test('empty value with comment (leading whitespace before #)', () => {
      expect(stripInlineComment(' # comment')).toBe('');
    });

    test('empty value with comment (multiple spaces before #)', () => {
      expect(stripInlineComment('   # this is a comment')).toBe('');
    });

    test('trims leading and trailing whitespace', () => {
      expect(stripInlineComment('  value  ')).toBe('value');
    });
  });
});

describe('parseArrayOfStrings', () => {
  test('parses simple key=value', () => {
    expect(parseArrayOfStrings(['KEY=value'])).toEqual([
      { name: 'KEY', value: 'value', needsDeletion: false },
    ]);
  });

  test('strips inline comments', () => {
    expect(parseArrayOfStrings(['KEY=value # comment'])).toEqual([
      { name: 'KEY', value: 'value', needsDeletion: false },
    ]);
  });

  test('preserves quoted values with hash', () => {
    expect(parseArrayOfStrings(['KEY="value # not a comment"'])).toEqual([
      { name: 'KEY', value: 'value # not a comment', needsDeletion: false },
    ]);
  });

  test('handles hex color value', () => {
    expect(parseArrayOfStrings(['COLOR=#ff0000'])).toEqual([
      { name: 'COLOR', value: '#ff0000', needsDeletion: false },
    ]);
  });

  test('handles empty value', () => {
    expect(parseArrayOfStrings(['KEY='])).toEqual([
      { name: 'KEY', value: '', needsDeletion: false },
    ]);
  });

  test('handles empty value with comment', () => {
    expect(parseArrayOfStrings(['KEY= # comment'])).toEqual([
      { name: 'KEY', value: '', needsDeletion: false },
    ]);
  });

  test('handles key without equals sign', () => {
    expect(parseArrayOfStrings(['JUST_KEY'])).toEqual([{ name: 'JUST_KEY' }]);
  });

  test('handles empty array', () => {
    expect(parseArrayOfStrings([])).toEqual([]);
  });

  test('handles undefined', () => {
    expect(parseArrayOfStrings(undefined)).toEqual([]);
  });

  test('handles multiple variables', () => {
    expect(
      parseArrayOfStrings([
        'KEY1=value1',
        'KEY2=value2 # comment',
        'KEY3="quoted # value"',
      ])
    ).toEqual([
      { name: 'KEY1', value: 'value1', needsDeletion: false },
      { name: 'KEY2', value: 'value2', needsDeletion: false },
      { name: 'KEY3', value: 'quoted # value', needsDeletion: false },
    ]);
  });
});

describe('parseDotEnvFile', () => {
  test('parses multiline env file', () => {
    const input = `
KEY1=value1
KEY2=value2 # comment
# full line comment
KEY3="quoted value"
`;
    expect(parseDotEnvFile(input)).toEqual([
      { name: 'KEY1', value: 'value1', needsDeletion: false },
      { name: 'KEY2', value: 'value2', needsDeletion: false },
      { name: 'KEY3', value: 'quoted value', needsDeletion: false },
    ]);
  });

  test('handles CRLF line endings', () => {
    const input = 'KEY1=value1\r\nKEY2=value2';
    expect(parseDotEnvFile(input)).toEqual([
      { name: 'KEY1', value: 'value1', needsDeletion: false },
      { name: 'KEY2', value: 'value2', needsDeletion: false },
    ]);
  });

  test('skips empty lines', () => {
    const input = `
KEY1=value1

KEY2=value2
`;
    expect(parseDotEnvFile(input)).toHaveLength(2);
  });

  test('skips full-line comments', () => {
    const input = `
# comment
KEY=value
  # indented comment
`;
    expect(parseDotEnvFile(input)).toEqual([
      { name: 'KEY', value: 'value', needsDeletion: false },
    ]);
  });

  test('handles real-world .env file', () => {
    const input = `
# Database configuration
DB_HOST=localhost
DB_PORT=5432 # default postgres port

# API settings
API_KEY="sk-abc123#xyz" # this comment should be stripped
DEBUG=true

# Empty and special values
EMPTY=
COLOR=#ff0000
URL=https://example.com/path#fragment
`;
    const result = parseDotEnvFile(input);
    expect(result).toEqual([
      { name: 'DB_HOST', value: 'localhost', needsDeletion: false },
      { name: 'DB_PORT', value: '5432', needsDeletion: false },
      { name: 'API_KEY', value: 'sk-abc123#xyz', needsDeletion: false },
      { name: 'DEBUG', value: 'true', needsDeletion: false },
      { name: 'EMPTY', value: '', needsDeletion: false },
      { name: 'COLOR', value: '#ff0000', needsDeletion: false },
      { name: 'URL', value: 'https://example.com/path#fragment', needsDeletion: false },
    ]);
  });
});
