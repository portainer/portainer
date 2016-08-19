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
  if (!Array.isArray(data)) {
    var arr = [];
    response = {};
    response.message = data;
    arr.push(response);
    return arr;
  }
  response = angular.fromJson(data);
  return response;
}
