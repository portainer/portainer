function isJSON(jsonString) {
  try {
    var o = JSON.parse(jsonString);
    if (o && typeof o === "object") {
        return o;
    }
  }
  catch (e) { }
  return false;
}

// The Docker API often returns a list of JSON object.
// This handler wrap the JSON objects in an array.
// Used by the API in: Image push, Image create, Events query.
function jsonObjectsToArrayHandler(data) {
  var str = "[" + data.replace(/\n/g, " ").replace(/\}\s*\{/g, "}, {") + "]";
  return angular.fromJson(str);
}

// Image delete API returns an array on success and a string on error.
// This handler creates an array composed of a single object with a field 'message'
// from a string in case of error.
function deleteImageHandler(data) {
  var response;
  if (!isJSON(data)) {
    var arr = [];
    response = {};
    response.message = data;
    arr.push(response);
    console.log(JSON.stringify(arr, null, 4));
    return arr;
  }
  response = angular.fromJson(data);
  return response;
}

// Network delete API returns an empty string on success.
// On error, it returns either an error message as a string (Docker < 1.12) or a JSON object with the field message
// container the error (Docker = 1.12).
// This handler returns an empty object on success or a JSON object with the field message container the error message
// on failure.
function deleteNetworkHandler(data) {
  console.log(JSON.stringify(data, null, 4));
  var response = {};
  // No data is returned when deletion is successful (Docker 1.9 -> 1.12)
  if (!data) {
    return response;
  }
  // A string is returned when an error occurs (Docker < 1.12)
  else if (data && !isJSON(data)) {
    response.message = data;
    return response;
  }
  // Docker 1.12 returns a valid JSON object when an error occurs
  else {
    response = angular.fromJson(data);
  }
  return response;
}
