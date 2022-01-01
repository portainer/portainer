import _ from 'lodash-es';

export const KEY_REGEX = /(.+?)/.source;
export const VALUE_REGEX = /(.*)?/.source;

const KEY_VALUE_REGEX = new RegExp(`^(${KEY_REGEX})\\s*=(${VALUE_REGEX})$`);
const NEWLINES_REGEX = /\n|\r|\r\n/;

/**
 * @param  {string} src the source of the .env file
 *
 * @returns {[{name: string, value: string}]} array of {name, value}
 */
export function parseDotEnvFile(src) {
  return parseArrayOfStrings(
    _.compact(src.split(NEWLINES_REGEX))
      .map((v) => v.trim())
      .filter((v) => !v.startsWith('#') && v !== '')
  );
}

/**
 * parses an array of name=value to array of {name, value}
 *
 * @param  {[string]} array array of strings in format name=value
 *
 * @returns {[{name: string, value: string}]} array of {name, value}
 */
export function parseArrayOfStrings(array) {
  if (!array) {
    return [];
  }

  return _.compact(
    array.map((variableString) => {
      if (!variableString.includes('=')) {
        return { name: variableString };
      }

      const parsedKeyValArr = variableString.trim().match(KEY_VALUE_REGEX);
      if (parsedKeyValArr != null && parsedKeyValArr.length > 4) {
        return { name: parsedKeyValArr[1].trim(), value: parsedKeyValArr[3].trim() || '' };
      }
    })
  );
}
/**
 * converts an array of {name, value} to array of `name=value`, name is always defined
 *
 * @param  {[{name, value}]} array array of {name, value}
 *
 * @returns {[string]} array of `name=value`
 */
export function convertToArrayOfStrings(array) {
  if (!array) {
    return [];
  }

  return array.filter((variable) => variable.name).map(({ name, value }) => (value || value === '' ? `${name}=${value}` : name));
}
