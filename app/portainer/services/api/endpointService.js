import { PortainerEndpointTypes } from 'Portainer/models/endpoint/models';

angular.module('portainer.app').factory('EndpointService', [
  '$q',
  'Endpoints',
  'FileUploadService',
  function EndpointServiceFactory($q, Endpoints, FileUploadService) {
    'use strict';
    var service = {};

    service.endpoint = function (endpointID) {
      return Endpoints.get({ id: endpointID }).$promise;
    };

    service.endpoints = function (start, limit, { search, type, tagIds, endpointIds, tagsPartialMatch } = {}) {
      if (tagIds && !tagIds.length) {
        return Promise.resolve({ value: [], totalCount: 0 });
      }
      return Endpoints.query({ start, limit, search, type, tagIds: JSON.stringify(tagIds), endpointIds: JSON.stringify(endpointIds), tagsPartialMatch }).$promise;
    };

    service.snapshotEndpoints = function () {
      return Endpoints.snapshots({}, {}).$promise;
    };

    service.snapshotEndpoint = function (endpointID) {
      return Endpoints.snapshot({ id: endpointID }, {}).$promise;
    };

    service.endpointsByGroup = function (start, limit, search, groupId) {
      return Endpoints.query({ start, limit, search, groupId }).$promise;
    };

    service.updateAccess = function (id, userAccessPolicies, teamAccessPolicies) {
      return Endpoints.updateAccess({ id: id }, { UserAccessPolicies: userAccessPolicies, TeamAccessPolicies: teamAccessPolicies }).$promise;
    };

    service.updateEndpoint = function (id, payload) {
      var deferred = $q.defer();
      FileUploadService.uploadTLSFilesForEndpoint(id, payload.TLSCACert, payload.TLSCert, payload.TLSKey)
        .then(function success() {
          deferred.notify({ upload: false });
          return Endpoints.update({ id: id }, payload).$promise;
        })
        .then(function success(data) {
          deferred.resolve(data);
        })
        .catch(function error(err) {
          deferred.notify({ upload: false });
          deferred.reject({ msg: 'Unable to update endpoint', err: err });
        });
      return deferred.promise;
    };

    service.deleteEndpoint = function (endpointID) {
      return Endpoints.remove({ id: endpointID }).$promise;
    };

    service.createLocalEndpoint = function () {
      var deferred = $q.defer();

      FileUploadService.createEndpoint('local', PortainerEndpointTypes.DockerEnvironment, '', '', 1, [], false)
        .then(function success(response) {
          deferred.resolve(response.data);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to create endpoint', err: err });
        });

      return deferred.promise;
    };

    service.createRemoteEndpoint = function (
      name,
      type,
      URL,
      PublicURL,
      groupID,
      tagIds,
      TLS,
      TLSSkipVerify,
      TLSSkipClientVerify,
      TLSCAFile,
      TLSCertFile,
      TLSKeyFile,
      checkinInterval
    ) {
      var deferred = $q.defer();

      var endpointURL = URL;
      if (
        type !== PortainerEndpointTypes.EdgeAgentOnDockerEnvironment &&
        type !== PortainerEndpointTypes.AgentOnKubernetesEnvironment &&
        type !== PortainerEndpointTypes.EdgeAgentOnKubernetesEnvironment
      ) {
        endpointURL = 'tcp://' + URL;
      }

      FileUploadService.createEndpoint(
        name,
        type,
        endpointURL,
        PublicURL,
        groupID,
        tagIds,
        TLS,
        TLSSkipVerify,
        TLSSkipClientVerify,
        TLSCAFile,
        TLSCertFile,
        TLSKeyFile,
        checkinInterval
      )
        .then(function success(response) {
          deferred.resolve(response.data);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to create endpoint', err: err });
        });

      return deferred.promise;
    };

    service.createLocalKubernetesEndpoint = function () {
      var deferred = $q.defer();

      FileUploadService.createEndpoint('local', 5, '', '', 1, [], true, true, true)
        .then(function success(response) {
          deferred.resolve(response.data);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to create endpoint', err: err });
        });

      return deferred.promise;
    };

    service.createAzureEndpoint = function (name, applicationId, tenantId, authenticationKey, groupId, tagIds) {
      var deferred = $q.defer();

      FileUploadService.createAzureEndpoint(name, applicationId, tenantId, authenticationKey, groupId, tagIds)
        .then(function success(response) {
          deferred.resolve(response.data);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to connect to Azure', err: err });
        });

      return deferred.promise;
    };

    return service;
  },
]);
