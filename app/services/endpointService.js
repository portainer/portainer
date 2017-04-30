angular.module('portainer.services')
.factory('EndpointService', ['$q', 'Endpoints', 'FileUploadService', function EndpointServiceFactory($q, Endpoints, FileUploadService) {
  'use strict';
  var service = {};

  service.endpoint = function(endpointID) {
    return Endpoints.get({id: endpointID}).$promise;
  };

  service.endpoints = function() {
    return Endpoints.query({}).$promise;
  };

  service.updateAuthorizedUsers = function(id, authorizedUserIDs) {
    return Endpoints.updateAccess({id: id}, {authorizedUsers: authorizedUserIDs}).$promise;
  };

  service.updateEndpoint = function(id, endpointParams) {
    var query = {
      name: endpointParams.name,
      URLPublish: endpointParams.URLPublish,
      TLS: endpointParams.TLS,
      authorizedUsers: endpointParams.authorizedUsers
    };
    if (endpointParams.type && endpointParams.URL) {
      query.URL = endpointParams.type === 'local' ? ("unix://" + endpointParams.URL) : ("tcp://" + endpointParams.URL);
    }

    var deferred = $q.defer();
    FileUploadService.uploadTLSFilesForEndpoint(id, endpointParams.TLSCACert, endpointParams.TLSCert, endpointParams.TLSKey)
    .then(function success() {
      deferred.notify({upload: false});
      return Endpoints.update({id: id}, query).$promise;
    })
    .then(function success(data) {
      deferred.resolve(data);
    })
    .catch(function error(err) {
      deferred.notify({upload: false});
      deferred.reject({msg: 'Unable to update endpoint', err: err});
    });
    return deferred.promise;
  };

  service.deleteEndpoint = function(endpointID) {
    return Endpoints.remove({id: endpointID}).$promise;
  };

  service.createLocalEndpoint = function(name, URL, TLS, active) {
    var endpoint = {
      Name: "local",
      URL: "unix:///var/run/docker.sock",
      TLS: false
    };
    return Endpoints.create({}, endpoint).$promise;
  };

  service.createRemoteEndpoint = function(name, URL, URLPublish, TLS, TLSCAFile, TLSCertFile, TLSKeyFile) {
    var endpoint = {
      Name: name,
      URL: 'tcp://' + URL,
      URLPublish: URLPublish,
      TLS: TLS
    };
    var deferred = $q.defer();
    Endpoints.create({}, endpoint).$promise
    .then(function success(data) {
      var endpointID = data.Id;
      if (TLS) {
        deferred.notify({upload: true});
        FileUploadService.uploadTLSFilesForEndpoint(endpointID, TLSCAFile, TLSCertFile, TLSKeyFile)
        .then(function success() {
          deferred.notify({upload: false});
          deferred.resolve(data);
        });
      } else {
        deferred.resolve(data);
      }
    })
    .catch(function error(err) {
      deferred.notify({upload: false});
      deferred.reject({msg: 'Unable to upload TLS certs', err: err});
    });
    return deferred.promise;
  };

  return service;
}]);
