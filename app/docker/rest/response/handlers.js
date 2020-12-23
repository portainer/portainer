function isJSONArray(jsonString) {
  return Object.prototype.toString.call(jsonString) === '[object Array]';
}

function isJSON(jsonString) {
  try {
    var o = JSON.parse(jsonString);
    if (o && typeof o === 'object') {
      return o;
    }
  } catch (e) {
    //empty
  }
  return false;
}

// The Docker API often returns a list of JSON object.
// This handler wrap the JSON objects in an array.
// Used by the API in: Image push, Image create, Events query.
export function jsonObjectsToArrayHandler(data) {
  if (!data) {
    return [];
  }
  var str = '[' + data.replace(/\n/g, ' ').replace(/\}\s*\{/g, '}, {') + ']';
  return angular.fromJson(str);
}

// The Docker API often returns an empty string or a valid JSON object on success (Docker 1.9 -> Docker 1.12).
// On error, it returns either an error message as a string (Docker < 1.12) or a JSON object with the field message
// container the error (Docker = 1.12)
// This handler ensure a valid JSON object is returned in any case.
// Used by the API in: container deletion, network deletion, network creation, volume creation,
// container exec, exec resize.
export function genericHandler(data) {
  var response = {};
  // No data is returned when deletion is successful (Docker 1.9 -> 1.12)
  if (!data) {
    return response;
  }
  // A string is returned on failure (Docker < 1.12)
  else if (!isJSON(data)) {
    response.message = data;
  }
  // Docker 1.12 returns a valid JSON object when an error occurs
  else {
    response = angular.fromJson(data);
  }
  return response;
}

// The Docker API returns the logs as a single string.
// This handler wraps the data in a JSON object under the "logs" property.
export function logsHandler(data) {
  return {
    logs: data,
  };
}

// Image delete API returns an array on success (Docker 1.9 -> Docker 1.12).
// On error, it returns either an error message as a string (Docker < 1.12) or a JSON object with the field message
// container the error (Docker = 1.12).
// This handler returns the original array on success or a newly created array containing
// only one JSON object with the field message filled with the error message on failure.
export function deleteImageHandler(data) {
  // A string is returned on failure (Docker < 1.12)
  var response = [];
  if (!isJSON(data)) {
    response.push({ message: data });
  }
  // A JSON object is returned on failure (Docker = 1.12)
  else if (!isJSONArray(data)) {
    var json = angular.fromJson(data);
    response.push(json);
  }
  // An array is returned on success (Docker 1.9 -> 1.12)
  else {
    response = angular.fromJson(data);
  }
  return response;
}
