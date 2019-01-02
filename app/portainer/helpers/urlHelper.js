angular.module('portainer.app').service('urlHelper', function urlHelper($window) {
  this.getParameter = getParameter;
  this.cleanParameters = cleanParameters;

  function getParameter(param) {
    var parameters = extractParameters();
    return parameters[param];
  }

  function extractParameters() {
    var queryString = $window.location.search.replace(/.*?\?/,'').split('&');
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
