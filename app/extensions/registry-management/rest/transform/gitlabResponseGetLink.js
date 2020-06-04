export default function gitlabResponseGetLink(data, headers) {
  let response = {};
  try {
    response.data = angular.fromJson(data);
    response.next = headers('X-Next-Page');
  } catch (error) {
    response = data;
  }
  return response;
}
