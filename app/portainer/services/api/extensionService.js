angular.module('portainer.app')
.factory('ExtensionService', ['Extensions', function ExtensionServiceFactory(Extensions) {
  'use strict';
  var service = {};

  service.registerStoridgeExtension = function(endpointId, url) {
    var payload = {
      endpointId: endpointId,
      Type: 1,
      URL: url
    };

    return Extensions.register(payload).$promise;
  };

  return service;
}]);
