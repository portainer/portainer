// TODO: this is a deprecated extension management service and should be removed
angular.module('portainer.app')
.factory('LegacyExtensionService', ['LegacyExtensions', function LegacyExtensionServiceFactory(LegacyExtensions) {
  'use strict';
  var service = {};

  service.registerStoridgeExtension = function(url) {
    var payload = {
      Type: 1,
      URL: url
    };

    return LegacyExtensions.register(payload).$promise;
  };

  service.deregisterStoridgeExtension = function() {
    return LegacyExtensions.deregister({ type: 1 }).$promise;
  };

  return service;
}]);
