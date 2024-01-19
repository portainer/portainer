import _ from 'lodash';

import { EnvVar } from './types';

export const KEY_REGEX = /(.+?)/.source;
export const VALUE_REGEX = /(.*)?/.source;

const KEY_VALUE_REGEX = new RegExp(`^(${KEY_REGEX})\\s*=(${VALUE_REGEX})$`);
const NEWLINES_REGEX = /\n|\r|\r\n/;

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
        value: parsedKeyValArr[3].trim() || '',
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
