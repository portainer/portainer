angular.module('portainer.app').service('urlHelper', function urlHelper($window) {
  this.getParameter = getParameter;
  this.cleanParameters = cleanParameters;

  function getParameter(queryParams, param) {
    var parameters = extractParameters(queryParams);
    return parameters[param];
  }

  function extractParameters(queryParams) {
    var queryString = queryParams.replace(/.*?\?/,'').split('&');
    return queryString.reduce(function(acc, keyValStr) {
      var keyVal = keyValStr.split('=');
      var key = keyVal[0];
      var val = keyVal[1];
      acc[key] = val;
      return acc;
    }, {});
  }

  function cleanParameters() {
    $window.location.search = '';
  }
});
