angular.module('portainer.app')
.factory('ExtensionService', ['Extensions', function ExtensionServiceFactory(Extensions) {
  'use strict';
  var service = {};

  service.registerStoridgeExtension = function(url) {
    var payload = {
      Type: 1,
      URL: url
    };

    return Extensions.register(payload).$promise;
  };

  service.deregisterStoridgeExtension = function() {
    return Extensions.deregister({ type: 1 }).$promise;
  };

  return service;
}]);
