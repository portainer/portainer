angular.module('portainer.app')
.factory('EndpointService', ['$q', 'Endpoints', 'FileUploadService',
function EndpointServiceFactory($q, Endpoints, FileUploadService) {
  'use strict';
  var service = {};

  service.endpoint = function(endpointID) {
    return Endpoints.get({id: endpointID}).$promise;
  };

  service.endpoints = function() {
    return Endpoints.query({}).$promise;
  };

  service.endpointsByGroup = function(groupId) {
    var deferred = $q.defer();

    Endpoints.query({}).$promise
    .then(function success(data) {
      var endpoints = data.filter(function (endpoint) {
        return endpoint.GroupId === groupId;
      });
      deferred.resolve(endpoints);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve endpoints', err: err});
    });

    return deferred.promise;
  };

  service.updateAccess = function(id, authorizedUserIDs, authorizedTeamIDs) {
    return Endpoints.updateAccess({id: id}, {authorizedUsers: authorizedUserIDs, authorizedTeams: authorizedTeamIDs}).$promise;
  };

  service.updateEndpoint = function(id, endpointParams) {
    var query = {
      name: endpointParams.name,
      PublicURL: endpointParams.PublicURL,
      GroupId: endpointParams.GroupId,
      TLS: endpointParams.TLS,
      TLSSkipVerify: endpointParams.TLSSkipVerify,
      TLSSkipClientVerify: endpointParams.TLSSkipClientVerify,
      authorizedUsers: endpointParams.authorizedUsers
    };
    if (endpointParams.type && endpointParams.URL) {
      query.URL = endpointParams.type === 'local' ? ('unix://' + endpointParams.URL) : ('tcp://' + endpointParams.URL);
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

  service.createLocalEndpoint = function() {
    var deferred = $q.defer();

    FileUploadService.createEndpoint('local', 1, 'unix:///var/run/docker.sock', '', 1, false)
    .then(function success(response) {
      deferred.resolve(response.data);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to create endpoint', err: err});
    });

    return deferred.promise;
  };

  service.createRemoteEndpoint = function(name, type, URL, PublicURL, groupID, TLS, TLSSkipVerify, TLSSkipClientVerify, TLSCAFile, TLSCertFile, TLSKeyFile) {
    var deferred = $q.defer();

    FileUploadService.createEndpoint(name, type, 'tcp://' + URL, PublicURL, groupID, TLS, TLSSkipVerify, TLSSkipClientVerify, TLSCAFile, TLSCertFile, TLSKeyFile)
    .then(function success(response) {
      deferred.resolve(response.data);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to create endpoint', err: err});
    });

    return deferred.promise;
  };

  service.createAzureEndpoint = function(name, applicationId, tenantId, authenticationKey) {
    var deferred = $q.defer();

    FileUploadService.createAzureEndpoint(name, applicationId, tenantId, authenticationKey)
    .then(function success(response) {
      deferred.resolve(response.data);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to connect to Azure', err: err});
    });

    return deferred.promise;
  };

  return service;
}]);
