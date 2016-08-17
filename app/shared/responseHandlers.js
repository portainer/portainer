// The Docker API often returns a list of JSON object.
// This handler wrap the JSON objects in an array.
// Used by the API in: Image push, Image create, Events query.
function jsonObjectsToArrayHandler(data) {
  var str = "[" + data.replace(/\n/g, " ").replace(/\}\s*\{/g, "}, {") + "]";
  return angular.fromJson(str);
}

// Image delete API returns an array on success and an object on error.
// This handler creates an array from an object in case of error.
function deleteImageHandler(data) {
  var response = angular.fromJson(data);
  if (!Array.isArray(response)) {
    var arr = [];
    arr.push(response);
    return arr;
  }
  return response;
}
