// The get action of the Image service returns a file.
// ngResource will transform it as an array of chars.
// This functions simply creates a response object and assign
// the data to a field.
export function imageGetResponse(data) {
  var response = {};
  response.file = data;
  return response;
}
