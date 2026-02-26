import {
  capitalize,
  pluralize,
  addPlural,
  grammaticallyJoin,
  stripProtocol,
} from './string-utils';

describe('capitalize', () => {
  it('capitalizes the first letter of a string', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('handles already capitalized strings', () => {
    expect(capitalize('Hello')).toBe('Hello');
  });

  it('handles single character strings', () => {
    expect(capitalize('a')).toBe('A');
  });

  it('handles empty strings', () => {
    expect(capitalize('')).toBe('');
  });

  it('preserves the rest of the string', () => {
    expect(capitalize('hELLO')).toBe('HELLO');
  });
});

describe('pluralize', () => {
  it('returns singular for 1', () => {
    expect(pluralize(1, 'dog')).toBe('dog');
  });

  it('returns singular for -1', () => {
    expect(pluralize(-1, 'dog')).toBe('dog');
  });

  it('returns plural for 0', () => {
    expect(pluralize(0, 'dog')).toBe('dogs');
  });

  it('returns plural for 2', () => {
    expect(pluralize(2, 'dog')).toBe('dogs');
  });

  it('returns plural for negative numbers other than -1', () => {
    expect(pluralize(-5, 'dog')).toBe('dogs');
  });

  it('uses custom plural form when provided', () => {
    expect(pluralize(5, 'child', 'children')).toBe('children');
    expect(pluralize(1, 'child', 'children')).toBe('child');
  });

  it('handles irregular plurals', () => {
    expect(pluralize(2, 'mouse', 'mice')).toBe('mice');
    expect(pluralize(1, 'mouse', 'mice')).toBe('mouse');
  });
});

describe('addPlural', () => {
  it('combines number with singular word for 1', () => {
    expect(addPlural(1, 'dog')).toBe('1 dog');
  });

  it('combines number with plural word for 2', () => {
    expect(addPlural(2, 'dog')).toBe('2 dogs');
  });

  it('combines number with plural word for 0', () => {
    expect(addPlural(0, 'dog')).toBe('0 dogs');
  });

  it('uses custom plural form when provided', () => {
    expect(addPlural(5, 'child', 'children')).toBe('5 children');
    expect(addPlural(1, 'child', 'children')).toBe('1 child');
  });

  it('handles negative numbers', () => {
    expect(addPlural(-1, 'dog')).toBe('-1 dog');
    expect(addPlural(-5, 'dog')).toBe('-5 dogs');
  });
});

describe('grammaticallyJoin', () => {
  it('returns empty string for empty array', () => {
    expect(grammaticallyJoin([])).toBe('');
  });

  it('returns single item as is', () => {
    expect(grammaticallyJoin(['apple'])).toBe('apple');
  });

  it('joins two items with "and"', () => {
    expect(grammaticallyJoin(['apple', 'orange'])).toBe('apple and orange');
  });

  it('joins three items with commas and "and"', () => {
    expect(grammaticallyJoin(['apple', 'orange', 'banana'])).toBe(
      'apple, orange and banana'
    );
  });

  it('joins multiple items correctly', () => {
    expect(grammaticallyJoin(['apple', 'orange', 'banana', 'grape'])).toBe(
      'apple, orange, banana and grape'
    );
  });

  it('uses both custom separators together', () => {
    expect(grammaticallyJoin(['a', 'b', 'c'], ' - ', ' & ')).toBe('a - b & c');
  });
});

describe('stripProtocol', () => {
  it('removes http:// protocol', () => {
    expect(stripProtocol('http://example.com')).toBe('example.com');
  });

  it('removes https:// protocol', () => {
    expect(stripProtocol('https://example.com')).toBe('example.com');
  });

  it('removes ftp:// protocol', () => {
    expect(stripProtocol('ftp://files.example.com')).toBe('files.example.com');
  });

  it('handles URLs with paths', () => {
    expect(stripProtocol('https://example.com/path/to/page')).toBe(
      'example.com/path/to/page'
    );
  });

  it('returns empty string when undefined', () => {
    expect(stripProtocol(undefined)).toBe('');
  });

  it('returns the string as is if no protocol', () => {
    expect(stripProtocol('example.com')).toBe('example.com');
  });

  it('handles custom protocols', () => {
    expect(stripProtocol('custom://protocol.com')).toBe('protocol.com');
  });

  it('handles URLs with ports and credentials', () => {
    expect(stripProtocol('https://user:pass@example.com:8080')).toBe(
      'user:pass@example.com:8080'
    );
  });

  it('preserves protocols in query params', () => {
    expect(stripProtocol('http://example.com?redirect=http://other.com')).toBe(
      'example.com?redirect=http://other.com'
    );
  });

  it('preserves protocols in paths', () => {
    expect(stripProtocol('http://example.com/file://path/to/resource')).toBe(
      'example.com/file://path/to/resource'
    );
  });
});
