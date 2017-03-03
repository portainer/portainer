angular.module('portainer.services')
.factory('EndpointService', ['$q', 'Endpoints', 'FileUploadService', function EndpointServiceFactory($q, Endpoints, FileUploadService) {
  'use strict';
  return {
    getActive: function() {
      return Endpoints.getActiveEndpoint().$promise;
    },
    setActive: function(endpointID) {
      return Endpoints.setActiveEndpoint({id: endpointID}).$promise;
    },
    endpoint: function(endpointID) {
      return Endpoints.get({id: endpointID}).$promise;
    },
    endpoints: function() {
      return Endpoints.query({}).$promise;
    },
    updateEndpoint: function(ID, name, URL, TLS, TLSCAFile, TLSCertFile, TLSKeyFile, type) {
      var endpoint = {
        id: ID,
        Name: name,
        URL: type === 'local' ? ("unix://" + URL) : ("tcp://" + URL),
        TLS: TLS
      };
      var deferred = $q.defer();
      Endpoints.update({}, endpoint, function success(data) {
        FileUploadService.uploadTLSFilesForEndpoint(ID, TLSCAFile, TLSCertFile, TLSKeyFile).then(function success(data) {
          deferred.notify({upload: false});
          deferred.resolve(data);
        }, function error(err) {
          deferred.notify({upload: false});
          deferred.reject({msg: 'Unable to upload TLS certs', err: err});
        });
      }, function error(err) {
        deferred.reject({msg: 'Unable to update endpoint', err: err});
      });
      return deferred.promise;
    },
    deleteEndpoint: function(endpointID) {
      return Endpoints.remove({id: endpointID}).$promise;
    },
    createLocalEndpoint: function(name, URL, TLS, active) {
      var endpoint = {
        Name: "local",
        URL: "unix:///var/run/docker.sock",
        TLS: false
      };
      return Endpoints.create({active: active}, endpoint).$promise;
    },
    createRemoteEndpoint: function(name, URL, TLS, TLSCAFile, TLSCertFile, TLSKeyFile, active) {
      var endpoint = {
        Name: name,
        URL: 'tcp://' + URL,
        TLS: TLS
      };
      var deferred = $q.defer();
      Endpoints.create({active: active}, endpoint, function success(data) {
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
    }
  };
}]);
