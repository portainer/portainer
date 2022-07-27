import { PortainerEndpointCreationTypes } from 'Portainer/models/endpoint/models';

angular.module('portainer.app').factory('EndpointService', [
  '$q',
  'Endpoints',
  'FileUploadService',
  function EndpointServiceFactory($q, Endpoints, FileUploadService) {
    'use strict';
    var service = {
      updateSecuritySettings,
      registries,
      updateRegistryAccess,
    };

    service.endpoint = function (endpointID) {
      return Endpoints.get({ id: endpointID }).$promise;
    };

    service.snapshotEndpoints = function () {
      return Endpoints.snapshots({}, {}).$promise;
    };

    service.snapshotEndpoint = function (endpointID) {
      return Endpoints.snapshot({ id: endpointID }, {}).$promise;
    };

    service.updateAccess = function (id, userAccessPolicies, teamAccessPolicies) {
      return Endpoints.updateAccess({ id: id }, { UserAccessPolicies: userAccessPolicies, TeamAccessPolicies: teamAccessPolicies }).$promise;
    };

    service.disassociateEndpoint = function (endpointID) {
      return Endpoints.disassociate({ id: endpointID }).$promise;
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
          deferred.reject({ msg: 'Unable to update environment', err: err });
        });
      return deferred.promise;
    };

    service.deleteEndpoint = function (endpointID) {
      return Endpoints.remove({ id: endpointID }).$promise;
    };

    service.createLocalEndpoint = function (name = 'local', URL = '', PublicURL = '', groupID = 1, tagIds = []) {
      var deferred = $q.defer();

      var endpointURL = URL;
      if (endpointURL !== '') {
        if (endpointURL.indexOf('//./pipe/') == 0) {
          // Windows named pipe
          endpointURL = 'npipe://' + URL;
        } else {
          endpointURL = 'unix://' + URL;
        }
      }

      FileUploadService.createEndpoint(name, PortainerEndpointCreationTypes.LocalDockerEnvironment, endpointURL, PublicURL, groupID, tagIds, false)
        .then(function success(response) {
          deferred.resolve(response.data);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to create environment', err: err });
        });

      return deferred.promise;
    };

    service.createRemoteEndpoint = function (
      name,
      creationType,
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
      checkinInterval,
      isEdgeDevice
    ) {
      var deferred = $q.defer();

      var endpointURL = URL;
      if (creationType !== PortainerEndpointCreationTypes.EdgeAgentEnvironment) {
        endpointURL = 'tcp://' + URL;
      }

      FileUploadService.createEndpoint(
        name,
        creationType,
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
        checkinInterval,
        isEdgeDevice
      )
        .then(function success(response) {
          deferred.resolve(response.data);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to create environment', err: err });
        });

      return deferred.promise;
    };

    service.createLocalKubernetesEndpoint = function (name = 'local', tagIds = []) {
      var deferred = $q.defer();

      FileUploadService.createEndpoint(name, PortainerEndpointCreationTypes.LocalKubernetesEnvironment, '', '', 1, tagIds, true, true, true)
        .then(function success(response) {
          deferred.resolve(response.data);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to create environment', err: err });
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

    service.trust = function (id) {
      Endpoints.updateEndpoint({ id }, { UserTrusted: true }).$promise;
    };

    function updateRegistryAccess(id, registryId, endpointAccesses) {
      return Endpoints.updateRegistryAccess({ registryId, id }, endpointAccesses).$promise;
    }

    function registries(id, namespace) {
      return Endpoints.registries({ namespace, id }).$promise;
    }

    return service;

    function updateSecuritySettings(id, securitySettings) {
      return Endpoints.updateSecuritySettings({ id }, securitySettings).$promise;
    }
  },
]);
