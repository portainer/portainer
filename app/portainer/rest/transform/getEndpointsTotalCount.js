export default function getEndpointsTotalCount(data, headers) {
  const response = {};
  response.value = angular.fromJson(data);
  response.totalCount = headers('X-Total-Count');
  return response;
}
