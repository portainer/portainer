// The get action of the Browse service returns a file.
// ngResource will transform it as an array of chars.
// This functions simply creates a response object and assign
// the data to a field.
export function browseGetResponse(data) {
  const response = {};
  response.file = data;
  return response;
}
