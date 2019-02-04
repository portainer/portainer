export default function linkGetResponse(data, headers) {
  var response = angular.fromJson(data);
  var link = headers('link');
  if (link) {
    var queryString = link.substring(link.indexOf('?') + 1).split('>;')[0];
    var queries = queryString.split('&');
    for (var i = 0; i < queries.length; i++) {
      var kv = queries[i].split('=');
      response[kv[0]] = kv[1];
    }
  }
  return response;
}