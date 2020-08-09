import _ from 'lodash-es';

const KEYVAL_REGEX = /^\s*([\w.-]+)\s*=(.*)?\s*$/;
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
      .filter((v) => !v.startsWith('#'))
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

      const parsedKeyValArr = variableString.match(KEYVAL_REGEX);
      if (parsedKeyValArr != null && parsedKeyValArr.length > 2) {
        return { name: parsedKeyValArr[1], value: parsedKeyValArr[2] || '' };
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
