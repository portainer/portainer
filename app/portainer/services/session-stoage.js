// clear clears the sessionStorage
export function clear() {
  sessionStorage.clear();
}

// save saves the value in sessionStorage[key] as a string
export function save(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

// get parses the value stored in sessionStorage[key], if it's not available returns undefined
export function get(key) {
  try {
    const value = sessionStorage.getItem(key);
    return JSON.parse(value);
  } catch (e) {
    return;
  }
}
