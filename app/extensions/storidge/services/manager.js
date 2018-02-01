angular.module('extension.storidge')
.factory('StoridgeManager', ['$q', 'LocalStorage', 'SystemService', function StoridgeManagerFactory($q, LocalStorage, SystemService) {
  'use strict';
  var service = {
    API: ''
  };

  service.init = function() {
    var deferred = $q.defer();

    var storedAPIURL = LocalStorage.getStoridgeAPIURL();
    if (storedAPIURL) {
      service.API = storedAPIURL;
      deferred.resolve();
    } else {
      SystemService.info()
      .then(function success(data) {
        var endpointAddress = LocalStorage.getEndpointPublicURL();
        var storidgeAPIURL = '';
        if (endpointAddress) {
          storidgeAPIURL = 'http://' + endpointAddress + ':8282';
        } else {
          var managerIP = data.Swarm.NodeAddr;
          storidgeAPIURL = 'http://' + managerIP + ':8282';
        }

        service.API = storidgeAPIURL;
        LocalStorage.storeStoridgeAPIURL(storidgeAPIURL);
        deferred.resolve();
      })
      .catch(function error(err) {
        deferred.reject({ msg: 'Unable to retrieve Storidge API URL', err: err });
      });
    }

    return deferred.promise;
  };

  service.reset = function() {
    LocalStorage.clearStoridgeAPIURL();
  };

  service.StoridgeAPIURL = function() {
    return service.API;
  };

  return service;
}]);
