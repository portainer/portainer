// Events query API return a list of JSON object.
// This handler wrap the JSON objects in an array.
function queryEventsHandler(data) {
  var str = "[" + data.replace(/\n/g, " ").replace(/\}\s*\{/g, "}, {") + "]";
  return angular.fromJson(str);
}

// Image create API return a list of JSON object.
// This handler wrap the JSON objects in an array.
function createImageHandler(data) {
  var str = "[" + data.replace(/\n/g, " ").replace(/\}\s*\{/g, "}, {") + "]";
  return angular.fromJson(str);
}

// Image push API return a list of JSON object.
// This handler wrap the JSON objects in an array.
function pushImageHandler(data) {
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
