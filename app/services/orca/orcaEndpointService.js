angular.module('portainer.services')
.factory('OrcaEndpointService', ['$q', 'OrcaEndpoint', 'OrcaEndpointHelper', 'ResourceControlService', function OrcaEndpointServiceFactory($q, OrcaEndpoint, OrcaEndpointHelper, ResourceControlService) {
  'use strict';
  var endpoint = {};

  endpoint.endpoints = function(providerid) {
    var deferred = $q.defer();

    OrcaEndpoint.list({providerid: providerid}).$promise
    .then(function success(data) {
      var endpoints = data.map(function (item) {
        return new OrcaEndpointViewModel(item);
      });
      deferred.resolve(endpoints);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve endpoints for provider ' + providerid, err: err });
    });

    return deferred.promise;
  };

  endpoint.discover = function(providerid) {
    var deferred = $q.defer();

    OrcaEndpoint.discover({ providerid: providerid}).$promise
    .then(function success(data) {
      deferred.resolve(data);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to discover endpoints for provider ' + providerid, err: err });
    });

    return deferred.promise;
  };

  return endpoint;
}]);
