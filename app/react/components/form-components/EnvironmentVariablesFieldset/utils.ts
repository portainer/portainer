import _ from 'lodash';

import { EnvVar } from './types';

export const KEY_REGEX = /(.+?)/.source;
export const VALUE_REGEX = /(.*)?/.source;

const KEY_VALUE_REGEX = new RegExp(`^(${KEY_REGEX})\\s*=(${VALUE_REGEX})$`);
const NEWLINES_REGEX = /\n|\r|\r\n/;

/**
 * Strips inline comments from environment variable values following Docker Compose rules:
 * - Unquoted: `value # comment` -> `value` (space before # indicates comment)
 * - Unquoted: `value#notcomment` -> `value#notcomment` (no space = part of value)
 * - Quoted: `"value # hash"` -> `value # hash` (quotes stripped, # is literal)
 * - Quoted: `'value # hash'` -> `value # hash` (single quotes work too)
 * - After quote: `"value" # comment` -> `value` (comment after closing quote)
 */
export function stripInlineComment(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '') return '';

  const firstChar = trimmed[0];

  // Handle quoted values first
  if (firstChar === '"' || firstChar === "'") {
    const quoteChar = firstChar;
    let i = 1;
    let result = '';

    while (i < trimmed.length) {
      const char = trimmed[i];

      // Handle escape sequences
      if (char === '\\' && i + 1 < trimmed.length) {
        result += trimmed[i + 1];
        i += 2;
      } else if (char === quoteChar) {
        // Found closing quote - return content, ignore rest
        return result;
      } else {
        result += char;
        i += 1;
      }
    }

    // No closing quote - return everything after opening quote
    return trimmed.slice(1);
  }

  // If trimmed starts with # but original had leading whitespace,
  // it's an empty value with a comment (e.g., "KEY= # comment")
  if (firstChar === '#' && value !== trimmed) {
    return '';
  }

  // Unquoted: whitespace (space or tab) before # indicates comment
  const commentMatch = trimmed.match(/\s#/);
  if (commentMatch && commentMatch.index !== undefined) {
    return trimmed.slice(0, commentMatch.index).trimEnd();
  }

  return trimmed;
}

export function parseDotEnvFile(src: string) {
  return parseArrayOfStrings(
    _.compact(src.split(NEWLINES_REGEX))
      .map((v) => v.trim())
      .filter((v) => !v.startsWith('#') && v !== '')
  );
}

export function parseArrayOfStrings(array: Array<string> = []): Array<EnvVar> {
  if (!array) {
    return [];
  }

  return _.compact(
    array.map((variableString) => {
      if (!variableString.includes('=')) {
        return { name: variableString };
      }

      const parsedKeyValArr = variableString.trim().match(KEY_VALUE_REGEX);
      if (parsedKeyValArr == null || parsedKeyValArr.length < 4) {
        return null;
      }

      return {
        name: parsedKeyValArr[1].trim(),
        value: stripInlineComment(parsedKeyValArr[3] || ''),
        needsDeletion: false,
      };
    })
  );
}

export function convertToArrayOfStrings(array: Array<EnvVar>) {
  if (!array) {
    return [];
  }

  return array
    .filter((variable) => variable.name)
    .map(({ name, value }) =>
      value || value === '' ? `${name}=${value}` : name
    );
}
