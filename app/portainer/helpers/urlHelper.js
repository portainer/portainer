angular.module('portainer.app').factory('URLHelper', [
  '$window',
  function URLHelperFactory($window) {
    'use strict';
    var helper = {};

    helper.getParameter = getParameter;
    helper.cleanParameters = cleanParameters;

    function getParameter(param) {
      var parameters = extractParameters();
      return parameters[param];
    }

    function extractParameters() {
      var queryString = $window.location.search.replace(/.*?\?/, '').split('&');
      return queryString.reduce(function (acc, keyValStr) {
        var keyVal = keyValStr.split('=');
        var key = keyVal[0];
        var val = keyVal[1];
        acc[key] = val;
        return acc;
      }, {});
    }

    function cleanParameters() {
      $window.location.replace($window.location.origin + $window.location.pathname + $window.location.hash);
    }

    return helper;
  },
]);
