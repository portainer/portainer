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
      TLS: endpointParams.TLS,
      authorizedUsers: endpointParams.authorizedUsers
    };
    if (endpointParams.type && endpointParams.URL) {
      query.URL = endpointParams.type === 'local' ? ("unix://" + endpointParams.URL) : ("tcp://" + endpointParams.URL);
    }
    var deferred = $q.defer();
    Endpoints.update({id: id}, query).$promise
    .then(function success() {
      return FileUploadService.uploadTLSFilesForEndpoint(id, endpointParams.TLSCAFile, endpointParams.TLSCertFile, endpointParams.TLSKeyFile);
    })
    .then(function success(data) {
      deferred.notify({upload: false});
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

  service.createRemote = function(name, URL, TLS, TLSCAFile, TLSCertFile, TLSKeyFile) {
    var endpoint = {
      Name: name,
      URL: 'tcp://' + URL,
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

  service.createRemoteEndpoint = function(name, URL, TLS, TLSCAFile, TLSCertFile, TLSKeyFile, active) {
    var endpoint = {
      Name: name,
      URL: 'tcp://' + URL,
      TLS: TLS
    };
    var deferred = $q.defer();
    Endpoints.create({}, endpoint, function success(data) {
      var endpointID = data.Id;
      if (TLS) {
        deferred.notify({upload: true});
        FileUploadService.uploadTLSFilesForEndpoint(endpointID, TLSCAFile, TLSCertFile, TLSKeyFile).then(function success(data) {
          deferred.notify({upload: false});
          if (active) {
            Endpoints.setActiveEndpoint({}, {id: endpointID}, function success(data) {
              deferred.resolve(data);
            }, function error(err) {
              deferred.reject({msg: 'Unable to create endpoint', err: err});
            });
          } else {
            deferred.resolve(data);
          }
        }, function error(err) {
          deferred.notify({upload: false});
          deferred.reject({msg: 'Unable to upload TLS certs', err: err});
        });
      } else {
        deferred.resolve(data);
      }
    }, function error(err) {
      deferred.reject({msg: 'Unable to create endpoint', err: err});
    });
    return deferred.promise;
  };

  return service;
}]);
