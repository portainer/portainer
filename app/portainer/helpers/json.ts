export function arrayToJson<T>(arr?: Array<T>) {
  if (!arr) {
    return '';
  }

  return JSON.stringify(arr);
}

export function json2formData(json: Record<string, unknown>) {
  const formData = new FormData();

  Object.entries(json).forEach(([key, value]) => {
    if (typeof value === 'undefined' || value === null) {
      return;
    }

    if (value instanceof File) {
      formData.append(key, value);
      return;
    }

    if (Array.isArray(value)) {
      formData.append(key, arrayToJson(value));
      return;
    }

    if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value));
      return;
    }

    formData.append(key, value.toString());
  });

  return formData;
}

/**
 * The Docker API often returns a list of JSON object.
 * This handler wrap the JSON objects in an array.
 * @param data Raw docker API response (stream of objects in a single string)
 * @returns An array of parsed objects
 */
export function jsonObjectsToArrayHandler(data: string): unknown[] {
  // catching empty data helps the function not to fail and prevents unwanted error message to user.
  if (!data) {
    return [];
  }
  const str = `[${data.replace(/\n/g, ' ').replace(/\}\s*\{/g, '}, {')}]`;
  return JSON.parse(str);
}
