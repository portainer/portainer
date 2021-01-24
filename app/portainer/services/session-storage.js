/**
 * clears the sessionStorage
 */
export function clear() {
  sessionStorage.clear();
}

/**
 * stores `value` as string in `sessionStorage[key]`
 *
 * @param {string} key the key to store value at
 * @param {any} value the value to store - will be stringified using JSON.stringify
 *
 */
export function save(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

/**
 * get parses the value stored in sessionStorage[key], if it's not available returns undefined
 *
 * @param {string} key
 */
export function get(key) {
  try {
    const value = sessionStorage.getItem(key);
    return JSON.parse(value);
  } catch (e) {
    return;
  }
}
